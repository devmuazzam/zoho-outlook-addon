import axios, { AxiosResponse } from 'axios';
import { ZOHO_CONFIG, ZohoTokens, ZohoAuthResponse, ZohoUser } from '../config/zoho';
import { sendSuccess, sendError } from '../utils/response';
import prisma from '../lib/prisma';

export class ZohoAuthService {
  private currentUserEmail: string | null = null;

  /**
   * Generate Zoho OAuth authorization URL
   */
  getAuthorizationUrl(): string {
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

      await this.createOrUpdateUserFromToken(tokens.access_token);
      await this.storeTokensInDatabase(tokens);

      return tokens;
    } catch (error: any) {
      console.error('❌ Token exchange failed:', error.response?.data || error.message);
      throw new Error(`Token exchange failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Create or update user from Zoho token
   */
  private async createOrUpdateUserFromToken(accessToken: string): Promise<void> {
    try {
      console.log('🔄 Fetching user info from Zoho...');
      
      const userResponse = await axios.get(
        `${ZOHO_CONFIG.API_BASE_URL}/users?type=CurrentUser`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!userResponse.data?.users?.[0]) {
        throw new Error('No user data received from Zoho');
      }

      const zohoUser = userResponse.data.users[0];
      const isAdministrator = zohoUser.profile?.name === 'Administrator';
      
      console.log('📡 Zoho user data:', {
        id: zohoUser.id,
        name: zohoUser.full_name,
        email: zohoUser.email,
        profile: zohoUser.profile?.name,
        role: zohoUser.role?.name,
        isAdministrator
      });
      console.log('✅ Zoho user authenticated:', zohoUser);
      const userRole = isAdministrator ? 'ADMIN' : 'USER';
      console.log(`👤 User type: ${userRole} (${isAdministrator ? 'Administrator' : 'Regular User'})`);
      
      const userData: any = {
        name: zohoUser.full_name,
        zohoUserId: zohoUser.id,
        role: userRole,
        updatedAt: new Date()
      };

      if (zohoUser.profile?.id) {
        console.log('📋 [INFO] Zoho Profile Info:', zohoUser.profile.id, '(', zohoUser.profile.name, ')');
        console.log('📋 [DEFERRED] Profile ID will be assigned after sync completes');
      }
      if (zohoUser.role?.id) {
        console.log('🏷️ [INFO] Zoho Role Info:', zohoUser.role.id, '(', zohoUser.role.name, ')');
        console.log('🏷️ [DEFERRED] Role ID will be assigned after sync completes');
      }

      await prisma.user.upsert({
        where: { email: zohoUser.email },
        update: userData,
        create: {
          email: zohoUser.email,
          ...userData
        }
      });

      // Get organization details from Zoho CRM using direct API call
      try {
        console.log('🔄 Fetching organization details from Zoho CRM...');
        
        // Get organization info directly from Zoho API
        const orgResponse = await axios.get(
          `${ZOHO_CONFIG.API_BASE_URL}/org`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (orgResponse.data?.org?.[0]) {
          const org = orgResponse.data.org[0];
          console.log('🏢 Organization Details:', {
            name: org.company_name,
            id: org.id,
            country: org.country,
            time_zone: org.time_zone,
            currency: org.currency,
            domain: org.domain_name,
            website: org.website,
            email: org.primary_email,
            phone: org.phone,
            employee_count: org.employee_count,
            license_details: org.licence_details,
            userIsAdmin: isAdministrator
          });
          
          let dbOrganization;
          
          if (isAdministrator) {
            console.log('👑 Administrator user - syncing organization to database');
            dbOrganization = await prisma.organization.upsert({
              where: { zohoOrgId: org.id },
              update: {
                name: org.company_name,
                domain: org.domain_name,
                updatedAt: new Date()
              },
              create: {
                zohoOrgId: org.id,
                name: org.company_name,
                domain: org.domain_name
              }
            });
            
            console.log('✅ Organization created/updated in database:', {
              id: dbOrganization.id,
              zohoOrgId: dbOrganization.zohoOrgId,
              name: dbOrganization.name,
              domain: dbOrganization.domain
            });

            // Trigger profile sync for administrators
            this.triggerProfileSync(dbOrganization.id).catch((error: any) => {
              console.error('❌ Profile sync failed:', error.message);
            });

            // Trigger role sync for administrators
            this.triggerRoleSync(dbOrganization.id).catch((error: any) => {
              console.error('❌ Role sync failed:', error.message);
            });

            // Trigger data sharing sync for administrators
            this.triggerDataSharingSync(dbOrganization.id).catch((error: any) => {
              console.error('❌ Data sharing sync failed:', error.message);
            });

            // Trigger user sync for administrators
            this.triggerUserSync(dbOrganization.id).catch((error: any) => {
              console.error('❌ User sync failed:', error.message);
            });

            // Trigger contact sync for administrators (moved from general auth flow)
            this.triggerContactSync(dbOrganization.id).catch((error: any) => {
              console.error('❌ Contact sync failed:', error.message);
            });
          } else {
            // Non-administrator: Only lookup existing organization
            console.log('👤 Non-administrator user - looking up existing organization');
            dbOrganization = await prisma.organization.findUnique({
              where: { zohoOrgId: org.id }
            });
            
            if (dbOrganization) {
              console.log('✅ Found existing organization in database:', {
                id: dbOrganization.id,
                zohoOrgId: dbOrganization.zohoOrgId,
                name: dbOrganization.name
              });
            } else {
              console.log('⚠️ Organization not found in database - user will need admin to login first');
            }
          }
          
          // Link user to organization if it exists in our database
          if (dbOrganization) {
            await prisma.user.update({
              where: { email: zohoUser.email },
              data: {
                organizationId: dbOrganization.id
              }
            });
            
            console.log('✅ User linked to organization successfully');
            
            // For administrators, trigger profile/role assignment after sync
            if (isAdministrator) {
              this.updateUserProfileAndRole(zohoUser, dbOrganization.id).catch((error: any) => {
                console.error('❌ Failed to update user profile/role:', error.message);
              });
            } else {
              // For non-admin users, try to assign profile/role immediately if they exist
              this.assignExistingProfileAndRole(zohoUser).catch((error: any) => {
                console.error('❌ Failed to assign existing profile/role:', error.message);
              });
            }
          } else if (!isAdministrator) {
            console.log('⚠️ Non-administrator user not linked to organization - admin must login first');
          }
          
        } else {
          console.warn('⚠️ No organization data received from Zoho');
        }
        
      } catch (orgError: any) {
        console.error('❌ Error fetching organization details:', orgError.response?.data || orgError.message);
      }

      // Set current user email for token storage
      this.currentUserEmail = zohoUser.email;
      console.log('✅ User created/updated from Zoho token');
    } catch (error: any) {
      console.error('❌ Failed to create/update user from token:', error.message);
    }
  }

  /**
   * Store tokens in database
   */
  private async storeTokensInDatabase(tokens: ZohoTokens): Promise<void> {
    try {
      if (!this.currentUserEmail) {
        throw new Error('No current user email available for token storage');
      }

      const user = await prisma.user.findUnique({
        where: { email: this.currentUserEmail }
      });

      if (!user) {
        throw new Error(`User with email ${this.currentUserEmail} not found`);
      }

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
      console.warn('⚠️ Falling back to in-memory token storage');
    }
  }

  /**
   * Get tokens from database
   */
  private async getTokensFromDatabase(): Promise<ZohoTokens | null> {
    try {
      if (!this.currentUserEmail) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: this.currentUserEmail },
        include: { zohoTokens: true }
      });

      if (!user || !user.zohoTokens) {
        return null;
      }

      const tokenRecord = user.zohoTokens;
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

    if (isExpired) {
      return {
        success: true,
        authenticated: false,
        tokens: undefined,
        message: 'Token expired. Please refresh or re-authenticate.',
        authUrl: this.getAuthorizationUrl()
      };
    }

    // Get user information when authenticated
    let user: ZohoUser | undefined = undefined;
    try {
      const { zohoCRMService } = await import('./zohoCRM');
      const userResponse = await zohoCRMService.getCurrentUser();

      if (userResponse.success && userResponse.data?.users?.[0]) {
        user = userResponse.data.users[0];

        try {
          const orgResponse = await zohoCRMService.getOrganization();
          if (orgResponse.success && orgResponse.data) {
            user.organization = orgResponse.data.company_name || orgResponse.data.name;
          }
        } catch (orgError) {
          console.warn('Failed to fetch organization information:', orgError);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch user information:', error);
    }

    return {
      success: true,
      authenticated: true,
      tokens: tokens,
      user: user,
      message: 'Authentication active'
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

    if (this.isTokenExpired(tokens)) {
      if (!tokens.refresh_token) {
        throw new Error('Access token expired and no refresh token available. Please re-authenticate.');
      }

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
      if (!this.currentUserEmail) {
        console.log('⚠️ No current user to logout');
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email: this.currentUserEmail }
      });

      if (user) {
        await prisma.zohoAuthToken.delete({
          where: { userId: user.id }
        }).catch(() => {
          console.log('⚠️ No token to delete or token already deleted');
        });
        console.log('✅ Tokens cleared from database');
      }
      
      this.currentUserEmail = null;
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
   * Get current user with organization details
   */
  async getCurrentUserWithOrganization(): Promise<any> {
    try {
      if (!this.currentUserEmail) {
        throw new Error('No current user email available');
      }

      const user = await prisma.user.findUnique({
        where: { email: this.currentUserEmail },
        include: { 
          organization: true,
          zohoTokens: true 
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        zohoUserId: user.zohoUserId,
        role: user.role,
        organization: user.organization ? {
          id: user.organization.id,
          zohoOrgId: user.organization.zohoOrgId,
          name: user.organization.name,
          domain: user.organization.domain
        } : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error: any) {
      console.error('❌ Failed to get current user with organization:', error.message);
      throw error;
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(tokens: ZohoTokens): boolean {
    return Date.now() > tokens.expires_at;
  }

  /**
   * Trigger profile sync for an organization (usually called after admin login)
   */
  private async triggerProfileSync(organizationId: string): Promise<void> {
    try {
      console.log('🔄 Triggering profile sync for organization...');
      const { zohoProfileService } = await import('./zohoProfileService');
      zohoProfileService.triggerProfileSync(organizationId);
      console.log('🚀 Profile sync triggered in background');
      
    } catch (error: any) {
      console.error('❌ Failed to trigger profile sync:', error.message);
    }
  }

  /**
   * Trigger role sync for an organization (usually called after admin login)
   */
  private async triggerRoleSync(organizationId: string): Promise<void> {
    try {
      console.log('🔄 Triggering role sync for organization...');
      const { zohoRoleService } = await import('./zohoRoleService');
      zohoRoleService.triggerRoleSync(organizationId);
      console.log('🚀 Role sync triggered in background');
      
    } catch (error: any) {
      console.error('❌ Failed to trigger role sync:', error.message);
    }
  }

  /**
   * Trigger data sharing sync for an organization (usually called admin login)
   */
  private async triggerDataSharingSync(organizationId: string): Promise<void> {
    try {
      console.log('🔄 [DATA SHARING] Triggering data sharing sync for organization:', organizationId);
      const { zohoDataSharingService } = await import('./zohoDataSharingService');
      zohoDataSharingService.triggerDataSharingSync(organizationId);
      console.log('🚀 [DATA SHARING] Data sharing sync triggered in background');
    } catch (error: any) {
      console.error('❌ [DATA SHARING] Failed to trigger data sharing sync:', error.message);
    }
  }

  /**
   * Trigger user sync for an organization (usually called after admin login)
   */
  private async triggerUserSync(organizationId: string): Promise<void> {
    try {
      console.log('🔄 [USER SYNC] Triggering user sync for organization:', organizationId);
      const { zohoUserSyncService } = await import('./zohoUserSyncService');
      zohoUserSyncService.triggerUserSync(organizationId);
      console.log('🚀 [USER SYNC] User sync triggered in background');
    } catch (error: any) {
      console.error('❌ [USER SYNC] Failed to trigger user sync:', error.message);
    }
  }

  /**
   * Trigger contact sync for an organization (usually called after admin login)
   */
  private async triggerContactSync(organizationId: string): Promise<void> {
    try {
      console.log('🔄 [CONTACT SYNC] Triggering contact sync for organization:', organizationId);
      const { zohoSyncService } = await import('./zohoSyncService');
      zohoSyncService.triggerContactSync(organizationId);
      console.log('🚀 [CONTACT SYNC] Contact sync triggered in background');
    } catch (error: any) {
      console.error('❌ [CONTACT SYNC] Failed to trigger contact sync:', error.message);
    }
  }

  /**
   * Update user with profile and role IDs after sync completes (for admin users)
   */
  private async updateUserProfileAndRole(zohoUser: any, organizationId: string): Promise<void> {
    try {
      console.log('🔄 Waiting for sync to complete before assigning profile/role...');
      // Wait longer for the sync operations to complete (profiles and roles need to be synced first)
      await new Promise(resolve => setTimeout(resolve, 10000));

      await this.assignExistingProfileAndRole(zohoUser);
    } catch (error: any) {
      console.error('❌ Failed to update user profile/role:', error.message);
    }
  }

  /**
   * Assign existing profile and role to user if they exist in database
   */
  private async assignExistingProfileAndRole(zohoUser: any): Promise<void> {
    try {
      console.log('🔄 Checking for existing profile and role in database...');
      
      const updateData: any = { updatedAt: new Date() };
      let hasUpdates = false;

      // Only assign profile ID if it exists in database (to avoid FK constraint violation)
      if (zohoUser.profile?.id) {
        const profile = await prisma.zohoProfile.findUnique({
          where: { zohoProfileId: zohoUser.profile.id }
        });
        if (profile) {
          updateData.zohoProfileId = zohoUser.profile.id;
          hasUpdates = true;
          console.log(`✅ Found profile in database: ${profile.displayLabel} - Assigning ID: ${zohoUser.profile.id}`);
        } else {
          console.log(`⚠️ Profile ${zohoUser.profile.id} (${zohoUser.profile.name}) not found in database - skipping assignment`);
        }
      }

      // Only assign role ID if it exists in database (to avoid FK constraint violation)
      if (zohoUser.role?.id) {
        const role = await prisma.zohoRole.findUnique({
          where: { zohoRoleId: zohoUser.role.id }
        });
        if (role) {
          updateData.zohoRoleId = zohoUser.role.id;
          hasUpdates = true;
          console.log(`✅ Found role in database: ${role.displayLabel} - Assigning ID: ${zohoUser.role.id}`);
        } else {
          console.log(`⚠️ Role ${zohoUser.role.id} (${zohoUser.role.name}) not found in database - skipping assignment`);
        }
      }

      // Update user with profile and role IDs only if they exist in database
      if (hasUpdates) {
        await prisma.user.update({
          where: { email: zohoUser.email },
          data: updateData
        });
        
        console.log('✅ User profile and role IDs assigned successfully');
      } else {
        console.log('⚠️ No profile or role found in database to assign - will be assigned after sync completes');
      }
    } catch (error: any) {
      console.error('❌ Failed to assign existing profile/role:', error.message);
      throw error;
    }
  }
}

export const zohoAuthService = new ZohoAuthService();