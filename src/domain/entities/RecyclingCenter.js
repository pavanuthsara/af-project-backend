class RecyclingCenter {
  constructor(
    id,
    name,
    address,
    location,
    acceptedWasteTypes,
    operatingHours,
    maxCapacityKg,
    currentLoadKg
  ) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.location = location;
    this.acceptedWasteTypes = acceptedWasteTypes;
    this.operatingHours = operatingHours;
    this.maxCapacityKg = maxCapacityKg;
    this.currentLoadKg = currentLoadKg;
  }
}

module.exports = RecyclingCenter;
