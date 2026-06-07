import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Heart, ShoppingBag, Eye, X, ArrowUpDown, Sparkles } from 'lucide-react';
import { Product, BusinessCategory } from '../types';
import { PRODUCTS } from '../data';
import ScrollZoomImage from './ScrollZoomImage';
import { motion } from 'motion/react';

interface StoreProps {
  onProductSelect: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number, option?: string) => void;
  onToggleWishlist: (productId: string) => void;
  wishlist: string[];
  initialCategoryFilter?: string;
}

export default function Store({
  onProductSelect,
  onAddToCart,
  onToggleWishlist,
  wishlist,
  initialCategoryFilter = 'all'
}: StoreProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(initialCategoryFilter);
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'rating'>('default');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');

  const categories = [
    { id: 'all', name: 'ALL COLLECTIONS' },
    { id: 'coffee', name: 'ZOAL COFFEE COOPERATIVE' },
    { id: 'bakery', name: 'SUDAN BAKERY & SWEETS' },
    { id: 'market', name: 'SUDAN MARKET & GROCERY' },
    { id: 'fashion', name: 'SUDAN FASHION & TEXTILES' },
    { id: 'pots', name: 'POTS & HOUSEHOLD' },
  ];

  // Sync category filter if received as a prop
  React.useEffect(() => {
    if (initialCategoryFilter) {
      setActiveCategory(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  // Compute filtered & sorted product list
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.story.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory = activeCategory === 'all' || product.category === activeCategory;

      return matchSearch && matchCategory;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // Default sorting
    });
  }, [searchTerm, activeCategory, sortBy]);

  // Determine standard configuration options per category
  const getProductOptions = (category: BusinessCategory) => {
    switch (category) {
      case 'coffee': return ['Whole Beans', 'Infused Ground', 'Fine Roasted Espresso'];
      case 'bakery': return ['Fresh Baked Daily Lot', 'Sealed Presentation Pack'];
      case 'market': return ['Standard Burlap Bag', 'Hermetically Sealed Tin (+25 SAR)'];
      case 'fashion': return ['Standard Fit drape (4.5m)', 'Custom Atelier Hand tailoring (+350 SAR)'];
      case 'pots': return ['Natural Clay Ochre finish', 'Waterproof High-Gloss Glaze (+40 SAR)'];
      default: return ['Standard Luxury Pack'];
    }
  };

  const handleQuickViewOpen = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const opts = getProductOptions(product.category);
    setSelectedOption(opts[0]);
    setQuickViewProduct(product);
  };

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20">
      
      {/* Decorative Gold Header Aura */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[300px] gold-glow-orb opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page title area */}
        <div className="text-center mb-12">
          <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-3">
            Atelier Curations
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-[0.2em] uppercase font-display text-white">
            The Private Catalog
          </h1>
          <p className="text-zinc-500 text-xs tracking-wider uppercase mt-4 max-w-xl mx-auto leading-relaxed">
            Meticulously processed items shipped in hermetic, temperature-regulated containers directly from our Eastern Province headquarters.
          </p>
        </div>

        {/* Filter bars / Search tools */}
        <div className="bg-glass border border-white/5 rounded-sm p-4 sm:p-6 mb-10 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full lg:max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search coffee origin, tailored sizes, ingredients..."
                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/5 rounded-sm text-sm placeholder-zinc-500 focus:outline-none focus:border-gold-pure/40 text-white transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sorting Paradigms & Filters info */}
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <span className="text-[10px] tracking-widest text-zinc-500 uppercase hidden sm:inline">
                {filteredProducts.length} Premium results found
              </span>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <SlidersHorizontal className="w-4 h-4 text-gold-pure/80" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-black border border-white/5 rounded-sm text-xs text-zinc-400 py-2 px-3 focus:outline-none focus:border-gold-pure/40"
                >
                  <option value="default">Default Royal Sequence</option>
                  <option value="price-low">Price: Louder to Soft (Low to High)</option>
                  <option value="price-high">Price: Sovereign Premium (High to Low)</option>
                  <option value="rating">Sovereign Rating (High Customer Votes)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Subcategory Pill Selectors */}
          <div className="flex items-center overflow-x-auto py-2 space-x-2 scrollbar-none border-t border-white/5 pt-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  if (cat.id !== 'all') {
                    // Reset search if changing tabs
                    setSearchTerm('');
                  }
                }}
                className={`py-2 px-4 whitespace-nowrap rounded-sm text-[10px] uppercase font-display tracking-widest transition-all duration-300 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-gold-pure text-black font-semibold shadow-[0_0_10px_rgba(212,175,55,0.25)]'
                    : 'bg-zinc-950/40 text-zinc-500 hover:text-white border border-white/5 hover:border-white/10'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

        </div>

        {/* Dynamic products list grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/5 rounded-sm p-8 bg-zinc-950/20">
            <SlidersHorizontal className="w-10 h-10 text-gold-pure/40 mx-auto mb-4 animate-bounce" />
            <span className="font-display text-sm tracking-widest uppercase text-white block mb-2">No Matching Custom Curations</span>
            <p className="text-zinc-500 text-xs max-w-sm mx-auto">
              Please clear your custom filters or type alternative descriptors to matching our tailored inventory records.
            </p>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10px" }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {filteredProducts.map((product) => {
              const isWishlisted = wishlist.includes(product.id);
              return (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 50, rotateX: 3 },
                    show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  key={product.id}
                  onClick={() => onProductSelect(product)}
                  className="group relative bg-[#060606] border border-white/5 hover:border-gold-pure/30 rounded-sm overflow-hidden transition-all duration-500 flex flex-col justify-between h-full hover:shadow-[0_10px_30px_rgba(212,175,55,0.05)] cursor-pointer"
                >
                  
                  {/* Image Platform with overlays */}
                  <div className="relative aspect-square overflow-hidden bg-zinc-950">
                    <ScrollZoomImage
                      src={product.images[0]}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:opacity-85"
                      containerClassName="w-full h-full overflow-hidden relative"
                    />

                    {/* Left corner Category Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-xs text-[7.5px] uppercase tracking-widest text-gold-light">
                        {product.category.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Popular Star Tag */}
                    {product.popular && (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-gold-dark to-gold-pure rounded-xs text-[7.5px] uppercase tracking-widest text-black font-bold font-display">
                        <Sparkles className="w-2.5 h-2.5" />
                        Popular
                      </div>
                    )}

                    {/* Smooth overlay action panels on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3 z-20">
                      
                      {/* Wishlist Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(product.id);
                        }}
                        className={`p-3 rounded-full border transition-all duration-300 ${
                          isWishlisted
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'bg-black/80 border-white/10 text-white hover:bg-gold-pure hover:text-black'
                        }`}
                        title="Add to Royal Wishlist"
                      >
                        <Heart className="w-4 h-4 fill-current Unicode" />
                      </button>

                      {/* Instant Add to Cart */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const defaultOpt = getProductOptions(product.category)[0];
                          onAddToCart(product, 1, defaultOpt);
                        }}
                        className="p-3 rounded-full bg-white text-black hover:bg-gold-pure hover:text-black transition-all duration-300"
                        title="Instant Cart Deployment"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>

                      {/* Quick View Button */}
                      <button
                        onClick={(e) => handleQuickViewOpen(product, e)}
                        className="p-3 rounded-full bg-black/80 border border-white/10 text-white hover:bg-gold-pure hover:text-black transition-all duration-300"
                        title="Examine Specs Quick View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                    </div>

                  </div>

                  {/* Text descriptions */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-white text-xs font-display uppercase tracking-widest font-semibold group-hover:text-gold-pure duration-300">
                        {product.name}
                      </h3>
                      <p className="text-zinc-500 text-[10.5px] font-sans mt-1 leading-relaxed line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                      <span className="text-sm font-sans font-medium tracking-widest text-gold-pure">
                        {product.price} SAR
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-zinc-400 font-mono">★ {product.rating}</span>
                      </div>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </motion.div>
        )}

      </div>

      {/* QUICK VIEW INTEGRATION DRAWERS / MODALS */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative bg-zinc-950 border border-white/10 max-w-2xl w-full rounded-sm overflow-hidden p-6 sm:p-8 shrink-0">
            
            {/* Close Cross */}
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-gold-pure transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Image Box */}
              <div className="aspect-square rounded-sm overflow-hidden bg-black border border-white/5 h-[260px]">
                <img
                  src={quickViewProduct.images[0]}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Information Side */}
              <div className="space-y-4">
                <div>
                  <span className="text-[8px] uppercase tracking-widest text-gold-pure font-display px-2 py-0.5 border border-gold-pure/20 rounded-full bg-gold-pure/5">
                    {quickViewProduct.category.replace('_', ' ')}
                  </span>
                  <h3 className="text-white text-base sm:text-lg font-display uppercase tracking-widest font-semibold mt-2">
                    {quickViewProduct.name}
                  </h3>
                  <p className="text-gold-pure font-mono text-xs tracking-wider mt-1">
                    {quickViewProduct.price} SAR
                  </p>
                </div>

                <p className="text-zinc-400 text-[10.5px] leading-relaxed">
                  {quickViewProduct.description}
                </p>

                {/* Option configurations depending on product type */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest">Select Premium Setup:</label>
                  <select
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="w-full bg-black border border-white/5 text-zinc-300 py-2 px-3 text-xs focus:outline-none focus:border-gold-pure/40"
                  >
                    {getProductOptions(quickViewProduct.category).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Confirm actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      onAddToCart(quickViewProduct, 1, selectedOption);
                      setQuickViewProduct(null);
                    }}
                    className="flex-grow py-2.5 bg-gradient-to-r from-gold-dark to-gold-pure text-black font-display font-semibold uppercase tracking-widest text-[9.5px] rounded-xs transition-transform hover:scale-[1.01] cursor-pointer"
                  >
                    Add Custom Setup to Cart
                  </button>
                  <button
                    onClick={() => {
                      onProductSelect(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="px-4 py-2.5 border border-white/10 hover:border-gold-pure/30 text-white rounded-xs text-[9.5px] uppercase font-display tracking-widest cursor-pointer"
                  >
                    Full Specs
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
