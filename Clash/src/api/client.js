const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function getAdminPassword() {
  return localStorage.getItem('ADMIN_PASSWORD') || '';
}

async function request(path, { method = 'GET', body, admin = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (admin) {
    const pass = getAdminPassword();
    if (pass) headers['x-admin-password'] = pass;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    let errText = await res.text();
    try { errText = JSON.parse(errText); } catch {}
    throw new Error(errText.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Public
  getTeams: () => request('/teams'),
  getTeam: (id) => request(`/teams/${id}`),
  getSchedule: () => request('/schedule'),
  getLeaderboard: () => request('/leaderboard'),
  getGroupStandings: () => request('/group-standings'),
  getBracket: (bracketId = 'main') => request(`/bracket?bracketId=${encodeURIComponent(bracketId)}`),

  // Admin Clans
  createTeam: (data) => request('/teams', { method: 'POST', body: data, admin: true }),
  updateTeam: (id, data) => request(`/teams/${id}`, { method: 'PUT', body: data, admin: true }),
  deleteTeam: (id) => request(`/teams/${id}`, { method: 'DELETE', admin: true }),

  // Admin Members
  addMember: (teamId, data) => request(`/teams/${teamId}/members`, { method: 'POST', body: data, admin: true }),
  updateMember: (teamId, memberId, data) => request(`/teams/${teamId}/members/${memberId}`, { method: 'PUT', body: data, admin: true }),
  deleteMember: (teamId, memberId) => request(`/teams/${teamId}/members/${memberId}`, { method: 'DELETE', admin: true }),

  // Admin Wars
  createMatch: (data) => request('/matches', { method: 'POST', body: data, admin: true }),
  updateMatch: (id, data) => request(`/matches/${id}`, { method: 'PUT', body: data, admin: true }),
  deleteMatch: (id) => request(`/matches/${id}`, { method: 'DELETE', admin: true }),

  // Admin Bracket
  generateBracket: (data) => request('/bracket/generate', { method: 'POST', body: data, admin: true })
};