const DisposalActivityRepository = require('../../domain/repositories/DisposalActivityRepository');
const DisposalActivity = require('../../domain/entities/DisposalActivity');
const DisposalActivitySchema = require('../schemas/DisposalActivitySchema');

class MongoDisposalActivityRepository extends DisposalActivityRepository {
  
  // Helper method to convert MongoDB document to domain entity
  _toDomainEntity(doc) {
    if (!doc) return null;
    
    return new DisposalActivity(
      doc._id.toString(),
      doc.userId.toString(),
      doc.wasteId.toString(),
      doc.quantity,
      doc.weight,
      doc.unit,
      doc.timestamp
    );
  }

  async save(disposalActivity) {
    const doc = new DisposalActivitySchema({
      userId: disposalActivity.userId,
      wasteId: disposalActivity.wasteId,
      quantity: disposalActivity.quantity,
      weight: disposalActivity.weight,
      unit: disposalActivity.unit,
      timestamp: disposalActivity.timestamp
    });

    const saved = await doc.save();
    return this._toDomainEntity(saved);
  }

  async findById(id, populate = false) {
    try {
      let query = DisposalActivitySchema.findById(id);
      
      if (populate) {
        query = query.populate('wasteId').populate('userId', 'name email');
      }
      
      const doc = await query;
      
      if (!doc) return null;
      
      // If populated, return the raw document with populated fields
      if (populate) {
        return {
          ...this._toDomainEntity(doc),
          waste: doc.wasteId,
          user: doc.userId
        };
      }
      
      return this._toDomainEntity(doc);
    } catch (error) {
      if (error.name === 'CastError') {
        return null;
      }
      throw error;
    }
  }

  async findByUserId(userId, populate = false) {
    let query = DisposalActivitySchema
      .find({ userId })
      .sort({ timestamp: -1 });
    
    if (populate) {
      query = query.populate('wasteId');
    }
    
    const docs = await query;
    
    if (populate) {
      return docs.map(doc => ({
        ...this._toDomainEntity(doc),
        waste: doc.wasteId
      }));
    }
    
    return docs.map(doc => this._toDomainEntity(doc));
  }

  async findByWasteId(wasteId) {
    const docs = await DisposalActivitySchema
      .find({ wasteId })
      .sort({ timestamp: -1 });
    
    return docs.map(doc => this._toDomainEntity(doc));
  }

  async update(id, updates) {
    try {
      const doc = await DisposalActivitySchema.findByIdAndUpdate(
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
      const result = await DisposalActivitySchema.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      if (error.name === 'CastError') {
        return false;
      }
      throw error;
    }
  }

  async getAggregatedStats(startDate, endDate) {
    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $lookup: {
          from: 'wastes', // Collection name for Waste schema
          localField: 'wasteId',
          foreignField: '_id',
          as: 'wasteInfo'
        }
      },
      {
        $unwind: '$wasteInfo'
      },
      {
        $group: {
          _id: {
            wasteId: '$wasteId',
            wasteType: '$wasteInfo.type', // Assuming waste has a 'type' field
            month: { $month: '$timestamp' },
            year: { $year: '$timestamp' }
          },
          totalWeight: { $sum: '$weight' },
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 },
          avgWeight: { $avg: '$weight' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ];

    const results = await DisposalActivitySchema.aggregate(pipeline);
    
    return results.map(result => ({
      wasteId: result._id.wasteId,
      wasteType: result._id.wasteType,
      month: result._id.month,
      year: result._id.year,
      totalWeight: result.totalWeight,
      totalQuantity: result.totalQuantity,
      count: result.count,
      avgWeight: result.avgWeight
    }));
  }

  async getTotalWasteByUser(userId, startDate, endDate) {
    const matchStage = { userId };
    
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = new Date(startDate);
      if (endDate) matchStage.timestamp.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'wastes',
          localField: 'wasteId',
          foreignField: '_id',
          as: 'wasteInfo'
        }
      },
      {
        $unwind: '$wasteInfo'
      },
      {
        $group: {
          _id: '$wasteId',
          wasteType: { $first: '$wasteInfo.type' },
          wasteName: { $first: '$wasteInfo.name' },
          totalWeight: { $sum: '$weight' },
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalWeight: -1 }
      }
    ];

    const results = await DisposalActivitySchema.aggregate(pipeline);
    
    return results.map(result => ({
      wasteId: result._id,
      wasteType: result.wasteType,
      wasteName: result.wasteName,
      totalWeight: result.totalWeight,
      totalQuantity: result.totalQuantity,
      count: result.count
    }));
  }
}

module.exports = MongoDisposalActivityRepository;