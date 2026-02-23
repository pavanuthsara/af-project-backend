const GetUserWasteStats = require('../../application/use_cases/GetUserWasteStats');
const MongoDisposalActivityRepository = require('../repositories/MongoDisposalActivityRepository');

class GetUserWasteStatsController {
  async handle(req, res) {
    try {
      const userId = req.user.id; // From auth middleware
      const { startDate, endDate } = req.query;

      const disposalActivityRepository = new MongoDisposalActivityRepository();
      const getUserWasteStatsUseCase = new GetUserWasteStats(disposalActivityRepository);

      const stats = await getUserWasteStatsUseCase.execute(
        userId,
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );

      return res.status(200).json({
        message: 'User waste stats retrieved successfully',
        data: stats
      });

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = GetUserWasteStatsController;