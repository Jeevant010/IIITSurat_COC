import React from 'react';

// UEFA-style rounded match cards with elbow connectors in silver/blue accents.
// We draw paths with SVG. Each match cell registers its DOM element for geometry.

function Node({ titleTop, titleBottom, info, iconLeft, highlight }) {
  return (
    <div className={`uefa-node ${highlight ? 'highlight' : ''}`}>
      <div className="uefa-node-row">
        <div className="uefa-node-side">
          {iconLeft ? <img className="uefa-icon" src={iconLeft} alt="" /> : <span className="dot" />}
          <span className="name">{titleTop || 'TBD'}</span>
        </div>
        <div className="uefa-node-meta">{info?.top || ''}</div>
      </div>
      <div className="uefa-node-row">
        <div className="uefa-node-side">
          {iconLeft ? <span className="uefa-icon-placeholder" /> : <span className="dot muted" />}
          <span className="name">{titleBottom || 'TBD'}</span>
        </div>
        <div className="uefa-node-meta">{info?.bottom || ''}</div>
      </div>
    </div>
  );
}

export default function UEFABracket({ rounds, accent = 'blue' }) {
  const containerRef = React.useRef(null);
  const refMap = React.useRef(new Map());
  const [paths, setPaths] = React.useState([]);

  const getKey = (r, i) => `r${r}-i${i}`;

  React.useLayoutEffect(() => {
    const c = containerRef.current;
    if (!c) return;

    const root = c.getBoundingClientRect();
    const p = [];

    for (let col = 0; col < rounds.length - 1; col++) {
      const curr = rounds[col]?.matches || [];
      for (let i = 0; i < curr.length; i++) {
        const nextIdx = Math.floor(i / 2);
        const fromEl = refMap.current.get(getKey(col, i));
        const toEl = refMap.current.get(getKey(col + 1, nextIdx));
        if (!fromEl || !toEl) continue;

        const a = fromEl.getBoundingClientRect();
        const b = toEl.getBoundingClientRect();

        const x1 = a.right - root.left;
        const y1 = a.top + a.height / 2 - root.top;
        const x2 = b.left - root.left;
        const y2 = b.top + b.height / 2 - root.top;

        // UEFA-like elbow with soft rounding
        const midX = x1 + (x2 - x1) * 0.62;
        const d = `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
        p.push(d);
      }
    }
    setPaths(p);
  }, [rounds]);

  return (
    <div className={`uefa-bracket ${accent}`} ref={containerRef}>
      <svg className="uefa-lines">
        {paths.map((d, i) => <path key={i} d={d} />)}
      </svg>
      <div className="uefa-cols">
        {rounds.map((round, colIdx) => (
          <div className="uefa-col" key={round.round}>
            <div className="uefa-col-title">Round {round.round}</div>
            <div className="uefa-stack">
              {round.matches.map((m, rowIdx) => {
                const key = getKey(colIdx, rowIdx);
                const hs = Number(m.result?.home?.stars ?? 0);
                const as = Number(m.result?.away?.stars ?? 0);
                const hd = Number(m.result?.home?.destruction ?? 0);
                const ad = Number(m.result?.away?.destruction ?? 0);
                const leadHome = hs !== as ? hs > as : hd > ad;

                return (
                  <div
                    key={m._id || key}
                    ref={(el) => el && refMap.current.set(key, el)}
                    className="uefa-cell"
                  >
                    <Node
                      titleTop={m.homeTeam?.name}
                      titleBottom={m.awayTeam?.name}
                      info={{
                        top: `${hs}⭐ ${hd}%`,
                        bottom: `${as}⭐ ${ad}%`
                      }}
                      highlight={leadHome}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Trophy panel (right side) */}
        <div className="uefa-col trophy">
          <div className="trophy-wrap">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Trophy_icon_3.svg"
              alt="Trophy"
            />
            <div className="trophy-label">Final</div>
          </div>
        </div>
      </div>
    </div>
  );
}