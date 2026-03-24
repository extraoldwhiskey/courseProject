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

router.get('/debug-auth', async (req, res) => {
  const axios = require('axios');
  const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
  const version  = process.env.SF_API_VERSION || 'v59.0';
  const username = process.env.SF_USERNAME || '';
  const combined = (process.env.SF_PASSWORD || '') + (process.env.SF_SECURITY_TOKEN || '');

  const debug = {
    method: 'SOAP',
    loginUrl,
    username,
    password_len:  (process.env.SF_PASSWORD      || '').length,
    token_len:     (process.env.SF_SECURITY_TOKEN || '').length,
    combined_len:  combined.length,
  };

  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:partner.soap.sforce.com">
  <soapenv:Body>
    <urn:login>
      <urn:username>${username}</urn:username>
      <urn:password>${combined}</urn:password>
    </urn:login>
  </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const { data } = await axios.post(
      `${loginUrl}/services/Soap/u/${version}`,
      soapBody,
      { headers: { 'Content-Type': 'text/xml', SOAPAction: 'login' } }
    );
    const hasSession = data.includes('<sessionId>');
    res.json({ ok: hasSession, method: 'SOAP', hasSession, debug });
  } catch (e) {
    res.status(400).json({ ok: false, method: 'SOAP',
      sfError: e.response?.data?.substring?.(0, 500) || e.message, debug });
  }
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