import prisma from '../lib/prisma';

async function checkContact() {
  const contact = await prisma.contact.findUnique({
    where: { id: 'cmg55axhr00heav1k76gmtv1i' },
    include: {
      user: true
    }
  });
  
  console.log('Contact info:');
  console.log('- organizationId:', contact?.organizationId);
  console.log('- userId:', contact?.userId);
  console.log('- user organizationId:', contact?.user?.organizationId);
  
  // Update the contact to have organizationId
  if (contact && contact.user?.organizationId && !contact.organizationId) {
    console.log('\nUpdating contact organizationId...');
    await prisma.contact.update({
      where: { id: 'cmg55axhr00heav1k76gmtv1i' },
      data: { organizationId: contact.user.organizationId }
    });
    console.log('✅ Contact updated with organizationId');
  }
  
  await prisma.$disconnect();
}

checkContact().catch(console.error);
