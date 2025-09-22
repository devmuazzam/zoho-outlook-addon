import express, { Router, Request, Response } from 'express';
import { zohoIntegrationService } from '../services/zohoIntegrationService';
import { contactService } from '../services/contactService';
import { sendSuccess, sendError } from '../utils/response';

const router: Router = express.Router();

/**
 * GET /api/contacts
 * Get contacts with database fallback
 */
router.get('/contacts', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 50;
    const search = req.query.search as string;

    // If search is provided, search in database
    if (search) {
      const result = await contactService.getContacts({
        skip: (page - 1) * perPage,
        take: perPage,
        search
      });

      return sendSuccess(res, {
        contacts: result.contacts,
        pagination: {
          page,
          perPage,
          total: result.total,
          totalPages: Math.ceil(result.total / perPage)
        }
      }, 'Contacts retrieved from database');
    }

    // Otherwise, try to get from Zoho with database fallback
    const contacts = await zohoIntegrationService.getContacts({ page, perPage });

    sendSuccess(res, {
      contacts,
      pagination: {
        page,
        perPage,
        count: contacts.length
      }
    }, 'Contacts retrieved successfully');

  } catch (error: any) {
    console.error('❌ Failed to get contacts:', error.message);
    sendError(res, 'Failed to retrieve contacts', 500, error.message);
  }
});

/**
 * GET /api/contacts/:id
 * Get contact by ID
 */
router.get('/contacts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await zohoIntegrationService.getContactById(id);

    if (!contact) {
      return sendError(res, 'Contact not found', 404);
    }

    sendSuccess(res, contact, 'Contact retrieved successfully');

  } catch (error: any) {
    console.error('❌ Failed to get contact:', error.message);
    sendError(res, 'Failed to retrieve contact', 500, error.message);
  }
});

/**
 * POST /api/contacts
 * Create a new contact
 */
router.post('/contacts', async (req: Request, res: Response) => {
  try {
    const contactData = req.body;

    // Validate required fields
    if (!contactData.First_Name || !contactData.Last_Name || !contactData.Email) {
      return sendError(res, 'Missing required fields', 400, 'First_Name, Last_Name, and Email are required');
    }

    const contact = await zohoIntegrationService.createContact(contactData);

    sendSuccess(res, contact, 'Contact created successfully', 201);

  } catch (error: any) {
    console.error('❌ Failed to create contact:', error.message);
    sendError(res, 'Failed to create contact', 500, error.message);
  }
});

/**
 * PUT /api/contacts/:id
 * Update contact
 */
router.put('/contacts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contactData = req.body;

    const contact = await zohoIntegrationService.updateContact(id, contactData);

    sendSuccess(res, contact, 'Contact updated successfully');

  } catch (error: any) {
    console.error('❌ Failed to update contact:', error.message);
    sendError(res, 'Failed to update contact', 500, error.message);
  }
});

/**
 * DELETE /api/contacts/:id
 * Delete contact
 */
router.delete('/contacts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const success = await zohoIntegrationService.deleteContact(id);

    if (success) {
      sendSuccess(res, null, 'Contact deleted successfully');
    } else {
      sendError(res, 'Failed to delete contact', 500);
    }

  } catch (error: any) {
    console.error('❌ Failed to delete contact:', error.message);
    sendError(res, 'Failed to delete contact', 500, error.message);
  }
});

/**
 * POST /api/sync/contacts
 * Sync all contacts from Zoho CRM
 */
router.post('/sync/contacts', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Starting contact sync from Zoho CRM...');

    const result = await zohoIntegrationService.syncContactsFromZoho();

    sendSuccess(res, {
      synced: result.synced,
      errors: result.errors,
      hasErrors: result.errors.length > 0
    }, `Sync completed. ${result.synced} contacts synced.`);

  } catch (error: any) {
    console.error('❌ Failed to sync contacts:', error.message);
    sendError(res, 'Failed to sync contacts', 500, error.message);
  }
});

/**
 * GET /api/contacts/db/all
 * Get all contacts from database only
 */
router.get('/contacts/db/all', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 50;
    const search = req.query.search as string;

    const result = await contactService.getContacts({
      skip: (page - 1) * perPage,
      take: perPage,
      search
    });

    sendSuccess(res, {
      contacts: result.contacts,
      pagination: {
        page,
        perPage,
        total: result.total,
        totalPages: Math.ceil(result.total / perPage)
      }
    }, 'Contacts retrieved from database');

  } catch (error: any) {
    console.error('❌ Failed to get contacts from database:', error.message);
    sendError(res, 'Failed to retrieve contacts from database', 500, error.message);
  }
});

export default router;