const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const tournamentRoutes = require('./routes/tournament');

const app = express();

app.use(express.json());

const corsOptions = {
  origin: process.env.CORS_ORIGIN || true,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-password'],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(morgan('dev'));

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/college_event';
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => { console.error('MongoDB connection error', err); process.exit(1); });

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api', publicRoutes);
app.use('/api', adminRoutes);
app.use('/api', tournamentRoutes);

// Optional SPA serve…
if (process.env.SERVE_FRONTEND === 'true') {
  const distPath = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));