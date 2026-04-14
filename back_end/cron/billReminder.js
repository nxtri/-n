const cron = require('node-cron');
const { RentalContract, User, Room } = require('../models');
const sendEmail = require('../utils/sendEmail');

// Chạy vào lúc 08:00 sáng mỗi ngày
cron.schedule('0 8 * * *', async () => {
  console.log('🤖 Bắt đầu kiểm tra lịch thu tiền phòng hàng ngày...');
  try {
    const today = new Date().getDate(); // Lấy ngày hiện tại (VD: ngày 15)

    // Tìm tất cả hợp đồng đang có hiệu lực
    const contracts = await RentalContract.findAll({
      where: { status: 'ACTIVE' },
      include: [
        { model: Room, as: 'room', attributes: ['roomNumber', 'landlordId'] }
      ]
    });

    for (let contract of contracts) {
      // Lấy ngày bắt đầu của hợp đồng (VD: 2024-03-15 -> Lấy số 15)
      const startDay = new Date(contract.startDate).getDate();

      // Nếu ngày hôm nay trùng với ngày bắt đầu hợp đồng
      if (today === startDay) {
        // Tìm thông tin chủ nhà để lấy Email
        const landlord = await User.findByPk(contract.room.landlordId);
        
        if (landlord) {
          const subject = `[Nhắc Nhở] Đã đến kỳ chốt điện nước phòng ${contract.room.roomNumber}`;
          const message = `Chào ${landlord.fullName},\n\nHôm nay là ngày thu tiền định kỳ của phòng ${contract.room.roomNumber}. \nVui lòng đăng nhập vào hệ thống, nhập chỉ số điện, nước và số xe để hệ thống tự động tính tiền và gửi hóa đơn cho khách thuê.\n\nTrân trọng!`;
          
          await sendEmail(landlord.email, subject, message);
        }
      }
    }
  } catch (error) {
    console.error('Lỗi khi chạy Cron Job nhắc nhở:', error);
  }
});