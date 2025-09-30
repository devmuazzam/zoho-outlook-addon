/**
 * Webhooks Module Export Index
 * 
 * Centralized exports for all webhook-related services and utilities
 */

// Core webhook manager
export { WebhookManager, webhookManager } from './WebhookManager';

// Module-specific webhook services
export { ContactWebhookService } from './ContactWebhookService';

// Re-export webhook types for convenience
export * from '../../types/webhook';
