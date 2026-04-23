import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';

const IncidentManagement = ({ user, rooms, contracts = [], onRepairCostUpdated }) => {
  const [incidents, setIncidents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [viewCostModal, setViewCostModal] = useState(null);

  // Form Data (Tenant)
  const [formData, setFormData] = useState({ roomCode: '', title: '', description: '' });
  const [files, setFiles] = useState([]);

  // Form Reply (Landlord)
  const [replyData, setReplyData] = useState({ status: '', landlordReply: '' });
  
  // Filter
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Chat
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef(null);

  // Chi phí phát sinh (Landlord)
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairIncident, setRepairIncident] = useState(null);
  const [repairData, setRepairData] = useState({ repairDescription: '', repairCost: '' });
  const [savingRepair, setSavingRepair] = useState(false);

  const fetchIncidents = async () => {
    try {
      const res = await axiosClient.get('/incidents');
      setIncidents(res.incidents);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchMessages = async (incidentId) => {
    setLoadingMessages(true);
    try {
      const res = await axiosClient.get(`/incidents/${incidentId}/messages`);
      setMessages(res.messages || []);
    } catch (e) {
      console.error(e);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roomCode) return alert("Vui lòng nhập mã phòng!");
    
    const data = new FormData();
    data.append('roomCode', formData.roomCode);
    data.append('title', formData.title);
    data.append('description', formData.description);
    files.forEach(f => data.append('images', f));

    try {
      await axiosClient.post('/incidents', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Đã báo cáo sự cố thành công!');
      setShowCreateModal(false);
      setFormData({ roomCode: '', title: '', description: '' });
      setFiles([]);
      fetchIncidents();
    } catch (e) {
      alert(e.response?.data?.message || 'Có lỗi khi hệ thống xử lý thao tác này!');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.put(`/incidents/${selectedIncident.id}`, replyData);
      alert('Đã phản hồi/cập nhật sự cố!');
      setShowDetailModal(false);
      fetchIncidents();
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi cập nhật!');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || sendingMessage) return;
    setSendingMessage(true);
    try {
      const res = await axiosClient.post(`/incidents/${selectedIncident.id}/messages`, { message: chatInput.trim() });
      setMessages(prev => [...prev, res.data]);
      setChatInput('');
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi gửi tin nhắn!');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openDetailModal = (inc) => {
    setSelectedIncident(inc);
    setReplyData({ status: inc.status, landlordReply: inc.landlordReply || '' });
    setMessages([]);
    setChatInput('');
    setShowDetailModal(true);
    fetchMessages(inc.id);
  };

  const openRepairModal = (inc) => {
    setRepairIncident(inc);
    setRepairData({
      repairDescription: inc.repairDescription || '',
      repairCost: inc.repairCost || ''
    });
    setShowRepairModal(true);
  };

  const handleSaveRepairCost = async (e) => {
    e.preventDefault();
    if (!repairData.repairCost || Number(repairData.repairCost) < 0) {
      return alert('Vui lòng nhập chi phí hợp lệ (≥ 0)!');
    }
    setSavingRepair(true);
    try {
      await axiosClient.put(`/incidents/${repairIncident.id}/repair-cost`, {
        repairDescription: repairData.repairDescription,
        repairCost: Number(repairData.repairCost)
      });
      alert('Đã lưu chi phí phát sinh thành công!');
      setShowRepairModal(false);
      fetchIncidents();
      if (onRepairCostUpdated) {
        onRepairCostUpdated();
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi khi lưu chi phí!');
    } finally {
      setSavingRepair(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': 
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-[12px]">
            <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
            Chờ xử lý
          </span>
        );
      case 'In Progress': 
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-[12px]">
            <span className="w-2 h-2 rounded-full bg-tertiary mr-2"></span>
            Đang xử lý
          </span>
        );
      case 'Resolved': 
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-[12px]">
            <span className="w-2 h-2 rounded-full bg-secondary mr-2"></span>
            Đã giải quyết
          </span>
        );
      case 'Rejected': 
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-[12px]">
            <span className="w-2 h-2 rounded-full bg-outline mr-2"></span>
            Từ chối
          </span>
        );
      default: return null;
    }
  };

  let displayedIncidents = incidents;
  if (statusFilter !== 'ALL') {
    displayedIncidents = displayedIncidents.filter(i => i.status === statusFilter);
  }
  if (searchTerm.trim()) {
    const s = searchTerm.toLowerCase();
    displayedIncidents = displayedIncidents.filter(i => 
      i.title.toLowerCase().includes(s) || 
      i.description.toLowerCase().includes(s) ||
      i.room?.roomNumber?.toString().includes(s)
    );
  }

  return (
    <div className="p-0">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 mt-4 gap-4">
        <div>
          <h2 className="font-display-xl text-3xl font-bold text-on-surface">Sự cố & Hỗ trợ</h2>
          <p className="font-body-md text-on-surface-variant mt-1">Quản lý và theo dõi các yêu cầu sửa chữa và hỗ trợ của bạn.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant text-[20px]">filter_list</span>
            <input 
              className="pl-10 pr-4 py-2.5 rounded-full border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm w-full md:w-64 transition-all shadow-sm" 
              placeholder="Lọc sự cố..." 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {user.role === 'TENANT' && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-primary text-on-primary rounded-xl px-6 py-2.5 font-label-md text-label-md hover:bg-surface-tint transition-colors shadow-lg shadow-primary/20 whitespace-nowrap flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Báo cáo sự cố mới
            </button>
          )}
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        {['ALL', 'Pending', 'In Progress', 'Resolved', 'Rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full font-label-md text-sm whitespace-nowrap transition-all ${
              statusFilter === status 
                ? 'bg-primary text-on-primary shadow-md' 
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {status === 'ALL' ? 'Tất cả' : 
             status === 'Pending' ? 'Chờ xử lý' : 
             status === 'In Progress' ? 'Đang xử lý' : 
             status === 'Resolved' ? 'Đã giải quyết' : 'Từ chối'}
          </button>
        ))}
      </div>

      {/* Data Table Card */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden border border-outline-variant/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low/50">
                <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Phòng</th>
                {user.role === 'LANDLORD' && <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Người gửi</th>}
                <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Tiêu đề</th>
                <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Ngày gửi</th>
                <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold">Trạng thái</th>
                {user.role === 'LANDLORD' && <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-center">Chi phí</th>}
                <th className="py-4 px-8 font-label-md text-on-surface-variant font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant/30">
              {displayedIncidents.length === 0 ? (
                <tr>
                  <td colSpan={user.role === 'LANDLORD' ? 7 : 5} className="text-center py-12 text-on-surface-variant font-body-md italic">
                    Không có báo cáo nào được tìm thấy.
                  </td>
                </tr>
              ) : displayedIncidents.map(inc => (
                <tr key={inc.id} className="hover:bg-surface-container-lowest/50 transition-colors group">
                  <td className="py-4 px-8">
                    <div className="font-bold text-on-surface">
                      {inc.room?.roomType === 'WHOLE_HOUSE' ? 'Nhà ' : 'Phòng '}{inc.room?.roomNumber}
                    </div>
                    <div className="text-[11px] text-on-surface-variant opacity-70">
                      {inc.room?.roomCode}
                    </div>
                  </td>
                  {user.role === 'LANDLORD' && (
                    <td className="py-4 px-8">
                      <div className="font-bold text-on-surface">{inc.tenant?.fullName}</div>
                      <div className="text-[12px] text-on-surface-variant">{inc.tenant?.phone}</div>
                    </td>
                  )}
                  <td className="py-4 px-8 font-medium max-w-xs truncate">{inc.title}</td>
                  <td className="py-4 px-8 text-on-surface-variant">{new Date(inc.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="py-4 px-8">
                    {getStatusBadge(inc.status)}
                  </td>
                  {user.role === 'LANDLORD' && (
                    <td className="py-4 px-8 text-center">
                      {inc.repairCost > 0 ? (
                        <button
                          onClick={() => setViewCostModal(inc)}
                          className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[12px] font-bold hover:bg-primary/20 transition-all"
                        >
                          Chi tiết phí
                        </button>
                      ) : (
                        <button
                          onClick={() => openRepairModal(inc)}
                          className="px-3 py-1 bg-tertiary/10 text-tertiary border border-tertiary/20 rounded-lg text-[12px] font-bold hover:bg-tertiary/20 transition-all"
                        >
                          Ghi chi phí
                        </button>
                      )}
                    </td>
                  )}
                  <td className="py-4 px-8 text-right">
                    <button 
                      onClick={() => openDetailModal(inc)}
                      className="text-primary font-label-md text-sm hover:bg-primary/5 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-primary/10"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low/30 flex justify-between items-center">
          <span className="font-body-sm text-on-surface-variant">Hiển thị {displayedIncidents.length} kết quả</span>
          <div className="flex space-x-1">
            <button className="p-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface disabled:opacity-30" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="p-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface disabled:opacity-30" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL TẠO SỰ CỐ (TENANT) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex justify-center items-center z-[100] animate-in fade-in duration-300 p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowCreateModal(false)} 
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">add_alert</span>
              Báo cáo sự cố mới
            </h3>
            
            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block font-bold text-on-surface-variant text-sm">Phòng gặp sự cố:</label>
                <select 
                  required 
                  value={formData.roomCode} 
                  onChange={e => setFormData({...formData, roomCode: e.target.value})} 
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                >
                  <option value="">-- Chọn phòng bạn đang thuê --</option>
                  {contracts
                    .filter(c => c.tenantId === user?.id && c.status === 'ACTIVE')
                    .map(c => c.room)
                    .filter(r => r)
                    .map(r => (
                      <option key={r.id} value={r.roomCode || r.roomNumber}>
                        {r.roomType === 'WHOLE_HOUSE' ? 'Nhà nguyên căn ' : 'Phòng '}{r.roomNumber} ({r.roomCode})
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block font-bold text-on-surface-variant text-sm">Tiêu đề:</label>
                <input 
                  type="text" 
                  maxLength="100" 
                  placeholder="VD: Điều hòa kêu to, Rỉ nước bồn cầu..." 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="block font-bold text-on-surface-variant text-sm">Mô tả chi tiết:</label>
                <textarea 
                  rows="4" 
                  placeholder="Mô tả hoàn cảnh, tình trạng hiện tại..." 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block font-bold text-on-surface-variant text-sm">Hình ảnh (Tối đa 5 ảnh):</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))} 
                    className="w-full p-4 bg-surface-container-low rounded-xl border border-dashed border-outline-variant group-hover:border-primary transition-all cursor-pointer" 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="flex-1 py-3.5 bg-surface-container text-on-surface-variant font-bold rounded-xl hover:bg-surface-container-high transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-3.5 bg-primary text-on-primary font-bold rounded-xl hover:shadow-lg shadow-primary/20 transition-all"
                >
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT & TRAO ĐỔI (CHI TIẾT) */}
      {showDetailModal && selectedIncident && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex justify-center items-center z-[100] animate-in fade-in duration-300 p-4">
          <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-3xl relative shadow-2xl animate-in zoom-in-95 duration-300 no-scrollbar">
            {/* Modal Header */}
            <div className="sticky top-0 bg-surface-container-lowest/80 backdrop-blur-md px-8 py-6 border-b border-outline-variant/30 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">info</span>
                Chi tiết báo cáo sự cố
              </h3>
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Details */}
                <div className="space-y-6">
                  <div className="bg-surface-container-low/50 rounded-2xl p-6 border border-outline-variant/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Tiêu đề</p>
                        <p className="font-bold text-on-surface">{selectedIncident.title}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Ngày gửi</p>
                        <p className="font-medium text-on-surface">{new Date(selectedIncident.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Phòng</p>
                        <p className="font-bold text-on-surface">{selectedIncident.room?.roomNumber} ({selectedIncident.room?.roomCode})</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Trạng thái</p>
                        <div>{getStatusBadge(selectedIncident.status)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-outline-variant/30">
                      <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Mô tả từ người thuê</p>
                      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 text-sm leading-relaxed text-on-surface">
                        {selectedIncident.description}
                      </div>
                    </div>

                    {selectedIncident.images && selectedIncident.images.length > 0 && (
                      <div className="mt-6">
                        <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Hình ảnh đính kèm</p>
                        <div className="flex gap-3 flex-wrap">
                          {selectedIncident.images.map((img, idx) => (
                            <a 
                              key={idx} 
                              href={`http://localhost:5000/uploads/${img}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="w-20 h-20 rounded-xl overflow-hidden border border-outline-variant/30 hover:scale-105 transition-all shadow-sm"
                            >
                              <img src={`http://localhost:5000/uploads/${img}`} alt="evidence" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Landlord Reply Section */}
                  {user.role === 'TENANT' && (
                    <div className="bg-primary-fixed/30 rounded-2xl p-6 border border-primary-fixed">
                      <h4 className="font-bold text-on-primary-fixed flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-[20px]">quick_reply</span>
                        Phản hồi từ Chủ nhà
                      </h4>
                      <div className="bg-surface-container-lowest/80 p-4 rounded-xl text-sm italic text-on-surface-variant min-h-[60px]">
                        {selectedIncident.landlordReply || 'Chủ nhà chưa có phản hồi cụ thể.'}
                      </div>
                    </div>
                  )}

                  {/* Landlord Action Form */}
                  {user.role === 'LANDLORD' && (
                    <form onSubmit={handleUpdateStatus} className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 space-y-4">
                      <h4 className="font-bold text-on-surface flex items-center gap-2 mb-2 text-sm">
                        <span className="material-symbols-outlined text-primary text-[20px]">edit_note</span>
                        Cập nhật trạng thái & Phản hồi
                      </h4>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-on-surface-variant uppercase">Tiến độ:</label>
                        <select 
                          value={replyData.status} 
                          onChange={e => setReplyData({...replyData, status: e.target.value})} 
                          className="w-full p-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none text-sm"
                        >
                          <option value="Pending">Chờ xử lý</option>
                          <option value="In Progress">Đang xử lý</option>
                          <option value="Resolved">Đã giải quyết</option>
                          <option value="Rejected">Từ chối</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-on-surface-variant uppercase">Lời nhắn:</label>
                        <textarea 
                          rows="3" 
                          placeholder="Chiều mai thợ sẽ qua..." 
                          required 
                          value={replyData.landlordReply} 
                          onChange={e => setReplyData({...replyData, landlordReply: e.target.value})} 
                          className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none text-sm resize-none"
                        />
                      </div>
                      <button type="submit" className="w-full py-3 bg-secondary text-on-secondary font-bold rounded-xl hover:shadow-md transition-all">
                        Cập nhật Sự cố
                      </button>
                    </form>
                  )}
                </div>

                {/* Right Side: Chat Exchange */}
                <div className="flex flex-col h-[600px] border border-outline-variant/30 rounded-2xl overflow-hidden bg-surface-container-lowest shadow-inner">
                  <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">forum</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">Trao đổi trực tiếp</p>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold opacity-60">Tin nhắn nội bộ</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-surface-container-lowest/30">
                    {loadingMessages ? (
                      <div className="flex justify-center pt-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center pt-20 opacity-40">
                        <span className="material-symbols-outlined text-4xl mb-2">chat_bubble_outline</span>
                        <p className="text-xs">Chưa có trao đổi nào.</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.senderId === user.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div className="flex items-center gap-2 mb-1 px-2">
                                <span className="text-[10px] font-bold text-on-surface-variant">{isMe ? 'Bạn' : msg.sender?.fullName}</span>
                                <span className="text-[10px] text-outline opacity-70">{new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                isMe ? 'bg-primary text-on-primary rounded-tr-none' : 'bg-surface-container-high text-on-surface rounded-tl-none'
                              }`}>
                                {msg.message}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-4 bg-surface-container-low border-t border-outline-variant/30 flex items-end gap-2">
                    <textarea 
                      rows="2" 
                      placeholder="Nhập tin nhắn..." 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      onKeyDown={handleChatKeyDown}
                      className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all resize-none no-scrollbar"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || sendingMessage}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        chatInput.trim() && !sendingMessage ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container-high text-on-surface-variant opacity-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GHI CHI PHÍ PHÁT SINH (CHỈ LANDLORD) */}
      {showRepairModal && repairIncident && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex justify-center items-center z-[100] animate-in fade-in duration-300 p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowRepairModal(false)} 
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="text-xl font-bold text-tertiary flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined">payments</span>
              Ghi Chi Phí Sửa Chữa
            </h3>
            
            <div className="bg-tertiary-fixed/30 p-4 rounded-2xl mb-6 border border-tertiary-fixed/50">
              <p className="text-xs font-bold text-on-tertiary-fixed uppercase mb-2">Thông tin sự cố</p>
              <p className="text-sm font-bold text-on-surface">{repairIncident.title}</p>
              <p className="text-xs text-on-surface-variant">{repairIncident.room?.roomNumber} ({repairIncident.room?.roomCode})</p>
            </div>

            <form onSubmit={handleSaveRepairCost} className="space-y-5">
              <div className="space-y-2">
                <label className="block font-bold text-on-surface-variant text-sm">Nội dung sửa chữa:</label>
                <textarea 
                  rows="3" 
                  placeholder="VD: Thay vòi sen, gọi thợ..." 
                  value={repairData.repairDescription} 
                  onChange={e => setRepairData({ ...repairData, repairDescription: e.target.value })} 
                  className="w-full p-3.5 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-tertiary outline-none transition-all resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block font-bold text-on-surface-variant text-sm">Số tiền (VNĐ):</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required 
                    value={repairData.repairCost} 
                    onChange={e => setRepairData({ ...repairData, repairCost: e.target.value })} 
                    className="w-full p-3.5 pl-4 rounded-xl border border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-tertiary outline-none text-lg font-bold text-tertiary" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant/50">đ</span>
                </div>
                {repairData.repairCost && (
                  <p className="text-[11px] text-tertiary font-bold px-2">
                    {Number(repairData.repairCost).toLocaleString('vi-VN')} đồng
                  </p>
                )}
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowRepairModal(false)} className="flex-1 py-3.5 bg-surface-container text-on-surface-variant font-bold rounded-xl">
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={savingRepair}
                  className="flex-[2] py-3.5 bg-tertiary text-on-tertiary font-bold rounded-xl shadow-lg shadow-tertiary/20"
                >
                  {savingRepair ? 'Đang lưu...' : 'Lưu chi phí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT CHI PHÍ (KHI ĐÃ GHI) */}
      {viewCostModal && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-3xl p-8 relative shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">receipt_long</span>
              Chi tiết chi phí
            </h3>
            <div className="space-y-6 text-center">
              <div className="bg-tertiary-fixed/20 py-8 rounded-2xl border border-tertiary-fixed/30">
                <p className="text-xs font-bold text-on-tertiary-fixed uppercase mb-1">Tổng cộng</p>
                <p className="text-3xl font-black text-tertiary">
                  {Number(viewCostModal.repairCost).toLocaleString('vi-VN')} <span className="text-sm font-normal">đ</span>
                </p>
              </div>
              <div className="text-left space-y-1">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase px-2">Nội dung</p>
                <div className="bg-surface-container-low p-4 rounded-xl text-sm italic text-on-surface min-h-[50px]">
                  {viewCostModal.repairDescription || 'Không có ghi chú.'}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewCostModal(null)} className="flex-1 py-3 bg-surface-container text-on-surface-variant font-bold rounded-xl">Đóng</button>
                {user.role === 'LANDLORD' && (
                  <button onClick={() => { setViewCostModal(null); openRepairModal(viewCostModal); }} className="flex-1 py-3 bg-tertiary text-on-tertiary font-bold rounded-xl">Sửa phí</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;
