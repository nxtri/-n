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
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary transition-all font-label-md text-label-md"
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  Quản lý
                </button>

                <div className="relative" ref={userDropdownRef}>
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant/30 hover:bg-surface-container-high transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center font-bold text-on-primary-fixed text-sm">
                      {user.fullName?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-semibold text-on-surface truncate max-w-[100px]">
                      {user.fullName}
                    </span>
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                  </button>

                  {showDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-outline-variant/20 py-2 z-50">
                      <button 
                        onClick={() => { onProfileClick(); setShowDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-all flex items-center gap-3"
                      >
                        <span className="material-symbols-outlined text-lg">person</span>
                        Hồ sơ cá nhân
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container/20 transition-all flex items-center gap-3"
                      >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Đăng xuất
                      </button>
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
