import React from 'react';

export default function ProgressBar({ value = 0, max = 100, color = 'linear-gradient(90deg, #ffd166, #ffc445)', bg = 'rgba(255,255,255,.2)', height = 10, rounded = true }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <div className="prog" style={{ background: bg, height, borderRadius: rounded ? 999 : 0 }}>
      <div className="prog-fill" style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: rounded ? 999 : 0 }} />
    </div>
  );
}