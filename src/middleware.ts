import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('ngrok-skip-browser-warning', 'any');
  response.headers.set('X-Frame-Options', 'ALLOWALL');

  response.headers.set('User-Agent', 'OfficeAddin/1.0');

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
