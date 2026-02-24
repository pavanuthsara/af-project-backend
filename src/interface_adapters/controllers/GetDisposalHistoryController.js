const GetUserDisposalHistory = require('../../application/use_cases/GetUserDisposalHistory');
const MongoDisposalActivityRepository = require('../repositories/MongoDisposalActivityRepository');

class GetDisposalHistoryController {
  async handle(req, res) {
    try {
      const userId = req.user.id; // From auth middleware
      const includeWasteDetails = req.query.includeDetails !== 'false'; // Default true

      const disposalActivityRepository = new MongoDisposalActivityRepository();
      const getUserDisposalHistoryUseCase = new GetUserDisposalHistory(disposalActivityRepository);

      const history = await getUserDisposalHistoryUseCase.execute(userId, includeWasteDetails);

      return res.status(200).json({
        message: 'Disposal history retrieved successfully',
        data: history
      });

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = GetDisposalHistoryController;
