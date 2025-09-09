const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");
const bcrypt = require("bcryptjs"); // for password hashing

// GET all users
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT UserID, FullName, NameWithInitials, NIC, Telephone, Username
      FROM Users
      ORDER BY UserID
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new user
router.post("/", async (req, res) => {
  const { FullName, NameWithInitials, NIC, Telephone, Username, Password, ConfirmedPassword } = req.body;

  // Check for required fields
  if (!FullName || !NameWithInitials || !NIC || !Username || !Password || !ConfirmedPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Check if passwords match
  if (Password !== ConfirmedPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const pool = await poolPromise;

    // Hash password
    const hash = await bcrypt.hash(Password, 10);

    await pool.request()
      .input("FullName", sql.NVarChar, FullName)
      .input("NameWithInitials", sql.NVarChar, NameWithInitials)
      .input("NIC", sql.VarChar, NIC)
      .input("Telephone", sql.VarChar, Telephone ?? "")
      .input("Username", sql.VarChar, Username)
      .input("Password", sql.NVarChar, hash)
      .input("ConfirmedPassword", sql.NVarChar, hash)
      .query(`
        INSERT INTO Users 
          (FullName, NameWithInitials, NIC, Telephone, Username, Password, ConfirmedPassword) 
        VALUES 
          (@FullName, @NameWithInitials, @NIC, @Telephone, @Username, @Password, @ConfirmedPassword)
      `);

    res.json({ message: "User added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

