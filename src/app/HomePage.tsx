'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
} from '@mui/material';
import { PlayArrow, Storage, Palette } from '@mui/icons-material';
import { apiClient, ApiResponse } from '@/lib/api';

interface ApiData {
  message: string;
  endpoint: string;
  version: string;
}

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 8,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: 'white',
              mb: 2,
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            Welcome to{' '}
            <Typography component="span" variant="h2" sx={{ color: '#ffeb3b' }}>
              SMB Dynamics
            </Typography>
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
            mb: 6,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.location.href = '/zoho';
                      }
                    }}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                    }}
                    fullWidth
                  >
                    🔗 Open SMB Dynamics Integration
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
