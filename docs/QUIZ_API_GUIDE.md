# Quiz Module — API Testing Guide

> **Base URL:** `http://localhost:3000`
> Make sure the server is running with `pnpm dev` before testing.

---

## 🔐 Authentication Setup

All quiz endpoints require a JWT token. First, get your tokens:

### Register & Login as a Regular User

```
POST /signup
```
```json
{
  "name": "Test User",
  "email": "user@test.com",
  "password": "password123",
  "role": "user"
}
```

```
POST /login
```
```json
{
  "email": "user@test.com",
  "password": "password123"
}
```

Copy the `token` from the response. Use it as:
```
Authorization: Bearer <USER_TOKEN>
```

### Login as Admin

```
POST /admin/login
```
```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

Copy the `token`. Use it as:
```
Authorization: Bearer <ADMIN_TOKEN>
```

---

## 1. Admin — Create a Quiz

```
POST /api/quizzes
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

```json
{
  "title": "Plastic Sorting 101",
  "description": "Learn to identify and sort different plastic types correctly",
  "difficulty": "Beginner",
  "passingScore": 60
}
```

**Expected:** `201 Created` with the quiz object. Save the `_id` — you'll need it next.

> **Difficulty** must be one of: `Beginner`, `Intermediate`, `Advanced`
> **passingScore** is a percentage (0–100)

---

## 2. Admin — Add Questions to a Quiz

```
POST /api/quizzes/<QUIZ_ID>/questions
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

### Question 1:

```json
{
  "questionText": "Which bin should a PET plastic bottle go in?",
  "options": ["Blue (Recyclable)", "Green (Organic)", "Red (Hazardous)", "General Waste"],
  "correctAnswer": "Blue (Recyclable)",
  "explanation": "PET bottles are 100% recyclable and should go in the blue bin.",
  "imageUrl": null
}
```

### Question 2:

```json
{
  "questionText": "Is a greasy pizza box recyclable?",
  "options": ["Yes", "No"],
  "correctAnswer": "No",
  "explanation": "Grease contaminates the paper fibers, making the box non-recyclable. Compost it instead!",
  "imageUrl": null
}
```

### Question 3:

```json
{
  "questionText": "Where should used batteries be disposed?",
  "options": ["Blue (Recyclable)", "Green (Organic)", "Red (Hazardous)"],
  "correctAnswer": "Red (Hazardous)",
  "explanation": "Batteries contain toxic chemicals and must go in the red hazardous waste bin.",
  "imageUrl": null
}
```

**Expected:** `201 Created` for each. Save the `_id` of each question for the submit step.

---

## 3. Admin — Update a Question

```
PUT /api/quizzes/questions/<QUESTION_ID>
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

```json
{
  "questionText": "Updated: Which bin should a clean PET plastic bottle go in?"
}
```

**Expected:** `200 OK` with the updated question.

---

## 4. Admin — Delete a Question

```
DELETE /api/quizzes/questions/<QUESTION_ID>
Authorization: Bearer <ADMIN_TOKEN>
```

No body needed. **Expected:** `200 OK` with `"Question deleted successfully"`.

---

## 5. User — List All Quizzes (with Completion Status)

```
GET /api/quizzes
Authorization: Bearer <USER_TOKEN>
```

No body needed. **Expected:** `200 OK` with an array of quizzes. Each quiz includes:
- `completed: false` (if the user hasn't attempted it yet)
- `completed: true` + `lastAttempt` object (after submission)

---

## 6. User — Play a Quiz (Get Questions Without Answers)

```
GET /api/quizzes/<QUIZ_ID>/play
Authorization: Bearer <USER_TOKEN>
```

No body needed. **Expected:** `200 OK` with randomized questions.

> ✅ **Security Check:** Verify that `correctAnswer` and `explanation` are **NOT** present in the response. This is the key security feature!

---

## 7. User — Submit Quiz Answers

```
POST /api/quizzes/<QUIZ_ID>/submit
Authorization: Bearer <USER_TOKEN>
Content-Type: application/json
```

```json
{
  "answers": [
    { "questionId": "<QUESTION_1_ID>", "selectedOption": "Blue (Recyclable)" },
    { "questionId": "<QUESTION_2_ID>", "selectedOption": "Yes" },
    { "questionId": "<QUESTION_3_ID>", "selectedOption": "Red (Hazardous)" }
  ]
}
```

> Replace `<QUESTION_X_ID>` with real IDs from the play response.

**Expected:** `200 OK` with:

```json
{
  "success": true,
  "data": {
    "score": 67,
    "correctAnswers": 2,
    "totalQuestions": 3,
    "passed": true,
    "wrongAnswerExplanations": [
      {
        "questionId": "<QUESTION_2_ID>",
        "correctAnswer": "No",
        "explanation": "Grease contaminates the paper fibers..."
      }
    ]
  }
}
```

**What happens on pass:**
- User gets **+10 eco-points**
- User earns a **"Certified: Plastic Sorting 101"** badge (first time only)

---

## 8. User — View Certificates & Badges

```
GET /api/quizzes/certificates
Authorization: Bearer <USER_TOKEN>
```

No body needed. **Expected:** `200 OK`

```json
{
  "success": true,
  "data": {
    "ecoPoints": 10,
    "badges": [
      {
        "title": "Certified: Plastic Sorting 101",
        "quizId": "<QUIZ_ID>",
        "earnedAt": "2026-02-25T02:30:00.000Z"
      }
    ]
  }
}
```

---

## Quick Postman Testing Flow

| Step | Method | Endpoint | Auth |
|------|--------|----------|------|
| 1 | POST | `/signup` | None |
| 2 | POST | `/login` | None |
| 3 | POST | `/admin/login` | None |
| 4 | POST | `/api/quizzes` | Admin |
| 5 | POST | `/api/quizzes/:quizId/questions` ×3 | Admin |
| 6 | GET | `/api/quizzes` | User |
| 7 | GET | `/api/quizzes/:quizId/play` | User |
| 8 | POST | `/api/quizzes/:quizId/submit` | User |
| 9 | GET | `/api/quizzes/certificates` | User |

---

## Error Cases to Test

| Scenario | Expected |
|---|---|
| Create quiz without admin token | `401 Unauthorized` |
| Create quiz with user token | `403 Forbidden` |
| Play a non-existent quiz | `404 Quiz not found` |
| Submit empty answers array | `400 Answers array is required` |
| Submit to non-existent quiz | `404 Quiz not found` |
| Duplicate quiz title | `400 Quiz title already exists` |
