import React, { useEffect, useRef, useState } from 'react';
import { Clock, Shield, XCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  orderId?: string;
  amount?: number;
  onSuccess: (orderData: any) => void;
  onCancel: () => void;
  notificationEngine?: any;
}

declare global {
  interface Window {
    Moyasar?: any;
  }
}

const MOYASAR_JS = 'https://cdn.moyasar.com/mpf/1.12/moyasar.js';
const MOYASAR_CSS = 'https://cdn.moyasar.com/mpf/1.12/moyasar.css';

function loadAsset(kind: 'script' | 'style', url: string) {
  return new Promise<void>((resolve, reject) => {
    if (kind === 'script') {
      if (window.Moyasar) return resolve();
      const existing = document.querySelector(`script[src="${url}"]`) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Unable to load Moyasar payment library.')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Unable to load Moyasar payment library.'));
      document.head.appendChild(script);
      return;
    }
    if (!document.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
    resolve();
  });
}

function getAuthToken() {
  return localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token') || '';
}

export default function RealPaymentGateway({ orderId: providedOrderId, amount: providedAmount, onSuccess, onCancel, notificationEngine }: Props) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const formRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [orderId, setOrderId] = useState(providedOrderId || '');
  const [amount, setAmount] = useState<number | null>(typeof providedAmount === 'number' ? providedAmount : null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'verifying' | 'success'>('loading');
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentOrderId = providedOrderId || params.get('order_id') || '';
    const gatewayPaymentId = params.get('id') || '';
    setOrderId(currentOrderId);

    const timer = window.setInterval(() => setTimeLeft(value => Math.max(0, value - 1)), 1000);

    async function verifyReturnedPayment() {
      if (!gatewayPaymentId || !currentOrderId) return false;
      setStatus('verifying');
      try {
        const token = getAuthToken();
        if (!token) throw new Error('Your customer session has expired. Please sign in again.');
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ paymentId: gatewayPaymentId, orderId: currentOrderId })
        });
        const data = await response.json();
        if (!response.ok || !data.success || data.paymentStatus !== 'paid') {
          throw new Error(data.error || data.message || 'Payment verification failed.');
        }
        setStatus('success');
        onSuccess({
          id: currentOrderId,
          total: Number(data.amount || amount || 0),
          paymentId: gatewayPaymentId,
          paymentMethod: 'Moyasar',
          date: new Date().toISOString().substring(0, 10),
          status: 'Processing'
        });
      } catch (err: any) {
        setError(err?.message || 'Payment verification failed.');
        setStatus('ready');
      }
      return true;
    }

    async function loadAuthoritativeAmount() {
      if (typeof providedAmount === 'number' && providedAmount > 0) return providedAmount;
      const token = getAuthToken();
      if (!token) throw new Error('Your customer session has expired. Please sign in again.');
      const orderResponse = await fetch('/api/orders?limit=100&page=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!orderResponse.ok) throw new Error(`Unable to load the authoritative order amount (${orderResponse.status}).`);
      const orderPayload = await orderResponse.json();
      const rows = Array.isArray(orderPayload?.data?.orders)
        ? orderPayload.data.orders
        : Array.isArray(orderPayload?.orders)
          ? orderPayload.orders
          : [];
      const found = rows.find((row: any) => String(row.id) === String(currentOrderId));
      const total = Number(found?.total_amount ?? found?.total ?? 0);
      if (!total || total <= 0) throw new Error('Unable to determine the authoritative order amount.');
      return total;
    }

    async function init() {
      try {
        const configResponse = await fetch('/api/payments/config');
        const config = await configResponse.json();
        if (!configResponse.ok || !config.publishableKey) throw new Error(config.error || 'Moyasar payment gateway is not configured.');
        if (import.meta.env.PROD && String(config.publishableKey).startsWith('pk_test_')) throw new Error('Production is still using a Moyasar test publishable key.');

        if (await verifyReturnedPayment()) return;
        if (!currentOrderId) throw new Error('Missing order ID for payment session.');

        const total = await loadAuthoritativeAmount();
        setAmount(total);
        await loadAsset('style', MOYASAR_CSS);
        await loadAsset('script', MOYASAR_JS);
        mountForm(total, currentOrderId, config.publishableKey);
      } catch (err: any) {
        setError(err?.message || 'Unable to initialize secure payment gateway.');
        setStatus('ready');
      }
    }

    function mountForm(total: number, id: string, publishableKey: string) {
      if (initializedRef.current || !formRef.current || !window.Moyasar) return;
      initializedRef.current = true;
      window.Moyasar.init({
        element: '.mysr-form',
        amount: Math.round(total * 100),
        currency: 'SAR',
        description: `ZOAL Order ${id}`,
        publishable_api_key: publishableKey,
        callback_url: `${window.location.origin}/payment-simulate?order_id=${encodeURIComponent(id)}`,
        metadata: { order_id: String(id) },
        supported_networks: ['mada', 'visa', 'mastercard', 'amex', 'unionpay'],
        methods: ['creditcard'],
        language: isAr ? 'ar' : 'en',
        on_completed: async (payment: any) => {
          const token = getAuthToken();
          if (!token) return;
          await fetch('/api/payments/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ paymentId: payment?.id, orderId: id })
          });
        },
        on_failure: async (message: string) => {
          const text = message || (isAr ? 'فشلت عملية الدفع.' : 'Payment failed.');
          setError(text);
          notificationEngine?.addNotification?.({ title: isAr ? 'فشل الدفع' : 'Payment Failed', message: text, category: 'Payment', priority: 'high', target_role: 'customer' });
        }
      });
      setStatus('ready');
    }

    init();
    return () => window.clearInterval(timer);
  }, [providedOrderId, providedAmount, onSuccess, isAr, notificationEngine]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-sm p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold tracking-[0.25em] text-[#D4AF37]">ZOAL</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mt-1">{isAr ? 'بوابة الدفع الآمنة' : 'Secure Moyasar Payment'}</div>
        </div>

        <div className="flex items-center justify-between border border-white/5 bg-zinc-900/40 p-3 mb-5 text-xs">
          <span className="text-zinc-400">{isAr ? 'الطلب' : 'Order'}: <strong className="text-white font-mono">{orderId || '—'}</strong></span>
          <span className={timeLeft < 180 ? 'text-red-400' : 'text-[#D4AF37]'}><Clock className="inline w-3.5 h-3.5 mr-1" />{mins}:{secs.toString().padStart(2, '0')}</span>
        </div>

        {error && <div className="mb-4 p-3 border border-red-500/30 bg-red-950/20 text-red-300 text-xs"><XCircle className="inline w-4 h-4 mr-2" />{error}</div>}
        {status === 'verifying' && <div className="mb-4 p-3 border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37] text-xs">{isAr ? 'جاري التحقق من الدفع من الخادم...' : 'Verifying payment server-side...'}</div>}
        {status === 'success' && <div className="mb-4 p-3 border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 text-xs"><CheckCircle className="inline w-4 h-4 mr-2" />{isAr ? 'تم التحقق من الدفع بنجاح.' : 'Payment verified successfully.'}</div>}

        <div ref={formRef} className="mysr-form min-h-[280px]" />

        <div className="mt-5 flex items-center gap-2 text-[10px] text-zinc-500">
          <Shield className="w-4 h-4 text-[#D4AF37]" />
          <span>{isAr ? 'بيانات البطاقة تُعالج مباشرة بواسطة Moyasar ولا تمر عبر خادم ZOAL.' : 'Card details are collected directly by Moyasar and never sent to the ZOAL server.'}</span>
        </div>

        <button type="button" onClick={onCancel} className="mt-5 w-full py-3 border border-white/10 text-zinc-400 hover:text-white text-xs uppercase tracking-widest">{isAr ? 'إلغاء' : 'Cancel'}</button>
      </div>
    </div>
  );
}
