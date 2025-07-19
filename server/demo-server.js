const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory demo data
let users = [
  { 
    id: '1', 
    email: 'priya@techcorp.com', 
    password: bcrypt.hashSync('emp123', 10), 
    name: 'Priya Singh', 
    role: 'employee',
    department: 'Engineering',
    employeeId: 'EMP001'
  },
  { 
    id: '2', 
    email: 'rajesh@smartroute.com', 
    password: bcrypt.hashSync('driver123', 10), 
    name: 'Rajesh Kumar', 
    role: 'driver',
    phone: '+91-9876543210',
    vehicleNumber: 'KA-01-AB-1234'
  },
  { 
    id: '3', 
    email: 'admin@techcorp.com', 
    password: bcrypt.hashSync('admin123', 10), 
    name: 'Admin User', 
    role: 'company_admin',
    department: 'HR'
  }
];

let bookings = [
  {
    id: '1',
    employeeId: '1',
    driverId: '2',
    tripType: 'home_to_office',
    pickupLocation: 'Koramangala 6th Block, Bangalore',
    dropLocation: 'Electronic City Phase 1, Bangalore',
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
    fare: 280,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    employeeId: '1',
    tripType: 'office_to_home',
    pickupLocation: 'Electronic City Phase 1, Bangalore',
    dropLocation: 'Koramangala 6th Block, Bangalore',
    scheduledTime: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    fare: 280,
    createdAt: new Date().toISOString()
  }
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'SmartRoute API is running locally',
    database: 'In-memory demo data',
    environment: 'development'
  });
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`);
    
    const user = users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, 'demo-jwt-secret');
    const { password: _, ...userWithoutPassword } = user;
    
    console.log(`Login successful: ${user.name} (${user.role})`);
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'employee' } = req.body;
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const newUser = {
      id: Date.now().toString(),
      email,
      password: bcrypt.hashSync(password, 10),
      name,
      role
    };
    
    users.push(newUser);
    
    const token = jwt.sign({ userId: newUser.id }, 'demo-jwt-secret');
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Booking endpoints
app.get('/api/bookings', (req, res) => {
  console.log('Fetching bookings...');
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  try {
    const newBooking = {
      id: Date.now().toString(),
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    console.log('New booking created:', newBooking.tripType);
    
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/bookings/:id', (req, res) => {
  const bookingId = req.params.id;
  const bookingIndex = bookings.findIndex(b => b.id === bookingId);
  
  if (bookingIndex === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  bookings[bookingIndex] = { ...bookings[bookingIndex], ...req.body };
  res.json(bookings[bookingIndex]);
});

// Driver endpoints
app.get('/api/drivers', (req, res) => {
  const drivers = users.filter(u => u.role === 'driver');
  res.json(drivers.map(({ password, ...driver }) => driver));
});

// Demo data endpoint
app.get('/api/demo', (req, res) => {
  res.json({
    message: 'SmartRoute Corporate Cab Booking System',
    description: 'A comprehensive solution for Indian companies to manage employee transportation',
    features: [
      'Employee cab booking (Home ↔ Office)',
      'Driver notifications and trip management', 
      'Real-time trip tracking',
      'Company admin dashboard',
      'Role-based access control',
      'Mobile-first responsive design'
    ],
    demo_users: [
      { role: 'Employee', email: 'priya@techcorp.com', password: 'emp123' },
      { role: 'Driver', email: 'rajesh@smartroute.com', password: 'driver123' },
      { role: 'Admin', email: 'admin@techcorp.com', password: 'admin123' }
    ],
    statistics: {
      total_users: users.length,
      total_bookings: bookings.length,
      active_drivers: users.filter(u => u.role === 'driver').length
    }
  });
});

app.listen(PORT, () => {
  console.log('🚀 SmartRoute Demo API Server Started');
  console.log('=====================================');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
  console.log(`📋 Demo Info: http://localhost:${PORT}/api/demo`);
  console.log('');
  console.log('🇮🇳 Corporate Cab Booking System Ready!');
  console.log('');
  console.log('👥 Demo Credentials:');
  console.log('   Employee: priya@techcorp.com / emp123');
  console.log('   Driver:   rajesh@smartroute.com / driver123');  
  console.log('   Admin:    admin@techcorp.com / admin123');
  console.log('');
  console.log('✨ Features Available:');
  console.log('   • Home ↔ Office trip booking');
  console.log('   • Driver trip management');
  console.log('   • Admin company dashboard');
  console.log('   • Real-time notifications');
  console.log('   • Mobile-responsive design');
});