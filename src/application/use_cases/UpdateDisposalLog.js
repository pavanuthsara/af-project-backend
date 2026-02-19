class UpdateDisposalLog {
  constructor(disposalActivityRepository, wasteRepository) {
    this.disposalActivityRepository = disposalActivityRepository;
    this.wasteRepository = wasteRepository;
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
      const wasteExists = await this.wasteRepository.findById(updates.wasteId);
      if (!wasteExists) {
        throw new Error('Invalid waste ID');
      }
    }

    if (updates.unit) {
      const validUnits = ['kg', 'g', 'lbs', 'oz'];
      if (!validUnits.includes(updates.unit)) {
        throw new Error('Invalid unit');
      }
    }

    const updatedLog = await this.disposalActivityRepository.update(logId, updates);
    return updatedLog;
  }
}

module.exports = UpdateDisposalLog;