import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { Sparkles, Heart, ShoppingBag, Eye, X, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandingProvider, useBranding } from './components/BrandingContext';
import { Product, CartItem, Order } from './types';
import { SEED_MOCK_ORDERS } from './data';
import { BlogPost } from './types/blog';
import { useTranslation } from 'react-i18next';
import PremiumBrandedLoader from './components/common/PremiumBrandedLoader';

// Static / High Priority Core Viewport Imports (for zero-shift, immediate initial paint)
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Scrolltelling from './components/Scrolltelling';
import { SafeImage, useGlobalProducts, resolveProductImage } from './imageRegistry';
import Footer from './components/Footer';
import { formatCurrency } from './utils';
import { supabaseClient } from './lib/supabaseClient';
import GlobalNotificationRenderer from './components/GlobalNotificationRenderer';
import { dispatchNotification } from './lib/notificationDispatcher';
import SEO from './components/SEO';
import { useNotificationEngine } from './lib/notificationStore';
import EnterpriseNotificationToast from './components/EnterpriseNotificationToast';
import { filterNotificationsByRole } from './rbac/notificationRbac';

// Dynamic / Low Priority Viewport Imports (Code Splitting & Bundle Size Optimization with Robust Retry Logic)
const lazyWithRetry = (importFn: () => Promise<any>) => {
  return lazy(() => {
    return new Promise<any>((resolve) => {
      let retriesLeft = 5;
      let interval = 1000;

      function attempt() {
        importFn()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft <= 0) {
              console.error("Critical: Failed to fetch dynamically imported module after retries.", error);
              resolve({
                default: () => (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] py-20 text-center space-y-4">
                    <p className="text-zinc-400 text-sm">Unable to load section. Please refresh the page.</p>
                    <button onClick={() => window.location.reload()} className="bg-gold-pure text-black px-4 py-2 rounded-xs text-xs font-bold uppercase tracking-widest hover:bg-gold-light">
                      Refresh
                    </button>
                  </div>
                )
              });
            } else {
              console.warn(`Failed to load module, retrying in ${interval}ms (${retriesLeft} retries left)...`, error);
              setTimeout(() => {
                retriesLeft--;
                interval = Math.round(interval * 1.5);
                attempt();
              }, interval);
            }
          });
      }
      attempt();
    });
  });
};

const Store = lazyWithRetry(() => import('./components/Store'));
const ProductDetail = lazyWithRetry(() => import('./components/ProductDetail'));
const Cart = lazyWithRetry(() => import('./components/Cart'));
const Contact = lazyWithRetry(() => import('./components/Contact'));
const About = lazyWithRetry(() => import('./components/About'));
const Branches = lazyWithRetry(() => import('./components/Branches'));
const Blog = lazyWithRetry(() => import('./components/Blog'));
const FAQ = lazyWithRetry(() => import('./components/FAQ'));
const Portfolio = lazyWithRetry(() => import('./components/Portfolio'));
const AuthPage = lazyWithRetry(() => import('./components/AuthPage'));
const CookieConsent = lazyWithRetry(() => import('./components/CookieConsent'));
const CheckoutSuccessModal = lazyWithRetry(() => import('./components/CheckoutSuccessModal'));
const LogoutModal = lazyWithRetry(() => import('./components/LogoutModal'));
const SupabaseStoragePanel = lazyWithRetry(() => import('./components/SupabaseStoragePanel'));
const EnterpriseNotificationCenter = lazyWithRetry(() => import('./components/EnterpriseNotificationCenter'));

const Checkout = lazyWithRetry(() => import('./components/Checkout'));
const Dashboards = lazyWithRetry(() => import('./components/Dashboards'));
const AdminDashboard = lazyWithRetry(() => import('./components/AdminDashboard'));
const WishlistPage = lazyWithRetry(() => import('./components/WishlistPage'));
const PrivacyPolicy = lazyWithRetry(() => import('./components/PrivacyPolicy'));
const TermsAndConditions = lazyWithRetry(() => import('./components/TermsAndConditions'));
const ShippingPolicy = lazyWithRetry(() => import('./components/ShippingPolicy'));
const ReturnRefundPolicy = lazyWithRetry(() => import('./components/ReturnRefundPolicy'));
const CookiePolicy = lazyWithRetry(() => import('./components/CookiePolicy'));
const DataDeletion = lazyWithRetry(() => import('./components/DataDeletion'));
const NotFound = lazyWithRetry(() => import('./components/NotFound'));
const TrackOrder = lazyWithRetry(() => import('./components/TrackOrder'));
const PaymentSimulation = lazyWithRetry(() => import('./components/PaymentSimulation'));
const MapPickerPage = lazyWithRetry(() => import('./components/MapPickerPage'));

// Premium, On-Brand Suspense Loader
const PremiumLoader = ({ message, fullScreen, inline }: { message?: string; fullScreen?: boolean; inline?: boolean }) => (
  <PremiumBrandedLoader message={message} fullScreen={fullScreen} inline={inline} />
);

export default function App() {
  if (typeof window !== 'undefined' && (window.location.pathname === '/map-selection' || window.location.pathname.startsWith('/map-selection'))) {
    return (
      <BrandingProvider>
        <Suspense fallback={<PremiumLoader message="Loading Map Selector..." fullScreen />}>
          <MapPickerPage />
        </Suspense>
      </BrandingProvider>
    );
  }

  return (
    <BrandingProvider>
      <AppContent />
    </BrandingProvider>
  );
}

function AppContent() {
  const { t, i18n } = useTranslation();
  const allProducts = useGlobalProducts();
  const { settings } = useBranding();
  
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  // Navigation states
  const routeInitializedRef = useRef(false);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Mobile Featured Carousel state & scroll handler
  const mobileFeaturedCarouselRef = useRef<HTMLDivElement>(null);
  const [activeMobileFeaturedCard, setActiveMobileFeaturedCard] = useState<number>(0);

  const handleMobileFeaturedScroll = useCallback(() => {
    if (!mobileFeaturedCarouselRef.current) return;
    const container = mobileFeaturedCarouselRef.current;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    const children = Array.from(container.children) as HTMLElement[];
    
    let closestIndex = 0;
    let minDistance = Infinity;

    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(containerCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    setActiveMobileFeaturedCard(closestIndex);
  }, []);

  // Hide outer vertical scrollbar on mobile (<768px) for non-store pages
  useEffect(() => {
    const isStorePage = currentPage === 'store' || !!selectedProduct;
    if (!isStorePage) {
      document.documentElement.classList.add('mobile-scrollbar-hidden');
      document.body.classList.add('mobile-scrollbar-hidden');
    } else {
      document.documentElement.classList.remove('mobile-scrollbar-hidden');
      document.body.classList.remove('mobile-scrollbar-hidden');
    }
    
    return () => {
      document.documentElement.classList.remove('mobile-scrollbar-hidden');
      document.body.classList.remove('mobile-scrollbar-hidden');
    };
  }, [currentPage, selectedProduct]);

  // Ecommerce state tracking
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('zoal_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to restore cart:', e);
        try {
          localStorage.removeItem('zoal_cart');
        } catch (_) {}
      }
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('zoal_wishlist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to restore wishlist:', e);
        try {
          localStorage.removeItem('zoal_wishlist');
        } catch (_) {}
      }
    }
    return [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('zoal_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to restore orders list:', e);
      }
    }
    return (process.env.NODE_ENV === 'production' || import.meta.env?.PROD) ? [] : SEED_MOCK_ORDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('zoal_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('zoal_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist:', e);
    }
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('zoal_orders', JSON.stringify(orders));
  }, [orders]);

  // Success Modal & Toast states
  const [checkoutSuccessModalOpen, setCheckoutSuccessModalOpen] = useState<boolean>(false);
  const [activeSuccessOrder, setActiveSuccessOrder] = useState<Order | null>(null);

  // Premium Logout Modal State
  const [logoutModalOpen, setLogoutModalOpen] = useState<boolean>(false);
  const [logoutModalStatus, setLogoutModalStatus] = useState<'confirm' | 'loading' | 'success'>('confirm');

  // Applied modifiers
  const [couponCode, setCouponCode] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Genuine VIP Authentication State Engine
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authStatusMessage, setAuthStatusMessage] = useState<string>('Authenticating...');
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
    role: string;
    addresses?: any[];
  } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login');
  const [dashboardSubTab, setDashboardSubTab] = useState<string>('overview');
  const [adminSubTab, setAdminSubTab] = useState<string>('dashboard');

  const handleNotificationNavigate = (targetModule: string, _params?: any) => {
    setNotificationCenterOpen(false);
    const userRole = ((currentUser as any)?.role || 'customer').toLowerCase();
    
    if (['admin', 'manager', 'owner'].includes(userRole)) {
      setCurrentPage('admin');
      if (targetModule === 'orders') setAdminSubTab('orders');
      else if (targetModule === 'inventory') setAdminSubTab('inventory');
      else if (targetModule === 'crm' || targetModule === 'customers') setAdminSubTab('crm');
      else if (targetModule === 'security') setAdminSubTab('security');
      else if (targetModule === 'ai_center' || targetModule === 'ai' || targetModule === 'marketing') setAdminSubTab('ai_center');
      else setAdminSubTab(targetModule);
    } else {
      setCurrentPage('dashboard');
      if (targetModule === 'orders') setDashboardSubTab('orders');
      else if (targetModule === 'track') setDashboardSubTab('track');
      else if (targetModule === 'support' || targetModule === 'tickets') setDashboardSubTab('support');
      else if (targetModule === 'inventory') setDashboardSubTab('inventory');
      else setDashboardSubTab(targetModule);
    }
  };

  // Enterprise Notification Engine with RBAC filtering
  const notificationEngine = useNotificationEngine(currentUser);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);

  const [shownToastIds, setShownToastIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('zoal_shown_toast_ids');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
    return new Set();
  });

  const filteredNotifications = useMemo(() => {
    return filterNotificationsByRole(notificationEngine.notifications, currentUser);
  }, [notificationEngine.notifications, currentUser]);

  const userUnreadCount = useMemo(() => {
    return filteredNotifications.filter(n => !n.read && !n.archived).length;
  }, [filteredNotifications]);

  useEffect(() => {
    if (!currentUser || filteredNotifications.length === 0) {
      return;
    }

    const unshownNew = filteredNotifications.find(
      n => !n.read && !n.archived && !shownToastIds.has(n.id)
    );

    if (unshownNew) {
      dispatchNotification({
        type: 'system',
        variant: 'toast',
        title: unshownNew.title,
        message: unshownNew.message,
        metadata: unshownNew
      });
      setShownToastIds(prev => {
        const next = new Set(prev).add(unshownNew.id);
        try {
          localStorage.setItem('zoal_shown_toast_ids', JSON.stringify(Array.from(next)));
        } catch (e) {
          // ignore
        }
        return next;
      });
    }
  }, [currentUser, filteredNotifications, shownToastIds]);

  // Listen to fallbacks or nested elements triggering the login modal
  useEffect(() => {
    const handleOpenAuth = () => setAuthModalOpen(true);
    window.addEventListener('zoal-open-auth', handleOpenAuth);
    return () => window.removeEventListener('zoal-open-auth', handleOpenAuth);
  }, []);

  // Supabase Sync States (Moved from SupabaseSyncManager)
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [fetchingStatus, setFetchingStatus] = useState(false);
  const [syncingData, setSyncingData] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const fetchSupabaseStatus = async () => {
    setFetchingStatus(true);
    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        setSupabaseStatus(data);
      }
    } catch (err: any) {
      console.warn('⚠️ Could not fetch Supabase status:', err.message);
    } finally {
      setFetchingStatus(false);
    }
  };

  const handleCopySchema = () => {
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleSyncData = async () => {
    setSyncingData(true);
    try {
      const res = await fetch('/api/supabase/sync', { method: 'POST' });
      const data = await res.json();
      setSyncResult(data);
      setSyncError(null);
    } catch (err: any) {
      setSyncError(err.message);
    } finally {
      setSyncingData(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchSupabaseStatus();
    }
  }, [currentUser]);

  // Detect payment simulation query params on load to route to payment-simulate page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_id') && params.get('order_id')) {
      setCurrentPage('payment-simulate');
    }
  }, []);

  // Cleanup empty trailing hash after successful authentication (e.g. from OAuth redirects/callbacks)
  useEffect(() => {
    if (window.location.hash === '' && window.location.href.endsWith('#')) {
      window.history.replaceState(
        null,
        document.title,
        window.location.pathname + window.location.search
      );
    }
  }, []);

  // Track visited/loaded pages to prevent redundant prefetching
  const loadedPagesRef = useRef<Set<string>>(new Set<string>());

  useEffect(() => {
    if (currentPage) {
      loadedPagesRef.current.add(currentPage);
    }
    if (selectedProduct) {
      loadedPagesRef.current.add('product');
    }
    if (authModalOpen) {
      loadedPagesRef.current.add('auth');
    }
  }, [currentPage, selectedProduct, authModalOpen]);

  // Selective background prefetch strategy for high-priority public routes during browser idle time
  useEffect(() => {
    // Guardrail: Detect slow or data-saving connections
    const shouldPrefetch = () => {
      if (typeof navigator === 'undefined') return false;
      const conn = (navigator as any).connection;
      if (conn) {
        if (conn.saveData === true) return false;
        const type = conn.effectiveType;
        if (type === '2g' || type === 'slow-2g' || type === '3g') return false;
      }
      return true;
    };

    if (!shouldPrefetch()) return;

    // High-priority targets, prefetched in order of priority:
    // 1. Store, 2. Cart, 3. ProductDetail, 4. WishlistPage, 5. About, 6. Contact, 7. Branches, 8. FAQ, 9. Portfolio, 10. AuthPage
    const targets = [
      { key: 'store', importFn: () => import('./components/Store') },
      { key: 'cart', importFn: () => import('./components/Cart') },
      { key: 'product', importFn: () => import('./components/ProductDetail') },
      { key: 'wishlist', importFn: () => import('./components/WishlistPage') },
      { key: 'about', importFn: () => import('./components/About') },
      { key: 'contact', importFn: () => import('./components/Contact') },
      { key: 'branches', importFn: () => import('./components/Branches') },
      { key: 'faq', importFn: () => import('./components/FAQ') },
      { key: 'portfolio', importFn: () => import('./components/Portfolio') },
      { key: 'auth', importFn: () => import('./components/AuthPage') },
    ];

    const prefetchedKeys = new Set<string>();

    const runPrefetch = () => {
      let delay = 0;
      targets.forEach((target) => {
        setTimeout(() => {
          // Skip if the user has already visited/loaded the page during this session
          if (loadedPagesRef.current.has(target.key)) {
            return;
          }
          // Skip if we already started prefetching it
          if (prefetchedKeys.has(target.key)) {
            return;
          }

          prefetchedKeys.add(target.key);

          // Trigger background dynamic import, which registers the chunk in browser/module cache
          target.importFn().catch(() => {
            // Silently ignore prefetch failures to maintain zero UX impact
          });
        }, delay);

        delay += 800; // Stagger each request by 800ms to guarantee zero network competition
      });
    };

    // Use requestIdleCallback if available, fallback to 2.5s setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(() => {
        // Stagger execution after the initial idle event
        setTimeout(runPrefetch, 1000);
      }, { timeout: 5000 });
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(idleId);
        }
      };
    } else {
      const timerId = setTimeout(runPrefetch, 2500);
      return () => clearTimeout(timerId);
    }
  }, []);

  const handleSetCurrentPage = useCallback((page: string) => {
    setCurrentPage(page);
    setSelectedProduct(null);
    setSelectedPost(null);
  }, []);

  const handleLogout = useCallback(() => {
    setLogoutModalStatus('confirm');
    setLogoutModalOpen(true);
  }, []);

  const handleOpenNotifications = useCallback(() => setNotificationCenterOpen(true), []);

  const setSoundEnabled = useCallback((enabled: boolean) => notificationEngine.setSoundEnabled(enabled), [notificationEngine]);

  // Restore authenticated session on mount and listen to auth state changes
  useEffect(() => {
    let active = true;
    let subscription: any = null;

    // 1. Check real Supabase session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) {
        const token = session.access_token;
        localStorage.setItem('zoal_auth_token', token);
        setAuthStatusMessage('Preparing Profile...');
        fetchProfile(token, () => {
          if (active) {
            setupAuthStateListener();
          }
        });
      } else {
        proceedWithStandardNoSession();
      }
    }).catch((err) => {
      console.warn('Initial session check failed:', err);
      if (active) {
        proceedWithStandardNoSession();
      }
    });

    function proceedWithStandardNoSession() {
      localStorage.removeItem('zoal_auth_token');
      sessionStorage.removeItem('zoal_auth_token');
      setIsAuthLoading(false);
      setupAuthStateListener();
    }

    function setupAuthStateListener() {
      if (!active) return;
      // Set up reactive listener for all subsequent auth events (ignoring initial trigger)
      const sub = supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (!active) return;
        if (session) {
          const token = session.access_token;
          localStorage.setItem('zoal_auth_token', token);
          if (event === 'SIGNED_IN') {
            setAuthStatusMessage('Authenticating...');
          } else {
            setAuthStatusMessage('Preparing Profile...');
          }
          fetchProfile(token);
        } else {
          localStorage.removeItem('zoal_auth_token');
          sessionStorage.removeItem('zoal_auth_token');
          setCurrentUser(null);
          setIsAuthLoading(false);
        }
      });
      subscription = sub.data?.subscription;
    }

    return () => {
      active = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };

    function fetchProfile(token: string, onComplete?: () => void) {
      fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Session expired');
        }
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => {
        console.warn('Auto-login session restoration failed:', err.message);
        if (active) {
          localStorage.removeItem('zoal_auth_token');
          sessionStorage.removeItem('zoal_auth_token');
          setCurrentUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setIsAuthLoading(false);
          if (onComplete) onComplete();
        }
      });
    }
  }, []);

  const handleConfirmLogout = async () => {
    setLogoutModalStatus('loading');
    try {
      await supabaseClient.auth.signOut();
    } catch (err) {
      console.error('Error signing out from Supabase:', err);
    }
    
    // Clear client side session state and user-specific persisted storage keys
    localStorage.removeItem('zoal_auth_token');
    sessionStorage.removeItem('zoal_auth_token');
    localStorage.removeItem('zoal_cart');
    localStorage.removeItem('zoal_wishlist');
    localStorage.removeItem('zoal_orders');
    localStorage.removeItem('zoal_notifications');
    localStorage.removeItem('zoal_admin_notifications');
    localStorage.removeItem('zoal_staff_notifications');
    localStorage.removeItem('zoal_admin_notifications_v2');
    localStorage.removeItem('zoal_recent_orders');
    localStorage.removeItem('zoal_addresses');

    setCart([]);
    setWishlist([]);
    setOrders((process.env.NODE_ENV === 'production' || import.meta.env?.PROD) ? [] : SEED_MOCK_ORDERS);
    setCurrentUser(null);

    // Keep the luxury timing for the loader
    setTimeout(() => {
      setLogoutModalStatus('success');
    }, 1000, { name: 'Logout State Success Transition' });
  };

  const handleLogoutSuccessRedirect = () => {
    setLogoutModalOpen(false);
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // DEFAULT DELIVERY ZONES SEATED SCHEMAS
  const [deliveryZones, setDeliveryZones] = useState<any[]>(() => {
    const saved = localStorage.getItem('zoal_delivery_zones');
    return saved ? JSON.parse(saved) : [
      { id: '1', city: 'Hofuf', fee: 0, method: 'Local Delivery', region: 'Al Hofuf & Nearby Areas' },
      { id: '2', city: 'Branch B', fee: 25, method: 'Regional Delivery', region: 'Eastern Province' },
      { id: '3', city: 'Khobar', fee: 25, method: 'Regional Delivery', region: 'Eastern Province' },
      { id: '4', city: 'Branch A', fee: 45, method: 'Regional Delivery', region: 'Central Region' },
      { id: '5', city: 'Jeddah', fee: 50, method: 'Regional Delivery', region: 'Western Region' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_delivery_zones', JSON.stringify(deliveryZones));
  }, [deliveryZones]);

  const getPageFromPath = (path: string) => {
    switch (path) {
      case '/':
      case '':
        return 'home';
      case '/store':
        return 'store';
      case '/portfolio':
        return 'portfolio';
      case '/about':
        return 'about';
      case '/branches':
        return 'branches';
      case '/blog':
        return 'blog';
      case '/contact':
        return 'contact';
      case '/faq':
        return 'faq';
      case '/privacy-policy':
        return 'privacy';
      case '/terms-and-conditions':
        return 'terms';
      case '/shipping-policy':
        return 'shipping';
      case '/return-refund-policy':
        return 'returns';
      case '/cookie-policy':
        return 'cookies';
      case '/data-deletion':
        return 'deletion';
      case '/track-order':
        return 'track';
      case '/404':
        return '404';
      case '/cart':
        return 'cart';
      case '/checkout':
        return 'checkout';
      case '/dashboard':
        return 'dashboard';
      case '/wishlist':
        return 'wishlist';
      case '/admin':
        return 'admin';
      case '/login':
        return 'login';
      case '/register':
        return 'register';
      default:
        return '404';
    }
  };

  const getPathFromPage = (page: string) => {
    switch (page) {
      case 'home': return '/';
      case 'store': return '/store';
      case 'portfolio': return '/portfolio';
      case 'about': return '/about';
      case 'branches': return '/branches';
      case 'blog': return '/blog';
      case 'contact': return '/contact';
      case 'faq': return '/faq';
      case 'privacy': return '/privacy-policy';
      case 'terms': return '/terms-and-conditions';
      case 'shipping': return '/shipping-policy';
      case 'returns': return '/return-refund-policy';
      case 'cookies': return '/cookie-policy';
      case 'deletion': return '/data-deletion';
      case 'track': return '/track-order';
      case '404': return '/404';
      case 'cart': return '/cart';
      case 'checkout': return '/checkout';
      case 'dashboard': return '/dashboard';
      case 'wishlist': return '/wishlist';
      case 'admin': return '/admin';
      case 'login': return '/login';
      case 'register': return '/register';
      default: return '/';
    }
  };

  useEffect(() => {
    if (!routeInitializedRef.current) return;
    const currentPath = getPathFromPage(currentPage);
    if (window.location.pathname !== currentPath) {
      window.history.pushState(null, '', currentPath);
    }
  }, [currentPage]);

  useEffect(() => {
    const handlePathChange = () => {
      const page = getPageFromPath(window.location.pathname);
      routeInitializedRef.current = true;
      setCurrentPage(page);
    };

    window.addEventListener('popstate', handlePathChange);
    
    // Initial check
    handlePathChange();

    return () => {
      window.removeEventListener('popstate', handlePathChange);
    };
  }, []);

  useEffect(() => {
    const handleRouteChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCurrentPage(customEvent.detail);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('zoal-route-change', handleRouteChange);
    return () => window.removeEventListener('zoal-route-change', handleRouteChange);
  }, []);

  // Protected route access control with redirection and auto-trigger login prompt
  useEffect(() => {
    if (!isAuthLoading) {
      if (currentPage === 'dashboard' && !currentUser) {
        setCurrentPage('home');
        setAuthModalOpen(true);
        dispatchNotification({
          type: 'system',
          variant: 'toast',
          title: 'Authentication Required',
          message: 'Please sign in to access your dashboard.'
        });
      } else if (currentPage === 'admin') {
        const role = currentUser?.role?.toLowerCase();
        const isAdmin = role && ['owner', 'admin', 'manager'].includes(role);
        if (!isAdmin) {
          setCurrentPage('home');
          if (!currentUser) {
            setAuthModalOpen(true);
            dispatchNotification({
              type: 'system',
              variant: 'toast',
              title: 'Authentication Required',
              message: 'Please sign in to access the admin area.'
            });
          } else {
            dispatchNotification({
              type: 'system',
              variant: 'toast',
              title: 'Access Denied',
              message: 'You do not have permission to access the admin panel.'
            });
          }
        }
      }
    }
  }, [isAuthLoading, currentPage, currentUser, setAuthModalOpen]);

  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');

  // Cart operations
  const handleAddToCart = (product: Product, qty: number, option?: string) => {
    setCart((prevCart) => {
      const matchIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.selectedOption === option
      );
      if (matchIndex > -1) {
        const updated = [...prevCart];
        updated[matchIndex].quantity = Math.min(product.inventory, updated[matchIndex].quantity + qty);
        return updated;
      }
      return [...prevCart, { product, quantity: qty, selectedOption: option }];
    });

    // STEP 2 & STEP 11: Call centralized dispatchNotification
    dispatchNotification({
      type: 'cart',
      variant: 'preview',
      title: product.name,
      message: option || 'Standard',
      image: resolveProductImage(product),
      metadata: {
        product,
        quantity: qty,
        option: option || 'Standard'
      }
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: Math.min(item.product.inventory, Math.max(1, nextQty)) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Wishlist toggle
  const handleToggleWishlist = (productId: string) => {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;

    const isAlreadyInWishlist = wishlist.includes(productId);
    if (isAlreadyInWishlist) {
      dispatchNotification({
        type: 'wishlist',
        title: product.name,
        message: 'Removed from wishlist',
        image: resolveProductImage(product)
      });
      setWishlist((prevWish) => prevWish.filter((id) => id !== productId));
    } else {
      dispatchNotification({
        type: 'wishlist',
        title: product.name,
        message: 'Saved to wishlist',
        image: resolveProductImage(product)
      });
      setWishlist((prevWish) => [...prevWish, productId]);
    }
  };

  // Order workflow state modifier
  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) => (o.id === orderId ? { ...o, status } : o))
    );

    // Notify Customer about status change
    const order = orders.find(o => o.id === orderId);
    if (order) {
      notificationEngine.addNotification({
        title: `Order Status Updated: ${status}`,
        message: `Your order #${orderId} is now ${status}.`,
        category: 'Order',
        priority: 'medium',
        target_role: 'customer',
        user_id: (order as any).userId || (order as any).user_id || order.email,
        user_email: order.email,
        metadata: { orderId, status }
      });
    }
  };

  // Handle successful payments confirmation (Strict Server-Authoritative Sequencing)
  const handleOrderSuccess = async (newOrder: Order) => {
    try {
      const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 1. Authoritative persistence to database via backend proxy FIRST
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          order: newOrder,
          termsAccepted: true 
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.success === false)) {
        const errorMsg = data?.error || data?.message || 'Failed to record order. Please try again.';
        console.error('❌ Order persistence failed:', errorMsg);
        dispatchNotification({
          type: 'order',
          variant: 'toast',
          title: 'Order Processing Failed',
          message: errorMsg
        });
        alert(`Order Submission Failed: ${errorMsg}`);
        return false;
      }

      // 2. Only upon verified database save: update local state, clear cart, and reveal success modal
      setOrders((prev) => [newOrder, ...prev]);
      setCart([]); // Clear cart
      setDiscountPercent(0);
      setCouponCode('');
      
      // Set success modal states
      setActiveSuccessOrder(newOrder);
      setCheckoutSuccessModalOpen(true);
      setCurrentPage('dashboard'); // Transition to dashboard behind the scenes so closing the modal reveals it
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger System Notifications
      // 1. Customer Notification
      notificationEngine.addNotification({
        title: 'Order Confirmed',
        message: `Your order #${newOrder.id} has been placed successfully.`,
        category: 'Order',
        priority: 'high',
        target_role: 'customer',
        user_id: (currentUser as any)?.id || currentUser?.email,
        user_email: currentUser?.email,
        metadata: { orderId: newOrder.id }
      });

      // 2. Admin/Staff Notification
      notificationEngine.addNotification({
        title: 'New Enterprise Order',
        message: `A new order #${newOrder.id} (${newOrder.total} SAR) has been received.`,
        category: 'Order',
        priority: 'high',
        target_role: 'admin',
        metadata: { orderId: newOrder.id }
      });

      // Trigger full-stack order email confirmation and DB logger
      fetch('/api/orders/email', {
        method: 'POST',
        headers,
        body: JSON.stringify({ order: newOrder })
      })
      .then((res) => res.json())
      .then((data) => {
        console.log('Automated order email system response:', data);
      })
      .catch((err) => {
        console.error('Error triggering automated order email system:', err);
      });

      return true;
    } catch (err: any) {
      console.error('❌ Unexpected order submission error:', err);
      dispatchNotification({
        type: 'order',
        variant: 'toast',
        title: 'Order Submission Error',
        message: err.message || 'An unexpected error occurred while placing your order.'
      });
      alert(`Order Submission Error: ${err.message || 'Please try again.'}`);
      return false;
    }
  };

  const triggerSuccessToast = () => {
    dispatchNotification({
      type: 'order',
      variant: 'toast',
      title: 'Order Confirmed Successfully',
      message: 'Confirmation email has been sent.'
    });
  };

  const handleCloseSuccessModal = () => {
    setCheckoutSuccessModalOpen(false);
    triggerSuccessToast();
  };

  const handleContinueShopping = () => {
    setCurrentPage('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewOrders = () => {
    setCurrentPage('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Simulated login handling
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName.trim() || !authEmail.trim()) return;
    setCurrentUser({
      name: authName.trim(),
      email: authEmail.trim(),
      phone: settings.phone,
      address: '',
      role: 'customer'
    });
    setAuthModalOpen(false);
  };

  // Gather popular catalog highlights
  // Refined popular highlights filtering to handle both camelCase and snake_case property mappings from Supabase
  const popularHighlights = allProducts.filter((p: any) => 
    p.isPopular || p.popular || p.is_popular || 
    p.isFeatured || p.featured || p.is_featured || 
    p.isBestSeller || p.is_best_seller || 
    p.isRecommended || p.is_recommended || 
    p.isNewArrival || p.is_new_arrival
  );

  console.log('[Featured Collection Debug]', {
    allProductsCount: allProducts.length,
    popularHighlightsCount: popularHighlights.length,
    firstThreeHighlights: popularHighlights.slice(0, 3).map(p => ({ id: p.id, name: p.name, isFeatured: p.isFeatured, popular: p.popular }))
  });

  const isProtectedPage = currentPage === 'admin' || currentPage === 'dashboard';

  if (isAuthLoading && isProtectedPage) {
    return (
      <div className="bg-zinc-950 text-white min-h-screen flex items-center justify-center font-sans">
        <PremiumLoader message={authStatusMessage} />
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen font-sans selection:bg-gold-pure selection:text-black relative overflow-x-clip">
      <SEO currentPage={currentPage} selectedProduct={selectedProduct} selectedPost={selectedPost} authModalOpen={authModalOpen} authModalView={authModalView} />
      
      {/* Ambience Soft Glows from Artistic Flair */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-[#D4AF37] opacity-5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute top-[40%] right-[-150px] w-[500px] h-[500px] bg-[#D4AF37] opacity-[0.03] blur-[150px] rounded-full pointer-events-none z-0"></div>

      {/* Side Vertical Label for Luxury Editorial Aesthetic */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center space-y-8 z-30 pointer-events-none">
        <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent"></div>
        <span className="vertical-text rotate-180 text-[8.5px] tracking-[0.55em] text-[#D4AF37] uppercase select-none font-display font-medium" style={{ writingMode: 'vertical-rl' }}>{t('app.curated_excellence')}</span>
        <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent"></div>
      </div>

      {/* Dior Floating Translucent Header */}
      {currentPage !== 'admin' && currentPage !== 'dashboard' && !(currentPage === 'track' && currentUser) && (
        <Navbar
          currentPage={currentPage}
          setCurrentPage={handleSetCurrentPage}
          cart={cart}
          wishlist={wishlist}
          currentUser={currentUser}
          setAuthModalOpen={setAuthModalOpen}
          selectedCategoryFilter={selectedCategoryFilter}
          setSelectedCategoryFilter={setSelectedCategoryFilter}
          setDashboardSubTab={setDashboardSubTab}
          onLogout={handleLogout}
          unreadCount={userUnreadCount}
          onOpenNotifications={handleOpenNotifications}
          soundEnabled={notificationEngine.soundEnabled}
          setSoundEnabled={setSoundEnabled}
          isOnline={notificationEngine.isOnline}
          connectionStatus={notificationEngine.connectionStatus}
        />
      )}

      {/* RENDER ACTIVE SCREEN CONTROLLER */}
      <Suspense fallback={<PremiumLoader inline={true} />}>
        {selectedProduct ? (
        <ProductDetail
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          wishlist={wishlist}
          setCurrentPage={setCurrentPage}
          onProductSelect={setSelectedProduct}
          currentUser={currentUser}
          orders={orders}
        />
      ) : (
        <>
          {/* HOME VIEW */}
          {currentPage === 'home' && (
            <div className="space-y-0 overflow-x-hidden max-w-full min-w-0">
              
              {/* Cinematic hero section */}
              <Hero
                setCurrentPage={setCurrentPage}
                setSelectedCategoryFilter={(cat) => {
                  setSelectedCategoryFilter(cat);
                  setCurrentPage('store');
                }}
              />

              {/* Scrollable Story walkthroughs */}
              <Scrolltelling 
                setCurrentPage={setCurrentPage}
                setSelectedCategoryFilter={setSelectedCategoryFilter}
              />

              {/* FEATURED POPULAR COLLECTIONS SECTION */}
              <section className="bg-black py-8 sm:py-24 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  
                  <div 
                    className="text-center mb-4 sm:mb-16"
                  >
                    <h2 className="text-2xl sm:text-4xl font-bold tracking-[0.25em] text-white font-display uppercase">
                      {t('home.featured.title')}
                    </h2>
                    <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-3" />
                    <div className="relative mt-3 hidden sm:flex items-center justify-center w-full">
                      <p className="text-zinc-500 text-xs tracking-widest uppercase">{t('home.featured.subtitle')}</p>
                      <button 
                        onClick={() => {
                          setCurrentPage('store');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="absolute right-0 text-[#D4AF37] hover:text-white transition-colors duration-300 text-xs tracking-widest uppercase font-semibold hidden sm:block rtl:right-auto rtl:left-0"
                      >
                        {t('home.actions.view_all')}
                      </button>
                    </div>
                    {/* Mobile subtitle without desktop absolute button */}
                    <p className="text-zinc-500 text-[11px] tracking-widest uppercase mt-2 sm:hidden">{t('home.featured.subtitle')}</p>
                  </div>

                  {/* Mobile View All CTA positioned right above carousel */}
                  <div className="flex sm:hidden items-center justify-between px-2 max-w-7xl mx-auto mb-2">
                    <span className="text-[8.5px] tracking-[0.25em] text-zinc-600 uppercase font-mono">
                      {i18n.language === 'ar' ? 'اسحب للتصفح' : 'SWIPE TO EXPLORE'}
                    </span>
                    <button 
                      onClick={() => {
                        setCurrentPage('store');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[#D4AF37] hover:text-white transition-colors duration-300 text-[10px] tracking-widest uppercase font-semibold inline-flex items-center gap-1"
                    >
                      {t('home.actions.view_all')} →
                    </button>
                  </div>

                  {/* MOBILE SWIPEABLE CAROUSEL (<768px) */}
                  <div 
                    ref={mobileFeaturedCarouselRef}
                    onScroll={handleMobileFeaturedScroll}
                    className="md:hidden flex overflow-x-auto snap-x snap-mandatory touch-pan-x gap-4 px-[14vw] sm:px-[13vw] py-2 -mx-4 sm:-mx-6 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {popularHighlights.slice(0, 3).map((item, index) => {
                      const isActive = index === activeMobileFeaturedCard;
                      return (
                        <div
                          key={`mobile-featured-${item.id}-${index}`}
                          onClick={() => {
                            setSelectedProduct(item);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-[72vw] xs:w-[70vw] sm:w-[68vw] max-w-[340px] shrink-0 snap-center transition-[transform,opacity] duration-400 ease-out transform-gpu will-change-transform cursor-pointer ${
                            isActive 
                              ? 'scale-100 opacity-100 z-20 shadow-[0_16px_48px_rgba(212,175,55,0.12)]' 
                              : 'scale-[0.90] opacity-50 z-10'
                          }`}
                        >
                          <div className="group bg-[#050505] border border-white/5 hover:border-gold-pure/25 rounded-sm overflow-hidden flex flex-col justify-between h-full hover:shadow-[0_4px_25px_rgba(212,175,55,0.06)]">
                            <div className="relative aspect-square bg-black overflow-hidden select-none">
                              <SafeImage
                                product={item}
                                alt={t(`products.${item.id}.name`, { defaultValue: item.name })}
                                className="w-full h-full object-cover group-hover:scale-105 duration-500"
                                containerClassName="w-full h-full overflow-hidden relative"
                                priority={true}
                              />
                              <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 text-[7.5px] uppercase tracking-widest text-[#D4AF37] rounded-full border border-gold-pure/20 z-10">
                                {t(`home.categories.${item.category}`, { defaultValue: item.category.replace('_', ' ') })}
                              </div>
                            </div>

                            <div className="p-3.5 flex-grow flex flex-col justify-between">
                              <div>
                                <h3 className="text-white text-[11px] font-display uppercase tracking-widest font-semibold group-hover:text-gold-pure duration-300 line-clamp-2">
                                  {t(`products.${item.id}.name`, { defaultValue: item.name })}
                                </h3>
                                <p className="text-zinc-500 text-[10.5px] mt-1.5 leading-relaxed line-clamp-2">
                                  {t(`products.${item.id}.description`, { defaultValue: item.description })}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-xs">
                                <span className="text-gold-pure font-sans font-bold tracking-normal text-[11px] tabular-nums-fix">{formatCurrency(item.price)} <span className="text-[9px]">{t('home.cards.sar')}</span></span>
                                <span className="flex text-zinc-400 group-hover:translate-x-1 duration-300 items-center gap-1 font-display uppercase text-[9px] tracking-widest rtl:flex-row-reverse rtl:group-hover:-translate-x-1">
                                  {t('home.actions.examine')} <ArrowUpRight className="w-3.5 h-3.5 text-gold-pure rtl:rotate-90" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP GRID (>=768px) */}
                  <motion.div 
                    key="popular-highlights-grid"
                    className="hidden md:grid md:grid-cols-3 gap-8"
                  >
                    {popularHighlights.slice(0, 3).map((item, index) => (
                      <motion.div
                        variants={{
                          hidden: { opacity: 1, y: 0, rotateX: 0 },
                          show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0 } }
                        }}
                        key={`desktop-featured-${item.id}-${index}`}
                        onClick={() => {
                          setSelectedProduct(item);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="group bg-[#050505] border border-white/5 hover:border-gold-pure/25 rounded-sm overflow-hidden flex flex-col justify-between h-full hover:shadow-[0_4px_25px_rgba(212,175,55,0.06)] cursor-pointer"
                      >
                        <div className="relative aspect-square bg-black overflow-hidden select-none">
                          <SafeImage
                            product={item}
                            alt={t(`products.${item.id}.name`, { defaultValue: item.name })}
                            className="w-full h-full object-cover group-hover:scale-105 duration-500"
                            containerClassName="w-full h-full overflow-hidden relative"
                            priority={true}
                          />
                          <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 text-[7.5px] uppercase tracking-widest text-[#D4AF37] rounded-full border border-gold-pure/20 z-10">
                            {t(`home.categories.${item.category}`, { defaultValue: item.category.replace('_', ' ') })}
                          </div>
                        </div>

                        <div className="p-5 flex-grow flex flex-col justify-between">
                          <div>
                            <h3 className="text-white text-xs font-display uppercase tracking-widest font-semibold group-hover:text-gold-pure duration-300 line-clamp-2">
                              {t(`products.${item.id}.name`, { defaultValue: item.name })}
                            </h3>
                            <p className="text-zinc-500 text-[10.5px] mt-1.5 leading-relaxed line-clamp-2">
                              {t(`products.${item.id}.description`, { defaultValue: item.description })}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4 text-xs">
                            <span className="text-gold-pure font-sans font-bold tracking-normal text-xs tabular-nums-fix">{formatCurrency(item.price)} <span className="text-[10px]">{t('home.cards.sar')}</span></span>
                            <span className="flex text-zinc-400 group-hover:translate-x-1 duration-300 items-center gap-1 font-display uppercase text-[9px] tracking-widest rtl:flex-row-reverse rtl:group-hover:-translate-x-1">
                              {t('home.actions.examine')} <ArrowUpRight className="w-3.5 h-3.5 text-gold-pure rtl:rotate-90" />
                            </span>
                          </div>
                        </div>

                      </motion.div>
                    ))}
                  </motion.div>

                </div>
              </section>

            </div>
          )}

          {/* STORE VIEW */}
          {currentPage === 'store' && (
            <Store
              onProductSelect={(prod) => {
                setSelectedProduct(prod);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
              wishlist={wishlist}
              initialCategoryFilter={selectedCategoryFilter}
            />
          )}

          {/* PORTFOLIO VIEW */}
          {currentPage === 'portfolio' && (
            <div className="max-w-full min-w-0">
              <Portfolio 
                setCurrentPage={setCurrentPage}
                setSelectedCategoryFilter={setSelectedCategoryFilter}
                onProductSelect={(prod) => {
                  setSelectedProduct(prod);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                wishlist={wishlist}
              />
            </div>
          )}

          {/* ABOUT HERITAGE VIEW */}
          {currentPage === 'about' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <About />
            </div>
          )}

          {/* GEOGRAPHIC BRANCHES VIEW */}
          {currentPage === 'branches' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <Branches />
            </div>
          )}

          {/* EDITORIAL BLOG VIEW */}
          {currentPage === 'blog' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <Blog onPostSelect={setSelectedPost} currentUser={currentUser} />
            </div>
          )}

          {/* CUSTOM INQUIRIES VIEW */}
          {currentPage === 'contact' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <Contact />
            </div>
          )}

          {/* FREQUENTLY ASKED QUESTIONS VIEW */}
          {currentPage === 'faq' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <FAQ setCurrentPage={setCurrentPage} />
            </div>
          )}

           {/* PRIVACY POLICY VIEW */}
          {currentPage === 'privacy' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <PrivacyPolicy />
            </div>
          )}

          {/* TERMS & CONDITIONS VIEW */}
          {currentPage === 'terms' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <TermsAndConditions />
            </div>
          )}

          {/* SHIPPING POLICY VIEW */}
          {currentPage === 'shipping' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <ShippingPolicy />
            </div>
          )}

          {/* RETURN & REFUND POLICY VIEW */}
          {currentPage === 'returns' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <ReturnRefundPolicy />
            </div>
          )}

          {/* COOKIE POLICY VIEW */}
          {currentPage === 'cookies' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <CookiePolicy />
            </div>
          )}

          {/* USER DATA DELETION POLICY VIEW */}
          {currentPage === 'deletion' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <DataDeletion />
            </div>
          )}

          {/* TRACK YOUR ORDER VIEW */}
          {currentPage === 'track' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              {currentUser ? (
                <Dashboards
                  currentUser={currentUser}
                  orders={orders}
                  setOrders={setOrders}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  wishlist={wishlist}
                  onToggleWishlist={handleToggleWishlist}
                  onSelectProduct={setSelectedProduct}
                  onAddToCart={handleAddToCart}
                  setCurrentPage={setCurrentPage}
                  deliveryZones={deliveryZones}
                  onUpdateDeliveryZones={setDeliveryZones}
                  currentPage={currentPage}
                  initialSubTab={dashboardSubTab}
                  setAuthModalOpen={setAuthModalOpen}
                  notificationEngine={notificationEngine}
                  onOpenNotifications={handleOpenNotifications}
                />
              ) : (
                <TrackOrder 
                  orders={orders} 
                  setCurrentPage={setCurrentPage} 
                />
              )}
            </div>
          )}

          {/* 404 NOT FOUND VIEW */}
          {currentPage === '404' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <NotFound 
                setCurrentPage={setCurrentPage} 
                onProductSelect={setSelectedProduct} 
                setSelectedCategoryFilter={setSelectedCategoryFilter} 
              />
            </div>
          )}

          {/* BASKET SHOPPING CART */}
          {currentPage === 'cart' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <Cart
                cart={cart}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveFromCart}
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                discountPercent={discountPercent}
                setDiscountPercent={setDiscountPercent}
                setCurrentPage={setCurrentPage}
                onSelectProduct={(prod) => {
                  setSelectedProduct(prod);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}

          {/* SECURED CHECKOUT PROCESS */}
          {currentPage === 'checkout' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <Checkout
                cart={cart}
                discountPercent={discountPercent}
                couponCode={couponCode}
                onOrderSuccess={handleOrderSuccess}
                onBackToCart={() => {
                  const source = sessionStorage.getItem('zoal_checkout_source');
                  const productStr = sessionStorage.getItem('zoal_checkout_product');
                  if (source === 'buy-now' && productStr) {
                    try {
                      const prod = JSON.parse(productStr);
                      setSelectedProduct(prod);
                      setCurrentPage('store');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      return;
                    } catch (e) {
                      console.error("Error restoring checkout product:", e);
                    }
                  }
                  setCurrentPage('cart');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                deliveryZones={deliveryZones}
                currentUser={currentUser}
                onSelectProduct={(prod) => {
                  setSelectedProduct(prod);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}

          {/* SECURED MOYASAR GATEWAY PAYMENT SIMULATION VIEW */}
          {currentPage === 'payment-simulate' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <PaymentSimulation
                notificationEngine={notificationEngine}
                onSuccess={(orderData) => {
                  // Clear the search query parameters so reloading doesn't trap the user
                  window.history.replaceState(null, document.title, window.location.pathname);
                  
                  // Construct beautiful validated complete Order object matching the DB states
                  const completeOrder: Order = {
                    id: orderData.id,
                    date: orderData.date,
                    items: cart.map(item => ({
                      productId: item.product.id,
                      name: item.product.name,
                      price: item.product.price,
                      quantity: item.quantity,
                      selectedOption: item.selectedOption
                    })),
                    subtotal: cart.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0),
                    shipping: 35,
                    discount: 0,
                    tax: parseFloat((cart.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0) * 0.15).toFixed(2)),
                    total: orderData.total,
                    status: 'Processing',
                    customerName: orderData.customerName || 'Valued Customer',
                    email: currentUser?.email || 'customer@zoalgroup.com',
                    phone: currentUser?.phone || '+966 50 000 0000',
                    address: 'Al Hofuf, Saudi Arabia',
                    paymentMethod: 'Mada Card',
                    trackingNumber: `ZLT-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
                  } as any;
                  
                  handleOrderSuccess(completeOrder);
                }}
                onCancel={() => {
                  window.history.replaceState(null, document.title, window.location.pathname);
                  setCurrentPage('checkout');
                }}
              />
            </div>
          )}

          {/* ALL WORKSPACE DASHBOARDS (Customer, Admin, Executive Owner) */}
          {currentPage === 'dashboard' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <Dashboards
                currentUser={currentUser}
                orders={orders}
                setOrders={setOrders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                onSelectProduct={setSelectedProduct}
                onAddToCart={handleAddToCart}
                setCurrentPage={setCurrentPage}
                deliveryZones={deliveryZones}
                onUpdateDeliveryZones={setDeliveryZones}
                onUpdateCurrentUser={setCurrentUser}
                onLogout={handleLogout}
                initialSubTab={dashboardSubTab}
                setAuthModalOpen={setAuthModalOpen}
                supabaseStatus={supabaseStatus}
                fetchSupabaseStatus={fetchSupabaseStatus}
                fetchingStatus={fetchingStatus}
                handleCopySchema={handleCopySchema}
                copiedSchema={copiedSchema}
                handleSyncData={handleSyncData}
                syncingData={syncingData}
                syncResult={syncResult}
                syncError={syncError}
                SupabaseStoragePanel={SupabaseStoragePanel}
                notificationEngine={notificationEngine}
                onOpenNotifications={handleOpenNotifications}
              />
            </div>
          )}

          {currentPage === 'wishlist' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <WishlistPage
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
                onSelectProduct={setSelectedProduct}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}

          {currentPage === 'admin' && (
            <div className="overflow-x-hidden max-w-full min-w-0">
              <AdminDashboard
                currentUser={currentUser}
                orders={orders}
                setOrders={setOrders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onLogout={handleLogout}
                setCurrentPage={setCurrentPage}
                initialTab={adminSubTab}
                notificationEngine={notificationEngine}
                onOpenNotifications={handleOpenNotifications}
              />
            </div>
          )}

          {(currentPage === 'login' || currentPage === 'register') && (
            <div className="py-20 max-w-lg mx-auto px-4 min-h-[70vh] flex items-center justify-center">
              <AuthPage
                initialView={currentPage === 'login' ? 'login' : 'register'}
                onSuccess={async (user, token) => {
                  localStorage.setItem('zoal_auth_token', token);
                  // Verify role and retrieve full profile before routing
                  try {
                    const res = await fetch('/api/auth/session', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    if (res.ok) {
                      const contentType = res.headers.get('content-type');
                      if (contentType && contentType.includes('application/json')) {
                        const data = await res.json();
                        if (data.user) {
                          setCurrentUser(data.user);
                          setDashboardSubTab('overview');
                          if (['owner', 'admin', 'manager'].includes(data.user.role)) {
                            setCurrentPage('admin');
                          } else {
                            setCurrentPage('dashboard');
                          }
                          return;
                        }
                      }
                    }
                  } catch (e) {
                    console.error('Failed to sync profile after login:', e);
                  }

                  // Fallback
                  setCurrentUser(user);
                  setDashboardSubTab('overview');
                  setCurrentPage('dashboard');
                }}
                onCancel={() => setCurrentPage('home')}
                setCurrentPage={setCurrentPage}
                onViewChange={(view) => {
                  if (view === 'register') {
                    setCurrentPage('register');
                  } else if (view === 'login') {
                    setCurrentPage('login');
                  }
                }}
              />
            </div>
          )}

        </>
      )}
      </Suspense>

      {/* BOUTIQUE FOOTER SECTOR */}
      {currentPage !== 'admin' && (
        <Footer setCurrentPage={setCurrentPage} setSelectedCategoryFilter={setSelectedCategoryFilter} />
      )}

      {/* PRIVILEGED LOGIN MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#09090b] border border-white/10 rounded-xl shadow-[0_24px_70px_rgba(0,0,0,0.95)] overflow-hidden max-h-[90vh] flex flex-col">
            {/* Top System Security Gold Line Accent */}
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent z-20"></div>

            {/* Parent Modal Close Button (Fixed at top-right of the Login card) */}
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-50 text-zinc-400 hover:text-[#D4AF37] active:text-[#D4AF37] p-2.5 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 bg-black/40 backdrop-blur-sm sm:bg-transparent"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto w-full p-4 sm:p-8">
              <Suspense fallback={<PremiumLoader />}>
                <AuthPage 
                  isModal={true}
                  hideClose={true}
                  onSuccess={async (user, token) => {
                  localStorage.setItem('zoal_auth_token', token);
                  // Verify role and retrieve full profile before routing
                  try {
                    const res = await fetch('/api/auth/session', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    if (res.ok) {
                      const contentType = res.headers.get('content-type');
                      if (contentType && contentType.includes('application/json')) {
                        const data = await res.json();
                        if (data.user) {
                          setCurrentUser(data.user);
                          setAuthModalOpen(false);
                          setDashboardSubTab('overview');
                          if (['owner', 'admin', 'manager'].includes(data.user.role)) {
                            setCurrentPage('admin');
                          } else {
                            setCurrentPage('dashboard');
                          }
                          return;
                        }
                      }
                    }
                  } catch (e) {
                    console.error('Failed to sync profile after login:', e);
                  }

                  // Fallback
                  setCurrentUser(user);
                  setAuthModalOpen(false);
                  setDashboardSubTab('overview');
                  setCurrentPage('dashboard');
                }}
                onCancel={() => setAuthModalOpen(false)}
                setCurrentPage={setCurrentPage}
                onViewChange={setAuthModalView}
              />
            </Suspense>
          </div>
        </div>
      </div>
      )}

      {/* Global Notification Hub (Single Source of Truth) */}
      <GlobalNotificationRenderer 
        setCurrentPage={setCurrentPage}
        setInitialDashboardTab={setDashboardSubTab}
      />

      {/* Luxury Success Modal & Auto-dismiss Stack */}
      <Suspense fallback={null}>
        <CheckoutSuccessModal
          isOpen={checkoutSuccessModalOpen}
          onClose={handleCloseSuccessModal}
          onContinueShopping={handleContinueShopping}
          onViewOrders={handleViewOrders}
          order={activeSuccessOrder}
        />
      </Suspense>

      {/* Premium Luxury Logout Modal (Refined Boutique Experience) */}
      <Suspense fallback={null}>
        <LogoutModal
          isOpen={logoutModalOpen}
          status={logoutModalStatus}
          onClose={() => setLogoutModalOpen(false)}
          onConfirm={handleConfirmLogout}
          onSuccessRedirect={handleLogoutSuccessRedirect}
        />
      </Suspense>

      <Suspense fallback={null}>
        <EnterpriseNotificationCenter
          isOpen={notificationCenterOpen && !!currentUser}
          onClose={() => setNotificationCenterOpen(false)}
          notifications={filteredNotifications}
          unreadCount={userUnreadCount}
          onMarkAsRead={notificationEngine.markAsRead}
          onMarkAllAsRead={notificationEngine.markAllAsRead}
          onArchive={notificationEngine.archiveNotification}
          onDelete={notificationEngine.deleteNotification}
          onClearAll={notificationEngine.clearAll}
          auditReport={notificationEngine.auditReport}
          soundEnabled={notificationEngine.soundEnabled}
          setSoundEnabled={notificationEngine.setSoundEnabled}
          isOnline={notificationEngine.isOnline}
          connectionStatus={notificationEngine.connectionStatus}
          currentUser={currentUser}
          onNavigate={handleNotificationNavigate}
        />
      </Suspense>

      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>

      {(currentUser as any)?.id === 'dev-preview' && (
        <div className="fixed bottom-6 left-6 z-[100] bg-zinc-950/95 border border-amber-500/30 p-4 rounded-md shadow-2xl backdrop-blur-md max-w-xs text-left text-xs font-sans pointer-events-auto">
          <div className="flex items-center gap-2 text-amber-500 font-bold tracking-wider uppercase text-[9px] mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Development Preview
          </div>
          <div className="text-[11px] font-semibold text-white uppercase tracking-wide">Developer Session Active</div>
          <div className="text-[10px] text-zinc-400 font-mono mt-1">
            Name: <span className="text-white">RKInfinity Developer</span>
          </div>
          <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
            Env: <span className="text-amber-500/80">AI Studio Preview</span>
          </div>
        </div>
      )}

    </div>
  );
}
