const { User, Notification, Room, Report, Review } = require('../models');
const notificationHelper = require('../utils/notificationHelper');

const adminController = {
  // ==========================================
  // --- QUẢN LÝ NGƯỜI DÙNG ---
  // ==========================================

  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] }, // Không trả về mật khẩu
        include: [{ model: Room, as: 'rooms', attributes: ['isHidden'] }],
        order: [['createdAt', 'DESC']]
      });

      const usersData = users.map(user => {
        const userData = user.toJSON();
        if (userData.role === 'LANDLORD') {
           userData.violationsCount = (userData.rooms || []).filter(r => r.isHidden).length;
        } else {
           userData.violationsCount = 0;
        }
        delete userData.rooms; 
        return userData;
      });

      res.status(200).json({ message: 'Lấy danh sách người dùng thành công', users: usersData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách người dùng' });
    }
  },

  // Xem chi tiết một người dùng
  getUserDetail: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] }
      });
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
      res.status(200).json({ message: 'Lấy chi tiết người dùng thành công', user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi lấy chi tiết người dùng' });
    }
  },

  // Khóa / Mở khóa tài khoản
  toggleUserStatus: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
      if (user.role === 'ADMIN') return res.status(403).json({ message: 'Không thể khóa tài khoản Admin!' });

      user.isActive = !user.isActive;
      await user.save();

      const action = user.isActive ? 'Mở khóa' : 'Khóa';
      
      // 🔔 Bắn thông báo cho người dùng (Web + Email)
      await notificationHelper.send(
        user.id,
        '🔔 Trạng thái tài khoản',
        `Tài khoản của bạn đã được ${action} bởi quản trị viên.`
      );

      res.status(200).json({ message: `${action} tài khoản thành công!`, isActive: user.isActive });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi thay đổi trạng thái tài khoản' });
    }
  },

  // Xóa tài khoản (Có thể làm xóa mềm nếu config paranoid)
  deleteUser: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
      if (user.role === 'ADMIN') return res.status(403).json({ message: 'Không thể xóa tài khoản Admin!' });

      const { sendEmail } = require('../utils/sendEmail');
      if (user.email) {
        await sendEmail(
          user.email, 
          '🚫 Thông báo xóa tài khoản', 
          `Chào ${user.fullName}, tài khoản của bạn trên hệ thống đã bị xóa bởi quản trị viên. Mọi dữ liệu liên quan sẽ được gỡ bỏ. Trân trọng.`
        ).catch(err => console.error('Lỗi gửi email xóa tài khoản:', err));
      }

      await user.destroy();
      res.status(200).json({ message: 'Xóa tài khoản thành công!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi xóa tài khoản' });
    }
  },

  // ==========================================
  // --- THÔNG BÁO HÀNG LOẠT ---
  // ==========================================

  // Gửi thông báo tới TẤT CẢ hoặc THEO ROLE
  broadcastNotification: async (req, res) => {
    try {
      const { targetRole, title, message } = req.body; // targetRole: 'ALL', 'LANDLORD', 'TENANT'
      
      let whereCondition = {};
      if (targetRole && targetRole !== 'ALL') {
        whereCondition.role = targetRole;
      }

      // Không gửi cho Admin
      if (!whereCondition.role) {
         whereCondition.role = ['LANDLORD', 'TENANT'];
      }

      const users = await User.findAll({ where: whereCondition, attributes: ['id'] });
      
      // Gửi thông báo hàng loạt (CHỈ WEB, KHÔNG EMAIL theo yêu cầu)
      await notificationHelper.bulkSend(
        users.map(u => u.id),
        title || '📢 Thông báo từ Ban Quản Trị',
        message,
        false // shouldSendEmail = false
      );

      res.status(200).json({ 
        message: `Đã gửi thông báo thành công tới ${notifications.length} người dùng.` 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi gửi thông báo' });
    }
  },

  // ==========================================
  // --- QUẢN LÝ PHÒNG TRỌ, HỢP ĐỒNG, SỰ CỐ ---
  // ==========================================

  getAllRooms: async (req, res) => {
    try {
      let rooms = await Room.findAll({
        include: [
          { model: User, as: 'landlord', attributes: ['id', 'fullName', 'email', 'phone'] },
          { model: Report, as: 'reports' },
          { model: Review, as: 'reviews', attributes: ['rating'] }
        ],
        paranoid: false // Admin xem được cả phòng đã xóa mềm
      });

      // Chế biến dữ liệu: Tính avgRating cho mỗi phòng
      const roomsData = rooms.map(r => {
        const roomJson = r.toJSON();
        const reviews = roomJson.reviews || [];
        roomJson.avgRating = reviews.length > 0 
          ? (reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length).toFixed(1)
          : 0;
        roomJson.reviewCount = reviews.length;
        // Xóa reviews chi tiết cho gọn
        delete roomJson.reviews;
        return roomJson;
      });

      // Sort by the number of reports descending
      roomsData.sort((a, b) => (b.reports?.length || 0) - (a.reports?.length || 0));

      res.status(200).json({ rooms: roomsData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách phòng' });
    }
  },

  toggleRoomVisibility: async (req, res) => {
    try {
      const room = await Room.findByPk(req.params.id);
      if (!room) return res.status(404).json({ message: 'Không tìm thấy phòng!' });

      room.isHidden = !room.isHidden;
      await room.save();
      
      // LOGIC TỰ ĐỘNG CẢNH BÁO VÀ KHÓA TÀI KHOẢN
      if (room.landlordId) {
        const { User, Notification, Room: RoomModel } = require('../models');
        const landlord = await User.findByPk(room.landlordId);
        
        if (landlord) {
          // 1. Đếm số phòng đang bị ẩn của chủ nhà này
          const hiddenCount = await RoomModel.count({
            where: { landlordId: room.landlordId, isHidden: true }
          });

          // 2. Xử lý khi ẩn phòng
          if (room.isHidden) {
            // Tăng tổng số lần vi phạm (lịch sử)
            landlord.violationsCount = (landlord.violationsCount || 0) + 1;

            // Nếu đạt ngưỡng 3 phòng đang bị ẩn -> Bắt đầu đếm ngược 30 ngày
            if (hiddenCount === 3) {
              landlord.lockGracePeriodStart = new Date();
              
              // Gửi thông báo đặc biệt (Web + Email)
              await notificationHelper.send(
                landlord.id,
                '⚠️ CẢNH BÁO NGUY CƠ KHÓA TÀI KHOẢN',
                'Bạn đã bị ẩn 3 phòng và sẽ bị khóa tài khoản trong vòng 30 ngày tới, hãy liên hệ với quản trị viên để khiếu nại (nếu có), sau 30 ngày nếu không được xử lý chúng tôi sẽ phải khóa tài khoản của bạn, chúc bạn một ngày tốt lành!'
              );
            } else {
              // Thông báo bình thường (Web + Email)
              await notificationHelper.send(
                landlord.id,
                'Phòng bị ẩn',
                `Phòng ${room.roomNumber} của bạn đã bị quản trị viên ẩn do phát hiện sự cố hoặc có nhiều báo cáo vi phạm. Lưu ý nếu bị ẩn từ 3 phòng trở lên bạn sẽ vào diện chờ khóa tài khoản.`
              );
            }
          } 
          // 3. Xử lý khi mở lại phòng
          else {
            // Nếu số phòng ẩn giảm xuống dưới 3 -> Hủy bỏ giai đoạn chờ khóa
            if (hiddenCount < 3) {
              landlord.lockGracePeriodStart = null;
            }
          }
          
          await landlord.save();
        }
      }

      const action = room.isHidden ? 'Ẩn' : 'Hiện'; 
      res.status(200).json({ message: `${action} phòng thành công!`, isHidden: room.isHidden });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi đổi trạng thái phòng' });
    }
  },

  getAllContracts: async (req, res) => {
    try {
      const { RentalContract } = require('../models');
      const contracts = await RentalContract.findAll({
        include: [
          { model: Room, as: 'room', attributes: ['roomNumber'] }
        ]
      });
      res.status(200).json({ contracts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi lấy hợp đồng' });
    }
  },

  getAllIncidents: async (req, res) => {
    try {
      const { Incident } = require('../models');
      const incidents = await Incident.findAll({
        include: [
          { model: Room, as: 'room', attributes: ['roomNumber'] },
          { model: User, as: 'tenant', attributes: ['fullName'] }
        ],
        order: [['createdAt', 'DESC']]
      });
      res.status(200).json({ incidents });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi lấy sự cố' });
    }
  },

  // ==========================================
  // --- THỐNG KÊ DASHBOARD (PHASE 4) ---
  // ==========================================
  getDashboardStats: async (req, res) => {
    try {
      const { ServiceBill, Incident, RentalContract } = require('../models');
      
      const { Op } = require('sequelize');
      const { month, year } = req.query;

      // 1. Thống kê người dùng
      const totalTenants = await User.count({ where: { role: 'TENANT' } });
      const totalLandlords = await User.count({ where: { role: 'LANDLORD' } });
      const lockedTenants = await User.count({ where: { role: 'TENANT', isActive: false } });
      const lockedLandlords = await User.count({ where: { role: 'LANDLORD', isActive: false } });

      let newUsersFilter = {};
      if (month && month !== 'ALL') {
          const y = year && year !== 'ALL' ? parseInt(year) : new Date().getFullYear();
          const m = parseInt(month) - 1;
          const startDate = new Date(y, m, 1);
          const endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
          newUsersFilter.createdAt = {
              [Op.between]: [startDate, endDate]
          };
      } else if (year && year !== 'ALL') {
          const y = parseInt(year);
          const startDate = new Date(y, 0, 1);
          const endDate = new Date(y, 11, 31, 23, 59, 59, 999);
          newUsersFilter.createdAt = {
              [Op.between]: [startDate, endDate]
          };
      }
      
      const newUsers = await User.count({ where: { ...newUsersFilter, role: { [Op.in]: ['TENANT', 'LANDLORD'] } } });

      // 2. Thống kê phòng
      const totalRooms = await Room.count();
      const availableRooms = await Room.count({ where: { status: 'AVAILABLE', isHidden: false } });
      const rentedRooms = await Room.count({ where: { status: 'RENTED', isHidden: false } });
      const hiddenRooms = await Room.count({ where: { isHidden: true } });

      // 3. Thống kê doanh thu (Theo thời gian và loại hóa đơn)
      const billFilter = {};
      if (month && month !== 'ALL') billFilter.month = parseInt(month);
      if (year && year !== 'ALL') billFilter.year = parseInt(year);

      // (ROOM & UTILITY đã thanh toán)
      const roomRevenue = await ServiceBill.sum('totalAmount', { 
        where: { ...billFilter, status: 'PAID', billType: 'ROOM' } 
      }) || 0;
      
      const utilityRevenue = await ServiceBill.sum('totalAmount', { 
        where: { ...billFilter, status: 'PAID', billType: 'UTILITY' } 
      }) || 0;

      // Khách đang nợ (UNPAID và PENDING_CONFIRM)
      const totalDebt = await ServiceBill.sum('totalAmount', {
        where: { 
          ...billFilter, 
          status: { [Op.in]: ['UNPAID', 'PENDING_CONFIRM'] },
          billType: { [Op.in]: ['ROOM', 'UTILITY'] }
        }
      }) || 0;

      res.status(200).json({
        users: { totalTenants, totalLandlords, lockedTenants, lockedLandlords, newUsers },
        rooms: { totalRooms, availableRooms, rentedRooms, hiddenRooms },
        revenueStats: {
          totalRevenue: roomRevenue + utilityRevenue,
          roomRevenue,
          utilityRevenue,
          totalDebt
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi lấy thống kê' });
    }
  },

  // ==========================================
  // --- QUẢN LÝ NỘI QUY ---
  // ==========================================
  getRegulations: async (req, res) => {
    try {
      const { SystemConfig } = require('../models');
      const regulations = await SystemConfig.findAll({
        where: { key: 'ROOM_RULES' }
      });
      res.status(200).json({ regulations });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi lấy nội quy' });
    }
  },

  updateRegulation: async (req, res) => {
    try {
      const { SystemConfig, User, Notification } = require('../models');
      const { content, target, sendNotification } = req.body; // target: 'ALL', 'TENANT', 'LANDLORD'

      // Cập nhật hoặc tạo mới cấu hình
      let config = await SystemConfig.findOne({ where: { key: 'ROOM_RULES', target } });
      
      // NẾU NỘI DUNG TRỐNG -> XÓA NỘI QUY ĐANG CÓ (NẾU CÓ)
      if (!content || content.trim() === '') {
        if (config) {
          await config.destroy();
          return res.status(200).json({ message: 'Đã xóa nội quy do nội dung trống!' });
        }
        return res.status(400).json({ message: 'Nội dung không được để trống!' });
      }

      if (config) {
        config.value = content;
        await config.save();
      } else {
        config = await SystemConfig.create({
          key: 'ROOM_RULES',
          value: content,
          target: target || 'ALL'
        });
      }

      // Gửi thông báo tự động cho đối tượng liên quan
      let whereCondition = {};
      if (target && target !== 'ALL') {
        whereCondition.role = target;
      } else {
        whereCondition.role = ['LANDLORD', 'TENANT'];
      }

      if (users.length > 0) {
        await notificationHelper.bulkSend(
          users.map(u => u.id),
          '📢 Cập nhật Nội Quy Hệ Thống',
          `Ban quản trị đã cập nhật nội quy mới cho ${target === 'ALL' ? 'toàn bộ hệ thống' : (target === 'TENANT' ? 'khách thuê' : 'chủ nhà')}. Vui lòng kiểm tra lại.`,
          false // shouldSendEmail = false
        );
      }

      res.status(200).json({ message: 'Cập nhật nội quy thành công!', config });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật nội quy' });
    }
  },

  deleteRegulation: async (req, res) => {
    try {
      const { SystemConfig } = require('../models');
      const { id } = req.params;
      const config = await SystemConfig.findByPk(id);
      if (!config) return res.status(404).json({ message: 'Không tìm thấy nội quy!' });

      await config.destroy();
      res.status(200).json({ message: 'Xóa nội quy thành công!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi xóa nội quy' });
    }
  },
  // ==========================================
  // --- QUẢN LÝ ĐÁNH GIÁ (REVIEWS) ---
  // ==========================================
  getRoomReviews: async (req, res) => {
    try {
      const { Review, User } = require('../models');
      const { id } = req.params; // roomId

      const reviews = await Review.findAll({
        where: { roomId: id },
        include: [
          { model: User, as: 'tenant', attributes: ['fullName', 'email', 'phone'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({ reviews });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi lấy đánh giá' });
    }
  },

  deleteReview: async (req, res) => {
    try {
      const { Review } = require('../models');
      const { id } = req.params; // reviewId

      const review = await Review.findByPk(id);
      if (!review) return res.status(404).json({ message: 'Không tìm thấy đánh giá!' });

      await review.destroy();
      res.status(200).json({ message: 'Đã xóa đánh giá thành công!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi xóa đánh giá' });
    }
  },

  // ==========================================
  // --- QUẢN LÝ BÁO XẤU (REPORTS) ---
  // ==========================================
  updateReportStatus: async (req, res) => {
    try {
      const { Report, Notification, Room } = require('../models');
      const { id } = req.params;
      const { status } = req.body;

      const report = await Report.findByPk(id, {
        include: [{ model: Room, as: 'room' }]
      });
      if (!report) return res.status(404).json({ message: 'Không tìm thấy báo cáo!' });

      report.status = status;
      await report.save();

      // Send a notification to the reporter if they were logged in
      if (status === 'RESOLVED' && report.reporterId) {
        const roomName = report.room ? `Phòng ${report.room.roomNumber}` : 'phòng trọ';
        const roomCode = report.room?.roomCode ? ` (${report.room.roomCode})` : '';
        
        await notificationHelper.send(
          report.reporterId,
          '✅ Báo cáo đã được xử lý',
          `Ban quản trị đã giải quyết báo xấu của bạn liên quan đến ${roomName}${roomCode}. Chúng tôi rất cảm ơn sự phản hồi của bạn để xây dựng cộng đồng tốt hơn!`
        );
      }

      res.status(200).json({ message: 'Đã cập nhật trạng thái báo cáo!' });
    } catch (error) {
      console.error('Lỗi khi cập nhật báo cáo:', error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật báo cáo', error: error.message });
    }
  },

  resolveAllRoomReports: async (req, res) => {
    try {
      const { Report, Notification, Room } = require('../models');
      const { id } = req.params; // roomId

      const room = await Room.findByPk(id);
      if (!room) return res.status(404).json({ message: 'Không tìm thấy phòng!' });

      // Tìm tất cả báo cáo có trạng thái PENDING của phòng này
      const pendingReports = await Report.findAll({
        where: { roomId: id, status: 'PENDING' }
      });

      if (pendingReports.length === 0) {
        return res.status(200).json({ message: 'Không có báo cáo nào đang chờ xử lý cho phòng này.' });
      }

      const roomName = `Phòng ${room.roomNumber}`;
      const roomCode = room.roomCode ? ` (${room.roomCode})` : '';

      // Đánh dấu tất cả là RESOLVED
      for (const report of pendingReports) {
        report.status = 'RESOLVED';
        await report.save();

        if (report.reporterId) {
          await notificationHelper.send(
            report.reporterId,
            '✅ Báo cáo đã được xử lý',
            `Ban quản trị đã giải quyết báo xấu của bạn liên quan đến ${roomName}${roomCode}. Chúng tôi rất cảm ơn sự phản hồi của bạn để xây dựng cộng đồng tốt hơn!`
          );
        }
      }

      res.status(200).json({ message: `Đã duyệt thành công ${pendingReports.length} báo cáo.` });
    } catch (error) {
      console.error('Lỗi khi bulk resolve báo cáo:', error);
      res.status(500).json({ message: 'Lỗi server khi duyệt nhiều báo cáo', error: error.message });
    }
  }

};

module.exports = adminController;
