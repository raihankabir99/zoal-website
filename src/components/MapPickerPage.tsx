import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin, Check, X, ZoomIn, ZoomOut, Compass, CheckCircle2, Navigation, ArrowLeft } from 'lucide-react';
import L from 'leaflet';

export default function MapPickerPage() {
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const requestId = searchParams.get('requestId') || '';
  const initialLat = parseFloat(searchParams.get('lat') || '24.7136');
  const initialLng = parseFloat(searchParams.get('lng') || '46.6753');
  const lang = searchParams.get('lang') || 'ar';
  const isAr = lang === 'ar';

  const [lat, setLat] = useState<number>(() => (Number.isFinite(initialLat) ? initialLat : 24.7136));
  const [lng, setLng] = useState<number>(() => (Number.isFinite(initialLng) ? initialLng : 46.6753));
  const [zoom, setZoom] = useState<number>(15);
  const [addressPreview, setAddressPreview] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  // Reverse Geocoding Effect (OpenStreetMap Nominatim)
  useEffect(() => {
    let isCancelled = false;
    const fetchAddress = async () => {
      setIsGeocoding(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${isAr ? 'ar' : 'en'}`
        );
        if (!response.ok) throw new Error('Geocoding network error');
        const data = await response.json();
        if (!isCancelled && data && data.display_name) {
          setAddressPreview(data.display_name);
        }
      } catch (err) {
        if (!isCancelled) {
          setAddressPreview(isAr ? `الموقع المحدد (${lat.toFixed(4)}, ${lng.toFixed(4)})` : `Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      } finally {
        if (!isCancelled) setIsGeocoding(false);
      }
    };

    const timer = setTimeout(fetchAddress, 400);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [lat, lng, isAr]);

  // Leaflet Map Initialization & Mounting
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
          <div class="absolute w-10 h-10 rounded-full bg-[#D4AF37]/30 animate-ping"></div>
          <div class="w-8 h-8 rounded-full bg-black border-2 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.6)] flex items-center justify-center">
            <div class="w-3 h-3 rounded-full bg-[#D4AF37]"></div>
          </div>
        </div>
      `,
      className: 'custom-map-picker-pin',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([lat, lng], {
      icon: goldIcon,
      draggable: true
    }).addTo(map);

    markerInstanceRef.current = marker;
    mapInstanceRef.current = map;

    // Click map to reposition marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: newLat, lng: newLng } = e.latlng;
      setLat(newLat);
      setLng(newLng);
      marker.setLatLng([newLat, newLng]);
    });

    // Drag marker to fine-tune position
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      setLat(position.lat);
      setLng(position.lng);
    });

    // Clean up on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map pan and marker when lat/lng change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng]);
      markerInstanceRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  // Handle Current GPS Location fetch
  const handleUseCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          setLat(newLat);
          setLng(newLng);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([newLat, newLng], 16);
          }
        },
        () => {
          alert(isAr ? 'تعذر جلب الموقع الحالي. يرجى التحديد مباشرة على الخريطة.' : 'Unable to acquire GPS location. Please tap directly on the map.');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // Confirm and communicate selected location back to Checkout
  const handleConfirmLocation = () => {
    // Validate coordinates strictly
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert(isAr ? 'إحداثيات غير صالحة' : 'Invalid coordinates selected');
      return;
    }

    const payload = {
      type: 'LOCATION_SELECTED',
      requestId: requestId,
      confirmed: true,
      lat: lat,
      lng: lng,
      timestamp: Date.now()
    };

    // 1. Send via BroadcastChannel if available
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('zoal_location_channel');
        channel.postMessage(payload);
        channel.close();
      } catch (e) {
        console.warn('BroadcastChannel emission failed:', e);
      }
    }

    // 2. Write to LocalStorage as safe fallback
    try {
      localStorage.setItem('zoal_confirmed_location', JSON.stringify(payload));
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }

    setIsConfirmed(true);

    // Attempt to close tab
    setTimeout(() => {
      try {
        window.close();
      } catch (e) {
        // Browser prevented window.close()
      }
    }, 300);
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const newZoom = Math.min(20, zoom + 1);
      setZoom(newZoom);
      mapInstanceRef.current.setZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const newZoom = Math.max(10, zoom - 1);
      setZoom(newZoom);
      mapInstanceRef.current.setZoom(newZoom);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden font-sans select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Floating Control Bar */}
      <header className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 bg-gradient-to-b from-black/95 via-black/80 to-transparent backdrop-blur-md flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
              {isAr ? 'تحديد موقع التوصيل' : 'SELECT YOUR DELIVERY LOCATION'}
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono">
              {isAr ? 'اضغط على الخريطة أو اسحب العلامة الذهبية' : 'Tap anywhere on map or drag the gold marker'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            try {
              window.close();
            } catch (e) {
              window.history.back();
            }
          }}
          className="p-2 text-zinc-400 hover:text-white bg-black/60 hover:bg-zinc-900 border border-white/10 rounded-full transition-colors cursor-pointer"
          title={isAr ? 'إغلاق' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Fullscreen Leaflet Map */}
      <div className="relative flex-grow w-full h-full z-0">
        <div ref={mapContainerRef} className="w-full h-full bg-[#0a0a0a]" />

        {/* Floating Controls Overlay (Zoom & GPS) */}
        <div className="absolute bottom-28 sm:bottom-32 right-3 sm:right-6 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleUseCurrentGPS}
            className="w-10 h-10 sm:w-11 sm:h-11 bg-black/90 hover:bg-zinc-900 text-[#D4AF37] border border-[#D4AF37]/40 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer"
            title={isAr ? 'الموقع الحالي GPS' : 'Use GPS Location'}
          >
            <Compass className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col bg-black/90 border border-white/10 rounded-lg overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2.5 sm:p-3 hover:bg-zinc-800 text-white border-b border-white/10 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2.5 sm:p-3 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Success Banner (If Tab Remains Open) */}
      {isConfirmed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-4 right-4 z-30 bg-[#D4AF37] text-black p-3.5 rounded-sm shadow-2xl border border-white/20 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isAr ? 'تم تأكيد الموقع! يمكنك العودة إلى صفحة الدفع الآن.' : 'Location confirmed! Return to the Checkout tab.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => window.close()}
            className="px-2.5 py-1 bg-black text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest rounded-xs hover:bg-zinc-900 cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </motion.div>
      )}

      {/* Bottom Floating Confirmation Panel */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-md border-t border-white/10 flex flex-col gap-3">
        {/* Address Preview Box */}
        <div className="bg-zinc-950/90 border border-white/10 p-3 rounded-xs flex items-center justify-between gap-3 text-xs text-zinc-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <Navigation className="w-4 h-4 text-[#D4AF37] shrink-0 animate-pulse" />
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
                {isAr ? 'العنوان المحدد' : 'SELECTED LOCATION'}
              </p>
              <p className="text-xs font-semibold text-white truncate">
                {isGeocoding ? (isAr ? 'جاري تحديد العنوان...' : 'Resolving location...') : (addressPreview || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)}
              </p>
            </div>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 shrink-0 border-s border-white/10 ps-3">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              try {
                window.close();
              } catch (e) {
                window.history.back();
              }
            }}
            className="w-1/3 py-3 px-4 bg-black hover:bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer text-center"
          >
            {isAr ? 'إغلاق' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleConfirmLocation}
            className="w-2/3 py-3 px-4 bg-[#D4AF37] hover:bg-[#e2bd44] text-black text-xs font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(212,175,55,0.25)] active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isAr ? 'تأكيد هذا الموقع' : 'USE THIS LOCATION'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
