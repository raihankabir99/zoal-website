import React from 'react';
import { ShoppingBag, Trash2, ShieldCheck, MoveRight, ArrowLeft } from 'lucide-react';
import { CartItem, Product } from '../types';
import { useTranslation } from 'react-i18next';
import { SafeImage } from '../imageRegistry';
import { formatCurrency } from '../utils';

interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  couponCode: string;
  setCouponCode: (code: string) => void;
  discountPercent: number;
  setDiscountPercent: (percent: number) => void;
  setCurrentPage: (page: string) => void;
  onSelectProduct?: (product: Product) => void;
}

export default function Cart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  couponCode,
  setCouponCode,
  discountPercent,
  setDiscountPercent,
  setCurrentPage,
  onSelectProduct,
}: CartProps) {
  const { t, i18n } = useTranslation();

  // Computations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 350 || subtotal === 0 ? 0 : 35;
  const finalTotal = parseFloat((subtotal + shippingFee).toFixed(2));

  if (cart.length === 0) {
    return (
      <div className="bg-black text-white min-h-screen pt-[96px] sm:pt-[100px] md:pt-[104px] lg:pt-[108px] pb-20 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-zinc-950/20 border border-gold-pure/20 flex items-center justify-center mx-auto text-gold-pure animate-pulse">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-display uppercase tracking-widest text-white">{t('cart.empty', { defaultValue: 'Your Bag is Empty' })}</h2>
            <p className="text-zinc-500 text-xs mt-2">{t('cart.empty_desc', { defaultValue: 'Discover our latest collections and find something you love!' })}</p>
          </div>
          <button
            onClick={() => setCurrentPage('store')}
            className="w-full py-4 bg-gradient-to-r from-gold-dark to-gold-pure text-black font-display font-semibold uppercase tracking-widest text-[10px] rounded-sm transition-transform hover:scale-[1.02] cursor-pointer"
          >
            {t('cart.continue', { defaultValue: 'Start Shopping' })}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen pt-[60px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-8 sm:pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
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
            {i18n.language === 'ar' ? 'سلة التسوق' : 'SHOPPING BAG'}
          </h1>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:block mb-10">
          <button
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors uppercase text-[10px] tracking-widest mb-8"
          >
            <ArrowLeft className="w-3 h-3 rtl:rotate-180" /> {t('wishlist.back', { defaultValue: 'Back to Home' })}
          </button>
          <div className="border-b border-white/5 pb-6">
            <h1 className="text-4xl font-semibold tracking-wider font-display uppercase text-white">{t('cart.title')}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-8 items-start">
          
          {/* Cart Table list (columns 1 to 8) */}
          <div className="lg:col-span-8 space-y-2 sm:space-y-4">
            {cart.map((item, idx) => (
              <div
                key={`cart-item-${item.product.id}-${item.selectedOption || ''}-${idx}`}
                className="flex flex-row items-center justify-between p-2 sm:p-4 border border-white/10 bg-zinc-900/40 hover:border-gold-pure/25 hover:bg-zinc-900/60 transition-all rounded-sm gap-2 sm:gap-4 w-full group select-none"
              >
                
                {/* Thumb Image & titles */}
                <div className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectProduct) {
                        onSelectProduct(item.product);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${i18n.language === 'ar' ? (item.product.title_ar || item.product.nameAr || item.product.name) : (item.product.nameEn || item.product.name)}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onSelectProduct) {
                          onSelectProduct(item.product);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }
                    }}
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-md sm:rounded-xs overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <SafeImage product={item.product} alt={item.product.category === 'thobes' ? "ZOAL THOBES & MEN'S WEAR" : (i18n.language === 'ar' ? (item.product.title_ar || item.product.nameAr || t(`products.${item.product.id}.name`, { defaultValue: item.product.name })) : (item.product.nameEn || item.product.name))} className={item.product.category === 'market' ? "w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" : "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"} containerClassName="w-full h-full relative" category={item.product.category} />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5 sm:gap-1">
                    <span className="text-[9px] sm:text-[8px] uppercase tracking-wider sm:tracking-widest text-neutral-400 sm:text-gold-pure block leading-tight truncate">{t(`store.category.${item.product.category}`, { defaultValue: item.product.category.replace('_', ' ') })}</span>
                    <h3
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectProduct) {
                          onSelectProduct(item.product);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${i18n.language === 'ar' ? (item.product.title_ar || item.product.nameAr || item.product.name) : (item.product.nameEn || item.product.name)}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onSelectProduct) {
                            onSelectProduct(item.product);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }
                      }}
                      className="text-white text-xs sm:text-xs sm:font-display sm:uppercase tracking-wide sm:tracking-wider font-semibold line-clamp-1 sm:line-clamp-2 leading-tight cursor-pointer hover:text-gold-pure transition-colors inline-block w-fit"
                    >
                      {i18n.language === 'ar' ? (item.product.title_ar || item.product.nameAr || t(`products.${item.product.id}.name`, { defaultValue: item.product.name })) : (item.product.nameEn || item.product.name)}
                    </h3>
                    {item.selectedOption && (
                      <span className="text-[10px] sm:text-[10px] text-neutral-400 sm:text-zinc-500 block font-sans leading-tight truncate">{t('cart.option_prefix', { defaultValue: 'Option:' })} {item.selectedOption}</span>
                    )}
                    <span className="text-xs sm:text-[10.5px] font-bold sm:font-normal font-sans text-gold-pure block tabular-nums-fix leading-tight">{formatCurrency(item.product.price)} {t('app.sar')}</span>
                  </div>
                </div>

                {/* Adjustments & actions */}
                <div
                  className="flex items-center justify-end gap-1.5 sm:gap-8 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  
                  {/* Plus/minus */}
                  <div className="flex items-center border border-white/5 hover:border-white/10 rounded-xs bg-transparent transition-colors h-7 sm:h-8">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQuantity(item.product.id, -1);
                      }}
                      className="w-6 sm:w-7 h-full text-xs text-zinc-400 hover:text-white hover:bg-white/[0.03] cursor-pointer flex items-center justify-center active:scale-95 transition-all"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="px-1.5 sm:px-2.5 font-sans text-xs text-white select-none tabular-nums-fix flex items-center justify-center min-w-[20px]">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateQuantity(item.product.id, 1);
                      }}
                      className="w-6 sm:w-7 h-full text-xs text-zinc-400 hover:text-white hover:bg-white/[0.03] cursor-pointer flex items-center justify-center active:scale-95 transition-all"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Combined Value */}
                  <div className="text-right rtl:text-left hidden md:block">
                    <span className="text-xs font-sans text-white font-medium tabular-nums-fix">{formatCurrency(item.product.price * item.quantity)} {t('app.sar')}</span>
                  </div>

                  {/* Trash cleaner */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.product.id);
                    }}
                    className="p-1.5 sm:p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-xs transition-colors cursor-pointer flex-shrink-0 flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-rose-500/30"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>

                </div>

              </div>

            ))}

            {/* Quick privileges guidelines */}
            <div className="p-2 sm:p-4 border border-zinc-900 rounded-sm bg-zinc-950/20 text-[10px] sm:text-xs text-zinc-500 flex items-center gap-2 sm:gap-3 leading-tight sm:leading-normal">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gold-pure/70 shrink-0" />
              <p>{t('cart.secured_guarantee', { defaultValue: 'Secured with premium SSL encryption. We accept Apple Pay, local Mada debit cards, and Cash on Delivery (COD) at your convenience' })}</p>
            </div>

          </div>

          {/* Pricing computations sidebar (columns 9 to 12) */}
          <div className="lg:col-span-4 bg-zinc-950 border border-white/5 p-3.5 sm:p-6 rounded-sm space-y-3 sm:space-y-6">
            
            <h3 className="text-neutral-400 sm:text-white text-xs sm:text-sm font-semibold sm:font-display uppercase tracking-widest border-b border-white/5 pb-2 sm:pb-3">{t('checkout.summary', { defaultValue: 'ORDER SUMMARY' })}</h3>

            {/* Price lines */}
            <div className="space-y-1.5 sm:space-y-4 pt-1.5 sm:pt-4 text-xs sm:text-sm font-sans mb-3 sm:mb-6">
              
              <div className="flex justify-between text-neutral-300 py-1 sm:py-0">
                <span>{t('cart.subtotal')}</span>
                <span className="font-sans tabular-nums-fix">{formatCurrency(subtotal)} {t('app.sar')}</span>
              </div>

              <div className="flex justify-between text-neutral-300 py-1 sm:py-0">
                <span>{t('cart.shipping')}</span>
                <span className="font-sans tabular-nums-fix">{shippingFee === 0 ? t('cart.free_shipping_label', { defaultValue: 'Free' }) : `${formatCurrency(shippingFee)} ${t('app.sar')}`}</span>
              </div>

              <div className="border-t border-white/10 pt-3 sm:pt-5 mt-1 sm:mt-2 flex justify-between text-sm sm:text-lg uppercase font-display font-medium text-white tracking-wider">
                <span>{t('cart.total')}</span>
                <span className="text-gold-pure font-sans font-bold rtl:text-left tabular-nums-fix">{formatCurrency(finalTotal)} {t('app.sar')}</span>
              </div>

            </div>

            {/* Checkout proceed */}
            <button
              onClick={() => {
                sessionStorage.setItem('zoal_checkout_source', 'basket');
                sessionStorage.removeItem('zoal_checkout_product');
                setCurrentPage('checkout');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-3 sm:py-5 bg-gold-pure hover:bg-gold-light text-black font-display font-bold uppercase tracking-widest text-xs rounded-sm transition-transform hover:scale-[1.02] flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              <span>{t('cart.checkout')}</span>
              <MoveRight className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse rtl:rotate-180" />
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
