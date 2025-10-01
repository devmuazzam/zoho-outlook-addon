'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Stack,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Home,
  Business,
  Refresh,
  Launch,
} from '@mui/icons-material';

interface AuthStatus {
  authenticated: boolean;
  user?: any;
  tokenInfo?: {
    tokenType: string;
    expiresAt: string;
    hasRefreshToken: boolean;
  };
  message?: string;
}

function AuthSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authResult = searchParams.get('auth');
  const message = searchParams.get('message');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/auth/zoho/status`);
      const result = await response.json();

      if (result.success) {
        setAuthStatus(result.data);
      } else {
        setError(result.message || 'Failed to check authentication status');
      }
    } catch (err: any) {
      console.error('Failed to check auth status:', err);
      setError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  };

  const goToOutlookApp = () => {
    router.push('/outlook-app');
  };

  const goToHome = () => {
    router.push('/');
  };

  const refreshStatus = () => {
    setLoading(true);
    setError(null);
    checkAuthStatus();
  };

  setTimeout(() => {
    window.close();
  }, 1000);

  return (
    <Box
      sx={{
        p: 3,
        maxWidth: 600,
        mx: 'auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ textAlign: 'center', color: 'primary.main', mb: 3 }}
      >
        Zoho CRM Authentication
      </Typography>

      {authResult === 'success' && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
          <Typography variant="h6" gutterBottom>
            Authentication Successful!
          </Typography>
          <Typography variant="body2">
            {message || 'You have successfully connected to Zoho CRM.'}
          </Typography>
        </Alert>
      )}

      {authResult === 'error' && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon />}>
          <Typography variant="h6" gutterBottom>
            Authentication Failed
          </Typography>
          <Typography variant="body2">
            {message || 'There was an error connecting to Zoho CRM.'}
          </Typography>
        </Alert>
      )}

      {loading && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="body1">
              Checking authentication status...
            </Typography>
          </CardContent>
        </Card>
      )}

      {!loading && authStatus && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              {authStatus.authenticated ? (
                <CheckCircle color="success" />
              ) : (
                <ErrorIcon color="error" />
              )}
              <Typography variant="h6">
                {authStatus.authenticated
                  ? 'Connected to Zoho CRM'
                  : 'Not Connected'}
              </Typography>
            </Box>

            {authStatus.message && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {authStatus.message}
              </Typography>
            )}

            {authStatus.tokenInfo && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Token Information:
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}
                >
                  <Chip
                    label={`Type: ${authStatus.tokenInfo.tokenType}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={
                      authStatus.tokenInfo.hasRefreshToken
                        ? 'Refresh Available'
                        : 'No Refresh Token'
                    }
                    size="small"
                    variant="outlined"
                    color={
                      authStatus.tokenInfo.hasRefreshToken
                        ? 'success'
                        : 'warning'
                    }
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Expires:{' '}
                  {new Date(authStatus.tokenInfo.expiresAt).toLocaleString()}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      <Stack spacing={2}>
        {authStatus?.authenticated && (
          <Button
            variant="contained"
            size="large"
            startIcon={<Launch />}
            onClick={goToOutlookApp}
            fullWidth
          >
            Open Outlook Add-in
          </Button>
        )}

        <Button
          variant="outlined"
          size="large"
          startIcon={<Home />}
          onClick={goToHome}
          fullWidth
        >
          Go to Home
        </Button>

        <Button
          variant="outlined"
          size="large"
          startIcon={<Refresh />}
          onClick={refreshStatus}
          fullWidth
        >
          Refresh Status
        </Button>
      </Stack>

      {authStatus?.authenticated && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Business />
              What's Next?
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Your Zoho CRM account is now connected! You can:
            </Typography>
            <Stack spacing={1}>
              <Typography
                variant="body2"
                component="li"
                sx={{ listStyleType: 'disc', ml: 2 }}
              >
                Use the Outlook Add-in to sync contacts and leads
              </Typography>
              <Typography
                variant="body2"
                component="li"
                sx={{ listStyleType: 'disc', ml: 2 }}
              >
                Access Zoho CRM data through our API
              </Typography>
              <Typography
                variant="body2"
                component="li"
                sx={{ listStyleType: 'disc', ml: 2 }}
              >
                Manage your CRM data seamlessly from Outlook
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Chip
          label="Powered by Zoho V2"
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
      </Box>
    </Box>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}
