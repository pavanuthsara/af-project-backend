class AssignDriverToTruck {
  constructor(truckRepository, driverRepository) {
    this.truckRepository = truckRepository;
    this.driverRepository = driverRepository;
  }

  async execute(truckId, driverId) {
    const truck = await this.truckRepository.findById(truckId);
    if (!truck) {
      throw new Error('Truck not found');
    }

    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    return await this.truckRepository.assignDriver(truckId, driverId);
  }
}

module.exports = AssignDriverToTruck;
