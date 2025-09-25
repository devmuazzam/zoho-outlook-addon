import { PrismaClient, Contact, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { zohoCRMService } from './zohoCRM';
import { ZohoContact, ZohoAPIResponse } from '../config/zoho';

export class ContactService {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  /**
   * Create a new contact
   */
  async createContact(data: Prisma.ContactCreateInput): Promise<Contact> {
    return this.db.contact.create({
      data,
      include: {
        user: true,
        activities: true,
      },
    });
  }

  /**
   * Get contact by ID
   */
  async getContactById(id: string): Promise<Contact | null> {
    return this.db.contact.findUnique({
      where: { id },
      include: {
        user: true,
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Get contact by Zoho ID
   */
  async getContactByZohoId(zohoId: string): Promise<Contact | null> {
    return this.db.contact.findUnique({
      where: { zohoId },
      include: {
        user: true,
        activities: true,
      },
    });
  }

  /**
   * Get all contacts with pagination
   */
  async getContacts(params: {
    skip?: number;
    take?: number;
    userId?: string;
    search?: string;
  }): Promise<{ contacts: Contact[]; total: number }> {
    const { skip = 0, take = 10, userId, search } = params;

    const where: Prisma.ContactWhereInput = {
      isActive: true,
      ...(userId && { userId }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [contacts, total] = await Promise.all([
      this.db.contact.findMany({
        where,
        skip,
        take,
        include: {
          user: true,
          activities: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.contact.count({ where }),
    ]);

    return { contacts, total };
  }

  /**
   * Update contact
   */
  async updateContact(
    id: string,
    data: Prisma.ContactUpdateInput
  ): Promise<Contact> {
    return this.db.contact.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        activities: true,
      },
    });
  }

  /**
   * Update contact by Zoho ID
   */
  async updateContactByZohoId(
    zohoId: string,
    data: Prisma.ContactUpdateInput
  ): Promise<Contact> {
    return this.db.contact.update({
      where: { zohoId },
      data: {
        ...data,
        syncedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: true,
        activities: true,
      },
    });
  }

  /**
   * Sync contact from Zoho CRM
   */
  async syncFromZoho(zohoContact: any): Promise<Contact> {
    const contactData: Prisma.ContactCreateInput | Prisma.ContactUpdateInput = {
      zohoId: zohoContact.id,
      firstName: zohoContact.First_Name || null,
      lastName: zohoContact.Last_Name || null,
      email: zohoContact.Email || null,
      phone: zohoContact.Phone || null,
      mobile: zohoContact.Mobile || null,
      company: zohoContact.Account_Name || zohoContact.Company || null,
      title: zohoContact.Title || null,
      department: zohoContact.Department || null,
      leadSource: zohoContact.Lead_Source || null,
      description: zohoContact.Description || null,
      mailingStreet: zohoContact.Mailing_Street || null,
      mailingCity: zohoContact.Mailing_City || null,
      mailingState: zohoContact.Mailing_State || null,
      mailingZip: zohoContact.Mailing_Zip || null,
      mailingCountry: zohoContact.Mailing_Country || null,
      syncedAt: new Date(),
    };

    // Check if contact exists
    const existingContact = await this.getContactByZohoId(zohoContact.id);

    if (existingContact) {
      return this.updateContactByZohoId(zohoContact.id, contactData);
    } else {
      return this.createContact(contactData as Prisma.ContactCreateInput);
    }
  }

  /**
   * Delete contact (soft delete)
   */
  async deleteContact(id: string): Promise<Contact> {
    return this.db.contact.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get contacts that need syncing
   */
  async getContactsForSync(lastSyncTime?: Date): Promise<Contact[]> {
    return this.db.contact.findMany({
      where: {
        isActive: true,
        ...(lastSyncTime && {
          updatedAt: { gt: lastSyncTime },
        }),
      },
      include: {
        user: true,
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  // ===== ZOHO CRM API METHODS =====

  /**
   * Get contacts from Zoho CRM with pagination
   */
  async getContactsFromZoho(page: number = 1, perPage: number = 10): Promise<ZohoAPIResponse<{ data: ZohoContact[] }>> {
    return zohoCRMService.makeAPICall<{ data: ZohoContact[] }>(`/Contacts?page=${page}&per_page=${perPage}`);
  }

  /**
   * Get a specific contact from Zoho CRM by ID
   */
  async getContactFromZoho(contactId: string): Promise<ZohoAPIResponse<{ data: ZohoContact[] }>> {
    return zohoCRMService.makeAPICall<{ data: ZohoContact[] }>(`/Contacts/${contactId}`);
  }

  /**
   * Create a new contact in Zoho CRM
   */
  async createContactInZoho(contactData: Partial<ZohoContact>): Promise<ZohoAPIResponse<any>> {
    const payload = {
      data: [{
        First_Name: contactData.First_Name,
        Last_Name: contactData.Last_Name,
        Email: contactData.Email,
        Phone: contactData.Phone,
        Company: contactData.Company
      }]
    };

    const result = await zohoCRMService.makeAPICall('/Contacts', 'POST', payload);
    
    // If successful, sync the created contact to local database
    if (result.success && result.data) {
      try {
        const responseData = result.data as any;
        if (responseData?.data?.[0]?.details) {
          await this.syncFromZoho(responseData.data[0].details);
        }
      } catch (syncError) {
        console.warn('⚠️ Failed to sync created contact to local DB:', syncError);
      }
    }
    
    return result;
  }

  /**
   * Update an existing contact in Zoho CRM
   */
  async updateContactInZoho(contactId: string, contactData: Partial<ZohoContact>): Promise<ZohoAPIResponse<any>> {
    const payload = {
      data: [{
        id: contactId,
        ...contactData
      }]
    };

    const result = await zohoCRMService.makeAPICall(`/Contacts/${contactId}`, 'PUT', payload);
    
    // If successful, sync the updated contact to local database
    if (result.success) {
      try {
        const updatedContact = await this.getContactFromZoho(contactId);
        if (updatedContact.success && updatedContact.data?.data?.[0]) {
          await this.syncFromZoho(updatedContact.data.data[0]);
        }
      } catch (syncError) {
        console.warn('⚠️ Failed to sync updated contact to local DB:', syncError);
      }
    }
    
    return result;
  }

  /**
   * Delete a contact from Zoho CRM
   */
  async deleteContactFromZoho(contactId: string): Promise<ZohoAPIResponse<any>> {
    const result = await zohoCRMService.makeAPICall(`/Contacts/${contactId}`, 'DELETE');
    
    // If successful, mark as inactive in local database
    if (result.success) {
      try {
        const localContact = await this.getContactByZohoId(contactId);
        if (localContact) {
          await this.deleteContact(localContact.id);
        }
      } catch (syncError) {
        console.warn('⚠️ Failed to mark contact as inactive in local DB:', syncError);
      }   
    }
    
    return result;
  }
}

export const contactService = new ContactService();