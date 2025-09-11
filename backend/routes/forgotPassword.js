const express = require("express");
const router = express.Router();

// No need for SendGrid, tokens, or DB updates
router.post("/", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    // Just acknowledge and tell user to contact admin
    res.json({
      message: `Please contact the admin at madhavi.lakmini2000@gmail.com to reset your password.`,
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
