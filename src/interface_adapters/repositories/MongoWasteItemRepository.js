const WasteItemRepository = require('../../domain/repositories/WasteItemRepository');
const WasteItem = require('../../domain/entities/WasteItem');
const WasteItemSchema = require('../schemas/WasteItem');

class MongoWasteItemRepository extends WasteItemRepository {
  
  _toDomainEntity(doc) {
    if (!doc) return null;
    
    return new WasteItem(
      doc._id.toString(),
      doc.name,
      doc.description,
      doc.category ? doc.category.toString() : null,
      doc.disposalInstructions,
      doc.recyclable,
      doc.hazardous,
      doc.compostable
    );
  }

  async save(wasteItem) {
    const doc = new WasteItemSchema({
      name: wasteItem.name,
      description: wasteItem.description,
      category: wasteItem.category,
      disposalInstructions: wasteItem.disposalInstructions,
      recyclable: wasteItem.recyclable,
      hazardous: wasteItem.hazardous,
      compostable: wasteItem.compostable
    });

    const saved = await doc.save();
    return this._toDomainEntity(saved);
  }

  async findById(id) {
    try {
      const doc = await WasteItemSchema.findById(id);
      return this._toDomainEntity(doc);
    } catch (error) {
      if (error.name === 'CastError') {
        return null;
      }
      throw error;
    }
  }

  async findAll() {
    const docs = await WasteItemSchema.find().sort({ name: 1 });
    return docs.map(doc => this._toDomainEntity(doc));
  }

  async findByCategory(categoryId) {
    const docs = await WasteItemSchema.find({ category: categoryId }).sort({ name: 1 });
    return docs.map(doc => this._toDomainEntity(doc));
  }

  async update(id, updates) {
    try {
      const doc = await WasteItemSchema.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );
      return this._toDomainEntity(doc);
    } catch (error) {
      if (error.name === 'CastError') {
        return null;
      }
      throw error;
    }
  }

  async deleteById(id) {
    try {
      const result = await WasteItemSchema.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      if (error.name === 'CastError') {
        return false;
      }
      throw error;
    }
  }
}

module.exports = MongoWasteItemRepository;
