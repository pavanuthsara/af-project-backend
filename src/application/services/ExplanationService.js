const Groq = require('groq-sdk');

/**
 * ExplanationService
 * Generates smart, AI-powered explanations when a user answers a quiz question
 * incorrectly, using the Groq API (llama-3.1-8b-instant).
 *
 * Reuses the same resilience patterns as TranslationService:
 *  1. RPM Throttling     – sliding-window max requests per minute
 *  2. Exponential Backoff– retries on 429 errors with progressive delay
 */
class ExplanationService {
    /**
     * @param {Object} [options]
     * @param {number} [options.maxRPM=30]      Max requests per minute
     * @param {number} [options.maxRetries=3]    Max retry attempts on 429 errors
     * @param {number} [options.baseDelay=1000]  Base delay in ms for exponential backoff
     */
    constructor({ maxRPM = 30, maxRetries = 3, baseDelay = 1000 } = {}) {
        this.groq = new Groq({ apiKey: process.env.GROK_API_KEY });

        // Throttling state
        this.maxRPM = maxRPM;
        this._callTimestamps = [];

        // Retry config
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
    }

    // ─── Internal Helpers ─────────────────────────────────────────

    /**
     * Sliding-window RPM throttle.
     * Waits if we've already made `maxRPM` calls in the last 60 seconds.
     */
    async _throttle() {
        const now = Date.now();
        this._callTimestamps = this._callTimestamps.filter(
            (ts) => now - ts < 60_000
        );

        if (this._callTimestamps.length >= this.maxRPM) {
            const oldest = this._callTimestamps[0];
            const waitMs = 60_000 - (now - oldest) + 50;
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            const afterWait = Date.now();
            this._callTimestamps = this._callTimestamps.filter(
                (ts) => afterWait - ts < 60_000
            );
        }

        this._callTimestamps.push(Date.now());
    }

    /**
     * Retry a function on 429 errors with exponential backoff.
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

                const delay = this.baseDelay * Math.pow(2, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }

    /**
     * Call Groq LLM with a system + user message, respecting throttle + retry.
     */
    async _callLLM(systemPrompt, userPrompt) {
        await this._throttle();
        return this._retryWithBackoff(async () => {
            const result = await this.groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.7,
            });
            return result.choices[0].message.content;
        });
    }

    /**
     * Robustly extract a JSON array from a potentially messy LLM response.
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

        const start = cleaned.indexOf('[');
        const end = cleaned.lastIndexOf(']');
        if (start === -1 || end === -1 || end <= start) {
            throw new Error('No JSON array found in LLM response');
        }

        return JSON.parse(cleaned.substring(start, end + 1));
    }

    // ─── Public API ───────────────────────────────────────────────

    /**
     * Generate a smart explanation for a single wrong answer.
     *
     * @param {string} questionText  The quiz question
     * @param {string[]} options     The answer options
     * @param {string} userSelected  The option the student chose
     * @param {string} correctAnswer The correct option
     * @returns {Promise<string>}    AI-generated explanation
     */
    async generateExplanation(questionText, options, userSelected, correctAnswer) {
        const systemPrompt =
            'You are a friendly, encouraging quiz tutor. ' +
            'When a student gets a question wrong, you explain why the correct answer is right ' +
            'and why their chosen answer is wrong. Keep explanations clear and concise (2-3 sentences). ' +
            'Do NOT repeat the question or the options in your answer.';

        const userPrompt =
            `Question: ${questionText}\n` +
            `Options: ${options.join(', ')}\n` +
            `Student's Answer: ${userSelected}\n` +
            `Correct Answer: ${correctAnswer}\n\n` +
            `Explain why the correct answer is right and why the student's answer is wrong.`;

        return this._callLLM(systemPrompt, userPrompt);
    }

    /**
     * Batch-generate smart explanations for multiple wrong answers in a single
     * API call for efficiency.
     *
     * @param {Array<{questionText: string, options: string[], userSelected: string, correctAnswer: string}>} wrongAnswers
     * @returns {Promise<string[]>} Array of AI-generated explanations (same order)
     */
    async generateExplanations(wrongAnswers) {
        if (!wrongAnswers || wrongAnswers.length === 0) {
            return [];
        }

        // Single question – use the simpler path
        if (wrongAnswers.length === 1) {
            const wa = wrongAnswers[0];
            const explanation = await this.generateExplanation(
                wa.questionText,
                wa.options,
                wa.userSelected,
                wa.correctAnswer
            );
            return [explanation];
        }

        // Multiple questions – batch into one LLM call
        const systemPrompt =
            'You are a friendly, encouraging quiz tutor. ' +
            'You will receive multiple wrong-answer scenarios as a JSON array. ' +
            'For each one, provide a clear, concise explanation (2-3 sentences) of why ' +
            'the correct answer is right and why the student\'s answer is wrong. ' +
            'Respond with ONLY a valid JSON array of explanation strings, in the same order. ' +
            'No markdown, no code fences, just the raw JSON array.';

        const scenarios = wrongAnswers.map((wa, i) => ({
            index: i + 1,
            question: wa.questionText,
            options: wa.options,
            studentAnswer: wa.userSelected,
            correctAnswer: wa.correctAnswer,
        }));

        const userPrompt = JSON.stringify(scenarios);

        try {
            const raw = await this._callLLM(systemPrompt, userPrompt);
            const parsed = this._extractJsonArray(raw);

            if (!Array.isArray(parsed) || parsed.length !== wrongAnswers.length) {
                throw new Error('LLM returned mismatched explanation count');
            }

            return parsed;
        } catch {
            // Fallback: generate individually if batch parsing fails
            const results = [];
            for (const wa of wrongAnswers) {
                try {
                    const explanation = await this.generateExplanation(
                        wa.questionText,
                        wa.options,
                        wa.userSelected,
                        wa.correctAnswer
                    );
                    results.push(explanation);
                } catch {
                    results.push(null); // will be replaced with static fallback
                }
            }
            return results;
        }
    }
}

module.exports = ExplanationService;
