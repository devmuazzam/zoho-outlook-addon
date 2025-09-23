'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Home,
  Business,
  Refresh,
  Launch,
  AdminPanelSettings,
  Sync,
  ToggleOn,
  ToggleOff,
  Dashboard as DashboardIcon,
  Person,
} from '@mui/icons-material';

interface AuthStatus {
  authenticated: boolean;
  user?: any;
  error?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [twoWaySyncEnabled, setTwoWaySyncEnabled] = useState(false);
  const [simpleSyncEnabled, setSimpleSyncEnabled] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/auth/zoho/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        if (result.data.authenticated && result.data.user) {
          setAuthStatus(result.data);
        } else {
          // Not authenticated, redirect to outlook app
          router.push('/outlook-app');
          return;
        }
      } else {
        setError(result.message || 'Failed to check authentication status');
        // On error, redirect to outlook app
        setTimeout(() => router.push('/outlook-app'), 3000);
      }
    } catch (err: any) {
      console.error('Failed to check auth status:', err);
      setError('Failed to check authentication status');
      // On error, redirect to outlook app
      setTimeout(() => router.push('/outlook-app'), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading Dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error || !authStatus?.authenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || 'Authentication required'}
            </Alert>
            <Typography variant="body1" color="text.secondary">
              Redirecting to Outlook App...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const userName = authStatus.user?.display_name ||
                   authStatus.user?.full_name ||
                   `${authStatus.user?.first_name || ''} ${authStatus.user?.last_name || ''}`.trim() ||
                   'User';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: { xs: '95vw', sm: 600, md: 700 },
          width: '100%',
          textAlign: 'center',
          boxShadow: 3,
          mx: { xs: 1, sm: 2 },
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
            <DashboardIcon
              sx={{
                fontSize: { xs: 48, sm: 56, md: 64 },
                color: 'primary.main',
                mb: { xs: 1.5, sm: 2 },
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                mb: 1,
                fontWeight: 'bold',
                color: 'primary.main',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              }}
            >
              Welcome to Zoho CRM Dashboard
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 2,
                fontWeight: 'medium',
                color: 'text.primary',
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.5rem' },
              }}
            >
              Hello, {userName}!
            </Typography>
          </Box>

          {/* User Information Card */}
          <Card variant="outlined" sx={{ mb: 3, bgcolor: 'background.paper' }}>
            <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                <Person color="primary" />
                User Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { sm: 'space-between' }, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: { sm: '80px' }, mb: { xs: 0.5, sm: 0 } }}>Name:</Typography>
                  <Typography variant="body2" fontWeight="medium">{userName}</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { sm: 'space-between' }, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: { sm: '80px' }, mb: { xs: 0.5, sm: 0 } }}>Email:</Typography>
                  <Typography variant="body2" fontWeight="medium" sx={{ wordBreak: 'break-word' }}>{authStatus.user?.email || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { sm: 'space-between' }, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: { sm: '80px' }, mb: { xs: 0.5, sm: 0 } }}>Role:</Typography>
                  <Typography variant="body2" fontWeight="medium">{authStatus.user?.role?.name || 'User'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { sm: 'space-between' }, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: { sm: '80px' }, mb: { xs: 0.5, sm: 0 } }}>Profile:</Typography>
                  <Typography variant="body2" fontWeight="medium">{authStatus.user?.profile?.name || 'Standard'}</Typography>
                </Box>
                {authStatus.user?.organization && (
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { sm: 'space-between' } }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: { sm: '80px' }, mb: { xs: 0.5, sm: 0 } }}>Organization:</Typography>
                    <Typography variant="body2" fontWeight="medium" sx={{ wordBreak: 'break-word' }}>{authStatus.user.organization}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card variant="outlined" sx={{ mb: 3, bgcolor: 'background.paper' }}>
            <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                <CheckCircle color="success" />
                Connection Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { sm: 'space-between' }, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: { sm: '100px' }, mb: { xs: 0.5, sm: 0 } }}>CRM Status:</Typography>
                  <Typography variant="body2" fontWeight="medium" color="success.main">Connected</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { sm: 'space-between' }, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: { sm: '100px' }, mb: { xs: 0.5, sm: 0 } }}>Token Expires:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {authStatus.tokenInfo ? new Date(authStatus.tokenInfo.expiresAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { sm: 'space-between' } }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: { sm: '100px' }, mb: { xs: 0.5, sm: 0 } }}>Refresh Token:</Typography>
                  <Typography variant="body2" fontWeight="medium" color={authStatus.tokenInfo?.hasRefreshToken ? 'success.main' : 'warning.main'}>
                    {authStatus.tokenInfo?.hasRefreshToken ? 'Available' : 'Not Available'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Admin Controls - At the bottom */}
          {(() => {
            const roleName = authStatus.user?.role?.name?.toLowerCase() || '';
            const isAdmin = roleName.includes('admin') || roleName.includes('administrator') || roleName.includes('super') || roleName === 'owner';
            console.log('User role check:', { roleName, isAdmin, fullRole: authStatus.user?.role?.name });

            return isAdmin && (
              <Card variant="outlined" sx={{ mt: 3, bgcolor: 'background.paper', borderColor: 'primary.main', borderWidth: 2 }}>
                <CardContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    <AdminPanelSettings />
                    Administrator Controls
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: { sm: 'space-between' }, gap: { xs: 2, sm: 0 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                        <Sync color="primary" />
                        <Box>
                          <Typography variant="body1" fontWeight="medium">Two-Way Sync</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Enable bidirectional synchronization between Outlook and Zoho CRM
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => setTwoWaySyncEnabled(!twoWaySyncEnabled)}
                        startIcon={twoWaySyncEnabled ? <ToggleOn /> : <ToggleOff />}
                        color={twoWaySyncEnabled ? 'success' : 'primary'}
                        size="large"
                        sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                      >
                        {twoWaySyncEnabled ? 'Enabled' : 'Disabled'}
                      </Button>
                    </Box>
                    {twoWaySyncEnabled && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          Two-way sync is now active. Changes in Outlook will sync to Zoho CRM and vice versa.
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })()}

          {/* Simple 2-way sync toggle at the end */}
          <Box sx={{ mt: 3, p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
              <Typography variant="body1" fontWeight="medium">
                Enable 2 way sync
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSimpleSyncEnabled(!simpleSyncEnabled)}
                sx={{
                  minWidth: { xs: '100%', sm: 'auto' },
                  px: 2,
                  color: simpleSyncEnabled ? 'success.main' : 'text.secondary',
                  borderColor: simpleSyncEnabled ? 'success.main' : 'divider'
                }}
              >
                {simpleSyncEnabled ? 'ON' : 'OFF'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
