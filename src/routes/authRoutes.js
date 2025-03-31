import express from 'express';
import { 
  requestOTP, 
  verifyOTP, 
  storeProfileData, 
  getProfileData,
  upload 
} from '../controllers/authController.js';

const router = express.Router();

// OTP Routes
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);

// Profile Routes
router.put('/profile/:userId', upload, storeProfileData);
router.get('/profile/:userId', getProfileData);

export default router;