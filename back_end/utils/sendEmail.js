const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Hệ Thống Quản Lý Phòng Trọ" <${process.env.EMAIL_USER}>`,
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