import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Header = ({ 
  user, 
  activeType, 
  setActiveType, 
  onProfileClick, 
  handleLogout,
  onLogoClick,
  // Search bar props (Row 2)
  searchTerm,
  setSearchTerm,
  onFilterClick,
  onSearch,
  // Quick filter props
  activeLocation,
  setActiveLocation,
  filteredRoomsCount
}) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false); // Mobile Menu state
  const userDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);

  const showSearchBar = setSearchTerm !== undefined;

  // Scroll detection
  useEffect(() => {
    if (!showSearchBar) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showSearchBar]);

  const handleExpandSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
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

  const NAV_ITEMS = [
    { type: 'all', label: 'Tất cả', icon: 'grid_view' },
    { type: 'SINGLE', label: 'Phòng trọ', icon: 'door_front' },
    { type: 'WHOLE_HOUSE', label: 'Nhà nguyên căn', icon: 'cottage' },
  ];

  const ROOM_TYPES = [
    { value: 'all', label: 'Loại bất động sản', icon: 'home' },
    { value: 'SINGLE', label: 'Phòng trọ', icon: 'door_front' },
    { value: 'WHOLE_HOUSE', label: 'Nhà nguyên căn', icon: 'cottage' },
  ];

  const selectedType = ROOM_TYPES.find(t => t.value === activeType) || ROOM_TYPES[0];

  const LOCATIONS = ['Tất cả', 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Bình Dương'];

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm transition-all duration-300">
      {/* ═══ ROW 1: Logo + Navigation/MiniPill + Actions ═══ */}
      <div className="w-full flex justify-between items-center h-16 px-4 md:px-10">
        {/* Left Side: Logo */}
        <div className="flex-1 flex justify-start">
          <Link 
            to="/" 
            onClick={onLogoClick}
            className="text-2xl font-black text-blue-600 tracking-tighter hover:opacity-80 transition-all"
          >
            PHONGTROSIEUCAP
          </Link>
        </div>

        {/* Center Side: Nav tabs OR Mini Search Pill */}
        <div className="flex-1 flex justify-center">
          {setActiveType && (
            <>
              {/* Nav tabs (visible when NOT scrolled) */}
              <nav className={`hidden md:flex items-center gap-1 transition-all duration-300 ${
                showSearchBar && isScrolled ? 'opacity-0 scale-90 pointer-events-none absolute' : 'opacity-100 scale-100'
              }`}>
                {NAV_ITEMS.map(item => {
                  const isActive = activeType === item.type || (!activeType && item.type === 'all');
                  return (
                    <button 
                      key={item.type}
                      onClick={() => handleTypeClick(item.type)}
                      className={`relative flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-all group ${
                        isActive 
                          ? 'text-blue-600' 
                          : 'text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[22px] transition-all ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                        {item.icon}
                      </span>
                      <span className="text-xs font-bold tracking-wide">{item.label}</span>
                      {/* Active indicator line */}
                      <span className={`absolute -bottom-[1px] left-3 right-3 h-[2.5px] rounded-full transition-all duration-300 ${
                        isActive ? 'bg-blue-600 scale-x-100' : 'bg-transparent scale-x-0'
                      }`} />
                    </button>
                  );
                })}
              </nav>

              {/* Mini Search Pill (visible when scrolled, replaces nav tabs) */}
              {showSearchBar && (
                <button 
                  onClick={handleExpandSearch}
                  className={`hidden md:flex bg-white px-5 py-2 rounded-full shadow-lg border border-gray-200/80 items-center gap-3 hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                    isScrolled ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none absolute'
                  }`}
                >
                  <span className="material-symbols-outlined text-primary text-lg">search</span>
                  <span className="text-sm text-gray-500 font-medium">Bạn muốn tìm ở đâu?</span>
                  <span className="w-px h-5 bg-gray-200"></span>
                  <span className="text-sm text-gray-500 font-medium">Loại phòng</span>
                  <span className="w-px h-5 bg-gray-200"></span>
                  <span className="material-symbols-outlined text-gray-400 text-lg group-hover:text-primary transition-colors">tune</span>
                </button>
              )}
            </>
          )}
        </div>
        
        {/* Right Side: Management Buttons (Desktop) & Hamburger (Mobile) */}
        <div className="flex-1 flex justify-end items-center gap-2 md:gap-4">
          
          {/* Hamburger Menu Toggle (Mobile Only) */}
          <button 
            className="md:hidden p-2 text-gray-600 hover:text-primary"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <span className="material-symbols-outlined text-3xl">{showMobileMenu ? 'close' : 'menu'}</span>
          </button>

          {/* Desktop Nav Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                 <button 
                  onClick={() => user?.role === 'ADMIN' ? navigate('/admin') : navigate('/dashboard')}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary transition-all font-bold text-sm"
                >
                  <span className="material-symbols-outlined text-xl">dashboard</span>
                  <span className="hidden lg:inline">Quản lý</span>
                </button>

                <div className="relative" ref={userDropdownRef}>
                  <div 
                    onClick={() => setShowDropdown(!showDropdown)} 
                    className="flex items-center gap-3 cursor-pointer pl-2 pr-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container-high transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex justify-center items-center shadow-inner">
                      <span className="text-white font-black text-[14px]">{user.fullName?.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-[14px] max-w-[120px] truncate font-bold">{user?.fullName}</span>
                    <span className="text-on-surface-variant opacity-60 material-symbols-outlined">expand_more</span>
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
                    className="bg-primary text-white font-bold px-5 py-2.5 rounded-full text-sm hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xl">add_circle</span>
                    <span>Đăng tin</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/login')} className="text-gray-600 font-bold text-sm hover:bg-gray-100 px-4 py-2 rounded-full transition-all">Đăng nhập</button>
                <button onClick={() => navigate('/register')} className="bg-primary text-white font-bold px-6 py-2.5 rounded-full text-sm hover:shadow-lg transition-all active:scale-95">Đăng ký</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MOBILE MENU DROPDOWN ═══ */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl flex flex-col p-4 animate-in slide-in-from-top-2 duration-300">
          {user ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-full bg-primary flex justify-center items-center shadow-inner">
                  <span className="text-white font-black text-xl">{user.fullName?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div className="font-black text-base">{user.fullName}</div>
                  <div className="font-bold text-xs text-on-surface-variant uppercase tracking-widest">{user.role}</div>
                </div>
              </div>
              
              <button onClick={() => { setShowMobileMenu(false); user?.role === 'ADMIN' ? navigate('/admin') : navigate('/dashboard'); }} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-700">
                <span className="material-symbols-outlined text-primary">dashboard</span> Quản lý Dashboard
              </button>
              
              <button onClick={() => { setShowMobileMenu(false); onProfileClick(); }} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-700">
                <span className="material-symbols-outlined text-primary">manage_accounts</span> Hồ sơ của tôi
              </button>
              
              {user.role === 'LANDLORD' && (
                <button onClick={() => { setShowMobileMenu(false); navigate('/dashboard', { state: { targetTab: 'ADD_ROOM' } }); }} className="flex items-center gap-3 px-4 py-3 bg-primary/10 rounded-xl font-bold text-primary">
                  <span className="material-symbols-outlined">add_circle</span> Đăng tin mới
                </button>
              )}
              
              <button onClick={() => { setShowMobileMenu(false); handleLogout(); }} className="flex items-center gap-3 px-4 py-3 bg-error/10 rounded-xl font-bold text-error">
                <span className="material-symbols-outlined">logout</span> Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button onClick={() => { setShowMobileMenu(false); navigate('/login'); }} className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl">Đăng nhập</button>
              <button onClick={() => { setShowMobileMenu(false); navigate('/register'); }} className="w-full bg-primary text-white font-bold py-3 rounded-xl">Đăng ký</button>
            </div>
          )}
        </div>
      )}

      {/* ═══ ROW 2: Search Bar + Quick Filters + Results (only on Home page) ═══ */}
      {showSearchBar && (
        <div className={`w-full bg-gray-50/80 border-t border-gray-100 transition-all duration-400 ${
          isScrolled ? 'max-h-0 py-0 opacity-0 overflow-hidden' : 'max-h-[300px] py-3 opacity-100'
        } ${showTypeDropdown ? 'overflow-visible' : 'overflow-hidden'}`}>
          <div className="max-w-[1280px] mx-auto px-4 md:px-10">
            {/* Search Bar Pill */}
            <div className="max-w-4xl bg-white p-2 md:p-1.5 rounded-3xl md:rounded-full shadow-lg flex flex-col md:flex-row items-center gap-2 md:gap-1 border border-gray-200/80 hover:shadow-xl transition-shadow duration-300 mb-4">
              {/* Location Input */}
              <div className="flex-1 flex items-center gap-2.5 px-4 md:px-5 border-b md:border-b-0 md:border-r border-gray-200/80 w-full py-2">
                <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                <input 
                  type="text" 
                  placeholder="Bạn muốn tìm ở đâu?" 
                  className="w-full bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-gray-400 outline-none py-1"
                  value={searchTerm || ''}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Room Type Custom Dropdown */}
              <div className="flex-1 relative w-full border-b md:border-b-0 md:border-r border-gray-200/80" ref={typeDropdownRef}>
                <div 
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="flex items-center gap-2.5 px-4 md:px-5 py-3 md:py-2 cursor-pointer hover:bg-gray-50/50 transition-colors w-full"
                >
                  <span className="material-symbols-outlined text-primary text-xl">{selectedType.icon}</span>
                  <span className="text-sm text-on-surface font-medium flex-1">{selectedType.label}</span>
                  <span className={`material-symbols-outlined text-gray-400 text-lg transition-transform duration-200 ${showTypeDropdown ? 'rotate-180' : ''}`}>expand_more</span>
                </div>
                {/* Dropdown Menu */}
                {showTypeDropdown && (
                  <div className="absolute top-full left-0 right-0 md:mt-2 bg-white rounded-2xl md:shadow-2xl border-t md:border border-gray-200/80 py-2 z-[200] w-full min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-200">
                    {ROOM_TYPES.map(item => (
                      <div
                        key={item.value}
                        onClick={() => { setActiveType(item.value); setShowTypeDropdown(false); }}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all text-sm font-medium mx-1.5 rounded-xl ${
                          activeType === item.value 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-xl ${
                          activeType === item.value ? 'text-primary' : 'text-gray-400'
                        }`}>{item.icon}</span>
                        <span>{item.label}</span>
                        {activeType === item.value && (
                          <span className="material-symbols-outlined text-primary text-lg ml-auto">check_circle</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Filter & Search Buttons */}
              <div className="flex items-center gap-2 p-2 md:p-0 pr-1.5 w-full md:w-auto justify-between md:justify-end">
                <button 
                  onClick={onFilterClick}
                  className="flex-1 md:flex-none flex justify-center items-center gap-1.5 px-4 md:px-5 py-2.5 md:py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 md:bg-transparent md:hover:bg-gray-100 transition-colors font-semibold text-sm text-gray-700"
                >
                  <span className="material-symbols-outlined text-lg">tune</span>
                  Lọc
                </button>
                <button 
                  onClick={onSearch}
                  className="flex-[2] md:flex-none flex justify-center items-center gap-2 bg-primary text-on-primary px-4 md:px-8 py-2.5 md:py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-lg">search</span>
                  Tìm kiếm
                </button>
              </div>
            </div>

            {/* Quick Location Filters */}
            {setActiveLocation && (
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {LOCATIONS.map(loc => (
                  <button 
                    key={loc}
                    onClick={() => setActiveLocation(loc)}
                    className={`px-5 py-1.5 rounded-full transition-all text-sm font-semibold ${
                      activeLocation === loc 
                        ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                        : 'bg-white border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}

            {/* Results Info */}
            {filteredRoomsCount !== undefined && (
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-on-surface text-sm">Kết quả tìm kiếm</h2>
                <span className="text-on-surface-variant text-xs font-medium">
                  — Có {filteredRoomsCount} tin đăng phù hợp
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
