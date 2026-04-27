const { Transaction, User, SystemConfig } = require('../models');
const notificationHelper = require('../utils/notificationHelper');

// =========================================================
// CONTROLLER: VÍ ĐIỆN TỬ (Wallet)
// Quản lý nạp tiền, duyệt nạp, xem lịch sử giao dịch
// =========================================================
const walletController = {

  // -------------------------------------------------------
  // 1. CHỦ NHÀ: Tạo yêu cầu nạp tiền (kèm ảnh minh chứng)
  // -------------------------------------------------------
  createDeposit: async (req, res) => {
    try {
      const { amount } = req.body;
      const proofImage = req.file ? req.file.filename : null;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Số tiền không hợp lệ!' });
      }
      if (!proofImage) {
        return res.status(400).json({ message: 'Vui lòng tải lên ảnh minh chứng chuyển khoản!' });
      }

      const transaction = await Transaction.create({
        userId: req.user.id,
        amount: parseFloat(amount),
        type: 'DEPOSIT',
        status: 'PENDING',
        description: `Yêu cầu nạp ${parseFloat(amount).toLocaleString('vi-VN')} đ vào ví`,
        proofImage: proofImage
      });

      res.status(201).json({ message: 'Đã gửi yêu cầu nạp tiền! Vui lòng chờ Admin xác nhận.', transaction });
    } catch (error) {
      console.error('Lỗi tạo yêu cầu nạp tiền:', error);
      res.status(500).json({ message: 'Lỗi server khi tạo yêu cầu nạp tiền!' });
    }
  },

  // -------------------------------------------------------
  // 2. CHỦ NHÀ: Xem lịch sử giao dịch của mình
  // -------------------------------------------------------
  getMyTransactions: async (req, res) => {
    try {
      const transactions = await Transaction.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      });
      res.status(200).json({ transactions });
    } catch (error) {
      console.error('Lỗi lấy lịch sử giao dịch:', error);
      res.status(500).json({ message: 'Lỗi server!' });
    }
  },

  // -------------------------------------------------------
  // 3. CHỦ NHÀ: Lấy thông tin ví (số dư, gói hiện tại)
  // -------------------------------------------------------
  getMyWallet: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'balance', 'subscriptionPlan', 'subscriptionExpiry', 'hasBasePlan', 'extraRoomLimit']
      });
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
      res.status(200).json({ wallet: user });
    } catch (error) {
      console.error('Lỗi lấy thông tin ví:', error);
      res.status(500).json({ message: 'Lỗi server!' });
    }
  },

  // -------------------------------------------------------
  // 4. CHỦ NHÀ: Lấy thông tin ngân hàng của Admin (để hiện QR)
  // -------------------------------------------------------
  getAdminBankInfo: async (req, res) => {
    try {
      const bankId = await SystemConfig.findOne({ where: { key: 'ADMIN_BANK_ID' } });
      const bankAccount = await SystemConfig.findOne({ where: { key: 'ADMIN_BANK_ACCOUNT' } });
      const bankName = await SystemConfig.findOne({ where: { key: 'ADMIN_BANK_NAME' } });

      res.status(200).json({
        bankInfo: {
          bankId: bankId?.value || '',
          bankAccount: bankAccount?.value || '',
          bankName: bankName?.value || ''
        }
      });
    } catch (error) {
      console.error('Lỗi lấy thông tin ngân hàng Admin:', error);
      res.status(500).json({ message: 'Lỗi server!' });
    }
  },

  // =========================================================
  // ADMIN: Quản lý các yêu cầu nạp tiền
  // =========================================================

  // 5. ADMIN: Lấy danh sách tất cả giao dịch (kèm thông tin user)
  getAllTransactions: async (req, res) => {
    try {
      const transactions = await Transaction.findAll({
        include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] }],
        order: [['createdAt', 'DESC']]
      });
      res.status(200).json({ transactions });
    } catch (error) {
      console.error('Lỗi lấy danh sách giao dịch:', error);
      res.status(500).json({ message: 'Lỗi server!' });
    }
  },

  // 6. ADMIN: Duyệt yêu cầu nạp tiền
  approveDeposit: async (req, res) => {
    try {
      const transaction = await Transaction.findByPk(req.params.id);
      if (!transaction) return res.status(404).json({ message: 'Không tìm thấy giao dịch!' });
      if (transaction.status !== 'PENDING') return res.status(400).json({ message: 'Giao dịch này đã được xử lý!' });

      // Cộng tiền vào ví chủ nhà
      const user = await User.findByPk(transaction.userId);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy chủ nhà!' });

      user.balance = (user.balance || 0) + transaction.amount;
      await user.save();

      transaction.status = 'APPROVED';
      await transaction.save();

      // Gửi thông báo cho chủ nhà
      await notificationHelper.send(
        user.id,
        '✅ Nạp tiền thành công',
        `Admin đã xác nhận khoản nạp ${transaction.amount.toLocaleString('vi-VN')} đ vào ví của bạn. Số dư hiện tại: ${user.balance.toLocaleString('vi-VN')} đ.`
      );

      res.status(200).json({ message: `Đã duyệt nạp ${transaction.amount.toLocaleString('vi-VN')} đ cho ${user.fullName}!` });
    } catch (error) {
      console.error('Lỗi duyệt nạp tiền:', error);
      res.status(500).json({ message: 'Lỗi server!' });
    }
  },

  // 7. ADMIN: Từ chối yêu cầu nạp tiền
  rejectDeposit: async (req, res) => {
    try {
      const transaction = await Transaction.findByPk(req.params.id);
      if (!transaction) return res.status(404).json({ message: 'Không tìm thấy giao dịch!' });
      if (transaction.status !== 'PENDING') return res.status(400).json({ message: 'Giao dịch này đã được xử lý!' });

      transaction.status = 'REJECTED';
      await transaction.save();

      // Gửi thông báo từ chối
      const user = await User.findByPk(transaction.userId);
      if (user) {
        await notificationHelper.send(
          user.id,
          '❌ Yêu cầu nạp tiền bị từ chối',
          `Admin đã từ chối yêu cầu nạp ${transaction.amount.toLocaleString('vi-VN')} đ. Vui lòng kiểm tra lại thông tin chuyển khoản và thử lại.`
        );
      }

      res.status(200).json({ message: 'Đã từ chối yêu cầu nạp tiền!' });
    } catch (error) {
      console.error('Lỗi từ chối nạp tiền:', error);
      res.status(500).json({ message: 'Lỗi server!' });
    }
  },

  // =========================================================
  // ADMIN: Cấu hình ngân hàng nhận tiền
  // =========================================================
  updateAdminBankInfo: async (req, res) => {
    try {
      const { bankId, bankAccount, bankName } = req.body;
      
      const upsertConfig = async (key, value) => {
        const existing = await SystemConfig.findOne({ where: { key } });
        if (existing) {
          existing.value = value;
          await existing.save();
        } else {
          await SystemConfig.create({ key, value, target: 'ALL' });
        }
      };

      await upsertConfig('ADMIN_BANK_ID', bankId || '');
      await upsertConfig('ADMIN_BANK_ACCOUNT', bankAccount || '');
      await upsertConfig('ADMIN_BANK_NAME', bankName || '');

      res.status(200).json({ message: 'Cập nhật thông tin ngân hàng thành công!' });
    } catch (error) {
      console.error('Lỗi cập nhật thông tin ngân hàng:', error);
      res.status(500).json({ message: 'Lỗi server!' });
    }
  }
};

module.exports = walletController;
