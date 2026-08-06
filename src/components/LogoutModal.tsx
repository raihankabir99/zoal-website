import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  status: 'confirm' | 'loading' | 'success';
  onClose: () => void;
  onConfirm: () => void;
  onSuccessRedirect: () => void;
}

export default function LogoutModal({
  isOpen,
  status,
  onClose,
  onConfirm,
  onSuccessRedirect,
}: LogoutModalProps) {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the primary button when modal opens or status changes
  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure the DOM element is rendered and interactive
      const timer = setTimeout(() => {
        primaryButtonRef.current?.focus();
      }, 80, { name: 'Focus Primary Button' });
      return () => clearTimeout(timer);
    }
  }, [isOpen, status]);

  // Handle keyboard accessibility: Escape closes, Enter triggers primary button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        if (status === 'confirm') {
          onClose();
        } else if (status === 'success') {
          onSuccessRedirect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, status, onClose, onSuccessRedirect]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        onClick={() => {
          if (status === 'confirm') {
            onClose();
          } else if (status === 'success') {
            onSuccessRedirect();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        aria-describedby="logout-modal-description"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-sm w-full bg-zinc-950/95 border border-[#D4AF37]/35 rounded-sm p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(212,175,55,0.1)] text-center select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Luxury Double Gold Border Frame */}
          <div className="absolute inset-1 pointer-events-none border border-[#D4AF37]/10 rounded-xs"></div>
          {/* Top Decorative Gold Bar Accent */}
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

          {/* Close button (only visible in confirm state) */}
          {status === 'confirm' && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-[#D4AF37] p-1.5 transition-colors cursor-pointer rounded-xs border border-transparent hover:border-white/5 active:scale-95 duration-200"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* CONTENT ACCORDING TO STATE */}
          {status === 'confirm' && (
            <div className="flex flex-col items-center">
              {/* Premium Icon Header */}
              <div className="w-14 h-14 bg-[#D4AF37]/5 rounded-full border border-[#D4AF37]/15 flex items-center justify-center mb-5 relative">
                <span className="absolute inset-0 rounded-full bg-[#D4AF37]/5 animate-pulse"></span>
                <LogOut className="w-6 h-6 text-[#D4AF37]" />
              </div>

              {/* Title & Message */}
              <h2
                id="logout-modal-title"
                className="text-base sm:text-lg font-display font-semibold text-white uppercase tracking-wider mb-3 font-sans"
              >
                Sign Out
              </h2>
              <div
                id="logout-modal-description"
                className="text-zinc-400 text-[11px] leading-relaxed max-w-xs mb-6 font-sans space-y-2"
              >
                <p>Are you sure you want to sign out of your ZOAL account?</p>
                <p className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
                  Your account and personal information will remain secure.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <button
                  ref={primaryButtonRef}
                  onClick={onConfirm}
                  className="w-full py-2.5 px-4 border border-[#D4AF37]/45 hover:border-[#D4AF37] text-black bg-gradient-to-r from-[#C5A049] to-[#D4AF37] hover:from-white hover:to-white transition-all duration-350 text-[9.5px] tracking-widest font-display font-bold uppercase rounded-xs cursor-pointer text-center"
                >
                  Sign Out
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 border border-white/10 hover:border-white/30 bg-[#050505] hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all duration-300 text-[9.5px] tracking-widest font-display font-medium uppercase rounded-xs cursor-pointer text-center"
                >
                  Stay Signed In
                </button>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center py-4">
              {/* Spinning Loader */}
              <div className="w-14 h-14 bg-[#D4AF37]/5 rounded-full border border-[#D4AF37]/10 flex items-center justify-center mb-5 relative">
                <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
              </div>

              {/* Title & Message */}
              <h2
                id="logout-modal-title"
                className="text-base sm:text-lg font-display font-semibold text-white uppercase tracking-wider mb-3 font-sans"
              >
                Signing You Out...
              </h2>
              <p
                id="logout-modal-description"
                className="text-zinc-400 text-[11px] leading-relaxed font-sans"
              >
                Please wait while we securely sign you out.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center">
              {/* Shield Check Premium Icon */}
              <div className="w-14 h-14 bg-emerald-500/5 rounded-full border border-emerald-500/15 flex items-center justify-center mb-5 relative">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>

              {/* Title & Message */}
              <h2
                id="logout-modal-title"
                className="text-base sm:text-lg font-display font-semibold text-white uppercase tracking-wider mb-3 font-sans"
              >
                You're Signed Out
              </h2>
              <div
                id="logout-modal-description"
                className="text-zinc-400 text-[11px] leading-relaxed max-w-xs mb-6 font-sans space-y-1.5"
              >
                <p>You have successfully signed out of your ZOAL account.</p>
                <p className="text-zinc-500">Thank you for visiting.</p>
                <p className="text-zinc-500">We look forward to welcoming you back.</p>
              </div>

              {/* Action Button */}
              <button
                ref={primaryButtonRef}
                onClick={onSuccessRedirect}
                className="w-full py-2.5 px-4 border border-[#D4AF37]/45 hover:border-[#D4AF37] text-black bg-gradient-to-r from-[#C5A049] to-[#D4AF37] hover:from-white hover:to-white transition-all duration-350 text-[9.5px] tracking-widest font-display font-bold uppercase rounded-xs cursor-pointer text-center"
              >
                Return to Home
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
