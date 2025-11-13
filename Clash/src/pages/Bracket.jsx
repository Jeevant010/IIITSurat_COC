import React from 'react';
import { api } from '../api/client';
import UEFABracket from '../components/UEFABracket.jsx';

export default function Bracket() {
  const [bracketId, setBracketId] = React.useState('main');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');
  const [availableBrackets, setAvailableBrackets] = React.useState(['main', 'qualifiers', 'finals']);

  const load = React.useCallback(() => {
    setLoading(true);
    api.getBracket(bracketId)
      .then(setData)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [bracketId]);

  React.useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="coc-loading">
      <div className="coc-spinner"></div>
      <p>Loading tournament bracket...</p>
    </div>
  );
  
  if (err) return (
    <div className="coc-error">
      <div className="coc-error-icon">⚡</div>
      <p className="coc-error-text">{err}</p>
    </div>
  );

  return (
    <div className="coc-container">
      <div className="coc-page-head">
        <h1 className="coc-title">Championship Bracket</h1>
        <div className="coc-subtitle">Follow the tournament progression</div>
        
        {/* Bracket Selector */}
        <div className="coc-bracket-selector">
          <div className="coc-bracket-tabs">
            {availableBrackets.map(bracket => (
              <button
                key={bracket}
                className={`coc-bracket-tab ${bracketId === bracket ? 'active' : ''}`}
                onClick={() => setBracketId(bracket)}
              >
                <span className="coc-bracket-tab-text">
                  {bracket.charAt(0).toUpperCase() + bracket.slice(1)}
                </span>
                {bracket === 'finals' && <span className="coc-bracket-tab-badge">🏆</span>}
              </button>
            ))}
          </div>
          
          <div className="coc-bracket-search">
            <label className="coc-bracket-label">
              <span className="coc-bracket-label-text">Custom Bracket ID</span>
              <div className="coc-bracket-input-group">
                <input 
                  value={bracketId} 
                  onChange={e => setBracketId(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && load()}
                  className="coc-bracket-input"
                  placeholder="Enter bracket ID..."
                />
                <button onClick={load} className="coc-bracket-load-btn">
                  Load
                </button>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Tournament Progress */}
      {data && (
        <div className="coc-tournament-progress">
          <div className="coc-tournament-header">
            <div className="coc-tournament-title">
              <span className="coc-tournament-icon">🏆</span>
              Clash Championship {new Date().getFullYear()}
            </div>
            <div className="coc-tournament-stats">
              <div className="coc-tournament-stat">
                <span className="coc-tournament-stat-value">{data.totalTeams || 0}</span>
                <span className="coc-tournament-stat-label">Clans</span>
              </div>
              <div className="coc-tournament-stat">
                <span className="coc-tournament-stat-value">{data.totalMatches || 0}</span>
                <span className="coc-tournament-stat-label">Matches</span>
              </div>
              <div className="coc-tournament-stat">
                <span className="coc-tournament-stat-value">{data.completedMatches || 0}</span>
                <span className="coc-tournament-stat-label">Completed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bracket Visualization */}
      <div className="coc-bracket-container">
        {err && (
          <div className="coc-bracket-error">
            <div className="coc-error-icon">⚡</div>
            <p className="coc-error-text">{err}</p>
            <button onClick={load} className="coc-retry-btn">
              Try Again
            </button>
          </div>
        )}
        
        {data && (
          <div className="coc-bracket-visualization">
            <UEFABracket rounds={data.rounds} accent="gold" />
            
            {/* Current Stage Highlight */}
            {data.currentStage && (
              <div className="coc-current-stage">
                <div className="coc-current-stage-badge">
                  <span className="coc-current-stage-text">
                    Current Stage: {data.currentStage}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tournament Legend */}
      <div className="coc-tournament-legend">
        <div className="coc-legend-title">Bracket Legend</div>
        <div className="coc-legend-items">
          <div className="coc-legend-item">
            <div className="coc-legend-color coc-legend-upcoming"></div>
            <span>Upcoming Match</span>
          </div>
          <div className="coc-legend-item">
            <div className="coc-legend-color coc-legend-live"></div>
            <span>Live Match</span>
          </div>
          <div className="coc-legend-item">
            <div className="coc-legend-color coc-legend-completed"></div>
            <span>Completed Match</span>
          </div>
          <div className="coc-legend-item">
            <div className="coc-legend-color coc-legend-winner"></div>
            <span>Advancing Clan</span>
          </div>
        </div>
      </div>
    </div>
  );
}