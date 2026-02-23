class CreateDisposalLog {
  constructor(disposalActivityRepository, wasteItemRepository) {
    this.disposalActivityRepository = disposalActivityRepository;
    this.wasteItemRepository = wasteItemRepository;
  }

  async execute(userId, wasteId, quantity, weight, unit) {
    // Validate inputs
    if (!userId || !wasteId || !quantity || !weight || !unit) {
      throw new Error('All fields are required');
    }

    // Verify that the waste item exists
    const wasteItem = await this.wasteItemRepository.findById(wasteId);
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

    // Create disposal activity
    const DisposalActivity = require('../../domain/entities/DisposalActivity');
    const disposalActivity = new DisposalActivity(
      null,
      userId,
      wasteId,
      quantity,
      weight,
      unit,
      new Date()
    );

    const savedActivity = await this.disposalActivityRepository.save(disposalActivity);
    return savedActivity;
  }
}

module.exports = CreateDisposalLog;