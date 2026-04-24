import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';

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

const ProfileModal = ({ user, onClose }) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '', phone: user?.phone || '',
    dob: user?.dob || '', address: user?.address || '', identityNumber: user?.identityNumber || '',
    bankName: user?.bankName || 'MB', accountNumber: user?.accountNumber || '', accountHolder: user?.accountHolder || ''
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '', newPassword: '', confirmPassword: ''
  });
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const handleSaveProfile = async () => {
    try {
      const response = await axiosClient.put('/auth/profile', profileData);
      localStorage.setItem('user', JSON.stringify(response.user));
      alert('Cập nhật thông tin thành công!');
      setIsEditingProfile(false);
      window.location.reload();
    } catch (error) {
      alert('Lỗi khi cập nhật thông tin!');
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return alert('Mật khẩu mới không khớp nhau!');
    }
    if (passwordData.newPassword.length < 6) {
      return alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
    }

    try {
      await axiosClient.put('/auth/change-password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      
      alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login'; 
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi đổi mật khẩu!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
      <div className="bg-white w-full max-w-[550px] rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/20 animate-in fade-in slide-in-from-bottom-8 duration-300">
        <div className="p-8 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full hover:bg-surface-container transition-all flex items-center justify-center text-outline"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <h2 className="text-2xl font-bold text-on-surface text-center mb-8">
            {isChangingPassword ? '🔐 Đổi mật khẩu' : isEditingProfile ? '✍️ Cập nhật hồ sơ' : '👤 Thông tin cá nhân'}
          </h2>

          {isChangingPassword ? (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant px-1">Mật khẩu cũ</label>
                <div className="relative">
                  <input 
                    type={showOldPwd ? "text" : "password"}
                    className="w-full p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                  />
                  <button onClick={() => setShowOldPwd(!showOldPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors">
                    {showOldPwd ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant px-1">Mật khẩu mới</label>
                <div className="relative">
                  <input 
                    type={showNewPwd ? "text" : "password"}
                    className="w-full p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                  <button onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors">
                    {showNewPwd ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant px-1">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input 
                    type={showConfirmPwd ? "text" : "password"}
                    className="w-full p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                  <button onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors">
                    {showConfirmPwd ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsChangingPassword(false)}
                  className="flex-1 py-3.5 font-bold text-on-surface-variant hover:bg-surface-container transition-all rounded-xl border border-outline-variant/30"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSavePassword}
                  className="flex-1 py-3.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          ) : isEditingProfile ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant px-1">Họ và tên</label>
                  <input className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant px-1">Số điện thoại</label>
                  <input className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant px-1">Ngày sinh</label>
                  <input type="date" className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={profileData.dob} onChange={e => setProfileData({...profileData, dob: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant px-1">Số CMND/CCCD</label>
                  <input className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={profileData.identityNumber} onChange={e => setProfileData({...profileData, identityNumber: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant px-1">Địa chỉ thường trú</label>
                <input className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} />
              </div>

              <div className="pt-4 border-t border-outline-variant/20">
                <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-4">Thông tin ngân hàng</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant px-1">Ngân hàng</label>
                    <select className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl outline-none" value={profileData.bankName} onChange={e => setProfileData({...profileData, bankName: e.target.value})}>
                      <option value="MB">MB Bank</option><option value="VCB">Vietcombank</option><option value="TCB">Techcombank</option><option value="BIDV">BIDV</option><option value="AGRI">Agribank</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant px-1">Số tài khoản</label>
                    <input className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl outline-none" value={profileData.accountNumber} onChange={e => setProfileData({...profileData, accountNumber: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5 mt-4">
                  <label className="text-xs font-bold text-on-surface-variant px-1">Chủ tài khoản</label>
                  <input className="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl outline-none" value={profileData.accountHolder} onChange={e => setProfileData({...profileData, accountHolder: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-3.5 font-bold text-on-surface-variant hover:bg-surface-container transition-all rounded-xl border border-outline-variant/30">Hủy</button>
                <button onClick={handleSaveProfile} className="flex-1 py-3.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20">Lưu thay đổi</button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-primary-fixed-dim flex items-center justify-center text-4xl font-black text-on-primary-fixed mb-4 shadow-xl border-4 border-white">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <h3 className="text-xl font-bold text-on-surface">{user?.fullName}</h3>
                <p className="text-sm text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full mt-2 font-bold uppercase tracking-wider">{user?.role === 'LANDLORD' ? 'Chủ nhà' : user?.role === 'ADMIN' ? 'Quản trị viên' : 'Người thuê'}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-outline uppercase tracking-widest">Số điện thoại</p>
                  <p className="font-bold text-on-surface">{user?.phone || 'Chưa cập nhật'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-outline uppercase tracking-widest">Ngày sinh</p>
                  <p className="font-bold text-on-surface">{user?.dob || 'Chưa cập nhật'}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-black text-outline uppercase tracking-widest">Địa chỉ</p>
                  <p className="font-bold text-on-surface">{user?.address || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={() => setIsEditingProfile(true)} className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-xl">edit</span>
                  Chỉnh sửa hồ sơ
                </button>
                <button onClick={() => setIsChangingPassword(true)} className="w-full py-4 bg-white text-on-surface font-bold rounded-2xl border border-outline-variant/30 hover:bg-surface-container transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-xl">lock</span>
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
