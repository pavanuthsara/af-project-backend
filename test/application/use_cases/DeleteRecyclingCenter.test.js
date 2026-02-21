const DeleteRecyclingCenter = require('../../../src/application/use_cases/DeleteRecyclingCenter');

describe('DeleteRecyclingCenter Use Case', () => {
  let deleteRecyclingCenter;
  let mockRecyclingCenterRepository;

  beforeEach(() => {
    mockRecyclingCenterRepository = {
      deleteById: jest.fn(),
    };

    deleteRecyclingCenter = new DeleteRecyclingCenter(mockRecyclingCenterRepository);
  });

  test('should delete a recycling center when id is valid and exists', async () => {
    const validId = '507f191e810c19729de860ea';
    mockRecyclingCenterRepository.deleteById.mockResolvedValue(true);

    await expect(deleteRecyclingCenter.execute(validId)).resolves.toBeUndefined();

    expect(mockRecyclingCenterRepository.deleteById).toHaveBeenCalledWith(validId);
  });

  test('should throw 400 when id is invalid', async () => {
    await expect(deleteRecyclingCenter.execute('invalid-id')).rejects.toMatchObject({
      message: 'Invalid recycling center id',
      statusCode: 400,
    });

    expect(mockRecyclingCenterRepository.deleteById).not.toHaveBeenCalled();
  });

  test('should throw 404 when recycling center does not exist', async () => {
    const validId = '507f191e810c19729de860ea';
    mockRecyclingCenterRepository.deleteById.mockResolvedValue(false);

    await expect(deleteRecyclingCenter.execute(validId)).rejects.toMatchObject({
      message: 'Recycling center not found',
      statusCode: 404,
    });
  });

  test('should propagate repository errors', async () => {
    const validId = '507f191e810c19729de860ea';
    const dbError = new Error('Database error');
    mockRecyclingCenterRepository.deleteById.mockRejectedValue(dbError);

    await expect(deleteRecyclingCenter.execute(validId)).rejects.toThrow('Database error');
  });
});
