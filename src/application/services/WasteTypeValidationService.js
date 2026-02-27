const WasteCategory = require('../../interface_adapters/schemas/WasteCategory');

class WasteTypeValidationService {
  async validateAcceptedWasteTypes(acceptedWasteTypes) {
    const cleaned = this.normalizeInput(acceptedWasteTypes);
    const uniqueLower = [...new Set(cleaned.map((type) => type.toLowerCase()))];

    const categories = await WasteCategory.find({
      $or: uniqueLower.map((type) => ({ name: new RegExp(`^${this.escapeRegex(type)}$`, 'i') })),
    }).select('name');

    const canonicalByLower = new Map(
      categories.map((category) => [category.name.toLowerCase(), category.name])
    );

    const invalidWasteTypes = uniqueLower.filter((type) => !canonicalByLower.has(type));
    if (invalidWasteTypes.length > 0) {
      const error = new Error(`Invalid waste types: ${invalidWasteTypes.join(', ')}`);
      error.statusCode = 400;
      error.invalidWasteTypes = invalidWasteTypes;
      throw error;
    }

    return cleaned.map((type) => canonicalByLower.get(type.toLowerCase()));
  }

  normalizeInput(acceptedWasteTypes) {
    if (!Array.isArray(acceptedWasteTypes) || acceptedWasteTypes.length < 1) {
      const error = new Error('acceptedWasteTypes must be a non-empty array');
      error.statusCode = 400;
      throw error;
    }

    const cleaned = acceptedWasteTypes
      .filter((type) => typeof type === 'string')
      .map((type) => type.trim())
      .filter((type) => type.length > 0);

    if (cleaned.length !== acceptedWasteTypes.length) {
      const error = new Error('acceptedWasteTypes must contain only non-empty strings');
      error.statusCode = 400;
      throw error;
    }

    return cleaned;
  }

  escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = WasteTypeValidationService;
