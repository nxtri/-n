const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Route POST /api/reports/:roomId
router.post('/:roomId', reportController.createReport);

module.exports = router;
