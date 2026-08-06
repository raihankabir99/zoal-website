import React from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface EnterpriseNotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isOnline: boolean;
  connectionStatus: string;
  currentUser?: { name: string; email: string; role?: string } | null;
}

export default function EnterpriseNotificationBell({
  unreadCount,
  onClick,
  soundEnabled,
  setSoundEnabled,
  isOnline,
  connectionStatus,
  currentUser,
}: EnterpriseNotificationBellProps) {
  const { t } = useTranslation();

  // 1. Guest Users (unauthenticated): Hide Bell, Hide Badge, Hide Drawer
  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex items-center">
      {/* Notification Bell */}
      <button
        onClick={onClick}
        className="relative p-2 text-zinc-300 hover:text-[#D4AF37] transition-colors duration-300 cursor-pointer group"
        title={t('notifications.center_title', 'Enterprise Notification Center')}
      >
        <Bell className="w-5 h-5 stroke-[1.5] group-hover:scale-105 transition-transform" />
        
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-0.5 -right-0.5 bg-[#D4AF37] text-black text-[9px] font-sans font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.6)]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
