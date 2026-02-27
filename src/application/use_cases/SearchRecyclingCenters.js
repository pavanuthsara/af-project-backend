class SearchRecyclingCenters {
  constructor(recyclingCenterRepository) {
    this.recyclingCenterRepository = recyclingCenterRepository;
  }

  async execute(filters) {
    const normalized = this.normalizeFilters(filters);
    return this.recyclingCenterRepository.search(normalized);
  }

  normalizeFilters(filters) {
    const safe = filters && typeof filters === 'object' ? filters : {};

    const acceptedWasteTypes = Array.isArray(safe.acceptedWasteTypes)
      ? safe.acceptedWasteTypes.filter((v) => typeof v === 'string' && v.trim().length > 0)
      : [];

    const addressKeywords = Array.isArray(safe.addressKeywords)
      ? safe.addressKeywords.filter((v) => typeof v === 'string' && v.trim().length > 0)
      : [];

    return {
      acceptedWasteTypes,
      city: typeof safe.city === 'string' && safe.city.trim().length > 0 ? safe.city.trim() : null,
      name: typeof safe.name === 'string' && safe.name.trim().length > 0 ? safe.name.trim() : null,
      addressKeywords,
      maxDistanceKm: typeof safe.maxDistanceKm === 'number' ? safe.maxDistanceKm : null,
    };
  }
}

module.exports = SearchRecyclingCenters;
