import express from "express";
import { getOrder, getOrders } from "../controllers/order.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyUser, getOrders);

router.get("/:orderID", verifyUser, getOrder)

export default router;
