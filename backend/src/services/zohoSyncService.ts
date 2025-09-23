import { contactService } from './contactService';
import { zohoCRMService } from './zohoCRM';

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
}

export const zohoSyncService = new ZohoSyncService();