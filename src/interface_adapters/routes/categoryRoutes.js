const express = require('express');
const router = express.Router();

const WasteCategoryController = require('../controllers/WasteCategoryController');
const authMiddleware = require('../middleware/AuthMiddleware');
const authorize = require('../middleware/authorize');

// Instantiate controller
const categoryController = new WasteCategoryController();

// ============================================
// CATEGORY ROUTES
// ============================================

/**
 * @route   POST /api/categories
 * @desc    Create a new waste category
 * @access  Admin only (requires authentication + admin role)
 */
router.post(
  '/',
  authMiddleware,
  authorize('admin'),
  categoryController.createCategory
);

/**
 * @route   GET /api/categories
 * @desc    Get all categories with pagination
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 * @access  Public
 */
router.get('/', categoryController.getCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Get a single category by ID
 * @access  Public
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category by ID
 * @access  Admin only (requires authentication + admin role)
 */
router.put(
  '/:id',
  authMiddleware,
  authorize('admin'),
  categoryController.updateCategory
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category by ID (also deletes associated items)
 * @access  Admin only (requires authentication + admin role)
 */
router.delete(
  '/:id',
  authMiddleware,
  authorize('admin'),
  categoryController.deleteCategory
);

module.exports = router;