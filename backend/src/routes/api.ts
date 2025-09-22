import express, { Router } from 'express';
import { sendSuccess, sendError, validateRequired } from '../utils/response';

const router: Router = express.Router();

// Hello endpoint
router.get('/hello', (req, res) => {
  sendSuccess(res, {
    message: 'Hello from the backend server!',
    endpoint: '/api/hello',
    version: '2.0.0'
  }, 'Backend connection successful');
});

// Users endpoint (example with mock data)
router.get('/users', (req, res) => {
  const mockUsers = [
    { 
      id: '1', 
      name: 'John Doe', 
      email: 'john@example.com',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    { 
      id: '2', 
      name: 'Jane Smith', 
      email: 'jane@example.com',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20')
    },
    { 
      id: '3', 
      name: 'Bob Johnson', 
      email: 'bob@example.com',
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-25')
    }
  ];
  
  sendSuccess(res, {
    users: mockUsers,
    total: mockUsers.length,
    page: 1,
    limit: 10
  }, 'Users retrieved successfully');
});

// Get single user
router.get('/users/:id', (req, res) => {
  const { id } = req.params;
  
  // Mock user lookup
  const mockUser = {
    id,
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  };
  
  if (id === '999') {
    return sendError(res, 'User not found', 404);
  }
  
  sendSuccess(res, mockUser, 'User retrieved successfully');
});

// Create user endpoint
router.post('/users', (req, res) => {
  const { name, email } = req.body;
  
  // Validate required fields
  const missing = validateRequired({ name, email });
  if (missing.length > 0) {
    return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
  }
  
  // Mock user creation
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  sendSuccess(res, newUser, 'User created successfully', 201);
});

// Data processing endpoint
router.post('/data', (req, res) => {
  const { data, type } = req.body;
  
  if (!data) {
    return sendError(res, 'Data field is required', 400);
  }
  
  // Mock data processing
  const processedData = {
    original: data,
    processed: typeof data === 'string' ? data.toUpperCase() : data,
    type: type || 'unknown',
    processedAt: new Date().toISOString()
  };
  
  sendSuccess(res, processedData, 'Data processed successfully');
});

// Health check for API routes
router.get('/health', (req, res) => {
  sendSuccess(res, {
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0.0'
  }, 'API routes are healthy');
});

export default router;