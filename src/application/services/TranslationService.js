const Groq = require('groq-sdk');

/**
 * TranslationService
 * Translates text content using Groq API (llama-3.1-8b-instant).
 * Supports Sinhala (si) and Tamil (ta).
 *
 * Optimizations:
 *  1. Request Batching   – all strings in a quiz are sent as a single JSON array prompt
 *  2. RPM Throttling     – enforces a sliding-window max requests per minute
 *  3. Exponential Backoff– retries on 429 errors with progressive delay
 *  4. In-Memory Cache    – avoids duplicate API calls for identical text+lang pairs
 */
class TranslationService {
    /**
     * @param {Object} [options]
     * @param {number} [options.maxRPM=30]      Max requests per minute (Groq free tier default)
     * @param {number} [options.maxRetries=3]    Max retry attempts on 429 errors
     * @param {number} [options.baseDelay=1000]  Base delay in ms for exponential backoff
     */
    constructor({ maxRPM = 30, maxRetries = 3, baseDelay = 1000 } = {}) {
        this.groq = new Groq({ apiKey: process.env.GROK_API_KEY });

        this.supportedLanguages = {
            si: 'Sinhala',
            ta: 'Tamil',
        };

        // Throttling state
        this.maxRPM = maxRPM;
        this._callTimestamps = [];

        // Retry config
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;

        // Translation cache: "lang:text" → translated string
        this._cache = new Map();
    }

    // ─── Internal Helpers ─────────────────────────────────────────

    /**
     * Build a deterministic cache key.
     */
    _getCacheKey(text, targetLanguage) {
        return `${targetLanguage}:${text}`;
    }

    /**
     * Sliding-window RPM throttle.
     * Waits if we've already made `maxRPM` calls in the last 60 seconds.
     */
    async _throttle() {
        const now = Date.now();
        // Remove timestamps older than 60 s
        this._callTimestamps = this._callTimestamps.filter(
            (ts) => now - ts < 60_000
        );

        if (this._callTimestamps.length >= this.maxRPM) {
            const oldest = this._callTimestamps[0];
            const waitMs = 60_000 - (now - oldest) + 50; // +50 ms buffer
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            // Clean up again after waiting
            const afterWait = Date.now();
            this._callTimestamps = this._callTimestamps.filter(
                (ts) => afterWait - ts < 60_000
            );
        }

        this._callTimestamps.push(Date.now());
    }

    /**
     * Retry a function on 429 errors with exponential backoff.
     * @param {Function} fn  Async function to execute
     * @returns {Promise<*>} Result of fn()
     */
    async _retryWithBackoff(fn) {
        let lastError;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (err) {
                lastError = err;
                const is429 =
                    err.status === 429 ||
                    err.statusCode === 429 ||
                    (err.message && err.message.includes('429'));

                if (!is429 || attempt === this.maxRetries) {
                    throw err;
                }

                const delay = this.baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }

    /**
     * Send a prompt to Groq LLM, respecting throttle + retry policies.
     */
    async _callLLM(prompt) {
        await this._throttle();
        return this._retryWithBackoff(async () => {
            const result = await this.groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
            });
            return result.choices[0].message.content;
        });
    }

    /**
     * Send a batch translation prompt with a system message enforcing JSON output.
     */
    async _callLLMJson(userPrompt) {
        await this._throttle();
        return this._retryWithBackoff(async () => {
            const result = await this.groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a translation API. You MUST respond with ONLY a valid JSON array of strings. ' +
                            'No explanations, no markdown, no code fences. Just the raw JSON array.',
                    },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.3,
            });
            return result.choices[0].message.content;
        });
    }

    /**
     * Robustly extract a JSON array from a potentially messy LLM response.
     * Strips code fences, finds the array brackets, and parses.
     */
    _extractJsonArray(raw) {
        let cleaned = raw.trim();

        // Strip markdown code fences
        if (cleaned.startsWith('```')) {
            cleaned = cleaned
                .replace(/^```(?:json)?\s*/i, '')
                .replace(/```\s*$/, '')
                .trim();
        }

        // Find the outermost [ ... ] brackets
        const start = cleaned.indexOf('[');
        const end = cleaned.lastIndexOf(']');
        if (start === -1 || end === -1 || end <= start) {
            throw new Error('No JSON array found in LLM response');
        }

        return JSON.parse(cleaned.substring(start, end + 1));
    }

    // ─── Public API ───────────────────────────────────────────────

    /**
     * Translate a single text string to the target language.
     * @param {string} text - English text to translate
     * @param {string} targetLanguage - Language code ('si' or 'ta')
     * @returns {Promise<string>} Translated text
     */
    async translateText(text, targetLanguage) {
        // Validate language
        if (!this.supportedLanguages[targetLanguage]) {
            const error = new Error(
                `Unsupported language: ${targetLanguage}. Supported languages are: si (Sinhala), ta (Tamil)`
            );
            error.statusCode = 400;
            throw error;
        }

        // Skip empty text
        if (!text || text.trim() === '') {
            return '';
        }

        // Check cache
        const cacheKey = this._getCacheKey(text, targetLanguage);
        if (this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey);
        }

        const languageName = this.supportedLanguages[targetLanguage];
        const prompt = `Translate the following English text to ${languageName}. Return ONLY the translated text, nothing else: ${text}`;

        try {
            const translated = await this._callLLM(prompt);
            this._cache.set(cacheKey, translated);
            return translated;
        } catch (err) {
            const error = new Error(`Translation failed: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }

    /**
     * Translate all translatable fields in a quiz and its questions
     * using a SINGLE batched API call.
     *
     * Fields translated: quiz.title, quiz.description,
     *                    question.questionText, question.options[]
     * Fields preserved:  _id, quiz, correctAnswer, passingScore, difficulty, etc.
     *
     * @param {Object} quiz - Quiz object
     * @param {Array}  questions - Array of question objects
     * @param {string} targetLanguage - Language code ('si' or 'ta')
     * @returns {Promise<{quiz: Object, questions: Array}>} Translated content
     */
    async translateQuizContent(quiz, questions, targetLanguage) {
        // Validate language first (fail fast)
        if (!this.supportedLanguages[targetLanguage]) {
            const error = new Error(
                `Unsupported language: ${targetLanguage}. Supported languages are: si (Sinhala), ta (Tamil)`
            );
            error.statusCode = 400;
            throw error;
        }

        // ── 1. Collect all translatable strings ───────────────────
        const strings = [];
        const uncachedStrings = [];
        const uncachedIndices = [];

        // Quiz fields
        strings.push(quiz.title || '');
        strings.push(quiz.description || '');

        // Question fields
        for (const question of questions) {
            strings.push(question.questionText || '');
            for (const option of question.options) {
                strings.push(option || '');
            }
        }

        // ── 2. Check cache for each string ────────────────────────
        const results = new Array(strings.length);
        for (let i = 0; i < strings.length; i++) {
            const text = strings[i];
            if (!text || text.trim() === '') {
                results[i] = '';
                continue;
            }
            const cacheKey = this._getCacheKey(text, targetLanguage);
            if (this._cache.has(cacheKey)) {
                results[i] = this._cache.get(cacheKey);
            } else {
                uncachedStrings.push(text);
                uncachedIndices.push(i);
            }
        }

        // ── 3. Batch-translate uncached strings in ONE API call ───
        if (uncachedStrings.length > 0) {
            const languageName = this.supportedLanguages[targetLanguage];
            const prompt =
                `Translate the following JSON array of English strings to ${languageName}. ` +
                `Return ONLY a valid JSON array of translated strings in the same order, nothing else:\n` +
                JSON.stringify(uncachedStrings);

            try {
                const rawResponse = await this._callLLMJson(prompt);
                const translatedArray = this._extractJsonArray(rawResponse);

                if (!Array.isArray(translatedArray) || translatedArray.length !== uncachedStrings.length) {
                    throw new Error('LLM returned an invalid translation array');
                }

                // Map translations back and cache them
                for (let j = 0; j < uncachedIndices.length; j++) {
                    const idx = uncachedIndices[j];
                    results[idx] = translatedArray[j];
                    this._cache.set(
                        this._getCacheKey(uncachedStrings[j], targetLanguage),
                        translatedArray[j]
                    );
                }
            } catch (err) {
                const error = new Error(`Translation failed: ${err.message}`);
                error.statusCode = 500;
                throw error;
            }
        }

        // ── 4. Reconstruct the quiz + questions from results ──────
        let idx = 0;

        const translatedQuiz = {
            ...quiz,
            title: results[idx++],
            description: results[idx++],
        };

        const translatedQuestions = [];
        for (const question of questions) {
            const translatedQuestionText = results[idx++];
            const translatedOptions = [];
            for (let k = 0; k < question.options.length; k++) {
                translatedOptions.push(results[idx++]);
            }
            translatedQuestions.push({
                ...question,
                questionText: translatedQuestionText,
                options: translatedOptions,
                // correctAnswer is intentionally NOT translated — used for grading
            });
        }

        return {
            quiz: translatedQuiz,
            questions: translatedQuestions,
        };
    }
}

module.exports = TranslationService;
