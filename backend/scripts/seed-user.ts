import { PrismaClient } from '@prisma/client';

import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  const email = 'test@example.com';
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordHash = 'dummy_hash_since_bcrypt_is_not_installed';
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: 'Test User',
        defaultCurrency: 'NGN',
        country: 'NG',
      },
    });
    console.log('Created test user');
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'splitpay-development-super-secret-jwt-key-2026', {
    expiresIn: '7d',
  });

  console.log('\n--- RUN THIS IN YOUR BROWSER CONSOLE ---');
  console.log(`localStorage.setItem('sp_token', '${token}');`);
  console.log(`window.location.reload();`);
  console.log('----------------------------------------\n');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
