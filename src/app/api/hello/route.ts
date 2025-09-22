import { NextRequest, NextResponse } from 'next/server';

// API route handler for frontend API routes (if needed)
export async function GET(request: NextRequest) {
  try {
    // This is a frontend API route that could proxy to backend
    const backendResponse = await fetch('http://localhost:3002/api/hello');
    const data = await backendResponse.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch from backend' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy to backend
    const backendResponse = await fetch('http://localhost:3002/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}