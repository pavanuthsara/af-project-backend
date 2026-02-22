const RegisterTruck = require('../../application/use_cases/RegisterTruck');
const MongoTruckRepository = require('../repositories/MongoTruckRepository');

class RegisterTruckController {
  async handle(req, res) {
    try {
      const { make, model, year, licensePlate } = req.body;

      const truckRepository = new MongoTruckRepository();
      const registerTruckUseCase = new RegisterTruck(truckRepository);

      const truck = await registerTruckUseCase.execute(make, model, year, licensePlate);

      return res.status(201).json({
        message: 'Truck registered successfully',
        truck
      });

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = RegisterTruckController;
