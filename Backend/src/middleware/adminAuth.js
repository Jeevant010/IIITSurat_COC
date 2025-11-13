module.exports = function adminAuth(req, res, next) {
  // Allow CORS preflight without auth
  if (req.method === 'OPTIONS') return next();

  const header = String(req.headers['x-admin-password'] || '').trim();
  const expected = String(process.env.ADMIN_PASSWORD || '').trim();

  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD not configured' });
  }
  if (!header) {
    return res.status(401).json({ error: 'Unauthorized', code: 'MISSING_HEADER' });
  }
  if (header !== expected) {
    return res.status(401).json({ error: 'Unauthorized', code: 'BAD_PASSWORD' });
  }
  next();
};