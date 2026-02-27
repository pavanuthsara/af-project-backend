const GetRecyclingCenterById = require('../../../src/application/use_cases/GetRecyclingCenterById');
const RecyclingCenter = require('../../../src/domain/entities/RecyclingCenter');

describe('GetRecyclingCenterById Use Case', () => {
  let getRecyclingCenterById;
  let mockRecyclingCenterRepository;

  beforeEach(() => {
    mockRecyclingCenterRepository = {
      findById: jest.fn(),
    };

    getRecyclingCenterById = new GetRecyclingCenterById(mockRecyclingCenterRepository);
  });

  test('should return recycling center when id is valid and exists', async () => {
    const validId = '507f191e810c19729de860ea';
    const center = new RecyclingCenter(
      validId,
      'Green Valley Recycling Hub',
      '123 Main St, Springfield',
      { type: 'Point', coordinates: [-73.935242, 40.73061] },
      ['Plastic', 'Paper', 'Glass'],
      'Mon-Fri 08:00-18:00',
      50000,
      1200
    );

    mockRecyclingCenterRepository.findById.mockResolvedValue(center);

    const result = await getRecyclingCenterById.execute(validId);

    expect(mockRecyclingCenterRepository.findById).toHaveBeenCalledWith(validId);
    expect(result).toBe(center);
  });

  test('should throw 400 when id is invalid', async () => {
    await expect(getRecyclingCenterById.execute('invalid-id')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid recycling center id',
    });

    expect(mockRecyclingCenterRepository.findById).not.toHaveBeenCalled();
  });

  test('should throw 404 when center does not exist', async () => {
    const validId = '507f191e810c19729de860ea';
    mockRecyclingCenterRepository.findById.mockResolvedValue(null);

    await expect(getRecyclingCenterById.execute(validId)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Recycling center not found',
    });
  });
});
