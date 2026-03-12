const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.category.createMany({
    data: [
      { name: 'Equipment' },
      { name: 'Furniture' },
      { name: 'Books' },
      { name: 'Documents' },
      { name: 'Other' },
    ],
    skipDuplicates: true,
  });
  console.log('Seed complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());
