import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import roomApi from '../api/roomApi';
import contractApi from '../api/contractApi'; // Import API để chủ nhà phản hồi

const RoomDetail = () => {
  const { id } = useParams(); // Lấy ID phòng từ URL
  const [room, setRoom] = useState(null);
  const [mainImage, setMainImage] = useState(null);       // Lưu tên ảnh đang được chọn làm ảnh to
  const [isFullScreen, setIsFullScreen] = useState(false); // Trạng thái bật/tắt xem full màn hình
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Nhớ vị trí ảnh đang xem
  const [selectedImage, setSelectedImage] = useState(null);      // Quản lý bật/tắt Lightbox


  // =========================================================
  // STATE CHO TÍNH NĂNG ĐÁNH GIÁ (REVIEW)
  // =========================================================
  const [activeReviewFilter, setActiveReviewFilter] = useState('ALL');
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const [reviews, setReviews] = useState([]); // Chứa dữ liệu đánh giá THẬT

  // State cho Chủ nhà phản hồi
  const [replyingTo, setReplyingTo] = useState(null); // ID của đánh giá đang được phản hồi
  const [replyText, setReplyText] = useState('');
  
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
        style={{ padding: '6px 15px', background: '#fff', border: isActive ? '1px solid #ee4d2d' : '1px solid #e0e0e0', color: isActive ? '#ee4d2d' : '#333', borderRadius: '2px', cursor: 'pointer', fontSize: '14px', minWidth: '100px' }}
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
    <div style={{ padding: '20px 40px', width: '100%', boxSizing: 'border-box', margin: '0 auto', fontFamily: 'Arial' }}>
      <button onClick={() => navigate('/')} style={{ padding: '8px 15px', marginBottom: '20px', cursor: 'pointer' }}>⬅ Quay lại Trang chủ</button>
      
      <div style={{ display: 'flex', gap: '30px' }}>
{/* ================= KHU VỰC HÌNH ẢNH (ẢNH TO TRÊN - ẢNH NHỎ DƯỚI) ================= */}
        <div style={{ flex: '1 1 500px', minWidth: '300px' }}>
          {room.images && JSON.parse(room.images).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* 1. KHUNG ẢNH LỚN BÊN TRÊN */}
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <img 
                  src={`http://localhost:5000/uploads/${JSON.parse(room.images)[currentImageIndex]}`} 
                  alt="Ảnh chính" 
                  onClick={() => setSelectedImage(`http://localhost:5000/uploads/${JSON.parse(room.images)[currentImageIndex]}`)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: '0.3s' }} 
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
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        border: currentImageIndex === index ? '3px solid #0b5ed7' : '2px solid transparent', // Viền xanh khi được chọn
                        transition: '0.2s'
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

          <div style={{ marginTop: '30px', background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h3>Mô tả chi tiết</h3>
        <p style={{ lineHeight: '1.6', color: '#444' }}>{room.description || 'Chưa có mô tả chi tiết cho phòng này.'}</p>
      </div>


        </div>

        

{/* Bên phải: Thông tin */}
        <div style={{ flex: 1, padding: '25px', background: '#fff', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Tên phòng & Giá */}
          <div style={{ textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
            <h2 style={{ color: '#333', margin: '0 0 10px 0', fontSize: '22px' }}>Phòng {room.roomNumber}</h2>
            <p style={{ fontSize: '26px', color: '#ff1a1a', fontWeight: 'bold', margin: 0 }}>{room.price?.toLocaleString()} VNĐ/tháng</p>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '10px', lineHeight: '1.5' }}>
              <strong>Địa chỉ:</strong> {room.houseNumber ? `${room.houseNumber}, ` : ''}{room.address}
            </p>
          </div>
          
          {/* Thông số cơ bản (Diện tích & Số người) */}
          <div style={{ display: 'flex', justifyContent: 'space-around', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '20px', marginBottom: '5px' }}>📐</span>
              <span style={{ fontWeight: 'bold', color: '#333' }}>{room.area || 0} m²</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '20px', marginBottom: '5px' }}>👥</span>
              <span style={{ fontWeight: 'bold', color: '#333' }}>Tối đa {room.maxOccupants} người</span>
            </div>
          </div>

          {/* Chi phí dịch vụ */}
          <div>
            <h4 style={{ color: '#888', textTransform: 'uppercase', fontSize: '13px', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Thông tin dịch vụ:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '15px', color: '#444' }}>
              <p style={{ margin: 0 }}>⚡ Điện: <span style={{ fontWeight: 'bold' }}>{room.electricityPrice ? `${room.electricityPrice.toLocaleString()}đ/ký` : 'Theo giá nhà nước'}</span></p>
              <p style={{ margin: 0 }}>💧 Nước: <span style={{ fontWeight: 'bold' }}>{room.waterPrice ? `${room.waterPrice.toLocaleString()}đ/khối` : 'Theo giá nhà nước'}</span></p>
              <p style={{ margin: 0 }}>🛵 Gửi xe: <span style={{ fontWeight: 'bold' }}>{room.parkingPrice ? `${room.parkingPrice.toLocaleString()}đ/tháng` : 'Miễn phí'}</span></p>
              <p style={{ margin: 0 }}>🌐 Mạng: <span style={{ fontWeight: 'bold' }}>{room.internetPrice ? `${room.internetPrice.toLocaleString()}đ/tháng` : 'Tự túc'}</span></p>
              <p style={{ margin: 0, gridColumn: 'span 2' }}>🧹 Vệ sinh/Dịch vụ: <span style={{ fontWeight: 'bold' }}>{room.servicePrice ? `${room.servicePrice.toLocaleString()}đ/tháng` : 'Miễn phí'}</span></p>
            </div>
          </div>

          {/* Tiện ích */}
          <div>
            <h4 style={{ color: '#888', textTransform: 'uppercase', fontSize: '13px', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>Tiện ích có sẵn:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '14px', color: '#555' }}>
              {room.hasElevator && <span style={{ background: '#f0f0f0', padding: '5px 10px', borderRadius: '15px' }}>🛗 Thang máy</span>}
              {room.hasWashingMachine && <span style={{ background: '#f0f0f0', padding: '5px 10px', borderRadius: '15px' }}>🧺 Máy giặt</span>}
              {room.hasFridge && <span style={{ background: '#f0f0f0', padding: '5px 10px', borderRadius: '15px' }}>❄️ Tủ lạnh</span>}
              {room.hasKitchen && <span style={{ background: '#f0f0f0', padding: '5px 10px', borderRadius: '15px' }}>🍳 Bếp nấu</span>}
              {room.hasHeater && <span style={{ background: '#f0f0f0', padding: '5px 10px', borderRadius: '15px' }}>🚿 Nóng lạnh</span>}
              {!(room.hasElevator || room.hasWashingMachine || room.hasFridge || room.hasKitchen || room.hasHeater) && (
                <span style={{ fontStyle: 'italic', color: '#999' }}>Chưa cập nhật tiện ích</span>
              )}
            </div>
          </div>
          
          {/* THÔNG TIN LIÊN HỆ CHỦ NHÀ */}
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '12px', border: '1px solid #eee', textAlign: 'center', marginTop: '20px' }}>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '13px' }}>Chủ nhà / Người cho thuê:</p>
              <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>
                {room.landlord?.fullName || 'Đang cập nhật'}
              </h4>
              
              <button style={{ width: '100%', background: '#00a651', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                📞 {room.landlord?.phone || 'Chưa có SĐT'}
              </button>
              <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#888' }}>Vui lòng liên hệ trực tiếp để xem phòng</p>
            </div>

        </div>
      </div>
            {/* ========================================= */}
      {/* KHU VỰC ĐÁNH GIÁ (DỮ LIỆU THẬT + PHẢN HỒI)  */}
      {/* ========================================= */}
      <div style={{ marginTop: '40px', background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #eaeaea' }}>
        <h3 style={{ marginTop: 0, color: '#333', textTransform: 'uppercase', fontSize: '18px', marginBottom: '20px' }}>
          Đánh giá từ người thuê trước ({totalReviews})
        </h3>

        {/* HEADER THỐNG KÊ */}
        <div style={{ background: '#fffbf8', border: '1px solid #f9ede5', padding: '30px', display: 'flex', gap: '40px', alignItems: 'center', borderRadius: '4px', marginBottom: '25px' }}>
          <div style={{ textAlign: 'center', minWidth: '120px' }}>
            <div style={{ fontSize: '32px', color: '#ee4d2d', fontWeight: 'bold' }}>
              {avgRating} <span style={{ fontSize: '18px', color: '#ee4d2d', fontWeight: 'normal' }}>trên 5</span>
            </div>
            <div style={{ color: '#ee4d2d', fontSize: '20px', marginTop: '5px' }}>⭐⭐⭐⭐⭐</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
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
            <div style={{ textAlign: 'center', color: '#888', padding: '30px' }}>Chưa có đánh giá nào phù hợp.</div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} style={{ display: 'flex', gap: '15px', borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888', fontSize: '20px', flexShrink: 0 }}>👤</div>

                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', color: '#333', fontWeight: 'bold' }}>
                    {review.isAnonymous ? maskName(review.name) : review.name}
                  </div>
                  <div style={{ color: '#ee4d2d', fontSize: '12px', margin: '4px 0' }}>
                    {'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
                    Đăng ngày: {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.5', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>
                    {review.comment}
                  </div>

                  {/* HIỂN THỊ ẢNH VÀ VIDEO */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                    {JSON.parse(review.images || "[]").map((img, idx) => (
                      <img key={`img-${idx}`} src={`http://localhost:5000/uploads/${img}`} alt="review" style={{ width: '72px', height: '72px', objectFit: 'cover', border: '1px solid #e0e0e0', borderRadius: '2px', cursor: 'pointer' }} onClick={() => window.open(`http://localhost:5000/uploads/${img}`)} />
                    ))}
                    {JSON.parse(review.videos || "[]").map((vid, idx) => (
                      <video key={`vid-${idx}`} src={`http://localhost:5000/uploads/${vid}`} style={{ width: '72px', height: '72px', objectFit: 'cover', border: '1px solid #e0e0e0', borderRadius: '2px', background: '#000' }} controls />
                    ))}
                  </div>

                  {/* PHẢN HỒI CỦA CHỦ NHÀ */}
                  {review.landlordReply ? (
                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', borderLeft: '3px solid #0b5ed7', marginTop: '10px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0b5ed7', marginBottom: '5px' }}>Phản hồi của Chủ nhà:</div>
                      <div style={{ fontSize: '14px', color: '#444', lineHeight: '1.5' }}>{review.landlordReply}</div>
                      <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>{new Date(review.replyDate).toLocaleDateString('vi-VN')}</div>
                    </div>
                  ) : (
                    // Nếu chưa phản hồi & User hiện tại chính là Chủ nhà -> Hiện nút Phản hồi
                    user?.role === 'LANDLORD' && user?.id === room.landlordId && (
                      <div style={{ marginTop: '10px' }}>
                        {replyingTo === review.id ? (
                          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Nhập phản hồi của bạn..." style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', fontFamily: 'inherit' }} rows="2" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              <button onClick={() => handleReplySubmit(review.id)} style={{ padding: '8px', background: '#0b5ed7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Gửi</button>
                              <button onClick={() => { setReplyingTo(null); setReplyText(''); }} style={{ padding: '8px', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Hủy</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setReplyingTo(review.id)} style={{ background: 'transparent', border: 'none', color: '#0b5ed7', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', padding: 0 }}>
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
            style={{ position: 'absolute', top: '20px', right: '30px', background: 'transparent', border: 'none', color: '#fff', fontSize: '35px', cursor: 'pointer', fontWeight: 'bold' }}
            title="Đóng (Esc)"
          >✖</button>
          
          {JSON.parse(room.images).length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === 0 ? JSON.parse(room.images).length - 1 : prev - 1)); }}
                style={{ position: 'fixed', top: '50%', left: '30px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '50%', width: '60px', height: '60px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', zIndex: 100001, transition: '0.2s' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              >❮</button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === JSON.parse(room.images).length - 1 ? 0 : prev + 1)); }}
                style={{ position: 'fixed', top: '50%', right: '30px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '50%', width: '60px', height: '60px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', zIndex: 100001, transition: '0.2s' }}
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
    </div>
  );
};

export default RoomDetail;