import React, { useState, useEffect } from 'react';
import contractApi from '../../api/contractApi';
import authApi from '../../api/authApi';
import { useDashboardContext } from '../../context/DashboardContext';

/**
 * Component ContractFormModal
 * Chức năng: Hiển thị form để tạo mới hoặc chỉnh sửa hợp đồng thuê phòng.
 * - Quản lý thông tin chủ nhà và khách thuê (Họ tên, CCCD, Ngày sinh, Quê quán...).
 * - Thiết lập các điều khoản tài chính (Giá thuê, tiền điện, nước, internet, dịch vụ...).
 * - Chốt chỉ số điện nước đầu kỳ.
 * - Quản lý danh sách thành viên ở cùng.
 * - Tải lên ảnh hợp đồng và minh chứng hiện trạng phòng (ảnh/video).
 */
const ContractFormModal = ({ 
  roomForNewContract, // Đối tượng phòng (nếu là tạo hợp đồng mới cho phòng này)
  contractToEdit,     // Đối tượng hợp đồng cần sửa (nếu là chế độ chỉnh sửa)
  onClose             // Hàm để đóng modal
}) => {
  const { user, fetchLandlordContracts, fetchLandlordRooms } = useDashboardContext();

  const [contractData, setContractData] = useState({ 
    landlordName: '', landlordDob: '', landlordPhone: '', landlordIdentityNumber: '', landlordHometown: '',
    tenantEmail: '', tenantName: '', tenantDob: '', tenantPhone: '', tenantIdentityNumber: '', tenantHometown: '',
    startDate: '', endDate: '',
    price: 0, electricityPrice: 0, waterPrice: 0, internetPrice: 0, parkingPrice: 0, servicePrice: 0,
    startElectricity: '', startWater: '', vehicleCount: 0,
    members: [],
    conditionDescription: '',
    isDirectUtilityPayment: false
  });

  const [contractImages, setContractImages] = useState([]);
  const [conditionImages, setConditionImages] = useState([]);
  const [conditionVideos, setConditionVideos] = useState([]);
  const [tenantDetails, setTenantDetails] = useState({ fullName: '', phone: '', identityNumber: '' });

  // Initialize form
  useEffect(() => {
    if (contractToEdit) {
      let parsedMembers = [];
      try { parsedMembers = typeof contractToEdit.members === 'string' ? JSON.parse(contractToEdit.members) : (contractToEdit.members || []); } catch(e) {}

      setContractData({
        landlordName: contractToEdit.landlordName || '', landlordDob: contractToEdit.landlordDob || '', landlordPhone: contractToEdit.landlordPhone || '', landlordIdentityNumber: contractToEdit.landlordIdentityNumber || '', landlordHometown: contractToEdit.landlordHometown || '',
        tenantEmail: contractToEdit.tenantEmail || '', tenantName: contractToEdit.tenantName || '', tenantDob: contractToEdit.tenantDob || '', tenantPhone: contractToEdit.tenantPhone || '', tenantIdentityNumber: contractToEdit.tenantIdentityNumber || '', tenantHometown: contractToEdit.tenantHometown || '',
        startDate: contractToEdit.startDate || '', endDate: contractToEdit.endDate || '',
        price: contractToEdit.price || 0, electricityPrice: contractToEdit.electricityPrice || 0, waterPrice: contractToEdit.waterPrice || 0, internetPrice: contractToEdit.internetPrice || 0, parkingPrice: contractToEdit.parkingPrice || 0, servicePrice: contractToEdit.servicePrice || 0,
        startElectricity: contractToEdit.startElectricity || '', startWater: contractToEdit.startWater || '', vehicleCount: contractToEdit.vehicleCount || 0,
        isDirectUtilityPayment: !!contractToEdit.isDirectUtilityPayment,
        members: parsedMembers
      });
    } else if (roomForNewContract) {
      setContractData({
        landlordName: user?.fullName || '', landlordDob: user?.dob || '', landlordPhone: user?.phone || '', landlordIdentityNumber: user?.identityNumber || '', landlordHometown: user?.address || '',
        tenantEmail: '', tenantName: '', tenantDob: '', tenantPhone: '', tenantIdentityNumber: '', tenantHometown: '',
        startDate: '', endDate: '',
        price: roomForNewContract.price || 0, electricityPrice: roomForNewContract.electricityPrice || 0, waterPrice: roomForNewContract.waterPrice || 0, internetPrice: roomForNewContract.internetPrice || 0, parkingPrice: roomForNewContract.parkingPrice || 0, servicePrice: roomForNewContract.servicePrice || 0,
        startElectricity: '', startWater: '', vehicleCount: 0,
        members: [], conditionDescription: '', isDirectUtilityPayment: false
      });
    }
  }, [contractToEdit, roomForNewContract, user]);

  const handleCheckTenantEmail = async () => {
    if (!contractData.tenantEmail) return alert("Vui lòng nhập Email khách thuê trước!");
    try {
      const res = await authApi.getUserByEmail(contractData.tenantEmail);
      if (res.user) {
        setTenantDetails({ fullName: res.user.fullName, phone: res.user.phone, identityNumber: res.user.identityNumber });
        setContractData(prev => ({...prev, tenantName: res.user.fullName, tenantPhone: res.user.phone, tenantIdentityNumber: res.user.identityNumber}));
        alert("Đã tìm thấy thông tin Khách thuê! Hệ thống đã tự điền vào Form.");
      }
    } catch (error) {
      alert("Không tìm thấy Khách thuê với Email này trong hệ thống. Vui lòng tự nhập tay thông tin.");
      setTenantDetails({ fullName: '', phone: '', identityNumber: '' });
    }
  };

  const handleCreateContract = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('roomId', contractToEdit ? contractToEdit.roomId : roomForNewContract.id);
      
      Object.keys(contractData).forEach(key => {
        if (key === 'members') formData.append('members', JSON.stringify(contractData.members));
        else formData.append(key, contractData[key]);
      });

      if (contractImages.length > 0) contractImages.forEach(image => formData.append('contractImages', image));
      if (conditionImages.length > 0) conditionImages.forEach(image => formData.append('conditionImages', image));
      if (conditionVideos.length > 0) conditionVideos.forEach(video => formData.append('conditionVideos', video));

      if (contractToEdit) {
        await contractApi.updateContract(contractToEdit.id, formData);
        alert('Cập nhật hợp đồng thành công!');
      } else {
        await contractApi.createContract(formData);
        alert('Tạo hợp đồng thành công!');
      }
      
      onClose();
      fetchLandlordRooms && fetchLandlordRooms();
      fetchLandlordContracts && fetchLandlordContracts();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi tạo hợp đồng!');
    }
  };

  if (!contractToEdit && !roomForNewContract) return null;

  const targetRoom = contractToEdit ? contractToEdit.room : roomForNewContract;
  const editingContractId = contractToEdit ? contractToEdit.id : null;

  return (              
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-on-surface/40 backdrop-blur-md animate-in fade-in duration-300">
                <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto bg-surface-container-lowest p-8 rounded-[2.5rem] border-t-8 border-primary shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 space-y-6 no-scrollbar">
                  {/* HEADER */}
                  <div className="flex items-center justify-between pb-6 border-b border-outline-variant/30">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">description</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-on-surface tracking-tight">
                          {editingContractId ? '✏️ Cập nhật Hợp đồng Phòng ' : '✍️ Ký hợp đồng cho Phòng '}{targetRoom.roomNumber}
                        </h3>
                        <p className="text-sm text-on-surface-variant font-bold opacity-60">{targetRoom.address}</p>
                      </div>
                    </div>
                    <button onClick={() => { onClose(); }} className="w-12 h-12 flex items-center justify-center hover:bg-error/10 hover:text-error rounded-full transition-all group">
                      <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                    </button>
                  </div>

                  {/* PHẦN 1: BÊN A */}
                  <div>
                    <h4 className="text-sm font-black text-on-surface uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px]">01</span>
                      Thông tin Chủ nhà (Bên A)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30">
                      <input type="text" placeholder="Họ và tên *" value={contractData.landlordName} onChange={e => setContractData({...contractData, landlordName: e.target.value})} className="px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                      <input type="text" placeholder="Số điện thoại *" value={contractData.landlordPhone} onChange={e => setContractData({...contractData, landlordPhone: e.target.value})} className="px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                      <input type="text" placeholder="Số CCCD/CMND *" value={contractData.landlordIdentityNumber} onChange={e => setContractData({...contractData, landlordIdentityNumber: e.target.value})} className="px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Ngày sinh:</span>
                        <input type="date" value={contractData.landlordDob} onChange={e => setContractData({...contractData, landlordDob: e.target.value})} className="flex-1 px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                      </div>
                      <input type="text" placeholder="Quê quán / Thường trú *" value={contractData.landlordHometown} onChange={e => setContractData({...contractData, landlordHometown: e.target.value})} className="md:col-span-2 px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                  </div>

                  {/* PHẦN 2: BÊN B */}
                  <div>
                    <h4 className="text-sm font-black text-on-surface uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center text-[10px]">02</span>
                      Thông tin Người đại diện thuê (Bên B)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-secondary-container/5 p-5 rounded-2xl border border-secondary/20">
                      <input type="text" placeholder="Họ và tên *" value={contractData.tenantName} onChange={e => setContractData({...contractData, tenantName: e.target.value})} className="px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/20 transition-all" />
                      <input type="email" placeholder="Email (Gõ xong bấm ra ngoài để tự điền) *" value={contractData.tenantEmail} onChange={e => setContractData({...contractData, tenantEmail: e.target.value})} onBlur={handleCheckTenantEmail} className="px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/20 transition-all" />
                      <input type="text" placeholder="Số điện thoại *" value={contractData.tenantPhone} onChange={e => setContractData({...contractData, tenantPhone: e.target.value})} className="px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/20 transition-all" />
                      <input type="text" placeholder="Số CCCD/CMND *" value={contractData.tenantIdentityNumber} onChange={e => setContractData({...contractData, tenantIdentityNumber: e.target.value})} className="px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/20 transition-all" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Ngày sinh:</span>
                        <input type="date" value={contractData.tenantDob} onChange={e => setContractData({...contractData, tenantDob: e.target.value})} className="flex-1 px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/20 transition-all" />
                      </div>
                      <input type="text" placeholder="Quê quán / Thường trú *" value={contractData.tenantHometown} onChange={e => setContractData({...contractData, tenantHometown: e.target.value})} className="px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-secondary/20 transition-all" />
                    </div>
                  </div>

                  {/* PHẦN 3: THỜI HẠN & ẢNH */}
                  <div>
                    <h4 className="text-sm font-black text-on-surface uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center text-[10px]">03</span>
                      Thời hạn hợp đồng
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60 ml-1">Ngày bắt đầu:</label>
                        <input type="date" value={contractData.startDate} onChange={e => setContractData({...contractData, startDate: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60 ml-1">Ngày kết thúc:</label>
                        <input type="date" value={contractData.endDate} onChange={e => setContractData({...contractData, endDate: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60 ml-1">Ảnh hợp đồng (Có thể chọn nhiều):</label>
                        <input type="file" multiple onChange={(e) => { setContractImages(Array.from(e.target.files)); }} className="w-full px-4 py-2 bg-white border border-dashed border-outline-variant rounded-xl text-sm font-bold outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary" />
                      </div>
                    </div>
                  </div>

                  {/* PHẦN 4: THÀNH VIÊN Ở CÙNG */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center text-[10px]">04</span>
                        Danh sách người ở cùng (Không tính người đại diện)
                      </h4>
                      <button onClick={() => setContractData({...contractData, members: [...contractData.members, { fullName: '', dob: '', phone: '', identityNumber: '', hometown: '' }]})} className="px-4 py-1.5 bg-tertiary text-on-tertiary rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm">
                        + Thêm người ở
                      </button>
                    </div>
                    {contractData.members.map((member, index) => (
                      <div key={index} className="mb-3 bg-surface-container-low p-4 rounded-2xl border border-dashed border-outline-variant/50 relative">
                        <button onClick={() => { const newMembers = contractData.members.filter((_, i) => i !== index); setContractData({...contractData, members: newMembers}); }} className="absolute top-3 right-3 px-3 py-1 bg-error text-white rounded-lg text-[10px] font-black hover:bg-error/80 transition-all">Xóa</button>
                        <p className="text-xs font-bold text-on-surface-variant opacity-50 mb-3">Thành viên {index + 1}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input type="text" placeholder="Họ và tên *" value={member.fullName} onChange={(e) => { const m = [...contractData.members]; m[index].fullName = e.target.value; setContractData({...contractData, members: m}); }} className="px-3 py-2 bg-white border border-outline-variant rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                          <input type="text" placeholder="Số điện thoại" value={member.phone} onChange={(e) => { const m = [...contractData.members]; m[index].phone = e.target.value; setContractData({...contractData, members: m}); }} className="px-3 py-2 bg-white border border-outline-variant rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                          <input type="text" placeholder="Số CCCD/CMND *" value={member.identityNumber} onChange={(e) => { const m = [...contractData.members]; m[index].identityNumber = e.target.value; setContractData({...contractData, members: m}); }} className="px-3 py-2 bg-white border border-outline-variant rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Ngày sinh:</span>
                            <input type="date" value={member.dob} onChange={(e) => { const m = [...contractData.members]; m[index].dob = e.target.value; setContractData({...contractData, members: m}); }} className="flex-1 px-3 py-2 bg-white border border-outline-variant rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                          </div>
                          <input type="text" placeholder="Quê quán / Thường trú *" value={member.hometown} onChange={(e) => { const m = [...contractData.members]; m[index].hometown = e.target.value; setContractData({...contractData, members: m}); }} className="md:col-span-2 px-3 py-2 bg-white border border-outline-variant rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                        </div>
                      </div>
                    ))}
                    {contractData.members.length === 0 && <p className="text-xs text-on-surface-variant italic opacity-50">Chưa có thành viên nào. Bấm "+ Thêm người ở" nếu phòng có nhiều người.</p>}
                  </div>

                  {/* PHẦN 5: CHI PHÍ & CHỈ SỐ BAN ĐẦU */}
                  <div>
                    <h4 className="text-sm font-black text-on-surface uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-error/10 text-error flex items-center justify-center text-[10px]">05</span>
                      Chi phí & Chỉ số ban đầu
                    </h4>
                    <div className="flex items-center gap-3 p-3 bg-primary-container/10 rounded-2xl border border-primary/20 mb-4">
                      <input type="checkbox" checked={contractData.isDirectUtilityPayment} onChange={e => setContractData({...contractData, isDirectUtilityPayment: e.target.checked})} className="w-5 h-5 rounded-lg text-primary focus:ring-0 cursor-pointer" id="directUtilityModal" />
                      <label htmlFor="directUtilityModal" className="text-xs font-bold text-primary cursor-pointer uppercase tracking-tight">Khách thuê tự thanh toán hóa đơn điện/nước trực tiếp</label>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-tertiary-container/5 p-5 rounded-2xl border border-tertiary/20">
                      <div className="space-y-1"><label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60">Giá phòng (đ/Tháng)</label><input type="number" value={contractData.price} onChange={e => setContractData({...contractData, price: e.target.value})} className="w-full px-4 py-2 bg-white border border-outline-variant rounded-xl text-sm font-black text-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all" /></div>
                      {!contractData.isDirectUtilityPayment && (
                        <>
                          <div className="space-y-1"><label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60">Giá điện (đ/Ký)</label><input type="number" value={contractData.electricityPrice} onChange={e => setContractData({...contractData, electricityPrice: e.target.value})} className="w-full px-4 py-2 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" /></div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60">Giá nước (đ/Khối)</label><input type="number" value={contractData.waterPrice} onChange={e => setContractData({...contractData, waterPrice: e.target.value})} className="w-full px-4 py-2 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" /></div>
                        </>
                      )}
                      <div className="space-y-1"><label className="text-[10px] font-black text-error uppercase">Chỉ số ĐIỆN ban đầu</label><input type="number" placeholder="Số trên đồng hồ" value={contractData.startElectricity} onChange={e => setContractData({...contractData, startElectricity: e.target.value})} className="w-full px-4 py-2 bg-white border-2 border-error/30 rounded-xl text-sm font-black text-error outline-none focus:ring-2 focus:ring-error/10 transition-all" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-black text-error uppercase">Chỉ số NƯỚC ban đầu</label><input type="number" placeholder="Số trên đồng hồ" value={contractData.startWater} onChange={e => setContractData({...contractData, startWater: e.target.value})} className="w-full px-4 py-2 bg-white border-2 border-error/30 rounded-xl text-sm font-black text-error outline-none focus:ring-2 focus:ring-error/10 transition-all" /></div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-primary uppercase">Số lượng xe (Chiếc)</label>
                        <div className="flex gap-2">
                          <input type="number" placeholder="Số xe" value={contractData.vehicleCount} onChange={e => setContractData({...contractData, vehicleCount: e.target.value})} className="w-2/5 px-3 py-2 bg-white border-2 border-primary/30 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
                          <input type="number" placeholder="Giá/xe" value={contractData.parkingPrice} onChange={e => setContractData({...contractData, parkingPrice: e.target.value})} className="w-3/5 px-3 py-2 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
                        </div>
                      </div>
                      <div className="space-y-1"><label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60">Mạng Internet (đ/Tháng)</label><input type="number" value={contractData.internetPrice} onChange={e => setContractData({...contractData, internetPrice: e.target.value})} className="w-full px-4 py-2 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60">Phí Dịch vụ (đ/Tháng)</label><input type="number" value={contractData.servicePrice} onChange={e => setContractData({...contractData, servicePrice: e.target.value})} className="w-full px-4 py-2 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" /></div>
                    </div>
                  </div>

                  {/* PHẦN 6: TÌNH TRẠNG BÀN GIAO */}
                  <div>
                    <h4 className="text-sm font-black text-on-surface uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-outline/10 text-outline flex items-center justify-center text-[10px]">06</span>
                      Tình trạng phòng bàn giao
                    </h4>
                    <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60 ml-1">Mô tả chi tiết đồ dùng, trạng thái:</label>
                        <textarea rows="3" value={contractData.conditionDescription} onChange={e => setContractData({...contractData, conditionDescription: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="VD: Tường sạch, có 1 giường, 1 nệm cũ, tủ lạnh hoạt động bình thường..." />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60 ml-1">Ảnh tình trạng phòng:</label>
                          <input type="file" multiple accept="image/*" onChange={(e) => setConditionImages(Array.from(e.target.files))} className="w-full px-4 py-2 bg-white border border-dashed border-outline-variant rounded-xl text-sm font-bold outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-on-surface-variant uppercase opacity-60 ml-1">Video tình trạng phòng (nếu có):</label>
                          <input type="file" multiple accept="video/*" onChange={(e) => setConditionVideos(Array.from(e.target.files))} className="w-full px-4 py-2 bg-white border border-dashed border-outline-variant rounded-xl text-sm font-bold outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NÚT HÀNH ĐỘNG */}
                  <div className="flex justify-end gap-4 pt-6 border-t border-outline-variant/30">
                    <button onClick={onClose} className="px-10 py-4 rounded-2xl border-2 border-outline-variant text-on-surface-variant font-black uppercase tracking-widest text-xs hover:bg-surface-container-low transition-all active:scale-95">Hủy bỏ</button>
                    <button onClick={handleCreateContract} className={`px-16 py-4 ${editingContractId ? 'bg-secondary shadow-xl shadow-secondary/30' : 'bg-primary shadow-xl shadow-primary/30'} text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all`}>
                      {editingContractId ? 'Lưu Cập Nhật' : 'Tạo Hợp Đồng'}
                    </button>
                  </div>
                </div>
              </div>
  );
};

export default ContractFormModal;