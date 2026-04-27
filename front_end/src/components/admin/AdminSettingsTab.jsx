import React from 'react';

// Icons hiển thị/ẩn mật khẩu
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

/**
 * COMPONENT: AdminSettingsTab
 * Chức năng: Quản lý thông tin cá nhân và bảo mật của tài khoản Admin.
 * Hiện tại hỗ trợ tính năng: Thay đổi mật khẩu.
 */
const AdminSettingsTab = ({ 
  handleSavePassword,   // Hàm xử lý gửi yêu cầu đổi mật khẩu lên server
  passwordData,         // Đối tượng chứa dữ liệu input (old, new, confirm password)
  setPasswordData,      // Hàm cập nhật dữ liệu input
  showOldPwd,           // Trạng thái hiển thị mật khẩu hiện tại
  setShowOldPwd,        // Hàm ẩn/hiện mật khẩu hiện tại
  showNewPwd,           // Trạng thái hiển thị mật khẩu mới
  setShowNewPwd,        // Hàm ẩn/hiện mật khẩu mới
  showConfirmPwd,       // Trạng thái hiển thị xác nhận mật khẩu mới
  setShowConfirmPwd     // Hàm ẩn/hiện xác nhận mật khẩu mới
}) => {
  return (
    <div className="max-w-[500px] my-10 mx-auto">
      <div className="bg-surface-container-lowest p-10 rounded-3xl border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <h3 className="m-0 mb-8 text-on-surface text-2xl font-black flex items-center justify-center gap-3">
          <span className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 material-symbols-outlined text-[24px]">lock_reset</span> Thay đổi mật khẩu
        </h3>
        
        <form onSubmit={handleSavePassword} className="flex flex-col gap-6">
          {/* Trường: Mật khẩu hiện tại */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-[14px] text-on-surface-variant ml-1">Mật khẩu hiện tại</label>
            <div className="relative w-full">
              <input 
                type={showOldPwd ? "text" : "password"}
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3.5 pr-12 border border-outline-variant/50 rounded-xl outline-none text-[14px] font-medium transition-all bg-surface-container-lowest text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/10"
              />
              <button 
                type="button" 
                onClick={() => setShowOldPwd(!showOldPwd)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-on-surface-variant p-1 flex items-center justify-center hover:text-primary transition-colors"
              >
                {showOldPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Trường: Mật khẩu mới */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-[14px] text-on-surface-variant ml-1">Mật khẩu mới</label>
            <div className="relative w-full">
              <input 
                type={showNewPwd ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Tối thiểu 6 ký tự"
                required
                className="w-full px-4 py-3.5 pr-12 border border-outline-variant/50 rounded-xl outline-none text-[14px] font-medium transition-all bg-surface-container-lowest text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/10"
              />
              <button 
                type="button" 
                onClick={() => setShowNewPwd(!showNewPwd)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-on-surface-variant p-1 flex items-center justify-center hover:text-primary transition-colors"
              >
                {showNewPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Trường: Xác nhận mật khẩu mới */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-[14px] text-on-surface-variant ml-1">Xác nhận mật khẩu mới</label>
            <div className="relative w-full">
              <input 
                type={showConfirmPwd ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Nhập lại mật khẩu mới"
                required
                className="w-full px-4 py-3.5 pr-12 border border-outline-variant/50 rounded-xl outline-none text-[14px] font-medium transition-all bg-surface-container-lowest text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/10"
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPwd(!showConfirmPwd)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-on-surface-variant p-1 flex items-center justify-center hover:text-primary transition-colors"
              >
                {showConfirmPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="mt-2">
            <button 
              type="submit" 
              className="w-full p-4 bg-primary text-white border-none rounded-xl cursor-pointer font-black text-[15px] transition-all shadow-lg shadow-primary/20 hover:-translate-y-1 hover:shadow-xl active:translate-y-0"
            >
              Cập nhật mật khẩu 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettingsTab;
