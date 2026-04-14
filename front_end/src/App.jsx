// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';
// import Home from './pages/Home';             
// import RoomDetail from './pages/RoomDetail'; 
// import TenantDashboard from './pages/TenantDashboard';

// function App() {
//   // 1. LẤY THÔNG TIN USER TỪ LOCAL STORAGE (Nếu có)
//   const userString = localStorage.getItem('user');
//   const user = userString ? JSON.parse(userString) : null;

//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Home />} />                   
//         <Route path="/room/:id" element={<RoomDetail />} />     
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
        
//         {/* 2. ĐIỀU HƯỚNG DỰA TRÊN ROLE CỦA USER */}
//         <Route 
//           path="/dashboard" 
//           element={user?.role === 'TENANT' ? <TenantDashboard /> : <Dashboard />} 
//         />    
//       </Routes>
//     </Router>
//   );
// }

// export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';             // Import Home
import RoomDetail from './pages/RoomDetail'; // Import RoomDetail


function App() {
 return (
    <Router>
        <Routes>
            <Route path="/" element={<Home />} />  {/* Khách vào web sẽ thấy trang này đầu tiên */}
            <Route path="/room/:id" element={<RoomDetail />} />  {/* Trang chi tiết phòng */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} /> 
            
        </Routes>
    </Router>
 );
}

export default App;