import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Configure dotenv FIRST before importing other modules
const envPath = path.join(__dirname, '../.env');
console.log('🔧 Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Also try loading from current directory as fallback
dotenv.config();

import { config } from './config/env';
import { requestLogger, responseTime } from './middleware/common';
import { sendSuccess, sendError } from './utils/response';
import apiRoutes from './routes/api';
import zohoAuthRoutes from './routes/zohoAuth';
import zohoApiRoutes from './routes/zohoApi';
import zohoCRMRoutes from './routes/zohoCRM';
import zohoWebhookRoutes from './routes/zohoWebhooks';
import zohoProfileRoutes from './routes/zohoProfiles';

// Debug environment variables
console.log('🔧 Environment Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('ZOHO_CLIENT_ID:', process.env.ZOHO_CLIENT_ID ? `${process.env.ZOHO_CLIENT_ID.substring(0, 10)}...` : 'NOT SET');
console.log('ZOHO_CLIENT_SECRET:', process.env.ZOHO_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('ZOHO_REDIRECT_URI:', process.env.ZOHO_REDIRECT_URI);
console.log('-----------------------------------');

const app = express();

// Middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(responseTime);

// Routes
app.use('/api', apiRoutes);
app.use('/auth/zoho', zohoAuthRoutes);
app.use('/api/zoho', zohoApiRoutes);
app.use('/api/zoho/crm', zohoCRMRoutes);
app.use('/api/zoho/profiles', zohoProfileRoutes);
app.use('/webhooks/zoho', zohoWebhookRoutes);

// Direct route for Zoho OAuth callback (since Zoho redirects to /auth/callback)
app.get('/auth/callback', async (req, res) => {
  // Forward to the zoho callback handler
  const { code, error } = req.query;
  
  if (error) {
    console.error('❌ OAuth Error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}?auth=error&message=${encodeURIComponent(error as string)}`;
    return res.redirect(redirectUrl);
  }

  if (!code || typeof code !== 'string') {
    console.error('❌ No authorization code received');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}?auth=error&message=${encodeURIComponent('No authorization code received')}`;
    return res.redirect(redirectUrl);
  }

  try {
    console.log('🔄 OAuth callback received, exchanging code for tokens...');
    
    const { zohoAuthService } = await import('./services/zohoAuth');
    const tokens = await zohoAuthService.exchangeCodeForTokens(code);
    
    console.log('✅ Tokens received successfully');
    
    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}?auth=success&message=Authentication successful`;
    
    res.redirect(redirectUrl);
    
  } catch (error: any) {
    console.error('❌ Token exchange failed:', error.message);
    
    // Redirect to frontend with error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}?auth=error&message=${encodeURIComponent(error.message)}`;
    
    res.redirect(redirectUrl);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  sendSuccess(res, {
    status: 'OK',
    message: 'Backend server is running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0.0'
  }, 'Server is healthy');
});

// 404 handler
app.use('*', (req, res) => {
  sendError(res, 'Route not found', 404, `Path ${req.originalUrl} not found`);
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR]', err.stack);
  sendError(
    res, 
    'Internal server error', 
    500, 
    config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  );
});

app.listen(config.port, () => {
  console.log(`🚀 Backend server is running on http://localhost:${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/health`);
  console.log(`🔧 Environment: ${config.nodeEnv}`);
});