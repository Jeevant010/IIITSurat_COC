import React from 'react';

// UEFA-style match nodes with team flags and scores
function MatchNode({ match, isWinnerTop, isWinnerBottom, roundType }) {
  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  const homeScore = match.result?.home?.stars ?? 0;
  const awayScore = match.result?.away?.stars ?? 0;
  const homeDestruction = match.result?.home?.destruction ?? 0;
  const awayDestruction = match.result?.away?.destruction ?? 0;
  
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'battle';
  const isScheduled = match.status === 'preparation';

  // Determine winner based on stars, then destruction percentage
  const getWinner = () => {
    if (homeScore > awayScore) return 'home';
    if (awayScore > homeScore) return 'away';
    if (homeDestruction > awayDestruction) return 'home';
    if (awayDestruction > homeDestruction) return 'away';
    return 'draw';
  };

  const winner = getWinner();

  return (
    <div className={`uefa-match-node ${isCompleted ? 'completed' : ''} ${isLive ? 'live' : ''} ${roundType}`}>
      {/* Match time for scheduled matches */}
      {isScheduled && match.scheduledAt && (
        <div className="match-time">
          {new Date(match.scheduledAt).toLocaleDateString()}
        </div>
      )}
      
      {/* Live match indicator */}
      {isLive && (
        <div className="live-indicator">
          <span className="live-pulse"></span>
          LIVE
        </div>
      )}

      <div className="team-row home-team">
        <div className="team-info">
          <div className="team-flag">
            {homeTeam?.logoUrl ? (
              <img src={homeTeam.logoUrl} alt={homeTeam.name} />
            ) : (
              <div className="flag-placeholder">{homeTeam?.name?.charAt(0) || 'T'}</div>
            )}
          </div>
          <span className={`team-name ${winner === 'home' ? 'winner' : ''}`}>
            {homeTeam?.name || 'TBD'}
          </span>
        </div>
        {isCompleted && (
          <div className="team-score">
            <span className="score">{homeScore}</span>
            {homeDestruction > 0 && (
              <span className="destruction">({homeDestruction}%)</span>
            )}
          </div>
        )}
      </div>

      <div className="team-row away-team">
        <div className="team-info">
          <div className="team-flag">
            {awayTeam?.logoUrl ? (
              <img src={awayTeam.logoUrl} alt={awayTeam.name} />
            ) : (
              <div className="flag-placeholder">{awayTeam?.name?.charAt(0) || 'T'}</div>
            )}
          </div>
          <span className={`team-name ${winner === 'away' ? 'winner' : ''}`}>
            {awayTeam?.name || 'TBD'}
          </span>
        </div>
        {isCompleted && (
          <div className="team-score">
            <span className="score">{awayScore}</span>
            {awayDestruction > 0 && (
              <span className="destruction">({awayDestruction}%)</span>
            )}
          </div>
        )}
      </div>

      {/* Match metadata */}
      <div className="match-meta">
        {match.warType && (
          <span className="war-type">{match.warType}</span>
        )}
        {match.size && (
          <span className="team-size">{match.size}v{match.size}</span>
        )}
      </div>
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
        const nextRound = rounds[roundIdx + 1]?.matches || [];

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

          // Create curved connector path
          const controlX1 = startX + (endX - startX) * 0.5;
          const controlX2 = endX - (endX - startX) * 0.5;
          
          lines.push(
            `M ${startX} ${startY} 
             C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`
          );
        }
      }
      setPaths(lines);
    };

    updatePaths();
    window.addEventListener('resize', updatePaths);
    return () => window.removeEventListener('resize', updatePaths);
  }, [rounds]);

  const getRoundTitle = (round, index) => {
    const roundNames = {
      1: 'Round of 16',
      2: 'Quarter-Finals',
      3: 'Semi-Finals',
      4: 'Grand Final'
    };
    
    if (round.round && roundNames[round.round]) {
      return roundNames[round.round];
    }
    
    // Fallback based on bracket structure
    const totalRounds = rounds.length;
    if (index === totalRounds - 1) return 'Grand Final';
    if (index === totalRounds - 2) return 'Semi-Finals';
    if (index === totalRounds - 3) return 'Quarter-Finals';
    return `Round ${round.round || index + 1}`;
  };

  return (
    <div className={`uefa-bracket-container ${accent}`} ref={refRoot}>
      <div className="bracket-header">
        <div className="tournament-title">
          <span className="trophy-icon">🏆</span>
          Clash Championship Bracket
        </div>
        <div className="bracket-legend">
          <div className="legend-item">
            <div className="legend-dot live"></div>
            <span>Live Match</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot completed"></div>
            <span>Completed</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot upcoming"></div>
            <span>Upcoming</span>
          </div>
        </div>
      </div>

      <div className="uefa-bracket">
        <svg className="bracket-connectors">
          {paths.map((d, i) => (
            <path 
              key={i} 
              d={d} 
              className="connector-path"
              stroke="currentColor"
            />
          ))}
        </svg>

        <div className="bracket-rounds">
          {rounds.map((round, roundIndex) => (
            <div 
              className={`bracket-round round-${roundIndex + 1}`} 
              key={round.round || roundIndex}
            >
              <div className="round-header">
                <div className="round-title">{getRoundTitle(round, roundIndex)}</div>
                <div className="round-matches">{round.matches?.length || 0} Matches</div>
              </div>
              
              <div className="round-matches-container">
                {round.matches?.map((match, matchIndex) => (
                  <div
                    key={match._id || `${roundIndex}-${matchIndex}`}
                    ref={(el) => el && refMap.current.set(keyOf(roundIndex, matchIndex), el)}
                    className="match-container"
                  >
                    <MatchNode 
                      match={match}
                      roundType={getRoundTitle(round, roundIndex).toLowerCase().replace(' ', '-')}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Trophy Column */}
          <div className="bracket-round trophy-column">
            <div className="trophy-display">
              <div className="trophy-icon-large">🏆</div>
              <div className="trophy-title">Champion</div>
              <div className="trophy-subtitle">Clash of Clans</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}