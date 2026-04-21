import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import authApi from '../api/authApi';

// --- Component SVG cho Mắt ---
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
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', position: 'relative' }}>
      
      <div style={{ background: '#ffffff', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #dee2e6' }}>
        <h2 style={{ textAlign: 'center', color: '#1266dd', margin: '0 0 10px 0', fontSize: '28px' }}>ĐẶT LẠI MẬT KHẨU</h2>
        <p style={{ textAlign: 'center', color: '#adb5bd', marginBottom: '30px' }}>Vui lòng nhập mật khẩu mới cho tài khoản của bạn</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontSize: '14px' }}>Mật khẩu mới</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="Nhập mật khẩu mới" 
                style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ced4da', background: '#f8f9fa', color: '#212529', outline: 'none', paddingRight: '40px' }} 
              />
              <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#adb5bd', display: 'flex', alignItems: 'center' }}>
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontSize: '14px' }}>Xác nhận mật khẩu</label>
            <input 
              type={showPassword ? "text" : "password"} 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              placeholder="Nhập lại mật khẩu mới" 
              style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ced4da', background: '#f8f9fa', color: '#212529', outline: 'none' }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontSize: '16px', 
              fontWeight: 'bold', 
              transition: '0.2s',
              opacity: loading ? 0.7 : 1
            }} 
            onMouseEnter={(e) => !loading && (e.target.style.background = '#3a8ee6')} 
            onMouseLeave={(e) => !loading && (e.target.style.background = '#3b82f6')}
          >
            {loading ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT MẬT KHẨU'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
