import pool from "../db/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const getRestaurants = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query?.limit) || 50;
  const page = parseInt(req.query?.page) || 1;
  const offset = (page - 1) * limit;

  const [
    restaurants,
  ] = await pool.query(
    `SELECT * FROM restaurants ORDER BY name LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  res.status(200).json(
    new ApiResponse(
      200,
      {
        restaurants,
      },
      "Restaurants fetched successfully"
    )
  );
});

const getRestuarant = asyncHandler(async (req, res) => {
  const restaurantID = req.params.restaurantID;

  if (!restaurantID) {
    throw new ApiError(400, "Restaurant id is required");
  }

  const [
    restaurant,
  ] = await pool.query(`SELECT * FROM restaurants WHERE restaurantID = ?`, [
    restaurantID,
  ]);

  if (restaurant.length === 0) {
    throw new ApiError(404, "Restaurant does not exist");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        restaurant: restaurant[0],
      },
      "Restaurant fetched successfully"
    )
  );
});

const getContacts = asyncHandler(async (req, res) => {
  const restaurantID = req.params.restaurantID;

  if (!restaurantID) {
    throw new ApiError(400, "Restaurant id is required");
  }

  const [
    contacts,
  ] = await pool.query(`SELECT * FROM contacts WHERE restaurantID = ?`, [
    restaurantID,
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        contacts,
      },
      "Contacts fetched successfully"
    )
  );
});

const addRestaurant = asyncHandler(async (req, res) => {
  const { name, location } = req.body;
  let { contacts } = req.body;

  if (
    !name ||
    !location ||
    [name, location].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Name and location are required");
  }

  const [
    result,
  ] = await pool.query(`INSERT INTO restaurants(name, location) VALUES(?, ?)`, [
    name,
    location,
  ]);

  const [
    restaurant,
  ] = await pool.query(
    `SELECT restaurantID, name, location FROM restaurants WHERE restaurantID = ?`,
    [result.insertId]
  );

  if (restaurant.length === 0) {
    throw new ApiError(500, "Something went wrong while creating restaurant");
  }

  if (contacts.length !== 0) {
    contacts = contacts.filter((contact) => {
      const { name, email, mobileNo, role } = contact;
      return !(
        !name ||
        !email ||
        !mobileNo ||
        !role ||
        [name, email, mobileNo, role].some((field) => field?.trim() === "")
      );
    });

    contacts = contacts.map((contact) => [
      contact.name,
      contact.email,
      contact.mobileNo,
      restaurant[0].restaurantID,
      contact.role,
    ]);
    
    await pool.query(
      `INSERT INTO contacts(name, email, mobileNo, restaurantID, role) VALUES ?`,
      [contacts]
    );
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        restaurant: restaurant[0],
      },
      "Restaurant created successfully"
    )
  );
});

const addContact = asyncHandler(async (req, res) => {
  const { name, email, mobileNo, role } = req.body;
  const restaurantID = req.params.restaurantID;

  if (
    !name ||
    !email ||
    !mobileNo ||
    !role ||
    [name, email, mobileNo, role].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Name, email, mobileNo and role are required");
  }

  const [
    restaurant,
  ] = await pool.query(
    `SELECT restaurantID from restaurants WHERE restaurantID = ?`,
    [restaurantID]
  );

  if (restaurant.length === 0) {
    throw new ApiError(404, "Restaurant does not exist");
  }

  const [
    existingContact,
  ] = await pool.query(
    "SELECT contactID from contacts WHERE email = ? AND restaurantID = ?",
    [email, restaurantID]
  );

  if (existingContact.length !== 0) {
    throw new ApiError(409, "Contact with same email already exist");
  }

  const [
    result,
  ] = await pool.query(
    `INSERT INTO contacts(name, email, mobileNo, restaurantID, role) VALUES(?, ?, ?, ?, ?)`,
    [name, email, mobileNo, restaurantID, role]
  );

  const [
    contact,
  ] = await pool.query(
    `SELECT name, email, mobileNo, role FROM contacts WHERE contactID = ?`,
    [result.insertId]
  );

  if (contact.length === 0) {
    throw new ApiError(500, "Something went wrong while creating contact");
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        contact: contact[0],
      },
      "Contact created successfully"
    )
  );
});

const deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurantID = req.params.restaurantID;

  if (!restaurantID) {
    throw new ApiError(400, "Restaurant id is required");
  }

  const [
    leads,
  ] = await pool.query(`SELECT leadID FROM leads WHERE restaurantID = ?`, [
    restaurantID,
  ]);

  if (leads.length !== 0) {
    throw new ApiError(
      409,
      `Cannot delete the restaurant, delete lead with id ${leads[0].leadID} first`
    );
  }

  await pool.query(`DELETE FROM restaurants WHERE restaurantID = ?`, [
    restaurantID,
  ]);

  const [
    restaurant,
  ] = await pool.query(
    `SELECT restaurantID FROM restaurants WHERE restaurantID = ?`,
    [restaurantID]
  );

  if (restaurant.length !== 0) {
    throw new ApiError(500, "Something went wrong while deleting restaurant");
  }

  return res
    .status(202)
    .json(new ApiResponse(202, {}, "Restaurant deleted succcessfully"));
});

export {
  addContact,
  addRestaurant,
  deleteRestaurant,
  getContacts,
  getRestaurants,
  getRestuarant,
};
