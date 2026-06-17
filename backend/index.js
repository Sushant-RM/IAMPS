require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const paperRoutes = require('./routes/papers');
const adminRoutes = require('./routes/admin');
const achievementRoutes = require('./routes/achievementRoutes');
const searchRoutes = require('./routes/search');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files locally

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connection initiated'))
  .catch(err => console.error('MongoDB connection error on startup:', err));

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error event:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection disconnected! Trying to reconnect...');
});

app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/portfolio', require('./routes/portfolioRoutes'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/achievements', achievementRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/report', require('./routes/report'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/events', require('./routes/events'));

app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 500).json({
    status: isConnected ? 'ok' : 'error',
    database: isConnected ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Trigger nodemon restart
