const { RentalContract, Room, User, Notification, Review } = require('../models');


const contractController = {
  // 1. Tạo hợp đồng mới
// 1. Tạo hợp đồng mới (PHIÊN BẢN ĐÃ NÂNG CẤP ĐẦY ĐỦ TRƯỜNG DỮ LIỆU)
  createContract: async (req, res) => {
    console.log("=== THÔNG TIN NHẬN ĐƯỢC TỪ FRONTEND ===");
    console.log("1. Mảng file ảnh (req.files):", req.files);
    console.log("2. Dữ liệu chữ (req.body):", req.body);
    try {
      // 1. Hứng TOÀN BỘ dữ liệu từ Frontend gửi lên
      const { 
        roomId, tenantEmail, 
        landlordName, landlordDob, landlordPhone, landlordIdentityNumber, landlordHometown,
        tenantName, tenantDob, tenantPhone, tenantIdentityNumber, tenantHometown,
        startDate, endDate,
        price, electricityPrice, waterPrice, internetPrice, parkingPrice, servicePrice,
        members, startElectricity, startWater, vehicleCount, conditionDescription
      } = req.body;
      
      const landlordId = req.user.id;

      // ====================================================================
      // Bước 1: Kiểm tra phòng (CÓ CHỐT CHẶN BẢO MẬT IDOR)
      // ====================================================================
      const room = await Room.findOne({
        where: { 
          id: roomId,
          landlordId: landlordId // 🚨 QUAN TRỌNG: Bắt buộc phòng này phải thuộc sở hữu của chủ nhà đang thao tác
        }
      });

      // Nếu không tìm thấy phòng (hoặc đó là phòng của người khác)
      if (!room) {
        return res.status(403).json({ 
          message: 'LỖI BẢO MẬT: Bạn không có quyền thao tác hoặc phòng không tồn tại!' 
        });
      }

      // Nếu phòng của mình nhưng đang không trống
      if (room.status !== 'AVAILABLE') {
        return res.status(400).json({ message: 'Phòng này đã có người thuê hoặc đang sửa chữa!' });
      }

      // ====================================================================
      // Bước 2: Tìm khách thuê dựa vào Email
      // ====================================================================
      const tenant = await User.findOne({ where: { email: tenantEmail, role: 'TENANT' } });
      if (!tenant) {
        return res.status(404).json({ message: 'Không tìm thấy Khách thuê nào đăng ký bằng Email này!' });
      }
      // Cập nhật thông tin CMND/CCCD cho Chủ nhà và Khách thuê
      await User.update({ identityNumber: landlordIdentityNumber }, { where: { id: landlordId } });
      await User.update({ identityNumber: tenantIdentityNumber }, { where: { id: tenant.id } });

      // Lấy tên file ảnh (nếu có upload)
      let contractFiles = [];
      let conditionImagesFiles = [];
      let conditionVideosFiles = [];
      
      if (req.files) {
        if (req.files.contractImages) contractFiles = req.files.contractImages.map(f => f.filename);
        if (req.files.conditionImages) conditionImagesFiles = req.files.conditionImages.map(f => f.filename);
        if (req.files.conditionVideos) conditionVideosFiles = req.files.conditionVideos.map(f => f.filename);
      }

      // Bước 3: Tạo hợp đồng với TẤT CẢ các trường dữ liệu
      const newContract = await RentalContract.create({
        roomId: roomId,
        tenantId: tenant.id,
        tenantEmail: tenantEmail,
        
        // Nhóm Bên A
        landlordName: landlordName,
        landlordDob: landlordDob || null, // Nếu trống thì để null tránh lỗi DB
        landlordPhone: landlordPhone,
        landlordIdentityNumber: landlordIdentityNumber,
        landlordHometown: landlordHometown,

        // Nhóm Bên B
        tenantName: tenantName,
        tenantDob: tenantDob || null,
        tenantPhone: tenantPhone,
        tenantIdentityNumber: tenantIdentityNumber,
        tenantHometown: tenantHometown,

        // Nhóm Thời hạn & File
        startDate: startDate,
        endDate: endDate,
        contractImage: contractFiles, 
        status: 'ACTIVE',

        // Nhóm Giá cả (Convert sang số để đảm bảo an toàn)
        price: Number(price) || 0,
        electricityPrice: Number(electricityPrice) || 0,
        waterPrice: Number(waterPrice) || 0,
        internetPrice: Number(internetPrice) || 0,
        parkingPrice: Number(parkingPrice) || 0,
        servicePrice: Number(servicePrice) || 0,

        startElectricity: Number(startElectricity) || 0,
        currentElectricity: Number(startElectricity) || 0, // Lúc mới tạo thì số hiện tại = số ban đầu
        startWater: Number(startWater) || 0,
        currentWater: Number(startWater) || 0,
        vehicleCount: Number(vehicleCount) || 0,

        // Nhóm Thành viên
        members: members,
        
        // Tạm trú mặc định
        residenceStatus: 'UNREGISTERED',

        // Tình trạng bàn giao
        conditionDescription: conditionDescription || '',
        conditionImages: conditionImagesFiles.length > 0 ? JSON.stringify(conditionImagesFiles) : '[]',
        conditionVideos: conditionVideosFiles.length > 0 ? JSON.stringify(conditionVideosFiles) : '[]'
      });

      // Bước 4: Đổi trạng thái phòng thành Đang Thuê
      await room.update({ status: 'RENTED' });

      res.status(201).json({
        message: 'Tạo hợp đồng thành công!',
        contract: newContract
      });
    } catch (error) {
      console.error("LỖI TẠO HỢP ĐỒNG:", error);
      res.status(500).json({ message: 'Lỗi server khi tạo hợp đồng!' });
    }
  },
  
  // 2. Lấy danh sách hợp đồng
  getAllContracts: async (req, res) => {
    try {
      const currentUserId = req.user.id;
      const role = req.user.role; // Giả sử req.user chứa role từ token

      let contractOptions = {
        include: [
          { model: User, as: 'tenant', attributes: ['fullName', 'email', 'identityNumber'] }
        ]
      };

      if (role === 'LANDLORD') {
        contractOptions.include.push({
          model: Room,
          as: 'room',
          attributes: ['roomNumber', 'roomCode', 'price', 'address', 'houseNumber'],
          paranoid: false, // <-- Thêm cái này để không mất hợp đồng của phòng đã xoá
          where: { landlordId: currentUserId },
          required: true // BẮT BUỘC: Chỉ lấy Hợp đồng của phòng do Chủ nhà này sở hữu
        });
      } else {
        // Nếu là TENANT, chỉ lấy hợp đồng của mình
        contractOptions.where = { tenantId: currentUserId };
        contractOptions.include.push({
          model: Room,
          as: 'room',
          paranoid: false, // <-- Thêm cái này nữa
          attributes: ['roomNumber', 'roomCode', 'price', 'address', 'houseNumber']
        });
      }

      const contracts = await RentalContract.findAll(contractOptions);
      res.status(200).json({ message: 'Thành công', contracts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },
  // Kết thúc hợp đồng cho thuê

  endContract: async (req, res) => {
    try {
      const contractId = req.params.id;
      
      // SỬ DỤNG ĐÚNG TÊN MODEL LÀ RentalContract
      const contract = await RentalContract.findByPk(contractId);
      
      if (!contract) return res.status(404).json({ message: 'Không tìm thấy hợp đồng!' });

      // 1. Đổi trạng thái hợp đồng thành Đã kết thúc (EXPIRED)
      await contract.update({ status: 'EXPIRED' });

      // 2. Tự động tìm phòng đó và đổi về trạng thái Trống (AVAILABLE)
      const room = await Room.findByPk(contract.roomId);
      if (room) {
        await room.update({ status: 'AVAILABLE' });
      }

      res.status(200).json({ message: 'Kết thúc hợp đồng thành công!' });
    } catch (error) {
      console.error("=== LỖI KẾT THÚC HỢP ĐỒNG ===", error);
      res.status(500).json({ message: 'Lỗi server khi kết thúc hợp đồng!' });
    }
  },
// 1. Khách thuê xem hợp đồng hiện tại của mình
  getMyContract: async (req, res) => {
    try {
      const tenantId = req.user.id; // Lấy ID của khách thuê từ token đăng nhập

      // Tìm hợp đồng ĐANG HOẠT ĐỘNG của người này
      const contract = await RentalContract.findOne({
        where: { 
          tenantId: tenantId,
          status: 'ACTIVE' 
        },
        include: [
          { model: Room, as: 'room', attributes: ['roomNumber', 'roomCode', 'price', 'address', 'houseNumber'] }
        ]
      });

      if (!contract) {
        return res.status(404).json({ message: 'Bạn chưa có hợp đồng thuê phòng nào đang hoạt động.' });
      }

      res.status(200).json({ message: 'Thành công', contract });
    } catch (error) {
      console.error("LỖI LẤY HỢP ĐỒNG KHÁCH THUÊ:", error);
      res.status(500).json({ message: 'Lỗi server khi tải thông tin hợp đồng!' });
    }
  },

// 5. CẬP NHẬT / GIA HẠN HỢP ĐỒNG TOÀN DIỆN
  // =========================================================
  updateContract: async (req, res) => {
    try {
      const contractId = req.params.id;
      const contract = await RentalContract.findByPk(contractId, {
        include: [{ model: Room, as: 'room' }]
      });

      if (!contract) return res.status(404).json({ message: 'Không tìm thấy hợp đồng!' });

      // Cập nhật các trường thông tin từ body
      const updateData = {
        landlordName: req.body.landlordName, landlordDob: req.body.landlordDob, landlordPhone: req.body.landlordPhone, landlordIdentityNumber: req.body.landlordIdentityNumber, landlordHometown: req.body.landlordHometown,
        tenantName: req.body.tenantName, tenantDob: req.body.tenantDob, tenantPhone: req.body.tenantPhone, tenantIdentityNumber: req.body.tenantIdentityNumber, tenantHometown: req.body.tenantHometown,
        startDate: req.body.startDate, endDate: req.body.endDate,
        price: Number(req.body.price) || 0, electricityPrice: Number(req.body.electricityPrice) || 0, waterPrice: Number(req.body.waterPrice) || 0, internetPrice: Number(req.body.internetPrice) || 0, parkingPrice: Number(req.body.parkingPrice) || 0, servicePrice: Number(req.body.servicePrice) || 0,
        vehicleCount: Number(req.body.vehicleCount) || 0,
        members: req.body.members,
        conditionDescription: req.body.conditionDescription || ''
      };

      // Nếu có up file mới thì ghi đè
      if (req.files) {
        if (req.files.contractImages && req.files.contractImages.length > 0) {
          updateData.contractImage = req.files.contractImages.map(file => file.filename);
        }
        if (req.files.conditionImages && req.files.conditionImages.length > 0) {
          updateData.conditionImages = JSON.stringify(req.files.conditionImages.map(file => file.filename));
        }
        if (req.files.conditionVideos && req.files.conditionVideos.length > 0) {
          updateData.conditionVideos = JSON.stringify(req.files.conditionVideos.map(file => file.filename));
        }
      }

      await contract.update(updateData);

      // Bắn thông báo cho Khách
      if (contract.tenantId) {
        await Notification.create({
          userId: contract.tenantId,
          title: '📝 Hợp đồng của bạn vừa được cập nhật',
          message: `Chủ nhà đã cập nhật nội dung hợp đồng phòng ${contract.room.roomNumber} (Gia hạn thời gian / Thay đổi giá / Cập nhật thành viên). Vui lòng vào xem lại chi tiết!`,
          type: 'SYSTEM',
          isRead: false
        });
      }

      res.status(200).json({ message: 'Cập nhật hợp đồng thành công!', contract });
    } catch (error) {
      console.error("Lỗi cập nhật hợp đồng:", error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật hợp đồng.' });
    }
  },
  // =========================================================
  // API: BÁO TRƯỚC KẾT THÚC THUÊ (NOTICE TO VACATE)
  // =========================================================
  requestTermination: async (req, res) => {
    try {
      const contractId = req.params.id;
      const { moveOutDate, reason } = req.body;
      const userId = req.user.id;
      const role = req.user.role;

      const contract = await RentalContract.findByPk(contractId, {
        include: [{ model: Room, as: 'room' }]
      });

      if (!contract || contract.status !== 'ACTIVE') {
        return res.status(400).json({ message: 'Hợp đồng không tồn tại hoặc đã kết thúc!' });
      }

      // 1. Validate thời gian (Phải báo trước ít nhất 30 ngày)
      const today = new Date();
      const targetDate = new Date(moveOutDate);
      const diffTime = Math.abs(targetDate - today);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      if (diffDays < 30) {
        return res.status(400).json({ message: 'Lỗi: Quy định bắt buộc phải báo trước ít nhất 30 ngày!' });
      }

      // 2. Lưu thông tin vào DB
      await contract.update({
        intendedMoveOutDate: moveOutDate,
        noticeGivenBy: role, // 'LANDLORD' hoặc 'TENANT'
        terminationReason: reason || 'Không có lý do cụ thể'
      });

      // 3. 🔔 Bắn Notification cho bên kia
      const targetUserId = role === 'LANDLORD' ? contract.tenantId : contract.room.landlordId;
      const senderName = role === 'LANDLORD' ? 'Chủ nhà' : 'Khách thuê';
      
      await Notification.create({
        userId: targetUserId,
        title: `⚠️ ${senderName} báo trước kết thúc hợp đồng!`,
        message: `${senderName} phòng ${contract.room.roomNumber} vừa thông báo sẽ kết thúc hợp đồng. Ngày dọn đi dự kiến: ${moveOutDate}. Lý do: ${reason || 'Không có'}.`,
        type: 'SYSTEM'
      });

      res.status(200).json({ message: 'Đã gửi thông báo kết thúc thuê thành công!', contract });
    } catch (error) {
      console.error("Lỗi khi báo trả phòng:", error);
      res.status(500).json({ message: 'Lỗi server khi xử lý yêu cầu.' });
    }
  },
  // =========================================================
  // 8. HỦY YÊU CẦU BÁO TRƯỚC KẾT THÚC THUÊ (QUAY XE)
  // =========================================================
  cancelTermination: async (req, res) => {
    try {
      const contractId = req.params.id;
      const role = req.user.role;

      const contract = await RentalContract.findByPk(contractId, {
        include: [{ model: Room, as: 'room' }]
      });

      if (!contract || contract.status !== 'ACTIVE') {
        return res.status(400).json({ message: 'Hợp đồng không tồn tại hoặc đã kết thúc!' });
      }

      // 1. Reset các trường về null để xóa trạng thái báo trả phòng
      await contract.update({
        intendedMoveOutDate: null,
        noticeGivenBy: null,
        terminationReason: null
      });

      // 2. 🔔 Bắn Notification báo cho người kia biết là đã "hủy kèo"
      const targetUserId = role === 'LANDLORD' ? contract.tenantId : contract.room.landlordId;
      const senderName = role === 'LANDLORD' ? 'Chủ nhà' : 'Khách thuê';
      
      await Notification.create({
        userId: targetUserId,
        title: `🔄 ${senderName} đã hủy yêu cầu kết thúc hợp đồng`,
        message: `${senderName} phòng ${contract.room.roomNumber} đã đổi ý, hủy yêu cầu dọn đi/lấy lại phòng. Hợp đồng vẫn tiếp tục có hiệu lực như bình thường.`,
        type: 'SYSTEM',
        isRead: false
      });

      res.status(200).json({ message: 'Đã hủy yêu cầu kết thúc thuê thành công!', contract });
    } catch (error) {
      console.error("Lỗi khi hủy báo trả phòng:", error);
      res.status(500).json({ message: 'Lỗi server khi xử lý yêu cầu.' });
    }
  },
  // 1. API LẤY DANH SÁCH ĐÁNH GIÁ CỦA KHÁCH THUÊ
  getMyReviews: async (req, res) => {
    try {
      const { Review } = require('../models');
      if (!Review) return res.status(200).json({ reviews: [] });
      
      const reviews = await Review.findAll({ where: { tenantId: req.user.id } });
      res.status(200).json({ reviews });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy danh sách đánh giá' });
    }
  },

  // 2. API GỬI HOẶC CẬP NHẬT ĐÁNH GIÁ (SỬA LẠI HÀM CŨ CỦA BẠN)
  submitReview: async (req, res) => {
    try {
      const contractId = req.params.id;
      const { rating, comment, isAnonymous } = req.body;
      const { RentalContract, Review } = require('../models');

      const contract = await RentalContract.findByPk(contractId);
      if (!contract) return res.status(404).json({ message: 'Không tìm thấy hợp đồng!' });

      const files = req.files || [];
      const images = files.filter(f => f.mimetype.startsWith('image/')).map(f => f.filename);
      const videos = files.filter(f => f.mimetype.startsWith('video/')).map(f => f.filename);

      // Kiểm tra xem khách đã đánh giá phòng này chưa
      let review = await Review.findOne({ where: { contractId: contractId } });

      if (review) {
        // NẾU ĐÃ ĐÁNH GIÁ -> CẬP NHẬT LẠI
        const updateData = { rating: Number(rating), comment, isAnonymous: isAnonymous === 'true' };
        // Chỉ ghi đè ảnh/video nếu khách có chọn upload file mới
        if (images.length > 0) updateData.images = JSON.stringify(images);
        if (videos.length > 0) updateData.videos = JSON.stringify(videos);

        await review.update(updateData);
        return res.status(200).json({ message: 'Cập nhật đánh giá thành công!', review });
      } else {
        // NẾU CHƯA ĐÁNH GIÁ -> TẠO MỚI
        review = await Review.create({
          contractId, roomId: contract.roomId, tenantId: req.user.id,
          rating: Number(rating), comment, isAnonymous: isAnonymous === 'true',
          images: JSON.stringify(images), videos: JSON.stringify(videos)
        });
        return res.status(201).json({ message: 'Đánh giá thành công!', review });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },
  // =========================================================
  // API: CHỦ NHÀ PHẢN HỒI ĐÁNH GIÁ
  // =========================================================
  replyToReview: async (req, res) => {
    try {
      const reviewId = req.params.id;
      const { replyText } = req.body;
      const landlordId = req.user.id;

      const review = await Review.findByPk(reviewId);
      if (!review) return res.status(404).json({ message: 'Không tìm thấy đánh giá!' });

      // Kiểm tra quyền: Phải là chủ nhà của phòng đó
      const room = await Room.findByPk(review.roomId);
      if (!room || room.landlordId !== landlordId) {
        return res.status(403).json({ message: 'Bạn không có quyền phản hồi đánh giá này!' });
      }

      review.landlordReply = replyText;
      review.replyDate = new Date();
      await review.save();

      res.status(200).json({ message: 'Đã gửi phản hồi!', review });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server khi gửi phản hồi.' });
    }
  },

  // 2. Khách thuê cập nhật minh chứng Tạm trú
// 2. Khách thuê cập nhật minh chứng Tạm trú (BẢN NÂNG CẤP ĐA ẢNH)
  updateResidenceProof: async (req, res) => {
    try {
      const tenantId = req.user.id;
      const contractId = req.params.id;

      // Hứng thêm thông tin ngày và nơi đăng ký từ Frontend
      const { residenceDate, residencePlace } = req.body;

      const contract = await RentalContract.findOne({
        where: { id: contractId, tenantId: tenantId, status: 'ACTIVE' }
      });

      if (!contract) return res.status(404).json({ message: 'Không tìm thấy hợp đồng hợp lệ!' });

      // Hứng mảng file ảnh
      const residenceFiles = req.files ? req.files.map(file => file.filename) : [];

      if (residenceFiles.length === 0) {
        return res.status(400).json({ message: 'Vui lòng đính kèm ít nhất 1 ảnh minh chứng!' });
      }

      await contract.update({
        residenceStatus: 'REGISTERED',
        residenceImage: residenceFiles, // Lưu mảng tên file
        residenceDate: residenceDate,   // Lưu ngày đăng ký
        residencePlace: residencePlace  // Lưu nơi đăng ký
      });

      res.status(200).json({ message: 'Cập nhật minh chứng tạm trú thành công!', contract });
    } catch (error) {
      console.error("LỖI CẬP NHẬT TẠM TRÚ:", error);
      res.status(500).json({ message: 'Lỗi server khi tải ảnh tạm trú lên!' });
    }
  }
};
module.exports = contractController;