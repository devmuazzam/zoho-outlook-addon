import express, { Router, Request, Response } from 'express';
import { zohoRoleService } from '../services/zohoRoleService';
import { sendSuccess, sendError } from '../utils/response';

const router: Router = express.Router();

/**
 * GET /roles
 * Get all roles for the current organization
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.query;
    
    if (!organizationId || typeof organizationId !== 'string') {
      return sendError(res, 'Organization ID is required', 400);
    }
    
    console.log('🔄 Getting roles for organization:', organizationId);
    
    const roles = await zohoRoleService.getRolesForOrganization(organizationId);
    
    sendSuccess(res, {
      roles,
      count: roles.length
    }, 'Roles retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to get roles:', error.message);
    sendError(res, 'Failed to get roles', 500, error.message);
  }
});

/**
 * POST /roles/sync
 * Manually trigger role sync for an organization
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.body;
    
    if (!organizationId) {
      return sendError(res, 'Organization ID is required', 400);
    }
    
    console.log('🔄 Manually triggering role sync for organization:', organizationId);
    
    const result = await zohoRoleService.syncRolesToDatabase(organizationId);
    
    sendSuccess(res, {
      synced: result.synced,
      errors: result.errors,
      errorCount: result.errors.length
    }, `Role sync completed: ${result.synced} roles synced`);
    
  } catch (error: any) {
    console.error('❌ Role sync failed:', error.message);
    sendError(res, 'Role sync failed', 500, error.message);
  }
});

/**
 * GET /roles/zoho
 * Fetch roles directly from Zoho CRM (for testing)
 */
router.get('/zoho', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Fetching roles from Zoho CRM...');
    
    const roles = await zohoRoleService.fetchRolesFromZoho();
    
    sendSuccess(res, {
      roles,
      count: roles.length
    }, 'Roles fetched from Zoho CRM successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to fetch roles from Zoho:', error.message);
    sendError(res, 'Failed to fetch roles from Zoho', 500, error.message);
  }
});

/**
 * GET /roles/:zohoRoleId
 * Get a specific role by Zoho role ID
 */
router.get('/:zohoRoleId', async (req: Request, res: Response) => {
  try {
    const { zohoRoleId } = req.params;
    
    console.log('🔄 Getting role by Zoho ID:', zohoRoleId);
    
    const role = await zohoRoleService.getRoleByZohoId(zohoRoleId);
    
    if (!role) {
      return sendError(res, 'Role not found', 404);
    }
    
    sendSuccess(res, { role }, 'Role retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to get role:', error.message);
    sendError(res, 'Failed to get role', 500, error.message);
  }
});

export default router;