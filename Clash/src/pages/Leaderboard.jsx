import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import ProgressBar from '../components/ProgressBar.jsx';

export default function Leaderboard() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    api.getLeaderboard()
      .then(setRows)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading leaderboard…</p>;
  if (err) return <p className="error">{err}</p>;

  return (
    <div>
      <div className="page-head">
        <h1>Standings</h1>
        <div className="sub">Win=3 • Draw=1 • Loss=0</div>
      </div>

      {/* Desktop/table */}
      <div className="panel lb-desktop">
        <div className="table-wrap">
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Clan</th>
                <th>P</th><th>W</th><th>D</th><th>L</th>
                <th>⭐ Total</th><th>⭐ Diff</th><th>Avg ⭐</th>
                <th>Dest% Total</th><th>Dest% Avg</th>
                <th>Win%</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.teamId}>
                  <td>{i + 1}</td>
                  <td><Link to={`/teams/${r.teamId}`}>{r.name}</Link></td>
                  <td>{r.played}</td><td>{r.wins}</td><td>{r.draws}</td><td>{r.losses}</td>
                  <td>{r.totalStars}</td>
                  <td>{r.starsDiff >= 0 ? `+${r.starsDiff}` : r.starsDiff}</td>
                  <td>{r.avgStarsFor}</td>
                  <td>{r.totalDestruction}%</td>
                  <td>{r.avgDestFor}%</td>
                  <td>{r.winRate}%</td>
                  <td><strong>{r.points}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/cards */}
      <div className="lb-mobile">
        {rows.map((r, i) => (
          <div className="lb-card" key={r.teamId}>
            <div className="lb-card-top">
              <div className="rank">{i + 1}</div>
              <div className="name"><Link to={`/teams/${r.teamId}`}>{r.name}</Link></div>
              <div className="points">{r.points}</div>
            </div>
            <div className="lb-card-row">
              <span className="pill stat">P {r.played}</span>
              <span className="pill stat win">W {r.wins}</span>
              <span className="pill stat draw">D {r.draws}</span>
              <span className="pill stat loss">L {r.losses}</span>
            </div>
            <div className="lb-card-row">
              <span className="pill">⭐ {r.totalStars} ({r.starsDiff >= 0 ? `+${r.starsDiff}` : r.starsDiff})</span>
              <span className="pill">Avg⭐ {r.avgStarsFor}</span>
            </div>
            <div className="lb-card-prog">
              <div className="muted">Avg Dest%</div>
              <ProgressBar value={r.avgDestFor} max={100} color="linear-gradient(90deg, #ffd166, #ffc445)" bg="rgba(255,255,255,.18)" height={10} />
              <div className="muted tiny">Total {r.totalDestruction}% • Win {r.winRate}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}