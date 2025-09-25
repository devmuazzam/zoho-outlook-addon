import axios from 'axios';
import { zohoAuthService } from './zohoAuth';
import { ZOHO_CONFIG } from '../config/zoho';
import prisma from '../lib/prisma';

export interface ZohoRoleUser {
  name: string;
  id: string;
}

export interface ZohoRoleReportingTo {
  name: string;
  id: string;
}

export interface ZohoRole {
  id: string;
  name: string;
  display_label: string;
  description?: string;
  share_with_peers: boolean;
  forecast_manager?: string | null;
  reporting_to?: ZohoRoleReportingTo | null;
  created_by__s?: ZohoRoleUser;
  modified_by__s?: ZohoRoleUser;
  created_time__s: string | null;
  modified_time__s: string | null;
}

export interface ZohoRolesResponse {
  roles: ZohoRole[];
}

export class ZohoRoleService {
  /**
   * Fetch all roles from Zoho CRM
   */
  async fetchRolesFromZoho(): Promise<ZohoRole[]> {
    try {
      console.log('🔄 Fetching roles from Zoho CRM...');
      
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      const response = await axios.get(
        `${ZOHO_CONFIG.API_BASE_URL}/settings/roles`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data?.roles) {
        throw new Error('No roles data received from Zoho');
      }

      console.log(`✅ Fetched ${response.data.roles.length} roles from Zoho CRM`);
      console.log('🔍 Sample role data:', JSON.stringify(response.data.roles[0], null, 2));
      
      return response.data.roles;
      
    } catch (error: any) {
      console.error('❌ Failed to fetch roles from Zoho:', error.response?.data || error.message);
      throw new Error(`Failed to fetch roles: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Sync roles from Zoho to database
   */
  async syncRolesToDatabase(organizationId: string): Promise<{
    synced: number;
    errors: string[];
  }> {
    try {
      console.log('🔄 Starting roles sync to database...');
      
      const zohoRoles = await this.fetchRolesFromZoho();
      let syncedCount = 0;
      const errors: string[] = [];

      for (const zohoRole of zohoRoles) {
        try {
          await this.syncSingleRole(zohoRole, organizationId);
          syncedCount++;
          console.log(`✅ Synced role: ${zohoRole.display_label}`);
        } catch (error: any) {
          const errorMsg = `Failed to sync role ${zohoRole.display_label}: ${error.message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`🎉 Roles sync completed: ${syncedCount} synced, ${errors.length} errors`);
      
      return {
        synced: syncedCount,
        errors
      };
      
    } catch (error: any) {
      console.error('❌ Roles sync failed:', error.message);
      throw error;
    }
  }

  /**
   * Sync a single role to database
   */
  private async syncSingleRole(zohoRole: ZohoRole, organizationId: string): Promise<void> {
    try {
      console.log(`🔍 Syncing role ${zohoRole.display_label}:`, {
        id: zohoRole.id,
        name: zohoRole.name,
        shareWithPeers: zohoRole.share_with_peers,
        reportingTo: zohoRole.reporting_to?.name || 'None'
      });

      // Prepare the role data
      const roleData = {
        zohoRoleId: zohoRole.id,
        name: zohoRole.name,
        displayLabel: zohoRole.display_label,
        description: zohoRole.description || null,
        shareWithPeers: zohoRole.share_with_peers,
        forecastManager: zohoRole.forecast_manager || null,
        reportingToId: zohoRole.reporting_to?.id || null,
        reportingToName: zohoRole.reporting_to?.name || null,
        createdById: zohoRole.created_by__s?.id || null,
        createdByName: zohoRole.created_by__s?.name || null,
        modifiedById: zohoRole.modified_by__s?.id || null,
        modifiedByName: zohoRole.modified_by__s?.name || null,
        organizationId: organizationId
      };

      // Add optional timestamp fields if they exist
      const createData = {
        ...roleData,
        ...(zohoRole.created_time__s && { createdTime: new Date(zohoRole.created_time__s) }),
        ...(zohoRole.modified_time__s && { modifiedTime: new Date(zohoRole.modified_time__s) })
      };

      const updateData = {
        name: roleData.name,
        displayLabel: roleData.displayLabel,
        description: roleData.description,
        shareWithPeers: roleData.shareWithPeers,
        forecastManager: roleData.forecastManager,
        reportingToId: roleData.reportingToId,
        reportingToName: roleData.reportingToName,
        createdById: roleData.createdById,
        createdByName: roleData.createdByName,
        modifiedById: roleData.modifiedById,
        modifiedByName: roleData.modifiedByName,
        ...(zohoRole.created_time__s && { createdTime: new Date(zohoRole.created_time__s) }),
        ...(zohoRole.modified_time__s && { modifiedTime: new Date(zohoRole.modified_time__s) }),
        updatedAt: new Date()
      };

      // Create or update the role
      const dbRole = await prisma.zohoRole.upsert({
        where: { zohoRoleId: zohoRole.id },
        update: updateData,
        create: createData
      });

      console.log(`✅ Successfully synced role ${zohoRole.display_label} to database`);
      
    } catch (error: any) {
      console.error(`❌ Failed to sync role ${zohoRole.display_label}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all roles for an organization from database
   */
  async getRolesForOrganization(organizationId: string): Promise<any[]> {
    try {
      const roles = await prisma.zohoRole.findMany({
        where: { 
          organizationId,
          isActive: true 
        },
        orderBy: {
          displayLabel: 'asc'
        }
      });

      return roles;
      
    } catch (error: any) {
      console.error('❌ Failed to get roles from database:', error.message);
      throw error;
    }
  }

  /**
   * Get role by Zoho role ID
   */
  async getRoleByZohoId(zohoRoleId: string): Promise<any | null> {
    try {
      const role = await prisma.zohoRole.findUnique({
        where: { zohoRoleId },
        include: {
          organization: true
        }
      });

      return role;
      
    } catch (error: any) {
      console.error('❌ Failed to get role by Zoho ID:', error.message);
      throw error;
    }
  }

  /**
   * Trigger role sync for an organization (usually called after admin login)
   */
  async triggerRoleSync(organizationId: string): Promise<void> {
    try {
      console.log('🔄 Triggering role sync for organization...');
      
      // Check if we've already done a role sync recently
      const lastSyncSetting = await prisma.appSetting.findUnique({
        where: { key: `last_role_sync_${organizationId}` }
      });

      // If we already have a sync within the last 24 hours, skip
      if (lastSyncSetting) {
        const lastSyncTime = new Date(lastSyncSetting.value);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        if (lastSyncTime > oneDayAgo) {
          console.log('⏭️ Skipping role sync - already completed within 24 hours');
          return;
        }
      }

      // Update the sync timestamp before starting
      await prisma.appSetting.upsert({
        where: { key: `last_role_sync_${organizationId}` },
        update: { 
          value: new Date().toISOString(),
          updatedAt: new Date()
        },
        create: { 
          key: `last_role_sync_${organizationId}`,
          value: new Date().toISOString(),
          category: 'sync'
        }
      });

      // Run the role sync in background
      this.syncRolesToDatabase(organizationId)
        .then(result => {
          console.log(`✅ Role sync completed: ${result.synced} roles synced`);
          if (result.errors.length > 0) {
            console.warn(`⚠️ ${result.errors.length} errors during role sync`);
          }
        })
        .catch(error => {
          console.error('❌ Background role sync failed:', error.message);
        });

      console.log('🚀 Role sync started in background');
      
    } catch (error: any) {
      console.error('❌ Failed to trigger role sync:', error.message);
    }
  }
}

// Export singleton instance
export const zohoRoleService = new ZohoRoleService();