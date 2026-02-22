const RegisterRecyclingCenter = require('../../application/use_cases/RegisterRecyclingCenter');
const MongoRecyclingCenterRepository = require('../repositories/MongoRecyclingCenterRepository');

class RegisterRecyclingCenterController {
  async handle(req, res) {
    try {
      const {
        name,
        address,
        location,
        acceptedWasteTypes,
        operatingHours,
        maxCapacityKg,
        currentLoadKg,
      } = req.body;

      const recyclingCenterRepository = new MongoRecyclingCenterRepository();
      const registerRecyclingCenterUseCase = new RegisterRecyclingCenter(recyclingCenterRepository);

      const recyclingCenter = await registerRecyclingCenterUseCase.execute({
        name,
        address,
        location,
        acceptedWasteTypes,
        operatingHours,
        maxCapacityKg,
        currentLoadKg,
      });

      return res.status(201).json({
        message: 'Recycling center registered successfully',
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
      if (error.statusCode === 409) {
        return res.status(409).json({ error: error.message });
      }

      if (error.statusCode === 400 || error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = RegisterRecyclingCenterController;
