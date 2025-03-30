import { User } from "../models/user.js";
import { sendOTP } from "../utils/emailService.js";
import otpGenerator from "otp-generator";
import bcrypt from "bcrypt";

// Request OTP
export const requestOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    // Generate a 6-digit numeric OTP
    const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

    // Hash OTP before storing (for security)
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create a new user with email (email is stored permanently)
      user = new User({ email: email.toLowerCase(), otp: hashedOTP, otpExpiresAt: expiresAt });
    } else {
      // Update OTP fields
      user.otp = hashedOTP;
      user.otpExpiresAt = expiresAt;
    }

    await user.save();

    // Send OTP via email
    const emailSent = await sendOTP(email, otp);
    if (!emailSent) throw new Error("Failed to send OTP");

    return res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("❌ OTP Request Error:", error);
    return res.status(500).json({ message: "Error generating OTP" });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.otp || !user.otpExpiresAt) {
      return res.status(400).json({ message: "OTP expired or not requested" });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Clear OTP after successful verification
    user.otp = null;
    user.otpExpiresAt = null;

    // Ensure email is permanently stored (already handled during OTP request)
    await user.save();

    return res.json({ message: "OTP verified successfully", email: user.email });
  } catch (error) {
    console.error("❌ OTP Verification Error:", error);
    return res.status(500).json({ message: "Error verifying OTP" });
  }
};
