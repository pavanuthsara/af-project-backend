const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');

const SignUpController = require('../../src/interface_adapters/controllers/SignUpController');
const LoginController = require('../../src/interface_adapters/controllers/LoginController');
const AdminLoginController = require('../../src/interface_adapters/controllers/AdminLoginController');
const CreateDisposalController = require('../../src/interface_adapters/controllers/disposal/CreateDisposalController');
const GetDisposalHistoryController = require('../../src/interface_adapters/controllers/disposal/GetDisposalHistoryController');
const GetUserWasteStatsController = require('../../src/interface_adapters/controllers/disposal/GetUserWasteStatsController');
const UpdateDisposalController = require('../../src/interface_adapters/controllers/disposal/UpdateDisposalController');
const DeleteDisposalController = require('../../src/interface_adapters/controllers/disposal/DeleteDisposalController');
const GetDisposalStatsController = require('../../src/interface_adapters/controllers/disposal/GetDisposalStatsController');
const authMiddleware = require('../../src/interface_adapters/middleware/AuthMiddleware');
const adminAuthMiddleware = require('../../src/interface_adapters/middleware/AdminAuthMiddleware');

const UserModel = require('../../src/interface_adapters/schemas/UserSchema');
const WasteCategory = require('../../src/interface_adapters/schemas/WasteCategory');
const WasteItem = require('../../src/interface_adapters/schemas/WasteItem');
const DisposalActivity = require('../../src/interface_adapters/schemas/DisposalActivitySchema');

jest.setTimeout(120000);

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  app = express();
  app.use(express.json());

  const signUpController = new SignUpController();
  const loginController = new LoginController();
  const adminLoginController = new AdminLoginController();
  const createDisposalController = new CreateDisposalController();
  const getDisposalHistoryController = new GetDisposalHistoryController();
  const getUserWasteStatsController = new GetUserWasteStatsController();
  const updateDisposalController = new UpdateDisposalController();
  const deleteDisposalController = new DeleteDisposalController();
  const getDisposalStatsController = new GetDisposalStatsController();

  app.post('/signup', (req, res) => signUpController.handle(req, res));
  app.post('/login', (req, res) => loginController.handle(req, res));
  app.post('/admin/login', (req, res) => adminLoginController.handle(req, res));

  app.post('/disposal', authMiddleware, (req, res) => createDisposalController.handle(req, res));
  app.get('/disposal/history', authMiddleware, (req, res) => getDisposalHistoryController.handle(req, res));
  app.get('/disposal/stats', authMiddleware, (req, res) => getUserWasteStatsController.handle(req, res));
  app.put('/disposal/:id', authMiddleware, (req, res) => updateDisposalController.handle(req, res));
  app.delete('/disposal/:id', authMiddleware, (req, res) => deleteDisposalController.handle(req, res));
  app.get('/admin/disposal/stats', adminAuthMiddleware, (req, res) => getDisposalStatsController.handle(req, res));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await DisposalActivity.deleteMany({});
  await WasteItem.deleteMany({});
  await WasteCategory.deleteMany({});
  await UserModel.deleteMany({});
});

// ─── helpers ────────────────────────────────────────────────────────────────

async function createUserAndLogin({ name, email, password, role = 'user' }) {
  await request(app).post('/signup').send({ name, email, password, role }).expect(201);
  const loginPath = role === 'admin' ? '/admin/login' : '/login';
  const res = await request(app).post(loginPath).send({ email, password }).expect(200);
  return res.body.token;
}

async function seedCategory(overrides = {}) {
  return WasteCategory.create({
    name: 'Plastic',
    description: 'Plastic waste items',
    recyclable: true,
    ...overrides,
  });
}

async function seedWasteItem(categoryId, overrides = {}) {
  return WasteItem.create({
    name: 'Plastic Bottle',
    description: 'PET plastic bottle',
    category: categoryId,
    recyclable: true,
    hazardous: false,
    compostable: false,
    ...overrides,
  });
}

// ─── tests ──────────────────────────────────────────────────────────────────

describe('Disposal API Integration Tests', () => {

  // ── POST /disposal ─────────────────────────────────────────────────────────
  describe('POST /disposal', () => {
    let userToken;
    let wasteItemId;

    beforeEach(async () => {
      userToken = await createUserAndLogin({
        name: 'Test User',
        email: 'user@example.com',
        password: 'password123',
      });
      const category = await seedCategory();
      const item = await seedWasteItem(category._id);
      wasteItemId = item._id.toString();
    });

    test('should create a disposal log and return 201 with carbonImpact', async () => {
      const res = await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: wasteItemId, quantity: 2, weight: 1.5, unit: 'kg' })
        .expect(201);

      expect(res.body.message).toBe('Disposal log created successfully');
      expect(res.body.data).toMatchObject({
        wasteId: wasteItemId,
        quantity: 2,
        weight: 1.5,
        unit: 'kg',
      });
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.carbonImpact).toMatchObject({ co2SavedUnit: 'kg CO₂e' });
    });

    test('should calculate non-zero co2Saved for a recyclable item', async () => {
      const res = await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: wasteItemId, quantity: 1, weight: 2, unit: 'kg' })
        .expect(201);

      expect(res.body.carbonImpact.co2Saved).toBeGreaterThan(0);
      expect(res.body.carbonImpact.disposalMethod).toBe('recycled');
    });

    test('should store an optional disposalGuideline', async () => {
      const res = await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          wasteId: wasteItemId,
          quantity: 1,
          weight: 0.5,
          unit: 'kg',
          disposalGuideline: 'Rinse before recycling',
        })
        .expect(201);

      expect(res.body.data.disposalGuideline).toBe('Rinse before recycling');
    });

    test('should return 400 when wasteId does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: fakeId, quantity: 1, weight: 1, unit: 'kg' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    test('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: wasteItemId })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    test('should return 400 when weight is zero or negative', async () => {
      const res = await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: wasteItemId, quantity: 1, weight: 0, unit: 'kg' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    test('should return 400 for an invalid unit', async () => {
      const res = await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: wasteItemId, quantity: 1, weight: 1, unit: 'ton' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    test('should return 401 without an auth token', async () => {
      await request(app)
        .post('/disposal')
        .send({ wasteId: wasteItemId, quantity: 1, weight: 1, unit: 'kg' })
        .expect(401);
    });
  });

  // ── GET /disposal/history ──────────────────────────────────────────────────
  describe('GET /disposal/history', () => {
    let userToken;
    let wasteItemId;

    beforeEach(async () => {
      userToken = await createUserAndLogin({
        name: 'Test User',
        email: 'user@example.com',
        password: 'password123',
      });
      const category = await seedCategory();
      const item = await seedWasteItem(category._id);
      wasteItemId = item._id.toString();
    });

    test('should return an empty array when the user has no disposal logs', async () => {
      const res = await request(app)
        .get('/disposal/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.message).toBe('Disposal history retrieved successfully');
      expect(res.body.data).toHaveLength(0);
    });

    test('should return all disposal logs belonging to the authenticated user', async () => {
      // Create two logs
      await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: wasteItemId, quantity: 1, weight: 1, unit: 'kg' });
      await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: wasteItemId, quantity: 2, weight: 2, unit: 'kg' });

      const res = await request(app)
        .get('/disposal/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
    });

    test('should not return disposal logs belonging to another user', async () => {
      const otherToken = await createUserAndLogin({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      // Other user creates a log
      await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ wasteId: wasteItemId, quantity: 1, weight: 1, unit: 'kg' });

      const res = await request(app)
        .get('/disposal/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });

    test('should return 401 without an auth token', async () => {
      await request(app).get('/disposal/history').expect(401);
    });
  });

  // ── GET /disposal/stats ────────────────────────────────────────────────────
  describe('GET /disposal/stats', () => {
    let userToken;
    let wasteItemId;

    beforeEach(async () => {
      userToken = await createUserAndLogin({
        name: 'Test User',
        email: 'user@example.com',
        password: 'password123',
      });
      const category = await seedCategory();
      const item = await seedWasteItem(category._id);
      wasteItemId = item._id.toString();
    });

    test('should return user waste stats after creating logs', async () => {
      await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: wasteItemId, quantity: 3, weight: 2, unit: 'kg' });

      const res = await request(app)
        .get('/disposal/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.message).toBe('User waste stats retrieved successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('should return an empty array when the user has no logs', async () => {
      const res = await request(app)
        .get('/disposal/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });

    test('should return 401 without an auth token', async () => {
      await request(app).get('/disposal/stats').expect(401);
    });
  });

  // ── PUT /disposal/:id ──────────────────────────────────────────────────────
  describe('PUT /disposal/:id', () => {
    let userToken;
    let wasteItemId;
    let disposalId;

    beforeEach(async () => {
      userToken = await createUserAndLogin({
        name: 'Test User',
        email: 'user@example.com',
        password: 'password123',
      });
      const category = await seedCategory();
      const item = await seedWasteItem(category._id);
      wasteItemId = item._id.toString();

      const createRes = await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: wasteItemId, quantity: 1, weight: 1, unit: 'kg' });
      disposalId = createRes.body.data.id;
    });

    test('should update the disposal log weight and return updated data', async () => {
      const res = await request(app)
        .put(`/disposal/${disposalId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ weight: 3.5 })
        .expect(200);

      expect(res.body.message).toBe('Disposal log updated successfully');
      expect(res.body.data.weight).toBe(3.5);
    });

    test('should update the disposalGuideline field', async () => {
      const res = await request(app)
        .put(`/disposal/${disposalId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ disposalGuideline: 'Updated guideline' })
        .expect(200);

      expect(res.body.data.disposalGuideline).toBe('Updated guideline');
    });

    test('should return 403 when another user tries to update the log', async () => {
      const otherToken = await createUserAndLogin({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      await request(app)
        .put(`/disposal/${disposalId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ weight: 5 })
        .expect(403);
    });

    test('should return 404 for a non-existent disposal log', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app)
        .put(`/disposal/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ weight: 2 })
        .expect(404);
    });

    test('should return 401 without an auth token', async () => {
      await request(app)
        .put(`/disposal/${disposalId}`)
        .send({ weight: 2 })
        .expect(401);
    });
  });

  // ── DELETE /disposal/:id ───────────────────────────────────────────────────
  describe('DELETE /disposal/:id', () => {
    let userToken;
    let wasteItemId;
    let disposalId;

    beforeEach(async () => {
      userToken = await createUserAndLogin({
        name: 'Test User',
        email: 'user@example.com',
        password: 'password123',
      });
      const category = await seedCategory();
      const item = await seedWasteItem(category._id);
      wasteItemId = item._id.toString();

      const createRes = await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: wasteItemId, quantity: 1, weight: 1, unit: 'kg' });
      disposalId = createRes.body.data.id;
    });

    test('should delete the disposal log and return 200', async () => {
      const res = await request(app)
        .delete(`/disposal/${disposalId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.message).toBe('Disposal log deleted successfully');

      // Confirm it no longer appears in history
      const history = await request(app)
        .get('/disposal/history')
        .set('Authorization', `Bearer ${userToken}`);
      expect(history.body.data).toHaveLength(0);
    });

    test('should return 403 when another user tries to delete the log', async () => {
      const otherToken = await createUserAndLogin({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });

      await request(app)
        .delete(`/disposal/${disposalId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    test('should return 404 for a non-existent disposal log', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app)
        .delete(`/disposal/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    test('should return 401 without an auth token', async () => {
      await request(app).delete(`/disposal/${disposalId}`).expect(401);
    });
  });

  // ── GET /admin/disposal/stats ──────────────────────────────────────────────
  describe('GET /admin/disposal/stats', () => {
    let adminToken;
    let userToken;
    let wasteItemId;

    beforeEach(async () => {
      adminToken = await createUserAndLogin({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'adminpass',
        role: 'admin',
      });
      userToken = await createUserAndLogin({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'password123',
        role: 'user',
      });
      const category = await seedCategory();
      const item = await seedWasteItem(category._id);
      wasteItemId = item._id.toString();
    });

    test('should return aggregated stats for admin', async () => {
      await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: wasteItemId, quantity: 2, weight: 1.5, unit: 'kg' });

      const res = await request(app)
        .get('/admin/disposal/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBe('Aggregated stats retrieved successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('should return 403 when a regular user accesses admin stats', async () => {
      await request(app)
        .get('/admin/disposal/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    test('should return 401 without an auth token', async () => {
      await request(app).get('/admin/disposal/stats').expect(401);
    });
  });

  // ── CO₂ calculation behaviour ──────────────────────────────────────────────
  describe('CO₂ calculation behaviour', () => {
    let userToken;

    beforeEach(async () => {
      userToken = await createUserAndLogin({
        name: 'Eco User',
        email: 'eco@example.com',
        password: 'password123',
      });
    });

    test('recyclable item should produce positive co2Saved', async () => {
      const category = await seedCategory({ name: 'Plastic', recyclable: true });
      const item = await seedWasteItem(category._id, { recyclable: true });

      const res = await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: item._id.toString(), quantity: 1, weight: 1, unit: 'kg' })
        .expect(201);

      expect(res.body.carbonImpact.co2Saved).toBeGreaterThan(0);
    });

    test('hazardous item should produce zero co2Saved (landfill baseline)', async () => {
      const category = await seedCategory({ name: 'Hazardous', recyclable: false, hazardous: true });
      const item = await seedWasteItem(category._id, {
        recyclable: false,
        hazardous: true,
        compostable: false,
      });

      const res = await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: item._id.toString(), quantity: 1, weight: 1, unit: 'kg' })
        .expect(201);

      expect(res.body.carbonImpact.co2Saved).toBe(0);
      expect(res.body.carbonImpact.disposalMethod).toBe('landfill');
    });

    test('co2Source should be epa_warm when Climatiq API key is not set', async () => {
      const category = await seedCategory();
      const item = await seedWasteItem(category._id);

      const res = await request(app)
        .post('/disposal')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ wasteId: item._id.toString(), quantity: 1, weight: 1, unit: 'kg' })
        .expect(201);

      // In test env CLIMATIQ_API_KEY is not configured
      expect(['epa_warm', 'climatiq']).toContain(res.body.carbonImpact.source);
    });
  });
});
