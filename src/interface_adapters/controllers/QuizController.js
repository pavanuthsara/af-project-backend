const QuizService = require('../../application/services/QuizService');
const TranslationService = require('../../application/services/TranslationService');
const ExplanationService = require('../../application/services/ExplanationService');

/**
 * QuizController
 * Handles HTTP requests for the Gamified Learning & Quiz Module.
 * Follows the same pattern as WasteCategoryController.
 */
class QuizController {
    constructor() {
        this.explanationService = new ExplanationService();
        this.quizService = new QuizService({ explanationService: this.explanationService });
        this.translationService = new TranslationService();
    }

    // ─── Admin Endpoints ─────────────────────────────────────────

    /**
     * POST /api/quizzes
     * Creates a new quiz topic.
     */
    createQuiz = async (req, res, next) => {
        try {
            const { title, description, difficulty, passingScore } = req.body;
            const quiz = await this.quizService.createQuiz({
                title,
                description,
                difficulty,
                passingScore
            });

            res.status(201).json({
                success: true,
                data: quiz
            });
        } catch (error) {
            if (error.code === 11000) {
                const duplicateError = new Error('Quiz title already exists');
                duplicateError.statusCode = 400;
                return next(duplicateError);
            }
            next(error);
        }
    };

    /**
     * POST /api/quizzes/:quizId/questions
     * Adds a question to a specific quiz.
     */
    addQuestion = async (req, res, next) => {
        try {
            const { quizId } = req.params;
            const { questionText, options, correctAnswer, explanation, imageUrl } = req.body;
            const question = await this.quizService.addQuestion(quizId, {
                questionText,
                options,
                correctAnswer,
                explanation,
                imageUrl: imageUrl || null
            });

            res.status(201).json({
                success: true,
                data: question
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * PUT /api/quizzes/questions/:questionId
     * Updates an existing question.
     */
    updateQuestion = async (req, res, next) => {
        try {
            const { questionId } = req.params;
            const { questionText, options, correctAnswer, explanation, imageUrl } = req.body;

            // Only allow specific fields to be updated
            const updateData = {};
            if (questionText !== undefined) updateData.questionText = questionText;
            if (options !== undefined) updateData.options = options;
            if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;
            if (explanation !== undefined) updateData.explanation = explanation;
            if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

            const updatedQuestion = await this.quizService.updateQuestion(questionId, updateData);

            res.status(200).json({
                success: true,
                data: updatedQuestion
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * DELETE /api/quizzes/questions/:questionId
     * Removes a question from the database.
     */
    deleteQuestion = async (req, res, next) => {
        try {
            const { questionId } = req.params;
            await this.quizService.deleteQuestion(questionId);

            res.status(200).json({
                success: true,
                message: 'Question deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    // ─── User Endpoints ──────────────────────────────────────────

    /**
     * GET /api/quizzes
     * Fetches all quizzes with the user's completion status.
     */
    getQuizzes = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const quizzes = await this.quizService.getQuizzes(userId);

            res.status(200).json({
                success: true,
                data: quizzes
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /api/quizzes/:quizId/play
     * Fetches randomized questions for a quiz (no answers included).
     */
    getQuizForPlay = async (req, res, next) => {
        try {
            const { quizId } = req.params;
            const { lang } = req.query;
            const result = await this.quizService.getQuizForPlay(quizId);

            // If a language is specified (and it's not English), translate the content
            if (lang && lang !== 'en') {
                const translatedResult = await this.translationService.translateQuizContent(
                    result.quiz,
                    result.questions,
                    lang
                );
                return res.status(200).json({
                    success: true,
                    data: translatedResult,
                });
            }

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /api/quizzes/:quizId/submit
     * Submits answers, grades on server, returns score + explanations.
     */
    submitQuiz = async (req, res, next) => {
        try {
            const { quizId } = req.params;
            const userId = req.user.id;
            const { answers } = req.body;

            if (!answers || !Array.isArray(answers) || answers.length === 0) {
                const error = new Error('Answers array is required and must not be empty');
                error.statusCode = 400;
                throw error;
            }

            // Validate each answer object structure
            for (let i = 0; i < answers.length; i++) {
                const answer = answers[i];

                if (!answer || typeof answer !== 'object') {
                    const error = new Error(`Answer at index ${i} must be an object`);
                    error.statusCode = 400;
                    throw error;
                }

                if (!answer.questionId || typeof answer.questionId !== 'string') {
                    const error = new Error(`Answer at index ${i} must have a valid questionId (string)`);
                    error.statusCode = 400;
                    throw error;
                }

                if (!answer.selectedOption || typeof answer.selectedOption !== 'string') {
                    const error = new Error(`Answer at index ${i} must have a valid selectedOption (string)`);
                    error.statusCode = 400;
                    throw error;
                }
            }

            const result = await this.quizService.submitQuiz(userId, quizId, answers);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /api/quizzes/certificates
     * Fetches badges and eco-points earned by the user.
     */
    getCertificates = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const result = await this.quizService.getUserCertificates(userId);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = QuizController;
