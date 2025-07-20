const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app, sequelize, User, CabBooking } = require('./helpers/testApp');

describe('Booking System', () => {
  let testUser, testDriver, testAdmin;

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

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 4);
    testUser = await User.create({
      email: 'user@booking.test',
      password: hashedPassword,
      name: 'Test User',
      role: 'employee'
    });

    testDriver = await User.create({
      email: 'driver@booking.test',
      password: hashedPassword,
      name: 'Test Driver',
      role: 'driver'
    });

    testAdmin = await User.create({
      email: 'admin@booking.test',
      password: hashedPassword,
      name: 'Test Admin',
      role: 'company_admin'
    });
  });

  describe('POST /api/bookings', () => {
    test('should create a new booking successfully', async () => {
      const bookingData = {
        userId: testUser.id,
        tripType: 'home_to_office',
        date: '2024-12-25',
        time: '09:00:00',
        pickupAddress: '123 Home Street, Noida',
        destinationAddress: '456 Office Tower, Noida'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(response.body.message).toBe('Booking created successfully');
      expect(response.body.booking).toBeDefined();
      expect(response.body.booking.bookingId).toMatch(/^SR\d{8}$/);
      expect(response.body.booking.userId).toBe(testUser.id);
      expect(response.body.booking.status).toBe('confirmed');
      expect(response.body.booking.tripType).toBe('home_to_office');
    });

    test('should create booking with different trip types', async () => {
      const tripTypes = ['home_to_office', 'office_to_home', 'custom'];

      for (let i = 0; i < tripTypes.length; i++) {
        const bookingData = {
          userId: testUser.id,
          tripType: tripTypes[i],
          date: '2024-12-25',
          time: `0${9 + i}:00:00`,
          pickupAddress: `Pickup Address ${i + 1}`,
          destinationAddress: `Destination Address ${i + 1}`
        };

        const response = await request(app)
          .post('/api/bookings')
          .send(bookingData)
          .expect(201);

        expect(response.body.booking.tripType).toBe(tripTypes[i]);
      }
    });

    test('should generate unique booking IDs', async () => {
      const bookingData1 = {
        userId: testUser.id,
        tripType: 'home_to_office',
        date: '2024-12-25',
        time: '09:00:00',
        pickupAddress: 'Address 1',
        destinationAddress: 'Address 2'
      };

      const bookingData2 = {
        userId: testUser.id,
        tripType: 'office_to_home',
        date: '2024-12-25',
        time: '18:00:00',
        pickupAddress: 'Address 2',
        destinationAddress: 'Address 1'
      };

      const response1 = await request(app)
        .post('/api/bookings')
        .send(bookingData1)
        .expect(201);

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const response2 = await request(app)
        .post('/api/bookings')
        .send(bookingData2)
        .expect(201);

      expect(response1.body.booking.bookingId).not.toBe(response2.body.booking.bookingId);
      expect(response1.body.booking.bookingId).toMatch(/^SR\d{8}$/);
      expect(response2.body.booking.bookingId).toMatch(/^SR\d{8}$/);
    });

    test('should not create booking with missing required fields', async () => {
      const incompleteBookingData = {
        userId: testUser.id,
        tripType: 'home_to_office'
        // Missing: date, time, pickupAddress, destinationAddress
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(incompleteBookingData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should not create booking with invalid trip type', async () => {
      const invalidBookingData = {
        userId: testUser.id,
        tripType: 'invalid_trip_type',
        date: '2024-12-25',
        time: '09:00:00',
        pickupAddress: 'Pickup',
        destinationAddress: 'Destination'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(invalidBookingData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/bookings', () => {
    beforeEach(async () => {
      // Create test bookings
      await CabBooking.bulkCreate([
        {
          bookingId: 'SR10000001',
          userId: testUser.id,
          tripType: 'home_to_office',
          date: '2024-12-25',
          time: '09:00:00',
          pickupAddress: 'Home 1',
          destinationAddress: 'Office 1',
          status: 'confirmed'
        },
        {
          bookingId: 'SR10000002',
          userId: testUser.id,
          tripType: 'office_to_home',
          date: '2024-12-25',
          time: '18:00:00',
          pickupAddress: 'Office 1',
          destinationAddress: 'Home 1',
          status: 'pending'
        },
        {
          bookingId: 'SR10000003',
          userId: testDriver.id,
          tripType: 'custom',
          date: '2024-12-26',
          time: '12:00:00',
          pickupAddress: 'Custom Location A',
          destinationAddress: 'Custom Location B',
          status: 'driver_assigned'
        }
      ]);
    });

    test('should retrieve all bookings', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect(200);

      expect(response.body.bookings).toBeDefined();
      expect(response.body.bookings).toHaveLength(3);
      expect(response.body.bookings[0]).toHaveProperty('bookingId');
      expect(response.body.bookings[0]).toHaveProperty('tripType');
      expect(response.body.bookings[0]).toHaveProperty('status');
    });

    test('should return bookings with user information', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect(200);

      const booking = response.body.bookings.find(b => b.userId === testUser.id);
      expect(booking).toBeDefined();
      expect(booking.User).toBeDefined();
      expect(booking.User.name).toBe('Test User');
      expect(booking.User.email).toBe('user@booking.test');
    });

    test('should return bookings ordered by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect(200);

      const bookings = response.body.bookings;
      expect(bookings).toHaveLength(3);

      // Check that bookings are ordered by createdAt DESC
      for (let i = 0; i < bookings.length - 1; i++) {
        const currentDate = new Date(bookings[i].createdAt);
        const nextDate = new Date(bookings[i + 1].createdAt);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });
  });

  describe('Booking Status Management', () => {
    test('should set default status to confirmed for new bookings', async () => {
      const bookingData = {
        userId: testUser.id,
        tripType: 'home_to_office',
        date: '2024-12-25',
        time: '09:00:00',
        pickupAddress: 'Home',
        destinationAddress: 'Office'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(response.body.booking.status).toBe('confirmed');
    });

    test('should handle different booking statuses', async () => {
      const statuses = ['pending', 'confirmed', 'driver_assigned', 'in_progress', 'completed', 'cancelled'];

      for (let i = 0; i < statuses.length; i++) {
        await CabBooking.create({
          bookingId: `SR2000000${i + 1}`,
          userId: testUser.id,
          tripType: 'home_to_office',
          date: '2024-12-25',
          time: '09:00:00',
          pickupAddress: 'Home',
          destinationAddress: 'Office',
          status: statuses[i]
        });
      }

      const response = await request(app)
        .get('/api/bookings')
        .expect(200);

      const createdStatuses = response.body.bookings.map(b => b.status);
      statuses.forEach(status => {
        expect(createdStatuses).toContain(status);
      });
    });
  });

  describe('Booking Data Validation', () => {
    test('should validate date format', async () => {
      const bookingData = {
        userId: testUser.id,
        tripType: 'home_to_office',
        date: 'invalid-date',
        time: '09:00:00',
        pickupAddress: 'Home',
        destinationAddress: 'Office'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should validate time format', async () => {
      const bookingData = {
        userId: testUser.id,
        tripType: 'home_to_office',
        date: '2024-12-25',
        time: 'invalid-time',
        pickupAddress: 'Home',
        destinationAddress: 'Office'
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should require non-empty addresses', async () => {
      const bookingData = {
        userId: testUser.id,
        tripType: 'home_to_office',
        date: '2024-12-25',
        time: '09:00:00',
        pickupAddress: '',
        destinationAddress: ''
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Advanced Booking Features', () => {
    test('should store optional booking details', async () => {
      const bookingData = {
        userId: testUser.id,
        tripType: 'home_to_office',
        date: '2024-12-25',
        time: '09:00:00',
        pickupAddress: 'Home',
        destinationAddress: 'Office',
        driverName: 'John Driver',
        driverPhone: '+91-9876543210',
        cabNumber: 'UP14 AB 1234',
        cabModel: 'Maruti Swift',
        fare: 150.75
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      const booking = response.body.booking;
      expect(booking.driverName).toBe('John Driver');
      expect(booking.driverPhone).toBe('+91-9876543210');
      expect(booking.cabNumber).toBe('UP14 AB 1234');
      expect(booking.cabModel).toBe('Maruti Swift');
      expect(parseFloat(booking.fare)).toBe(150.75);
    });
  });
});