const UpdateDisposalLog = require('../../../application/use_cases/UpdateDisposalLog');
const MongoDisposalActivityRepository = require('../../repositories/MongoDisposalActivityRepository');
const MongoWasteItemRepository = require('../../repositories/MongoWasteItemRepository');
const ClimatiqService = require('../../../infrastructure/carbon/ClimatiqService');

class UpdateDisposalController {
  async handle(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id; // From auth middleware
      const updates = req.body;

      const disposalActivityRepository = new MongoDisposalActivityRepository();
      const wasteItemRepository = new MongoWasteItemRepository();
      const carbonService = new ClimatiqService();
      const updateDisposalLogUseCase = new UpdateDisposalLog(disposalActivityRepository, wasteItemRepository, carbonService);

      const updatedLog = await updateDisposalLogUseCase.execute(id, userId, updates);

      return res.status(200).json({
        message: 'Disposal log updated successfully',
        data: updatedLog
      });

    } catch (error) {
      const statusCode = error.message.includes('Unauthorized') ? 403 : 
                         error.message.includes('not found') ? 404 : 400;
      return res.status(statusCode).json({ error: error.message });
    }
  }
}

module.exports = UpdateDisposalController;