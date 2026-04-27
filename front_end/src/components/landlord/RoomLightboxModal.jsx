import React from 'react';

/**
 * Component RoomLightboxModal
 * Chức năng: Hiển thị trình xem ảnh (Lightbox) khi người dùng nhấn vào ảnh phòng.
 * - Phóng to ảnh được chọn.
 * - Cho phép chuyển đổi qua lại giữa các ảnh của phòng (Next/Previous).
 * - Hiển thị chỉ số ảnh hiện tại (ví dụ: 1 / 5).
 */
const RoomLightboxModal = ({ 
  selectedImage,       // Ảnh hiện tại đang được chọn (URL/Tên file)
  viewRoomDetails,     // Đối tượng chi tiết phòng chứa danh sách tất cả các ảnh
  currentImageIndex,   // Vị trí index của ảnh đang hiển thị trong mảng ảnh
  setCurrentImageIndex, // Hàm cập nhật index khi nhấn Next/Prev
  setSelectedImage     // Hàm để đóng lightbox (set về null)
}) => {
  if (!selectedImage || !viewRoomDetails) return null;

  return (        <div 
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

      
  );
};

export default RoomLightboxModal;