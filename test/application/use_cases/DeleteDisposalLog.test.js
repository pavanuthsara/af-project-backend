const DeleteDisposalLog = require('../../../src/application/use_cases/DeleteDisposalLog');

describe('DeleteDisposalLog Use Case', () => {
  let deleteDisposalLog;
  let mockDisposalActivityRepository;

  const existingLog = { id: 'log-1', userId: 'user-1' };

  beforeEach(() => {
    mockDisposalActivityRepository = {
      findById: jest.fn().mockResolvedValue(existingLog),
      deleteById: jest.fn().mockResolvedValue(true)
    };

    deleteDisposalLog = new DeleteDisposalLog(mockDisposalActivityRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should delete a log when the owner requests it', async () => {
    const result = await deleteDisposalLog.execute('log-1', 'user-1', 'citizen');

    expect(mockDisposalActivityRepository.findById).toHaveBeenCalledWith('log-1');
    expect(mockDisposalActivityRepository.deleteById).toHaveBeenCalledWith('log-1');
    expect(result).toBe(true);
  });

  test('should allow admin to delete any log', async () => {
    const result = await deleteDisposalLog.execute('log-1', 'admin-999', 'admin');

    expect(mockDisposalActivityRepository.deleteById).toHaveBeenCalledWith('log-1');
    expect(result).toBe(true);
  });

  test('should throw error when logId is missing', async () => {
    await expect(deleteDisposalLog.execute(null, 'user-1', 'citizen'))
      .rejects.toThrow('Log ID is required');
  });

  test('should throw error when log is not found', async () => {
    mockDisposalActivityRepository.findById.mockResolvedValue(null);

    await expect(deleteDisposalLog.execute('nonexistent-log', 'user-1', 'citizen'))
      .rejects.toThrow('Disposal log not found');

    expect(mockDisposalActivityRepository.deleteById).not.toHaveBeenCalled();
  });

  test('should throw Unauthorized error when citizen tries to delete another user\'s log', async () => {
    await expect(deleteDisposalLog.execute('log-1', 'user-2', 'citizen'))
      .rejects.toThrow('Unauthorized: You can only delete your own logs');

    expect(mockDisposalActivityRepository.deleteById).not.toHaveBeenCalled();
  });

  test('should propagate repository errors from findById', async () => {
    mockDisposalActivityRepository.findById.mockRejectedValue(new Error('DB error'));

    await expect(deleteDisposalLog.execute('log-1', 'user-1', 'citizen'))
      .rejects.toThrow('DB error');
  });

  test('should propagate repository errors from deleteById', async () => {
    mockDisposalActivityRepository.deleteById.mockRejectedValue(new Error('Delete failed'));

    await expect(deleteDisposalLog.execute('log-1', 'user-1', 'citizen'))
      .rejects.toThrow('Delete failed');
  });
});
