import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Teams() {
  const [teams, setTeams] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(() => {
    api.getTeams().then(setTeams).catch(e => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="coc-loading">
      <div className="coc-spinner"></div>
      <p>Loading clans...</p>
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
        <h1 className="coc-title">Clans</h1>
        <div className="coc-subtitle">Explore all participating clans</div>
      </div>

      <div className="coc-clans-grid">
        {teams.map(t => (
          <Link key={t._id} to={`/teams/${t._id}`} className="coc-clan-card">
            {/* Clan Card Header with Badge */}
            <div className="coc-clan-card-header">
              <div className="coc-clan-badge">
                {t.logoUrl ? (
                  <img src={t.logoUrl} alt={`${t.name} badge`} className="coc-clan-badge-img" />
                ) : (
                  <div className="coc-clan-avatar">{t.name.charAt(0).toUpperCase()}</div>
                )}
                {t.level && (
                  <div className="coc-clan-level">
                    <span>Lvl {t.level}</span>
                  </div>
                )}
              </div>
              
              <div className="coc-clan-info">
                <div className="coc-clan-name">{t.name}</div>
                {t.clanTag && (
                  <div className="coc-clan-tag">{t.clanTag}</div>
                )}
                {t.leader && (
                  <div className="coc-clan-leader">
                    <span className="coc-leader-icon">👑</span>
                    {t.leader}
                  </div>
                )}
              </div>
            </div>

            {/* Clan Stats */}
            <div className="coc-clan-stats">
              <div className="coc-stat-item">
                <div className="coc-stat-value">{t.memberCount || 0}</div>
                <div className="coc-stat-label">Members</div>
              </div>
              <div className="coc-stat-divider"></div>
              <div className="coc-stat-item">
                <div className="coc-stat-value">{t.wins || 0}</div>
                <div className="coc-stat-label">Wins</div>
              </div>
              <div className="coc-stat-divider"></div>
              <div className="coc-stat-item">
                <div className="coc-stat-value">{t.losses || 0}</div>
                <div className="coc-stat-label">Losses</div>
              </div>
            </div>

            {/* Clan Meta Tags */}
            <div className="coc-clan-meta">
              {t.warLeague && (
                <span className="coc-clan-pill coc-clan-pill--league">
                  {t.warLeague}
                </span>
              )}
              {t.group && (
                <span className="coc-clan-pill coc-clan-pill--group">
                  Group {t.group}
                </span>
              )}
              {t.location && (
                <span className="coc-clan-pill coc-clan-pill--location">
                  {t.location}
                </span>
              )}
            </div>

            {/* View Details CTA */}
            <div className="coc-clan-cta">
              <span className="coc-clan-cta-text">View Clan Details</span>
              <span className="coc-clan-cta-arrow">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}