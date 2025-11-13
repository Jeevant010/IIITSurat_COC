import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

function fmt(dt) {
  try { return new Date(dt).toLocaleString(); } catch { return dt; }
}

function computeClanStats(teamId, matches) {
  const stats = { played: 0, wins: 0, draws: 0, losses: 0, starsFor: 0, starsAgainst: 0, starsDiff: 0, destFor: 0, destAgainst: 0, destDiff: 0, avgDestFor: 0, points: 0 };
  for (const m of matches) {
    const isHome = String(m.homeTeam?._id || m.homeTeam) === teamId;
    const isAway = String(m.awayTeam?._id || m.awayTeam) === teamId;
    if (!isHome && !isAway) continue;
    if (m.status !== 'completed') continue;

    const hs = Number(m.result?.home?.stars ?? 0);
    const as = Number(m.result?.away?.stars ?? 0);
    const hd = Number(m.result?.home?.destruction ?? 0);
    const ad = Number(m.result?.away?.destruction ?? 0);

    const ours = isHome ? { s: hs, d: hd } : { s: as, d: ad };
    const theirs = isHome ? { s: as, d: ad } : { s: hs, d: hd };

    stats.played += 1;
    stats.starsFor += ours.s;
    stats.starsAgainst += theirs.s;
    stats.destFor += ours.d;
    stats.destAgainst += theirs.d;

    if (ours.s > theirs.s) { stats.wins += 1; stats.points += 3; }
    else if (ours.s < theirs.s) { stats.losses += 1; }
    else {
      if (ours.d > theirs.d) { stats.wins += 1; stats.points += 3; }
      else if (ours.d < theirs.d) { stats.losses += 1; }
      else { stats.draws += 1; stats.points += 1; }
    }
  }
  stats.starsDiff = stats.starsFor - stats.starsAgainst;
  stats.destDiff = stats.destFor - stats.destAgainst;
  stats.avgDestFor = stats.played ? +(stats.destFor / stats.played).toFixed(2) : 0;
  return stats;
}

export default function Team() {
  const { id } = useParams();
  const [team, setTeam] = React.useState(null);
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    Promise.all([api.getTeam(id), api.getSchedule()])
      .then(([t, s]) => { setTeam(t); setMatches(s); })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading clan…</p>;
  if (err) return <p className="error">{err}</p>;
  if (!team) return <p className="error">Clan not found</p>;

  const stats = computeClanStats(team._id, matches);
  const members = Array.isArray(team.members) && team.members.length > 0 ? team.members : (Array.isArray(team.players) ? team.players : []);
  const recent = matches
    .filter(m => [String(m.homeTeam?._id || m.homeTeam), String(m.awayTeam?._id || m.awayTeam)].includes(team._id))
    .slice(0, 6);

  return (
    <div>
      <div className="team-hero">
        <div className="team-hero-bg" />
        <div className="team-hero-content">
          <div className="team-hero-left">
            {team.logoUrl ? <img src={team.logoUrl} alt={`${team.name} badge`} /> : <div className="avatar lg">{team.name.charAt(0)}</div>}
            <div>
              <h1>{team.name}</h1>
              {team.clanTag && <div className="muted">{team.clanTag}</div>}
              {team.leader && <div className="muted">Leader: {team.leader}</div>}
              <div className="muted">
                {team.warLeague && <span className="pill">{team.warLeague}</span>}
                <span className="pill">Level {team.level ?? '-'}</span>
                <Link className="pill link" to="/#/schedule">See Schedule</Link>
              </div>
            </div>
          </div>
          {team.about && <p className="team-about">{team.about}</p>}
        </div>
      </div>

      <section className="panel">
        <h2>Clan Stats</h2>
        <div className="stats-cards">
          <div className="stat"><div className="stat-h">Wars</div><div className="stat-v">{stats.played}</div></div>
          <div className="stat"><div className="stat-h">Wins</div><div className="stat-v">{stats.wins}</div></div>
          <div className="stat"><div className="stat-h">Draws</div><div className="stat-v">{stats.draws}</div></div>
          <div className="stat"><div className="stat-h">Losses</div><div className="stat-v">{stats.losses}</div></div>
          <div className="stat"><div className="stat-h">Stars+</div><div className="stat-v">{stats.starsFor}</div></div>
          <div className="stat"><div className="stat-h">Stars-</div><div className="stat-v">{stats.starsAgainst}</div></div>
          <div className="stat"><div className="stat-h">SDiff</div><div className="stat-v">{stats.starsDiff}</div></div>
          <div className="stat"><div className="stat-h">Avg Dest%</div><div className="stat-v">{stats.avgDestFor}%</div></div>
          <div className="stat"><div className="stat-h">Points</div><div className="stat-v">{stats.points}</div></div>
        </div>
      </section>

      <section className="panel">
        <h2>Members</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Role</th><th>TH</th>
                <th>BK</th><th>AQ</th><th>GW</th><th>RC</th>
                <th>Att</th><th>3*</th><th>Stars</th><th>Avg*</th><th>Avg%</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(members) && members.length > 0 ? members.map((p, idx) => (
                <tr key={p._id || `${p.name}-${idx}`}>
                  <td>{p.name}</td>
                  <td>{p.role || p.position || '-'}</td>
                  <td>{p.thLevel ?? '-'}</td>
                  <td>{p.heroes?.bk ?? 0}</td>
                  <td>{p.heroes?.aq ?? 0}</td>
                  <td>{p.heroes?.gw ?? 0}</td>
                  <td>{p.heroes?.rc ?? 0}</td>
                  <td>{p.stats?.attacks ?? p.stats?.appearances ?? 0}</td>
                  <td>{p.stats?.triples ?? p.stats?.goals ?? 0}</td>
                  <td>{p.stats?.stars ?? p.stats?.goals ?? 0}</td>
                  <td>{p.stats?.avgStars ?? 0}</td>
                  <td>{p.stats?.avgDestruction ?? 0}%</td>
                </tr>
              )) : (
                <tr><td colSpan="12" className="muted">No members yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Recent Wars</h2>
        <div className="cards">
          {recent.map(m => (
            <div key={m._id} className={`card ${m.status}`}>
              <div className="card-title">
                Round {m.round} • {fmt(m.scheduledAt)} • {m.bracketId} • {m.warType.toUpperCase()} {m.size}v{m.size}
              </div>
              <div className="card-body">
                <div className="match-row">
                  <span>{m.homeTeam?.name}</span>
                  <strong>{m.result?.home?.stars ?? 0}⭐ • {m.result?.home?.destruction ?? 0}%</strong>
                </div>
                <div className="match-row">
                  <span>{m.awayTeam?.name}</span>
                  <strong>{m.result?.away?.stars ?? 0}⭐ • {m.result?.away?.destruction ?? 0}%</strong>
                </div>
              </div>
              <div className="card-foot">{m.status.toUpperCase()}</div>
            </div>
          ))}
          {recent.length === 0 && <p className="muted">No wars yet</p>}
        </div>
      </section>
    </div>
  );
}