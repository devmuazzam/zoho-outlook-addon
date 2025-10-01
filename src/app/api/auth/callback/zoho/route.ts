import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const location = searchParams.get('location');
    const accountsServer = searchParams.get('accounts-server');

    console.log('🔄 Zoho OAuth callback received:', {
      code: code ? 'present' : 'missing',
      error,
      location,
      accountsServer
    });

    const backendCallbackUrl = new URL('http://localhost:3001/auth/zoho/callback');

    searchParams.forEach((value, key) => {
      backendCallbackUrl.searchParams.append(key, value);
    });

    console.log('🔄 Proxying to backend:', backendCallbackUrl.toString());

    const backendResponse = await fetch(backendCallbackUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Next.js Frontend Proxy'
      },
      redirect: 'manual'
    });

    console.log('📡 Backend response status:', backendResponse.status);

    if (backendResponse.status >= 300 && backendResponse.status < 400) {
      const redirectLocation = backendResponse.headers.get('location');

      if (redirectLocation) {
        console.log('🔀 Backend redirect to:', redirectLocation);
        return NextResponse.redirect(redirectLocation);
      }
    }

    const contentType = backendResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await backendResponse.json();
      console.log('📄 Backend JSON response:', data);

      const frontendUrl = new URL('/', request.nextUrl.origin);
      frontendUrl.searchParams.set('auth', 'error');
      frontendUrl.searchParams.set('message', data.message || 'Authentication failed');

      return NextResponse.redirect(frontendUrl.toString());
    }

    const frontendUrl = new URL('/', request.nextUrl.origin);
    frontendUrl.searchParams.set('auth', 'success');
    frontendUrl.searchParams.set('message', 'Authentication successful');

    return NextResponse.redirect(frontendUrl.toString());

  } catch (error: any) {
    console.error('❌ Callback proxy error:', error);

    const frontendUrl = new URL('/', request.nextUrl.origin);
    frontendUrl.searchParams.set('auth', 'error');
    frontendUrl.searchParams.set('message', encodeURIComponent(error.message || 'Authentication failed'));

    return NextResponse.redirect(frontendUrl.toString());
  }
}