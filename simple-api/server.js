const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'SmartRoute API is running',
    database: 'PostgreSQL',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Demo endpoints
app.get('/api/demo', (req, res) => {
  res.json({
    message: 'SmartRoute Corporate Cab Booking API',
    features: [
      'Employee cab booking',
      'Driver notifications', 
      'Trip tracking',
      'Company management'
    ],
    demo_credentials: {
      employee: 'priya@techcorp.com / emp123',
      driver: 'rajesh@smartroute.com / driver123',
      admin: 'admin@techcorp.com / admin123'
    }
  });
});

// Mock auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo users
  const demoUsers = {
    'priya@techcorp.com': { password: 'emp123', role: 'employee', name: 'Priya Singh' },
    'rajesh@smartroute.com': { password: 'driver123', role: 'driver', name: 'Rajesh Kumar' },
    'admin@techcorp.com': { password: 'admin123', role: 'company_admin', name: 'Admin User' }
  };
  
  const user = demoUsers[email];
  if (user && user.password === password) {
    res.json({
      token: 'demo-jwt-token',
      user: {
        email,
        name: user.name,
        role: user.role
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Mock bookings endpoint
app.get('/api/bookings', (req, res) => {
  res.json([
    {
      id: '1',
      tripType: 'home_to_office',
      pickupLocation: 'Koramangala, Bangalore',
      dropLocation: 'Electronic City, Bangalore',
      scheduledTime: new Date().toISOString(),
      status: 'confirmed'
    }
  ]);
});

app.post('/api/bookings', (req, res) => {
  res.status(201).json({
    id: Date.now().toString(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 SmartRoute API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🇮🇳 Corporate cab booking system ready!`);
});