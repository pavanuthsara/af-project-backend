const WasteItemController = require('../../../src/interface_adapters/controllers/WasteItemController');
const WasteService = require('../../../src/application/services/WasteService');

// Mock the WasteService
jest.mock('../../../src/application/services/WasteService');

describe('WasteItemController', () => {
  let controller;
  let mockWasteService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockWasteService = {
      createWasteItem: jest.fn(),
      getWasteItems: jest.fn(),
      getWasteItemById: jest.fn(),
      updateWasteItem: jest.fn(),
      deleteWasteItem: jest.fn()
    };

    WasteService.mockImplementation(() => mockWasteService);
    controller = new WasteItemController();

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

  describe('validateWasteItemInput', () => {
    test('should not throw error when all required fields are present', () => {
      const validData = {
        name: 'Plastic Bottle',
        category: 'cat123'
      };

      expect(() => controller.validateWasteItemInput(validData)).not.toThrow();
    });

    test('should throw error when name is missing', () => {
      const invalidData = {
        category: 'cat123'
      };

      expect(() => controller.validateWasteItemInput(invalidData))
        .toThrow('Missing required fields: name');
    });

    test('should throw error when multiple fields are missing', () => {
      const invalidData = {
        name: 'Plastic Bottle'
      };

      expect(() => controller.validateWasteItemInput(invalidData))
        .toThrow('Missing required fields: category');
    });

    test('should throw error when all required fields are missing', () => {
      const invalidData = {};

      expect(() => controller.validateWasteItemInput(invalidData))
        .toThrow('Missing required fields: name, category');
    });
  });

  describe('createWasteItem', () => {
    test('should create waste item successfully', async () => {
      const itemData = {
        name: 'Plastic Bottle',
        description: 'PET bottle',
        category: 'cat123',
        recyclable: true,
        hazardous: false,
        compostable: false
      };

      const mockItem = { _id: 'item123', ...itemData };

      mockReq.body = itemData;
      mockWasteService.createWasteItem.mockResolvedValue(mockItem);

      await controller.createWasteItem(mockReq, mockRes, mockNext);

      expect(mockWasteService.createWasteItem).toHaveBeenCalledWith(itemData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockItem
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should use default false for boolean fields when not provided', async () => {
      const itemData = {
        name: 'Glass Jar',
        category: 'cat123'
      };

      const expectedData = {
        ...itemData,
        recyclable: false,
        hazardous: false,
        compostable: false
      };

      mockReq.body = itemData;
      mockWasteService.createWasteItem.mockResolvedValue({ _id: 'item123', ...expectedData });

      await controller.createWasteItem(mockReq, mockRes, mockNext);

      expect(mockWasteService.createWasteItem).toHaveBeenCalledWith(expectedData);
    });

    test('should handle validation error for missing required fields', async () => {
      mockReq.body = {
        name: 'Plastic Bottle'
        // missing category
      };

      await controller.createWasteItem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const errorArg = mockNext.mock.calls[0][0];
      expect(errorArg.message).toContain('Missing required fields');
    });

    test('should handle category not found error', async () => {
      const error = new Error('Category not found');
      error.statusCode = 404;

      mockReq.body = {
        name: 'Plastic Bottle',
        category: 'nonexistent'
      };

      mockWasteService.createWasteItem.mockRejectedValue(error);

      await controller.createWasteItem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('should handle other errors', async () => {
      const error = new Error('Database error');

      mockReq.body = {
        name: 'Plastic Bottle',
        category: 'cat123'
      };

      mockWasteService.createWasteItem.mockRejectedValue(error);

      await controller.createWasteItem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getWasteItems', () => {
    test('should get waste items with pagination and filters', async () => {
      const mockResult = {
        items: [
          { _id: '1', name: 'Bottle', category: { name: 'Plastic' } },
          { _id: '2', name: 'Can', category: { name: 'Metal' } }
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

      mockReq.query = {
        page: '1',
        limit: '10',
        search: 'bottle',
        category: 'cat123',
        recyclable: 'true'
      };

      mockWasteService.getWasteItems.mockResolvedValue(mockResult);

      await controller.getWasteItems(mockReq, mockRes, mockNext);

      expect(mockWasteService.getWasteItems).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'bottle',
        category: 'cat123',
        recyclable: 'true',
        hazardous: undefined,
        compostable: undefined
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult.items,
        pagination: mockResult.pagination
      });
    });

    test('should handle pagination with default values', async () => {
      const mockResult = {
        items: [],
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
      mockWasteService.getWasteItems.mockResolvedValue(mockResult);

      await controller.getWasteItems(mockReq, mockRes, mockNext);

      expect(mockWasteService.getWasteItems).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        category: undefined,
        recyclable: undefined,
        hazardous: undefined,
        compostable: undefined
      });
    });

    test('should enforce minimum pagination values', async () => {
      const mockResult = {
        items: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockReq.query = {
        page: '-1',
        limit: '-5'
      };

      mockWasteService.getWasteItems.mockResolvedValue(mockResult);

      await controller.getWasteItems(mockReq, mockRes, mockNext);

      // Page should be at least 1, limit should be at least 1
      const callArgs = mockWasteService.getWasteItems.mock.calls[0][0];
      expect(callArgs.page).toBeGreaterThanOrEqual(1);
      expect(callArgs.limit).toBeGreaterThanOrEqual(1);
    });

    test('should enforce maximum limit value', async () => {
      const mockResult = {
        items: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 100,
          hasNextPage: false,
          hasPrevPage: false
        }
      };

      mockReq.query = {
        limit: '200'
      };

      mockWasteService.getWasteItems.mockResolvedValue(mockResult);

      await controller.getWasteItems(mockReq, mockRes, mockNext);

      expect(mockWasteService.getWasteItems).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100
        })
      );
    });

    test('should handle errors', async () => {
      const error = new Error('Database error');
      mockWasteService.getWasteItems.mockRejectedValue(error);

      await controller.getWasteItems(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getWasteItemById', () => {
    test('should get waste item by id successfully', async () => {
      const mockItem = {
        _id: '123',
        name: 'Plastic Bottle',
        category: { name: 'Plastic' }
      };

      mockReq.params = { id: '123' };
      mockWasteService.getWasteItemById.mockResolvedValue(mockItem);

      await controller.getWasteItemById(mockReq, mockRes, mockNext);

      expect(mockWasteService.getWasteItemById).toHaveBeenCalledWith('123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockItem
      });
    });

    test('should handle item not found', async () => {
      const error = new Error('Waste item not found');
      error.statusCode = 404;

      mockReq.params = { id: 'nonexistent' };
      mockWasteService.getWasteItemById.mockRejectedValue(error);

      await controller.getWasteItemById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateWasteItem', () => {
    test('should update waste item successfully', async () => {
      const updateData = {
        name: 'Updated Bottle',
        description: 'Updated description'
      };

      const mockUpdatedItem = {
        _id: '123',
        ...updateData,
        category: { name: 'Plastic' }
      };

      mockReq.params = { id: '123' };
      mockReq.body = updateData;
      mockWasteService.updateWasteItem.mockResolvedValue(mockUpdatedItem);

      await controller.updateWasteItem(mockReq, mockRes, mockNext);

      expect(mockWasteService.updateWasteItem).toHaveBeenCalledWith('123', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedItem
      });
    });

    test('should handle item not found during update', async () => {
      const error = new Error('Waste item not found');
      error.statusCode = 404;

      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { name: 'Updated' };
      mockWasteService.updateWasteItem.mockRejectedValue(error);

      await controller.updateWasteItem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('should handle category not found during update', async () => {
      const error = new Error('Category not found');
      error.statusCode = 404;

      mockReq.params = { id: '123' };
      mockReq.body = { category: 'nonexistent' };
      mockWasteService.updateWasteItem.mockRejectedValue(error);

      await controller.updateWasteItem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('should handle other errors', async () => {
      const error = new Error('Database error');

      mockReq.params = { id: '123' };
      mockReq.body = { name: 'Updated' };
      mockWasteService.updateWasteItem.mockRejectedValue(error);

      await controller.updateWasteItem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteWasteItem', () => {
    test('should delete waste item successfully', async () => {
      const mockDeletedItem = {
        _id: '123',
        name: 'Plastic Bottle'
      };

      mockReq.params = { id: '123' };
      mockWasteService.deleteWasteItem.mockResolvedValue(mockDeletedItem);

      await controller.deleteWasteItem(mockReq, mockRes, mockNext);

      expect(mockWasteService.deleteWasteItem).toHaveBeenCalledWith('123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDeletedItem,
        message: 'Waste item deleted successfully'
      });
    });

    test('should handle item not found during delete', async () => {
      const error = new Error('Waste item not found');
      error.statusCode = 404;

      mockReq.params = { id: 'nonexistent' };
      mockWasteService.deleteWasteItem.mockRejectedValue(error);

      await controller.deleteWasteItem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('should handle other errors during delete', async () => {
      const error = new Error('Database error');

      mockReq.params = { id: '123' };
      mockWasteService.deleteWasteItem.mockRejectedValue(error);

      await controller.deleteWasteItem(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
