"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { Button, Card, CardContent, Typography, Box, Chip, Alert } from '@mui/material';
import { PlayArrow, Storage, Palette } from '@mui/icons-material';
import { apiClient, ApiResponse } from '@/lib/api';

interface ApiData {
  message: string;
  endpoint: string;
  version: string;
}

export default function HomePage() {
  const [data, setData] = useState<ApiResponse<ApiData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for authentication status from URL parameters
    const auth = searchParams.get('auth');
    const message = searchParams.get('message');
    
    if (auth && message) {
      setAuthMessage({
        type: auth as 'success' | 'error',
        message: decodeURIComponent(message)
      });
      
      // Clear the URL parameters after showing the message
      const url = new URL(window.location.href);
      url.searchParams.delete('auth');
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
      
      // Auto-hide message after 5 seconds
      setTimeout(() => {
        setAuthMessage(null);
      }, 5000);
    }
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<ApiData>('/api/hello');
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 8,
      px: 2
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Authentication Status Alert */}
        {authMessage && (
          <Box sx={{ mb: 4 }}>
            <Alert 
              severity={authMessage.type === 'success' ? 'success' : 'error'}
              onClose={() => setAuthMessage(null)}
              sx={{ borderRadius: 2 }}
            >
              {authMessage.message}
            </Alert>
          </Box>
        )}

        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" component="h1" sx={{ 
            fontWeight: 'bold', 
            color: 'white',
            mb: 2,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            Welcome to{" "}
            <Typography component="span" variant="h2" sx={{ color: '#ffeb3b' }}>
              Zoho V2
            </Typography>
          </Typography>
          <Typography variant="h6" sx={{ 
            color: 'rgba(255,255,255,0.9)', 
            maxWidth: 600, 
            mx: 'auto' 
          }}>
            A full-stack Next.js application with separate frontend and backend servers,
            built with modern technologies and best practices.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 6 }}>
          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
                  🧪 Test Backend Connection
                </Typography>
                
                <Button
                  variant="contained"
                  onClick={fetchData}
                  disabled={loading}
                  startIcon={<PlayArrow />}
                  sx={{ 
                    mb: 3,
                    py: 1.5,
                    px: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem'
                  }}
                  fullWidth
                >
                  {loading ? "Loading..." : "Fetch Data from Backend"}
                </Button>

                {data && (
                  <Card sx={{ 
                    bgcolor: 'success.light', 
                    color: 'success.contrastText',
                    borderRadius: 2
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        ✅ Response Received:
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        {data.data?.message}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Version: {data.data?.version} | Timestamp: {new Date(data.timestamp).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    href="/zoho"
                    sx={{ 
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem'
                    }}
                    fullWidth
                  >
                    🔗 Open Zoho CRM Integration
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
                  🏗️ Technology Stack
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PlayArrow color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Frontend
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Next.js 14, React 18, TypeScript
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Storage color="success" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Backend
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Express.js, Node.js, TypeScript
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Palette color="secondary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        UI/Styling
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Material-UI, Tailwind CSS
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
                        <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
              🚀 Quick Start Guide
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Chip label="Step 1" color="primary" sx={{ mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Install Dependencies
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Run pnpm install in both root and backend directories
                </Typography>
              </Box>
              
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Chip label="Step 2" color="secondary" sx={{ mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Start Development
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Run pnpm dev to start both frontend and backend
                </Typography>
              </Box>
              
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Chip label="Step 3" color="success" sx={{ mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Start Building
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Begin developing your amazing application!
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}