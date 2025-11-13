import React from 'react';
import { api } from '../api/client';
import ProgressBar from '../components/ProgressBar.jsx';

function fmt(dt) { try { return new Date(dt).toLocaleString(); } catch { return dt; } }

export default function Schedule() {
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    api.getSchedule().then(setMatches).catch(e => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="coc-loading">
      <div className="coc-spinner"></div>
      <p>Loading war schedule...</p>
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
        <h1 className="coc-title">War Schedule</h1>
        <div className="coc-subtitle">Times shown in your local timezone</div>
      </div>

      <div className="coc-grid">
        {matches.map(m => {
          const hs = Number(m.result?.home?.stars ?? 0);
          const as = Number(m.result?.away?.stars ?? 0);
          const hd = Number(m.result?.home?.destruction ?? 0);
          const ad = Number(m.result?.away?.destruction ?? 0);
          
          const getStatusColor = (status) => {
            switch(status) {
              case 'preparation': return '#ffd700';
              case 'battle': return '#ff6b6b';
              case 'ended': return '#4ecdc4';
              default: return '#95a5a6';
            }
          };

          return (
            <div key={m._id} className={`coc-card coc-card--${m.status}`}>
              {/* Card Header */}
              <div className="coc-card-header">
                <div className="coc-badges">
                  <span className="coc-badge coc-badge--stage">{(m.stage || 'group').toUpperCase()}</span>
                  <span className="coc-badge coc-badge--type">{m.warType?.toUpperCase()}</span>
                  <span className="coc-badge coc-badge--size">{m.size}v{m.size}</span>
                  <span 
                    className="coc-badge coc-badge--status" 
                    style={{ backgroundColor: getStatusColor(m.status) }}
                  >
                    {m.status.toUpperCase()}
                  </span>
                </div>
                <div className="coc-card-meta">
                  <span className="coc-time">{fmt(m.scheduledAt)}</span>
                  <span className="coc-divider">•</span>
                  <span className="coc-bracket">{m.bracketId}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="coc-card-body">
                {/* Home Team */}
                <div className="coc-team-row">
                  <div className="coc-team-info">
                    <div className="coc-team-name">{m.homeTeam?.name || 'Unknown Clan'}</div>
                    <div className="coc-team-stats">
                      <span className="coc-stars">{hs}⭐</span>
                      <span className="coc-destruction">{hd}%</span>
                    </div>
                  </div>
                </div>
                <ProgressBar value={hd} max={100} className="coc-progress--home" />

                {/* VS Separator */}
                <div className="coc-vs">
                  <span className="coc-vs-text">VS</span>
                </div>

                {/* Away Team */}
                <div className="coc-team-row">
                  <div className="coc-team-info">
                    <div className="coc-team-name">{m.awayTeam?.name || 'Unknown Clan'}</div>
                    <div className="coc-team-stats">
                      <span className="coc-stars">{as}⭐</span>
                      <span className="coc-destruction">{ad}%</span>
                    </div>
                  </div>
                </div>
                <ProgressBar value={ad} max={100} className="coc-progress--away" />
              </div>

              {/* Card Footer */}
              <div className="coc-card-footer">
                <div className="coc-war-status">
                  <div 
                    className="coc-status-indicator" 
                    style={{ backgroundColor: getStatusColor(m.status) }}
                  ></div>
                  <span>{m.status.charAt(0).toUpperCase() + m.status.slice(1)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}