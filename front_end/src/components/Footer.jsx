import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full py-16 bg-white border-t border-gray-100">
      <div className="max-w-[1280px] mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-6">
          <p className="text-2xl font-black text-blue-600 tracking-tighter">PHONGTROSIEUCAP</p>
          <p className="text-on-surface-variant leading-relaxed font-body-sm">
            Nền tảng tìm kiếm và cho thuê phòng trọ hàng đầu dành cho sinh viên Việt Nam. Uy tín, nhanh chóng và hiệu quả.
          </p>
        </div>
        <div>
          <p className="font-bold text-on-surface mb-6 uppercase tracking-wider text-xs">Về chúng tôi</p>
          <ul className="space-y-3">
            <li><Link to="#" className="text-on-surface-variant hover:text-primary transition-all text-sm">Giới thiệu</Link></li>
            <li><Link to="#" className="text-on-surface-variant hover:text-primary transition-all text-sm">Điều khoản dịch vụ</Link></li>
            <li><Link to="#" className="text-on-surface-variant hover:text-primary transition-all text-sm">Chính sách bảo mật</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-on-surface mb-6 uppercase tracking-wider text-xs">Hỗ trợ</p>
          <ul className="space-y-3">
            <li><Link to="#" className="text-on-surface-variant hover:text-primary transition-all text-sm">Trung tâm trợ giúp</Link></li>
            <li><Link to="#" className="text-on-surface-variant hover:text-primary transition-all text-sm">Liên hệ hỗ trợ</Link></li>
            <li><Link to="#" className="text-on-surface-variant hover:text-primary transition-all text-sm">Câu hỏi thường gặp</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-on-surface mb-6 uppercase tracking-wider text-xs">Liên hệ</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-primary text-xl">mail</span>
              support@phongtrosieucap.vn
            </div>
            <div className="flex items-center gap-3 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-primary text-xl">phone</span>
              1900 1234
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1280px] mx-auto px-8 mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-on-surface-variant text-sm">© 2024 PHONGTROSIEUCAP. All rights reserved.</p>
        <div className="flex gap-6">
          <span className="material-symbols-outlined cursor-pointer text-outline hover:text-primary transition-all" title="Language">public</span>
          <span className="material-symbols-outlined cursor-pointer text-outline hover:text-primary transition-all" title="Share">share</span>
          <span className="material-symbols-outlined cursor-pointer text-outline hover:text-primary transition-all" title="Like">thumb_up</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
