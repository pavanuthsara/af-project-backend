const GetRecyclingCenterByIdController = require('../../../src/interface_adapters/controllers/GetRecyclingCenterByIdController');
const GetRecyclingCenterById = require('../../../src/application/use_cases/GetRecyclingCenterById');
const MongoRecyclingCenterRepository = require('../../../src/interface_adapters/repositories/MongoRecyclingCenterRepository');

jest.mock('../../../src/application/use_cases/GetRecyclingCenterById');
jest.mock('../../../src/interface_adapters/repositories/MongoRecyclingCenterRepository');

describe('GetRecyclingCenterByIdController', () => {
  let controller;
  let mockReq;
  let mockRes;
  let mockUseCase;

  beforeEach(() => {
    mockUseCase = {
      execute: jest.fn(),
    };

    GetRecyclingCenterById.mockImplementation(() => mockUseCase);

    controller = new GetRecyclingCenterByIdController();

    mockReq = {
      params: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return recycling center details', async () => {
    mockReq.params.id = '507f191e810c19729de860ea';
    mockUseCase.execute.mockResolvedValue({
      id: '507f191e810c19729de860ea',
      name: 'Green Valley Recycling Hub',
      address: '123 Main St, Springfield',
      location: { type: 'Point', coordinates: [-73.935242, 40.73061] },
      acceptedWasteTypes: ['Plastic', 'Paper', 'Glass'],
      operatingHours: 'Mon-Fri 08:00-18:00',
      maxCapacityKg: 50000,
      currentLoadKg: 1200,
    });

    await controller.handle(mockReq, mockRes);

    expect(MongoRecyclingCenterRepository).toHaveBeenCalledTimes(1);
    expect(GetRecyclingCenterById).toHaveBeenCalledTimes(1);
    expect(mockUseCase.execute).toHaveBeenCalledWith('507f191e810c19729de860ea');
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  test('should return error status from use case', async () => {
    mockReq.params.id = 'invalid-id';
    const error = new Error('Invalid recycling center id');
    error.statusCode = 400;
    mockUseCase.execute.mockRejectedValue(error);

    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid recycling center id' });
  });
});
