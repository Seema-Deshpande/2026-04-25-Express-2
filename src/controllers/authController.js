import { register, login } from "../services/authService.js";

export const registerUser = async (req, res) => { 
    await register(req.body);
    res.status(200).json({
        success: true,
        message: "Request processed successfully",
    });
}

export const loginUser = async (req, res) => {
    const result = await login(req.body);
    res.status(200).json({
        success: true,
        message: "Request processed successfully",
        data: result,
    });
};