class GetRecyclingCenterById {
  constructor(recyclingCenterRepository) {
    this.recyclingCenterRepository = recyclingCenterRepository;
  }

  async execute(id) {
    if (!this.isValidObjectId(id)) {
      const error = new Error('Invalid recycling center id');
      error.statusCode = 400;
      throw error;
    }

    const recyclingCenter = await this.recyclingCenterRepository.findById(id);

    if (!recyclingCenter) {
      const error = new Error('Recycling center not found');
      error.statusCode = 404;
      throw error;
    }

    return recyclingCenter;
  }

  isValidObjectId(id) {
    return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
  }
}

module.exports = GetRecyclingCenterById;
