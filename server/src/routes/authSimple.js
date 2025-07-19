const express = require('express');
const router = express.Router();

// Simple demo routes without validation middleware
router.post('/register', (req, res) => {
  res.json({ 
    message: 'Registration endpoint - demo mode',
    user: {
      id: 'demo123',
      email: req.body.email || 'demo@smartroute.com',
      firstName: 'Demo',
      lastName: 'User',
      role: 'admin'
    },
    token: 'demo-jwt-token'
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo credentials validation
  const validCredentials = [
    { email: 'admin@smartroute.com', password: 'admin123', role: 'admin' },
    { email: 'dispatcher@smartroute.com', password: 'dispatch123', role: 'dispatcher' },
    { email: 'driver@smartroute.com', password: 'driver123', role: 'driver' }
  ];
  
  const user = validCredentials.find(u => u.email === email && u.password === password);
  
  if (user) {
    res.json({
      message: 'Login successful',
      token: 'demo-jwt-token-' + user.role,
      user: {
        id: 'demo-' + user.role,
        email: user.email,
        firstName: user.role === 'admin' ? 'Admin' : user.role === 'dispatcher' ? 'Dispatcher' : 'Driver',
        lastName: 'User',
        role: user.role
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

router.get('/me', (req, res) => {
  res.json({ 
    user: {
      id: 'demo123',
      email: 'demo@smartroute.com',
      firstName: 'Demo',
      lastName: 'User',
      role: 'admin'
    }
  });
});

module.exports = router;