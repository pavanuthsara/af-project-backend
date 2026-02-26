const ViewRecyclingCenters = require('../../../src/application/use_cases/ViewRecyclingCenters');
const RecyclingCenter = require('../../../src/domain/entities/RecyclingCenter');

describe('ViewRecyclingCenters Use Case', () => {
  let viewRecyclingCenters;
  let mockRecyclingCenterRepository;

  beforeEach(() => {
    mockRecyclingCenterRepository = {
      findAll: jest.fn(),
    };

    viewRecyclingCenters = new ViewRecyclingCenters(mockRecyclingCenterRepository);
  });

  test('should return a list of recycling centers', async () => {
    const centers = [
      new RecyclingCenter(
        'center-1',
        'Green Valley Recycling Hub',
        '123 Main St, Springfield',
        { type: 'Point', coordinates: [-73.935242, 40.73061] },
        ['Plastic', 'Paper'],
        'Mon-Fri 08:00-18:00',
        50000,
        1200
      ),
      new RecyclingCenter(
        'center-2',
        'Eco Point',
        '45 Oak Rd, Springfield',
        { type: 'Point', coordinates: [-73.9, 40.7] },
        ['Glass'],
        'Mon-Sat 09:00-17:00',
        20000,
        500
      ),
    ];

    mockRecyclingCenterRepository.findAll.mockResolvedValue(centers);

    const result = await viewRecyclingCenters.execute();

    expect(mockRecyclingCenterRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(centers);
  });

  test('should return an empty list when no recycling centers exist', async () => {
    mockRecyclingCenterRepository.findAll.mockResolvedValue([]);

    const result = await viewRecyclingCenters.execute();

    expect(mockRecyclingCenterRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  test('should propagate repository errors', async () => {
    const dbError = new Error('Database error');
    mockRecyclingCenterRepository.findAll.mockRejectedValue(dbError);

    await expect(viewRecyclingCenters.execute()).rejects.toThrow('Database error');
  });
});
