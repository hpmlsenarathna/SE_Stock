const express = require('express');
const cors = require('cors');
const { poolPromise, sql } = require('./db'); 
const bcrypt = require('bcryptjs');
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
  await runQuery(res, pool => pool.request().query('SELECT ProductID, DrugName FROM Products ORDER BY ProductID'));
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
  if (!ProductID || !ExpiryDate) return res.status(400).json({ error: 'ProductID and ExpiryDate are required' });

  try {
    const pool = await poolPromise;

    const productCheck = await pool.request()
      .input('ProductID', sql.Int, ProductID)
      .query('SELECT COUNT(*) as count FROM Products WHERE ProductID=@ProductID');

    if (productCheck.recordset[0].count === 0)
      return res.status(400).json({ error: `Product with ID ${ProductID} not found.` });

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

  await runQuery(res, async pool => {
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('ProductID', sql.Int, ProductID)
      .input('DrugName', sql.NVarChar(100), DrugName ?? '')
      .input('ReleaseDate', sql.Date, ReleaseDate || null)
      .input('ExpiryDate', sql.Date, ExpiryDate || null)
      .query('UPDATE Releases SET ProductID=@ProductID, DrugName=@DrugName, ReleaseDate=@ReleaseDate, ExpiryDate=@ExpiryDate WHERE ReleaseID=@id; SELECT @@ROWCOUNT AS rowsAffected');

    return result;
  });
});

app.delete('/release/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await runQuery(res, pool =>
    pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Releases WHERE ReleaseID=@id; SELECT @@ROWCOUNT AS rowsAffected')
  );
});

/* ----------------- USERS ----------------- */
// GET all users
app.get('/users', async (req, res) => {
  await runQuery(res, pool =>
    pool.request().query(`
      SELECT UserID, FullName, NameWithInitials, NIC, Telephone, Username
      FROM Users
      ORDER BY UserID
    `)
  );
});

// POST a new user
app.post('/users', async (req, res) => {
  const { FullName, NameWithInitials, NIC, Telephone, Username, Password, ConfirmedPassword } = req.body;

  if (!FullName || !NameWithInitials || !NIC || !Username || !Password || !ConfirmedPassword)
    return res.status(400).json({ error: 'Missing required fields' });

  if (Password !== ConfirmedPassword)
    return res.status(400).json({ error: "Passwords do not match" });

  await runQuery(res, async pool => {
    const hash = await bcrypt.hash(Password, 10);

    await pool.request()
      .input('FullName', sql.NVarChar(100), FullName)
      .input('NameWithInitials', sql.NVarChar(50), NameWithInitials)
      .input('NIC', sql.VarChar(20), NIC)
      .input('Telephone', sql.VarChar(15), Telephone ?? '')
      .input('Username', sql.VarChar(50), Username)
      .input('Password', sql.NVarChar(255), hash)
      .query(`
        INSERT INTO Users (FullName, NameWithInitials, NIC, Telephone, Username, Password)
        VALUES (@FullName, @NameWithInitials, @NIC, @Telephone, @Username, @Password);
        SELECT SCOPE_IDENTITY() AS UserID
      `);
  });
});

// PUT /users/:id
app.put('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { FullName, NameWithInitials, NIC, Telephone, Username, Password, ConfirmedPassword } = req.body;

  if (Password && Password !== ConfirmedPassword)
    return res.status(400).json({ error: "Passwords do not match" });

  await runQuery(res, async pool => {
    let query = `
      UPDATE Users
      SET FullName=@FullName, NameWithInitials=@NameWithInitials,
          NIC=@NIC, Telephone=@Telephone, Username=@Username
    `;

    if (Password) {
      const hash = await bcrypt.hash(Password, 10);
      query += `, Password=@Password`;
      await pool.request().input('Password', sql.NVarChar(255), hash);
    }

    query += ` WHERE UserID=@id; SELECT @@ROWCOUNT AS rowsAffected`;

    await pool.request()
      .input('id', sql.Int, id)
      .input('FullName', sql.NVarChar(100), FullName)
      .input('NameWithInitials', sql.NVarChar(50), NameWithInitials)
      .input('NIC', sql.VarChar(20), NIC)
      .input('Telephone', sql.VarChar(15), Telephone ?? '')
      .input('Username', sql.VarChar(50), Username)
      .query(query);
  });
});

// DELETE user
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
    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error fetching summary:", err);
    res.status(500).send("Failed to fetch summary");
  }
});

/* ----------------- ROOT ----------------- */
app.get('/', (req, res) => res.send('Inventory backend is running'));

/* ----------------- START SERVER ----------------- */
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
