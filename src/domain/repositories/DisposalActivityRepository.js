class DisposalActivityRepository {
  async save(disposalActivity) {
    throw new Error('save method must be implemented');
  }

  async findById(id) {
    throw new Error('findById method must be implemented');
  }

  async findByUserId(userId, populate = false) {
    throw new Error('findByUserId method must be implemented');
  }

  async findByWasteId(wasteId) {
    throw new Error('findByWasteId method must be implemented');
  }

  async update(id, updates) {
    throw new Error('update method must be implemented');
  }

  async deleteById(id) {
    throw new Error('deleteById method must be implemented');
  }

  async getAggregatedStats(startDate, endDate) {
    throw new Error('getAggregatedStats method must be implemented');
  }

  async getTotalWasteByUser(userId, startDate, endDate) {
    throw new Error('getTotalWasteByUser method must be implemented');
  }
}

module.exports = DisposalActivityRepository;