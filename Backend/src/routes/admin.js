const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const Team = require('../models/Team');
const Match = require('../models/Match');
const { normalizeStatus } = require('../utils/status');

const router = express.Router();
router.use(adminAuth);

// Teams
router.post('/teams', async (req, res) => {
  try {
    const { name, clanTag, level, warLeague, leader, logoUrl, about, group, seed, members } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const team = await Team.create({
      name,
      clanTag: clanTag || '',
      level: level ?? null,
      warLeague: warLeague || '',
      leader: leader || '',
      logoUrl: logoUrl || '',
      about: about || '',
      group: group ?? null,
      seed: seed ?? null,
      members: Array.isArray(members) ? members : []
    });
    res.status(201).json(team);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create clan', details: e.message });
  }
});

router.put('/teams/:id', async (req, res) => {
  try {
    const { name, clanTag, level, warLeague, leader, logoUrl, about, group, seed, members } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (clanTag !== undefined) update.clanTag = clanTag;
    if (level !== undefined) update.level = level;
    if (warLeague !== undefined) update.warLeague = warLeague;
    if (leader !== undefined) update.leader = leader;
    if (logoUrl !== undefined) update.logoUrl = logoUrl;
    if (about !== undefined) update.about = about;
    if (group !== undefined) update.group = group;
    if (seed !== undefined) update.seed = seed;
    if (members !== undefined) {
      if (!Array.isArray(members)) return res.status(400).json({ error: 'members must be an array' });
      update.members = members;
    }
    const team = await Team.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!team) return res.status(404).json({ error: 'Clan not found' });
    res.json(team);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update clan', details: e.message });
  }
});

router.delete('/teams/:id', async (req, res) => {
  try {
    const t = await Team.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ error: 'Clan not found' });
    await Match.deleteMany({ $or: [{ homeTeam: t._id }, { awayTeam: t._id }] });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete clan' });
  }
});

// Members
router.post('/teams/:id/members', async (req, res) => {
  try {
    const { name, playerTag, email, townHall, role, stats } = req.body;
    if (!name) return res.status(400).json({ error: 'member name required' });

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Clan not found' });

    team.members.push({
      name,
      playerTag: playerTag || '',
      email: email || '',
      townHall: townHall ?? null,
      role: role || '',
      stats: {
        attacks: stats?.attacks ?? 0,
        triples: stats?.triples ?? 0,
        stars: stats?.stars ?? 0,
        avgStars: stats?.avgStars ?? 0,
        avgDestruction: stats?.avgDestruction ?? 0,
        extra: stats?.extra
      }
    });
    await team.save();
    res.status(201).json(team);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add member', details: e.message });
  }
});

router.put('/teams/:id/members/:memberId', async (req, res) => {
  try {
    const { name, playerTag, email, townHall, role, stats } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Clan not found' });

    const member = team.members.id(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (name !== undefined) member.name = name;
    if (playerTag !== undefined) member.playerTag = playerTag;
    if (email !== undefined) member.email = email;
    if (townHall !== undefined) member.townHall = townHall;
    if (role !== undefined) member.role = role;
    if (stats !== undefined) {
      member.stats.attacks = stats.attacks ?? member.stats.attacks;
      member.stats.triples = stats.triples ?? member.stats.triples;
      member.stats.stars = stats.stars ?? member.stats.stars;
      member.stats.avgStars = stats.avgStars ?? member.stats.avgStars;
      member.stats.avgDestruction = stats.avgDestruction ?? member.stats.avgDestruction;
      if (stats.extra) {
        member.stats.extra = member.stats.extra || {};
        for (const [k, v] of Object.entries(stats.extra)) {
          member.stats.extra.set ? member.stats.extra.set(k, v) : member.stats.extra[k] = v;
        }
      }
    }

    await team.save();
    res.json(team);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update member', details: e.message });
  }
});

router.delete('/teams/:id/members/:memberId', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Clan not found' });

    const member = team.members.id(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    member.deleteOne();
    await team.save();
    res.json(team);
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete member', details: e.message });
  }
});

// Matches
router.post('/matches', async (req, res) => {
  try {
    const {
      homeTeam, awayTeam, scheduledAt,
      stage = 'group', warType = 'regular', size = 15, attacksPerMember,
      round = 1, bracketId = 'main', status
    } = req.body;

    if (!homeTeam || !awayTeam || !scheduledAt) {
      return res.status(400).json({ error: 'homeTeam, awayTeam, scheduledAt required' });
    }

    const apm = attacksPerMember ?? (warType === 'cwl' ? 1 : 2);
    const normStatus = normalizeStatus(status);

    const match = await Match.create({
      homeTeam,
      awayTeam,
      scheduledAt: new Date(scheduledAt),
      stage,
      warType,
      size,
      attacksPerMember: apm,
      round,
      bracketId,
      ...(normStatus ? { status: normStatus } : {}) // if not provided, schema default applies
    });

    const populated = await match.populate([
      { path: 'homeTeam', select: 'name' },
      { path: 'awayTeam', select: 'name' }
    ]);

    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create war', details: e.message });
  }
});

router.put('/matches/:id', async (req, res) => {
  try {
    const {
      homeTeam, awayTeam, scheduledAt, stage, warType, size, attacksPerMember,
      round, bracketId, status, result
    } = req.body;

    const updates = {};
    if (homeTeam) updates.homeTeam = homeTeam;
    if (awayTeam) updates.awayTeam = awayTeam;
    if (scheduledAt) updates.scheduledAt = new Date(scheduledAt);
    if (stage) updates.stage = stage;
    if (warType) updates.warType = warType;
    if (size !== undefined) updates.size = size;
    if (attacksPerMember !== undefined) updates.attacksPerMember = attacksPerMember;
    if (round !== undefined) updates.round = round;
    if (bracketId !== undefined) updates.bracketId = bracketId;

    const normStatus = normalizeStatus(status);
    if (normStatus) updates.status = normStatus;

    if (result) {
      updates.result = {
        home: {
          stars: result.home?.stars ?? undefined,
          destruction: result.home?.destruction ?? undefined,
          attacksUsed: result.home?.attacksUsed ?? undefined
        },
        away: {
          stars: result.away?.stars ?? undefined,
          destruction: result.away?.destruction ?? undefined,
          attacksUsed: result.away?.attacksUsed ?? undefined
        }
      };
    }

    const match = await Match.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('homeTeam', 'name')
      .populate('awayTeam', 'name');

    if (!match) return res.status(404).json({ error: 'War not found' });
    res.json(match);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update war', details: e.message });
  }
});

router.delete('/matches/:id', async (req, res) => {
  try {
    const m = await Match.findByIdAndDelete(req.params.id);
    if (!m) return res.status(404).json({ error: 'War not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete war' });
  }
});

module.exports = router;