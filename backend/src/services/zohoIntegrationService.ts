import axios, { AxiosResponse } from 'axios';
import { zohoAuthService } from './zohoAuth';
import { contactService } from './contactService';
import { leadService } from './leadService';
import { ZOHO_CONFIG } from '../config/zoho';

export interface ZohoContact {
  id?: string;
  First_Name?: string;
  Last_Name?: string;
  Email?: string;
  Phone?: string;
  Mobile?: string;
  Account_Name?: string;
  Company?: string;
  Title?: string;
  Department?: string;
  Lead_Source?: string;
  Description?: string;
  Mailing_Street?: string;
  Mailing_City?: string;
  Mailing_State?: string;
  Mailing_Zip?: string;
  Mailing_Country?: string;
}

export interface CreateContactData {
  First_Name: string;
  Last_Name: string;
  Email: string;
  Phone?: string;
  Mobile?: string;
  Company?: string;
  Title?: string;
  Department?: string;
}

export class ZohoIntegrationService {
  private readonly contactsUrl = `${ZOHO_CONFIG.API_BASE_URL}/Contacts`;
  private readonly leadsUrl = `${ZOHO_CONFIG.API_BASE_URL}/Leads`;
  private readonly usersUrl = `${ZOHO_CONFIG.API_BASE_URL}/users`;

  /**
   * Get current user information from Zoho CRM
   */
  async getCurrentUser(): Promise<any> {
    try {
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      const response: AxiosResponse = await axios.get(`${this.usersUrl}?type=CurrentUser`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const user = response.data?.users?.[0];
      console.log(`✅ Retrieved current user info from Zoho CRM: ${user?.full_name}`);
      
      return user || null;
    } catch (error: any) {
      console.error('❌ Failed to get current user from Zoho:', error.response?.data || error.message);
      throw new Error(`Failed to get current user: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Sync all contacts from Zoho CRM to local database
   */
  async syncContactsFromZoho(): Promise<{ synced: number; errors: string[] }> {
    try {
      const accessToken = await zohoAuthService.getValidAccessToken();
      const errors: string[] = [];
      let synced = 0;

      // Fetch contacts from Zoho (with pagination)
      let hasMore = true;
      let page = 1;
      const perPage = 200; // Zoho's max per page

      while (hasMore) {
        try {
          const response: AxiosResponse = await axios.get(this.contactsUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              page: page,
              per_page: perPage
            }
          });

          const contacts = response.data.data || [];
          hasMore = contacts.length === perPage;

          // Sync each contact to database
          for (const zohoContact of contacts) {
            try {
              await contactService.syncFromZoho(zohoContact);
              synced++;
            } catch (error: any) {
              errors.push(`Failed to sync contact ${zohoContact.id}: ${error.message}`);
            }
          }

          page++;
        } catch (error: any) {
          errors.push(`Failed to fetch contacts page ${page}: ${error.message}`);
          hasMore = false;
        }
      }

      console.log(`✅ Synced ${synced} contacts from Zoho CRM`);
      if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} errors during sync:`, errors);
      }

      return { synced, errors };
    } catch (error: any) {
      console.error('❌ Failed to sync contacts from Zoho:', error.message);
      throw new Error(`Failed to sync contacts: ${error.message}`);
    }
  }

  /**
   * Get contacts from Zoho CRM (with database fallback)
   */
  async getContacts(params: { page?: number; perPage?: number } = {}): Promise<ZohoContact[]> {
    try {
      const accessToken = await zohoAuthService.getValidAccessToken();
      const { page = 1, perPage = 50 } = params;
      
      const response: AxiosResponse = await axios.get(this.contactsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          page,
          per_page: perPage
        }
      });

      const contacts = response.data.data || [];
      
      // Sync to database in background
      this.syncContactsToDatabase(contacts).catch(console.error);
      
      return contacts;
    } catch (error: any) {
      console.error('❌ Failed to fetch contacts from Zoho:', error.response?.data || error.message);
      
      // Fallback to database
      const dbResult = await contactService.getContacts({
        skip: (params.page || 1 - 1) * (params.perPage || 50),
        take: params.perPage || 50
      });
      
      return dbResult.contacts.map(this.convertDbContactToZoho);
    }
  }

  /**
   * Create a new contact in Zoho CRM and sync to database
   */
  async createContact(contactData: CreateContactData): Promise<ZohoContact> {
    try {
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      const response: AxiosResponse = await axios.post(
        this.contactsUrl,
        {
          data: [contactData]
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const createdContact = response.data.data[0].details;
      
      // Sync to database
      try {
        await contactService.syncFromZoho(createdContact);
      } catch (dbError: any) {
        console.warn('⚠️ Failed to sync created contact to database:', dbError.message);
      }
      
      return createdContact;
    } catch (error: any) {
      console.error('❌ Failed to create contact in Zoho:', error.response?.data || error.message);
      throw new Error(`Failed to create contact: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get contact by ID from Zoho CRM (with database fallback)
   */
  async getContactById(contactId: string): Promise<ZohoContact | null> {
    try {
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      const response: AxiosResponse = await axios.get(`${this.contactsUrl}/${contactId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const contact = response.data.data[0];
      
      // Sync to database
      try {
        await contactService.syncFromZoho(contact);
      } catch (dbError: any) {
        console.warn('⚠️ Failed to sync contact to database:', dbError.message);
      }
      
      return contact;
    } catch (error: any) {
      console.error('❌ Failed to fetch contact from Zoho:', error.response?.data || error.message);
      
      // Fallback to database
      const dbContact = await contactService.getContactByZohoId(contactId);
      if (dbContact) {
        return this.convertDbContactToZoho(dbContact);
      }
      
      return null;
    }
  }

  /**
   * Update contact in Zoho CRM and sync to database
   */
  async updateContact(contactId: string, contactData: Partial<CreateContactData>): Promise<ZohoContact> {
    try {
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      const response: AxiosResponse = await axios.put(
        `${this.contactsUrl}/${contactId}`,
        {
          data: [contactData]
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Fetch updated contact
      const updatedContact = await this.getContactById(contactId);
      
      return updatedContact || { ...contactData, id: contactId };
    } catch (error: any) {
      console.error('❌ Failed to update contact in Zoho:', error.response?.data || error.message);
      throw new Error(`Failed to update contact: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Delete contact from Zoho CRM and mark as inactive in database
   */
  async deleteContact(contactId: string): Promise<boolean> {
    try {
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      await axios.delete(`${this.contactsUrl}/${contactId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Mark as inactive in database
      try {
        const dbContact = await contactService.getContactByZohoId(contactId);
        if (dbContact) {
          await contactService.deleteContact(dbContact.id);
        }
      } catch (dbError: any) {
        console.warn('⚠️ Failed to mark contact as inactive in database:', dbError.message);
      }
      
      return true;
    } catch (error: any) {
      console.error('❌ Failed to delete contact from Zoho:', error.response?.data || error.message);
      throw new Error(`Failed to delete contact: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Sync contacts to database (background operation)
   */
  private async syncContactsToDatabase(contacts: ZohoContact[]): Promise<void> {
    try {
      for (const contact of contacts) {
        try {
          await contactService.syncFromZoho(contact);
        } catch (error: any) {
          console.warn(`⚠️ Failed to sync contact ${contact.id} to database:`, error.message);
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to sync contacts to database:', error.message);
    }
  }

  /**
   * Convert database contact to Zoho format
   */
  private convertDbContactToZoho(dbContact: any): ZohoContact {
    return {
      id: dbContact.zohoId,
      First_Name: dbContact.firstName,
      Last_Name: dbContact.lastName,
      Email: dbContact.email,
      Phone: dbContact.phone,
      Mobile: dbContact.mobile,
      Company: dbContact.company,
      Account_Name: dbContact.company,
      Title: dbContact.title,
      Department: dbContact.department,
      Lead_Source: dbContact.leadSource,
      Description: dbContact.description,
      Mailing_Street: dbContact.mailingStreet,
      Mailing_City: dbContact.mailingCity,
      Mailing_State: dbContact.mailingState,
      Mailing_Zip: dbContact.mailingZip,
      Mailing_Country: dbContact.mailingCountry
    };
  }

  // ===== LEADS METHODS =====

  /**
   * Get leads from Zoho CRM with pagination
   */
  async getLeads(options: { page?: number; perPage?: number } = {}): Promise<any[]> {
    try {
      const { page = 1, perPage = 50 } = options;
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      const response: AxiosResponse = await axios.get(this.leadsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          page,
          per_page: Math.min(perPage, 200) // Zoho CRM max per page is 200
        }
      });

      const leads = response.data?.data || [];
      
      console.log(`✅ Retrieved ${leads.length} leads from Zoho CRM`);
      
      // Sync to database in the background
      this.syncLeadsToDatabase(leads).catch(error => {
        console.warn('⚠️ Background lead sync failed:', error.message);
      });

      return leads;
    } catch (error: any) {
      console.error('❌ Failed to get leads from Zoho:', error.response?.data || error.message);
      
      // Fallback to database if Zoho API fails
      try {
        console.log('🔄 Falling back to database for leads...');
        const { page = 1, perPage = 50 } = options;
        const result = await leadService.getLeads({
          skip: (page - 1) * perPage,
          take: perPage
        });
        return result.leads.map(this.convertDbLeadToZoho);
      } catch (dbError: any) {
        console.error('❌ Database fallback failed:', dbError.message);
        throw new Error(`Failed to get leads: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  /**
   * Get lead by ID from Zoho CRM
   */
  async getLeadById(leadId: string): Promise<any | null> {
    try {
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      const response: AxiosResponse = await axios.get(`${this.leadsUrl}/${leadId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const lead = response.data?.data?.[0];
      
      if (lead) {
        // Sync to database in the background
        this.syncLeadsToDatabase([lead]).catch(error => {
          console.warn('⚠️ Background lead sync failed:', error.message);
        });
      }

      return lead || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      
      console.error('❌ Failed to get lead from Zoho:', error.response?.data || error.message);
      
      // Fallback to database
      try {
        const dbLead = await leadService.getLeadByZohoId(leadId);
        return dbLead ? this.convertDbLeadToZoho(dbLead) : null;
      } catch (dbError: any) {
        console.error('❌ Database fallback failed:', dbError.message);
        throw new Error(`Failed to get lead: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  /**
   * Create a new lead in Zoho CRM
   */
  async createLead(leadData: any): Promise<any> {
    try {
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      const response: AxiosResponse = await axios.post(this.leadsUrl, {
        data: [leadData]
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const createdLead = response.data?.data?.[0]?.details;
      
      if (createdLead) {
        console.log(`✅ Lead created in Zoho CRM with ID: ${createdLead.id}`);
        
        // Fetch the full lead data and sync to database
        try {
          const fullLead = await this.getLeadById(createdLead.id);
          if (fullLead) {
            await this.syncLeadsToDatabase([fullLead]);
          }
        } catch (syncError: any) {
          console.warn('⚠️ Failed to sync created lead to database:', syncError.message);
        }
      }

      return createdLead;
    } catch (error: any) {
      console.error('❌ Failed to create lead in Zoho:', error.response?.data || error.message);
      throw new Error(`Failed to create lead: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Update a lead in Zoho CRM
   */
  async updateLead(leadId: string, leadData: any): Promise<any> {
    try {
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      const response: AxiosResponse = await axios.put(`${this.leadsUrl}/${leadId}`, {
        data: [{ ...leadData, id: leadId }]
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const updatedLead = response.data?.data?.[0]?.details;
      
      if (updatedLead) {
        console.log(`✅ Lead updated in Zoho CRM: ${leadId}`);
        
        // Fetch the full lead data and sync to database
        try {
          const fullLead = await this.getLeadById(leadId);
          if (fullLead) {
            await this.syncLeadsToDatabase([fullLead]);
          }
        } catch (syncError: any) {
          console.warn('⚠️ Failed to sync updated lead to database:', syncError.message);
        }
      }

      return updatedLead;
    } catch (error: any) {
      console.error('❌ Failed to update lead in Zoho:', error.response?.data || error.message);
      throw new Error(`Failed to update lead: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Delete a lead from Zoho CRM
   */
  async deleteLead(leadId: string): Promise<boolean> {
    try {
      const accessToken = await zohoAuthService.getValidAccessToken();
      
      await axios.delete(`${this.leadsUrl}/${leadId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Mark as inactive in database
      try {
        const dbLead = await leadService.getLeadByZohoId(leadId);
        if (dbLead) {
          await leadService.deleteLead(dbLead.id);
        }
      } catch (dbError: any) {
        console.warn('⚠️ Failed to mark lead as inactive in database:', dbError.message);
      }
      
      return true;
    } catch (error: any) {
      console.error('❌ Failed to delete lead from Zoho:', error.response?.data || error.message);
      throw new Error(`Failed to delete lead: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Sync all leads from Zoho CRM to local database
   */
  async syncLeadsFromZoho(): Promise<{ synced: number; errors: string[] }> {
    try {
      const accessToken = await zohoAuthService.getValidAccessToken();
      const errors: string[] = [];
      let synced = 0;

      // Fetch leads from Zoho (with pagination)
      let hasMore = true;
      let page = 1;
      const perPage = 200; // Max per page

      while (hasMore) {
        try {
          const response: AxiosResponse = await axios.get(this.leadsUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              page,
              per_page: perPage
            }
          });

          const leads = response.data?.data || [];
          
          if (leads.length === 0) {
            hasMore = false;
            break;
          }

          // Sync each lead to database
          for (const lead of leads) {
            try {
              await leadService.syncFromZoho(lead);
              synced++;
            } catch (error: any) {
              errors.push(`Lead ${lead.id}: ${error.message}`);
            }
          }

          hasMore = leads.length === perPage;
          page++;
          
          // Add delay between requests to avoid rate limiting
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (error: any) {
          errors.push(`Page ${page}: ${error.response?.data?.message || error.message}`);
          break;
        }
      }

      console.log(`✅ Lead sync completed: ${synced} synced, ${errors.length} errors`);
      return { synced, errors };
    } catch (error: any) {
      console.error('❌ Failed to sync leads from Zoho:', error.message);
      throw new Error(`Failed to sync leads: ${error.message}`);
    }
  }

  /**
   * Sync leads to database (background operation)
   */
  private async syncLeadsToDatabase(leads: any[]): Promise<void> {
    try {
      for (const lead of leads) {
        try {
          await leadService.syncFromZoho(lead);
        } catch (error: any) {
          console.warn(`⚠️ Failed to sync lead ${lead.id} to database:`, error.message);
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to sync leads to database:', error.message);
    }
  }

  /**
   * Convert database lead to Zoho format
   */
  private convertDbLeadToZoho(dbLead: any): any {
    return {
      id: dbLead.zohoId,
      First_Name: dbLead.firstName,
      Last_Name: dbLead.lastName,
      Email: dbLead.email,
      Phone: dbLead.phone,
      Mobile: dbLead.mobile,
      Company: dbLead.company,
      Lead_Status: dbLead.leadStatus,
      Lead_Source: dbLead.leadSource,
      Title: dbLead.title,
      Description: dbLead.description
    };
  }
}

// Export singleton instance
export const zohoIntegrationService = new ZohoIntegrationService();