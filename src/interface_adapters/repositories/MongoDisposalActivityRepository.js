const DisposalActivityRepository = require('../../domain/repositories/DisposalActivityRepository');
const DisposalActivity = require('../../domain/entities/DisposalActivity');
const DisposalActivitySchema = require('../schemas/DisposalActivitySchema');

class MongoDisposalActivityRepository extends DisposalActivityRepository {
  async save(disposalActivity) {
   const doc = new DisposalActivitySchema({
      userId: disposalActivity.userId,
      wasteType: disposalActivity.wasteType,
      quantity: disposalActivity.quantity,
      weight: disposalActivity.weight,
      unit: disposalActivity.unit,
      timestamp: disposalActivity.timestamp
    });

    const saved = await doc.save();

     return new DisposalActivity(
      saved._id.toString(),
      saved.userId.toString(),
      saved.wasteType,
      saved.quantity,
      saved.weight,
      saved.unit,
      saved.timestamp
    );
  }

async findById(id) {
    const doc = await DisposalActivitySchema.findById(id);
    if (!doc) return null;

     return new DisposalActivity(
      doc._id.toString(),
      doc.userId.toString(),
      doc.wasteType,
      doc.quantity,
      doc.weight,
      doc.unit,
      doc.timestamp
    );
  }
async findByUserId(userId) {
    const docs = await DisposalActivitySchema.find({ userId }).sort({ timestamp: -1 });
    
    return docs.map(doc => new DisposalActivity(
      doc._id.toString(),
      doc.userId.toString(),
      doc.wasteType,
      doc.quantity,
      doc.weight,
      doc.unit,
      doc.timestamp
    ));
  }

async deleteById(id) {
    const result = await DisposalActivitySchema.findByIdAndDelete(id);
    return result !== null;
  }
}

module.exports = MongoDisposalActivityRepository;
