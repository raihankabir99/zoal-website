import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, X, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBranding } from './BrandingContext';
import { useTranslation } from 'react-i18next';

interface Address {
  id: string;
  label: string;
  fullName?: string;
  addressLine: string;
  district?: string;
  city: string;
  phone: string;
  postalCode?: string;
  notes?: string;
  isDefault?: boolean;
}

interface AddressSectionProps {
  currentUser: { name: string; email: string; phone: string; address: string; role?: string; addresses?: Address[] } | null;
  onUpdateCurrentUser?: (user: any) => void;
}

export function AddressSection({ currentUser, onUpdateCurrentUser }: AddressSectionProps) {
  const { settings } = useBranding();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // Form states
  const [label, setLabel] = useState('');
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [addressLine, setAddressLine] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('Dammam');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addresses = currentUser?.addresses || [];

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label) {
      setError(isAr ? 'يرجى تحديد نوع العنوان.' : 'Please select an address type.');
      return;
    }
    if (!fullName) {
      setError(isAr ? 'يرجى إدخال اسمك الكامل.' : 'Please enter your full name.');
      return;
    }
    if (!phone || phone.length < 7) {
      setError(isAr ? 'يرجى إدخال رقم جوال صالح.' : 'Please enter a valid phone number.');
      return;
    }
    if (!city) {
      setError(isAr ? 'يرجى تحديد المدينة.' : 'Please select your city.');
      return;
    }
    if (!district) {
      setError(isAr ? 'يرجى إدخال اسم الحي.' : 'Please enter your district.');
      return;
    }
    if (!addressLine) {
      setError(isAr ? 'يرجى إدخال عنوان الشارع والمنزل.' : 'Please enter your street address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
    if (!token) {
      setError(isAr ? 'لم يتم العثور على رمز الجلسة. يرجى تسجيل الدخول.' : 'Session token not found. Please log in.');
      setLoading(false);
      return;
    }

    let updatedAddresses: Address[] = [];

    if (editingId) {
      // Update existing
      updatedAddresses = addresses.map(addr => 
        addr.id === editingId 
          ? { 
              ...addr, 
              label, 
              fullName, 
              addressLine, 
              district, 
              city, 
              phone, 
              postalCode, 
              notes,
              isDefault: isDefault || addr.isDefault // Keep default if it was already or newly set
            } 
          : (isDefault ? { ...addr, isDefault: false } : addr)
      );
    } else {
      // Create new
      const newAddress: Address = {
        id: `ADDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        label: label.trim(),
        fullName: fullName.trim(),
        addressLine: addressLine.trim(),
        district: district.trim(),
        city,
        phone: phone.trim(),
        postalCode: postalCode.trim(),
        notes: notes.trim(),
        isDefault
      };

      if (isDefault) {
        updatedAddresses = addresses.map(a => ({ ...a, isDefault: false }));
        updatedAddresses.push(newAddress);
      } else {
        updatedAddresses = [...addresses, newAddress];
      }
    }

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
        setError(data.error || (editingId 
          ? (isAr ? 'فشل تحديث العنوان.' : 'Failed to update address.') 
          : (isAr ? 'فشل حفظ العنوان.' : 'Failed to save address.')));
        return;
      }

      setSuccess(editingId 
        ? (isAr ? 'تم تحديث العنوان بنجاح.' : 'Address updated successfully.') 
        : (isAr ? 'تم حفظ العنوان بنجاح.' : 'Address saved successfully.'));
      
      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(data.user);
      }

      // Reset Form
      setLabel('');
      setAddressLine('');
      setDistrict('');
      setPostalCode('');
      setNotes('');
      setEditingId(null);
      setIsAdding(false);

    } catch (err) {
      setError(isAr ? 'فشل الاتصال. يرجى التحقق من حالة الخادم.' : 'Connection failed. Please check backend status.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (addr: Address) => {
    setEditingId(addr.id);
    setLabel(addr.label || 'Home');
    setFullName(addr.fullName || currentUser?.name || '');
    setAddressLine(addr.addressLine || '');
    setDistrict(addr.district || '');
    setCity(addr.city || 'Dammam');
    setPhone(addr.phone || '');
    setPostalCode(addr.postalCode || '');
    setNotes(addr.notes || '');
    setIsDefault(addr.isDefault || false);
    setIsAdding(true);
    setError(null);
    setSuccess(null);
  };

  const handleDeleteAddress = async (id: string) => {
    const confirmMsg = isAr 
      ? 'حذف العنوان؟\n\nهل أنت متأكد من رغبتك في إزالة هذا العنوان المحفوظ؟' 
      : 'Delete Address?\n\nAre you sure you want to remove this saved address?';
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
    if (!token) {
      setError(isAr ? 'انتهت صلاحية رمز الجلسة. يرجى تسجيل الدخول.' : 'Session token expired. Please log in.');
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
        setError(data.error || (isAr ? 'فشل إزالة العنوان.' : 'Failed to remove address.'));
        return;
      }

      setSuccess(isAr ? 'تمت إزالة العنوان بنجاح.' : 'Address removed successfully.');
      
      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(data.user);
      }

    } catch (err) {
      setError(isAr ? 'فشل الاتصال. يرجى التحقق من الشبكة.' : 'Connection failed. Please check network.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-white text-lg font-display font-bold uppercase tracking-wider">
            {isAr ? 'العناوين المحفوظة' : 'Saved Addresses'}
          </h3>
          <p className="text-zinc-400 text-xs mt-1">
            {isAr 
              ? 'إدارة عناوين التوصيل الخاصة بك لتجربة دفع أسرع وأكثر سلاسة.' 
              : 'Manage your saved delivery addresses for a faster and smoother checkout experience.'}
          </p>
        </div>
        <button
          onClick={() => { 
            if (isAdding) {
              setIsAdding(false);
              setEditingId(null);
            } else {
              setIsAdding(true);
              setEditingId(null);
              // Reset for new
              setLabel('');
              setAddressLine('');
              setDistrict('');
              setPostalCode('');
              setNotes('');
            }
            setError(null); 
            setSuccess(null); 
          }}
          className="px-4 py-2 bg-[#D4AF37] hover:bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-xs transition-colors duration-250 cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          {isAdding ? (
            <>
              <X className="w-3.5 h-3.5" />
              {isAr ? 'إلغاء' : 'Cancel'}
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              {isAr ? '+ إضافة عنوان جديد' : '+ Add New Address'}
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
            className="p-6 border border-[#D4AF37]/25 bg-zinc-950/70 rounded-sm space-y-4 overflow-hidden"
          >
            <h4 className="text-xs text-[#D4AF37] font-display uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
              <Navigation className="w-4 h-4" /> 
              {editingId 
                ? (isAr ? 'تعديل عنوان الشحن' : 'Edit Shipping Address') 
                : (isAr ? 'إضافة عنوان شحن جديد' : 'Add New Shipping Address')}
            </h4>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-300 uppercase tracking-widest block font-semibold">
                {isAr ? 'نوع العنوان' : 'Address Type'}
              </label>
              <div className="flex gap-3">
                {['Home', 'Work', 'Other'].map((type) => {
                  const labelEn = type;
                  const labelAr = type === 'Home' ? 'المنزل' : type === 'Work' ? 'العمل' : 'أخرى';
                  const emoji = type === 'Home' ? '🏠' : type === 'Work' ? '🏢' : '📍';
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setLabel(type)}
                      className={`flex-1 py-2 px-3 border rounded-xs text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        label === type ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white' : 'border-white/10 bg-black text-zinc-400 hover:text-white'
                      }`}
                    >
                      {emoji}
                      {isAr ? labelAr : labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-300 uppercase tracking-widest block font-semibold">
                  {isAr ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-300 uppercase tracking-widest block font-semibold">
                  {isAr ? 'رقم الجوال' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={settings.phone}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-300 uppercase tracking-widest block font-semibold">
                  {isAr ? 'الدولة' : 'Country'}
                </label>
                <input
                  type="text"
                  value={isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia'}
                  readOnly
                  className="w-full bg-black/60 border border-white/10 rounded-xs p-2.5 text-xs text-zinc-400 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-300 uppercase tracking-widest block font-semibold">
                  {isAr ? 'المدينة' : 'City'}
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50 font-sans"
                >
                  <option value="Dammam">{isAr ? 'الدمام' : 'Dammam'}</option>
                  <option value="Al Hofuf">{isAr ? 'الهفوف' : 'Al Hofuf'}</option>
                  <option value="Riyadh">{isAr ? 'الرياض' : 'Riyadh'}</option>
                  <option value="Jeddah">{isAr ? 'جدة' : 'Jeddah'}</option>
                  <option value="Khobar">{isAr ? 'الخبر' : 'Khobar'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-300 uppercase tracking-widest block font-semibold">
                  {isAr ? 'الحي' : 'District'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: الفيصلية' : 'e.g. Al-Faisaliyah'}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-300 uppercase tracking-widest block font-semibold">
                  {isAr ? 'الرمز البريدي (اختياري)' : 'Postal Code (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: ٣١٤٢١' : 'e.g. 31421'}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-300 uppercase tracking-widest block font-semibold">
                {isAr ? 'عنوان الشارع / المبنى / الشقة' : 'Street Address / Building / Apartment'}
              </label>
              <input
                type="text"
                required
                placeholder={isAr ? 'مثال: شارع الملك فهد، مبنى ٤٢، شقة ٥' : 'e.g. King Fahd St, Bldg 42, Apt 5'}
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-300 uppercase tracking-widest block font-semibold">
                {isAr ? 'ملاحظات إضافية للتوصيل (اختياري)' : 'Additional Delivery Notes (Optional)'}
              </label>
              <input
                type="text"
                placeholder={isAr ? 'مثال: بالقرب من المسجد الكبير، اتركه عند البوابة الخارجية' : 'e.g. Near central mosque, leave at front gate'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                checked={isDefault} 
                onChange={(e) => setIsDefault(e.target.checked)}
                id="default-addr" 
                className="accent-[#D4AF37] w-4 h-4 cursor-pointer" 
              />
              <label htmlFor="default-addr" className="text-xs text-zinc-300 cursor-pointer select-none">
                ✓ {isAr ? 'تعيين كعنوان افتراضي' : 'Set as Default Address'}{' '}
                <span className="text-[10px] text-zinc-500 block">
                  {isAr ? 'سيتم اختيار هذا العنوان تلقائياً عند الدفع.' : 'This address will be selected automatically during checkout.'}
                </span>
              </label>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[9.5px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {isAr ? 'جاري الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  editingId ? (isAr ? 'حفظ التغييرات' : 'Save Changes') : (isAr ? 'حفظ العنوان' : 'Save Address')
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingId(null); }}
                  className="px-6 py-2.5 bg-black border border-white/10 text-white text-[9.5px] font-bold uppercase tracking-wider rounded-xs hover:bg-white/5 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center border border-dashed border-white/10 bg-zinc-950/30 rounded-sm space-y-3">
            <MapPin className="w-8 h-8 text-[#D4AF37] mx-auto opacity-80" />
            <h5 className="text-white text-sm font-semibold uppercase tracking-wider">
              {isAr ? 'لا توجد عناوين محفوظة' : 'No Saved Addresses'}
            </h5>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {isAr ? 'أضف عنوان الشحن الخاص بك لتجربة دفع أسرع.' : 'Add your shipping address for a faster checkout experience.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsAdding(true)}
                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xs transition-colors cursor-pointer"
              >
                {isAr ? 'إضافة عنوان جديد' : 'Add New Address'}
              </button>
            </div>
          </div>
        ) : (
          addresses.map((addr, idx) => {
            const displayLabelAr = addr.label === 'Home' ? 'المنزل' : addr.label === 'Work' ? 'العمل' : addr.label || 'أخرى';
            const displayCityAr = addr.city === 'Dammam' ? 'الدمام' : addr.city === 'Al Hofuf' ? 'الهفوف' : addr.city === 'Riyadh' ? 'الرياض' : addr.city === 'Jeddah' ? 'جدة' : addr.city === 'Khobar' ? 'الخبر' : addr.city;
            return (
              <div key={addr.id} className="p-5 border border-white/10 bg-zinc-950/60 rounded-xs flex flex-col justify-between space-y-4 hover:border-[#D4AF37]/30 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-white font-semibold text-xs uppercase tracking-wider">
                        {isAr ? displayLabelAr : (addr.label || 'Home')}
                      </span>
                    </div>
                    {(addr.isDefault || idx === 0) ? (
                      <span className="text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-xs font-mono font-bold">
                        {isAr ? '✓ افتراضي' : '✓ DEFAULT'}
                      </span>
                    ) : (
                      <span className="text-[9px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-xs font-mono">
                        {isAr ? 'محفوظ' : 'SAVED'}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-zinc-300 font-sans space-y-1">
                    <p className="font-semibold text-white">{addr.fullName || currentUser?.name || (isAr ? 'العميل' : 'Customer')}</p>
                    <p className="text-zinc-400">{addr.addressLine}</p>
                    {addr.district && <p className="text-zinc-400">{isAr ? `حي ${addr.district}` : addr.district}</p>}
                    <p className="text-zinc-400">
                      {isAr ? `${displayCityAr}، المملكة العربية السعودية` : `${addr.city}, Saudi Arabia`}
                    </p>
                    {addr.postalCode && (
                      <p className="text-zinc-500 font-mono text-[10px]">
                        {isAr ? 'الرمز البريدي: ' : 'Postal Code: '}
                        {addr.postalCode}
                      </p>
                    )}
                    <p className="text-zinc-500 font-mono text-[10px]">
                      {isAr ? 'رقم الجوال: ' : 'Phone: '}
                      {addr.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleEditAddress(addr)}
                    className="px-3 py-1.5 bg-black border border-white/10 hover:border-[#D4AF37]/50 text-zinc-300 hover:text-white rounded-xs text-[10px] uppercase tracking-wider font-semibold transition-all"
                  >
                    {isAr ? 'تعديل' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="px-3 py-1.5 bg-black border border-white/10 hover:border-rose-500/50 text-zinc-400 hover:text-rose-400 rounded-xs text-[10px] uppercase tracking-wider font-semibold transition-all"
                  >
                    {isAr ? 'حذف' : 'Delete'}
                  </button>
                  {!addr.isDefault && (
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
                        if (!token) return;
                        
                        const updatedAddresses = addresses.map(a => ({
                          ...a,
                          isDefault: a.id === addr.id
                        }));

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
                          if (response.ok && onUpdateCurrentUser) {
                            onUpdateCurrentUser(data.user);
                            setSuccess(isAr ? 'تم تحديث العنوان الافتراضي بنجاح.' : 'Default address updated successfully.');
                          }
                        } catch (err) {
                          setError(isAr ? 'فشل تحديث العنوان الافتراضي.' : 'Failed to update default address.');
                        }
                      }}
                      className="ml-auto text-[10px] text-[#D4AF37] hover:underline font-mono uppercase"
                    >
                      {isAr ? 'تعيين كافتراضي' : 'Set as Default'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
