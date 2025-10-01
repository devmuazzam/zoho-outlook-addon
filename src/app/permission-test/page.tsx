'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container
} from '@mui/material';
import {
  Person,
  Shield,
  Storage,
  CheckCircle,
  Cancel,
  Group,
  PlayArrow
} from '@mui/icons-material';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  zohoUserId: string;
  organizationId: string;
  role: string;
  zohoRole?: {
    displayLabel: string;
    reportingToName?: string;
  };
  zohoProfile?: {
    displayLabel: string;
    permissions: Array<{
      module: string;
      enabled: boolean;
      name: string;
    }>;
  };
}

interface PermissionResult {
  userIds: string[];
  accessType: 'private' | 'public' | 'public_read_only';
  hierarchyUsed: boolean;
}

export default function PermissionTestPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [contactId, setContactId] = useState('cmg55axhr00heav1k76gmtv1i');
  const [permissionResult, setPermissionResult] = useState<PermissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setUserLoading(true);
      const response = await fetch('/api/user/current');
      if (!response.ok) throw new Error('Failed to fetch user info');
      
      const data = await response.json();
      setUserInfo(data.user);
    } catch (err: any) {
      setError(`Failed to load user info: ${err.message}`);
    } finally {
      setUserLoading(false);
    }
  };

  const testPermissions = async () => {
    if (!contactId.trim()) {
      setError('Please enter a contact ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/permissions/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleName: 'Contacts',
          recordId: contactId.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Permission test failed');
      }

      const data = await response.json();
      setPermissionResult(data.result);
    } catch (err: any) {
      setError(err.message);
      setPermissionResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getAccessTypeColor = (type: string) => {
    switch (type) {
      case 'private': return 'error';
      case 'public': return 'success';
      case 'public_read_only': return 'info';
      default: return 'default';
    }
  };

  if (userLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="200px">
          <CircularProgress sx={{ mr: 2 }} />
          <Typography>Loading user information...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Zoho Permission Service Test
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Test the Zoho CRM permission service that mimics Zoho's access control behavior
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Person sx={{ mr: 1 }} />
                <Typography variant="h5" component="h2">
                  Current User Information
                </Typography>
              </Box>

              {userInfo ? (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {userInfo.name}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Email
                      </Typography>
                      <Typography variant="body2">
                        {userInfo.email}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        System Role
                      </Typography>
                      <Chip label={userInfo.role} variant="outlined" size="small" />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Zoho User ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {userInfo.zohoUserId}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {userInfo.zohoRole ? (
                    <Box mb={2}>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Shield sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">
                          Zoho Role
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {userInfo.zohoRole.displayLabel}
                      </Typography>
                      {userInfo.zohoRole.reportingToName && (
                        <Typography variant="body2" color="text.secondary">
                          Reports to: {userInfo.zohoRole.reportingToName}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      No Zoho role assigned
                    </Alert>
                  )}

                  {userInfo.zohoProfile ? (
                    <Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Storage sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">
                          Zoho Profile
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                        {userInfo.zohoProfile.displayLabel}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Key Permissions:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {userInfo.zohoProfile.permissions
                          .filter(p => ['Contacts', 'Leads', 'Accounts', 'Deals'].includes(p.module))
                          .slice(0, 6)
                          .map((perm, index) => (
                            <Chip 
                              key={index}
                              label={`${perm.module} ${perm.enabled ? '✓' : '✗'}`}
                              color={perm.enabled ? "primary" : "default"}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                      </Box>
                    </Box>
                  ) : (
                    <Alert severity="warning">
                      No Zoho profile assigned
                    </Alert>
                  )}
                </Box>
              ) : (
                <Alert severity="error">
                  User information not available
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Shield sx={{ mr: 1 }} />
                <Typography variant="h5" component="h2">
                  Permission Service Test
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Contact ID to Test
                </Typography>
                <TextField
                  fullWidth
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  placeholder="Enter contact ID (local or Zoho ID)"
                  size="small"
                  sx={{ fontFamily: 'monospace' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Enter a contact ID to test who can access it based on Zoho permissions
                </Typography>
              </Box>

              <Button
                onClick={testPermissions}
                disabled={loading || !contactId.trim()}
                variant="contained"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                sx={{ mb: 2 }}
              >
                {loading ? 'Testing Permissions...' : 'Test Permissions'}
              </Button>

              {permissionResult && (
                <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Access Type
                    </Typography>
                    <Chip
                      label={permissionResult.accessType.toUpperCase().replace('_', ' ')}
                      color={getAccessTypeColor(permissionResult.accessType) as any}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>

                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Hierarchy Used
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
                      {permissionResult.hierarchyUsed ? (
                        <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                      ) : (
                        <Cancel sx={{ fontSize: 16, color: 'text.disabled' }} />
                      )}
                      <Typography variant="body2">
                        {permissionResult.hierarchyUsed ? 'Yes' : 'No'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Group sx={{ fontSize: 16 }} />
                      <Typography variant="caption" color="text.secondary">
                        Users with Access ({permissionResult.userIds.length})
                      </Typography>
                    </Box>
                    <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                      {permissionResult.userIds.length > 0 ? (
                        <List dense>
                          {permissionResult.userIds.map((userId, index) => (
                            <ListItem key={index} disablePadding>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                    {userId}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Cancel sx={{ fontSize: 16, color: 'text.disabled' }} />
                          <Typography variant="body2" color="text.secondary">
                            No users have access to this contact
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            How the Permission Service Works
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                  1. Record Lookup
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Finds the contact record and identifies the owner
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                  2. Sharing Rules
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Checks organization default sharing rules (private/public)
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1 }}>
                  3. Profile Permissions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verifies user profile permissions for the module
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="info.main" sx={{ mb: 1 }}>
                  4. Role Hierarchy
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Applies role hierarchy for private access control
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}
