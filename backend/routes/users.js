const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");

router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Users");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { Name, Email, Role } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("Name", sql.VarChar, Name)
      .input("Email", sql.VarChar, Email)
      .input("Role", sql.VarChar, Role)
      .query("INSERT INTO Users (Name, Email, Role) VALUES (@Name, @Email, @Role)");
    res.json({ message: "User added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
