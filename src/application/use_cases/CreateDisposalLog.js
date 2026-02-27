class CreateDisposalLog {
  constructor(disposalActivityRepository, wasteItemRepository, carbonService = null) {
    this.disposalActivityRepository = disposalActivityRepository;
    this.wasteItemRepository = wasteItemRepository;
    this.carbonService = carbonService;
  }

  async execute(userId, wasteId, quantity, weight, unit, disposalGuideline = null) {
    // Validate inputs
    if (!userId || !wasteId || !quantity || !weight || !unit) {
      throw new Error('All fields are required');
    }

    // Verify that the waste item exists (with category populated for CO₂ calc)
    const wasteItem = await this.wasteItemRepository.findByIdWithCategory
      ? await this.wasteItemRepository.findByIdWithCategory(wasteId)
      : await this.wasteItemRepository.findById(wasteId);
    if (!wasteItem) {
      throw new Error('Invalid waste item: Waste ID does not exist');
    }

    if (quantity <= 0 || weight <= 0) {
      throw new Error('Quantity and weight must be positive numbers');
    }

    const validUnits = ['kg', 'g', 'lbs', 'oz'];
    if (!validUnits.includes(unit)) {
      throw new Error('Invalid unit');
    }

    // Estimate CO₂ impact via Climatiq or EPA WARM fallback
    let co2Saved = null;
    let co2Source = null;
    let resolvedDisposalMethod = null;
    if (this.carbonService) {
      try {
        const co2Result = await this.carbonService.estimateCO2(
          wasteItem.categoryName || null,
          wasteItem,
          weight,
          unit
        );
        co2Saved             = co2Result.co2Saved;
        co2Source            = co2Result.source;
        resolvedDisposalMethod = co2Result.disposalMethod;
      } catch {
        // Non-fatal – proceed without CO₂ data
      }
    }

    // Create disposal activity
    const DisposalActivity = require('../../domain/entities/DisposalActivity');
    const disposalActivity = new DisposalActivity(
      null,
      userId,
      wasteId,
      quantity,
      weight,
      unit,
      new Date(),
      disposalGuideline,
      co2Saved,
      co2Source,
      resolvedDisposalMethod
    );

    const savedActivity = await this.disposalActivityRepository.save(disposalActivity);
    return savedActivity;
  }
}

module.exports = CreateDisposalLog;