import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', position: 'relative' }}>
      
      <button onClick={() => navigate('/login')} style={{ position: 'absolute', top: '20px', left: '20px', background: 'transparent', color: '#6c757d', border: '1px solid #ced4da', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = '#f8fafc'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>
        ← Quay lại Đăng nhập
      </button>

      <div style={{ background: '#ffffff', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid #dee2e6' }}>
        <h2 style={{ textAlign: 'center', color: '#1266dd', margin: '0 0 10px 0', fontSize: '28px' }}>QUÊN MẬT KHẨU</h2>
        <p style={{ textAlign: 'center', color: '#adb5bd', marginBottom: '30px' }}>Nhập email của bạn để nhận mã đặt lại mật khẩu</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontSize: '14px' }}>Email tài khoản</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="Nhập email của bạn" 
              style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ced4da', background: '#f8f9fa', color: '#212529', outline: 'none' }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: '#1266dd', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontSize: '16px', 
              fontWeight: 'bold', 
              transition: '0.2s',
              opacity: loading ? 0.7 : 1
            }} 
            onMouseEnter={(e) => !loading && (e.target.style.background = '#e04921')} 
            onMouseLeave={(e) => !loading && (e.target.style.background = '#2563eb')}
          >
            {loading ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
