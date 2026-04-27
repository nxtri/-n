import React from 'react';

/**
 * COMPONENT: AdminUsersTab
 * Chức năng: Quản lý người dùng trong hệ thống (Chủ nhà, Khách thuê, Admin).
 * Các tính năng chính:
 * 1. Gửi thông báo hàng loạt theo vai trò.
 * 2. Lọc danh sách người dùng theo vai trò.
 * 3. Xem thông tin chi tiết người dùng (Họ tên, Email, SĐT, Vi phạm).
 * 4. Khóa/Mở khóa tài khoản người dùng.
 * 5. Xóa tài khoản người dùng.
 */
const AdminUsersTab = ({ 
  notificationData,      // Dữ liệu cho form thông báo (targetRole, title, message)
  setNotificationData,   // Hàm cập nhật dữ liệu form thông báo
  handleSendNotification,// Hàm xử lý khi gửi thông báo
  roleFilter,           // Trạng thái lọc vai trò hiện tại
  setRoleFilter,        // Hàm cập nhật bộ lọc vai trò
  users,                // Danh sách tất cả người dùng từ API
  handleToggleUserStatus,// Hàm xử lý khóa/mở khóa tài khoản
  handleDeleteUser,      // Hàm xử lý xóa tài khoản
  handleViewDetails      // Hàm xử lý xem chi tiết người dùng
}) => {
  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">
      
      {/* PHẦN 1: FORM GỬI THÔNG BÁO HÀNG LOẠT */}
      <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30">
        <h3 className="m-0 mb-6 text-on-surface text-xl font-black flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-primary">campaign</span> Gửi Thông Báo Hàng Loạt
        </h3>
        <form onSubmit={handleSendNotification} className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">Gửi đến đối tượng</label>
              <select 
                value={notificationData.targetRole}
                onChange={(e) => setNotificationData({ ...notificationData, targetRole: e.target.value })}
                className="w-full p-3 border border-outline-variant/50 rounded-xl outline-none bg-surface-container-low text-on-surface focus:border-primary transition-colors focus:ring-2 focus:ring-primary/20 font-medium">
                <option value="ALL">Tất cả người dùng</option>
                <option value="LANDLORD">Chỉ Chủ Nhà</option>
                <option value="TENANT">Chỉ Khách Thuê</option>
              </select>
            </div>
            <div className="flex-[2]">
              <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">Tiêu đề thông báo</label>
              <input 
                type="text" 
                value={notificationData.title}
                onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                placeholder="VD: Cập nhật quy định mới..."
                className="w-full p-3 border border-outline-variant/50 rounded-xl outline-none bg-surface-container-low text-on-surface focus:border-primary transition-colors focus:ring-2 focus:ring-primary/20 font-medium" />
            </div>
          </div>
          <div>
            <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">Nội dung chi tiết</label>
            <textarea 
              value={notificationData.message}
              onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
              placeholder="Nhập nội dung cần gửi..."
              rows="3"
              className="w-full p-3 border border-outline-variant/50 rounded-xl resize-y outline-none bg-surface-container-low text-on-surface focus:border-primary transition-colors focus:ring-2 focus:ring-primary/20 font-medium"></textarea>
          </div>
          <button type="submit" className="self-start px-8 py-3.5 bg-primary text-white border-none rounded-xl cursor-pointer font-black shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 hover:shadow-xl active:translate-y-0 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">send</span> Gửi Thông Báo Ngay
          </button>
        </form>
      </div>

      {/* PHẦN 2: DANH SÁCH NGƯỜI DÙNG VÀ BỘ LỌC */}
      <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30">
        <div className="flex justify-between items-center mb-8">
          <h3 className="m-0 text-on-surface text-xl font-black flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-primary">groups</span> Danh Sách Người Dùng
          </h3>
          
          <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/30">
            <span className="text-[14px] font-bold text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">filter_list</span> Lọc vai trò:</span>
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border-none bg-transparent font-bold text-on-surface outline-none cursor-pointer">
              <option value="ALL">Tất cả</option>
              <option value="LANDLORD">Chủ Nhà</option>
              <option value="TENANT">Khách Thuê</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-outline-variant/30">
          <table className="w-full border-collapse text-left bg-surface-container-lowest">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
                <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Họ Tên</th>
                <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Email</th>
                <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Số Điện Thoại</th>
                <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Vai Trò</th>
                <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Lần vi phạm</th>
                <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Trạng Thái</th>
                <th className="p-4 text-[14px] font-black uppercase tracking-wider text-center whitespace-nowrap">Hành Động</th>
              </tr>
            </thead>
            <tbody className="font-medium text-on-surface">
              {users
                .filter(u => roleFilter === 'ALL' || u.role === roleFilter)
                .map(u => (
                <tr key={u.id} className="border-b border-outline-variant/10 transition-colors hover:bg-surface-container-low/50">
                  <td className="p-4 font-bold text-on-surface">{u.fullName}</td>
                  <td className="p-4 text-on-surface-variant">{u.email}</td>
                  <td className="p-4 text-on-surface-variant">{u.phone || <em className="text-on-surface-variant opacity-50">Chưa cập nhật</em>}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1.5 rounded-full text-[12px] font-bold border ${
                      u.role === 'ADMIN' ? 'bg-error/10 text-error border-error/20' : 
                      u.role === 'LANDLORD' ? 'bg-primary/10 text-primary border-primary/20' : 
                      'bg-secondary/10 text-secondary border-secondary/20'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                     {u.role === 'LANDLORD' ? (
                       <span className={`font-bold ${(u.violationsCount || 0) >= 2 ? 'text-error bg-error/10 px-2 py-0.5 rounded' : 'text-on-surface-variant'}`}>
                         {u.violationsCount || 0} lần
                       </span>
                     ) : (
                       <span className="text-outline-variant/50">-</span>
                     )}
                  </td>
                  <td className="p-4">
                    {u.isActive ? (
                      <span className="text-success font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success"></div> Đang hoạt động</span>
                    ) : (
                      <span className="text-error font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-error"></div> Bị khóa</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {u.role !== 'ADMIN' && (
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={() => handleViewDetails(u)}
                          className="px-3 py-1.5 cursor-pointer border border-primary/20 bg-primary/10 text-primary rounded-lg font-bold transition-all hover:scale-105 flex items-center gap-1.5 hover:bg-primary hover:text-white"
                          title="Xem chi tiết"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span> Chi tiết
                        </button>
                        <button 
                          onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                          className={`px-3 py-1.5 cursor-pointer border rounded-lg font-bold transition-all hover:scale-105 flex items-center gap-1.5 ${u.isActive ? 'border-error/20 bg-error/10 text-error hover:bg-error hover:text-white' : 'border-success/20 bg-success/10 text-success hover:bg-success hover:text-white'}`}
                          title={u.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                        >
                          <span className="material-symbols-outlined text-[16px]">{u.isActive ? 'lock' : 'lock_open'}</span> {u.isActive ? 'Khóa' : 'Mở'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersTab;
