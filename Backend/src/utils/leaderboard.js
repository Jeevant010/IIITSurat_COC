// Leaderboard for Clash of Clans wars
// Scoring: Win=3, Draw=1, Loss=0
// Tie-breaker: Destruction percentage
function computeLeaderboard(teams, matches) {
  const table = new Map();
  for (const t of teams) {
    table.set(String(t._id), {
      teamId: String(t._id),
      name: t.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      starsFor: 0,
      starsAgainst: 0,
      starsDiff: 0,
      destFor: 0,          // total destruction percentage sum
      destAgainst: 0,
      destDiff: 0,
      avgDestFor: 0,
      points: 0
    });
  }

  for (const m of matches) {
    if (m.status !== 'completed') continue;
    const homeId = String(m.homeTeam._id || m.homeTeam);
    const awayId = String(m.awayTeam._id || m.awayTeam);
    const home = table.get(homeId);
    const away = table.get(awayId);
    if (!home || !away) continue;

    const hs = Number(m.result?.home?.stars ?? 0);
    const as = Number(m.result?.away?.stars ?? 0);
    const hd = Number(m.result?.home?.destruction ?? 0);
    const ad = Number(m.result?.away?.destruction ?? 0);

    home.played += 1;
    away.played += 1;

    home.starsFor += hs;
    home.starsAgainst += as;
    away.starsFor += as;
    away.starsAgainst += hs;

    home.destFor += hd;
    home.destAgainst += ad;
    away.destFor += ad;
    away.destAgainst += hd;

    // Decide winner: stars first, then destruction
    let homePts = 0;
    let awayPts = 0;
    if (hs > as) {
      home.wins += 1; away.losses += 1; homePts = 3;
    } else if (hs < as) {
      away.wins += 1; home.losses += 1; awayPts = 3;
    } else {
      if (hd > ad) {
        home.wins += 1; away.losses += 1; homePts = 3;
      } else if (hd < ad) {
        away.wins += 1; home.losses += 1; awayPts = 3;
      } else {
        home.draws += 1; away.draws += 1; homePts = 1; awayPts = 1;
      }
    }
    home.points += homePts;
    away.points += awayPts;
  }

  const list = Array.from(table.values()).map((r) => {
    r.starsDiff = r.starsFor - r.starsAgainst;
    r.destDiff = r.destFor - r.destAgainst;
    r.avgDestFor = r.played ? +(r.destFor / r.played).toFixed(2) : 0;
    return r;
  });

  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.starsDiff !== a.starsDiff) return b.starsDiff - a.starsDiff;
    if (b.avgDestFor !== a.avgDestFor) return b.avgDestFor - a.avgDestFor;
    return a.name.localeCompare(b.name);
  });

  return list;
}

module.exports = { computeLeaderboard };