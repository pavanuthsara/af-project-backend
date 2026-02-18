const express = require('express');
const connectToDatabase = require('../database/mongoose');
const SignUpController = require('../../interface_adapters/controllers/SignUpController');
const LoginController = require('../../interface_adapters/controllers/LoginController');
const AdminLoginController = require('../../interface_adapters/controllers/AdminLoginController');
const RegisterAdminController = require('../../interface_adapters/controllers/RegisterAdminController');
const RegisterTruckController = require('../../interface_adapters/controllers/RegisterTruckController');
const RegisterDriverController = require('../../interface_adapters/controllers/RegisterDriverController');
const AssignDriverToTruckController = require('../../interface_adapters/controllers/AssignDriverToTruckController');
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
const registerTruckController = new RegisterTruckController();
const registerDriverController = new RegisterDriverController();
const assignDriverToTruckController = new AssignDriverToTruckController();

// --- PUBLIC ROUTES ---
app.post('/signup', (req, res) => signUpController.handle(req, res));
app.post('/login', (req, res) => loginController.handle(req, res));
app.post('/admin/login', (req, res) => adminLoginController.handle(req, res));

// --- ADMIN PROTECTED ROUTES ---
app.post('/admin/register', adminAuthMiddleware, (req, res) => registerAdminController.handle(req, res));
app.post('/admin/trucks', adminAuthMiddleware, (req, res) => registerTruckController.handle(req, res));
app.post('/admin/drivers', adminAuthMiddleware, (req, res) => registerDriverController.handle(req, res));
app.post('/admin/trucks/assign-driver', adminAuthMiddleware, (req, res) => assignDriverToTruckController.handle(req, res));

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();