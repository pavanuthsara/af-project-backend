# AF Project Backend

> A waste management and eco-education platform built with Node.js, Express, and MongoDB.

---

## Getting Started — Step-by-Step Guide

### Prerequisites

Ensure you have the following installed on your machine:

| Tool       | Version   | Installation                                              |
| ---------- | --------- | --------------------------------------------------------- |
| **Node.js** | 18.x or 20.x | [https://nodejs.org](https://nodejs.org)               |
| **pnpm**   | 10.x      | `npm install -g pnpm`                                     |
| **Git**    | Latest    | [https://git-scm.com](https://git-scm.com)               |

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/af-project-backend.git
cd af-project-backend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=<appName>
PORT=3000
NODE_ENV=development
JWT_SECRET=<your-jwt-secret>
GROK_API_KEY=<your-groq-api-key>
GEMINI_API_KEY=<your-gemini-api-key>
CLIMATIQ_API_KEY=<your-climatiq-api-key>
```

> **Note:** Contact the project admin if you don't have the API keys.

### 4. Start the Development Server

```bash
pnpm run dev
```

The server will start on `http://localhost:3000` with **nodemon** (auto-restarts on file changes).

### 5. Verify the Server is Running

```bash
curl http://localhost:3000/api/categories
```

You should receive a JSON response. If using a browser, navigate to `http://localhost:3000/api/categories`.

---

## Available Scripts

| Script              | Command                       | Description                          |
| ------------------- | ----------------------------- | ------------------------------------ |
| `pnpm run dev`      | `nodemon server.js`           | Start dev server with hot-reload     |
| `pnpm test`         | `jest --coverage`             | Run all tests with coverage report   |
| `pnpm run test:unit`| `jest --testPathIgnorePatterns=integration --coverage` | Run unit tests only |
| `pnpm run test:watch` | `jest --watch`              | Run tests in watch mode              |

---

## Project Structure

```
af-project-backend/
├── src/
│   ├── application/           # Business logic (services, use cases)
│   ├── domain/                # Domain entities
│   ├── infrastructure/        # Database, webserver, external services
│   │   ├── database/          # Mongoose connection
│   │   └── webserver/         # Express server & startup
│   └── interface_adapters/    # Controllers, middleware, routes, schemas
├── test/                      # Unit & integration tests
├── docs/                      # API guides, testing & deployment docs
├── artillery-config.yml       # Performance test configuration
├── jest.config.js             # Jest test configuration
├── package.json
└── .env                       # Environment variables (not committed)
```

---

## Package Management (pnpm)

```bash
# Add a production dependency
pnpm add <package_name>

# Add a dev dependency
pnpm add -D <package_name>

# Remove a package
pnpm remove <package_name>
```

---

## Documentation

- [API Guides](docs/API/) — Endpoint documentation
- [Testing Instructions](docs/Testing/TESTING_INSTRUCTION_REPORT.md) — How to run unit, integration & performance tests
- [Deployment Report](docs/Deployment/DEPLOYMENT_REPORT.md) — Render deployment details
