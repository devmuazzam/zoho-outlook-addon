import { 
  WebhookServiceInterface, 
  WebhookData, 
  WebhookOperation, 
  WebhookProcessingResult,
  ContactWebhookData 
} from '../../types/webhook';

/**
 * ContactWebhookService
 * 
 * Handles all webhook operations specific to the Contacts module.
 * Processes contact creation, updates, and deletions from Zoho CRM.
 */
export class ContactWebhookService implements WebhookServiceInterface {

  constructor() {
    console.log('🚀 ContactWebhookService: Initialized');
  }

  /**
   * Process contact webhook data
   */
  async processWebhook(data: WebhookData, operation: WebhookOperation): Promise<WebhookProcessingResult> {
    const contactData = data as ContactWebhookData;
    
    console.log(`📞 ContactWebhookService: Processing ${operation} operation for contact ${contactData.id}`);
    
    try {
      switch (operation) {
        case 'insert':
          return await this.handleContactCreation(contactData);
        
        case 'update':
          return await this.handleContactUpdate(contactData);
        
        case 'delete':
          return await this.handleContactDeletion(contactData);
        
        default:
          return {
            success: false,
            message: `Unsupported operation: ${operation}`,
            error: `Operation "${operation}" is not supported for Contacts module`
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`❌ ContactWebhookService: Error processing ${operation}:`, error);
      
      return {
        success: false,
        message: `Failed to process contact ${operation}`,
        error: errorMessage
      };
    }
  }

  /**
   * Validate contact webhook data
   */
  validateWebhookData(data: WebhookData): boolean {
    // Basic validation for contact data
    if (!data.id) {
      console.error('❌ ContactWebhookService: Missing required field "id"');
      return false;
    }

    // Optional: Add more specific validation rules
    const contactData = data as ContactWebhookData;
    
    if (contactData.email && !this.isValidEmail(contactData.email)) {
      console.error('❌ ContactWebhookService: Invalid email format');
      return false;
    }

    return true;
  }

  /**
   * Handle contact creation webhook
   */
  private async handleContactCreation(contactData: ContactWebhookData): Promise<WebhookProcessingResult> {
    console.log('➕ ContactWebhookService: Handling contact creation', {
      id: contactData.id,
      name: `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim(),
      email: contactData.email,
      company: contactData.company,
      owner: contactData.owner?.name
    });

    // TODO: In the future, implement database sync logic here
    // Example: await this.syncContactToDatabase(contactData, 'create');

    return {
      success: true,
      message: `Contact created successfully`,
      data: {
        contactId: contactData.id,
        operation: 'insert',
        processedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Handle contact update webhook
   */
  private async handleContactUpdate(contactData: ContactWebhookData): Promise<WebhookProcessingResult> {
    console.log('✏️ ContactWebhookService: Handling contact update', {
      id: contactData.id,
      name: `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim(),
      email: contactData.email,
      company: contactData.company,
      modifiedTime: contactData.modified_time
    });

    // TODO: In the future, implement database sync logic here
    // Example: await this.syncContactToDatabase(contactData, 'update');

    return {
      success: true,
      message: `Contact updated successfully`,
      data: {
        contactId: contactData.id,
        operation: 'update',
        processedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Handle contact deletion webhook
   */
  private async handleContactDeletion(contactData: ContactWebhookData): Promise<WebhookProcessingResult> {
    console.log('🗑️ ContactWebhookService: Handling contact deletion', {
      id: contactData.id
    });

    // TODO: In the future, implement database sync logic here
    // Example: await this.syncContactToDatabase(contactData, 'delete');

    return {
      success: true,
      message: `Contact deleted successfully`,
      data: {
        contactId: contactData.id,
        operation: 'delete',
        processedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get service statistics
   */
  getStats(): { serviceName: string; supportedOperations: WebhookOperation[] } {
    return {
      serviceName: 'ContactWebhookService',
      supportedOperations: ['insert', 'update', 'delete']
    };
  }
}
