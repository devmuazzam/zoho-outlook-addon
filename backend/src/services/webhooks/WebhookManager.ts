import { 
  ZohoModule, 
  WebhookOperation, 
  WebhookData, 
  WebhookProcessingResult,
  WebhookServiceInterface 
} from '../../types/webhook';

/**
 * WebhookManager Service
 * 
 * Central coordinator for all Zoho CRM webhook processing.
 * Routes webhook requests to appropriate module-specific handlers.
 */
export class WebhookManager {
  private moduleHandlers: Map<ZohoModule, WebhookServiceInterface> = new Map();

  constructor() {
    this.initializeModuleHandlers();
  }

  /**
   * Initialize module-specific webhook handlers
   */
  private async initializeModuleHandlers(): Promise<void> {
    // Dynamically import module handlers to avoid circular dependencies
    try {
      const { ContactWebhookService } = await import('./ContactWebhookService');
      this.moduleHandlers.set('Contacts', new ContactWebhookService());
      
      console.log('✅ WebhookManager: Initialized module handlers');
    } catch (error) {
      console.error('❌ WebhookManager: Failed to initialize module handlers:', error);
    }
  }

  /**
   * Register a new module handler
   */
  registerModuleHandler(module: ZohoModule, handler: WebhookServiceInterface): void {
    this.moduleHandlers.set(module, handler);
    console.log(`✅ WebhookManager: Registered handler for module "${module}"`);
  }

  /**
   * Process incoming webhook request
   */
  async processWebhook(
    module: ZohoModule,
    operation: WebhookOperation,
    data: WebhookData,
    metadata?: { organizationId?: string; subscriptionId?: string }
  ): Promise<WebhookProcessingResult> {
    const startTime = Date.now();
    
    console.log(`🔄 WebhookManager: Processing ${operation} webhook for ${module}`, {
      module,
      operation,
      dataId: data.id,
      organizationId: metadata?.organizationId,
      subscriptionId: metadata?.subscriptionId
    });

    try {
      // Get appropriate module handler
      const handler = this.moduleHandlers.get(module);
      
      if (!handler) {
        const error = `No handler registered for module "${module}"`;
        console.error(`❌ WebhookManager: ${error}`);
        return {
          success: false,
          message: error,
          error
        };
      }

      // Validate webhook data
      const isValidData = handler.validateWebhookData(data);
      if (!isValidData) {
        const error = `Invalid webhook data for module "${module}"`;
        console.error(`❌ WebhookManager: ${error}`, { data });
        return {
          success: false,
          message: error,
          error
        };
      }

      // Process webhook with module-specific handler
      const result = await handler.processWebhook(data, operation);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ WebhookManager: Successfully processed ${operation} webhook for ${module} in ${processingTime}ms`);

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      console.error(`❌ WebhookManager: Error processing ${operation} webhook for ${module} after ${processingTime}ms:`, error);
      
      return {
        success: false,
        message: `Failed to process ${operation} webhook for ${module}`,
        error: errorMessage
      };
    }
  }

  /**
   * Get list of supported modules
   */
  getSupportedModules(): ZohoModule[] {
    return Array.from(this.moduleHandlers.keys());
  }

  /**
   * Check if a module is supported
   */
  isModuleSupported(module: ZohoModule): boolean {
    return this.moduleHandlers.has(module);
  }

  /**
   * Get webhook processing statistics
   */
  getStats(): { supportedModules: ZohoModule[]; totalHandlers: number } {
    return {
      supportedModules: this.getSupportedModules(),
      totalHandlers: this.moduleHandlers.size
    };
  }
}

// Export singleton instance
export const webhookManager = new WebhookManager();
