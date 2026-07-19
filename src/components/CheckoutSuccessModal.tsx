import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ShoppingBag, Eye } from 'lucide-react';
import { Order } from '../types';

interface CheckoutSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueShopping: () => void;
  onViewOrders: () => void;
  order: Order | null;
}

export default function CheckoutSuccessModal({
  isOpen,
  onClose,
  onContinueShopping,
  onViewOrders,
  order
}: CheckoutSuccessModalProps) {
  // Listen to Escape key and lock scroll when open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-md w-full bg-zinc-950/90 border border-[#D4AF37]/35 rounded-sm p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(212,175,55,0.15)] text-center select-none"
          onClick={(e) => e.stopPropagation()} // Stop propagation to avoid outside-click trigger
        >
          {/* Confetti Explosion (Elegant Gold and White particles burst) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm">
            {Array.from({ length: 30 }).map((_, i) => {
              const angle = (i * 360) / 30;
              const radius = 70 + Math.random() * 110;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              const colors = ['#D4AF37', '#FFF3BD', '#FFFFFF', '#C5A049'];
              const color = colors[i % colors.length];
              
              return (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color, left: '50%', top: '40%' }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x,
                    y,
                    scale: [0, 1, 1, 0.5, 0],
                    opacity: [1, 1, 0.8, 0.4, 0],
                    rotate: Math.random() * 360
                  }}
                  transition={{
                    duration: 1.6 + Math.random() * 1.4,
                    ease: [0.1, 0.8, 0.3, 1],
                    delay: 0.05
                  }}
                />
              );
            })}
          </div>

          {/* Luxury Double Gold Border Frame */}
          <div className="absolute inset-1 pointer-events-none border border-[#D4AF37]/10 rounded-xs"></div>
          {/* Top Decorative Gold Bar Accent */}
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

          {/* Close button icon */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-[#D4AF37] p-1.5 transition-colors cursor-pointer rounded-xs border border-transparent hover:border-white/5 active:scale-95 duration-200"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Success Check Mark Animation Header */}
          <div className="flex justify-center mb-5 mt-2 relative">
            <div className="relative w-20 h-20 bg-gold-pure/5 rounded-full border border-gold-pure/10 flex items-center justify-center">
              {/* Pulsing ring */}
              <span className="absolute inset-0 rounded-full bg-gold-pure/10 animate-ping opacity-75"></span>
              
              <svg className="w-12 h-12 text-[#D4AF37]" viewBox="0 0 52 52" fill="none">
                <motion.circle
                  cx="26"
                  cy="26"
                  r="23"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                <motion.path
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 27l6.5 6.5 13.5-14"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                />
              </svg>
            </div>
          </div>

          {/* Banner Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-pure/10 border border-gold-pure/25 mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-gold-pure" />
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-display font-semibold text-gold-pure">
              ✅ Order Confirmed
            </span>
          </div>

          {/* Main Titles */}
          <h2 className="text-lg sm:text-xl font-display font-semibold text-white uppercase tracking-wider mb-2">
            Order Placed Successfully
          </h2>
          
          <p className="text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto mb-6">
            Thank you for your order{order?.customerName ? `, ${order.customerName}` : ''}.<br />
            Your order has been received successfully and is now being processed. You will receive an order confirmation email shortly.
          </p>

          {/* Display Order Details if available */}
          {order && (
            <div className="bg-black/80 border border-white/5 rounded-xs p-3.5 mb-6 text-left font-mono text-[11px] text-zinc-400 space-y-2">
              <div className="flex justify-between border-b border-white/5 pb-1.5 mb-1.5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">Order Ref:</span>
                <strong className="text-gold-pure font-bold">{order.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] text-zinc-600 uppercase font-sans">Products:</span>
                <span className="text-zinc-300 truncate max-w-[200px] text-right">
                  {order.items.map(item => item.name).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] text-zinc-600 uppercase font-sans">Total:</span>
                <span className="text-zinc-200 font-bold">{order.total.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] text-zinc-600 uppercase font-sans">Email Logged:</span>
                <span className="text-zinc-300 truncate max-w-[180px]">{order.email}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                onContinueShopping();
                onClose();
              }}
              className="w-full py-3 bg-[#D4AF37] hover:bg-white text-black font-display font-bold uppercase tracking-widest text-[10.5px] rounded-sm transition-all duration-350 active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(212,175,55,0.2)]"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </button>

            <button
              onClick={() => {
                onViewOrders();
                onClose();
              }}
              className="w-full py-3 border border-[#D4AF37]/50 hover:border-[#D4AF37] bg-black hover:bg-zinc-900/50 text-[#D4AF37] font-display font-bold uppercase tracking-widest text-[10.5px] rounded-sm transition-all duration-300 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View My Orders</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 border border-white/5 hover:border-white/20 bg-transparent text-zinc-500 hover:text-white font-display uppercase tracking-widest text-[9.5px] rounded-sm transition-all duration-300 active:scale-98 cursor-pointer"
            >
              Close
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
