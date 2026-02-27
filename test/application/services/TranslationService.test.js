const TranslationService = require('../../../src/application/services/TranslationService');

// Mock the groq-sdk
const mockCreate = jest.fn();
jest.mock('groq-sdk', () => {
    return jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: mockCreate,
            },
        },
    }));
});

// Suppress real timers in backoff / throttle so tests run fast
jest.useFakeTimers({ advanceTimers: true });

describe('TranslationService', () => {
    let translationService;

    beforeEach(() => {
        // Create service with high RPM so throttle never fires in normal tests
        translationService = new TranslationService({ maxRPM: 1000, baseDelay: 1 });
        jest.clearAllMocks();
    });

    // Helper to create a Groq-style chat completion response
    const groqResponse = (content) => ({
        choices: [{ message: { content } }],
    });

    // ─── translateText ────────────────────────────────────────────

    describe('translateText', () => {
        test('should translate text to Sinhala and return the result', async () => {
            mockCreate.mockResolvedValue(
                groqResponse('ප්ලාස්ටික් බෝතලයක් කුමන කුණු බඳුනට දැමිය යුතුද?')
            );

            const result = await translationService.translateText(
                'Which bin does a plastic bottle go into?',
                'si'
            );

            expect(result).toBe('ප්ලාස්ටික් බෝතලයක් කුමන කුණු බඳුනට දැමිය යුතුද?');
            expect(mockCreate).toHaveBeenCalledTimes(1);

            // Verify prompt format and model config
            const callArgs = mockCreate.mock.calls[0][0];
            expect(callArgs.model).toBe('llama-3.1-8b-instant');
            expect(callArgs.temperature).toBe(0.7);
            expect(callArgs.messages[0].content).toContain('Translate the following English text to Sinhala');
            expect(callArgs.messages[0].content).toContain('Which bin does a plastic bottle go into?');
        });

        test('should translate text to Tamil and return the result', async () => {
            mockCreate.mockResolvedValue(
                groqResponse('பிளாஸ்டிக் பாட்டிலை எந்த குப்பைத் தொட்டியில் போடுவது?')
            );

            const result = await translationService.translateText(
                'Which bin does a plastic bottle go into?',
                'ta'
            );

            expect(result).toBe('பிளாஸ்டிக் பாட்டிலை எந்த குப்பைத் தொட்டியில் போடுவது?');
            expect(mockCreate).toHaveBeenCalledTimes(1);

            const callArgs = mockCreate.mock.calls[0][0];
            expect(callArgs.messages[0].content).toContain('Translate the following English text to Tamil');
        });

        test('should throw 400 error for unsupported language', async () => {
            await expect(
                translationService.translateText('Hello', 'fr')
            ).rejects.toThrow('Unsupported language');

            try {
                await translationService.translateText('Hello', 'fr');
            } catch (error) {
                expect(error.statusCode).toBe(400);
            }

            // Should NOT call Groq API
            expect(mockCreate).not.toHaveBeenCalled();
        });

        test('should handle Groq API errors gracefully', async () => {
            mockCreate.mockRejectedValue(new Error('Groq API error'));

            await expect(
                translationService.translateText('Hello', 'si')
            ).rejects.toThrow('Translation failed');

            try {
                await translationService.translateText('Hello', 'si');
            } catch (error) {
                expect(error.statusCode).toBe(500);
            }
        });

        test('should return empty string for empty text input without calling API', async () => {
            const result = await translationService.translateText('', 'si');

            expect(result).toBe('');
            expect(mockCreate).not.toHaveBeenCalled();
        });
    });

    // ─── translateQuizContent (Batched) ───────────────────────────

    describe('translateQuizContent', () => {
        test('should batch all strings into ONE API call', async () => {
            const quiz = {
                _id: 'quiz123',
                title: 'Recycling Basics',
                description: 'Learn the fundamentals of recycling',
                passingScore: 70,
            };
            const questions = [
                {
                    _id: 'q1',
                    questionText: 'Which bin does a plastic bottle go into?',
                    options: ['Blue bin', 'Red bin', 'Green bin', 'Yellow bin'],
                    quiz: 'quiz123',
                },
            ];

            const translatedArray = [
                'ප්‍රතිචක්‍රීකරණ මූලික කරුණු',
                'ප්‍රතිචක්‍රීකරණයේ මූලික කරුණු ඉගෙන ගන්න',
                'ප්ලාස්ටික් බෝතලයක් කුමන කුණු බඳුනට දැමිය යුතුද?',
                'නිල් බඳුන',
                'රතු බඳුන',
                'කොළ බඳුන',
                'කහ බඳුන',
            ];

            mockCreate.mockResolvedValue(
                groqResponse(JSON.stringify(translatedArray))
            );

            const result = await translationService.translateQuizContent(quiz, questions, 'si');

            // Only ONE API call (batched)
            expect(mockCreate).toHaveBeenCalledTimes(1);

            // Verify the prompt contains JSON array
            const callArgs = mockCreate.mock.calls[0][0];
            expect(callArgs.messages[0].content).toContain('JSON array');
            expect(callArgs.messages[0].content).toContain('Sinhala');

            // Verify translated content
            expect(result.quiz.title).toBe('ප්‍රතිචක්‍රීකරණ මූලික කරුණු');
            expect(result.quiz.description).toBe('ප්‍රතිචක්‍රීකරණයේ මූලික කරුණු ඉගෙන ගන්න');
            expect(result.questions[0].questionText).toBe('ප්ලාස්ටික් බෝතලයක් කුමන කුණු බඳුනට දැමිය යුතුද?');
            expect(result.questions[0].options).toEqual([
                'නිල් බඳුන',
                'රතු බඳුන',
                'කොළ බඳුන',
                'කහ බඳුන',
            ]);
        });

        test('should preserve non-translatable fields (_id, quiz, correctAnswer, passingScore)', async () => {
            const quiz = {
                _id: 'quiz123',
                title: 'Title',
                description: 'Desc',
                passingScore: 70,
                difficulty: 'easy',
            };
            const questions = [
                {
                    _id: 'q1',
                    questionText: 'Question?',
                    options: ['A', 'B'],
                    correctAnswer: 'A',
                    quiz: 'quiz123',
                },
            ];

            mockCreate.mockResolvedValue(
                groqResponse(JSON.stringify(['T-Title', 'T-Desc', 'T-Question', 'T-A', 'T-B']))
            );

            const result = await translationService.translateQuizContent(quiz, questions, 'ta');

            expect(result.quiz._id).toBe('quiz123');
            expect(result.quiz.passingScore).toBe(70);
            expect(result.quiz.difficulty).toBe('easy');
            expect(result.questions[0]._id).toBe('q1');
            expect(result.questions[0].quiz).toBe('quiz123');
            expect(result.questions[0].correctAnswer).toBe('A');
        });

        test('should handle quiz with no questions (empty array)', async () => {
            const quiz = {
                _id: 'quiz123',
                title: 'Title',
                description: 'Desc',
            };
            const questions = [];

            mockCreate.mockResolvedValue(
                groqResponse(JSON.stringify(['Translated Title', 'Translated Desc']))
            );

            const result = await translationService.translateQuizContent(quiz, questions, 'si');

            expect(result.quiz.title).toBe('Translated Title');
            expect(result.quiz.description).toBe('Translated Desc');
            expect(result.questions).toEqual([]);
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });

        test('should handle LLM returning JSON wrapped in markdown code fences', async () => {
            const quiz = { _id: 'q1', title: 'Test', description: 'Desc' };
            const questions = [];

            mockCreate.mockResolvedValue(
                groqResponse('```json\n["T-Test", "T-Desc"]\n```')
            );

            const result = await translationService.translateQuizContent(quiz, questions, 'si');

            expect(result.quiz.title).toBe('T-Test');
            expect(result.quiz.description).toBe('T-Desc');
        });

        test('should throw if LLM returns invalid JSON', async () => {
            const quiz = { _id: 'q1', title: 'Test', description: 'Desc' };
            const questions = [];

            mockCreate.mockResolvedValue(
                groqResponse('not valid json at all')
            );

            await expect(
                translationService.translateQuizContent(quiz, questions, 'si')
            ).rejects.toThrow('Translation failed');
        });

        test('should throw if LLM returns array of wrong length', async () => {
            const quiz = { _id: 'q1', title: 'Test', description: 'Desc' };
            const questions = [];

            mockCreate.mockResolvedValue(
                groqResponse(JSON.stringify(['only one']))
            );

            await expect(
                translationService.translateQuizContent(quiz, questions, 'si')
            ).rejects.toThrow('Translation failed');
        });
    });

    // ─── Exponential Backoff ──────────────────────────────────────

    describe('exponential backoff', () => {
        test('should retry on 429 errors and succeed on third attempt', async () => {
            const error429 = new Error('429 Too Many Requests');
            error429.status = 429;

            mockCreate
                .mockRejectedValueOnce(error429)
                .mockRejectedValueOnce(error429)
                .mockResolvedValueOnce(groqResponse('Translated'));

            const result = await translationService.translateText('Hello', 'si');

            expect(result).toBe('Translated');
            expect(mockCreate).toHaveBeenCalledTimes(3);
        });

        test('should throw after exhausting all retries on persistent 429', async () => {
            const error429 = new Error('429 Too Many Requests');
            error429.status = 429;

            mockCreate.mockRejectedValue(error429);

            await expect(
                translationService.translateText('Hello', 'si')
            ).rejects.toThrow('Translation failed');

            // 1 initial + 3 retries = 4
            expect(mockCreate).toHaveBeenCalledTimes(4);
        });

        test('should NOT retry on non-429 errors', async () => {
            mockCreate.mockRejectedValue(new Error('Internal Server Error'));

            await expect(
                translationService.translateText('Hello', 'si')
            ).rejects.toThrow('Translation failed');

            // Only 1 attempt, no retries
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });
    });

    // ─── In-Memory Cache ──────────────────────────────────────────

    describe('caching', () => {
        test('should cache translateText results and not call API again for same input', async () => {
            mockCreate.mockResolvedValue(groqResponse('Translated Hello'));

            // First call – hits API
            const result1 = await translationService.translateText('Hello', 'si');
            expect(result1).toBe('Translated Hello');
            expect(mockCreate).toHaveBeenCalledTimes(1);

            // Second call – cache hit, no API call
            const result2 = await translationService.translateText('Hello', 'si');
            expect(result2).toBe('Translated Hello');
            expect(mockCreate).toHaveBeenCalledTimes(1); // still 1
        });

        test('should cache per language – same text, different language makes new API call', async () => {
            mockCreate
                .mockResolvedValueOnce(groqResponse('Sinhala Hello'))
                .mockResolvedValueOnce(groqResponse('Tamil Hello'));

            const r1 = await translationService.translateText('Hello', 'si');
            const r2 = await translationService.translateText('Hello', 'ta');

            expect(r1).toBe('Sinhala Hello');
            expect(r2).toBe('Tamil Hello');
            expect(mockCreate).toHaveBeenCalledTimes(2);
        });

        test('translateQuizContent should use cache for previously translated strings', async () => {
            // Pre-populate cache via translateText
            mockCreate.mockResolvedValueOnce(groqResponse('Cached Title'));
            await translationService.translateText('Title', 'si');
            expect(mockCreate).toHaveBeenCalledTimes(1);

            // Now translate a quiz that includes 'Title' — it should be cached
            const quiz = { _id: 'q1', title: 'Title', description: 'Desc' };
            const questions = [];

            // Only 'Desc' is uncached, so API is called with array of 1 element
            mockCreate.mockResolvedValueOnce(
                groqResponse(JSON.stringify(['Translated Desc']))
            );

            const result = await translationService.translateQuizContent(quiz, questions, 'si');

            expect(result.quiz.title).toBe('Cached Title');
            expect(result.quiz.description).toBe('Translated Desc');
            // 1 initial translateText + 1 batched call = 2 total
            expect(mockCreate).toHaveBeenCalledTimes(2);
        });

        test('translateQuizContent should skip API call entirely if all strings are cached', async () => {
            // Pre-populate cache
            mockCreate
                .mockResolvedValueOnce(groqResponse('T-Title'))
                .mockResolvedValueOnce(groqResponse('T-Desc'));

            await translationService.translateText('Title', 'si');
            await translationService.translateText('Desc', 'si');
            expect(mockCreate).toHaveBeenCalledTimes(2);

            const quiz = { _id: 'q1', title: 'Title', description: 'Desc' };
            const result = await translationService.translateQuizContent(quiz, [], 'si');

            expect(result.quiz.title).toBe('T-Title');
            expect(result.quiz.description).toBe('T-Desc');
            // No additional API calls
            expect(mockCreate).toHaveBeenCalledTimes(2);
        });
    });
});
