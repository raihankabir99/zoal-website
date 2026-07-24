import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, CreditCard, ChevronRight, CheckCircle, Truck, ShieldAlert, ArrowLeft, Landmark, Compass, MapPin,
  Map, Check, Clock, Home, Briefcase, Star, RefreshCw, ZoomIn, ZoomOut, AlertTriangle, Eye, EyeOff, Navigation,
  Plus, Maximize2, Minimize2, ExternalLink, Store
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CartItem, Order } from '../types';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils';
import { SafeImage } from '../imageRegistry';
import { getShippingConfig } from '../data/shippingData';
import { supabaseClient } from '../lib/supabaseClient';

import { useBranding } from './BrandingContext';

interface CheckoutProps {
  cart: CartItem[];
  discountPercent: number; // Keeping prop to avoid breaking parent App.tsx if it passes it
  couponCode: string;     // Keeping prop to avoid breaking parent
  onOrderSuccess: (order: Order) => void;
  onBackToCart: () => void;
  deliveryZones?: any[];  // Optional Dynamic delivery zones list
  currentUser: any;
}

const DEFAULT_ZONES = [
  { id: '1', city: 'Hofuf', fee: 0, method: 'Local Delivery', region: 'Al Hofuf & Nearby Areas' },
  { id: '2', city: 'Branch B', fee: 25, method: 'Regional Delivery', region: 'Eastern Province' },
  { id: '3', city: 'Khobar', fee: 25, method: 'Regional Delivery', region: 'Eastern Province' },
  { id: '4', city: 'Branch A', fee: 45, method: 'Regional Delivery', region: 'Central Region' },
  { id: '5', city: 'Jeddah', fee: 50, method: 'Regional Delivery', region: 'Western Region' },
];

const INITIAL_SAVED_ADDRESSES: any[] = [];

function reverseGeocode(latitude: number, longitude: number, isArabic: boolean) {
  // We no longer use hardcoded fallback cities. 
  // If Nominatim fails and we have no data, we return an empty/unselected state.
  return {
    street: '',
    district: '',
    city: '',
    region: '',
    country: isArabic ? 'المملكة العربية السعودية' : 'Saudi Arabia',
    eta: isArabic ? 'جاري التحديد...' : 'Select location...',
    available: false,
    originalCity: ''
  };
}

export default function Checkout({
  cart,
  discountPercent,
  couponCode,
  onOrderSuccess,
  onBackToCart,
  deliveryZones = DEFAULT_ZONES,
  currentUser
}: CheckoutProps) {
  const { t, i18n } = useTranslation();
  const { settings } = useBranding();
  const brandName = (settings?.businessName || 'ZOAL').split(' ')[0];
  
  // Contact details
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Optional now
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'local' | 'regional'>('regional');
  const [paymentMethod, setPaymentMethod] = useState<'mada' | 'applepay' | 'cod'>('cod'); // "Pay at Delivery" is default now
  const [showCardCvv, setShowCardCvv] = useState(false);

  // Location selector coordinate state
  const [lat, setLat] = useState(24.7136); // Default to Branch A center for map view but unselected
  const [lng, setLng] = useState(46.6753); 
  const [pinX, setPinX] = useState(70);    // relative projection X %
  const [pinY, setPinY] = useState(25);    // relative projection Y %
  const [googleMapsLink, setGoogleMapsLink] = useState(`https://www.google.com/maps/search/?api=1&query=26.4312,50.1108`);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);

  // Premium location state extensions
  const [zoom, setZoom] = useState(15);
  const [devMode, setDevMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [accuracy, setAccuracy] = useState('3m');
  const [hasSelectedDeliveryLocation, setHasSelectedDeliveryLocation] = useState(false);

  // Dynamic Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState(INITIAL_SAVED_ADDRESSES);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollToMap = () => {
    mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Flash the map border to draw attention
    const container = mapContainerRef.current?.parentElement;
    if (container) {
      container.classList.add('ring-4', 'ring-gold-pure', 'ring-opacity-50');
      setTimeout(() => {
        container.classList.remove('ring-4', 'ring-gold-pure', 'ring-opacity-50');
      }, 1500);
    }
  };

  // Fetch saved addresses from Supabase for existing users
  useEffect(() => {
    if (!currentUser?.email) {
      setSavedAddresses([]);
      return;
    }

    const fetchUserAddresses = async () => {
      setIsLoadingAddresses(true);
      try {
        // 1. First find the user in zoal_users to get their ID
        const { data: userData, error: userError } = await supabaseClient
          .from('zoal_users')
          .select('id')
          .eq('email', currentUser.email)
          .single();

        if (userError || !userData) {
          setSavedAddresses([]);
          return;
        }

        // 2. Fetch addresses for this user
        const { data: addressData, error: addressError } = await supabaseClient
          .from('zoal_addresses')
          .select('*')
          .eq('user_id', userData.id);

        if (addressError) throw addressError;

        if (addressData && addressData.length > 0) {
          const mapped = addressData.map((addr: any) => ({
            id: addr.id,
            label: addr.address_line_2 || (i18n.language === 'ar' ? 'عنوان محفوظ' : 'Saved Address'),
            labelAr: addr.address_line_2 || (i18n.language === 'ar' ? 'عنوان محفوظ' : 'Saved Address'),
            street: addr.address_line_1,
            streetAr: addr.address_line_1,
            district: addr.state || '',
            districtAr: addr.state || '',
            city: addr.city,
            cityAr: addr.city,
            region: addr.state || '',
            regionAr: addr.state || '',
            country: addr.country,
            countryAr: i18n.language === 'ar' ? 'المملكة العربية السعودية' : 'Saudi Arabia',
            lat: Number(addr.latitude) || 26.4312,
            lng: Number(addr.longitude) || 50.1108,
            accuracy: 'GPS',
            eta: i18n.language === 'ar' ? 'جاري الحساب...' : 'Calculating...',
            available: true
          }));
          setSavedAddresses(mapped);
        } else {
          setSavedAddresses([]);
        }
      } catch (err) {
        console.error('Error fetching addresses from Supabase:', err);
        setSavedAddresses([]);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    fetchUserAddresses();
  }, [currentUser, i18n.language]);

  // Leaflet Map Refs and Expanded State
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Live Nominatim Reverse Geocoding States
  const [nominatimAddress, setNominatimAddress] = useState<{
    street: string;
    district: string;
    city: string;
    region: string;
    country: string;
    available: boolean;
    eta: string;
  } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Automatically determine selected address details (instant local fallback + async OSM)
  const activeAddress = useMemo(() => {
    if (!hasSelectedDeliveryLocation) {
      return {
        street: '',
        district: '',
        city: '',
        region: '',
        country: i18n.language === 'ar' ? 'المملكة العربية السعودية' : 'Saudi Arabia',
        available: false,
        eta: i18n.language === 'ar' ? 'يرجى تحديد الموقع' : 'Please select location'
      };
    }

    if (nominatimAddress) return nominatimAddress;
    
    const fallback = reverseGeocode(lat, lng, i18n.language === 'ar');
    return {
      street: fallback.street,
      district: fallback.district,
      city: fallback.city,
      region: fallback.region,
      country: fallback.country,
      available: fallback.available,
      eta: fallback.eta
    };
  }, [nominatimAddress, lat, lng, i18n.language, hasSelectedDeliveryLocation]);

  const isSaudi = useMemo(() => {
    const country = activeAddress.country.toLowerCase();
    return country.includes('saudi') || country.includes('سعودي') || country.includes('المملكة');
  }, [activeAddress.country]);

  const isLocalZone = useMemo(() => {
    const cityLower = activeAddress.city.toLowerCase();
    return cityLower.includes('hofuf') || activeAddress.city.includes('هفوف');
  }, [activeAddress.city]);

  const hasLocalOnlyItems = useMemo(() => {
    return cart.some(item => item.product.deliveryType === 'LOCAL_ONLY');
  }, [cart]);

  const hasNationwideItems = useMemo(() => {
    return cart.some(item => item.product.deliveryType === 'NATIONWIDE');
  }, [cart]);

  const hasStorePickupOnlyItems = useMemo(() => {
    return cart.some(item => item.product.deliveryType === 'STORE_PICKUP_ONLY');
  }, [cart]);

  const requiresDelivery = useMemo(() => {
    return cart.some(item => 
      item.product.deliveryType === 'LOCAL_ONLY' || 
      item.product.deliveryType === 'NATIONWIDE' ||
      !item.product.deliveryType // Fallback for safety
    );
  }, [cart]);

  const isDigitalOnlyOrder = useMemo(() => {
    return cart.length > 0 && cart.every(item => item.product.deliveryType === 'DIGITAL');
  }, [cart]);

  const hasMixedDeliveryTypes = useMemo(() => {
    const types = new Set(cart.map(item => item.product.deliveryType));
    // Filter out undefined if any
    types.delete(undefined);
    return types.size > 1;
  }, [cart]);

  // Delivery is genuinely impossible only if outside Saudi Arabia
  const isGenuinelyImpossible = useMemo(() => {
    if (!hasSelectedDeliveryLocation) return false;
    return !isSaudi;
  }, [hasSelectedDeliveryLocation, isSaudi]);

  // The order has a delivery conflict if it has local items but is regional
  const hasDeliveryConflict = useMemo(() => {
    if (!hasSelectedDeliveryLocation) return false;
    return hasLocalOnlyItems && !isLocalZone && isSaudi;
  }, [hasLocalOnlyItems, isLocalZone, isSaudi, hasSelectedDeliveryLocation]);

  const isCoverageAvailable = useMemo(() => {
    if (!hasSelectedDeliveryLocation) return false;
    // Genuine impossibility blocks
    if (isGenuinelyImpossible) return false;
    // Otherwise we allow it, even with conflicts (per "no blocking" rule)
    return true;
  }, [hasSelectedDeliveryLocation, isGenuinelyImpossible]);

  // React effect to invoke real-time OpenStreetMap Nominatim reverse geocoding (debounced)
  useEffect(() => {
    let isCurrent = true;
    setIsGeocoding(true);

    const fetchAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${i18n.language === 'ar' ? 'ar' : 'en'}&email=maskrklo@gmail.com`
        );
        if (!response.ok) throw new Error();
        const data = await response.json();
        
        if (isCurrent && data && data.address) {
          const addr = data.address;
          
          // Format street and district cleanly
          const street = addr.road || addr.pedestrian || addr.suburb || addr.industrial || '';
          const district = addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district || '';
          const cityVal = addr.city || addr.town || addr.village || addr.county || '';
          const regionVal = addr.state || addr.region || addr.province || '';
          const countryVal = addr.country || (i18n.language === 'ar' ? 'المملكة العربية السعودية' : 'Saudi Arabia');

          const isSaudi = countryVal.toLowerCase().includes('saudi') || countryVal.includes('سعودي') || countryVal.includes('المملكة');
          let available = isSaudi && !!cityVal;
          let etaVal = i18n.language === 'ar' ? 'جاري الحساب...' : 'Calculating...';
          let originalCity = 'Branch B';

          if (isSaudi) {
            const cityLower = cityVal.toLowerCase();
            if (cityLower.includes('dammam') || cityVal.includes('دمام') || cityLower.includes('khobar') || cityVal.includes('خبر') || cityLower.includes('hofuf') || cityVal.includes('هفوف')) {
              etaVal = i18n.language === 'ar' ? 'اليوم • ٢-٤ ساعات' : 'Today • 2–4 Hours';
              originalCity = cityLower.includes('hofuf') ? 'Hofuf' : (cityLower.includes('khobar') ? 'Khobar' : 'Branch B');
            } else if (cityLower.includes('riyadh') || cityVal.includes('رياض')) {
              etaVal = i18n.language === 'ar' ? 'غداً • خلال ٢٤ ساعة' : 'Next Day • 24 Hours';
              originalCity = 'Branch A';
            } else if (cityLower.includes('jeddah') || cityVal.includes('جدة')) {
              etaVal = i18n.language === 'ar' ? 'خلال ٢-٣ أيام' : '2–3 Days';
              originalCity = 'Jeddah';
            } else {
              etaVal = i18n.language === 'ar' ? 'خلال ٣-٤ أيام' : '3–4 Days';
              originalCity = 'Branch B';
            }
          } else {
            available = false;
            etaVal = i18n.language === 'ar' ? 'غير متوفر للتوصيل' : 'Unavailable';
          }

          setNominatimAddress({
            street,
            district,
            city: cityVal,
            region: regionVal,
            country: countryVal,
            available,
            eta: etaVal
          });
        }
      } catch (err) {
        if (isCurrent) {
          const fallback = reverseGeocode(lat, lng, i18n.language === 'ar');
          setNominatimAddress({
            street: fallback.street,
            district: fallback.district,
            city: fallback.city,
            region: fallback.region,
            country: fallback.country,
            available: fallback.available,
            eta: fallback.eta
          });
        }
      } finally {
        if (isCurrent) {
          setIsGeocoding(false);
        }
      }
    };

    const timer = setTimeout(fetchAddress, 450);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [lat, lng, i18n.language]);

  // Synchronize dynamic city parameter, textarea text, and updated time
  useEffect(() => {
    if (!hasSelectedDeliveryLocation) return;
    
    const cName = activeAddress.city.toLowerCase();
    let originalCity = 'Empty Quarter';
    if (activeAddress.available) {
      if (cName.includes('dammam') || cName.includes('دمام')) originalCity = 'Branch B';
      else if (cName.includes('khobar') || cName.includes('خبر')) originalCity = 'Khobar';
      else if (cName.includes('hofuf') || cName.includes('هفوف')) originalCity = 'Hofuf';
      else if (cName.includes('riyadh') || cName.includes('رياض')) originalCity = 'Branch A';
      else if (cName.includes('jeddah') || cName.includes('جدة')) originalCity = 'Jeddah';
      else originalCity = 'Branch B';
    }
    setCity(originalCity);

    setAddress(`${activeAddress.street}, ${activeAddress.district}, ${activeAddress.city}, ${activeAddress.region}, ${activeAddress.country}`);

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    setLastUpdated(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
  }, [activeAddress]);

  // Initialize and mount Leaflet map exactly once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: zoom,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map);

    const goldIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-[#D4AF37]/25 animate-ping"></div>
          <svg viewBox="0 0 24 24" class="w-8 h-8 text-[#D4AF37] filter drop-shadow-[0_2px_10px_rgba(212,175,55,0.55)]" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    const marker = L.marker([lat, lng], {
      icon: goldIcon,
      draggable: true
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setHasSelectedDeliveryLocation(true);
      setLat(pos.lat);
      setLng(pos.lng);
      setSelectedAddressId('');
      setAccuracy(`${(1.5 + Math.random() * 2).toFixed(1)}m`);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setHasSelectedDeliveryLocation(true);
      setLat(lat);
      setLng(lng);
      setSelectedAddressId('');
      setAccuracy(`${(1.5 + Math.random() * 2).toFixed(1)}m`);
    });

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  // Sync state coordinates to Leaflet
  useEffect(() => {
    if (mapInstanceRef.current && markerInstanceRef.current) {
      const curLatLng = markerInstanceRef.current.getLatLng();
      if (curLatLng.lat !== lat || curLatLng.lng !== lng) {
        markerInstanceRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.panTo([lat, lng]);
      }
    }
  }, [lat, lng]);

  // Sync zoom level to Leaflet
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [zoom]);

  // Invalidate map size on expanded state changes to properly align map tiles
  useEffect(() => {
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
  }, [isMapExpanded]);

  // Action to add custom saved addresses dynamically
  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressLabel.trim()) return;

    const newId = `custom-${Date.now()}`;
    const newAddr = {
      id: newId,
      label: newAddressLabel.trim(),
      labelAr: newAddressLabel.trim(),
      street: activeAddress.street,
      streetAr: activeAddress.street,
      district: activeAddress.district,
      districtAr: activeAddress.district,
      city: activeAddress.city,
      cityAr: activeAddress.city,
      region: activeAddress.region,
      regionAr: activeAddress.region,
      country: activeAddress.country,
      countryAr: activeAddress.country,
      lat: lat,
      lng: lng,
      accuracy: '3m',
      eta: activeAddress.eta,
      shippingFee: shippingFee,
      available: activeAddress.available
    };

    setSavedAddresses(prev => [...prev, newAddr]);
    setSelectedAddressId(newId);
    setNewAddressLabel('');
    setShowAddAddressForm(false);
  };

  // Credit Card Mada fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  // Apply discount if exists
  const discountAmount = useMemo(() => {
    if (subtotal === 0) return 0;
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const subtotalAfterDiscount = subtotal - discountAmount;

  // Saudi Arabia VAT (15%)
  const vatRate = 0.15;
  const vatAmount = parseFloat((subtotalAfterDiscount * vatRate).toFixed(2));

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

  const finalTotal = parseFloat((subtotalAfterDiscount + vatAmount + shippingFee).toFixed(2));

  // Handle GPS Current Location
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setHasSelectedDeliveryLocation(true);
          const latVal = position.coords.latitude;
          const lngVal = position.coords.longitude;
          setLat(latVal);
          setLng(lngVal);
          const accuracyVal = position.coords.accuracy ? `${position.coords.accuracy.toFixed(1)}m` : '1.8m';
          setAccuracy(accuracyVal);
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
          
          setHasSelectedDeliveryLocation(true);
          setLat(targetLat);
          setLng(targetLng);
          setAccuracy('8.5m');
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
    
    setHasSelectedDeliveryLocation(true);
    setPinX(pctX);
    setPinY(pctY);
    setSelectedAddressId('');
    setAccuracy(`${(3.0 + Math.random() * 2).toFixed(1)}m`);
    
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
    if (!isCoverageAvailable) {
      alert(i18n.language === 'ar' ? 'عذراً، التوصيل متاح حالياً داخل المملكة العربية السعودية فقط.' : 'Sorry, delivery is currently available within Saudi Arabia only.');
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      alert(i18n.language === 'ar' ? 'يرجى إدخال كافة الحقول المطلوبة لبيانات العميل.' : 'Kindly fill in all required customer coordinates.');
      return;
    }

    if (paymentMethod === 'mada' || paymentMethod === 'applepay') {
      setIsSubmitting(true);
      fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `ZL-${Math.floor(100000 + Math.random() * 900000)}`,
          items: cart.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            selectedOption: item.selectedOption
          })),
          couponCode,
          shippingId: deliveryOption === 'local' ? 'free' : 'regional',
          paymentMethod: paymentMethod === 'mada' ? 'mada' : 'applepay',
          customerName: name.trim(),
          customerEmail: email.trim() || settings.email,
          customerPhone: phone.trim(),
          address: `${address.trim()}, ${city}, Saudi Arabia`,
          customerId: currentUser?.id || null
        })
      })
      .then(res => {
        if (!res.ok) {
          return res.json().then(data => { throw new Error(data.error || 'Failed to create payment session') });
        }
        return res.json();
      })
      .then(data => {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          throw new Error('No redirect URL returned by gateway');
        }
      })
      .catch(err => {
        alert(err.message || 'Error initiating payment connection.');
        setIsSubmitting(false);
      });
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
      discount: discountAmount,
      tax: vatAmount,
      total: finalTotal,
      status: 'Pending',
      customerName: name.trim(),
      email: email.trim() || settings.email, // Optional email handled safely
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
              <h3 className="text-[#f2f7da] text-[12px] leading-[19px] font-bold font-display uppercase tracking-widest border-b border-white/5 pb-3">
                {i18n.language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
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
                    <span>{i18n.language === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email Address (optional)'}</span>
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
                {!isDigitalOnlyOrder && (
                  <>
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

                    {/* 5. Shipping Address */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block">
                        {i18n.language === 'ar' ? 'عنوان الشارع والحي للتوصيل' : 'Shipping Address'} <span className="text-gold-pure">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={i18n.language === 'ar' ? 'مثال: حي الشاطئ، شارع الأمير محمد، فيلا 4ب' : settings.address.replace(', Saudi Arabia', '')}
                        className="w-full bg-black border border-white/5 rounded-sm p-3 text-xs text-white focus:outline-none focus:border-gold-pure/45 transition-colors placeholder:text-zinc-600/40"
                      />
                    </div>

                    {/* 6. SELECT DELIVERY LOCATION Experience */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      {hasMixedDeliveryTypes && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xs"
                        >
                          <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                            <div className="space-y-1">
                              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                                {i18n.language === 'ar' ? 'طلب توصيل مختلط' : 'Mixed Delivery Order'}
                              </p>
                              <p className="text-[10px] text-zinc-400 leading-relaxed">
                                {i18n.language === 'ar' 
                                  ? 'يحتوي طلبك على منتجات بقيود توصيل مختلفة. بعض المنتجات متاحة فقط للتوصيل المحلي، بينما يمكن شحن الأخرى وطنياً.'
                                  : 'Your order contains products with different delivery restrictions. Some items are only available for local delivery, while others can be shipped nationwide.'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {hasStorePickupOnlyItems && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-gold-pure/5 border border-gold-pure/20 rounded-xs"
                        >
                          <div className="flex gap-3">
                            <Store className="w-5 h-5 text-gold-pure shrink-0" />
                            <div className="space-y-1">
                              <p className="text-[11px] font-bold text-gold-pure uppercase tracking-widest">
                                {i18n.language === 'ar' ? 'يتطلب الاستلام من المتجر' : 'Store Pickup Required'}
                              </p>
                              <p className="text-[10px] text-zinc-400 leading-relaxed">
                                {i18n.language === 'ar' 
                                  ? 'بعض المنتجات في سلتك متاحة فقط للاستلام من الفرع. يرجى التنسيق للاستلام بعد إتمام الطلب.'
                                  : 'Some products in your cart are only available for store pickup. Please coordinate for pickup after completing the order.'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-zinc-300 uppercase tracking-widest font-bold flex items-center gap-1.5">
                        <span>📍 {i18n.language === 'ar' ? 'موقع التوصيل الفاخر' : 'SELECT DELIVERY LOCATION'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setDevMode(!devMode)}
                        className="text-[8.5px] uppercase tracking-wider font-semibold text-zinc-500 hover:text-gold-pure flex items-center gap-1 transition-colors"
                      >
                        {devMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{devMode ? (i18n.language === 'ar' ? 'إخفاء تفاصيل الموقع' : 'Hide Location Details') : (i18n.language === 'ar' ? 'تفاصيل الموقع' : 'Location Details')}</span>
                      </button>
                    </div>

              {/* SAVED ADDRESSES QUICK PICKER */}
              {hasSelectedDeliveryLocation && (
                <div className="space-y-2">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-semibold px-1">
                    {i18n.language === 'ar' ? 'العناوين المحفوظة السريعة' : 'Quick Saved Addresses'}
                  </span>

                  {/* Dynamic add custom address sub-form inside the checkout flow */}
                  {showAddAddressForm && (
                    <div className="p-3 bg-zinc-900/60 border border-gold-pure/20 rounded-xs space-y-2 animate-fade-in mx-1">
                      <p className="text-[9.5px] text-zinc-400">
                        {i18n.language === 'ar' ? 'أدخل اسماً لحفظ الإحداثيات الحالية كعنوان سريع (مثال: الشاليه، ملحق)' : 'Give a label to save current GPS coordinates as a quick preset (e.g., Beach House, Penthouse):'}
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAddressLabel}
                          onChange={(e) => setNewAddressLabel(e.target.value)}
                          placeholder={i18n.language === 'ar' ? 'اسم العنوان' : 'Address Label (e.g. My Villa)'}
                          className="flex-1 bg-black border border-white/10 rounded-sm p-2 text-xs text-white focus:outline-none focus:border-gold-pure"
                        />
                        <button
                          type="button"
                          onClick={handleAddNewAddress}
                          className="px-3 bg-gold-pure hover:bg-gold-pure/80 text-black text-[10px] font-bold rounded-xs transition-all"
                        >
                          {i18n.language === 'ar' ? 'حفظ' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddAddressForm(false)}
                          className="px-2 bg-black border border-white/5 hover:bg-zinc-800 text-zinc-400 text-[10px] rounded-xs"
                        >
                          {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-1">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => {
                            setHasSelectedDeliveryLocation(true);
                            setSelectedAddressId(addr.id);
                            setLat(addr.lat);
                            setLng(addr.lng);
                            setAccuracy(addr.accuracy);
                            setGoogleMapsLink(`https://www.google.com/maps/search/?api=1&query=${addr.lat},${addr.lng}`);
                          }}
                          className={`p-2.5 rounded-sm border text-left rtl:text-right flex flex-col justify-between transition-all duration-300 min-h-[64px] group active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'bg-[#D4AF37]/10 border-gold-pure shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                              : 'bg-zinc-950 border-white/5 hover:border-white/10 hover:bg-zinc-900'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10.5px] font-bold text-white tracking-wide">
                              {i18n.language === 'ar' ? addr.labelAr : addr.label}
                            </span>
                            <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-gold-pure' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                          </div>
                          <span className="text-[8.5px] text-zinc-500 font-mono truncate max-w-full block mt-1.5 group-hover:text-zinc-400">
                            {i18n.language === 'ar' ? addr.cityAr || addr.city : addr.city}
                          </span>
                        </button>
                      );
                    })}

                    {/* ADD NEW ADDRESS CARD */}
                    <button
                      type="button"
                      onClick={() => setShowAddAddressForm(!showAddAddressForm)}
                      className={`p-2.5 rounded-sm border border-dashed text-center flex flex-col items-center justify-center transition-all duration-300 min-h-[64px] group active:scale-95 cursor-pointer ${
                        showAddAddressForm
                          ? 'bg-gold-pure/5 border-gold-pure'
                          : 'bg-black/40 border-white/10 hover:border-gold-pure/40 hover:bg-zinc-900'
                      }`}
                    >
                      <Plus className={`w-5 h-5 mb-1 ${showAddAddressForm ? 'text-gold-pure' : 'text-zinc-500 group-hover:text-gold-pure'}`} />
                      <span className="text-[9.5px] font-bold text-zinc-400 group-hover:text-gold-pure uppercase tracking-tighter">
                        {i18n.language === 'ar' ? 'إضافة جديد' : 'Add New'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

                  {/* DELIVERY EXPERIENCE (EMPTY OR ACTIVE) */}
                  <AnimatePresence mode="wait">
                    {!hasSelectedDeliveryLocation ? (
                      <motion.div
                        key="delivery-empty"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="relative overflow-hidden bg-black border border-gold-pure/30 rounded-sm p-10 text-center space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                      >
                        {/* Luxury Gold Border Glow */}
                        <div className="absolute inset-0 border border-gold-pure/10 rounded-sm pointer-events-none"></div>
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold-pure to-transparent"></div>
                        
                        <div className="w-20 h-20 rounded-full bg-gold-pure/5 flex items-center justify-center border border-gold-pure/20 mx-auto shadow-[0_0_40px_rgba(212,175,55,0.1)] relative">
                          <MapPin className="w-10 h-10 text-gold-pure" />
                          <div className="absolute inset-0 rounded-full animate-ping bg-gold-pure/10 opacity-20"></div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-white text-lg font-bold uppercase tracking-[0.3em] font-display">
                            {i18n.language === 'ar' ? '📍 حدد موقع التوصيل الخاص بك' : '📍 Select Your Delivery Location'}
                          </h4>
                          <div className="space-y-4 text-zinc-400 text-[11px] leading-relaxed max-w-md mx-auto font-sans">
                            <p className="text-zinc-200 font-medium">
                              {i18n.language === 'ar' 
                                ? 'اختر موقع التوصيل باستخدام الخريطة التفاعلية أو موقع GPS الحالي الخاص بك.'
                                : 'Choose a delivery location using the interactive map or your current GPS location.'}
                            </p>
                            
                            <div className="pt-2 space-y-2 text-left rtl:text-right bg-white/[0.02] border border-white/5 rounded-xs p-4">
                              <p className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold border-b border-white/5 pb-2 mb-2">
                                {i18n.language === 'ar' ? `بمجرد اختيار الموقع، سيقوم ${brandName} تلقائياً بحساب:` : `Once a location is selected, ${brandName.toUpperCase()} will automatically calculate:`}
                              </p>
                              <ul className="grid grid-cols-1 gap-2 text-[10px] font-medium text-zinc-400">
                                <li className="flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-gold-pure"></span>
                                  {i18n.language === 'ar' ? 'توفر التوصيل' : 'Delivery availability'}
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-gold-pure"></span>
                                  {i18n.language === 'ar' ? 'رسوم الشحن' : 'Shipping fee'}
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-gold-pure"></span>
                                  {i18n.language === 'ar' ? 'وقت التوصيل المتوقع' : 'Estimated delivery time'}
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-gold-pure"></span>
                                  {i18n.language === 'ar' ? 'منطقة التوصيل' : 'Delivery zone'}
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="w-1 h-1 rounded-full bg-gold-pure"></span>
                                  {i18n.language === 'ar' ? 'عنوان التوصيل المعتمد' : 'Verified delivery address'}
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                          <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            className="flex items-center justify-center gap-2.5 px-8 py-4 bg-gold-pure text-black text-[11px] font-bold uppercase tracking-[0.2em] rounded-xs hover:bg-gold-light transition-all active:scale-95 shadow-[0_10px_30px_rgba(212,175,55,0.2)] w-full sm:w-auto min-w-[220px]"
                          >
                            <Compass className="w-4 h-4" />
                            <span>{i18n.language === 'ar' ? '📡 استخدام الموقع الحالي' : '📡 Use Current Location'}</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={scrollToMap}
                            className="flex items-center justify-center gap-2.5 px-8 py-4 bg-black border border-gold-pure/40 text-gold-pure text-[11px] font-bold uppercase tracking-[0.2em] rounded-xs hover:bg-gold-pure/5 hover:border-gold-pure transition-all active:scale-95 w-full sm:w-auto min-w-[220px]"
                          >
                            <Map className="w-4 h-4" />
                            <span>{i18n.language === 'ar' ? '🗺 اختر من الخريطة' : '🗺 Choose on Map'}</span>
                          </button>

                          {savedAddresses.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                // Select first saved address as a shortcut
                                setHasSelectedDeliveryLocation(true);
                                const addr = savedAddresses[0];
                                setSelectedAddressId(addr.id);
                                setLat(addr.lat);
                                setLng(addr.lng);
                                setAccuracy(addr.accuracy);
                              }}
                              className="flex items-center justify-center gap-2.5 px-8 py-4 bg-zinc-900 border border-white/10 text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-xs hover:bg-zinc-800 transition-all active:scale-95 w-full sm:w-auto min-w-[220px]"
                            >
                              <Star className="w-4 h-4 text-gold-pure" />
                              <span>{i18n.language === 'ar' ? '🏠 استخدام عنوان محفوظ' : '🏠 Use Saved Address'}</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="delivery-active"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="relative overflow-hidden bg-gradient-to-b from-[#0c0c0c] to-[#040404] border border-white/5 rounded-xs p-4.5 space-y-4 shadow-xl"
                      >
                        {/* Gold top accent line */}
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-3">
                          {/* Left: Geocoded Readable Address */}
                          <div className="space-y-1.5 flex-1 text-left rtl:text-right">
                            <div className="flex items-center gap-1.5 text-gold-pure text-[11px] font-bold uppercase tracking-wider">
                              {selectedAddressId ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-500">✓ Default Delivery Address</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{i18n.language === 'ar' ? 'عنوان التوصيل المعتمد' : 'VERIFIED DELIVERY ADDRESS'}</span>
                                </>
                              )}
                            </div>
                            
                            <div className="space-y-0.5 font-sans">
                              {isGeocoding ? (
                                <div className="flex items-center gap-2 py-1">
                                  <RefreshCw className="w-3.5 h-3.5 text-gold-pure animate-spin" />
                                  <span className="text-xs text-zinc-400 font-mono italic">
                                    {i18n.language === 'ar' ? 'جاري الاستعلام عن العنوان...' : 'Resolving coordinate address...'}
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm font-semibold text-white leading-snug">
                                    {activeAddress.street}, {activeAddress.district}
                                  </p>
                                  <p className="text-xs text-zinc-400 font-medium">
                                    {activeAddress.city}, {activeAddress.region}, {activeAddress.country}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Right: GPS verified badge & details */}
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 shrink-0">
                            <div className="flex flex-col items-end gap-1.5">
                              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest leading-none">
                                {i18n.language === 'ar' ? 'حالة الخدمة' : 'SERVICE STATUS'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isCoverageAvailable ? (hasDeliveryConflict ? 'bg-amber-400' : 'bg-emerald-400') : (hasDeliveryConflict ? 'bg-amber-400' : 'bg-rose-500')}`}></span>
                                <span className="text-xs font-semibold text-zinc-200">
                                  {isCoverageAvailable 
                                    ? (i18n.language === 'ar' ? 'التوصيل متاح' : 'Delivery Available') 
                                    : (hasDeliveryConflict 
                                        ? (i18n.language === 'ar' ? 'تغطية جزئية (راجع سلتك)' : 'Partial Coverage (Review Cart)')
                                        : (i18n.language === 'ar' ? 'خارج نطاق التوصيل' : 'Outside Service Delivery Area'))}
                                </span>
                              </div>
                            </div>

                            <div className="text-right rtl:text-left font-mono text-[8.5px] text-zinc-500 space-y-0.5">
                              <div>
                                <span className="text-zinc-650 uppercase mr-1 rtl:ml-1">{i18n.language === 'ar' ? 'الدقة:' : 'Accuracy:'}</span>
                                <span className="text-zinc-300 font-bold">{accuracy}</span>
                              </div>
                              <div>
                                <span className="text-zinc-650 uppercase mr-1 rtl:ml-1">{i18n.language === 'ar' ? 'تحديث:' : 'Updated:'}</span>
                                <span className="text-zinc-300">{lastUpdated}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Developer mode lat/lng coordinates */}
                        {devMode && (
                          <div className="p-2.5 bg-black/80 border border-gold-pure/20 rounded-xs font-mono text-[10px] text-gold-pure flex items-center justify-between animate-fade-in">
                            <div>
                              <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block">{i18n.language === 'ar' ? 'خط العرض' : 'LATITUDE'}</span>
                              <span>{lat.toFixed(6)}</span>
                            </div>
                            <div className="h-6 w-[1px] bg-white/5"></div>
                            <div>
                              <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block">{i18n.language === 'ar' ? 'خط الطول' : 'LONGITUDE'}</span>
                              <span>{lng.toFixed(6)}</span>
                            </div>
                            <div className="h-6 w-[1px] bg-white/5"></div>
                            <a
                              href={googleMapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-gold-pure/10 hover:bg-gold-pure/20 border border-gold-pure/20 text-[8.5px] uppercase font-bold tracking-wider rounded-xs text-gold-pure flex items-center gap-1 transition-all duration-200"
                            >
                              <span>{i18n.language === 'ar' ? 'فتح الخرائط' : 'Maps Link'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}

                        {/* DELIVERY INFORMATION MATRIX */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          {/* Zone Info */}
                          <div className="p-3 bg-black/40 border border-white/[0.03] rounded-xs space-y-1.5 flex flex-col justify-between text-left rtl:text-right">
                            <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest font-bold">
                              {i18n.language === 'ar' ? 'منطقة التوصيل' : 'Delivery Zone'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-zinc-400" />
                              <span className="text-xs font-semibold text-zinc-200">
                                {isCoverageAvailable 
                                  ? (deliveryOption === 'local' ? (i18n.language === 'ar' ? 'توصيل محلي' : 'Local Delivery') : (i18n.language === 'ar' ? 'شحن إقليمي' : 'Regional Shipping')) 
                                  : (i18n.language === 'ar' ? 'غير مدعوم' : 'N/A')}
                              </span>
                            </div>
                          </div>

                          {/* SERVICE STATUS */}
                          <div className="p-3 bg-black/40 border border-white/[0.03] rounded-xs space-y-1.5 flex flex-col justify-between text-left rtl:text-right">
                            <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest font-bold">
                              {i18n.language === 'ar' ? 'التوافر والخدمة' : 'SERVICE STATUS'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${isCoverageAvailable ? (hasDeliveryConflict ? 'bg-amber-400' : 'bg-emerald-400') : (hasDeliveryConflict ? 'bg-amber-400' : 'bg-rose-500')}`}></span>
                              <span className="text-xs font-semibold text-zinc-200">
                                {isCoverageAvailable 
                                  ? (hasDeliveryConflict 
                                      ? (i18n.language === 'ar' ? 'تغطية جزئية' : 'Partial Coverage')
                                      : (i18n.language === 'ar' ? 'توصيل متوفر' : 'Service Available')) 
                                  : (hasDeliveryConflict
                                      ? (i18n.language === 'ar' ? 'توصيل محلي متعارض' : 'Local Conflict')
                                      : (i18n.language === 'ar' ? 'غير متوفر دولياً' : 'International Only'))}
                              </span>
                            </div>
                          </div>

                          {/* SHIPPING DETAILS */}
                          <div className="p-3 bg-black/40 border border-white/[0.03] rounded-xs space-y-1.5 flex flex-col justify-between text-left rtl:text-right">
                            <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest font-bold">
                              {i18n.language === 'ar' ? 'الشحن والمدة' : 'SHIPPING DETAILS'}
                            </span>
                            <div className="space-y-0.5">
                              <p className="text-[10.5px] font-bold text-gold-pure">
                                {shippingFee === 0 ? (i18n.language === 'ar' ? 'توصيل مجاني' : 'Free Delivery') : `${shippingFee} SAR`}
                              </p>
                              <p className="text-[8.5px] text-zinc-500 font-mono">
                                {activeAddress.eta}
                              </p>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setHasSelectedDeliveryLocation(false);
                            setNominatimAddress(null);
                          }}
                          className="w-full py-2.5 text-[9px] font-bold text-zinc-600 hover:text-white uppercase tracking-[0.2em] transition-all duration-300 border border-white/5 hover:border-white/10 rounded-xs mt-1"
                        >
                          {i18n.language === 'ar' ? 'إعادة ضبط الموقع' : 'Reset & Re-select Location'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ACTION BUTTONS (UPGRADED VISUALLY) */}
                  {hasSelectedDeliveryLocation && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full animate-fade-in">
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="flex-1 py-3 px-4 bg-zinc-950 hover:bg-zinc-900 text-white rounded-sm text-xs font-semibold tracking-wide flex items-center justify-center gap-2 border border-white/5 hover:border-gold-pure/40 active:scale-95 duration-200 cursor-pointer min-h-[44px]"
                      >
                        <Compass className="w-4 h-4 text-gold-pure shrink-0" />
                        <span>{i18n.language === 'ar' ? 'تحديد الموقع بـ GPS' : 'Use Current Location'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMapExpanded(!isMapExpanded)}
                        className={`flex-1 py-3 px-4 rounded-sm text-xs font-semibold tracking-wide flex items-center justify-center gap-2 border active:scale-95 duration-200 cursor-pointer min-h-[44px] ${
                          isMapExpanded
                            ? 'bg-gold-pure text-black border-gold-pure font-bold shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                            : 'bg-zinc-950 hover:bg-zinc-900 text-white border-white/5 hover:border-gold-pure/40'
                        }`}
                      >
                        {isMapExpanded ? <Minimize2 className="w-4 h-4 shrink-0" /> : <Maximize2 className="w-4 h-4 shrink-0" />}
                        <span>{isMapExpanded ? (i18n.language === 'ar' ? 'تصغير حجم الخريطة' : 'Minimize Map Size') : (i18n.language === 'ar' ? 'تكبير حجم الخريطة' : 'Expand Map Size')}</span>
                      </button>
                    </div>
                  )}

                  {/* FULLY FUNCTIONAL INTERACTIVE OPENSTREETMAP CONTAINER USING LEAFLET */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-semibold text-left rtl:text-right">
                      {i18n.language === 'ar' ? 'خريطة التوصيل المباشرة التفاعلية' : 'SELECT ON MAP'}
                    </span>
                    <div 
                      className={`relative rounded-xs border border-white/5 overflow-hidden group shadow-xl bg-[#0a0a0a] transition-all duration-300 ${
                        isMapExpanded ? 'h-[450px]' : 'h-52 sm:h-56'
                      }`}
                    >
                      {/* Leaflet map binding container */}
                      <div 
                        ref={mapContainerRef} 
                        className="w-full h-full z-0 pointer-events-auto"
                        style={{ background: '#0a0a0a' }}
                      ></div>

                      {/* Custom Dark Theme Map Instruction overlay */}
                      <div className="absolute top-3 right-3 bg-black/85 backdrop-blur-sm border border-white/10 p-2.5 rounded-sm max-w-[190px] text-[9.5px] text-zinc-300 pointer-events-none select-none z-10 hidden sm:block">
                        <p className="leading-snug">
                          {i18n.language === 'ar' ? 'اضغط لتحديد الموقع، أو اسحب العلامة الذهبية لتعديل العنوان تلقائياً.' : 'Click anywhere on the map or drag the gold marker to fine-tune your delivery address.'}
                        </p>
                      </div>

                      {/* Floating Gold Zoom & View Controls Overlay */}
                      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setZoom(prev => Math.min(20, prev + 1));
                          }}
                          className="w-8 h-8 bg-black/95 border border-white/10 hover:border-gold-pure text-white hover:text-gold-pure rounded-xs flex items-center justify-center transition-all duration-150 cursor-pointer shadow-md"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setZoom(prev => Math.max(10, prev - 1));
                          }}
                          className="w-8 h-8 bg-black/95 border border-white/10 hover:border-gold-pure text-white hover:text-gold-pure rounded-xs flex items-center justify-center transition-all duration-150 cursor-pointer shadow-md"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Open Full Map Button Overlay */}
                      <div className="absolute top-3 left-3 z-10">
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-black/95 hover:bg-zinc-900 text-white hover:text-gold-pure border border-white/10 hover:border-gold-pure text-[9px] font-bold uppercase tracking-wider rounded-xs flex items-center gap-1.5 transition-all duration-150 cursor-pointer shadow-md"
                        >
                          <Navigation className="w-3 h-3 text-gold-pure" />
                          <span>{i18n.language === 'ar' ? 'عرض على OpenStreetMap' : 'Open in OSM'}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* PRODUCT-BASED SHIPPING RULES INFO */}
                  {hasDeliveryConflict && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-amber-950/20 border border-amber-500/25 rounded-xs flex items-start gap-3 text-xs text-amber-300 animate-fade-in"
                    >
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-500 mt-0.5 shrink-0" />
                      <div className="space-y-1 text-left">
                        <p className="font-bold text-[13px] uppercase tracking-wide">
                          {i18n.language === 'ar' ? 'ملاحظة حول التوصيل المحلي' : 'Local Delivery Note'}
                        </p>
                        <p className="opacity-90 leading-relaxed font-sans">
                          {i18n.language === 'ar' 
                            ? 'يحتوي طلبك على منتجات متوفرة فقط للتوصيل المحلي. يرجى التأكد من أن عنوانك يقع ضمن مناطق التوصيل المحلي المدعومة.' 
                            : 'Your cart contains items available for local delivery only. Please ensure your delivery address is within our supported local delivery zones.'}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {isGenuinelyImpossible && (
                    <div className="p-4 bg-rose-950/20 border border-rose-500/25 rounded-xs flex items-start gap-3 text-xs text-rose-300 animate-fade-in">
                      <AlertTriangle className="w-4.5 h-4.5 text-rose-500 mt-0.5 shrink-0" />
                      <div className="space-y-1 text-left">
                        <p className="font-bold text-[13px] uppercase tracking-wide">
                          {i18n.language === 'ar' ? 'خارج نطاق التغطية' : 'Outside Service Area'}
                        </p>
                        <p className="opacity-90 leading-relaxed font-sans">
                          {i18n.language === 'ar' 
                            ? 'عذراً، متجر زوال يوفر التوصيل حالياً داخل المملكة العربية السعودية فقط.' 
                            : `We sincerely apologize, but ${brandName.toUpperCase()} store currently provides delivery within the Kingdom of Saudi Arabia only.`}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}
          </div>
        </div>

            {/* Courier Delivery Method Box */}
            {hasSelectedDeliveryLocation && !isDigitalOnlyOrder && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-zinc-950 border border-white/5 rounded-sm p-6 space-y-4"
              >
                <h3 className="text-[#f2f7da] text-[11px] font-bold font-display uppercase tracking-widest border-b border-white/5 pb-3">Delivery Method</h3>
                
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
              </motion.div>
            )}

            {/* Payment options (formerly sealed payment) */}
            <div className="bg-zinc-950 border border-white/5 rounded-sm p-6 space-y-4">
              <h3 className="text-[#f2f7da] text-xs font-bold font-display uppercase tracking-widest border-b border-[#f2f7da] pb-3">
                {i18n.language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
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


                {/* 2. Apple Pay Button (Highly polished) */}
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
                      
                      {/* Apple Pay Logo (Icon + Text) */}
                      <div className="flex items-center justify-center gap-1 w-full h-full text-black">
                        <svg viewBox="0 0 50 50" className="w-6 h-6" fill="black">
                          <path d="M 44.527344 34.75 C 43.449219 37.144531 42.929688 38.214844 41.542969 40.328125 C 39.601563 43.28125 36.863281 46.96875 33.480469 46.992188 C 30.46875 47.019531 29.691406 45.027344 25.601563 45.0625 C 21.515625 45.082031 20.664063 47.03125 17.648438 47 C 14.261719 46.96875 11.671875 43.648438 9.730469 40.699219 C 4.300781 32.429688 3.726563 22.734375 7.082031 17.578125 C 9.457031 13.921875 13.210938 11.773438 16.738281 11.773438 C 20.332031 11.773438 22.589844 13.746094 25.558594 13.746094 C 28.441406 13.746094 30.195313 11.769531 34.351563 11.769531 C 37.492188 11.769531 40.8125 13.480469 43.1875 16.433594 C 35.421875 20.691406 36.683594 31.78125 44.527344 34.75 Z M 31.195313 8.46875 C 32.707031 6.527344 33.855469 3.789063 33.4375 1 C 30.972656 1.167969 28.089844 2.742188 26.40625 4.78125 C 24.878906 6.640625 23.613281 9.398438 24.105469 12.066406 C 26.796875 12.152344 29.582031 10.546875 31.195313 8.46875 Z"/>
                        </svg>
                        <span className="text-2xl font-semibold -ml-1 text-black font-sans">Pay</span>
                      </div>
                    </div>
                  </div>

                  {/* Button Label */}
                  <div className="w-full text-center mt-3 z-20 shrink-0">
                    <span className={`text-[10px] md:text-[10.5px] font-display font-semibold uppercase tracking-widest block transition-colors duration-300 ${
                      paymentMethod === 'applepay' ? 'text-[#D4AF37]' : 'text-zinc-400 group-hover:text-white'
                    }`}>
                      {paymentMethod === 'applepay' ? (i18n.language === 'ar' ? '● آبل باي' : '● APPLE PAY') : (i18n.language === 'ar' ? 'آبل باي' : 'APPLE PAY')}
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
                      placeholder="0000 0000 0000 0000"
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
                      <div className="relative">
                        <input
                          type={showCardCvv ? 'text' : 'password'}
                          maxLength={3}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-black border border-white/5 rounded-xs p-2 pr-10 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none text-center focus:border-gold-pure/30"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCardCvv(!showCardCvv)}
                          className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-[#D4AF37]/80 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xs"
                          aria-label={showCardCvv ? 'Hide CVV' : 'Show CVV'}
                        >
                          {showCardCvv ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
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
            <h3 className="text-[#f2f7da] text-sm font-bold font-display uppercase tracking-widest border-b border-[#f2f7da] pb-3">
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

              {/* Discount if applied */}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>{t('checkout.discount', { defaultValue: 'Discount' })} ({discountPercent}%)</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)} {t('app.sar')}</span>
                </div>
              )}

              {/* VAT (15%) */}
              <div className="flex justify-between text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span>{i18n.language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'}</span>
                  <span className="text-[9px] px-1 py-0.5 rounded-xs bg-white/5 border border-white/10">15%</span>
                </div>
                <span className="font-mono text-zinc-200">{formatCurrency(vatAmount)} {t('app.sar')}</span>
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
