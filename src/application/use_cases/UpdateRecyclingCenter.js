class UpdateRecyclingCenter {
  constructor(recyclingCenterRepository) {
    this.recyclingCenterRepository = recyclingCenterRepository;
  }

  async execute(id, data) {
    if (!this.isValidObjectId(id)) {
      const error = new Error('Invalid recycling center id');
      error.statusCode = 400;
      throw error;
    }

    this.validateInput(data);

    const updatedCenter = await this.recyclingCenterRepository.updateById(id, data);

    if (!updatedCenter) {
      const error = new Error('Recycling center not found');
      error.statusCode = 404;
      throw error;
    }

    return updatedCenter;
  }

  isValidObjectId(id) {
    return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
  }

  validateInput(data) {
    const {
      name,
      address,
      location,
      acceptedWasteTypes,
      operatingHours,
      maxCapacityKg,
      currentLoadKg,
    } = data;

    if (
      !name
      || !address
      || !location
      || !acceptedWasteTypes
      || !operatingHours
      || maxCapacityKg === undefined
      || currentLoadKg === undefined
    ) {
      const error = new Error('Missing required fields');
      error.statusCode = 400;
      throw error;
    }

    if (location.type !== 'Point' || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      const error = new Error('Invalid location format');
      error.statusCode = 400;
      throw error;
    }

    const [lng, lat] = location.coordinates;
    const validCoordinates = typeof lng === 'number'
      && typeof lat === 'number'
      && lng >= -180
      && lng <= 180
      && lat >= -90
      && lat <= 90;

    if (!validCoordinates) {
      const error = new Error('Invalid location coordinates');
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(acceptedWasteTypes) || acceptedWasteTypes.length < 1) {
      const error = new Error('acceptedWasteTypes must be a non-empty array');
      error.statusCode = 400;
      throw error;
    }

    if (typeof maxCapacityKg !== 'number' || maxCapacityKg < 1) {
      const error = new Error('maxCapacityKg must be a number greater than or equal to 1');
      error.statusCode = 400;
      throw error;
    }

    if (typeof currentLoadKg !== 'number' || currentLoadKg < 0 || currentLoadKg > maxCapacityKg) {
      const error = new Error('currentLoadKg must be between 0 and maxCapacityKg');
      error.statusCode = 400;
      throw error;
    }
  }
}

module.exports = UpdateRecyclingCenter;
