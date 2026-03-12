const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { inventoryId } = req.query;
    if (!inventoryId) return res.status(400).json({ error: 'inventoryId required' });
    const comments = await prisma.comment.findMany({
      where: { inventoryId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    res.json(comments);
  } catch (e) { next(e); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { inventoryId, content } = req.body;
    if (!inventoryId || !content?.trim()) return res.status(400).json({ error: 'Invalid' });

    const comment = await prisma.comment.create({
      data: { inventoryId, content: content.trim(), userId: req.user.id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    const io = req.app.get('io');
    if (io) io.to(`inventory:${inventoryId}`).emit('newComment', comment);

    res.status(201).json(comment);
  } catch (e) { next(e); }
});

module.exports = router;
