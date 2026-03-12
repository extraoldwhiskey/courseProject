const express = require('express');
const passport = require('passport');
const router = express.Router();

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

router.get('/me', (req, res) => {
  if (!req.user) return res.json(null);
  const { id, email, name, avatar, isAdmin, isBlocked, createdAt } = req.user;
  res.json({ id, email, name, avatar, isAdmin, isBlocked, createdAt });
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND}/login?error=1` }),
  (req, res) => res.redirect(FRONTEND)
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${FRONTEND}/login?error=1` }),
  (req, res) => res.redirect(FRONTEND)
);

router.post('/logout', (req, res) => {
  req.logout(() => res.json({ ok: true }));
});

module.exports = router;
