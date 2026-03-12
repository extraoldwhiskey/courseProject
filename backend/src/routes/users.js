const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

const inventorySummarySelect = {
  id: true, title: true, description: true, imageUrl: true,
  isPublic: true, createdAt: true, updatedAt: true,
  creator: { select: { id: true, name: true } },
  category: true,
  _count: { select: { items: true } },
};

router.get('/autocomplete', requireAuth, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
        isBlocked: false,
        NOT: { id: req.user.id },
      },
      select: { id: true, name: true, email: true, avatar: true },
      take: 10,
    });
    res.json(users);
  } catch (e) { next(e); }
});

router.get('/me/inventories', requireAuth, async (req, res, next) => {
  try {
    const invs = await prisma.inventory.findMany({
      where: { creatorId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: inventorySummarySelect,
    });
    res.json(invs);
  } catch (e) { next(e); }
});

router.get('/me/write-access', requireAuth, async (req, res, next) => {
  try {
    const accesses = await prisma.inventoryAccess.findMany({
      where: { userId: req.user.id },
      include: { inventory: { select: inventorySummarySelect } },
    });
    res.json(accesses.map((a) => a.inventory));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, avatar: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'Not found' });
    const inventories = await prisma.inventory.findMany({
      where: { creatorId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: inventorySummarySelect,
    });
    res.json({ ...user, inventories });
  } catch (e) { next(e); }
});

module.exports = router;
