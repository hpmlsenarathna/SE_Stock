const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");

// Get drugs expiring in 30 days or less
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query("SELECT ReleaseID AS ShortID, ProductID, DrugName, ExpiryDate FROM Releases WHERE ExpiryDate <= DATEADD(DAY, 30, GETDATE())");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
