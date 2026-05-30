import React from 'react';
import { getMediaUrl } from '../../utils/media';

/**
 * Component ViewContractModal
 * Chức năng: Hiển thị toàn bộ thông tin chi tiết của một hợp đồng thuê phòng.
 * - Thông tin chi tiết bên A (Chủ nhà) và bên B (Khách thuê).
 * - Thời hạn thuê và tình trạng đăng ký tạm trú.
 * - Các chi phí đàm phán (tiền phòng, điện, nước, dịch vụ).
 * - Danh sách người ở cùng.
 * - Ảnh chụp hợp đồng bản cứng, ảnh đăng ký tạm trú.
 * - Tình trạng phòng khi bàn giao (mô tả, ảnh, video minh chứng).
 */
const ViewContractModal = ({ 
  viewContract, // Đối tượng dữ liệu hợp đồng cần hiển thị
  onClose,      // Hàm để đóng modal
  handleEditContractClick // Hàm mở form sửa hợp đồng
}) => {
  if (!viewContract) return null;

  const statusBadge = viewContract.status === 'ACTIVE' 
    ? <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-black rounded-full uppercase tracking-widest border border-secondary/20">Đang hiệu lực</span>
    : <span className="px-3 py-1 bg-error/10 text-error text-[10px] font-black rounded-full uppercase tracking-widest border border-error/20">Đã kết thúc</span>;

  return (      
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-on-surface/40 backdrop-blur-md animate-in fade-in duration-300"
      onClick={() => onClose()} 
    >
      <div 
        className="w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-surface-container-lowest p-4 sm:p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border-t-8 border-primary shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 space-y-8 no-scrollbar"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* HEADER */}
        <div className="flex items-center justify-between pb-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">contract</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-on-surface tracking-tight">Chi tiết Hợp Đồng</h3>
                {statusBadge}
              </div>
              <p className="text-sm text-on-surface-variant font-bold opacity-60">Xem lại các điều khoản và thông tin pháp lý</p>
            </div>
          </div>
          <button 
            onClick={() => onClose()}
            className="w-12 h-12 flex items-center justify-center hover:bg-error/10 hover:text-error rounded-full transition-all group"
          >
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
          </button>
        </div>

        {/* 1. THÔNG TIN CHỦ NHÀ & KHÁCH THUÊ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BÊN A */}
          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-6xl">person</span>
            </div>
            <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Bên A (Chủ nhà)
            </h4>
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center"><span className="text-xs font-bold text-on-surface-variant opacity-60">Họ tên:</span> <span className="text-sm font-black text-on-surface">{viewContract.landlordName || '---'}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs font-bold text-on-surface-variant opacity-60">CCCD:</span> <span className="text-sm font-black text-on-surface">{viewContract.landlordIdentityNumber || '---'}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs font-bold text-on-surface-variant opacity-60">Ngày sinh:</span> <span className="text-sm font-black text-on-surface">{viewContract.landlordDob || '---'}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs font-bold text-on-surface-variant opacity-60">SĐT:</span> <span className="text-sm font-black text-primary">{viewContract.landlordPhone || '---'}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs font-bold text-on-surface-variant opacity-60">Quê quán:</span> <span className="text-sm font-bold text-on-surface opacity-80">{viewContract.landlordHometown || '---'}</span></div>
            </div>
          </div>

          {/* BÊN B */}
          <div className="bg-secondary-container/5 p-6 rounded-3xl border border-secondary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-secondary">
              <span className="material-symbols-outlined text-6xl">account_circle</span>
            </div>
            <h4 className="text-[11px] font-black text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              Bên B (Đại diện thuê)
            </h4>
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center"><span className="text-xs font-bold text-on-surface-variant opacity-60">Họ tên:</span> <span className="text-sm font-black text-on-surface">{viewContract.tenantName || '---'}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs font-bold text-on-surface-variant opacity-60">CCCD:</span> <span className="text-sm font-black text-on-surface">{viewContract.tenantIdentityNumber || '---'}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs font-bold text-on-surface-variant opacity-60">Ngày sinh:</span> <span className="text-sm font-black text-on-surface">{viewContract.tenantDob || '---'}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs font-bold text-on-surface-variant opacity-60">SĐT:</span> <span className="text-sm font-black text-on-surface">{viewContract.tenantPhone || '---'}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs font-bold text-on-surface-variant opacity-60">Quê quán:</span> <span className="text-sm font-bold text-on-surface opacity-80">{viewContract.tenantHometown || '---'}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs font-bold text-on-surface-variant opacity-60">Email:</span> <span className="text-sm font-black text-secondary">{viewContract.tenantEmail}</span></div>
            </div>
          </div>
        </div>

        {/* 2. THỜI HẠN & TẠM TRÚ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-outline-variant/50">
            <h4 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-4">Thời hạn thuê</h4>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center p-3 bg-secondary/5 rounded-2xl border border-secondary/10">
                <p className="text-[10px] font-black text-secondary uppercase mb-1">Bắt đầu</p>
                <p className="text-sm font-black text-on-surface">{viewContract.startDate || '---'}</p>
              </div>
              <div className="material-symbols-outlined text-outline-variant opacity-30">trending_flat</div>
              <div className="flex-1 text-center p-3 bg-error/5 rounded-2xl border border-error/10">
                <p className="text-[10px] font-black text-error uppercase mb-1">Kết thúc</p>
                <p className="text-sm font-black text-on-surface">{viewContract.endDate || '---'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-outline-variant/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Tình trạng Tạm trú</h4>
              <div className={`px-4 py-1.5 rounded-2xl font-black text-[10px] uppercase tracking-widest ${viewContract.residenceStatus === 'REGISTERED' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-tertiary/10 text-tertiary border border-tertiary/20'}`}>
                {viewContract.residenceStatus === 'REGISTERED' ? 'Đã đăng ký' : 'Chưa đăng ký'}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {viewContract.residenceStatus === 'REGISTERED' && (
                <div className="space-y-1 bg-surface-container-low/50 p-3 rounded-xl border border-outline-variant/20">
                  <p className="text-xs font-bold text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs">calendar_today</span>
                    Ngày ĐK: {viewContract.residenceDate}
                  </p>
                  <p className="text-xs font-bold text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs">location_on</span>
                    Nơi ĐK: {viewContract.residencePlace}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. CHI PHÍ ĐÀM PHÁN */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">payments</span>
            Chi phí đàm phán (Gốc tính hóa đơn)
          </h4>
          
          {viewContract.isDirectUtilityPayment && (
            <div className="bg-secondary/10 text-secondary p-4 rounded-2xl border border-secondary/20 text-xs font-black flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">bolt</span>
              Khách thuê tự thanh toán trực tiếp cho bên điện lực.
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Giá phòng', val: `${Number(viewContract.price || 0).toLocaleString()} đ`, color: 'text-primary' },
              { label: 'Internet', val: `${Number(viewContract.internetPrice || 0).toLocaleString()} đ`, color: 'text-on-surface' },
              { label: 'Gửi xe', val: `${Number(viewContract.vehicleCount || 0)} xe (x ${Number(viewContract.parkingPrice || 0).toLocaleString()} đ/xe)`, color: 'text-on-surface' },
              { label: 'Dịch vụ/Vệ sinh', val: `${Number(viewContract.servicePrice || 0).toLocaleString()} đ`, color: 'text-on-surface' },
            ].map((item, i) => (
              <div key={i} className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                <p className="text-[10px] font-black text-on-surface-variant uppercase opacity-50 mb-1">{item.label}</p>
                <p className={`text-sm font-black ${item.color}`}>{item.val}</p>
              </div>
            ))}
          </div>

          {!viewContract.isDirectUtilityPayment && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                { label: 'Giá Điện', val: `${Number(viewContract.electricityPrice || 0).toLocaleString()} đ/ký`, color: 'text-error' },
                { label: 'Giá Nước', val: `${Number(viewContract.waterPrice || 0).toLocaleString()} đ/khối`, color: 'text-primary' },
                { label: 'Điện đầu kỳ', val: `${viewContract.startElectricity || 0} ký`, color: 'text-on-surface' },
                { label: 'Nước đầu kỳ', val: `${viewContract.startWater || 0} khối`, color: 'text-on-surface' },
              ].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-outline-variant/30">
                  <p className="text-[10px] font-black text-on-surface-variant uppercase opacity-50 mb-1">{item.label}</p>
                  <p className={`text-sm font-black ${item.color}`}>{item.val}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. THÀNH VIÊN Ở CÙNG */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">groups</span>
            Người ở cùng ({viewContract.members ? (typeof viewContract.members === 'string' ? JSON.parse(viewContract.members).length : viewContract.members.length) : 0} người)
          </h4>
          <div className="bg-white rounded-3xl border border-outline-variant/30 overflow-x-auto shadow-sm">
            {viewContract.members && (typeof viewContract.members === 'string' ? JSON.parse(viewContract.members) : viewContract.members).length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low border-b border-outline-variant/30">
                  <tr>
                    <th className="px-6 py-4 font-black text-on-surface uppercase tracking-widest">Họ tên</th>
                    <th className="px-6 py-4 font-black text-on-surface uppercase tracking-widest">Ngày sinh</th>
                    <th className="px-6 py-4 font-black text-on-surface uppercase tracking-widest">CCCD</th>
                    <th className="px-6 py-4 font-black text-on-surface uppercase tracking-widest">SĐT</th>
                    <th className="px-6 py-4 font-black text-on-surface uppercase tracking-widest">Quê quán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {(typeof viewContract.members === 'string' ? JSON.parse(viewContract.members) : viewContract.members).map((member, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 font-black text-on-surface">{member.fullName}</td>
                      <td className="px-6 py-4 font-bold text-on-surface-variant opacity-70">{member.dob}</td>
                      <td className="px-6 py-4 font-bold text-on-surface-variant opacity-70">{member.identityNumber}</td>
                      <td className="px-6 py-4 font-bold text-primary">{member.phone}</td>
                      <td className="px-6 py-4 font-bold text-on-surface-variant opacity-70">{member.hometown}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-on-surface-variant opacity-40 font-bold italic">Không có người ở cùng</div>
            )}
          </div>
        </div>

        {/* 5. ẢNH HỢP ĐỒNG & MINH CHỨNG */}
        <div className="space-y-6">
          {/* Ảnh hợp đồng */}
          <div className="space-y-3">
             <h4 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">photo_library</span>
              7. Ảnh chụp hợp đồng bản cứng
            </h4>
            <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/30">
              {(() => {
                let images = [];
                try {
                  if (Array.isArray(viewContract.contractImage)) images = viewContract.contractImage;
                  else if (typeof viewContract.contractImage === 'string') images = JSON.parse(viewContract.contractImage);
                } catch (error) { images = []; }

                return images.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {images.map((fileName, idx) => (
                      <div key={idx} className="shrink-0 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(getMediaUrl(fileName))}>
                        <img src={getMediaUrl(fileName)} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : <div className="py-4 text-center text-xs font-bold text-on-surface-variant opacity-40 italic">Hợp đồng này chưa được đính kèm ảnh bản cứng (Hoặc ảnh bị lỗi).</div>;
              })()}
            </div>
          </div>

          {/* Ảnh đăng ký tạm trú */}
          <div className="space-y-3">
             <h4 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">fact_check</span>
              8. Ảnh đăng ký tạm trú
            </h4>
            <div className="bg-white p-4 rounded-3xl border border-outline-variant/30">
              {(() => {
                let residenceImages = [];
                try {
                  if (Array.isArray(viewContract.residenceImage)) residenceImages = viewContract.residenceImage;
                  else if (typeof viewContract.residenceImage === 'string' && viewContract.residenceImage.trim() !== '') {
                    try { residenceImages = JSON.parse(viewContract.residenceImage); } 
                    catch(e) { residenceImages = [viewContract.residenceImage]; }
                  }
                } catch (error) { residenceImages = []; }

                return residenceImages.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {residenceImages.map((fileName, idx) => {
                      const cleanFileName = fileName.replace('uploads/', '').replace('uploads\\', '');
                      return (
                        <div key={idx} className="shrink-0 max-w-[300px] h-48 rounded-2xl overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(getMediaUrl(cleanFileName))}>
                          <img src={getMediaUrl(cleanFileName)} className="w-full h-full object-contain bg-surface-container-low" />
                        </div>
                      )
                    })}
                  </div>
                ) : <div className="py-4 text-center text-xs font-bold text-on-surface-variant opacity-40 italic">Không có ảnh đăng ký tạm trú đính kèm.</div>;
              })()}
            </div>
          </div>

          {/* Tình trạng bàn giao */}
          <div className="space-y-3">
             <h4 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">house_siding</span>
              9. Tình trạng phòng bàn giao
            </h4>
            <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 space-y-6">
              <div className="p-4 bg-surface-container-low rounded-2xl text-sm font-bold text-on-surface-variant leading-relaxed border-l-4 border-primary">
                <strong className="text-on-surface block mb-1">Mô tả chi tiết:</strong>
                {viewContract.conditionDescription || <span className="italic opacity-40">Không có mô tả chi tiết.</span>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <p className="text-[10px] font-black text-on-surface-variant uppercase opacity-50 mb-3 ml-1">Ảnh đính kèm</p>
                   {(() => {
                    let cImages = [];
                    try {
                      if (Array.isArray(viewContract.conditionImages)) cImages = viewContract.conditionImages;
                      else if (typeof viewContract.conditionImages === 'string') cImages = JSON.parse(viewContract.conditionImages);
                    } catch(e) {}
                    
                    return cImages.length > 0 ? (
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {cImages.map((fileName, idx) => {
                          const cleanName = fileName.replace('uploads/', '').replace('uploads\\', '');
                          return (
                            <img key={idx} src={getMediaUrl(cleanName)} className="w-20 h-20 rounded-xl object-cover border border-outline-variant/30 cursor-pointer hover:opacity-80 shadow-sm" onClick={() => window.open(getMediaUrl(cleanName))} />
                          )
                        })}
                      </div>
                    ) : <span className="text-[10px] font-bold text-on-surface-variant opacity-30 italic ml-1">Không có ảnh</span>
                  })()}
                </div>
                <div>
                   <p className="text-[10px] font-black text-on-surface-variant uppercase opacity-50 mb-3 ml-1">Video đính kèm</p>
                   {(() => {
                    let cVideos = [];
                    try {
                      if (Array.isArray(viewContract.conditionVideos)) cVideos = viewContract.conditionVideos;
                      else if (typeof viewContract.conditionVideos === 'string') cVideos = JSON.parse(viewContract.conditionVideos);
                    } catch(e) {}

                    return cVideos.length > 0 ? (
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {cVideos.map((fileName, idx) => {
                          const cleanName = fileName.replace('uploads/', '').replace('uploads\\', '');
                          return (
                            <video key={idx} src={getMediaUrl(cleanName)} className="h-20 w-32 rounded-xl object-cover bg-black border border-outline-variant/30 shadow-sm" controls />
                          )
                        })}
                      </div>
                    ) : <span className="text-[10px] font-bold text-on-surface-variant opacity-30 italic ml-1">Không có video</span>
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION FOOTER */}
        <div className="flex justify-end gap-4 pt-6 border-t border-outline-variant/30">
          {viewContract.status === 'ACTIVE' && handleEditContractClick && (
            <button 
              onClick={() => {
                onClose();
                handleEditContractClick(viewContract);
              }} 
              className="px-10 py-4 bg-secondary/10 text-secondary border border-secondary/20 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-secondary hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Sửa Hợp Đồng
            </button>
          )}
          <button 
            onClick={() => onClose()} 
            className="px-12 py-4 bg-on-surface text-surface-container-lowest rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewContractModal;
