import { contactService } from './contactService';
import { zohoCRMService } from './zohoCRM';
import prisma from '../lib/prisma';

export class ZohoSyncService {
  /**
   * Sync all contacts from Zoho CRM to local database with pagination
   */
  async syncContactsFromZoho(): Promise<{
    synced: number;
    errors: string[];
    pages: number;
  }> {
    console.log('🚀 Starting contact sync from Zoho CRM...');
    
    let totalSynced = 0;
    let totalErrors: string[] = [];
    let page = 1;
    let hasMore = true;
    const perPage = 200; // Max per page for Zoho API

    while (hasMore) {
      try {
        console.log(`🔄 Syncing page ${page}...`);
        
        const result = await contactService.getContactsFromZoho(page, perPage);
        
        if (!result.success || !result.data?.data) {
          throw new Error(result.error || 'Failed to fetch contacts from Zoho');
        }

        const contacts = result.data.data;
        console.log(`📦 Retrieved ${contacts.length} contacts from page ${page}`);

        // Sync each contact
        for (const zohoContact of contacts) {
          try {
            await contactService.syncFromZoho(zohoContact);
            totalSynced++;
          } catch (error: any) {
            totalErrors.push(`Contact ${zohoContact.id}: ${error.message}`);
          }
        }

        // Check if we have more pages
        hasMore = contacts.length === perPage;
        page++;
        
        // Add delay between pages to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error: any) {
        console.error(`❌ Failed to sync page ${page}:`, error.message);
        totalErrors.push(`Page ${page}: ${error.message}`);
        break;
      }
    }
    
    console.log(`🎉 Contact sync completed!`);
    console.log(`📊 Summary: ${totalSynced} contacts synced across ${page - 1} pages`);
    
    if (totalErrors.length > 0) {
      console.warn(`⚠️ ${totalErrors.length} errors occurred during sync`);
    }
    
    return { 
      synced: totalSynced, 
      errors: totalErrors,
      pages: page - 1
    };
  }

  /**
   * Trigger contact sync for an organization (usually called after admin login)
   */
  async triggerContactSync(organizationId: string): Promise<void> {
    try {
      console.log('🔄 [CONTACT SYNC] Triggering contact sync for organization:', organizationId);
      
      // Check if we've already done a contact sync recently
      const lastSyncSetting = await prisma.appSetting.findUnique({
        where: { key: `last_contact_sync_${organizationId}` }
      });

      // If we already have a sync within the last 24 hours, skip
      if (lastSyncSetting) {
        const lastSyncTime = new Date(lastSyncSetting.value);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        if (lastSyncTime > oneDayAgo) {
          console.log('⏭️ [CONTACT SYNC] Skipping contact sync - already completed within 24 hours');
          return;
        }
      }

      // Update the sync timestamp before starting
      await prisma.appSetting.upsert({
        where: { key: `last_contact_sync_${organizationId}` },
        update: { 
          value: new Date().toISOString(),
          updatedAt: new Date()
        },
        create: { 
          key: `last_contact_sync_${organizationId}`,
          value: new Date().toISOString(),
          category: 'sync'
        }
      });

      // Run the contact sync in background
      this.syncContactsFromZoho()
        .then(result => {
          console.log(`✅ [CONTACT SYNC] Contact sync completed: ${result.synced} contacts synced across ${result.pages} pages`);
          if (result.errors.length > 0) {
            console.warn(`⚠️ [CONTACT SYNC] ${result.errors.length} errors during contact sync`);
          }
        })
        .catch(error => {
          console.error('❌ [CONTACT SYNC] Background contact sync failed:', error.message);
        });

      console.log('🚀 [CONTACT SYNC] Contact sync started in background');
      
    } catch (error: any) {
      console.error('❌ [CONTACT SYNC] Failed to trigger contact sync:', error.message);
    }
  }
}

export const zohoSyncService = new ZohoSyncService();