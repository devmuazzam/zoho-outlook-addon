import express, { Router, Request, Response } from 'express';
import { ZohoWebhookData } from '../config/zoho';
import { sendSuccess, sendError } from '../utils/response';

const router: Router = express.Router();

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
 */
router.post('/contact', (req: Request, res: Response) => {
  try {
    console.log('🔔 Zoho Contact Webhook received:');
    console.log('📋 Headers:', req.headers);
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('-----------------------------------');
    
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

export default router;