const WasteCategory = require('../../interface_adapters/schemas/WasteCategory');
const WasteItem = require('../../interface_adapters/schemas/WasteItem');

/**
 * WasteService
 * Service layer for handling business logic related to waste categories and items.
 * Implements CRUD operations with pagination, filtering, and search capabilities.
 */
class WasteService {
  // ============================================
  // WASTE CATEGORY OPERATIONS
  // ============================================

  /**
   * Create a new waste category
   * @param {Object} categoryData - Category data (name, description, recyclable, hazardous, compostable)
   * @returns {Object} Created category
   */
  async createCategory(categoryData) {
    const category = new WasteCategory(categoryData);
    return await category.save();
  }

  /**
   * Get all categories with pagination
   * @param {Object} options - Pagination options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 10)
   * @returns {Object} Paginated results with categories and metadata
   */
  async getCategories({ page = 1, limit = 10 }) {
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Execute query with pagination
    const categories = await WasteCategory.find()
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination metadata
    const total = await WasteCategory.countDocuments();
    
    return {
      categories,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get a single category by ID
   * @param {string} id - Category ID
   * @returns {Object} Category document
   */
  async getCategoryById(id) {
    const category = await WasteCategory.findById(id);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }
    return category;
  }

  /**
   * Update a category by ID
   * @param {string} id - Category ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated category
   */
  async updateCategory(id, updateData) {
    // Check if category exists
    const category = await WasteCategory.findById(id);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Perform update with runValidators to ensure data integrity
    const updatedCategory = await WasteCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    return updatedCategory;
  }

  /**
   * Delete a category by ID
   * @param {string} id - Category ID
   * @returns {Object} Deleted category
   */
  async deleteCategory(id) {
    // Delete all waste items associated with this category first
    // This helps maintain referential integrity in case of errors
    await WasteItem.deleteMany({ category: id });

    // Then delete the category itself
    const category = await WasteCategory.findByIdAndDelete(id);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    return category;
  }

  // ============================================
  // WASTE ITEM OPERATIONS
  // ============================================

  /**
   * Create a new waste item
   * @param {Object} itemData - Item data (name, description, category, disposalInstructions, etc.)
   * @returns {Object} Created item with populated category
   */
  async createWasteItem(itemData) {
    // Verify that the category exists before creating the item
    const category = await WasteCategory.findById(itemData.category);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }
    
    const item = new WasteItem(itemData);
    const savedItem = await item.save();
    
    // Return with populated category reference
    return await WasteItem.findById(savedItem._id).populate('category');
  }

  /**
   * Get all waste items with pagination, filtering, and search
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 10)
   * @param {string} options.search - Search term for name (case-insensitive)
   * @param {string} options.category - Filter by category ID
   * @param {boolean} options.recyclable - Filter by recyclable status
   * @param {boolean} options.hazardous - Filter by hazardous status
   * @param {boolean} options.compostable - Filter by compostable status
   * @returns {Object} Paginated results with items and metadata
   */
  async getWasteItems({ 
    page = 1, 
    limit = 10, 
    search = '', 
    category = '',
    recyclable,
    hazardous,
    compostable
  }) {
    // Build the query object for filtering
    const query = {};
    
    // Search filter: case-insensitive regex search on item name
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }
    
    // Category filter: match exact category ObjectId
    if (category && category.trim()) {
      query.category = category.trim();
    }
    
    // Boolean filters: only add if explicitly provided
    // Using $eq operator for clarity with boolean values
    if (recyclable !== undefined && recyclable !== '') {
      query.recyclable = { $eq: recyclable === 'true' || recyclable === true };
    }
    
    if (hazardous !== undefined && hazardous !== '') {
      query.hazardous = { $eq: hazardous === 'true' || hazardous === true };
    }
    
    if (compostable !== undefined && compostable !== '') {
      query.compostable = { $eq: compostable === 'true' || compostable === true };
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Execute query with pagination and populate category reference
    const items = await WasteItem.find(query)
      .populate('category', 'name description') // Only include category name and description
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination metadata
    const total = await WasteItem.countDocuments(query);
    
    return {
      items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get a single waste item by ID
   * @param {string} id - Item ID
   * @returns {Object} Item document with populated category
   */
  async getWasteItemById(id) {
    const item = await WasteItem.findById(id).populate('category');
    if (!item) {
      const error = new Error('Waste item not found');
      error.statusCode = 404;
      throw error;
    }
    return item;
  }

  /**
   * Update a waste item by ID
   * @param {string} id - Item ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated item with populated category
   */
  async updateWasteItem(id, updateData) {
    // If category is being updated, verify it exists
    if (updateData.category) {
      const category = await WasteCategory.findById(updateData.category);
      if (!category) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
      }
    }
    
    // Check if item exists
    const item = await WasteItem.findById(id);
    if (!item) {
      const error = new Error('Waste item not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Perform update
    const updatedItem = await WasteItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category');
    
    return updatedItem;
  }

  /**
   * Delete a waste item by ID
   * @param {string} id - Item ID
   * @returns {Object} Deleted item
   */
  async deleteWasteItem(id) {
    const item = await WasteItem.findByIdAndDelete(id);
    if (!item) {
      const error = new Error('Waste item not found');
      error.statusCode = 404;
      throw error;
    }
    return item;
  }
}

module.exports = WasteService;