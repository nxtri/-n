import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../api/authApi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await authApi.login({ email, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      alert('Đăng nhập thành công!');
      if (response.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Đăng nhập thất bại!');
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md text-body-md min-h-screen flex flex-col antialiased">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Branding/Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block text-2xl font-black tracking-tight text-primary">PHONGTROSIEUCAP</Link>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mt-2">Chào mừng trở lại</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Vui lòng nhập thông tin để đăng nhập.</p>
          </div>

          {/* Login Card */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-8 border border-outline-variant/30">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface" htmlFor="email">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 border border-outline rounded-xl text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors font-body-md text-body-md" 
                    id="email" 
                    name="email" 
                    placeholder="Nhập email của bạn" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-label-md text-label-md text-on-surface" htmlFor="password">Mật khẩu</label>
                  <Link className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors" to="/forgot-password">Quên mật khẩu?</Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                  </div>
                  <input 
                    className="block w-full pl-10 pr-10 py-3 border border-outline rounded-xl text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors font-body-md text-body-md" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
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

              {/* Remember Me */}
              <div className="flex items-center">
                <input className="h-4 w-4 text-primary focus:ring-primary border-outline rounded cursor-pointer" id="remember-me" name="remember-me" type="checkbox"/>
                <label className="ml-2 block font-body-sm text-body-sm text-on-surface-variant cursor-pointer" htmlFor="remember-me">Ghi nhớ đăng nhập</label>
              </div>

              {/* Submit Button */}
              <button className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm font-label-md text-label-md text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors cursor-pointer" type="submit">
                Đăng Nhập
              </button>

            </form>
          </div>

          {/* Registration Link */}
          <p className="mt-8 text-center font-body-sm text-body-sm text-on-surface-variant">
            Chưa có tài khoản?{' '}
            <Link className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors" to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
