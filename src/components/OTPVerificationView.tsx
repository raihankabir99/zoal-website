import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Loader2, ArrowRight, Lock, RotateCcw, AlertCircle } from 'lucide-react';

interface OTPVerificationViewProps {
  email: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  loading: boolean;
  error: string | null;
  success: string | null;
}

export const OTPVerificationView: React.FC<OTPVerificationViewProps> = ({
  email,
  onVerify,
  onResend,
  loading,
  error,
  success,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(600); // 10 minutes
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const data = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(data)) return;
    const newOtp = data.split('');
    setOtp(newOtp);
    onVerify(data);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 w-full max-w-sm mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display text-white tracking-tight">Sovereign Verification</h2>
        <p className="text-zinc-400 text-xs font-sans">
          Enter the bespoke 6-digit code dispatched to <br />
          <span className="text-[#D4AF37] font-mono">{email.replace(/(?<=^.{2}).(?=.*@)/g, '*')}</span>
        </p>
      </div>

      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-12 h-14 bg-white/5 border border-white/10 rounded-lg text-center text-xl text-white font-mono focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all"
          />
        ))}
      </div>

      <button
        onClick={() => onVerify(otp.join(''))}
        disabled={loading || otp.some(d => !d)}
        className="w-full py-4 bg-gradient-to-r from-[#b3922e] to-[#D4AF37] text-black font-semibold uppercase tracking-widest text-[10px] rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Unlock'}
      </button>

      <div className="text-center text-[10px] text-zinc-500 space-y-2">
        <p>Code expires in <span className="text-white font-mono">{formatTime(timer)}</span></p>
        <button 
          onClick={onResend} 
          disabled={timer > 0} 
          className="text-[#D4AF37] hover:underline disabled:text-zinc-600 flex items-center justify-center gap-1 mx-auto"
        >
          <RotateCcw className="w-3 h-3" /> Resend Code
        </button>
      </div>

      <div className="border-t border-white/5 pt-6 grid grid-cols-2 gap-4 text-[9px] text-zinc-600 font-sans uppercase tracking-wider">
        <div className="flex items-center gap-2"><Lock className="w-3 h-3" /> AES-256 Secured</div>
        <div className="flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> SSL Protected</div>
      </div>
    </motion.div>
  );
};
