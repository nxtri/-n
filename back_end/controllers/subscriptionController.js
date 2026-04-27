const { User, Transaction, SystemConfig, Room } = require('../models');
const notificationHelper = require('../utils/notificationHelper');

// =========================================================
// CONTROLLER: GÓI ĐĂNG KÝ (Subscription)
// Quản lý mua gói, lấy cấu hình gói, và admin setup giá
// =========================================================

// Bảng cấu hình mặc định các gói (sẽ bị override bởi SystemConfig nếu Admin đã cấu hình)
const DEFAULT_PLANS = {
  BRONZE:  { name: 'Đồng',     price: 100000, limit: 10, retailPrice: 7000, borderColor: 'none' },
  SILVER:  { name: 'Bạc',      price: 200000, limit: 25, retailPrice: 10000, borderColor: '#86efac' },
  GOLD:    { name: 'Vàng',     price: 400000, limit: 55, retailPrice: 15000, borderColor: '#2dd4bf' },
  DIAMOND: { name: 'Kim Cương', price: 600000, limit: -1, retailPrice: 20000, borderColor: '#facc15' }
};

const subscriptionController = {

  // -------------------------------------------------------
  // 1. LẤY DANH SÁCH CÁC GÓI (Public - Ai cũng xem được)
  // -------------------------------------------------------
  getPlans: async (req, res) => {
    try {
      const plans = { ...DEFAULT_PLANS };

      // Override bằng giá trị từ SystemConfig (nếu Admin đã cấu hình)
      const configKeys = [];
      for (const key in DEFAULT_PLANS) {
        configKeys.push(`PLAN_${key}_PRICE`, `PLAN_${key}_LIMIT`, `PLAN_${key}_RETAIL_PRICE`);
      }

      const configs = await SystemConfig.findAll({ where: { key: configKeys } });

      configs.forEach(c => {
        const parts = c.key.split('_'); // e.g. PLAN, BRONZE, PRICE
        if (parts.length >= 3) {
          const planKey = parts[1];
          const attrKey = parts.slice(2).join('_'); // PRICE, LIMIT, RETAIL_PRICE
          if (plans[planKey]) {
            if (attrKey === 'PRICE') plans[planKey].price = parseFloat(c.value);
            if (attrKey === 'LIMIT') plans[planKey].limit = parseInt(c.value);
            if (attrKey === 'RETAIL_PRICE') plans[planKey].retailPrice = parseFloat(c.value);
          }
        }
      });

      res.status(200).json({ plans });
    } catch (error) {
      console.error('Lỗi lấy danh sách gói:', error);
      res.status(500).json({ message: 'Lỗi server!' });
    }
  },

  // -------------------------------------------------------
  // 2. CHỦ NHÀ: Mua / Gia hạn gói dịch vụ
  // -------------------------------------------------------
  buyPlan: async (req, res) => {
    try {
      const { plan, months, isRetail, extraRooms, actionType } = req.body;
      // actionType: 'BUY_BASE', 'BUY_RETAIL_NEW', 'BUY_RETAIL_ADD'
      
      if (!plan || !DEFAULT_PLANS[plan]) {
        return res.status(400).json({ message: 'Gói dịch vụ không hợp lệ!' });
      }

      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng!' });

      // Lấy giá gói & giá lẻ thực tế từ DB
      let planPrice = DEFAULT_PLANS[plan].price;
      let retailPrice = DEFAULT_PLANS[plan].retailPrice;
      const configPrice = await SystemConfig.findOne({ where: { key: `PLAN_${plan}_PRICE` } });
      const configRetail = await SystemConfig.findOne({ where: { key: `PLAN_${plan}_RETAIL_PRICE` } });
      if (configPrice) planPrice = parseFloat(configPrice.value);
      if (configRetail) retailPrice = parseFloat(configRetail.value);

      const now = new Date();
      let totalCost = 0;
      let description = '';

      if (actionType === 'BUY_RETAIL_NEW') {
        if (!months || months <= 0 || !extraRooms || extraRooms <= 0) return res.status(400).json({ message: 'Dữ liệu không hợp lệ!' });
        totalCost = retailPrice * extraRooms * months;
        description = `Mua lẻ ${extraRooms} phòng gói ${DEFAULT_PLANS[plan].name} - ${months} tháng`;
        
        if (user.balance < totalCost) return res.status(400).json({ message: 'Số dư không đủ!' });

        user.balance -= totalCost;
        user.subscriptionPlan = plan;
        let baseDate = (user.subscriptionExpiry && new Date(user.subscriptionExpiry) > now) ? new Date(user.subscriptionExpiry) : now;
        baseDate.setMonth(baseDate.getMonth() + parseInt(months));
        user.subscriptionExpiry = baseDate;
        user.hasBasePlan = false;
        user.extraRoomLimit = parseInt(extraRooms);

      } else if (actionType === 'BUY_RETAIL_ADD') {
        if (!extraRooms || extraRooms <= 0) return res.status(400).json({ message: 'Dữ liệu không hợp lệ!' });
        if (!user.subscriptionExpiry || new Date(user.subscriptionExpiry) < now) {
          return res.status(400).json({ message: 'Gói hiện tại đã hết hạn, không thể đồng bộ!' });
        }
        if (user.subscriptionPlan !== plan) {
          return res.status(400).json({ message: 'Chỉ được mua thêm phòng lẻ cho gói cùng hạng!' });
        }

        const expiryDate = new Date(user.subscriptionExpiry);
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0) return res.status(400).json({ message: 'Gói hiện tại sắp hết hạn!' });

        // Công thức tính tiền: (Giá lẻ / 30 ngày) * số ngày còn lại * số phòng
        totalCost = (retailPrice / 30) * daysLeft * extraRooms;
        totalCost = Math.round(totalCost);

        description = `Mua thêm ${extraRooms} phòng lẻ (Đồng bộ thời hạn ${daysLeft} ngày)`;
        
        if (user.balance < totalCost) return res.status(400).json({ message: 'Số dư không đủ!' });

        user.balance -= totalCost;
        user.extraRoomLimit = (user.extraRoomLimit || 0) + parseInt(extraRooms);

      } else {
        // ACTION: BUY_BASE (Mua gói chính - Có thể là nâng cấp/hạ cấp/gia hạn)
        if (!months || months <= 0) return res.status(400).json({ message: 'Số tháng không hợp lệ!' });
        
        // Tính giá trị gói cũ còn dư (nếu gói đang là gói CHÍNH và chưa hết hạn)
        let remainingValue = 0;
        if (user.hasBasePlan && user.subscriptionPlan !== 'NONE' && user.subscriptionExpiry && new Date(user.subscriptionExpiry) > now) {
           const oldExpiry = new Date(user.subscriptionExpiry);
           const daysLeft = Math.ceil((oldExpiry - now) / (1000 * 60 * 60 * 24));
           
           // Lấy giá gói cũ
           let oldPlanPrice = DEFAULT_PLANS[user.subscriptionPlan]?.price || 0;
           const oldConfigPrice = await SystemConfig.findOne({ where: { key: `PLAN_${user.subscriptionPlan}_PRICE` } });
           if (oldConfigPrice) oldPlanPrice = parseFloat(oldConfigPrice.value);
           
           remainingValue = (oldPlanPrice / 30) * daysLeft;
        }

        const newPlanCost = planPrice * months;
        totalCost = newPlanCost - remainingValue;
        totalCost = Math.round(totalCost);

        if (totalCost < 0) totalCost = 0; // Trả tiền âm -> Báo giá 0 đ, dư không hoàn

        if (user.balance < totalCost) return res.status(400).json({ message: 'Số dư không đủ!' });

        description = `Mua gói ${DEFAULT_PLANS[plan].name} chính - ${months} tháng`;
        if (remainingValue > 0) description += ` (Đã trừ ${Math.round(remainingValue).toLocaleString('vi-VN')} đ giá trị gói cũ)`;

        user.balance -= totalCost;
        user.subscriptionPlan = plan;
        
        // Nếu cùng gói thì cộng dồn ngày, nếu khác gói thì đè ngày từ NOW
        if (user.subscriptionPlan === plan && user.subscriptionExpiry && new Date(user.subscriptionExpiry) > now) {
            const baseDate = new Date(user.subscriptionExpiry);
            baseDate.setMonth(baseDate.getMonth() + parseInt(months));
            user.subscriptionExpiry = baseDate;
        } else {
            const baseDate = now;
            baseDate.setMonth(baseDate.getMonth() + parseInt(months));
            user.subscriptionExpiry = baseDate;
        }
        
        user.hasBasePlan = true;
        user.extraRoomLimit = 0; // Hủy toàn bộ gói lẻ khi mua gói chính mới
      }

      await user.save();

      // Tạo giao dịch
      if (totalCost > 0) {
        await Transaction.create({
          userId: user.id,
          amount: -totalCost,
          type: 'SUBSCRIPTION',
          status: 'COMPLETED',
          description: description
        });

        // Notify Admins
        await notificationHelper.notifyAdmins(
          'Đăng Ký Gói Dịch Vụ',
          `Chủ nhà ${user.fullName} (${user.phone}) vừa đăng ký: ${description} với giá ${totalCost.toLocaleString('vi-VN')} đ.`
        );
      }

      res.status(200).json({ 
        message: 'Giao dịch thành công!',
        user: {
          balance: user.balance,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionExpiry: user.subscriptionExpiry,
          hasBasePlan: user.hasBasePlan,
          extraRoomLimit: user.extraRoomLimit
        }
      });
    } catch (error) {
      console.error('Lỗi mua gói:', error);
      res.status(500).json({ message: 'Lỗi server khi mua gói!' });
    }
  },

  // -------------------------------------------------------
  // 3. ADMIN: Cập nhật cấu hình giá gói
  // -------------------------------------------------------
  updatePlanConfig: async (req, res) => {
    try {
      const { planConfigs } = req.body;
      // planConfigs = { BRONZE: { price: 100000, limit: 10, retailPrice: 7000 }, SILVER: {...}, ... }

      const upsertConfig = async (key, value) => {
        const existing = await SystemConfig.findOne({ where: { key } });
        if (existing) {
          existing.value = String(value);
          await existing.save();
        } else {
          await SystemConfig.create({ key, value: String(value), target: 'ALL' });
        }
      };

      for (const [planKey, config] of Object.entries(planConfigs)) {
        if (config.price !== undefined) await upsertConfig(`PLAN_${planKey}_PRICE`, config.price);
        if (config.limit !== undefined) await upsertConfig(`PLAN_${planKey}_LIMIT`, config.limit);
        if (config.retailPrice !== undefined) await upsertConfig(`PLAN_${planKey}_RETAIL_PRICE`, config.retailPrice);
      }

      res.status(200).json({ message: 'Cập nhật cấu hình gói dịch vụ thành công!' });
    } catch (error) {
      console.error('Lỗi cập nhật cấu hình gói:', error);
      res.status(500).json({ message: 'Lỗi server!' });
    }
  }
};

module.exports = subscriptionController;
