import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true },
  otp: { type: String },
  otpExpiresAt: { type: Date },
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please fill a valid phone number']
  },
  image: {
    type: String,
    default: null
  },
  location: {
    city: {
      type: String,
      trim: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: null,
      index: '2dsphere'
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add text index for search
userSchema.index({ 
  name: 'text', 
  email: 'text', 
  'location.city': 'text' 
});

export const User = mongoose.model('User', userSchema);