const WasteCategory = require('../../interface_adapters/schemas/WasteCategory');
const WasteItem = require('../../interface_adapters/schemas/WasteItem');


class WasteService {
  
  async createCategory(categoryData) {
    const category = new WasteCategory(categoryData);
    return await category.save();
  }

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

  async getCategoryById(id) {
    const category = await WasteCategory.findById(id);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }
    return category;
  }

  
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
    await WasteItem.deleteMany({ category: id });
    
    return category;
  }

  
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

  
  async getWasteItemById(id) {
    const item = await WasteItem.findById(id).populate('category');
    if (!item) {
      const error = new Error('Waste item not found');
      error.statusCode = 404;
      throw error;
    }
    return item;
  }

  
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
