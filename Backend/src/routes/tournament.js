const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const {
  createGroupStage,
  standingsForGroup,
  seedKnockoutFromGroup,
  advanceKnockout,
} = require('../utils/tournament');

const router = express.Router();

// All tournament ops require admin auth
router.use(adminAuth);

// POST /api/tournament/group/create
router.post('/tournament/group/create', async (req, res) => {
  try {
    const created = await createGroupStage(req.body);
    res.status(201).json({ count: created.length, created });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /api/tournament/group/standings?group=G1
router.get('/tournament/group/standings', async (req, res) => {
  try {
    const group = req.query.group;
    if (!group) return res.status(400).json({ error: 'group is required' });
    const table = await standingsForGroup({ group });
    res.json({ group, table });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/tournament/knockout/seed
router.post('/tournament/knockout/seed', async (req, res) => {
  try {
    const created = await seedKnockoutFromGroup(req.body);
    res.status(201).json({ count: created.length, created });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/tournament/knockout/advance
router.post('/tournament/knockout/advance', async (req, res) => {
  try {
    const result = await advanceKnockout(req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;