jest.mock('../../../src/application/use_cases/CreateDisposalLog');
jest.mock('../../../src/interface_adapters/repositories/MongoDisposalActivityRepository');
jest.mock('../../../src/interface_adapters/repositories/MongoWasteItemRepository');
jest.mock('../../../src/infrastructure/carbon/ClimatiqService');

const CreateDisposalController = require('../../../src/interface_adapters/controllers/disposal/CreateDisposalController');
const CreateDisposalLog = require('../../../src/application/use_cases/CreateDisposalLog');

describe('CreateDisposalController', () => {
  let controller;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    controller = new CreateDisposalController();

    mockReq = {
      body: { wasteId: 'waste-1', quantity: 2, weight: 1.5, unit: 'kg' },
      user: { id: 'user-1' }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return 201 with disposal log and carbon impact on success', async () => {
    const savedLog = {
      id: 'log-1',
      userId: 'user-1',
      wasteId: 'waste-1',
      co2Saved: 0.5,
      disposalMethod: 'recycling',
      co2Source: 'climatiq'
    };

    CreateDisposalLog.prototype.execute = jest.fn().mockResolvedValue(savedLog);

    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    const jsonArg = mockRes.json.mock.calls[0][0];
    expect(jsonArg.message).toBe('Disposal log created successfully');
    expect(jsonArg.data).toBe(savedLog);
    expect(jsonArg.carbonImpact.co2Saved).toBe(0.5);
    expect(jsonArg.carbonImpact.co2SavedUnit).toBe('kg CO₂e');
  });

  test('should include positive CO₂ savings message when co2Saved >= 0', async () => {
    const savedLog = { co2Saved: 1.2, disposalMethod: 'recycling', co2Source: 'climatiq' };
    CreateDisposalLog.prototype.execute = jest.fn().mockResolvedValue(savedLog);

    await controller.handle(mockReq, mockRes);

    const { carbonImpact } = mockRes.json.mock.calls[0][0];
    expect(carbonImpact.message).toContain('saved');
  });

  test('should include emissions message when co2Saved is negative', async () => {
    const savedLog = { co2Saved: -0.3, disposalMethod: 'landfill', co2Source: 'epa-warm' };
    CreateDisposalLog.prototype.execute = jest.fn().mockResolvedValue(savedLog);

    await controller.handle(mockReq, mockRes);

    const { carbonImpact } = mockRes.json.mock.calls[0][0];
    expect(carbonImpact.message).toContain('generated');
  });

  test('should return null CO₂ message when co2Saved is null', async () => {
    const savedLog = { co2Saved: null, disposalMethod: null, co2Source: null };
    CreateDisposalLog.prototype.execute = jest.fn().mockResolvedValue(savedLog);

    await controller.handle(mockReq, mockRes);

    const { carbonImpact } = mockRes.json.mock.calls[0][0];
    expect(carbonImpact.message).toBeNull();
  });

  test('should return 400 with error message on failure', async () => {
    CreateDisposalLog.prototype.execute = jest.fn().mockRejectedValue(new Error('All fields are required'));

    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'All fields are required' });
  });
});

describe('DeleteDisposalController', () => {
  let controller;
  let mockReq;
  let mockRes;

  const DeleteDisposalController = require('../../../src/interface_adapters/controllers/disposal/DeleteDisposalController');
  const DeleteDisposalLog = require('../../../src/application/use_cases/DeleteDisposalLog');

  jest.mock('../../../src/application/use_cases/DeleteDisposalLog');

  beforeEach(() => {
    controller = new DeleteDisposalController();

    mockReq = {
      params: { id: 'log-1' },
      user: { id: 'user-1', role: 'citizen' }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 on successful deletion', async () => {
    DeleteDisposalLog.prototype.execute = jest.fn().mockResolvedValue(true);

    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Disposal log deleted successfully' });
  });

  test('should return 404 when log is not found', async () => {
    DeleteDisposalLog.prototype.execute = jest.fn().mockRejectedValue(new Error('Disposal log not found'));

    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Disposal log not found' });
  });

  test('should return 403 when user is unauthorized', async () => {
    DeleteDisposalLog.prototype.execute = jest.fn().mockRejectedValue(new Error('Unauthorized: You can only delete your own logs'));

    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
  });

  test('should return 400 for generic errors', async () => {
    DeleteDisposalLog.prototype.execute = jest.fn().mockRejectedValue(new Error('Log ID is required'));

    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
});

describe('UpdateDisposalController', () => {
  let controller;
  let mockReq;
  let mockRes;

  const UpdateDisposalController = require('../../../src/interface_adapters/controllers/disposal/UpdateDisposalController');
  const UpdateDisposalLog = require('../../../src/application/use_cases/UpdateDisposalLog');

  jest.mock('../../../src/application/use_cases/UpdateDisposalLog');

  beforeEach(() => {
    controller = new UpdateDisposalController();

    mockReq = {
      params: { id: 'log-1' },
      user: { id: 'user-1' },
      body: { quantity: 3 }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 with updated log on success', async () => {
    const updatedLog = { id: 'log-1', quantity: 3 };
    UpdateDisposalLog.prototype.execute = jest.fn().mockResolvedValue(updatedLog);

    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Disposal log updated successfully',
      data: updatedLog
    });
  });

  test('should return 403 when user is unauthorized', async () => {
    UpdateDisposalLog.prototype.execute = jest.fn().mockRejectedValue(new Error('Unauthorized: You can only update your own logs'));

    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
  });

  test('should return 404 when log is not found', async () => {
    UpdateDisposalLog.prototype.execute = jest.fn().mockRejectedValue(new Error('Disposal log not found'));

    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  test('should return 400 for generic errors', async () => {
    UpdateDisposalLog.prototype.execute = jest.fn().mockRejectedValue(new Error('Invalid unit'));

    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
});

describe('GetDisposalHistoryController', () => {
  let controller;
  let mockReq;
  let mockRes;

  const GetDisposalHistoryController = require('../../../src/interface_adapters/controllers/disposal/GetDisposalHistoryController');
  const GetUserDisposalHistory = require('../../../src/application/use_cases/GetUserDisposalHistory');

  jest.mock('../../../src/application/use_cases/GetUserDisposalHistory');

  beforeEach(() => {
    controller = new GetDisposalHistoryController();

    mockReq = {
      user: { id: 'user-1' },
      query: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return 200 with disposal history', async () => {
    const history = [{ id: 'log-1' }, { id: 'log-2' }];
    GetUserDisposalHistory.prototype.execute = jest.fn().mockResolvedValue(history);

    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Disposal history retrieved successfully',
      data: history
    });
  });

  test('should default includeDetails to true', async () => {
    GetUserDisposalHistory.prototype.execute = jest.fn().mockResolvedValue([]);

    await controller.handle(mockReq, mockRes);

    expect(GetUserDisposalHistory.prototype.execute).toHaveBeenCalledWith('user-1', true);
  });

  test('should pass includeDetails=false when query param is "false"', async () => {
    mockReq.query = { includeDetails: 'false' };
    GetUserDisposalHistory.prototype.execute = jest.fn().mockResolvedValue([]);

    await controller.handle(mockReq, mockRes);

    expect(GetUserDisposalHistory.prototype.execute).toHaveBeenCalledWith('user-1', false);
  });

  test('should return 400 on error', async () => {
    GetUserDisposalHistory.prototype.execute = jest.fn().mockRejectedValue(new Error('User ID is required'));

    await controller.handle(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'User ID is required' });
  });
});
