const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/Auth.routes');
const energyRoutes = require('./src/routes/Energy.routes');
const tradeRoutes = require('./src/routes/Trade.routes');

// Import error handlers
const { errorHandler, notFound } = require('./src/middlewares/error.middleware');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'],
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