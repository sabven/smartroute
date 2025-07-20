const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { app, sequelize, User } = require('./helpers/testApp');

describe('Authentication & Authorization', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {} });
  });

  describe('JWT Token Generation', () => {
    test('should generate valid JWT token on registration', async () => {
      const userData = {
        email: 'jwt@test.com',
        password: 'password123',
        name: 'JWT User',
        role: 'employee'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = response.body.token;
      expect(token).toBeDefined();

      // Verify token is valid
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    test('should generate valid JWT token on login', async () => {
      // Create user first
      const hashedPassword = await bcrypt.hash('loginpassword', 4);
      const user = await User.create({
        email: 'jwtlogin@test.com',
        password: hashedPassword,
        name: 'JWT Login User',
        role: 'employee'
      });

      const loginData = {
        email: 'jwtlogin@test.com',
        password: 'loginpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      const token = response.body.token;
      expect(token).toBeDefined();

      // Verify token contains correct user ID
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(user.id);
    });
  });

  describe('Password Security', () => {
    test('should hash passwords during registration', async () => {
      const userData = {
        email: 'hash@test.com',
        password: 'plainpassword',
        name: 'Hash User',
        role: 'employee'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ where: { email: 'hash@test.com' } });
      
      // Password should be hashed, not plain text
      expect(user.password).not.toBe('plainpassword');
      expect(user.password.length).toBeGreaterThan(20); // Bcrypt hashes are long

      // Should be able to verify the password
      const isValid = await bcrypt.compare('plainpassword', user.password);
      expect(isValid).toBe(true);
    });

    test('should not store plain text passwords', async () => {
      const userData = {
        email: 'security@test.com',
        password: 'mysecretpassword',
        name: 'Security User',
        role: 'employee'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await User.findOne({ where: { email: 'security@test.com' } });
      
      // Ensure password doesn't contain the original text
      expect(user.password).not.toContain('mysecretpassword');
      expect(user.password.startsWith('$2b$')).toBe(true); // Bcrypt format
    });
  });

  describe('Role-based Access', () => {
    test('should create users with different roles', async () => {
      const users = [
        {
          email: 'employee@role.test',
          password: 'password123',
          name: 'Employee User',
          role: 'employee'
        },
        {
          email: 'driver@role.test',
          password: 'password123',
          name: 'Driver User',
          role: 'driver'
        },
        {
          email: 'admin@role.test',
          password: 'password123',
          name: 'Admin User',
          role: 'company_admin'
        }
      ];

      for (const userData of users) {
        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.user.role).toBe(userData.role);
      }
    });

    test('should return correct user role on login', async () => {
      // Create admin user
      const hashedPassword = await bcrypt.hash('adminpass', 4);
      await User.create({
        email: 'roletest@test.com',
        password: hashedPassword,
        name: 'Role Test User',
        role: 'company_admin'
      });

      const loginData = {
        email: 'roletest@test.com',
        password: 'adminpass'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user.role).toBe('company_admin');
    });
  });

  describe('Input Validation', () => {
    test('should handle missing email in registration', async () => {
      const userData = {
        password: 'password123',
        name: 'No Email User',
        role: 'employee'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should handle missing password in registration', async () => {
      const userData = {
        email: 'nopassword@test.com',
        name: 'No Password User',
        role: 'employee'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should handle missing name in registration', async () => {
      const userData = {
        email: 'noname@test.com',
        password: 'password123',
        role: 'employee'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('should handle empty login credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('User Data Response Format', () => {
    test('should return properly formatted user data on registration', async () => {
      const userData = {
        email: 'format@test.com',
        password: 'password123',
        name: 'Format Test User',
        role: 'employee'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      
      const user = response.body.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('name');
      expect(user).not.toHaveProperty('password');
    });

    test('should return firstName and lastName on login', async () => {
      const hashedPassword = await bcrypt.hash('testpass', 4);
      await User.create({
        email: 'name@test.com',
        password: hashedPassword,
        name: 'John Doe Smith',
        role: 'employee'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'name@test.com',
          password: 'testpass'
        })
        .expect(200);

      expect(response.body.user.firstName).toBe('John');
      expect(response.body.user.lastName).toBe('Doe');
      expect(response.body.user.name).toBe('John Doe Smith');
    });
  });
});