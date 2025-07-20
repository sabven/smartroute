require('dotenv').config({ path: '.env.test' });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');

// Create test app
const app = express();
app.use(cors());
app.use(express.json());

// Test database setup
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('employee', 'driver', 'company_admin'),
    defaultValue: 'employee'
  },
  department: DataTypes.STRING,
  employeeId: DataTypes.STRING,
  phone: DataTypes.STRING
});

// CabBooking Model
const CabBooking = sequelize.define('CabBooking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  tripType: {
    type: DataTypes.ENUM('home_to_office', 'office_to_home', 'custom'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  pickupAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  destinationAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'driver_assigned', 'driver_accepted', 'driver_declined', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  driverName: DataTypes.STRING,
  driverPhone: DataTypes.STRING,
  cabNumber: DataTypes.STRING,
  cabModel: DataTypes.STRING,
  fare: DataTypes.DECIMAL(10, 2),
  driverId: DataTypes.UUID,
  driverResponse: DataTypes.TEXT,
  driverResponseAt: DataTypes.DATE,
  assignedAt: DataTypes.DATE
});

// Notification Model
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('driver_declined', 'driver_accepted', 'booking_created'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  bookingId: DataTypes.UUID,
  driverId: DataTypes.UUID,
  adminId: DataTypes.UUID,
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: DataTypes.DATE
});

// Define associations
User.hasMany(CabBooking, { foreignKey: 'userId' });
CabBooking.belongsTo(User, { foreignKey: 'userId' });

// Driver associations
User.hasMany(CabBooking, { foreignKey: 'driverId', as: 'DriverBookings' });
CabBooking.belongsTo(User, { foreignKey: 'driverId', as: 'Driver' });

// Notification associations
User.hasMany(Notification, { foreignKey: 'adminId', as: 'AdminNotifications' });
User.hasMany(Notification, { foreignKey: 'driverId', as: 'DriverNotifications' });
CabBooking.hasMany(Notification, { foreignKey: 'bookingId' });
Notification.belongsTo(User, { foreignKey: 'adminId', as: 'Admin' });
Notification.belongsTo(User, { foreignKey: 'driverId', as: 'Driver' });
Notification.belongsTo(CabBooking, { foreignKey: 'bookingId' });

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(), 
    database: 'PostgreSQL',
    message: 'SmartRoute Test API Running'
  });
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    
    res.json({ 
      message: 'Login successful',
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ')[1] || '',
        name: user.name 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'employee' } = req.body;
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));
    
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role
    });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    
    res.status(201).json({ 
      message: 'User created successfully',
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.name 
      } 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Booking endpoints
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await CabBooking.findAll({
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        attributes: ['name', 'email']
      }]
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { tripType, pickupDate, pickupTime, pickupAddress, destinationAddress, specialRequests, employeeId, driverName, driverPhone, cabNumber, cabModel, fare } = req.body;
    
    if (!tripType || !pickupDate || !pickupTime || !pickupAddress || !destinationAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const bookingId = `SR${Date.now().toString().slice(-8)}`;
    const bookingData = {
      bookingId,
      userId: employeeId || req.user.userId,
      tripType,
      date: pickupDate,
      time: pickupTime,
      pickupAddress,
      destinationAddress,
      status: 'confirmed'
    };
    
    // Add optional fields if provided
    if (driverName) bookingData.driverName = driverName;
    if (driverPhone) bookingData.driverPhone = driverPhone;
    if (cabNumber) bookingData.cabNumber = cabNumber;
    if (cabModel) bookingData.cabModel = cabModel;
    if (fare) bookingData.fare = fare;
    
    const booking = await CabBooking.create(bookingData);
    
    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Driver assignment endpoint
app.put('/api/bookings/:bookingId/assign-driver', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId, driverName, driverPhone, cabNumber, cabModel } = req.body;
    
    if (!driverId || !driverName) {
      return res.status(400).json({ error: 'Driver ID and name are required' });
    }
    
    const booking = await CabBooking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    await booking.update({
      driverId,
      driverName,
      driverPhone,
      cabNumber,
      cabModel,
      status: 'driver_assigned',
      assignedAt: new Date(),
      driverResponse: null,
      driverResponseAt: null
    });
    
    const updatedBooking = await CabBooking.findByPk(bookingId, {
      include: [{
        model: User,
        attributes: ['name', 'email']
      }]
    });
    
    res.json({
      message: 'Driver assigned successfully',
      booking: updatedBooking
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Driver response endpoints
app.put('/api/bookings/:bookingId/driver-response', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { response, message } = req.body;
    const driverId = req.user.userId;
    
    if (!response || !['accept', 'decline'].includes(response)) {
      return res.status(400).json({ error: 'Valid response (accept/decline) is required' });
    }
    
    const booking = await CabBooking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.driverId !== driverId) {
      return res.status(403).json({ error: 'You are not assigned to this booking' });
    }
    
    if (booking.driverResponseAt) {
      return res.status(400).json({ error: 'You have already responded to this booking' });
    }
    
    const newStatus = response === 'accept' ? 'driver_accepted' : 'driver_declined';
    
    await booking.update({
      status: newStatus,
      driverResponse: message || `Driver ${response === 'accept' ? 'accepted' : 'declined'} the trip`,
      driverResponseAt: new Date()
    });
    
    // Create notification for admin
    const driver = await User.findByPk(driverId);
    const adminUsers = await User.findAll({ where: { role: 'company_admin' } });
    
    for (const admin of adminUsers) {
      await Notification.create({
        type: response === 'accept' ? 'driver_accepted' : 'driver_declined',
        title: `Driver ${response === 'accept' ? 'Accepted' : 'Declined'} Trip`,
        message: `${driver.name} has ${response === 'accept' ? 'accepted' : 'declined'} trip ${booking.bookingId}. ${message || ''}`,
        bookingId: booking.id,
        driverId: driverId,
        adminId: admin.id
      });
    }
    
    const updatedBooking = await CabBooking.findByPk(bookingId, {
      include: [{
        model: User,
        attributes: ['name', 'email']
      }]
    });
    
    res.json({
      message: `Trip ${response === 'accept' ? 'accepted' : 'declined'} successfully`,
      booking: updatedBooking
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get driver-assigned bookings for specific driver
app.get('/api/bookings/driver/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    
    if (req.user.userId !== driverId) {
      const user = await User.findByPk(req.user.userId);
      if (user.role !== 'company_admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const bookings = await CabBooking.findAll({
      where: { 
        driverId,
        status: ['driver_assigned', 'driver_accepted', 'in_progress', 'completed']
      },
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        attributes: ['name', 'email', 'phone']
      }]
    });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications for admin
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (user.role !== 'company_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const notifications = await Notification.findAll({
      where: { adminId: req.user.userId },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    if (notification.adminId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await notification.update({
      isRead: true,
      readAt: new Date()
    });
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User endpoints
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Driver endpoints
app.get('/api/drivers', async (req, res) => {
  try {
    const drivers = await User.findAll({
      where: { role: 'driver' },
      attributes: { exclude: ['password'] }
    });
    res.json({ drivers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vehicles endpoint
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
        features: { ac: true, gps: true }
      }
    ]
  });
});

module.exports = {
  app,
  sequelize,
  User,
  CabBooking,
  Notification
};