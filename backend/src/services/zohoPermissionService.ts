import prisma from '../lib/prisma';

/**
 * Zoho Permission Service
 * 
 * This service mimics Zoho CRM's permission behavior to determine which users
 * can access/view a given module record based on:
 * 1. Organization default sharing rules (private/public)
 * 2. User profile permissions for the module
 * 3. Role hierarchy for private modules
 */

export interface PermissionCheckRequest {
  moduleName: 'Contacts'; // Only Contacts supported for now
  recordId: string; // The ID of the record (local database ID or Zoho ID)
}

export interface PermissionCheckResponse {
  userIds: string[]; // Array of Zoho user IDs who can access the record
  accessType: 'private' | 'public' | 'public_read_only';
  hierarchyUsed: boolean; // Whether role hierarchy was used for access calculation
}

export interface RoleHierarchy {
  roleId: string;
  displayLabel: string;
  reportingToId: string | null;
  level: number; // 0 is top level, higher numbers are lower in hierarchy
  childRoles: string[]; // Direct subordinate role IDs
}

export class ZohoPermissionService {
  /**
   * Main method to check permissions for a module record
   */
  async checkModulePermissions(request: PermissionCheckRequest): Promise<PermissionCheckResponse> {
    const { moduleName, recordId } = request;
    
    console.log(`🔍 Checking permissions for module "${moduleName}" with record ID: ${recordId}`);
    
    // Step 1: Query the record from database based on module type
    const record = await this.getRecordFromDatabase(moduleName, recordId);
    
    if (!record) {
      throw new Error(`Record not found: ${moduleName} with ID ${recordId}`);
    }
    
    // Step 2: Extract owner and organization info from the record
    const { ownerId, organizationId } = await this.extractRecordInfo(record, moduleName);
    
    console.log(`🔍 Checking permissions for module "${moduleName}" - Owner: ${ownerId}, Org: ${organizationId}`);
    
    if (!organizationId) {
      throw new Error('Could not determine organization from record');
    }
    
    // Step 1: Get organization default sharing rules
    const orgSharingRule = await this.getOrgSharingRuleForModule(organizationId, moduleName);
    
    if (!orgSharingRule) {
      throw new Error(`No sharing rule found for module "${moduleName}" in organization`);
    }
    
    const shareType = (orgSharingRule.ruleData as any)?.share_type;
    console.log(`📋 Organization sharing rule for "${moduleName}": ${shareType}`);
    
    // Step 2: Handle based on sharing rule type
    if (shareType === 'public' || shareType === 'public_read_only') {
      return await this.handlePublicAccess(organizationId, moduleName, shareType);
    } else if (shareType === 'private') {
      return await this.handlePrivateAccess(organizationId, moduleName, ownerId);
    } else {
      throw new Error(`Unsupported share type: ${shareType}`);
    }
  }
  
  /**
   * Handle public access - all users with module permission can access
   */
  private async handlePublicAccess(
    organizationId: string, 
    moduleName: string, 
    shareType: string
  ): Promise<PermissionCheckResponse> {
    console.log(`🌐 Handling public access for module "${moduleName}"`);
    
    // Get all users in the organization who have access to this module
    const usersWithAccess = await this.getUsersWithModuleAccess(organizationId, moduleName);
    
    return {
      userIds: usersWithAccess,
      accessType: shareType as 'public' | 'public_read_only',
      hierarchyUsed: false
    };
  }
  
  /**
   * Handle private access - only owner and users in higher role hierarchy can access
   */
  private async handlePrivateAccess(
    organizationId: string, 
    moduleName: string, 
    recordOwnerId?: string
  ): Promise<PermissionCheckResponse> {
    console.log(`🔒 Handling private access for module "${moduleName}"`);
    
    if (!recordOwnerId) {
      console.warn('⚠️ No record owner provided for private module - returning empty access');
      return {
        userIds: [],
        accessType: 'private',
        hierarchyUsed: false
      };
    }
    
    // Step 1: Get the owner user and check if they have module access
    const ownerUser = await this.getUserByZohoId(recordOwnerId);
    if (!ownerUser) {
      console.warn(`⚠️ Owner user not found: ${recordOwnerId}`);
      return {
        userIds: [],
        accessType: 'private',
        hierarchyUsed: false
      };
    }
    
    // Step 2: Check if owner has module permission
    const ownerHasAccess = await this.userHasModuleAccess(ownerUser.id, moduleName);
    if (!ownerHasAccess) {
      console.warn(`⚠️ Owner ${recordOwnerId} does not have access to module "${moduleName}"`);
      return {
        userIds: [],
        accessType: 'private',
        hierarchyUsed: false
      };
    }
    
    // Step 3: Get owner's role and build hierarchy
    const ownerRole = await this.getUserRole(ownerUser.id);
    if (!ownerRole) {
      console.warn(`⚠️ Owner ${recordOwnerId} has no role assigned`);
      return {
        userIds: [recordOwnerId], // Only owner can access
        accessType: 'private',
        hierarchyUsed: false
      };
    }
    
    // Step 4: Build role hierarchy and get all users in higher hierarchy
    const roleHierarchy = await this.buildRoleHierarchy(organizationId);
    const accessibleUserIds = await this.getUsersInRoleHierarchy(
      organizationId, 
      ownerRole.zohoRoleId, 
      roleHierarchy,
      moduleName
    );
    
    // Always include the owner
    const allAccessibleUsers = Array.from(new Set([recordOwnerId, ...accessibleUserIds]));
    
    return {
      userIds: allAccessibleUsers,
      accessType: 'private',
      hierarchyUsed: true
    };
  }
  
  /**
   * Get record from database based on module type and record ID
   */
  private async getRecordFromDatabase(moduleName: string, recordId: string): Promise<any> {
    switch (moduleName) {
      case 'Contacts':
        // Try to find by local ID first, then by Zoho ID
        let contact = await prisma.contact.findUnique({
          where: { id: recordId },
          include: {
            user: {
              select: {
                id: true,
                zohoUserId: true,
                organizationId: true
              }
            }
          }
        });
        
        // If not found by local ID, try Zoho ID
        if (!contact) {
          contact = await prisma.contact.findUnique({
            where: { zohoId: recordId },
            include: {
              user: {
                select: {
                  id: true,
                  zohoUserId: true,
                  organizationId: true
                }
              }
            }
          });
        }
        
        return contact;
        
      default:
        throw new Error(`Unsupported module type: ${moduleName}`);
    }
  }
  
  /**
   * Extract record owner and organization info from the record
   */
  private async extractRecordInfo(record: any, moduleName: string): Promise<{ ownerId?: string; organizationId?: string }> {
    // Try to get owner ID from various possible fields
    let ownerId = record.ownerId || record.ownerZohoId;
    let organizationId = record.user?.organizationId;
    
    // If we have a local userId, look up the user to get Zoho info
    if (!ownerId && record.userId) {
      const user = await prisma.user.findUnique({
        where: { id: record.userId },
        select: {
          zohoUserId: true,
          organizationId: true
        }
      });
      
      if (user) {
        ownerId = user.zohoUserId || undefined;
        organizationId = organizationId || user.organizationId || undefined;
      }
    }
    
    // If we have a contact record with zohoId, try to find it in our database
    if (!ownerId && record.zohoId) {
      const contact = await prisma.contact.findUnique({
        where: { zohoId: record.zohoId },
        include: {
          user: {
            select: {
              zohoUserId: true,
              organizationId: true
            }
          }
        }
      });
      
      if (contact?.user) {
        ownerId = contact.user.zohoUserId || undefined;
        organizationId = organizationId || contact.user.organizationId || undefined;
      }
    }
    
    return { ownerId, organizationId };
  }
  
  /**
   * Get organization sharing rule for specific module
   */
  private async getOrgSharingRuleForModule(organizationId: string, moduleName: string) {
    const rules = await prisma.zohoDataSharingRule.findMany({
      where: {
        organizationId,
        isActive: true
      }
    });
    
    // Find rule for the specific module
    const moduleRule = rules.find(rule => {
      const ruleData = rule.ruleData as any;
      return ruleData?.module?.api_name === moduleName;
    });
    
    return moduleRule;
  }
  
  /**
   * Get all users who have access to a specific module (for public access)
   */
  private async getUsersWithModuleAccess(organizationId: string, moduleName: string): Promise<string[]> {
    // Get all users in the organization
    const users = await prisma.user.findMany({
      where: {
        organizationId,
        isActive: true,
        zohoUserId: { not: null }
      }
    });
    
    const usersWithAccess: string[] = [];
    
    // Check each user's profile permissions
    for (const user of users) {
      const hasAccess = await this.userHasModuleAccess(user.id, moduleName);
      if (hasAccess && user.zohoUserId) {
        usersWithAccess.push(user.zohoUserId);
      }
    }
    
    return usersWithAccess;
  }
  
  /**
   * Check if a user has access to a specific module based on their profile permissions
   */
  private async userHasModuleAccess(userId: string, moduleName: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        zohoProfile: {
          include: {
            permissions: true
          }
        }
      }
    });
    
    if (!user?.zohoProfile) {
      console.warn(`⚠️ User ${userId} has no Zoho profile assigned`);
      return false;
    }
    
    // Check if user's profile has permissions for this module
    const hasModulePermission = user.zohoProfile.permissions.some(perm => 
      perm.module === moduleName && perm.enabled
    );
    
    if (hasModulePermission) {
      console.log(`✅ User ${userId} has access to module "${moduleName}" via profile ${user.zohoProfile.displayLabel}`);
      return true;
    }
    
    console.log(`❌ User ${userId} does not have access to module "${moduleName}"`);
    return false;
  }
  
  /**
   * Get user by Zoho user ID
   */
  private async getUserByZohoId(zohoUserId: string) {
    return await prisma.user.findUnique({
      where: { zohoUserId }
    });
  }
  
  /**
   * Get user's assigned role
   */
  private async getUserRole(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        zohoRole: true
      }
    });
    
    return user?.zohoRole || null;
  }
  
  /**
   * Build role hierarchy for an organization
   */
  private async buildRoleHierarchy(organizationId: string): Promise<Map<string, RoleHierarchy>> {
    const roles = await prisma.zohoRole.findMany({
      where: {
        organizationId,
        isActive: true
      }
    });
    
    const hierarchyMap = new Map<string, RoleHierarchy>();
    
    // First pass: Create basic hierarchy objects
    for (const role of roles) {
      hierarchyMap.set(role.zohoRoleId, {
        roleId: role.zohoRoleId,
        displayLabel: role.displayLabel,
        reportingToId: role.reportingToId,
        level: 0, // Will be calculated in second pass
        childRoles: []
      });
    }
    
    // Second pass: Build parent-child relationships and calculate levels
    for (const [roleId, roleHierarchy] of Array.from(hierarchyMap.entries())) {
      if (roleHierarchy.reportingToId) {
        const parentRole = hierarchyMap.get(roleHierarchy.reportingToId);
        if (parentRole) {
          parentRole.childRoles.push(roleId);
        }
      }
    }
    
    // Third pass: Calculate levels (breadth-first traversal)
    const visited = new Set<string>();
    const queue: { roleId: string; level: number }[] = [];
    
    // Start with roles that have no parent (top-level roles)
    for (const [roleId, roleHierarchy] of Array.from(hierarchyMap.entries())) {
      if (!roleHierarchy.reportingToId) {
        queue.push({ roleId, level: 0 });
      }
    }
    
    while (queue.length > 0) {
      const { roleId, level } = queue.shift()!;
      
      if (visited.has(roleId)) continue;
      visited.add(roleId);
      
      const roleHierarchy = hierarchyMap.get(roleId)!;
      roleHierarchy.level = level;
      
      // Add child roles to queue
      for (const childRoleId of roleHierarchy.childRoles) {
        if (!visited.has(childRoleId)) {
          queue.push({ roleId: childRoleId, level: level + 1 });
        }
      }
    }
    
    return hierarchyMap;
  }
  
  /**
   * Get all users in role hierarchy who are at the same level or higher than the given role
   */
  private async getUsersInRoleHierarchy(
    organizationId: string,
    baseRoleId: string,
    roleHierarchy: Map<string, RoleHierarchy>,
    moduleName: string
  ): Promise<string[]> {
    const baseRole = roleHierarchy.get(baseRoleId);
    if (!baseRole) {
      return [];
    }
    
    const accessibleUserIds: string[] = [];
    
    // Get all roles at the same level or higher (lower level number)
    const accessibleRoleIds: string[] = [];
    
    for (const [roleId, roleInfo] of Array.from(roleHierarchy.entries())) {
      if (roleInfo.level <= baseRole.level) {
        accessibleRoleIds.push(roleId);
      }
    }
    
    // Get all users assigned to these roles who also have module access
    for (const roleId of accessibleRoleIds) {
      const usersInRole = await this.getUsersInRole(organizationId, roleId, moduleName);
      accessibleUserIds.push(...usersInRole);
    }
    
    return accessibleUserIds;
  }
  
  /**
   * Get users assigned to a specific role who have module access
   */
  private async getUsersInRole(organizationId: string, roleId: string, moduleName: string): Promise<string[]> {
    const users = await prisma.user.findMany({
      where: {
        organizationId,
        zohoRoleId: roleId,
        isActive: true,
        zohoUserId: { not: null }
      },
      include: {
        zohoProfile: {
          include: {
            permissions: true
          }
        }
      }
    });
    
    const usersWithAccess: string[] = [];
    
    for (const user of users) {
      // Check if user has module access via their profile
      if (user.zohoProfile) {
        const hasModulePermission = user.zohoProfile.permissions.some(perm => 
          perm.module === moduleName && perm.enabled
        );
        
        if (hasModulePermission && user.zohoUserId) {
          usersWithAccess.push(user.zohoUserId);
        }
      }
    }
    
    return usersWithAccess;
  }
  
  /**
   * Get all users and their assigned roles for an organization
   * This method should be called to populate user-role relationships
   */
  async syncUserRoleAssignments(organizationId: string): Promise<void> {
    // This method would fetch user-role assignments from Zoho CRM
    // and update our local database accordingly
    
    console.log(`🔄 Syncing user-role assignments for organization ${organizationId}`);
    
    // TODO: Implement Zoho CRM API call to get user-role assignments
    // Example API endpoint: /settings/users (includes role information)
    
    console.log('⚠️ User-role assignment sync not yet implemented');
  }
  
  /**
   * Utility method to get permission summary for debugging
   */
  async getPermissionSummary(organizationId: string, moduleName: string): Promise<any> {
    const orgRule = await this.getOrgSharingRuleForModule(organizationId, moduleName);
    const profiles = await prisma.zohoProfile.findMany({
      where: { organizationId },
      include: {
        permissions: {
          where: { module: moduleName }
        }
      }
    });
    
    const roles = await this.buildRoleHierarchy(organizationId);
    
    return {
      organizationId,
      moduleName,
      orgSharingRule: orgRule?.ruleData,
      profilesWithModuleAccess: profiles.filter(p => 
        p.permissions.some(perm => perm.enabled)
      ).map(p => ({
        id: p.id,
        displayLabel: p.displayLabel,
        permissions: p.permissions
      })),
      roleHierarchy: Array.from(roles.values())
    };
  }
}

// Export singleton instance
export const zohoPermissionService = new ZohoPermissionService();