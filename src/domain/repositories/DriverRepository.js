class DriverRepository {
  async save(driver) {
    throw new Error('Method not implemented: save');
  }

  async findById(id) {
    throw new Error('Method not implemented: findById');
  }

  async findByLicenseNumber(licenseNumber) {
    throw new Error('Method not implemented: findByLicenseNumber');
  }
}

module.exports = DriverRepository;
