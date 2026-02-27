const https = require('https');

/**
 * EPA Waste Reduction Model (WARM) v16
 * Net GHG savings (kg CO2e saved per kg of material) compared to landfilling.
 * Positive  = emissions AVOIDED (recycling/composting is better than landfill)
 * Negative  = net additional emissions (e.g. organic in landfill emits methane)
 */
const EPA_SAVINGS_FACTORS = {
  plastic:    { recycled: 1.02,  composted: 0,     landfill: 0     },
  paper:      { recycled: 2.58,  composted: 0.20,  landfill: 0     },
  glass:      { recycled: 0.29,  composted: 0,     landfill: 0     },
  aluminum:   { recycled: 9.13,  composted: 0,     landfill: 0     },
  metal:      { recycled: 1.75,  composted: 0,     landfill: 0     }, // steel
  organic:    { recycled: 0,     composted: 0.05,  landfill: -0.50 }, // methane from landfill
  electronic: { recycled: 0.05,  composted: 0,     landfill: 0     },
  default:    { recycled: 0.50,  composted: 0.05,  landfill: 0     },
};

/**
 * Maps normalised material key → Climatiq activity base ID.
 * Full activity ID: `${base}-disposal_method_${method}`
 * e.g.  waste_type_plastics-disposal_method_recycled
 */
const CLIMATIQ_ACTIVITY_MAP = {
  plastic:    'waste_type_plastics',
  paper:      'waste_type_paper_cardboard',
  glass:      'waste_type_glass',
  metal:      'waste_type_metals',
  aluminum:   'waste_type_metals',
  organic:    'waste_type_food',
  electronic: 'waste_type_electrical_items',
};

class ClimatiqService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.CLIMATIQ_API_KEY || null;
  }

  // ─── helpers ────────────────────────────────────────────────────────────────

  /**
   * Maps a free-text category name to a known material key.
   */
  _normaliseCategoryName(categoryName) {
    if (!categoryName) return 'default';
    const n = categoryName.toLowerCase();
    if (n.includes('plastic'))                                   return 'plastic';
    if (n.includes('aluminum') || n.includes('aluminium'))       return 'aluminum';
    if (n.includes('metal') || n.includes('steel') || n.includes('iron')) return 'metal';
    if (n.includes('paper') || n.includes('cardboard'))          return 'paper';
    if (n.includes('glass'))                                     return 'glass';
    if (n.includes('organic') || n.includes('food') || n.includes('compost')) return 'organic';
    if (n.includes('electronic') || n.includes('e-waste') || n.includes('electrical')) return 'electronic';
    return 'default';
  }

  /** Derives the disposal method from the waste item's flags. */
  _getDisposalMethod(wasteItem) {
    if (wasteItem.recyclable)  return 'recycled';
    if (wasteItem.compostable) return 'composted';
    return 'landfill';
  }

  /** Converts weight to kg. */
  _toKg(weight, unit) {
    const rates = { kg: 1, g: 0.001, lbs: 0.453592, oz: 0.0283495 };
    return weight * (rates[unit] || 1);
  }

  // ─── Climatiq API call ───────────────────────────────────────────────────────

  /**
   * Calls the Climatiq /estimate endpoint for a single activity.
   * Returns the co2e value (kg) or null on any failure.
   */
  async _callClimatiq(activityId, weightKg) {
    const body = JSON.stringify({
      emission_factor: { activity_id: activityId, data_version: '^21' },
      parameters: { weight: weightKg, weight_unit: 'kg' },
    });

    return new Promise((resolve) => {
      const options = {
        hostname: 'beta3.api.climatiq.io',
        path: '/estimate',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            resolve(typeof parsed.co2e === 'number' ? parsed.co2e : null);
          } catch {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      // Abort after 5 s so it never blocks the disposal log creation
      req.setTimeout(5000, () => { req.destroy(); resolve(null); });
      req.write(body);
      req.end();
    });
  }

  // ─── public API ─────────────────────────────────────────────────────────────

  /**
   * Estimates the CO₂ saved (kg CO₂e) by the user's disposal activity.
   *
   * Strategy:
   *   1. If CLIMATIQ_API_KEY is set → call Climatiq for both landfill and the
   *      actual disposal method, then compute savings = landfill - method.
   *   2. Fallback → use EPA WARM precomputed savings factors.
   *
   * @param {string} categoryName  - Human-readable category name (e.g. "Plastic")
   * @param {object} wasteItem     - Domain entity with .recyclable / .compostable
   * @param {number} weight        - Weight value from the disposal log
   * @param {string} unit          - 'kg' | 'g' | 'lbs' | 'oz'
   * @returns {{ co2Saved: number, disposalMethod: string, weightKg: number,
   *             materialKey: string, source: string }}
   */
  async estimateCO2(categoryName, wasteItem, weight, unit) {
    const weightKg     = parseFloat(this._toKg(weight, unit).toFixed(4));
    const materialKey  = this._normaliseCategoryName(categoryName);
    const disposalMethod = this._getDisposalMethod(wasteItem);

    let co2Saved = null;
    let source   = 'epa_warm';

    // ── Attempt Climatiq API ─────────────────────────────────────────────────
    if (this.apiKey && CLIMATIQ_ACTIVITY_MAP[materialKey]) {
      try {
        const base = CLIMATIQ_ACTIVITY_MAP[materialKey];
        const [landfillCO2, methodCO2] = await Promise.all([
          this._callClimatiq(`${base}-disposal_method_landfill`, weightKg),
          this._callClimatiq(`${base}-disposal_method_${disposalMethod}`, weightKg),
        ]);

        if (landfillCO2 !== null && methodCO2 !== null) {
          // Savings = what landfill would have emitted minus what this method emits
          co2Saved = parseFloat((landfillCO2 - methodCO2).toFixed(4));
          source   = 'climatiq';
        }
      } catch {
        // Fall through to EPA fallback
      }
    }

    // ── EPA WARM fallback ────────────────────────────────────────────────────
    if (co2Saved === null) {
      const factors = EPA_SAVINGS_FACTORS[materialKey] || EPA_SAVINGS_FACTORS.default;
      const factor  = factors[disposalMethod] ?? 0;
      co2Saved      = parseFloat((factor * weightKg).toFixed(4));
    }

    return {
      co2Saved,       // kg CO₂e (positive = savings, negative = net emissions)
      disposalMethod,
      weightKg,
      materialKey,
      source,         // 'climatiq' | 'epa_warm'
    };
  }
}

module.exports = ClimatiqService;
