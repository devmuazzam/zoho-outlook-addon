'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Home,
  Business,
  Refresh,
  Launch,
  ToggleOn,
  ToggleOff,
  Person,
} from '@mui/icons-material';

interface AuthStatus {
  authenticated: boolean;
  user?: any;
  dbUser?: any;
  error?: string;
  tokenInfo?: any;
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
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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

  const userName =
    authStatus.user?.display_name ||
    authStatus.user?.full_name ||
    `${authStatus.user?.first_name || ''} ${authStatus.user?.last_name || ''}`.trim() ||
    'User';

  // Check if user is Administrator
  const roleName = authStatus.user?.profile?.name?.toLowerCase() || '';
  const isAdmin =
    roleName.includes('admin') ||
    roleName.includes('administrator') ||
    roleName.includes('super') ||
    roleName === 'owner';

  // Check if non-admin user has organization in database
  const hasOrganization = authStatus.dbUser?.organization !== null;
  const shouldShowContactAdmin = !isAdmin && !hasOrganization;

  // Helper function to get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
            <Image
              src="/icons/logo.png"
              alt="Logo"
              width={100}
              height={250}
              style={{
                margin: '0 auto',
                marginBottom: '16px',
                display: 'block',
                height: '250px !important',
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                mb: 1,
                fontWeight: 'bold',
                color: 'black',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              }}
            >
              Zoho for <span style={{ color: 'red' }}>smb/dynamics</span>
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

          {/* Show contact administrator message for non-admin users without organization */}
          {shouldShowContactAdmin && (
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                textAlign: 'left',
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
            >
              <Typography variant="h6" gutterBottom>
                Access Pending
              </Typography>
              <Typography variant="body2" paragraph>
                Your account has been authenticated, but you need to wait for
                your organization administrator to complete the initial setup.
              </Typography>
              <Typography variant="body2">
                Please contact your Zoho CRM administrator to complete the
                organization setup process.
              </Typography>
            </Alert>
          )}

          {/* Only show user details and admin controls if user has access */}
          {!shouldShowContactAdmin && (
            <>
              {/* Compact User Information Card */}
              <Card
                variant="outlined"
                sx={{
                  mb: 3,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                {/* Compact Header */}
                <Box
                  sx={{
                    background:
                      'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    color: 'white',
                    p: 2,
                    textAlign: 'center',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      width: 48,
                      height: 48,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      mx: 'auto',
                      mb: 1,
                    }}
                  >
                    {getUserInitials(userName)}
                  </Avatar> 
                </Box>

                <CardContent sx={{ p: 2 }}>
                  {/* Stacked User Details */}
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    {/* Email */}
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          fontWeight: 'medium',
                          mb: 0.5,
                        }}
                      >
                        Email:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.9rem',
                          lineHeight: 1.3,
                          wordBreak: 'break-all',
                          color: 'text.primary',
                        }}
                      >
                        {authStatus.user?.email || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Role */}
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          fontWeight: 'medium',
                          mb: 0.5,
                        }}
                      >
                        Role:
                      </Typography>
                      <Box>
                        <Chip
                          label={
                            authStatus.dbUser?.role ||
                            authStatus.user?.role?.name ||
                            'User'
                          }
                          size="small"
                          color={isAdmin ? 'error' : 'primary'}
                          variant="outlined"
                          sx={{
                            fontWeight: 'medium',
                            fontSize: '0.75rem',
                            height: 24,
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Profile */}
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          fontWeight: 'medium',
                          mb: 0.5,
                        }}
                      >
                        Profile:
                      </Typography>
                      <Box>
                        <Chip
                          label={authStatus.user?.profile?.name || 'Standard'}
                          size="small"
                          color="secondary"
                          variant="filled"
                          sx={{
                            fontWeight: 'medium',
                            fontSize: '0.75rem',
                            height: 24,
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Organization */}
                    {(authStatus.dbUser?.organization ||
                      authStatus.user?.organization) && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            fontWeight: 'medium',
                            mb: 0.5,
                          }}
                        >
                          Organization:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          sx={{
                            fontSize: '0.9rem',
                            lineHeight: 1.3,
                            wordBreak: 'break-word',
                            color: 'success.main',
                          }}
                        >
                          {authStatus.dbUser?.organization?.name ||
                            authStatus.user?.organization}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                </CardContent>
              </Card>

              {/* Admin Controls */}
              {isAdmin && (
                <Card
                  variant="outlined"
                  sx={{
                    mt: 3,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  {/* Compact Header */}
                  <Box
                    sx={{
                      background:
                        'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      color: 'white',
                      p: 2,
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        lineHeight: 1.2,
                      }}
                    >
                      Administrator Controls
                    </Typography>
                  </Box>

                  <CardContent sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          fontWeight: 'medium',
                        }}
                      >
                        Two-Way Sync:
                      </Typography>
                      <IconButton
                        onClick={() =>
                          setTwoWaySyncEnabled(!twoWaySyncEnabled)
                        }
                        color={twoWaySyncEnabled ? 'primary' : 'success'}
                        size="large"
                      >
                        {twoWaySyncEnabled ? <ToggleOn /> : <ToggleOff />}
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
