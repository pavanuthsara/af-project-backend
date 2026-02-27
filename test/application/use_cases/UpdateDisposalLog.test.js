const UpdateDisposalLog = require('../../../src/application/use_cases/UpdateDisposalLog');

describe('UpdateDisposalLog Use Case', () => {
  let updateDisposalLog;
  let mockDisposalActivityRepository;
  let mockWasteItemRepository;
  let mockCarbonService;

  const existingLog = {
    id: 'log-1',
    userId: 'user-1',
    wasteId: 'waste-1',
    weight: 1.5,
    unit: 'kg'
  };
  const updatedLog = { ...existingLog, quantity: 3 };
  const validWasteItem = { _id: 'waste-2', name: 'Glass Jar', categoryName: 'Glass' };

  beforeEach(() => {
    mockDisposalActivityRepository = {
      findById: jest.fn().mockResolvedValue(existingLog),
      update: jest.fn().mockResolvedValue(updatedLog)
    };

    mockWasteItemRepository = {
      findById: jest.fn().mockResolvedValue(validWasteItem),
      findByIdWithCategory: jest.fn().mockResolvedValue(validWasteItem)
    };

    mockCarbonService = {
      estimateCO2: jest.fn().mockResolvedValue({
        co2Saved: 0.5,
        source: 'climatiq',
        disposalMethod: 'recycling'
      })
    };

    updateDisposalLog = new UpdateDisposalLog(
      mockDisposalActivityRepository,
      mockWasteItemRepository,
      mockCarbonService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should update a log successfully', async () => {
    const result = await updateDisposalLog.execute('log-1', 'user-1', { quantity: 3 });

    expect(mockDisposalActivityRepository.findById).toHaveBeenCalledWith('log-1');
    expect(mockDisposalActivityRepository.update).toHaveBeenCalledWith('log-1', { quantity: 3 });
    expect(result).toBe(updatedLog);
  });

  test('should throw error when logId is missing', async () => {
    await expect(updateDisposalLog.execute(null, 'user-1', { quantity: 3 }))
      .rejects.toThrow('Log ID is required');
  });

  test('should throw error when log is not found', async () => {
    mockDisposalActivityRepository.findById.mockResolvedValue(null);

    await expect(updateDisposalLog.execute('nonexistent', 'user-1', { quantity: 3 }))
      .rejects.toThrow('Disposal log not found');

    expect(mockDisposalActivityRepository.update).not.toHaveBeenCalled();
  });

  test('should throw Unauthorized when user does not own the log', async () => {
    await expect(updateDisposalLog.execute('log-1', 'user-99', { quantity: 3 }))
      .rejects.toThrow('Unauthorized: You can only update your own logs');

    expect(mockDisposalActivityRepository.update).not.toHaveBeenCalled();
  });

  test('should throw error when quantity is zero', async () => {
    await expect(updateDisposalLog.execute('log-1', 'user-1', { quantity: 0 }))
      .rejects.toThrow('Quantity must be a positive number');
  });

  test('should throw error when quantity is negative', async () => {
    await expect(updateDisposalLog.execute('log-1', 'user-1', { quantity: -5 }))
      .rejects.toThrow('Quantity must be a positive number');
  });

  test('should throw error when weight is zero', async () => {
    await expect(updateDisposalLog.execute('log-1', 'user-1', { weight: 0 }))
      .rejects.toThrow('Weight must be a positive number');
  });

  test('should throw error when weight is negative', async () => {
    await expect(updateDisposalLog.execute('log-1', 'user-1', { weight: -1 }))
      .rejects.toThrow('Weight must be a positive number');
  });

  test('should throw error for invalid unit', async () => {
    await expect(updateDisposalLog.execute('log-1', 'user-1', { unit: 'gallons' }))
      .rejects.toThrow('Invalid unit');
  });

  test('should throw error when updated wasteId does not exist', async () => {
    mockWasteItemRepository.findById.mockResolvedValue(null);

    await expect(updateDisposalLog.execute('log-1', 'user-1', { wasteId: 'bad-id' }))
      .rejects.toThrow('Invalid waste item ID');
  });

  test('should throw error for invalid disposalGuideline type', async () => {
    await expect(updateDisposalLog.execute('log-1', 'user-1', { disposalGuideline: 123 }))
      .rejects.toThrow('Disposal guideline must be a string or null');
  });

  test('should allow null disposalGuideline', async () => {
    await expect(updateDisposalLog.execute('log-1', 'user-1', { disposalGuideline: null }))
      .resolves.toBe(updatedLog);
  });

  test('should recalculate CO₂ when weight is updated', async () => {
    await updateDisposalLog.execute('log-1', 'user-1', { weight: 3 });
    expect(mockCarbonService.estimateCO2).toHaveBeenCalled();
  });

  test('should recalculate CO₂ when unit is updated', async () => {
    await updateDisposalLog.execute('log-1', 'user-1', { unit: 'lbs' });
    expect(mockCarbonService.estimateCO2).toHaveBeenCalled();
  });

  test('should not recalculate CO₂ when only quantity is updated', async () => {
    await updateDisposalLog.execute('log-1', 'user-1', { quantity: 5 });
    expect(mockCarbonService.estimateCO2).not.toHaveBeenCalled();
  });

  test('should continue gracefully if carbon service throws during recalculation', async () => {
    mockCarbonService.estimateCO2.mockRejectedValue(new Error('API error'));
    const result = await updateDisposalLog.execute('log-1', 'user-1', { weight: 3 });
    expect(result).toBe(updatedLog);
  });
});
