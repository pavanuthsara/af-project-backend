const GetRecyclingCenterById = require('../../application/use_cases/GetRecyclingCenterById');
const MongoRecyclingCenterRepository = require('../repositories/MongoRecyclingCenterRepository');

class GetRecyclingCenterByIdController {
  async handle(req, res) {
    try {
      const { id } = req.params;

      const recyclingCenterRepository = new MongoRecyclingCenterRepository();
      const getRecyclingCenterByIdUseCase = new GetRecyclingCenterById(recyclingCenterRepository);

      const recyclingCenter = await getRecyclingCenterByIdUseCase.execute(id);

      return res.status(200).json({
        recyclingCenter: {
          id: recyclingCenter.id,
          name: recyclingCenter.name,
          address: recyclingCenter.address,
          location: recyclingCenter.location,
          acceptedWasteTypes: recyclingCenter.acceptedWasteTypes,
          operatingHours: recyclingCenter.operatingHours,
          maxCapacityKg: recyclingCenter.maxCapacityKg,
          currentLoadKg: recyclingCenter.currentLoadKg,
        },
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({ error: error.message || 'Internal server error' });
    }
  }
}

module.exports = GetRecyclingCenterByIdController;
