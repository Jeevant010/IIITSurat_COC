import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Teams() {
  const [teams, setTeams] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    api.getTeams().then(setTeams).catch(e => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading clans…</p>;
  if (err) return <p className="error">{err}</p>;

  return (
    <div>
      <h1>Clans</h1>
      <div className="team-grid">
        {teams.map(t => (
          <Link key={t._id} to={`/teams/${t._id}`} className="team-card">
            <div className="team-card-head">
              {t.logoUrl ? <img src={t.logoUrl} alt={`${t.name} badge`} /> : <div className="avatar">{t.name.charAt(0)}</div>}
              <div>
                <div className="team-name">{t.name}</div>
                {t.clanTag ? <div className="muted">{t.clanTag}</div> : null}
                {t.leader ? <div className="muted">Leader: {t.leader}</div> : null}
              </div>
            </div>
            <div className="team-meta">
              <span className="pill">Lvl {t.level ?? '-'}</span>
              {t.warLeague ? <span className="pill">{t.warLeague}</span> : null}
              <span className="pill">{t.memberCount} members</span>
              {t.group ? <span className="pill">Group {t.group}</span> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}