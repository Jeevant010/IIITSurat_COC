import React from 'react';
import '../styles/bracket.css';

// Match node (preserves your "preparation"/"battle" statuses)
function MatchNode({ match, roundType }) {
  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  const homeScore = match.result?.home?.stars ?? 0;
  const awayScore = match.result?.away?.stars ?? 0;
  const homeDestruction = match.result?.home?.destruction ?? 0;
  const awayDestruction = match.result?.away?.destruction ?? 0;

  const statusRaw = String(match.status || '').toLowerCase();
  const isCompleted = statusRaw === 'completed';
  const isLive = statusRaw === 'battle' || statusRaw === 'in-progress';
  const isScheduled = statusRaw === 'preparation' || statusRaw === 'scheduled';

  const winner =
    homeScore > awayScore ? 'home' :
    awayScore > homeScore ? 'away' :
    homeDestruction > awayDestruction ? 'home' :
    awayDestruction > homeDestruction ? 'away' : 'draw';

  const isFinal = /final/i.test(roundType);

  return (
    <div className={`uefa-match-node ${isCompleted ? 'completed' : ''} ${isLive ? 'live' : ''} ${isFinal ? 'final-match' : ''} ${roundType}`}>
      <div className="match-header">
        {isScheduled && match.scheduledAt && (
          <div className="match-time"><strong>{new Date(match.scheduledAt).toLocaleDateString()}</strong></div>
        )}
        {isLive && (
          <div className="live-indicator">
            <span className="live-pulse"></span>
            <strong>LIVE</strong>
          </div>
        )}
      </div>

      <div className="teams-section">
        <div className={`team-row home-team ${winner === 'home' ? 'winner' : ''}`}>
          <div className="team-info">
            <div className="team-flag">
              {homeTeam?.logoUrl ? (
                <img src={homeTeam.logoUrl} alt={homeTeam.name} />
              ) : (
                <div className="flag-placeholder"><strong>{homeTeam?.name?.charAt(0) || 'T'}</strong></div>
              )}
            </div>
            <div className="team-details">
              <strong className="team-name">{homeTeam?.name || 'TBD'}</strong>
              {isCompleted && homeDestruction > 0 && <span className="destruction-badge">{homeDestruction}%</span>}
            </div>
          </div>
          {isCompleted && (
            <div className="team-score">
              <strong className="score">{homeScore}</strong>
              <span className="score-label">STARS</span>
            </div>
          )}
        </div>

        <div className="match-divider"><span className="vs-text">VS</span></div>

        <div className={`team-row away-team ${winner === 'away' ? 'winner' : ''}`}>
          <div className="team-info">
            <div className="team-flag">
              {awayTeam?.logoUrl ? (
                <img src={awayTeam.logoUrl} alt={awayTeam.name} />
              ) : (
                <div className="flag-placeholder"><strong>{awayTeam?.name?.charAt(0) || 'T'}</strong></div>
              )}
            </div>
            <div className="team-details">
              <strong className="team-name">{awayTeam?.name || 'TBD'}</strong>
              {isCompleted && awayDestruction > 0 && <span className="destruction-badge">{awayDestruction}%</span>}
            </div>
          </div>
          {isCompleted && (
            <div className="team-score">
              <strong className="score">{awayScore}</strong>
              <span className="score-label">STARS</span>
            </div>
          )}
        </div>
      </div>

      <div className="match-meta">
        <div className="match-type"><strong>{String(match.warType || 'regular').toUpperCase()}</strong></div>
        <div className="match-size"><strong>{match.size || 15}v{match.size || 15}</strong></div>
        {isCompleted && <div className="match-status completed"><strong>COMPLETED</strong></div>}
        {isScheduled && <div className="match-status scheduled"><strong>UPCOMING</strong></div>}
      </div>

      {isCompleted && winner !== 'draw' && (
        <div className="winner-badge"><strong>{winner === 'home' ? homeTeam?.name : awayTeam?.name} WINS</strong></div>
      )}
    </div>
  );
}

export default function UEFABracket({ rounds, accent = 'gold' }) {
  const refRoot = React.useRef(null);
  const refMap = React.useRef(new Map());
  const [paths, setPaths] = React.useState([]);

  const keyOf = (roundIndex, matchIndex) => `r${roundIndex}-m${matchIndex}`;

  React.useLayoutEffect(() => {
    const root = refRoot.current;
    if (!root) return;

    const updatePaths = () => {
      const bbox = root.getBoundingClientRect();
      const lines = [];

      for (let roundIdx = 0; roundIdx < rounds.length - 1; roundIdx++) {
        const currentRound = rounds[roundIdx]?.matches || [];
        for (let matchIdx = 0; matchIdx < currentRound.length; matchIdx++) {
          const nextMatchIdx = Math.floor(matchIdx / 2);
          const fromEl = refMap.current.get(keyOf(roundIdx, matchIdx));
          const toEl = refMap.current.get(keyOf(roundIdx + 1, nextMatchIdx));
          if (!fromEl || !toEl) continue;

          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();

          const startX = fromRect.right - bbox.left;
          const startY = fromRect.top + fromRect.height / 2 - bbox.top;
          const endX = toRect.left - bbox.left;
          const endY = toRect.top + toRect.height / 2 - bbox.top;

          const c1 = startX + (endX - startX) * 0.5;
          const c2 = endX - (endX - startX) * 0.5;

          lines.push(`M ${startX} ${startY} C ${c1} ${startY}, ${c2} ${endY}, ${endX} ${endY}`);
        }
      }
      setPaths(lines);
    };

    updatePaths();
    window.addEventListener('resize', updatePaths);
    return () => window.removeEventListener('resize', updatePaths);
  }, [rounds]);

  const titleFromStages = (stageSet, roundIdx, total) => {
    const has = (s) => stageSet.has(s);
    if (has('final')) return 'GRAND FINAL';
    if (has('semifinal') && has('eliminator')) return 'SEMI 1 + ELIMINATOR';
    if (has('semifinal')) return 'SEMI 2';
    if (roundIdx === total - 1) return 'GRAND FINAL';
    if (roundIdx === total - 2) return 'SEMI-FINALS';
    return `ROUND ${roundIdx + 1}`;
  };

  const subtitleFor = (round) => {
    const n = round.matches?.length || 0;
    const stages = new Set(round.matches?.map(m => String(m.stage || '').toLowerCase()));
    return `${n} MATCH${n === 1 ? '' : 'ES'}${stages.size ? ` • ${Array.from(stages).join(' / ').toUpperCase()}` : ''}`;
  };

  return (
    <div className={`uefa-bracket-container ${accent}`} ref={refRoot}>
      <div className="bracket-header">
        <div className="tournament-title">
          <span className="trophy-icon">🏆</span>
          <div className="title-content">
            <h1>CLASH CHAMPIONSHIP BRACKET</h1>
            <div className="tournament-subtitle">OFFICIAL TOURNAMENT PROGRESSION</div>
          </div>
        </div>
        <div className="bracket-legend">
          <div className="legend-item"><div className="legend-dot live"></div><strong>LIVE</strong></div>
          <div className="legend-item"><div className="legend-dot completed"></div><strong>COMPLETED</strong></div>
          <div className="legend-item"><div className="legend-dot upcoming"></div><strong>UPCOMING</strong></div>
        </div>
      </div>

      <div className="uefa-bracket">
        <svg className="bracket-connectors">
          {paths.map((d, i) => <path key={i} d={d} className="connector-path" stroke="currentColor" />)}
        </svg>

        <div className="bracket-rounds">
          {rounds.map((round, roundIndex) => {
            const set = new Set(round.matches?.map(m => String(m.stage || '').toLowerCase()));
            const title = titleFromStages(set, roundIndex, rounds.length);
            return (
              <div className={`bracket-round round-${roundIndex + 1}`} key={round.round || roundIndex}>
                <div className="round-header">
                  <div className="round-title"><strong>{title}</strong></div>
                  <div className="round-subtitle"><strong>{subtitleFor(round)}</strong></div>
                </div>

                <div className="round-matches-container">
                  {round.matches?.map((match, matchIndex) => (
                    <div
                      key={match._id || `${roundIndex}-${matchIndex}`}
                      ref={(el) => el && refMap.current.set(keyOf(roundIndex, matchIndex), el)}
                      className="match-container"
                    >
                      <MatchNode match={match} roundType={title.toLowerCase().replace(/ /g, '-')} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="bracket-round trophy-column">
            <div className="trophy-display">
              <div className="trophy-icon-large">🏆</div>
              <div className="trophy-content">
                <div className="trophy-title"><strong>CHAMPION</strong></div>
                <div className="trophy-subtitle"><strong>CLASH OF CLANS</strong></div>
                <div className="trophy-year"><strong>{new Date().getFullYear()} SEASON</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}