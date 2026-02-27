const ExplanationService = require('../../../src/application/services/ExplanationService');

// Mock groq-sdk
jest.mock('groq-sdk', () => {
    return jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn()
            }
        }
    }));
});

const Groq = require('groq-sdk');

describe('ExplanationService', () => {
    let service;
    let mockCreate;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ExplanationService({ maxRPM: 100, maxRetries: 1, baseDelay: 10 });
        mockCreate = service.groq.chat.completions.create;
    });

    describe('constructor', () => {
        test('should initialize with default options', () => {
            const defaultService = new ExplanationService();
            expect(defaultService.maxRPM).toBe(30);
            expect(defaultService.maxRetries).toBe(3);
            expect(defaultService.baseDelay).toBe(1000);
        });

        test('should accept custom options', () => {
            expect(service.maxRPM).toBe(100);
            expect(service.maxRetries).toBe(1);
            expect(service.baseDelay).toBe(10);
        });
    });

    describe('generateExplanation', () => {
        test('should call Groq API with correctly structured prompt', async () => {
            mockCreate.mockResolvedValue({
                choices: [{ message: { content: 'The correct answer is B because...' } }]
            });

            const result = await service.generateExplanation(
                'What is recycling?',
                ['A. Burning waste', 'B. Reusing materials', 'C. Dumping', 'D. Ignoring'],
                'A. Burning waste',
                'B. Reusing materials'
            );

            expect(result).toBe('The correct answer is B because...');
            expect(mockCreate).toHaveBeenCalledTimes(1);

            const callArgs = mockCreate.mock.calls[0][0];
            expect(callArgs.model).toBe('llama-3.1-8b-instant');
            expect(callArgs.temperature).toBe(0.7);
            expect(callArgs.messages).toHaveLength(2);
            expect(callArgs.messages[0].role).toBe('system');
            expect(callArgs.messages[1].role).toBe('user');
            expect(callArgs.messages[1].content).toContain('What is recycling?');
            expect(callArgs.messages[1].content).toContain('A. Burning waste');
            expect(callArgs.messages[1].content).toContain('B. Reusing materials');
        });

        test('should propagate errors from Groq API', async () => {
            mockCreate.mockRejectedValue(new Error('API error'));

            await expect(
                service.generateExplanation('Q?', ['A', 'B'], 'A', 'B')
            ).rejects.toThrow('API error');
        });
    });

    describe('generateExplanations (batch)', () => {
        test('should return empty array for empty input', async () => {
            const result = await service.generateExplanations([]);
            expect(result).toEqual([]);
            expect(mockCreate).not.toHaveBeenCalled();
        });

        test('should return empty array for null input', async () => {
            const result = await service.generateExplanations(null);
            expect(result).toEqual([]);
        });

        test('should use single-generation path for one wrong answer', async () => {
            mockCreate.mockResolvedValue({
                choices: [{ message: { content: 'Explanation for Q1' } }]
            });

            const result = await service.generateExplanations([
                {
                    questionText: 'What is composting?',
                    options: ['A', 'B', 'C'],
                    userSelected: 'A',
                    correctAnswer: 'B'
                }
            ]);

            expect(result).toEqual(['Explanation for Q1']);
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });

        test('should batch multiple wrong answers into one API call', async () => {
            mockCreate.mockResolvedValue({
                choices: [{
                    message: {
                        content: '["Explanation 1", "Explanation 2"]'
                    }
                }]
            });

            const result = await service.generateExplanations([
                {
                    questionText: 'Q1?',
                    options: ['A', 'B'],
                    userSelected: 'A',
                    correctAnswer: 'B'
                },
                {
                    questionText: 'Q2?',
                    options: ['X', 'Y'],
                    userSelected: 'X',
                    correctAnswer: 'Y'
                }
            ]);

            expect(result).toEqual(['Explanation 1', 'Explanation 2']);
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });

        test('should handle JSON wrapped in code fences', async () => {
            mockCreate.mockResolvedValue({
                choices: [{
                    message: {
                        content: '```json\n["Exp 1", "Exp 2"]\n```'
                    }
                }]
            });

            const result = await service.generateExplanations([
                { questionText: 'Q1?', options: ['A', 'B'], userSelected: 'A', correctAnswer: 'B' },
                { questionText: 'Q2?', options: ['X', 'Y'], userSelected: 'X', correctAnswer: 'Y' }
            ]);

            expect(result).toEqual(['Exp 1', 'Exp 2']);
        });

        test('should fall back to individual calls when batch parsing fails', async () => {
            // First call (batch) returns invalid JSON
            mockCreate.mockResolvedValueOnce({
                choices: [{ message: { content: 'Not valid JSON at all' } }]
            });
            // Individual fallback calls
            mockCreate.mockResolvedValueOnce({
                choices: [{ message: { content: 'Individual exp 1' } }]
            });
            mockCreate.mockResolvedValueOnce({
                choices: [{ message: { content: 'Individual exp 2' } }]
            });

            const result = await service.generateExplanations([
                { questionText: 'Q1?', options: ['A', 'B'], userSelected: 'A', correctAnswer: 'B' },
                { questionText: 'Q2?', options: ['X', 'Y'], userSelected: 'X', correctAnswer: 'Y' }
            ]);

            expect(result).toEqual(['Individual exp 1', 'Individual exp 2']);
            expect(mockCreate).toHaveBeenCalledTimes(3); // 1 batch + 2 individual
        });

        test('should return null for individual failures during fallback', async () => {
            // Batch fails
            mockCreate.mockResolvedValueOnce({
                choices: [{ message: { content: 'bad' } }]
            });
            // First individual succeeds
            mockCreate.mockResolvedValueOnce({
                choices: [{ message: { content: 'Exp 1' } }]
            });
            // Second individual fails
            mockCreate.mockRejectedValueOnce(new Error('API down'));

            const result = await service.generateExplanations([
                { questionText: 'Q1?', options: ['A', 'B'], userSelected: 'A', correctAnswer: 'B' },
                { questionText: 'Q2?', options: ['X', 'Y'], userSelected: 'X', correctAnswer: 'Y' }
            ]);

            expect(result).toEqual(['Exp 1', null]);
        });
    });

    describe('_retryWithBackoff', () => {
        test('should retry on 429 errors', async () => {
            const error429 = new Error('Rate limited');
            error429.status = 429;

            mockCreate
                .mockRejectedValueOnce(error429)
                .mockResolvedValueOnce({
                    choices: [{ message: { content: 'Success after retry' } }]
                });

            const result = await service.generateExplanation('Q?', ['A', 'B'], 'A', 'B');
            expect(result).toBe('Success after retry');
            expect(mockCreate).toHaveBeenCalledTimes(2);
        });

        test('should throw non-429 errors immediately', async () => {
            mockCreate.mockRejectedValue(new Error('Server error'));

            await expect(
                service.generateExplanation('Q?', ['A', 'B'], 'A', 'B')
            ).rejects.toThrow('Server error');
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });
    });

    describe('_extractJsonArray', () => {
        test('should parse clean JSON array', () => {
            const result = service._extractJsonArray('["a", "b"]');
            expect(result).toEqual(['a', 'b']);
        });

        test('should strip markdown code fences', () => {
            const result = service._extractJsonArray('```json\n["a", "b"]\n```');
            expect(result).toEqual(['a', 'b']);
        });

        test('should find array in surrounding text', () => {
            const result = service._extractJsonArray('Here is the result: ["a", "b"] done.');
            expect(result).toEqual(['a', 'b']);
        });

        test('should throw when no array is found', () => {
            expect(() => service._extractJsonArray('no array here')).toThrow(
                'No JSON array found in LLM response'
            );
        });
    });
});
