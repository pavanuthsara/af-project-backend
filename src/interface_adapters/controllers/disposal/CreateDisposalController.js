const CreateDisposalLog = require('../../../application/use_cases/CreateDisposalLog');
const MongoDisposalActivityRepository = require('../../repositories/MongoDisposalActivityRepository');
const MongoWasteItemRepository = require('../../repositories/MongoWasteItemRepository');

class CreateDisposalController {
  async handle(req, res) {
    try {
      const { wasteId, quantity, weight, unit } = req.body;
      const userId = req.user.id; // From auth middleware

      const disposalActivityRepository = new MongoDisposalActivityRepository();
      const wasteItemRepository = new MongoWasteItemRepository();
      const createDisposalLogUseCase = new CreateDisposalLog(disposalActivityRepository, wasteItemRepository);

      const disposalLog = await createDisposalLogUseCase.execute(
        userId,
        wasteId,
        quantity,
        weight,
        unit
      );

      return res.status(201).json({
        message: 'Disposal log created successfully',
        data: disposalLog
      });

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = CreateDisposalController;