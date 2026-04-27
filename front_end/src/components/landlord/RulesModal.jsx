import React from 'react';

/**
 * Component RulesModal
 * Chức năng: Hiển thị nội quy hệ thống và quy định phòng trọ.
 * - Hiển thị danh sách các quy định đã được thiết lập bởi Admin.
 * - Hiển thị ngày cập nhật của từng nội quy.
 */
const RulesModal = ({ 
  showRuleModal,    // State boolean ẩn/hiện modal
  setShowRuleModal, // Hàm cập nhật trạng thái ẩn/hiện
  systemRules       // Danh sách các đối tượng nội quy lấy từ server
}) => {
  if (!showRuleModal) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(5px)' }}>
      <div style={{ background: '#ffffff', width: '90%', maxWidth: '700px', maxHeight: '85vh', borderRadius: '15px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', position: 'relative', display: 'flex', flexDirection: 'column', animation: 'fadeInScale 0.3s ease-out' }}>
        <button
          onClick={() => setShowRuleModal(false)}
          style={{ position: 'absolute', top: '20px', right: '20px', background: '#f8fafc', border: 'none', width: '35px', height: '35px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.3s' }}
          onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
          onMouseLeave={(e) => e.target.style.background = '#f8fafc'}
        >✖</button>

        <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '24px', borderBottom: '2px solid #2563eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          📜 Nội quy hệ thống & Quy định phòng trọ
        </h2>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', marginTop: '10px' }}>
          {systemRules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
              Hiện chưa có nội quy cụ thể nào được thiết lập.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {systemRules.map((rule, idx) => (
                <div key={idx} style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '4px 12px', background: '#2563eb', color: '#ffffff', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Cập nhật: {new Date(rule.updatedAt).toLocaleDateString('vi-VN')}
                  </div>
                  <div style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                    {rule.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <button
            onClick={() => setShowRuleModal(false)}
            style={{ padding: '12px 30px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.3s' }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Đã hiểu và chấp hành
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default RulesModal;
