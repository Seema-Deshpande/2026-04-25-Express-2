import Thread from "../models/Thread.js";
import User from "../models/User.js";
import Subreddit from "../models/Subreddit.js";
import { createAppError } from "../utils/createAppError.js";

export const fetchAllThreads = async () => {
  const threads = await Thread.find()
    .populate({ path: "author", model: User })
    .populate({ path: "subreddit", model: Subreddit })
    .sort({ createdAt: -1 });

  // Add error handling for no threads found
  if (threads.length === 0) {
    const error = createAppError("No threads found", 404);
    throw error;
  }

  return threads;
};

export const fetchThreadById = async (id) => {
  const thread = await Thread.findById(id)
    .populate({ path: "author" })
    .populate({ path: "subreddit" });

    if (!thread) {
      throw createAppError("Thread not found", 404);
    }

  return thread;
};

export const createNewThread = async (title, content, author, subreddit) => {
  const newThread = new Thread({ title, content, author, subreddit });
  await newThread.save();

  const populatedThread = await Thread.findById(newThread._id)
    .populate({ path: "subreddit", select: "name description" })
    .populate({ path: "author", select: "name" });

   if (!populatedThread) {
    throw createAppError("Failed to create thread", 500);
  }

  return populatedThread;
};

export const updateThreadById = async (id, userId, updateData) => {
  const thread = await Thread.findById(id);
  if (!thread) {
    throw createAppError("Thread not found", 404);
  }

  if (thread.author.toString() !== userId.toString()) {
    throw createAppError("You are not authorized to update this thread", 403);
  }

  const allowedFields = ["title", "content"];
  const extraFields = Object.keys(updateData).filter(
    (key) => !allowedFields.includes(key),
  );
  if (extraFields.length > 0) {
    throw createAppError(
      `Invalid fields: ${extraFields.join(", ")}. Only title and content can be updated.`,
      400,
    );
  }

  const sanitized = {};
  if (updateData.title !== undefined) sanitized.title = String(updateData.title);
  if (updateData.content !== undefined) sanitized.content = String(updateData.content);

  const updatedThread = await Thread.findByIdAndUpdate(id, sanitized, {
    new: true,
    runValidators: true,
  });

  if (!updatedThread) {
    throw createAppError("Thread not found or update failed", 404);
  }

  return updatedThread;
};

export const deleteThreadById = async (id, userId) => {
  const thread = await Thread.findById(id);
  if (!thread) {
    throw createAppError("Thread not found", 404);
  }

  if (thread.author.toString() !== userId.toString()) {
    throw createAppError("You are not authorized to delete this thread", 403);
  }

  const deletedThread = await Thread.findByIdAndDelete(id);
  if (!deletedThread) {
    throw createAppError("Thread not found or delete failed", 404);
  }
  return deletedThread;
};
