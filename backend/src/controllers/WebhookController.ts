import { Request, Response } from 'express';
import { webhookManager } from '../services/webhooks';
import { 
  WebhookRequest, 
  WebhookResponse, 
  ZohoModule, 
  WebhookOperation 
} from '../types/webhook';

/**
 * WebhookController
 * 
 * Handles HTTP endpoints for Zoho CRM webhooks.
 * Validates requests and delegates processing to WebhookManager.
 */
export class WebhookController {

  /**
   * Handle contacts webhook endpoint: POST /webhooks/contacts
   */
  async handleContactsWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('📨 WebhookController: Received contacts webhook', {
        method: req.method,
        path: req.path,
        headers: {
          'content-type': req.headers['content-type'],
          'user-agent': req.headers['user-agent'],
          'x-zoho-webhook': req.headers['x-zoho-webhook']
        },
        body: req.body
      });

      // Validate request body
      const validationResult = this.validateWebhookRequest(req.body);
      if (!validationResult.isValid) {
        const response: WebhookResponse = {
          success: false,
          error: validationResult.error,
          processed_at: new Date().toISOString()
        };
        
        console.error('❌ WebhookController: Invalid webhook request:', validationResult.error);
        res.status(400).json(response);
        return;
      }

      // Extract webhook data
      const { data, operation } = this.extractWebhookData(req.body);
      
      // Process webhook using WebhookManager
      const result = await webhookManager.processWebhook(
        'Contacts',
        operation,
        data,
        {
          organizationId: req.body.organization_id,
          subscriptionId: req.body.subscription_id
        }
      );

      const processingTime = Date.now() - startTime;
      
      const response: WebhookResponse = {
        success: result.success,
        message: result.message,
        error: result.error,
        processed_at: new Date().toISOString()
      };

      const statusCode = result.success ? 200 : 422;
      
      console.log(`✅ WebhookController: Contacts webhook processed in ${processingTime}ms`, {
        success: result.success,
        statusCode,
        message: result.message
      });

      res.status(statusCode).json(response);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      
      console.error(`❌ WebhookController: Error processing contacts webhook after ${processingTime}ms:`, error);
      
      const response: WebhookResponse = {
        success: false,
        error: errorMessage,
        processed_at: new Date().toISOString()
      };

      res.status(500).json(response);
    }
  }

  /**
   * Generic webhook handler for future modules
   */
  async handleModuleWebhook(req: Request, res: Response, module: ZohoModule): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`📨 WebhookController: Received ${module} webhook`, {
        module,
        method: req.method,
        path: req.path,
        body: req.body
      });

      // Check if module is supported
      if (!webhookManager.isModuleSupported(module)) {
        const response: WebhookResponse = {
          success: false,
          error: `Module "${module}" is not supported`,
          processed_at: new Date().toISOString()
        };
        
        console.error(`❌ WebhookController: Unsupported module: ${module}`);
        res.status(400).json(response);
        return;
      }

      // Validate request
      const validationResult = this.validateWebhookRequest(req.body);
      if (!validationResult.isValid) {
        const response: WebhookResponse = {
          success: false,
          error: validationResult.error,
          processed_at: new Date().toISOString()
        };
        
        res.status(400).json(response);
        return;
      }

      // Process webhook
      const { data, operation } = this.extractWebhookData(req.body);
      const result = await webhookManager.processWebhook(module, operation, data);

      const processingTime = Date.now() - startTime;
      const statusCode = result.success ? 200 : 422;
      
      const response: WebhookResponse = {
        success: result.success,
        message: result.message,
        error: result.error,
        processed_at: new Date().toISOString()
      };

      console.log(`✅ WebhookController: ${module} webhook processed in ${processingTime}ms`);
      res.status(statusCode).json(response);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      
      console.error(`❌ WebhookController: Error processing ${module} webhook after ${processingTime}ms:`, error);
      
      const response: WebhookResponse = {
        success: false,
        error: errorMessage,
        processed_at: new Date().toISOString()
      };

      res.status(500).json(response);
    }
  }

  /**
   * Health check endpoint for webhooks
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    const stats = webhookManager.getStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      webhookManager: stats
    });
  }

  /**
   * Validate incoming webhook request
   */
  private validateWebhookRequest(body: any): { isValid: boolean; error?: string } {
    if (!body) {
      return { isValid: false, error: 'Request body is required' };
    }

    // Check for required Zoho webhook fields
    if (!body.data) {
      return { isValid: false, error: 'Missing "data" field in webhook payload' };
    }

    if (!body.data.id) {
      return { isValid: false, error: 'Missing "id" field in webhook data' };
    }

    return { isValid: true };
  }

  /**
   * Extract webhook data and operation from request
   */
  private extractWebhookData(body: any): { data: any; operation: WebhookOperation } {
    // Default to 'update' if operation is not specified
    const operation: WebhookOperation = body.operation || 'update';
    const data = body.data;

    return { data, operation };
  }
}

// Export singleton instance
export const webhookController = new WebhookController();
