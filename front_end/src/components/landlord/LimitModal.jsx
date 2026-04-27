import React, { useState } from 'react';
import roomApi from '../../api/roomApi';

const LimitModal = ({ isVisible, limitInfo, onClose, rooms, fetchRooms, setActiveTab }) => {
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [isHiding, setIsHiding] = useState(false);

  if (!isVisible || !limitInfo) return null;

  const { visibleCount, limit, excessCount } = limitInfo;

  const handleToggleRoom = (id) => {
    if (selectedRoomIds.includes(id)) {
      setSelectedRoomIds(selectedRoomIds.filter(r => r !== id));
    } else {
      setSelectedRoomIds([...selectedRoomIds, id]);
    }
  };

  const handleHideRooms = async () => {
    if (selectedRoomIds.length < excessCount) {
      return alert(`Vui lòng chọn ít nhất ${excessCount} phòng để ẩn!`);
    }

    try {
      setIsHiding(true);
      await roomApi.bulkToggleVisibility(selectedRoomIds, true);
      alert('Đã ẩn các phòng thành công!');
      fetchRooms();
      onClose(); // Hide modal when satisfied
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi khi ẩn phòng');
    } finally {
      setIsHiding(false);
    }
  };

  const activeRooms = rooms.filter(r => !r.isHidden && r.status !== 'RENTED');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999999] flex justify-center items-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="bg-error p-6 text-white text-center">
          <span className="material-symbols-outlined text-5xl mb-2">warning</span>
          <h2 className="text-2xl font-black">Vượt Giới Hạn Gói Dịch Vụ!</h2>
          <p className="mt-2 text-sm font-medium opacity-90">
            Bạn đang hiển thị <b>{visibleCount}</b> phòng, nhưng giới hạn hiện tại của bạn chỉ là <b>{limit}</b> phòng.
          </p>
        </div>

        <div className="p-6 overflow-y-auto bg-surface-container-lowest">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center cursor-pointer hover:bg-primary/20 transition-all" onClick={() => { onClose(); setActiveTab('WALLET'); }}>
              <span className="material-symbols-outlined text-primary text-3xl mb-1">upgrade</span>
              <p className="font-bold text-primary text-sm">Nâng Cấp Gói</p>
            </div>
            <div className="flex-1 bg-secondary/10 border border-secondary/20 rounded-2xl p-4 text-center cursor-pointer hover:bg-secondary/20 transition-all" onClick={() => { onClose(); setActiveTab('WALLET'); }}>
              <span className="material-symbols-outlined text-secondary text-3xl mb-1">add_box</span>
              <p className="font-bold text-secondary text-sm">Mua Gói Lẻ</p>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4">
            <p className="font-bold text-on-surface mb-2">Hoặc chọn {excessCount} phòng để tạm ẩn:</p>
            <p className="text-xs text-on-surface-variant mb-4">*Phòng đang thuê (RENTED) không cần ẩn.</p>
            
            <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
              {activeRooms.length === 0 ? (
                <p className="text-center text-sm text-on-surface-variant py-4">Không có phòng hợp lệ để ẩn.</p>
              ) : (
                activeRooms.map(room => (
                  <div key={room.id} onClick={() => handleToggleRoom(room.id)} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedRoomIds.includes(room.id) ? 'bg-error/10 border-error text-error' : 'bg-white border-outline-variant/30 hover:border-error/50'}`}>
                    <div>
                      <p className="font-bold">Phòng {room.roomNumber}</p>
                      <p className="text-xs opacity-80">{room.address}</p>
                    </div>
                    <div className={`w-5 h-5 rounded flex justify-center items-center border ${selectedRoomIds.includes(room.id) ? 'bg-error border-error text-white' : 'border-outline-variant'}`}>
                      {selectedRoomIds.includes(room.id) && <span className="material-symbols-outlined text-[14px]">check</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest flex justify-between items-center">
          <p className="text-sm font-bold text-on-surface-variant">
            Đã chọn: <span className={selectedRoomIds.length >= excessCount ? 'text-green-600' : 'text-error'}>{selectedRoomIds.length} / {excessCount}</span>
          </p>
          <button 
            onClick={handleHideRooms}
            disabled={selectedRoomIds.length < excessCount || isHiding}
            className="px-6 py-2.5 bg-error text-white font-black rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isHiding ? 'Đang ẩn...' : 'Xác nhận ẩn phòng'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LimitModal;
