import express from "express";
import { verifyUser } from "../middlewares/auth.middleware.js";
import { getProduct, getProducts } from "../controllers/product.controller.js";

const Router = express.Router();

Router.get("/", verifyUser, getProducts);

Router.get("/:productID", verifyUser, getProduct);

export default Router;
