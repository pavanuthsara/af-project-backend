const WasteTypeValidationService = require('../../../src/application/services/WasteTypeValidationService');
const WasteCategory = require('../../../src/interface_adapters/schemas/WasteCategory');

jest.mock('../../../src/interface_adapters/schemas/WasteCategory');

describe('WasteTypeValidationService', () => {
  let service;

  beforeEach(() => {
    service = new WasteTypeValidationService();
    jest.clearAllMocks();
  });

  test('should return canonical waste type names', async () => {
    WasteCategory.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { name: 'Plastic' },
        { name: 'E-waste' },
      ]),
    });

    const result = await service.validateAcceptedWasteTypes(['plastic', ' e-waste ']);

    expect(result).toEqual(['Plastic', 'E-waste']);
  });

  test('should throw 400 for unknown waste types', async () => {
    WasteCategory.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ name: 'Plastic' }]),
    });

    await expect(service.validateAcceptedWasteTypes(['Plastic', 'Unknown'])).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid waste types: unknown',
      invalidWasteTypes: ['unknown'],
    });
  });
});
