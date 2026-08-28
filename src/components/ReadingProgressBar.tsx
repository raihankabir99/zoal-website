import React, { useEffect, useState } from 'react';

interface ReadingProgressBarProps {
  /** Optional custom scroll progress percentage (0 - 100). If omitted, calculates scroll progress automatically from window scroll. */
  progress?: number;
  /** Optional custom container className */
  className?: string;
  /** Optional custom inner progress bar fill className */
  barClassName?: string;
}

export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
  progress: externalProgress,
  className = '',
  barClassName = '',
}) => {
  const [internalProgress, setInternalProgress] = useState(0);

  useEffect(() => {
    if (typeof externalProgress === 'number') return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setInternalProgress(currentProgress);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [externalProgress]);

  const activeProgress = typeof externalProgress === 'number' ? externalProgress : internalProgress;

  return (
    <div 
      className={`fixed top-[50px] sm:top-[64px] md:top-[68px] lg:top-[72px] left-0 right-0 h-[3px] bg-white/5 z-[49] pointer-events-none print:hidden ${className}`}
      aria-hidden="true"
    >
      <div 
        className={`h-full bg-gradient-to-r from-gold-dark via-[#D4AF37] to-white transition-all duration-100 ease-out ${barClassName}`}
        style={{ width: `${Math.min(100, Math.max(0, activeProgress))}%` }}
      />
    </div>
  );
};

export default ReadingProgressBar;
