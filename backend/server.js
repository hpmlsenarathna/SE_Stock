const express = require('express');
const cors = require('cors');
const { poolPromise, sql } = require('./db'); 
require('dotenv').config();

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
app.get('/products', async (req, res) => {
  await runQuery(res, pool =>
    pool.request().query('SELECT ProductID, DrugName FROM Products ORDER BY ProductID')
  );
});

app.get('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await runQuery(res, pool =>
    pool.request()
      .input('id', sql.Int, id)
      .query('SELECT ProductID, DrugName FROM Products WHERE ProductID=@id')
  );
});

app.post('/products', async (req, res) => {
  const { DrugName } = req.body;
  if (!DrugName) return res.status(400).json({ error: 'DrugName is required' });

  await runQuery(res, pool =>
    pool.request()
      .input('DrugName', sql.NVarChar(100), DrugName)
      .query('INSERT INTO Products (DrugName) VALUES (@DrugName); SELECT SCOPE_IDENTITY() AS ProductID')
  );
});

app.put('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { DrugName } = req.body;
  if (!DrugName) return res.status(400).json({ error: 'DrugName is required' });

  await runQuery(res, pool =>
    pool.request()
      .input('id', sql.Int, id)
      .input('DrugName', sql.NVarChar(100), DrugName)
      .query('UPDATE Products SET DrugName=@DrugName WHERE ProductID=@id; SELECT @@ROWCOUNT AS rowsAffected')
  );
});

app.delete('/products/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await runQuery(res, pool =>
    pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Products WHERE ProductID=@id; SELECT @@ROWCOUNT AS rowsAffected')
  );
});


/* ----------------- STOCKS ----------------- */
app.get('/stocks', async (req, res) => {
  await runQuery(res, pool =>
    pool.request().query('SELECT StockID, ProductID, DrugName, Quantity FROM Stocks ORDER BY StockID')
  );
});

app.post('/stocks', async (req, res) => {
  const { ProductID, DrugName, Quantity } = req.body;
  if (!ProductID || Quantity == null) return res.status(400).json({ error: 'ProductID and Quantity are required' });

  await runQuery(res, pool =>
    pool.request()
      .input('ProductID', sql.Int, ProductID)
      .input('DrugName', sql.NVarChar(100), DrugName ?? '')
      .input('Quantity', sql.Int, Quantity)
      .query('INSERT INTO Stocks (ProductID, DrugName, Quantity) VALUES (@ProductID, @DrugName, @Quantity); SELECT SCOPE_IDENTITY() AS StockID')
  );
});

app.put('/stocks/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { ProductID, DrugName, Quantity } = req.body;

  await runQuery(res, pool =>
    pool.request()
      .input('id', sql.Int, id)
      .input('ProductID', sql.Int, ProductID)
      .input('DrugName', sql.NVarChar(100), DrugName ?? '')
      .input('Quantity', sql.Int, Quantity)
      .query('UPDATE Stocks SET ProductID=@ProductID, DrugName=@DrugName, Quantity=@Quantity WHERE StockID=@id; SELECT @@ROWCOUNT AS rowsAffected')
  );
});

app.delete('/stocks/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await runQuery(res, pool =>
    pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Stocks WHERE StockID=@id; SELECT @@ROWCOUNT AS rowsAffected')
  );
});


/* ----------------- RELEASES ----------------- */
app.get('/release', async (req, res) => {
  await runQuery(res, pool =>
    pool.request()
      .query('SELECT ReleaseID, ProductID, DrugName, ReleaseDate, ExpiryDate FROM Releases ORDER BY ReleaseDate DESC')
  );
});

app.post('/release', async (req, res) => {
  const { ProductID, DrugName, ReleaseDate, ExpiryDate } = req.body;
  if (!ProductID || !ExpiryDate) 
    return res.status(400).json({ error: 'ProductID and ExpiryDate are required' });

  try {
    const pool = await poolPromise;

    // check if product exists
    const productCheck = await pool.request()
      .input('ProductID', sql.Int, ProductID)
      .query('SELECT COUNT(*) as count FROM Products WHERE ProductID=@ProductID');

    if (productCheck.recordset[0].count === 0) {
      return res.status(400).json({ error: `Product with ID ${ProductID} not found.` });
    }

    const result = await pool.request()
      .input('ProductID', sql.Int, ProductID)
      .input('DrugName', sql.NVarChar(100), DrugName ?? '')
      .input('ReleaseDate', sql.Date, ReleaseDate || new Date())
      .input('ExpiryDate', sql.Date, ExpiryDate)
      .query('INSERT INTO Releases (ProductID, DrugName, ReleaseDate, ExpiryDate) VALUES (@ProductID, @DrugName, @ReleaseDate, @ExpiryDate); SELECT SCOPE_IDENTITY() AS ReleaseID');

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('POST /release error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/release/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { ProductID, DrugName, ReleaseDate, ExpiryDate } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('ProductID', sql.Int, ProductID)
      .input('DrugName', sql.NVarChar(100), DrugName ?? '')
      .input('ReleaseDate', sql.Date, ReleaseDate || null)
      .input('ExpiryDate', sql.Date, ExpiryDate || null)
      .query('UPDATE Releases SET ProductID=@ProductID, DrugName=@DrugName, ReleaseDate=@ReleaseDate, ExpiryDate=@ExpiryDate WHERE ReleaseID=@id; SELECT @@ROWCOUNT AS rowsAffected');

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('PUT /release/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/release/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await runQuery(res, pool =>
    pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Releases WHERE ReleaseID=@id; SELECT @@ROWCOUNT AS rowsAffected')
  );
});

/* ----------------- SHORT EXPIRY ----------------- */
app.get('/shortexpiry', async (req, res) => {
  await runQuery(res, pool =>
    pool.request()
      .query('SELECT ReleaseID AS ShortID, ProductID, DrugName, ExpiryDate FROM vShortExpiry ORDER BY ExpiryDate')
  );
});


/* ----------------- USERS ----------------- */
app.get('/users', async (req, res) => {
  await runQuery(res, pool =>
    pool.request().query('SELECT UserID, Name, Email, Role FROM Users ORDER BY UserID')
  );
});

app.post('/users', async (req, res) => {
  const { Name, Email, Role } = req.body;
  if (!Name || !Email || !Role) return res.status(400).json({ error: 'Name, Email, Role required' });

  await runQuery(res, pool =>
    pool.request()
      .input('Name', sql.NVarChar(100), Name)
      .input('Email', sql.NVarChar(100), Email)
      .input('Role', sql.NVarChar(50), Role)
      .query('INSERT INTO Users (Name, Email, Role) VALUES (@Name, @Email, @Role); SELECT SCOPE_IDENTITY() AS UserID')
  );
});

app.put('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { Name, Email, Role } = req.body;

  await runQuery(res, pool =>
    pool.request()
      .input('id', sql.Int, id)
      .input('Name', sql.NVarChar(100), Name)
      .input('Email', sql.NVarChar(100), Email)
      .input('Role', sql.NVarChar(50), Role)
      .query('UPDATE Users SET Name=@Name, Email=@Email, Role=@Role WHERE UserID=@id; SELECT @@ROWCOUNT AS rowsAffected')
  );
});

app.delete('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await runQuery(res, pool =>
    pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Users WHERE UserID=@id; SELECT @@ROWCOUNT AS rowsAffected')
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
        (SELECT COUNT(*) FROM vShortExpiry) AS shortExpiry,
        (SELECT COUNT(*) FROM Users) AS totalUsers
    `);

    res.json(result.recordset[0]); // ✅ send only the first row, not an array
  } catch (err) {
    console.error("Error fetching summary:", err);
    res.status(500).send("Failed to fetch summary");
  }
});

/* ----------------- ROOT ----------------- */
app.get('/', (req, res) => res.send('Inventory backend is running'));

/* ----------------- START SERVER ----------------- */
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
