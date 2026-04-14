const cron = require('node-cron');
const { RentalContract, ServiceBill, Notification, User } = require('./models');
const { Op } = require('sequelize');
const { Room } = require('./models');
const startCronJobs = () => {
  console.log("🤖 Hệ thống Robot tự động (Cronjob) đã được kích hoạt!");

  // =========================================================================
  // NHIỆM VỤ 1: NHẮC CHỦ NHÀ CHỐT ĐIỆN NƯỚC VÀO MÙNG 1 HÀNG THÁNG
  // Chạy vào lúc 00:00 ngày mùng 1 mỗi tháng ('0 0 1 * *')
  // =========================================================================
  cron.schedule('0 0 1 * *', async () => {
    console.log("🤖 [Cron] Đang chạy tác vụ: Nhắc nhở chốt điện nước ngày mùng 1...");
    try {
      // Tìm tất cả các chủ nhà đang có hợp đồng ACTIVE
      const activeContracts = await RentalContract.findAll({
        where: { status: 'ACTIVE' },
        include: [{ model: User, as: 'room' }]
      });

      // Lọc ra danh sách ID chủ nhà (không trùng lặp)
      const landlordIds = [...new Set(activeContracts.map(c => c.landlordId))];

      for (const landlordId of landlordIds) {
        await Notification.create({
          userId: landlordId,
          title: '📅 Đến hạn chốt điện nước',
          message: 'Hôm nay là mùng 1, hệ thống nhắc bạn chốt chỉ số điện/nước và tạo HÓA ĐƠN ĐIỆN NƯỚC cho các phòng đang thuê.'
        });
      }
      console.log(`✅ [Cron] Đã gửi nhắc nhở chốt điện nước cho ${landlordIds.length} chủ nhà.`);
    } catch (error) {
      console.error("❌ [Cron Lỗi] Nhắc nhở mùng 1:", error);
    }
  });

  // NHIỆM VỤ 2: TỰ ĐỘNG TẠO HÓA ĐƠN TIỀN NHÀ THEO NGÀY KÝ HỢP ĐỒNG
  // Chạy vào lúc 00:10 mỗi ngày ('10 0 * * *')
  // =========================================================================
  cron.schedule('10 0 * * *', async () => {
    console.log("🤖 [Cron] Đang quét Hợp đồng để tự động tạo Hóa đơn tiền nhà...");
    try {
      const today = new Date();
      const currentDay = today.getDate(); // Ngày hôm nay (vd: 31)
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const { Room } = require('./models');
      const activeContracts = await RentalContract.findAll({ 
        where: { status: 'ACTIVE' },
        include: [{ model: Room, as: 'room' }] 
      });

      for (const contract of activeContracts) {
        const contractStartDate = new Date(contract.startDate);
        const startDay = contractStartDate.getDate(); // Ngày bắt đầu thuê

        // Nếu hôm nay đúng bằng ngày bắt đầu thuê (vd: cùng là ngày 15)
        if (currentDay === startDay) {
          
          // Kiểm tra xem tháng này đã tạo hóa đơn Tiền nhà cho phòng này chưa
          const existingBill = await ServiceBill.findOne({
            where: { contractId: contract.id, month: currentMonth, year: currentYear, billType: 'ROOM' }
          });

          if (!existingBill) {
            // TỰ ĐỘNG TÍNH TOÁN TIỀN NHÀ (Tiền phòng + Dịch vụ + Internet + Gửi xe)
            const roomAmount = contract.price || 0;
            const serviceAmount = contract.servicePrice || 0;
            const internetAmount = contract.internetPrice || 0;
            const parkingAmount = (contract.vehicleCount || 0) * (contract.parkingPrice || 0);
            const totalAmount = roomAmount + serviceAmount + internetAmount + parkingAmount;

            // Tạo Hóa đơn TIỀN NHÀ
            await ServiceBill.create({
              contractId: contract.id,
              roomNumberSnapshot: contract.room.roomNumber,
              month: currentMonth,
              year: currentYear,
              electricityUsage: 0,
              waterUsage: 0,      
              vehicleCount: contract.vehicleCount || 0,
              totalAmount: totalAmount,
              status: 'UNPAID',
              billType: 'ROOM'    
            });

            // 1. Bắn thông báo cho KHÁCH THUÊ
            if (contract.tenantId) {
              await Notification.create({
                userId: contract.tenantId,
                title: '🧾 Có hóa đơn tiền nhà mới',
                message: `Hóa đơn TIỀN NHÀ tháng ${currentMonth}/${currentYear} của Phòng ${contract.roomId} đã được hệ thống tự động tạo. Tổng tiền: ${totalAmount.toLocaleString('vi-VN')}đ. Vui lòng kiểm tra và thanh toán.`
              });
            }

            // 2. Bắn thông báo cho CHỦ NHÀ 
            const targetLandlordId = contract.room?.landlordId || contract.landlordId || contract.userId;

            if (targetLandlordId) {
              await Notification.create({
                userId: targetLandlordId,
                title: '✅ Đã tự động tạo hóa đơn tiền nhà',
                message: `Hệ thống tự động tạo hóa đơn TIỀN NHÀ tháng ${currentMonth}/${currentYear} cho P.${contract.roomId}. Tổng tiền: ${totalAmount.toLocaleString('vi-VN')}đ.`
              });
            } else {
              console.log(`⚠️ [Cảnh báo] Không tìm thấy ID chủ nhà cho Phòng ${contract.roomId}`);
            }
            
            console.log(`✅ [Robot] Đã tạo thành công 1 Hóa đơn tiền nhà cho P.${contract.roomId}`);
          }
        }

      }
    } catch (error) {
      console.error("❌ [Cron Lỗi] Tự động tạo hóa đơn tiền nhà:", error);
    }
  });
  
// =========================================================================
  // // NHIỆM VỤ 2 (CHẾ ĐỘ TEST): TẠO HÓA ĐƠN TIỀN NHÀ MỖI 10 GIÂY
  // // =========================================================================
  // cron.schedule('*/10 * * * * *', async () => { // <--- Chạy mỗi 10 giây
  //   console.log("🤖 [TEST] Đang quét Hợp đồng để tự động tạo Hóa đơn tiền nhà...");
  //   try {
  //     const today = new Date();
  //     const currentMonth = today.getMonth() + 1;
  //     const currentYear = today.getFullYear();

  //     const activeContracts = await RentalContract.findAll({ where: { status: 'ACTIVE' }, include: [{ model: Room, as: 'room' }] });

  //     for (const contract of activeContracts) {
  //       // TẠM THỜI BỎ QUA ĐIỀU KIỆN NGÀY (Không cần if currentDay === startDay nữa)
        
  //       // Kiểm tra xem tháng này đã tạo chưa để không tạo trùng
  //       const existingBill = await ServiceBill.findOne({
  //         where: { contractId: contract.id, month: currentMonth, year: currentYear, billType: 'ROOM' }
  //       });

  //       if (!existingBill) {
  //         // Tính toán tiền
  //         const roomAmount = contract.price || 0;
  //         const serviceAmount = contract.servicePrice || 0;
  //         const internetAmount = contract.internetPrice || 0;
  //         const parkingAmount = (contract.vehicleCount || 0) * (contract.parkingPrice || 0);
  //         const totalAmount = roomAmount + serviceAmount + internetAmount + parkingAmount;

  //         // Tạo hóa đơn
  //         await ServiceBill.create({
  //           contractId: contract.id,
  //           month: currentMonth,
  //           year: currentYear,
  //           electricityUsage: 0,
  //           waterUsage: 0,
  //           vehicleCount: contract.vehicleCount,
  //           totalAmount: totalAmount,
  //           status: 'UNPAID',
  //           billType: 'ROOM'
  //         });

  //         // Gửi thông báo cho khách
  //         if (contract.tenantId) {
  //           await Notification.create({
  //             userId: contract.tenantId,
  //             title: '🧾 Có hóa đơn tiền nhà mới',
  //             message: `Hóa đơn TIỀN NHÀ tháng ${currentMonth}/${currentYear} của Phòng ${contract.roomId} đã được hệ thống tự động tạo. Tổng tiền: ${totalAmount.toLocaleString('vi-VN')}đ.`
  //           });
  //         }

  //         /// Gửi thông báo cho chủ nhà (CÓ ÁO GIÁP BẢO VỆ)
  //         const targetLandlordId = contract.room?.landlordId || contract.landlordId || contract.userId;

  //         if (targetLandlordId) {
  //           await Notification.create({
  //             userId: targetLandlordId,
  //             title: '✅ Đã tự động tạo hóa đơn tiền nhà',
  //             message: `Hệ thống tự động tạo hóa đơn TIỀN NHÀ tháng ${currentMonth}/${currentYear} cho P.${contract.roomId}.`
  //           });
  //         } else {
  //           console.log(`⚠️ [Cảnh báo] Không tìm thấy ID chủ nhà cho Phòng ${contract.roomId}`);
  //         }
          
  //         console.log(`✅ [TEST] Đã đẻ ra thành công 1 Hóa đơn tiền nhà cho P.${contract.roomId}`);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("❌ [Cron Lỗi] Tự động tạo hóa đơn tiền nhà:", error);
  //   }
  // });
};

module.exports = startCronJobs;