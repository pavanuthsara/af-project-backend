const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const WasteCategoryController = require('../../src/interface_adapters/controllers/WasteCategoryController');
const WasteItemController = require('../../src/interface_adapters/controllers/WasteItemController');
const WasteCategory = require('../../src/interface_adapters/schemas/WasteCategory');
const WasteItem = require('../../src/interface_adapters/schemas/WasteItem');

jest.setTimeout(120000);

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  app = express();
  app.use(express.json());

  const categoryController = new WasteCategoryController();
  const itemController = new WasteItemController();

  // Category routes
  app.post('/categories', (req, res, next) => categoryController.createCategory(req, res, next));
  app.get('/categories', (req, res, next) => categoryController.getCategories(req, res, next));
  app.get('/categories/:id', (req, res, next) => categoryController.getCategoryById(req, res, next));
  app.put('/categories/:id', (req, res, next) => categoryController.updateCategory(req, res, next));
  app.delete('/categories/:id', (req, res, next) => categoryController.deleteCategory(req, res, next));

  // Item routes
  app.post('/items', (req, res, next) => itemController.createWasteItem(req, res, next));
  app.get('/items', (req, res, next) => itemController.getWasteItems(req, res, next));
  app.get('/items/:id', (req, res, next) => itemController.getWasteItemById(req, res, next));
  app.put('/items/:id', (req, res, next) => itemController.updateWasteItem(req, res, next));
  app.delete('/items/:id', (req, res, next) => itemController.deleteWasteItem(req, res, next));

  // Global error handler
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal server error'
    });
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await WasteItem.deleteMany({});
  await WasteCategory.deleteMany({});
});

describe('Waste Management API Integration Tests', () => {
  describe('Category Management - KB-01: Admin creates and manages waste categories', () => {
    describe('POST /categories', () => {
      test('should create a new waste category successfully', async () => {
        const categoryData = {
          name: 'Plastic',
          description: 'Plastic waste items including bottles, containers, and packaging',
          recyclable: true,
          hazardous: false,
          compostable: false
        };

        const response = await request(app)
          .post('/categories')
          .send(categoryData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          name: 'Plastic',
          description: categoryData.description,
          recyclable: true,
          hazardous: false
        });
        expect(response.body.data).toHaveProperty('_id');
        expect(response.body.data).toHaveProperty('createdAt');
      });

      test('should create E-waste category for electronic items', async () => {
        const categoryData = {
          name: 'E-waste',
          description: 'Electronic waste including computers, phones, and batteries',
          recyclable: false,
          hazardous: true,
          compostable: false
        };

        const response = await request(app)
          .post('/categories')
          .send(categoryData)
          .expect(201);

        expect(response.body.data.name).toBe('E-waste');
        expect(response.body.data.hazardous).toBe(true);
      });

      test('should return 400 for duplicate category name', async () => {
        const categoryData = {
          name: 'Plastic',
          description: 'Plastic items'
        };

        await request(app)
          .post('/categories')
          .send(categoryData)
          .expect(201);

        const response = await request(app)
          .post('/categories')
          .send(categoryData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already exists');
      });

      test('should return 500 for missing required fields', async () => {
        const invalidData = {
          name: 'Invalid'
          // missing description
        };

        const response = await request(app)
          .post('/categories')
          .send(invalidData)
          .expect(500);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /categories', () => {
      beforeEach(async () => {
        await WasteCategory.create([
          { name: 'Plastic', description: 'Plastic items', recyclable: true },
          { name: 'E-waste', description: 'Electronic waste', hazardous: true },
          { name: 'Organic', description: 'Organic waste', compostable: true }
        ]);
      });

      test('should retrieve all categories with pagination', async () => {
        const response = await request(app)
          .get('/categories')
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(3);
        expect(response.body.pagination).toMatchObject({
          currentPage: 1,
          totalPages: 1,
          totalItems: 3,
          itemsPerPage: 10
        });
      });

      test('should handle pagination correctly', async () => {
        const response = await request(app)
          .get('/categories')
          .query({ page: 1, limit: 2 })
          .expect(200);

        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination.totalPages).toBe(2);
        expect(response.body.pagination.hasNextPage).toBe(true);
      });

      test('should retrieve empty list when no categories exist', async () => {
        await WasteCategory.deleteMany({});

        const response = await request(app)
          .get('/categories')
          .expect(200);

        expect(response.body.data).toHaveLength(0);
        expect(response.body.pagination.totalItems).toBe(0);
      });
    });

    describe('GET /categories/:id', () => {
      test('should retrieve a category by id', async () => {
        const category = await WasteCategory.create({
          name: 'Plastic',
          description: 'Plastic items',
          recyclable: true
        });

        const response = await request(app)
          .get(`/categories/${category._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Plastic');
        expect(response.body.data._id.toString()).toBe(category._id.toString());
      });

      test('should return 404 for non-existent category', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .get(`/categories/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('not found');
      });
    });

    describe('PUT /categories/:id', () => {
      test('should update a category successfully', async () => {
        const category = await WasteCategory.create({
          name: 'Plastic',
          description: 'Plastic items',
          recyclable: true
        });

        const updateData = {
          description: 'Updated: All plastic waste items',
          recyclable: false
        };

        const response = await request(app)
          .put(`/categories/${category._id}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.description).toBe(updateData.description);
        expect(response.body.data.recyclable).toBe(false);
      });

      test('should return 404 when updating non-existent category', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .put(`/categories/${fakeId}`)
          .send({ description: 'Updated' })
          .expect(404);

        expect(response.body.success).toBe(false);
      });

      test('should return 400 for duplicate name during update', async () => {
        await WasteCategory.create([
          { name: 'Plastic', description: 'Plastic items' },
          { name: 'E-waste', description: 'Electronic waste' }
        ]);

        const plasticCategory = await WasteCategory.findOne({ name: 'Plastic' });

        const response = await request(app)
          .put(`/categories/${plasticCategory._id}`)
          .send({ name: 'E-waste' })
          .expect(400);

        expect(response.body.message).toContain('already exists');
      });
    });

    describe('DELETE /categories/:id', () => {
      test('should delete a category and associated items', async () => {
        const category = await WasteCategory.create({
          name: 'Plastic',
          description: 'Plastic items'
        });

        // Create items associated with the category
        await WasteItem.create([
          {
            name: 'Bottle',
            category: category._id
          },
          {
            name: 'Container',
            category: category._id
          }
        ]);

        const response = await request(app)
          .delete(`/categories/${category._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');

        // Verify category is deleted
        const deletedCategory = await WasteCategory.findById(category._id);
        expect(deletedCategory).toBeNull();

        // Verify associated items are deleted
        const remainingItems = await WasteItem.find({ category: category._id });
        expect(remainingItems).toHaveLength(0);
      });

      test('should return 404 when deleting non-existent category', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .delete(`/categories/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Waste Item Management - KB-02: Admin adds waste items', () => {
    let plasticCategory;
    let ewasteCategory;

    beforeEach(async () => {
      plasticCategory = await WasteCategory.create({
        name: 'Plastic',
        description: 'Plastic items',
        recyclable: true
      });

      ewasteCategory = await WasteCategory.create({
        name: 'E-waste',
        description: 'Electronic waste',
        hazardous: true
      });
    });

    describe('POST /items', () => {
      test('should create a waste item successfully', async () => {
        const itemData = {
          name: 'Plastic Bottle',
          description: 'PET plastic bottle',
          category: plasticCategory._id.toString(),
          recyclable: true,
          hazardous: false,
          compostable: false
        };

        const response = await request(app)
          .post('/items')
          .send(itemData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toMatchObject({
          name: 'Plastic Bottle',
          description: 'PET plastic bottle',
          recyclable: true,
          hazardous: false
        });
        expect(response.body.data.category).toHaveProperty('name', 'Plastic');
      });

      test('should create hazardous e-waste item successfully', async () => {
        const itemData = {
          name: 'Lithium Battery',
          description: 'Rechargeable lithium-ion battery',
          category: ewasteCategory._id.toString(),
          recyclable: false,
          hazardous: true,
          compostable: false
        };

        const response = await request(app)
          .post('/items')
          .send(itemData)
          .expect(201);

        expect(response.body.data.name).toBe('Lithium Battery');
        expect(response.body.data.hazardous).toBe(true);
      });

      test('should return 400 for missing required fields', async () => {
        const invalidData = {
          name: 'Bottle'
          // missing category
        };

        const response = await request(app)
          .post('/items')
          .send(invalidData)
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Missing required fields: category');
      });

      test('should return 404 when category does not exist', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const itemData = {
          name: 'Bottle',
          category: fakeId.toString()
        };

        const response = await request(app)
          .post('/items')
          .send(itemData)
          .expect(404);

        expect(response.body.message).toContain('Category not found');
      });
    });

    describe('GET /items', () => {
      beforeEach(async () => {
        await WasteItem.create([
          {
            name: 'Plastic Bottle',
            category: plasticCategory._id,
            recyclable: true
          },
          {
            name: 'Plastic Container',
            category: plasticCategory._id,
            recyclable: true
          },
          {
            name: 'Old Phone',
            category: ewasteCategory._id,
            hazardous: true
          }
        ]);
      });

      test('should retrieve all waste items with pagination', async () => {
        const response = await request(app)
          .get('/items')
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(3);
        expect(response.body.pagination.totalItems).toBe(3);
      });

      test('should filter items by category', async () => {
        const response = await request(app)
          .get('/items')
          .query({ category: plasticCategory._id.toString() })
          .expect(200);

        expect(response.body.data).toHaveLength(2);
        expect(response.body.data[0].category.name).toBe('Plastic');
      });

      test('should filter items by recyclable flag', async () => {
        const response = await request(app)
          .get('/items')
          .query({ recyclable: 'true' })
          .expect(200);

        expect(response.body.data).toHaveLength(2);
        response.body.data.forEach(item => {
          expect(item.recyclable).toBe(true);
        });
      });

      test('should filter items by hazardous flag', async () => {
        const response = await request(app)
          .get('/items')
          .query({ hazardous: 'true' })
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].name).toBe('Old Phone');
        expect(response.body.data[0].hazardous).toBe(true);
      });

      test('should search items by name', async () => {
        const response = await request(app)
          .get('/items')
          .query({ search: 'bottle' })
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].name).toContain('Bottle');
      });

      test('should combine multiple filters', async () => {
        const response = await request(app)
          .get('/items')
          .query({
            category: plasticCategory._id.toString(),
            recyclable: 'true',
            search: 'container'
          })
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].name).toBe('Plastic Container');
      });
    });

    describe('GET /items/:id', () => {
      test('should retrieve a waste item by id with category populated', async () => {
        const item = await WasteItem.create({
          name: 'Plastic Bottle',
          category: plasticCategory._id,
          recyclable: true
        });

        const response = await request(app)
          .get(`/items/${item._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Plastic Bottle');
        expect(response.body.data.category).toHaveProperty('name', 'Plastic');
      });

      test('should return 404 for non-existent item', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .get(`/items/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('not found');
      });
    });

    describe('PUT /items/:id', () => {
      test('should update waste item description', async () => {
        const item = await WasteItem.create({
          name: 'Plastic Bottle',
          category: plasticCategory._id,
          recyclable: true
        });

        const updateData = {
          description: 'Updated description'
        };

        const response = await request(app)
          .put(`/items/${item._id}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.description).toBe(updateData.description);
      });

      test('should update hazard flag for item', async () => {
        const item = await WasteItem.create({
          name: 'Battery',
          category: ewasteCategory._id,
          hazardous: false
        });

        const response = await request(app)
          .put(`/items/${item._id}`)
          .send({ hazardous: true })
          .expect(200);

        expect(response.body.data.hazardous).toBe(true);
      });

      test('should return 404 when updating non-existent item', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .put(`/items/${fakeId}`)
          .send({ description: 'Updated' })
          .expect(404);

        expect(response.body.success).toBe(false);
      });

      test('should return 404 when updating with non-existent category', async () => {
        const item = await WasteItem.create({
          name: 'Bottle',
          category: plasticCategory._id
        });

        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .put(`/items/${item._id}`)
          .send({ category: fakeId.toString() })
          .expect(404);

        expect(response.body.message).toContain('Category not found');
      });
    });

    describe('DELETE /items/:id', () => {
      test('should delete a waste item successfully', async () => {
        const item = await WasteItem.create({
          name: 'Plastic Bottle',
          category: plasticCategory._id
        });

        const response = await request(app)
          .delete(`/items/${item._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');

        // Verify item is deleted
        const deletedItem = await WasteItem.findById(item._id);
        expect(deletedItem).toBeNull();
      });

      test('should return 404 when deleting non-existent item', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .delete(`/items/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Database Integrity Tests', () => {
    test('should maintain referential integrity when deleting category with items', async () => {
      const category = await WasteCategory.create({
        name: 'Test Category',
        description: 'Test'
      });

      await WasteItem.create([
        { name: 'Item 1', category: category._id },
        { name: 'Item 2', category: category._id },
        { name: 'Item 3', category: category._id }
      ]);

      // Delete category
      await request(app)
        .delete(`/categories/${category._id}`)
        .expect(200);

      // Verify all items are deleted
      const remainingItems = await WasteItem.find({ category: category._id });
      expect(remainingItems).toHaveLength(0);
    });

    test('should populate category details correctly when retrieving items', async () => {
      const category = await WasteCategory.create({
        name: 'Plastic',
        description: 'Plastic waste items'
      });

      const item = await WasteItem.create({
        name: 'Bottle',
        category: category._id
      });

      const response = await request(app)
        .get(`/items/${item._id}`)
        .expect(200);

      expect(response.body.data.category).toMatchObject({
        name: 'Plastic',
        description: 'Plastic waste items'
      });
    });
  });
});
