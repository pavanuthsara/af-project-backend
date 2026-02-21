const RecyclingCenterRepository = require('../../domain/repositories/RecyclingCenterRepository');
const RecyclingCenterModel = require('../schemas/RecyclingCenterSchema');
const RecyclingCenter = require('../../domain/entities/RecyclingCenter');

class MongoRecyclingCenterRepository extends RecyclingCenterRepository {
  async save(recyclingCenter) {
    try {
      const mongoRecyclingCenter = await RecyclingCenterModel.create({
        name: recyclingCenter.name,
        address: recyclingCenter.address,
        location: recyclingCenter.location,
        acceptedWasteTypes: recyclingCenter.acceptedWasteTypes,
        operatingHours: recyclingCenter.operatingHours,
        maxCapacityKg: recyclingCenter.maxCapacityKg,
        currentLoadKg: recyclingCenter.currentLoadKg,
      });

      return this.toEntity(mongoRecyclingCenter);
    } catch (error) {
      if (error.code === 11000) {
        const duplicateError = new Error('Recycling center already exists');
        duplicateError.statusCode = 409;
        throw duplicateError;
      }
      throw error;
    }
  }

  async findByNameAndAddress(name, address) {
    const mongoRecyclingCenter = await RecyclingCenterModel.findOne({ name, address });
    if (!mongoRecyclingCenter) return null;
    return this.toEntity(mongoRecyclingCenter);
  }

  async deleteById(id) {
    const deletedCenter = await RecyclingCenterModel.findByIdAndDelete(id);
    return Boolean(deletedCenter);
  }

  toEntity(mongoRecyclingCenter) {
    return new RecyclingCenter(
      mongoRecyclingCenter._id.toString(),
      mongoRecyclingCenter.name,
      mongoRecyclingCenter.address,
      mongoRecyclingCenter.location,
      mongoRecyclingCenter.acceptedWasteTypes,
      mongoRecyclingCenter.operatingHours,
      mongoRecyclingCenter.maxCapacityKg,
      mongoRecyclingCenter.currentLoadKg
    );
  }
}

module.exports = MongoRecyclingCenterRepository;
