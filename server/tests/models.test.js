const bcrypt = require('bcryptjs');
const { sequelize, User, CabBooking } = require('./helpers/testApp');

describe('Database Models', () => {
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
  });

  describe('User Model', () => {
    test('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 4),
        name: 'Test User',
        role: 'employee'
      };

      const user = await User.create(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.role).toBe('employee');
      expect(user.createdAt).toBeDefined();
    });

    test('should not create user with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: await bcrypt.hash('password123', 4),
        name: 'User One',
        role: 'employee'
      };

      await User.create(userData);

      const duplicateUserData = {
        email: 'duplicate@example.com',
        password: await bcrypt.hash('password456', 4),
        name: 'User Two',
        role: 'driver'
      };

      await expect(User.create(duplicateUserData)).rejects.toThrow();
    });

    test('should create users with different roles', async () => {
      const employeeData = {
        email: 'employee@test.com',
        password: await bcrypt.hash('password123', 4),
        name: 'Employee User',
        role: 'employee'
      };

      const driverData = {
        email: 'driver@test.com',
        password: await bcrypt.hash('password123', 4),
        name: 'Driver User',
        role: 'driver'
      };

      const adminData = {
        email: 'admin@test.com',
        password: await bcrypt.hash('password123', 4),
        name: 'Admin User',
        role: 'company_admin'
      };

      const employee = await User.create(employeeData);
      const driver = await User.create(driverData);
      const admin = await User.create(adminData);

      expect(employee.role).toBe('employee');
      expect(driver.role).toBe('driver');
      expect(admin.role).toBe('company_admin');
    });

    test('should set default role to employee', async () => {
      const userData = {
        email: 'default@test.com',
        password: await bcrypt.hash('password123', 4),
        name: 'Default User'
      };

      const user = await User.create(userData);
      expect(user.role).toBe('employee');
    });
  });

  describe('CabBooking Model', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'booking@test.com',
        password: await bcrypt.hash('password123', 4),
        name: 'Booking User',
        role: 'employee'
      });
    });

    test('should create a booking with valid data', async () => {
      const bookingData = {
        bookingId: 'SR12345678',
        userId: testUser.id,
        tripType: 'home_to_office',
        date: '2024-12-25',
        time: '09:00:00',
        pickupAddress: '123 Home Street',
        destinationAddress: '456 Office Avenue',
        status: 'confirmed'
      };

      const booking = await CabBooking.create(bookingData);

      expect(booking.id).toBeDefined();
      expect(booking.bookingId).toBe('SR12345678');
      expect(booking.userId).toBe(testUser.id);
      expect(booking.tripType).toBe('home_to_office');
      expect(booking.status).toBe('confirmed');
    });

    test('should set default status to pending', async () => {
      const bookingData = {
        bookingId: 'SR87654321',
        userId: testUser.id,
        tripType: 'office_to_home',
        date: '2024-12-25',
        time: '18:00:00',
        pickupAddress: '456 Office Avenue',
        destinationAddress: '123 Home Street'
      };

      const booking = await CabBooking.create(bookingData);
      expect(booking.status).toBe('pending');
    });

    test('should create booking with different trip types', async () => {
      const homeToOffice = await CabBooking.create({
        bookingId: 'SR11111111',
        userId: testUser.id,
        tripType: 'home_to_office',
        date: '2024-12-25',
        time: '09:00:00',
        pickupAddress: 'Home',
        destinationAddress: 'Office'
      });

      const officeToHome = await CabBooking.create({
        bookingId: 'SR22222222',
        userId: testUser.id,
        tripType: 'office_to_home',
        date: '2024-12-25',
        time: '18:00:00',
        pickupAddress: 'Office',
        destinationAddress: 'Home'
      });

      const custom = await CabBooking.create({
        bookingId: 'SR33333333',
        userId: testUser.id,
        tripType: 'custom',
        date: '2024-12-25',
        time: '12:00:00',
        pickupAddress: 'Mall',
        destinationAddress: 'Restaurant'
      });

      expect(homeToOffice.tripType).toBe('home_to_office');
      expect(officeToHome.tripType).toBe('office_to_home');
      expect(custom.tripType).toBe('custom');
    });

    test('should not create booking without required fields', async () => {
      const invalidBookingData = {
        bookingId: 'SR99999999',
        userId: testUser.id,
        tripType: 'home_to_office'
        // Missing required fields: date, time, pickupAddress, destinationAddress
      };

      await expect(CabBooking.create(invalidBookingData)).rejects.toThrow();
    });
  });

  describe('Model Associations', () => {
    test('should establish User-CabBooking relationship', async () => {
      const user = await User.create({
        email: 'association@test.com',
        password: await bcrypt.hash('password123', 4),
        name: 'Association User',
        role: 'employee'
      });

      const booking = await CabBooking.create({
        bookingId: 'SR55555555',
        userId: user.id,
        tripType: 'home_to_office',
        date: '2024-12-25',
        time: '09:00:00',
        pickupAddress: 'Home',
        destinationAddress: 'Office'
      });

      const userWithBookings = await User.findByPk(user.id, {
        include: [CabBooking]
      });

      const bookingWithUser = await CabBooking.findByPk(booking.id, {
        include: [User]
      });

      expect(userWithBookings.CabBookings).toHaveLength(1);
      expect(userWithBookings.CabBookings[0].bookingId).toBe('SR55555555');
      expect(bookingWithUser.User.email).toBe('association@test.com');
    });
  });
});