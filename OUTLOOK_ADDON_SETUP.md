# Outlook Add-in Setup Guide

This guide will help you set up the Zoho V2 CRM Integration as an Outlook add-in using ngrok for local development.

## Prerequisites

1. **Node.js and pnpm** - For running the application
2. **ngrok** - For exposing local development server to the internet
3. **Outlook** - Desktop client, Web, or Mobile
4. **Zoho CRM Account** - For CRM integration

## Step 1: Install ngrok

### Option A: Download from ngrok.com
1. Go to https://ngrok.com/download
2. Download and install ngrok for your platform
3. Sign up for a free ngrok account
4. Get your auth token from the ngrok dashboard

### Option B: Install via package manager
```bash
# macOS using Homebrew
brew install ngrok/ngrok/ngrok

# Windows using Chocolatey
choco install ngrok

# Ubuntu/Debian
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

### Configure ngrok
```bash
# Add your auth token (get this from ngrok dashboard)
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

## Step 2: Start Your Development Servers

1. **Start the Zoho V2 application**:
   ```bash
   cd /path/to/zoho-v2
   pnpm install
   pnpm dev
   ```
   This starts:
   - Frontend on http://localhost:3000
   - Backend on http://localhost:3001

2. **Expose the frontend with ngrok**:
   ```bash
   # In a new terminal
   ngrok http 3000
   ```

   You'll see output like:
   ```
   ngrok by @inconshreveable
   
   Session Status                online
   Account                       your-email@example.com
   Version                       3.x.x
   Region                        United States (us)
   Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
   ```

3. **Copy your ngrok URL** (e.g., `https://abc123.ngrok.io`)

## Step 3: Update the Manifest File

1. Open `manifest.xml` in your project root
2. Replace **ALL** instances of `YOUR_NGROK_URL.ngrok.io` with your actual ngrok URL
   
   For example, if your ngrok URL is `https://abc123.ngrok.io`, replace:
   ```xml
   <!-- Before -->
   <IconUrl DefaultValue="https://YOUR_NGROK_URL.ngrok.io/icons/icon-32.png" />
   
   <!-- After -->
   <IconUrl DefaultValue="https://abc123.ngrok.io/icons/icon-32.png" />
   ```

3. **Find and replace locations**:
   - `<IconUrl DefaultValue="https://YOUR_NGROK_URL.ngrok.io/icons/icon-32.png" />`
   - `<HighResolutionIconUrl DefaultValue="https://YOUR_NGROK_URL.ngrok.io/icons/icon-80.png" />`
   - `<SupportUrl DefaultValue="https://YOUR_NGROK_URL.ngrok.io/support" />`
   - `<AppDomain>https://YOUR_NGROK_URL.ngrok.io</AppDomain>`
   - `<SourceLocation DefaultValue="https://YOUR_NGROK_URL.ngrok.io/outlook" />`
   - And all other URLs in the Resources section

## Step 4: Install the Add-in in Outlook

### For Outlook Desktop (Windows/Mac)

1. **Open Outlook**
2. **Go to the ribbon** and find the "Get Add-ins" or "Store" button
3. **Click "My add-ins"** in the left sidebar
4. **Click "Add a custom add-in"** → **"Add from file"**
5. **Browse and select** your `manifest.xml` file
6. **Click "Install"** and confirm the installation

### For Outlook Web (Office 365)

1. **Open Outlook on the web** (outlook.office.com)
2. **Click the Settings gear** icon → **"View all Outlook settings"**
3. **Go to Mail** → **"Customize actions"** → **"Add-ins"**
4. **Click "Add add-ins"** → **"Add from file"**
5. **Upload your manifest.xml** file
6. **Click "Install"**

### For Exchange Admin (Organization-wide)

1. **Go to Exchange Admin Center**
2. **Navigate to Organization** → **"Add-ins"**
3. **Click the "+" icon** → **"Add from file"**
4. **Upload the manifest.xml** and configure permissions

## Step 5: Test the Add-in

1. **Open an email** in Outlook
2. **Look for the "Zoho V2 CRM" button** in the ribbon
3. **Click the button** to open the add-in panel
4. **Verify** that contact information is extracted from the email
5. **Test syncing** a contact to Zoho CRM

## Step 6: Configure Zoho Authentication

Before you can sync contacts, you need to set up Zoho OAuth:

1. **Visit the Zoho authentication page**: `https://your-ngrok-url.ngrok.io/zoho`
2. **Click "Authenticate with Zoho"**
3. **Complete the OAuth flow**
4. **Return to Outlook** and test the sync functionality

## Troubleshooting

### Common Issues

1. **Add-in not loading**:
   - Check that ngrok is still running
   - Verify your ngrok URL hasn't changed (free ngrok URLs change on restart)
   - Ensure all URLs in manifest.xml are updated

2. **SSL/HTTPS errors**:
   - ngrok provides HTTPS by default, always use the `https://` URL
   - Don't use the `http://` URL in the manifest

3. **Authentication issues**:
   - Make sure your Zoho OAuth credentials are configured in the backend
   - Check the backend `.env` file for correct ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET

4. **Icons not displaying**:
   - The manifest uses placeholder icons from dummyimage.com and via.placeholder.com
   - For production, replace these with actual PNG/ICO files hosted on your server

### Updating the Add-in

When you make changes:

1. **If you change the manifest**: Reinstall the add-in in Outlook
2. **If you change code only**: Just refresh/restart Outlook
3. **If ngrok URL changes**: Update the manifest and reinstall

## Production Deployment

For production deployment:

1. **Deploy your app** to a permanent hosting service (Heroku, Vercel, etc.)
2. **Update the manifest** with your production URLs
3. **Submit to Microsoft AppSource** (optional) for wider distribution
4. **Use proper icons** instead of HTML placeholders

## Security Notes

- Never commit your ngrok auth token to version control
- Keep your Zoho OAuth credentials secure
- Use HTTPS URLs only in the manifest
- Consider IP restrictions for production deployments
- The manifest currently uses placeholder icons that will work for testing

## Support

If you encounter issues:
- Check the browser developer console for errors
- Review Outlook's add-in troubleshooting logs
- Visit the support page: `https://your-ngrok-url.ngrok.io/support`
