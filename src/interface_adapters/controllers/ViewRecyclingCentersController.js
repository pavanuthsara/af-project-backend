const ViewRecyclingCenters = require('../../application/use_cases/ViewRecyclingCenters');
const MongoRecyclingCenterRepository = require('../repositories/MongoRecyclingCenterRepository');

class ViewRecyclingCentersController {
  async handle(req, res) {
    try {
      const recyclingCenterRepository = new MongoRecyclingCenterRepository();
      const viewRecyclingCentersUseCase = new ViewRecyclingCenters(recyclingCenterRepository);

      const recyclingCenters = await viewRecyclingCentersUseCase.execute();

      return res.status(200).json({
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
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = ViewRecyclingCentersController;
