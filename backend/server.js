const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { poolPromise, sql } = require("./db");

const signUpRoute = require("./routes/signup");
const signInRoute = require("./routes/signin");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* ----------------- HELPERS ----------------- */
async function runQuery(res, fn) {
  try {
    const pool = await poolPromise;
    const result = await fn(pool);
    res.json(result.recordset ?? result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/* ----------------- PRODUCTS ----------------- */
app.get("/products", async (req, res) => {
  await runQuery(res, (pool) =>
    pool
      .request()
      .query("SELECT ProductID, DrugName FROM Products ORDER BY ProductID")
  );
});

app.get("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await runQuery(res, (pool) =>
    pool
      .request()
      .input("id", sql.Int, id)
      .query(
        "SELECT ProductID, DrugName FROM Products WHERE ProductID=@id"
      )
  );
});

app.post("/products", async (req, res) => {
  const { DrugName } = req.body;
  if (!DrugName) return res.status(400).json({ error: "DrugName is required" });

  await runQuery(res, (pool) =>
    pool
      .request()
      .input("DrugName", sql.NVarChar(100), DrugName)
      .query(
        "INSERT INTO Products (DrugName) VALUES (@DrugName); SELECT SCOPE_IDENTITY() AS ProductID"
      )
  );
});

/* ----------------- STOCKS ----------------- */
app.get("/stocks", async (req, res) => {
  await runQuery(res, (pool) =>
    pool
      .request()
      .query(
        "SELECT StockID, ProductID, DrugName, Quantity FROM Stocks ORDER BY StockID"
      )
  );
});

app.post("/stocks", async (req, res) => {
  const { ProductID, DrugName, Quantity } = req.body;
  if (!ProductID || Quantity == null)
    return res.status(400).json({ error: "ProductID and Quantity are required" });

  await runQuery(res, (pool) =>
    pool
      .request()
      .input("ProductID", sql.Int, ProductID)
      .input("DrugName", sql.NVarChar(100), DrugName ?? "")
      .input("Quantity", sql.Int, Quantity)
      .query(
        "INSERT INTO Stocks (ProductID, DrugName, Quantity) VALUES (@ProductID, @DrugName, @Quantity); SELECT SCOPE_IDENTITY() AS StockID"
      )
  );
});

/* ----------------- RELEASES ----------------- */
app.get("/release", async (req, res) => {
  await runQuery(res, (pool) =>
    pool
      .request()
      .query(
        "SELECT ReleaseID, ProductID, DrugName, ReleaseDate, ExpiryDate FROM Releases ORDER BY ReleaseDate DESC"
      )
  );
});

/* ----------------- DASHBOARD SUMMARY ----------------- */
app.get("/summary", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Products) AS totalProducts,
        (SELECT ISNULL(SUM(Quantity),0) FROM Stocks) AS totalStocks,
        (SELECT COUNT(*) FROM Releases) AS totalReleases,
        (SELECT COUNT(*) FROM vShortExpiry) AS shortExpiry
    `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching summary:", err);
    res.status(500).send("Failed to fetch summary");
  }
});

/* ----------------- ShortExpiry ----------------- */
const shortExpiryRoute = require("./routes/shortExpiry");
app.use("/shortexpiry", shortExpiryRoute);


/* ----------------- AUTH ROUTES ----------------- */
app.use("/signup", signUpRoute);
app.use("/signin", signInRoute);
app.use("/forgot-password", require("./routes/forgotPassword"));


/* ----------------- ROOT ----------------- */
app.get("/", (req, res) => res.send("Inventory backend is running"));

/* ----------------- START SERVER ----------------- */
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
