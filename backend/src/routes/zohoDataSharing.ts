import express, { Router, Request, Response } from 'express';
import { zohoDataSharingService } from '../services/zohoDataSharingService';
import { sendSuccess, sendError } from '../utils/response';

const router: Router = express.Router();

/**
 * GET /data-sharing
 * Get all data sharing rules for the current organization
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.query;
    
    if (!organizationId || typeof organizationId !== 'string') {
      return sendError(res, 'Organization ID is required', 400);
    }
    
    console.log('🔄 Getting data sharing rules for organization:', organizationId);
    
    const rules = await zohoDataSharingService.getDataSharingRulesForOrganization(organizationId);
    
    sendSuccess(res, {
      rules,
      count: rules.length
    }, 'Data sharing rules retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to get data sharing rules:', error.message);
    sendError(res, 'Failed to get data sharing rules', 500, error.message);
  }
});

/**
 * POST /data-sharing/sync
 * Manually trigger data sharing rules sync for an organization
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.body;
    
    if (!organizationId) {
      return sendError(res, 'Organization ID is required', 400);
    }
    
    console.log('🔄 Manually triggering data sharing rules sync for organization:', organizationId);
    
    const result = await zohoDataSharingService.syncDataSharingRulesToDatabase(organizationId);
    
    sendSuccess(res, {
      synced: result.synced,
      errors: result.errors,
      errorCount: result.errors.length
    }, `Data sharing rules sync completed: ${result.synced} rules synced`);
    
  } catch (error: any) {
    console.error('❌ Data sharing rules sync failed:', error.message);
    sendError(res, 'Data sharing rules sync failed', 500, error.message);
  }
});

/**
 * GET /data-sharing/zoho
 * Fetch data sharing rules directly from Zoho CRM (for testing)
 */
router.get('/zoho', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Fetching data sharing rules from Zoho CRM...');
    
    const rules = await zohoDataSharingService.fetchDataSharingRulesFromZoho();
    
    sendSuccess(res, {
      rules,
      count: rules.length
    }, 'Data sharing rules fetched from Zoho CRM successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to fetch data sharing rules from Zoho:', error.message);
    sendError(res, 'Failed to fetch data sharing rules from Zoho', 500, error.message);
  }
});

/**
 * GET /data-sharing/share-type/:shareType
 * Get data sharing rules by share type (private, public, public_read_only)
 */
router.get('/share-type/:shareType', async (req: Request, res: Response) => {
  try {
    const { shareType } = req.params;
    const { organizationId } = req.query;
    
    if (!organizationId || typeof organizationId !== 'string') {
      return sendError(res, 'Organization ID is required', 400);
    }
    
    console.log('🔄 Getting data sharing rules by share type:', shareType, 'for organization:', organizationId);
    
    const rules = await zohoDataSharingService.getDataSharingRulesByShareType(organizationId, shareType);
    
    sendSuccess(res, {
      rules,
      count: rules.length,
      shareType
    }, `Data sharing rules for '${shareType}' retrieved successfully`);
    
  } catch (error: any) {
    console.error('❌ Failed to get data sharing rules by share type:', error.message);
    sendError(res, 'Failed to get data sharing rules by share type', 500, error.message);
  }
});

/**
 * GET /data-sharing/module/:moduleId
 * Get a specific data sharing rule by module ID
 */
router.get('/module/:moduleId', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { organizationId } = req.query;
    
    if (!organizationId || typeof organizationId !== 'string') {
      return sendError(res, 'Organization ID is required', 400);
    }
    
    console.log('🔄 Getting data sharing rule by module ID:', moduleId, 'for organization:', organizationId);
    
    const rule = await zohoDataSharingService.getDataSharingRuleByModuleId(organizationId, moduleId);
    
    if (!rule) {
      return sendError(res, 'Data sharing rule not found for this module', 404);
    }
    
    sendSuccess(res, { rule }, 'Data sharing rule retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to get data sharing rule:', error.message);
    sendError(res, 'Failed to get data sharing rule', 500, error.message);
  }
});

export default router;