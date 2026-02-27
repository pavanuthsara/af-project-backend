class UpdateDisposalLog {
  constructor(disposalActivityRepository, wasteItemRepository, carbonService = null) {
    this.disposalActivityRepository = disposalActivityRepository;
    this.wasteItemRepository = wasteItemRepository;
    this.carbonService = carbonService;
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

    // Recalculate CO₂ if weight, unit, or wasteId changed
    const co2AffectingFields = ['weight', 'unit', 'wasteId'];
    const needsRecalc = co2AffectingFields.some(f => updates[f] !== undefined);

    if (needsRecalc && this.carbonService) {
      // Use updated values or fall back to existing log values
      const effectiveWasteId  = updates.wasteId || existingLog.wasteId;
      const effectiveWeight   = updates.weight   !== undefined ? updates.weight   : existingLog.weight;
      const effectiveUnit     = updates.unit     !== undefined ? updates.unit     : existingLog.unit;

      const wasteItem = await this.wasteItemRepository.findByIdWithCategory
        ? await this.wasteItemRepository.findByIdWithCategory(effectiveWasteId)
        : await this.wasteItemRepository.findById(effectiveWasteId);

      if (wasteItem) {
        try {
          const co2Result = await this.carbonService.estimateCO2(
            wasteItem.categoryName || null,
            wasteItem,
            effectiveWeight,
            effectiveUnit
          );
          updates.co2Saved       = co2Result.co2Saved;
          updates.co2Source      = co2Result.source;
          updates.disposalMethod = co2Result.disposalMethod;
        } catch {
          // Non-fatal – keep existing CO₂ values
        }
      }
    }

    const updatedLog = await this.disposalActivityRepository.update(logId, updates);
    return updatedLog;
  }
}

module.exports = UpdateDisposalLog;