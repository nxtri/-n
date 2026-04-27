const { Report, Room } = require('../models');
const notificationHelper = require('../utils/notificationHelper');

const createReport = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { fullName, phoneNumber, reason, description, reporterId } = req.body;

    // Optional check: Ensure room exists
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Phòng không tồn tại!' });
    }

    const newReport = await Report.create({
      roomId,
      reporterId: reporterId || null,
      fullName,
      phoneNumber,
      reason,
      description
    });

    // Notify Admins
    await notificationHelper.notifyAdmins(
      'Có Báo Cáo Mới',
      `Người dùng ${fullName} (${phoneNumber}) vừa báo cáo phòng ${room.roomNumber} với lý do: ${reason}.`
    );

    res.status(201).json({ message: 'Cảm ơn bạn đã phản ánh. Admin sẽ xem xét sớm nhất!', report: newReport });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo báo xấu.' });
  }
};

module.exports = {
  createReport
};
