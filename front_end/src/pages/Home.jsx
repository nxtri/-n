import React, { useState, useEffect } from 'react';
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

  // ==========================================
  // STATE CHO TÌM KIẾM NHANH (Ở ngoài)
  // ==========================================
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLocation, setActiveLocation] = useState('Tất cả');

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

    // 3. Lọc theo Giá
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

    

    // 4. Lọc theo Khoảng Diện Tích (MỚI THÊM)
    switch(tempArea) {
      case '<20': result = result.filter(r => r.area && r.area < 20); break;
      case '20-30': result = result.filter(r => r.area && r.area >= 20 && r.area <= 30); break;
      case '30-50': result = result.filter(r => r.area && r.area > 30 && r.area <= 50); break;
      case '50-70': result = result.filter(r => r.area && r.area > 50 && r.area <= 70); break;
      case '70-90': result = result.filter(r => r.area && r.area > 70 && r.area <= 90); break;
      case '>90': result = result.filter(r => r.area && r.area > 90); break;
      default: break;
    }

    // 5. Lọc Tiện ích (CẬP NHẬT THÊM NÓNG LẠNH)
    if (tempAmenities.includes('hasElevator')) result = result.filter(r => r.hasElevator);
    if (tempAmenities.includes('hasWashingMachine')) result = result.filter(r => r.hasWashingMachine);
    if (tempAmenities.includes('hasFridge')) result = result.filter(r => r.hasFridge);
    if (tempAmenities.includes('hasKitchen')) result = result.filter(r => r.hasKitchen);
    if (tempAmenities.includes('hasHeater')) result = result.filter(r => r.hasHeater);

    setFilteredRooms(result);
    setShowFilterModal(false); // Đóng modal
  };

  // Tự động chạy lọc nhanh khi đổi nút Tỉnh/Thành bên ngoài
  useEffect(() => { applyFilters(); }, [activeLocation, searchTerm]);

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
          background: 'transparent',
          border: isActive ? '1px solid #ff5a2c' : '1px solid #444',
          color: isActive ? '#ff5a2c' : '#ccc',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          fontSize: '14px',
          outline: 'none'
        }}
      >
        {label}
        {isActive && ( // Góc vát chéo có dấu check mark giống thiết kế
          <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderTop: '20px solid #ff5a2c', borderLeft: '20px solid transparent' }}>
            <span style={{ position: 'absolute', top: '-20px', right: '1px', color: 'white', fontSize: '10px', fontWeight: 'bold' }}>✓</span>
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

  return (
    <div style={{ backgroundColor: '#141414', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'Arial, sans-serif' }}>
      
      {/* HEADER TÌM KIẾM */}
      <div style={{ backgroundColor: '#2b1b12', padding: '15px 20px', borderBottom: '1px solid #3d2b21' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ color: '#4da6ff', margin: 0, fontSize: '24px', cursor: 'pointer' }} onClick={() => window.location.reload()}>PHONGTROSIEUCAP</h1>
          <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '500px', margin: '0 20px' }}>
            <input type="text" placeholder="📍 Tìm theo khu vực (Xã, Tỉnh) hoặc Mã phòng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: 'none', backgroundColor: '#1f1f1f', color: '#fff', outline: 'none' }} />
            <button onClick={() => setShowFilterModal(true)} style={{ padding: '10px 20px', borderRadius: '20px', border: '1px solid #666', background: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/></svg>
              Bộ lọc
            </button>
          </div>
          {/* ... (Các phần Logo và Thanh tìm kiếm giữ nguyên) ... */}

          {/* ========================================================= */}
          {/* HEADER BÊN PHẢI (CỤM NÚT QUẢN LÝ / PROFILE / ĐĂNG TIN)    */}
          {/* ========================================================= */}
<div>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                
                {/* Nút Quản lý */}
                <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44z"/></svg>
                  Quản lý
                </button>

                {/* Cụm thông tin User + Dropdown */}
                <div style={{ position: 'relative' }}>
                  <div 
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff', padding: '6px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)' }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#444', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <svg width="14" height="14" fill="#ccc" viewBox="0 0 16 16"><path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/><path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/></svg>
                    </div>
                    <span style={{ fontSize: '14px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.fullName || 'User'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#ccc' }}>▼</span>
                  </div>

                  {/* Menu xổ xuống (Profile & Log out) */}
                  {showDropdown && (
                    <div style={{ position: 'absolute', top: '120%', right: 0, background: '#1c1c1c', border: '1px solid #333', borderRadius: '8px', padding: '5px 0', width: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 100 }}>
                      <div 
                        onClick={() => { setShowProfileModal(true); setShowDropdown(false); }}
                        style={{ padding: '10px 15px', cursor: 'pointer', color: '#fff', fontSize: '14px', transition: '0.2s' }}
                        onMouseEnter={(e) => e.target.style.background = '#333'} onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        Profile
                      </div>
                      <div 
                        onClick={handleLogout}
                        style={{ padding: '10px 15px', cursor: 'pointer', color: '#ff4d4d', fontSize: '14px', transition: '0.2s' }}
                        onMouseEnter={(e) => e.target.style.background = '#333'} onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        Log out
                      </div>
                    </div>
                  )}
                </div>

                {/* Nút Đăng tin (Chỉ Chủ nhà mới thấy) */}
                {user.role === 'LANDLORD' && (
                  <button onClick={() => navigate('/dashboard', { state: { targetTab: 'ADD_ROOM' } })} style={{ background: '#ff5a2c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '25px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>
                    Đăng tin
                  </button>
                )}

              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => navigate('/login')} style={{ padding: '8px 15px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>Đăng nhập</button>
                <button onClick={() => navigate('/register')} style={{ padding: '8px 15px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Đăng ký</button>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* DANH SÁCH PHÒNG TRỌ NẰM DƯỚI */}
      <div style={{ width: '100%', margin: '20px auto', display: 'flex', boxSizing: 'border-box', gap: '20px', padding: '0 40px', }}>
        <div style={{ flex: '7' }}>
          <h2 style={{ color: '#fff', marginTop: 0 }}>Chào mừng đến với Phòng Trọ Siêu Cấp</h2>
          <p style={{ color: '#aaa', fontSize: '14px' }}>Có {filteredRooms.length} tin đăng cho thuê</p>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {['Tất cả', 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Bình Dương'].map(loc => (
              <button key={loc} onClick={() => setActiveLocation(loc)} style={{ padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', background: activeLocation === loc ? '#2b4d66' : 'transparent', color: activeLocation === loc ? '#4da6ff' : '#aaa', border: activeLocation === loc ? '1px solid #4da6ff' : '1px solid #444' }}>{loc}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredRooms.map((room) => {
              let firstImage = "https://placehold.co/280x180/333/999?text=Chua+Co+Anh";
              if (room.images && JSON.parse(room.images).length > 0) firstImage = `http://localhost:5000/uploads/${JSON.parse(room.images)[0]}`;

              return (
                <Link to={`/room/${room.id}`} key={room.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', background: '#1c1c1c', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', height: '200px' }}>
                    
                    {/* KHU VỰC ẢNH VÀ NHÃN TRẠNG THÁI */}
                    <div style={{ width: '300px', position: 'relative' }}>
                      <img src={firstImage} alt="Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {/* 🚨 THẺ LABEL HIỂN THỊ TRẠNG THÁI */}
                      <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                        {room.status === 'AVAILABLE' ? (
                          <span style={{ background: '#28a745', color: '#fff', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>
                            ✨ ĐANG TRỐNG
                          </span>
                        ) : (
                          <span style={{ background: '#fd7e14', color: '#fff', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>
                            ⏳ Sắp trống ({room.intendedMoveOutDate})
                          </span>
                        )}
                      </div>
                    </div>
                  
                  {/* CỘT THÔNG TIN PHÒNG (Đoạn này giữ nguyên của bạn) */}
                  <div style={{ flex: 1, padding: '10px 15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Tiêu đề phòng */}
                    <h3 style={{ margin: 0, color: '#ff4d4f', fontSize: '18px', textTransform: 'uppercase', textAlign: 'left' }}>
                      CHO THUÊ PHÒNG {room.roomNumber} {room.roomCode ? `(Mã phòng: ${room.roomCode})` : ''} - {room.address}
                    </h3>

                    {/* Dòng 2: Giá, Diện tích, Số người */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#00e676', fontWeight: 'bold', fontSize: '18px' }}>{room.price?.toLocaleString()} đ/tháng</span>
                      <span style={{ color: '#ccc', fontSize: '14px' }}>📐 {room.area || 0} m²</span>
                      <span style={{ color: '#ccc', fontSize: '14px' }}>👥 {room.maxOccupants} người</span>
                    </div>

                    {/* Dòng 3: Địa chỉ */}
                    <div style={{ color: '#aaa', fontSize: '14px', display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                      <span>📍</span>
                      <span style={{ lineHeight: '1.4' }}>{room.houseNumber ? `${room.houseNumber}, ` : ''}{room.address}</span>
                    </div>
                    

{/* Dòng 4: Các tiện ích nổi bật và Thông tin chủ nhà */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginTop: 'auto', gap: '10px' }}>
                      
                      {/* --- NHÓM BÊN TRÁI: CÁC TIỆN ÍCH --- */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {room.hasElevator && <span style={{ background: '#333', color: '#fff', border: '1px solid #444', padding: '4px 10px', borderRadius: '15px', fontSize: '12px' }}>🛗 Thang máy</span>}
                        {room.hasWashingMachine && <span style={{ background: '#333', color: '#fff', border: '1px solid #444', padding: '4px 10px', borderRadius: '15px', fontSize: '12px' }}>🧺 Máy giặt</span>}
                        {room.hasFridge && <span style={{ background: '#333', color: '#fff', border: '1px solid #444', padding: '4px 10px', borderRadius: '15px', fontSize: '12px' }}>❄️ Tủ lạnh</span>}
                        {room.hasKitchen && <span style={{ background: '#333', color: '#fff', border: '1px solid #444', padding: '4px 10px', borderRadius: '15px', fontSize: '12px' }}>🍳 Bếp nấu</span>}
                        {room.hasHeater && <span style={{ background: '#333', color: '#fff', border: '1px solid #444', padding: '4px 10px', borderRadius: '15px', fontSize: '12px' }}>🚿 Nóng lạnh</span>}
                        
                        {!(room.hasElevator || room.hasWashingMachine || room.hasFridge || room.hasKitchen || room.hasHeater) && (
                          <span style={{ color: '#777', fontSize: '13px', fontStyle: 'italic' }}>Chưa cập nhật tiện ích</span>
                        )}
                      </div>

                      {/* --- NHÓM BÊN PHẢI: THÔNG TIN CHỦ NHÀ --- */}
                      <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '13px', color: '#ccc', display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div>👤 Chủ nhà: <strong style={{ color: '#fff' }}>{room.landlord?.fullName || 'Đang cập nhật'}</strong></div>
                        <div>📞 SĐT: <strong style={{ color: '#4da6ff' }}>{room.landlord?.phone || '...'}</strong></div>
                      </div>
                      
                    </div>
                  </div>
                  {/* KẾT THÚC ĐOẠN DÁN */}

                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SIÊU MODAL BỘ LỌC TÌM KIẾM (Y HỆT ẢNH THIẾT KẾ)            */}
      {/* ========================================================= */}
      {showFilterModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          
          <div style={{ background: '#222', width: '650px', maxHeight: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #444', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'normal' }}>Bộ lọc</h3>
              <button onClick={() => setShowFilterModal(false)} style={{ background: 'transparent', border: 'none', color: '#aaa', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            {/* Modal Body (Cuộn được) */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              
              {/* 1. Khu vực */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#ccc', margin: '0 0 15px', fontWeight: 'normal' }}>Lọc theo khu vực</h4>
                <div style={{ display: 'flex', gap: '15px' }}>
                  
                  {/* CỘT 1: CHỌN TỈNH/THÀNH */}
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '5px' }}>Thành phố / Tỉnh</label>
                    <select 
                      onChange={(e) => {
                        const code = e.target.value;
                        const name = e.target.options[e.target.selectedIndex].text;
                        // Cập nhật Tỉnh và xóa trắng ô Xã
                        setTempLocation({ province: code ? name : '', ward: '' });
                        if (code) {
                          // Ép API v2 lấy thẳng danh sách Xã của Tỉnh đó (depth=2)
                          axios.get(`https://provinces.open-api.vn/api/v2/p/${code}?depth=2`)
                            .then(res => setWards(res.data.wards || []));
                        } else {
                          setWards([]);
                        }
                      }}
                      style={{ width: '100%', padding: '10px', background: '#1c1c1c', border: '1px solid #444', borderRadius: '8px', color: '#fff', outline: 'none' }}
                    >
                      <option value="">Toàn quốc</option>
                      {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                    </select>
                  </div>

                  {/* CỘT 2: CHỌN PHƯỜNG/XÃ */}
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '5px' }}>Phường / Xã</label>
                    <select 
                      disabled={!tempLocation.province}
                      onChange={(e) => setTempLocation({ ...tempLocation, ward: e.target.value ? e.target.options[e.target.selectedIndex].text : '' })}
                      style={{ width: '100%', padding: '10px', background: '#1c1c1c', border: '1px solid #444', borderRadius: '8px', color: '#fff', outline: 'none' }}
                    >
                      <option value="">Tất cả</option>
                      {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                    </select>
                  </div>

                </div>
              </div>

              {/* 2. Khoảng giá */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#ccc', margin: '0 0 15px', fontWeight: 'normal' }}>Khoảng giá</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {PRICE_RANGES.map(item => (
                    <FilterPill key={item.val} label={item.label} value={item.val} currentVal={tempPrice} onClick={setTempPrice} />
                  ))}
                </div>
              </div>

              {/* 3. Khoảng diện tích */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#ccc', margin: '0 0 15px', fontWeight: 'normal' }}>Khoảng diện tích</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {AREA_RANGES.map(item => (
                    <FilterPill key={item.val} label={item.label} value={item.val} currentVal={tempArea} onClick={setTempArea} />
                  ))}
                </div>
              </div>

              {/* 4. Đặc điểm nổi bật (Cho phép chọn nhiều) */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#ccc', margin: '0 0 15px', fontWeight: 'normal' }}>Đặc điểm nổi bật</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {AMENITIES_LIST.map(item => (
                    <FilterPill key={item.val} label={item.label} value={item.val} currentVal={tempAmenities} onClick={setTempAmenities} isMulti={true} />
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer (Nút Áp dụng) */}
            <div style={{ padding: '15px 20px', borderTop: '1px solid #333', background: '#1c1c1c' }}>
              <button 
                onClick={applyFilters} 
                style={{ width: '100%', padding: '12px', background: '#ff5a2c', color: '#fff', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Áp dụng
              </button>
            </div>

          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* MODAL THÔNG TIN NGƯỜI DÙNG (XEM VÀ SỬA)                   */}
      {/* ========================================================= */}
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
                {/* Cột trái */}
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Họ tên</p>
                  {isEditingProfile ? (
                    <input type="text" value={profileData.fullName} onChange={e => setProfileData({...profileData, fullName: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }} />
                  ) : (
                    <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.fullName}</p>
                  )}

                  <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Số điện thoại</p>
                  {isEditingProfile ? (
                    <input type="text" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }} />
                  ) : (
                    <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.phone || 'Chưa cập nhật'}</p>
                  )}

                  <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Ngày sinh</p>
                  {isEditingProfile ? (
                    <input type="date" value={profileData.dob} onChange={e => setProfileData({...profileData, dob: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }} />
                  ) : (
                    <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.dob || 'Chưa cập nhật'}</p>
                  )}

                  <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Địa chỉ</p>
                  {isEditingProfile ? (
                    <input type="text" value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }} />
                  ) : (
                    <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.address || 'Chưa cập nhật'}</p>
                  )}
                </div>

                {/* Cột phải */}
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Email (Không thể đổi)</p>
                  <p style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#666' }}>{user?.email}</p>

                  <p style={{ color: '#888', margin: '0 0 5px 0', fontSize: '13px' }}>Số CMND/CCCD</p>
                  {isEditingProfile ? (
                    <input type="text" value={profileData.identityNumber} onChange={e => setProfileData({...profileData, identityNumber: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }} />
                  ) : (
                    <p style={{ margin: '0 0 20px 0', fontSize: '15px' }}>{user?.identityNumber || 'Chưa cập nhật'}</p>
                  )}
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

            {/* CÁC NÚT CHỨC NĂNG BÊN DƯỚI */}
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
      </div>
  );
};

export default Home;