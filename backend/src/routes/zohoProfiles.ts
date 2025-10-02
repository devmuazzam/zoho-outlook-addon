import express, { Router, Request, Response } from 'express';
import { zohoProfileService } from '../services/zohoProfileService';
import { sendSuccess, sendError } from '../utils/response';

const router: Router = express.Router();

/**
 * GET /profiles
 * Get all profiles for the current organization
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.query;
    
    if (!organizationId || typeof organizationId !== 'string') {
      return sendError(res, 'Organization ID is required', 400);
    }
    
    console.log('🔄 Getting profiles for organization:', organizationId);
    
    const profiles = await zohoProfileService.getProfilesForOrganization(organizationId);
    
    sendSuccess(res, {
      profiles,
      count: profiles.length
    }, 'Profiles retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to get profiles:', error.message);
    sendError(res, 'Failed to get profiles', 500, error.message);
  }
});

/**
 * POST /profiles/sync
 * Manually trigger profile sync for an organization
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.body;
    
    if (!organizationId) {
      return sendError(res, 'Organization ID is required', 400);
    }
    
    console.log('🔄 Manually triggering profile sync for organization:', organizationId);
    
    const result = await zohoProfileService.syncProfilesToDatabase(organizationId);
    
    sendSuccess(res, {
      synced: result.synced,
      errors: result.errors,
      errorCount: result.errors.length
    }, `Profile sync completed: ${result.synced} profiles synced`);
    
  } catch (error: any) {
    console.error('❌ Profile sync failed:', error.message);
    sendError(res, 'Profile sync failed', 500, error.message);
  }
});

/**
 * GET /profiles/test-org
 * Get organization ID for testing
 */
router.get('/test-org', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Getting organization for testing...');
    
    const { default: prisma } = await import('../lib/prisma');
    const organizations = await prisma.organization.findMany({
      take: 1,
      orderBy: { createdAt: 'desc' }
    });
    
    if (organizations.length === 0) {
      return sendError(res, 'No organizations found. Admin needs to login first.', 404);
    }
    
    sendSuccess(res, {
      organization: organizations[0]
    }, 'Organization found');
    
  } catch (error: any) {
    console.error('❌ Failed to get organization:', error.message);
    sendError(res, 'Failed to get organization', 500, error.message);
  }
});

/**
 * GET /profiles/zoho
 * Fetch profiles directly from Zoho CRM (for testing)
 */
router.get('/zoho', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Fetching profiles from Zoho CRM...');
    
    const profiles = await zohoProfileService.fetchProfilesFromZoho();
    
    sendSuccess(res, {
      profiles,
      count: profiles.length
    }, 'Profiles fetched from Zoho CRM successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to fetch profiles from Zoho:', error.message);
    sendError(res, 'Failed to fetch profiles from Zoho', 500, error.message);
  }
});

export default router;