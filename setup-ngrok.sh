#!/bin/bash

# Script to configure ngrok for Office add-in development
# This script helps bypass the ngrok warning screen

echo "🔧 Ngrok Configuration for Office Add-ins"
echo "=========================================="
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed or not in PATH"
    echo "Please install ngrok from https://ngrok.com/download"
    exit 1
fi

echo "✅ ngrok is installed"
echo ""

# Check if authtoken is configured
if ! ngrok config check &> /dev/null; then
    echo "⚠️  ngrok authtoken not configured"
    echo ""
    echo "To fix the ngrok warning screen, you need to:"
    echo "1. Sign up for a free ngrok account at https://dashboard.ngrok.com/signup"
    echo "2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "3. Run: ngrok config add-authtoken YOUR_TOKEN_HERE"
    echo ""
    echo "After configuring the authtoken, restart ngrok and update your manifest."
    echo ""
    read -p "Do you have your authtoken? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your authtoken: " token
        ngrok config add-authtoken "$token"
        echo "✅ Authtoken configured successfully!"
    else
        echo "Please get your authtoken and run this script again."
        exit 1
    fi
else
    echo "✅ ngrok authtoken is configured"
fi

echo ""
echo "🚀 Starting ngrok tunnel for your app..."
echo "Your Next.js app should be running on http://localhost:3000"
echo ""
echo "After ngrok starts, copy the HTTPS URL and update your manifest with:"
echo "./update-manifest.sh https://your-new-ngrok-url.ngrok.io"
echo ""

# Start ngrok
ngrok http 3000
