import express from "express";
import database from "../database.js";
import twilio from "twilio";

const router = express.Router();


const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const formatPhone = (phone) => {
  if (!phone) return phone;
  const p = String(phone).trim();
  if (p.startsWith("0")) {
    return "+84" + p.slice(1);
  }
  if (!p.startsWith("+")) {
    return "+" + p;
  }
  return p;
};


router.get("/", (req, res) => {
  res.send("Backend OK");
});

// 📩 Gửi OTP
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;

  try {
    const response = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({
        to: formatPhone(phone),
        channel: "sms",
      });

    res.json({ success: true, status: response.status });
  } catch (err) {
    console.error("TWILIO ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { phone, code } = req.body;

  try {
    const response = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({
        to: formatPhone(phone),
        code: code,
      });

    res.json({ success: response.status === "approved" });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
export default router;