import React, { useState } from 'react';
import { Sparkles, Heart, ShoppingBag, Eye, X, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Order } from './types';
import { PRODUCTS, SEED_MOCK_ORDERS } from './data';

// Component Imports
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Scrolltelling from './components/Scrolltelling';
import Store from './components/Store';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Dashboards from './components/Dashboards';
import Portfolio from './components/Portfolio';
import About from './components/About';
import Branches from './components/Branches';
import Blog from './components/Blog';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
  // Navigation states
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Ecommerce state tracking
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>(SEED_MOCK_ORDERS);

  // Applied modifiers
  const [couponCode, setCouponCode] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // VIP Authentication simulation
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
  } | null>({
    name: 'Abdullah Al-Saudi',
    email: 'abdullah@example.sa',
    phone: '+966 50 123 4567',
    address: 'Al Shati District, Dammam, KSA',
  });
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
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
    const product = PRODUCTS.find((p) => p.id === productId);
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
    setCurrentPage('dashboard'); // Route straight into customer's tracking table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Simulated login handling
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName.trim() || !authEmail.trim()) return;
    setCurrentUser({
      name: authName.trim(),
      email: authEmail.trim(),
      phone: '+966 50 833 9001',
      address: 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Dammam, Saudi Arabia.'
    });
    setAuthModalOpen(false);
  };

  // Gather popular catalog highlights
  const popularHighlights = PRODUCTS.filter((p) => p.popular);

  return (
    <div className="bg-black text-white min-h-screen font-sans selection:bg-gold-pure selection:text-black relative overflow-hidden">
      
      {/* Ambience Soft Glows from Artistic Flair */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-[#D4AF37] opacity-5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute top-[40%] right-[-150px] w-[500px] h-[500px] bg-[#D4AF37] opacity-[0.03] blur-[150px] rounded-full pointer-events-none z-0"></div>

      {/* Side Vertical Label for Luxury Editorial Aesthetic */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center space-y-8 z-30 pointer-events-none">
        <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent"></div>
        <span className="vertical-text rotate-180 text-[8.5px] tracking-[0.55em] text-[#D4AF37] uppercase select-none font-display font-medium" style={{ writingMode: 'vertical-rl' }}>Curated Excellence</span>
        <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent"></div>
      </div>

      {/* Dior Floating Translucent Header */}
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
      />

      {/* RENDER ACTIVE SCREEN CONTROLLER */}
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
              <Scrolltelling />

              {/* FEATURED POPULAR COLLECTIONS SECTION */}
              <section className="bg-black py-24 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-16"
                  >
                    <span className="text-[10px] tracking-[0.40em] text-[#D4AF37] uppercase font-display block mb-3">
                      Lustrous Curations
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-bold tracking-[0.25em] text-white font-display uppercase">
                      Featured Series
                    </h2>
                    <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-4" />
                    <p className="text-zinc-500 text-xs tracking-widest uppercase mt-4">Selected high-demand releases across Dammam branches</p>
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
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
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
                        <div className="relative aspect-square bg-black overflow-hidden">
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 duration-500"
                          />
                          <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 text-[7.5px] uppercase tracking-widest text-[#D4AF37] rounded-full border border-gold-pure/20">
                            {item.category.replace('_', ' ')}
                          </div>
                        </div>

                        <div className="p-5 flex-grow flex flex-col justify-between">
                          <div>
                            <h3 className="text-white text-xs font-display uppercase tracking-widest font-semibold group-hover:text-gold-pure duration-300">
                              {item.name}
                            </h3>
                            <p className="text-zinc-500 text-[10.5px] mt-1.5 leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4 text-xs">
                            <span className="text-gold-pure font-mono font-bold tracking-wider">{item.price} SAR</span>
                            <span className="text-zinc-400 group-hover:translate-x-1 duration-300 flex items-center gap-1 font-display uppercase text-[9px] tracking-widest">
                              Examine <ArrowUpRight className="w-3.5 h-3.5 text-gold-pure" />
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
            />
          )}

          {/* ALL WORKSPACE DASHBOARDS (Patron, Admin, Executive Owner) */}
          {currentPage === 'dashboard' && (
            <Dashboards
              currentUser={currentUser}
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={setSelectedProduct}
              onAddToCart={handleAddToCart}
            />
          )}

          {currentPage === 'admin' && (
            <Dashboards
              currentUser={currentUser}
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onSelectProduct={setSelectedProduct}
              onAddToCart={handleAddToCart}
            />
          )}

        </>
      )}

      {/* CORPORATE FOOTER SECTOR */}
      <Footer setCurrentPage={setCurrentPage} setSelectedCategoryFilter={setSelectedCategoryFilter} />

      {/* PRIVILEGED LOGIN MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative bg-zinc-950 border border-white/10 max-w-sm w-full rounded-sm p-6 sm:p-8 shrink-0">
            
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-[#D4AF37] p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="text-center pb-3">
                <Sparkles className="w-8 h-8 text-gold-pure mx-auto mb-2 animate-pulse" />
                <h3 className="text-white text-sm font-display uppercase tracking-widest font-semibold">VIP Authentication Login</h3>
                <p className="text-zinc-500 text-[10px] mt-1 font-sans">Simulate entering credentials to manage orders, track delivery points, and save catalogs.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">Customer Name:</label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Abdullah S. Al-Ghamdi"
                  className="w-full bg-black border border-white/5 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">Email Coordinates:</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="abdullah.s@saudi.sa"
                  className="w-full bg-black border border-white/5 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-gold-dark to-gold-pure text-black font-display font-semibold uppercase tracking-widest text-[9.5px] rounded-xs transition-colors cursor-pointer"
              >
                Log In VIP Portal
              </button>
            </form>

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
                    <img src={toast.productImg} alt={toast.productName} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="space-y-0.5 text-left">
                  <div className="flex items-center gap-1.5 text-[#D4AF37] text-[8.5px] tracking-[0.35em] uppercase font-display font-bold">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    Added to Collection
                  </div>
                  <h4 className="text-[11px] font-semibold text-white tracking-wide uppercase line-clamp-1 max-w-[200px]">
                    {toast.productName}
                  </h4>
                  <p className="text-[8px] text-zinc-500 tracking-wider">Saved securely to private client lobby</p>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => setWishlistToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="p-1 px-2 border border-white/5 hover:border-[#D4AF37]/40 rounded-sm text-zinc-400 hover:text-[#D4AF37] transition-all text-[8px] tracking-widest font-mono uppercase cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
