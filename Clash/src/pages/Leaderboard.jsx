import React from 'react';
import { api } from '../api/client';

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
      <h1>Leaderboard</h1>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.teamId}>
                <td>{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.played}</td>
                <td>{r.wins}</td>
                <td>{r.draws}</td>
                <td>{r.losses}</td>
                <td>{r.gf}</td>
                <td>{r.ga}</td>
                <td>{r.gd}</td>
                <td><strong>{r.points}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}