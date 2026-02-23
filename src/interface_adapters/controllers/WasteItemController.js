const WasteService = require('../../application/services/WasteService');

class WasteItemController {
  constructor() {
    this.wasteService = new WasteService();
  }

  validateWasteItemInput = (data) => {
    const requiredFields = ['name', 'category', 'disposalInstructions'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  };

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
      
      this.validateWasteItemInput({ name, category, disposalInstructions });
      
      const item = await this.wasteService.createWasteItem({
        name,
        description,
        category,
        disposalInstructions,
        recyclable: recyclable || false,
        hazardous: hazardous || false,
        compostable: compostable || false
      });
      
      res.status(201).json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  };

  getWasteItems = async (req, res, next) => {
    try {
      const { 
        page, 
        limit, 
        search, 
        category, 
        recyclable, 
        hazardous, 
        compostable 
      } = req.query;
      
      const result = await this.wasteService.getWasteItems({
        page: Math.max(1, parseInt(page) || 1),
        limit: Math.max(1, Math.min(100, parseInt(limit) || 10)),
        search,
        category,
        recyclable,
        hazardous,
        compostable
      });
      
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  getWasteItemById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await this.wasteService.getWasteItemById(id);
      
      res.status(200).json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  };

  updateWasteItem = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedItem = await this.wasteService.updateWasteItem(id, req.body);
      
      res.status(200).json({
        success: true,
        data: updatedItem
      });
    } catch (error) {
      next(error);
    }
  };

  deleteWasteItem = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deletedItem = await this.wasteService.deleteWasteItem(id);
      
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
