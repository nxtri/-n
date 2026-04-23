import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import roomApi from '../api/roomApi';
import axiosClient from '../api/axiosClient';

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
const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const navigate = useNavigate();
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  
  // Hàm vẽ sao đánh giá (Hỗ trợ sao lẻ chính xác đến 1 chữ số thập phân)
  const renderStars = (rating, idPrefix = 'home') => {
    const stars = [];
    const absoluteRating = Number(rating) || 0;
    const roundedRating = Math.round(absoluteRating * 10) / 10; // Làm tròn tới 0.1 (vd: 3.1, 3.2...)
    
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(roundedRating)) {
        // Sao vàng đầy
        stars.push(
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" style={{ marginRight: '2px' }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      } else if (i === Math.ceil(roundedRating) && roundedRating % 1 !== 0) {
        // Sao vàng phần lẻ (Fractional Star)
        const fraction = (roundedRating - Math.floor(roundedRating)) * 100;
        stars.push(
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: '2px' }}>
            <defs>
              <linearGradient id={`grad-${idPrefix}-${i}`}>
                <stop offset={`${fraction}%`} stopColor="#f59e0b" />
                <stop offset={`${fraction}%`} stopColor="#e4e4e4" />
              </linearGradient>
            </defs>
            <path fill={`url(#grad-${idPrefix}-${i})`} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      } else {
        // Sao xám rỗng
        stars.push(
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#e4e4e4" style={{ marginRight: '2px' }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      }
    }
    return stars;
  };

  // ==========================================
  // STATE CHO TÌM KIẾM NHANH (Ở ngoài)
  // ==========================================
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLocation, setActiveLocation] = useState('Tất cả');
  const [activeType, setActiveType] = useState('all');

  // ==========================================
  // STATE CHO MODAL BỘ LỌC CHUYÊN SÂU
  // ==========================================
  const [showFilterModal, setShowFilterModal] = useState(false);
  // State cho Menu Tài khoản & Profile
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  // State để chuyển đổi giữa chế độ "Xem" và "Sửa"
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // State chứa dữ liệu đang nhập trong form
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '', phone: user?.phone || '',
    dob: user?.dob || '', address: user?.address || '', identityNumber: user?.identityNumber || '',
    bankName: user?.bankName || 'MB', accountNumber: user?.accountNumber || '', accountHolder: user?.accountHolder || ''
  });
  // State cho Đổi mật khẩu
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '', newPassword: '', confirmPassword: ''
  });
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Ref để xử lý click ra ngoài để tắt dropdown
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Hàm Lưu thông tin
  const handleSaveProfile = async () => {
    try {
      const response = await axiosClient.put('/auth/profile', profileData);
      localStorage.setItem('user', JSON.stringify(response.user)); // Cập nhật bộ nhớ đệm
      alert('Cập nhật thông tin thành công!');
      setIsEditingProfile(false);
      window.location.reload(); // Tải lại trang để thấy kết quả
    } catch (error) {
      alert('Lỗi khi cập nhật thông tin!');
    }
  };
  // Hàm xử lý Lưu Mật Khẩu Mới
  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return alert('Mật khẩu mới không khớp nhau!');
    }
    if (passwordData.newPassword.length < 6) {
      return alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
    }

    try {
      await axiosClient.put('/auth/change-password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      
      alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      // Xóa bộ nhớ và bắt đăng nhập lại vì mật khẩu đã đổi
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login'; 
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi đổi mật khẩu!');
    }
  };

  // Hàm Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.reload(); // Tải lại trang để về trạng thái Khách
  };
  
  // State lưu trữ Tạm thời (Chỉ áp dụng khi bấm nút "Áp dụng")
  const [tempLocation, setTempLocation] = useState({ province: '', district: '', ward: '' });
  const [tempPrice, setTempPrice] = useState('all');
  const [tempArea, setTempArea] = useState('all');
  const [tempAmenities, setTempAmenities] = useState([]);

  // Data cho Dropdown Địa chỉ
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  // Load danh sách Tỉnh/Thành khi mở Modal
  useEffect(() => {
    if (showFilterModal && provinces.length === 0) {
      axios.get('https://provinces.open-api.vn/api/v2/p/').then(res => setProvinces(res.data));
    }
  }, [showFilterModal, provinces.length]);

  // Load Dữ liệu phòng ban đầu
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await roomApi.getPublicRooms();
        
        setRooms(response.rooms);
        setFilteredRooms(response.rooms);
      } catch (error) {
        console.error('Lỗi tải phòng', error);
      }
    };
    fetchRooms();
  }, []);

  // ==========================================
  // HÀM XỬ LÝ LỌC DỮ LIỆU CHÍNH
  // ==========================================
  const applyFilters = () => {
    let result = rooms;

    // 1. Lọc theo thanh tìm kiếm & Nút nhanh
    if (activeLocation !== 'Tất cả') result = result.filter(r => r.address && r.address.includes(activeLocation));
    if (activeType !== 'all') result = result.filter(r => r.roomType === activeType);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.address && r.address.toLowerCase().includes(term)) || 
        (r.roomCode && r.roomCode.toLowerCase().includes(term))
      );
    }

    // // 2. Lọc theo Địa chỉ trong Modal
    if (tempLocation.province) result = result.filter(r => r.address.includes(tempLocation.province));
    if (tempLocation.ward) result = result.filter(r => r.address.includes(tempLocation.ward));


    // 4. Lọc theo Giá
    switch(tempPrice) {
      case '<1': result = result.filter(r => r.price < 1000000); break;
      case '1-2': result = result.filter(r => r.price >= 1000000 && r.price <= 2000000); break;
      case '2-3': result = result.filter(r => r.price >= 2000000 && r.price <= 3000000); break;
      case '3-5': result = result.filter(r => r.price > 3000000 && r.price <= 5000000); break;
      case '5-7': result = result.filter(r => r.price > 5000000 && r.price <= 7000000); break;
      case '7-10': result = result.filter(r => r.price > 7000000 && r.price <= 10000000); break;
      case '>15': result = result.filter(r => r.price > 15000000); break;
      default: break;
    }

    

    // 5. Lọc theo Khoảng Diện Tích (MỚI THÊM)
    switch(tempArea) {
      case '<20': result = result.filter(r => r.area && r.area < 20); break;
      case '20-30': result = result.filter(r => r.area && r.area >= 20 && r.area <= 30); break;
      case '30-50': result = result.filter(r => r.area && r.area > 30 && r.area <= 50); break;
      case '50-70': result = result.filter(r => r.area && r.area > 50 && r.area <= 70); break;
      case '70-90': result = result.filter(r => r.area && r.area > 70 && r.area <= 90); break;
      case '>90': result = result.filter(r => r.area && r.area > 90); break;
      default: break;
    }

    // 6. Lọc Tiện ích (CẬP NHẬT THÊM NÓNG LẠNH)
    if (tempAmenities.includes('hasElevator')) result = result.filter(r => r.hasElevator);
    if (tempAmenities.includes('hasWashingMachine')) result = result.filter(r => r.hasWashingMachine);
    if (tempAmenities.includes('hasFridge')) result = result.filter(r => r.hasFridge);
    if (tempAmenities.includes('hasKitchen')) result = result.filter(r => r.hasKitchen);
    if (tempAmenities.includes('hasHeater')) result = result.filter(r => r.hasHeater);

    setFilteredRooms(result);
    setShowFilterModal(false); // Đóng modal
  };

  // Tự động chạy lọc nhanh khi đổi nút Tỉnh/Thành/Loại hình bên ngoài
  useEffect(() => { applyFilters(); }, [activeLocation, activeType, searchTerm]);

  // ==========================================
  // COMPONENT NÚT BẤM (PILL BUTTON) DÀNH RIÊNG CHO MODAL
  // ==========================================
  const FilterPill = ({ label, value, currentVal, onClick, isMulti = false }) => {
    const isActive = isMulti ? currentVal.includes(value) : currentVal === value;
    return (
      <button
        onClick={() => {
          if (isMulti) {
            onClick(isActive ? currentVal.filter(v => v !== value) : [...currentVal, value]);
          } else {
            onClick(value);
          }
        }}
        style={{
          background: isActive ? '#eff6ff' : '#ffffff',
          border: isActive ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
          color: isActive ? '#2563eb' : '#64748b',
          padding: '10px 20px',
          borderRadius: '12px',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          fontSize: '14px',
          fontWeight: '500',
          outline: 'none',
          transition: 'all 0.2s',
          boxShadow: isActive ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
        }}
      >
        {label}
        {isActive && (
          <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderTop: '20px solid #2563eb', borderLeft: '20px solid transparent' }}>
            <span style={{ absolute: 'absolute', top: '-18px', right: '1px', color: 'white', fontSize: '10px', fontWeight: 'bold' }}>✓</span>
          </div>
        )}
      </button>
    );
  };

  // Cấu hình Data cho các nút
  const PRICE_RANGES = [
    { label: 'Tất cả', val: 'all' }, { label: 'Dưới 1 triệu', val: '<1' }, { label: '1 - 2 triệu', val: '1-2' },
    { label: '2 - 3 triệu', val: '2-3' }, { label: '3 - 5 triệu', val: '3-5' }, { label: '5 - 7 triệu', val: '5-7' },
    { label: '7 - 10 triệu', val: '7-10' }, { label: '10 - 15 triệu', val: '10-15' }, { label: 'Trên 15 triệu', val: '>15' }
  ];
  const AREA_RANGES = [
    { label: 'Tất cả', val: 'all' }, { label: 'Dưới 20m²', val: '<20' }, { label: 'Từ 20m² - 30m²', val: '20-30' },
    { label: 'Từ 30m² - 50m²', val: '30-50' }, { label: 'Từ 50m² - 70m²', val: '50-70' }, { label: 'Từ 70m² - 90m²', val: '70-90' }, { label: 'Trên 90m²', val: '>90' }
  ];
  const AMENITIES_LIST = [
    { label: 'Thang máy', val: 'hasElevator' }, { label: 'Máy giặt', val: 'hasWashingMachine' }, 
    { label: 'Tủ lạnh', val: 'hasFridge' }, { label: 'Bếp nấu', val: 'hasKitchen' }, 
    { label: 'Nóng lạnh', val: 'hasHeater' }
  ];
  const ROOM_TYPES = [
    { label: 'Tất cả', val: 'all' }, { label: 'Phòng trọ', val: 'SINGLE' }, { label: 'Nhà nguyên căn', val: 'WHOLE_HOUSE' }
  ];

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-200">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center h-20 px-8">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-2xl font-black text-blue-600 tracking-tighter hover:opacity-80 transition-all">PHONGTROSIEUCAP</Link>
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => { setActiveType('all'); setActiveLocation('Tất cả'); setSearchTerm(''); }}
                className={`${activeType === 'all' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent'} font-bold border-b-2 pb-1 text-label-md transition-all`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => setActiveType('SINGLE')}
                className={`${activeType === 'SINGLE' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent'} hover:text-blue-600 font-label-md text-label-md transition-all`}
              >
                Phòng trọ
              </button>
              <button 
                onClick={() => setActiveType('WHOLE_HOUSE')}
                className={`${activeType === 'WHOLE_HOUSE' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent'} hover:text-blue-600 font-label-md text-label-md transition-all`}
              >
                Nhà nguyên căn
              </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-gray-600 hover:text-primary transition-all font-label-md text-label-md"
                  >
                    <span className="material-symbols-outlined">dashboard</span>
                    Quản lý
                  </button>

                  <div className="relative" ref={userDropdownRef}>
                    <button 
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant/30 hover:bg-surface-container-high transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center font-bold text-on-primary-fixed text-sm">
                        {user.fullName?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm font-semibold text-on-surface truncate max-w-[100px]">
                        {user.fullName}
                      </span>
                      <span className="material-symbols-outlined text-sm">expand_more</span>
                    </button>

                    {showDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-outline-variant/20 py-2 z-50">
                        <button 
                          onClick={() => { setShowProfileModal(true); setShowDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-all flex items-center gap-3"
                        >
                          <span className="material-symbols-outlined text-lg">person</span>
                          Hồ sơ cá nhân
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container/20 transition-all flex items-center gap-3"
                        >
                          <span className="material-symbols-outlined text-lg">logout</span>
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>

                  {user.role === 'LANDLORD' && (
                    <button 
                      onClick={() => navigate('/dashboard', { state: { targetTab: 'ADD_ROOM' } })}
                      className="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-lg text-label-md hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">add_circle</span>
                      Đăng tin
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <button onClick={() => navigate('/login')} className="text-gray-600 font-label-md text-label-md hover:text-primary transition-all">Đăng nhập</button>
                  <button onClick={() => navigate('/register')} className="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-lg text-label-md hover:opacity-90 transition-all active:scale-95">Đăng ký</button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mt-20 flex-grow">
        {/* Hero Section */}
        <section className="relative bg-surface-container-low py-16 overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-8 relative z-10 text-center py-12">
            <h1 className="font-display-xl text-display-xl text-on-surface mb-8 max-w-2xl mx-auto tracking-tight">
              Tìm kiếm phòng trọ sinh viên lý tưởng
            </h1>
            
            {/* Advanced Search Bar */}
            <div className="max-w-4xl mx-auto bg-white p-2 rounded-full shadow-2xl flex flex-col md:flex-row items-center gap-2 border border-outline-variant/30">
              <div className="flex-1 flex items-center gap-3 px-6 md:border-r border-outline-variant/30 w-full md:w-auto">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <input 
                  type="text" 
                  placeholder="Bạn muốn tìm ở đâu?" 
                  className="w-full bg-transparent border-none focus:ring-0 text-body-md text-on-surface"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex-1 flex items-center gap-3 px-6 md:border-r border-outline-variant/30 w-full md:w-auto">
                <span className="material-symbols-outlined text-primary">home</span>
                <select 
                  className="w-full bg-transparent border-none focus:ring-0 text-body-md text-on-surface cursor-pointer"
                  value={activeType}
                  onChange={(e) => setActiveType(e.target.value)}
                >
                  <option value="all">Loại bất động sản</option>
                  <option value="SINGLE">Phòng trọ</option>
                  <option value="WHOLE_HOUSE">Nhà nguyên căn</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pr-2 w-full md:w-auto justify-end">
                <button 
                  onClick={() => setShowFilterModal(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full hover:bg-surface-container transition-colors font-label-md text-label-md text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-xl">tune</span>
                  Lọc
                </button>
                <button 
                  onClick={applyFilters}
                  className="bg-primary text-on-primary px-10 py-3 rounded-full font-label-md text-label-md font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 rounded-l-full blur-3xl -z-0"></div>
          <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-secondary/5 rounded-r-full blur-3xl -z-0"></div>
        </section>

        {/* Quick Filters */}
        <section className="max-w-[1280px] mx-auto px-8 py-8">
          <div className="flex flex-wrap items-center gap-3">
            {['Tất cả', 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Bình Dương'].map(loc => (
              <button 
                key={loc}
                onClick={() => setActiveLocation(loc)}
                className={`px-6 py-2 rounded-full transition-all text-label-md font-semibold ${
                  activeLocation === loc 
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                    : 'bg-white border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </section>

        {/* Listing Section */}
        <section className="max-w-[1280px] mx-auto px-8 pb-20">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Kết quả tìm kiếm</h2>
              <p className="text-on-surface-variant font-body-md mt-1">
                Có {filteredRooms.length} tin đăng phù hợp với yêu cầu của bạn
              </p>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRooms.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">search_off</span>
                <p className="text-xl text-on-surface-variant">Không tìm thấy phòng nào phù hợp.</p>
              </div>
            ) : filteredRooms.map((room) => {
              let images = [];
              try { images = JSON.parse(room.images) || []; } catch(e) {}
              const firstImage = images.length > 0 ? `http://localhost:5000/uploads/${images[0]}` : "https://via.placeholder.com/400x300?text=Chua+Co+Anh";

              return (
                <article 
                  key={room.id}
                  className="bg-white rounded-2xl overflow-hidden custom-shadow card-hover transition-all duration-300 border border-outline-variant/10 flex flex-col group cursor-pointer"
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  <div className="relative h-60 overflow-hidden">
                    <img 
                      src={firstImage} 
                      alt={room.roomNumber} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      {room.status === 'AVAILABLE' ? (
                        <div className="px-3 py-1 bg-secondary text-on-secondary text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">Trống</div>
                      ) : (
                        <div className="px-3 py-1 bg-tertiary text-on-tertiary text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">Sắp trống</div>
                      )}
                    </div>
                    <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-on-surface-variant hover:text-error transition-all hover:bg-white active:scale-90">
                      <span className="material-symbols-outlined text-xl">favorite</span>
                    </button>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-headline-md text-headline-md text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {room.roomType === 'WHOLE_HOUSE' ? 'NHÀ NGUYÊN CĂN' : 'PHÒNG TRỌ'} {room.roomNumber} {room.roomCode && `(Mã: ${room.roomCode})`}
                      </h3>
                      {room.reviewCount > 0 && (
                        <div className="flex items-center gap-1 text-tertiary bg-tertiary-fixed/30 px-2 py-0.5 rounded-md">
                          <span className="material-symbols-outlined text-lg fill-current">star</span>
                          <span className="font-bold text-sm">{room.avgRating}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-primary font-price-tag text-xl mb-4">
                      {room.price?.toLocaleString()} đ<span className="text-sm font-normal text-on-surface-variant">/tháng</span>
                    </p>

                    <div className="flex items-center gap-4 text-on-surface-variant text-sm mb-6 pb-6 border-b border-outline-variant/20">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-lg text-primary">square_foot</span>
                        {room.area} m²
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-lg text-primary">group</span>
                        {room.maxOccupants} người
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                        {room.address?.split(',').slice(-2).join(',')}
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary-fixed-dim flex items-center justify-center font-bold text-on-secondary-fixed shadow-inner">
                          {room.landlord?.fullName?.charAt(0) || 'L'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">{room.landlord?.fullName}</p>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-tight">Chủ sở hữu</p>
                        </div>
                      </div>
                      <button className="bg-surface-container text-primary font-bold px-5 py-2.5 rounded-xl text-sm border border-primary/10 hover:bg-primary hover:text-on-primary transition-all shadow-sm">
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 bg-white border-t border-gray-100">
        <div className="max-w-[1280px] mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-6">
            <p className="text-2xl font-black text-blue-600 tracking-tighter">PHONGTROSIEUCAP</p>
            <p className="text-on-surface-variant leading-relaxed font-body-sm">
              Nền tảng tìm kiếm và cho thuê phòng trọ hàng đầu dành cho sinh viên Việt Nam. Uy tín, nhanh chóng và hiệu quả.
            </p>
          </div>
          <div>
            <p className="font-bold text-on-surface mb-6 uppercase tracking-wider text-xs">Về chúng tôi</p>
            <ul className="space-y-3">
              <li><Link to="#" className="text-on-surface-variant hover:text-primary transition-all text-sm">Giới thiệu</Link></li>
              <li><Link to="#" className="text-on-surface-variant hover:text-primary transition-all text-sm">Điều khoản dịch vụ</Link></li>
              <li><Link to="#" className="text-on-surface-variant hover:text-primary transition-all text-sm">Chính sách bảo mật</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-on-surface mb-6 uppercase tracking-wider text-xs">Hỗ trợ</p>
            <ul className="space-y-3">
              <li><Link to="#" className="text-on-surface-variant hover:text-primary transition-all text-sm">Trung tâm trợ giúp</Link></li>
              <li><Link to="#" className="text-on-surface-variant hover:text-primary transition-all text-sm">Liên hệ hỗ trợ</Link></li>
              <li><Link to="#" className="text-on-surface-variant hover:text-primary transition-all text-sm">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-on-surface mb-6 uppercase tracking-wider text-xs">Liên hệ</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-primary text-xl">mail</span>
                support@phongtrosieucap.vn
              </div>
              <div className="flex items-center gap-3 text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-primary text-xl">phone</span>
                1900 1234
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto px-8 mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-on-surface-variant text-sm">© 2024 PHONGTROSIEUCAP. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="material-symbols-outlined cursor-pointer text-outline hover:text-primary transition-all" title="Language">public</span>
            <span className="material-symbols-outlined cursor-pointer text-outline hover:text-primary transition-all" title="Share">share</span>
            <span className="material-symbols-outlined cursor-pointer text-outline hover:text-primary transition-all" title="Like">thumb_up</span>
          </div>
        </div>
      </footer>

      {/* Filter Modal (Styled with Tailwind) */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
          <div className="bg-white w-full max-w-[650px] max-h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>
                Bộ lọc nâng cao
              </h3>
              <button 
                onClick={() => setShowFilterModal(false)}
                className="w-10 h-10 rounded-full hover:bg-surface-container transition-all flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-10">
              {/* Khu vực */}
              <div className="space-y-4">
                <h4 className="font-bold text-on-surface text-sm uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                  Lọc theo khu vực
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant px-1">Thành phố / Tỉnh</label>
                    <select 
                      className="w-full p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      onChange={(e) => {
                        const code = e.target.value;
                        const name = e.target.options[e.target.selectedIndex].text;
                        setTempLocation({ province: code ? name : '', ward: '' });
                        if (code) {
                          axios.get(`https://provinces.open-api.vn/api/v2/p/${code}?depth=2`)
                            .then(res => setWards(res.data.wards || []));
                        } else {
                          setWards([]);
                        }
                      }}
                    >
                      <option value="">Toàn quốc</option>
                      {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant px-1">Phường / Xã</label>
                    <select 
                      disabled={!tempLocation.province}
                      className="w-full p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      onChange={(e) => setTempLocation({ ...tempLocation, ward: e.target.value ? e.target.options[e.target.selectedIndex].text : '' })}
                    >
                      <option value="">Tất cả</option>
                      {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Khoảng giá */}
              <div className="space-y-4">
                <h4 className="font-bold text-on-surface text-sm uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                  Khoảng giá (VND)
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {PRICE_RANGES.map(item => (
                    <button
                      key={item.val}
                      onClick={() => setTempPrice(item.val)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                        tempPrice === item.val 
                        ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20' 
                        : 'bg-white border-outline-variant/30 text-on-surface-variant hover:border-primary/50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Khoảng diện tích */}
              <div className="space-y-4">
                <h4 className="font-bold text-on-surface text-sm uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                  Diện tích (m²)
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {AREA_RANGES.map(item => (
                    <button
                      key={item.val}
                      onClick={() => setTempArea(item.val)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                        tempArea === item.val 
                        ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20' 
                        : 'bg-white border-outline-variant/30 text-on-surface-variant hover:border-primary/50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiện ích */}
              <div className="space-y-4">
                <h4 className="font-bold text-on-surface text-sm uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                  Tiện ích đi kèm
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {AMENITIES_LIST.map(item => {
                    const isActive = tempAmenities.includes(item.val);
                    return (
                      <button
                        key={item.val}
                        onClick={() => {
                          setTempAmenities(isActive ? tempAmenities.filter(v => v !== item.val) : [...tempAmenities, item.val]);
                        }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border flex items-center gap-2 ${
                          isActive 
                          ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20' 
                          : 'bg-white border-outline-variant/30 text-on-surface-variant hover:border-primary/50'
                        }`}
                      >
                        {isActive && <span className="material-symbols-outlined text-sm">check_circle</span>}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 bg-surface-container-low border-t border-outline-variant/20 flex gap-4">
              <button 
                onClick={() => {
                  setTempPrice('all'); setTempArea('all'); setTempAmenities([]); setTempLocation({ province: '', ward: '' });
                }}
                className="flex-1 py-4 text-on-surface font-bold hover:bg-surface-container transition-all rounded-2xl border border-outline-variant/30"
              >
                Đặt lại
              </button>
              <button 
                onClick={applyFilters}
                className="flex-[2] py-4 bg-primary text-on-primary font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                Áp dụng lọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal (Tailwind Style) */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
          <div className="bg-white w-full max-w-[550px] rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/20 animate-in fade-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 relative">
              <button 
                onClick={() => { setShowProfileModal(false); setIsEditingProfile(false); setIsChangingPassword(false); }}
                className="absolute top-6 right-6 w-9 h-9 rounded-full hover:bg-surface-container transition-all flex items-center justify-center text-outline"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <h2 className="text-2xl font-bold text-on-surface text-center mb-8">
                {isChangingPassword ? '🔐 Đổi mật khẩu' : isEditingProfile ? '✍️ Cập nhật hồ sơ' : '👤 Thông tin cá nhân'}
              </h2>

              {isChangingPassword ? (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-on-surface-variant px-1">Mật khẩu hiện tại</label>
                    <div className="relative">
                      <input 
                        type={showOldPwd ? "text" : "password"} 
                        className="w-full p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                        value={passwordData.oldPassword}
                        onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})}
                      />
                      <button 
                        onClick={() => setShowOldPwd(!showOldPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline"
                      >
                        <span className="material-symbols-outlined">{showOldPwd ? 'visibility' : 'visibility_off'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-on-surface-variant px-1">Mật khẩu mới</label>
                    <div className="relative">
                      <input 
                        type={showNewPwd ? "text" : "password"} 
                        className="w-full p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                        value={passwordData.newPassword}
                        onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                      />
                      <button 
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline"
                      >
                        <span className="material-symbols-outlined">{showNewPwd ? 'visibility' : 'visibility_off'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-on-surface-variant px-1">Xác nhận mật khẩu mới</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPwd ? "text" : "password"} 
                        className="w-full p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                        value={passwordData.confirmPassword}
                        onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      />
                      <button 
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline"
                      >
                        <span className="material-symbols-outlined">{showConfirmPwd ? 'visibility' : 'visibility_off'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Họ và tên</label>
                        {isEditingProfile ? (
                          <input type="text" className="w-full p-3 bg-surface-container border-b-2 border-primary rounded-lg outline-none" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} />
                        ) : (
                          <p className="p-3 text-lg font-semibold text-on-surface">{user?.fullName}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Số điện thoại</label>
                        {isEditingProfile ? (
                          <input type="text" className="w-full p-3 bg-surface-container border-b-2 border-primary rounded-lg outline-none" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} />
                        ) : (
                          <p className="p-3 text-lg font-semibold text-on-surface">{user?.phone || 'Chưa cập nhật'}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Vai trò</label>
                        <p className="p-3 text-lg font-black text-primary italic uppercase tracking-tighter">
                          {user?.role === 'LANDLORD' ? '🚀 Chủ nhà' : '🏠 Người thuê'}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Email</label>
                        <p className="p-3 text-sm text-on-surface-variant font-medium">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  {!isEditingProfile && (
                    <button 
                      onClick={() => setIsChangingPassword(true)}
                      className="w-full py-4 flex items-center justify-center gap-2 text-primary font-bold hover:bg-primary/5 transition-all rounded-2xl border-2 border-dashed border-primary/20"
                    >
                      <span className="material-symbols-outlined text-xl">lock_reset</span>
                      Thay đổi mật khẩu đăng nhập
                    </button>
                  )}

                  {user?.role === 'LANDLORD' && (
                    <div className="mt-8 p-6 bg-surface-container-low rounded-3xl border border-outline-variant/30 space-y-4">
                      <h4 className="font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">payments</span>
                        Thông tin thanh toán (VietQR)
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Ngân hàng</label>
                          {isEditingProfile ? (
                            <select className="w-full p-2.5 bg-white border border-outline-variant/30 rounded-lg text-sm" value={profileData.bankName} onChange={e => setProfileData({...profileData, bankName: e.target.value})}>
                              <option value="MB">MBBank</option>
                              <option value="VCB">Vietcombank</option>
                            </select>
                          ) : <p className="font-bold text-on-surface">{user?.bankName}</p>}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Số tài khoản</label>
                          {isEditingProfile ? (
                            <input type="text" className="w-full p-2.5 bg-white border border-outline-variant/30 rounded-lg text-sm" value={profileData.accountNumber} onChange={e => setProfileData({...profileData, accountNumber: e.target.value})} />
                          ) : <p className="font-bold text-primary">{user?.accountNumber}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-10 flex gap-4">
                {isEditingProfile || isChangingPassword ? (
                  <>
                    <button 
                      onClick={() => { setIsEditingProfile(false); setIsChangingPassword(false); }}
                      className="flex-1 py-4 font-bold text-on-surface-variant hover:bg-surface-container transition-all rounded-2xl"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      onClick={isChangingPassword ? handleSavePassword : handleSaveProfile}
                      className="flex-[2] py-4 bg-primary text-on-primary font-bold rounded-2xl hover:shadow-lg shadow-primary/20 transition-all"
                    >
                      {isChangingPassword ? 'Cập nhật mật khẩu' : 'Lưu thay đổi'}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="w-full py-4 bg-on-surface text-surface font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">edit_square</span>
                    Chỉnh sửa thông tin hồ sơ
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;