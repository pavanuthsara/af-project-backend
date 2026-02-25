const GetAggregatedStats = require('../../../application/use_cases/GetAggregatedStats');
const MongoDisposalActivityRepository = require('../../repositories/MongoDisposalActivityRepository');

class GetDisposalStatsController {
  async handle(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const disposalActivityRepository = new MongoDisposalActivityRepository();
      const getAggregatedStatsUseCase = new GetAggregatedStats(disposalActivityRepository);

      const stats = await getAggregatedStatsUseCase.execute(
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );

      return res.status(200).json({
        message: 'Aggregated stats retrieved successfully',
        data: stats
      });

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = GetDisposalStatsController;