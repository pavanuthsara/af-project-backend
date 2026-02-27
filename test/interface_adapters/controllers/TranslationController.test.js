const QuizService = require('../../../src/application/services/QuizService');
const TranslationService = require('../../../src/application/services/TranslationService');
const QuizController = require('../../../src/interface_adapters/controllers/QuizController');

// Mock both services
jest.mock('../../../src/application/services/QuizService');
jest.mock('../../../src/application/services/TranslationService');

describe('QuizController - Translation Integration', () => {
    let quizController;
    let mockReq;
    let mockRes;
    let mockNext;
    let mockQuizServiceInstance;
    let mockTranslationServiceInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        // Set up mock instances
        mockQuizServiceInstance = {
            getQuizForPlay: jest.fn(),
        };
        mockTranslationServiceInstance = {
            translateQuizContent: jest.fn(),
        };

        QuizService.mockImplementation(() => mockQuizServiceInstance);
        TranslationService.mockImplementation(() => mockTranslationServiceInstance);

        quizController = new QuizController();

        // Standard mock response objects
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    test('GET /:quizId/play without lang query returns English content (no translation)', async () => {
        const mockQuizData = {
            quiz: { _id: 'quiz1', title: 'Recycling Basics', description: 'Learn recycling' },
            questions: [
                { _id: 'q1', questionText: 'What is recycling?', options: ['A', 'B', 'C', 'D'] },
            ],
        };

        mockQuizServiceInstance.getQuizForPlay.mockResolvedValue(mockQuizData);

        mockReq = {
            params: { quizId: 'quiz1' },
            query: {}, // No lang parameter
        };

        await quizController.getQuizForPlay(mockReq, mockRes, mockNext);

        expect(mockQuizServiceInstance.getQuizForPlay).toHaveBeenCalledWith('quiz1');
        expect(mockTranslationServiceInstance.translateQuizContent).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            data: mockQuizData,
        });
    });

    test('GET /:quizId/play?lang=si returns Sinhala translated content', async () => {
        const mockQuizData = {
            quiz: { _id: 'quiz1', title: 'Recycling Basics', description: 'Learn recycling' },
            questions: [
                { _id: 'q1', questionText: 'What is recycling?', options: ['A', 'B', 'C', 'D'] },
            ],
        };

        const mockTranslatedData = {
            quiz: { _id: 'quiz1', title: 'ප්‍රතිචක්‍රීකරණ මූලික', description: 'ප්‍රතිචක්‍රීකරණය ඉගෙන ගන්න' },
            questions: [
                { _id: 'q1', questionText: 'ප්‍රතිචක්‍රීකරණය යනු කුමක්ද?', options: ['A_si', 'B_si', 'C_si', 'D_si'] },
            ],
        };

        mockQuizServiceInstance.getQuizForPlay.mockResolvedValue(mockQuizData);
        mockTranslationServiceInstance.translateQuizContent.mockResolvedValue(mockTranslatedData);

        mockReq = {
            params: { quizId: 'quiz1' },
            query: { lang: 'si' },
        };

        await quizController.getQuizForPlay(mockReq, mockRes, mockNext);

        expect(mockQuizServiceInstance.getQuizForPlay).toHaveBeenCalledWith('quiz1');
        expect(mockTranslationServiceInstance.translateQuizContent).toHaveBeenCalledWith(
            mockQuizData.quiz,
            mockQuizData.questions,
            'si'
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            data: mockTranslatedData,
        });
    });

    test('GET /:quizId/play?lang=ta returns Tamil translated content', async () => {
        const mockQuizData = {
            quiz: { _id: 'quiz1', title: 'Recycling Basics', description: 'Learn recycling' },
            questions: [
                { _id: 'q1', questionText: 'What is recycling?', options: ['A', 'B'] },
            ],
        };

        const mockTranslatedData = {
            quiz: { _id: 'quiz1', title: 'மறுசுழற்சி அடிப்படைகள்', description: 'மறுசுழற்சி கற்றுக்கொள்' },
            questions: [
                { _id: 'q1', questionText: 'மறுசுழற்சி என்றால் என்ன?', options: ['A_ta', 'B_ta'] },
            ],
        };

        mockQuizServiceInstance.getQuizForPlay.mockResolvedValue(mockQuizData);
        mockTranslationServiceInstance.translateQuizContent.mockResolvedValue(mockTranslatedData);

        mockReq = {
            params: { quizId: 'quiz1' },
            query: { lang: 'ta' },
        };

        await quizController.getQuizForPlay(mockReq, mockRes, mockNext);

        expect(mockTranslationServiceInstance.translateQuizContent).toHaveBeenCalledWith(
            mockQuizData.quiz,
            mockQuizData.questions,
            'ta'
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            data: mockTranslatedData,
        });
    });

    test('GET /:quizId/play?lang=fr returns 400 for unsupported language', async () => {
        const mockQuizData = {
            quiz: { _id: 'quiz1', title: 'Recycling Basics' },
            questions: [],
        };

        mockQuizServiceInstance.getQuizForPlay.mockResolvedValue(mockQuizData);

        const langError = new Error('Unsupported language: fr. Supported languages are: si (Sinhala), ta (Tamil)');
        langError.statusCode = 400;
        mockTranslationServiceInstance.translateQuizContent.mockRejectedValue(langError);

        mockReq = {
            params: { quizId: 'quiz1' },
            query: { lang: 'fr' },
        };

        await quizController.getQuizForPlay(mockReq, mockRes, mockNext);

        // Error should be passed to next() middleware
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('Unsupported language'),
        }));
    });

    test('Translation failure passes error to next() middleware', async () => {
        const mockQuizData = {
            quiz: { _id: 'quiz1', title: 'Recycling Basics' },
            questions: [{ _id: 'q1', questionText: 'Q?', options: ['A'] }],
        };

        mockQuizServiceInstance.getQuizForPlay.mockResolvedValue(mockQuizData);

        const translationError = new Error('Translation failed: Gemini API error');
        translationError.statusCode = 500;
        mockTranslationServiceInstance.translateQuizContent.mockRejectedValue(translationError);

        mockReq = {
            params: { quizId: 'quiz1' },
            query: { lang: 'si' },
        };

        await quizController.getQuizForPlay(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('Translation failed'),
            statusCode: 500,
        }));
    });
});
