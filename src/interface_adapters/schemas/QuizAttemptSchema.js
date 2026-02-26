const mongoose = require('mongoose');

/**
 * QuizAttempt Schema
 * Records a user's quiz submission: score, pass/fail, and per-question results.
 */
const QuizAttemptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    answers: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        selectedOption: { type: String, required: true },
        isCorrect: { type: Boolean, required: true }
    }]
}, { timestamps: true });

QuizAttemptSchema.index({ user: 1, quiz: 1 });
QuizAttemptSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
