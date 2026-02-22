class TruckRepository {
  async save(truck) {
    throw new Error('Method not implemented: save');
  }

  async findById(id) {
    throw new Error('Method not implemented: findById');
  }

  async findByLicensePlate(licensePlate) {
    throw new Error('Method not implemented: findByLicensePlate');
  }

  async assignDriver(truckId, driverId) {
    throw new Error('Method not implemented: assignDriver');
  }
}

module.exports = TruckRepository;
