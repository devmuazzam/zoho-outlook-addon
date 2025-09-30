/**
 * Webhook Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the webhook system
 */

export type ZohoModule = 'Contacts' | 'Leads' | 'Accounts' | 'Deals' | 'Tasks';

export type WebhookOperation = 'insert' | 'update' | 'delete';

export interface WebhookRequest {
  module: ZohoModule;
  operation: WebhookOperation;
  data: WebhookData;
  timestamp: string;
  subscription_id?: string;
  organization_id?: string;
}

export interface WebhookData {
  id: string;
  [key: string]: any; // Allow additional fields based on module
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
  processed_at: string;
}

export interface ContactWebhookData extends WebhookData {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  owner?: {
    id: string;
    name: string;
  };
  created_time?: string;
  modified_time?: string;
}

export interface LeadWebhookData extends WebhookData {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  status?: string;
  owner?: {
    id: string;
    name: string;
  };
}

export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface WebhookServiceInterface {
  processWebhook(data: WebhookData, operation: WebhookOperation): Promise<WebhookProcessingResult>;
  validateWebhookData(data: WebhookData): boolean;
}
