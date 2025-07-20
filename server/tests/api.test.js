const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app, sequelize, User, CabBooking } = require('./helpers/testApp');

describe('API Endpoints', () => {
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

  describe('Health Check', () => {
    test('GET /api/health should return OK status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.database).toBe('PostgreSQL');
      expect(response.body.message).toBe('SmartRoute Test API Running');
    });
  });

  describe('Authentication', () => {
    describe('POST /api/auth/register', () => {
      test('should register a new user successfully', async () => {
        const userData = {
          email: 'newuser@test.com',
          password: 'password123',
          name: 'New User',
          role: 'employee'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.message).toBe('User created successfully');
        expect(response.body.token).toBeDefined();
        expect(response.body.user.email).toBe('newuser@test.com');
        expect(response.body.user.name).toBe('New User');
        expect(response.body.user.role).toBe('employee');
      });

      test('should not register user with duplicate email', async () => {
        const userData = {
          email: 'duplicate@test.com',
          password: 'password123',
          name: 'First User',
          role: 'employee'
        };

        // Create first user
        await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        // Try to create second user with same email
        const duplicateUserData = {
          email: 'duplicate@test.com',
          password: 'password456',
          name: 'Second User',
          role: 'driver'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(duplicateUserData)
          .expect(400);

        expect(response.body.error).toBe('User already exists');
      });

      test('should set default role to employee if not provided', async () => {
        const userData = {
          email: 'defaultrole@test.com',
          password: 'password123',
          name: 'Default Role User'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.user.role).toBe('employee');
      });
    });

    describe('POST /api/auth/login', () => {
      let testUser;

      beforeEach(async () => {
        const hashedPassword = await bcrypt.hash('testpassword', 4);
        testUser = await User.create({
          email: 'login@test.com',
          password: hashedPassword,
          name: 'Login Test User',
          role: 'employee'
        });
      });

      test('should login successfully with correct credentials', async () => {
        const loginData = {
          email: 'login@test.com',
          password: 'testpassword'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body.message).toBe('Login successful');
        expect(response.body.token).toBeDefined();
        expect(response.body.user.email).toBe('login@test.com');
        expect(response.body.user.name).toBe('Login Test User');
        expect(response.body.user.firstName).toBe('Login');
        expect(response.body.user.lastName).toBe('Test');
      });

      test('should not login with incorrect password', async () => {
        const loginData = {
          email: 'login@test.com',
          password: 'wrongpassword'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        expect(response.body.error).toBe('Invalid credentials');
      });

      test('should not login with non-existent email', async () => {
        const loginData = {
          email: 'nonexistent@test.com',
          password: 'testpassword'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        expect(response.body.error).toBe('Invalid credentials');
      });
    });
  });

  describe('Users', () => {
    beforeEach(async () => {
      // Create test users
      const hashedPassword = await bcrypt.hash('password123', 4);
      await User.bulkCreate([
        {
          email: 'employee1@test.com',
          password: hashedPassword,
          name: 'Employee One',
          role: 'employee'
        },
        {
          email: 'driver1@test.com',
          password: hashedPassword,
          name: 'Driver One',
          role: 'driver'
        },
        {
          email: 'admin1@test.com',
          password: hashedPassword,
          name: 'Admin One',
          role: 'company_admin'
        }
      ]);
    });

    test('GET /api/users should return all users without passwords', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.users).toHaveLength(3);
      expect(response.body.users[0].password).toBeUndefined();
      expect(response.body.users[0].email).toBeDefined();
      expect(response.body.users[0].name).toBeDefined();
      expect(response.body.users[0].role).toBeDefined();
    });

    test('GET /api/drivers should return only driver users', async () => {
      const response = await request(app)
        .get('/api/drivers')
        .expect(200);

      expect(response.body.drivers).toHaveLength(1);
      expect(response.body.drivers[0].role).toBe('driver');
      expect(response.body.drivers[0].name).toBe('Driver One');
      expect(response.body.drivers[0].password).toBeUndefined();
    });
  });

  describe('Vehicles', () => {
    test('GET /api/vehicles should return vehicle data', async () => {
      const response = await request(app)
        .get('/api/vehicles')
        .expect(200);

      expect(response.body.vehicles).toBeDefined();
      expect(Array.isArray(response.body.vehicles)).toBe(true);
      expect(response.body.vehicles.length).toBeGreaterThan(0);
      expect(response.body.vehicles[0]).toHaveProperty('id');
      expect(response.body.vehicles[0]).toHaveProperty('cabNumber');
      expect(response.body.vehicles[0]).toHaveProperty('model');
      expect(response.body.vehicles[0]).toHaveProperty('driver');
    });
  });
});