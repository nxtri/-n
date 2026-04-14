const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware.verifyToken, notificationController.getMyNotifications);
router.put('/:id/read', authMiddleware.verifyToken, notificationController.markAsRead);

module.exports = router;