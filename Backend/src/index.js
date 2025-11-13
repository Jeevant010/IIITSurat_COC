const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(express.json());

// CORS: explicitly allow the custom admin header and handle preflight
const corsOptions = {
  origin: process.env.CORS_ORIGIN || true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-password'],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // respond to all preflights

app.use(morgan('dev'));

// DB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/college_event';
mongoose
  .connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error', err);
    process.exit(1);
  });

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// API Routes
app.use('/api', publicRoutes);
app.use('/api', adminRoutes);

// Optional: serve built frontend without vercel.json (set SERVE_FRONTEND=true)
if (process.env.SERVE_FRONTEND === 'true') {
  const distPath = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});