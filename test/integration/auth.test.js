const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const SignUpController = require('../../src/interface_adapters/controllers/SignUpController');
const LoginController = require('../../src/interface_adapters/controllers/LoginController');
const authMiddleware = require('../../src/interface_adapters/middleware/AuthMiddleware');
const UserModel = require('../../src/interface_adapters/schemas/UserSchema');

// Set timeout for the entire test file (mongodb-memory-server downloads binaries on first run)
jest.setTimeout(120000);

let mongoServer;
let app;

beforeAll(async () => {
  // Setup in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Setup Express app
  app = express();
  app.use(express.json());

  const signUpController = new SignUpController();
  const loginController = new LoginController();

  app.post('/signup', (req, res) => signUpController.handle(req, res));
  app.post('/login', (req, res) => loginController.handle(req, res));
  app.get('/profile', authMiddleware, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await UserModel.deleteMany({});
});

describe('Authentication API Integration Tests', () => {
  describe('POST /signup', () => {
    test('should register a new user successfully and return a token', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/signup')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.message).toBe('User registered and logged in successfully');
    });

    test('should return 400 if user already exists', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      // First signup
      await request(app).post('/signup').send(userData);

      // Second signup with same email
      const response = await request(app)
        .post('/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    test('should handle missing name field', async () => {
      const response = await request(app)
        .post('/signup')
        .send({ email: 'john@example.com', password: 'password123' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing email field', async () => {
      const response = await request(app)
        .post('/signup')
        .send({ name: 'John Doe', password: 'password123' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing password field', async () => {
      const response = await request(app)
        .post('/signup')
        .send({ name: 'John Doe', email: 'john@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should store hashed password in database', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      await request(app).post('/signup').send(userData).expect(201);

      const user = await UserModel.findOne({ email: userData.email });
      expect(user.password).not.toBe(userData.password);
      expect(user.password).toBeDefined();
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app).post('/signup').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.message).toBe('Login successful');
    });

    test('should return 401 with invalid email', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    test('should return 401 with invalid password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    test('should not include password in response', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    test('should return valid JWT token', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      const token = response.body.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT format
    });
  });

  describe('GET /profile (Protected Route)', () => {
    let validToken;

    beforeEach(async () => {
      // Create and login a user
      await request(app).post('/signup').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

      const loginResponse = await request(app).post('/login').send({
        email: 'test@example.com',
        password: 'password123'
      });

      validToken = loginResponse.body.token;
    });

    test('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email');
    });

    test('should return 401 without token', async () => {
      const response = await request(app)
        .get('/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No token provided');
    });

    test('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid token');
    });

    test('should return 401 without Bearer prefix', async () => {
      const response = await request(app)
        .get('/profile')
        .set('Authorization', validToken)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 401 with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/profile')
        .set('Authorization', 'NotBearer token123')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should decode user information from token', async () => {
      const response = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user.email).toBe('test@example.com');
    });
  });

  describe('End-to-End User Journey', () => {
    test('should complete full signup and access protected route', async () => {
      // 1. Sign up and get token
      const signupResponse = await request(app)
        .post('/signup')
        .send({
          name: 'Journey User',
          email: 'journey@example.com',
          password: 'journeypass123'
        })
        .expect(201);

      expect(signupResponse.body).toHaveProperty('token');
      const token = signupResponse.body.token;
      const userId = signupResponse.body.user.id;

      // 2. Access protected route
      const profileResponse = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.user.id).toBe(userId);
      expect(profileResponse.body.user.email).toBe('journey@example.com');
    });

    test('should not allow duplicate registrations and successful login after first registration', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        password: 'duplicatepass123'
      };

      // First signup
      await request(app).post('/signup').send(userData).expect(201);

      // Second signup should fail
      await request(app).post('/signup').send(userData).expect(400);

      // But should still be able to login with first account
      const loginResponse = await request(app)
        .post('/login')
        .send({ email: userData.email, password: userData.password })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });
  });
});
