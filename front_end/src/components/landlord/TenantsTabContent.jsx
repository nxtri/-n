import React, { useState } from 'react';
import { useDashboardContext } from '../../context/DashboardContext';

/**
 * Component TenantsTabContent
 * Chức năng: Hiển thị danh sách tất cả những người đã và đang thuê phòng.
 * - Nhóm các hợp đồng theo từng khách thuê (dựa trên Email/ID).
 * - Hiển thị lịch sử thuê phòng của từng người (các phòng đã thuê, thời hạn, trạng thái).
 * - Hỗ trợ mở rộng/thu gọn (Accordion) danh sách hợp đồng của từng khách.
 */
const TenantsTabContent = ({ 
  activeTab,       // Tab hiện tại đang được chọn (phải là 'TENANTS')
  setViewContract, // Hàm để mở modal xem chi tiết một hợp đồng cụ thể
  handleViewRoomDetails // Hàm để mở modal xem chi tiết phòng
}) => {
  const { contracts, rooms } = useDashboardContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTenantRooms, setExpandedTenantRooms] = useState({});

  if (activeTab !== 'TENANTS') return null;

  return (            <div className="p-0">
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 mt-4 gap-4">
                <div>
                  <h2 className="font-display-xl text-3xl font-bold text-on-surface">Danh sách Người Thuê</h2>
                  <p className="font-body-md text-on-surface-variant mt-1">Quản lý thông tin khách thuê và lịch sử hợp đồng của bạn.</p>
                </div>
              </div>

              <div className="flex flex-col gap-6">

                {(() => {
                  // 1. Nhóm hợp đồng theo Tenant (Dùng email hoặc ID người thuê làm khóa)
                  const grouped = contracts.reduce((acc, c) => {
                    const tKey = c.tenantId || c.tenantEmail || 'DELETED';
                    if (!acc[tKey]) {
                      acc[tKey] = {
                        tenantName: c.tenantName || c.tenant?.fullName || 'Người thuê đã xóa',
                        tenantEmail: c.tenantEmail || c.tenant?.email || 'N/A',
                        tenantPhone: c.tenantPhone || c.tenant?.phone || 'N/A',
                        contracts: []
                      };
                    }
                    acc[tKey].contracts.push(c);
                    return acc;
                  }, {});

                  const tenantKeys = Object.keys(grouped);

                  if (tenantKeys.length === 0) {
                    return (
                      <div className="text-center py-20 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant">
                        <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-30">person_off</span>
                        <p className="text-on-surface-variant italic font-medium">Chưa có người thuê (Chưa có hợp đồng nào). Vui lòng tạo Hợp đồng ở mục Danh sách phòng!</p>
                      </div>
                    );
                  }


                  return tenantKeys.map((tKey, idx) => {
                    const group = grouped[tKey];
                    const isExpanded = expandedTenantRooms[tKey];
                    // Tìm xem khách này có hợp đồng nào đang ACTIVE không
                    const activeContract = group.contracts.find(c => c.status === 'ACTIVE');

                    return (
                      <div key={tKey} className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 transition-all">
                        {/* Header của Nhóm Người Thuê */}
                        <div 
                          onClick={() => setExpandedTenantRooms(prev => ({ ...prev, [tKey]: !prev[tKey] }))}
                          className={`px-8 py-6 flex justify-between items-center cursor-pointer transition-all ${isExpanded ? 'bg-surface-container-low/50' : 'hover:bg-surface-container-low/30'}`}
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-[24px] fill-1">person</span>
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-headline-md text-xl font-black text-on-surface">{group.tenantName}</h3>
                                <div className="flex items-center gap-4 mt-1">
                                    <p className="text-xs font-bold text-on-surface-variant opacity-60 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">mail</span> {group.tenantEmail}
                                    </p>
                                    <p className="text-xs font-bold text-on-surface-variant opacity-60 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">call</span> {group.tenantPhone}
                                    </p>
                                </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="bg-secondary-container text-on-secondary-container font-label-md text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
                                {group.contracts.length} hợp đồng
                            </span>
                            <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : 'text-on-surface-variant'}`}>
                              keyboard_arrow_down
                            </span>
                          </div>
                        </div>


                        {/* Danh sách các lần thuê / phòng thuê của người này */}
                        {isExpanded && (
                          <div className="overflow-x-auto border-t border-outline-variant/30">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                                  <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Phòng / Căn hộ</th>
                                  <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Thời hạn</th>
                                  <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Kết thúc thực tế</th>
                                  <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center">Trạng thái</th>
                                </tr>
                              </thead>

                              <tbody>
                                {(() => {
                                  const statusOrder = { 'ACTIVE': 0, 'EXPIRED': 1, 'TERMINATED': 2 };
                                  return [...group.contracts].sort((a, b) => {
                                    // 1. Sắp xếp theo thứ tự trạng thái ưu tiên
                                    if (statusOrder[a.status] !== statusOrder[b.status]) {
                                      return statusOrder[a.status] - statusOrder[b.status];
                                    }
                                    // 2. Nếu cùng trạng thái, cái nào mới hơn xếp trên
                                    return new Date(b.createdAt) - new Date(a.createdAt);
                                  }).map(c => (
                                    <tr key={c.id} className="hover:bg-surface-container-low/30 transition-colors group border-b border-outline-variant/30 last:border-0">
                                      <td className="py-4 px-8">
                                        <div 
                                          className="font-bold text-primary group-hover:text-surface-tint cursor-pointer hover:underline"
                                          onClick={() => c.room && handleViewRoomDetails(c.room)}
                                        >
                                          {(c.room?.roomType === 'WHOLE_HOUSE' || /nhà|căn/i.test(c.room?.roomNumber)) ? 'Nhà nguyên căn ' : 'Phòng trọ '}{c.room?.roomNumber || 'Đã xóa'}
                                        </div>
                                        <div className="text-[11px] font-bold text-on-surface-variant opacity-50 uppercase tracking-wider">Mã: {c.room?.roomCode || 'N/A'}</div>
                                      </td>
                                      <td className="py-4 px-8">
                                        <div className="font-medium text-on-surface">{c.startDate} <span className="material-symbols-outlined text-[14px] opacity-30 px-1">arrow_forward</span> {c.endDate}</div>
                                      </td>
                                      <td className="py-4 px-8">
                                        {c.status === 'ACTIVE' ? <span className="text-on-surface-variant opacity-30">—</span> : <span className="font-medium text-on-surface">{new Date(c.updatedAt).toLocaleDateString('vi-VN')}</span>}
                                      </td>
                                      <td className="py-4 px-8 text-center">

                                      {(() => {
                                        if (c.status === 'ACTIVE') return (
                                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[11px] font-bold uppercase tracking-wider">
                                            <span className="w-1.5 h-1.5 rounded-full bg-secondary mr-2"></span>
                                            Đang thuê
                                          </span>
                                        );
                                        const updated = new Date(c.updatedAt);
                                        const end = new Date(c.endDate);
                                        const isPre = updated < end;
                                        if (c.status === 'TERMINATED' || (c.status === 'EXPIRED' && isPre)) return (
                                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-md text-[11px] font-bold uppercase tracking-wider">
                                            <span className="w-1.5 h-1.5 rounded-full bg-error mr-2"></span>
                                            Hủy trước hạn
                                          </span>
                                        );
                                        return (
                                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-[11px] font-bold uppercase tracking-wider border border-outline-variant/30">
                                            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30 mr-2"></span>
                                            Đã kết thúc
                                          </span>
                                        );
                                      })()}
                                    </td>

                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          
  );
};

export default TenantsTabContent;