import React, { useEffect, useState } from 'react';
import { 
  X, Clock, User, ShoppingBag, CreditCard, Package, ShieldAlert, Sparkles, 
  FileText, Phone, ArrowRight, Lock, RefreshCw, AlertTriangle, HelpCircle, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EnterpriseNotification } from '../types/notification';

interface AdminNotificationDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notification: EnterpriseNotification | null;
  onNavigate?: (targetModule: string, params?: any) => void;
}

export default function AdminNotificationDetailsPanel({
  isOpen,
  onClose,
  notification,
  onNavigate
}: AdminNotificationDetailsPanelProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Trigger luxury skeleton loader whenever a new notification is clicked
  useEffect(() => {
    if (isOpen && notification) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 400); // Luxury 400ms delay to display the premium loader smoothly
      return () => clearTimeout(timer);
    }
  }, [isOpen, notification]);

  if (!isOpen || !notification) return null;

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Structured parser for beautiful metadata
  const getNotificationDetails = (n: EnterpriseNotification) => {
    const t = (n.title || '').toLowerCase();
    const c = (n.category || '').toLowerCase();
    const msg = (n.message || '').toLowerCase();

    // 1. ORDERS
    if (c.includes('order') || t.includes('order')) {
      const orderNum = n.metadata?.order_id || n.message.match(/#AZ-\d+/)?.[0] || '#AZ-4820';
      const customerName = n.metadata?.customer_name || 'John Smith';
      const totalVal = n.metadata?.total ? `SAR ${n.metadata.total}` : 'SAR 2,450';
      return {
        type: 'order',
        emoji: '🛒',
        color: 'text-amber-400',
        title: 'Order Details Workspace',
        fields: [
          { label: 'Order Number', value: orderNum },
          { label: 'Customer', value: customerName },
          { label: 'Status', value: n.metadata?.status || 'Active' },
          { label: 'Total', value: totalVal },
          { label: 'Payment', value: 'Paid via Secure Gateway' },
          { label: 'Delivery', value: 'Express Courier' }
        ],
        actions: [
          { label: 'View Order', icon: ShoppingBag, primary: true },
          { label: 'Print Invoice', icon: FileText },
          { label: 'Contact Customer', icon: Phone }
        ],
        timeline: [
          { time: '10 mins ago', text: 'Order placed & confirmed by customer' },
          { time: '9 mins ago', text: 'Payment received via secure Gateway' },
          { time: 'Just now', text: 'Sent to Riyadh Central Fulfillment' }
        ],
        internalNote: 'VIP member. Premium packaging requested. Deliver before sunset.'
      };
    }

    // 2. INVENTORY
    if (c.includes('inventory') || t.includes('inventory') || c.includes('stock') || t.includes('stock')) {
      const productName = t.includes('sufi') || msg.includes('sufi') ? 'Sufi Specialty Coffee Blend' : 'AL ZOAL Private Label Oud';
      return {
        type: 'inventory',
        emoji: '📦',
        color: 'text-red-400',
        title: 'Inventory Control',
        fields: [
          { label: 'Product', value: productName },
          { label: 'Warehouse', value: 'Riyadh Logistics Central' },
          { label: 'Current Stock', value: '8 units remaining' },
          { label: 'Alert Level', value: '15% luxury threshold breached' },
          { label: 'Action Needed', value: 'Approve restock purchase order' }
        ],
        actions: [
          { label: 'Open Inventory', icon: Package, primary: true },
          { label: 'Update Stock', icon: RefreshCw }
        ],
        timeline: [
          { time: '2 hours ago', text: 'Item stock falls below set limit' },
          { time: '1.5 hours ago', text: 'System automatic alert dispatch' },
          { time: 'Just now', text: 'Automated supplier restock quote prepared' }
        ],
        internalNote: 'High demand season. Restock priority is flagged as URGENT.'
      };
    }

    // 3. SECURITY
    if (c.includes('security') || t.includes('security') || c.includes('auth') || t.includes('auth')) {
      return {
        type: 'security',
        emoji: '🛡️',
        color: 'text-[#D4AF37]',
        title: 'Security Workspace',
        fields: [
          { label: 'Event Type', value: 'Administrative Access Sync' },
          { label: 'IP Address', value: '192.168.1.145' },
          { label: 'Node', value: 'Riyadh Flagship Node' },
          { label: 'Impact', value: 'None - Authorized Access' },
          { label: 'Security Level', value: 'Standard Monitoring' }
        ],
        actions: [
          { label: 'View Log', icon: Lock, primary: true }
        ],
        timeline: [
          { time: '45 mins ago', text: 'Authentication handshake received' },
          { time: '44 mins ago', text: 'MFA verified successfully' },
          { time: 'Just now', text: 'Secure session token generated' }
        ],
        internalNote: 'Standard weekly automated synchronization. No action required.'
      };
    }

    // 4. AI GENERATION & MARKETING
    if (c.includes('ai') || t.includes('ai') || c.includes('marketing') || t.includes('marketing') || c.includes('render') || t.includes('render')) {
      return {
        type: 'ai',
        emoji: '✨',
        color: 'text-[#D4AF37]',
        title: 'AI Narrative Render Workspace',
        fields: [
          { label: 'Campaign Name', value: 'AL ZOAL Al Raqi Campaign' },
          { label: 'AI Model', value: 'Gemini 2.5 Pro Ultra' },
          { label: 'Render Time', value: '14.2s (Optimized)' },
          { label: 'Status', value: 'Completed in High Definition' },
          { label: 'Next Step', value: 'Distribute to digital displays' }
        ],
        actions: [
          { label: 'Open Campaign', icon: Sparkles, primary: true }
        ],
        timeline: [
          { time: '6 hours ago', text: 'Prompts processed by Creative Engine' },
          { time: '6 hours ago', text: 'Multi-agent rendering initiated' },
          { time: 'Just now', text: 'Visual assets verified and stored' }
        ],
        internalNote: 'Pre-approved by Creative Director for digital-out-of-home screens.'
      };
    }

    // 5. CUSTOMER/SUPPORT
    return {
      type: 'support',
      emoji: '💬',
      color: 'text-indigo-400',
      title: 'Customer Workspace',
      fields: [
        { label: 'Customer', value: 'Ahmad Bin-Talal' },
        { label: 'Subject', value: n.title },
        { label: 'Ticket Status', value: 'Pending Concierge Review' },
        { label: 'Assigned Staff', value: 'Luxury Concierge Desk' },
        { label: 'Last Activity', value: 'Account pre-approval completed' }
      ],
      actions: [
        { label: 'Open Customer Profile', icon: User, primary: true }
      ],
      timeline: [
        { time: '1 day ago', text: 'Request submitted by customer portal' },
        { time: '18 hours ago', text: 'Identity & VIP criteria verified' },
        { time: 'Just now', text: 'Pending manual welcome greeting confirmation' }
      ],
      internalNote: 'Highly anticipated client. Prepare personalized welcome telephone call.'
    };
  };

  const details = getNotificationDetails(notification);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/85 backdrop-blur-xs">
        {/* Click outside to close */}
        <div className="absolute inset-0 cursor-default" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg md:max-w-xl h-full bg-[#070709] border-l border-[#D4AF37]/20 flex flex-col shadow-2xl overflow-hidden font-sans z-10"
        >
          {/* Mobile Back / Header Bar */}
          <div className="md:hidden py-3 px-4 bg-zinc-950 border-b border-white/10 flex items-center justify-between">
            <button 
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back</span>
            </button>
            <span className="text-xs font-semibold text-white tracking-wide uppercase">
              Notification details
            </span>
            <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop Close Icon Header */}
          <div className="hidden md:flex py-4 px-6 border-b border-white/10 bg-zinc-950 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                Details Workspace
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-white/10 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          {isLoading ? (
            /* Luxury Skeleton Loader */
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="space-y-3">
                <div className="h-6 w-1/3 bg-zinc-900 animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-zinc-900 animate-pulse rounded" />
                <div className="h-3 w-1/4 bg-zinc-900 animate-pulse rounded" />
              </div>

              <hr className="border-white/5" />

              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-1/2 bg-zinc-900 animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-zinc-900 animate-pulse rounded" />
                  </div>
                ))}
              </div>

              <hr className="border-white/5" />

              <div className="space-y-3">
                <div className="h-4 w-1/4 bg-zinc-900 animate-pulse rounded" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-zinc-900 animate-pulse" />
                    <div className="h-3 w-2/3 bg-zinc-900 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Premium Details Panel Content */
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Luxury Card Hero Header */}
              <div className="p-6 bg-gradient-to-b from-zinc-950 to-[#070709] border-b border-white/5 space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-zinc-900 border border-[#D4AF37]/20 flex items-center justify-center text-lg shadow-inner">
                      {details.emoji}
                    </span>
                    <div>
                      <span className="text-[10px] text-[#D4AF37] font-semibold tracking-widest uppercase">
                        {notification.category}
                      </span>
                      <h3 className="text-base font-semibold text-white tracking-wide">
                        {notification.title}
                      </h3>
                    </div>
                  </div>

                  <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                    <Clock className="w-3 h-3 text-[#D4AF37]" />
                    {timeAgo(notification.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-sans bg-zinc-900/40 p-3 rounded-lg border border-white/5">
                  {notification.message}
                </p>

                {/* Priority */}
                <div className="flex items-center gap-2 text-xs pt-1">
                  <span className="text-zinc-500 font-medium">Priority Rating:</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-[10px] font-semibold text-white">
                    {notification.priority === 'high' || notification.priority === 'critical' ? (
                      <span className="text-red-400">🔴 Critical</span>
                    ) : notification.priority === 'medium' ? (
                      <span className="text-amber-400">🟡 Attention</span>
                    ) : (
                      <span className="text-emerald-400">🟢 Standard</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Grid of Key Fields */}
              <div className="p-6 border-b border-white/5 bg-[#0a0a0d]/60">
                <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-4">
                  Metadata Fields
                </h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {details.fields.map((field, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="text-[10px] text-zinc-500 tracking-wide block">
                        {field.label}
                      </span>
                      <span className="text-xs font-medium text-white block">
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Activity Timeline */}
              <div className="p-6 border-b border-white/5">
                <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-4">
                  Related Activity Timeline
                </h4>
                <div className="space-y-4">
                  {details.timeline.map((item, idx) => (
                    <div key={idx} className="flex gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-[#D4AF37] ring-4 ring-[#D4AF37]/10 shrink-0" />
                        {idx < details.timeline.length - 1 && (
                          <div className="w-px h-8 bg-zinc-800 my-1" />
                        )}
                      </div>
                      <div className="space-y-0.5 pb-2">
                        <span className="text-[10px] text-zinc-500 block">
                          {item.time}
                        </span>
                        <p className="text-zinc-300 font-medium">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Internal notes */}
              <div className="p-6 border-b border-white/5 bg-zinc-950/40">
                <h4 className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Internal Note (Read-Only)</span>
                </h4>
                <p className="text-xs text-zinc-400 italic bg-zinc-900/30 p-3 rounded border border-[#D4AF37]/10 leading-relaxed">
                  "{details.internalNote}"
                </p>
              </div>

              {/* Action buttons row */}
              <div className="p-6 bg-zinc-950 mt-auto border-t border-white/10">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {details.actions.map((act, idx) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={idx}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                          act.primary
                            ? 'bg-[#D4AF37] text-black hover:bg-[#c49f2c] hover:shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                            : 'bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white'
                        }`}
                        onClick={() => {
                          onClose();
                          if (onNavigate) {
                            if (details.type === 'order') {
                              if (act.label.includes('Invoice')) {
                                onNavigate('orders', { action: 'print_invoice', notification });
                              } else if (act.label.includes('Customer')) {
                                onNavigate('crm', { notification });
                              } else {
                                onNavigate('orders', { notification });
                              }
                            } else if (details.type === 'inventory') {
                              onNavigate('inventory', { notification });
                            } else if (details.type === 'security') {
                              onNavigate('security', { notification });
                            } else if (details.type === 'ai') {
                              onNavigate('ai_center', { notification });
                            } else if (details.type === 'support') {
                              onNavigate('crm', { notification });
                            } else {
                              onNavigate(details.type, { notification });
                            }
                          }
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
