'use client';

import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { ArrowBack, Help as HelpIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
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
          <HelpIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Help & Support
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Getting Started
            </Typography>
            <Typography variant="body1" paragraph>
              Welcome to the Zoho CRM Outlook Add-in! This tool helps you synchronize your Outlook contacts and leads with Zoho CRM.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Features
            </Typography>
            <Typography variant="body1" component="div">
              <ul>
                <li>Automatic synchronization between Outlook and Zoho CRM</li>
                <li>Real-time contact and lead management</li>
                <li>Secure OAuth authentication</li>
                <li>Admin controls for synchronization settings</li>
              </ul>
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Need More Help?
            </Typography>
            <Typography variant="body1">
              For additional support, please contact your system administrator or refer to the project documentation.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}