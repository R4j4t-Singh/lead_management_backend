import pool from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getLeads = asyncHandler(async (req, res) => {
  const sort = req.query?.sort == "asc" ? "ASC" : "DESC" || "DESC";
  const limit = parseInt(req.query?.limit) || 50;
  const page = parseInt(req.query?.page) || 1;
  const offset = (page - 1) * limit;

  const [leads] = await pool.query(
    `
    SELECT leadID, title, status, created_at, restaurantID, call_frequency FROM leads ORDER BY created_at ${sort} LIMIT ? offset ?
    `,
    [limit, offset]
  );

  res.status(200).json(
    new ApiResponse(
      200,
      {
        leads,
      },
      "Leads fetched successfully"
    )
  );
});

const getLead = asyncHandler(async (req, res) => {
  const leadID = req.params.leadID;

  if (!leadID) {
    throw new ApiError(400, "Lead id is required");
  }

  const [lead] = await pool.query(`SELECT * FROM leads WHERE leadID = ?`, [
    leadID,
  ]);

  if (lead.length === 0) {
    throw new ApiError(404, "Lead does not exist");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        lead: lead[0],
      },
      "Lead fetched successfully"
    )
  );
});

const addLead = asyncHandler(async (req, res) => {
  const {
    title,
    call_frequency,
    assignedTo,
    restaurantID,
    total_value,
    orders, //changed products to orders
  } = req.body;

  //checks
  if (
    !restaurantID ||
    !call_frequency ||
    !assignedTo ||
    !orders ||
    !total_value
  ) {
    throw new ApiError(
      400,
      "Restaurant, call frequency, assigned to, products and total value are required"
    );
  }

  const [restaurant] = await pool.query(
    `
    SELECT restaurantID FROM restaurants WHERE restaurantID = ?`,
    [restaurantID]
  );

  if (restaurant.length === 0) {
    throw new ApiError(404, "Restaurant does not exist");
  }

  const [
    user,
  ] = await pool.query(`SELECT accountID FROM accounts WHERE accountID = ?`, [
    assignedTo,
  ]);

  if (user.length === 0) {
    throw new ApiError(404, "User does not exist");
  }

  let validOrders;
  validOrders = orders.filter((order) => {
    const { productID, quantity, total_price } = order;
    return !(!productID || !quantity || !total_price);
  });

  if (validOrders.length === 0) {
    throw new ApiError(400, "No valid orders found");
  }

  const userID = req.userID;

  const [result] = await pool.query(
    `
    INSERT INTO leads(title, call_frequency, assigned_to, restaurantID, total_value, accountID) VALUES(?,?,?,?,?,?)`,
    [title, call_frequency, assignedTo, restaurantID, total_value, userID]
  );

  const [lead] = await pool.query(
    `
    SELECT leadID, title, call_frequency , assigned_to, restaurantID, total_value FROM leads WHERE leadID = ?`,
    [result.insertId]
  );

  if (lead.length === 0) {
    throw new ApiError(500, "Something went wrong while creating lead");
  }

  validOrders = validOrders.map((order) => [
    order.productID,
    restaurantID,
    order.total_price,
    order.quantity,
    lead[0].leadID,
  ]);

  await pool.query(
    `INSERT INTO orders(productID, restaurantID, total_price, quantity, leadID) VALUES ?`,
    [validOrders]
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        lead: lead[0],
      },
      "Lead created Successfully"
    )
  );
});

const getOrders = asyncHandler(async (req, res) => {
  const leadID = req.params?.leadID;

  if (!leadID) {
    throw new ApiError(400, "Lead id is required");
  }

  const [orders] = await pool.query(
    `SELECT products.name as product_name, status, quantity, total_price
    FROM orders 
    JOIN products ON products.productID = orders.productID
    WHERE leadID = ?`,
    leadID
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
      },
      "Orders fetched successfully"
    )
  );
});

const deleteLead = asyncHandler(async (req, res) => {
  const leadID = req.params?.leadID;

  if (!leadID) {
    throw new ApiError(400, "Lead id is required");
  }

  const [lead] = await pool.query(`SELECT leadID FROM leads WHERE leadID = ?`, [
    leadID,
  ]);

  if (lead.length === 0) {
    throw new ApiError(404, "Lead does not exist");
  }

  await pool.query(`DELETE FROM leads WHERE leadID = ?`, leadID);

  const [result] = await pool.query(
    `SELECT leadID FROM leads WHERE leadID = ?`,
    leadID
  );

  if (result.length !== 0) {
    throw new ApiError(500, "Something went wrong while deleting lead");
  }

  return res
    .status(202)
    .json(new ApiResponse(202, {}, "Lead deleted successfully"));
});

const addCall = asyncHandler(async (req, res) => {
  const leadID = req.params.leadID;
  if (!leadID) {
    throw new ApiError(400, "Lead id is required");
  }

  const { contactID, duration } = req.body;
  if (!contactID || !duration) {
    throw new ApiError(400, "contact id and duration are required");
  }

  const [lead] = await pool.query(`SELECT leadID FROM leads WHERE leadID = ?`, [
    leadID,
  ]);

  if (lead.length === 0) {
    throw new ApiError(404, "Lead does not exist");
  }

  const [contact] = await pool.query(
    `
    SELECT contactID FROM contacts where contactID = ?`,
    [contactID]
  );

  if (contact.length === 0) {
    throw new ApiError(404, "Contact does not exist");
  }

  const userID = req.userID;

  const [result] = await pool.query(
    `
    INSERT INTO calls(accountID, contactID, duration, leadID) VALUES(?, ?, ?, ?)
    `,
    [userID, contactID, duration, leadID]
  );

  const [call] = await pool.query(
    `
    SELECT * FROM calls WHERE callID = ?`,
    [result.insertId]
  );

  if (call.length === 0) {
    throw new ApiError(500, "Something went wrong while adding call");
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        call: call[0],
      },
      "Call added successfully"
    )
  );
});

const getCalls = asyncHandler(async (req, res) => {
  const leadID = req.params.leadID;

  if (!leadID) {
    throw new ApiError(400, "Lead id is required");
  }

  const [lead] = await pool.query(`SELECT leadID FROM leads WHERE leadID = ?`, [
    leadID,
  ]);

  if (lead.length === 0) {
    throw new ApiError(404, "Lead does not exist");
  }

  const [calls] = await pool.query(
    `
      SELECT called_at, duration, Accounts.name as account_name, Contacts.name
      FROM Calls 
      JOIN Contacts ON Calls.contactID = Contacts.contactID
      JOIN Accounts ON Calls.accountID = Accounts.accountID
      WHERE Calls.leadID = ?
      ORDER BY Calls.called_at DESC
      `,
    [leadID]
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        calls,
      },
      "Calls fetched successfully"
    )
  );
});

const allowedStatus = ["done", "cancelled"];

const setStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const leadID = req.params.leadID;

  if (!leadID || !status) {
    throw new ApiError(400, "Lead id and status are required");
  }

  if (!allowedStatus.includes(status.toLowerCase())) {
    throw new ApiError(400, "Wrong status");
  }

  const [lead] = await pool.query(`SELECT leadID FROM leads WHERE leadID = ?`, [
    leadID,
  ]);

  if (lead.length === 0) {
    throw new ApiError(404, "Lead does not exist");
  }

  await pool.query(`UPDATE leads SET status = ? WHERE leadID = ?`, [
    status.toLowerCase(),
    leadID,
  ]);

  const [
    updatedLead,
  ] = await pool.query(`SELECT status FROM leads WHERE leadID = ?`, [leadID]);

  if (updatedLead[0].status !== status.toLowerCase()) {
    throw new ApiError(500, "Something went wrong while updating status");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Status changed successfully"));
});

export {
  addCall,
  addLead,
  deleteLead,
  getCalls,
  getLead,
  getLeads,
  getOrders,
  setStatus,
};
