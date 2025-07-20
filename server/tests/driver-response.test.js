const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app, sequelize, User, CabBooking, Notification } = require('./helpers/testApp');

describe('Driver Response System', () => {
  let testUser, testDriver, testAdmin, adminToken, driverToken;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
    await CabBooking.destroy({ where: {} });
    await Notification.destroy({ where: {} });

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 4);
    
    testUser = await User.create({
      email: 'user@driver-response.test',
      password: hashedPassword,
      name: 'Test User',
      role: 'employee'
    });

    testDriver = await User.create({
      email: 'driver@driver-response.test',
      password: hashedPassword,
      name: 'Test Driver',
      role: 'driver'
    });

    testAdmin = await User.create({
      email: 'admin@driver-response.test',
      password: hashedPassword,
      name: 'Test Admin',
      role: 'company_admin'
    });

    // Get authentication tokens
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@driver-response.test',
        password: 'password123'
      });
    adminToken = adminLoginResponse.body.token;

    const driverLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'driver@driver-response.test',
        password: 'password123'
      });
    driverToken = driverLoginResponse.body.token;
  });

  describe('Driver Assignment and Response Flow', () => {
    let testBooking;

    beforeEach(async () => {
      // Create a test booking
      testBooking = await CabBooking.create({
        bookingId: 'SR10000001',
        userId: testUser.id,
        tripType: 'home_to_office',
        date: '2024-12-25',
        time: '09:00:00',
        pickupAddress: 'Test Home Address',
        destinationAddress: 'Test Office Address',
        status: 'confirmed'
      });
    });

    test('should assign driver to booking successfully', async () => {
      const assignmentData = {
        driverId: testDriver.id,
        driverName: 'Test Driver',
        driverPhone: '+91-9876543210',
        cabNumber: 'UP14 AB 1234',
        cabModel: 'Maruti Swift'
      };

      const response = await request(app)
        .put(`/api/bookings/${testBooking.id}/assign-driver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData)
        .expect(200);

      expect(response.body.message).toBe('Driver assigned successfully');
      expect(response.body.booking.status).toBe('driver_assigned');
      expect(response.body.booking.driverId).toBe(testDriver.id);
      expect(response.body.booking.driverName).toBe('Test Driver');
      expect(response.body.booking.assignedAt).toBeDefined();
    });

    test('should allow driver to accept assignment', async () => {
      // First assign driver
      await request(app)
        .put(`/api/bookings/${testBooking.id}/assign-driver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          driverId: testDriver.id,
          driverName: 'Test Driver',
          driverPhone: '+91-9876543210',
          cabNumber: 'UP14 AB 1234',
          cabModel: 'Maruti Swift'
        });

      // Driver accepts the booking
      const acceptanceData = {
        response: 'accept',
        message: 'I will be there on time!'
      };

      const response = await request(app)
        .put(`/api/bookings/${testBooking.id}/driver-response`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send(acceptanceData)
        .expect(200);

      expect(response.body.message).toBe('Trip accepted successfully');
      expect(response.body.booking.status).toBe('driver_accepted');
      expect(response.body.booking.driverResponse).toBe('I will be there on time!');
      expect(response.body.booking.driverResponseAt).toBeDefined();
    });

    test('should allow driver to decline assignment', async () => {
      // First assign driver
      await request(app)
        .put(`/api/bookings/${testBooking.id}/assign-driver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          driverId: testDriver.id,
          driverName: 'Test Driver',
          driverPhone: '+91-9876543210',
          cabNumber: 'UP14 AB 1234',
          cabModel: 'Maruti Swift'
        });

      // Driver declines the booking
      const declineData = {
        response: 'decline',
        message: 'Vehicle breakdown - unable to complete trip'
      };

      const response = await request(app)
        .put(`/api/bookings/${testBooking.id}/driver-response`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send(declineData)
        .expect(200);

      expect(response.body.message).toBe('Trip declined successfully');
      expect(response.body.booking.status).toBe('driver_declined');
      expect(response.body.booking.driverResponse).toBe('Vehicle breakdown - unable to complete trip');
      expect(response.body.booking.driverResponseAt).toBeDefined();
    });

    test('should create notification when driver accepts', async () => {
      // Assign driver and accept
      await request(app)
        .put(`/api/bookings/${testBooking.id}/assign-driver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          driverId: testDriver.id,
          driverName: 'Test Driver',
          driverPhone: '+91-9876543210',
          cabNumber: 'UP14 AB 1234',
          cabModel: 'Maruti Swift'
        });

      await request(app)
        .put(`/api/bookings/${testBooking.id}/driver-response`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          response: 'accept',
          message: 'Ready to go!'
        });

      // Check notifications for admin
      const notificationsResponse = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const notifications = notificationsResponse.body;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('driver_accepted');
      expect(notifications[0].title).toBe('Driver Accepted Trip');
      expect(notifications[0].message).toContain('Test Driver has accepted trip');
      expect(notifications[0].isRead).toBe(false);
    });

    test('should create notification when driver declines', async () => {
      // Assign driver and decline
      await request(app)
        .put(`/api/bookings/${testBooking.id}/assign-driver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          driverId: testDriver.id,
          driverName: 'Test Driver',
          driverPhone: '+91-9876543210',
          cabNumber: 'UP14 AB 1234',
          cabModel: 'Maruti Swift'
        });

      await request(app)
        .put(`/api/bookings/${testBooking.id}/driver-response`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          response: 'decline',
          message: 'Emergency situation'
        });

      // Check notifications for admin
      const notificationsResponse = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const notifications = notificationsResponse.body;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('driver_declined');
      expect(notifications[0].title).toBe('Driver Declined Trip');
      expect(notifications[0].message).toContain('Test Driver has declined trip');
    });
  });

  describe('Driver Response Validation', () => {
    let assignedBooking;

    beforeEach(async () => {
      // Create and assign a booking
      assignedBooking = await CabBooking.create({
        bookingId: 'SR10000002',
        userId: testUser.id,
        driverId: testDriver.id,
        tripType: 'office_to_home',
        date: '2024-12-25',
        time: '18:00:00',
        pickupAddress: 'Test Office',
        destinationAddress: 'Test Home',
        status: 'driver_assigned',
        driverName: 'Test Driver',
        assignedAt: new Date()
      });
    });

    test('should require valid response type', async () => {
      const invalidResponse = {
        response: 'maybe',
        message: 'Not sure'
      };

      const response = await request(app)
        .put(`/api/bookings/${assignedBooking.id}/driver-response`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send(invalidResponse)
        .expect(400);

      expect(response.body.error).toBe('Valid response (accept/decline) is required');
    });

    test('should not allow response from unassigned driver', async () => {
      // Create another driver
      const hashedPassword = await bcrypt.hash('password123', 4);
      const anotherDriver = await User.create({
        email: 'another@driver.test',
        password: hashedPassword,
        name: 'Another Driver',
        role: 'driver'
      });

      const anotherDriverLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'another@driver.test',
          password: 'password123'
        });

      const response = await request(app)
        .put(`/api/bookings/${assignedBooking.id}/driver-response`)
        .set('Authorization', `Bearer ${anotherDriverLogin.body.token}`)
        .send({
          response: 'accept',
          message: 'I want this trip'
        })
        .expect(403);

      expect(response.body.error).toBe('You are not assigned to this booking');
    });

    test('should not allow duplicate responses', async () => {
      // First response
      await request(app)
        .put(`/api/bookings/${assignedBooking.id}/driver-response`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          response: 'accept',
          message: 'First response'
        });

      // Second response should fail
      const response = await request(app)
        .put(`/api/bookings/${assignedBooking.id}/driver-response`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          response: 'decline',
          message: 'Changed my mind'
        })
        .expect(400);

      expect(response.body.error).toBe('You have already responded to this booking');
    });
  });

  describe('Driver Bookings Endpoint', () => {
    beforeEach(async () => {
      // Create multiple bookings for the driver
      await CabBooking.bulkCreate([
        {
          bookingId: 'SR10000003',
          userId: testUser.id,
          driverId: testDriver.id,
          tripType: 'home_to_office',
          date: '2024-12-25',
          time: '09:00:00',
          pickupAddress: 'Home 1',
          destinationAddress: 'Office 1',
          status: 'driver_assigned',
          driverName: 'Test Driver'
        },
        {
          bookingId: 'SR10000004',
          userId: testUser.id,
          driverId: testDriver.id,
          tripType: 'office_to_home',
          date: '2024-12-25',
          time: '18:00:00',
          pickupAddress: 'Office 1',
          destinationAddress: 'Home 1',
          status: 'driver_accepted',
          driverName: 'Test Driver'
        }
      ]);
    });

    test('should get driver-specific bookings', async () => {
      const response = await request(app)
        .get(`/api/bookings/driver/${testDriver.id}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      const bookings = response.body;
      expect(bookings).toHaveLength(2);
      expect(bookings[0].driverId).toBe(testDriver.id);
      expect(bookings[1].driverId).toBe(testDriver.id);
    });

    test('should allow admin to view any driver bookings', async () => {
      const response = await request(app)
        .get(`/api/bookings/driver/${testDriver.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const bookings = response.body;
      expect(bookings).toHaveLength(2);
    });

    test('should not allow driver to view other driver bookings', async () => {
      // Create another driver
      const hashedPassword = await bcrypt.hash('password123', 4);
      const anotherDriver = await User.create({
        email: 'another2@driver.test',
        password: hashedPassword,
        name: 'Another Driver 2',
        role: 'driver'
      });

      const anotherDriverLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'another2@driver.test',
          password: 'password123'
        });

      const response = await request(app)
        .get(`/api/bookings/driver/${testDriver.id}`)
        .set('Authorization', `Bearer ${anotherDriverLogin.body.token}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('Notification Management', () => {
    test('should mark notification as read', async () => {
      // Create a notification
      const notification = await Notification.create({
        type: 'driver_declined',
        title: 'Test Notification',
        message: 'Test message',
        adminId: testAdmin.id,
        driverId: testDriver.id,
        isRead: false
      });

      const response = await request(app)
        .put(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Notification marked as read');

      // Verify notification is marked as read
      const updatedNotification = await Notification.findByPk(notification.id);
      expect(updatedNotification.isRead).toBe(true);
      expect(updatedNotification.readAt).toBeDefined();
    });

    test('should not allow non-admin to access notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('New Booking Status Integration', () => {
    test('should handle all new booking statuses', async () => {
      const newStatuses = ['driver_accepted', 'driver_declined'];

      for (let i = 0; i < newStatuses.length; i++) {
        await CabBooking.create({
          bookingId: `SR3000000${i + 1}`,
          userId: testUser.id,
          driverId: testDriver.id,
          tripType: 'home_to_office',
          date: '2024-12-25',
          time: '09:00:00',
          pickupAddress: 'Home',
          destinationAddress: 'Office',
          status: newStatuses[i],
          driverName: 'Test Driver'
        });
      }

      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const createdStatuses = response.body.map(b => b.status);
      newStatuses.forEach(status => {
        expect(createdStatuses).toContain(status);
      });
    });

    test('should include new fields in booking response', async () => {
      const booking = await CabBooking.create({
        bookingId: 'SR10000005',
        userId: testUser.id,
        driverId: testDriver.id,
        tripType: 'home_to_office',
        date: '2024-12-25',
        time: '09:00:00',
        pickupAddress: 'Home',
        destinationAddress: 'Office',
        status: 'driver_accepted',
        driverName: 'Test Driver',
        driverResponse: 'Ready to serve!',
        driverResponseAt: new Date(),
        assignedAt: new Date()
      });

      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const createdBooking = response.body.find(b => b.id === booking.id);
      expect(createdBooking.driverId).toBe(testDriver.id);
      expect(createdBooking.driverResponse).toBe('Ready to serve!');
      expect(createdBooking.driverResponseAt).toBeDefined();
      expect(createdBooking.assignedAt).toBeDefined();
    });
  });
});