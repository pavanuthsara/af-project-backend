const express = require('express');
const router = express.Router();

const WasteCategoryController = require('../controllers/WasteCategoryController');
const authMiddleware = require('../middleware/AuthMiddleware');
const authorize = require('../middleware/authorize');

const categoryController = new WasteCategoryController();


router.post(
  '/',
  authMiddleware,
  authorize('admin'),
  categoryController.createCategory
);


router.get('/', categoryController.getCategories);

router.get('/:id', categoryController.getCategoryById);

router.put(
  '/:id',
  authMiddleware,
  authorize('admin'),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  authMiddleware,
  authorize('admin'),
  categoryController.deleteCategory
);

module.exports = router;
