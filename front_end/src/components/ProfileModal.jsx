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
    fullName: user?.fullName || '', 
    phone: user?.phone || '',
    dob: user?.dob || '', 
    address: user?.address || '', 
    identityNumber: user?.identityNumber || '',
    bankName: user?.bankName || 'MB', 
    accountNumber: user?.accountNumber || '', 
    accountHolder: user?.accountHolder || ''
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[660px] rounded-[2rem] shadow-2xl border border-outline-variant/20 overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-center">
          <h2 className="text-2xl font-black text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">
              {isChangingPassword ? 'lock_reset' : isEditingProfile ? 'edit_note' : 'account_circle'}
            </span>
            {isChangingPassword ? 'Đổi mật khẩu' : isEditingProfile ? 'Chỉnh sửa thông tin' : 'Thông tin người dùng'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8 pt-4 space-y-6 overflow-y-auto max-h-[80vh] no-scrollbar">
          
          {isChangingPassword ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest px-1">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input 
                    type={showOldPwd ? "text" : "password"} 
                    value={passwordData.oldPassword} 
                    onChange={e => setPasswordData({ ...passwordData, oldPassword: e.target.value })} 
                    className="w-full p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button onClick={() => setShowOldPwd(!showOldPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary">
                    {showOldPwd ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest px-1">Mật khẩu mới (ít nhất 6 ký tự)</label>
                <div className="relative">
                  <input 
                    type={showNewPwd ? "text" : "password"} 
                    value={passwordData.newPassword} 
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                    className="w-full p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary">
                    {showNewPwd ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest px-1">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input 
                    type={showConfirmPwd ? "text" : "password"} 
                    value={passwordData.confirmPassword} 
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
                    className="w-full p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary">
                    {showConfirmPwd ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-black text-on-surface-variant uppercase tracking-[0.2em] px-1">Họ tên</label>
                  {isEditingProfile ? (
                    <input type="text" value={profileData.fullName} onChange={e => setProfileData({ ...profileData, fullName: e.target.value })} className="w-full p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold" />
                  ) : (
                    <div className="p-3.5 bg-surface-container-lowest border border-outline-variant/10 rounded-xl font-bold text-on-surface">{user?.fullName}</div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-black text-on-surface-variant uppercase tracking-[0.2em] px-1">Email (Cố định)</label>
                  <div className="p-3.5 bg-surface-container-low/50 border border-outline-variant/10 rounded-xl font-bold text-on-surface-variant opacity-70 cursor-not-allowed">
                    {user?.email}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-black text-on-surface-variant uppercase tracking-[0.2em] px-1">Số điện thoại</label>
                  {isEditingProfile ? (
                    <input type="text" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} className="w-full p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold" />
                  ) : (
                    <div className="p-3.5 bg-surface-container-lowest border border-outline-variant/10 rounded-xl font-bold text-on-surface">{user?.phone || 'Chưa cập nhật'}</div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-black text-on-surface-variant uppercase tracking-[0.2em] px-1">Ngày sinh</label>
                  {isEditingProfile ? (
                    <input type="date" value={profileData.dob} onChange={e => setProfileData({ ...profileData, dob: e.target.value })} className="w-full p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold" />
                  ) : (
                    <div className="p-3.5 bg-surface-container-lowest border border-outline-variant/10 rounded-xl font-bold text-on-surface">{user?.dob || 'Chưa cập nhật'}</div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-black text-on-surface-variant uppercase tracking-[0.2em] px-1">Số CMND/CCCD</label>
                  {isEditingProfile ? (
                    <input type="text" value={profileData.identityNumber} onChange={e => setProfileData({ ...profileData, identityNumber: e.target.value })} className="w-full p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold" />
                  ) : (
                    <div className="p-3.5 bg-surface-container-lowest border border-outline-variant/10 rounded-xl font-bold text-on-surface">{user?.identityNumber || 'Chưa cập nhật'}</div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-black text-on-surface-variant uppercase tracking-[0.2em] px-1">Địa chỉ</label>
                  {isEditingProfile ? (
                    <input type="text" value={profileData.address} onChange={e => setProfileData({ ...profileData, address: e.target.value })} className="w-full p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold" />
                  ) : (
                    <div className="p-3.5 bg-surface-container-lowest border border-outline-variant/10 rounded-xl font-bold text-on-surface">{user?.address || 'Chưa cập nhật'}</div>
                  )}
                </div>
              </div>

              {/* Bank Info Section (Only for LANDLORD) */}
              {user?.role === 'LANDLORD' && (
                <div className="pt-6 border-t border-outline-variant/30">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-primary">account_balance</span>
                    <h3 className="font-black text-primary uppercase tracking-widest text-lg">Thông tin nhận tiền (VietQR)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-black text-on-surface-variant uppercase tracking-widest px-1">Ngân hàng</label>
                      {isEditingProfile ? (
                        <select 
                          value={profileData.bankName} 
                          onChange={e => setProfileData({ ...profileData, bankName: e.target.value })} 
                          className="w-full p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold appearance-none cursor-pointer"
                        >
                          {['MB', 'VCB', 'TCB', 'ACB', 'BIDV', 'VPB', 'ICB', 'VBA', 'STB', 'SHB', 'TPB', 'HDB', 'VIB'].map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3.5 bg-surface-container-lowest border border-outline-variant/10 rounded-xl font-bold text-on-surface">{user?.bankName || 'Chưa cập nhật'}</div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-black text-on-surface-variant uppercase tracking-widest px-1">Số tài khoản</label>
                      {isEditingProfile ? (
                        <input type="text" value={profileData.accountNumber} onChange={e => setProfileData({ ...profileData, accountNumber: e.target.value })} className="w-full p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold" />
                      ) : (
                        <div className="p-3.5 bg-surface-container-lowest border border-outline-variant/10 rounded-xl font-black text-on-surface text-lg tracking-wider">{user?.accountNumber || 'Chưa cập nhật'}</div>
                      )}
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[13px] font-black text-on-surface-variant uppercase tracking-widest px-1">Tên chủ tài khoản</label>
                      {isEditingProfile ? (
                        <input type="text" value={profileData.accountHolder} onChange={e => setProfileData({ ...profileData, accountHolder: e.target.value.toUpperCase() })} placeholder="VIET HOA KHONG DAU" className="w-full p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold" />
                      ) : (
                        <div className="p-3.5 bg-surface-container-lowest border border-outline-variant/10 rounded-xl font-black text-on-surface uppercase">{user?.accountHolder || 'Chưa cập nhật'}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 pt-4 bg-surface-container-low/30 border-t border-outline-variant/20 flex flex-col sm:flex-row justify-end gap-3">
          {isChangingPassword ? (
            <>
              <button 
                onClick={() => { setIsChangingPassword(false); setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' }); }} 
                className="px-8 py-3 rounded-2xl font-bold text-on-surface-variant hover:bg-surface-container-high transition-all border border-outline-variant/30"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSavePassword} 
                className="px-8 py-3 bg-primary text-on-primary rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">save</span> Lưu mật khẩu
              </button>
            </>
          ) : !isEditingProfile ? (
            <>
              <button 
                onClick={() => setIsChangingPassword(true)} 
                className="flex-1 py-4 bg-surface-container-high text-on-surface rounded-2xl font-black transition-all hover:bg-surface-container-highest flex items-center justify-center gap-2 border border-outline-variant/30 active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">lock_open</span> Đổi mật khẩu
              </button>
              <button 
                onClick={() => setIsEditingProfile(true)} 
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-black transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 border-none active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">edit</span> Chỉnh sửa hồ sơ
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditingProfile(false)} 
                className="px-8 py-3 rounded-2xl font-bold text-on-surface-variant hover:bg-surface-container-high transition-all border border-outline-variant/30"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveProfile} 
                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">check_circle</span> Lưu thay đổi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
