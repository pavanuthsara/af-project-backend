const express = require('express');
const connectToDatabase = require('../database/mongoose');
const SignUpController = require('../../interface_adapters/controllers/SignUpController');
const LoginController = require('../../interface_adapters/controllers/LoginController');
const authMiddleware = require('../../interface_adapters/middleware/AuthMiddleware');

// Import waste management routes
const categoryRoutes = require('../../interface_adapters/routes/categoryRoutes');
const itemRoutes = require('../../interface_adapters/routes/itemRoutes');

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

// --- WASTE MANAGEMENT ROUTES ---
// Category routes: /api/categories
app.use('/api/categories', categoryRoutes);

// Waste Item routes: /api/items
app.use('/api/items', itemRoutes);

// --- ERROR HANDLING MIDDLEWARE ---
// Global error handler - catches all errors passed via next(error)
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  
  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  // Handle Mongoose CastError (invalid ObjectId)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }
  
  // Handle duplicate key errors
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicate key error - resource already exists'
    });
  }
  
  // Use custom status code if set, otherwise default to 500
  const statusCode = error.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Internal Server Error'
  });
});

// --- 404 HANDLER ---
// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});