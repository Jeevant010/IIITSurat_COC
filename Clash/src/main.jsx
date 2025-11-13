import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom'; // Fix refresh 404 on static hosts without rewrites
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App />
  </HashRouter>
);