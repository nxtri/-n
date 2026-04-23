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
    <div className="flex flex-col h-screen font-['Inter'] bg-surface-container-lowest text-on-surface">
      {/* HEADER */}
      <div className="bg-surface-container-lowest text-on-surface px-6 py-3 flex justify-between items-center shadow-sm border-b border-outline-variant/30 z-10 sticky top-0">
        <h2 className="m-0 text-primary font-black text-2xl tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] fill-1">admin_panel_settings</span>
          HỆ THỐNG QUẢN TRỊ
        </h2>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3 bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant/30">
            <div className="w-8 h-8 rounded-full bg-primary flex justify-center items-center shadow-inner">
               <span className="text-white font-black text-[14px]">{user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}</span>
            </div>
            <div className="flex flex-col hidden md:flex">
              <span className="text-[14px] font-bold">{user.fullName}</span>
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{user.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error rounded-xl font-bold transition-all hover:bg-error hover:text-white shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="hidden md:inline">Đăng xuất</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-[280px] bg-surface-container-lowest border-r border-outline-variant/30 overflow-y-auto py-6 text-left no-scrollbar flex flex-col gap-2 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-0">
          {[
            { id: 'USERS', icon: 'manage_accounts', label: 'Người Dùng & Thông Báo' },
            { id: 'ROOMS', icon: 'real_estate_agent', label: 'Phòng, Hợp đồng & Sự cố' },
            { id: 'STATS', icon: 'query_stats', label: 'Thống Kê' },
            { id: 'REGULATIONS', icon: 'gavel', label: 'Quản lý Nội quy' },
            { id: 'SETTINGS', icon: 'settings', label: 'Tài khoản & Bảo mật' }
          ].map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`mx-4 px-4 py-3.5 rounded-2xl cursor-pointer font-black flex items-center gap-3 transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' : 'text-on-surface hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined text-[22px]">{tab.icon}</span> {tab.label}
            </div>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 px-4 py-6 md:px-8 md:py-8 overflow-y-auto no-scrollbar relative bg-surface-container-low/30">
          {activeTab === 'USERS' && (
            <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">
              
              {/* COMPONENT: GỬI THÔNG BÁO */}
              <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30">
                <h3 className="m-0 mb-6 text-on-surface text-xl font-black flex items-center gap-3">
                  <span className="material-symbols-outlined text-[24px] text-primary">campaign</span> Gửi Thông Báo Hàng Loạt
                </h3>
                <form onSubmit={handleSendNotification} className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">Gửi đến đối tượng</label>
                      <select 
                        value={notificationData.targetRole}
                        onChange={(e) => setNotificationData({ ...notificationData, targetRole: e.target.value })}
                        className="w-full p-3 border border-outline-variant/50 rounded-xl outline-none bg-surface-container-low text-on-surface focus:border-primary transition-colors focus:ring-2 focus:ring-primary/20 font-medium">
                        <option value="ALL">Tất cả người dùng</option>
                        <option value="LANDLORD">Chỉ Chủ Nhà</option>
                        <option value="TENANT">Chỉ Khách Thuê</option>
                      </select>
                    </div>
                    <div className="flex-[2]">
                      <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">Tiêu đề thông báo</label>
                      <input 
                        type="text" 
                        value={notificationData.title}
                        onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                        placeholder="VD: Cập nhật quy định mới..."
                        className="w-full p-3 border border-outline-variant/50 rounded-xl outline-none bg-surface-container-low text-on-surface focus:border-primary transition-colors focus:ring-2 focus:ring-primary/20 font-medium" />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">Nội dung chi tiết</label>
                    <textarea 
                      value={notificationData.message}
                      onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                      placeholder="Nhập nội dung cần gửi..."
                      rows="3"
                      className="w-full p-3 border border-outline-variant/50 rounded-xl resize-y outline-none bg-surface-container-low text-on-surface focus:border-primary transition-colors focus:ring-2 focus:ring-primary/20 font-medium"></textarea>
                  </div>
                  <button type="submit" className="self-start px-8 py-3.5 bg-primary text-white border-none rounded-xl cursor-pointer font-black shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 hover:shadow-xl active:translate-y-0 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">send</span> Gửi Thông Báo Ngay
                  </button>
                </form>
              </div>

              {/* COMPONENT: DANH SÁCH NGƯỜI DÙNG */}
              <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="m-0 text-on-surface text-xl font-black flex items-center gap-3">
                    <span className="material-symbols-outlined text-[24px] text-primary">groups</span> Danh Sách Người Dùng
                  </h3>
                  
                  <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/30">
                    <span className="text-[14px] font-bold text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">filter_list</span> Lọc vai trò:</span>
                    <select 
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-2 py-1 rounded-lg border-none bg-transparent font-bold text-on-surface outline-none cursor-pointer">
                      <option value="ALL">Tất cả</option>
                      <option value="LANDLORD">Chủ Nhà</option>
                      <option value="TENANT">Khách Thuê</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-outline-variant/30">
                  <table className="w-full border-collapse text-left bg-surface-container-lowest">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30">
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Họ Tên</th>
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Email</th>
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Số Điện Thoại</th>
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Vai Trò</th>
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Lần vi phạm</th>
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Trạng Thái</th>
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider text-center whitespace-nowrap">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="font-medium text-on-surface">
                      {users
                        .filter(u => roleFilter === 'ALL' || u.role === roleFilter)
                        .map(u => (
                        <tr key={u.id} className="border-b border-outline-variant/10 transition-colors hover:bg-surface-container-low/50">
                          <td className="p-4 font-bold text-on-surface">{u.fullName}</td>
                          <td className="p-4 text-on-surface-variant">{u.email}</td>
                          <td className="p-4 text-on-surface-variant">{u.phone || <em className="text-on-surface-variant opacity-50">Chưa cập nhật</em>}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1.5 rounded-full text-[12px] font-bold border ${
                              u.role === 'ADMIN' ? 'bg-error/10 text-error border-error/20' : 
                              u.role === 'LANDLORD' ? 'bg-primary/10 text-primary border-primary/20' : 
                              'bg-secondary/10 text-secondary border-secondary/20'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                             {u.role === 'LANDLORD' ? (
                               <span className={`font-bold ${(u.violationsCount || 0) >= 2 ? 'text-error bg-error/10 px-2 py-0.5 rounded' : 'text-on-surface-variant'}`}>
                                 {u.violationsCount || 0} lần
                               </span>
                             ) : (
                               <span className="text-outline-variant/50">-</span>
                             )}
                          </td>
                          <td className="p-4">
                            {u.isActive ? (
                              <span className="text-success font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success"></div> Đang hoạt động</span>
                            ) : (
                              <span className="text-error font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-error"></div> Bị khóa</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {u.role !== 'ADMIN' && (
                              <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                                  className={`px-3 py-1.5 cursor-pointer border rounded-lg font-bold transition-all hover:scale-105 flex items-center gap-1.5 ${u.isActive ? 'border-error/20 bg-error/10 text-error hover:bg-error hover:text-white' : 'border-success/20 bg-success/10 text-success hover:bg-success hover:text-white'}`}
                                  title={u.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                                >
                                  <span className="material-symbols-outlined text-[16px]">{u.isActive ? 'lock' : 'lock_open'}</span> {u.isActive ? 'Khóa' : 'Mở'}
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="px-3 py-1.5 cursor-pointer border border-outline-variant/30 rounded-lg bg-surface-container-low text-on-surface-variant transition-all hover:bg-error hover:text-white hover:border-error"
                                  title="Xóa người dùng"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
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
            <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">
              
              {/* COMPONENT: DANH SÁCH PHÒNG TRỌ */}
              <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30">
                <h3 className="m-0 mb-6 text-on-surface text-xl font-black flex items-center gap-3">
                  <span className="material-symbols-outlined text-[24px] text-primary">real_estate_agent</span> Tất Cả Phòng Trọ ({rooms.length})
                </h3>
                <div className="max-h-[400px] overflow-y-auto rounded-2xl border border-outline-variant/30 no-scrollbar">
                  <table className="w-full border-collapse text-left bg-surface-container-lowest">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30 sticky top-0 z-10">
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Phòng</th>
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Chủ nhà</th>
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Ngày tạo</th>
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider text-center whitespace-nowrap">Đánh giá</th>
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider text-center whitespace-nowrap">Báo xấu</th>
                        <th className="p-4 text-[14px] font-black uppercase tracking-wider text-center whitespace-nowrap">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="font-medium text-on-surface">
                      {rooms.map(r => (
                        <tr key={r.id} className={`border-b border-outline-variant/10 transition-colors hover:bg-surface-container-low/50 ${r.deletedAt ? 'opacity-60 grayscale' : ''}`}>
                          <td className="p-4">
                            <span 
                              onClick={() => navigate(`/room/${r.id}`)}
                              className="text-primary font-bold cursor-pointer hover:underline flex items-center gap-2"
                              title="Xem chi tiết phòng"
                            >
                              <span className="material-symbols-outlined text-[18px]">door_open</span> Phòng {r.roomNumber}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-on-surface">{r.landlord?.fullName}</div>
                            <div className="text-[12px] text-on-surface-variant mt-1 flex flex-col gap-0.5">
                              <span>{r.landlord?.email}</span>
                              <span className="font-bold opacity-80">{r.landlord?.phone}</span>
                            </div>
                          </td>
                          <td className="p-4 text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="p-4">
                            {r.deletedAt ? (
                              <span className="font-bold text-error flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">delete</span> Đã xóa</span>
                            ) : (
                              <span className={`px-3 py-1.5 rounded-full text-[12px] font-bold border ${r.status === 'AVAILABLE' ? 'bg-success/10 text-success border-success/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                {r.status === 'AVAILABLE' ? 'Phòng Trống' : 'Đã Thuê'}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className={`font-black text-[15px] flex items-center justify-center gap-1 ${Number(r.avgRating) >= 4 ? 'text-success' : Number(r.avgRating) >= 2 ? 'text-secondary' : 'text-error'}`}>
                              <span className="material-symbols-outlined text-[18px] fill-1">star</span> {r.avgRating || 0}
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                              <small className="text-on-surface-variant opacity-70 font-bold">({r.reviewCount || 0} lượt)</small>
                              <button 
                                onClick={() => handleViewReviews(r.id, r.roomNumber)}
                                className="bg-transparent border-none text-primary cursor-pointer text-[12px] font-bold hover:underline">
                                Xem đánh giá
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            { (() => {
                              const pendingCount = r.reports?.filter(rep => rep.status === 'PENDING').length || 0;
                              return (
                                <div className={`font-bold flex items-center justify-center gap-1.5 ${pendingCount > 0 ? 'text-error bg-error/10 px-2 py-1 rounded-lg' : 'text-on-surface-variant'}`}>
                                  {pendingCount > 0 ? <><span className="material-symbols-outlined text-[16px]">warning</span> {pendingCount} chờ xử lý</> : `${r.reports?.length || 0} báo cáo`}
                                </div>
                              );
                            })() }
                            {(r.reports?.length || 0) > 0 && (
                              <button 
                                onClick={() => setSelectedRoomReports({ roomNumber: r.roomNumber, reports: r.reports, roomId: r.id })}
                                className="bg-transparent border-none text-primary cursor-pointer text-[12px] font-bold mt-2 hover:underline">
                                Xem chi tiết
                              </button>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => handleToggleRoomVisibility(r.id, r.isHidden)}
                              className={`px-3 py-1.5 rounded-lg border cursor-pointer font-bold transition-all hover:scale-105 flex items-center gap-1.5 mx-auto ${r.isHidden ? 'border-error/20 bg-error/10 text-error hover:bg-error hover:text-white' : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">{r.isHidden ? 'visibility' : 'visibility_off'}</span>
                              {r.isHidden ? 'Mở ẩn' : 'Ẩn phòng'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* COMPONENT: DANH SÁCH HỢP ĐỒNG */}
                <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col h-full">
                  <h3 className="m-0 mb-6 text-on-surface text-xl font-black flex items-center gap-3">
                    <span className="material-symbols-outlined text-[24px] text-primary">description</span> Hợp Đồng Gần Đây
                  </h3>
                  <div className="max-h-[350px] overflow-y-auto no-scrollbar flex-1">
                    <div className="flex flex-col gap-4">
                      {contracts.map(c => (
                        <div key={c.id} className="p-4 border border-outline-variant/20 rounded-2xl bg-surface-container-low/50 hover:bg-surface-container-low hover:border-primary/20 transition-all flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                             <div className="flex flex-col gap-1">
                               <span className="text-primary font-black flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">door_open</span> Phòng: {c.room?.roomNumber}</span>
                               <span className="text-on-surface font-bold text-[15px]">{c.tenantName}</span>
                             </div>
                             <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${c.status === 'ACTIVE' ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'}`}>
                               {c.status}
                             </span>
                          </div>
                          <div className="flex justify-between items-end border-t border-outline-variant/10 pt-3">
                             <span className="text-[12px] text-on-surface-variant opacity-70 font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                             <span className="font-black text-on-surface text-[15px]">{c.price.toLocaleString()}đ<span className="text-[11px] font-medium opacity-60">/tháng</span></span>
                          </div>
                        </div>
                      ))}
                      {contracts.length === 0 && <div className="text-center p-8 text-on-surface-variant opacity-60 font-medium italic">Không có hợp đồng nào.</div>}
                    </div>
                  </div>
                </div>

                {/* COMPONENT: SỰ CỐ */}
                <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30 flex flex-col h-full">
                  <h3 className="m-0 mb-6 text-on-surface text-xl font-black flex items-center gap-3">
                    <span className="material-symbols-outlined text-[24px] text-primary">engineering</span> Phiếu Sự Cố Gần Đây
                  </h3>
                  <div className="max-h-[350px] overflow-y-auto no-scrollbar flex-1">
                    <div className="flex flex-col gap-4">
                      {incidents.map(inc => (
                        <div key={inc.id} className="p-4 border border-outline-variant/20 rounded-2xl bg-surface-container-low/50 hover:bg-surface-container-low hover:border-primary/20 transition-all flex flex-col gap-3">
                           <div className="flex flex-col gap-1.5">
                             <span className="text-primary font-black flex items-center gap-1.5 text-[13px]"><span className="material-symbols-outlined text-[16px]">door_open</span> Khách Phòng {inc.room?.roomNumber}</span>
                             <span className="text-on-surface font-bold text-[15px] leading-snug">{inc.title}</span>
                           </div>
                           <div className="flex justify-between items-center border-t border-outline-variant/10 pt-3">
                             <span className="text-[12px] text-on-surface-variant opacity-70 font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {new Date(inc.createdAt).toLocaleDateString('vi-VN')}</span>
                             <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${inc.status === 'Pending' ? 'bg-secondary/10 text-secondary' : inc.status === 'Resolved' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                               {inc.status}
                             </span>
                           </div>
                        </div>
                      ))}
                      {incidents.length === 0 && <div className="text-center p-8 text-on-surface-variant opacity-60 font-medium italic">Không có sự cố nào.</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'STATS' && stats && (
            <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">
              
              {/* BỘ LỌC THỜI GIAN */}
              <div className="flex flex-wrap gap-4 bg-surface-container-lowest p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] items-center border border-outline-variant/30">
                <span className="font-black text-on-surface text-[15px] flex items-center gap-2"><span className="material-symbols-outlined text-[20px] text-primary">calendar_month</span> Lọc theo thời gian:</span>
                <select 
                  value={filterMonth} 
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface outline-none font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="ALL">Tất cả tháng</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>Tháng {i+1}</option>
                  ))}
                </select>
                <select 
                  value={filterYear} 
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface outline-none font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
                </select>
              </div>

              {/* THỐNG KÊ NGƯỜI DÙNG & PHÒNG (DÒNG 1) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30 text-center flex flex-col items-center">
                  <div className="text-[48px] font-black text-primary mb-2 leading-none drop-shadow-sm">{stats.users.totalTenants + stats.users.totalLandlords}</div>
                  <div className="text-on-surface font-black text-lg mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">groups</span> Tổng Người Dùng</div>
                  <div className="text-[14px] text-on-surface-variant font-medium mb-6">{stats.users.totalTenants} Khách thuê | {stats.users.totalLandlords} Chủ nhà</div>
                  
                  <div className="w-full grid grid-cols-2 gap-4 mt-auto">
                    <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex flex-col gap-1 items-center justify-center">
                      <span className="material-symbols-outlined text-[20px] text-error">lock</span>
                      <div className="text-[13px] text-error font-black text-center leading-tight">Khóa: {stats.users.lockedTenants} Khách<br/>{stats.users.lockedLandlords} Chủ nhà</div>
                    </div>
                    <div className="p-4 bg-success/10 border border-success/20 rounded-2xl flex flex-col gap-1 items-center justify-center">
                      <span className="material-symbols-outlined text-[20px] text-success">person_add</span>
                      <div className="text-[13px] text-success font-black text-center leading-tight">Người dùng mới<br/><span className="text-[16px]">{stats.users.newUsers}</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30 text-center flex flex-col items-center">
                  <div className="text-[48px] font-black text-success mb-2 leading-none drop-shadow-sm">{stats.rooms.totalRooms}</div>
                  <div className="text-on-surface font-black text-lg mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">real_estate_agent</span> Tổng Phòng Trọ</div>
                  <div className="text-[14px] text-on-surface-variant font-medium mb-6">{stats.rooms.rentedRooms} Đang cho thuê | {stats.rooms.availableRooms} Trống</div>
                  
                  <div className="w-full p-4 bg-secondary/10 border border-secondary/20 rounded-2xl mt-auto flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-[24px] text-secondary">visibility_off</span>
                    <div className="text-[14px] text-secondary font-black">Bị ẩn (vi phạm): {stats.rooms.hiddenRooms} phòng</div>
                  </div>
                </div>
              </div>

              {/* BÁO CÁO DOANH THU CHI TIẾT (DÒNG 2) */}
              <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30">
                <h3 className="m-0 mb-8 text-on-surface text-xl font-black flex items-center gap-3">
                  <span className="material-symbols-outlined text-[24px] text-primary">trending_up</span> Báo Cáo Doanh Thu Chi Tiết
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Cột 1: Tổng Doanh Thu */}
                  <div className="bg-surface-container-low p-6 rounded-2xl border-l-[6px] border-l-primary border border-outline-variant/30 flex flex-col justify-between">
                    <div className="text-[12px] font-black text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">account_balance</span> Tổng doanh thu</div>
                    <div className="text-[28px] font-black text-primary leading-tight break-words">
                      {stats.revenueStats.totalRevenue.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="text-[11px] text-on-surface-variant/70 font-bold mt-2">= Phòng + Điện nước</div>
                  </div>

                  {/* Cột 2: Từ tiền phòng */}
                  <div className="bg-surface-container-low p-6 rounded-2xl border-l-[6px] border-l-success border border-outline-variant/30 flex flex-col justify-between">
                    <div className="text-[12px] font-black text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">meeting_room</span> Từ tiền phòng</div>
                    <div className="text-[28px] font-black text-success leading-tight break-words">
                      {stats.revenueStats.roomRevenue.toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  {/* Cột 3: Từ điện nước */}
                  <div className="bg-surface-container-low p-6 rounded-2xl border-l-[6px] border-l-info border border-outline-variant/30 flex flex-col justify-between">
                    <div className="text-[12px] font-black text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">water_drop</span> Từ điện nước</div>
                    <div className="text-[28px] font-black text-info leading-tight break-words">
                      {stats.revenueStats.utilityRevenue.toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  {/* Cột 4: Khách đang nợ */}
                  <div className="bg-error/5 p-6 rounded-2xl border-l-[6px] border-l-error border border-error/20 flex flex-col justify-between">
                    <div className="text-[12px] font-black text-error uppercase tracking-wider mb-4 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">money_off</span> Khách đang nợ</div>
                    <div className="text-[28px] font-black text-error leading-tight break-words">
                      {stats.revenueStats.totalDebt.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'REGULATIONS' && (
            <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">
              <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30">
                <h3 className="m-0 mb-8 text-on-surface text-xl font-black flex items-center gap-3">
                  <span className="material-symbols-outlined text-[24px] text-primary">gavel</span> Quản Lý Nội Quy Hệ Thống
                </h3>
                
                <form onSubmit={handleUpdateRegulation} className="flex flex-col gap-6 mb-10 p-8 border border-outline-variant/50 rounded-3xl bg-surface-container-low shadow-inner">
                  <h4 className="m-0 text-on-surface text-lg font-black flex items-center gap-2"><span className="material-symbols-outlined text-[20px] text-primary">edit_document</span> Thêm / Cập nhật nội quy</h4>
                  <div className="flex gap-6">
                    <div className="flex-1 max-w-[300px]">
                      <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">Đối tượng áp dụng</label>
                      <select 
                        value={editingReg.target}
                        onChange={(e) => setEditingReg({ ...editingReg, target: e.target.value })}
                        className="w-full p-3 border border-outline-variant/50 rounded-xl outline-none bg-surface-container-lowest text-on-surface font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                        <option value="ALL">Tất cả</option>
                        <option value="LANDLORD">Chủ Nhà</option>
                        <option value="TENANT">Khách Thuê</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">Nội dung nội quy</label>
                    <textarea 
                      value={editingReg.content}
                      onChange={(e) => setEditingReg({ ...editingReg, content: e.target.value })}
                      placeholder="Nhập nội quy chi tiết..."
                      rows="6"
                      className="w-full p-4 border border-outline-variant/50 rounded-xl resize-y outline-none bg-surface-container-lowest text-on-surface font-medium leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"></textarea>
                  </div>
                  <button type="submit" className="self-start px-8 py-3.5 bg-primary text-white border-none rounded-xl cursor-pointer font-black shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 hover:shadow-xl active:translate-y-0 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">save</span> Lưu & Cập Nhật
                  </button>
                </form>

                <h4 className="mb-6 text-lg font-black text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-[20px] text-primary">format_list_bulleted</span> Danh sách nội quy hiện tại</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regulations.length === 0 ? (
                    <p className="col-span-full text-center p-8 text-on-surface-variant font-medium opacity-70 italic border border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-low/50">Chưa có nội quy nào được thiết lập.</p>
                  ) : (
                    regulations.map(reg => (
                      <div key={reg.id} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/50 shadow-sm flex flex-col hover:border-primary/30 hover:shadow-md transition-all group">
                        <div className="flex justify-between mb-4 items-center border-b border-outline-variant/30 pb-4">
                          <span className={`px-3 py-1.5 rounded-full text-[12px] font-bold border ${
                            reg.target === 'ALL' ? 'bg-surface-container-high text-on-surface-variant border-outline-variant/50' : 
                            reg.target === 'LANDLORD' ? 'bg-primary/10 text-primary border-primary/20' : 
                            'bg-secondary/10 text-secondary border-secondary/20'
                          }`}>
                            {reg.target === 'ALL' ? 'Tất cả đối tượng' : (reg.target === 'LANDLORD' ? 'Dành cho Chủ nhà' : 'Dành cho Khách thuê')}
                          </span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setEditingReg({ target: reg.target, content: reg.value })}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer" title="Chỉnh sửa">
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteRegulation(reg.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-error/10 text-error hover:bg-error hover:text-white transition-colors cursor-pointer" title="Xóa">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                        <div className="text-[14px] text-on-surface font-medium whitespace-pre-wrap max-h-[200px] overflow-y-auto text-left leading-relaxed flex-1 no-scrollbar pr-2">
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
            <div className="max-w-[500px] my-10 mx-auto">
              <div className="bg-surface-container-lowest p-10 rounded-3xl border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <h3 className="m-0 mb-8 text-on-surface text-2xl font-black flex items-center justify-center gap-3">
                  <span className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 material-symbols-outlined text-[24px]">lock_reset</span> Thay đổi mật khẩu
                </h3>
                
                <form onSubmit={handleSavePassword} className="flex flex-col gap-6">
                  {/* Trường: Mật khẩu hiện tại */}
                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-[14px] text-on-surface-variant ml-1">Mật khẩu hiện tại</label>
                    <div className="relative w-full">
                      <input 
                        type={showOldPwd ? "text" : "password"}
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        placeholder="••••••••"
                        required
                        className="w-full px-4 py-3.5 pr-12 border border-outline-variant/50 rounded-xl outline-none text-[14px] font-medium transition-all bg-surface-container-lowest text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/10"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowOldPwd(!showOldPwd)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-on-surface-variant p-1 flex items-center justify-center hover:text-primary transition-colors"
                      >
                        {showOldPwd ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Trường: Mật khẩu mới */}
                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-[14px] text-on-surface-variant ml-1">Mật khẩu mới</label>
                    <div className="relative w-full">
                      <input 
                        type={showNewPwd ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Tối thiểu 6 ký tự"
                        required
                        className="w-full px-4 py-3.5 pr-12 border border-outline-variant/50 rounded-xl outline-none text-[14px] font-medium transition-all bg-surface-container-lowest text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/10"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowNewPwd(!showNewPwd)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-on-surface-variant p-1 flex items-center justify-center hover:text-primary transition-colors"
                      >
                        {showNewPwd ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Trường: Xác nhận mật khẩu mới */}
                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-[14px] text-on-surface-variant ml-1">Xác nhận mật khẩu mới</label>
                    <div className="relative w-full">
                      <input 
                        type={showConfirmPwd ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                        className="w-full px-4 py-3.5 pr-12 border border-outline-variant/50 rounded-xl outline-none text-[14px] font-medium transition-all bg-surface-container-lowest text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/10"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-on-surface-variant p-1 flex items-center justify-center hover:text-primary transition-colors"
                      >
                        {showConfirmPwd ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2">
                    <button 
                      type="submit" 
                      className="w-full p-4 bg-primary text-white border-none rounded-xl cursor-pointer font-black text-[15px] transition-all shadow-lg shadow-primary/20 hover:-translate-y-1 hover:shadow-xl active:translate-y-0"
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
        <div className="fixed inset-0 bg-on-surface/80 backdrop-blur-sm flex justify-center items-center z-[99999] p-4">
          <div className="bg-surface-container-lowest w-full max-w-[650px] max-h-[85vh] rounded-3xl p-8 shadow-2xl relative flex flex-col border border-outline-variant/30">
            <button 
              onClick={() => setSelectedRoomReports(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center border-none cursor-pointer hover:bg-error/10 hover:text-error transition-colors" title="Đóng">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4 mb-6 pr-12">
              <h3 className="m-0 text-on-surface text-xl font-black flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] text-error">campaign</span> Báo xấu: Phòng {selectedRoomReports.roomNumber}
              </h3>
              {selectedRoomReports.reports.some(r => r.status === 'PENDING') && (
                <button
                  onClick={() => handleResolveAllReports(selectedRoomReports.roomId)}
                  className="bg-success text-xl border-none px-4 py-2 rounded-xl font-bold text-[14px] cursor-pointer shadow-md shadow-success/20 hover:-translate-y-0.5 hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">done_all</span> Giải quyết toàn bộ
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
              <div className="flex flex-col gap-4">
                {selectedRoomReports.reports.map((report, idx) => (
                  <div key={idx} className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/50 flex flex-col hover:border-primary/30 transition-colors">
                    <div className="flex justify-between mb-3 items-center">
                      <div className="flex items-center gap-3">
                        <strong className={`text-[15px] ${report.status === 'PENDING' ? 'text-error' : 'text-success'}`}>{report.reason}</strong>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${report.status === 'PENDING' ? 'bg-error/10 text-error border-error/20' : 'bg-success/10 text-success border-success/20'}`}>
                          {report.status === 'PENDING' ? 'Chờ xử lý' : 'Đã giải quyết'}
                        </span>
                      </div>
                      <span className="text-[12px] text-on-surface-variant font-bold flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {new Date(report.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    {report.description && (
                      <p className="text-[14px] text-on-surface m-0 mb-4 leading-relaxed bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                        {report.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-dashed border-outline-variant/30">
                      <div className="text-[13px] text-on-surface-variant">
                        Báo cáo bởi: <strong className="text-on-surface">{report.fullName}</strong> - SĐT: <strong className="text-on-surface">{report.phoneNumber}</strong>
                      </div>
                      {report.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateReportStatus(report.id, 'RESOLVED')}
                          className="bg-primary text-white border-none px-4 py-2 rounded-xl text-[13px] cursor-pointer font-bold shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span> Đã xử lý xong
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL QUẢN LÝ ĐÁNH GIÁ (REVIEWS) */}
      {selectedRoomReviews && (
        <div className="fixed inset-0 bg-on-surface/80 backdrop-blur-sm flex justify-center items-center z-[99999] p-4">
          <div className="bg-surface-container-lowest w-full max-w-[850px] max-h-[85vh] rounded-3xl p-8 shadow-2xl relative flex flex-col border border-outline-variant/30">
            <button 
              onClick={() => setSelectedRoomReviews(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center border-none cursor-pointer hover:bg-error/10 hover:text-error transition-colors" title="Đóng">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            
            <h3 className="m-0 text-on-surface text-2xl font-black border-b border-outline-variant/30 pb-4 mb-6 flex items-center gap-2 pr-12">
              <span className="material-symbols-outlined text-[28px] text-secondary fill-1">star</span> Đánh giá chi tiết: Phòng {selectedRoomReviews.roomNumber}
            </h3>

            {/* THANH CÔNG CỤ: LỌC & TÌM KIẾM */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-surface-container-low p-5 rounded-2xl border border-outline-variant/50">
              <div className="flex-1">
                <label className="block text-[13px] font-bold text-on-surface-variant mb-2">Lọc theo số sao:</label>
                <select 
                  value={reviewFilterRating}
                  onChange={(e) => setReviewFilterRating(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 outline-none bg-surface-container-lowest text-on-surface font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                  <option value="ALL">Tất cả đánh giá</option>
                  <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
                  <option value="4">⭐⭐⭐⭐ (4 sao)</option>
                  <option value="3">⭐⭐⭐ (3 sao)</option>
                  <option value="2">⭐⭐ (2 sao)</option>
                  <option value="1">⭐ (1 sao)</option>
                </select>
              </div>
              <div className="flex-[2]">
                <label className="block text-[13px] font-bold text-on-surface-variant mb-2">Tìm kiếm đánh giá:</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
                  <input 
                    type="text" 
                    value={reviewSearchText}
                    onChange={(e) => setReviewSearchText(e.target.value)}
                    placeholder="Nhập tên khách hoặc nội dung đánh giá..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 outline-none bg-surface-container-lowest text-on-surface font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
              {selectedRoomReviews.reviews.length === 0 ? (
                <div className="text-center p-12 text-on-surface-variant font-medium opacity-70 italic border border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-low/50">Chưa có đánh giá nào cho phòng này.</div>
              ) : (
                <div className="flex flex-col gap-5">
                  {selectedRoomReviews.reviews
                    .filter(rev => {
                      const matchRating = reviewFilterRating === 'ALL' || rev.rating.toString() === reviewFilterRating;
                      const matchText = !reviewSearchText || 
                                      (rev.tenant?.fullName || '').toLowerCase().includes(reviewSearchText.toLowerCase()) ||
                                      (rev.comment || '').toLowerCase().includes(reviewSearchText.toLowerCase());
                      return matchRating && matchText;
                    })
                    .map((rev) => (
                      <div key={rev.id} className="p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/50 relative shadow-sm hover:border-primary/30 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="font-black text-lg text-on-surface">{rev.tenant?.fullName || 'Khách thuê cũ'}</div>
                            <div className="text-[12px] text-on-surface-variant font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {new Date(rev.createdAt).toLocaleString('vi-VN')}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2.5">
                            <span className="text-[18px] text-secondary tracking-widest fill-1">{'⭐'.repeat(rev.rating)}</span>
                            <button 
                              onClick={() => handleDeleteReview(rev.id)}
                              className="px-3 py-1.5 bg-error/10 text-error border border-error/20 rounded-lg cursor-pointer text-[12px] font-black transition-all hover:bg-error hover:text-white flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span> Xóa đánh giá
                            </button>
                          </div>
                        </div>

                        <div className="text-[14px] text-on-surface leading-relaxed bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                          {rev.comment || <em className="text-on-surface-variant opacity-70">Khách hàng không để lại bình luận.</em>}
                        </div>

                        {/* Hiển thị ảnh kèm theo nếu có */}
                        {rev.images && JSON.parse(rev.images).length > 0 && (
                          <div className="flex gap-3 mt-4 overflow-x-auto pb-1 no-scrollbar">
                            {JSON.parse(rev.images).map((img, i) => (
                              <img 
                                key={i} 
                                src={`http://localhost:5000/uploads/${img}`} 
                                alt="Review" 
                                className="w-[100px] h-[100px] object-cover rounded-xl border border-outline-variant/30 cursor-pointer transition-all hover:scale-105 hover:border-primary" 
                                onClick={() => window.open(`http://localhost:5000/uploads/${img}`)} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
