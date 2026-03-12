const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const tags = await prisma.tag.findMany({
      where: q ? { name: { startsWith: q, mode: 'insensitive' } } : undefined,
      orderBy: { inventories: { _count: 'desc' } },
      take: 20,
      include: { _count: { select: { inventories: true } } },
    });
    res.json(tags);
  } catch (e) { next(e); }
});

router.get('/cloud', async (req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { inventories: { _count: 'desc' } },
      take: 50,
      include: { _count: { select: { inventories: true } } },
    });
    res.json(tags);
  } catch (e) { next(e); }
});

module.exports = router;
