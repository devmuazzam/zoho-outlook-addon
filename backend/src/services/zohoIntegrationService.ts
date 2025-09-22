import axios, { AxiosResponse } from 'axios';
import { zohoAuthService } from './zohoAuth';
import { contactService } from './contactService';
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
}

// Export singleton instance
export const zohoIntegrationService = new ZohoIntegrationService();