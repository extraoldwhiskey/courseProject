const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { getInventoryWithAccess, canWrite, isOwnerOrAdmin } = require('../services/access');
const { generate } = require('../services/customId');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();
const router = express.Router();

const ITEM_FIELDS = ['string1','string2','string3','text1','text2','text3',
  'number1','number2','number3','link1','link2','link3','bool1','bool2','bool3'];

const pickFields = (body) =>
  Object.fromEntries(ITEM_FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

router.get('/', async (req, res, next) => {
  try {
    const { inventoryId } = req.query;
    if (!inventoryId) return res.status(400).json({ error: 'inventoryId required' });
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where: { inventoryId },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { likes: true } },
        },
      }),
      prisma.item.count({ where: { inventoryId } }),
    ]);

    let likedIds = new Set();
    if (req.user) {
      const likes = await prisma.like.findMany({
        where: { userId: req.user.id, itemId: { in: items.map((i) => i.id) } },
        select: { itemId: true },
      });
      likedIds = new Set(likes.map((l) => l.itemId));
    }

    const result = items.map((item) => ({ ...item, userLiked: likedIds.has(item.id) }));
    res.json({ items: result, total, page, limit });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: {
        inventory: {
          include: { fields: { orderBy: { order: 'asc' } }, customIdConf: true },
        },
        createdBy: { select: { id: true, name: true, avatar: true } },
        _count: { select: { likes: true } },
      },
    });
    if (!item) return res.status(404).json({ error: 'Not found' });

    let userLiked = false;
    if (req.user) {
      const like = await prisma.like.findUnique({
        where: { userId_itemId: { userId: req.user.id, itemId: item.id } },
      });
      userLiked = !!like;
    }
    res.json({ ...item, userLiked });
  } catch (e) { next(e); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { inventoryId, customId: providedCustomId, ...body } = req.body;
    const inv = await getInventoryWithAccess(inventoryId);
    if (!inv) return res.status(404).json({ error: 'Inventory not found' });
    if (!canWrite(inv, req.user.id) && !req.user.isAdmin)
      return res.status(403).json({ error: 'Forbidden' });

    const conf = await prisma.customIdConfig.findUnique({ where: { inventoryId } });
    const elements = conf?.elements || [];
    const customId = providedCustomId || await generate(elements, inventoryId) || uuidv4();

    const item = await prisma.item.create({
      data: {
        inventoryId,
        customId,
        createdById: req.user.id,
        ...pickFields(body),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { likes: true } },
      },
    });
    res.status(201).json({ ...item, userLiked: false });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Duplicate custom ID' });
    next(e);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: { inventory: { include: { access: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (!canWrite(existing.inventory, req.user.id) && !req.user.isAdmin)
      return res.status(403).json({ error: 'Forbidden' });

    const { version, customId, ...body } = req.body;

    if (version !== undefined && existing.version !== parseInt(version)) {
      return res.status(409).json({ error: 'Conflict: item was modified', serverVersion: existing.version });
    }

    const updated = await prisma.item.update({
      where: { id: req.params.id, version: existing.version },
      data: {
        ...(customId !== undefined && { customId }),
        ...pickFields(body),
        version: { increment: 1 },
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { likes: true } },
      },
    });
    res.json(updated);
  } catch (e) {
    if (e.code === 'P2025') return res.status(409).json({ error: 'Conflict: version mismatch' });
    if (e.code === 'P2002') return res.status(409).json({ error: 'Duplicate custom ID' });
    next(e);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: { inventory: { include: { access: true } } },
    });
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (!canWrite(item.inventory, req.user.id) && !req.user.isAdmin)
      return res.status(403).json({ error: 'Forbidden' });
    await prisma.item.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/:id/like', requireAuth, async (req, res, next) => {
  try {
    await prisma.like.upsert({
      where: { userId_itemId: { userId: req.user.id, itemId: req.params.id } },
      create: { userId: req.user.id, itemId: req.params.id },
      update: {},
    });
    const count = await prisma.like.count({ where: { itemId: req.params.id } });
    res.json({ liked: true, count });
  } catch (e) { next(e); }
});

router.delete('/:id/like', requireAuth, async (req, res, next) => {
  try {
    await prisma.like.deleteMany({
      where: { userId: req.user.id, itemId: req.params.id },
    });
    const count = await prisma.like.count({ where: { itemId: req.params.id } });
    res.json({ liked: false, count });
  } catch (e) { next(e); }
});

module.exports = router;
