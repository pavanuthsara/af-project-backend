class WasteItem {
  constructor(id, name, description, category, disposalInstructions, recyclable, hazardous, compostable) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.category = category;
    this.disposalInstructions = disposalInstructions;
    this.recyclable = recyclable;
    this.hazardous = hazardous;
    this.compostable = compostable;
  }

  isRecyclable() {
    return this.recyclable === true;
  }

  isHazardous() {
    return this.hazardous === true;
  }

  isCompostable() {
    return this.compostable === true;
  }
}

module.exports = WasteItem;
