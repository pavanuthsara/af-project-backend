const SearchRecyclingCenters = require('../../application/use_cases/SearchRecyclingCenters');
const MongoRecyclingCenterRepository = require('../repositories/MongoRecyclingCenterRepository');

class GetRecyclingCentersByWasteTypeController {
  async handle(req, res) {
    try {
      const wasteType = req.params?.wasteType || req.query?.wasteType;

      if (!wasteType || typeof wasteType !== 'string' || wasteType.trim().length === 0) {
        return res.status(400).json({ error: 'wasteType is required' });
      }

      const recyclingCenterRepository = new MongoRecyclingCenterRepository();
      const searchRecyclingCentersUseCase = new SearchRecyclingCenters(recyclingCenterRepository);

      const recyclingCenters = await searchRecyclingCentersUseCase.execute({
        acceptedWasteTypes: [wasteType.trim()],
      });

      return res.status(200).json({
        wasteType: wasteType.trim(),
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

module.exports = GetRecyclingCentersByWasteTypeController;
