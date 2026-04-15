const { Incident, Room, User, Notification, RentalContract } = require('../models');

const incidentController = {
  // 1. Tạo báo cáo sự cố (Dành cho Tenant)
  createIncident: async (req, res) => {
    try {
      if (req.user.role !== 'TENANT') {
        return res.status(403).json({ message: 'Chỉ khách thuê mới có quyền báo cáo sự cố.' });
      }

      const { roomCode, title, description } = req.body;
      const tenantId = req.user.id;

      // Tìm thông tin phòng để lấy landlordId và roomId
      const room = await Room.findOne({ where: { roomCode } });
      if (!room) {
        return res.status(404).json({ message: 'Không tìm thấy phòng với mã phòng này hoặc mã phòng không hợp lệ.' });
      }

      const roomId = room.id;
      const landlordId = room.landlordId;

      // Xác thực khách thuê có đang thuê phòng này hay không
      const activeContract = await RentalContract.findOne({
        where: { roomId: roomId, tenantId: tenantId, status: 'ACTIVE' }
      });
      if (!activeContract) {
        return res.status(403).json({ message: 'Bạn không thể báo cáo sự cố cho phòng mà bạn không thuê hoặc hợp đồng đã kết thúc.' });
      }

      // Lưu trữ ảnh nếu có (giống cách upload của Room/Review)
      let images = [];
      if (req.files && req.files.length > 0) {
        images = req.files.map(file => file.filename);
      }

      const newIncident = await Incident.create({
        tenantId,
        roomId,
        landlordId,
        title,
        description,
        images // Set sẽ tự động chuyển thành JSON string
      });

      // Tạo thông báo cho chủ nhà
      await Notification.create({
        userId: landlordId,
        title: 'Báo cáo sự cố mới',
        message: `Khách thuê phòng ${room.roomNumber} vừa báo cáo sự cố: ${title}`
      });

      res.status(201).json({ message: 'Báo cáo sự cố thành công.', incident: newIncident });
    } catch (error) {
      console.error('Lỗi khi tạo sự cố:', error);
      res.status(500).json({ message: 'Lỗi server khi tạo sự cố.' });
    }
  },

  // 2. Lấy danh sách sự cố (Tùy theo Role)
  getIncidents: async (req, res) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;
      let whereCondition = {};

      if (role === 'LANDLORD') {
        whereCondition.landlordId = userId;
      } else if (role === 'TENANT') {
        whereCondition.tenantId = userId;
      } else {
        return res.status(403).json({ message: 'Không có quyền truy cập.' });
      }

      const incidents = await Incident.findAll({
        where: whereCondition,
        include: [
          { model: User, as: 'tenant', attributes: ['fullName', 'phone', 'email'] },
          { model: Room, as: 'room', attributes: ['roomNumber', 'roomCode'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({ incidents });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách sự cố:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách.' });
    }
  },

  // 3. Cập nhật trạng thái và phản hồi sự cố (Dành cho Landlord)
  updateIncident: async (req, res) => {
    try {
      if (req.user.role !== 'LANDLORD') {
        return res.status(403).json({ message: 'Chỉ chủ nhà mới có thể cập nhật sự cố.' });
      }

      const incidentId = req.params.id;
      const { status, landlordReply } = req.body;

      const incident = await Incident.findByPk(incidentId, {
        include: [{ model: Room, as: 'room', attributes: ['roomNumber'] }]
      });

      if (!incident) {
        return res.status(404).json({ message: 'Không tìm thấy sự cố này.' });
      }

      // Kiểm tra quyền sở hữu
      if (incident.landlordId !== req.user.id) {
        return res.status(403).json({ message: 'Bạn không có quyền quản lý sự cố này.' });
      }

      // Cập nhật
      await incident.update({
        status: status || incident.status,
        landlordReply: landlordReply || incident.landlordReply
      });

      // Tạo thông báo cho khách thuê nếu chủ nhà vừa cập nhật
      const replyPreview = landlordReply ? ` - Nội dung: "${landlordReply}"` : '';
      await Notification.create({
        userId: incident.tenantId,
        title: 'Phản hồi sự cố',
        message: `Chủ nhà đã cập nhật sự cố (${incident.title}) của phòng ${incident.room.roomNumber} thành: ${status}${replyPreview}`
      });

      res.status(200).json({ message: 'Cập nhật sự cố thành công.', incident });
    } catch (error) {
      console.error('Lỗi khi cập nhật sự cố:', error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật sự cố.' });
    }
  },
  // 4. Cập nhật chi phí sửa chữa (Dành cho Landlord)
  updateRepairCost: async (req, res) => {
    try {
      if (req.user.role !== 'LANDLORD') {
        return res.status(403).json({ message: 'Chỉ chủ nhà mới có thể ghi chi phí sự cố.' });
      }

      const incidentId = req.params.id;
      const { repairDescription, repairCost } = req.body;

      const incident = await Incident.findByPk(incidentId);
      if (!incident) {
        return res.status(404).json({ message: 'Không tìm thấy sự cố này.' });
      }

      if (incident.landlordId !== req.user.id) {
        return res.status(403).json({ message: 'Bạn không có quyền cập nhật sự cố này.' });
      }

      await incident.update({
        repairDescription: repairDescription || incident.repairDescription,
        repairCost: repairCost !== undefined ? Number(repairCost) : incident.repairCost
      });

      res.status(200).json({ message: 'Đã lưu chi phí phát sinh thành công.', incident });
    } catch (error) {
      console.error('Lỗi khi cập nhật chi phí sự cố:', error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật chi phí.' });
    }
  }
};

module.exports = incidentController;
