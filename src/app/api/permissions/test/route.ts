import { NextRequest, NextResponse } from 'next/server';

async function callBackendPermissionService(moduleName: string, recordId: string) {
  try {
    const { zohoPermissionService } = await import('../../../../../backend/src/services/zohoPermissionService');

    const result = await zohoPermissionService.checkModulePermissions({
      moduleName: moduleName as 'Contacts',
      recordId: recordId
    });

    return result;
  } catch (error) {
    console.error('Error calling backend permission service:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleName, recordId } = body;

    if (!moduleName || !recordId) {
      return NextResponse.json(
        { error: 'moduleName and recordId are required' },
        { status: 400 }
      );
    }

    if (moduleName !== 'Contacts') {
      return NextResponse.json(
        { error: 'Only Contacts module is currently supported' },
        { status: 400 }
      );
    }

    console.log(`🔍 Testing permissions for ${moduleName} record: ${recordId}`);

    const result = await callBackendPermissionService(moduleName, recordId);

    console.log('✅ Permission test completed:', result);

    return NextResponse.json({
      success: true,
      result: result,
      message: 'Permission test completed successfully'
    });

  } catch (error: any) {
    console.error('Permission test error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Permission test failed',
        details: error.stack
      },
      { status: 500 }
    );
  }
}
