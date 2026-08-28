import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EnterpriseNotification } from '../types/notification';

interface EnterpriseNotificationToastProps {
  latestNotification: EnterpriseNotification | null;
  onClose: () => void;
  onOpenCenter: () => void;
}

export default function EnterpriseNotificationToast({
  latestNotification,
  onClose,
  onOpenCenter,
}: EnterpriseNotificationToastProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!latestNotification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [latestNotification, onClose]);

  return (
    <AnimatePresence>
      {latestNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          className="fixed top-20 right-6 z-[100] max-w-sm w-full bg-[#0e0e12] border border-[#D4AF37]/40 shadow-[0_10px_30px_rgba(0,0,0,0.8)] rounded-xs p-4 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]" />
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-black/80 border border-white/10 text-[#D4AF37] rounded-xs">
                    {latestNotification.category}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">{t('notifications.just_now', 'Just now')}</span>
                </div>
                <h4 className="text-xs font-semibold text-white font-sans">
                  {latestNotification.title}
                </h4>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed line-clamp-2">
                  {latestNotification.message}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
            <button
              onClick={() => {
                onClose();
                onOpenCenter();
              }}
              className="text-[#D4AF37] hover:underline cursor-pointer"
            >
              {t('notifications.view_in_center', 'View in Notification Center')} →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
