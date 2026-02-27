const fs = require("fs");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

class GeminiService {
  constructor({ apiKey = process.env.GEMINI_API_KEY, model = DEFAULT_MODEL } = {}) {
    this.apiKey = apiKey;
    this.model = model;
  }

  validateEnvironment() {
    if (!this.apiKey) {
      const error = new Error("GEMINI_API_KEY is not set");
      error.statusCode = 500;
      throw error;
    }

    if (typeof globalThis.fetch !== "function") {
      const error = new Error("Fetch API is not available. Use Node.js 18+.");
      error.statusCode = 500;
      throw error;
    }
  }

  async extractSearchFilters(query) {
    this.validateEnvironment();

    const prompt = this.buildFilterPrompt(query);

    const response = await this.callGemini([
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ]);

    return this.safeParseJson(response);
  }

  async identifyWasteFromImage(imagePath, mimeType) {
    this.validateEnvironment();

    const base64Image = fs.readFileSync(imagePath, {
      encoding: "base64",
    });

    const prompt = `
You are a strict waste classification assistant.

Identify the primary waste item in the image.

Return ONLY valid JSON:
{
  "itemName": "string",
  "confidence": "high | medium | low"
}

No explanations.
`;

    const response = await this.callGemini([
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ]);

    return this.safeParseJson(response);
  }

  async callGemini(contents) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Gemini API error: ${response.status} ${errorText}`);
      error.statusCode = 502;
      throw error;
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  buildFilterPrompt(query) {
    return [
      "You are a strict JSON formatter.",
      "Convert the user query into filters for recycling centers.",
      "Return ONLY valid JSON with these keys:",
      "acceptedWasteTypes (array of strings), city (string or null), name (string or null),",
      "addressKeywords (array of strings), maxDistanceKm (number or null).",
      "If not present, use null or empty array.",
      `User query: "${query}"`,
    ].join("\n");
  }

  safeParseJson(text) {
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start === -1 || end === -1) return {};
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return {};
      }
    }
  }
}

module.exports = GeminiService;