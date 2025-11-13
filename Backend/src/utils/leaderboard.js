// Clash wars leaderboard with richer stats
// Win=3, Draw=1, Loss=0. Tie-breaks: Stars Diff, Avg Destruction, Avg Stars, Name.
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
      destFor: 0,
      destAgainst: 0,
      destDiff: 0,
      avgDestFor: 0,
      avgStarsFor: 0,
      winRate: 0,
      points: 0,
      totalStars: 0,
      totalDestruction: 0
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

    home.played++; away.played++;
    home.starsFor += hs; home.starsAgainst += as;
    away.starsFor += as; away.starsAgainst += hs;
    home.destFor += hd; home.destAgainst += ad;
    away.destFor += ad; away.destAgainst += hd;

    if (hs > as) { home.wins++; away.losses++; home.points += 3; }
    else if (hs < as) { away.wins++; home.losses++; away.points += 3; }
    else {
      if (hd > ad) { home.wins++; away.losses++; home.points += 3; }
      else if (hd < ad) { away.wins++; home.losses++; away.points += 3; }
      else { home.draws++; away.draws++; home.points++; away.points++; }
    }
  }

  const list = Array.from(table.values()).map(r => {
    r.starsDiff = r.starsFor - r.starsAgainst;
    r.destDiff = +(r.destFor - r.destAgainst).toFixed(2);
    r.avgDestFor = r.played ? +(r.destFor / r.played).toFixed(2) : 0;
    r.avgStarsFor = r.played ? +(r.starsFor / r.played).toFixed(2) : 0;
    r.winRate = r.played ? +((r.wins / r.played) * 100).toFixed(1) : 0;
    r.totalStars = r.starsFor;
    r.totalDestruction = +r.destFor.toFixed(2);
    return r;
  });

  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.starsDiff !== a.starsDiff) return b.starsDiff - a.starsDiff;
    if (b.avgDestFor !== a.avgDestFor) return b.avgDestFor - a.avgDestFor;
    if (b.avgStarsFor !== a.avgStarsFor) return b.avgStarsFor - a.avgStarsFor;
    return a.name.localeCompare(b.name);
  });

  return list;
}

module.exports = { computeLeaderboard };