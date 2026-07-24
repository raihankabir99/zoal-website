import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

export function PasswordStrengthIndicator({ password = '' }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  // Evaluation criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const checklist = [
    { label: 'At least 8 characters', satisfied: hasMinLength },
    { label: 'One uppercase letter', satisfied: hasUppercase },
    { label: 'One lowercase letter', satisfied: hasLowercase },
    { label: 'One number', satisfied: hasNumber },
    { label: 'One special character', satisfied: hasSpecial },
  ];

  // Strong criteria: 8+ chars AND uppercase AND lowercase AND number AND special character
  const isStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  // Medium criteria: 8+ chars AND letters AND numbers
  const hasLetters = /[a-zA-Z]/.test(password);
  const isMedium = !isStrong && hasMinLength && hasLetters && hasNumber;

  let strengthLabel = 'Weak Password';
  let strengthColorClass = 'text-red-500';
  let progressColorClass = 'bg-red-500';
  let progressWidth = '25%';

  if (isStrong) {
    strengthLabel = 'Strong Password';
    strengthColorClass = 'text-emerald-400';
    progressColorClass = 'bg-emerald-400';
    progressWidth = '100%';
  } else if (isMedium) {
    strengthLabel = 'Medium Password';
    strengthColorClass = 'text-gold-pure';
    progressColorClass = 'bg-gold-pure';
    progressWidth = '60%';
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-2.5 space-y-3 overflow-hidden text-left"
    >
      {/* Header and Label */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-zinc-500 font-mono tracking-wider uppercase">Strength:</span>
        <span 
          aria-live="polite" 
          className={`font-mono uppercase tracking-wider font-bold ${strengthColorClass}`}
        >
          {strengthLabel}
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-white/5">
        <div 
          className={`h-full transition-all duration-300 ease-out ${progressColorClass}`}
          style={{ width: progressWidth }}
        />
      </div>

      {/* Checklist */}
      <div className="space-y-1.5 pl-0.5">
        <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase block mb-1">
          Security Requirements:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
          {checklist.map((item, idx) => (
            <div 
              key={idx} 
              className={`flex items-center gap-1.5 transition-colors duration-200 ${
                item.satisfied ? 'text-emerald-400 font-medium' : 'text-zinc-500'
              }`}
            >
              {item.satisfied ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 shrink-0 stroke-[1.5]" />
              )}
              <span className="truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Helper text */}
      <AnimatePresence>
        {!isStrong && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[10px] text-zinc-400 font-sans leading-relaxed pt-1 border-t border-white/5"
          >
            Use at least 8 characters including uppercase, lowercase, number and special character.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
