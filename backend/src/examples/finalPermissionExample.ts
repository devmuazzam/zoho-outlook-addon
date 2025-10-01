import { zohoPermissionService } from '../services/zohoPermissionService';

async function demonstrateSimplifiedService() {

  console.log('Example 1: Check permissions with contact ID');
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

}

// Run examples if this file is executed directly
if (require.main === module) {
  demonstrateSimplifiedService()
    .then(() => {
      // Additional examples or tests can be added here
    })
    .catch(console.error);
}

export {
  demonstrateSimplifiedService,
};