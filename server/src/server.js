const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Commented out database for demo mode
// const connectDB = require('./config/database');
const authRoutes = require('./routes/authSimple');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database - disabled for demo
// connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Basic routes for demo
app.use('/api/vehicles', (req, res) => {
  res.json({ 
    message: 'Vehicles API - Demo data',
    vehicles: [
      {
        id: '1',
        name: 'Truck-001',
        type: 'Delivery Truck',
        driver: 'John Smith',
        status: 'Active',
        location: 'Downtown Hub',
        fuelLevel: 85,
        lastUpdate: '2 min ago'
      }
    ]
  });
});

app.use('/api/routes', (req, res) => {
  res.json({ 
    message: 'Routes API - Demo data',
    routes: []
  });
});

app.use('/api/tracking', (req, res) => {
  res.json({ 
    message: 'Tracking API - Demo data'
  });
});

app.use('/api/users', (req, res) => {
  res.json({ 
    message: 'Users API - Demo data'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'SmartRoute API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      vehicles: '/api/vehicles',
      routes: '/api/routes',
      tracking: '/api/tracking'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`SmartRoute API Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});