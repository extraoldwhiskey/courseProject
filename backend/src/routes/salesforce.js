const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { createAccountAndContact, getAuth } = require('../services/salesforce');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/status', (req, res) => {
  const configured = !!(
    process.env.SF_CLIENT_ID &&
    process.env.SF_CLIENT_SECRET &&
    process.env.SF_USERNAME &&
    process.env.SF_PASSWORD
  );
  res.json({ configured });
});

router.post('/create-contact', requireAuth, async (req, res, next) => {
  try {
    const targetUserId = req.body.userId || req.user.id;
    const isSelf  = targetUserId === req.user.id;
    const isAdmin = req.user.isAdmin;

    if (!isSelf && !isAdmin)
      return res.status(403).json({ error: 'Forbidden' });

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { firstName, lastName, phone, company, jobTitle, department, website, industry } = req.body;

    const result = await createAccountAndContact({
      user,
      form: { firstName, lastName, phone, company, jobTitle, department, website, industry },
    });

    res.status(201).json({
      ok: true,
      message: 'Account and Contact created in Salesforce',
      ...result,
    });
  } catch (e) {
    console.error('Salesforce error:', e.response?.data || e.message);
    const msg = e.response?.data?.[0]?.message || e.message || 'Salesforce error';
    res.status(502).json({ error: msg });
  }
});

module.exports = router;
