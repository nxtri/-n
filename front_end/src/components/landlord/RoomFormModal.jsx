import React, { useState, useEffect } from 'react';
import axios from 'axios';
import roomApi from '../../api/roomApi';
import { useDashboardContext } from '../../context/DashboardContext';

/**
 * Component RoomFormModal
 * Chức năng: Hiển thị form để thêm mới phòng hoặc chỉnh sửa thông tin phòng hiện có.
 * - Quản lý thông tin cơ bản (Số phòng, diện tích, giá thuê...).
 * - Quản lý địa chỉ thông qua dropdown Tỉnh/Thành, Phường/Xã (sử dụng Provinces API).
 * - Quản lý tiện ích phòng (Thang máy, máy giặt, tủ lạnh...).
 * - Tải lên và xem trước danh sách ảnh phòng (Tối đa 15 ảnh).
 */
const RoomFormModal = ({ 
  showModal,    // State boolean ẩn/hiện modal
  setShowModal, // Hàm cập nhật trạng thái ẩn/hiện modal
  roomToEdit    // Đối tượng phòng cần sửa (null nếu là thêm mới)
}) => {
  const { fetchLandlordRooms } = useDashboardContext();

  const [newRoom, setNewRoom] = useState({
    roomNumber: '', houseNumber: '', price: '', description: '', area: '', address: '',
    roomType: 'SINGLE', numFloors: '', numBedrooms: '', numBathrooms: '',
    maxOccupants: 1, electricityPrice: '', waterPrice: '', internetPrice: '', parkingPrice: '', servicePrice: '',
    hasElevator: false, hasWashingMachine: false, hasFridge: false, hasKitchen: false, hasHeater: false
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Location Dropdown States
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState({ code: '', name: '' });
  const [selectedWard, setSelectedWard] = useState({ code: '', name: '' });
  
  const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false);
  const [wardDropdownOpen, setWardDropdownOpen] = useState(false);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [wardSearch, setWardSearch] = useState('');

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await axios.get('https://provinces.open-api.vn/api/p/');
        setProvinces(res.data || []);
      } catch (error) {
        console.error("Lỗi lấy danh sách tỉnh/thành:", error);
      }
    };
    fetchProvinces();
  }, []);

  // Initialize form when editing
  useEffect(() => {
    if (showModal) {
      if (roomToEdit) {
        setNewRoom({
          roomNumber: roomToEdit.roomNumber || '', houseNumber: roomToEdit.houseNumber || '', price: roomToEdit.price || '', description: roomToEdit.description || '', area: roomToEdit.area || '', address: roomToEdit.address || '',
          roomType: roomToEdit.roomType || 'SINGLE', numFloors: roomToEdit.numFloors || '', numBedrooms: roomToEdit.numBedrooms || '', numBathrooms: roomToEdit.numBathrooms || '',
          maxOccupants: roomToEdit.maxOccupants || 1, electricityPrice: roomToEdit.electricityPrice || '', waterPrice: roomToEdit.waterPrice || '', internetPrice: roomToEdit.internetPrice || '', parkingPrice: roomToEdit.parkingPrice || '', servicePrice: roomToEdit.servicePrice || '',
          hasElevator: roomToEdit.hasElevator || false, hasWashingMachine: roomToEdit.hasWashingMachine || false, hasFridge: roomToEdit.hasFridge || false, hasKitchen: roomToEdit.hasKitchen || false, hasHeater: roomToEdit.hasHeater || false
        });
        
        // Match existing address to API
        if (roomToEdit.address) {
          const parts = roomToEdit.address.split(', ');
          if (parts.length >= 2) {
            const wardName = parts[0];
            const provName = parts[1];
            const matchedProvince = provinces.find(p => p.name === provName);
            if (matchedProvince) {
              setSelectedProvince({ code: matchedProvince.code, name: matchedProvince.name });
              axios.get(`https://provinces.open-api.vn/api/v2/p/${matchedProvince.code}?depth=2`)
                .then(res => {
                  setWards(res.data.wards || []);
                  const matchedWard = (res.data.wards || []).find(w => w.name === wardName);
                  if (matchedWard) {
                    setSelectedWard({ code: matchedWard.code, name: matchedWard.name });
                  }
                }).catch(err => console.error(err));
            }
          }
        }
      } else {
        // Reset if adding new
        setNewRoom({
          roomNumber: '', houseNumber: '', price: '', description: '', area: '', address: '',
          roomType: 'SINGLE', numFloors: '', numBedrooms: '', numBathrooms: '',
          maxOccupants: 1, electricityPrice: '', waterPrice: '', internetPrice: '', parkingPrice: '', servicePrice: '',
          hasElevator: false, hasWashingMachine: false, hasFridge: false, hasKitchen: false, hasHeater: false
        });
        setSelectedProvince({ code: '', name: '' });
        setSelectedWard({ code: '', name: '' });
        setWards([]);
      }
      setImageFiles([]);
      setImagePreviews([]);
    }
  }, [showModal, roomToEdit, provinces]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageFiles.length + files.length > 15) return alert('Tối đa 15 ảnh!');
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (i) => {
    setImageFiles(p => p.filter((_, idx) => idx !== i));
    setImagePreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();

    if (!roomToEdit && (!selectedProvince.code || !selectedWard.code)) {
      return alert("Vui lòng nhập & chọn Thành phố/Tỉnh và Phường/Xã hợp lệ từ danh sách gợi ý!");
    }

    const formData = new FormData();
    
    Object.keys(newRoom).forEach(key => {
      if (key !== 'address') {
        formData.append(key, newRoom[key]);
      }
    });
    
    if (selectedWard.name && selectedProvince.name) {
      formData.append('address', `${selectedWard.name}, ${selectedProvince.name}`);
    } else {
      formData.append('address', newRoom.address || ''); 
    }

    imageFiles.forEach(file => formData.append('images', file));
    
    try {
      if (roomToEdit) {
        await roomApi.updateRoom(roomToEdit.id, formData);
        alert('Cập nhật phòng thành công!'); 
      } else {
        await roomApi.createRoom(formData); 
        alert('Thêm phòng thành công!');
      }
      
      fetchLandlordRooms && fetchLandlordRooms();
      setShowModal(false);
      
      // Reset form
      setNewRoom({ 
        roomNumber: '', houseNumber: '', price: '', description: '', area: '', address: '', 
        roomType: 'SINGLE', numFloors: '', numBedrooms: '', numBathrooms: '',
        maxOccupants: 1, electricityPrice: '', waterPrice: '', internetPrice: '', parkingPrice: '', servicePrice: '', 
        hasElevator: false, hasWashingMachine: false, hasFridge: false, hasKitchen: false, hasHeater: false 
      });
      setImageFiles([]); setImagePreviews([]);
      setSelectedProvince({code: '', name: ''}); setSelectedWard({code: '', name: ''});
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi lưu phòng!');
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-on-surface/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-surface-container-lowest p-8 rounded-[2.5rem] border-t-8 border-primary shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 no-scrollbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2563eb', paddingBottom: '10px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#0f172a' }}>{roomToEdit ? `Sửa thông tin: ${newRoom.roomType === 'WHOLE_HOUSE' ? '' : 'Phòng '}${newRoom.roomNumber}` : 'Đăng tin mới'}</h2>
          <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-error/10 hover:text-error rounded-full transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleCreateRoom}>
          <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/30 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">image</span>
              Hình ảnh phòng (Tối đa 15 ảnh)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Nút bấm thêm ảnh custom */}
              <label className="aspect-square rounded-2xl border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:scale-110 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                  <span className="material-symbols-outlined font-black">add_a_photo</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Thêm ảnh</span>
              </label>

              {/* Danh sách ảnh đã chọn */}
              {imagePreviews.map((preview, index) => (
                <div key={index} className="aspect-square relative rounded-2xl overflow-hidden group shadow-sm border border-outline-variant/30">
                  <img src={preview} alt="preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button" 
                      onClick={() => removeImage(index)} 
                      className="w-10 h-10 rounded-full bg-error text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                      title="Xóa ảnh này"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-black text-white uppercase tracking-tighter">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
            
            {imageFiles.length === 0 && (
              <p className="text-[11px] font-bold text-on-surface-variant italic opacity-40 text-center">
                Vui lòng chọn ít nhất 1 ảnh rõ nét để tin đăng thu hút khách hàng hơn.
              </p>
            )}
          </div>

          <fieldset style={{ marginBottom: '20px', borderColor: '#e2e8f0', padding: '15px', borderRadius: '8px' }}>
            <legend style={{ fontWeight: 'bold', color: '#475569' }}>Thông tin cơ bản</legend>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Loại hình *</label>
                <select value={newRoom.roomType} onChange={e => setNewRoom({...newRoom, roomType: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <option value="SINGLE">Phòng trọ</option>
                  <option value="WHOLE_HOUSE">Nhà nguyên căn</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>{newRoom.roomType === 'WHOLE_HOUSE' ? 'Tên căn / Số nhà' : 'Số phòng'} *</label>
                <input type="text" placeholder={newRoom.roomType === 'WHOLE_HOUSE' ? "Ví dụ: Căn A1, Nhà số 5..." : "Số phòng"} required value={newRoom.roomNumber} onChange={e => setNewRoom({...newRoom, roomNumber: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Số người tối đa *</label>
                <input type="number" placeholder="Số người ở tối đa" required value={newRoom.maxOccupants} onChange={e => setNewRoom({...newRoom, maxOccupants: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Diện tích (m2) *</label>
                <input type="number" placeholder="Diện tích" required value={newRoom.area} onChange={e => setNewRoom({...newRoom, area: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
            </div>

            {newRoom.roomType === 'WHOLE_HOUSE' && (
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Số tầng</label>
                  <input type="number" placeholder="Ví dụ: 3" value={newRoom.numFloors} onChange={e => setNewRoom({...newRoom, numFloors: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Số phòng ngủ</label>
                  <input type="number" placeholder="Ví dụ: 4" value={newRoom.numBedrooms} onChange={e => setNewRoom({...newRoom, numBedrooms: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '5px' }}>Số nhà vệ sinh</label>
                  <input type="number" placeholder="Ví dụ: 2" value={newRoom.numBathrooms} onChange={e => setNewRoom({...newRoom, numBathrooms: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <input type="text" placeholder="Số nhà, ngõ, ngách, tên đường... *" required value={newRoom.houseNumber} onChange={e => setNewRoom({...newRoom, houseNumber: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b' }}>{roomToEdit ? `Khu vực cũ: ${newRoom.address} (Chọn lại bên dưới nếu muốn đổi)` : 'Chọn khu vực:'}</p>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="province-dropdown-container" style={{ flex: 1, position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>Tỉnh/Thành phố (*)</label>
                  <div 
                    onClick={() => { setProvinceDropdownOpen(!provinceDropdownOpen); setWardDropdownOpen(false); setProvinceSearch(''); }}
                    style={{ 
                      width: '100%', padding: '10px 35px 10px 12px', border: `1px solid ${provinceDropdownOpen ? '#3b82f6' : '#e2e8f0'}`, 
                      borderRadius: '6px', boxSizing: 'border-box', cursor: 'pointer', background: '#ffffff',
                      color: selectedProvince.name ? '#0f172a' : '#94a3b8', fontSize: '14px',
                      boxShadow: provinceDropdownOpen ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none', transition: 'all 0.2s'
                    }}
                  >
                    {selectedProvince.name || '-- Chọn Tỉnh/TP --'}
                    <span style={{ position: 'absolute', right: '12px', top: '38px', fontSize: '12px', color: '#64748b', transition: 'transform 0.2s', transform: provinceDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                  </div>
                  {provinceDropdownOpen && (
                    <div style={{ 
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                      background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)', maxHeight: '260px', overflow: 'hidden',
                      animation: 'fadeIn 0.15s ease-out'
                    }}>
                      <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#ffffff', zIndex: 1 }}>
                        <input 
                          type="text" autoFocus
                          placeholder="Nhập từ khóa để tìm kiếm" 
                          value={provinceSearch} 
                          onChange={(e) => setProvinceSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }}
                        />
                      </div>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <div 
                          onClick={() => { setSelectedProvince({ code: '', name: '' }); setSelectedWard({ code: '', name: '' }); setWards([]); setProvinceDropdownOpen(false); }}
                          style={{ padding: '10px 14px', cursor: 'pointer', color: '#94a3b8', fontSize: '13px', borderBottom: '1px solid #f8fafc' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          -- Chọn Tỉnh/TP --
                        </div>
                        {provinces.filter(p => p.name.toLowerCase().includes(provinceSearch.toLowerCase())).map(p => (
                          <div 
                            key={p.code}
                            onClick={async () => {
                              setSelectedProvince({ code: p.code, name: p.name });
                              setSelectedWard({ code: '', name: '' }); setWards([]);
                              setProvinceDropdownOpen(false); setProvinceSearch('');
                              try {
                                const res = await axios.get(`https://provinces.open-api.vn/api/v2/p/${p.code}?depth=2`);
                                setWards(res.data.wards || []);
                              } catch (error) { console.error("Lỗi lấy danh sách phường/xã:", error); }
                            }}
                            style={{ 
                              padding: '10px 14px', cursor: 'pointer', fontSize: '13px', color: '#1e293b',
                              background: selectedProvince.code === p.code ? '#dbeafe' : 'transparent',
                              fontWeight: selectedProvince.code === p.code ? '600' : '400',
                              borderBottom: '1px solid #f8fafc'
                            }}
                            onMouseEnter={(e) => { if (selectedProvince.code !== p.code) e.currentTarget.style.background = '#f1f5f9'; }}
                            onMouseLeave={(e) => { if (selectedProvince.code !== p.code) e.currentTarget.style.background = 'transparent'; }}
                          >
                            {p.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="ward-dropdown-container" style={{ flex: 1, position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>Phường/Xã (*)</label>
                  <div 
                    onClick={() => { if (selectedProvince.code) { setWardDropdownOpen(!wardDropdownOpen); setProvinceDropdownOpen(false); setWardSearch(''); } }}
                    style={{ 
                      width: '100%', padding: '10px 35px 10px 12px', border: `1px solid ${wardDropdownOpen ? '#3b82f6' : '#e2e8f0'}`, 
                      borderRadius: '6px', boxSizing: 'border-box', cursor: selectedProvince.code ? 'pointer' : 'not-allowed', 
                      background: selectedProvince.code ? '#ffffff' : '#f8fafc',
                      color: selectedWard.name ? '#0f172a' : '#94a3b8', fontSize: '14px',
                      opacity: selectedProvince.code ? 1 : 0.6,
                      boxShadow: wardDropdownOpen ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none', transition: 'all 0.2s'
                    }}
                  >
                    {selectedWard.name || '-- Chọn Phường/Xã --'}
                    <span style={{ position: 'absolute', right: '12px', top: '38px', fontSize: '12px', color: '#64748b', transition: 'transform 0.2s', transform: wardDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                  </div>
                  {wardDropdownOpen && selectedProvince.code && (
                    <div style={{ 
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                      background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)', maxHeight: '260px', overflow: 'hidden',
                      animation: 'fadeIn 0.15s ease-out'
                    }}>
                      <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#ffffff', zIndex: 1 }}>
                        <input 
                          type="text" autoFocus
                          placeholder="Nhập từ khóa để tìm kiếm" 
                          value={wardSearch} 
                          onChange={(e) => setWardSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }}
                        />
                      </div>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <div 
                          onClick={() => { setSelectedWard({ code: '', name: '' }); setWardDropdownOpen(false); }}
                          style={{ padding: '10px 14px', cursor: 'pointer', color: '#94a3b8', fontSize: '13px', borderBottom: '1px solid #f8fafc' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          -- Chọn Phường/Xã --
                        </div>
                        {wards.filter(w => w.name.toLowerCase().includes(wardSearch.toLowerCase())).map(w => (
                          <div 
                            key={w.code}
                            onClick={() => {
                              setSelectedWard({ code: w.code, name: w.name });
                              setWardDropdownOpen(false); setWardSearch('');
                            }}
                            style={{ 
                              padding: '10px 14px', cursor: 'pointer', fontSize: '13px', color: '#1e293b',
                              background: selectedWard.code === w.code ? '#dbeafe' : 'transparent',
                              fontWeight: selectedWard.code === w.code ? '600' : '400',
                              borderBottom: '1px solid #f8fafc'
                            }}
                            onMouseEnter={(e) => { if (selectedWard.code !== w.code) e.currentTarget.style.background = '#f1f5f9'; }}
                            onMouseLeave={(e) => { if (selectedWard.code !== w.code) e.currentTarget.style.background = 'transparent'; }}
                          >
                            {w.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset style={{ marginBottom: '20px', borderColor: '#e2e8f0', padding: '15px', borderRadius: '8px' }}>
            <legend style={{ fontWeight: 'bold', color: '#475569' }}>Giá thuê & Dịch vụ</legend>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input type="number" placeholder="Giá thuê/tháng *" required value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              <input type="number" placeholder="Giá điện/ký" value={newRoom.electricityPrice} onChange={e => setNewRoom({...newRoom, electricityPrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              <input type="number" placeholder="Giá nước/khối" value={newRoom.waterPrice} onChange={e => setNewRoom({...newRoom, waterPrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              <input type="number" placeholder="Giá mạng/tháng" value={newRoom.internetPrice} onChange={e => setNewRoom({...newRoom, internetPrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              <input type="number" placeholder="Giá gửi xe/tháng/xe" value={newRoom.parkingPrice} onChange={e => setNewRoom({...newRoom, parkingPrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              <input type="number" placeholder="Phí vệ sinh, dịch vụ..." value={newRoom.servicePrice} onChange={e => setNewRoom({...newRoom, servicePrice: e.target.value})} style={{ flex: '1 1 30%', minWidth: '150px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
            </div>
          </fieldset>

          <fieldset style={{ marginBottom: '20px', borderColor: '#e2e8f0', padding: '15px', borderRadius: '8px' }}>
            <legend style={{ fontWeight: 'bold', color: '#475569' }}>Tiện ích</legend>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', color: '#0f172a' }}>
              <label><input type="checkbox" checked={newRoom.hasElevator} onChange={e => setNewRoom({...newRoom, hasElevator: e.target.checked})} /> Thang máy</label>
              <label><input type="checkbox" checked={newRoom.hasWashingMachine} onChange={e => setNewRoom({...newRoom, hasWashingMachine: e.target.checked})} /> Máy giặt</label>
              <label><input type="checkbox" checked={newRoom.hasFridge} onChange={e => setNewRoom({...newRoom, hasFridge: e.target.checked})} /> Tủ lạnh</label>
              <label><input type="checkbox" checked={newRoom.hasKitchen} onChange={e => setNewRoom({...newRoom, hasKitchen: e.target.checked})} /> Bếp nấu</label>
              <label><input type="checkbox" checked={newRoom.hasHeater} onChange={e => setNewRoom({...newRoom, hasHeater: e.target.checked})} /> Nóng lạnh</label>
            </div>
            <textarea placeholder="Mô tả chi tiết phòng..." value={newRoom.description} onChange={e => setNewRoom({...newRoom, description: e.target.value})} style={{ width: '100%', height: '80px', padding: '10px', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
          </fieldset>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '15px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              HỦY BỎ
            </button>
            <button type="submit" style={{ flex: 1, padding: '15px', background: roomToEdit ? '#10b981' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              {roomToEdit ? 'LƯU THAY ĐỔI' : 'ĐĂNG TIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomFormModal;
