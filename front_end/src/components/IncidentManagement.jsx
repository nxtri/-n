import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';

const IncidentManagement = ({ user, rooms, contracts = [], onRepairCostUpdated }) => {
  const [incidents, setIncidents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [viewCostModal, setViewCostModal] = useState(null); // Modal for viewing cost detail

  // Form Data (Tenant)
  const [formData, setFormData] = useState({ roomCode: '', title: '', description: '' });
  const [files, setFiles] = useState([]);

  // Form Reply (Landlord)
  const [replyData, setReplyData] = useState({ status: '', landlordReply: '' });
  
  // Filter
  const [statusFilter, setStatusFilter] = useState('ALL');

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
      case 'Pending': return <span style={{ background: '#dc3545', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>Chờ xử lý</span>;
      case 'In Progress': return <span style={{ background: '#ffc107', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>Đang xử lý</span>;
      case 'Resolved': return <span style={{ background: '#198754', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>Đã giải quyết</span>;
      case 'Rejected': return <span style={{ background: '#6c757d', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>Từ chối</span>;
      default: return null;
    }
  };

  let displayedIncidents = incidents;
  if (statusFilter !== 'ALL') {
    displayedIncidents = displayedIncidents.filter(i => i.status === statusFilter);
  }

  return (
    <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #0b5ed7', paddingBottom: '10px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Quản lý Sự cố & Hỗ trợ</h2>
        {user.role === 'TENANT' && (
          <button 
            onClick={() => setShowCreateModal(true)} 
            style={{ padding: '8px 15px', background: '#0b5ed7', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + Báo cáo sự cố mới
          </button>
        )}
      </div>

      {/* Lọc */}
      <div style={{ marginBottom: '15px' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="Pending">Chờ xử lý</option>
          <option value="In Progress">Đang xử lý</option>
          <option value="Resolved">Đã giải quyết</option>
          <option value="Rejected">Từ chối</option>
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Phòng</th>
            {user.role === 'LANDLORD' && <th style={{ padding: '12px', textAlign: 'left' }}>Người gửi</th>}
            <th style={{ padding: '12px', textAlign: 'left' }}>Tiêu đề</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Ngày gửi</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Trạng thái</th>
            {user.role === 'LANDLORD' && <th style={{ padding: '12px', textAlign: 'center' }}>Chi phí</th>}
            <th style={{ padding: '12px', textAlign: 'center' }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {displayedIncidents.length === 0 ? (
            <tr><td colSpan={user.role === 'LANDLORD' ? 7 : 5} style={{ textAlign: 'center', padding: '20px' }}>Không có báo cáo nào.</td></tr>
          ) : displayedIncidents.map(inc => (
            <tr key={inc.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{inc.room?.roomNumber} {inc.room?.roomCode ? `(${inc.room.roomCode})` : ''}</td>
              {user.role === 'LANDLORD' && <td style={{ padding: '12px' }}>{inc.tenant?.fullName}<br/><small>{inc.tenant?.phone}</small></td>}
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{inc.title}</td>
              <td style={{ padding: '12px' }}>{new Date(inc.createdAt).toLocaleDateString('vi-VN')}</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(inc.status)}</td>
              
              {/* CỘT CHI PHÍ - CHỈ LANDLORD */}
              {user.role === 'LANDLORD' && (
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {inc.repairCost > 0 ? (
                    <div>
                      <button
                        onClick={() => setViewCostModal(inc)}
                        style={{ padding: '6px 12px', background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        📄 Xem chi tiết
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openRepairModal(inc)}
                      style={{ padding: '5px 10px', background: '#e65c00', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                    >
                      🔧 Ghi chi phí
                    </button>
                  )}
                </td>
              )}

              <td style={{ padding: '12px', textAlign: 'center' }}>
                <button 
                  onClick={() => openDetailModal(inc)}
                  style={{ padding: '6px 12px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Xem chi tiết
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL TẠO SỰ CỐ (TENANT) */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', width: '500px', borderRadius: '8px', padding: '20px', position: 'relative' }}>
            <button onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: 15, right: 15, border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            <h3 style={{ marginTop: 0, color: '#dc3545', borderBottom: '1px solid #eee', paddingBottom: 10 }}>Báo cáo Sự cố mới</h3>
            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 5, color: '#333' }}>Phòng gặp sự cố:</label>
                <select 
                  required 
                  value={formData.roomCode} 
                  onChange={e => setFormData({...formData, roomCode: e.target.value})} 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: '#fff', color: '#000' }} 
                >
                  <option value="">-- Chọn phòng bạn đang thuê --</option>
                  {contracts
                    .filter(c => c.tenantId === user?.id && c.status === 'ACTIVE')
                    .map(c => c.room)
                    .filter(r => r)
                    .map(r => (
                      <option key={r.id} value={r.roomCode || r.roomNumber}>
                        {/^ph[oò]ng/i.test(String(r.roomNumber).trim()) ? `${String(r.roomNumber).charAt(0).toUpperCase()}${String(r.roomNumber).slice(1)}` : `Phòng ${r.roomNumber}`} {r.roomCode ? `(${r.roomCode})` : ''}
                      </option>
                    ))}
                </select>
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 5, color: '#333' }}>Tiêu đề tóm tắt:</label>
                <input type="text" maxLength="100" placeholder="VD: Điều hòa kêu to, Rỉ nước bồn cầu..." required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: '#fff', color: '#000' }} />
              </div>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 5, color: '#333' }}>Mô tả chi tiết:</label>
                <textarea rows="4" placeholder="Mô tả hoàn cảnh, tình trạng hiện tại..." required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: '#fff', color: '#000' }}></textarea>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 5, color: '#333' }}>Hình ảnh đính kèm (Tối đa 5 ảnh):</label>
                <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))} style={{ width: '100%', padding: '8px', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', color: '#000' }} />
                <small style={{ color: '#888' }}>Chủ nhà sẽ nhận diện nguyên nhân dễ hơn nếu có ảnh.</small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '10px 20px', background: '#e9ecef', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' }}>Hủy bỏ</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Gửi Sự cố</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GHI CHI PHÍ PHÁT SINH (CHỈ LANDLORD) */}
      {showRepairModal && repairIncident && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', width: '480px', borderRadius: '10px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setShowRepairModal(false)} style={{ position: 'absolute', top: 15, right: 15, border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            
            <h3 style={{ marginTop: 0, color: '#e65c00', borderBottom: '2px solid #fde8d0', paddingBottom: 10 }}>
              🔧 Ghi Chi Phí Phát Sinh
            </h3>
            
            <div style={{ padding: '10px 14px', background: '#f8f9fa', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', color: '#555' }}>
              <strong>Sự cố:</strong> {repairIncident.title}<br/>
              <strong>Phòng:</strong> {repairIncident.room?.roomNumber} {repairIncident.room?.roomCode ? `(${repairIncident.room.roomCode})` : ''}<br/>
              <strong>Ngày báo cáo:</strong> {new Date(repairIncident.createdAt).toLocaleDateString('vi-VN')}
            </div>

            <form onSubmit={handleSaveRepairCost}>
              <div style={{ marginBottom: 15 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 5, color: '#333' }}>
                  Nội dung sửa chữa:
                </label>
                <textarea
                  rows="4"
                  placeholder="VD: Thay dàn lạnh điều hòa, gọi thợ điện vào kiểm tra và sửa chữa..."
                  value={repairData.repairDescription}
                  onChange={e => setRepairData({ ...repairData, repairDescription: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px', color: '#000', backgroundColor: '#fff', resize: 'vertical' }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 5, color: '#333' }}>
                  Chi phí phát sinh (VNĐ): <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  placeholder="VD: 500000"
                  value={repairData.repairCost}
                  onChange={e => setRepairData({ ...repairData, repairCost: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px', fontWeight: 'bold', color: '#e65c00', backgroundColor: '#fff' }}
                />
                {repairData.repairCost && (
                  <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                    = {Number(repairData.repairCost).toLocaleString('vi-VN')} đồng
                  </small>
                )}
              </div>
              <div style={{ textAlign: 'right', gap: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowRepairModal(false)} style={{ padding: '10px 20px', background: '#e9ecef', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Hủy
                </button>
                <button type="submit" disabled={savingRepair} style={{ padding: '10px 20px', background: savingRepair ? '#ccc' : '#e65c00', color: '#fff', border: 'none', borderRadius: '6px', cursor: savingRepair ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                  {savingRepair ? 'Đang lưu...' : '💾 Lưu Chi Phí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VIEW COST DETAIL */}
      {viewCostModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000}}>
          <div style={{ background: '#fff', width: '450px', padding: '25px', borderRadius: '8px', position: 'relative' }}>
            <button onClick={() => setViewCostModal(null)} style={{ position: 'absolute', top: 15, right: 15, background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>✖</button>
            <h3 style={{ margin: '0 0 15px 0', color: '#e65c00', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>🔧 Chi tiết chi phí sửa chữa</h3>
            <div style={{ background: '#fdf3e2', padding: '15px', borderRadius: '6px', border: '1px solid #fbe0b3', marginBottom: '20px', textAlign: 'left' }}>
              {/* <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>ID Sự cố: <strong>{viewCostModal.id}</strong></p> */}
              <p style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>Tổng chi phí: <strong style={{ color: '#e65c00', fontSize: '22px' }}>{Number(viewCostModal.repairCost).toLocaleString('vi-VN')} đ</strong></p>
              {viewCostModal.repairDescription && (
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#333' }}>Nội dung sửa chữa:</p>
                  <p style={{ margin: 0, background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #eee', color: '#333', whiteSpace: 'pre-wrap' }}>{viewCostModal.repairDescription}</p>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setViewCostModal(null)} style={{ padding: '8px 15px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Đóng</button>
              <button 
                onClick={() => { setViewCostModal(null); openRepairModal(viewCostModal); }} 
                style={{ padding: '8px 15px', background: '#e65c00', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✎ Sửa chi phí
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT & PHẢN HỒI (CẢ 2 ROLE DÙNG CHUNG) */}
      {showDetailModal && selectedIncident && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', width: '680px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '10px', padding: '24px', position: 'relative', textAlign: 'left', color: '#000' }}>
            <button onClick={() => setShowDetailModal(false)} style={{ position: 'absolute', top: 15, right: 15, border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            <h3 style={{ marginTop: 0, color: '#0b5ed7', borderBottom: '1px solid #eee', paddingBottom: 10, textAlign: 'center' }}>Chi tiết báo cáo sự cố</h3>
            
            <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '6px', marginBottom: '16px' }}>
              <p><strong>Tiêu đề:</strong> {selectedIncident.title}</p>
              <p><strong>Ngày gửi báo cáo:</strong> {new Date(selectedIncident.createdAt).toLocaleString('vi-VN')}</p>
              <p><strong>Phòng:</strong> {selectedIncident.room?.roomNumber} {selectedIncident.room?.roomCode ? `(${selectedIncident.room?.roomCode})` : ''}</p>
              <p><strong>Mô tả của người thuê:</strong></p>
              <p style={{ whiteSpace: 'pre-wrap', color: '#555', background: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                {selectedIncident.description}
              </p>
              
              {selectedIncident.images && selectedIncident.images.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <strong>Hình ảnh đính kèm:</strong>
                  <div style={{ display: 'flex', gap: '10px', marginTop: 10, flexWrap: 'wrap' }}>
                    {selectedIncident.images.map((img, idx) => (
                      <a key={idx} href={`http://localhost:5000/uploads/${img}`} target="_blank" rel="noopener noreferrer">
                        <img src={`http://localhost:5000/uploads/${img}`} alt="suco" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chi phí phát sinh (chỉ hiển thị cho Chủ nhà) */}
            {user.role === 'LANDLORD' && selectedIncident.repairCost > 0 && (
              <div style={{ padding: '12px 16px', background: '#fff3e0', border: '1px solid #ffcc80', borderRadius: '6px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#e65c00' }}>Chi Phí Phát Sinh</h4>
                <p style={{ margin: '4px 0' }}><strong>Chi phí:</strong> <span style={{ color: '#e65c00', fontWeight: 'bold', fontSize: '16px' }}>{Number(selectedIncident.repairCost).toLocaleString('vi-VN')} đ</span></p>
                {selectedIncident.repairDescription && (
                  <p style={{ margin: '4px 0' }}><strong>Nội dung:</strong> {selectedIncident.repairDescription}</p>
                )}
              </div>
            )}

            {/* Phần chỉ dành cho Landlord: cập nhật trạng thái */}
            {user.role === 'LANDLORD' && (
              <form onSubmit={handleUpdateStatus} style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Phản hồi & Cập nhật trạng thái</h4>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 5 }}>Trạng thái quá trình xử lý:</label>
                  <select value={replyData.status} onChange={e => setReplyData({...replyData, status: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="Pending">Chờ xử lý (Mới nhận báo cáo)</option>
                    <option value="In Progress">Đang xử lý (Đã gọi thợ / Đang sửa)</option>
                    <option value="Resolved">Đã giải quyết (Đã sửa xong)</option>
                    <option value="Rejected">Từ chối (Lý do không hợp lý)</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 5 }}>Lời nhắn / Ghi chú phản hồi:</label>
                  <textarea rows="3" placeholder="Ví dụ: Chiều mai thợ sẽ qua kiểm tra..." required value={replyData.landlordReply} onChange={e => setReplyData({...replyData, landlordReply: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}></textarea>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button type="submit" style={{ padding: '8px 18px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Cập nhật Sự cố</button>
                </div>
              </form>
            )}

            {/* Phần chỉ dành cho Tenant: Xem phản hồi */}
            {user.role === 'TENANT' && (
              <div style={{ padding: '14px', background: '#e6f0fa', borderRadius: '6px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#0b5ed7' }}>Phản hồi từ Chủ nhà</h4>
                <p><strong>Trạng thái:</strong> {getStatusBadge(selectedIncident.status)}</p>
                <p style={{ margin: '6px 0 4px 0' }}><strong>Lời nhắn:</strong></p>
                <p style={{ whiteSpace: 'pre-wrap', color: '#333', fontStyle: 'italic', background: '#fff', padding: '10px', borderRadius: '4px', margin: 0 }}>
                  {selectedIncident.landlordReply || 'Chủ nhà chưa phản hồi.'}
                </p>
              </div>
            )}

            {/* ===== KHUNG CHAT TRAO ĐỔI ===== */}
            <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #0b5ed7, #0d6efd)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>💬</span>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px' }}>Trao đổi trực tiếp</span>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', marginLeft: 4 }}>
                  {user.role === 'TENANT' ? 'với Chủ nhà' : 'với Khách thuê'}
                </span>
              </div>

              <div style={{ height: '220px', overflowY: 'auto', padding: '12px', background: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', color: '#888', paddingTop: '60px' }}>Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#aaa', paddingTop: '60px', fontSize: '14px' }}>
                    Chưa có tin nhắn nào. Hãy bắt đầu trao đổi!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user.id;
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '72%' }}>
                          <div style={{ fontSize: '11px', color: '#888', marginBottom: '3px', textAlign: isMe ? 'right' : 'left' }}>
                            {isMe ? 'Bạn' : msg.sender?.fullName}
                            {' · '}
                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            {' '}
                            {new Date(msg.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                          <div style={{
                            padding: '9px 13px',
                            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isMe ? '#0b5ed7' : '#fff',
                            color: isMe ? '#fff' : '#333',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            border: isMe ? 'none' : '1px solid #e0e0e0'
                          }}>
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 12px', background: '#fff', borderTop: '1px solid #dee2e6' }}>
                <textarea
                  rows="2"
                  placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #ccc', borderRadius: '20px', resize: 'none', outline: 'none', fontSize: '14px', lineHeight: '1.4', boxSizing: 'border-box', fontFamily: 'inherit', color: '#000', backgroundColor: '#f8f9fa' }}
                  onFocus={e => e.target.style.borderColor = '#0b5ed7'}
                  onBlur={e => e.target.style.borderColor = '#ccc'}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || sendingMessage}
                  style={{ padding: '9px 18px', background: chatInput.trim() && !sendingMessage ? '#0b5ed7' : '#ccc', color: '#fff', border: 'none', borderRadius: '20px', cursor: chatInput.trim() && !sendingMessage ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}
                >
                  {sendingMessage ? '...' : '🚀 Gửi'}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowDetailModal(false)} style={{ padding: '10px 20px', background: '#e9ecef', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;
