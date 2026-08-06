import React from 'react';
import { ShoppingBag, Heart, User, Shield, Menu, X, Landmark, Globe, Settings, Lock, LogOut, Package, MapPin, Star, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';
import { useTranslation } from 'react-i18next';
import EnterpriseNotificationBell from './EnterpriseNotificationBell';

import { useBranding } from './BrandingContext';
import { BRANDING } from '../constants';
import { RoleGuard } from '../rbac/guards';

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
  unreadCount?: number;
  onOpenNotifications?: () => void;
  soundEnabled?: boolean;
  setSoundEnabled?: (enabled: boolean) => void;
  isOnline?: boolean;
  connectionStatus?: string;
}

export default React.memo(function Navbar({
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
  unreadCount = 0,
  onOpenNotifications,
  soundEnabled = true,
  setSoundEnabled = () => {},
  isOnline = true,
  connectionStatus = 'connected',
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { t, i18n } = useTranslation();
  const { settings } = useBranding();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Compute total items inside the shopping cart
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getDashboardLabel = () => {
    const role = (currentUser as any)?.role;
    if (role === 'owner') return t('profile_dropdown.owner_dashboard');
    if (role === 'admin') return t('profile_dropdown.admin_dashboard');
    if (role === 'staff' || role === 'manager') return t('profile_dropdown.staff_dashboard');
    return t('profile_dropdown.owner_admin_dashboard');
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
    <nav dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[rgba(0,0,0,0.85)] border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]' : 'bg-transparent border-b-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-[50px] sm:h-[64px] md:h-[68px] lg:h-[72px]">
          
          {/* Logo / Brand signature with gold crown Zal seal */}
          <button
            onClick={() => {
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center cursor-pointer group text-start"
            aria-label={t('nav.home_aria', { defaultValue: 'Return to Home' })}
          >
            <div className="w-9 h-9 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
              <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105 flex items-center justify-center">
                <img
                  src={settings.businessLogo || BRANDING.LOGO}
                  alt={settings.businessName}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = BRANDING.LOGO;
                  }}
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
                  aria-current={isActive ? 'page' : undefined}
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
              onClick={() => {
                const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
                i18n.changeLanguage(nextLang);
                localStorage.setItem('zoal_language', nextLang);
              }}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-[#D4AF37] transition-colors duration-300 cursor-pointer text-[10px] tracking-widest font-semibold ml-4 rtl:mr-4 rtl:ml-0"
              title={i18n.language === 'ar' ? 'English' : 'العربية'}
              aria-label="Switch Language"
            >
              <Globe className="w-4 h-4 stroke-[1.5]" />
              <span>
                {i18n.language === 'en' ? 'العربية' : 'EN'}
              </span>
            </button>

            {/* Wishlist triggers Wishlist Page */}
            <button
              onClick={() => {
                setCurrentPage('wishlist');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="relative p-2 text-zinc-400 hover:text-gold-pure transition-colors duration-300 cursor-pointer"
              title={t('nav.wishlist', { defaultValue: 'My Wishlist' })}
              aria-label={t('nav.wishlist_aria', { defaultValue: 'View Wishlist' })}
            >
              <Heart className="w-5 h-5 stroke-[1.5]" />
              <AnimatePresence mode="wait">
                {wishlist.length > 0 && (
                  <motion.span
                    key={`desktop-wishlist-badge-${wishlist.length}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="absolute -top-0.5 -right-0.5 bg-[#D4AF37] text-black text-[9px] font-sans font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.4)] tabular-nums-fix"
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
              title={t('nav.cart', { defaultValue: 'Shopping Bag' })}
              aria-label={t('nav.cart_aria', { defaultValue: 'View Shopping Cart' })}
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
                    className="absolute -top-0.5 -right-0.5 bg-white text-black text-[9px] font-sans font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.3)] border border-[#D4AF37]/20 tabular-nums-fix"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Enterprise Notification Bell */}
            <EnterpriseNotificationBell
              unreadCount={unreadCount}
              onClick={onOpenNotifications || (() => {})}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              isOnline={isOnline}
              connectionStatus={connectionStatus}
              currentUser={currentUser}
            />

            {/* Customer Profile */}
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
                title={currentUser ? t('navbar.portal_user', { defaultValue: 'Portal: {{name}}', name: currentUser.name || 'User' }) : t('navbar.login_privilege', { defaultValue: 'Login Privilege' })}
              >
                <User className="w-5 h-5 stroke-[1.5]" />
                {currentUser && (
                  <span className="text-[10px] uppercase tracking-wider text-gold-pure/90 max-w-[80px] truncate">
                    {(currentUser.name || 'User').split(' ')[0]}
                  </span>
                )}
              </button>

              {currentUser && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-zinc-950 border border-white/10 rounded-xs shadow-[0_12px_40px_rgba(0,0,0,0.95)] opacity-0 pointer-events-none group-hover/nav-profile:opacity-100 group-hover/nav-profile:pointer-events-auto transition-all duration-300 z-50 p-3">
                  {/* User Header & Account Status */}
                  <div className="p-2 border-b border-white/5 text-start mb-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full border border-[#D4AF37] bg-zinc-900 flex items-center justify-center text-[11px] font-bold text-[#D4AF37] font-mono shrink-0">
                        🛡️
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-white font-semibold font-display tracking-wide uppercase truncate leading-tight">
                          {currentUser.name || 'User'}
                        </p>
                        <span className="text-[8.5px] font-mono text-zinc-500 tracking-wider truncate block">
                          {currentUser.email}
                        </span>
                      </div>
                    </div>

                  </div>

                  <div className="flex flex-col gap-1">
                    {currentUser && (
                      <RoleGuard role="admin" userRole={(currentUser as any)?.role}>
                        <button
                          onClick={() => {
                            setCurrentPage('admin');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full text-start py-2 px-2 text-[10px] uppercase tracking-wider text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500/25 rounded-xs transition-all cursor-pointer font-bold border border-amber-500/20 mb-1.5 flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          {getDashboardLabel()}
                        </button>
                      </RoleGuard>
                    )}

                    {/* Quick Shortcuts */}
                    <div className="grid grid-cols-5 gap-1 py-1 border-b border-white/5 mb-1 text-center">
                      {[
                        { id: 'orders', label: t('profile_dropdown.orders'), icon: Package },
                        { id: 'addresses', label: t('profile_dropdown.addresses'), icon: MapPin },
                        { id: 'wishlist', label: t('profile_dropdown.wishlist'), icon: Heart },
                        { id: 'reviews', label: t('profile_dropdown.reviews'), icon: Star },
                        { id: 'invoices', label: t('profile_dropdown.invoices'), icon: FileText },
                      ].map((sc) => {
                        const Icon = sc.icon;
                        return (
                          <button
                            key={sc.id}
                            onClick={() => {
                              if (setDashboardSubTab) setDashboardSubTab(sc.id);
                              setCurrentPage('dashboard');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-1.5 bg-zinc-900/60 hover:bg-[#D4AF37]/20 border border-white/5 hover:border-[#D4AF37]/40 text-zinc-400 hover:text-white rounded-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                            title={sc.label}
                          >
                            <Icon className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span className="text-[7.5px] uppercase tracking-tighter truncate w-full">{sc.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {[
                      { id: 'profile', name: t('profile_dropdown.my_profile'), desc: t('profile_dropdown.my_profile_desc'), icon: User },
                      { id: 'settings', name: t('profile_dropdown.account_settings'), desc: t('profile_dropdown.account_settings_desc'), icon: Settings },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (setDashboardSubTab) setDashboardSubTab(item.id);
                            setCurrentPage('dashboard');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full text-start py-2 px-2.5 rounded-xs hover:bg-white/5 transition-all cursor-pointer group flex items-start gap-2.5"
                        >
                          <Icon className="w-4 h-4 text-zinc-400 group-hover:text-[#D4AF37] mt-0.5 shrink-0" />
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-white font-bold group-hover:text-[#D4AF37] transition-colors">
                              {item.name}
                            </span>
                            <span className="block text-[8px] text-zinc-500 font-sans tracking-normal leading-tight">
                              {item.desc}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-white/5 mt-2 pt-2">
                    <button
                      onClick={() => {
                        if (onLogout) {
                          onLogout();
                        }
                      }}
                      className="w-full text-start py-2 px-2.5 rounded-xs hover:bg-rose-950/20 transition-all cursor-pointer group flex items-center gap-2.5 text-rose-500"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider font-bold text-rose-500">
                          {t('profile_dropdown.logout')}
                        </span>
                        <span className="block text-[8px] text-zinc-500 font-sans tracking-normal leading-tight">
                          {t('profile_dropdown.logout_desc')}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            
          </div>

          {/* Mobile responsive toggles */}
          <div className="flex lg:hidden items-center space-x-2 sm:space-x-4 rtl:space-x-reverse">
            
            {/* Mobile Wishlist Button */}
            <button
              onClick={() => {
                setCurrentPage('wishlist');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="relative p-2 text-zinc-400 hover:text-gold-pure min-h-[44px] flex items-center justify-center cursor-pointer"
              title={t('nav.wishlist', { defaultValue: 'My Wishlist' })}
            >
              <Heart className="w-4.5 h-4.5 stroke-[1.5]" />
              <AnimatePresence mode="wait">
                {wishlist.length > 0 && (
                  <motion.span
                    key={`mobile-wishlist-badge-${wishlist.length}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute top-1 right-0 bg-[#D4AF37] text-black text-[8px] font-sans font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.4)] tabular-nums-fix"
                  >
                    {wishlist.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={() => setCurrentPage('cart')}
              className="relative p-2 text-zinc-400 hover:text-gold-pure min-h-[44px] flex items-center justify-center cursor-pointer"
              id="navbar-mobile-cart-btn"
            >
              <ShoppingBag className="w-4.5 h-4.5 stroke-[1.5]" />
              <AnimatePresence mode="popLayout">
                {cartItemCount > 0 && (
                  <motion.span
                    key={`mobile-badge-${cartItemCount}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 15 }}
                    className="absolute top-1 right-0 bg-white text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.3)] border border-[#D4AF37]/20 tabular-nums-fix"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Tablet Notification Bell (Hidden on Mobile) */}
            <div className="hidden md:flex items-center">
              <EnterpriseNotificationBell
                unreadCount={unreadCount}
                onClick={onOpenNotifications || (() => {})}
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                isOnline={isOnline}
                connectionStatus={connectionStatus}
                currentUser={currentUser}
              />
            </div>

            {/* Mobile Language Switcher */}
            <button
              onClick={() => {
                const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
                i18n.changeLanguage(nextLang);
                localStorage.setItem('zoal_language', nextLang);
              }}
              className="flex items-center gap-1 text-zinc-400 hover:text-[#D4AF37] transition-colors duration-300 cursor-pointer text-[10px] tracking-widest font-semibold px-1 min-h-[44px]"
              title={i18n.language === 'ar' ? 'English' : 'العربية'}
              aria-label="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>
                {i18n.language === 'en' ? 'العربية' : 'EN'}
              </span>
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-400 hover:text-white min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? t('nav.close_menu', { defaultValue: 'Close Menu' }) : t('nav.open_menu', { defaultValue: 'Open Menu' })}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                className={`block w-full text-start text-xs uppercase tracking-widest py-2.5 ${
                  isActive ? 'text-gold-pure' : 'text-zinc-400'
                }`}
              >
                {link.name}
              </button>
            );
          })}
          <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
            {currentUser && (
              <RoleGuard role="admin" userRole={(currentUser as any)?.role}>
                <button
                  onClick={() => {
                    setCurrentPage('admin');
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs uppercase tracking-wider text-amber-400 hover:text-white flex items-center gap-1.5 font-bold border border-amber-500/20 bg-amber-500/5 py-2 px-3 rounded-xs"
                >
                  <Shield className="w-4 h-4" /> {getDashboardLabel()}
                </button>
              </RoleGuard>
            )}
            <div className="flex items-center justify-between">
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
                <User className="w-4 h-4" /> {t('nav.account')}
              </button>
            </div>

            {/* Language Selection List inside Drawer */}
            <button
              onClick={() => {
                const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
                i18n.changeLanguage(nextLang);
                localStorage.setItem('zoal_language', nextLang);
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-[#D4AF37] transition-colors duration-300 cursor-pointer text-[10px] tracking-widest font-semibold ml-4 rtl:mr-4 rtl:ml-0"
              title={i18n.language === 'ar' ? 'English' : 'العربية'}
              aria-label="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>
                {i18n.language === 'en' ? 'العربية' : 'EN'}
              </span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
});
