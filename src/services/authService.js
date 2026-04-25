import User from "../models/User.js";
import { createAppError } from "../utils/createAppError.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const register = async (input) => {
    if (!input.name || !input.email || !input.password) {
        throw createAppError("Name, email, and password are required", 400);
    }

    const name = String(input.name);
    const email = String(input.email);
    const password = String(input.password);

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        const hash = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hash,
        });
        await newUser.save();
    }
    // Silent no-op if email already exists — no user data returned either way
}
const login = async (input) => {
    if (!input.email || !input.password) {
        throw createAppError("Email and password are required", 400);
    }

    const email = String(input.email);
    const password = String(input.password);

    const user = await User.findOne({ email });
    if (!user) {
        throw createAppError("Invalid email or password", 401);
    }

    const matching = await bcrypt.compare(password, user.password);
    if (!matching) {
        throw createAppError("Invalid email or password", 401);
    }
    const token = jwt.sign(
        {  id: user._id }, // Data to encode in the token
        process.env.JWT_SECRET, // App secret key
        { expiresIn: "1h" } // Token expiration time
    );
    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        }
    };
}
export { register, login };