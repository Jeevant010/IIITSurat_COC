const Match = require('../models/Match');
const Team = require('../models/Team');
const { computeLeaderboard } = require('../utils/leaderboard');

// Build all 6 round-robin pairings for 4 teams
function makeRoundRobinPairs(teamIds) {
  if (!Array.isArray(teamIds) || teamIds.length !== 4) {
    throw new Error('teamIds must be an array of exactly 4 team IDs');
  }
  const [A, B, C, D] = teamIds;
  return [
    [A, B],
    [A, C],
    [A, D],
    [B, C],
    [B, D],
    [C, D],
  ];
}

// Decide a winner by stars then destruction, return teamId ('draw' if tied fully)
function winnerOf(match) {
  const hs = Number(match.result?.home?.stars ?? 0);
  const as = Number(match.result?.away?.stars ?? 0);
  const hd = Number(match.result?.home?.destruction ?? 0);
  const ad = Number(match.result?.away?.destruction ?? 0);

  if (hs > as) return String(match.homeTeam._id || match.homeTeam);
  if (as > hs) return String(match.awayTeam._id || match.awayTeam);
  if (hd > ad) return String(match.homeTeam._id || match.homeTeam);
  if (ad > hd) return String(match.awayTeam._id || match.awayTeam);
  return 'draw';
}

// Loser of a completed match
function loserOf(match) {
  const w = winnerOf(match);
  if (w === 'draw') return 'draw';
  const homeId = String(match.homeTeam._id || match.homeTeam);
  const awayId = String(match.awayTeam._id || match.awayTeam);
  return w === homeId ? awayId : homeId;
}

// Create 6 group matches for the provided group and bracket
async function createGroupStage({ group, teamIds, scheduledAt, bracketId = 'main', warType = 'regular', size = 15, attacksPerMember }) {
  if (!group) throw new Error('group is required');
  if (!Array.isArray(teamIds) || teamIds.length !== 4) throw new Error('teamIds must have exactly 4 teams');
  if (!scheduledAt) throw new Error('scheduledAt required');

  const apm = attacksPerMember ?? (warType === 'cwl' ? 1 : 2);
  const pairs = makeRoundRobinPairs(teamIds);

  // Idempotency: don't duplicate if same exact pairs already exist for group+bracket
  const existing = await Match.find({
    stage: 'group',
    bracketId,
    round: 1,
    $or: pairs.map(([h, a]) => ({
      $or: [
        { homeTeam: h, awayTeam: a },
        { homeTeam: a, awayTeam: h },
      ],
    })),
  });

  const already = new Set(existing.map(m => [String(m.homeTeam), String(m.awayTeam)].sort().join('-')));
  const toCreate = pairs.filter(([h, a]) => !already.has([String(h), String(a)].sort().join('-')));

  const created = await Match.insertMany(
    toCreate.map(([homeTeam, awayTeam]) => ({
      homeTeam,
      awayTeam,
      scheduledAt: new Date(scheduledAt),
      stage: 'group',
      warType,
      size,
      attacksPerMember: apm,
      round: 1,
      bracketId,
      status: 'scheduled',
    }))
  );

  return created;
}

// Compute standings for a group (based on completed group matches only)
async function standingsForGroup({ group }) {
  const teams = await Team.find({ group }).lean();
  const teamIds = teams.map(t => String(t._id));

  const matches = await Match.find({
    stage: 'group',
    status: 'completed',
    $or: [
      { homeTeam: { $in: teamIds } },
      { awayTeam: { $in: teamIds } },
    ],
  })
    .populate('homeTeam', 'name')
    .populate('awayTeam', 'name');

  return computeLeaderboard(teams, matches);
}

// Seed Semi 1 (1 vs 2) and Eliminator (3 vs 4) from group standings
async function seedKnockoutFromGroup({ group, bracketId = 'main', scheduledAtSemi1, scheduledAtElim, warType = 'regular', size = 15, attacksPerMember }) {
  const apm = attacksPerMember ?? (warType === 'cwl' ? 1 : 2);
  const table = await standingsForGroup({ group });

  if (table.length < 4) {
    throw new Error('Not enough teams with standings to seed knockout (need 4)');
  }

  const t1 = table[0].teamId;
  const t2 = table[1].teamId;
  const t3 = table[2].teamId;
  const t4 = table[3].teamId;

  // Idempotency: check existing round 1 knockout for this bracket
  const existing = await Match.find({
    bracketId,
    round: 1,
    stage: { $in: ['semifinal', 'eliminator'] },
  });

  const haveSemi1 = existing.some(m =>
    m.stage === 'semifinal' &&
    [String(m.homeTeam), String(m.awayTeam)].sort().join('-') === [t1, t2].sort().join('-')
  );
  const haveElim = existing.some(m =>
    m.stage === 'eliminator' &&
    [String(m.homeTeam), String(m.awayTeam)].sort().join('-') === [t3, t4].sort().join('-')
  );

  const toCreate = [];
  if (!haveSemi1) {
    toCreate.push({
      homeTeam: t1,
      awayTeam: t2,
      scheduledAt: new Date(scheduledAtSemi1 || Date.now()),
      stage: 'semifinal',
      warType,
      size,
      attacksPerMember: apm,
      round: 1,
      bracketId,
      status: 'scheduled',
    });
  }
  if (!haveElim) {
    toCreate.push({
      homeTeam: t3,
      awayTeam: t4,
      scheduledAt: new Date(scheduledAtElim || Date.now()),
      stage: 'eliminator',
      warType,
      size,
      attacksPerMember: apm,
      round: 1,
      bracketId,
      status: 'scheduled',
    });
  }

  const created = toCreate.length ? await Match.insertMany(toCreate) : [];
  return created;
}

// After Semi1 + Eliminator are completed, create Semi2 and Final
async function advanceKnockout({ bracketId = 'main', scheduledAtSemi2, scheduledAtFinal, warType = 'regular', size = 15, attacksPerMember }) {
  const apm = attacksPerMember ?? (warType === 'cwl' ? 1 : 2);

  const [semi1] = await Match.find({ bracketId, round: 1, stage: 'semifinal' })
    .populate('homeTeam', '_id name')
    .populate('awayTeam', '_id name');
  const [elim] = await Match.find({ bracketId, round: 1, stage: 'eliminator' })
    .populate('homeTeam', '_id name')
    .populate('awayTeam', '_id name');

  if (!semi1 || !elim) {
    throw new Error('Semi 1 and Eliminator must exist before advancing');
  }
  if (semi1.status !== 'completed' || elim.status !== 'completed') {
    throw new Error('Semi 1 and Eliminator must be completed before advancing');
  }

  const semi1Winner = winnerOf(semi1);
  const semi1Loser = loserOf(semi1);
  const elimWinner = winnerOf(elim);

  if (semi1Winner === 'draw' || semi1Loser === 'draw' || elimWinner === 'draw') {
    throw new Error('Draws not supported for advancement; resolve tiebreakers first');
  }

  // Idempotency: do not recreate if already present
  const round2Existing = await Match.find({ bracketId, round: 2, stage: 'semifinal' });
  const round3Existing = await Match.find({ bracketId, round: 3, stage: 'final' });

  let semi2Doc = round2Existing[0];
  let finalDoc = round3Existing[0];

  if (!semi2Doc) {
    semi2Doc = await Match.create({
      homeTeam: semi1Loser,
      awayTeam: elimWinner,
      scheduledAt: new Date(scheduledAtSemi2 || Date.now()),
      stage: 'semifinal',
      warType,
      size,
      attacksPerMember: apm,
      round: 2,
      bracketId,
      status: 'scheduled',
    });
  }

  // If semi2 is already completed, we can compute its winner now; else we still create final with placeholder if desired.
  if (!finalDoc) {
    let finalHome = semi1Winner;
    let finalAway = null;

    // If Semi2 already completed, set real finalAway; else keep TBD (we still need two teams though)
    if (semi2Doc.status === 'completed') {
      const s2WinnerId = winnerOf(semi2Doc);
      if (s2WinnerId === 'draw') {
        throw new Error('Semi 2 ended in draw; resolve before creating final');
      }
      finalAway = s2WinnerId;
    } else {
      // create Final now with "TBD" away team by setting awayTeam same as homeTeam; admin can update once semi2 completes
      finalAway = semi1Winner; // temp to satisfy schema, will be updated via admin when semi2 completes
    }

    finalDoc = await Match.create({
      homeTeam: finalHome,
      awayTeam: finalAway,
      scheduledAt: new Date(scheduledAtFinal || Date.now()),
      stage: 'final',
      warType,
      size,
      attacksPerMember: apm,
      round: 3,
      bracketId,
      status: 'scheduled',
    });
  }

  return { semi2: semi2Doc, final: finalDoc };
}

module.exports = {
  createGroupStage,
  standingsForGroup,
  seedKnockoutFromGroup,
  advanceKnockout,
  winnerOf,
  loserOf,
};