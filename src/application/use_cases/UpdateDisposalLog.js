class UpdateDisposalLog {
  constructor(disposalActivityRepository, wasteItemRepository) {
    this.disposalActivityRepository = disposalActivityRepository;
    this.wasteItemRepository = wasteItemRepository;
  }

  async execute(logId, userId, updates) {
    if (!logId) {
      throw new Error('Log ID is required');
    }

    // Find the existing log
    const existingLog = await this.disposalActivityRepository.findById(logId);
    if (!existingLog) {
      throw new Error('Disposal log not found');
    }

    // Verify ownership
    if (existingLog.userId !== userId) {
      throw new Error('Unauthorized: You can only update your own logs');
    }

    // Validate updates
    if (updates.quantity !== undefined && updates.quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }

    if (updates.weight !== undefined && updates.weight <= 0) {
      throw new Error('Weight must be a positive number');
    }

    if (updates.wasteId) {
      const wasteItem = await this.wasteItemRepository.findById(updates.wasteId);
      if (!wasteItem) {
        throw new Error('Invalid waste item ID');
      }
    }

    if (updates.unit) {
      const validUnits = ['kg', 'g', 'lbs', 'oz'];
      if (!validUnits.includes(updates.unit)) {
        throw new Error('Invalid unit');
      }
    }

    if (updates.disposalGuideline !== undefined) {
      if (updates.disposalGuideline !== null && typeof updates.disposalGuideline !== 'string') {
        throw new Error('Disposal guideline must be a string or null');
      }
    }

    const updatedLog = await this.disposalActivityRepository.update(logId, updates);
    return updatedLog;
  }
}

module.exports = UpdateDisposalLog;