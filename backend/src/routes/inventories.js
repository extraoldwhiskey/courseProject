const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { getInventoryWithAccess, canWrite, isOwnerOrAdmin } = require('../services/access');

const prisma = new PrismaClient();
const router = express.Router();

const inventorySummary = {
  id: true, title: true, description: true, imageUrl: true,
  isPublic: true, categoryId: true, version: true,
  createdAt: true, updatedAt: true, creatorId: true,
  creator: { select: { id: true, name: true, avatar: true } },
  category: true,
  tags: { include: { tag: true } },
  _count: { select: { items: true } },
};

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const where = {};
    if (req.query.category) where.categoryId = parseInt(req.query.category);
    if (req.query.tag) {
      where.tags = { some: { tag: { name: req.query.tag } } };
    }
    const orderBy = req.query.sort === 'popular'
      ? { items: { _count: 'desc' } }
      : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.inventory.findMany({ where, orderBy, skip, take: limit, select: inventorySummary }),
      prisma.inventory.count({ where }),
    ]);
    res.json({ items, total, page, limit });
  } catch (e) { next(e); }
});

router.get('/latest', async (req, res, next) => {
  try {
    const items = await prisma.inventory.findMany({
      orderBy: { createdAt: 'desc' }, take: 10, select: inventorySummary,
    });
    res.json(items);
  } catch (e) { next(e); }
});

router.get('/popular', async (req, res, next) => {
  try {
    const items = await prisma.inventory.findMany({
      orderBy: { items: { _count: 'desc' } }, take: 5, select: inventorySummary,
    });
    res.json(items);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const inv = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        category: true,
        tags: { include: { tag: true } },
        fields: { orderBy: { order: 'asc' } },
        access: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        customIdConf: true,
        _count: { select: { items: true } },
      },
    });
    if (!inv) return res.status(404).json({ error: 'Not found' });
    res.json(inv);
  } catch (e) { next(e); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { title, description, imageUrl, isPublic, categoryId, tags } = req.body;
    const inv = await prisma.inventory.create({
      data: {
        title, description, imageUrl, isPublic: !!isPublic,
        categoryId: categoryId ? parseInt(categoryId) : null,
        creatorId: req.user.id,
        tags: tags?.length ? {
          create: await resolveTags(tags),
        } : undefined,
      },
      select: inventorySummary,
    });
    res.status(201).json(inv);
  } catch (e) { next(e); }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const inv = await getInventoryWithAccess(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Not found' });
    if (!isOwnerOrAdmin(inv, req.user)) return res.status(403).json({ error: 'Forbidden' });

    const { title, description, imageUrl, isPublic, categoryId, tags, version } = req.body;

    if (version !== undefined && inv.version !== parseInt(version)) {
      return res.status(409).json({ error: 'Conflict: inventory was modified', serverVersion: inv.version });
    }

    const tagOps = tags !== undefined ? {
      deleteMany: {},
      create: await resolveTags(tags),
    } : undefined;

    const updated = await prisma.inventory.update({
      where: { id: req.params.id, version: inv.version },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isPublic !== undefined && { isPublic }),
        ...(categoryId !== undefined && { categoryId: categoryId ? parseInt(categoryId) : null }),
        version: { increment: 1 },
        ...(tagOps && { tags: tagOps }),
      },
      select: inventorySummary,
    });
    res.json(updated);
  } catch (e) {
    if (e.code === 'P2025') return res.status(409).json({ error: 'Conflict: version mismatch' });
    next(e);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const inv = await prisma.inventory.findUnique({ where: { id: req.params.id } });
    if (!inv) return res.status(404).json({ error: 'Not found' });
    if (!isOwnerOrAdmin(inv, req.user)) return res.status(403).json({ error: 'Forbidden' });
    await prisma.inventory.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.put('/:id/access', requireAuth, async (req, res, next) => {
  try {
    const inv = await prisma.inventory.findUnique({ where: { id: req.params.id } });
    if (!inv) return res.status(404).json({ error: 'Not found' });
    if (!isOwnerOrAdmin(inv, req.user)) return res.status(403).json({ error: 'Forbidden' });

    const { userIds, isPublic } = req.body;
    await prisma.$transaction([
      prisma.inventory.update({ where: { id: req.params.id }, data: { isPublic: !!isPublic } }),
      prisma.inventoryAccess.deleteMany({ where: { inventoryId: req.params.id } }),
      ...(userIds?.length ? [
        prisma.inventoryAccess.createMany({
          data: userIds.map((uid) => ({ inventoryId: req.params.id, userId: uid })),
          skipDuplicates: true,
        })
      ] : []),
    ]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.put('/:id/fields', requireAuth, async (req, res, next) => {
  try {
    const inv = await prisma.inventory.findUnique({ where: { id: req.params.id } });
    if (!inv) return res.status(404).json({ error: 'Not found' });
    if (!isOwnerOrAdmin(inv, req.user)) return res.status(403).json({ error: 'Forbidden' });

    const { fields } = req.body;
    await prisma.$transaction([
      prisma.inventoryField.deleteMany({ where: { inventoryId: req.params.id } }),
      prisma.inventoryField.createMany({
        data: fields.map((f, i) => ({
          inventoryId: req.params.id,
          name: f.name,
          description: f.description || null,
          fieldType: f.fieldType,
          fieldIndex: f.fieldIndex,
          showInTable: f.showInTable !== false,
          order: i,
        })),
      }),
    ]);
    const updated = await prisma.inventoryField.findMany({
      where: { inventoryId: req.params.id }, orderBy: { order: 'asc' },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

router.put('/:id/custom-id-config', requireAuth, async (req, res, next) => {
  try {
    const inv = await prisma.inventory.findUnique({ where: { id: req.params.id } });
    if (!inv) return res.status(404).json({ error: 'Not found' });
    if (!isOwnerOrAdmin(inv, req.user)) return res.status(403).json({ error: 'Forbidden' });

    const { elements } = req.body;
    const conf = await prisma.customIdConfig.upsert({
      where: { inventoryId: req.params.id },
      create: { inventoryId: req.params.id, elements: elements || [] },
      update: { elements: elements || [] },
    });
    res.json(conf);
  } catch (e) { next(e); }
});

router.get('/:id/stats', async (req, res, next) => {
  try {
    const inv = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      include: { fields: true },
    });
    if (!inv) return res.status(404).json({ error: 'Not found' });

    const numFields = inv.fields.filter((f) => f.fieldType === 'number');
    const strFields = inv.fields.filter((f) => f.fieldType === 'string');

    const numStats = numFields.length ? await prisma.item.aggregate({
      where: { inventoryId: req.params.id },
      _count: true,
      _avg: Object.fromEntries(numFields.map((f) => [`number${f.fieldIndex + 1}`, true])),
      _min: Object.fromEntries(numFields.map((f) => [`number${f.fieldIndex + 1}`, true])),
      _max: Object.fromEntries(numFields.map((f) => [`number${f.fieldIndex + 1}`, true])),
    }) : { _count: await prisma.item.count({ where: { inventoryId: req.params.id } }) };

    res.json({ count: numStats._count || numStats._count, numStats, fieldCount: inv.fields.length });
  } catch (e) { next(e); }
});

async function resolveTags(tagNames) {
  const resolved = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({ where: { name }, create: { name }, update: {} })
    )
  );
  return resolved.map((t) => ({ tagId: t.id }));
}

module.exports = router;
