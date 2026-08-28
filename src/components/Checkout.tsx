import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, CreditCard, ChevronRight, CheckCircle, Truck, ShieldAlert, ArrowLeft, Landmark, Compass, MapPin,
  Map, Check, Clock, Home, Briefcase, Star, RefreshCw, ZoomIn, ZoomOut, AlertTriangle, Eye, EyeOff,
  Plus, Maximize2, Minimize2, ExternalLink, Store, X
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CartItem, Order, Product } from '../types';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils';
import { SafeImage } from '../imageRegistry';
import { getShippingConfig } from '../data/shippingData';
import { supabaseClient } from '../lib/supabaseClient';
import { getShippingOptionsFromServer } from '../services/shippingService';

import { useBranding } from './BrandingContext';

interface CheckoutProps {
  cart: CartItem[];
  discountPercent: number; // Keeping prop to avoid breaking parent App.tsx if it passes it
  couponCode: string;     // Keeping prop to avoid breaking parent
  onOrderSuccess: (order: Order) => void;
  onBackToCart: () => void;
  deliveryZones?: any[];  // Optional Dynamic delivery zones list
  currentUser: any;
  onSelectProduct?: (product: Product) => void;
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
  // Safe default fallback when Nominatim is loading or unavailable
  return {
    street: '',
    district: '',
    city: '',
    region: '',
    country: isArabic ? 'المملكة العربية السعودية' : 'Saudi Arabia',
    eta: isArabic ? 'جاري الحساب...' : 'Calculating...',
    available: true,
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
  currentUser,
  onSelectProduct
}: CheckoutProps) {
  const { t, i18n } = useTranslation();
  const { settings } = useBranding();
  const brandName = 'ZOAL';
  
  // Contact details
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Optional now
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  // Real-time validation state
  const [phoneBlurred, setPhoneBlurred] = useState(false);
  const [emailBlurred, setEmailBlurred] = useState(false);

  const isPhoneValid = useMemo(() => {
    const p = phone.trim().replace(/[\s\-]/g, '');
    if (!p) return false;
    const phoneRegex = /^(\+9665|9665|05|5)\d{8}$/;
    return phoneRegex.test(p);
  }, [phone]);

  const isEmailValid = useMemo(() => {
    const e = email.trim();
    if (!e) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(e);
  }, [email]);

  const phoneStatus = useMemo<'idle' | 'valid' | 'invalid'>(() => {
    const p = phone.trim().replace(/[\s\-]/g, '');
    if (!p) return 'idle';
    if (isPhoneValid) return 'valid';
    if (phoneBlurred) return 'invalid';

    // In-progress Saudi prefixes while user is typing
    // Pattern 1: +9665XXXXXXXX (+, +9, +96, +966, +9665, +9665 + 1..7 digits)
    if (p === '+' || p === '+9' || p === '+96' || p === '+966' || p === '+9665') {
      return 'idle';
    }
    if (/^\+9665\d{1,7}$/.test(p)) {
      return 'idle';
    }

    // Pattern 2: 9665XXXXXXXX (9, 96, 966, 9665, 9665 + 1..7 digits)
    if (p === '9' || p === '96' || p === '966' || p === '9665') {
      return 'idle';
    }
    if (/^9665\d{1,7}$/.test(p)) {
      return 'idle';
    }

    // Pattern 3: 05XXXXXXXX (0, 05, 05 + 1..7 digits)
    if (p === '0' || p === '05') {
      return 'idle';
    }
    if (/^05\d{1,7}$/.test(p)) {
      return 'idle';
    }

    // Pattern 4: 5XXXXXXXX (5, 5 + 1..7 digits)
    if (p === '5') {
      return 'idle';
    }
    if (/^5\d{1,7}$/.test(p)) {
      return 'idle';
    }

    // Any other format/length is an invalid candidate
    return 'invalid';
  }, [phone, isPhoneValid, phoneBlurred]);

  const emailStatus = useMemo(() => {
    const e = email.trim();
    if (!e) return 'idle';
    if (isEmailValid) return 'valid';
    
    const hasAt = e.includes('@');
    const parts = e.split('@');
    const hasDotInDomain = hasAt && parts[1] && parts[1].includes('.');
    const isSufficientlyComplete = hasAt && hasDotInDomain && e.length > 8;

    if (emailBlurred || isSufficientlyComplete) {
      return 'invalid';
    }
    return 'idle';
  }, [email, isEmailValid, emailBlurred]);

  const handleClearPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPhone('');
    setPhoneBlurred(false);
  };

  const handleClearEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEmail('');
    setEmailBlurred(false);
  };

  const [deliveryOption, setDeliveryOption] = useState<'local' | 'regional'>('regional');
  const [availableShippingOptions, setAvailableShippingOptions] = useState<any[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<any | null>(null);
  const [isResolvingShipping, setIsResolvingShipping] = useState(false);
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
  const [isLocating, setIsLocating] = useState(false);

  // Dynamic Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState(INITIAL_SAVED_ADDRESSES);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const activeMapRequestIdRef = useRef<string | null>(null);

  const handleOpenMapPickerPage = () => {
    const reqId = 'loc_req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    activeMapRequestIdRef.current = reqId;
    const mapPickerUrl = `/map-selection?requestId=${reqId}&lat=${lat}&lng=${lng}&lang=${i18n.language}`;
    
    const mapWin = window.open(mapPickerUrl, '_blank');
    if (!mapWin) {
      // Fallback if popup blocked
      scrollToMap();
    }
  };

  // Listen for confirmed location from external Map Picker tab
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('zoal_location_channel');
      } catch (e) {
        console.warn('BroadcastChannel initialization error:', e);
      }
    }

    const handleIncomingLocation = (data: any) => {
      if (!data || data.type !== 'LOCATION_SELECTED' || data.confirmed !== true) return;

      // Ensure response matches active requestId to prevent stale tab overwrites
      if (activeMapRequestIdRef.current && data.requestId !== activeMapRequestIdRef.current) {
        console.warn('Ignored location response from stale map tab session:', data.requestId);
        return;
      }

      // Validate coordinates strictly
      const { lat: newLat, lng: newLng } = data;
      if (
        typeof newLat !== 'number' ||
        typeof newLng !== 'number' ||
        !Number.isFinite(newLat) ||
        !Number.isFinite(newLng) ||
        newLat < -90 || newLat > 90 ||
        newLng < -180 || newLng > 180
      ) {
        console.error('Received invalid coordinates from map picker:', newLat, newLng);
        return;
      }

      setLat(newLat);
      setLng(newLng);
      setIsGeocoding(true);
      setNominatimAddress(null);
      setHasSelectedDeliveryLocation(true);
      setGoogleMapsLink(`https://www.google.com/maps/search/?api=1&query=${newLat},${newLng}`);
      setAccuracy('1.5m');
    };

    if (channel) {
      channel.onmessage = (event) => {
        handleIncomingLocation(event.data);
      };
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'zoal_confirmed_location' && event.newValue) {
        try {
          const payload = JSON.parse(event.newValue);
          handleIncomingLocation(payload);
        } catch (e) {
          console.error('Error parsing storage event location payload:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const scrollToMap = () => {
    setIsMapExpanded(true);
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
    const country = (activeAddress.country || '').toLowerCase();
    return country.includes('saudi') || country.includes('سعودي') || country.includes('المملكة');
  }, [activeAddress.country]);

  const isLocalZone = useMemo(() => {
    const cityLower = (activeAddress.city || '').toLowerCase();
    return cityLower.includes('hofuf') || (activeAddress.city || '').includes('هفوف');
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
    
    const cName = (activeAddress.city || '').toLowerCase();
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

    const parts = [
      activeAddress.street,
      activeAddress.district,
      activeAddress.city,
      activeAddress.region,
      activeAddress.country
    ].filter(Boolean);

    if (parts.length > 0) {
      setAddress(parts.join(', '));
    } else if (lat && lng) {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    setLastUpdated(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
  }, [activeAddress]);

  // Initialize and mount Leaflet map when location is selected
  useEffect(() => {
    if (!hasSelectedDeliveryLocation || !mapContainerRef.current) return;

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
      setIsGeocoding(true);
      setNominatimAddress(null);
      setHasSelectedDeliveryLocation(true);
      setLat(pos.lat);
      setLng(pos.lng);
      setSelectedAddressId('');
      setAccuracy(`${(1.5 + Math.random() * 2).toFixed(1)}m`);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setIsGeocoding(true);
      setNominatimAddress(null);
      setHasSelectedDeliveryLocation(true);
      setLat(lat);
      setLng(lng);
      setSelectedAddressId('');
      setAccuracy(`${(1.5 + Math.random() * 2).toFixed(1)}m`);
    });

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;

    const t1 = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    const t2 = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [hasSelectedDeliveryLocation]);

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

  // Dynamic Shipping rules resolution based on geocoded/selected city and district
  useEffect(() => {
    let isCurrent = true;
    const fetchOptions = async () => {
      const resolvedCity = city || activeAddress.city;
      const resolvedDistrict = activeAddress.district;

      if (!resolvedCity) return;

      setIsResolvingShipping(true);
      try {
        const options = await getShippingOptionsFromServer({
          city: resolvedCity,
          district: resolvedDistrict,
          subtotal
        });
        if (isCurrent) {
          setAvailableShippingOptions(options);
          if (options.length > 0) {
            const preferredMethod = deliveryOption === 'local' ? 'local_delivery' : 'smsa';
            const matchedOption = options.find(o => o.method === preferredMethod);
            
            if (matchedOption) {
              setSelectedShippingOption(matchedOption);
            } else {
              const anyAvailable = options.find(o => o.available);
              setSelectedShippingOption(anyAvailable || options[0]);
              const isLocalSelected = (anyAvailable || options[0]).method === 'local_delivery';
              setDeliveryOption(isLocalSelected ? 'local' : 'regional');
            }
          } else {
            setSelectedShippingOption(null);
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic shipping options:', err);
      } finally {
        if (isCurrent) {
          setIsResolvingShipping(false);
        }
      }
    };

    fetchOptions();
    return () => {
      isCurrent = false;
    };
  }, [city, activeAddress.city, activeAddress.district, subtotal]);

  // Sync selectedShippingOption when deliveryOption (tabs) is changed by user
  useEffect(() => {
    if (availableShippingOptions.length > 0) {
      const targetMethod = deliveryOption === 'local' ? 'local_delivery' : 'smsa';
      const match = availableShippingOptions.find(o => o.method === targetMethod);
      if (match) {
        setSelectedShippingOption(match);
      }
    }
  }, [deliveryOption, availableShippingOptions]);

  const shippingFee = useMemo(() => {
    if (subtotal === 0) return 0;
    return selectedShippingOption ? selectedShippingOption.fee : 25;
  }, [selectedShippingOption, subtotal]);

  const finalTotal = parseFloat((subtotalAfterDiscount + vatAmount + shippingFee).toFixed(2));

  // Handle GPS Current Location
  const handleUseCurrentLocation = () => {
    if (isLocating) return;

    if (!navigator.geolocation) {
      alert(
        i18n.language === 'ar'
          ? 'خاصية تحديد الموقع غير مدعومة في متصفحك. يُرجى إدخال العنوان يدويًا.'
          : 'Geolocation is not supported by your browser. Please enter your address manually.'
      );
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const latVal = position.coords.latitude;
        const lngVal = position.coords.longitude;
        setLat(latVal);
        setLng(lngVal);
        setIsGeocoding(true);
        setNominatimAddress(null);
        setHasSelectedDeliveryLocation(true);
        const accuracyVal = position.coords.accuracy ? `${position.coords.accuracy.toFixed(1)}m` : '1.8m';
        setAccuracy(accuracyVal);
        setGoogleMapsLink(`https://www.google.com/maps/search/?api=1&query=${latVal},${lngVal}`);
        
        // Map real coordinates to visual projection box in Saudi
        const visualY = ((27.5 - latVal) / (27.5 - 24.0)) * 100;
        const visualX = ((lngVal - 46.0) / (50.5 - 46.0)) * 100;
        setPinY(Math.max(5, Math.min(95, visualY)));
        setPinX(Math.max(5, Math.min(95, visualX)));
      },
      (error) => {
        setIsLocating(false);
        // Do NOT set simulated coordinates, do NOT alter hasSelectedDeliveryLocation, do NOT clear address.
        let msg = '';
        if (error.code === error.PERMISSION_DENIED) {
          msg = i18n.language === 'ar'
            ? 'تعذر الوصول إلى موقعك الحالي. يُرجى السماح بالوصول إلى الموقع أو إدخال عنوانك يدويًا.'
            : 'Unable to access your current location. Please allow location access or enter your address manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = i18n.language === 'ar'
            ? 'تعذر تحديد موقعك الحالي. يُرجى إدخال عنوانك يدويًا أو تحديده على الخريطة.'
            : 'Your current location could not be detected. Please enter your address manually or choose on map.';
        } else if (error.code === error.TIMEOUT) {
          msg = i18n.language === 'ar'
            ? 'انتهت مهلة تحديد الموقع. يُرجى المحاولة مرة أخرى أو تحديد موقعك على الخريطة.'
            : 'Location detection timed out. Please try again or choose your location on the map.';
        } else {
          msg = i18n.language === 'ar'
            ? 'تعذر الوصول إلى موقعك الحالي. يُرجى إدخال عنوانك يدويًا أو اختياره من الخريطة.'
            : 'Unable to access your current location. Please enter your address manually or choose your location on the map.';
        }
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
    setPhoneBlurred(true);
    setEmailBlurred(true);

    if (!termsAccepted) {
      alert(i18n.language === 'ar' ? 'يرجى الموافقة على الشروط والأحكام لإتمام الطلب.' : 'Please accept the Terms & Conditions to proceed with your order.');
      return;
    }

    if (!isCoverageAvailable) {
      alert(i18n.language === 'ar' ? 'عذراً، التوصيل متاح حالياً داخل المملكة العربية السعودية فقط.' : 'Sorry, delivery is currently available within Saudi Arabia only.');
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      alert(i18n.language === 'ar' ? 'يرجى إدخال كافة الحقول المطلوبة لبيانات العميل.' : 'Kindly fill in all required customer coordinates.');
      return;
    }
    if (!isPhoneValid) {
      alert(i18n.language === 'ar' ? 'يرجى إدخال رقم جوال صحيح.' : 'Please enter a valid phone number.');
      return;
    }
    if (email.trim() && !isEmailValid) {
      alert(i18n.language === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.');
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
          paymentMethod: paymentMethod,
          customerName: name.trim(),
          customerEmail: email.trim() || settings.email,
          customerPhone: phone.trim(),
          address: `${address.trim()}, ${city}, Saudi Arabia`,
          customerId: currentUser?.id || null,
          termsAccepted: true
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
      paymentMethod: (paymentMethod as string) === 'mada' ? 'Mada Card' : (paymentMethod as string) === 'applepay' ? 'Apple Pay' : 'Pay at Delivery',
      trackingNumber: `ZLT-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      termsAccepted: true,
      // Added coordinates fields for dynamic logs
      latitude: lat,
      longitude: lng,
      mapLocationLink: googleMapsLink,
      region: city,
      city: city || activeAddress.city,
      district: activeAddress.district || '',
      postalCode: '',
      deliveryMethod: deliveryOption === 'local' ? 'Local Delivery' : 'Regional Delivery'
    } as any; // Cast as any to pass expanded fields comfortably

    onOrderSuccess(newOrder);
  };

  return (
    <div className="bg-black text-white min-h-screen pt-[36px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-20 select-none">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        {/* Head */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-1 sm:pb-6 mb-1.5 sm:mb-10 gap-1 sm:gap-4">
          <div>
            <button
              type="button"
              onClick={onBackToCart}
              className="inline-flex items-center space-x-1 sm:space-x-2 rtl:space-x-reverse text-[#D4AF37] hover:text-white transition-colors text-[11px] sm:text-xs font-semibold uppercase tracking-widest mb-0.5 sm:mb-2 cursor-pointer min-h-[36px] sm:min-h-0 py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 rtl:rotate-180" />
              <span>
                {sessionStorage.getItem('zoal_checkout_source') === 'buy-now'
                  ? t('checkout.back_to_product', { defaultValue: 'BACK TO PRODUCT' })
                  : t('checkout.back_to_basket', { defaultValue: 'BACK TO BASKET' })}
              </span>
            </button>
            <h1 className="text-[14px] min-[360px]:text-[16px] min-[400px]:text-[18px] sm:text-3xl font-semibold tracking-normal sm:tracking-wider font-display uppercase text-white leading-tight sm:leading-normal whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
              {i18n.language === 'ar' ? 'مراجعة الطلب والدفع' : 'Order Review & Checkout'}
            </h1>
          </div>
        </div>

        {/* Form Grid */}
        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-8 items-start">
          
          {/* Inputs Section (columns 1 to 7) */}
          <div className="lg:col-span-7 space-y-3.5 sm:space-y-6">
            
            {/* Contact Information Box */}
            <div className="bg-zinc-950 border border-white/5 rounded-sm p-2.5 sm:p-6 space-y-2 sm:space-y-4">
              <h2 className="text-[#f2f7da] text-[10px] sm:text-[12px] leading-tight font-bold font-display uppercase tracking-widest border-b border-white/5 pb-2 sm:pb-3">
                {i18n.language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
              </h2>
              
              <div className="space-y-2 sm:space-y-4">
                {/* 1. Full Name */}
                <div className="space-y-0.5 sm:space-y-1">
                  <label htmlFor="checkout-name" className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block mb-0.5 sm:mb-1">
                    {i18n.language === 'ar' ? 'الاسم الكامل' : 'Full Name'} <span className="text-gold-pure">*</span>
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder=""
                    className="w-full bg-black border border-zinc-800 sm:border-white/5 rounded-sm h-9 sm:h-auto min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-gold-pure/80 focus:ring-1 focus:ring-gold-pure/20 sm:focus:border-gold-pure/45 sm:focus:ring-0 transition-colors max-w-full min-w-0"
                  />
                </div>

                {/* 2. Phone Number */}
                <div className="space-y-0.5 sm:space-y-1">
                  <label htmlFor="checkout-phone" className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block mb-0.5 sm:mb-1">
                    {i18n.language === 'ar' ? 'رقم الجوال (مطلوب)' : 'Phone Number (Required)'} <span className="text-gold-pure">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="checkout-phone"
                      type="tel"
                      required
                      value={phone}
                      onBlur={() => setPhoneBlurred(true)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPhone(val);
                        if (!val) {
                          setPhoneBlurred(false);
                        }
                      }}
                      placeholder=""
                      className={`w-full bg-black border rounded-sm h-9 sm:h-auto min-h-[36px] sm:min-h-[40px] px-2.5 pr-9 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors max-w-full min-w-0 ${
                        phoneStatus === 'valid'
                          ? 'border-green-500/50 sm:border-white/5 focus:border-green-500 focus:ring-1 focus:ring-green-500/20 sm:focus:border-gold-pure/45 sm:focus:ring-0'
                          : phoneStatus === 'invalid'
                          ? 'border-red-500/50 sm:border-white/5 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 sm:focus:border-gold-pure/45 sm:focus:ring-0'
                          : 'border-zinc-800 sm:border-white/5 focus:border-gold-pure/80 focus:ring-1 focus:ring-gold-pure/20 sm:focus:border-gold-pure/45 sm:focus:ring-0'
                      }`}
                    />
                    {phoneStatus === 'valid' && (
                      <div className="absolute right-2.5 flex items-center pointer-events-none sm:hidden">
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      </div>
                    )}
                    {phoneStatus === 'invalid' && (
                      <button
                        type="button"
                        onClick={handleClearPhone}
                        aria-label="Clear phone number"
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/5 transition-colors text-red-500 pointer-events-auto active:scale-95 sm:hidden z-10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {phoneStatus === 'invalid' && (
                    <p className="text-[9.5px] sm:hidden text-red-500 leading-tight mt-0.5 font-medium">
                      {i18n.language === 'ar' 
                        ? 'رقم جوال غير صالح. يرجى إدخال رقم سعودي صحيح (مثال: 05XXXXXXXX أو 9665XXXXXXXX).' 
                        : 'Invalid phone number. Must be a valid Saudi mobile number (e.g. 05XXXXXXXX or 9665XXXXXXXX).'}
                    </p>
                  )}
                </div>

                {/* 3. Email Address */}
                <div className="space-y-0.5 sm:space-y-1">
                  <label htmlFor="checkout-email" className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block flex items-center justify-between mb-0.5 sm:mb-1">
                    <span>{i18n.language === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email Address (optional)'}</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="checkout-email"
                      type="email"
                      value={email}
                      onBlur={() => setEmailBlurred(true)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmail(val);
                        if (!val) {
                          setEmailBlurred(false);
                        }
                      }}
                      placeholder=""
                      className={`w-full bg-black border rounded-sm h-9 sm:h-auto min-h-[36px] sm:min-h-[40px] px-2.5 pr-9 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors max-w-full min-w-0 ${
                        emailStatus === 'valid'
                          ? 'border-green-500/50 sm:border-white/5 focus:border-green-500 focus:ring-1 focus:ring-green-500/20 sm:focus:border-gold-pure/45 sm:focus:ring-0'
                          : emailStatus === 'invalid'
                          ? 'border-red-500/50 sm:border-white/5 focus:border-red-500 focus:ring-1 focus:ring-red-500/20 sm:focus:border-gold-pure/45 sm:focus:ring-0'
                          : 'border-zinc-800 sm:border-white/5 focus:border-gold-pure/80 focus:ring-1 focus:ring-gold-pure/20 sm:focus:border-gold-pure/45 sm:focus:ring-0'
                      }`}
                    />
                    {emailStatus === 'valid' && (
                      <div className="absolute right-2.5 flex items-center pointer-events-none sm:hidden">
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      </div>
                    )}
                    {emailStatus === 'invalid' && (
                      <button
                        type="button"
                        onClick={handleClearEmail}
                        aria-label="Clear email address"
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/5 transition-colors text-red-500 pointer-events-auto active:scale-95 sm:hidden z-10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {emailStatus === 'invalid' && (
                    <p className="text-[9.5px] sm:hidden text-red-500 leading-tight mt-0.5 font-medium">
                      {i18n.language === 'ar' 
                        ? 'البريد الإلكتروني غير صالح.' 
                        : 'Invalid email address format.'}
                    </p>
                  )}
                </div>

                {/* 4. City / Region */}
                {!isDigitalOnlyOrder && (
                  <>
                    <div className="space-y-0.5 sm:space-y-1">
                      <label htmlFor="checkout-city" className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block mb-0.5 sm:mb-1">
                        {i18n.language === 'ar' ? 'المدينة / المنطقة' : 'City / Region'} <span className="text-gold-pure">*</span>
                      </label>
                      <select
                        id="checkout-city"
                        value={city}
                        onChange={(e) => {
                          const selectedCity = e.target.value;
                          setCity(selectedCity);
                          // Auto-center coordinates based on selected city
                          const selCityLower = (selectedCity || '').toLowerCase();
                          const zone = (deliveryZones || DEFAULT_ZONES).find(
                            (z) => (z.city || '').toLowerCase() === selCityLower
                          );
                          if (zone) {
                            let nLat = 26.4312;
                            let nLng = 50.1108;
                            if (selCityLower === 'hofuf') { nLat = 25.3783; nLng = 49.5866; }
                            else if (selCityLower === 'khobar') { nLat = 26.2172; nLng = 50.1971; }
                            else if (selCityLower === 'riyadh') { nLat = 24.7136; nLng = 46.6753; }
                            else if (selCityLower === 'jeddah') { nLat = 21.4858; nLng = 39.1925; }
                            setLat(nLat);
                            setLng(nLng);
                            setGoogleMapsLink(`https://www.google.com/maps/search/?api=1&query=${nLat},${nLng}`);
                          }
                        }}
                        className="w-full bg-black border border-zinc-800 sm:border-white/5 rounded-sm h-9 sm:h-auto min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 sm:py-2.5 text-xs sm:text-sm text-zinc-300 focus:outline-none focus:border-gold-pure/80 focus:ring-1 focus:ring-gold-pure/20 sm:focus:border-gold-pure/45 sm:focus:ring-0 transition-colors cursor-pointer max-w-full min-w-0"
                      >
                        {(deliveryZones || DEFAULT_ZONES).map((z) => {
                          let cityName = z.city;
                          let regionName = z.region || z.city;
                          const zCityLower = (z.city || '').toLowerCase();
                          if (i18n.language === 'ar') {
                            if (zCityLower === 'hofuf') { cityName = 'الهفوف'; regionName = 'الهفوف والمناطق المجاورة'; }
                            else if (zCityLower === 'branch b') { cityName = 'الدمام / الخبر (المنطقة الشرقية)'; regionName = 'المنطقة الشرقية'; }
                            else if (zCityLower === 'khobar') { cityName = 'الخبر'; regionName = 'المنطقة الشرقية'; }
                            else if (zCityLower === 'branch a') { cityName = 'الرياض'; regionName = 'المنطقة الوسطى'; }
                            else if (zCityLower === 'jeddah') { cityName = 'جدة'; regionName = 'المنطقة الغربية'; }
                          }
                          return (
                            <option key={z.id} value={z.city}>
                              {cityName} ({regionName})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* 5. Shipping Address */}
                    <div className="space-y-0.5 sm:space-y-1">
                      <label htmlFor="checkout-address" className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block mb-0.5 sm:mb-1">
                        {i18n.language === 'ar' ? 'عنوان الشارع والحي للتوصيل' : 'Shipping Address'} <span className="text-gold-pure">*</span>
                      </label>
                      <textarea
                        id="checkout-address"
                        required
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={i18n.language === 'ar' ? 'مثال: حي الشاطئ، شارع الأمير محمد، فيلا 4ب' : settings.address.replace(', Saudi Arabia', '')}
                        className="w-full bg-black border border-zinc-800 sm:border-white/5 rounded-sm min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-gold-pure/80 focus:ring-1 focus:ring-gold-pure/20 sm:focus:border-gold-pure/45 sm:focus:ring-0 transition-colors placeholder:text-zinc-600/40 max-w-full min-w-0"
                      />
                    </div>

                    {/* 6. SELECT DELIVERY LOCATION Experience */}
                    <div className="space-y-2.5 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/5">
                      {hasMixedDeliveryTypes && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 sm:p-4 bg-amber-950/20 border border-amber-500/20 rounded-xs"
                        >
                          <div className="flex gap-2.5 sm:gap-3">
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
                            <div className="space-y-0.5 sm:space-y-1">
                              <p className="text-[10.5px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-wider sm:tracking-widest">
                                {i18n.language === 'ar' ? 'طلب توصيل مختلط' : 'Mixed Delivery Order'}
                              </p>
                              <p className="text-[9.5px] sm:text-[10px] text-zinc-400 leading-relaxed">
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
                          className="p-3 sm:p-4 bg-gold-pure/5 border border-gold-pure/20 rounded-xs"
                        >
                          <div className="flex gap-2.5 sm:gap-3">
                            <Store className="w-4 h-4 sm:w-5 sm:h-5 text-gold-pure shrink-0" />
                            <div className="space-y-0.5 sm:space-y-1">
                              <p className="text-[10.5px] sm:text-[11px] font-bold text-gold-pure uppercase tracking-wider sm:tracking-widest">
                                {i18n.language === 'ar' ? 'يتطلب الاستلام من المتجر' : 'Store Pickup Required'}
                              </p>
                              <p className="text-[9.5px] sm:text-[10px] text-zinc-400 leading-relaxed">
                                {i18n.language === 'ar' 
                                  ? 'بعض المنتجات في سلتك متاحة فقط للاستلام من الفرع. يرجى التنسيق للاستلام بعد إتمام الطلب.'
                                  : 'Some products in your cart are only available for store pickup. Please coordinate for pickup after completing the order.'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-[10px] text-zinc-300 uppercase tracking-wider sm:tracking-widest font-bold flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gold-pure shrink-0" />
                        <span>
                          {hasSelectedDeliveryLocation 
                            ? (i18n.language === 'ar' ? 'موقع التوصيل الخاص بك' : 'YOUR DELIVERY LOCATION')
                            : (i18n.language === 'ar' ? 'تحديد موقع التوصيل' : 'SELECT YOUR DELIVERY LOCATION')}
                        </span>
                      </label>
                      {hasSelectedDeliveryLocation && (
                        <button
                          type="button"
                          onClick={() => setDevMode(!devMode)}
                          className="text-[8.5px] uppercase tracking-wider font-semibold text-zinc-500 hover:text-gold-pure flex items-center gap-1 transition-colors min-h-[44px] sm:min-h-0 flex items-center"
                        >
                          {devMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{devMode ? (i18n.language === 'ar' ? 'إخفاء تفاصيل الموقع' : 'Hide Location Details') : (i18n.language === 'ar' ? 'تفاصيل الموقع' : 'Location Details')}</span>
                        </button>
                      )}
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
                      <div className="space-y-2 sm:space-y-3">
                        {/* Main Bordered Location Card */}
                        <motion.div
                          key="delivery-empty"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="relative overflow-hidden bg-black border border-gold-pure/30 rounded-sm p-2.5 sm:p-4 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                        >
                          {/* Luxury Gold Border Glow */}
                          <div className="absolute inset-0 border border-gold-pure/10 rounded-sm pointer-events-none"></div>
                          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold-pure to-transparent"></div>

                          <div className="text-zinc-300 text-[10.5px] sm:text-xs leading-tight max-w-full sm:max-w-md mx-auto font-sans">
                            <p className="font-medium leading-tight line-clamp-2">
                              {i18n.language === 'ar' 
                                ? 'اختر موقع التوصيل باستخدام الخريطة التفاعلية أو موقع GPS الحالي الخاص بك.'
                                : 'Choose a delivery location using the interactive map or your current GPS location.'}
                            </p>
                          </div>
                        </motion.div>

                        {/* Action Buttons OUTSIDE the Card */}
                        <div className="grid grid-cols-2 sm:flex sm:flex-row items-center justify-center gap-1.5 sm:gap-3">
                          <button
                            type="button"
                            disabled={isLocating}
                            onClick={handleUseCurrentLocation}
                            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-6 py-1.5 sm:py-3 bg-gold-pure text-black text-xs sm:text-[11px] font-bold uppercase tracking-wider rounded-xs hover:bg-gold-light transition-all active:scale-95 shadow-[0_10px_30px_rgba(212,175,55,0.2)] w-full sm:w-auto sm:min-w-[180px] h-9 sm:h-10 min-h-[36px] disabled:opacity-75 disabled:cursor-not-allowed disabled:active:scale-100"
                          >
                            {isLocating ? (
                              <>
                                <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                                <span>{i18n.language === 'ar' ? 'جاري التحديد...' : 'Locating...'}</span>
                              </>
                            ) : (
                              <>
                                <Compass className="w-4 h-4 shrink-0" />
                                <span>{i18n.language === 'ar' ? 'الموقع الحالي' : 'Use Current'}</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleOpenMapPickerPage}
                            className="flex items-center justify-center gap-1.5 px-2.5 sm:px-6 py-1.5 sm:py-3 bg-black border border-gold-pure/40 text-gold-pure text-xs sm:text-[11px] font-bold uppercase tracking-wider rounded-xs hover:bg-gold-pure/5 hover:border-gold-pure transition-all active:scale-95 w-full sm:w-auto sm:min-w-[180px] h-9 sm:h-10 min-h-[36px]"
                          >
                            <Map className="w-4 h-4 shrink-0" />
                            <span>{i18n.language === 'ar' ? 'الخريطة' : 'Choose on Map'}</span>
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
                              className="col-span-2 sm:col-auto flex items-center justify-center gap-1.5 px-2.5 sm:px-6 py-1.5 sm:py-3 bg-zinc-900 border border-white/10 text-white text-xs sm:text-[11px] font-bold uppercase tracking-wider rounded-xs hover:bg-zinc-800 transition-all active:scale-95 w-full sm:w-auto sm:min-w-[180px] h-9 sm:h-10 min-h-[36px]"
                            >
                              <Star className="w-4 h-4 text-gold-pure shrink-0" />
                              <span>{i18n.language === 'ar' ? 'عنوان محفوظ' : 'Use Saved'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        key="delivery-active"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="relative overflow-hidden bg-gradient-to-b from-[#0c0c0c] to-[#040404] border border-white/5 rounded-xs p-3.5 sm:p-4.5 shadow-xl"
                      >
                        {/* Gold top accent line */}
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

                        {/* DESKTOP & TABLET VIEW (>=768px) - UNCHANGED PIXEL PERFECT */}
                        <div className="hidden md:block space-y-3 sm:space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-4 border-b border-white/5 pb-2.5 sm:pb-3">
                            {/* Left: Geocoded Readable Address */}
                            <div className="space-y-1 sm:space-y-1.5 flex-1 text-left rtl:text-right">
                              <div className="flex items-center gap-1.5 text-gold-pure text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider">
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
                                      {i18n.language === 'ar' ? 'جاري تحديد عنوان التوصيل...' : 'Resolving delivery address...'}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
                                      {activeAddress.street || activeAddress.district ? (
                                        `${activeAddress.street}${activeAddress.street && activeAddress.district ? ', ' : ''}${activeAddress.district}`
                                      ) : (
                                        i18n.language === 'ar' ? 'تم تحديد الموقع (إحداثيات GPS)' : 'Location Selected (GPS Coordinates)'
                                      )}
                                    </p>
                                    <p className="text-[11px] sm:text-xs text-zinc-400 font-medium">
                                      {activeAddress.city || activeAddress.region ? (
                                        `${activeAddress.city}${activeAddress.city && activeAddress.region ? ', ' : ''}${activeAddress.region}${activeAddress.country ? ', ' + activeAddress.country : ''}`
                                      ) : (
                                        `${lat.toFixed(4)}, ${lng.toFixed(4)} • ${activeAddress.country}`
                                      )}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Right: GPS verified badge & details */}
                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-2.5 shrink-0">
                              <div className="flex flex-col items-start sm:items-end gap-1">
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
                                className="px-2 py-1 bg-gold-pure/10 hover:bg-gold-pure/20 border border-gold-pure/20 text-[8.5px] uppercase font-bold tracking-wider rounded-xs text-gold-pure flex items-center gap-1 transition-all duration-200 min-h-[44px] sm:min-h-0 flex items-center"
                              >
                                <span>{i18n.language === 'ar' ? 'فتح الخرائط' : 'Maps Link'}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}

                          {/* DELIVERY INFORMATION MATRIX */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-1">
                            {/* Zone Info */}
                            <div className="p-2.5 sm:p-3 bg-black/40 border border-white/[0.03] rounded-xs space-y-1 sm:space-y-1.5 flex flex-col justify-between text-left rtl:text-right">
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
                            <div className="p-2.5 sm:p-3 bg-black/40 border border-white/[0.03] rounded-xs space-y-1 sm:space-y-1.5 flex flex-col justify-between text-left rtl:text-right">
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
                            <div className="p-2.5 sm:p-3 bg-black/40 border border-white/[0.03] rounded-xs space-y-1 sm:space-y-1.5 flex flex-col justify-between text-left rtl:text-right">
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
                            className="w-full min-h-[44px] bg-black hover:bg-zinc-900 text-gold-pure hover:text-white uppercase tracking-wider transition-all duration-200 border border-gold-pure/30 hover:border-gold-pure rounded-xs mt-2 flex items-center justify-center gap-2 font-bold text-xs cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-gold-pure shrink-0" />
                            <span>{i18n.language === 'ar' ? 'تغيير الموقع' : 'CHANGE LOCATION'}</span>
                          </button>
                        </div>

                        {/* MOBILE VIEW (<768px) - FINAL PREMIUM LUXURY OPTIMIZATION */}
                        <div className="block md:hidden space-y-3.5 px-0.5 text-left rtl:text-right">
                          {/* 1. PRIMARY TITLE */}
                          <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                            <MapPin className="w-4.5 h-4.5 text-[#D4AF37]" />
                            <h3 className="text-base font-bold tracking-wide text-white uppercase">
                              {i18n.language === 'ar' ? 'موقع التوصيل الخاص بك' : 'YOUR DELIVERY LOCATION'}
                            </h3>
                          </div>

                          {/* 2. ADDRESS */}
                          <div className="py-0.5">
                            {isGeocoding ? (
                              <div className="flex items-center gap-2 py-1">
                                <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" />
                                <span className="text-xs text-zinc-400 font-mono italic">
                                  {i18n.language === 'ar' ? 'جاري تحديد عنوان التوصيل...' : 'Resolving delivery address...'}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-base font-semibold text-white leading-7">
                                  {activeAddress.street || activeAddress.district ? (
                                    `${activeAddress.street}${activeAddress.street && activeAddress.district ? ', ' : ''}${activeAddress.district}`
                                  ) : (
                                    i18n.language === 'ar' ? 'تم تحديد الموقع (إحداثيات GPS)' : 'Location Selected (GPS Coordinates)'
                                  )}
                                </p>
                                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                                  {activeAddress.city || activeAddress.region ? (
                                    `${activeAddress.city}${activeAddress.city && activeAddress.region ? ', ' : ''}${activeAddress.region}${activeAddress.country ? ', ' + activeAddress.country : ''}`
                                  ) : (
                                    `${lat.toFixed(4)}, ${lng.toFixed(4)} • ${activeAddress.country}`
                                  )}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* 3. DELIVERY STATUS */}
                          <div className="flex items-center justify-between border-t border-white/5 pt-3">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              {i18n.language === 'ar' ? 'حالة التوصيل' : 'Delivery Status'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${isCoverageAvailable ? (hasDeliveryConflict ? 'bg-amber-400' : 'bg-emerald-400') : (hasDeliveryConflict ? 'bg-amber-400' : 'bg-rose-500')}`}></span>
                              <span className="text-xs font-semibold text-zinc-200">
                                {isCoverageAvailable 
                                  ? (i18n.language === 'ar' ? 'التوصيل متاح' : 'Delivery Available') 
                                  : (hasDeliveryConflict 
                                      ? (i18n.language === 'ar' ? 'تغطية جزئية' : 'Partial Coverage')
                                      : (i18n.language === 'ar' ? 'خارج النطاق' : 'Outside Service Area'))}
                              </span>
                            </div>
                          </div>

                          {/* 4. DELIVERY TYPE */}
                          <div className="flex items-center justify-between border-t border-white/5 pt-3">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              {i18n.language === 'ar' ? 'نوع التوصيل' : 'Delivery Type'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-zinc-400" />
                              <span className="text-xs font-semibold text-zinc-200">
                                {isCoverageAvailable 
                                  ? (deliveryOption === 'local' 
                                      ? (i18n.language === 'ar' ? 'توصيل محلي' : 'Local Delivery') 
                                      : (i18n.language === 'ar' ? 'توصيل قياسي' : 'Standard Delivery')) 
                                  : (i18n.language === 'ar' ? 'غير متوفر' : 'N/A')}
                              </span>
                            </div>
                          </div>

                          {/* 5. SHIPPING DETAILS */}
                          <div className="flex items-center justify-between border-t border-white/5 pt-3 pb-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              {i18n.language === 'ar' ? 'الشحن والمدة' : 'SHIPPING DETAILS'}
                            </span>
                            <div className="text-right rtl:text-left">
                              <span className="text-xs font-bold text-[#D4AF37]">
                                {shippingFee === 0 ? (i18n.language === 'ar' ? 'توصيل مجاني' : 'Free Delivery') : `${shippingFee} SAR`}
                              </span>
                              {activeAddress.eta && (
                                <span className="text-[10px] text-zinc-500 font-mono block">
                                  {activeAddress.eta}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* CHANGE ADDRESS BUTTON */}
                          <div className="pt-2 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => {
                                setHasSelectedDeliveryLocation(false);
                                setNominatimAddress(null);
                              }}
                              className="w-full min-h-[48px] text-xs font-bold text-gold-pure hover:text-white uppercase tracking-wider transition-all duration-300 border border-gold-pure/30 hover:border-gold-pure rounded-xs flex items-center justify-center gap-2 cursor-pointer bg-black"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-gold-pure shrink-0" />
                              <span>{i18n.language === 'ar' ? 'تغيير الموقع' : 'CHANGE LOCATION'}</span>
                            </button>
                          </div>
                        </div>

                        {/* RESTORED EMBEDDED INTERACTIVE LEAFLET MAP FOR FINE-TUNING */}
                        <div className="mt-3.5 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-gold-pure text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                              <MapPin className="w-3.5 h-3.5 text-gold-pure" />
                              <span>{i18n.language === 'ar' ? 'تعديل الموقع على الخريطة' : 'ADJUST LOCATION ON MAP'}</span>
                            </div>
                            <span className="text-[8.5px] sm:text-[9.5px] text-zinc-400 font-mono">
                              {i18n.language === 'ar' ? 'اسحب العلامة أو انقر للتعديل' : 'Drag marker or click to refine'}
                            </span>
                          </div>

                          <div className="relative w-full h-[180px] sm:h-[220px] rounded-xs overflow-hidden border border-gold-pure/25 shadow-inner bg-black">
                            <div ref={mapContainerRef} className="w-full h-full z-0" />
                            
                            {/* Map Zoom Controls */}
                            <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 z-[400] flex flex-col gap-1 shadow-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  const newZoom = Math.min(zoom + 1, 19);
                                  setZoom(newZoom);
                                  if (mapInstanceRef.current) mapInstanceRef.current.setZoom(newZoom);
                                }}
                                className="w-7 h-7 bg-black/85 hover:bg-zinc-900 border border-gold-pure/30 text-gold-pure flex items-center justify-center rounded-xs transition-colors cursor-pointer active:scale-95"
                                title={i18n.language === 'ar' ? 'تكبير' : 'Zoom In'}
                                aria-label="Zoom In"
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const newZoom = Math.max(zoom - 1, 4);
                                  setZoom(newZoom);
                                  if (mapInstanceRef.current) mapInstanceRef.current.setZoom(newZoom);
                                }}
                                className="w-7 h-7 bg-black/85 hover:bg-zinc-900 border border-gold-pure/30 text-gold-pure flex items-center justify-center rounded-xs transition-colors cursor-pointer active:scale-95"
                                title={i18n.language === 'ar' ? 'تصغير' : 'Zoom Out'}
                                aria-label="Zoom Out"
                              >
                                <ZoomOut className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* PRODUCT-BASED SHIPPING RULES INFO */}
                  {hasDeliveryConflict && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 sm:p-4 bg-amber-950/20 border border-amber-500/25 rounded-xs flex flex-col sm:flex-row items-stretch sm:items-start gap-2.5 sm:gap-3 text-xs text-amber-300 animate-fade-in"
                    >
                      <div className="flex items-center gap-2 sm:block shrink-0">
                        <AlertTriangle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-500" />
                        <p className="font-bold text-[11px] sm:text-[13px] uppercase tracking-wide block sm:hidden">
                          {i18n.language === 'ar' ? 'ملاحظة حول التوصيل المحلي' : 'Local Delivery Note'}
                        </p>
                      </div>
                      <div className="space-y-1 text-left rtl:text-right">
                        <p className="font-bold text-[13px] uppercase tracking-wide hidden sm:block">
                          {i18n.language === 'ar' ? 'ملاحظة حول التوصيل المحلي' : 'Local Delivery Note'}
                        </p>
                        <p className="opacity-90 leading-relaxed font-sans text-[10.5px] sm:text-xs line-clamp-2 sm:line-clamp-none">
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
                className="bg-zinc-950 border border-white/5 rounded-sm p-3.5 sm:p-6 space-y-3 sm:space-y-4"
              >
                <h2 className="text-[#f2f7da] text-[10px] sm:text-[11px] font-bold font-display uppercase tracking-widest border-b border-white/5 pb-2.5 sm:pb-3">
                  {i18n.language === 'ar' ? 'طريقة التوصيل' : 'Delivery Method'}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Dynamic Option A: Local Delivery */}
                  {availableShippingOptions.some(o => o.method === 'local_delivery') && (() => {
                    const option = availableShippingOptions.find(o => o.method === 'local_delivery')!;
                    const active = deliveryOption === 'local';
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (option.available) setDeliveryOption('local');
                        }}
                        disabled={!option.available}
                        className={`p-2.5 sm:p-4 border rounded-sm text-left rtl:text-right flex items-start gap-2.5 sm:gap-4 transition-all ${
                          !option.available 
                            ? 'opacity-40 cursor-not-allowed border-white/5 bg-black/20 text-zinc-650'
                            : active
                              ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white cursor-pointer'
                              : 'border-white/5 bg-black/40 text-zinc-500 hover:border-white/10 cursor-pointer'
                        }`}
                      >
                        <Truck className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 ${active ? 'text-gold-pure' : 'text-zinc-650'}`} />
                        <div>
                          <h4 className="text-[11px] sm:text-xs font-display font-semibold uppercase tracking-wider text-white">
                            {i18n.language === 'ar' ? 'توصيل محلي' : 'Local Delivery'}
                          </h4>
                          <p className="text-[9.5px] sm:text-[10px] text-zinc-400 mt-0.5 sm:mt-1">
                            {i18n.language === 'ar' ? 'متوفر في الهفوف والمناطق المجاورة' : 'Available in Hofuf and Nearby Areas'}
                          </p>
                          <p className="text-[10px] sm:text-[10.5px] text-gold-pure font-mono mt-0.5 sm:mt-1 font-bold">
                            {option.fee === 0 ? (i18n.language === 'ar' ? 'مجاني' : 'Free') : `${formatCurrency(option.fee)} SAR`} • {option.eta}
                          </p>
                        </div>
                      </button>
                    );
                  })()}

                  {/* Dynamic Option B: SMSA Courier Shipping */}
                  {availableShippingOptions.some(o => o.method === 'smsa') && (() => {
                    const option = availableShippingOptions.find(o => o.method === 'smsa')!;
                    const active = deliveryOption === 'regional';
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (option.available) {
                            setDeliveryOption('regional');
                          }
                        }}
                        className={`p-2.5 sm:p-4 border rounded-sm text-left rtl:text-right flex items-start gap-2.5 sm:gap-4 transition-all relative ${
                          !option.available 
                            ? 'border-red-950/20 bg-red-950/5 text-zinc-500 border-dashed'
                            : active
                              ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white cursor-pointer'
                              : 'border-white/5 bg-black/40 text-zinc-500 hover:border-white/10 cursor-pointer'
                        }`}
                      >
                        <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 ${active && option.available ? 'text-gold-pure' : 'text-zinc-650'}`} />
                        <div>
                          <h4 className="text-[11px] sm:text-xs font-display font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
                            {i18n.language === 'ar' ? 'شحن سمسا إكسبريس' : 'SMSA Express'}
                            {!option.available && (
                              <span className="text-[7.5px] bg-red-950 text-red-400 border border-red-500/20 px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                {i18n.language === 'ar' ? 'غير مهيأ' : 'Unavailable'}
                              </span>
                            )}
                          </h4>
                          <p className="text-[9.5px] sm:text-[10px] text-zinc-400 mt-0.5 sm:mt-1">
                            {i18n.language === 'ar' ? 'شحن سريع لجميع مدن المملكة' : 'Priority courier shipping across KSA'}
                          </p>
                          <p className="text-[10px] sm:text-[10.5px] text-gold-pure font-mono mt-0.5 sm:mt-1 font-bold">
                            {option.available ? `${option.fee === 0 ? (i18n.language === 'ar' ? 'مجاني' : 'Free') : `${formatCurrency(option.fee)} SAR`} • ${option.eta}` : (i18n.language === 'ar' ? 'بوابة سمسا غير مهيأة بعد' : 'SMSA Integration Not Configured')}
                          </p>
                        </div>
                      </button>
                    );
                  })()}

                  {/* Fallback if no shipping options resolved yet */}
                  {availableShippingOptions.length === 0 && (
                    <div className="col-span-full p-4 border border-zinc-900 bg-zinc-950/40 text-zinc-500 text-center text-xs">
                      {i18n.language === 'ar' ? 'يرجى تحديد موقع التوصيل على الخريطة لتحديث الخيارات.' : 'Please select delivery location on map to load options.'}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Payment options (formerly sealed payment) */}
            <div className="bg-zinc-950 border border-white/5 rounded-sm p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h2 className="text-[#f2f7da] text-xs font-bold font-display uppercase tracking-widest border-b border-[#f2f7da] pb-2.5 sm:pb-3">
                {i18n.language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
              </h2>
              
              <div className="grid grid-cols-3 max-[340px]:grid-cols-2 gap-2 sm:gap-4">
                {/* 1. Mada/Visa Custom Button */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mada')}
                  className={`relative p-2 sm:p-5 md:p-6 border rounded-sm cursor-pointer overflow-hidden transition-all duration-300 flex flex-col items-center justify-between h-[115px] sm:h-[185px] w-full group outline-none focus:ring-1 focus:ring-[#D4AF37]/50 min-h-[44px] ${
                    paymentMethod === 'mada'
                      ? 'border-[#D4AF37] bg-gradient-to-b from-[#181510] to-[#0A0906] ring-1 ring-[#D4AF37]/35 shadow-[0_0_22px_rgba(212,175,55,0.25)]'
                      : 'border-white/5 bg-black/40 hover:border-white/12 hover:bg-zinc-950/40'
                  }`}
                >
                  {/* Decorative Outer Double-Border Frame */}
                  <div className={`absolute inset-1 pointer-events-none border rounded-xs transition-opacity duration-300 ${
                    paymentMethod === 'mada' ? 'border-[#D4AF37]/25 opacity-100' : 'border-white/5 opacity-60 group-hover:opacity-100'
                  }`}></div>
                  
                  {/* Cards Stack Container (Vertically centered) */}
                  <div className={`flex-1 w-full flex items-center justify-center select-none relative transition-all duration-300 scale-[0.75] sm:scale-100 ${
                    paymentMethod === 'mada' ? 'opacity-100' : 'opacity-70 group-hover:opacity-95 group-hover:scale-[1.02]'
                  }`}>
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Back Card (Gold Visa) */}
                      <div className="absolute w-[105px] h-[65px] rounded-[5px] bg-gradient-to-br from-[#E2C573] via-[#C5A049] to-[#8F6F27] border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transform rotate-[14deg] translate-x-3.5 translate-y-[2px] flex flex-col justify-between p-1.5 overflow-hidden transition-transform duration-300 group-hover:rotate-[15deg]">
                        {/* Reflection shine overlay */}
                        <div className="absolute inset-x-0 -top-full bottom-full bg-gradient-to-b from-transparent via-white/10 to-transparent -rotate-45 group-hover:translate-y-[200%] duration-1000 transition-transform"></div>
                        
                        {/* Top row of gold card */}
                        <div className="flex justify-between items-start">
                          <div className="w-3 h-2 bg-yellow-250/20 rounded-xs border border-white/10"></div>
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
                          <span className="text-[8px] font-black italic tracking-tighter text-white leading-none font-sans">VISA</span>
                        </div>
                      </div>

                      {/* Front Card (Green Mada) */}
                      <div className="absolute w-[105px] h-[65px] rounded-[5px] bg-gradient-to-br from-[#124233] via-[#1E5D47] to-[#0A261D] border border-white/15 shadow-[0_6px_16px_rgba(0,0,0,0.7)] transform -rotate-[6deg] translate-x-[-12px] translate-y-[4px] flex flex-col justify-between p-1.5 z-10 overflow-hidden transition-transform duration-300 group-hover:-rotate-[5deg]">
                        <div className="absolute inset-x-0 -top-full bottom-full bg-gradient-to-b from-transparent via-white/15 to-transparent -rotate-45 group-hover:translate-y-[200%] duration-1000 transition-transform"></div>
                        
                        <div className="flex justify-between items-start">
                          <div className="w-3.5 h-2.5 bg-zinc-300 rounded-xs flex flex-wrap p-[1px] gap-[1px] border border-zinc-400">
                            <div className="w-1.5 h-[1.5px] bg-zinc-500/40"></div>
                            <div className="w-1.5 h-[1.5px] bg-zinc-500/40"></div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <div className="text-[5px] text-white/90 shrink-0">
                              <svg className="w-2.5 h-2.5 rotate-90" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                              </svg>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <div className="flex gap-[1px] h-[2px]">
                                <span className="w-2 h-full bg-[#00A3E0] rounded-l-xs"></span>
                                <span className="w-2 h-full bg-[#78BE20] rounded-r-xs"></span>
                              </div>
                              <span className="text-[6.5px] font-black text-white font-sans leading-none tracking-tighter mt-[1px]">mada</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left mt-0.5">
                          <div className="text-[6px] font-mono text-white tracking-widest leading-none">
                            5534 0000 0000 3991
                          </div>
                          <div className="text-[3.5px] font-mono text-zinc-400 mt-0.5 leading-none">
                            VALID THRU 09/28
                          </div>
                        </div>

                        <div className="flex justify-between items-end">
                          <span className="text-[4.5px] font-mono text-zinc-300 truncate max-w-[50px] uppercase tracking-wide leading-none">CARD HOLDER</span>
                          <div className="flex -space-x-1 shrink-0">
                            <div className="w-2 h-2 rounded-full bg-[#EB001B] opacity-95"></div>
                            <div className="w-2 h-2 rounded-full bg-[#F79E1B] opacity-95"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Button Label */}
                  <div className="w-full text-center mt-1 sm:mt-3 z-20 shrink-0">
                    <span className={`text-xs sm:text-[10.5px] font-display font-semibold uppercase tracking-wider sm:tracking-widest block transition-colors duration-300 ${
                      paymentMethod === 'mada' ? 'text-[#D4AF37]' : 'text-zinc-400 group-hover:text-white'
                    }`}>
                      {paymentMethod === 'mada' ? (i18n.language === 'ar' ? '● مادا / فيزا' : '● MADA / VISA') : (i18n.language === 'ar' ? 'مادا / فيزا' : 'MADA / VISA')}
                    </span>
                  </div>
                </button>


                {/* 2. Apple Pay Button */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('applepay')}
                  className={`relative p-2 sm:p-5 md:p-6 border rounded-sm cursor-pointer overflow-hidden transition-all duration-300 flex flex-col items-center justify-between h-[115px] sm:h-[185px] w-full group outline-none focus:ring-1 focus:ring-[#D4AF37]/50 min-h-[44px] ${
                    paymentMethod === 'applepay'
                      ? 'border-[#D4AF37] bg-gradient-to-b from-[#181510] to-[#0A0906] ring-1 ring-[#D4AF37]/35 shadow-[0_0_22px_rgba(212,175,55,0.25)]'
                      : 'border-white/5 bg-black/40 hover:border-white/12 hover:bg-zinc-950/40'
                  }`}
                >
                  <div className={`absolute inset-1 pointer-events-none border rounded-xs transition-opacity duration-300 ${
                    paymentMethod === 'applepay' ? 'border-[#D4AF37]/25 opacity-100' : 'border-white/5 opacity-60 group-hover:opacity-100'
                  }`}></div>
                  
                  {/* Virtual Apple Pay Card (Vertically centered) */}
                  <div className={`flex-1 w-full flex items-center justify-center select-none relative transition-all duration-300 scale-[0.75] sm:scale-100 ${
                    paymentMethod === 'applepay' ? 'opacity-100' : 'opacity-70 group-hover:opacity-95 group-hover:scale-[1.02]'
                  }`}>
                    <div className="w-[105px] h-[65px] rounded-[5px] bg-[#F5F5F7] border border-zinc-200/80 shadow-[0_5px_15px_rgba(0,0,0,0.6)] flex items-center justify-center p-2 overflow-hidden">
                      <div className="absolute inset-x-0 -top-full bottom-full bg-gradient-to-b from-transparent via-white/50 to-transparent -rotate-45 group-hover:translate-y-[200%] duration-1000 transition-transform"></div>
                      
                      <div className="flex items-center justify-center gap-1 w-full h-full text-black">
                        <svg viewBox="0 0 50 50" className="w-6 h-6" fill="black">
                          <path d="M 44.527344 34.75 C 43.449219 37.144531 42.929688 38.214844 41.542969 40.328125 C 39.601563 43.28125 36.863281 46.96875 33.480469 46.992188 C 30.46875 47.019531 29.691406 45.027344 25.601563 45.0625 C 21.515625 45.082031 20.664063 47.03125 17.648438 47 C 14.261719 46.96875 11.671875 43.648438 9.730469 40.699219 C 4.300781 32.429688 3.726563 22.734375 7.082031 17.578125 C 9.457031 13.921875 13.210938 11.773438 16.738281 11.773438 C 20.332031 11.773438 22.589844 13.746094 25.558594 13.746094 C 28.441406 13.746094 30.195313 11.769531 34.351563 11.769531 C 37.492188 11.769531 40.8125 13.480469 43.1875 16.433594 C 35.421875 20.691406 36.683594 31.78125 44.527344 34.75 Z M 31.195313 8.46875 C 32.707031 6.527344 33.855469 3.789063 33.4375 1 C 30.972656 1.167969 28.089844 2.742188 26.40625 4.78125 C 24.878906 6.640625 23.613281 9.398438 24.105469 12.066406 C 26.796875 12.152344 29.582031 10.546875 31.195313 8.46875 Z"/>
                        </svg>
                        <span className="text-2xl font-semibold -ml-1 text-black font-sans">Pay</span>
                      </div>
                    </div>
                  </div>

                  {/* Button Label */}
                  <div className="w-full text-center mt-1 sm:mt-3 z-20 shrink-0">
                    <span className={`text-xs sm:text-[10.5px] font-display font-semibold uppercase tracking-wider sm:tracking-widest block transition-colors duration-300 ${
                      paymentMethod === 'applepay' ? 'text-[#D4AF37]' : 'text-zinc-400 group-hover:text-white'
                    }`}>
                      {paymentMethod === 'applepay' ? (i18n.language === 'ar' ? '● آبل باي' : '● APPLE PAY') : (i18n.language === 'ar' ? 'آبل باي' : 'APPLE PAY')}
                    </span>
                  </div>
                </button>


                {/* 3. Cash on Delivery Button */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`relative p-2 sm:p-5 md:p-6 border rounded-sm cursor-pointer overflow-hidden transition-all duration-300 flex flex-col items-center justify-between h-[115px] sm:h-[185px] w-full group outline-none focus:ring-1 focus:ring-[#D4AF37]/50 min-h-[44px] ${
                    paymentMethod === 'cod'
                      ? 'border-[#D4AF37] bg-gradient-to-b from-[#181510] to-[#0A0906] ring-1 ring-[#D4AF37]/35 shadow-[0_0_22px_rgba(212,175,55,0.25)]'
                      : 'border-white/5 bg-black/40 hover:border-white/12 hover:bg-zinc-950/40'
                  }`}
                >
                  <div className={`absolute inset-1 pointer-events-none border rounded-xs transition-opacity duration-300 ${
                    paymentMethod === 'cod' ? 'border-[#D4AF37]/25 opacity-100' : 'border-white/5 opacity-60 group-hover:opacity-100'
                  }`}></div>
                  
                  {/* High Quality 3D-styled Delivery Van & Cash Stack Graphics */}
                  <div className={`flex-1 w-full flex items-center justify-center select-none relative transition-all duration-300 scale-[0.75] sm:scale-100 ${
                    paymentMethod === 'cod' ? 'opacity-100' : 'opacity-70 group-hover:opacity-95 group-hover:scale-[1.02]'
                  }`}>
                    <div className="relative w-full h-full flex items-center justify-center">
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

                          <ellipse cx="60" cy="61" rx="55" ry="4" fill="black" fillOpacity="0.75" />

                          <path d="M 12,50 L 22,29 L 45,23 L 112,23 Q 116,23 116,28 L 116,57 Q 116,59 113,59 L 105,59 Q 105,48 95,48 Q 85,48 85,59 L 45,59 Q 45,48 35,48 Q 25,48 25,59 L 17,59 Q 12,59 12,50 Z" fill="url(#vanBody)" stroke="#4A3B12" strokeWidth="0.75" />

                          <path d="M 33,23 L 33,59" stroke="#3D300C" strokeWidth="0.5" />
                          <path d="M 78,23 L 78,59" stroke="#3D300C" strokeWidth="0.5" />

                          <path d="M 23,30 L 31,30 L 31,43 L 18,43 Z" fill="url(#windowGrad)" stroke="#1C180E" strokeWidth="0.5" />

                          <path d="M 12,50 L 15,44 Q 16,42 18,43" stroke="#2D2305" strokeWidth="0.75" />

                          <circle cx="35" cy="57" r="10" fill="url(#wheelGrad)" stroke="#0E0D0C" strokeWidth="1" />
                          <circle cx="35" cy="57" r="5" fill="#8C7954" stroke="#4F4229" strokeWidth="0.5" />
                          <circle cx="35" cy="57" r="2.5" fill="#FFEAA5" />

                          <circle cx="95" cy="57" r="10" fill="url(#wheelGrad)" stroke="#0E0D0C" strokeWidth="1" />
                          <circle cx="95" cy="57" r="5" fill="#8C7954" stroke="#4F4229" strokeWidth="0.5" />
                          <circle cx="95" cy="57" r="2.5" fill="#FFEAA5" />

                          <text x="74" y="44" fontFamily="Impact, sans-serif" fontSize="21" fontWeight="extrabold" letterSpacing="1" fill="#2E2304" textAnchor="middle" opacity="0.9" transform="rotate(-1, 74, 44)">COD</text>
                          <text x="73" y="43" fontFamily="Impact, sans-serif" fontSize="21" fontWeight="extrabold" letterSpacing="1" fill="url(#vanBody)" textAnchor="middle" stroke="#524317" strokeWidth="0.5" transform="rotate(-1, 73, 43)">COD</text>
                        </svg>
                      </div>

                      <div className="absolute bottom-[2px] right-[4px] w-[70px] h-9 z-20 select-none scale-[0.82] origin-bottom-right">
                        <div className="absolute inset-x-1 bottom-1 h-3 bg-black/75 rounded-xs blur-[4px]"></div>

                        <div className="absolute bottom-[2px] right-2 w-14 h-4.5 bg-gradient-to-tr from-[#124233] to-[#1E5D47] rounded-xs border border-emerald-950 shadow-md transform rotate-[-4deg]"></div>
                        <div className="absolute bottom-[4px] right-1 w-14 h-4.5 bg-gradient-to-tr from-[#17503F] via-[#216B53] to-[#164839] rounded-xs border border-emerald-900 shadow-md transform rotate-[2deg]"></div>
                        <div className="absolute bottom-[6px] right-1.5 w-14 h-4.5 bg-gradient-to-tr from-[#1B624C] via-[#2D8D6E] to-[#1F6E55] rounded-xs border border-emerald-800 shadow-lg transform rotate-[-1deg] flex items-center justify-between px-1 overflow-hidden">
                          <div className="absolute left-3.5 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-[#FFE894] to-[#D4AF37]"></div>
                          <div className="absolute right-3 top-[2px] w-2 h-2 rounded-full border border-emerald-600/35 bg-emerald-400/10"></div>
                          <span className="text-[3.5px] font-mono text-emerald-950 font-bold z-10 leading-none">100</span>
                        </div>

                        <div className="absolute bottom-[1.5px] right-4 w-2 h-[13px] bg-gradient-to-r from-[#FFE894] to-[#AB8F44] border-l border-r border-[#6E5719] z-10 opacity-95"></div>

                        <div className="absolute bottom-[-1px] right-[6px] w-4.5 h-4.5 rounded-full bg-gradient-to-br from-[#FFF3BD] via-[#D4AF37] to-[#7C631B] border border-[#524112]/40 shadow-[0_2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center transform rotate-[15deg]">
                          <div className="w-3.5 h-3.5 rounded-full border border-dashed border-[#FFFCD2]/50 flex items-center justify-center text-[4px] font-black text-[#524112] font-sans">S</div>
                        </div>
                        <div className="absolute bottom-[-3px] right-[21px] w-4.5 h-4.5 rounded-full bg-gradient-to-br from-[#FFF3BD] via-[#D4AF37] to-[#7C631B] border border-[#524112]/40 shadow-[0_2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center transform rotate-[-10deg]">
                          <div className="w-3.5 h-3.5 rounded-full border border-dashed border-[#FFFCD2]/50 flex items-center justify-center text-[4px] font-black text-[#524112] font-sans">S</div>
                        </div>
                        <div className="absolute bottom-[1.5px] right-[13px] w-4.5 h-4.5 rounded-full bg-gradient-to-br from-[#FFF8D4] via-[#E2C573] to-[#8C6D1F] border border-[#524112]/40 shadow-[0_2px_6px_rgba(0,0,0,0.5)] flex items-center justify-center transform rotate-[5deg] z-20">
                          <div className="w-3.5 h-3.5 rounded-full border border-dashed border-[#FFFCD2]/50 flex items-center justify-center text-[4px] font-black text-[#524112] font-sans">S</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Button Label */}
                  <div className="w-full text-center mt-1 sm:mt-3 z-20 shrink-0">
                    <span className={`text-xs sm:text-[10.5px] font-display font-semibold uppercase tracking-wider sm:tracking-widest block transition-colors duration-300 ${
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
                    <label htmlFor="checkout-cardholder" className="text-[9px] text-zinc-500 uppercase tracking-widest">
                      {i18n.language === 'ar' ? 'اسم حامل البطاقة:' : 'Cardholder Name:'}
                    </label>
                    <input
                      id="checkout-cardholder"
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder=""
                      className="w-full bg-black border border-white/5 rounded-xs p-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-gold-pure/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="checkout-cardnumber" className="text-[9px] text-zinc-500 uppercase tracking-widest">
                      {i18n.language === 'ar' ? 'رقم بطاقة مدى / البطاقة الائتمانية:' : 'Mada / Credit Card Number:'}
                    </label>
                    <input
                      id="checkout-cardnumber"
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
                      <label htmlFor="checkout-cardexpiry" className="text-[9px] text-zinc-500 uppercase tracking-widest">
                        {i18n.language === 'ar' ? 'تاريخ الانتهاء:' : 'Expiry Date:'}
                      </label>
                      <input
                        id="checkout-cardexpiry"
                        type="text"
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-black border border-white/5 rounded-xs p-2 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none text-center focus:border-gold-pure/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="checkout-cardcvv" className="text-[9px] text-zinc-500 uppercase tracking-widest">
                        {i18n.language === 'ar' ? 'رمز الأمان (CVV):' : 'Security CVV:'}
                      </label>
                      <div className="relative">
                        <input
                          id="checkout-cardcvv"
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
                <div className="p-4 sm:p-6 bg-black/60 border border-white/5 rounded-xs text-center space-y-2 animate-fade-in">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center mx-auto text-sm font-semibold tracking-wider font-sans">
                    
                  </div>
                  <p className="text-zinc-300 text-xs">
                    {i18n.language === 'ar' ? 'انقر نقراً مزدوجاً على الزر الجانبي للدفع بأمان باستخدام FaceID.' : 'Double-click side button to pay securely with FaceID.'}
                  </p>
                  <p className="text-zinc-500 text-[8px] uppercase tracking-widest font-mono">
                    {i18n.language === 'ar' ? 'تم التحقق من إعدادات أمان Apple Pay' : 'Apple Pay security configuration verified'}
                  </p>
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
          <div className="lg:col-span-5 bg-zinc-950 border border-white/5 p-4 sm:p-6 rounded-sm space-y-4 sm:space-y-6 lg:sticky lg:top-[72px] shadow-2xl mb-16 sm:mb-0">
            <h2 className="text-[#f2f7da] text-xs sm:text-sm font-bold font-display uppercase tracking-widest border-b border-[#f2f7da] pb-2.5 sm:pb-3">
              {i18n.language === 'ar' ? 'ملخص الطلب' : 'ORDER SUMMARY'}
            </h2>
            
            {/* Expanded items list with visual thumbnails and clean layout */}
            <div className="space-y-3 sm:space-y-4 max-h-[285px] overflow-y-auto pr-2 divide-y divide-white/5">
              {cart.map((item, idx) => (
                <div key={`checkout-cart-item-${item.product.id}-${item.selectedOption || ''}-${idx}`} className="flex items-center justify-between gap-2.5 sm:gap-3 pt-2.5 sm:pt-3 first:pt-0 text-xs group">
                  
                  {/* Non-clickable Product Thumbnail & Info Area */}
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 rounded-xs p-1 -m-1 select-none">
                    {/* Thumbnail Image */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-xs overflow-hidden shrink-0 flex items-center justify-center">
                      <SafeImage 
                        product={item.product} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>

                    {/* Name and count */}
                    <div className="flex-grow text-left rtl:text-right min-w-0 pr-1">
                      <h4 className="text-white font-semibold uppercase tracking-wider truncate block font-sans text-[10.5px] sm:text-[11px] leading-tight">
                        {i18n.language === 'ar' ? t(`products.${item.product.id}.name`, { defaultValue: item.product.name }) : item.product.name}
                      </h4>
                      <p className="text-zinc-500 text-[9.5px] sm:text-[10px] mt-0.5">
                        {t('checkout.qty', { defaultValue: 'Qty' })}: {item.quantity}
                      </p>
                      {item.selectedOption && (
                        <span className="inline-block mt-0.5 text-[8.5px] font-mono tracking-wide text-zinc-600 bg-white/5 px-1 py-0.5 rounded-xs">
                          {item.selectedOption}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total price */}
                  <span className="text-zinc-300 font-sans font-bold text-[11px] sm:text-[11.5px] shrink-0 tabular-nums-fix">
                    {formatCurrency(item.product.price * item.quantity)} {t('app.sar')}
                  </span>

                </div>
              ))}
            </div>

            {/* Sum Lines matching exact request structure */}
            <div className="space-y-2.5 sm:space-y-3.5 pt-3 sm:pt-4 border-t border-white/10 text-xs sm:text-sm font-sans mb-4 sm:mb-6">
              
              {/* Subtotal */}
              <div className="flex justify-between text-zinc-400">
                <span>{t('cart.subtotal', { defaultValue: 'Subtotal' })}</span>
                <span className="font-sans text-zinc-200 tabular-nums-fix">{formatCurrency(subtotal)} {t('app.sar')}</span>
              </div>

              {/* Discount if applied */}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>{t('checkout.discount', { defaultValue: 'Discount' })} ({discountPercent}%)</span>
                  <span className="font-sans tabular-nums-fix">-{formatCurrency(discountAmount)} {t('app.sar')}</span>
                </div>
              )}

              {/* VAT (15%) */}
              <div className="flex justify-between text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span>{i18n.language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT'}</span>
                  <span className="text-[9px] px-1 py-0.5 rounded-xs bg-white/5 border border-white/10 tabular-nums-fix">15%</span>
                </div>
                <span className="font-sans text-zinc-200 tabular-nums-fix">{formatCurrency(vatAmount)} {t('app.sar')}</span>
              </div>

              {/* Shipping calculating message */}
              <div className="flex justify-between text-zinc-400">
                <span>{t('cart.shipping', { defaultValue: 'Shipping' })}</span>
                <span className="font-sans text-[#D4AF37] font-semibold text-right tabular-nums-fix">
                  {!city ? (i18n.language === 'ar' ? 'يحتسب عند الدفع' : 'Calculated at checkout') : (shippingFee === 0 ? 'Free' : `${formatCurrency(shippingFee)} ${t('app.sar')}`)}
                </span>
              </div>

              {/* Divider spacer */}
              <div className="border-t border-dashed border-white/5 my-1.5 sm:my-2"></div>

              {/* Final sum */}
              <div className="flex justify-between text-sm sm:text-base uppercase font-display font-medium text-white tracking-wider">
                <span>{t('cart.total', { defaultValue: 'Total' })}</span>
                <span className="text-gold-pure font-sans font-bold text-base sm:text-lg rtl:text-left tabular-nums-fix">{formatCurrency(finalTotal)} {t('app.sar')}</span>
              </div>

            </div>

            {/* Terms & Conditions Acceptance Checkbox */}
            <div className="mb-4 pt-3 border-t border-white/5">
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  id="checkout-terms-checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
                  className="mt-0.5 w-4 h-4 rounded-xs border-white/20 bg-black/40 text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-0 cursor-pointer accent-[#D4AF37]"
                />
                <span className="text-[12px] sm:text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed">
                  {i18n.language === 'ar' ? (
                    <>
                      أوافق على{' '}
                      <a
                        href="/terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#D4AF37] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        الشروط والأحكام
                        <ExternalLink className="w-3 h-3 inline opacity-80" />
                      </a>{' '}
                      وسياسة الخصوصية المعمول بها في المتجر.
                    </>
                  ) : (
                    <>
                      I agree to the{' '}
                      <a
                        href="/terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#D4AF37] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        Terms &amp; Conditions
                        <ExternalLink className="w-3 h-3 inline opacity-80" />
                      </a>{' '}
                      and privacy policy.
                    </>
                  )}
                </span>
              </label>
            </div>

            {/* Authorize checkout button (full width touch target) */}
            <button
              type="submit"
              disabled={isSubmitting || !termsAccepted}
              className={`w-full py-3.5 sm:py-5 font-display font-bold uppercase tracking-widest text-[11px] sm:text-[11.5px] rounded-sm transition-all duration-300 flex items-center justify-center gap-3 min-h-[44px] sm:min-h-[48px] ${
                !termsAccepted || isSubmitting
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5 opacity-60'
                  : 'bg-[#D4AF37] hover:bg-white text-black cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.25)] active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <span>{i18n.language === 'ar' ? 'جاري المعالجة...' : 'PROCESSING...'}</span>
              ) : (
                <span>{t('checkout.authorize', { defaultValue: 'PROCEED TO CHECKOUT' })}</span>
              )}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}
