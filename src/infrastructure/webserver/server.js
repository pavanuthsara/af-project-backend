const express = require('express');
const connectToDatabase = require('../database/mongoose');
const SignUpController = require('../../interface_adapters/controllers/SignUpController');
const LoginController = require('../../interface_adapters/controllers/LoginController');
const AdminLoginController = require('../../interface_adapters/controllers/AdminLoginController');
const RegisterAdminController = require('../../interface_adapters/controllers/RegisterAdminController');
const authMiddleware = require('../../interface_adapters/middleware/AuthMiddleware');
const adminAuthMiddleware = require('../../interface_adapters/middleware/AdminAuthMiddleware');

// Import waste management routes
const categoryRoutes = require('../../interface_adapters/routes/categoryRoutes');
const itemRoutes = require('../../interface_adapters/routes/itemRoutes');

// Load environment variables
require('dotenv').config();

const app = express();
app.use(express.json());

// Instantiate Controllers
const signUpController = new SignUpController();
const loginController = new LoginController();
const adminLoginController = new AdminLoginController();
const registerAdminController = new RegisterAdminController();

// --- PUBLIC ROUTES ---
app.post('/signup', (req, res) => signUpController.handle(req, res));
app.post('/login', (req, res) => loginController.handle(req, res));
app.post('/admin/login', (req, res) => adminLoginController.handle(req, res));

// --- ADMIN PROTECTED ROUTES ---
app.post('/admin/register', adminAuthMiddleware, (req, res) => registerAdminController.handle(req, res));

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
