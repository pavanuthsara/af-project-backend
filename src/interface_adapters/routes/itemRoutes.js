const express = require('express');
const router = express.Router();

const WasteItemController = require('../controllers/WasteItemController');
const authMiddleware = require('../middleware/AuthMiddleware');
const authorize = require('../middleware/authorize');

const itemController = new WasteItemController();

router.post(
  '/',
  authMiddleware,
  authorize('admin'),
  itemController.createWasteItem
);

router.get('/', itemController.getWasteItems);

router.get('/:id', itemController.getWasteItemById);

router.put(
  '/:id',
  authMiddleware,
  authorize('admin'),
  itemController.updateWasteItem
);

router.delete(
  '/:id',
  authMiddleware,
  authorize('admin'),
  itemController.deleteWasteItem
);

module.exports = router;
