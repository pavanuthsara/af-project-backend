class FindNearestCenters {
  constructor(centerRepository) {
    this.centerRepository = centerRepository;
  }

  async execute(latitude, longitude, maxDistanceKm = 5) {
    // Validate inputs
    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
    }

    const lat = parseFloat(latitude);
    const long = parseFloat(longitude);

    // Validate coordinates
    if (isNaN(lat) || isNaN(long)) {
      throw new Error('Invalid latitude or longitude values');
    }

    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    if (long < -180 || long > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    // Convert km to meters for MongoDB query
    const maxDistanceMeters = maxDistanceKm * 1000;

    // Find centers within the specified distance
    const centers = await this.centerRepository.findNearby(long, lat, maxDistanceMeters);

    return centers;
  }
}

module.exports = FindNearestCenters;
