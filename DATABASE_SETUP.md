# Database Setup Guide

This project uses PostgreSQL with Prisma ORM for data management.

## Prerequisites

1. **PostgreSQL Installation**:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # macOS (with Homebrew)
   brew install postgresql
   brew services start postgresql
   
   # Or use Docker
   docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
   ```

2. **Create Database**:
   ```bash
   # Connect to PostgreSQL
   sudo -u postgres psql
   
   # Create database and user
   CREATE DATABASE zoho_v2_db;
   CREATE USER your_username WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE zoho_v2_db TO your_username;
   \q
   ```

## Setup Steps

1. **Configure Environment Variables**:
   ```bash
   # Copy example files
   cp .env.example .env
   cp backend/.env.example backend/.env
   
   # Update DATABASE_URL in both files
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/zoho_v2_db?schema=public"
   ```

2. **Generate Prisma Client**:
   ```bash
   pnpm db:generate
   ```

3. **Push Database Schema**:
   ```bash
   # For development (creates tables without migrations)
   pnpm db:push
   
   # OR create and run migration (recommended for production)
   pnpm db:migrate
   ```

4. **Verify Setup**:
   ```bash
   # Open Prisma Studio to view your database
   pnpm db:studio
   ```

## Available Commands

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Create and run migrations
- `pnpm db:reset` - Reset database and run migrations
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:seed` - Run database seeding (if configured)

## Database Schema

### Core Models

- **User** - Application users
- **ZohoAuthToken** - Zoho OAuth tokens storage
- **Contact** - Zoho CRM contacts with local storage
- **Lead** - Zoho CRM leads with local storage
- **ContactActivity** - Contact interactions and activities
- **LeadActivity** - Lead interactions and activities
- **WebhookLog** - Webhook event logging
- **AppSetting** - Application configuration

### Features

- 🔐 **Authentication**: Secure token storage for Zoho OAuth
- 📊 **Data Sync**: Bidirectional sync with Zoho CRM
- 📝 **Activity Tracking**: Track interactions with contacts/leads
- 🪝 **Webhook Support**: Log and process webhook events
- ⚙️ **Configuration**: Flexible app settings storage
- 🗃️ **Soft Deletes**: Safe data archiving
- 🔍 **Full-text Search**: Search across contacts and leads
- 📈 **Analytics Ready**: Built-in aggregation support

## Troubleshooting

### Common Issues

1. **Connection refused**:
   - Ensure PostgreSQL is running
   - Check DATABASE_URL format
   - Verify database exists

2. **Permission denied**:
   - Check user permissions
   - Ensure database user has proper grants

3. **Schema out of sync**:
   ```bash
   pnpm db:reset
   pnpm db:migrate
   ```

4. **Prisma client not found**:
   ```bash
   pnpm db:generate
   ```

### Docker Setup (Alternative)

If you prefer using Docker for PostgreSQL:

```bash
# Create docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: zoho_v2_db
      POSTGRES_USER: username
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:

# Start database
docker-compose up -d
```

## Migration Strategy

For production deployments:

1. Always use migrations: `pnpm db:migrate`
2. Test migrations on staging first
3. Backup database before applying migrations
4. Use `prisma migrate deploy` in production