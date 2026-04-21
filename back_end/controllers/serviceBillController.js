const { ServiceBill, RentalContract, Room, User, Notification } = require('../models');
const notificationHelper = require('../utils/notificationHelper');

const serviceBillController = {
  // 1. Tạo hóa đơn (Chủ nhà nhập chỉ số -> Hệ thống tự tính tiền)
  // 1. Tạo hóa đơn (Chủ nhà nhập chỉ số -> Hệ thống tự tính tiền)
  createBill: async (req, res) => {
    try {
      // 🚨 Hứng thêm billType từ Frontend (nếu không có, mặc định là UTILITY - Hóa đơn điện nước chốt tay)
      const { contractId, month, year, electricityUsage, waterUsage, newElectricity, newWater, vehicleCount, billType = 'UTILITY' } = req.body;
      const { RentalContract, Room, User } = require('../models');
      // === 🚨 THÊM ĐOẠN NÀY ĐỂ CHẶN TRÙNG LẶP ===
      const existingBill = await ServiceBill.findOne({
        where: { 
          contractId: contractId, 
          month: month, 
          year: year,
          billType: billType // Cho phép 1 tháng có 1 bill tiền nhà + 1 bill điện nước riêng biệt
        }
      });

      if (existingBill) {
        return res.status(400).json({ 
          message: `Hóa đơn loại này trong Tháng ${month}/${year} của phòng này đã được tạo rồi!` 
        });
      }

      // Tìm hợp đồng, kèm theo thông tin Phòng và Khách thuê
      const contract = await RentalContract.findByPk(contractId, {
        include: [
          { model: Room, as: 'room' },
          { model: User, as: 'tenant' }
        ]
      });

      if (!contract) {
        return res.status(404).json({ message: 'Không tìm thấy hợp đồng!' });
      }

      const room = contract.room;

      // 🧮 HỆ THỐNG TỰ ĐỘNG TÍNH TIỀN THEO PHÂN LOẠI:
      const totalElectricity = (electricityUsage || 0) * room.electricityPrice;
      const totalWater = (waterUsage || 0) * room.waterPrice;
      const totalParking = (vehicleCount || 0) * room.parkingPrice;
      
      let totalAmount = 0;
      let emailMessage = '';

      // Tách logic tính tiền và nội dung Email
      if (billType === 'UTILITY') {
        // 1. CHỈ TÍNH TIỀN ĐIỆN, NƯỚC
        totalAmount = totalElectricity + totalWater ;
        emailMessage = `Chào ${contract.tenant.fullName},\n\nChủ nhà vừa chốt hóa đơn ĐIỆN NƯỚC tháng ${month}/${year} cho phòng ${room.roomNumber}.\n\nChi tiết:\n- Tiền điện (${electricityUsage} ký): ${totalElectricity.toLocaleString()}đ\n- Tiền nước (${waterUsage} khối): ${totalWater.toLocaleString()}đ\n\n💰 TỔNG CỘNG: ${totalAmount.toLocaleString()} VNĐ\n\nVui lòng đăng nhập website để thanh toán.\nCảm ơn bạn!`;
      } else {
        // 2. TÍNH TOÀN BỘ (Dùng cho hóa đơn tổng hợp hoặc Robot tự quét)
        totalAmount = room.price + totalParking + room.internetPrice + room.servicePrice;
        emailMessage = `Chào ${contract.tenant.fullName},\n\nChủ nhà vừa chốt hóa đơn tiền phòng tháng ${month}/${year} cho phòng ${room.roomNumber}.\n\nChi tiết:\n- Tiền phòng: ${room.price.toLocaleString()}đ\n- Tiền gửi xe (${vehicleCount} chiếc): ${totalParking.toLocaleString()}đ\n- Internet & Dịch vụ: ${(room.internetPrice + room.servicePrice).toLocaleString()}đ\n\n💰 TỔNG CỘNG: ${totalAmount.toLocaleString()} VNĐ\n\nVui lòng đăng nhập website để thanh toán.\nCảm ơn bạn!`;
      }

      console.log("Check room data:", room ? room.roomNumber : "Room is NULL");
      
      // Tạo hóa đơn lưu vào CSDL
      const newBill = await ServiceBill.create({
        contractId, month, year,
        electricityUsage: electricityUsage || 0,
        waterUsage: waterUsage || 0,
        vehicleCount: vehicleCount || 0,
        roomNumberSnapshot: room ? room.roomNumber : (contract.roomId ? `Phòng ${contract.roomId}` : 'N/A'),
        tenantIdSnapshot: contract.tenantId, // Lưu chết ID người thuê vào hóa đơn
        totalAmount: totalAmount, // Lưu chuẩn số tiền 60k
        billType: billType,       // Nhớ lưu cả loại hóa đơn xuống DB
        oldElectricity: req.body.oldElectricity,
        newElectricity: req.body.newElectricity,
        oldWater: req.body.oldWater,
        newWater: req.body.newWater,
        status: 'UNPAID' 

      });

      await RentalContract.update(
        { 
          currentElectricity: Number(newElectricity), 
          currentWater: Number(newWater) 
        },
        { where: { id: contractId } }
      );
      // 🔔 BẮN THÔNG BÁO VÀO QUẢ CHUÔNG & EMAIL CHO KHÁCH THUÊ
      try {
        const notiTitle = '🧾 Hóa đơn mới';
        const notiMessage = billType === 'UTILITY' 
          ? `Chào ${contract.tenant.fullName}, chủ nhà vừa chốt hóa đơn ĐIỆN NƯỚC tháng ${month}/${year} cho phòng ${room.roomNumber}. Số tiền: ${totalAmount.toLocaleString('vi-VN')} đ. Vui lòng kiểm tra và thanh toán.`
          : `Chào ${contract.tenant.fullName}, hệ thống vừa tạo hóa đơn tiền phòng tháng ${month}/${year} cho phòng ${room.roomNumber}. Số tiền: ${totalAmount.toLocaleString('vi-VN')} đ. Vui lòng kiểm tra và thanh toán.`;

        await notificationHelper.send(contract.tenantId, notiTitle, notiMessage);
      } catch (notiError) {
        console.error("Lỗi khi tạo thông báo (nhưng hóa đơn vẫn tạo thành công):", notiError);
      }

      res.status(201).json({ message: 'Tạo hóa đơn và gửi thông báo thành công!', bill: newBill });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi tạo hóa đơn!' });
    }
  },

  // Khách thuê gửi bằng chứng thanh toán
  uploadProof: async (req, res) => {
    try {
      const billId = req.params.id;
      const files = req.files; // Lấy danh sách ảnh từ multer

      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'Vui lòng tải lên ít nhất 1 ảnh bằng chứng!' });
      }

      const imageUrls = files.map(file => `/uploads/proofs/${file.filename}`);


      
      const bill = await ServiceBill.findByPk(billId, {
        include: [{
          model: RentalContract,
          as: 'contract',
          include: [{ model: Room, as: 'room' }]
        }]
      });

      if (!bill) {
        return res.status(404).json({ message: 'Không tìm thấy hóa đơn!' });
      }
      
      await bill.update({
        proofImages: JSON.stringify(imageUrls), // Lưu mảng đường dẫn ảnh
        status: 'PENDING_CONFIRM' // Đổi trạng thái sang "Chờ xác nhận"
      });
      // 2. 🔔 BẮN THÔNG BÁO CHO CHỦ NHÀ (Web + Email)
      if (bill.contract && bill.contract.room && bill.contract.room.landlordId) {
        try {
          await notificationHelper.send(
            bill.contract.room.landlordId,
            '💰 Khách đã nộp ảnh minh chứng',
            `Khách thuê phòng ${bill.contract.room.roomNumber} vừa tải lên ảnh minh chứng thanh toán cho hóa đơn tháng ${bill.month}/${bill.year}. Vui lòng kiểm tra và xác nhận!`
          );
        } catch (notiError) {
          console.error("Lỗi khi tạo thông báo cho Chủ nhà:", notiError);
        }
      }

      res.status(200).json({ message: 'Gửi bằng chứng thành công! Vui lòng đợi chủ nhà xác nhận.' });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi gửi bằng chứng!' });
    }
  },

  

  // 2. Xem danh sách hóa đơn
  getAllBills: async (req, res) => {
    try {
      const currentUserId = req.user.id;
      const role = req.user.role; // Giả sử req.user chứa role từ token

      let billOptions = {
        order: [['createdAt', 'DESC']] // Xếp hóa đơn mới nhất lên đầu
      };

      if (role === 'LANDLORD') {
        billOptions.include = [{ 
          model: RentalContract, 
          as: 'contract', 
          required: true, // BẮT BUỘC có hợp đồng
          include: [{ 
            model: Room, 
            as: 'room', 
            paranoid: false, // <-- Cho phép lấy cả phòng đã bị soft-deleted
            where: { landlordId: currentUserId }, // CHỐT CHẶN BẢO MẬT NẰM Ở ĐÂY!
            required: true // BẮT BUỘC thuộc phòng của chủ nhà này
          }] 
        }];
      } else {
        // TENANT
        const { Op } = require('sequelize');
        // Khách thuê chỉ xem hóa đơn của họ. Lấy mảng ID hợp đồng của họ hoặc so khớp `tenantIdSnapshot`
        // Cách nhanh nhất mà ít thay đổi code cũ:
        billOptions.include = [{ 
          model: RentalContract, 
          as: 'contract', 
          include: [{ 
            model: Room, 
            as: 'room',
            paranoid: false, // <-- Cho phép lấy cả phòng đã bị soft-deleted
            include: [{
              model: User,
              as: 'landlord',
              attributes: ['bankName', 'accountNumber', 'accountHolder']
            }]
          }] 
        }];
        billOptions.where = {
          [Op.or]: [
            { tenantIdSnapshot: currentUserId },
            { '$contract.tenantId$': currentUserId }
          ]
        };
      }

      const bills = await ServiceBill.findAll(billOptions);
      res.status(200).json({ bills });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi khi lấy danh sách hóa đơn!' });
    }
  },

  // Khách thuê thanh toán hóa đơn
  payBill: async (req, res) => {
    try {
      const billId = req.params.id;
      const bill = await ServiceBill.findByPk(billId, {
        include: [{ model: RentalContract, as: 'contract' }]
        });
      
      if (!bill) {
        return res.status(404).json({ message: 'Không tìm thấy hóa đơn!' });
      }

      // Đổi trạng thái thành PAID (Thành công)
      await bill.update({ status: 'PAID' });
      // 🔔 Bắn thông báo xác nhận thành công cho Khách (Web + Email)
      if (bill.contract && bill.contract.tenantId) {
        try {
          await notificationHelper.send(
            bill.contract.tenantId,
            '✅ Thanh toán thành công',
            `Chủ nhà đã xác nhận khoản tiền ${bill.totalAmount.toLocaleString('vi-VN')} đ cho hóa đơn tháng ${bill.month}/${bill.year}. Cảm ơn bạn!`
          );
        } catch (notiError) {
          console.error("Lỗi gửi thông báo thanh toán:", notiError);
        }
      }

      res.status(200).json({ message: 'Thanh toán thành công!', bill });
    } catch (error) {
      console.error("Lỗi xác nhận thanh toán:", error);
      res.status(500).json({ message: 'Lỗi khi thanh toán!' });
    }
  }
};
module.exports = serviceBillController;