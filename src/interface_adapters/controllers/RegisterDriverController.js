const RegisterDriver = require('../../application/use_cases/RegisterDriver');
const MongoDriverRepository = require('../repositories/MongoDriverRepository');

class RegisterDriverController {
  async handle(req, res) {
    try {
      const { name, licenseNumber } = req.body;

      const driverRepository = new MongoDriverRepository();
      const registerDriverUseCase = new RegisterDriver(driverRepository);

      const driver = await registerDriverUseCase.execute(name, licenseNumber);

      return res.status(201).json({
        message: 'Driver registered successfully',
        driver
      });

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = RegisterDriverController;
