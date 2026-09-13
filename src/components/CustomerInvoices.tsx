import React, { useCallback, useEffect, useMemo, useState } from 'react';

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

const getToken = () =>
  localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token') || '';

const money = (value: number, currency: string) =>
  `${Number(value || 0).toFixed(2)} ${currency || 'SAR'}`;

export default function CustomerInvoices() {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [selected, setSelected] = useState<CustomerInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setInvoices([]);
      setSelected(null);
      setError('Authentication required.');
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
        throw new Error(payload?.error || 'Failed to load invoices.');
      }

      setInvoices(payload.invoices as CustomerInvoice[]);
      setSelected((current) => {
        if (!current) return payload.invoices[0] || null;
        return payload.invoices.find((invoice: CustomerInvoice) => invoice.orderId === current.orderId) || payload.invoices[0] || null;
      });
    } catch (err: any) {
      setInvoices([]);
      setSelected(null);
      setError(err?.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const selectedTitle = useMemo(() => {
    if (!selected) return '';
    return selected.invoiceNumber || selected.invoiceReference || selected.orderId;
  }, [selected]);

  const printInvoice = () => {
    if (!selected) return;

    const itemRows = selected.items
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.name)}</td><td>${item.quantity}</td><td>${money(item.unitPrice, selected.currency)}</td><td>${money(item.total, selected.currency)}</td></tr>`,
      )
      .join('');

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(selectedTitle)}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left}.totals{margin-top:24px;max-width:360px;margin-left:auto}.row{display:flex;justify-content:space-between;padding:5px 0}.grand{font-weight:700;border-top:2px solid #111;margin-top:8px;padding-top:8px}</style></head><body><h1>ZOAL Invoice</h1><p>Reference: ${escapeHtml(selectedTitle)}</p><p>Order: ${escapeHtml(selected.orderId)}</p><p>Date: ${escapeHtml(selected.invoiceDate || '—')}</p><p>Payment: ${escapeHtml(selected.paymentMethod || '—')} / ${escapeHtml(selected.paymentStatus || '—')}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>${itemRows}</tbody></table><div class="totals"><div class="row"><span>Subtotal</span><span>${money(selected.subtotal, selected.currency)}</span></div><div class="row"><span>Discount</span><span>${money(selected.discount, selected.currency)}</span></div><div class="row"><span>Shipping</span><span>${money(selected.shipping, selected.currency)}</span></div><div class="row"><span>Tax</span><span>${money(selected.tax, selected.currency)}</span></div><div class="row grand"><span>Total</span><span>${money(selected.total, selected.currency)}</span></div></div><p>Merchant VAT: ${escapeHtml(selected.merchantVat || 'Not provided by backend')}</p></body></html>`;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (loading) return <div className="p-6">Loading invoices…</div>;
  if (error) return <div className="p-6"><div className="mb-4">{error}</div><button type="button" onClick={() => void loadInvoices()}>Retry</button></div>;
  if (!invoices.length) return <div className="p-6">No invoices found for this customer.</div>;

  return (
    <section className="p-6 space-y-6" aria-label="Customer invoices">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Invoices &amp; Receipts</h2>
          <p className="text-sm opacity-70">Authoritative invoices loaded from your authenticated orders.</p>
        </div>
        <button type="button" onClick={printInvoice} disabled={!selected}>Print selected</button>
      </div>

      <div className="grid gap-3">
        {invoices.map((invoice) => (
          <button
            key={invoice.orderId}
            type="button"
            onClick={() => setSelected(invoice)}
            className="text-left border rounded p-4"
            aria-pressed={selected?.orderId === invoice.orderId}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium">{invoice.invoiceNumber || invoice.invoiceReference}</span>
              <span>{money(invoice.total, invoice.currency)}</span>
            </div>
            <div className="text-sm opacity-70">Order {invoice.orderId} · {invoice.invoiceDate || '—'}</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="border rounded p-5 space-y-4">
          <div>
            <h3 className="font-semibold">Invoice {selectedTitle}</h3>
            <p className="text-sm opacity-70">Order {selected.orderId}</p>
          </div>
          <div className="grid gap-2 text-sm">
            {selected.items.map((item, index) => (
              <div key={item.id || `${selected.orderId}-${index}`} className="flex justify-between gap-4">
                <span>{item.name} × {item.quantity}</span>
                <span>{money(item.total, selected.currency)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(selected.subtotal, selected.currency)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>{money(selected.discount, selected.currency)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{money(selected.shipping, selected.currency)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{money(selected.tax, selected.currency)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-2"><span>Total</span><span>{money(selected.total, selected.currency)}</span></div>
          </div>
          <div className="text-sm opacity-80">
            <div>Payment status: {selected.paymentStatus || '—'}</div>
            <div>Payment method: {selected.paymentMethod || '—'}</div>
            <div>Gateway payment ID: {selected.gatewayPaymentId || 'Not provided'}</div>
            <div>Transaction ID: {selected.transactionId || 'Not provided'}</div>
            <div>Merchant VAT: {selected.merchantVat || 'Not provided by backend'}</div>
          </div>
        </div>
      )}
    </section>
  );
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
