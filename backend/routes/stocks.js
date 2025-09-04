const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");

router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Stocks");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { ProductID, DrugName, Quantity } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("ProductID", sql.Int, ProductID)
      .input("DrugName", sql.VarChar, DrugName)
      .input("Quantity", sql.Int, Quantity)
      .query("INSERT INTO Stocks (ProductID, DrugName, Quantity) VALUES (@ProductID, @DrugName, @Quantity)");
    res.json({ message: "Stock added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
