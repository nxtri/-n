import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import authApi from '../api/authApi';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, { password });
      alert('Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập ngay bây giờ.');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md text-body-md min-h-screen flex flex-col antialiased">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Branding/Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block text-2xl font-black tracking-tight text-primary">PHONGTROSIEUCAP</Link>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mt-2">Đặt lại mật khẩu</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Vui lòng nhập mật khẩu mới bảo mật cho tài khoản của bạn.</p>
          </div>

          {/* Reset Password Card */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-8 border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-500">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password Input */}
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">Mật khẩu mới</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                  </div>
                  <input 
                    className="block w-full pl-10 pr-10 py-3 border border-outline rounded-xl text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors font-body-md text-body-md" 
                    id="password" 
                    name="password" 
                    placeholder="Tối thiểu 6 ký tự" 
                    required 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button 
                      className="text-outline hover:text-on-surface-variant focus:outline-none" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface" htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">verified_user</span>
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 border border-outline rounded-xl text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors font-body-md text-body-md" 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    placeholder="Nhập lại mật khẩu mới" 
                    required 
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm font-label-md text-label-md text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed" 
                type="submit"
              >
                {loading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-[20px]">sync</span>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    Cập nhật mật khẩu
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <Link 
              to="/login" 
              className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
