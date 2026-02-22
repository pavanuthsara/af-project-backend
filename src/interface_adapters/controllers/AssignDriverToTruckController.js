const AssignDriverToTruck = require('../../application/use_cases/AssignDriverToTruck');
const MongoTruckRepository = require('../repositories/MongoTruckRepository');
const MongoDriverRepository = require('../repositories/MongoDriverRepository');

class AssignDriverToTruckController {
  async handle(req, res) {
    try {
      const { truckId, driverId } = req.body;

      const truckRepository = new MongoTruckRepository();
      const driverRepository = new MongoDriverRepository();
      const assignDriverToTruckUseCase = new AssignDriverToTruck(truckRepository, driverRepository);

      const truck = await assignDriverToTruckUseCase.execute(truckId, driverId);

      return res.status(200).json({
        message: 'Driver assigned to truck successfully',
        truck
      });

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = AssignDriverToTruckController;
