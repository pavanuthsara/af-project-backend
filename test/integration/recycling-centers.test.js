const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');

jest.mock('../../src/infrastructure/ai/GeminiService', () => {
  return jest.fn().mockImplementation(() => ({
    extractSearchFilters: jest.fn().mockResolvedValue({}),
  }));
});

const GeminiService = require('../../src/infrastructure/ai/GeminiService');
const SignUpController = require('../../src/interface_adapters/controllers/SignUpController');
const LoginController = require('../../src/interface_adapters/controllers/LoginController');
const AdminLoginController = require('../../src/interface_adapters/controllers/AdminLoginController');
const RegisterRecyclingCenterController = require('../../src/interface_adapters/controllers/RegisterRecyclingCenterController');
const DeleteRecyclingCenterController = require('../../src/interface_adapters/controllers/DeleteRecyclingCenterController');
const UpdateRecyclingCenterController = require('../../src/interface_adapters/controllers/UpdateRecyclingCenterController');
const ViewRecyclingCentersController = require('../../src/interface_adapters/controllers/ViewRecyclingCentersController');
const SearchRecyclingCentersController = require('../../src/interface_adapters/controllers/SearchRecyclingCentersController');
const GetRecyclingCentersByWasteTypeController = require('../../src/interface_adapters/controllers/GetRecyclingCentersByWasteTypeController');
const GetRecyclingCenterByIdController = require('../../src/interface_adapters/controllers/GetRecyclingCenterByIdController');
const authMiddleware = require('../../src/interface_adapters/middleware/AuthMiddleware');
const adminAuthMiddleware = require('../../src/interface_adapters/middleware/AdminAuthMiddleware');
const managerAuthMiddleware = require('../../src/interface_adapters/middleware/ManagerAuthMiddleware');
const UserModel = require('../../src/interface_adapters/schemas/UserSchema');
const WasteCategory = require('../../src/interface_adapters/schemas/WasteCategory');
const RecyclingCenter = require('../../src/interface_adapters/schemas/RecyclingCenterSchema');

jest.setTimeout(120000);

let mongoServer;
let app;

const validCenterPayload = {
  name: 'Green Valley Recycling Hub',
  address: '123 Main St, Springfield',
  location: {
    type: 'Point',
    coordinates: [-73.935242, 40.73061],
  },
  acceptedWasteTypes: ['Plastic', 'Paper'],
  operatingHours: 'Mon-Fri 08:00-18:00',
  maxCapacityKg: 50000,
  currentLoadKg: 1200,
};

async function createUserAndGetToken({ name, email, password, role, loginPath = '/login' }) {
  await request(app)
    .post('/signup')
    .send({ name, email, password, role })
    .expect(201);

  const loginResponse = await request(app)
    .post(loginPath)
    .send({ email, password })
    .expect(200);

  return loginResponse.body.token;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  app = express();
  app.use(express.json());

  const signUpController = new SignUpController();
  const loginController = new LoginController();
  const adminLoginController = new AdminLoginController();
  const registerRecyclingCenterController = new RegisterRecyclingCenterController();
  const deleteRecyclingCenterController = new DeleteRecyclingCenterController();
  const updateRecyclingCenterController = new UpdateRecyclingCenterController();
  const viewRecyclingCentersController = new ViewRecyclingCentersController();
  const searchRecyclingCentersController = new SearchRecyclingCentersController();
  const getRecyclingCentersByWasteTypeController = new GetRecyclingCentersByWasteTypeController();
  const getRecyclingCenterByIdController = new GetRecyclingCenterByIdController();

  app.post('/signup', (req, res) => signUpController.handle(req, res));
  app.post('/login', (req, res) => loginController.handle(req, res));
  app.post('/admin/login', (req, res) => adminLoginController.handle(req, res));

  app.post('/admin/recycling-centers', adminAuthMiddleware, (req, res) => (
    registerRecyclingCenterController.handle(req, res)
  ));
  app.delete('/admin/recycling-centers/:id', adminAuthMiddleware, (req, res) => (
    deleteRecyclingCenterController.handle(req, res)
  ));
  app.put('/manager/recycling-centers/:id', managerAuthMiddleware, (req, res) => (
    updateRecyclingCenterController.handle(req, res)
  ));
  app.get('/recycling-centers', authMiddleware, (req, res) => (
    viewRecyclingCentersController.handle(req, res)
  ));
  app.get('/recycling-centers/by-waste/:wasteType', authMiddleware, (req, res) => (
    getRecyclingCentersByWasteTypeController.handle(req, res)
  ));
  app.get('/recycling-centers/:id', authMiddleware, (req, res) => (
    getRecyclingCenterByIdController.handle(req, res)
  ));
  app.post('/recycling-centers/search', authMiddleware, (req, res) => (
    searchRecyclingCentersController.handle(req, res)
  ));
});

beforeEach(async () => {
  await WasteCategory.create([
    {
      name: 'Plastic',
      description: 'Plastic waste items',
      recyclable: true,
    },
    {
      name: 'Paper',
      description: 'Paper waste items',
      recyclable: true,
    },
    {
      name: 'Glass',
      description: 'Glass waste items',
      recyclable: true,
    },
  ]);
});

afterEach(async () => {
  jest.clearAllMocks();
  await RecyclingCenter.deleteMany({});
  await WasteCategory.deleteMany({});
  await UserModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Recycling Center API Integration Tests', () => {
  describe('POST /admin/recycling-centers', () => {
    test('should create a recycling center successfully for an admin', async () => {
      const adminToken = await createUserAndGetToken({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        loginPath: '/admin/login',
      });

      const response = await request(app)
        .post('/admin/recycling-centers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validCenterPayload)
        .expect(201);

      expect(response.body.message).toBe('Recycling center registered successfully');
      expect(response.body.recyclingCenter).toMatchObject({
        name: validCenterPayload.name,
        address: validCenterPayload.address,
        acceptedWasteTypes: validCenterPayload.acceptedWasteTypes,
      });

      const savedCenter = await RecyclingCenter.findOne({ name: validCenterPayload.name });
      expect(savedCenter).not.toBeNull();
    });

    test('should return 403 when a regular user attempts to create a recycling center', async () => {
      const userToken = await createUserAndGetToken({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'password123',
        role: 'user',
      });

      await request(app)
        .post('/admin/recycling-centers')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validCenterPayload)
        .expect(403);
    });

    test('should return 400 when accepted waste types are invalid', async () => {
      const adminToken = await createUserAndGetToken({
        name: 'Admin User',
        email: 'admin2@example.com',
        password: 'password123',
        role: 'admin',
        loginPath: '/admin/login',
      });

      const response = await request(app)
        .post('/admin/recycling-centers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validCenterPayload,
          acceptedWasteTypes: ['Plastic', 'UnknownType'],
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid waste types');
    });
  });

  describe('GET /recycling-centers', () => {
    test('should list recycling centers for an authenticated user', async () => {
      const userToken = await createUserAndGetToken({
        name: 'Regular User',
        email: 'viewer@example.com',
        password: 'password123',
        role: 'user',
      });

      await RecyclingCenter.create([
        validCenterPayload,
        {
          ...validCenterPayload,
          name: 'Eco Point',
          address: '45 Oak Rd, Springfield',
          acceptedWasteTypes: ['Glass'],
        },
      ]);

      const response = await request(app)
        .get('/recycling-centers')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.recyclingCenters).toHaveLength(2);
      expect(response.body.recyclingCenters[0]).toHaveProperty('name');
    });

    test('should return 401 without an access token', async () => {
      await request(app)
        .get('/recycling-centers')
        .expect(401);
    });
  });

  describe('GET /recycling-centers/:id', () => {
    test('should return a recycling center by id', async () => {
      const userToken = await createUserAndGetToken({
        name: 'Regular User',
        email: 'reader@example.com',
        password: 'password123',
        role: 'user',
      });

      const center = await RecyclingCenter.create(validCenterPayload);

      const response = await request(app)
        .get(`/recycling-centers/${center._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.recyclingCenter.name).toBe(validCenterPayload.name);
      expect(response.body.recyclingCenter.id).toBe(center._id.toString());
    });

    test('should return 404 for a non-existent recycling center', async () => {
      const userToken = await createUserAndGetToken({
        name: 'Regular User',
        email: 'reader2@example.com',
        password: 'password123',
        role: 'user',
      });

      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/recycling-centers/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.error).toBe('Recycling center not found');
    });
  });

  describe('GET /recycling-centers/by-waste/:wasteType', () => {
    test('should return centers matching a waste type', async () => {
      const userToken = await createUserAndGetToken({
        name: 'Regular User',
        email: 'wastefilter@example.com',
        password: 'password123',
        role: 'user',
      });

      await RecyclingCenter.create([
        validCenterPayload,
        {
          ...validCenterPayload,
          name: 'Glass Works',
          address: '200 Glass St, Springfield',
          acceptedWasteTypes: ['Glass'],
        },
      ]);

      const response = await request(app)
        .get('/recycling-centers/by-waste/Plastic')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.wasteType).toBe('Plastic');
      expect(response.body.recyclingCenters).toHaveLength(1);
      expect(response.body.recyclingCenters[0].name).toBe(validCenterPayload.name);
    });

    test('should return 400 for an empty waste type', async () => {
      const userToken = await createUserAndGetToken({
        name: 'Regular User',
        email: 'wastefilter2@example.com',
        password: 'password123',
        role: 'user',
      });

      await request(app)
        .get('/recycling-centers/by-waste/%20')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });
  });

  describe('PUT /manager/recycling-centers/:id', () => {
    test('should update a recycling center successfully for a manager', async () => {
      const managerToken = await createUserAndGetToken({
        name: 'Manager User',
        email: 'manager@example.com',
        password: 'password123',
        role: 'manager',
      });

      const center = await RecyclingCenter.create(validCenterPayload);

      const response = await request(app)
        .put(`/manager/recycling-centers/${center._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          ...validCenterPayload,
          name: 'Green Valley Recycling Hub Updated',
          currentLoadKg: 1500,
        })
        .expect(200);

      expect(response.body.message).toBe('Recycling center updated successfully');
      expect(response.body.recyclingCenter.name).toBe('Green Valley Recycling Hub Updated');
      expect(response.body.recyclingCenter.currentLoadKg).toBe(1500);
    });

    test('should return 403 when an admin attempts to update a recycling center through the manager route', async () => {
      const adminToken = await createUserAndGetToken({
        name: 'Admin User',
        email: 'admin3@example.com',
        password: 'password123',
        role: 'admin',
        loginPath: '/admin/login',
      });

      const center = await RecyclingCenter.create(validCenterPayload);

      await request(app)
        .put(`/manager/recycling-centers/${center._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validCenterPayload,
          currentLoadKg: 1500,
        })
        .expect(403);
    });
  });

  describe('DELETE /admin/recycling-centers/:id', () => {
    test('should delete a recycling center successfully for an admin', async () => {
      const adminToken = await createUserAndGetToken({
        name: 'Admin User',
        email: 'admin4@example.com',
        password: 'password123',
        role: 'admin',
        loginPath: '/admin/login',
      });

      const center = await RecyclingCenter.create(validCenterPayload);

      await request(app)
        .delete(`/admin/recycling-centers/${center._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const deletedCenter = await RecyclingCenter.findById(center._id);
      expect(deletedCenter).toBeNull();
    });

    test('should return 404 when deleting a non-existent recycling center', async () => {
      const adminToken = await createUserAndGetToken({
        name: 'Admin User',
        email: 'admin5@example.com',
        password: 'password123',
        role: 'admin',
        loginPath: '/admin/login',
      });

      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/admin/recycling-centers/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe('Recycling center not found');
    });
  });

  describe('POST /recycling-centers/search', () => {
    test('should search recycling centers using filters returned by Gemini', async () => {
      const userToken = await createUserAndGetToken({
        name: 'Regular User',
        email: 'searcher@example.com',
        password: 'password123',
        role: 'user',
      });

      GeminiService.mockImplementation(() => ({
        extractSearchFilters: jest.fn().mockResolvedValue({
          acceptedWasteTypes: ['Plastic'],
          city: 'Springfield',
          name: null,
          addressKeywords: [],
          maxDistanceKm: 10,
        }),
      }));

      await RecyclingCenter.create([
        validCenterPayload,
        {
          ...validCenterPayload,
          name: 'Glass Works',
          address: '200 Glass St, Shelbyville',
          acceptedWasteTypes: ['Glass'],
        },
      ]);

      const response = await request(app)
        .post('/recycling-centers/search')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ query: 'plastic recycling centers in Springfield within 10 km' })
        .expect(200);

      expect(response.body.query).toContain('Springfield');
      expect(response.body.filters.acceptedWasteTypes).toEqual(['Plastic']);
      expect(response.body.recyclingCenters).toHaveLength(1);
      expect(response.body.recyclingCenters[0].name).toBe(validCenterPayload.name);
    });

    test('should return 400 when the query is missing', async () => {
      const userToken = await createUserAndGetToken({
        name: 'Regular User',
        email: 'searcher2@example.com',
        password: 'password123',
        role: 'user',
      });

      const response = await request(app)
        .post('/recycling-centers/search')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Query is required');
    });
  });
});
