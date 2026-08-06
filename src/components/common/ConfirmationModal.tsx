import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, X, AlertCircle, RefreshCw } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isProcessing?: boolean;
  error?: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isProcessing = false,
  error = null,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-left text-zinc-400 font-sans"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-zinc-950 border border-white/10 rounded-sm max-w-sm w-full p-6 space-y-6 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xs flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-white text-md font-bold uppercase tracking-wider font-display">{title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">{message}</p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/20 border border-rose-950 text-rose-400 text-xs rounded-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 text-[10px] uppercase tracking-widest font-bold">
              <button 
                onClick={() => {
                  console.log("Trace: ConfirmationModal cancel button clicked");
                  onClose();
                }}
                disabled={isProcessing}
                className="w-1/2 bg-transparent border border-white/10 hover:border-white/30 text-zinc-300 hover:text-white py-2.5 rounded-xs cursor-pointer transition-all disabled:opacity-50 font-mono text-center"
              >
                {cancelLabel}
              </button>
              <button 
                onClick={() => {
                  console.log("TRACE 7: Confirm clicked");
                  onConfirm();
                }}
                disabled={isProcessing}
                className="w-1/2 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xs cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)] font-mono"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" /> Processing...
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
