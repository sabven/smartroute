const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'SmartRoute Azure Demo Server Running',
    mode: 'demo'
  });
});

// Demo auth routes (same as demo.js but Azure-compatible)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const validCredentials = [
    { email: 'priya@techcorp.com', password: 'emp123', role: 'employee', name: 'Priya Sharma' },
    { email: 'rajesh@smartroute.com', password: 'driver123', role: 'driver', name: 'Rajesh Kumar' },
    { email: 'admin@techcorp.com', password: 'admin123', role: 'company_admin', name: 'Admin User' }
  ];
  
  const user = validCredentials.find(u => u.email === email && u.password === password);
  
  if (user) {
    res.json({
      message: 'Login successful',
      token: 'demo-jwt-token-' + user.role,
      user: {
        id: 'demo-' + user.role,
        email: user.email,
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ')[1] || 'User',
        role: user.role
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Cab booking endpoints
app.post('/api/bookings', (req, res) => {
  const bookingId = `SR${Date.now().toString().slice(-8)}`;
  res.json({
    message: 'Booking created successfully',
    booking: {
      id: bookingId,
      ...req.body,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    }
  });
});

app.get('/api/bookings', (req, res) => {
  res.json({
    bookings: [
      {
        id: '1',
        bookingId: 'SR20241019001',
        tripType: 'home_to_office',
        date: '2024-01-20',
        time: '09:00',
        status: 'driver_assigned',
        pickupAddress: 'A-101, Green Valley Apartments, Sector 18, Noida',
        destinationAddress: 'Tech Tower, Sector 62, Noida',
        driver: {
          name: 'Rajesh Kumar',
          phone: '+91 98765 43210',
          rating: 4.8
        },
        cab: {
          number: 'UP14 AB 1234',
          model: 'Maruti Swift'
        },
        fare: {
          amount: 175,
          currency: 'INR'
        }
      }
    ]
  });
});

app.get('/api/vehicles', (req, res) => {
  res.json({
    vehicles: [
      {
        id: '1',
        cabNumber: 'UP14 AB 1234',
        model: 'Maruti Swift',
        driver: 'Rajesh Kumar',
        status: 'Active',
        location: 'Sector 18, Noida',
        seatingCapacity: 4,
        features: {
          ac: true,
          gps: true
        }
      },
      {
        id: '2',
        cabNumber: 'UP16 CD 5678',
        model: 'Hyundai i20',
        driver: 'Suresh Singh',
        status: 'En Route',
        location: 'Sector 62, Noida',
        seatingCapacity: 4,
        features: {
          ac: true,
          gps: true
        }
      }
    ]
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'SmartRoute Azure Demo API Server',
    version: '1.0.0',
    mode: 'demo',
    endpoints: {
      health: '/api/health',
      login: '/api/auth/login',
      bookings: '/api/bookings',
      vehicles: '/api/vehicles'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', mode: 'demo' });
});

// Handle unhandled routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', mode: 'demo' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SmartRoute Azure Demo Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Demo credentials:`);
  console.log(`   Employee: priya@techcorp.com / emp123`);
  console.log(`   Driver: rajesh@smartroute.com / driver123`);
  console.log(`   Admin: admin@techcorp.com / admin123`);
  console.log(`🌐 Mode: Azure Demo (no database)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;