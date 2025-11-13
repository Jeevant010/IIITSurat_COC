import React from 'react';
import { api } from '../api/client';
import UEFABracket from '../components/UEFABracket.jsx';

function normalizeStatus(s) {
  if (!s) return '';
  const v = String(s).toLowerCase();
  if (v === 'upcoming') return 'preparation';
  if (v === 'live') return 'battle';
  return v;
}

function computeDerived(bracketData) {
  if (!bracketData || !Array.isArray(bracketData.rounds)) {
    return {
      rounds: [],
      totalTeams: 0,
      totalMatches: 0,
      completedMatches: 0,
      currentStage: '',
    };
  }

  const rounds = bracketData.rounds;
  const teamIds = new Set();
  let totalMatches = 0;
  let completedMatches = 0;

  for (const r of rounds) {
    for (const m of (r.matches || [])) {
      totalMatches += 1;
      const s = normalizeStatus(m.status);
      if (s === 'completed') completedMatches += 1;

      const hId = String(m.homeTeam?._id || m.homeTeam || '');
      const aId = String(m.awayTeam?._id || m.awayTeam || '');
      if (hId) teamIds.add(hId);
      if (aId) teamIds.add(aId);
    }
  }

  // Pick the first round that still has non-completed matches and summarize its stages
  let currentStage = '';
  for (const r of rounds) {
    const unfinished = (r.matches || []).filter(m => normalizeStatus(m.status) !== 'completed');
    if (unfinished.length > 0) {
      const stages = new Set(unfinished.map(m => String(m.stage || '').toLowerCase()));
      if (stages.has('final')) currentStage = 'Grand Final';
      else if (stages.has('semifinal') && stages.has('eliminator')) currentStage = 'Semi 1 + Eliminator';
      else if (stages.has('semifinal')) currentStage = 'Semi 2';
      else currentStage = Array.from(stages).map(s => s.toUpperCase()).join(' / ');
      break;
    }
  }

  return {
    ...bracketData,
    rounds,
    totalTeams: teamIds.size,
    totalMatches,
    completedMatches,
    currentStage,
  };
}

export default function Bracket() {
  // Fixed bracket ID - no selector needed
  const bracketId = 'main';
  const bracketScale = 0.86;

  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');
  const scrollRef = React.useRef(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setErr('');
    
    api.getBracket(bracketId)
      .then((resp) => {
        const derived = computeDerived(resp);
        setData(derived);
      })
      .catch((e) => {
        setErr(e.message || 'Failed to load bracket');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [bracketId]);

  React.useEffect(() => { load(); }, [load]);

  // Horizontal pan on vertical mouse wheel
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  if (loading) {
    return (
      <div className="coc-loading">
        <div className="coc-spinner"></div>
        <p>Loading tournament bracket...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="coc-error">
        <div className="coc-error-icon">⚡</div>
        <p className="coc-error-text">{err}</p>
        <button onClick={load} className="coc-retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="coc-container">
      {/* Simplified Header - Just title and stats */}
      <div className="coc-page-head coc-bracket-simple-header">
        <div className="coc-bracket-header-content">
          <h1 className="coc-title">Championship Bracket</h1>
          <div className="coc-subtitle">Tournament Progression & Match Details</div>
          
          {/* Tournament Stats */}
          {data && (
            <div className="coc-bracket-stats">
              <div className="coc-bracket-stat">
                <span className="coc-bracket-stat-value">{data.totalTeams || 0}</span>
                <span className="coc-bracket-stat-label">Participating Clans</span>
              </div>
              <div className="coc-bracket-stat">
                <span className="coc-bracket-stat-value">{data.totalMatches || 0}</span>
                <span className="coc-bracket-stat-label">Total Matches</span>
              </div>
              <div className="coc-bracket-stat">
                <span className="coc-bracket-stat-value">{data.completedMatches || 0}</span>
                <span className="coc-bracket-stat-label">Completed</span>
              </div>
              {data.currentStage && (
                <div className="coc-bracket-stat">
                  <span className="coc-bracket-stat-value coc-bracket-stage">
                    {data.currentStage}
                  </span>
                  <span className="coc-bracket-stat-label">Current Stage</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Bracket Visualization with Horizontal Scrolling */}
      <div className="coc-bracket-fullbleed">
        <div className="coc-bracket-scroll" ref={scrollRef}>
          {!data || !Array.isArray(data.rounds) || data.rounds.length === 0 ? (
            <div className="coc-bracket-error">
              <div className="coc-error-icon">ℹ️</div>
              <p className="coc-error-text">No matches scheduled for this bracket yet.</p>
              <p className="coc-error-subtext">Check back later for tournament updates.</p>
              <button onClick={load} className="coc-retry-btn" type="button">
                Refresh
              </button>
            </div>
          ) : (
            <div className="coc-bracket-content">
              <UEFABracket
                rounds={data.rounds}
                accent="gold"
                cardHeight={150}
                gap={16}
                scale={bracketScale}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tournament Legend */}
      <div className="coc-tournament-legend">
        <div className="coc-legend-title">Match Status Guide</div>
        <div className="coc-legend-items">
          <div className="coc-legend-item">
            <div className="coc-legend-color coc-legend-upcoming"></div>
            <span>Upcoming - Match is scheduled</span>
          </div>
          <div className="coc-legend-item">
            <div className="coc-legend-color coc-legend-live"></div>
            <span>Live - Battle in progress</span>
          </div>
          <div className="coc-legend-item">
            <div className="coc-legend-color coc-legend-completed"></div>
            <span>Completed - Results available</span>
          </div>
          <div className="coc-legend-item">
            <div className="coc-legend-color coc-legend-winner"></div>
            <span>Winner - Advancing to next round</span>
          </div>
        </div>
      </div>

      {/* Bracket Information Panel */}
      <div className="coc-bracket-info">
        <div className="coc-bracket-info-content">
          <h3>📋 Tournament Format</h3>
          <div className="coc-bracket-info-grid">
            <div className="coc-info-item">
              <span className="coc-info-icon">⚔️</span>
              <div className="coc-info-text">
                <strong>Elimination Format</strong>
                <span>Single elimination bracket</span>
              </div>
            </div>
            <div className="coc-info-item">
              <span className="coc-info-icon">⭐</span>
              <div className="coc-info-text">
                <strong>Victory Conditions</strong>
                <span>Most stars wins, destruction percentage as tie breaker</span>
              </div>
            </div>
            <div className="coc-info-item">
              <span className="coc-info-icon">🕒</span>
              <div className="coc-info-text">
                <strong>Match Duration</strong>
                <span>15 minutes preparation + 30 minutes battle</span>
              </div>
            </div>
            <div className="coc-info-item">
              <span className="coc-info-icon">🏆</span>
              <div className="coc-info-text">
                <strong>Grand Final</strong>
                <span>Best of 3 series for championship</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}