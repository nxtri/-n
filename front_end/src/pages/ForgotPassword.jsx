import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../api/authApi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      alert('Yêu cầu đã được gửi! Vui lòng kiểm tra email của bạn để nhận hướng dẫn đặt lại mật khẩu.');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu!');
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
            <h1 className="font-headline-lg text-headline-lg text-on-surface mt-2">Quên mật khẩu?</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Đừng lo lắng, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn.</p>
          </div>

          {/* Forgot Password Card */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-8 border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-500">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block font-label-md text-label-md text-on-surface" htmlFor="email">Email tài khoản</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 border border-outline rounded-xl text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors font-body-md text-body-md" 
                    id="email" 
                    name="email" 
                    placeholder="Nhập email bạn đã đăng ký" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm font-label-md text-label-md text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group" 
                type="submit"
              >
                {loading ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-[20px]">sync</span>
                    Đang gửi yêu cầu...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">send</span>
                    Gửi yêu cầu đặt lại
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Quay lại Đăng nhập
                </Link>
              </div>
            </form>
          </div>

          {/* Help Text */}
          <div className="mt-10 p-6 bg-surface-container-low/50 rounded-2xl border border-outline-variant/20">
            <div className="flex gap-4 items-start">
              <span className="material-symbols-outlined text-primary">info</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Nếu bạn không nhận được email trong vòng 5 phút, vui lòng kiểm tra thư mục <strong>Spam</strong> hoặc thử lại. Nếu vẫn gặp khó khăn, hãy liên hệ hỗ trợ kỹ thuật.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
