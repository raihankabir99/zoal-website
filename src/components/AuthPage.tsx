import React, { useState } from 'react';
import { Mail, Phone, Lock, User, Sparkles, ShieldCheck, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface AuthPageProps {
  initialView?: 'login' | 'register' | 'forgot';
  onSuccess: (user: any, token: string) => void;
  onCancel?: () => void;
  setCurrentPage: (page: string) => void;
}

type AuthView = 'login' | 'register' | 'forgot' | 'verify' | 'reset';

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

  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
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
          // Auto-fill code if present in response (for development ease)
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
      
      // Store token based on Remember Me
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

    // Password validation: minimum 8 chars, 1 uppercase, 1 number, 1 special character
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

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20 flex items-center justify-center relative overflow-hidden px-4">
      {/* Editorial Decorative Overlays */}
      <div className="absolute top-[-100px] left-[-100px] w-[350px] h-[350px] bg-[#D4AF37] opacity-5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] bg-[#D4AF37] opacity-5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <div className="relative w-full max-w-lg bg-zinc-950/60 border border-white/10 p-8 sm:p-10 rounded-sm shadow-[0_24px_60px_rgba(0,0,0,0.9),0_0_20px_rgba(212,175,55,0.04)] backdrop-blur-md z-10">
        {/* Top Gold Line Accent */}
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
        {/* Double Inner Frame Accent */}
        <div className="absolute inset-1 pointer-events-none border border-[#D4AF37]/5 rounded-xs"></div>

        <div className="text-center pb-6">
          <Sparkles className="w-9 h-9 text-[#D4AF37] mx-auto mb-3 animate-pulse" />
          <h2 className="text-xl sm:text-2xl font-bold tracking-[0.2em] font-display uppercase text-white">
            {view === 'login' && 'SOVEREIGN PORTAL'}
            {view === 'register' && 'ESTABLISH PRIVILEGE'}
            {view === 'forgot' && 'RECOVER PORTAL'}
            {view === 'verify' && 'VERIFY ACCESS'}
            {view === 'reset' && 'ESTABLISH NEW PASS'}
          </h2>
          <div className="w-10 h-[1px] bg-[#D4AF37]/50 mx-auto mt-2.5" />
          <p className="text-zinc-500 text-[10px] sm:text-xs mt-3 uppercase tracking-widest font-sans">
            {view === 'login' && 'Authorize your credentials for premium access'}
            {view === 'register' && 'Create your permanent private boutique registry'}
            {view === 'forgot' && 'Enter your coordinates to receive a reset code'}
            {view === 'verify' && 'Enter the 6-digit registry code sent to your coordinates'}
            {view === 'reset' && 'Complete pass alteration keys'}
          </p>
        </div>

        {/* Notifications Bar */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 bg-rose-950/40 border border-rose-500/20 text-rose-400 text-xs rounded-sm mb-5 flex items-start gap-2.5 text-left rtl:text-right"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs rounded-sm mb-5 flex items-start gap-2.5 text-left rtl:text-right"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="leading-relaxed">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* I. LOGIN FORM */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Email Address or Phone:</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder=""
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full bg-black/80 border border-white/10 rounded-xs py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45 transition-colors font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Secret Password:</label>
                <button
                  type="button"
                  onClick={() => { clearMessages(); setView('forgot'); }}
                  className="text-[9px] text-[#D4AF37] hover:text-white uppercase tracking-widest font-sans font-semibold cursor-pointer"
                >
                  Forgot Code?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/80 border border-white/10 rounded-xs py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45 transition-colors font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[10.5px] text-zinc-400 font-sans">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-xs bg-black border-white/10 text-[#D4AF37] focus:ring-0 cursor-pointer w-4.5 h-4.5"
                />
                Remember Me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white text-black font-semibold font-display uppercase tracking-widest text-[10px] rounded-xs transition-all duration-300 mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Authorizing...
                </>
              ) : (
                <>
                  Authenticate Access
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="pt-4 border-t border-white/5 text-center text-xs text-zinc-500 font-sans">
              Don't have a private account?{' '}
              <button
                type="button"
                onClick={() => { clearMessages(); setView('register'); }}
                className="text-[#D4AF37] hover:text-white font-semibold font-sans ml-1 uppercase text-[10px] tracking-wider cursor-pointer"
              >
                Establish Profile
              </button>
            </div>

            {/* Quick Helper Credentials Seeding info box */}
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xs mt-4 text-[10px] text-zinc-500 leading-relaxed text-left">
              <strong className="text-gold-pure block uppercase tracking-wider mb-1 font-display">Sovereign Testing Roster:</strong>
              • Admin: <span className="text-zinc-300 font-mono">alzoal3003@gmail.com</span> / <span className="text-zinc-300 font-mono">Admin123!</span><br />
              • Staff: <span className="text-zinc-300 font-mono">staff@alzoal.com</span> / <span className="text-zinc-300 font-mono">Staff123!</span><br />
              • Customer: <span className="text-zinc-300 font-mono">customer@alzoal.com</span> / <span className="text-zinc-300 font-mono">Customer123!</span>
            </div>
          </form>
        )}

        {/* II. REGISTER FORM */}
        {view === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">First Name:</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-black/80 border border-white/10 rounded-xs py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45 font-sans"
                  />
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Last Name:</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-black/80 border border-white/10 rounded-xs py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45 font-sans"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Email coordinates:</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/80 border border-white/10 rounded-xs py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45 font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Phone number:</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="tel"
                  required
                  placeholder=""
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/80 border border-white/10 rounded-xs py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45 font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Bespoke Password:</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="Min 8 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/80 border border-white/10 rounded-xs py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45 font-sans"
                  />
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Confirm Keys:</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="Min 8 chars"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black/80 border border-white/10 rounded-xs py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45 font-sans"
                  />
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
                className="rounded-xs bg-black border-white/10 text-[#D4AF37] focus:ring-0 cursor-pointer mt-0.5 w-4.5 h-4.5"
              />
              <label htmlFor="accept-terms-check" className="text-[10.5px] text-zinc-400 font-sans leading-tight cursor-pointer select-none">
                I authorize my registration and accept the <button type="button" onClick={() => setCurrentPage('terms')} className="text-[#D4AF37] hover:underline cursor-pointer">Terms & Conditions</button> and <button type="button" onClick={() => setCurrentPage('privacy')} className="text-[#D4AF37] hover:underline cursor-pointer">Privacy Charter</button>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white text-black font-semibold font-display uppercase tracking-widest text-[10px] rounded-xs transition-all duration-300 mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating Ledger...
                </>
              ) : (
                <>
                  Establish Private Account
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

        {/* III. FORGOT PASSWORD FORM */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Enter Registered Email or Phone:</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder=""
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full bg-black/80 border border-white/10 rounded-xs py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white text-black font-semibold font-display uppercase tracking-widest text-[10px] rounded-xs transition-all duration-300 mt-2 cursor-pointer flex items-center justify-center gap-2"
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
              className="w-full py-2.5 bg-transparent border border-white/5 hover:border-white/20 text-zinc-400 hover:text-white font-display uppercase tracking-widest text-[9px] rounded-xs transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Login
            </button>
          </form>
        )}

        {/* IV. EMAIL VERIFICATION FORM */}
        {view === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="p-3.5 bg-[#D4AF37]/5 border border-[#D4AF37]/10 text-[#D4AF37] text-[10.5px] rounded-sm text-center leading-relaxed font-sans mb-2">
              Bespoke verification code has been dispatched to <strong className="text-white font-mono block mt-1">{targetEmail}</strong>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">6-Digit Verification Code:</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#D4AF37] animate-pulse" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full bg-black/80 border border-white/10 rounded-xs py-3.5 pl-10 pr-4 text-sm font-mono tracking-[0.55em] text-center text-white focus:outline-none focus:border-[#D4AF37]/45 font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white text-black font-semibold font-display uppercase tracking-widest text-[10px] rounded-xs transition-all duration-300 mt-2 cursor-pointer flex items-center justify-center gap-2"
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

        {/* V. RESET PASSWORD FORM */}
        {view === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            {recoveryCodeReceived && (
              <div className="p-3.5 bg-[#D4AF37]/5 border border-[#D4AF37]/10 text-center rounded-sm">
                <p className="text-[9.5px] uppercase tracking-wider text-zinc-500 font-sans">Simulated Reset Code Received:</p>
                <strong className="text-gold-pure font-mono text-base tracking-widest">{recoveryCodeReceived}</strong>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">6-Digit Reset Code:</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="w-full bg-black/80 border border-white/10 rounded-xs py-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45 font-mono text-center tracking-widest"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">New Secret Password:</label>
              <input
                type="password"
                required
                placeholder="Min 8 characters, uppercase, number, symbol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/80 border border-white/10 rounded-xs py-3 px-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45 font-sans"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Confirm New Password:</label>
              <input
                type="password"
                required
                placeholder="Min 8 characters"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/80 border border-white/10 rounded-xs py-3 px-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45 font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white text-black font-semibold font-display uppercase tracking-widest text-[10px] rounded-xs transition-all duration-300 mt-2 cursor-pointer flex items-center justify-center gap-2"
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
    </div>
  );
}
