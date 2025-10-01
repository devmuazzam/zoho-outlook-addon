import { zohoPermissionService } from '../services/zohoPermissionService';
import prisma from '../lib/prisma';

async function testUltraSimplifiedService() {
  console.log('🧪 Testing Ultra-Simplified Zoho Permission Service');
  console.log('===================================================\n');

  const testOrgId = 'test-org-123';

  try {
    await setupTestData(testOrgId);

    console.log('📋 Test 1: Basic Permission Check');
    try {
      const result = await zohoPermissionService.checkModulePermissions({
        moduleName: 'Contacts',
        recordId: 'test-contact-1'
      });

      console.log('✅ Test 1 Passed:');
      console.log(`   - Access Type: ${result.accessType}`);
      console.log(`   - Hierarchy Used: ${result.hierarchyUsed}`);
      console.log(`   - Users with Access: ${result.userIds.length}`);
    } catch (error: any) {
      console.log(`❌ Test 1 Failed: ${error.message}`);
    }
    console.log('');

    console.log('📋 Test 2: Non-existent Contact');
    try {
      const result = await zohoPermissionService.checkModulePermissions({
        moduleName: 'Contacts',
        recordId: 'non-existent-contact'
      });
      console.log('❌ Test 2 Failed: Should have thrown error');
    } catch (error: any) {
      console.log(`✅ Test 2 Passed: Correctly threw error - ${error.message}`);
    }
    console.log('');

    console.log('📋 Test 3: Permission Summary');
    try {
      const summary = await zohoPermissionService.getPermissionSummary(testOrgId, 'Contacts');
      console.log('✅ Test 3 Passed:');
      console.log(`   - Organization: ${summary.organizationId}`);
      console.log(`   - Module: ${summary.moduleName}`);
      console.log(`   - Profiles with Access: ${summary.profilesWithModuleAccess.length}`);
      console.log(`   - Role Hierarchy Levels: ${summary.roleHierarchy.length}`);
    } catch (error: any) {
      console.log(`❌ Test 3 Failed: ${error.message}`);
    }
    console.log('');

  } catch (error: any) {
    console.error('❌ Test setup failed:', error.message);
  } finally {
    await cleanupTestData(testOrgId);
    await prisma.$disconnect();
  }
}

async function setupTestData(testOrgId: string) {
  console.log('🔧 Setting up test data...');

  const testOrg = await prisma.organization.upsert({
    where: { id: testOrgId },
    update: {},
    create: {
      id: testOrgId,
      zohoOrgId: 'zoho-org-123',
      name: 'Test Organization',
      domain: 'test.com'
    }
  });

  const testProfile = await prisma.zohoProfile.upsert({
    where: { zohoProfileId: 'test-profile-1' },
    update: {},
    create: {
      zohoProfileId: 'test-profile-1',
      name: 'Test Profile',
      displayLabel: 'Test Profile',
      organizationId: testOrgId,
      custom: false
    }
  });

  await prisma.zohoProfilePermission.upsert({
    where: {
      profileId_zohoPermId: {
        profileId: testProfile.id,
        zohoPermId: 'contacts-view'
      }
    },
    update: {},
    create: {
      profileId: testProfile.id,
      zohoPermId: 'contacts-view',
      name: 'View Contacts',
      displayLabel: 'View Contacts',
      module: 'Contacts',
      enabled: true
    }
  });

  const testRole = await prisma.zohoRole.upsert({
    where: { zohoRoleId: 'test-role-1' },
    update: {},
    create: {
      zohoRoleId: 'test-role-1',
      name: 'Test Role',
      displayLabel: 'Test Role',
      organizationId: testOrgId,
      shareWithPeers: false
    }
  });

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      zohoUserId: 'test-user-1',
      organizationId: testOrgId,
      zohoProfileId: testProfile.zohoProfileId,
      zohoRoleId: testRole.zohoRoleId,
      role: 'USER'
    }
  });

  await prisma.contact.upsert({
    where: { id: 'test-contact-1' },
    update: {},
    create: {
      id: 'test-contact-1',
      zohoId: 'zoho-contact-1',
      firstName: 'Test',
      lastName: 'Contact',
      email: 'test.contact@example.com',
      company: 'Test Company',
      userId: testUser.id
    }
  });

  await prisma.zohoDataSharingRule.create({
    data: {
      organizationId: testOrgId,
      ruleData: {
        share_type: 'public',
        module: {
          api_name: 'Contacts',
          id: 'contacts-module-1'
        },
        public_in_portals: false,
        rule_computation_running: false
      }
    }
  });

  console.log('✅ Test data setup complete');
}

async function cleanupTestData(testOrgId: string) {
  console.log('🗑️ Cleaning up test data...');

  await prisma.contact.deleteMany({
    where: {
      user: {
        organizationId: testOrgId
      }
    }
  });

  await prisma.zohoDataSharingRule.deleteMany({
    where: { organizationId: testOrgId }
  });

  await prisma.user.deleteMany({
    where: { organizationId: testOrgId }
  });

  await prisma.zohoProfilePermission.deleteMany({
    where: {
      profile: {
        organizationId: testOrgId
      }
    }
  });

  await prisma.zohoProfile.deleteMany({
    where: { organizationId: testOrgId }
  });

  await prisma.zohoRole.deleteMany({
    where: { organizationId: testOrgId }
  });

  await prisma.organization.deleteMany({
    where: { id: testOrgId }
  });

  console.log('✅ Test data cleanup complete');
}

export { testUltraSimplifiedService };

if (require.main === module) {
  testUltraSimplifiedService()
    .then(() => {
      console.log('\n🎉 All tests completed!');
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    });
}