import React from 'react';
import { api } from '../api/client';

export default function Admin() {
  const [password, setPassword] = React.useState(localStorage.getItem('ADMIN_PASSWORD') || '');
  const [teams, setTeams] = React.useState([]);
  const [schedule, setSchedule] = React.useState([]);
  const [formTeam, setFormTeam] = React.useState({ name: '' });
  const [formMatch, setFormMatch] = React.useState({ homeTeam: '', awayTeam: '', scheduledAt: '', round: 1, bracketId: 'main' });
  const [updateScores, setUpdateScores] = React.useState({});
  const [bracketGen, setBracketGen] = React.useState({ bracketId: 'main', teamIds: [], scheduledAt: '' });
  const [msg, setMsg] = React.useState('');

  const refresh = React.useCallback(() => {
    Promise.all([api.getTeams(), api.getSchedule()]).then(([t, s]) => {
      setTeams(t);
      setSchedule(s);
    }).catch(e => setMsg(e.message));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  function savePassword() {
    localStorage.setItem('ADMIN_PASSWORD', password);
    setMsg('Saved admin password locally.');
  }

  function handleCreateTeam(e) {
    e.preventDefault();
    if (!formTeam.name.trim()) return;
    api.createTeam({ name: formTeam.name.trim() })
      .then(() => {
        setFormTeam({ name: '' });
        setMsg('Team created');
        refresh();
      })
      .catch(e => setMsg(e.message));
  }

  function handleCreateMatch(e) {
    e.preventDefault();
    const { homeTeam, awayTeam, scheduledAt, round, bracketId } = formMatch;
    api.createMatch({ homeTeam, awayTeam, scheduledAt, round: Number(round), bracketId })
      .then(() => {
        setMsg('Match created');
        refresh();
      })
      .catch(e => setMsg(e.message));
  }

  function handleScoreChange(id, field, value) {
    setUpdateScores(s => ({ ...s, [id]: { ...(s[id] || {}), [field]: value } }));
  }

  function handleUpdateMatch(id) {
    const item = updateScores[id];
    if (!item) return;
    const payload = {
      status: item.status || 'completed',
      score: { home: Number(item.home), away: Number(item.away) }
    };
    api.updateMatch(id, payload)
      .then(() => {
        setMsg('Match updated');
        refresh();
      })
      .catch(e => setMsg(e.message));
  }

  function handleDeleteMatch(id) {
    if (!confirm('Delete this match?')) return;
    api.deleteMatch(id)
      .then(() => {
        setMsg('Match deleted');
        refresh();
      })
      .catch(e => setMsg(e.message));
  }

  function handleDeleteTeam(id) {
    if (!confirm('Delete team and related matches?')) return;
    api.deleteTeam(id)
      .then(() => {
        setMsg('Team deleted');
        refresh();
      })
      .catch(e => setMsg(e.message));
  }

  function handleGenerateBracket(e) {
    e.preventDefault();
    const ids = bracketGen.teamIds.filter(Boolean);
    api.generateBracket({ bracketId: bracketGen.bracketId, teamIds: ids, scheduledAt: bracketGen.scheduledAt })
      .then(r => {
        setMsg(`Generated ${r.count} matches`);
        refresh();
      })
      .catch(e => setMsg(e.message));
  }

  return (
    <div>
      <h1>Admin</h1>
      {msg && <p className="info">{msg}</p>}

      <section className="panel">
        <h2>Admin Password</h2>
        <div className="row">
          <input type="password" placeholder="Enter admin password" value={password} onChange={e => setPassword(e.target.value)} />
          <button onClick={savePassword}>Save</button>
        </div>
        <small>Stored locally and sent as header x-admin-password</small>
      </section>

      <section className="panel">
        <h2>Create Team</h2>
        <form onSubmit={handleCreateTeam} className="row">
          <input placeholder="Team name" value={formTeam.name} onChange={e => setFormTeam({ name: e.target.value })} />
          <button type="submit">Add</button>
        </form>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Team</th><th>Seed</th><th>Actions</th></tr></thead>
            <tbody>
              {teams.map(t => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.seed ?? '-'}</td>
                  <td><button className="danger" onClick={() => handleDeleteTeam(t._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Create Match</h2>
        <form onSubmit={handleCreateMatch} className="grid-2">
          <label>
            Home
            <select value={formMatch.homeTeam} onChange={e => setFormMatch({ ...formMatch, homeTeam: e.target.value })} required>
              <option value="">Select team</option>
              {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </label>
          <label>
            Away
            <select value={formMatch.awayTeam} onChange={e => setFormMatch({ ...formMatch, awayTeam: e.target.value })} required>
              <option value="">Select team</option>
              {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </label>
          <label>
            Date/Time
            <input type="datetime-local" value={formMatch.scheduledAt} onChange={e => setFormMatch({ ...formMatch, scheduledAt: e.target.value })} required />
          </label>
          <label>
            Round
            <input type="number" value={formMatch.round} onChange={e => setFormMatch({ ...formMatch, round: e.target.value })} />
          </label>
          <label>
            Bracket ID
            <input value={formMatch.bracketId} onChange={e => setFormMatch({ ...formMatch, bracketId: e.target.value })} />
          </label>
          <div style={{ alignSelf: 'end' }}>
            <button type="submit">Create Match</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Update Matches</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th><th>Round</th><th>Home</th><th>Score</th><th>Away</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(m => (
                <tr key={m._id}>
                  <td>{new Date(m.scheduledAt).toLocaleString()}</td>
                  <td>{m.round}</td>
                  <td>{m.homeTeam?.name}</td>
                  <td>
                    <input className="small" type="number" placeholder={String(m.score?.home ?? '-')} onChange={e => handleScoreChange(m._id, 'home', e.target.value)} />
                    <span> - </span>
                    <input className="small" type="number" placeholder={String(m.score?.away ?? '-')} onChange={e => handleScoreChange(m._id, 'away', e.target.value)} />
                  </td>
                  <td>{m.awayTeam?.name}</td>
                  <td>
                    <select onChange={e => handleScoreChange(m._id, 'status', e.target.value)} defaultValue={m.status}>
                      <option value="scheduled">scheduled</option>
                      <option value="completed">completed</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleUpdateMatch(m._id)}>Save</button>
                    <button className="danger" onClick={() => handleDeleteMatch(m._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {schedule.length === 0 && (
                <tr><td colSpan="7">No matches</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Generate Bracket (Round 1)</h2>
        <form onSubmit={handleGenerateBracket} className="grid-2">
          <label>
            Bracket ID
            <input value={bracketGen.bracketId} onChange={e => setBracketGen(s => ({ ...s, bracketId: e.target.value }))} />
          </label>
          <label>
            Round 1 Date/Time
            <input type="datetime-local" value={bracketGen.scheduledAt} onChange={e => setBracketGen(s => ({ ...s, scheduledAt: e.target.value }))} required />
          </label>
          <div className="col-span-2">
            <strong>Select Teams (order matters for pairing):</strong>
            <div className="chips">
              {teams.map(t => {
                const selected = bracketGen.teamIds.includes(t._id);
                return (
                  <button
                    type="button"
                    key={t._id}
                    className={`chip ${selected ? 'selected' : ''}`}
                    onClick={() => {
                      setBracketGen(s => {
                        const exists = s.teamIds.includes(t._id);
                        return { ...s, teamIds: exists ? s.teamIds.filter(id => id !== t._id) : [...s.teamIds, t._id] };
                      });
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ alignSelf: 'end' }}>
            <button type="submit">Generate Matches</button>
          </div>
        </form>
      </section>
    </div>
  );
}