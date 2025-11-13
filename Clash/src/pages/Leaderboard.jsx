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
        <div className="sub">Live leaderboard • Win=3 • Draw=1 • Loss=0</div>
      </div>

      <div className="panel table-panel">
        <div className="table-legend">
          <span>P</span><span>W</span><span>D</span><span>L</span>
          <span>Stars±</span><span>Dest%</span><span>Pts</span>
        </div>
        <div className="lb">
          {rows.map((r, i) => (
            <div key={r.teamId} className="lb-row">
              <div className="lb-left">
                <div className="rank">{i + 1}</div>
                <Link className="clan" to={`/teams/${r.teamId}`}>{r.name}</Link>
              </div>

              <div className="lb-mid">
                <div className="pill stat">{r.played}</div>
                <div className="pill stat win">{r.wins}</div>
                <div className="pill stat draw">{r.draws}</div>
                <div className="pill stat loss">{r.losses}</div>

                <div className="stars">
                  <span className="plus">{r.starsFor}</span>
                  <span className="sep">/</span>
                  <span className="minus">{r.starsAgainst}</span>
                  <span className="diff">{r.starsDiff >= 0 ? `+${r.starsDiff}` : r.starsDiff}</span>
                </div>

                <div className="dest">
                  <ProgressBar
                    value={r.avgDestFor}
                    max={100}
                    color="linear-gradient(90deg, #22c55e, #60a5fa)"
                    bg="rgba(255,255,255,.08)"
                    height={10}
                  />
                  <div className="dest-label">
                    <span className="muted">Avg</span> <strong>{r.avgDestFor}%</strong>
                    <span className="muted dot">•</span>
                    <span className="muted">Total</span> <strong>{r.destFor.toFixed(2)}%</strong>
                    <span className="muted dot">•</span>
                    <span className={r.destDiff >= 0 ? 'good' : 'bad'}>{r.destDiff >= 0 ? '+' : ''}{r.destDiff}%</span>
                  </div>
                </div>
              </div>

              <div className="lb-right">
                <div className="micro">
                  <div className="muted">Avg⭐</div>
                  <div className="big">{r.avgStarsFor}</div>
                </div>
                <div className="micro">
                  <div className="muted">Win%</div>
                  <div className="big">{r.winRate}%</div>
                </div>
                <div className="points">{r.points}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}