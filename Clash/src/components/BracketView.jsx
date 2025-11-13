import React from 'react';

// Classic tournament bracket with white boxes + black elbow connectors (like your screenshot)

function ClassicMatch({ m }) {
  const hs = Number(m.result?.home?.stars ?? 0);
  const as = Number(m.result?.away?.stars ?? 0);
  const hd = Number(m.result?.home?.destruction ?? 0);
  const ad = Number(m.result?.away?.destruction ?? 0);
  return (
    <div className="classic-match">
      <div className="slot">
        <span className="name">{m.homeTeam?.name || 'TBD'}</span>
        <span className="score">{hs}⭐ {hd}%</span>
      </div>
      <div className="slot">
        <span className="name">{m.awayTeam?.name || 'TBD'}</span>
        <span className="score">{as}⭐ {ad}%</span>
      </div>
    </div>
  );
}

export default function BracketView({ rounds }) {
  const containerRef = React.useRef(null);
  const nodeRefs = React.useRef({}); // key: r-i -> element
  const [paths, setPaths] = React.useState([]);

  React.useLayoutEffect(() => {
    const c = containerRef.current;
    if (!c) return;

    const rect = c.getBoundingClientRect();
    const keyOf = (r, i) => `r${r}-i${i}`;
    const newPaths = [];

    // compute elbow paths from each match to its target in next round
    for (let col = 0; col < rounds.length - 1; col++) {
      const current = rounds[col].matches;
      for (let i = 0; i < current.length; i++) {
        const toIdx = Math.floor(i / 2);
        const fromEl = nodeRefs.current[keyOf(col, i)];
        const toEl = nodeRefs.current[keyOf(col + 1, toIdx)];
        if (!fromEl || !toEl) continue;

        const a = fromEl.getBoundingClientRect();
        const b = toEl.getBoundingClientRect();
        const x1 = a.right - rect.left;
        const y1 = a.top + a.height / 2 - rect.top;
        const x2 = b.left - rect.left;
        const y2 = b.top + b.height / 2 - rect.top;
        const midX = (x1 + x2) / 2;

        newPaths.push(`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`);
      }
    }
    setPaths(newPaths);
  }, [rounds]);

  return (
    <div className="bracket-classic" ref={containerRef}>
      <svg className="bracket-lines">
        {paths.map((d, i) => <path key={i} d={d} />)}
      </svg>

      <div className="classic-grid">
        {rounds.map((r, colIdx) => (
          <div className="classic-col" key={r.round}>
            <div className="classic-title">Round {r.round}</div>
            {r.matches.map((m, rowIdx) => {
              const key = `r${colIdx}-i${rowIdx}`;
              return (
                <div
                  className="classic-cell"
                  key={m._id || key}
                  ref={el => { if (el) nodeRefs.current[key] = el; }}
                >
                  <ClassicMatch m={m} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}