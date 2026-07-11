import React from 'react';
import { ShoppingBag, Heart, User, Shield, Menu, X, Landmark, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';
import { useTranslation } from 'react-i18next';
import logoImg from '../assets/images/zoal_logo_fixed_1780848794781.png';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  cart: CartItem[];
  wishlist: string[];
  currentUser: { name: string; email: string } | null;
  setAuthModalOpen: (open: boolean) => void;
  selectedCategoryFilter?: string;
  setSelectedCategoryFilter?: (cat: string) => void;
  setDashboardSubTab?: (tab: string) => void;
  onLogout?: () => void;
}

export default function Navbar({
  currentPage,
  setCurrentPage,
  cart,
  wishlist,
  currentUser,
  setAuthModalOpen,
  selectedCategoryFilter = 'all',
  setSelectedCategoryFilter,
  setDashboardSubTab,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { t, i18n } = useTranslation();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Compute total items inside the shopping cart
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const navLinks = [
    { name: t('nav.home'), id: 'home' },
    { name: t('nav.store'), id: 'store', category: 'all' },
    { name: t('nav.portfolio'), id: 'portfolio' },
    { name: t('nav.about'), id: 'about' },
    { name: t('nav.contact'), id: 'contact' },
    { name: t('nav.blog'), id: 'blog' },
  ];

  return (
    <nav dir="ltr" className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[rgba(0,0,0,0.85)] border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]' : 'bg-transparent border-b-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-[60px] sm:h-[64px] md:h-[68px] lg:h-[72px]">
          
          {/* Logo / Brand signature with gold crown Zal seal */}
          <button
            onClick={() => {
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center cursor-pointer group text-left ltr:text-left rtl:text-right"
          >
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
              <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105 flex items-center justify-center">
                <img
                  src={logoImg}
                  alt="ZOAL Seal"
                  className="w-[145%] h-[145%] max-w-[145%] object-cover select-none pointer-events-none"
                />
              </div>
            </div>
          </button>

          {/* Large Screen Nav Menu */}
          <div className="hidden lg:flex items-center space-x-4 xl:space-x-8 rtl:space-x-reverse">
            {navLinks.map((link, idx) => {
              const isActive = currentPage === link.id && (!link.category || link.category === selectedCategoryFilter);
              return (
                <button
                  key={`${link.id}-${link.category || ''}-${idx}`}
                  onClick={() => {
                    if (link.category && setSelectedCategoryFilter) {
                      setSelectedCategoryFilter(link.category);
                    }
                    setCurrentPage(link.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`relative text-[9px] xl:text-[10px] uppercase tracking-[0.15em] xl:tracking-[0.2em] font-light transition-all duration-300 hover:text-[#D4AF37] cursor-pointer py-1.5 ${
                    isActive ? 'text-[#D4AF37] font-semibold' : 'text-zinc-300'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#D4AF37]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Action Buttons */}
          <div className="hidden lg:flex items-center space-x-6 rtl:space-x-reverse">
            
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-gold-pure transition-colors duration-300 cursor-pointer text-[10px] tracking-widest font-semibold ml-4 rtl:mr-4 rtl:ml-0"
              title="Toggle Language"
            >
              <Globe className="w-4 h-4 stroke-[1.5]" />
              <span>{i18n.language === 'en' ? 'العربية' : 'EN'}</span>
            </button>

            {/* Wishlist triggers Wishlist Page */}
            <button
              onClick={() => {
                setCurrentPage('wishlist');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="relative p-2 text-zinc-400 hover:text-gold-pure transition-colors duration-300 cursor-pointer"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5 stroke-[1.5]" />
              <AnimatePresence mode="wait">
                {wishlist.length > 0 && (
                  <motion.span
                    key={wishlist.length}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="absolute -top-0.5 -right-0.5 bg-[#D4AF37] text-black text-[9px] font-sans font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                  >
                    {wishlist.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Shopping Cart Bag */}
            <button
              onClick={() => {
                setCurrentPage('cart');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="relative p-2 text-zinc-400 hover:text-gold-pure transition-colors duration-300 cursor-pointer"
              title="Shopping Cart Tray"
              id="navbar-desktop-cart-btn"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              <AnimatePresence mode="popLayout">
                {cartItemCount > 0 && (
                  <motion.span
                    key={`desktop-badge-${cartItemCount}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 15 }}
                    className="absolute -top-0.5 -right-0.5 bg-white text-black text-[9px] font-sans font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.3)] border border-[#D4AF37]/20"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Customer Workspace Profile */}
            <div className="relative group/nav-profile flex items-center">
              <button
                onClick={() => {
                  if (currentUser) {
                    if (setDashboardSubTab) setDashboardSubTab('overview');
                    setCurrentPage('dashboard');
                  } else {
                    setAuthModalOpen(true);
                  }
                }}
                className="p-2 text-zinc-400 hover:text-gold-pure transition-colors duration-300 flex items-center space-x-1 cursor-pointer"
                title={currentUser ? `Portal: ${currentUser.name}` : 'Login Privilege'}
              >
                <User className="w-5 h-5 stroke-[1.5]" />
                {currentUser && (
                  <span className="text-[10px] uppercase tracking-wider text-gold-pure/90 max-w-[80px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                )}
              </button>

              {currentUser && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-zinc-950 border border-white/10 rounded-xs shadow-[0_12px_40px_rgba(0,0,0,0.95)] opacity-0 pointer-events-none group-hover/nav-profile:opacity-100 group-hover/nav-profile:pointer-events-auto transition-all duration-300 z-50 p-2.5">
                  <div className="p-2 border-b border-white/5 text-left mb-2">
                    <p className="text-[10.5px] text-white font-semibold font-display tracking-wide uppercase truncate leading-tight mb-0.5">
                      {currentUser.name}
                    </p>
                    <span className="text-[8.5px] font-mono text-zinc-500 tracking-wider truncate block">
                      {currentUser.email}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {[
                      { id: 'overview', name: 'Dashboard Overview' },
                      { id: 'orders', name: 'My Orders' },
                      { id: 'track', name: 'Track Orders' },
                      { id: 'profile', name: 'My Profile' },
                      { id: 'settings', name: 'Account Settings' },
                      { id: 'password', name: 'Change Password' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (setDashboardSubTab) setDashboardSubTab(item.id);
                          setCurrentPage('dashboard');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full text-left py-1.5 px-2 text-[9px] uppercase tracking-wider text-zinc-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-xs transition-all cursor-pointer font-medium"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/5 mt-2 pt-2">
                    <button
                      onClick={() => {
                        if (onLogout && window.confirm('Terminate secure session?')) {
                          onLogout();
                        }
                      }}
                      className="w-full text-left py-1.5 px-2 text-[9px] uppercase tracking-wider text-rose-500 hover:bg-rose-950/20 rounded-xs transition-all cursor-pointer font-semibold"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            
          </div>

          {/* Mobile responsive toggles */}
          <div className="flex lg:hidden items-center space-x-4">
            
            {/* Mobile Wishlist Button */}
            <button
              onClick={() => {
                setCurrentPage('wishlist');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="relative p-1 text-zinc-400 hover:text-gold-pure"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5 stroke-[1.5]" />
              <AnimatePresence mode="wait">
                {wishlist.length > 0 && (
                  <motion.span
                    key={wishlist.length}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-[8px] font-sans font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                  >
                    {wishlist.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={() => setCurrentPage('cart')}
              className="relative p-1 text-zinc-400 hover:text-gold-pure"
              id="navbar-mobile-cart-btn"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              <AnimatePresence mode="popLayout">
                {cartItemCount > 0 && (
                  <motion.span
                    key={`mobile-badge-${cartItemCount}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 15 }}
                    className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.3)] border border-[#D4AF37]/20"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Mobile Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2 py-1 text-zinc-400 hover:text-[#D4AF37] transition-colors duration-300 cursor-pointer text-[10px] tracking-wider font-semibold shrink-0 select-none"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="text-[10px] font-sans font-medium">{i18n.language === 'en' ? 'العربية' : 'EN'}</span>
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-black/95 border-b border-white/5 py-4 px-6 space-y-3 animate-fade-in">
          {navLinks.map((link, idx) => {
            const isActive = currentPage === link.id && (!link.category || link.category === selectedCategoryFilter);
            return (
              <button
                key={`${link.id}-${link.category || ''}-${idx}`}
                onClick={() => {
                  if (link.category && setSelectedCategoryFilter) {
                    setSelectedCategoryFilter(link.category);
                  }
                  setCurrentPage(link.id);
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`block w-full text-left text-xs uppercase tracking-widest py-2.5 ${
                  isActive ? 'text-gold-pure' : 'text-zinc-400'
                }`}
              >
                {link.name}
              </button>
            );
          })}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => {
                if (currentUser) {
                  if (setDashboardSubTab) setDashboardSubTab('overview');
                  setCurrentPage('dashboard');
                } else {
                  setAuthModalOpen(true);
                }
                setMobileMenuOpen(false);
              }}
              className="text-xs uppercase tracking-wider text-zinc-400 hover:text-gold-pure flex items-center gap-1 cursor-pointer"
            >
              <User className="w-4 h-4" /> Account
            </button>

            {/* Language Selection List inside Drawer */}
            <div className="flex items-center gap-2.5 text-[11px] font-sans font-medium tracking-wide">
              <button
                onClick={() => {
                  i18n.changeLanguage('ar');
                  setMobileMenuOpen(false);
                }}
                className={`transition-colors cursor-pointer select-none ${
                  i18n.language === 'ar' ? 'text-gold-pure font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                العربية
              </button>
              <span className="text-zinc-800">|</span>
              <button
                onClick={() => {
                  i18n.changeLanguage('en');
                  setMobileMenuOpen(false);
                }}
                className={`transition-colors cursor-pointer select-none ${
                  i18n.language === 'en' ? 'text-gold-pure font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
