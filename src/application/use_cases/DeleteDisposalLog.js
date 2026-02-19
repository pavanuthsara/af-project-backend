class DeleteDisposalLog {
  constructor(disposalActivityRepository) {
    this.disposalActivityRepository = disposalActivityRepository;
  }

  async execute(logId, userId, userRole) {
    if (!logId) {
      throw new Error('Log ID is required');
    }

    // Find the existing log
    const existingLog = await this.disposalActivityRepository.findById(logId);
    if (!existingLog) {
      throw new Error('Disposal log not found');
    }

    // Verify ownership (citizens can only delete their own logs)
    if (userRole !== 'admin' && existingLog.userId !== userId) {
      throw new Error('Unauthorized: You can only delete your own logs');
    }

    const deleted = await this.disposalActivityRepository.deleteById(logId);
    return deleted;
  }
}

module.exports = DeleteDisposalLog;