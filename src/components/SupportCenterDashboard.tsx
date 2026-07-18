import React, { useState, useMemo, useEffect } from 'react';
import {
  User, Shield, Activity, Settings, Plus, Search, Filter, Trash2, Sliders,
  RefreshCw, FileText, X, Check, MessageSquare, Send, Sparkles, Clock, Compass,
  Users, TrendingUp, BarChart3, ArrowUpRight, Lock, AlertCircle, Phone, Mail,
  Info, BookOpen, Terminal, ChevronRight, HelpCircle, Server, MessageCircle,
  LifeBuoy, Layers, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Order } from '../types';
import { useBranding } from './BrandingContext';

interface SupportCenterProps {
  currentUser: { name: string; role: string; email: string };
  orders: Order[];
  addLog: (action: string, category?: string) => void;
}

// Initial Ticket seed registry
interface Message {
  sender: 'customer' | 'agent' | 'system';
  text: string;
  time: string;
  isAiDraft?: boolean;
}

interface Ticket {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  subject: string;
  messages: Message[];
  category: 'Tailoring' | 'Coffee & Cafe' | 'Organic Market' | 'Luxury Thobes' | 'Shipping' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'Pending' | 'Hold' | 'Solved' | 'Closed';
  assignee: string;
  channel: 'Live Chat' | 'WhatsApp' | 'Email' | 'SMS';
  date: string;
}

const SEED_TICKETS: Ticket[] = [
  {
    id: 'ZOAL-TKT-1049',
    customerName: 'Fatima Al-Sudairy',
    email: 'fatima.alsudairy@saudi-patron.com',
    phone: '+966 50 148 9321',
    subject: 'Custom Wedding Toob Embroidery Sizing',
    category: 'Tailoring',
    priority: 'Urgent',
    status: 'Open',
    assignee: 'Aisha Al-Hassan',
    channel: 'Live Chat',
    date: '2026-07-16',
    messages: [
      { sender: 'customer', text: 'Salam Alaykum. I have ordered the hand-woven Bespoke Sudanese Toob for my upcoming wedding next month in Riyadh. Can your master tailor call me to confirm the exact gold embroidery dimensions?', time: 'Today, 9:24 AM' }
    ]
  },
  {
    id: 'ZOAL-TKT-1048',
    customerName: 'Khalid Al-Ghamdi',
    email: 'khalid.ghamdi@dammam-royal.com',
    phone: '+966 55 220 1843',
    subject: 'VIP Assembly Specialty Saffron Catering',
    category: 'Coffee & Cafe',
    priority: 'High',
    status: 'Pending',
    assignee: 'Tariq Ibrahim',
    channel: 'WhatsApp',
    date: '2026-07-15',
    messages: [
      { sender: 'customer', text: 'Greetings. We are organizing a high-level VIP assembly at our Dammam office and require 40 thermal flasks of your Saffron Specialty Blend and fresh cardamom cookies. Can this be hand-delivered by your private courier at exactly 8:00 AM on Monday?', time: 'Yesterday, 4:15 PM' }
    ]
  },
  {
    id: 'ZOAL-TKT-1047',
    customerName: 'Mazhar Bashir',
    email: 'm.bashir@sudan-heritage.net',
    phone: '+249 912 345 678',
    subject: 'Bulk Gum Arabic Export Specifications',
    category: 'Organic Market',
    priority: 'Medium',
    status: 'Hold',
    assignee: 'Unassigned',
    channel: 'Email',
    date: '2026-07-15',
    messages: [
      { sender: 'customer', text: 'I am reviewing the wholesale specifications for the first-grade natural Gum Arabic crystals. Do you provide GCC certificate of origin for direct-to-port shipping from Port Sudan?', time: 'Yesterday, 11:30 AM' }
    ]
  },
  {
    id: 'ZOAL-TKT-1046',
    customerName: 'Saeed Bin-Jabr',
    email: 'saeed@jabr-invest.sa',
    phone: '+966 53 111 2222',
    subject: 'Luxury Thobe Italian Cotton Swatches request',
    category: 'Luxury Thobes',
    priority: 'Low',
    status: 'Solved',
    assignee: 'Aisha Al-Hassan',
    channel: 'Email',
    date: '2026-07-14',
    messages: [
      { sender: 'customer', text: 'I would like to receive physical material swatches of the imported Italian cottons you use for the Sovereign Thobe before placing my tailored order.', time: '2 days ago' },
      { sender: 'agent', text: 'Peace be upon you, esteemed Saeed. We have dispatched our velvet swatch folder containing the 12 finest cotton swatches to your Riyadh address via priority courier.', time: '2 days ago' }
    ]
  }
];

// Initial Knowledge Base seed articles
interface KBArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  author: string;
  views: number;
}

const SEED_KB: KBArticle[] = [
  {
    id: 'KB-101',
    title: 'Sovereign Tailoring & Custom Sizing Guild',
    category: 'Tailoring',
    content: 'All of our hand-woven Bespoke Toobs and luxury men\'s Thobes are individually structured. Once an order is placed, a master artisan coordinates a private video call or a personal measuring rendezvous. We utilize premier long-staple organic cottons and pure metallic gold threads from specialized Swiss looms. Production typically spans 10 to 18 days depending on structural detail density.',
    author: 'Aisha Al-Hassan',
    views: 124
  },
  {
    id: 'KB-102',
    title: 'Specialty Coffee Storage & Saffron Quality',
    category: 'Coffee & Cafe',
    content: 'Our single-origin coffee gathers are roasted in micro-batches (under 5kg) to maintain optimal essential oil preservation. The Saffron Specialty Blend incorporates certified Grade-1 Sargol saffron threads. For peak heritage flavor, keep coffee inside our custom thermal ceramic seal jars away from direct sunlight. Do not freeze beans as this damages high-elevation moisture metrics.',
    author: 'Tariq Ibrahim',
    views: 89
  },
  {
    id: 'KB-103',
    title: 'Sovereign Same-Day Logistics (GCC)',
    category: 'Shipping',
    content: 'We operate a private delivery network across Dammam and Al Hofuf, offering guaranteed white-glove same-day dispatches for orders completed before 11:00 AM. International priority courier delivers to Riyadh, Jeddah, and Gulf capitals within 2 to 4 business days. All garments are delivered in our signature velvet scent-locked packaging.',
    author: 'Operations Director',
    views: 215
  }
];

// Seed Support Staff Roster
interface StaffMember {
  name: string;
  role: string;
  status: 'Online' | 'Busy' | 'Offline';
  ticketsCount: number;
  avgResponseTime: string;
  avatar: string;
}

const SEED_STAFF: StaffMember[] = [
  { name: 'Aisha Al-Hassan', role: 'Senior Concierge Leader', status: 'Online', ticketsCount: 3, avgResponseTime: '4 mins', avatar: 'AH' },
  { name: 'Tariq Ibrahim', role: 'Specialty Cafe Liaison', status: 'Busy', ticketsCount: 5, avgResponseTime: '12 mins', avatar: 'TI' },
  { name: 'Yassin Sudan', role: 'Market Export Specialist', status: 'Offline', ticketsCount: 1, avgResponseTime: '18 mins', avatar: 'YS' }
];

export default function SupportCenterDashboard({ currentUser, orders, addLog }: SupportCenterProps) {
  const { settings } = useBranding();
  const brandName = settings.businessName.split(' ')[0];
  // --- ROLE AND ACCESS GUARDS (RBAC) ---
  const isAuthorized = useMemo(() => {
    if (!currentUser) return false;
    const role = currentUser.role.toLowerCase();
    return ['owner', 'admin', 'manager', 'staff'].includes(role);
  }, [currentUser]);

  if (!isAuthorized) {
    return (
      <div className="bg-black text-white min-h-screen pt-28 pb-20 flex items-center justify-center px-4 font-sans select-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-zinc-950 border border-red-500/30 p-8 rounded-sm shadow-[0_24px_60px_rgba(255,0,0,0.08)] text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 bg-red-950/30 border border-red-500/40 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] tracking-[0.4em] text-red-500 uppercase font-display block">
              Sovereign Guard Shield
            </span>
            <h1 className="text-xl font-bold tracking-wider uppercase font-display text-white">
              Privilege Level Violation
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This support deck is restricted exclusively for authorized corporate roles: <span className="text-red-400 font-mono font-bold">Owner, Admin, Manager, Staff</span>. Customers and unauthorized principals are blocked by RBAC Route Policy.
            </p>
          </div>
          <div className="p-3 bg-black border border-white/5 rounded-xs text-[10px] font-mono text-zinc-500 text-left space-y-1">
            <p>• Principal ID: {currentUser ? currentUser.email : 'Unauthenticated'}</p>
            <p>• Assigned Role: {currentUser ? currentUser.role : 'None'}</p>
            <p>• Code Base Rule: Action & Route Guard V3</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // State Declarations
  const [activeSubTab, setActiveSubTab] = useState<'workspace' | 'automation' | 'knowledge' | 'reports' | 'provider'>('workspace');
  
  // Persistent data states
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_support_tickets_v2');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return SEED_TICKETS;
  });

  const [kbArticles, setKbArticles] = useState<KBArticle[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_support_kb_v2');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return SEED_KB;
  });

  const [staffRoster, setStaffRoster] = useState<StaffMember[]>(SEED_STAFF);

  // Active workspace state
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<'all' | 'Live Chat' | 'WhatsApp' | 'Email' | 'SMS'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'Low' | 'Medium' | 'High' | 'Urgent'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Open' | 'Pending' | 'Hold' | 'Solved' | 'Closed'>('all');

  // Interactive conversation controls
  const [replyText, setReplyText] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [aiResponseStatus, setAiResponseStatus] = useState<{ source?: string; apiConfigured?: boolean; warning?: string } | null>(null);

  // Knowledge Base Editor Form State
  const [isAddingArticle, setIsAddingArticle] = useState(false);
  const [kbFormTitle, setKbFormTitle] = useState('');
  const [kbFormCategory, setKbFormCategory] = useState('Tailoring');
  const [kbFormContent, setKbFormContent] = useState('');

  // AI Sandbox Prompt / Persona Config
  const [aiPersona, setAiPersona] = useState(() => {
    return localStorage.getItem('zoal_support_ai_persona') || 
      'You are a premier, incredibly polite, and dignified hospitality concierge representing AL ZOAL\'s high-fashion and specialty gourmet sectors. You weave standard Arabic greetings seamlessly with ultra-luxury descriptions.';
  });
  const [isAutoDraftEnabled, setIsAutoDraftEnabled] = useState(() => {
    return localStorage.getItem('zoal_support_auto_draft') === 'true';
  });

  // Communication Provider Configuration state
  const [activeProvider, setActiveProvider] = useState<'livechat' | 'whatsapp' | 'email' | 'sms'>('livechat');
  const [isConnectingProvider, setIsConnectingProvider] = useState(false);
  const [providerConfigFields, setProviderConfigFields] = useState({
    apiKey: 'zoal_live_key_92813098',
    webhookUrl: 'https://zoalgroup.com/api/webhooks/live-chat',
    whatsappPhone: '+966501234567',
    smtpHost: 'smtp.zoalgroup.com'
  });

  // Support Audit Logs
  const [auditLogs, setAuditLogs] = useState<{ id: string; action: string; user: string; time: string; type: string }[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_support_audit_logs');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'LOG-301', action: 'Support Center initialized', user: 'System', time: new Date().toLocaleString(), type: 'System' },
      { id: 'LOG-302', action: 'Assigned Ticket ZOAL-TKT-1049 to Aisha Al-Hassan', user: currentUser.name, time: new Date(Date.now() - 3600000).toLocaleString(), type: 'Assignment' }
    ];
  });

  // Sync state helpers
  useEffect(() => {
    localStorage.setItem('zoal_support_tickets_v2', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('zoal_support_kb_v2', JSON.stringify(kbArticles));
  }, [kbArticles]);

  useEffect(() => {
    localStorage.setItem('zoal_support_ai_persona', aiPersona);
  }, [aiPersona]);

  useEffect(() => {
    localStorage.setItem('zoal_support_auto_draft', String(isAutoDraftEnabled));
  }, [isAutoDraftEnabled]);

  useEffect(() => {
    localStorage.setItem('zoal_support_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Log action inside Support deck and pass to Admin core
  const recordSupportAction = (actionText: string, type = 'Action') => {
    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      action: actionText,
      user: currentUser.name,
      time: new Date().toLocaleString(),
      type
    };
    setAuditLogs(prev => [newLog, ...prev]);
    addLog(`[Support Center] ${actionText}`, `Support Center`);
  };

  // Find currently selected ticket
  const activeTicket = useMemo(() => {
    return tickets.find(t => t.id === selectedTicketId) || tickets[0] || null;
  }, [tickets, selectedTicketId]);

  // Filtered tickets list for Left column
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchChannel = filterChannel === 'all' || t.channel === filterChannel;
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;

      return matchSearch && matchChannel && matchPriority && matchStatus;
    });
  }, [tickets, searchQuery, filterChannel, filterPriority, filterStatus]);

  // Custom AI draft reply generation from Express backend
  const triggerAiDraft = async () => {
    if (!activeTicket) return;
    
    setIsAiDrafting(true);
    setAiResponseStatus(null);
    const lastCustomerMsg = [...activeTicket.messages]
      .reverse()
      .find(m => m.sender === 'customer')?.text || '';

    try {
      const reqPayload = {
        query: lastCustomerMsg,
        persona: aiPersona,
        kbArticles: kbArticles.map(a => ({ title: a.title, content: a.content })),
        history: activeTicket.messages.slice(-5).map(m => ({ sender: m.sender, message: m.text }))
      };

      const response = await fetch('/api/support/ai-responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqPayload)
      });

      const data = await response.json();

      if (data.success && data.reply) {
        setReplyText(data.reply);
        setAiResponseStatus({
          source: data.source,
          apiConfigured: data.apiConfigured,
          warning: data.warning
        });
        recordSupportAction(`AI drafted responder reply for ticket ${activeTicket.id}`, 'AI Auto-Response');
      } else {
        alert(data.error || 'Failed to retrieve AI draft.');
      }
    } catch (err: any) {
      console.error('Error fetching AI responder:', err);
      // Fallback draft generation locally
      const mockReply = `[Bespoke Luxury Fallback Draft] Shukran, esteemed ${activeTicket.customerName}, for your request. Regarding your inquiry about "${activeTicket.subject}", our concierge officers are coordinating with the master tailor to verify the exact specifications. Peace be upon you.`;
      setReplyText(mockReply);
      setAiResponseStatus({
        source: 'local-frontend-fallback',
        apiConfigured: false,
        warning: 'Network/server error occurred. Loaded offline draft.'
      });
    } finally {
      setIsAiDrafting(false);
    }
  };

  // Add message or manually type response
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    const newMsg: Message = {
      sender: 'agent',
      text: replyText,
      time: 'Just now'
    };

    setTickets(prev => prev.map(t => {
      if (t.id === activeTicket.id) {
        return {
          ...t,
          messages: [...t.messages, newMsg],
          status: 'Pending' // mark as pending customer response or staff handoff
        };
      }
      return t;
    }));

    recordSupportAction(`Replied to customer Fatima on ticket ${activeTicket.id}`, 'Handoff');
    setReplyText('');
    setAiResponseStatus(null);
  };

  // Update ticket attributes
  const updateTicketField = (ticketId: string, field: keyof Ticket, value: any) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, [field]: value };
      }
      return t;
    }));
    recordSupportAction(`Modified ticket ${ticketId} [${String(field)}] to "${value}"`, 'Audit');
  };

  // KB CRUD adding
  const handleAddKBArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbFormTitle.trim() || !kbFormContent.trim()) return;

    const newArticle: KBArticle = {
      id: `KB-${Math.floor(Math.random() * 900 + 100)}`,
      title: kbFormTitle.trim(),
      category: kbFormCategory,
      content: kbFormContent.trim(),
      author: currentUser.name,
      views: 1
    };

    setKbArticles(prev => [newArticle, ...prev]);
    recordSupportAction(`Created Knowledge Base article: "${newArticle.title}"`, 'KB CRUD');

    setKbFormTitle('');
    setKbFormContent('');
    setIsAddingArticle(false);
  };

  const deleteKBArticle = (id: string, title: string) => {
    if (window.confirm(`Delete Knowledge Base article: "${title}"?`)) {
      setKbArticles(prev => prev.filter(a => a.id !== id));
      recordSupportAction(`Deleted KB article "${title}"`, 'KB CRUD');
    }
  };

  // Simulate active provider switching connection
  const handleConnectProvider = (providerId: 'livechat' | 'whatsapp' | 'email' | 'sms') => {
    setIsConnectingProvider(true);
    setTimeout(() => {
      setActiveProvider(providerId);
      setIsConnectingProvider(false);
      recordSupportAction(`Switched active Communications Infrastructure Provider to ${providerId.toUpperCase()}`, 'Provider Handoff');
      alert(`Replaceable Provider layer successfully synchronized. Routing channels through verified ${providerId.toUpperCase()} API.`);
    }, 1500);
  };

  // Support Analytics computations
  const kpiMetrics = useMemo(() => {
    const solved = tickets.filter(t => t.status === 'Solved' || t.status === 'Closed').length;
    const total = tickets.length;
    const compliance = 98.6; // luxury fixed metric
    const activePatrons = new Set(tickets.map(t => t.email)).size;

    // SLA breakdown by division/category
    const categoryDistribution = tickets.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(categoryDistribution).map(([name, value], index) => {
      const colors = ['#D4AF37', '#8F6F27', '#E4E4E7', '#52525B', '#AA8C2C', '#3F3F46'];
      return {
        name,
        value,
        color: colors[index % colors.length]
      };
    });

    return {
      solved,
      total,
      compliance,
      activePatrons,
      pieData,
      totalConversations: total,
      activeChats: tickets.filter(t => t.status === 'Open' || t.status === 'Pending').length,
      pendingReplies: tickets.filter(t => t.status === 'Pending').length,
      resolvedToday: solved,
      avgResponseTime: '8.2 mins',
      csat: '96.4%',
      firstResponseTime: '12 mins',
      slaCompliance: '98.6%'
    };
  }, [tickets]);

  // Interactive sandbox quick testing
  const [sandboxQuery, setSandboxQuery] = useState('How long does it take to deliver a tailored Thobe to Jeddah?');
  const [sandboxResponse, setSandboxResponse] = useState('');
  const [isSandboxLoading, setIsSandboxLoading] = useState(false);

  const testSandboxQuery = async () => {
    setIsSandboxLoading(true);
    try {
      const response = await fetch('/api/support/ai-responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: sandboxQuery,
          persona: aiPersona,
          kbArticles: kbArticles.map(a => ({ title: a.title, content: a.content }))
        })
      });
      const data = await response.json();
      if (data.reply) {
        setSandboxResponse(data.reply);
      }
    } catch (e) {
      setSandboxResponse('Error compiling mock sandbox reply.');
    } finally {
      setIsSandboxLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left font-sans text-white select-none">
      
      {/* 1. Header Title Block with subtab switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">{brandName} Sovereign Deck</span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-gold-pure" /> CLIENT SUPPORT CENTER
          </h2>
        </div>

        {/* Modular Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-black border border-white/5 p-1 rounded-sm">
          {[
            { id: 'workspace', name: 'Concierge Workspace', icon: MessageSquare },
            { id: 'automation', name: 'AI Automation Sandbox', icon: Sparkles },
            { id: 'knowledge', name: 'Knowledge Guild', icon: BookOpen },
            { id: 'reports', name: 'Deck Reports', icon: BarChart3 },
            { id: 'provider', name: 'Provider Infrastructure', icon: Server }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`py-1.5 px-3 rounded-xs font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                  active 
                    ? 'bg-gold-pure text-black font-extrabold'
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TAB: WORKSPACE (3-COLUMN LUXURY PANELS) */}
      {activeSubTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px] select-none animate-fade-in">
          
          {/* Column 1: Ticket list (Span 4) */}
          <div className="lg:col-span-3 bg-zinc-950 border border-white/5 rounded-sm flex flex-col overflow-hidden h-full">
            <div className="p-3 border-b border-white/5 space-y-2 bg-black">
              <span className="text-[8px] uppercase tracking-widest font-mono text-zinc-500 block">Sovereign Feed Filters</span>
              <div className="flex items-center gap-1.5 bg-zinc-950 border border-white/5 px-2.5 py-1.5 rounded-xs">
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter inquiries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-[10px] text-white outline-none w-full placeholder-zinc-600 font-mono"
                />
              </div>

              {/* Advanced Filter Pills */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[8px] font-mono">
                <select
                  value={filterChannel}
                  onChange={(e: any) => setFilterChannel(e.target.value)}
                  className="bg-zinc-950 border border-white/5 text-zinc-400 p-1 rounded-xs outline-none focus:border-gold-pure"
                >
                  <option value="all">All Channels</option>
                  <option value="Live Chat">Live Chat</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="SMS">SMS</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e: any) => setFilterPriority(e.target.value)}
                  className="bg-zinc-950 border border-white/5 text-zinc-400 p-1 rounded-xs outline-none focus:border-gold-pure"
                >
                  <option value="all">All Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Scrollable list stack */}
            <div className="flex-grow overflow-y-auto divide-y divide-white/5 p-2 space-y-1.5">
              {filteredTickets.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 font-mono text-[9px] uppercase tracking-widest">
                  No registered tickets match constraints.
                </div>
              ) : (
                filteredTickets.map(t => {
                  const isSelected = t.id === selectedTicketId;
                  const lastMsg = t.messages[t.messages.length - 1]?.text || 'No message';
                  
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`p-3 rounded-xs border transition-all duration-200 cursor-pointer text-left ${
                        isSelected 
                          ? 'bg-gold-pure/5 border-gold-pure shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                          : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/40'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[9px] font-mono font-bold text-white block">{t.id}</span>
                        <span className={`px-1 rounded-xs text-[7px] font-mono font-bold uppercase tracking-wider ${
                          t.priority === 'Urgent' ? 'bg-rose-950/30 text-rose-400 border border-rose-500/10' :
                          t.priority === 'High' ? 'bg-amber-950/20 text-amber-400 border border-amber-500/20' :
                          'bg-zinc-900 text-zinc-400'
                        }`}>
                          {t.priority}
                        </span>
                      </div>

                      <h4 className="text-[10px] font-sans font-bold text-zinc-200 truncate">{t.customerName}</h4>
                      <p className="text-[9.5px] text-gold-pure/70 font-mono truncate mb-1">{t.subject}</p>
                      <p className="text-[8.5px] text-zinc-500 line-clamp-1 italic mb-2 font-sans">"{lastMsg}"</p>

                      <div className="flex justify-between items-center text-[7.5px] font-mono text-zinc-600 border-t border-white/5 pt-1.5">
                        <span className="uppercase">{t.channel}</span>
                        <span className={`uppercase font-bold ${
                          t.status === 'Open' ? 'text-emerald-400 animate-pulse' :
                          t.status === 'Solved' ? 'text-zinc-500 line-through' : 'text-amber-400'
                        }`}>{t.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Chat panel (Span 6) */}
          <div className="lg:col-span-6 bg-zinc-950 border border-white/5 rounded-sm flex flex-col overflow-hidden h-full">
            {activeTicket ? (
              <>
                {/* Active Ticket Header */}
                <div className="p-4 border-b border-white/5 bg-black/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-[8px] font-mono text-gold-pure uppercase tracking-widest block">Active Conversation Thread</span>
                    <h3 className="text-xs text-white font-bold uppercase font-display tracking-wider">{activeTicket.subject}</h3>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Assigned Steward: {activeTicket.assignee}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={activeTicket.status}
                      onChange={(e: any) => updateTicketField(activeTicket.id, 'status', e.target.value)}
                      className="bg-zinc-900 border border-white/10 text-white text-[9px] font-mono uppercase py-1 px-2 rounded-xs outline-none focus:border-gold-pure"
                    >
                      <option value="Open">Open</option>
                      <option value="Pending">Pending</option>
                      <option value="Hold">Hold</option>
                      <option value="Solved">Solved</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <select
                      value={activeTicket.priority}
                      onChange={(e: any) => updateTicketField(activeTicket.id, 'priority', e.target.value)}
                      className="bg-zinc-900 border border-white/10 text-white text-[9px] font-mono uppercase py-1 px-2 rounded-xs outline-none focus:border-gold-pure"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Messages scroll stage */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-zinc-950/40">
                  {activeTicket.messages.map((m, mIdx) => {
                    const isCustomer = m.sender === 'customer';
                    const isSystem = m.sender === 'system';
                    
                    return (
                      <div
                        key={mIdx}
                        className={`flex flex-col ${isCustomer ? 'items-start' : isSystem ? 'items-center' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1 mb-1 text-[8px] font-mono text-zinc-500">
                          <span>{isCustomer ? activeTicket.customerName : isSystem ? 'Sovereign Core' : `${brandName} Concierge Staff`}</span>
                          <span>•</span>
                          <span>{m.time}</span>
                        </div>

                        <div className={`p-3 max-w-[85%] rounded-xs text-[11px] font-sans leading-relaxed ${
                          isCustomer 
                            ? 'bg-zinc-900 text-white border border-white/5' 
                            : isSystem
                            ? 'bg-zinc-950/80 text-zinc-500 border border-dashed border-white/5 font-mono text-[9px]'
                            : 'bg-white text-zinc-950 font-medium'
                        }`}>
                          <p className="whitespace-pre-wrap">{m.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI Draft Response Status header */}
                {aiResponseStatus && (
                  <div className="px-4 py-1.5 bg-gold-pure/10 border-t border-b border-gold-pure/30 text-[8.5px] font-mono text-gold-pure flex justify-between items-center animate-fade-in">
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-gold-pure" /> Auto-Draft Loaded: <strong>{aiResponseStatus.source}</strong></span>
                    {aiResponseStatus.apiConfigured ? (
                      <span className="text-emerald-400 font-bold uppercase">GEMINI LIVE</span>
                    ) : (
                      <span className="text-amber-400 uppercase font-bold text-right" title={aiResponseStatus.warning}>Offline Simulation</span>
                    )}
                  </div>
                )}

                {/* Response Composer Area */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-black/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] uppercase tracking-widest font-mono text-zinc-500">Steward Response Deck</span>
                    
                    {/* Canned responses dropdown / AI drafted */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={triggerAiDraft}
                        disabled={isAiDrafting}
                        className="py-1 px-2.5 bg-zinc-900 border border-gold-pure/30 hover:bg-gold-pure text-white hover:text-black rounded-xs text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all disabled:opacity-40"
                      >
                        {isAiDrafting ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" /> Drafting...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" /> Draft with Gemini
                          </>
                        )}
                      </button>

                      {/* Quick templates shortcut */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setReplyText(prev => prev + e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="bg-zinc-900 border border-white/5 text-zinc-400 text-[9px] font-mono py-1 px-2 rounded-xs outline-none focus:border-gold-pure"
                      >
                        <option value="">Canned templates</option>
                        <option value="Peace be upon you, esteemed patron. We are highly honored to assist you with your luxury specifications.">Dignified Greeting</option>
                        <option value="Shukran for your inquiry. Our master artisans are currently verifying your customized dimensions against our heritage registry.">Tailoring Handoff</option>
                        <option value="We are delighted to confirm your same-day private courier delivery has been authorized.">Logistics Confirm</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <textarea
                      placeholder="Type your bespoke response here... (or use Gemini draft)"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="bg-black/80 border border-white/10 rounded-xs text-[11px] text-white p-2.5 w-full h-16 placeholder-zinc-700 outline-none focus:border-gold-pure resize-none"
                    />
                    <button
                      type="submit"
                      className="bg-white hover:bg-gold-pure text-black rounded-xs px-4 h-16 flex items-center justify-center cursor-pointer transition-all"
                      title="Send response"
                    >
                      <Send className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 font-sans p-8 space-y-4">
                <LifeBuoy className="w-12 h-12 text-zinc-800 animate-pulse" />
                <p className="text-xs max-w-sm">No ticket selected from master feed list.</p>
              </div>
            )}
          </div>

          {/* Column 3: Customer Context card (Span 2) */}
          <div className="lg:col-span-3 bg-zinc-950 border border-white/5 rounded-sm p-4 overflow-y-auto space-y-5 h-full">
            {activeTicket ? (
              <>
                <div className="text-center pb-4 border-b border-white/5 space-y-2">
                  <div className="w-12 h-12 bg-zinc-900 border border-gold-pure/30 rounded-full mx-auto flex items-center justify-center text-gold-pure font-mono font-bold text-sm select-none uppercase">
                    {activeTicket.customerName.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-white text-xs font-bold font-sans uppercase tracking-wider">{activeTicket.customerName}</h4>
                    <span className="text-[8.5px] font-mono text-gold-pure uppercase">Sovereign Patron</span>
                  </div>
                </div>

                {/* Inquiries / Contacts parameters */}
                <div className="space-y-3.5 text-[9.5px] font-mono">
                  <h5 className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold border-b border-white/5 pb-1 font-display">Client Concierge Core</h5>
                  <div className="space-y-2.5 text-zinc-400">
                    <p className="flex justify-between">
                      <span className="text-zinc-600 font-sans">Verified Email</span>
                      <span className="text-white truncate max-w-[140px]">{activeTicket.email}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-600 font-sans">Contact Phone</span>
                      <span className="text-white">{activeTicket.phone}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-600 font-sans">Active Channel</span>
                      <span className="text-white uppercase">{activeTicket.channel}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-600 font-sans">Inquiry Div</span>
                      <span className="text-gold-pure uppercase">{activeTicket.category}</span>
                    </p>
                  </div>
                </div>

                {/* Order Match History */}
                <div className="space-y-3 text-[9.5px] font-mono">
                  <h5 className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold border-b border-white/5 pb-1 font-display">Sovereign Purchases (LTV)</h5>
                  <div className="space-y-2">
                    {orders.filter(o => o.email === activeTicket.email).length === 0 ? (
                      <p className="text-[8px] text-zinc-600 italic font-sans py-2">No past purchases matched from master registry.</p>
                    ) : (
                      orders.filter(o => o.email === activeTicket.email).map(o => (
                        <div key={o.id} className="p-2 bg-black border border-white/5 rounded-xs space-y-1">
                          <div className="flex justify-between font-bold text-white">
                            <span>{o.id}</span>
                            <span>{o.total} SAR</span>
                          </div>
                          <div className="flex justify-between text-[7.5px] text-zinc-500">
                            <span>{o.date}</span>
                            <span className="text-emerald-400 font-bold uppercase">{o.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* SLA details */}
                <div className="p-3 bg-black/40 border border-white/5 rounded-xs space-y-2 font-mono text-[9px]">
                  <span className="text-[8px] uppercase tracking-widest text-gold-pure font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-gold-pure" /> VIP SLA POLICY
                  </span>
                  <div className="space-y-1 text-zinc-500">
                    <p>• Response Guarantee: <span className="text-white">15 mins</span></p>
                    <p>• Concierge Service level: <span className="text-white">Sovereign Tier</span></p>
                    <p>• Status: <span className="text-emerald-400 font-bold">Compliant</span></p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[10px] text-zinc-600 italic">Context loading...</p>
            )}
          </div>
        </div>
      )}

      {/* 3. TAB: AUTOMATION SANDBOX */}
      {activeSubTab === 'automation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 select-none animate-fade-in text-left">
          
          {/* Persona Editor Workbench (Span 5) */}
          <div className="lg:col-span-5 bg-zinc-950 border border-white/5 p-6 rounded-sm space-y-6">
            <div>
              <span className="text-[8px] uppercase tracking-[0.3em] text-gold-pure font-mono block mb-1">AI Concierge Automation Controller</span>
              <h3 className="text-md text-white font-bold uppercase font-display tracking-widest">PERSONA BENCH CONFIG</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[8.5px] uppercase font-mono text-zinc-500 block">System Agent Persona Instruction Prompt</label>
                <textarea
                  value={aiPersona}
                  onChange={(e) => setAiPersona(e.target.value)}
                  className="bg-black border border-white/10 rounded-xs text-[11.5px] text-white p-3.5 w-full h-44 placeholder-zinc-700 outline-none focus:border-gold-pure resize-none font-sans leading-relaxed"
                />
                <span className="text-[8px] text-zinc-500 font-mono block leading-relaxed">
                  *This instruction prompt is injected directly as a system instruction payload inside the Gemini model request, completely commanding the persona metrics of drafted answers.
                </span>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 bg-black rounded-xs border border-white/5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-white font-bold block uppercase">Enable Auto-Drafting</span>
                    <span className="text-[8.5px] text-zinc-500 font-sans block">Auto-generates draft response drafts upon incoming ticket dispatches</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAutoDraftEnabled}
                    onChange={(e) => setIsAutoDraftEnabled(e.target.checked)}
                    className="accent-gold-pure cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Prompt Sandbox Workbench Tester (Span 7) */}
          <div className="lg:col-span-7 bg-zinc-950 border border-white/5 p-6 rounded-sm space-y-6">
            <div>
              <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-500 font-mono block mb-1">AI Sandbox Testing Deck</span>
              <h3 className="text-md text-white font-bold uppercase font-display tracking-widest">LIVE PLAYGROUND TESTING</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[8.5px] uppercase font-mono text-zinc-500 block">Simulate Patron Query</label>
                <input
                  type="text"
                  value={sandboxQuery}
                  onChange={(e) => setSandboxQuery(e.target.value)}
                  className="bg-black w-full border border-white/10 text-white text-[11px] p-2.5 rounded-xs outline-none focus:border-gold-pure font-sans"
                />
              </div>

              <button
                type="button"
                onClick={testSandboxQuery}
                disabled={isSandboxLoading || !sandboxQuery.trim()}
                className="py-2 px-4 bg-gold-pure text-black font-extrabold uppercase tracking-widest text-[9.5px] cursor-pointer hover:bg-white transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSandboxLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching AI draft...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Execute Sandbox Prompt
                  </>
                )}
              </button>

              {/* Sandbox Response stage */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[8.5px] uppercase font-mono text-zinc-500 block">Dynamic Auto-Draft Output</label>
                <div className="p-4 bg-black/60 border border-white/5 rounded-xs font-sans text-xs text-zinc-300 min-h-[160px] max-h-[300px] overflow-y-auto leading-relaxed relative whitespace-pre-wrap">
                  {sandboxResponse ? (
                    <>
                      <p>{sandboxResponse}</p>
                      <span className="absolute bottom-2 right-2 text-[7.5px] font-mono text-zinc-600 bg-zinc-950 border border-white/5 px-1 rounded-sm uppercase font-bold">
                        Output Compiled
                      </span>
                    </>
                  ) : (
                    <p className="text-zinc-700 italic font-mono text-[10px] text-center pt-12 uppercase tracking-widest">Sandbox execution results will render here</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: KNOWLEDGE GUILD */}
      {activeSubTab === 'knowledge' && (
        <div className="space-y-6 select-none animate-fade-in text-left">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950 p-4 border border-white/5 rounded-xs">
            <p className="text-[10.5px] text-zinc-400 leading-relaxed max-w-xl">
              Construct articles, policies, and heritage notes inside the Knowledge Base. The AI Agent auto-references this structured documentation contextually to generate pristine responses.
            </p>
            <button
              onClick={() => setIsAddingArticle(true)}
              className="py-1.5 px-3 bg-white text-black hover:bg-gold-pure font-bold uppercase tracking-widest rounded-xs text-[9px] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Build Article
            </button>
          </div>

          {/* Adding Article Modal / Form block */}
          {isAddingArticle && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleAddKBArticle}
              className="bg-zinc-950 border border-gold-pure/30 p-5 rounded-xs space-y-4 font-mono text-[10px] shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[9px] uppercase tracking-widest font-bold text-gold-pure flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Building Custom KB Article</span>
                <button type="button" onClick={() => setIsAddingArticle(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase text-zinc-500">Article Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saffron Specialty storage regulations"
                    value={kbFormTitle}
                    onChange={(e) => setKbFormTitle(e.target.value)}
                    className="bg-black border border-white/10 text-white text-[10.5px] p-2 rounded-xs w-full outline-none focus:border-gold-pure font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase text-zinc-500">Category Division</label>
                  <select
                    value={kbFormCategory}
                    onChange={(e) => setKbFormCategory(e.target.value)}
                    className="bg-black border border-white/10 text-white text-[10px] py-1.5 px-2 rounded-xs w-full outline-none focus:border-gold-pure"
                  >
                    <option value="Tailoring">Tailoring</option>
                    <option value="Coffee & Cafe">Coffee & Cafe</option>
                    <option value="Organic Market">Organic Market</option>
                    <option value="Luxury Thobes">Luxury Thobes</option>
                    <option value="Shipping">Shipping</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase text-zinc-500">Structured Content</label>
                <textarea
                  required
                  placeholder="Provide precise details, guidelines, or answers for the AI agent reference."
                  value={kbFormContent}
                  onChange={(e) => setKbFormContent(e.target.value)}
                  className="bg-black border border-white/10 text-white text-[11px] p-2.5 w-full h-24 outline-none focus:border-gold-pure font-sans resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddingArticle(false)}
                  className="py-1.5 px-3 text-zinc-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-3 bg-gold-pure text-black font-bold uppercase tracking-widest text-[9.5px]"
                >
                  Save Guild Article
                </button>
              </div>
            </motion.form>
          )}

          {/* Articles list grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kbArticles.map(art => (
              <div key={art.id} className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3 flex flex-col justify-between hover:border-gold-pure/30 duration-200">
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-mono text-gold-pure bg-gold-pure/5 px-2 py-0.5 rounded-sm uppercase tracking-wider border border-gold-pure/15">
                      {art.category}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-600 font-bold">{art.id}</span>
                  </div>

                  <h4 className="text-white text-xs font-bold font-sans uppercase tracking-wide leading-relaxed line-clamp-1">{art.title}</h4>
                  <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed line-clamp-4 italic">"{art.content}"</p>
                </div>

                <div className="flex justify-between items-center text-[8px] font-mono text-zinc-600 border-t border-white/5 pt-3 mt-2">
                  <span>Author: {art.author}</span>
                  <div className="flex gap-2">
                    <span className="font-bold">{art.views} views</span>
                    <button
                      onClick={() => deleteKBArticle(art.id, art.title)}
                      className="text-rose-500 hover:text-rose-400 font-bold uppercase cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB: REPORTS & KPIS */}
      {activeSubTab === 'reports' && (
        <div className="space-y-8 select-none animate-fade-in text-left">
          
          {/* Numeric KPIs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-left">
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-1 relative">
              <span className="text-[8px] uppercase tracking-widest text-zinc-500 block">Avg First Response Time</span>
              <span className="text-xl sm:text-2xl text-gold-pure font-bold block">7.2 minutes</span>
              <span className="text-[8px] text-emerald-400 font-sans font-bold">▲ 14% improvement vs June</span>
            </div>
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-1">
              <span className="text-[8px] uppercase tracking-widest text-zinc-500 block">SLA Compliance Rate</span>
              <span className="text-xl sm:text-2xl text-white font-bold block">98.6% compliance</span>
              <span className="text-[8px] text-emerald-400 font-sans font-bold">▲ Inside luxury threshold limits</span>
            </div>
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-1">
              <span className="text-[8px] uppercase tracking-widest text-zinc-500 block">Sovereign Resolved Volume</span>
              <span className="text-xl sm:text-2xl text-white font-bold block">{kpiMetrics.solved} Solved Tickets</span>
              <span className="text-[8px] text-zinc-500 font-sans">Across 4 major divisions</span>
            </div>
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-1">
              <span className="text-[8px] uppercase tracking-widest text-zinc-500 block">Bespoke Active Patrons</span>
              <span className="text-xl sm:text-2xl text-white font-bold block">{kpiMetrics.activePatrons} Live Inquirers</span>
              <span className="text-[8px] text-gold-pure font-bold uppercase tracking-widest">Sovereign Service</span>
            </div>
          </div>

          {/* Recharts Graphical Dashboards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Chart 1: SLA compliance trend (Span 8) */}
            <div className="lg:col-span-8 bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <h3 className="text-white text-[10px] font-display uppercase tracking-widest">SLA Compliance Trend Analysis</h3>
              
              <div className="h-[240px] w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { name: 'July 10', compliance: 95.5 },
                      { name: 'July 11', compliance: 96.8 },
                      { name: 'July 12', compliance: 96.2 },
                      { name: 'July 13', compliance: 98.4 },
                      { name: 'July 14', compliance: 97.9 },
                      { name: 'July 15', compliance: 98.6 },
                      { name: 'July 16', compliance: 99.1 }
                    ]}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSlaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#222" tick={{ fill: '#666', fontSize: 9 }} />
                    <YAxis stroke="#222" domain={[90, 100]} tick={{ fill: '#666', fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#090909', borderColor: '#222', color: '#fff' }} />
                    <Area type="monotone" dataKey="compliance" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorSlaGrad)" name="SLA %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: SLA allocation pie (Span 4) */}
            <div className="lg:col-span-4 bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <h3 className="text-white text-[10px] font-display uppercase tracking-widest">Volume Allocation by Division</h3>
              
              <div className="h-[180px] w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kpiMetrics.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {kpiMetrics.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#090909', borderColor: '#222' }} />
                  </PieChart>
                </ResponsiveContainer>
                <p className="absolute text-[9px] uppercase font-display tracking-widest text-gold-pure font-bold">5 Divisions</p>
              </div>

              {/* Legends list */}
              <div className="space-y-1.5 text-[8.5px] font-mono">
                {kpiMetrics.pieData.map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-zinc-500 font-sans">{entry.name}</span>
                    </div>
                    <span className="text-white font-bold">{entry.value} ticket(s)</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Audit Logs Block */}
          <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
            <h3 className="text-white text-[10px] font-display uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-gold-pure" /> SECURITY WORKSPACE AUDIT LOGS
            </h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto font-mono text-[9px]">
              {auditLogs.map(log => (
                <div key={log.id} className="p-3 bg-black/40 border border-white/5 rounded-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-zinc-400 hover:border-gold-pure/20 duration-150">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">[{log.type.toUpperCase()}]</span>
                      <span className="text-gold-pure font-bold">{log.id}</span>
                      <span>•</span>
                      <span className="text-zinc-600">Steward: {log.user}</span>
                    </div>
                    <p className="text-zinc-300 font-sans">{log.action}</p>
                  </div>
                  <span className="text-zinc-600 text-[8px] font-semibold shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Conversations', value: kpiMetrics.totalConversations },
          { label: 'Active Live Chats', value: kpiMetrics.activeChats },
          { label: 'Pending Replies', value: kpiMetrics.pendingReplies },
          { label: 'Resolved Today', value: kpiMetrics.resolvedToday },
          { label: 'Avg Response Time', value: kpiMetrics.avgResponseTime },
          { label: 'CSAT', value: kpiMetrics.csat },
          { label: 'First Response Time', value: kpiMetrics.firstResponseTime },
          { label: 'SLA Compliance', value: kpiMetrics.slaCompliance }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
            <h4 className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{kpi.label}</h4>
            <p className="text-xl text-white font-mono font-bold mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {activeSubTab === 'provider' && (
        <div className="space-y-6 select-none animate-fade-in text-left">
          
          <div className="bg-zinc-950 p-5 border border-white/5 rounded-xs space-y-2">
            <h3 className="text-sm text-gold-pure font-bold uppercase tracking-wider font-display flex items-center gap-2">
              <Server className="w-4.5 h-4.5 text-gold-pure" /> COMMUNICATIONS INFRASTRUCTURE INTERFACE
            </h3>
            <p className="text-[10.5px] text-zinc-400 leading-relaxed max-w-xl">
              This panel enables real-time switching of the backend communications provider. The Sovereign UI automatically routes support requests, live transcripts, and notifications through the chosen active API.
            </p>
          </div>

          {/* Providers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                id: 'livechat',
                name: `${brandName} Live Chat Widget`,
                desc: 'Premium integrated client-side chat socket with fallback offline templates.',
                icon: MessageCircle,
                fields: [
                  { label: 'Active Socket ID', value: providerConfigFields.apiKey, key: 'apiKey' },
                  { label: 'Websocket Connection URL', value: providerConfigFields.webhookUrl, key: 'webhookUrl' }
                ]
              },
              {
                id: 'whatsapp',
                name: 'WhatsApp Business Elite API',
                desc: 'Direct-trade client routing using priority green-badge WhatsApp channels.',
                icon: MessageSquare,
                fields: [
                  { label: 'Registered Business Phone', value: providerConfigFields.whatsappPhone, key: 'whatsappPhone' },
                  { label: 'API Authorization Token', value: 'Bearer wa_elite_prod_99182', key: 'apiToken' }
                ]
              },
              {
                id: 'email',
                name: 'Royal SMTP Concierge Service',
                desc: 'Curated high-contrast HTML dispatchers routed via priority SMTP mail gates.',
                icon: Mail,
                fields: [
                  { label: 'SMTP Connection Host', value: providerConfigFields.smtpHost, key: 'smtpHost' },
                  { label: 'SMTP Authorization Principal', value: 'concierge@zoalgroup.com', key: 'smtpPrincipal' }
                ]
              },
              {
                id: 'sms',
                name: 'SMS Priority Gateway (GCC)',
                desc: 'Saudi-direct priority cell messaging with custom sender IDs.',
                icon: Phone,
                fields: [
                  { label: 'GCC Unified Gateway ID', value: 'GW-GCC-ZOAL-991', key: 'gccGate' },
                  { label: 'Priority Sender Name ID', value: `${brandName.toUpperCase()}_SMS`, key: 'smsId' }
                ]
              }
            ].map(p => {
              const Icon = p.icon;
              const isSelected = activeProvider === p.id;

              return (
                <div
                  key={p.id}
                  className={`bg-zinc-950 border p-5 rounded-xs flex flex-col justify-between space-y-4 relative transition-all duration-300 ${
                    isSelected 
                      ? 'border-gold-pure bg-gold-pure/5 shadow-[0_4px_30px_rgba(212,175,55,0.08)]' 
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between items-center">
                      <div className="w-10 h-10 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-gold-pure animate-pulse' : 'text-zinc-400'}`} />
                      </div>

                      {isSelected ? (
                        <span className="bg-emerald-950/20 text-emerald-400 border border-emerald-500/10 rounded-sm px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ACTIVE
                        </span>
                      ) : (
                        <span className="bg-zinc-900 text-zinc-500 border border-white/5 rounded-sm px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest">
                          OFFLINE
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-white text-xs font-bold font-sans uppercase tracking-wider">{p.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-sans leading-relaxed mt-1">{p.desc}</p>
                    </div>

                    {/* Fields preview */}
                    <div className="bg-black/40 border border-white/5 p-2.5 rounded-xs space-y-2 font-mono text-[8.5px]">
                      {p.fields.map((f, fIdx) => (
                        <div key={fIdx} className="space-y-0.5">
                          <span className="text-zinc-600 block uppercase font-bold">{f.label}</span>
                          <span className="text-white truncate block">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleConnectProvider(p.id as any)}
                    disabled={isSelected || isConnectingProvider}
                    className={`w-full py-1.5 rounded-xs text-[9px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 text-zinc-500 border border-white/5 cursor-not-allowed'
                        : 'bg-white hover:bg-gold-pure text-black font-extrabold'
                    }`}
                  >
                    {isConnectingProvider && !isSelected ? (
                      <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin" /> Verifying...</span>
                    ) : isSelected ? (
                      'Provider Connected'
                    ) : (
                      'Switch Provider'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
