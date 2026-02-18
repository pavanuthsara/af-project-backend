const CenterRepository = require('../../domain/repositories/CenterRepository');
const CenterModel = require('../schemas/CenterSchema');
const Center = require('../../domain/entities/Center');

class MongoCenterRepository extends CenterRepository {
  async save(center) {
    const mongoCenter = await CenterModel.create({
      name: center.name,
      address: center.address,
      location: center.location,
      contactInfo: center.contactInfo
    });
    
    return new Center(
      mongoCenter._id.toString(),
      mongoCenter.name,
      mongoCenter.address,
      mongoCenter.location,
      mongoCenter.contactInfo
    );
  }

  async findNearby(longitude, latitude, maxDistance = 5000) {
    // Using $near with GeoJSON
    const centers = await CenterModel.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance // in meters (5000m = 5km)
        }
      }
    });

    return centers.map(mongoCenter => new Center(
      mongoCenter._id.toString(),
      mongoCenter.name,
      mongoCenter.address,
      mongoCenter.location,
      mongoCenter.contactInfo
    ));
  }
}

module.exports = MongoCenterRepository;
