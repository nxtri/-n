import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../api/authApi';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TENANT');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await authApi.register({ fullName, email, password, role });
      alert('Đăng ký thành công! Hãy đăng nhập.');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || 'Đăng ký thất bại!');
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
      <main className="flex-grow flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant overflow-hidden">
          <div className="px-6 pt-8 pb-4 text-center border-b border-outline-variant/30">
            <Link className="inline-block mb-4" to="/">
              <span className="text-3xl text-primary tracking-tight font-black">PHONGTROSIEUCAP</span>
            </Link>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Tạo tài khoản mới</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Tham gia cộng đồng quản lý phòng trọ sinh viên</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleRegister} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface">Tôi là...</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative flex cursor-pointer">
                    <input 
                      checked={role === 'TENANT'} 
                      className="peer sr-only" 
                      name="role" 
                      type="radio" 
                      value="TENANT"
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <div className="w-full rounded-xl border border-outline-variant bg-surface p-4 text-center hover:bg-surface-container peer-checked:border-primary peer-checked:bg-primary-fixed peer-checked:text-on-primary-fixed transition-colors duration-200">
                      <span className="material-symbols-outlined mb-1 text-[28px]">person</span>
                      <span className="block font-label-md text-label-md">Người thuê</span>
                    </div>
                  </label>
                  <label className="relative flex cursor-pointer">
                    <input 
                      checked={role === 'LANDLORD'} 
                      className="peer sr-only" 
                      name="role" 
                      type="radio" 
                      value="LANDLORD"
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <div className="w-full rounded-xl border border-outline-variant bg-surface p-4 text-center hover:bg-surface-container peer-checked:border-primary peer-checked:bg-primary-fixed peer-checked:text-on-primary-container transition-colors duration-200">
                      <span className="material-symbols-outlined mb-1 text-[28px]">real_estate_agent</span>
                      <span className="block font-label-md text-label-md">Chủ nhà</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Full Name Input */}
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface" htmlFor="fullName">Họ và tên</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline">badge</span>
                  </div>
                  <input 
                    className="block w-full pl-[40px] pr-4 py-3 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md text-on-surface placeholder-outline transition-shadow duration-200" 
                    id="fullName" 
                    name="fullName" 
                    placeholder="Nguyễn Văn A" 
                    required 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface" htmlFor="email">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline">mail</span>
                  </div>
                  <input 
                    className="block w-full pl-[40px] pr-4 py-3 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md text-on-surface placeholder-outline transition-shadow duration-200" 
                    id="email" 
                    name="email" 
                    placeholder="example@gmail.com" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">Mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline">lock</span>
                  </div>
                  <input 
                    className="block w-full pl-[40px] pr-4 py-3 border border-outline-variant rounded-xl bg-surface focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md text-on-surface placeholder-outline transition-shadow duration-200" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    required 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Mật khẩu phải có ít nhất 6 ký tự.</p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button className="w-full flex justify-center items-center gap-2 bg-primary text-on-primary py-[16px] px-6 rounded-xl font-label-md text-label-md hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.05)]" type="submit">
                  Tạo tài khoản
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </form>
          </div>

          <div className="px-8 py-6 bg-surface-container-low border-t border-outline-variant/30 text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Đã có tài khoản?{' '}
              <Link className="font-label-md text-label-md text-primary hover:text-surface-tint hover:underline transition-colors duration-200" to="/login">Đăng nhập ngay</Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="max-w-[1280px] mx-auto w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-outline-variant/30 bg-background text-on-surface-variant">
        <div className="text-lg font-bold text-on-surface font-display-xl text-[18px]">PHONGTROSIEUCAP</div>
        <div className="font-body-sm text-body-sm tracking-wide text-center md:text-left">
          © 2024 PHONGTROSIEUCAP Housing Management.
        </div>
        <div className="flex flex-wrap justify-center gap-4 font-body-sm text-body-sm">
          <Link className="text-on-surface-variant hover:text-primary hover:underline transition-colors" to="#">Chính sách bảo mật</Link>
          <Link className="text-on-surface-variant hover:text-primary hover:underline transition-colors" to="#">Điều khoản dịch vụ</Link>
        </div>
      </footer>
    </div>
  );
};

export default Register;