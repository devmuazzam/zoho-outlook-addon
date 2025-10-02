#!/bin/bash

# Script to update manifest.xml with your ngrok URL
# Usage: ./update-manifest.sh https://your-ngrok-url.ngrok.io

if [ -z "$1" ]; then
    echo "Usage: $0 <ngrok-url>"
    echo "Example: $0 https://abc123.ngrok.io"
    exit 1
fi

NGROK_URL="$1"
MANIFEST_FILE="manifest.xml"

# Remove trailing slash if present
NGROK_URL="${NGROK_URL%/}"

# Check if manifest file exists
if [ ! -f "$MANIFEST_FILE" ]; then
    echo "Error: manifest.xml not found in current directory"
    exit 1
fi

# Backup original manifest
cp "$MANIFEST_FILE" "${MANIFEST_FILE}.backup"

# Replace all instances of YOUR_NGROK_URL.ngrok.io with the actual URL
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|https://YOUR_NGROK_URL\.ngrok\.io|${NGROK_URL}|g" "$MANIFEST_FILE"
    # Use outlook-direct route for ngrok bypass
    sed -i '' "s|${NGROK_URL}/outlook\"|${NGROK_URL}/outlook-direct\"|g" "$MANIFEST_FILE"
    sed -i '' "s|${NGROK_URL}/functions.html\"|${NGROK_URL}/functions.html\"|g" "$MANIFEST_FILE"
    sed -i '' "s|${NGROK_URL}/support\"|${NGROK_URL}/support\"|g" "$MANIFEST_FILE"
else
    # Linux
    sed -i "s|https://YOUR_NGROK_URL\.ngrok\.io|${NGROK_URL}|g" "$MANIFEST_FILE"
    # Use outlook-direct route for ngrok bypass
    sed -i "s|${NGROK_URL}/outlook\"|${NGROK_URL}/outlook-direct\"|g" "$MANIFEST_FILE"
    sed -i "s|${NGROK_URL}/functions.html\"|${NGROK_URL}/functions.html\"|g" "$MANIFEST_FILE"
    sed -i "s|${NGROK_URL}/support\"|${NGROK_URL}/support\"|g" "$MANIFEST_FILE"
fi

echo "✅ Updated manifest.xml with ngrok URL: $NGROK_URL"
echo "📄 Original manifest backed up as: ${MANIFEST_FILE}.backup"
echo ""
echo "Next steps:"
echo "1. Make sure your development servers are running:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:3001"
echo "2. Install/reinstall the add-in in Outlook using the updated manifest.xml"
echo "3. Test the add-in functionality"
echo ""
echo "To revert changes, run: mv ${MANIFEST_FILE}.backup $MANIFEST_FILE"
