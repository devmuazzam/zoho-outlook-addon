import prisma from '../lib/prisma';

async function getCorrectZohoIds() {
  console.log('🔍 Getting Correct Zoho IDs for User Assignment');
  console.log('==============================================\n');

  const roleDbId = 'cmg55axdq00gqav1kmdywah4i';
  const profileDbId = 'cmg55ayf100ihav1kh7frkmpl';

  // Get the actual zohoRoleId from the role record
  const role = await prisma.zohoRole.findUnique({
    where: { id: roleDbId },
    select: { id: true, zohoRoleId: true, displayLabel: true }
  });

  // Get the actual zohoProfileId from the profile record
  const profile = await prisma.zohoProfile.findUnique({
    where: { id: profileDbId },
    select: { id: true, zohoProfileId: true, displayLabel: true }
  });

  console.log('🎭 Role Information:');
  console.log(`- Database ID: ${role?.id}`);
  console.log(`- Zoho Role ID: ${role?.zohoRoleId} ← This is what we need for User.zohoRoleId`);
  console.log(`- Display Name: ${role?.displayLabel}\n`);

  console.log('📊 Profile Information:');
  console.log(`- Database ID: ${profile?.id}`);
  console.log(`- Zoho Profile ID: ${profile?.zohoProfileId} ← This is what we need for User.zohoProfileId`);
  console.log(`- Display Name: ${profile?.displayLabel}\n`);

  if (role && profile) {
    console.log('🔄 Now updating user with correct Zoho IDs...\n');
    
    const userId = 'cmg55avr300ghav1kl1fe2ub3';
    
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          zohoRoleId: role.zohoRoleId,       // Use the Zoho CRM Role ID
          zohoProfileId: profile.zohoProfileId // Use the Zoho CRM Profile ID
        },
        include: {
          zohoRole: true,
          zohoProfile: {
            include: {
              permissions: {
                where: { module: 'Contacts' }
              }
            }
          }
        }
      });

      console.log('✅ User updated successfully!');
      console.log('\n📋 Final User Data:');
      console.log(`- Name: ${updatedUser.name}`);
      console.log(`- Zoho User ID: ${updatedUser.zohoUserId}`);
      console.log(`- Assigned Role: ${updatedUser.zohoRole?.displayLabel}`);
      console.log(`- Assigned Profile: ${updatedUser.zohoProfile?.displayLabel}`);
      console.log(`- Contacts Module Access:`);
      
      const contactsPerms = updatedUser.zohoProfile?.permissions.filter(p => p.module === 'Contacts') || [];
      if (contactsPerms.length > 0) {
        contactsPerms.forEach(perm => {
          console.log(`  - ${perm.name}: ${perm.enabled ? '✅ Enabled' : '❌ Disabled'}`);
        });
      } else {
        console.log('  - No Contacts permissions found');
      }

    } catch (error) {
      console.error('❌ Update failed:', error);
    }
  }

  await prisma.$disconnect();
}

getCorrectZohoIds().catch(console.error);