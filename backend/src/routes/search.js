const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ inventories: [], items: [], total: 0 });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const offset = (page - 1) * limit;
    const type = req.query.type || 'all';

    const tsQuery = q.split(/\s+/).filter(Boolean).map((w) => `${w}:*`).join(' & ');

    const [inventories, items] = await Promise.all([
      (type === 'all' || type === 'inventories') ? prisma.$queryRaw`
        SELECT i.id, i.title, i.description, i."imageUrl", i."creatorId",
               i."createdAt", u.name as "creatorName", u.avatar as "creatorAvatar",
               COUNT(it.id) as "itemCount"
        FROM "Inventory" i
        JOIN "User" u ON u.id = i."creatorId"
        LEFT JOIN "Item" it ON it."inventoryId" = i.id
        WHERE to_tsvector('english', coalesce(i.title,'') || ' ' || coalesce(i.description,''))
              @@ to_tsquery('english', ${tsQuery})
        GROUP BY i.id, u.name, u.avatar
        ORDER BY ts_rank(
          to_tsvector('english', coalesce(i.title,'') || ' ' || coalesce(i.description,'')),
          to_tsquery('english', ${tsQuery})
        ) DESC
        LIMIT ${limit} OFFSET ${offset}
      ` : [],
      (type === 'all' || type === 'items') ? prisma.$queryRaw`
        SELECT it.id, it."customId", it."inventoryId", it."createdAt",
               it.string1, it.string2, it.string3,
               inv.title as "inventoryTitle",
               u.name as "creatorName"
        FROM "Item" it
        JOIN "Inventory" inv ON inv.id = it."inventoryId"
        JOIN "User" u ON u.id = it."createdById"
        WHERE to_tsvector('english',
          coalesce(it."customId",'') || ' ' ||
          coalesce(it.string1,'') || ' ' || coalesce(it.string2,'') || ' ' || coalesce(it.string3,'') || ' ' ||
          coalesce(it.text1,'') || ' ' || coalesce(it.text2,'') || ' ' || coalesce(it.text3,'')
        ) @@ to_tsquery('english', ${tsQuery})
        ORDER BY ts_rank(
          to_tsvector('english',
            coalesce(it."customId",'') || ' ' ||
            coalesce(it.string1,'') || ' ' || coalesce(it.string2,'') || ' ' ||
            coalesce(it.string3,'') || ' ' || coalesce(it.text1,'') || ' ' ||
            coalesce(it.text2,'') || ' ' || coalesce(it.text3,'')
          ),
          to_tsquery('english', ${tsQuery})
        ) DESC
        LIMIT ${limit} OFFSET ${offset}
      ` : [],
    ]);

    res.json({
      inventories: inventories.map(r => ({...r, itemCount: Number(r.itemCount)})),
      items,
      query: q,
    });
  } catch (e) { next(e); }
});

module.exports = router;
