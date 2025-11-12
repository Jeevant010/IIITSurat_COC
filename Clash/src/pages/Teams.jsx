import React from 'react';
import { api } from '../api/client';

export default function Teams() {
  const [teams, setTeams] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    api.getTeams()
      .then(setTeams)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading teams…</p>;
  if (err) return <p className="error">{err}</p>;

  return (
    <div>
      <h1>Teams</h1>
      <ul className="list">
        {teams.map(t => (
          <li key={t._id}>
            <span className="pill">{t.seed ?? '-'}</span> {t.name} {t.group ? <em>({t.group})</em> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}