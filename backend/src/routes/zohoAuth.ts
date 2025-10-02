import express, { Router, Request, Response } from 'express';
import { zohoAuthService } from '../services/zohoAuth';
import { sendSuccess, sendError } from '../utils/response';
import { ZOHO_CONFIG } from '../config/zoho';

const router: Router = express.Router();

/**
 * GET /auth/zoho/login
 * Initiate Zoho OAuth flow - returns authorization URL
 */
router.get('/login', (req: Request, res: Response) => {
  try {
    const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = ZOHO_CONFIG;
    
    console.log('🔄 Checking Zoho OAuth credentials...');
    console.log('CLIENT_ID:', CLIENT_ID ? `${CLIENT_ID.substring(0, 10)}...` : 'NOT SET');
    console.log('CLIENT_SECRET:', CLIENT_SECRET ? 'SET' : 'NOT SET');
    console.log('REDIRECT_URI:', REDIRECT_URI);
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('❌ Missing Zoho OAuth credentials');
      return sendError(res, 'Zoho OAuth not configured', 500, 'Missing ZOHO_CLIENT_ID or ZOHO_CLIENT_SECRET in environment variables');
    }

    console.log('🔄 Initiating Zoho OAuth flow...');
    
    const authUrl = zohoAuthService.getAuthorizationUrl();
    
    sendSuccess(res, {
      authUrl,
      redirectTo: authUrl
    }, 'Zoho authorization URL generated successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to generate auth URL:', error.message);
    sendError(res, 'Failed to generate authorization URL', 500, error.message);
  }
});

/**
 * GET /auth/zoho/callback
 * Handle OAuth callback from Zoho
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error) {
    console.error('❌ OAuth Error:', error);
    return sendError(res, 'OAuth authentication failed', 400, error as string);
  }

  if (!code || typeof code !== 'string') {
    console.error('❌ No authorization code received');
    return sendError(res, 'No authorization code received', 400);
  }

  try {
    console.log('🔄 Exchanging code for tokens...');
    
    const tokens = await zohoAuthService.exchangeCodeForTokens(code);
    
    console.log('✅ Tokens received successfully');
    
    // For web app, redirect to success page with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/success?auth=success&message=Authentication successful`;
    
    res.redirect(redirectUrl);
    
  } catch (error: any) {
    console.error('❌ Token exchange failed:', error.message);
    
    // Redirect to success page with error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/success?auth=error&message=${encodeURIComponent(error.message)}`;
    
    res.redirect(redirectUrl);
  }
});

/**
 * GET /auth/zoho/status
 * Check current authentication status with database user info
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const authStatus = await zohoAuthService.getAuthStatus();
    
    let dbUser = null;
    if (authStatus.authenticated) {
      try {
        dbUser = await zohoAuthService.getCurrentUserWithOrganization();
      } catch (dbError: any) {
        console.warn('⚠️ Failed to get database user info:', dbError.message);
      }
    }
    
    sendSuccess(res, {
      authenticated: authStatus.authenticated,
      user: authStatus.user,
      dbUser: dbUser,
      message: authStatus.message,
      authUrl: authStatus.authUrl,
      tokenInfo: authStatus.tokens ? {
        tokenType: authStatus.tokens.token_type,
        expiresAt: new Date(authStatus.tokens.expires_at).toISOString(),
        hasRefreshToken: !!authStatus.tokens.refresh_token
      } : null
    }, 'Authentication status retrieved successfully');
    
  } catch (error: any) {
    console.error('❌ Failed to get auth status:', error.message);
    sendError(res, 'Failed to get authentication status', 500, error.message);
  }
});

/**
 * POST /auth/zoho/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Refreshing access token...');
    
    const tokens = await zohoAuthService.refreshAccessToken();
    
    console.log('✅ Token refreshed successfully');
    
    sendSuccess(res, {
      tokenType: tokens.token_type,
      expiresAt: new Date(tokens.expires_at).toISOString(),
      hasRefreshToken: !!tokens.refresh_token
    }, 'Access token refreshed successfully');
    
  } catch (error: any) {
    console.error('❌ Token refresh failed:', error.message);
    sendError(res, 'Token refresh failed', 400, error.message);
  }
});

/**
 * POST /auth/zoho/logout
 * Logout and clear tokens
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    await zohoAuthService.logout();
    
    console.log('🔄 User logged out');
    
    sendSuccess(res, null, 'Logged out successfully');
    
  } catch (error: any) {
    console.error('❌ Logout failed:', error.message);
    sendError(res, 'Logout failed', 500, error.message);
  }
});

export default router;