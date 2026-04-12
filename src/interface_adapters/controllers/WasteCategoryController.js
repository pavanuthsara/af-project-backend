const WasteService = require('../../application/services/WasteService');


class WasteCategoryController {
  constructor() {
    this.wasteService = new WasteService();
  }


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

  
  getCategories = async (req, res, next) => {
    try {
      // Extract pagination parameters from query string
      // paginate=false returns all categories (used for validation dropdowns)
      const { page, limit, paginate } = req.query;
      
      // Get categories from service (paginated or full list)
      const result = await this.wasteService.getCategories({ 
        page: parseInt(page) || 1, 
        limit: parseInt(limit) || 10,
        paginate: paginate === 'false' ? false : true,
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

 
  deleteCategory = async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Delete category through service
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
