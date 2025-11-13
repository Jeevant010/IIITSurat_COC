// Convert <input type="datetime-local"> value to ISO UTC string.
// Handles "", already-ISO strings, and partials.
export function localDatetimeToISO(value) {
  if (!value) return value;
  // If value already includes timezone info or Z, pass through.
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(value)) return value;
  // Browser interprets 'YYYY-MM-DDTHH:mm' as local time. Convert to UTC ISO.
  const d = new Date(value);
  if (isNaN(d.getTime())) return value; // fall back, let server handle
  return d.toISOString();
}