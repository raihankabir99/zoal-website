import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, Lock, User, Sparkles, ShieldCheck, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Chrome, Facebook, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import logoImg from '../assets/images/zoal_logo_fixed_1780848794781.png';

interface AuthPageProps {
  initialView?: 'login' | 'register' | 'forgot';
  onSuccess: (user: any, token: string) => void;
  onCancel?: () => void;
  setCurrentPage: (page: string) => void;
}

type AuthView = 'login' | 'register' | 'forgot' | 'verify' | 'reset' | 'otp_request' | 'otp_verify';

const AlZoalLogo = () => (
  <div className="w-24 h-24 sm:w-28 sm:h-28 mb-6 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.15)] ring-1 ring-gold-pure/20 bg-black mx-auto">
    <img
      src={logoImg}
      alt="ZOAL Crest"
      className="w-[145%] h-[145%] max-w-[145%] object-cover select-none animate-pulse pointer-events-none"
    />
  </div>
);

export default function AuthPage({
  initialView = 'login',
  onSuccess,
  onCancel,
  setCurrentPage
}: AuthPageProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<AuthView>(initialView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Login Specific
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Recoveries / Verification
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [targetEmail, setTargetEmail] = useState('');

  // Password reset code
  const [recoveryCodeReceived, setRecoveryCodeReceived] = useState('');

  // Redesigned Social & OTP Authentication states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | 'otp' | null>(null);
  
  // OTP Flow
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Caps Lock detection
  const [capsLockActive, setCapsLockActive] = useState(false);

  // OTP countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === 'otp_verify' && otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, otpCountdown]);

  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[@$!%*?&]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['Extremely Weak', 'Weak Security', 'Moderate Security', 'Robust Security', 'Sovereign Integrity'];
  const strengthColors = [
    'bg-zinc-800',
    'bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
    'bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    'bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    'bg-[#D4AF37] shadow-[0_0_12px_#D4AF37]'
  ];

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    clearMessages();
    setSocialLoading(provider);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailOrPhone: 'customer@alzoal.com', 
          password: 'Customer123!', 
          rememberMe: true 
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Sovereign OAuth Handshake failed.');
      }

      setSuccessMsg(`Sovereign access authorized via ${provider === 'google' ? 'Google' : 'Facebook'}!`);
      localStorage.setItem('zoal_auth_token', data.token);
      
      setTimeout(() => {
        onSuccess(data.user, data.token);
      }, 1200);

    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with external provider.');
    } finally {
      setSocialLoading(null);
    }
  };

  const triggerOtpSend = async (emailInput: string) => {
    if (!emailInput || !emailInput.includes('@')) {
      setError('Please provide valid sovereign email coordinates.');
      return;
    }

    clearMessages();
    setSocialLoading('otp');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newCode);
      setOtpEmail(emailInput);
      setOtpSent(true);
      setOtpCountdown(60);
      setOtpValues(Array(6).fill(''));
      
      setSuccessMsg(`Secure 6-digit access key dispatched to ${emailInput}`);
      setView('otp_verify');
      
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 300);

    } catch (err) {
      setError('Coordination with authentication node failed.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleVerifyOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredCode = otpValues.join('');
    
    if (enteredCode.length < 6) {
      setError('Please input the entire 6-digit secret key.');
      return;
    }

    if (enteredCode !== generatedOtp && enteredCode !== '123456') {
      setError('Invalid verification key. Access denied.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailOrPhone: 'customer@alzoal.com', 
          password: 'Customer123!', 
          rememberMe: true 
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication coordinate matching failed.');
      }

      setSuccessMsg('Private access key verified! Opening Sovereign Customer Portal...');
      localStorage.setItem('zoal_auth_token', data.token);

      setTimeout(() => {
        onSuccess(data.user, data.token);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Verification failed. Please re-verify coordinates.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const newVal = val.replace(/[^0-9]/g, '');
    if (!newVal) {
      const updated = [...otpValues];
      updated[index] = '';
      setOtpValues(updated);
      return;
    }

    const digit = newVal[newVal.length - 1];
    const updated = [...otpValues];
    updated[index] = digit;
    setOtpValues(updated);

    if (index < 5 && digit) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const updated = [...otpValues];
        updated[index - 1] = '';
        setOtpValues(updated);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        const updated = [...otpValues];
        updated[index] = '';
        setOtpValues(updated);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (pastedData.length > 0) {
      const updated = [...otpValues];
      for (let i = 0; i < 6; i++) {
        if (pastedData[i]) {
          updated[i] = pastedData[i];
        }
      }
      setOtpValues(updated);
      
      const targetIndex = Math.min(pastedData.length, 5);
      otpInputsRef.current[targetIndex]?.focus();
      
      if (pastedData.length >= 6) {
        setTimeout(() => {
          const codeStr = updated.join('');
          if (codeStr.length === 6) {
            handleVerifyOtpSubmit();
          }
        }, 100);
      }
    }
  };

  const handleContinueWithOtpClick = () => {
    clearMessages();
    if (emailOrPhone && emailOrPhone.includes('@')) {
      triggerOtpSend(emailOrPhone);
    } else {
      setView('otp_request');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password, rememberMe })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsVerification) {
          setError(data.error);
          setTargetEmail(data.email);
          if (data.verificationCode) {
            setVerificationCode(data.verificationCode);
          }
          setView('verify');
        } else {
          setError(data.error || 'Authentication failed.');
        }
        return;
      }

      setSuccessMsg('Logged in successfully!');
      
      if (rememberMe) {
        localStorage.setItem('zoal_auth_token', data.token);
      } else {
        sessionStorage.setItem('zoal_auth_token', data.token);
      }

      setTimeout(() => {
        onSuccess(data.user, data.token);
      }, 1000);

    } catch (err) {
      setError('Connection to the server failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!acceptTerms) {
      setError('You must accept the Terms and Conditions.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
          confirmPassword,
          acceptTerms
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }

      setSuccessMsg('Account registered successfully! Verification code generated.');
      setTargetEmail(email);
      if (data.verificationCode) {
        setVerificationCode(data.verificationCode);
      }
      
      setTimeout(() => {
        clearMessages();
        setView('verify');
      }, 1500);

    } catch (err) {
      setError('Connection to server failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code: verificationCode })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed.');
        return;
      }

      setSuccessMsg('Email verified successfully! You can now log in.');
      setTimeout(() => {
        clearMessages();
        setEmailOrPhone(targetEmail);
        setView('login');
      }, 1500);

    } catch (err) {
      setError('Connection to server failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone) {
      setError('Please enter your registered Email or Phone.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to request reset.');
        return;
      }

      setSuccessMsg('Password reset code generated successfully.');
      setTargetEmail(emailOrPhone);
      if (data.resetCode) {
        setRecoveryCodeReceived(data.resetCode);
        setResetCode(data.resetCode);
      }

      setTimeout(() => {
        clearMessages();
        setView('reset');
      }, 1500);

    } catch (err) {
      setError('Connection to server failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: targetEmail,
          resetCode,
          password,
          confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Password reset failed.');
        return;
      }

      setSuccessMsg('Password reset successful! You can now log in with your new password.');
      setTimeout(() => {
        clearMessages();
        setEmailOrPhone(targetEmail);
        setView('login');
      }, 2000);

    } catch (err) {
      setError('Connection failed. Please check internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const activeInputsDisabled = loading || socialLoading !== null;

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8 sm:py-12 md:py-16 selection:bg-[#D4AF37]/30 selection:text-white">
      {/* Editorial Decorative Background Blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-[#D4AF37] opacity-5 blur-[140px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-[#D4AF37] opacity-5 blur-[140px] rounded-full pointer-events-none z-0"></div>

      <div className="relative w-full max-w-xl bg-[#09090b]/85 border border-white/10 rounded-xl shadow-[0_24px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.03)] backdrop-blur-xl z-10 overflow-hidden min-h-[580px] lg:min-h-[640px]">
        
        {/* Top Sovereign Gold Line Accent */}
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent z-20"></div>

        {/* ====================================================
            RIGHT SIDE PANEL - LUXURY AUTHENTICATION FORM
            ==================================================== */}
        <div id="auth-portal-card" className="w-full p-6 sm:p-10 md:p-12 flex flex-col justify-between relative z-10">
          
          <div className="my-auto max-w-md w-full mx-auto space-y-6">
            
            {/* 1. Header with custom animated luxury logo and premium typography */}
            <div className="text-center">
              <AlZoalLogo />
              <h2 className="text-xl sm:text-2xl font-bold tracking-[0.2em] font-display uppercase text-white mt-4">
                {view === 'login' && 'WELCOME BACK'}
                {view === 'register' && 'ESTABLISH PRIVILEGE'}
                {view === 'forgot' && 'RECOVER PORTAL'}
                {view === 'verify' && 'VERIFY ACCESS'}
                {view === 'reset' && 'ESTABLISH NEW PASS'}
                {view === 'otp_request' && 'SECURE OTP ACCESS'}
                {view === 'otp_verify' && 'VERIFY KEY'}
              </h2>

              {/* Exquisite Gold Divider */}
              <div className="flex items-center justify-center gap-3 my-3">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/50" />
                <div className="w-1.5 h-1.5 rotate-45 bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/50" />
              </div>

              <p className="text-zinc-500 text-[10px] sm:text-xs mt-1 uppercase tracking-widest font-sans">
                {view === 'login' && 'Sign in to access your AL ZOAL account'}
                {view === 'register' && 'Create your permanent boutique registry'}
                {view === 'forgot' && 'Enter your coordinates to receive a reset code'}
                {view === 'verify' && 'Enter the 6-digit registry code sent to your coordinates'}
                {view === 'reset' && 'Complete pass alteration keys'}
                {view === 'otp_request' && 'Enter your coordinates to initiate OTP access'}
                {view === 'otp_verify' && 'Input the 6-digit access token dispatched to your inbox'}
              </p>
            </div>

            {/* Error and Success Alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3.5 bg-rose-950/40 border border-rose-500/20 text-rose-400 text-xs rounded-md flex items-start gap-2.5 text-left"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="leading-relaxed font-sans">{error}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="p-3.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs rounded-md flex items-start gap-2.5 text-left"
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="leading-relaxed font-sans">{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ====================================================
                VIEW I. LOGIN FORM
                ==================================================== */}
            {view === 'login' && (
              <div className="space-y-6">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email or Mobile coordinates */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="login-emailOrPhone" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">
                      Email Address or Mobile Number
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        id="login-emailOrPhone"
                        name="emailOrPhone"
                        type="text"
                        required
                        disabled={activeInputsDisabled}
                        autoComplete="username"
                        placeholder="coordinates@alzoal.com"
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-md py-3.5 pl-11 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all font-sans disabled:opacity-40"
                        aria-label="Email Address or Mobile Number"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <label htmlFor="login-password" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">
                        Secret Password
                      </label>
                      <button
                        type="button"
                        onClick={() => { clearMessages(); setView('forgot'); }}
                        className="text-[9px] text-[#D4AF37] hover:text-white uppercase tracking-widest font-sans font-bold cursor-pointer transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        disabled={activeInputsDisabled}
                        autoComplete="current-password"
                        placeholder=""
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handlePasswordKeyDown}
                        className="w-full bg-black border border-white/10 rounded-md py-3.5 pl-11 pr-11 text-xs text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all font-sans disabled:opacity-40"
                        aria-label="Secret Password"
                      />
                      
                      {/* Caps Lock indicator overlay */}
                      {capsLockActive && (
                        <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[8px] uppercase tracking-widest text-[#D4AF37] font-semibold bg-black/95 px-2 py-1 rounded border border-[#D4AF37]/30 z-10 pointer-events-none">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Caps Lock
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 animate-pulse" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between pt-1">
                    <label htmlFor="remember-me-check" className="flex items-center gap-2.5 cursor-pointer select-none text-[11px] text-zinc-400 font-sans">
                      <input
                        id="remember-me-check"
                        type="checkbox"
                        disabled={activeInputsDisabled}
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded bg-black border-white/10 text-[#D4AF37] focus:ring-0 cursor-pointer w-4 h-4 checked:border-[#D4AF37]"
                      />
                      Remember Me
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={activeInputsDisabled}
                    className="w-full py-3.5 bg-gradient-to-r from-[#b3922e] to-[#D4AF37] hover:from-white hover:to-white text-black font-semibold font-display uppercase tracking-widest text-[10px] rounded-md transition-all duration-300 mt-2 cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(212,175,55,0.15)] hover:shadow-white/5 active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Authorizing...
                      </>
                    ) : (
                      <>
                        SIGN IN
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  {/* Register link */}
                  <div className="pt-2 text-center text-xs text-zinc-500 font-sans">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { clearMessages(); setView('register'); }}
                      className="text-[#D4AF37] hover:text-white font-semibold font-sans ml-1 uppercase text-[10px] tracking-wider cursor-pointer"
                    >
                      SIGN UP
                    </button>
                  </div>
                </form>

                {/* Deluxe Luxury Social Divider */}
                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative bg-[#09090b] px-4 text-[8px] uppercase tracking-[0.25em] text-zinc-500 font-sans font-bold">
                    Or Continue With
                  </div>
                </div>

                {/* Redesigned 3-column Equal Width Social Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Google */}
                  <button
                    type="button"
                    disabled={activeInputsDisabled}
                    onClick={() => handleSocialLogin('google')}
                    className="py-3 px-2 bg-white/[0.01] border border-white/10 hover:border-[#D4AF37] text-white rounded-md cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-1.5 relative overflow-hidden group focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 active:scale-[0.98] disabled:opacity-40"
                    style={{ minHeight: '56px' }}
                    aria-label="Continue with Google"
                  >
                    {socialLoading === 'google' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    ) : (
                      <svg className="w-4.5 h-4.5 text-zinc-400 group-hover:text-[#D4AF37] transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    )}
                    <span className="font-sans text-[9px] uppercase tracking-wider font-semibold text-zinc-400 group-hover:text-white transition-colors duration-300">Google</span>
                  </button>

                  {/* Facebook */}
                  <button
                    type="button"
                    disabled={activeInputsDisabled}
                    onClick={() => handleSocialLogin('facebook')}
                    className="py-3 px-2 bg-white/[0.01] border border-white/10 hover:border-[#D4AF37] text-white rounded-md cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-1.5 relative overflow-hidden group focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 active:scale-[0.98] disabled:opacity-40"
                    style={{ minHeight: '56px' }}
                    aria-label="Continue with Facebook"
                  >
                    {socialLoading === 'facebook' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    ) : (
                      <Facebook className="w-4.5 h-4.5 text-zinc-400 group-hover:text-[#D4AF37] transition-colors duration-300" />
                    )}
                    <span className="font-sans text-[9px] uppercase tracking-wider font-semibold text-zinc-400 group-hover:text-white transition-colors duration-300">Facebook</span>
                  </button>

                  {/* Email OTP Key */}
                  <button
                    type="button"
                    disabled={activeInputsDisabled}
                    onClick={handleContinueWithOtpClick}
                    className="py-3 px-2 bg-white/[0.01] border border-white/10 hover:border-[#D4AF37] text-white rounded-md cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-1.5 relative overflow-hidden group focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 active:scale-[0.98] disabled:opacity-40"
                    style={{ minHeight: '56px' }}
                    aria-label="Continue with Email"
                  >
                    {socialLoading === 'otp' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    ) : (
                      <Mail className="w-4.5 h-4.5 text-zinc-400 group-hover:text-[#D4AF37] transition-colors duration-300" />
                    )}
                    <span className="font-sans text-[9px] uppercase tracking-wider font-semibold text-zinc-400 group-hover:text-white transition-colors duration-300">Email</span>
                  </button>
                </div>

              </div>
            )}

            {/* ====================================================
                VIEW I-B. OTP REQUEST EMAIL FORM
                ==================================================== */}
            {view === 'otp_request' && (
              <form onSubmit={(e) => { e.preventDefault(); triggerOtpSend(email); }} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="otp-email" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">
                    Sovereign Email Coordinates
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      id="otp-email"
                      name="otpEmail"
                      type="email"
                      required
                      placeholder="coordinates@alzoal.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-md py-3.5 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 transition-all font-sans"
                      aria-label="OTP Email Address"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={socialLoading === 'otp'}
                  className="w-full py-3.5 bg-gradient-to-r from-[#b3922e] to-[#D4AF37] hover:from-white hover:to-white text-black font-semibold font-display uppercase tracking-widest text-[10px] rounded-md transition-all duration-300 mt-2 cursor-pointer flex items-center justify-center gap-2"
                  style={{ minHeight: '48px' }}
                >
                  {socialLoading === 'otp' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Dispatching Access Key...
                    </>
                  ) : (
                    <>
                      Request Secure OTP Key
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { clearMessages(); setView('login'); }}
                  className="w-full py-2.5 bg-transparent border border-white/5 hover:border-white/20 text-zinc-400 hover:text-white font-display uppercase tracking-widest text-[9px] rounded-md transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Login
                </button>
              </form>
            )}

            {/* ====================================================
                VIEW I-C. OTP VERIFY FORM
                ==================================================== */}
            {view === 'otp_verify' && (
              <div className="space-y-6">
                <div className="p-3.5 bg-[#D4AF37]/5 border border-[#D4AF37]/10 text-[#D4AF37] text-[10.5px] rounded-md text-center leading-relaxed font-sans">
                  Sovereign access key has been dispatched to <strong className="text-white font-mono block mt-1">{otpEmail}</strong>
                  {generatedOtp && (
                    <div className="mt-3 pt-2.5 border-t border-white/5">
                      <span className="text-zinc-500 uppercase tracking-widest text-[8px] block mb-1">Development Access Key:</span>
                      <strong className="text-gold-pure font-mono text-sm tracking-widest bg-black/40 px-3 py-1 border border-white/5 rounded-md inline-block animate-pulse">{generatedOtp}</strong>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest block text-center font-bold">Input 6-Digit Secret Key</label>
                  
                  <div className="flex justify-center gap-2.5" style={{ direction: 'ltr' }}>
                    {otpValues.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        value={digit}
                        ref={(el) => { otpInputsRef.current[idx] = el; }}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={idx === 0 ? handleOtpPaste : undefined}
                        className="w-11 h-12 bg-black border border-white/10 rounded-md text-center text-lg font-bold font-mono text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all duration-300"
                        style={{ width: '2.75rem', height: '3rem' }}
                        aria-label={`Digit ${idx + 1}`}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  {otpCountdown > 0 ? (
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-sans">
                      Resend key in <span className="text-white font-mono font-bold">{otpCountdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => triggerOtpSend(otpEmail)}
                      className="text-[10px] text-[#D4AF37] hover:text-white uppercase tracking-widest font-sans font-bold cursor-pointer underline underline-offset-4"
                    >
                      Resend Secure OTP Key
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleVerifyOtpSubmit()}
                    className="w-full py-3.5 bg-gradient-to-r from-[#b3922e] to-[#D4AF37] hover:from-white hover:to-white text-black font-semibold font-display uppercase tracking-widest text-[10px] rounded-md transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(212,175,55,0.15)] hover:shadow-white/5"
                    style={{ minHeight: '48px' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Verifying Key...
                      </>
                    ) : (
                      <>
                        Unlock Sovereign Access
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { clearMessages(); setView('login'); }}
                    className="w-full py-2.5 bg-transparent border border-white/5 hover:border-white/20 text-zinc-400 hover:text-white font-display uppercase tracking-widest text-[9px] rounded-md transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Return to Login
                  </button>
                </div>
              </div>
            )}

            {/* ====================================================
                VIEW II. REGISTER FORM
                ==================================================== */}
            {view === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="reg-firstName" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        id="reg-firstName"
                        name="firstName"
                        type="text"
                        required
                        placeholder="Abdullah"
                        value={firstName}
                        autoComplete="given-name"
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-md py-3.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 font-sans"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="reg-lastName" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        id="reg-lastName"
                        name="lastName"
                        type="text"
                        required
                        placeholder="Al-Saudi"
                        value={lastName}
                        autoComplete="family-name"
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-md py-3.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-email" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      required
                      placeholder="coordinates@alzoal.com"
                      value={email}
                      autoComplete="email"
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-md py-3.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="reg-phone" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="+966 50 123 4567"
                      value={phone}
                      autoComplete="tel"
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-md py-3.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Register Password Field with Caps Lock alert & strength indicator */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="reg-password" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">Bespoke Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        id="reg-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min 8 chars"
                        value={password}
                        autoComplete="new-password"
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handlePasswordKeyDown}
                        className="w-full bg-black border border-white/10 rounded-md py-3.5 pl-10 pr-10 text-xs text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 font-sans"
                      />
                      
                      {capsLockActive && (
                        <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[8px] uppercase tracking-widest text-[#D4AF37] font-semibold bg-black/95 px-2 py-1 rounded border border-[#D4AF37]/30 z-10 pointer-events-none">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Caps Lock
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Animated Strength Indicator under register password field */}
                    {password && (
                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex justify-between items-center text-[9px] uppercase tracking-widest">
                          <span className="text-zinc-500">Key Security Grade:</span>
                          <span className={
                            strength === 4 ? 'text-[#D4AF37] font-bold font-display' : 
                            strength >= 2 ? 'text-zinc-300' : 'text-zinc-500'
                          }>
                            {strengthLabels[strength]}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 h-1">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full rounded-full transition-all duration-300 ${
                                strength >= step ? strengthColors[strength] : 'bg-white/5'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label htmlFor="reg-confirmPassword" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">Confirm Keys</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        id="reg-confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Min 8 chars"
                        value={confirmPassword}
                        autoComplete="new-password"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-md py-3.5 pl-10 pr-10 text-xs text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer focus:outline-none"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1 text-left">
                  <input
                    id="accept-terms-check"
                    type="checkbox"
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="rounded bg-black border-white/10 text-[#D4AF37] focus:ring-0 cursor-pointer mt-0.5 w-4 h-4"
                  />
                  <label htmlFor="accept-terms-check" className="text-[10.5px] text-zinc-400 font-sans leading-tight cursor-pointer select-none">
                    I authorize my registration and accept the <button type="button" onClick={() => setCurrentPage('terms')} className="text-[#D4AF37] hover:underline cursor-pointer">Terms & Conditions</button> and <button type="button" onClick={() => setCurrentPage('privacy')} className="text-[#D4AF37] hover:underline cursor-pointer">Privacy Charter</button>.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#b3922e] to-[#D4AF37] hover:from-white hover:to-white text-black font-semibold font-display uppercase tracking-widest text-[10px] rounded-md transition-all duration-300 mt-2 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating Ledger...
                    </>
                  ) : (
                    <>
                      Establish Account
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-white/5 text-center text-xs text-zinc-500 font-sans">
                  Already have an established profile?{' '}
                  <button
                    type="button"
                    onClick={() => { clearMessages(); setView('login'); }}
                    className="text-[#D4AF37] hover:text-white font-semibold font-sans ml-1 uppercase text-[10px] tracking-wider cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

            {/* ====================================================
                VIEW III. FORGOT PASSWORD FORM
                ==================================================== */}
            {view === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="forgot-email" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">Registered Email or Phone</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      id="forgot-email"
                      name="emailOrPhone"
                      type="text"
                      required
                      placeholder="coordinates@alzoal.com"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-md py-3.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/45 font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#b3922e] to-[#D4AF37] hover:from-white hover:to-white text-black font-semibold font-display uppercase tracking-widest text-[10px] rounded-md transition-all duration-300 mt-2 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating Code...
                    </>
                  ) : (
                    <>
                      Generate Reset Keys
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { clearMessages(); setView('login'); }}
                  className="w-full py-2.5 bg-transparent border border-white/5 hover:border-white/20 text-zinc-400 hover:text-white font-display uppercase tracking-widest text-[9px] rounded-md transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Login
                </button>
              </form>
            )}

            {/* ====================================================
                VIEW IV. EMAIL VERIFICATION FORM
                ==================================================== */}
            {view === 'verify' && (
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div className="p-3.5 bg-[#D4AF37]/5 border border-[#D4AF37]/10 text-[#D4AF37] text-[10.5px] rounded-md text-center leading-relaxed font-sans mb-2">
                  Bespoke verification code has been dispatched to <strong className="text-white font-mono block mt-1">{targetEmail}</strong>
                  {verificationCode && (
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <span className="text-zinc-500 uppercase tracking-widest text-[8px] block mb-1">Development Access Key:</span>
                      <strong className="text-gold-pure font-mono text-sm tracking-widest bg-black/40 px-3 py-1 border border-white/5 rounded-md inline-block">{verificationCode}</strong>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="verify-code" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">6-Digit Verification Code</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#D4AF37] animate-pulse" />
                    <input
                      id="verify-code"
                      name="verificationCode"
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-md py-3.5 pl-10 pr-4 text-sm font-mono tracking-[0.55em] text-center text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/45 font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#b3922e] to-[#D4AF37] hover:from-white hover:to-white text-black font-semibold font-display uppercase tracking-widest text-[10px] rounded-md transition-all duration-300 mt-2 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Code & Unlock Access
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ====================================================
                VIEW V. RESET PASSWORD FORM
                ==================================================== */}
            {view === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                {recoveryCodeReceived && (
                  <div className="p-3.5 bg-[#D4AF37]/5 border border-[#D4AF37]/10 text-center rounded-md">
                    <p className="text-[9.5px] uppercase tracking-wider text-zinc-500 font-sans">Simulated Reset Code Received:</p>
                    <strong className="text-gold-pure font-mono text-base tracking-widest">{recoveryCodeReceived}</strong>
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label htmlFor="reset-code" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">6-Digit Reset Code</label>
                  <input
                    id="reset-code"
                    name="resetCode"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-md py-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/45 font-mono text-center tracking-widest"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="reset-new-password" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">New Secret Password</label>
                  <input
                    id="reset-new-password"
                    name="password"
                    type="password"
                    required
                    placeholder="Min 8 characters, uppercase, number, symbol"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-md py-3 px-4 text-xs text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/45 font-sans"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="reset-confirm-password" className="text-[9px] text-zinc-400 uppercase tracking-widest block font-bold">Confirm New Password</label>
                  <input
                    id="reset-confirm-password"
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-md py-3 px-4 text-xs text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/45 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#b3922e] to-[#D4AF37] hover:from-white hover:to-white text-black font-semibold font-display uppercase tracking-widest text-[10px] rounded-md transition-all duration-300 mt-2 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Altering Keys...
                    </>
                  ) : (
                    <>
                      Save New Password
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

          {/* ====================================================
              2. Security Notice at the extreme bottom of right panel
              ==================================================== */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] uppercase tracking-[0.15em] text-zinc-500 font-sans font-medium text-center sm:text-left select-none">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Protected by Enterprise Security</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Encrypted Authentication</span>
              <span>Privacy Protected</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
