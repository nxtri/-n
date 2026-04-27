import React, { useState, useEffect } from 'react';
import billApi from '../../api/billApi';
import { useDashboardContext } from '../../context/DashboardContext';

/**
 * Component BillFormModal
 * Chức năng: Hiển thị form để chủ nhà chốt chỉ số điện nước và tạo hóa đơn mới cho một hợp đồng.
 * - Cho phép nhập chỉ số điện/nước mới.
 * - Tự động tính toán tiền điện, nước dựa trên chỉ số cũ và đơn giá trong hợp đồng.
 * - Hỗ trợ chọn tháng/năm cho kỳ hóa đơn.
 */
const BillFormModal = ({ 
  contractForBill, // Đối tượng hợp đồng cần tạo hóa đơn (chứa thông tin phòng, giá điện/nước, số cũ)
  onClose          // Hàm để đóng modal sau khi hoàn tất hoặc hủy
}) => {
  const { fetchLandlordBills, fetchLandlordContracts } = useDashboardContext();
  
  const [billData, setBillData] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear(), 
    newElectricity: '', 
    newWater: '' 
  });
  
  const [isCreatingBill, setIsCreatingBill] = useState(false);

  // Khởi tạo billData mỗi khi mở form
  useEffect(() => {
    if (contractForBill) {
      setBillData({ 
        month: new Date().getMonth() + 1, 
        year: new Date().getFullYear(), 
        newElectricity: '', 
        newWater: '' 
      });
    }
  }, [contractForBill]);

  const handleCreateBill = async (e) => { 
    e.preventDefault(); 
    
    const oldElec = contractForBill.currentElectricity || 0;
    const oldWater = contractForBill.currentWater || 0;

    if (billData.newElectricity === '' || billData.newElectricity === undefined || 
        billData.newWater === '' || billData.newWater === undefined) {
      return alert("Vui lòng nhập đầy đủ chỉ số Điện và Nước mới!");
    }

    const newElec = Number(billData.newElectricity);
    const newWater = Number(billData.newWater);

    if (newElec < oldElec) {
      return alert("❌ LỖI: Chỉ số điện MỚI (" + newElec + ") không được nhỏ hơn chỉ số CŨ (" + oldElec + ")!");
    }
    if (newWater < oldWater) {
      return alert("❌ LỖI: Chỉ số nước MỚI (" + newWater + ") không được nhỏ hơn chỉ số CŨ (" + oldWater + ")!");
    }

    try { 
      setIsCreatingBill(true);
      const elecUsage = newElec - oldElec;
      const waterUsage = newWater - oldWater;

      await billApi.createBill({ 
        contractId: contractForBill.id, 
        month: billData.month, 
        year: billData.year,
        electricityUsage: elecUsage, 
        waterUsage: waterUsage, 
        oldElectricity: oldElec,
        newElectricity: newElec,             
        oldWater: oldWater,
        newWater: newWater,
        vehicleCount: contractForBill.vehicleCount,
        billType: 'UTILITY'
      }); 
      
      alert('Tạo hóa đơn thành công!'); 
      onClose(); 
      fetchLandlordBills && fetchLandlordBills(); 
      fetchLandlordContracts && fetchLandlordContracts(); 
    } catch (error) { 
      alert('Lỗi tạo hóa đơn!'); 
      console.error(error);
    } finally {
      setIsCreatingBill(false);
    }
  };

  if (!contractForBill) return null;

  const billContract = contractForBill;              
                const elecUsage = Math.max(0, (Number(billData.newElectricity) || 0) - (Number(billContract.currentElectricity) || 0));
                const waterUsage = Math.max(0, (Number(billData.newWater) || 0) - (Number(billContract.currentWater) || 0));
                const elecPrice = Number(billContract.electricityPrice) || 0;
                const waterPrice = Number(billContract.waterPrice) || 0;
                return (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-on-surface/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-surface-container-lowest p-8 rounded-[2.5rem] border-t-8 border-tertiary shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 space-y-8 no-scrollbar">
                      <div className="flex items-center justify-between pb-6 border-b border-outline-variant/30">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl">receipt_long</span>
                          </div>
                          <div>
                            <h3 className="text-3xl font-black text-on-surface tracking-tight">Chốt Hóa Đơn</h3>
                            <p className="text-sm text-on-surface-variant font-bold opacity-60">
                              Phòng {billContract.room?.roomNumber} • Kỳ tháng {billData.month}/{billData.year}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => onClose()} className="w-12 h-12 flex items-center justify-center hover:bg-error/10 hover:text-error rounded-full transition-all group">
                          <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                        </button>
                      </div>

                      {/* BỘ CHỌN THÁNG/NĂM CHỐT HÓA ĐƠN */}
                      <div className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/30 flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">calendar_month</span>
                          </div>
                          <span className="text-sm font-black text-on-surface whitespace-nowrap">Chọn kỳ thanh toán:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-50">Tháng</p>
                            <select 
                              value={billData.month} 
                              onChange={e => setBillData({...billData, month: parseInt(e.target.value)})}
                              className="w-full px-5 py-3 bg-white border border-outline-variant rounded-2xl text-sm font-black focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                            >
                              {[...Array(12)].map((_, i) => (
                                <option key={i+1} value={i+1}>Tháng {i+1}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-50">Năm</p>
                            <select 
                              value={billData.year} 
                              onChange={e => setBillData({...billData, year: parseInt(e.target.value)})}
                              className="w-full px-5 py-3 bg-white border border-outline-variant rounded-2xl text-sm font-black focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                            >
                              {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>Năm {y}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {!billContract.isDirectUtilityPayment ? (
                          <>
                            <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/30 space-y-6 group hover:border-primary/30 transition-all">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-widest opacity-60">Chỉ số Điện</h4>
                                <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full">{elecPrice.toLocaleString()} đ/số</span>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black opacity-40 uppercase ml-1">Số cũ</label>
                                  <div className="px-5 py-4 bg-white border border-outline-variant/50 rounded-2xl text-lg font-black text-on-surface opacity-40">{billContract.currentElectricity || 0}</div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-error uppercase ml-1">Số mới *</label>
                                  <input type="number" autoFocus value={billData.newElectricity || ''} onChange={e => setBillData({...billData, newElectricity: e.target.value})} className="w-full px-5 py-4 bg-white border-2 border-error rounded-2xl text-lg font-black focus:ring-4 focus:ring-error/10 outline-none transition-all" />
                                </div>
                              </div>
                              <div className="pt-6 border-t border-dashed border-outline-variant/30 flex justify-between items-center">
                                <span className="text-xs font-black text-on-surface-variant uppercase opacity-50">Thành tiền:</span>
                                <span className="text-2xl font-black text-primary">{(elecUsage * elecPrice).toLocaleString()} <span className="text-xs font-normal">đ</span></span>
                              </div>
                            </div>

                            <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/30 space-y-6 group hover:border-primary/30 transition-all">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-widest opacity-60">Chỉ số Nước</h4>
                                <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full">{waterPrice.toLocaleString()} đ/m³</span>
                              </div>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black opacity-40 uppercase ml-1">Số cũ</label>
                                  <div className="px-5 py-4 bg-white border border-outline-variant/50 rounded-2xl text-lg font-black text-on-surface opacity-40">{billContract.currentWater || 0}</div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-error uppercase ml-1">Số mới *</label>
                                  <input type="number" value={billData.newWater || ''} onChange={e => setBillData({...billData, newWater: e.target.value})} className="w-full px-5 py-4 bg-white border-2 border-error rounded-2xl text-lg font-black focus:ring-4 focus:ring-error/10 outline-none transition-all" />
                                </div>
                              </div>
                              <div className="pt-6 border-t border-dashed border-outline-variant/30 flex justify-between items-center">
                                <span className="text-xs font-black text-on-surface-variant uppercase opacity-50">Thành tiền:</span>
                                <span className="text-2xl font-black text-primary">{(waterUsage * waterPrice).toLocaleString()} <span className="text-xs font-normal">đ</span></span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-full p-12 bg-primary/5 rounded-[2.5rem] border border-dashed border-primary/30 text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                              <span className="material-symbols-outlined text-4xl">contactless</span>
                            </div>
                            <div className="max-w-md mx-auto">
                              <h4 className="text-xl font-black text-primary">Thanh toán trực tiếp</h4>
                              <p className="text-sm font-bold text-on-surface-variant opacity-70 mt-2">Phòng này tự thanh toán điện/nước cho nhà cung cấp. Bạn chỉ cần chốt để hệ thống cập nhật chỉ số kỳ mới.</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-outline-variant/30">
                        <button onClick={() => onClose()} className="px-10 py-4 rounded-2xl border-2 border-outline-variant text-on-surface-variant font-black uppercase tracking-widest text-xs hover:bg-surface-container-low transition-all active:scale-95">Hủy bỏ</button>
                        <button onClick={handleCreateBill} disabled={isCreatingBill} className={`px-16 py-4 ${isCreatingBill ? 'bg-outline-variant cursor-not-allowed' : 'bg-tertiary shadow-xl shadow-tertiary/30'} text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all`}>
                          {isCreatingBill ? '⏳ Đang xử lý...' : 'Xác nhận Chốt Hóa Đơn 🚀'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              
};

export default BillFormModal;