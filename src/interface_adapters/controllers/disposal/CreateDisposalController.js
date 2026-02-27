const CreateDisposalLog = require('../../../application/use_cases/CreateDisposalLog');
const MongoDisposalActivityRepository = require('../../repositories/MongoDisposalActivityRepository');
const MongoWasteItemRepository = require('../../repositories/MongoWasteItemRepository');
const ClimatiqService = require('../../../infrastructure/carbon/ClimatiqService');

class CreateDisposalController {
  async handle(req, res) {
    try {
      const { wasteId, quantity, weight, unit, disposalGuideline } = req.body;
      const userId = req.user.id; // From auth middleware

      const disposalActivityRepository = new MongoDisposalActivityRepository();
      const wasteItemRepository = new MongoWasteItemRepository();
      const carbonService = new ClimatiqService();
      const createDisposalLogUseCase = new CreateDisposalLog(disposalActivityRepository, wasteItemRepository, carbonService);

      const disposalLog = await createDisposalLogUseCase.execute(
        userId,
        wasteId,
        quantity,
        weight,
        unit,
        disposalGuideline || null
      );

      return res.status(201).json({
        message: 'Disposal log created successfully',
        data: disposalLog,
        carbonImpact: {
          co2Saved:       disposalLog.co2Saved,
          co2SavedUnit:   'kg CO₂e',
          disposalMethod: disposalLog.disposalMethod,
          source:         disposalLog.co2Source,
          message: disposalLog.co2Saved !== null
            ? disposalLog.co2Saved >= 0
              ? `You saved ${disposalLog.co2Saved} kg CO₂e by ${disposalLog.disposalMethod} this waste! 🌱`
              : `This disposal generated ${Math.abs(disposalLog.co2Saved)} kg CO₂e net emissions.`
            : null,
        },
      });

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = CreateDisposalController;