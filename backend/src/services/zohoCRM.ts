import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { ZOHO_CONFIG, ZohoUser, ZohoAPIResponse } from '../config/zoho';
import { zohoAuthService } from './zohoAuth';

export class ZohoCRMService {
  /**
   * Make authenticated API call to Zoho CRM
   */
  async makeAPICall<T>(
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
   * Get organization information
   */
  async getOrganization(): Promise<ZohoAPIResponse<any>> {
    return this.makeAPICall('/org');
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
}

// Export singleton instance
export const zohoCRMService = new ZohoCRMService();