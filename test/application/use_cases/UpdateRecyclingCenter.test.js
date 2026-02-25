const UpdateRecyclingCenter = require('../../../src/application/use_cases/UpdateRecyclingCenter');
const RecyclingCenter = require('../../../src/domain/entities/RecyclingCenter');

describe('UpdateRecyclingCenter Use Case', () => {
  let updateRecyclingCenter;
  let mockRecyclingCenterRepository;

  const validId = '507f191e810c19729de860ea';
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
      updateById: jest.fn(),
    };

    updateRecyclingCenter = new UpdateRecyclingCenter(mockRecyclingCenterRepository);
  });

  test('should update a recycling center with valid data', async () => {
    mockRecyclingCenterRepository.updateById.mockResolvedValue(
      new RecyclingCenter(
        validId,
        validPayload.name,
        validPayload.address,
        validPayload.location,
        validPayload.acceptedWasteTypes,
        validPayload.operatingHours,
        validPayload.maxCapacityKg,
        validPayload.currentLoadKg
      )
    );

    const result = await updateRecyclingCenter.execute(validId, validPayload);

    expect(mockRecyclingCenterRepository.updateById).toHaveBeenCalledWith(validId, validPayload);
    expect(result.id).toBe(validId);
    expect(result.name).toBe(validPayload.name);
  });

  test('should throw 400 when id is invalid', async () => {
    await expect(updateRecyclingCenter.execute('invalid-id', validPayload)).rejects.toMatchObject({
      message: 'Invalid recycling center id',
      statusCode: 400,
    });

    expect(mockRecyclingCenterRepository.updateById).not.toHaveBeenCalled();
  });

  test('should throw 400 when required fields are missing', async () => {
    await expect(updateRecyclingCenter.execute(validId, { ...validPayload, name: '' })).rejects.toMatchObject({
      message: 'Missing required fields',
      statusCode: 400,
    });
  });

  test('should throw 400 when currentLoadKg exceeds maxCapacityKg', async () => {
    await expect(
      updateRecyclingCenter.execute(validId, {
        ...validPayload,
        currentLoadKg: validPayload.maxCapacityKg + 1,
      })
    ).rejects.toMatchObject({
      message: 'currentLoadKg must be between 0 and maxCapacityKg',
      statusCode: 400,
    });
  });

  test('should throw 404 when recycling center does not exist', async () => {
    mockRecyclingCenterRepository.updateById.mockResolvedValue(null);

    await expect(updateRecyclingCenter.execute(validId, validPayload)).rejects.toMatchObject({
      message: 'Recycling center not found',
      statusCode: 404,
    });
  });

  test('should propagate repository duplicate error', async () => {
    const duplicateError = new Error('Recycling center already exists');
    duplicateError.statusCode = 409;
    mockRecyclingCenterRepository.updateById.mockRejectedValue(duplicateError);

    await expect(updateRecyclingCenter.execute(validId, validPayload)).rejects.toMatchObject({
      message: 'Recycling center already exists',
      statusCode: 409,
    });
  });
});
