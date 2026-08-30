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
      const orderNum = n.metadata?.order_id || n.message.match(/#AZ-\d+/)?.[0] || 'N/A';
      const customerName = n.metadata?.customer_name || 'N/A';
      const totalVal = n.metadata?.total ? `SAR ${n.metadata.total}` : 'N/A';
      return {
        type: 'order',
        emoji: '🛒',
        color: 'text-amber-400',
        title: 'Order Details Workspace',
        fields: [
          { label: 'Order Number', value: orderNum },
          { label: 'Customer', value: customerName },
          { label: 'Status', value: n.metadata?.status || 'Processing' },
          { label: 'Total', value: totalVal },
          { label: 'Payment', value: n.metadata?.payment_status || 'Verified' },
          { label: 'Source', value: n.metadata?.source || 'Online Store' }
        ],
        actions: [
          { label: 'View Order', icon: ShoppingBag, primary: true },
          { label: 'Print Invoice', icon: FileText },
          { label: 'Contact Customer', icon: Phone }
        ],
        timeline: [
          { time: timeAgo(n.timestamp), text: `Notification generated: ${n.title}` }
        ],
        internalNote: n.metadata?.internal_note || 'No internal notes provided for this event.'
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
          { label: 'Warehouse', value: n.metadata?.warehouse || 'N/A' },
          { label: 'Current Level', value: n.metadata?.current_level || 'Check Required' },
          { label: 'Alert Trigger', value: 'Threshold Breached' },
          { label: 'Action Needed', value: 'Audit required' }
        ],
        actions: [
          { label: 'Open Inventory', icon: Package, primary: true },
          { label: 'Update Stock', icon: RefreshCw }
        ],
        timeline: [
          { time: timeAgo(n.timestamp), text: 'Inventory threshold alert recorded' }
        ],
        internalNote: n.metadata?.internal_note || 'Inventory audit required for this SKU.'
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
          { label: 'Event Type', value: n.title },
          { label: 'IP Address', value: n.metadata?.ip_address || 'Internal System' },
          { label: 'Identity', value: n.user_email || 'System' },
          { label: 'Impact', value: 'Security Logged' },
          { label: 'Level', value: n.priority.toUpperCase() }
        ],
        actions: [
          { label: 'View Log', icon: Lock, primary: true }
        ],
        timeline: [
          { time: timeAgo(n.timestamp), text: 'Security event captured and archived' }
        ],
        internalNote: n.metadata?.internal_note || 'Automated security telemetry record.'
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
          { label: 'Task Name', value: n.title },
          { label: 'Engine', value: n.metadata?.engine || 'ZOAL Enterprise Core' },
          { label: 'Processing', value: 'Verified' },
          { label: 'Status', value: 'Completed' },
          { label: 'Source', value: n.category }
        ],
        actions: [
          { label: 'Open Campaign', icon: Sparkles, primary: true }
        ],
        timeline: [
          { time: timeAgo(n.timestamp), text: 'AI processing and validation completed' }
        ],
        internalNote: n.metadata?.internal_note || 'System generated event log.'
      };
    }

    // 5. CUSTOMER/SUPPORT
    return {
      type: 'support',
      emoji: '💬',
      color: 'text-indigo-400',
      title: 'Customer Workspace',
      fields: [
        { label: 'Customer', value: n.metadata?.customer_name || n.user_email || 'N/A' },
        { label: 'Subject', value: n.title },
        { label: 'Ticket Status', value: n.metadata?.ticket_status || 'Logged' },
        { label: 'Assigned Staff', value: n.assigned_staff_id || 'System Queue' },
        { label: 'Priority', value: n.priority.toUpperCase() }
      ],
      actions: [
        { label: 'Open Customer Profile', icon: User, primary: true }
      ],
      timeline: [
        { time: timeAgo(n.timestamp), text: 'Customer interaction event recorded' }
      ],
      internalNote: n.metadata?.internal_note || 'Automated customer service record.'
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
