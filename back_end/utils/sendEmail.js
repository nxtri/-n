const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'xuantri6262@gmail.com', // Thay bằng Email thật của bạn
        pass: 'aojk wmay uggt upzb'       // Mật khẩu ứng dụng (App Password) của Gmail
      }
    });

    await transporter.sendMail({
      from: '"Hệ Thống Quản Lý Phòng Trọ" <email.cua.ban@gmail.com>',
      to: to,
      subject: subject,
      text: text
    });
    console.log(`Đã gửi email thành công tới: ${to}`);
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
  }
};

module.exports = sendEmail;