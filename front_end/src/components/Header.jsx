import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Header = ({ 
  user, 
  activeType, 
  setActiveType, 
  onProfileClick, 
  handleLogout,
  onLogoClick
}) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTypeClick = (type) => {
    if (setActiveType) {
      setActiveType(type);
      if (window.location.pathname !== '/') {
        navigate('/', { state: { activeType: type } });
      }
    } else {
      navigate('/', { state: { activeType: type } });
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-200">
      <div className="max-w-[1280px] mx-auto flex justify-between items-center h-20 px-8">
        <div className="flex items-center gap-12">
          <Link 
            to="/" 
            onClick={onLogoClick}
            className="text-2xl font-black text-blue-600 tracking-tighter hover:opacity-80 transition-all"
          >
            PHONGTROSIEUCAP
          </Link>
          {setActiveType && (
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => handleTypeClick('all')}
                className={`${activeType === 'all' || !activeType ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent'} font-bold border-b-2 pb-1 text-label-md transition-all`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => handleTypeClick('SINGLE')}
                className={`${activeType === 'SINGLE' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent'} hover:text-blue-600 font-label-md text-label-md transition-all`}
              >
                Phòng trọ
              </button>
              <button 
                onClick={() => handleTypeClick('WHOLE_HOUSE')}
                className={`${activeType === 'WHOLE_HOUSE' ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent'} hover:text-blue-600 font-label-md text-label-md transition-all`}
              >
                Nhà nguyên căn
              </button>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                 <button 
                  onClick={() => user?.role === 'ADMIN' ? navigate('/admin') : navigate('/dashboard')}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary transition-all font-label-md text-label-md"
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  Quản lý
                </button>

                <div className="relative" ref={userDropdownRef}>
                  <div 
                    onClick={() => setShowDropdown(!showDropdown)} 
                    className="flex items-center gap-3 cursor-pointer pl-2 pr-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container-high transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex justify-center items-center shadow-inner">
                      <span className="text-white font-black text-[14px]">{user.fullName?.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-[14px] max-w-[120px] truncate font-bold hidden md:inline-block">{user?.fullName}</span>
                    <span className="text-on-surface-variant opacity-60 material-symbols-outlined hidden md:inline-block">expand_more</span>
                  </div>
                  {showDropdown && (
                    <div className="absolute top-[120%] right-0 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-2 w-[180px] shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-3 border-b border-outline-variant/30 mb-1">
                        <div className="font-black text-sm truncate">{user?.fullName}</div>
                        <div className="font-bold text-[10px] text-on-surface-variant uppercase tracking-widest">{user?.role}</div>
                      </div>
                      <div 
                        onClick={() => { onProfileClick(); setShowDropdown(false); }} 
                        className="px-4 py-2.5 rounded-xl cursor-pointer text-[13px] font-bold transition-all hover:bg-surface-container-low hover:text-primary flex items-center gap-3"
                      >
                        <span className="material-symbols-outlined text-[18px]">manage_accounts</span> Hồ sơ
                      </div>
                      <div 
                        onClick={handleLogout} 
                        className="px-4 py-2.5 rounded-xl cursor-pointer text-error text-[13px] font-bold transition-all hover:bg-error/10 flex items-center gap-3 mt-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span> Đăng xuất
                      </div>
                    </div>
                  )}
                </div>

                {user.role === 'LANDLORD' && (
                  <button 
                    onClick={() => navigate('/dashboard', { state: { targetTab: 'ADD_ROOM' } })}
                    className="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-lg text-label-md hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    Đăng tin
                  </button>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="text-gray-600 font-label-md text-label-md hover:text-primary transition-all">Đăng nhập</button>
                <button onClick={() => navigate('/register')} className="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-lg text-label-md hover:opacity-90 transition-all active:scale-95">Đăng ký</button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
