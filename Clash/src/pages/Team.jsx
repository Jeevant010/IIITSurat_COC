import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import ProgressBar from '../components/ProgressBar.jsx';

function fmt(dt) { try { return new Date(dt).toLocaleString(); } catch { return dt; } }

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
    stats.starsFor += ours.s; stats.starsAgainst += theirs.s;
    stats.destFor += ours.d; stats.destAgainst += theirs.d;
    if (ours.s > theirs.s) { stats.wins++; stats.points += 3; }
    else if (ours.s < theirs.s) { stats.losses++; }
    else { if (ours.d > theirs.d) { stats.wins++; stats.points += 3; } else if (ours.d < theirs.d) { stats.losses++; } else { stats.draws++; stats.points += 1; } }
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

  if (loading) return (
    <div className="coc-loading">
      <div className="coc-spinner"></div>
      <p>Loading clan details...</p>
    </div>
  );
  
  if (err) return (
    <div className="coc-error">
      <div className="coc-error-icon">⚡</div>
      <p className="coc-error-text">{err}</p>
    </div>
  );
  
  if (!team) return (
    <div className="coc-error">
      <div className="coc-error-icon">❌</div>
      <p className="coc-error-text">Clan not found</p>
      <Link to="/teams" className="coc-retry-btn">Back to Clans</Link>
    </div>
  );

  const stats = computeClanStats(team._id, matches);
  const members = Array.isArray(team.members) && team.members.length > 0 ? team.members : (Array.isArray(team.players) ? team.players : []);
  const recent = matches
    .filter(m => [String(m.homeTeam?._id || m.homeTeam), String(m.awayTeam?._id || m.awayTeam)].includes(team._id))
    .slice(0, 6);

  const winRate = stats.played ? ((stats.wins / stats.played) * 100).toFixed(1) : 0;

  return (
    <div className="coc-container">
      {/* Clan Hero Section */}
      <div className="coc-clan-hero">
        <div className="coc-clan-hero-bg"></div>
        <div className="coc-clan-hero-content">
          <div className="coc-clan-header">
            <div className="coc-clan-badge-large">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={`${team.name} badge`} className="coc-clan-badge-img" />
              ) : (
                <div className="coc-clan-avatar-large">{team.name.charAt(0).toUpperCase()}</div>
              )}
              {team.level && (
                <div className="coc-clan-level-badge">Lvl {team.level}</div>
              )}
            </div>
            
            <div className="coc-clan-info-main">
              <h1 className="coc-clan-title">{team.name}</h1>
              {team.clanTag && (
                <div className="coc-clan-tag-main">{team.clanTag}</div>
              )}
              {team.leader && (
                <div className="coc-clan-leader-main">
                  <span className="coc-leader-crown">👑</span>
                  Leader: {team.leader}
                </div>
              )}
              
              <div className="coc-clan-meta-tags">
                {team.warLeague && (
                  <span className="coc-clan-meta-tag coc-clan-meta-tag--league">
                    {team.warLeague}
                  </span>
                )}
                <span className="coc-clan-meta-tag coc-clan-meta-tag--members">
                  {members.length} Members
                </span>
                <Link to="/schedule" className="coc-clan-meta-tag coc-clan-meta-tag--schedule">
                  View Schedule →
                </Link>
              </div>
            </div>
          </div>

          {team.about && (
            <div className="coc-clan-about">
              <div className="coc-clan-about-title">Clan Description</div>
              <p>{team.about}</p>
            </div>
          )}
        </div>
      </div>

      {/* Clan Stats Section */}
      <section className="coc-clan-stats-section">
        <div className="coc-section-header">
          <h2 className="coc-section-title">War Statistics</h2>
          <div className="coc-section-subtitle">Performance in current tournament</div>
        </div>
        
        <div className="coc-stats-grid">
          <div className="coc-stat-card coc-stat-card--primary">
            <div className="coc-stat-icon">🏆</div>
            <div className="coc-stat-value">{stats.points}</div>
            <div className="coc-stat-label">Total Points</div>
          </div>
          
          <div className="coc-stat-card">
            <div className="coc-stat-icon">⚔️</div>
            <div className="coc-stat-value">{stats.played}</div>
            <div className="coc-stat-label">Wars Played</div>
          </div>
          
          <div className="coc-stat-card coc-stat-card--win">
            <div className="coc-stat-value">{stats.wins}</div>
            <div className="coc-stat-label">Wins</div>
            <div className="coc-stat-subtext">{winRate}% Win Rate</div>
          </div>
          
          <div className="coc-stat-card coc-stat-card--draw">
            <div className="coc-stat-value">{stats.draws}</div>
            <div className="coc-stat-label">Draws</div>
          </div>
          
          <div className="coc-stat-card coc-stat-card--loss">
            <div className="coc-stat-value">{stats.losses}</div>
            <div className="coc-stat-label">Losses</div>
          </div>
          
          <div className="coc-stat-card coc-stat-card--stars">
            <div className="coc-stat-icon">⭐</div>
            <div className="coc-stat-value">{stats.starsFor}</div>
            <div className="coc-stat-label">Stars For</div>
            <div className={`coc-stat-diff ${stats.starsDiff >= 0 ? 'positive' : 'negative'}`}>
              {stats.starsDiff >= 0 ? `+${stats.starsDiff}` : stats.starsDiff}
            </div>
          </div>
          
          <div className="coc-stat-card">
            <div className="coc-stat-value">{stats.starsAgainst}</div>
            <div className="coc-stat-label">Stars Against</div>
          </div>
          
          <div className="coc-stat-card coc-stat-card--destruction">
            <div className="coc-stat-value">{stats.avgDestFor}%</div>
            <div className="coc-stat-label">Avg Destruction</div>
            <ProgressBar value={stats.avgDestFor} max={100} className="coc-progress--stats" />
          </div>
        </div>
      </section>

      {/* Members Section */}
      <section className="coc-clan-members-section">
        <div className="coc-section-header">
          <h2 className="coc-section-title">Clan Members</h2>
          <div className="coc-section-subtitle">{members.length} warriors in battle</div>
        </div>
        
        <div className="coc-table-container">
          <table className="coc-members-table">
            <thead>
              <tr>
                <th className="coc-th-player">Player</th>
                <th className="coc-th-role">Role</th>
                <th className="coc-th-th">TH</th>
                <th className="coc-th-stats">Attacks</th>
                <th className="coc-th-stats">3⭐</th>
                <th className="coc-th-stats">Stars</th>
                <th className="coc-th-stats">Avg ⭐</th>
                <th className="coc-th-stats">Avg %</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(members) && members.length > 0 ? members.map((p, idx) => (
                <tr key={p._id || `${p.name}-${idx}`} className="coc-member-row">
                  <td className="coc-td-player">
                    <div className="coc-player-info">
                      <div className="coc-player-name">{p.name}</div>
                      <div className="coc-player-tag">{p.playerTag || p.tag || '-'}</div>
                      {p.email && <div className="coc-player-email">{p.email}</div>}
                    </div>
                  </td>
                  <td className="coc-td-role">
                    <span className={`coc-role-badge coc-role-${(p.role || p.position || 'member').toLowerCase()}`}>
                      {p.role || p.position || 'Member'}
                    </span>
                  </td>
                  <td className="coc-td-th">
                    <div className="coc-th-level">{p.townHall ?? p.thLevel ?? '-'}</div>
                  </td>
                  <td className="coc-td-stats">{p.stats?.attacks ?? p.stats?.appearances ?? 0}</td>
                  <td className="coc-td-stats coc-td-triples">{p.stats?.triples ?? p.stats?.goals ?? 0}</td>
                  <td className="coc-td-stats coc-td-stars">{p.stats?.stars ?? p.stats?.goals ?? 0}</td>
                  <td className="coc-td-stats">{p.stats?.avgStars ?? 0}</td>
                  <td className="coc-td-stats coc-td-destruction">{p.stats?.avgDestruction ?? 0}%</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="coc-empty-state">
                    <div className="coc-empty-icon">👥</div>
                    <div className="coc-empty-text">No members in this clan yet</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Wars Section */}
      <section className="coc-recent-wars-section">
        <div className="coc-section-header">
          <h2 className="coc-section-title">Recent Wars</h2>
          <div className="coc-section-subtitle">Latest battles fought</div>
        </div>
        
        <div className="coc-wars-grid">
          {recent.map(m => {
            const isHome = String(m.homeTeam?._id || m.homeTeam) === team._id;
            const ourStars = isHome ? m.result?.home?.stars ?? 0 : m.result?.away?.stars ?? 0;
            const theirStars = isHome ? m.result?.away?.stars ?? 0 : m.result?.home?.stars ?? 0;
            const ourDest = isHome ? m.result?.home?.destruction ?? 0 : m.result?.away?.destruction ?? 0;
            const theirDest = isHome ? m.result?.away?.destruction ?? 0 : m.result?.home?.destruction ?? 0;
            const won = ourStars > theirStars || (ourStars === theirStars && ourDest > theirDest);
            const draw = ourStars === theirStars && ourDest === theirDest;
            
            return (
              <div key={m._id} className={`coc-war-card coc-war-card--${m.status} ${won ? 'won' : draw ? 'draw' : 'lost'}`}>
                <div className="coc-war-card-header">
                  <div className="coc-war-meta">
                    <span className="coc-war-stage">{m.stage?.toUpperCase()}</span>
                    <span className="coc-war-round">Round {m.round}</span>
                    <span className="coc-war-type">{m.warType?.toUpperCase()} {m.size}v{m.size}</span>
                  </div>
                  <div className="coc-war-date">{fmt(m.scheduledAt)}</div>
                </div>
                
                <div className="coc-war-card-body">
                  <div className="coc-war-teams">
                    <div className={`coc-war-team ${isHome ? 'our-team' : ''}`}>
                      <div className="coc-team-name">{m.homeTeam?.name}</div>
                      <div className="coc-team-stats">
                        <span className="coc-team-stars">{m.result?.home?.stars ?? 0}⭐</span>
                        <span className="coc-team-destruction">{m.result?.home?.destruction ?? 0}%</span>
                      </div>
                    </div>
                    
                    <div className="coc-war-vs">VS</div>
                    
                    <div className={`coc-war-team ${!isHome ? 'our-team' : ''}`}>
                      <div className="coc-team-name">{m.awayTeam?.name}</div>
                      <div className="coc-team-stats">
                        <span className="coc-team-stars">{m.result?.away?.stars ?? 0}⭐</span>
                        <span className="coc-team-destruction">{m.result?.away?.destruction ?? 0}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="coc-war-result">
                    <span className={`coc-result-badge ${won ? 'won' : draw ? 'draw' : 'lost'}`}>
                      {won ? 'VICTORY' : draw ? 'DRAW' : 'DEFEAT'}
                    </span>
                  </div>
                </div>
                
                <div className="coc-war-card-footer">
                  <span className="coc-war-status">{m.status.toUpperCase()}</span>
                  <span className="coc-war-bracket">{m.bracketId}</span>
                </div>
              </div>
            );
          })}
          
          {recent.length === 0 && (
            <div className="coc-empty-wars">
              <div className="coc-empty-icon">⚔️</div>
              <div className="coc-empty-text">No wars recorded yet</div>
              <div className="coc-empty-subtext">This clan hasn't participated in any wars</div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}