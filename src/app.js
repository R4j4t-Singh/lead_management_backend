import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// routes
import userRouter from "./routes/user.route.js";
import leadRouter from "./routes/lead.route.js";
import orderRouter from "./routes/order.route.js";
import restaurantRouter from "./routes/restaurant.route.js";
import productRouter from "./routes/product.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/leads", leadRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/restaurants", restaurantRouter);
app.use("/api/v1/products", productRouter);

export { app };
