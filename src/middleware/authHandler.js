import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/User.js";
import { createAppError } from "../utils/createAppError.js";

const authHandler = async (req, res, next) => {
  const header = req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return next(createAppError("Authorization header missing or malformed", 401));
  }

  const token = header.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(createAppError("User not found", 404));
    }
    req.user = { userId: user._id };
    next();
  } catch (error) {
    return next(createAppError("Invalid or expired token", 401));
  }
};

export default authHandler;
