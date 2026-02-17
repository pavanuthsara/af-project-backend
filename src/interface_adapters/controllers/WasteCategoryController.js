const WasteService = require('../../application/services/WasteService');

/**
 * WasteCategoryController
 * Handles HTTP requests related to waste categories.
 * Calls the service layer for business logic and returns appropriate HTTP responses.
 */
class WasteCategoryController {
  constructor() {
    this.wasteService = new WasteService();
  }

  /**
   * Create a new waste category
   * POST /api/categories
   * Admin only - requires authentication and admin role
   */
  createCategory = async (req, res, next) => {
    try {
      const { name, description, recyclable, hazardous, compostable } = req.body;
      
      // Create category through service layer
      const category = await this.wasteService.createCategory({
        name,
        description,
        recyclable: recyclable || false,
        hazardous: hazardous || false,
        compostable: compostable || false
      });
      
      // Return success response with 201 Created status
      res.status(201).json({
        success: true,
        data: category
      });
    } catch (error) {
      // Handle duplicate key error (unique name constraint)
      if (error.code === 11000) {
        const duplicateError = new Error('Category name already exists');
        duplicateError.statusCode = 400;
        return next(duplicateError);
      }
      next(error);
    }
  };

  /**
   * Get all categories with pagination
   * GET /api/categories?page=1&limit=10
   * Public route - no authentication required
   */
  getCategories = async (req, res, next) => {
    try {
      // Extract pagination parameters from query string
      const { page, limit } = req.query;
      
      // Get paginated categories from service
      const result = await this.wasteService.getCategories({ 
        page: parseInt(page) || 1, 
        limit: parseInt(limit) || 10 
      });
      
      // Return success response
      res.status(200).json({
        success: true,
        data: result.categories,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single category by ID
   * GET /api/categories/:id
   * Public route - no authentication required
   */
  getCategoryById = async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Get category from service
      const category = await this.wasteService.getCategoryById(id);
      
      // Return success response
      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a category by ID
   * PUT /api/categories/:id
   * Admin only - requires authentication and admin role
   */
  updateCategory = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Update category through service
      const updatedCategory = await this.wasteService.updateCategory(id, updateData);
      
      // Return success response
      res.status(200).json({
        success: true,
        data: updatedCategory
      });
    } catch (error) {
      // Handle duplicate key error
      if (error.code === 11000) {
        const duplicateError = new Error('Category name already exists');
        duplicateError.statusCode = 400;
        return next(duplicateError);
      }
      next(error);
    }
  };

  /**
   * Delete a category by ID
   * DELETE /api/categories/:id
   * Admin only - requires authentication and admin role
   */
  deleteCategory = async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Delete category through service
      // Note: This will also delete all waste items in this category
      const deletedCategory = await this.wasteService.deleteCategory(id);
      
      // Return success response
      res.status(200).json({
        success: true,
        data: deletedCategory,
        message: 'Category and associated items deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = WasteCategoryController;