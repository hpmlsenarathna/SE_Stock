const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");

// Get all products
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Products");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new product
router.post("/", async (req, res) => {
  const { DrugName } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("DrugName", sql.VarChar, DrugName)
      .query("INSERT INTO Products (DrugName) VALUES (@DrugName)");
    res.json({ message: "Product added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
