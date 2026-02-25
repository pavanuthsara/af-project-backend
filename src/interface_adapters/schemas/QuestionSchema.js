const mongoose = require("mongoose");

/**
 * Question Schema
 * Represents a question belonging to a specific quiz.
 *
 * Security: correctAnswer and explanation have `select: false` so they are
 * excluded by default from queries. The /play endpoint naturally won't leak
 * answers. Use `.select('+correctAnswer +explanation')` when grading.
 */
const QuestionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    questionText: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length >= 2,
        message: "A question must have at least 2 options",
      },
    },
    correctAnswer: {
      type: String,
      required: true,
      select: false,
      validate: {
        validator: function (value) {
          return Array.isArray(this.options) && this.options.includes(value);
        },
        message: "correctAnswer must be one of the options.",
      },
    },
    explanation: { type: String, required: true, select: false },
    imageUrl: { type: String, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Question", QuestionSchema);
