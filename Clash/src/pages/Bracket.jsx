import React from 'react';
import { api } from '../api/client';

export default function Bracket() {
  const [bracketId, setBracketId] = React.useState('main');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  const load = React.useCallback(() => {
    setLoading(true);
    api.getBracket(bracketId)
      .then(setData)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [bracketId]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1>Bracket</h1>
      <div className="row">
        <label>
          Bracket ID:
          <input value={bracketId} onChange={e => setBracketId(e.target.value)} onBlur={load} />
        </label>
      </div>
      {loading && <p>Loading bracket…</p>}
      {err && <p className="error">{err}</p>}
      {data && (
        <div className="bracket">
          {data.rounds.map(r => (
            <div key={r.round} className="round">
              <div className="round-title">Round {r.round}</div>
              {r.matches.map(m => (
                <div key={m._id} className={`match ${m.status}`}>
                  <div className="match-row">
                    <span>{m.homeTeam?.name || 'TBD'}</span>
                    <strong>{m.result?.home?.stars ?? 0}⭐ • {m.result?.home?.destruction ?? 0}%</strong>
                  </div>
                  <div className="match-row">
                    <span>{m.awayTeam?.name || 'TBD'}</span>
                    <strong>{m.result?.away?.stars ?? 0}⭐ • {m.result?.away?.destruction ?? 0}%</strong>
                  </div>
                  <div className="match-foot">
                    {new Date(m.scheduledAt).toLocaleString()} • {m.warType?.toUpperCase()} {m.size}v{m.size}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}