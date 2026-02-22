class Truck {
  constructor(id, make, model, year, licensePlate, driverId = null) {
    this.id = id;
    this.make = make;
    this.model = model;
    this.year = year;
    this.licensePlate = licensePlate;
    this.driverId = driverId;
  }
}

module.exports = Truck;
