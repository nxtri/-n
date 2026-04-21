

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home'; // Import Home
import RoomDetail from './pages/RoomDetail'; // Import RoomDetail
import AdminDashboard from './pages/AdminDashboard'; // Quản trị viên
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
 return (
    <Router>
        <Routes>
            <Route path="/" element={<Home />} />  {/* Khách vào web sẽ thấy trang này đầu tiên */}
            <Route path="/room/:id" element={<RoomDetail />} />  {/* Trang chi tiết phòng */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} /> 
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
    </Router>
 );
}

export default App;