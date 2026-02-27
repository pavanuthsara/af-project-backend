const SearchRecyclingCenters = require('../../application/use_cases/SearchRecyclingCenters');
const MongoRecyclingCenterRepository = require('../repositories/MongoRecyclingCenterRepository');
const GeminiService = require('../../infrastructure/ai/GeminiService');

class SearchRecyclingCentersController {
  async handle(req, res) {
    try {
      const query = req.body?.query || req.body?.q;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query is required' });
      }

      const geminiService = new GeminiService();
      const filters = await geminiService.extractSearchFilters(query);

      const recyclingCenterRepository = new MongoRecyclingCenterRepository();
      const searchRecyclingCentersUseCase = new SearchRecyclingCenters(recyclingCenterRepository);

      const recyclingCenters = await searchRecyclingCentersUseCase.execute(filters);

      return res.status(200).json({
        query,
        filters,
        recyclingCenters: recyclingCenters.map((recyclingCenter) => ({
          id: recyclingCenter.id,
          name: recyclingCenter.name,
          address: recyclingCenter.address,
          location: recyclingCenter.location,
          acceptedWasteTypes: recyclingCenter.acceptedWasteTypes,
          operatingHours: recyclingCenter.operatingHours,
          maxCapacityKg: recyclingCenter.maxCapacityKg,
          currentLoadKg: recyclingCenter.currentLoadKg,
        })),
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }
}

module.exports = SearchRecyclingCentersController;
