import React from 'react';

export default function ProgressBar({ value = 0, max = 100, color = 'var(--accent)', bg = 'var(--line)', height = 8, rounded = true, showLabel = false, label }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <div className="prog" style={{ background: bg, height, borderRadius: rounded ? 999 : 0 }} title={label}>
      <div className="prog-fill" style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: rounded ? 999 : 0 }} />
      {showLabel && <span className="prog-label">{label ?? `${Math.round(pct)}%`}</span>}
    </div>
  );
}