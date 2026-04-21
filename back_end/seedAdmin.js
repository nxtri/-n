const bcrypt = require('bcryptjs');
const { User, sequelize } = require('./models');

const seedAdmin = async () => {
  try {
    // Kết nối vào database trước
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Đã kết nối Database và đồng bộ Schema.');

    const adminEmail = 'admin@gmail.com';
    const adminPassword = '123'; // Mật khẩu là 123 cho bạn dễ test

    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log('Tài khoản Admin đã tồn tại. Không cần tạo mới.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await User.create({
      fullName: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true
    });

    console.log(`Tạo Admin thành công! Email: ${adminEmail} | Pass: ${adminPassword}`);
    process.exit(0);

  } catch (error) {
    console.error('Lỗi khi tạo Admin:', error);
    process.exit(1);
  }
};

seedAdmin();
