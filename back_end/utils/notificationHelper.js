const { Notification, User } = require('../models');
const sendEmail = require('./sendEmail');

const notificationHelper = {
  /**
   * Gửi thông báo đơn lẻ (Web + Email tùy chọn)
   */
  send: async (userId, title, message, shouldSendEmail = true) => {
    try {
      // 1. Tạo thông báo trên Web (DB)
      await Notification.create({
        userId,
        title,
        message,
        isRead: false
      });

      // 2. Nếu có yêu cầu gửi Email
      if (shouldSendEmail) {
        // Tìm User để lấy Email
        const user = await User.findByPk(userId, { attributes: ['email'] });
        if (user && user.email) {
          // 3. Gửi Email
          sendEmail(user.email, `[Thông Báo] ${title}`, message)
            .catch(err => console.error(`Lỗi gửi email tới ${user.email}:`, err));
        }
      }
    } catch (error) {
      console.error('Lỗi trong notificationHelper.send:', error);
    }
  },

  /**
   * Gửi thông báo hàng loạt (Web + Email tùy chọn)
   */
  bulkSend: async (userIds, title, message, shouldSendEmail = true) => {
    try {
      if (!userIds || userIds.length === 0) return;

      // 1. Lưu DB hàng loạt
      const notifications = userIds.map(id => ({
        userId: id,
        title,
        message,
        isRead: false
      }));
      await Notification.bulkCreate(notifications);

      // 2. Nếu có yêu cầu gửi Email hàng loạt
      if (shouldSendEmail) {
        // Lấy danh sách email
        const users = await User.findAll({
          where: { id: userIds },
          attributes: ['email']
        });

        // 3. Gửi Email
        users.forEach(u => {
          if (u.email) {
            sendEmail(u.email, `[Thông Báo] ${title}`, message)
              .catch(err => console.error(`Lỗi gửi email tới ${u.email}:`, err));
          }
        });
      }
    } catch (error) {
      console.error('Lỗi trong notificationHelper.bulkSend:', error);
    }
  },

  /**
   * Gửi thông báo cho tất cả Admin
   */
  notifyAdmins: async (title, message, shouldSendEmail = false) => {
    try {
      const admins = await User.findAll({ where: { role: 'ADMIN' }, attributes: ['id'] });
      const adminIds = admins.map(admin => admin.id);
      if (adminIds.length > 0) {
        await notificationHelper.bulkSend(adminIds, title, message, shouldSendEmail);
      }
    } catch (error) {
      console.error('Lỗi trong notificationHelper.notifyAdmins:', error);
    }
  }
};

module.exports = notificationHelper;
