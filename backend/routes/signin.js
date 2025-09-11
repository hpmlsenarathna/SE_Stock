const express = require("express");
const bcrypt = require("bcryptjs");
const { poolPromise, sql } = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Username and password required" });

  try {
    const pool = await poolPromise;

    const user = await pool
      .request()
      .input("Username", sql.VarChar(50), username)
      .query("SELECT AccountID, Username, Password FROM Accounts WHERE Username=@Username");

    if (user.recordset.length === 0)
      return res.status(400).json({ message: "Invalid username or password" });

    const valid = await bcrypt.compare(password, user.recordset[0].Password);
    if (!valid)
      return res.status(400).json({ message: "Invalid username or password" });

    res.json({ message: "Login successful", userId: user.recordset[0].AccountID });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
