import React, { useState } from 'react';
import contractApi from '../../api/contractApi';
import { useDashboardContext } from '../../context/DashboardContext';

/**
 * Component ReviewModal
 * Chức năng: Cho phép khách thuê đánh giá phòng và chủ nhà sau khi kết thúc hợp đồng.
 * - Đánh giá theo số sao (1-5).
 * - Viết nhận xét chi tiết.
 * - Tải lên hình ảnh/video minh chứng.
 * - Tùy chọn hiển thị ẩn danh để bảo vệ quyền riêng tư.
 * - Hiển thị phản hồi từ chủ nhà nếu có.
 */
const ReviewModal = ({ 
  showReviewModal,    // State điều khiển đóng/mở modal
  setShowReviewModal, // Hàm cập nhật state đóng/mở
  reviewData,         // Dữ liệu đánh giá hiện tại (rating, comment, isAnonymous...)
  setReviewData,      // Hàm cập nhật dữ liệu đánh giá
  myReviews,          // Danh sách các đánh giá của người dùng
  fetchMyReviews      // Hàm tải lại danh sách đánh giá từ server
}) => {
  const { user } = useDashboardContext();
  const [reviewFiles, setReviewFiles] = useState([]); // State lưu trữ file ảnh/video được chọn

  /**
   * Xử lý gửi đánh giá lên server
   */
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('rating', reviewData.rating);
      formData.append('comment', reviewData.comment);
      formData.append('isAnonymous', reviewData.isAnonymous);
      
      // Đính kèm các file đa phương tiện vào form data
      reviewFiles.forEach(file => {
        formData.append('reviewImages', file);
      });

      // Gọi API gửi đánh giá cho hợp đồng tương ứng
      await contractApi.submitReview(reviewData.contractId, formData);
      alert('Cảm ơn bạn đã đánh giá! Đánh giá đã được ghi nhận trên hệ thống.');
      setShowReviewModal(false);
      if (fetchMyReviews) fetchMyReviews(); // Tải lại dữ liệu sau khi gửi thành công
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi gửi đánh giá');
    }
  };

  if (!showReviewModal) return null;

  return (      
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
      <div style={{ background: '#ffffff', width: '500px', borderRadius: '12px', padding: '25px', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        {/* Nút đóng modal */}
        <button onClick={() => setShowReviewModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✖</button>
        
        <h3 style={{ color: '#ef4444', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {reviewData.comment ? '👁️ Xem & Cập nhật đánh giá' : '⭐ Đánh giá trải nghiệm thuê phòng'}
        </h3>

        <form onSubmit={handleSubmitReview}>
          
          {/* Hiển thị phản hồi từ Chủ nhà nếu có */}
          {reviewData.landlordReply && (
            <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #3b82f6', marginBottom: '20px', textAlign: 'left' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold', color: '#1e40af' }}>💬 Phản hồi từ Chủ nhà:</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#0f172a', lineHeight: '1.5' }}>{reviewData.landlordReply}</p>
            </div>
          )}

          {/* Phần chọn số sao */}
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
            {/* Chú thích mức độ hài lòng tương ứng với số sao */}
            <div style={{ fontSize: '13px', color: '#ef4444', marginTop: '5px', fontWeight: 'bold' }}>
              {reviewData.rating === 5 ? 'Tuyệt vời' : reviewData.rating === 4 ? 'Rất tốt' : reviewData.rating === 3 ? 'Bình thường' : reviewData.rating === 2 ? 'Tệ' : 'Rất tệ'}
            </div>
          </div>

          {/* Ô nhập nội dung nhận xét */}
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

          {/* Phần tải lên tệp đa phương tiện */}
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

          {/* Lựa chọn đánh giá ẩn danh */}
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
      
      
  );
};

export default ReviewModal;