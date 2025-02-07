import bcrypt from "bcrypt";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const hashPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.password || req.body.password === "") {
    throw new ApiError(400, "Password is required");
  }
  req.body.password = await bcrypt.hash(req.body.password, 10);
  next();
});
