class GetUserDisposalHistory {
  constructor(disposalActivityRepository) {
    this.disposalActivityRepository = disposalActivityRepository;
  }

  async execute(userId, includeWasteDetails = true) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const history = await this.disposalActivityRepository.findByUserId(userId, includeWasteDetails);
    return history;
  }
}

module.exports = GetUserDisposalHistory;