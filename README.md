# Zoho V2 - Full-Stack Next.js Application

A modern full-stack application built with Next.js 14, TypeScript, Material-UI, Tailwind CSS, and a separate Express.js backend server.

## 🏗️ Project Structure

```
zoho-v2/
├── src/                          # Frontend source code
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # Frontend API routes
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   └── globals.css           # Global styles
│   └── components/               # React components
│       ├── providers/            # Context providers
│       └── ui/                   # Reusable UI components
├── backend/                      # Backend server
│   ├── src/
│   │   ├── config/               # Configuration files
│   │   ├── middleware/           # Express middleware
│   │   ├── routes/               # API routes
│   │   ├── types/                # TypeScript types
│   │   ├── utils/                # Utility functions
│   │   └── index.ts              # Server entry point
│   ├── dist/                     # Compiled backend code
│   └── package.json              # Backend dependencies
├── .github/                      # GitHub configuration
└── package.json                  # Frontend dependencies and scripts
```

## 🚀 Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Material-UI (MUI)
- **HTTP Client**: Axios with custom API client
- **Package Manager**: pnpm

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **HTTP Client**: Axios for external API calls
- **Database**: PostgreSQL with Prisma ORM
- **Tools**: Nodemon, ts-node for development

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- pnpm (installed globally)

### Installation

1. **Clone and navigate to the project**:
   ```bash
   cd zoho-v2
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```
   This will install dependencies for both frontend and backend using the workspace configuration.

3. **Environment setup**:
   ```bash
   # Copy environment examples
   cp .env.example .env.local
   cp backend/.env.example backend/.env
   ```

4. **Database Setup**:
   ```bash
   # Install PostgreSQL (see DATABASE_SETUP.md for detailed instructions)
   
   # Configure database URL in .env files
   DATABASE_URL="postgresql://username:password@localhost:5432/zoho_v2_db?schema=public"
   
   # Generate Prisma client and setup database
   pnpm db:generate
   pnpm db:push  # or pnpm db:migrate for production
   ```

5. **Start development servers**:
   ```bash
   pnpm dev
   ```
   This starts both frontend (localhost:3000) and backend (localhost:3001) servers concurrently.

## 📜 Available Scripts

### Root Level Scripts
- `pnpm dev` - Start both frontend and backend in development mode
- `pnpm build` - Build the frontend for production
- `pnpm start` - Start both production servers
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Run TypeScript type checking

### Database Scripts
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Create and run migrations
- `pnpm db:reset` - Reset database and run migrations
- `pnpm db:studio` - Open Prisma Studio

### Backend Scripts
```bash
cd backend
pnpm dev          # Start backend in development mode
pnpm build        # Build backend for production
pnpm start        # Start production backend server
pnpm build:clean  # Clean and rebuild
pnpm format       # Format backend code
```

## 🔗 Zoho CRM Integration

### Features
- **OAuth 2.0 Authentication**: Secure authentication with Zoho CRM
- **Contact Management**: Create, read, update, delete contacts
- **Lead Management**: Manage leads with full CRUD operations
- **User Information**: Access current user and organization data
- **Webhook Support**: Receive real-time updates from Zoho CRM
- **Token Management**: Automatic token refresh and secure storage

### API Endpoints

#### Authentication
- `GET /auth/zoho/login` - Initiate OAuth flow
- `GET /auth/zoho/callback` - OAuth callback handler
- `GET /auth/zoho/status` - Check authentication status
- `POST /auth/zoho/refresh` - Refresh access token
- `POST /auth/zoho/logout` - Logout and clear tokens

#### CRM Data
- `GET /api/zoho/user` - Get current user info
- `GET /api/zoho/contacts` - Get contacts with pagination
- `POST /api/zoho/contacts` - Create new contact
- `PUT /api/zoho/contacts/:id` - Update contact
- `DELETE /api/zoho/contacts/:id` - Delete contact
- `GET /api/zoho/leads` - Get leads with pagination
- `POST /api/zoho/leads` - Create new lead
- `GET /api/zoho/search` - Search contacts/leads
- `GET /api/zoho/organization` - Get organization info

#### Webhooks
- `POST /webhooks/zoho/contact` - Receive contact webhooks
- `POST /webhooks/zoho/lead` - Receive lead webhooks
- `GET /webhooks/zoho/contacts` - Get stored contact webhook data
- `GET /webhooks/zoho/status` - Get webhook system status
- `DELETE /webhooks/zoho/clear` - Clear webhook data

### Setup Instructions

1. **Zoho CRM App Setup**:
   - Go to [Zoho Developer Console](https://api-console.zoho.com/)
   - Create a new application
   - Set redirect URI to: `http://localhost:3001/auth/zoho/callback`
   - Note down Client ID and Client Secret

2. **Environment Configuration**:
   ```bash
   # Add to your .env file
   ZOHO_CLIENT_ID=your_zoho_client_id
   ZOHO_CLIENT_SECRET=your_zoho_client_secret
   ZOHO_REDIRECT_URI=http://localhost:3001/auth/zoho/callback
   ```

3. **Access the Integration**:
   - Start the development server: `pnpm dev`
   - Visit: http://localhost:3000/zoho
   - Click "Login with Zoho CRM" to authenticate

### Webhook Configuration

To receive real-time updates from Zoho CRM:

1. **In Zoho CRM Settings**:
   - Go to Setup → Developer Space → Webhooks
   - Create new webhook with URL: `http://localhost:3001/webhooks/zoho/contact`
   - Select modules: Contacts, Leads
   - Choose events: Create, Update, Delete

2. **View Webhook Data**:
   - Use the Webhooks tab in the frontend
   - Or call `/webhooks/zoho/contacts` API endpoint

## 🔧 Configuration Files

- **pnpm-workspace.yaml** - pnpm workspace configuration
- **.prettierrc** - Prettier formatting rules
- **tailwind.config.ts** - Tailwind CSS configuration
- **next.config.mjs** - Next.js configuration
- **tsconfig.json** - TypeScript configuration for frontend
- **backend/tsconfig.json** - TypeScript configuration for backend

## 🎨 UI Components

The project uses a combination of:
- **Material-UI (MUI)** for complex components
- **Tailwind CSS** for utility-first styling
- Custom components in `src/components/`

## 🚦 Development Workflow

1. **Frontend Development**:
   - Navigate to `src/app/` for pages
   - Add components in `src/components/`
   - Use TypeScript for type safety

2. **Backend Development**:
   - API routes in `backend/src/routes/`
   - Middleware in `backend/src/middleware/`
   - Types in `backend/src/types/`

3. **Testing Connection**:
   - Start both servers with `pnpm dev`
   - Visit localhost:3000
   - Click "Fetch Data from Backend" to test connectivity

## 📦 Project Features

- ✅ Monorepo setup with pnpm workspaces
- ✅ TypeScript throughout the stack
- ✅ Hot reloading for both frontend and backend
- ✅ Professional error handling
- ✅ Structured API responses
- ✅ Material-UI component library
- ✅ Tailwind CSS for styling
- ✅ ESLint and Prettier configuration
- ✅ Environment configuration
- ✅ Concurrently managed development servers
- ✅ Axios-based API client with interceptors
- ✅ Centralized header management
- ✅ Generic API response types
- ✅ Request/response logging in development
- ✅ Automatic auth token handling
- ✅ Fixed infinite process spawning issue
- ✅ **Zoho CRM OAuth 2.0 Integration**
- ✅ **Contact & Lead Management**
- ✅ **Real-time Webhook Support**
- ✅ **Professional Authentication Flow**
- ✅ **Clean JSON API Responses**
- ✅ **PostgreSQL Database Integration**
- ✅ **Prisma ORM with Type Safety**
- ✅ **Database Migrations & Schema Management**
- ✅ **Comprehensive Data Models**
- ✅ **Bidirectional Zoho CRM Sync**

## 🔄 Next Steps

1. Add database integration (PostgreSQL/MongoDB)
2. Implement authentication (JWT)
3. Add API validation middleware
4. Set up testing framework
5. Configure deployment (Docker/Vercel)
6. Add logging system
7. Implement caching strategy

## 📝 Notes

- The project uses pnpm for better performance and disk efficiency
- Backend runs on port 3001, frontend on port 3000
- All TypeScript types are properly configured
- CORS is configured for development
- Error boundaries and proper error handling implemented