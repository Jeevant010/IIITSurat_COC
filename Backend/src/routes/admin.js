const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const Team = require('../models/Team');
const Match = require('../models/Match');

const router = express.Router();

router.use(adminAuth);

// Teams CRUD
router.post('/teams', async (req, res) => {
  try {
    const { name, group, seed } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const team = await Team.create({ name, group: group || null, seed: seed ?? null });
    res.status(201).json(team);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create team', details: e.message });
  }
});

router.put('/teams/:id', async (req, res) => {
  try {
    const { name, group, seed } = req.body;
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(group !== undefined && { group }), ...(seed !== undefined && { seed }) },
      { new: true }
    );
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update team' });
  }
});

router.delete('/teams/:id', async (req, res) => {
  try {
    const t = await Team.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ error: 'Team not found' });
    await Match.deleteMany({ $or: [{ homeTeam: t._id }, { awayTeam: t._id }] });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Matches CRUD
router.post('/matches', async (req, res) => {
  try {
    const { homeTeam, awayTeam, scheduledAt, round = 1, bracketId = 'main' } = req.body;
    if (!homeTeam || !awayTeam || !scheduledAt) {
      return res.status(400).json({ error: 'homeTeam, awayTeam, scheduledAt required' });
    }
    const match = await Match.create({
      homeTeam,
      awayTeam,
      scheduledAt: new Date(scheduledAt),
      round,
      bracketId
    });
    const populated = await match.populate([
      { path: 'homeTeam', select: 'name' },
      { path: 'awayTeam', select: 'name' }
    ]);
    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create match', details: e.message });
  }
});

router.put('/matches/:id', async (req, res) => {
  try {
    const { homeTeam, awayTeam, scheduledAt, round, bracketId, status, score } = req.body;
    const updates = {};
    if (homeTeam) updates.homeTeam = homeTeam;
    if (awayTeam) updates.awayTeam = awayTeam;
    if (scheduledAt) updates.scheduledAt = new Date(scheduledAt);
    if (round !== undefined) updates.round = round;
    if (bracketId !== undefined) updates.bracketId = bracketId;
    if (status) updates.status = status;
    if (score) updates.score = { home: score.home ?? null, away: score.away ?? null };

    const match = await Match.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('homeTeam', 'name')
      .populate('awayTeam', 'name');
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update match' });
  }
});

router.delete('/matches/:id', async (req, res) => {
  try {
    const m = await Match.findByIdAndDelete(req.params.id);
    if (!m) return res.status(404).json({ error: 'Match not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// Bracket generation (single-elimination Round 1 pairings)
router.post('/bracket/generate', async (req, res) => {
  try {
    const { bracketId = 'main', teamIds = [], scheduledAt, round = 1 } = req.body;
    if (!Array.isArray(teamIds) || teamIds.length < 2) {
      return res.status(400).json({ error: 'teamIds array of length >= 2 required' });
    }
    if (!scheduledAt) {
      return res.status(400).json({ error: 'scheduledAt required for initial matches' });
    }
    const pairs = [];
    for (let i = 0; i < teamIds.length; i += 2) {
      const home = teamIds[i];
      const away = teamIds[i + 1];
      if (!away) break;
      pairs.push({ home, away });
    }
    const created = await Promise.all(
      pairs.map((p) =>
        Match.create({
          homeTeam: p.home,
          awayTeam: p.away,
          scheduledAt: new Date(scheduledAt),
          round,
          bracketId
        })
      )
    );
    const populated = await Match.find({ _id: { $in: created.map((c) => c._id) } })
      .populate('homeTeam', 'name')
      .populate('awayTeam', 'name')
      .sort({ createdAt: 1 });
    res.status(201).json({ created: populated, count: populated.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate bracket', details: e.message });
  }
});

module.exports = router;