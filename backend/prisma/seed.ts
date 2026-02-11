import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.log('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD not set – skipping superadmin seed.');
    return;
  }

  const username = process.env.SUPERADMIN_USERNAME || 'superadmin';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { isSuperadmin: true },
    });
    console.log('Superadmin flag set for existing user:', email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      displayName: 'Superadmin',
      isSuperadmin: true,
    },
  });
  console.log('Superadmin account created:', email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
