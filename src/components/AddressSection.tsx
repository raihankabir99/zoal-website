import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, X, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Address {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  phone: string;
}

interface AddressSectionProps {
  currentUser: { name: string; email: string; phone: string; address: string; role?: string; addresses?: Address[] } | null;
  onUpdateCurrentUser?: (user: any) => void;
}

export function AddressSection({ currentUser, onUpdateCurrentUser }: AddressSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [label, setLabel] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Dammam');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const addresses = currentUser?.addresses || [];

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !addressLine || !city || !phone) {
      setError('Please provide all address details.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
    if (!token) {
      setError('Session token not found. Please log in.');
      setLoading(false);
      return;
    }

    const newAddress: Address = {
      id: `ADDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      label: label.trim(),
      addressLine: addressLine.trim(),
      city,
      phone: phone.trim()
    };

    const updatedAddresses = [...addresses, newAddress];

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ addresses: updatedAddresses })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to establish shipping coordinate.');
        return;
      }

      setSuccess('Shipping coordinate successfully registered to your VIP profile!');
      
      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(data.user);
      }

      // Reset Form
      setLabel('');
      setAddressLine('');
      setCity('Dammam');
      setIsAdding(false);

    } catch (err) {
      setError('Connection failed. Please check backend status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this delivery location?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
    if (!token) {
      setError('Session token expired. Please log in.');
      return;
    }

    const updatedAddresses = addresses.filter((addr) => addr.id !== id);

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ addresses: updatedAddresses })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to remove shipping coordinate.');
        return;
      }

      setSuccess('Shipping coordinate removed from profile.');
      
      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(data.user);
      }

    } catch (err) {
      setError('Connection failed. Please check network.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex justify-between items-center">
        <span className="text-[10px] tracking-widest text-zinc-500 uppercase font-sans">Authorized Delivery Points</span>
        <button
          onClick={() => { setIsAdding(!isAdding); setError(null); setSuccess(null); }}
          className="px-4 py-2 bg-[#D4AF37] hover:bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-xs transition-colors duration-250 cursor-pointer flex items-center gap-1.5"
        >
          {isAdding ? (
            <>
              <X className="w-3.5 h-3.5" />
              Cancel Form
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Add Coordinate
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-rose-950/40 border border-rose-500/20 text-rose-400 text-xs rounded-sm flex items-start gap-2 text-left"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs rounded-sm flex items-start gap-2 text-left"
          >
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddAddress}
            className="p-5 border border-[#D4AF37]/20 bg-zinc-950/50 rounded-sm space-y-4 overflow-hidden"
          >
            <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" /> New Shipping Registry
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Address Label (e.g. Home, Office):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Principal Residence"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">City Region:</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35 font-sans"
                >
                  <option value="Dammam">Dammam Flagship Hub</option>
                  <option value="Al Hofuf">Al Hofuf Flagship Lounge</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Granular Address Coordinates (Street / District / Villa):</label>
              <input
                type="text"
                required
                placeholder="e.g. Prince Mohammad Bin Fahd Rd, Al Dawasir District, Villa 41"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Contact Phone number for Delivery:</label>
              <input
                type="text"
                required
                placeholder="+966 56 769 9315"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[9.5px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Recording Location...
                </>
              ) : (
                'Establish Delivery Point'
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.length === 0 ? (
          <div className="md:col-span-2 p-10 text-center border border-dashed border-white/5 bg-zinc-950/25 rounded-sm">
            <MapPin className="w-7 h-7 text-zinc-500 mx-auto mb-2.5" />
            <h5 className="text-white text-xs font-semibold uppercase tracking-wider">No Shipping Coordinates Recorded</h5>
            <p className="text-[10px] text-zinc-500 mt-1">Please register a location to accelerate checkout dispatches.</p>
          </div>
        ) : (
          addresses.map((addr) => (
            <div key={addr.id} className="p-4 border border-white/5 bg-zinc-950/40 rounded-xs flex justify-between items-start hover:border-[#D4AF37]/25 duration-300">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-white font-semibold text-xs uppercase tracking-wider">{addr.label}</span>
                  <span className="text-[8px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-1 rounded-xs font-mono">{addr.city}</span>
                </div>
                <p className="text-zinc-400 text-[10.5px] leading-relaxed pr-2">{addr.addressLine}</p>
                <div className="text-[9px] text-zinc-500 font-mono">Recipient: {addr.phone}</div>
              </div>
              <button
                onClick={() => handleDeleteAddress(addr.id)}
                className="p-1.5 border border-white/5 hover:border-rose-500/30 text-zinc-500 hover:text-rose-400 rounded-sm duration-200 cursor-pointer"
                title="Remove location"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
