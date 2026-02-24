const mongoose = require('mongoose');

/**
 * Quiz Schema
 * Represents a quiz topic with its rules and settings.
 * Admins create quizzes on specific topics (e.g., "Plastic Types", "Composting 101").
 */
const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  passingScore: { type: Number, required: true, min: 0, max: 100 }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
