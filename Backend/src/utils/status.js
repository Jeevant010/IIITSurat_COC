// Accept both naming schemes and a few common synonyms from UI text
const allowed = new Set(['scheduled', 'preparation', 'in-progress', 'battle', 'completed']);

function normalizeStatus(s) {
  if (!s) return undefined;
  const v = String(s).trim().toLowerCase();
  if (allowed.has(v)) return v;
  // Common synonyms -> map to allowed
  if (v === 'upcoming') return 'preparation';
  if (v === 'live') return 'battle';
  if (v === 'progress' || v === 'progressing') return 'in-progress';
  if (v === 'done' || v === 'finished') return 'completed';
  if (v === 'pending') return 'scheduled';
  return undefined; // unknown -> let route fall back to default
}

module.exports = { normalizeStatus, allowedStatuses: Array.from(allowed) };