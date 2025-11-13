import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

(function ensureHashRoute() {
  try {
    const hasHashRoute = window.location.hash && window.location.hash.startsWith('#/');
    const pathOnly = window.location.pathname && window.location.pathname !== '/';
    if (!hasHashRoute && pathOnly) {
      const newUrl = `${window.location.origin}/#${window.location.pathname}${window.location.search}`;
      window.location.replace(newUrl);
    }
  } catch {}
})();

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App />
  </HashRouter>
);