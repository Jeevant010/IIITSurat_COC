import React from 'react';
import { api } from '../api/client';

function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
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
      <h1>War Schedule</h1>
      <div className="cards">
        {matches.map(m => (
          <div key={m._id} className={`card ${m.status}`}>
            <div className="card-title">
              Round {m.round} • {fmt(m.scheduledAt)} • {m.bracketId} • {m.warType?.toUpperCase()} {m.size}v{m.size}
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
      </div>
    </div>
  );
}