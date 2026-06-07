import React, { useState, useMemo } from 'react';
import { ShoppingBag, ArrowLeft, Heart, MessageSquare, Shield, Clock, Award, Star, ThumbsUp, Send } from 'lucide-react';
import { Product, Review, BusinessCategory } from '../types';
import { PRODUCTS } from '../data';
import ScrollZoomImage from './ScrollZoomImage';

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
  const [activeImg, setActiveImg] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState('');
  const [zoomStyle, setZoomStyle] = useState({ display: 'none', backgroundPosition: '0% 0%' });

  // Reviews submission forms
  const [newReviewer, setNewReviewer] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [localReviews, setLocalReviews] = useState<Review[]>(product.reviews);

  const isWishlisted = wishlist.includes(product.id);

  // Setup options
  const productOptions = useMemo(() => {
    switch (product.category) {
      case 'coffee': return ['Whole Beans', 'Infused Ground', 'Fine Roasted Espresso'];
      case 'bakery': return ['Fresh Baked Daily Lot', 'Sealed Presentation Pack'];
      case 'market': return ['Standard Burlap Bag', 'Hermetically Sealed Tin (+25 SAR)'];
      case 'fashion': return ['Standard Fit drape (4.5m)', 'Custom Atelier Hand tailoring (+350 SAR)'];
      case 'pots': return ['Natural Clay Ochre finish', 'Waterproof High-Gloss Glaze (+40 SAR)'];
      default: return ['Standard Luxury Pack'];
    }
  }, [product.category]);

  React.useEffect(() => {
    setSelectedOption(productOptions[0]);
    setActiveImg(product.images[0]);
  }, [product, productOptions]);

  // Compute related recommendations
  const relatedProducts = useMemo(() => {
    return PRODUCTS.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
  }, [product.category, product.id]);

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
    const text = `السلام عليكم ZOAL Group Boutique. I am interested in placing an exclusive purchase order for columns:
- Product: ${product.name}
- Configuration: ${selectedOption}
- Price: ${product.price} SAR
- Ordered Quantity: ${quantity}
Please confirm availability at Al Shati district, Dammam flags. Thank you.`;
    
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=+966508339001&text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleBuyNow = () => {
    onAddToCart(product, quantity, selectedOption);
    setCurrentPage('cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation line back */}
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-zinc-500 hover:text-gold-pure transition-colors duration-300 mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Curations</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-start">
          
          {/* Gallery with Zoom (columns 1 to 6) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Main Visual box */}
            <div
              className="relative aspect-square bg-[#050505] border border-white/5 rounded-sm overflow-hidden cursor-crosshair group h-[300px] sm:h-[480px]"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={activeImg}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {/* Dynamic magnifying layout view */}
              <div
                className="absolute inset-0 pointer-events-none border border-gold-pure/30"
                style={{
                  ...zoomStyle,
                  backgroundImage: `url(${activeImg})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '200%',
                }}
              />

              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xs text-[9px] uppercase tracking-wider text-zinc-400">
                Hover main image to magnify details
              </div>
            </div>

            {/* Thumbnail Carousel Picker */}
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(img)}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xs border overflow-hidden shrink-0 transition-all cursor-pointer ${
                    activeImg === img ? 'border-gold-pure' : 'border-white/5 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

          </div>

          {/* Pricing & Customization controls (columns 7 to 12) */}
          <div className="lg:col-span-6 space-y-6">
            
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-gold-pure font-display block mb-2">{product.category.replace('_', ' ')} Collection</span>
              <h1 className="text-2xl sm:text-4xl font-semibold tracking-wider uppercase font-display text-white">{product.name}</h1>
              <p className="text-zinc-500 text-xs tracking-widest mt-1 font-mono">{product.subDescription}</p>
            </div>

            {/* Price tag */}
            <div className="flex items-center justify-between border-t border-b border-white/5 py-4">
              <span className="text-2xl font-sans tracking-widest text-gold-pure font-semibold">{product.price} SAR</span>
              <div className="flex items-center space-x-1 border border-gold-pure/20 rounded-xs bg-gold-pure/5 px-2.5 py-1">
                <Star className="w-3.5 h-3.5 text-gold-pure fill-current" />
                <span className="text-xs font-bold text-gold-light">{product.rating} Customer Rating</span>
              </div>
            </div>

            {/* Short Narrative intro */}
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">{product.description}</p>

            {/* Option Configuration Selection */}
            <div className="space-y-3">
              <label className="text-[10px] text-zinc-400 uppercase tracking-widest">Select Premium Option Preset:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {productOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedOption(opt)}
                    className={`py-3 px-4 rounded-xs text-[10px] uppercase tracking-wider border text-left transition-all duration-300 cursor-pointer ${
                      selectedOption === opt
                        ? 'border-gold-pure text-white bg-gold-pure/10 shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                        : 'border-white/5 text-zinc-500 hover:text-white bg-zinc-950/20'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center space-x-4">
              <label className="text-[10px] text-zinc-400 uppercase tracking-widest">Quantity:</label>
              <div className="flex items-center border border-white/5 bg-[#0a0a0a] rounded-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-2 font-mono text-xs text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}
                  className="px-3.5 py-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">({product.inventory} pieces physically available)</span>
            </div>

            {/* Procurement Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              
              <button
                onClick={() => onAddToCart(product, quantity, selectedOption)}
                className="py-4 bg-white hover:bg-gold-pure text-black hover:text-black font-display text-[10px] uppercase font-bold tracking-[0.25em] rounded-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Cart
              </button>

              <button
                onClick={handleBuyNow}
                className="py-4 bg-gradient-to-r from-gold-dark to-gold-pure text-black font-display text-[10px] uppercase font-bold tracking-[0.25em] rounded-sm transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center justify-center gap-2 cursor-pointer"
              >
                Sovereign Instant Purchase
              </button>

              <button
                onClick={handleWhatsAppOrder}
                className="sm:col-span-2 py-4 border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-400 font-display text-[10px] uppercase font-semibold tracking-[0.25em] rounded-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                Assemble WhatsApp Inquiry Order
              </button>

            </div>

            {/* Wishlist Pin */}
            <button
              onClick={() => onToggleWishlist(product.id)}
              className="w-full py-3.5 border border-white/5 hover:border-gold-pure/30 bg-zinc-950/20 hover:bg-gold-pure/5 rounded-sm text-[10px] uppercase font-display tracking-widest text-zinc-400 hover:text-gold-pure flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-rose-500' : ''}`} />
              {isWishlisted ? 'Discard from Royal Wishlist' : 'Add to private Royal Wishlist'}
            </button>

          </div>

        </div>

        {/* Narrative & Technical Spec Tabs (Accordion Layout) */}
        <div className="mt-20 border-t border-white/5 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* The Story Background */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center space-x-2 text-gold-pure">
                <Award className="w-5 h-5" />
                <h3 className="text-white text-sm font-display uppercase tracking-widest">The Sensory Narrative</h3>
              </div>
              <p className="text-zinc-400 text-xs tracking-wider leading-relaxed text-justify first-letter:text-3xl first-letter:font-display first-letter:text-gold-pure first-letter:mr-1">
                {product.story}
              </p>
              <div className="p-4 border border-zinc-900 rounded-sm bg-zinc-950/40 flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gold-pure/70 shrink-0" />
                <p className="text-zinc-500 text-[10px]">Certified ZOAL authenticity. Prepared under hygienic, thermal, and design conditions exceeding SASO and SFDA requirements.</p>
              </div>
            </div>

            {/* Specifications Matrix */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center space-x-2 text-gold-pure">
                <Award className="w-5 h-5" />
                <h3 className="text-white text-sm font-display uppercase tracking-widest">Technical Register</h3>
              </div>
              <div className="border border-white/5 rounded-sm bg-[#060606] overflow-hidden divide-y divide-white/5">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="grid grid-cols-3 p-4 text-xs">
                    <span className="font-display text-[9px] text-zinc-500 uppercase tracking-wider">{key}</span>
                    <span className="col-span-2 text-zinc-300 font-sans">{val}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Reviews system */}
        <div className="mt-20 border-t border-white/5 pt-12">
          <h3 className="text-white text-lg font-display uppercase tracking-widest mb-8">Client Testimonials ({localReviews.length})</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Feed ledger (columns 1 to 7) */}
            <div className="lg:col-span-7 space-y-6">
              {localReviews.length === 0 ? (
                <div className="p-8 border border-dashed border-white/5 bg-zinc-950/20 text-center rounded-sm">
                  <MessageSquare className="w-8 h-8 text-zinc-500 mx-auto mb-2 animate-pulse" />
                  <p className="text-zinc-400 text-xs font-display">No client logs registered yet</p>
                  <p className="text-zinc-600 text-[10px] mt-1">Be the very first distinguished patron to submit sensory reviews.</p>
                </div>
              ) : (
                <div className="space-y-6 divide-b divide-white/5">
                  {localReviews.map((rev) => (
                    <div key={rev.id} className="p-5 border border-white/5 bg-[#050505] rounded-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white uppercase tracking-wider">{rev.reviewerName}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{rev.date}</span>
                      </div>
                      <div className="flex space-x-1 text-gold-pure">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write feedback form (columns 8 to 12) */}
            <div className="lg:col-span-5 bg-zinc-950/40 border border-white/5 p-6 rounded-sm space-y-4">
              <h4 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-3">Submit Privy Review</h4>
              
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest">Patron Name:</label>
                  <input
                    type="text"
                    required
                    value={newReviewer}
                    onChange={(e) => setNewReviewer(e.target.value)}
                    placeholder="e.g. Abdullah Dammam"
                    className="w-full bg-black border border-white/5 rounded-sm p-2.5 text-xs focus:outline-none focus:border-gold-pure/40 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest">Sensory Rating:</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="w-full bg-black border border-white/5 rounded-sm p-2.5 text-xs text-gold-pure font-mono focus:outline-none"
                  >
                    <option value={5}>★★★★★ (Absolute Apex Perfection)</option>
                    <option value={4}>★★★★☆ (Highly Respected Quality)</option>
                    <option value={3}>★★★☆☆ (Acceptable Standards)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest">Privy Comments:</label>
                  <textarea
                    required
                    rows={4}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your high-fidelity sensory feedback..."
                    className="w-full bg-black border border-white/5 rounded-sm p-2.5 text-xs focus:outline-none focus:border-gold-pure/40 text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-white text-black font-display text-[9px] font-bold uppercase tracking-wider rounded-xs transition-colors hover:bg-gold-pure flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  Broadcast Review Logging
                </button>

              </form>

            </div>

          </div>
        </div>

        {/* Related Collections */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 border-t border-white/5 pt-12">
            <h3 className="text-white text-sm font-display uppercase tracking-widest mb-8">Related Domain Suggestions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => {
                    onProductSelect(rel);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-[#050505] p-4 border border-white/5 hover:border-gold-pure/30 transition-all rounded-sm cursor-pointer group"
                >
                  <div className="w-full aspect-square mb-4 overflow-hidden rounded-xs h-[180px]">
                    <ScrollZoomImage
                      src={rel.images[0]}
                      alt={rel.name}
                      className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                      containerClassName="w-full h-full overflow-hidden relative"
                    />
                  </div>
                  <h4 className="text-white text-xs font-display uppercase tracking-wider truncate group-hover:text-gold-pure transition-colors">{rel.name}</h4>
                  <p className="text-gold-pure font-mono text-[11px] mt-1">{rel.price} SAR</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
