const WasteService = require('../../../src/application/services/WasteService');
const WasteCategory = require('../../../src/interface_adapters/schemas/WasteCategory');
const WasteItem = require('../../../src/interface_adapters/schemas/WasteItem');

// Mock the schemas
jest.mock('../../../src/interface_adapters/schemas/WasteCategory');
jest.mock('../../../src/interface_adapters/schemas/WasteItem');

describe('WasteService', () => {
  let wasteService;

  beforeEach(() => {
    wasteService = new WasteService();
    jest.clearAllMocks();
  });

  describe('Category Management', () => {
    describe('createCategory', () => {
      test('should successfully create a new category', async () => {
        const categoryData = {
          name: 'Plastic',
          description: 'Plastic waste items',
          recyclable: true,
          hazardous: false,
          compostable: false
        };

        const mockCategory = { ...categoryData, _id: '123', save: jest.fn() };
        mockCategory.save.mockResolvedValue(mockCategory);
        WasteCategory.mockImplementation(() => mockCategory);

        const result = await wasteService.createCategory(categoryData);

        expect(WasteCategory).toHaveBeenCalledWith(categoryData);
        expect(mockCategory.save).toHaveBeenCalled();
        expect(result).toEqual(mockCategory);
      });
    });

    describe('getCategories', () => {
      test('should return paginated categories with metadata', async () => {
        const mockCategories = [
          { _id: '1', name: 'Plastic', description: 'Plastic items' },
          { _id: '2', name: 'E-waste', description: 'Electronic waste' }
        ];

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockCategories)
        };

        WasteCategory.find = jest.fn().mockReturnValue(mockQuery);
        WasteCategory.countDocuments = jest.fn().mockResolvedValue(2);

        const result = await wasteService.getCategories({ page: 1, limit: 10 });

        expect(result.categories).toEqual(mockCategories);
        expect(result.pagination).toEqual({
          currentPage: 1,
          totalPages: 1,
          totalItems: 2,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        });
      });

      test('should handle pagination correctly for multiple pages', async () => {
        const mockCategories = Array(10).fill({ name: 'Category' });

        const mockQuery = {
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockCategories)
        };

        WasteCategory.find = jest.fn().mockReturnValue(mockQuery);
        WasteCategory.countDocuments = jest.fn().mockResolvedValue(25);

        const result = await wasteService.getCategories({ page: 2, limit: 10 });

        expect(mockQuery.skip).toHaveBeenCalledWith(10);
        expect(result.pagination.hasNextPage).toBe(true);
        expect(result.pagination.hasPrevPage).toBe(true);
        expect(result.pagination.totalPages).toBe(3);
      });
    });

    describe('getCategoryById', () => {
      test('should return category when found', async () => {
        const mockCategory = {
          _id: '123',
          name: 'Plastic',
          description: 'Plastic waste'
        };

        WasteCategory.findById = jest.fn().mockResolvedValue(mockCategory);

        const result = await wasteService.getCategoryById('123');

        expect(WasteCategory.findById).toHaveBeenCalledWith('123');
        expect(result).toEqual(mockCategory);
      });

      test('should throw 404 error when category not found', async () => {
        WasteCategory.findById = jest.fn().mockResolvedValue(null);

        await expect(wasteService.getCategoryById('nonexistent'))
          .rejects.toThrow('Category not found');

        try {
          await wasteService.getCategoryById('nonexistent');
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });
    });

    describe('updateCategory', () => {
      test('should successfully update category', async () => {
        const updateData = { name: 'Updated Plastic' };
        const mockCategory = { _id: '123', name: 'Plastic' };
        const updatedCategory = { _id: '123', name: 'Updated Plastic' };

        WasteCategory.findById = jest.fn().mockResolvedValue(mockCategory);
        WasteCategory.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedCategory);

        const result = await wasteService.updateCategory('123', updateData);

        expect(WasteCategory.findById).toHaveBeenCalledWith('123');
        expect(WasteCategory.findByIdAndUpdate).toHaveBeenCalledWith(
          '123',
          updateData,
          { new: true, runValidators: true }
        );
        expect(result).toEqual(updatedCategory);
      });

      test('should throw 404 when updating non-existent category', async () => {
        WasteCategory.findById = jest.fn().mockResolvedValue(null);

        await expect(wasteService.updateCategory('nonexistent', {}))
          .rejects.toThrow('Category not found');

        try {
          await wasteService.updateCategory('nonexistent', {});
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });
    });

    describe('deleteCategory', () => {
      test('should delete category and associated items', async () => {
        const mockCategory = { _id: '123', name: 'Plastic' };

        WasteItem.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });
        WasteCategory.findByIdAndDelete = jest.fn().mockResolvedValue(mockCategory);

        const result = await wasteService.deleteCategory('123');

        expect(WasteItem.deleteMany).toHaveBeenCalledWith({ category: '123' });
        expect(WasteCategory.findByIdAndDelete).toHaveBeenCalledWith('123');
        expect(result).toEqual(mockCategory);
      });

      test('should throw 404 when deleting non-existent category', async () => {
        WasteItem.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
        WasteCategory.findByIdAndDelete = jest.fn().mockResolvedValue(null);

        await expect(wasteService.deleteCategory('nonexistent'))
          .rejects.toThrow('Category not found');

        try {
          await wasteService.deleteCategory('nonexistent');
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });
    });
  });

  describe('Waste Item Management', () => {
    describe('createWasteItem', () => {
      test('should successfully create a waste item', async () => {
        const itemData = {
          name: 'Plastic Bottle',
          category: 'cat123',
          disposalInstructions: 'Rinse and recycle',
          recyclable: true
        };

        const mockCategory = { _id: 'cat123', name: 'Plastic' };
        const mockItem = { 
          ...itemData, 
          _id: 'item123',
          save: jest.fn().mockResolvedValue({ _id: 'item123' })
        };
        const mockPopulatedItem = { ...mockItem, category: mockCategory };

        WasteCategory.findById = jest.fn().mockResolvedValue(mockCategory);
        WasteItem.mockImplementation(() => mockItem);
        
        const mockQuery = {
          populate: jest.fn().mockResolvedValue(mockPopulatedItem)
        };
        WasteItem.findById = jest.fn().mockReturnValue(mockQuery);

        const result = await wasteService.createWasteItem(itemData);

        expect(WasteCategory.findById).toHaveBeenCalledWith('cat123');
        expect(mockItem.save).toHaveBeenCalled();
        expect(result).toEqual(mockPopulatedItem);
      });

      test('should throw 404 when category does not exist', async () => {
        const itemData = {
          name: 'Plastic Bottle',
          category: 'nonexistent',
          disposalInstructions: 'Rinse and recycle'
        };

        WasteCategory.findById = jest.fn().mockResolvedValue(null);

        await expect(wasteService.createWasteItem(itemData))
          .rejects.toThrow('Category not found');

        try {
          await wasteService.createWasteItem(itemData);
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });
    });

    describe('getWasteItems', () => {
      test('should return paginated waste items with filters', async () => {
        const mockItems = [
          { _id: '1', name: 'Bottle', category: { name: 'Plastic' } },
          { _id: '2', name: 'Can', category: { name: 'Metal' } }
        ];

        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockItems)
        };

        WasteItem.find = jest.fn().mockReturnValue(mockQuery);
        WasteItem.countDocuments = jest.fn().mockResolvedValue(2);

        const result = await wasteService.getWasteItems({
          page: 1,
          limit: 10,
          search: 'bottle',
          category: 'cat123'
        });

        expect(WasteItem.find).toHaveBeenCalledWith({
          name: { $regex: 'bottle', $options: 'i' },
          category: 'cat123'
        });
        expect(result.items).toEqual(mockItems);
        expect(result.pagination.totalItems).toBe(2);
      });

      test('should handle boolean filters correctly', async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };

        WasteItem.find = jest.fn().mockReturnValue(mockQuery);
        WasteItem.countDocuments = jest.fn().mockResolvedValue(0);

        await wasteService.getWasteItems({
          page: 1,
          limit: 10,
          recyclable: 'true',
          hazardous: 'false',
          compostable: true
        });

        expect(WasteItem.find).toHaveBeenCalledWith({
          recyclable: { $eq: true },
          hazardous: { $eq: false },
          compostable: { $eq: true }
        });
      });

      test('should handle empty filters', async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([])
        };

        WasteItem.find = jest.fn().mockReturnValue(mockQuery);
        WasteItem.countDocuments = jest.fn().mockResolvedValue(0);

        await wasteService.getWasteItems({ page: 1, limit: 10 });

        expect(WasteItem.find).toHaveBeenCalledWith({});
      });
    });

    describe('getWasteItemById', () => {
      test('should return waste item when found', async () => {
        const mockItem = {
          _id: '123',
          name: 'Plastic Bottle',
          category: { name: 'Plastic' }
        };

        const mockQuery = {
          populate: jest.fn().mockResolvedValue(mockItem)
        };

        WasteItem.findById = jest.fn().mockReturnValue(mockQuery);

        const result = await wasteService.getWasteItemById('123');

        expect(WasteItem.findById).toHaveBeenCalledWith('123');
        expect(mockQuery.populate).toHaveBeenCalledWith('category');
        expect(result).toEqual(mockItem);
      });

      test('should throw 404 when item not found', async () => {
        const mockQuery = {
          populate: jest.fn().mockResolvedValue(null)
        };

        WasteItem.findById = jest.fn().mockReturnValue(mockQuery);

        await expect(wasteService.getWasteItemById('nonexistent'))
          .rejects.toThrow('Waste item not found');

        try {
          await wasteService.getWasteItemById('nonexistent');
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });
    });

    describe('updateWasteItem', () => {
      test('should successfully update waste item', async () => {
        const updateData = { name: 'Updated Bottle' };
        const mockItem = { _id: '123', name: 'Bottle' };
        const updatedItem = { _id: '123', name: 'Updated Bottle' };

        WasteItem.findById = jest.fn().mockResolvedValue(mockItem);
        
        const mockQuery = {
          populate: jest.fn().mockResolvedValue(updatedItem)
        };
        WasteItem.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);

        const result = await wasteService.updateWasteItem('123', updateData);

        expect(WasteItem.findById).toHaveBeenCalledWith('123');
        expect(WasteItem.findByIdAndUpdate).toHaveBeenCalledWith(
          '123',
          updateData,
          { new: true, runValidators: true }
        );
        expect(result).toEqual(updatedItem);
      });

      test('should verify category exists when updating category', async () => {
        const updateData = { category: 'newcat123' };
        const mockItem = { _id: '123', name: 'Bottle' };
        const mockCategory = { _id: 'newcat123', name: 'New Category' };

        WasteCategory.findById = jest.fn().mockResolvedValue(mockCategory);
        WasteItem.findById = jest.fn().mockResolvedValue(mockItem);
        
        const mockQuery = {
          populate: jest.fn().mockResolvedValue({ ...mockItem, ...updateData })
        };
        WasteItem.findByIdAndUpdate = jest.fn().mockReturnValue(mockQuery);

        await wasteService.updateWasteItem('123', updateData);

        expect(WasteCategory.findById).toHaveBeenCalledWith('newcat123');
      });

      test('should throw 404 when category does not exist during update', async () => {
        const updateData = { category: 'nonexistent' };
        const mockItem = { _id: '123', name: 'Bottle' };

        WasteCategory.findById = jest.fn().mockResolvedValue(null);
        WasteItem.findById = jest.fn().mockResolvedValue(mockItem);

        await expect(wasteService.updateWasteItem('123', updateData))
          .rejects.toThrow('Category not found');

        try {
          await wasteService.updateWasteItem('123', updateData);
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });

      test('should throw 404 when item does not exist', async () => {
        WasteItem.findById = jest.fn().mockResolvedValue(null);

        await expect(wasteService.updateWasteItem('nonexistent', {}))
          .rejects.toThrow('Waste item not found');

        try {
          await wasteService.updateWasteItem('nonexistent', {});
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });
    });

    describe('deleteWasteItem', () => {
      test('should successfully delete waste item', async () => {
        const mockItem = { _id: '123', name: 'Bottle' };

        WasteItem.findByIdAndDelete = jest.fn().mockResolvedValue(mockItem);

        const result = await wasteService.deleteWasteItem('123');

        expect(WasteItem.findByIdAndDelete).toHaveBeenCalledWith('123');
        expect(result).toEqual(mockItem);
      });

      test('should throw 404 when item does not exist', async () => {
        WasteItem.findByIdAndDelete = jest.fn().mockResolvedValue(null);

        await expect(wasteService.deleteWasteItem('nonexistent'))
          .rejects.toThrow('Waste item not found');

        try {
          await wasteService.deleteWasteItem('nonexistent');
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });
    });
  });
});
