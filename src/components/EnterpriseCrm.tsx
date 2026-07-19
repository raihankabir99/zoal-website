import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, Activity, Download, Mail, Phone, MapPin, Calendar, Clock,
  DollarSign, TrendingUp, ShoppingBag, Heart, MessageSquare, ShieldAlert,
  CheckCircle, Ban, AlertTriangle, Plus, Search, Filter, ArrowUpRight,
  ArrowLeft, Eye, Edit3, X, ChevronRight, Award, Trash2, Tag, BookOpen,
  Send, ShieldCheck, Check, UserCheck, Lock, CreditCard, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie, LineChart, Line, Legend
} from 'recharts';
import { Order } from '../types';
import { formatCurrency } from '../utils';
import { useBranding } from './BrandingContext';

// --- TS Interfaces ---
export interface CustomerCrmProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string;
  country: string;
  city: string;
  registrationDate: string;
  status: 'Active' | 'Inactive' | 'Blocked' | 'Suspended' | 'VIP' | 'Verified';
  segment: 'New Customer' | 'Returning Customer' | 'Regular Customer' | 'VIP Customer' | 'Inactive Customer' | 'High Value Customer' | 'Frequent Buyer';
  gender: 'Male' | 'Female' | 'Other';
  birthday: string;
  preferredLanguage: string;
  lastLogin: string;
  lastPurchase?: string;
  notes: {
    id: string;
    type: 'Internal' | 'Follow-up' | 'Support';
    content: string;
    priority: 'High' | 'Medium' | 'Low';
    author: string;
    date: string;
  }[];
  addresses: {
    id: string;
    type: 'Shipping' | 'Billing';
    isDefault: boolean;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }[];
  wishlist: string[];
  savedCart: {
    productName: string;
    quantity: number;
    price: number;
  }[];
  reviews: {
    id: string;
    productName: string;
    rating: number;
    comment: string;
    date: string;
    approved: boolean;
    rejected?: boolean;
    reply?: string;
  }[];
  marketingPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    whatsapp: boolean;
    newsletter: boolean;
    promotionalOffers: boolean;
  };
  communicationHistory: {
    id: string;
    channel: 'Email' | 'SMS' | 'WhatsApp' | 'Notification' | 'Campaign' | 'Support Response';
    subject: string;
    body: string;
    date: string;
    status: 'Sent' | 'Failed' | 'Delivered';
  }[];
  paymentSummary: {
    methods: {
      type: 'Credit Card' | 'Apple Pay' | 'Mada' | 'Bank Transfer';
      last4?: string;
      isDefault: boolean;
    }[];
    transactions: {
      id: string;
      amount: number;
      date: string;
      status: string;
    }[];
  };
  activityTimeline: {
    id: string;
    event: 'Registration' | 'Login' | 'Logout' | 'Profile Update' | 'Password Change' | 'Order' | 'Return' | 'Refund' | 'Review' | 'Wishlist Update' | 'Address Change' | 'Notification History' | 'Marketing Interaction' | 'Status Change' | 'Note Added' | 'Preferences Updated' | 'Subscription Changed' | 'Profile Viewed' | 'Export Generated';
    description: string;
    time: string;
  }[];
  
  // Enterprise Extended Loyalty Profile Attributes
  loyaltyPoints?: number;
  membershipLevel?: 'Bronze' | 'Silver' | 'Gold';
  referralCredits?: number;
  birthdayReward?: 'Available' | 'Claimed' | 'Expired' | 'None';
  coupons?: {
    code: string;
    discount: string;
    expires: string;
    status: 'Active' | 'Redeemed' | 'Expired';
  }[];
  rewards?: {
    id: string;
    title: string;
    pointsCost: number;
    status: 'Unlocked' | 'Locked' | 'Redeemed';
  }[];
  
  // Enterprise Tagging and Archiving status
  tags?: string[];
  archived?: boolean;
  manualSegment?: boolean;
}

interface EnterpriseCrmProps {
  currentUser: {
    name: string;
    email: string;
    role: string;
  } | null;
  orders: Order[];
  addLog: (action: string, target?: string) => void;
}

// --- STATIC SEED CLIENTS DATABASE ---
const SEED_CRM_CUSTOMERS: CustomerCrmProfile[] = [
  {
    id: 'ZL-CRM-1001',
    name: 'Amna Al-Saeed',
    email: 'amna.saeed@royal.sa',
    phone: '+966 55 501 2345',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    country: 'Saudi Arabia',
    city: 'Hofuf',
    registrationDate: '2026-01-10',
    status: 'VIP',
    segment: 'Frequent Buyer',
    gender: 'Female',
    birthday: '1992-04-18',
    preferredLanguage: 'Arabic',
    lastLogin: '2026-07-15 12:45',
    lastPurchase: '2026-07-12',
    notes: [
      {
        id: 'n-1',
        type: 'Internal',
        content: 'Prefers saffron levels elevated slightly in custom cafe orders. Standard dress sizing: EUR 38.',
        priority: 'High',
        author: 'Khalid Al-Mansoori',
        date: '2026-05-12 14:30'
      }
    ],
    addresses: [
      {
        id: 'adr-1',
        type: 'Shipping',
        isDefault: true,
        street: 'King Fahd Road, Royal Palm Estates',
        city: 'Hofuf',
        state: 'Eastern Province',
        zip: '36361',
        country: 'Saudi Arabia'
      },
      {
        id: 'adr-2',
        type: 'Billing',
        isDefault: false,
        street: 'Elite Corporate Office Tower B, Fl 18',
        city: 'Branch A',
        state: 'Central Region',
        zip: '12211',
        country: 'Saudi Arabia'
      }
    ],
    wishlist: ['ZOAL Royal Saffron Gold Latte', 'Bespoke Sudanese Toob'],
    savedCart: [
      { productName: 'Heritage Organic Karkadeh Flowers', quantity: 2, price: 75 }
    ],
    reviews: [
      {
        id: 'rev-1',
        productName: 'ZOAL Royal Saffron Gold Latte',
        rating: 5,
        comment: 'Absolutely spectacular blend. Saffron aroma is majestic.',
        date: '2026-06-20',
        approved: true
      }
    ],
    marketingPreferences: { email: true, sms: true, push: false, whatsapp: true, newsletter: true, promotionalOffers: true },
    communicationHistory: [
      {
        id: 'comm-1',
        channel: 'WhatsApp',
        subject: 'Bespoke Sizing Check',
        body: 'Assalamu Alaikum Patron Amna, your custom Toob sizing has been updated.',
        date: '2026-07-10',
        status: 'Delivered'
      }
    ],
    paymentSummary: {
      methods: [
        { type: 'Apple Pay', isDefault: true },
        { type: 'Credit Card', last4: '8812', isDefault: false }
      ],
      transactions: [
        { id: 'tx-201', amount: 950, date: '2026-07-12', status: 'Succeeded' }
      ]
    },
    activityTimeline: [
      { id: 'act-1', event: 'Registration', description: 'VIP Client Profile registered via Branch A flagship portal', time: '2026-01-10 10:00' },
      { id: 'act-2', event: 'Order', description: 'Placed Order #ZL-9110 for 950 SAR', time: '2026-07-12 11:20' }
    ]
  },
  {
    id: 'ZL-CRM-1002',
    name: 'Yousef Al-Ahmad',
    email: 'yousef.ahmad@vip.sa',
    phone: '+966 50 488 1234',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    country: 'Saudi Arabia',
    city: 'Branch A',
    registrationDate: '2026-02-14',
    status: 'Verified',
    segment: 'VIP Customer',
    gender: 'Male',
    birthday: '1985-09-02',
    preferredLanguage: 'English',
    lastLogin: '2026-07-14 09:12',
    lastPurchase: '2026-06-25',
    notes: [
      {
        id: 'n-2',
        type: 'Support',
        content: 'Inquired about international express dispatch options to London.',
        priority: 'Medium',
        author: 'Sumaya Bashir',
        date: '2026-06-14 11:05'
      }
    ],
    addresses: [
      {
        id: 'adr-3',
        type: 'Shipping',
        isDefault: true,
        street: 'Olaya District, Al Urubah Rd',
        city: 'Branch A',
        state: 'Branch A Region',
        zip: '11564',
        country: 'Saudi Arabia'
      }
    ],
    wishlist: ['Luxury Men\'s Thobe'],
    savedCart: [],
    reviews: [],
    marketingPreferences: { email: true, sms: false, push: true, whatsapp: false, newsletter: true, promotionalOffers: true },
    communicationHistory: [
      {
        id: 'comm-2',
        channel: 'Email',
        subject: 'Premium VIP Invitation',
        body: 'We invite you to the private showcase of our Winter Thobe collection.',
        date: '2026-07-01',
        status: 'Sent'
      }
    ],
    paymentSummary: {
      methods: [
        { type: 'Mada', last4: '4450', isDefault: true }
      ],
      transactions: [
        { id: 'tx-202', amount: 3200, date: '2026-06-25', status: 'Succeeded' }
      ]
    },
    activityTimeline: [
      { id: 'act-3', event: 'Registration', description: 'Registered at Khobar boutique grand opening', time: '2026-02-14 18:30' },
      { id: 'act-4', event: 'Wishlist Update', description: 'Saved Luxury Men\'s Thobe to private list', time: '2026-06-24 15:44' }
    ]
  },
  {
    id: 'ZL-CRM-1003',
    name: 'Hessa Al-Otaibi',
    email: 'hessa.otaibi@luxury.sa',
    phone: '+966 54 321 0987',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    country: 'Saudi Arabia',
    city: 'Jeddah',
    registrationDate: '2026-03-20',
    status: 'Active',
    segment: 'High Value Customer',
    gender: 'Female',
    birthday: '1995-12-15',
    preferredLanguage: 'Arabic',
    lastLogin: '2026-07-15 14:10',
    lastPurchase: '2026-07-02',
    notes: [],
    addresses: [
      {
        id: 'adr-4',
        type: 'Shipping',
        isDefault: true,
        street: 'Corniche Rd, Al Hamra District',
        city: 'Jeddah',
        state: 'Makkah Province',
        zip: '21432',
        country: 'Saudi Arabia'
      }
    ],
    wishlist: ['ZOAL Royal Saffron Gold Latte'],
    savedCart: [],
    reviews: [],
    marketingPreferences: { email: true, sms: true, push: true, whatsapp: true, newsletter: true, promotionalOffers: true },
    communicationHistory: [],
    paymentSummary: {
      methods: [
        { type: 'Apple Pay', isDefault: true }
      ],
      transactions: []
    },
    activityTimeline: [
      { id: 'act-5', event: 'Registration', description: 'Account verified', time: '2026-03-20 14:15' }
    ]
  },
  {
    id: 'ZL-CRM-1004',
    name: 'Ahmad Al-Ghamdi',
    email: 'alzoal3003@gmail.com', // Match mock order email!
    phone: '+966 56 769 9315',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    country: 'Saudi Arabia',
    city: 'Branch B',
    registrationDate: '2026-04-05',
    status: 'VIP',
    segment: 'Returning Customer',
    gender: 'Male',
    birthday: '1989-11-20',
    preferredLanguage: 'Arabic',
    lastLogin: '2026-07-15 13:50',
    lastPurchase: '2026-06-05',
    notes: [
      {
        id: 'n-3',
        type: 'Follow-up',
        content: 'Check satisfaction of Swiss Ice Spheres choice. High preference for local courier dispatch.',
        priority: 'High',
        author: 'System',
        date: '2026-06-06 09:00'
      }
    ],
    addresses: [
      {
        id: 'adr-5',
        type: 'Shipping',
        isDefault: true,
        street: 'Main District, Saudi Arabia',
        city: 'Branch B',
        state: 'Eastern Province',
        zip: '31411',
        country: 'Saudi Arabia'
      }
    ],
    wishlist: [],
    savedCart: [],
    reviews: [],
    marketingPreferences: { email: true, sms: true, push: false, whatsapp: false, newsletter: true, promotionalOffers: true },
    communicationHistory: [],
    paymentSummary: {
      methods: [
        { type: 'Apple Pay', isDefault: true }
      ],
      transactions: []
    },
    activityTimeline: [
      { id: 'act-6', event: 'Registration', description: 'Client initiated registration', time: '2026-04-05 15:22' },
      { id: 'act-7', event: 'Login', description: 'Logged in from macOS / Chrome', time: '2026-07-15 13:50' }
    ]
  },
  {
    id: 'ZL-CRM-1005',
    name: 'Faisal bin Sultan',
    email: 'faisal.sultan@flagship.sa',
    phone: '+966 56 769 9315',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    country: 'Saudi Arabia',
    city: 'Branch B',
    registrationDate: '2026-05-18',
    status: 'Verified',
    segment: 'Regular Customer',
    gender: 'Male',
    birthday: '1978-01-30',
    preferredLanguage: 'English',
    lastLogin: '2026-07-10 11:30',
    lastPurchase: '2026-05-20',
    notes: [],
    addresses: [
      {
        id: 'adr-6',
        type: 'Shipping',
        isDefault: true,
        street: 'Corniche Rd, Pearl Tower',
        city: 'Branch B',
        state: 'Eastern Province',
        zip: '31422',
        country: 'Saudi Arabia'
      }
    ],
    wishlist: [],
    savedCart: [],
    reviews: [],
    marketingPreferences: { email: false, sms: false, push: false, whatsapp: false, newsletter: false, promotionalOffers: false },
    communicationHistory: [],
    paymentSummary: {
      methods: [],
      transactions: []
    },
    activityTimeline: []
  },
  {
    id: 'ZL-CRM-1006',
    name: 'Reem Al-Ghamdi',
    email: 'reem.ghamdi@khobar.sa',
    phone: '+966 59 991 8822',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    country: 'Saudi Arabia',
    city: 'Khobar',
    registrationDate: '2026-07-01',
    status: 'Verified',
    segment: 'New Customer',
    gender: 'Female',
    birthday: '1998-07-11',
    preferredLanguage: 'English',
    lastLogin: '2026-07-15 14:35',
    notes: [],
    addresses: [],
    wishlist: [],
    savedCart: [],
    reviews: [],
    marketingPreferences: { email: true, sms: true, push: true, whatsapp: true, newsletter: true, promotionalOffers: true },
    communicationHistory: [],
    paymentSummary: {
      methods: [],
      transactions: []
    },
    activityTimeline: [
      { id: 'act-8', event: 'Registration', description: 'Social OAuth Register Success', time: '2026-07-01 10:11' }
    ]
  },
  {
    id: 'ZL-CRM-1007',
    name: 'Khalid bin Al-Waleed',
    email: 'khalid.waleed@elite.sa',
    phone: '+966 53 111 2222',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    country: 'Saudi Arabia',
    city: 'Branch A',
    registrationDate: '2025-11-12',
    status: 'Suspended',
    segment: 'Inactive Customer',
    gender: 'Male',
    birthday: '1981-05-14',
    preferredLanguage: 'Arabic',
    lastLogin: '2026-05-02 08:20',
    notes: [
      {
        id: 'n-4',
        type: 'Internal',
        content: 'Account suspended temporarily due to consecutive uncollected cash-on-delivery orders.',
        priority: 'High',
        author: 'Admin Gateway',
        date: '2026-05-05 17:11'
      }
    ],
    addresses: [
      {
        id: 'adr-7',
        type: 'Shipping',
        isDefault: true,
        street: 'Diplomatic Quarter, Villa 41',
        city: 'Branch A',
        state: 'Central Region',
        zip: '11693',
        country: 'Saudi Arabia'
      }
    ],
    wishlist: [],
    savedCart: [],
    reviews: [],
    marketingPreferences: { email: false, sms: false, push: false, whatsapp: false, newsletter: false, promotionalOffers: false },
    communicationHistory: [],
    paymentSummary: {
      methods: [],
      transactions: []
    },
    activityTimeline: [
      { id: 'act-9', event: 'Address Change', description: 'Added Diplomatic Quarter shipping coordinates', time: '2026-04-12 11:22' }
    ]
  }
];

export default function EnterpriseCrm({ currentUser, orders, addLog }: EnterpriseCrmProps) {
  const { settings } = useBranding();
  // Localized RBAC Override Simulator for Preview/Reviewers
  const [activeRole, setActiveRole] = useState<string>(() => {
    return currentUser?.role || 'admin';
  });

  const isStaff = activeRole === 'staff';
  const isAdmin = activeRole === 'admin';

  // Helper to trigger system alerts for the main Admin Dashboard
  const addAdminNotification = (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info', category: string) => {
    try {
      const raw = localStorage.getItem('zoal_admin_notifications_v2');
      let currentNotifs: any[] = [];
      if (raw) {
        currentNotifs = JSON.parse(raw);
      }
      const newNotif = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title,
        message,
        time: 'Just now',
        type,
        category,
        status: 'unread'
      };
      localStorage.setItem('zoal_admin_notifications_v2', JSON.stringify([newNotif, ...currentNotifs]));
    } catch (e) {
      console.error('Failed to add admin notification:', e);
    }
  };

  // --- Core State Management ---
  const [customers, setCustomers] = useState<CustomerCrmProfile[]>(() => {
    const saved = localStorage.getItem('zoal_crm_customers_db');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse CRM db:', e);
      }
    }
    return SEED_CRM_CUSTOMERS;
  });

  useEffect(() => {
    localStorage.setItem('zoal_crm_customers_db', JSON.stringify(customers));
  }, [customers]);

  // Sync real-time shop orders with the customers database dynamic variables
  const customersWithOrders = useMemo(() => {
    return customers.map(cust => {
      // Find orders matching this customer email
      const matchedOrders = orders.filter(o => o.email.toLowerCase() === cust.email.toLowerCase());
      
      const totalSpending = matchedOrders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + o.total : sum, 0);
      const totalOrdersCount = matchedOrders.length;
      const lastPurchaseDate = matchedOrders.length > 0 ? matchedOrders[0].date : cust.lastPurchase;
      const lastPurchaseTotal = matchedOrders.length > 0 ? matchedOrders[0].total : 0;

      // Calculate AOV
      const aov = totalOrdersCount > 0 ? Math.round(totalSpending / totalOrdersCount) : 0;

      // Base spending for calculations
      const baseSpend = totalSpending || (cust.id === 'ZL-CRM-1001' ? 950 : cust.id === 'ZL-CRM-1002' ? 3200 : cust.id === 'ZL-CRM-1003' ? 1200 : cust.id === 'ZL-CRM-1004' ? 450 : 0);
      const baseOrders = totalOrdersCount || (cust.id === 'ZL-CRM-1001' ? 1 : cust.id === 'ZL-CRM-1002' ? 1 : cust.id === 'ZL-CRM-1003' ? 1 : cust.id === 'ZL-CRM-1004' ? 0 : 0);
      const finalAov = baseOrders > 0 ? Math.round(baseSpend / baseOrders) : 0;

      // Derive Loyalty parameters
      const loyaltyPts = cust.loyaltyPoints !== undefined ? cust.loyaltyPoints : Math.round(baseSpend / 2);
      const membershipLvl = cust.membershipLevel || (baseSpend >= 3000 ? 'Gold' : baseSpend >= 800 ? 'Silver' : 'Bronze');
      const refCredits = cust.referralCredits !== undefined ? cust.referralCredits : (cust.id === 'ZL-CRM-1001' ? 150 : cust.id === 'ZL-CRM-1002' ? 300 : 0);
      const birthdayRwd = cust.birthdayReward || (cust.id === 'ZL-CRM-1001' ? 'Available' : 'None');

      // Populate default coupons
      const crmCoupons = cust.coupons || [
        { code: 'ZOALPRESTIGE', discount: '15% Off Coffee', expires: '2026-12-31', status: 'Active' as const },
        { code: 'VIPGOLD500', discount: '500 SAR Gift', expires: '2026-10-31', status: 'Active' as const }
      ];

      // Populate default loyalty rewards
      const crmRewards = cust.rewards || [
        { id: 'rw-1', title: 'Complimentary Single Origin Saffron Blend Cup', pointsCost: 100, status: 'Unlocked' as const },
        { id: 'rw-2', title: 'Prestige Private Coffee Tasting Gathering for Two', pointsCost: 400, status: 'Locked' as const },
        { id: 'rw-3', title: 'Bespoke Sudanese Toob Gold Stitch Accent Upgrade', pointsCost: 800, status: 'Locked' as const }
      ];

      // Enriched Review structures
      const enrichedReviews = (cust.reviews || []).map((r, rIdx) => ({
        id: r.id || `rev-${cust.id}-${rIdx}`,
        productName: r.productName,
        rating: r.rating,
        comment: r.comment,
        date: r.date,
        approved: r.approved !== undefined ? r.approved : true,
        rejected: r.rejected || false,
        reply: r.reply || ''
      }));

      // Marketing preferences
      const enrichedMarketing = {
        email: cust.marketingPreferences.email,
        sms: cust.marketingPreferences.sms,
        push: cust.marketingPreferences.push,
        whatsapp: cust.marketingPreferences.whatsapp,
        newsletter: cust.marketingPreferences.newsletter !== undefined ? cust.marketingPreferences.newsletter : true,
        promotionalOffers: cust.marketingPreferences.promotionalOffers !== undefined ? cust.marketingPreferences.promotionalOffers : true
      };

      // Map communicationHistory to communicationsTimeline expected by UI
      const enrichedCommunications = (cust.communicationHistory || []).map((comm) => ({
        id: comm.id,
        channel: comm.channel,
        type: comm.subject,
        content: comm.body,
        date: comm.date,
        status: comm.status || 'Sent'
      }));

      // Tags
      const crmTags = cust.tags || (cust.id === 'ZL-CRM-1001' ? ['Saffron-Lover', 'VIP-Patron'] : cust.id === 'ZL-CRM-1002' ? ['High-Value', 'Sovereign-Elite'] : ['Standard-Registry']);

      // Auto-classify segment if not manually overridden
      let calculatedSegment = cust.segment;
      if (!cust.manualSegment) {
        if (cust.status === 'Blocked' || cust.status === 'Suspended') {
          calculatedSegment = 'Inactive Customer';
        } else if (cust.status === 'VIP' || baseSpend >= 3000) {
          calculatedSegment = 'VIP Customer';
        } else if (baseSpend >= 2000) {
          calculatedSegment = 'High Value Customer';
        } else if (baseOrders >= 4) {
          calculatedSegment = 'Frequent Buyer';
        } else if (baseOrders >= 2) {
          calculatedSegment = 'Regular Customer';
        } else if (baseOrders === 1) {
          calculatedSegment = 'Returning Customer';
        } else {
          calculatedSegment = 'New Customer';
        }
      }

      return {
        ...cust,
        segment: calculatedSegment,
        orderHistory: matchedOrders,
        totalOrders: baseOrders,
        totalSpending: baseSpend,
        averageOrderValue: finalAov,
        lastPurchase: lastPurchaseDate,
        
        // Loyalty properties
        loyaltyPoints: loyaltyPts,
        membershipLevel: membershipLvl,
        referralCredits: refCredits,
        birthdayReward: birthdayRwd,
        coupons: crmCoupons,
        rewards: crmRewards,
        
        // Extended structures
        reviews: enrichedReviews,
        marketingPreferences: enrichedMarketing,
        communicationsTimeline: enrichedCommunications,
        tags: crmTags,
        archived: cust.archived || false
      };
    });
  }, [customers, orders]);

  // CRM Sub tabs
  const [crmSubTab, setCrmSubTab] = useState<'dashboard' | 'list'>('dashboard');

  // Customer Profile Detail Tab
  const [activeDrawerTab, setActiveDrawerTab] = useState<'orders' | 'analytics' | 'loyalty' | 'communications' | 'reviews'>('orders');

  // Multiselect checkboxes for Bulk Actions
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  // Reports and Bulk Actions Modals
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [activeReportType, setActiveReportType] = useState<'general' | 'vip' | 'inactive' | 'revenue' | 'marketing' | 'registrations'>('general');
  const [showBulkNotifyModal, setShowBulkNotifyModal] = useState(false);
  const [bulkNotifyChannel, setBulkNotifyChannel] = useState<'Email' | 'SMS' | 'WhatsApp'>('Email');
  const [bulkNotifySubject, setBulkNotifySubject] = useState('');
  const [bulkNotifyBody, setBulkNotifyBody] = useState('');
  const [bulkTagInput, setBulkTagInput] = useState('');

  // Selected customer for Profile drawer/detail view
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customersWithOrders.find(c => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, customersWithOrders]);

  // --- Filtering & Sorting States for List ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSegment, setFilterSegment] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterRegDateRange, setFilterRegDateRange] = useState('all'); // all, month, year
  const [filterVipStatus, setFilterVipStatus] = useState('all'); // all, vip, non-vip
  const [minSpend, setMinSpend] = useState('');
  const [maxSpend, setMaxSpend] = useState('');
  const [minOrders, setMinOrders] = useState('');
  const [maxOrders, setMaxOrders] = useState('');
  const [filterMarketingSub, setFilterMarketingSub] = useState('all'); // all, email, sms, whatsapp, push, newsletter, promotionalOffers
  const [sortBy, setSortBy] = useState<'name' | 'spend' | 'orders' | 'date'>('spend');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Manual Permission Check for modifying addresses
  const [addressEditPermitted, setAddressEditPermitted] = useState(false);

  // Note creation inputs
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<'Internal' | 'Follow-up' | 'Support'>('Internal');
  const [newNotePriority, setNewNotePriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Customer creation state/modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Branch A',
    country: 'Saudi Arabia',
    gender: 'Male' as 'Male' | 'Female',
    birthday: '',
    language: 'Arabic'
  });

  // --- CALCULATE EXECUTIVE CRM METRICS ---
  const crmMetrics = useMemo(() => {
    const list = customersWithOrders;
    const total = list.length;
    const active = list.filter(c => c.status === 'Active' || c.status === 'Verified' || c.status === 'VIP').length;
    const inactive = list.filter(c => c.status === 'Inactive' || c.status === 'Suspended' || c.status === 'Blocked').length;
    const vip = list.filter(c => c.status === 'VIP').length;

    // Segment aggregates
    const returning = list.filter(c => c.totalOrders > 1 || c.segment === 'Returning Customer').length;

    // Revenue metrics
    const totalRevenue = list.reduce((sum, c) => sum + c.totalSpending, 0);
    const avgOrderValue = totalRevenue > 0 ? Math.round(totalRevenue / list.reduce((sum, c) => sum + c.totalOrders, 0)) : 0;
    const clv = total > 0 ? Math.round(totalRevenue / total) : 0;

    // Today dynamic mock new counter
    const newToday = list.filter(c => c.registrationDate === '2026-07-15' || c.registrationDate === new Date().toISOString().slice(0, 10)).length;

    return {
      total,
      active,
      inactive,
      vip,
      returning,
      newToday,
      totalRevenue,
      avgOrderValue,
      clv
    };
  }, [customersWithOrders]);

  // --- RECHARTS CHART PREPARATIONS ---
  // A. Customer Growth Over Time
  const customerGrowthData = [
    { month: 'Jan', registered: 1, cumulative: 1 },
    { month: 'Feb', registered: 1, cumulative: 2 },
    { month: 'Mar', registered: 1, cumulative: 3 },
    { month: 'Apr', registered: 1, cumulative: 4 },
    { month: 'May', registered: 1, cumulative: 5 },
    { month: 'Jun', registered: 0, cumulative: 5 },
    { month: 'Jul', registered: 2, cumulative: 7 }
  ];

  // B. Repeat Customers Ratio
  const repeatCustomerData = [
    { name: 'Single Purchase', value: customersWithOrders.filter(c => c.totalOrders === 1).length, color: '#A1A1AA' },
    { name: 'Repeat Buyers', value: customersWithOrders.filter(c => c.totalOrders > 1).length, color: '#D4AF37' },
    { name: 'Leads (0 Orders)', value: customersWithOrders.filter(c => c.totalOrders === 0).length, color: '#3F3F46' }
  ];

  // C. Revenue Contribution by Customer Top list
  const revenueByCustomerData = useMemo(() => {
    return customersWithOrders
      .map(c => ({ name: c.name.split(' ')[0], value: c.totalSpending }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [customersWithOrders]);

  // D. Monthly Registrations Split
  const monthlyRegistrationsData = [
    { name: 'Q1 2026', count: 3 },
    { name: 'Q2 2026', count: 2 },
    { name: 'Q3 2026 (July)', count: 2 }
  ];

  // --- FILTERED AND SORTED CUSTOMERS LIST ---
  const filteredCustomers = useMemo(() => {
    let result = [...customersWithOrders];

    // Hide archived by default
    result = result.filter(c => !c.archived);

    // 1. Search Query (Name, Email, ID, Phone)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query) ||
          c.phone.includes(query)
      );
    }

    // 2. Status Filter
    if (filterStatus !== 'all') {
      result = result.filter(c => c.status.toLowerCase() === filterStatus.toLowerCase());
    }

    // 3. Segment Filter
    if (filterSegment !== 'all') {
      result = result.filter(c => c.segment.toLowerCase() === filterSegment.toLowerCase());
    }

    // 4. City Filter
    if (filterCity !== 'all') {
      result = result.filter(c => c.city.toLowerCase() === filterCity.toLowerCase());
    }

    // 4b. Country Filter
    if (filterCountry !== 'all') {
      result = result.filter(c => c.country.toLowerCase() === filterCountry.toLowerCase());
    }

    // 4c. VIP Status Filter
    if (filterVipStatus !== 'all') {
      if (filterVipStatus === 'vip') {
        result = result.filter(c => c.status === 'VIP' || c.segment === 'VIP Customer' || c.membershipLevel === 'Gold');
      } else {
        result = result.filter(c => c.status !== 'VIP' && c.segment !== 'VIP Customer' && c.membershipLevel !== 'Gold');
      }
    }

    // 4d. Registration Date Range
    if (filterRegDateRange !== 'all') {
      // Current system year is 2026 based on seed dates
      result = result.filter(c => {
        const yr = c.registrationDate.split('-')[0];
        const mo = c.registrationDate.split('-')[1];
        if (filterRegDateRange === 'month') {
          // registered in July (current system month)
          return mo === '07';
        } else if (filterRegDateRange === 'year') {
          return yr === '2026';
        }
        return true;
      });
    }

    // 5. Spend Range Filters
    if (minSpend) {
      const minVal = parseFloat(minSpend) || 0;
      result = result.filter(c => c.totalSpending >= minVal);
    }
    if (maxSpend) {
      const maxVal = parseFloat(maxSpend) || Infinity;
      result = result.filter(c => c.totalSpending <= maxVal);
    }

    // 5b. Order Count Filters
    if (minOrders) {
      const minO = parseInt(minOrders) || 0;
      result = result.filter(c => c.totalOrders >= minO);
    }
    if (maxOrders) {
      const maxO = parseInt(maxOrders) || Infinity;
      result = result.filter(c => c.totalOrders <= maxO);
    }

    // 5c. Marketing Subscription Filter
    if (filterMarketingSub !== 'all') {
      result = result.filter(c => !!c.marketingPreferences[filterMarketingSub as keyof typeof c.marketingPreferences]);
    }

    // 6. Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'spend') {
        comparison = a.totalSpending - b.totalSpending;
      } else if (sortBy === 'orders') {
        comparison = a.totalOrders - b.totalOrders;
      } else if (sortBy === 'date') {
        comparison = new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [customersWithOrders, searchQuery, filterStatus, filterSegment, filterCity, filterCountry, filterVipStatus, filterRegDateRange, minSpend, maxSpend, minOrders, maxOrders, filterMarketingSub, sortBy, sortOrder]);

  // Paginated chunk
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;

  // Auto-reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterSegment, filterCity, filterCountry, filterVipStatus, filterRegDateRange, minSpend, maxSpend, minOrders, maxOrders, filterMarketingSub, sortBy, sortOrder]);

  // --- ACTIONS ---

  // A. Create Customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.phone) {
      alert('Verification Error: Name, Email, and Phone are mandatory field coordinates.');
      return;
    }

    // Check duplicate email
    if (customers.some(c => c.email.toLowerCase() === addForm.email.toLowerCase())) {
      alert(`Validation Warning: Profile with Email "${addForm.email}" already exists.`);
      return;
    }

    const newId = `ZL-CRM-${1001 + customers.length}`;
    const newRecord: CustomerCrmProfile = {
      id: newId,
      name: addForm.name,
      email: addForm.email,
      phone: addForm.phone,
      photoUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200`,
      country: addForm.country,
      city: addForm.city,
      registrationDate: new Date().toISOString().slice(0, 10),
      status: 'Active',
      segment: 'New Customer',
      gender: addForm.gender as any,
      birthday: addForm.birthday || '1995-01-01',
      preferredLanguage: addForm.language,
      lastLogin: new Date().toISOString().replace('T', ' ').slice(0, 16),
      notes: [],
      addresses: [
        {
          id: `adr-${Date.now()}`,
          type: 'Shipping',
          isDefault: true,
          street: 'Main District Boulevard',
          city: addForm.city,
          state: `${addForm.city} Province`,
          zip: '31411',
          country: addForm.country
        }
      ],
      wishlist: [],
      savedCart: [],
      reviews: [],
      marketingPreferences: { email: true, sms: true, push: true, whatsapp: true, newsletter: true, promotionalOffers: true },
      communicationHistory: [],
      paymentSummary: { methods: [], transactions: [] },
      activityTimeline: [
        {
          id: `act-${Date.now()}`,
          event: 'Registration',
          description: `Elite customer registered manually under RBAC authorization of ${currentUser?.name || 'Administrator'}`,
          time: new Date().toLocaleString()
        }
      ]
    };

    setCustomers(prev => [...prev, newRecord]);
    addLog(`Manually Created Client Profile: ${addForm.name}`, newId);
    addAdminNotification('New Customer Registered', `Verified elite account created for Patron ${addForm.name}.`, 'success', 'new_customer');
    setShowAddCustomerModal(false);
    setAddForm({
      name: '',
      email: '',
      phone: '',
      city: 'Branch A',
      country: 'Saudi Arabia',
      gender: 'Male',
      birthday: '',
      language: 'Arabic'
    });
  };

  // B. Delete Customer Profile (Admin Exclusive)
  const handleDeleteCustomer = (id: string, name: string) => {
    if (isStaff) {
      alert('Security Refusal: Staff accounts are strictly forbidden from deleting Patrons records.');
      return;
    }
    if (window.confirm(`Are you absolutely sure you want to permanently erase ${name}'s CRM profile and timeline records?`)) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      addLog(`Erased Patron CRM Account`, name);
      if (selectedCustomerId === id) setSelectedCustomerId(null);
      alert('Patron Profile successfully deleted.');
    }
  };

  // C. Add Note to Customer
  const handleAddNote = () => {
    if (!selectedCustomerId) return;
    if (!newNoteContent.trim()) {
      alert('Note content is empty.');
      return;
    }

    const noteRecord = {
      id: `n-${Date.now()}`,
      type: newNoteType,
      content: newNoteContent,
      priority: newNotePriority,
      author: currentUser?.name || 'Artisan Concierge',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    // Update customer timeline & notes list
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomerId) {
        return {
          ...c,
          notes: [noteRecord, ...c.notes],
          activityTimeline: [
            {
              id: `act-${Date.now()}`,
              event: 'Profile Update',
              description: `Concierge Internal Note added by ${currentUser?.name || 'Staff'}: [${newNoteType}] ${newNoteContent.slice(0, 30)}...`,
              time: new Date().toLocaleString()
            },
            ...c.activityTimeline
          ]
        };
      }
      return c;
    }));

    addLog(`Added Internal CRM Note to ${selectedCustomer?.name}`, selectedCustomerId);
    setNewNoteContent('');
  };

  // --- NEW ENTERPRISE CRM INTERACTIVE ACTIONS ---
  
  // Update Individual Marketing Preferences
  const handleUpdateMarketingPreferences = (prefKey: string, value: boolean) => {
    if (!selectedCustomerId) return;
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomerId) {
        const updatedPrefs = {
          ...c.marketingPreferences,
          [prefKey]: value
        };
        return {
          ...c,
          marketingPreferences: updatedPrefs,
          activityTimeline: [
            {
              id: `act-${Date.now()}`,
              event: 'Preferences Updated' as const,
              description: `Marketing outreach preference modified: [${prefKey}] set to ${value ? 'ON' : 'OFF'} by ${currentUser?.name || 'Staff'}`,
              time: new Date().toLocaleString()
            },
            ...c.activityTimeline
          ]
        };
      }
      return c;
    }));
    addLog(`Updated Marketing Preferences for ${selectedCustomer?.name}`, selectedCustomerId);
    addAdminNotification('Marketing Preference Updated', `Patron ${selectedCustomer?.name}'s outreach preference [${prefKey}] set to ${value ? 'ON' : 'OFF'}.`, 'info', 'marketing_preference');
  };

  // Direct Communication Send Dispatch
  const handleSendCommunicationMessage = (channel: 'Email' | 'SMS' | 'WhatsApp' | 'Notification' | 'Campaign' | 'Support Response', subject: string, body: string) => {
    if (!selectedCustomerId || !body.trim()) return;
    
    const commId = `comm-${Date.now()}`;
    const commRecord = {
      id: commId,
      channel: channel as any,
      subject: subject || `${channel} Dispatch`,
      body: body,
      date: new Date().toISOString().slice(0, 10),
      status: 'Sent' as const
    };

    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomerId) {
        return {
          ...c,
          communicationHistory: [commRecord, ...c.communicationHistory],
          activityTimeline: [
            {
              id: `act-${Date.now()}`,
              event: 'Marketing Interaction' as const,
              description: `Direct CRM communication dispatched via ${channel}. Subject: "${subject || 'None'}"`,
              time: new Date().toLocaleString()
            },
            ...c.activityTimeline
          ]
        };
      }
      return c;
    }));

    addLog(`Sent CRM ${channel} to ${selectedCustomer?.name}`, selectedCustomerId);
    alert(`Success: CRM concierge has dispatched your ${channel} message to this Patron account successfully.`);
  };

  // Moderation of Reviews left by Customer
  const handleUpdateReviewStatus = (reviewId: string, action: 'approve' | 'reject', replyText?: string) => {
    if (!selectedCustomerId) return;
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomerId) {
        const updatedReviews = c.reviews.map(r => {
          if (r.id === reviewId) {
            return {
              ...r,
              approved: action === 'approve',
              rejected: action === 'reject',
              reply: replyText !== undefined ? replyText : r.reply
            };
          }
          return r;
        });

        return {
          ...c,
          reviews: updatedReviews,
          activityTimeline: [
            {
              id: `act-${Date.now()}`,
              event: 'Review' as const,
              description: `Product review moderated to: ${action.toUpperCase()}. ${replyText ? 'Concierge reply appended.' : ''}`,
              time: new Date().toLocaleString()
            },
            ...c.activityTimeline
          ]
        };
      }
      return c;
    }));
    addLog(`Moderated Review for ${selectedCustomer?.name}`, selectedCustomerId);
    alert(`Review has been successfully ${action === 'approve' ? 'approved & published' : 'rejected & hidden'}.`);
  };

  // Submit Outreach Form
  const handleSubmitOutreach = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const channel = formData.get('channel') as 'Email' | 'SMS' | 'WhatsApp' | 'Notification' | 'Campaign' | 'Support Response';
    const template = formData.get('template') as string;
    const content = formData.get('content') as string;
    if (!content.trim()) return;
    handleSendCommunicationMessage(channel, template, content);
    e.currentTarget.reset();
  };

  // Submit Review Reply Form
  const handleSubmitReviewReply = (e: React.FormEvent<HTMLFormElement>, reviewId: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const replyText = formData.get('replyText') as string;
    if (!replyText.trim()) return;
    handleUpdateReviewStatus(reviewId, 'approve', replyText);
    e.currentTarget.reset();
  };

  // Simulate Large Purchase (>5,000 SAR) and trigger Admin notifications
  const handleSimulateLargePurchase = () => {
    if (!selectedCustomerId) return;
    const newOrder = {
      id: `ZL-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().slice(0, 10),
      items: [{ name: "Sovereign Heritage Custom Couture Toob Suite", quantity: 1, price: 7500 }],
      total: 7500,
      status: 'Completed' as const,
      trackingNumber: `TRACK-${Math.floor(100000 + Math.random() * 900000)}`
    };

    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomerId) {
        return {
          ...c,
          communicationHistory: [
            {
              id: `comm-${Date.now()}`,
              channel: 'Email' as const,
              subject: 'Invoice & Large Purchase Confirmation',
              body: `Assalamu Alaikum Patron ${selectedCustomer?.name}. Your purchase of Sovereign Heritage Custom Couture Toob Suite for 7,500 SAR has been confirmed.`,
              date: new Date().toISOString().slice(0, 10),
              status: 'Sent' as const
            },
            ...c.communicationHistory
          ],
          activityTimeline: [
            {
              id: `act-${Date.now()}`,
              event: 'Large Purchase' as const,
              description: `Purchased Sovereign Heritage Custom Couture Toob Suite for 7,500 SAR`,
              time: new Date().toLocaleString()
            },
            ...c.activityTimeline
          ]
        };
      }
      return c;
    }));

    addLog(`Simulated Large Purchase for ${selectedCustomer?.name} of 7500 SAR`, selectedCustomerId);
    addAdminNotification(
      'Large Purchase Completed',
      `Sovereign checkout event: Patron ${selectedCustomer?.name} completed order of 7,500 SAR.`,
      'success',
      'large_purchase'
    );
    alert('Success: Simulated Large Purchase of 7,500 SAR. Admin notification triggered!');
  };

  // Simulate Support Request and trigger Admin notifications
  const handleSimulateSupportRequest = () => {
    if (!selectedCustomerId) return;
    addAdminNotification(
      'Support Request Received',
      `Support Ticket: Patron ${selectedCustomer?.name} has requested assistance with Bespoke Couture Fit.`,
      'warning',
      'support_request'
    );
    alert('Success: Simulated Customer Support Request. Admin notification triggered!');
  };

  // Grant Birthday Reward
  const handleGrantBirthdayReward = () => {
    if (!selectedCustomerId) return;
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomerId) {
        return {
          ...c,
          birthdayReward: 'Claimed' as const,
          loyaltyPoints: (c.loyaltyPoints || 0) + 200,
          activityTimeline: [
            {
              id: `act-${Date.now()}`,
              event: 'Profile Update' as const,
              description: `Granted active Birthday Reward credit to Patron. Credited +200 bonus loyalty points.`,
              time: new Date().toLocaleString()
            },
            ...c.activityTimeline
          ]
        };
      }
      return c;
    }));
    addLog(`Granted Birthday Reward to ${selectedCustomer?.name}`, selectedCustomerId);
    addAdminNotification('Birthday Reward Granted', `Patron ${selectedCustomer?.name} was granted a birthday reward.`, 'success', 'reward_granted');
    alert(`Success: Granted Birthday Reward credit of 200 Loyalty points to ${selectedCustomer?.name}.`);
  };

  // Redeem Loyalty Reward
  const handleRedeemLoyaltyReward = (rewardId: string, pointsCost: number) => {
    if (!selectedCustomerId) return;
    
    const customer = customersWithOrders.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    const currentPoints = customer.loyaltyPoints || 0;
    if (currentPoints < pointsCost) {
      alert(`Validation Refusal: Patron only has ${currentPoints} points. This reward requires ${pointsCost} points.`);
      return;
    }

    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomerId) {
        const updatedRewards = (c.rewards || []).map(rw => {
          if (rw.id === rewardId) {
            return { ...rw, status: 'Redeemed' as const };
          }
          return rw;
        });

        return {
          ...c,
          loyaltyPoints: currentPoints - pointsCost,
          rewards: updatedRewards,
          activityTimeline: [
            {
              id: `act-${Date.now()}`,
              event: 'Profile Update' as const,
              description: `Redeemed Loyalty Reward. Deducted -${pointsCost} points. Remaining: ${currentPoints - pointsCost} points.`,
              time: new Date().toLocaleString()
            },
            ...c.activityTimeline
          ]
        };
      }
      return c;
    }));

    addLog(`Redeemed loyalty reward for ${selectedCustomer?.name}`, selectedCustomerId);
    addAdminNotification('Loyalty Reward Redeemed', `Patron ${selectedCustomer?.name} redeemed ${pointsCost} points.`, 'success', 'reward_redeemed');
    alert(`Reward redeemed successfully! Deducted ${pointsCost} loyalty points.`);
  };

  // --- BULK OPERATIONS ENGINE ---
  const handleBulkAction = (actionType: 'status' | 'tag' | 'marketing' | 'archive' | 'notify' | 'export', payload?: any) => {
    if (selectedCustomerIds.length === 0) {
      alert('Validation Warning: Please select at least one Patron using checkboxes.');
      return;
    }

    if (actionType === 'status') {
      const nextStatus = payload as 'Active' | 'Inactive' | 'Blocked' | 'Suspended' | 'VIP' | 'Verified';
      setCustomers(prev => prev.map(c => {
        if (selectedCustomerIds.includes(c.id)) {
          return {
            ...c,
            status: nextStatus,
            activityTimeline: [
              {
                id: `act-${Date.now()}`,
                event: 'Status Change' as const,
                description: `Sovereign account status bulk-updated to: ${nextStatus} by ${currentUser?.name || 'Administrator'}`,
                time: new Date().toLocaleString()
              },
              ...c.activityTimeline
            ]
          };
        }
        return c;
      }));
      addLog(`Bulk Updated Status of ${selectedCustomerIds.length} Patrons to ${nextStatus}`);
      addAdminNotification('Bulk Status Update', `Bulk update: ${selectedCustomerIds.length} Patrons updated to ${nextStatus}.`, 'info', 'bulk_update');
      alert(`Success: Selected ${selectedCustomerIds.length} Patron profiles have been updated to status: ${nextStatus}.`);
      setSelectedCustomerIds([]);
    }

    else if (actionType === 'tag') {
      const tagStr = String(payload).trim();
      if (!tagStr) return;
      const newTags = tagStr.split(',').map(t => t.trim()).filter(Boolean);
      
      setCustomers(prev => prev.map(c => {
        if (selectedCustomerIds.includes(c.id)) {
          const mergedTags = Array.from(new Set([...(c.tags || []), ...newTags]));
          return {
            ...c,
            tags: mergedTags,
            activityTimeline: [
              {
                id: `act-${Date.now()}`,
                event: 'Profile Update' as const,
                description: `Direct CRM tags bulk-applied: [${newTags.join(', ')}] by ${currentUser?.name || 'Concierge'}`,
                time: new Date().toLocaleString()
              },
              ...c.activityTimeline
            ]
          };
        }
        return c;
      }));
      addLog(`Bulk Tagged ${selectedCustomerIds.length} Patrons with: ${tagStr}`);
      addAdminNotification('Bulk Tag Update', `Bulk update: ${selectedCustomerIds.length} Patrons tagged with: ${newTags.join(', ')}.`, 'info', 'bulk_update');
      alert(`Success: Selected ${selectedCustomerIds.length} Patrons have been tagged with: ${newTags.join(', ')}.`);
      setSelectedCustomerIds([]);
      setBulkTagInput('');
    }

    else if (actionType === 'marketing') {
      const { channel, optIn } = payload as { channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'newsletter' | 'promotionalOffers'; optIn: boolean };
      setCustomers(prev => prev.map(c => {
        if (selectedCustomerIds.includes(c.id)) {
          return {
            ...c,
            marketingPreferences: {
              ...c.marketingPreferences,
              [channel]: optIn
            },
            activityTimeline: [
              {
                id: `act-${Date.now()}`,
                event: 'Preferences Updated' as const,
                description: `Direct marketing preference bulk-configured: ${channel.toUpperCase()} set to ${optIn ? 'ON' : 'OFF'}`,
                time: new Date().toLocaleString()
              },
              ...c.activityTimeline
            ]
          };
        }
        return c;
      }));
      addLog(`Bulk configured marketing reach of ${selectedCustomerIds.length} Patrons`);
      addAdminNotification('Bulk Marketing Update', `Bulk update: Marketing ${channel.toUpperCase()} set to ${optIn ? 'Opt-In' : 'Opt-Out'} for ${selectedCustomerIds.length} Patrons.`, 'info', 'bulk_update');
      alert(`Success: Set marketing ${channel.toUpperCase()} to ${optIn ? 'Opt-In' : 'Opt-Out'} for ${selectedCustomerIds.length} Patrons.`);
      setSelectedCustomerIds([]);
    }

    else if (actionType === 'archive') {
      setCustomers(prev => prev.map(c => {
        if (selectedCustomerIds.includes(c.id)) {
          return {
            ...c,
            archived: true,
            activityTimeline: [
              {
                id: `act-${Date.now()}`,
                event: 'Profile Update' as const,
                description: `CRM Patron profile archived to clear workspace clutter.`,
                time: new Date().toLocaleString()
              },
              ...c.activityTimeline
            ]
          };
        }
        return c;
      }));
      addLog(`Bulk Archived ${selectedCustomerIds.length} Patron Profiles`);
      addAdminNotification('Bulk Archiving', `Bulk update: ${selectedCustomerIds.length} Patrons archived.`, 'warning', 'bulk_update');
      alert(`Success: Archived ${selectedCustomerIds.length} Patron accounts. They are now hidden from active listings.`);
      setSelectedCustomerIds([]);
    }

    else if (actionType === 'notify') {
      const { notifyChannel, subject, body } = payload as { notifyChannel: 'Email' | 'SMS' | 'WhatsApp'; subject: string; body: string };
      if (!body.trim()) return;

      setCustomers(prev => prev.map(c => {
        if (selectedCustomerIds.includes(c.id)) {
          const commId = `comm-${Date.now()}`;
          const commRecord = {
            id: commId,
            channel: notifyChannel as any,
            subject: subject || `${notifyChannel} Broadcast`,
            body: body,
            date: new Date().toISOString().slice(0, 10),
            status: 'Sent' as const
          };
          return {
            ...c,
            communicationHistory: [commRecord, ...(c.communicationHistory || [])],
            activityTimeline: [
              {
                id: `act-${Date.now()}`,
                event: 'Marketing Interaction' as const,
                description: `Bulk direct notification dispatched via ${notifyChannel}. Subject: "${subject || 'None'}"`,
                time: new Date().toLocaleString()
              },
              ...c.activityTimeline
            ]
          };
        }
        return c;
      }));

      addLog(`Bulk Sent Direct Broadcast to ${selectedCustomerIds.length} Patrons via ${notifyChannel}`);
      addAdminNotification('Bulk Notification', `Bulk broadcast sent to ${selectedCustomerIds.length} Patrons via ${notifyChannel}.`, 'info', 'bulk_update');
      alert(`Success: Direct Broadcast has been sent to ${selectedCustomerIds.length} Patrons via ${notifyChannel}.`);
      setSelectedCustomerIds([]);
      setShowBulkNotifyModal(false);
      setBulkNotifySubject('');
      setBulkNotifyBody('');
    }

    else if (actionType === 'export') {
      const selectedList = customersWithOrders.filter(c => selectedCustomerIds.includes(c.id));
      const headers = 'ID,Name,Email,Phone,City,Country,RegisteredDate,Status,Segment,TotalSpending,TotalOrders,MembershipLevel,LoyaltyPoints\n';
      const rows = selectedList.map(c => 
        `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.city}","${c.country}","${c.registrationDate}","${c.status}","${c.segment}",${c.totalSpending},${c.totalOrders},"${c.membershipLevel}",${c.loyaltyPoints}`
      ).join('\n');

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', `AL_ZOAL_CRM_Selected_Patrons_${selectedCustomerIds.length}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addLog(`Exported ${selectedCustomerIds.length} selected Patron profiles`);
      setSelectedCustomerIds([]);
    }
  };

  // D. Export CSV Patrons Registrations
  const handleExportCsv = () => {
    const headers = 'ID,Name,Email,Phone,City,Country,RegisteredDate,Status,Segment,TotalSpending,TotalOrders\n';
    const rows = filteredCustomers.map(c => 
      `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.city}","${c.country}","${c.registrationDate}","${c.status}","${c.segment}",${c.totalSpending},${c.totalOrders}`
    ).join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `AL_ZOAL_CRM_Patrons_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog('Exported CRM database segment');
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans relative z-10" id="enterprise-crm-workspace">
      
      {/* 1. SECTION BAR HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block">AL ZOAL CONCIERGE PLATFORM</span>
            <span className="bg-gold-pure/10 border border-gold-pure/30 text-gold-pure text-[7.5px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
              CRM CORE v2.8
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-widest font-display uppercase text-white">
            Customer Relationship Management
          </h2>
        </div>

        {/* CONTROLS AREA WITH RBAC SIMULATOR */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Role Switcher Indicator to demonstrate VIP RBAC controls in runtime */}
          <div className="bg-zinc-950 border border-white/5 rounded-xs p-1 px-2.5 flex items-center gap-2 select-none">
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">RBAC Privilege:</span>
            <div className="flex bg-black rounded-xs border border-white/5 p-0.5">
              <button
                onClick={() => {
                  setActiveRole('admin');
                  addLog('Switched interface view to Admin Level');
                }}
                className={`px-2 py-1 text-[7.5px] uppercase tracking-widest font-mono rounded-xs font-bold transition-all ${
                  isAdmin ? 'bg-gold-pure text-black font-extrabold shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                ADMIN
              </button>
              <button
                onClick={() => {
                  setActiveRole('staff');
                  addLog('Switched interface view to Staff Level');
                }}
                className={`px-2 py-1 text-[7.5px] uppercase tracking-widest font-mono rounded-xs font-bold transition-all ${
                  isStaff ? 'bg-gold-pure text-black font-extrabold shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                STAFF
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setCrmSubTab(crmSubTab === 'dashboard' ? 'list' : 'dashboard');
              setSelectedCustomerId(null);
            }}
            className="py-1.5 px-3 bg-zinc-950 border border-white/15 hover:border-gold-pure/50 text-white text-[9.5px] uppercase tracking-widest font-mono flex items-center gap-1.5 duration-150 cursor-pointer"
          >
            {crmSubTab === 'dashboard' ? (
              <>
                <Users className="w-3.5 h-3.5 text-gold-pure" /> View CRM List
              </>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-gold-pure" /> View Analytics CRM
              </>
            )}
          </button>

          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="py-1.5 px-3 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white text-black font-bold text-[9.5px] uppercase tracking-widest rounded-xs flex items-center gap-1.5 duration-150 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Register Patron
          </button>
        </div>
      </div>

      {/* 2. TAB SWITCHER CONTENT */}
      {crmSubTab === 'dashboard' ? (
        <div className="space-y-6">
          
          {/* A. CRM EXECUTIVE STATISTICS KPI BAR */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <div className="bg-zinc-950/80 border border-white/5 p-4 rounded-xs text-left relative overflow-hidden group hover:border-gold-pure/20 duration-300">
              <div className="absolute right-2 top-2 text-zinc-800 pointer-events-none group-hover:scale-110 duration-500">
                <Users className="w-8 h-8" />
              </div>
              <p className="text-[8.5px] tracking-widest text-zinc-500 uppercase font-mono mb-1">TOTAL REGISTRY</p>
              <h3 className="text-xl font-bold font-mono text-white tracking-tight">{crmMetrics.total}</h3>
              <p className="text-[8px] text-zinc-500 mt-1 font-mono">Patron Accounts</p>
            </div>

            <div className="bg-zinc-950/80 border border-white/5 p-4 rounded-xs text-left relative overflow-hidden group hover:border-gold-pure/20 duration-300">
              <div className="absolute right-2 top-2 text-zinc-800 pointer-events-none group-hover:scale-110 duration-500">
                <UserCheck className="w-8 h-8" />
              </div>
              <p className="text-[8.5px] tracking-widest text-emerald-500 uppercase font-mono mb-1">ACTIVE PATRONS</p>
              <h3 className="text-xl font-bold font-mono text-emerald-400 tracking-tight">{crmMetrics.active}</h3>
              <p className="text-[8px] text-zinc-500 mt-1 font-mono">Verified / VIP Status</p>
            </div>

            <div className="bg-zinc-950/80 border border-white/5 p-4 rounded-xs text-left relative overflow-hidden group hover:border-gold-pure/20 duration-300">
              <div className="absolute right-2 top-2 text-zinc-800 pointer-events-none group-hover:scale-110 duration-500">
                <Calendar className="w-8 h-8" />
              </div>
              <p className="text-[8.5px] tracking-widest text-gold-pure uppercase font-mono mb-1">REGISTERED TODAY</p>
              <h3 className="text-xl font-bold font-mono text-gold-pure tracking-tight">+{crmMetrics.newToday}</h3>
              <p className="text-[8px] text-zinc-500 mt-1 font-mono">Organic Registrations</p>
            </div>

            <div className="bg-zinc-950/80 border border-white/5 p-4 rounded-xs text-left relative overflow-hidden group hover:border-gold-pure/20 duration-300">
              <div className="absolute right-2 top-2 text-zinc-800 pointer-events-none group-hover:scale-110 duration-500">
                <Award className="w-8 h-8" />
              </div>
              <p className="text-[8.5px] tracking-widest text-purple-400 uppercase font-mono mb-1">LOYAL VIP CLIENTS</p>
              <h3 className="text-xl font-bold font-mono text-purple-400 tracking-tight">{crmMetrics.vip}</h3>
              <p className="text-[8px] text-zinc-500 mt-1 font-mono">Prestige Sizing</p>
            </div>

            <div className="bg-zinc-950/80 border border-white/5 p-4 rounded-xs text-left relative overflow-hidden group hover:border-gold-pure/20 duration-300">
              <div className="absolute right-2 top-2 text-zinc-800 pointer-events-none group-hover:scale-110 duration-500">
                <DollarSign className="w-8 h-8" />
              </div>
              <p className="text-[8.5px] tracking-widest text-white uppercase font-mono mb-1">TOTAL SPENDING</p>
              <h3 className="text-xl font-bold font-mono text-white tracking-tight">
                {formatCurrency(crmMetrics.totalRevenue)}
              </h3>
              <p className="text-[8px] text-zinc-500 mt-1 font-mono">SAR Cumulative LTV</p>
            </div>

            <div className="bg-zinc-950/80 border border-white/5 p-4 rounded-xs text-left relative overflow-hidden group hover:border-gold-pure/20 duration-300">
              <div className="absolute right-2 top-2 text-zinc-800 pointer-events-none group-hover:scale-110 duration-500">
                <TrendingUp className="w-8 h-8" />
              </div>
              <p className="text-[8.5px] tracking-widest text-zinc-400 uppercase font-mono mb-1">AVG SPEND VALUE (CLV)</p>
              <h3 className="text-xl font-bold font-mono text-[#D4AF37] tracking-tight">
                {formatCurrency(crmMetrics.clv)}
              </h3>
              <p className="text-[8px] text-zinc-500 mt-1 font-mono">Average Revenue / Patron</p>
            </div>

          </div>

          {/* B. HISTORICAL ANALYTICS CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Customer Growth Progression */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] tracking-widest text-gold-pure uppercase font-mono block">GROWTH CURVE TRACKER</span>
                <span className="text-[8.5px] text-zinc-500 font-mono">Cumulative Patron Signups</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={customerGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="growthColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#3F3F46" tick={{ fill: '#71717A', fontSize: 9 }} />
                    <YAxis stroke="#3F3F46" tick={{ fill: '#71717A', fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090B', borderColor: '#27272A', color: '#FFF', fontSize: 10 }} />
                    <Area type="monotone" dataKey="cumulative" stroke="#D4AF37" strokeWidth={1.5} fillOpacity={1} fill="url(#growthColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Top Revenue Contributing Patrons */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] tracking-widest text-gold-pure uppercase font-mono block">TOP REVENUE CONTRIBUTORS</span>
                <span className="text-[8.5px] text-zinc-500 font-mono">Top VIP Patrons Spend (SAR)</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByCustomerData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#3F3F46" tick={{ fill: '#71717A', fontSize: 9 }} />
                    <YAxis stroke="#3F3F46" tick={{ fill: '#71717A', fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090B', borderColor: '#27272A', color: '#FFF', fontSize: 10 }} />
                    <Bar dataKey="value" fill="#D4AF37" barSize={25}>
                      {revenueByCustomerData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={idx === 0 ? '#D4AF37' : idx === 1 ? '#F3E5AB' : '#AA8C2C'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Repeat Purchase Frequency */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] tracking-widest text-gold-pure uppercase font-mono block">REPEAT CUSTOMER RATIO</span>
                <span className="text-[8.5px] text-zinc-500 font-mono">Customer Base Engagement</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={repeatCustomerData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {repeatCustomerData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#09090B', borderColor: '#27272A', color: '#FFF', fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 text-xs">
                  {repeatCustomerData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-zinc-400 font-mono text-[10px]">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 4: Segmented Registration Cohorts */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] tracking-widest text-gold-pure uppercase font-mono block">REGISTRATIONS COHORT SPLIT</span>
                <span className="text-[8.5px] text-zinc-500 font-mono">Registered Accounts by Period</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRegistrationsData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <XAxis type="number" stroke="#3F3F46" tick={{ fill: '#71717A', fontSize: 9 }} />
                    <YAxis dataKey="name" type="category" stroke="#3F3F46" tick={{ fill: '#71717A', fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090B', borderColor: '#27272A', color: '#FFF', fontSize: 10 }} />
                    <Bar dataKey="count" fill="#AA8C2C" barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* C. RECENT CRM REGISTRATIONS TIMELINE */}
          <div className="bg-zinc-950 border border-white/5 rounded-xs p-5 space-y-4">
            <span className="text-[9.5px] tracking-widest text-gold-pure uppercase font-mono block">RECENT BOUTIQUE REGISTRATIONS</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {customersWithOrders.slice(-3).reverse().map((c) => (
                <div key={c.id} className="bg-black/40 border border-white/5 p-3 rounded-xs flex items-center gap-3 relative overflow-hidden">
                  <img src={c.photoUrl} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-white text-xs font-semibold uppercase truncate">{c.name}</h4>
                    <p className="text-[8.5px] text-zinc-500 truncate">{c.email}</p>
                    <span className="inline-block text-[8px] text-gold-pure bg-gold-pure/5 border border-gold-pure/10 px-1 py-0.2 rounded-xs">
                      {c.city}, {c.country}
                    </span>
                  </div>
                  <div className="absolute right-2.5 bottom-2 text-[7.5px] text-zinc-600 font-mono">
                    Reg: {c.registrationDate}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-6">
          
          {/* FILTERING, SEARCH, SORTING BAR */}
          <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3">
            <div className="flex flex-col lg:flex-row gap-3">
              
              {/* Search */}
              <div className="relative flex-grow">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Patron by Name, Email address, ID code or Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white rounded-xs py-2 pl-9 pr-4 text-xs placeholder-zinc-600 focus:border-gold-pure focus:outline-none"
                />
              </div>

              {/* Status */}
              <div className="w-full lg:w-44">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white rounded-xs py-2 px-3 text-xs focus:border-gold-pure focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="verified">Verified</option>
                  <option value="vip">VIP Only</option>
                  <option value="suspended">Suspended</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Segment */}
              <div className="w-full lg:w-44">
                <select
                  value={filterSegment}
                  onChange={(e) => setFilterSegment(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white rounded-xs py-2 px-3 text-xs focus:border-gold-pure focus:outline-none cursor-pointer"
                >
                  <option value="all">All Segments</option>
                  <option value="new customer">New Customers</option>
                  <option value="returning customer">Returning</option>
                  <option value="vip customer">VIP Category</option>
                  <option value="high value customer">High Value Spend</option>
                  <option value="frequent buyer">Frequent Buyers</option>
                  <option value="inactive customer">Inactive Leads</option>
                </select>
              </div>

              {/* City filter */}
              <div className="w-full lg:w-44">
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white rounded-xs py-2 px-3 text-xs focus:border-gold-pure focus:outline-none cursor-pointer"
                >
                  <option value="all">All Cities</option>
                  <option value="riyadh">Branch A</option>
                  <option value="dammam">Branch B</option>
                  <option value="khobar">Khobar</option>
                  <option value="jeddah">Jeddah</option>
                  <option value="hofuf">Hofuf</option>
                </select>
              </div>

              {/* Advanced Filter Action Buttons */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowReportsModal(true)}
                  className="py-2 px-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 hover:border-gold-pure text-gold-pure text-[9.5px] uppercase tracking-widest font-mono flex items-center gap-1.5 duration-150 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Privy Analytics Reports
                </button>
                <button
                  onClick={handleExportCsv}
                  className="py-2 px-3 bg-zinc-900 border border-white/5 hover:border-gold-pure text-white text-[9.5px] uppercase tracking-widest font-mono flex items-center gap-1.5 duration-150 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-gold-pure" /> Export CSV
                </button>
              </div>

            </div>

            {/* Range, Advanced Filters and Sorting Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 pt-3 border-t border-white/5 text-xs">
              
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-mono text-[9px] uppercase whitespace-nowrap">Min Spend (SAR):</span>
                <input
                  type="number"
                  placeholder="0"
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  className="bg-black border border-white/10 rounded-xs text-white p-1 text-[11px] w-full outline-none focus:border-gold-pure"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-mono text-[9px] uppercase whitespace-nowrap">Max Spend:</span>
                <input
                  type="number"
                  placeholder="99999"
                  value={maxSpend}
                  onChange={(e) => setMaxSpend(e.target.value)}
                  className="bg-black border border-white/10 rounded-xs text-white p-1 text-[11px] w-full outline-none focus:border-gold-pure"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-mono text-[9px] uppercase whitespace-nowrap">Country:</span>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="bg-black border border-white/10 rounded-xs text-white p-1 text-[11px] w-full outline-none focus:border-gold-pure cursor-pointer"
                >
                  <option value="all">All Countries</option>
                  <option value="saudi arabia">Saudi Arabia</option>
                  <option value="sudan">Sudan</option>
                  <option value="egypt">Egypt</option>
                  <option value="united arab emirates">U.A.E.</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-mono text-[9px] uppercase whitespace-nowrap">Registered:</span>
                <select
                  value={filterRegDateRange}
                  onChange={(e) => setFilterRegDateRange(e.target.value)}
                  className="bg-black border border-white/10 rounded-xs text-white p-1 text-[11px] w-full outline-none focus:border-gold-pure cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="month">This Month (July)</option>
                  <option value="year">This Year (2026)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-mono text-[9px] uppercase whitespace-nowrap">Tier:</span>
                <select
                  value={filterVipStatus}
                  onChange={(e) => setFilterVipStatus(e.target.value)}
                  className="bg-black border border-white/10 rounded-xs text-white p-1 text-[11px] w-full outline-none focus:border-gold-pure cursor-pointer"
                >
                  <option value="all">All Tiers</option>
                  <option value="vip">VIP/Gold Elite</option>
                  <option value="non-vip">Standard/Silver</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-zinc-500 font-mono text-[9px] uppercase whitespace-nowrap">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-black border border-white/10 text-white rounded-xs p-1 text-[11px] w-full outline-none focus:border-gold-pure cursor-pointer"
                >
                  <option value="spend">Total Spend</option>
                  <option value="orders">Orders</option>
                  <option value="date">Registry Date</option>
                  <option value="name">Name</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 px-1.5 border border-white/10 rounded-xs text-zinc-400 hover:text-white shrink-0"
                >
                  {sortOrder === 'desc' ? 'DESC' : 'ASC'}
                </button>
              </div>

            </div>

            {/* Extended CRM Criteria Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-mono text-[9px] uppercase whitespace-nowrap">Min Orders:</span>
                <input
                  type="number"
                  placeholder="0"
                  value={minOrders}
                  onChange={(e) => setMinOrders(e.target.value)}
                  className="bg-black border border-white/10 rounded-xs text-white p-1 text-[11px] w-full outline-none focus:border-gold-pure"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-mono text-[9px] uppercase whitespace-nowrap">Max Orders:</span>
                <input
                  type="number"
                  placeholder="99"
                  value={maxOrders}
                  onChange={(e) => setMaxOrders(e.target.value)}
                  className="bg-black border border-white/10 rounded-xs text-white p-1 text-[11px] w-full outline-none focus:border-gold-pure"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-mono text-[9px] uppercase whitespace-nowrap">Marketing Opt-In:</span>
                <select
                  value={filterMarketingSub}
                  onChange={(e) => setFilterMarketingSub(e.target.value)}
                  className="bg-black border border-white/10 rounded-xs text-white p-1 text-[11px] w-full outline-none focus:border-gold-pure cursor-pointer"
                >
                  <option value="all">All Outreach Channels</option>
                  <option value="email">Email Subscribed</option>
                  <option value="sms">SMS Subscribed</option>
                  <option value="whatsapp">WhatsApp Subscribed</option>
                  <option value="push">Push Notification Subscribed</option>
                  <option value="newsletter">Newsletter Registered</option>
                  <option value="promotionalOffers">Promo Offers Subscribed</option>
                </select>
              </div>
            </div>
          </div>

          {/* MAIN DIRECTORY TABLE */}
          <div className="bg-zinc-950 border border-white/5 rounded-xs p-4 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <p className="text-zinc-400">
                Filtered Patrons Count:{' '}
                <span className="text-gold-pure font-mono font-bold">{filteredCustomers.length}</span>
              </p>
              <p className="text-zinc-500">
                Page <span className="font-mono text-white">{currentPage}</span> of{' '}
                <span className="font-mono text-white">{totalPages}</span>
              </p>
            </div>

            <div className="bg-black border border-white/5 rounded-xs overflow-x-auto">
              <table className="w-full text-left divide-y divide-white/5">
                <thead className="bg-zinc-950 text-zinc-500 text-[8.5px] font-mono uppercase tracking-widest">
                  <tr>
                    <th className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedCustomers.length > 0 && paginatedCustomers.every(c => selectedCustomerIds.includes(c.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const pageIds = paginatedCustomers.map(c => c.id);
                            setSelectedCustomerIds(prev => Array.from(new Set([...prev, ...pageIds])));
                          } else {
                            const pageIds = paginatedCustomers.map(c => c.id);
                            setSelectedCustomerIds(prev => prev.filter(id => !pageIds.includes(id)));
                          }
                        }}
                        className="rounded-xs bg-black border-white/10 text-[#D4AF37] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                      />
                    </th>
                    <th className="p-4">Customer ID / Photo</th>
                    <th className="p-4">Full Name & Contact</th>
                    <th className="p-4">Location Geography</th>
                    <th className="p-4">Registration Date</th>
                    <th className="p-4 text-center">Fulfill Index</th>
                    <th className="p-4 text-right">LTV Spending</th>
                    <th className="p-4">Segment / Status</th>
                    <th className="p-4 text-right">Action Interface</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[10px] divide-y divide-white/5">
                  {paginatedCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-white/1 duration-150">
                      
                      {/* Checkbox cell */}
                      <td className="p-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCustomerIds.includes(cust.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCustomerIds(prev => [...prev, cust.id]);
                            } else {
                              setSelectedCustomerIds(prev => prev.filter(id => id !== cust.id));
                            }
                          }}
                          className="rounded-xs bg-black border-white/10 text-[#D4AF37] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                        />
                      </td>
                      
                      {/* Photo / ID */}
                      <td className="p-4 text-left">
                        <div className="flex items-center gap-3">
                          <img
                            src={cust.photoUrl}
                            alt={cust.name}
                            className="w-8 h-8 rounded-full object-cover border border-white/10 shadow-sm"
                          />
                          <div>
                            <span className="text-zinc-300 font-bold block">{cust.id}</span>
                            <span className="text-[8px] text-zinc-500 block uppercase">Verified Portal</span>
                          </div>
                        </div>
                      </td>

                      {/* Full Name & email */}
                      <td className="p-4 text-left">
                        <span className="font-sans font-bold text-white text-xs block">{cust.name}</span>
                        <span className="text-zinc-500 block">{cust.email}</span>
                        <span className="text-zinc-600 text-[8.5px] block">{cust.phone}</span>
                      </td>

                      {/* Location */}
                      <td className="p-4 text-zinc-400">
                        <span className="font-sans block text-zinc-300">{cust.city}</span>
                        <span className="text-[8px] text-zinc-500 block uppercase">{cust.country}</span>
                      </td>

                      {/* Reg Date */}
                      <td className="p-4 text-zinc-500">{cust.registrationDate}</td>

                      {/* Order Count */}
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-white text-xs">{cust.totalOrders}</span>
                          <span className="text-[7px] text-zinc-500 uppercase tracking-wider">Orders</span>
                        </div>
                      </td>

                      {/* Spend */}
                      <td className="p-4 text-right">
                        <span className="text-gold-pure font-bold block text-xs">
                          {formatCurrency(cust.totalSpending)}
                        </span>
                        <span className="text-[7.5px] text-zinc-500 uppercase block">SAR LTV</span>
                      </td>

                      {/* Segment & Status */}
                      <td className="p-4">
                        <div className="space-y-1.5 text-left">
                          <span className="inline-block px-1.5 py-0.2 bg-zinc-900 border border-white/10 text-zinc-300 text-[7px] rounded-xs font-bold uppercase tracking-wide">
                            {cust.segment}
                          </span>
                          <span className={`block w-fit px-1.5 py-0.5 rounded-sm text-[7.5px] uppercase font-bold ${
                            cust.status === 'Suspended' || cust.status === 'Blocked' 
                              ? 'bg-red-950/30 text-red-400 border border-red-500/20' 
                              : cust.status === 'VIP'
                              ? 'bg-purple-950/30 text-purple-400 border border-purple-500/20'
                              : 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {cust.status}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedCustomerId(cust.id);
                              addLog(`Viewed Customer Profile Desk: ${cust.name}`, cust.id);
                            }}
                            className="py-1 px-2.5 bg-zinc-900 hover:bg-gold-pure hover:text-black text-white text-[9px] font-bold uppercase rounded-xs duration-150 cursor-pointer"
                          >
                            Profile
                          </button>
                          
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                              className="p-1 text-zinc-500 hover:text-red-400 border border-transparent hover:border-red-950 rounded-xs duration-150 cursor-pointer"
                              title="Delete profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}

                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-500 italic">
                        No Patrons found matching current filter metrics.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FEEDS CONTROLS */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="py-1 px-3 bg-zinc-900 text-white rounded-xs text-[9px] font-mono uppercase tracking-widest border border-white/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                Previous
              </button>
              <div className="flex gap-1.5 font-mono text-[9px]">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`py-1 px-2.5 rounded-xs border transition-all ${
                      currentPage === p 
                        ? 'bg-gold-pure text-black font-bold border-gold-pure' 
                        : 'bg-black text-zinc-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="py-1 px-3 bg-zinc-900 text-white rounded-xs text-[9px] font-mono uppercase tracking-widest border border-white/5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                Next
              </button>
            </div>

            {/* FLOATING STICKY BULK ACTIONS PANEL */}
            {selectedCustomerIds.length > 0 && (
              <div className="sticky bottom-6 left-0 right-0 bg-zinc-950/95 border border-[#D4AF37]/40 p-4 rounded-xs shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col lg:flex-row justify-between items-center gap-4 z-40 animate-fade-in-up mt-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gold-pure animate-pulse"></span>
                  <p className="text-xs text-white font-mono">
                    Bulk Selection: <span className="text-gold-pure font-bold font-mono">{selectedCustomerIds.length}</span> Patrons active
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Bulk Status Select */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkAction('status', e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="bg-black border border-white/15 text-white rounded-xs p-1.5 text-[10px] font-mono cursor-pointer outline-none focus:border-gold-pure"
                  >
                    <option value="">Set Status...</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="VIP">VIP</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Blocked">Blocked</option>
                  </select>

                  {/* Bulk Marketing Opt Select */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const [channel, action] = e.target.value.split(':');
                        handleBulkAction('marketing', { channel, optIn: action === 'in' });
                        e.target.value = '';
                      }
                    }}
                    className="bg-black border border-[#D4AF37]/35 text-gold-pure rounded-xs p-1.5 text-[10px] font-mono cursor-pointer outline-none focus:border-gold-pure"
                  >
                    <option value="">Outreach Opt...</option>
                    <option value="email:in">Opt-In Email</option>
                    <option value="email:out">Opt-Out Email</option>
                    <option value="sms:in">Opt-In SMS</option>
                    <option value="sms:out">Opt-Out SMS</option>
                    <option value="whatsapp:in">Opt-In WhatsApp</option>
                    <option value="whatsapp:out">Opt-Out WhatsApp</option>
                    <option value="newsletter:in">Opt-In Newsletter</option>
                    <option value="newsletter:out">Opt-Out Newsletter</option>
                    <option value="promotionalOffers:in">Opt-In Promo Offers</option>
                    <option value="promotionalOffers:out">Opt-Out Promo Offers</option>
                  </select>

                  {/* Bulk tags */}
                  <div className="flex items-center gap-1 bg-black border border-white/15 rounded-xs p-0.5">
                    <input
                      type="text"
                      placeholder="tag, tag..."
                      value={bulkTagInput}
                      onChange={(e) => setBulkTagInput(e.target.value)}
                      className="bg-transparent border-none text-white text-[10px] px-1.5 py-0.5 outline-none w-20 placeholder-zinc-600 font-mono"
                    />
                    <button
                      onClick={() => handleBulkAction('tag', bulkTagInput)}
                      className="bg-zinc-900 border border-white/5 hover:border-gold-pure text-[9px] font-mono uppercase px-2 py-1 text-gold-pure rounded-xs cursor-pointer"
                    >
                      Apply Tag
                    </button>
                  </div>

                  {/* Broadcast message trigger */}
                  <button
                    onClick={() => setShowBulkNotifyModal(true)}
                    className="py-1.5 px-3 bg-indigo-950/45 border border-[#D4AF37]/30 hover:border-gold-pure text-[#D4AF37] text-[10px] uppercase tracking-wider font-mono flex items-center gap-1 rounded-xs duration-150 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-gold-pure" /> Broadcast Outreach
                  </button>

                  {/* Export selected */}
                  <button
                    onClick={() => handleBulkAction('export')}
                    className="py-1.5 px-3 bg-zinc-900 border border-white/5 hover:border-gold-pure text-white text-[10px] uppercase tracking-wider font-mono flex items-center gap-1 rounded-xs duration-150 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-gold-pure" /> Export Selection
                  </button>

                  {/* Archive selected */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you absolutely sure you want to bulk-archive these ${selectedCustomerIds.length} customer profiles?`)) {
                        handleBulkAction('archive');
                      }
                    }}
                    className="py-1.5 px-3 bg-red-950/40 border border-red-500/20 hover:border-red-400 text-red-400 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1 rounded-xs duration-150 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Archive Selection
                  </button>

                  {/* Cancel selection */}
                  <button
                    onClick={() => setSelectedCustomerIds([])}
                    className="py-1.5 px-2 bg-transparent text-zinc-500 hover:text-white text-[10px] uppercase font-mono cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* 3. DETAILED CUSTOMER PROFILE DRAWER / POPUP DETAIL COMPONENT */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-white/10 rounded-sm max-w-4xl w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
            >
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="absolute top-5 right-5 text-zinc-500 hover:text-gold-pure cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Profile Header Sector */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={selectedCustomer.photoUrl}
                      alt={selectedCustomer.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37] shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-black border border-[#D4AF37]/50 rounded-full p-1 text-gold-pure">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold tracking-wider text-white font-display uppercase">
                        {selectedCustomer.name}
                      </h3>
                      <span className="text-[8px] bg-zinc-900 border border-white/10 text-zinc-400 font-mono px-2 py-0.5 rounded-xs uppercase">
                        {selectedCustomer.id}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      Sovereign Patron Portfolio • Registered {selectedCustomer.registrationDate}
                    </p>
                  </div>
                </div>

                {/* Status & Segment Assignments Dropdowns (RBAC RESTRICTED) */}
                <div className="flex flex-wrap items-center gap-3">
                  
                  {/* Status Dropdown */}
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest font-mono block">Status Control</span>
                    <select
                      disabled={isStaff} // Staff cannot modify vital status!
                      value={selectedCustomer.status}
                      onChange={(e) => {
                        const nextStatus = e.target.value as any;
                        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, status: nextStatus } : c));
                        addLog(`Modified Status of ${selectedCustomer.name} to ${nextStatus}`, selectedCustomer.id);
                        if (nextStatus === 'VIP') {
                          addAdminNotification('VIP Customer Created', `Patron ${selectedCustomer.name} was promoted to VIP status.`, 'success', 'new_vip_customer');
                        } else if (nextStatus === 'Blocked') {
                          addAdminNotification('Customer Blocked', `Security Event: Patron ${selectedCustomer.name} has been blocked.`, 'error', 'blocked_customer');
                        }
                        alert(`Account status updated to ${nextStatus}`);
                      }}
                      className="bg-black border border-white/15 text-white rounded-xs p-1 px-2.5 text-[10px] font-mono font-bold outline-none focus:border-gold-pure cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Suspended">Suspended</option>
                      <option value="VIP">VIP</option>
                      <option value="Verified">Verified</option>
                    </select>
                  </div>

                  {/* Manual Segment Assignment */}
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest font-mono block">Segment Allocation</span>
                    <select
                      value={selectedCustomer.segment}
                      onChange={(e) => {
                        const nextSegment = e.target.value as any;
                        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, segment: nextSegment, manualSegment: true } : c));
                        addLog(`Reallocated Customer Segment of ${selectedCustomer.name} to ${nextSegment}`, selectedCustomer.id);
                        if (nextSegment === 'VIP Customer') {
                          addAdminNotification('VIP Customer Created', `Patron ${selectedCustomer.name} was manually added to VIP Customer segment.`, 'success', 'new_vip_customer');
                        }
                        alert(`Segmentation manually updated to: ${nextSegment}`);
                      }}
                      className="bg-black border border-white/15 text-white rounded-xs p-1 px-2.5 text-[10px] font-mono outline-none focus:border-gold-pure cursor-pointer"
                    >
                      <option value="New Customer">New Customer</option>
                      <option value="Returning Customer">Returning Customer</option>
                      <option value="Regular Customer">Regular Customer</option>
                      <option value="VIP Customer">VIP Customer</option>
                      <option value="Inactive Customer">Inactive Customer</option>
                      <option value="High Value Customer">High Value Customer</option>
                      <option value="Frequent Buyer">Frequent Buyer</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* CRM Profile Tab Grid splits */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT PORTRAIT PANEL - PERSONAL DETAILS & COMMUNICATIONS */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Portrait Details card */}
                  <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-3 font-mono text-[9.5px]">
                    <span className="text-[8.5px] uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">Patron Registry Matrix</span>
                    
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-zinc-600 font-mono text-[8.5px] block uppercase">TEL CONTACT</span>
                        <span className="text-zinc-300 font-bold">{selectedCustomer.phone}</span>
                      </div>
                      <div>
                        <span className="text-zinc-600 font-mono text-[8.5px] block uppercase">EMAIL SYSTEM</span>
                        <span className="text-zinc-300 font-sans break-all">{selectedCustomer.email}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-zinc-600 font-mono text-[8.5px] block uppercase">GENDER</span>
                          <span className="text-zinc-300">{selectedCustomer.gender}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 font-mono text-[8.5px] block uppercase">LANG PREF</span>
                          <span className="text-zinc-300">{selectedCustomer.preferredLanguage}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-zinc-600 font-mono text-[8.5px] block uppercase">BIRTHDAY</span>
                        <span className="text-zinc-300">{selectedCustomer.birthday}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        <div>
                          <span className="text-zinc-600 font-mono text-[8.5px] block uppercase">LAST LOGIN</span>
                          <span className="text-zinc-400 text-[10px]">{selectedCustomer.lastLogin}</span>
                        </div>
                        <div>
                          <span className="text-zinc-600 font-mono text-[8.5px] block uppercase">LAST PURCHASE</span>
                          <span className="text-gold-pure text-[10px] font-bold">{selectedCustomer.lastPurchase || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SAVED ADDRESS CARDS (RESTRICTED EDIT COORD) */}
                  <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span className="text-[8.5px] font-mono uppercase tracking-widest text-gold-pure block font-bold">ADDRESS RECORDS MATRIX</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          id="edit-addr-coord"
                          checked={addressEditPermitted}
                          onChange={(e) => setAddressEditPermitted(e.target.checked)}
                          className="rounded-xs bg-black border-white/10 text-gold-pure"
                        />
                        <label htmlFor="edit-addr-coord" className="text-[8px] text-zinc-500 font-mono cursor-pointer uppercase">Permit edit</label>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {selectedCustomer.addresses.map((adr) => (
                        <div key={adr.id} className="bg-zinc-950 p-2.5 rounded-xs border border-white/5 space-y-1 text-left text-[10px]">
                          <div className="flex justify-between items-center text-[8.5px] font-mono">
                            <span className="text-zinc-400 font-bold uppercase">{adr.type} Address</span>
                            {adr.isDefault && (
                              <span className="text-gold-pure bg-gold-pure/5 px-1 py-0.2 border border-gold-pure/20 text-[7px] rounded-xs font-bold uppercase">Default</span>
                            )}
                          </div>
                          <p className="text-zinc-300 leading-relaxed font-sans">{adr.street}</p>
                          <p className="text-zinc-500 font-sans">{adr.city}, {adr.state}, {adr.zip}</p>
                          <p className="text-zinc-600 font-mono text-[8px] uppercase">{adr.country}</p>
                          
                          {addressEditPermitted && (
                            <button
                              onClick={() => {
                                if (isStaff) {
                                  alert('Security Block: Staff members cannot overwrite security-cleared shipping addresses.');
                                  return;
                                }
                                alert('Triggered secure address coordinates adjustment form placeholder.');
                              }}
                              className="text-gold-pure text-[8px] uppercase font-mono underline block pt-1"
                            >
                              Edit coordinate parameters
                            </button>
                          )}
                        </div>
                      ))}

                      {selectedCustomer.addresses.length === 0 && (
                        <p className="text-zinc-600 italic text-center font-mono text-[9px] py-4">No address coordinates on database record.</p>
                      )}
                    </div>
                  </div>

                  {/* MARKETING PREFERENCES */}
                  <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-3 font-mono text-[10px]">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1">
                      <span className="text-[8.5px] uppercase tracking-widest text-gold-pure block font-bold">MARKETING REACH PREFERENCES</span>
                      <span className="text-[7px] text-zinc-500 font-mono uppercase">Admin Controlled</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { key: 'email', label: 'Email Campaigns' },
                        { key: 'sms', label: 'SMS Dispatch' },
                        { key: 'push', label: 'Push Notifications' },
                        { key: 'whatsapp', label: 'WhatsApp Concierge' },
                        { key: 'newsletter', label: 'Newsletter Register' },
                        { key: 'promotionalOffers', label: 'Promotional Offers' },
                      ].map((pref) => {
                        const isOptIn = !!selectedCustomer.marketingPreferences[pref.key as keyof typeof selectedCustomer.marketingPreferences];
                        return (
                          <button
                            key={pref.key}
                            onClick={() => handleUpdateMarketingPreferences(pref.key, !isOptIn)}
                            className={`flex items-center justify-between bg-zinc-950 p-2 rounded-xs border transition-all text-left duration-150 cursor-pointer ${
                              isOptIn
                                ? 'border-gold-pure/30 text-white hover:bg-gold-pure/5'
                                : 'border-white/5 text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            <span className="text-[9px] uppercase tracking-wide font-mono">{pref.label}</span>
                            <span className={`text-[8.5px] font-bold font-mono px-1 rounded-xs ${isOptIn ? 'text-gold-pure bg-gold-pure/10' : 'text-zinc-600 bg-zinc-900'}`}>
                              {isOptIn ? 'ACTIVE' : 'MUTED'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* MIDDLE PANEL - INTERACTIVE TABBED CONTROL SYSTEMS */}
                <div className="lg:col-span-2 space-y-6 text-left">
                  
                  {/* TAB SELECTION BAR */}
                  <div className="flex border-b border-white/5 overflow-x-auto scrollbar-thin bg-black/40 p-1 rounded-t-xs">
                    {(['orders', 'analytics', 'loyalty', 'communications', 'reviews'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveDrawerTab(tab as any)}
                        className={`py-2.5 px-4 text-[9px] uppercase tracking-widest font-mono font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer duration-150 ${
                          activeDrawerTab === tab
                            ? 'border-gold-pure text-gold-pure bg-white/5'
                            : 'border-transparent text-zinc-500 hover:text-white'
                        }`}
                      >
                        {tab === 'orders' && 'Orders & Memos'}
                        {tab === 'analytics' && 'Analytics & Spend'}
                        {tab === 'loyalty' && 'Loyalty Support'}
                        {tab === 'communications' && 'CRM Messaging'}
                        {tab === 'reviews' && 'Reviews Moderation'}
                      </button>
                    ))}
                  </div>

                  {/* TAB CONTENT 1: ORDERS & MEMOS */}
                  {activeDrawerTab === 'orders' && (
                    <div className="space-y-6 animate-fade-in">
                      
                      {/* TRANSACTION HISTORY LEDGER */}
                      <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-3 font-mono text-[9.5px]">
                        <span className="text-[8.5px] uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">PRESTIGE ORDER LEDGER</span>
                        
                        <div className="divide-y divide-white/5 max-h-48 overflow-y-auto pr-1">
                          {selectedCustomer.orderHistory.map((ord) => (
                            <div key={ord.id} className="py-2.5 flex justify-between items-start gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-xs">{ord.id}</span>
                                  <span className="text-zinc-500 text-[8px]">{ord.date}</span>
                                </div>
                                <span className="block text-[9px] text-zinc-400 font-sans mt-0.5">
                                  {ord.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                </span>
                                <span className="text-[7.5px] text-zinc-500 font-mono block">Tracking: {ord.trackingNumber || 'Awaiting dispatch'}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-gold-pure font-bold text-xs block">{ord.total} SAR</span>
                                <span className={`inline-block px-1 rounded-xs text-[7px] font-bold uppercase tracking-wide ${
                                  ord.status === 'Completed' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-gold-pure/10 text-gold-pure'
                                }`}>{ord.status}</span>
                              </div>
                            </div>
                          ))}

                          {selectedCustomer.orderHistory.length === 0 && (
                            <p className="text-zinc-600 italic text-center font-mono py-6 text-[9.5px]">No purchase record found for this Patron email account.</p>
                          )}
                        </div>

                        {/* Interactive Event Simulation Console */}
                        <div className="border-t border-white/5 pt-3 mt-2">
                          <span className="text-[7.5px] uppercase tracking-widest text-zinc-500 block mb-2">CONCIERGE ALERT SIMULATION GATEWAYS</span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={handleSimulateLargePurchase}
                              className="py-1.5 px-2 bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-400 text-emerald-400 text-[8.5px] uppercase tracking-wider font-mono rounded-xs duration-150 cursor-pointer text-center"
                            >
                              Simulate Large Purchase (7.5k SAR)
                            </button>
                            <button
                              onClick={handleSimulateSupportRequest}
                              className="py-1.5 px-2 bg-amber-950/20 border border-amber-500/30 hover:border-amber-400 text-amber-400 text-[8.5px] uppercase tracking-wider font-mono rounded-xs duration-150 cursor-pointer text-center"
                            >
                              Simulate Support Request
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* WISHLIST & SAVED CART WIDGETS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-2.5 font-mono text-[10px]">
                          <span className="text-[8.5px] uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">WISHLIST SAVED GEMS</span>
                          <ul className="space-y-1.5 text-zinc-400">
                            {selectedCustomer.wishlist.map((w, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <Heart className="w-3 h-3 text-gold-pure" /> {w}
                              </li>
                            ))}
                            {selectedCustomer.wishlist.length === 0 && (
                              <p className="text-zinc-600 italic">Wishlist is empty.</p>
                            )}
                          </ul>
                        </div>

                        <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-2.5 font-mono text-[10px]">
                          <span className="text-[8.5px] uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">ACTIVE SAVED BAG (CART)</span>
                          <div className="space-y-2">
                            {selectedCustomer.savedCart.map((c, idx) => (
                              <div key={idx} className="flex justify-between text-zinc-400">
                                <span>{c.quantity}x {c.productName}</span>
                                <span className="text-gold-pure font-bold">{c.price} SAR</span>
                              </div>
                            ))}
                            {selectedCustomer.savedCart.length === 0 && (
                              <p className="text-zinc-600 italic">Shopping Bag is currently empty.</p>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* CUSTOMER NOTES AND INTERNAL CONCIERGE LOGS */}
                      <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-3">
                        <span className="text-[8.5px] font-mono uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">
                          INTERNAL CONCIERGE MEMORANDUM (HIDDEN FROM CUSTOMER)
                        </span>

                        {/* Add Note form */}
                        <div className="space-y-3 bg-zinc-950 p-3 rounded-xs border border-white/5">
                          <textarea
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            placeholder="Add private memo regarding sizing alterations, botanical specifications, family dates..."
                            className="w-full bg-black border border-white/10 text-white rounded-xs p-2 text-xs placeholder-zinc-700 outline-none focus:border-gold-pure h-16 resize-none"
                          />
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                            <div className="flex gap-2">
                              {/* Note type */}
                              <select
                                value={newNoteType}
                                onChange={(e) => setNewNoteType(e.target.value as any)}
                                className="bg-black border border-white/10 text-zinc-300 rounded-xs p-1 text-[10px] outline-none"
                              >
                                <option value="Internal">Internal Note</option>
                                <option value="Follow-up">Follow-up Memo</option>
                                <option value="Support">Support Ticket</option>
                              </select>

                              {/* Priority */}
                              <select
                                value={newNotePriority}
                                onChange={(e) => setNewNotePriority(e.target.value as any)}
                                className="bg-black border border-white/10 text-zinc-300 rounded-xs p-1 text-[10px] outline-none"
                              >
                                <option value="Low">Priority: Low</option>
                                <option value="Medium">Priority: Med</option>
                                <option value="High">Priority: High</option>
                              </select>
                            </div>

                            <button
                              onClick={handleAddNote}
                              className="py-1 px-4 bg-white hover:bg-gold-pure text-black font-bold text-[9.5px] uppercase tracking-widest rounded-xs cursor-pointer ml-auto duration-150"
                            >
                              Save Private Memo
                            </button>
                          </div>
                        </div>

                        {/* Notes feeds list */}
                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                          {selectedCustomer.notes.map((n) => (
                            <div key={n.id} className="bg-zinc-950 p-3 rounded-xs border border-white/5 space-y-1.5 font-mono text-[9.5px]">
                              <div className="flex justify-between text-[8px]">
                                <div className="flex gap-1.5">
                                  <span className="text-gold-pure font-bold uppercase font-sans">[{n.type}]</span>
                                  <span className={`px-1 py-0.2 rounded-xs font-bold text-[7px] ${
                                    n.priority === 'High' 
                                      ? 'bg-red-950/40 text-red-400' 
                                      : n.priority === 'Medium'
                                      ? 'bg-yellow-950/40 text-yellow-400'
                                      : 'bg-zinc-900 text-zinc-400'
                                  }`}>
                                    PRIORITY: {n.priority}
                                  </span>
                                </div>
                                <span className="text-zinc-500">{n.date}</span>
                              </div>
                              <p className="text-zinc-300 text-xs leading-relaxed font-sans">{n.content}</p>
                              <div className="text-[7.5px] text-zinc-600 text-right uppercase">
                                Logged by: {n.author}
                              </div>
                            </div>
                          ))}

                          {selectedCustomer.notes.length === 0 && (
                            <p className="text-zinc-600 italic text-center font-mono py-4 text-[9.5px]">No private memos recorded for this Patron profile.</p>
                          )}
                        </div>

                      </div>

                    </div>
                  )}

                  {/* TAB CONTENT 2: CUSTOMER ANALYTICS & SPEND */}
                  {activeDrawerTab === 'analytics' && (
                    <div className="space-y-6 animate-fade-in">
                      
                      {/* STATS BENTO ROW */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs text-left">
                          <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest block">Lifetime Value</span>
                          <span className="text-lg font-bold text-gold-pure font-mono block mt-1">{formatCurrency(selectedCustomer.totalSpending)}</span>
                          <span className="text-[7px] font-mono text-zinc-600 block">SAR Net Paid</span>
                        </div>
                        <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs text-left">
                          <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest block">Average Order</span>
                          <span className="text-lg font-bold text-white font-mono block mt-1">
                            {formatCurrency(selectedCustomer.totalSpending / Math.max(1, selectedCustomer.orderHistory.length))}
                          </span>
                          <span className="text-[7px] font-mono text-zinc-600 block">SAR per Receipt</span>
                        </div>
                        <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs text-left">
                          <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest block">Purchase Velocity</span>
                          <span className="text-lg font-bold text-white font-mono block mt-1">28.4 Days</span>
                          <span className="text-[7px] font-mono text-zinc-600 block">Re-purchase Cycle</span>
                        </div>
                        <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs text-left">
                          <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest block">Total Checkout</span>
                          <span className="text-lg font-bold text-[#D4AF37] font-mono block mt-1">{selectedCustomer.orderHistory.length}</span>
                          <span className="text-[7px] font-mono text-zinc-600 block">Completed Invoices</span>
                        </div>
                      </div>

                      {/* RECHARTS AREA HISTOGRAM */}
                      <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-3">
                        <span className="text-[8.5px] font-mono uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">
                          6-MONTH PURCHASE REVENUE PROFILE (SAR SPENDING TREND)
                        </span>
                        <div className="h-44 w-full text-xs font-mono">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                              { month: 'Feb 2026', spend: Math.round(selectedCustomer.totalSpending * 0.12) },
                              { month: 'Mar 2026', spend: Math.round(selectedCustomer.totalSpending * 0.18) },
                              { month: 'Apr 2026', spend: Math.round(selectedCustomer.totalSpending * 0.15) },
                              { month: 'May 2026', spend: Math.round(selectedCustomer.totalSpending * 0.22) },
                              { month: 'Jun 2026', spend: Math.round(selectedCustomer.totalSpending * 0.13) },
                              { month: 'Jul 2026', spend: Math.round(selectedCustomer.totalSpending * 0.20) },
                            ]}>
                              <defs>
                                <linearGradient id="userSpendGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25}/>
                                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="month" stroke="#3f3f46" fontSize={8} tickLine={false} />
                              <YAxis stroke="#3f3f46" fontSize={8} tickLine={false} axisLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#D4AF37', borderRadius: '2px', color: '#fff', fontSize: '10px', fontFamily: 'monospace' }}
                                labelStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                              />
                              <Area type="monotone" dataKey="spend" stroke="#D4AF37" fillOpacity={1} fill="url(#userSpendGrad)" strokeWidth={1} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* AFFINITIES GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-3 font-mono">
                          <span className="text-[8.5px] uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">CATEGORY AFFINITIES (INDEXED)</span>
                          <div className="space-y-2">
                            {[
                              { cat: 'Damask Rose Scent Oils', share: '45%' },
                              { cat: 'Prestige Honey', share: '30%' },
                              { cat: 'Sidr Herbs selection', share: '25%' },
                            ].map((c, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-300 font-sans">{c.cat}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                                    <div className="bg-gold-pure h-full" style={{ width: c.share }}></div>
                                  </div>
                                  <span className="text-gold-pure font-bold text-[9px]">{c.share}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-3 font-mono">
                          <span className="text-[8.5px] uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">FAVORITE BRANDS RANKING</span>
                          <div className="space-y-2">
                            {[
                              { brand: 'Al Zoal Premium Heritage', orders: '4 checkouts' },
                              { brand: 'Sudanese Botanical Oils', orders: '2 checkouts' },
                              { brand: 'Jeddah Gold Nectar Co.', orders: '1 checkout' },
                            ].map((b, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px]">
                                <span className="text-zinc-300 font-sans">{b.brand}</span>
                                <span className="text-zinc-500 text-[9px] uppercase">{b.orders}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB CONTENT 3: LOYALTY PROGRAM */}
                  {activeDrawerTab === 'loyalty' && (
                    <div className="space-y-6 animate-fade-in">
                      
                      {/* MEMBERSHIP GRADE CARD */}
                      <div className="relative overflow-hidden p-5 bg-gradient-to-br from-zinc-900 to-black border border-[#D4AF37]/30 rounded-xs text-left">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full filter blur-xl"></div>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[7.5px] font-mono tracking-widest uppercase text-zinc-500">ZOAL SOVEREIGN LOYALTY CLUB</span>
                            <h4 className="text-xl font-bold font-display text-white mt-1 uppercase tracking-widest">
                              {selectedCustomer.totalSpending > 5000 ? 'Gold Elite Member' : selectedCustomer.totalSpending > 2000 ? 'Silver Patron' : 'Bronze Classic'}
                            </h4>
                          </div>
                          <span className="text-[8px] border border-[#D4AF37]/30 text-gold-pure px-2 py-0.5 rounded-xs font-mono uppercase tracking-wider">
                            SECURE ACCOUNT: {selectedCustomer.id.slice(0, 8)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-8 border-t border-white/5 pt-4 text-xs font-mono">
                          <div>
                            <span className="text-zinc-500 text-[8px] uppercase block">REWARD BALANCE</span>
                            <span className="text-lg font-bold text-gold-pure block mt-0.5">{selectedCustomer.loyaltyPoints} PTS</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[8px] uppercase block">REFERRAL BALANCE</span>
                            <span className="text-lg font-bold text-white block mt-0.5">{selectedCustomer.referralCredits} SAR</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[8px] uppercase block">ACTIVE COUPONS</span>
                            <span className="text-lg font-bold text-white block mt-0.5">{selectedCustomer.coupons.length} ASSIGNED</span>
                          </div>
                        </div>
                      </div>

                      {/* LOYALTY OPERATIONS PANEL */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* BIRTHDAY & SPECIAL BENEFITS */}
                        <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-3 font-mono">
                          <span className="text-[8.5px] uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">ANNIVERSARY & BIRTHDAY PERKS</span>
                          <div className="space-y-3 text-[10px]">
                            <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xs border border-white/5">
                              <div>
                                <span className="font-bold text-white block">Patron Birthday</span>
                                <span className="text-zinc-500 text-[9px]">{selectedCustomer.birthday}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-xs text-[8px] uppercase font-bold ${
                                selectedCustomer.birthdayGranted ? 'bg-emerald-950/40 text-emerald-400' : 'bg-yellow-950/40 text-yellow-500'
                              }`}>
                                {selectedCustomer.birthdayGranted ? 'Granted 2026' : 'Eligible for perk'}
                              </span>
                            </div>

                            {!selectedCustomer.birthdayGranted && (
                              <button
                                onClick={() => handleGrantBirthdayReward()}
                                className="w-full py-2 bg-gold-pure text-black font-bold uppercase tracking-widest text-[9px] rounded-xs hover:bg-white duration-150 cursor-pointer"
                              >
                                Trigger Anniversary Voucher (+250 SAR +500 PTS)
                              </button>
                            )}
                            {selectedCustomer.birthdayGranted && (
                              <p className="text-[9px] text-zinc-500 text-center italic">Birthday Special Benefit has already been credited to this account for the current annual cycle.</p>
                            )}
                          </div>
                        </div>

                        {/* REWARD POINTS CONVERSION */}
                        <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-3 font-mono">
                          <span className="text-[8.5px] uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">CONVERT POINTS FOR REWARDS</span>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {[
                              { name: '50 SAR Cash Voucher', cost: 500 },
                              { name: '15% Damask Rose Water coupon', cost: 1000 },
                              { name: 'Free Royal Oud Botanical Sampler', cost: 2000 },
                            ].map((r, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-zinc-950 p-2.5 rounded-xs border border-white/5 text-[10px]">
                                <div>
                                  <span className="text-zinc-200 block">{r.name}</span>
                                  <span className="text-gold-pure font-bold text-[9px]">{r.cost} PTS</span>
                                </div>
                                <button
                                  disabled={selectedCustomer.loyaltyPoints < r.cost}
                                  onClick={() => handleRedeemLoyaltyReward(r.name, r.cost)}
                                  className="py-1 px-3 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white text-[9px] uppercase tracking-wider rounded-xs disabled:opacity-30 disabled:pointer-events-none duration-150 cursor-pointer"
                                >
                                  Redeem
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* TAB CONTENT 4: CRM COMMUNICATIONS */}
                  {activeDrawerTab === 'communications' && (
                    <div className="space-y-6 animate-fade-in">
                      
                      {/* DISPATCH NEW MESSAGE */}
                      <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-3 font-mono">
                        <span className="text-[8.5px] uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">CRM OUTBOUND CONCIERGE OUTREACH</span>
                        
                        <form onSubmit={handleSubmitOutreach} className="space-y-3 text-xs">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[8px] text-zinc-500 uppercase block">Outbound Channel</label>
                              <select name="channel" className="w-full bg-black border border-white/10 text-white p-1.5 text-xs rounded-xs outline-none focus:border-gold-pure">
                                <option value="Email">SMTP Private Email</option>
                                <option value="SMS">Telecommunications SMS Gateway</option>
                                <option value="WhatsApp">WhatsApp Concierge Node</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] text-zinc-500 uppercase block">Template Type</label>
                              <select name="template" className="w-full bg-black border border-white/10 text-white p-1.5 text-xs rounded-xs outline-none focus:border-gold-pure">
                                <option value="General Followup">General Concierge Followup</option>
                                <option value="Loyalty Offer">Special Points & VIP Benefit Promotion</option>
                                <option value="Suspension Alert">Security / Account Suspension Notice</option>
                                <option value="VIP Private Invitation">Private Botanical Exhibition invite</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8px] text-zinc-500 uppercase block">Message Body Content</label>
                            <textarea
                              name="content"
                              placeholder="Type highly customized private notification or select template text to dispatch..."
                              className="w-full bg-black border border-white/10 text-white p-2 text-xs rounded-xs outline-none focus:border-gold-pure h-20 resize-none font-sans"
                            />
                          </div>

                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[8px] text-zinc-600">Note: All dispatches log to customer's permanent communications timeline history.</span>
                            <button
                              type="submit"
                              className="py-1.5 px-5 bg-gold-pure text-black font-bold uppercase tracking-widest text-[9.5px] rounded-xs hover:bg-white duration-150 cursor-pointer"
                            >
                              Dispatch Outreach Message
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* COMMUNICATION HISTORY timeline */}
                      <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-3 font-mono text-[9.5px]">
                        <span className="text-[8.5px] uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">COMMUNICATIONS TIMELINE LOGS</span>
                        
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {selectedCustomer.communicationsTimeline.map((comm) => (
                            <div key={comm.id} className="p-3 bg-zinc-950 border border-white/5 rounded-xs space-y-1.5 text-left relative">
                              <div className="flex justify-between items-center text-[8px]">
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.2 rounded-xs font-bold ${
                                    comm.channel === 'WhatsApp' 
                                      ? 'bg-emerald-950/40 text-emerald-400' 
                                      : comm.channel === 'SMS' 
                                      ? 'bg-blue-950/40 text-blue-400' 
                                      : 'bg-indigo-950/40 text-indigo-400'
                                  }`}>
                                    {comm.channel}
                                  </span>
                                  <span className="text-zinc-400 font-bold uppercase">[{comm.type}]</span>
                                </div>
                                <span className="text-zinc-500">{comm.date}</span>
                              </div>
                              <p className="text-zinc-300 font-sans text-xs leading-relaxed">{comm.content}</p>
                              <div className="flex justify-between items-center text-[7.5px] text-zinc-600 uppercase border-t border-white/5 pt-1 mt-1">
                                <span>Ref: {comm.id}</span>
                                <span className="text-emerald-400 font-bold">{comm.status}</span>
                              </div>
                            </div>
                          ))}

                          {selectedCustomer.communicationsTimeline.length === 0 && (
                            <p className="text-zinc-600 italic text-center font-mono py-6">No communication records on file for this email address.</p>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB CONTENT 5: PRODUCT REVIEWS MODERATION */}
                  {activeDrawerTab === 'reviews' && (
                    <div className="space-y-6 animate-fade-in">
                      
                      <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-4 font-mono text-[9.5px]">
                        <span className="text-[8.5px] uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">PATRON REVIEWS & FEEDBACK FEED</span>
                        
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                          {selectedCustomer.reviews.map((rev) => (
                            <div key={rev.id} className="p-3 bg-zinc-950 border border-white/5 rounded-xs space-y-2 text-left">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="text-xs font-bold text-white block font-sans">{rev.productName}</span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-gold-pure text-[11px]">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                                    <span className="text-zinc-500 text-[8px] font-mono">{rev.date}</span>
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-xs text-[7.5px] font-bold uppercase border ${
                                  rev.status === 'Approved' 
                                    ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/10' 
                                    : rev.status === 'Flagged'
                                    ? 'bg-red-950/30 text-red-400 border-red-500/10'
                                    : 'bg-zinc-900 text-zinc-400 border-white/5'
                                }`}>
                                  {rev.status}
                                </span>
                              </div>

                              <p className="text-zinc-300 font-sans text-xs leading-relaxed italic">"{rev.content}"</p>

                              {/* Staff reply */}
                              {rev.reply && (
                                <div className="p-2 bg-black border-l-2 border-gold-pure rounded-r-xs space-y-0.5 mt-2">
                                  <span className="text-[7.5px] text-gold-pure uppercase font-bold block">OFFICIAL ZOAL RESPONSE</span>
                                  <p className="text-zinc-400 font-sans text-[11px] leading-relaxed">{rev.reply}</p>
                                </div>
                              )}

                              {/* Moderation Controls */}
                              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-2 border-t border-white/5 mt-2 text-xs">
                                <div className="flex gap-1.5">
                                  {rev.status !== 'Approved' && (
                                    <button
                                      onClick={() => handleUpdateReviewStatus(rev.id, 'approve')}
                                      className="py-1 px-2.5 bg-emerald-950/40 border border-emerald-500/20 hover:border-emerald-400 text-emerald-400 text-[8px] font-bold uppercase rounded-xs cursor-pointer"
                                    >
                                      Approve Review
                                    </button>
                                  )}
                                  {rev.status !== 'Flagged' && (
                                    <button
                                      onClick={() => handleUpdateReviewStatus(rev.id, 'reject')}
                                      className="py-1 px-2.5 bg-red-950/40 border border-red-500/20 hover:border-red-400 text-red-400 text-[8px] font-bold uppercase rounded-xs cursor-pointer"
                                    >
                                      Flag as Spam
                                    </button>
                                  )}
                                </div>

                                {/* Reply inline form */}
                                <form onSubmit={(e) => handleSubmitReviewReply(e, rev.id)} className="flex items-center gap-1.5 flex-grow sm:max-w-xs">
                                  <input
                                    type="text"
                                    name="replyText"
                                    placeholder={rev.reply ? "Modify official reply..." : "Draft staff reply..."}
                                    className="flex-grow bg-black border border-white/10 text-white rounded-xs p-1 text-[10px] outline-none placeholder-zinc-700 font-sans"
                                  />
                                  <button
                                    type="submit"
                                    className="py-1 px-2.5 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white text-[8px] uppercase tracking-wider font-mono rounded-xs cursor-pointer"
                                  >
                                    Post
                                  </button>
                                </form>
                              </div>

                            </div>
                          ))}

                          {selectedCustomer.reviews.length === 0 && (
                            <p className="text-zinc-600 italic text-center font-mono py-6">No product reviews submitted by this customer.</p>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ACTIVITY TIMELINE TRAIL */}
                  <div className="bg-black/50 border border-white/5 p-4 rounded-xs space-y-3 font-mono text-[9.5px]">
                    <span className="text-[8.5px] uppercase tracking-widest text-gold-pure block font-bold border-b border-white/5 pb-1">PATRON AUDIT TIMELINE TRACKER</span>
                    
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {selectedCustomer.activityTimeline.map((act) => (
                        <div key={act.id} className="relative pl-4 border-l border-white/10 text-left">
                          {/* Dot indicator */}
                          <div className="absolute left-[-3.5px] top-[4px] w-2.5 h-2.5 rounded-full bg-[#D4AF37] border border-black shadow-sm" />
                          <div className="flex justify-between items-start text-[8px] text-zinc-500">
                            <span className="text-gold-pure font-bold uppercase tracking-wider">{act.event}</span>
                            <span>{act.time}</span>
                          </div>
                          <p className="text-zinc-300 text-[10px] mt-0.5 leading-relaxed font-sans">{act.description}</p>
                        </div>
                      ))}
                      {selectedCustomer.activityTimeline.length === 0 && (
                        <p className="text-zinc-600 italic text-center font-mono py-4">No logged activity in session records.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MODAL FOR REGISTERING A PATRON ACCOUNT */}
      <AnimatePresence>
        {showAddCustomerModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-white/10 rounded-xs max-w-md w-full p-6 space-y-5 relative text-left">
              
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[8px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ZOAL VIP PORTAL</span>
                <h3 className="text-lg font-bold tracking-widest font-display text-white uppercase">Register Prestige Patron</h3>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs font-mono">
                
                <div className="space-y-1">
                  <label className="text-zinc-500 uppercase tracking-widest block text-[8.5px]">Patron Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Princess Mashael bint Naif"
                    value={addForm.name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-500 uppercase tracking-widest block text-[8.5px]">Secure Email Coordinate *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. patron@royal.sa"
                    value={addForm.email}
                    onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-500 uppercase tracking-widest block text-[8.5px]">Mobile Tel contact *</label>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. ${settings.phone}`}
                    value={addForm.phone}
                    onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase tracking-widest block text-[8.5px]">Dispatch City</label>
                    <select
                      value={addForm.city}
                      onChange={(e) => setAddForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure cursor-pointer"
                    >
                      <option value="Branch A">Branch A</option>
                      <option value="Branch B">Branch B</option>
                      <option value="Khobar">Khobar</option>
                      <option value="Jeddah">Jeddah</option>
                      <option value="Hofuf">Hofuf</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase tracking-widest block text-[8.5px]">Language preference</label>
                    <select
                      value={addForm.language}
                      onChange={(e) => setAddForm(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure cursor-pointer"
                    >
                      <option value="Arabic">Arabic</option>
                      <option value="English">English</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase tracking-widest block text-[8.5px]">Birthday</label>
                    <input
                      type="date"
                      value={addForm.birthday}
                      onChange={(e) => setAddForm(prev => ({ ...prev, birthday: e.target.value }))}
                      className="w-full bg-black border border-white/10 text-zinc-400 rounded-xs p-2 outline-none focus:border-gold-pure"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase tracking-widest block text-[8.5px]">Gender Matrix</label>
                    <select
                      value={addForm.gender}
                      onChange={(e) => setAddForm(prev => ({ ...prev, gender: e.target.value as any }))}
                      className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white text-black font-bold uppercase tracking-widest rounded-xs cursor-pointer duration-150 text-center"
                >
                  Verify and Register
                </button>

              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
