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
      case 'Pending': return <span style={{ background: '#fef2f2', color: '#ef4444', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #fee2e2' }}>Chờ xử lý</span>;
      case 'In Progress': return <span style={{ background: '#fffbeb', color: '#f59e0b', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #fef3c7' }}>Đang xử lý</span>;
      case 'Resolved': return <span style={{ background: '#ecfdf5', color: '#10b981', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #d1fae5' }}>Đã giải quyết</span>;
      case 'Rejected': return <span style={{ background: '#f8fafc', color: '#64748b', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #e2e8f0' }}>Từ chối</span>;
      default: return null;
    }
  };

  let displayedIncidents = incidents;
  if (statusFilter !== 'ALL') {
    displayedIncidents = displayedIncidents.filter(i => i.status === statusFilter);
  }

  return (
    <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>🛠️</span> Quản lý Sự cố & Hỗ trợ
        </h2>
        {user.role === 'TENANT' && (
          <button 
            onClick={() => setShowCreateModal(true)} 
            style={{ padding: '10px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)' }}
            onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.background = '#2563eb'}
          >
            + Báo cáo sự cố mới
          </button>
        )}
      </div>

      {/* Lọc */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Bộ lọc:</span>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: '14px', outline: 'none' }}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="Pending">Chờ xử lý</option>
          <option value="In Progress">Đang xử lý</option>
          <option value="Resolved">Đã giải quyết</option>
          <option value="Rejected">Từ chối</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#ffffff' }}>
          <thead>
            <tr style={{ background: '#1e293b', color: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>Phòng</th>
              {user.role === 'LANDLORD' && <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>Người gửi</th>}
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>Tiêu đề</th>
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>Ngày gửi</th>
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>Trạng thái</th>
              {user.role === 'LANDLORD' && <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>Chi phí</th>}
              <th style={{ padding: '16px', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {displayedIncidents.length === 0 ? (
              <tr><td colSpan={user.role === 'LANDLORD' ? 7 : 5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Không có báo cáo nào.</td></tr>
            ) : displayedIncidents.map(inc => (
              <tr key={inc.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '16px', color: '#0f172a', fontWeight: 'bold' }}>{inc.room?.roomNumber} {inc.room?.roomCode ? `(${inc.room.roomCode})` : ''}</td>
                {user.role === 'LANDLORD' && (
                  <td style={{ padding: '16px' }}>
                    <div style={{ color: '#0f172a', fontWeight: 'bold' }}>{inc.tenant?.fullName}</div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>{inc.tenant?.email}</div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>SĐT: {inc.tenant?.phone}</div>
                  </td>
                )}
                <td style={{ padding: '16px', color: '#0f172a' }}>{inc.title}</td>
                <td style={{ padding: '16px', color: '#64748b' }}>{new Date(inc.createdAt).toLocaleDateString('vi-VN')}</td>
                <td style={{ padding: '16px', textAlign: 'center' }}>{getStatusBadge(inc.status)}</td>
                
                {/* CỘT CHI PHÍ - CHỈ LANDLORD */}
                {user.role === 'LANDLORD' && (
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {inc.repairCost > 0 ? (
                      <button
                        onClick={() => setViewCostModal(inc)}
                        style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        📄 Xem chi tiết
                      </button>
                    ) : (
                      <button
                        onClick={() => openRepairModal(inc)}
                        style={{ padding: '6px 12px', background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                      >
                      🔧 Ghi chi phí
                      </button>
                    )}
                  </td>
                )}

                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button 
                    onClick={() => openDetailModal(inc)}
                    style={{ padding: '8px 18px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: '0.2s' }}
                    onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
                    onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
                  >
                  Xem chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL TẠO SỰ CỐ (TENANT) */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', width: '550px', borderRadius: '16px', padding: '30px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <button onClick={() => setShowCreateModal(false)} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: '#f8fafc', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>✖</button>
            <h3 style={{ marginTop: 0, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: 15, fontSize: '20px', fontWeight: '700' }}>🚀 Báo cáo Sự cố mới</h3>
            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#475569', fontSize: '14px' }}>Phòng gặp sự cố:</label>
                <select 
                  required 
                  value={formData.roomCode} 
                  onChange={e => setFormData({...formData, roomCode: e.target.value})} 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', backgroundColor: '#f8fafc', color: '#0f172a', outline: 'none' }} 
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
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#475569', fontSize: '14px' }}>Tiêu đề tóm tắt:</label>
                <input type="text" maxLength="100" placeholder="VD: Điều hòa kêu to, Rỉ nước bồn cầu..." required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', backgroundColor: '#f8fafc', color: '#0f172a', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#475569', fontSize: '14px' }}>Mô tả chi tiết:</label>
                <textarea rows="4" placeholder="Mô tả hoàn cảnh, tình trạng hiện tại..." required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', backgroundColor: '#f8fafc', color: '#0f172a', outline: 'none', resize: 'vertical' }}></textarea>
              </div>
              <div style={{ marginBottom: 25 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#475569', fontSize: '14px' }}>Hình ảnh đính kèm (Tối đa 5 ảnh):</label>
                <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))} style={{ width: '100%', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', boxSizing: 'border-box', color: '#64748b' }} />
                <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '6px' }}>Chủ nhà sẽ nhận diện nguyên nhân dễ hơn nếu có ảnh minh họa thực tế.</p>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Hủy bỏ</button>
                <button type="submit" style={{ padding: '12px 24px', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(239,68,68,0.2)' }}>Gửi Sự cố</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GHI CHI PHÍ PHÁT SINH (CHỈ LANDLORD) */}
      {showRepairModal && repairIncident && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', width: '500px', borderRadius: '16px', padding: '30px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <button onClick={() => setShowRepairModal(false)} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: '#f8fafc', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>✖</button>
            
            <h3 style={{ marginTop: 0, color: '#f97316', borderBottom: '1px solid #f1f5f9', paddingBottom: 15, fontSize: '20px', fontWeight: '700' }}>
              🔧 Ghi Chi Phí Phát Sinh
            </h3>
            
            <div style={{ padding: '15px', background: '#fff7ed', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', border: '1px solid #ffedd5' }}>
              <p style={{ margin: '0 0 5px 0', color: '#9a3412' }}><strong>Sự cố:</strong> {repairIncident.title}</p>
              <p style={{ margin: '0 0 5px 0', color: '#9a3412' }}><strong>Phòng:</strong> {repairIncident.room?.roomNumber} {repairIncident.room?.roomCode ? `(${repairIncident.room.roomCode})` : ''}</p>
              <p style={{ margin: 0, color: '#9a3412' }}><strong>Ngày báo cáo:</strong> {new Date(repairIncident.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>

            <form onSubmit={handleSaveRepairCost}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#475569', fontSize: '14px' }}>
                  Nội dung sửa chữa:
                </label>
                <textarea
                  rows="4"
                  placeholder="VD: Thay dàn lạnh điều hòa, gọi thợ điện vào kiểm tra và sửa chữa..."
                  value={repairData.repairDescription}
                  onChange={e => setRepairData({ ...repairData, repairDescription: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', fontSize: '14px', color: '#0f172a', backgroundColor: '#f8fafc', resize: 'vertical', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: 25 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#475569', fontSize: '14px' }}>
                  Chi phí phát sinh (VNĐ): <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  placeholder="VD: 500000"
                  value={repairData.repairCost}
                  onChange={e => setRepairData({ ...repairData, repairCost: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', fontSize: '18px', fontWeight: 'bold', color: '#f97316', backgroundColor: '#f8fafc', outline: 'none' }}
                />
                {repairData.repairCost && (
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '8px', fontWeight: '500' }}>
                    = {Number(repairData.repairCost).toLocaleString('vi-VN')} đồng
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right', gap: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowRepairModal(false)} style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Hủy
                </button>
                <button type="submit" disabled={savingRepair} style={{ padding: '12px 24px', background: savingRepair ? '#cbd5e1' : '#f97316', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: savingRepair ? 'not-allowed' : 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(249,115,22,0.2)' }}>
                  {savingRepair ? '⏳ Đang lưu...' : '💾 Lưu Chi Phí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VIEW COST DETAIL */}
      {viewCostModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div style={{ background: '#ffffff', width: '500px', borderRadius: '16px', padding: '30px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <button onClick={() => setViewCostModal(null)} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: '#f8fafc', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>✖</button>
            <h3 style={{ marginTop: 0, color: '#f97316', borderBottom: '1px solid #f1f5f9', paddingBottom: 15, fontSize: '20px', fontWeight: '700' }}>🔧 Chi tiết chi phí sửa chữa</h3>
            <div style={{ background: '#fff7ed', padding: '20px', borderRadius: '12px', border: '1px solid #ffedd5', marginBottom: '25px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#9a3412', fontWeight: '500' }}>Tổng chi phí:</p>
              <p style={{ margin: '0 0 20px 0', color: '#f97316', fontSize: '28px', fontWeight: '800' }}>{Number(viewCostModal.repairCost).toLocaleString('vi-VN')} đ</p>
              
              {viewCostModal.repairDescription && (
                <div>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#9a3412', fontWeight: '500' }}>Nội dung sửa chữa:</p>
                  <p style={{ margin: 0, background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #ffedd5', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px' }}>{viewCostModal.repairDescription}</p>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setViewCostModal(null)} style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng</button>
              <button 
                onClick={() => { setViewCostModal(null); openRepairModal(viewCostModal); }} 
                style={{ padding: '12px 24px', background: '#f97316', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(249,115,22,0.2)' }}
              >
                ✎ Sửa chi phí
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT & PHẢN HỒI (CẢ 2 ROLE DÙNG CHUNG) */}
      {showDetailModal && selectedIncident && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', width: '750px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px', padding: '35px', position: 'relative', textAlign: 'left', color: '#0f172a', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <button onClick={() => setShowDetailModal(false)} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: '#f8fafc', width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>✖</button>
            <h3 style={{ marginTop: 0, color: '#2563eb', borderBottom: '1px solid #f1f5f9', paddingBottom: 15, textAlign: 'center', fontSize: '22px', fontWeight: '700' }}>📄 Chi tiết báo cáo sự cố</h3>
            
            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b' }}>Tiêu đề:</p>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#0f172a' }}>{selectedIncident.title}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b' }}>Ngày gửi:</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{new Date(selectedIncident.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b' }}>Phòng:</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{selectedIncident.room?.roomNumber} {selectedIncident.room?.roomCode ? `(${selectedIncident.room?.roomCode})` : ''}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#64748b' }}>Trạng thái hiện tại:</p>
                  {getStatusBadge(selectedIncident.status)}
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>Mô tả chi tiết từ người thuê:</p>
                <div style={{ whiteSpace: 'pre-wrap', color: '#475569', background: '#ffffff', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', lineHeight: '1.6', fontSize: '14px' }}>
                  {selectedIncident.description}
                </div>
              </div>
              
              {selectedIncident.images && selectedIncident.images.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Hình ảnh minh chứng:</p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {selectedIncident.images.map((img, idx) => (
                      <a key={idx} href={`http://localhost:5000/uploads/${img}`} target="_blank" rel="noopener noreferrer" style={{ transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <img src={`http://localhost:5000/uploads/${img}`} alt="suco" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chi phí phát sinh (chỉ hiển thị cho Chủ nhà) */}
            {user.role === 'LANDLORD' && selectedIncident.repairCost > 0 && (
              <div style={{ padding: '20px', background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '12px', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💰 Chi Phí Sửa Chữa Đã Ghi
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#9a3412' }}><strong>Số tiền:</strong> <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '20px' }}>{Number(selectedIncident.repairCost).toLocaleString('vi-VN')} đ</span></p>
                {selectedIncident.repairDescription && (
                  <p style={{ margin: 0, fontSize: '14px', color: '#9a3412', opacity: 0.8 }}><strong>Ghi chú:</strong> {selectedIncident.repairDescription}</p>
                )}
              </div>
            )}

            {/* Phần chỉ dành cho Landlord: cập nhật trạng thái */}
            {user.role === 'LANDLORD' && (
              <form onSubmit={handleUpdateStatus} style={{ marginBottom: '25px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 18px 0', color: '#0f172a', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✍️ Phản hồi & Cập nhật trạng thái
                </h4>
                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#475569', fontSize: '14px' }}>Trạng thái tiến độ:</label>
                  <select value={replyData.status} onChange={e => setReplyData({...replyData, status: e.target.value})} style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#0f172a', outline: 'none' }}>
                    <option value="Pending">Chờ xử lý (Mới nhận báo cáo)</option>
                    <option value="In Progress">Đang xử lý (Đã gọi thợ / Đang sửa)</option>
                    <option value="Resolved">Đã giải quyết (Đã sửa xong)</option>
                    <option value="Rejected">Từ chối (Lý do không hợp lý)</option>
                  </select>
                </div>
                <div style={{ marginBottom: 15 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#475569', fontSize: '14px' }}>Lời nhắn gửi khách thuê:</label>
                  <textarea rows="3" placeholder="Ví dụ: Chiều mai thợ sẽ qua kiểm tra..." required value={replyData.landlordReply} onChange={e => setReplyData({...replyData, landlordReply: e.target.value})} style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', background: '#ffffff', outline: 'none', resize: 'vertical', fontSize: '14px' }}></textarea>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button type="submit" style={{ padding: '10px 25px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)' }}>Cập nhật Sự cố</button>
                </div>
              </form>
            )}

            {/* Phần chỉ dành cho Tenant: Xem phản hồi */}
            {user.role === 'TENANT' && (
              <div style={{ padding: '20px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📩 Phản hồi từ Chủ nhà
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Trạng thái:</span>
                  {getStatusBadge(selectedIncident.status)}
                </div>
                <p style={{ margin: '12px 0 8px 0', fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Lời nhắn của chủ nhà:</p>
                <div style={{ whiteSpace: 'pre-wrap', color: '#1e3a8a', fontStyle: 'italic', background: 'rgba(255,255,255,0.6)', padding: '12px 15px', borderRadius: '8px', margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                  {selectedIncident.landlordReply || 'Chủ nhà chưa có phản hồi cụ thể.'}
                </div>
              </div>
            )}

            {/* ===== KHUNG CHAT TRAO ĐỔI ===== */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#f8fafc', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '18px' }}>💬</span>
                <span style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '15px' }}>Trao đổi trực tiếp</span>
                <span style={{ color: '#64748b', fontSize: '12px', marginLeft: 4 }}>
                  {user.role === 'TENANT' ? 'với Chủ nhà' : 'với Khách thuê'}
                </span>
              </div>

              <div style={{ height: '280px', overflowY: 'auto', padding: '20px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '80px', fontSize: '14px' }}>Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '80px', fontSize: '13px' }}>
                    Chưa có tin nhắn nào. Đặt câu hỏi để trao đổi thêm chi tiết!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user.id;
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '80%' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textAlign: isMe ? 'right' : 'left', display: 'flex', gap: '5px', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                            <span style={{ fontWeight: 'bold' }}>{isMe ? 'Bạn' : msg.sender?.fullName}</span>
                            <span>·</span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div style={{
                            padding: '10px 16px',
                            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isMe ? '#2563eb' : '#f1f5f9',
                            color: isMe ? '#ffffff' : '#0f172a',
                            boxShadow: isMe ? '0 4px 12px rgba(37,99,235,0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            border: isMe ? 'none' : '1px solid #e2e8f0'
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

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', padding: '15px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <textarea
                  rows="2"
                  placeholder="Nhập nội dung trao đổi... (Enter để gửi)"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  style={{ flex: 1, padding: '12px 18px', border: '1px solid #e2e8f0', borderRadius: '12px', resize: 'none', outline: 'none', fontSize: '14px', lineHeight: '1.5', boxSizing: 'border-box', fontFamily: 'inherit', color: '#0f172a', backgroundColor: '#ffffff', transition: '0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || sendingMessage}
                  style={{ 
                    padding: '12px 20px', 
                    background: chatInput.trim() && !sendingMessage ? '#2563eb' : '#e2e8f0', 
                    color: chatInput.trim() && !sendingMessage ? '#ffffff' : '#94a3b8', 
                    border: 'none', 
                    borderRadius: '12px', 
                    cursor: chatInput.trim() && !sendingMessage ? 'pointer' : 'not-allowed', 
                    fontWeight: 'bold', 
                    fontSize: '14px', 
                    transition: 'all 0.2s',
                    boxShadow: chatInput.trim() && !sendingMessage ? '0 4px 6px -1px rgba(37,99,235,0.3)' : 'none'
                  }}
                >
                  {sendingMessage ? '...' : 'Gửi 🚀'}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '25px' }}>
              <button type="button" onClick={() => setShowDetailModal(false)} style={{ padding: '12px 30px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng cửa sổ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;
