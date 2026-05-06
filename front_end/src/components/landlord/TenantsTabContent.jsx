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
  handleViewRoomDetails, // Hàm để mở modal xem chi tiết phòng
  handleEditContractClick // Hàm để mở modal sửa hợp đồng
}) => {
  const { contracts, rooms } = useDashboardContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
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

              {/* Toolbar: Tìm kiếm và Lọc */}
              <div className="flex flex-col gap-6 bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/30 shadow-sm mb-6">
                
                {/* Bộ lọc trạng thái */}
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { id: 'ALL', label: 'Tất cả hợp đồng', icon: 'list_alt' },
                    { id: 'ACTIVE', label: 'Đang hiệu lực', icon: 'check_circle' },
                    { id: 'EXPIRED', label: 'Sắp / Đã hết hạn', icon: 'schedule' },
                    { id: 'TERMINATED', label: 'Đã chấm dứt', icon: 'cancel' }
                  ].map(filter => (
                    <button 
                      key={filter.id}
                      onClick={() => setFilterStatus(filter.id)}
                      className={`px-5 py-3 rounded-2xl text-[13px] font-black flex items-center gap-2.5 transition-all duration-300 ${
                        filterStatus === filter.id 
                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/20' 
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:translate-y-[-2px]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{filter.icon}</span>
                      <span>{filter.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tìm kiếm */}
                <div className="relative w-full group">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[22px]">search</span>
                  <input 
                    type="text" 
                    placeholder="Tìm tên khách, số điện thoại, email hoặc mã phòng..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-12 py-4 bg-surface-container-low border border-outline-variant/50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none placeholder:opacity-50"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-outline hover:text-error transition-colors p-1">
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-6">

                {(() => {
                  // Lọc hợp đồng theo tìm kiếm và trạng thái
                  let filteredContracts = contracts;
                  
                  if (filterStatus !== 'ALL') {
                    if (filterStatus === 'EXPIRED') {
                      // Tính luôn những hợp đồng 'ACTIVE' nhưng endDate còn < 30 ngày là "Sắp hết hạn"
                      const now = new Date();
                      filteredContracts = filteredContracts.filter(c => {
                        if (c.status === 'EXPIRED') return true;
                        if (c.status === 'ACTIVE' && c.endDate) {
                          const end = new Date(c.endDate);
                          const diffTime = end - now;
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays <= 30; // Sắp hết hạn trong vòng 30 ngày
                        }
                        return false;
                      });
                    } else {
                      filteredContracts = filteredContracts.filter(c => c.status === filterStatus);
                    }
                  }

                  if (searchTerm) {
                    const lowerSearch = searchTerm.toLowerCase();
                    filteredContracts = filteredContracts.filter(c => {
                      const tName = (c.tenantName || c.tenant?.fullName || '').toLowerCase();
                      const tEmail = (c.tenantEmail || c.tenant?.email || '').toLowerCase();
                      const tPhone = (c.tenantPhone || c.tenant?.phone || '').toLowerCase();
                      const rNum = (c.room?.roomNumber || '').toLowerCase();
                      const rCode = (c.room?.roomCode || '').toLowerCase();
                      return tName.includes(lowerSearch) || tEmail.includes(lowerSearch) || tPhone.includes(lowerSearch) || rNum.includes(lowerSearch) || rCode.includes(lowerSearch);
                    });
                  }

                  // 1. Nhóm hợp đồng theo Tenant (Dùng email hoặc ID người thuê làm khóa)
                  const grouped = filteredContracts.reduce((acc, c) => {
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
                        <span className="material-symbols-outlined text-5xl text-outline mb-4 opacity-30">{searchTerm || filterStatus !== 'ALL' ? 'search_off' : 'person_off'}</span>
                        <p className="text-on-surface-variant italic font-medium">
                          {searchTerm || filterStatus !== 'ALL' 
                            ? 'Không tìm thấy hợp đồng hoặc người thuê nào phù hợp với bộ lọc.'
                            : 'Chưa có người thuê (Chưa có hợp đồng nào). Vui lòng tạo Hợp đồng ở mục Danh sách phòng!'}
                        </p>
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
                            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                              <thead>
                                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                                  <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold w-[35%]">Phòng / Căn hộ</th>
                                  <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold w-[20%]">Thời hạn</th>
                                  <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold w-[15%]">Kết thúc thực tế</th>
                                  <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center w-[15%]">Trạng thái</th>
                                  <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center w-[15%]">Hợp đồng</th>
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
                                          className="font-bold text-primary group-hover:text-surface-tint cursor-pointer hover:underline truncate"
                                          title={(c.room?.roomType === 'WHOLE_HOUSE' || /nhà|căn/i.test(c.room?.roomNumber)) ? 'Nhà nguyên căn ' + (c.room?.roomNumber || 'Đã xóa') : 'Phòng trọ ' + (c.room?.roomNumber || 'Đã xóa')}
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
                                      <td className="py-4 px-8 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <button onClick={() => setViewContract(c)} className="px-4 py-2 bg-surface-container hover:bg-primary/10 text-primary rounded-xl transition-all font-bold text-[11px] uppercase tracking-widest flex items-center gap-2" title="Xem Hợp đồng">
                                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                                            Xem chi tiết
                                          </button>
                                        </div>
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