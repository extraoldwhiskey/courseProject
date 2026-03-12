const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/users', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const q = req.query.q || '';

    const where = q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, avatar: true, isAdmin: true, isBlocked: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, total, page, limit });
  } catch (e) { next(e); }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const { isAdmin, isBlocked } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(isAdmin !== undefined && { isAdmin }),
        ...(isBlocked !== undefined && { isBlocked }),
      },
      select: { id: true, email: true, name: true, isAdmin: true, isBlocked: true },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
