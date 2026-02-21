const DeleteRecyclingCenter = require('../../application/use_cases/DeleteRecyclingCenter');
const MongoRecyclingCenterRepository = require('../repositories/MongoRecyclingCenterRepository');

class DeleteRecyclingCenterController {
  async handle(req, res) {
    try {
      const { id } = req.params;

      const recyclingCenterRepository = new MongoRecyclingCenterRepository();
      const deleteRecyclingCenterUseCase = new DeleteRecyclingCenter(recyclingCenterRepository);

      await deleteRecyclingCenterUseCase.execute(id);

      return res.status(204).send();
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({ error: error.message });
      }

      if (error.statusCode === 404) {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = DeleteRecyclingCenterController;
