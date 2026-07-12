import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, SlidersHorizontal, Heart, ShoppingBag, Eye, X, 
  Sparkles, Plus, Image as ImageIcon, Trash2, Upload, AlertCircle, Check 
} from 'lucide-react';
import { Product, BusinessCategory } from '../types';
import ScrollZoomImage from './ScrollZoomImage';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SafeImage, useGlobalProducts, useGlobalImages, uploadImageToStore, deleteImageFromStore } from '../imageRegistry';
import { formatCurrency } from '../utils';

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
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(initialCategoryFilter);
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'rating'>('default');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');

  // Premium button state locks & visual indicators in Store
  const [addingId, setAddingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Merchant asset upload state
  const [showMerchantStudio, setShowMerchantStudio] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<BusinessCategory>('coffee');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook subscriptions
  const allProducts = useGlobalProducts();
  const globalImages = useGlobalImages();

  const categories = [
    { id: 'all', name: t('store.category.all') },
    { id: 'coffee', name: t('store.category.coffee') },
    { id: 'bakery', name: t('store.category.bakery') },
    { id: 'market', name: t('store.category.market') },
    { id: 'fashion', name: t('store.category.fashion') },
    { id: 'thobes', name: t('store.category.thobes') },
  ];

  const PRESET_ASSETS = [
    {
      category: 'coffee' as BusinessCategory,
      title: 'Premium Shaken Obsidian Espresso',
      url: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&q=80&w=800'
    },
    {
      category: 'bakery' as BusinessCategory,
      title: 'Freshly-Fired Saj-Oven Flatbread',
      url: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=800'
    },
    {
      category: 'market' as BusinessCategory,
      title: 'Finely-Sifted Kordofan Hibiscus Buds',
      url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800'
    },
    {
      category: 'fashion' as BusinessCategory,
      title: 'Atelier Royal Silk Emerald Abaya',
      url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=800'
    },
    {
      category: 'thobes' as BusinessCategory,
      title: 'Bespoke Premium White Silk Thobe',
      url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800'
    }
  ];

  // Sync category filter if received as a prop
  React.useEffect(() => {
    if (initialCategoryFilter) {
      setActiveCategory(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  React.useEffect(() => {
    if (activeCategory && activeCategory !== 'all') {
      setUploadCategory(activeCategory as BusinessCategory);
    }
  }, [activeCategory]);

  // Compute filtered & sorted product list with strict validation of elements
  const filteredProducts = useMemo(() => {
    const rawFiltered = allProducts.filter((product) => {
      const matchSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.story.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory = activeCategory === 'all' || product.category === activeCategory;

      return matchSearch && matchCategory;
    });

    // Handle strict Thobes filtering validation & debugger outputs
    if (activeCategory === 'thobes') {
      const strictlyThobeProducts = rawFiltered.filter(p => p.category === 'thobes');
      
      // Safety step: Clean any other images from the thobe product records
      strictlyThobeProducts.forEach((p) => {
        p.images = p.images.filter((img) => {
          const lower = img.toLowerCase();
          return (
            lower.includes('thobe') || 
            lower.includes('p1') || 
            lower.includes('p2') || 
            lower.includes('photo-1528459801416') || 
            lower.includes('photo-1620799140408') || 
            lower.includes('photo-1593030761757') ||
            img.startsWith('data:') ||
            img.startsWith('blob:') ||
            lower.includes('upload') ||
            (lower.includes('unsplash.com') && !lower.includes('coffee') && !lower.includes('bakery') && !lower.includes('market'))
          );
        });
        if (p.images.length === 0) {
          p.images = ['https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=800'];
        }
      });

      console.log(`[Thobes Grid Debug] Confirmed loading isolated Thobes category. Products list:`, strictlyThobeProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        checkedImages: p.images
      })));

      return strictlyThobeProducts.sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0;
      });
    }

    return rawFiltered.sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // Default sorting
    });
  }, [allProducts, searchTerm, activeCategory, sortBy]);

  // Determine standard configuration options per category
  const getProductOptions = (category: BusinessCategory) => {
    switch (category) {
      case 'coffee': return ['Whole Beans', 'Infused Ground', 'Fine Roasted Espresso'];
      case 'bakery': return ['Fresh Baked Daily Lot', 'Sealed Presentation Pack'];
      case 'market': return ['Standard Burlap Bag', 'Hermetically Sealed Tin (+0.00 SAR)'];
      case 'fashion': return ['Standard Fit drape (4.5m)', 'Premium Presentation Box (+0.00 SAR)'];
      case 'thobes': return ['Standard Fit', 'Tailored Fit (+0.00 SAR)'];
      default: return ['Standard Luxury Pack'];
    }
  };

  const handleQuickViewOpen = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const opts = getProductOptions(product.category);
    setSelectedOption(opts[0]);
    setQuickViewProduct(product);
  };

  // Drag-and-drop file upload conversion
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only high-quality image filetypes are supported.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadUrl(reader.result);
          setUploadError('');
          setUploadSuccess(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only high-quality image filetypes are supported.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadUrl(reader.result);
          setUploadError('');
          setUploadSuccess(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim()) {
      setUploadError('Please choose or paste a valid asset URL, or drop an image file.');
      return;
    }

    try {
      uploadImageToStore(uploadUrl, uploadCategory, uploadTitle);
      
      // Cleanup form state on success
      setUploadUrl('');
      setUploadTitle('');
      setUploadError('');
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err) {
      setUploadError('Failed to synchronize and save dynamic image asset.');
    }
  };

  const selectPreset = (preset: typeof PRESET_ASSETS[0]) => {
    setUploadUrl(preset.url);
    setUploadTitle(preset.title);
    setUploadCategory(preset.category);
    setUploadError('');
    setUploadSuccess(false);
  };

  // Filter custom uploaded images for management ledger
  const customUploadedImages = useMemo(() => {
    return globalImages.filter(img => img.source === 'store upload');
  }, [globalImages]);

  // Compute active category details and banner image dynamically
  const categoryHeaderDetails = useMemo(() => {
    if (activeCategory === 'all') return null;

    // Get live image for category, prioritizing custom uploader
    const catImages = globalImages.filter((img) => img.category === activeCategory);
    const customUpload = catImages.find((img) => img.source === 'store upload');
    let imgUrl = customUpload ? customUpload.url : '';

    if (!imgUrl) {
      switch (activeCategory) {
        case 'coffee':
          imgUrl = '/src/assets/images/pillar-coffee.jpg';
          break;
        case 'bakery':
          imgUrl = '/src/assets/images/pillar-bakery.jpg';
          break;
        case 'market':
          imgUrl = '/images/market_grocery_official_1781633042972.jpg';
          break;
        case 'fashion':
          imgUrl = '/src/assets/images/pillar-fashion.jpg';
          break;
        case 'thobes':
          imgUrl = '/src/assets/images/thobes.jpg';
          break;
      }
    }

    const detailsMap: Record<string, { title: string; subtitle: string; desc: string }> = {
      coffee: {
        title: t('scroll.c_t', { defaultValue: 'Crafted for Every Moment' }),
        subtitle: 'COFFEE HOUSE',
        desc: t('scroll.c_d', { defaultValue: 'Premium specialty coffee made from carefully selected beans, delivering rich flavor, refined quality, and the true spirit of Arabian hospitality in every cup.' })
      },
      bakery: {
        title: t('scroll.b_t', { defaultValue: 'Crafted with Heritage Baked to Perfection' }),
        subtitle: 'BAKERY & SNACKS',
        desc: t('scroll.b_d', { defaultValue: 'From authentic Hoboz bread to handcrafted pastries, premium biscuits, and traditional sweets—every creation reflects timeless recipes and exceptional quality.' })
      },
      market: {
        title: t('scroll.m_t', { defaultValue: 'Fresh Essentials Every Day' }),
        subtitle: 'MARKET & GROCERY',
        desc: t('scroll.m_d', { defaultValue: 'Discover premium groceries, fresh ingredients, daily essentials, beverages, snacks, and household products carefully selected for quality and convenience.' })
      },
      fashion: {
        title: t('scroll.f_t', { defaultValue: 'Fashion & Beauty' }),
        subtitle: 'PREMIUM COLLECTIONS',
        desc: t('scroll.f_d', { defaultValue: "Discover Sudanese fashion, elegant women's wear, abayas, modest wear, traditional men's attire, cosmetics, perfumes, and carefully selected beauty essentials for every occasion." })
      },
      thobes: {
        title: t('scroll.t_t', { defaultValue: 'Timeless Sudanese Style' }),
        subtitle: "THOBES & MEN'S WEAR",
        desc: t('scroll.t_d', { defaultValue: "Discover authentic Sudanese thobes and traditional men's attire, carefully selected for comfort, quality, and timeless elegance." })
      }
    };

    return {
      ...(detailsMap[activeCategory] || { title: activeCategory.toUpperCase(), subtitle: activeCategory.toUpperCase(), desc: '' }),
      img: imgUrl
    };
  }, [activeCategory, globalImages, t]);

  return (
    <div className="bg-black text-white min-h-screen pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-20">
      
      {/* Decorative Gold Header Aura */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[300px] gold-glow-orb opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page title area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="text-left">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-[0.2em] uppercase font-display text-white">
              {t('store.title')}
            </h1>
            <p className="text-zinc-500 text-xs tracking-wider uppercase mt-4 max-w-xl leading-relaxed">
              {t('store.subtitle')}
            </p>
          </div>

          <button
            onClick={() => setShowMerchantStudio(!showMerchantStudio)}
            className={`py-3 px-5 border rounded-xs text-[10px] uppercase font-display tracking-[0.2em] transition-all flex items-center gap-2 cursor-pointer ${
              showMerchantStudio 
                ? 'bg-gold-pure text-black border-gold-pure font-bold shadow-[0_0_12px_rgba(212,175,55,0.4)]' 
                : 'border-white/10 hover:border-gold-pure text-zinc-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            {showMerchantStudio ? 'Close Assets Studio' : 'Merchant Assets Studio'}
          </button>
        </div>

        {/* MERCHANT ASSET CREATION & UPLOAD STUDIO DRAWER */}
        <AnimatePresence>
          {showMerchantStudio && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="overflow-hidden mb-10"
            >
              <div className="bg-zinc-950 border border-gold-pure/20 rounded-sm p-6 sm:p-8 space-y-8 relative">
                
                {/* Decorative gold badge */}
                <span className="absolute top-4 right-4 text-[8px] font-mono tracking-widest text-gold-pure uppercase px-2 py-0.5 border border-gold-pure/30 bg-gold-pure/5">
                  Unified Cloud System
                </span>

                <div className="max-w-3xl">
                  <h3 className="text-base font-display uppercase tracking-widest text-[#D4AF37] mb-2 flex items-center gap-1.5 font-bold">
                    <ImageIcon className="w-4 h-4" /> Global Image Library & Store uploader
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
                    Store uploads serve as the <strong>Sole Source of Truth</strong> for the entire site. Once dynamic assets are uploaded here, they are stored globally in our database, categorised appropriately, and instantly bound to Lookbooks, Portfolio grids, and matching store products with zero duplicate steps.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left block for Input Form */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Choose high-quality presets block */}
                    <div className="space-y-2">
                      <span className="text-[10px] tracking-wider text-zinc-400 uppercase font-semibold block">
                        Quick Unsplash Heritage Presets (Simulate Seamless Curation):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_ASSETS.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => selectPreset(p)}
                            className="text-[9px] uppercase tracking-wider px-2.5 py-1.5 border border-white/5 bg-black/40 text-zinc-400 hover:border-gold-pure hover:text-[#D4AF37] duration-300 font-mono"
                          >
                            + {p.category.toUpperCase()}: {p.title.split(' ').slice(-2).join(' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleUploadSubmit} className="space-y-4">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Title field */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] uppercase text-zinc-400 tracking-wider">Asset Title / Product Name</label>
                          <input
                            type="text"
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            placeholder="e.g. Traditional Hand-Fired Hoboz Lot"
                            className="w-full px-3 py-2 bg-black border border-white/10 focus:border-gold-pure font-sans text-xs focus:outline-none placeholder-zinc-600 rounded-xs"
                          />
                        </div>

                        {/* Category field */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] uppercase text-zinc-400 tracking-wider">Global Category Attachment</label>
                          <select
                            value={uploadCategory}
                            onChange={(e) => setUploadCategory(e.target.value as BusinessCategory)}
                            className="w-full px-3 py-2 bg-black border border-white/10 focus:border-gold-pure font-sans text-xs focus:outline-none rounded-xs uppercase tracking-wider text-zinc-300"
                          >
                            <option value="coffee">COFFEE HOUSE</option>
                            <option value="bakery">BAKERY & SNACKS</option>
                            <option value="market">MARKET & GROCERY</option>
                            <option value="fashion">PREMIUM COLLECTIONS</option>
                            <option value="thobes">THOBES & MEN'S WEAR</option>
                          </select>
                        </div>
                      </div>

                      {/* Drag & Drop or Custom Paste Area */}
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] uppercase text-zinc-400 tracking-wider">Asset Source (URL / Base64 File upload)</label>
                        
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border border-dashed rounded-xs p-6 text-center cursor-pointer transition-all duration-300 ${
                            dragActive ? 'border-gold-pure bg-gold-pure/5' : 'border-white/10 hover:border-white/20 bg-black/40'
                          }`}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                          />
                          <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                          <p className="text-[10px] uppercase tracking-wider text-zinc-300 font-semibold mb-1">
                            Drag & Drop Digital Asset Image or Click to Browse Local Files
                          </p>
                          <p className="text-[9px] text-zinc-500">
                            Supports PNG, JPG, WEBP, SVG. Files convert to persistent offline Base64 data urls instantly.
                          </p>
                        </div>

                        {/* Or Manual URL Entry */}
                        <div className="relative mt-2">
                          <span className="text-[9px] tracking-wider text-zinc-500 uppercase block mb-1">
                            Or paste manual image URL absolute reference:
                          </span>
                          <input
                            type="text"
                            value={uploadUrl}
                            onChange={(e) => {
                              setUploadUrl(e.target.value);
                              setUploadSuccess(false);
                            }}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="w-full px-3 py-2.5 bg-black border border-white/10 focus:border-gold-pure font-mono text-[10px] focus:outline-none placeholder-zinc-700 rounded-xs"
                          />
                        </div>

                      </div>

                      {/* Messaging Alerts */}
                      {uploadError && (
                        <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xs text-[10.5px] text-rose-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                      )}

                      {uploadSuccess && (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xs text-[10.5px] text-emerald-400 flex items-center gap-2">
                          <Check className="w-4 h-4 shrink-0" />
                          <span>Asset uploaded & dynamic lookbook synchronizations completed perfectly.</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 bg-white text-black hover:bg-gold-pure duration-300 rounded-xs text-[10px] uppercase font-display tracking-widest font-semibold cursor-pointer shadow-[0_4px_12px_rgba(255,255,255,0.05)]"
                      >
                        [ Upload & Synchronize Across Entire Website ]
                      </button>

                    </form>

                  </div>

                  {/* Right block for Live Asset Preview */}
                  <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-8">
                    
                    <div className="space-y-4 text-left h-full flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-3">
                          Active Asset Live Preview:
                        </span>
                        
                        <div className="aspect-video w-full max-w-sm rounded bg-black/60 border border-white/5 relative overflow-hidden flex items-center justify-center">
                          {uploadUrl ? (
                            <img
                              src={uploadUrl}
                              alt="Asset preview"
                              className="w-full h-full object-cover"
                              onError={() => setUploadError('Warning: Provided URL appears inactive or blocked by CORS policy.')}
                            />
                          ) : (
                            <div className="text-center p-4">
                              <ImageIcon className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                              <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">No Active URL or File Loader Bound</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Display summary data */}
                      <div className="bg-black/40 border border-white/5 p-4 rounded-xs text-[10.5px] space-y-2 mt-4">
                        <p className="text-zinc-500 font-mono uppercase text-[9px] tracking-wider border-b border-white/5 pb-1.5">Asset Metadata</p>
                        <p className="flex justify-between"><span className="text-zinc-500">Class Type:</span> <strong className="text-zinc-300 uppercase tracking-wider">{uploadCategory}</strong></p>
                        <p className="flex justify-between"><span className="text-zinc-500">Asset Title:</span> <strong className="text-zinc-300 truncate max-w-[170px]">{uploadTitle || 'N/A'}</strong></p>
                        <p className="flex justify-between"><span className="text-zinc-500">Source Role:</span> <strong className="text-gold-pure">store upload</strong></p>
                        <p className="flex justify-between"><span className="text-zinc-500">SLA Status:</span> <strong className="text-emerald-500">AUTO-SYNC ACTIVE</strong></p>
                      </div>

                    </div>

                  </div>

                </div>

                {/* Manage current uploads subdivision */}
                {customUploadedImages.length > 0 && (
                  <div className="border-t border-white/5 pt-6 space-y-4">
                    <span className="text-[10px] tracking-widest text-[#D4AF37] uppercase font-display block text-left">
                      Manage Dynamic Portal Assets ({customUploadedImages.length} items):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                      {customUploadedImages.map((img) => (
                        <div key={img.id} className="bg-black border border-white/5 rounded-xs overflow-hidden relative group p-1.5">
                          <div className="aspect-square w-full rounded-xs overflow-hidden relative">
                            <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => deleteImageFromStore(img.id)}
                                className="p-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 duration-200 cursor-pointer"
                                title="Delete from platform"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-1 text-left text-[9px] space-y-0.5">
                            <p className="text-zinc-300 truncate font-semibold">{img.title}</p>
                            <p className="text-zinc-500 uppercase tracking-wider">{img.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter bars / Search tools */}
        <div className="bg-[#030303] sm:bg-glass border border-white/5 rounded-sm p-4 sm:p-6 mb-8 sm:mb-10 space-y-4 sticky top-[60px] sm:static sm:top-auto z-40">
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
                placeholder={t('store.search')}
                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/5 rounded-sm text-sm placeholder-zinc-500 focus:outline-none focus:border-gold-pure/40 text-white transition-all duration-300 rtl:pr-10 rtl:pl-4 rtl:text-right"
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

              <div className="flex items-center space-x-3 w-full sm:w-auto rtl:space-x-reverse">
                <SlidersHorizontal className="w-4 h-4 text-gold-pure/80" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-black border border-white/5 rounded-sm text-xs text-zinc-400 py-2 px-3 focus:outline-none focus:border-gold-pure/40 rtl:text-right"
                >
                  <option value="default">{t('store.sort.default')}</option>
                  <option value="price-low">{t('store.sort.price_low')}</option>
                  <option value="price-high">{t('store.sort.price_high')}</option>
                  <option value="rating">{t('store.sort.rating')}</option>
                </select>
              </div>
            </div>

          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 scrollbar-hide border-t border-white/5 pt-6">
            {categories.map((cat) => {
              const imgMap: Record<string, string> = {
                all: '/images/all_collection.png?v=4',
                coffee: '/images/coffee_category.png?v=4',
                bakery: '/images/bakery_category.png?v=4',
                market: '/images/market_category.png?v=4',
                fashion: '/images/fashion_category.png?v=4',
                thobes: '/images/thobes_category.png?v=4'
              };
              
              const imgSrc = imgMap[cat.id];
              const isActive = activeCategory === cat.id;
              
              // Custom scale and filter configurations to optimize each category logo/icon presentation
              const configMap: Record<string, { scale: number; filter?: string }> = {
                all: { scale: 1.45, filter: 'brightness(1.5) contrast(1.25)' }, // Perfect scale and brightness boost to maximize visibility
                coffee: { scale: 1.3 },
                bakery: { scale: 1.3, filter: 'brightness(1.4) contrast(1.15)' },
                market: { scale: 1.6, filter: 'brightness(1.5) contrast(1.25)' }, // Elegant zoom to balance visual weight
                fashion: { scale: 1.3, filter: 'brightness(1.4) contrast(1.15)' },
                thobes: { scale: 1.3, filter: 'brightness(1.4) contrast(1.15)' }
              };
              
              const config = configMap[cat.id] || { scale: 1.0 };
              const filterStyle: React.CSSProperties = {
                transform: `scale(${config.scale})`,
                transformOrigin: 'center',
                filter: config.filter
              };

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    if (cat.id !== 'all') {
                      setSearchTerm('');
                    }
                  }}
                  className={`group relative flex flex-col items-center justify-center h-[64px] sm:h-[88px] lg:h-[100px] w-full gap-1.5 sm:gap-2.5 lg:gap-4 px-1.5 sm:px-3 rounded-sm border transition-all duration-500 overflow-hidden cursor-pointer ${
                    isActive
                      ? 'bg-[#111] border-gold-pure/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                      : 'bg-zinc-950/40 border-white/5 hover:border-gold-pure/20 hover:bg-[#0a0a0a]'
                  }`}
                >
                  <div className={`w-full h-[36px] sm:h-[38px] lg:h-[44px] relative z-10 transition-transform duration-500 flex items-center justify-center`}>
                    <img 
                      src={imgSrc || undefined} 
                      alt={cat.name} 
                      className="h-full w-auto max-w-full object-contain mx-auto transition-transform duration-500"
                      style={filterStyle}
                      loading="eager"
                      decoding="sync"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/zoal_logo_transparent.png';
                      }}
                    />
                  </div>
                  <span className={`text-[7px] sm:text-[8px] uppercase font-display tracking-[0.2em] relative z-10 transition-colors duration-300 ${
                    isActive ? 'text-gold-pure font-bold' : 'text-zinc-400 group-hover:text-zinc-200'
                  } absolute bottom-1.5 sm:relative sm:bottom-auto`}>
                    {cat.name}
                  </span>
                  
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-t from-gold-pure/5 to-transparent pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Category Header Banner / Collection Hero Section */}
        {categoryHeaderDetails && (
          <motion.div
            key={`banner-${activeCategory}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`mb-8 sm:mb-10 relative rounded-sm overflow-hidden border border-white/5 bg-[#000] group ${
              activeCategory === 'market'
                ? 'aspect-[16/9] sm:aspect-[21/9] w-full h-auto min-h-[200px] sm:min-h-[340px]'
                : 'h-[180px] sm:h-[240px]'
            }`}
          >
            {/* Background image matrix with custom opacity controls */}
            <SafeImage
              src={categoryHeaderDetails.img}
              alt={categoryHeaderDetails.title}
              containerClassName="absolute inset-0 z-0 overflow-hidden"
              className={`w-full h-full select-none pointer-events-none transition-all duration-700 ${
                activeCategory === 'market'
                  ? 'opacity-100 group-hover:brightness-105'
                  : 'opacity-40 group-hover:opacity-50 scale-100 group-hover:scale-[1.02] group-hover:brightness-105'
              }`}
              category={activeCategory as BusinessCategory}
              forceCover={true}
            />

            {/* Cinematic top-and-bottom gradient plus a soft-light blend mask for rich presence */}
            <div className={`absolute inset-0 z-10 ${
              activeCategory === 'market'
                ? 'bg-gradient-to-t from-black/85 via-black/10 to-black/35'
                : 'bg-gradient-to-t from-black via-black/40 to-transparent'
            }`} />
            {activeCategory !== 'market' && <div className="absolute inset-0 bg-black/10 z-10" />}

            {/* Banner Text Contents */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 sm:p-8 text-left max-w-2xl">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-gold-pure font-bold font-display mb-1 sm:mb-2 ml-0.5">
                {categoryHeaderDetails.subtitle}
              </span>
              <h2 className="text-lg sm:text-2xl font-bold tracking-[0.1em] text-white uppercase font-display mb-1.5 sm:mb-2 ml-0.5 select-none">
                {categoryHeaderDetails.title}
              </h2>
              <p className="text-zinc-400 text-[10px] sm:text-xs tracking-wide max-w-xl font-sans leading-relaxed select-none ml-0.5">
                {categoryHeaderDetails.desc}
              </p>
            </div>
          </motion.div>
        )}

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
            key={activeCategory}
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
            className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-[480px]:gap-4 sm:gap-8 lg:gap-10"
          >
            {filteredProducts.map((product) => {
              const hasInWishlist = wishlist.includes(product.id);
              
              return (
                <motion.div
                  key={product.id}
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
                  }}
                  onClick={() => onProductSelect(product)}
                  className="group bg-[#060606] border border-white/5 rounded-sm p-1.5 transition-all duration-500 hover:border-gold-pure/30 cursor-pointer flex flex-col justify-between h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.8)]"
                >
                  
                   {/* Aspect Ratio Box with zoom state */}
                  <div className={`rounded-xs overflow-hidden relative bg-black border border-white/5 shrink-0 ${
                    product.category === 'market' ? 'aspect-[16/9]' : 'aspect-square sm:aspect-[4/5]'
                  }`}>
                    
                    {/* Floating popular badge */}
                    {product.popular && (
                      <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 text-[7px] sm:text-[9px] uppercase font-display tracking-widest text-black bg-gold-pure font-bold px-2 py-0.5 sm:px-3 sm:py-1 bg-gradient-to-r from-gold-dark to-gold-pure select-none">
                        POPULAR CHOICE
                      </span>
                    )}

                    <div className={`w-full h-full transition-transform duration-700 ease-out ${
                      product.category === 'market' ? '' : 'group-hover:scale-105'
                    }`}>
                      <SafeImage
                        src={product.images[0]}
                        alt={product.category === 'thobes' ? "ZOAL THOBES & MEN'S WEAR" : product.name}
                        className={product.category === 'market' ? "w-full h-full object-contain" : "w-full h-full object-cover"}
                        category={product.category}
                      />
                    </div>

                    {/* Interactive Overlay Tools */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3.5 rtl:space-x-reverse">
                      
                      {/* View Button */}
                      <button
                        onClick={(e) => handleQuickViewOpen(product, e)}
                        className="w-10 h-10 rounded-full bg-white text-black hover:bg-gold-pure hover:text-black duration-300 flex items-center justify-center cursor-pointer shadow-lg"
                        title="Quick Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(product.id);
                        }}
                        className={`w-10 h-10 rounded-full duration-300 flex items-center justify-center cursor-pointer shadow-lg ${
                          hasInWishlist ? 'bg-rose-600 text-white' : 'bg-black/60 text-white hover:bg-white hover:text-black'
                        }`}
                        title={hasInWishlist ? "Saved in wish list" : "Mark down product"}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>

                      {/* Buy Trigger */}
                      <button
                        disabled={addingId === product.id || successId === product.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          const pid = product.id;
                          if (addingId === pid || successId === pid) return;
                          
                          setAddingId(pid);
                          const opts = getProductOptions(product.category);
                          
                          setTimeout(() => {
                            onAddToCart(product, 1, opts[0]);
                            setAddingId(null);
                            setSuccessId(pid);
                            setTimeout(() => {
                              setSuccessId(null);
                            }, 1500);
                          }, 600);
                        }}
                        className={`w-10 h-10 rounded-full duration-300 flex items-center justify-center cursor-pointer shadow-lg border transition-all ${
                          successId === product.id
                            ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_12px_rgba(212,175,55,0.45)]'
                            : addingId === product.id
                            ? 'bg-zinc-950 border-white/10 text-zinc-600'
                            : 'bg-black/80 border-white/5 text-white hover:bg-gold-pure hover:border-[#D4AF37] hover:text-black mt-0'
                        }`}
                        title="Direct Purchase Order"
                        id={`direct-buy-btn-${product.id}`}
                      >
                        {addingId === product.id ? (
                          <svg className="animate-spin h-4.5 w-4.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : successId === product.id ? (
                          <span className="font-bold text-xs">✓</span>
                        ) : (
                          <ShoppingBag className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                  </div>

                  {/* Card Descriptive details */}
                  <div className="p-1.5 sm:p-5 text-left rtl:text-right border-t border-white/5 mt-0.5 sm:mt-2 bg-black/20 flex flex-col justify-between flex-grow">
                    <div>
                      <span className="hidden sm:block text-[8px] uppercase tracking-[0.2em] text-zinc-500 font-display mb-1">
                        {t(`store.category.${product.category}`, { defaultValue: product.category.replace('_', ' ') })}
                      </span>
                      <h2 className="font-display font-medium text-[9px] sm:text-[13px] leading-tight sm:leading-normal uppercase tracking-widest text-white group-hover:text-gold-pure duration-300 line-clamp-2 sm:line-clamp-1 mb-0 z-10 relative">
                        {i18n.language === 'ar' ? t(`products.${product.id}.name`, { defaultValue: product.name }) : product.name}
                      </h2>
                      <p className="hidden sm:block text-zinc-500 text-[10px] sm:text-[11px] font-sans mt-2 line-clamp-2 leading-relaxed font-light min-h-[32px]">
                        {i18n.language === 'ar' ? t(`products.${product.id}.description`, { defaultValue: product.description }) : product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-1 sm:mt-4 pt-1 sm:pt-4 border-t border-white/5">
                      <span className="text-gold-pure font-mono font-medium text-[9px] sm:text-[11px] tracking-wide leading-none">
                        {formatCurrency(product.price)} <span className="text-[7px] sm:text-[11px]">{t('app.sar')}</span>
                      </span>
                      <div className="flex items-center space-x-1 leading-none">
                        <span className="text-[8px] sm:text-[10px] text-zinc-400 font-mono">★ {product.rating}</span>
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
                <SafeImage
                  src={quickViewProduct.images[0]}
                  alt={quickViewProduct.category === 'thobes' ? "ZOAL THOBES & MEN'S WEAR" : (i18n.language === 'ar' ? t(`products.${quickViewProduct.id}.name`, { defaultValue: quickViewProduct.name }) : quickViewProduct.name)}
                  className="w-full h-full object-cover"
                  category={quickViewProduct.category}
                />
              </div>

              {/* Information Side */}
              <div className="space-y-4 text-left rtl:text-right">
                <div>
                  <span className="text-[8px] uppercase tracking-widest text-gold-pure font-display px-2 py-0.5 border border-gold-pure/20 rounded-full bg-gold-pure/5">
                    {t(`store.category.${quickViewProduct.category}`, { defaultValue: quickViewProduct.category.replace('_', ' ') })}
                  </span>
                  <h3 className="text-white text-base sm:text-lg font-display uppercase tracking-widest font-semibold mt-2">
                    {i18n.language === 'ar' ? t(`products.${quickViewProduct.id}.name`, { defaultValue: quickViewProduct.name }) : quickViewProduct.name}
                  </h3>
                  <p className="text-gold-pure font-mono text-xs tracking-wider mt-1">
                    {formatCurrency(quickViewProduct.price)} {t('app.sar')}
                  </p>
                </div>

                <p className="text-zinc-400 text-[10.5px] leading-relaxed">
                  {i18n.language === 'ar' ? t(`products.${quickViewProduct.id}.description`, { defaultValue: quickViewProduct.description }) : quickViewProduct.description}
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
                    disabled={addingId === quickViewProduct.id || successId === quickViewProduct.id}
                    onClick={() => {
                      const pid = quickViewProduct.id;
                      setAddingId(pid);
                      setTimeout(() => {
                        const finalOpt = selectedOption || getProductOptions(quickViewProduct.category)[0] || 'Standard';
                        onAddToCart(quickViewProduct, 1, finalOpt);
                        setAddingId(null);
                        setSuccessId(pid);
                        setTimeout(() => {
                          setSuccessId(null);
                          setQuickViewProduct(null);
                        }, 1600);
                      }, 750);
                    }}
                    className={`flex-grow py-2.5 font-display text-[9.5px] font-semibold uppercase tracking-widest rounded-xs transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-90 ${
                      successId === quickViewProduct.id
                        ? 'bg-[#D4AF37] text-black shadow-[0_0_12px_rgba(212,175,55,0.35)]'
                        : addingId === quickViewProduct.id
                        ? 'bg-zinc-900 border border-white/5 text-zinc-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-gold-dark to-gold-pure text-black hover:scale-[1.01]'
                    }`}
                  >
                    {addingId === quickViewProduct.id ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{i18n.language === 'ar' ? 'جاري الإضافة...' : 'ADDING...'}</span>
                      </>
                    ) : successId === quickViewProduct.id ? (
                      <span>{i18n.language === 'ar' ? '✓ تمت الإضافة' : '✓ ADDED'}</span>
                    ) : (
                      <span>{t('store.add_to_cart', { defaultValue: 'ADD TO SHOPPING BAG' })}</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onProductSelect(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="px-4 py-2.5 border border-white/10 hover:border-gold-pure/30 text-white rounded-xs text-[9.5px] uppercase font-display tracking-widest cursor-pointer"
                  >
                    {t('store.details')}
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
