const express = require('express');
const connectToDatabase = require('../database/mongoose');
const SignUpController = require('../../interface_adapters/controllers/SignUpController');
const LoginController = require('../../interface_adapters/controllers/LoginController');
const AdminLoginController = require('../../interface_adapters/controllers/AdminLoginController');
const RegisterAdminController = require('../../interface_adapters/controllers/RegisterAdminController');
const RegisterRecyclingCenterController = require('../../interface_adapters/controllers/RegisterRecyclingCenterController');
const DeleteRecyclingCenterController = require('../../interface_adapters/controllers/DeleteRecyclingCenterController');
const CreateDisposalController = require('../../interface_adapters/controllers/disposal/CreateDisposalController');
const GetDisposalHistoryController = require('../../interface_adapters/controllers/disposal/GetDisposalHistoryController');
const GetDisposalStatsController = require('../../interface_adapters/controllers/disposal/GetDisposalStatsController');
const GetUserWasteStatsController = require('../../interface_adapters/controllers/disposal/GetUserWasteStatsController');
const UpdateDisposalController = require('../../interface_adapters/controllers/disposal/UpdateDisposalController');
const DeleteDisposalController = require('../../interface_adapters/controllers/disposal/DeleteDisposalController');
const UpdateRecyclingCenterController = require('../../interface_adapters/controllers/UpdateRecyclingCenterController');
const ViewRecyclingCentersController = require('../../interface_adapters/controllers/ViewRecyclingCentersController');
const SearchRecyclingCentersController = require('../../interface_adapters/controllers/SearchRecyclingCentersController');
const GetRecyclingCentersByWasteTypeController = require('../../interface_adapters/controllers/GetRecyclingCentersByWasteTypeController');
const GetRecyclingCenterByIdController = require('../../interface_adapters/controllers/GetRecyclingCenterByIdController');
const authMiddleware = require('../../interface_adapters/middleware/AuthMiddleware');
const adminAuthMiddleware = require('../../interface_adapters/middleware/AdminAuthMiddleware');

// Import waste management routes
const categoryRoutes = require('../../interface_adapters/routes/categoryRoutes');
const itemRoutes = require('../../interface_adapters/routes/itemRoutes');
const managerAuthMiddleware = require('../../interface_adapters/middleware/ManagerAuthMiddleware');

// Import quiz module routes
const quizRoutes = require('../../interface_adapters/routes/quizRoutes');

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
const createDisposalController = new CreateDisposalController();
const getDisposalHistoryController = new GetDisposalHistoryController();
const getDisposalStatsController = new GetDisposalStatsController();
const getUserWasteStatsController = new GetUserWasteStatsController();
const updateDisposalController = new UpdateDisposalController();
const deleteDisposalController = new DeleteDisposalController();
const updateRecyclingCenterController = new UpdateRecyclingCenterController();
const viewRecyclingCentersController = new ViewRecyclingCentersController();
const searchRecyclingCentersController = new SearchRecyclingCentersController();
const getRecyclingCentersByWasteTypeController = new GetRecyclingCentersByWasteTypeController();
const getRecyclingCenterByIdController = new GetRecyclingCenterByIdController();

// --- PUBLIC ROUTES ---
app.post('/signup', (req, res) => signUpController.handle(req, res));
app.post('/login', (req, res) => loginController.handle(req, res));
app.post('/admin/login', (req, res) => adminLoginController.handle(req, res));

// --- PROTECTED COMMON ROUTES ---
app.get('/profile', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

app.post('/logout', (req, res) => {
  // In a stateless JWT system, "logging out" is primarily a client-side action (deleting the token).
  // This endpoint serves as a standard way for the client to signal it's finished.
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear your local token.'
  });
});

// --- ADMIN PROTECTED ROUTES ---
app.post('/admin/register', adminAuthMiddleware, (req, res) => registerAdminController.handle(req, res));
app.post('/admin/recycling-centers', adminAuthMiddleware, (req, res) => registerRecyclingCenterController.handle(req, res));
app.delete('/admin/recycling-centers/:id', adminAuthMiddleware, (req, res) => deleteRecyclingCenterController.handle(req, res));

// --- USER PROTECTED ROUTES ---
app.get('/recycling-centers', authMiddleware, (req, res) => viewRecyclingCentersController.handle(req, res));
app.get('/recycling-centers/by-waste/:wasteType', authMiddleware, (req, res) => getRecyclingCentersByWasteTypeController.handle(req, res));
app.get('/recycling-centers/:id', authMiddleware, (req, res) => getRecyclingCenterByIdController.handle(req, res));
app.post('/recycling-centers/search', authMiddleware, (req, res) => searchRecyclingCentersController.handle(req, res));

// --- MANAGER PROTECTED ROUTES ---
app.put('/manager/recycling-centers/:id', managerAuthMiddleware, (req, res) => updateRecyclingCenterController.handle(req, res));
app.get('/admin/disposal/stats', adminAuthMiddleware, (req, res) => getDisposalStatsController.handle(req, res));

// --- CITIZEN PROTECTED ROUTES (Disposal Logs) ---
app.post('/disposal', authMiddleware, (req, res) => createDisposalController.handle(req, res));
app.get('/disposal/history', authMiddleware, (req, res) => getDisposalHistoryController.handle(req, res));
app.get('/disposal/stats', authMiddleware, (req, res) => getUserWasteStatsController.handle(req, res));
app.put('/disposal/:id', authMiddleware, (req, res) => updateDisposalController.handle(req, res));
app.delete('/disposal/:id', authMiddleware, (req, res) => deleteDisposalController.handle(req, res));

// --- WASTE MANAGEMENT ROUTES ---
app.use('/api/categories', categoryRoutes);
app.use('/api/items', itemRoutes);

// --- WASTE MANAGEMENT ROUTES ---
app.use('/categories', categoryRoutes);
app.use('/items', itemRoutes);

// --- QUIZ MODULE ROUTES ---
app.use('/api/quizzes', quizRoutes);

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
module.exports = app;
