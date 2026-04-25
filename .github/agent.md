# ThreadHive Backend — Agent Instructions

## Project Overview

ThreadHive is a Reddit-like REST API built with **Node.js**, **Express 5**, and **MongoDB/Mongoose**. It supports user authentication, subreddit management, threaded posts, comments, and voting.

## Tech Stack

- **Runtime:** Node.js (v20+), ES Modules (`"type": "module"`)
- **Framework:** Express 5
- **Database:** MongoDB via Mongoose 8
- **Auth:** JWT (`jsonwebtoken`) + `bcryptjs`
- **Security:** `helmet`, `cors`, `express-rate-limit`
- **Testing:** Vitest, Supertest, `mongodb-memory-server`
- **Dev tools:** Nodemon, Prettier

## Project Structure

```
main.js              # App entry point — connects DB then starts server
server.js            # HTTP server start/stop
db.js                # MongoDB connection helpers
src/
  app.js             # Express app setup (middleware, routes, error handler)
  routes/            # Express routers (auth, threads, subreddits, comments, votes)
  controllers/       # Request handlers — parse input, call services, send response
  services/          # Business logic layer — interacts with models
  models/            # Mongoose schemas (User, Thread, Subreddit, Comment)
  middleware/
    authHandler.js   # JWT verification middleware
    errorHandler.js  # Global error handler
  utils/
    createAppError.js # Error factory (message + statusCode)
  scripts/
    populate_db.js   # DB seeder script
    seed-data.js     # Seed data definitions
```

## Architecture & Conventions

- **Layered architecture:** Routes → Controllers → Services → Models. Keep each layer focused on its responsibility.
- **Error handling:** Use `createAppError(message, statusCode)` to create errors. Call `next(error)` to pass errors to the global `errorHandler` middleware. Never send responses directly from services.
- **Auth:** All routes except `POST /api/auth/register` and `POST /api/auth/login` require a valid `Bearer` token via `authHandler` middleware. The middleware attaches `req.user = { userId }`.
- **ES Modules:** All files use `import`/`export`. Always include `.js` extensions in relative imports.
- **Mongoose models:** Use `mongoose.Schema.Types.ObjectId` with `ref` for relationships. Enable `{ timestamps: true }` on all schemas.

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and receive JWT |
| GET | `/api/threads` | Yes | List all threads |
| GET | `/api/threads/:id` | Yes | Get thread by ID |
| POST | `/api/threads` | Yes | Create a thread |
| PUT | `/api/threads/:id` | Yes | Update a thread |
| DELETE | `/api/threads/:id` | Yes | Delete a thread |
| GET | `/api/subreddits` | Yes | List all subreddits |
| POST | `/api/subreddits` | Yes | Create a subreddit |
| GET | `/api/subreddits/:id` | Yes | Get subreddit with threads |
| GET | `/api/comments/thread/:threadId` | Yes | Get comments for a thread |
| POST | `/api/comments` | Yes | Add a comment |
| POST | `/api/threads/:id/upvote` | Yes | Upvote a thread |
| POST | `/api/threads/:id/downvote` | Yes | Downvote a thread |
| POST | `/api/comments/:id/upvote` | Yes | Upvote a comment |
| POST | `/api/comments/:id/downvote` | Yes | Downvote a comment |

## Data Models

### User
`name` (String, required), `email` (String, required, unique), `password` (String, required)

### Subreddit
`name` (String, required, unique), `description` (String), `author` (ObjectId → User)

### Thread
`title` (String, required), `content` (String, required), `author` (ObjectId → User), `subreddit` (ObjectId → Subreddit), `upvotes`/`downvotes`/`voteCount` (Number), `upvotedBy`/`downvotedBy` ([ObjectId → User])

### Comment
`thread` (ObjectId → Thread), `user` (ObjectId → User), `content` (String, required), `upvotedBy`/`downvotedBy` ([ObjectId → User]), `voteCount` (Number)

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with Nodemon |
| `npm start` | Start production server |
| `npm test` | Run tests with Vitest |
| `npm run populate` | Seed the database |
| `npm run format` | Format code with Prettier |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | `development` or `production` |

## Code Style Rules

- Use `async/await` for all asynchronous operations.
- Wrap controller logic in `try/catch`; pass errors via `next(error)`.
- Use descriptive HTTP status codes (200, 201, 400, 401, 404, 500).
- Return JSON responses with `{ success, data/message }` shape.
- Keep services pure of `req`/`res` — they receive plain data and return results or throw errors.
- Do not add `console.log` in production code paths except in `main.js`/`server.js`/`db.js`.

## Known Pitfalls & Bugs

### authHandler.js
1. **Missing `const` on `decoded`:** `decoded = jwt.verify(...)` should be `const decoded = jwt.verify(...)`. Without it, `decoded` leaks to global scope (or throws in strict mode).
2. **Token parsing is broken:** `header.replace("Bearer", "")` leaves a leading space (e.g., `" eyJ..."`). Must be `header.replace("Bearer ", "")` (with trailing space) or `header.split(" ")[1]`.
3. **Errors not passed to `next()`:** The `catch` block and user-not-found check return `createAppError(...)` directly instead of calling `next(createAppError(...))`. This means errors are silently swallowed and the request hangs.

### General
4. **Express 5 error handling:** Express 5 supports async error propagation, but any middleware that doesn't `await` or return promises correctly can cause unhandled rejections. Ensure all `async` middleware calls `next(error)` in catch blocks.
5. **Rate limiter in tests:** The global rate limiter (100 req/15min) can cause test failures when running many integration tests. Disable or raise the limit in test environments.
6. **No input validation:** Routes lack request body validation (e.g., missing `title`, invalid `email` format). Relying solely on Mongoose `required` gives poor 500 errors instead of 400s.
7. **No pagination:** `GET /api/threads` and `GET /api/subreddits` return all documents with no limit/offset, which won't scale.

## Testing Guidelines

- Use Vitest as the test runner (`npm test`).
- Use `mongodb-memory-server` for an in-memory test database.
- Use Supertest for integration tests against Express routes.
- Follow AAA pattern: Arrange, Act, Assert.
- Test success cases, client errors (400/401/404), edge cases, and failure cases.
- Do not modify application source code from tests.
