const express = require('express');
const connectToDatabase = require('../database/mongoose');
const SignUpController = require('../../interface_adapters/controllers/SignUpController');
const LoginController = require('../../interface_adapters/controllers/LoginController');
const authMiddleware = require('../../interface_adapters/middleware/AuthMiddleware');

// Load environment variables
require('dotenv').config();

const app = express();
app.use(express.json());

// Connect DB
connectToDatabase();

// Instantiate Controllers
const signUpController = new SignUpController();
const loginController = new LoginController();

// --- PUBLIC ROUTES ---
app.post('/signup', (req, res) => signUpController.handle(req, res));
app.post('/login', (req, res) => loginController.handle(req, res));

// --- PROTECTED ROUTES ---
// We add 'authMiddleware' before the handler
app.get('/profile', authMiddleware, (req, res) => {
  // If we get here, the user is authenticated!
  // req.user contains the data we put in the token ({ id, email })
  res.json({ 
    message: 'This is a protected route', 
    user: req.user 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});