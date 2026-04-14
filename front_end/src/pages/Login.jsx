import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.message || 'Đăng nhập thất bại!');
    }
  };

  return (
    <div style={{ backgroundColor: '#141414', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Arial, sans-serif', position: 'relative' }}>
      
      {/* Nút Quay lại Trang chủ */}
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '20px', left: '20px', background: 'transparent', color: '#aaa', border: '1px solid #444', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = '#aaa'}>
        ← Quay lại Trang chủ
      </button>

      <div style={{ background: '#1c1c1c', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #333' }}>
        <h2 style={{ textAlign: 'center', color: '#4da6ff', margin: '0 0 10px 0', fontSize: '28px' }}>PHONGTROSIEUCAP</h2>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '30px' }}>Đăng nhập để tiếp tục</p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Nhập email của bạn" style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #444', background: '#333', color: '#fff', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Nhập mật khẩu" style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #444', background: '#333', color: '#fff', outline: 'none', paddingRight: '40px' }} />
              <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}>
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </span>
            </div>
          </div>

          <button type="submit" style={{ width: '100%', padding: '14px', background: '#ff5a2c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: '0.2s' }} onMouseEnter={(e) => e.target.style.background = '#e04921'} onMouseLeave={(e) => e.target.style.background = '#ff5a2c'}>
            ĐĂNG NHẬP
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '25px', color: '#888', fontSize: '14px' }}>
          Chưa có tài khoản? <Link to="/register" style={{ color: '#4da6ff', textDecoration: 'none', fontWeight: 'bold' }}>Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;