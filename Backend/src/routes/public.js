const express = require('express');
const Team = require('../models/Team');
const Match = require('../models/Match');
const { computeLeaderboard } = require('../utils/leaderboard');

const router = express.Router();

// Teams
router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find().sort({ name: 1 });
    res.json(teams);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Schedule (all matches)
router.get('/schedule', async (req, res) => {
  try {
    const matches = await Match.find()
      .populate('homeTeam', 'name')
      .populate('awayTeam', 'name')
      .sort({ scheduledAt: 1 });
    res.json(matches);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const teams = await Team.find();
    const matches = await Match.find({ status: 'completed' })
      .populate('homeTeam', 'name')
      .populate('awayTeam', 'name');

    const board = computeLeaderboard(teams, matches);
    res.json(board);
  } catch (e) {
    res.status(500).json({ error: 'Failed to compute leaderboard' });
  }
});

// Bracket by rounds
router.get('/bracket', async (req, res) => {
  try {
    const bracketId = req.query.bracketId || 'main';
    const matches = await Match.find({ bracketId })
      .populate('homeTeam', 'name')
      .populate('awayTeam', 'name')
      .sort({ round: 1, scheduledAt: 1, createdAt: 1 });

    const roundsMap = new Map();
    for (const m of matches) {
      const r = m.round || 1;
      if (!roundsMap.has(r)) roundsMap.set(r, []);
      roundsMap.get(r).push({
        _id: m._id,
        round: r,
        status: m.status,
        scheduledAt: m.scheduledAt,
        homeTeam: m.homeTeam ? { _id: m.homeTeam._id, name: m.homeTeam.name } : null,
        awayTeam: m.awayTeam ? { _id: m.awayTeam._id, name: m.awayTeam.name } : null,
        score: m.score
      });
    }
    const rounds = Array.from(roundsMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([round, matches]) => ({ round, matches }));

    res.json({ bracketId, rounds });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch bracket' });
  }
});

module.exports = router;