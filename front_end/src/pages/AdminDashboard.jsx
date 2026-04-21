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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#f1f5f9' }}>
      {/* HEADER */}
      <div style={{ background: '#1e293b', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: 0 }}>HỆ THỐNG QUẢN TRỊ (ADMIN)</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span>Xin chào, <strong>{user.fullName}</strong></span>
          <button 
            onClick={handleLogout} 
            style={{ padding: '8px 15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Đăng xuất
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden',  }}>
        {/* SIDEBAR */}
        <div style={{ width: '250px', background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <div style={{ padding: '20px 0' }}>
            <div 
              style={{ padding: '15px 20px', cursor: 'pointer', background: activeTab === 'USERS' ? '#e0f2fe' : 'transparent', color: activeTab === 'USERS' ? '#0369a1' : '#475569', fontWeight: activeTab === 'USERS' ? 'bold' : 'normal', borderLeft: activeTab === 'USERS' ? '4px solid #0284c7' : '4px solid transparent' }} 
              onClick={() => setActiveTab('USERS')}
            >
              🧑‍💼 Người Dùng & Thông Báo
            </div>
            
            <div 
              style={{ padding: '15px 20px', cursor: 'pointer', background: activeTab === 'ROOMS' ? '#e0f2fe' : 'transparent', color: activeTab === 'ROOMS' ? '#0369a1' : '#475569', fontWeight: activeTab === 'ROOMS' ? 'bold' : 'normal', borderLeft: activeTab === 'ROOMS' ? '4px solid #0284c7' : '4px solid transparent' }} 
              onClick={() => setActiveTab('ROOMS')}
            >
              🏠 Phòng, Hợp đồng & Sự cố
            </div>
            <div 
              style={{ padding: '15px 20px', cursor: 'pointer', background: activeTab === 'STATS' ? '#e0f2fe' : 'transparent', color: activeTab === 'STATS' ? '#0369a1' : '#475569', fontWeight: activeTab === 'STATS' ? 'bold' : 'normal', borderLeft: activeTab === 'STATS' ? '4px solid #0284c7' : '4px solid transparent' }} 
              onClick={() => setActiveTab('STATS')}
            >
              📊 Thống Kê
            </div>
            <div 
              style={{ padding: '15px 20px', cursor: 'pointer', background: activeTab === 'REGULATIONS' ? '#e0f2fe' : 'transparent', color: activeTab === 'REGULATIONS' ? '#0369a1' : '#475569', fontWeight: activeTab === 'REGULATIONS' ? 'bold' : 'normal', borderLeft: activeTab === 'REGULATIONS' ? '4px solid #0284c7' : '4px solid transparent' }} 
              onClick={() => setActiveTab('REGULATIONS')}
            >
              📜 Quản lý Nội quy
            </div>
            <div 
              style={{ padding: '15px 20px', cursor: 'pointer', background: activeTab === 'SETTINGS' ? '#e0f2fe' : 'transparent', color: activeTab === 'SETTINGS' ? '#0369a1' : '#475569', fontWeight: activeTab === 'SETTINGS' ? 'bold' : 'normal', borderLeft: activeTab === 'SETTINGS' ? '4px solid #0284c7' : '4px solid transparent' }} 
              onClick={() => setActiveTab('SETTINGS')}
            >
              ⚙️ Tài khoản & Bảo mật
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {activeTab === 'USERS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* COMPONENT: GỬI THÔNG BÁO */}
              <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>🔔 Gửi Thông Báo Hàng Loạt</h3>
                <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Gửi đến đối tượng</label>
                      <select 
                        value={notificationData.targetRole}
                        onChange={(e) => setNotificationData({ ...notificationData, targetRole: e.target.value })}
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '5px' }}>
                        <option value="ALL">Tất cả người dùng</option>
                        <option value="LANDLORD">Chỉ Chủ Nhà</option>
                        <option value="TENANT">Chỉ Khách Thuê</option>
                      </select>
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Tiêu đề thông báo</label>
                      <input 
                        type="text" 
                        value={notificationData.title}
                        onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                        placeholder="VD: Cập nhật quy định mới..."
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '5px' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Nội dung chi tiết</label>
                    <textarea 
                      value={notificationData.message}
                      onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                      placeholder="Nhập nội dung cần gửi..."
                      rows="3"
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '5px', resize: 'vertical' }}></textarea>
                  </div>
                  <button type="submit" style={{ alignSelf: 'flex-start', padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Gửi Thông Báo Ngay 🚀
                  </button>
                </form>
              </div>

              {/* COMPONENT: DANH SÁCH NGƯỜI DÙNG */}
              <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>🧑‍💼 Danh Sách Người Dùng</h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>Lọc vai trò:</span>
                    <select 
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}>
                      <option value="ALL">Tất cả</option>
                      <option value="LANDLORD">Chủ Nhà</option>
                      <option value="TENANT">Khách Thuê</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 10px' }}>Họ Tên</th>
                      <th style={{ padding: '12px 10px' }}>Email</th>
                      <th style={{ padding: '12px 10px' }}>Số Điện Thoại</th>
                      <th style={{ padding: '12px 10px' }}>Vai Trò</th>
                      <th style={{ padding: '12px 10px' }}>Lần vi phạm</th>
                      <th style={{ padding: '12px 10px' }}>Trạng Thái</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => roleFilter === 'ALL' || u.role === roleFilter)
                      .map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{u.fullName}</td>
                        <td style={{ padding: '12px 10px' }}>{u.email}</td>
                        <td style={{ padding: '12px 10px' }}>{u.phone || 'Chưa cập nhật'}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                            background: u.role === 'ADMIN' ? '#fecdd3' : u.role === 'LANDLORD' ? '#dbeafe' : '#fef3c7',
                            color: u.role === 'ADMIN' ? '#be123c' : u.role === 'LANDLORD' ? '#1d4ed8' : '#b45309'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                           {u.role === 'LANDLORD' ? (
                             <span style={{ color: (u.violationsCount || 0) >= 2 ? '#dc2626' : '#64748b', fontWeight: 'bold' }}>
                               {u.violationsCount || 0} lần
                             </span>
                           ) : (
                             <span style={{ color: '#ccc' }}>-</span>
                           )}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          {u.isActive ? (
                            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>● Đang hoạt động</span>
                          ) : (
                            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>● Đã bị khóa</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          {u.role !== 'ADMIN' && (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                                style={{ padding: '6px 10px', cursor: 'pointer', border: '1px solid transparent', borderRadius: '4px', background: u.isActive ? '#fef2f2' : '#f0fdf4', color: u.isActive ? '#ef4444' : '#22c55e', fontWeight: 'bold' }}
                                title={u.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                              >
                                {u.isActive ? '🔒 Khóa' : '🔓 Mở khóa'}
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                style={{ padding: '6px 10px', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', color: '#64748b' }}
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
          )}

          {activeTab === 'ROOMS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* COMPONENT: DANH SÁCH PHÒNG TRỌ */}
              <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>🏠 Tất Cả Phòng Trọ ({rooms.length})</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '10px' }}>Phòng</th>
                        <th style={{ padding: '10px' }}>Chủ nhà</th>
                        <th style={{ padding: '10px' }}>Ngày tạo</th>
                        <th style={{ padding: '10px' }}>Trạng thái</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Đánh giá</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Báo xấu</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'left', opacity: r.deletedAt ? 0.5 : 1 }}>
                          <td style={{ padding: '10px' }}>
                            <span 
                              onClick={() => navigate(`/room/${r.id}`)}
                              style={{ color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}
                              title="Xem chi tiết phòng"
                            >
                              Phòng {r.roomNumber}
                            </span>
                          </td>
                          <td style={{ padding: '10px' }}>
                            <div>{r.landlord?.fullName}</div>
                            <small style={{ color: '#64748b' }}>{r.landlord?.email} - {r.landlord?.phone}</small>
                          </td>
                          <td style={{ padding: '10px' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '10px' }}>
                            {r.deletedAt ? (
                              <span style={{ color: '#ef4444' }}>Đã xóa</span>
                            ) : (
                              <span style={{ color: r.status === 'AVAILABLE' ? '#16a34a' : '#3b82f6' }}>{r.status}</span>
                            )}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <div style={{ color: Number(r.avgRating) >= 4 ? '#16a34a' : Number(r.avgRating) >= 2 ? '#eab308' : '#ef4444', fontWeight: 'bold' }}>
                              ⭐ {r.avgRating || 0}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <small style={{ color: '#64748b' }}>({r.reviewCount || 0} lượt)</small>
                              <button 
                                onClick={() => handleViewReviews(r.id, r.roomNumber)}
                                style={{ background: 'transparent', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>
                                Xem đánh giá
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
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
                                style={{ background: 'transparent', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', marginTop: '4px' }}>
                                Xem chi tiết
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button 
                              onClick={() => handleToggleRoomVisibility(r.id, r.isHidden)}
                              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: r.isHidden ? '#fef2f2' : '#f8fafc', color: r.isHidden ? '#ef4444' : '#64748b', cursor: 'pointer' }}>
                              {r.isHidden ? '👁️ Mở ẩn' : '🚫 Ẩn phòng'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                {/* COMPONENT: DANH SÁCH HỢP ĐỒNG */}
                <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>📋 Hợp Đồng Gần Đây</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {contracts.map(c => (
                        <li key={c.id} style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
                          <strong>Phòng: {c.room?.roomNumber}</strong> - {c.tenantName}
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            Status: {c.status} | Giá: {c.price.toLocaleString()}đ
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* COMPONENT: SỰ CỐ */}
                <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>🛠️ Phiếu Sự Cố</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {incidents.map(inc => (
                        <li key={inc.id} style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
                          <strong>Khách P.{inc.room?.roomNumber}:</strong> {inc.title}
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            Ngày: {new Date(inc.createdAt).toLocaleDateString()} | 
                            Trạng thái: <span style={{ color: inc.status === 'Pending' ? '#eab308' : inc.status === 'Resolved' ? '#22c55e' : '#3b82f6', fontWeight: 'bold' }}>{inc.status}</span>
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
              <div style={{ display: 'flex', gap: '15px', background: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#475569' }}>Lọc theo thời gian:</span>
                <select 
                  value={filterMonth} 
                  onChange={(e) => setFilterMonth(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                >
                  <option value="ALL">Tất cả tháng</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>Tháng {i+1}</option>
                  ))}
                </select>
                <select 
                  value={filterYear} 
                  onChange={(e) => setFilterYear(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
                </select>
              </div>

              {/* THỐNG KÊ NGƯỜI DÙNG & PHÒNG (DÒNG 1) */}
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#6366f1' }}>{stats.users.totalTenants + stats.users.totalLandlords}</div>
                  <div style={{ color: '#475569', fontWeight: 'bold' }}>Tổng Người Dùng</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '5px' }}>{stats.users.totalTenants} Khách thuê | {stats.users.totalLandlords} Chủ nhà</div>
                  <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px', fontWeight: 'bold' }}>❄️ Khóa: {stats.users.lockedTenants} Khách, {stats.users.lockedLandlords} Chủ nhà</div>
                  <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px', fontWeight: 'bold' }}>✨ Người dùng mới (kỳ tham chiếu): {stats.users.newUsers}</div>
                </div>

                <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>{stats.rooms.totalRooms}</div>
                  <div style={{ color: '#475569', fontWeight: 'bold' }}>Tổng Phòng Trọ</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '5px' }}>{stats.rooms.rentedRooms} Đang cho thuê | {stats.rooms.availableRooms} Trống</div>
                  <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '5px', fontWeight: 'bold' }}>👁️ Bị ẩn (vi phạm): {stats.rooms.hiddenRooms} phòng</div>
                </div>
              </div>

              {/* BÁO CÁO DOANH THU CHI TIẾT (DÒNG 2) */}
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#334155', marginBottom: '20px' }}>
                  📊 Báo cáo Doanh thu Chi tiết
                </h3>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  {/* Cột 1: Tổng Doanh Thu */}
                  <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '5px solid #3b82f6' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Tổng doanh thu toàn hệ thống</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6', margin: '15px 0 10px 0' }}>
                      {stats.revenueStats.totalRevenue.toLocaleString('vi-VN')} đ
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>= Phòng + Điện nước</div>
                  </div>

                  {/* Cột 2: Từ tiền phòng */}
                  <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '5px solid #10b981' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Từ tiền phòng</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', margin: '15px 0 10px 0' }}>
                      {stats.revenueStats.roomRevenue.toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  {/* Cột 3: Từ điện nước */}
                  <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '5px solid #06b6d4' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Từ điện nước</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#06b6d4', margin: '15px 0 10px 0' }}>
                      {stats.revenueStats.utilityRevenue.toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  {/* Cột 4: Khách đang nợ */}
                  <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '5px solid #ef4444' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Khách đang nợ</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444', margin: '15px 0 10px 0' }}>
                      {stats.revenueStats.totalDebt.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'REGULATIONS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>📜 Quản Lý Nội Quy Hệ Thống</h3>
                
                <form onSubmit={handleUpdateRegulation} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <h4 style={{ margin: 0 }}>Cập nhật nội quy mới</h4>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Đối tượng áp dụng</label>
                      <select 
                        value={editingReg.target}
                        onChange={(e) => setEditingReg({ ...editingReg, target: e.target.value })}
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '5px' }}>
                        <option value="ALL">Tất cả</option>
                        <option value="LANDLORD">Chủ Nhà</option>
                        <option value="TENANT">Khách Thuê</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Nội dung nội quy</label>
                    <textarea 
                      value={editingReg.content}
                      onChange={(e) => setEditingReg({ ...editingReg, content: e.target.value })}
                      placeholder="Nhập nội quy chi tiết..."
                      rows="8"
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '5px', resize: 'vertical' }}></textarea>
                  </div>
                  <button type="submit" style={{ alignSelf: 'flex-start', padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Lưu & Cập Nhật 🚀
                  </button>
                </form>

                <h4 style={{ marginBottom: '10px' }}>Nội quy hiện tại</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {regulations.length === 0 ? (
                    <p style={{ color: '#64748b' }}>Chưa có nội quy nào được thiết lập.</p>
                  ) : (
                    regulations.map(reg => (
                      <div key={reg.id} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                            background: reg.target === 'ALL' ? '#f1f5f9' : reg.target === 'LANDLORD' ? '#dbeafe' : '#fef3c7',
                            color: reg.target === 'ALL' ? '#475569' : reg.target === 'LANDLORD' ? '#1d4ed8' : '#b45309'
                          }}>
                            {reg.target === 'ALL' ? 'Tất cả' : (reg.target === 'LANDLORD' ? 'Chủ nhà' : 'Khách thuê')}
                          </span>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              onClick={() => setEditingReg({ target: reg.target, content: reg.value })}
                              style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                              Sửa
                            </button>
                            <button 
                              onClick={() => handleDeleteRegulation(reg.id)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                              Xóa
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', textAlign: 'left' }}>
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
              <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 30px 0', color: '#1e293b', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                  <span style={{ background: '#eff6ff', padding: '8px', borderRadius: '10px' }}>🔐</span> Thay đổi mật khẩu
                </h3>
                
                <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  {/* Trường: Mật khẩu hiện tại */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', textAlign: 'left', marginLeft: '4px' }}>Mật khẩu hiện tại</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type={showOldPwd ? "text" : "password"}
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        placeholder="••••••••"
                        required
                        style={{ width: '100%', padding: '14px 45px 14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', fontSize: '15px', transition: 'all 0.2s', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                        onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowOldPwd(!showOldPwd)} 
                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '6px', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => e.target.style.color = '#64748b'}
                        onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                      >
                        {showOldPwd ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Trường: Mật khẩu mới */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', textAlign: 'left', marginLeft: '4px' }}>Mật khẩu mới</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type={showNewPwd ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Tối thiểu 6 ký tự"
                        required
                        style={{ width: '100%', padding: '14px 45px 14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', fontSize: '15px', transition: 'all 0.2s', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                        onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowNewPwd(!showNewPwd)} 
                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '6px' }}
                      >
                        {showNewPwd ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Trường: Xác nhận mật khẩu mới */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', textAlign: 'left', marginLeft: '4px' }}>Xác nhận mật khẩu mới</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type={showConfirmPwd ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                        style={{ width: '100%', padding: '14px 45px 14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', fontSize: '15px', transition: 'all 0.2s', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                        onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)} 
                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '6px' }}
                      >
                        {showConfirmPwd ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '15px' }}>
                    <button 
                      type="submit" 
                      style={{ width: '100%', padding: '16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: 'all 0.3s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)' }}
                      onMouseEnter={(e) => { e.target.style.background = '#1d4ed8'; e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.3)'; }}
                      onMouseLeave={(e) => { e.target.style.background = '#2563eb'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.2)'; }}
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: '#fff', width: '90%', maxWidth: '600px', maxHeight: '80vh', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setSelectedRoomReports(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>✖</button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px', paddingRight: '30px' }}>
              <h3 style={{ margin: '0', color: '#333', fontSize: '18px' }}>
                Báo xấu: Phòng {selectedRoomReports.roomNumber}
              </h3>
              {selectedRoomReports.reports.some(r => r.status === 'PENDING') && (
                <button
                  onClick={() => handleResolveAllReports(selectedRoomReports.roomId)}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                  }}>
                  ✅ Giải quyết toàn bộ
                </button>
              )}
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {selectedRoomReports.reports.map((report, idx) => (
                <div key={idx} style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ color: report.status === 'PENDING' ? '#ef4444' : '#10b981' }}>{report.reason}</strong>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: report.status === 'PENDING' ? '#fee2e2' : '#d1fae5',
                        color: report.status === 'PENDING' ? '#ef4444' : '#10b981'
                      }}>
                        {report.status === 'PENDING' ? 'Chờ xử lý' : 'Đã giải quyết'}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                  {report.description && (
                    <p style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#334155' }}>
                      Mô tả: {report.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      Người báo cáo: <strong>{report.fullName}</strong> - SĐT: <strong>{report.phoneNumber}</strong>
                    </div>
                    {report.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdateReportStatus(report.id, 'RESOLVED')}
                        style={{
                          background: '#3b82f6',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                        }}>
                        Đánh dấu Đã giải quyết ✅
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: '#fff', width: '90%', maxWidth: '800px', maxHeight: '85vh', borderRadius: '12px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setSelectedRoomReviews(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f1f1', border: 'none', width: '35px', height: '35px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', color: '#666', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>✖</button>
            
            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '22px', borderBottom: '2px solid #3b82f6', paddingBottom: '12px' }}>
              📜 Quản lý Đánh giá: Phòng {selectedRoomReviews.roomNumber}
            </h3>

            {/* THANH CÔNG CỤ: LỌC & TÌM KIẾM */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Lọc theo số sao:</label>
                <select 
                  value={reviewFilterRating}
                  onChange={(e) => setReviewFilterRating(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="ALL">Tất cả đánh giá</option>
                  <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
                  <option value="4">⭐⭐⭐⭐ (4 sao)</option>
                  <option value="3">⭐⭐⭐ (3 sao)</option>
                  <option value="2">⭐⭐ (2 sao)</option>
                  <option value="1">⭐ (1 sao)</option>
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' }}>Tìm kiếm tên khách / nội dung:</label>
                <input 
                  type="text" 
                  value={reviewSearchText}
                  onChange={(e) => setReviewSearchText(e.target.value)}
                  placeholder="Nhập tên khách hoặc nội dung đánh giá..."
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
              {selectedRoomReviews.reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có đánh giá nào cho phòng này.</div>
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
                    <div key={rev.id} style={{ padding: '20px', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>{rev.tenant?.fullName || 'Khách thuê cũ'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(rev.createdAt).toLocaleString('vi-VN')}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span style={{ fontSize: '18px', color: '#eab308' }}>{'⭐'.repeat(rev.rating)}</span>
                          <button 
                            onClick={() => handleDeleteReview(rev.id)}
                            style={{ padding: '5px 12px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: '0.2s' }}
                            onMouseEnter={(e) => e.target.style.background = '#fecaca'}
                            onMouseLeave={(e) => e.target.style.background = '#fee2e2'}>
                            🗑️ Xóa đánh giá
                          </button>
                        </div>
                      </div>

                      <div style={{ color: '#334155', fontSize: '14px', lineHeight: '1.6', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        {rev.comment || <em style={{ color: '#94a3b8' }}>Khách hàng không để lại bình luận.</em>}
                      </div>

                      {/* Hiển thị ảnh kèm theo nếu có */}
                      {rev.images && JSON.parse(rev.images).length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '5px' }}>
                          {JSON.parse(rev.images).map((img, i) => (
                            <img 
                              key={i} 
                              src={`http://localhost:5000/uploads/${img}`} 
                              alt="Review" 
                              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} 
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
