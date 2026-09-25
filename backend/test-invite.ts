import 'dotenv/config';
import { createInvitation } from './src/modules/collaborators/service';
import { prisma } from './src/lib/prisma';

async function test() {
  try {
    // Assuming pool exists, we need a valid ownerId and poolId.
    // Let's just fetch the first pool to use as dummy
    const pool = await prisma.pool.findFirst();
    if (!pool) {
      console.log('No pool found');
      process.exit(0);
    }
    await createInvitation(pool.ownerId, {
      poolId: pool.id,
      invitedEmail: 'test12345@test.com',
      role: 'Collaborator',
      splitPercentage: 50,
    });
    console.log('Success');
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
