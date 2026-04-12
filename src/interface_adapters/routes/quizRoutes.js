const express = require('express');
const router = express.Router();

const QuizController = require('../controllers/QuizController');
const authMiddleware = require('../middleware/AuthMiddleware');
const authorize = require('../middleware/authorize');

const quizController = new QuizController();

// ─── Admin Routes (require admin role) ─────────────────────────

// Create a new quiz
router.post(
    '/',
    authMiddleware,
    authorize('admin'),
    quizController.createQuiz
);

// Delete a quiz and all its questions
router.delete(
    '/:quizId',
    authMiddleware,
    authorize('admin'),
    quizController.deleteQuiz
);

// Add a question to a quiz
router.post(
    '/:quizId/questions',
    authMiddleware,
    authorize('admin'),
    quizController.addQuestion
);

// Update a question
router.put(
    '/questions/:questionId',
    authMiddleware,
    authorize('admin'),
    quizController.updateQuestion
);

// Delete a question
router.delete(
    '/questions/:questionId',
    authMiddleware,
    authorize('admin'),
    quizController.deleteQuestion
);

// ─── Admin Routes (continued) ──────────────────────────────────

// Get all questions for a quiz (admin-only, includes correctAnswer & explanation)
router.get(
    '/:quizId/questions',
    authMiddleware,
    authorize('admin'),
    quizController.getQuestionsForAdmin
);

// ─── User Routes (require authentication) ──────────────────────

// Get all quizzes with completion status
router.get(
    '/',
    authMiddleware,
    quizController.getQuizzes
);

// Get user's certificates/badges
// NOTE: This route must be BEFORE /:quizId/play to avoid "certificates" being parsed as a quizId
router.get(
    '/certificates',
    authMiddleware,
    quizController.getCertificates
);

// Get questions for playing a quiz (no answers)
router.get(
    '/:quizId/play',
    authMiddleware,
    quizController.getQuizForPlay
);

// Submit quiz answers for grading
router.post(
    '/:quizId/submit',
    authMiddleware,
    quizController.submitQuiz
);

module.exports = router;
