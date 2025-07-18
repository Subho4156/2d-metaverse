const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendOTPEmail = require("../utils/mailer")

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ email });

    // Case 1: Email exists and is verified → Block signup
    if (existing && existing.verified) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Case 2: Username is taken by any user → Block signup
    const existingUsername = await User.findOne({ username });
    if (existingUsername && (!existing || existing.username !== username)) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Case 3: Unverified user exists → check cooldown
    const now = Date.now();
    if (existing) {
      if (existing.otpRequestedAt && now - existing.otpRequestedAt.getTime() < 10 * 60 * 1000) {
        const minutesLeft = Math.ceil((10 * 60 * 1000 - (now - existing.otpRequestedAt.getTime())) / 60000);
        return res.status(429).json({ message: `Please wait ${minutesLeft} more minute(s) before requesting another OTP.` });
      }

      // Update OTP details for unverified user
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      existing.otp = otp;
      existing.otpExpiry = Date.now() + 10 * 60 * 1000;
      existing.otpRequestedAt = new Date();
      existing.password = await bcrypt.hash(password, 10);
      await existing.save();

      try {
        await sendOTPEmail(email, otp);
      } catch (err) {
        console.error("Failed to send OTP email:", err.message);
      }

      return res.status(200).json({ message: "OTP resent to existing unverified user." });
    }

    // Case 4: New user signup
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000;
    const otpRequestedAt = new Date();

    const user = new User({ username, email, password: hashedPassword, otp, otpExpiry, otpRequestedAt });
    await user.save();

    try {
      await sendOTPEmail(email, otp);
    } catch (err) {
      console.error("Failed to send OTP email:", err.message);
    }

    return res.status(201).json({ message: "User created and OTP sent." });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.verified) {
  return res.status(403).json({ message: "Please verify your email to login." });
}

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({ token, user: { id: user._id, username: user.username, avatarName: user.avatarName } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.verified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.otpRequestedAt = null;
    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

