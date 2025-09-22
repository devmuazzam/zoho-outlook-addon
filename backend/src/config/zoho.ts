// Zoho CRM OAuth configuration and types
export interface ZohoOAuthConfig {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  REDIRECT_URI: string;
  SCOPES: string;
  BASE_URL: string;
  API_BASE_URL: string;
}

export interface ZohoTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  expires_at: number;
}

export interface ZohoAuthResponse {
  success: boolean;
  authenticated: boolean;
  tokens?: ZohoTokens;
  authUrl?: string;
  message?: string;
  error?: string;
}

export interface ZohoAPIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
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

export interface ZohoWebhookData {
  module: string;
  operation: string;
  resource_uri: string;
  ids: string[];
  token: string;
}

// Zoho OAuth configuration
export const ZOHO_CONFIG: ZohoOAuthConfig = {
  CLIENT_ID: process.env.ZOHO_CLIENT_ID || '',
  CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET || '',
  REDIRECT_URI: process.env.ZOHO_REDIRECT_URI || 'http://localhost:3002/auth/callback',
  SCOPES: [
    'ZohoCRM.modules.contacts.READ',
    'ZohoCRM.modules.contacts.WRITE',
    'ZohoCRM.modules.leads.READ',
    'ZohoCRM.modules.leads.WRITE',
    'ZohoCRM.modules.deals.READ',
    'ZohoCRM.users.READ',
    'ZohoCRM.org.READ',
    'ZohoCRM.settings.ALL'
  ].join(','),
  BASE_URL: 'https://accounts.zoho.com/oauth/v2',
  API_BASE_URL: 'https://www.zohoapis.com/crm/v2'
};

// Zoho API error codes
export const ZOHO_ERROR_CODES = {
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_SCOPE: 'INSUFFICIENT_SCOPE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_DATA: 'INVALID_DATA'
} as const;