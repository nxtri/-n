import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import roomApi from '../api/roomApi';
import contractApi from '../api/contractApi';
import reportApi from '../api/reportApi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileModal from '../components/ProfileModal';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [activeReviewFilter, setActiveReviewFilter] = useState('ALL');
  const [reviews, setReviews] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

  const [reportData, setReportData] = useState({
    reason: '',
    description: '',
    fullName: user?.fullName || '',
    phoneNumber: user?.phone || '',
  });

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await roomApi.getRoomById(id);
        setRoom(response.room);
        setReviews(response.reviews || []);
      } catch (error) {
        alert('Phòng không tồn tại!');
        navigate('/');
      }
    };
    fetchRoom();
  }, [id, navigate]);

  if (!room) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>
  );

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
    : 0;

  const renderStars = (rating, idPrefix = 'detail', size = 18) => {
    const stars = [];
    const absoluteRating = Number(rating) || 0;
    const roundedRating = Math.round(absoluteRating * 10) / 10;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(roundedRating)) {
        stars.push(
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#f59e0b" style={{ marginRight: '2px' }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      } else if (i === Math.ceil(roundedRating) && roundedRating % 1 !== 0) {
        const fraction = (roundedRating - Math.floor(roundedRating)) * 100;
        stars.push(
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ marginRight: '2px' }}>
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
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#e4e4e4" style={{ marginRight: '2px' }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      }
    }
    return stars;
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportData.reason) return alert('Vui lòng chọn lý do phản ánh!');
    try {
      await reportApi.createReport(id, { ...reportData, reporterId: user?.id || null });
      alert('Đã gửi phản ánh thành công! Xin cảm ơn.');
      setShowReportModal(false);
    } catch (error) {
      alert('Lỗi khi gửi phản ánh!');
    }
  };

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) return alert("Vui lòng nhập nội dung phản hồi!");
    try {
      await contractApi.replyReview(reviewId, { replyText });
      alert("Đã gửi phản hồi thành công!");
      setReplyingTo(null);
      setReplyText('');
      const response = await roomApi.getRoomById(id);
      setReviews(response.reviews || []);
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

  const filteredReviews = reviews.filter(review => {
    if (activeReviewFilter === 'ALL') return true;
    if (activeReviewFilter === 'HAS_IMAGE') {
       const imgs = JSON.parse(review.images || "[]");
       const vids = JSON.parse(review.videos || "[]");
       return imgs.length > 0 || vids.length > 0;
    }
    return review.rating === parseInt(activeReviewFilter);
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.reload();
  };

  const images = room.images ? JSON.parse(room.images) : [];

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col">
      <Header 
        user={user} 
        onProfileClick={() => setShowProfileModal(true)} 
        handleLogout={handleLogout} 
      />

      <main className="mt-20 flex-grow pb-20">
        <div className="max-w-[1280px] mx-auto px-8 pt-8">
          {/* Breadcrumb / Back button */}
          <div className="mb-8">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold text-sm"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Quay lại trang chủ
            </button>
          </div>

          {/* Photo Grid (Airbnb-style) - Full Width */}
          <div className="relative mb-10">
            {images.length === 0 ? (
              <div className="aspect-[16/10] rounded-2xl bg-surface-container-low flex flex-col items-center justify-center text-outline-variant gap-4 border border-outline-variant/10">
                <span className="material-symbols-outlined text-6xl">image_not_supported</span>
                <p className="font-bold">Chưa có hình ảnh</p>
              </div>
            ) : images.length === 1 ? (
              <div className="aspect-[16/10] rounded-2xl overflow-hidden cursor-pointer group" onClick={() => { setCurrentImageIndex(0); setShowImageViewer(true); }}>
                <img src={`${import.meta.env.VITE_API_URL}/uploads/${images[0]}`} alt="Room" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
            ) : (
              <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[480px] rounded-2xl overflow-hidden">
                {/* Large image - left half */}
                <div className="col-span-2 row-span-2 relative cursor-pointer group" onClick={() => { setCurrentImageIndex(0); setShowImageViewer(true); }}>
                  <img src={`${import.meta.env.VITE_API_URL}/uploads/${images[0]}`} alt="Main" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                {/* Small images - right half */}
                {images.slice(1, 5).map((img, idx) => (
                  <div key={idx} className="relative cursor-pointer group overflow-hidden" onClick={() => { setCurrentImageIndex(idx + 1); setShowImageViewer(true); }}>
                    <img src={`${import.meta.env.VITE_API_URL}/uploads/${img}`} alt={`Photo ${idx + 2}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {idx === 3 && images.length > 5 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-2xl font-black">+{images.length - 5} ảnh</span>
                      </div>
                    )}
                  </div>
                ))}
                {images.length < 5 && Array.from({ length: 5 - images.length }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="bg-surface-container-low flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-outline-variant/30">image</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title Section (Airbnb-style) */}
          <div className="mb-8">
            <h1 className="font-display-md text-display-md text-on-surface mb-3 font-black">
              {room.roomType === 'WHOLE_HOUSE' ? '' : 'Phòng '}{room.roomNumber}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                {room.roomType === 'WHOLE_HOUSE' ? 'Nhà nguyên căn' : 'Phòng trọ'}
              </span>
              {room.status === 'AVAILABLE' ? (
                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[10px] font-black uppercase tracking-widest">Trống</span>
              ) : (
                <span className="px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-[10px] font-black uppercase tracking-widest">Sắp trống</span>
              )}
              {totalReviews > 0 && (
                <span className="flex items-center gap-1 text-sm text-on-surface-variant">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                  <span className="font-bold">{avgRating}</span> · {totalReviews} đánh giá
                </span>
              )}
              <span className="flex items-center gap-1 text-sm text-on-surface-variant font-bold">
                <span className="material-symbols-outlined text-base">location_on</span>
                {room.houseNumber ? `${room.houseNumber}, ` : ''}{room.address}
              </span>
            </div>
            {room.status !== 'AVAILABLE' && room.intendedMoveOutDate && (
              <div className="flex items-center gap-2 text-tertiary font-bold text-xs bg-tertiary/5 p-2 rounded-xl border border-tertiary/10 w-fit mt-3">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span>Trống từ ngày: {new Date(room.intendedMoveOutDate).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Room Details */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-primary rounded-full"></span>
                  Thông tin chi tiết
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl">payments</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Giá thuê</p>
                      <p className="text-lg font-black text-error">{room.price?.toLocaleString()} <span className="text-xs">đ/tháng</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl">aspect_ratio</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Diện tích</p>
                      <p className="text-lg font-black text-on-surface">{room.area || '—'} <span className="text-xs">m²</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl">group</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Sức chứa</p>
                      <p className="text-lg font-black text-on-surface">{room.maxOccupants || '—'} <span className="text-xs">người</span></p>
                    </div>
                  </div>
                </div>

                {/* Whole House extra info */}
                {room.roomType === 'WHOLE_HOUSE' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-outline-variant/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">stairs</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Số tầng</p>
                        <p className="text-lg font-black text-on-surface">{room.numFloors || '—'} <span className="text-xs">tầng</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">bed</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Phòng ngủ</p>
                        <p className="text-lg font-black text-on-surface">{room.numBedrooms || '—'} <span className="text-xs">phòng</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">bathtub</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Nhà vệ sinh</p>
                        <p className="text-lg font-black text-on-surface">{room.numBathrooms || '—'} <span className="text-xs">phòng</span></p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-8 border-t border-outline-variant/20">
                  <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-3">
                    <span className="w-2 h-8 bg-primary rounded-full"></span>
                    Tiện ích & Dịch vụ
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { key: 'hasElevator', label: 'Thang máy', icon: 'elevator' },
                      { key: 'hasWashingMachine', label: 'Máy giặt', icon: 'local_laundry_service' },
                      { key: 'hasFridge', label: 'Tủ lạnh', icon: 'kitchen' },
                      { key: 'hasKitchen', label: 'Bếp riêng', icon: 'countertops' },
                      { key: 'hasHeater', label: 'Nóng lạnh', icon: 'water_heater' },
                      { key: 'hasBalcony', label: 'Ban công', icon: 'balcony' }
                    ].map(item => (
                      <div key={item.key} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                        room[item.key] ? 'bg-secondary/5 border-secondary/20 text-secondary' : 'bg-surface-container opacity-30 border-transparent text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                        <span className="text-xs font-black uppercase tracking-tight">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Monthly Costs + Contact + Report */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-outline-variant/20 shadow-xl">
                {/* Monthly Costs */}
                <div className="bg-primary/5 rounded-2xl p-6 border-2 border-dashed border-primary/20 space-y-5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                    Chi phí hàng tháng
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant">Tiền điện</span>
                      <span className="text-sm font-black text-on-surface">
                        {room.roomType === 'WHOLE_HOUSE' ? 'Giá nhà nước' : (room.electricityPrice ? `${room.electricityPrice.toLocaleString()}đ/ký` : 'Giá NN')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant">Tiền nước</span>
                      <span className="text-sm font-black text-on-surface">
                        {room.waterPrice ? `${room.waterPrice.toLocaleString()}đ/khối` : 'Giá NN'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant">Internet</span>
                      <span className="text-sm font-black text-on-surface">
                        {room.internetPrice ? `${room.internetPrice.toLocaleString()}đ` : 'Tự túc'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant">Gửi xe</span>
                      <span className="text-sm font-black text-on-surface">
                        {room.parkingPrice ? `${room.parkingPrice.toLocaleString()}đ/tháng` : 'Free'}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-primary/10 flex justify-between items-center">
                      <span className="text-xs font-bold text-primary">Dịch vụ chung</span>
                      <span className="text-sm font-black text-primary">
                        {room.servicePrice ? `${room.servicePrice.toLocaleString()}đ` : 'Free'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Landlord & Contact */}
              <div className="bg-white p-8 rounded-3xl border border-outline-variant/20 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-secondary-fixed-dim/20 rounded-2xl border border-secondary-fixed/20">
                    <div className="w-12 h-12 rounded-full bg-secondary-fixed-dim flex items-center justify-center font-black text-on-secondary-fixed shadow-inner">
                      {room.landlord?.fullName?.charAt(0) || 'L'}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-outline uppercase tracking-widest">Chủ sở hữu</p>
                      <p className="font-bold text-on-surface">{room.landlord?.fullName}</p>
                    </div>
                  </div>
                  
                  <a 
                    href={room.landlord?.phone ? `https://zalo.me/${room.landlord.phone}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-primary text-on-primary py-4 rounded-2xl font-black text-center flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">call</span>
                    Liên hệ Zalo: {room.landlord?.phone || 'N/A'}
                  </a>

                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="w-full py-2 text-xs font-bold text-error hover:bg-error/5 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">report</span>
                    Báo cáo tin đăng
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section (Full Width) */}
          <div className="mt-8">
            <div className="bg-white p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
              <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-primary rounded-full"></span>
                Thông tin mô tả phòng
              </h3>
              <div className="bg-surface-container-lowest/50 rounded-2xl p-6 border border-outline-variant/10">
                <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                  {room.description || 'Chưa có mô tả chi tiết cho phòng này.'}
                </p>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <section className="mt-20">
            <div className="bg-white rounded-[40px] p-12 border border-outline-variant/20 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                  <h2 className="font-headline-lg text-headline-lg mb-2">Đánh giá từ khách thuê</h2>
                  <p className="text-on-surface-variant font-body-md">Dựa trên {totalReviews} đánh giá thực tế</p>
                </div>
                <div className="flex items-center gap-6 bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
                  <div className="text-center">
                    <p className="text-4xl font-black text-primary">{avgRating}</p>
                    <p className="text-[10px] font-black text-outline uppercase tracking-widest mt-1">Điểm trung bình</p>
                  </div>
                  <div className="h-12 w-[1px] bg-outline-variant/30"></div>
                  <div className="flex flex-col items-center">
                    <div className="flex">{renderStars(avgRating, 'summary', 20)}</div>
                    <p className="text-[10px] font-black text-outline uppercase tracking-widest mt-1">Đánh giá chung</p>
                  </div>
                </div>
              </div>

              {/* Review Filters */}
              <div className="flex flex-wrap gap-2 mb-12">
                {[
                  { label: 'Tất cả', val: 'ALL' },
                  { label: '5 ⭐', val: '5' },
                  { label: '4 ⭐', val: '4' },
                  { label: '3 ⭐', val: '3' },
                  { label: '2 ⭐', val: '2' },
                  { label: '1 ⭐', val: '1' },
                  { label: 'Có hình ảnh', val: 'HAS_IMAGE' }
                ].map(filter => (
                  <button 
                    key={filter.val}
                    onClick={() => setActiveReviewFilter(filter.val)}
                    className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all border ${activeReviewFilter === filter.val ? 'bg-primary text-on-primary border-primary shadow-md' : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary'}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Review List */}
              <div className="space-y-8">
                {filteredReviews.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-6xl text-outline-variant">rate_review</span>
                    <p className="text-on-surface-variant font-bold">Chưa có đánh giá nào phù hợp.</p>
                  </div>
                ) : filteredReviews.map((review) => (
                  <div key={review.id} className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/10 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary">
                          {(review.isAnonymous ? maskName(review.tenant?.fullName) : (review.tenant?.fullName || 'K'))[0]}
                        </div>
                        <div>
                          <p className="font-black text-on-surface">
                            {review.isAnonymous ? maskName(review.tenant?.fullName) : (review.tenant?.fullName || 'Khách thuê')}
                          </p>
                          <div className="flex mt-1">{renderStars(review.rating, `r-${review.id}`, 14)}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-outline uppercase tracking-wider">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    
                    <p className="text-on-surface-variant leading-relaxed mb-6 font-body-md">
                      {review.comment}
                    </p>

                    {/* Review Media */}
                    {(review.images || review.videos) && (
                      <div className="flex gap-4 flex-wrap mb-6">
                        {JSON.parse(review.images || "[]").map((img, idx) => (
                          <img key={idx} src={`${import.meta.env.VITE_API_URL}/uploads/${img}`} className="w-24 h-24 object-cover rounded-xl border border-outline-variant/20 cursor-pointer hover:scale-105 transition-transform" alt="review" onClick={() => window.open(`${import.meta.env.VITE_API_URL}/uploads/${img}`)} />
                        ))}
                        {JSON.parse(review.videos || "[]").map((vid, idx) => (
                          <video key={idx} src={`${import.meta.env.VITE_API_URL}/uploads/${vid}`} className="w-24 h-24 object-cover rounded-xl border border-outline-variant/20 bg-black" controls />
                        ))}
                      </div>
                    )}

                    {/* Landlord Reply */}
                    {review.landlordReply ? (
                      <div className="mt-6 p-6 bg-primary/5 rounded-2xl border-l-4 border-primary">
                        <p className="text-xs font-black text-primary uppercase tracking-widest mb-2">Phản hồi từ chủ nhà</p>
                        <p className="text-on-surface-variant text-sm italic">"{review.landlordReply}"</p>
                      </div>
                    ) : (
                      user?.role === 'LANDLORD' && user?.id === room.landlordId && (
                        <div className="mt-6">
                          {replyingTo === review.id ? (
                            <div className="space-y-3">
                              <textarea 
                                value={replyText} 
                                onChange={e => setReplyText(e.target.value)} 
                                placeholder="Nhập phản hồi của bạn..." 
                                className="w-full p-4 bg-white border border-outline-variant rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                rows="3"
                              />
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => setReplyingTo(null)} className="px-6 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-full transition-all">Hủy</button>
                                <button onClick={() => handleReplySubmit(review.id)} className="px-6 py-2 text-sm font-black bg-primary text-on-primary rounded-full shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">Gửi phản hồi</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setReplyingTo(review.id)} className="text-sm font-black text-primary hover:underline flex items-center gap-2">
                              <span className="material-symbols-outlined text-lg">reply</span>
                              Phản hồi đánh giá này
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}

      {/* Image Viewer (Airbnb-style) */}
      {showImageViewer && images.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-[99999] flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setShowImageViewer(false)} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-bold">
              <span className="material-symbols-outlined">close</span> Đóng
            </button>
            <span className="text-white/80 text-sm font-bold">{currentImageIndex + 1} / {images.length}</span>
          </div>
          {/* Main image */}
          <div className="flex-1 flex items-center justify-center px-16 relative">
            <button
              onClick={() => setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <span className="material-symbols-outlined text-2xl">chevron_left</span>
            </button>
            <img
              src={`${import.meta.env.VITE_API_URL}/uploads/${images[currentImageIndex]}`}
              alt={`Photo ${currentImageIndex + 1}`}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <span className="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
          </div>
          {/* Thumbnail strip */}
          <div className="flex justify-center gap-2 px-6 py-4 overflow-x-auto no-scrollbar">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-white opacity-100 scale-105' : 'border-transparent opacity-40 hover:opacity-70'}`}
              >
                <img src={`${import.meta.env.VITE_API_URL}/uploads/${img}`} className="w-full h-full object-cover" alt="thumb" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-on-surface">Báo cáo tin đăng</h3>
              <button onClick={() => setShowReportModal(false)} className="w-10 h-10 rounded-full hover:bg-surface-container transition-all flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleReportSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-black text-outline uppercase tracking-widest px-1">Họ và tên</p>
                  <input 
                    type="text" 
                    required 
                    value={reportData.fullName}
                    onChange={e => setReportData({...reportData, fullName: e.target.value})}
                    className="w-full p-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Họ và tên..."
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-black text-outline uppercase tracking-widest px-1">Số điện thoại</p>
                  <input 
                    type="tel" 
                    required 
                    value={reportData.phoneNumber}
                    onChange={e => setReportData({...reportData, phoneNumber: e.target.value})}
                    className="w-full p-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Số điện thoại..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black text-outline uppercase tracking-widest px-1">Lý do báo cáo</p>
                <div className="space-y-2">
                  {[
                    'Tin có dấu hiệu lừa đảo',
                    'Tin trùng lặp nội dung',
                    'Không liên hệ được chủ tin đăng',
                    'Thông tin không đúng thực tế',
                    'Lý do khác'
                  ].map(reason => (
                    <label key={reason} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-container cursor-pointer transition-all border border-transparent hover:border-outline-variant/30">
                      <input 
                        type="radio" 
                        name="reason" 
                        value={reason} 
                        checked={reportData.reason === reason}
                        onChange={e => setReportData({...reportData, reason: e.target.value})}
                        className="w-5 h-5 text-primary focus:ring-primary/20"
                      />
                      <span className="text-sm font-bold text-on-surface-variant">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-black text-outline uppercase tracking-widest px-1">Mô tả thêm</p>
                <textarea 
                  value={reportData.description}
                  onChange={e => setReportData({...reportData, description: e.target.value})}
                  className="w-full p-4 bg-surface-container-low border border-outline-variant rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  rows="3"
                  placeholder="Cung cấp thêm chi tiết giúp chúng tôi xử lý nhanh hơn..."
                />
              </div>

              <button type="submit" className="w-full py-4 bg-error text-white font-black rounded-2xl shadow-lg shadow-error/20 hover:opacity-90 active:scale-95 transition-all">
                Gửi báo cáo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetail;