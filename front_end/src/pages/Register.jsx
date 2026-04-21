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

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TENANT');
  const [showPassword, setShowPassword] = useState(false);
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
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', position: 'relative', padding: '20px 0' }}>
      
      {/* Nút Quay lại Trang chủ */}
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '20px', left: '20px', background: 'transparent', color: '#6c757d', border: '1px solid #ced4da', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f8fafc'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>
        ← Quay lại Trang chủ
      </button>

      <div style={{ background: '#ffffff', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #dee2e6' }}>
        <h2 style={{ textAlign: 'center', color: '#1266dd', margin: '0 0 10px 0', fontSize: '28px' }}>PHONGTROSIEUCAP</h2>
        <p style={{ textAlign: 'center', color: '#adb5bd', marginBottom: '30px' }}>Tạo tài khoản mới</p>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontSize: '14px' }}>Họ và tên</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Nguyễn Văn A" style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ced4da', background: '#f8f9fa', color: '#212529', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontSize: '14px' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@gmail.com" style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ced4da', background: '#f8f9fa', color: '#212529', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontSize: '14px' }}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Ít nhất 6 ký tự" style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ced4da', background: '#f8f9fa', color: '#212529', outline: 'none', paddingRight: '40px' }} />
              <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#adb5bd', display: 'flex', alignItems: 'center' }}>
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontSize: '14px' }}>Bạn là:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ced4da', background: '#f8f9fa', color: '#212529', outline: 'none', cursor: 'pointer' }}>
              <option value="TENANT">Người đi thuê phòng</option>
              <option value="LANDLORD">Chủ nhà cho thuê</option>
            </select>
          </div>

          <button type="submit" style={{ width: '100%', padding: '14px', background: '#1266dd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: '0.2s' }} onMouseEnter={(e) => e.target.style.background = '#094db3'} onMouseLeave={(e) => e.target.style.background = '#2563eb'}>
            ĐĂNG KÝ
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '25px', color: '#adb5bd', fontSize: '14px' }}>
          Đã có tài khoản? <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;