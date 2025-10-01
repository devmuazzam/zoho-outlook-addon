'use client';

import { Box, Typography, Card, CardContent, Button, Divider } from '@mui/material';
import { ArrowBack, Support as SupportIcon, Email, Phone } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
            variant="outlined"
          >
            Back
          </Button>
          <SupportIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Support
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Contact Support
            </Typography>
            <Typography variant="body1" paragraph>
              If you're experiencing issues with the Zoho CRM Outlook Add-in, please contact our support team.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Email color="primary" />
                <Box>
                  <Typography variant="body1" fontWeight="medium">Email Support</Typography>
                  <Typography variant="body2" color="text.secondary">
                    support@smb-dynamics-integration.com
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Phone color="primary" />
                <Box>
                  <Typography variant="body1" fontWeight="medium">Phone Support</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Monday - Friday, 9 AM - 5 PM EST
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Troubleshooting
            </Typography>
            <Typography variant="body1" component="div">
              <ul>
                <li>Ensure you have a valid Zoho CRM account</li>
                <li>Check your internet connection</li>
                <li>Try refreshing the Outlook add-in</li>
                <li>Clear your browser cache and cookies</li>
              </ul>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}