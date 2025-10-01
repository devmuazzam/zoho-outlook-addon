import axios from 'axios';
import { zohoAuthService } from './zohoAuth';
import { ZOHO_CONFIG } from '../config/zoho';
import prisma from '../lib/prisma';

export interface ZohoProfilePermission {
  id: string;
  name: string;
  display_label: string;
  module: string;
  enabled: boolean;
}

export interface ZohoProfile {
  id?: string;
  name?: string;
  display_label: string;
  description?: string;
  custom: boolean;
  created_time: string | null;
  modified_time: string | null;
  permissions_details: ZohoProfilePermission[];
}

export class ZohoProfileService {
  /**
   * Fetch all profiles from Zoho CRM
   */
  async fetchProfilesFromZoho(): Promise<ZohoProfile[]> {
    try {
      console.log('🔄 Fetching profiles from Zoho CRM...');
      
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      const response = await axios.get(
        `${ZOHO_CONFIG.API_BASE_URL}/settings/profiles`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data?.profiles) {
        throw new Error('No profiles data received from Zoho');
      }

      console.log(`✅ Fetched ${response.data.profiles.length} profiles from Zoho CRM`);
      console.log('🔍 Sample profile data:', JSON.stringify(response.data));
      console.log('🔍 Sample profile data:', JSON.stringify(response.data.profiles[0], null, 2));
      
      const profilesWithPermissions = await Promise.all(
        response.data.profiles.map(async (profile: any) => {
          try {
            const profileId = profile.id || profile.name?.toLowerCase().replace(/\s+/g, '_');
            console.log(`🔄 Fetching permissions for profile: ${profile.display_label} (ID: ${profileId})`);
            
            const permissionsResponse = await axios.get(
              `${ZOHO_CONFIG.API_BASE_URL}/settings/profiles/${profileId}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (permissionsResponse.data?.profiles?.[0]?.permissions_details) {
              console.log(`✅ Found ${permissionsResponse.data.profiles[0].permissions_details.length} permissions for ${profile.display_label}`);
              return {
                ...profile,
                permissions_details: permissionsResponse.data.profiles[0].permissions_details
              };
            } else {
              console.warn(`⚠️ No detailed permissions found for profile ${profile.display_label}`);
              return {
                ...profile,
                permissions_details: []
              };
            }
          } catch (permError: any) {
            console.error(`❌ Failed to fetch permissions for profile ${profile.display_label}:`, permError.response?.data || permError.message);
            return {
              ...profile,
              permissions_details: []
            };
          }
        })
      );

      return profilesWithPermissions;
      
    } catch (error: any) {
      console.error('❌ Failed to fetch profiles from Zoho:', error.response?.data || error.message);
      throw new Error(`Failed to fetch profiles: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Sync profiles from Zoho to database
   */
  async syncProfilesToDatabase(organizationId: string): Promise<{
    synced: number;
    errors: string[];
  }> {
    try {
      console.log('🔄 Starting profiles sync to database...');
      
      const zohoProfiles = await this.fetchProfilesFromZoho();
      let syncedCount = 0;
      const errors: string[] = [];

      for (const zohoProfile of zohoProfiles) {
        try {
          await this.syncSingleProfile(zohoProfile, organizationId);
          syncedCount++;
          console.log(`✅ Synced profile: ${zohoProfile.display_label}`);
        } catch (error: any) {
          const errorMsg = `Failed to sync profile ${zohoProfile.display_label}: ${error.message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`🎉 Profiles sync completed: ${syncedCount} synced, ${errors.length} errors`);
      
      return {
        synced: syncedCount,
        errors
      };
      
    } catch (error: any) {
      console.error('❌ Profiles sync failed:', error.message);
      throw error;
    }
  }

  /**
   * Sync a single profile to database
   */
  private async syncSingleProfile(zohoProfile: ZohoProfile, organizationId: string): Promise<void> {
    try {
      const profileId = zohoProfile.id || `profile_${zohoProfile.display_label.toLowerCase().replace(/\s+/g, '_')}`;
      const profileData = {
        zohoProfileId: profileId,
        name: zohoProfile.name || zohoProfile.display_label,
        displayLabel: zohoProfile.display_label,
        description: zohoProfile.description || null,
        custom: zohoProfile.custom,
        organizationId: organizationId
      };

      const createData = {
        ...profileData,
        ...(zohoProfile.created_time && { createdTime: new Date(zohoProfile.created_time) }),
        ...(zohoProfile.modified_time && { modifiedTime: new Date(zohoProfile.modified_time) })
      };

      const updateData = {
        name: profileData.name,
        displayLabel: profileData.displayLabel,
        description: profileData.description,
        custom: profileData.custom,
        ...(zohoProfile.created_time && { createdTime: new Date(zohoProfile.created_time) }),
        ...(zohoProfile.modified_time && { modifiedTime: new Date(zohoProfile.modified_time) }),
        updatedAt: new Date()
      };

      const dbProfile = await prisma.zohoProfile.upsert({
        where: { zohoProfileId: profileId },
        update: updateData,
        create: createData
      });

      console.log(`🔍 Checking permissions for profile ${zohoProfile.display_label}:`, {
        hasPermissions: !!zohoProfile.permissions_details,
        permissionCount: zohoProfile.permissions_details?.length || 0,
        firstFewPermissions: zohoProfile.permissions_details?.slice(0, 3)
      });
      
      if (zohoProfile.permissions_details && zohoProfile.permissions_details.length > 0) {
        console.log(`🔄 Syncing ${zohoProfile.permissions_details.length} permissions for profile ${zohoProfile.display_label}`);
        await this.syncProfilePermissions(dbProfile.id, zohoProfile.permissions_details);
      } else {
        console.warn(`⚠️ No permissions found for profile ${zohoProfile.display_label}`);
      }
      
    } catch (error: any) {
      console.error(`❌ Failed to sync profile ${zohoProfile.display_label}:`, error.message);
      throw error;
    }
  }

  /**
   * Sync permissions for a profile
   */
  private async syncProfilePermissions(profileId: string, permissions: ZohoProfilePermission[]): Promise<void> {
    try {
      await prisma.zohoProfilePermission.deleteMany({
        where: { profileId }
      });

      const missingModule = permissions.filter(p => !p.module);
      if (missingModule.length > 0) {
        console.warn('Some permissions are missing module. Example:', missingModule[0]);
      }

      const permissionData = permissions.map(permission => ({
        profileId,
        zohoPermId: String(permission.id),
        name: String(permission.name),
        displayLabel: String(permission.display_label),
        module: permission.module ? String(permission.module) : 'GLOBAL',
        enabled: Boolean(permission.enabled)
      }));

      if (permissionData.length > 0) {
        try {
          await prisma.zohoProfilePermission.createMany({
            data: permissionData,
            skipDuplicates: true
          });
          console.log(`✅ Successfully inserted permissions for profile ${profileId}`);
        } catch (insertError: any) {
          console.error('❌ Failed to insert permissions:', {
            error: insertError.message,
            code: insertError.code,
            profileId,
            permissionCount: permissionData.length
          });
          throw insertError;
        }
      }

      console.log(`✅ Synced ${permissions.length} permissions for profile`);
      
    } catch (error: any) {
      console.error('❌ Failed to sync profile permissions:', error.message);
      throw error;
    }
  }

  /**
   * Get all profiles for an organization from database
   */
  async getProfilesForOrganization(organizationId: string): Promise<any[]> {
    try {
      const profiles = await prisma.zohoProfile.findMany({
        where: { 
          organizationId,
          isActive: true 
        },
        include: {
          permissions: true
        },
        orderBy: {
          displayLabel: 'asc'
        }
      });

      return profiles;
      
    } catch (error: any) {
      console.error('❌ Failed to get profiles from database:', error.message);
      throw error;
    }
  }

  /**
   * Trigger profile sync for an organization (usually called after admin login)
   */
  async triggerProfileSync(organizationId: string): Promise<void> {
    try {
      console.log('🔄 Triggering profile sync for organization...');
      
      // Check if we've already done a profile sync recently
      const lastSyncSetting = await prisma.appSetting.findUnique({
        where: { key: `last_profile_sync_${organizationId}` }
      });

      // If we already have a sync within the last 24 hours, skip
      if (lastSyncSetting) {
        const lastSyncTime = new Date(lastSyncSetting.value);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        if (lastSyncTime > oneDayAgo) {
          console.log('⏭️ Skipping profile sync - already completed within 24 hours');
          return;
        }
      }

      await prisma.appSetting.upsert({
        where: { key: `last_profile_sync_${organizationId}` },
        update: { 
          value: new Date().toISOString(),
          updatedAt: new Date()
        },
        create: { 
          key: `last_profile_sync_${organizationId}`,
          value: new Date().toISOString(),
          category: 'sync'
        }
      });

      this.syncProfilesToDatabase(organizationId)
        .then(result => {
          console.log(`✅ Profile sync completed: ${result.synced} profiles synced`);
          if (result.errors.length > 0) {
            console.warn(`⚠️ ${result.errors.length} errors during profile sync`);
          }
        })
        .catch(error => {
          console.error('❌ Background profile sync failed:', error.message);
        });

      console.log('🚀 Profile sync started in background');
      
    } catch (error: any) {
      console.error('❌ Failed to trigger profile sync:', error.message);
    }
  }
}

export const zohoProfileService = new ZohoProfileService();