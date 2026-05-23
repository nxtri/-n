import React, { useState } from 'react';

const RoomDetailModal = ({
  room,
  reviews,
  onClose,
  currentImageIndex,
  setCurrentImageIndex,
  setSelectedImage,
  activeReviewFilter,
  setActiveReviewFilter,
  renderStars,
  maskName,
  user,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  handleReplySubmit,
  handleEditRoomClick,
  handleDeleteRoom
}) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  if (!room) return null;

  return (
    <>
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-surface-container-lowest w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-outline-variant/30 flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl font-black">meeting_room</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-on-surface tracking-tight leading-none">
                {room.roomType === 'WHOLE_HOUSE' ? 'Căn ' : 'Phòng '}{room.roomNumber}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                  room.status === 'AVAILABLE' ? 'bg-secondary/10 border-secondary/20 text-secondary' : 
                  room.status === 'RENTED' ? 'bg-primary/10 border-primary/20 text-primary' : 
                  'bg-tertiary/10 border-tertiary/20 text-tertiary'
                }`}>
                  {room.status === 'AVAILABLE' ? 'Đang trống' : room.status === 'RENTED' ? 'Đã cho thuê' : 'Đang sửa chữa'}
                </span>
                <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">• Mã: {room.roomCode || '—'}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full hover:bg-surface-container transition-all flex items-center justify-center text-on-surface-variant hover:text-error group"
          >
            <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-8 space-y-10">
            {/* Image Gallery Section */}
            {room.images && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[450px]">
                {(() => {
                  let images = [];
                  try {
                    images = Array.isArray(room.images) ? room.images : JSON.parse(room.images || "[]");
                  } catch (e) { images = []; }
                  
                  if (images.length === 0) return (
                    <div className="col-span-3 bg-surface-container rounded-[2rem] flex items-center justify-center border-2 border-dashed border-outline-variant">
                      <p className="text-on-surface-variant font-bold opacity-40 italic">Chưa có hình ảnh phòng</p>
                    </div>
                  );

                  return (
                    <>
                      <div className="lg:col-span-2 relative group overflow-hidden rounded-[2.5rem] shadow-lg cursor-zoom-in"
                        onClick={() => { setShowImageViewer(true); }}
                      >
                        <img 
                          src={`${import.meta.env.VITE_API_URL}/uploads/${images[currentImageIndex]}`} 
                          alt="Main Room View" 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8 pointer-events-none">
                          <p className="text-white text-xs font-bold uppercase tracking-widest">Xem ảnh phóng lớn</p>
                        </div>
                        
                        {/* Navigation Arrows */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1)); }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center justify-center hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100 z-10"
                        >
                          <span className="material-symbols-outlined font-black">chevron_left</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1)); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center justify-center hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100 z-10"
                        >
                          <span className="material-symbols-outlined font-black">chevron_right</span>
                        </button>
                        
                        {/* Image Count Badge */}
                        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-white tracking-widest uppercase pointer-events-none">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 overflow-hidden">
                        {images.slice(1, 3).map((img, idx) => (
                          <div key={idx} className="relative rounded-[1.5rem] overflow-hidden group shadow-sm h-full">
                            <img 
                              src={`${import.meta.env.VITE_API_URL}/uploads/${img}`} 
                              alt={`View ${idx + 1}`} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-pointer"
                              onClick={() => { setCurrentImageIndex(idx + 1); setShowImageViewer(true); }}
                            />
                            {idx === 1 && images.length > 3 && (
                              <div 
                                className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white cursor-pointer group-hover:bg-black/60 transition-all"
                                onClick={() => { setCurrentImageIndex(2); setShowImageViewer(true); }}
                              >
                                <span className="text-xl font-black">+{images.length - 3}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Ảnh khác</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Info Grid Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Details */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/30">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                    Thông tin chi tiết
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-2xl">payments</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Giá thuê</p>
                        <p className="text-lg font-black text-error">{(room.activeContract?.price || room.price || 0).toLocaleString()} <span className="text-xs">đ/tháng</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-2xl">aspect_ratio</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Diện tích</p>
                        <p className="text-lg font-black text-on-surface">{room.area || '—'} <span className="text-xs">m²</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-2xl">group</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Sức chứa</p>
                        <p className="text-lg font-black text-on-surface">{room.maxOccupants || '—'} <span className="text-xs">người</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Whole House extra info */}
                  {room.roomType === 'WHOLE_HOUSE' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8 mt-6 pt-6 border-t border-outline-variant/30">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-2xl">stairs</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Số tầng</p>
                          <p className="text-lg font-black text-on-surface">{room.numFloors || '—'} <span className="text-xs">tầng</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-2xl">bed</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Phòng ngủ</p>
                          <p className="text-lg font-black text-on-surface">{room.numBedrooms || '—'} <span className="text-xs">phòng</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-2xl">bathtub</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Nhà vệ sinh</p>
                          <p className="text-lg font-black text-on-surface">{room.numBathrooms || '—'} <span className="text-xs">phòng</span></p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 pt-8 border-t border-outline-variant/30 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-2xl">location_on</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Địa chỉ</p>
                      <p className="text-sm font-black text-on-surface">{room.houseNumber ? `${room.houseNumber}, ` : ''}{room.address}</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-outline-variant/30">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-primary rounded-full"></span>
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

              {/* Sidebar Info: Bills & Fees */}
              <div className="space-y-6">
                <div className="bg-primary/5 rounded-[2rem] p-8 border-2 border-dashed border-primary/20 space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                    Chi phí hàng tháng
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant">Tiền điện</span>
                      <span className="text-sm font-black text-on-surface">
                        {room.roomType === 'WHOLE_HOUSE' ? 'Tự trả' : 
                          (room.activeContract ? 
                            (room.activeContract.isDirectUtilityPayment ? 'Tự trả' : `${(room.activeContract.electricityPrice || 0).toLocaleString()}đ/ký`) :
                            (room.electricityPrice ? `${room.electricityPrice.toLocaleString()}đ/ký` : 'Giá NN')
                          )
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant">Tiền nước</span>
                      <span className="text-sm font-black text-on-surface">
                        {room.activeContract ? 
                          `${(room.activeContract.waterPrice || 0).toLocaleString()}đ/m³` :
                          (room.waterPrice ? `${room.waterPrice.toLocaleString()}đ/m³` : 'Giá NN')
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant">Internet</span>
                      <span className="text-sm font-black text-on-surface">
                        {room.activeContract ? 
                          `${(room.activeContract.internetPrice || 0).toLocaleString()}đ` :
                          (room.internetPrice ? `${room.internetPrice.toLocaleString()}đ` : 'Tự túc')
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-on-surface-variant">Gửi xe</span>
                      <span className="text-sm font-black text-on-surface">
                        {room.activeContract ? 
                          `${(room.activeContract.parkingPrice || 0).toLocaleString()}đ/xe` :
                          (room.parkingPrice ? `${room.parkingPrice.toLocaleString()}đ/xe` : 'Free')
                        }
                      </span>
                    </div>
                    <div className="pt-4 border-t border-primary/10 flex justify-between items-center">
                      <span className="text-xs font-bold text-primary">Dịch vụ chung</span>
                      <span className="text-sm font-black text-primary">
                        {room.activeContract ? 
                          `${(room.activeContract.servicePrice || 0).toLocaleString()}đ` :
                          (room.servicePrice ? `${room.servicePrice.toLocaleString()}đ` : 'Free')
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section (Full Width) */}
            <div className="bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/30">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                Thông tin mô tả phòng
              </h3>
              <div className="bg-surface-container-lowest/50 rounded-2xl p-6 border border-outline-variant/20">
                {room.description ? (
                  <div 
                    className="text-on-surface-variant leading-relaxed text-sm whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: room.description }}
                  />
                ) : (
                  <p className="text-on-surface-variant/40 italic text-sm text-center py-4">Chưa có mô tả chi tiết cho phòng này.</p>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-surface-container-low rounded-[2rem] p-8 border border-outline-variant/30">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                    Đánh giá ({reviews.length})
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex text-amber-500">
                      {renderStars(reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 5, 'modal-avg', 20)}
                    </div>
                    <span className="text-xl font-black text-on-surface ml-1">
                      {(reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 5).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Tất cả', val: 'ALL' },
                    { label: '5 ★', val: '5' },
                    { label: '4 ★', val: '4' },
                    { label: '3 ★', val: '3' },
                    { label: '2 ★', val: '2' },
                    { label: '1 ★', val: '1' },
                    { label: 'Có ảnh', val: 'HAS_IMAGE' }
                  ].map(f => (
                    <button 
                      key={f.val}
                      onClick={() => setActiveReviewFilter(f.val)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeReviewFilter === f.val ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.length === 0 ? (
                  <div className="col-span-2 py-12 text-center bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
                    <p className="text-on-surface-variant italic font-bold opacity-40">Phòng này chưa có đánh giá nào.</p>
                  </div>
                ) : (
                  reviews
                    .filter(r => {
                      if (activeReviewFilter === 'ALL') return true;
                      if (activeReviewFilter === 'HAS_IMAGE') {
                        try {
                          return JSON.parse(r.images || '[]').length > 0;
                        } catch(e) { return false; }
                      }
                      return r.rating === parseInt(activeReviewFilter);
                    })
                    .map((review) => (
                      <div key={review.id} className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 space-y-4 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                              <span className="material-symbols-outlined text-xl">person</span>
                            </div>
                            <div>
                              <p className="text-sm font-black text-on-surface leading-tight">
                                {review.isAnonymous ? maskName(review.tenant?.fullName) : (review.tenant?.fullName || 'Khách thuê')}
                              </p>
                              <div className="flex mt-0.5">
                                {renderStars(review.rating, `r-${review.id}`, 12)}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">
                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        
                        <p className="text-sm font-bold text-on-surface-variant leading-relaxed italic">"{review.comment}"</p>
                        
                        {/* Review Media */}
                        {(() => {
                          let revImages = [];
                          try { revImages = JSON.parse(review.images || "[]"); } catch(e) {}
                          if (revImages.length > 0) {
                            return (
                              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {revImages.map((img, idx) => (
                                  <img 
                                    key={idx} 
                                    src={`${import.meta.env.VITE_API_URL}/uploads/${img}`} 
                                    alt="Review" 
                                    className="w-16 h-16 object-cover rounded-xl border border-outline-variant/30 hover:scale-105 transition-transform cursor-pointer"
                                    onClick={() => setSelectedImage(`${import.meta.env.VITE_API_URL}/uploads/${img}`)}
                                  />
                                ))}
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Landlord Reply */}
                        {review.landlordReply ? (
                          <div className="bg-primary/5 p-4 rounded-2xl border-l-4 border-primary mt-4">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 flex items-center gap-2">
                              <span className="material-symbols-outlined text-[14px]">reply</span> Phản hồi của chủ nhà
                            </p>
                            <p className="text-xs font-bold text-on-surface-variant">{review.landlordReply}</p>
                          </div>
                        ) : (
                          user?.role === 'LANDLORD' && user?.id === room.landlordId && (
                            <div className="mt-4 pt-4 border-t border-outline-variant/10">
                              {replyingTo === review.id ? (
                                <div className="space-y-3">
                                  <textarea 
                                    value={replyText} 
                                    onChange={e => setReplyText(e.target.value)} 
                                    placeholder="Gửi phản hồi cho khách thuê..." 
                                    className="w-full p-4 bg-white border border-outline-variant rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                    rows="2"
                                  />
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleReplySubmit(review.id)}
                                      className="flex-1 py-2 bg-primary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                                    >Gửi</button>
                                    <button 
                                      onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                      className="px-4 py-2 bg-surface-container-highest text-on-surface-variant rounded-xl text-[10px] font-black uppercase tracking-widest"
                                    >Hủy</button>
                                  </div>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setReplyingTo(review.id)}
                                  className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/10 px-3 py-2 rounded-xl transition-all"
                                >
                                  <span className="material-symbols-outlined text-[16px]">chat</span> Phản hồi khách thuê
                                </button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-8 border-t border-outline-variant/10 bg-surface-container-lowest flex flex-wrap gap-4 sticky bottom-0 z-20">
          <button 
            onClick={onClose}
            className="flex-1 min-w-[120px] py-4 font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-all rounded-2xl border border-outline-variant/30"
          >
            Đóng cửa sổ
          </button>
          
          {user.role === 'LANDLORD' && room.status !== 'RENTED' && (
            <>
              <button 
                onClick={() => { onClose(); handleEditRoomClick(room); }}
                className="flex-[1.5] min-w-[200px] py-4 bg-secondary text-on-secondary font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">edit</span>
                Sửa thông tin
              </button>
              <button 
                onClick={() => { onClose(); handleDeleteRoom(room.id); }}
                className="flex-[1.2] min-w-[150px] py-4 bg-error/10 text-error font-black uppercase tracking-widest rounded-2xl border border-error/20 hover:bg-error hover:text-on-error transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">delete</span>
                Xóa phòng
              </button>
            </>
          )}
        </div>
      </div>
    </div>

    {/* Airbnb-style Fullscreen Image Viewer */}
    {showImageViewer && room.images && (() => {
      let viewerImages = [];
      try { viewerImages = Array.isArray(room.images) ? room.images : JSON.parse(room.images || '[]'); } catch(e) { viewerImages = []; }
      if (viewerImages.length === 0) return null;
      return (
        <div className="fixed inset-0 bg-black/95 z-[99999] flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setShowImageViewer(false)} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-bold">
              <span className="material-symbols-outlined">close</span> Đóng
            </button>
            <span className="text-white/80 text-sm font-bold">{currentImageIndex + 1} / {viewerImages.length}</span>
          </div>
          {/* Main image */}
          <div className="flex-1 flex items-center justify-center px-16 relative">
            <button
              onClick={() => setCurrentImageIndex(prev => (prev === 0 ? viewerImages.length - 1 : prev - 1))}
              className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <span className="material-symbols-outlined text-2xl">chevron_left</span>
            </button>
            <img
              src={`${import.meta.env.VITE_API_URL}/uploads/${viewerImages[currentImageIndex]}`}
              alt={`Photo ${currentImageIndex + 1}`}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setCurrentImageIndex(prev => (prev === viewerImages.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <span className="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
          </div>
          {/* Thumbnail strip */}
          <div className="flex justify-center gap-2 px-6 py-4 overflow-x-auto no-scrollbar">
            {viewerImages.map((img, idx) => (
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
      );
    })()}
    </>
  );
};

export default RoomDetailModal;
