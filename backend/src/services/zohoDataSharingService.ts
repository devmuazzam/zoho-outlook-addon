import axios from 'axios';
import { zohoAuthService } from './zohoAuth';
import { ZOHO_CONFIG } from '../config/zoho';
import prisma from '../lib/prisma';

export interface ZohoDataSharingModule {
  api_name: string;
  id: string;
}

export interface ZohoDataSharingRule {
  public_in_portals: boolean;
  share_type: string;
  module?: ZohoDataSharingModule;
  rule_computation_running: boolean;
}

export interface ZohoDataSharingResponse {
  data_sharing: ZohoDataSharingRule[];
}

export class ZohoDataSharingService {
  /**
   * Fetch all data sharing rules from Zoho CRM
   */
  async fetchDataSharingRulesFromZoho(): Promise<ZohoDataSharingRule[]> {
    try {
      console.log('🔄 Fetching data sharing rules from Zoho CRM...');
      
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      const response = await axios.get(
        `${ZOHO_CONFIG.API_BASE_URL}/settings/data_sharing`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data?.data_sharing) {
        throw new Error('No data sharing rules received from Zoho');
      }

      console.log(`✅ Fetched ${response.data.data_sharing.length} data sharing rules from Zoho CRM`);
      console.log('🔍 Full API response:', JSON.stringify(response.data, null, 2));
      console.log('🔍 Sample data sharing rule:', JSON.stringify(response.data.data_sharing[0], null, 2));
      
      return response.data.data_sharing;
      
    } catch (error: any) {
      console.error('❌ Failed to fetch data sharing rules from Zoho:', error.response?.data || error.message);
      throw new Error(`Failed to fetch data sharing rules: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Sync data sharing rules from Zoho to database
   */
  async syncDataSharingRulesToDatabase(organizationId: string): Promise<{
    synced: number;
    errors: string[];
  }> {
    try {
      console.log('🔄 Starting data sharing rules sync to database...');
      await prisma.zohoDataSharingRule.deleteMany({
        where: { organizationId }
      });
      console.log('🗑️ Cleared existing data sharing rules for organization');
      
      const zohoDataSharingRules = await this.fetchDataSharingRulesFromZoho();
      let syncedCount = 0;
      const errors: string[] = [];

      for (const zohoRule of zohoDataSharingRules) {
        try {
          await this.syncSingleDataSharingRule(zohoRule, organizationId);
          syncedCount++;
          const moduleApiName = zohoRule.module?.api_name || 'UNKNOWN_MODULE';
          console.log(`✅ Synced data sharing rule for module: ${moduleApiName}`);
        } catch (error: any) {
          const moduleApiName = zohoRule.module?.api_name || 'UNKNOWN_MODULE';
          const errorMsg = `Failed to sync data sharing rule for ${moduleApiName}: ${error.message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`🎉 Data sharing rules sync completed: ${syncedCount} synced, ${errors.length} errors`);
      
      return {
        synced: syncedCount,
        errors
      };
      
    } catch (error: any) {
      console.error('❌ Data sharing rules sync failed:', error.message);
      throw error;
    }
  }

  /**
   * Sync a single data sharing rule to database
   */
  private async syncSingleDataSharingRule(zohoRule: ZohoDataSharingRule, organizationId: string): Promise<void> {
    try {
      const moduleApiName = zohoRule.module?.api_name || 'UNKNOWN_MODULE';
      const moduleId = zohoRule.module?.id || null;
      
      console.log(`🔍 Syncing data sharing rule for module ${moduleApiName}:`, {
        moduleId: moduleId,
        shareType: zohoRule.share_type,
        publicInPortals: zohoRule.public_in_portals,
        ruleComputationRunning: zohoRule.rule_computation_running
      });
      const dbRule = await prisma.zohoDataSharingRule.create({
        data: {
          organizationId: organizationId,
          ruleData: zohoRule as any,
        }
      });

      console.log(`✅ Successfully synced data sharing rule for module ${moduleApiName} to database`);
      
    } catch (error: any) {
      const moduleApiName = zohoRule.module?.api_name || 'UNKNOWN_MODULE';
      console.error(`❌ Failed to sync data sharing rule for ${moduleApiName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all data sharing rules for an organization from database
   */
  async getDataSharingRulesForOrganization(organizationId: string): Promise<any[]> {
    try {
      const rules = await prisma.zohoDataSharingRule.findMany({
        where: { 
          organizationId,
          isActive: true 
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return rules;
      
    } catch (error: any) {
      console.error('❌ Failed to get data sharing rules from database:', error.message);
      throw error;
    }
  }

  /**
   * Get data sharing rule by module ID
   */
  async getDataSharingRuleByModuleId(organizationId: string, moduleId: string): Promise<any | null> {
    try {
      const rules = await prisma.zohoDataSharingRule.findMany({
        where: { 
          organizationId,
          isActive: true
        },
        include: {
          organization: true
        }
      });

      const rule = rules.find(rule => 
        (rule.ruleData as any)?.module?.id === moduleId
      );

      return rule || null;
      
    } catch (error: any) {
      console.error('❌ Failed to get data sharing rule by module ID:', error.message);
      throw error;
    }
  }

  /**
   * Get data sharing rules by share type
   */
  async getDataSharingRulesByShareType(organizationId: string, shareType: string): Promise<any[]> {
    try {
      const rules = await prisma.zohoDataSharingRule.findMany({
        where: { 
          organizationId,
          isActive: true 
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      const filteredRules = rules.filter(rule => 
        (rule.ruleData as any)?.share_type === shareType
      );

      return filteredRules;
      
    } catch (error: any) {
      console.error('❌ Failed to get data sharing rules by share type:', error.message);
      throw error;
    }
  }

  /**
   * Trigger data sharing rules sync for an organization (usually called after admin login)
   */
  async triggerDataSharingSync(organizationId: string): Promise<void> {
    try {
      console.log('🔄 [DATA SHARING SERVICE] Triggering data sharing rules sync for organization:', organizationId);
      
      // Check if we've already done a data sharing sync recently
      const lastSyncSetting = await prisma.appSetting.findUnique({
        where: { key: `last_data_sharing_sync_${organizationId}` }
      });

      // If we already have a sync within the last 24 hours, skip
      if (lastSyncSetting) {
        const lastSyncTime = new Date(lastSyncSetting.value);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        if (lastSyncTime > oneDayAgo) {
          console.log('⏭️ Skipping data sharing sync - already completed within 24 hours');
          return;
        }
      }

      // Update the sync timestamp before starting
      await prisma.appSetting.upsert({
        where: { key: `last_data_sharing_sync_${organizationId}` },
        update: { 
          value: new Date().toISOString(),
          updatedAt: new Date()
        },
        create: { 
          key: `last_data_sharing_sync_${organizationId}`,
          value: new Date().toISOString(),
          category: 'sync'
        }
      });

      // Run the data sharing sync in background
      this.syncDataSharingRulesToDatabase(organizationId)
        .then(result => {
          console.log(`✅ Data sharing rules sync completed: ${result.synced} rules synced`);
          if (result.errors.length > 0) {
            console.warn(`⚠️ ${result.errors.length} errors during data sharing sync`);
          }
        })
        .catch(error => {
          console.error('❌ Background data sharing sync failed:', error.message);
        });

      console.log('🚀 Data sharing rules sync started in background');
      
    } catch (error: any) {
      console.error('❌ Failed to trigger data sharing rules sync:', error.message);
    }
  }
}

export const zohoDataSharingService = new ZohoDataSharingService();