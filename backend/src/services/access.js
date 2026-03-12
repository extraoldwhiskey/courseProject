const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getInventoryWithAccess = (inventoryId) =>
  prisma.inventory.findUnique({
    where: { id: inventoryId },
    include: { access: true },
  });

const canWrite = (inventory, userId) => {
  if (!inventory || !userId) return false;
  if (inventory.creatorId === userId) return true;
  if (inventory.isPublic) return true;
  return inventory.access.some((a) => a.userId === userId);
};

const isOwnerOrAdmin = (inventory, user) => {
  if (!inventory || !user) return false;
  return user.isAdmin || inventory.creatorId === user.id;
};

module.exports = { getInventoryWithAccess, canWrite, isOwnerOrAdmin };
