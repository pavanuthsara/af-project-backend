class DisposalActivity {
  constructor(id, userId, wasteType, quantity, weight, unit, timestamp = new Date()) {
    this.id = id;
    this.userId = userId;
    this.wasteType = wasteType;
    this.quantity = quantity;
    this.weight = weight;
    this.unit = unit;
    this.timestamp = timestamp;
  }
}

module.exports = DisposalActivity;