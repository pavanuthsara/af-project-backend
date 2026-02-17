const express = require('express');
const router = express.Router();

const WasteItemController = require('../controllers/WasteItemController');
const authMiddleware = require('../middleware/AuthMiddleware');
const authorize = require('../middleware/authorize');

// Instantiate controller
const itemController = new WasteItemController();

// ============================================
// WASTE ITEM ROUTES
// ============================================

/**
 * @route   POST /api/items
 * @desc    Create a new waste item
 * @access  Admin only (requires authentication + admin role)
 */
router.post(
  '/',
  authMiddleware,
  authorize('admin'),
  itemController.createWasteItem
);

/**
 * @route   GET /api/items
 * @desc    Get all waste items with pagination, filtering, and search
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 * @query   search - Search term for item name (case-insensitive)
 * @query   category - Filter by category ID
 * @query   recyclable - Filter by recyclable status (true/false)
 * @query   hazardous - Filter by hazardous status (true/false)
 * @query   compostable - Filter by compostable status (true/false)
 * @access  Public
 */
router.get('/', itemController.getWasteItems);

/**
 * @route   GET /api/items/:id
 * @desc    Get a single waste item by ID
 * @access  Public
 */
router.get('/:id', itemController.getWasteItemById);

/**
 * @route   PUT /api/items/:id
 * @desc    Update a waste item by ID
 * @access  Admin only (requires authentication + admin role)
 */
router.put(
  '/:id',
  authMiddleware,
  authorize('admin'),
  itemController.updateWasteItem
);

/**
 * @route   DELETE /api/items/:id
 * @desc    Delete a waste item by ID
 * @access  Admin only (requires authentication + admin role)
 */
router.delete(
  '/:id',
  authMiddleware,
  authorize('admin'),
  itemController.deleteWasteItem
);

module.exports = router;