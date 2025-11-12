import React from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import Leaderboard from './pages/Leaderboard.jsx';
import Teams from './pages/Teams.jsx';
import Schedule from './pages/Schedule.jsx';
import Bracket from './pages/Bracket.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <div className="container">
      <header className="nav">
        <Link to="/" className="brand">College Event</Link>
        <nav>
          <NavLink to="/" end>Leaderboard</NavLink>
          <NavLink to="/teams">Teams</NavLink>
          <NavLink to="/schedule">Schedule</NavLink>
          <NavLink to="/bracket">Bracket</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/bracket" element={<Bracket />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <footer className="footer">
        <small>© {new Date().getFullYear()} College Event</small>
      </footer>
    </div>
  );
}