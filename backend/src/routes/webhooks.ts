import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { webhookController } from '../controllers/WebhookController';

/**
 * Webhook Routes
 * 
 * Defines all webhook endpoints for Zoho CRM modules
 */
const webhookRouter: ExpressRouter = Router();

/**
 * POST /webhooks/contacts
 * Handle Zoho CRM contacts webhooks
 */
webhookRouter.post('/contacts', async (req, res) => {
  await webhookController.handleContactsWebhook(req, res);
});

/**
 * GET /webhooks/health
 * Health check endpoint for webhook system
 */
webhookRouter.get('/health', async (req, res) => {
  await webhookController.healthCheck(req, res);
});

/**
 * Future webhook endpoints can be added here:
 * 
 * POST /webhooks/leads
 * webhookRouter.post('/leads', async (req, res) => {
 *   await webhookController.handleModuleWebhook(req, res, 'Leads');
 * });
 * 
 * POST /webhooks/accounts
 * webhookRouter.post('/accounts', async (req, res) => {
 *   await webhookController.handleModuleWebhook(req, res, 'Accounts');
 * });
 */

export { webhookRouter };
