import React from 'react';
import { api } from '../api/client';

export default function Admin() {
  const [password, setPassword] = React.useState(localStorage.getItem('ADMIN_PASSWORD') || '');
  const [teams, setTeams] = React.useState([]);
  const [schedule, setSchedule] = React.useState([]);
  const [formTeam, setFormTeam] = React.useState({ name: '' });
  const [formMatch, setFormMatch] = React.useState({ homeTeam: '', awayTeam: '', scheduledAt: '', warType: 'regular', size: 15, attacksPerMember: 2, round: 1, bracketId: 'main' });
  const [updateResults, setUpdateResults] = React.useState({});
  const [bracketGen, setBracketGen] = React.useState({ bracketId: 'main', teamIds: [], scheduledAt: '', warType: 'regular', size: 15, attacksPerMember: 2 });
  const [msg, setMsg] = React.useState('');
  const [manageTeamId, setManageTeamId] = React.useState('');
  const [manageTeam, setManageTeam] = React.useState(null);
  const [newMember, setNewMember] = React.useState({ name: '', role: '', thLevel: '', heroes: { bk: '', aq: '', gw: '', rc: '' } });

  const refresh = React.useCallback(() => {
    Promise.all([api.getTeams(), api.getSchedule()]).then(async ([t, s]) => {
      setTeams(t);
      setSchedule(s);
      if (manageTeamId) {
        try {
          const full = await api.getTeam(manageTeamId);
          setManageTeam(full);
        } catch {
          setManageTeam(null);
        }
      }
    }).catch(e => setMsg(e.message));
  }, [manageTeamId]);

  React.useEffect(() => { refresh(); }, [refresh]);

  function savePassword() {
    localStorage.setItem('ADMIN_PASSWORD', password);
    setMsg('Saved admin password locally.');
  }

  function handleCreateTeam(e) {
    e.preventDefault();
    if (!formTeam.name.trim()) return;
    api.createTeam({ name: formTeam.name.trim() })
      .then(() => { setFormTeam({ name: '' }); setMsg('Clan created'); refresh(); })
      .catch(e => setMsg(e.message));
  }

  function handleCreateMatch(e) {
    e.preventDefault();
    const { homeTeam, awayTeam, scheduledAt, warType, size, attacksPerMember, round, bracketId } = formMatch;
    api.createMatch({ homeTeam, awayTeam, scheduledAt, warType, size: Number(size), attacksPerMember: Number(attacksPerMember), round: Number(round), bracketId })
      .then(() => { setMsg('War created'); refresh(); })
      .catch(e => setMsg(e.message));
  }

  function handleResultChange(id, side, field, value) {
    setUpdateResults(s => ({ ...s, [id]: { ...(s[id] || {}), [side]: { ...((s[id] || {})[side]), [field]: value } } }));
  }

  function handleStatusChange(id, value) {
    setUpdateResults(s => ({ ...s, [id]: { ...(s[id] || {}), status: value } }));
  }

  function handleUpdateMatch(id) {
    const item = updateResults[id];
    if (!item) return;
    const payload = {
      status: item.status || 'completed',
      result: {
        home: {
          stars: item.home?.stars !== undefined ? Number(item.home.stars) : undefined,
          destruction: item.home?.destruction !== undefined ? Number(item.home.destruction) : undefined,
          attacksUsed: item.home?.attacksUsed !== undefined ? Number(item.home.attacksUsed) : undefined
        },
        away: {
          stars: item.away?.stars !== undefined ? Number(item.away.stars) : undefined,
          destruction: item.away?.destruction !== undefined ? Number(item.away.destruction) : undefined,
          attacksUsed: item.away?.attacksUsed !== undefined ? Number(item.away.attacksUsed) : undefined
        }
      }
    };
    api.updateMatch(id, payload)
      .then(() => { setMsg('War updated'); refresh(); })
      .catch(e => setMsg(e.message));
  }

  function handleDeleteMatch(id) {
    if (!confirm('Delete this war?')) return;
    api.deleteMatch(id)
      .then(() => { setMsg('War deleted'); refresh(); })
      .catch(e => setMsg(e.message));
  }

  function handleDeleteTeam(id) {
    if (!confirm('Delete clan and related wars?')) return;
    api.deleteTeam(id)
      .then(() => {
        setMsg('Clan deleted');
        if (manageTeamId === id) { setManageTeamId(''); setManageTeam(null); }
        refresh();
      })
      .catch(e => setMsg(e.message));
  }

  function selectManageTeam(id) {
    setManageTeamId(id);
    if (!id) { setManageTeam(null); return; }
    api.getTeam(id).then(setManageTeam).catch(e => setMsg(e.message));
  }

  function updateManageTeamField(field, value) {
    setManageTeam(t => ({ ...(t || {}), [field]: value }));
  }

  function saveManageTeam() {
    if (!manageTeam) return;
    const payload = {
      name: manageTeam.name,
      clanTag: manageTeam.clanTag,
      level: manageTeam.level,
      warLeague: manageTeam.warLeague,
      leader: manageTeam.leader,
      logoUrl: manageTeam.logoUrl,
      about: manageTeam.about,
      group: manageTeam.group,
      seed: manageTeam.seed
    };
    api.updateTeam(manageTeam._id, payload)
      .then(t => { setManageTeam(t); setMsg('Clan profile updated'); refresh(); })
      .catch(e => setMsg(e.message));
  }

  function addMember(e) {
    e.preventDefault();
    if (!manageTeam || !newMember.name.trim()) return;
    const payload = {
      name: newMember.name.trim(),
      role: newMember.role || '',
      thLevel: newMember.thLevel ? Number(newMember.thLevel) : null,
      heroes: {
        bk: newMember.heroes.bk ? Number(newMember.heroes.bk) : 0,
        aq: newMember.heroes.aq ? Number(newMember.heroes.aq) : 0,
        gw: newMember.heroes.gw ? Number(newMember.heroes.gw) : 0,
        rc: newMember.heroes.rc ? Number(newMember.heroes.rc) : 0
      }
    };
    api.addMember(manageTeam._id, payload)
      .then(t => { setManageTeam(t); setNewMember({ name: '', role: '', thLevel: '', heroes: { bk: '', aq: '', gw: '', rc: '' } }); setMsg('Member added'); refresh(); })
      .catch(e => setMsg(e.message));
  }

  function updateMember(memberId, changes) {
    if (!manageTeam) return;
    api.updateMember(manageTeam._id, memberId, changes)
      .then(t => { setManageTeam(t); setMsg('Member updated'); refresh(); })
      .catch(e => setMsg(e.message));
  }

  function deleteMember(memberId) {
    if (!manageTeam) return;
    if (!confirm('Delete this member?')) return;
    api.deleteMember(manageTeam._id, memberId)
      .then(t => { setManageTeam(t); setMsg('Member deleted'); refresh(); })
      .catch(e => setMsg(e.message));
  }

  return (
    <div>
      <h1>Admin</h1>
      {msg && <p className="info">{msg}</p>}

      {/* Admin password */}
      <section className="panel">
        <h2>Admin Password</h2>
        <div className="form-row">
          <label className="label">Password
            <input type="password" placeholder="Enter admin password" value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          <button onClick={savePassword} className="btn-lg">Save</button>
        </div>
        <small>Stored locally and sent as header x-admin-password</small>
      </section>

      {/* Create clan */}
      <section className="panel">
        <h2>Create Clan</h2>
        <form onSubmit={handleCreateTeam} className="form-row">
          <label className="label">Clan name
            <input placeholder="Clan name" value={formTeam.name} onChange={e => setFormTeam({ name: e.target.value })} />
          </label>
          <button type="submit" className="btn-lg">Add</button>
        </form>

        <div className="table-wrap mt">
          <table>
            <thead><tr><th>Clan</th><th>Level</th><th>Members</th><th>Actions</th></tr></thead>
            <tbody>
              {teams.map(t => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.level ?? '-'}</td>
                  <td>{t.memberCount ?? t.members?.length ?? 0}</td>
                  <td className="table-actions">
                    <button onClick={() => selectManageTeam(t._id)}>Manage</button>
                    <button className="danger" onClick={() => handleDeleteTeam(t._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && <tr><td colSpan="4">No clans</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Manage selected clan */}
      {manageTeam && (
        <section className="panel">
          <h2>Manage Clan: {manageTeam.name}</h2>
          <div className="form-grid-2">
            <label className="label">Clan Name
              <input value={manageTeam.name} onChange={e => updateManageTeamField('name', e.target.value)} />
            </label>
            <label className="label">Clan Tag
              <input value={manageTeam.clanTag || ''} onChange={e => updateManageTeamField('clanTag', e.target.value)} />
            </label>
            <label className="label">Level
              <input type="number" value={manageTeam.level ?? ''} onChange={e => updateManageTeamField('level', e.target.value ? Number(e.target.value) : null)} />
            </label>
            <label className="label">War League
              <input value={manageTeam.warLeague || ''} onChange={e => updateManageTeamField('warLeague', e.target.value)} />
            </label>
            <label className="label">Leader
              <input value={manageTeam.leader || ''} onChange={e => updateManageTeamField('leader', e.target.value)} />
            </label>
            <label className="label col-span-2">Badge URL
              <input placeholder="https://..." value={manageTeam.logoUrl || ''} onChange={e => updateManageTeamField('logoUrl', e.target.value)} />
            </label>
            <label className="label col-span-2">About
              <textarea rows="3" value={manageTeam.about || ''} onChange={e => updateManageTeamField('about', e.target.value)} />
            </label>
            <div className="right">
              <button onClick={saveManageTeam} className="btn-lg">Save Clan</button>
            </div>
          </div>

          <h3>Members</h3>
          <form onSubmit={addMember} className="form-grid-2">
            <label className="label">Name<input value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} required /></label>
            <label className="label">Role
              <select value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))}>
                <option value="">Member</option>
                <option value="Leader">Leader</option>
                <option value="Co-Leader">Co-Leader</option>
                <option value="Elder">Elder</option>
              </select>
            </label>
            <label className="label">Town Hall<input type="number" value={newMember.thLevel} onChange={e => setNewMember(p => ({ ...p, thLevel: e.target.value }))} /></label>
            <label className="label">BK<input type="number" value={newMember.heroes.bk} onChange={e => setNewMember(p => ({ ...p, heroes: { ...p.heroes, bk: e.target.value } }))} /></label>
            <label className="label">AQ<input type="number" value={newMember.heroes.aq} onChange={e => setNewMember(p => ({ ...p, heroes: { ...p.heroes, aq: e.target.value } }))} /></label>
            <label className="label">GW<input type="number" value={newMember.heroes.gw} onChange={e => setNewMember(p => ({ ...p, heroes: { ...p.heroes, gw: e.target.value } }))} /></label>
            <label className="label">RC<input type="number" value={newMember.heroes.rc} onChange={e => setNewMember(p => ({ ...p, heroes: { ...p.heroes, rc: e.target.value } }))} /></label>
            <div className="right">
              <button type="submit" className="btn-lg">Add Member</button>
            </div>
          </form>

          <div className="table-wrap mt">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Role</th><th>TH</th><th>BK</th><th>AQ</th><th>GW</th><th>RC</th>
                  <th>Att</th><th>3*</th><th>Stars</th><th>Avg*</th><th>Avg%</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {manageTeam.members?.map(p => (
                  <tr key={p._id}>
                    <td><input className="cell-input" defaultValue={p.name} onBlur={e => updateMember(p._id, { name: e.target.value })} /></td>
                    <td>
                      <select defaultValue={p.role || ''} onChange={e => updateMember(p._id, { role: e.target.value })}>
                        <option value="">Member</option>
                        <option value="Leader">Leader</option>
                        <option value="Co-Leader">Co-Leader</option>
                        <option value="Elder">Elder</option>
                      </select>
                    </td>
                    <td><input className="cell-input" type="number" defaultValue={p.thLevel ?? ''} onBlur={e => updateMember(p._id, { thLevel: e.target.value ? Number(e.target.value) : null })} /></td>
                    <td><input className="cell-input" type="number" defaultValue={p.heroes?.bk ?? 0} onBlur={e => updateMember(p._id, { heroes: { bk: Number(e.target.value) } })} /></td>
                    <td><input className="cell-input" type="number" defaultValue={p.heroes?.aq ?? 0} onBlur={e => updateMember(p._id, { heroes: { aq: Number(e.target.value) } })} /></td>
                    <td><input className="cell-input" type="number" defaultValue={p.heroes?.gw ?? 0} onBlur={e => updateMember(p._id, { heroes: { gw: Number(e.target.value) } })} /></td>
                    <td><input className="cell-input" type="number" defaultValue={p.heroes?.rc ?? 0} onBlur={e => updateMember(p._id, { heroes: { rc: Number(e.target.value) } })} /></td>
                    <td><input className="cell-input" type="number" defaultValue={p.stats?.attacks ?? 0} onBlur={e => updateMember(p._id, { stats: { attacks: Number(e.target.value) } })} /></td>
                    <td><input className="cell-input" type="number" defaultValue={p.stats?.triples ?? 0} onBlur={e => updateMember(p._id, { stats: { triples: Number(e.target.value) } })} /></td>
                    <td><input className="cell-input" type="number" defaultValue={p.stats?.stars ?? 0} onBlur={e => updateMember(p._id, { stats: { stars: Number(e.target.value) } })} /></td>
                    <td><input className="cell-input" type="number" step="0.01" defaultValue={p.stats?.avgStars ?? 0} onBlur={e => updateMember(p._id, { stats: { avgStars: Number(e.target.value) } })} /></td>
                    <td><input className="cell-input" type="number" step="0.01" defaultValue={p.stats?.avgDestruction ?? 0} onBlur={e => updateMember(p._id, { stats: { avgDestruction: Number(e.target.value) } })} /></td>
                    <td><button className="danger" onClick={() => deleteMember(p._id)}>Delete</button></td>
                  </tr>
                ))}
                {(!manageTeam.members || manageTeam.members.length === 0) && (
                  <tr><td colSpan="13" className="muted">No members yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Create war */}
      <section className="panel">
        <h2>Create War</h2>
        <form onSubmit={handleCreateMatch} className="form-grid-3">
          <label className="label">Home Clan
            <select value={formMatch.homeTeam} onChange={e => setFormMatch({ ...formMatch, homeTeam: e.target.value })} required>
              <option value="">Select clan</option>
              {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </label>
          <label className="label">Away Clan
            <select value={formMatch.awayTeam} onChange={e => setFormMatch({ ...formMatch, awayTeam: e.target.value })} required>
              <option value="">Select clan</option>
              {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </label>
          <label className="label">Date/Time
            <input type="datetime-local" value={formMatch.scheduledAt} onChange={e => setFormMatch({ ...formMatch, scheduledAt: e.target.value })} required />
          </label>
          <label className="label">War Type
            <select value={formMatch.warType} onChange={e => setFormMatch({ ...formMatch, warType: e.target.value, attacksPerMember: e.target.value === 'cwl' ? 1 : formMatch.attacksPerMember })}>
              <option value="regular">regular</option>
              <option value="friendly">friendly</option>
              <option value="cwl">cwl</option>
            </select>
          </label>
          <label className="label">Size
            <select value={formMatch.size} onChange={e => setFormMatch({ ...formMatch, size: Number(e.target.value) })}>
              {[5,10,15,20,30,50].map(n => <option key={n} value={n}>{n}v{n}</option>)}
            </select>
          </label>
          <label className="label">Attacks/Member
            <select value={formMatch.attacksPerMember} onChange={e => setFormMatch({ ...formMatch, attacksPerMember: Number(e.target.value) })}>
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </label>
          <label className="label">Round
            <input type="number" value={formMatch.round} onChange={e => setFormMatch({ ...formMatch, round: e.target.value })} />
          </label>
          <label className="label">Bracket ID
            <input value={formMatch.bracketId} onChange={e => setFormMatch({ ...formMatch, bracketId: e.target.value })} />
          </label>
          <div className="right">
            <button type="submit" className="btn-lg">Create War</button>
          </div>
        </form>
      </section>

      {/* Update wars */}
      <section className="panel">
        <h2>Update Wars</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th><th>Type</th><th>Size</th><th>Home</th><th>Home Result</th><th>Away</th><th>Away Result</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(m => (
                <tr key={m._id}>
                  <td>{new Date(m.scheduledAt).toLocaleString()}</td>
                  <td>{m.warType}</td>
                  <td>{m.size}v{m.size}</td>
                  <td>{m.homeTeam?.name}</td>
                  <td className="score-edit">
                    <input className="cell-input" type="number" placeholder={String(m.result?.home?.stars ?? 0)} onChange={e => handleResultChange(m._id, 'home', 'stars', e.target.value)} />⭐
                    <input className="cell-input" type="number" step="0.1" placeholder={String(m.result?.home?.destruction ?? 0)} onChange={e => handleResultChange(m._id, 'home', 'destruction', e.target.value)} />%
                  </td>
                  <td>{m.awayTeam?.name}</td>
                  <td className="score-edit">
                    <input className="cell-input" type="number" placeholder={String(m.result?.away?.stars ?? 0)} onChange={e => handleResultChange(m._id, 'away', 'stars', e.target.value)} />⭐
                    <input className="cell-input" type="number" step="0.1" placeholder={String(m.result?.away?.destruction ?? 0)} onChange={e => handleResultChange(m._id, 'away', 'destruction', e.target.value)} />%
                  </td>
                  <td>
                    <select onChange={e => handleStatusChange(m._id, e.target.value)} defaultValue={m.status}>
                      <option value="scheduled">scheduled</option>
                      <option value="in-progress">in-progress</option>
                      <option value="completed">completed</option>
                    </select>
                  </td>
                  <td className="table-actions">
                    <button onClick={() => handleUpdateMatch(m._id)}>Save</button>
                    <button className="danger" onClick={() => handleDeleteMatch(m._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {schedule.length === 0 && (
                <tr><td colSpan="9">No wars</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Generate Round 1 wars */}
      <section className="panel">
        <h2>Generate Bracket (Round 1)</h2>
        <form onSubmit={e => {
          e.preventDefault();
          const ids = bracketGen.teamIds.filter(Boolean);
          api.generateBracket({
            bracketId: bracketGen.bracketId,
            teamIds: ids,
            scheduledAt: bracketGen.scheduledAt,
            warType: bracketGen.warType,
            size: Number(bracketGen.size),
            attacksPerMember: Number(bracketGen.attacksPerMember)
          }).then(r => { setMsg(`Generated ${r.count} wars`); refresh(); }).catch(e => setMsg(e.message));
        }} className="form-grid-3">
          <label className="label">Bracket ID
            <input value={bracketGen.bracketId} onChange={e => setBracketGen(s => ({ ...s, bracketId: e.target.value }))} />
          </label>
          <label className="label">War Type
            <select value={bracketGen.warType} onChange={e => setBracketGen(s => ({ ...s, warType: e.target.value, attacksPerMember: e.target.value === 'cwl' ? 1 : s.attacksPerMember }))}>
              <option value="regular">regular</option>
              <option value="friendly">friendly</option>
              <option value="cwl">cwl</option>
            </select>
          </label>
          <label className="label">Size
            <select value={bracketGen.size} onChange={e => setBracketGen(s => ({ ...s, size: Number(e.target.value) }))}>
              {[5,10,15,20,30,50].map(n => <option key={n} value={n}>{n}v{n}</option>)}
            </select>
          </label>
          <label className="label">Attacks/Member
            <select value={bracketGen.attacksPerMember} onChange={e => setBracketGen(s => ({ ...s, attacksPerMember: Number(e.target.value) }))}>
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </label>
          <label className="label col-span-2">Round 1 Date/Time
            <input type="datetime-local" value={bracketGen.scheduledAt} onChange={e => setBracketGen(s => ({ ...s, scheduledAt: e.target.value }))} required />
          </label>
          <div className="col-span-3">
            <strong>Select Clans (order matters for pairing):</strong>
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
          <div className="right">
            <button type="submit" className="btn-lg">Generate Wars</button>
          </div>
        </form>
      </section>
    </div>
  );
}