const GetRecyclingCentersByWasteTypeController = require('../../../src/interface_adapters/controllers/GetRecyclingCentersByWasteTypeController');
const SearchRecyclingCenters = require('../../../src/application/use_cases/SearchRecyclingCenters');
const MongoRecyclingCenterRepository = require('../../../src/interface_adapters/repositories/MongoRecyclingCenterRepository');

jest.mock('../../../src/application/use_cases/SearchRecyclingCenters');
jest.mock('../../../src/interface_adapters/repositories/MongoRecyclingCenterRepository');

describe('GetRecyclingCentersByWasteTypeController', () => {
  let controller;
  let mockReq;
  let mockRes;
  let mockSearchUseCase;

  beforeEach(() => {
    mockSearchUseCase = {
      execute: jest.fn(),
    };

    SearchRecyclingCenters.mockImplementation(() => mockSearchUseCase);

    controller = new GetRecyclingCentersByWasteTypeController();

    mockReq = {
      params: {},
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return 400 when wasteType is missing', async () => {
    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'wasteType is required' });
  });

  test('should return filtered recycling centers', async () => {
    mockReq.params.wasteType = '  Plastic  ';
    mockSearchUseCase.execute.mockResolvedValue([
      {
        id: '507f191e810c19729de860ea',
        name: 'Green Valley Recycling Hub',
        address: '123 Main St, Springfield',
        location: { type: 'Point', coordinates: [-73.935242, 40.73061] },
        acceptedWasteTypes: ['Plastic', 'Paper'],
        operatingHours: 'Mon-Fri 08:00-18:00',
        maxCapacityKg: 50000,
        currentLoadKg: 1200,
      },
    ]);

    await controller.handle(mockReq, mockRes);

    expect(MongoRecyclingCenterRepository).toHaveBeenCalledTimes(1);
    expect(SearchRecyclingCenters).toHaveBeenCalledTimes(1);
    expect(mockSearchUseCase.execute).toHaveBeenCalledWith({
      acceptedWasteTypes: ['Plastic'],
    });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      wasteType: 'Plastic',
      recyclingCenters: [
        {
          id: '507f191e810c19729de860ea',
          name: 'Green Valley Recycling Hub',
          address: '123 Main St, Springfield',
          location: { type: 'Point', coordinates: [-73.935242, 40.73061] },
          acceptedWasteTypes: ['Plastic', 'Paper'],
          operatingHours: 'Mon-Fri 08:00-18:00',
          maxCapacityKg: 50000,
          currentLoadKg: 1200,
        },
      ],
    });
  });
});
