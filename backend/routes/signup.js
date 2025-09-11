const express = require("express");
const bcrypt = require("bcryptjs");
const { poolPromise, sql } = require("../db");

const router = express.Router();

// Create new account or update existing account
router.post("/", async (req, res) => {
  const { officialId, fullName, initials, email, username, password, confirmPassword } = req.body;

  if (!officialId || !fullName || !initials || !email || !username || !password)
    return res.status(400).json({ message: "All fields are required" });

  if (password !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  try {
    const pool = await poolPromise;

    // Check if username or email already exists
    const exists = await pool
      .request()
      .input("Username", sql.VarChar(50), username)
      .input("Email", sql.NVarChar(100), email)
      .query(`
        SELECT COUNT(*) AS count FROM Accounts 
        WHERE Username=@Username OR Email=@Email
      `);

    if (exists.recordset[0].count > 0)
      return res.status(400).json({ message: "Username or Email already taken" });

    // Hash the password
    const hash = await bcrypt.hash(password, 10);

    const result = await pool
      .request()
      .input("OfficialID", sql.VarChar(50), officialId)
      .input("FullName", sql.NVarChar(100), fullName)
      .input("NameWithInitials", sql.NVarChar(50), initials)
      .input("Email", sql.NVarChar(100), email)
      .input("Username", sql.VarChar(50), username)
      .input("Password", sql.NVarChar(255), hash)
      .input("ForgetPassword", sql.NVarChar(255), hash)
      .query(`
        INSERT INTO Accounts (OfficialID, FullName, NameWithInitials, Email, Username, Password)
        VALUES (@OfficialID, @FullName, @NameWithInitials, @Email, @Username, @Password, @ForgetPassword);
        SELECT SCOPE_IDENTITY() AS AccountID
      `);

    res.json({ message: "Account created", userId: result.recordset[0].AccountID });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Optional: Update account (PUT /signup/:id)
router.put("/:id", async (req, res) => {
  const { officialId, fullName, initials, email, username, password } = req.body;
  const accountId = req.params.id;

  if (!officialId || !fullName || !initials || !email || !username)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const pool = await poolPromise;

    let hashQuery = "";
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      hashQuery = `, Password='${hash}'`;
    }

    await pool
      .request()
      .input("OfficialID", sql.VarChar(50), officialId)
      .input("FullName", sql.NVarChar(100), fullName)
      .input("NameWithInitials", sql.NVarChar(50), initials)
      .input("Email", sql.NVarChar(100), email)
      .input("Username", sql.VarChar(50), username)
      .input("AccountID", sql.Int, accountId)
      .query(`
        UPDATE Accounts 
        SET OfficialID=@OfficialID, FullName=@FullName, NameWithInitials=@NameWithInitials, 
            Email=@Email, Username=@Username ${hashQuery}
        WHERE AccountID=@AccountID
      `);

    res.json({ message: "Account updated" });
  } catch (err) {
    console.error("Update account error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
