import React from 'react';

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
  onClose      // Hàm để đóng modal
}) => {
  if (!viewContract) return null;

  return (      
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
          onClick={() => onClose()} // Bấm ra ngoài để đóng
        >
          <div 
            style={{ 
              background: '#fff', 
              width: '800px', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              borderRadius: '12px', 
              padding: '30px', 
              position: 'relative', 
              boxSizing: 'border-box',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Nút Đóng */}
            <button 
              onClick={() => onClose()}
              style={{ position: 'absolute', top: '15px', right: '20px', background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
            >✖</button>

            <h2 style={{ marginTop: 0, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📄 Chi tiết Hợp Đồng
              <span style={{ fontSize: '14px', background: viewContract.status === 'ACTIVE' ? '#10b981' : '#ef4444', color: '#ffffff', padding: '4px 10px', borderRadius: '20px', fontWeight: 'normal' }}>
                {viewContract.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã kết thúc'}
              </span>
            </h2>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              {/* BÊN A */}
              <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: '#0f172a', marginTop: 0 }}>1. Bên A (Chủ nhà)</h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Họ tên:</strong> {viewContract.landlordName || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>SĐT:</strong> {viewContract.landlordPhone || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>CCCD:</strong> {viewContract.landlordIdentityNumber || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Ngày sinh:</strong> {viewContract.landlordDob || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Quê quán:</strong> {viewContract.landlordHometown || 'Chưa cập nhật'}</p>
              </div>

              {/* BÊN B */}
              <div style={{ flex: 1, background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <h4 style={{ color: '#0f172a', marginTop: 0 }}>2. Bên B (Đại diện thuê)</h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Họ tên:</strong> {viewContract.tenantName || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Ngày sinh:</strong> {viewContract.tenantDob || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Email:</strong> {viewContract.tenantEmail}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>SĐT:</strong> {viewContract.tenantPhone || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>CCCD:</strong> {viewContract.tenantIdentityNumber || 'Chưa cập nhật'}</p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Quê quán:</strong> {viewContract.tenantHometown || 'Chưa cập nhật'}</p>
              </div>
            </div>

            {/* THỜI HẠN & TẠM TRÚ */}
            {/* THỜI HẠN & TẠM TRÚ */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div style={{ flex: 1, background: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <h4 style={{ color: '#0f172a', marginTop: 0 }}>3. Thời hạn thuê</h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Bắt đầu:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{viewContract.startDate || '...'}</span></p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Kết thúc:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{viewContract.endDate || '...'}</span></p>
              </div>
              <div style={{ flex: 1, background: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <h4 style={{ color: '#0f172a', marginTop: 0 }}>4. Tình trạng Tạm trú</h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}>
                  <strong>Trạng thái: </strong> 
                  {viewContract.residenceStatus === 'REGISTERED' 
                    ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>Đã đăng ký</span> 
                    : <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Chưa đăng ký</span>}
                </p>
                {viewContract.residenceStatus === 'REGISTERED' && (
                  <>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Ngày ĐK:</strong> {viewContract.residenceDate}</p>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#475569' }}><strong>Nơi ĐK:</strong> {viewContract.residencePlace}</p>
                  </>
                )}
              </div>
            </div>

            {/* CHI PHÍ ĐÀM PHÁN */}
            <h4 style={{ color: '#0f172a', marginBottom: '10px' }}>5. Chi phí đàm phán (Gốc tính hóa đơn)</h4>
            
            {viewContract.isDirectUtilityPayment && (
              <div style={{ background: '#ecfdf5', color: '#065f46', padding: '10px 15px', borderRadius: '8px', border: '1px solid #6ee7b7', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✅ Khách thuê tự thanh toán trực tiếp cho bên điện lực.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#fef3c7', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '14px', color: '#475569' }}><strong>Giá phòng:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{Number(viewContract.price || 0).toLocaleString('vi-VN')} đ/tháng</span></div>
              {!viewContract.isDirectUtilityPayment ? (
                <>
                  <div style={{ fontSize: '14px', color: '#475569' }}><strong>Điện:</strong> {Number(viewContract.electricityPrice || 0).toLocaleString('vi-VN')} đ/ký</div>
                  <div style={{ fontSize: '14px', color: '#475569' }}><strong>Nước:</strong> {Number(viewContract.waterPrice || 0).toLocaleString('vi-VN')} đ/khối</div>
                </>
              ) : (
                <div style={{ gridColumn: 'span 2', fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>
                  (Điện/Nước thanh toán trực tiếp cho nhà cung cấp)
                </div>
              )}
              <div style={{ fontSize: '14px', color: '#475569' }}><strong>Internet:</strong> {Number(viewContract.internetPrice || 0).toLocaleString('vi-VN')} đ/tháng</div>
              <div style={{ fontSize: '14px', color: '#475569' }}><strong>Số điện đầu:</strong> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{viewContract.startElectricity || 0} ký</span></div>
              <div style={{ fontSize: '14px', color: '#475569' }}><strong>Số nước đầu:</strong> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{viewContract.startWater || 0} khối</span></div>
              <div style={{ fontSize: '14px', gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', color: '#475569' }}>
                <strong>Số lượng xe:</strong> 
                <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '16px' }}>{viewContract.vehicleCount} chiếc</span>
                (x {Number(viewContract.parkingPrice || 0).toLocaleString('vi-VN')} đ/xe)
                
                
                
              </div>
            
              <div style={{ fontSize: '14px', gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', color: '#475569' }}>
                <strong>Phí vệ sinh/dịch vụ chung:</strong> 
                <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '16px' }}>{Number(viewContract.servicePrice || 0).toLocaleString('vi-VN')} đ/tháng</span>
                
              
              </div>
            </div>

            {/* THÀNH VIÊN Ở GHÉP */}
            <h4 style={{ color: '#0f172a', marginBottom: '10px' }}>6. Người ở cùng ({viewContract.members ? (typeof viewContract.members === 'string' ? JSON.parse(viewContract.members).length : viewContract.members.length) : 0} người)</h4>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {viewContract.members && (typeof viewContract.members === 'string' ? JSON.parse(viewContract.members) : viewContract.members).length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '8px 0', color: '#0f172a' }}>Họ tên</th>
                      <th style={{ color: '#0f172a' }}>Ngày sinh</th>
                      <th style={{ color: '#0f172a' }}>CCCD</th>
                      <th style={{ color: '#0f172a' }}>SĐT</th>
                      <th style={{ color: '#0f172a' }}>Quê quán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(typeof viewContract.members === 'string' ? JSON.parse(viewContract.members) : viewContract.members).map((member, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#0f172a' }}>{member.fullName}</td>
                        <td style={{ color: '#475569' }}>{member.dob}</td>
                        <td style={{ color: '#475569' }}>{member.identityNumber}</td>
                        <td style={{ color: '#475569' }}>{member.phone}</td>
                        <td style={{ color: '#475569' }}>{member.hometown}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>Không có người ở cùng.</p>
              )}
            </div>
{/* PHẦN 7: ẢNH HỢP ĐỒNG (Bản "Chống đạn" ép kiểu dữ liệu an toàn) */}
            <h4 style={{ color: '#0f172a', marginBottom: '10px' }}>
              7. Ảnh chụp hợp đồng bản cứng
            </h4>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {(() => {
                // Xử lý an toàn: Ép kiểu dữ liệu về mảng Array
                let images = [];
                try {
                  if (Array.isArray(viewContract.contractImage)) {
                    images = viewContract.contractImage;
                  } else if (typeof viewContract.contractImage === 'string') {
                    images = JSON.parse(viewContract.contractImage);
                  }
                } catch (error) {
                  images = []; // Nếu lỗi parse thì cho mảng rỗng
                }

                // Hiển thị giao diện dựa trên mảng images đã xử lý
                return images && images.length > 0 ? (
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {images.map((fileName, idx) => (
                      <div key={idx} style={{ flex: '0 0 150px' }}>
                        {/* CHÚ Ý: Đảm bảo thêm /uploads/ vào đường dẫn URL nếu server của bạn lưu ảnh ở thư mục uploads */}
                        <img 
                          src={`http://localhost:5000/uploads/${fileName}`} 
                          alt={`Ảnh hợp đồng ${idx + 1}`} 
                          style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #cbd5e1', cursor: 'pointer' }}
                          onClick={() => window.open(`http://localhost:5000/uploads/${fileName}`)} 
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150x100?text=Khong+tim+thay+anh'; }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                    * Hợp đồng này chưa được đính kèm ảnh bản cứng (Hoặc ảnh bị lỗi).
                  </p>
                );
              })()}
            </div>
            {/* 8. Ảnh chụp đăng ký tạm trú */}
            <div style={{ background: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', marginTop: '20px' }}>
              <h4 style={{ color: '#0f172a', marginTop: 0, textAlign: 'center' }}>8. Ảnh đăng ký tạm trú</h4>
              <div style={{ textAlign: 'center', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                {(() => {
                  // Xử lý an toàn giống Mục 7: Ép kiểu dữ liệu về mảng Array
                  let residenceImages = [];
                  try {
                    if (Array.isArray(viewContract.residenceImage)) {
                      residenceImages = viewContract.residenceImage;
                    } else if (typeof viewContract.residenceImage === 'string') {
                      // Nếu chuỗi rỗng hoặc không hợp lệ thì bỏ qua
                      if(viewContract.residenceImage.trim() !== '') {
                        // Thử parse JSON, nếu lỗi thì coi như nó là tên file đơn lẻ
                        try {
                           residenceImages = JSON.parse(viewContract.residenceImage);
                        } catch(e) {
                           residenceImages = [viewContract.residenceImage];
                        }
                      }
                    }
                  } catch (error) {
                    residenceImages = [];
                  }

                  // Render ảnh nếu có
                  return residenceImages && residenceImages.length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', justifyContent: 'center' }}>
                      {residenceImages.map((fileName, idx) => {
                         // Xử lý tên file phòng trường hợp backend lưu kèm cả chữ uploads/ rồi
                         const cleanFileName = fileName.replace('uploads/', '').replace('uploads\\', '');
                         return (
                          <div key={idx} style={{ flex: '0 0 auto' }}>
                            <img 
                              src={`http://localhost:5000/uploads/${cleanFileName}`} 
                              alt={`Ảnh đăng ký tạm trú ${idx + 1}`} 
                              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                              onClick={() => window.open(`http://localhost:5000/uploads/${cleanFileName}`)}
                              onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300x200?text=Khong+tim+thay+anh'; }}
                            />
                          </div>
                         )
                      })}
                    </div>
                  ) : (
                    <p style={{ color: '#64748b', fontStyle: 'italic', margin: '20px 0' }}>Không có ảnh đăng ký tạm trú đính kèm.</p>
                  );
                })()}
              </div>
            </div>

            {/* 9. Tình trạng phòng bàn giao */}
            <h4 style={{ color: '#0f172a', marginBottom: '10px' }}>9. Tình trạng phòng bàn giao</h4>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', whiteSpace: 'pre-wrap', color: '#475569' }}>
                <strong style={{ color: '#0f172a'}}>Mô tả chi tiết:</strong> {viewContract.conditionDescription || <span style={{ color: '#64748b', fontStyle: 'italic' }}>Không có mô tả.</span>}
              </p>
              
              {/* Ảnh tình trạng phòng */}
              <div style={{ marginBottom: '15px', color: '#475569' }}>
                <strong style={{ color: '#0f172a'}}>Ảnh đính kèm:</strong>
                {(() => {
                  let cImages = [];
                  try {
                    if (Array.isArray(viewContract.conditionImages)) cImages = viewContract.conditionImages;
                    else if (typeof viewContract.conditionImages === 'string') {
                      cImages = JSON.parse(viewContract.conditionImages);
                    }
                  } catch(e) {}
                  
                  return cImages && cImages.length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginTop: '10px' }}>
                      {cImages.map((fileName, idx) => {
                        const cleanName = fileName.replace('uploads/', '').replace('uploads\\', '');
                        return (
                          <img key={idx} src={`http://localhost:5000/uploads/${cleanName}`} alt="Ảnh bàn giao" 
                               style={{ height: '100px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e1' }} 
                               onClick={() => window.open(`http://localhost:5000/uploads/${cleanName}`)} />
                        )
                      })}
                    </div>
                  ) : <span style={{ marginLeft: '10px', color: '#64748b', fontStyle: 'italic', fontSize: '13px' }}>Không có ảnh</span>
                })()}
              </div>

              {/* Video tình trạng phòng */}
              <div style={{ color: '#475569' }}>
                <strong style={{ color: '#0f172a'}}>Video đính kèm:</strong>
                {(() => {
                  let cVideos = [];
                  try {
                    if (Array.isArray(viewContract.conditionVideos)) cVideos = viewContract.conditionVideos;
                    else if (typeof viewContract.conditionVideos === 'string') {
                      cVideos = JSON.parse(viewContract.conditionVideos);
                    }
                  } catch(e) {}

                  return cVideos && cVideos.length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginTop: '10px' }}>
                      {cVideos.map((fileName, idx) => {
                        const cleanName = fileName.replace('uploads/', '').replace('uploads\\', '');
                        return (
                          <video key={idx} src={`http://localhost:5000/uploads/${cleanName}`} controls
                                 style={{ height: '150px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        )
                      })}
                    </div>
                  ) : <span style={{ marginLeft: '10px', color: '#64748b', fontStyle: 'italic', fontSize: '13px' }}>Không có video</span>
                })()}
              </div>
            </div>
            {/* Nút Đóng */}
            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button onClick={() => onClose()} style={{ padding: '10px 25px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      
  );
};

export default ViewContractModal;