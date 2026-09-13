import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText, Loader2, Printer, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { supabaseClient } from '../lib/supabaseClient';
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
    // Fall back to the application's existing auth token storage.
  }
  return localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token') || '';
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildInvoiceHtml(inv: CustomerInvoice, brandName: string): string {
  const currency = inv.currency || 'SAR';
  const reference = inv.invoiceNumber || inv.invoiceReference;
  const items = inv.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${Number(item.unitPrice || 0).toFixed(2)}</td>
      <td>${Number(item.quantity || 0)}</td>
      <td>${Number(item.total || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(reference)}</title>
<style>
body{font-family:Arial,sans-serif;padding:32px;color:#111;background:#fff}h1{font-size:20px;margin:0 0 8px}.muted{color:#666;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:9px;border-bottom:1px solid #ddd;text-align:left;font-size:12px}th{color:#666}.summary{margin-top:24px;margin-left:auto;width:280px}.row{display:flex;justify-content:space-between;padding:4px 0}.total{font-weight:700;border-top:1px solid #111;margin-top:6px;padding-top:8px}.meta{margin-top:18px;font-size:12px;line-height:1.7}.notice{margin-top:20px;padding:10px;background:#f6f6f6;font-size:11px;color:#555}
</style></head><body>
<h1>${escapeHtml(brandName)} — Order Financial Record</h1>
<div class="muted">Reference: ${escapeHtml(reference)}</div>
<div class="muted">Order ID: ${escapeHtml(inv.orderId)}</div>
<div class="muted">Date: ${escapeHtml(inv.invoiceDate || 'Not provided')}</div>
<table><thead><tr><th>Item</th><th>Unit Price</th><th>Qty</th><th>Total</th></tr></thead><tbody>${items}</tbody></table>
<div class="summary">
<div class="row"><span>Subtotal</span><span>${Number(inv.subtotal || 0).toFixed(2)} ${escapeHtml(currency)}</span></div>
<div class="row"><span>Discount</span><span>${Number(inv.discount || 0).toFixed(2)} ${escapeHtml(currency)}</span></div>
<div class="row"><span>Shipping</span><span>${Number(inv.shipping || 0).toFixed(2)} ${escapeHtml(currency)}</span></div>
<div class="row"><span>Tax</span><span>${Number(inv.tax || 0).toFixed(2)} ${escapeHtml(currency)}</span></div>
<div class="row total"><span>Total</span><span>${Number(inv.total || 0).toFixed(2)} ${escapeHtml(currency)}</span></div>
</div>
<div class="meta">
<div>Payment status: ${escapeHtml(inv.paymentStatus || 'Not provided')}</div>
<div>Payment method: ${escapeHtml(inv.paymentMethod || 'Not provided')}</div>
<div>Gateway payment ID: ${escapeHtml(inv.gatewayPaymentId || 'Not provided')}</div>
<div>Transaction ID: ${escapeHtml(inv.transactionId || 'Not provided')}</div>
<div>Merchant VAT: ${escapeHtml(inv.merchantVat || 'Not provided')}</div>
</div>
<div class="notice">This document displays authoritative order/payment fields returned by the authenticated customer invoice API. Missing invoice numbers, payment IDs, transaction IDs, or VAT values are intentionally shown as not provided rather than fabricated.</div>
</body></html>`;
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
      setError(isAr ? 'يتطلب تسجيل الدخول لعرض السجلات المالية.' : 'Authentication required to view financial records.');
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
        throw new Error(payload?.error || (isAr ? 'فشل تحميل السجلات المالية.' : 'Failed to load financial records.'));
      }

      const authoritative = payload.invoices as CustomerInvoice[];
      setInvoices(authoritative);
      setSelected((current) => {
        if (!current) return authoritative[0] || null;
        return authoritative.find((invoice) => invoice.orderId === current.orderId) || authoritative[0] || null;
      });
    } catch (err: any) {
      setInvoices([]);
      setSelected(null);
      setError(err?.message || (isAr ? 'تعذر تحميل السجلات من الخادم.' : 'Failed to load records from server.'));
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const selectedReference = useMemo(() => selected?.invoiceNumber || selected?.invoiceReference || '', [selected]);

  const handlePrint = (inv: CustomerInvoice) => {
    const html = buildInvoiceHtml(inv, brandName);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadPdf = (inv: CustomerInvoice) => {
    const html = buildInvoiceHtml(inv, brandName);
    const safeReference = (inv.invoiceNumber || inv.invoiceReference || inv.orderId).replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadHtmlAsPdf(html, `ALZOAL-INVOICE-${safeReference}.pdf`);
  };

  if (loading) {
    return <div className="p-12 text-center bg-zinc-950/60 border border-white/5 rounded-sm space-y-3"><Loader2 className="w-6 h-6 animate-spin text-[#D4AF37] mx-auto" /><p className="text-xs text-zinc-400 font-mono">{isAr ? 'جاري تحميل السجلات المالية من الخادم...' : 'Loading authoritative financial records from backend...'}</p></div>;
  }

  if (error) {
    return <div className="p-6 bg-zinc-950/60 border border-red-500/20 rounded-sm space-y-4 text-left"><div className="flex items-center gap-2 text-red-400 text-sm font-semibold"><AlertCircle className="w-4 h-4" /><span>{error}</span></div><button type="button" onClick={() => void loadInvoices()} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 rounded-xs flex items-center gap-2 transition-all cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />{isAr ? 'إعادة المحاولة' : 'Retry'}</button></div>;
  }

  if (!invoices.length) {
    return <div className="p-12 text-center bg-zinc-950/40 border border-dashed border-white/10 rounded-sm space-y-3"><FileText className="w-8 h-8 text-[#D4AF37] mx-auto opacity-70" /><h4 className="text-white text-sm font-semibold uppercase tracking-wider">{isAr ? 'لا توجد سجلات مالية' : 'No Financial Records Found'}</h4><p className="text-xs text-zinc-400 max-w-md mx-auto">{isAr ? 'لا توجد سجلات طلبات مالية متاحة لهذا الحساب.' : 'No authoritative order financial records are available for this account.'}</p></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-white text-lg font-display font-bold uppercase tracking-wider">{isAr ? 'الفواتير والسجلات المالية' : 'Invoices & Financial Records'}</h3>
          <p className="text-zinc-400 text-xs mt-1">{isAr ? 'البيانات المعروضة مستخرجة من سجلات الطلبات والمدفوعات المصرح بها للحساب الحالي.' : 'Records are loaded from order and payment data authorized for the authenticated customer account.'}</p>
        </div>
        {selected && <div className="flex items-center gap-2 shrink-0"><button type="button" onClick={() => handlePrint(selected)} className="px-3.5 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-xs hover:bg-[#D4AF37] transition-all cursor-pointer flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" />{isAr ? 'طباعة السجل' : 'Print Record'}</button><button type="button" onClick={() => handleDownloadPdf(selected)} className="px-3.5 py-2 bg-zinc-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-xs hover:bg-[#D4AF37] hover:text-black transition-all cursor-pointer flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />{isAr ? 'تحميل PDF' : 'Download PDF'}</button></div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-2 lg:col-span-1">
          <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">{isAr ? 'السجلات المتاحة' : 'Available Records'} ({invoices.length})</p>
          {invoices.map((inv) => {
            const isSelected = selected?.orderId === inv.orderId;
            return <button key={inv.orderId} type="button" onClick={() => setSelected(inv)} className={`w-full text-left p-4 rounded-xs border transition-all cursor-pointer ${isSelected ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white' : 'border-white/5 bg-zinc-950/60 text-zinc-400 hover:text-white hover:border-white/20'}`}>
              <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-bold text-[#D4AF37]">{inv.invoiceNumber || inv.invoiceReference || 'Reference not provided'}</span><span className="font-sans font-bold text-xs text-white">{Number(inv.total || 0).toFixed(2)} {inv.currency || 'SAR'}</span></div>
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-2"><span>{isAr ? 'الطلب:' : 'Order:'} {inv.orderId}</span><span>{inv.invoiceDate || '—'}</span></div>
            </button>;
          })}
        </div>

        {selected && <div className="lg:col-span-2 border border-white/10 bg-zinc-950/80 rounded-xs p-6 space-y-6">
          <div className="flex justify-between items-start border-b border-white/10 pb-4">
            <div><span className="text-[9px] font-mono uppercase tracking-widest text-[#D4AF37]">{brandName} — {isAr ? 'سجل مالي للطلب' : 'Order Financial Record'}</span><h4 className="text-lg font-mono font-bold text-white mt-1">{selectedReference || 'Reference not provided'}</h4><p className="text-xs text-zinc-400 mt-0.5">{isAr ? 'رقم الطلب الأصلي:' : 'Original Order ID:'} <span className="text-white font-mono">{selected.orderId}</span></p></div>
            <div className="text-right font-mono text-xs text-zinc-400"><span className="inline-block px-2 py-0.5 bg-zinc-900 border border-white/10 text-zinc-300 rounded-xs text-[10px] font-bold uppercase mb-1">{selected.paymentStatus || selected.status || 'Status not provided'}</span><p className="text-[10px] text-zinc-500">{selected.invoiceDate || '—'}</p></div>
          </div>

          <div className="overflow-x-auto"><table className="w-full text-left font-sans text-xs"><thead><tr className="border-b border-white/10 text-[9px] font-mono text-zinc-500 uppercase tracking-widest"><th className="py-2.5 font-normal">{isAr ? 'المنتج / الصنف' : 'Item Description'}</th><th className="py-2.5 font-normal text-center">{isAr ? 'السعر' : 'Unit Price'}</th><th className="py-2.5 font-normal text-center">{isAr ? 'الكمية' : 'Qty'}</th><th className="py-2.5 font-normal text-right">{isAr ? 'المجموع' : 'Total'}</th></tr></thead><tbody className="divide-y divide-white/5">{selected.items.map((item, idx) => <tr key={item.id || idx} className="text-zinc-300"><td className="py-3 font-semibold text-white text-xs">{item.name}</td><td className="py-3 text-center font-mono text-xs">{Number(item.unitPrice || 0).toFixed(2)}</td><td className="py-3 text-center font-mono text-xs">{Number(item.quantity || 0)}</td><td className="py-3 text-right font-mono font-bold text-white text-xs">{Number(item.total || 0).toFixed(2)}</td></tr>)}</tbody></table></div>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-t border-white/10 pt-4">
            <div className="text-zinc-500 space-y-1 text-[10px] font-mono"><p><strong className="text-zinc-400">{isAr ? 'وسيلة الدفع:' : 'Payment Method:'}</strong> {selected.paymentMethod || 'Not provided'}</p><p><strong className="text-zinc-400">{isAr ? 'رقم المعاملة:' : 'Transaction ID:'}</strong> {selected.transactionId || 'Not provided'}</p><p><strong className="text-zinc-400">{isAr ? 'معرف الدفع لدى البوابة:' : 'Gateway Payment ID:'}</strong> {selected.gatewayPaymentId || 'Not provided'}</p><p><strong className="text-zinc-400">{isAr ? 'الرقم الضريبي:' : 'VAT Registration:'}</strong> {selected.merchantVat || 'Not provided'}</p><div className="flex items-center gap-1 text-emerald-400 pt-1"><ShieldCheck className="w-3.5 h-3.5" /><span>{isAr ? 'البيانات مرتبطة بسجل الخادم للحساب المصادق عليه' : 'Server record scoped to the authenticated customer'}</span></div></div>
            <div className="w-full sm:w-60 space-y-1.5 font-mono text-xs text-zinc-400"><div className="flex justify-between"><span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span><span className="text-white">{Number(selected.subtotal || 0).toFixed(2)} {selected.currency || 'SAR'}</span></div>{Number(selected.discount || 0) > 0 && <div className="flex justify-between text-emerald-400"><span>{isAr ? 'الخصم:' : 'Discount:'}</span><span>-{Number(selected.discount || 0).toFixed(2)} {selected.currency || 'SAR'}</span></div>}<div className="flex justify-between"><span>{isAr ? 'الشحن:' : 'Shipping:'}</span><span className="text-white">{Number(selected.shipping || 0).toFixed(2)} {selected.currency || 'SAR'}</span></div><div className="flex justify-between"><span>{isAr ? 'الضريبة:' : 'Tax:'}</span><span className="text-white">{Number(selected.tax || 0).toFixed(2)} {selected.currency || 'SAR'}</span></div><div className="flex justify-between border-t border-white/10 pt-2 text-sm text-white font-bold"><span className="text-[#D4AF37]">{isAr ? 'الإجمالي:' : 'TOTAL:'}</span><span className="text-[#D4AF37]">{Number(selected.total || 0).toFixed(2)} {selected.currency || 'SAR'}</span></div></div>
          </div>
        </div>}
      </div>
    </div>
  );
}
