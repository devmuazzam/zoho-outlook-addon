"use client";

import { useEffect, useState } from "react";
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
  Stack
} from '@mui/material';
import { 
  PersonAdd, 
  Business, 
  Email, 
  Phone, 
  Sync,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';

// Office.js types
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

export default function OutlookPage() {
  const [isOfficeInitialized, setIsOfficeInitialized] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({});
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Add ngrok bypass headers if we're in an iframe (Office add-in context)
    if (window.parent !== window) {
      // We're in an iframe, add headers to document
      const meta = document.createElement('meta');
      meta.httpEquiv = 'ngrok-skip-browser-warning';
      meta.content = 'true';
      document.head.appendChild(meta);
    }

    // Initialize Office.js
    if (typeof window !== 'undefined' && window.Office) {
      window.Office.onReady((info: any) => {
        if (info.host === window.Office.HostType.Outlook) {
          setIsOfficeInitialized(true);
          extractContactInfo();
        }
      });
    } else {
      // For development/testing without Outlook
      setIsOfficeInitialized(true);
      setContactInfo({
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1-555-0123",
        company: "Acme Corp",
        subject: "Demo Email Subject",
        body: "This is a demo email body for testing the Outlook add-in."
      });
    }
  }, []);

  const extractContactInfo = () => {
    if (!window.Office) return;

    try {
      const item = window.Office.context.mailbox.item;
      const info: ContactInfo = {};

      // Extract sender information
      if (item.from) {
        info.name = item.from.displayName;
        info.email = item.from.emailAddress;
      }

      // Extract subject and body
      info.subject = item.subject;
      
      // Get body (simplified - in real implementation you'd handle HTML/text)
      if (item.body && item.body.getAsync) {
        item.body.getAsync(
          window.Office.CoercionType.Text,
          (result: any) => {
            if (result.status === window.Office.AsyncResultStatus.Succeeded) {
              setContactInfo(prev => ({ ...prev, body: result.value }));
            }
          }
        );
      }

      setContactInfo(info);
    } catch (err) {
      setError('Failed to extract contact information from email');
      console.error('Error extracting contact info:', err);
    }
  };

  const syncToZoho = async () => {
    setIsLoading(true);
    setSyncResult(null);
    setError(null);

    try {
      // Prepare contact data for Zoho
      const contactData = {
        first_name: contactInfo.name?.split(' ')[0] || '',
        last_name: contactInfo.name?.split(' ').slice(1).join(' ') || '',
        email: contactInfo.email,
        phone: contactInfo.phone,
        company: contactInfo.company,
        source: 'Outlook Add-in',
        description: `Subject: ${contactInfo.subject}\n\nBody: ${contactInfo.body?.substring(0, 500)}...`
      };

      // Call your backend API to sync with Zoho
      const response = await fetch('/api/zoho/crm/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      const result = await response.json();

      if (response.ok) {
        setSyncResult({
          success: true,
          message: 'Contact successfully synced to Zoho CRM!',
          zohoId: result.data?.id
        });
      } else {
        throw new Error(result.message || 'Failed to sync to Zoho');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setSyncResult({
        success: false,
        message: `Failed to sync: ${errorMessage}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncContactOnly = async () => {
    setIsLoading(true);
    setSyncResult(null);
    setError(null);

    try {
      const contactData = {
        first_name: contactInfo.name?.split(' ')[0] || '',
        last_name: contactInfo.name?.split(' ').slice(1).join(' ') || '',
        email: contactInfo.email,
        phone: contactInfo.phone,
        company: contactInfo.company,
        source: 'Outlook Add-in'
      };

      const response = await fetch('/api/zoho/crm/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      const result = await response.json();

      if (response.ok) {
        setSyncResult({
          success: true,
          message: 'Contact successfully added to Zoho CRM!',
          zohoId: result.data?.id
        });
      } else {
        throw new Error(result.message || 'Failed to add contact to Zoho');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setSyncResult({
        success: false,
        message: `Failed to add contact: ${errorMessage}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOfficeInitialized) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>Initializing Outlook Add-in...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', color: 'primary.main' }}>
        Zoho CRM Integration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {syncResult && (
        <Alert 
          severity={syncResult.success ? "success" : "error"} 
          sx={{ mb: 2 }}
          icon={syncResult.success ? <CheckCircle /> : <ErrorIcon />}
        >
          {syncResult.message}
          {syncResult.zohoId && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Zoho ID: {syncResult.zohoId}
            </Typography>
          )}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
            Contact Information
          </Typography>
          
          <Stack spacing={1}>
            {contactInfo.name && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonAdd fontSize="small" />
                <Typography variant="body2">{contactInfo.name}</Typography>
              </Box>
            )}
            
            {contactInfo.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email fontSize="small" />
                <Typography variant="body2">{contactInfo.email}</Typography>
              </Box>
            )}
            
            {contactInfo.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone fontSize="small" />
                <Typography variant="body2">{contactInfo.phone}</Typography>
              </Box>
            )}
            
            {contactInfo.company && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business fontSize="small" />
                <Typography variant="body2">{contactInfo.company}</Typography>
              </Box>
            )}
          </Stack>

          {contactInfo.subject && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                Email Subject
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {contactInfo.subject}
              </Typography>
            </>
          )}
        </CardContent>
      </Card>

      <Stack spacing={2}>
        <Button
          variant="contained"
          fullWidth
          onClick={syncToZoho}
          disabled={isLoading || !contactInfo.email}
          startIcon={isLoading ? <CircularProgress size={20} /> : <Sync />}
        >
          {isLoading ? 'Syncing...' : 'Sync as Lead'}
        </Button>

        <Button
          variant="outlined"
          fullWidth
          onClick={syncContactOnly}
          disabled={isLoading || !contactInfo.email}
          startIcon={<PersonAdd />}
        >
          Add as Contact
        </Button>
      </Stack>

      {!contactInfo.email && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No email address found. Please select an email with contact information.
        </Alert>
      )}

      <Box sx={{ mt: 2, textAlign: 'center' }}>
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
