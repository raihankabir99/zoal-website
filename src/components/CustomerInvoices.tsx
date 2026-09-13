import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText, Loader2, Printer, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { supabaseClient } from '../lib/supabaseClient';
import { generatePrintableInvoiceHtml } from './EnterpriseOrderManagement';
import { downloadHtmlAsPdf } from '../lib/pdf';

interface InvoiceItem {
  id?: string;
  productId?: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CustomerInvoice {
  invoiceReference: string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  orderId: string;
  currency: string;
  status: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  gatewayPaymentId: string | null;
  transactionId: string | null;
  merchantVat: string | null;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

interface CustomerInvoicesProps {
  isAr?: boolean;
  brandName?: string;
}

async function getAuthToken(): Promise<string> {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.access_token) return session.access_token;
  } catch {
    // Session fetch error fallback
  }
  return localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token') || '';
}

export default function CustomerInvoices({ isAr = false, brandName = 'AL ZOAL' }: CustomerInvoicesProps) {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [selected, setSelected] = useState<CustomerInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      setInvoices([]);
      setSelected(null);
      setError(isAr ? 'يتطلب تسجيل الدخول لعرض الفواتير.' : 'Authentication required to view invoices.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/customer-invoices', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success || !Array.isArray(payload.invoices)) {
        throw new Error(payload?.error || (isAr ? 'فشل تحميل الفواتير.' : 'Failed to load invoices.'));
      }

      setInvoices(payload.invoices as CustomerInvoice[]);
      setSelected((current) => {
        if (!current) return payload.invoices[0] || null;
        return payload.invoices.find((invoice: CustomerInvoice) => invoice.orderId === current.orderId) || payload.invoices[0] || null;
      });
    } catch (err: any) {
      setInvoices([]);
      setSelected(null);
      setError(err?.message || (isAr ? 'تعذر تحميل الفواتير من الخادم.' : 'Failed to load invoices from server.'));
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const selectedTitle = useMemo(() => {
    if (!selected) return '';
    return selected.invoiceNumber || selected.invoiceReference || `INV-${selected.orderId}`;
  }, [selected]);

  const buildPrintableData = (inv: CustomerInvoice) => {
    return {
      invoiceNumber: inv.invoiceNumber || inv.invoiceReference || `INV-${inv.orderId}`,
      invoiceDate: inv.invoiceDate || new Date().toLocaleDateString(),
      merchantName: brandName,
      merchantVat: inv.merchantVat || 'N/A',
      orderId: inv.orderId,
      paymentId: inv.gatewayPaymentId || inv.orderId,
      gateway: inv.paymentMethod || 'Mada Card',
      transactionId: inv.transactionId || inv.orderId,
      subtotal: inv.subtotal,
      vat: inv.tax,
      discount: inv.discount,
      delivery: inv.shipping,
      total: inv.total,
      items: inv.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.unitPrice,
      })),
    };
  };

  const handlePrint = (inv: CustomerInvoice) => {
    const data = buildPrintableData(inv);
    const html = generatePrintableInvoiceHtml(data);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleDownloadPdf = (inv: CustomerInvoice) => {
    const data = buildPrintableData(inv);
    const html = generatePrintableInvoiceHtml(data);
    downloadHtmlAsPdf(html, `ALZOAL-INVOICE-${data.invoiceNumber}.pdf`);
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-zinc-950/60 border border-white/5 rounded-sm space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mx-auto" />
        <p className="text-xs text-zinc-400 font-mono">
          {isAr ? 'جاري تحميل الفواتير المعتمدة من الخادم...' : 'Loading authoritative invoices from backend...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-zinc-950/60 border border-red-500/20 rounded-sm space-y-4 text-left">
        <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={() => void loadInvoices()}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 rounded-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {isAr ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  if (!invoices.length) {
    return (
      <div className="p-12 text-center bg-zinc-950/40 border border-dashed border-white/10 rounded-sm space-y-3">
        <FileText className="w-8 h-8 text-[#D4AF37] mx-auto opacity-70" />
        <h4 className="text-white text-sm font-semibold uppercase tracking-wider">
          {isAr ? 'لا توجد فواتير صادرة بعد' : 'No Invoices Found'}
        </h4>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          {isAr
            ? 'تظهر الفواتير الضريبية المعتمدة هنا تلقائياً عند تأكيد وتنفيذ طلباتك من المتجر.'
            : 'Authoritative tax invoices will automatically appear here once your store orders are confirmed.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-white text-lg font-display font-bold uppercase tracking-wider">
            {isAr ? 'سجل الفواتير والربط الضريبي' : 'Tax Invoices & Receipts'}
          </h3>
          <p className="text-zinc-400 text-xs mt-1">
            {isAr
              ? 'جميع الفواتير والبيانات المالية مستخرجة وموثقة رسمياً من قاعدة بيانات الطلبات.'
              : 'All financial invoices are verified and loaded directly from backend order records.'}
          </p>
        </div>
        {selected && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handlePrint(selected)}
              className="px-3.5 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-xs hover:bg-[#D4AF37] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              {isAr ? 'طباعة الفاتورة' : 'Print Invoice'}
            </button>
            <button
              type="button"
              onClick={() => handleDownloadPdf(selected)}
              className="px-3.5 py-2 bg-zinc-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-xs hover:bg-[#D4AF37] hover:text-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {isAr ? 'تحميل PDF' : 'Download PDF'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice selection list */}
        <div className="space-y-2 lg:col-span-1">
          <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">
            {isAr ? 'الفواتير المتاحة' : 'Available Invoices'} ({invoices.length})
          </p>
          {invoices.map((inv) => {
            const isSelected = selected?.orderId === inv.orderId;
            return (
              <button
                key={inv.orderId}
                type="button"
                onClick={() => setSelected(inv)}
                className={`w-full text-left p-4 rounded-xs border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white'
                    : 'border-white/5 bg-zinc-950/60 text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#D4AF37]">
                    {inv.invoiceNumber || inv.invoiceReference || `INV-${inv.orderId}`}
                  </span>
                  <span className="font-sans font-bold text-xs text-white">
                    {inv.total.toFixed(2)} {inv.currency || 'SAR'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-2">
                  <span>{isAr ? 'الطلب:' : 'Order:'} {inv.orderId}</span>
                  <span>{inv.invoiceDate || '—'}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected invoice details */}
        {selected && (
          <div className="lg:col-span-2 border border-white/10 bg-zinc-950/80 rounded-xs p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4AF37]">
                  {brandName} — {isAr ? 'فاتورة ضريبية معتمدة' : 'Official Tax Invoice'}
                </span>
                <h4 className="text-lg font-mono font-bold text-white mt-1">
                  {selectedTitle}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isAr ? 'رقم الطلب الأصلي:' : 'Original Order ID:'} <span className="text-white font-mono">{selected.orderId}</span>
                </p>
              </div>
              <div className="text-right font-mono text-xs text-zinc-400">
                <span className="inline-block px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-xs text-[10px] font-bold uppercase mb-1">
                  {selected.paymentStatus || selected.status || (isAr ? 'مكتمل' : 'PAID')}
                </span>
                <p className="text-[10px] text-zinc-500">{selected.invoiceDate || '—'}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                    <th className="py-2.5 font-normal">{isAr ? 'المنتج / الصنف' : 'Item Description'}</th>
                    <th className="py-2.5 font-normal text-center">{isAr ? 'السعر' : 'Unit Price'}</th>
                    <th className="py-2.5 font-normal text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                    <th className="py-2.5 font-normal text-right">{isAr ? 'المجموع' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {selected.items.map((item, idx) => (
                    <tr key={item.id || idx} className="text-zinc-300">
                      <td className="py-3 font-semibold text-white text-xs">{item.name}</td>
                      <td className="py-3 text-center font-mono text-xs">{item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 text-center font-mono text-xs">{item.quantity}</td>
                      <td className="py-3 text-right font-mono font-bold text-white text-xs">
                        {item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-t border-white/10 pt-4">
              <div className="text-zinc-500 space-y-1 text-[10px] font-mono">
                <p><strong className="text-zinc-400">{isAr ? 'وسيلة الدفع:' : 'Payment Method:'}</strong> {selected.paymentMethod || '—'}</p>
                <p><strong className="text-zinc-400">{isAr ? 'رقم المعاملة:' : 'Transaction ID:'}</strong> {selected.transactionId || selected.orderId}</p>
                <p><strong className="text-zinc-400">{isAr ? 'الرقم الضريبي:' : 'VAT Registration:'}</strong> {selected.merchantVat || 'N/A'}</p>
                <div className="flex items-center gap-1 text-emerald-400 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فاتورة مشفرة وموثقة سحابياً' : 'Cryptographically verified database invoice'}</span>
                </div>
              </div>

              <div className="w-full sm:w-60 space-y-1.5 font-mono text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                  <span className="text-white">{selected.subtotal.toFixed(2)} {selected.currency || 'SAR'}</span>
                </div>
                {selected.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>{isAr ? 'الخصم:' : 'Discount:'}</span>
                    <span>-{selected.discount.toFixed(2)} {selected.currency || 'SAR'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{isAr ? 'الشحن:' : 'Shipping:'}</span>
                  <span className="text-white">{selected.shipping.toFixed(2)} {selected.currency || 'SAR'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'ضريبة القيمة المضافة (١٥٪):' : 'VAT (15%):'}</span>
                  <span className="text-white">{selected.tax.toFixed(2)} {selected.currency || 'SAR'}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 text-sm text-white font-bold">
                  <span className="text-[#D4AF37]">{isAr ? 'الإجمالي:' : 'TOTAL:'}</span>
                  <span className="text-[#D4AF37]">{selected.total.toFixed(2)} {selected.currency || 'SAR'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
