const mongoose = require('mongoose');

/**
 * User Schema
 * Represents a user in the system.
 * The 'role' field is used for authorization (admin access for waste management).
 */
const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'] 
  },
  // Role-based access control: 'user' or 'admin'
  // Admin users can create, update, and delete waste categories and items
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);