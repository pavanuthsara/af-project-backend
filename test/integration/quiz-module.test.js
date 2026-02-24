const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const QuizController = require('../../src/interface_adapters/controllers/QuizController');
const Quiz = require('../../src/interface_adapters/schemas/QuizSchema');
const Question = require('../../src/interface_adapters/schemas/QuestionSchema');
const QuizAttempt = require('../../src/interface_adapters/schemas/QuizAttemptSchema');
const User = require('../../src/interface_adapters/schemas/UserSchema');

jest.setTimeout(120000);

let mongoServer;
let app;
let testUser;
let testUserId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    app = express();
    app.use(express.json());

    const quizController = new QuizController();

    // Fake auth middleware that attaches testUser to req.user
    const fakeAuth = (req, res, next) => {
        req.user = { id: testUserId, role: 'user' };
        next();
    };

    const fakeAdminAuth = (req, res, next) => {
        req.user = { id: testUserId, role: 'admin' };
        next();
    };

    // Admin routes
    app.post('/api/quizzes', fakeAdminAuth, quizController.createQuiz);
    app.post('/api/quizzes/:quizId/questions', fakeAdminAuth, quizController.addQuestion);
    app.put('/api/quizzes/questions/:questionId', fakeAdminAuth, quizController.updateQuestion);
    app.delete('/api/quizzes/questions/:questionId', fakeAdminAuth, quizController.deleteQuestion);

    // User routes
    app.get('/api/quizzes', fakeAuth, quizController.getQuizzes);
    app.get('/api/quizzes/certificates', fakeAuth, quizController.getCertificates);
    app.get('/api/quizzes/:quizId/play', fakeAuth, quizController.getQuizForPlay);
    app.post('/api/quizzes/:quizId/submit', fakeAuth, quizController.submitQuiz);

    // Error handler
    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: err.message || 'Internal server error'
        });
    });
});

beforeEach(async () => {
    // Create a fresh test user for each test
    testUser = await User.create({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'hashedpassword123',
        role: 'user'
    });
    testUserId = testUser._id;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await QuizAttempt.deleteMany({});
    await Question.deleteMany({});
    await Quiz.deleteMany({});
    await User.deleteMany({});
});

describe('Quiz Module Integration Tests', () => {

    // ─── Admin: Quiz Management ──────────────────────────────────

    describe('Admin Quiz Management', () => {
        describe('POST /api/quizzes', () => {
            test('should create a new quiz successfully', async () => {
                const quizData = {
                    title: 'Plastic Sorting 101',
                    description: 'Learn to identify and sort different plastic types',
                    difficulty: 'Beginner',
                    passingScore: 70
                };

                const response = await request(app)
                    .post('/api/quizzes')
                    .send(quizData)
                    .expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toMatchObject({
                    title: 'Plastic Sorting 101',
                    difficulty: 'Beginner',
                    passingScore: 70
                });
                expect(response.body.data).toHaveProperty('_id');
            });

            test('should return 400 for duplicate quiz title', async () => {
                const quizData = {
                    title: 'Duplicate Quiz',
                    description: 'Test',
                    difficulty: 'Beginner',
                    passingScore: 60
                };

                await request(app).post('/api/quizzes').send(quizData).expect(201);
                const response = await request(app).post('/api/quizzes').send(quizData).expect(400);

                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('already exists');
            });
        });

        describe('POST /api/quizzes/:quizId/questions', () => {
            test('should add a question to a quiz', async () => {
                const quiz = await Quiz.create({
                    title: 'E-Waste Safety',
                    description: 'Learn about e-waste',
                    difficulty: 'Intermediate',
                    passingScore: 60
                });

                const questionData = {
                    questionText: 'Which bin should batteries go in?',
                    options: ['Blue', 'Green', 'Red', 'Yellow'],
                    correctAnswer: 'Red',
                    explanation: 'Batteries are hazardous waste and go in the red bin.',
                    imageUrl: null
                };

                const response = await request(app)
                    .post(`/api/quizzes/${quiz._id}/questions`)
                    .send(questionData)
                    .expect(201);

                expect(response.body.success).toBe(true);
                expect(response.body.data.questionText).toBe('Which bin should batteries go in?');
                expect(response.body.data.quiz.toString()).toBe(quiz._id.toString());
            });

            test('should return 404 when adding question to non-existent quiz', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                const response = await request(app)
                    .post(`/api/quizzes/${fakeId}/questions`)
                    .send({
                        questionText: 'Test?',
                        options: ['A', 'B'],
                        correctAnswer: 'A',
                        explanation: 'Because A'
                    })
                    .expect(404);

                expect(response.body.message).toContain('Quiz not found');
            });
        });

        describe('PUT /api/quizzes/questions/:questionId', () => {
            test('should update a question', async () => {
                const quiz = await Quiz.create({
                    title: 'Update Test Quiz',
                    description: 'Test',
                    difficulty: 'Beginner',
                    passingScore: 50
                });

                const question = await Question.create({
                    quiz: quiz._id,
                    questionText: 'Old question?',
                    options: ['A', 'B', 'C'],
                    correctAnswer: 'A',
                    explanation: 'Old explanation'
                });

                const response = await request(app)
                    .put(`/api/quizzes/questions/${question._id}`)
                    .send({ questionText: 'Updated question?' })
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.questionText).toBe('Updated question?');
            });

            test('should return 404 for non-existent question', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                const response = await request(app)
                    .put(`/api/quizzes/questions/${fakeId}`)
                    .send({ questionText: 'Updated' })
                    .expect(404);

                expect(response.body.message).toContain('Question not found');
            });
        });

        describe('DELETE /api/quizzes/questions/:questionId', () => {
            test('should delete a question', async () => {
                const quiz = await Quiz.create({
                    title: 'Delete Test Quiz',
                    description: 'Test',
                    difficulty: 'Beginner',
                    passingScore: 50
                });

                const question = await Question.create({
                    quiz: quiz._id,
                    questionText: 'To be deleted?',
                    options: ['A', 'B'],
                    correctAnswer: 'A',
                    explanation: 'Explanation'
                });

                const response = await request(app)
                    .delete(`/api/quizzes/questions/${question._id}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('deleted successfully');

                const deleted = await Question.findById(question._id);
                expect(deleted).toBeNull();
            });

            test('should return 404 for non-existent question', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                const response = await request(app)
                    .delete(`/api/quizzes/questions/${fakeId}`)
                    .expect(404);

                expect(response.body.message).toContain('Question not found');
            });
        });
    });

    // ─── User: Quiz Play ─────────────────────────────────────────

    describe('User Quiz Play', () => {
        let quiz;
        let questions;

        beforeEach(async () => {
            quiz = await Quiz.create({
                title: 'Composting 101',
                description: 'Learn about composting',
                difficulty: 'Beginner',
                passingScore: 60
            });

            questions = await Question.create([
                {
                    quiz: quiz._id,
                    questionText: 'Can you compost banana peels?',
                    options: ['Yes', 'No'],
                    correctAnswer: 'Yes',
                    explanation: 'Banana peels are organic and can be composted.'
                },
                {
                    quiz: quiz._id,
                    questionText: 'Can you compost plastic bags?',
                    options: ['Yes', 'No'],
                    correctAnswer: 'No',
                    explanation: 'Plastic bags are not biodegradable.'
                },
                {
                    quiz: quiz._id,
                    questionText: 'Is coffee grounds compostable?',
                    options: ['Yes', 'No'],
                    correctAnswer: 'Yes',
                    explanation: 'Coffee grounds are rich in nitrogen and great for compost.'
                }
            ]);
        });

        describe('GET /api/quizzes', () => {
            test('should list quizzes with completion status', async () => {
                const response = await request(app)
                    .get('/api/quizzes')
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data).toHaveLength(1);
                expect(response.body.data[0].title).toBe('Composting 101');
                expect(response.body.data[0].completed).toBe(false);
            });

            test('should show completed status after user submits a quiz', async () => {
                // Submit a quiz first
                await QuizAttempt.create({
                    user: testUserId,
                    quiz: quiz._id,
                    score: 80,
                    totalQuestions: 3,
                    passed: true,
                    answers: []
                });

                const response = await request(app)
                    .get('/api/quizzes')
                    .expect(200);

                expect(response.body.data[0].completed).toBe(true);
            });
        });

        describe('GET /api/quizzes/:quizId/play', () => {
            test('should return questions WITHOUT correctAnswer and explanation', async () => {
                const response = await request(app)
                    .get(`/api/quizzes/${quiz._id}/play`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.quiz.title).toBe('Composting 101');
                expect(response.body.data.questions).toHaveLength(3);

                // SECURITY: Verify answers are NOT in the response
                response.body.data.questions.forEach(q => {
                    expect(q).not.toHaveProperty('correctAnswer');
                    expect(q).not.toHaveProperty('explanation');
                    expect(q).toHaveProperty('questionText');
                    expect(q).toHaveProperty('options');
                });
            });

            test('should return 404 for non-existent quiz', async () => {
                const fakeId = new mongoose.Types.ObjectId();
                const response = await request(app)
                    .get(`/api/quizzes/${fakeId}/play`)
                    .expect(404);

                expect(response.body.message).toContain('Quiz not found');
            });
        });
    });

    // ─── User: Quiz Submission & Grading ─────────────────────────

    describe('Quiz Submission & Grading', () => {
        let quiz;
        let q1, q2, q3;

        beforeEach(async () => {
            quiz = await Quiz.create({
                title: 'Advanced Recycling',
                description: 'Test your recycling knowledge',
                difficulty: 'Advanced',
                passingScore: 60
            });

            [q1, q2, q3] = await Question.create([
                {
                    quiz: quiz._id,
                    questionText: 'Is a greasy pizza box recyclable?',
                    options: ['Yes', 'No'],
                    correctAnswer: 'No',
                    explanation: 'Grease contaminates the recycling process.'
                },
                {
                    quiz: quiz._id,
                    questionText: 'Where should glass bottles go?',
                    options: ['Blue bin', 'Green bin', 'Red bin'],
                    correctAnswer: 'Blue bin',
                    explanation: 'Glass is recyclable and goes in the blue bin.'
                },
                {
                    quiz: quiz._id,
                    questionText: 'Are egg shells compostable?',
                    options: ['Yes', 'No'],
                    correctAnswer: 'Yes',
                    explanation: 'Egg shells break down and add calcium to compost.'
                }
            ]);
        });

        test('should grade quiz correctly and return score with explanations for wrong answers', async () => {
            const submitData = {
                answers: [
                    { questionId: q1._id.toString(), selectedOption: 'No' },   // correct
                    { questionId: q2._id.toString(), selectedOption: 'Red bin' }, // wrong
                    { questionId: q3._id.toString(), selectedOption: 'Yes' }   // correct
                ]
            };

            const response = await request(app)
                .post(`/api/quizzes/${quiz._id}/submit`)
                .send(submitData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.correctAnswers).toBe(2);
            expect(response.body.data.totalQuestions).toBe(3);
            expect(response.body.data.score).toBe(67); // 2/3 = 66.67 rounds to 67
            expect(response.body.data.passed).toBe(true); // 67 >= 60

            // Should have explanation for the wrong answer
            expect(response.body.data.wrongAnswerExplanations).toHaveLength(1);
            expect(response.body.data.wrongAnswerExplanations[0].correctAnswer).toBe('Blue bin');
            expect(response.body.data.wrongAnswerExplanations[0].explanation).toContain('recyclable');
        });

        test('should add eco-points and badge when quiz is passed', async () => {
            const submitData = {
                answers: [
                    { questionId: q1._id.toString(), selectedOption: 'No' },
                    { questionId: q2._id.toString(), selectedOption: 'Blue bin' },
                    { questionId: q3._id.toString(), selectedOption: 'Yes' }
                ]
            };

            await request(app)
                .post(`/api/quizzes/${quiz._id}/submit`)
                .send(submitData)
                .expect(200);

            // Verify user got eco-points and badge
            const updatedUser = await User.findById(testUserId);
            expect(updatedUser.ecoPoints).toBe(10);
            expect(updatedUser.badges).toHaveLength(1);
            expect(updatedUser.badges[0].title).toContain('Advanced Recycling');
        });

        test('should NOT add badge if quiz is failed', async () => {
            const submitData = {
                answers: [
                    { questionId: q1._id.toString(), selectedOption: 'Yes' },  // wrong
                    { questionId: q2._id.toString(), selectedOption: 'Red bin' }, // wrong
                    { questionId: q3._id.toString(), selectedOption: 'No' }    // wrong
                ]
            };

            const response = await request(app)
                .post(`/api/quizzes/${quiz._id}/submit`)
                .send(submitData)
                .expect(200);

            expect(response.body.data.passed).toBe(false);
            expect(response.body.data.score).toBe(0);
            expect(response.body.data.wrongAnswerExplanations).toHaveLength(3);

            // Verify no eco-points or badges
            const updatedUser = await User.findById(testUserId);
            expect(updatedUser.ecoPoints).toBe(0);
            expect(updatedUser.badges).toHaveLength(0);
        });

        test('should NOT add duplicate badge on re-passing the same quiz', async () => {
            const perfectAnswers = {
                answers: [
                    { questionId: q1._id.toString(), selectedOption: 'No' },
                    { questionId: q2._id.toString(), selectedOption: 'Blue bin' },
                    { questionId: q3._id.toString(), selectedOption: 'Yes' }
                ]
            };

            // Pass twice
            await request(app).post(`/api/quizzes/${quiz._id}/submit`).send(perfectAnswers).expect(200);
            await request(app).post(`/api/quizzes/${quiz._id}/submit`).send(perfectAnswers).expect(200);

            // Should still only have 1 badge (but 20 eco-points for 2 passes)
            const updatedUser = await User.findById(testUserId);
            expect(updatedUser.badges).toHaveLength(1);
            expect(updatedUser.ecoPoints).toBe(20);
        });

        test('should save quiz attempt in the database', async () => {
            const submitData = {
                answers: [
                    { questionId: q1._id.toString(), selectedOption: 'No' },
                    { questionId: q2._id.toString(), selectedOption: 'Blue bin' },
                    { questionId: q3._id.toString(), selectedOption: 'Yes' }
                ]
            };

            await request(app)
                .post(`/api/quizzes/${quiz._id}/submit`)
                .send(submitData)
                .expect(200);

            const attempts = await QuizAttempt.find({ user: testUserId });
            expect(attempts).toHaveLength(1);
            expect(attempts[0].score).toBe(100);
            expect(attempts[0].passed).toBe(true);
            expect(attempts[0].answers).toHaveLength(3);
        });

        test('should return 400 for empty answers array', async () => {
            const response = await request(app)
                .post(`/api/quizzes/${quiz._id}/submit`)
                .send({ answers: [] })
                .expect(400);

            expect(response.body.message).toContain('Answers array is required');
        });

        test('should return 404 for non-existent quiz submission', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .post(`/api/quizzes/${fakeId}/submit`)
                .send({ answers: [{ questionId: q1._id.toString(), selectedOption: 'A' }] })
                .expect(404);

            expect(response.body.message).toContain('Quiz not found');
        });
    });

    // ─── User: Certificates ──────────────────────────────────────

    describe('User Certificates', () => {
        test('should return empty badges when user has no certificates', async () => {
            const response = await request(app)
                .get('/api/quizzes/certificates')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.badges).toHaveLength(0);
            expect(response.body.data.ecoPoints).toBe(0);
        });

        test('should return badges after passing a quiz', async () => {
            // Set up user with a badge
            await User.findByIdAndUpdate(testUserId, {
                ecoPoints: 10,
                badges: [{
                    title: 'Certified: Composting 101',
                    quizId: new mongoose.Types.ObjectId(),
                    earnedAt: new Date()
                }]
            });

            const response = await request(app)
                .get('/api/quizzes/certificates')
                .expect(200);

            expect(response.body.data.ecoPoints).toBe(10);
            expect(response.body.data.badges).toHaveLength(1);
            expect(response.body.data.badges[0].title).toContain('Composting 101');
        });
    });
});
