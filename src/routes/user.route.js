import express from "express";
import {
  addUser,
  changePassword,
  getUser,
  getUsers,
  loginUser,
  logoutUser,
  refreshAccessToken,
} from "../controllers/user.controller.js";
import { hashPassword } from "../middlewares/password.middleware.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", hashPassword, addUser);

router.post("/login", loginUser);

router.get("/refresh-token", refreshAccessToken);

//secured routes
router.get("/logout", verifyUser, logoutUser);

router.post("/change-password", verifyUser, hashPassword, changePassword);

router.get("/get-user", verifyUser, getUser);

router.get("/", verifyUser, getUsers);

export default router;
