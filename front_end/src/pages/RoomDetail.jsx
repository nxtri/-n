import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import roomApi from '../api/roomApi';
import contractApi from '../api/contractApi'; // Import API để chủ nhà phản hồi
import reportApi from '../api/reportApi';

const RoomDetail = () => {
  const { id } = useParams(); // Lấy ID phòng từ URL
  const [room, setRoom] = useState(null);
  const [mainImage, setMainImage] = useState(null);       // Lưu tên ảnh đang được chọn làm ảnh to
  const [isFullScreen, setIsFullScreen] = useState(false); // Trạng thái bật/tắt xem full màn hình
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Nhớ vị trí ảnh đang xem
  const [selectedImage, setSelectedImage] = useState(null);      // Quản lý bật/tắt Lightbox
  
  // Hàm vẽ sao đánh giá (Hỗ trợ sao lẻ chính xác đến 1 chữ số thập phân)
  const renderStars = (rating, idPrefix = 'detail', size = 18) => {
    const stars = [];
    const absoluteRating = Number(rating) || 0;
    const roundedRating = Math.round(absoluteRating * 10) / 10; // Làm tròn tới 0.1 (vd: 3.1, 3.2...)
    
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(roundedRating)) {
        // Sao vàng đầy
        stars.push(
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#f59e0b" style={{ marginRight: '2px' }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      } else if (i === Math.ceil(roundedRating) && roundedRating % 1 !== 0) {
        // Sao vàng phần lẻ (Fractional Star)
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
        // Sao xám rỗng
        stars.push(
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#e4e4e4" style={{ marginRight: '2px' }}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      }
    }
    return stars;
  };


  // =========================================================
  // STATE CHO TÍNH NĂNG ĐÁNH GIÁ (REVIEW)
  // =========================================================
  const [activeReviewFilter, setActiveReviewFilter] = useState('ALL');
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const [reviews, setReviews] = useState([]); // Chứa dữ liệu đánh giá THẬT

  // State cho Chủ nhà phản hồi
  const [replyingTo, setReplyingTo] = useState(null); // ID của đánh giá đang được phản hồi
  const [replyText, setReplyText] = useState('');

  // State cho phần Báo xấu
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    reason: '',
    description: '',
    fullName: user?.fullName || '',
    phoneNumber: user?.phone || '',
  });

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportData.reason) return alert('Vui lòng chọn lý do phản ánh!');
    if (!reportData.fullName || !reportData.phoneNumber) return alert('Vui lòng nhập họ tên và số điện thoại liên hệ!');
    try {
      await reportApi.createReport(id, {
        ...reportData,
        reporterId: user?.id || null
      });
      alert('Đã gửi phản ánh thành công! Xin cảm ơn.');
      setShowReportModal(false);
      setReportData({ reason: '', description: '', fullName: user?.fullName || '', phoneNumber: user?.phone || '' });
    } catch (error) {
      alert('Lỗi khi gửi phản ánh!');
    }
  };
  
  // Hàm làm mạo danh tên (Ví dụ: Xuân Trí -> x******í)
  const maskName = (name) => {
    if (!name) return "K******h";
    const str = name.trim();
    if (str.length <= 2) return str[0] + '***';
    return str.charAt(0).toLowerCase() + '******' + str.charAt(str.length - 1).toLowerCase();
  };

  // 1. Logic lọc Review thật
  const filteredReviews = reviews.filter(review => {
    if (activeReviewFilter === 'ALL') return true;
    if (activeReviewFilter === 'HAS_IMAGE') {
       const imgs = JSON.parse(review.images || "[]");
       const vids = JSON.parse(review.videos || "[]");
       return imgs.length > 0 || vids.length > 0;
    }
    return review.rating === parseInt(activeReviewFilter);
  });

  // 2. Tính toán Thống kê Điểm sao
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
    : 0;

  // 3. Hàm gửi phản hồi của Chủ nhà
  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) return alert("Vui lòng nhập nội dung phản hồi!");
    try {
      await contractApi.replyReview(reviewId, { replyText });
      alert("Đã gửi phản hồi thành công!");
      setReplyingTo(null);
      setReplyText('');
      // Tải lại trang để thấy phản hồi mới
      const response = await roomApi.getRoomById(id);
      setReviews(response.reviews || []);
    } catch (error) {
      alert("Lỗi khi gửi phản hồi!");
    }
  };

  // Nút bấm Filter Component
  const FilterButton = ({ label, filterValue, count }) => {
    const isActive = activeReviewFilter === filterValue;
    return (
      <button 
        onClick={() => setActiveReviewFilter(filterValue)}
        style={{ 
          padding: '10px 20px', 
          background: isActive ? '#eff6ff' : '#ffffff', 
          border: isActive ? '1.5px solid #2563eb' : '1px solid #e2e8f0', 
          color: isActive ? '#2563eb' : '#64748b', 
          borderRadius: '10px', 
          cursor: 'pointer', 
          fontSize: '14px', 
          fontWeight: '500',
          minWidth: '100px',
          transition: 'all 0.2s',
          boxShadow: isActive ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
        }}
      >
        {label} {count !== undefined && `(${count})`}
      </button>
    );
  };

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await roomApi.getRoomById(id);
        setRoom(response.room);
        // 🚨 BẮT LẤY REVIEWS TỪ BACKEND VÀ LƯU VÀO STATE
        setReviews(response.reviews || []);
        // Khi tải phòng xong, tự động lấy ảnh đầu tiên làm ảnh chính
        if (response.room.images) {
          const parsedImages = JSON.parse(response.room.images);
          if (parsedImages.length > 0) {
            setMainImage(parsedImages[0]);
          }
        }
      } catch (error) {
        alert('Phòng không tồn tại!');
        navigate('/');
      }
    };
    fetchRoom();
  }, [id, navigate]);

  if (!room) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải dữ liệu...</p>;

  return (
    <div style={{ padding: '30px 40px', width: '100%', maxWidth: '1400px', boxSizing: 'border-box', margin: '0 auto', fontFamily: "'Inter', sans-serif", backgroundColor: '#f1f5f9' }}>
      <button 
        onClick={() => {
          if (user?.role === 'ADMIN') {
            navigate('/admin', { state: { activeTab: 'ROOMS' } });
          } else {
            navigate('/');
          }
        }} 
        style={{ 
          padding: '10px 18px', 
          marginBottom: '25px', 
          cursor: 'pointer', 
          backgroundColor: '#ffffff', 
          color: '#475569', 
          border: '1px solid #e2e8f0', 
          borderRadius: '10px',
          fontWeight: '600',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
      >
        {user?.role === 'ADMIN' ? '⬅ Quay lại Dashboard' : '⬅ Quay lại Trang chủ'}
      </button>
      
      <div style={{ display: 'flex', gap: '30px' }}>
{/* ================= KHU VỰC HÌNH ẢNH (ẢNH TO TRÊN - ẢNH NHỎ DƯỚI) ================= */}
        <div style={{ flex: '1 1 500px', minWidth: '300px' }}>
          {room.images && JSON.parse(room.images).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* 1. KHUNG ẢNH LỚN BÊN TRÊN */}
              <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '450px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <img 
                  src={`http://localhost:5000/uploads/${JSON.parse(room.images)[currentImageIndex]}`} 
                  alt="Ảnh chính" 
                  onClick={() => setSelectedImage(`http://localhost:5000/uploads/${JSON.parse(room.images)[currentImageIndex]}`)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.5s' }} 
                />
                
                {/* Nút mũi tên Trái */}
                {JSON.parse(room.images).length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === 0 ? JSON.parse(room.images).length - 1 : prev - 1)); }}
                    style={{ position: 'absolute', top: '50%', left: '15px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', zIndex: 10, transition: '0.2s' }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.8)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.6)'}
                  >
                    ❮
                  </button>
                )}
                
                {/* Nút mũi tên Phải */}
                {JSON.parse(room.images).length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === JSON.parse(room.images).length - 1 ? 0 : prev + 1)); }}
                    style={{ position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', zIndex: 10, transition: '0.2s' }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.8)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.6)'}
                  >
                    ❯
                  </button>
                )}
                
                {/* Nút đếm ảnh */}
                <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', zIndex: 10 }}>
                  {currentImageIndex + 1} / {JSON.parse(room.images).length}
                </div>
              </div>

              {/* 2. DÃY ẢNH NHỎ NẰM NGANG BÊN DƯỚI (Chỉ hiện nếu có > 1 ảnh) */}
              {JSON.parse(room.images).length > 1 && (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                  {JSON.parse(room.images).map((imgName, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        flexShrink: 0, // Không cho ảnh bị bóp méo khi có nhiều ảnh
                        width: '100px', 
                        height: '75px', 
                        borderRadius: '10px', 
                        overflow: 'hidden', 
                        border: currentImageIndex === index ? '2px solid #2563eb' : '1px solid #e2e8f0', // Viền xanh khi được chọn
                        transition: 'all 0.2s'
                      }}
                    >
                       <img 
                        src={`http://localhost:5000/uploads/${imgName}`} 
                        alt={`Ảnh thu nhỏ ${index + 1}`} 
                        onClick={() => setCurrentImageIndex(index)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', opacity: currentImageIndex === index ? 1 : 0.6, transition: '0.2s' }} 
                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                        onMouseLeave={(e) => e.target.style.opacity = currentImageIndex === index ? '1' : '0.6'}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ width: '100%', height: '400px', backgroundColor: '#e9ecef', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d', fontSize: '18px' }}>
              Chưa có hình ảnh
            </div>
            
          )}

          <div style={{ marginTop: '30px', background: '#ffffff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: '#0f172a', fontWeight: '700', marginBottom: '15px' }}>Mô tả chi tiết</h3>
        <p style={{ lineHeight: '1.7', color: '#475569', fontSize: '15px' }}>{room.description || 'Chưa có mô tả chi tiết cho phòng này.'}</p>
      </div>


        </div>

        

{/* Bên phải: Thông tin */}
        <div style={{ flex: 1, padding: '30px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tên phòng & Giá */}
          <div style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
            <h2 style={{ color: '#0f172a', margin: '0 0 10px 0', fontSize: '24px', fontWeight: '700' }}>{room.roomType === 'WHOLE_HOUSE' ? '' : 'Phòng '}{room.roomNumber}</h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '28px', color: '#ef4444', fontWeight: '800' }}>{room.price?.toLocaleString()}</span>
              <span style={{ fontSize: '16px', color: '#ef4444', fontWeight: '600' }}>đ/tháng</span>
              <span style={{ marginLeft: '15px', padding: '4px 12px', background: '#eff6ff', color: '#2563eb', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                {room.roomType === 'WHOLE_HOUSE' ? '🏠 Nhà nguyên căn' : '🚪 Phòng trọ'}
              </span>
            </div>
            
            {/* HIỂN THỊ SAO TRUNG BÌNH */}
            {totalReviews > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex' }}>
                   {renderStars(avgRating, 'detail-summary', 16)}
                </div>
                <span style={{ color: '#f59e0b', fontWeight: '700', fontSize: '15px' }}>{Number(avgRating).toFixed(1)}</span>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>({totalReviews} đánh giá)</span>
              </div>
            )}
            
            <p style={{ color: '#666', fontSize: '14px', marginTop: '10px', lineHeight: '1.5' }}>
              <strong>Địa chỉ:</strong> {room.houseNumber ? `${room.houseNumber}, ` : ''}{room.address}
            </p>

          </div>
          
          {/* Thông số cơ bản (Diện tích & Số người) */}
          <div style={{ display: 'grid', gridTemplateColumns: room.roomType === 'WHOLE_HOUSE' ? 'repeat(5, 1fr)' : 'repeat(2, 1fr)', gap: '15px', background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '24px', marginBottom: '8px' }}>📐</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{room.area || 0} m²</span>
            </div>
            {room.roomType === 'WHOLE_HOUSE' && (
              <>
                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 auto' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '24px', marginBottom: '8px' }}>🪜</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{room.numFloors || 1} tầng</span>
                </div>
                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 auto' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '24px', marginBottom: '8px' }}>🛌</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{room.numBedrooms || 1} PN</span>
                </div>
                <div style={{ width: '1px', background: '#e2e8f0', margin: '0 auto' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '24px', marginBottom: '8px' }}>🚽</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{room.numBathrooms || 1} WC</span>
                </div>
              </>
            )}
            <div style={{ width: '1px', background: '#e2e8f0', margin: '0 auto' }}></div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '24px', marginBottom: '8px' }}>👥</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Tối đa {room.maxOccupants} người</span>
            </div>
          </div>

          {/* Chi phí dịch vụ */}
          <div>
            <h4 style={{ color: '#444d62', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px', fontWeight: '700' }}>Thông tin dịch vụ:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', color: '#475569', fontWeight: 'bold', textAlign: 'left' }}>
              <p style={{ margin: 0 }}>⚡ Điện: <span style={{ fontWeight: '600', color: '#1e293b' }}>{room.roomType === 'WHOLE_HOUSE' ? 'Tự thanh toán điện lực' : (room.electricityPrice ? `${room.electricityPrice.toLocaleString()}đ/ký` : 'Theo giá')}</span></p>
              <p style={{ margin: 0 }}>💧 Nước: <span style={{ fontWeight: '600', color: '#1e293b' }}>{room.waterPrice ? `${room.waterPrice.toLocaleString()}đ/khối` : 'Theo giá'}</span></p>
              <p style={{ margin: 0 }}>🛵 Gửi xe: <span style={{ fontWeight: '600', color: '#1e293b' }}>{room.parkingPrice ? `${room.parkingPrice.toLocaleString()}đ/tháng` : 'Miễn phí'}</span></p>
              <p style={{ margin: 0 }}>🌐 Mạng: <span style={{ fontWeight: '600', color: '#1e293b' }}>{room.internetPrice ? `${room.internetPrice.toLocaleString()}đ/tháng` : 'Tự túc'}</span></p>
              <p style={{ margin: 0, gridColumn: 'span 2' }}>🧹 Vệ sinh/Dịch vụ: <span style={{ fontWeight: '600', color: '#1e293b' }}>{room.servicePrice ? `${room.servicePrice.toLocaleString()}đ/tháng` : 'Miễn phí'}</span></p>
            </div>
          </div>
          

          {/* Tiện ích */}
          <div>
            <h4 style={{ color: '#444d62', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px', fontWeight: '700' }}>Tiện ích có sẵn:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '13px', color: '#475569' }}>
              {room.hasElevator && <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '15px', fontWeight: '500' }}>🛗 Thang máy</span>}
              {room.hasWashingMachine && <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '15px', fontWeight: '500' }}>🧺 Máy giặt</span>}
              {room.hasFridge && <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '15px', fontWeight: '500' }}>❄️ Tủ lạnh</span>}
              {room.hasKitchen && <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '15px', fontWeight: '500' }}>🍳 Bếp nấu</span>}
              {room.hasHeater && <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '15px', fontWeight: '500' }}>🚿 Nóng lạnh</span>}
              {!(room.hasElevator || room.hasWashingMachine || room.hasFridge || room.hasKitchen || room.hasHeater) && (
                <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Chưa cập nhật tiện ích</span>
              )}
            </div>
          </div>
          
          {/* THÔNG TIN LIÊN HỆ CHỦ NHÀ */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', textAlign: 'center', marginTop: '10px' }}>
            <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Người cho thuê:</p>
            <h4 style={{ margin: '0 0 18px 0', color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>
              {room.landlord?.fullName || 'Đang cập nhật'}
            </h4>
  
            {/* ĐÃ SỬA: Chuyển button thành thẻ a để click mở Zalo */}
            <a 
              href={room.landlord?.phone ? `https://zalo.me/${room.landlord.phone}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                width: '100%', 
                background: '#2563eb', 
                color: 'white', 
                border: 'none', 
                padding: '14px', 
                borderRadius: '12px', 
                fontSize: '16px', 
                fontWeight: '700', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '10px',
                textDecoration: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)',
                transition: 'all 0.2s'
              }}
            >
               
              📞 {room.landlord?.phone ? `Liên hệ Zalo: ${room.landlord.phone}` : 'Chưa có SĐT'}
            </a>
  
            <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#adb5bd' }}>Vui lòng liên hệ trực tiếp để xem phòng</p>
            <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
              <button 
                onClick={() => setShowReportModal(true)}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '6px', fontSize: '13px', fontWeight: '500' }}>
                🚩 Có vấn đề với tin đăng này? <strong>Báo xấu ngay</strong>
              </button>
            </div>
          </div>

        </div>
      </div>
            {/* ========================================= */}
      {/* KHU VỰC ĐÁNH GIÁ (DỮ LIỆU THẬT + PHẢN HỒI)  */}
      {/* ========================================= */}
      <div style={{ marginTop: '40px', background: '#ffffff', padding: '35px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0, color: '#0f172a', textTransform: 'uppercase', fontSize: '18px', marginBottom: '30px', fontWeight: '800' }}>
          Đánh giá từ người thuê ({totalReviews})
        </h3>

        {/* HEADER THỐNG KÊ */}
        <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '30px', display: 'flex', gap: '50px', alignItems: 'center', borderRadius: '16px', marginBottom: '35px' }}>
          <div style={{ textAlign: 'center', minWidth: '150px' }}>
            <div style={{ fontSize: '42px', color: '#2563eb', fontWeight: '800' }}>
              {Number(avgRating).toFixed(1)} <span style={{ fontSize: '18px', color: '#64748b', fontWeight: '500' }}>/ 5</span>
            </div>
            <div style={{ color: '#f59e0b', fontSize: '20px', marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
               {renderStars(avgRating, 'detail-avg', 24)}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <FilterButton label="Tất Cả" filterValue="ALL" />
            <FilterButton label="5 Sao" filterValue="5" count={reviews.filter(r => r.rating === 5).length} />
            <FilterButton label="4 Sao" filterValue="4" count={reviews.filter(r => r.rating === 4).length} />
            <FilterButton label="3 Sao" filterValue="3" count={reviews.filter(r => r.rating === 3).length} />
            <FilterButton label="2 Sao" filterValue="2" count={reviews.filter(r => r.rating === 2).length} />
            <FilterButton label="1 Sao" filterValue="1" count={reviews.filter(r => r.rating === 1).length} />
            <FilterButton label="Có Hình Ảnh/Video" filterValue="HAS_IMAGE" count={reviews.filter(r => JSON.parse(r.images || "[]").length > 0 || JSON.parse(r.videos || "[]").length > 0).length} />
          </div>
        </div>

        {/* DANH SÁCH COMMENT */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredReviews.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#adb5bd', padding: '30px' }}>Chưa có đánh giá nào phù hợp.</div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} style={{ display: 'flex', gap: '15px', borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#adb5bd', fontSize: '20px', flexShrink: 0 }}>👤</div>

                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', color: '#334155', fontWeight: 'bold' }}>
                    {review.isAnonymous ? maskName(review.tenant?.fullName) : (review.tenant?.fullName || 'Khách thuê')}
                  </div>
                  <div style={{ color: '#ee4d2d', fontSize: '12px', margin: '4px 0', display: 'flex' }}>
                    {renderStars(review.rating, `review-${review.id}`, 14)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#adb5bd', marginBottom: '10px' }}>
                    Đăng ngày: {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>
                    {review.comment}
                  </div>

                  {/* HIỂN THỊ ẢNH VÀ VIDEO */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                    {JSON.parse(review.images || "[]").map((img, idx) => (
                      <img key={`img-${idx}`} src={`http://localhost:5000/uploads/${img}`} alt="review" style={{ width: '72px', height: '72px', objectFit: 'cover', border: '1px solid #f8fafc', borderRadius: '2px', cursor: 'pointer' }} onClick={() => window.open(`http://localhost:5000/uploads/${img}`)} />
                    ))}
                    {JSON.parse(review.videos || "[]").map((vid, idx) => (
                      <video key={`vid-${idx}`} src={`http://localhost:5000/uploads/${vid}`} style={{ width: '72px', height: '72px', objectFit: 'cover', border: '1px solid #f8fafc', borderRadius: '2px', background: '#000' }} controls />
                    ))}
                  </div>

                  {/* PHẢN HỒI CỦA CHỦ NHÀ */}
                  {review.landlordReply ? (
                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', borderLeft: '3px solid #2563eb', marginTop: '10px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#2563eb', marginBottom: '5px' }}>Phản hồi của Chủ nhà:</div>
                      <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>{review.landlordReply}</div>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>{new Date(review.replyDate).toLocaleDateString('vi-VN')}</div>
                    </div>
                  ) : (
                    // Nếu chưa phản hồi & User hiện tại chính là Chủ nhà -> Hiện nút Phản hồi
                    user?.role === 'LANDLORD' && user?.id === room.landlordId && (
                      <div style={{ marginTop: '10px' }}>
                        {replyingTo === review.id ? (
                          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Nhập phản hồi của bạn..." style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit' }} rows="2" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              <button onClick={() => handleReplySubmit(review.id)} style={{ padding: '8px', background: '#1266dd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Gửi</button>
                              <button onClick={() => { setReplyingTo(null); setReplyText(''); }} style={{ padding: '8px', background: '#f8fafc', color: '#334155', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Hủy</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setReplyingTo(review.id)} style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', padding: 0 }}>
                            💬 Phản hồi đánh giá này
                          </button>
                        )}
                      </div>
                    )
                  )}

                </div>
              </div>
            ))
          )}
        </div>
      </div>
      

      {/* ============================================== */}
      {/* MÀN HÌNH ĐEN XEM ẢNH FULL SCREEN               */}
      {/* ============================================== */}
      {isFullScreen && (
        <div 
          onClick={() => setIsFullScreen(false)} // Bấm ra ngoài màn đen để đóng
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out'
          }}
        >
          {/* Nút X tắt (Góc trên bên phải) */}
          <span style={{ position: 'absolute', top: '20px', right: '40px', color: 'white', fontSize: '40px', cursor: 'pointer', fontWeight: 'bold' }}>&times;</span>
          
          {/* Ảnh được phóng to */}
          <img 
            src={`http://localhost:5000/uploads/${mainImage}`} 
            alt="Full screen" 
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }} 
          />
        </div>
      )}
      {/* ========================================================= */}
      {/* MODAL PHÓNG TO ẢNH (LIGHTBOX) TRONG ROOM DETAIL           */}
      {/* ========================================================= */}
      {selectedImage && room && room.images && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000, overflow: 'hidden' }}
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            style={{ position: 'absolute', top: '20px', right: '30px', background: 'transparent', border: 'none', color: '#212529', fontSize: '35px', cursor: 'pointer', fontWeight: 'bold' }}
            title="Đóng (Esc)"
          >✖</button>
          
          {JSON.parse(room.images).length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === 0 ? JSON.parse(room.images).length - 1 : prev - 1)); }}
                style={{ position: 'fixed', top: '50%', left: '30px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.05)', color: 'white', border: 'none', borderRadius: '50%', width: '60px', height: '60px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', zIndex: 100001, transition: '0.2s' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              >❮</button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === JSON.parse(room.images).length - 1 ? 0 : prev + 1)); }}
                style={{ position: 'fixed', top: '50%', right: '30px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.05)', color: 'white', border: 'none', borderRadius: '50%', width: '60px', height: '60px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', zIndex: 100001, transition: '0.2s' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              >❯</button>
            </>
          )}
          
          <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', color: 'white', fontSize: '16px', fontWeight: 'bold', zIndex: 100002, background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '20px' }}>
             {currentImageIndex + 1} / {JSON.parse(room.images).length} ảnh
          </div>

          <img 
            src={`http://localhost:5000/uploads/${JSON.parse(room.images)[currentImageIndex]}`} 
            alt="Phóng to" 
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', cursor: 'zoom-out' }} 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL PHẢN ÁNH TIN ĐĂNG (BÁO XẤU)                         */}
      {/* ========================================================= */}
      {showReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ background: '#f8fafc', width: '90%', maxWidth: '400px', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button 
              onClick={() => setShowReportModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#adb5bd' }}>✖</button>
            
            <h3 style={{ margin: '0 0 20px 0', color: '#334155', fontSize: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>Phản ánh tin đăng</h3>
            
            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block', fontSize: '15px' }}>Lý do phản ánh:</label>
                {[
                  'Tin có dấu hiệu lừa đảo',
                  'Tin trùng lặp nội dung',
                  'Không liên hệ được chủ tin đăng',
                  'Thông tin không đúng thực tế (giá, diện tích, hình ảnh...)',
                  'Lý do khác'
                ].map(reason => (
                  <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="reason" 
                      value={reason} 
                      checked={reportData.reason === reason} 
                      onChange={(e) => setReportData({...reportData, reason: e.target.value})}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#475569' }}>{reason}</span>
                  </label>
                ))}
              </div>

              <div>
                <textarea 
                  placeholder="Mô tả thêm" 
                  value={reportData.description}
                  onChange={(e) => setReportData({...reportData, description: e.target.value})}
                  rows="3" 
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div>
                <h4 style={{ margin: '5px 0 10px 0', fontSize: '15px', color: '#334155' }}>Thông tin liên hệ</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>Họ tên của bạn</label>
                    <input 
                      type="text" 
                      required 
                      value={reportData.fullName}
                      onChange={(e) => setReportData({...reportData, fullName: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '4px' }}>Số điện thoại của bạn</label>
                    <input 
                      type="text" 
                      required 
                      value={reportData.phoneNumber}
                      onChange={(e) => setReportData({...reportData, phoneNumber: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#ee4d2d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
                Gửi phản ánh
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoomDetail;