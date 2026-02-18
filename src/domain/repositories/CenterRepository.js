class CenterRepository {
  async save(center) {
    throw new Error('Method not implemented: save');
  }

  async findNearby(longitude, latitude, maxDistance) {
    throw new Error('Method not implemented: findNearby');
  }
}

module.exports = CenterRepository;
