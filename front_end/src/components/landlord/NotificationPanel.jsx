import React from 'react';

/**
 * Component NotificationPanel
 * Chức năng: Hiển thị biểu tượng chuông và danh sách các thông báo của người dùng.
 * - Hiển thị số lượng thông báo chưa đọc.
 * - Cho phép xem danh sách thông báo và đánh dấu là đã đọc khi nhấn vào.
 */
const NotificationPanel = ({
  notificationRef,         // Reference tới phần tử bọc ngoài (để xử lý click outside)
  notifications,           // Danh sách các thông báo nhận được từ server
  showNotifications,       // State boolean để ẩn/hiện bảng thông báo
  setShowNotifications,    // Hàm cập nhật trạng thái ẩn/hiện
  handleReadNotification,  // Hàm xử lý khi người dùng nhấn vào một thông báo để đọc
}) => {
  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="bg-surface-container-low border border-outline-variant/30 text-on-surface-variant w-10 h-10 rounded-full flex justify-center items-center cursor-pointer relative hover:scale-110 hover:bg-surface-container-high transition-all shadow-sm"
        title="Thông báo"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {notifications.filter(n => !n.isRead).length > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm border border-white">
            {notifications.filter(n => !n.isRead).length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 top-[120%] w-[380px] bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-4 origin-top-right">
          <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/30 font-black text-on-surface flex justify-between items-center">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">notifications_active</span>
              Thông báo của bạn
            </span>
            <span className="text-[11px] font-bold opacity-60 bg-surface-container-high px-2 py-1 rounded-md">
              {notifications.filter(n => !n.isRead).length} chưa đọc
            </span>
          </div>

          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant italic font-medium opacity-60">Chưa có thông báo nào</div>
            ) : (
              notifications.map(noti => (
                <div
                  key={noti.id}
                  onClick={() => handleReadNotification(noti.id)}
                  className={`p-5 border-b border-outline-variant/10 cursor-pointer transition-all hover:bg-surface-container-low flex gap-4 ${noti.isRead ? 'bg-surface-container-lowest opacity-70' : 'bg-primary/5 relative'}`}
                >
                  {!noti.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${noti.isRead ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary/20 text-primary'}`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {noti.title.includes('Sự cố') ? 'engineering' : noti.title.includes('Hóa đơn') ? 'receipt_long' : 'notifications'}
                    </span>
                  </div>
                  <div>
                    <div className={`font-black text-[14px] mb-1 leading-tight ${noti.isRead ? 'text-on-surface' : 'text-primary'}`}>{noti.title}</div>
                    <div className="text-[13px] text-on-surface-variant whitespace-pre-wrap leading-relaxed font-medium">{noti.message}</div>
                    <div className="text-[11px] text-on-surface-variant mt-2 opacity-60 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {new Date(noti.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
