import express from "express";
import {
  addCall,
  addLead,
  deleteLead,
  getCalls,
  getLead,
  getLeads,
  getOrders,
  setStatus,
} from "../controllers/lead.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verifyUser, getLeads);

router.get("/:leadID", verifyUser, getLead);

router.get("/:leadID/orders", verifyUser, getOrders);

router.post("/:leadID/calls", verifyUser, addCall);

router.get("/:leadID/calls", verifyUser, getCalls);

router.post("/", verifyUser, addLead);

router.patch("/:leadID", verifyUser, setStatus);

router.delete("/:leadID", verifyUser, deleteLead);

export default router;
