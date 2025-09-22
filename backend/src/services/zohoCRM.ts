import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { ZOHO_CONFIG, ZohoContact, ZohoLead, ZohoUser, ZohoAPIResponse } from '../config/zoho';
import { zohoAuthService } from './zohoAuth';

export class ZohoCRMService {
  /**
   * Make authenticated API call to Zoho CRM
   */
  private async makeAPICall<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<ZohoAPIResponse<T>> {
    try {
      // Get valid access token
      const accessToken = await zohoAuthService.getValidAccessToken();

      const config: AxiosRequestConfig = {
        method,
        url: `${ZOHO_CONFIG.API_BASE_URL}${endpoint}`,
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }

      const response: AxiosResponse = await axios(config);

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };

    } catch (error: any) {
      console.error(`❌ Zoho API call failed [${method} ${endpoint}]:`, error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status || 500,
        data: error.response?.data
      };
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<ZohoAPIResponse<{ users: ZohoUser[] }>> {
    return this.makeAPICall<{ users: ZohoUser[] }>('/users?type=CurrentUser');
  }

  /**
   * Get contacts with pagination
   */
  async getContacts(page: number = 1, perPage: number = 10): Promise<ZohoAPIResponse<{ data: ZohoContact[] }>> {
    return this.makeAPICall<{ data: ZohoContact[] }>(`/Contacts?page=${page}&per_page=${perPage}`);
  }

  /**
   * Get a specific contact by ID
   */
  async getContact(contactId: string): Promise<ZohoAPIResponse<{ data: ZohoContact[] }>> {
    return this.makeAPICall<{ data: ZohoContact[] }>(`/Contacts/${contactId}`);
  }

  /**
   * Create a new contact
   */
  async createContact(contactData: Partial<ZohoContact>): Promise<ZohoAPIResponse<any>> {
    const payload = {
      data: [{
        First_Name: contactData.First_Name,
        Last_Name: contactData.Last_Name,
        Email: contactData.Email,
        Phone: contactData.Phone,
        Company: contactData.Company
      }]
    };

    return this.makeAPICall('/Contacts', 'POST', payload);
  }

  /**
   * Update an existing contact
   */
  async updateContact(contactId: string, contactData: Partial<ZohoContact>): Promise<ZohoAPIResponse<any>> {
    const payload = {
      data: [{
        id: contactId,
        ...contactData
      }]
    };

    return this.makeAPICall(`/Contacts/${contactId}`, 'PUT', payload);
  }

  /**
   * Delete a contact
   */
  async deleteContact(contactId: string): Promise<ZohoAPIResponse<any>> {
    return this.makeAPICall(`/Contacts/${contactId}`, 'DELETE');
  }

  /**
   * Get leads with pagination
   */
  async getLeads(page: number = 1, perPage: number = 10): Promise<ZohoAPIResponse<{ data: ZohoLead[] }>> {
    return this.makeAPICall<{ data: ZohoLead[] }>(`/Leads?page=${page}&per_page=${perPage}`);
  }

  /**
   * Get a specific lead by ID
   */
  async getLead(leadId: string): Promise<ZohoAPIResponse<{ data: ZohoLead[] }>> {
    return this.makeAPICall<{ data: ZohoLead[] }>(`/Leads/${leadId}`);
  }

  /**
   * Create a new lead
   */
  async createLead(leadData: Partial<ZohoLead>): Promise<ZohoAPIResponse<any>> {
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

    return this.makeAPICall('/Leads', 'POST', payload);
  }

  /**
   * Update an existing lead
   */
  async updateLead(leadId: string, leadData: Partial<ZohoLead>): Promise<ZohoAPIResponse<any>> {
    const payload = {
      data: [{
        id: leadId,
        ...leadData
      }]
    };

    return this.makeAPICall(`/Leads/${leadId}`, 'PUT', payload);
  }

  /**
   * Delete a lead
   */
  async deleteLead(leadId: string): Promise<ZohoAPIResponse<any>> {
    return this.makeAPICall(`/Leads/${leadId}`, 'DELETE');
  }

  /**
   * Search records by criteria
   */
  async searchRecords(
    module: 'Contacts' | 'Leads', 
    criteria: string, 
    page: number = 1, 
    perPage: number = 10
  ): Promise<ZohoAPIResponse<any>> {
    const encodedCriteria = encodeURIComponent(criteria);
    return this.makeAPICall(`/${module}/search?criteria=${encodedCriteria}&page=${page}&per_page=${perPage}`);
  }

  /**
   * Get organization information
   */
  async getOrganization(): Promise<ZohoAPIResponse<any>> {
    return this.makeAPICall('/org');
  }
}

// Export singleton instance
export const zohoCRMService = new ZohoCRMService();