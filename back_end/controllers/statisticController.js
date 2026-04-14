const { Room, RentalContract, ServiceBill } = require('../models');

const statisticController = {
  // Thống kê doanh thu theo năm (chia ra từng tháng)
  getRevenueByYear: async (req, res) => {
    try {
      const landlordId = req.user.id; // Lấy ID chủ nhà từ Token
      const year = req.query.year || new Date().getFullYear(); // Lấy năm từ URL (nếu không có thì lấy năm hiện tại)

      // Bước 1: Tìm tất cả các phòng của chủ nhà này (cả phòng đã bị xoá phần mềm)
      const rooms = await Room.findAll({ 
        where: { landlordId: landlordId },
        paranoid: false 
      });
      const roomIds = rooms.map(room => room.id); // Lấy ra một mảng chỉ chứa các ID của phòng

      if (roomIds.length === 0) {
        return res.status(200).json({ message: 'Bạn chưa có phòng nào!', totalYearly: 0, monthlyData: [] });
      }

      // Bước 2: Tìm tất cả các hợp đồng của các phòng trên
      const contracts = await RentalContract.findAll({ where: { roomId: roomIds } });
      const contractIds = contracts.map(contract => contract.id);

      // Bước 3: Tìm tất cả hóa đơn ĐÃ THANH TOÁN của các hợp đồng trên trong năm yêu cầu
      const bills = await ServiceBill.findAll({
        where: {
          contractId: contractIds,
          year: year,
          status: 'PAID' // Chỉ tính hóa đơn đã thu được tiền
        }
      });

      // Bước 4: Tạo một mảng 12 tháng (từ tháng 1 đến tháng 12) với doanh thu ban đầu là 0
      let monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        totalRevenue: 0
      }));

      let totalYearly = 0;

      // Cộng dồn tiền vào từng tháng tương ứng
      bills.forEach(bill => {
        // bill.month chạy từ 1 -> 12, nên chỉ số trong mảng là bill.month - 1
        const monthIndex = bill.month - 1; 
        monthlyData[monthIndex].totalRevenue += bill.totalAmount;
        totalYearly += bill.totalAmount; // Cộng vào tổng cả năm
      });

      res.status(200).json({
        message: `Thống kê doanh thu năm ${year} thành công!`,
        year: year,
        totalYearly: totalYearly,
        monthlyData: monthlyData
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Lỗi server khi thống kê doanh thu!' });
    }
  }
};

module.exports = statisticController;