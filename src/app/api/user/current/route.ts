import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    // For now, we'll use a mock user. In a real app, you'd get this from session
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    // }

    // Mock user data - replace with actual session-based user lookup
    const mockUser = {
      id: 'cmg55avr300ghav1kl1fe2ub3',
      name: 'dev 0',
      email: 'dev0@gmail.com',
      zohoUserId: '6985145000000574001',
      organizationId: 'cmg55aw4700giav1k4xn0opzy',
      role: 'ADMIN',
      zohoRole: {
        displayLabel: 'CEO',
        reportingToName: null
      },
      zohoProfile: {
        displayLabel: 'Administrator',
        permissions: [
          { module: 'Leads', enabled: true, name: 'View' },
          { module: 'Leads', enabled: true, name: 'Create' },
          { module: 'Leads', enabled: true, name: 'Edit' },
          { module: 'Leads', enabled: true, name: 'Delete' },
          { module: 'Contacts', enabled: true, name: 'View' },
          { module: 'Contacts', enabled: true, name: 'Create' },
          { module: 'Contacts', enabled: true, name: 'Edit' },
          { module: 'Contacts', enabled: true, name: 'Delete' },
          { module: 'Accounts', enabled: true, name: 'View' },
          { module: 'Accounts', enabled: true, name: 'Create' },
          { module: 'Deals', enabled: true, name: 'View' },
          { module: 'Deals', enabled: true, name: 'Create' },
        ]
      }
    };

    return NextResponse.json({ 
      success: true,
      user: mockUser 
    });

  } catch (error: any) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
}
