class GetUserWasteStats {
  constructor(disposalActivityRepository) {
    this.disposalActivityRepository = disposalActivityRepository;
  }

  async execute(userId, startDate, endDate) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const stats = await this.disposalActivityRepository.getTotalWasteByUser(userId, startDate, endDate);
    return stats;
  }
}

module.exports = GetUserWasteStats;
