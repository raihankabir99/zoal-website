import React, { useState } from 'react';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Ticket, Sparkles, MoveRight } from 'lucide-react';
import { CartItem } from '../types';
import { COUPONS } from '../data';

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
  const [promoInput, setPromoInput] = useState(couponCode);
  const [promoMsg, setPromoMsg] = useState('');

  // Computations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal > 350 || subtotal === 0 ? 0 : 35;
  const discountAmt = parseFloat((subtotal * (discountPercent / 100)).toFixed(2));
  const finalTotal = parseFloat((subtotal - discountAmt + shippingFee).toFixed(2));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = promoInput.trim().toUpperCase();
    const match = COUPONS.find((c) => c.code === cleanInput);
    if (match) {
      setDiscountPercent(match.discountPercent);
      setCouponCode(match.code);
      setPromoMsg(match.msg);
    } else {
      setPromoMsg('Invalid luxury privilege code');
      setDiscountPercent(0);
      setCouponCode('');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="bg-black text-white min-h-screen pt-36 pb-20 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-zinc-950/20 border border-gold-pure/20 flex items-center justify-center mx-auto text-gold-pure animate-pulse">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-display uppercase tracking-widest text-white">Your Basket is Ethereally Empty</h2>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Explore our boutique coffee, couture garments, and natural sandstone fragrances to secure exceptional offerings.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('store')}
            className="w-full py-4 bg-gradient-to-r from-gold-dark to-gold-pure text-black font-display font-semibold uppercase tracking-widest text-[10px] rounded-sm transition-transform hover:scale-[1.02] cursor-pointer"
          >
            Browse Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="border-b border-white/5 pb-6 mb-10">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-wider font-display uppercase text-white">Your Shopping Basket</h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Review your curated selections before final order placement</p>
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
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-zinc-950 rounded-xs overflow-hidden border border-white/5 shrink-0">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-widest text-gold-pure block">{item.product.category.replace('_', ' ')}</span>
                    <h3 className="text-white text-xs font-display uppercase tracking-wider font-semibold mt-0.5">{item.product.name}</h3>
                    {item.selectedOption && (
                      <span className="text-[10px] text-zinc-500 block font-sans">Option: {item.selectedOption}</span>
                    )}
                    <span className="text-[10.5px] font-mono text-gold-pure block mt-1">{item.product.price} SAR</span>
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
                  <div className="text-right hidden md:block">
                    <span className="text-xs font-mono text-white font-medium">{item.product.price * item.quantity} SAR</span>
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
              <p>Your transactions are secured with military-grade SSL standards. Cash on Delivery (COD), Apple Pay, and local Saudi Mada debit options are fully integrated on the checkout portal.</p>
            </div>

          </div>

          {/* Pricing computations sidebar (columns 9 to 12) */}
          <div className="lg:col-span-4 bg-zinc-950 border border-white/5 p-6 rounded-sm space-y-6">
            
            <h3 className="text-white text-sm font-display uppercase tracking-widest border-b border-white/5 pb-3">Summation Register</h3>

            {/* Coupon Code Panel */}
            <form onSubmit={handleApplyCoupon} className="space-y-2">
              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block flex items-center gap-1">
                <Ticket className="w-3 h-3 text-gold-pure" /> Elite Voucher Code:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="e.g. ZOALGOLD, DAMMAMLX"
                  className="flex-grow bg-black border border-white/5 rounded-xs p-2.5 text-xs focus:outline-none focus:border-gold-pure/35 text-white placeholder-zinc-600 uppercase font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-800 hover:bg-gold-pure hover:text-black font-display font-bold text-[9px] uppercase tracking-widest rounded-xs transition-colors cursor-pointer"
                >
                  Verify
                </button>
              </div>
              
              {promoMsg && (
                <div className="flex items-center space-x-1.5 text-gold-pure text-[10px] font-mono mt-2 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{promoMsg}</span>
                </div>
              )}
              <span className="text-[8px] text-zinc-600 block leading-tight">Try ZOALGOLD (15% OFF) or SAUDIHERITAGE (20% OFF)</span>
            </form>

            {/* Invoices detail elements */}
            <div className="space-y-3 border-t border-white/5 pt-4 text-xs font-sans">
              
              <div className="flex justify-between text-zinc-400">
                <span>Basket Subtotal</span>
                <span>{subtotal.toFixed(2)} SAR</span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between text-gold-pure font-mono">
                  <span>Privilege Rebate ({discountPercent}%)</span>
                  <span>-{discountAmt.toFixed(2)} SAR</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-400">
                <span>VIP Courier Shipping</span>
                <span>{shippingFee === 0 ? 'COMPLIMENTARY' : `${shippingFee.toFixed(2)} SAR`}</span>
              </div>

              {shippingFee > 0 && (
                <p className="text-[9px] text-zinc-600 italic">Add {(350 - subtotal).toFixed(2)} SAR more of items to unlock free premium shipping.</p>
              )}

              <div className="border-t border-white/10 pt-4 flex justify-between text-sm uppercase font-display font-semibold text-white tracking-wider">
                <span>Sovereign Total</span>
                <span className="text-gold-pure">{finalTotal.toFixed(2)} SAR</span>
              </div>

            </div>

            {/* Checkout proceed */}
            <button
              onClick={() => {
                setCurrentPage('checkout');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-4 bg-gradient-to-r from-gold-dark via-gold-pure to-gold-light text-black font-display font-bold uppercase tracking-widest text-[10.5px] rounded-sm transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_15px_rgba(212,175,55,0.15)]"
            >
              <span>Proceed to Checkout VIP</span>
              <MoveRight className="w-4 h-4 animate-pulse" />
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
