import React, { useState } from 'react';
import roomApi from '../../api/roomApi';
import { getMediaUrl } from '../../utils/media';

const LimitModal = ({ isVisible, limitInfo, onClose, rooms, fetchRooms, setActiveTab, activeTab }) => {
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [isHiding, setIsHiding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isVisible || !limitInfo || activeTab === 'WALLET') return null;

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

  const filteredRooms = activeRooms.filter(r => 
    (r.roomNumber && String(r.roomNumber).toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.address && r.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.houseNumber && r.houseNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.roomCode && r.roomCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            <div className="flex-1 bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center cursor-pointer hover:bg-primary/20 transition-all" onClick={() => { setActiveTab('WALLET'); }}>
              <span className="material-symbols-outlined text-primary text-3xl mb-1">upgrade</span>
              <p className="font-bold text-primary text-sm">Nâng Cấp Gói</p>
            </div>
            <div className="flex-1 bg-secondary/10 border border-secondary/20 rounded-2xl p-4 text-center cursor-pointer hover:bg-secondary/20 transition-all" onClick={() => { setActiveTab('WALLET'); }}>
              <span className="material-symbols-outlined text-secondary text-3xl mb-1">add_box</span>
              <p className="font-bold text-secondary text-sm">Mua Gói Lẻ</p>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4">
            <p className="font-bold text-on-surface mb-2">Hoặc chọn {excessCount} phòng để tạm ẩn:</p>
            <p className="text-xs text-on-surface-variant mb-4">*Phòng đang thuê (RENTED) không cần ẩn.</p>
            
            <div className="mb-4 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
              <input 
                type="text" 
                placeholder="Tìm mã phòng, tên phòng, địa chỉ..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-outline-variant/30 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {filteredRooms.length === 0 ? (
                <p className="text-center text-sm text-on-surface-variant py-8 border-2 border-dashed border-outline-variant/30 rounded-xl">Không tìm thấy phòng phù hợp.</p>
              ) : (
                filteredRooms.map(room => {
                  let images = [];
                  try { images = JSON.parse(room.images) || []; } catch(e) {}
                  
                  return (
                    <div key={room.id} onClick={() => handleToggleRoom(room.id)} className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${selectedRoomIds.includes(room.id) ? 'bg-error/10 border-error' : 'bg-white border-outline-variant/30 hover:border-error/50 hover:shadow-sm'}`}>
                      
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container flex items-center justify-center">
                        {images.length > 0 ? (
                          <img src={getMediaUrl(images[0])} alt={`Phòng ${room.roomNumber}`} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-outline-variant">image</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`font-bold truncate text-sm ${selectedRoomIds.includes(room.id) ? 'text-error' : 'text-on-surface'}`}>
                            {room.roomType === 'WHOLE_HOUSE' || /nhà/i.test(room.roomNumber) ? 'Nhà ' : 'Phòng '}{room.roomNumber}
                          </p>
                          <p className="text-sm font-black text-primary shrink-0 ml-2">{(room.price || 0).toLocaleString()} đ</p>
                        </div>
                        <p className="text-xs text-on-surface-variant truncate">{room.houseNumber ? `${room.houseNumber}, ` : ''}{room.address}</p>
                        
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                          {room.roomCode && <span>Mã: {room.roomCode}</span>}
                          {room.area && <span>• {room.area}m²</span>}
                          {room.maxOccupants && <span>• {room.maxOccupants} người</span>}
                        </div>
                      </div>

                      {/* Checkbox */}
                      <div className={`w-6 h-6 rounded-md flex justify-center items-center border shrink-0 transition-colors ${selectedRoomIds.includes(room.id) ? 'bg-error border-error text-white' : 'border-outline-variant bg-surface-container-lowest'}`}>
                        {selectedRoomIds.includes(room.id) && <span className="material-symbols-outlined text-[16px] font-black">check</span>}
                      </div>

                    </div>
                  );
                })
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
