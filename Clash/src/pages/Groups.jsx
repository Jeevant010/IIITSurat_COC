import React from 'react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

export default function Groups() {
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    api.getGroupStandings()
      .then(setGroups)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading groups…</p>;
  if (err) return <p className="error">{err}</p>;

  return (
    <div>
      <div className="page-head">
        <h1>Group Stage</h1>
        <div className="sub">Standings by group (completed group matches)</div>
      </div>
      {groups.map(g => (
        <section key={g.group} className="panel">
          <h2>Group {g.group}</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Clan</th><th>P</th><th>W</th><th>D</th><th>L</th>
                  <th>⭐</th><th>⭐±</th><th>Avg⭐</th><th>Avg Dest%</th><th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {g.table.map((r, i) => (
                  <tr key={r.teamId}>
                    <td>{i + 1}</td>
                    <td><Link to={`/teams/${r.teamId}`}>{r.name}</Link></td>
                    <td>{r.played}</td>
                    <td>{r.wins}</td>
                    <td>{r.draws}</td>
                    <td>{r.losses}</td>
                    <td>{r.totalStars}</td>
                    <td>{r.starsDiff >= 0 ? `+${r.starsDiff}` : r.starsDiff}</td>
                    <td>{r.avgStarsFor}</td>
                    <td>{r.avgDestFor}%</td>
                    <td><strong>{r.points}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}