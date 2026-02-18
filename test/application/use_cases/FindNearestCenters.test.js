const FindNearestCenters = require('../../../src/application/use_cases/FindNearestCenters');
const Center = require('../../../src/domain/entities/Center');

describe('FindNearestCenters Use Case', () => {
  let findNearestCenters;
  let mockCenterRepository;

  beforeEach(() => {
    mockCenterRepository = {
      findNearby: jest.fn()
    };

    findNearestCenters = new FindNearestCenters(mockCenterRepository);
  });

  test('should find centers within 5km successfully', async () => {
    const latitude = 40.7128;
    const longitude = -74.0060;
    
    const mockCenters = [
      new Center(
        '1',
        'Downtown Center',
        '123 Main St, New York, NY',
        { type: 'Point', coordinates: [-74.0060, 40.7128] },
        { phone: '123-456-7890', email: 'downtown@example.com' }
      ),
      new Center(
        '2',
        'Uptown Center',
        '456 Park Ave, New York, NY',
        { type: 'Point', coordinates: [-74.0070, 40.7135] },
        { phone: '098-765-4321', email: 'uptown@example.com' }
      )
    ];

    mockCenterRepository.findNearby.mockResolvedValue(mockCenters);

    const result = await findNearestCenters.execute(latitude, longitude);

    expect(result).toEqual(mockCenters);
    expect(mockCenterRepository.findNearby).toHaveBeenCalledWith(longitude, latitude, 5000);
  });

  test('should throw error if latitude is missing', async () => {
    await expect(findNearestCenters.execute(null, -74.0060))
      .rejects.toThrow('Latitude and longitude are required');
  });

  test('should throw error if longitude is missing', async () => {
    await expect(findNearestCenters.execute(40.7128, null))
      .rejects.toThrow('Latitude and longitude are required');
  });

  test('should throw error if latitude is invalid', async () => {
    await expect(findNearestCenters.execute('invalid', -74.0060))
      .rejects.toThrow('Invalid latitude or longitude values');
  });

  test('should throw error if latitude is out of range', async () => {
    await expect(findNearestCenters.execute(100, -74.0060))
      .rejects.toThrow('Latitude must be between -90 and 90');
  });

  test('should throw error if longitude is out of range', async () => {
    await expect(findNearestCenters.execute(40.7128, 200))
      .rejects.toThrow('Longitude must be between -180 and 180');
  });

  test('should return empty array if no centers found', async () => {
    mockCenterRepository.findNearby.mockResolvedValue([]);

    const result = await findNearestCenters.execute(40.7128, -74.0060);

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  test('should accept custom max distance', async () => {
    const latitude = 40.7128;
    const longitude = -74.0060;
    const customDistance = 10; // 10km

    mockCenterRepository.findNearby.mockResolvedValue([]);

    await findNearestCenters.execute(latitude, longitude, customDistance);

    expect(mockCenterRepository.findNearby).toHaveBeenCalledWith(longitude, latitude, 10000);
  });
});
