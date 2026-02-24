class WasteItemRepository {
  async save(wasteItem) {
    throw new Error('save method must be implemented');
  }

  async findById(id) {
    throw new Error('findById method must be implemented');
  }

  async findAll() {
    throw new Error('findAll method must be implemented');
  }

  async findByCategory(categoryId) {
    throw new Error('findByCategory method must be implemented');
  }

  async update(id, updates) {
    throw new Error('update method must be implemented');
  }

  async deleteById(id) {
    throw new Error('deleteById method must be implemented');
  }
}

module.exports = WasteItemRepository;
