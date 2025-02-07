import pool from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const getOrders = asyncHandler(async (req, res) => {
  const sort = req.query?.sort === "asc" ? "ASC" : "DESC" || "DESC";
  const page = parseInt(req.query?.page) || 1;
  const limit = parseInt(req.query?.limit) || 50;
  const offset = (page - 1) * limit;

  const [
    orders,
  ] = await pool.query(
    `SELECT * FROM Orders ORDER BY ordered_at ${sort} LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
      },
      "Orders fetched Successfully"
    )
  );
});

const getOrder = asyncHandler(async (req, res) => {
  const orderID = req.params.orderID;
  if (!orderID) {
    throw new ApiError(400, "Order id is required");
  }

  const [order] = await pool.query(`SELECT * FROM orders WHERE orderID = ?`, [
    orderID,
  ]);

  if (order.length === 0) {
    throw new ApiError(404, "Order does not exist");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        order: order[0],
      },
      "Order fetched successfully"
    )
  );
});

export { getOrders, getOrder };
