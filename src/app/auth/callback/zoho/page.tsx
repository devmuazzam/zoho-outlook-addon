'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

function ZohoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('OAuth Error:', error, errorDescription);
      setTimeout(() => router.push('/outlook-app'), 3000);
      return;
    }

    setTimeout(() => router.push('/dashboard'), 2000);
  }, [router, searchParams]);

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
      <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Completing Authentication...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we finish setting up your Zoho CRM connection.
        </Typography>
      </Box>
    </Box>
  );
}

export default function ZohoCallbackPage() {
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
      <ZohoCallbackContent />
    </Suspense>
  );
}