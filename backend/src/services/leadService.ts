import { PrismaClient, Lead, Prisma, LeadStatus } from '@prisma/client';
import prisma from '../lib/prisma';

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
}

export const leadService = new LeadService();