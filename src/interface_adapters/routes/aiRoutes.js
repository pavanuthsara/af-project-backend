const express = require('express');
const router = express.Router();
const AIController = require('../controllers/AIController');
const upload = require('../middleware/uploadMiddleware');

const aiController = new AIController();

router.post('/identify', upload.single('image'), aiController.identifyWaste);

module.exports = router;
