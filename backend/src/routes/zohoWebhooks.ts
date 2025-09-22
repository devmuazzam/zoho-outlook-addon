import express, { Router, Request, Response } from 'express';
import { ZohoWebhookData } from '../config/zoho';
import { sendSuccess, sendError } from '../utils/response';

const router: Router = express.Router();

// In-memory webhook storage (replace with database in production)
interface WebhookStorage {
  contacts: any[];
  leads: any[];
  lastUpdated: string | null;
}

const webhookData: WebhookStorage = {
  contacts: [],
  leads: [],
  lastUpdated: null
};

/**
 * POST /webhooks/zoho/contact
 * Handle Zoho CRM contact webhooks
 */
router.post('/contact', (req: Request, res: Response) => {
  try {
    console.log('🔔 Zoho Contact Webhook received:');
    console.log('📋 Headers:', req.headers);
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('-----------------------------------');
    
    // Store webhook data
    const webhookPayload = {
      ...req.body,
      receivedAt: new Date().toISOString(),
      headers: req.headers
    };
    
    webhookData.contacts.push(webhookPayload);
    webhookData.lastUpdated = new Date().toISOString();
    
    // Keep only last 100 webhook entries to prevent memory issues
    if (webhookData.contacts.length > 100) {
      webhookData.contacts = webhookData.contacts.slice(-100);
    }
    
    sendSuccess(res, {
      processed: true,
      timestamp: new Date().toISOString()
    }, 'Contact webhook received and processed successfully');
    
  } catch (error: any) {
    console.error('❌ Contact webhook processing failed:', error.message);
    sendError(res, 'Failed to process contact webhook', 500, error.message);
  }
});

/**
 * POST /webhooks/zoho/lead
 * Handle Zoho CRM lead webhooks
 */
router.post('/lead', (req: Request, res: Response) => {
  try {
    console.log('🔔 Zoho Lead Webhook received:');
    console.log('📋 Headers:', req.headers);
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('-----------------------------------');
    
    // Store webhook data
    const webhookPayload = {
      ...req.body,
      receivedAt: new Date().toISOString(),
      headers: req.headers
    };
    
    webhookData.leads.push(webhookPayload);
    webhookData.lastUpdated = new Date().toISOString();
    
    // Keep only last 100 webhook entries to prevent memory issues
    if (webhookData.leads.length > 100) {
      webhookData.leads = webhookData.leads.slice(-100);
    }
    
    sendSuccess(res, {
      processed: true,
      timestamp: new Date().toISOString()
    }, 'Lead webhook received and processed successfully');
    
  } catch (error: any) {
    console.error('❌ Lead webhook processing failed:', error.message);
    sendError(res, 'Failed to process lead webhook', 500, error.message);
  }
});

/**
 * GET /webhooks/zoho/contacts
 * Retrieve stored contact webhook data
 */
router.get('/contacts', (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const recentContacts = webhookData.contacts.slice(-limit);
    
    sendSuccess(res, {
      webhooks: recentContacts,
      total: webhookData.contacts.length,
      lastUpdated: webhookData.lastUpdated,
      limit
    }, 'Contact webhook data retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to retrieve contact webhook data:', error.message);
    sendError(res, 'Failed to retrieve webhook data', 500, error.message);
  }
});

/**
 * GET /webhooks/zoho/leads
 * Retrieve stored lead webhook data
 */
router.get('/leads', (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const recentLeads = webhookData.leads.slice(-limit);
    
    sendSuccess(res, {
      webhooks: recentLeads,
      total: webhookData.leads.length,
      lastUpdated: webhookData.lastUpdated,
      limit
    }, 'Lead webhook data retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to retrieve lead webhook data:', error.message);
    sendError(res, 'Failed to retrieve webhook data', 500, error.message);
  }
});

/**
 * DELETE /webhooks/zoho/clear
 * Clear all stored webhook data
 */
router.delete('/clear', (req: Request, res: Response) => {
  try {
    const beforeCount = webhookData.contacts.length + webhookData.leads.length;
    
    webhookData.contacts = [];
    webhookData.leads = [];
    webhookData.lastUpdated = new Date().toISOString();
    
    console.log(`🗑️ Cleared ${beforeCount} webhook entries`);
    
    sendSuccess(res, {
      cleared: beforeCount,
      timestamp: webhookData.lastUpdated
    }, 'Webhook data cleared successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to clear webhook data:', error.message);
    sendError(res, 'Failed to clear webhook data', 500, error.message);
  }
});

/**
 * GET /webhooks/zoho/status
 * Get webhook system status
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    sendSuccess(res, {
      active: true,
      totalContacts: webhookData.contacts.length,
      totalLeads: webhookData.leads.length,
      lastUpdated: webhookData.lastUpdated,
      endpoints: {
        contact: '/webhooks/zoho/contact',
        lead: '/webhooks/zoho/lead'
      }
    }, 'Webhook system status retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to get webhook status:', error.message);
    sendError(res, 'Failed to get webhook status', 500, error.message);
  }
});

export default router;