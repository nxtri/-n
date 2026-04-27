const { Room, User, RentalContract, SystemConfig } = require('../models');

const roomController = {

  createRoom: async (req, res) => {
    try {
      // === KIỂM TRA GÓI ĐĂNG KÝ ===
      const landlord = await User.findByPk(req.user.id);
      if (!landlord) return res.status(404).json({ message: 'Không tìm thấy chủ nhà!' });

      // Kiểm tra gói còn hạn không
      const now = new Date();
      if (!landlord.subscriptionPlan || landlord.subscriptionPlan === 'NONE' || !landlord.subscriptionExpiry || new Date(landlord.subscriptionExpiry) < now) {
        return res.status(403).json({ message: 'Bạn chưa đăng ký gói dịch vụ hoặc gói đã hết hạn! Vui lòng mua gói để đăng tin.' });
      }

      // Kiểm tra giới hạn số phòng của gói
      const currentRoomCount = await Room.count({ where: { landlordId: req.user.id } });
      // Lấy giới hạn từ SystemConfig (nếu Admin đã cấu hình)
      let baseLimit = 0;
      if (landlord.hasBasePlan) {
        const limitConfig = await SystemConfig.findOne({ where: { key: `PLAN_${landlord.subscriptionPlan}_LIMIT` } });
        if (limitConfig) {
          baseLimit = parseInt(limitConfig.value);
        } else {
          // Giá trị mặc định
          const defaultLimits = { BRONZE: 10, SILVER: 25, GOLD: 55, DIAMOND: -1 };
          baseLimit = defaultLimits[landlord.subscriptionPlan] ?? 0;
        }
      }

      let roomLimit = baseLimit === -1 ? -1 : baseLimit + (landlord.extraRoomLimit || 0);

      if (roomLimit !== -1 && currentRoomCount >= roomLimit) {
        return res.status(403).json({ message: `Giới hạn gói của bạn chỉ cho phép tối đa ${roomLimit} phòng. Bạn đã có ${currentRoomCount} phòng. Vui lòng nâng cấp gói hoặc mua thêm phòng lẻ!` });
      }

      // 1. Lấy danh sách ảnh
      const imageFiles = req.files ? req.files.map(file => file.filename) : [];

      // 2. Màng lọc bảo vệ PostgreSQL (Biến chuỗi rỗng "" thành null)
      const dataToCreate = { ...req.body };
      for (const key in dataToCreate) {
        if (dataToCreate[key] === '') {
          dataToCreate[key] = null;
        }
      }

      // 3. Gán ID chủ nhà và nhét danh sách ảnh vào
      dataToCreate.landlordId = req.user.id;
      dataToCreate.images = JSON.stringify(imageFiles);

      // Tạo mã phòng ngẫu nhiên (6 ký tự)
      const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
      let uniqueCode = generateRoomCode();
      let isCodeExist = await Room.findOne({ where: { roomCode: uniqueCode } });
      while (isCodeExist) {
        uniqueCode = generateRoomCode();
        isCodeExist = await Room.findOne({ where: { roomCode: uniqueCode } });
      }
      dataToCreate.roomCode = uniqueCode;

      // 4. Lưu vào CSDL
      const newRoom = await Room.create(dataToCreate);

      res.status(201).json({ message: 'Tạo phòng thành công!', room: newRoom });
    } catch (error) {
      console.error("=== LỖI KHI TẠO PHÒNG MỚI ===", error);
      res.status(500).json({ message: 'Lỗi server khi tạo phòng!' });
    }
  },
  // 2. Lấy danh sách tất cả các phòng
  getAllRooms: async (req, res) => {
    try {
      // 1. Khởi tạo điều kiện lọc rỗng
      let whereCondition = {};
      const { type } = req.query;

      if (type === 'all') {
        // Nếu truyền lên type=all (từ trang Home), lấy mọi phòng trống không cần để ý ai đang đăng nhập
        whereCondition.status = 'AVAILABLE';
      } else {
        // 2. KIỂM TRA AN TOÀN: Xem req.user có tồn tại không trước khi chui vào lấy .id và .role
        if (req.user && req.user.id) {
          // Nếu đã đăng nhập và là CHỦ NHÀ -> Chỉ hiện phòng của chủ nhà này (Dùng cho trang Quản lý)
          if (req.user.role === 'LANDLORD') {
            whereCondition.landlordId = req.user.id;
          } 
          // Nếu là KHÁCH THUÊ -> Chỉ hiện các phòng đang trống
          else if (req.user.role === 'TENANT') {
            whereCondition.status = 'AVAILABLE';
          }
        } 
        // 3. Nếu không có token (Người lạ đang xem trang Home chưa đăng nhập)
        else {
          whereCondition.status = 'AVAILABLE'; // Chỉ hiện phòng trống
        }
      }

      // 4. LẤY THÊM MÔ HÌNH ĐÁNH GIÁ (REVIEW)
      const { Review } = require('../models');

      // 5. Bắt đầu tìm kiếm với điều kiện đã được set an toàn ở trên
      const rooms = await Room.findAll({
        where: whereCondition,
        include: [
          { model: Review, as: 'reviews', attributes: ['rating'] }
        ]
      });

      // Tính điểm đánh giá trung bình
      const processRoom = (r) => {
        const roomData = r.toJSON ? r.toJSON() : r;
        const reviews = roomData.reviews || [];
        const avgRating = reviews.length > 0 
          ? (reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length).toFixed(1) 
          : 0;
        const reviewCount = reviews.length;
        
        // Loại bỏ mảng reviews chi tiết để giảm tải dung lượng trả về
        delete roomData.reviews; 
        
        return { ...roomData, avgRating, reviewCount };
      };

      const finalRooms = rooms.map(processRoom);

      res.status(200).json({
        message: 'Lấy danh sách phòng thành công!',
        rooms: finalRooms
      });
      
    } catch (error) {
      console.error("LỖI LẤY DANH SÁCH PHÒNG:", error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách phòng!' });
    }
  },

  // Lấy chi tiết 1 phòng (kèm thông tin Chủ nhà)
  getRoomById: async (req, res) => {
    try {
      const { Op } = require('sequelize'); // Require Op để dùng phép lọc
      const { RentalContract } = require('../models');
      const roomId = req.params.id;
      
      const room = await Room.findByPk(roomId, {
        include: [
          {
            model: User,
            as: 'landlord', // <--- CHÌA KHÓA NẰM Ở ĐÚNG DÒNG NÀY ĐÂY!
            attributes: ['phone', 'fullName'] 
          }
        ]
      });

      if (!room) {
        return res.status(404).json({ message: 'Không tìm thấy phòng!' });
      }

      // Nếu phòng đang thuê, lấy thêm ngày dự kiến dọn đi từ hợp đồng đang hiệu lực
      let intendedMoveOutDate = null;
      if (room.status === 'RENTED') {
        const activeContract = await RentalContract.findOne({
          where: { roomId: roomId, status: 'ACTIVE' },
          attributes: ['intendedMoveOutDate']
        });
        if (activeContract) {
          intendedMoveOutDate = activeContract.intendedMoveOutDate;
        }
      }

      const roomData = { ...room.toJSON(), intendedMoveOutDate };

      // 🚨 TÌM TẤT CẢ CÁC ĐÁNH GIÁ CỦA PHÒNG NÀY
      const { Review } = require('../models');
      const reviews = await Review.findAll({
        where: { 
          roomId: roomId
        },
        include: [{ model: User, as: 'tenant', attributes: ['fullName'] }],
        order: [['createdAt', 'DESC']] // Đánh giá mới nhất lên đầu
      });
      res.status(200).json({ message: 'Thành công', room: roomData, reviews });
    } catch (error) {
      console.error("=== LỖI LẤY CHI TIẾT PHÒNG ===", error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },
  updateStatus: async (req, res) => {
    try {
      const roomId = req.params.id;
      const { status } = req.body; // Nhận trạng thái mới gửi lên ('AVAILABLE' hoặc 'MAINTENANCE')

      const room = await Room.findByPk(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Không tìm thấy phòng này!' });
      }

      // Khóa bảo vệ: Không cho phép đổi trạng thái nếu phòng đang có người thuê
      if (room.status === 'RENTED') {
        return res.status(400).json({ message: 'Phòng đang cho thuê, không thể tự ý đổi trạng thái!' });
      }

      await room.update({ status: status });

      res.status(200).json({ message: 'Cập nhật trạng thái thành công!', room });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái!' });
    }
  },

  toggleVisibility: async (req, res) => {
    try {
      const roomId = req.params.id;
      const room = await Room.findByPk(roomId);
      if (!room) return res.status(404).json({ message: 'Không tìm thấy phòng!' });
      
      await room.update({ isHidden: !room.isHidden });
      res.status(200).json({ message: 'Cập nhật trạng thái hiển thị thành công!', isHidden: room.isHidden });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái hiển thị' });
    }
  },

  bulkToggleVisibility: async (req, res) => {
    try {
      const { roomIds, isHidden } = req.body;
      if (!Array.isArray(roomIds)) return res.status(400).json({ message: 'Danh sách ID không hợp lệ!' });
      
      await Room.update({ isHidden }, { where: { id: roomIds, landlordId: req.user.id } });
      res.status(200).json({ message: 'Đã cập nhật trạng thái các phòng thành công!' });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi ẩn phòng hàng loạt' });
    }
  },


  // 4. Sửa thông tin phòng
// 4. Sửa thông tin phòng
// 4. Sửa thông tin phòng
// 4. Sửa thông tin phòng
  updateRoom: async (req, res) => {
    try {
      const roomId = req.params.id;
      const room = await Room.findByPk(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Không tìm thấy phòng!' });
      }

      // 1. Xử lý Ảnh (Nếu có ảnh mới thì lấy, không thì giữ ảnh cũ)
      let newImages = room.images; 
      if (req.files && req.files.length > 0) {
        newImages = JSON.stringify(req.files.map(file => file.filename));
      }

      // 2. Màng lọc bảo vệ PostgreSQL (Biến chuỗi rỗng "" thành null)
      const dataToUpdate = { ...req.body };
      for (const key in dataToUpdate) {
        if (dataToUpdate[key] === '') {
          dataToUpdate[key] = null;
        }
      }
      dataToUpdate.images = newImages; // Nhét danh sách ảnh vào

      // 3. Cập nhật vào Database
      await room.update(dataToUpdate);

      res.status(200).json({ message: 'Cập nhật phòng thành công!', room });
    } catch (error) {
      console.error("=== LỖI KHI CẬP NHẬT PHÒNG ===", error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật phòng!' });
    }
  },

  // 5. Xóa phòng
  deleteRoom: async (req, res) => {
    try {
      const roomId = req.params.id;
      const room = await Room.findByPk(roomId);
      if (!room) return res.status(404).json({ message: 'Không tìm thấy phòng!' });

      // Khóa bảo vệ: Không cho xóa phòng đang thuê
      if (room.status === 'RENTED') {
        return res.status(400).json({ message: 'Phòng đang cho thuê, không thể xóa!' });
      }

      await room.destroy();
      res.status(200).json({ message: 'Xóa phòng thành công!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi xóa phòng! (Có thể do phòng đang lưu hợp đồng cũ)' });
    }
  },
// =========================================================
  // API: LẤY DANH SÁCH PHÒNG CHO TRANG CHỦ (PUBLIC)
  // =========================================================
  getPublicRooms: async (req, res) => {
    try {
      const { Room, RentalContract, Review } = require('../models'); 
      const { Op } = require('sequelize');

      // 1. LẤY PHÒNG TRỐNG (NHƯNG CHƯA AI CỌC)
      const availableRooms = await Room.findAll({ 
        where: { status: 'AVAILABLE', isHidden: false }, 
        include: [
          { model: User, as: 'landlord', attributes: ['fullName', 'phone', 'subscriptionPlan', 'subscriptionExpiry'] },
          { model: Review, as: 'reviews', attributes: ['rating'] }
        ]
      });

      // 🚨 BỘ LỌC 1: Chỉ lấy phòng có depositNote rỗng hoặc null
      // 🚨 BỘ LỌC GÓI: Chỉ lấy phòng của chủ nhà có gói còn hạn
      const now = new Date();
      const safeAvailable = availableRooms.filter(r => {
        if (r.depositNote && r.depositNote.trim() !== '') return false;
        // Kiểm tra gói chủ nhà còn hạn
        if (!r.landlord?.subscriptionPlan || r.landlord.subscriptionPlan === 'NONE') return false;
        if (!r.landlord?.subscriptionExpiry || new Date(r.landlord.subscriptionExpiry) < now) return false;
        return true;
      });

      // 2. LẤY PHÒNG ĐANG THUÊ (SẮP TRỐNG)
      const rentedRooms = await Room.findAll({ 
        where: { status: 'RENTED', isHidden: false },
        include: [
          { model: User, as: 'landlord', attributes: ['fullName', 'phone', 'subscriptionPlan', 'subscriptionExpiry'] }
        ]
      });
      const activeContracts = await RentalContract.findAll({
        where: { status: 'ACTIVE' },
        attributes: ['roomId', 'intendedMoveOutDate'] 
      });

      // 🚨 BỘ LỌC 2: Chỉ lấy phòng sắp trống mà CHƯA AI CỌC + chủ nhà còn hạn gói
      const upcomingRooms = rentedRooms.map(room => {
        if (room.depositNote && room.depositNote.trim() !== '') return null; 
        // Kiểm tra gói chủ nhà
        if (!room.landlord?.subscriptionPlan || room.landlord.subscriptionPlan === 'NONE') return null;
        if (!room.landlord?.subscriptionExpiry || new Date(room.landlord.subscriptionExpiry) < now) return null;

        const contract = activeContracts.find(c => c.roomId === room.id);
        if (contract && contract.intendedMoveOutDate) {
          return { ...room.toJSON(), intendedMoveOutDate: contract.intendedMoveOutDate };
        }
        return null;
      }).filter(r => r !== null);

      // 3. GỘP LẠI VÀ GỬI VỀ CHO TRANG CHỦ
      const processRoom = (r) => {
        const roomData = r.toJSON ? r.toJSON() : r;
        const reviews = roomData.reviews || [];
        const avgRating = reviews.length > 0 
          ? (reviews.reduce((sum, rev) => sum + rev.rating, 0) / reviews.length).toFixed(1) 
          : 0;
        const reviewCount = reviews.length;
        
        delete roomData.reviews; 
        
        return { ...roomData, avgRating, reviewCount };
      };

      const finalRooms = [
        ...safeAvailable.map(r => processRoom(r)), 
        ...upcomingRooms.map(r => processRoom(r))
      ];

      // SắP XẾP: Ưu tiên Kim Cương lên đầu, sau đó theo số sao
      const planPriority = { DIAMOND: 4, GOLD: 3, SILVER: 2, BRONZE: 1, NONE: 0 };
      finalRooms.sort((a, b) => {
        const priorityA = planPriority[a.landlord?.subscriptionPlan] || 0;
        const priorityB = planPriority[b.landlord?.subscriptionPlan] || 0;
        if (priorityB !== priorityA) return priorityB - priorityA;
        return b.avgRating - a.avgRating;
      });

      res.status(200).json({ rooms: finalRooms });
    } catch (error) {
      console.error("Lỗi lấy phòng public:", error);
      res.status(500).json({ message: 'Lỗi server khi lấy danh sách phòng.' });
    }
  },
  // =========================================================
  // API: CẬP NHẬT GHI CHÚ NHẬN CỌC / GIỮ CHỖ
  // =========================================================
  updateDeposit: async (req, res) => {
    try {
      const roomId = req.params.id;
      const { note } = req.body; // Gửi text lên để lưu, hoặc gửi rỗng để xóa cọc

      const room = await Room.findByPk(roomId);
      if (!room) return res.status(404).json({ message: 'Không tìm thấy phòng!' });

      await room.update({ depositNote: note || null });

      res.status(200).json({ message: 'Cập nhật ghi chú giữ chỗ thành công!', room });
    } catch (error) {
      console.error("Lỗi cập nhật cọc:", error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật cọc.' });
    }
  }
};

module.exports = roomController;