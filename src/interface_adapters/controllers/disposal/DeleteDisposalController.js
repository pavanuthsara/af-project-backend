const DeleteDisposalLog = require('../../../application/use_cases/DeleteDisposalLog');
const MongoDisposalActivityRepository = require('../../repositories/MongoDisposalActivityRepository');

class DeleteDisposalController {
  async handle(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id; // From auth middleware
      const userRole = req.user.role; // From auth middleware

      const disposalActivityRepository = new MongoDisposalActivityRepository();
      const deleteDisposalLogUseCase = new DeleteDisposalLog(disposalActivityRepository);

      await deleteDisposalLogUseCase.execute(id, userId, userRole);

      return res.status(200).json({
        message: 'Disposal log deleted successfully'
      });

    } catch (error) {
      const statusCode = error.message.includes('Unauthorized') ? 403 : 
                         error.message.includes('not found') ? 404 : 400;
      return res.status(statusCode).json({ error: error.message });
    }
  }
}

module.exports = DeleteDisposalController;

