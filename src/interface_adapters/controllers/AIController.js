const fs = require('fs');
const path = require('path');
const GeminiService = require('../../infrastructure/ai/GeminiService');
const WasteItemSchema = require('../schemas/WasteItem');

class AIController {
  constructor() {
    this.geminiService = new GeminiService();
  }

  identifyWaste = async (req, res, next) => {
    try {
      if (!req.file) {
        throw new Error('No image file uploaded');
      }

      const mimeType = req.file.mimetype;
      const imagePath = req.file.path;

      const result = await this.geminiService.identifyWasteFromImage(imagePath, mimeType);

      if (!result || !result.itemName) {
        fs.unlinkSync(imagePath);
        return res.status(400).json({
          success: false,
          message: 'Unable to identify the image'
        });
      }

      const detectedLabel = result.itemName;
      const confidence = result.confidence || 'unknown';

      const wasteItem = await WasteItemSchema.findOne({
        name: { $regex: new RegExp(detectedLabel, 'i') }
      }).populate('category');

      fs.unlinkSync(imagePath);

      if (wasteItem) {
        return res.status(200).json({
          success: true,
          foundInDatabase: true,
          detectedLabel,
          confidence,
          disposalInstructions: wasteItem.disposalInstructions || 'No disposal instructions available',
          category: wasteItem.category
        });
      }

      return res.status(200).json({
        success: true,
        foundInDatabase: false,
        message: 'Item not found in database',
        detectedLabel,
        confidence,
        disposalInstructions: null,
        category: null
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  };
}

module.exports = AIController;
