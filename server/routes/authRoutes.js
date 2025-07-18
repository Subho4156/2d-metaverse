const express = require("express");
const router = express.Router();
const { signup, login, verifyOTP } = require("../controllers/authcontroller");
const User = require("../models/User");
const authMiddleware = require("../middleware/authmiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);

router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("username email");
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

module.exports = router;
