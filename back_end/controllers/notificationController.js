const { Notification } = require('../models');

module.exports = {
  // Lấy danh sách thông báo của người đang đăng nhập
  getMyNotifications: async (req, res) => {
    try {
      const notifications = await Notification.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']] // Sắp xếp mới nhất lên đầu
      });
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy thông báo' });
    }
  },

  // Đánh dấu đã đọc
  markAsRead: async (req, res) => {
    try {
      await Notification.update(
        { isRead: true },
        { where: { id: req.params.id, userId: req.user.id } }
      );
      res.status(200).json({ message: 'Đã đánh dấu đọc' });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi cập nhật thông báo' });
    }
  }
};