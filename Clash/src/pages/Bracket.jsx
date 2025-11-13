import React from 'react';
import { api } from '../api/client';
import ProgressBar from '../components/ProgressBar.jsx';

function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

function WarTile({ m }) {
  const hs = Number(m.result?.home?.stars ?? 0);
  const as = Number(m.result?.away?.stars ?? 0);
  const hd = Number(m.result?.home?.destruction ?? 0);
  const ad = Number(m.result?.away?.destruction ?? 0);
  const homeLead = hs !== as ? hs > as : hd > ad;

  return (
    <div className={`war-tile ${m.status}`}>
      <div className="war-head">
        <Badge>{m.warType?.toUpperCase()}</Badge>
        <span className="muted">{m.size}v{m.size}</span>
        <span className="muted">•</span>
        <span className="muted">{new Date(m.scheduledAt).toLocaleString()}</span>
      </div>
      <div className={`side ${homeLead ? 'lead' : ''}`}>
        <div className="name">{m.homeTeam?.name || 'TBD'}</div>
        <div className="score">
          <span className="stars">{hs}⭐</span>
          <span className="dest">{hd}%</span>
        </div>
        <ProgressBar value={hd} max={100} color="var(--accent)" bg="var(--line)" />
      </div>
      <div className={`side ${!homeLead ? 'lead' : ''}`}>
        <div className="name">{m.awayTeam?.name || 'TBD'}</div>
        <div className="score">
          <span className="stars">{as}⭐</span>
          <span className="dest">{ad}%</span>
        </div>
        <ProgressBar value={ad} max={100} color="var(--accent-2)" bg="var(--line)" />
      </div>
      <div className="war-foot">{m.status.toUpperCase()}</div>
    </div>
  );
}

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
      <div className="page-head">
        <h1>Bracket</h1>
        <div className="row">
          <label>
            Bracket ID:
            <input value={bracketId} onChange={e => setBracketId(e.target.value)} onBlur={load} />
          </label>
        </div>
      </div>

      {loading && <p>Loading bracket…</p>}
      {err && <p className="error">{err}</p>}

      {data && (
        <div className="bracket-grid">
          {data.rounds.map((r, idx) => (
            <div className="round-col" key={r.round}>
              <div className="round-title">Round {r.round}</div>
              <div className="round-stack">
                {r.matches.map((m, i) => (
                  <div key={m._id} className="match-wrap">
                    <WarTile m={m} />
                    {/* connector */}
                    {idx < data.rounds.length - 1 && (
                      <div className="connector">
                        <span className="dot" />
                        <span className="line" />
                        <span className="dot" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}