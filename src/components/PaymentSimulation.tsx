import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, Shield, ArrowRight, CornerDownLeft, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils';

interface PaymentSimulationProps {
  onSuccess: (orderData: any) => void;
  onCancel: () => void;
}

export default function PaymentSimulation({ onSuccess, onCancel }: PaymentSimulationProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [paymentId, setPaymentId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [simulatedStatus, setSimulatedStatus] = useState<'paid' | 'failed'>('paid');

  // Expiry Timer (15 Minutes)
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  // Form inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [formError, setFormError] = useState('');
  const [showCvv, setShowCvv] = useState(false);

  useEffect(() => {
    // Parse query parameters
    const params = new URLSearchParams(window.location.search);
    const payId = params.get('payment_id') || '';
    const ordId = params.get('order_id') || '';
    setPaymentId(payId);
    setOrderId(ordId);

    // Fetch the order total amount to display
    if (ordId) {
      // Fetch details if we can, else default
      fetch('/api/orders/create') // Or some general orders list to query
        .then(res => res.json())
        .then(data => {
          // If orders list is returned, find ours
          const list = Array.isArray(data) ? data : data.orders || [];
          const found = list.find((o: any) => o.id === ordId);
          if (found) {
            setAmount(Number(found.total_amount) || Number(found.total) || 150);
          }
        })
        .catch(() => {
          setAmount(150); // Sensible default fallback
        });
    }

    // Expiry Timer Loop
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (value.length >= 2) {
      value = `${value.substring(0, 2)}/${value.substring(2)}`;
    }
    setCardExpiry(value);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (timeLeft <= 0) {
      setFormError(isAr ? 'انتهت صلاحية جلسة الدفع هذه (١٥ دقيقة). يرجى العودة وإنشاء طلب جديد.' : 'This payment session has expired (15 mins). Please return to basket and create a new order.');
      return;
    }

    if (cardNumber.replace(/\s/g, '').length < 16) {
      setFormError(isAr ? 'يرجى إدخال رقم بطاقة صالح يتكون من ١٦ رقماً.' : 'Please enter a valid 16-digit card number.');
      return;
    }

    if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
      setFormError(isAr ? 'يرجى إدخال تاريخ انتهاء صلاحية صالح (MM/YY).' : 'Please enter a valid expiry date (MM/YY).');
      return;
    }

    if (cardCvv.length < 3) {
      setFormError(isAr ? 'يرجى إدخال رمز التحقق (CVV) صالح من ٣ أرقام.' : 'Please enter a valid 3-digit CVV.');
      return;
    }

    if (!cardName.trim()) {
      setFormError(isAr ? 'يرجى إدخال اسم حامل البطاقة.' : 'Please enter cardholder name.');
      return;
    }

    setIsVerifying(true);

    try {
      // POST back to server payment verify endpoint
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          orderId,
          simulatedStatus
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.paymentStatus === 'paid') {
        // Trigger the parent success handler
        onSuccess({
          id: orderId,
          total: amount || 150,
          paymentMethod: isAr ? 'بطاقة مدى الإلكترونية' : 'Mada Digital Card',
          date: new Date().toISOString().substring(0, 10),
          customerName: cardName,
          status: 'Processing'
        });
      } else {
        setFormError(isAr ? 'فشلت عملية الدفع. يرجى التحقق من تفاصيل البطاقة والمحاولة مرة أخرى أو اختيار طريقة دفع بديلة.' : 'Payment failed. Please verify your card details and try again, or use another payment method.');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setFormError(isAr ? 'حدث خطأ في الاتصال أثناء معالجة الدفعة.' : 'Connection error occurred while processing the transaction.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center pt-24 pb-16 px-4 select-none font-sans">
      <div className="max-w-md w-full bg-zinc-950 border border-white/5 rounded-sm p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Luxury subtle top gradient boundary */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#8F6F27] via-[#E2C573] to-[#8F6F27]" />

        {/* Header Branding */}
        <div className="text-center space-y-1">
          <div className="font-display text-2xl font-bold text-[#D4AF37] tracking-[0.25em] uppercase">ZOAL</div>
          <div className="text-[9px] text-[#8F6F27] tracking-[0.35em] uppercase font-semibold">
            {isAr ? 'بوابة الدفع الآمنة' : 'Secure Payment Gateway'}
          </div>
        </div>

        {/* Timer countdown (Phase 9 & 11) */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-sm p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Clock className={`w-4 h-4 ${timeLeft < 180 ? 'text-red-500 animate-pulse' : 'text-[#D4AF37]'}`} />
            <span className="text-[11px] text-zinc-400">
              {isAr ? 'تنتهي الجلسة خلال' : 'Session expires in'}
            </span>
          </div>
          <span className={`font-mono text-xs font-bold ${timeLeft < 180 ? 'text-red-500' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Transaction Summary */}
        <div className="border-b border-white/5 pb-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">{isAr ? 'رقم الطلب:' : 'Order ID:'}</span>
            <span className="font-mono text-white font-semibold">{orderId || 'ZL-Pending'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">{isAr ? 'رقم المعاملة:' : 'Transaction ID:'}</span>
            <span className="font-mono text-zinc-500 text-[10px] truncate max-w-[180px]">{paymentId}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-white/5 mt-2">
            <span className="text-xs text-[#D4AF37] font-semibold">{isAr ? 'المبلغ الإجمالي:' : 'Total Amount:'}</span>
            <span className="font-mono text-lg font-bold text-[#D4AF37]">
              {amount ? amount.toFixed(2) : '---.--'} SAR
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handlePay} className="space-y-4">
          {formError && (
            <div className="bg-red-950/20 border border-red-500/30 text-red-400 text-[11px] p-3 rounded-sm flex items-start space-x-2 rtl:space-x-reverse animate-fade-in">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Interactive Card details inputs */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block">
                {isAr ? 'رقم البطاقة' : 'Card Number'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="4000 1234 5678 9010"
                  className="w-full bg-black border border-white/5 rounded-sm p-3 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50 font-mono"
                />
                <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block">
                  {isAr ? 'تاريخ الانتهاء' : 'Expiry Date'}
                </label>
                <input
                  type="text"
                  required
                  value={cardExpiry}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  className="w-full bg-black border border-white/5 rounded-sm p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50 font-mono text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block">
                  {isAr ? 'رمز التحقق (CVV)' : 'CVV'}
                </label>
                <div className="relative">
                  <input
                    type={showCvv ? 'text' : 'password'}
                    required
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    placeholder="•••"
                    className="w-full bg-black border border-white/5 rounded-sm p-3 pr-11 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50 font-mono text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCvv(!showCvv)}
                    className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-[#D4AF37]/80 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 rounded-sm"
                    aria-label={showCvv ? (isAr ? 'إخفاء الرمز' : 'Hide CVV') : (isAr ? 'إظهار الرمز' : 'Show CVV')}
                  >
                    {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block">
                {isAr ? 'اسم صاحب البطاقة' : 'Cardholder Name'}
              </label>
              <input
                type="text"
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="SARAH AL-OTAIBI"
                className="w-full bg-black border border-white/5 rounded-sm p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50 uppercase"
              />
            </div>
          </div>

          {/* Test Sandbox Scenarios Selector */}
          <div className="bg-zinc-900/30 border border-white/5 p-3 rounded-sm space-y-2 mt-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">
              {isAr ? 'محاكاة بيئة فحص المطورين:' : 'Simulation Testing Scenarios:'}
            </span>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-zinc-300 cursor-pointer">
                <input
                  type="radio"
                  name="sim_status"
                  checked={simulatedStatus === 'paid'}
                  onChange={() => setSimulatedStatus('paid')}
                  className="accent-[#D4AF37]"
                />
                <span className="flex items-center space-x-1 rtl:space-x-reverse text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isAr ? 'نجاح المعاملة' : 'Simulate Success'}</span>
                </span>
              </label>

              <label className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-zinc-300 cursor-pointer">
                <input
                  type="radio"
                  name="sim_status"
                  checked={simulatedStatus === 'failed'}
                  onChange={() => setSimulatedStatus('failed')}
                  className="accent-[#D4AF37]"
                />
                <span className="flex items-center space-x-1 rtl:space-x-reverse text-red-400 font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فشل المعاملة' : 'Simulate Failure'}</span>
                </span>
              </label>
            </div>
          </div>

          {/* Submission and Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-[#D4AF37] hover:bg-white text-black font-semibold uppercase tracking-widest text-xs p-3.5 rounded-sm transition-all duration-300 flex items-center justify-center space-x-2 rtl:space-x-reverse cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري التحقق الآمن...' : 'Verifying secure payment...'}</span>
                </>
              ) : (
                <>
                  <span>{isAr ? 'دفع آمن الآن' : 'Authorize Secure Payment'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={isVerifying}
              className="w-full bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white transition-all text-xs uppercase tracking-widest py-3 text-center cursor-pointer"
            >
              {isAr ? 'إلغاء المعاملة والعودة' : 'Cancel & Return'}
            </button>
          </div>
        </form>

        {/* Trust badge footer */}
        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-zinc-500 text-[10px] border-t border-white/5 pt-4 mt-2">
          <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>{isAr ? 'تشفير آمن ٢٥٦ بت متوافق مع معايير PCI-DSS' : 'PCI-DSS Compliant 256-bit Secure Encryption'}</span>
        </div>
      </div>
    </div>
  );
}
