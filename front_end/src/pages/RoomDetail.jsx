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
  const [selectedImage, setSelectedImage] = useState(null);
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Images & Description */}
            <div className="lg:col-span-2 space-y-10">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/10 group bg-surface-container-low">
                  {images.length > 0 ? (
                    <>
                      <img 
                        src={`http://localhost:5000/uploads/${images[currentImageIndex]}`} 
                        alt="Room" 
                        className="w-full h-full object-cover cursor-zoom-in transition-transform duration-700 group-hover:scale-105"
                        onClick={() => setSelectedImage(`http://localhost:5000/uploads/${images[currentImageIndex]}`)}
                      />
                      {images.length > 1 && (
                        <>
                          <button 
                            onClick={() => setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40"
                          >
                            <span className="material-symbols-outlined">chevron_left</span>
                          </button>
                          <button 
                            onClick={() => setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40"
                          >
                            <span className="material-symbols-outlined">chevron_right</span>
                          </button>
                        </>
                      )}
                      <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-bold tracking-widest">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-outline-variant gap-4">
                      <span className="material-symbols-outlined text-6xl">image_not_supported</span>
                      <p className="font-bold">Chưa có hình ảnh</p>
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {images.map((img, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`relative flex-shrink-0 w-28 aspect-video rounded-xl overflow-hidden border-2 transition-all ${currentImageIndex === idx ? 'border-primary shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={`http://localhost:5000/uploads/${img}`} className="w-full h-full object-cover" alt="thumb" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-md text-headline-md mb-6 flex items-center gap-3">
                  <span className="w-2 h-8 bg-primary rounded-full"></span>
                  Mô tả chi tiết
                </h3>
                <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                  {room.description || 'Chưa có mô tả chi tiết cho phòng này.'}
                </p>
              </div>
            </div>

            {/* Right: Room Info & Actions */}
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-outline-variant/20 shadow-xl sticky top-28">
                <div className="mb-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                        {room.roomType === 'WHOLE_HOUSE' ? 'Nhà nguyên căn' : 'Phòng trọ'}
                      </span>
                      {room.status === 'AVAILABLE' ? (
                        <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[10px] font-black uppercase tracking-widest">Trống</span>
                      ) : (
                        <span className="px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-[10px] font-black uppercase tracking-widest">Sắp trống</span>
                      )}
                    </div>
                    {room.status !== 'AVAILABLE' && room.intendedMoveOutDate && (
                      <div className="flex items-center gap-2 text-tertiary font-bold text-xs bg-tertiary/5 p-2 rounded-xl border border-tertiary/10 w-fit">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        <span>Trống từ ngày: {new Date(room.intendedMoveOutDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}
                  </div>
                  <h1 className="font-display-md text-display-md text-on-surface mb-4">
                    {room.roomType === 'WHOLE_HOUSE' ? '' : 'Phòng '}{room.roomNumber}
                  </h1>
                </div>

                <div className="flex items-baseline gap-2 mb-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <span className="text-3xl font-black text-primary">{room.price?.toLocaleString()}</span>
                  <span className="text-primary/70 font-bold text-sm">đ/tháng</span>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-primary mb-2">square_foot</span>
                    <p className="text-xs text-on-surface-variant uppercase font-bold mb-1">Diện tích</p>
                    <p className="font-black text-on-surface">{room.area || 0} m²</p>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-primary mb-2">group</span>
                    <p className="text-xs text-on-surface-variant uppercase font-bold mb-1">Tối đa</p>
                    <p className="font-black text-on-surface">{room.maxOccupants} người</p>
                  </div>
                </div>

                {/* Full Address Block */}
                <div className="mb-8 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">location_on</span>
                  <p className="text-sm font-bold text-on-surface leading-tight">
                    {room.houseNumber ? `${room.houseNumber}, ` : ''}{room.address}
                  </p>
                </div>

                {/* Details List */}
                <div className="space-y-6 mb-8 pb-8 border-b border-outline-variant/20">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-outline uppercase tracking-widest">Chi phí dịch vụ</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">⚡ Điện</span>
                        <span className="font-bold">{room.roomType === 'WHOLE_HOUSE' ? 'Giá nhà nước' : (room.electricityPrice ? `${room.electricityPrice.toLocaleString()}đ/ký` : 'Theo giá NN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">💧 Nước</span>
                        <span className="font-bold">{room.waterPrice ? `${room.waterPrice.toLocaleString()}đ/khối` : 'Theo giá NN'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">🛵 Gửi xe</span>
                        <span className="font-bold">{room.parkingPrice ? `${room.parkingPrice.toLocaleString()}đ/tháng` : 'Miễn phí'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-outline uppercase tracking-widest">Tiện ích</h4>
                    <div className="flex flex-wrap gap-2">
                      {room.hasElevator && <span className="px-3 py-1.5 bg-surface-container rounded-lg text-xs font-bold border border-outline-variant/20 flex items-center gap-2"><span className="material-symbols-outlined text-sm">elevator</span> Thang máy</span>}
                      {room.hasWashingMachine && <span className="px-3 py-1.5 bg-surface-container rounded-lg text-xs font-bold border border-outline-variant/20 flex items-center gap-2"><span className="material-symbols-outlined text-sm">local_laundry_service</span> Máy giặt</span>}
                      {room.hasFridge && <span className="px-3 py-1.5 bg-surface-container rounded-lg text-xs font-bold border border-outline-variant/20 flex items-center gap-2"><span className="material-symbols-outlined text-sm">kitchen</span> Tủ lạnh</span>}
                      {room.hasKitchen && <span className="px-3 py-1.5 bg-surface-container rounded-lg text-xs font-bold border border-outline-variant/20 flex items-center gap-2"><span className="material-symbols-outlined text-sm">cooking</span> Bếp nấu</span>}
                      {room.hasHeater && <span className="px-3 py-1.5 bg-surface-container rounded-lg text-xs font-bold border border-outline-variant/20 flex items-center gap-2"><span className="material-symbols-outlined text-sm">hot_tub</span> Nóng lạnh</span>}
                    </div>
                  </div>
                </div>

                {/* Landlord & Contact */}
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
                          <img key={idx} src={`http://localhost:5000/uploads/${img}`} className="w-24 h-24 object-cover rounded-xl border border-outline-variant/20 cursor-pointer hover:scale-105 transition-transform" alt="review" onClick={() => window.open(`http://localhost:5000/uploads/${img}`)} />
                        ))}
                        {JSON.parse(review.videos || "[]").map((vid, idx) => (
                          <video key={idx} src={`http://localhost:5000/uploads/${vid}`} className="w-24 h-24 object-cover rounded-xl border border-outline-variant/20 bg-black" controls />
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

      {/* Lightbox / Fullscreen Image */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[99999] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-8 right-8 text-white text-4xl hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>
          <img 
            src={selectedImage} 
            alt="Full size" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
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