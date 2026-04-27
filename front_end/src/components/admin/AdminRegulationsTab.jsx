import React from 'react';

/**
 * COMPONENT: AdminRegulationsTab
 * Chức năng: Quản lý các nội quy và quy định chung của hệ thống.
 * Các tính năng chính:
 * 1. Hiển thị danh sách các nội quy hiện có, phân loại theo đối tượng (Chủ nhà, Khách thuê, Tất cả).
 * 2. Thêm mới nội quy hệ thống.
 * 3. Chỉnh sửa nội dung các nội quy đã có.
 * 4. Xóa các nội quy không còn phù hợp.
 */
const AdminRegulationsTab = ({ 
  editingReg,             // Trạng thái nội quy đang được soạn thảo (target, content)
  setEditingReg,          // Hàm cập nhật trạng thái soạn thảo
  handleUpdateRegulation, // Hàm xử lý lưu (Thêm/Sửa) nội quy vào CSDL
  regulations,            // Danh sách các nội quy hiện có từ API
  handleDeleteRegulation  // Hàm xử lý xóa nội quy
}) => {
  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">
      <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/30">
        <h3 className="m-0 mb-8 text-on-surface text-xl font-black flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px] text-primary">gavel</span> Quản Lý Nội Quy Hệ Thống
        </h3>
        
        {/* PHẦN 1: FORM THÊM / CẬP NHẬT NỘI QUY */}
        <form onSubmit={handleUpdateRegulation} className="flex flex-col gap-6 mb-10 p-8 border border-outline-variant/50 rounded-3xl bg-surface-container-low shadow-inner">
          <h4 className="m-0 text-on-surface text-lg font-black flex items-center gap-2"><span className="material-symbols-outlined text-[20px] text-primary">edit_document</span> Thêm / Cập nhật nội quy</h4>
          <div className="flex gap-6">
            <div className="flex-1 max-w-[300px]">
              <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">Đối tượng áp dụng</label>
              <select 
                value={editingReg.target}
                onChange={(e) => setEditingReg({ ...editingReg, target: e.target.value })}
                className="w-full p-3 border border-outline-variant/50 rounded-xl outline-none bg-surface-container-lowest text-on-surface font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                <option value="ALL">Tất cả</option>
                <option value="LANDLORD">Chủ Nhà</option>
                <option value="TENANT">Khách Thuê</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block mb-2 font-bold text-[14px] text-on-surface-variant">Nội dung nội quy</label>
            <textarea 
              value={editingReg.content}
              onChange={(e) => setEditingReg({ ...editingReg, content: e.target.value })}
              placeholder="Nhập nội quy chi tiết..."
              rows="6"
              className="w-full p-4 border border-outline-variant/50 rounded-xl resize-y outline-none bg-surface-container-lowest text-on-surface font-medium leading-relaxed focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"></textarea>
          </div>
          <button type="submit" className="self-start px-8 py-3.5 bg-primary text-white border-none rounded-xl cursor-pointer font-black shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 hover:shadow-xl active:translate-y-0 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">save</span> Lưu & Cập Nhật
          </button>
        </form>

        <h4 className="mb-6 text-lg font-black text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-[20px] text-primary">format_list_bulleted</span> Danh sách nội quy hiện tại</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regulations.length === 0 ? (
            <p className="col-span-full text-center p-8 text-on-surface-variant font-medium opacity-70 italic border border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-low/50">Chưa có nội quy nào được thiết lập.</p>
          ) : (
            regulations.map(reg => (
              <div key={reg.id} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/50 shadow-sm flex flex-col hover:border-primary/30 hover:shadow-md transition-all group">
                <div className="flex justify-between mb-4 items-center border-b border-outline-variant/30 pb-4">
                  <span className={`px-3 py-1.5 rounded-full text-[12px] font-bold border ${
                    reg.target === 'ALL' ? 'bg-surface-container-high text-on-surface-variant border-outline-variant/50' : 
                    reg.target === 'LANDLORD' ? 'bg-primary/10 text-primary border-primary/20' : 
                    'bg-secondary/10 text-secondary border-secondary/20'
                  }`}>
                    {reg.target === 'ALL' ? 'Tất cả đối tượng' : (reg.target === 'LANDLORD' ? 'Dành cho Chủ nhà' : 'Dành cho Khách thuê')}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingReg({ target: reg.target, content: reg.value })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer" title="Chỉnh sửa">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteRegulation(reg.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-error/10 text-error hover:bg-error hover:text-white transition-colors cursor-pointer" title="Xóa">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
                <div className="text-[14px] text-on-surface font-medium whitespace-pre-wrap max-h-[200px] overflow-y-auto text-left leading-relaxed flex-1 no-scrollbar pr-2">
                  {reg.value}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRegulationsTab;
