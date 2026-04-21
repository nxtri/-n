import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import adminApi from '../api/adminApi';
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'USERS');
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);

  // State cho bộ lọc Thống kê
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [notificationData, setNotificationData] = useState({ targetRole: 'ALL', title: '', message: '' });
  const [selectedRoomReports, setSelectedRoomReports] = useState(null); // Quản lý modal hiển thị báo xấu
  const [roleFilter, setRoleFilter] = useState('ALL'); // Bộ lọc vai trò người dùng
  const [regulations, setRegulations] = useState([]); // Danh sách nội quy
  const [editingReg, setEditingReg] = useState({ target: 'ALL', content: '' });

  // State Quản lý Đánh giá (Reviews)
  const [selectedRoomReviews, setSelectedRoomReviews] = useState(null);
  const [reviewFilterRating, setReviewFilterRating] = useState('ALL');
  const [reviewSearchText, setReviewSearchText] = useState('');

  // State Thay đổi mật khẩu
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, [navigate, user]);

  const fetchAllData = async () => {
    try {
      const [resUsers, resRooms, resContracts, resIncidents, resStats, resRegs] = await Promise.all([
        adminApi.getAllUsers(),
        adminApi.getAllRooms(),
        adminApi.getAllContracts(),
        adminApi.getAllIncidents(),
        adminApi.getDashboardStats({ month: filterMonth, year: filterYear }),
        adminApi.getRegulations()
      ]);
      setUsers(resUsers.users || []);
      setRooms(resRooms.rooms || []);
      setContracts(resContracts.contracts || []);
      setIncidents(resIncidents.incidents || []);
      setStats(resStats || null);
      setRegulations(resRegs.regulations || []);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu tổng', error);
    }
  };

  const fetchStats = async () => {
    try {
      const resStats = await adminApi.getDashboardStats({ month: filterMonth, year: filterYear });
      setStats(resStats || null);
    } catch (error) {
      console.error('Lỗi khi tải thống kê', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'STATS' && user && user.role === 'ADMIN') {
      fetchStats();
    }
  }, [filterMonth, filterYear, activeTab]);

  const fetchUsers = async () => {
    try {
      const res = await adminApi.getAllUsers();
      setUsers(res.users || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách user', error);
    }
  };

  const handleToggleRoomVisibility = async (id, currentIsHidden) => {
    if(window.confirm(`Bạn có chắc muốn ${currentIsHidden ? 'HIỂN THỊ' : 'ẨN'} phòng này?`)){
      try {
        await adminApi.toggleRoomVisibility(id);
        const res = await adminApi.getAllRooms();
        setRooms(res.rooms || []);
      } catch (error) { alert('Lỗi khi đổi trạng thái phòng'); }
    }
  };

  const handleUpdateRegulation = async (e) => {
    e.preventDefault();
    if (!editingReg.content) return alert('Vui lòng nhập nội dung nội quy!');
    try {
      const res = await adminApi.updateRegulation({
        target: editingReg.target,
        content: editingReg.content
      });
      alert(res.message);
      const resRegs = await adminApi.getRegulations();
      setRegulations(resRegs.regulations || []);
      setEditingReg({ target: 'ALL', content: '' });
    } catch (error) {
      alert('Lỗi khi cập nhật nội quy!');
    }
  };

  const handleDeleteRegulation = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nội quy này?')) return;
    try {
      const res = await adminApi.deleteRegulation(id);
      alert(res.message);
      const resRegs = await adminApi.getRegulations();
      setRegulations(resRegs.regulations || []);
    } catch (error) {
      alert('Lỗi khi xóa nội quy!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleToggleUserStatus = async (id, currentStatus) => {
    if(window.confirm(`Bạn có chắc muốn ${currentStatus ? 'KHÓA' : 'MỞ KHÓA'} tài khoản này?`)){
      try {
        await adminApi.toggleUserStatus(id);
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.message || 'Lỗi khi thay đổi trạng thái');
      }
    }
  };

  const handleDeleteUser = async (id) => {
    if(window.confirm('CẢNH BÁO: Hành động này sẽ xóa người dùng. Bạn có chắc chắn?')){
      try {
        await adminApi.deleteUser(id);
        alert('Đã xóa thành công!');
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.message || 'Lỗi khi xóa tài khoản');
      }
    }
  };

  const handleViewReviews = async (roomId, roomNumber) => {
    try {
      const res = await adminApi.getRoomReviews(roomId);
      setSelectedRoomReviews({ roomId, roomNumber, reviews: res.reviews || [] });
    } catch (error) {
      alert('Lỗi khi tải danh sách đánh giá!');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc chắn muốn XÓA đánh giá này? Hành động này không thể hoàn tác và điểm của phòng sẽ được tính lại.')) return;
    try {
      await adminApi.deleteReview(reviewId);
      alert('Đã xóa đánh giá thành công!');
      
      // Refresh modal
      if (selectedRoomReviews) {
        handleViewReviews(selectedRoomReviews.roomId, selectedRoomReviews.roomNumber);
      }
      
      // Refresh main table (to update avgRating)
      const resRooms = await adminApi.getAllRooms();
      setRooms(resRooms.rooms || []);
    } catch (error) {
      alert('Lỗi khi xóa đánh giá!');
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationData.title || !notificationData.message) return alert('Vui lòng nhập đủ Thông báo!');
    try {
      const res = await adminApi.broadcastNotification(notificationData);
      alert(res.message);
      setNotificationData({ targetRole: 'ALL', title: '', message: '' });
    } catch (error) {
      alert('Lỗi khi gửi thông báo!');
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) return alert('Mật khẩu mới không khớp nhau!');
    if (passwordData.newPassword.length < 6) return alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
    
    try {
      await authApi.changePassword({ 
        oldPassword: passwordData.oldPassword, 
        newPassword: passwordData.newPassword 
      });
      alert('Đổi mật khẩu thành công! Chuyển hướng đăng nhập...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi đổi mật khẩu!');
    }
  };

  const handleUpdateReportStatus = async (reportId, newStatus) => {
    if (!window.confirm('Xác nhận đánh dấu báo cáo này là Đã được xử lý?')) return;
    try {
      await adminApi.updateReportStatus(reportId, newStatus);
      alert('Đã cập nhật trạng thái báo cáo!');
      
      const resRooms = await adminApi.getAllRooms();
      setRooms(resRooms.rooms || []);
      
      if (selectedRoomReports) {
        const updatedRoom = resRooms.rooms.find(r => r.roomNumber === selectedRoomReports.roomNumber);
        if (updatedRoom) {
          setSelectedRoomReports({ roomNumber: updatedRoom.roomNumber, reports: updatedRoom.reports, roomId: updatedRoom.id });
        } else {
          setSelectedRoomReports(null);
        }
      }
    } catch (error) {
      alert('Lỗi khi cập nhật trạng thái báo cáo');
    }
  };

  const handleResolveAllReports = async (roomId) => {
    if (!window.confirm('Xác nhận Đánh dấu giải quyết toàn bộ báo cáo đang chờ của phòng này?')) return;
    try {
      await adminApi.resolveAllRoomReports(roomId);
      alert('Đã giải quyết tất cả báo cáo thành công!');

      const resRooms = await adminApi.getAllRooms();
      setRooms(resRooms.rooms || []);

      if (selectedRoomReports) {
        const updatedRoom = resRooms.rooms.find(r => r.id === roomId);
        if (updatedRoom) {
          setSelectedRoomReports({ roomNumber: updatedRoom.roomNumber, reports: updatedRoom.reports, roomId: updatedRoom.id });
        } else {
          setSelectedRoomReports(null);
        }
      }
    } catch (error) {
      alert('Lỗi khi cập nhật trạng thái phòng. Vui lòng thử lại sau.');
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc' }}>
      {/* HEADER */}
      <div style={{ background: '#ffffff', color: '#0f172a', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderBottom: '1px solid #e2e8f0', zIndex: 10 }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🛡️</span> HỆ THỐNG QUẢN TRỊ
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '15px', color: '#475569' }}>Xin chào, <strong style={{ color: '#0f172a' }}>{user.fullName}</strong></span>
          <button 
            onClick={handleLogout} 
            style={{ padding: '8px 18px', background: '#f1f5f9', color: '#ef4444', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.2s' }}
            onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
            onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width: '260px', background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', textAlign: 'left', zIndex: 5 }}>
          <div style={{ padding: '20px 0' }}>
            <div 
              style={{ padding: '15px 25px', cursor: 'pointer', background: activeTab === 'USERS' ? '#eff6ff' : 'transparent', color: activeTab === 'USERS' ? '#2563eb' : '#475569', fontWeight: activeTab === 'USERS' ? '700' : '500', borderLeft: activeTab === 'USERS' ? '4px solid #2563eb' : '4px solid transparent', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} 
              onClick={() => setActiveTab('USERS')}
              onMouseEnter={e => { if(activeTab !== 'USERS') Object.assign(e.currentTarget.style, { background: '#f8fafc', color: '#0f172a' }) }}
              onMouseLeave={e => { if(activeTab !== 'USERS') Object.assign(e.currentTarget.style, { background: 'transparent', color: '#475569' }) }}
            >
              <span>🧑‍💼</span> Người Dùng & Thông Báo
            </div>
            
            <div 
              style={{ padding: '15px 25px', cursor: 'pointer', background: activeTab === 'ROOMS' ? '#eff6ff' : 'transparent', color: activeTab === 'ROOMS' ? '#2563eb' : '#475569', fontWeight: activeTab === 'ROOMS' ? '700' : '500', borderLeft: activeTab === 'ROOMS' ? '4px solid #2563eb' : '4px solid transparent', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} 
              onClick={() => setActiveTab('ROOMS')}
              onMouseEnter={e => { if(activeTab !== 'ROOMS') Object.assign(e.currentTarget.style, { background: '#f8fafc', color: '#0f172a' }) }}
              onMouseLeave={e => { if(activeTab !== 'ROOMS') Object.assign(e.currentTarget.style, { background: 'transparent', color: '#475569' }) }}
            >
              <span>🏠</span> Phòng, Hợp đồng & Sự cố
            </div>
            <div 
              style={{ padding: '15px 25px', cursor: 'pointer', background: activeTab === 'STATS' ? '#eff6ff' : 'transparent', color: activeTab === 'STATS' ? '#2563eb' : '#475569', fontWeight: activeTab === 'STATS' ? '700' : '500', borderLeft: activeTab === 'STATS' ? '4px solid #2563eb' : '4px solid transparent', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} 
              onClick={() => setActiveTab('STATS')}
              onMouseEnter={e => { if(activeTab !== 'STATS') Object.assign(e.currentTarget.style, { background: '#f8fafc', color: '#0f172a' }) }}
              onMouseLeave={e => { if(activeTab !== 'STATS') Object.assign(e.currentTarget.style, { background: 'transparent', color: '#475569' }) }}
            >
              <span>📊</span> Thống Kê
            </div>
            <div 
              style={{ padding: '15px 25px', cursor: 'pointer', background: activeTab === 'REGULATIONS' ? '#eff6ff' : 'transparent', color: activeTab === 'REGULATIONS' ? '#2563eb' : '#475569', fontWeight: activeTab === 'REGULATIONS' ? '700' : '500', borderLeft: activeTab === 'REGULATIONS' ? '4px solid #2563eb' : '4px solid transparent', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} 
              onClick={() => setActiveTab('REGULATIONS')}
              onMouseEnter={e => { if(activeTab !== 'REGULATIONS') Object.assign(e.currentTarget.style, { background: '#f8fafc', color: '#0f172a' }) }}
              onMouseLeave={e => { if(activeTab !== 'REGULATIONS') Object.assign(e.currentTarget.style, { background: 'transparent', color: '#475569' }) }}
            >
              <span>📜</span> Quản lý Nội quy
            </div>
            <div 
              style={{ padding: '15px 25px', cursor: 'pointer', background: activeTab === 'SETTINGS' ? '#eff6ff' : 'transparent', color: activeTab === 'SETTINGS' ? '#2563eb' : '#475569', fontWeight: activeTab === 'SETTINGS' ? '700' : '500', borderLeft: activeTab === 'SETTINGS' ? '4px solid #2563eb' : '4px solid transparent', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '10px' }} 
              onClick={() => setActiveTab('SETTINGS')}
              onMouseEnter={e => { if(activeTab !== 'SETTINGS') Object.assign(e.currentTarget.style, { background: '#f8fafc', color: '#0f172a' }) }}
              onMouseLeave={e => { if(activeTab !== 'SETTINGS') Object.assign(e.currentTarget.style, { background: 'transparent', color: '#475569' }) }}
            >
              <span>⚙️</span> Tài khoản & Bảo mật
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          {activeTab === 'USERS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* COMPONENT: GỬI THÔNG BÁO */}
              <div style={{ background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔔</span> Gửi Thông Báo Hàng Loạt
                </h3>
                <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#475569' }}>Gửi đến đối tượng</label>
                      <select 
                        value={notificationData.targetRole}
                        onChange={(e) => setNotificationData({ ...notificationData, targetRole: e.target.value })}
                        style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', background: '#f8fafc', color: '#0f172a' }}>
                        <option value="ALL">Tất cả người dùng</option>
                        <option value="LANDLORD">Chỉ Chủ Nhà</option>
                        <option value="TENANT">Chỉ Khách Thuê</option>
                      </select>
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#475569' }}>Tiêu đề thông báo</label>
                      <input 
                        type="text" 
                        value={notificationData.title}
                        onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                        placeholder="VD: Cập nhật quy định mới..."
                        style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', background: '#f8fafc', color: '#0f172a' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#475569' }}>Nội dung chi tiết</label>
                    <textarea 
                      value={notificationData.message}
                      onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                      placeholder="Nhập nội dung cần gửi..."
                      rows="3"
                      style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', resize: 'vertical', outline: 'none', background: '#f8fafc', color: '#0f172a' }}></textarea>
                  </div>
                  <button type="submit" style={{ alignSelf: 'flex-start', padding: '12px 24px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    Gửi Thông Báo Ngay 🚀
                  </button>
                </form>
              </div>

              {/* COMPONENT: DANH SÁCH NGƯỜI DÙNG */}
              <div style={{ background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🧑‍💼</span> Danh Sách Người Dùng
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>Lọc vai trò:</span>
                    <select 
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', background: '#f8fafc' }}>
                      <option value="ALL">Tất cả</option>
                      <option value="LANDLORD">Chủ Nhà</option>
                      <option value="TENANT">Khách Thuê</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#ffffff' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>Họ Tên</th>
                        <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>Email</th>
                        <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>Số Điện Thoại</th>
                        <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>Vai Trò</th>
                        <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>Lần vi phạm</th>
                        <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>Trạng Thái</th>
                        <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>Hành Động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter(u => roleFilter === 'ALL' || u.role === roleFilter)
                        .map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                          <td style={{ padding: '16px', fontWeight: 'bold', color: '#0f172a' }}>{u.fullName}</td>
                          <td style={{ padding: '16px', color: '#475569' }}>{u.email}</td>
                          <td style={{ padding: '16px', color: '#475569' }}>{u.phone || <em style={{ color: '#94a3b8' }}>Chưa cập nhật</em>}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ 
                              padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                              background: u.role === 'ADMIN' ? '#fecdd3' : u.role === 'LANDLORD' ? '#eff6ff' : '#fffbeb',
                              color: u.role === 'ADMIN' ? '#be123c' : u.role === 'LANDLORD' ? '#2563eb' : '#d97706',
                              border: `1px solid ${u.role === 'ADMIN' ? '#fda4af' : u.role === 'LANDLORD' ? '#bfdbfe' : '#fde68a'}`
                            }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                             {u.role === 'LANDLORD' ? (
                               <span style={{ color: (u.violationsCount || 0) >= 2 ? '#ef4444' : '#64748b', fontWeight: 'bold' }}>
                                 {u.violationsCount || 0} lần
                               </span>
                             ) : (
                               <span style={{ color: '#cbd5e1' }}>-</span>
                             )}
                          </td>
                          <td style={{ padding: '16px' }}>
                            {u.isActive ? (
                              <span style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{width:'8px', height:'8px', borderRadius:'50%', background:'#10b981'}}></span> Đang hoạt động</span>
                            ) : (
                              <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{width:'8px', height:'8px', borderRadius:'50%', background:'#ef4444'}}></span> Bị khóa</span>
                            )}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            {u.role !== 'ADMIN' && (
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button 
                                  onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                                  style={{ padding: '6px 12px', cursor: 'pointer', border: `1px solid ${u.isActive ? '#fecaca' : '#bbf7d0'}`, borderRadius: '6px', background: u.isActive ? '#fef2f2' : '#f0fdf4', color: u.isActive ? '#ef4444' : '#16a34a', fontWeight: 'bold', transition: '0.2s' }}
                                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                  title={u.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                >
                                  {u.isActive ? '🔒 Khóa' : '🔓 Mở'}
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(u.id)}
                                  style={{ padding: '6px 12px', cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc', color: '#64748b', transition: '0.2s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                                  title="Xóa người dùng"
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ROOMS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* COMPONENT: DANH SÁCH PHÒNG TRỌ */}
              <div style={{ background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏠</span> Tất Cả Phòng Trọ ({rooms.length})
                </h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#ffffff', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Phòng</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Chủ nhà</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Ngày tạo</th>
                        <th style={{ padding: '16px', fontWeight: '600' }}>Trạng thái</th>
                        <th style={{ padding: '16px', fontWeight: '600', textAlign: 'center' }}>Đánh giá</th>
                        <th style={{ padding: '16px', fontWeight: '600', textAlign: 'center' }}>Báo xấu</th>
                        <th style={{ padding: '16px', fontWeight: '600', textAlign: 'center' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'left', opacity: r.deletedAt ? 0.6 : 1, transition: 'background-color 0.2s' }}>
                          <td style={{ padding: '16px' }}>
                            <span 
                              onClick={() => navigate(`/room/${r.id}`)}
                              style={{ color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}
                              title="Xem chi tiết phòng"
                            >
                              Phòng {r.roomNumber}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ color: '#0f172a', fontWeight: 'bold' }}>{r.landlord?.fullName}</div>
                            <small style={{ color: '#64748b' }}>{r.landlord?.email} - {r.landlord?.phone}</small>
                          </td>
                          <td style={{ padding: '16px', color: '#475569' }}>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td style={{ padding: '16px' }}>
                            {r.deletedAt ? (
                              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Đã xóa</span>
                            ) : (
                              <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: r.status === 'AVAILABLE' ? '#f0fdf4' : '#eff6ff', color: r.status === 'AVAILABLE' ? '#16a34a' : '#2563eb', border: `1px solid ${r.status === 'AVAILABLE' ? '#bbf7d0' : '#bfdbfe'}` }}>
                                {r.status === 'AVAILABLE' ? 'Phòng Trống' : 'Đã Thuê'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ color: Number(r.avgRating) >= 4 ? '#10b981' : Number(r.avgRating) >= 2 ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>
                              ⭐ {r.avgRating || 0}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <small style={{ color: '#64748b' }}>({r.reviewCount || 0} lượt)</small>
                              <button 
                                onClick={() => handleViewReviews(r.id, r.roomNumber)}
                                style={{ background: 'transparent', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>
                                Xem đánh giá
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            { (() => {
                              const pendingCount = r.reports?.filter(rep => rep.status === 'PENDING').length || 0;
                              return (
                                <div style={{ color: pendingCount > 0 ? '#ef4444' : '#64748b', fontWeight: 'bold' }}>
                                  {pendingCount > 0 ? `${pendingCount} chờ xử lý` : `${r.reports?.length || 0} báo cáo`}
                                </div>
                              );
                            })() }
                            {(r.reports?.length || 0) > 0 && (
                              <button 
                                onClick={() => setSelectedRoomReports({ roomNumber: r.roomNumber, reports: r.reports, roomId: r.id })}
                                style={{ background: 'transparent', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', marginTop: '4px' }}>
                                Xem chi tiết
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <button 
                              onClick={() => handleToggleRoomVisibility(r.id, r.isHidden)}
                              style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${r.isHidden ? '#fecaca' : '#e2e8f0'}`, background: r.isHidden ? '#fef2f2' : '#f8fafc', color: r.isHidden ? '#ef4444' : '#64748b', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              {r.isHidden ? '👁️ Mở ẩn' : '🚫 Ẩn phòng'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '25px' }}>
                {/* COMPONENT: DANH SÁCH HỢP ĐỒNG */}
                <div style={{ flex: 1, background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📋</span> Hợp Đồng Gần Đây
                  </h3>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {contracts.map(c => (
                        <li key={c.id} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                          <span style={{ color: '#2563eb', fontWeight: 'bold' }}>Phòng: {c.room?.roomNumber}</span> - <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{c.tenantName}</span>
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Status: <strong style={{ color: c.status === 'ACTIVE' ? '#10b981' : '#f59e0b' }}>{c.status}</strong></span>
                            <span>Giá: <strong>{c.price.toLocaleString()}đ</strong></span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* COMPONENT: SỰ CỐ */}
                <div style={{ flex: 1, background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🛠️</span> Phiếu Sự Cố
                  </h3>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {incidents.map(inc => (
                        <li key={inc.id} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                          <span style={{ color: '#2563eb', fontWeight: 'bold' }}>Khách P.{inc.room?.roomNumber}:</span> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{inc.title}</span>
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Ngày: {new Date(inc.createdAt).toLocaleDateString('vi-VN')}</span>
                            <span>Trạng thái: <span style={{ color: inc.status === 'Pending' ? '#f59e0b' : inc.status === 'Resolved' ? '#10b981' : '#2563eb', fontWeight: 'bold' }}>{inc.status}</span></span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'STATS' && stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* BỘ LỌC THỜI GIAN */}
              <div style={{ display: 'flex', gap: '20px', background: '#ffffff', padding: '20px 25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>📅 Lọc theo thời gian:</span>
                <select 
                  value={filterMonth} 
                  onChange={(e) => setFilterMonth(e.target.value)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none', fontWeight: '500' }}
                >
                  <option value="ALL">Tất cả tháng</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>Tháng {i+1}</option>
                  ))}
                </select>
                <select 
                  value={filterYear} 
                  onChange={(e) => setFilterYear(e.target.value)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', outline: 'none', fontWeight: '500' }}
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
                </select>
              </div>

              {/* THỐNG KÊ NGƯỜI DÙNG & PHÒNG (DÒNG 1) */}
              <div style={{ display: 'flex', gap: '25px' }}>
                <div style={{ flex: 1, background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '42px', fontWeight: '900', color: '#2563eb', marginBottom: '5px' }}>{stats.users.totalTenants + stats.users.totalLandlords}</div>
                  <div style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '16px' }}>Tổng Người Dùng</div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>{stats.users.totalTenants} Khách thuê | {stats.users.totalLandlords} Chủ nhà</div>
                  <div style={{ padding: '10px', background: '#fef2f2', borderRadius: '8px', marginTop: '15px' }}>
                    <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: 'bold' }}>🔒 Khóa: {stats.users.lockedTenants} Khách, {stats.users.lockedLandlords} Chủ nhà</div>
                  </div>
                  <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '8px', marginTop: '10px' }}>
                    <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold' }}>✨ Người dùng mới: {stats.users.newUsers}</div>
                  </div>
                </div>

                <div style={{ flex: 1, background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '42px', fontWeight: '900', color: '#10b981', marginBottom: '5px' }}>{stats.rooms.totalRooms}</div>
                  <div style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '16px' }}>Tổng Phòng Trọ</div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>{stats.rooms.rentedRooms} Đang cho thuê | {stats.rooms.availableRooms} Trống</div>
                  <div style={{ padding: '10px', background: '#fffbeb', borderRadius: '8px', marginTop: '15px' }}>
                    <div style={{ fontSize: '13px', color: '#d97706', fontWeight: 'bold' }}>👁️ Bị ẩn (vi phạm): {stats.rooms.hiddenRooms} phòng</div>
                  </div>
                </div>
              </div>

              {/* BÁO CÁO DOANH THU CHI TIẾT (DÒNG 2) */}
              <div style={{ background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 25px 0', color: '#0f172a', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📈</span> Báo Cáo Doanh Thu Chi Tiết
                </h3>
                
                <div style={{ display: 'flex', gap: '20px' }}>
                  {/* Cột 1: Tổng Doanh Thu */}
                  <div style={{ flex: 1, background: '#f8fafc', padding: '20px', borderRadius: '12px', borderLeft: '6px solid #2563eb', borderRight: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Tổng doanh thu toàn hệ thống</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#2563eb', margin: '15px 0 10px 0' }}>
                      {stats.revenueStats.totalRevenue.toLocaleString('vi-VN')} đ
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>= Phòng + Điện nước</div>
                  </div>

                  {/* Cột 2: Từ tiền phòng */}
                  <div style={{ flex: 1, background: '#f8fafc', padding: '20px', borderRadius: '12px', borderLeft: '6px solid #10b981', borderRight: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Từ tiền phòng</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', margin: '15px 0 10px 0' }}>
                      {stats.revenueStats.roomRevenue.toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  {/* Cột 3: Từ điện nước */}
                  <div style={{ flex: 1, background: '#f8fafc', padding: '20px', borderRadius: '12px', borderLeft: '6px solid #0ea5e9', borderRight: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Từ điện nước</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#0ea5e9', margin: '15px 0 10px 0' }}>
                      {stats.revenueStats.utilityRevenue.toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  {/* Cột 4: Khách đang nợ */}
                  <div style={{ flex: 1, background: '#fff1f2', padding: '20px', borderRadius: '12px', borderLeft: '6px solid #ef4444', borderRight: '1px solid #fecdd3', borderTop: '1px solid #fecdd3', borderBottom: '1px solid #fecdd3' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#be123c', textTransform: 'uppercase' }}>Khách đang nợ</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#ef4444', margin: '15px 0 10px 0' }}>
                      {stats.revenueStats.totalDebt.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'REGULATIONS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 25px 0', color: '#0f172a', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📜</span> Quản Lý Nội Quy Hệ Thống
                </h3>
                
                <form onSubmit={handleUpdateRegulation} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px', padding: '25px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                  <h4 style={{ margin: 0, color: '#0f172a', fontSize: '16px' }}>Thêm / Cập nhật nội quy</h4>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#475569' }}>Đối tượng áp dụng</label>
                      <select 
                        value={editingReg.target}
                        onChange={(e) => setEditingReg({ ...editingReg, target: e.target.value })}
                        style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', background: '#ffffff', color: '#0f172a' }}>
                        <option value="ALL">Tất cả</option>
                        <option value="LANDLORD">Chủ Nhà</option>
                        <option value="TENANT">Khách Thuê</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#475569' }}>Nội dung nội quy</label>
                    <textarea 
                      value={editingReg.content}
                      onChange={(e) => setEditingReg({ ...editingReg, content: e.target.value })}
                      placeholder="Nhập nội quy chi tiết..."
                      rows="6"
                      style={{ width: '100%', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', resize: 'vertical', outline: 'none', background: '#ffffff', color: '#0f172a', lineHeight: '1.5' }}></textarea>
                  </div>
                  <button type="submit" style={{ alignSelf: 'flex-start', padding: '12px 24px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    Lưu & Cập Nhật 🚀
                  </button>
                </form>

                <h4 style={{ marginBottom: '15px', fontSize: '16px', color: '#0f172a' }}>Danh sách nội quy hiện tại</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {regulations.length === 0 ? (
                    <p style={{ color: '#64748b', gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>Chưa có nội quy nào được thiết lập.</p>
                  ) : (
                    regulations.map(reg => (
                      <div key={reg.id} style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                          <span style={{ 
                            padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                            background: reg.target === 'ALL' ? '#f1f5f9' : reg.target === 'LANDLORD' ? '#eff6ff' : '#fffbeb',
                            color: reg.target === 'ALL' ? '#475569' : reg.target === 'LANDLORD' ? '#2563eb' : '#d97706',
                            border: `1px solid ${reg.target === 'ALL' ? '#e2e8f0' : reg.target === 'LANDLORD' ? '#bfdbfe' : '#fde68a'}`
                          }}>
                            {reg.target === 'ALL' ? 'Tất cả đối tượng' : (reg.target === 'LANDLORD' ? 'Dành cho Chủ nhà' : 'Dành cho Khách thuê')}
                          </span>
                          <div style={{ display: 'flex', gap: '15px' }}>
                            <button 
                              onClick={() => setEditingReg({ target: reg.target, content: reg.value })}
                              style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                              Sửa
                            </button>
                            <button 
                              onClick={() => handleDeleteRegulation(reg.id)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                              Xóa
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', textAlign: 'left', lineHeight: '1.6', flex: 1 }}>
                          {reg.value}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SETTINGS' && (
            <div style={{ maxWidth: '500px', margin: '40px auto' }}>
              <div style={{ background: '#ffffff', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 30px 0', color: '#0f172a', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                  <span style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>🔐</span> Thay đổi mật khẩu
                </h3>
                
                <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Trường: Mật khẩu hiện tại */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569', textAlign: 'left', marginLeft: '4px' }}>Mật khẩu hiện tại</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type={showOldPwd ? "text" : "password"}
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        placeholder="••••••••"
                        required
                        style={{ width: '100%', padding: '14px 45px 14px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 'none', fontSize: '14px', transition: 'all 0.2s', backgroundColor: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
                        onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.backgroundColor = '#ffffff'; e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowOldPwd(!showOldPwd)} 
                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                      >
                        {showOldPwd ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Trường: Mật khẩu mới */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569', textAlign: 'left', marginLeft: '4px' }}>Mật khẩu mới</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type={showNewPwd ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Tối thiểu 6 ký tự"
                        required
                        style={{ width: '100%', padding: '14px 45px 14px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 'none', fontSize: '14px', transition: 'all 0.2s', backgroundColor: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
                        onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.backgroundColor = '#ffffff'; e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowNewPwd(!showNewPwd)} 
                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                      >
                        {showNewPwd ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Trường: Xác nhận mật khẩu mới */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600', fontSize: '14px', color: '#475569', textAlign: 'left', marginLeft: '4px' }}>Xác nhận mật khẩu mới</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type={showConfirmPwd ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                        style={{ width: '100%', padding: '14px 45px 14px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', outline: 'none', fontSize: '14px', transition: 'all 0.2s', backgroundColor: '#f8fafc', color: '#0f172a', boxSizing: 'border-box' }}
                        onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.backgroundColor = '#ffffff'; e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)} 
                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                      >
                        {showConfirmPwd ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <button 
                      type="submit" 
                      style={{ width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
                      onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)' }}
                    >
                      Cập nhật mật khẩu 🚀
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL HIỂN THỊ DANH SÁCH BÁO XẤU (REPORT) */}
      {selectedRoomReports && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: '#ffffff', width: '90%', maxWidth: '650px', maxHeight: '85vh', borderRadius: '16px', padding: '30px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setSelectedRoomReports(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#f8fafc', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>✖</button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px', paddingRight: '40px' }}>
              <h3 style={{ margin: '0', color: '#0f172a', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🚨</span> Báo xấu: Phòng {selectedRoomReports.roomNumber}
              </h3>
              {selectedRoomReports.reports.some(r => r.status === 'PENDING') && (
                <button
                  onClick={() => handleResolveAllReports(selectedRoomReports.roomId)}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                    transition: '0.2s'
                  }}>
                  ✅ Giải quyết toàn bộ
                </button>
              )}
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
              {selectedRoomReports.reports.map((report, idx) => (
                <div key={idx} style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <strong style={{ color: report.status === 'PENDING' ? '#ef4444' : '#10b981', fontSize: '15px' }}>{report.reason}</strong>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: report.status === 'PENDING' ? '#fef2f2' : '#f0fdf4',
                        color: report.status === 'PENDING' ? '#ef4444' : '#10b981',
                        border: `1px solid ${report.status === 'PENDING' ? '#fecaca' : '#bbf7d0'}`
                      }}>
                        {report.status === 'PENDING' ? 'Chờ xử lý' : 'Đã giải quyết'}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{new Date(report.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {report.description && (
                    <p style={{ fontSize: '14px', margin: '0 0 15px 0', color: '#334155', lineHeight: '1.5' }}>
                      Mô tả: {report.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      Báo cáo bởi: <strong style={{ color: '#0f172a' }}>{report.fullName}</strong> - SĐT: <strong style={{ color: '#0f172a' }}>{report.phoneNumber}</strong>
                    </div>
                    {report.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateReportStatus(report.id, 'RESOLVED')}
                        style={{
                          background: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)',
                          transition: '0.2s'
                        }}>
                        Đã xử lý xong ✓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL QUẢN LÝ ĐÁNH GIÁ (REVIEWS) */}
      {selectedRoomReviews && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: '#ffffff', width: '90%', maxWidth: '850px', maxHeight: '85vh', borderRadius: '16px', padding: '30px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setSelectedRoomReviews(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#f8fafc', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>✖</button>
            
            <h3 style={{ margin: '0 0 25px 0', color: '#0f172a', fontSize: '22px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⭐</span> Đánh giá chi tiết: Phòng {selectedRoomReviews.roomNumber}
            </h3>

            {/* THANH CÔNG CỤ: LỌC & TÌM KIẾM */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Lọc theo số sao:</label>
                <select 
                  value={reviewFilterRating}
                  onChange={(e) => setReviewFilterRating(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#ffffff', color: '#0f172a' }}>
                  <option value="ALL">Tất cả đánh giá</option>
                  <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
                  <option value="4">⭐⭐⭐⭐ (4 sao)</option>
                  <option value="3">⭐⭐⭐ (3 sao)</option>
                  <option value="2">⭐⭐ (2 sao)</option>
                  <option value="1">⭐ (1 sao)</option>
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>Tìm kiếm đánh giá:</label>
                <input 
                  type="text" 
                  value={reviewSearchText}
                  onChange={(e) => setReviewSearchText(e.target.value)}
                  placeholder="Nhập tên khách hoặc nội dung đánh giá..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }} />
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
              {selectedRoomReviews.reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: '#94a3b8', fontSize: '15px' }}>Chưa có đánh giá nào cho phòng này.</div>
              ) : (
                selectedRoomReviews.reviews
                  .filter(rev => {
                    const matchRating = reviewFilterRating === 'ALL' || rev.rating.toString() === reviewFilterRating;
                    const matchText = !reviewSearchText || 
                                     (rev.tenant?.fullName || '').toLowerCase().includes(reviewSearchText.toLowerCase()) ||
                                     (rev.comment || '').toLowerCase().includes(reviewSearchText.toLowerCase());
                    return matchRating && matchText;
                  })
                  .map((rev) => (
                    <div key={rev.id} style={{ padding: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}>{rev.tenant?.fullName || 'Khách thuê cũ'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{new Date(rev.createdAt).toLocaleString('vi-VN')}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                          <span style={{ fontSize: '16px', color: '#f59e0b', letterSpacing: '2px' }}>{'⭐'.repeat(rev.rating)}</span>
                          <button 
                            onClick={() => handleDeleteReview(rev.id)}
                            style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: '0.2s' }}
                            onMouseEnter={(e) => e.target.style.background = '#fecaca'}
                            onMouseLeave={(e) => e.target.style.background = '#fef2f2'}>
                            🗑️ Xóa đánh giá
                          </button>
                        </div>
                      </div>

                      <div style={{ color: '#334155', fontSize: '14px', lineHeight: '1.6', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        {rev.comment || <em style={{ color: '#94a3b8' }}>Khách hàng không để lại bình luận.</em>}
                      </div>

                      {/* Hiển thị ảnh kèm theo nếu có */}
                      {rev.images && JSON.parse(rev.images).length > 0 && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
                          {JSON.parse(rev.images).map((img, i) => (
                            <img 
                              key={i} 
                              src={`http://localhost:5000/uploads/${img}`} 
                              alt="Review" 
                              style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s' }} 
                              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                              onClick={() => window.open(`http://localhost:5000/uploads/${img}`)} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
