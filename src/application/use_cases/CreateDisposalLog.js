class CreateDisposalLog {
  constructor(disposalActivityRepository, wasteRepository) {
    this.disposalActivityRepository = disposalActivityRepository;
    this.wasteRepository = wasteRepository;
  }

  async execute(userId, wasteId, quantity, weight, unit) {
    // Validate inputs
    if (!userId || !wasteId || !quantity || !weight || !unit) {
      throw new Error('All fields are required');
    }

    // Verify that the waste exists
    const wasteExists = await this.wasteRepository.findById(wasteId);
    if (!wasteExists) {
      throw new Error('Invalid waste type: Waste ID does not exist');
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