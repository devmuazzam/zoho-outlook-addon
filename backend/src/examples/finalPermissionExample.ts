/**
 * Ultra-Simplified Zoho Permission Service - Final Example
 * 
 * This service now accepts only 2 parameters:
 * 1. moduleName: 'Contacts' (only supported module)
 * 2. recordId: Contact ID (local or Zoho ID)
 */

import { zohoPermissionService } from '../services/zohoPermissionService';

async function demonstrateSimplifiedService() {
  console.log('🚀 Ultra-Simplified Zoho Permission Service');
  console.log('==========================================\n');

  console.log('📋 Service accepts only 2 parameters:');
  console.log('   1. moduleName: "Contacts"');
  console.log('   2. recordId: Contact ID (local or Zoho)\n');

  // Example 1: Using local contact ID
  console.log('Example 1: Check permissions with local contact ID');
  console.log('------------------------------------------------');
  
  try {
    const result = await zohoPermissionService.checkModulePermissions({
      moduleName: 'Contacts',
      recordId: 'cmg55axhr00heav1k76gmtv1i'
    });
    
    console.log('✅ Success! Users who can access this contact:');
    result.userIds.forEach((userId, index) => {
      console.log(`   ${index + 1}. ${userId}`);
    });
    console.log(`   Access Type: ${result.accessType}`);
    console.log(`   Used Hierarchy: ${result.hierarchyUsed}\n`);
    
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // // Example 2: Using Zoho contact ID
  // console.log('Example 2: Check permissions with Zoho contact ID');
  // console.log('-----------------------------------------------');
  
  // try {
  //   const result = await zohoPermissionService.checkModulePermissions({
  //     moduleName: 'Contacts',
  //     recordId: 'zoho-contact-456'
  //   });
    
  //   console.log('✅ Success! Users who can access this contact:');
  //   result.userIds.forEach((userId, index) => {
  //     console.log(`   ${index + 1}. ${userId}`);
  //   });
  //   console.log(`   Access Type: ${result.accessType}`);
  //   console.log(`   Used Hierarchy: ${result.hierarchyUsed}\n`);
    
  // } catch (error: any) {
  //   console.log(`❌ Error: ${error.message}\n`);
  // }
}

function printAPIDocumentation() {
  console.log('📖 API Documentation');
  console.log('====================\n');
  
  console.log('Endpoint: POST /api/zoho/permissions/check\n');
  
  console.log('Request Body:');
  console.log(JSON.stringify({
    moduleName: 'Contacts',
    recordId: '123'
  }, null, 2));
  
  console.log('\nResponse:');
  console.log(JSON.stringify({
    success: true,
    data: {
      userIds: ['zoho-user-1', 'zoho-user-2', 'zoho-user-3'],
      accessType: 'private', // or 'public' or 'public_read_only'
      hierarchyUsed: true
    },
    message: 'Permission check completed successfully'
  }, null, 2));
  
  console.log('\nHow it works:');
  console.log('1. Service receives moduleName and recordId');
  console.log('2. Queries contact from database (tries local ID first, then Zoho ID)');
  console.log('3. Extracts owner and organization info from contact record');
  console.log('4. Checks organization sharing rules for Contacts module');
  console.log('5. For public access: returns all users with Contacts permission');
  console.log('6. For private access: returns owner + hierarchy users with permission');
  console.log('7. Returns array of Zoho user IDs who can access the contact');
}

function printIntegrationExample() {
  console.log('\n🔧 Integration Example');
  console.log('======================\n');
  
  console.log('// In your application code:');
  console.log(`
import { zohoPermissionService } from './services/zohoPermissionService';

async function checkContactPermissions(contactId: string) {
  try {
    const permissions = await zohoPermissionService.checkModulePermissions({
      moduleName: 'Contacts',
      recordId: contactId
    });
    
    console.log('Users who can access this contact:', permissions.userIds);
    return permissions.userIds;
    
  } catch (error) {
    console.error('Permission check failed:', error.message);
    return [];
  }
}

// Usage examples:
checkContactPermissions('123');           // Local contact ID
checkContactPermissions('zoho-456');      // Zoho contact ID
checkContactPermissions('existing-789');  // Any existing contact ID
`);
  
  console.log('// API usage with curl:');
  console.log(`
curl -X POST http://localhost:3001/api/zoho/permissions/check \\
  -H "Content-Type: application/json" \\
  -d '{
    "moduleName": "Contacts",
    "recordId": "123"
  }'
`);
}

// Run examples if this file is executed directly
if (require.main === module) {
  demonstrateSimplifiedService()
    .then(() => {
      // printAPIDocumentation();
      // printIntegrationExample();
    })
    .catch(console.error);
}

export {
  demonstrateSimplifiedService,
  printAPIDocumentation,
  printIntegrationExample
};