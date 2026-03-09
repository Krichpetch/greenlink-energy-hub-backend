const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const energyRoutes = require('./routes/energy.routes');
const tradeRoutes = require('./routes/trade.routes');

// Import error handlers
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'GreenLink server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/trades', tradeRoutes);

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌱 GreenLink server running on port ${PORT}`);
});