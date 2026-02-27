const GetUserDisposalHistory = require('../../../src/application/use_cases/GetUserDisposalHistory');

describe('GetUserDisposalHistory Use Case', () => {
  let getUserDisposalHistory;
  let mockDisposalActivityRepository;

  const mockHistory = [
    { id: 'log-1', userId: 'user-1', wasteId: 'waste-1' },
    { id: 'log-2', userId: 'user-1', wasteId: 'waste-2' }
  ];

  beforeEach(() => {
    mockDisposalActivityRepository = {
      findByUserId: jest.fn().mockResolvedValue(mockHistory)
    };

    getUserDisposalHistory = new GetUserDisposalHistory(mockDisposalActivityRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return disposal history for a valid user', async () => {
    const result = await getUserDisposalHistory.execute('user-1');

    expect(mockDisposalActivityRepository.findByUserId).toHaveBeenCalledWith('user-1', true);
    expect(result).toBe(mockHistory);
  });

  test('should pass includeWasteDetails=true by default', async () => {
    await getUserDisposalHistory.execute('user-1');

    expect(mockDisposalActivityRepository.findByUserId).toHaveBeenCalledWith('user-1', true);
  });

  test('should pass includeWasteDetails=false when specified', async () => {
    await getUserDisposalHistory.execute('user-1', false);

    expect(mockDisposalActivityRepository.findByUserId).toHaveBeenCalledWith('user-1', false);
  });

  test('should throw error when userId is missing', async () => {
    await expect(getUserDisposalHistory.execute(null))
      .rejects.toThrow('User ID is required');

    expect(mockDisposalActivityRepository.findByUserId).not.toHaveBeenCalled();
  });

  test('should return empty array when user has no history', async () => {
    mockDisposalActivityRepository.findByUserId.mockResolvedValue([]);

    const result = await getUserDisposalHistory.execute('user-1');
    expect(result).toEqual([]);
  });

  test('should propagate repository errors', async () => {
    mockDisposalActivityRepository.findByUserId.mockRejectedValue(new Error('DB error'));

    await expect(getUserDisposalHistory.execute('user-1'))
      .rejects.toThrow('DB error');
  });
});
