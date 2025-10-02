import axios from 'axios';
import { zohoAuthService } from './zohoAuth';
import { ZOHO_CONFIG } from '../config/zoho';
import prisma from '../lib/prisma';

export interface ZohoUser {
  id: string;
  full_name: string;
  email: string;
  status: string;
  role: {
    id: string;
    name: string;
  };
  profile: {
    id: string;
    name: string;
  };
  reporting_to?: {
    id: string;
    name: string;
  };
  created_time: string;
  modified_time: string;
}

export interface ZohoUsersResponse {
  users: ZohoUser[];
  info: {
    count: number;
    page: number;
    per_page: number;
    more_records: boolean;
  };
}

export class ZohoUserSyncService {
  /**
   * Fetch all users from Zoho CRM
   */
  async fetchUsersFromZoho(): Promise<ZohoUser[]> {
    try {
      console.log('🔄 Fetching users from Zoho CRM...');
      
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      const users: ZohoUser[] = [];
      let page = 1;
      let hasMoreRecords = true;
      
      while (hasMoreRecords) {
        const response = await axios.get(
          `${ZOHO_CONFIG.API_BASE_URL}/settings/users`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              page,
              per_page: 200
            }
          }
        );

        if (!response.data?.users) {
          break;
        }

        users.push(...response.data.users);
        hasMoreRecords = response.data.info?.more_records || false;
        page++;
      }

      console.log(`✅ Fetched ${users.length} users from Zoho CRM`);
      return users;
      
    } catch (error: any) {
      console.error('❌ Failed to fetch users from Zoho:', error.response?.data || error.message);
      throw new Error(`Failed to fetch users: ${error.response?.data?.message || error.message}`);
    }
  }
  
  /**
   * Sync users and their profile/role assignments from Zoho to database
   */
  async syncUsersToDatabase(organizationId: string): Promise<{
    synced: number;
    errors: string[];
  }> {
    try {
      console.log('🔄 Starting user sync to database...');
      
      const zohoUsers = await this.fetchUsersFromZoho();
      let syncedCount = 0;
      const errors: string[] = [];

      for (const zohoUser of zohoUsers) {
        try {
          await this.syncSingleUser(zohoUser, organizationId);
          syncedCount++;
          console.log(`✅ Synced user: ${zohoUser.full_name} (${zohoUser.email})`);
        } catch (error: any) {
          const errorMsg = `Failed to sync user ${zohoUser.email}: ${error.message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`🎉 User sync completed: ${syncedCount} users synced, ${errors.length} errors`);
      
      return {
        synced: syncedCount,
        errors
      };
      
    } catch (error: any) {
      console.error('❌ User sync failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Sync a single user to database
   */
  private async syncSingleUser(zohoUser: ZohoUser, organizationId: string): Promise<void> {
    try {
      console.log(`🔍 Syncing user ${zohoUser.full_name}:`, {
        id: zohoUser.id,
        email: zohoUser.email,
        status: zohoUser.status,
        profileId: zohoUser.profile?.id,
        profileName: zohoUser.profile?.name,
        roleId: zohoUser.role?.id,
        roleName: zohoUser.role?.name
      });

      const isAdministrator = zohoUser.profile?.name === 'Administrator';
      const userRole = isAdministrator ? 'ADMIN' : 'USER';
      
      const dbProfile = await prisma.zohoProfile.findUnique({
        where: { zohoProfileId: zohoUser.profile?.id }
      });
      
      const dbRole = await prisma.zohoRole.findUnique({
        where: { zohoRoleId: zohoUser.role?.id }
      });
      
      if (!dbProfile) {
        console.warn(`⚠️ Profile not found in database: ${zohoUser.profile?.id} (${zohoUser.profile?.name})`);
      }
      
      if (!dbRole) {
        console.warn(`⚠️ Role not found in database: ${zohoUser.role?.id} (${zohoUser.role?.name})`);
      }

      const userData = {
        name: zohoUser.full_name,
        zohoUserId: zohoUser.id,
        organizationId: organizationId,
        role: userRole as 'ADMIN' | 'USER',
        zohoProfileId: dbProfile?.zohoProfileId || null,
        zohoRoleId: dbRole?.zohoRoleId || null,
        isActive: zohoUser.status === 'active',
        updatedAt: new Date()
      };

      // Create or update user
      const dbUser = await prisma.user.upsert({
        where: { email: zohoUser.email },
        update: userData,
        create: {
          email: zohoUser.email,
          ...userData
        }
      });

      console.log(`✅ User ${zohoUser.email} synced successfully with profile ${dbProfile?.displayLabel || 'N/A'} and role ${dbRole?.displayLabel || 'N/A'}`);
      
    } catch (error: any) {
      console.error(`❌ Failed to sync user ${zohoUser.email}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get all users for an organization from database
   */
  async getUsersForOrganization(organizationId: string): Promise<any[]> {
    try {
      const users = await prisma.user.findMany({
        where: { 
          organizationId,
          isActive: true 
        },
        include: {
          zohoProfile: {
            include: {
              permissions: true
            }
          },
          zohoRole: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      return users;
      
    } catch (error: any) {
      console.error('❌ Failed to get users from database:', error.message);
      throw error;
    }
  }
  
  /**
   * Get user by Zoho user ID
   */
  async getUserByZohoId(zohoUserId: string): Promise<any | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { zohoUserId },
        include: {
          zohoProfile: {
            include: {
              permissions: true
            }
          },
          zohoRole: true
        }
      });

      return user;
      
    } catch (error: any) {
      console.error('❌ Failed to get user by Zoho ID:', error.message);
      throw error;
    }
  }
  
  /**
   * Get users by profile ID
   */
  async getUsersByProfileId(profileId: string): Promise<any[]> {
    try {
      const users = await prisma.user.findMany({
        where: { 
          zohoProfileId: profileId,
          isActive: true 
        },
        include: {
          zohoProfile: {
            include: {
              permissions: true
            }
          },
          zohoRole: true
        }
      });

      return users;
      
    } catch (error: any) {
      console.error('❌ Failed to get users by profile ID:', error.message);
      throw error;
    }
  }
  
  /**
   * Get users by role ID
   */
  async getUsersByRoleId(roleId: string): Promise<any[]> {
    try {
      const users = await prisma.user.findMany({
        where: { 
          zohoRoleId: roleId,
          isActive: true 
        },
        include: {
          zohoProfile: {
            include: {
              permissions: true
            }
          },
          zohoRole: true
        }
      });

      return users;
      
    } catch (error: any) {
      console.error('❌ Failed to get users by role ID:', error.message);
      throw error;
    }
  }
  
  /**
   * Trigger user sync for an organization (usually called after admin login)
   */
  async triggerUserSync(organizationId: string): Promise<void> {
    try {
      console.log(`🚀 Triggering user sync for organization: ${organizationId}`);
      
      this.syncUsersToDatabase(organizationId).catch((error: any) => {
        console.error('❌ Background user sync failed:', error.message);
      });
      
    } catch (error: any) {
      console.error('❌ Failed to trigger user sync:', error.message);
      throw error;
    }
  }
}

export const zohoUserSyncService = new ZohoUserSyncService();