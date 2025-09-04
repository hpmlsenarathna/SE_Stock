const express = require("express");
const router = express.Router();
const { poolPromise, sql } = require("../db");

// --- GET all releases ---
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query("SELECT ReleaseID, ProductID, DrugName, ReleaseDate, ExpiryDate FROM Releases ORDER BY ReleaseDate DESC");

    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching releases:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- POST add a release ---
router.post("/", async (req, res) => {
  const { ProductID, DrugName, ReleaseDate, ExpiryDate } = req.body;

  if (!ProductID || !DrugName) {
    return res.status(400).json({ message: "ProductID and DrugName are required" });
  }

  try {
    const pool = await poolPromise;

    // check product exists
    const productCheck = await pool.request()
      .input("ProductID", sql.Int, ProductID)
      .query("SELECT ProductID FROM Products WHERE ProductID = @ProductID");

    if (!productCheck.recordset || productCheck.recordset.length === 0) {
      return res.status(400).json({ message: `ProductID ${ProductID} does not exist.` });
    }

    // insert release
    const result = await pool.request()
      .input("ProductID", sql.Int, ProductID)
      .input("DrugName", sql.NVarChar(100), DrugName)
      .input("ReleaseDate", sql.Date, ReleaseDate || null)
      .input("ExpiryDate", sql.Date, ExpiryDate || null)
      .query(`INSERT INTO Releases (ProductID, DrugName, ReleaseDate, ExpiryDate)
              VALUES (@ProductID, @DrugName, @ReleaseDate, @ExpiryDate);
              SELECT SCOPE_IDENTITY() AS ReleaseID`);

    res.json({ message: "Release added successfully", ReleaseID: result.recordset[0].ReleaseID });
  } catch (err) {
    console.error("Error inserting release:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- PUT update a release ---
router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { ProductID, DrugName, ReleaseDate, ExpiryDate } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("ProductID", sql.Int, ProductID)
      .input("DrugName", sql.NVarChar(100), DrugName ?? '')
      .input("ReleaseDate", sql.Date, ReleaseDate || null)
      .input("ExpiryDate", sql.Date, ExpiryDate || null)
      .query(`UPDATE Releases
              SET ProductID=@ProductID, DrugName=@DrugName, ReleaseDate=@ReleaseDate, ExpiryDate=@ExpiryDate
              WHERE ReleaseID=@id;
              SELECT @@ROWCOUNT AS rowsAffected`);

    res.json({ message: "Release updated", rowsAffected: result.recordset[0].rowsAffected });
  } catch (err) {
    console.error("Error updating release:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- DELETE release ---
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Releases WHERE ReleaseID=@id; SELECT @@ROWCOUNT AS rowsAffected");

    res.json({ message: "Release deleted", rowsAffected: result.recordset[0].rowsAffected });
  } catch (err) {
    console.error("Error deleting release:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
