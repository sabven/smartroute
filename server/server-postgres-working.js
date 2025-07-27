require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Import logging
const { logger, authLogger, apiLogger, dbLogger, bookingLogger } = require('./logger');
const { requestLogger, requestIdMiddleware, errorLogger, actionLogger } = require('./middleware/logging');

// Import smart allocation engine
const SmartAllocationEngine = require('./src/utils/smartAllocation');

// Import driver management routes
const { router: driverManagementRouter, injectModels } = require('./src/routes/driverManagement');

// Import vehicles routes
const createVehiclesRouter = require('./src/routes/vehicles');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5001;

// Logging middleware (before other middleware)
app.use(requestIdMiddleware);
app.use(requestLogger);

app.use(cors());
app.use(express.json());

// Database setup
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  logging: (msg) => dbLogger.debug(msg)
});

// Import and create DriverProfile model
const createDriverProfile = require('./src/models/DriverProfile');
const DriverProfile = createDriverProfile(sequelize);

// Import and create Vehicle model
const createVehicle = require('./src/models/Vehicle');
const Vehicle = createVehicle(sequelize);

// Import and create EmployeeProfile model
const createEmployeeProfile = require('./src/models/EmployeeProfile');
const EmployeeProfile = createEmployeeProfile(sequelize);

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

// Set up associations
User.hasOne(DriverProfile, { foreignKey: 'userId', as: 'driverProfile' });
DriverProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(EmployeeProfile, { foreignKey: 'userId', as: 'employeeProfile' });
EmployeeProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Vehicle associations  
User.hasMany(Vehicle, { foreignKey: 'driverId', as: 'vehicles' });
Vehicle.belongsTo(User, { foreignKey: 'driverId', as: 'driver' });

// Inject models into driver management routes
injectModels({ User, DriverProfile });

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
  vehicleId: DataTypes.UUID,
  licensePlate: DataTypes.STRING,
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(), 
    database: 'PostgreSQL',
    message: 'SmartRoute API Running'
  });
});

// Auth endpoints
app.post('/api/auth/login', actionLogger('login_attempt'), async (req, res) => {
  try {
    const { email, password } = req.body;
    authLogger.info('Login attempt', { requestId: req.id, email, ip: req.ip });
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      authLogger.warn('Login failed - user not found', { requestId: req.id, email, ip: req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      authLogger.warn('Login failed - invalid password', { requestId: req.id, email, ip: req.ip });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    
    authLogger.info('Login successful', { 
      requestId: req.id, 
      email, 
      userId: user.id, 
      role: user.role,
      ip: req.ip 
    });
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
    authLogger.error('Login error', { 
      requestId: req.id, 
      error: error.message, 
      stack: error.stack,
      ip: req.ip 
    });
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
    console.error('Registration error:', error);
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
    console.error('Get bookings error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await CabBooking.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        attributes: ['name', 'email']
      }]
    });
    res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { tripType, pickupDate, pickupTime, pickupAddress, destinationAddress, specialRequests, employeeId } = req.body;
    
    console.log('Received booking data:', {
      tripType, pickupDate, pickupTime, pickupAddress, destinationAddress, specialRequests, employeeId
    });
    
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
    
    console.log('Creating booking with data:', bookingData);
    
    const booking = await CabBooking.create(bookingData);
    
    // Fetch the created booking with user details
    const bookingWithUser = await CabBooking.findByPk(booking.id, {
      include: [{
        model: User,
        attributes: ['name', 'email', 'phone']
      }]
    });
    
    // Emit real-time update to admin dashboard
    emitToAdmins('booking_updated', {
      type: 'booking_created',
      action: 'create',
      booking: bookingWithUser,
      driver: null,
      message: `New booking created: ${booking.bookingId}`,
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json({
      message: 'Booking created successfully',
      booking: bookingWithUser
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Driver assignment endpoint
app.put('/api/bookings/:bookingId/assign-driver', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { driverId, driverName, driverPhone, cabNumber, cabModel } = req.body;
    
    console.log('Assigning driver to booking:', { bookingId, driverId, driverName });
    
    if (!driverId || !driverName) {
      return res.status(400).json({ error: 'Driver ID and name are required' });
    }
    
    const booking = await CabBooking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Update booking with driver details
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
    
    // Fetch updated booking with user details
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
    console.error('Assign driver error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Vehicle assignment endpoint
app.put('/api/bookings/:bookingId/assign-vehicle', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { vehicleId, driverId, driverName, driverPhone, driverEmail, cabNumber, cabModel, licensePlate } = req.body;
    
    console.log('Assigning vehicle to booking:', { bookingId, vehicleId, driverId, driverName });
    
    if (!vehicleId || !driverId || !driverName) {
      return res.status(400).json({ error: 'Vehicle ID, driver ID and driver name are required' });
    }
    
    const booking = await CabBooking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Verify the vehicle exists and has the specified driver
    const vehicle = await Vehicle.findByPk(vehicleId, {
      include: [{
        model: User,
        as: 'driver',
        attributes: ['id', 'name', 'email', 'phone']
      }]
    });
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    
    if (!vehicle.driver || vehicle.driver.id !== driverId) {
      return res.status(400).json({ error: 'Vehicle is not assigned to the specified driver' });
    }
    
    // Update booking with vehicle and driver details
    await booking.update({
      driverId,
      driverName,
      driverPhone: driverPhone || vehicle.driver.phone,
      cabNumber,
      cabModel,
      status: 'driver_assigned',
      assignedAt: new Date(),
      driverResponse: null,
      driverResponseAt: null,
      // Add vehicle information to booking
      vehicleId: vehicleId,
      licensePlate: licensePlate
    });
    
    // Fetch updated booking with user details
    const updatedBooking = await CabBooking.findByPk(bookingId, {
      include: [{
        model: User,
        attributes: ['name', 'email']
      }]
    });
    
    res.json({
      message: 'Vehicle assigned successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Assign vehicle error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Driver response endpoints
app.put('/api/bookings/:bookingId/driver-response', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { response, message } = req.body; // response: 'accept' or 'decline'
    const driverId = req.user.userId;
    
    console.log('Driver response:', { bookingId, driverId, response, message });
    
    if (!response || !['accept', 'decline'].includes(response)) {
      return res.status(400).json({ error: 'Valid response (accept/decline) is required' });
    }
    
    const booking = await CabBooking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check if this driver is assigned to this booking
    if (booking.driverId !== driverId) {
      return res.status(403).json({ error: 'You are not assigned to this booking' });
    }
    
    // Check if driver has already responded
    if (booking.driverResponseAt) {
      return res.status(400).json({ error: 'You have already responded to this booking' });
    }
    
    const newStatus = response === 'accept' ? 'driver_accepted' : 'driver_declined';
    
    // Update booking with driver response
    await booking.update({
      status: newStatus,
      driverResponse: message || `Driver ${response}ed the trip`,
      driverResponseAt: new Date()
    });
    
    // Create notification for admin
    const driver = await User.findByPk(driverId);
    const adminUsers = await User.findAll({ where: { role: 'company_admin' } });
    
    for (const admin of adminUsers) {
      await Notification.create({
        type: response === 'accept' ? 'driver_accepted' : 'driver_declined',
        title: `Driver ${response === 'accept' ? 'Accepted' : 'Declined'} Trip`,
        message: `${driver.name} has ${response}ed trip ${booking.bookingId}. ${message || ''}`,
        bookingId: booking.id,
        driverId: driverId,
        adminId: admin.id
      });
    }
    
    // Fetch updated booking with user details
    const updatedBooking = await CabBooking.findByPk(bookingId, {
      include: [{
        model: User,
        attributes: ['name', 'email']
      }]
    });
    
    // Emit real-time update to admin dashboard
    emitToAdmins('booking_updated', {
      type: 'driver_response',
      action: response,
      booking: updatedBooking,
      driver: {
        id: driver.id,
        name: driver.name
      },
      message: `${driver.name} has ${response}ed trip ${booking.bookingId}`,
      timestamp: new Date().toISOString()
    });
    
    // Emit to the specific user who made the booking
    emitToUser(booking.userId, 'booking_status_updated', {
      booking: updatedBooking,
      status: newStatus,
      message: `Your trip has been ${response}ed by ${driver.name}`,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      message: `Trip ${response}ed successfully`,
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Driver response error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Start ride endpoint
app.put('/api/bookings/:bookingId/start-ride', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const driverId = req.user.userId;
    
    console.log('Starting ride:', { bookingId, driverId });
    
    const booking = await CabBooking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check if this driver is assigned to this booking
    if (booking.driverId !== driverId) {
      return res.status(403).json({ error: 'You are not assigned to this booking' });
    }
    
    // Check if booking is in accepted status
    if (booking.status !== 'driver_accepted') {
      console.log('Start ride failed - booking status:', booking.status, 'expected: driver_accepted');
      return res.status(400).json({ 
        error: `Booking must be accepted before starting ride. Current status: ${booking.status}` 
      });
    }
    
    // Update booking status to in_progress
    await booking.update({
      status: 'in_progress',
      startedAt: new Date()
    });
    
    // Create notification for admin
    const driver = await User.findByPk(driverId);
    const adminUsers = await User.findAll({ where: { role: 'company_admin' } });
    
    for (const admin of adminUsers) {
      await Notification.create({
        type: 'ride_started',
        title: 'Ride Started',
        message: `${driver.name} has started trip ${booking.bookingId}`,
        bookingId: booking.id,
        driverId: driverId,
        adminId: admin.id
      });
    }
    
    // Fetch updated booking with user details
    const updatedBooking = await CabBooking.findByPk(bookingId, {
      include: [{
        model: User,
        attributes: ['name', 'email', 'phone']
      }]
    });
    
    // Emit real-time update to admin dashboard
    emitToAdmins('booking_updated', {
      type: 'ride_started',
      action: 'start',
      booking: updatedBooking,
      driver: {
        id: driver.id,
        name: driver.name
      },
      message: `${driver.name} has started trip ${booking.bookingId}`,
      timestamp: new Date().toISOString()
    });
    
    // Emit to the specific user who made the booking
    emitToUser(booking.userId, 'booking_status_updated', {
      booking: updatedBooking,
      status: 'in_progress',
      message: `Your ride has started! Driver: ${driver.name}`,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      message: 'Ride started successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Start ride error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Complete ride endpoint
app.put('/api/bookings/:bookingId/complete-ride', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const driverId = req.user.userId;
    
    console.log('Completing ride:', { bookingId, driverId });
    
    const booking = await CabBooking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check if this driver is assigned to this booking
    if (booking.driverId !== driverId) {
      return res.status(403).json({ error: 'You are not assigned to this booking' });
    }
    
    // Check if booking is in progress
    if (booking.status !== 'in_progress') {
      return res.status(400).json({ error: 'Booking must be in progress to complete ride' });
    }
    
    // Update booking status to completed
    await booking.update({
      status: 'completed',
      completedAt: new Date()
    });
    
    // Create notification for admin
    const driver = await User.findByPk(driverId);
    const adminUsers = await User.findAll({ where: { role: 'company_admin' } });
    
    for (const admin of adminUsers) {
      await Notification.create({
        type: 'ride_completed',
        title: 'Ride Completed',
        message: `${driver.name} has completed trip ${booking.bookingId}`,
        bookingId: booking.id,
        driverId: driverId,
        adminId: admin.id
      });
    }
    
    // Fetch updated booking with user details
    const updatedBooking = await CabBooking.findByPk(bookingId, {
      include: [{
        model: User,
        attributes: ['name', 'email', 'phone']
      }]
    });
    
    // Emit real-time update to admin dashboard
    emitToAdmins('booking_updated', {
      type: 'ride_completed',
      action: 'complete',
      booking: updatedBooking,
      driver: {
        id: driver.id,
        name: driver.name
      },
      message: `${driver.name} has completed trip ${booking.bookingId}`,
      timestamp: new Date().toISOString()
    });
    
    // Emit to the specific user who made the booking
    emitToUser(booking.userId, 'booking_status_updated', {
      booking: updatedBooking,
      status: 'completed',
      message: `Your ride has been completed! Thank you for using SmartRoute.`,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      message: 'Ride completed successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Complete ride error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get driver-assigned bookings for specific driver
app.get('/api/bookings/driver/:driverId', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    
    // Check if requesting user is the driver or an admin
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
    console.error('Get driver bookings error:', error);
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
    console.error('Get notifications error:', error);
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
    console.error('Mark notification read error:', error);
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
    console.error('Get users error:', error);
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
    console.error('Get drivers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Driver Management Routes
app.use('/api/driver-management', driverManagementRouter);

// Vehicle Routes (create with models)
const vehiclesRouter = createVehiclesRouter({ Vehicle, User, DriverProfile });
app.use('/api/vehicles', vehiclesRouter);

// Employee Profile Routes
// Get employee profile
app.get('/api/employee-profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if requesting user is the employee or an admin
    if (req.user.userId !== userId) {
      const user = await User.findByPk(req.user.userId);
      if (user.role !== 'company_admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const profile = await EmployeeProfile.findOne({
      where: { userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role']
      }]
    });

    if (!profile) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    res.json(profile);
  } catch (error) {
    apiLogger.error('Error fetching employee profile', { 
      requestId: req.id, 
      error: error.message, 
      userId: req.params.userId 
    });
    res.status(500).json({ error: error.message });
  }
});

// Get current user's employee profile
app.get('/api/employee-profile', authenticateToken, async (req, res) => {
  try {
    const profile = await EmployeeProfile.findOne({
      where: { userId: req.user.userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role']
      }]
    });

    if (!profile) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    res.json(profile);
  } catch (error) {
    apiLogger.error('Error fetching current employee profile', { 
      requestId: req.id, 
      error: error.message, 
      userId: req.user.userId 
    });
    res.status(500).json({ error: error.message });
  }
});

// Create employee profile
app.post('/api/employee-profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    
    const {
      employeeId,
      firstName,
      lastName,
      phone,
      alternatePhone,
      department,
      designation,
      manager,
      joinDate,
      homeAddress,
      homeCity,
      homeState,
      homePostalCode,
      homeCountry,
      homeLandmark,
      officeAddress,
      officeCity,
      officeState,
      officePostalCode,
      officeCountry,
      officeLandmark,
      officeFloor,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      preferredPickupTime,
      preferredDropTime,
      specialRequests
    } = req.body;

    // Check if profile already exists
    const existingProfile = await EmployeeProfile.findOne({
      where: { userId: req.user.userId }
    });

    if (existingProfile) {
      return res.status(400).json({ error: 'Employee profile already exists' });
    }

    const profile = await EmployeeProfile.create({
      userId: req.user.userId,
      employeeId,
      firstName,
      lastName,
      email: user.email,
      phone,
      alternatePhone,
      department,
      designation,
      manager,
      joinDate,
      homeAddress,
      homeCity,
      homeState,
      homePostalCode,
      homeCountry: homeCountry || 'India',
      homeLandmark,
      officeAddress,
      officeCity,
      officeState,
      officePostalCode,
      officeCountry: officeCountry || 'India',
      officeLandmark,
      officeFloor,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      preferredPickupTime,
      preferredDropTime,
      specialRequests: specialRequests || { ac: true, wheelchairAccessible: false, notes: '' },
      profileCompleted: true,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });

    apiLogger.info('Employee profile created', { 
      requestId: req.id, 
      profileId: profile.id, 
      userId: req.user.userId 
    });

    res.status(201).json(profile);
  } catch (error) {
    apiLogger.error('Error creating employee profile', { 
      requestId: req.id, 
      error: error.message, 
      userId: req.user.userId 
    });
    res.status(500).json({ error: error.message });
  }
});

// Update employee profile
app.put('/api/employee-profile', authenticateToken, async (req, res) => {
  try {
    const profile = await EmployeeProfile.findOne({
      where: { userId: req.user.userId }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user.userId,
      profileCompleted: true
    };

    // Remove userId from update data to prevent changes
    delete updateData.userId;
    delete updateData.createdBy;

    await profile.update(updateData);

    apiLogger.info('Employee profile updated', { 
      requestId: req.id, 
      profileId: profile.id, 
      userId: req.user.userId 
    });

    res.json(profile);
  } catch (error) {
    apiLogger.error('Error updating employee profile', { 
      requestId: req.id, 
      error: error.message, 
      userId: req.user.userId 
    });
    res.status(500).json({ error: error.message });
  }
});

// Get employee addresses (for booking flow)
app.get('/api/employee-addresses', authenticateToken, async (req, res) => {
  try {
    const profile = await EmployeeProfile.findOne({
      where: { userId: req.user.userId },
      attributes: [
        'homeAddress', 'homeCity', 'homeState', 'homePostalCode', 'homeLandmark',
        'officeAddress', 'officeCity', 'officeState', 'officePostalCode', 'officeLandmark', 'officeFloor'
      ]
    });

    if (!profile) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const addresses = {
      home: {
        address: profile.homeAddress,
        city: profile.homeCity,
        state: profile.homeState,
        postalCode: profile.homePostalCode,
        landmark: profile.homeLandmark,
        fullAddress: [
          profile.homeAddress,
          profile.homeLandmark,
          profile.homeCity,
          profile.homeState,
          profile.homePostalCode
        ].filter(Boolean).join(', ')
      },
      office: {
        address: profile.officeAddress,
        city: profile.officeCity,
        state: profile.officeState,
        postalCode: profile.officePostalCode,
        landmark: profile.officeLandmark,
        floor: profile.officeFloor,
        fullAddress: [
          profile.officeAddress,
          profile.officeFloor ? `Floor: ${profile.officeFloor}` : null,
          profile.officeLandmark,
          profile.officeCity,
          profile.officeState,
          profile.officePostalCode
        ].filter(Boolean).join(', ')
      }
    };

    res.json(addresses);
  } catch (error) {
    apiLogger.error('Error fetching employee addresses', { 
      requestId: req.id, 
      error: error.message, 
      userId: req.user.userId 
    });
    res.status(500).json({ error: error.message });
  }
});

// Static file serving for uploaded documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test WebSocket endpoint (for testing real-time updates)
app.post('/api/test-websocket', async (req, res) => {
  try {
    // Emit a test booking update to admin dashboard
    emitToAdmins('booking_updated', {
      type: 'booking_created',
      action: 'create',
      booking: {
        id: 'test-' + Date.now(),
        bookingId: 'TEST-' + Date.now().toString().slice(-6),
        userId: 'test-user',
        tripType: 'home_to_office',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        pickupAddress: 'Test Pickup Location',
        destinationAddress: 'Test Destination',
        status: 'driver_assigned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        User: {
          name: 'Test User',
          email: 'test@example.com'
        }
      },
      driver: null,
      message: 'Test booking created successfully',
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Test WebSocket event emitted to admin dashboard',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test WebSocket endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Vehicles endpoint is now handled by the vehicles router
// Commented out mock endpoint - using real vehicles router instead
/*
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
      },
      {
        id: '2',
        cabNumber: 'UP16 CD 5678',
        model: 'Hyundai i20',
        driver: 'Suresh Singh',
        status: 'En Route',
        location: 'Sector 62, Noida',
        seatingCapacity: 4,
        features: { ac: true, gps: true }
      }
    ]
  });
});
*/

// WebSocket Authentication Middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    // Allow connection without token for testing
    if (!token) {
      console.log('⚠️ WebSocket connection without token - using test user');
      socket.userId = 'test-user';
      socket.userRole = 'company_admin';
      socket.userName = 'Test Admin';
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user.id;
    socket.userRole = user.role;
    socket.userName = user.name;
    
    next();
  } catch (error) {
    console.log('⚠️ Invalid token, using test user:', error.message);
    socket.userId = 'test-user';
    socket.userRole = 'company_admin';
    socket.userName = 'Test Admin';
    next();
  }
};

// WebSocket Connection Handler
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.userName} (${socket.userRole}) - Socket ID: ${socket.id}`);
  
  // Join role-based rooms
  socket.join(socket.userRole);
  if (socket.userRole === 'company_admin') {
    socket.join('admin');
  }
  
  // Join user-specific room
  socket.join(`user_${socket.userId}`);
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.userName} - Socket ID: ${socket.id}`);
  });
  
  // Handle admin-specific events
  if (socket.userRole === 'company_admin') {
    socket.on('join_admin_room', () => {
      socket.join('admin_dashboard');
      console.log(`📊 Admin joined dashboard room: ${socket.userName}`);
    });
  }
});

// Helper function to emit to admin users
const emitToAdmins = (event, data) => {
  io.to('admin').emit(event, data);
  io.to('admin_dashboard').emit(event, data);
  console.log(`📡 Emitted ${event} to admin users:`, data);
};

// Helper function to emit to specific user
const emitToUser = (userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
  console.log(`📡 Emitted ${event} to user ${userId}:`, data);
};

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔗 Connecting to PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully');
    
    console.log('🔄 Synchronizing database...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
    
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
    
    // Create demo users if they don't exist
    const demoUsers = [
      { 
        email: 'priya@techcorp.com', 
        password: 'emp123', 
        name: 'Priya Singh', 
        role: 'employee', 
        department: 'Engineering', 
        employeeId: 'EMP001' 
      },
      { 
        email: 'rajesh@smartroute.com', 
        password: 'driver123', 
        name: 'Rajesh Kumar', 
        role: 'driver', 
        phone: '+91-9876543210' 
      },
      { 
        email: 'admin@techcorp.com', 
        password: 'admin123', 
        name: 'Admin User', 
        role: 'company_admin', 
        department: 'HR' 
      }
    ];
    
    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ where: { email: userData.email } });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, parseInt(process.env.BCRYPT_ROUNDS));
        await User.create({ ...userData, password: hashedPassword });
        console.log(`✅ Created demo user: ${userData.email}`);
      }
    }

// Smart allocation endpoints
const allocationEngine = new SmartAllocationEngine();

app.post('/api/fleet/smart-allocate', actionLogger('smart_allocate'), async (req, res) => {
  try {
    const { bookingIds } = req.body;
    
    // Fetch bookings, drivers, and vehicles
    const bookings = await CabBooking.findAll({
      where: {
        id: bookingIds || undefined,
        status: 'pending'
      }
    });

    // Mock drivers and vehicles data (in real app, fetch from database)
    const mockDrivers = Array.from({ length: 10 }, (_, i) => ({
      id: `driver-${i + 1}`,
      name: `Driver ${i + 1}`,
      efficiency: 70 + Math.random() * 30,
      rating: 3.5 + Math.random() * 1.5,
      totalRides: 50 + Math.floor(Math.random() * 500),
      currentLocation: ['Tech Park', 'Koramangala', 'Whitefield'][Math.floor(Math.random() * 3)]
    }));

    const mockVehicles = Array.from({ length: 8 }, (_, i) => ({
      id: `vehicle-${i + 1}`,
      plateNumber: `KA${String(Math.floor(Math.random() * 10)).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      capacity: [2, 4, 6][Math.floor(Math.random() * 3)],
      fuelLevel: 20 + Math.random() * 80
    }));

    bookingLogger.info('Smart allocation request', {
      requestId: req.id,
      bookingCount: bookings.length,
      driverCount: mockDrivers.length,
      vehicleCount: mockVehicles.length
    });

    if (bookings.length === 0) {
      return res.json({ 
        success: false, 
        message: 'No pending bookings found',
        allocations: []
      });
    }

    // Perform bulk allocation
    const result = await allocationEngine.bulkAllocate(
      bookings.map(b => ({
        id: b.id,
        pickupLocation: b.pickupLocation || 'Unknown',
        dropoffLocation: b.dropoffLocation || 'Unknown',
        requestedTime: b.pickupTime,
        priority: b.priority || 'medium',
        department: b.department || 'General'
      })),
      mockDrivers,
      mockVehicles
    );

    // Generate optimization suggestions
    const suggestions = allocationEngine.generateOptimizationSuggestions(
      bookings,
      mockDrivers,
      mockVehicles
    );

    res.json({
      success: true,
      allocations: result.results,
      summary: result.summary,
      suggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    bookingLogger.error('Smart allocation error', {
      requestId: req.id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Smart allocation failed' });
  }
});

app.get('/api/fleet/optimization-suggestions', actionLogger('get_optimization_suggestions'), async (req, res) => {
  try {
    // Fetch recent bookings for analysis
    const recentBookings = await CabBooking.findAll({
      limit: 100,
      order: [['createdAt', 'DESC']]
    });

    // Mock data for analysis
    const mockDrivers = Array.from({ length: 10 }, (_, i) => ({
      id: `driver-${i + 1}`,
      status: Math.random() > 0.3 ? 'available' : 'busy'
    }));

    const mockVehicles = Array.from({ length: 8 }, (_, i) => ({
      id: `vehicle-${i + 1}`,
      status: Math.random() > 0.4 ? 'available' : 'in_use'
    }));

    const suggestions = allocationEngine.generateOptimizationSuggestions(
      recentBookings,
      mockDrivers,
      mockVehicles
    );

    res.json({
      success: true,
      suggestions,
      analysisDate: new Date().toISOString()
    });

  } catch (error) {
    apiLogger.error('Optimization suggestions error', {
      requestId: req.id,
      error: error.message
    });
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Client logging endpoint
app.post('/api/logs/client', (req, res) => {
  try {
    const { logs } = req.body;
    
    if (Array.isArray(logs)) {
      logs.forEach(log => {
        const clientLogger = require('./logger').logger;
        const logLevel = log.level || 'info';
        
        clientLogger[logLevel](`CLIENT: ${log.message}`, {
          requestId: req.id,
          clientTimestamp: log.timestamp,
          sessionId: log.sessionId,
          url: log.url,
          userId: log.userId,
          userAgent: log.userAgent,
          data: log.data,
          stack: log.stack
        });
      });
    }
    
    res.json({ success: true, received: logs?.length || 0 });
  } catch (error) {
    apiLogger.error('Client logging error', { 
      requestId: req.id, 
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to process client logs' });
  }
});
    
    // Error logging middleware (should be last)
    app.use(errorLogger);
    
    server.listen(PORT, '0.0.0.0', () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV,
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
      
      console.log(`🚀 SmartRoute API running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗃️ Database: PostgreSQL`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔐 Demo credentials:`);
      console.log(`   Employee: priya@techcorp.com / emp123`);
      console.log(`   Driver: rajesh@smartroute.com / driver123`);
      console.log(`   Admin: admin@techcorp.com / admin123`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

startServer();