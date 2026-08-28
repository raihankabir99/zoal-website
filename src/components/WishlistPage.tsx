import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Product } from '../types';
import { useGlobalProducts } from '../imageRegistry';
import { ShoppingBag, ArrowLeft, Trash2, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SafeImage } from '../imageRegistry';
import { formatCurrency } from '../utils';

interface WishlistPageProps {
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number, option?: string) => void;
  onSelectProduct: (product: Product) => void;
  setCurrentPage: (page: string) => void;
}

export default function WishlistPage({
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  setCurrentPage,
}: WishlistPageProps) {
  const { t, i18n } = useTranslation();
  const allProducts = useGlobalProducts();
  const wishlistProducts = useMemo(() => {
    return allProducts.filter((p) => wishlist.includes(p.id));
  }, [allProducts, wishlist]);

  // Selection & Bulk Action States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState(false);

  // Gesture handling refs
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);
  const desktopClickTimerRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Individual button state locks & visual indicators in Wishlist
  const [addingId, setAddingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Filter out any selected IDs that are no longer in the wishlist
  const validSelectedIds = useMemo(() => {
    return selectedIds.filter((id) => wishlist.includes(id));
  }, [selectedIds, wishlist]);

  const allSelected =
    wishlistProducts.length > 0 && validSelectedIds.length === wishlistProducts.length;

  const handleToggleSelect = useCallback((productId: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      if (next.length === 0) {
        setIsSelectionMode(false);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds([]);
      setIsSelectionMode(false);
    } else {
      setSelectedIds(wishlistProducts.map((p) => p.id));
    }
  }, [allSelected, wishlistProducts]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
    setIsSelectionMode(false);
  }, []);

  // Long press event handlers for touch (Mobile & Tablet)
  const handleTouchStart = (productId: string, e: React.TouchEvent) => {
    if (isSelectionMode) return;

    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    isLongPressTriggeredRef.current = false;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setIsSelectionMode(true);
      setSelectedIds([productId]);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch (_) {}
      }
    }, 650);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || !longPressTimerRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);

    // If moved more than 8px, user is scrolling: cancel long press
    if (dx > 8 || dy > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Card click handler for all devices
  const handleCardClick = (p: Product, e: React.MouseEvent) => {
    // If long press was just completed, suppress click navigation
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }

    // In selection mode, clicking anywhere on the product row toggles selection
    if (isSelectionMode) {
      handleToggleSelect(p.id);
      return;
    }

    // On touch devices (or small viewports), direct single tap navigates to details
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024;
    if (isTouch) {
      onSelectProduct(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // On Desktop (mouse): Use a brief delay so double click can be detected cleanly
    if (desktopClickTimerRef.current[p.id]) {
      // Second click inside delay window = double click!
      clearTimeout(desktopClickTimerRef.current[p.id]);
      delete desktopClickTimerRef.current[p.id];
      setIsSelectionMode(true);
      setSelectedIds([p.id]);
    } else {
      // First click: schedule navigation, giving time for double click
      desktopClickTimerRef.current[p.id] = setTimeout(() => {
        delete desktopClickTimerRef.current[p.id];
        onSelectProduct(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 260);
    }
  };

  // Explicit double-click handler for desktop as a backup/native trigger
  const handleCardDoubleClick = (p: Product, e: React.MouseEvent) => {
    if (desktopClickTimerRef.current[p.id]) {
      clearTimeout(desktopClickTimerRef.current[p.id]);
      delete desktopClickTimerRef.current[p.id];
    }
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds([p.id]);
    }
  };

  const handleBulkAddToCart = () => {
    if (validSelectedIds.length === 0 || isBulkAdding) return;
    setIsBulkAdding(true);

    const selectedProducts = wishlistProducts.filter((p) => validSelectedIds.includes(p.id));
    selectedProducts.forEach((p) => {
      onAddToCart(p, 1, 'Standard option');
    });

    setTimeout(() => {
      setIsBulkAdding(false);
      setBulkSuccess(true);
      setTimeout(() => {
        setBulkSuccess(false);
        setIsSelectionMode(false);
        setSelectedIds([]);
      }, 1200);
    }, 600);
  };

  const handleBulkDelete = () => {
    if (validSelectedIds.length === 0) return;
    validSelectedIds.forEach((id) => {
      onToggleWishlist(id);
    });
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  return (
    <div className="bg-black text-white min-h-screen pt-[60px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-8 sm:pb-20 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Mobile Header Row */}
        <div className="flex sm:hidden items-center gap-2 mb-2 pb-2 border-b border-white/5">
          <button
            onClick={() => setCurrentPage('home')}
            aria-label="Back to home"
            title="Back to home"
            className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-gold-pure hover:text-white hover:bg-black/80 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-gold-pure shrink-0"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </button>
          <h1 className="text-xl font-bold tracking-wide font-display uppercase text-white whitespace-nowrap truncate">
            {i18n.language === 'ar' ? 'المفضلة' : 'MY WISHLIST'}
          </h1>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:block mb-6">
          <button
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors uppercase text-[10px] tracking-widest mb-6"
          >
            <ArrowLeft className="w-3 h-3 rtl:rotate-180" /> {t('wishlist.back', { defaultValue: 'Back to Home' })}
          </button>
          <h1 className="text-3xl font-bold tracking-wider font-display uppercase text-white border-b border-white/5 pb-6">
            {t('wishlist.title', { defaultValue: 'Your Private Collection' })}
          </h1>
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/5 bg-zinc-950/25 rounded-sm">
            <h2 className="text-white text-md font-display uppercase tracking-widest font-semibold">
              {t('wishlist.empty', { defaultValue: 'Your Wishlist is Empty' })}
            </h2>
            <p className="text-zinc-500 text-xs mt-2">
              {t('wishlist.empty_desc', { defaultValue: 'Save items you love here to easily find or purchase them later.' })}
            </p>
            <button
              onClick={() => setCurrentPage('store')}
              className="mt-6 px-6 py-3 bg-white text-black text-[10px] font-display font-bold uppercase rounded-xs hover:bg-gold-pure transition-colors cursor-pointer"
            >
              {t('wishlist.browse', { defaultValue: 'Explore Products' })}
            </button>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-4">
            {/* Selection & Bulk Action Toolbar (Only displayed when isSelectionMode is active) */}
            {isSelectionMode && (
              <div className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-zinc-950/95 border border-gold-pure/30 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                {/* Left: Cancel X + Select All + Selection Count */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    aria-label="Exit selection mode"
                    title={i18n.language === 'ar' ? 'إلغاء التحديد' : 'Exit selection mode'}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 border border-white/20 text-zinc-300 hover:text-white hover:border-white/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[11px] sm:text-xs font-bold text-gold-pure uppercase tracking-wider whitespace-nowrap tabular-nums-fix">
                      {validSelectedIds.length} {i18n.language === 'ar' ? 'محدد' : 'SELECTED'}
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-[10px] sm:text-xs text-zinc-400 hover:text-white underline underline-offset-2 uppercase tracking-wider cursor-pointer whitespace-nowrap"
                    >
                      {allSelected
                        ? (i18n.language === 'ar' ? 'إلغاء الكل' : 'DESELECT ALL')
                        : (i18n.language === 'ar' ? 'تحديد الكل' : 'SELECT ALL')}
                    </button>
                  </div>
                </div>

                {/* Right: Bulk Action Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Bulk Move to Cart */}
                  <button
                    type="button"
                    disabled={validSelectedIds.length === 0 || isBulkAdding}
                    onClick={handleBulkAddToCart}
                    aria-label="Move selected to cart"
                    title={i18n.language === 'ar' ? 'نقل المحدد للسلة' : 'Move selected to cart'}
                    className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 h-7.5 sm:h-8.5 rounded-xs transition-all select-none whitespace-nowrap ${
                      validSelectedIds.length === 0
                        ? 'bg-zinc-900 border border-white/5 text-zinc-600 cursor-not-allowed'
                        : bulkSuccess
                        ? 'bg-[#D4AF37] border border-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                        : 'bg-gold-pure hover:bg-gold-light text-black text-[10px] sm:text-xs uppercase font-bold tracking-wider shadow-[0_0_12px_rgba(212,175,55,0.25)] active:scale-95 cursor-pointer'
                    }`}
                  >
                    {isBulkAdding ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-black" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="hidden md:inline">{i18n.language === 'ar' ? 'جاري النقل...' : 'MOVING...'}</span>
                      </>
                    ) : bulkSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span className="hidden md:inline">{i18n.language === 'ar' ? 'تم النقل' : 'MOVED'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">
                          {i18n.language === 'ar' ? 'نقل المحدد للسلة' : 'MOVE SELECTED TO CART'}
                        </span>
                        <span className="hidden sm:inline md:hidden text-[10px]">
                          {i18n.language === 'ar' ? 'نقل المحدد' : 'MOVE'}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Bulk Delete */}
                  <button
                    type="button"
                    disabled={validSelectedIds.length === 0}
                    onClick={handleBulkDelete}
                    aria-label="Delete selected products"
                    title={i18n.language === 'ar' ? 'حذف المحدد' : 'Delete selected products'}
                    className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 h-7.5 sm:h-8.5 rounded-xs transition-all select-none whitespace-nowrap ${
                      validSelectedIds.length === 0
                        ? 'border border-white/5 text-zinc-600 cursor-not-allowed'
                        : 'border border-rose-500/30 hover:border-rose-500 hover:bg-rose-950/30 text-rose-400 text-[10px] sm:text-xs uppercase font-bold tracking-wider active:scale-95 cursor-pointer'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">
                      {i18n.language === 'ar' ? 'حذف المحدد' : 'DELETE SELECTED'}
                    </span>
                    <span className="hidden sm:inline md:hidden text-[10px]">
                      {i18n.language === 'ar' ? 'حذف' : 'DELETE'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Product Cards List */}
            {wishlistProducts.map((p) => {
              const isSelected = validSelectedIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onTouchStart={(e) => handleTouchStart(p.id, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  onClick={(e) => {
                    if (isSelectionMode) {
                      handleToggleSelect(p.id);
                    }
                  }}
                  onDoubleClick={(e) => handleCardDoubleClick(p, e)}
                  className={`p-2 sm:p-4 border rounded-sm flex flex-row items-center justify-between gap-2 sm:gap-4 w-full transition-all select-none touch-manipulation ${
                    isSelectionMode ? 'cursor-pointer' : ''
                  } ${
                    isSelectionMode && isSelected
                      ? 'bg-zinc-900/80 border-gold-pure/40 shadow-[inset_0_0_12px_rgba(212,175,55,0.05)]'
                      : 'bg-zinc-900/40 border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Left area: [Checkbox Slot] [Product Image] [Product Info] */}
                  <div className="flex items-center gap-2 sm:gap-3.5 flex-1 min-w-0">
                    {/* Checkbox (Smooth animated slot to prevent abrupt layout jumping) */}
                    <div
                      className={`transition-all duration-200 flex items-center justify-center shrink-0 overflow-hidden ${
                        isSelectionMode ? 'w-5 sm:w-5.5 opacity-100' : 'w-0 opacity-0 pointer-events-none'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(p.id);
                        }}
                        aria-label={isSelected ? `Deselect ${p.name}` : `Select ${p.name}`}
                        className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-xs border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-gold-pure border-gold-pure text-black shadow-[0_0_8px_rgba(212,175,55,0.3)]'
                            : 'bg-black/60 border-white/20 hover:border-gold-pure/50 text-transparent'
                        }`}
                      >
                        <Check className={`w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3] ${isSelected ? 'text-black' : 'opacity-0'}`} />
                      </button>
                    </div>

                    {/* Image & Product Info */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(p, e);
                      }}
                      className="w-14 h-14 sm:w-20 sm:h-20 relative rounded-md sm:rounded-xs overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${i18n.language === 'ar' ? t(`products.${p.id}.name`, { defaultValue: p.name }) : p.name}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCardClick(p, e as any);
                        }
                      }}
                    >
                      <SafeImage
                        product={p}
                        alt={p.category === 'thobes' ? "ZOAL THOBES & MEN'S WEAR" : (i18n.language === 'ar' ? t(`products.${p.id}.name`, { defaultValue: p.name }) : p.name)}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full relative"
                      />
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <h4
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(p, e);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCardClick(p, e as any);
                          }
                        }}
                        className="text-white text-xs sm:text-sm font-semibold sm:font-display sm:uppercase tracking-wide sm:tracking-wider line-clamp-1 sm:line-clamp-2 leading-tight cursor-pointer hover:text-gold-pure transition-colors inline-block w-fit"
                      >
                        {i18n.language === 'ar' ? t(`products.${p.id}.name`, { defaultValue: p.name }) : p.name}
                      </h4>
                      <span className="text-gold-pure text-xs sm:text-xs font-bold mt-0.5 sm:mt-1 block tabular-nums-fix leading-tight">
                        {formatCurrency(p.price)} {t('app.sar')}
                      </span>
                    </div>
                  </div>

                  {/* Right actions: [Individual MOVE TO CART] [Individual Delete] */}
                  <div
                    className="flex items-center justify-end gap-2 sm:gap-3 shrink-0"
                    onTouchStart={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    <button
                      id={`wishlist-move-btn-${p.id}`}
                      disabled={addingId === p.id || successId === p.id}
                      onClick={() => {
                        const pid = p.id;
                        setAddingId(pid);
                        setTimeout(() => {
                          onAddToCart(p, 1, 'Standard option');
                          setAddingId(null);
                          setSuccessId(pid);
                          setTimeout(() => {
                            setSuccessId(null);
                          }, 1500);
                        }, 750);
                      }}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 border text-[10px] sm:text-xs uppercase font-semibold tracking-wider rounded-xs transition-all cursor-pointer select-none whitespace-nowrap ${
                        successId === p.id
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                          : addingId === p.id
                          ? 'border-white/5 text-zinc-500 cursor-not-allowed'
                          : 'border-white/15 hover:border-gold-pure/60 hover:bg-gold-pure/5 text-gold-pure hover:text-white'
                      }`}
                    >
                      {addingId === p.id ? (
                        <>
                          <svg className="animate-spin h-3 w-3 text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span className="hidden xs:inline">{i18n.language === 'ar' ? 'جاري...' : 'ADDING...'}</span>
                        </>
                      ) : successId === p.id ? (
                        <span>{i18n.language === 'ar' ? '✓ تم' : '✓ ADDED'}</span>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{t('wishlist.move_to_cart', { defaultValue: 'Move to Cart' })}</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => onToggleWishlist(p.id)}
                      className="p-1.5 sm:p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-xs transition-colors flex-shrink-0 cursor-pointer flex items-center justify-center"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


