import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import User from "../../src/models/User.js";
import Subreddit from "../../src/models/Subreddit.js";
import Thread from "../../src/models/Thread.js";

let mongoServer;
let request;
let testUser;
let testUser2;
let testSubreddit;
let authToken;
let authToken2;

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const createToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1h" });

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  process.env.JWT_SECRET = JWT_SECRET;
  request = supertest(app);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Subreddit.deleteMany({});
  await Thread.deleteMany({});

  testUser = await User.create({
    name: "TestUser",
    email: "test@example.com",
    password: "hashedpassword123",
  });

  testUser2 = await User.create({
    name: "TestUser2",
    email: "test2@example.com",
    password: "hashedpassword456",
  });

  testSubreddit = await Subreddit.create({
    name: "testsubreddit",
    description: "A test subreddit",
    author: testUser._id,
  });

  authToken = createToken(testUser._id);
  authToken2 = createToken(testUser2._id);
});

// ─── Helper ──────────────────────────────────────────────────────────
const createTestThread = (overrides = {}) =>
  Thread.create({
    title: "Test Thread",
    content: "Test content",
    author: testUser._id,
    subreddit: testSubreddit._id,
    ...overrides,
  });

// ─── GET /api/threads ────────────────────────────────────────────────
describe("GET /api/threads", () => {
  it("should return 401 without auth token", async () => {
    const res = await request.get("/api/threads");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 404 when no threads exist", async () => {
    const res = await request
      .get("/api/threads")
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/no threads found/i);
  });

  it("should return all threads sorted by createdAt desc", async () => {
    await createTestThread({ title: "First" });
    await createTestThread({ title: "Second" });

    const res = await request
      .get("/api/threads")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].title).toBe("Second");
    expect(res.body.data[1].title).toBe("First");
  });

  it("should populate author and subreddit fields", async () => {
    await createTestThread();

    const res = await request
      .get("/api/threads")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].author).toHaveProperty("name", "TestUser");
    expect(res.body.data[0].subreddit).toHaveProperty("name", "testsubreddit");
  });
});

// ─── GET /api/threads/:id ────────────────────────────────────────────
describe("GET /api/threads/:id", () => {
  it("should return 401 without auth token", async () => {
    const thread = await createTestThread();
    const res = await request.get(`/api/threads/${thread._id}`);
    expect(res.status).toBe(401);
  });

  it("should return a thread by id", async () => {
    const thread = await createTestThread();

    const res = await request
      .get(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Test Thread");
  });

  it("should return 404 for non-existent thread", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request
      .get(`/api/threads/${fakeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should return 500 for invalid ObjectId", async () => {
    const res = await request
      .get("/api/threads/invalid-id")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(500);
  });
});

// ─── POST /api/threads ──────────────────────────────────────────────
describe("POST /api/threads", () => {
  const validBody = () => ({
    title: "New Thread",
    content: "New content",
    subreddit: null, // set in tests
  });

  it("should return 401 without auth token", async () => {
    const res = await request.post("/api/threads").send(validBody());
    expect(res.status).toBe(401);
  });

  it("should create a thread successfully", async () => {
    const body = { ...validBody(), subreddit: testSubreddit._id.toString() };

    const res = await request
      .post("/api/threads")
      .set("Authorization", `Bearer ${authToken}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("New Thread");
    expect(res.body.data.author).toHaveProperty("name", "TestUser");
    expect(res.body.data.subreddit).toHaveProperty("name", "testsubreddit");

    const count = await Thread.countDocuments();
    expect(count).toBe(1);
  });

  it("should return 400 when title is missing", async () => {
    const res = await request
      .post("/api/threads")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ content: "content", subreddit: testSubreddit._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 when content is missing", async () => {
    const res = await request
      .post("/api/threads")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "title", subreddit: testSubreddit._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 when subreddit is missing", async () => {
    const res = await request
      .post("/api/threads")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "title", content: "content" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── PUT /api/threads/:id ───────────────────────────────────────────
describe("PUT /api/threads/:id", () => {
  it("should return 401 without auth token", async () => {
    const thread = await createTestThread();
    const res = await request
      .put(`/api/threads/${thread._id}`)
      .send({ title: "Updated" });
    expect(res.status).toBe(401);
  });

  it("should update title and content of own thread", async () => {
    const thread = await createTestThread();

    const res = await request
      .put(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Updated Title", content: "Updated Content" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Updated Title");
    expect(res.body.data.content).toBe("Updated Content");
  });

  it("should return 403 when updating another user's thread", async () => {
    const thread = await createTestThread();

    const res = await request
      .put(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${authToken2}`)
      .send({ title: "Hacked" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("should return 404 for non-existent thread", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request
      .put(`/api/threads/${fakeId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "Updated" });

    expect(res.status).toBe(404);
  });

  it("should return 400 for invalid fields", async () => {
    const thread = await createTestThread();

    const res = await request
      .put(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ title: "OK", hackerField: "bad" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid fields/i);
  });
});

// ─── DELETE /api/threads/:id ────────────────────────────────────────
describe("DELETE /api/threads/:id", () => {
  it("should return 401 without auth token", async () => {
    const thread = await createTestThread();
    const res = await request.delete(`/api/threads/${thread._id}`);
    expect(res.status).toBe(401);
  });

  it("should delete own thread", async () => {
    const thread = await createTestThread();

    const res = await request
      .delete(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const count = await Thread.countDocuments();
    expect(count).toBe(0);
  });

  it("should return 403 when deleting another user's thread", async () => {
    const thread = await createTestThread();

    const res = await request
      .delete(`/api/threads/${thread._id}`)
      .set("Authorization", `Bearer ${authToken2}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("should return 404 for non-existent thread", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request
      .delete(`/api/threads/${fakeId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });
});
