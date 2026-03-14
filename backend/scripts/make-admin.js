require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const email  = process.env.ADMIN_EMAIL || process.argv[2];

const validate = (e) => {
  if (!e) throw new Error('Provide email: ADMIN_EMAIL=x@y.com node scripts/make-admin.js');
};

const promote = (email) =>
  prisma.user.update({ where: { email }, data: { isAdmin: true } });

const run = async () => {
  validate(email);
  const user = await promote(email).catch(() => null);
  if (!user) { console.error(`❌ User not found: ${email}`); process.exit(1); }
  console.log(`✅ ${email} is now an admin.`);
};

run().finally(() => prisma.$disconnect());