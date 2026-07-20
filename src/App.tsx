import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Sparkles, Heart, ShoppingBag, Eye, X, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandingProvider, useBranding } from './components/BrandingContext';
import { Product, CartItem, Order } from './types';
import { SEED_MOCK_ORDERS } from './data';
import { useTranslation } from 'react-i18next';

// Static / High Priority Core Viewport Imports (for zero-shift, immediate initial paint)
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Scrolltelling from './components/Scrolltelling';
import Store from './components/Store';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import { SafeImage, useGlobalProducts } from './imageRegistry';
import CookieConsent from './components/CookieConsent';
import Footer from './components/Footer';
import { formatCurrency } from './utils';
import { supabaseClient } from './lib/supabaseClient';
import CheckoutSuccessModal from './components/CheckoutSuccessModal';
import LogoutModal from './components/LogoutModal';
import ToastContainer, { ToastItem } from './components/ToastContainer';
import SEO from './components/SEO';

// Dynamic / Low Priority Viewport Imports (Code Splitting & Bundle Size Optimization with Robust Retry Logic)
const lazyWithRetry = (importFn: () => Promise<any>) => {
  return lazy(() => 
    importFn().catch((err) => {
      console.warn("Failed to load dynamically imported module, retrying...", err);
      // Retry once after 1 second
      return new Promise((resolve) => setTimeout(resolve, 1000))
        .then(() => importFn())
        .catch((err2) => {
          console.warn("Retrying dynamic module import failed again. Trying one final time in 2 seconds...", err2);
          // Try one final time after 2 seconds
          return new Promise((resolve) => setTimeout(resolve, 2000))
            .then(() => importFn())
            .catch((finalErr) => {
              console.error("Critical: Failed to fetch dynamically imported module after retries.", finalErr);
              // As a last-resort safety valve, reload page to force fetch of new chunks
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
              throw finalErr;
            });
        });
    })
  );
};

const Checkout = lazyWithRetry(() => import('./components/Checkout'));
const Dashboards = lazyWithRetry(() => import('./components/Dashboards'));
const AdminDashboard = lazyWithRetry(() => import('./components/AdminDashboard'));
const AuthPage = lazyWithRetry(() => import('./components/AuthPage'));
const WishlistPage = lazyWithRetry(() => import('./components/WishlistPage'));
const Portfolio = lazyWithRetry(() => import('./components/Portfolio'));
const About = lazyWithRetry(() => import('./components/About'));
const Branches = lazyWithRetry(() => import('./components/Branches'));
const Blog = lazyWithRetry(() => import('./components/Blog'));
const Contact = lazyWithRetry(() => import('./components/Contact'));
const FAQ = lazyWithRetry(() => import('./components/FAQ'));
const PrivacyPolicy = lazyWithRetry(() => import('./components/PrivacyPolicy'));
const TermsAndConditions = lazyWithRetry(() => import('./components/TermsAndConditions'));
const ShippingPolicy = lazyWithRetry(() => import('./components/ShippingPolicy'));
const ReturnRefundPolicy = lazyWithRetry(() => import('./components/ReturnRefundPolicy'));
const CookiePolicy = lazyWithRetry(() => import('./components/CookiePolicy'));
const DataDeletion = lazyWithRetry(() => import('./components/DataDeletion'));
const NotFound = lazyWithRetry(() => import('./components/NotFound'));
const TrackOrder = lazyWithRetry(() => import('./components/TrackOrder'));

// Premium, On-Brand Suspense Loader
const PremiumLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] py-20 space-y-4 animate-fade-in font-sans">
    <div className="w-8 h-8 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
    <span className="text-[9px] tracking-[0.45em] text-[#D4AF37]/85 uppercase font-mono animate-pulse">AL ZOAL VAULT LOADING...</span>
  </div>
);

export default function App() {
  return (
    <BrandingProvider>
      <AppContent />
    </BrandingProvider>
  );
}

function AppContent() {
  const { t } = useTranslation();
  const allProducts = useGlobalProducts();
  const { settings } = useBranding();
  // Navigation states
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Ecommerce state tracking
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('zoal_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set();
          return parsed.filter((o: any) => {
            if (!o || !o.id || seen.has(o.id)) return false;
            seen.add(o.id);
            return true;
          });
        }
      } catch (e) {
        console.error('Failed to restore orders ledger:', e);
      }
    }
    return SEED_MOCK_ORDERS;
  });

  useEffect(() => {
    localStorage.setItem('zoal_orders', JSON.stringify(orders));
  }, [orders]);

  // Success Modal & Toast states
  const [checkoutSuccessModalOpen, setCheckoutSuccessModalOpen] = useState<boolean>(false);
  const [activeSuccessOrder, setActiveSuccessOrder] = useState<Order | null>(null);
  const [orderSuccessToasts, setOrderSuccessToasts] = useState<ToastItem[]>([]);

  // Premium Logout Modal State
  const [logoutModalOpen, setLogoutModalOpen] = useState<boolean>(false);
  const [logoutModalStatus, setLogoutModalStatus] = useState<'confirm' | 'loading' | 'success'>('confirm');

  // Applied modifiers
  const [couponCode, setCouponCode] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Genuine VIP Authentication State Engine
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
    role: string;
    addresses?: any[];
  } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [dashboardSubTab, setDashboardSubTab] = useState<string>('overview');

  // Listen to fallbacks or nested elements triggering the login modal
  useEffect(() => {
    const handleOpenAuth = () => setAuthModalOpen(true);
    window.addEventListener('zoal-open-auth', handleOpenAuth);
    return () => window.removeEventListener('zoal-open-auth', handleOpenAuth);
  }, []);

  // Restore authenticated session on mount and listen to auth state changes
  useEffect(() => {
    // 1. Initial session check
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const token = session.access_token;
        localStorage.setItem('zoal_auth_token', token);
        fetchProfile(token);
      }
    });

    // 2. Set up reactive listener for all auth events
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const token = session.access_token;
        localStorage.setItem('zoal_auth_token', token);
        fetchProfile(token);
      } else {
        localStorage.removeItem('zoal_auth_token');
        sessionStorage.removeItem('zoal_auth_token');
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };

    function fetchProfile(token: string) {
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
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => {
        console.warn('Auto-login session restoration failed:', err.message);
        localStorage.removeItem('zoal_auth_token');
        sessionStorage.removeItem('zoal_auth_token');
        setCurrentUser(null);
      });
    }
  }, []);

  const handleLogout = () => {
    setLogoutModalStatus('confirm');
    setLogoutModalOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutModalStatus('loading');
    try {
      await supabaseClient.auth.signOut();
    } catch (err) {
      console.error('Error signing out from Supabase:', err);
    }
    
    // Clear client side session state
    localStorage.removeItem('zoal_auth_token');
    sessionStorage.removeItem('zoal_auth_token');
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
      default: return '/';
    }
  };

  useEffect(() => {
    const currentPath = getPathFromPage(currentPage);
    if (window.location.pathname !== currentPath) {
      window.history.pushState(null, '', currentPath);
    }
  }, [currentPage]);

  useEffect(() => {
    const handlePathChange = () => {
      const page = getPageFromPath(window.location.pathname);
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

  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');

  // Premium Cart Addition Feedbacks State
  const [lastAddedItem, setLastAddedItem] = useState<{
    product: Product;
    quantity: number;
    option?: string;
    timestamp: number;
  } | null>(null);
  const [showCartNotification, setShowCartNotification] = useState<boolean>(false);
  const [showRecentPreview, setShowRecentPreview] = useState<boolean>(false);

  useEffect(() => {
    if (lastAddedItem) {
      // Toast notification auto-hides after 3 seconds
      const toastTimer = setTimeout(() => {
        setShowCartNotification(false);
      }, 3000);

      // Compact luxury preview auto-hides after 4.5 seconds
      const previewTimer = setTimeout(() => {
        setShowRecentPreview(false);
      }, 4500);

      return () => {
        clearTimeout(toastTimer);
        clearTimeout(previewTimer);
      };
    }
  }, [lastAddedItem]);

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

    // Record addition metadata to trigger visual flows
    setLastAddedItem({
      product,
      quantity: qty,
      option: option || 'Standard',
      timestamp: Date.now()
    });
    // Immediately activate feedback flows
    setShowCartNotification(true);
    setShowRecentPreview(true);
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

  // Luxury Wishlist Toast Notification State
  interface WishlistToast {
    id: string;
    productName: string;
    productImg?: string;
  }
  const [wishlistToasts, setWishlistToasts] = useState<WishlistToast[]>([]);

  const triggerWishlistToast = (productName: string, productImg?: string) => {
    const newId = Date.now().toString() + Math.random().toString();
    setWishlistToasts((prev) => [...prev, { id: newId, productName, productImg }]);
    setTimeout(() => {
      setWishlistToasts((prev) => prev.filter((t) => t.id !== newId));
    }, 4500);
  };

  // Wishlist toggle
  const handleToggleWishlist = (productId: string) => {
    const product = allProducts.find((p) => p.id === productId);
    setWishlist((prevWish) => {
      if (prevWish.includes(productId)) {
        return prevWish.filter((id) => id !== productId);
      }
      if (product) {
        triggerWishlistToast(product.name, product.images[0]);
      }
      return [...prevWish, productId];
    });
  };

  // Order workflow state modifier
  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prevOrders) =>
      prevOrders.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  // Handle successful payments confirmation
  const handleOrderSuccess = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCart([]); // Clear cart
    setDiscountPercent(0);
    setCouponCode('');
    
    // Set success modal states
    setActiveSuccessOrder(newOrder);
    setCheckoutSuccessModalOpen(true);
    setCurrentPage('dashboard'); // Transition to dashboard behind the scenes so closing the modal reveals it
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Persist order to Supabase via backend proxy
    fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newOrder })
    })
    .then(res => res.json())
    .then(data => console.log('Order persistence response:', data))
    .catch(err => console.error('Order persistence error:', err));

    // Trigger full-stack order email confirmation and DB logger
    fetch('/api/orders/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ order: newOrder })
    })
    .then((res) => res.json())
    .then((data) => {
      console.log('Automated order email system response:', data);
    })
    .catch((err) => {
      console.error('Error triggering automated order email system:', err);
    });
  };

  const triggerSuccessToast = () => {
    const id = Date.now().toString() + Math.random().toString();
    const newToast: ToastItem = {
      id,
      message: '✓ Order confirmed successfully.',
      submessage: 'Confirmation email has been sent.'
    };
    setOrderSuccessToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setOrderSuccessToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
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
  const popularHighlights = allProducts.filter((p) => p.popular);

  return (
    <div className="bg-black text-white min-h-screen font-sans selection:bg-gold-pure selection:text-black relative overflow-hidden">
      <SEO currentPage={currentPage} selectedProduct={selectedProduct} />
      
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
      {currentPage !== 'admin' && (
        <Navbar
          currentPage={currentPage}
          setCurrentPage={(page) => {
            setCurrentPage(page);
            setSelectedProduct(null); // Clear selected item
          }}
          cart={cart}
          wishlist={wishlist}
          currentUser={currentUser}
          setAuthModalOpen={setAuthModalOpen}
          selectedCategoryFilter={selectedCategoryFilter}
          setSelectedCategoryFilter={setSelectedCategoryFilter}
          setDashboardSubTab={setDashboardSubTab}
          onLogout={handleLogout}
        />
      )}

      {/* RENDER ACTIVE SCREEN CONTROLLER */}
      <Suspense fallback={<PremiumLoader />}>
        {selectedProduct ? (
        <ProductDetail
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          wishlist={wishlist}
          setCurrentPage={setCurrentPage}
          onProductSelect={setSelectedProduct}
        />
      ) : (
        <>
          {/* HOME VIEW */}
          {currentPage === 'home' && (
            <div className="space-y-0">
              
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
              <section className="bg-black py-12 sm:py-24 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-8 sm:mb-16"
                  >
                    <h2 className="text-2xl sm:text-4xl font-bold tracking-[0.25em] text-white font-display uppercase">
                      {t('app.featured_collection')}
                    </h2>
                    <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-4" />
                    <div className="relative mt-4 flex items-center justify-center w-full">
                      <p className="text-zinc-500 text-xs tracking-widest uppercase">{t('app.selected_favorites')}</p>
                      <button 
                        onClick={() => {
                          setCurrentPage('store');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="absolute right-0 text-[#D4AF37] hover:text-white transition-colors duration-300 text-xs tracking-widest uppercase font-semibold hidden sm:block rtl:right-auto rtl:left-0"
                      >
                        {t('app.view_all')}
                      </button>
                    </div>
                    {/* Mobile only view all button below text for smaller screens */}
                    <button 
                      onClick={() => {
                        setCurrentPage('store');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[#D4AF37] hover:text-white transition-colors duration-300 text-[10px] tracking-widest uppercase font-semibold mt-4 sm:hidden inline-block"
                    >
                      {t('app.view_all')}
                    </button>
                  </motion.div>

                  <motion.div 
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-10px" }}
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1
                        }
                      }
                    }}
                    className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-8"
                  >
                    {popularHighlights.slice(0, 3).map((item) => (
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 40, rotateX: 3 },
                          show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                        }}
                        key={item.id}
                        onClick={() => {
                          setSelectedProduct(item);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="group bg-[#050505] border border-white/5 hover:border-gold-pure/25 rounded-sm overflow-hidden flex flex-col justify-between h-full hover:shadow-[0_4px_25px_rgba(212,175,55,0.06)] cursor-pointer"
                      >
                        <div className="relative aspect-square bg-black overflow-hidden select-none">
                          <SafeImage
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 duration-500"
                            containerClassName="w-full h-full overflow-hidden relative"
                          />
                          <div className="hidden sm:block absolute top-3 left-3 px-2 py-0.5 bg-black/80 text-[7.5px] uppercase tracking-widest text-[#D4AF37] rounded-full border border-gold-pure/20 z-10">
                            {item.category.replace('_', ' ')}
                          </div>
                        </div>

                        <div className="p-2 sm:p-5 flex-grow flex flex-col justify-between">
                          <div>
                            <h3 className="text-white text-[9px] sm:text-xs font-display uppercase tracking-widest font-semibold group-hover:text-gold-pure duration-300 line-clamp-2">
                              {item.name}
                            </h3>
                            <p className="hidden sm:block text-zinc-500 text-[10.5px] mt-1.5 leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-start sm:justify-between mt-2 sm:mt-4 sm:border-t sm:border-white/5 sm:pt-4 text-xs">
                            <span className="text-gold-pure font-mono font-bold tracking-wider text-[10px] sm:text-xs">{formatCurrency(item.price)} <span className="text-[8px] sm:text-[10px]">{t('app.sar')}</span></span>
                            <span className="hidden sm:flex text-zinc-400 group-hover:translate-x-1 duration-300 items-center gap-1 font-display uppercase text-[9px] tracking-widest rtl:flex-row-reverse rtl:group-hover:-translate-x-1">
                              {t('app.examine')} <ArrowUpRight className="w-3.5 h-3.5 text-gold-pure rtl:rotate-90" />
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
          {currentPage === 'portfolio' && <Portfolio />}

          {/* ABOUT HERITAGE VIEW */}
          {currentPage === 'about' && <About />}

          {/* GEOGRAPHIC BRANCHES VIEW */}
          {currentPage === 'branches' && <Branches />}

          {/* EDITORIAL BLOG VIEW */}
          {currentPage === 'blog' && <Blog />}

          {/* BESPOKE INQUIRIES VIEW */}
          {currentPage === 'contact' && <Contact />}

          {/* FREQUENTLY ASKED QUESTIONS VIEW */}
          {currentPage === 'faq' && <FAQ setCurrentPage={setCurrentPage} />}

           {/* PRIVACY POLICY VIEW */}
          {currentPage === 'privacy' && <PrivacyPolicy />}

          {/* TERMS & CONDITIONS VIEW */}
          {currentPage === 'terms' && <TermsAndConditions />}

          {/* SHIPPING POLICY VIEW */}
          {currentPage === 'shipping' && <ShippingPolicy />}

          {/* RETURN & REFUND POLICY VIEW */}
          {currentPage === 'returns' && <ReturnRefundPolicy />}

          {/* COOKIE POLICY VIEW */}
          {currentPage === 'cookies' && <CookiePolicy />}

          {/* USER DATA DELETION POLICY VIEW */}
          {currentPage === 'deletion' && <DataDeletion />}

          {/* TRACK YOUR ORDER VIEW */}
          {currentPage === 'track' && (
            currentUser ? (
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
              />
            ) : (
              <TrackOrder 
                orders={orders} 
                setCurrentPage={setCurrentPage} 
              />
            )
          )}

          {/* 404 NOT FOUND VIEW */}
          {currentPage === '404' && (
            <NotFound 
              setCurrentPage={setCurrentPage} 
              onProductSelect={setSelectedProduct} 
              setSelectedCategoryFilter={setSelectedCategoryFilter} 
            />
          )}

          {/* BASKET SHOPPING CART */}
          {currentPage === 'cart' && (
            <Cart
              cart={cart}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveFromCart}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              discountPercent={discountPercent}
              setDiscountPercent={setDiscountPercent}
              setCurrentPage={setCurrentPage}
            />
          )}

          {/* SECURED CHECKOUT PROCESS */}
          {currentPage === 'checkout' && (
            <Checkout
              cart={cart}
              discountPercent={discountPercent}
              couponCode={couponCode}
              onOrderSuccess={handleOrderSuccess}
              onBackToCart={() => setCurrentPage('cart')}
              deliveryZones={deliveryZones}
              currentUser={currentUser}
            />
          )}

          {/* ALL WORKSPACE DASHBOARDS (Patron, Admin, Executive Owner) */}
          {currentPage === 'dashboard' && (
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
            />
          )}

          {currentPage === 'wishlist' && (
            <WishlistPage
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
              onSelectProduct={setSelectedProduct}
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === 'admin' && (
            <AdminDashboard
              currentUser={currentUser}
              orders={orders}
              setOrders={setOrders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onLogout={handleLogout}
              setCurrentPage={setCurrentPage}
            />
          )}

        </>
      )}
      </Suspense>

      {/* CORPORATE FOOTER SECTOR */}
      {currentPage !== 'admin' && (
        <Footer setCurrentPage={setCurrentPage} setSelectedCategoryFilter={setSelectedCategoryFilter} />
      )}

      {/* PRIVILEGED LOGIN MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative bg-zinc-950 border border-white/5 max-w-lg w-full rounded-sm p-1 sm:p-2 shrink-0 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-[#D4AF37] p-1.5 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <Suspense fallback={<PremiumLoader />}>
              <AuthPage 
                onSuccess={(user, token) => {
                  setCurrentUser(user);
                  localStorage.setItem('zoal_auth_token', token);
                  setAuthModalOpen(false);
                  setDashboardSubTab('overview');
                  setCurrentPage('dashboard');
                }}
                onCancel={() => setAuthModalOpen(false)}
                setCurrentPage={setCurrentPage}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Luxury Wishlist Toast Notification Stack */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {wishlistToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-black/95 border border-[#D4AF37]/25 text-white p-4 rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.1)] flex items-center justify-between gap-4 pointer-events-auto select-none"
            >
              <div className="flex items-center gap-3">
                {toast.productImg && (
                  <div className="relative w-11 h-11 rounded-sm overflow-hidden border border-white/10 flex-shrink-0 bg-neutral-900">
                    <SafeImage src={toast.productImg} alt={toast.productName} className="w-full h-full object-cover" containerClassName="w-full h-full relative" />
                  </div>
                )}
                <div className="space-y-0.5 text-left rtl:text-right">
                  <div className="flex items-center gap-1.5 text-[#D4AF37] text-[8.5px] tracking-[0.35em] uppercase font-display font-bold">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    {t('app.toast.added')}
                  </div>
                  <h4 className="text-[11px] font-semibold text-white tracking-wide uppercase line-clamp-1 max-w-[200px]">
                    {toast.productName}
                  </h4>
                  <p className="text-[8px] text-zinc-500 tracking-wider">{t('app.toast.saved')}</p>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => setWishlistToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="p-1 px-2 border border-white/5 hover:border-[#D4AF37]/40 rounded-sm text-zinc-400 hover:text-[#D4AF37] transition-all text-[8px] tracking-widest font-mono uppercase cursor-pointer"
              >
                {t('app.toast.close')}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Success Toast Notification (✓ Added to Shopping Bag) */}
      <AnimatePresence>
        {showCartNotification && (
          <motion.div
            id="premium-cart-toast"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed md:top-6 bottom-6 right-4 left-4 md:left-auto md:right-6 md:w-[350px] z-[90] bg-black/95 border border-[#D4AF37]/45 text-white px-5 py-3.5 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(212,175,55,0.18)] flex items-center justify-between gap-3 select-none pointer-events-auto"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-bold text-xs shrink-0 select-none">
                ✓
              </div>
              <span className="text-[10.5px] font-display font-semibold uppercase tracking-[0.25em] text-white">
                {t('app.toast.added_to_cart', { defaultValue: 'Added to Shopping Bag' })}
              </span>
            </div>
            
            <button
              onClick={() => setShowCartNotification(false)}
              className="text-[9px] font-mono text-[#D4AF37] hover:text-white tracking-widest uppercase cursor-pointer ml-2 border-l border-white/10 pl-3 shrink-0"
            >
              {t('app.toast.close', { defaultValue: 'CLOSE' })}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Luxury Preview Card (Recently Added details) */}
      <AnimatePresence>
        {showRecentPreview && lastAddedItem && (
          <motion.div
            id="premium-recently-added-preview"
            initial={{ opacity: 0, x: 50, y: 15 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed md:top-24 md:right-6 bottom-24 left-4 right-4 md:left-auto md:w-[360px] z-[85] bg-zinc-950/95 border border-[#D4AF37]/35 text-white p-4.5 rounded-sm shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_25px_rgba(212,175,55,0.08)] backdrop-blur-md select-none pointer-events-auto"
          >
            {/* Elegant Double Border Accent */}
            <div className="absolute inset-1 pointer-events-none border border-[#D4AF37]/10 rounded-xs"></div>
            {/* Top gold line */}
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
            
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-[8.5px] tracking-[0.45em] text-[#D4AF37] uppercase font-display font-medium">
                {t('app.preview.recently_added', { defaultValue: 'Recently Added' })}
              </span>
              <button 
                onClick={() => setShowRecentPreview(false)}
                className="text-zinc-500 hover:text-white transition-colors duration-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="relative w-15 h-15 rounded-sm overflow-hidden border border-white/10 flex-shrink-0 bg-neutral-900 shadow-md">
                <SafeImage src={lastAddedItem.product.images[0]} alt={lastAddedItem.product.name} className="w-full h-full object-cover" containerClassName="w-full h-full relative" />
                <div className="absolute inset-0 border border-[#D4AF37]/20 pointer-events-none"></div>
              </div>
              
              <div className="space-y-1 text-left flex-grow min-w-0">
                <h4 className="text-[11px] font-semibold text-white tracking-[0.08em] uppercase truncate font-display">
                  {lastAddedItem.product.name}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-gold-pure text-[11.5px] font-mono font-bold tracking-wider">
                    {formatCurrency(lastAddedItem.product.price)} {t('app.sar')}
                  </span>
                  {lastAddedItem.option && lastAddedItem.option !== 'Standard' && (
                    <span className="text-[7.5px] px-1.5 py-0.5 bg-white/5 border border-white/5 text-zinc-400 font-display uppercase tracking-widest rounded-xs truncate max-w-[120px]">
                      {lastAddedItem.option}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Premium Interactive Action Buttons (Optional Actions) */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-white/5 relative z-10">
              <button
                id="cart-preview-view-bag-btn"
                onClick={() => {
                  setCurrentPage('cart');
                  setShowRecentPreview(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="py-2.5 px-3 border border-[#D4AF37]/45 hover:border-[#D4AF37] text-black bg-gradient-to-r from-gold-dark to-gold-pure hover:from-[#FFF] hover:to-[#FFF] transition-all duration-350 text-[9.5px] tracking-widest font-display font-bold uppercase rounded-xs cursor-pointer text-center"
              >
                {t('app.preview.view_bag', { defaultValue: 'View Shopping Bag' })}
              </button>
              <button
                id="cart-preview-continue-btn"
                onClick={() => setShowRecentPreview(false)}
                className="py-2.5 px-3 border border-white/10 hover:border-white/30 bg-[#050505] hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all duration-300 text-[9.5px] tracking-widest font-display font-medium uppercase rounded-xs cursor-pointer text-center"
              >
                {t('app.preview.continue', { defaultValue: 'Continue Shopping' })}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Luxury Success Modal & Auto-dismiss Stack */}
      <CheckoutSuccessModal
        isOpen={checkoutSuccessModalOpen}
        onClose={handleCloseSuccessModal}
        onContinueShopping={handleContinueShopping}
        onViewOrders={handleViewOrders}
        order={activeSuccessOrder}
      />

      {/* Premium Luxury Logout Modal (Refined Enterprise Experience) */}
      <LogoutModal
        isOpen={logoutModalOpen}
        status={logoutModalStatus}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        onSuccessRedirect={handleLogoutSuccessRedirect}
      />

      <ToastContainer
        toasts={orderSuccessToasts}
        onDismiss={(id) => setOrderSuccessToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      <CookieConsent />

    </div>
  );
}
