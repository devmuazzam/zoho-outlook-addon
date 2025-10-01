import { PrismaClient, Lead, Prisma, LeadStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { zohoCRMService } from './zohoCRM';
import { ZohoLead, ZohoAPIResponse } from '../config/zoho';

export class LeadService {
  private db: PrismaClient;

  constructor() {
    this.db = prisma;
  }

  /**
   * Create a new lead
   */
  async createLead(data: Prisma.LeadCreateInput): Promise<Lead> {
    return this.db.lead.create({
      data,
      include: {
        user: true,
        activities: true,
      },
    });
  }

  /**
   * Get lead by ID
   */
  async getLeadById(id: string): Promise<Lead | null> {
    return this.db.lead.findUnique({
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
   * Get lead by Zoho ID
   */
  async getLeadByZohoId(zohoId: string): Promise<Lead | null> {
    return this.db.lead.findUnique({
      where: { zohoId },
      include: {
        user: true,
        activities: true,
      },
    });
  }

  /**
   * Get all leads with pagination
   */
  async getLeads(params: {
    skip?: number;
    take?: number;
    userId?: string;
    status?: LeadStatus;
    search?: string;
  }): Promise<{ leads: Lead[]; total: number }> {
    const { skip = 0, take = 10, userId, status, search } = params;

    const where: Prisma.LeadWhereInput = {
      isActive: true,
      ...(userId && { userId }),
      ...(status && { leadStatus: status }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [leads, total] = await Promise.all([
      this.db.lead.findMany({
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
      this.db.lead.count({ where }),
    ]);

    return { leads, total };
  }

  /**
   * Update lead
   */
  async updateLead(id: string, data: Prisma.LeadUpdateInput): Promise<Lead> {
    return this.db.lead.update({
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
   * Update lead by Zoho ID
   */
  async updateLeadByZohoId(
    zohoId: string,
    data: Prisma.LeadUpdateInput
  ): Promise<Lead> {
    return this.db.lead.update({
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
   * Sync lead from Zoho CRM
   */
  async syncFromZoho(zohoLead: any): Promise<Lead> {
    const leadData: Prisma.LeadCreateInput | Prisma.LeadUpdateInput = {
      zohoId: zohoLead.id,
      firstName: zohoLead.First_Name || null,
      lastName: zohoLead.Last_Name || null,
      email: zohoLead.Email || null,
      phone: zohoLead.Phone || null,
      mobile: zohoLead.Mobile || null,
      company: zohoLead.Company || null,
      title: zohoLead.Title || null,
      industry: zohoLead.Industry || null,
      leadSource: zohoLead.Lead_Source || null,
      leadStatus: this.mapZohoStatus(zohoLead.Lead_Status),
      rating: zohoLead.Rating || null,
      description: zohoLead.Description || null,
      street: zohoLead.Street || null,
      city: zohoLead.City || null,
      state: zohoLead.State || null,
      zip: zohoLead.Zip_Code || null,
      country: zohoLead.Country || null,
      syncedAt: new Date(),
    };

    // Check if lead exists
    const existingLead = await this.getLeadByZohoId(zohoLead.id);

    if (existingLead) {
      return this.updateLeadByZohoId(zohoLead.id, leadData);
    } else {
      return this.createLead(leadData as Prisma.LeadCreateInput);
    }
  }

  /**
   * Map Zoho lead status to our enum
   */
  private mapZohoStatus(zohoStatus: string): LeadStatus {
    const statusMap: Record<string, LeadStatus> = {
      'Not Contacted': LeadStatus.NOT_CONTACTED,
      'Contacted': LeadStatus.CONTACTED,
      'Qualified': LeadStatus.QUALIFIED,
      'Proposal': LeadStatus.PROPOSAL,
      'Negotiation': LeadStatus.NEGOTIATION,
      'Closed Won': LeadStatus.WON,
      'Closed Lost': LeadStatus.LOST,
    };

    return statusMap[zohoStatus] || LeadStatus.NEW;
  }

  /**
   * Delete lead (soft delete)
   */
  async deleteLead(id: string): Promise<Lead> {
    return this.db.lead.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get leads by status
   */
  async getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
    return this.db.lead.findMany({
      where: {
        isActive: true,
        leadStatus: status,
      },
      include: {
        user: true,
        activities: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get leads that need syncing
   */
  async getLeadsForSync(lastSyncTime?: Date): Promise<Lead[]> {
    return this.db.lead.findMany({
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

  /**
   * Get lead statistics
   */
  async getLeadStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
  }> {
    const [total, statusCounts] = await Promise.all([
      this.db.lead.count({ where: { isActive: true } }),
      this.db.lead.groupBy({
        by: ['leadStatus'],
        where: { isActive: true },
        _count: true,
      }),
    ]);

    const byStatus = statusCounts.reduce((acc, item) => {
      acc[item.leadStatus] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return { total, byStatus };
  }

  // ===== ZOHO CRM API METHODS =====

  /**
   * Get leads from Zoho CRM with pagination
   */
  async getLeadsFromZoho(page: number = 1, perPage: number = 10): Promise<ZohoAPIResponse<{ data: ZohoLead[] }>> {
    return zohoCRMService.makeAPICall<{ data: ZohoLead[] }>(`/Leads?page=${page}&per_page=${perPage}`);
  }

  /**
   * Get a specific lead from Zoho CRM by ID
   */
  async getLeadFromZoho(leadId: string): Promise<ZohoAPIResponse<{ data: ZohoLead[] }>> {
    return zohoCRMService.makeAPICall<{ data: ZohoLead[] }>(`/Leads/${leadId}`);
  }

  /**
   * Create a new lead in Zoho CRM
   */
  async createLeadInZoho(leadData: Partial<ZohoLead>): Promise<ZohoAPIResponse<any>> {
    const payload = {
      data: [{
        First_Name: leadData.First_Name,
        Last_Name: leadData.Last_Name,
        Email: leadData.Email,
        Phone: leadData.Phone,
        Company: leadData.Company,
        Lead_Status: leadData.Lead_Status || 'Not Contacted'
      }]
    };

    const result = await zohoCRMService.makeAPICall('/Leads', 'POST', payload);
    
    if (result.success && result.data) {
      try {
        const responseData = result.data as any;
        if (responseData?.data?.[0]?.details) {
          await this.syncFromZoho(responseData.data[0].details);
        }
      } catch (syncError) {
        console.warn('⚠️ Failed to sync created lead to local DB:', syncError);
      }
    }
    
    return result;
  }

  /**
   * Update an existing lead in Zoho CRM
   */
  async updateLeadInZoho(leadId: string, leadData: Partial<ZohoLead>): Promise<ZohoAPIResponse<any>> {
    const payload = {
      data: [{
        id: leadId,
        ...leadData
      }]
    };

    const result = await zohoCRMService.makeAPICall(`/Leads/${leadId}`, 'PUT', payload);
    
    // If successful, sync the updated lead to local database
    if (result.success) {
      try {
        const updatedLead = await this.getLeadFromZoho(leadId);
        if (updatedLead.success && updatedLead.data?.data?.[0]) {
          await this.syncFromZoho(updatedLead.data.data[0]);
        }
      } catch (syncError) {
        console.warn('⚠️ Failed to sync updated lead to local DB:', syncError);
      }
    }
    
    return result;
  }

  /**
   * Delete a lead from Zoho CRM
   */
  async deleteLeadFromZoho(leadId: string): Promise<ZohoAPIResponse<any>> {
    const result = await zohoCRMService.makeAPICall(`/Leads/${leadId}`, 'DELETE');
    
    if (result.success) {
      try {
        const localLead = await this.getLeadByZohoId(leadId);
        if (localLead) {
          await this.deleteLead(localLead.id);
        }
      } catch (syncError) {
        console.warn('⚠️ Failed to mark lead as inactive in local DB:', syncError);
      }
    }
    
    return result;
  }
}

export const leadService = new LeadService();