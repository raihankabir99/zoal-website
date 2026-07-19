import React, { useState } from 'react';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, MoveRight } from 'lucide-react';
import { CartItem } from '../types';
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
            <h2 className="text-xl font-display uppercase tracking-widest text-white">{t('cart.empty', { defaultValue: 'Your Basket is Ethereally Empty' })}</h2>
          </div>
          <button
            onClick={() => setCurrentPage('store')}
            className="w-full py-4 bg-gradient-to-r from-gold-dark to-gold-pure text-black font-display font-semibold uppercase tracking-widest text-[10px] rounded-sm transition-transform hover:scale-[1.02] cursor-pointer"
          >
            {t('cart.continue', { defaultValue: 'Browse Collections' })}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="border-b border-white/5 pb-6 mb-10">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-wider font-display uppercase text-white">{t('cart.title')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cart Table list (columns 1 to 8) */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-white/5 bg-[#060606] hover:border-gold-pure/15 transition-all rounded-sm gap-4"
              >
                
                {/* Thumb Image & titles */}
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="w-20 h-20 bg-zinc-950 rounded-xs overflow-hidden border border-white/5 shrink-0">
                    <SafeImage src={item.product.images[0]} alt={item.product.category === 'thobes' ? "ZOAL THOBES & MEN'S WEAR" : (i18n.language === 'ar' ? t(`products.${item.product.id}.name`, { defaultValue: item.product.name }) : item.product.name)} className={item.product.category === 'market' ? "w-full h-full object-contain" : "w-full h-full object-cover"} containerClassName="w-full h-full relative" category={item.product.category} />
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-widest text-gold-pure block">{t(`store.category.${item.product.category}`, { defaultValue: item.product.category.replace('_', ' ') })}</span>
                    <h3 className="text-white text-xs font-display uppercase tracking-wider font-semibold mt-0.5">{i18n.language === 'ar' ? t(`products.${item.product.id}.name`, { defaultValue: item.product.name }) : item.product.name}</h3>
                    {item.selectedOption && (
                      <span className="text-[10px] text-zinc-500 block font-sans">Option: {item.selectedOption}</span>
                    )}
                    <span className="text-[10.5px] font-mono text-gold-pure block mt-1">{formatCurrency(item.product.price)} {t('app.sar')}</span>
                  </div>
                </div>

                {/* Adjustments & actions */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-8">
                  
                  {/* Plus/minus */}
                  <div className="flex items-center border border-white/10 rounded overflow-hidden bg-black">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                      className="px-2.5 py-1 text-zinc-500 hover:text-white cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 font-mono text-xs text-white select-none">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                      className="px-2.5 py-1 text-zinc-500 hover:text-white cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Combined Value */}
                  <div className="text-right rtl:text-left hidden md:block">
                    <span className="text-xs font-mono text-white font-medium">{formatCurrency(item.product.price * item.quantity)} {t('app.sar')}</span>
                  </div>

                  {/* Trash cleaner */}
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="p-2 text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>

                </div>

              </div>

            ))}

            {/* Quick privileges guidelines */}
            <div className="p-4 border border-zinc-900 rounded-sm bg-zinc-950/20 text-xs text-zinc-500 flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-gold-pure/70 shrink-0" />
              <p>Secured with premium SSL encryption. We accept Apple Pay, local Mada debit cards, and Cash on Delivery (COD) at your convenience</p>
            </div>

          </div>

          {/* Pricing computations sidebar (columns 9 to 12) */}
          <div className="lg:col-span-4 bg-zinc-950 border border-white/5 p-6 rounded-sm space-y-6">
            
            <h3 className="text-white text-sm font-display uppercase tracking-widest border-b border-white/5 pb-3">{t('checkout.summary', { defaultValue: 'ORDER SUMMARY' })}</h3>

            {/* Price lines */}
            <div className="space-y-4 pt-4 text-sm font-sans mb-6">
              
              <div className="flex justify-between text-zinc-300">
                <span>{t('cart.subtotal')}</span>
                <span className="font-mono">{formatCurrency(subtotal)} {t('app.sar')}</span>
              </div>

              <div className="flex justify-between text-zinc-300">
                <span>{t('cart.shipping')}</span>
                <span className="font-mono">{shippingFee === 0 ? 'Free' : `${formatCurrency(shippingFee)} ${t('app.sar')}`}</span>
              </div>

              <div className="border-t border-white/10 pt-5 mt-2 flex justify-between text-lg uppercase font-display font-medium text-white tracking-wider">
                <span>{t('cart.total')}</span>
                <span className="text-gold-pure font-mono font-bold rtl:text-left">{formatCurrency(finalTotal)} {t('app.sar')}</span>
              </div>

            </div>

            {/* Checkout proceed */}
            <button
              onClick={() => {
                setCurrentPage('checkout');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-5 bg-gold-pure hover:bg-gold-light text-black font-display font-bold uppercase tracking-widest text-xs rounded-sm transition-transform hover:scale-[1.02] flex items-center justify-center gap-3 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              <span>{t('cart.checkout')}</span>
              <MoveRight className="w-5 h-5 animate-pulse rtl:rotate-180" />
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
