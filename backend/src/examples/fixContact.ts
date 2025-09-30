import prisma from '../lib/prisma';

async function fixContact() {
  const userId = 'cmg55avr300ghav1kl1fe2ub3';
  const contactId = 'cmg55axhr00heav1k76gmtv1i';
  
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  console.log('User info:');
  console.log('- id:', user?.id);
  console.log('- name:', user?.name);
  console.log('- organizationId:', user?.organizationId);
  
  if (user) {
    console.log('\nUpdating contact to assign to user...');
    await prisma.contact.update({
      where: { id: contactId },
      data: { 
        userId: user.id,
        organizationId: user.organizationId 
      }
    });
    console.log('✅ Contact updated with userId and organizationId');
  }
  
  await prisma.$disconnect();
}

fixContact().catch(console.error);
