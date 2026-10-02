import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin, Check, X, ZoomIn, ZoomOut, Compass, CheckCircle2, Navigation, Layers, Route, Clock3, LocateFixed } from 'lucide-react';
import L from 'leaflet';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import 'leaflet/dist/leaflet.css';

const MAPBOX_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  terrain: 'mapbox://styles/mapbox/outdoors-v12',
} as const;

type MapboxStyleKey = keyof typeof MAPBOX_STYLES;

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
  const [mapboxStyle, setMapboxStyle] = useState<MapboxStyleKey>('streets');
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState<boolean>(false);
  const [isMapboxReady, setIsMapboxReady] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const routeGeoJsonRef = useRef<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);
  const mapboxMapRef = useRef<mapboxgl.Map | null>(null);
  const mapboxMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const fetchAddress = async () => {
      setIsGeocoding(true);
      const token = (import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '').trim();
      try {
        if (token && token.startsWith('pk.')) {
          const url = new URL('https://api.mapbox.com/search/geocode/v6/reverse');
          url.searchParams.set('longitude', String(lng));
          url.searchParams.set('latitude', String(lat));
          url.searchParams.set('language', isAr ? 'ar' : 'en');
          url.searchParams.set('limit', '1');
          url.searchParams.set('access_token', token);
          const response = await fetch(url.toString());
          if (!response.ok) throw new Error('Mapbox reverse geocoding failed');
          const data = await response.json();
          const feature = data?.features?.[0];
          const address = feature?.properties?.full_address || feature?.properties?.place_formatted || feature?.properties?.name;
          if (address) {
            if (!isCancelled) setAddressPreview(address);
            return;
          }
        }

        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${isAr ? 'ar' : 'en'}`
        );
        if (!fallbackResponse.ok) throw new Error('Fallback geocoding network error');
        const fallbackData = await fallbackResponse.json();
        if (!isCancelled && fallbackData?.display_name) {
          setAddressPreview(fallbackData.display_name);
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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = (import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '').trim();
    let cancelled = false;
    let resizeTimer: number | null = null;

    const createLeafletFallback = () => {
      if (!mapContainerRef.current || cancelled) return;
      setIsMapboxReady(false);
      if (mapboxMarkerRef.current) {
        mapboxMarkerRef.current.remove();
        mapboxMarkerRef.current = null;
      }
      if (mapboxMapRef.current) {
        mapboxMapRef.current.remove();
        mapboxMapRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const goldIcon = L.divIcon({
        html: `<div class="relative flex items-center justify-center"><div class="absolute w-10 h-10 rounded-full bg-[#D4AF37]/30 animate-ping"></div><div class="w-8 h-8 rounded-full bg-black border-2 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.6)] flex items-center justify-center"><div class="w-3 h-3 rounded-full bg-[#D4AF37]"></div></div></div>`,
        className: 'custom-map-picker-pin',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([lat, lng], { icon: goldIcon, draggable: true }).addTo(map);
      markerInstanceRef.current = marker;
      mapInstanceRef.current = map;

      requestAnimationFrame(() => map.invalidateSize());
      resizeTimer = window.setTimeout(() => map.invalidateSize(), 150);

      map.on('zoomend', () => setZoom(map.getZoom()));
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        setLat(newLat);
        setLng(newLng);
        marker.setLatLng([newLat, newLng]);
      });
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setLat(position.lat);
        setLng(position.lng);
      });
    };

    if (!token || !token.startsWith('pk.')) {
      createLeafletFallback();
      return () => {
        cancelled = true;
        if (resizeTimer !== null) window.clearTimeout(resizeTimer);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }

    try {
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAPBOX_STYLES.streets,
        center: [lng, lat],
        zoom,
        attributionControl: true,
        dragRotate: false,
        pitchWithRotate: false,
        failIfMajorPerformanceCaveat: false
      });

      const markerElement = document.createElement('div');
      markerElement.className = 'custom-map-picker-pin';
      markerElement.innerHTML = `<div class="relative flex items-center justify-center"><div class="absolute w-10 h-10 rounded-full bg-[#D4AF37]/30 animate-ping"></div><div class="w-8 h-8 rounded-full bg-black border-2 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.6)] flex items-center justify-center"><div class="w-3 h-3 rounded-full bg-[#D4AF37]"></div></div></div>`;

      const marker = new mapboxgl.Marker({ element: markerElement, draggable: true })
        .setLngLat([lng, lat])
        .addTo(map);

      mapboxMapRef.current = map;
      mapboxMarkerRef.current = marker;
      setIsMapboxReady(true);

      map.on('zoomend', () => setZoom(map.getZoom()));
      map.on('click', (e) => {
        const newLng = e.lngLat.lng;
        const newLat = e.lngLat.lat;
        setLat(newLat);
        setLng(newLng);
        marker.setLngLat([newLng, newLat]);
      });
      marker.on('dragend', () => {
        const position = marker.getLngLat();
        setLat(position.lat);
        setLng(position.lng);
      });
    } catch (error) {
      console.warn('Mapbox initialization failed; using Leaflet fallback.', error);
      createLeafletFallback();
    }

    return () => {
      cancelled = true;
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      if (mapboxMarkerRef.current) {
        mapboxMarkerRef.current.remove();
        mapboxMarkerRef.current = null;
      }
      if (mapboxMapRef.current) {
        mapboxMapRef.current.remove();
        mapboxMapRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapboxMapRef.current && mapboxMarkerRef.current) {
      mapboxMapRef.current.panTo([lng, lat]);
      mapboxMarkerRef.current.setLngLat([lng, lat]);
      return;
    }
    if (mapInstanceRef.current && markerInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng]);
      markerInstanceRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  const handleMapboxStyleChange = (styleKey: MapboxStyleKey) => {
    setMapboxStyle(styleKey);
    setIsStyleMenuOpen(false);

    const map = mapboxMapRef.current;
    if (!map || mapboxStyle === styleKey) return;

    const nextStyle = MAPBOX_STYLES[styleKey];
    map.setStyle(nextStyle);
  };

  const clearRoute = () => {
    const map = mapboxMapRef.current;
    if (!map) return;
    if (map.getLayer('zoal-route-line')) map.removeLayer('zoal-route-line');
    if (map.getSource('zoal-route')) map.removeSource('zoal-route');
    routeGeoJsonRef.current = null;
    setRouteInfo(null);
  };

  const drawRouteToSelectedLocation = async (fromLat: number, fromLng: number) => {
    const token = (import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '').trim();
    const map = mapboxMapRef.current;
    if (!token.startsWith('pk.') || !map) return;
    try {
      const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${lng},${lat}`);
      url.searchParams.set('geometries', 'geojson');
      url.searchParams.set('overview', 'full');
      url.searchParams.set('access_token', token);
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Directions request failed');
      const data = await response.json();
      const route = data?.routes?.[0];
      if (!route?.geometry) throw new Error('No route found');

      const source = map.getSource('zoal-route') as mapboxgl.GeoJSONSource | undefined;
      const feature = { type: 'Feature', properties: {}, geometry: route.geometry } as GeoJSON.Feature<GeoJSON.LineString>;
      if (source) source.setData(feature);
      else {
        map.addSource('zoal-route', { type: 'geojson', data: feature });
        map.addLayer({ id: 'zoal-route-line', type: 'line', source: 'zoal-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#D4AF37', 'line-width': 5, 'line-opacity': 0.9 } });
      }
      routeGeoJsonRef.current = JSON.stringify(feature);
      setRouteInfo({ distanceKm: Number((route.distance / 1000).toFixed(1)), durationMin: Math.max(1, Math.round(route.duration / 60)) });
    } catch (error) {
      console.warn('Unable to load driving route:', error);
      setRouteInfo(null);
    }
  };

  const handleUseCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          setLat(newLat);
          setLng(newLng);
          setCurrentLocation({ lat: newLat, lng: newLng });
          if (mapboxMapRef.current) {
            mapboxMapRef.current.setCenter([newLng, newLat]);
            mapboxMapRef.current.setZoom(16);
          } else if (mapInstanceRef.current) {
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

  const handleConfirmLocation = () => {
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

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('zoal_location_channel');
        channel.postMessage(payload);
        channel.close();
      } catch (e) {
        console.warn('BroadcastChannel emission failed:', e);
      }
    }

    try {
      localStorage.setItem('zoal_confirmed_location', JSON.stringify(payload));
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }

    setIsConfirmed(true);

    setTimeout(() => {
      try {
        window.close();
      } catch (e) {
        // Browser prevented window.close()
      }
    }, 300);
  };

  const handleShowRoute = () => {
    if (currentLocation) {
      drawRouteToSelectedLocation(currentLocation.lat, currentLocation.lng);
      return;
    }
    handleUseCurrentGPS();
  };

  useEffect(() => {
    if (currentLocation && mapboxMapRef.current) drawRouteToSelectedLocation(currentLocation.lat, currentLocation.lng);
    else clearRoute();
  }, [lat, lng, currentLocation]);

  const handleRecenter = () => {
    if (currentLocation && mapboxMapRef.current) mapboxMapRef.current.flyTo({ center: [currentLocation.lng, currentLocation.lat], zoom: 16, duration: 700 });
    else handleUseCurrentGPS();
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(20, zoom + 1);
    setZoom(newZoom);
    if (mapboxMapRef.current) {
      mapboxMapRef.current.setZoom(newZoom);
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(10, zoom - 1);
    setZoom(newZoom);
    if (mapboxMapRef.current) {
      mapboxMapRef.current.setZoom(newZoom);
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(newZoom);
    }
  };

  return (
    <div className="relative w-screen h-[100dvh] min-h-[100svh] bg-[#0a0a0a] text-white flex flex-col overflow-hidden font-sans select-none" dir={isAr ? 'rtl' : 'ltr'}>
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

      <div className="relative flex-1 min-h-0 w-full h-full z-0 touch-pan-x touch-pan-y">
        <div
          ref={mapContainerRef}
          className="zoal-map-picker w-full h-full bg-[#0a0a0a]"
          style={{ minHeight: '100%' }}
        />

        {isMapboxReady && (
        <div className="absolute top-[76px] sm:top-24 start-3 sm:start-6 z-10">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStyleMenuOpen((open) => !open)}
              className="h-10 sm:h-11 px-3 sm:px-4 bg-black/90 hover:bg-zinc-900 text-white border border-[#D4AF37]/40 rounded-lg flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all cursor-pointer"
              title={isAr ? 'أنماط الخريطة' : 'Map styles'}
              aria-label={isAr ? 'أنماط الخريطة' : 'Map styles'}
              aria-expanded={isStyleMenuOpen}
            >
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                {isAr ? 'الخريطة' : 'MAP'}
              </span>
            </button>

            {isStyleMenuOpen && (
              <div className="absolute top-12 start-0 min-w-40 p-1.5 bg-black/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl">
                {([
                  ['streets', isAr ? 'الشوارع' : 'Streets'],
                  ['satellite', isAr ? 'القمر الصناعي' : 'Satellite'],
                  ['terrain', isAr ? 'التضاريس' : 'Terrain'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleMapboxStyleChange(key)}
                    className={`w-full px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-colors cursor-pointer ${
                      mapboxStyle === key
                        ? 'bg-[#D4AF37] text-black'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {isMapboxReady && routeInfo && (
          <div className="absolute top-[76px] sm:top-24 end-3 sm:end-6 z-10 bg-black/90 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl px-3 py-2.5 min-w-40">
            <div className="flex items-center gap-2 text-xs font-bold text-white"><Route className="w-4 h-4 text-[#D4AF37]" />{routeInfo.distanceKm} km</div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400"><Clock3 className="w-3.5 h-3.5" />{routeInfo.durationMin} min</div>
          </div>
        )}

        <div className="absolute bottom-[150px] sm:bottom-32 end-3 sm:end-6 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleRecenter}
            className="w-11 h-11 sm:w-11 sm:h-11 bg-black/90 hover:bg-zinc-900 text-[#D4AF37] border border-[#D4AF37]/40 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer"
            title={isAr ? 'الموقع الحالي GPS' : 'Use GPS Location'}
          >
            <Compass className="w-5 h-5" />
          </button>

          {isMapboxReady && (
            <button type="button" onClick={handleShowRoute} className="w-10 h-10 sm:w-11 sm:h-11 bg-black/90 hover:bg-zinc-900 text-[#D4AF37] border border-[#D4AF37]/40 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer" title={isAr ? 'الاتجاهات' : 'Directions'}>
              <Route className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col bg-black/90 border border-white/10 rounded-lg overflow-hidden shadow-2xl min-w-[44px]">
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

      {isConfirmed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-[68px] sm:top-16 left-3 right-3 sm:left-4 sm:right-4 z-30 bg-[#D4AF37] text-black p-3.5 rounded-sm shadow-2xl border border-white/20 flex items-center justify-between"
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

      <footer className="absolute bottom-0 left-0 right-0 z-20 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-md border-t border-white/10 flex flex-col gap-3">
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
