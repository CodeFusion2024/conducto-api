import { User } from "../models/user.js";
import { sendOTP } from "../utils/emailService.js";
import otpGenerator from "otp-generator";
import bcrypt from "bcrypt";
import cloudinary from 'cloudinary';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';




// // Request OTP
// export const requestOTP = async (req, res) => {
//   const { email } = req.body;
//   console.log("Requesting OTP for:", email); // Debug

//   try {
//     const otp = otpGenerator.generate(6, { digits: true });
//     const hashedOTP = await bcrypt.hash(otp, 10);
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     let user = await User.findOne({ email: email.toLowerCase() });
//     console.log("User before OTP save:", user); // Debug

//     if (!user) {
//       user = new User({ email, otp: hashedOTP, otpExpiresAt: expiresAt });
//     } else {
//       user.otp = hashedOTP;
//       user.otpExpiresAt = expiresAt;
//     }

//     await user.save();
//     console.log("User after OTP save:", user); // Debug

//     await sendOTP(email, otp);
//     res.json({ success: true, message: "OTP sent successfully" });
//   } catch (error) {
//     console.error("❌ OTP Request Error:", error);
//     res.status(500).json({ success: false, message: "Error generating OTP" });
//   }
// };

// // Verify OTP
// export const verifyOTP = async (req, res) => {
//   const { email, otp } = req.body;

//   if (!email || !otp) {
//     return res.status(400).json({ 
//       success: false,
//       message: "Email and OTP are required" 
//     });
//   }

//   try {
//     const user = await User.findOne({ email: email.toLowerCase() });
//     console.log("User Found:", user); // Debug

//     if (!user || !user.otp || !user.otpExpiresAt) {
//       return res.status(400).json({ 
//         success: false,
//         message: "OTP expired or not requested" 
//       });
//     }

//     console.log(
//       "Current Time:", new Date(),
//       "OTP Expires At:", user.otpExpiresAt
//     );

//     if (new Date() > user.otpExpiresAt) {
//       return res.status(400).json({ 
//         success: false,
//         message: "OTP expired" 
//       });
//     }

//     const isMatch = await bcrypt.compare(otp, user.otp);
//     console.log("OTP Match Result:", isMatch); // Debug

//     if (!isMatch) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Invalid OTP" 
//       });
//     }

//     // Clear OTP after successful verification
//     user.otp = undefined;
//     user.otpExpiresAt = undefined;
//     await user.save();

//     return res.json({ 
//       success: true,
//       message: "OTP verified successfully",
//       data: { email: user.email, userId: user._id }
//     });
//   } catch (error) {
//     console.error("❌ OTP Verification Error:", error);
//     return res.status(500).json({ 
//       success: false,
//       message: "Error verifying OTP" 
//     });
//   }
// };





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

    return res.json({ message: "OTP verified successfully", email: user.email , UserId : user._id});
  } catch (error) {
    console.error("❌ OTP Verification Error:", error);
    return res.status(500).json({ message: "Error verifying OTP" });
  }
};



///////////////////////////////////upload  data parts 





// Store/Update Profile Data
// Store/Update Profile Data (Raw JSON)
export const storeProfileData = async (req, res) => {
  const { userId } = req.params;
  const { name, phone, city, latitude, longitude, imageUrl } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required"
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update user data
    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.location = {
      city: city || user.location?.city,
      coordinates: (latitude && longitude) ? 
        [parseFloat(longitude), parseFloat(latitude)] : 
        user.location?.coordinates
    };

    // Update image URL if provided
    if (imageUrl) {
      user.image = imageUrl;
    }

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.location?.city,
        coordinates: user.location?.coordinates,
        image: user.image
      }
    });
  } catch (error) {
    console.error("❌ Profile Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating profile"
    });
  }
};


// Get Profile Data
export const getProfileData = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ 
      success: false,
      message: "User ID is required" 
    });
  }

  try {
    const user = await User.findById(userId)
      .select('-otp -otpExpiresAt -__v -createdAt -updatedAt');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    return res.json({ 
      success: true,
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.location?.city,
        coordinates: user.location?.coordinates,
        image: user.image
      }
    });
  } catch (error) {
    console.error("❌ Get Profile Error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error fetching profile" 
    });
  }
};