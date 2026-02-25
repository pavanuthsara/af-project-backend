 class GetAggregatedStats {
  constructor(disposalActivityRepository) {
    this.disposalActivityRepository = disposalActivityRepository;
  }

  async execute(startDate, endDate) {
    const stats = await this.disposalActivityRepository.getAggregatedStats(startDate, endDate);
    return stats;
  }
}

module.exports = GetAggregatedStats;