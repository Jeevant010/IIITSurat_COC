import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import ProgressBar from '../components/ProgressBar.jsx';

export default function Leaderboard() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    api.getLeaderboard().then(setRows).catch(e => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="coc-loading">
      <div className="coc-spinner"></div>
      <p>Loading leaderboard...</p>
    </div>
  );
  
  if (err) return (
    <div className="coc-error">
      <div className="coc-error-icon">⚡</div>
      <p className="coc-error-text">{err}</p>
    </div>
  );

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'coc-rank-1';
    if (rank === 2) return 'coc-rank-2';
    if (rank === 3) return 'coc-rank-3';
    return '';
  };

  return (
    <div className="coc-container">
      <div className="coc-page-head">
        <h1 className="coc-title">Clan Standings</h1>
        <div className="coc-subtitle">
          <span className="coc-points-system">Win = 3 pts • Draw = 1 pt • Loss = 0 pts</span>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="coc-leaderboard-desktop">
        <div className="coc-table-container">
          <table className="coc-leaderboard-table">
            <thead>
              <tr>
                <th className="coc-th-rank">Rank</th>
                <th className="coc-th-clan">Clan</th>
                <th className="coc-th-compact">P</th>
                <th className="coc-th-compact">W</th>
                <th className="coc-th-compact">D</th>
                <th className="coc-th-compact">L</th>
                <th className="coc-th-stats">⭐ Total</th>
                <th className="coc-th-stats">⭐ Diff</th>
                <th className="coc-th-stats">Avg ⭐</th>
                <th className="coc-th-stats">Dest% Total</th>
                <th className="coc-th-stats">Dest% Avg</th>
                <th className="coc-th-stats">Win%</th>
                <th className="coc-th-points">Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.teamId} className={`coc-lb-row ${getRankClass(i + 1)}`}>
                  <td className="coc-td-rank">
                    <div className="coc-rank-badge">
                      {getRankBadge(i + 1)}
                    </div>
                  </td>
                  <td className="coc-td-clan">
                    <Link to={`/teams/${r.teamId}`} className="coc-clan-link">
                      <span className="coc-clan-name">{r.name}</span>
                    </Link>
                  </td>
                  <td className="coc-td-compact">{r.played}</td>
                  <td className="coc-td-win">{r.wins}</td>
                  <td className="coc-td-draw">{r.draws}</td>
                  <td className="coc-td-loss">{r.losses}</td>
                  <td className="coc-td-stars">{r.totalStars}</td>
                  <td className={`coc-td-diff ${r.starsDiff >= 0 ? 'positive' : 'negative'}`}>
                    {r.starsDiff >= 0 ? `+${r.starsDiff}` : r.starsDiff}
                  </td>
                  <td className="coc-td-stars">{r.avgStarsFor}</td>
                  <td className="coc-td-destruction">{r.totalDestruction}%</td>
                  <td className="coc-td-destruction">{r.avgDestFor}%</td>
                  <td className="coc-td-winrate">{r.winRate}%</td>
                  <td className="coc-td-points">
                    <strong>{r.points}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="coc-leaderboard-mobile">
        {rows.map((r, i) => (
          <div key={r.teamId} className={`coc-lb-card ${getRankClass(i + 1)}`}>
            {/* Card Header */}
            <div className="coc-lb-card-header">
              <div className="coc-lb-rank">
                <div className="coc-rank-icon">{getRankBadge(i + 1)}</div>
                <div className="coc-rank-number">#{i + 1}</div>
              </div>
              <div className="coc-lb-clan-info">
                <Link to={`/teams/${r.teamId}`} className="coc-lb-clan-name">
                  {r.name}
                </Link>
                <div className="coc-lb-points">{r.points} pts</div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="coc-lb-stats-row">
              <div className="coc-stat-pill coc-stat-pill--played">
                <div className="coc-stat-value">{r.played}</div>
                <div className="coc-stat-label">Played</div>
              </div>
              <div className="coc-stat-pill coc-stat-pill--win">
                <div className="coc-stat-value">{r.wins}</div>
                <div className="coc-stat-label">Wins</div>
              </div>
              <div className="coc-stat-pill coc-stat-pill--draw">
                <div className="coc-stat-value">{r.draws}</div>
                <div className="coc-stat-label">Draws</div>
              </div>
              <div className="coc-stat-pill coc-stat-pill--loss">
                <div className="coc-stat-value">{r.losses}</div>
                <div className="coc-stat-label">Losses</div>
              </div>
            </div>

            {/* Stars Information */}
            <div className="coc-lb-stars-info">
              <div className="coc-stars-group">
                <div className="coc-stars-total">
                  <span className="coc-stars-icon">⭐</span>
                  {r.totalStars} Total
                </div>
                <div className={`coc-stars-diff ${r.starsDiff >= 0 ? 'positive' : 'negative'}`}>
                  {r.starsDiff >= 0 ? `+${r.starsDiff}` : r.starsDiff} Diff
                </div>
              </div>
              <div className="coc-stars-avg">
                {r.avgStarsFor} Avg ⭐
              </div>
            </div>

            {/* Destruction Progress */}
            <div className="coc-lb-destruction">
              <div className="coc-destruction-header">
                <span>Average Destruction</span>
                <span className="coc-destruction-value">{r.avgDestFor}%</span>
              </div>
              <ProgressBar value={r.avgDestFor} max={100} className="coc-progress--destruction" />
              <div className="coc-destruction-footer">
                <span>Total: {r.totalDestruction}%</span>
                <span>Win Rate: {r.winRate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}