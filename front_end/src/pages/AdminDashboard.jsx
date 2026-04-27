import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import adminApi from '../api/adminApi';
import authApi from '../api/authApi';
import notificationApi from '../api/notificationApi';
import {
  AdminUsersTab,
  AdminRoomsTab,
  AdminStatsTab,
  AdminRegulationsTab,
  AdminSettingsTab,
  ReportDetailModal,
  ReviewDetailModal,
  AdminSubscriptionTab
} from '../components/admin';
import { ProfileModal, NotificationPanel } from '../components/landlord';

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

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // State cho bộ lọc Thống kê
  const [filterMonth, setFilterMonth] = useState('ALL');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [notificationData, setNotificationData] = useState({ targetRole: 'ALL', title: '', message: '' });
  const [roleFilter, setRoleFilter] = useState('ALL'); // Bộ lọc vai trò người dùng
  const [regulations, setRegulations] = useState([]); // Danh sách nội quy
  const [editingReg, setEditingReg] = useState({ target: 'ALL', content: '' });

  // State Quản lý Đánh giá (Reviews)
  const [selectedRoomReports, setSelectedRoomReports] = useState(null);
  const [selectedRoomReviews, setSelectedRoomReviews] = useState(null);
  const [reviewFilterRating, setReviewFilterRating] = useState('ALL');
  const [reviewSearchText, setReviewSearchText] = useState('');

  // States cho Profile Modal (Xem chi tiết user)
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({});
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
    fetchNotifications();

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navigate, user]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getMyNotifications();
      setNotifications(res);
    } catch (error) { console.error("Lỗi lấy thông báo:", error); }
  };

  const handleReadNotification = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (error) { console.error(error); }
  };

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

  const handleViewReviews = (roomId, roomNumber) => {
    fetchReviewsForModal(roomId, roomNumber);
  };

  const handleViewDetails = (u) => {
    setSelectedUser(u);
    setProfileData({ ...u });
    setShowProfileModal(true);
  };



  const fetchReviewsForModal = async (roomId, roomNumber) => {
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
        <h2 className="m-0 text-primary font-black text-2xl tracking-tight flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('STATS')}>
          <span className="material-symbols-outlined text-[28px] fill-1">admin_panel_settings</span>
          HỆ THỐNG QUẢN TRỊ
        </h2>
        <div className="flex items-center gap-4 md:gap-6">
          <NotificationPanel
            notificationRef={notificationRef}
            notifications={notifications}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            handleReadNotification={handleReadNotification}
          />
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
            { id: 'SUBSCRIPTION', icon: 'payments', label: 'Thu phí & Gói Dịch Vụ' },
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
            <AdminUsersTab 
              notificationData={notificationData}
              setNotificationData={setNotificationData}
              handleSendNotification={handleSendNotification}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              users={users}
              handleToggleUserStatus={handleToggleUserStatus}
              handleDeleteUser={handleDeleteUser}
              handleViewDetails={handleViewDetails}
            />
          )}

          {activeTab === 'ROOMS' && (
            <AdminRoomsTab 
              rooms={rooms}
              contracts={contracts}
              incidents={incidents}
              navigate={navigate}
              handleViewReviews={handleViewReviews}
              setSelectedRoomReports={setSelectedRoomReports}
              handleToggleRoomVisibility={handleToggleRoomVisibility}
            />
          )}

          {activeTab === 'STATS' && (
            <AdminStatsTab 
              filterMonth={filterMonth}
              setFilterMonth={setFilterMonth}
              filterYear={filterYear}
              setFilterYear={setFilterYear}
              stats={stats}
            />
          )}

          {activeTab === 'SUBSCRIPTION' && (
            <AdminSubscriptionTab />
          )}

          {activeTab === 'REGULATIONS' && (
            <AdminRegulationsTab 
              editingReg={editingReg}
              setEditingReg={setEditingReg}
              handleUpdateRegulation={handleUpdateRegulation}
              regulations={regulations}
              handleDeleteRegulation={handleDeleteRegulation}
            />
          )}

          {activeTab === 'SETTINGS' && (
            <AdminSettingsTab 
              handleSavePassword={handleSavePassword}
              passwordData={passwordData}
              setPasswordData={setPasswordData}
              showOldPwd={showOldPwd}
              setShowOldPwd={setShowOldPwd}
              showNewPwd={showNewPwd}
              setShowNewPwd={setShowNewPwd}
              showConfirmPwd={showConfirmPwd}
              setShowConfirmPwd={setShowConfirmPwd}
            />
          )}
        </div>
      </div>

      <ReportDetailModal 
        selectedRoomReports={selectedRoomReports}
        setSelectedRoomReports={setSelectedRoomReports}
        handleResolveAllReports={handleResolveAllReports}
        handleUpdateReportStatus={handleUpdateReportStatus}
      />

      {/* MODAL CHI TIẾT ĐÁNH GIÁ */}
      <ReviewDetailModal 
        selectedRoomReviews={selectedRoomReviews}
        setSelectedRoomReviews={setSelectedRoomReviews}
        reviewFilterRating={reviewFilterRating}
        setReviewFilterRating={setReviewFilterRating}
        reviewSearchText={reviewSearchText}
        setReviewSearchText={setReviewSearchText}
        handleDeleteReview={handleDeleteReview}
      />

      {/* MODAL THÔNG TIN NGƯỜI DÙNG (PROFILE) */}
      <ProfileModal 
        showProfileModal={showProfileModal} 
        setShowProfileModal={setShowProfileModal} 
        isEditingProfile={isEditingProfile} 
        setIsEditingProfile={setIsEditingProfile} 
        isChangingPassword={isChangingPassword} 
        setIsChangingPassword={setIsChangingPassword} 
        profileData={profileData} 
        setProfileData={setProfileData} 
        passwordData={passwordData} 
        setPasswordData={setPasswordData} 
        showOldPwd={showOldPwd} 
        setShowOldPwd={setShowOldPwd} 
        showNewPwd={showNewPwd} 
        setShowNewPwd={setShowNewPwd} 
        showConfirmPwd={showConfirmPwd} 
        setShowConfirmPwd={setShowConfirmPwd} 
        user={selectedUser} 
        canEdit={false}
      />
    </div>
  );
};

export default AdminDashboard;
