import React from 'react';
import { ShoppingBag, Heart, User, Shield, Menu, X, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  cart: CartItem[];
  wishlist: string[];
  currentUser: { name: string; email: string } | null;
  setAuthModalOpen: (open: boolean) => void;
  selectedCategoryFilter?: string;
  setSelectedCategoryFilter?: (cat: string) => void;
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
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Compute total items inside the shopping cart
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Store', id: 'store', category: 'all' },
    { name: 'Coffee Cafe', id: 'store', category: 'coffee' },
    { name: 'Bakery', id: 'store', category: 'bakery' },
    { name: 'Sudan Market', id: 'store', category: 'market' },
    { name: 'Fashion & Textiles', id: 'store', category: 'fashion' },
    { name: 'Pots Collection', id: 'store', category: 'pots' },
    { name: 'Portfolio', id: 'portfolio' },
    { name: 'About', id: 'about' },
    { name: 'Contact', id: 'contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-glass/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-24">
          
          {/* Logo / Brand signature with gold crown Zal seal */}
          <button
            onClick={() => {
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 cursor-pointer group text-left"
          >
            <img
              src="/src/assets/images/zoal_logo_cropped.png"
              alt="ZOAL Seal"
              className="w-10 h-10 sm:w-14 sm:h-14 transition-all duration-500 ease-out group-hover:scale-105 select-none pointer-events-none"
              style={{
                objectFit: 'contain',
                background: 'transparent',
                overflow: 'visible',
              }}
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col items-start justify-center">
              <span className="font-display font-medium text-lg sm:text-xl tracking-[0.35em] text-[#D4AF37] transition-colors duration-300 group-hover:text-white whitespace-nowrap select-none leading-none">
                ZOAL
              </span>
            </div>
          </button>

          {/* Large Screen Nav Menu */}
          <div className="hidden lg:flex items-center space-x-4 xl:space-x-8">
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
          <div className="hidden lg:flex items-center space-x-6">
            
            {/* Wishlist triggers Store page filtered */}
            <button
              onClick={() => {
                setCurrentPage('dashboard');
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
                    animate={{ scale: [1.3, 0.9, 1], opacity: 1 }}
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
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-white text-black text-[9px] font-sans font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Customer Workspace Profile */}
            <button
              onClick={() => {
                if (currentUser) {
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

            {/* Quick Admin Access */}
            <button
              onClick={() => {
                setCurrentPage('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 border border-gold-pure/20 rounded-sm bg-gold-pure/5 hover:bg-gold-pure/10 text-gold-pure text-[9px] uppercase tracking-widest transition-all duration-300 flex items-center gap-1 cursor-pointer"
              title="Admin Command Deck"
            >
              <Shield className="w-3.5 h-3.5" />
              Portal
            </button>
            
          </div>

          {/* Mobile responsive toggles */}
          <div className="flex lg:hidden items-center space-x-4">
            
            {/* Mobile Wishlist Button */}
            <button
              onClick={() => {
                setCurrentPage('dashboard');
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
                    animate={{ scale: [1.3, 0.9, 1], opacity: 1 }}
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
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
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
                setCurrentPage('dashboard');
                setMobileMenuOpen(false);
              }}
              className="text-xs uppercase tracking-wider text-zinc-400 hover:text-gold-pure flex items-center gap-1"
            >
              <User className="w-4 h-4" /> Account
            </button>
            <button
              onClick={() => {
                setCurrentPage('admin');
                setMobileMenuOpen(false);
              }}
              className="text-xs uppercase tracking-wider text-gold-pure flex items-center gap-1"
            >
              <Shield className="w-4 h-4" /> Admin Portal
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
