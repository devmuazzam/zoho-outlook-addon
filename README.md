# SMB Dynamics Outlook Integration

A comprehensive full-stack application that seamlessly integrates Microsoft Outlook with Zoho CRM, enabling users to sync email contacts directly as leads or contacts in Zoho CRM through an Outlook add-in and web dashboard.

## 🎯 What This App Does

This application provides a complete integration between Microsoft Outlook and Zoho CRM:

- **Outlook Add-in**: Extract contact information from emails and sync them to Zoho CRM as leads or contacts
- **Web Dashboard**: Manage SMB Dynamics authentication, view user information, and monitor integration status
- **Real-time Sync**: Bidirectional synchronization of contacts, leads, and user data between systems
- **Webhook Support**: Receive real-time updates from Zoho CRM for data consistency
- **Role-based Access**: Support for different user roles and permissions within organizations

## �️ Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI) + Tailwind CSS
- **HTTP Client**: Axios with custom interceptors
- **Office Integration**: Microsoft Office.js for Outlook add-in
- **Package Manager**: pnpm

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **HTTP Client**: Axios for external API calls
- **Database**: PostgreSQL
- **ORM**: Prisma with type-safe database operations
- **Authentication**: Zoho OAuth 2.0 with JWT token management

### Infrastructure
- **Database**: PostgreSQL for data persistence
- **Development Tools**: Nodemon, ts-node for hot reloading
- **Build Tools**: TypeScript compiler, concurrently for multi-process management
- **Security**: Helmet for security headers, CORS configuration

## � Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- pnpm package manager (`npm install -g pnpm`)
- Zoho CRM developer account (for API access)

### 1. Clone and Install Dependencies
```bash
# Clone the repository
git clone <repository-url>
cd smb-dynamics

# Install all dependencies (frontend + backend)
pnpm install
```

### 2. Environment Setup
```bash
# Copy environment templates
cp .env.example .env.local
cp backend/.env.example backend/.env
```

Edit the environment files with your configuration:

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend (backend/.env):**
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/zoho_v2_db?schema=public"

# Zoho CRM Configuration
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REDIRECT_URI=http://localhost:3001/auth/zoho/callback

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup
```bash
# Generate Prisma client
pnpm db:generate

# Push database schema (creates tables)
pnpm db:push

# Optional: Seed with sample data
pnpm db:seed
```

### 4. Zoho CRM Setup
1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Create a new application
3. Set redirect URI: `http://localhost:3001/auth/zoho/callback`
4. Copy Client ID and Client Secret to your `.env` file

### 5. Start Development Servers
```bash
# Start both frontend (port 3000) and backend (port 3001)
pnpm dev
```

### 6. Access the Application
- **Web Dashboard**: http://localhost:3000
- **SMB Dynamics Integration**: http://localhost:3000/zoho
- **Outlook Add-in**: http://localhost:3000/outlook-app

## 📋 Development Workflow

### Available Scripts

**Root Level:**
- `pnpm dev` - Start both frontend and backend servers
- `pnpm build` - Build frontend for production
- `pnpm start` - Start production servers
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Run TypeScript checks

**Database:**
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Create and run migrations
- `pnpm db:reset` - Reset database
- `pnpm db:studio` - Open Prisma Studio (database GUI)

**Backend:**
```bash
cd backend
pnpm dev      # Start backend development server
pnpm build    # Build for production
pnpm start    # Start production server
```

## 🔗 Key Features

### Outlook Add-in
- Extracts contact information from emails
- One-click sync to Zoho CRM as leads or contacts
- Authentication handling within Outlook
- Real-time feedback and error handling

### SMB Dynamics Integration
- OAuth 2.0 authentication with Zoho CRM
- Contact and lead management
- Profile and role synchronization
- Organization-based data isolation
- Webhook support for real-time updates

### Web Dashboard
- User authentication status
- Integration monitoring
- Contact/lead management interface
- Webhook data visualization

## 🔧 API Endpoints

### Authentication
- `GET /auth/zoho/login` - Initiate OAuth flow
- `GET /auth/zoho/callback` - Handle OAuth callback
- `GET /auth/zoho/status` - Check authentication status
- `POST /auth/zoho/logout` - Logout user

### CRM Operations
- `GET /api/zoho/user` - Get current user info
- `GET /api/zoho/contacts` - List contacts
- `POST /api/zoho/contacts` - Create contact
- `GET /api/zoho/leads` - List leads
- `POST /api/zoho/leads` - Create lead

### Webhooks
- `POST /webhooks/zoho/contacts` - Contact webhook handler
- `POST /webhooks/zoho/leads` - Lead webhook handler
- `GET /webhooks/zoho/status` - Webhook status

## 🚀 Deployment

### Production Build
```bash
# Build frontend
pnpm build

# Build backend
pnpm build:backend

# Start production servers
pnpm start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure production database URL
- Set production Zoho redirect URI
- Configure production frontend URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Issues:**
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Run `pnpm db:push` to sync schema

**Zoho API Errors:**
- Verify Zoho credentials in environment variables
- Check redirect URI matches Zoho app configuration
- Ensure required scopes are enabled

**Outlook Add-in Issues:**
- Verify manifest.xml is properly configured
- Check Office.js is loading correctly
- Ensure HTTPS for production deployments

**Port Conflicts:**
- Frontend runs on port 3000
- Backend runs on port 3001
- Ensure these ports are available