import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { notificationDispatcher, DispatchedNotification } from '../lib/notificationDispatcher';
import { SafeImage } from '../imageRegistry';
import { useTranslation } from 'react-i18next';
import { X, Bell, ShoppingBag, Heart, CheckCircle2, Sparkles } from 'lucide-react';
import EnterpriseNotificationToast from './EnterpriseNotificationToast';
import { formatCurrency } from '../utils';

interface GlobalNotificationRendererProps {
  setCurrentPage: (page: string) => void;
  setInitialDashboardTab: (tab: string) => void;
}

export default function GlobalNotificationRenderer({
  setCurrentPage,
  setInitialDashboardTab
}: GlobalNotificationRendererProps) {
  const { t } = useTranslation();
  const [wishlistToasts, setWishlistToasts] = useState<any[]>([]);
  const [recentPreview, setRecentPreview] = useState<any>(null);
  const [latestEnterprise, setLatestEnterprise] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = notificationDispatcher.subscribe((n: DispatchedNotification) => {
      if (n.type === 'cart') {
        setRecentPreview({
          ...n.metadata,
          timestamp: Date.now()
        });
        // Auto dismiss cart preview after 6 seconds
        const timer = setTimeout(() => {
          setRecentPreview(null);
        }, 6000);
        return () => clearTimeout(timer);
      } else if (n.type === 'wishlist') {
        const id = Date.now().toString() + Math.random();
        setWishlistToasts(prev => [...prev, { 
          id, 
          productName: n.title, 
          productImg: n.image 
        }]);
        setTimeout(() => {
          setWishlistToasts(prev => prev.filter(t => t.id !== id));
        }, 4500);
      } else {
        // System, Order, Coupon, Delivery
        setLatestEnterprise({
          id: Date.now().toString(),
          title: n.title,
          message: n.message,
          category: n.type.toUpperCase(),
          timestamp: new Date().toISOString()
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* Luxury Wishlist Toast Notification Stack */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {wishlistToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-black/95 border border-[#D4AF37]/25 text-white p-4 rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.1)] flex items-center justify-between gap-4 pointer-events-auto select-none"
            >
              <div className="flex items-center gap-3">
                {toast.productImg && (
                  <div className="relative w-11 h-11 rounded-sm overflow-hidden border border-white/10 flex-shrink-0 bg-neutral-900">
                    <SafeImage src={toast.productImg} alt={toast.productName} className="w-full h-full object-cover" containerClassName="w-full h-full relative" />
                  </div>
                )}
                <div className="space-y-0.5 text-left rtl:text-right">
                  <div className="flex items-center gap-1.5 text-[#D4AF37] text-[8.5px] tracking-[0.35em] uppercase font-display font-bold">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    {t('app.toast.added')}
                  </div>
                  <h4 className="text-[11px] font-semibold text-white tracking-wide uppercase line-clamp-1 max-w-[200px]">
                    {toast.productName}
                  </h4>
                  <p className="text-[8px] text-zinc-500 tracking-wider">{t('app.toast.saved')}</p>
                </div>
              </div>

              <button
                onClick={() => setWishlistToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="p-1 px-2 border border-white/5 hover:border-[#D4AF37]/40 rounded-sm text-zinc-400 hover:text-[#D4AF37] transition-all text-[8px] tracking-widest font-mono uppercase cursor-pointer"
              >
                {t('app.toast.close')}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Compact Luxury Preview Card (Recently Added details) */}
      <AnimatePresence>
        {recentPreview && (
          <motion.div
            id="premium-recently-added-preview"
            initial={{ opacity: 0, x: 50, y: 15 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed md:top-24 md:right-6 bottom-24 left-4 right-4 md:left-auto md:w-[360px] z-[85] bg-zinc-950/95 border border-[#D4AF37]/35 text-white p-4.5 rounded-sm shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_25px_rgba(212,175,55,0.08)] backdrop-blur-md select-none pointer-events-auto"
          >
            <div className="absolute inset-1 pointer-events-none border border-[#D4AF37]/10 rounded-xs"></div>
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
            
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-[8.5px] tracking-[0.45em] text-[#D4AF37] uppercase font-display font-medium">
                {t('app.preview.recently_added', { defaultValue: 'Recently Added' })}
              </span>
              <button 
                onClick={() => setRecentPreview(null)}
                className="text-zinc-500 hover:text-white transition-colors duration-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="relative w-15 h-15 rounded-sm overflow-hidden border border-white/10 flex-shrink-0 bg-neutral-900 shadow-md">
                <SafeImage product={recentPreview.product} alt={recentPreview.product.name} className="w-full h-full object-cover" containerClassName="w-full h-full relative" />
                <div className="absolute inset-0 border border-[#D4AF37]/20 pointer-events-none"></div>
              </div>
              
              <div className="space-y-1 text-left flex-grow min-w-0">
                <h4 className="text-[11px] font-semibold text-white tracking-[0.08em] uppercase truncate font-display">
                  {recentPreview.product.name}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-gold-pure text-[11.5px] font-sans font-bold tracking-normal tabular-nums-fix">
                    {formatCurrency(recentPreview.product.price)} {t('app.sar')}
                  </span>
                  {recentPreview.option && recentPreview.option !== 'Standard' && (
                    <span className="text-[7.5px] px-1.5 py-0.5 bg-white/5 border border-white/5 text-zinc-400 font-display uppercase tracking-widest rounded-xs truncate max-w-[120px]">
                      {recentPreview.option}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-white/5 relative z-10">
              <button
                onClick={() => {
                  setCurrentPage('cart');
                  setRecentPreview(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="py-2.5 px-3 border border-[#D4AF37]/45 hover:border-[#D4AF37] text-black bg-gradient-to-r from-gold-dark to-gold-pure hover:from-[#FFF] hover:to-[#FFF] transition-all duration-350 text-[9.5px] tracking-widest font-display font-bold uppercase rounded-xs cursor-pointer text-center"
              >
                {t('app.preview.view_bag', { defaultValue: 'View Shopping Bag' })}
              </button>
              <button
                onClick={() => setRecentPreview(null)}
                className="py-2.5 px-3 border border-white/10 hover:border-white/30 bg-[#050505] hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all duration-300 text-[9.5px] tracking-widest font-display font-medium uppercase rounded-xs cursor-pointer text-center"
              >
                {t('app.preview.continue', { defaultValue: 'Continue Shopping' })}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EnterpriseNotificationToast
        latestNotification={latestEnterprise}
        onClose={() => setLatestEnterprise(null)}
        onOpenCenter={() => {
          setCurrentPage('dashboard');
          setInitialDashboardTab('notifications');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </>
  );
}
