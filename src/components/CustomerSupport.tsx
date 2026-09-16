import React, { FormEvent, useEffect, useState } from 'react';
import { MessageCircle, Send, Plus, RefreshCw } from 'lucide-react';

interface CustomerSupportProps { currentUser: any; isAr?: boolean; }
interface SupportMessage { id: string; sender: 'customer' | 'staff'; text: string; created_at?: string; time?: string; }
interface SupportTicket { id: string; subject: string; category: string; priority: string; status: string; messages: SupportMessage[]; }

const getToken = () => localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token') || '';

export default function CustomerSupport({ currentUser, isAr = false }: CustomerSupportProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTickets = async () => {
    const authToken = getToken();
    if (!authToken) { setTickets([]); setLoading(false); setError(isAr ? 'يرجى تسجيل الدخول مرة أخرى.' : 'Please sign in again.'); return; }
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/support/tickets', { headers: { Authorization: 'Bearer ' + authToken } });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'Unable to load support tickets.');
      setTickets(Array.isArray(payload?.tickets) ? payload.tickets : []);
    } catch (err: any) { console.error('Failed to load customer support tickets:', err); setError(err?.message || 'Unable to load support tickets.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadTickets(); }, [currentUser?.id]);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) || null;

  const createTicket = async (event: FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    const authToken = getToken();
    if (!authToken) { setError(isAr ? 'انتهت جلسة تسجيل الدخول.' : 'Your session has expired.'); return; }
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify({ subject: subject.trim(), category, channel: 'Customer Dashboard', message: message.trim() })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || 'Unable to create support ticket.');
      setSubject(''); setMessage(''); setCategory('General');
      await loadTickets();
      if (payload.ticket?.id) setSelectedId(payload.ticket.id);
    } catch (err: any) { console.error('Failed to create customer support ticket:', err); setError(err?.message || 'Unable to create support ticket.'); }
    finally { setSaving(false); }
  };

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTicket || !reply.trim()) return;
    const authToken = getToken();
    if (!authToken) { setError(isAr ? 'انتهت جلسة تسجيل الدخول.' : 'Your session has expired.'); return; }
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/support/tickets/' + encodeURIComponent(selectedTicket.id) + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify({ ticket_id: selectedTicket.id, message: reply.trim() })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error || 'Unable to send reply.');
      setReply(''); await loadTickets();
    } catch (err: any) { console.error('Failed to send customer support reply:', err); setError(err?.message || 'Unable to send reply.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="text-white text-base font-display font-bold uppercase tracking-wider flex items-center gap-2"><MessageCircle className="w-5 h-5 text-[#D4AF37]" />{isAr ? 'مركز الدعم' : 'Customer Support'}</h3><p className="text-zinc-400 text-xs mt-1">{isAr ? 'تواصل مع فريق الدعم وتابع طلباتك.' : 'Contact support and manage your own support tickets.'}</p></div>
        <button type="button" onClick={() => void loadTickets()} disabled={loading} className="p-2 border border-white/10 text-zinc-400 hover:text-white rounded-xs disabled:opacity-50" aria-label="Refresh tickets"><RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} /></button>
      </div>
      {error && <div role="alert" className="border border-rose-500/20 bg-rose-500/5 text-rose-300 text-xs p-3 rounded-sm">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-4">
        <form onSubmit={createTicket} className="bg-[#060606]/80 border border-white/10 rounded-sm p-5 space-y-4">
          <div className="flex items-center gap-2 text-white text-xs uppercase tracking-wider font-bold"><Plus className="w-4 h-4 text-[#D4AF37]" />{isAr ? 'تذكرة جديدة' : 'New Ticket'}</div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={160} placeholder={isAr ? 'الموضوع' : 'Subject'} className="w-full bg-black border border-white/10 rounded-xs px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]/50" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black border border-white/10 rounded-xs px-3 py-2.5 text-xs text-white outline-none"><option value="General">General</option><option value="Order">Order</option><option value="Payment">Payment</option><option value="Delivery">Delivery</option><option value="Product">Product</option><option value="Account">Account</option></select>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={5000} rows={6} placeholder={isAr ? 'اشرح مشكلتك...' : 'Describe your issue...'} className="w-full bg-black border border-white/10 rounded-xs px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]/50 resize-y" />
          <button disabled={saving} type="submit" className="w-full px-4 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xs disabled:opacity-50">{saving ? 'Saving…' : 'Create Ticket'}</button>
        </form>
        <div className="bg-[#060606]/80 border border-white/10 rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between"><span className="text-[10px] text-zinc-400 uppercase tracking-widest">{isAr ? 'تذاكرك' : 'Your Tickets'}</span><span className="text-[10px] text-[#D4AF37]">{tickets.length}</span></div>
          {loading ? <div className="p-8 text-center text-zinc-500 text-xs">Loading…</div> : tickets.length === 0 ? <div className="p-8 text-center text-zinc-500 text-xs">No support tickets yet.</div> : <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5">{tickets.map((ticket) => <button key={ticket.id} type="button" onClick={() => setSelectedId(ticket.id)} className={`w-full text-left p-4 hover:bg-white/[0.03] ${selectedId === ticket.id ? 'bg-[#D4AF37]/[0.04]' : ''}`}><div className="flex items-center justify-between gap-3"><span className="text-xs text-white font-semibold truncate">{ticket.subject}</span><span className="text-[9px] text-zinc-500 uppercase">{ticket.status}</span></div><div className="flex items-center gap-2 mt-2 text-[9px] text-zinc-500"><span>{ticket.category}</span><span>•</span><span>{ticket.priority}</span></div></button>)}</div>}
        </div>
      </div>
      {selectedTicket && <div className="bg-[#060606]/80 border border-white/10 rounded-sm p-5 space-y-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[9px] text-zinc-500 uppercase tracking-widest">Ticket</p><h4 className="text-white text-sm font-semibold mt-1">{selectedTicket.subject}</h4></div><span className="text-[9px] uppercase text-zinc-400">{selectedTicket.status}</span></div><div className="space-y-3 max-h-[360px] overflow-y-auto">{(selectedTicket.messages || []).map((item) => <div key={item.id} className={`p-3 rounded-sm border ${item.sender === 'customer' ? 'border-[#D4AF37]/20 bg-[#D4AF37]/[0.03]' : 'border-white/10 bg-white/[0.02]'}`}><div className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">{item.sender === 'customer' ? 'You' : 'Support'}</div><p className="text-xs text-zinc-200 whitespace-pre-wrap">{item.text}</p><p className="text-[9px] text-zinc-600 mt-2">{item.created_at ? new Date(item.created_at).toLocaleString() : item.time || ''}</p></div>)}</div><form onSubmit={sendReply} className="flex gap-2"><input value={reply} onChange={(e) => setReply(e.target.value)} maxLength={5000} placeholder={isAr ? 'اكتب ردك...' : 'Write a reply...'} className="flex-1 bg-black border border-white/10 rounded-xs px-3 py-2.5 text-xs text-white outline-none focus:border-[#D4AF37]/50" /><button disabled={saving || !reply.trim()} type="submit" className="px-4 py-2.5 bg-[#D4AF37] text-black rounded-xs disabled:opacity-50" aria-label="Send reply"><Send className="w-4 h-4" /></button></form></div>}
    </div>
  );
}
