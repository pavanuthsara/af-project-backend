class Center {
  constructor(id, name, address, location, contactInfo) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.location = location; // GeoJSON object: { type: 'Point', coordinates: [longitude, latitude] }
    this.contactInfo = contactInfo;
  }
}

module.exports = Center;
