import pool from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const getProducts = asyncHandler(async (_, res) => {
  const [products] = await pool.query(`SELECT * FROM products`);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
      },
      "Products fetched Sucessfully"
    )
  );
});

const getProduct = asyncHandler(async (req, res) => {
  const productID = req.params.productID;

  if (!productID) {
    throw new ApiError(400, "Product id is required");
  }

  const [
    product,
  ] = await pool.query(`SELECT * FROM products Where productID = ?`, [
    productID,
  ]);

  if (product.length === 0) {
    throw new ApiError(404, "Product does not exist");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        product: product[0],
      },
      "Product fetched successfully"
    )
  );
});

export { getProducts, getProduct };
