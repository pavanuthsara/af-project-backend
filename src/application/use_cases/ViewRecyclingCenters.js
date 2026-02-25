class ViewRecyclingCenters {
  constructor(recyclingCenterRepository) {
    this.recyclingCenterRepository = recyclingCenterRepository;
  }

  async execute() {
    return this.recyclingCenterRepository.findAll();
  }
}

module.exports = ViewRecyclingCenters;
