const Driver = require('../../domain/entities/Driver');

class RegisterDriver {
  constructor(driverRepository) {
    this.driverRepository = driverRepository;
  }

  async execute(name, licenseNumber) {
    const existingDriver = await this.driverRepository.findByLicenseNumber(licenseNumber);
    if (existingDriver) {
      throw new Error('Driver with this license number already exists');
    }

    const newDriver = new Driver(null, name, licenseNumber);
    return await this.driverRepository.save(newDriver);
  }
}

module.exports = RegisterDriver;
