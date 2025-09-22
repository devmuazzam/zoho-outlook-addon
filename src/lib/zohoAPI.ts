// Zoho CRM API client and types for frontend
import { apiClient, ApiResponse } from './api';

// Zoho types for frontend
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
  /**
   * Get Zoho authentication status
   */
  async getAuthStatus(): Promise<ApiResponse<ZohoAuthStatus>> {
    return apiClient.get('/auth/zoho/status');
  }

  /**
   * Initiate Zoho OAuth login
   */
  async initiateLogin(): Promise<ApiResponse<{ authUrl: string; redirectTo: string }>> {
    return apiClient.get('/auth/zoho/login');
  }

  /**
   * Refresh Zoho access token
   */
  async refreshToken(): Promise<ApiResponse<any>> {
    return apiClient.post('/auth/zoho/refresh');
  }

  /**
   * Logout from Zoho
   */
  async logout(): Promise<ApiResponse<any>> {
    return apiClient.post('/auth/zoho/logout');
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<ApiResponse<{ users: ZohoUser[] }>> {
    return apiClient.get('/api/zoho/user');
  }

  /**
   * Get contacts with pagination
   */
  async getContacts(page: number = 1, perPage: number = 10): Promise<ApiResponse<ContactsResponse>> {
    return apiClient.get(`/api/zoho/contacts?page=${page}&per_page=${perPage}`);
  }

  /**
   * Get specific contact by ID
   */
  async getContact(contactId: string): Promise<ApiResponse<ZohoContact>> {
    return apiClient.get(`/api/zoho/contacts/${contactId}`);
  }

  /**
   * Create new contact
   */
  async createContact(contactData: Partial<ZohoContact>): Promise<ApiResponse<any>> {
    return apiClient.post('/api/zoho/contacts', contactData);
  }

  /**
   * Update existing contact
   */
  async updateContact(contactId: string, contactData: Partial<ZohoContact>): Promise<ApiResponse<any>> {
    return apiClient.put(`/api/zoho/contacts/${contactId}`, contactData);
  }

  /**
   * Delete contact
   */
  async deleteContact(contactId: string): Promise<ApiResponse<any>> {
    return apiClient.delete(`/api/zoho/contacts/${contactId}`);
  }

  /**
   * Get leads with pagination
   */
  async getLeads(page: number = 1, perPage: number = 10): Promise<ApiResponse<LeadsResponse>> {
    return apiClient.get(`/api/zoho/leads?page=${page}&per_page=${perPage}`);
  }

  /**
   * Create new lead
   */
  async createLead(leadData: Partial<ZohoLead>): Promise<ApiResponse<any>> {
    return apiClient.post('/api/zoho/leads', leadData);
  }

  /**
   * Search records
   */
  async searchRecords(
    module: 'Contacts' | 'Leads',
    criteria: string,
    page: number = 1,
    perPage: number = 10
  ): Promise<ApiResponse<any>> {
    return apiClient.get(`/api/zoho/search?module=${module}&criteria=${encodeURIComponent(criteria)}&page=${page}&per_page=${perPage}`);
  }

  /**
   * Get organization information
   */
  async getOrganization(): Promise<ApiResponse<any>> {
    return apiClient.get('/api/zoho/organization');
  }

  /**
   * Get webhook data for contacts
   */
  async getContactWebhooks(limit: number = 50): Promise<ApiResponse<WebhookData>> {
    return apiClient.get(`/webhooks/zoho/contacts?limit=${limit}`);
  }

  /**
   * Get webhook data for leads
   */
  async getLeadWebhooks(limit: number = 50): Promise<ApiResponse<WebhookData>> {
    return apiClient.get(`/webhooks/zoho/leads?limit=${limit}`);
  }

  /**
   * Clear all webhook data
   */
  async clearWebhookData(): Promise<ApiResponse<any>> {
    return apiClient.delete('/webhooks/zoho/clear');
  }

  /**
   * Get webhook system status
   */
  async getWebhookStatus(): Promise<ApiResponse<any>> {
    return apiClient.get('/webhooks/zoho/status');
  }
}

// Export singleton instance
export const zohoAPIClient = new ZohoAPIClient();