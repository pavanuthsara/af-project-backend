class DisposalActivityRepository {
  async save(disposalActivity) {
    throw new Error('save method must be implemented');
  }

  async findById(id) {
    throw new Error('findById method must be implemented');
  }

  async findByUserId(userId) {
    throw new Error('findByUserId method must be implemented');
  }

  async deleteById(id) {
    throw new Error('deleteById method must be implemented');
  }
}

module.exports = DisposalActivityRepository;