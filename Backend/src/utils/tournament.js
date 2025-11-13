const Match = require('../models/Match');
const Team = require('../models/Team');

// Winner/loser helpers if you later need auto-advance
function winnerOf(m) {
  const hs = Number(m.result?.home?.stars ?? 0);
  const as = Number(m.result?.away?.stars ?? 0);
  const hd = Number(m.result?.home?.destruction ?? 0);
  const ad = Number(m.result?.away?.destruction ?? 0);
  if (hs > as) return String(m.homeTeam._id || m.homeTeam);
  if (as > hs) return String(m.awayTeam._id || m.awayTeam);
  if (hd > ad) return String(m.homeTeam._id || m.homeTeam);
  if (ad > hd) return String(m.awayTeam._id || m.awayTeam);
  return 'draw';
}
function loserOf(m) {
  const w = winnerOf(m);
  if (w === 'draw') return 'draw';
  const homeId = String(m.homeTeam._id || m.homeTeam);
  const awayId = String(m.awayTeam._id || m.awayTeam);
  return w === homeId ? awayId : homeId;
}

// Ensure a placeholder team "TBD" exists to be used in predesign
async function ensureTBDTeam() {
  let tbd = await Team.findOne({ name: 'TBD' });
  if (!tbd) {
    tbd = await Team.create({
      name: 'TBD',
      clanTag: '',
      level: null,
      warLeague: '',
      leader: '',
      logoUrl: '',
      about: 'Placeholder team',
      group: null,
      seed: null,
      members: [],
    });
  }
  return tbd;
}

/**
  Predesign the knockout bracket with 4 placeholder matches:
  - Round 1: semifinal, eliminator
  - Round 2: semifinal
  - Round 3: final
  All teams are TBD initially. Admin can edit teams later.
*/
async function predesignKnockout({
  bracketId = 'main',
  warType = 'regular',
  size = 15,
  attacksPerMember,
  scheduledAtSemi1,
  scheduledAtElim,
  scheduledAtSemi2,
  scheduledAtFinal,
  status = 'preparation', // matches your “UPCOMING” UI
}) {
  const apm = attacksPerMember ?? (warType === 'cwl' ? 1 : 2);
  const tbd = await ensureTBDTeam();
  const tbdId = tbd._id;

  // Check if any knockout matches already exist for this bracket; if yes, skip to avoid duplicates
  const existing = await Match.find({
    bracketId,
    stage: { $in: ['semifinal', 'eliminator', 'final'] },
  }).lean();

  const needSemi1 = !existing.some(m => m.stage === 'semifinal' && m.round === 1);
  const needElim = !existing.some(m => m.stage === 'eliminator' && m.round === 1);
  const needSemi2 = !existing.some(m => m.stage === 'semifinal' && m.round === 2);
  const needFinal = !existing.some(m => m.stage === 'final' && m.round === 3);

  const payloads = [];
  if (needSemi1) {
    payloads.push({
      homeTeam: tbdId, awayTeam: tbdId,
      scheduledAt: new Date(scheduledAtSemi1 || Date.now()),
      stage: 'semifinal', warType, size, attacksPerMember: apm,
      round: 1, bracketId, status,
    });
  }
  if (needElim) {
    payloads.push({
      homeTeam: tbdId, awayTeam: tbdId,
      scheduledAt: new Date(scheduledAtElim || Date.now()),
      stage: 'eliminator', warType, size, attacksPerMember: apm,
      round: 1, bracketId, status,
    });
  }
  if (needSemi2) {
    payloads.push({
      homeTeam: tbdId, awayTeam: tbdId,
      scheduledAt: new Date(scheduledAtSemi2 || Date.now()),
      stage: 'semifinal', warType, size, attacksPerMember: apm,
      round: 2, bracketId, status,
    });
  }
  if (needFinal) {
    payloads.push({
      homeTeam: tbdId, awayTeam: tbdId,
      scheduledAt: new Date(scheduledAtFinal || Date.now()),
      stage: 'final', warType, size, attacksPerMember: apm,
      round: 3, bracketId, status,
    });
  }

  if (payloads.length === 0) {
    return { count: 0, created: [] };
  }

  const created = await Match.insertMany(payloads);
  return { count: created.length, created };
}

module.exports = {
  ensureTBDTeam,
  predesignKnockout,
  winnerOf,
  loserOf,
};