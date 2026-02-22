const DriverRepository = require('../../domain/repositories/DriverRepository');
const Driver = require('../../domain/entities/Driver');
const DriverSchema = require('../schemas/DriverSchema');

class MongoDriverRepository extends DriverRepository {
  async save(driver) {
    const newDriver = new DriverSchema({
      name: driver.name,
      licenseNumber: driver.licenseNumber
    });
    const savedDriver = await newDriver.save();
    return new Driver(savedDriver.id, savedDriver.name, savedDriver.licenseNumber);
  }

  async findById(id) {
    const driver = await DriverSchema.findById(id);
    if (!driver) {
      return null;
    }
    return new Driver(driver.id, driver.name, driver.licenseNumber);
  }

  async findByLicenseNumber(licenseNumber) {
    const driver = await DriverSchema.findOne({ licenseNumber });
    if (!driver) {
      return null;
    }
    return new Driver(driver.id, driver.name, driver.licenseNumber);
  }
}

module.exports = MongoDriverRepository;
