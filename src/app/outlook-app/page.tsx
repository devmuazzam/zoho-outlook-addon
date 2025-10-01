'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import {
  PersonAdd,
  Business,
  Email,
  Phone,
  Sync,
  CheckCircle,
  Error as ErrorIcon,
  Login,
  Security,
  Refresh,
} from '@mui/icons-material';
import OfficeInitializer from '../../components/OfficeInitializer';

declare global {
  interface Window {
    Office: any;
  }
}

interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  subject?: string;
  body?: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  zohoId?: string;
}

interface AuthStatus {
  authenticated: boolean;
  user?: any;
  error?: string;
}

const AUTH_CHECK_INTERVAL = 60000;
const POPUP_CHECK_INTERVAL = 500;
const AUTH_TIMEOUT = 300000;
const API_TIMEOUT = 30000;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

export default function OutlookPage() {
  const router = useRouter();
  const [contactInfo, setContactInfo] = useState<ContactInfo>({});
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    authenticated: false,
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [officeReady, setOfficeReady] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const authCheckRef = useRef<NodeJS.Timeout | null>(null);
  const popupRef = useRef<Window | null>(null);
  const dialogRef = useRef<any>(null);
  const isAuthCheckingRef = useRef(false);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const redirectStartedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (authCheckRef.current) {
        clearInterval(authCheckRef.current);
      }
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      if (dialogRef.current) {
        try {
          dialogRef.current.close();
        } catch (e) {
          console.log('Dialog already closed');
        }
      }
      redirectStartedRef.current = false;
    };
  }, []);

  const fetchWithTimeout = useCallback(
    async (url: string, options: RequestInit = {}, timeout = API_TIMEOUT) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
    },
    []
  );

  const checkAuthStatus = useCallback(
    async (silent = false) => {
      if (isAuthCheckingRef.current) {
        console.log('Auth check already in progress, skipping...');
        return;
      }

      if (!mountedRef.current) return;

      isAuthCheckingRef.current = true;
      if (!silent) setIsCheckingAuth(true);

      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetchWithTimeout(
          `${backendUrl}/auth/zoho/status`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
            credentials: 'include',
          }
        );

        if (!mountedRef.current) return;

        const result = await response.json();

        if (result.success) {
          const wasAuthenticated = authStatus.authenticated;
          setAuthStatus(result.data);
          setError(null);
          retryCountRef.current = 0;

          if (!wasAuthenticated && result.data.authenticated && result.data.user && !redirectStartedRef.current) {
            console.log('Authentication successful, redirecting to dashboard in 3 seconds...');
            redirectStartedRef.current = true;
            setRedirectCountdown(3);

            const countdownInterval = setInterval(() => {
              setRedirectCountdown((prev) => {
                if (prev === null || prev <= 1) {
                  clearInterval(countdownInterval);
                  return null;
                }
                return prev - 1;
              });
            }, 1000);

            setTimeout(() => {
              if (mountedRef.current) {
                console.log('3 seconds elapsed, redirecting to dashboard...');
                clearInterval(countdownInterval);
                setRedirectCountdown(null);
                router.push('/dashboard');
              }
            }, 3000);
          }
        } else {
          if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
            retryCountRef.current++;
            console.log(
              `Retrying auth check (${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})...`
            );
            setTimeout(() => {
              if (mountedRef.current) checkAuthStatus(silent);
            }, RETRY_DELAY * retryCountRef.current);
          } else {
            setAuthStatus({ authenticated: false, error: result.message });
            redirectStartedRef.current = false;
            retryCountRef.current = 0;
          }
        }
      } catch (err: any) {
        console.error('Failed to check auth status:', err);
        if (!mountedRef.current) return;

        if (
          retryCountRef.current < MAX_RETRY_ATTEMPTS &&
          err.message !== 'Request timeout'
        ) {
          retryCountRef.current++;
          setTimeout(() => {
            if (mountedRef.current) checkAuthStatus(silent);
          }, RETRY_DELAY * retryCountRef.current);
        } else {
          setAuthStatus({
            authenticated: false,
            error:
              err.message === 'Request timeout'
                ? 'Connection timeout - please check your network'
                : 'Failed to check authentication status',
          });
          retryCountRef.current = 0;
        }
      } finally {
        isAuthCheckingRef.current = false;
        if (!silent && mountedRef.current) setIsCheckingAuth(false);
      }
    },
    [fetchWithTimeout]
  );

  const handleOfficeReady = useCallback(
    (info: any) => {
      console.log('Office.js ready - Host:', info?.host);
      setOfficeReady(true);

      if (info?.host === window.Office?.HostType?.Outlook) {
        extractContactInfo();
      } else {
        console.warn('Not running in Outlook, using demo data');
        setContactInfo({
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          company: 'Acme Corp',
          subject: 'Demo Email Subject',
          body: 'This is a demo email body for testing the Outlook add-in.',
        });
      }

      checkAuthStatus(false);
    },
    [checkAuthStatus]
  );

  useEffect(() => {
    if (!officeReady) return;

    authCheckRef.current = setInterval(() => {
      if (mountedRef.current && !isAuthenticating) {
        checkAuthStatus(true);
      }
    }, AUTH_CHECK_INTERVAL);

    return () => {
      if (authCheckRef.current) {
        clearInterval(authCheckRef.current);
      }
    };
  }, [officeReady, isAuthenticating, checkAuthStatus]);

  const authenticateWithZoho = async () => {
    if (isAuthenticating) {
      console.log('Authentication already in progress');
      return;
    }

    authenticateWithPopup();
  };

  const authenticateWithOfficeDialog = async () => {
    setIsAuthenticating(true);
    setError(null);
    setSyncResult(null);

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetchWithTimeout(`${backendUrl}/auth/zoho/login`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (!result.success || !result.data?.authUrl) {
        throw new Error(result.message || 'Failed to get auth URL');
      }

      const authUrl = result.data.authUrl;
      console.log('Opening Office Dialog with URL:', authUrl);

      if (dialogRef.current) {
        try {
          dialogRef.current.close();
        } catch (e) {
          console.log('Previous dialog already closed');
        }
        dialogRef.current = null;
      }

      window.Office.context.ui.displayDialogAsync(
        authUrl,
        { height: 70, width: 70, displayInIframe: false },
        (asyncResult: any) => {
          if (!mountedRef.current) return;

          if (
            asyncResult?.status === window.Office.AsyncResultStatus.Succeeded
          ) {
            const dialog = asyncResult.value;
            dialogRef.current = dialog;

            const messageHandler = async (arg: any) => {
              if (!mountedRef.current) return;

              try {
                const data = JSON.parse(arg.message);

                if (data.success && data.code) {
                  try {
                    const tokenResponse = await fetchWithTimeout(
                      `${backendUrl}/auth/zoho/callback?code=${encodeURIComponent(data.code)}`,
                      {
                        method: 'GET',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                      }
                    );

                    const tokenResult = await tokenResponse.json();

                    if (tokenResponse.ok && tokenResult.success) {
                      setAuthStatus({
                        authenticated: true,
                        user: tokenResult.user,
                      });
                      setSyncResult({
                        success: true,
                        message: 'Successfully authenticated with Zoho CRM!',
                      });
                      setError(null);
                    } else {
                      setError(
                        tokenResult.message ||
                          'Failed to complete authentication'
                      );
                    }
                  } catch (tokenError: any) {
                    console.error('Token exchange error:', tokenError);
                    setError('Failed to exchange authorization code');
                  }
                } else if (data.error) {
                  setError(data.error);
                }
              } catch (e) {
                console.error('Failed to parse dialog response:', e);
                setError('Invalid authentication response');
              } finally {
                try {
                  dialog.close();
                } catch (e) {
                  console.log('Dialog already closed');
                }
                dialogRef.current = null;
                setIsAuthenticating(false);
              }
            };

            const eventHandler = (arg: any) => {
              if (!mountedRef.current) return;

              const errorMessages: { [key: number]: string } = {
                12006: 'Authentication cancelled by user',
                12004:
                  'Zoho domain not in manifest. Please contact administrator.',
                12003: 'HTTPS required for dialog',
                12002: 'Dialog already opened',
                12001: 'User navigated away',
              };

              const errorMessage =
                errorMessages[arg?.error] ||
                `Dialog error: ${arg?.error || 'Unknown'}`;
              setError(errorMessage);
              dialogRef.current = null;
              setIsAuthenticating(false);
            };

            dialog.addEventHandler(
              window.Office.EventType.DialogMessageReceived,
              messageHandler
            );
            dialog.addEventHandler(
              window.Office.EventType.DialogEventReceived,
              eventHandler
            );

            setTimeout(() => {
              if (dialogRef.current && mountedRef.current) {
                try {
                  dialogRef.current.close();
                } catch (e) {
                  console.log('Dialog already closed');
                }
                dialogRef.current = null;
                setError('Authentication timeout');
                setIsAuthenticating(false);
              }
            }, AUTH_TIMEOUT);
          } else {
            const errorCode = asyncResult?.error?.code;
            const errorMessage =
              errorCode === 12004
                ? 'Zoho domain not included in Office manifest'
                : `Failed to open dialog: ${asyncResult?.error?.message || 'Unknown error'}`;
            setError(errorMessage);
            setIsAuthenticating(false);
          }
        }
      );
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(`Authentication failed: ${err.message || 'Unknown error'}`);
      setIsAuthenticating(false);
    }
  };

  const authenticateWithPopup = async () => {
    setIsAuthenticating(true);
    setError(null);
    setSyncResult(null);

    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetchWithTimeout(`${backendUrl}/auth/zoho/login`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (!result.success || !result.data?.authUrl) {
        throw new Error(result.message || 'Failed to get auth URL');
      }

      const authUrl = result.data.authUrl;

      const popup = window.open(
        authUrl,
        'zoho-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      popupRef.current = popup;

      const checkClosed = setInterval(() => {
        if (!mountedRef.current) {
          clearInterval(checkClosed);
          return;
        }

        if (popup.closed) {
          clearInterval(checkClosed);
          popupRef.current = null;
          setIsAuthenticating(false);
          setTimeout(() => {
            if (mountedRef.current) checkAuthStatus(false);
          }, 1000);
        }
      }, POPUP_CHECK_INTERVAL);

      setTimeout(() => {
        if (!popup.closed && mountedRef.current) {
          popup.close();
          clearInterval(checkClosed);
          popupRef.current = null;
          setIsAuthenticating(false);
          setError('Authentication timeout');
        }
      }, AUTH_TIMEOUT);
    } catch (err: any) {
      console.error('Popup authentication error:', err);
      setError(`Authentication failed: ${err.message || 'Unknown error'}`);
      setIsAuthenticating(false);
      popupRef.current = null;
    }
  };

  const extractContactInfo = () => {
    if (!window.Office?.context?.mailbox?.item) {
      console.warn('No mailbox item available');
      return;
    }

    try {
      const item = window.Office.context.mailbox.item;
      const info: ContactInfo = {};

      if (item.from) {
        info.name = item.from.displayName || '';
        info.email = item.from.emailAddress || '';
      }

      if (item.subject) {
        info.subject = item.subject;
      }

      if (item.body && typeof item.body.getAsync === 'function') {
        item.body.getAsync(window.Office.CoercionType.Text, (result: any) => {
          if (
            result?.status === window.Office.AsyncResultStatus.Succeeded &&
            mountedRef.current
          ) {
            setContactInfo((prev) => ({ ...prev, body: result.value }));
          }
        });
      }

      setContactInfo(info);
    } catch (err) {
      console.error('Error extracting contact info:', err);
      setError('Failed to extract contact information from email');
    }
  };

  const syncToZoho = async () => {
    if (!authStatus.authenticated) {
      setError('Please authenticate with Zoho CRM first');
      return;
    }

    if (!contactInfo.email) {
      setError('No email address found in contact information');
      return;
    }

    setIsLoading(true);
    setSyncResult(null);
    setError(null);

    try {
      const contactData = {
        First_Name: contactInfo.name?.split(' ')[0] || 'Unknown',
        Last_Name: contactInfo.name?.split(' ').slice(1).join(' ') || 'Contact',
        Email: contactInfo.email,
        Phone: contactInfo.phone || '',
        Company: contactInfo.company || '',
        Lead_Source: 'Outlook Add-in',
        Description: contactInfo.subject
          ? `Subject: ${contactInfo.subject}\n\n${contactInfo.body?.substring(0, 500) || ''}...`
          : contactInfo.body?.substring(0, 500) || '',
      };

      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetchWithTimeout(
        `${backendUrl}/api/zoho/crm/leads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ data: [contactData] }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setSyncResult({
          success: true,
          message: 'Lead successfully synced to Zoho CRM!',
          zohoId: result.data?.id || result.data?.[0]?.details?.id,
        });
      } else {
        throw new Error(
          result.message || result.error || 'Failed to sync to Zoho'
        );
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      setSyncResult({
        success: false,
        message: `Failed to sync: ${errorMessage}`,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const syncContactOnly = async () => {
    if (!authStatus.authenticated) {
      setError('Please authenticate with Zoho CRM first');
      return;
    }

    if (!contactInfo.email) {
      setError('No email address found in contact information');
      return;
    }

    setIsLoading(true);
    setSyncResult(null);
    setError(null);

    try {
      const contactData = {
        First_Name: contactInfo.name?.split(' ')[0] || 'Unknown',
        Last_Name: contactInfo.name?.split(' ').slice(1).join(' ') || 'Contact',
        Email: contactInfo.email,
        Phone: contactInfo.phone || '',
        Account_Name: contactInfo.company || '',
        Description: `Added from Outlook on ${new Date().toLocaleDateString()}`,
      };

      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetchWithTimeout(
        `${backendUrl}/api/zoho/crm/contacts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ data: [contactData] }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setSyncResult({
          success: true,
          message: 'Contact successfully added to Zoho CRM!',
          zohoId: result.data?.id || result.data?.[0]?.details?.id,
        });
      } else {
        throw new Error(
          result.message || result.error || 'Failed to add contact'
        );
      }
    } catch (err: any) {
      console.error('Contact sync error:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      setSyncResult({
        success: false,
        message: `Failed to add contact: ${errorMessage}`,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const mainContent = (
    <Box sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {syncResult && (
        <Alert
          severity={syncResult.success ? 'success' : 'error'}
          sx={{ mb: 2 }}
          icon={syncResult.success ? <CheckCircle /> : <ErrorIcon />}
          onClose={() => setSyncResult(null)}
        >
          {syncResult.message}
          {syncResult.zohoId && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Zoho ID: {syncResult.zohoId}
            </Typography>
          )}
        </Alert>
      )}

      {!authStatus.authenticated && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            textAlign: 'center',
          }}
        >
          <Image
            src="/icons/logo.png"
            alt="SMB Dynamics Logo"
            width={120}
            height={120}
            style={{
              marginBottom: '24px',
            }}
          />
          <Button
            variant="contained"
            size="large"
            onClick={authenticateWithZoho}
            disabled={isAuthenticating || isCheckingAuth}
            startIcon={
              isAuthenticating ? <CircularProgress size={20} /> : <Login />
            }
            sx={{
              minWidth: '200px',
              py: 1.5,
              fontSize: '1.1rem',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)',
              },
            }}
          >
            {isAuthenticating ? 'Authenticating...' : 'Login with SMB Dynamics'}
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <OfficeInitializer onOfficeReady={handleOfficeReady}>
      {mainContent}
    </OfficeInitializer>
  );
}
