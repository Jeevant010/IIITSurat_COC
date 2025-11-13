import React from 'react';
import { api } from '../api/client';
import ProgressBar from '../components/ProgressBar.jsx';

function fmt(dt) {
  try { return new Date(dt).toLocaleString(); } catch { return dt; }
}

export default function Schedule() {
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    api.getSchedule()
      .then(setMatches)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading schedule…</p>;
  if (err) return <p className="error">{err}</p>;

  return (
    <div>
      <div className="page-head">
        <h1>War Schedule</h1>
        <div className="sub">Times in your local timezone</div>
      </div>

      <div className="grid-cards">
        {matches.map(m => {
          const hs = Number(m.result?.home?.stars ?? 0);
          const as = Number(m.result?.away?.stars ?? 0);
          const hd = Number(m.result?.home?.destruction ?? 0);
          const ad = Number(m.result?.away?.destruction ?? 0);
          return (
            <div key={m._id} className={`card pro ${m.status}`}>
              <div className="card-head">
                <div className="badges">
                  <span className="badge">{m.warType?.toUpperCase()}</span>
                  <span className="badge">{m.size}v{m.size}</span>
                  <span className={`badge ${m.status}`}>{m.status.toUpperCase()}</span>
                </div>
                <div className="muted">{fmt(m.scheduledAt)} • {m.bracketId}</div>
              </div>
              <div className="card-body">
                <div className="row row-sides">
                  <div className="side-name">{m.homeTeam?.name}</div>
                  <div className="side-score">{hs}⭐ • {hd}%</div>
                </div>
                <ProgressBar value={hd} max={100} color="var(--accent)" bg="var(--line)" />
                <div className="row row-sides">
                  <div className="side-name">{m.awayTeam?.name}</div>
                  <div className="side-score">{as}⭐ • {ad}%</div>
                </div>
                <ProgressBar value={ad} max={100} color="var(--accent-2)" bg="var(--line)" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}