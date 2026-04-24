import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import roomApi from '../api/roomApi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileModal from '../components/ProfileModal';

const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const navigate = useNavigate();
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  
  const renderStars = (rating, idPrefix = 'home') => {
    const stars = [];
    const absoluteRating = Number(rating) || 0;
    const roundedRating = Math.round(absoluteRating * 10) / 10;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(roundedRating)) {
        stars.push(
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" style={{ marginRight: '2px' }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      } else if (i === Math.ceil(roundedRating) && roundedRating % 1 !== 0) {
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
        stars.push(
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#e4e4e4" style={{ marginRight: '2px' }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      }
    }
    return stars;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [activeLocation, setActiveLocation] = useState('Tất cả');
  const [activeType, setActiveType] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [tempLocation, setTempLocation] = useState({ province: '', district: '', ward: '' });
  const [tempPrice, setTempPrice] = useState('all');
  const [tempArea, setTempArea] = useState('all');
  const [tempAmenities, setTempAmenities] = useState([]);

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    if (showFilterModal && provinces.length === 0) {
      axios.get('https://provinces.open-api.vn/api/v2/p/').then(res => setProvinces(res.data));
    }
  }, [showFilterModal, provinces.length]);

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

  const applyFilters = () => {
    let result = rooms;

    if (activeLocation !== 'Tất cả') result = result.filter(r => r.address && r.address.includes(activeLocation));
    if (activeType !== 'all') result = result.filter(r => r.roomType === activeType);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.address && r.address.toLowerCase().includes(term)) || 
        (r.roomCode && r.roomCode.toLowerCase().includes(term))
      );
    }

    if (tempLocation.province) result = result.filter(r => r.address.includes(tempLocation.province));
    if (tempLocation.ward) result = result.filter(r => r.address.includes(tempLocation.ward));

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

    switch(tempArea) {
      case '<20': result = result.filter(r => r.area && r.area < 20); break;
      case '20-30': result = result.filter(r => r.area && r.area >= 20 && r.area <= 30); break;
      case '30-50': result = result.filter(r => r.area && r.area > 30 && r.area <= 50); break;
      case '50-70': result = result.filter(r => r.area && r.area > 50 && r.area <= 70); break;
      case '70-90': result = result.filter(r => r.area && r.area > 70 && r.area <= 90); break;
      case '>90': result = result.filter(r => r.area && r.area > 90); break;
      default: break;
    }

    if (tempAmenities.includes('hasElevator')) result = result.filter(r => r.hasElevator);
    if (tempAmenities.includes('hasWashingMachine')) result = result.filter(r => r.hasWashingMachine);
    if (tempAmenities.includes('hasFridge')) result = result.filter(r => r.hasFridge);
    if (tempAmenities.includes('hasKitchen')) result = result.filter(r => r.hasKitchen);
    if (tempAmenities.includes('hasHeater')) result = result.filter(r => r.hasHeater);

    setFilteredRooms(result);
    setShowFilterModal(false);
  };

  useEffect(() => { applyFilters(); }, [activeLocation, activeType, searchTerm]);

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

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col">
      <Header 
        user={user} 
        activeType={activeType} 
        setActiveType={setActiveType} 
        onProfileClick={() => setShowProfileModal(true)} 
        handleLogout={handleLogout}
        onLogoClick={() => { setActiveType('all'); setActiveLocation('Tất cả'); setSearchTerm(''); }}
      />

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
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      {room.status === 'AVAILABLE' ? (
                        <div className="px-3 py-1 bg-secondary text-on-secondary text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">Trống</div>
                      ) : (
                        <div className="px-3 py-1 bg-tertiary text-on-tertiary text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">Sắp trống</div>
                      )}
                      {room.reviewCount > 0 && (
                        <div className="flex items-center gap-1 text-[#f59e0b] bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm text-[10px] font-bold">
                          <span className="material-symbols-outlined text-sm fill-current">star</span>
                          <span>{room.avgRating}</span>
                        </div>
                      )}
                    </div>
                    <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-on-surface-variant hover:text-error transition-all hover:bg-white active:scale-90">
                      <span className="material-symbols-outlined text-xl">favorite</span>
                    </button>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="mb-2">
                      <h3 className="font-headline-md text-headline-md text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {room.roomType === 'WHOLE_HOUSE' ? 'NHÀ NGUYÊN CĂN' : 'PHÒNG TRỌ'} {room.roomNumber}
                      </h3>
                      {room.roomCode && (
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50 mt-0.5">
                          Mã: {room.roomCode}
                        </p>
                      )}
                    </div>
                    
                    <p className="text-primary font-price-tag text-xl mb-4">
                      {room.price?.toLocaleString()} đ<span className="text-sm font-normal text-on-surface-variant">/tháng</span>
                    </p>

                    <div className="space-y-3 mb-6 pb-6 border-b border-outline-variant/20">
                      <div className="flex items-center gap-4 text-on-surface-variant text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-lg text-primary">square_foot</span>
                          {room.area} m²
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-lg text-primary">group</span>
                          {room.maxOccupants} người
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-sm marquee-container">
                        <span className="material-symbols-outlined text-lg text-primary flex-shrink-0">location_on</span>
                        <div className="marquee-content">
                          <span>{room.houseNumber ? `${room.houseNumber}, ` : ''}{room.address}</span>
                          {(room.address?.length > 20 || room.houseNumber) && (
                            <span className="ml-8">{room.houseNumber ? `${room.houseNumber}, ` : ''}{room.address}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description Preview */}
                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 mb-6">
                      {room.description || <span className="italic opacity-40">Chưa có mô tả chi tiết.</span>}
                    </p>

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

      <Footer />

      {/* Filter Modal */}
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

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}
    </div>
  );
};

export default Home;