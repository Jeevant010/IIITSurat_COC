import React from 'react';
import { Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard.jsx';
import Teams from './pages/Teams.jsx';
import Team from './pages/Team.jsx';
import Schedule from './pages/Schedule.jsx';
import Bracket from './pages/Bracket.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="coc-app">
      {/* Header */}
      <header className="coc-header">
        <div className="coc-header-container">
          {/* Logo/Brand */}
          <Link to="/" className="coc-brand" onClick={() => setMobileMenuOpen(false)}>
            <div className="coc-brand-icon">⚔️</div>
            <div className="coc-brand-text">
              <span className="coc-brand-title">Clash Championship</span>
              <span className="coc-brand-subtitle">Prakash Memorial Sports Tournament</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="coc-nav-desktop">
            <NavLink 
              to="/" 
              end 
              className={({ isActive }) => `coc-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="coc-nav-icon">🏆</span>
              <span className="coc-nav-text">Standings</span>
            </NavLink>
            <NavLink 
              to="/bracket" 
              className={({ isActive }) => `coc-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="coc-nav-icon">📊</span>
              <span className="coc-nav-text">Bracket</span>
            </NavLink>
            <NavLink 
              to="/schedule" 
              className={({ isActive }) => `coc-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="coc-nav-icon">⚔️</span>
              <span className="coc-nav-text">Wars</span>
            </NavLink>
            <NavLink 
              to="/teams" 
              className={({ isActive }) => `coc-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="coc-nav-icon">👥</span>
              <span className="coc-nav-text">Clans</span>
            </NavLink>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className={`coc-mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className={`coc-nav-mobile ${mobileMenuOpen ? 'open' : ''}`}>
          <NavLink 
            to="/" 
            end 
            className={({ isActive }) => `coc-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="coc-nav-icon">🏆</span>
            <span className="coc-nav-text">Standings</span>
          </NavLink>
          <NavLink 
            to="/bracket" 
            className={({ isActive }) => `coc-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="coc-nav-icon">📊</span>
            <span className="coc-nav-text">Bracket</span>
          </NavLink>
          <NavLink 
            to="/schedule" 
            className={({ isActive }) => `coc-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="coc-nav-icon">⚔️</span>
            <span className="coc-nav-text">Wars</span>
          </NavLink>
          <NavLink 
            to="/teams" 
            className={({ isActive }) => `coc-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="coc-nav-icon">👥</span>
            <span className="coc-nav-text">Clans</span>
          </NavLink>
        </nav>
      </header>

      {/* Main Content */}
      <main className="coc-main">
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/bracket" element={<Bracket />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/:id" element={<Team />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="coc-footer">
        <div className="coc-footer-container">
          <div className="coc-footer-content">
            <div className="coc-footer-brand">
              <div className="coc-footer-icon">⚔️</div>
              <div className="coc-footer-text">
                <strong>Prakash Memorial Sports Tournament</strong>
                <span>Clash Of Clans Tournament</span>
              </div>
            </div>
            
            <div className="coc-footer-links">
              <Link to="/" className="coc-footer-link">Standings</Link>
              <Link to="/bracket" className="coc-footer-link">Bracket</Link>
              <Link to="/schedule" className="coc-footer-link">Wars</Link>
              <Link to="/teams" className="coc-footer-link">Clans</Link>
            </div>
            
            <div className="coc-footer-meta">
              <small>© {new Date().getFullYear()} Prakash Memorial Sports Tournament</small>
              <small>Affiliated with IIIT SURAT</small>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}