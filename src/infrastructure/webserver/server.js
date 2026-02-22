const express = require('express');
const connectToDatabase = require('../database/mongoose');
const SignUpController = require('../../interface_adapters/controllers/SignUpController');
const LoginController = require('../../interface_adapters/controllers/LoginController');
const AdminLoginController = require('../../interface_adapters/controllers/AdminLoginController');
const RegisterAdminController = require('../../interface_adapters/controllers/RegisterAdminController');
const RegisterRecyclingCenterController = require('../../interface_adapters/controllers/RegisterRecyclingCenterController');
const DeleteRecyclingCenterController = require('../../interface_adapters/controllers/DeleteRecyclingCenterController');
const authMiddleware = require('../../interface_adapters/middleware/AuthMiddleware');
const adminAuthMiddleware = require('../../interface_adapters/middleware/AdminAuthMiddleware');

// Load environment variables
require('dotenv').config();

const app = express();
app.use(express.json());

// Instantiate Controllers
const signUpController = new SignUpController();
const loginController = new LoginController();
const adminLoginController = new AdminLoginController();
const registerAdminController = new RegisterAdminController();
const registerRecyclingCenterController = new RegisterRecyclingCenterController();
const deleteRecyclingCenterController = new DeleteRecyclingCenterController();

// --- PUBLIC ROUTES ---
app.post('/signup', (req, res) => signUpController.handle(req, res));
app.post('/login', (req, res) => loginController.handle(req, res));
app.post('/admin/login', (req, res) => adminLoginController.handle(req, res));

// --- ADMIN PROTECTED ROUTES ---
app.post('/admin/register', adminAuthMiddleware, (req, res) => registerAdminController.handle(req, res));
app.post('/admin/recycling-centers', adminAuthMiddleware, (req, res) => registerRecyclingCenterController.handle(req, res));
app.delete('/admin/recycling-centers/:id', adminAuthMiddleware, (req, res) => deleteRecyclingCenterController.handle(req, res));

// 404 HANDLER - (Must be after all valid routes)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// GLOBAL ERROR HANDLER (Must be the very last middleware)
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ success: false, error: error.message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }
  if (error.code === 11000) {
    return res.status(400).json({ success: false, error: 'Duplicate key error - resource already exists' });
  }
  
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Internal Server Error'
  });
});

// ASYNC STARTUP SEQUENCE 
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Ensure DB connects BEFORE opening the port
    await connectToDatabase(); 
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    // Exit with failure code so hosting environments know it crashed
    process.exit(1); 
  }
};

startServer();
