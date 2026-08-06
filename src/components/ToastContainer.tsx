import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, CheckCircle } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  submessage: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 max-w-sm w-full pointer-events-none pr-4 md:pr-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.93, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.3 } }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="bg-black/95 border border-[#D4AF37]/35 text-white p-4.5 rounded-sm shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.08)] backdrop-blur-md flex items-start justify-between gap-3.5 pointer-events-auto relative select-none w-full"
          >
            {/* Elegant Double Border Accent */}
            <div className="absolute inset-1 pointer-events-none border border-[#D4AF37]/5 rounded-xs"></div>
            {/* Top decorative gold bar */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                ✓
              </div>
              <div className="space-y-1 text-left">
                <h4 className="text-[11.5px] font-semibold text-white font-display tracking-wide uppercase leading-tight">
                  {toast.message}
                </h4>
                <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                  {toast.submessage}
                </p>
              </div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 text-zinc-500 hover:text-[#D4AF37] transition-colors cursor-pointer rounded-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
