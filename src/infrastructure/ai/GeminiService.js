const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

class GeminiService {
  constructor({ apiKey = process.env.GEMINI_API_KEY, model = DEFAULT_MODEL } = {}) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extractSearchFilters(query) {
    if (!this.apiKey) {
      const error = new Error('GEMINI_API_KEY is not set');
      error.statusCode = 500;
      throw error;
    }

    if (typeof globalThis.fetch !== 'function') {
      const error = new Error('Fetch API is not available. Use Node.js 18+ or add a fetch polyfill.');
      error.statusCode = 500;
      throw error;
    }

    const prompt = this.buildPrompt(query);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Gemini API error: ${response.status} ${errorText}`);
      error.statusCode = 502;
      throw error;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return this.safeParseJson(text);
  }

  buildPrompt(query) {
    return [
      'You are a strict JSON formatter. Convert the user query into filters for recycling centers.',
      'Return ONLY valid JSON with these keys:',
      'acceptedWasteTypes (array of strings), city (string or null), name (string or null),',
      'addressKeywords (array of strings), maxDistanceKm (number or null).',
      'If not present, use null or an empty array. No extra text.',
      `User query: "${query}"`,
    ].join('\n');
  }

  safeParseJson(text) {
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (error) {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) return {};
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (error2) {
        return {};
      }
    }
  }
}

module.exports = GeminiService;
