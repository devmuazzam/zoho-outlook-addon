import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Create HTML content for the iframe
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zoho V2 CRM Integration</title>
    <script>
        // Bypass ngrok warning and redirect to the actual app
        window.location.href = '/outlook';
    </script>
</head>
<body>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
            <h3>Loading Zoho V2 CRM Integration...</h3>
            <p>If this page doesn't redirect automatically, <a href="/outlook">click here</a>.</p>
        </div>
    </div>
</body>
</html>`;

  const response = new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'ngrok-skip-browser-warning': 'any',
      'User-Agent': 'OfficeAddin/1.0',
      'X-Frame-Options': 'ALLOWALL',
    },
  });

  return response;
}
