const QuizService = require('../../../src/application/services/QuizService');
const Quiz = require('../../../src/interface_adapters/schemas/QuizSchema');
const Question = require('../../../src/interface_adapters/schemas/QuestionSchema');
const QuizAttempt = require('../../../src/interface_adapters/schemas/QuizAttemptSchema');
const User = require('../../../src/interface_adapters/schemas/UserSchema');

// Mock the schemas
jest.mock('../../../src/interface_adapters/schemas/QuizSchema');
jest.mock('../../../src/interface_adapters/schemas/QuestionSchema');
jest.mock('../../../src/interface_adapters/schemas/QuizAttemptSchema');
jest.mock('../../../src/interface_adapters/schemas/UserSchema');

// Valid 24-character hex strings that pass mongoose.Types.ObjectId.isValid()
const VALID_USER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const VALID_QUIZ_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const VALID_QUESTION_ID_1 = 'cccccccccccccccccccccccc';
const VALID_QUESTION_ID_2 = 'dddddddddddddddddddddddd';
const VALID_QUESTION_ID_3 = 'eeeeeeeeeeeeeeeeeeeeeeee';

describe('QuizService', () => {
  let quizService;

  beforeEach(() => {
    quizService = new QuizService();
    jest.clearAllMocks();
  });

  describe('Admin Methods', () => {
    describe('createQuiz', () => {
      test('should successfully create a new quiz', async () => {
        const quizData = {
          title: 'Recycling Basics',
          description: 'Learn the fundamentals of recycling',
          passingScore: 70
        };

        const mockQuiz = {
          ...quizData,
          _id: 'quiz123',
          save: jest.fn().mockResolvedValue({ _id: 'quiz123', ...quizData })
        };
        Quiz.mockImplementation(() => mockQuiz);

        const result = await quizService.createQuiz(quizData);

        expect(Quiz).toHaveBeenCalledWith(quizData);
        expect(mockQuiz.save).toHaveBeenCalled();
        expect(result).toEqual(expect.objectContaining({ _id: 'quiz123' }));
      });
    });

    describe('addQuestion', () => {
      test('should successfully add a question to an existing quiz', async () => {
        const quizId = 'quiz123';
        const questionData = {
          text: 'What is recycling?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
          explanation: 'Recycling is...'
        };

        const mockQuiz = { _id: quizId, title: 'Recycling Basics' };
        const mockQuestion = {
          ...questionData,
          quiz: quizId,
          _id: 'question123',
          save: jest.fn().mockResolvedValue({ _id: 'question123', ...questionData, quiz: quizId })
        };

        Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
        Question.mockImplementation(() => mockQuestion);

        const result = await quizService.addQuestion(quizId, questionData);

        expect(Quiz.findById).toHaveBeenCalledWith(quizId);
        expect(Question).toHaveBeenCalledWith({ ...questionData, quiz: quizId });
        expect(mockQuestion.save).toHaveBeenCalled();
        expect(result).toEqual(expect.objectContaining({ _id: 'question123' }));
      });

      test('should throw 404 error when quiz not found', async () => {
        const quizId = 'nonexistent';
        const questionData = { text: 'Test question' };

        Quiz.findById = jest.fn().mockResolvedValue(null);

        await expect(quizService.addQuestion(quizId, questionData))
          .rejects.toThrow('Quiz not found');

        try {
          await quizService.addQuestion(quizId, questionData);
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });
    });

    describe('updateQuestion', () => {
      test('should successfully update a question', async () => {
        const questionId = 'question123';
        const updateData = { text: 'Updated question text' };
        const mockQuestion = { _id: questionId, text: 'Old text' };
        const updatedQuestion = { _id: questionId, text: 'Updated question text' };

        Question.findById = jest.fn().mockResolvedValue(mockQuestion);
        Question.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedQuestion);

        const result = await quizService.updateQuestion(questionId, updateData);

        expect(Question.findById).toHaveBeenCalledWith(questionId);
        expect(Question.findByIdAndUpdate).toHaveBeenCalledWith(
          questionId,
          updateData,
          { new: true, runValidators: true }
        );
        expect(result).toEqual(updatedQuestion);
      });

      test('should throw 404 error when question not found', async () => {
        const questionId = 'nonexistent';
        const updateData = { text: 'Updated text' };

        Question.findById = jest.fn().mockResolvedValue(null);

        await expect(quizService.updateQuestion(questionId, updateData))
          .rejects.toThrow('Question not found');

        try {
          await quizService.updateQuestion(questionId, updateData);
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });
    });

    describe('deleteQuestion', () => {
      test('should successfully delete a question', async () => {
        const questionId = 'question123';
        const mockQuestion = { _id: questionId, text: 'Test question' };

        Question.findByIdAndDelete = jest.fn().mockResolvedValue(mockQuestion);

        const result = await quizService.deleteQuestion(questionId);

        expect(Question.findByIdAndDelete).toHaveBeenCalledWith(questionId);
        expect(result).toEqual(mockQuestion);
      });

      test('should throw 404 error when question not found', async () => {
        const questionId = 'nonexistent';

        Question.findByIdAndDelete = jest.fn().mockResolvedValue(null);

        await expect(quizService.deleteQuestion(questionId))
          .rejects.toThrow('Question not found');

        try {
          await quizService.deleteQuestion(questionId);
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });
    });
  });

  describe('User Methods', () => {
    describe('getQuizzes', () => {
      test('should return all quizzes with user completion status', async () => {
        const mockQuizzes = [
          {
            _id: 'quiz1',
            title: 'Recycling Basics',
            completed: true,
            lastAttempt: { score: 85, passed: true }
          },
          {
            _id: 'quiz2',
            title: 'Composting 101',
            completed: false,
            lastAttempt: null
          }
        ];

        Quiz.aggregate = jest.fn().mockResolvedValue(mockQuizzes);

        const result = await quizService.getQuizzes(VALID_USER_ID);

        expect(Quiz.aggregate).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              $lookup: expect.objectContaining({
                from: 'quizattempts'
              })
            })
          ])
        );
        expect(result).toEqual(mockQuizzes);
        expect(result[0].completed).toBe(true);
        expect(result[1].completed).toBe(false);
      });

      test('should convert userId string to ObjectId in the aggregation pipeline', async () => {
        Quiz.aggregate = jest.fn().mockResolvedValue([]);

        await quizService.getQuizzes(VALID_USER_ID);

        // Verify the pipeline uses an ObjectId in the $user comparison, not a raw string
        const pipeline = Quiz.aggregate.mock.calls[0][0];
        const lookupStage = pipeline.find(stage => stage.$lookup);
        const matchStage = lookupStage.$lookup.pipeline[0].$match;
        const userComparison = matchStage.$expr.$and[1].$eq[1];

        // The value should NOT be a plain string – it should be an ObjectId instance
        expect(typeof userComparison).not.toBe('string');
        expect(userComparison.toString()).toBe(VALID_USER_ID);
      });

      test('should handle empty quiz list', async () => {
        Quiz.aggregate = jest.fn().mockResolvedValue([]);

        const result = await quizService.getQuizzes(VALID_USER_ID);

        expect(result).toEqual([]);
      });
    });

    describe('getQuizForPlay', () => {
      test('should return quiz with shuffled questions', async () => {
        const quizId = 'quiz123';
        const mockQuiz = { _id: quizId, title: 'Recycling Basics' };
        const mockQuestions = [
          { _id: 'q1', text: 'Question 1', options: ['A', 'B'] },
          { _id: 'q2', text: 'Question 2', options: ['A', 'B'] },
          { _id: 'q3', text: 'Question 3', options: ['A', 'B'] }
        ];

        Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
        Question.find = jest.fn().mockResolvedValue(mockQuestions);

        const result = await quizService.getQuizForPlay(quizId);

        expect(Quiz.findById).toHaveBeenCalledWith(quizId);
        expect(Question.find).toHaveBeenCalledWith({ quiz: quizId });
        expect(result.quiz).toEqual(mockQuiz);
        expect(result.questions).toHaveLength(3);
        // Verify all questions are present (even if shuffled)
        expect(result.questions.map(q => q._id).sort()).toEqual(['q1', 'q2', 'q3']);
      });

      test('should throw 404 error when quiz not found', async () => {
        const quizId = 'nonexistent';

        Quiz.findById = jest.fn().mockResolvedValue(null);

        await expect(quizService.getQuizForPlay(quizId))
          .rejects.toThrow('Quiz not found');

        try {
          await quizService.getQuizForPlay(quizId);
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });

      test('should throw 400 error when quiz has no questions', async () => {
        const quizId = 'quiz123';
        const mockQuiz = { _id: quizId, title: 'Empty Quiz' };

        Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
        Question.find = jest.fn().mockResolvedValue([]);

        await expect(quizService.getQuizForPlay(quizId))
          .rejects.toThrow('This quiz has no questions yet');

        try {
          await quizService.getQuizForPlay(quizId);
        } catch (error) {
          expect(error.statusCode).toBe(400);
        }
      });
    });

    describe('submitQuiz', () => {
      test('should grade quiz correctly and not award points when not passed', async () => {
        const submittedAnswers = [
          { questionId: VALID_QUESTION_ID_1, selectedOption: 'A' },
          { questionId: VALID_QUESTION_ID_2, selectedOption: 'B' },
          { questionId: VALID_QUESTION_ID_3, selectedOption: 'C' }
        ];

        const mockQuiz = {
          _id: VALID_QUIZ_ID,
          title: 'Recycling Basics',
          passingScore: 70
        };

        const mockQuestions = [
          {
            _id: VALID_QUESTION_ID_1,
            correctAnswer: 'A',
            explanation: 'Explanation 1'
          },
          {
            _id: VALID_QUESTION_ID_2,
            correctAnswer: 'B',
            explanation: 'Explanation 2'
          },
          {
            _id: VALID_QUESTION_ID_3,
            correctAnswer: 'D',
            explanation: 'Explanation 3'
          }
        ];

        const mockUser = {
          _id: VALID_USER_ID,
          ecoPoints: 50,
          badges: [],
          save: jest.fn().mockResolvedValue(true)
        };

        const mockAttempt = {
          save: jest.fn().mockResolvedValue(true)
        };

        Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);

        const mockQuery = {
          select: jest.fn().mockResolvedValue(mockQuestions)
        };
        Question.find = jest.fn().mockReturnValue(mockQuery);

        User.findById = jest.fn().mockResolvedValue(mockUser);
        QuizAttempt.mockImplementation(() => mockAttempt);

        const result = await quizService.submitQuiz(VALID_USER_ID, VALID_QUIZ_ID, submittedAnswers);

        expect(Quiz.findById).toHaveBeenCalledWith(VALID_QUIZ_ID);
        expect(Question.find).toHaveBeenCalledWith({
          _id: { $in: [VALID_QUESTION_ID_1, VALID_QUESTION_ID_2, VALID_QUESTION_ID_3] },
          quiz: VALID_QUIZ_ID
        });
        expect(mockQuery.select).toHaveBeenCalledWith('+correctAnswer +explanation');

        // Should fail with 67% (2/3 correct) since passingScore is 70%
        expect(result.score).toBe(67);
        expect(result.correctAnswers).toBe(2);
        expect(result.totalQuestions).toBe(3);
        expect(result.passed).toBe(false); // 67% < 70%
        expect(result.wrongAnswerExplanations).toHaveLength(1);
        expect(result.wrongAnswerExplanations[0].questionId).toBe(VALID_QUESTION_ID_3);
        expect(result.wrongAnswerExplanations[0].correctAnswer).toBe('D');

        // User should not receive points/badge since didn't pass
        expect(mockUser.save).not.toHaveBeenCalled();
      });

      test('should award eco-points and badge when user passes', async () => {
        const submittedAnswers = [
          { questionId: VALID_QUESTION_ID_1, selectedOption: 'A' },
          { questionId: VALID_QUESTION_ID_2, selectedOption: 'B' }
        ];

        const mockQuiz = {
          _id: VALID_QUIZ_ID,
          title: 'Recycling Basics',
          passingScore: 70
        };

        const mockQuestions = [
          { _id: VALID_QUESTION_ID_1, correctAnswer: 'A', explanation: 'Exp 1' },
          { _id: VALID_QUESTION_ID_2, correctAnswer: 'B', explanation: 'Exp 2' }
        ];

        const mockUser = {
          _id: VALID_USER_ID,
          ecoPoints: 50,
          badges: [],
          save: jest.fn().mockResolvedValue(true)
        };

        const mockAttempt = {
          save: jest.fn().mockResolvedValue(true)
        };

        Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);

        const mockQuery = {
          select: jest.fn().mockResolvedValue(mockQuestions)
        };
        Question.find = jest.fn().mockReturnValue(mockQuery);

        User.findById = jest.fn().mockResolvedValue(mockUser);
        QuizAttempt.mockImplementation(() => mockAttempt);

        const result = await quizService.submitQuiz(VALID_USER_ID, VALID_QUIZ_ID, submittedAnswers);

        expect(result.score).toBe(100);
        expect(result.passed).toBe(true);
        expect(result.wrongAnswerExplanations).toHaveLength(0);

        // Verify eco-points were added
        expect(mockUser.ecoPoints).toBe(60); // 50 + 10

        // Verify badge was added
        expect(mockUser.badges).toHaveLength(1);
        expect(mockUser.badges[0].title).toBe('Certified: Recycling Basics');
        expect(mockUser.badges[0].quizId).toBe(VALID_QUIZ_ID);
        expect(mockUser.save).toHaveBeenCalled();
      });

      test('should not add duplicate badge if already earned', async () => {
        const submittedAnswers = [
          { questionId: VALID_QUESTION_ID_1, selectedOption: 'A' }
        ];

        const mockQuiz = {
          _id: VALID_QUIZ_ID,
          title: 'Recycling Basics',
          passingScore: 70
        };

        const mockQuestions = [
          { _id: VALID_QUESTION_ID_1, correctAnswer: 'A', explanation: 'Exp 1' }
        ];

        const mockUser = {
          _id: VALID_USER_ID,
          ecoPoints: 50,
          badges: [
            {
              title: 'Certified: Recycling Basics',
              quizId: VALID_QUIZ_ID,
              earnedAt: new Date()
            }
          ],
          save: jest.fn().mockResolvedValue(true)
        };

        const mockAttempt = {
          save: jest.fn().mockResolvedValue(true)
        };

        Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);

        const mockQuery = {
          select: jest.fn().mockResolvedValue(mockQuestions)
        };
        Question.find = jest.fn().mockReturnValue(mockQuery);

        User.findById = jest.fn().mockResolvedValue(mockUser);
        QuizAttempt.mockImplementation(() => mockAttempt);

        await quizService.submitQuiz(VALID_USER_ID, VALID_QUIZ_ID, submittedAnswers);

        // Should still add eco-points
        expect(mockUser.ecoPoints).toBe(60);

        // Should not add duplicate badge
        expect(mockUser.badges).toHaveLength(1);
        expect(mockUser.save).toHaveBeenCalled();
      });

      test('should handle user with undefined ecoPoints', async () => {
        const submittedAnswers = [
          { questionId: VALID_QUESTION_ID_1, selectedOption: 'A' }
        ];

        const mockQuiz = {
          _id: VALID_QUIZ_ID,
          title: 'Recycling Basics',
          passingScore: 70
        };

        const mockQuestions = [
          { _id: VALID_QUESTION_ID_1, correctAnswer: 'A', explanation: 'Exp 1' }
        ];

        const mockUser = {
          _id: VALID_USER_ID,
          // ecoPoints is undefined
          badges: [],
          save: jest.fn().mockResolvedValue(true)
        };

        const mockAttempt = {
          save: jest.fn().mockResolvedValue(true)
        };

        Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);

        const mockQuery = {
          select: jest.fn().mockResolvedValue(mockQuestions)
        };
        Question.find = jest.fn().mockReturnValue(mockQuery);

        User.findById = jest.fn().mockResolvedValue(mockUser);
        QuizAttempt.mockImplementation(() => mockAttempt);

        await quizService.submitQuiz(VALID_USER_ID, VALID_QUIZ_ID, submittedAnswers);

        // Should initialize ecoPoints to 10 (0 + 10)
        expect(mockUser.ecoPoints).toBe(10);
        expect(mockUser.save).toHaveBeenCalled();
      });

      test('should throw 404 error when quiz not found', async () => {
        const submittedAnswers = [];

        Quiz.findById = jest.fn().mockResolvedValue(null);

        await expect(quizService.submitQuiz(VALID_USER_ID, 'nonexistent', submittedAnswers))
          .rejects.toThrow('Quiz not found');

        try {
          await quizService.submitQuiz(VALID_USER_ID, 'nonexistent', submittedAnswers);
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });

      test('should throw 400 error when no valid questions found', async () => {
        const submittedAnswers = [
          { questionId: VALID_QUESTION_ID_1, selectedOption: 'A' }
        ];

        const mockQuiz = { _id: VALID_QUIZ_ID, title: 'Quiz' };

        Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);

        const mockQuery = {
          select: jest.fn().mockResolvedValue([])
        };
        Question.find = jest.fn().mockReturnValue(mockQuery);

        await expect(quizService.submitQuiz(VALID_USER_ID, VALID_QUIZ_ID, submittedAnswers))
          .rejects.toThrow('No valid questions found for this quiz');

        try {
          await quizService.submitQuiz(VALID_USER_ID, VALID_QUIZ_ID, submittedAnswers);
        } catch (error) {
          expect(error.statusCode).toBe(400);
        }
      });

      test('should throw 400 error when some questionIds are not valid ObjectIds', async () => {
        const submittedAnswers = [
          { questionId: VALID_QUESTION_ID_1, selectedOption: 'A' },
          { questionId: 'not-a-valid-id', selectedOption: 'B' }
        ];

        const mockQuiz = { _id: VALID_QUIZ_ID, title: 'Quiz', passingScore: 70 };
        Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);

        await expect(quizService.submitQuiz(VALID_USER_ID, VALID_QUIZ_ID, submittedAnswers))
          .rejects.toThrow('Invalid question ID(s)');

        try {
          await quizService.submitQuiz(VALID_USER_ID, VALID_QUIZ_ID, submittedAnswers);
        } catch (error) {
          expect(error.statusCode).toBe(400);
          expect(error.message).toContain('not-a-valid-id');
        }
      });

      test('should throw 400 error when all questionIds are invalid', async () => {
        const submittedAnswers = [
          { questionId: 'bad-id-1', selectedOption: 'A' },
          { questionId: 'bad-id-2', selectedOption: 'B' }
        ];

        const mockQuiz = { _id: VALID_QUIZ_ID, title: 'Quiz', passingScore: 70 };
        Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);

        await expect(quizService.submitQuiz(VALID_USER_ID, VALID_QUIZ_ID, submittedAnswers))
          .rejects.toThrow('Invalid question ID(s)');

        try {
          await quizService.submitQuiz(VALID_USER_ID, VALID_QUIZ_ID, submittedAnswers);
        } catch (error) {
          expect(error.statusCode).toBe(400);
          expect(error.message).toContain('bad-id-1');
          expect(error.message).toContain('bad-id-2');
        }

        // Should NOT reach Question.find since validation fails first
        expect(Question.find).not.toHaveBeenCalled();
      });

      test('should save quiz attempt with correct data', async () => {
        const submittedAnswers = [
          { questionId: VALID_QUESTION_ID_1, selectedOption: 'A' }
        ];

        const mockQuiz = {
          _id: VALID_QUIZ_ID,
          title: 'Quiz',
          passingScore: 70
        };

        const mockQuestions = [
          { _id: VALID_QUESTION_ID_1, correctAnswer: 'A', explanation: 'Exp 1' }
        ];

        const mockAttempt = {
          save: jest.fn().mockResolvedValue(true)
        };

        Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);

        const mockQuery = {
          select: jest.fn().mockResolvedValue(mockQuestions)
        };
        Question.find = jest.fn().mockReturnValue(mockQuery);

        User.findById = jest.fn().mockResolvedValue(null);
        QuizAttempt.mockImplementation(() => mockAttempt);

        await quizService.submitQuiz(VALID_USER_ID, VALID_QUIZ_ID, submittedAnswers);

        expect(QuizAttempt).toHaveBeenCalledWith({
          user: VALID_USER_ID,
          quiz: VALID_QUIZ_ID,
          score: 100,
          totalQuestions: 1,
          passed: true,
          answers: [
            {
              question: VALID_QUESTION_ID_1,
              selectedOption: 'A',
              isCorrect: true
            }
          ]
        });
        expect(mockAttempt.save).toHaveBeenCalled();
      });
    });

    describe('getUserCertificates', () => {
      test('should return user badges and eco-points', async () => {
        const userId = 'user123';
        const mockUser = {
          _id: userId,
          ecoPoints: 150,
          badges: [
            {
              title: 'Certified: Recycling Basics',
              quizId: 'quiz1',
              earnedAt: new Date('2026-01-01')
            },
            {
              title: 'Certified: Composting 101',
              quizId: 'quiz2',
              earnedAt: new Date('2026-01-15')
            }
          ]
        };

        const mockQuery = {
          select: jest.fn().mockResolvedValue(mockUser)
        };
        User.findById = jest.fn().mockReturnValue(mockQuery);

        const result = await quizService.getUserCertificates(userId);

        expect(User.findById).toHaveBeenCalledWith(userId);
        expect(mockQuery.select).toHaveBeenCalledWith('badges ecoPoints');
        expect(result.ecoPoints).toBe(150);
        expect(result.badges).toHaveLength(2);
        expect(result.badges[0].title).toBe('Certified: Recycling Basics');
      });

      test('should throw 404 error when user not found', async () => {
        const userId = 'nonexistent';

        const mockQuery = {
          select: jest.fn().mockResolvedValue(null)
        };
        User.findById = jest.fn().mockReturnValue(mockQuery);

        await expect(quizService.getUserCertificates(userId))
          .rejects.toThrow('User not found');

        try {
          await quizService.getUserCertificates(userId);
        } catch (error) {
          expect(error.statusCode).toBe(404);
        }
      });

      test('should handle user with no badges', async () => {
        const userId = 'user123';
        const mockUser = {
          _id: userId,
          ecoPoints: 0,
          badges: []
        };

        const mockQuery = {
          select: jest.fn().mockResolvedValue(mockUser)
        };
        User.findById = jest.fn().mockReturnValue(mockQuery);

        const result = await quizService.getUserCertificates(userId);

        expect(result.ecoPoints).toBe(0);
        expect(result.badges).toEqual([]);
      });
    });
  });
});
