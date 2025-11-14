import React from 'react';
import { api } from '../api/client';
import { localDatetimeToISO } from '../utils/datetime';

export default function Admin() {
  const [password, setPassword] = React.useState(localStorage.getItem('ADMIN_PASSWORD') || '');
  const [teams, setTeams] = React.useState([]);
  const [schedule, setSchedule] = React.useState([]);
  const [formTeam, setFormTeam] = React.useState({ name: '' });

  const [formMatch, setFormMatch] = React.useState({
    homeTeam: '', awayTeam: '', scheduledAt: '',
    stage: 'group', warType: 'regular', size: 15, attacksPerMember: 2, round: 1, bracketId: 'main'
  });

  const [updateResults, setUpdateResults] = React.useState({});
  const [msg, setMsg] = React.useState('');
  const [manageTeamId, setManageTeamId] = React.useState('');
  const [manageTeam, setManageTeam] = React.useState(null);
  const [newMember, setNewMember] = React.useState({ name: '', playerTag: '', email: '', townHall: '', role: '' });

  // Group stage generator (if present in your UI)
  const [groupGen, setGroupGen] = React.useState({
    group: 'A', bracketId: 'main', teamIds: [], scheduledAt: '', warType: 'regular', size: 15, attacksPerMember: 2
  });

  // Seed and advance forms (if present)
  const [seedForm, setSeedForm] = React.useState({
    group: 'A', bracketId: 'main', scheduledAtSemi1: '', scheduledAtElim: '', warType: 'regular', size: 15, attacksPerMember: 2
  });
  const [advanceForm, setAdvanceForm] = React.useState({
    bracketId: 'main', scheduledAtSemi2: '', scheduledAtFinal: '', warType: 'regular', size: 15, attacksPerMember: 2
  });

  // Predesign (TBD placeholders), if present
  const [predesign, setPredesign] = React.useState({
    bracketId: 'main',
    status: 'preparation',
    warType: 'regular',
    size: 15,
    attacksPerMember: 2,
    scheduledAtSemi1: '',
    scheduledAtElim: '',
    scheduledAtSemi2: '',
    scheduledAtFinal: '',
  });

  const refresh = React.useCallback(() => {
    Promise.all([api.getTeams(), api.getSchedule()]).then(async ([t, s]) => {
      setTeams(t); setSchedule(s);
      if (manageTeamId) {
        try { setManageTeam(await api.getTeam(manageTeamId)); } catch { setManageTeam(null); }
      }
    }).catch(e => setMsg(e.message));
  }, [manageTeamId]);

  React.useEffect(() => { refresh(); }, [refresh]);

  function savePassword() { localStorage.setItem('ADMIN_PASSWORD', password); setMsg('Saved admin password locally.'); }

  function handleCreateTeam(e) {
    e.preventDefault();
    if (!formTeam.name.trim()) return;
    api.createTeam({ name: formTeam.name.trim() })
      .then(() => { setFormTeam({ name: '' }); setMsg('Clan created'); refresh(); })
      .catch(e => setMsg(e.message));
  }

  function handleCreateMatch(e) {
    e.preventDefault();
    const { homeTeam, awayTeam, scheduledAt, stage, warType, size, attacksPerMember, round, bracketId } = formMatch;
    const whenISO = localDatetimeToISO(scheduledAt);
    api.createMatch({
      homeTeam, awayTeam, scheduledAt: whenISO, stage, warType,
      size: Number(size), attacksPerMember: Number(attacksPerMember), round: Number(round), bracketId
    })
      .then(() => { setMsg('War created'); refresh(); })
      .catch(e => setMsg(e.message));
  }

  // Missing functions added here:
  function handleResultChange(id, side, field, value) {
    setUpdateResults(s => ({ 
      ...s, 
      [id]: { 
        ...(s[id] || {}), 
        [side]: { 
          ...((s[id] || {})[side] || {}), 
          [field]: value 
        } 
      } 
    }));
  }

  function handleTeamChange(matchId, field, teamId) {
    setUpdateResults(s => ({ 
      ...s, 
      [matchId]: { 
        ...(s[matchId] || {}), 
        [field]: teamId 
      } 
    }));
  }

  function handleStatusChange(id, value) { 
    setUpdateResults(s => ({ ...s, [id]: { ...(s[id] || {}), status: value } })); 
  }

  function handleScheduledAtChange(id, value) {
    setUpdateResults(s => ({ 
      ...s, 
      [id]: { 
        ...(s[id] || {}), 
        scheduledAt: value 
      } 
    }));
  }

  function handleUpdateMatch(id) {
    const item = updateResults[id];
    if (!item) return;
    
    const payload = {
      status: item.status || undefined,
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
    
    // Add team changes to payload
    if (item.homeTeam) payload.homeTeam = item.homeTeam;
    if (item.awayTeam) payload.awayTeam = item.awayTeam;
    if (item.scheduledAt) payload.scheduledAt = localDatetimeToISO(item.scheduledAt);

    api.updateMatch(id, payload)
      .then(() => { 
        setMsg('War updated'); 
        refresh(); 
        // Clear the update for this match
        setUpdateResults(s => {
          const newState = { ...s };
          delete newState[id];
          return newState;
        });
      })
      .catch(e => setMsg(e.message));
  }

  function handleDeleteMatch(id) {
    if (!confirm('Delete this war?')) return;
    api.deleteMatch(id).then(() => { setMsg('War deleted'); refresh(); }).catch(e => setMsg(e.message));
  }

  function handleDeleteTeam(id) {
    if (!confirm('Delete clan and related wars?')) return;
    api.deleteTeam(id).then(() => { setMsg('Clan deleted'); if (manageTeamId === id) { setManageTeamId(''); setManageTeam(null); } refresh(); }).catch(e => setMsg(e.message));
  }

  function selectManageTeam(id) { setManageTeamId(id); if (!id) { setManageTeam(null); return; } api.getTeam(id).then(setManageTeam).catch(e => setMsg(e.message)); }
  function updateManageTeamField(field, value) { setManageTeam(t => ({ ...(t || {}), [field]: value })); }

  function saveManageTeam() {
    if (!manageTeam) return;
    api.updateTeam(manageTeam._id, {
      name: manageTeam.name, clanTag: manageTeam.clanTag, level: manageTeam.level, warLeague: manageTeam.warLeague,
      leader: manageTeam.leader, logoUrl: manageTeam.logoUrl, about: manageTeam.about, group: manageTeam.group, seed: manageTeam.seed
    }).then(t => { setManageTeam(t); setMsg('Clan profile updated'); refresh(); }).catch(e => setMsg(e.message));
  }

  function addMember(e) {
    e.preventDefault();
    if (!manageTeam || !newMember.name.trim()) return;
    api.addMember(manageTeam._id, {
      name: newMember.name.trim(),
      playerTag: newMember.playerTag || '',
      email: newMember.email || '',
      townHall: newMember.townHall ? Number(newMember.townHall) : null,
      role: newMember.role || ''
    }).then(t => {
      setManageTeam(t);
      setNewMember({ name: '', playerTag: '', email: '', townHall: '', role: '' });
      setMsg('Member added'); refresh();
    }).catch(e => setMsg(e.message));
  }

  function updateMember(memberId, changes) { if (!manageTeam) return; api.updateMember(manageTeam._id, memberId, changes).then(t => { setManageTeam(t); setMsg('Member updated'); refresh(); }).catch(e => setMsg(e.message)); }
  function deleteMember(memberId) { if (!manageTeam) return; if (!confirm('Delete this member?')) return; api.deleteMember(manageTeam._id, memberId).then(t => { setManageTeam(t); setMsg('Member deleted'); refresh(); }).catch(e => setMsg(e.message)); }

  async function createGroupMatches() {
    if (groupGen.teamIds.length !== 4) throw new Error('Select exactly 4 teams for group stage');
    // Optional: persist group on teams first (if you use groups)
    await Promise.all(groupGen.teamIds.map(id => api.updateTeam(id, { group: groupGen.group })));
    const whenISO = localDatetimeToISO(groupGen.scheduledAt);
    const payload = { ...groupGen, scheduledAt: whenISO };
    // If you use the tournament group create endpoint:
    if (api.generateGroupStage) {
      await api.generateGroupStage(payload);
    } else {
      // fallback: create your own 6 matches here if older code
    }
  }

  async function seedKnockout() {
    const s1 = localDatetimeToISO(seedForm.scheduledAtSemi1);
    const el = localDatetimeToISO(seedForm.scheduledAtElim);
    await api.seedKnockoutFromGroup({ ...seedForm, scheduledAtSemi1: s1, scheduledAtElim: el });
  }

  async function advanceKnockout() {
    const s2 = localDatetimeToISO(advanceForm.scheduledAtSemi2);
    const sf = localDatetimeToISO(advanceForm.scheduledAtFinal);
    await api.advanceKnockout({ ...advanceForm, scheduledAtSemi2: s2, scheduledAtFinal: sf });
  }

  async function predesignKnockout() {
    const p = {
      ...predesign,
      scheduledAtSemi1: localDatetimeToISO(predesign.scheduledAtSemi1),
      scheduledAtElim: localDatetimeToISO(predesign.scheduledAtElim),
      scheduledAtSemi2: localDatetimeToISO(predesign.scheduledAtSemi2),
      scheduledAtFinal: localDatetimeToISO(predesign.scheduledAtFinal),
    };
    await api.predesignKnockout(p);
  }
  
  return (
    <div>
      <h1>Admin</h1>
      {msg && <p className="info">{msg}</p>}

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
            <label className="label">Player Tag<input value={newMember.playerTag} onChange={e => setNewMember(p => ({ ...p, playerTag: e.target.value }))} /></label>
            <label className="label">Email<input type="email" value={newMember.email} onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))} /></label>
            <label className="label">Town Hall<input type="number" value={newMember.townHall} onChange={e => setNewMember(p => ({ ...p, townHall: e.target.value }))} /></label>
            <label className="label">Role
              <select value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))}>
                <option value="">Member</option>
                <option value="Leader">Leader</option>
                <option value="Co-Leader">Co-Leader</option>
                <option value="Elder">Elder</option>
              </select>
            </label>
            <div className="right">
              <button type="submit" className="btn-lg">Add Member</button>
            </div>
          </form>

          <div className="table-wrap mt">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Tag</th><th>Email</th><th>Role</th><th>TH</th>
                  <th>Att</th><th>3*</th><th>Stars</th><th>Avg*</th><th>Avg%</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {manageTeam.members?.map(p => (
                  <tr key={p._id}>
                    <td><input className="cell-input" defaultValue={p.name} onBlur={e => updateMember(p._id, { name: e.target.value })} /></td>
                    <td><input className="cell-input" defaultValue={p.playerTag || ''} onBlur={e => updateMember(p._id, { playerTag: e.target.value })} /></td>
                    <td><input className="cell-input" type="email" defaultValue={p.email || ''} onBlur={e => updateMember(p._id, { email: e.target.value })} /></td>
                    <td>
                      <select defaultValue={p.role || ''} onChange={e => updateMember(p._id, { role: e.target.value })}>
                        <option value="">Member</option>
                        <option value="Leader">Leader</option>
                        <option value="Co-Leader">Co-Leader</option>
                        <option value="Elder">Elder</option>
                      </select>
                    </td>
                    <td><input className="cell-input" type="number" defaultValue={p.townHall ?? ''} onBlur={e => updateMember(p._id, { townHall: e.target.value ? Number(e.target.value) : null })} /></td>
                    <td><input className="cell-input" type="number" defaultValue={p.stats?.attacks ?? 0} onBlur={e => updateMember(p._id, { stats: { attacks: Number(e.target.value) } })} /></td>
                    <td><input className="cell-input" type="number" defaultValue={p.stats?.triples ?? 0} onBlur={e => updateMember(p._id, { stats: { triples: Number(e.target.value) } })} /></td>
                    <td><input className="cell-input" type="number" defaultValue={p.stats?.stars ?? 0} onBlur={e => updateMember(p._id, { stats: { stars: Number(e.target.value) } })} /></td>
                    <td><input className="cell-input" type="number" step="0.01" defaultValue={p.stats?.avgStars ?? 0} onBlur={e => updateMember(p._id, { stats: { avgStars: Number(e.target.value) } })} /></td>
                    <td><input className="cell-input" type="number" step="0.01" defaultValue={p.stats?.avgDestruction ?? 0} onBlur={e => updateMember(p._id, { stats: { avgDestruction: Number(e.target.value) } })} /></td>
                    <td className="table-actions"><button className="danger" onClick={() => deleteMember(p._id)}>Delete</button></td>
                  </tr>
                ))}
                {(!manageTeam.members || manageTeam.members.length === 0) && (
                  <tr><td colSpan="11" className="muted">No members yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Manual Create War */}
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
          <label className="label">Stage
            <select value={formMatch.stage} onChange={e => setFormMatch({ ...formMatch, stage: e.target.value })}>
              <option value="group">group</option>
              <option value="eliminator">eliminator</option>
              <option value="quarterfinal">quarterfinal</option>
              <option value="semifinal">semifinal</option>
              <option value="final">final</option>
            </select>
          </label>
          <label className="label">War Type
            <select value={formMatch.warType} onChange={e => setFormMatch({ ...formMatch, warType: e.target.value, attacksPerMember: e.target.value === 'cwl' ? 1 : formMatch.attacksPerMember })}>
              <option value="regular">regular</option>
              <option value="friendly">friendly</option>
              <option value="cwl">cwl</option>
              <option value="esports">esports</option>
              <option value="legend">legend</option>
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

      {/* Predesign Knockout (TBD placeholders) */}
      <section className="panel">
        <h2>Predesign Knockout (TBD teams)</h2>
        <div className="form-grid-3">
          <label className="label">Bracket ID
            <input value={predesign.bracketId} onChange={e => setPredesign(s => ({ ...s, bracketId: e.target.value }))} />
          </label>
          <label className="label">Status
            <select value={predesign.status} onChange={e => setPredesign(s => ({ ...s, status: e.target.value }))}>
              <option value="preparation">preparation</option>
              <option value="scheduled">scheduled</option>
            </select>
          </label>
          <label className="label">War Type
            <select value={predesign.warType} onChange={e => setPredesign(s => ({ ...s, warType: e.target.value }))}>
              <option value="regular">regular</option>
              <option value="friendly">friendly</option>
              <option value="cwl">cwl</option>
              <option value="esports">esports</option>
              <option value="legend">legend</option>
            </select>
          </label>
          <label className="label">Size
            <select value={predesign.size} onChange={e => setPredesign(s => ({ ...s, size: Number(e.target.value) }))}>
              {[5,10,15,20,30,50].map(n => <option key={n} value={n}>{n}v{n}</option>)}
            </select>
          </label>
          <label className="label">Attacks/Member
            <select value={predesign.attacksPerMember} onChange={e => setPredesign(s => ({ ...s, attacksPerMember: Number(e.target.value) }))}>
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </label>
          <label className="label">Semi 1 (Round 1)
            <input type="datetime-local" value={predesign.scheduledAtSemi1} onChange={e => setPredesign(s => ({ ...s, scheduledAtSemi1: e.target.value }))} />
          </label>
          <label className="label">Eliminator (Round 1)
            <input type="datetime-local" value={predesign.scheduledAtElim} onChange={e => setPredesign(s => ({ ...s, scheduledAtElim: e.target.value }))} />
          </label>
          <label className="label">Semi 2 (Round 2)
            <input type="datetime-local" value={predesign.scheduledAtSemi2} onChange={e => setPredesign(s => ({ ...s, scheduledAtSemi2: e.target.value }))} />
          </label>
          <label className="label">Final (Round 3)
            <input type="datetime-local" value={predesign.scheduledAtFinal} onChange={e => setPredesign(s => ({ ...s, scheduledAtFinal: e.target.value }))} />
          </label>

          <div className="right">
            <button
              className="btn-lg"
              onClick={async () => {
                try {
                  const resp = await api.predesignKnockout(predesign);
                  setMsg(resp.count ? `Created ${resp.count} placeholder matches` : 'Predesign already exists');
                  refresh();
                } catch (e) { setMsg(e.message); }
              }}
            >
              Create 4 Placeholder Matches
            </button>
          </div>
        </div>
      </section>

      {/* Update Wars: now editable Home/Away team for replacing TBD */}
      <section className="panel">
        <h2>Update Wars</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th><th>Stage</th><th>Type</th><th>Size</th><th>Home</th><th>Home Result</th><th>Away</th><th>Away Result</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(m => (
                <tr key={m._id}>
                  <td>{new Date(m.scheduledAt).toLocaleString()}</td>
                  <td>{m.stage || 'group'}</td>
                  <td>{m.warType}</td>
                  <td>{m.size}v{m.size}</td>

                  <td>
                    <select
                      defaultValue={m.homeTeam?._id || ''}
                      onChange={e => handleTeamChange(m._id, 'homeTeam', e.target.value)}
                    >
                      <option value="">— choose —</option>
                      {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </td>
                  <td className="score-edit">
                    <input className="cell-input" type="number" placeholder={String(m.result?.home?.stars ?? 0)} onChange={e => handleResultChange(m._id, 'home', 'stars', e.target.value)} />⭐
                    <input className="cell-input" type="number" step="0.1" placeholder={String(m.result?.home?.destruction ?? 0)} onChange={e => handleResultChange(m._id, 'home', 'destruction', e.target.value)} />%
                  </td>

                  <td>
                    <select
                      defaultValue={m.awayTeam?._id || ''}
                      onChange={e => handleTeamChange(m._id, 'awayTeam', e.target.value)}
                    >
                      <option value="">— choose —</option>
                      {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </td>
                  <td className="score-edit">
                    <input className="cell-input" type="number" placeholder={String(m.result?.away?.stars ?? 0)} onChange={e => handleResultChange(m._id, 'away', 'stars', e.target.value)} />⭐
                    <input className="cell-input" type="number" step="0.1" placeholder={String(m.result?.away?.destruction ?? 0)} onChange={e => handleResultChange(m._id, 'away', 'destruction', e.target.value)} />%
                  </td>

                  <td>
                    <select onChange={e => handleStatusChange(m._id, e.target.value)} defaultValue={m.status}>
                      <option value="preparation">preparation</option>
                      <option value="scheduled">scheduled</option>
                      <option value="battle">battle</option>
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
              {schedule.length === 0 && (<tr><td colSpan="10">No wars</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}