import React, { useState, useMemo } from 'react';
import { ShoppingBag, ArrowLeft, Heart, MessageSquare, Shield, Clock, Award, Star, ThumbsUp, Send } from 'lucide-react';
import { Product, Review, BusinessCategory } from '../types';
import ScrollZoomImage from './ScrollZoomImage';
import { useTranslation } from 'react-i18next';
import { SafeImage, getFallbackImage, useGlobalProducts } from '../imageRegistry';
import { formatCurrency } from '../utils';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, option?: string) => void;
  onToggleWishlist: (productId: string) => void;
  wishlist: string[];
  setCurrentPage: (page: string) => void;
  onProductSelect: (p: Product) => void;
}

export default function ProductDetail({
  product,
  onBack,
  onAddToCart,
  onToggleWishlist,
  wishlist,
  setCurrentPage,
  onProductSelect
}: ProductDetailProps) {
  const { t, i18n } = useTranslation();
  const allProducts = useGlobalProducts();
  const [activeImg, setActiveImg] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState('');
  const [zoomStyle, setZoomStyle] = useState({ display: 'none', backgroundPosition: '0% 0%' });

  // Premium button state sequence: 'idle' | 'adding' | 'success'
  const [buttonState, setButtonState] = useState<'idle' | 'adding' | 'success'>('idle');

  // Reviews submission forms
  const [newReviewer, setNewReviewer] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [localReviews, setLocalReviews] = useState<Review[]>(product.reviews);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const isWishlisted = wishlist.includes(product.id);

  // Derive feature highlights based on category
  const productFeatures = useMemo(() => {
    switch (product.category) {
      case 'coffee': return ['Premium Arabica', 'Artisan Roasted', 'Rich Flavor Profile', 'Freshly Ground'];
      case 'bakery': return ['Fresh Ingredients', 'Traditional Recipe', 'Baked Daily', 'Preservative Free'];
      case 'market': return ['Authentic Sourcing', 'Premium Quality', 'Natural Ingredients', 'Heritage Selection'];
      case 'fashion': return ['Luxury Fabrics', 'Exquisite Details', 'Elegant Drape', 'Premium Stitching'];
      case 'thobes': return ['Premium Materials', 'Tailored Fit', 'Traditional Styling', 'Breathable Fabric'];
      default: return ['Premium Quality', 'Authentic Design', 'Luxury Finish', 'Handcrafted Details'];
    }
  }, [product.category]);

  // Setup options
  const productOptions = useMemo(() => {
    switch (product.category) {
      case 'coffee': return ['Whole Beans', 'Infused Ground', 'Fine Roasted Espresso'];
      case 'bakery': return ['Fresh Baked Daily Lot', 'Sealed Presentation Pack'];
      case 'market': return ['Standard Burlap Bag', 'Hermetically Sealed Tin (+0.00 SAR)'];
      case 'fashion': return ['Standard Fit drape (4.5m)', 'Premium Presentation Box (+0.00 SAR)'];
      case 'thobes': return ['Standard Fit', 'Tailored Fit (+0.00 SAR)'];
      default: return ['Standard Luxury Pack'];
    }
  }, [product.category]);

  React.useEffect(() => {
    setSelectedOption(productOptions[0]);
    setActiveImg(product.images[0]);
  }, [product, productOptions]);

  // Compute related recommendations
  const relatedProducts = useMemo(() => {
    return allProducts.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
  }, [allProducts, product.category, product.id]);

  // Handle image mouse movement for luxurious zoom magnifier
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none', backgroundPosition: '0% 0%' });
  };

  // Submit review locally
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewer.trim() || !newComment.trim()) return;

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      reviewerName: newReviewer.trim(),
      rating: newRating,
      date: new Date().toISOString().substring(0, 10),
      comment: newComment.trim()
    };

    setLocalReviews([newRev, ...localReviews]);
    setNewReviewer('');
    setNewComment('');
    setNewRating(5);
  };

  // Build high-end pre-compiled WhatsApp text order
  const handleWhatsAppOrder = () => {
    const text = `السلام عليكم ZOAL Boutique. I am interested in placing an exclusive purchase order for columns:
- Product: ${product.name}
- Configuration: ${selectedOption}
- Price: ${formatCurrency(product.price)} SAR
- Ordered Quantity: ${quantity}
Please confirm availability at Al Shati district, Dammam flags. Thank you.`;
    
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=+966567699315&text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleBuyNow = () => {
    onAddToCart(product, quantity, selectedOption);
    setCurrentPage('cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-black text-white min-h-screen pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation line back */}
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 rtl:space-x-reverse text-xs uppercase tracking-widest text-zinc-500 hover:text-gold-pure transition-colors duration-300 mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t('product_detail.back')}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-start">
          
          {/* Gallery with Zoom (columns 1 to 6) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Main Visual box */}
            <div
              className={`relative bg-[#050505] border border-white/5 rounded-sm overflow-hidden cursor-crosshair group h-auto sm:max-h-[600px] ${
                product.category === 'market' ? 'aspect-[16/9]' : 'aspect-square sm:aspect-[4/5]'
              }`}
              onMouseMove={product.category === 'market' ? undefined : handleMouseMove}
              onMouseLeave={product.category === 'market' ? undefined : handleMouseLeave}
            >
              <SafeImage
                src={activeImg}
                alt={product.category === 'thobes' ? "ZOAL THOBES & MEN'S WEAR" : product.name}
                className={`w-full h-full ${
                  product.category === 'market'
                    ? 'object-contain'
                    : 'object-cover transition-transform duration-700 ease-out group-hover:scale-105'
                }`}
                category={product.category}
              />

              {/* Dynamic magnifying layout view */}
              {product.category !== 'market' && (
                <div
                  className="absolute inset-0 pointer-events-none border border-gold-pure/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    ...zoomStyle,
                    backgroundImage: `url(${getFallbackImage(activeImg, product.category)})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '200%',
                  }}
                />
              )}
            </div>

            {/* Thumbnail Carousel Picker */}
            <div className="flex space-x-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(img)}
                  className={`snap-center w-20 h-20 sm:w-24 sm:h-24 rounded-xs border overflow-hidden shrink-0 transition-all cursor-pointer ${
                    activeImg === img 
                      ? `border-gold-pure ${product.category === 'market' ? '' : 'scale-105'}` 
                      : 'border-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  <SafeImage src={img} alt={product.category === 'thobes' ? "ZOAL THOBES & MEN'S WEAR Thumbnail" : `Thumb ${i}`} className="w-full h-full object-contain" category={product.category} />
                </button>
              ))}
            </div>

          </div>

          {/* Pricing & Customization controls (columns 7 to 12) */}
          <div className="lg:col-span-6 space-y-8 lg:pl-4">
            
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold-pure font-display block">{t(`store.category.${product.category}`, { defaultValue: product.category.replace('_', ' ') })} {t('product_detail.collection_label', { defaultValue: 'COLLECTION' })}</span>
              <h1 className="text-3xl sm:text-5xl font-semibold tracking-wide uppercase font-display text-white leading-tight line-clamp-2">{i18n.language === 'ar' ? t(`products.${product.id}.name`, { defaultValue: product.name }) : product.name}</h1>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating) ? 'text-gold-pure fill-current' : 'text-zinc-700'}`} />
                  ))}
                </div>
                <span className="text-xs text-zinc-400 font-mono pl-2">{product.rating} / 5.0  •  {localReviews.length} Reviews</span>
              </div>
            </div>

            {/* Price tag */}
            <div className="flex items-center space-x-4">
              <span className="text-4xl font-sans tracking-wider text-white font-light">{formatCurrency(product.price)} <span className="text-xl text-gold-pure">{t('app.sar')}</span></span>
              {product.inventory > 0 && (
                <span className="flex items-center px-2.5 py-1 bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase tracking-wider font-semibold rounded-xs">
                  ✓ {product.inventory > 20 ? 'Available Today' : (product.inventory > 5 ? 'In Stock' : 'Low Stock')}
                </span>
              )}
            </div>

            {/* Short Narrative intro */}
            <p className="text-zinc-300 text-sm leading-relaxed font-sans font-light line-clamp-3">{i18n.language === 'ar' ? t(`products.${product.id}.description`, { defaultValue: product.description }) : product.description}</p>

            {/* Product Feature Badges */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {productFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-zinc-400">
                  <span className="text-gold-pure">✓</span>
                  <span className="text-xs font-mono tracking-wide">{feature}</span>
                </div>
              ))}
            </div>

            {/* Option Configuration Selection */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="text-xs text-white uppercase tracking-widest block font-display">Configuration</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {productOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedOption(opt)}
                    className={`py-3 px-4 rounded-xs text-[11px] uppercase tracking-wider border text-left transition-all duration-300 cursor-pointer ${
                      selectedOption === opt
                        ? 'border-gold-pure text-white bg-gold-pure/5 shadow-[0_0_15px_rgba(212,175,55,0.05)]'
                        : 'border-white/10 text-zinc-500 hover:text-white hover:border-white/30 bg-black'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center space-x-4 pt-2 rtl:space-x-reverse">
              <label className="text-xs text-white uppercase tracking-widest font-display w-32">{t('product_detail.quantity', { defaultValue: 'QUANTITY' })}</label>
              <div className="flex items-center border border-white/10 bg-[#050505] rounded-xs w-36 justify-between">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="px-2 py-3 font-mono text-sm text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}
                  className="px-4 py-3 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Procurement Actions */}
            <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
              
              <button
                id="product-detail-add-to-bag-button"
                disabled={buttonState !== 'idle'}
                onClick={() => {
                  if (buttonState !== 'idle') return;
                  setButtonState('adding');
                  setTimeout(() => {
                    const finalOption = selectedOption || (productOptions && productOptions[0]) || 'Standard';
                    onAddToCart(product, quantity, finalOption);
                    setButtonState('success');
                    setTimeout(() => {
                      setButtonState('idle');
                    }, 1800);
                  }, 800);
                }}
                className={`w-full py-4 font-display text-xs uppercase font-bold tracking-[0.25em] rounded-xs transition-all duration-350 flex items-center justify-center gap-2 select-none cursor-pointer shadow-lg active:scale-[0.99] touch-none ${
                  buttonState === 'idle'
                    ? 'bg-white hover:bg-gold-light text-black hover:shadow-white/10 hover:shadow-xl'
                    : buttonState === 'adding'
                    ? 'bg-zinc-900 border border-white/10 text-zinc-500 cursor-not-allowed'
                    : 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] border-[#D4AF37]'
                }`}
              >
                {buttonState === 'idle' && (
                  <>
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>{t('product_detail.add_to_cart', { defaultValue: 'ADD TO SHOPPING BAG' })}</span>
                  </>
                )}
                {buttonState === 'adding' && (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-zinc-400 tracking-[0.2em]">{i18n.language === 'ar' ? 'جاري الإضافة...' : 'ADDING...'}</span>
                  </>
                )}
                {buttonState === 'success' && (
                  <>
                    <span className="font-bold text-[#111] animate-pulse">✓</span>
                    <span className="text-[#111] font-bold tracking-[0.2em]">{i18n.language === 'ar' ? 'تمت الإضافة' : '✓ ADDED'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                className="w-full py-4 border border-gold-pure text-gold-pure font-display text-xs uppercase font-bold tracking-[0.2em] rounded-xs transition-all duration-300 hover:bg-gold-pure hover:text-black flex items-center justify-center gap-2 cursor-pointer"
              >
                {t('product_detail.buy_now')}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleWhatsAppOrder}
                  className="py-3 border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-400 font-display text-[10px] uppercase font-semibold tracking-widest rounded-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
                <button
                  onClick={() => onToggleWishlist(product.id)}
                  className={`py-3 border hover:border-gold-pure/30 bg-zinc-950/20 hover:bg-gold-pure/5 rounded-xs text-[10px] uppercase font-display tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${isWishlisted ? 'border-rose-500/50 text-rose-500' : 'border-white/5 text-zinc-400 hover:text-gold-pure'}`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                  Wishlist
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* SECTION 1: Why You'll Love It (Replaced Narrative) */}
        <div className="mt-20 border-t border-white/5 pt-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-display uppercase tracking-widest text-white">Why You'll Love It</h2>
            <div className="w-12 h-1 bg-gold-pure mx-auto mt-4 rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {productFeatures.map((feature, idx) => (
              <div key={idx} className="bg-[#050505] border border-white/5 p-6 rounded-xs text-center group hover:border-gold-pure/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-pure/10 transition-colors">
                  <Star className="w-5 h-5 text-gold-pure" />
                </div>
                <h4 className="text-white text-xs font-display uppercase tracking-wider mb-2">{feature}</h4>
                <p className="text-zinc-500 text-[10px] leading-relaxed">Experience the definition of luxury and premium craftsmanship with our rigorous standard.</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: Product Details (Replaced Specification Matrix) */}
        <div className="mt-20 border-t border-white/5 pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-6">
              <h3 className="text-3xl font-display uppercase tracking-wider text-white">Product Details</h3>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-lg font-light">
                {product.story || product.description}
              </p>
              <div className="grid grid-cols-1 gap-4 pt-6">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="flex flex-col border-b border-white/5 pb-4">
                    <span className="font-display text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{key}</span>
                    <span className="text-zinc-200 font-sans text-sm">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`relative rounded-sm overflow-hidden border border-white/5 bg-[#000] ${
              product.category === 'market' ? 'aspect-[16/9]' : 'aspect-[4/3]'
            }`}>
              <SafeImage
                src={product.images[1] || product.images[0]}
                alt={product.name}
                className={product.category === 'market' 
                  ? "w-full h-full object-contain opacity-100" 
                  : "w-full h-full object-cover opacity-80 mix-blend-lighten"
                }
                category={product.category}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>

          </div>
        </div>

        {/* SECTION 3: Customer Reviews */}
        <div className="mt-20 border-t border-white/5 pt-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-6">
            <div>
              <h3 className="text-3xl font-display uppercase tracking-widest text-white mb-4">Client Feedback</h3>
              <div className="flex items-center space-x-4">
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.round(product.rating) ? 'text-gold-pure fill-current' : 'text-zinc-700'}`} />
                  ))}
                </div>
                <div className="text-sm font-sans tracking-wide">
                  <span className="text-white font-medium">{product.rating.toFixed(1)}/5.0</span>
                  <span className="text-zinc-500 ml-2">Based on {localReviews.length} Reviews</span>
                </div>
              </div>
            </div>
            
            {!showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="py-3 px-8 bg-zinc-900 hover:bg-gold-pure text-white hover:text-black font-display text-xs uppercase font-bold tracking-[0.2em] rounded-xs transition-colors"
              >
                Write a Review
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Feed ledger */}
            <div className={`lg:col-span-${showReviewForm ? '7' : '12'} space-y-4`}>
              {localReviews.length === 0 ? (
                <div className="p-12 border border-dashed border-white/5 bg-zinc-950/20 text-center rounded-sm">
                  <MessageSquare className="w-8 h-8 text-zinc-500 mx-auto mb-4 animate-pulse" />
                  <p className="text-white text-sm font-display tracking-widest uppercase">{t('product_detail.no_reviews', { defaultValue: 'No Reviews Yet' })}</p>
                  <p className="text-zinc-500 text-xs mt-2">Be the first to share your experience with this premium selection.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {localReviews.map((rev) => (
                    <div key={rev.id} className="p-6 border border-white/5 bg-[#050505] rounded-sm flex flex-col justify-between">
                      <div>
                        <div className="flex space-x-1 text-gold-pure mb-4">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed font-light font-sans italic mb-6">"{rev.comment}"</p>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <span className="text-xs font-medium text-white uppercase tracking-wider font-display">{rev.reviewerName}</span>
                        <span className="text-[10px] text-zinc-600 font-mono">{rev.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write feedback form */}
            {showReviewForm && (
              <div className="lg:col-span-5 bg-[#030303] border border-white/10 p-8 rounded-sm space-y-6 shrink-0 sticky top-32">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h4 className="text-white text-sm font-display uppercase tracking-widest">{t('product_detail.submit_review', { defaultValue: 'Submit Experience' })}</h4>
                  <button onClick={() => setShowReviewForm(false)} className="text-zinc-500 hover:text-white border-0 bg-transparent cursor-pointer">×</button>
                </div>
                
                <form onSubmit={handleReviewSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-display">Client Name</label>
                    <input
                      type="text"
                      required
                      value={newReviewer}
                      onChange={(e) => setNewReviewer(e.target.value)}
                      placeholder="e.g. Abdullah Dammam"
                      className="w-full bg-black border border-white/10 rounded-xs p-3 text-sm focus:outline-none focus:border-gold-pure/50 text-white transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-display">Sensory Rating</label>
                    <select
                      value={newRating}
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="w-full bg-black border border-white/10 rounded-xs p-3 text-sm text-gold-pure focus:outline-none transition-colors"
                    >
                      <option value={5}>★★★★★ (Absolute Apex Perfection)</option>
                      <option value={4}>★★★★☆ (Highly Respected Quality)</option>
                      <option value={3}>★★★☆☆ (Acceptable Standards)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-display">Remarks</label>
                    <textarea
                      required
                      rows={4}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your high-fidelity sensory feedback..."
                      className="w-full bg-black border border-white/10 rounded-xs p-3 text-sm focus:outline-none focus:border-gold-pure/50 text-white transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-white text-black font-display text-xs font-bold uppercase tracking-[0.2em] rounded-xs transition-all hover:bg-gold-pure flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* SECTION 4: Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t border-white/5 pt-16">
            <h3 className="text-white text-2xl font-display uppercase tracking-widest mb-10 text-center">Curated For You</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  className="group bg-transparent"
                >
                  <div 
                    className="w-full aspect-[4/5] mb-6 overflow-hidden rounded-xs cursor-pointer relative"
                    onClick={() => {
                      onProductSelect(rel);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <ScrollZoomImage
                      src={rel.images[0]}
                      alt={rel.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      containerClassName="w-full h-full overflow-hidden absolute inset-0"
                      category={rel.category}
                    />
                  </div>
                  
                  <div className="space-y-2 text-center">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 block mb-1 font-display">{t(`store.category.${rel.category}`, { defaultValue: rel.category })}</span>
                    <h4 
                      className="text-white text-sm font-display uppercase tracking-wider cursor-pointer group-hover:text-gold-pure transition-colors line-clamp-1"
                      onClick={() => {
                        onProductSelect(rel);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      {i18n.language === 'ar' ? t(`products.${rel.id}.name`, { defaultValue: rel.name }) : rel.name}
                    </h4>
                    <p className="text-gold-pure font-sans text-lg font-light">{formatCurrency(rel.price)} <span className="text-sm">{t('app.sar')}</span></p>
                  </div>
                  
                  <button 
                    onClick={() => onAddToCart(rel, 1, 'Standard')}
                    className="w-full mt-6 py-4 border border-white/10 text-white font-display text-[10px] uppercase font-bold tracking-[0.2em] rounded-xs transition-all hover:bg-gold-pure hover:text-black hover:border-gold-pure flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Quick Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
