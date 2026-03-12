const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(cats);
  } catch (e) { next(e); }
});

module.exports = router;
