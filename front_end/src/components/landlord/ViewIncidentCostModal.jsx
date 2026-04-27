import React from 'react';

/**
 * Component ViewIncidentCostModal
 * Chức năng: Hiển thị chi tiết về chi phí sửa chữa của một sự cố.
 * - Hiển thị thông tin sự cố (tiêu đề, phòng, người báo cáo).
 * - Hiển thị số tiền đã chi trả để sửa chữa.
 * - Hiển thị nội dung mô tả việc sửa chữa.
 */
const ViewIncidentCostModal = ({ 
  viewIncidentCostDetails, // Đối tượng dữ liệu sự cố kèm chi phí sửa chữa
  onClose                 // Hàm để đóng modal
}) => {
  if (!viewIncidentCostDetails) return null;

  return (      
        <div
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
          onClick={() => onClose()}
        >
          <div
            style={{ background: '#ffffff', width: '480px', borderRadius: '12px', padding: '28px', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', color: '#0f172a' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => onClose()} style={{ position: 'absolute', top: 14, right: 18, background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✖</button>

            <h3 style={{ margin: '0 0 18px 0', color: '#f59e0b', borderBottom: '2px solid #fef3c7', paddingBottom: '10px' }}>
              🔧 Chi Tiết Chi Phí Phát Sinh
            </h3>

            {/* Thông tin sự cố */}
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Sự cố</span>
                <div style={{ fontWeight: 'bold', fontSize: '15px', marginTop: '3px', color: '#0f172a' }}>{viewIncidentCostDetails.title}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Phòng</span>
                <div style={{ marginTop: '3px', color: '#0f172a' }}>{viewIncidentCostDetails.room?.roomNumber} {viewIncidentCostDetails.room?.roomCode ? `(${viewIncidentCostDetails.room.roomCode})` : ''}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Khách thuê báo cáo</span>
                <div style={{ marginTop: '3px', color: '#0f172a' }}>{viewIncidentCostDetails.tenant?.fullName || 'Không rõ'}</div>
                <div style={{ color: '#475569', fontSize: '12px' }}>SĐT: {viewIncidentCostDetails.tenant?.phone || '...'}</div>
              </div>
              <div>
                <span style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Ngày sự cố</span>
                <div style={{ marginTop: '3px', color: '#0f172a' }}>{new Date(viewIncidentCostDetails.createdAt).toLocaleDateString('vi-VN')}</div>
              </div>
            </div>

            {/* Chi phí */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Chi phí phát sinh</span>
                <div style={{ color: '#d97706', fontWeight: 'bold', fontSize: '24px', marginTop: '4px' }}>
                  {Number(viewIncidentCostDetails.repairCost).toLocaleString('vi-VN')} đ
                </div>
              </div>
              {viewIncidentCostDetails.repairDescription && (
                <div>
                  <span style={{ color: '#475569', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Nội dung sửa chữa</span>
                  <div style={{ marginTop: '5px', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#334155' }}>
                    {viewIncidentCostDetails.repairDescription}
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => onClose()} style={{ padding: '10px 24px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      
  );
};

export default ViewIncidentCostModal;