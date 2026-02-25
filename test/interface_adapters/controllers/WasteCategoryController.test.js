const WasteCategoryController = require('../../../src/interface_adapters/controllers/WasteCategoryController');
const WasteService = require('../../../src/application/services/WasteService');

// Mock the WasteService
jest.mock('../../../src/application/services/WasteService');

describe('WasteCategoryController', () => {
  let controller;
  let mockWasteService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockWasteService = {
      createCategory: jest.fn(),
      getCategories: jest.fn(),
      getCategoryById: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn()
    };

    WasteService.mockImplementation(() => mockWasteService);
    controller = new WasteCategoryController();

    mockReq = {
      body: {},
      params: {},
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    test('should create category successfully', async () => {
      const categoryData = {
        name: 'Plastic',
        description: 'Plastic waste items',
        recyclable: true,
        hazardous: false,
        compostable: false
      };

      const mockCategory = { _id: '123', ...categoryData };

      mockReq.body = categoryData;
      mockWasteService.createCategory.mockResolvedValue(mockCategory);

      await controller.createCategory(mockReq, mockRes, mockNext);

      expect(mockWasteService.createCategory).toHaveBeenCalledWith(categoryData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCategory
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should use default values for boolean fields when not provided', async () => {
      const categoryData = {
        name: 'E-waste',
        description: 'Electronic waste items'
      };

      mockReq.body = categoryData;
      mockWasteService.createCategory.mockResolvedValue({ _id: '123', ...categoryData });

      await controller.createCategory(mockReq, mockRes, mockNext);

      expect(mockWasteService.createCategory).toHaveBeenCalledWith({
        name: 'E-waste',
        description: 'Electronic waste items',
        recyclable: false,
        hazardous: false,
        compostable: false
      });
    });

    test('should handle duplicate category name error', async () => {
      const duplicateError = { code: 11000, message: 'Duplicate key error' };
      
      mockReq.body = {
        name: 'Plastic',
        description: 'Plastic items'
      };
      
      mockWasteService.createCategory.mockRejectedValue(duplicateError);

      await controller.createCategory(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const errorArg = mockNext.mock.calls[0][0];
      expect(errorArg.message).toBe('Category name already exists');
      expect(errorArg.statusCode).toBe(400);
    });

    test('should pass other errors to next middleware', async () => {
      const error = new Error('Database connection error');
      
      mockReq.body = {
        name: 'Plastic',
        description: 'Plastic items'
      };
      
      mockWasteService.createCategory.mockRejectedValue(error);

      await controller.createCategory(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getCategories', () => {
    test('should get categories with pagination', async () => {
      const mockResult = {
        categories: [
          { _id: '1', name: 'Plastic' },
          { _id: '2', name: 'E-waste' }
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 2,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockReq.query = { page: '1', limit: '10' };
      mockWasteService.getCategories.mockResolvedValue(mockResult);

      await controller.getCategories(mockReq, mockRes, mockNext);

      expect(mockWasteService.getCategories).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.categories,
        pagination: mockResult.pagination
      });
    });

    test('should use default pagination values when not provided', async () => {
      const mockResult = {
        categories: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockReq.query = {};
      mockWasteService.getCategories.mockResolvedValue(mockResult);

      await controller.getCategories(mockReq, mockRes, mockNext);

      expect(mockWasteService.getCategories).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      });
    });

    test('should handle errors', async () => {
      const error = new Error('Database error');
      mockWasteService.getCategories.mockRejectedValue(error);

      await controller.getCategories(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getCategoryById', () => {
    test('should get category by id successfully', async () => {
      const mockCategory = {
        _id: '123',
        name: 'Plastic',
        description: 'Plastic waste'
      };

      mockReq.params = { id: '123' };
      mockWasteService.getCategoryById.mockResolvedValue(mockCategory);

      await controller.getCategoryById(mockReq, mockRes, mockNext);

      expect(mockWasteService.getCategoryById).toHaveBeenCalledWith('123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCategory
      });
    });

    test('should handle category not found', async () => {
      const error = new Error('Category not found');
      error.statusCode = 404;

      mockReq.params = { id: 'nonexistent' };
      mockWasteService.getCategoryById.mockRejectedValue(error);

      await controller.getCategoryById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateCategory', () => {
    test('should update category successfully', async () => {
      const updateData = {
        name: 'Updated Plastic',
        description: 'Updated description'
      };

      const mockUpdatedCategory = {
        _id: '123',
        ...updateData
      };

      mockReq.params = { id: '123' };
      mockReq.body = updateData;
      mockWasteService.updateCategory.mockResolvedValue(mockUpdatedCategory);

      await controller.updateCategory(mockReq, mockRes, mockNext);

      expect(mockWasteService.updateCategory).toHaveBeenCalledWith('123', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedCategory
      });
    });

    test('should handle duplicate name error during update', async () => {
      const duplicateError = { code: 11000 };

      mockReq.params = { id: '123' };
      mockReq.body = { name: 'Plastic' };
      mockWasteService.updateCategory.mockRejectedValue(duplicateError);

      await controller.updateCategory(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const errorArg = mockNext.mock.calls[0][0];
      expect(errorArg.message).toBe('Category name already exists');
      expect(errorArg.statusCode).toBe(400);
    });

    test('should handle category not found during update', async () => {
      const error = new Error('Category not found');
      error.statusCode = 404;

      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { name: 'Updated' };
      mockWasteService.updateCategory.mockRejectedValue(error);

      await controller.updateCategory(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteCategory', () => {
    test('should delete category successfully', async () => {
      const mockDeletedCategory = {
        _id: '123',
        name: 'Plastic'
      };

      mockReq.params = { id: '123' };
      mockWasteService.deleteCategory.mockResolvedValue(mockDeletedCategory);

      await controller.deleteCategory(mockReq, mockRes, mockNext);

      expect(mockWasteService.deleteCategory).toHaveBeenCalledWith('123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDeletedCategory,
        message: 'Category and associated items deleted successfully'
      });
    });

    test('should handle category not found during delete', async () => {
      const error = new Error('Category not found');
      error.statusCode = 404;

      mockReq.params = { id: 'nonexistent' };
      mockWasteService.deleteCategory.mockRejectedValue(error);

      await controller.deleteCategory(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('should handle other errors during delete', async () => {
      const error = new Error('Database error');

      mockReq.params = { id: '123' };
      mockWasteService.deleteCategory.mockRejectedValue(error);

      await controller.deleteCategory(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
