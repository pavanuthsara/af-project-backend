const Quiz = require('../../interface_adapters/schemas/QuizSchema');
const Question = require('../../interface_adapters/schemas/QuestionSchema');
const QuizAttempt = require('../../interface_adapters/schemas/QuizAttemptSchema');
const User = require('../../interface_adapters/schemas/UserSchema');

/**
 * QuizService
 * Handles all business logic for the Gamified Learning & Quiz Module.
 * Follows the same pattern as WasteService.
 */
class QuizService {

    // ─── Admin Methods ───────────────────────────────────────────

    /**
     * Create a new quiz topic.
     */
    async createQuiz(quizData) {
        const quiz = new Quiz(quizData);
        return await quiz.save();
    }

    /**
     * Add a question to an existing quiz.
     */
    async addQuestion(quizId, questionData) {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            const error = new Error('Quiz not found');
            error.statusCode = 404;
            throw error;
        }

        const question = new Question({ ...questionData, quiz: quizId });
        return await question.save();
    }

    /**
     * Update an existing question.
     */
    async updateQuestion(questionId, updateData) {
        const question = await Question.findById(questionId);
        if (!question) {
            const error = new Error('Question not found');
            error.statusCode = 404;
            throw error;
        }

        const updatedQuestion = await Question.findByIdAndUpdate(
            questionId,
            updateData,
            { new: true, runValidators: true }
        );
        return updatedQuestion;
    }

    /**
     * Delete a question.
     */
    async deleteQuestion(questionId) {
        const question = await Question.findByIdAndDelete(questionId);
        if (!question) {
            const error = new Error('Question not found');
            error.statusCode = 404;
            throw error;
        }
        return question;
    }

    // ─── User Methods ────────────────────────────────────────────

    /**
     * Get all quizzes with user's completion status.
     * Uses MongoDB aggregation with $lookup to join with QuizAttempt.
     */
    async getQuizzes(userId) {
        const quizzes = await Quiz.aggregate([
            {
                $lookup: {
                    from: 'quizattempts',
                    let: { quizId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$quiz', '$$quizId'] },
                                        { $eq: ['$user', userId] }
                                    ]
                                }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 }
                    ],
                    as: 'userAttempts'
                }
            },
            {
                $addFields: {
                    completed: { $gt: [{ $size: '$userAttempts' }, 0] },
                    lastAttempt: { $arrayElemAt: ['$userAttempts', 0] }
                }
            },
            {
                $project: {
                    userAttempts: 0
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        return quizzes;
    }

    /**
     * Get randomized questions for a quiz (play mode).
     * Security: correctAnswer and explanation are excluded by default via schema `select: false`.
     */
    async getQuizForPlay(quizId) {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            const error = new Error('Quiz not found');
            error.statusCode = 404;
            throw error;
        }

        // Questions are returned WITHOUT correctAnswer and explanation (select: false)
        const questions = await Question.find({ quiz: quizId });

        if (questions.length === 0) {
            const error = new Error('This quiz has no questions yet');
            error.statusCode = 400;
            throw error;
        }

        // Shuffle questions using Fisher-Yates
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return { quiz, questions: shuffled };
    }

    /**
     * Submit quiz answers, grade them server-side, award eco-points/badge if passed.
     *
     * Steps:
     * 1. Fetch Truth – retrieve correct answers from DB
     * 2. Grade – compare submitted answers against truth
     * 3. Evaluate – check score against passingScore
     * 4. Reward – add eco-points & badge if passed
     * 5. Record – save QuizAttempt
     * 6. Respond – return score, pass/fail, and explanations for wrong answers
     */
    async submitQuiz(userId, quizId, submittedAnswers) {
        // Validate quiz exists
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            const error = new Error('Quiz not found');
            error.statusCode = 404;
            throw error;
        }

        // Step 1: Fetch Truth – get correct answers (explicitly select hidden fields)
        const questionIds = submittedAnswers.map(a => a.questionId);
        const questions = await Question.find({
            _id: { $in: questionIds },
            quiz: quizId
        }).select('+correctAnswer +explanation');

        if (questions.length === 0) {
            const error = new Error('No valid questions found for this quiz');
            error.statusCode = 400;
            throw error;
        }

        // Build a lookup map for fast grading
        const truthMap = {};
        questions.forEach(q => {
            truthMap[q._id.toString()] = {
                correctAnswer: q.correctAnswer,
                explanation: q.explanation
            };
        });

        // Step 2: Grade – compare answers
        let correctCount = 0;
        const gradedAnswers = [];
        const wrongAnswerExplanations = [];

        submittedAnswers.forEach(answer => {
            const truth = truthMap[answer.questionId];
            if (!truth) return; // skip invalid question IDs

            const isCorrect = answer.selectedOption === truth.correctAnswer;
            if (isCorrect) correctCount++;

            gradedAnswers.push({
                question: answer.questionId,
                selectedOption: answer.selectedOption,
                isCorrect
            });

            if (!isCorrect) {
                wrongAnswerExplanations.push({
                    questionId: answer.questionId,
                    correctAnswer: truth.correctAnswer,
                    explanation: truth.explanation
                });
            }
        });

        const totalQuestions = questions.length;
        const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

        // Step 3: Evaluate – check against passing score
        const passed = scorePercentage >= quiz.passingScore;

        // Step 4: Reward – add eco-points and badge if passed
        if (passed) {
            const user = await User.findById(userId);
            if (user) {
                // Add 10 eco-points for passing
                user.ecoPoints = (user.ecoPoints || 0) + 10;

                // Add badge if not already earned for this quiz
                const alreadyHasBadge = user.badges.some(
                    b => b.quizId && b.quizId.toString() === quizId.toString()
                );
                if (!alreadyHasBadge) {
                    user.badges.push({
                        title: `Certified: ${quiz.title}`,
                        quizId: quiz._id,
                        earnedAt: new Date()
                    });
                }

                await user.save();
            }
        }

        // Step 5: Record – save the attempt
        const attempt = new QuizAttempt({
            user: userId,
            quiz: quizId,
            score: scorePercentage,
            totalQuestions,
            passed,
            answers: gradedAnswers
        });
        await attempt.save();

        // Step 6: Respond
        return {
            score: scorePercentage,
            correctAnswers: correctCount,
            totalQuestions,
            passed,
            wrongAnswerExplanations
        };
    }

    /**
     * Get certificates/badges earned by a user.
     */
    async getUserCertificates(userId) {
        const user = await User.findById(userId).select('badges ecoPoints');
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        return {
            ecoPoints: user.ecoPoints,
            badges: user.badges
        };
    }
}

module.exports = QuizService;
