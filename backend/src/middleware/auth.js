const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.isBlocked) return res.status(403).json({ error: 'Account blocked' });
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
  next();
};

module.exports = { requireAuth, requireAdmin };
