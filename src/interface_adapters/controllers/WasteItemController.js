const WasteService = require('../../application/services/WasteService');

/**
 * WasteItemController
 * Handles HTTP requests related to waste items.
 * Calls the service layer for business logic and returns appropriate HTTP responses.
 */
class WasteItemController {
  constructor() {
    this.wasteService = new WasteService();
  }

  /**
   * Create a new waste item
   * POST /api/items
   * Admin only - requires authentication and admin role
   */
  createWasteItem = async (req, res, next) => {
    try {
      const { 
        name, 
        description, 
        category, 
        disposalInstructions, 
        recyclable, 
        hazardous, 
        compostable 
      } = req.body;
      
      // Create item through service layer
      const item = await this.wasteService.createWasteItem({
        name,
        description,
        category,
        disposalInstructions,
        recyclable: recyclable || false,
        hazardous: hazardous || false,
        compostable: compostable || false
      });
      
      // Return success response with 201 Created status
      res.status(201).json({
        success: true,
        data: item
      });
    } catch (error) {
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationError = new Error(Object.values(error.errors).map(e => e.message).join(', '));
        validationError.statusCode = 400;
        return next(validationError);
      }
      next(error);
    }
  };

  /**
   * Get all waste items with pagination, filtering, and search
   * GET /api/items?page=1&limit=10&search=plastic&category=xxx&recyclable=true
   * Public route - no authentication required
   */
  getWasteItems = async (req, res, next) => {
    try {
      // Extract query parameters for pagination, search, and filtering
      const { 
        page, 
        limit, 
        search, 
        category, 
        recyclable, 
        hazardous, 
        compostable 
      } = req.query;
      
      // Get paginated and filtered items from service
      const result = await this.wasteService.getWasteItems({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        category,
        recyclable,
        hazardous,
        compostable
      });
      
      // Return success response
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single waste item by ID
   * GET /api/items/:id
   * Public route - no authentication required
   */
  getWasteItemById = async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Get item from service
      const item = await this.wasteService.getWasteItemById(id);
      
      // Return success response
      res.status(200).json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a waste item by ID
   * PUT /api/items/:id
   * Admin only - requires authentication and admin role
   */
  updateWasteItem = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Update item through service
      const updatedItem = await this.wasteService.updateWasteItem(id, updateData);
      
      // Return success response
      res.status(200).json({
        success: true,
        data: updatedItem
      });
    } catch (error) {
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationError = new Error(Object.values(error.errors).map(e => e.message).join(', '));
        validationError.statusCode = 400;
        return next(validationError);
      }
      next(error);
    }
  };

  /**
   * Delete a waste item by ID
   * DELETE /api/items/:id
   * Admin only - requires authentication and admin role
   */
  deleteWasteItem = async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Delete item through service
      const deletedItem = await this.wasteService.deleteWasteItem(id);
      
      // Return success response
      res.status(200).json({
        success: true,
        data: deletedItem,
        message: 'Waste item deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = WasteItemController;