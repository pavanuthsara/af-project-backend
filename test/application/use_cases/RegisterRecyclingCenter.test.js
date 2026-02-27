const RegisterRecyclingCenter = require('../../../src/application/use_cases/RegisterRecyclingCenter');
const RecyclingCenter = require('../../../src/domain/entities/RecyclingCenter');

describe('RegisterRecyclingCenter Use Case', () => {
  let registerRecyclingCenter;
  let mockRecyclingCenterRepository;
  let mockWasteTypeValidationService;

  const validPayload = {
    name: 'Green Valley Recycling Hub',
    address: '123 Main St, Springfield',
    location: { type: 'Point', coordinates: [-73.935242, 40.73061] },
    acceptedWasteTypes: ['Plastic', 'Paper', 'Glass'],
    operatingHours: 'Mon-Fri 08:00-18:00',
    maxCapacityKg: 50000,
    currentLoadKg: 1200,
  };

  beforeEach(() => {
    mockRecyclingCenterRepository = {
      findByNameAndAddress: jest.fn(),
      save: jest.fn(),
    };

    mockWasteTypeValidationService = {
      validateAcceptedWasteTypes: jest.fn(),
    };

    registerRecyclingCenter = new RegisterRecyclingCenter(
      mockRecyclingCenterRepository,
      mockWasteTypeValidationService
    );
  });

  test('should register a recycling center with valid data', async () => {
    const canonicalWasteTypes = ['Plastic', 'Paper', 'Glass'];
    mockWasteTypeValidationService.validateAcceptedWasteTypes.mockResolvedValue(canonicalWasteTypes);
    mockRecyclingCenterRepository.findByNameAndAddress.mockResolvedValue(null);
    mockRecyclingCenterRepository.save.mockResolvedValue(
      new RecyclingCenter(
        'center-1',
        validPayload.name,
        validPayload.address,
        validPayload.location,
        canonicalWasteTypes,
        validPayload.operatingHours,
        validPayload.maxCapacityKg,
        validPayload.currentLoadKg
      )
    );

    const result = await registerRecyclingCenter.execute(validPayload);

    expect(mockRecyclingCenterRepository.findByNameAndAddress).toHaveBeenCalledWith(
      validPayload.name,
      validPayload.address
    );
    expect(mockWasteTypeValidationService.validateAcceptedWasteTypes)
      .toHaveBeenCalledWith(validPayload.acceptedWasteTypes);
    expect(mockRecyclingCenterRepository.save).toHaveBeenCalled();
    expect(result.id).toBe('center-1');
    expect(result.name).toBe(validPayload.name);
  });

  test('should throw 409 if recycling center already exists', async () => {
    mockWasteTypeValidationService.validateAcceptedWasteTypes.mockResolvedValue(validPayload.acceptedWasteTypes);
    mockRecyclingCenterRepository.findByNameAndAddress.mockResolvedValue(
      new RecyclingCenter('center-1', validPayload.name, validPayload.address, validPayload.location, [], '', 1, 0)
    );

    await expect(registerRecyclingCenter.execute(validPayload)).rejects.toMatchObject({
      message: 'Recycling center already exists',
      statusCode: 409,
    });

    expect(mockRecyclingCenterRepository.save).not.toHaveBeenCalled();
  });

  test('should throw 400 when acceptedWasteTypes contain invalid types', async () => {
    const invalidError = new Error('Invalid waste types: unknown');
    invalidError.statusCode = 400;
    mockWasteTypeValidationService.validateAcceptedWasteTypes.mockRejectedValue(invalidError);

    await expect(registerRecyclingCenter.execute(validPayload)).rejects.toMatchObject({
      message: 'Invalid waste types: unknown',
      statusCode: 400,
    });

    expect(mockRecyclingCenterRepository.findByNameAndAddress).not.toHaveBeenCalled();
    expect(mockRecyclingCenterRepository.save).not.toHaveBeenCalled();
  });

  test('should throw 400 when required fields are missing', async () => {
    await expect(registerRecyclingCenter.execute({ ...validPayload, name: '' })).rejects.toMatchObject({
      message: 'Missing required fields',
      statusCode: 400,
    });
  });

  test('should throw 400 for invalid location type', async () => {
    await expect(
      registerRecyclingCenter.execute({
        ...validPayload,
        location: { type: 'Polygon', coordinates: [-73.935242, 40.73061] },
      })
    ).rejects.toMatchObject({
      message: 'Invalid location format',
      statusCode: 400,
    });
  });

  test('should throw 400 for invalid coordinates', async () => {
    await expect(
      registerRecyclingCenter.execute({
        ...validPayload,
        location: { type: 'Point', coordinates: [-300, 100] },
      })
    ).rejects.toMatchObject({
      message: 'Invalid location coordinates',
      statusCode: 400,
    });
  });

  test('should throw 400 when currentLoadKg exceeds maxCapacityKg', async () => {
    await expect(
      registerRecyclingCenter.execute({
        ...validPayload,
        currentLoadKg: 60000,
      })
    ).rejects.toMatchObject({
      message: 'currentLoadKg must be between 0 and maxCapacityKg',
      statusCode: 400,
    });
  });
});
