import React, { useState } from 'react';
import { User, Phone, Lock, Loader2, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface AccountSettingsSectionProps {
  currentUser: { name: string; email: string; phone: string; address: string; role?: string; addresses?: any[] } | null;
  onUpdateCurrentUser?: (user: any) => void;
}

export function AccountSettingsSection({ currentUser, onUpdateCurrentUser }: AccountSettingsSectionProps) {
  // Profile form states
  const [firstName, setFirstName] = useState(currentUser?.name ? currentUser.name.split(' ')[0] : '');
  const [lastName, setLastName] = useState(currentUser?.name ? currentUser.name.split(' ').slice(1).join(' ') : '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status indicators
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) {
      setProfileError('All profile fields are required.');
      return;
    }

    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
    if (!token) {
      setProfileError('Session expired. Please re-authenticate.');
      setProfileLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ firstName, lastName, phone })
      });

      const data = await response.json();

      if (!response.ok) {
        setProfileError(data.error || 'Failed to update profile.');
        return;
      }

      setProfileSuccess('Profile updated successfully.');
      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(data.user);
      }

    } catch (err) {
      setProfileError('Connection failed. Verify server is online.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
    if (!token) {
      setPasswordError('Authentication token not found. Please log in.');
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password.');
        return;
      }

      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (err) {
      setPasswordError('Network error. Password change aborted.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in text-left">
      
      {/* Profile Details Panel */}
      <form onSubmit={handleUpdateProfile} className="bg-zinc-950/40 border border-white/5 rounded-xs p-5 sm:p-6 space-y-4">
        <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-1.5">
          <User className="w-4 h-4" /> I. Profile Information
        </h4>

        <AnimatePresence mode="wait">
          {profileError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="p-3 bg-rose-950/30 border border-rose-500/15 text-rose-400 text-[11px] rounded-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{profileError}</span>
            </motion.div>
          )}

          {profileSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="p-3 bg-emerald-950/30 border border-emerald-500/15 text-emerald-400 text-[11px] rounded-xs flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{profileSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">First Name:</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Last Name:</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Email Address (Read Only):</label>
          <input
            type="email"
            disabled
            value={currentUser?.email || ''}
            className="w-full bg-zinc-900 border border-white/5 rounded-xs p-2.5 text-xs text-zinc-500 font-mono cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Phone Number:</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xs py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={profileLoading}
          className="px-6 py-2.5 bg-transparent border border-[#D4AF37] hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black text-[9px] font-bold uppercase tracking-widest rounded-xs transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
        >
          {profileLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Updating Profile...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>

      {/* Password Rotation keys panel */}
      <form onSubmit={handleUpdatePassword} className="bg-zinc-950/40 border border-white/5 rounded-xs p-5 sm:p-6 space-y-4">
        <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-1.5">
          <Lock className="w-4 h-4" /> II. Security Settings
        </h4>

        <AnimatePresence mode="wait">
          {passwordError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="p-3 bg-rose-950/30 border border-rose-500/15 text-rose-400 text-[11px] rounded-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{passwordError}</span>
            </motion.div>
          )}

          {passwordSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="p-3 bg-emerald-950/30 border border-emerald-500/15 text-emerald-400 text-[11px] rounded-xs flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{passwordSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1.5">
          <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Current Password:</label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              required
              value={currentPassword}
              placeholder="••••••••"
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xs p-2.5 pr-11 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-[#D4AF37]/80 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xs"
              aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">New Password:</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              required
              value={newPassword}
              placeholder="••••••••"
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xs p-2.5 pr-11 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-[#D4AF37]/80 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xs"
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrengthIndicator password={newPassword} />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Confirm New Password:</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              placeholder="••••••••"
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xs p-2.5 pr-11 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-[#D4AF37]/80 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xs"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={passwordLoading}
          className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-xs transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
        >
          {passwordLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Changing Password...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </div>
  );
}
