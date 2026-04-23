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

              {/* Alternative Sign In */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-surface-container-lowest text-outline font-body-sm text-body-sm">Hoặc tiếp tục với</span>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button className="w-full inline-flex justify-center py-2 px-4 border border-outline-variant rounded-xl bg-surface-container-lowest font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors" type="button">
                    <span className="sr-only">Sign in with Google</span>
                    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"></path>
                      <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"></path>
                      <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05"></path>
                      <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"></path>
                    </svg>
                  </button>
                  <button className="w-full inline-flex justify-center py-2 px-4 border border-outline-variant rounded-xl bg-surface-container-lowest font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors" type="button">
                    <span className="sr-only">Sign in with University Portal</span>
                    <span className="material-symbols-outlined text-[20px] text-on-surface">school</span>
                  </button>
                </div>
              </div>
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