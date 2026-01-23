const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded ✅" : "Not Loaded ❌");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ temporary OTP storage (for demo)
let otpStore = {};

// ✅ Create mail transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// ✅ Route: Send OTP
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email required" });

    // ✅ generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ store OTP (valid for 5 mins)
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    // ✅ send OTP mail
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. Valid for 5 minutes.`,
    });

    res.json({ message: "OTP sent successfully!" });
  } catch (err) {
  console.error("EMAIL ERROR FULL:", err);
  return res.status(500).json({
    message: "Failed to send OTP",
    error: err.message,
    code: err.code,
    response: err.response,
  });
}
});

// ✅ Route: Verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP required" });
  }

  const storedData = otpStore[email];

  if (!storedData) return res.status(400).json({ message: "OTP not found" });

  if (Date.now() > storedData.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ message: "OTP expired" });
  }

  if (storedData.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // ✅ OTP success
  delete otpStore[email];
  res.json({ message: "OTP Verified ✅" });
});

// ✅ Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
