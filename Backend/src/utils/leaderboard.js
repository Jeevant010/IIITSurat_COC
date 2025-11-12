// Compute leaderboard from teams and completed matches
// Scoring: Win=3, Draw=1, Loss=0
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
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0
    });
  }

  for (const m of matches) {
    if (m.status !== 'completed') continue;
    const homeId = String(m.homeTeam._id || m.homeTeam);
    const awayId = String(m.awayTeam._id || m.awayTeam);
    const hs = m.score?.home ?? 0;
    const as = m.score?.away ?? 0;

    const home = table.get(homeId);
    const away = table.get(awayId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;

    home.gf += hs;
    home.ga += as;
    home.gd = home.gf - home.ga;

    away.gf += as;
    away.ga += hs;
    away.gd = away.gf - away.ga;

    if (hs > as) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
    } else if (hs < as) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const list = Array.from(table.values());
  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });

  return list;
}

module.exports = { computeLeaderboard };