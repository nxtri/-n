import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import roomApi from '../api/roomApi';
import axios from 'axios';
import contractApi from '../api/contractApi';
import billApi from '../api/billApi';
import axiosClient from '../api/axiosClient';
import notificationApi from '../api/notificationApi';
import authApi from '../api/authApi';
import IncidentManagement from '../components/IncidentManagement';

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

const Dashboard = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getMyNotifications();
      setNotifications(res);
    } catch (error) { console.error("Lỗi lấy thông báo:", error); }
  };
  const [isCreatingBill, setIsCreatingBill] = useState(false); // State khóa nút tạo hóa đơn
  const navigate = useNavigate();
  const location = useLocation();
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const [selectedRoomId, setSelectedRoomId] = useState(null); // Lưu ID của phòng đang click ở cột trái
  // 1. Biến lưu trạng thái đóng/mở menu con của Thanh toán hóa đơn
  const [isTenantBillsMenuOpen, setIsTenantBillsMenuOpen] = useState(true);
  const [roomSearchTerm, setRoomSearchTerm] = useState(''); // Thêm state cho thanh tìm kiếm phòng
 
// State cho Modal Nhận cọc / Giữ chỗ
  const [depositModal, setDepositModal] = useState({ show: false, roomId: null, note: '' });

  const handleSaveDeposit = async (e) => {
    e.preventDefault();
    try {
      await roomApi.updateDeposit(depositModal.roomId, depositModal.note);
      alert('Đã cập nhật trạng thái giữ chỗ thành công!');
      setDepositModal({ show: false, roomId: null, note: '' });
      fetchRooms(); // Load lại phòng để hiện thẻ 🔒
    } catch (error) {
      alert('Lỗi cập nhật giữ chỗ!');
    }
  };

  // 🚨 THÊM HÀM NÀY ĐỂ XỬ LÝ RIÊNG NÚT XÓA CỌC:
  const handleDeleteDeposit = async () => {
    if (window.confirm('Bạn có chắc chắn muốn XÓA ghi chú cọc và hiển thị lại phòng này trên Trang chủ không?')) {
      try {
        // Gửi thẳng một chuỗi rỗng lên API để xóa cọc
        await roomApi.updateDeposit(depositModal.roomId, ''); 
        alert('Đã xóa cọc thành công! Phòng đã được mở lại.');
        setDepositModal({ show: false, roomId: null, note: '' }); // Đóng Modal
        fetchRooms(); // Tải lại danh sách
      } catch (error) {
        alert('Lỗi khi xóa cọc!');
      }
    }
  };
  const [activeTab, setActiveTab] = useState(location.state?.targetTab || (user?.role === 'LANDLORD' ? 'ALL_ROOMS' : 'TENANT_ROOMS'));
  const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(true); 
  const [isFinanceMenuOpen, setIsFinanceMenuOpen] = useState(false);


  // --- STATE CHO TÍNH NĂNG BÁO TRẢ PHÒNG ---
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminateData, setTerminateData] = useState({ contractId: null, moveOutDate: '', reason: '' });

  // --- STATE CHO KHÁCH ĐÁNH GIÁ (REVIEW) ---
  const [myReviews, setMyReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ contractId: null, rating: 5, comment: '', isAnonymous: false });
  const [reviewFiles, setReviewFiles] = useState([]);
  // Hàm fetch Đánh giá
  const fetchMyReviews = async () => {
    if (user?.role === 'TENANT') {
      try { const res = await contractApi.getMyReviews(); setMyReviews(res.reviews || []); } catch (e) { console.error(e); }
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('rating', reviewData.rating);
      formData.append('comment', reviewData.comment);
      formData.append('isAnonymous', reviewData.isAnonymous);
      
      // Đẩy ảnh/video vào formData
      reviewFiles.forEach(file => {
        formData.append('reviewImages', file); // Tên field phải khớp với multer ở Backend
      });

      await contractApi.submitReview(reviewData.contractId, formData);
      alert('Cảm ơn bạn đã đánh giá! Đánh giá đã được ghi nhận trên hệ thống.');
      setShowReviewModal(false);
      setReviewFiles([]);
      setReviewData({ contractId: null, rating: 5, comment: '', isAnonymous: false });
      fetchContracts();
      fetchMyReviews();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi khi gửi đánh giá!');
    }
  };
  
  // Hàm tính ngày tối thiểu (Hôm nay + 30 ngày) để chặn Khách chọn ngày sai trên lịch
  const getMinMoveOutDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 30);
    return minDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
  };

  const handleRequestTermination = async (e) => {
    e.preventDefault();
    try {
      await contractApi.requestTermination(terminateData.contractId, terminateData);
      alert('Đã gửi thông báo thành công! Hệ thống đã ghi nhận.');
      setShowTerminateModal(false);
      fetchContracts(); // Tải lại danh sách hợp đồng
      fetchRooms(); // Tải lại phòng
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };
  // Hàm xử lý Hủy yêu cầu trả phòng
  const handleCancelTermination = async (contractId) => {
    if(window.confirm('Bạn có chắc chắn muốn HỦY yêu cầu kết thúc hợp đồng? Hợp đồng sẽ tiếp tục có hiệu lực bình thường.')) {
      try {
        await contractApi.cancelTermination(contractId);
        alert('Đã hủy yêu cầu thành công!');
        fetchContracts(); // Tải lại danh sách hợp đồng để làm mất thẻ màu vàng
        fetchRooms();
      } catch (error) {
        alert(error.response?.data?.message || 'Có lỗi xảy ra khi hủy yêu cầu!');
      }
    }
  };

  // --- STATE & HÀM CHO MODAL XEM CHI TIẾT PHÒNG (KÈM REVIEWS) ---
  const [viewRoomReviews, setViewRoomReviews] = useState([]);
  const [activeReviewFilter, setActiveReviewFilter] = useState('ALL');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleViewRoomDetails = async (room) => {
    setViewRoomDetails(room);
    setCurrentImageIndex(0);
    try {
      const response = await roomApi.getRoomById(room.id);
      setViewRoomReviews(response.reviews || []);
    } catch (error) {
      console.error(error);
      setViewRoomReviews([]);
    }
  };

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) return alert("Vui lòng nhập nội dung phản hồi!");
    try {
      await contractApi.replyReview(reviewId, { replyText });
      alert("Đã gửi phản hồi thành công!");
      setReplyingTo(null);
      setReplyText('');
      // Refresh reviews
      const response = await roomApi.getRoomById(viewRoomDetails.id);
      setViewRoomReviews(response.reviews || []);
    } catch (error) {
      alert("Lỗi khi gửi phản hồi!");
    }
  };

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
        stars.push(
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#ffc107" style={{ marginRight: '2px' }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      } else if (i === Math.ceil(roundedRating) && roundedRating % 1 !== 0) {
        const fraction = (roundedRating - Math.floor(roundedRating)) * 100;
        stars.push(
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ marginRight: '2px' }}>
            <defs>
              <linearGradient id={`grad-${idPrefix}-${i}`}>
                <stop offset={`${fraction}%`} stopColor="#ffc107" />
                <stop offset={`${fraction}%`} stopColor="#e4e4e4" />
              </linearGradient>
            </defs>
            <path fill={`url(#grad-${idPrefix}-${i})`} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#e4e4e4" style={{ marginRight: '2px' }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      }
    }
    return stars;
  };

  // State cho Tab Báo Cáo Doanh Thu
  const [reportSearch, setReportSearch] = useState('');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1); // Mặc định tháng hiện tại
  const [reportYear, setReportYear] = useState(new Date().getFullYear());    // Mặc định năm hiện tại
  const [expandedRooms, setExpandedRooms] = useState({}); // Lưu trạng thái đóng/mở của từng phòng

  // Hàm xử lý đóng/mở Accordion
  const toggleRoomAccordion = (roomId) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  // --- STATE TÀI KHOẢN & MẬT KHẨU ---
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // State cho Nội quy
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [systemRules, setSystemRules] = useState([]);
// State mới cho Tạm trú
  const [residenceFiles, setResidenceFiles] = useState({});
  const [residenceData, setResidenceData] = useState({});
  const [editingResidenceId, setEditingResidenceId] = useState(null);

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
  
  // Các Ref để xử lý click ra ngoài để tắt
  const notificationRef = useRef(null);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Nếu click ra ngoài vùng thông báo
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      // Nếu click ra ngoài vùng dropdown chủ nhà
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // --- STATE CHỨC NĂNG PHÒNG ---
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [viewRoomDetails, setViewRoomDetails] = useState(null); // State bật/tắt Popup Chi tiết phòng
  const [viewBillDetails, setViewBillDetails] = useState(null); // State mới để xem chi tiết hóa đơn
  const [viewIncidentCostDetails, setViewIncidentCostDetails] = useState(null); // Modal xem chi tiết chi phí phát sinh
  // State lưu ảnh bằng chứng thanh toán
  const [proofFiles, setProofFiles] = useState([]);

  // Hàm khách thuê upload ảnh
  const handleUploadProof = async (billId) => {
    if (proofFiles.length === 0) return alert("Vui lòng chọn ít nhất 1 ảnh!");
    
    const formData = new FormData();
    // Đẩy danh sách ảnh vào formData (Tên field 'proofs' phải khớp với upload.array('proofs') ở backend)
    Array.from(proofFiles).forEach(file => {
      formData.append('proofs', file);
    });

    try {
      await axiosClient.post(`/bills/${billId}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Gửi bằng chứng thành công! Đang chờ chủ nhà xác nhận.");
      setProofFiles([]); 
      setViewBillDetails(null); // Đóng popup
      fetchBills(); // Tải lại danh sách
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi khi gửi ảnh!");
    }
  };
  const [selectedImage, setSelectedImage] = useState(null);
  // BỔ SUNG STATE NÀY ĐỂ NHỚ VỊ TRÍ ẢNH HIỆN TẠI (Mặc định là ảnh số 0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [expandedTenantRooms, setExpandedTenantRooms] = useState({}); // Trạng thái đóng/mở cho danh sách người thuê

  const metrics = useMemo(() => {
    const total = rooms.length;
    const occupied = rooms.filter(r => r.status === 'RENTED').length;
    const available = rooms.filter(r => r.status === 'AVAILABLE').length;
    const maintenance = rooms.filter(r => r.status === 'MAINTENANCE').length;
    const deposited = rooms.filter(r => r.status === 'DEPOSITED').length;
    const upcoming = rooms.filter(r => r.status === 'UPCOMING').length;
    const hidden = rooms.filter(r => r.status === 'HIDDEN').length;
    const rate = total > 0 ? ((occupied / total) * 100).toFixed(0) : 0;
    const revenue = contracts
      .filter(c => c.status === 'ACTIVE')
      .reduce((sum, c) => sum + (Number(c.price) || 0), 0);
    return { total, occupied, available, maintenance, deposited, upcoming, hidden, rate, revenue };
  }, [rooms, contracts]);

  const [bills, setBills] = useState([]);

  const [viewContract, setViewContract] = useState(null);
  
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState({ code: '', name: '' });
  const [selectedDistrict, setSelectedDistrict] = useState({ code: '', name: '' });
  const [selectedWard, setSelectedWard] = useState({ code: '', name: '' });
  // State cho custom searchable dropdown Tỉnh/Thành & Phường/Xã
  const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false);
  const [wardDropdownOpen, setWardDropdownOpen] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [wardSearch, setWardSearch] = useState('');
  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.province-dropdown-container')) setProvinceDropdownOpen(false);
      if (!e.target.closest('.ward-dropdown-container')) setWardDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [newRoom, setNewRoom] = useState({ 
    roomNumber: '', houseNumber: '', price: '', description: '', area: '', address: '',
    roomType: 'SINGLE', numFloors: '', numBedrooms: '', numBathrooms: '',
    maxOccupants: 1, electricityPrice: '', waterPrice: '', internetPrice: '', parkingPrice: '', servicePrice: '',
    hasElevator: false, hasWashingMachine: false, hasFridge: false, hasKitchen: false, hasHeater: false
  });

  // Hàm click để đọc thông báo
  const handleReadNotification = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications(); // Load lại để mất dấu đỏ
    } catch (error) { console.error(error); }
  };

  const [contractRoom, setContractRoom] = useState(null);
  const [editingContractId, setEditingContractId] = useState(null); // 🚨 THÊM STATE NÀY
  const [contractImage, setContractImage] = useState(null);
  const [contractImages, setContractImages] = useState([]); // Chứa tối đa 5 ảnh
  const [conditionImages, setConditionImages] = useState([]); // Ảnh tình trạng phòng
  const [conditionVideos, setConditionVideos] = useState([]); // Video tình trạng phòng
  const [tenantDetails, setTenantDetails] = useState({ fullName: '', phone: '', identityNumber: '' }); // Chứa thông tin khách tự điền
  // CẤU TRÚC HỢP ĐỒNG ĐẦY ĐỦ PHÁP LÝ
  const [contractData, setContractData] = useState({ 
    // Thông tin Bên A (Chủ nhà)
    landlordName: '', landlordDob: '', landlordPhone: '', landlordIdentityNumber: '', landlordHometown: '',
    // Thông tin Bên B (Khách đại diện)
    tenantEmail: '', tenantName: '', tenantDob: '', tenantPhone: '', tenantIdentityNumber: '', tenantHometown: '',
    // Thời hạn
    startDate: '', endDate: '',
    // Chi phí
    price: 0, electricityPrice: 0, waterPrice: 0, internetPrice: 0, parkingPrice: 0, servicePrice: 0,
    startElectricity: '', startWater: '', vehicleCount: 0,
    // Thành viên
    members: [],
    // Tình trạng bàn giao
    conditionDescription: '',
    // Cờ đánh dấu khách tự thanh toán điện lực
    isDirectUtilityPayment: false
  });
  const [billContract, setBillContract] = useState(null);
  const [billData, setBillData] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), electricityUsage: '', waterUsage: '', vehicleCount: '' });

  // --- HÀM TẢI DỮ LIỆU ---
  const fetchRooms = async () => { try { const res = await roomApi.getAllRooms(); setRooms(res.rooms); } catch (e) {} };
  const fetchContracts = async () => { try { const res = await contractApi.getAllContracts(); setContracts(res.contracts || []); } catch (e) { setContracts([]); } };
  const fetchBills = async () => { try { const res = await billApi.getAllBills(); setBills(res.bills || []); } catch (e) { setBills([]); } };
  const fetchProvinces = async () => { try { const res = await axios.get('https://provinces.open-api.vn/api/v2/p/'); setProvinces(res.data); } catch (e) {} };

  const fetchRegulations = async () => {
    try {
      const res = await axiosClient.get('/admin/regulations'); // Host/Public role logic can be added if needed, but here we use admin routes which might need auth
      // Filter regulations based on user role
      const filtered = (res.regulations || []).filter(reg => reg.target === 'ALL' || reg.target === user.role);
      setSystemRules(filtered);
    } catch (e) { console.error("Lỗi lấy nội quy:", e); }
  };

  // --- FETCH SỰ CỐ (CHO BÁO CÁO DOANH THU - CHỦ NHÀ) ---
  const [landlordIncidents, setLandlordIncidents] = useState([]);
  const fetchLandlordIncidents = async () => {
    if (user?.role !== 'LANDLORD') return;
    try {
      const res = await axiosClient.get('/incidents');
      setLandlordIncidents(res.incidents || []);
    } catch (e) { setLandlordIncidents([]); }
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchRooms(); fetchProvinces(); fetchContracts(); fetchBills(); fetchNotifications(); fetchMyReviews(); fetchRegulations();
    if (user?.role === 'LANDLORD') fetchLandlordIncidents();
  }, [navigate]);

  // --- CÁC HÀM TÀI KHOẢN ---
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; };



  // =========================================================================
  // TÍNH TOÁN DỮ LIỆU PHÒNG CHO MENU KHÁCH THUÊ
  // =========================================================================
 // Không sợ bị null khi xóa contract nữa!
  const tenantBills = bills.filter(b => b.tenantIdSnapshot === user.id || b.contract?.tenantId === user.id);
  const tenantRoomsMap = new Map();
  
  tenantBills.forEach(bill => {
    // 1. Ưu tiên lấy Tên phòng từ Snapshot. Nếu không có thì lấy qua contract.room
    const actualRoomNumber = bill.roomNumberSnapshot || bill.contract?.room?.roomNumber || 'Phòng đã xóa';
    
    // 2. Vì phòng có thể bị xóa (mất ID gốc), ta dùng luôn Tên Phòng làm ID (key) để nhóm hóa đơn
    const roomKey = actualRoomNumber;

    // QUAN TRỌNG: Không dùng if(room) nữa, mà dùng luôn roomKey để kiểm tra và thêm vào Map
    if (!tenantRoomsMap.has(roomKey)) {
      tenantRoomsMap.set(roomKey, { 
        id: roomKey, // Dùng tên phòng làm ID ảo luôn
        roomNumber: actualRoomNumber, 
        unpaidCount: 0 
      });
    }
    
    // 3. Tăng biến đếm nếu hóa đơn chưa thanh toán
    if (bill.status === 'UNPAID') {
      const rData = tenantRoomsMap.get(roomKey);
      rData.unpaidCount += 1;
      tenantRoomsMap.set(roomKey, rData);
    }
  });
  
  const tenantRoomsList = Array.from(tenantRoomsMap.values());
  const totalTenantUnpaid = tenantRoomsList.reduce((sum, r) => sum + r.unpaidCount, 0);

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

  // --- CÁC HÀM XỬ LÝ ĐỊA CHỈ & ẢNH ---
const handleProvinceChange = async (e) => {
    const inputValue = e.target.value; 
    const matchedProvince = provinces.find(p => p.name === inputValue);
    
    if (matchedProvince) {
      // Cập nhật Tỉnh đã chọn và reset lại ô Xã
      setSelectedProvince({ code: matchedProvince.code, name: matchedProvince.name }); 
      setSelectedWard({ code: '', name: '' }); 
      setWards([]);
      
      try {
        // Dùng API v2 với depth=2 để ép hệ thống lôi thẳng toàn bộ danh sách Xã của Tỉnh đó ra
        const res = await axios.get(`https://provinces.open-api.vn/api/v2/p/${matchedProvince.code}?depth=2`); 
        setWards(res.data.wards || []); 
      } catch (error) {
        console.error("Lỗi lấy danh sách phường/xã:", error);
      }
    } else {
      setSelectedProvince({ code: '', name: inputValue });
      setSelectedWard({ code: '', name: '' }); 
      setWards([]);
    }
  };

  const handleWardChange = (e) => { 
    const inputValue = e.target.value;
    const matchedWard = wards.find(w => w.name === inputValue);
    if (matchedWard) {
      setSelectedWard({ code: matchedWard.code, name: matchedWard.name });
    } else {
      setSelectedWard({ code: '', name: inputValue });
    }
  };
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageFiles.length + files.length > 15) return alert('Tối đa 15 ảnh!');
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };
  const removeImage = (i) => { setImageFiles(p => p.filter((_, idx) => idx !== i)); setImagePreviews(p => p.filter((_, idx) => idx !== i)); };

  // --- CÁC HÀM PHÒNG (SỬA, XÓA, LƯU) ---
  const handleEditRoomClick = (room) => {
    setEditingRoomId(room.id);
    setViewRoomDetails(null); // Tắt popup nếu đang mở
    setNewRoom({
      roomNumber: room.roomNumber, houseNumber: room.houseNumber || '', price: room.price, description: room.description || '', area: room.area || '', address: room.address || '',
      roomType: room.roomType || 'SINGLE', numFloors: room.numFloors || '', numBedrooms: room.numBedrooms || '', numBathrooms: room.numBathrooms || '',
      maxOccupants: room.maxOccupants, electricityPrice: room.electricityPrice || '', waterPrice: room.waterPrice || '', internetPrice: room.internetPrice || '', parkingPrice: room.parkingPrice || '', servicePrice: room.servicePrice || '',
      hasElevator: room.hasElevator, hasWashingMachine: room.hasWashingMachine, hasFridge: room.hasFridge, hasKitchen: room.hasKitchen, hasHeater: room.hasHeater
    });
    setActiveTab('ADD_ROOM'); 
  };

  const handleDeleteRoom = async (id) => {
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN phòng này không?')) {
      try {
        await roomApi.deleteRoom(id); 
        alert('Xóa phòng thành công!'); 
        setViewRoomDetails(null); // Tắt popup
        fetchRooms();
      } catch (error) { alert(error.response?.data?.message || 'Lỗi khi xóa phòng!'); }
    }
  };

const handleCreateRoom = async (e) => {
    e.preventDefault();

    if (!editingRoomId && (!selectedProvince.code || !selectedWard.code)) {
      return alert("Vui lòng nhập & chọn Thành phố/Tỉnh và Phường/Xã hợp lệ từ danh sách gợi ý!");
    }

    const formData = new FormData();
    
    // Đẩy tất cả dữ liệu vào form, NGOẠI TRỪ cái 'address' để xử lý riêng
    Object.keys(newRoom).forEach(key => {
      if (key !== 'address') {
        formData.append(key, newRoom[key]);
      }
    });
    
    // Xử lý Địa chỉ (Chỉ append 1 lần duy nhất)
    // Xử lý Địa chỉ (Chỉ lấy Xã và Tỉnh)
    if (selectedWard.name && selectedProvince.name) {
      formData.append('address', `${selectedWard.name}, ${selectedProvince.name}`);
    } else {
      // Nếu không chọn mới, lấy địa chỉ cũ
      formData.append('address', newRoom.address || ''); 
    }

    // Xử lý Ảnh
    imageFiles.forEach(file => formData.append('images', file));
    
    try {
      if (editingRoomId) {
        await roomApi.updateRoom(editingRoomId, formData);
        alert('Cập nhật phòng thành công!'); 
        setEditingRoomId(null);
      } else {
        await roomApi.createRoom(formData); 
        alert('Thêm phòng thành công!');
      }
      setActiveTab('ALL_ROOMS'); 
      fetchRooms();
      // Reset form
      setNewRoom({ 
        roomNumber: '', houseNumber: '', price: '', description: '', area: '', address: '', 
        roomType: 'SINGLE', numFloors: '', numBedrooms: '', numBathrooms: '',
        maxOccupants: 1, electricityPrice: '', waterPrice: '', internetPrice: '', parkingPrice: '', servicePrice: '', 
        hasElevator: false, hasWashingMachine: false, hasFridge: false, hasKitchen: false, hasHeater: false 
      });
      setImageFiles([]); setImagePreviews([]);
      // Reset dropdown địa chỉ
      setSelectedProvince({code: '', name: ''}); setSelectedDistrict({code: '', name: ''}); setSelectedWard({code: '', name: ''});
    } catch (error) { 
      alert('Lỗi khi lưu phòng! Vui lòng kiểm tra lại dữ liệu.'); 
    }
  };
// HÀM TÌM EMAIL (BẢN CHUẨN KẾT HỢP AXIOS CLIENT)
  const handleCheckTenantEmail = async () => {
    if (!contractData.tenantEmail) return;

    try {
      // 1. Gọi API
      const response = await axiosClient.get(`/auth/user/by-email?email=${contractData.tenantEmail}`);
      
      // 2. VÌ AXIOS CLIENT ĐÃ TỰ LẤY DATA, NÊN BÂY GIỜ response CHÍNH LÀ DATA
      // Ta lấy thẳng response.user (hoặc đề phòng thì dùng response.data.user nếu có)
      const tenant = response.user || (response.data && response.data.user); 
      
      if (tenant) {
        // 3. Xử lý ngày sinh (cắt bỏ phần giờ phút giây)
        let formattedDob = '';
        if (tenant.dob) {
           formattedDob = tenant.dob.split('T')[0]; 
        }

        // 4. Đổ dữ liệu vào Form
        setContractData(prevData => ({
          ...prevData,
          tenantName: tenant.fullName || '',
          tenantPhone: tenant.phone || '',
          tenantIdentityNumber: tenant.identityNumber || '',
          tenantDob: formattedDob, 
          tenantHometown: tenant.address || '' // Lấy address gắn vào quê quán
        }));
        
        console.log("Đã tự điền thông tin thành công cho:", tenant.fullName);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn("Khách thuê này CHƯA CÓ tài khoản trong hệ thống!");
      } else {
        console.error("Lỗi khi tìm email:", error);
      }
    }
  };
  // --- CÁC HÀM HỢP ĐỒNG & HÓA ĐƠN ---
  // HÀM CLICK "CẬP NHẬT HỢP ĐỒNG" - Kéo dữ liệu cũ đắp lên Form
  const handleEditContractClick = (contract) => {
    setEditingContractId(contract.id); // Đánh dấu là đang Sửa
    setContractRoom(contract.room);    // Mở Form lên
    
    // Parse mảng members cho an toàn
    let parsedMembers = [];
    try { parsedMembers = typeof contract.members === 'string' ? JSON.parse(contract.members) : (contract.members || []); } catch(e) {}

    // Đổ toàn bộ dữ liệu của Hợp đồng cũ vào Form
    setContractData({
      landlordName: contract.landlordName || '', landlordDob: contract.landlordDob || '', landlordPhone: contract.landlordPhone || '', landlordIdentityNumber: contract.landlordIdentityNumber || '', landlordHometown: contract.landlordHometown || '',
      tenantEmail: contract.tenantEmail || '', tenantName: contract.tenantName || '', tenantDob: contract.tenantDob || '', tenantPhone: contract.tenantPhone || '', tenantIdentityNumber: contract.tenantIdentityNumber || '', tenantHometown: contract.tenantHometown || '',
      startDate: contract.startDate || '', endDate: contract.endDate || '',
      price: contract.price || 0, electricityPrice: contract.electricityPrice || 0, waterPrice: contract.waterPrice || 0, internetPrice: contract.internetPrice || 0, parkingPrice: contract.parkingPrice || 0, servicePrice: contract.servicePrice || 0,
      startElectricity: contract.startElectricity || '', startWater: contract.startWater || '', vehicleCount: contract.vehicleCount || 0,
      isDirectUtilityPayment: !!contract.isDirectUtilityPayment,
      members: parsedMembers
    });
  };
  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('roomId', contractRoom.id);

      // 1. Nhóm thông tin Bên A (Chủ nhà)
      formData.append('landlordName', contractData.landlordName);
      formData.append('landlordDob', contractData.landlordDob);
      formData.append('landlordPhone', contractData.landlordPhone);
      formData.append('landlordIdentityNumber', contractData.landlordIdentityNumber);
      formData.append('landlordHometown', contractData.landlordHometown);

      // 2. Nhóm thông tin Bên B (Khách thuê đại diện)
      formData.append('tenantEmail', contractData.tenantEmail);
      formData.append('tenantName', contractData.tenantName);
      formData.append('tenantDob', contractData.tenantDob);
      formData.append('tenantPhone', contractData.tenantPhone);
      formData.append('tenantIdentityNumber', contractData.tenantIdentityNumber);
      formData.append('tenantHometown', contractData.tenantHometown);

      // 3. Thời gian & Hình ảnh hợp đồng
      formData.append('startDate', contractData.startDate);
      formData.append('endDate', contractData.endDate);

      

      // 4. Nhóm Chi phí (Giá đàm phán)
      formData.append('price', contractData.price);
      formData.append('electricityPrice', contractData.isDirectUtilityPayment ? 0 : contractData.electricityPrice);
      formData.append('waterPrice', contractData.isDirectUtilityPayment ? 0 : contractData.waterPrice);
      formData.append('internetPrice', contractData.internetPrice);
      formData.append('parkingPrice', contractData.parkingPrice);
      formData.append('servicePrice', contractData.servicePrice);
      formData.append('isDirectUtilityPayment', contractData.isDirectUtilityPayment);
      
      formData.append('startElectricity', contractData.startElectricity);
      formData.append('startWater', contractData.startWater);
      formData.append('vehicleCount', contractData.vehicleCount);

      // 5. ĐẶC BIỆT: Nhóm thành viên ở cùng
      // Vì FormData chỉ nhận chuỗi (String) hoặc File, nên ta phải "ép" mảng members thành chuỗi JSON
      formData.append('members', JSON.stringify(contractData.members));
      if (contractImages.length > 0) {
        contractImages.forEach((image, index) => {
           // Gửi mảng ảnh vào cùng tên trường contractImages
           formData.append('contractImages', image); 
        });
      }

      // 6. NHÓM TÌNH TRẠNG BÀN GIAO
      formData.append('conditionDescription', contractData.conditionDescription);
      if (conditionImages.length > 0) {
        conditionImages.forEach(image => formData.append('conditionImages', image));
      }
      if (conditionVideos.length > 0) {
        conditionVideos.forEach(video => formData.append('conditionVideos', video));
      }

      // Gọi API gửi đi
      // 🚨 KIỂM TRA: Đang CẬP NHẬT hay TẠO MỚI?
      if (editingContractId) {
        await contractApi.updateContract(editingContractId, formData);
        alert('Cập nhật hợp đồng thành công!');
        setEditingContractId(null); // Reset lại trạng thái
      } else {
        await contractApi.createContract(formData);
        alert('Tạo hợp đồng thành công!');
      }
      
      setContractRoom(null);
      fetchRooms();
      fetchContracts();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi tạo hợp đồng! Vui lòng kiểm tra lại Console.');
      console.error("Lỗi chi tiết:", error);
    }
  };

  const handleUploadResidence = async (e, contractId) => {
    e.preventDefault();
    const currentFiles = residenceFiles[contractId] || [];
    const currentData = residenceData[contractId] || { date: '', place: '' };

    if (currentFiles.length === 0 || !currentData.date || !currentData.place) {
      return alert("Vui lòng nhập đầy đủ Ngày đăng ký, Nơi đăng ký và chọn ít nhất 1 ảnh minh chứng!");
    }

    try {
      const formData = new FormData();
      formData.append('residenceDate', currentData.date);
      formData.append('residencePlace', currentData.place);
      
      // Đẩy mảng ảnh vào formData
      currentFiles.forEach(file => {
        formData.append('residenceImages', file);
      });

      await contractApi.updateResidenceProof(contractId, formData);
      alert("Nộp minh chứng tạm trú thành công!");
      
      // Reset form
      setResidenceFiles(prev => ({ ...prev, [contractId]: [] })); 
      setResidenceData(prev => ({ ...prev, [contractId]: { date: '', place: '' } }));
      setEditingResidenceId(null); // 🚨 THÊM DÒNG NÀY ĐỂ ĐÓNG FORM
      fetchContracts(); 
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi nộp ảnh! Vui lòng thử lại.");
      console.error(error);
    }
  };



  const handleCreateBill = async (e) => { 
    e.preventDefault(); 
    
    // 1. Lấy số Cũ trực tiếp từ Hợp đồng
    const oldElec = billContract.currentElectricity || 0;
    const oldWater = billContract.currentWater || 0;

    // 2. Kiểm tra xem chủ nhà đã nhập số mới chưa
    if (billData.newElectricity === '' || billData.newElectricity === undefined || 
        billData.newWater === '' || billData.newWater === undefined) {
      return alert("Vui lòng nhập đầy đủ chỉ số Điện và Nước mới!");
    }

    const newElec = Number(billData.newElectricity);
    const newWater = Number(billData.newWater);

    // 3. KIỂM TRA ĐIỀU KIỆN: SỐ MỚI PHẢI >= SỐ CŨ
    if (newElec < oldElec) {
      return alert(`❌ LỖI: Chỉ số điện MỚI (${newElec}) không được nhỏ hơn chỉ số CŨ (${oldElec})!`);
    }
    if (newWater < oldWater) {
      return alert(`❌ LỖI: Chỉ số nước MỚI (${newWater}) không được nhỏ hơn chỉ số CŨ (${oldWater})!`);
    }

    try { 
      setIsCreatingBill(true); // 👈 BẮT ĐẦU KHÓA NÚT
      // 4. Tính toán số lượng sử dụng (Đã an toàn vì new >= old)
      const elecUsage = newElec - oldElec;
      const waterUsage = newWater - oldWater;

      await billApi.createBill({ 
        contractId: billContract.id, 
        month: billData.month, 
        year: billData.year,
        electricityUsage: elecUsage, 
        waterUsage: waterUsage, 
        oldElectricity: oldElec,
        newElectricity: newElec,             
        oldWater: oldWater,
        newWater: newWater,
        vehicleCount: billContract.vehicleCount,
        billType: 'UTILITY'  // Lấy trực tiếp từ Hợp đồng
      }); 
      
      alert('Tạo hóa đơn thành công!'); 
      setBillContract(null); 
      // Reset form
      setBillData({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), oldElectricity: '', newElectricity: '', oldWater: '', newWater: '', vehicleCount: '' }); 
      fetchBills(); 
      fetchContracts(); // Phải gọi lại API này để số điện/nước cũ trên giao diện cập nhật ngay
    } catch (error) { 
      alert('Lỗi tạo hóa đơn!'); 
      console.error(error);
    } finally {
      setIsCreatingBill(false); // 👈 MỞ KHÓA NÚT KHI XONG (Hoặc Lỗi)
    }
  };
  const handlePayBill = async (billId) => { if(window.confirm('Xác nhận thanh toán?')) { try { await billApi.payBill(billId); alert('Thanh toán thành công!'); fetchBills(); } catch (e) { alert('Lỗi!'); } } };
  const handleEndLease = async (roomId) => {
    // Tìm hợp đồng đang ACTIVE của phòng này
    const activeContract = contracts.find(c => c.roomId === roomId && c.status === 'ACTIVE');
    if (!activeContract) {
      return alert('Không tìm thấy hợp đồng đang hoạt động cho phòng này!');
    }

    if (window.confirm('XÁC NHẬN: Bạn có chắc chắn muốn KẾT THÚC cho thuê phòng này? Hợp đồng sẽ được đóng và phòng sẽ trở về trạng thái Trống.')) {
      try {
        await contractApi.endContract(activeContract.id);
        alert('Đã kết thúc cho thuê thành công!');
        fetchRooms();     // Tải lại danh sách phòng
        fetchContracts(); // Tải lại danh sách hợp đồng
      } catch (error) {
        alert('Lỗi khi kết thúc cho thuê!');
      }
    }
  };
  if (!user) return <p>Đang tải...</p>;

  let displayedRooms = rooms;
  if (activeTab === 'AVAILABLE') displayedRooms = rooms.filter(r => r.status === 'AVAILABLE' && !r.isHidden && (!r.depositNote || r.depositNote.trim() === ''));
  if (activeTab === 'RENTED') displayedRooms = rooms.filter(r => r.status === 'RENTED' && !r.isHidden);
  if (activeTab === 'MAINTENANCE') displayedRooms = rooms.filter(r => r.status === 'MAINTENANCE' && !r.isHidden);
  // 🚨 THÊM DÒNG NÀY: Lọc ra những phòng đang cho thuê NHƯNG CÓ ngày báo chuyển đi
  if (activeTab === 'UPCOMING') displayedRooms = rooms.filter(r => r.status === 'RENTED' && !r.isHidden && contracts.some(c => c.roomId === r.id && c.status === 'ACTIVE' && c.intendedMoveOutDate));
  // 🚨 THÊM LOGIC TAB "ĐÃ CỌC": Lấy những phòng có ghi chú cọc
  if (activeTab === 'DEPOSITED') displayedRooms = rooms.filter(r => r.depositNote && r.depositNote.trim() !== '' && !r.isHidden);
  // 🚨 THÊM LOGIC TAB "PHÒNG BỊ ẨN"
  if (activeTab === 'HIDDEN') displayedRooms = rooms.filter(r => r.isHidden);

  // 2. Lọc theo Thanh tìm kiếm (Lọc tiếp trên kết quả của Tab)
  if (roomSearchTerm.trim() !== '') {
    const keyword = roomSearchTerm.toLowerCase();
    displayedRooms = displayedRooms.filter(r => 
      (r.roomNumber && String(r.roomNumber).toLowerCase().includes(keyword)) ||
      (r.houseNumber && r.houseNumber.toLowerCase().includes(keyword)) ||
      (r.address && r.address.toLowerCase().includes(keyword)) ||
      (r.roomCode && r.roomCode.toLowerCase().includes(keyword))
    );
  }
 // =========================================================================
  // TÍNH TOÁN DỮ LIỆU BÁO CÁO DOANH THU (Dành cho Chủ nhà)
  


  return (
    <div className="flex flex-col h-screen font-['Inter'] bg-surface-container-lowest text-on-surface">
      
      {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG */}
      <div className="bg-surface-container-lowest text-on-surface px-6 py-3 flex justify-between items-center shadow-sm border-b border-outline-variant/30 z-10 sticky top-0">
        <h2 className="m-0 cursor-pointer text-primary font-black text-2xl tracking-tight flex items-center gap-2" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined text-[28px] fill-1">real_estate_agent</span>
          PHONGTROSIEUCAP
        </h2>
        
        <div className="flex items-center gap-4 md:gap-6">
          {/* KHU VỰC CHUÔNG THÔNG BÁO */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-surface-container-low border border-outline-variant/30 text-on-surface-variant w-10 h-10 rounded-full flex justify-center items-center cursor-pointer relative hover:scale-110 hover:bg-surface-container-high transition-all shadow-sm"
              title="Thông báo"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {/* Hiển thị số chấm đỏ nếu có thông báo chưa đọc */}
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm border border-white">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
            {/* Popup Danh sách thông báo */}
            {showNotifications && (
              <div className="absolute right-0 top-[120%] w-[380px] bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-4 origin-top-right">
                <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/30 font-black text-on-surface flex justify-between items-center">
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">notifications_active</span> Thông báo của bạn</span>
                  <span className="text-[11px] font-bold opacity-60 bg-surface-container-high px-2 py-1 rounded-md">{notifications.filter(n => !n.isRead).length} chưa đọc</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-on-surface-variant italic font-medium opacity-60">Chưa có thông báo nào</div>
                  ) : (
                    notifications.map(noti => (
                      <div 
                        key={noti.id} 
                        onClick={() => handleReadNotification(noti.id)}
                        className={`p-5 border-b border-outline-variant/10 cursor-pointer transition-all hover:bg-surface-container-low flex gap-4 ${noti.isRead ? 'bg-surface-container-lowest opacity-70' : 'bg-primary/5 relative'}`}
                      >
                        {!noti.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${noti.isRead ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary/20 text-primary'}`}>
                           <span className="material-symbols-outlined text-[20px]">{noti.title.includes('Sự cố') ? 'engineering' : noti.title.includes('Hóa đơn') ? 'receipt_long' : 'notifications'}</span>
                        </div>
                        <div>
                          <div className={`font-black text-[14px] mb-1 leading-tight ${noti.isRead ? 'text-on-surface' : 'text-primary'}`}>{noti.title}</div>
                          <div className="text-[13px] text-on-surface-variant whitespace-pre-wrap leading-relaxed font-medium">{noti.message}</div>
                          <div className="text-[11px] text-on-surface-variant mt-2 opacity-60 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span> {new Date(noti.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div> 
              </div>
            )}
          </div>
          
          {/* NÚT XEM NỘI QUY */}
          <button 
            onClick={() => setShowRuleModal(true)}
            className="hidden md:flex bg-surface-container-low border border-outline-variant/30 text-on-surface-variant px-4 py-2 rounded-full cursor-pointer items-center gap-2 text-[13px] font-black tracking-wide transition-all hover:bg-surface-container-high hover:text-on-surface hover:shadow-sm"
            title="Xem nội quy hệ thống"
          >
            <span className="material-symbols-outlined text-[18px]">gavel</span> Nội quy
          </button>

          <div className="relative" ref={userDropdownRef}>
            <div 
              onClick={() => setShowDropdown(!showDropdown)} 
              className="flex items-center gap-3 cursor-pointer text-on-surface pl-2 pr-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 transition-all hover:bg-surface-container-high hover:shadow-md"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex justify-center items-center shadow-inner">
                <span className="text-white font-black text-[14px]">{user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}</span>
              </div>
              <span className="text-[14px] max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap font-bold hidden md:inline-block">{user.fullName}</span>
              <span className="text-[14px] text-on-surface-variant opacity-60 material-symbols-outlined hidden md:inline-block">expand_more</span>
            </div>
            {showDropdown && (
              <div className="absolute top-[120%] right-0 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-2 w-[180px] shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 origin-top-right">
                <div className="px-4 py-3 border-b border-outline-variant/30 mb-1">
                  <div className="font-black text-sm truncate">{user.fullName}</div>
                  <div className="font-bold text-[10px] text-on-surface-variant uppercase tracking-widest">{user.role}</div>
                </div>
                <div onClick={() => { setShowProfileModal(true); setShowDropdown(false); }} className="px-4 py-2.5 rounded-xl cursor-pointer text-on-surface-variant text-[13px] font-bold transition-all hover:bg-surface-container-low hover:text-primary flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px]">manage_accounts</span> Hồ sơ cá nhân
                </div>
                <div onClick={handleLogout} className="px-4 py-2.5 rounded-xl cursor-pointer text-error text-[13px] font-bold transition-all hover:bg-error/10 flex items-center gap-3 mt-1">
                  <span className="material-symbols-outlined text-[18px]">logout</span> Đăng xuất
                </div>
              </div>
            )}
          </div>
          {user.role === 'LANDLORD' && (
            <button onClick={() => { setEditingRoomId(null); setActiveTab('ADD_ROOM'); }} className="hidden md:flex bg-primary text-on-primary border-none px-6 py-2.5 rounded-2xl font-black cursor-pointer shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all items-center gap-2 tracking-wide">
              <span className="material-symbols-outlined text-[20px]">add_circle</span> Đăng tin
            </button>
          )}
        </div>
      </div>
          
      <div className="flex flex-1 overflow-hidden">
        {/* 2. SIDEBAR */}
        <div className="w-[280px] bg-surface-container-lowest border-r border-outline-variant/30 overflow-y-auto py-6 text-left no-scrollbar flex flex-col gap-2 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-0">
          {user.role === 'LANDLORD' ? (
            <>
              <div onClick={() => setIsRoomMenuOpen(!isRoomMenuOpen)} className={`mx-4 px-4 py-3.5 rounded-2xl cursor-pointer font-black flex justify-between items-center transition-all ${isRoomMenuOpen ? 'text-primary bg-primary/10 shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}>
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-[22px]">real_estate_agent</span> Quản lý phòng</span>
                <span className="text-on-surface-variant opacity-60 material-symbols-outlined text-[20px] transition-transform">{isRoomMenuOpen ? 'expand_less' : 'expand_more'}</span>
              </div>
              {isRoomMenuOpen && (
                <div className="pb-4 pt-1 flex flex-col gap-1.5">
                  {[
                    { id: 'ALL_ROOMS', label: 'Tất cả phòng', count: rooms.length },
                    { id: 'RENTED', label: 'Đang cho thuê', count: rooms.filter(r=>r.status === 'RENTED' && !r.isHidden).length },
                    { id: 'AVAILABLE', label: 'Phòng trống', count: rooms.filter(r=>r.status === 'AVAILABLE' && !r.isHidden && (!r.depositNote || r.depositNote.trim() === '')).length },
                    { id: 'DEPOSITED', label: 'Phòng đã cọc', count: rooms.filter(r => r.depositNote && r.depositNote.trim() !== '' && !r.isHidden).length },
                    { id: 'UPCOMING', label: 'Sắp trống', count: rooms.filter(r => r.status === 'RENTED' && !r.isHidden && contracts.some(c => c.roomId === r.id && c.status === 'ACTIVE' && c.intendedMoveOutDate)).length },
                    { id: 'HIDDEN', label: 'Phòng bị ẩn', count: rooms.filter(r => r.isHidden).length },
                    { id: 'MAINTENANCE', label: 'Đang bảo trì', count: rooms.filter(r=>r.status === 'MAINTENANCE' && !r.isHidden).length }
                  ].map(tab => (
                    <div 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)} 
                      className={`mx-6 px-4 py-2.5 rounded-xl cursor-pointer flex justify-between items-center transition-all ${activeTab === tab.id ? 'bg-surface-container-high text-primary font-black border-l-4 border-primary' : 'text-on-surface-variant font-bold hover:bg-surface-container-low hover:text-on-surface border-l-4 border-transparent'}`}
                    >
                      <span className="flex items-center gap-2">{tab.label}</span>
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${activeTab === tab.id ? 'bg-primary/10' : 'bg-surface-container-high'}`}>{tab.count}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div onClick={() => setActiveTab('TENANTS')} className={`mx-4 px-4 py-3.5 rounded-2xl cursor-pointer font-black flex items-center gap-3 transition-all ${activeTab === 'TENANTS' ? 'text-primary bg-primary/10 shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}>
                <span className="material-symbols-outlined text-[22px]">groups</span> Người thuê
              </div>
              
              {/* MENU SỰ CỐ CHO CHỦ NHÀ */}
              <div onClick={() => setActiveTab('INCIDENTS')} className={`mx-4 px-4 py-3.5 rounded-2xl cursor-pointer font-black flex items-center gap-3 transition-all ${activeTab === 'INCIDENTS' ? 'text-primary bg-primary/10 shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}>
                <span className="material-symbols-outlined text-[22px]">engineering</span> Quản lý Sự cố
              </div>
              
              {/* MENU TÀI CHÍNH */}
              <div onClick={() => setIsFinanceMenuOpen(!isFinanceMenuOpen)} className={`mx-4 px-4 py-3.5 rounded-2xl cursor-pointer font-black flex justify-between items-center transition-all ${isFinanceMenuOpen ? 'text-primary bg-primary/10 shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}>
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-[22px]">account_balance_wallet</span> Tài chính</span>
                <span className="text-on-surface-variant opacity-60 material-symbols-outlined text-[20px] transition-transform">{isFinanceMenuOpen ? 'expand_less' : 'expand_more'}</span>
              </div>
              {isFinanceMenuOpen && (
                <div className="pb-4 pt-1 flex flex-col gap-1.5">
                  <div onClick={() => setActiveTab('LANDLORD_BILLS')} className={`mx-6 px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-all ${activeTab === 'LANDLORD_BILLS' ? 'bg-surface-container-high text-primary font-black border-l-4 border-primary' : 'text-on-surface-variant font-bold hover:bg-surface-container-low hover:text-on-surface border-l-4 border-transparent'}`}>
                     Hóa đơn & Thu tiền
                  </div>
                  <div onClick={() => setActiveTab('LANDLORD_REVENUE')} className={`mx-6 px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-all ${activeTab === 'LANDLORD_REVENUE' ? 'bg-surface-container-high text-primary font-black border-l-4 border-primary' : 'text-on-surface-variant font-bold hover:bg-surface-container-low hover:text-on-surface border-l-4 border-transparent'}`}>
                     Báo cáo Doanh thu
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* TAB 1: PHÒNG ĐANG THUÊ */}
              <div 
                onClick={() => setActiveTab('TENANT_ROOMS')} 
                className={`mx-4 px-4 py-4 rounded-2xl cursor-pointer font-black flex items-center gap-3 transition-all ${activeTab === 'TENANT_ROOMS' ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' : 'text-on-surface hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined text-[22px]">home</span> Phòng đang thuê
              </div>

              {/* TAB SỰ CỐ & HỖ TRỢ KHÁCH THUÊ */}
              <div 
                onClick={() => setActiveTab('INCIDENTS')} 
                className={`mx-4 px-4 py-4 rounded-2xl cursor-pointer font-black flex items-center gap-3 transition-all ${activeTab === 'INCIDENTS' ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' : 'text-on-surface hover:bg-surface-container-low'}`}
              >
                <span className="material-symbols-outlined text-[22px]">support_agent</span> Sự cố & Hỗ trợ
              </div>

              {/* TAB 2: THANH TOÁN HÓA ĐƠN (CÓ XỔ XUỐNG) */}
              <div 
                onClick={() => {
                  setActiveTab('TENANT_BILLS');
                  setIsTenantBillsMenuOpen(!isTenantBillsMenuOpen); // Bật/tắt menu con
                  if(!selectedRoomId) setSelectedRoomId('ALL');     // Mặc định chọn Tất cả
                }} 
                className={`mx-4 px-4 py-4 rounded-2xl cursor-pointer font-black flex justify-between items-center transition-all mt-2 ${activeTab === 'TENANT_BILLS' ? 'bg-primary/10 text-primary shadow-sm' : 'text-on-surface hover:bg-surface-container-low'}`}
              >
                <span className="flex items-center gap-3"><span className="material-symbols-outlined text-[22px]">receipt_long</span> Thanh toán</span>
                <span className="material-symbols-outlined text-[20px] opacity-80 transition-transform">{isTenantBillsMenuOpen && activeTab === 'TENANT_BILLS' ? 'expand_less' : 'expand_more'}</span>
              </div>

              {/* MENU CON: TẤT CẢ & TỪNG PHÒNG CỦA KHÁCH THUÊ */}
              {isTenantBillsMenuOpen && activeTab === 'TENANT_BILLS' && (
                <div className="flex flex-col gap-1.5 mt-2">
                  {/* Nút: Tất cả */}
                  <div 
                    onClick={() => setSelectedRoomId('ALL')}
                    className={`mx-6 px-4 py-2.5 rounded-xl cursor-pointer flex justify-between items-center transition-all ${(!selectedRoomId || selectedRoomId === 'ALL') ? 'bg-surface-container-high text-primary font-black border-l-4 border-primary' : 'text-on-surface-variant font-bold hover:bg-surface-container-low hover:text-on-surface border-l-4 border-transparent'}`}
                  >
                    <span className="flex items-center gap-2">Tất cả</span>
                    {totalTenantUnpaid > 0 && (
                      <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm tracking-widest">
                        {totalTenantUnpaid}
                      </span>
                    )}
                  </div>

                  {/* Nút: Từng phòng */}
                  {tenantRoomsList.map(room => (
                    <div 
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`mx-6 px-4 py-2.5 rounded-xl cursor-pointer flex justify-between items-center transition-all ${selectedRoomId === room.id ? 'bg-surface-container-high text-primary font-black border-l-4 border-primary' : 'text-on-surface-variant font-bold hover:bg-surface-container-low hover:text-on-surface border-l-4 border-transparent'}`}
                    >
                      <span className="flex items-center gap-2">{room.roomNumber}</span>
                      {room.unpaidCount > 0 && (
                        <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm tracking-widest">
                          {room.unpaidCount}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 3. MAIN CONTENT */}
        <div className="flex-1 px-4 py-6 md:px-8 md:py-8 overflow-y-auto no-scrollbar relative bg-surface-container-low/30">
          
          {(activeTab === 'ALL_ROOMS' || activeTab === 'AVAILABLE' || activeTab === 'RENTED' || activeTab === 'MAINTENANCE' || activeTab === 'UPCOMING' || activeTab === 'DEPOSITED' || activeTab === 'HIDDEN') && (
            <div className="max-w-[1200px] mx-auto py-8 px-4 lg:px-8 space-y-12 font-['Inter']">
              {/* Metrics Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex items-center gap-6 group hover:border-primary/30 transition-all duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-primary-container/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[32px]">real_estate_agent</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Tổng số phòng</p>
                    <h3 className="text-3xl font-black text-on-surface mt-1">{metrics.total}</h3>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex items-center gap-6 group hover:border-secondary/30 transition-all duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-secondary-container/20 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[32px]">check_circle</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Tỷ lệ lấp đầy</p>
                    <h3 className="text-3xl font-black text-on-surface mt-1">{metrics.rate}%</h3>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex items-center gap-6 group hover:border-tertiary/30 transition-all duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-tertiary-container/10 text-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[32px]">payments</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Doanh thu dự kiến</p>
                    <h3 className="text-3xl font-black text-on-surface mt-1">{metrics.revenue.toLocaleString()} <span className="text-sm font-normal">đ</span></h3>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col gap-6 bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/30 shadow-sm transition-all duration-300 hover:shadow-md">
                {/* Top Row: Categories */}
                <div className="flex flex-wrap items-center gap-3 pb-2">
                  {[
                    { id: 'ALL_ROOMS', label: 'Tất cả phòng', count: metrics.total, icon: 'list_alt' },
                    { id: 'RENTED', label: 'Đang cho thuê', count: metrics.occupied, icon: 'person' },
                    { id: 'AVAILABLE', label: 'Phòng trống', count: metrics.available, icon: 'meeting_room' },
                    { id: 'DEPOSITED', label: 'Phòng đã cọc', count: metrics.deposited, icon: 'lock' },
                    { id: 'UPCOMING', label: 'Sắp trống / Đăng tin', count: metrics.upcoming, icon: 'campaign' },
                    { id: 'HIDDEN', label: 'Phòng bị ẩn', count: metrics.hidden, icon: 'visibility_off' },
                    { id: 'MAINTENANCE', label: 'Đang bảo trì', count: metrics.maintenance, icon: 'build' }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-5 py-3 rounded-2xl text-[13px] font-black flex items-center gap-2.5 transition-all duration-300 ${
                        activeTab === tab.id 
                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/20' 
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:translate-y-[-2px]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                      <span>{tab.label}</span>
                      <span className={`ml-1 text-[11px] opacity-60 font-bold ${activeTab === tab.id ? 'text-white' : ''}`}>({tab.count})</span>
                    </button>
                  ))}
                </div>

                {/* Bottom Row: Search & Add */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-outline-variant/20">
                  <div className="relative w-full md:max-w-md group">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[22px]">search</span>
                    <input 
                      type="text" 
                      placeholder="Tìm mã phòng, địa chỉ hoặc tên khách thuê..." 
                      value={roomSearchTerm}
                      onChange={(e) => setRoomSearchTerm(e.target.value)}
                      className="w-full pl-14 pr-12 py-4 bg-surface-container-low border border-outline-variant/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none placeholder:opacity-50"
                    />
                    {roomSearchTerm && (
                      <button onClick={() => setRoomSearchTerm('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-outline hover:text-error transition-colors p-1">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setActiveTab('ADD_ROOM')}
                    className="w-full md:w-auto px-10 py-4 bg-primary text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-primary-container hover:text-primary hover:scale-105 transition-all shadow-xl shadow-primary/20 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[22px] font-bold">add_circle</span>
                    THÊM PHÒNG MỚI
                  </button>
                </div>
              </div>

              {/* Form Areas (Redesigned) */}
              {contractRoom && (
                <div className="bg-surface-container-lowest p-8 rounded-3xl border-2 border-primary/30 shadow-2xl animate-in fade-in slide-in-from-top-4 space-y-8">
                  <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                    <div>
                      <h3 className="text-2xl font-black text-primary">
                        {editingContractId ? '✏️ Cập nhật Hợp đồng' : '✍️ Ký hợp đồng mới'}
                      </h3>
                      <p className="text-sm text-on-surface-variant font-medium opacity-70">Phòng: {contractRoom.roomNumber} | {contractRoom.address}</p>
                    </div>
                    <button onClick={() => { setContractRoom(null); setEditingContractId(null); }} className="p-2 hover:bg-error/10 hover:text-error rounded-full transition-all">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  
                  <div className="space-y-10">
                    {/* SECTION 1: LANDLORD */}
                    <div>
                      <h4 className="text-sm font-black text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px]">01</span>
                        Bên cho thuê (Bên A)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60 ml-1">Họ và tên *</label>
                          <input type="text" value={contractData.landlordName} onChange={e => setContractData({...contractData, landlordName: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60 ml-1">Số điện thoại *</label>
                          <input type="text" value={contractData.landlordPhone} onChange={e => setContractData({...contractData, landlordPhone: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60 ml-1">Số CCCD *</label>
                          <input type="text" value={contractData.landlordIdentityNumber} onChange={e => setContractData({...contractData, landlordIdentityNumber: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold" />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: TENANT */}
                    <div>
                      <h4 className="text-sm font-black text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center text-[10px]">02</span>
                        Bên thuê (Bên B)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-secondary-container/5 p-6 rounded-2xl border border-secondary/20">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60 ml-1">Họ và tên *</label>
                          <input type="text" value={contractData.tenantName} onChange={e => setContractData({...contractData, tenantName: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary/20 outline-none text-sm font-bold" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60 ml-1">Email *</label>
                          <input type="email" value={contractData.tenantEmail} onChange={e => setContractData({...contractData, tenantEmail: e.target.value})} onBlur={handleCheckTenantEmail} className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary/20 outline-none text-sm font-bold" placeholder="Gõ email để tự điền..." />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60 ml-1">Số điện thoại *</label>
                          <input type="text" value={contractData.tenantPhone} onChange={e => setContractData({...contractData, tenantPhone: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-secondary/20 outline-none text-sm font-bold" />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: MEMBERS */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center text-[10px]">03</span>
                          Thành viên ở cùng
                        </h4>
                        <button onClick={() => setContractData({...contractData, members: [...contractData.members, { fullName: '', dob: '', phone: '', identityNumber: '', hometown: '' }]})} className="px-4 py-1.5 bg-tertiary text-on-tertiary rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm">
                          + Thêm người
                        </button>
                      </div>
                      <div className="space-y-4">
                        {contractData.members.map((member, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 relative group">
                            <input type="text" placeholder="Họ và tên" value={member.fullName} onChange={e => { const m = [...contractData.members]; m[idx].fullName = e.target.value; setContractData({...contractData, members: m}); }} className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-xs font-bold outline-none" />
                            <input type="text" placeholder="Số điện thoại" value={member.phone} onChange={e => { const m = [...contractData.members]; m[idx].phone = e.target.value; setContractData({...contractData, members: m}); }} className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-xs font-bold outline-none" />
                            <input type="text" placeholder="Số CCCD" value={member.identityNumber} onChange={e => { const m = [...contractData.members]; m[idx].identityNumber = e.target.value; setContractData({...contractData, members: m}); }} className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-xs font-bold outline-none" />
                            <div className="flex gap-2">
                              <input type="date" value={member.dob} onChange={e => { const m = [...contractData.members]; m[idx].dob = e.target.value; setContractData({...contractData, members: m}); }} className="flex-1 px-3 py-2 bg-white border border-outline-variant rounded-lg text-xs font-bold outline-none" />
                              <button onClick={() => { const m = contractData.members.filter((_, i) => i !== idx); setContractData({...contractData, members: m}); }} className="p-2 text-error hover:bg-error/10 rounded-lg transition-all"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                            </div>
                          </div>
                        ))}
                        {contractData.members.length === 0 && <p className="text-xs text-on-surface-variant italic opacity-50">Chưa có thành viên nào khác.</p>}
                      </div>
                    </div>

                    {/* SECTION 4: FINANCE */}
                    <div>
                      <h4 className="text-sm font-black text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-error/10 text-error flex items-center justify-center text-[10px]">04</span>
                        Chi phí & Chỉ số ban đầu
                      </h4>
                      <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/30 space-y-6">
                        <div className="flex items-center gap-3 p-4 bg-primary-container/10 rounded-2xl border border-primary/20">
                          <input type="checkbox" checked={contractData.isDirectUtilityPayment} onChange={e => setContractData({...contractData, isDirectUtilityPayment: e.target.checked})} className="w-5 h-5 rounded-lg text-primary focus:ring-0 cursor-pointer" id="directUtility" />
                          <label htmlFor="directUtility" className="text-xs font-bold text-primary cursor-pointer uppercase tracking-tight">Khách thuê tự thanh toán hóa đơn điện/nước trực tiếp</label>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60">Giá thuê (đ/tháng)</label>
                            <input type="number" value={contractData.price} onChange={e => setContractData({...contractData, price: e.target.value})} className="w-full px-4 py-2 bg-white border border-outline-variant rounded-xl text-sm font-black text-primary outline-none" />
                          </div>
                          {!contractData.isDirectUtilityPayment && (
                            <>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60">Giá điện (đ/số)</label>
                                <input type="number" value={contractData.electricityPrice} onChange={e => setContractData({...contractData, electricityPrice: e.target.value})} className="w-full px-4 py-2 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60">Giá nước (đ/khối)</label>
                                <input type="number" value={contractData.waterPrice} onChange={e => setContractData({...contractData, waterPrice: e.target.value})} className="w-full px-4 py-2 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none" />
                              </div>
                            </>
                          )}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60">Số điện ban đầu</label>
                            <input type="number" value={contractData.startElectricity} onChange={e => setContractData({...contractData, startElectricity: e.target.value})} className="w-full px-4 py-2 bg-white border-2 border-error/30 rounded-xl text-sm font-black text-error outline-none" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60">Số nước ban đầu</label>
                            <input type="number" value={contractData.startWater} onChange={e => setContractData({...contractData, startWater: e.target.value})} className="w-full px-4 py-2 bg-white border-2 border-error/30 rounded-xl text-sm font-black text-error outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-8 border-t border-outline-variant/30">
                      <button onClick={() => setContractRoom(null)} className="px-8 py-3 rounded-2xl border border-outline-variant text-on-surface-variant font-black uppercase tracking-widest text-[10px] hover:bg-surface-container-low transition-all">Hủy bỏ</button>
                      <button onClick={handleCreateContract} className="px-12 py-4 bg-primary text-on-primary rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/30 hover:scale-105 transition-all active:scale-95">
                        {editingContractId ? 'Lưu Cập Nhật' : 'Xác nhận Ký Hợp Đồng'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bill Form Modal */}
              {billContract && (() => {
                const elecUsage = Math.max(0, (Number(billData.newElectricity) || 0) - (Number(billContract.currentElectricity) || 0));
                const waterUsage = Math.max(0, (Number(billData.newWater) || 0) - (Number(billContract.currentWater) || 0));
                const elecPrice = Number(billContract.electricityPrice) || 0;
                const waterPrice = Number(billContract.waterPrice) || 0;
                return (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-on-surface/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-surface-container-lowest p-8 rounded-[2.5rem] border-t-8 border-tertiary shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 space-y-8 no-scrollbar">
                      <div className="flex items-center justify-between pb-6 border-b border-outline-variant/30">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl">receipt_long</span>
                          </div>
                          <div>
                            <h3 className="text-3xl font-black text-on-surface tracking-tight">Chốt Hóa Đơn</h3>
                            <p className="text-sm text-on-surface-variant font-bold opacity-60">
                              Phòng {billContract.room?.roomNumber} • Kỳ tháng {billData.month}/{billData.year}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => setBillContract(null)} className="w-12 h-12 flex items-center justify-center hover:bg-error/10 hover:text-error rounded-full transition-all group">
                          <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {!billContract.isDirectUtilityPayment ? (
                          <>
                            <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/30 space-y-6 group hover:border-primary/30 transition-all">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-widest opacity-60">Chỉ số Điện</h4>
                                <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full">{elecPrice.toLocaleString()} đ/số</span>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black opacity-40 uppercase ml-1">Số cũ</label>
                                  <div className="px-5 py-4 bg-white border border-outline-variant/50 rounded-2xl text-lg font-black text-on-surface opacity-40">{billContract.currentElectricity || 0}</div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-error uppercase ml-1">Số mới *</label>
                                  <input type="number" autoFocus value={billData.newElectricity || ''} onChange={e => setBillData({...billData, newElectricity: e.target.value})} className="w-full px-5 py-4 bg-white border-2 border-error rounded-2xl text-lg font-black focus:ring-4 focus:ring-error/10 outline-none transition-all" />
                                </div>
                              </div>
                              <div className="pt-6 border-t border-dashed border-outline-variant/30 flex justify-between items-center">
                                <span className="text-xs font-black text-on-surface-variant uppercase opacity-50">Thành tiền:</span>
                                <span className="text-2xl font-black text-primary">{(elecUsage * elecPrice).toLocaleString()} <span className="text-xs font-normal">đ</span></span>
                              </div>
                            </div>

                            <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/30 space-y-6 group hover:border-primary/30 transition-all">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-widest opacity-60">Chỉ số Nước</h4>
                                <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full">{waterPrice.toLocaleString()} đ/m³</span>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black opacity-40 uppercase ml-1">Số cũ</label>
                                  <div className="px-5 py-4 bg-white border border-outline-variant/50 rounded-2xl text-lg font-black text-on-surface opacity-40">{billContract.currentWater || 0}</div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-error uppercase ml-1">Số mới *</label>
                                  <input type="number" value={billData.newWater || ''} onChange={e => setBillData({...billData, newWater: e.target.value})} className="w-full px-5 py-4 bg-white border-2 border-error rounded-2xl text-lg font-black focus:ring-4 focus:ring-error/10 outline-none transition-all" />
                                </div>
                              </div>
                              <div className="pt-6 border-t border-dashed border-outline-variant/30 flex justify-between items-center">
                                <span className="text-xs font-black text-on-surface-variant uppercase opacity-50">Thành tiền:</span>
                                <span className="text-2xl font-black text-primary">{(waterUsage * waterPrice).toLocaleString()} <span className="text-xs font-normal">đ</span></span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-full p-12 bg-primary/5 rounded-[2.5rem] border border-dashed border-primary/30 text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                              <span className="material-symbols-outlined text-4xl">contactless</span>
                            </div>
                            <div className="max-w-md mx-auto">
                              <h4 className="text-xl font-black text-primary">Thanh toán trực tiếp</h4>
                              <p className="text-sm font-bold text-on-surface-variant opacity-70 mt-2">Phòng này tự thanh toán điện/nước cho nhà cung cấp. Bạn chỉ cần chốt để hệ thống cập nhật chỉ số kỳ mới.</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-outline-variant/30">
                        <button onClick={() => setBillContract(null)} className="px-10 py-4 rounded-2xl border-2 border-outline-variant text-on-surface-variant font-black uppercase tracking-widest text-xs hover:bg-surface-container-low transition-all active:scale-95">Hủy bỏ</button>
                        <button onClick={handleCreateBill} disabled={isCreatingBill} className={`px-16 py-4 ${isCreatingBill ? 'bg-outline-variant cursor-not-allowed' : 'bg-tertiary shadow-xl shadow-tertiary/30'} text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all`}>
                          {isCreatingBill ? '⏳ Đang xử lý...' : 'Xác nhận Chốt Hóa Đơn 🚀'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Property Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                {displayedRooms.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
                    <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-30">folder_open</span>
                    <p className="text-on-surface-variant italic font-medium">Không tìm thấy phòng nào phù hợp.</p>
                  </div>
                ) : (
                  displayedRooms.map((room) => {
                    const activeContract = contracts.find(c => c.roomId === room.id && c.status === 'ACTIVE');
                    const isReturningSoon = activeContract && !!activeContract.intendedMoveOutDate;
                    const statusConfig = {
                      AVAILABLE: { label: 'Đang trống', color: 'bg-secondary', icon: 'meeting_room' },
                      RENTED: { label: 'Đã thuê', color: 'bg-primary', icon: 'person' },
                      MAINTENANCE: { label: 'Bảo trì', color: 'bg-error', icon: 'build' },
                      DEPOSITED: { label: 'Đã cọc', color: 'bg-tertiary', icon: 'lock' }
                    };
                    const config = statusConfig[room.status] || statusConfig.AVAILABLE;

                    return (
                      <div key={room.id} className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 group flex flex-col">
                        <div className="relative h-56 overflow-hidden bg-surface-container">
                          <img 
                            src={room.images?.[0] ? `http://localhost:5000/uploads/${room.images[0]}` : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000"} 
                            alt={room.roomNumber} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                          />
                          <div className={`absolute top-4 left-4 ${config.color} text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2`}>
                            <span className="material-symbols-outlined text-[14px] font-black">{config.icon}</span>
                            {config.label}
                          </div>
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-primary shadow-sm flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] fill-1">star</span>
                            {room.avgRating || '5.0'}
                          </div>
                        </div>

                        <div className="p-6 flex flex-col flex-1 space-y-6">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0">
                              <h3 className="text-xl font-black text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                                {(room.roomType === 'WHOLE_HOUSE' || /nhà|căn/i.test(room.roomNumber)) ? 'Nhà ' : 'Phòng '}{room.roomNumber}
                              </h3>
                              <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 font-bold opacity-50">
                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                {room.address}
                              </p>
                            </div>
                            <div className="text-right pl-4">
                              <span className="text-2xl font-black text-primary block tracking-tighter">{(room.price || 0).toLocaleString()}</span>
                              <span className="text-[10px] font-black text-on-surface-variant uppercase opacity-40">đ / tháng</span>
                            </div>
                          </div>

                          <div className="flex gap-4 py-4 border-y border-outline-variant/30">
                            <div className="flex items-center gap-1.5" title="Diện tích">
                              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                                <span className="material-symbols-outlined text-[18px]">aspect_ratio</span>
                              </div>
                              <span className="text-xs font-black text-on-surface">{room.area}m²</span>
                            </div>
                            <div className="flex items-center gap-1.5" title="Sức chứa">
                              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                                <span className="material-symbols-outlined text-[18px]">group</span>
                              </div>
                              <span className="text-xs font-black text-on-surface">{room.maxOccupants} người</span>
                            </div>
                          </div>

                          <div className="space-y-4 flex-1 flex flex-col justify-end">
                            {room.status === 'RENTED' && activeContract ? (
                              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-primary text-[20px] fill-1">person</span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-black text-on-surface-variant uppercase opacity-40 leading-tight">Đang thuê</p>
                                    <p className="text-sm font-black text-on-surface truncate">{activeContract.tenantName}</p>
                                  </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => setViewContract(activeContract)} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all" title="Xem Hợp đồng">
                                    <span className="material-symbols-outlined text-[20px]">description</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="py-2">
                                <p className="text-xs text-on-surface-variant font-bold opacity-40 italic">
                                  {room.status === 'AVAILABLE' ? '— Sẵn sàng đón khách mới' : room.status === 'DEPOSITED' ? '— Đã nhận đặt cọc giữ chỗ' : '— Đang trong quá trình bảo trì'}
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              {room.status === 'AVAILABLE' ? (
                                <>
                                  <button onClick={() => { setContractRoom(room); setContractData({...contractData, price: room.price, electricityPrice: room.electricityPrice, waterPrice: room.waterPrice, internetPrice: room.internetPrice, parkingPrice: room.parkingPrice, servicePrice: room.servicePrice}); }} className="col-span-2 py-3.5 bg-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all">
                                    ✍️ Ký Hợp Đồng
                                  </button>
                                  <button onClick={() => handleEditRoomClick(room)} className="py-3 bg-surface-container-high text-on-surface-variant rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">edit</span> Sửa
                                  </button>
                                  <button onClick={() => handleDeleteRoom(room.id)} className="py-3 bg-error/10 text-error rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-error hover:text-white transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">delete</span> Xóa
                                  </button>
                                  <button onClick={() => setDepositModal({ show: true, roomId: room.id, note: room.depositNote || '' })} className="col-span-2 py-3 bg-tertiary/10 text-tertiary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-tertiary hover:text-white transition-all">
                                    {room.depositNote ? '📝 Cập nhật cọc' : '💰 Nhận cọc giữ chỗ'}
                                  </button>
                                </>
                              ) : room.status === 'RENTED' ? (
                                <>
                                  {!Boolean(activeContract?.isDirectUtilityPayment) && (
                                    <button onClick={() => setBillContract(activeContract)} className="col-span-2 py-3.5 bg-tertiary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-tertiary/20 hover:scale-[1.02] active:scale-95 transition-all">
                                      🧾 Chốt Điện Nước
                                    </button>
                                  )}
                                  <button onClick={() => handleEditContractClick(activeContract)} className="py-3 bg-secondary/10 text-secondary border border-secondary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary hover:text-white transition-all">Sửa HĐ</button>
                                  <button onClick={() => handleEndLease(room.id)} className="py-3 bg-error/10 text-error border border-error/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-error hover:text-white transition-all">Trả phòng</button>
                                  {isReturningSoon ? (
                                    <button onClick={() => handleCancelTermination(activeContract.id)} className="col-span-2 py-3 bg-outline-variant text-on-surface-variant rounded-2xl text-[10px] font-black uppercase tracking-widest">Hủy lịch trả</button>
                                  ) : (
                                    <button onClick={() => { setTerminateData({ contractId: activeContract.id, moveOutDate: '', reason: '' }); setShowTerminateModal(true); }} className="col-span-2 py-3 bg-tertiary/10 text-tertiary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-tertiary hover:text-white transition-all">⚠️ Thông báo lấy lại</button>
                                  )}
                                </>
                              ) : (
                                <button onClick={() => roomApi.updateStatus(room.id, 'AVAILABLE').then(fetchRooms)} className="col-span-2 py-3.5 bg-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-all">
                                  ✅ Hoàn tất bảo trì
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB BÁO CÁO & SỰ CỐ */}
          {activeTab === 'INCIDENTS' && (
            <IncidentManagement user={user} rooms={rooms} contracts={contracts} onRepairCostUpdated={fetchLandlordIncidents} />
          )}

          {/* TAB THÊM/SỬA PHÒNG */}
          {activeTab === 'ADD_ROOM' && (
            <div style={{ background: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2563eb', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>{editingRoomId ? `Sửa thông tin: ${newRoom.roomType === 'WHOLE_HOUSE' ? '' : 'Phòng '}${newRoom.roomNumber}` : 'Đăng tin mới'}</h2>
                {editingRoomId && <button onClick={() => { setEditingRoomId(null); setActiveTab('ALL_ROOMS'); }} style={{ padding: '8px 15px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Hủy sửa</button>}
              </div>

              <form onSubmit={handleCreateRoom}>
                <fieldset style={{ marginBottom: '20px', borderColor: '#e2e8f0', padding: '15px', borderRadius: '8px' }}>
                  <legend style={{ fontWeight: 'bold', color: '#475569' }}>Hình ảnh (Tối đa 15 ảnh)</legend>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ marginBottom: '10px' }} />
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img src={preview} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px' }} />
                        <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>X</button>
                      </div>
                    ))}
                  </div>
                </fieldset>

                <fieldset style={{ marginBottom: '20px', borderColor: '#e2e8f0', padding: '15px', borderRadius: '8px' }}>
                  <legend style={{ fontWeight: 'bold', color: '#475569' }}>Thông tin cơ bản</legend>
                  
                  {/* Hàng 1: Loại hình, Số phòng, Số người, Diện tích */}
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Loại hình *</label>
                      <select value={newRoom.roomType} onChange={e => setNewRoom({...newRoom, roomType: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                        <option value="SINGLE">Phòng trọ</option>
                        <option value="WHOLE_HOUSE">Nhà nguyên căn</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>{newRoom.roomType === 'WHOLE_HOUSE' ? 'Tên căn / Số nhà' : 'Số phòng'} *</label>
                      <input type="text" placeholder={newRoom.roomType === 'WHOLE_HOUSE' ? "Ví dụ: Căn A1, Nhà số 5..." : "Số phòng"} required value={newRoom.roomNumber} onChange={e => setNewRoom({...newRoom, roomNumber: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Số người tối đa *</label>
                      <input type="number" placeholder="Số người ở tối đa" required value={newRoom.maxOccupants} onChange={e => setNewRoom({...newRoom, maxOccupants: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Diện tích (m2) *</label>
                      <input type="number" placeholder="Diện tích" required value={newRoom.area} onChange={e => setNewRoom({...newRoom, area: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  {/* Hàng 1.5: Chi tiết Nhà nguyên căn (Chỉ hiện nếu chọn WHOLE_HOUSE) */}
                  {newRoom.roomType === 'WHOLE_HOUSE' && (
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Số tầng</label>
                        <input type="number" placeholder="Ví dụ: 3" value={newRoom.numFloors} onChange={e => setNewRoom({...newRoom, numFloors: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Số phòng ngủ</label>
                        <input type="number" placeholder="Ví dụ: 4" value={newRoom.numBedrooms} onChange={e => setNewRoom({...newRoom, numBedrooms: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Số nhà vệ sinh</label>
                        <input type="number" placeholder="Ví dụ: 2" value={newRoom.numBathrooms} onChange={e => setNewRoom({...newRoom, numBathrooms: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  )}

                  {/* Hàng 2: Số nhà, ngõ, ngách (VỪA THÊM VÀO ĐÂY) */}
                  <div style={{ marginBottom: '15px' }}>
                    <input type="text" placeholder="Số nhà, ngõ, ngách, tên đường... *" required value={newRoom.houseNumber} onChange={e => setNewRoom({...newRoom, houseNumber: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                  </div>

                  {/* Hàng 3: Dropdown Tỉnh/Thành và Phường/Xã (Custom Searchable Dropdown) */}
                  <div style={{ marginBottom: '10px' }}>
                     <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b' }}>{editingRoomId ? `Khu vực cũ: ${newRoom.address} (Chọn lại bên dưới nếu muốn đổi)` : 'Chọn khu vực:'}</p>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      
                      {/* Ô CHỌN TỈNH/THÀNH (Custom Searchable Dropdown) */}
                      <div className="province-dropdown-container" style={{ flex: 1, position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>Tỉnh/Thành phố (*)</label>
                        <div 
                          onClick={() => { setProvinceDropdownOpen(!provinceDropdownOpen); setWardDropdownOpen(false); setProvinceSearch(''); }}
                          style={{ 
                            width: '100%', padding: '10px 35px 10px 12px', border: `1px solid ${provinceDropdownOpen ? '#3b82f6' : '#e2e8f0'}`, 
                            borderRadius: '6px', boxSizing: 'border-box', cursor: 'pointer', background: '#ffffff',
                            color: selectedProvince.name ? '#0f172a' : '#94a3b8', fontSize: '14px',
                            boxShadow: provinceDropdownOpen ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none', transition: 'all 0.2s'
                          }}
                        >
                          {selectedProvince.name || '-- Chọn Tỉnh/TP --'}
                          <span style={{ position: 'absolute', right: '12px', top: '38px', fontSize: '12px', color: '#64748b', transition: 'transform 0.2s', transform: provinceDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                        </div>
                        {provinceDropdownOpen && (
                          <div style={{ 
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                            background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', 
                            boxShadow: '0 10px 25px rgba(0,0,0,0.15)', maxHeight: '260px', overflow: 'hidden',
                            animation: 'fadeIn 0.15s ease-out'
                          }}>
                            <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#ffffff', zIndex: 1 }}>
                              <input 
                                type="text" autoFocus
                                placeholder="Nhập từ khóa để tìm kiếm" 
                                value={provinceSearch} 
                                onChange={(e) => setProvinceSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }}
                              />
                            </div>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              <div 
                                onClick={() => { setSelectedProvince({ code: '', name: '' }); setSelectedWard({ code: '', name: '' }); setWards([]); setProvinceDropdownOpen(false); }}
                                style={{ padding: '10px 14px', cursor: 'pointer', color: '#94a3b8', fontSize: '13px', borderBottom: '1px solid #f8fafc' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                -- Chọn Tỉnh/TP --
                              </div>
                              {provinces.filter(p => p.name.toLowerCase().includes(provinceSearch.toLowerCase())).map(p => (
                                <div 
                                  key={p.code}
                                  onClick={async () => {
                                    setSelectedProvince({ code: p.code, name: p.name });
                                    setSelectedWard({ code: '', name: '' }); setWards([]);
                                    setProvinceDropdownOpen(false); setProvinceSearch('');
                                    try {
                                      const res = await axios.get(`https://provinces.open-api.vn/api/v2/p/${p.code}?depth=2`);
                                      setWards(res.data.wards || []);
                                    } catch (error) { console.error("Lỗi lấy danh sách phường/xã:", error); }
                                  }}
                                  style={{ 
                                    padding: '10px 14px', cursor: 'pointer', fontSize: '13px', color: '#1e293b',
                                    background: selectedProvince.code === p.code ? '#dbeafe' : 'transparent',
                                    fontWeight: selectedProvince.code === p.code ? '600' : '400',
                                    borderBottom: '1px solid #f8fafc'
                                  }}
                                  onMouseEnter={(e) => { if (selectedProvince.code !== p.code) e.currentTarget.style.background = '#f1f5f9'; }}
                                  onMouseLeave={(e) => { if (selectedProvince.code !== p.code) e.currentTarget.style.background = 'transparent'; }}
                                >
                                  {p.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Ô CHỌN XÃ/PHƯỜNG (Custom Searchable Dropdown) */}
                      <div className="ward-dropdown-container" style={{ flex: 1, position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>Phường/Xã (*)</label>
                        <div 
                          onClick={() => { if (selectedProvince.code) { setWardDropdownOpen(!wardDropdownOpen); setProvinceDropdownOpen(false); setWardSearch(''); } }}
                          style={{ 
                            width: '100%', padding: '10px 35px 10px 12px', border: `1px solid ${wardDropdownOpen ? '#3b82f6' : '#e2e8f0'}`, 
                            borderRadius: '6px', boxSizing: 'border-box', cursor: selectedProvince.code ? 'pointer' : 'not-allowed', 
                            background: selectedProvince.code ? '#ffffff' : '#f8fafc',
                            color: selectedWard.name ? '#0f172a' : '#94a3b8', fontSize: '14px',
                            opacity: selectedProvince.code ? 1 : 0.6,
                            boxShadow: wardDropdownOpen ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none', transition: 'all 0.2s'
                          }}
                        >
                          {selectedWard.name || '-- Chọn Phường/Xã --'}
                          <span style={{ position: 'absolute', right: '12px', top: '38px', fontSize: '12px', color: '#64748b', transition: 'transform 0.2s', transform: wardDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                        </div>
                        {wardDropdownOpen && selectedProvince.code && (
                          <div style={{ 
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                            background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', 
                            boxShadow: '0 10px 25px rgba(0,0,0,0.15)', maxHeight: '260px', overflow: 'hidden',
                            animation: 'fadeIn 0.15s ease-out'
                          }}>
                            <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#ffffff', zIndex: 1 }}>
                              <input 
                                type="text" autoFocus
                                placeholder="Nhập từ khóa để tìm kiếm" 
                                value={wardSearch} 
                                onChange={(e) => setWardSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }}
                              />
                            </div>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              <div 
                                onClick={() => { setSelectedWard({ code: '', name: '' }); setWardDropdownOpen(false); }}
                                style={{ padding: '10px 14px', cursor: 'pointer', color: '#94a3b8', fontSize: '13px', borderBottom: '1px solid #f8fafc' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                -- Chọn Phường/Xã --
                              </div>
                              {wards.filter(w => w.name.toLowerCase().includes(wardSearch.toLowerCase())).map(w => (
                                <div 
                                  key={w.code}
                                  onClick={() => {
                                    setSelectedWard({ code: w.code, name: w.name });
                                    setWardDropdownOpen(false); setWardSearch('');
                                  }}
                                  style={{ 
                                    padding: '10px 14px', cursor: 'pointer', fontSize: '13px', color: '#1e293b',
                                    background: selectedWard.code === w.code ? '#dbeafe' : 'transparent',
                                    fontWeight: selectedWard.code === w.code ? '600' : '400',
                                    borderBottom: '1px solid #f8fafc'
                                  }}
                                  onMouseEnter={(e) => { if (selectedWard.code !== w.code) e.currentTarget.style.background = '#f1f5f9'; }}
                                  onMouseLeave={(e) => { if (selectedWard.code !== w.code) e.currentTarget.style.background = 'transparent'; }}
                                >
                                  {w.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </fieldset>

                <fieldset style={{ marginBottom: '20px', borderColor: '#e2e8f0', padding: '15px', borderRadius: '8px' }}>
                  <legend style={{ fontWeight: 'bold', color: '#475569' }}>Giá thuê & Dịch vụ</legend>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {/* Hàng 1 */}
                    <input type="number" placeholder="Giá thuê/tháng *" required value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                    <input type="number" placeholder="Giá điện/ký" value={newRoom.electricityPrice} onChange={e => setNewRoom({...newRoom, electricityPrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                    <input type="number" placeholder="Giá nước/khối" value={newRoom.waterPrice} onChange={e => setNewRoom({...newRoom, waterPrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                    
                    {/* Hàng 2: Mạng, Gửi xe, Vệ sinh */}
                    <input type="number" placeholder="Giá mạng/tháng" value={newRoom.internetPrice} onChange={e => setNewRoom({...newRoom, internetPrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                    <input type="number" placeholder="Giá gửi xe/tháng/xe" value={newRoom.parkingPrice} onChange={e => setNewRoom({...newRoom, parkingPrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                    <input type="number" placeholder="Phí vệ sinh, dịch vụ..." value={newRoom.servicePrice} onChange={e => setNewRoom({...newRoom, servicePrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                </fieldset>

                <fieldset style={{ marginBottom: '20px', borderColor: '#e2e8f0', padding: '15px', borderRadius: '8px' }}>
                  <legend style={{ fontWeight: 'bold', color: '#475569' }}>Tiện ích</legend>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', color: '#0f172a' }}>
                    <label><input type="checkbox" checked={newRoom.hasElevator} onChange={e => setNewRoom({...newRoom, hasElevator: e.target.checked})} /> Thang máy</label>
                    <label><input type="checkbox" checked={newRoom.hasWashingMachine} onChange={e => setNewRoom({...newRoom, hasWashingMachine: e.target.checked})} /> Máy giặt</label>
                    <label><input type="checkbox" checked={newRoom.hasFridge} onChange={e => setNewRoom({...newRoom, hasFridge: e.target.checked})} /> Tủ lạnh</label>
                    <label><input type="checkbox" checked={newRoom.hasKitchen} onChange={e => setNewRoom({...newRoom, hasKitchen: e.target.checked})} /> Bếp nấu</label>
                    <label><input type="checkbox" checked={newRoom.hasHeater} onChange={e => setNewRoom({...newRoom, hasHeater: e.target.checked})} /> Nóng lạnh</label>
                  </div>
                  <textarea placeholder="Mô tả chi tiết phòng..." value={newRoom.description} onChange={e => setNewRoom({...newRoom, description: e.target.value})} style={{ width: '100%', height: '80px', padding: '10px', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                </fieldset>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button type="button" onClick={() => { setEditingRoomId(null); setActiveTab('ALL_ROOMS'); }} style={{ flex: 1, padding: '15px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    HỦY BỎ
                  </button>
                  <button type="submit" style={{ flex: 1, padding: '15px', background: editingRoomId ? '#10b981' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {editingRoomId ? 'LƯU THAY ĐỔI' : 'ĐĂNG TIN'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: DANH SÁCH NGƯỜI THUÊ (Dành cho Chủ nhà) */}
          {activeTab === 'TENANTS' && (
            <div className="p-0">
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 mt-4 gap-4">
                <div>
                  <h2 className="font-display-xl text-3xl font-bold text-on-surface">Danh sách Người Thuê</h2>
                  <p className="font-body-md text-on-surface-variant mt-1">Quản lý thông tin khách thuê và lịch sử hợp đồng của bạn.</p>
                </div>
              </div>

              <div className="flex flex-col gap-6">

                {(() => {
                  // 1. Nhóm hợp đồng theo Tenant (Dùng email hoặc ID người thuê làm khóa)
                  const grouped = contracts.reduce((acc, c) => {
                    const tKey = c.tenantId || c.tenantEmail || 'DELETED';
                    if (!acc[tKey]) {
                      acc[tKey] = {
                        tenantName: c.tenantName || c.tenant?.fullName || 'Người thuê đã xóa',
                        tenantEmail: c.tenantEmail || c.tenant?.email || 'N/A',
                        tenantPhone: c.tenantPhone || c.tenant?.phone || 'N/A',
                        contracts: []
                      };
                    }
                    acc[tKey].contracts.push(c);
                    return acc;
                  }, {});

                  const tenantKeys = Object.keys(grouped);

                  if (tenantKeys.length === 0) {
                    return (
                      <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
                        <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-30">person_off</span>
                        <p className="text-on-surface-variant italic font-medium">Chưa có người thuê (Chưa có hợp đồng nào). Vui lòng tạo Hợp đồng ở mục Danh sách phòng!</p>
                      </div>
                    );
                  }


                  return tenantKeys.map((tKey, idx) => {
                    const group = grouped[tKey];
                    const isExpanded = expandedTenantRooms[tKey];
                    // Tìm xem khách này có hợp đồng nào đang ACTIVE không
                    const activeContract = group.contracts.find(c => c.status === 'ACTIVE');

                    return (
                      <div key={tKey} className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 transition-all">
                        {/* Header của Nhóm Người Thuê */}
                        <div 
                          onClick={() => setExpandedTenantRooms(prev => ({ ...prev, [tKey]: !prev[tKey] }))}
                          className={`px-8 py-6 flex justify-between items-center cursor-pointer transition-all ${isExpanded ? 'bg-surface-container-low/50' : 'hover:bg-surface-container-low/30'}`}
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-[24px] fill-1">person</span>
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-headline-md text-xl font-black text-on-surface">{group.tenantName}</h3>
                                <div className="flex items-center gap-4 mt-1">
                                    <p className="text-xs font-bold text-on-surface-variant opacity-60 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">mail</span> {group.tenantEmail}
                                    </p>
                                    <p className="text-xs font-bold text-on-surface-variant opacity-60 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">call</span> {group.tenantPhone}
                                    </p>
                                </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="bg-secondary-container text-on-secondary-container font-label-md text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
                                {group.contracts.length} hợp đồng
                            </span>
                            <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : 'text-on-surface-variant'}`}>
                              keyboard_arrow_down
                            </span>
                          </div>
                        </div>


                        {/* Danh sách các lần thuê / phòng thuê của người này */}
                        {isExpanded && (
                          <div className="overflow-x-auto border-t border-outline-variant/30">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                                  <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Phòng / Căn hộ</th>
                                  <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Thời hạn</th>
                                  <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Kết thúc thực tế</th>
                                  <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center">Trạng thái</th>
                                </tr>
                              </thead>

                              <tbody>
                                {(() => {
                                  const statusOrder = { 'ACTIVE': 0, 'EXPIRED': 1, 'TERMINATED': 2 };
                                  return [...group.contracts].sort((a, b) => {
                                    // 1. Sắp xếp theo thứ tự trạng thái ưu tiên
                                    if (statusOrder[a.status] !== statusOrder[b.status]) {
                                      return statusOrder[a.status] - statusOrder[b.status];
                                    }
                                    // 2. Nếu cùng trạng thái, cái nào mới hơn xếp trên
                                    return new Date(b.createdAt) - new Date(a.createdAt);
                                  }).map(c => (
                                    <tr key={c.id} className="hover:bg-surface-container-low/30 transition-colors group border-b border-outline-variant/30 last:border-0">
                                      <td className="py-4 px-8">
                                        <div className="font-bold text-primary group-hover:text-surface-tint">
                                          {(c.room?.roomType === 'WHOLE_HOUSE' || /nhà|căn/i.test(c.room?.roomNumber)) ? 'Nhà nguyên căn ' : 'Phòng trọ '}{c.room?.roomNumber || 'Đã xóa'}
                                        </div>
                                        <div className="text-[11px] font-bold text-on-surface-variant opacity-50 uppercase tracking-wider">Mã: {c.room?.roomCode || 'N/A'}</div>
                                      </td>
                                      <td className="py-4 px-8">
                                        <div className="font-medium text-on-surface">{c.startDate} <span className="material-symbols-outlined text-[14px] opacity-30 px-1">arrow_forward</span> {c.endDate}</div>
                                      </td>
                                      <td className="py-4 px-8">
                                        {c.status === 'ACTIVE' ? <span className="text-on-surface-variant opacity-30">—</span> : <span className="font-medium text-on-surface">{new Date(c.updatedAt).toLocaleDateString('vi-VN')}</span>}
                                      </td>
                                      <td className="py-4 px-8 text-center">

                                      {(() => {
                                        if (c.status === 'ACTIVE') return (
                                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[11px] font-bold uppercase tracking-wider">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-2"></span>
                                            Đang thuê
                                          </span>
                                        );
                                        const updated = new Date(c.updatedAt);
                                        const end = new Date(c.endDate);
                                        const isPre = updated < end;
                                        if (c.status === 'TERMINATED' || (c.status === 'EXPIRED' && isPre)) return (
                                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-[11px] font-bold uppercase tracking-wider">
                                            <span className="w-1.5 h-1.5 rounded-full bg-error mr-2"></span>
                                            Hủy trước hạn
                                          </span>
                                        );
                                        return (
                                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-[11px] font-bold uppercase tracking-wider border border-outline-variant/30">
                                            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30 mr-2"></span>
                                            Đã kết thúc
                                          </span>
                                        );
                                      })()}
                                    </td>

                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* TAB 4: PHÒNG ĐANG THUÊ (Dành cho Khách thuê - ĐÃ NÂNG CẤP) */}
          {activeTab === 'TENANT_ROOMS' && (() => {
            const tenantContracts = contracts.filter(c => c.tenantId === user.id);
            const sortedTenantContracts = [...tenantContracts].sort((a, b) => {
              if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
              if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
              return 0;
            });

            return (
              <div className="max-w-[1200px] mx-auto py-8 px-4 lg:px-8">
                {/* Page Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h1 className="text-display-xl font-display-xl text-3xl font-bold text-on-surface">Phòng đang thuê</h1>
                    <p className="text-body-lg text-on-surface-variant mt-2 max-w-2xl">Quản lý các hợp đồng thuê nhà hiện tại, truy cập tài liệu pháp lý và thực hiện các yêu cầu liên quan.</p>
                  </div>
                  <div className="bg-secondary-container/20 border border-secondary-container/50 text-on-secondary-container px-5 py-2.5 rounded-full flex items-center gap-2.5 self-start md:self-auto shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                    <span className="text-label-md font-bold text-secondary">Hợp đồng hợp lệ</span>
                  </div>
                </div>

                <div className="space-y-12">
                  {sortedTenantContracts.length === 0 ? (
                    <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
                      <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-30">meeting_room</span>
                      <p className="text-on-surface-variant italic">Bạn chưa có hợp đồng thuê phòng nào.</p>
                    </div>
                  ) : (
                    sortedTenantContracts.map(c => (
                      <div key={c.id} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-16">
                        {/* Room Details Card (Left - 2 Cols) */}
                        <div className="xl:col-span-2 flex flex-col gap-6">
                          <div className="bg-surface-container-lowest rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 overflow-hidden flex flex-col relative group">
                            {/* Hero Image Section */}
                            <div className="h-80 w-full relative overflow-hidden bg-surface-container">
                              <img 
                                alt={`Phòng ${c.room?.roomNumber}`} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                                src={c.room?.images?.[0] ? `http://localhost:5000/uploads/${c.room.images[0]}` : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000"} 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                              
                              {/* Overlay Content */}
                              <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end">
                                <div className="text-white">
                                  <div className="flex items-center gap-3 mb-3">
                                    <h2 className="text-3xl font-black text-white tracking-tight">Phòng {c.room?.roomNumber}</h2>
                                    <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border ${
                                      c.status === 'ACTIVE' ? 'bg-secondary/20 border-secondary/50 text-secondary-fixed' : 'bg-error/20 border-error/50 text-error-container'
                                    }`}>
                                      {c.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã kết thúc'}
                                    </span>
                                  </div>
                                  <p className="text-base flex items-center gap-2 opacity-90 font-medium">
                                    <span className="material-symbols-outlined text-[20px] text-primary-fixed-dim">location_on</span>
                                    {c.room?.houseNumber ? `${c.room.houseNumber}, ` : ''}{c.room?.address}
                                  </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md text-white px-6 py-4 rounded-2xl border border-white/20 text-center min-w-[140px] shadow-2xl">
                                  <p className="text-[10px] font-bold text-white/60 mb-1 uppercase tracking-widest">Giá thuê hàng tháng</p>
                                  <p className="text-2xl font-black text-white leading-none">{Number(c.price || 0).toLocaleString('vi-VN')} <span className="text-sm font-normal">đ</span></p>
                                </div>
                              </div>
                            </div>

                            {/* Data & Actions Section */}
                            <div className="p-8 bg-surface-container-lowest flex-1 flex flex-col justify-between">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-on-surface-variant/60"><span className="material-symbols-outlined text-[18px]">calendar_month</span><p className="text-[11px] font-bold uppercase tracking-wider">Bắt đầu</p></div>
                                  <p className="text-base text-on-surface font-bold pl-6">{c.startDate}</p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-on-surface-variant/60"><span className="material-symbols-outlined text-[18px]">event_available</span><p className="text-[11px] font-bold uppercase tracking-wider">Kết thúc</p></div>
                                  <p className="text-base text-on-surface font-bold pl-6">{c.endDate}</p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-on-surface-variant/60"><span className="material-symbols-outlined text-[18px]">bed</span><p className="text-[11px] font-bold uppercase tracking-wider">Loại phòng</p></div>
                                  <p className="text-base text-on-surface font-bold pl-6">{c.room?.roomType === 'WHOLE_HOUSE' ? 'Nhà nguyên căn' : 'Phòng trọ'}</p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-on-surface-variant/60"><span className="material-symbols-outlined text-[18px]">fingerprint</span><p className="text-[11px] font-bold uppercase tracking-wider">Mã phòng</p></div>
                                  <p className="text-base text-on-surface font-bold pl-6">{c.room?.roomCode || 'N/A'}</p>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-outline-variant/30">
                                <button 
                                  onClick={() => setViewContract(c)}
                                  className="w-full sm:w-auto bg-primary text-on-primary hover:bg-surface-tint transition-all px-8 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                                  Xem Hợp đồng điện tử
                                </button>
                                
                                {c.status === 'ACTIVE' && !c.intendedMoveOutDate && (
                                  <button 
                                    onClick={() => setTerminateData({ contractId: c.id, moveOutDate: '', reason: '' }) || setShowTerminateModal(true)}
                                    className="w-full sm:w-auto bg-surface-container-high hover:bg-error/10 hover:text-error hover:border-error transition-all border border-outline-variant text-on-surface-variant px-8 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 sm:ml-auto"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">exit_to_app</span>
                                    Báo trước dọn đi
                                  </button>
                                )}

                                {c.status !== 'ACTIVE' && (
                                  <button 
                                    onClick={() => {
                                      const existingReview = myReviews.find(r => r.contractId === c.id);
                                      if (existingReview) {
                                        setReviewData({ contractId: c.id, rating: existingReview.rating, comment: existingReview.comment, isAnonymous: existingReview.isAnonymous, landlordReply: existingReview.landlordReply });
                                      } else {
                                        setReviewData({ contractId: c.id, rating: 5, comment: '', isAnonymous: false, landlordReply: null });
                                      }
                                      setShowReviewModal(true);
                                    }}
                                    className="w-full sm:w-auto bg-tertiary text-on-tertiary hover:bg-tertiary/90 transition-all px-8 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 sm:ml-auto shadow-lg shadow-tertiary/20"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">star</span>
                                    {myReviews.some(r => r.contractId === c.id) ? 'Xem & Sửa đánh giá' : 'Đánh giá phòng'}
                                  </button>
                                )}
                              </div>
                              
                              {/* Count-down to vacate */}
                              {c.status === 'ACTIVE' && c.intendedMoveOutDate && (
                                <div className="mt-6 bg-error-container/30 border border-error-container/50 p-6 rounded-2xl flex items-center justify-between gap-4 animate-pulse">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center text-error">
                                      <span className="material-symbols-outlined text-[28px]">pending_actions</span>
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-error">Yêu cầu trả phòng đang xử lý</p>
                                      <p className="text-xs text-on-error-container">Dự kiến dọn đi: <span className="font-bold">{c.intendedMoveOutDate}</span></p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleCancelTermination(c.id)}
                                    className="bg-error text-on-error px-4 py-2 rounded-lg text-xs font-bold hover:scale-105 transition-all"
                                  >
                                    Hủy yêu cầu
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Amenities Bar */}
                          <div className="bg-surface-container-low/50 rounded-2xl border border-outline-variant/30 p-6 flex flex-wrap justify-center md:justify-between items-center gap-8 shadow-inner">
                            <div className="flex items-center gap-3 text-on-surface-variant">
                              <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-primary text-[20px]">wifi</span></div>
                              <span className="text-sm font-bold opacity-80">Wifi tốc độ cao</span>
                            </div>
                            <div className="flex items-center gap-3 text-on-surface-variant">
                              <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-primary text-[20px]">local_laundry_service</span></div>
                              <span className="text-sm font-bold opacity-80">Máy giặt chung</span>
                            </div>
                            <div className="flex items-center gap-3 text-on-surface-variant">
                              <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-primary text-[20px]">ac_unit</span></div>
                              <span className="text-sm font-bold opacity-80">Điều hòa nhiệt độ</span>
                            </div>
                            <div className="flex items-center gap-3 text-on-surface-variant">
                              <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-primary text-[20px]">security</span></div>
                              <span className="text-sm font-bold opacity-80">An ninh 24/7</span>
                            </div>
                          </div>
                        </div>

                        {/* Documents & Residence Side Panel (Right) */}
                        <div className="flex flex-col gap-6">
                          <div className="bg-surface-container-lowest rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 p-8 flex flex-col h-full">
                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-outline-variant/30">
                              <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder_shared</span>
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-on-surface leading-tight">Hồ sơ & Tài liệu</h3>
                                <p className="text-xs text-on-surface-variant mt-1 font-medium">Bản ghi điện tử chính thức</p>
                              </div>
                            </div>

                            <div className="space-y-4 flex-1">
                              {/* Lease Agreement */}
                              <div 
                                onClick={() => setViewContract(c)}
                                className="group relative flex items-center justify-between p-4 rounded-2xl border border-outline-variant/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-white transition-colors">
                                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">contract</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Hợp đồng thuê nhà</p>
                                    <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">E-PDF • Hiệu lực {c.startDate}</p>
                                  </div>
                                </div>
                                <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-all text-[20px]">download</span>
                              </div>

                              {/* Residence Status Card */}
                              <div className={`p-6 rounded-3xl border-2 transition-all duration-300 ${
                                c.residenceStatus === 'REGISTERED' && editingResidenceId !== c.id 
                                ? 'border-secondary/20 bg-secondary/5' 
                                : 'border-tertiary-fixed/40 bg-tertiary-fixed/10'
                              }`}>
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-[20px] ${c.residenceStatus === 'REGISTERED' ? 'text-secondary' : 'text-tertiary'}`}>
                                      {c.residenceStatus === 'REGISTERED' ? 'verified_user' : 'report_problem'}
                                    </span>
                                    <h4 className="text-sm font-bold text-on-surface">Khai báo Tạm trú</h4>
                                  </div>
                                  {editingResidenceId === c.id && (
                                    <button 
                                      onClick={() => { setEditingResidenceId(null); setResidenceFiles(prev => ({ ...prev, [c.id]: [] })); }} 
                                      className="text-[11px] font-bold text-error hover:underline"
                                    >
                                      Hủy bỏ
                                    </button>
                                  )}
                                </div>

                                {c.residenceStatus === 'REGISTERED' && editingResidenceId !== c.id ? (
                                  <div className="space-y-4">
                                    <div className="space-y-1">
                                      <p className="text-[11px] font-bold text-on-surface-variant uppercase opacity-60">Nơi đăng ký</p>
                                      <p className="text-sm font-bold text-on-surface">{c.residencePlace || 'Đã đăng ký'}</p>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                      {(() => {
                                        let resImages = [];
                                        try { resImages = Array.isArray(c.residenceImage) ? c.residenceImage : JSON.parse(c.residenceImage || '[]'); } catch (e) { resImages = []; }
                                        return resImages.map((img, idx) => (
                                          <img 
                                            key={idx} 
                                            src={`http://localhost:5000/uploads/${img.replace(/uploads[\\\/]/, '')}`} 
                                            alt="MC" 
                                            className="w-14 h-14 rounded-lg object-cover border border-outline-variant/30 hover:scale-105 transition-transform cursor-pointer shadow-sm"
                                            onClick={() => window.open(`http://localhost:5000/uploads/${img.replace(/uploads[\\\/]/, '')}`)}
                                          />
                                        ));
                                      })()}
                                    </div>
                                    <button 
                                      onClick={() => {
                                        setEditingResidenceId(c.id);
                                        setResidenceData(prev => ({ ...prev, [c.id]: { date: c.residenceDate || '', place: c.residencePlace || '' } }));
                                      }}
                                      className="w-full py-2.5 bg-secondary text-on-secondary text-xs font-bold rounded-xl shadow-md shadow-secondary/10 hover:bg-secondary/90 transition-all"
                                    >
                                      Cập nhật minh chứng
                                    </button>
                                  </div>
                                ) : (
                                  <form onSubmit={(e) => handleUploadResidence(e, c.id)} className="space-y-3">
                                    <input 
                                      type="date" 
                                      required
                                      value={residenceData[c.id]?.date || ''} 
                                      onChange={e => setResidenceData(prev => ({...prev, [c.id]: {...(prev[c.id] || {}), date: e.target.value}}))} 
                                      className="w-full p-3 rounded-xl border border-outline-variant/30 bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <input 
                                      type="text" 
                                      required
                                      placeholder="Cơ quan CA tiếp nhận..." 
                                      value={residenceData[c.id]?.place || ''} 
                                      onChange={e => setResidenceData(prev => ({...prev, [c.id]: {...(prev[c.id] || {}), place: e.target.value}}))} 
                                      className="w-full p-3 rounded-xl border border-outline-variant/30 bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <div className="relative group">
                                      <input 
                                        type="file" multiple accept="image/*" 
                                        onChange={(e) => setResidenceFiles(prev => ({ ...prev, [c.id]: Array.from(e.target.files) }))} 
                                        className="w-full p-3 bg-white rounded-xl border border-dashed border-outline-variant group-hover:border-primary transition-all cursor-pointer text-[10px]"
                                      />
                                    </div>
                                    <button 
                                      type="submit" 
                                      className="w-full py-3 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-surface-tint transition-all"
                                    >
                                      Gửi minh chứng
                                    </button>
                                  </form>
                                )}
                              </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-outline-variant/30">
                              <div className="bg-surface-container-low p-4 rounded-2xl flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
                                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                                  Nếu bạn cần thư giới thiệu hoặc xác nhận cư trú cho mục đích khác, vui lòng gửi yêu cầu hỗ trợ.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}

        
          
{/* TAB 5: THANH TOÁN HÓA ĐƠN (GIAO DIỆN FULL CHIỀU RỘNG) */}
        {activeTab === 'TENANT_BILLS' && (() => {
          const activeRoomId = selectedRoomId || 'ALL';
          const filteredBills = activeRoomId === 'ALL' 
            ? tenantBills 
            : tenantBills.filter(b => (b.roomNumberSnapshot || b.contract?.room?.roomNumber || 'Phòng đã xóa') === activeRoomId);
          
          const sortedBills = [...filteredBills].sort((a, b) => b.id - a.id);
          
          // Calculate Summary Stats
          const unpaidBills = sortedBills.filter(b => b.status === 'UNPAID');
          const outstandingBalance = unpaidBills.reduce((sum, b) => sum + b.totalAmount, 0);
          
          const lastPaidBill = sortedBills.find(b => b.status === 'PAID');
          const nextDueBill = unpaidBills[0]; // Assume first unpaid is next due

          return (
            <div className="max-w-[1200px] mx-auto py-8 px-4 lg:px-8">
              {/* Page Header */}
              <div className="mb-10">
                <h1 className="font-display-xl text-3xl font-bold text-on-surface mb-2">Thanh toán hóa đơn</h1>
                <p className="font-body-lg text-on-surface-variant">Quản lý tiền thuê nhà và các hóa đơn dịch vụ của bạn.</p>
              </div>

              {/* Summary Cards (Bento Layout) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Outstanding Balance */}
                <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-error-container/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                  <div>
                    <div className="flex items-center gap-3 text-on-surface-variant mb-6">
                      <span className="material-symbols-outlined text-error p-2 bg-error-container/30 rounded-xl">account_balance_wallet</span>
                      <h2 className="font-headline-md text-lg font-bold">Số dư nợ</h2>
                    </div>
                    <p className="font-display-xl text-3xl font-black text-error mb-1 tracking-tight">
                      {outstandingBalance.toLocaleString('vi-VN')} <span className="text-sm font-normal">đ</span>
                    </p>
                    <p className="font-body-sm text-sm text-on-surface-variant flex items-center gap-1">
                      {unpaidBills.length > 0 ? (
                        <>
                          <span className="material-symbols-outlined text-[16px] text-error fill-1">warning</span>
                          Có {unpaidBills.length} hóa đơn chưa đóng
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px] text-secondary fill-1">check_circle</span>
                          Tất cả đã thanh toán
                        </>
                      )}
                    </p>
                  </div>
                  <div className="mt-8">
                    <button 
                      onClick={() => nextDueBill && setViewBillDetails(nextDueBill)}
                      disabled={!nextDueBill}
                      className="w-full bg-error text-on-error hover:bg-error/90 font-label-md text-sm py-4 rounded-xl transition-all shadow-lg shadow-error/20 disabled:opacity-30 disabled:shadow-none"
                    >
                      Thanh toán ngay
                    </button>
                  </div>
                </div>

                {/* Next Rent Due */}
                <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center gap-3 text-on-surface-variant mb-6">
                      <span className="material-symbols-outlined text-primary p-2 bg-primary-fixed/30 rounded-xl">calendar_month</span>
                      <h2 className="font-headline-md text-lg font-bold">Kỳ hạn tiếp theo</h2>
                    </div>
                    {nextDueBill ? (
                      <>
                        <p className="font-display-xl text-3xl font-black text-on-surface mb-1 tracking-tight">
                          {nextDueBill.totalAmount.toLocaleString('vi-VN')} <span className="text-sm font-normal">đ</span>
                        </p>
                        <p className="font-body-sm text-sm text-on-surface-variant">Tháng {nextDueBill.month}/{nextDueBill.year}</p>
                      </>
                    ) : (
                      <p className="text-on-surface-variant italic py-2">Chưa có kỳ hạn mới</p>
                    )}
                  </div>
                  <div className="mt-8">
                    <button 
                      onClick={() => nextDueBill && setViewBillDetails(nextDueBill)}
                      disabled={!nextDueBill}
                      className="w-full bg-surface-container text-primary hover:bg-surface-container-high font-label-md text-sm py-4 rounded-xl transition-all border border-primary/10 disabled:opacity-30"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>

                {/* Last Payment */}
                <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center gap-3 text-on-surface-variant mb-6">
                      <span className="material-symbols-outlined text-secondary p-2 bg-secondary-container/30 rounded-xl">check_circle</span>
                      <h2 className="font-headline-md text-lg font-bold">Thanh toán gần nhất</h2>
                    </div>
                    {lastPaidBill ? (
                      <>
                        <p className="font-display-xl text-3xl font-black text-on-surface mb-1 tracking-tight">
                          {lastPaidBill.totalAmount.toLocaleString('vi-VN')} <span className="text-sm font-normal">đ</span>
                        </p>
                        <p className="font-body-sm text-sm text-on-surface-variant">Đã thanh toán kỳ {lastPaidBill.month}/{lastPaidBill.year}</p>
                      </>
                    ) : (
                      <p className="text-on-surface-variant italic py-2">Chưa có dữ liệu</p>
                    )}
                  </div>
                  <div className="mt-8">
                    <button 
                      onClick={() => lastPaidBill && setViewBillDetails(lastPaidBill)}
                      disabled={!lastPaidBill}
                      className="w-full text-primary hover:text-surface-tint font-label-md text-sm py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                    >
                      Xem biên lai
                      <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment History List */}
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-display-xl text-2xl font-bold text-on-surface">Lịch sử thanh toán</h2>
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="w-3 h-3 rounded-full bg-secondary"></span> Đã đóng
                    <span className="w-3 h-3 rounded-full bg-error ml-2"></span> Nợ
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {sortedBills.length === 0 ? (
                    <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
                      <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-30">payments</span>
                      <p className="text-on-surface-variant italic">Bạn chưa có dữ liệu hóa đơn nào.</p>
                    </div>
                  ) : (
                    sortedBills.map((bill) => (
                      <div 
                        key={bill.id} 
                        className={`bg-surface-container-lowest rounded-3xl p-8 border-l-[6px] border-y border-r border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 hover:border-primary/20 transition-all group ${
                          bill.status === 'PAID' ? 'border-l-secondary' : 'border-l-error'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <h3 className="font-headline-md text-xl font-bold text-on-surface">Tháng {bill.month}/{bill.year}</h3>
                            {bill.status === 'PAID' ? (
                              <span className="bg-secondary-container text-on-secondary-container font-label-md text-[11px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] fill-1">check</span>
                                Đã thanh toán
                              </span>
                            ) : bill.status === 'PENDING_CONFIRM' ? (
                              <span className="bg-primary-fixed text-on-primary-fixed font-label-md text-[11px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">visibility</span>
                                Chờ duyệt
                              </span>
                            ) : (
                              <span className="bg-error-container text-on-error-container font-label-md text-[11px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">priority_high</span>
                                Chưa thanh toán
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-body-sm text-sm text-on-surface-variant">
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold uppercase tracking-wide opacity-60">Loại</span>
                              <span className="text-on-surface font-bold text-base">
                                {bill.billType === 'ROOM' ? '🏠 Tiền nhà' : bill.billType === 'UTILITY' ? '⚡ Điện nước' : '🧾 Tổng hợp'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold uppercase tracking-wide opacity-60">Chỉ số Điện</span>
                              <span className="text-on-surface font-medium">{bill.electricityUsage || '---'} ký</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold uppercase tracking-wide opacity-60">Chỉ số Nước</span>
                              <span className="text-on-surface font-medium">{bill.waterUsage || '---'} khối</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-bold uppercase tracking-wide opacity-60">Ngày tạo</span>
                              <span className="text-on-surface font-medium">{new Date(bill.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-6 border-t lg:border-t-0 border-outline-variant/30 pt-6 lg:pt-0">
                          <div className="text-left lg:text-right">
                            <span className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 opacity-60">Tổng cộng</span>
                            <span className={`font-display-xl text-2xl font-black ${bill.status === 'PAID' ? 'text-on-surface' : 'text-error'}`}>
                              {bill.totalAmount.toLocaleString('vi-VN')} <span className="text-sm font-normal">đ</span>
                            </span>
                          </div>
                          <button 
                            onClick={() => setViewBillDetails(bill)}
                            className="bg-primary text-on-primary hover:bg-surface-tint font-label-md text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/10 flex items-center gap-2 whitespace-nowrap"
                          >
                            Xem chi tiết
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })()}
          

          {/* TAB: QUẢN LÝ HÓA ĐƠN (Dành cho Chủ nhà) */}
          {activeTab === 'LANDLORD_BILLS' && (
            <div className="p-0">
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 mt-4 gap-4">
                <div>
                  <h2 className="font-display-xl text-3xl font-bold text-on-surface">Quản lý Hóa Đơn & Thu Tiền</h2>
                  <p className="font-body-md text-on-surface-variant mt-1">Quản lý toàn bộ hóa đơn tiền phòng, dịch vụ và theo dõi trạng thái thanh toán.</p>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/30 px-5 py-2.5 rounded-full flex items-center gap-2.5 self-start md:self-auto shadow-sm">
                  <span className="text-label-md font-bold text-on-surface-variant">Tổng số:</span>
                  <span className="text-label-md font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">{bills.length}</span>
                </div>
              </div>
              
              <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 transition-all">
                {bills.length === 0 ? (
                  <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant m-8">
                    <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-30">receipt_long</span>
                    <p className="text-on-surface-variant italic font-medium">Chưa có hóa đơn nào được tạo trên hệ thống.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low/50">
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold w-2/5">Phòng / Căn</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold w-[15%]">Kỳ Hóa Đơn</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold w-[15%]">Khách Thuê</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center w-[15%]">Loại Hóa Đơn</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center w-[15%]">Trạng Thái</th>
                        <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center w-[10%]">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...bills].reverse().map(bill => (
                        <tr key={bill.id} className="hover:bg-surface-container-low/30 transition-colors group border-b border-outline-variant/30 last:border-0">
                          
                          <td className="py-4 px-8">
                            <div className="font-bold text-primary group-hover:text-surface-tint text-base">
                                {(() => {
                                    const base = bill.roomNumberSnapshot || bill.contract?.room?.roomNumber || 'Phòng đã xóa';
                                    const isWhole = (bill.contract?.room?.roomType === 'WHOLE_HOUSE' || /nhà|căn/i.test(base));
                                    const typeLabel = isWhole ? 'Nhà nguyên căn' : 'Phòng trọ';
                                    if (/phòng|nhà|căn/i.test(base)) return base;
                                    return `${typeLabel} ${base}`;
                                })()}
                            </div>
                            <div className="text-[11px] font-bold text-on-surface-variant opacity-50 uppercase tracking-wider mt-1">
                              Mã: {bill.roomCodeSnapshot || bill.contract?.room?.roomCode || 'N/A'}
                            </div>
                          </td>
                          
                          <td className="py-4 px-8">
                            <div className="font-bold text-on-surface text-base">Tháng {bill.month}/{bill.year}</div>
                          </td>
                          
                          <td className="py-4 px-8">
                            <div className="font-bold text-on-surface text-sm">{bill.tenantNameSnapshot || bill.contract?.tenantName || bill.contract?.tenant?.fullName || 'Khách cũ'}</div>
                            <div className="text-xs text-on-surface-variant font-medium mt-0.5">{bill.contract?.tenantEmail || '...'}</div>
                            <div className="text-[11px] text-on-surface-variant font-medium opacity-70">SĐT: {bill.contract?.tenantPhone || bill.contract?.tenant?.phone || '...'}</div>
                          </td>
                          
                          <td className="py-4 px-8 text-center">
                            {bill.billType === 'ROOM' ? (
                               <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[11px] font-bold uppercase tracking-wider border border-secondary/20">
                               <span className="material-symbols-outlined text-[14px]">home</span>
                               Tiền phòng
                               </span>
                            ) : bill.billType === 'UTILITY' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-md text-[11px] font-bold uppercase tracking-wider border border-tertiary/20">
                              <span className="material-symbols-outlined text-[14px]">bolt</span>
                              Tiền điện nước
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-on-surface font-label-md text-[11px] font-bold uppercase tracking-wider border border-outline-variant/30">
                              <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                              Tổng hợp
                              </span>
                            )}
                          </td>
                          
                          <td className="py-4 px-8 text-center">
                            {bill.status === 'PAID' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container/50 text-secondary font-label-md text-[11px] font-bold uppercase tracking-wider border border-secondary/30 gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                Đã thu tiền
                              </span>
                            ) : bill.status === 'PENDING_CONFIRM' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-container/50 text-primary font-label-md text-[11px] font-bold uppercase tracking-wider border border-primary/30 gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                Chờ duyệt
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-error-container/50 text-error font-label-md text-[11px] font-bold uppercase tracking-wider border border-error/30 gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                                Chờ thanh toán
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-8 text-center">
                            <button 
                              onClick={() => setViewBillDetails(bill)} 
                              className="bg-primary/10 text-primary hover:bg-primary hover:text-white font-label-md text-[12px] px-4 py-2 rounded-xl transition-all font-bold flex items-center justify-center gap-2 mx-auto"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              Xem
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </div>
          )}
        {activeTab === 'LANDLORD_REVENUE' && user?.role === 'LANDLORD' && (() => {
          
          // 1. LỌC HÓA ĐƠN THEO THÁNG/NĂM CHỦ NHÀ ĐANG CHỌN
          const filteredBills = bills.filter(b => 
            (reportMonth === 'ALL' || Number(b.month) === Number(reportMonth)) &&
            (reportYear === 'ALL' || Number(b.year) === Number(reportYear))
          );

          // 2. LỌC SỰ CỐ CÓ CHI PHÍ THEO THÁNG/NĂM (dựa vào createdAt của sự cố)
          const filteredIncidents = landlordIncidents.filter(inc => {
            if (!inc.repairCost || inc.repairCost <= 0) return false;
            const incDate = new Date(inc.createdAt);
            const incMonth = incDate.getMonth() + 1;
            const incYear = incDate.getFullYear();
            return (
              (reportMonth === 'ALL' || Number(incMonth) === Number(reportMonth)) &&
              (reportYear === 'ALL' || Number(incYear) === Number(reportYear))
            );
          });

          // 3. TÍNH TỔNG CÁC THẺ CHỈ SỐ
          let totalRoomRevenue = 0;
          let totalUtilityRevenue = 0;
          let grandTotalDebt = 0;

          filteredBills.forEach(bill => {
            const amount = bill.totalAmount || 0;
            if (bill.status === 'PAID') {
              if (bill.billType === 'UTILITY') totalUtilityRevenue += amount;
              else totalRoomRevenue += amount;
            } else {
              grandTotalDebt += amount;
            }
          });

          // Tổng chi phí phát sinh
          const totalRepairCost = filteredIncidents.reduce((sum, inc) => sum + (Number(inc.repairCost) || 0), 0);

          // TỔNG DOANH THU = Tiền phòng + Điện nước - Chi phí phát sinh
          const grandTotalRevenue = totalRoomRevenue + totalUtilityRevenue - totalRepairCost;

          // 4. GHÉP HÓA ĐƠN VÀO TỪNG PHÒNG DỰA TRÊN SNAPSHOT
          const roomGroups = {};
          
          filteredBills.forEach(bill => {
            const rName = bill.roomNumberSnapshot || (bill.contract?.room ? `Phòng ${bill.contract.room.roomNumber}` : 'Phòng đã xóa');
            if (!roomGroups[rName]) {
              roomGroups[rName] = { 
                id: rName,
                roomNumber: rName, 
                address: bill.contract?.room?.address || '', 
                roomType: bill.contract?.room?.roomType || 'SINGLE',
                roomCode: bill.roomCodeSnapshot || bill.contract?.room?.roomCode || '',
                bills: [], 
                incidentCosts: [],
                roomTotalRevenue: 0 
              };
            }
            roomGroups[rName].bills.push(bill);
            if (bill.status === 'PAID') {
              roomGroups[rName].roomTotalRevenue += (bill.totalAmount || 0);
            }
          });

          // GÁN SỰ CỐ CHI PHÍ VÀO NHÓM PHÒNG TƯƠNG ỨNG
          filteredIncidents.forEach(inc => {
            const incRoomNum = String(inc.room?.roomNumber || '');
            // Tìm key phòng khớp trong roomGroups
            const matchedKey = Object.keys(roomGroups).find(k =>
              k.toLowerCase().includes(incRoomNum.toLowerCase()) && incRoomNum !== ''
            );
            const targetKey = matchedKey || `Phòng ${incRoomNum || 'không rõ'}`;

            if (!roomGroups[targetKey]) {
              roomGroups[targetKey] = {
                id: targetKey,
                roomNumber: targetKey,
                address: inc.room?.address || '',
                roomType: inc.room?.roomType || 'SINGLE',
                roomCode: inc.room?.roomCode || '',
                bills: [],
                incidentCosts: [],
                roomTotalRevenue: 0
              };
            }
            if (!roomGroups[targetKey].incidentCosts) roomGroups[targetKey].incidentCosts = [];
            roomGroups[targetKey].incidentCosts.push(inc);
          });

          // Biến object thành mảng để hiển thị
          let reportData = Object.values(roomGroups);

          // Áp dụng bộ lọc tìm kiếm
          if (reportSearch.trim() !== '') {
            const keyword = reportSearch.toLowerCase();
            reportData = reportData.filter(r => 
              r.roomNumber.toLowerCase().includes(keyword) || 
              (r.address && r.address.toLowerCase().includes(keyword))
            );
          }

          return (
            <div className="p-0">
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 mt-4 gap-4">
                <div>
                  <h2 className="font-display-xl text-3xl font-bold text-on-surface">Báo cáo Doanh Thu</h2>
                  <p className="font-body-md text-on-surface-variant mt-1">Theo dõi dòng tiền, phân tích thu chi và hiệu quả kinh doanh.</p>
                </div>
              </div>

              {/* THANH TÌM KIẾM & BỘ LỌC */}
              <div className="bg-surface-container-lowest p-6 rounded-[2rem] shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col lg:flex-row gap-6 items-center mb-8">
                <div className="relative w-full lg:flex-1 group">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[22px]">search</span>
                  <input 
                    type="text" 
                    placeholder="Tìm theo số phòng, số nhà, ngõ, phường..." 
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="w-full pl-14 pr-4 py-4 bg-surface-container-low border border-outline-variant/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none placeholder:opacity-50"
                  />
                </div>
                <div className="flex flex-wrap w-full lg:w-auto gap-4">
                  <div className="relative flex-1 lg:flex-none">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">calendar_month</span>
                    <select 
                      value={reportMonth} 
                      onChange={(e) => setReportMonth(e.target.value)} 
                      className="w-full appearance-none pl-12 pr-10 py-4 bg-surface-container-low border border-outline-variant/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none cursor-pointer"
                    >
                      <option value="ALL">Cả năm</option>
                      {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                  </div>
                  <div className="relative flex-1 lg:flex-none">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">calendar_today</span>
                    <select 
                      value={reportYear} 
                      onChange={(e) => setReportYear(e.target.value)} 
                      className="w-full appearance-none pl-12 pr-10 py-4 bg-surface-container-low border border-outline-variant/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none cursor-pointer"
                    >
                      <option value="ALL">Tất cả các năm</option>
                      <option value="2026">Năm 2026</option>
                      <option value="2025">Năm 2025</option>
                      <option value="2024">Năm 2024</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>

              {/* 5 THẺ TỔNG QUAN (Metrics Bento Grid) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 mb-10">
                <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between group hover:border-primary/30 transition-all col-span-2 md:col-span-1 lg:col-span-1 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">account_balance</span>
                    </div>
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Tổng Doanh Thu</p>
                    <h3 className="text-2xl lg:text-xl xl:text-2xl font-black text-primary mt-1 tracking-tight">{grandTotalRevenue.toLocaleString('vi-VN')} đ</h3>
                    <p className="text-[10px] text-on-surface-variant mt-2 font-medium opacity-60">= Phòng + Điện nước - Chi phí</p>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between group hover:border-secondary/30 transition-all relative overflow-hidden">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                   <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">real_estate_agent</span>
                    </div>
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Từ Tiền Phòng</p>
                    <h3 className="text-2xl lg:text-xl xl:text-2xl font-black text-secondary mt-1 tracking-tight">{totalRoomRevenue.toLocaleString('vi-VN')} đ</h3>
                   </div>
                </div>

                <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between group hover:border-tertiary/30 transition-all relative overflow-hidden">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-tertiary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                   <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">bolt</span>
                    </div>
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Từ Điện Nước</p>
                    <h3 className="text-2xl lg:text-xl xl:text-2xl font-black text-tertiary mt-1 tracking-tight">{totalUtilityRevenue.toLocaleString('vi-VN')} đ</h3>
                   </div>
                </div>

                <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between group hover:border-error/30 transition-all relative overflow-hidden">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-error/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                   <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">warning</span>
                    </div>
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Khách Đang Nợ</p>
                    <h3 className="text-2xl lg:text-xl xl:text-2xl font-black text-error mt-1 tracking-tight">{grandTotalDebt.toLocaleString('vi-VN')} đ</h3>
                   </div>
                </div>

                <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col justify-between group hover:border-[#f97316]/30 transition-all relative overflow-hidden">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#f97316]/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                   <div className="relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 text-[#f97316] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">handyman</span>
                    </div>
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Chi Phí Phát Sinh</p>
                    <h3 className="text-2xl lg:text-xl xl:text-2xl font-black text-[#f97316] mt-1 tracking-tight">{totalRepairCost.toLocaleString('vi-VN')} đ</h3>
                    <p className="text-[10px] text-on-surface-variant mt-2 font-medium opacity-60">{filteredIncidents.length} sự cố</p>
                   </div>
                </div>
              </div>

              {/* DANH SÁCH TỪNG PHÒNG (ACCORDION VIEW) */}
              <div className="flex flex-col gap-6">
                {reportData.length === 0 ? (
                  <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
                    <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-30">analytics</span>
                    <p className="text-on-surface-variant italic font-medium">Không tìm thấy dữ liệu phòng nào phù hợp.</p>
                  </div>
                ) : (
                  reportData.map((room, index) => (
                    <div key={room.id} className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 transition-all">
                      
                      <div 
                        onClick={() => toggleRoomAccordion(room.id)}
                        className={`px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer transition-all ${expandedRooms[room.id] ? 'bg-surface-container-low/50' : 'hover:bg-surface-container-low/30'}`}
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <span className="material-symbols-outlined text-[24px] font-bold">room_preferences</span>
                          </div>
                          <div className="min-w-0">
                              <h3 className="font-headline-md text-xl font-black text-on-surface flex items-center gap-2">
                                {index + 1}. {(() => {
                                  const isWhole = room.roomType === 'WHOLE_HOUSE' || /nhà|căn/i.test(room.roomNumber);
                                  const typeLabel = isWhole ? 'Nhà nguyên căn' : 'Phòng trọ';
                                  const rNum = room.roomNumber;
                                  const displayName = /phòng|nhà|căn/i.test(rNum) ? rNum : `${typeLabel} ${rNum}`;
                                  return room.roomCode ? `${displayName} [${room.roomCode}]` : displayName;
                                })()}
                              </h3>
                              <p className="text-xs font-bold text-on-surface-variant opacity-60 flex items-center gap-1 mt-1">
                                  <span className="material-symbols-outlined text-[16px]">location_on</span> {room.address || 'Không có địa chỉ'}
                              </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-outline-variant/30 pt-4 sm:pt-0 mt-2 sm:mt-0">
                          <div className="text-left sm:text-right">
                            <span className="block text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Đã thu kỳ này</span>
                            <span className={`text-xl font-black ${room.roomTotalRevenue > 0 ? 'text-secondary' : 'text-on-surface-variant opacity-50'}`}>
                              {room.roomTotalRevenue > 0 ? `${room.roomTotalRevenue.toLocaleString('vi-VN')} đ` : '0 đ'}
                            </span>
                          </div>
                          <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-surface-container transition-all ${expandedRooms[room.id] ? 'rotate-180 bg-primary/10 text-primary' : 'text-on-surface-variant'}`}>
                            <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
                          </div>
                        </div>
                      </div>

                      {expandedRooms[room.id] && (
                        <div className="overflow-x-auto border-t border-outline-variant/30">
                          <table className="w-full text-left border-collapse">
                            <thead className="border-b border-outline-variant bg-surface-container-low/50">
                              <tr>
                                <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Kỳ Hóa Đơn</th>
                                <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Khách Thuê</th>
                                <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center">Loại / Hạng Mục</th>
                                <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center">Trạng Thái</th>
                                <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center w-[15%]">Hành động</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* HÀNG HÓA ĐƠN THÔNG THƯỜNG */}
                              {room.bills.map((bill, bIdx) => (
                                <tr key={bill.id} className="hover:bg-surface-container-low/30 transition-colors group border-b border-outline-variant/30 last:border-0">
                                  <td className="py-4 px-8">
                                    <div className="font-bold text-on-surface text-base">Tháng {bill.month}/{bill.year}</div>
                                  </td>
                                  <td className="py-4 px-8">
                                    <div className="font-bold text-on-surface text-sm">{bill.contract?.tenantName || bill.contract?.tenant?.fullName || 'Không rõ'}</div>
                                    <div className="text-xs text-on-surface-variant font-medium mt-0.5">{bill.contract?.tenantEmail || '...'}</div>
                                    <div className="text-[11px] text-on-surface-variant font-medium opacity-70">SĐT: {bill.contract?.tenantPhone || bill.contract?.tenant?.phone || '...'}</div>
                                  </td>
                                  <td className="py-4 px-8 text-center">
                                    {bill.billType === 'UTILITY' ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-md text-[11px] font-bold uppercase tracking-wider border border-tertiary/20">
                                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                                      Tiền điện nước
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[11px] font-bold uppercase tracking-wider border border-secondary/20">
                                      <span className="material-symbols-outlined text-[14px]">home</span>
                                      Tiền phòng
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-4 px-8 text-center">
                                    {bill.status === 'PAID' ? (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container/50 text-secondary font-label-md text-[11px] font-bold uppercase tracking-wider border border-secondary/30 gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                        Đã thu tiền
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-error-container/50 text-error font-label-md text-[11px] font-bold uppercase tracking-wider border border-error/30 gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                                        Chờ thanh toán
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-4 px-8 text-center">
                                    <button 
                                      onClick={() => setViewBillDetails(bill)} 
                                      className="bg-primary/10 text-primary hover:bg-primary hover:text-white font-label-md text-[12px] px-4 py-2 rounded-xl transition-all font-bold flex items-center justify-center gap-2 mx-auto"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                                      Xem Hóa Đơn
                                    </button>
                                  </td>
                                </tr>
                              ))}

                              {/* HÀNG CHI PHÍ PHÁT SINH TỪ SỰ CỐ */}
                              {(room.incidentCosts || []).map((inc) => {
                                const incDate = new Date(inc.createdAt);
                                const incMonth = incDate.getMonth() + 1;
                                const incYear = incDate.getFullYear();
                                return (
                                  <tr key={`inc-${inc.id}`} className="bg-[#fff7ed]/50 hover:bg-[#fff7ed] transition-colors group border-b border-outline-variant/30 last:border-0">
                                    <td className="py-4 px-8">
                                      <div className="font-bold text-[#c2410c] text-base">Tháng {incMonth}/{incYear}</div>
                                    </td>
                                    <td className="py-4 px-8">
                                      <div className="font-bold text-on-surface text-sm">{inc.tenant?.fullName || 'Không rõ'}</div>
                                      <div className="text-xs text-on-surface-variant font-medium mt-0.5">{inc.tenant?.email || 'Không có email'}</div>
                                      <div className="text-[11px] text-on-surface-variant font-medium opacity-70">SĐT: {inc.tenant?.phone || '...'}</div>
                                    </td>
                                    <td className="py-4 px-8 text-center">
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffedd5] text-[#c2410c] font-label-md text-[11px] font-bold uppercase tracking-wider border border-[#fed7aa]">
                                        <span className="material-symbols-outlined text-[14px]">build</span>
                                        Chi phí phát sinh
                                      </span>
                                    </td>
                                    <td className="py-4 px-8 text-center">
                                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container/50 text-secondary font-label-md text-[11px] font-bold uppercase tracking-wider border border-secondary/30 gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                        Hoàn thành
                                      </span>
                                    </td>
                                    <td className="py-4 px-8 text-center">
                                      <button
                                        onClick={() => setViewIncidentCostDetails(inc)}
                                        className="bg-primary/10 text-primary hover:bg-primary hover:text-white font-label-md text-[12px] px-4 py-2 rounded-xl transition-all font-bold flex items-center justify-center gap-2 mx-auto"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                        Xem chi tiết
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}

                              {/* Thông báo nếu không có hóa đơn lẫn chi phí */}
                              {room.bills.length === 0 && (room.incidentCosts || []).length === 0 && (
                                <tr>
                                  <td colSpan="5" className="py-12 px-8 text-center">
                                    <p className="text-on-surface-variant italic font-medium">Phòng này chưa có phát sinh hóa đơn nào trong kỳ này.</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}




        </div>
      </div>


{/* ========================================================= */}
      {/* MODAL POPUP: XEM CHI TIẾT PHÒNG                             */}
      {/* ========================================================= */}
      {viewRoomDetails && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
          onClick={() => setViewRoomDetails(null)} /* CÁCH 1: Bấm ra vùng đen để tắt */
        >
          <div 
            style={{ background: '#fff', width: '780px', borderRadius: '12px', padding: '30px', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#333',
              maxHeight: '92vh',      // Chiều cao tối đa bằng 92% màn hình
              overflowY: 'auto',      // Tự động hiện thanh cuộn dọc nếu nội dung dài hơn 92vh
              boxSizing: 'border-box'
             }}
            onClick={(e) => e.stopPropagation()} /* Ngăn không cho click bên trong bảng bị tắt */
          >
            
            {/* CÁCH 2: NÚT ✖ Ở GÓC TRÊN CÙNG BÊN PHẢI */}
            <button 
              onClick={() => setViewRoomDetails(null)} 
              style={{ position: 'absolute', top: '15px', right: '20px', background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold', transition: '0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#ef4444'}
              onMouseLeave={(e) => e.target.style.color = '#64748b'}
              title="Đóng"
            >
              ✖
            </button>
            
            <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', textAlign: 'left' }}>
              Thông tin {viewRoomDetails.roomType === 'WHOLE_HOUSE' ? 'Căn ' : 'Phòng '}{viewRoomDetails.roomNumber}
            </h2>

{/* THIẾT KẾ MỚI: 1 ẢNH LỚN TRÁI + LƯỚI 4 ẢNH NHỎ PHẢI (CÓ CHỨC NĂNG) */}
            {viewRoomDetails.images && JSON.parse(viewRoomDetails.images).length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', height: '420px' }}>
                
                {/* 1. KHUNG ẢNH LỚN BÊN TRÁI - GẮN SỰ KIỆN CLICK ĐỂ PHÓNG TO */}
                <div style={{ flex: '2', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                  
                  {/* Ảnh chính sẽ thay đổi dựa vào currentImageIndex - GẮN onClick */}
                  <img 
                    src={`http://localhost:5000/uploads/${JSON.parse(viewRoomDetails.images)[currentImageIndex]}`} 
                    alt="Ảnh chính" 
                    onClick={() => {
                      // Thay đổi từ text nút thành click vào ảnh
                      setSelectedImage(`http://localhost:5000/uploads/${JSON.parse(viewRoomDetails.images)[currentImageIndex]}`);
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} // Thêm cursor
                  />
                  
                  {/* Nút mũi tên Trái - Chuyển về ảnh trước */}
                  <button 
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? JSON.parse(viewRoomDetails.images).length - 1 : prev - 1))}
                    style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', zIndex: 10 }} // Thêm zIndex
                  >
                    ❮
                  </button>
                  
                  {/* Nút mũi tên Phải - Chuyển sang ảnh sau */}
                  <button 
                    onClick={() => setCurrentImageIndex((prev) => (prev === JSON.parse(viewRoomDetails.images).length - 1 ? 0 : prev + 1))}
                    style={{ position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', zIndex: 10 }} // Thêm zIndex
                  >
                    ❯
                  </button>

                  {/* Nút "Xem X ảnh" - Bấm vào sẽ hiện Modal Lightbox (có thể giữ lại hoặc xóa đi tùy ý) */}
                  <div 
                    onClick={() => setSelectedImage(`http://localhost:5000/uploads/${JSON.parse(viewRoomDetails.images)[currentImageIndex]}`)}
                    style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0, 0, 0, 0.6)', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <i className="fa fa-camera"></i> Xem tất cả {JSON.parse(viewRoomDetails.images).length} ảnh
                  </div>
                </div>

                {/* (Giữ nguyên phần lưới ảnh nhỏ bên phải) */}
                <div style={{ flex: '1', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '10px' }}>
                  {JSON.parse(viewRoomDetails.images).slice(1, 5).map((imgName, index) => (
                    <div key={index} style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                       {/* Bấm vào ảnh nhỏ nào thì ảnh lớn bên trái sẽ nhảy sang ảnh đó (index + 1 vì bỏ qua ảnh 0 ban đầu) */}
                       <img 
                        src={`http://localhost:5000/uploads/${imgName}`} 
                        alt={`Ảnh ${index + 2}`} 
                        onClick={() => setCurrentImageIndex(index + 1)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} 
                      />
                    </div>
                  ))}
                </div>

              </div>
            )}
            {/* THÔNG TIN CHI TIẾT (Chia 2 cột) */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', lineHeight: '1.8', textAlign: 'left' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, color: '#475569' }}><strong>Loại hình:</strong> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{viewRoomDetails.roomType === 'WHOLE_HOUSE' ? '🏠 Nhà nguyên căn' : '🚪 Phòng trọ'}</span></p>
                <p style={{ margin: 0, color: '#475569' }}><strong>Giá thuê:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '18px' }}>{viewRoomDetails.price?.toLocaleString()} đ/tháng</span></p>
                <p style={{ margin: 0, color: '#475569' }}><strong>Diện tích:</strong> {viewRoomDetails.area || 0} m²</p>
                <p style={{ margin: 0, color: '#475569' }}><strong>Số người ở tối đa:</strong> {viewRoomDetails.maxOccupants} người</p>
                {viewRoomDetails.roomType === 'WHOLE_HOUSE' && (
                  <>
                    <p style={{ margin: 0, color: '#475569' }}><strong>Số tầng:</strong> {viewRoomDetails.numFloors || '?'}</p>
                    <p style={{ margin: 0, color: '#475569' }}><strong>Số phòng ngủ:</strong> {viewRoomDetails.numBedrooms || '?'}</p>
                    <p style={{ margin: 0, color: '#475569' }}><strong>Số nhà vệ sinh:</strong> {viewRoomDetails.numBathrooms || '?'}</p>
                  </>
                )}
                <p style={{ margin: 0, color: '#475569' }}><strong>Trạng thái:</strong> <span style={{ color: viewRoomDetails.status === 'AVAILABLE' ? '#10b981' : viewRoomDetails.status === 'RENTED' ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>{viewRoomDetails.status === 'AVAILABLE' ? 'Đang trống' : viewRoomDetails.status === 'RENTED' ? 'Đã cho thuê' : 'Đang sửa chữa'}</span></p>
                <p style={{ margin: 0, color: '#475569' }}><strong>Địa chỉ:</strong> {viewRoomDetails.houseNumber ? `${viewRoomDetails.houseNumber}, ` : ''}{viewRoomDetails.address}</p>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid #e2e8f0', paddingLeft: '20px', textAlign: 'left' }}>
                <p style={{ margin: 0, color: '#475569' }}><strong>Điện:</strong> {viewRoomDetails.roomType === 'WHOLE_HOUSE' ? <span style={{ color: '#0369a1', fontWeight: 'bold' }}>Tự trả điện lực</span> : (viewRoomDetails.electricityPrice ? `${viewRoomDetails.electricityPrice.toLocaleString()} đ/ký` : 'Theo giá nhà nước')}</p>
                <p style={{ margin: 0, color: '#475569' }}><strong>Nước:</strong> {viewRoomDetails.waterPrice ? `${viewRoomDetails.waterPrice.toLocaleString()} đ/khối` : 'Theo giá nhà nước'}</p>
                <p style={{ margin: 0, color: '#475569' }}><strong>Mạng internet:</strong> {viewRoomDetails.internetPrice ? `${viewRoomDetails.internetPrice.toLocaleString()} đ/tháng` : 'Tự túc'}</p>
                <p style={{ margin: 0, color: '#475569' }}><strong>Gửi xe:</strong> {viewRoomDetails.parkingPrice ? `${viewRoomDetails.parkingPrice.toLocaleString()} đ/tháng` : 'Miễn phí'}</p>
                <p style={{ margin: 0, color: '#475569' }}><strong>Phí dịch vụ/vệ sinh:</strong> {viewRoomDetails.servicePrice ? `${viewRoomDetails.servicePrice.toLocaleString()} đ/tháng` : 'Miễn phí'}</p>
                <p style={{ margin: 0, color: '#475569' }}><strong>Tiện ích có sẵn:</strong><br/>
                  <span style={{ color: '#0f172a' }}>
                    {viewRoomDetails.hasElevator && '✔️ Thang máy '}
                    {viewRoomDetails.hasWashingMachine && '✔️ Máy giặt '}
                    {viewRoomDetails.hasFridge && '✔️ Tủ lạnh '}
                    {viewRoomDetails.hasKitchen && '✔️ Bếp nấu '}
                    {viewRoomDetails.hasHeater && '✔️ Nóng lạnh'}
                  </span>
                </p>
              </div>
            </div>

            {/* PHẦN MÔ TẢ CHI TIẾT */}
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
              <p style={{ margin: '0 0 5px 0', color: '#0f172a' }}><strong>Mô tả chi tiết:</strong></p>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#475569', fontSize: '14px' }}>
                {viewRoomDetails.description ? viewRoomDetails.description : <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Chưa có mô tả chi tiết cho phòng này.</span>}
              </p>
            </div>

            {/* ========================================= */}
            {/* KHU VỰC ĐÁNH GIÁ TRONG MODAL CHI TIẾT     */}
            {/* ========================================= */}
            <div style={{ marginBottom: '20px', padding: '15px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left', maxHeight: '400px', overflowY: 'auto' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '16px' }}>Đánh giá từ người thuê trước ({viewRoomReviews.length})</h4>
              
              {(() => {
                const totalRev = viewRoomReviews.length;
                const avgRev = totalRev > 0 ? (viewRoomReviews.reduce((s, r) => s + r.rating, 0) / totalRev).toFixed(1) : 0;
                
                const filteredRev = viewRoomReviews.filter(r => {
                  if (activeReviewFilter === 'ALL') return true;
                  if (activeReviewFilter === 'HAS_IMAGE') {
                    return JSON.parse(r.images || '[]').length > 0 || JSON.parse(r.videos || '[]').length > 0;
                  }
                  return r.rating === parseInt(activeReviewFilter);
                });

                return (
                  <>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '15px', display: 'flex', gap: '20px', alignItems: 'center', borderRadius: '6px', marginBottom: '15px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center', minWidth: '90px' }}>
                        <div style={{ fontSize: '24px', color: '#f59e0b', fontWeight: 'bold' }}>
                          {Number(avgRev).toFixed(1)} <span style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'normal' }}>trên 5</span>
                        </div>
                        <div style={{ color: '#f59e0b', display: 'flex', justifyContent: 'center', marginTop: '5px' }}>
                           {renderStars(avgRev, 'modal-avg', 16)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {[
                          { label: 'Tất Cả', val: 'ALL' },
                          { label: '5 Sao', val: '5', count: viewRoomReviews.filter(r => r.rating===5).length },
                          { label: '4 Sao', val: '4', count: viewRoomReviews.filter(r => r.rating===4).length },
                          { label: '3 Sao', val: '3', count: viewRoomReviews.filter(r => r.rating===3).length },
                          { label: '2 Sao', val: '2', count: viewRoomReviews.filter(r => r.rating===2).length },
                          { label: '1 Sao', val: '1', count: viewRoomReviews.filter(r => r.rating===1).length },
                          { label: 'Có Hình/Video', val: 'HAS_IMAGE', count: viewRoomReviews.filter(r => JSON.parse(r.images||'[]').length>0 || JSON.parse(r.videos||'[]').length>0).length }
                        ].map(f => (
                          <button 
                            key={f.val}
                            onClick={() => setActiveReviewFilter(f.val)}
                            style={{ padding: '4px 10px', background: '#ffffff', border: activeReviewFilter === f.val ? '1px solid #f59e0b' : '1px solid #cbd5e1', color: activeReviewFilter === f.val ? '#f59e0b' : '#0f172a', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            {f.label} {f.count !== undefined && `(${f.count})`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {filteredRev.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '15px' }}>Chưa có đánh giá nào phù hợp.</div>
                      ) : (
                        filteredRev.map((review) => (
                          <div key={review.id} style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '15px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', fontSize: '16px', flexShrink: 0 }}>👤</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 'bold' }}>
                                {review.isAnonymous ? maskName(review.tenant?.fullName) : (review.tenant?.fullName || 'Khách thuê')}
                              </div>
                              <div style={{ margin: '2px 0', display: 'flex' }}>
                                {renderStars(review.rating, `m-r-${review.id}`, 12)}
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '5px' }}>Đăng ngày: {new Date(review.createdAt).toLocaleDateString('vi-VN')}</div>
                              <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.4', marginBottom: '10px', whiteSpace: 'pre-wrap' }}>{review.comment}</div>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                {JSON.parse(review.images || "[]").map((img, idx) => (
                                  <img key={`img-${idx}`} src={`http://localhost:5000/uploads/${img}`} alt="review" style={{ width: '50px', height: '50px', objectFit: 'cover', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }} onClick={() => window.open(`http://localhost:5000/uploads/${img}`)} />
                                ))}
                                {JSON.parse(review.videos || "[]").map((vid, idx) => (
                                  <video key={`vid-${idx}`} src={`http://localhost:5000/uploads/${vid}`} style={{ width: '50px', height: '50px', objectFit: 'cover', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#000' }} controls />
                                ))}
                              </div>
                              {review.landlordReply ? (
                                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #2563eb' }}>
                                  <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#2563eb', marginBottom: '3px' }}>Phản hồi của Chủ nhà:</div>
                                  <div style={{ fontSize: '13px', color: '#475569' }}>{review.landlordReply}</div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{new Date(review.replyDate).toLocaleDateString('vi-VN')}</div>
                                </div>
                              ) : (
                                user?.role === 'LANDLORD' && user?.id === viewRoomDetails.landlordId && (
                                  <div style={{ marginTop: '8px' }}>
                                    {replyingTo === review.id ? (
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Nhập phản hồi..." style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px' }} rows="2" />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                          <button onClick={() => handleReplySubmit(review.id)} style={{ padding: '6px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>Gửi</button>
                                          <button onClick={() => { setReplyingTo(null); setReplyText(''); }} style={{ padding: '6px', background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>Hủy</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button onClick={() => setReplyingTo(review.id)} style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: 0 }}>💬 Phản hồi</button>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* CÁC NÚT HÀNH ĐỘNG BÊN DƯỚI */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
              
              {/* CÁCH 3: NÚT "ĐÓNG" RÕ RÀNG Ở DƯỚI CÙNG */}
              <button onClick={() => setViewRoomDetails(null)} style={{ padding: '10px 30px', background: '#64748b', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng</button>

              {/* Nếu là chủ nhà và phòng chưa cho thuê thì hiện thêm Sửa/Xóa */}
              {user.role === 'LANDLORD' && viewRoomDetails.status !== 'RENTED' && (
                 <>
                    <button onClick={() => { setViewRoomDetails(null); handleEditRoomClick(viewRoomDetails); }} style={{ padding: '10px 20px', background: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✏️ Sửa thông tin</button>
                    <button onClick={() => { setViewRoomDetails(null); handleDeleteRoom(viewRoomDetails.id); }} style={{ padding: '10px 20px', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Xóa phòng</button>
                 </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* MODAL BÁO TRƯỚC KẾT THÚC THUÊ (TRẢ PHÒNG/LẤY LẠI PHÒNG)   */}
      {/* ========================================================= */}
      {showTerminateModal && (
        <div className="fixed inset-0 bg-on-surface/80 backdrop-blur-sm flex justify-center items-center z-[99999] p-4">
          <div className="bg-surface-container-lowest w-full max-w-[500px] rounded-3xl p-8 shadow-2xl relative flex flex-col border border-outline-variant/30">
            <button 
              onClick={() => setShowTerminateModal(false)} 
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center border-none cursor-pointer hover:bg-error/10 hover:text-error transition-colors" title="Đóng">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            
            <h3 className="m-0 text-error text-xl font-black border-b border-outline-variant/30 pb-4 mb-6 flex items-center gap-2 pr-12">
              <span className="material-symbols-outlined text-[24px]">warning</span> Thông báo {user.role === 'LANDLORD' ? 'Lấy lại phòng' : 'Trả phòng'}
            </h3>
            
            <p className="text-[14px] text-on-surface leading-relaxed mb-6 bg-error/5 p-4 rounded-xl border border-error/20">
              Theo quy định, bạn phải báo trước cho {user.role === 'LANDLORD' ? 'khách thuê' : 'chủ nhà'} ít nhất <strong className="text-error">30 ngày</strong>. 
              Hệ thống sẽ gửi thông báo và đánh dấu phòng vào trạng thái chuẩn bị kết thúc.
            </p>

            <form onSubmit={handleRequestTermination} className="flex flex-col gap-5">
              <div>
                <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">Ngày dự kiến dọn đi (Bắt buộc):</label>
                <input 
                  type="date" 
                  required 
                  min={getMinMoveOutDate()} // Ép buộc chỉ được chọn từ 30 ngày sau trở đi
                  value={terminateData.moveOutDate} 
                  onChange={e => setTerminateData({...terminateData, moveOutDate: e.target.value})} 
                  className="w-full p-3.5 border border-outline-variant/50 rounded-xl outline-none bg-surface-container-lowest text-on-surface font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                />
              </div>

              <div>
                <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">Lý do (Tùy chọn):</label>
                <textarea 
                  rows="3" 
                  placeholder={user.role === 'LANDLORD' ? "VD: Cần lấy lại phòng để sửa chữa..." : "VD: Chuyển chỗ làm..."}
                  value={terminateData.reason} 
                  onChange={e => setTerminateData({...terminateData, reason: e.target.value})} 
                  className="w-full p-4 border border-outline-variant/50 rounded-xl outline-none bg-surface-container-lowest text-on-surface font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowTerminateModal(false)} 
                  className="px-6 py-3 bg-surface-container-high text-on-surface-variant border-none rounded-xl cursor-pointer font-bold transition-all hover:bg-surface-container-highest">
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-error text-white border-none rounded-xl cursor-pointer font-bold shadow-md shadow-error/20 transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">send</span> Xác nhận gửi thông báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL THÔNG TIN NGƯỜI DÙNG & ĐỔI MẬT KHẨU                 */}
      {/* ========================================================= */}
      {showProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', width: '550px', borderRadius: '12px', padding: '30px', border: '1px solid #e2e8f0', color: '#0f172a', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            
            <button 
              onClick={() => { setShowProfileModal(false); setIsEditingProfile(false); setIsChangingPassword(false); }} 
              style={{ position: 'absolute', top: '15px', right: '20px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#ef4444'}
              onMouseLeave={(e) => e.target.style.color = '#64748b'}
            >✖</button>

            <h2 style={{ textAlign: 'center', margin: '0 0 30px 0', color: '#0f172a', fontSize: '22px' }}>
              {isChangingPassword ? 'Đổi mật khẩu' : isEditingProfile ? 'Chỉnh sửa thông tin' : 'Thông tin người dùng'}
            </h2>

            {/* NẾU ĐANG Ở CHẾ ĐỘ ĐỔI MẬT KHẨU */}
            {isChangingPassword ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '5px' }}>Mật khẩu hiện tại</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showOldPwd ? "text" : "password"} value={passwordData.oldPassword} onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})} style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', paddingRight: '40px' }} />
                    <span onClick={() => setShowOldPwd(!showOldPwd)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                      {showOldPwd ? <EyeIcon /> : <EyeOffIcon />}
                    </span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '5px' }}>Mật khẩu mới (ít nhất 6 ký tự)</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNewPwd ? "text" : "password"} value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', paddingRight: '40px' }} />
                    <span onClick={() => setShowNewPwd(!showNewPwd)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                      {showNewPwd ? <EyeIcon /> : <EyeOffIcon />}
                    </span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '5px' }}>Xác nhận mật khẩu mới</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirmPwd ? "text" : "password"} value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', paddingRight: '40px' }} />
                    <span onClick={() => setShowConfirmPwd(!showConfirmPwd)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                      {showConfirmPwd ? <EyeIcon /> : <EyeOffIcon />}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* NẾU Ở CHẾ ĐỘ XEM / SỬA PROFILE BÌNH THƯỜNG */
              <>
                <div style={{ display: 'flex', gap: '40px', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#475569', margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold' }}>Họ tên</p>
                    {isEditingProfile ? <input type="text" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.fullName}</p>}
                    <p style={{ color: '#475569', margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold' }}>Số điện thoại</p>
                    {isEditingProfile ? <input type="text" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.phone || 'Chưa cập nhật'}</p>}
                    <p style={{ color: '#475569', margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold' }}>Ngày sinh</p>
                    {isEditingProfile ? <input type="date" value={profileData.dob} onChange={e => setProfileData({...profileData, dob: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.dob || 'Chưa cập nhật'}</p>}
                    <p style={{ color: '#475569', margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold' }}>Địa chỉ</p>
                    {isEditingProfile ? <input type="text" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.address || 'Chưa cập nhật'}</p>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#475569', margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold' }}>Email (Không thể đổi)</p>
                    <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#64748b' }}>{user?.email}</p>
                    <p style={{ color: '#475569', margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold' }}>Số CMND/CCCD</p>
                    {isEditingProfile ? <input type="text" value={profileData.identityNumber} onChange={e => setProfileData({...profileData, identityNumber: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.identityNumber || 'Chưa cập nhật'}</p>}
                  </div>
                </div>
                {/* KHU VỰC NGÂN HÀNG CHỈ HIỆN CHO CHỦ NHÀ NẰM TRỌN TRONG CỘT NÀY */}
                {user?.role === 'LANDLORD' && (
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #cbd5e1' }}>
                    <p style={{ color: '#2563eb', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>💳 Thông tin nhận tiền (VietQR)</p>
                    
                    <p style={{ color: '#475569', margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold' }}>Ngân hàng</p>
                    {isEditingProfile ? (
                      <select value={profileData.bankName} onChange={e => setProfileData({...profileData, bankName: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                        <option value="MB">MBBank</option>
                        <option value="VCB">Vietcombank</option>
                        <option value="TCB">Techcombank</option>
                        <option value="ACB">ACB</option>
                        <option value="BIDV">BIDV</option>
                        <option value="VPB">VPBank</option>
                        <option value="ICB">Vietinbank</option>

                        <option value="VBA">Agribank</option>
                        <option value="STB">Sacombank</option>
                        <option value="SHB">SHB</option>
                        <option value="TPB">TPBank</option>
                        <option value="HDB">HDBank</option>
                        <option value="VIB">VIB</option>
                      </select>
                    ) : <p style={{ margin: '0 0 15px 0', fontSize: '15px' }}>{user?.bankName || 'Chưa cập nhật'}</p>}

                    <p style={{ color: '#475569', margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold' }}>Số tài khoản</p>
                    {isEditingProfile ? <input type="text" value={profileData.accountNumber} onChange={e => setProfileData({...profileData, accountNumber: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <p style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>{user?.accountNumber || 'Chưa cập nhật'}</p>}

                    <p style={{ color: '#475569', margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold' }}>Tên chủ tài khoản</p>
                    {isEditingProfile ? <input type="text" value={profileData.accountHolder} onChange={e => setProfileData({...profileData, accountHolder: e.target.value.toUpperCase()})} placeholder="VIET HOA KHONG DAU" style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px' }} /> : <p style={{ margin: '0 0 15px 0', fontSize: '15px' }}>{user?.accountHolder || 'Chưa cập nhật'}</p>}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px' }}>
              {isChangingPassword ? (
                <>
                  <button onClick={() => { setIsChangingPassword(false); setPasswordData({oldPassword: '', newPassword: '', confirmPassword: ''}); }} style={{ padding: '10px 20px', background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '800' }}>Hủy bỏ</button>
                  <button onClick={handleSavePassword} style={{ padding: '10px 20px', background: '#ff5a2c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Lưu mật khẩu</button>
                </>
              ) : !isEditingProfile ? (
                <>
                  <button onClick={() => setIsChangingPassword(true)} style={{ padding: '10px 20px', background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '800' }}>Đổi mật khẩu</button>
                  <button onClick={() => setIsEditingProfile(true)} style={{ padding: '10px 20px', background: '#0b5ed7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Chỉnh sửa thông tin</button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditingProfile(false)} style={{ padding: '10px 20px', background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '800' }}>Hủy bỏ</button>
                  <button onClick={handleSaveProfile} style={{ padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Lưu thay đổi</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

{/* ========================================================= */}
      {/* MODAL XEM CHI TIẾT HỢP ĐỒNG (BẢN ĐẦY ĐỦ)                  */}
      {/* ========================================================= */}
      {viewContract && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
          onClick={() => setViewContract(null)} // Bấm ra ngoài để đóng
        >
          <div 
            style={{ 
              background: '#fff', 
              width: '800px', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              borderRadius: '12px', 
              padding: '30px', 
              position: 'relative', 
              boxSizing: 'border-box',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Nút Đóng */}
            <button 
              onClick={() => setViewContract(null)}
              style={{ position: 'absolute', top: '15px', right: '20px', background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
            >✖</button>

            <h2 style={{ marginTop: 0, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📄 Chi tiết Hợp Đồng
              <span style={{ fontSize: '14px', background: viewContract.status === 'ACTIVE' ? '#10b981' : '#ef4444', color: '#ffffff', padding: '4px 10px', borderRadius: '20px', fontWeight: 'normal' }}>
                {viewContract.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã kết thúc'}
              </span>
            </h2>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              {/* BÊN A */}
              <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: '#0f172a', marginTop: 0 }}>1. Bên A (Chủ nhà)</h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Họ tên:</strong> {viewContract.landlordName || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>SĐT:</strong> {viewContract.landlordPhone || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>CCCD:</strong> {viewContract.landlordIdentityNumber || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Ngày sinh:</strong> {viewContract.landlordDob || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Quê quán:</strong> {viewContract.landlordHometown || 'Chưa cập nhật'}</p>
              </div>

              {/* BÊN B */}
              <div style={{ flex: 1, background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <h4 style={{ color: '#0f172a', marginTop: 0 }}>2. Bên B (Đại diện thuê)</h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Họ tên:</strong> {viewContract.tenantName || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Ngày sinh:</strong> {viewContract.tenantDob || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Email:</strong> {viewContract.tenantEmail}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>SĐT:</strong> {viewContract.tenantPhone || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>CCCD:</strong> {viewContract.tenantIdentityNumber || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Quê quán:</strong> {viewContract.tenantHometown || 'Chưa cập nhật'}</p>
              </div>
            </div>

            {/* THỜI HẠN & TẠM TRÚ */}
            {/* THỜI HẠN & TẠM TRÚ */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div style={{ flex: 1, background: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <h4 style={{ color: '#0f172a', marginTop: 0 }}>3. Thời hạn thuê</h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Bắt đầu:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{viewContract.startDate || '...'}</span></p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Kết thúc:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{viewContract.endDate || '...'}</span></p>
              </div>
              <div style={{ flex: 1, background: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <h4 style={{ color: '#0f172a', marginTop: 0 }}>4. Tình trạng Tạm trú</h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}>
                  <strong>Trạng thái: </strong> 
                  {viewContract.residenceStatus === 'REGISTERED' 
                    ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>Đã đăng ký</span> 
                    : <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Chưa đăng ký</span>}
                </p>
                {viewContract.residenceStatus === 'REGISTERED' && (
                  <>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Ngày ĐK:</strong> {viewContract.residenceDate}</p>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Nơi ĐK:</strong> {viewContract.residencePlace}</p>
                  </>
                )}
              </div>
            </div>

            {/* CHI PHÍ ĐÀM PHÁN */}
            <h4 style={{ color: '#0f172a', marginBottom: '10px' }}>5. Chi phí đàm phán (Gốc tính hóa đơn)</h4>
            
            {viewContract.isDirectUtilityPayment && (
              <div style={{ background: '#ecfdf5', color: '#065f46', padding: '10px 15px', borderRadius: '8px', border: '1px solid #6ee7b7', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✅ Khách thuê tự thanh toán trực tiếp cho bên điện lực.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#fef3c7', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '14px', color: '#475569' }}><strong>Giá phòng:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{Number(viewContract.price || 0).toLocaleString('vi-VN')} đ/tháng</span></div>
              {!viewContract.isDirectUtilityPayment ? (
                <>
                  <div style={{ fontSize: '14px', color: '#475569' }}><strong>Điện:</strong> {Number(viewContract.electricityPrice || 0).toLocaleString('vi-VN')} đ/ký</div>
                  <div style={{ fontSize: '14px', color: '#475569' }}><strong>Nước:</strong> {Number(viewContract.waterPrice || 0).toLocaleString('vi-VN')} đ/khối</div>
                </>
              ) : (
                <div style={{ gridColumn: 'span 2', fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>
                  (Điện/Nước thanh toán trực tiếp cho nhà cung cấp)
                </div>
              )}
              <div style={{ fontSize: '14px', color: '#475569' }}><strong>Internet:</strong> {Number(viewContract.internetPrice || 0).toLocaleString('vi-VN')} đ/tháng</div>
              <div style={{ fontSize: '14px', color: '#475569' }}><strong>Số điện đầu:</strong> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{viewContract.startElectricity || 0} ký</span></div>
              <div style={{ fontSize: '14px', color: '#475569' }}><strong>Số nước đầu:</strong> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{viewContract.startWater || 0} khối</span></div>
              <div style={{ fontSize: '14px', gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', color: '#475569' }}>
                <strong>Số lượng xe:</strong> 
                <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '16px' }}>{viewContract.vehicleCount} chiếc</span>
                (x {Number(viewContract.parkingPrice || 0).toLocaleString('vi-VN')} đ/xe)
                
                
                
              </div>
            
              <div style={{ fontSize: '14px', gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', color: '#475569' }}>
                <strong>Phí vệ sinh/dịch vụ chung:</strong> 
                <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '16px' }}>{Number(viewContract.servicePrice || 0).toLocaleString('vi-VN')} đ/tháng</span>
                
              
              </div>
            </div>

            {/* THÀNH VIÊN Ở GHÉP */}
            <h4 style={{ color: '#0f172a', marginBottom: '10px' }}>6. Người ở cùng ({viewContract.members ? (typeof viewContract.members === 'string' ? JSON.parse(viewContract.members).length : viewContract.members.length) : 0} người)</h4>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {viewContract.members && (typeof viewContract.members === 'string' ? JSON.parse(viewContract.members) : viewContract.members).length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '8px 0', color: '#0f172a' }}>Họ tên</th>
                      <th style={{ color: '#0f172a' }}>Ngày sinh</th>
                      <th style={{ color: '#0f172a' }}>CCCD</th>
                      <th style={{ color: '#0f172a' }}>SĐT</th>
                      <th style={{ color: '#0f172a' }}>Quê quán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(typeof viewContract.members === 'string' ? JSON.parse(viewContract.members) : viewContract.members).map((member, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#0f172a' }}>{member.fullName}</td>
                        <td style={{ color: '#475569' }}>{member.dob}</td>
                        <td style={{ color: '#475569' }}>{member.identityNumber}</td>
                        <td style={{ color: '#475569' }}>{member.phone}</td>
                        <td style={{ color: '#475569' }}>{member.hometown}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>Không có người ở cùng.</p>
              )}
            </div>
{/* PHẦN 7: ẢNH HỢP ĐỒNG (Bản "Chống đạn" ép kiểu dữ liệu an toàn) */}
            <h4 style={{ color: '#0f172a', marginBottom: '10px' }}>
              7. Ảnh chụp hợp đồng bản cứng
            </h4>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {(() => {
                // Xử lý an toàn: Ép kiểu dữ liệu về mảng Array
                let images = [];
                try {
                  if (Array.isArray(viewContract.contractImage)) {
                    images = viewContract.contractImage;
                  } else if (typeof viewContract.contractImage === 'string') {
                    images = JSON.parse(viewContract.contractImage);
                  }
                } catch (error) {
                  images = []; // Nếu lỗi parse thì cho mảng rỗng
                }

                // Hiển thị giao diện dựa trên mảng images đã xử lý
                return images && images.length > 0 ? (
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {images.map((fileName, idx) => (
                      <div key={idx} style={{ flex: '0 0 150px' }}>
                        {/* CHÚ Ý: Đảm bảo thêm /uploads/ vào đường dẫn URL nếu server của bạn lưu ảnh ở thư mục uploads */}
                        <img 
                          src={`http://localhost:5000/uploads/${fileName}`} 
                          alt={`Ảnh hợp đồng ${idx + 1}`} 
                          style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #cbd5e1', cursor: 'pointer' }}
                          onClick={() => window.open(`http://localhost:5000/uploads/${fileName}`)} 
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150x100?text=Khong+tim+thay+anh'; }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                    * Hợp đồng này chưa được đính kèm ảnh bản cứng (Hoặc ảnh bị lỗi).
                  </p>
                );
              })()}
            </div>
            {/* 8. Ảnh chụp đăng ký tạm trú */}
            <div style={{ background: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', marginTop: '20px' }}>
              <h4 style={{ color: '#0f172a', marginTop: 0, textAlign: 'center' }}>8. Ảnh đăng ký tạm trú</h4>
              <div style={{ textAlign: 'center', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                {(() => {
                  // Xử lý an toàn giống Mục 7: Ép kiểu dữ liệu về mảng Array
                  let residenceImages = [];
                  try {
                    if (Array.isArray(viewContract.residenceImage)) {
                      residenceImages = viewContract.residenceImage;
                    } else if (typeof viewContract.residenceImage === 'string') {
                      // Nếu chuỗi rỗng hoặc không hợp lệ thì bỏ qua
                      if(viewContract.residenceImage.trim() !== '') {
                        // Thử parse JSON, nếu lỗi thì coi như nó là tên file đơn lẻ
                        try {
                           residenceImages = JSON.parse(viewContract.residenceImage);
                        } catch(e) {
                           residenceImages = [viewContract.residenceImage];
                        }
                      }
                    }
                  } catch (error) {
                    residenceImages = [];
                  }

                  // Render ảnh nếu có
                  return residenceImages && residenceImages.length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', justifyContent: 'center' }}>
                      {residenceImages.map((fileName, idx) => {
                         // Xử lý tên file phòng trường hợp backend lưu kèm cả chữ uploads/ rồi
                         const cleanFileName = fileName.replace('uploads/', '').replace('uploads\\', '');
                         return (
                          <div key={idx} style={{ flex: '0 0 auto' }}>
                            <img 
                              src={`http://localhost:5000/uploads/${cleanFileName}`} 
                              alt={`Ảnh đăng ký tạm trú ${idx + 1}`} 
                              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                              onClick={() => window.open(`http://localhost:5000/uploads/${cleanFileName}`)}
                              onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300x200?text=Khong+tim+thay+anh'; }}
                            />
                          </div>
                         )
                      })}
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontStyle: 'italic', margin: '20px 0' }}>Không có ảnh đăng ký tạm trú đính kèm.</p>
                  );
                })()}
              </div>
            </div>

            {/* 9. Tình trạng phòng bàn giao */}
            <h4 style={{ color: '#0f172a', marginBottom: '10px' }}>9. Tình trạng phòng bàn giao</h4>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', whiteSpace: 'pre-wrap', color: '#475569' }}>
                <strong style={{ color: '#0f172a'}}>Mô tả chi tiết:</strong> {viewContract.conditionDescription || <span style={{ color: '#64748b', fontStyle: 'italic' }}>Không có mô tả.</span>}
              </p>
              
              {/* Ảnh tình trạng phòng */}
              <div style={{ marginBottom: '15px', color: '#475569' }}>
                <strong style={{ color: '#0f172a'}}>Ảnh đính kèm:</strong>
                {(() => {
                  let cImages = [];
                  try {
                    if (Array.isArray(viewContract.conditionImages)) cImages = viewContract.conditionImages;
                    else if (typeof viewContract.conditionImages === 'string') {
                      cImages = JSON.parse(viewContract.conditionImages);
                    }
                  } catch(e) {}
                  
                  return cImages && cImages.length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginTop: '10px' }}>
                      {cImages.map((fileName, idx) => {
                        const cleanName = fileName.replace('uploads/', '').replace('uploads\\', '');
                        return (
                          <img key={idx} src={`http://localhost:5000/uploads/${cleanName}`} alt="Ảnh bàn giao" 
                               style={{ height: '100px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e1' }} 
                               onClick={() => window.open(`http://localhost:5000/uploads/${cleanName}`)} />
                        )
                      })}
                    </div>
                  ) : <span style={{ marginLeft: '10px', color: '#64748b', fontStyle: 'italic', fontSize: '13px' }}>Không có ảnh</span>
                })()}
              </div>

              {/* Video tình trạng phòng */}
              <div style={{ color: '#475569' }}>
                <strong style={{ color: '#0f172a'}}>Video đính kèm:</strong>
                {(() => {
                  let cVideos = [];
                  try {
                    if (Array.isArray(viewContract.conditionVideos)) cVideos = viewContract.conditionVideos;
                    else if (typeof viewContract.conditionVideos === 'string') {
                      cVideos = JSON.parse(viewContract.conditionVideos);
                    }
                  } catch(e) {}

                  return cVideos && cVideos.length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginTop: '10px' }}>
                      {cVideos.map((fileName, idx) => {
                        const cleanName = fileName.replace('uploads/', '').replace('uploads\\', '');
                        return (
                          <video key={idx} src={`http://localhost:5000/uploads/${cleanName}`} controls
                                 style={{ height: '150px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        )
                      })}
                    </div>
                  ) : <span style={{ marginLeft: '10px', color: '#64748b', fontStyle: 'italic', fontSize: '13px' }}>Không có video</span>
                })()}
              </div>
            </div>
            {/* Nút Đóng */}
            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button onClick={() => setViewContract(null)} style={{ padding: '10px 25px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      



      {/* ======================================================= */}
      {/* MODAL: XEM CHI TIẾT CHI PHÍ PHÁT SINH                   */}
      {/* ======================================================= */}
      {viewIncidentCostDetails && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
          onClick={() => setViewIncidentCostDetails(null)}
        >
          <div
            style={{ background: '#ffffff', width: '480px', borderRadius: '12px', padding: '28px', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', color: '#0f172a' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setViewIncidentCostDetails(null)} style={{ position: 'absolute', top: 14, right: 18, background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✖</button>

            <h3 style={{ margin: '0 0 18px 0', color: '#f59e0b', borderBottom: '2px solid #fef3c7', paddingBottom: '10px' }}>
              🔧 Chi Tiết Chi Phí Phát Sinh
            </h3>

            {/* Thông tin sự cố */}
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Sự cố</span>
                <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '3px', color: '#0f172a' }}>{viewIncidentCostDetails.title}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Phòng</span>
                <div style={{ marginTop: '3px', color: '#0f172a' }}>{viewIncidentCostDetails.room?.roomNumber} {viewIncidentCostDetails.room?.roomCode ? `(${viewIncidentCostDetails.room.roomCode})` : ''}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Khách thuê báo cáo</span>
                <div style={{ marginTop: '3px', color: '#0f172a' }}>{viewIncidentCostDetails.tenant?.fullName || 'Không rõ'}</div>
                <div style={{ color: '#475569', fontSize: '12px' }}>SĐT: {viewIncidentCostDetails.tenant?.phone || '...'}</div>
              </div>
              <div>
                <span style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Ngày sự cố</span>
                <div style={{ marginTop: '3px', color: '#0f172a' }}>{new Date(viewIncidentCostDetails.createdAt).toLocaleDateString('vi-VN')}</div>
              </div>
            </div>

            {/* Chi phí */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Chi phí phát sinh</span>
                <div style={{ color: '#d97706', fontWeight: 'bold', fontSize: '24px', marginTop: '4px' }}>
                  {Number(viewIncidentCostDetails.repairCost).toLocaleString('vi-VN')} đ
                </div>
              </div>
              {viewIncidentCostDetails.repairDescription && (
                <div>
                  <span style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Nội dung sửa chữa</span>
                  <div style={{ marginTop: '5px', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#334155' }}>
                    {viewIncidentCostDetails.repairDescription}
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setViewIncidentCostDetails(null)} style={{ padding: '10px 24px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
          {/* MODAL POPUP: XEM CHI TIẾT HÓA ĐƠN (BẢN ĐẦY ĐỦ)           */}
          {/* ========================================================= */}
          {viewBillDetails && (() => {
            const bill = viewBillDetails;
            const contract = bill.contract;
            
            // Tính toán lại các dòng chi tiết dựa trên giá trong hợp đồng để hiển thị
            const elecUsage = bill.electricityUsage || 0;
            const waterUsage = bill.waterUsage || 0;
            // Ưu tiên lấy trực tiếp số xe từ hợp đồng hiện tại
            const vehicleCount = bill.vehicleCount || contract?.vehicleCount || 0;

            const elecPrice = contract?.electricityPrice || 0;
            const waterPrice = contract?.waterPrice || 0;
            const parkingPrice = contract?.parkingPrice || 0;
            
            const elecAmount = elecUsage * elecPrice;
            const waterAmount = waterUsage * waterPrice;
            const parkingAmount = vehicleCount * parkingPrice;
            const internetAmount = contract?.internetPrice || 0;
            const serviceAmount = contract?.servicePrice || 0;
            const roomAmount = contract?.price || 0;

            // Tính tổng cộng dựa trên các dòng chi tiết
// 1. TÍNH LẠI TỔNG DỰA TRÊN LOẠI HÓA ĐƠN
            let calculatedTotal = 0;
            if (bill.billType === 'ROOM') {
              calculatedTotal = roomAmount + parkingAmount + internetAmount + serviceAmount;
            } else if (bill.billType === 'UTILITY') {
              calculatedTotal = elecAmount + waterAmount;
            } else {
              // Dành cho các hóa đơn cũ chưa phân loại (nếu có)
              calculatedTotal = roomAmount + elecAmount + waterAmount + parkingAmount + internetAmount + serviceAmount;
            }

            return (
              <div 
                style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
                onClick={() => setViewBillDetails(null)} // Bấm ra ngoài vùng đen để tắt
              >
                <div 
                  style={{ background: '#fff', width: '650px', borderRadius: '12px', padding: '30px', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#333', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}
                  onClick={(e) => e.stopPropagation()} // Ngăn không cho click bên trong bảng bị tắt
                >
                  
                  {/* Nút tắt ✖ Ở GÓC TRÊN CÙNG BÊN PHẢI */}
                  <button 
                    onClick={() => setViewBillDetails(null)} 
                    style={{ position: 'absolute', top: '15px', right: '20px', background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}
                    title="Đóng"
                  >
                    ✖
                  </button>
                  
                  <h2 style={{ margin: '0 0 25px 0', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>🧾 Chi tiết Hóa Đơn</span>
                    <span style={{ fontSize: '14px', background: bill.status === 'PAID' ? '#10b981' : '#ef4444', color: '#ffffff', padding: '4px 10px', borderRadius: '20px', fontWeight: 'normal' }}>
                      {bill.status === 'PAID' ? 'Đã thu tiền' : 'Chờ thanh toán'}
                    </span>
                  </h2>

                  {/* THÔNG TIN KỲ HÓA ĐƠN & PHÒNG & KHÁCH */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '15px', marginBottom: '25px' }}>
                      
                      {/* Thẻ hiển thị Phòng (Dùng Snapshot) */}
                      <div style={{ background: '#fef3c7', padding: '15px', borderRadius: '8px', border: '1px solid #fde68a', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold', color: '#d97706' }}>Tháng {bill.month}/{bill.year}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#0f172a' }}>
                            <strong>Phòng:</strong> {bill.roomNumberSnapshot || (contract?.room ? `P.${contract.room.roomNumber}` : 'Phòng đã bị xóa')}
                          </p>
                          <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>
                            📍 Địa chỉ: {contract?.room?.address || 'Chưa cập nhật địa chỉ'}
                          </p>
                      </div>

                      {/* Thẻ hiển thị thông tin Khách Thuê (Dùng Snapshot) */}
                      <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>Khách thuê (Người đại diện):</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#475569' }}>
                            👤 {bill.tenantNameSnapshot || contract?.tenantName || contract?.tenant?.fullName || 'Khách thuê cũ'}
                          </p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#475569' }}>✉️ {contract?.tenantEmail || 'Không có email'}</p>
                          <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>📞 {contract?.tenantPhone || contract?.tenant?.phone || 'Chưa cập nhật'}</p>
                      </div>
                  </div>

                  {/* BẢNG TÍNH CHI TIẾT ĐÃ ĐƯỢC CHIA TÁCH THÔNG MINH */}
                  <div style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
                    <p style={{ margin: '0 0 18px 0', fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>
                      Bảng tính chi tiết ({bill.billType === 'ROOM' ? 'Hóa đơn tiền nhà & Dịch vụ' : (bill.billType === 'UTILITY' ? 'Hóa đơn Điện Nước' : 'Hóa đơn tổng hợp')}):
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '14px', color: '#475569' }}>

                      {/* KHỐI 1: CHỈ HIỂN THỊ KHI LÀ HÓA ĐƠN TIỀN NHÀ (ROOM) HOẶC HÓA ĐƠN CŨ CHƯA PHÂN LOẠI */}
                      {(bill.billType === 'ROOM' || !bill.billType) && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}><span>Tiền phòng cố định:</span> <strong style={{ color: '#0f172a' }}>{roomAmount.toLocaleString('vi-VN')} đ</strong></div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                            <span>Tiền gửi xe ({vehicleCount} xe x {parkingPrice.toLocaleString()}đ):</span> 
                            <strong style={{ color: '#0f172a' }}>{parkingAmount.toLocaleString('vi-VN')} đ</strong>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}><span>Mạng Internet:</span> <strong style={{ color: '#0f172a' }}>{internetAmount.toLocaleString('vi-VN')} đ</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: (bill.billType !== 'ROOM' && !bill.billType) ? '1px dashed #e2e8f0' : 'none', paddingBottom: '6px' }}><span>Phí dịch vụ chung:</span> <strong style={{ color: '#0f172a' }}>{serviceAmount.toLocaleString('vi-VN')} đ</strong></div>
                        </>
                      )}

                      {/* KHỐI 2: CHỈ HIỂN THỊ KHI LÀ HÓA ĐƠN ĐIỆN NƯỚC (UTILITY) */}
                      {(bill.billType === 'UTILITY' || !bill.billType) && (
                        <>
                          {/* DÒNG ĐIỆN */}
                          <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>Tiền điện ({elecUsage} ký x {elecPrice.toLocaleString()}đ):</span> 
                              <strong style={{ color: '#0f172a' }}>{elecAmount.toLocaleString('vi-VN')} đ</strong>
                            </div>
                            {/* Hiển thị số đầu - số cuối */}
                            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                              (Chỉ số đồng hồ: {bill.oldElectricity ?? '?'} ➡️ {bill.newElectricity ?? '?'})
                            </div>
                          </div>
                          
                          {/* DÒNG NƯỚC */}
                          <div style={{ display: 'flex', flexDirection: 'column', borderBottom: 'none', paddingBottom: '0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>Tiền nước ({waterUsage} khối x {waterPrice.toLocaleString()}đ):</span> 
                              <strong style={{ color: '#0f172a' }}>{waterAmount.toLocaleString('vi-VN')} đ</strong>
                            </div>
                            {/* Hiển thị số đầu - số cuối */}
                            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                              (Chỉ số đồng hồ: {bill.oldWater ?? '?'} ➡️ {bill.newWater ?? '?'})
                            </div>
                          </div>
                        </>
                      )}

                    </div>
                    
                    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                        {bill.billType === 'ROOM' ? 'TỔNG TIỀN NHÀ:' : (bill.billType === 'UTILITY' ? 'TỔNG ĐIỆN NƯỚC:' : 'TỔNG CỘNG:')}
                      </span>
                      <span style={{ fontSize: '26px', fontWeight: 'bold', color: '#ef4444' }}>{calculatedTotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>

                  {/* CÁC NÚT HÀNH ĐỘNG BÊN DƯỚI */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                    <button onClick={() => setViewBillDetails(null)} style={{ padding: '10px 35px', background: '#64748b', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng</button>
                    {/* Thêm nút đánh dấu đã thanh toán nếu cần */}
                    {bill.status === 'UNPAID' && user.role === 'LANDLORD' && (
                        <button onClick={() => handlePayBill(bill.id).then(() => setViewBillDetails(null))} style={{ padding: '10px 25px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✅ Xác nhận đã thu tiền</button>
                    )}
                  </div>
                  
                  {/* ========================================================= */}
                  {/* GIAO DIỆN KHÁCH THUÊ: QUÉT QR VÀ UPLOAD ẢNH MINH CHỨNG      */}
                  {/* ========================================================= */}
                  {user.role === 'TENANT' && bill.status === 'UNPAID' && (
                    <div style={{ textAlign: 'center', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '2px dashed #0ea5e9', marginBottom: '25px', marginTop: '25px' }}>
                      <h4 style={{ margin: '0 0 15px 0', color: '#0ea5e9', fontSize: '18px' }}>Mã QR Thanh Toán Tự Động</h4>
                      
                      {/* Tạo ảnh VietQR động */}
                      {/* Lấy thông tin chủ nhà từ hợp đồng. Nếu chủ nhà chưa cài đặt, dùng STK mặc định để chống lỗi */}
                      {(() => {
                        const bankName = contract?.room?.landlord?.bankName || 'MB';
                        const accNum = contract?.room?.landlord?.accountNumber || 'CHUA_CO_STK';
                        const accName = contract?.room?.landlord?.accountHolder || 'CHU NHA';
                        
                        // Xóa bỏ khoảng trắng trong nội dung chuyển khoản để QR quét mượt hơn
                        const addInfo = `THANHTOAN PHONG ${contract?.room?.roomNumber}`.replace(/ /g, '%20');

                        return (
                          <img 
                            src={`https://img.vietqr.io/image/${bankName}-${accNum}-compact.png?amount=${calculatedTotal}&addInfo=${addInfo}&accountName=${accName}`} 
                            alt="VietQR" 
                            style={{ width: '250px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                          />
                        );
                      })()}
                      <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                        * Hãy dùng App Ngân hàng hoặc MoMo/ZaloPay để quét mã.<br/>
                        
                      </p>

                      <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '15px', textAlign: 'left' }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Tải lên ảnh chụp màn hình chuyển khoản (Tối đa 3 ảnh):</h5>
                        <input 
                          type="file" multiple accept="image/*"
                          onChange={(e) => {
                            if (e.target.files.length > 3) {
                              alert("Chỉ được chọn tối đa 3 ảnh!"); e.target.value = null;
                            } else { setProofFiles(e.target.files); }
                          }}
                          style={{ marginBottom: '10px', width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', color: '#0f172a' }}
                        />
                        <button 
                          onClick={() => handleUploadProof(bill.id)} 
                          style={{ width: '100%', padding: '12px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
                        >
                          📤 Gửi Ảnh Minh Chứng Ngay
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Thông báo cho khách nếu đã gửi ảnh xong */}
                  {user.role === 'TENANT' && bill.status === 'PENDING_CONFIRM' && (
                    <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', marginBottom: '25px', textAlign: 'center', color: '#155724', border: '1px solid #c3e6cb' }}>
                        <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '16px' }}>✅ Đã nộp ảnh minh chứng!</p>
                        <p style={{ fontSize: '14px', margin: 0 }}>Hệ thống đang chờ Chủ nhà kiểm tra tài khoản và xác nhận.</p>
                    </div>
                  )}


                  {/* ========================================================= */}
                  {/* GIAO DIỆN CHỦ NHÀ: XEM ẢNH KHÁCH GỬI VÀ BẤM XÁC NHẬN        */}
                  {/* ========================================================= */}
                  {user.role === 'LANDLORD' && bill.status === 'PENDING_CONFIRM' && (
                    <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #fde68a' }}>
                      <p style={{ color: '#d97706', fontWeight: 'bold', margin: '0 0 15px 0', fontSize: '16px' }}>
                        ⚠️ Khách thuê báo đã chuyển khoản. Hãy kiểm tra ảnh minh chứng bên dưới!
                      </p>
                      
                      {/* Lưới hiển thị ảnh minh chứng */}
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
                        {(() => {
                          let images = [];
                          try { images = JSON.parse(bill.proofImages || "[]"); } catch(e) {}
                          
                          return images.map((img, idx) => {
                            // 🚨 THUẬT TOÁN "HỦY DIỆT": Bất chấp DB lưu là gì (/uploads/anh.jpg hay anh.jpg), 
                            // dòng này sẽ chém hết đường dẫn cũ, chỉ lấy đúng cái TÊN FILE cuối cùng.
                            const fileName = img.replace(/^.*[\\\/]/, ''); 
                            
                            // Sau đó ghép chuẩn xác với địa chỉ Backend
                            const imgSrc = `http://localhost:5000/uploads/${fileName}`;

                            return (
                              <img 
                                key={idx} 
                                src={imgSrc} 
                                alt={`Minh chứng ${idx}`}
                                style={{ width: '120px', height: '180px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} 
                                onClick={() => window.open(imgSrc)}
                                // 🚨 Xóa link mạng đi. Nếu ảnh bị lỗi (do bạn xóa nhầm file), nó sẽ ẩn luôn cái khung rách đi cho đẹp.
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )
                          });
                        })()}
                      </div>

                      <button 
                        // Tái sử dụng luôn hàm handlePayBill cũ để đổi trạng thái thành PAID
                        onClick={() => handlePayBill(bill.id).then(() => setViewBillDetails(null))}
                        style={{ width: '100%', background: '#10b981', color: '#ffffff', border: 'none', padding: '15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ✅ XÁC NHẬN ĐÃ NHẬN ĐỦ TIỀN
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

      {/* MODAL GHI CHÚ NHẬT CỌC / GIỮ CHỖ (Redesigned) */}
      {depositModal.show && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-[600px] bg-surface-container-lowest rounded-[2.5rem] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-outline-variant/30 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 space-y-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-4xl">lock_person</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-on-surface tracking-tight">Ghi chú Nhận cọc / Giữ chỗ</h3>
                <p className="text-sm text-on-surface-variant font-bold opacity-60">Phòng sẽ tự động ẩn khỏi danh sách hiển thị</p>
              </div>
            </div>

            <div className="p-5 bg-surface-container-low rounded-2xl border-l-4 border-primary/50 text-xs font-bold text-on-surface-variant leading-relaxed opacity-80">
              <span className="material-symbols-outlined text-[16px] inline-block align-middle mr-1 text-primary">info</span>
              Lưu ý: Khách cũ vẫn có thể sinh hoạt bình thường. Phòng chỉ bị ẩn đối với khách mới tìm kiếm trên trang chủ.
            </div>

            <form onSubmit={handleSaveDeposit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-50">Nội dung ghi chú *</label>
                <textarea 
                  rows="5" 
                  autoFocus
                  placeholder="Ví dụ: Anh Hưng số 098... cọc 2 triệu, hẹn mùng 5/6 chuyển vào..."
                  value={depositModal.note}
                  onChange={e => setDepositModal({...depositModal, note: e.target.value})}
                  className="w-full p-6 bg-white border-2 border-outline-variant rounded-3xl text-sm font-bold text-on-surface focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={handleDeleteDeposit} 
                  className="w-full sm:w-auto px-6 py-3.5 bg-error/10 text-error rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-error hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">no_accounts</span>
                  Xóa cọc (Mở lại phòng)
                </button>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    type="button" 
                    onClick={() => setDepositModal({ show: false, roomId: null, note: '' })} 
                    className="flex-1 sm:flex-none px-8 py-3.5 bg-surface-container-high text-on-surface-variant rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-surface-container-highest transition-all active:scale-95"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 sm:flex-none px-10 py-3.5 bg-primary text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/30 hover:scale-105 transition-all active:scale-95"
                  >
                    Lưu ghi chú 💾
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
{/* ========================================================= */}
      {/* MODAL PHÓNG TO ẢNH (LIGHTBOX) - ĐÃ CÓ CHỨC NĂNG CHUYỂN ẢNH */}
      {/* ========================================================= */}
      {selectedImage && viewRoomDetails && ( // Cần thêm check viewRoomDetails để lấy list ảnh
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000, overflow: 'hidden' }}
          onClick={() => setSelectedImage(null)} // Bấm ra ngoài vùng đen để đóng
        >
          {/* Nút tắt */}
          <button 
            onClick={() => setSelectedImage(null)}
            style={{ position: 'absolute', top: '20px', right: '30px', background: 'transparent', border: 'none', color: '#fff', fontSize: '35px', cursor: 'pointer', fontWeight: 'bold' }}
            title="Đóng (Esc)"
          >
            ✖
          </button>
          
          {/* Nút mũi tên Trái - Chuyển về ảnh trước TRONG LIGHTBOX */}
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Ngăn click ra ngoài làm tắt lightbox
              setCurrentImageIndex((prev) => (prev === 0 ? JSON.parse(viewRoomDetails.images).length - 1 : prev - 1));
            }}
            style={{ position: 'fixed', top: '50%', left: '30px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '50%', width: '60px', height: '60px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', zIndex: 100001, transition: '0.2s' }}
          >
            ❮
          </button>
          
          {/* Nút mũi tên Phải - Chuyển sang ảnh sau TRONG LIGHTBOX */}
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Ngăn click ra ngoài làm tắt lightbox
              setCurrentImageIndex((prev) => (prev === JSON.parse(viewRoomDetails.images).length - 1 ? 0 : prev + 1));
            }}
            style={{ position: 'fixed', top: '50%', right: '30px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '50%', width: '60px', height: '60px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', zIndex: 100001, transition: '0.2s' }}
          >
            ❯
          </button>
          
          {/* Bộ đếm ảnh ví dụ: "2 / 5" */}
          <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', color: 'white', fontSize: '14px', zIndex: 100002 }}>
             {currentImageIndex + 1} / {JSON.parse(viewRoomDetails.images).length} ảnh
          </div>

          {/* Ảnh được phóng to (Dùng ảnh đang được hiển thị theo currentImageIndex) */}
          <img 
            src={`http://localhost:5000/uploads/${JSON.parse(viewRoomDetails.images)[currentImageIndex]}`} 
            alt="Phóng to" 
            style={{ 
              maxWidth: '90%',      // Chỉnh nhỏ lại một chút để chừa chỗ cho mũi tên
              maxHeight: '90%', 
              objectFit: 'contain', 
              borderRadius: '8px', 
              boxShadow: '0 5px 35px rgba(0,0,0,0.7)', 
              cursor: 'zoom-out' // Chuột khi di vào ảnh để tắt
            }} 
            onClick={(e) => e.stopPropagation()} // Ngăn không cho click vào ảnh bị tắt
          />
        </div>

      )}


      {/* ========================================================= */}
      {/* MODAL KHÁCH THUÊ ĐÁNH GIÁ PHÒNG (SHOPEE STYLE)              */}
      {/* ========================================================= */}
      {showReviewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', width: '500px', borderRadius: '12px', padding: '25px', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setShowReviewModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✖</button>
            
            <h3 style={{ color: '#ef4444', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {reviewData.comment ? '👁️ Xem & Cập nhật đánh giá' : '⭐ Đánh giá trải nghiệm thuê phòng'}
            </h3>

            <form onSubmit={handleSubmitReview}>
              
              {/* 🚨 HIỂN THỊ PHẢN HỒI CỦA CHỦ NHÀ NẾU CÓ 🚨 */}
              {reviewData.landlordReply && (
                <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #3b82f6', marginBottom: '20px', textAlign: 'left' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold', color: '#1e40af' }}>💬 Phản hồi từ Chủ nhà:</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#0f172a', lineHeight: '1.5' }}>{reviewData.landlordReply}</p>
                </div>
              )}

              {/* Chọn Sao */}
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#475569' }}>Chất lượng phòng & Chủ nhà</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '35px', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star} 
                      onClick={() => setReviewData({...reviewData, rating: star})}
                      style={{ color: star <= reviewData.rating ? '#f59e0b' : '#e2e8f0', transition: '0.2s' }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '5px', fontWeight: 'bold' }}>
                  {reviewData.rating === 5 ? 'Tuyệt vời' : reviewData.rating === 4 ? 'Rất tốt' : reviewData.rating === 3 ? 'Bình thường' : reviewData.rating === 2 ? 'Tệ' : 'Rất tệ'}
                </div>
              </div>

              {/* Nhận xét */}
              <div style={{ marginBottom: '15px' }}>
                <textarea 
                  rows="4" 
                  required
                  placeholder="Chia sẻ trải nghiệm của bạn về phòng ốc, an ninh, chủ nhà... Những đánh giá chân thực của bạn sẽ giúp ích rất nhiều cho người thuê sau!"
                  value={reviewData.comment} 
                  onChange={e => setReviewData({...reviewData, comment: e.target.value})} 
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', boxSizing: 'border-box', backgroundColor: '#f8fafc', fontSize: '14px', fontFamily: 'inherit' }}
                />
              </div>

              {/* Upload Ảnh/Video */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#475569' }}>
                  {reviewData.comment ? 'Tải lên ảnh/video mới (Sẽ ghi đè ảnh cũ):' : 'Thêm Hình ảnh / Video minh chứng:'}
                </label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*"
                  onChange={(e) => setReviewFiles(Array.from(e.target.files))}
                  style={{ width: '100%', padding: '8px', border: '1px dashed #ef4444', borderRadius: '6px', background: '#fef2f2', boxSizing: 'border-box', color: '#ef4444' }}
                />
              </div>

              {/* Ẩn danh */}
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <input 
                  type="checkbox" 
                  id="isAnon"
                  checked={reviewData.isAnonymous} 
                  onChange={e => setReviewData({...reviewData, isAnonymous: e.target.checked})} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isAnon" style={{ fontSize: '13px', cursor: 'pointer', color: '#475569', flex: 1 }}>
                  Hiển thị ẩn danh (Tên của bạn trên Trang chủ sẽ hiện là <strong style={{ color: '#0f172a' }}>{user?.fullName?.charAt(0) || 'K'}******</strong>)
                </label>
              </div>

              {/* Nút gửi tự động đổi text */}
              <button type="submit" style={{ width: '100%', padding: '12px', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase' }}>
                {reviewData.comment ? 'CẬP NHẬT ĐÁNH GIÁ' : 'GỬI ĐÁNH GIÁ'}
              </button>
            </form>
          </div>
        </div>
      
      )}

      {/* MODAL HIỂN THỊ NỘI QUY HỆ THỐNG */}
      {showRuleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(5px)' }}>
          <div style={{ background: '#ffffff', width: '90%', maxWidth: '700px', maxHeight: '85vh', borderRadius: '15px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', position: 'relative', display: 'flex', flexDirection: 'column', animation: 'fadeInScale 0.3s ease-out' }}>
            <button 
              onClick={() => setShowRuleModal(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: '#f8fafc', border: 'none', width: '35px', height: '35px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.3s' }}
              onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
              onMouseLeave={(e) => e.target.style.background = '#f8fafc'}>✖</button>
            
            <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '24px', borderBottom: '2px solid #2563eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📜 Nội quy hệ thống & Quy định phòng trọ
            </h2>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', marginTop: '10px' }}>
              {systemRules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
                  Hiện chưa có nội quy cụ thể nào được thiết lập.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {systemRules.map((rule, idx) => (
                    <div key={idx} style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ 
                        display: 'inline-block', padding: '4px 12px', background: '#2563eb', color: '#ffffff', 
                        borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase'
                      }}>
                        Cập nhật: {new Date(rule.updatedAt).toLocaleDateString('vi-VN')}
                      </div>
                      <div style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                        {rule.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '25px', textAlign: 'center' }}>
              <button 
                onClick={() => setShowRuleModal(false)}
                style={{ padding: '12px 30px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.3s' }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Đã hiểu và chấp hành
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeInScale {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}

      {/* NÚT HỖ TRỢ ZALO GÓC TRÁI DƯỚI */}
      <a 
        href="https://zalo.me/0337377034" // 🚨 Thay bằng số điện thoại Zalo của Admin
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          backgroundColor: '#ffffff',
          padding: '12px 18px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textDecoration: 'none',
          color: '#0f172a',
          zIndex: 9999, // Đảm bảo luôn nổi lên trên cùng
          border: '1px solid #e2e8f0',
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {/* Icon tai nghe (Bạn có thể thay bằng thẻ <img> chứa logo Zalo nếu muốn) */}
        <div style={{ fontSize: '28px' }}>🎧</div>
  
        {/* Thông tin chữ */}
        <div>
          <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#64748b' }}>
            Nhân viên hỗ trợ của bạn:
          </p>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>
            Admin - 0337377034
          </p>
        </div>
      </a>
    </div>

  );
};

export default Dashboard;
