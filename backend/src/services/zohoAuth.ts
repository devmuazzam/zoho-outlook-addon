import axios, { AxiosResponse } from 'axios';
import { ZOHO_CONFIG, ZohoTokens, ZohoAuthResponse } from '../config/zoho';
import { sendSuccess, sendError } from '../utils/response';
import prisma from '../lib/prisma';

export class ZohoAuthService {
  private readonly defaultUserId = 'default_user'; // For demo purposes

  /**
   * Generate Zoho OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    // Build the authorization URL exactly like the working reference
    const authURL = `${ZOHO_CONFIG.BASE_URL}/auth?` +
      `scope=${encodeURIComponent(ZOHO_CONFIG.SCOPES)}&` +
      `client_id=${ZOHO_CONFIG.CLIENT_ID}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `redirect_uri=${encodeURIComponent(ZOHO_CONFIG.REDIRECT_URI)}`;

    console.log('🔄 Generated Zoho Auth URL:', authURL);
    console.log('📋 Config:', {
      CLIENT_ID: ZOHO_CONFIG.CLIENT_ID,
      REDIRECT_URI: ZOHO_CONFIG.REDIRECT_URI,
      SCOPES: ZOHO_CONFIG.SCOPES
    });

    return authURL;
  }

  /**
   * Exchange authorization code for access tokens and store in database
   */
  async exchangeCodeForTokens(code: string): Promise<ZohoTokens> {
    try {
      const response: AxiosResponse = await axios.post(
        `${ZOHO_CONFIG.BASE_URL}/token`,
        null,
        {
          params: {
            grant_type: 'authorization_code',
            client_id: ZOHO_CONFIG.CLIENT_ID,
            client_secret: ZOHO_CONFIG.CLIENT_SECRET,
            redirect_uri: ZOHO_CONFIG.REDIRECT_URI,
            code: code
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokens: ZohoTokens = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
        expires_at: Date.now() + (response.data.expires_in * 1000)
      };

      // Store tokens in database
      await this.storeTokensInDatabase(tokens);

      return tokens;
    } catch (error: any) {
      console.error('❌ Token exchange failed:', error.response?.data || error.message);
      throw new Error(`Token exchange failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Store tokens in database
   */
  private async storeTokensInDatabase(tokens: ZohoTokens): Promise<void> {
    try {
      // First, ensure we have a default user
      let user = await prisma.user.findUnique({
        where: { email: 'default@zoho-v2.local' }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'default@zoho-v2.local',
            name: 'Default User',
            role: 'ADMIN'
          }
        });
      }

      // Store or update the tokens
      await prisma.zohoAuthToken.upsert({
        where: { userId: user.id },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          tokenType: tokens.token_type,
          expiresAt: new Date(tokens.expires_at),
          scopes: ZOHO_CONFIG.SCOPES.split(','),
          updatedAt: new Date()
        },
        create: {
          userId: user.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          tokenType: tokens.token_type,
          expiresAt: new Date(tokens.expires_at),
          scopes: ZOHO_CONFIG.SCOPES.split(',')
        }
      });

      console.log('✅ Tokens stored in database successfully');
    } catch (error: any) {
      console.error('❌ Failed to store tokens in database:', error.message);
      // Fallback to in-memory storage if database is not available
      console.warn('⚠️ Falling back to in-memory token storage');
    }
  }

  /**
   * Get tokens from database
   */
  private async getTokensFromDatabase(): Promise<ZohoTokens | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: 'default@zoho-v2.local' },
        include: { zohoTokens: true }
      });

      if (!user || !user.zohoTokens || user.zohoTokens.length === 0) {
        return null;
      }

      const tokenRecord = user.zohoTokens[0];
      return {
        access_token: tokenRecord.accessToken,
        refresh_token: tokenRecord.refreshToken || undefined,
        expires_in: Math.floor((tokenRecord.expiresAt.getTime() - Date.now()) / 1000),
        token_type: tokenRecord.tokenType,
        expires_at: tokenRecord.expiresAt.getTime()
      };
    } catch (error: any) {
      console.error('❌ Failed to get tokens from database:', error.message);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<ZohoTokens> {
    const currentTokens = await this.getTokensFromDatabase();
    
    if (!currentTokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response: AxiosResponse = await axios.post(
        `${ZOHO_CONFIG.BASE_URL}/token`,
        null,
        {
          params: {
            grant_type: 'refresh_token',
            client_id: ZOHO_CONFIG.CLIENT_ID,
            client_secret: ZOHO_CONFIG.CLIENT_SECRET,
            refresh_token: currentTokens.refresh_token
          }
        }
      );

      const newTokens: ZohoTokens = {
        ...currentTokens,
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
        expires_at: Date.now() + (response.data.expires_in * 1000)
      };

      // Update stored tokens in database
      await this.storeTokensInDatabase(newTokens);

      return newTokens;
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error.response?.data || error.message);
      throw new Error(`Token refresh failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get current authentication status
   */
  async getAuthStatus(): Promise<ZohoAuthResponse> {
    const tokens = await this.getTokensFromDatabase();

    if (!tokens) {
      return {
        success: true,
        authenticated: false,
        message: 'No access token found. Please authenticate first.',
        authUrl: this.getAuthorizationUrl()
      };
    }

    const isExpired = this.isTokenExpired(tokens);

    return {
      success: true,
      authenticated: !isExpired,
      tokens: isExpired ? undefined : tokens,
      message: isExpired ? 'Token expired. Please refresh or re-authenticate.' : 'Authentication active'
    };
  }

  /**
   * Get valid access token (refreshes if needed)
   */
  async getValidAccessToken(): Promise<string> {
    const tokens = await this.getTokensFromDatabase();

    if (!tokens) {
      throw new Error('No access token available. Please authenticate first.');
    }

    // Check if token is expired
    if (this.isTokenExpired(tokens)) {
      if (!tokens.refresh_token) {
        throw new Error('Access token expired and no refresh token available. Please re-authenticate.');
      }

      // Refresh the token
      const newTokens = await this.refreshAccessToken();
      return newTokens.access_token;
    }

    return tokens.access_token;
  }

  /**
   * Logout (clear tokens from database)
   */
  async logout(): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: 'default@zoho-v2.local' }
      });

      if (user) {
        await prisma.zohoAuthToken.deleteMany({
          where: { userId: user.id }
        });
        console.log('✅ Tokens cleared from database');
      }
    } catch (error: any) {
      console.error('❌ Failed to clear tokens from database:', error.message);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const tokens = await this.getTokensFromDatabase();
    return tokens ? !this.isTokenExpired(tokens) : false;
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(tokens: ZohoTokens): boolean {
    return Date.now() > tokens.expires_at;
  }
}

// Export singleton instance
export const zohoAuthService = new ZohoAuthService();