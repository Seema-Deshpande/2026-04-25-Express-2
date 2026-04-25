# ThreadHive Backend

A Reddit-inspired RESTful API backend built with **Express 5** and **MongoDB**. ThreadHive lets users create communities (subreddits), post discussion threads, comment, and vote — just like Reddit.

---

## Features

- **User Authentication** — Register & login with JWT-based auth
- **Subreddits** — Create and browse communities
- **Threads** — Create, read, update, and delete discussion threads within subreddits
- **Comments** — Add and fetch comments on threads
- **Voting** — Upvote/downvote threads and comments (one vote per user)
- **Security** — Helmet headers, CORS, and rate limiting (100 req / 15 min)
- **Database Seeding** — Built-in script to populate sample data

---

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Runtime      | Node.js (v20+)                      |
| Framework    | Express 5                           |
| Database     | MongoDB / Mongoose 8                |
| Auth         | JSON Web Tokens (jsonwebtoken)      |
| Security     | Helmet, CORS, express-rate-limit    |
| Testing      | Vitest, Supertest, mongodb-memory-server |
| Dev Tools    | Nodemon, Prettier                   |

---

## Project Structure

```
threadhive-backend/
├── main.js                  # Entry point — connects DB & starts server
├── server.js                # Server start/stop helpers
├── db.js                    # MongoDB connection logic
├── src/
│   ├── app.js               # Express app setup & middleware
│   ├── controllers/         # Route handler logic
│   ├── middleware/
│   │   ├── authHandler.js   # JWT authentication middleware
│   │   └── errorHandler.js  # Global error handler
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   ├── Subreddit.js
│   │   ├── Thread.js
│   │   └── Comment.js
│   ├── routes/              # Express route definitions
│   ├── services/            # Business logic layer
│   ├── scripts/             # DB seed / populate scripts
│   └── utils/               # Shared utilities
└── tests/                   # Test suites (Vitest)
```

---

## Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **MongoDB** instance (local or Atlas)

### Installation

```bash
git clone <repository-url>
cd threadhive-backend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/threadhive
JWT_SECRET=your_jwt_secret_here
```

| Variable      | Description                        |
| ------------- | ---------------------------------- |
| `PORT`        | Server port (default: `3000`)      |
| `MONGODB_URI` | MongoDB connection string          |
| `JWT_SECRET`  | Secret key for signing JWT tokens  |

### Running the App

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Seed the database with sample data
npm run populate

# Run tests
npm test

# Format code
npm run format
```

---

## API Endpoints

> All endpoints except **Auth** require a valid JWT token in the `Authorization: Bearer <token>` header.

### Auth

| Method | Route              | Description         | Auth |
| ------ | ------------------ | ------------------- | ---- |
| POST   | `/api/auth/register` | Register a new user | No   |
| POST   | `/api/auth/login`    | Login & get token   | No   |

### Subreddits

| Method | Route                 | Description                          | Auth |
| ------ | --------------------- | ------------------------------------ | ---- |
| GET    | `/api/subreddits`     | List all subreddits                  | Yes  |
| POST   | `/api/subreddits`     | Create a subreddit                   | Yes  |
| GET    | `/api/subreddits/:id` | Get a subreddit with its threads     | Yes  |

### Threads

| Method | Route               | Description          | Auth |
| ------ | ------------------- | -------------------- | ---- |
| GET    | `/api/threads`      | List all threads     | Yes  |
| GET    | `/api/threads/:id`  | Get a single thread  | Yes  |
| POST   | `/api/threads`      | Create a thread      | Yes  |
| PUT    | `/api/threads/:id`  | Update a thread      | Yes  |
| DELETE | `/api/threads/:id`  | Delete a thread      | Yes  |

### Comments

| Method | Route                              | Description                   | Auth |
| ------ | ---------------------------------- | ----------------------------- | ---- |
| GET    | `/api/comments/thread/:threadId`   | Get comments for a thread     | Yes  |
| POST   | `/api/comments`                    | Add a comment to a thread     | Yes  |

### Votes

| Method | Route                           | Description            | Auth |
| ------ | ------------------------------- | ---------------------- | ---- |
| POST   | `/api/threads/:id/upvote`       | Upvote a thread        | Yes  |
| POST   | `/api/threads/:id/downvote`     | Downvote a thread      | Yes  |
| POST   | `/api/comments/:id/upvote`      | Upvote a comment       | Yes  |
| POST   | `/api/comments/:id/downvote`    | Downvote a comment     | Yes  |

---

## Data Models

### User
`name` · `email` (unique) · `password` (hashed)

### Subreddit
`name` (unique) · `description` · `author` (ref → User)

### Thread
`title` · `content` · `author` (ref → User) · `subreddit` (ref → Subreddit) · `upvotes` · `downvotes` · `voteCount` · `upvotedBy` · `downvotedBy`

### Comment
`content` · `thread` (ref → Thread) · `user` (ref → User) · `voteCount` · `upvotedBy` · `downvotedBy`

---

## License

ISC
