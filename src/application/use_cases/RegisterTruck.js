const Truck = require('../../domain/entities/Truck');

class RegisterTruck {
  constructor(truckRepository) {
    this.truckRepository = truckRepository;
  }

  async execute(make, model, year, licensePlate) {
    const existingTruck = await this.truckRepository.findByLicensePlate(licensePlate);
    if (existingTruck) {
      throw new Error('Truck with this license plate already exists');
    }

    const newTruck = new Truck(null, make, model, year, licensePlate);
    return await this.truckRepository.save(newTruck);
  }
}

module.exports = RegisterTruck;
