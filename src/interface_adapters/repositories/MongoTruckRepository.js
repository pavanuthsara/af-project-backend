const TruckRepository = require('../../domain/repositories/TruckRepository');
const Truck = require('../../domain/entities/Truck');
const TruckSchema = require('../schemas/TruckSchema');

class MongoTruckRepository extends TruckRepository {
  async save(truck) {
    const newTruck = new TruckSchema({
      make: truck.make,
      model: truck.model,
      year: truck.year,
      licensePlate: truck.licensePlate,
      driverId: truck.driverId
    });
    const savedTruck = await newTruck.save();
    return new Truck(savedTruck.id, savedTruck.make, savedTruck.model, savedTruck.year, savedTruck.licensePlate, savedTruck.driverId);
  }

  async findById(id) {
    const truck = await TruckSchema.findById(id);
    if (!truck) {
      return null;
    }
    return new Truck(truck.id, truck.make, truck.model, truck.year, truck.licensePlate, truck.driverId);
  }

  async findByLicensePlate(licensePlate) {
    const truck = await TruckSchema.findOne({ licensePlate });
    if (!truck) {
      return null;
    }
    return new Truck(truck.id, truck.make, truck.model, truck.year, truck.licensePlate, truck.driverId);
  }

  async assignDriver(truckId, driverId) {
    const truck = await TruckSchema.findByIdAndUpdate(truckId, { driverId }, { new: true });
    if (!truck) {
      throw new Error('Truck not found');
    }
    return new Truck(truck.id, truck.make, truck.model, truck.year, truck.licensePlate, truck.driverId);
  }
}

module.exports = MongoTruckRepository;
