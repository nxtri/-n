import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import roomApi from '../api/roomApi';
import axios from 'axios';
import contractApi from '../api/contractApi';
import billApi from '../api/billApi';
import axiosClient from '../api/axiosClient';
import notificationApi from '../api/notificationApi';
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
  const [bills, setBills] = useState([]);

  const [viewContract, setViewContract] = useState(null);
  
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState({ code: '', name: '' });
  const [selectedDistrict, setSelectedDistrict] = useState({ code: '', name: '' });
  const [selectedWard, setSelectedWard] = useState({ code: '', name: '' });
  
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [newRoom, setNewRoom] = useState({ 
    roomNumber: '', houseNumber: '', price: '', description: '', area: '', address: '',
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
    conditionDescription: ''
  });
  const [billContract, setBillContract] = useState(null);
  const [billData, setBillData] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), electricityUsage: '', waterUsage: '', vehicleCount: '' });

  // --- HÀM TẢI DỮ LIỆU ---
  const fetchRooms = async () => { try { const res = await roomApi.getAllRooms(); setRooms(res.rooms); } catch (e) {} };
  const fetchContracts = async () => { try { const res = await contractApi.getAllContracts(); setContracts(res.contracts || []); } catch (e) { setContracts([]); } };
  const fetchBills = async () => { try { const res = await billApi.getAllBills(); setBills(res.bills || []); } catch (e) { setBills([]); } };
  const fetchProvinces = async () => { try { const res = await axios.get('https://provinces.open-api.vn/api/v2/p/'); setProvinces(res.data); } catch (e) {} };

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
    fetchRooms(); fetchProvinces(); fetchContracts(); fetchBills(); fetchNotifications(); fetchMyReviews();
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
      const response = await axiosClient.put('/auth/profile', profileData);
      localStorage.setItem('user', JSON.stringify(response.user));
      alert('Cập nhật thông tin thành công!');
      setIsEditingProfile(false); window.location.reload(); 
    } catch (error) { alert('Lỗi khi cập nhật thông tin!'); }
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) return alert('Mật khẩu mới không khớp nhau!');
    if (passwordData.newPassword.length < 6) return alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
    try {
      await axiosClient.put('/auth/change-password', { oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword });
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
      setNewRoom({ roomNumber: '', houseNumber: '', price: '', description: '', area: '', address: '', maxOccupants: 1, electricityPrice: '', waterPrice: '', internetPrice: '', parkingPrice: '', servicePrice: '', hasElevator: false, hasWashingMachine: false, hasFridge: false, hasKitchen: false, hasHeater: false });
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
      formData.append('electricityPrice', contractData.electricityPrice);
      formData.append('waterPrice', contractData.waterPrice);
      formData.append('internetPrice', contractData.internetPrice);
      formData.append('parkingPrice', contractData.parkingPrice);
      formData.append('servicePrice', contractData.servicePrice);
      
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
  if (activeTab === 'AVAILABLE') displayedRooms = rooms.filter(r => r.status === 'AVAILABLE');
  if (activeTab === 'RENTED') displayedRooms = rooms.filter(r => r.status === 'RENTED');
  if (activeTab === 'MAINTENANCE') displayedRooms = rooms.filter(r => r.status === 'MAINTENANCE');
  // 🚨 THÊM DÒNG NÀY: Lọc ra những phòng đang cho thuê NHƯNG CÓ ngày báo chuyển đi
  if (activeTab === 'UPCOMING') displayedRooms = rooms.filter(r => r.status === 'RENTED' && contracts.some(c => c.roomId === r.id && c.status === 'ACTIVE' && c.intendedMoveOutDate));
  // 🚨 THÊM LOGIC TAB "ĐÃ CỌC": Lấy những phòng có ghi chú cọc
  if (activeTab === 'DEPOSITED') displayedRooms = rooms.filter(r => r.depositNote && r.depositNote.trim() !== '');

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f7fa' }}>
      
      {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG */}
      <div style={{ background: '#0b5ed7', color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', zIndex: 10 }}>
        <h2 style={{ margin: 0, cursor: 'pointer' }} onClick={() => navigate('/')}>PHONGTROSIEUCAP</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* KHU VỰC CHUÔNG THÔNG BÁO */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', position: 'relative' }}
              title="Thông báo"
            >
              🔔
              {/* Hiển thị số chấm đỏ nếu có thông báo chưa đọc */}
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 5px', borderRadius: '50%' }}>
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
            {/* Popup Danh sách thông báo */}
            {showNotifications && (
              <div style={{ position: 'absolute', right: 0, top: '40px', width: '350px', background: '#fff', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', zIndex: 1000, overflow: 'hidden', border: '1px solid #ddd' }}>
                <div style={{ background: '#f8f9fa', padding: '10px 15px', borderBottom: '1px solid #ddd', fontWeight: 'bold', color: '#333' }}>Thông báo của bạn</div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Chưa có thông báo nào</div>
                  ) : (
                    notifications.map(noti => (
                      <div 
                        key={noti.id} 
                        onClick={() => handleReadNotification(noti.id)}
                        style={{ padding: '15px', borderBottom: '1px solid #eee', background: noti.isRead ? '#fff' : '#e6f0fa', cursor: 'pointer', transition: '0.2s' }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0b5ed7', marginBottom: '5px' }}>{noti.title}</div>
                        <div style={{ fontSize: '13px', color: '#555', whiteSpace: 'pre-wrap' }}>{noti.message}</div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '8px', textAlign: 'right' }}>
                          {new Date(noti.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    ))
                  )}
                </div> 
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <div onClick={() => setShowDropdown(!showDropdown)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff', padding: '6px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ color: '#0b5ed7', fontWeight: 'bold', fontSize: '14px' }}>{user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}</span>
              </div>
              <span style={{ fontSize: '14px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.fullName}</span>
              <span style={{ fontSize: '10px', color: '#fff' }}>▼</span>
            </div>
            {showDropdown && (
              <div style={{ position: 'absolute', top: '120%', right: 0, background: '#1c1c1c', border: '1px solid #333', borderRadius: '8px', padding: '5px 0', width: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100 }}>
                <div onClick={() => { setShowProfileModal(true); setShowDropdown(false); }} style={{ padding: '10px 15px', cursor: 'pointer', color: '#fff', fontSize: '14px', transition: '0.2s' }} onMouseEnter={(e) => e.target.style.background = '#333'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>Profile</div>
                <div onClick={handleLogout} style={{ padding: '10px 15px', cursor: 'pointer', color: '#ff4d4d', fontSize: '14px', transition: '0.2s' }} onMouseEnter={(e) => e.target.style.background = '#333'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>Log out</div>
              </div>
            )}
          </div>
          {user.role === 'LANDLORD' && (
            <button onClick={() => { setEditingRoomId(null); setActiveTab('ADD_ROOM'); }} style={{ background: '#ff5a2c', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
              📝 Đăng tin mới
            </button>
          )}
          
        </div>
      </div>
          
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 2. SIDEBAR */}
        <div style={{ width: '250px', background: '#fff', borderRight: '1px solid #ddd', overflowY: 'auto', padding: '20px 0', textAlign: 'left' }}>
          {user.role === 'LANDLORD' ? (
            <>
              <div onClick={() => setIsRoomMenuOpen(!isRoomMenuOpen)} style={{ padding: '12px 20px', cursor: 'pointer', fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between', background: isRoomMenuOpen ? '#f0f4f8' : 'transparent' }}>
                <span>🏠 Danh sách phòng</span><span>{isRoomMenuOpen ? '▼' : '▶'}</span>
              </div>
              {isRoomMenuOpen && (
                <div style={{ paddingBottom: '10px' }}>
                  <div onClick={() => setActiveTab('ALL_ROOMS')} style={{ padding: '10px 20px 10px 40px', cursor: 'pointer', background: activeTab === 'ALL_ROOMS' ? '#e6f0fa' : 'transparent', color: activeTab === 'ALL_ROOMS' ? '#0b5ed7' : '#555' }}>• Tất cả phòng ({rooms.length})</div>
                  <div onClick={() => setActiveTab('RENTED')} style={{ padding: '10px 20px 10px 40px', cursor: 'pointer', background: activeTab === 'RENTED' ? '#e6f0fa' : 'transparent', color: activeTab === 'RENTED' ? '#0b5ed7' : '#555' }}>• Đang cho thuê ({rooms.filter(r=>r.status === 'RENTED').length})</div>
                  <div onClick={() => setActiveTab('AVAILABLE')} style={{ padding: '10px 20px 10px 40px', cursor: 'pointer', background: activeTab === 'AVAILABLE' ? '#e6f0fa' : 'transparent', color: activeTab === 'AVAILABLE' ? '#0b5ed7' : '#555' }}>• Phòng trống ({rooms.filter(r=>r.status === 'AVAILABLE').length})</div>
                  {/* Mục Phòng Đã Cọc */}
                  <div onClick={() => setActiveTab('DEPOSITED')} style={{ padding: '10px 20px 10px 40px', cursor: 'pointer', background: activeTab === 'DEPOSITED' ? '#e6f0fa' : 'transparent', color: activeTab === 'DEPOSITED' ? '#0b5ed7' : '#555' }}>
                    • Phòng đã cọc ({rooms.filter(r => r.depositNote && r.depositNote.trim() !== '').length})
                  </div>
                  {/* 🚨 THÊM DÒNG NÀY: MỤC PHÒNG SẮP TRỐNG (CÓ THỂ ĐĂNG TIN) */}
                  <div onClick={() => setActiveTab('UPCOMING')} style={{ padding: '10px 20px 10px 40px', cursor: 'pointer', background: activeTab === 'UPCOMING' ? '#e6f0fa' : 'transparent', color: activeTab === 'UPCOMING' ? '#0b5ed7' : '#555' }}>
                    • Sắp trống / Đăng tin ({rooms.filter(r => r.status === 'RENTED' && contracts.some(c => c.roomId === r.id && c.status === 'ACTIVE' && c.intendedMoveOutDate)).length})
                  </div>
                  <div onClick={() => setActiveTab('MAINTENANCE')} style={{ padding: '10px 20px 10px 40px', cursor: 'pointer', background: activeTab === 'MAINTENANCE' ? '#e6f0fa' : 'transparent', color: activeTab === 'MAINTENANCE' ? '#0b5ed7' : '#555' }}>• Đang bảo trì ({rooms.filter(r=>r.status === 'MAINTENANCE').length})</div>
                </div>
              )}
              <div onClick={() => setActiveTab('TENANTS')} style={{ padding: '12px 20px', cursor: 'pointer', fontWeight: 'bold', background: activeTab === 'TENANTS' ? '#e6f0fa' : 'transparent', color: activeTab === 'TENANTS' ? '#0b5ed7' : '#333' }}>👥 Danh sách người thuê</div>
              {/* MENU SỰ CỐ CHO CHỦ NHÀ */}
              <div onClick={() => setActiveTab('INCIDENTS')} style={{ padding: '12px 20px', cursor: 'pointer', fontWeight: 'bold', background: activeTab === 'INCIDENTS' ? '#e6f0fa' : 'transparent', color: activeTab === 'INCIDENTS' ? '#0b5ed7' : '#333' }}>🛠️ Quản lý Sự cố</div>
              {/* MENU TÀI CHÍNH */}
              <div onClick={() => setIsFinanceMenuOpen(!isFinanceMenuOpen)} style={{ padding: '12px 20px', cursor: 'pointer', fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between', background: isFinanceMenuOpen ? '#f0f4f8' : 'transparent' }}>
                <span>💰 Tài chính</span><span>{isFinanceMenuOpen ? '▼' : '▶'}</span>
              </div>
              {isFinanceMenuOpen && (
                <div style={{ paddingBottom: '10px' }}>
                  <div onClick={() => setActiveTab('LANDLORD_BILLS')} style={{ padding: '10px 20px 10px 40px', cursor: 'pointer', background: activeTab === 'LANDLORD_BILLS' ? '#e6f0fa' : 'transparent', color: activeTab === 'LANDLORD_BILLS' ? '#0b5ed7' : '#555' }}>• Quản lý Hóa đơn</div>
                  <div onClick={() => setActiveTab('LANDLORD_REVENUE')} style={{ padding: '10px 20px 10px 40px', cursor: 'pointer', background: activeTab === 'LANDLORD_REVENUE' ? '#e6f0fa' : 'transparent', color: activeTab === 'LANDLORD_REVENUE' ? '#0b5ed7' : '#555' }}>• Báo cáo Doanh thu</div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* TAB 1: PHÒNG ĐANG THUÊ */}
              <div 
                onClick={() => setActiveTab('TENANT_ROOMS')} 
                style={{ padding: '12px 20px', cursor: 'pointer', fontWeight: 'bold', background: activeTab === 'TENANT_ROOMS' ? '#e6f0fa' : 'transparent', color: activeTab === 'TENANT_ROOMS' ? '#0b5ed7' : '#333' }}
              >
                🏠 Phòng đang thuê
              </div>

              {/* TAB SỰ CỐ & HỖ TRỢ KHÁCH THUÊ */}
              <div 
                onClick={() => setActiveTab('INCIDENTS')} 
                style={{ padding: '12px 20px', cursor: 'pointer', fontWeight: 'bold', background: activeTab === 'INCIDENTS' ? '#e6f0fa' : 'transparent', color: activeTab === 'INCIDENTS' ? '#0b5ed7' : '#333' }}
              >
                🛠️ Sự cố & Hỗ trợ
              </div>

              {/* TAB 2: THANH TOÁN HÓA ĐƠN (CÓ XỔ XUỐNG) */}
              <div 
                onClick={() => {
                  setActiveTab('TENANT_BILLS');
                  setIsTenantBillsMenuOpen(!isTenantBillsMenuOpen); // Bật/tắt menu con
                  if(!selectedRoomId) setSelectedRoomId('ALL');     // Mặc định chọn Tất cả
                }} 
                style={{ padding: '12px 20px', cursor: 'pointer', fontWeight: 'bold', background: activeTab === 'TENANT_BILLS' ? '#e6f0fa' : 'transparent', color: activeTab === 'TENANT_BILLS' ? '#0b5ed7' : '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>🧾 Thanh toán hóa đơn</span>
                {/* Mũi tên xổ xuống */}
                <span style={{ fontSize: '11px' }}>{isTenantBillsMenuOpen && activeTab === 'TENANT_BILLS' ? '▼' : '▶'}</span>
              </div>

{/* MENU CON: TẤT CẢ & TỪNG PHÒNG CỦA KHÁCH THUÊ */}
              {isTenantBillsMenuOpen && activeTab === 'TENANT_BILLS' && (
                <div style={{ background: 'transparent', padding: '5px 0', borderBottom: '1px solid #ddd' }}>
                  
                  {/* Nút: Tất cả */}
                  <div 
                    onClick={() => setSelectedRoomId('ALL')}
                    style={{ 
                      padding: '10px 20px 10px 45px', 
                      cursor: 'pointer', 
                      // Hiệu ứng nền xanh khi được chọn giống hệt ảnh 1
                      background: (!selectedRoomId || selectedRoomId === 'ALL') ? '#e6f0fa' : 'transparent', 
                      color: (!selectedRoomId || selectedRoomId === 'ALL') ? '#0b5ed7' : '#555', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      fontSize: '14px' 
                    }}
                  >
                    <span>• Tất cả</span>
                    {totalTenantUnpaid > 0 && (
                      <span style={{ background: '#dc3545', color: '#fff', fontSize: '11px', padding: '2px 7px', borderRadius: '10px', fontWeight: 'bold' }}>
                        {totalTenantUnpaid}
                      </span>
                    )}
                  </div>

                  {/* Nút: Từng phòng */}
                  {tenantRoomsList.map(room => (
                    <div 
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      style={{ 
                        padding: '10px 20px 10px 45px', 
                        cursor: 'pointer', 
                        // Hiệu ứng nền xanh khi được chọn giống hệt ảnh 1
                        background: selectedRoomId === room.id ? '#e6f0fa' : 'transparent', 
                        color: selectedRoomId === room.id ? '#0b5ed7' : '#555', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        fontSize: '14px' 
                      }}
                    >
                      <span>• {room.roomNumber}</span>
                      {room.unpaidCount > 0 && (
                        <span style={{ background: '#dc3545', color: '#fff', fontSize: '11px', padding: '2px 7px', borderRadius: '10px', fontWeight: 'bold' }}>
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
        <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          
          {(activeTab === 'ALL_ROOMS' || activeTab === 'AVAILABLE' || activeTab === 'RENTED' || activeTab === 'MAINTENANCE' || activeTab === 'UPCOMING' || activeTab === 'DEPOSITED') && (
            <div>
              {/* Đổi Tiêu đề tương ứng với Tab */}
              <h2 style={{ marginTop: 0, color: '#333' }}>
                {activeTab === 'UPCOMING' ? 'Quản lý phòng Sắp trống (Đang tìm khách)' : 
                activeTab === 'AVAILABLE' ? 'DANH SÁCH PHÒNG TRỐNG' : 
                activeTab === 'RENTED' ? 'DANH SÁCH PHÒNG ĐANG CHO THUÊ' : 
                activeTab === 'MAINTENANCE' ? 'PHÒNG ĐANG BẢO TRÌ' : 
                 activeTab === 'DEPOSITED' ? 'Quản lý phòng Đã nhận cọc' : 'Danh sách Phòng'}
              </h2>

              {/* 🚨 THANH TÌM KIẾM PHÒNG 🚨 */}
              <div style={{ marginBottom: '25px', position: 'relative', maxWidth: '600px' }}>
                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Tìm theo mã phòng, số phòng, địa chỉ..." 
                  value={roomSearchTerm}
                  onChange={(e) => setRoomSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '30px', border: '1px solid #ccc', fontSize: '14px', outline: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}
                />
                {roomSearchTerm && (
                  <button onClick={() => setRoomSearchTerm('')} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '16px' }}>✖</button>
                )}
              </div>
{/* --- KHU VỰC FORM TẠO HỢP ĐỒNG (BẢN ĐẦY ĐỦ PHÁP LÝ) --- */}
              {contractRoom && (
                <div style={{ background: '#fff', padding: '25px', marginBottom: '20px', border: '2px solid #0b5ed7', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ marginTop: 0, color: '#0b5ed7', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                    {editingContractId ? '✏️ Cập nhật Hợp đồng Phòng ' : '✍️ Ký hợp đồng cho Phòng '} {contractRoom.roomNumber}
                  </h3>
                  
                  {/* PHẦN 1: THÔNG TIN BÊN A (CHỦ NHÀ) */}
                  <h4 style={{ color: '#333', marginBottom: '10px' }}>1. Thông tin Chủ nhà (Bên A)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '6px' }}>
                    <input type="text" placeholder="Họ và tên *" value={contractData.landlordName} onChange={e => setContractData({...contractData, landlordName: e.target.value})} style={{ padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    <input type="text" placeholder="Số điện thoại *" value={contractData.landlordPhone} onChange={e => setContractData({...contractData, landlordPhone: e.target.value})} style={{ padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    <input type="text" placeholder="Số CCCD/CMND *" value={contractData.landlordIdentityNumber} onChange={e => setContractData({...contractData, landlordIdentityNumber: e.target.value})} style={{ padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', gridColumn: 'span 1' }}>
                        <span style={{ fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>Ngày sinh:</span>
                        <input type="date" value={contractData.landlordDob} onChange={e => setContractData({...contractData, landlordDob: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <input type="text" placeholder="Quê quán / Thường trú *" value={contractData.landlordHometown} onChange={e => setContractData({...contractData, landlordHometown: e.target.value})} style={{ padding: '9px', borderRadius: '4px', border: '1px solid #ccc', gridColumn: 'span 2' }} />
                  </div>

                  {/* PHẦN 2: THÔNG TIN BÊN B (ĐẠI DIỆN THUÊ) */}
                  <h4 style={{ color: '#333', marginBottom: '10px' }}>2. Thông tin Người đại diện thuê (Bên B)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px', background: '#e6f0fa', padding: '15px', borderRadius: '6px' }}>
                    <input type="text" placeholder="Họ và tên *" value={contractData.tenantName} onChange={e => setContractData({...contractData, tenantName: e.target.value})} style={{ padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    <input 
                      type="email" 
                      placeholder="Email (Gõ xong bấm ra ngoài để tự điền) *" 
                      value={contractData.tenantEmail} 
                      onChange={e => setContractData({...contractData, tenantEmail: e.target.value})} 
                      
                      // BỔ SUNG SỰ KIỆN NÀY
                      onBlur={handleCheckTenantEmail} 
                      
                      style={{ padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }} 
                    /> 
                    <input type="text" placeholder="Số điện thoại *" value={contractData.tenantPhone} onChange={e => setContractData({...contractData, tenantPhone: e.target.value})} style={{ padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    <input type="text" placeholder="Số CCCD/CMND *" value={contractData.tenantIdentityNumber} onChange={e => setContractData({...contractData, tenantIdentityNumber: e.target.value})} style={{ padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>Ngày sinh:</span>
                        <input type="date" value={contractData.tenantDob} onChange={e => setContractData({...contractData, tenantDob: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <input type="text" placeholder="Quê quán / Thường trú *" value={contractData.tenantHometown} onChange={e => setContractData({...contractData, tenantHometown: e.target.value})} style={{ padding: '9px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  </div>

                  {/* PHẦN 3: THỜI HẠN & ẢNH ĐÍNH KÈM */}
                  <h4 style={{ color: '#333', marginBottom: '10px' }}>3. Thời hạn hợp đồng</h4>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Ngày bắt đầu:</label>
                      <input type="date" value={contractData.startDate} onChange={e => setContractData({...contractData, startDate: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '9px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '5px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Ngày kết thúc:</label>
                      <input type="date" value={contractData.endDate} onChange={e => setContractData({...contractData, endDate: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '9px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '5px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Ảnh hợp đồng (Có thể chọn nhiều):</label>
                      <input 
                        type="file" 
                        multiple // BẮT BUỘC PHẢI CÓ CHỮ NÀY ĐỂ CHỌN NHIỀU ẢNH
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          console.log("DANH SÁCH ẢNH VỪA CHỌN:", files); // Camera 1
                          setContractImages(files); // Lưu vào state contractImages
                        }} 
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #ccc', marginTop: '5px' }} 
                      />
                    </div>
                  </div>

{/* PHẦN 4: THÀNH VIÊN Ở CÙNG (ĐẦY ĐỦ THÔNG TIN) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ color: '#333', margin: 0 }}>4. Danh sách người ở cùng (Không tính người đại diện)</h4>
                    {/* Cập nhật nút thêm người: Thêm các trường dob và hometown */}
                    <button onClick={() => setContractData({...contractData, members: [...contractData.members, { fullName: '', dob: '', phone: '', identityNumber: '', hometown: '' }]})} style={{ padding: '5px 12px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                      + Thêm người ở
                    </button>
                  </div>
                  
                  {contractData.members.map((member, index) => (
                    <div key={index} style={{ marginBottom: '15px', background: '#f8f9fa', padding: '15px', borderRadius: '6px', border: '1px dashed #ccc', position: 'relative' }}>
                      
                      {/* Nút Xóa Thành Viên */}
                      <button onClick={() => { const newMembers = contractData.members.filter((_, i) => i !== index); setContractData({...contractData, members: newMembers}); }} style={{ position: 'absolute', top: '10px', right: '10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '5px 15px', fontWeight: 'bold', fontSize: '12px' }}>
                        Xóa
                      </button>
                      
                      <h5 style={{ margin: '0 0 10px 0', color: '#17a2b8' }}>Thành viên {index + 1}</h5>
                      
                      {/* Lưới thông tin thành viên */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <input type="text" placeholder="Họ và tên *" value={member.fullName} onChange={(e) => { const newMembers = [...contractData.members]; newMembers[index].fullName = e.target.value; setContractData({...contractData, members: newMembers}); }} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        <input type="text" placeholder="Số điện thoại" value={member.phone} onChange={(e) => { const newMembers = [...contractData.members]; newMembers[index].phone = e.target.value; setContractData({...contractData, members: newMembers}); }} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        <input type="text" placeholder="Số CCCD/CMND *" value={member.identityNumber} onChange={(e) => { const newMembers = [...contractData.members]; newMembers[index].identityNumber = e.target.value; setContractData({...contractData, members: newMembers}); }} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>Ngày sinh:</span>
                            <input type="date" value={member.dob} onChange={(e) => { const newMembers = [...contractData.members]; newMembers[index].dob = e.target.value; setContractData({...contractData, members: newMembers}); }} style={{ flex: 1, padding: '7px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                        <input type="text" placeholder="Quê quán / Thường trú *" value={member.hometown} onChange={(e) => { const newMembers = [...contractData.members]; newMembers[index].hometown = e.target.value; setContractData({...contractData, members: newMembers}); }} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', gridColumn: 'span 2' }} />
                      </div>

                    </div>
                  ))}
                  
                  {contractData.members.length === 0 && <p style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', margin: '0 0 20px 0' }}>Chưa có thành viên nào. Bấm "+ Thêm người ở" nếu phòng có nhiều người.</p>}
                  {/* PHẦN 5: GIÁ ĐÀM PHÁN THỰC TẾ */}
                  <h4 style={{ color: '#333', marginBottom: '10px', marginTop: '20px' }}>5. Chi phí & Chỉ số ban đầu</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px', background: '#fff3cd', padding: '15px', borderRadius: '6px', border: '1px solid #ffeeba' }}>
                    <div><label style={{ fontSize: '12px', color: '#666' }}>Giá phòng (đ/Tháng):</label><input type="number" value={contractData.price} onChange={e => setContractData({...contractData, price: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                    <div><label style={{ fontSize: '12px', color: '#666' }}>Giá điện (đ/Ký):</label><input type="number" value={contractData.electricityPrice} onChange={e => setContractData({...contractData, electricityPrice: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                    <div><label style={{ fontSize: '12px', color: '#666' }}>Giá nước (đ/Khối):</label><input type="number" value={contractData.waterPrice} onChange={e => setContractData({...contractData, waterPrice: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                    
                    {/* 3 Ô MỚI */}
                    <div><label style={{ fontSize: '12px', color: '#dc3545', fontWeight: 'bold' }}>Chỉ số ĐIỆN ban đầu:</label><input type="number" placeholder="Số trên đồng hồ" value={contractData.startElectricity} onChange={e => setContractData({...contractData, startElectricity: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #dc3545', borderRadius: '4px' }} /></div>
                    <div><label style={{ fontSize: '12px', color: '#dc3545', fontWeight: 'bold' }}>Chỉ số NƯỚC ban đầu:</label><input type="number" placeholder="Số trên đồng hồ" value={contractData.startWater} onChange={e => setContractData({...contractData, startWater: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #dc3545', borderRadius: '4px' }} /></div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#0b5ed7', fontWeight: 'bold' }}>Số lượng xe (Chiếc):</label>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input type="number" placeholder="Số xe" value={contractData.vehicleCount} onChange={e => setContractData({...contractData, vehicleCount: e.target.value})} style={{ width: '40%', boxSizing: 'border-box', padding: '8px', border: '1px solid #0b5ed7', borderRadius: '4px' }} />
                        <input type="number" placeholder="Giá/xe" value={contractData.parkingPrice} onChange={e => setContractData({...contractData, parkingPrice: e.target.value})} style={{ width: '60%', boxSizing: 'border-box', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                      </div>
                    </div>
                    
                    <div><label style={{ fontSize: '12px', color: '#666' }}>Mạng Internet (đ/Tháng):</label><input type="number" value={contractData.internetPrice} onChange={e => setContractData({...contractData, internetPrice: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                    <div><label style={{ fontSize: '12px', color: '#666' }}>Phí Dịch vụ (đ/Tháng):</label><input type="number" value={contractData.servicePrice} onChange={e => setContractData({...contractData, servicePrice: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                  </div>

                  {/* PHẦN 6: TÌNH TRẠNG BÀN GIAO */}
                  <h4 style={{ color: '#333', marginBottom: '10px', marginTop: '20px' }}>6. Tình trạng phòng bàn giao</h4>
                  <div style={{ background: '#e2e3e5', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #d3d6d8' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Mô tả chi tiết đồ dùng, trạng thái (Text):</label>
                      <textarea rows="3" value={contractData.conditionDescription} onChange={e => setContractData({...contractData, conditionDescription: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', padding: '9px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '5px' }} placeholder="VD: Tường sạch, có 1 giường, 1 nệm cũ, tủ lạnh hoạt động bình thường..." />
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Ảnh tình trạng phòng:</label>
                        <input type="file" multiple accept="image/*" onChange={(e) => setConditionImages(Array.from(e.target.files))} style={{ width: '100%', boxSizing: 'border-box', padding: '9px', background: '#fff', borderRadius: '4px', border: '1px solid #ccc', marginTop: '5px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Video tình trạng phòng (nếu có):</label>
                        <input type="file" multiple accept="video/*" onChange={(e) => setConditionVideos(Array.from(e.target.files))} style={{ width: '100%', boxSizing: 'border-box', padding: '9px', background: '#fff', borderRadius: '4px', border: '1px solid #ccc', marginTop: '5px' }} />
                      </div>
                    </div>
                  </div>

                  {/* NÚT LƯU CÓ CHỨC NĂNG HỦY VÀ PHÂN BIỆT SỬA/TẠO MỚI */}
                  <div style={{ textAlign: 'right' }}>
                    <button onClick={() => { setContractRoom(null); setEditingContractId(null); setConditionImages([]); setConditionVideos([]); setContractImages([]); }} style={{ padding: '10px 20px', background: 'transparent', color: '#555', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}>Hủy bỏ</button>
                    <button onClick={handleCreateContract} style={{ padding: '10px 25px', background: editingContractId ? '#28a745' : '#0b5ed7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      {editingContractId ? 'Lưu Cập Nhật' : 'Tạo Hợp Đồng'}
                    </button>
                  </div>
                </div>
              )}



              {/* --- KHU VỰC FORM CHỐT HÓA ĐƠN (CÓ CHỈ SỐ ĐẦU/CUỐI & TỰ TÍNH TIỀN) --- */}
              {billContract && (() => {
                // Tự động tính toán hiển thị ngay khi đang gõ
                const elecUsage = Math.max(0, (Number(billData.newElectricity) || 0) - (Number(billContract.currentElectricity) || 0));
                const waterUsage = Math.max(0, (Number(billData.newWater) || 0) - (Number(billContract.currentWater) || 0));
                
                // LẤY TRỰC TIẾP SỐ XE TỪ HỢP ĐỒNG (Không cần nhập nữa)
                const vehicleCount = Number(billContract.vehicleCount) || 0;

                // Lấy giá trị từ Hợp Đồng (Bên B phải chịu giá này)
                const roomPrice = Number(billContract.price) || 0;
                const elecPrice = Number(billContract.electricityPrice) || 0;
                const waterPrice = Number(billContract.waterPrice) || 0;
                const parkingPrice = Number(billContract.parkingPrice) || 0;
                const internetPrice = Number(billContract.internetPrice) || 0;
                const servicePrice = Number(billContract.servicePrice) || 0;

                const totalAmount = roomPrice + (elecUsage * elecPrice) + (waterUsage * waterPrice) + (vehicleCount * parkingPrice) + internetPrice + servicePrice;

                return (
                  <div style={{ background: '#fff3cd', padding: '25px', marginBottom: '20px', border: '1px solid #ffeeba', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#856404', borderBottom: '1px solid #ffeeba', paddingBottom: '10px' }}>
                      🧾 Chốt Hóa Đơn - Phòng {billContract.room?.roomNumber}
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Kỳ hóa đơn (Tháng):</label>
                        {/* FIX LỖI DROPDOWN: Dùng mảng cố định 12 tháng */}
                        <select value={billData.month || (new Date().getMonth() + 1)} onChange={e => setBillData({...billData, month: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '5px', backgroundColor: '#fff', color: '#000' }}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                            <option key={m} value={m}>Tháng {m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>Năm:</label>
                        <input type="number" value={billData.year || new Date().getFullYear()} onChange={e => setBillData({...billData, year: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '5px', boxSizing: 'border-box' }} />
                      </div>
                    </div>

                    {/* KHU VỰC NHẬP ĐIỆN / NƯỚC  */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px dashed #ccc' }}>
                      
                      {/* ĐIỆN */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', alignItems: 'end' }}>
                        <div>
                          <label style={{ fontSize: '13px', color: '#666' }}>Chỉ số điện THÁNG CŨ:</label>
                          <input type="number" value={billContract.currentElectricity || 0} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', background: '#e9ecef', fontWeight: 'bold', color: '#555' }} title="Tự động lấy từ tháng trước" />
                        </div>
                        <div>
                          <label style={{ fontSize: '13px', color: '#dc3545', fontWeight: 'bold' }}>Chỉ số điện MỚI:</label>
                          <input type="number" placeholder="Nhập số trên đồng hồ" value={billData.newElectricity || ''} onChange={e => setBillData({...billData, newElectricity: e.target.value})} style={{ width: '100%', padding: '8px', border: '2px solid #dc3545', borderRadius: '4px' }} />
                        </div>
                        <div style={{ padding: '8px', background: '#e6f0fa', color: '#0b5ed7', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                          Sử dụng: {elecUsage} ký
                        </div>
                      </div>

                      {/* NƯỚC */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', alignItems: 'end' }}>
                        <div>
                          <label style={{ fontSize: '13px', color: '#666' }}>Chỉ số nước THÁNG CŨ:</label>
                          <input type="number" value={billContract.currentWater || 0} readOnly style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', background: '#e9ecef', fontWeight: 'bold', color: '#555' }} title="Tự động lấy từ tháng trước" />
                        </div>
                        <div>
                          <label style={{ fontSize: '13px', color: '#dc3545', fontWeight: 'bold' }}>Chỉ số nước MỚI:</label>
                          <input type="number" placeholder="Nhập số trên đồng hồ" value={billData.newWater || ''} onChange={e => setBillData({...billData, newWater: e.target.value})} style={{ width: '100%', padding: '8px', border: '2px solid #dc3545', borderRadius: '4px' }} />
                        </div>
                        <div style={{ padding: '8px', background: '#e6f0fa', color: '#0b5ed7', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                          Sử dụng: {waterUsage} khối
                        </div>
                      </div>

                      
                    </div>

                    {/* BẢNG TÍNH DỰ KIẾN (CHỈ CÒN ĐIỆN & NƯỚC) */}
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px dashed #0b5ed7' }}>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#0b5ed7' }}>Hóa Đơn Điện Nước Dự Kiến:</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '14px', color: '#555' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Tiền điện ({elecUsage} ký x {elecPrice.toLocaleString()}đ):</span> 
                          <strong>{(elecUsage * elecPrice).toLocaleString('vi-VN')} đ</strong>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Tiền nước ({waterUsage} khối x {waterPrice.toLocaleString()}đ):</span> 
                          <strong>{(waterUsage * waterPrice).toLocaleString('vi-VN')} đ</strong>
                        </div>

                      </div>
                      
                      <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '2px dashed #ccc', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: 'red' }}>
                        <span>TỔNG TIỀN ĐIỆN NƯỚC:</span>
                        <span>{((elecUsage * elecPrice) + (waterUsage * waterPrice)).toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <button onClick={() => setBillContract(null)} style={{ padding: '10px 20px', background: 'transparent', color: '#555', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}>Hủy bỏ</button>

                      <button 
                        onClick={handleCreateBill} 
                        disabled={isCreatingBill} // Khóa nút nếu đang xử lý
                        style={{ 
                          padding: '10px 25px', 
                          background: isCreatingBill ? '#6c757d' : '#d39e00', // Đổi màu xám khi đang tải
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: isCreatingBill ? 'not-allowed' : 'pointer', 
                          fontWeight: 'bold' 
                        }}
                      >
                        {isCreatingBill ? '⏳ Đang xử lý...' : '🚀 Chốt & Tạo Hóa Đơn'}
                      </button>
                    </div>
                  </div>
                );
              })()}
              






              {/* DANH SÁCH PHÒNG */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {displayedRooms.map((room) => {
                  // Lấy hợp đồng đang hoạt động (nếu có) để xử lý logic gọn gàng hơn
                  const activeContract = contracts.find(c => c.roomId === room.id && c.status === 'ACTIVE');
                  const isReturningSoon = activeContract && !!activeContract.intendedMoveOutDate;

                  return (
                    <div key={room.id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '10px', width: '330px', backgroundColor: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.06)', color: '#000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                      
                      {/* TIÊU ĐỀ PHÒNG */}
                      <h3 onClick={() => { setViewRoomDetails(room); setCurrentImageIndex(0); }} style={{ margin: '0 0 15px 0', color: '#0b5ed7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        <span>Phòng {room.roomNumber} <br /> {room.roomCode && <span style={{ fontSize: '13px', color: '#6c757d', fontWeight: 'normal'  }}>Mã phòng: {room.roomCode}</span>}</span>
                        <span title="Xem chi tiết" style={{ fontSize: '18px' }}>🔍</span>
                      </h3>
                      
                      {/* THÔNG TIN CHI TIẾT TRÊN THẺ (Khu vực này co giãn để đẩy nút xuống đáy) */}
                      <div style={{ flex: 1, marginBottom: '15px', display: 'flex', flexDirection: 'column' }}>
                        <p style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '20px', textAlign: 'center', margin: '0 0 15px 0' }}>
                          <strong>Giá phòng:</strong> {room.price?.toLocaleString()} đ<span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>/tháng</span>
                        </p>
                        
                        <p style={{ fontSize: '14px', margin: '5px 0', color: '#444' }}>
                          <strong>Diện tích:</strong> {room.area || 0} m²
                        </p>
                        
                        <p style={{ fontSize: '14px', margin: '5px 0', color: '#444', lineHeight: '1.5' }}>
                          <strong>Địa chỉ:</strong> {room.houseNumber ? `${room.houseNumber}, ` : ''}{room.address}
                        </p>
                        
                        <p style={{ fontSize: '14px', margin: '10px 0 5px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>Trạng thái:</strong> 
                          <span style={{ background: room.status === 'AVAILABLE' ? '#d1e7dd' : room.status === 'RENTED' ? '#f8d7da' : '#fff3cd', color: room.status === 'AVAILABLE' ? '#0f5132' : room.status === 'RENTED' ? '#842029' : '#856404', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' }}>
                            {room.status === 'AVAILABLE' ? 'Đang trống' : room.status === 'RENTED' ? 'Đã cho thuê' : 'Đang sửa'}
                          </span>
                        </p>

                        {/* THẺ ĐÃ NHẬN CỌC NẰM GỌN GÀNG Ở ĐÂY */}
                        {room.depositNote && (
                          <div style={{ background: '#e0f8e9', color: '#146c43', padding: '12px', borderRadius: '6px', marginTop: '15px', fontSize: '13px', border: '1px dashed #20c997' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🔒 ĐÃ NHẬN CỌC / GIỮ CHỖ:</div>
                            <div style={{ fontStyle: 'italic', lineHeight: '1.4' }}>"{room.depositNote}"</div>
                          </div>
                        )}
                      </div>

                      {/* KHU VỰC CÁC NÚT HÀNH ĐỘNG (Ép nằm dưới cùng nhờ margin-top: auto) */}
                      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        
                        {/* 1. NÚT DÀNH CHO PHÒNG TRỐNG / ĐANG SỬA */}
                        {user.role === 'LANDLORD' && room.status !== 'RENTED' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleEditRoomClick(room)} style={{ flex: 1, padding: '8px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>✏️ Sửa</button>
                            <button onClick={() => handleDeleteRoom(room.id)} style={{ flex: 1, padding: '8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>🗑️ Xóa</button>
                          </div>
                        )}

                        {room.status === 'AVAILABLE' && (
                          <button onClick={() => { /* logic setContractRoom cũ của bạn */ 
                            setContractRoom(room);
                            setContractData({
                                ...contractData, landlordName: user?.fullName || '', landlordDob: user?.dob || '', landlordPhone: user?.phone || '', landlordIdentityNumber: user?.identityNumber || '', landlordHometown: user?.address || '',
                                tenantEmail: '', tenantName: '', tenantDob: '', tenantPhone: '', tenantIdentityNumber: '', tenantHometown: '', startDate: '', endDate: '',
                                price: room.price || 0, electricityPrice: room.electricityPrice || 0, waterPrice: room.waterPrice || 0, internetPrice: room.internetPrice || 0, parkingPrice: room.parkingPrice || 0, servicePrice: room.servicePrice || 0, members: [], conditionDescription: ''
                            });
                            setConditionImages([]);
                            setConditionVideos([]);
                            setContractImages([]);
                          }} style={{ width: '100%', padding: '10px', background: '#198754', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>✍️ Làm Hợp Đồng</button>
                        )}
                        
                        {(room.status === 'AVAILABLE' || room.status === 'MAINTENANCE') && (
                          <button onClick={() => roomApi.updateStatus(room.id, room.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE').then(fetchRooms)} style={{ width: '100%', padding: '8px', background: room.status === 'AVAILABLE' ? '#fd7e14' : '#198754', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>{room.status === 'AVAILABLE' ? '🔧 Chuyển sang Bảo Trì' : '✅ Bảo Trì xong'}</button>
                        )}

                        {/* 2. NÚT DÀNH CHO PHÒNG ĐANG CHO THUÊ */}
                        {room.status === 'RENTED' && activeContract && (
                          <>
                            {/* Hàng 1: Chốt điện nước + Kết thúc (Chia đôi) */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => setBillContract(activeContract)} style={{ flex: '1', padding: '10px 5px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                                🧾 Chốt Điện Nước
                              </button>
                              <button onClick={() => handleEndLease(room.id)} style={{ flex: '1', padding: '10px 5px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                                ❌ Kết thúc
                              </button>
                            </div>

                            {/* Hàng 2: Cập nhật HĐ + Xem HĐ (Chia đôi) */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleEditContractClick(activeContract)} style={{ flex: 1, padding: '10px 5px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                                ✏️ Cập nhật HĐ
                              </button>
                              <button onClick={() => setViewContract(activeContract)} style={{ flex: 1, padding: '10px 5px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                                📄 Xem Hợp Đồng
                              </button>
                            </div>

                            {/* Hàng 3: Báo trả phòng HOẶC Hủy (Độc quyền 1 trong 2) */}
                            {!isReturningSoon ? (
                              <button 
                                onClick={() => { setTerminateData({ contractId: activeContract.id, moveOutDate: '', reason: '' }); setShowTerminateModal(true); }} 
                                style={{ width: '100%', padding: '10px', background: '#fd7e14', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                              >
                                ⚠️ Báo trước lấy lại phòng
                              </button>
                            ) : (
                              <div style={{ background: '#fff3cd', color: '#856404', padding: '12px', borderRadius: '4px', fontSize: '13px', textAlign: 'center', border: '1px solid #ffeeba', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span>⏳ Sắp trả phòng: <strong>{activeContract.intendedMoveOutDate}</strong></span>
                                <button onClick={() => handleCancelTermination(activeContract.id)} style={{ width: '100%', padding: '8px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                                  ✖ Hủy yêu cầu (Tiếp tục thuê)
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {/* 3. NÚT QUẢN LÝ CỌC (Chỉ hiện khi phòng Trống hoặc Sắp Trống) */}
                        {user.role === 'LANDLORD' && (room.status === 'AVAILABLE' || isReturningSoon) && (
                          <button 
                            onClick={() => setDepositModal({ show: true, roomId: room.id, note: room.depositNote || '' })} 
                            style={{ width: '100%', padding: '10px', background: room.depositNote ? '#6c757d' : '#20c997', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                          >
                            {room.depositNote ? '📝 Sửa / Xóa Ghi Chú Cọc' : '💰 Nhận Cọc / Giữ Chỗ'}
                          </button>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB BÁO CÁO & SỰ CỐ */}
          {activeTab === 'INCIDENTS' && (
            <IncidentManagement user={user} rooms={rooms} contracts={contracts} onRepairCostUpdated={fetchLandlordIncidents} />
          )}

          {/* TAB THÊM/SỬA PHÒNG */}
          {activeTab === 'ADD_ROOM' && (
            <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0b5ed7', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#333' }}>{editingRoomId ? `Sửa thông tin: Phòng ${newRoom.roomNumber}` : 'Đăng tin phòng mới'}</h2>
                {editingRoomId && <button onClick={() => { setEditingRoomId(null); setActiveTab('ALL_ROOMS'); }} style={{ padding: '8px 15px', background: 'gray', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy sửa</button>}
              </div>

              <form onSubmit={handleCreateRoom}>
                <fieldset style={{ marginBottom: '20px', borderColor: '#ddd', padding: '15px' }}>
                  <legend style={{ fontWeight: 'bold', color: '#555' }}>Hình ảnh (Tối đa 15 ảnh)</legend>
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

                <fieldset style={{ marginBottom: '20px', borderColor: '#ddd', padding: '15px' }}>
                  <legend style={{ fontWeight: 'bold', color: '#555' }}>Thông tin cơ bản</legend>
                  
                  {/* Hàng 1: Số phòng, Số người, Diện tích */}
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <input type="text" placeholder="Số phòng *" required value={newRoom.roomNumber} onChange={e => setNewRoom({...newRoom, roomNumber: e.target.value})} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    <input type="number" placeholder="Số người ở tối đa *" required value={newRoom.maxOccupants} onChange={e => setNewRoom({...newRoom, maxOccupants: e.target.value})} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    <input type="number" placeholder="Diện tích (m2) *" required value={newRoom.area} onChange={e => setNewRoom({...newRoom, area: e.target.value})} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  </div>

                  {/* Hàng 2: Số nhà, ngõ, ngách (VỪA THÊM VÀO ĐÂY) */}
                  <div style={{ marginBottom: '15px' }}>
                    <input type="text" placeholder="Số nhà, ngõ, ngách, tên đường... *" required value={newRoom.houseNumber} onChange={e => setNewRoom({...newRoom, houseNumber: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} />
                  </div>

                  {/* Hàng 3: Dropdown Tỉnh/Thành và Phường/Xã (Mô hình mới) */}
                  <div style={{ marginBottom: '10px' }}>
                     <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: 'gray' }}>{editingRoomId ? `Khu vực cũ: ${newRoom.address} (Chọn lại bên dưới nếu muốn đổi)` : 'Chọn khu vực:'}</p>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      
                      {/* Ô CHỌN TỈNH/THÀNH */}
                      <div style={{ flex: 1 }}>
                        <input 
                          type="text" 
                          list="provinces-list" 
                          required={!editingRoomId} 
                          value={selectedProvince.name} 
                          onChange={handleProvinceChange} 
                          placeholder="-- Thành phố / Tỉnh --" 
                          style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} 
                        />
                        <datalist id="provinces-list">
                          {provinces.map(p => <option key={p.code} value={p.name} />)}
                        </datalist>
                      </div>

                      {/* Ô CHỌN XÃ/PHƯỜNG */}
                      <div style={{ flex: 1 }}>
                        <input 
                          type="text" 
                          list="wards-list" 
                          required={!editingRoomId && selectedProvince.code !== ''} 
                          disabled={!selectedProvince.code} 
                          value={selectedWard.name} 
                          onChange={handleWardChange} 
                          placeholder="-- Phường / Xã --" 
                          style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} 
                        />
                        <datalist id="wards-list">
                          {wards.map(w => <option key={w.code} value={w.name} />)}
                        </datalist>
                      </div>

                    </div>
                  </div>
                </fieldset>

                <fieldset style={{ marginBottom: '20px', borderColor: '#ddd', padding: '15px' }}>
                  <legend style={{ fontWeight: 'bold', color: '#555' }}>Giá thuê & Dịch vụ</legend>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {/* Hàng 1 */}
                    <input type="number" placeholder="Giá thuê/tháng *" required value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    <input type="number" placeholder="Giá điện/ký" value={newRoom.electricityPrice} onChange={e => setNewRoom({...newRoom, electricityPrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    <input type="number" placeholder="Giá nước/khối" value={newRoom.waterPrice} onChange={e => setNewRoom({...newRoom, waterPrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    
                    {/* Hàng 2: Mạng, Gửi xe, Vệ sinh */}
                    <input type="number" placeholder="Giá mạng/tháng" value={newRoom.internetPrice} onChange={e => setNewRoom({...newRoom, internetPrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    <input type="number" placeholder="Giá gửi xe/tháng/xe" value={newRoom.parkingPrice} onChange={e => setNewRoom({...newRoom, parkingPrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    <input type="number" placeholder="Phí vệ sinh, dịch vụ..." value={newRoom.servicePrice} onChange={e => setNewRoom({...newRoom, servicePrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  </div>
                </fieldset>

                <fieldset style={{ marginBottom: '20px', borderColor: '#ddd', padding: '15px' }}>
                  <legend style={{ fontWeight: 'bold', color: '#555' }}>Tiện ích</legend>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                    <label><input type="checkbox" checked={newRoom.hasElevator} onChange={e => setNewRoom({...newRoom, hasElevator: e.target.checked})} /> Thang máy</label>
                    <label><input type="checkbox" checked={newRoom.hasWashingMachine} onChange={e => setNewRoom({...newRoom, hasWashingMachine: e.target.checked})} /> Máy giặt</label>
                    <label><input type="checkbox" checked={newRoom.hasFridge} onChange={e => setNewRoom({...newRoom, hasFridge: e.target.checked})} /> Tủ lạnh</label>
                    <label><input type="checkbox" checked={newRoom.hasKitchen} onChange={e => setNewRoom({...newRoom, hasKitchen: e.target.checked})} /> Bếp nấu</label>
                    <label><input type="checkbox" checked={newRoom.hasHeater} onChange={e => setNewRoom({...newRoom, hasHeater: e.target.checked})} /> Nóng lạnh</label>
                  </div>
                  <textarea placeholder="Mô tả chi tiết phòng..." value={newRoom.description} onChange={e => setNewRoom({...newRoom, description: e.target.value})} style={{ width: '100%', height: '80px', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
                </fieldset>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button type="button" onClick={() => { setEditingRoomId(null); setActiveTab('ALL_ROOMS'); }} style={{ flex: 1, padding: '15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    HỦY BỎ
                  </button>
                  <button type="submit" style={{ flex: 1, padding: '15px', background: editingRoomId ? '#28a745' : '#0b5ed7', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {editingRoomId ? 'LƯU THAY ĐỔI' : 'ĐĂNG TIN'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: DANH SÁCH NGƯỜI THUÊ (Dành cho Chủ nhà) */}
          {activeTab === 'TENANTS' && (
            <div>
              <h2 style={{ marginTop: 0, color: '#333',  }}>Danh sách Người Thuê (Hợp đồng)</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#0b5ed7', color: '#fff' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Phòng</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Khách thuê</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Bắt đầu</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Kết thúc</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {/* BỔ SUNG: NẾU CHƯA CÓ HỢP ĐỒNG THÌ HIỆN DÒNG CHỮ NÀY */}
                  {contracts.length > 0 ? contracts.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>P.{c.room?.roomNumber}</td>
                      <td style={{ padding: '12px' }}>{c.tenant?.fullName} <br/><small style={{color: '#888'}}>{c.tenantEmail}</small></td>
                      <td style={{ padding: '12px' }}>{c.startDate}</td>
                      <td style={{ padding: '12px' }}>{c.endDate}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: c.status === 'ACTIVE' ? 'green' : 'red', fontWeight: 'bold' }}>{c.status}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                        Chưa có người thuê (Chưa có hợp đồng nào). Vui lòng tạo Hợp đồng ở mục Danh sách phòng!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: PHÒNG ĐANG THUÊ (Dành cho Khách thuê - ĐÃ NÂNG CẤP) */}
          {activeTab === 'TENANT_ROOMS' && (() => {
            const tenantContracts = contracts.filter(c => c.tenantId === user.id);
            const sortedTenantContracts = [...tenantContracts].sort((a, b) => {
              if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
              if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
              
              if (a.status !== 'ACTIVE' && b.status !== 'ACTIVE') {
                const aReviewed = myReviews.some(r => r.contractId === a.id);
                const bReviewed = myReviews.some(r => r.contractId === b.id);
                if (!aReviewed && bReviewed) return -1;
                if (aReviewed && !bReviewed) return 1;
              }
              return 0;
            });
            return (
            <div>
              <h2 style={{ marginTop: 0, color: '#333' }}>Phòng bạn đang thuê</h2>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {sortedTenantContracts.length === 0 ? (
                  <p style={{ color: '#888' }}>Bạn chưa có hợp đồng thuê phòng nào đang hoạt động.</p>
                ) : (
                  sortedTenantContracts.map(c => (
                    <div key={c.id} style={{ border: '1px solid #ddd', padding: '0', borderRadius: '8px', background: '#fff', width: '400px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      
                      {/* HEADER PHÒNG */}
                      <div style={{ background: '#0b5ed7', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left'  }}>
                        <h3 style={{ margin: 0 }}>Phòng {c.room?.roomNumber} <br /> {c.room?.roomCode && <span style={{ fontSize: '14px', color: '#e6f0fa', fontWeight: 'normal'}}>Mã phòng: {c.room.roomCode}</span>}</h3>
                        <span style={{ fontSize: '12px', background: c.status === 'ACTIVE' ? '#198754' : '#dc3545', padding: '4px 10px', borderRadius: '20px' }}>
                          {c.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã kết thúc'}
                        </span>
                      </div>

                      {/* THÔNG TIN CƠ BẢN */}
                      <div style={{ padding: '20px' }}>
                        <p style={{ margin: '0 0 10px 0', color: '#555' }}>📍 <strong>Địa chỉ:</strong> {c.room?.houseNumber ? `${c.room.houseNumber}, ` : ''}{c.room?.address}</p>
                        <p style={{ margin: '0 0 10px 0', color: '#555' }}>⏳ <strong>Thời hạn:</strong> Từ {c.startDate} đến {c.endDate}</p>
                        <p style={{ margin: '0 0 15px 0', color: '#555' }}>💰 <strong>Giá thuê:</strong> <span style={{ color: 'red', fontWeight: 'bold' }}>{Number(c.price || 0).toLocaleString('vi-VN')} đ/tháng</span></p>

                        <button 
                          onClick={() => setViewContract(c)} 
                          style={{ width: '100%', padding: '10px', background: '#e6f0fa', color: '#0b5ed7', border: '1px solid #b8daff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}
                        >
                          📄 Xem Chi Tiết Hợp Đồng Điện Tử
                        </button>
                        {/* NÚT ĐÁNH GIÁ (Chỉ hiện khi hợp đồng đã KẾT THÚC) */}
                        {/* NÚT ĐÁNH GIÁ (Kiểm tra xem đã đánh giá chưa) */}
                        {c.status !== 'ACTIVE' && (() => {
                          const existingReview = myReviews.find(r => r.contractId === c.id);
                          
                          if (existingReview) {
                            return (
                              <button 
                                onClick={() => { 
                                  setReviewData({ contractId: c.id, rating: existingReview.rating, comment: existingReview.comment, isAnonymous: existingReview.isAnonymous, landlordReply: existingReview.landlordReply }); 
                                  setShowReviewModal(true); 
                                }}
                                style={{ width: '100%', padding: '10px', background: '#e0e0e0', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}
                              >
                                👁️ Xem & Sửa đánh giá {existingReview.landlordReply && ' (Có phản hồi)'}
                              </button>
                            );
                          } else {
                            return (
                              <button 
                                onClick={() => { setReviewData({ contractId: c.id, rating: 5, comment: '', isAnonymous: false, landlordReply: null }); setShowReviewModal(true); }}
                                style={{ width: '100%', padding: '10px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}
                              >
                                ⭐ Đánh giá phòng & Chủ nhà
                              </button>
                            );
                          }
                        })()}
                        {/* NÚT BÁO TRẢ PHÒNG CỦA KHÁCH */}
                    {c.status === 'ACTIVE' && !c.intendedMoveOutDate && (
                      <button 
                        onClick={() => setTerminateData({ contractId: c.id, moveOutDate: '', reason: '' }) || setShowTerminateModal(true)}
                        style={{ width: '100%', padding: '10px', background: '#fd7e14', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}
                      >
                        🚪 Báo trước dọn đi (Trả phòng)
                      </button>
                    )}

                    {c.status === 'ACTIVE' && c.intendedMoveOutDate && (
                        <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeeba' }}>
                          <p style={{ margin: '0 0 5px 0', color: '#856404', fontWeight: 'bold' }}>⏳ Đang đếm ngược trả phòng!</p>
                          <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>Ngày chuyển đi dự kiến: <strong>{c.intendedMoveOutDate}</strong></p>
                          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#888' }}>* Đến ngày này, Chủ nhà sẽ tới chốt điện nước và xuất hóa đơn cuối cùng cho bạn.</p>
                          <button 
                            onClick={() => handleCancelTermination(c.id)}
                            style={{ width: '100%', padding: '8px', marginTop: '15px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            ✖ Đổi ý, hủy yêu cầu trả phòng
                          </button>
                        </div>
                    )}

{/* KHU VỰC KHAI BÁO TẠM TRÚ (CHỈ HIỆN KHI HỢP ĐỒNG ACTIVE) */}
                        {c.status === 'ACTIVE' && (
                          <div style={{ background: c.residenceStatus === 'REGISTERED' && editingResidenceId !== c.id ? '#d4edda' : '#fff3cd', padding: '15px', borderRadius: '8px', border: `1px solid ${c.residenceStatus === 'REGISTERED' && editingResidenceId !== c.id ? '#c3e6cb' : '#ffeeba'}`, transition: '0.3s' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>📋 Khai báo Tạm trú</span>
                              {/* Hiện nút Hủy nếu đang mở form sửa */}
                              {editingResidenceId === c.id && (
                                <button onClick={() => { setEditingResidenceId(null); setResidenceFiles(prev => ({ ...prev, [c.id]: [] })); }} style={{ background: 'transparent', border: 'none', color: '#856404', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>✖ Hủy cập nhật</button>
                              )}
                            </h4>
                            
                            {/* NẾU ĐÃ ĐĂNG KÝ VÀ KHÔNG BẤM SỬA -> HIỆN THÔNG TIN */}
                            {c.residenceStatus === 'REGISTERED' && editingResidenceId !== c.id ? (
                              <div>
                                <p style={{ color: '#155724', fontWeight: 'bold', fontSize: '13px', margin: '0 0 10px 0' }}>✅ Bạn đã nộp minh chứng tạm trú!</p>
                                <p style={{ fontSize: '13px', margin: '5px 0' }}><strong>Ngày ĐK:</strong> {c.residenceDate || '...'}</p>
                                <p style={{ fontSize: '13px', margin: '5px 0 10px 0' }}><strong>Nơi ĐK:</strong> {c.residencePlace || '...'}</p>
                                
                                {/* Hiển thị mảng ảnh tạm trú */}
                                {(() => {
                                  let resImages = [];
                                  try {
                                    resImages = Array.isArray(c.residenceImage) ? c.residenceImage : JSON.parse(c.residenceImage || '[]');
                                  } catch (e) { resImages = []; }

                                  return resImages.length > 0 && (
                                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                                      {resImages.map((img, idx) => {
                                        const cleanImg = img.replace('uploads/', '').replace('uploads\\', '');
                                        return (
                                          <img 
                                            key={idx}
                                            src={`http://localhost:5000/uploads/${cleanImg}`} 
                                            alt={`Minh chứng ${idx + 1}`} 
                                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer', flexShrink: 0 }} 
                                            onClick={() => window.open(`http://localhost:5000/uploads/${cleanImg}`)}
                                          />
                                        )
                                      })}
                                    </div>
                                  );
                                })()}

                                {/* NÚT MỞ FORM CẬP NHẬT LẠI */}
                                <button 
                                  onClick={() => {
                                    setEditingResidenceId(c.id);
                                    setResidenceData(prev => ({ ...prev, [c.id]: { date: c.residenceDate || '', place: c.residencePlace || '' } }));
                                  }}
                                  style={{ width: '100%', padding: '8px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px' }}
                                >
                                  ✏️ Cập nhật lại thông tin/ảnh
                                </button>
                              </div>
                            ) : (
                              /* NẾU CHƯA ĐĂNG KÝ HOẶC ĐANG BẤM SỬA -> HIỆN FORM ĐIỀN */
                              <div>
                                <p style={{ color: '#856404', fontSize: '13px', margin: '0 0 15px 0' }}>
                                  {editingResidenceId === c.id ? 'Tải lên thông tin và ảnh minh chứng mới để ghi đè dữ liệu cũ.' : '⚠️ Vui lòng hoàn thành thủ tục tại công an phường và tải thông tin lên đây.'}
                                </p>
                                <form onSubmit={(e) => handleUploadResidence(e, c.id)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  
                                  <input type="date" value={residenceData[c.id]?.date || ''} onChange={e => setResidenceData(prev => ({...prev, [c.id]: {...(prev[c.id] || {}), date: e.target.value}}))} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }} title="Ngày đăng ký" />
                                  <input type="text" placeholder="Nơi đăng ký (VD: Công an phường X)" value={residenceData[c.id]?.place || ''} onChange={e => setResidenceData(prev => ({...prev, [c.id]: {...(prev[c.id] || {}), place: e.target.value}}))} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }} />
                                  
                                  <input 
                                    type="file" 
                                    multiple // Cho phép chọn nhiều ảnh
                                    accept="image/*"
                                    onChange={(e) => setResidenceFiles(prev => ({ ...prev, [c.id]: Array.from(e.target.files) }))}
                                    style={{ padding: '8px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}
                                  />
                                  <button type="submit" style={{ padding: '10px', background: editingResidenceId === c.id ? '#17a2b8' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {editingResidenceId === c.id ? 'Lưu cập nhật' : 'Nộp hồ sơ minh chứng'}
                                  </button>
                                </form>
                              </div>
                            )}
                          </div>
                        )}
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

          // Lọc hóa đơn theo phòng được chọn từ menu bên trái
          const billsToDisplay = activeRoomId === 'ALL' 
            ? tenantBills.sort((a, b) => b.id - a.id)
            : tenantBills.filter(b => (b.roomNumberSnapshot || b.contract?.room?.roomNumber || 'Phòng đã xóa') === activeRoomId).sort((a, b) => b.id - a.id);

          return (
            <div style={{ padding: '10px 30px' }}>
              <h2 style={{ color: '#0b5ed7', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>
                Chi tiết hóa đơn - {activeRoomId === 'ALL' ? 'Tất cả phòng' : `Phòng ${tenantRoomsList.find(r => r.id === activeRoomId)?.roomNumber}`}
              </h2>
              <div style={{ borderBottom: '2px solid #0b5ed7', marginBottom: '40px', width: '100%' }}></div>
              
              {tenantRoomsList.length === 0 ? (
                <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: '50px' }}>Bạn chưa có lịch sử hóa đơn nào trên hệ thống.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
                  {billsToDisplay.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>Không có dữ liệu hóa đơn.</p>
                  ) : (
                    billsToDisplay.map((bill) => (
                      <div key={bill.id} style={{ border: '1px solid #eaeaea', padding: '30px', borderRadius: '12px', width: '320px', background: '#fff', boxShadow: '0 8px 20px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        
                        {/* NHÃN PHÂN LOẠI */}
                        <div style={{ marginBottom: '20px' }}>
                          {bill.billType === 'ROOM' ? (
                            <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>🏠 HÓA ĐƠN TIỀN NHÀ</span>
                          ) : bill.billType === 'UTILITY' ? (
                            <span style={{ background: '#d1e7dd', color: '#0f5132', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>⚡ HÓA ĐƠN ĐIỆN NƯỚC</span>
                          ) : (
                            <span style={{ background: '#e2e3e5', color: '#41464b', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>🧾 HÓA ĐƠN TỔNG HỢP</span>
                          )}
                        </div>

                        {/* THỜI GIAN VÀ THÔNG SỐ */}
                        <h4 style={{ margin: '0 0 10px 0', color: '#222', fontSize: '20px', fontWeight: 'bold' }}>Tháng {bill.month}/{bill.year}</h4>
                        <div style={{ fontSize: '13px', color: '#666', textAlign: 'center' }}>
                          {bill.billType === 'ROOM' ? (
                            <span style={{ fontStyle: 'italic' }}>Bao gồm tiền phòng & dịch vụ</span>
                          ) : (
                            <span>⚡ Điện: <strong>{bill.electricityUsage}</strong> ký <span style={{ margin: '0 8px', color: '#ddd' }}>|</span> 💧 Nước: <strong>{bill.waterUsage}</strong> khối</span>
                          )}
                        </div>

                        {/* ĐƯỜNG KẺ NÉT ĐỨT */}
                        <div style={{ width: '100%', borderTop: '1px dashed #ddd', margin: '25px 0' }}></div>

                        {/* TỔNG TIỀN VÀ TRẠNG THÁI */}
                        <div style={{ textAlign: 'center', marginBottom: '30px', width: '100%' }}>
                          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#dc3545', marginBottom: '12px' }}>
                            Tổng: {bill.totalAmount.toLocaleString('vi-VN')} đ
                          </div>
                          <div style={{ fontSize: '14px', color: '#555' }}>
                            Trạng thái: {bill.status === 'PAID' 
                              ? <span style={{ color: '#198754', fontWeight: 'bold' }}>✅ Đã thanh toán</span> 
                              : bill.status === 'PENDING_CONFIRM'
                              ? <span style={{ color: '#004085', fontWeight: 'bold' }}>⏳ Đang chờ chủ nhà duyệt</span>
                              : <span style={{ color: '#d39e00', fontWeight: 'bold' }}>⏳ Chưa thanh toán</span>}
                          </div>
                        </div>

                        {/* CÁC NÚT BẤM */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                          <button 
                            onClick={() => setViewBillDetails(bill)} 
                            style={{ width: '100%', padding: '12px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                          >
                            📄 Xem chi tiết hóa đơn
                          </button>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })()}
          

          {/* TAB: QUẢN LÝ HÓA ĐƠN (Dành cho Chủ nhà) */}
          {activeTab === 'LANDLORD_BILLS' && (
            <div>
              <h2 style={{ marginTop: 0, color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Quản lý Hóa Đơn & Thu Tiền
                <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
                  Tổng số: <strong>{bills.length}</strong> hóa đơn
                </span>
              </h2>
              
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                {bills.length === 0 ? (
                  <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', margin: '20px 0' }}>
                    Chưa có hóa đơn nào được tạo trên hệ thống.
                  </p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#0b5ed7', color: 'white' }}>
                        <th style={{ padding: '12px', borderTopLeftRadius: '6px' }}>Phòng</th>
                        <th style={{ padding: '12px' }}>Kỳ Hóa Đơn</th>
                        <th style={{ padding: '12px' }}>Khách Thuê</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Loại Hóa Đơn</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Trạng Thái</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderTopRightRadius: '6px' }}>Hành động</th> {/* Cột mới */}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Sắp xếp hóa đơn mới nhất lên đầu */}
                      {[...bills].reverse().map(bill => (
                        <tr key={bill.id} style={{ borderBottom: '1px solid #eee' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          
                          {/* 1. Cột Phòng (Ưu tiên dùng Snapshot) */}
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#0b5ed7' }}>
                            {bill.roomNumberSnapshot || (bill.contract?.room ? `P.${bill.contract.room.roomNumber}` : 'Phòng đã xóa')}
                          </td>
                          
                          {/* 2. Cột Kỳ Hóa Đơn (Giữ nguyên) */}
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>
                            Tháng {bill.month}/{bill.year}
                          </td>
                          
                          
                          {/* 3. Cột Khách Thuê (Ưu tiên dùng Snapshot) */}
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontWeight: 'bold' }}>
                              {bill.tenantNameSnapshot || bill.contract?.tenantName || bill.contract?.tenant?.fullName || 'Khách cũ'}
                            </span> <br/>
                            <span style={{ color: '#666', fontSize: '12px' }}>{bill.contract?.tenantEmail || 'Đã ẩn email'}</span> <br/>
                            <span style={{ color: '#888', fontSize: '12px' }}>SĐT: {bill.contract?.tenantPhone || bill.contract?.tenant?.phone || '...'}</span>
                          </td>
                          
                          {/* 4. Cột Loại Hóa Đơn */}
                          <td style={{ padding: '12px', color: 'red', fontWeight: 'bold', textAlign: 'center', fontSize: '15px' }}>
                            {bill.billType === 'ROOM' ? (
                               <span style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>
                              🏠 Tiền phòng
                              </span>
                            ) : bill.billType === 'UTILITY' ? (
                              <span style={{ background: '#d1e7dd', color: '#0f5132', border: '1px solid #badbcc', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>
                              ⚡ Tiền điện nước
                              </span>
                            ) : (
                              <span style={{ background: '#e2e3e5', color: '#41464b', border: '1px solid #d3d6d8', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>
                              🧾 Tổng hợp
                              </span>
                            )}
                          </td>
                          
                          {/* 5. Cột Trạng Thái */}
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {bill.status === 'PAID' ? (
                              <div style={{ background: '#d4edda', color: '#155724', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>✅ Đã thu tiền</div>
                            ) : bill.status === 'PENDING_CONFIRM' ? (
                              <div style={{ background: '#cce5ff', color: '#004085', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block', border: '1px solid #b8daff' }}>👀 Chờ kiểm duyệt</div>
                            ) : (
                              <div style={{ background: '#fff3cd', color: '#856404', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }}>⏳ Chờ thanh toán</div>
                            )}
                          </td>

                          {/* 6. Cột Hành Động */}
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button 
                              onClick={() => setViewBillDetails(bill)} 
                              style={{ padding: '6px 15px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto' }}
                            >
                              📄 Xem Hóa Đơn
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
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
            <div>
              {/* THANH TÌM KIẾM & BỘ LỌC */}
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ flex: '1 1 300px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '15px', top: '10px' }}>📍</span>
                  <input 
                    type="text" 
                    placeholder="Tìm theo số phòng, số nhà, ngõ, phường..." 
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '5px', border: '1px solid #ced4da', backgroundColor: '#f8f9fa', color: '#333', boxSizing: 'border-box' }} 
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ced4da', backgroundColor: '#fff', color: '#333', cursor: 'pointer' }}>
                    <option value="ALL">Cả năm</option>
                    {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
                  </select>
                  <select value={reportYear} onChange={(e) => setReportYear(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ced4da', backgroundColor: '#fff', color: '#333', cursor: 'pointer' }}>
                    <option value="ALL">Tất cả các năm</option>
                    <option value="2026">Năm 2026</option>
                    <option value="2025">Năm 2025</option>
                    <option value="2024">Năm 2024</option>
                  </select>
                </div>
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                📊 Báo cáo Doanh thu Chi tiết
              </h2>

              {/* 5 THẺ TỔNG QUAN */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '140px', background: '#fff', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #0d6efd', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <div style={{ color: '#6c757d', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Tổng Doanh Thu</div>
                  <div style={{ color: '#0d6efd', fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>{grandTotalRevenue.toLocaleString('vi-VN')} đ</div>
                  <div style={{ color: '#999', fontSize: '10px', marginTop: '3px' }}>= Phòng + Điện nước - Chi phí</div>
                </div>
                <div style={{ flex: 1, minWidth: '140px', background: '#fff', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #198754', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <div style={{ color: '#6c757d', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Từ Tiền Phòng</div>
                  <div style={{ color: '#198754', fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>{totalRoomRevenue.toLocaleString('vi-VN')} đ</div>
                </div>
                <div style={{ flex: 1, minWidth: '140px', background: '#fff', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #0dcaf0', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <div style={{ color: '#6c757d', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Từ Điện Nước</div>
                  <div style={{ color: '#0dcaf0', fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>{totalUtilityRevenue.toLocaleString('vi-VN')} đ</div>
                </div>
                <div style={{ flex: 1, minWidth: '140px', background: '#fff', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #dc3545', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <div style={{ color: '#6c757d', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Khách Đang Nợ</div>
                  <div style={{ color: '#dc3545', fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>{grandTotalDebt.toLocaleString('vi-VN')} đ</div>
                </div>
                <div style={{ flex: 1, minWidth: '140px', background: '#fff', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #e65c00', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <div style={{ color: '#6c757d', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Chi Phí Phát Sinh</div>
                  <div style={{ color: '#e65c00', fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>{totalRepairCost.toLocaleString('vi-VN')} đ</div>
                  <div style={{ color: '#999', fontSize: '10px', marginTop: '3px' }}>{filteredIncidents.length} sự cố</div>
                </div>
              </div>

              {/* DANH SÁCH TỪNG PHÒNG (ACCORDION VIEW) */}
              <div>
                {reportData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '8px', color: '#777' }}>Không tìm thấy phòng nào phù hợp!</div>
                ) : (
                  reportData.map((room, index) => (
                    <div key={room.id} style={{ marginBottom: '20px' }}>
                      
                      <div 
                        onClick={() => toggleRoomAccordion(room.id)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', cursor: 'pointer', background: '#f8f9fa', borderRadius: expandedRooms[room.id] ? '8px 8px 0 0' : '8px', border: '1px solid #ddd', transition: '0.3s' }}
                      >
                        <h3 style={{ fontSize: '18px', margin: 0, color: '#222' }}>
                          {index + 1}. {room.roomNumber} - {room.houseNumber ? `${room.houseNumber}, ` : ''}{room.address}
                          <span style={{ fontSize: '14px', marginLeft: '10px', color: '#666' }}>
                            {expandedRooms[room.id] ? '▲' : '▼'}
                          </span>
                        </h3>
                        <div style={{ fontWeight: 'bold', color: room.roomTotalRevenue > 0 ? '#198754' : '#999' }}>
                          {room.roomTotalRevenue > 0 ? `Đã thu: ${room.roomTotalRevenue.toLocaleString('vi-VN')} đ` : 'Chưa có doanh thu'}
                        </div>
                      </div>

                      {expandedRooms[room.id] && (
                        <div style={{ background: '#fff', border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead style={{ background: '#0d6efd', color: '#fff' }}>
                              <tr>
                                <th style={{ padding: '12px' }}>Kỳ Hóa Đơn</th>
                                <th style={{ padding: '12px' }}>Khách Thuê</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Loại Hóa Đơn</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Trạng Thái</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>Hành động</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* HÀNG HÓA ĐƠN THÔNG THƯỜNG */}
                              {room.bills.map((bill, bIdx) => (
                                <tr key={bill.id} style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
                                  <td style={{ padding: '15px', color: '#555', fontWeight: 'bold' }}>
                                    Tháng {bill.month}/{bill.year}
                                  </td>
                                  <td style={{ padding: '15px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{bill.contract?.tenantName || bill.contract?.tenant?.fullName || 'Không rõ'}</span> <br/>
                                    <span style={{ color: '#666', fontSize: '12px' }}>{bill.contract?.tenantEmail}</span> <br/>
                                    <span style={{ color: '#888', fontSize: '12px' }}>SĐT: {bill.contract?.tenantPhone || bill.contract?.tenant?.phone || '...'}</span>
                                  </td>
                                  <td style={{ padding: '15px', textAlign: 'center' }}>
                                    <span style={{ 
                                      background: bill.billType === 'UTILITY' ? '#d1e7dd' : '#e0e7ff', 
                                      color: bill.billType === 'UTILITY' ? '#0f5132' : '#3730a3', 
                                      padding: '4px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' 
                                    }}>
                                      {bill.billType === 'UTILITY' ? '⚡ Tiền điện nước' : '🏠 Tiền phòng'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '15px', textAlign: 'center' }}>
                                    <span style={{ 
                                      background: bill.status === 'PAID' ? '#d1e7dd' : '#fff3cd', 
                                      color: bill.status === 'PAID' ? '#0f5132' : '#856404', 
                                      padding: '4px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold', border: `1px solid ${bill.status === 'PAID' ? '#badbcc' : '#ffeeba'}`
                                    }}>
                                      {bill.status === 'PAID' ? '✅ Đã thu tiền' : '⏳ Chờ thanh toán'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '15px', textAlign: 'center' }}>
                                    <button 
                                      onClick={() => setViewBillDetails(bill)} 
                                      style={{ background: '#17a2b8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                    >
                                      📄 Xem Hóa Đơn
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
                                  <tr key={`inc-${inc.id}`} style={{ borderBottom: '1px solid #eee', background: '#fff9f0' }}>
                                    <td style={{ padding: '15px', color: '#e65c00', fontWeight: 'bold' }}>
                                      Tháng {incMonth}/{incYear}
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                      <span style={{ fontWeight: 'bold' }}>{inc.tenant?.fullName || 'Không rõ'}</span><br/>
                                      <span style={{ color: '#666', fontSize: '12px' }}>{inc.tenant?.email || 'Không có email'}</span><br/>
                                      <span style={{ color: '#888', fontSize: '12px' }}>SĐT: {inc.tenant?.phone || '...'}</span>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                      <span style={{ background: '#fde8d0', color: '#e65c00', border: '1px solid #ffcc80', padding: '4px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }}>
                                        🔧 Chi phí phát sinh
                                      </span>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                      <span style={{ background: '#d1e7dd', color: '#0f5132', padding: '4px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #badbcc' }}>
                                        ✅ Hoàn thành
                                      </span>
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                      <button
                                        onClick={() => setViewIncidentCostDetails(inc)}
                                        style={{ background: '#17a2b8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                      >
                                        📄 Xem chi tiết
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}

                              {/* Thông báo nếu không có hóa đơn lẫn chi phí */}
                              {room.bills.length === 0 && (room.incidentCosts || []).length === 0 && (
                                <tr>
                                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>
                                    Phòng này chưa có phát sinh hóa đơn nào trong kỳ này.
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
            style={{ background: '#fff', width: '600px', borderRadius: '12px', padding: '30px', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#333',
              maxHeight: '90vh',      // Chiều cao tối đa bằng 90% màn hình
              overflowY: 'auto',      // Tự động hiện thanh cuộn dọc nếu nội dung dài hơn 90vh
              boxSizing: 'border-box'
             }}
            onClick={(e) => e.stopPropagation()} /* Ngăn không cho click bên trong bảng bị tắt */
          >
            
            {/* CÁCH 2: NÚT ✖ Ở GÓC TRÊN CÙNG BÊN PHẢI */}
            <button 
              onClick={() => setViewRoomDetails(null)} 
              style={{ position: 'absolute', top: '15px', right: '20px', background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888', fontWeight: 'bold', transition: '0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#ff4d4d'}
              onMouseLeave={(e) => e.target.style.color = '#888'}
              title="Đóng"
            >
              ✖
            </button>
            
            <h2 style={{ margin: '0 0 20px 0', color: '#0b5ed7', borderBottom: '2px solid #eee', paddingBottom: '10px', textAlign: 'left' }}>
              Thông tin Phòng {viewRoomDetails.roomNumber}
            </h2>

{/* THIẾT KẾ MỚI: 1 ẢNH LỚN TRÁI + LƯỚI 4 ẢNH NHỎ PHẢI (CÓ CHỨC NĂNG) */}
            {viewRoomDetails.images && JSON.parse(viewRoomDetails.images).length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', height: '320px' }}>
                
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
                <p style={{ margin: 0 }}><strong>Giá thuê:</strong> <span style={{ color: 'red', fontWeight: 'bold', fontSize: '18px' }}>{viewRoomDetails.price?.toLocaleString()} đ/tháng</span></p>
                <p style={{ margin: 0 }}><strong>Diện tích:</strong> {viewRoomDetails.area || 0} m²</p>
                <p style={{ margin: 0 }}><strong>Số người ở tối đa:</strong> {viewRoomDetails.maxOccupants} người</p>
                <p style={{ margin: 0 }}><strong>Trạng thái:</strong> <span style={{ color: viewRoomDetails.status === 'AVAILABLE' ? 'green' : viewRoomDetails.status === 'RENTED' ? 'red' : 'orange', fontWeight: 'bold' }}>{viewRoomDetails.status === 'AVAILABLE' ? 'Đang trống' : viewRoomDetails.status === 'RENTED' ? 'Đã cho thuê' : 'Đang sửa chữa'}</span></p>
                <p style={{ margin: 0 }}><strong>Địa chỉ:</strong> {viewRoomDetails.houseNumber ? `${viewRoomDetails.houseNumber}, ` : ''}{viewRoomDetails.address}</p>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '20px', textAlign: 'left' }}>
                <p style={{ margin: 0 }}><strong>Điện:</strong> {viewRoomDetails.electricityPrice ? `${viewRoomDetails.electricityPrice.toLocaleString()} đ/ký` : 'Theo giá nhà nước'}</p>
                <p style={{ margin: 0 }}><strong>Nước:</strong> {viewRoomDetails.waterPrice ? `${viewRoomDetails.waterPrice.toLocaleString()} đ/khối` : 'Theo giá nhà nước'}</p>
                <p style={{ margin: 0 }}><strong>Mạng internet:</strong> {viewRoomDetails.internetPrice ? `${viewRoomDetails.internetPrice.toLocaleString()} đ/tháng` : 'Tự túc'}</p>
                <p style={{ margin: 0 }}><strong>Gửi xe:</strong> {viewRoomDetails.parkingPrice ? `${viewRoomDetails.parkingPrice.toLocaleString()} đ/tháng` : 'Miễn phí'}</p>
                <p style={{ margin: 0 }}><strong>Phí dịch vụ/vệ sinh:</strong> {viewRoomDetails.servicePrice ? `${viewRoomDetails.servicePrice.toLocaleString()} đ/tháng` : 'Miễn phí'}</p>
                <p style={{ margin: 0 }}><strong>Tiện ích có sẵn:</strong><br/>
                  <span style={{ color: '#555' }}>
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
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee', textAlign: 'left' }}>
              <p style={{ margin: '0 0 5px 0' }}><strong>Mô tả chi tiết:</strong></p>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#555', fontSize: '14px' }}>
                {viewRoomDetails.description ? viewRoomDetails.description : <span style={{ fontStyle: 'italic', color: '#999' }}>Chưa có mô tả chi tiết cho phòng này.</span>}
              </p>
            </div>

            {/* CÁC NÚT HÀNH ĐỘNG BÊN DƯỚI */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
              
              {/* CÁCH 3: NÚT "ĐÓNG" RÕ RÀNG Ở DƯỚI CÙNG */}
              <button onClick={() => setViewRoomDetails(null)} style={{ padding: '10px 30px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng</button>

              {/* Nếu là chủ nhà và phòng chưa cho thuê thì hiện thêm Sửa/Xóa */}
              {user.role === 'LANDLORD' && viewRoomDetails.status !== 'RENTED' && (
                 <>
                    <button onClick={() => { setViewRoomDetails(null); handleEditRoomClick(viewRoomDetails); }} style={{ padding: '10px 20px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✏️ Sửa thông tin</button>
                    <button onClick={() => { setViewRoomDetails(null); handleDeleteRoom(viewRoomDetails.id); }} style={{ padding: '10px 20px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Xóa phòng</button>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', width: '500px', borderRadius: '8px', padding: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button onClick={() => setShowTerminateModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            
            <h3 style={{ color: '#dc3545', marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              ⚠️ Thông báo {user.role === 'LANDLORD' ? 'Lấy lại phòng' : 'Trả phòng'}
            </h3>
            
            <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
              Theo quy định, bạn phải báo trước cho {user.role === 'LANDLORD' ? 'khách thuê' : 'chủ nhà'} ít nhất <strong>30 ngày</strong>. 
              Hệ thống sẽ gửi thông báo và đánh dấu phòng vào trạng thái chuẩn bị kết thúc.
            </p>

            <form onSubmit={handleRequestTermination}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Ngày dự kiến dọn đi (Bắt buộc):</label>
                <input 
                  type="date" 
                  required 
                  min={getMinMoveOutDate()} // Ép buộc chỉ được chọn từ 30 ngày sau trở đi
                  value={terminateData.moveOutDate} 
                  onChange={e => setTerminateData({...terminateData, moveOutDate: e.target.value})} 
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Lý do (Tùy chọn):</label>
                <textarea 
                  rows="3" 
                  placeholder={user.role === 'LANDLORD' ? "VD: Cần lấy lại phòng để sửa chữa..." : "VD: Chuyển chỗ làm..."}
                  value={terminateData.reason} 
                  onChange={e => setTerminateData({...terminateData, reason: e.target.value})} 
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ textAlign: 'right' }}>
                <button type="button" onClick={() => setShowTerminateModal(false)} style={{ padding: '10px 20px', marginRight: '10px', background: '#121518ff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Xác nhận gửi thông báo</button>
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
          <div style={{ background: '#1c1c1c', width: '550px', borderRadius: '12px', padding: '30px', border: '1px solid #333', color: '#e0e0e0', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            
            <button 
              onClick={() => { setShowProfileModal(false); setIsEditingProfile(false); setIsChangingPassword(false); }} 
              style={{ position: 'absolute', top: '15px', right: '20px', background: 'transparent', border: 'none', color: '#aaa', fontSize: '20px', cursor: 'pointer' }}
            >✖</button>

            <h2 style={{ textAlign: 'center', margin: '0 0 30px 0', color: '#fff', fontSize: '22px' }}>
              {isChangingPassword ? 'Đổi mật khẩu' : isEditingProfile ? 'Chỉnh sửa thông tin' : 'Thông tin người dùng'}
            </h2>

            {/* NẾU ĐANG Ở CHẾ ĐỘ ĐỔI MẬT KHẨU */}
            {isChangingPassword ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '5px' }}>Mật khẩu hiện tại</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showOldPwd ? "text" : "password"} value={passwordData.oldPassword} onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', boxSizing: 'border-box', paddingRight: '40px' }} />
                    <span onClick={() => setShowOldPwd(!showOldPwd)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}>
                      {showOldPwd ? <EyeIcon /> : <EyeOffIcon />}
                    </span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '5px' }}>Mật khẩu mới (ít nhất 6 ký tự)</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showNewPwd ? "text" : "password"} value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', boxSizing: 'border-box', paddingRight: '40px' }} />
                    <span onClick={() => setShowNewPwd(!showNewPwd)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}>
                      {showNewPwd ? <EyeIcon /> : <EyeOffIcon />}
                    </span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '5px' }}>Xác nhận mật khẩu mới</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirmPwd ? "text" : "password"} value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', boxSizing: 'border-box', paddingRight: '40px' }} />
                    <span onClick={() => setShowConfirmPwd(!showConfirmPwd)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}>
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
                    <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Họ tên</p>
                    {isEditingProfile ? <input type="text" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }} /> : <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.fullName}</p>}
                    <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Số điện thoại</p>
                    {isEditingProfile ? <input type="text" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }} /> : <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.phone || 'Chưa cập nhật'}</p>}
                    <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Ngày sinh</p>
                    {isEditingProfile ? <input type="date" value={profileData.dob} onChange={e => setProfileData({...profileData, dob: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }} /> : <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.dob || 'Chưa cập nhật'}</p>}
                    <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Địa chỉ</p>
                    {isEditingProfile ? <input type="text" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }} /> : <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.address || 'Chưa cập nhật'}</p>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Email (Không thể đổi)</p>
                    <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#666' }}>{user?.email}</p>
                    <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Số CMND/CCCD</p>
                    {isEditingProfile ? <input type="text" value={profileData.identityNumber} onChange={e => setProfileData({...profileData, identityNumber: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }} /> : <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.identityNumber || 'Chưa cập nhật'}</p>}
                  </div>
                </div>
                {/* KHU VỰC NGÂN HÀNG CHỈ HIỆN CHO CHỦ NHÀ NẰM TRỌN TRONG CỘT NÀY */}
                {user?.role === 'LANDLORD' && (
                  <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #555' }}>
                    <p style={{ color: '#0dcaf0', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>💳 Thông tin nhận tiền (VietQR)</p>
                    
                    <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Ngân hàng</p>
                    {isEditingProfile ? (
                      <select value={profileData.bankName} onChange={e => setProfileData({...profileData, bankName: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}>
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

                    <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Số tài khoản</p>
                    {isEditingProfile ? <input type="text" value={profileData.accountNumber} onChange={e => setProfileData({...profileData, accountNumber: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }} /> : <p style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#ffeb3b', fontWeight: 'bold' }}>{user?.accountNumber || 'Chưa cập nhật'}</p>}

                    <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Tên chủ tài khoản</p>
                    {isEditingProfile ? <input type="text" value={profileData.accountHolder} onChange={e => setProfileData({...profileData, accountHolder: e.target.value.toUpperCase()})} placeholder="VIET HOA KHONG DAU" style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }} /> : <p style={{ margin: '0 0 15px 0', fontSize: '15px' }}>{user?.accountHolder || 'Chưa cập nhật'}</p>}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px' }}>
              {isChangingPassword ? (
                <>
                  <button onClick={() => { setIsChangingPassword(false); setPasswordData({oldPassword: '', newPassword: '', confirmPassword: ''}); }} style={{ padding: '10px 20px', background: 'transparent', color: '#ccc', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Hủy bỏ</button>
                  <button onClick={handleSavePassword} style={{ padding: '10px 20px', background: '#ff5a2c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Lưu mật khẩu</button>
                </>
              ) : !isEditingProfile ? (
                <>
                  <button onClick={() => setIsChangingPassword(true)} style={{ padding: '10px 20px', background: 'transparent', color: '#ccc', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đổi mật khẩu</button>
                  <button onClick={() => setIsEditingProfile(true)} style={{ padding: '10px 20px', background: '#0b5ed7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Chỉnh sửa thông tin</button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditingProfile(false)} style={{ padding: '10px 20px', background: 'transparent', color: '#ccc', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Hủy bỏ</button>
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
              style={{ position: 'absolute', top: '15px', right: '20px', background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}
            >✖</button>

            <h2 style={{ marginTop: 0, color: '#0b5ed7', borderBottom: '2px solid #0b5ed7', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📄 Chi tiết Hợp Đồng
              <span style={{ fontSize: '14px', background: viewContract.status === 'ACTIVE' ? '#198754' : '#dc3545', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontWeight: 'normal' }}>
                {viewContract.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã kết thúc'}
              </span>
            </h2>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              {/* BÊN A */}
              <div style={{ flex: 1, background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                <h4 style={{ color: '#333', marginTop: 0 }}>1. Bên A (Chủ nhà)</h4>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Họ tên:</strong> {viewContract.landlordName || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>SĐT:</strong> {viewContract.landlordPhone || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>CCCD:</strong> {viewContract.landlordIdentityNumber || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Ngày sinh:</strong> {viewContract.landlordDob || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Quê quán:</strong> {viewContract.landlordHometown || 'Chưa cập nhật'}</p>
              </div>

              {/* BÊN B */}
              <div style={{ flex: 1, background: '#e6f0fa', padding: '15px', borderRadius: '8px', border: '1px solid #b8daff' }}>
                <h4 style={{ color: '#333', marginTop: 0 }}>2. Bên B (Đại diện thuê)</h4>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Họ tên:</strong> {viewContract.tenantName || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Ngày sinh:</strong> {viewContract.tenantDob || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Email:</strong> {viewContract.tenantEmail}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>SĐT:</strong> {viewContract.tenantPhone || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>CCCD:</strong> {viewContract.tenantIdentityNumber || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Quê quán:</strong> {viewContract.tenantHometown || 'Chưa cập nhật'}</p>
              </div>
            </div>

            {/* THỜI HẠN & TẠM TRÚ */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div style={{ flex: 1, background: '#fff', padding: '15px', borderRadius: '8px', border: '1px dashed #ccc' }}>
                <h4 style={{ color: '#333', marginTop: 0 }}>3. Thời hạn thuê</h4>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Bắt đầu:</strong> <span style={{ color: 'green', fontWeight: 'bold' }}>{viewContract.startDate || '...'}</span></p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Kết thúc:</strong> <span style={{ color: 'red', fontWeight: 'bold' }}>{viewContract.endDate || '...'}</span></p>
              </div>
              <div style={{ flex: 1, background: '#fff', padding: '15px', borderRadius: '8px', border: '1px dashed #ccc' }}>
                <h4 style={{ color: '#333', marginTop: 0 }}>4. Tình trạng Tạm trú</h4>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Trạng thái: </strong> 
                  {viewContract.residenceStatus === 'REGISTERED' 
                    ? <span style={{ color: 'green', fontWeight: 'bold' }}>Đã đăng ký</span> 
                    : <span style={{ color: 'orange', fontWeight: 'bold' }}>Chưa đăng ký</span>}
                </p>
                {viewContract.residenceStatus === 'REGISTERED' && (
                  <>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Ngày ĐK:</strong> {viewContract.residenceDate}</p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Nơi ĐK:</strong> {viewContract.residencePlace}</p>
                  </>
                )}
              </div>
            </div>

            {/* CHI PHÍ ĐÀM PHÁN */}
            <h4 style={{ color: '#333', marginBottom: '10px' }}>5. Chi phí đàm phán (Gốc tính hóa đơn)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeeba' }}>
              <div style={{ fontSize: '14px' }}><strong>Giá phòng:</strong> <span style={{ color: 'red', fontWeight: 'bold' }}>{Number(viewContract.price || 0).toLocaleString('vi-VN')} đ/tháng</span></div>
              <div style={{ fontSize: '14px' }}><strong>Điện:</strong> {Number(viewContract.electricityPrice || 0).toLocaleString('vi-VN')} đ/ký</div>
              <div style={{ fontSize: '14px' }}><strong>Nước:</strong> {Number(viewContract.waterPrice || 0).toLocaleString('vi-VN')} đ/khối</div>
              <div style={{ fontSize: '14px' }}><strong>Internet:</strong> {Number(viewContract.internetPrice || 0).toLocaleString('vi-VN')} đ/tháng</div>
              <div style={{ fontSize: '14px', gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <strong>Số lượng xe:</strong> 
                <span style={{ color: '#0b5ed7', fontWeight: 'bold', fontSize: '16px' }}>{viewContract.vehicleCount} chiếc</span>
                (x {Number(viewContract.parkingPrice || 0).toLocaleString('vi-VN')} đ/xe)
                
                
                
              </div>
            
              <div style={{ fontSize: '14px', gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <strong>Phí vệ sinh/dịch vụ chung:</strong> 
                <span style={{ color: '#0b5ed7', fontWeight: 'bold', fontSize: '16px' }}>{Number(viewContract.servicePrice || 0).toLocaleString('vi-VN')} đ/tháng</span>
                
              
              </div>
            </div>

            {/* THÀNH VIÊN Ở GHÉP */}
            <h4 style={{ color: '#333', marginBottom: '10px' }}>6. Người ở cùng ({viewContract.members ? (typeof viewContract.members === 'string' ? JSON.parse(viewContract.members).length : viewContract.members.length) : 0} người)</h4>
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              {viewContract.members && (typeof viewContract.members === 'string' ? JSON.parse(viewContract.members) : viewContract.members).length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
                      <th style={{ padding: '8px 0' }}>Họ tên</th>
                      <th>Ngày sinh</th>
                      <th>CCCD</th>
                      <th>SĐT</th>
                      <th>Quê quán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(typeof viewContract.members === 'string' ? JSON.parse(viewContract.members) : viewContract.members).map((member, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{member.fullName}</td>
                        <td>{member.dob}</td>
                        <td>{member.identityNumber}</td>
                        <td>{member.phone}</td>
                        <td>{member.hometown}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ margin: 0, fontSize: '14px', color: '#666', fontStyle: 'italic' }}>Không có người ở cùng.</p>
              )}
            </div>
{/* PHẦN 7: ẢNH HỢP ĐỒNG (Bản "Chống đạn" ép kiểu dữ liệu an toàn) */}
            <h4 style={{ color: '#333', marginBottom: '10px' }}>
              7. Ảnh chụp hợp đồng bản cứng
            </h4>
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
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
                          style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #ccc', cursor: 'pointer' }}
                          onClick={() => window.open(`http://localhost:5000/uploads/${fileName}`)} 
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150x100?text=Khong+tim+thay+anh'; }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: '#888', fontStyle: 'italic', textAlign: 'center' }}>
                    * Hợp đồng này chưa được đính kèm ảnh bản cứng (Hoặc ảnh bị lỗi).
                  </p>
                );
              })()}
            </div>
            {/* 8. Ảnh chụp đăng ký tạm trú */}
            <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '20px' }}>
              <h4 style={{ color: '#333', marginTop: 0, textAlign: 'center' }}>8. Ảnh đăng ký tạm trú</h4>
              <div style={{ textAlign: 'center', background: '#f8f9fa', padding: '10px', borderRadius: '6px' }}>
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
                              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer' }}
                              onClick={() => window.open(`http://localhost:5000/uploads/${cleanFileName}`)}
                              onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300x200?text=Khong+tim+thay+anh'; }}
                            />
                          </div>
                         )
                      })}
                    </div>
                  ) : (
                    <p style={{ color: '#888', fontStyle: 'italic', margin: '20px 0' }}>Không có ảnh đăng ký tạm trú đính kèm.</p>
                  );
                })()}
              </div>
            </div>

            {/* 9. Tình trạng phòng bàn giao */}
            <h4 style={{ color: '#333', marginBottom: '10px' }}>9. Tình trạng phòng bàn giao</h4>
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                <strong>Mô tả chi tiết:</strong> {viewContract.conditionDescription || <span style={{ color: '#888', fontStyle: 'italic' }}>Không có mô tả.</span>}
              </p>
              
              {/* Ảnh tình trạng phòng */}
              <div style={{ marginBottom: '15px' }}>
                <strong>Ảnh đính kèm:</strong>
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
                               style={{ height: '100px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #ccc' }} 
                               onClick={() => window.open(`http://localhost:5000/uploads/${cleanName}`)} />
                        )
                      })}
                    </div>
                  ) : <span style={{ marginLeft: '10px', color: '#888', fontStyle: 'italic', fontSize: '13px' }}>Không có ảnh</span>
                })()}
              </div>

              {/* Video tình trạng phòng */}
              <div>
                <strong>Video đính kèm:</strong>
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
                                 style={{ height: '150px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        )
                      })}
                    </div>
                  ) : <span style={{ marginLeft: '10px', color: '#888', fontStyle: 'italic', fontSize: '13px' }}>Không có video</span>
                })()}
              </div>
            </div>
            {/* Nút Đóng */}
            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button onClick={() => setViewContract(null)} style={{ padding: '10px 25px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
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
            style={{ background: '#fff', width: '480px', borderRadius: '12px', padding: '28px', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', color: '#333' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setViewIncidentCostDetails(null)} style={{ position: 'absolute', top: 14, right: 18, background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>✖</button>

            <h3 style={{ margin: '0 0 18px 0', color: '#e65c00', borderBottom: '2px solid #fde8d0', paddingBottom: '10px' }}>
              🔧 Chi Tiết Chi Phí Phát Sinh
            </h3>

            {/* Thông tin sự cố */}
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Sự cố</span>
                <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '3px' }}>{viewIncidentCostDetails.title}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Phòng</span>
                <div style={{ marginTop: '3px' }}>{viewIncidentCostDetails.room?.roomNumber} {viewIncidentCostDetails.room?.roomCode ? `(${viewIncidentCostDetails.room.roomCode})` : ''}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Khách thuê báo cáo</span>
                <div style={{ marginTop: '3px' }}>{viewIncidentCostDetails.tenant?.fullName || 'Không rõ'}</div>
                <div style={{ color: '#888', fontSize: '12px' }}>SĐT: {viewIncidentCostDetails.tenant?.phone || '...'}</div>
              </div>
              <div>
                <span style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Ngày sự cố</span>
                <div style={{ marginTop: '3px' }}>{new Date(viewIncidentCostDetails.createdAt).toLocaleDateString('vi-VN')}</div>
              </div>
            </div>

            {/* Chi phí */}
            <div style={{ background: '#fff3e0', border: '1px solid #ffcc80', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Chi phí phát sinh</span>
                <div style={{ color: '#e65c00', fontWeight: 'bold', fontSize: '24px', marginTop: '4px' }}>
                  {Number(viewIncidentCostDetails.repairCost).toLocaleString('vi-VN')} đ
                </div>
              </div>
              {viewIncidentCostDetails.repairDescription && (
                <div>
                  <span style={{ color: '#888', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Nội dung sửa chữa</span>
                  <div style={{ marginTop: '5px', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#555' }}>
                    {viewIncidentCostDetails.repairDescription}
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setViewIncidentCostDetails(null)} style={{ padding: '10px 24px', background: '#e9ecef', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
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
                    style={{ position: 'absolute', top: '15px', right: '20px', background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888', fontWeight: 'bold' }}
                    title="Đóng"
                  >
                    ✖
                  </button>
                  
                  <h2 style={{ margin: '0 0 25px 0', color: '#856404', borderBottom: '2px solid #ffeeba', paddingBottom: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>🧾 Chi tiết Hóa Đơn</span>
                    <span style={{ fontSize: '14px', background: bill.status === 'PAID' ? '#198754' : '#dc3545', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontWeight: 'normal' }}>
                      {bill.status === 'PAID' ? 'Đã thu tiền' : 'Chờ thanh toán'}
                    </span>
                  </h2>

                  {/* THÔNG TIN KỲ HÓA ĐƠN & PHÒNG & KHÁCH */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '15px', marginBottom: '25px' }}>
                      
                      {/* Thẻ hiển thị Phòng (Dùng Snapshot) */}
                      <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', border: '1px solid #ffeeba', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold', color: '#856404' }}>Tháng {bill.month}/{bill.year}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '15px' }}>
                            <strong>Phòng:</strong> {bill.roomNumberSnapshot || (contract?.room ? `P.${contract.room.roomNumber}` : 'Phòng đã bị xóa')}
                          </p>
                          <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                            📍 Địa chỉ: {contract?.room?.address || 'Chưa cập nhật địa chỉ'}
                          </p>
                      </div>

                      {/* Thẻ hiển thị thông tin Khách Thuê (Dùng Snapshot) */}
                      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '15px', color: '#333' }}>Khách thuê (Người đại diện):</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                            👤 {bill.tenantNameSnapshot || contract?.tenantName || contract?.tenant?.fullName || 'Khách thuê cũ'}
                          </p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}>✉️ {contract?.tenantEmail || 'Không có email'}</p>
                          <p style={{ margin: 0, fontSize: '13px' }}>📞 {contract?.tenantPhone || contract?.tenant?.phone || 'Chưa cập nhật'}</p>
                      </div>
                  </div>

                  {/* BẢNG TÍNH CHI TIẾT ĐÃ ĐƯỢC CHIA TÁCH THÔNG MINH */}
                  <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #eee', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
                    <p style={{ margin: '0 0 18px 0', fontWeight: 'bold', color: '#333', fontSize: '15px' }}>
                      Bảng tính chi tiết ({bill.billType === 'ROOM' ? 'Hóa đơn tiền nhà & Dịch vụ' : (bill.billType === 'UTILITY' ? 'Hóa đơn Điện Nước' : 'Hóa đơn tổng hợp')}):
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '14px', color: '#444' }}>

                      {/* KHỐI 1: CHỈ HIỂN THỊ KHI LÀ HÓA ĐƠN TIỀN NHÀ (ROOM) HOẶC HÓA ĐƠN CŨ CHƯA PHÂN LOẠI */}
                      {(bill.billType === 'ROOM' || !bill.billType) && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '6px' }}><span>Tiền phòng cố định:</span> <strong>{roomAmount.toLocaleString('vi-VN')} đ</strong></div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '6px' }}>
                            <span>Tiền gửi xe ({vehicleCount} xe x {parkingPrice.toLocaleString()}đ):</span> 
                            <strong>{parkingAmount.toLocaleString('vi-VN')} đ</strong>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '6px' }}><span>Mạng Internet:</span> <strong>{internetAmount.toLocaleString('vi-VN')} đ</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: (bill.billType !== 'ROOM' && !bill.billType) ? '1px dashed #eee' : 'none', paddingBottom: '6px' }}><span>Phí dịch vụ chung:</span> <strong>{serviceAmount.toLocaleString('vi-VN')} đ</strong></div>
                        </>
                      )}

                      {/* KHỐI 2: CHỈ HIỂN THỊ KHI LÀ HÓA ĐƠN ĐIỆN NƯỚC (UTILITY) */}
                      {(bill.billType === 'UTILITY' || !bill.billType) && (
                        <>
                          {/* DÒNG ĐIỆN */}
                          <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px dashed #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>Tiền điện ({elecUsage} ký x {elecPrice.toLocaleString()}đ):</span> 
                              <strong>{elecAmount.toLocaleString('vi-VN')} đ</strong>
                            </div>
                            {/* Hiển thị số đầu - số cuối */}
                            <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                              (Chỉ số đồng hồ: {bill.oldElectricity ?? '?'} ➡️ {bill.newElectricity ?? '?'})
                            </div>
                          </div>
                          
                          {/* DÒNG NƯỚC */}
                          <div style={{ display: 'flex', flexDirection: 'column', borderBottom: 'none', paddingBottom: '0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>Tiền nước ({waterUsage} khối x {waterPrice.toLocaleString()}đ):</span> 
                              <strong>{waterAmount.toLocaleString('vi-VN')} đ</strong>
                            </div>
                            {/* Hiển thị số đầu - số cuối */}
                            <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                              (Chỉ số đồng hồ: {bill.oldWater ?? '?'} ➡️ {bill.newWater ?? '?'})
                            </div>
                          </div>
                        </>
                      )}

                    </div>
                    
                    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '2px dashed #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                        {bill.billType === 'ROOM' ? 'TỔNG TIỀN NHÀ:' : (bill.billType === 'UTILITY' ? 'TỔNG ĐIỆN NƯỚC:' : 'TỔNG CỘNG:')}
                      </span>
                      <span style={{ fontSize: '26px', fontWeight: 'bold', color: 'red' }}>{calculatedTotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>

                  {/* CÁC NÚT HÀNH ĐỘNG BÊN DƯỚI */}
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                    <button onClick={() => setViewBillDetails(null)} style={{ padding: '10px 35px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng</button>
                    {/* Thêm nút đánh dấu đã thanh toán nếu cần */}
                    {bill.status === 'UNPAID' && user.role === 'LANDLORD' && (
                        <button onClick={() => handlePayBill(bill.id).then(() => setViewBillDetails(null))} style={{ padding: '10px 25px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✅ Xác nhận đã thu tiền</button>
                    )}
                  </div>
                  
                  {/* ========================================================= */}
                  {/* GIAO DIỆN KHÁCH THUÊ: QUÉT QR VÀ UPLOAD ẢNH MINH CHỨNG      */}
                  {/* ========================================================= */}
                  {user.role === 'TENANT' && bill.status === 'UNPAID' && (
                    <div style={{ textAlign: 'center', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '2px dashed #0b5ed7', marginBottom: '25px' }}>
                      <h4 style={{ margin: '0 0 15px 0', color: '#0b5ed7', fontSize: '18px' }}>Mã QR Thanh Toán Tự Động</h4>
                      
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
                            style={{ width: '250px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                          />
                        );
                      })()}
                      <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
                        * Hãy dùng App Ngân hàng hoặc MoMo/ZaloPay để quét mã.<br/>
                        
                      </p>

                      <div style={{ borderTop: '1px solid #ddd', paddingTop: '15px', textAlign: 'left' }}>
                        <h5 style={{ margin: '0 0 10px 0', color: '#333' }}>Tải lên ảnh chụp màn hình chuyển khoản (Tối đa 3 ảnh):</h5>
                        <input 
                          type="file" multiple accept="image/*"
                          onChange={(e) => {
                            if (e.target.files.length > 3) {
                              alert("Chỉ được chọn tối đa 3 ảnh!"); e.target.value = null;
                            } else { setProofFiles(e.target.files); }
                          }}
                          style={{ marginBottom: '10px', width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff' }}
                        />
                        <button 
                          onClick={() => handleUploadProof(bill.id)} 
                          style={{ width: '100%', padding: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
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
                    <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #ffeeba' }}>
                      <p style={{ color: '#856404', fontWeight: 'bold', margin: '0 0 15px 0', fontSize: '16px' }}>
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
                                style={{ width: '120px', height: '180px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '1px solid #ccc', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} 
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
                        style={{ width: '100%', background: '#198754', color: '#fff', border: 'none', padding: '15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ✅ XÁC NHẬN ĐÃ NHẬN ĐỦ TIỀN
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
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
      {/* MODAL GHI CHÚ NHẬN CỌC / GIỮ CHỖ */}
      {depositModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', width: '450px', borderRadius: '8px', padding: '25px', position: 'relative' }}>
            <h3 style={{ color: '#0b5ed7', marginTop: 0 }}>🔒 Ghi chú Nhận cọc / Giữ chỗ</h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
              Khi bạn lưu ghi chú này, phòng sẽ lập tức bị <strong>ẩn khỏi Trang chủ</strong> (người lạ không thấy nữa). Khách cũ vẫn sinh hoạt bình thường cho đến khi dọn đi.
            </p>
            <form onSubmit={handleSaveDeposit}>
              <textarea 
                rows="4" 
                placeholder="Ví dụ: Anh Hưng số 098... cọc 2 triệu, hẹn mùng 5/6 chuyển vào..."
                value={depositModal.note}
                onChange={e => setDepositModal({...depositModal, note: e.target.value})}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', marginBottom: '15px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button 
                  type="button" 
                  onClick={handleDeleteDeposit} 
                  style={{ padding: '8px 15px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  🗑️ Xóa cọc (Mở lại phòng)
                </button>
                <div>
                  <button type="button" onClick={() => setDepositModal({ show: false, roomId: null, note: '' })} style={{ padding: '8px 15px', marginRight: '10px', cursor: 'pointer' }}>Hủy</button>
                  <button type="submit" style={{ padding: '8px 15px', background: '#198754', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>💾 Lưu Ghi Chú</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

{/* ========================================================= */}
      {/* MODAL KHÁCH THUÊ ĐÁNH GIÁ PHÒNG (SHOPEE STYLE)              */}
      {/* ========================================================= */}
      {showReviewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', width: '500px', borderRadius: '8px', padding: '25px', position: 'relative', boxShadow: '0 5px 25px rgba(0,0,0,0.3)' }}>
            <button onClick={() => setShowReviewModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>✖</button>
            
            <h3 style={{ color: '#ee4d2d', marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {reviewData.comment ? '👁️ Xem & Cập nhật đánh giá' : '⭐ Đánh giá trải nghiệm thuê phòng'}
            </h3>

            <form onSubmit={handleSubmitReview}>
              
              {/* 🚨 HIỂN THỊ PHẢN HỒI CỦA CHỦ NHÀ NẾU CÓ 🚨 */}
              {reviewData.landlordReply && (
                <div style={{ background: '#e6f0fa', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #0b5ed7', marginBottom: '20px', textAlign: 'left' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold', color: '#0b5ed7' }}>💬 Phản hồi từ Chủ nhà:</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#333', lineHeight: '1.5' }}>{reviewData.landlordReply}</p>
                </div>
              )}

              {/* Chọn Sao */}
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#555' }}>Chất lượng phòng & Chủ nhà</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '35px', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star} 
                      onClick={() => setReviewData({...reviewData, rating: star})}
                      style={{ color: star <= reviewData.rating ? '#ffc107' : '#e0e0e0', transition: '0.2s' }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '13px', color: '#ee4d2d', marginTop: '5px', fontWeight: 'bold' }}>
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
                  style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '4px', color: '#333', boxSizing: 'border-box', backgroundColor: '#f9f9f9', fontSize: '14px', fontFamily: 'inherit' }}
                />
              </div>

              {/* Upload Ảnh/Video */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>
                  {reviewData.comment ? 'Tải lên ảnh/video mới (Sẽ ghi đè ảnh cũ):' : 'Thêm Hình ảnh / Video minh chứng:'}
                </label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*"
                  onChange={(e) => setReviewFiles(Array.from(e.target.files))}
                  style={{ width: '100%', padding: '8px', border: '1px dashed #ee4d2d', borderRadius: '4px', background: '#fffcfb', boxSizing: 'border-box', color: '#ee4d2d' }}
                />
              </div>

              {/* Ẩn danh */}
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                <input 
                  type="checkbox" 
                  id="isAnon"
                  checked={reviewData.isAnonymous} 
                  onChange={e => setReviewData({...reviewData, isAnonymous: e.target.checked})} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isAnon" style={{ fontSize: '13px', cursor: 'pointer', color: '#555', flex: 1 }}>
                  Hiển thị ẩn danh (Tên của bạn trên Trang chủ sẽ hiện là <strong>{user?.fullName?.charAt(0) || 'K'}******</strong>)
                </label>
              </div>

              {/* Nút gửi tự động đổi text */}
              <button type="submit" style={{ width: '100%', padding: '12px', background: '#ee4d2d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase' }}>
                {reviewData.comment ? 'CẬP NHẬT ĐÁNH GIÁ' : 'GỬI ĐÁNH GIÁ'}
              </button>
            </form>
          </div>
        </div>
      
      )}
    </div>

  );
};

export default Dashboard;
