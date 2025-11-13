import React from 'react';
import { Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard.jsx';
import Teams from './pages/Teams.jsx';
import Team from './pages/Team.jsx';
import Schedule from './pages/Schedule.jsx';
import Bracket from './pages/Bracket.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <div className="container">
      <header className="nav">
        <Link to="/" className="brand">Clash Royale Wars</Link>
        <nav>
          <NavLink to="/" end>Leaderboard</NavLink>
          <NavLink to="/bracket">Bracket</NavLink>
          <NavLink to="/schedule">Wars</NavLink>
          <NavLink to="/teams">Clans</NavLink>
        </nav>
      </header>
      <main>
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
      <footer className="footer">
        <small>© {new Date().getFullYear()} Clash Royale Wars</small>
      </footer>
    </div>
  );
}