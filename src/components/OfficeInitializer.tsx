'use client';

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

interface OfficeInitializerProps {
  children: React.ReactNode;
  onOfficeReady?: (context: any) => void;
}

export default function OfficeInitializer({ children, onOfficeReady }: OfficeInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initOffice = async () => {
      try {
        // Add ngrok bypass headers if we're in an iframe
        if (typeof window !== 'undefined' && window.parent !== window) {
          const meta = document.createElement('meta');
          meta.httpEquiv = 'ngrok-skip-browser-warning';
          meta.content = 'true';
          document.head.appendChild(meta);
        }

        // Check if Office.js is available
        if (typeof window !== 'undefined' && window.Office) {
          // Office.js is available, initialize it
          await new Promise<void>((resolve, reject) => {
            window.Office.onReady((info: any) => {
              if (mounted) {
                console.log('Office.js initialized:', info);
                onOfficeReady?.(info);
                setIsInitialized(true);
                setIsLoading(false);
                resolve();
              }
            });

            // Timeout after 10 seconds
            setTimeout(() => {
              if (mounted && !isInitialized) {
                reject(new Error('Office.js initialization timeout'));
              }
            }, 10000);
          });
        } else {
          // Office.js not available, check if we're in development
          if (process.env.NODE_ENV === 'development') {
            console.warn('Office.js not available - running in development mode');
            setIsInitialized(true);
            setIsLoading(false);
          } else {
            throw new Error('Office.js not available');
          }
        }
      } catch (error: any) {
        console.error('Office initialization error:', error);
        if (mounted) {
          setInitError(error.message || 'Failed to initialize Office.js');
          setIsLoading(false);
        }
      }
    };

    initOffice();

    return () => {
      mounted = false;
    };
  }, [onOfficeReady]);

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="200px"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Initializing Outlook Add-in...
        </Typography>
      </Box>
    );
  }

  if (initError) {
    return (
      <Box p={2}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Initialization Error
          </Typography>
          <Typography variant="body2">
            {initError}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please make sure this add-in is running in Microsoft Outlook.
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!isInitialized) {
    return (
      <Box p={2}>
        <Alert severity="warning">
          <Typography variant="body2">
            Office.js is not initialized. Please reload the add-in.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
}
