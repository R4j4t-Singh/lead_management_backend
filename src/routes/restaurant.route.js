import express from "express";
import { verifyUser } from "../middlewares/auth.middleware.js";
import {
  addContact,
  addRestaurant,
  deleteRestaurant,
  getContacts,
  getRestaurants,
  getRestuarant,
} from "../controllers/restaurant.controller.js";

const router = express.Router();

router.get("/", verifyUser, getRestaurants);

router.get("/:restaurantID", verifyUser, getRestuarant);

router.get("/:restaurantID/contacts", verifyUser, getContacts);

router.post("/", verifyUser, addRestaurant);

router.post("/:restaurantID/contacts", verifyUser, addContact);

router.delete("/:restaurantID", verifyUser, deleteRestaurant);

export default router;
