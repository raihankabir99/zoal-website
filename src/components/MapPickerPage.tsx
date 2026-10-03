import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin, Check, X, ZoomIn, ZoomOut, Compass, CheckCircle2, Navigation, Layers, Route, Clock3, Search, Crosshair, Utensils, ShoppingCart, Fuel, HeartPulse, Landmark, Loader2 } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  terrain: 'mapbox://styles/mapbox/outdoors-v12',
} as const;

type MapboxStyleKey = keyof typeof MAPBOX_STYLES;

export default function MapPickerPage() {
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const requestId = searchParams.get('requestId') || '';
  const initialLat = parseFloat(searchParams.get('lat') || '25.3830');
  const initialLng = parseFloat(searchParams.get('lng') || '49.5880');
  const lang = searchParams.get('lang') || 'ar';
  const isAr = lang === 'ar';

  const [lat, setLat] = useState<number>(() => (Number.isFinite(initialLat) ? initialLat : 25.3830));
  const [lng, setLng] = useState<number>(() => (Number.isFinite(initialLng) ? initialLng : 49.5880));
  const [zoom, setZoom] = useState<number>(15);
  const [addressPreview, setAddressPreview] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [mapboxStyle, setMapboxStyle] = useState<MapboxStyleKey>('streets');
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState<boolean>(false);
  const [isMapboxReady, setIsMapboxReady] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{ mapbox_id: string; name: string; full_address?: string; place_formatted?: string; feature_type?: string; maki?: string }>>([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const searchSessionRef = useRef<string>('');
  const searchAbortRef = useRef<AbortController | null>(null);
  const routeGeoJsonRef = useRef<GeoJSON.Feature<GeoJSON.LineString> | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapboxMapRef = useRef<mapboxgl.Map | null>(null);
  const mapboxMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const mapboxReadyRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;
    const fetchAddress = async () => {
      setIsGeocoding(true);
      const token = (import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '').trim();
      const fallbackText = isAr
        ? `الموقع المحدد (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        : `Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

      const withTimeout = async (url: string, timeoutMs: number) => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) throw new Error('Geocoding request failed');
          return await response.json();
        } finally {
          window.clearTimeout(timer);
        }
      };

      try {
        // Keep the address lookup bounded and never let it block map interaction.
        const mapboxPromise = token.startsWith('pk.')
          ? (() => {
              const url = new URL('https://api.mapbox.com/search/geocode/v6/reverse');
              url.searchParams.set('longitude', String(lng));
              url.searchParams.set('latitude', String(lat));
              url.searchParams.set('language', isAr ? 'ar' : 'en');
              url.searchParams.set('limit', '1');
              url.searchParams.set('access_token', token);
              return withTimeout(url.toString(), 1800);
            })()
          : Promise.reject(new Error('No Mapbox token'));

        const nominatimPromise = withTimeout(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${isAr ? 'ar' : 'en'}`,
          2200
        );

        const result = await Promise.any([
          mapboxPromise.then((data: any) => {
            const feature = data?.features?.[0];
            const address = feature?.properties?.full_address || feature?.properties?.place_formatted || feature?.properties?.name;
            if (!address) throw new Error('No Mapbox address');
            return address;
          }),
          nominatimPromise.then((data: any) => {
            if (!data?.display_name) throw new Error('No fallback address');
            return data.display_name;
          })
        ]);

        if (!isCancelled) setAddressPreview(result);
      } catch {
        if (!isCancelled) setAddressPreview(fallbackText);
      } finally {
        if (!isCancelled) setIsGeocoding(false);
      }
    };

    const timer = window.setTimeout(fetchAddress, 100);
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
    let mapLoadTimer: number | null = null;
    let mapLoaded = false;

    if (!token.startsWith('pk.')) {
      console.error('Mapbox is not configured: VITE_MAPBOX_PUBLIC_TOKEN is missing or invalid.');
      setIsMapboxReady(false);
      mapboxReadyRef.current = false;
      return () => {
        cancelled = true;
        if (resizeTimer !== null) window.clearTimeout(resizeTimer);
        if (mapLoadTimer !== null) window.clearTimeout(mapLoadTimer);
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

      const switchToLeafletIfMapboxFails = () => {
        if (cancelled || mapLoaded) return;
        if (mapLoadTimer !== null) window.clearTimeout(mapLoadTimer);
        try { map.remove(); } catch {}
        mapboxMapRef.current = null;
        mapboxMarkerRef.current = null;
        createLeafletFallback();
      };

      const tuneGoogleLikeLabels = () => {
        const style = map.getStyle();
        if (!style?.layers) return;
        for (const layer of style.layers) {
          const id = layer.id.toLowerCase();
          if (layer.type === 'symbol' && (id.includes('poi') || id.includes('road-label') || id.includes('place-label') || id.includes('transit'))) {
            try {
              map.setLayoutProperty(layer.id, 'text-optional', true);
            } catch {}
          }
        }
      };
      map.once('load', () => {
        mapLoaded = true;
        if (mapLoadTimer !== null) window.clearTimeout(mapLoadTimer);
        setIsMapboxReady(true);
        mapboxReadyRef.current = true;
        tuneGoogleLikeLabels();
      });
      map.once('error', (event) => {
        console.error('Mapbox map load error.', event?.error || event);
      });
      map.on('style.load', () => {
        tuneGoogleLikeLabels();
        if (routeGeoJsonRef.current) {
          const feature = routeGeoJsonRef.current;
          if (!map.getSource('zoal-route')) map.addSource('zoal-route', { type: 'geojson', data: feature });
          if (!map.getLayer('zoal-route-line')) map.addLayer({ id: 'zoal-route-line', type: 'line', source: 'zoal-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#D4AF37', 'line-width': 5, 'line-opacity': 0.9 } });
        }
      });
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

      mapLoadTimer = window.setTimeout(() => {
        if (!mapLoaded && !cancelled) {
          console.warn('Mapbox did not finish loading within the expected startup window.');
        }
      }, 1200);
    } catch (error) {
      console.error('Mapbox initialization failed.', error);
      setIsMapboxReady(false);
      mapboxReadyRef.current = false;
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
    };
  }, []);

  useEffect(() => {
    if (mapboxMapRef.current && mapboxMarkerRef.current) {
      mapboxMapRef.current.panTo([lng, lat]);
      mapboxMarkerRef.current.setLngLat([lng, lat]);
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
      routeGeoJsonRef.current = feature;
      setRouteInfo({ distanceKm: Number((route.distance / 1000).toFixed(1)), durationMin: Math.max(1, Math.round(route.duration / 60)) });
    } catch (error) {
      console.warn('Unable to load driving route:', error);
      setRouteInfo(null);
    }
  };

  const createSearchSession = () => {
    if (!searchSessionRef.current) {
      searchSessionRef.current = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    return searchSessionRef.current;
  };

  const handleSearchInput = async (value: string) => {
    setSearchQuery(value);
    setIsSearchOpen(true);
    if (searchAbortRef.current) searchAbortRef.current.abort();
    if (value.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const token = (import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '').trim();
    if (!token.startsWith('pk.')) return;
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setIsSearching(true);
    try {
      const url = new URL('https://api.mapbox.com/search/searchbox/v1/suggest');
      url.searchParams.set('q', value.trim());
      url.searchParams.set('language', isAr ? 'ar' : 'en');
      url.searchParams.set('limit', '8');
      url.searchParams.set('types', 'poi,address,street,neighborhood,locality,place');
      url.searchParams.set('country', 'SA');
      url.searchParams.set('proximity', `${lng},${lat}`);
      url.searchParams.set('session_token', createSearchSession());
      url.searchParams.set('access_token', token);
      const response = await fetch(url.toString(), { signal: controller.signal });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      if (!controller.signal.aborted) setSearchSuggestions(data?.suggestions || []);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.warn('Map search failed:', error);
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  };

  const handleSelectSearchResult = async (suggestion: { mapbox_id: string }) => {
    const token = (import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '').trim();
    if (!token.startsWith('pk.')) return;
    setIsSearching(true);
    try {
      const url = new URL(`https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(suggestion.mapbox_id)}`);
      url.searchParams.set('language', isAr ? 'ar' : 'en');
      url.searchParams.set('session_token', createSearchSession());
      url.searchParams.set('access_token', token);
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Retrieve failed');
      const data = await response.json();
      const feature = data?.features?.[0];
      const coordinates = feature?.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return;
      const [newLng, newLat] = coordinates;
      setLng(newLng);
      setLat(newLat);
      setSearchQuery(feature?.properties?.name || suggestion.name || '');
      setAddressPreview(feature?.properties?.full_address || feature?.properties?.place_formatted || '');
      setSearchSuggestions([]);
      setIsSearchOpen(false);
      setActiveCategory(null);
      mapboxMapRef.current?.flyTo({ center: [newLng, newLat], zoom: Math.max(mapboxMapRef.current.getZoom(), 16), duration: 700 });
    } catch (error) {
      console.warn('Map search selection failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategorySearch = async (category: string) => {
    const token = (import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || '').trim();
    if (!token.startsWith('pk.')) return;
    setActiveCategory(category);
    setIsSearching(true);
    try {
      const url = new URL('https://api.mapbox.com/search/searchbox/v1/category/' + encodeURIComponent(category));
      url.searchParams.set('language', isAr ? 'ar' : 'en');
      url.searchParams.set('limit', '10');
      url.searchParams.set('country', 'SA');
      url.searchParams.set('proximity', `${lng},${lat}`);
      url.searchParams.set('access_token', token);
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Category search failed');
      const data = await response.json();
      const feature = data?.features?.[0];
      if (feature?.geometry?.coordinates) {
        const [newLng, newLat] = feature.geometry.coordinates;
        setLng(newLng);
        setAddressPreview(feature?.properties?.full_address || feature?.properties?.name || '');
        mapboxMapRef.current?.flyTo({ center: [newLng, newLat], zoom: 16, duration: 700 });
      }
    } catch (error) {
      console.warn('Category search failed:', error);
    } finally {
      setIsSearching(false);
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
    if (!currentLocation) clearRoute();
  }, [currentLocation]);

  const handleRecenter = () => {
    if (currentLocation && mapboxMapRef.current) mapboxMapRef.current.flyTo({ center: [currentLocation.lng, currentLocation.lat], zoom: 16, duration: 700 });
    else handleUseCurrentGPS();
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(20, zoom + 1);
    setZoom(newZoom);
    if (mapboxMapRef.current) {
      mapboxMapRef.current.setZoom(newZoom);
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
        {isMapboxReady && (
          <div className="absolute top-[72px] sm:top-24 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] sm:w-[min(560px,calc(100%-3rem))] pointer-events-none">
            <div className="relative pointer-events-auto">
              <div className="h-12 sm:h-14 rounded-2xl bg-white text-zinc-900 shadow-[0_8px_35px_rgba(0,0,0,0.35)] flex items-center px-3 gap-2 border border-black/10">
                {isSearching ? <Loader2 className="w-5 h-5 text-zinc-500 animate-spin shrink-0" /> : <Search className="w-5 h-5 text-zinc-500 shrink-0" />}
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setIsSearchOpen(false); }}
                  placeholder={isAr ? 'ابحث عن متجر أو مطعم أو عنوان...' : 'Search for a shop, restaurant, address...'}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-zinc-400"
                  aria-label={isAr ? 'البحث في الخريطة' : 'Search map'}
                />
                {searchQuery && <button type="button" onClick={() => { setSearchQuery(''); setSearchSuggestions([]); }} className="p-1 text-zinc-400 hover:text-zinc-800"><X className="w-4 h-4" /></button>}
              </div>
              {isSearchOpen && searchSuggestions.length > 0 && (
                <div className="absolute top-[52px] sm:top-[60px] left-0 right-0 bg-white rounded-2xl shadow-2xl overflow-hidden border border-black/10">
                  {searchSuggestions.map((item) => (
                    <button key={item.mapbox_id} type="button" onClick={() => handleSelectSearchResult(item)} className="w-full px-4 py-3 text-left hover:bg-zinc-100 border-b last:border-0 border-zinc-100 flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 text-[#9b7b1f] shrink-0" />
                      <span className="min-w-0"><span className="block text-sm font-semibold truncate">{item.name}</span><span className="block text-xs text-zinc-500 truncate">{item.full_address || item.place_formatted || item.feature_type}</span></span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                ['cafe', isAr ? 'مقاهي' : 'Cafes', Utensils],
                ['restaurant', isAr ? 'مطاعم' : 'Restaurants', Utensils],
                ['grocery', isAr ? 'بقالة' : 'Grocery', ShoppingCart],
                ['gas station', isAr ? 'وقود' : 'Fuel', Fuel],
                ['hospital', isAr ? 'مستشفيات' : 'Hospitals', HeartPulse],
                ['mosque', isAr ? 'مساجد' : 'Mosques', Landmark],
              ].map(([category, label, Icon]) => (
                <button key={String(category)} type="button" onClick={() => handleCategorySearch(String(category))} className={`shrink-0 h-9 px-3 rounded-full bg-white/95 border text-[11px] font-semibold shadow-md flex items-center gap-1.5 ${activeCategory === category ? 'border-[#D4AF37] text-black' : 'border-black/10 text-zinc-700'}`}>
                  {React.createElement(Icon as React.ElementType, { className: 'w-3.5 h-3.5' })}{label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div
          ref={mapContainerRef}
          className="zoal-map-picker w-full h-full bg-[#0a0a0a]"
          style={{ minHeight: '100%' }}
        />

        {isMapboxReady && (
        <div className="absolute top-[76px] sm:top-24 start-3 sm:start-6 z-30">
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
          <div className="absolute top-[132px] sm:top-40 end-3 sm:end-6 z-30 bg-black/90 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl px-3 py-2.5 min-w-40">
            <div className="flex items-center gap-2 text-xs font-bold text-white"><Route className="w-4 h-4 text-[#D4AF37]" />{routeInfo.distanceKm} km</div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400"><Clock3 className="w-3.5 h-3.5" />{routeInfo.durationMin} min</div>
          </div>
        )}

        <div className="absolute bottom-[calc(8.75rem+env(safe-area-inset-bottom))] sm:bottom-[calc(8rem+env(safe-area-inset-bottom))] end-3 sm:end-6 z-30 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleRecenter}
            className="w-11 h-11 sm:w-11 sm:h-11 bg-black/90 hover:bg-zinc-900 text-[#D4AF37] border border-[#D4AF37]/40 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer"
            title={isAr ? 'الموقع الحالي GPS' : 'Use GPS Location'} aria-label={isAr ? 'الموقع الحالي GPS' : 'Current location / Recenter'}
          >
            <Crosshair className="w-5 h-5" />
          </button>

          {isMapboxReady && (
            <button type="button" onClick={handleShowRoute} className="w-10 h-10 sm:w-11 sm:h-11 bg-black/90 hover:bg-zinc-900 text-[#D4AF37] border border-[#D4AF37]/40 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer" title={isAr ? 'الاتجاهات' : 'Directions'} aria-label={isAr ? 'الاتجاهات' : 'Directions'}>
              <Route className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col bg-black/90 border border-white/10 rounded-lg overflow-hidden shadow-2xl min-w-[44px]">
            <button
              type="button"
              onClick={handleZoomIn}
              aria-label={isAr ? 'تكبير الخريطة' : 'Zoom in'}
              title={isAr ? 'تكبير الخريطة' : 'Zoom in'}
              className="p-2.5 sm:p-3 hover:bg-zinc-800 text-white border-b border-white/10 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              aria-label={isAr ? 'تصغير الخريطة' : 'Zoom out'}
              title={isAr ? 'تصغير الخريطة' : 'Zoom out'}
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
          className="absolute top-[68px] sm:top-16 left-3 right-3 sm:left-4 sm:right-4 z-40 bg-[#D4AF37] text-black p-3.5 rounded-sm shadow-2xl border border-white/20 flex items-center justify-between"
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
