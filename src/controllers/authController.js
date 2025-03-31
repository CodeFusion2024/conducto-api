import { User } from "../models/user.js";
import { sendOTP } from "../utils/emailService.js";
import otpGenerator from "otp-generator";
import bcrypt from "bcrypt";
import cloudinary from 'cloudinary';
import multer from 'multer';
import path from 'path';


// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed (jpeg, jpg, png, gif)'));
    }
  }
}).single('image');

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

    return res.json({ message: "OTP verified successfully", email: user.email , UserId : user._id});
  } catch (error) {
    console.error("❌ OTP Verification Error:", error);
    return res.status(500).json({ message: "Error verifying OTP" });
  }
};

// Store/Update Profile Data
export const storeProfileData = async (req, res) => {
  const { userId } = req.params;
  const { name, phone, city, latitude, longitude } = req.body;

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

    let imageUrl = user.image;
    if (req.file) {
      // Upload new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'user-profiles',
        width: 500,
        height: 500,
        crop: 'fill'
      });
      imageUrl = result.secure_url;

      // Delete old image if exists
      if (user.image) {
        const publicId = user.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`user-profiles/${publicId}`);
      }
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
    user.image = imageUrl;

    await user.save();

    // Clean up uploaded file
    if (req.file) {
      const fs = await import('fs');
      fs.unlinkSync(req.file.path);
    }

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
