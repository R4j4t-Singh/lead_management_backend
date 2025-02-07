import pool from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyUser = asyncHandler(async (req, res, next) => {
  const accessToken =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!accessToken) throw new ApiError(401, "Unauthorized request");

  try {
    const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);

    const [user] = await pool.query(
      `SELECT accountID from accounts where accountID = ?`,
      decodedToken?.id
    );

    if (user.length === 0) {
      throw new ApiError(401, "Invalid access token");
    }

    req.userID = user[0].accountID;
    next();
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});
