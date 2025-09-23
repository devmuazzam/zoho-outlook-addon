import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next();
  
  // Add ngrok bypass headers for Office add-ins
  response.headers.set('ngrok-skip-browser-warning', 'any');
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  
  // Add custom User-Agent bypass (as suggested by ngrok)
  response.headers.set('User-Agent', 'OfficeAddin/1.0');
  
  // Allow embedding in Office applications
  response.headers.set('Content-Security-Policy', 
    "frame-ancestors 'self' https://*.office.com https://*.office365.com https://*.sharepoint.com https://*.outlook.com https://outlook.live.com;"
  );
  
  return response;
}

export const config = {
  matcher: [
    '/outlook/:path*',
    '/support/:path*', 
    '/help/:path*',
    '/functions.html',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
