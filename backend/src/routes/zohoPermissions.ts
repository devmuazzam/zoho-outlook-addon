import express, { Router, Request, Response } from 'express';
import { zohoPermissionService } from '../services/zohoPermissionService';
import { zohoUserSyncService } from '../services/zohoUserSyncService';
import { sendSuccess, sendError } from '../utils/response';

const router: Router = express.Router();

/**
 * POST /permissions/check
 * Check permissions for a module record
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { moduleName, recordId } = req.body;
    
    if (!moduleName || !recordId) {
      return sendError(res, 'Module name and record ID are required', 400);
    }
    
    if (moduleName !== 'Contacts') {
      return sendError(res, 'Only Contacts module is supported currently', 400);
    }
    
    console.log('🔄 Checking permissions for record:', { moduleName, recordId });
    
    const result = await zohoPermissionService.checkModulePermissions({
      moduleName,
      recordId
    });
    
    sendSuccess(res, result, 'Permission check completed successfully');
    
  } catch (error: any) {
    console.error('❌ Permission check failed:', error.message);
    sendError(res, 'Permission check failed', 500, error.message);
  }
});

/**
 * GET /permissions/summary/:organizationId/:moduleName
 * Get permission summary for debugging
 */
router.get('/summary/:organizationId/:moduleName', async (req: Request, res: Response) => {
  try {
    const { organizationId, moduleName } = req.params;
    
    console.log('🔄 Getting permission summary:', { organizationId, moduleName });
    
    const summary = await zohoPermissionService.getPermissionSummary(organizationId, moduleName);
    
    sendSuccess(res, summary, 'Permission summary retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to get permission summary:', error.message);
    sendError(res, 'Failed to get permission summary', 500, error.message);
  }
});

/**
 * POST /permissions/sync-users
 * Sync users and their profile/role assignments
 */
router.post('/sync-users', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.body;
    
    if (!organizationId) {
      return sendError(res, 'Organization ID is required', 400);
    }
    
    console.log('🔄 Manually triggering user sync for organization:', organizationId);
    
    const result = await zohoUserSyncService.syncUsersToDatabase(organizationId);
    
    sendSuccess(res, {
      synced: result.synced,
      errors: result.errors,
      errorCount: result.errors.length
    }, `User sync completed: ${result.synced} users synced`);
    
  } catch (error: any) {
    console.error('❌ User sync failed:', error.message);
    sendError(res, 'User sync failed', 500, error.message);
  }
});

/**
 * GET /permissions/users/:organizationId
 * Get all users for an organization
 */
router.get('/users/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    
    console.log('🔄 Getting users for organization:', organizationId);
    
    const users = await zohoUserSyncService.getUsersForOrganization(organizationId);
    
    sendSuccess(res, {
      users,
      count: users.length
    }, 'Users retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to get users:', error.message);
    sendError(res, 'Failed to get users', 500, error.message);
  }
});

/**
 * GET /permissions/users/zoho/:zohoUserId
 * Get user by Zoho user ID
 */
router.get('/users/zoho/:zohoUserId', async (req: Request, res: Response) => {
  try {
    const { zohoUserId } = req.params;
    
    console.log('🔄 Getting user by Zoho ID:', zohoUserId);
    
    const user = await zohoUserSyncService.getUserByZohoId(zohoUserId);
    
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    
    sendSuccess(res, { user }, 'User retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to get user by Zoho ID:', error.message);
    sendError(res, 'Failed to get user by Zoho ID', 500, error.message);
  }
});

/**
 * GET /permissions/users/profile/:profileId
 * Get users by profile ID
 */
router.get('/users/profile/:profileId', async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    
    console.log('🔄 Getting users by profile ID:', profileId);
    
    const users = await zohoUserSyncService.getUsersByProfileId(profileId);
    
    sendSuccess(res, {
      users,
      count: users.length
    }, 'Users by profile retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to get users by profile ID:', error.message);
    sendError(res, 'Failed to get users by profile ID', 500, error.message);
  }
});

/**
 * GET /permissions/users/role/:roleId
 * Get users by role ID
 */
router.get('/users/role/:roleId', async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    
    console.log('🔄 Getting users by role ID:', roleId);
    
    const users = await zohoUserSyncService.getUsersByRoleId(roleId);
    
    sendSuccess(res, {
      users,
      count: users.length
    }, 'Users by role retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to get users by role ID:', error.message);
    sendError(res, 'Failed to get users by role ID', 500, error.message);
  }
});

export default router;