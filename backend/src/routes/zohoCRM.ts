import express, { Router, Request, Response } from 'express';
import { zohoCRMService } from '../services/zohoCRM';
import { orgService } from '../services/orgService';
import { zohoAuthService } from '../services/zohoAuth';
import { sendSuccess, sendError } from '../utils/response';

const router: Router = express.Router();

// Middleware to check authentication
const requireAuth = (req: Request, res: Response, next: any) => {
  if (!zohoAuthService.isAuthenticated()) {
    return sendError(res, 'Authentication required', 401, 'Please authenticate with Zoho CRM first');
  }
  next();
};

// Get current user information
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

// Search records by criteria
router.get('/search', requireAuth, async (req: Request, res: Response) => {
  try {
    const { module, criteria, page = 1, per_page = 10 } = req.query;
    
    // Validate required parameters
    if (!module || !criteria) {
      return sendError(res, 'Missing required parameters', 400, 'module and criteria are required');
    }
    
    if (!['Contacts', 'Leads'].includes(module as string)) {
      return sendError(res, 'Invalid module', 400, 'Module must be either "Contacts" or "Leads"');
    }
    
    console.log(`🔄 Searching ${module} with criteria: ${criteria}...`);
    
    const result = await zohoCRMService.searchRecords(
      module as 'Contacts' | 'Leads',
      criteria as string,
      parseInt(page as string),
      Math.min(parseInt(per_page as string), 200)
    );
    
    if (result.success) {
      sendSuccess(res, result.data, `Search results retrieved successfully`);
    } else {
      sendError(res, result.error || 'Search failed', result.statusCode || 500);
    }
    
  } catch (error: any) {
    console.error('❌ Search API failed:', error.message);
    sendError(res, 'Search request failed', 500, error.message);
  }
});

// Get organization information
router.get('/organization', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('🔄 Fetching organization info...');
    
    const result = await orgService.getOrganization();
    
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

// Get all available modules in the organization
router.get('/organization/modules', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('🔄 Fetching organization modules...');
    
    const result = await orgService.getModules();
    
    if (result.success) {
      sendSuccess(res, result.data, 'Organization modules retrieved successfully');
    } else {
      sendError(res, result.error || 'Failed to fetch organization modules', result.statusCode || 500);
    }
    
  } catch (error: any) {
    console.error('❌ Organization modules API failed:', error.message);
    sendError(res, 'Failed to fetch organization modules', 500, error.message);
  }
});

// Get all profiles in the organization
router.get('/organization/profiles', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('🔄 Fetching organization profiles...');
    
    const result = await orgService.getProfiles();
    
    if (result.success) {
      sendSuccess(res, result.data, 'Organization profiles retrieved successfully');
    } else {
      sendError(res, result.error || 'Failed to fetch organization profiles', result.statusCode || 500);
    }
    
  } catch (error: any) {
    console.error('❌ Organization profiles API failed:', error.message);
    sendError(res, 'Failed to fetch organization profiles', 500, error.message);
  }
});

// Get comprehensive organization metadata
router.get('/organization/metadata', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('🔄 Fetching organization metadata...');
    
    const result = await orgService.getOrgMetadata();
    
    sendSuccess(res, result, 'Organization metadata retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Organization metadata API failed:', error.message);
    sendError(res, 'Failed to fetch organization metadata', 500, error.message);
  }
});

export default router;
