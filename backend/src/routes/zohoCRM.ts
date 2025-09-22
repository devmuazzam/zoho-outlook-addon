import express, { Router, Request, Response } from 'express';
import { zohoCRMService } from '../services/zohoCRM';
import { zohoAuthService } from '../services/zohoAuth';
import { sendSuccess, sendError, validateRequired } from '../utils/response';

const router: Router = express.Router();

// Middleware to check authentication
const requireAuth = (req: Request, res: Response, next: any) => {
  if (!zohoAuthService.isAuthenticated()) {
    return sendError(res, 'Authentication required', 401, 'Please authenticate with Zoho CRM first');
  }
  next();
};

/**
 * GET /zoho/user
 * Get current user information
 */
router.get('/user', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('🔄 Fetching current user info...');
    
    const result = await zohoCRMService.getCurrentUser();
    
    if (result.success) {
      sendSuccess(res, result.data, 'User information retrieved successfully');
    } else {
      sendError(res, result.error || 'Failed to fetch user info', result.statusCode || 500);
    }
    
  } catch (error: any) {
    console.error('❌ User info API failed:', error.message);
    sendError(res, 'Failed to fetch user information', 500, error.message);
  }
});

/**
 * GET /zoho/contacts
 * Get contacts with pagination
 */
router.get('/contacts', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 10, 200); // Max 200 per page
    
    console.log(`🔄 Fetching contacts (page ${page}, ${perPage} per page)...`);
    
    const result = await zohoCRMService.getContacts(page, perPage);
    
    if (result.success) {
      sendSuccess(res, {
        contacts: result.data?.data || [],
        pagination: {
          page,
          perPage,
          total: result.data?.data?.length || 0
        }
      }, 'Contacts retrieved successfully');
    } else {
      sendError(res, result.error || 'Failed to fetch contacts', result.statusCode || 500);
    }
    
  } catch (error: any) {
    console.error('❌ Contacts API failed:', error.message);
    sendError(res, 'Failed to fetch contacts', 500, error.message);
  }
});

/**
 * GET /zoho/contacts/:id
 * Get specific contact by ID
 */
router.get('/contacts/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`🔄 Fetching contact with ID: ${id}...`);
    
    const result = await zohoCRMService.getContact(id);
    
    if (result.success) {
      const contact = result.data?.data?.[0];
      if (contact) {
        sendSuccess(res, contact, 'Contact retrieved successfully');
      } else {
        sendError(res, 'Contact not found', 404);
      }
    } else {
      sendError(res, result.error || 'Failed to fetch contact', result.statusCode || 500);
    }
    
  } catch (error: any) {
    console.error('❌ Contact fetch failed:', error.message);
    sendError(res, 'Failed to fetch contact', 500, error.message);
  }
});

/**
 * POST /zoho/contacts
 * Create a new contact
 */
router.post('/contacts', requireAuth, async (req: Request, res: Response) => {
  try {
    const { First_Name, Last_Name, Email, Phone, Company } = req.body;
    
    // Validate required fields
    const missing = validateRequired({ First_Name, Last_Name });
    if (missing.length > 0) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }
    
    console.log('🔄 Creating new contact...');
    
    const result = await zohoCRMService.createContact({
      First_Name,
      Last_Name,
      Email,
      Phone,
      Company
    });
    
    if (result.success) {
      sendSuccess(res, result.data, 'Contact created successfully', 201);
    } else {
      sendError(res, result.error || 'Failed to create contact', result.statusCode || 500);
    }
    
  } catch (error: any) {
    console.error('❌ Contact creation failed:', error.message);
    sendError(res, 'Failed to create contact', 500, error.message);
  }
});

/**
 * PUT /zoho/contacts/:id
 * Update an existing contact
 */
router.put('/contacts/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contactData = req.body;
    
    console.log(`🔄 Updating contact with ID: ${id}...`);
    
    const result = await zohoCRMService.updateContact(id, contactData);
    
    if (result.success) {
      sendSuccess(res, result.data, 'Contact updated successfully');
    } else {
      sendError(res, result.error || 'Failed to update contact', result.statusCode || 500);
    }
    
  } catch (error: any) {
    console.error('❌ Contact update failed:', error.message);
    sendError(res, 'Failed to update contact', 500, error.message);
  }
});

/**
 * DELETE /zoho/contacts/:id
 * Delete a contact
 */
router.delete('/contacts/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`🔄 Deleting contact with ID: ${id}...`);
    
    const result = await zohoCRMService.deleteContact(id);
    
    if (result.success) {
      sendSuccess(res, result.data, 'Contact deleted successfully');
    } else {
      sendError(res, result.error || 'Failed to delete contact', result.statusCode || 500);
    }
    
  } catch (error: any) {
    console.error('❌ Contact deletion failed:', error.message);
    sendError(res, 'Failed to delete contact', 500, error.message);
  }
});

/**
 * GET /zoho/leads
 * Get leads with pagination
 */
router.get('/leads', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 10, 200);
    
    console.log(`🔄 Fetching leads (page ${page}, ${perPage} per page)...`);
    
    const result = await zohoCRMService.getLeads(page, perPage);
    
    if (result.success) {
      sendSuccess(res, {
        leads: result.data?.data || [],
        pagination: {
          page,
          perPage,
          total: result.data?.data?.length || 0
        }
      }, 'Leads retrieved successfully');
    } else {
      sendError(res, result.error || 'Failed to fetch leads', result.statusCode || 500);
    }
    
  } catch (error: any) {
    console.error('❌ Leads API failed:', error.message);
    sendError(res, 'Failed to fetch leads', 500, error.message);
  }
});

/**
 * POST /zoho/leads
 * Create a new lead
 */
router.post('/leads', requireAuth, async (req: Request, res: Response) => {
  try {
    const { First_Name, Last_Name, Email, Phone, Company, Lead_Status } = req.body;
    
    // Validate required fields
    const missing = validateRequired({ First_Name, Last_Name });
    if (missing.length > 0) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }
    
    console.log('🔄 Creating new lead...');
    
    const result = await zohoCRMService.createLead({
      First_Name,
      Last_Name,
      Email,
      Phone,
      Company,
      Lead_Status
    });
    
    if (result.success) {
      sendSuccess(res, result.data, 'Lead created successfully', 201);
    } else {
      sendError(res, result.error || 'Failed to create lead', result.statusCode || 500);
    }
    
  } catch (error: any) {
    console.error('❌ Lead creation failed:', error.message);
    sendError(res, 'Failed to create lead', 500, error.message);
  }
});

/**
 * GET /zoho/search
 * Search records by criteria
 */
router.get('/search', requireAuth, async (req: Request, res: Response) => {
  try {
    const { module, criteria, page = 1, per_page = 10 } = req.query;
    
    if (!module || !criteria) {
      return sendError(res, 'Module and criteria parameters are required', 400);
    }
    
    if (!['Contacts', 'Leads'].includes(module as string)) {
      return sendError(res, 'Invalid module. Must be Contacts or Leads', 400);
    }
    
    console.log(`🔄 Searching ${module} with criteria: ${criteria}...`);
    
    const result = await zohoCRMService.searchRecords(
      module as 'Contacts' | 'Leads',
      criteria as string,
      parseInt(page as string),
      parseInt(per_page as string)
    );
    
    if (result.success) {
      sendSuccess(res, result.data, 'Search completed successfully');
    } else {
      sendError(res, result.error || 'Search failed', result.statusCode || 500);
    }
    
  } catch (error: any) {
    console.error('❌ Search failed:', error.message);
    sendError(res, 'Search operation failed', 500, error.message);
  }
});

/**
 * GET /zoho/organization
 * Get organization information
 */
router.get('/organization', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('🔄 Fetching organization info...');
    
    const result = await zohoCRMService.getOrganization();
    
    if (result.success) {
      sendSuccess(res, result.data, 'Organization information retrieved successfully');
    } else {
      sendError(res, result.error || 'Failed to fetch organization info', result.statusCode || 500);
    }
    
  } catch (error: any) {
    console.error('❌ Organization info API failed:', error.message);
    sendError(res, 'Failed to fetch organization information', 500, error.message);
  }
});

export default router;