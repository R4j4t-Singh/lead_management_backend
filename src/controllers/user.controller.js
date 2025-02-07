import pool from "../db/index.js";
import bycrpt from "bcrypt";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (user) => {
  try {
    const accessToken = jwt.sign(
      {
        id: user.accountID,
        email: user.email,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: user.accountID },
      process.env.JWT_SECRET_KEY,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );

    await pool.query(
      `UPDATE accounts SET refresh_token = ? WHERE accountID = ?`,
      [refreshToken, user.accountID]
    );

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const addUser = asyncHandler(async (req, res) => {
  const { name, role, password, email } = req.body;

  if (
    !name ||
    !role ||
    !password ||
    !email ||
    [name, role, password, email].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const [
    existedUser,
  ] = await pool.query(`SELECT * FROM accounts WHERE email = ?`, [email]);

  if (existedUser.length !== 0) {
    throw new ApiError(409, "User with same email already exist");
  }

  const [
    result,
  ] = await pool.query(
    `INSERT INTO accounts(name, role, password, email) VALUES(?, ?, ?, ?)`,
    [name, role, password, email]
  );

  const [
    user,
  ] = await pool.query(
    `SELECT accountID, email, name, role FROM accounts WHERE accountID = ?`,
    [result.insertId]
  );

  if (user.length === 0) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { user: user[0] }, "User created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const [
    userPassword,
  ] = await pool.query(`SELECT password FROM accounts WHERE email = ?`, [
    email,
  ]);

  if (userPassword.length === 0) {
    throw new ApiError(404, "User does not exist");
  }

  const checkPassword = await bycrpt.compare(
    password,
    userPassword[0].password
  );

  if (!checkPassword) {
    throw new ApiError(401, "Incorrect credentials");
  }

  const [
    user,
  ] = await pool.query(
    `SELECT accountID, email, name, role FROM accounts WHERE email = ?`,
    [email]
  );

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user[0]
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: user[0],
          accessToken,
          refreshToken,
        },
        "User logged In"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userID = req.userID;

  await pool.query(
    `UPDATE accounts SET refresh_token = ? WHERE accountID = ?`,
    ["", userID]
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const userRefreshToken = req.cookies.refreshToken;

  if (!userRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = jwt.verify(userRefreshToken, process.env.JWT_SECRET_KEY);

  const [user] = await pool.query(
    `SELECT accountID, email, refresh_token FROM accounts where accountID = ?`,
    decodedToken?.id
  );

  if (user.length === 0) {
    throw new ApiError(401, "Invalid refersh token");
  }

  if (user[0]?.refresh_token !== userRefreshToken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user[0]
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, {
        accessToken,
        refreshToken,
      })
    );
});

const changePassword = asyncHandler(async (req, res) => {
  const userID = req.userID;
  const { oldPassword, password } = req.body;

  if (!oldPassword || !password) {
    throw new ApiError(400, "Old password and new pasword are required");
  }

  const [
    user,
  ] = await pool.query(`SELECT password from accounts WHERE accountID = ?`, [
    userID,
  ]);

  const check = await bycrpt.compare(oldPassword, user[0].password);

  if (!check) {
    throw new ApiError(400, "Wrong old password");
  }

  await pool.query(`UPDATE accounts SET password = ? WHERE accountID = ?`, [
    password,
    userID,
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getUser = asyncHandler(async (req, res) => {
  const userID = req.userID;
  const [
    user,
  ] = await pool.query(
    `SELECT accountID, email, name, role FROM accounts WHERE accountID = ?`,
    [userID]
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: user[0],
      },
      "User data fetched successfully"
    )
  );
});

const getUsers = asyncHandler(async (_, res) => {
  const [users] = await pool.query(`SELECT accountID, name FROM accounts`);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
      },
      "Users fetched successfully"
    )
  );
});

//TODO : getuserrole

export {
  addUser,
  changePassword,
  getUser,
  getUsers,
  loginUser,
  logoutUser,
  refreshAccessToken,
};
