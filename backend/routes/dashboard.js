const express = require("express");
const cors = require("cors");
const { sql, poolPromise } = require("./db"); // ✅ db.js file for connection

const app = express();
app.use(cors());
app.use(express.json());

// ----------------- DASHBOARD SUMMARY -----------------
app.get("/summary", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Products) AS totalProducts,
        (SELECT ISNULL(SUM(Quantity),0) FROM Stocks) AS totalStocks,
        (SELECT COUNT(*) FROM Releases) AS totalReleases,
        (SELECT COUNT(*) FROM vShortExpiry) AS shortExpiry,
        (SELECT COUNT(*) FROM Users) AS totalUsers
    `);

    res.json(result.recordset[0]); // ✅ Send first row as JSON
  } catch (err) {
    console.error("❌ Error fetching summary:", err);
    res.status(500).send("Failed to fetch summary");
  }
});

// Root check
app.get("/", (req, res) => res.send("Inventory backend is running"));

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
