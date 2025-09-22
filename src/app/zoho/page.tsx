"use client";

import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  Login, 
  Logout, 
  Refresh, 
  Person, 
  Business, 
  Group,
  LeaderboardOutlined,
  Webhook
} from '@mui/icons-material';
import { zohoAPIClient, ZohoAuthStatus, ZohoContact, ZohoLead, ZohoUser } from '@/lib/zohoAPI';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`zoho-tabpanel-${index}`}
      aria-labelledby={`zoho-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ZohoCRMPage() {
  const [authStatus, setAuthStatus] = useState<ZohoAuthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [contacts, setContacts] = useState<ZohoContact[]>([]);
  const [leads, setLeads] = useState<ZohoLead[]>([]);
  const [currentUser, setCurrentUser] = useState<ZohoUser | null>(null);
  const [webhookData, setWebhookData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Create contact dialog
  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    First_Name: '',
    Last_Name: '',
    Email: '',
    Phone: '',
    Company: ''
  });

  // Check auth status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check URL params for auth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    const messageParam = urlParams.get('message');
    
    if (authParam === 'success') {
      setSuccess(messageParam || 'Authentication successful');
      checkAuthStatus();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authParam === 'error') {
      setError(messageParam || 'Authentication failed');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await zohoAPIClient.getAuthStatus();
      if (response.success) {
        setAuthStatus(response.data!);
        if (response.data!.authenticated) {
          loadUserData();
        }
      }
    } catch (error: any) {
      setError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await zohoAPIClient.initiateLogin();
      if (response.success && response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error: any) {
      setError('Failed to initiate login');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const response = await zohoAPIClient.logout();
      if (response.success) {
        setAuthStatus({ authenticated: false, message: 'Logged out successfully' });
        setCurrentUser(null);
        setContacts([]);
        setLeads([]);
        setWebhookData([]);
        setSuccess('Logged out successfully');
      }
    } catch (error: any) {
      setError('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setLoading(true);
      const response = await zohoAPIClient.refreshToken();
      if (response.success) {
        setSuccess('Token refreshed successfully');
        checkAuthStatus();
      }
    } catch (error: any) {
      setError('Token refresh failed');
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      console.log('🔄 Loading user data...');
      const userResponse = await zohoAPIClient.getCurrentUser();
      console.log('📡 User response:', userResponse);
      
      if (userResponse.success && userResponse.data?.users?.[0]) {
        setCurrentUser(userResponse.data.users[0]);
        console.log('✅ User data loaded:', userResponse.data.users[0]);
      } else {
        console.warn('⚠️ No user data in response:', userResponse);
        setError('No user information found');
      }
    } catch (error: any) {
      console.error('❌ Failed to load user data:', error);
      setError('Failed to load user information: ' + error.message);
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await zohoAPIClient.getContacts(1, 10);
      if (response.success) {
        setContacts(response.data?.contacts || []);
      }
    } catch (error: any) {
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await zohoAPIClient.getLeads(1, 10);
      if (response.success) {
        setLeads(response.data?.leads || []);
      }
    } catch (error: any) {
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookData = async () => {
    try {
      setLoading(true);
      const response = await zohoAPIClient.getContactWebhooks(20);
      if (response.success) {
        setWebhookData(response.data?.webhooks || []);
      }
    } catch (error: any) {
      setError('Failed to load webhook data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async () => {
    try {
      setLoading(true);
      const response = await zohoAPIClient.createContact(newContact);
      if (response.success) {
        setSuccess('Contact created successfully');
        setCreateContactOpen(false);
        setNewContact({ First_Name: '', Last_Name: '', Email: '', Phone: '', Company: '' });
        loadContacts();
      }
    } catch (error: any) {
      setError('Failed to create contact');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Load data when tab is selected
    switch (newValue) {
      case 0:
        if (!currentUser) loadUserData();
        break;
      case 1:
        if (contacts.length === 0) loadContacts();
        break;
      case 2:
        if (leads.length === 0) loadLeads();
        break;
      case 3:
        loadWebhookData();
        break;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
        🔗 Zoho CRM Integration
      </Typography>

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Authentication Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Authentication Status</Typography>
            <Chip 
              label={authStatus?.authenticated ? 'Connected' : 'Not Connected'}
              color={authStatus?.authenticated ? 'success' : 'error'}
              icon={authStatus?.authenticated ? <Person /> : <Login />}
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {authStatus?.message || 'Checking authentication status...'}
          </Typography>

          {authStatus?.tokenInfo && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Token expires:</strong> {new Date(authStatus.tokenInfo.expiresAt).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Refresh token available:</strong> {authStatus.tokenInfo.hasRefreshToken ? 'Yes' : 'No'}
              </Typography>
            </Box>
          )}

          {currentUser && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="primary.contrastText">
                <strong>Logged in as:</strong> {currentUser.full_name} ({currentUser.email})
              </Typography>
              {currentUser.role && (
                <Typography variant="body2" color="primary.contrastText">
                  <strong>Role:</strong> {currentUser.role.name}
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            {!authStatus?.authenticated ? (
              <Button
                variant="contained"
                startIcon={<Login />}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Login with Zoho CRM'}
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleRefreshToken}
                  disabled={loading}
                >
                  Refresh Token
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Logout />}
                  onClick={handleLogout}
                  disabled={loading}
                >
                  Logout
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Data Tabs */}
      {authStatus?.authenticated && (
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab icon={<Person />} label="User Info" />
              <Tab icon={<Group />} label="Contacts" />
              <Tab icon={<LeaderboardOutlined />} label="Leads" />
              <Tab icon={<Webhook />} label="Webhooks" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Current User Information</Typography>
              <Button variant="outlined" onClick={loadUserData} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Refresh User Info'}
              </Button>
            </Box>
            
            {currentUser ? (
              <Box>
                <Typography><strong>Name:</strong> {currentUser.full_name}</Typography>
                <Typography><strong>Email:</strong> {currentUser.email}</Typography>
                <Typography><strong>User ID:</strong> {currentUser.id}</Typography>
                {currentUser.role && (
                  <Typography><strong>Role:</strong> {currentUser.role.name}</Typography>
                )}
                {currentUser.profile && (
                  <Typography><strong>Profile:</strong> {currentUser.profile.name}</Typography>
                )}
              </Box>
            ) : (
              <Typography color="text.secondary">
                {loading ? 'Loading user information...' : 'Click "Refresh User Info" to load user information'}
              </Typography>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Contacts</Typography>
              <Box>
                <Button
                  variant="contained"
                  onClick={() => setCreateContactOpen(true)}
                  sx={{ mr: 1 }}
                >
                  Create Contact
                </Button>
                <Button variant="outlined" onClick={loadContacts} disabled={loading}>
                  {loading ? <CircularProgress size={20} /> : 'Refresh'}
                </Button>
              </Box>
            </Box>
            
            {contacts.length > 0 ? (
              <List>
                {contacts.map((contact, index) => (
                  <div key={contact.id}>
                    <ListItem>
                      <ListItemText
                        primary={`${contact.First_Name || ''} ${contact.Last_Name || ''}`.trim()}
                        secondary={
                          <Box>
                            {contact.Email && <Typography variant="body2">📧 {contact.Email}</Typography>}
                            {contact.Phone && <Typography variant="body2">📞 {contact.Phone}</Typography>}
                            {contact.Company && <Typography variant="body2">🏢 {contact.Company}</Typography>}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < contacts.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">No contacts found or click Refresh to load</Typography>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Leads</Typography>
              <Button variant="outlined" onClick={loadLeads} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Load Leads'}
              </Button>
            </Box>
            
            {leads.length > 0 ? (
              <List>
                {leads.map((lead, index) => (
                  <div key={lead.id}>
                    <ListItem>
                      <ListItemText
                        primary={`${lead.First_Name || ''} ${lead.Last_Name || ''}`.trim()}
                        secondary={
                          <Box>
                            {lead.Email && <Typography variant="body2">📧 {lead.Email}</Typography>}
                            {lead.Phone && <Typography variant="body2">📞 {lead.Phone}</Typography>}
                            {lead.Company && <Typography variant="body2">🏢 {lead.Company}</Typography>}
                            {lead.Lead_Status && (
                              <Chip label={lead.Lead_Status} size="small" sx={{ mt: 1 }} />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < leads.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">No leads found or click Load Leads</Typography>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Webhook Data</Typography>
              <Button variant="outlined" onClick={loadWebhookData} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Refresh Webhooks'}
              </Button>
            </Box>
            
            {webhookData.length > 0 ? (
              <List>
                {webhookData.map((webhook, index) => (
                  <div key={index}>
                    <ListItem>
                      <ListItemText
                        primary={`Webhook #${index + 1}`}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              <strong>Received:</strong> {new Date(webhook.receivedAt).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Data:</strong> {JSON.stringify(webhook, null, 2).substring(0, 200)}...
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < webhookData.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">
                No webhook data received yet. Configure webhooks in Zoho CRM to send data to your backend.
              </Typography>
            )}
          </TabPanel>
        </Card>
      )}

      {/* Create Contact Dialog */}
      <Dialog open={createContactOpen} onClose={() => setCreateContactOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Contact</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="First Name"
              value={newContact.First_Name}
              onChange={(e) => setNewContact({ ...newContact, First_Name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              value={newContact.Last_Name}
              onChange={(e) => setNewContact({ ...newContact, Last_Name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={newContact.Email}
              onChange={(e) => setNewContact({ ...newContact, Email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={newContact.Phone}
              onChange={(e) => setNewContact({ ...newContact, Phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Company"
              value={newContact.Company}
              onChange={(e) => setNewContact({ ...newContact, Company: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateContactOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateContact}
            variant="contained"
            disabled={loading || !newContact.First_Name || !newContact.Last_Name}
          >
            {loading ? <CircularProgress size={20} /> : 'Create Contact'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}