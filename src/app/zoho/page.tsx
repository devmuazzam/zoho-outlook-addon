"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Login, 
  Logout, 
  Refresh, 
  Person
} from '@mui/icons-material';
import { zohoAPIClient, ZohoAuthStatus, ZohoUser } from '@/lib/zohoAPI';

export default function ZohoCRMPage() {

  const [authStatus, setAuthStatus] = useState<ZohoAuthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<ZohoUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check auth status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check URL params for auth callback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    const messageParam = urlParams.get('message');

    if (authParam === 'success') {
      setSuccess(messageParam || 'Authentication successful');
      checkAuthStatus();
      // Clean URL by removing query params without using history API
      if (window.location.search) {
        const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
        window.history.replaceState(null, '', newUrl);
      }
    } else if (authParam === 'error') {
      setError(messageParam || 'Authentication failed');
      // Clean URL by removing query params without using history API
      if (window.location.search) {
        const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
        window.history.replaceState(null, '', newUrl);
      }
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await zohoAPIClient.getAuthStatus();
      if (response.success) {
        setAuthStatus(response.data!);
        if (response.data!.authenticated) {
          loadUserData();
        }
      }
    } catch (error: any) {
      setError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await zohoAPIClient.initiateLogin();
      if (response.success && response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error: any) {
      setError('Failed to initiate login');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const response = await zohoAPIClient.logout();
      if (response.success) {
        setAuthStatus({ authenticated: false, message: 'Logged out successfully' });
        setCurrentUser(null);
        setSuccess('Logged out successfully');
      }
    } catch (error: any) {
      setError('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setLoading(true);
      const response = await zohoAPIClient.refreshToken();
      if (response.success) {
        setSuccess('Token refreshed successfully');
        checkAuthStatus();
      }
    } catch (error: any) {
      setError('Token refresh failed');
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      console.log('🔄 Loading user data...');
      const userResponse = await zohoAPIClient.getCurrentUser();
      console.log('📡 User response:', userResponse);
      
      if (userResponse.success && userResponse.data?.users?.[0]) {
        setCurrentUser(userResponse.data.users[0]);
        console.log('✅ User data loaded:', userResponse.data.users[0]);
      } else {
        console.warn('⚠️ No user data in response:', userResponse);
        setError('No user information found');
      }
    } catch (error: any) {
      console.error('❌ Failed to load user data:', error);
      setError('Failed to load user information: ' + error.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
        🔗 Zoho CRM Integration
      </Typography>

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Authentication Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Authentication Status</Typography>
            <Chip 
              label={authStatus?.authenticated ? 'Connected' : 'Not Connected'}
              color={authStatus?.authenticated ? 'success' : 'error'}
              icon={authStatus?.authenticated ? <Person /> : <Login />}
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {authStatus?.message || 'Checking authentication status...'}
          </Typography>

          {authStatus?.tokenInfo && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Token expires:</strong> {new Date(authStatus.tokenInfo.expiresAt).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Refresh token available:</strong> {authStatus.tokenInfo.hasRefreshToken ? 'Yes' : 'No'}
              </Typography>
            </Box>
          )}

          {currentUser && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="primary.contrastText">
                <strong>Logged in as:</strong> {currentUser.full_name} ({currentUser.email})
              </Typography>
              {currentUser.role && (
                <Typography variant="body2" color="primary.contrastText">
                  <strong>Role:</strong> {currentUser.role.name}
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            {!authStatus?.authenticated ? (
              <Button
                variant="contained"
                startIcon={<Login />}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Login with Zoho CRM'}
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleRefreshToken}
                  disabled={loading}
                >
                  Refresh Token
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Logout />}
                  onClick={handleLogout}
                  disabled={loading}
                >
                  Logout
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* User Info Section */}
      {authStatus?.authenticated && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Current User Information</Typography>
              <Button variant="outlined" onClick={loadUserData} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Refresh User Info'}
              </Button>
            </Box>
            
            {currentUser ? (
              <Box>
                <Typography><strong>Name:</strong> {currentUser.full_name}</Typography>
                <Typography><strong>Email:</strong> {currentUser.email}</Typography>
                <Typography><strong>User ID:</strong> {currentUser.id}</Typography>
                {currentUser.role && (
                  <Typography><strong>Role:</strong> {currentUser.role.name}</Typography>
                )}
                {currentUser.profile && (
                  <Typography><strong>Profile:</strong> {currentUser.profile.name}</Typography>
                )}
              </Box>
            ) : (
              <Typography color="text.secondary">
                {loading ? 'Loading user information...' : 'Click "Refresh User Info" to load user information'}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

    </Box>
  );
}