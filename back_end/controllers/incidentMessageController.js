const { IncidentMessage, Incident, User, Notification } = require('../models');
const notificationHelper = require('../utils/notificationHelper');

const incidentMessageController = {
  // Lấy tất cả tin nhắn của một sự cố
  getMessages: async (req, res) => {
    try {
      const { incidentId } = req.params;
      const userId = req.user.id;
      const role = req.user.role;

      // Kiểm tra quyền truy cập vào sự cố này
      const incident = await Incident.findByPk(incidentId);
      if (!incident) {
        return res.status(404).json({ message: 'Không tìm thấy sự cố.' });
      }

      if (role === 'TENANT' && incident.tenantId !== userId) {
        return res.status(403).json({ message: 'Bạn không có quyền xem tin nhắn này.' });
      }
      if (role === 'LANDLORD' && incident.landlordId !== userId) {
        return res.status(403).json({ message: 'Bạn không có quyền xem tin nhắn này.' });
      }

      const messages = await IncidentMessage.findAll({
        where: { incidentId },
        include: [
          { model: User, as: 'sender', attributes: ['id', 'fullName', 'role'] }
        ],
        order: [['createdAt', 'ASC']]
      });

      res.status(200).json({ messages });
    } catch (error) {
      console.error('Lỗi lấy tin nhắn:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy tin nhắn.' });
    }
  },

  // Gửi tin nhắn mới
  sendMessage: async (req, res) => {
    try {
      const { incidentId } = req.params;
      const { message } = req.body;
      const senderId = req.user.id;
      const senderRole = req.user.role;

      if (!message || message.trim() === '') {
        return res.status(400).json({ message: 'Nội dung tin nhắn không được để trống.' });
      }

      // Kiểm tra quyền truy cập
      const incident = await Incident.findByPk(incidentId);
      if (!incident) {
        return res.status(404).json({ message: 'Không tìm thấy sự cố.' });
      }

      if (senderRole === 'TENANT' && incident.tenantId !== senderId) {
        return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn cho sự cố này.' });
      }
      if (senderRole === 'LANDLORD' && incident.landlordId !== senderId) {
        return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn cho sự cố này.' });
      }

      const newMessage = await IncidentMessage.create({
        incidentId,
        senderId,
        senderRole,
        message: message.trim()
      });

      // Lấy thông tin sender để trả về
      const messageWithSender = await IncidentMessage.findByPk(newMessage.id, {
        include: [{ model: User, as: 'sender', attributes: ['id', 'fullName', 'role'] }]
      });

      // Gửi thông báo cho bên còn lại (Web + Email)
      const recipientId = senderRole === 'TENANT' ? incident.landlordId : incident.tenantId;
      const senderLabel = senderRole === 'TENANT' ? 'Khách thuê' : 'Chủ nhà';
      await notificationHelper.send(
        recipientId,
        'Tin nhắn sự cố mới',
        `${senderLabel} đã gửi tin nhắn về sự cố: "${message.trim().substring(0, 50)}${message.length > 50 ? '...' : ''}"`
      );

      res.status(201).json({ message: 'Gửi tin nhắn thành công.', data: messageWithSender });
    } catch (error) {
      console.error('Lỗi gửi tin nhắn:', error);
      res.status(500).json({ message: 'Lỗi server khi gửi tin nhắn.' });
    }
  }
};

module.exports = incidentMessageController;
