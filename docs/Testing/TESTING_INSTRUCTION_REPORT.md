# Testing Instruction Report

> **AF Project Backend** — Comprehensive guide for running and configuring all test types.

---

## Table of Contents

1. [How to Run Unit Tests](#i-how-to-run-unit-tests)
2. [Integration Testing Setup and Execution](#ii-integration-testing-setup-and-execution)
3. [Performance Testing Setup and Execution](#iii-performance-testing-setup-and-execution)
4. [Testing Environment Configuration Details](#iv-testing-environment-configuration-details)

---

## I. How to Run Unit Tests

### Overview

Unit tests verify individual modules in isolation using **Jest** (v30) with mocked dependencies. The project contains unit tests across the following layers of the clean architecture:

| Layer                 | Directory                                  | Tests Cover                                               |
| --------------------- | ------------------------------------------ | --------------------------------------------------------- |
| **Services**          | `test/application/services/`               | QuizService, WasteService, TranslationService, ExplanationService, WasteTypeValidationService |
| **Use Cases**         | `test/application/use_cases/`              | SignUpUser, LoginUser, CRUD for DisposalLogs, RecyclingCenters, WasteStats |
| **Domain Entities**   | `test/domain/entities/`                    | User, DisposalActivity                                    |
| **Infrastructure**    | `test/infrastructure/security/`            | JwtService, PasswordService                               |
| **Controllers**       | `test/interface_adapters/controllers/`     | DisposalControllers, RecyclingCenter controllers, WasteCategoryController, WasteItemController, TranslationController |

### Running Unit Tests

```bash
# Run all unit tests (excludes integration tests) with coverage
npm run test:unit

# Run all tests (unit + integration) with coverage
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

### Running a Specific Test File

```bash
npx jest test/application/services/QuizService.test.js
```

### Running Tests Matching a Pattern

```bash
npx jest --testPathPattern="WasteService"
```

### Understanding the Output

- **PASS / FAIL** — Status of each test suite.
- **Coverage Report** — Printed to the terminal after all tests complete, showing line, branch, function, and statement coverage.
- **Coverage HTML** — Generated in the `coverage/` directory. Open `coverage/lcov-report/index.html` in a browser for a detailed, interactive report.

### Writing New Unit Tests

1. Place test files in the appropriate directory under `test/` mirroring the `src/` structure.
2. Name test files with the `.test.js` suffix — the Jest config only matches `**/test/**/*.test.js`.
3. Mock external dependencies (database schemas, third-party APIs) using `jest.mock()`.
4. Follow the existing pattern of `describe` / `test` blocks for grouping and naming.

**Example — mocking a Mongoose schema:**

```javascript
jest.mock('../../../src/interface_adapters/schemas/QuizSchema');

const Quiz = require('../../../src/interface_adapters/schemas/QuizSchema');

Quiz.findById = jest.fn().mockResolvedValue({ _id: 'quiz123', title: 'Sample Quiz' });
```

---

## II. Integration Testing Setup and Execution

### Overview

Integration tests verify that multiple components work together through real HTTP requests against a live Express application, backed by an **in-memory MongoDB** instance. No external database or network connection is required.

| Test Suite            | File                                   | What It Covers                                            |
| --------------------- | -------------------------------------- | --------------------------------------------------------- |
| **Authentication**    | `test/integration/auth.test.js`        | User signup, login, admin login, admin registration, JWT-protected routes |
| **Quiz Module**       | `test/integration/quiz-module.test.js` | Quiz CRUD, question management, quiz playback, submission & grading, certificates |
| **Waste Management**  | `test/integration/waste-management.test.js` | Waste category CRUD, waste item CRUD, filtering, search, pagination, referential integrity |

### Key Technologies

| Package                 | Purpose                                       |
| ----------------------- | --------------------------------------------- |
| `mongodb-memory-server` | Spins up an ephemeral MongoDB instance in RAM  |
| `supertest`             | Sends HTTP requests to the Express app in-process |
| `mongoose`              | ODM used to connect to the in-memory database  |

### Setup

No additional setup is required beyond having the project dependencies installed:

```bash
npm install
```

> **Note:** On the first run, `mongodb-memory-server` automatically downloads a compatible MongoDB binary (~90 MB). This is a one-time download and is cached locally. The test timeout is set to **120 seconds** to accommodate this.

### Running Integration Tests

```bash
# Run all tests (includes integration)
npm test

# Run only integration tests
npx jest test/integration/

# Run a specific integration suite
npx jest test/integration/auth.test.js
npx jest test/integration/quiz-module.test.js
npx jest test/integration/waste-management.test.js
```

### How Integration Tests Work

Each integration test suite follows this lifecycle:

```
beforeAll()
  ├─ Start MongoMemoryServer
  ├─ Connect Mongoose to the in-memory URI
  └─ Build a minimal Express app with real controllers & routes

beforeEach()
  └─ Seed fresh test data (users, quizzes, categories, etc.)

test()
  └─ Use supertest to make HTTP requests and assert responses

afterEach()
  └─ Clean up all collections (deleteMany)

afterAll()
  ├─ Disconnect Mongoose
  └─ Stop MongoMemoryServer
```

### Authentication Test Details

The auth integration tests cover the full authentication flow:

- **POST /signup** — Registers new users and admin users, returns JWT tokens.
- **POST /login** — Authenticates users with valid credentials.
- **POST /admin/login** — Admin-only login; rejects regular users with `403`.
- **POST /admin/register** — Only existing admins can register new admins; rejects unauthenticated (`401`) and non-admin users (`403`).
- **GET /profile** — Protected route accessible only with a valid JWT.

### Quiz Module Test Details

The quiz integration tests verify the complete quiz workflow:

- **Admin CRUD** — Create quizzes, add/update/delete questions, handle duplicates and 404 errors.
- **User Play** — List quizzes with completion status, fetch quiz for play (ensures `correctAnswer` and `explanation` fields are **not** exposed to the client).
- **Submission & Grading** — Grades answers, calculates scores, awards eco-points and badges on pass, prevents duplicate badges, persists quiz attempts.
- **Certificates** — Returns earned badges and eco-points for the authenticated user.

### Waste Management Test Details

The waste management integration tests cover:

- **Category CRUD** — Create, read, update, delete waste categories with pagination.
- **Item CRUD** — Create, read, update, delete waste items linked to categories.
- **Filtering & Search** — Filter by `category`, `recyclable`, `hazardous` flags, and text search by name.
- **Referential Integrity** — Deleting a category automatically deletes all associated waste items.

---

## III. Performance Testing Setup and Execution

### Overview

Performance / load testing is configured using **Artillery**, an industry-standard load testing tool. The configuration file is located at the project root:

```
artillery-config.yml
```

### Installing Artillery

Artillery must be installed globally (it is not included in the project's `devDependencies`):

```bash
npm install -g artillery
```

### Load Test Phases

The Artillery configuration defines three progressive load phases:

| Phase              | Duration | Virtual Users/sec | Purpose                          |
| ------------------ | -------- | ------------------ | -------------------------------- |
| **Warm up**        | 30s      | 5 constant         | Baseline — warm up the server    |
| **Ramp up load**   | 60s      | 5 → 50 ramp        | Gradual increase to find limits  |
| **Sustained peak** | 120s     | 50 constant        | Sustained high load stress test  |

**Total test duration: ~3.5 minutes**

### Test Scenarios

The configuration contains three weighted scenarios simulating realistic user behaviour:

| Scenario                      | Weight | Description                                                                          |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------ |
| **Public Browsing**           | 30%    | Unauthenticated users browsing waste categories and items                            |
| **User Signup & Login**       | 20%    | New user registration followed by login                                              |
| **Authenticated User Journey**| 50%    | Full authenticated flow — login, view profile, browse recycling centers, categories, items, disposal history, stats, quizzes, and certificates |

### Prerequisites

Before running the performance tests, ensure:

1. **The backend server is running** on `http://localhost:3000`:

    ```bash
    npm run dev
    ```

2. **A test user exists** in the database with the credentials used in the config:

    - Email: `damith@example.com`
    - Password: `yourpassword`

3. **MongoDB is accessible** (the real database, not the in-memory one used by unit/integration tests).

### Running Performance Tests

```bash
# Run the full load test
artillery run artillery-config.yml

# Run with a custom output report
artillery run --output report.json artillery-config.yml

# Generate an HTML report from the JSON output
artillery report report.json
```

### Interpreting Results

After the test completes, Artillery prints a summary including:

| Metric                       | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| **http.requests**            | Total number of HTTP requests sent                            |
| **http.responses**           | Total responses received, broken down by status code          |
| **http.response_time (p50, p95, p99)** | Response time percentiles in milliseconds          |
| **vusers.created**           | Total virtual users created                                   |
| **vusers.completed**         | Total virtual users that completed the full scenario          |
| **vusers.failed**            | Virtual users that encountered errors                         |

**Key thresholds to watch:**
- **p95 response time** should stay under 500ms for API endpoints.
- **Error rate** (failed requests / total requests) should be < 1%.
- **Zero `vusers.failed`** ideally — any failures indicate the server cannot handle the load.

### Customising the Test

Edit `artillery-config.yml` to adjust:

- **`target`** — Change the server URL if not running on `localhost:3000`.
- **`phases`** — Adjust `duration`, `arrivalRate`, and `rampTo` to increase or decrease load.
- **`scenarios`** — Add new API endpoints or modify existing flows.
- **`weight`** — Change how frequently each scenario is chosen.

---

## IV. Testing Environment Configuration Details

### Environment Variables

The test environment is configured automatically via `test/setup.js`, which runs before every test suite (as specified in `jest.config.js` → `setupFilesAfterSetup`):

```javascript
// test/setup.js
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
jest.setTimeout(60000);
```

| Variable      | Test Value                      | Purpose                                       |
| ------------- | ------------------------------- | --------------------------------------------- |
| `NODE_ENV`    | `test`                          | Signals the application it is running in test mode |
| `JWT_SECRET`  | `test-secret-key-for-testing`   | Deterministic JWT signing for predictable test tokens |

> **Important:** The `.env` file is **not loaded** during tests. All environment-specific values are set programmatically in `test/setup.js` or within individual test files.

### Jest Configuration

The full Jest configuration is defined in `jest.config.js` at the project root:

```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  setupFilesAfterSetup: ['<rootDir>/test/setup.js'],
  testMatch: ['**/test/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  verbose: true,
  forceExit: true,
  detectOpenHandles: false
};
```

| Setting                     | Value                          | Rationale                                               |
| --------------------------- | ------------------------------ | ------------------------------------------------------- |
| `testEnvironment`           | `node`                         | Tests run in a Node.js environment (not jsdom)          |
| `coveragePathIgnorePatterns` | `['/node_modules/']`          | Excludes third-party code from coverage reports         |
| `setupFilesAfterSetup`      | `test/setup.js`               | Loads environment variables and global timeout          |
| `testMatch`                 | `**/test/**/*.test.js`         | Only files inside `test/` with `.test.js` extension     |
| `testTimeout`               | `120000` (2 min)               | Allows time for mongodb-memory-server binary download   |
| `maxWorkers`                | `1`                            | Runs tests serially to avoid MongoDB connection conflicts |
| `verbose`                   | `true`                         | Prints individual test results                          |
| `forceExit`                 | `true`                         | Forces Jest to exit after completion (prevents hangs)   |
| `detectOpenHandles`         | `false`                        | Disabled for performance; enable for debugging hangs    |

### NPM Scripts

| Script            | Command                                            | Description                              |
| ----------------- | -------------------------------------------------- | ---------------------------------------- |
| `npm test`        | `jest --coverage`                                   | Runs all tests with coverage report      |
| `npm run test:watch` | `jest --watch`                                   | Watch mode — re-runs on file changes     |
| `npm run test:unit`  | `jest --testPathIgnorePatterns=integration --coverage` | Runs only unit tests (skips integration) |

### Database Configuration

| Test Type          | Database                          | Configuration                                |
| ------------------ | --------------------------------- | -------------------------------------------- |
| **Unit Tests**     | None (all DB calls are mocked)    | Schemas mocked via `jest.mock()`             |
| **Integration Tests** | In-memory MongoDB             | Auto-provisioned by `mongodb-memory-server`; no external DB required |
| **Performance Tests** | Production/Development MongoDB | Uses the real database defined in `.env` → `MONGO_URI` |

### Third-Party API Mocking

External API services are mocked during unit and integration tests to ensure tests run independently of network availability:

| Service               | Mock Strategy                                              |
| --------------------- | ---------------------------------------------------------- |
| **TranslationService** (Groq API) | Fully mocked via `jest.mock()` in integration tests; constructor and methods are mocked in unit tests |
| **ExplanationService** (Groq API) | Mock implementation injected via dependency injection (`new QuizService({ explanationService: mockService })`) |
| **Mongoose Schemas**   | Mocked with `jest.mock()` for unit tests; real schemas used with in-memory MongoDB for integration tests |

### Directory Structure

```
af-project-backend/
├── jest.config.js                     # Jest configuration
├── artillery-config.yml               # Artillery performance test config
├── test/
│   ├── setup.js                       # Global test setup (env vars, timeout)
│   ├── application/
│   │   ├── services/                  # Unit tests for services
│   │   │   ├── ExplanationService.test.js
│   │   │   ├── QuizService.test.js
│   │   │   ├── TranslationService.test.js
│   │   │   ├── WasteService.test.js
│   │   │   └── WasteTypeValidationService.test.js
│   │   └── use_cases/                 # Unit tests for use cases
│   │       ├── CreateDisposalLog.test.js
│   │       ├── DeleteDisposalLog.test.js
│   │       ├── DeleteRecyclingCenter.test.js
│   │       ├── GetRecyclingCenterById.test.js
│   │       ├── GetUserDisposalHistory.test.js
│   │       ├── GetUserWasteStats.test.js
│   │       ├── LoginUser.test.js
│   │       ├── RegisterRecyclingCenter.test.js
│   │       ├── SignUpUser.test.js
│   │       ├── UpdateDisposalLog.test.js
│   │       ├── UpdateRecyclingCenter.test.js
│   │       └── ViewRecyclingCenters.test.js
│   ├── domain/
│   │   └── entities/                  # Unit tests for domain entities
│   │       ├── DisposalActivity.test.js
│   │       └── User.test.js
│   ├── infrastructure/
│   │   └── security/                  # Unit tests for security utilities
│   │       ├── JwtService.test.js
│   │       └── PasswordService.test.js
│   ├── integration/                   # Integration test suites
│   │   ├── auth.test.js
│   │   ├── quiz-module.test.js
│   │   └── waste-management.test.js
│   └── interface_adapters/
│       └── controllers/               # Unit tests for controllers
│           ├── DisposalControllers.test.js
│           ├── GetRecyclingCenterByIdController.test.js
│           ├── GetRecyclingCentersByWasteTypeController.test.js
│           ├── TranslationController.test.js
│           ├── WasteCategoryController.test.js
│           └── WasteItemController.test.js
└── coverage/                          # Generated coverage reports
    └── lcov-report/
        └── index.html                # Interactive HTML coverage report
```

---

> **Last Updated:** February 2026
