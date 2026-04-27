import React from 'react';

/**
 * COMPONENT: ReviewDetailModal
 * Chức năng: Hiển thị và quản lý danh sách các đánh giá (reviews) của một phòng trọ.
 * Các tính năng chính:
 * 1. Xem danh sách đánh giá kèm số sao, nội dung và hình ảnh thực tế.
 * 2. Bộ lọc đánh giá theo số sao (1-5 sao).
 * 3. Tìm kiếm đánh giá theo tên khách hàng hoặc nội dung bình luận.
 * 4. Xóa các đánh giá không phù hợp hoặc vi phạm tiêu chuẩn cộng đồng.
 */
const ReviewDetailModal = ({ 
  selectedRoomReviews,    // Đối tượng chứa dữ liệu phòng và danh sách các đánh giá
  setSelectedRoomReviews, // Hàm đóng modal (set null)
  reviewFilterRating,    // Giá trị lọc số sao hiện tại
  setReviewFilterRating, // Hàm cập nhật bộ lọc số sao
  reviewSearchText,      // Giá trị tìm kiếm hiện tại
  setReviewSearchText,   // Hàm cập nhật từ khóa tìm kiếm
  handleDeleteReview      // Hàm xử lý xóa một đánh giá cụ thể
}) => {
  if (!selectedRoomReviews) return null;

  return (
    <div className="fixed inset-0 bg-on-surface/80 backdrop-blur-sm flex justify-center items-center z-[99999] p-4">
      <div className="bg-surface-container-lowest w-full max-w-[850px] max-h-[85vh] rounded-3xl p-8 shadow-2xl relative flex flex-col border border-outline-variant/30">
        <button 
          onClick={() => setSelectedRoomReviews(null)}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center border-none cursor-pointer hover:bg-error/10 hover:text-error transition-colors" title="Đóng">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        
        <h3 className="m-0 text-on-surface text-2xl font-black border-b border-outline-variant/30 pb-4 mb-6 flex items-center gap-2 pr-12">
          <span className="material-symbols-outlined text-[28px] text-secondary fill-1">star</span> Đánh giá chi tiết: Phòng {selectedRoomReviews.roomNumber}
        </h3>

        {/* THANH CÔNG CỤ: LỌC & TÌM KIẾM */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-surface-container-low p-5 rounded-2xl border border-outline-variant/50">
          <div className="flex-1">
            <label className="block text-[13px] font-bold text-on-surface-variant mb-2">Lọc theo số sao:</label>
            <select 
              value={reviewFilterRating}
              onChange={(e) => setReviewFilterRating(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 outline-none bg-surface-container-lowest text-on-surface font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
              <option value="ALL">Tất cả đánh giá</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
              <option value="4">⭐⭐⭐⭐ (4 sao)</option>
              <option value="3">⭐⭐⭐ (3 sao)</option>
              <option value="2">⭐⭐ (2 sao)</option>
              <option value="1">⭐ (1 sao)</option>
            </select>
          </div>
          <div className="flex-[2]">
            <label className="block text-[13px] font-bold text-on-surface-variant mb-2">Tìm kiếm đánh giá:</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
              <input 
                type="text" 
                value={reviewSearchText}
                onChange={(e) => setReviewSearchText(e.target.value)}
                placeholder="Nhập tên khách hoặc nội dung đánh giá..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 outline-none bg-surface-container-lowest text-on-surface font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
          {selectedRoomReviews.reviews.length === 0 ? (
            <div className="text-center p-12 text-on-surface-variant font-medium opacity-70 italic border border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-low/50">Chưa có đánh giá nào cho phòng này.</div>
          ) : (
            <div className="flex flex-col gap-5">
              {selectedRoomReviews.reviews
                .filter(rev => {
                  const matchRating = reviewFilterRating === 'ALL' || rev.rating.toString() === reviewFilterRating;
                  const matchText = !reviewSearchText || 
                                  (rev.tenant?.fullName || '').toLowerCase().includes(reviewSearchText.toLowerCase()) ||
                                  (rev.comment || '').toLowerCase().includes(reviewSearchText.toLowerCase());
                  return matchRating && matchText;
                })
                .map((rev) => (
                  <div key={rev.id} className="p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/50 relative shadow-sm hover:border-primary/30 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-black text-lg text-on-surface">{rev.tenant?.fullName || 'Khách thuê cũ'}</div>
                        <div className="text-[12px] text-on-surface-variant font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {new Date(rev.createdAt).toLocaleString('vi-VN')}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2.5">
                        <span className="text-[18px] text-secondary tracking-widest fill-1">{'⭐'.repeat(rev.rating)}</span>
                        <button 
                          onClick={() => handleDeleteReview(rev.id)}
                          className="px-3 py-1.5 bg-error/10 text-error border border-error/20 rounded-lg cursor-pointer text-[12px] font-black transition-all hover:bg-error hover:text-white flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span> Xóa đánh giá
                        </button>
                      </div>
                    </div>

                    <div className="text-[14px] text-on-surface leading-relaxed bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                      {rev.comment || <em className="text-on-surface-variant opacity-70">Khách hàng không để lại bình luận.</em>}
                    </div>

                    {/* Hiển thị ảnh kèm theo nếu có */}
                    {rev.images && JSON.parse(rev.images).length > 0 && (
                      <div className="flex gap-3 mt-4 overflow-x-auto pb-1 no-scrollbar">
                        {JSON.parse(rev.images).map((img, i) => (
                          <img 
                            key={i} 
                            src={`http://localhost:5000/uploads/${img}`} 
                            alt="Review" 
                            className="w-[100px] h-[100px] object-cover rounded-xl border border-outline-variant/30 cursor-pointer transition-all hover:scale-105 hover:border-primary" 
                            onClick={() => window.open(`http://localhost:5000/uploads/${img}`)} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailModal;
