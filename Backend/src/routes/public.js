const express = require('express');
const Team = require('../models/Team');
const Match = require('../models/Match');
const { computeLeaderboard } = require('../utils/leaderboard');

const router = express.Router();

function mapPlayersToMembers(players = []) {
  // Back-compat: convert old "players" into "members"-like objects
  return players.map((p) => ({
    _id: p._id,
    name: p.name,
    role: p.position || '', // no role in old schema; reuse "position" text if present
    thLevel: null, // unknown in old data
    heroes: { bk: 0, aq: 0, gw: 0, rc: 0 },
    stats: {
      attacks: p.stats?.appearances ?? 0,
      triples: p.stats?.goals ?? 0, // rough mapping if football data existed
      stars: p.stats?.goals ?? 0,
      avgStars: 0,
      avgDestruction: 0
    }
  }));
}

// Clans list
router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find(
      {},
      { name: 1, logoUrl: 1, leader: 1, clanTag: 1, level: 1, warLeague: 1, seed: 1, group: 1, members: 1, players: 1 }
    )
      .sort({ name: 1 })
      .lean();

    const mapped = teams.map((t) => {
      const memberCount = (t.members && t.members.length) ? t.members.length : (t.players?.length || 0);
      return { ...t, memberCount };
    });

    res.json(mapped);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch clans' });
  }
});

// Clan details
router.get('/teams/:id', async (req, res) => {
  try {
    const t = await Team.findById(req.params.id).lean();
    if (!t) return res.status(404).json({ error: 'Clan not found' });

    // Back-compat: if members empty but players exist, synthesize members
    let members = Array.isArray(t.members) ? t.members : [];
    if ((!members || members.length === 0) && Array.isArray(t.players) && t.players.length > 0) {
      members = mapPlayersToMembers(t.players);
    }
    res.json({ ...t, members });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch clan' });
  }
});

// Schedule (wars)
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

// Bracket by rounds (wars)
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
        warType: m.warType,
        size: m.size,
        attacksPerMember: m.attacksPerMember,
        scheduledAt: m.scheduledAt,
        homeTeam: m.homeTeam ? { _id: m.homeTeam._id, name: m.homeTeam.name } : null,
        awayTeam: m.awayTeam ? { _id: m.awayTeam._id, name: m.awayTeam.name } : null,
        result: m.result
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