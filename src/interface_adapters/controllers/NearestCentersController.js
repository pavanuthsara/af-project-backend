const FindNearestCenters = require('../../application/use_cases/FindNearestCenters');
const MongoCenterRepository = require('../repositories/MongoCenterRepository');

class NearestCentersController {
  async handle(req, res) {
    try {
      const { lat, long } = req.query;

      if (!lat || !long) {
        return res.status(400).json({ 
          error: 'Missing required query parameters: lat and long' 
        });
      }

      // Dependency Injection (Wiring)
      const centerRepository = new MongoCenterRepository();
      const findNearestCentersUseCase = new FindNearestCenters(centerRepository);

      const centers = await findNearestCentersUseCase.execute(lat, long);

      return res.status(200).json({
        success: true,
        count: centers.length,
        centers: centers.map(center => ({
          id: center.id,
          name: center.name,
          address: center.address,
          location: center.location,
          contactInfo: center.contactInfo
        }))
      });

    } catch (error) {
      return res.status(400).json({ 
        error: error.message 
      });
    }
  }
}

module.exports = NearestCentersController;
