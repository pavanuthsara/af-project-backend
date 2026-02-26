const RecyclingCenterRepository = require('../../domain/repositories/RecyclingCenterRepository');
const RecyclingCenterModel = require('../schemas/RecyclingCenterSchema');
const RecyclingCenter = require('../../domain/entities/RecyclingCenter');

class MongoRecyclingCenterRepository extends RecyclingCenterRepository {
  async findAll() {
    const mongoRecyclingCenters = await RecyclingCenterModel.find({}).sort({ name: 1 });
    return mongoRecyclingCenters.map((mongoRecyclingCenter) => this.toEntity(mongoRecyclingCenter));
  }

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

  async updateById(id, data) {
    try {
      const updatedCenter = await RecyclingCenterModel.findByIdAndUpdate(
        id,
        {
          name: data.name,
          address: data.address,
          location: data.location,
          acceptedWasteTypes: data.acceptedWasteTypes,
          operatingHours: data.operatingHours,
          maxCapacityKg: data.maxCapacityKg,
          currentLoadKg: data.currentLoadKg,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedCenter) return null;
      return this.toEntity(updatedCenter);
    } catch (error) {
      if (error.code === 11000) {
        const duplicateError = new Error('Recycling center already exists');
        duplicateError.statusCode = 409;
        throw duplicateError;
      }
      throw error;
    }
  }

  async search(filters) {
    const and = [];
    const acceptedWasteTypes = Array.isArray(filters.acceptedWasteTypes) ? filters.acceptedWasteTypes : [];
    const addressKeywords = Array.isArray(filters.addressKeywords) ? filters.addressKeywords : [];

    if (acceptedWasteTypes.length > 0) {
      and.push({ acceptedWasteTypes: { $in: acceptedWasteTypes } });
    }

    if (filters.name) {
      and.push({ name: new RegExp(this.escapeRegex(filters.name), 'i') });
    }

    const addressTerms = [];
    if (filters.city) addressTerms.push(filters.city);
    addressKeywords.forEach((term) => addressTerms.push(term));

    if (addressTerms.length > 0) {
      and.push({
        $or: addressTerms.map((term) => ({
          address: new RegExp(this.escapeRegex(term), 'i'),
        })),
      });
    }

    const query = and.length > 0 ? { $and: and } : {};
    const mongoRecyclingCenters = await RecyclingCenterModel.find(query).sort({ name: 1 });
    return mongoRecyclingCenters.map((mongoRecyclingCenter) => this.toEntity(mongoRecyclingCenter));
  }

  escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
