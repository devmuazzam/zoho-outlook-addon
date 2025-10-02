import { apiClient, ApiResponse } from './api';

export interface ZohoAuthStatus {
  authenticated: boolean;
  message: string;
  authUrl?: string;
  tokenInfo?: {
    tokenType: string;
    expiresAt: string;
    hasRefreshToken: boolean;
  };
}

export interface ZohoContact {
  id: string;
  First_Name?: string;
  Last_Name?: string;
  Email?: string;
  Phone?: string;
  Company?: string;
  Created_Time?: string;
  Modified_Time?: string;
}

export interface ZohoLead {
  id: string;
  First_Name?: string;
  Last_Name?: string;
  Email?: string;
  Phone?: string;
  Company?: string;
  Lead_Status?: string;
  Created_Time?: string;
  Modified_Time?: string;
}

export interface ZohoUser {
  id: string;
  full_name?: string;
  email?: string;
  role?: {
    name: string;
    id: string;
  };
  profile?: {
    name: string;
    id: string;
  };
}

export interface ContactsResponse {
  contacts: ZohoContact[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
  };
}

export interface LeadsResponse {
  leads: ZohoLead[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
  };
}

export interface WebhookData {
  webhooks: any[];
  total: number;
  lastUpdated: string | null;
  limit: number;
}

export class ZohoAPIClient {
  async getAuthStatus(): Promise<ApiResponse<ZohoAuthStatus>> {
    return apiClient.get('/auth/zoho/status');
  }

  async initiateLogin(): Promise<ApiResponse<{ authUrl: string; redirectTo: string }>> {
    return apiClient.get('/auth/zoho/login');
  }

  async refreshToken(): Promise<ApiResponse<any>> {
    return apiClient.post('/auth/zoho/refresh');
  }

  async logout(): Promise<ApiResponse<any>> {
    return apiClient.post('/auth/zoho/logout');
  }

  async getCurrentUser(): Promise<ApiResponse<{ users: ZohoUser[] }>> {
    return apiClient.get('/api/zoho/user');
  }

  async getContacts(page: number = 1, perPage: number = 10): Promise<ApiResponse<ContactsResponse>> {
    return apiClient.get(`/api/zoho/contacts?page=${page}&per_page=${perPage}`);
  }

  async getContact(contactId: string): Promise<ApiResponse<ZohoContact>> {
    return apiClient.get(`/api/zoho/contacts/${contactId}`);
  }

  async createContact(contactData: Partial<ZohoContact>): Promise<ApiResponse<any>> {
    return apiClient.post('/api/zoho/contacts', contactData);
  }

  async updateContact(contactId: string, contactData: Partial<ZohoContact>): Promise<ApiResponse<any>> {
    return apiClient.put(`/api/zoho/contacts/${contactId}`, contactData);
  }

  async deleteContact(contactId: string): Promise<ApiResponse<any>> {
    return apiClient.delete(`/api/zoho/contacts/${contactId}`);
  }

  async getLeads(page: number = 1, perPage: number = 10): Promise<ApiResponse<LeadsResponse>> {
    return apiClient.get(`/api/zoho/leads?page=${page}&per_page=${perPage}`);
  }

  async createLead(leadData: Partial<ZohoLead>): Promise<ApiResponse<any>> {
    return apiClient.post('/api/zoho/leads', leadData);
  }

  async searchRecords(
    module: 'Contacts' | 'Leads',
    criteria: string,
    page: number = 1,
    perPage: number = 10
  ): Promise<ApiResponse<any>> {
    return apiClient.get(`/api/zoho/search?module=${module}&criteria=${encodeURIComponent(criteria)}&page=${page}&per_page=${perPage}`);
  }

  async getOrganization(): Promise<ApiResponse<any>> {
    return apiClient.get('/api/zoho/organization');
  }

  async getContactWebhooks(limit: number = 50): Promise<ApiResponse<WebhookData>> {
    return apiClient.get(`/webhooks/zoho/contacts?limit=${limit}`);
  }

  async getLeadWebhooks(limit: number = 50): Promise<ApiResponse<WebhookData>> {
    return apiClient.get(`/webhooks/zoho/leads?limit=${limit}`);
  }

  async clearWebhookData(): Promise<ApiResponse<any>> {
    return apiClient.delete('/webhooks/zoho/clear');
  }

  async getWebhookStatus(): Promise<ApiResponse<any>> {
    return apiClient.get('/webhooks/zoho/status');
  }
}

export const zohoAPIClient = new ZohoAPIClient();