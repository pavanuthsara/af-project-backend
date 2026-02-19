const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const SignUpController = require('../../src/interface_adapters/controllers/SignUpController');
const LoginController = require('../../src/interface_adapters/controllers/LoginController');
const AdminLoginController = require('../../src/interface_adapters/controllers/AdminLoginController');
const RegisterAdminController = require('../../src/interface_adapters/controllers/RegisterAdminController');
const authMiddleware = require('../../src/interface_adapters/middleware/AuthMiddleware');
const adminAuthMiddleware = require('../../src/interface_adapters/middleware/AdminAuthMiddleware');
const UserModel = require('../../src/interface_adapters/schemas/UserSchema');

jest.setTimeout(120000);

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  app = express();
  app.use(express.json());

  const signUpController = new SignUpController();
  const loginController = new LoginController();
  const adminLoginController = new AdminLoginController();
  const registerAdminController = new RegisterAdminController();

  app.post('/signup', (req, res) => signUpController.handle(req, res));
  app.post('/login', (req, res) => loginController.handle(req, res));
  app.post('/admin/login', (req, res) => adminLoginController.handle(req, res));
  app.post('/admin/register', adminAuthMiddleware, (req, res) => registerAdminController.handle(req, res));
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
      expect(response.body.user.role).toBe('user');
    });

    test('should register a new admin user successfully', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminpassword',
        role: 'admin'
      };

      const response = await request(app)
        .post('/signup')
        .send(adminData)
        .expect(201);

      expect(response.body.user.role).toBe('admin');
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
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
      expect(response.body.user.email).toBe('test@example.com');
    });
  });

  describe('POST /admin/login', () => {
    beforeEach(async () => {
      await request(app).post('/signup').send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminpassword',
        role: 'admin'
      });
      await request(app).post('/signup').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    test('should login successfully with admin credentials', async () => {
      const response = await request(app)
        .post('/admin/login')
        .send({
          email: 'admin@example.com',
          password: 'adminpassword'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.role).toBe('admin');
    });

    test('should return 403 if a regular user tries to login', async () => {
      await request(app)
        .post('/admin/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(403);
    });
  });

  describe('POST /admin/register', () => {
    let adminToken;
    let userToken;

    beforeEach(async () => {
      await request(app).post('/signup').send({
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: 'superadminpassword',
        role: 'admin'
      });
      const adminLoginResponse = await request(app).post('/admin/login').send({
        email: 'superadmin@example.com',
        password: 'superadminpassword'
      });
      adminToken = adminLoginResponse.body.token;

      await request(app).post('/signup').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      const userLoginResponse = await request(app).post('/login').send({
        email: 'test@example.com',
        password: 'password123'
      });
      userToken = userLoginResponse.body.token;
    });

    test('should register a new admin successfully by another admin', async () => {
      const newAdminData = {
        name: 'New Admin',
        email: 'newadmin@example.com',
        password: 'newadminpassword'
      };

      const response = await request(app)
        .post('/admin/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newAdminData)
        .expect(201);

      expect(response.body.user.role).toBe('admin');
    });

    test('should return 403 if a regular user tries to register an admin', async () => {
      await request(app)
        .post('/admin/register')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'New Admin', email: 'newadmin@example.com', password: 'newadminpassword' })
        .expect(403);
    });

    test('should return 401 if an unauthenticated user tries to register an admin', async () => {
      await request(app)
        .post('/admin/register')
        .send({ name: 'New Admin', email: 'newadmin@example.com', password: 'newadminpassword' })
        .expect(401);
    });
  });

  describe('GET /profile (Protected Route)', () => {
    let validToken;
    beforeEach(async () => {
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
      await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });
  });
});
