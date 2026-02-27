const CreateDisposalLog = require('../../../src/application/use_cases/CreateDisposalLog');

describe('CreateDisposalLog Use Case', () => {
  let createDisposalLog;
  let mockDisposalActivityRepository;
  let mockWasteItemRepository;
  let mockCarbonService;

  const validWasteItem = { _id: 'waste-1', name: 'Plastic Bottle', categoryName: 'Plastics' };
  const savedActivity = { id: 'log-1', userId: 'user-1', wasteId: 'waste-1', quantity: 2, weight: 1.5, unit: 'kg', co2Saved: 0.3 };

  beforeEach(() => {
    mockDisposalActivityRepository = {
      save: jest.fn().mockResolvedValue(savedActivity)
    };

    mockWasteItemRepository = {
      findById: jest.fn().mockResolvedValue(validWasteItem),
      findByIdWithCategory: jest.fn().mockResolvedValue(validWasteItem)
    };

    mockCarbonService = {
      estimateCO2: jest.fn().mockResolvedValue({
        co2Saved: 0.3,
        source: 'climatiq',
        disposalMethod: 'recycling'
      })
    };

    createDisposalLog = new CreateDisposalLog(
      mockDisposalActivityRepository,
      mockWasteItemRepository,
      mockCarbonService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create a disposal log successfully with carbon data', async () => {
    const result = await createDisposalLog.execute('user-1', 'waste-1', 2, 1.5, 'kg');

    expect(mockWasteItemRepository.findByIdWithCategory).toHaveBeenCalledWith('waste-1');
    expect(mockCarbonService.estimateCO2).toHaveBeenCalled();
    expect(mockDisposalActivityRepository.save).toHaveBeenCalled();
    expect(result).toBe(savedActivity);
  });

  test('should work without a carbon service (null)', async () => {
    const useCase = new CreateDisposalLog(
      mockDisposalActivityRepository,
      mockWasteItemRepository,
      null
    );
    const result = await useCase.execute('user-1', 'waste-1', 2, 1.5, 'kg');

    expect(mockCarbonService.estimateCO2).not.toHaveBeenCalled();
    expect(mockDisposalActivityRepository.save).toHaveBeenCalled();
    expect(result).toBe(savedActivity);
  });

  test('should fall back to findById when findByIdWithCategory is not available', async () => {
    const repoWithoutCategory = {
      save: jest.fn().mockResolvedValue(savedActivity),
      findById: jest.fn().mockResolvedValue(validWasteItem)
    };
    const useCase = new CreateDisposalLog(repoWithoutCategory, { findById: jest.fn().mockResolvedValue(validWasteItem) }, null);
    await useCase.execute('user-1', 'waste-1', 2, 1.5, 'kg');
    expect(repoWithoutCategory.save).toHaveBeenCalled();
  });

  test('should throw error when userId is missing', async () => {
    await expect(createDisposalLog.execute(null, 'waste-1', 2, 1.5, 'kg'))
      .rejects.toThrow('All fields are required');
  });

  test('should throw error when wasteId is missing', async () => {
    await expect(createDisposalLog.execute('user-1', null, 2, 1.5, 'kg'))
      .rejects.toThrow('All fields are required');
  });

  test('should throw error when quantity is missing', async () => {
    await expect(createDisposalLog.execute('user-1', 'waste-1', null, 1.5, 'kg'))
      .rejects.toThrow('All fields are required');
  });

  test('should throw error when weight is missing', async () => {
    await expect(createDisposalLog.execute('user-1', 'waste-1', 2, null, 'kg'))
      .rejects.toThrow('All fields are required');
  });

  test('should throw error when unit is missing', async () => {
    await expect(createDisposalLog.execute('user-1', 'waste-1', 2, 1.5, null))
      .rejects.toThrow('All fields are required');
  });

  test('should throw error when waste item does not exist', async () => {
    mockWasteItemRepository.findByIdWithCategory.mockResolvedValue(null);
    await expect(createDisposalLog.execute('user-1', 'nonexistent-waste', 2, 1.5, 'kg'))
      .rejects.toThrow('Invalid waste item: Waste ID does not exist');
  });

  test('should throw error when quantity is zero', async () => {
    // 0 is falsy so the first guard fires: 'All fields are required'
    await expect(createDisposalLog.execute('user-1', 'waste-1', 0, 1.5, 'kg'))
      .rejects.toThrow('All fields are required');
  });

  test('should throw error when quantity is negative', async () => {
    await expect(createDisposalLog.execute('user-1', 'waste-1', -1, 1.5, 'kg'))
      .rejects.toThrow('Quantity and weight must be positive numbers');
  });

  test('should throw error when weight is zero', async () => {
    // 0 is falsy so the first guard fires: 'All fields are required'
    await expect(createDisposalLog.execute('user-1', 'waste-1', 2, 0, 'kg'))
      .rejects.toThrow('All fields are required');
  });

  test('should throw error when weight is negative', async () => {
    await expect(createDisposalLog.execute('user-1', 'waste-1', 2, -1, 'kg'))
      .rejects.toThrow('Quantity and weight must be positive numbers');
  });

  test('should throw error for invalid unit', async () => {
    await expect(createDisposalLog.execute('user-1', 'waste-1', 2, 1.5, 'pounds'))
      .rejects.toThrow('Invalid unit');
  });

  test.each(['kg', 'g', 'lbs', 'oz'])('should accept valid unit: %s', async (unit) => {
    await expect(createDisposalLog.execute('user-1', 'waste-1', 2, 1.5, unit))
      .resolves.toBe(savedActivity);
  });

  test('should pass disposalGuideline to save', async () => {
    await createDisposalLog.execute('user-1', 'waste-1', 2, 1.5, 'kg', 'recycle');

    const savedArg = mockDisposalActivityRepository.save.mock.calls[0][0];
    expect(savedArg.disposalGuideline).toBe('recycle');
  });

  test('should continue gracefully when carbon service throws', async () => {
    mockCarbonService.estimateCO2.mockRejectedValue(new Error('API unavailable'));
    const result = await createDisposalLog.execute('user-1', 'waste-1', 2, 1.5, 'kg');
    expect(result).toBe(savedActivity);
  });
});
