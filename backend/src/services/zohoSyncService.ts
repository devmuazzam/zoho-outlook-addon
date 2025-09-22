import { contactService } from './contactService';
import { leadService } from './leadService';
import { zohoCRMService } from './zohoCRM';
import prisma from '../lib/prisma';

export class ZohoSyncService {
  /**
   * Sync all contacts from Zoho CRM to local database
   */
  async syncContactsFromZoho(page: number = 1, perPage: number = 200): Promise<{
    synced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      console.log(`🔄 Syncing contacts from Zoho CRM (page ${page})...`);
      
      const result = await zohoCRMService.getContacts(page, perPage);
      
      if (!result.success || !result.data?.contacts) {
        throw new Error(result.error || 'Failed to fetch contacts from Zoho');
      }

      const contacts = result.data.contacts;
      console.log(`📦 Retrieved ${contacts.length} contacts from Zoho`);

      for (const zohoContact of contacts) {
        try {
          await contactService.syncFromZoho(zohoContact);
          synced++;
        } catch (error: any) {
          errors.push(`Contact ${zohoContact.id}: ${error.message}`);
        }
      }

      console.log(`✅ Synced ${synced} contacts successfully`);
      if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} contacts had errors`);
      }

      return { synced, errors };
      
    } catch (error: any) {
      console.error('❌ Contact sync failed:', error.message);
      return { synced: 0, errors: [error.message] };
    }
  }

  /**
   * Sync all leads from Zoho CRM to local database
   */
  async syncLeadsFromZoho(page: number = 1, perPage: number = 200): Promise<{
    synced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      console.log(`🔄 Syncing leads from Zoho CRM (page ${page})...`);
      
      const result = await zohoCRMService.getLeads(page, perPage);
      
      if (!result.success || !result.data?.leads) {
        throw new Error(result.error || 'Failed to fetch leads from Zoho');
      }

      const leads = result.data.leads;
      console.log(`📦 Retrieved ${leads.length} leads from Zoho`);

      for (const zohoLead of leads) {
        try {
          await leadService.syncFromZoho(zohoLead);
          synced++;
        } catch (error: any) {
          errors.push(`Lead ${zohoLead.id}: ${error.message}`);
        }
      }

      console.log(`✅ Synced ${synced} leads successfully`);
      if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} leads had errors`);
      }

      return { synced, errors };
      
    } catch (error: any) {
      console.error('❌ Lead sync failed:', error.message);
      return { synced: 0, errors: [error.message] };
    }
  }

  /**
   * Full sync: contacts and leads
   */
  async fullSync(): Promise<{
    contacts: { synced: number; errors: string[] };
    leads: { synced: number; errors: string[] };
  }> {
    console.log('🚀 Starting full Zoho CRM sync...');
    
    const contacts = await this.syncContactsFromZoho();
    const leads = await this.syncLeadsFromZoho();
    
    console.log('🎉 Full sync completed!');
    console.log(`📊 Summary: ${contacts.synced} contacts, ${leads.synced} leads`);
    
    return { contacts, leads };
  }

  /**
   * Process webhook data and sync specific record
   */
  async processWebhook(webhookData: any): Promise<boolean> {
    try {
      console.log('🔔 Processing webhook:', webhookData);
      
      // Log webhook
      await prisma.webhookLog.create({
        data: {
          source: 'zoho',
          event: `${webhookData.module?.toLowerCase()}.${webhookData.operation}`,
          module: webhookData.module,
          operation: webhookData.operation,
          payload: webhookData,
          status: 'PROCESSING',
        },
      });

      // Process based on module
      if (webhookData.module === 'Contacts' && webhookData.ids?.length > 0) {
        for (const contactId of webhookData.ids) {
          try {
            const result = await zohoCRMService.getContact(contactId);
            if (result.success && result.data?.data?.[0]) {
              await contactService.syncFromZoho(result.data.data[0]);
            }
          } catch (error: any) {
            console.error(`Failed to sync contact ${contactId}:`, error.message);
          }
        }
      }

      if (webhookData.module === 'Leads' && webhookData.ids?.length > 0) {
        for (const leadId of webhookData.ids) {
          try {
            const result = await zohoCRMService.getLead(leadId);
            if (result.success && result.data?.data?.[0]) {
              await leadService.syncFromZoho(result.data.data[0]);
            }
          } catch (error: any) {
            console.error(`Failed to sync lead ${leadId}:`, error.message);
          }
        }
      }

      // Update webhook status
      await prisma.webhookLog.updateMany({
        where: {
          payload: { path: ['module'], equals: webhookData.module },
          status: 'PROCESSING',
        },
        data: {
          status: 'PROCESSED',
        },
      });

      return true;
      
    } catch (error: any) {
      console.error('❌ Webhook processing failed:', error.message);
      
      // Update webhook status to failed
      await prisma.webhookLog.updateMany({
        where: {
          payload: { path: ['module'], equals: webhookData.module },
          status: 'PROCESSING',
        },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      });

      return false;
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    totalContacts: number;
    totalLeads: number;
    lastSyncTime: Date | null;
    recentWebhooks: number;
  }> {
    const [contactCount, leadCount, lastContact, lastLead, webhookCount] = await Promise.all([
      prisma.contact.count({ where: { isActive: true } }),
      prisma.lead.count({ where: { isActive: true } }),
      prisma.contact.findFirst({
        where: { isActive: true },
        orderBy: { syncedAt: 'desc' },
        select: { syncedAt: true },
      }),
      prisma.lead.findFirst({
        where: { isActive: true },
        orderBy: { syncedAt: 'desc' },
        select: { syncedAt: true },
      }),
      prisma.webhookLog.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
      }),
    ]);

    const lastSyncTime = lastContact?.syncedAt && lastLead?.syncedAt
      ? new Date(Math.max(lastContact.syncedAt.getTime(), lastLead.syncedAt.getTime()))
      : lastContact?.syncedAt || lastLead?.syncedAt || null;

    return {
      totalContacts: contactCount,
      totalLeads: leadCount,
      lastSyncTime,
      recentWebhooks: webhookCount,
    };
  }
}

export const zohoSyncService = new ZohoSyncService();