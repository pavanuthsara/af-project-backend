const mongoose = require('mongoose');

/**
 * User Schema
 * Represents a user in the system.
 * The 'role' field is used for authorization (admin access for waste management).
 */
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
});

module.exports = mongoose.model('User', UserSchema);