import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route since it uses searchParams
export const dynamic = 'force-dynamic';

/**
 * Zoho OAuth callback handler
 * This route receives the OAuth callback from Zoho and proxies it to the backend
 */
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

    // Build the backend callback URL with all query parameters
    const backendCallbackUrl = new URL('http://localhost:3001/auth/zoho/callback');
    
    // Forward all query parameters to the backend
    searchParams.forEach((value, key) => {
      backendCallbackUrl.searchParams.append(key, value);
    });

    console.log('🔄 Proxying to backend:', backendCallbackUrl.toString());

    // Make the request to the backend
    const backendResponse = await fetch(backendCallbackUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Next.js Frontend Proxy'
      },
      redirect: 'manual' // Don't follow redirects automatically
    });

    console.log('📡 Backend response status:', backendResponse.status);

    // Handle different response types from backend
    if (backendResponse.status >= 300 && backendResponse.status < 400) {
      // Backend is trying to redirect - extract the redirect URL
      const redirectLocation = backendResponse.headers.get('location');
      
      if (redirectLocation) {
        console.log('🔀 Backend redirect to:', redirectLocation);
        return NextResponse.redirect(redirectLocation);
      }
    }

    // If backend returns JSON (error case)
    const contentType = backendResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await backendResponse.json();
      console.log('📄 Backend JSON response:', data);
      
      // Redirect to frontend with error message
      const frontendUrl = new URL('/', request.nextUrl.origin);
      frontendUrl.searchParams.set('auth', 'error');
      frontendUrl.searchParams.set('message', data.message || 'Authentication failed');
      
      return NextResponse.redirect(frontendUrl.toString());
    }

    // Default success case - redirect to home
    const frontendUrl = new URL('/', request.nextUrl.origin);
    frontendUrl.searchParams.set('auth', 'success');
    frontendUrl.searchParams.set('message', 'Authentication successful');
    
    return NextResponse.redirect(frontendUrl.toString());

  } catch (error: any) {
    console.error('❌ Callback proxy error:', error);
    
    // Redirect to frontend with error
    const frontendUrl = new URL('/', request.nextUrl.origin);
    frontendUrl.searchParams.set('auth', 'error');
    frontendUrl.searchParams.set('message', encodeURIComponent(error.message || 'Authentication failed'));
    
    return NextResponse.redirect(frontendUrl.toString());
  }
}