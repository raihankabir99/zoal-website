import React, { useState } from 'react';
import { ShoppingBag, CreditCard, ChevronRight, CheckCircle, Truck, ShieldAlert, ArrowLeft, Landmark } from 'lucide-react';
import { CartItem, Order } from '../types';

interface CheckoutProps {
  cart: CartItem[];
  discountPercent: number;
  couponCode: string;
  onOrderSuccess: (order: Order) => void;
  onBackToCart: () => void;
}

export default function Checkout({
  cart,
  discountPercent,
  couponCode,
  onOrderSuccess,
  onBackToCart,
}: CheckoutProps) {
  // Billing details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Dammam');
  const [address, setAddress] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'vip'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'mada' | 'applepay' | 'cod'>('mada');

  // Credit Card Mada fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const baseShipping = subtotal > 350 || subtotal === 0 ? 0 : 35;
  const deliverySurcharge = deliveryOption === 'vip' ? 50 : 0;
  const shippingFee = baseShipping + deliverySurcharge;
  const discountAmt = parseFloat((subtotal * (discountPercent / 100)).toFixed(2));
  const finalTotal = parseFloat((subtotal - discountAmt + shippingFee).toFixed(2));

  // Handle finalize order submission
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      alert('Kindly fill in all required customer coordinates.');
      return;
    }

    const orderId = `ZL-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      date: new Date().toISOString().substring(0, 10),
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        selectedOption: item.selectedOption
      })),
      subtotal,
      shipping: shippingFee,
      discount: discountAmt,
      total: finalTotal,
      status: 'Pending',
      customerName: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: `${address.trim()}, ${city}, Saudi Arabia`,
      paymentMethod: paymentMethod === 'mada' ? 'Mada Card' : paymentMethod === 'applepay' ? 'Apple Pay' : 'Cash on Delivery',
      trackingNumber: `ZLT-TRK-${Math.floor(100000 + Math.random() * 900000)}`
    };

    onOrderSuccess(newOrder);
  };

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Head */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-6 mb-10 gap-4">
          <div>
            <button
              onClick={onBackToCart}
              className="inline-flex items-center space-x-2 text-zinc-500 hover:text-gold-pure transition-colors text-xs uppercase tracking-widest mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Basket</span>
            </button>
            <h1 className="text-xl sm:text-3xl font-semibold tracking-wider font-display uppercase">Sovereign Checkout Portal</h1>
          </div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] px-3 py-1.5 border border-gold-pure/20 rounded-md bg-gold-pure/5">
            Cart Total: {finalTotal} SAR
          </div>
        </div>

        {/* Form Grid */}
        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inputs Section (columns 1 to 7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Patron Coordinates Box */}
            <div className="bg-zinc-950 border border-white/5 rounded-sm p-6 space-y-4">
              <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-3">I. Patron Coordinates</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest">Full Name:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Abdullah Al-Saudi"
                    className="w-full bg-black border border-white/5 rounded-sm p-2.5 text-xs text-white focus:outline-none focus:border-gold-pure/45"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest">Email Address:</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="abdullah@luxury.sa"
                    className="w-full bg-black border border-white/5 rounded-sm p-2.5 text-xs text-white focus:outline-none focus:border-gold-pure/45"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest">Phone Number (Required for WhatsApp Updates):</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 50 123 4567"
                    className="w-full bg-black border border-white/5 rounded-sm p-2.5 text-xs text-white focus:outline-none focus:border-gold-pure/45"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest">Saudi City Location:</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-sm p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-gold-pure/45"
                  >
                    <option value="Dammam">Dammam</option>
                    <option value="Khobar">Al-Khobar</option>
                    <option value="Riyadh">Riyadh (Central Hub)</option>
                    <option value="Jeddah">Jeddah (Red Sea Flagship)</option>
                  </select>
                </div>

              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-400 uppercase tracking-widest">Physical Shipping Address (District, Street, Villa/Bldg):</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Al Shati District, Prince Mohammad St, Villa 4B"
                  className="w-full bg-black border border-white/5 rounded-sm p-2.5 text-xs text-white focus:outline-none focus:border-gold-pure/45"
                />
              </div>

            </div>

            {/* Courier Toggles Box */}
            <div className="bg-zinc-950 border border-white/5 rounded-sm p-6 space-y-4">
              <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-3">II. Courier Delivery Standard</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <button
                  type="button"
                  onClick={() => setDeliveryOption('standard')}
                  className={`p-4 border rounded-sm text-left flex items-start gap-3 cursor-pointer transition-all ${
                    deliveryOption === 'standard'
                      ? 'border-gold-pure bg-gold-pure/5 text-white'
                      : 'border-white/5 bg-black/40 text-zinc-500 hover:border-white/10'
                  }`}
                >
                  <Truck className="w-5 h-5 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-display font-medium uppercase tracking-wider text-white">Classic Delivery</h4>
                    <p className="text-[10px] text-zinc-400 mt-1">2-3 Business Days. Managed in sealed climate boxes.</p>
                    <p className="text-[10.5px] text-gold-pure font-mono mt-1">Complimentary over 350 SAR</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryOption('vip')}
                  className={`p-4 border rounded-sm text-left flex items-start gap-3 cursor-pointer transition-all ${
                    deliveryOption === 'vip'
                      ? 'border-gold-pure bg-gold-pure/5 text-white'
                      : 'border-white/5 bg-black/40 text-zinc-500 hover:border-white/10'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 text-gold-pure mt-0.5" />
                  <div>
                    <h4 className="text-xs font-display font-medium uppercase tracking-wider text-white">VIP Same-Day Express</h4>
                    <p className="text-[10px] text-zinc-400 mt-1">Guaranteed within 5 hours in Dammam/Khobar.</p>
                    <p className="text-[10.5px] text-gold-pure font-mono mt-1">+50 SAR Special Courier</p>
                  </div>
                </button>

              </div>
            </div>

            {/* Secure payment elements */}
            <div className="bg-zinc-950 border border-white/5 rounded-sm p-6 space-y-4">
              <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-3">III. Sealed Payment Process</h3>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mada', label: 'Mada / Visa', icon: CreditCard },
                  { id: 'applepay', label: 'Apple Pay', icon: Landmark },
                  { id: 'cod', label: 'Cash on Delivery', icon: Truck },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`py-3.5 px-3 border rounded-xs text-[10px] uppercase font-semibold tracking-wider flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === pm.id
                        ? 'border-gold-pure bg-gold-pure/5 text-white'
                        : 'border-white/5 bg-black/40 text-zinc-500 hover:border-white/12'
                    }`}
                  >
                    <pm.icon className="w-4 h-4 text-gold-pure" />
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>

              {/* Conditionally show Mada Fields */}
              {paymentMethod === 'mada' && (
                <div className="p-4 bg-black/60 border border-white/5 rounded-xs space-y-3 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest">Cardholder Name:</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="e.g. Abdullah Al-Saudi"
                      className="w-full bg-black border border-white/5 rounded-xs p-2 text-xs text-white placeholder-zinc-700 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest">Mada / Credit Card Number:</label>
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4000 1234 5678 9010"
                      className="w-full bg-black border border-white/5 rounded-xs p-2 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase tracking-widest">Expiry Date:</label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-black border border-white/5 rounded-xs p-2 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 uppercase tracking-widest">Security CVV:</label>
                      <input
                        type="password"
                        maxLength={3}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-black border border-white/5 rounded-xs p-2 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'applepay' && (
                <div className="p-6 bg-black/60 border border-white/5 rounded-xs text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center mx-auto text-sm font-semibold tracking-wider font-sans">
                    
                  </div>
                  <p className="text-zinc-300 text-xs">Double-click side button to pay securely with FaceID.</p>
                  <p className="text-zinc-500 text-[9px] uppercase tracking-widest">Apple Pay sandbox configuration verified</p>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="p-4 bg-amber-950/15 border border-amber-900/30 rounded-xs flex items-start gap-2 text-xs text-zinc-400">
                  <ShieldAlert className="w-4 h-4 text-gold-pure mt-0.5 shrink-0" />
                  <p>Cash on Delivery incurs an extra +15 SAR accounting handler fee. Please keep exact change ready upon physical courier arrival in Dammam.</p>
                </div>
              )}

            </div>

          </div>

          {/* Cart items review sidebar (columns 8 to 12) */}
          <div className="lg:col-span-5 bg-zinc-950 border border-white/5 p-6 rounded-sm space-y-6">
            <h3 className="text-white text-sm font-display uppercase tracking-widest border-b border-white/5 pb-3">Subtotal Summary</h3>
            
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 divide-y divide-white/5">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center text-xs pt-3 first:pt-0">
                  <div className="space-y-0.5">
                    <p className="text-white font-medium uppercase tracking-wider block font-sans truncate max-w-[200px]">{item.product.name}</p>
                    <p className="text-zinc-500 text-[10px]">Qty: {item.quantity} × {item.product.price} SAR</p>
                  </div>
                  <span className="text-zinc-300 font-mono font-medium">{item.product.price * item.quantity} SAR</span>
                </div>
              ))}
            </div>

            {/* Price lines */}
            <div className="space-y-3 border-t border-white/5 pt-4 text-xs font-sans">
              
              <div className="flex justify-between text-zinc-400">
                <span>Vouchers applied:</span>
                <span className="uppercase font-mono text-gold-pure">{couponCode || 'None'}</span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between text-gold-pure font-mono">
                  <span>Rebate Amount</span>
                  <span>-{discountAmt.toFixed(2)} SAR</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-400">
                <span>Shipping Expenses</span>
                <span>{shippingFee === 0 ? 'COMPLIMENTARY' : `${shippingFee.toFixed(2)} SAR`}</span>
              </div>

              <div className="border-t border-white/10 pt-4 flex justify-between text-sm uppercase font-display font-semibold text-white tracking-wider">
                <span>Sovereign Pay</span>
                <span className="text-gold-pure">{finalTotal.toFixed(2)} SAR</span>
              </div>

            </div>

            {/* Authorize button */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-gold-dark via-gold-pure to-gold-light text-black font-display font-bold uppercase tracking-widest text-[10px] rounded-sm transition-all duration-300 hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              Authorize Order Placement ({finalTotal} SAR)
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}
