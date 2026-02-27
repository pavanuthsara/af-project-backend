const GetUserWasteStats = require('../../../src/application/use_cases/GetUserWasteStats');

describe('GetUserWasteStats Use Case', () => {
  let getUserWasteStats;
  let mockDisposalActivityRepository;

  const mockStats = {
    totalWeight: 10.5,
    totalItems: 5,
    co2Saved: 2.3
  };

  beforeEach(() => {
    mockDisposalActivityRepository = {
      getTotalWasteByUser: jest.fn().mockResolvedValue(mockStats)
    };

    getUserWasteStats = new GetUserWasteStats(mockDisposalActivityRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return stats for a valid user', async () => {
    const result = await getUserWasteStats.execute('user-1');

    expect(mockDisposalActivityRepository.getTotalWasteByUser).toHaveBeenCalledWith('user-1', undefined, undefined);
    expect(result).toBe(mockStats);
  });

  test('should pass date range to the repository', async () => {
    const startDate = '2025-01-01';
    const endDate = '2025-12-31';

    await getUserWasteStats.execute('user-1', startDate, endDate);

    expect(mockDisposalActivityRepository.getTotalWasteByUser).toHaveBeenCalledWith('user-1', startDate, endDate);
  });

  test('should throw error when userId is missing', async () => {
    await expect(getUserWasteStats.execute(null))
      .rejects.toThrow('User ID is required');

    expect(mockDisposalActivityRepository.getTotalWasteByUser).not.toHaveBeenCalled();
  });

  test('should propagate repository errors', async () => {
    mockDisposalActivityRepository.getTotalWasteByUser.mockRejectedValue(new Error('DB error'));

    await expect(getUserWasteStats.execute('user-1'))
      .rejects.toThrow('DB error');
  });
});
