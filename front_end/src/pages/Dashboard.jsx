import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardProvider } from '../context/DashboardContext';
import roomApi from '../api/roomApi';
import axios from 'axios';
import contractApi from '../api/contractApi';
import billApi from '../api/billApi';
import axiosClient from '../api/axiosClient';
import notificationApi from '../api/notificationApi';
import authApi from '../api/authApi';
import IncidentManagement from '../components/IncidentManagement';

// ============================================================
// IMPORT COMPONENT TÁCH THEO VAI TRÒ (ROLE-BASED)
// ============================================================
import {
  LandlordSidebar,
  RoomMetricsCards,
  AllRoomsTabContent,
  TenantsTabContent,
  LandlordBillsTabContent,
  LandlordRevenueTabContent,
  BillDetailModal,
  DepositModal,
  TerminateModal,
  ProfileModal,
  RulesModal,
  NotificationPanel,
  RoomFormModal,
  ContractFormModal,
  BillFormModal,
  ViewContractModal,
  ViewIncidentCostModal,
  RoomDetailModal,
  WalletTab,
  LimitModal
} from '../components/landlord';

import {
  TenantSidebar,
  TenantRoomsTab,
  TenantBillsTab,
  TerminationModal,
  ReviewModal
} from '../components/tenant';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isTenantBillsMenuOpen, setIsTenantBillsMenuOpen] = useState(true);
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [depositModal, setDepositModal] = useState({ show: false, roomId: null, note: '' });
  const [activeTab, setActiveTab] = useState(location.state?.targetTab === 'ADD_ROOM' ? (user?.role === 'LANDLORD' ? 'ALL_ROOMS' : 'TENANT_ROOMS') : (location.state?.targetTab || (user?.role === 'LANDLORD' ? 'ALL_ROOMS' : 'TENANT_ROOMS')));
  const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(true); 
  const [isFinanceMenuOpen, setIsFinanceMenuOpen] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);

  // --- STATE CHO TÍNH NĂNG BÁO TRẢ PHÒNG ---
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminateData, setTerminateData] = useState({ contractId: null, moveOutDate: '', reason: '' });

  // --- STATE CHO KHÁCH ĐÁNH GIÁ (REVIEW) ---
  const [myReviews, setMyReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ contractId: null, rating: 5, comment: '', isAnonymous: false });
  const [reviewFiles, setReviewFiles] = useState([]);

  // --- STATE CHI TIẾT PHÒNG ---
  const [viewRoomReviews, setViewRoomReviews] = useState([]);
  const [activeReviewFilter, setActiveReviewFilter] = useState('ALL');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [rooms, setRooms] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [bills, setBills] = useState([]);
  const [landlordIncidents, setLandlordIncidents] = useState([]);
  const [systemRules, setSystemRules] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // --- STATE TÀI KHOẢN ---
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '', 
    phone: user?.phone || '', 
    dob: user?.dob || '', 
    address: user?.address || '', 
    identityNumber: user?.identityNumber || '', 
    bankName: user?.bankName || 'MB', 
    accountNumber: user?.accountNumber || '', 
    accountHolder: user?.accountHolder || ''
  });
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // --- STATE TÀI KHOẢN TẠM TRÚ (TENANT) ---
  const [residenceFiles, setResidenceFiles] = useState({});
  const [residenceData, setResidenceData] = useState({});
  const [editingResidenceId, setEditingResidenceId] = useState(null);

  // --- STATE MODALS (LANDLORD) ---
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [showRoomFormModal, setShowRoomFormModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [roomForNewContract, setRoomForNewContract] = useState(null);
  const [contractToEdit, setContractToEdit] = useState(null);
  const [roomToEdit, setRoomToEdit] = useState(null);
  const [viewRoomDetails, setViewRoomDetails] = useState(null);
  const [viewBillDetails, setViewBillDetails] = useState(null);
  const [viewIncidentCostDetails, setViewIncidentCostDetails] = useState(null);
  const [viewContract, setViewContract] = useState(null);
  const [contractForBill, setContractForBill] = useState(null);
  const [proofFiles, setProofFiles] = useState([]);

  const notificationRef = useRef(null);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    
    // 🚨 CHẶN ADMIN TRUY CẬP VÀO DASHBOARD CỦA USER/LANDLORD
    if (user.role === 'ADMIN') {
      navigate('/admin');
      return;
    }

    fetchAllData();
    
    // Xử lý khi điều hướng từ trang Home với yêu cầu mở Form đăng tin
    if (location.state?.targetTab === 'ADD_ROOM') {
      setShowRoomFormModal(true);
      // Xóa state để tránh mở lại khi refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [navigate, location.state]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchRooms(),
        fetchContracts(),
        fetchBills(),
        fetchNotifications(),
        fetchRegulations(),
        user?.role === 'TENANT' ? fetchMyReviews() : fetchLandlordIncidents(),
        user?.role === 'LANDLORD' ? fetchTransactions() : Promise.resolve()
      ]);
      
      if (user?.role === 'LANDLORD') {
        const walletRes = await axiosClient.get('/wallet/my-wallet');
        const planRes = await axiosClient.get('/subscriptions/plans');
        
        const wallet = walletRes.wallet;
        const plans = planRes.plans;
        
        let baseLimit = 0;
        if (wallet.hasBasePlan && wallet.subscriptionPlan !== 'NONE') {
          baseLimit = plans[wallet.subscriptionPlan]?.limit || 0;
        }
        
        let limit = baseLimit === -1 ? -1 : baseLimit + (wallet.extraRoomLimit || 0);
        
        if (limit !== -1) {
          // We need rooms to be loaded, fetchRooms sets it but state might not be available here immediately.
          // It's better to calculate using the response of fetchRooms.
        }
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu tổng:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getMyNotifications();
      setNotifications(res);
    } catch (error) { console.error("Lỗi lấy thông báo:", error); }
  };

  const fetchRooms = async () => { try { const res = await roomApi.getAllRooms(); setRooms(res.rooms); } catch (e) {} };
  const fetchContracts = async () => { try { const res = await contractApi.getAllContracts(); setContracts(res.contracts || []); } catch (e) { setContracts([]); } };
  const fetchBills = async () => { try { const res = await billApi.getAllBills(); setBills(res.bills || []); } catch (e) { setBills([]); } };
  const fetchMyReviews = async () => {
    try { const res = await contractApi.getMyReviews(); setMyReviews(res.reviews || []); } catch (e) { console.error(e); }
  };
  const fetchRegulations = async () => {
    try {
      const res = await axiosClient.get('/admin/regulations');
      const filtered = (res.regulations || []).filter(reg => reg.target === 'ALL' || reg.target === user.role);
      setSystemRules(filtered);
    } catch (e) { console.error("Lỗi lấy nội quy:", e); }
  };
  const fetchLandlordIncidents = async () => {
    try {
      const res = await axiosClient.get('/incidents');
      setLandlordIncidents(res.incidents || []);
    } catch (e) { setLandlordIncidents([]); }
  };
  const fetchTransactions = async () => {
    try {
      const res = await axiosClient.get('/wallet/transactions');
      setTransactions(res.transactions || []);
    } catch (e) { setTransactions([]); }
  };

  const handleReadNotification = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (error) { console.error(error); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleSaveProfile = async () => {
    try {
      const response = await authApi.updateProfile(profileData);
      localStorage.setItem('user', JSON.stringify(response.user));
      alert('Cập nhật thông tin thành công!');
      setIsEditingProfile(false); window.location.reload(); 
    } catch (error) { alert('Lỗi khi cập nhật thông tin!'); }
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) return alert('Mật khẩu mới không khớp nhau!');
    if (passwordData.newPassword.length < 6) return alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
    try {
      await authApi.changePassword({ oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword });
      alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      localStorage.removeItem('user'); localStorage.removeItem('token'); window.location.href = '/login'; 
    } catch (error) { alert(error.response?.data?.message || 'Lỗi khi đổi mật khẩu!'); }
  };

  const handleSaveDeposit = async (e) => {
    e.preventDefault();
    try {
      await roomApi.updateDeposit(depositModal.roomId, depositModal.note);
      alert('Đã cập nhật trạng thái giữ chỗ thành công!');
      setDepositModal({ show: false, roomId: null, note: '' });
      fetchRooms();
    } catch (error) { alert('Lỗi cập nhật giữ chỗ!'); }
  };

  const handleDeleteDeposit = async () => {
    if (window.confirm('Bạn có chắc chắn muốn XÓA ghi chú cọc?')) {
      try {
        await roomApi.updateDeposit(depositModal.roomId, ''); 
        alert('Đã xóa cọc thành công!');
        setDepositModal({ show: false, roomId: null, note: '' });
        fetchRooms();
      } catch (error) { alert('Lỗi khi xóa cọc!'); }
    }
  };

  const handleToggleRoomVisibility = async (id) => {
    try {
      await roomApi.toggleVisibility(id);
      fetchRooms();
    } catch (error) { alert('Lỗi khi thay đổi trạng thái hiển thị!'); }
  };

  const handleEditRoomClick = (room) => {
    setEditingRoomId(room.id);
    setViewRoomDetails(null);
    setRoomToEdit(room);
    setShowRoomFormModal(true);
  };

  const handleDeleteRoom = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn XÓA VĨNH VIỄN phòng này?')) {
      try {
        await roomApi.deleteRoom(id); 
        alert('Xóa phòng thành công!'); 
        setViewRoomDetails(null);
        fetchRooms();
      } catch (error) { alert(error.response?.data?.message || 'Lỗi khi xóa phòng!'); }
    }
  };

  const handleNewContractClick = (room) => {
    setRoomForNewContract(room);
    setContractToEdit(null);
  };

  const handleEditContractClick = (contract) => {
    setContractToEdit(contract);
    setRoomForNewContract(null);
  };

  const handleEndLease = async (roomId) => {
    const activeContract = contracts.find(c => c.roomId === roomId && c.status === 'ACTIVE');
    if (!activeContract) return alert('Không tìm thấy hợp đồng đang hoạt động!');
    if (window.confirm('Xác nhận kết thúc cho thuê?')) {
      try {
        await contractApi.endContract(activeContract.id);
        alert('Đã kết thúc cho thuê!');
        fetchRooms(); fetchContracts();
      } catch (error) { alert('Lỗi khi kết thúc cho thuê!'); }
    }
  };

  const handleCancelTermination = async (contractId) => {
    if(window.confirm('Hủy yêu cầu kết thúc hợp đồng?')) {
      try {
        await contractApi.cancelTermination(contractId);
        alert('Đã hủy yêu cầu thành công!');
        fetchContracts(); fetchRooms();
      } catch (error) { alert(error.response?.data?.message || 'Lỗi khi hủy yêu cầu!'); }
    }
  };

  const handleRequestTermination = async (e) => {
    e.preventDefault();
    try {
      await contractApi.requestTermination(terminateData.contractId, terminateData);
      alert('Đã gửi thông báo thành công!');
      setShowTerminateModal(false);
      fetchContracts(); fetchRooms();
    } catch (error) { alert(error.response?.data?.message || 'Có lỗi xảy ra!'); }
  };

  const getMinMoveOutDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 30);
    return minDate.toISOString().split('T')[0];
  };

  const handleViewRoomDetails = async (room) => {
    setViewRoomDetails(room);
    setCurrentImageIndex(0);
    try {
      const response = await roomApi.getRoomById(room.id);
      const fullRoom = response.room || room;
      setViewRoomDetails(fullRoom);
      setViewRoomReviews(response.reviews || []);
      if (fullRoom.status === 'RENTED') {
        const activeContract = contracts.find(c => c.roomId == fullRoom.id && c.status === 'ACTIVE');
        setViewRoomDetails(prev => ({ ...prev, activeContract }));
      }
    } catch (error) { setViewRoomReviews([]); }
  };

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) return alert("Vui lòng nhập nội dung!");
    try {
      await contractApi.replyReview(reviewId, { replyText });
      alert("Đã gửi phản hồi thành công!");
      setReplyingTo(null); setReplyText('');
      const response = await roomApi.getRoomById(viewRoomDetails.id);
      setViewRoomReviews(response.reviews || []);
    } catch (error) { alert("Lỗi khi gửi phản hồi!"); }
  };

  const handleUploadProof = async (billId) => {
    if (proofFiles.length === 0) return alert("Vui lòng chọn ảnh!");
    const formData = new FormData();
    Array.from(proofFiles).forEach(file => formData.append('proofs', file));
    try {
      await axiosClient.post(`/bills/${billId}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Gửi bằng chứng thành công!");
      setProofFiles([]); setViewBillDetails(null); fetchBills();
    } catch (error) { alert(error.response?.data?.message || "Lỗi khi gửi ảnh!"); }
  };

  const handlePayBill = async (billId) => {
    if(window.confirm('Xác nhận thanh toán?')) {
      try { await billApi.payBill(billId); alert('Thanh toán thành công!'); fetchBills(); }
      catch (e) { alert('Lỗi!'); }
    }
  };

  const handleUploadResidence = async (e, contractId) => {
    e.preventDefault();
    const currentFiles = residenceFiles[contractId] || [];
    const currentData = residenceData[contractId] || { date: '', place: '' };
    if (currentFiles.length === 0 || !currentData.date || !currentData.place) return alert("Vui lòng nhập đủ thông tin!");
    try {
      const formData = new FormData();
      formData.append('residenceDate', currentData.date);
      formData.append('residencePlace', currentData.place);
      currentFiles.forEach(file => formData.append('residenceImages', file));
      await contractApi.updateResidenceProof(contractId, formData);
      alert("Nộp minh chứng tạm trú thành công!");
      setResidenceFiles(prev => ({ ...prev, [contractId]: [] })); 
      setResidenceData(prev => ({ ...prev, [contractId]: { date: '', place: '' } }));
      setEditingResidenceId(null); fetchContracts(); 
    } catch (error) { alert("Lỗi khi nộp ảnh!"); }
  };

  // --- LOGIC TÍNH TOÁN (DÙNG CHO SIDEBAR & TABS) ---
  const tenantBills = bills.filter(b => b.tenantIdSnapshot === user?.id || b.contract?.tenantId === user?.id);
  const tenantRoomsMap = new Map();
  tenantBills.forEach(bill => {
    const actualRoomNumber = bill.roomNumberSnapshot || bill.contract?.room?.roomNumber || 'Phòng đã xóa';
    const roomKey = actualRoomNumber;
    if (!tenantRoomsMap.has(roomKey)) {
      tenantRoomsMap.set(roomKey, { id: roomKey, roomNumber: actualRoomNumber, unpaidCount: 0 });
    }
    if (bill.status === 'UNPAID') {
      const rData = tenantRoomsMap.get(roomKey);
      rData.unpaidCount += 1;
      tenantRoomsMap.set(roomKey, rData);
    }
  });
  const tenantRoomsList = Array.from(tenantRoomsMap.values());
  const totalTenantUnpaid = tenantRoomsList.reduce((sum, r) => sum + r.unpaidCount, 0);

  const metrics = useMemo(() => {
    const total = rooms.length;
    const occupied = rooms.filter(r => r.status === 'RENTED').length;
    const available = rooms.filter(r => r.status === 'AVAILABLE').length;
    const maintenance = rooms.filter(r => r.status === 'MAINTENANCE').length;
    const deposited = rooms.filter(r => r.status === 'DEPOSITED').length;
    const upcoming = rooms.filter(r => r.status === 'RENTED' && contracts.some(c => c.roomId === r.id && c.status === 'ACTIVE' && c.intendedMoveOutDate)).length;
    const hidden = rooms.filter(r => r.isHidden).length;
    const rate = total > 0 ? ((occupied / total) * 100).toFixed(0) : 0;
    const revenue = contracts.filter(c => c.status === 'ACTIVE').reduce((sum, c) => sum + (Number(c.price) || 0), 0);
    return { total, occupied, available, maintenance, deposited, upcoming, hidden, rate, revenue };
  }, [rooms, contracts]);

  let displayedRooms = rooms;
  if (activeTab === 'AVAILABLE') displayedRooms = rooms.filter(r => r.status === 'AVAILABLE' && !r.isHidden && (!r.depositNote || r.depositNote.trim() === ''));
  if (activeTab === 'RENTED') displayedRooms = rooms.filter(r => r.status === 'RENTED' && !r.isHidden);
  if (activeTab === 'MAINTENANCE') displayedRooms = rooms.filter(r => r.status === 'MAINTENANCE' && !r.isHidden);
  if (activeTab === 'UPCOMING') displayedRooms = rooms.filter(r => r.status === 'RENTED' && !r.isHidden && contracts.some(c => c.roomId === r.id && c.status === 'ACTIVE' && c.intendedMoveOutDate));
  if (activeTab === 'DEPOSITED') displayedRooms = rooms.filter(r => r.depositNote && r.depositNote.trim() !== '' && !r.isHidden);
  if (activeTab === 'HIDDEN') displayedRooms = rooms.filter(r => r.isHidden);

  if (roomSearchTerm.trim() !== '') {
    const keyword = roomSearchTerm.toLowerCase();
    displayedRooms = displayedRooms.filter(r => 
      (r.roomNumber && String(r.roomNumber).toLowerCase().includes(keyword)) ||
      (r.houseNumber && r.houseNumber.toLowerCase().includes(keyword)) ||
      (r.address && r.address.toLowerCase().includes(keyword)) ||
      (r.roomCode && r.roomCode.toLowerCase().includes(keyword))
    );
  }

  const maskName = (name) => {
    if (!name) return "K******h";
    const str = name.trim();
    if (str.length <= 2) return str[0] + '***';
    return str.charAt(0).toLowerCase() + '******' + str.charAt(str.length - 1).toLowerCase();
  };

  const renderStars = (rating, idPrefix = 'dashDetail', size = 18) => {
    const stars = [];
    const absoluteRating = Number(rating) || 0;
    const roundedRating = Math.round(absoluteRating * 10) / 10;
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(roundedRating)) {
        stars.push(<svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#ffc107" style={{ marginRight: '2px' }}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>);
      } else if (i === Math.ceil(roundedRating) && roundedRating % 1 !== 0) {
        const fraction = (roundedRating - Math.floor(roundedRating)) * 100;
        stars.push(<svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ marginRight: '2px' }}><defs><linearGradient id={`grad-${idPrefix}-${i}`}><stop offset={`${fraction}%`} stopColor="#ffc107" /><stop offset={`${fraction}%`} stopColor="#e4e4e4" /></linearGradient></defs><path fill={`url(#grad-${idPrefix}-${i})`} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>);
      } else {
        stars.push(<svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#e4e4e4" style={{ marginRight: '2px' }}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>);
      }
    }
    return stars;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setShowNotifications(false);
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkLimit = async () => {
      if (user?.role === 'LANDLORD' && rooms.length > 0) {
        try {
          const walletRes = await axiosClient.get('/wallet/my-wallet');
          const planRes = await axiosClient.get('/subscriptions/plans');
          
          const wallet = walletRes.wallet;
          const plans = planRes.plans;
          
          let baseLimit = 0;
          if (wallet.hasBasePlan && wallet.subscriptionPlan !== 'NONE') {
            baseLimit = plans[wallet.subscriptionPlan]?.limit || 0;
          }
          
          let limit = baseLimit === -1 ? -1 : baseLimit + (wallet.extraRoomLimit || 0);
          
          if (limit !== -1) {
            const visibleCount = rooms.filter(r => !r.isHidden).length;
            if (visibleCount > limit) {
              setLimitInfo({ visibleCount, limit, excessCount: visibleCount - limit });
            } else {
              setLimitInfo(null);
            }
          } else {
            setLimitInfo(null);
          }
        } catch (e) {
          console.error("Lỗi kiểm tra giới hạn phòng:", e);
        }
      }
    };
    checkLimit();
  }, [rooms, user?.role]);

  if (!user) return <div className="flex items-center justify-center h-screen font-black text-primary">Đang xác thực...</div>;

  return (
    <DashboardProvider value={{ contracts, user, rooms, bills, landlordIncidents, transactions, fetchLandlordRooms: fetchRooms }}>
      <div className="flex flex-col h-screen font-['Inter'] bg-surface-container-lowest text-on-surface">
        {/* 1. HEADER */}
        <div className="bg-surface-container-lowest text-on-surface px-6 py-3 flex justify-between items-center shadow-sm border-b border-outline-variant/30 z-[100] sticky top-0">
          <h2 className="m-0 cursor-pointer text-primary font-black text-2xl tracking-tight flex items-center gap-2" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-[28px] fill-1">real_estate_agent</span>
            PHONGTROSIEUCAP
          </h2>
          
          <div className="flex items-center gap-4 md:gap-6">
            <NotificationPanel
              notificationRef={notificationRef}
              notifications={notifications}
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
              handleReadNotification={handleReadNotification}
            />
            
            <button onClick={() => setShowRuleModal(true)} className="hidden md:flex bg-surface-container-low border border-outline-variant/30 text-on-surface-variant px-4 py-2 rounded-full items-center gap-2 text-[13px] font-black transition-all hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-[18px]">gavel</span> Nội quy
            </button>

            <div className="relative" ref={userDropdownRef}>
              <div onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-3 cursor-pointer pl-2 pr-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container-high transition-all">
                <div className="w-8 h-8 rounded-full bg-primary flex justify-center items-center shadow-inner">
                  <span className="text-white font-black text-[14px]">{user.fullName?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-[14px] max-w-[120px] truncate font-bold hidden md:inline-block">{user?.fullName}</span>
                <span className="text-on-surface-variant opacity-60 material-symbols-outlined hidden md:inline-block">expand_more</span>
              </div>
              {showDropdown && (
                <div className="absolute top-[120%] right-0 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-2 w-[180px] shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-outline-variant/30 mb-1">
                    <div className="font-black text-sm truncate">{user?.fullName}</div>
                    <div className="font-bold text-[10px] text-on-surface-variant uppercase tracking-widest">{user?.role}</div>
                  </div>
                  <div onClick={() => { setShowProfileModal(true); setShowDropdown(false); }} className="px-4 py-2.5 rounded-xl cursor-pointer text-[13px] font-bold transition-all hover:bg-surface-container-low hover:text-primary flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span> Hồ sơ
                  </div>
                  <div onClick={handleLogout} className="px-4 py-2.5 rounded-xl cursor-pointer text-error text-[13px] font-bold transition-all hover:bg-error/10 flex items-center gap-3 mt-1">
                    <span className="material-symbols-outlined text-[18px]">logout</span> Đăng xuất
                  </div>
                </div>
              )}
            </div>
            {user?.role === 'LANDLORD' && (
              <button onClick={() => { setRoomToEdit(null); setShowRoomFormModal(true); }} className="hidden md:flex bg-primary text-on-primary px-6 py-2.5 rounded-2xl font-black shadow-lg hover:scale-105 transition-all items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">add_circle</span> Đăng tin
              </button>
            )}
          </div>
        </div>
            
        <div className="flex flex-1 overflow-hidden">
          {/* 2. SIDEBAR */}
          <div className="w-[280px] bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col shrink-0 z-0">
            <div className="flex-1 overflow-y-auto py-6 no-scrollbar flex flex-col gap-2">
              {user?.role === 'LANDLORD' ? (
                <LandlordSidebar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  rooms={rooms}
                  contracts={contracts}
                  isRoomMenuOpen={isRoomMenuOpen}
                  setIsRoomMenuOpen={setIsRoomMenuOpen}
                  isFinanceMenuOpen={isFinanceMenuOpen}
                  setIsFinanceMenuOpen={setIsFinanceMenuOpen}
                />
              ) : (
                <TenantSidebar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isTenantBillsMenuOpen={isTenantBillsMenuOpen}
                  setIsTenantBillsMenuOpen={setIsTenantBillsMenuOpen}
                  tenantRoomsList={tenantRoomsList}
                  selectedRoomId={selectedRoomId}
                  setSelectedRoomId={setSelectedRoomId}
                  totalTenantUnpaid={totalTenantUnpaid}
                />
              )}
            </div>

            {/* Support Section at Bottom of Sidebar */}
            <div className="p-4 border-t border-outline-variant/20">
              <a 
                href="https://zalo.me/0337377034" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-3 border border-outline-variant/30 hover:bg-primary/5 hover:border-primary/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                  🎧
                </div>
                <div>
                  <p className="m-0 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Hỗ trợ Zalo</p>
                  <p className="m-0 text-xs font-black text-on-surface">Admin - 0337377034</p>
                </div>
              </a>
            </div>
          </div>

          {/* 3. MAIN CONTENT */}
          <div className="flex-1 px-4 py-6 md:px-8 md:py-8 overflow-y-auto no-scrollbar relative bg-surface-container-low/30">
            
            {activeTab === 'INCIDENTS' && (
              <IncidentManagement user={user} rooms={rooms} contracts={contracts} onRepairCostUpdated={fetchLandlordIncidents} />
            )}

            {activeTab === 'WALLET' && user?.role === 'LANDLORD' && (
              <WalletTab />
            )}

            {/* LANDLORD TABS */}
            <AllRoomsTabContent 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              displayedRooms={displayedRooms}
              roomSearchTerm={roomSearchTerm}
              setRoomSearchTerm={setRoomSearchTerm}
              metrics={metrics}
              setDepositModal={setDepositModal}
              setRoomToEdit={setRoomToEdit}
              setShowRoomFormModal={setShowRoomFormModal}
              handleEditRoomClick={handleEditRoomClick}
              handleToggleRoomVisibility={handleToggleRoomVisibility}
              handleDeleteRoom={handleDeleteRoom}
              handleNewContractClick={handleNewContractClick}
              handleEditContractClick={handleEditContractClick}
              setTerminateData={setTerminateData}
              setShowTerminateModal={setShowTerminateModal}
              setContractForBill={setContractForBill}
              handleViewRoomDetails={handleViewRoomDetails}
              setViewContract={setViewContract}
              handleEndLease={handleEndLease}
              handleCancelTermination={handleCancelTermination}
              roomApi={roomApi}
              fetchRooms={fetchRooms}
            />

            <TenantsTabContent activeTab={activeTab} setViewContract={setViewContract} handleViewRoomDetails={handleViewRoomDetails} />
            <LandlordBillsTabContent activeTab={activeTab} bills={bills} setViewBillDetails={setViewBillDetails} />
            <LandlordRevenueTabContent activeTab={activeTab} setViewBillDetails={setViewBillDetails} setViewIncidentCostDetails={setViewIncidentCostDetails} />

            {/* TENANT TABS */}
            {activeTab === 'TENANT_ROOMS' && (
              <TenantRoomsTab 
                user={user}
                contracts={contracts}
                myReviews={myReviews}
                handleViewRoomDetails={handleViewRoomDetails}
                setTerminateData={setTerminateData}
                setShowTerminateModal={setShowTerminateModal}
                setShowReviewModal={setShowReviewModal}
                setReviewData={setReviewData}
                handleCancelTermination={handleCancelTermination}
                residenceData={residenceData}
                setResidenceData={setResidenceData}
                residenceFiles={residenceFiles}
                setResidenceFiles={setResidenceFiles}
                handleUploadResidence={handleUploadResidence}
                editingResidenceId={editingResidenceId}
                setEditingResidenceId={setEditingResidenceId}
                setViewContract={setViewContract}
              />
            )}

            {activeTab === 'TENANT_BILLS' && (
              <TenantBillsTab 
                tenantBills={tenantBills}
                selectedRoomId={selectedRoomId}
                setViewBillDetails={setViewBillDetails}
              />
            )}
          </div>
        </div>

        {/* 4. MODALS */}
        <RoomDetailModal
          room={viewRoomDetails}
          reviews={viewRoomReviews}
          onClose={() => setViewRoomDetails(null)}
          currentImageIndex={currentImageIndex}
          setCurrentImageIndex={setCurrentImageIndex}
          setSelectedImage={setSelectedImage}
          activeReviewFilter={activeReviewFilter}
          setActiveReviewFilter={setActiveReviewFilter}
          renderStars={renderStars}
          maskName={maskName}
          user={user}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          replyText={replyText}
          setReplyText={setReplyText}
          handleReplySubmit={handleReplySubmit}
          handleEditRoomClick={handleEditRoomClick}
          handleDeleteRoom={handleDeleteRoom}
        />

        {selectedImage && (
          <div className="fixed inset-0 z-[100000] bg-black/95 flex justify-center items-center" onClick={() => setSelectedImage(null)}>
            <button onClick={() => setSelectedImage(null)} className="absolute top-5 right-5 text-white text-4xl">✖</button>
            <img src={selectedImage} alt="Large view" className="max-w-[90%] max-h-[90%] object-contain" />
          </div>
        )}

        <ReviewModal 
          showReviewModal={showReviewModal} 
          setShowReviewModal={setShowReviewModal} 
          reviewData={reviewData} 
          setReviewData={setReviewData} 
          fetchMyReviews={fetchMyReviews} 
        />

        <TerminationModal
          showTerminateModal={showTerminateModal}
          setShowTerminateModal={setShowTerminateModal}
          terminateData={terminateData}
          setTerminateData={setTerminateData}
          handleRequestTermination={handleRequestTermination}
          getMinMoveOutDate={getMinMoveOutDate}
          userRole={user.role}
        />

        {/* LANDLORD MODALS */}
        <BillDetailModal bill={viewBillDetails} user={user} proofFiles={proofFiles} setProofFiles={setProofFiles} setViewBillDetails={setViewBillDetails} handleUploadProof={handleUploadProof} handlePayBill={handlePayBill} />
        <DepositModal depositModal={depositModal} setDepositModal={setDepositModal} handleSaveDeposit={handleSaveDeposit} handleDeleteDeposit={handleDeleteDeposit} />
        <ProfileModal showProfileModal={showProfileModal} setShowProfileModal={setShowProfileModal} isEditingProfile={isEditingProfile} setIsEditingProfile={setIsEditingProfile} isChangingPassword={isChangingPassword} setIsChangingPassword={setIsChangingPassword} profileData={profileData} setProfileData={setProfileData} passwordData={passwordData} setPasswordData={setPasswordData} showOldPwd={showOldPwd} setShowOldPwd={setShowOldPwd} showNewPwd={showNewPwd} setShowNewPwd={setShowNewPwd} showConfirmPwd={showConfirmPwd} setShowConfirmPwd={setShowConfirmPwd} handleSaveProfile={handleSaveProfile} handleSavePassword={handleSavePassword} user={user} />
        <RulesModal showRuleModal={showRuleModal} setShowRuleModal={setShowRuleModal} systemRules={systemRules} />
        <ViewIncidentCostModal viewIncidentCostDetails={viewIncidentCostDetails} onClose={() => setViewIncidentCostDetails(null)} />
        <ViewContractModal viewContract={viewContract} onClose={() => setViewContract(null)} />
        <BillFormModal contractForBill={contractForBill} onClose={() => setContractForBill(null)} />
        <ContractFormModal roomForNewContract={roomForNewContract} contractToEdit={contractToEdit} onClose={() => { setRoomForNewContract(null); setContractToEdit(null); }} />
        <RoomFormModal showModal={showRoomFormModal} setShowModal={setShowRoomFormModal} roomToEdit={roomToEdit} />
        
        <LimitModal 
          isVisible={!!limitInfo} 
          limitInfo={limitInfo} 
          onClose={() => setLimitInfo(null)} 
          rooms={rooms} 
          fetchRooms={fetchRooms} 
          setActiveTab={setActiveTab} 
        />

      </div>
    </DashboardProvider>
  );
};

export default Dashboard;
