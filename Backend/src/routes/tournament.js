const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const { predesignKnockout } = require('../utils/tournament');
const { normalizeStatus } = require('../utils/status');

const router = express.Router();
router.use(adminAuth);

// POST /api/tournament/knockout/predesign
router.post('/tournament/knockout/predesign', async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.status) {
      const norm = normalizeStatus(body.status);
      if (norm) body.status = norm;
      else delete body.status;
    }
    const result = await predesignKnockout(body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;