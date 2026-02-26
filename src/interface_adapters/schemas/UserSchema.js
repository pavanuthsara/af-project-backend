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
  ecoPoints: { type: Number, default: 0 },
  badges: [{
    title: { type: String, required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    earnedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('User', UserSchema);