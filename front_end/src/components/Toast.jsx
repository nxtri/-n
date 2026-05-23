import React, { useEffect, useState } from 'react';

/**
 * Component Toast Notification
 * Hiển thị popup nhỏ ở góc trên bên phải khi có thông báo mới từ Socket.io.
 * Tự động ẩn sau 5 giây hoặc khi người dùng nhấn nút đóng.
 */
const Toast = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      setIsLeaving(false);

      // Tự động ẩn sau 5 giây
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsLeaving(false);
      if (onClose) onClose();
    }, 300); // Đợi animation kết thúc
  };

  if (!notification || !isVisible) return null;

  // Chọn icon dựa trên tiêu đề thông báo
  const getIcon = (title) => {
    if (!title) return 'notifications';
    if (title.includes('Sự cố') || title.includes('sự cố')) return 'engineering';
    if (title.includes('Hóa đơn') || title.includes('hóa đơn')) return 'receipt_long';
    if (title.includes('Hợp đồng') || title.includes('hợp đồng')) return 'description';
    if (title.includes('thanh toán') || title.includes('Thanh toán')) return 'payments';
    return 'notifications_active';
  };

  return (
    <div
      className={`fixed top-5 right-5 z-[99999] max-w-[380px] w-full pointer-events-auto transition-all duration-300 ease-out ${
        isLeaving 
          ? 'opacity-0 translate-x-[120%]' 
          : 'opacity-100 translate-x-0'
      }`}
      style={{
        animation: isLeaving ? 'none' : 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden">
        {/* Thanh màu primary ở trên cùng */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"></div>
        
        <div className="p-4 flex gap-3 items-start">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-600 text-xl">
              {getIcon(notification.title)}
            </span>
          </div>

          {/* Nội dung */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Thông báo mới</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            </div>
            <p className="text-[14px] font-bold text-gray-900 leading-tight truncate">
              {notification.title}
            </p>
            <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
              {notification.message}
            </p>
          </div>

          {/* Nút đóng */}
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* CSS animation inline */}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(120%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
