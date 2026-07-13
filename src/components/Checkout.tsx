import React, { useState, useMemo } from 'react';
import { ShoppingBag, CreditCard, ChevronRight, CheckCircle, Truck, ShieldAlert, ArrowLeft, Landmark, Compass, MapPin } from 'lucide-react';
import { CartItem, Order } from '../types';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils';
import { SafeImage } from '../imageRegistry';
import { getShippingConfig } from '../data/shippingData';

interface CheckoutProps {
  cart: CartItem[];
  discountPercent: number; // Keeping prop to avoid breaking parent App.tsx if it passes it
  couponCode: string;     // Keeping prop to avoid breaking parent
  onOrderSuccess: (order: Order) => void;
  onBackToCart: () => void;
  deliveryZones?: any[];  // Optional Dynamic delivery zones list
}

const DEFAULT_ZONES = [
  { id: '1', city: 'Hofuf', fee: 0, method: 'Local Delivery', region: 'Al Hofuf & Nearby Areas' },
  { id: '2', city: 'Dammam', fee: 25, method: 'Regional Delivery', region: 'Eastern Province' },
  { id: '3', city: 'Khobar', fee: 25, method: 'Regional Delivery', region: 'Eastern Province' },
  { id: '4', city: 'Riyadh', fee: 45, method: 'Regional Delivery', region: 'Central Region' },
  { id: '5', city: 'Jeddah', fee: 50, method: 'Regional Delivery', region: 'Western Region' },
];

export default function Checkout({
  cart,
  discountPercent,
  couponCode,
  onOrderSuccess,
  onBackToCart,
  deliveryZones = DEFAULT_ZONES
}: CheckoutProps) {
  const { t, i18n } = useTranslation();
  
  // Contact details
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Optional now
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(deliveryZones[1]?.city || 'Dammam');
  const [address, setAddress] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'local' | 'regional'>('regional');
  const [paymentMethod, setPaymentMethod] = useState<'mada' | 'applepay' | 'cod'>('cod'); // "Pay at Delivery" is default now

  // Location selector coordinate state
  const [lat, setLat] = useState(26.4312); // Dammam latitude
  const [lng, setLng] = useState(50.1108); // Dammam longitude
  const [pinX, setPinX] = useState(70);    // relative projection X %
  const [pinY, setPinY] = useState(25);    // relative projection Y %
  const [googleMapsLink, setGoogleMapsLink] = useState(`https://www.google.com/maps/search/?api=1&query=26.4312,50.1108`);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);

  // Credit Card Mada fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  // Dynamic Shipping calculation based on Selected City from deliveryZones state
  const shippingFee = useMemo(() => {
    if (subtotal === 0) return 0;
    
    // Check if order qualifies for free shipping under the dynamic threshold
    const config = getShippingConfig();
    if (subtotal >= config.freeShippingThreshold) {
      return 0; // Free shipping threshold met
    }

    const activeZone = (deliveryZones || []).find(
      (z) => z.city.toLowerCase() === city.toLowerCase()
    );
    return activeZone ? activeZone.fee : 25; // fallback to 25 SAR if not matches
  }, [city, deliveryZones, subtotal]);

  const finalTotal = parseFloat((subtotal + shippingFee).toFixed(2));

  // Handle GPS Current Location
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latVal = position.coords.latitude;
          const lngVal = position.coords.longitude;
          setLat(latVal);
          setLng(lngVal);
          setGoogleMapsLink(`https://www.google.com/maps/search/?api=1&query=${latVal},${lngVal}`);
          
          // Map real coordinates to visual projection box in Saudi
          const visualY = ((27.5 - latVal) / (27.5 - 24.0)) * 100;
          const visualX = ((lngVal - 46.0) / (50.5 - 46.0)) * 100;
          setPinY(Math.max(5, Math.min(95, visualY)));
          setPinX(Math.max(5, Math.min(95, visualX)));
          
          alert(i18n.language === 'ar' ? 'تم تحديد موقعك الحالي بنجاح باستخدام GPS!' : 'Successfully centered your real GPS location!');
        },
        (error) => {
          // If blocked/unavailable, trigger luxury coordinate mock emulations
          const mockLats: Record<string, number> = {
            'hofuf': 25.3783 + (Math.random() - 0.5) * 0.04,
            'dammam': 26.4312 + (Math.random() - 0.5) * 0.04,
            'khobar': 26.2172 + (Math.random() - 0.5) * 0.04,
            'riyadh': 24.7136 + (Math.random() - 0.5) * 0.04,
          };
          const mockLngs: Record<string, number> = {
            'hofuf': 49.5866 + (Math.random() - 0.5) * 0.04,
            'dammam': 50.1108 + (Math.random() - 0.5) * 0.04,
            'khobar': 50.1971 + (Math.random() - 0.5) * 0.04,
            'riyadh': 46.6753 + (Math.random() - 0.5) * 0.04,
          };
          
          const cityKey = city.toLowerCase();
          const targetLat = mockLats[cityKey] || 26.4312 + (Math.random() - 0.5) * 0.04;
          const targetLng = mockLngs[cityKey] || 50.1108 + (Math.random() - 0.5) * 0.04;
          
          setLat(targetLat);
          setLng(targetLng);
          setGoogleMapsLink(`https://www.google.com/maps/search/?api=1&query=${targetLat.toFixed(6)},${targetLng.toFixed(6)}`);
          
          const visualY = ((27.5 - targetLat) / (27.5 - 24.0)) * 100;
          const visualX = ((targetLng - 46.0) / (50.5 - 46.0)) * 100;
          setPinY(Math.max(5, Math.min(95, visualY)));
          setPinX(Math.max(5, Math.min(95, visualX)));
          
          alert(i18n.language === 'ar' ? 'تم جلب الإحداثيات التقريبية للموقع الحالي بناءً على منطقتك.' : 'Simulated GPS coordinates captured successfully relative to your region.');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Drag pin click handler
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const pctX = (x / rect.width) * 100;
    const pctY = (y / rect.height) * 100;
    
    setPinX(pctX);
    setPinY(pctY);
    
    // Map percentages to realistic coordinates inside Saudi Arabia bounding boxes
    // Eastern Province focus box: Latitude [24.0, 27.5], Longitude [46.0, 50.5]
    const calculatedLat = 27.5 - (pctY / 100) * (27.5 - 24.0);
    const calculatedLng = 46.0 + (pctX / 100) * (50.5 - 46.0);
    
    setLat(calculatedLat);
    setLng(calculatedLng);
    setGoogleMapsLink(`https://www.google.com/maps/search/?api=1&query=${calculatedLat.toFixed(6)},${calculatedLng.toFixed(6)}`);
  };

  // Handle finalize order submission
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      alert(i18n.language === 'ar' ? 'يرجى إدخال كافة الحقول المطلوبة لبيانات العميل.' : 'Kindly fill in all required customer coordinates.');
      return;
    }

    const orderId = `ZL-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      date: new Date().toISOString().substring(0, 10),
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        selectedOption: item.selectedOption
      })),
      subtotal,
      shipping: shippingFee,
      discount: 0,
      total: finalTotal,
      status: 'Pending',
      customerName: name.trim(),
      email: email.trim() || 'alzoal3003@gmail.com', // Optional email handled safely
      phone: phone.trim(),
      address: `${address.trim()}, ${city}, Saudi Arabia`,
      paymentMethod: paymentMethod === 'mada' ? 'Mada Card' : paymentMethod === 'applepay' ? 'Apple Pay' : 'Pay at Delivery',
      trackingNumber: `ZLT-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      // Added coordinates fields for dynamic logs
      latitude: lat,
      longitude: lng,
      mapLocationLink: googleMapsLink,
      region: city,
      deliveryMethod: deliveryOption === 'local' ? 'Local Delivery' : 'Regional Delivery'
    } as any; // Cast as any to pass expanded fields comfortably

    onOrderSuccess(newOrder);
  };

  return (
    <div className="bg-black text-white min-h-screen pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-20 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Head */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-6 mb-10 gap-4">
          <div>
            <button
              type="button"
              onClick={onBackToCart}
              className="inline-flex items-center space-x-2 rtl:space-x-reverse text-[#D4AF37] hover:text-white transition-colors text-xs uppercase tracking-widest mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{t('checkout.back', { defaultValue: 'Back to Basket' })}</span>
            </button>
            <h1 className="text-xl sm:text-3xl font-semibold tracking-wider font-display uppercase text-white">
              {i18n.language === 'ar' ? 'مراجعة الطلب والدفع' : 'Order Review & Checkout'}
            </h1>
          </div>
        </div>

        {/* Form Grid */}
        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inputs Section (columns 1 to 7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Contact Information Box */}
            <div className="bg-zinc-950 border border-white/5 rounded-sm p-6 space-y-4">
              <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-3">
                {i18n.language === 'ar' ? 'أولاً: معلومات الاتصال' : 'I. Contact Information'}
              </h3>
              
              <div className="space-y-4">
                {/* 1. Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block">
                    {i18n.language === 'ar' ? 'الاسم الكامل' : 'Full Name'} <span className="text-gold-pure">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder=""
                    className="w-full bg-black border border-white/5 rounded-sm p-3 text-xs text-white focus:outline-none focus:border-gold-pure/45 transition-colors"
                  />
                </div>

                {/* 2. Phone Number */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block">
                    {i18n.language === 'ar' ? 'رقم الجوال (مطلوب)' : 'Phone Number (Required)'} <span className="text-gold-pure">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder=""
                    className="w-full bg-black border border-white/5 rounded-sm p-3 text-xs text-white focus:outline-none focus:border-gold-pure/45 transition-colors"
                  />
                </div>

                {/* 3. Email Address */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block flex items-center justify-between">
                    <span>{i18n.language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</span>
                    <span className="text-[8.5px] text-zinc-650 font-normal tracking-wide italic">{i18n.language === 'ar' ? 'اختياري' : 'Optional'}</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=""
                    className="w-full bg-black border border-white/5 rounded-sm p-3 text-xs text-white focus:outline-none focus:border-gold-pure/45 transition-colors"
                  />
                </div>

                {/* 4. City / Region */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block">
                    {i18n.language === 'ar' ? 'المدينة / المنطقة' : 'City / Region'} <span className="text-gold-pure">*</span>
                  </label>
                  <select
                    value={city}
                    onChange={(e) => {
                      const selectedCity = e.target.value;
                      setCity(selectedCity);
                      // Auto-center coordinates based on selected city
                      const zone = (deliveryZones || DEFAULT_ZONES).find(
                        (z) => z.city.toLowerCase() === selectedCity.toLowerCase()
                      );
                      if (zone) {
                        let nLat = 26.4312;
                        let nLng = 50.1108;
                        if (selectedCity.toLowerCase() === 'hofuf') { nLat = 25.3783; nLng = 49.5866; }
                        else if (selectedCity.toLowerCase() === 'khobar') { nLat = 26.2172; nLng = 50.1971; }
                        else if (selectedCity.toLowerCase() === 'riyadh') { nLat = 24.7136; nLng = 46.6753; }
                        else if (selectedCity.toLowerCase() === 'jeddah') { nLat = 21.4858; nLng = 39.1925; }
                        setLat(nLat);
                        setLng(nLng);
                        setGoogleMapsLink(`https://www.google.com/maps/search/?api=1&query=${nLat},${nLng}`);
                      }
                    }}
                    className="w-full bg-black border border-white/5 rounded-sm p-3 text-xs text-zinc-300 focus:outline-none focus:border-gold-pure/45 transition-colors cursor-pointer"
                  >
                    {(deliveryZones || DEFAULT_ZONES).map((z) => (
                      <option key={z.id} value={z.city}>
                        {z.city} ({z.region || z.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Physical Shipping Address */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block">
                    {i18n.language === 'ar' ? 'عنوان الشارع والحي للتوصيل' : 'Physical Shipping Address'} <span className="text-gold-pure">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={i18n.language === 'ar' ? 'مثال: حي الشاطئ، شارع الأمير محمد، فيلا 4ب' : 'e.g. Al Shati District, Prince Mohammad St, Villa 4B'}
                    className="w-full bg-black border border-white/5 rounded-sm p-3 text-xs text-white focus:outline-none focus:border-gold-pure/45 transition-colors"
                  />
                </div>

                {/* 6. Pin Delivery Location */}
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <label className="text-[10px] text-zinc-300 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <span>📍 {i18n.language === 'ar' ? 'تحديد الموقع على الخريطة' : 'Pin Delivery Location'}</span>
                  </label>
                  
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="flex-1 py-3 px-4 bg-zinc-900 hover:bg-zinc-850 text-white rounded-sm text-xs font-semibold tracking-wide flex items-center justify-center gap-2 border border-white/[0.03] hover:border-[#D4AF37]/50 active:scale-95 duration-200 cursor-pointer min-h-[44px]"
                    >
                      <Compass className="w-4 h-4 text-gold-pure" />
                      <span>{i18n.language === 'ar' ? 'استخدم موقعي الحالي GPS' : 'Use Current Location'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInteractiveMap(!showInteractiveMap)}
                      className={`flex-1 py-3 px-4 rounded-sm text-xs font-semibold tracking-wide flex items-center justify-center gap-2 border active:scale-95 duration-200 cursor-pointer min-h-[44px] ${
                        showInteractiveMap 
                          ? 'bg-gold-pure text-black border-gold-pure font-bold' 
                          : 'bg-zinc-900 hover:bg-zinc-850 text-white border-white/[0.03] hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{showInteractiveMap ? (i18n.language === 'ar' ? 'إغلاق الخريطة' : 'Hide Map Picker') : (i18n.language === 'ar' ? 'تحديد العنوان على الخريطة' : 'Select on Map')}</span>
                    </button>
                  </div>

                  {/* PREMIUM INTUITIVE MOCK SAUDI MAP VIEWPORT */}
                  {showInteractiveMap && (
                    <div className="p-3 bg-neutral-950 border border-gold-pure/15 rounded-xs space-y-3 animate-fade-in w-full">
                      <p className="text-[10.5px] text-zinc-500 font-sans text-center leading-relaxed">
                        {i18n.language === 'ar' 
                          ? 'اضغط في أي مكان على شبكة الخريطة لوضع الدبوس وتوليد رابط تحديد المواقع.' 
                          : 'Tap anywhere on the regional grid vector below to position your gold pin & view links.'}
                      </p>
                      
                      {/* Live click/tap grid selector */}
                      <div 
                        onClick={handleMapClick}
                        className="relative w-full h-48 sm:h-56 bg-[#030303] bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:16px_16px] border border-white/5 rounded-sm overflow-hidden cursor-crosshair select-none"
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 border border-dashed border-gold-pure/10 rounded-full pointer-events-none"></div>
                        <div className="absolute top-1/4 left-1/3 w-20 h-20 bg-gold-pure/3 rounded-full blur-xl pointer-events-none"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-28 h-28 bg-[#D4AF37]/2 rounded-full blur-2xl pointer-events-none"></div>

                        {/* Saudi Arabian Map labels */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[7.5px] font-mono tracking-widest text-zinc-650 pointer-events-none select-none uppercase">Zoal Hub Saudi Grid</div>
                        <div className="absolute top-1/3 left-1/4 flex flex-col items-center pointer-events-none opacity-40">
                          <div className="w-1.5 h-1.5 bg-zinc-650 rounded-full"></div>
                          <span className="text-[7px] font-mono mt-0.5 text-zinc-400">Riyadh HUB</span>
                        </div>
                        <div className="absolute top-1/2 right-1/3 flex flex-col items-center pointer-events-none opacity-50">
                          <div className="w-1.5 h-1.5 bg-gold-pure rounded-full"></div>
                          <span className="text-[7px] font-mono mt-0.5 text-[#D4AF37]">Al Hofuf</span>
                        </div>
                        <div className="absolute top-1/4 right-1/4 flex flex-col items-center pointer-events-none opacity-45">
                          <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></div>
                          <span className="text-[7px] font-mono mt-0.5 text-zinc-450">Dammam HQ</span>
                        </div>

                        {/* Draggable Selector Target Pin */}
                        <div 
                          style={{
                            left: `${pinX}%`,
                            top: `${pinY}%`,
                          }}
                          className="absolute -translate-x-1/2 -translate-y-full hover:scale-110 active:scale-95 duration-100 transition-all pointer-events-none"
                        >
                          <div className="flex flex-col items-center">
                            <span className="absolute bottom-0 w-8 h-8 rounded-full bg-gold-pure/20 animate-ping"></span>
                            
                            {/* Floating Coordinates Tag */}
                            <div className="py-1 px-1.5 bg-black/95 border border-gold-pure/30 rounded-xs text-[8px] font-mono text-gold-pure tracking-tighter whitespace-nowrap mb-1 shadow-lg leading-none">
                              Lat: {lat.toFixed(4)} • Lng: {lng.toFixed(4)}
                            </div>

                            {/* Gold Marker */}
                            <div className="relative w-8 h-8 flex items-center justify-center">
                              <MapPin className="w-6 h-6 text-gold-pure filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.5)]" />
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Display numerical coordinates */}
                      <div className="grid grid-cols-2 gap-3 text-[10.5px] font-mono text-zinc-400 bg-black/60 p-2.5 border border-white/5 rounded-xs">
                        <div>
                          <span className="text-[8px] text-zinc-650 block uppercase tracking-wider">Latitude Dimension</span>
                          <span className="text-zinc-200 font-bold block">{lat.toFixed(6)}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-zinc-650 block uppercase tracking-wider">Longitude Dimension</span>
                          <span className="text-zinc-200 font-bold block">{lng.toFixed(6)}</span>
                        </div>
                        <div className="col-span-2 border-t border-white/5 pt-1.5 flex items-center justify-between text-[9px] truncate">
                          <span className="text-zinc-600 font-sans">{i18n.language === 'ar' ? 'رابط خرائط جوجل الساري:' : 'Google Maps Target Link:'}</span>
                          <a 
                            href={googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gold-pure hover:underline truncate max-w-[210px] font-semibold"
                          >
                            {lat.toFixed(4)}, {lng.toFixed(4)} (Verify Location)
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Micro alert when map is collapsed and saved */}
                  {!showInteractiveMap && (
                    <div className="p-3 bg-[#0c0c0c] border border-white/5 rounded-xs flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gold-pure shrink-0" />
                        <span className="text-[11px] font-mono">Location Logged: <strong className="text-zinc-200">{lat.toFixed(5)}</strong>, <strong className="text-zinc-200">{lng.toFixed(5)}</strong></span>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider font-bold text-emerald-400 px-1.5 py-0.5 bg-emerald-950/20 border border-emerald-500/10 rounded-xs">Verified GPS Pin</span>
                    </div>
                  )}

                </div>

              </div>
            </div>

            {/* Courier Delivery Method Box */}
            <div className="bg-zinc-950 border border-white/5 rounded-sm p-6 space-y-4">
              <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-3">II. Delivery Method</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryOption('local')}
                  className={`p-4 border rounded-sm text-left rtl:text-right flex items-start gap-4 cursor-pointer transition-all ${
                    deliveryOption === 'local'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white'
                      : 'border-white/5 bg-black/40 text-zinc-500 hover:border-white/10'
                  }`}
                >
                  <Truck className={`w-5 h-5 mt-0.5 shrink-0 ${deliveryOption === 'local' ? 'text-gold-pure' : 'text-zinc-650'}`} />
                  <div>
                    <h4 className="text-xs font-display font-semibold uppercase tracking-wider text-white">Local Delivery</h4>
                    <p className="text-[10px] text-zinc-400 mt-1">Available in Hofuf and Nearby Areas</p>
                    <p className="text-[10.5px] text-gold-pure font-mono mt-1 font-bold">Standard Local Logistics</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryOption('regional')}
                  className={`p-4 border rounded-sm text-left rtl:text-right flex items-start gap-4 cursor-pointer transition-all ${
                    deliveryOption === 'regional'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white'
                      : 'border-white/5 bg-black/40 text-zinc-500 hover:border-white/10'
                  }`}
                >
                  <CheckCircle className={`w-5 h-5 mt-0.5 shrink-0 ${deliveryOption === 'regional' ? 'text-gold-pure' : 'text-zinc-650'}`} />
                  <div>
                    <h4 className="text-xs font-display font-semibold uppercase tracking-wider text-white">Regional Delivery</h4>
                    <p className="text-[10px] text-zinc-400 mt-1">Available Across Eastern Province and Saudi Arabia</p>
                    <p className="text-[10.5px] text-gold-pure font-mono mt-1 font-bold">Priority Regional Carrier</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Payment options (formerly sealed payment) */}
            <div className="bg-zinc-950 border border-white/5 rounded-sm p-6 space-y-4">
              <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-3">
                {i18n.language === 'ar' ? 'ثالثاً: طريقة الدفع' : 'III. Payment Method'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Mada/Visa Custom Button (Highly Polished CSS representation matching the user's uploaded image) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mada')}
                  className={`relative p-5 md:p-6 border rounded-sm cursor-pointer overflow-hidden transition-all duration-300 flex flex-col items-center justify-between h-[185px] w-full group outline-none focus:ring-1 focus:ring-[#D4AF37]/50 ${
                    paymentMethod === 'mada'
                      ? 'border-[#D4AF37] bg-gradient-to-b from-[#181510] to-[#0A0906] ring-1 ring-[#D4AF37]/35 shadow-[0_0_22px_rgba(212,175,55,0.25)]'
                      : 'border-white/5 bg-black/40 hover:border-white/12 hover:bg-zinc-950/40'
                  }`}
                >
                  {/* Decorative Outer Double-Border Frame like the image */}
                  <div className={`absolute inset-1 pointer-events-none border rounded-xs transition-opacity duration-300 ${
                    paymentMethod === 'mada' ? 'border-[#D4AF37]/25 opacity-100' : 'border-white/5 opacity-60 group-hover:opacity-100'
                  }`}></div>
                  
                  {/* Cards Stack Container (Vertically centered) */}
                  <div className={`flex-1 w-full flex items-center justify-center select-none relative transition-all duration-300 ${
                    paymentMethod === 'mada' ? 'opacity-100 scale-100' : 'opacity-70 group-hover:opacity-95 group-hover:scale-[1.02]'
                  }`}>
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Back Card (Gold Visa) */}
                      <div className="absolute w-[105px] h-[65px] rounded-[5px] bg-gradient-to-br from-[#E2C573] via-[#C5A049] to-[#8F6F27] border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transform rotate-[14deg] translate-x-3.5 translate-y-[2px] flex flex-col justify-between p-1.5 overflow-hidden transition-transform duration-300 group-hover:rotate-[15deg]">
                        {/* Reflection shine overlay */}
                        <div className="absolute inset-x-0 -top-full bottom-full bg-gradient-to-b from-transparent via-white/10 to-transparent -rotate-45 group-hover:translate-y-[200%] duration-1000 transition-transform"></div>
                        
                        {/* Top row of gold card */}
                        <div className="flex justify-between items-start">
                          {/* Gold card chip mockup */}
                          <div className="w-3 h-2 bg-yellow-250/20 rounded-xs border border-white/10"></div>
                          {/* Contactless indicator */}
                          <div className="text-[6px] text-white/70">
                            <svg className="w-2.5 h-2.5 rotate-90" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Number placeholder */}
                        <div className="text-[5.5px] font-mono text-white/75 tracking-wider text-left leading-none mt-1">
                          •••• •••• •••• 5618
                        </div>
                        
                        {/* Bottom row: Cardholder and Logo */}
                        <div className="flex justify-between items-end">
                          <span className="text-[4.5px] font-mono text-white/50 tracking-tight">GOLD VIP</span>
                          {/* VISA text */}
                          <span className="text-[8px] font-black italic tracking-tighter text-white leading-none font-sans">VISA</span>
                        </div>
                      </div>

                      {/* Front Card (Green Mada) */}
                      <div className="absolute w-[105px] h-[65px] rounded-[5px] bg-gradient-to-br from-[#124233] via-[#1E5D47] to-[#0A261D] border border-white/15 shadow-[0_6px_16px_rgba(0,0,0,0.7)] transform -rotate-[6deg] translate-x-[-12px] translate-y-[4px] flex flex-col justify-between p-1.5 z-10 overflow-hidden transition-transform duration-300 group-hover:-rotate-[5deg]">
                        {/* Glossy reflection */}
                        <div className="absolute inset-x-0 -top-full bottom-full bg-gradient-to-b from-transparent via-white/15 to-transparent -rotate-45 group-hover:translate-y-[200%] duration-1000 transition-transform"></div>
                        
                        {/* Top Row: mada logo, chip */}
                        <div className="flex justify-between items-start">
                          {/* Metallic contact chip */}
                          <div className="w-3.5 h-2.5 bg-zinc-300 rounded-xs flex flex-wrap p-[1px] gap-[1px] border border-zinc-400">
                            <div className="w-1.5 h-[1.5px] bg-zinc-500/40"></div>
                            <div className="w-1.5 h-[1.5px] bg-zinc-500/40"></div>
                          </div>
                          
                          {/* Contactless waves & mada logo */}
                          <div className="flex items-center gap-1">
                            <div className="text-[5px] text-white/90 shrink-0">
                              <svg className="w-2.5 h-2.5 rotate-90" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                              </svg>
                            </div>
                            {/* mada text & bars */}
                            <div className="flex flex-col items-end shrink-0">
                              {/* Blue and Green bar flags */}
                              <div className="flex gap-[1px] h-[2px]">
                                <span className="w-2 h-full bg-[#00A3E0] rounded-l-xs"></span>
                                <span className="w-2 h-full bg-[#78BE20] rounded-r-xs"></span>
                              </div>
                              <span className="text-[6.5px] font-black text-white font-sans leading-none tracking-tighter mt-[1px]">mada</span>
                            </div>
                          </div>
                        </div>

                        {/* Mock Card Details */}
                        <div className="text-left mt-0.5">
                          {/* Card Number matching uploaded graphic */}
                          <div className="text-[6px] font-mono text-white tracking-widest leading-none">
                            5534 0000 0000 3991
                          </div>
                          <div className="text-[3.5px] font-mono text-zinc-400 mt-0.5 leading-none">
                            VALID THRU 09/28
                          </div>
                        </div>

                        {/* Bottom Row: Holder name & Mastercard style */}
                        <div className="flex justify-between items-end">
                          <span className="text-[4.5px] font-mono text-zinc-300 truncate max-w-[50px] uppercase tracking-wide leading-none">CARD HOLDER</span>
                          {/* Orange / Red circles logo */}
                          <div className="flex -space-x-1 shrink-0">
                            <div className="w-2 h-2 rounded-full bg-[#EB001B] opacity-95"></div>
                            <div className="w-2 h-2 rounded-full bg-[#F79E1B] opacity-95"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Button Label styled elegantly on consistent baseline */}
                  <div className="w-full text-center mt-3 z-20 shrink-0">
                    <span className={`text-[10px] md:text-[10.5px] font-display font-semibold uppercase tracking-widest block transition-colors duration-300 ${
                      paymentMethod === 'mada' ? 'text-[#D4AF37]' : 'text-zinc-400 group-hover:text-white'
                    }`}>
                      {paymentMethod === 'mada' ? (i18n.language === 'ar' ? '● مادا / فيزا' : '● MADA / VISA') : (i18n.language === 'ar' ? 'مادا / فيزا' : 'MADA / VISA')}
                    </span>
                  </div>
                </button>

                {/* 2. Apple Pay Button (Highly polished matching option styled exactly like the uploaded image) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('applepay')}
                  className={`relative p-5 md:p-6 border rounded-sm cursor-pointer overflow-hidden transition-all duration-300 flex flex-col items-center justify-between h-[185px] w-full group outline-none focus:ring-1 focus:ring-[#D4AF37]/50 ${
                    paymentMethod === 'applepay'
                      ? 'border-[#D4AF37] bg-gradient-to-b from-[#181510] to-[#0A0906] ring-1 ring-[#D4AF37]/35 shadow-[0_0_22px_rgba(212,175,55,0.25)]'
                      : 'border-white/5 bg-black/40 hover:border-white/12 hover:bg-zinc-950/40'
                  }`}
                >
                  <div className={`absolute inset-1 pointer-events-none border rounded-xs transition-opacity duration-300 ${
                    paymentMethod === 'applepay' ? 'border-[#D4AF37]/25 opacity-100' : 'border-white/5 opacity-60 group-hover:opacity-100'
                  }`}></div>
                  
                  {/* Virtual Apple Pay Card (Vertically centered) */}
                  <div className={`flex-1 w-full flex items-center justify-center select-none relative transition-all duration-300 ${
                    paymentMethod === 'applepay' ? 'opacity-100 scale-100' : 'opacity-70 group-hover:opacity-95 group-hover:scale-[1.02]'
                  }`}>
                    <div className="w-[105px] h-[65px] rounded-[5px] bg-[#F5F5F7] border border-zinc-200/80 shadow-[0_5px_15px_rgba(0,0,0,0.6)] flex items-center justify-center p-2 overflow-hidden">
                      {/* Subtle glossy sheen sweep */}
                      <div className="absolute inset-x-0 -top-full bottom-full bg-gradient-to-b from-transparent via-white/50 to-transparent -rotate-45 group-hover:translate-y-[200%] duration-1000 transition-transform"></div>
                      
                      {/* High-accuracy replica of the Apple Pay logo from the 1st uploaded image */}
                      <div className="flex items-center gap-0.5 text-black">
                        <span className="text-2xl font-bold tracking-tighter leading-none relative -top-[1.5px]"></span>
                        <span className="text-xl font-bold tracking-tight leading-none font-sans">Pay</span>
                      </div>
                    </div>
                  </div>

                  {/* Button Label styled elegantly on consistent baseline */}
                  <div className="w-full text-center mt-3 z-20 shrink-0">
                    <span className={`text-[10px] md:text-[10.5px] font-display font-semibold uppercase tracking-widest block transition-colors duration-300 ${
                      paymentMethod === 'applepay' ? 'text-[#D4AF37]' : 'text-zinc-400 group-hover:text-white'
                    }`}>
                      {paymentMethod === 'applepay' ? (i18n.language === 'ar' ? '● مادا / آبل باي' : '● APPLE PAY') : (i18n.language === 'ar' ? 'آبل باي' : 'APPLE PAY')}
                    </span>
                  </div>
                </button>

                {/* 3. Cash on Delivery Button (Meticulously crafted after the second uploaded image) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`relative p-5 md:p-6 border rounded-sm cursor-pointer overflow-hidden transition-all duration-300 flex flex-col items-center justify-between h-[185px] w-full group outline-none focus:ring-1 focus:ring-[#D4AF37]/50 ${
                    paymentMethod === 'cod'
                      ? 'border-[#D4AF37] bg-gradient-to-b from-[#181510] to-[#0A0906] ring-1 ring-[#D4AF37]/35 shadow-[0_0_22px_rgba(212,175,55,0.25)]'
                      : 'border-white/5 bg-black/40 hover:border-white/12 hover:bg-zinc-950/40'
                  }`}
                >
                  <div className={`absolute inset-1 pointer-events-none border rounded-xs transition-opacity duration-300 ${
                    paymentMethod === 'cod' ? 'border-[#D4AF37]/25 opacity-100' : 'border-white/5 opacity-60 group-hover:opacity-100'
                  }`}></div>
                  
                  {/* High Quality 3D-styled Delivery Van & Cash Stack Graphics (Vertically centered) */}
                  <div className={`flex-1 w-full flex items-center justify-center select-none relative transition-all duration-300 ${
                    paymentMethod === 'cod' ? 'opacity-100 scale-100' : 'opacity-70 group-hover:opacity-95 group-hover:scale-[1.02]'
                  }`}>
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Metallic Gold/Bronze Luxury Delivery Van Vector */}
                      <div className="absolute left-[3px] z-10">
                        <svg className="w-[95px] h-14 drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)]" viewBox="0 0 120 70" fill="none">
                          <defs>
                            <linearGradient id="vanBody" x1="0" y1="0" x2="120" y2="70" gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor="#E5C77D" /> 
                              <stop offset="50%" stopColor="#AB8F44" />
                              <stop offset="100%" stopColor="#5E4E21" />
                            </linearGradient>
                            <linearGradient id="windowGrad" x1="0" y1="0" x2="0" y2="30" gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor="#2E2D2A" />
                              <stop offset="100%" stopColor="#121210" />
                            </linearGradient>
                            <linearGradient id="wheelGrad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor="#44423E" />
                              <stop offset="100%" stopColor="#181816" />
                            </linearGradient>
                          </defs>

                          {/* Soft Ground Shadow of Van */}
                          <ellipse cx="60" cy="61" rx="55" ry="4" fill="black" fillOpacity="0.75" />

                          {/* Clean profile path of Mercedes Sprinter style delivery van with beautiful gold/bronze metallic finish */}
                          <path d="M 12,50 L 22,29 L 45,23 L 112,23 Q 116,23 116,28 L 116,57 Q 116,59 113,59 L 105,59 Q 105,48 95,48 Q 85,48 85,59 L 45,59 Q 45,48 35,48 Q 25,48 25,59 L 17,59 Q 12,59 12,50 Z" fill="url(#vanBody)" stroke="#4A3B12" strokeWidth="0.75" />

                          {/* Doors panel line seams */}
                          <path d="M 33,23 L 33,59" stroke="#3D300C" strokeWidth="0.5" />
                          <path d="M 78,23 L 78,59" stroke="#3D300C" strokeWidth="0.5" />

                          {/* Front Windshield Cabin Side Window */}
                          <path d="M 23,30 L 31,30 L 31,43 L 18,43 Z" fill="url(#windowGrad)" stroke="#1C180E" strokeWidth="0.5" />

                          {/* Front Nose Grill line */}
                          <path d="M 12,50 L 15,44 Q 16,42 18,43" stroke="#2D2305" strokeWidth="0.75" />

                          {/* Wheels with bronze hubcaps */}
                          {/* Wheel 1 */}
                          <circle cx="35" cy="57" r="10" fill="url(#wheelGrad)" stroke="#0E0D0C" strokeWidth="1" />
                          <circle cx="35" cy="57" r="5" fill="#8C7954" stroke="#4F4229" strokeWidth="0.5" />
                          <circle cx="35" cy="57" r="2.5" fill="#FFEAA5" />

                          {/* Wheel 2 */}
                          <circle cx="95" cy="57" r="10" fill="url(#wheelGrad)" stroke="#0E0D0C" strokeWidth="1" />
                          <circle cx="95" cy="57" r="5" fill="#8C7954" stroke="#4F4229" strokeWidth="0.5" />
                          <circle cx="95" cy="57" r="2.5" fill="#FFEAA5" />

                          {/* Big Embossed COD lettering matching the golden 3D text style on the side of the van */}
                          <text x="74" y="44" fontFamily="Impact, sans-serif" fontSize="21" fontWeight="extrabold" letterSpacing="1" fill="#2E2304" textAnchor="middle" opacity="0.9" transform="rotate(-1, 74, 44)">COD</text>
                          <text x="73" y="43" fontFamily="Impact, sans-serif" fontSize="21" fontWeight="extrabold" letterSpacing="1" fill="url(#vanBody)" textAnchor="middle" stroke="#524317" strokeWidth="0.5" transform="rotate(-1, 73, 43)">COD</text>
                        </svg>
                      </div>

                      {/* Highly Crafted Cash Bills & Gold Coins (Matching bottom-right of user image) */}
                      <div className="absolute bottom-[2px] right-[4px] w-[70px] h-9 z-20 select-none scale-[0.82] origin-bottom-right">
                        
                        {/* Cash Stack shadow */}
                        <div className="absolute inset-x-1 bottom-1 h-3 bg-black/75 rounded-xs blur-[4px]"></div>

                        {/* Stack of Money (Representing Saudi Riyal bills style) */}
                        {/* Bottom Bill */}
                        <div className="absolute bottom-[2px] right-2 w-14 h-4.5 bg-gradient-to-tr from-[#124233] to-[#1E5D47] rounded-xs border border-emerald-950 shadow-md transform rotate-[-4deg]"></div>
                        {/* Middle Bill */}
                        <div className="absolute bottom-[4px] right-1 w-14 h-4.5 bg-gradient-to-tr from-[#17503F] via-[#216B53] to-[#164839] rounded-xs border border-emerald-900 shadow-md transform rotate-[2deg]"></div>
                        {/* Top Bill with premium features */}
                        <div className="absolute bottom-[6px] right-1.5 w-14 h-4.5 bg-gradient-to-tr from-[#1B624C] via-[#2D8D6E] to-[#1F6E55] rounded-xs border border-emerald-800 shadow-lg transform rotate-[-1deg] flex items-center justify-between px-1 overflow-hidden">
                          {/* Security thread visual */}
                          <div className="absolute left-3.5 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-[#FFE894] to-[#D4AF37]"></div>
                          {/* Circle badge watermark */}
                          <div className="absolute right-3 top-[2px] w-2 h-2 rounded-full border border-emerald-600/35 bg-emerald-400/10"></div>
                          <span className="text-[3.5px] font-mono text-emerald-950 font-bold z-10 leading-none">100</span>
                        </div>

                        {/* Gold Strap ribbon wrapper wrapping the stacks beautifully */}
                        <div className="absolute bottom-[1.5px] right-4 w-2 h-[13px] bg-gradient-to-r from-[#FFE894] to-[#AB8F44] border-l border-r border-[#6E5719] z-10 opacity-95"></div>

                        {/* Shiny Gold Coins stack beside the cash */}
                        {/* Coin 1 - bottom right */}
                        <div className="absolute bottom-[-1px] right-[6px] w-4.5 h-4.5 rounded-full bg-gradient-to-br from-[#FFF3BD] via-[#D4AF37] to-[#7C631B] border border-[#524112]/40 shadow-[0_2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center transform rotate-[15deg]">
                          <div className="w-3.5 h-3.5 rounded-full border border-dashed border-[#FFFCD2]/50 flex items-center justify-center text-[4px] font-black text-[#524112] font-sans">S</div>
                        </div>
                        {/* Coin 2 - slightly left */}
                        <div className="absolute bottom-[-3px] right-[21px] w-4.5 h-4.5 rounded-full bg-gradient-to-br from-[#FFF3BD] via-[#D4AF37] to-[#7C631B] border border-[#524112]/40 shadow-[0_2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center transform rotate-[-10deg]">
                          <div className="w-3.5 h-3.5 rounded-full border border-dashed border-[#FFFCD2]/50 flex items-center justify-center text-[4px] font-black text-[#524112] font-sans">S</div>
                        </div>
                        {/* Coin 3 - stacked on top */}
                        <div className="absolute bottom-[1.5px] right-[13px] w-4.5 h-4.5 rounded-full bg-gradient-to-br from-[#FFF8D4] via-[#E2C573] to-[#8C6D1F] border border-[#524112]/40 shadow-[0_2px_6px_rgba(0,0,0,0.5)] flex items-center justify-center transform rotate-[5deg] z-20">
                          <div className="w-3.5 h-3.5 rounded-full border border-dashed border-[#FFFCD2]/50 flex items-center justify-center text-[4px] font-black text-[#524112] font-sans">S</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Button Label styled elegantly on consistent baseline */}
                  <div className="w-full text-center mt-3 z-20 shrink-0">
                    <span className={`text-[10px] md:text-[10.5px] font-display font-semibold uppercase tracking-widest block transition-colors duration-300 ${
                      paymentMethod === 'cod' ? 'text-[#D4AF37]' : 'text-zinc-400 group-hover:text-white'
                    }`}>
                      {paymentMethod === 'cod' ? (i18n.language === 'ar' ? '● الدفع عند الاستلام' : '● PAY AT DELIVERY') : (i18n.language === 'ar' ? 'الدفع عند الاستلام' : 'PAY AT DELIVERY')}
                    </span>
                  </div>
                </button>
              </div>

              {/* Card fields displayed ONLY on mada selection */}
              {paymentMethod === 'mada' && (
                <div className="p-4 bg-black/60 border border-white/5 rounded-xs space-y-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest">Cardholder Name:</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder=""
                      className="w-full bg-black border border-white/5 rounded-xs p-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-gold-pure/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest">Mada / Credit Card Number:</label>
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4000 1234 5678 9010"
                      className="w-full bg-black border border-white/5 rounded-xs p-2 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-gold-pure/30"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase tracking-widest">Expiry Date:</label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-black border border-white/5 rounded-xs p-2 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none text-center focus:border-gold-pure/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase tracking-widest">Security CVV:</label>
                      <input
                        type="password"
                        maxLength={3}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-black border border-white/5 rounded-xs p-2 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none text-center focus:border-gold-pure/30"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'applepay' && (
                <div className="p-6 bg-black/60 border border-white/5 rounded-xs text-center space-y-2 animate-fade-in">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center mx-auto text-sm font-semibold tracking-wider font-sans">
                    
                  </div>
                  <p className="text-zinc-300 text-xs">Double-click side button to pay securely with FaceID.</p>
                  <p className="text-zinc-500 text-[8px] uppercase tracking-widest font-mono">Apple Pay security configuration verified</p>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="p-4 bg-amber-955/10 border border-[#D4AF37]/20 rounded-xs flex items-start gap-3 text-xs text-zinc-300 animate-fade-in">
                  <ShieldAlert className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                  <div className="space-y-1 text-left">
                    <p className="font-semibold text-white">
                      {i18n.language === 'ar' 
                        ? 'يتم تحصيل الدفع بشكل آمن عند الاستلام.' 
                        : 'Payment collected securely upon delivery.'}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-sans">
                      {i18n.language === 'ar'
                        ? 'متاح لمواقع التوصيل المؤهلة.'
                        : 'Available for eligible delivery locations.'}
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Cart items review sidebar (columns 8 to 12) - Sticky top-72px on large screens */}
          <div className="lg:col-span-5 bg-zinc-950 border border-white/5 p-6 rounded-sm space-y-6 lg:sticky lg:top-[72px] shadow-2xl">
            <h3 className="text-white text-sm font-display uppercase tracking-widest border-b border-white/5 pb-3">
              {i18n.language === 'ar' ? 'ملخص الطلب' : 'ORDER SUMMARY'}
            </h3>
            
            {/* Expanded items list with visual thumbnails and clean layout */}
            <div className="space-y-4 max-h-[285px] overflow-y-auto pr-2 divide-y divide-white/5">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 pt-3 first:pt-0 text-xs">
                  
                  {/* Thumbnail Image */}
                  <div className="w-12 h-12 relative rounded-xs overflow-hidden bg-zinc-900 border border-white/5 shrink-0 flex items-center justify-center">
                    <SafeImage 
                      src={item.product.images[0]} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>

                  {/* Name and count */}
                  <div className="flex-grow text-left rtl:text-right min-w-0 pr-1">
                    <h4 className="text-white font-semibold uppercase tracking-wider truncate block font-sans text-[11px] leading-tight">
                      {i18n.language === 'ar' ? t(`products.${item.product.id}.name`, { defaultValue: item.product.name }) : item.product.name}
                    </h4>
                    <p className="text-zinc-500 text-[10px] mt-0.5">
                      {t('checkout.qty', { defaultValue: 'Qty' })}: {item.quantity}
                    </p>
                    {item.selectedOption && (
                      <span className="inline-block mt-0.5 text-[8.5px] font-mono tracking-wide text-zinc-600 bg-white/5 px-1 py-0.5 rounded-xs">
                        {item.selectedOption}
                      </span>
                    )}
                  </div>

                  {/* Total price */}
                  <span className="text-zinc-300 font-mono font-bold text-[11.5px] shrink-0">
                    {formatCurrency(item.product.price * item.quantity)} {t('app.sar')}
                  </span>

                </div>
              ))}
            </div>

            {/* Sum Lines matching exact request structure */}
            <div className="space-y-3.5 pt-4 border-t border-white/10 text-sm font-sans mb-6">
              
              {/* Subtotal */}
              <div className="flex justify-between text-zinc-400">
                <span>{t('cart.subtotal', { defaultValue: 'Subtotal' })}</span>
                <span className="font-mono text-zinc-200">{formatCurrency(subtotal)} {t('app.sar')}</span>
              </div>

              {/* Shipping calculating message */}
              <div className="flex justify-between text-zinc-400">
                <span>{t('cart.shipping', { defaultValue: 'Shipping' })}</span>
                <span className="font-mono text-[#D4AF37] font-semibold text-right">
                  {!city ? (i18n.language === 'ar' ? 'يحتسب عند الدفع' : 'Calculated at checkout') : (shippingFee === 0 ? 'Free' : `${formatCurrency(shippingFee)} ${t('app.sar')}`)}
                </span>
              </div>

              {/* Divider spacer */}
              <div className="border-t border-dashed border-white/5 my-2"></div>

              {/* Final sum */}
              <div className="flex justify-between text-base uppercase font-display font-medium text-white tracking-wider">
                <span>{t('cart.total', { defaultValue: 'Total' })}</span>
                <span className="text-gold-pure font-mono font-bold text-lg rtl:text-left">{formatCurrency(finalTotal)} {t('app.sar')}</span>
              </div>

            </div>

            {/* Authorize checkout button (full width touch target) */}
            <button
              type="submit"
              className="w-full py-4.5 sm:py-5 bg-[#D4AF37] hover:bg-white text-black font-display font-bold uppercase tracking-widest text-[11.5px] rounded-sm transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.25)] min-h-[48px]"
            >
              {t('checkout.authorize', { defaultValue: 'PROCEED TO CHECKOUT' })}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}
