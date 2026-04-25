import * as userService from "../services/userService.js";

const getUserProfile = async (req, res, next) => {
  const userId = req.user.userId;
  const user = await userService.getUserById(userId);
  res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    data: user,
  });
};

export { getUserProfile };
