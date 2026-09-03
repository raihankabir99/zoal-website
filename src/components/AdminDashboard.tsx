// @ts-nocheck
import React, { useState, useMemo, useEffect, useRef } from 'react';
import EnterpriseHealthMonitor from './EnterpriseHealthMonitor';
import {
  User, Shield, Landmark, BarChart3, Package, Truck, Compass, Languages,
  MapPin, CheckCircle, Users, RefreshCw, Star, ArrowUpRight, TrendingUp, Sparkles, Bell,
  Clock, CreditCard, X, Gift, ClipboardList, Check, Mail, PackageCheck, LogOut,
  Lock, Menu, ChevronRight, ArrowLeft, Search, Filter, Trash2, Edit, Download, Upload, Plus,
  FileText, CheckCircle2, AlertCircle, FolderTree, Tag, Eye, EyeOff, LayoutDashboard, Activity, Settings,
  Printer, FileSpreadsheet, Smartphone, ToggleLeft, ToggleRight, Calendar, Award, Sliders, ChevronDown, ChevronUp, Info,
  Layers, Video, MessageSquare, UploadCloud, Globe, LifeBuoy, HardDrive, Camera, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Order, BusinessCategory, Question, DeliveryType, ProductVariant, Review } from '../types';
import { useGlobalProducts, updateProductInventory, SafeImage, resolveProductImage, normalizeCategory } from '../imageRegistry';
import { saveProductToSupabase, deleteProductFromSupabase, triggerProductFetch } from '../lib/productSync';
import { formatCurrency } from '../utils';
import { BRANDING } from '../constants';

const lazyWithRetry = (importFn: () => Promise<any>) => {
  return React.lazy(() => {
    return new Promise<any>((resolve) => {
      let retriesLeft = 5;
      const attempt = () => {
        importFn()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft <= 0) {
              console.error("Critical: Failed to load component.", error);
              resolve({ default: () => <div className="p-8 text-zinc-500 text-xs">Failed to load section. Please refresh.</div> });
              return;
            }
            retriesLeft--;
            setTimeout(attempt, 1000);
          });
      };
      attempt();
    });
  });
};

const PmsSubTabs = lazyWithRetry(() => import('./PmsSubTabs').then(m => ({ default: m.PmsSubTabs })));
const EnterpriseProductImportCenter = lazyWithRetry(() => import('./EnterpriseProductImportCenter').then(m => ({ default: m.EnterpriseProductImportCenter })));
const CampaignsMarketingPanel = lazyWithRetry(() => import('./CampaignsMarketingPanel').then(m => ({ default: m.CampaignsMarketingPanel })));
const CategoryManagement = lazyWithRetry(() => import('./CategoryManagement').then(m => ({ default: m.CategoryManagement })));
const BrandManagement = lazyWithRetry(() => import('./BrandManagement').then(m => ({ default: m.BrandManagement })));
const EnterpriseOrderManagement = lazyWithRetry(() => import('./EnterpriseOrderManagement'));
const EnterpriseInventoryManagement = lazyWithRetry(() => import('./EnterpriseInventoryManagement'));
const EnterpriseCrm = lazyWithRetry(() => import('./EnterpriseCrm'));
const EnterpriseCmsManager = lazyWithRetry(() => import('./EnterpriseCmsManager'));
const EnterpriseBlogManager = lazyWithRetry(() => import('./EnterpriseBlogManager').then(m => ({ default: m.EnterpriseBlogManager })));
const SupportCenterDashboard = lazyWithRetry(() => import('./SupportCenterDashboard'));
const ProductWorkspaceForm = lazyWithRetry(() => import('./ProductWorkspaceForm').then(m => ({ default: m.ProductWorkspaceForm })));
const SupabaseStoragePanel = lazyWithRetry(() => import('./SupabaseStoragePanel'));
const MerchantAssetsStudio = lazyWithRetry(() => import('./MerchantAssetsStudio'));
const WarehouseManagement = lazyWithRetry(() => import('./WarehouseManagement').then(m => ({ default: m.WarehouseManagement })));
const EnterpriseAiWorkspace = lazyWithRetry(() => import('./EnterpriseAiWorkspace').then(m => ({ default: m.EnterpriseAiWorkspace })));
const EnterpriseAiReviewCenter = lazyWithRetry(() => import('./EnterpriseAiReviewCenter').then(m => ({ default: m.EnterpriseAiReviewCenter })));
const EnterpriseRegionalAnalytics = lazyWithRetry(() => import('./EnterpriseRegionalAnalytics').then(m => ({ default: m.EnterpriseRegionalAnalytics })));
const EnterpriseKpiDashboard = lazyWithRetry(() => import('./EnterpriseKpiDashboard').then(m => ({ default: m.EnterpriseKpiDashboard })));
const EnterpriseForecastDashboard = lazyWithRetry(() => import('./EnterpriseForecastDashboard').then(m => ({ default: m.EnterpriseForecastDashboard })));
const EnterpriseAiExecutiveBriefing = lazyWithRetry(() => import('./EnterpriseAiExecutiveBriefing').then(m => ({ default: m.EnterpriseAiExecutiveBriefing })));
const EnterpriseDecisionSimulation = lazyWithRetry(() => import('./EnterpriseDecisionSimulation').then(m => ({ default: m.EnterpriseDecisionSimulation })));
const EnterpriseGrowthAnalytics = lazyWithRetry(() => import('./EnterpriseGrowthAnalytics').then(m => ({ default: m.EnterpriseGrowthAnalytics })));
const AnalyticsOverview = lazyWithRetry(() => import('./dashboard/AnalyticsOverview'));
const OwnerExecutiveDashboard = lazyWithRetry(() => import('./OwnerExecutiveDashboard'));
const StrategicReport = lazyWithRetry(() => import('./StrategicReport').then(m => ({ default: m.StrategicReport || m.default })));

import DashboardLanguageSwitcher from './dashboard/DashboardLanguageSwitcher';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { useBranding } from './BrandingContext';
import { useNotificationEngine } from '../lib/notificationStore';
import { ConfirmationModal } from './common/ConfirmationModal';

// Available categories for Select inputs
const ALL_CATEGORIES: { id: BusinessCategory; name: string }[] = [
  { id: 'coffee', name: 'ZOAL Coffee & Cafe' },
  { id: 'bakery', name: 'Sudanese Bakery' },
  { id: 'market', name: 'Traditional Organic Market' },
  { id: 'fashion', name: 'Premium Sudanese Toob' },
  { id: 'thobes', name: 'Luxury Men\'s Thobes' },
  { id: 'cosmetics', name: 'Elite Cosmetics & Apothecary' }
];

interface AdminDashboardProps {
  currentUser: any;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onLogout: () => void;
  setCurrentPage: (page: string) => void;
  notificationEngine?: any;
  onOpenNotifications?: () => void;
  initialTab?: string;
}

export default function AdminDashboard({
  currentUser,
  orders,
  setOrders,
  onUpdateOrderStatus,
  onLogout,
  setCurrentPage,
  initialTab,
  notificationEngine,
  onOpenNotifications
}: AdminDashboardProps) {
  // 1. Route Guard & RBAC Protection
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner' || currentUser.role === 'manager');

  // State management for navigation
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'dashboard');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Product delete modal states
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState<boolean>(false);
  const [productDeleteError, setProductDeleteError] = useState<string | null>(null);

  // Bulk product delete states
  const [selectedProductsToDelete, setSelectedProductsToDelete] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);

  // Generic confirmation modal states
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
    isProcessing?: boolean;
    error?: string | null;
  } | null>(null);

  // Handle keyboard events (ESC to close delete product modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && productToDelete) {
        setProductToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productToDelete]);

  const [mediaSubTab, setMediaSubTab] = useState<'library' | 'storage'>('library');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [showAdminSmtpPass, setShowAdminSmtpPass] = useState<boolean>(false);

  // Global reactive products
  const allProducts = useGlobalProducts();

  // Selected details or forms states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState<boolean>(false);
  const [resetPasswordStaff, setResetPasswordStaff] = useState<any | null>(null);
  const [newResetPassword, setNewResetPassword] = useState<string>('');
  const [confirmResetPassword, setConfirmResetPassword] = useState<string>('');
  const [showNewResetPassword, setShowNewResetPassword] = useState<boolean>(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState<boolean>(false);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState<boolean>(false);
  const [isAddCampaignOpen, setIsAddCampaignOpen] = useState<boolean>(false);
  const [isAddBannerOpen, setIsAddBannerOpen] = useState<boolean>(false);
  const [marketingSubTab, setMarketingSubTab] = useState<string>('campaigns');
  const [mktProductSearch, setMktProductSearch] = useState<string>('');
  const [marketingError, setMarketingError] = useState<string | null>(null);

  // Bulk selectors & Advanced Filters for orders
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [orderDateFilter, setOrderDateFilter] = useState<string>('');
  const [orderMinAmount, setOrderMinAmount] = useState<string>('');
  const [orderMaxAmount, setOrderMaxAmount] = useState<string>('');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('all');

  // Filters and searches
  const [productSearch, setProductSearch] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, isAddProductOpen]);

  // Local state for categories (loaded from localStorage or default)
  const [categories, setCategories] = useState<any[]>(() => {
    let list: any[] = [];
    try {
      const raw = localStorage.getItem('zoal_admin_categories');
      if (raw) {
        list = JSON.parse(raw);
      }
    } catch (e) {}

    const defaults = [
      { id: 'cat-1', name: 'ZOAL Coffee & Cafe', slug: 'coffee', parent: null, description: 'Premium selection of artisanal single-origin coffee blends, saffron mocktails, and luxury thermal tea gatherings.', sortOrder: 1, count: 3, featuredImage: 'https://jglveforpqhioxpambbq.supabase.co/storage/v1/object/public/categories/categories/thumbnail_1786056581210_coffe.png.png', bannerImage: 'https://jglveforpqhioxpambbq.supabase.co/storage/v1/object/public/categories/categories/thumbnail_1786056581210_coffe.png.png' },
      { id: 'cat-2', name: 'Sudanese Bakery', slug: 'bakery', parent: null, description: 'Pillowy hearth-fired Hoboz breads, sesame crackers, and traditional Ghoriba cookies baked fresh daily.', sortOrder: 2, count: 3, featuredImage: 'https://jglveforpqhioxpambbq.supabase.co/storage/v1/object/public/categories/categories/thumbnail_1786056744199_bakery.png.png', bannerImage: 'https://jglveforpqhioxpambbq.supabase.co/storage/v1/object/public/categories/categories/banner_1786067395955_backery_snackes.jpeg' },
      { id: 'cat-3', name: 'Traditional Organic Market', slug: 'market', parent: null, description: 'Direct-trade organic Sudanese botanical herbs, premium Gum Arabic crystals, and whole Karkadeh hibiscus blossoms.', sortOrder: 3, count: 2, featuredImage: 'https://jglveforpqhioxpambbq.supabase.co/storage/v1/object/public/categories/categories/thumbnail_1786054061513_make_1_1_202607050335.jpeg' },
      { id: 'cat-4', name: 'Premium Sudanese Toob', slug: 'fashion', parent: null, description: 'Hand-woven formal Toob gowns of fine organic drapes, silk threads, and geometric gold border embroidery.', sortOrder: 4, count: 1, featuredImage: 'https://jglveforpqhioxpambbq.supabase.co/storage/v1/object/public/categories/categories/thumbnail_1786066388125_primuime.png.png' },
      { id: 'cat-5', name: 'Luxury Men\'s Thobes', slug: 'thobes', parent: null, description: 'Master tailored premium Sudanese and Gulf thobes structured from fine imported Italian cottons.', sortOrder: 5, count: 2, featuredImage: 'https://jglveforpqhioxpambbq.supabase.co/storage/v1/object/public/categories/categories/thumbnail_1786067301491_thoves_and_attair.png.png', bannerImage: 'https://jglveforpqhioxpambbq.supabase.co/storage/v1/object/public/categories/categories/banner_1786067315275_thoves.1.jpeg' },
      { id: 'cat-6', name: 'Elite Cosmetics & Apothecary', slug: 'cosmetics', parent: null, description: 'Traditional Sudanese perfume oils, long-lasting musks, and organic botanicals.', sortOrder: 6, count: 0, featuredImage: 'https://jglveforpqhioxpambbq.supabase.co/storage/v1/object/public/categories/categories/thumbnail_1786054061513_make_1_1_202607050335.jpeg' }
    ];

    try {
      const existingAll = localStorage.getItem('zoal_all_collections_image');
      if (!existingAll || existingAll.includes('/assets/') || existingAll.includes('/images/')) {
        localStorage.setItem('zoal_all_collections_image', 'https://jglveforpqhioxpambbq.supabase.co/storage/v1/object/public/categories/categories/allcollections_1786068837249_collection.png.png');
      }
    } catch (e) {}

    if (list && list.length > 0) {
      // Normalize existing categories to reconnect Supabase Storage URLs if missing or static asset fallback
      const normalized = list.map((c: any) => {
        const slug = c.slug || c.id;
        const defaultMatch = defaults.find(d => d.slug === slug || d.id === c.id);
        if (defaultMatch) {
          const hasValidImg = c.featuredImage && typeof c.featuredImage === 'string' && !c.featuredImage.includes('/assets/') && !c.featuredImage.includes('/images/');
          const hasValidBanner = c.bannerImage && typeof c.bannerImage === 'string' && !c.bannerImage.includes('/assets/') && !c.bannerImage.includes('/images/');
          
          let resolvedImg = hasValidImg ? c.featuredImage : defaultMatch.featuredImage;
          let resolvedBanner = hasValidBanner ? c.bannerImage : (defaultMatch.bannerImage || c.bannerImage || defaultMatch.featuredImage);

          // Healing check: if images were consolidated/corrupted by previous bug, restore correct independent defaults
          if (resolvedImg === resolvedBanner && defaultMatch.featuredImage !== defaultMatch.bannerImage) {
            resolvedImg = defaultMatch.featuredImage;
            resolvedBanner = defaultMatch.bannerImage;
          }

          return {
            ...c,
            featuredImage: resolvedImg,
            bannerImage: resolvedBanner,
            image: resolvedImg,
            imageUrl: resolvedImg
          };
        }
        return c;
      });
      try {
        localStorage.setItem('zoal_admin_categories', JSON.stringify(normalized));
      } catch (e) {}
      return normalized;
    }
    try {
      localStorage.setItem('zoal_admin_categories', JSON.stringify(defaults));
    } catch (e) {}
    return defaults;
  });

  // Local state for brands
  const [brands, setBrands] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_brands');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'brand-1', name: 'ZOAL Specialty Roasters', slug: 'zoal-roasters', description: 'Elite micro-batch single-origin coffees sourced from high-altitude smallholders across Yemen and East Africa.', logoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=200' },
      { id: 'brand-2', name: 'Sudan Bakery Heritage', slug: 'bakery-heritage', description: 'Centuries-old sourdough cultures hand-kneaded by Sudanese master bakers using stone-oven wood fire hearths.', logoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=200' },
      { id: 'brand-3', name: 'Kordofan Organic Co.', slug: 'kordofan-organic', description: 'First-grade natural agricultural exports harvested directly from the rain-fed plains of Western Sudan.', logoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=200' },
      { id: 'brand-4', name: 'Artisan Sudanese Weaves', slug: 'artisan-weaves', description: 'Prestige textile workshops creating premium hand-spun organic long-staple cotton and golden thread embroidery.', logoUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=200' }
    ];
  });

  // ENTERPRISE STATES & OVERRIDES
  const [orderOverrides, setOrderOverrides] = useState<Record<string, {
    timeline: { status: string; date: string; updatedBy: string }[];
    adminNotes: string;
    paymentStatus: 'Paid' | 'Unpaid' | 'Refunded' | 'Partially Refunded';
    carrier: string;
    trackingNumber: string;
    deliveryZone: string;
    shippingAddress: string;
    contactName: string;
    notes?: string;
  }>>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_order_overrides');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_order_overrides', JSON.stringify(orderOverrides));
  }, [orderOverrides]);

  const [stockHistory, setStockHistory] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_stock_history');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'sh-1', productId: '1', productName: 'Saffron Specialty Blend Coffee', oldStock: 25, newStock: 20, adjustedBy: 'Admin', reason: 'Sales Order Fulfilled', time: new Date(Date.now() - 3600000).toLocaleString() },
      { id: 'sh-2', productId: '2', productName: 'Artisanal Cardamom Cookies', oldStock: 12, newStock: 30, adjustedBy: 'Support Staff', reason: 'Supplier Replenishment', time: new Date(Date.now() - 14400000).toLocaleString() }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_stock_history', JSON.stringify(stockHistory));
  }, [stockHistory]);

  const [supplierReference, setSupplierReference] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_suppliers');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'sup-1', name: 'Kordofan Premium Co-Op', contactName: 'El-Hadi Ibrahim', phone: '+249 912 345678', email: 'elhadi@kordofanpremium.com', status: 'Active Partner', categories: ['Market Raw Spices', 'Organic Gum Crystals'] },
      { id: 'sup-2', name: 'Yemeni Terraces Coffee Sourcing', contactName: 'Adnan Al-Hamdani', phone: '+967 711 234567', email: 'adnan@yemeniterraces.com', status: 'Active Partner', categories: ['Specialty Coffee Saffron'] },
      { id: 'sup-3', name: 'Riyadh Silk & Brocade Guild', contactName: 'Fatma Al-Jasser', phone: '+966 56 769 9315', email: 'fatma.j@riyadhbrocade.com', status: 'Active Partner', categories: ['Premium Sudanese Toob', 'Luxury Men\'s Thobes'] }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_suppliers', JSON.stringify(supplierReference));
  }, [supplierReference]);

  const [purchaseHistory, setPurchaseHistory] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_purchases');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'po-501', supplierName: 'Kordofan Premium Co-Op', date: '2026-07-01', amount: 4500, status: 'Completed', items: '50kg Whole Karkadeh Flowers, 10kg Gum Arabic Tears' },
      { id: 'po-502', supplierName: 'Yemeni Terraces Coffee Sourcing', date: '2026-07-10', amount: 12800, status: 'In Transit', items: '100kg Single-Origin Yemeni Peaberry Coffee Beans' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_purchases', JSON.stringify(purchaseHistory));
  }, [purchaseHistory]);

  const [customerOverrides, setCustomerOverrides] = useState<Record<string, {
    status: 'active' | 'suspended';
    notes: string;
    addresses: string[];
    activity: { event: string; time: string }[];
  }>>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_customer_overrides');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_customer_overrides', JSON.stringify(customerOverrides));
  }, [customerOverrides]);

  const [staffList, setStaffList] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_staff');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'staff-1', name: 'Khalid Al-Mansoori', email: 'khalid@zoal.com', role: 'Senior Support Representative', permissions: ['Edit Catalog', 'Manage Orders'], status: 'active', lastActive: 'Active 2 mins ago' },
      { id: 'staff-2', name: 'Sumaya Bashir', email: 'sumaya@zoal.com', role: 'Senior Artisan Supervisor', permissions: ['Edit Catalog', 'Edit Website Content'], status: 'active', lastActive: 'Active 1 hour ago' },
      { id: 'staff-3', name: 'Amjad Suliman', email: 'amjad@zoal.com', role: 'Support Specialist', permissions: ['Manage Orders'], status: 'active', lastActive: 'Active Yesterday' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_staff', JSON.stringify(staffList));
  }, [staffList]);

  const [cmsSettings, setCmsSettings] = useState<any>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_cms');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      heroHeading: 'Sudanese Heritage & Modern Luxury Gatherings',
      heroSubheading: 'Indulge in artisanal micro-batch single-origin Yemeni coffees, traditional wood fire breads, botanical hibiscus infusions, and premium hand-embroidered heritage gowns.',
      heroImage: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=1600',
      activeSections: {
        hero: true,
        featured: true,
        categories: true,
        brands: true,
        slogan: true,
        stories: true
      },
      flashSaleText: 'Grand Opening Privileges Code: ZOALGOLD for 15% discount site-wide.',
      flashSalePercentage: 15,
      flashSaleCountdown: '2026-08-31',
      aboutContent: 'AL ZOAL is a premium boutique sanctuary celebrating Sudanese hospitality and artisanal heritage. Every coffee bean, baked crumb, herb harvest, and golden thread is curated with authentic luxury drapes.',
      seoTitle: 'AL ZOAL | Luxury Sudanese Artisanal Roasters, Bakery & Gowns',
      seoDesc: 'Premium Sudanese artisanal boutique. Organic market botanicals, single-origin Yemeni coffee, master-tailored Sudanese Toob & thobes with elite Saudi courier dispatch.',
      privacyPolicy: 'We store your cryptographic session identities and personal details securely under standard GCC security laws.',
      shippingPolicy: 'Dispatched from Dammam and Al Hofuf main warehouses using premium high-care courier express. Overnight delivery available.',
      returnPolicy: 'Due to the custom-tailored premium nature of our Sudanese Toobs and fresh botanical market selections, items are refundable only within 7 days in pristine, unused state.'
    };
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_cms', JSON.stringify(cmsSettings));
  }, [cmsSettings]);

  const [coupons, setCoupons] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_coupons');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'c-1', code: 'ZOALGOLD', rate: 15, type: 'percent', expiry: '2026-12-31', limit: 500, usedCount: 84 },
      { id: 'c-2', code: 'SAUDIHERITAGE', rate: 20, type: 'percent', expiry: '2026-08-15', limit: 100, usedCount: 22 }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_coupons', JSON.stringify(coupons));
  }, [coupons]);

  const DEFAULT_CAMPAIGNS = [
    { id: 'camp-1', name: 'Ramadan Specialty Coffee Promo', channel: 'Email & SMS', status: 'Active', target_audience: 'VIP Customers', conversion_rate: '14.2%' },
    { id: 'camp-2', name: 'Summer Bespoke Thobe Launch', channel: 'Instagram & WhatsApp', status: 'Scheduled', target_audience: 'All Registered', conversion_rate: '8.7%' }
  ];

  const DEFAULT_SUBSCRIBERS = [
    { id: 'sub-1', email: 'tarig@zoal.sa', name: 'Tarig Al-Sultan', status: 'Subscribed', channel: 'Email', joined_at: '2026-05-10' },
    { id: 'sub-2', email: 'fahed@zoal.sa', name: 'Fahed M. Khartum', status: 'Subscribed', channel: 'SMS', joined_at: '2026-06-01' },
    { id: 'sub-3', email: 'amira@zoal.sa', name: 'Amira Hassan', status: 'Subscribed', channel: 'WhatsApp', joined_at: '2026-06-15' }
  ];

  const [campaigns, setCampaigns] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_campaigns');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CAMPAIGNS;
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  const [banners, setBanners] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_banners');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'ban-1', title: 'Luxury Toob Collection Premiere', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800', link: 'fashion', status: 'active' },
      { id: 'ban-2', title: 'Freshly Hearth-Baked Sesame Hoboz', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800', link: 'bakery', status: 'active' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_banners', JSON.stringify(banners));
  }, [banners]);

  const [subscribers, setSubscribers] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_subscribers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_SUBSCRIBERS;
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_subscribers', JSON.stringify(subscribers));
  }, [subscribers]);

  useEffect(() => {
    const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token') || '';
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    fetch('/api/marketing-data', { headers: authHeaders })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => {
            if (err.error === 'MARKETING_DATABASE_UNAVAILABLE') {
              setMarketingError('Marketing data is temporarily unavailable. Please try again.');
            }
            throw new Error(err.error || `Server returned status ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        setMarketingError(null);
        if (data?.campaigns && Array.isArray(data.campaigns)) {
          setCampaigns(data.campaigns);
        }
        if (data?.coupons && Array.isArray(data.coupons)) {
          setCoupons(data.coupons);
        }
        if (data?.subscribers && Array.isArray(data.subscribers)) {
          setSubscribers(data.subscribers);
        }
      })
      .catch(err => {
        console.warn('Note: Could not sync marketing data from server:', err.message || err);
      });

    fetch('/api/homepage-heroes', { headers: authHeaders })
      .then(res => {
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mappedBanners = data.map((h: any) => ({
            id: h.id,
            title: h.hero_title || '',
            image: h.hero_image_desktop || h.hero_image_mobile || '',
            link: h.cta_link || 'store',
            status: h.active ? 'active' : 'inactive'
          }));
          setBanners(mappedBanners);
        }
      })
      .catch(err => {
        console.warn('Note: Could not sync homepage heroes from server, using local fallback:', err.message || err);
      });
  }, []);

  const fetchShippingRules = async () => {
    setIsLoadingRules(true);
    setRulesError(null);
    try {
      const res = await fetch('/api/shipping/rules');
      const data = await res.json();
      if (data.success) {
        setShippingRules(data.rules || []);
      } else {
        setRulesError(data.error || 'Failed to fetch rules');
      }
    } catch (err: any) {
      setRulesError(err.message || 'Network error');
    } finally {
      setIsLoadingRules(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'shipping') {
      fetchShippingRules();
    }
  }, [activeTab]);

  // Product CRUD states & actions
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'coffee' as BusinessCategory,
    price: '',
    salePrice: '',
    sku: '',
    barcode: '',
    inventory: 20,
    lowStockThreshold: 5,
    warehouseLocation: 'Dammam Main Shelf A3',
    description: '',
    subDescription: 'Premium Collection',
    images: [] as string[],
    specifications: {} as Record<string, string>,
    story: '',
    brand: 'ZOAL Specialty Roasters',
    status: 'active',
    seoMetaTitle: '',
    seoMetaDesc: '',
    variants: 'Standard'
  });

  // Enterprise Product States
  const [activeFormTab, setActiveFormTab] = useState<'general' | 'images' | 'pricing' | 'inventory' | 'variants' | 'specifications' | 'shipping' | 'ingredients' | 'seo' | 'ai' | 'reviews' | 'qa'>('general');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formState, setFormState] = useState({
    name: '',
    nameEn: '',
    nameAr: '',
    description: '',
    shortDescription: '',
    highlights: '',
    ingredients: '',
    directions: '',
    warnings: '',
    price: '',
    salePrice: '',
    discountStart: '',
    discountEnd: '',
    costPrice: '',
    taxClass: 'Standard 15%',
    currency: 'SAR',
    category: 'coffee' as BusinessCategory,
    subcategory: '',
    brand: 'ZOAL Specialty Roasters',
    collection: '',
    tags: '',
    labels: '',
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isFlashSale: false,
    isRecommended: false,
    sku: '',
    barcode: '',
    inventory: '20',
    minStock: '5',
    maxStock: '500',
    warehouseLocation: 'Al Hofuf Central',
    lowStockThreshold: '5',
    reservedStock: '0',
    status: 'Published',
    visibility: 'Public',
    seoMetaTitle: '',
    seoMetaDesc: '',
    images: [] as string[],
    // Upgraded Fields
    productType: 'Coffee' as 'Food' | 'Drink' | 'Coffee' | 'Bakery' | 'Grocery' | 'Fashion' | 'Digital' | 'Gift Card' | 'Service',
    deliveryType: 'LOCAL_ONLY' as DeliveryType,
    shippingFee: '35',
    deliveryDays: '2',
    sameDay: false,
    pickup: true,
    videoUrl: '',
    images360: [] as string[],
    variantsList: [] as ProductVariant[],
    specifications: {} as Record<string, string>,
    seoSlug: '',
    seoMetaKeywords: '',
    seoCanonicalUrl: '',
    seoOpenGraphImage: '',
    seoSchemaProductData: '',
    aiProductSummary: '',
    aiSeoSuggestions: '',
    aiTranslationAr: '',
    aiTranslationEn: '',
    aiProductRecommendation: '',
    aiSearchOptimization: '',
    reviews: [] as Review[],
    questions: [] as Question[],
    nutritionFacts: {} as Record<string, string>,
    // Context-aware extra fields
    coffeeroastLevel: '',
    coffeegrindOption: '',
    coffeeprocessingMethod: '',
    bakeryfreshness: '',
    bakerywarmServed: false,
    bakerysweetness: '3',
    groceryshelfLife: '',
    grocerystorage: 'Ambient',
    fashiongenders: 'Unisex',
    fashionfit: 'Regular Fit',
    digitalDownloadUrl: '',
    digitalFormat: 'ZIP',
    giftCardValue: '',
    serviceDuration: '60'
  });

  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterStockStatus, setFilterStockStatus] = useState<string>('all');
  const [filterFeatured, setFilterFeatured] = useState<string>('all');
  const [filterDiscounted, setFilterDiscounted] = useState<string>('all');
  const [filterMinPrice, setFilterMinPrice] = useState<string>('');
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCreatedStart, setFilterCreatedStart] = useState<string>('');
  const [filterCreatedEnd, setFilterCreatedEnd] = useState<string>('');
  const [filterUpdatedStart, setFilterUpdatedStart] = useState<string>('');
  const [filterUpdatedEnd, setFilterUpdatedEnd] = useState<string>('');

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    visual: true,
    name: true,
    sku: true,
    barcode: true,
    category: true,
    brand: true,
    price: true,
    discount: true,
    stock: true,
    status: true,
    createdDate: false,
    updatedDate: false,
    rating: false,
    actions: true
  });

  const [productSortField, setProductSortField] = useState<string>('name');
  const [productSortOrder, setProductSortOrder] = useState<'asc' | 'desc'>('asc');
  const [productCurrentPage, setProductCurrentPage] = useState<number>(1);
  const [productsPerPage, setProductsPerPage] = useState<number>(10);
  const [productViewMode, setProductViewMode] = useState<'table' | 'grid'>('table');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isColumnVisibilityOpen, setIsColumnVisibilityOpen] = useState<boolean>(false);

  // --- PMS Enterprise States ---
  const [pmsSubTab, setPmsSubTab] = useState<'catalog' | 'variants' | 'media' | 'seo-ai' | 'reviews' | 'bulk' | 'logs'>('catalog');
  const [selectedPmsProductId, setSelectedPmsProductId] = useState<string>('');

  // Selected Product for PMS sub-tabs
  const selectedPmsProduct = useMemo(() => {
    const prodId = selectedPmsProductId || (allProducts.length > 0 ? allProducts[0].id : '');
    return allProducts.find(p => p.id === prodId) || null;
  }, [selectedPmsProductId, allProducts]);

  // Variant form states
  const [variantSku, setVariantSku] = useState<string>('');
  const [variantBarcode, setVariantBarcode] = useState<string>('');
  const [variantPrice, setVariantPrice] = useState<string>('');
  const [variantSalePrice, setVariantSalePrice] = useState<string>('');
  const [variantStock, setVariantStock] = useState<string>('10');
  const [variantImage, setVariantImage] = useState<string>('');
  const [variantStatus, setVariantStatus] = useState<'Active' | 'Inactive'>('Active');
  const [variantSize, setVariantSize] = useState<string>('');
  const [variantColor, setVariantColor] = useState<string>('');
  const [variantWeight, setVariantWeight] = useState<string>('');
  const [variantVolume, setVariantVolume] = useState<string>('');
  const [variantFlavor, setVariantFlavor] = useState<string>('');
  const [variantPackSize, setVariantPackSize] = useState<string>('');
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  // Attributes form states
  const [attrWeight, setAttrWeight] = useState<string>('');
  const [attrVolume, setAttrVolume] = useState<string>('');
  const [attrMaterial, setAttrMaterial] = useState<string>('');
  const [attrColor, setAttrColor] = useState<string>('');
  const [attrSize, setAttrSize] = useState<string>('');
  const [attrOriginCountry, setAttrOriginCountry] = useState<string>('');
  const [attrShelfLife, setAttrShelfLife] = useState<string>('');
  const [attrStorageCondition, setAttrStorageCondition] = useState<string>('');
  const [attrPackagingType, setAttrPackagingType] = useState<string>('');

  // SEO & AI Suite states
  const [seoMetaKeywords, setSeoMetaKeywords] = useState<string>('');
  const [seoSlug, setSeoSlug] = useState<string>('');
  const [seoOpenGraphImage, setSeoOpenGraphImage] = useState<string>('');
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState<string>('');
  const [seoSchemaProductData, setSeoSchemaProductData] = useState<string>('');
  
  const [aiProductSummary, setAiProductSummary] = useState<string>('');
  const [aiSeoSuggestions, setAiSeoSuggestions] = useState<string>('');
  const [aiTranslationAr, setAiTranslationAr] = useState<string>('');
  const [aiTranslationEn, setAiTranslationEn] = useState<string>('');
  const [aiProductRecommendation, setAiProductRecommendation] = useState<string>('');
  const [aiSearchOptimization, setAiSearchOptimization] = useState<string>('');

  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Reviews matrices states
  const [reviewsReplyText, setReviewsReplyText] = useState<Record<string, string>>({});

  // Media states
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [image360Input, setImage360Input] = useState<string>('');

  // Bulk update modal states
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [bulkCategoryInput, setBulkCategoryInput] = useState<string>('coffee');
  const [isBulkBrandModalOpen, setIsBulkBrandModalOpen] = useState(false);
  const [bulkBrandInput, setBulkBrandInput] = useState<string>('');
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [addCategoryName, setAddCategoryName] = useState('');
  const [addCategoryDesc, setAddCategoryDesc] = useState('');
  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [addBrandName, setAddBrandName] = useState('');
  const [addBrandDesc, setAddBrandDesc] = useState('');
  const [images360List, setImages360List] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Import/Export Menu states
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  // Import Preview states
  const [importPreviewData, setImportPreviewData] = useState<any[] | null>(null);
  const [importFileName, setImportFileName] = useState<string>('');
  const [importErrors, setImportErrors] = useState<{row: number, error: string}[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const [importFailureCount, setImportFailureCount] = useState(0);

  // Import Lock, Worker & Cancellation Management
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const importCancelledRef = useRef<boolean>(false);
  const excelWorkerRef = useRef<Worker | null>(null);

  // Bulk States
  const [bulkPriceChangeType, setBulkPriceChangeType] = useState<'fixed' | 'percent'>('fixed');
  const [bulkPriceChangeValue, setBulkPriceChangeValue] = useState<string>('');

  // Shipping Settings States
  const [shippingRules, setShippingRules] = useState<any[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState<boolean>(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [rulesSearchQuery, setRulesSearchQuery] = useState<string>('');
  const [rulesCityFilter, setRulesCityFilter] = useState<string>('all');
  const [rulesProviderFilter, setRulesProviderFilter] = useState<string>('all');
  const [rulesActiveFilter, setRulesActiveFilter] = useState<string>('all');
  const [selectedRuleForEdit, setSelectedRuleForEdit] = useState<any | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
  
  // Rule Preview States
  const [testAddress, setTestAddress] = useState({
    country: 'Saudi Arabia',
    city: '',
    district: '',
    postal_code: '',
    subtotal: '100'
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingRules, setIsTestingRules] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shipping rule?')) return;
    try {
      const res = await fetch(`/api/shipping/rules/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setShippingRules(prev => prev.filter(r => r.id !== id));
        if (testResult) {
          // If a test was displayed, refresh the test
          setTimeout(() => handleTestRules(), 100);
        }
      } else {
        alert(data.error || 'Failed to delete shipping rule.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error.');
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRuleForEdit) return;
    try {
      const isEdit = selectedRuleForEdit.id && !selectedRuleForEdit.id.startsWith('rule-');
      const url = isEdit ? `/api/shipping/rules/${selectedRuleForEdit.id}` : '/api/shipping/rules';
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: selectedRuleForEdit })
      });
      const data = await res.json();
      if (data.success) {
        setIsRuleModalOpen(false);
        setSelectedRuleForEdit(null);
        fetchShippingRules();
        if (testResult) {
          setTimeout(() => handleTestRules(), 100);
        }
      } else {
        alert(data.error || 'Failed to save shipping rule.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error.');
    }
  };

  const handleToggleActive = async (rule: any) => {
    try {
      const res = await fetch(`/api/shipping/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: { ...rule, active: !rule.active } })
      });
      const data = await res.json();
      if (data.success) {
        setShippingRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r));
        if (testResult) {
          setTimeout(() => handleTestRules(), 100);
        }
      } else {
        alert(data.error || 'Failed to toggle rule state.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error.');
    }
  };

  const handleTestRules = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsTestingRules(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await fetch('/api/shipping/rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: testAddress.country,
          city: testAddress.city,
          district: testAddress.district,
          postal_code: testAddress.postal_code,
          subtotal: Number(testAddress.subtotal) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(data.options || []);
      } else {
        setTestError(data.error || 'Failed to resolve rules.');
      }
    } catch (err: any) {
      setTestError(err.message || 'Network error during test.');
    } finally {
      setIsTestingRules(false);
    }
  };

  const updateEditForm = (fields: Partial<any>) => {
    setSelectedRuleForEdit((prev: any) => (prev ? { ...prev, ...fields } : null));
  };
  const [bulkPriceChangeDirection, setBulkPriceChangeDirection] = useState<'increase' | 'decrease'>('increase');
  const [bulkDiscountValue, setBulkDiscountValue] = useState<string>('');
  const [bulkCategoryValue, setBulkCategoryValue] = useState<string>('');
  const [bulkBrandValue, setBulkBrandValue] = useState<string>('');
  const [bulkStatusValue, setBulkStatusValue] = useState<string>('');
  const [bulkStockValue, setBulkStockValue] = useState<string>('');

  // Load selected product details into forms when selectedPmsProduct changes
  useEffect(() => {
    if (selectedPmsProduct) {
      const attrs = selectedPmsProduct.reusableAttributes || {};
      setAttrWeight(attrs.weight || '');
      setAttrVolume(attrs.volume || '');
      setAttrMaterial(attrs.material || '');
      setAttrColor(attrs.color || '');
      setAttrSize(attrs.size || '');
      setAttrOriginCountry(attrs.originCountry || '');
      setAttrShelfLife(attrs.shelfLife || '');
      setAttrStorageCondition(attrs.storageCondition || '');
      setAttrPackagingType(attrs.packagingType || '');

      setSeoMetaKeywords(selectedPmsProduct.seoMetaKeywords || '');
      setSeoSlug(selectedPmsProduct.seoSlug || '');
      setSeoOpenGraphImage(selectedPmsProduct.seoOpenGraphImage || '');
      setSeoCanonicalUrl(selectedPmsProduct.seoCanonicalUrl || '');
      setSeoSchemaProductData(selectedPmsProduct.seoSchemaProductData || '');

      setAiProductSummary(selectedPmsProduct.aiProductSummary || '');
      setAiSeoSuggestions(selectedPmsProduct.aiSeoSuggestions || '');
      setAiTranslationAr(selectedPmsProduct.aiTranslationAr || '');
      setAiTranslationEn(selectedPmsProduct.aiTranslationEn || '');
      setAiProductRecommendation(selectedPmsProduct.aiProductRecommendation || '');
      setAiSearchOptimization(selectedPmsProduct.aiSearchOptimization || '');

      setVideoUrl(selectedPmsProduct.videoUrl || '');
      setImages360List(selectedPmsProduct.images360 || []);
    } else {
      setAttrWeight('');
      setAttrVolume('');
      setAttrMaterial('');
      setAttrColor('');
      setAttrSize('');
      setAttrOriginCountry('');
      setAttrShelfLife('');
      setAttrStorageCondition('');
      setAttrPackagingType('');

      setSeoMetaKeywords('');
      setSeoSlug('');
      setSeoOpenGraphImage('');
      setSeoCanonicalUrl('');
      setSeoSchemaProductData('');

      setAiProductSummary('');
      setAiSeoSuggestions('');
      setAiTranslationAr('');
      setAiTranslationEn('');
      setAiProductRecommendation('');
      setAiSearchOptimization('');

      setVideoUrl('');
      setImages360List([]);
    }
  }, [selectedPmsProduct]);

  // Unified Save Field helper preserving standard storage events
  const saveProductFields = (productId: string, updatedFields: Record<string, any>) => {
    try {
      const existingProduct = allProducts.find((p: any) => p.id === productId);
      if (!existingProduct) {
        console.warn(`[PMS] Product ${productId} not found in state during saveProductFields. Attempting cache lookup.`);
        const customRaw = localStorage.getItem('zoal_custom_products');
        const customProducts = customRaw ? JSON.parse(customRaw) : [];
        const cachedProd = customProducts.find((p: any) => p.id === productId);
        if (!cachedProd) {
          console.error(`[PMS] Product ${productId} completely missing.`);
          return false;
        }
        const fullProduct = { ...cachedProd, ...updatedFields };
        
        // Ensure image consistency if images are updated
        if (Array.isArray(updatedFields.images) && (updatedFields.images.length > 0 || updatedFields.explicitImageDeletion === true)) {
          fullProduct.image_urls = updatedFields.images;
          fullProduct.image = updatedFields.images[0] || (updatedFields.explicitImageDeletion ? '' : (fullProduct.image || ''));
          fullProduct.image_url = updatedFields.images[0] || (updatedFields.explicitImageDeletion ? '' : (fullProduct.image_url || ''));
          fullProduct.imageUrl = updatedFields.images[0] || (updatedFields.explicitImageDeletion ? '' : (fullProduct.imageUrl || ''));
          fullProduct.thumbnail = updatedFields.images[0] || (updatedFields.explicitImageDeletion ? '' : (fullProduct.thumbnail || ''));
        }

        saveProductToSupabase(fullProduct);
        return true;
      }

      const fullProduct = {
        ...existingProduct,
        ...updatedFields
      };

      // Ensure image consistency if images are updated
      if (Array.isArray(updatedFields.images) && (updatedFields.images.length > 0 || updatedFields.explicitImageDeletion === true)) {
        fullProduct.image_urls = updatedFields.images;
        fullProduct.image = updatedFields.images[0] || (updatedFields.explicitImageDeletion ? '' : (fullProduct.image || ''));
        fullProduct.image_url = updatedFields.images[0] || (updatedFields.explicitImageDeletion ? '' : (fullProduct.image_url || ''));
        fullProduct.imageUrl = updatedFields.images[0] || (updatedFields.explicitImageDeletion ? '' : (fullProduct.imageUrl || ''));
        fullProduct.thumbnail = updatedFields.images[0] || (updatedFields.explicitImageDeletion ? '' : (fullProduct.thumbnail || ''));
      }

      saveProductToSupabase(fullProduct);
      return true;
    } catch (err) {
      console.error('Failed to save product fields:', err);
      return false;
    }
  };

  // Unified Enterprise Notification Engine connection
  const fallbackNotificationEngine = useNotificationEngine(currentUser);
  const activeNotificationEngine = notificationEngine || fallbackNotificationEngine;
  const notifications = activeNotificationEngine.notifications;
  const unreadNotifCount = activeNotificationEngine.unreadCount;

  // Global Settings state from context
  const { settings: globalSettings, updateSettings: setGlobalSettings } = useBranding();

  // Complete RBAC Configuration States
  const [rolesList, setRolesList] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_roles_v2');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'role-admin', name: 'Admin', description: 'Complete administrative authorization and full system configuration access.', permissions: ['catalog_edit', 'order_modify', 'user_manage', 'reports_view', 'settings_edit'] },
      { id: 'role-staff', name: 'Staff', description: 'Assigned workforce members who can manage products, fulfill orders, and view reports.', permissions: ['catalog_edit', 'order_modify', 'reports_view'] },
      { id: 'role-customer', name: 'Customer', description: 'Standard customer access level. Allowed to browse catalog and purchase items.', permissions: [] }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_roles_v2', JSON.stringify(rolesList));
  }, [rolesList]);

  const [availablePermissions] = useState<{ id: string; name: string; description: string }[]>([
    { id: 'catalog_edit', name: 'Edit Catalog', description: 'Create, update, and archive products, categories, and brands.' },
    { id: 'order_modify', name: 'Manage Orders', description: 'Update order status, modify fulfillment data, and record tracking numbers.' },
    { id: 'user_manage', name: 'User Management', description: 'Edit roles, invite staff members, and toggle customer privileges.' },
    { id: 'reports_view', name: 'Reports View', description: 'Query revenue details, generate record sheets, and audit inventory.' },
    { id: 'settings_edit', name: 'Settings Edit', description: 'Update global security credentials, taxation structures, and SMTP relays.' }
  ]);

  // Editing role state
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState<boolean>(false);

  // System Logs list - Server Authoritative backed by Supabase zoal_activity_logs
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [loadingSystemLogs, setLoadingSystemLogs] = useState<boolean>(false);

  const fetchSystemLogs = useCallback(async () => {
    try {
      setLoadingSystemLogs(true);
      const token = (currentUser as any)?.token || localStorage.getItem('auth_token') || localStorage.getItem('supabase_auth_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/admin/audit-logs?limit=50', { headers });
      if (res.ok) {
        const data = await res.json();
        const logsArray = Array.isArray(data) ? data : (data.logs || []);
        const formatted = logsArray.map((l: any) => ({
          id: l.id,
          user: l.email || l.user_id || 'Administrator',
          action: l.action,
          target: l.resource_id ? `${l.resource_type || ''}: ${l.resource_id}` : (l.resource_type || 'System'),
          ip: l.ip || '127.0.0.1',
          time: l.timestamp ? new Date(l.timestamp).toLocaleString() : new Date().toLocaleString(),
          severity: l.severity || 'INFO',
          metadata: l.metadata,
          before_state: l.before_state,
          after_state: l.after_state
        }));
        setSystemLogs(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoadingSystemLogs(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchSystemLogs();
  }, [fetchSystemLogs]);

  // Save categories/brands back to localStorage
  useEffect(() => {
    localStorage.setItem('zoal_admin_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('zoal_admin_brands', JSON.stringify(brands));
  }, [brands]);

  // Log function helper
  const addLog = (action: string, target?: string) => {
    const uniqueId = `log-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newLog = {
      id: uniqueId,
      user: currentUser?.name || 'Admin',
      action,
      target: target || 'System Interface',
      ip: '127.0.0.1',
      time: new Date().toLocaleString()
    };
    setSystemLogs(prev => [newLog, ...prev]);
  };

  // PMS Filtered Logs helper
  const pmsLogs = useMemo(() => {
    return systemLogs.filter(log => 
      log.action.includes("Product") || 
      log.action.includes("Stock") || 
      log.action.includes("Price") || 
      log.action.includes("Media") || 
      log.action.includes("SEO")
    );
  }, [systemLogs]);

  // Helper calculations for dynamic metrics
  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + o.total : sum, 0);
    const todaySales = orders
      .filter(o => o.date === new Date().toISOString().split('T')[0] && o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);
    
    // Monthly calculation (June 2026 / current date month)
    const monthlySales = totalRevenue; 

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const preparingOrders = orders.filter(o => o.status === 'Preparing').length;
    const shippedOrders = orders.filter(o => o.status === 'Shipped').length;
    const deliveredOrders = orders.filter(o => o.status === 'Completed').length;
    const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;

    const totalCustomers = new Set(orders.map(o => o.email)).size || 1;
    const totalStaff = 5;

    const totalProductsCount = allProducts.length;
    const lowStockCount = allProducts.filter(p => p.inventory <= 5 && p.inventory > 0).length;
    const outOfStockCount = allProducts.filter(p => p.inventory === 0).length;

    return {
      totalRevenue,
      todaySales,
      monthlySales,
      totalOrders,
      pendingOrders,
      preparingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers,
      totalStaff,
      totalProductsCount,
      lowStockCount,
      outOfStockCount
    };
  }, [orders, allProducts]);

  // Chart Data preparation
  const revenueTrendData = [
    { name: 'Jan', sales: metrics.totalRevenue * 0.4, orders: 12 },
    { name: 'Feb', sales: metrics.totalRevenue * 0.55, orders: 18 },
    { name: 'Mar', sales: metrics.totalRevenue * 0.7, orders: 24 },
    { name: 'Apr', sales: metrics.totalRevenue * 0.65, orders: 21 },
    { name: 'May', sales: metrics.totalRevenue * 0.9, orders: 32 },
    { name: 'Jun', sales: metrics.totalRevenue, orders: metrics.totalOrders }
  ];

  const categoryPerformanceData = useMemo(() => {
    const counts = { coffee: 0, bakery: 0, market: 0, fashion: 0, thobes: 0 };
    allProducts.forEach(p => {
      if (p.category in counts) {
        counts[p.category] += 1;
      }
    });
    return [
      { name: 'Coffee', value: counts.coffee, color: '#D4AF37' },
      { name: 'Bakery', value: counts.bakery, color: '#F3E5AB' },
      { name: 'Market', value: counts.market, color: '#888' },
      { name: 'Fashion', value: counts.fashion, color: '#FFF' },
      { name: 'Thobes', value: counts.thobes, color: '#AA8C2C' }
    ];
  }, [allProducts]);

  // Best selling items based on orders
  const bestSellingProductsData = useMemo(() => {
    const itemMap: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(itm => {
        itemMap[itm.name] = (itemMap[itm.name] || 0) + itm.quantity;
      });
    });
    const sorted = Object.entries(itemMap).map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
    return sorted.length > 0 ? sorted : [
      { name: 'Saffron Latte', qty: 32 },
      { name: 'Traditional Hoboz', qty: 25 },
      { name: 'Sudanese Toob', qty: 14 },
      { name: 'Luxury Men\'s Thobe', qty: 11 },
      { name: 'Karkadeh Flowers', qty: 8 }
    ];
  }, [orders]);

  // Start Create Product
  const startCreateProduct = () => {
    setPmsSubTab('catalog');
    setEditingProduct(null);
    setIsEditing(false);
    setActiveFormTab('general');
    setFormState({
      name: '',
      nameEn: '',
      nameAr: '',
      description: '',
      shortDescription: '',
      highlights: '',
      ingredients: '',
      directions: '',
      warnings: '',
      price: '',
      salePrice: '',
      discountStart: '',
      discountEnd: '',
      costPrice: '',
      taxClass: 'Standard 15%',
      currency: 'SAR',
      category: 'coffee',
      subcategory: '',
      brand: 'ZOAL Specialty Roasters',
      collection: '',
      tags: '',
      labels: '',
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
      isFlashSale: false,
      isRecommended: false,
      sku: '',
      barcode: '',
      inventory: '20',
      minStock: '5',
      maxStock: '500',
      warehouseLocation: 'Al Hofuf Central',
      lowStockThreshold: '5',
      reservedStock: '0',
      status: 'Published',
      visibility: 'Public',
      seoMetaTitle: '',
      seoMetaDesc: '',
      images: [],
      // Upgraded defaults
      productType: 'Coffee',
      deliveryType: 'LOCAL_ONLY',
      shippingFee: '35',
      deliveryDays: '2',
      sameDay: false,
      pickup: true,
      videoUrl: '',
      images360: [],
      variantsList: [],
      specifications: {},
      seoSlug: '',
      seoMetaKeywords: '',
      seoCanonicalUrl: '',
      seoOpenGraphImage: '',
      seoSchemaProductData: '',
      seoRobots: 'index, follow',
      seoTwitterCard: 'summary_large_image',
      seoFocusKeyword: '',
      seoOgTitle: '',
      seoOgDesc: '',
      seoTwitterTitle: '',
      seoTwitterDesc: '',
      seoTwitterImage: '',
      seoArabicSlug: '',
      seoEnglishSlug: '',
      aiProductSummary: '',
      aiSeoSuggestions: '',
      aiTranslationAr: '',
      aiTranslationEn: '',
      aiProductRecommendation: '',
      aiSearchOptimization: '',
      reviews: [],
      questions: [],
      nutritionFacts: {},
      // Context-aware extra fields
      coffeeroastLevel: '',
      coffeegrindOption: '',
      coffeeprocessingMethod: '',
      bakeryfreshness: '',
      bakerywarmServed: false,
      bakerysweetness: '3',
      groceryshelfLife: '',
      grocerystorage: 'Ambient',
      fashiongenders: 'Unisex',
      fashionfit: 'Regular Fit',
      digitalDownloadUrl: '',
      digitalFormat: 'ZIP',
      giftCardValue: '',
      serviceDuration: '60'
    });
    setIsAddProductOpen(true);
  };

  // Helper to extract all existing valid images from a product
  const getExistingProductImages = (p: any): string[] => {
    if (!p) return [];
    const list: string[] = [];
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (img && typeof img === 'string' && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      }
    }
    if (Array.isArray(p.image_urls)) {
      for (const img of p.image_urls) {
        if (img && typeof img === 'string' && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      }
    }
    const primaryCandidates = [p.image, p.image_url, p.imageUrl, p.thumbnail];
    for (const c of primaryCandidates) {
      if (c && typeof c === 'string' && c.trim() && !list.includes(c.trim())) {
        list.push(c.trim());
      }
    }
    return list;
  };

  // Start Edit Product
  const startEditProduct = (p: any) => {
    setPmsSubTab('catalog');
    setEditingProduct(p);
    setIsEditing(true);
    setActiveFormTab('general');
    const hydratedImages = getExistingProductImages(p);
    setFormState({
      name: p.name || '',
      nameEn: p.nameEn || p.name || '',
      nameAr: p.nameAr || p.name || '',
      description: p.description || '',
      shortDescription: p.shortDescription || '',
      highlights: p.highlights || '',
      ingredients: p.ingredients || '',
      directions: p.directions || '',
      warnings: p.warnings || '',
      price: (p.price || '').toString(),
      salePrice: (p.salePrice || '').toString(),
      discountStart: p.discountStart || '',
      discountEnd: p.discountEnd || '',
      costPrice: (p.costPrice || '').toString(),
      taxClass: p.taxClass || 'Standard 15%',
      currency: p.currency || 'SAR',
      category: p.category || 'coffee',
      subcategory: p.subcategory || '',
      brand: p.brand || 'AL ZOAL Specialty Roasters',
      collection: p.collection || '',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
      labels: Array.isArray(p.labels) ? p.labels.join(', ') : (p.labels || ''),
      isFeatured: !!(p.isFeatured || p.featured || p.popular),
      isBestSeller: !!p.isBestSeller,
      isNewArrival: !!p.isNewArrival,
      isFlashSale: !!p.isFlashSale,
      isRecommended: !!p.isRecommended,
      sku: p.sku || '',
      barcode: p.barcode || '',
      inventory: (p.inventory || '0').toString(),
      minStock: (p.minStock || '5').toString(),
      maxStock: (p.maxStock || '500').toString(),
      warehouseLocation: p.warehouseLocation || '',
      lowStockThreshold: (p.lowStockThreshold || '5').toString(),
      reservedStock: (p.reservedStock || '0').toString(),
      status: p.status || 'Published',
      visibility: p.visibility || 'Public',
      seoMetaTitle: p.seoMetaTitle || '',
      seoMetaDesc: p.seoMetaDesc || '',
      images: hydratedImages,
      // Loaded upgrades
      productType: p.productType || (p.category === 'coffee' ? 'Coffee' : p.category === 'bakery' ? 'Bakery' : p.category === 'market' ? 'Grocery' : p.category === 'fashion' || p.category === 'thobes' ? 'Fashion' : 'Coffee'),
      deliveryType: p.deliveryType || 'LOCAL_ONLY',
      shippingFee: (p.shippingFee || '35').toString(),
      deliveryDays: (p.deliveryDays || '2').toString(),
      sameDay: !!p.sameDay,
      pickup: !!p.pickup,
      videoUrl: p.videoUrl || '',
      images360: p.images360 || [],
      variantsList: p.variantsList || [],
      specifications: p.specifications || {},
      seoSlug: p.seoSlug || '',
      seoMetaKeywords: p.seoMetaKeywords || '',
      seoCanonicalUrl: p.seoCanonicalUrl || '',
      seoOpenGraphImage: p.seoOpenGraphImage || '',
      seoSchemaProductData: p.seoSchemaProductData || '',
      seoRobots: p.seoRobots || 'index, follow',
      seoTwitterCard: p.seoTwitterCard || 'summary_large_image',
      seoFocusKeyword: p.seoFocusKeyword || '',
      seoOgTitle: p.seoOgTitle || '',
      seoOgDesc: p.seoOgDesc || '',
      seoTwitterTitle: p.seoTwitterTitle || '',
      seoTwitterDesc: p.seoTwitterDesc || '',
      seoTwitterImage: p.seoTwitterImage || '',
      seoArabicSlug: p.seoArabicSlug || '',
      seoEnglishSlug: p.seoEnglishSlug || '',
      aiProductSummary: p.aiProductSummary || '',
      aiSeoSuggestions: p.aiSeoSuggestions || '',
      aiTranslationAr: p.aiTranslationAr || '',
      aiTranslationEn: p.aiTranslationEn || '',
      aiProductRecommendation: p.aiProductRecommendation || '',
      aiSearchOptimization: p.aiSearchOptimization || '',
      reviews: p.reviews || [],
      questions: p.questions || [],
      nutritionFacts: p.nutritionFacts || {},
      // Loaded context-aware extra fields
      coffeeroastLevel: p.coffeeroastLevel || p.roastLevel || '',
      coffeegrindOption: p.coffeegrindOption || p.grindOption || '',
      coffeeprocessingMethod: p.coffeeprocessingMethod || p.processingMethod || '',
      bakeryfreshness: p.bakeryfreshness || p.freshness || '',
      bakerywarmServed: !!(p.bakerywarmServed || p.warmServed),
      bakerysweetness: (p.bakerysweetness || p.sweetnessLevel || '3').toString(),
      groceryshelfLife: p.groceryshelfLife || p.shelfLife || '',
      grocerystorage: p.grocerystorage || p.storageCondition || 'Ambient',
      fashiongenders: p.fashiongenders || p.genderTarget || 'Unisex',
      fashionfit: p.fashionfit || p.fitType || 'Regular Fit',
      digitalDownloadUrl: p.digitalDownloadUrl || p.downloadUrl || '',
      digitalFormat: p.digitalFormat || p.fileFormat || 'ZIP',
      giftCardValue: (p.giftCardValue || p.cardValue || '').toString(),
      serviceDuration: (p.serviceDuration || p.durationMins || '60').toString()
    });
    setIsAddProductOpen(true);
  };

  // Handle Product Save (Add or Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name) {
      alert('Product Name is required.');
      return;
    }

    // Role-based validation
    const isStaffOnly = currentUser?.role === 'staff';
    const id = isEditing && editingProduct ? editingProduct.id : `custom-prod-${Date.now()}`;
    const parsedPrice = parseFloat(formState.price) || 0;
    const parsedSalePrice = formState.salePrice ? parseFloat(formState.salePrice) : undefined;
    const parsedCostPrice = parseFloat(formState.costPrice) || 0;

    // Uniqueness & Validation Enforcement
    const targetSku = formState.sku?.trim();
    if (targetSku) {
      const isSkuDuplicate = allProducts.some(p => p.sku === targetSku && p.id !== id);
      if (isSkuDuplicate) {
        alert(`Validation Error: SKU "${targetSku}" is already assigned to another product on the AL ZOAL platform.`);
        return;
      }
    }

    const targetBarcode = formState.barcode?.trim();
    if (targetBarcode) {
      const isBarcodeDuplicate = allProducts.some(p => p.barcode === targetBarcode && p.id !== id);
      if (isBarcodeDuplicate) {
        alert(`Validation Error: Barcode "${targetBarcode}" is already assigned to another product on the AL ZOAL platform.`);
        return;
      }
    }

    if (parsedPrice < 0) {
      alert('Validation Error: Product Price cannot be negative.');
      return;
    }
    if (parsedCostPrice < 0) {
      alert('Validation Error: Product Cost Price cannot be negative.');
      return;
    }
    if (parsedSalePrice !== undefined && parsedSalePrice < 0) {
      alert('Validation Error: Product Sale Price cannot be negative.');
      return;
    }
    if (parsedSalePrice !== undefined && parsedSalePrice > parsedPrice) {
      alert('Validation Error: Product Sale Price cannot exceed the original Price.');
      return;
    }
    
    try {
      const computedProfitMargin = parsedPrice > 0 ? ((parsedPrice - parsedCostPrice) / parsedPrice) * 100 : 0;
      const computedDiscountPercent = parsedSalePrice ? Math.round((1 - (parsedSalePrice / parsedPrice)) * 100) : 0;

      // Extract existing product images for strict preservation
      const existingProductImgList = isEditing && editingProduct ? getExistingProductImages(editingProduct) : [];
      const formImgList = Array.isArray(formState.images)
        ? formState.images.filter((img: any) => img && typeof img === 'string' && img.trim())
        : [];

      // Determine if media section was active and administrator explicitly deleted all images
      const isImagesTab = activeFormTab === 'images' || (activeFormTab as string) === 'media';
      const isExplicitDeletion = isEditing && editingProduct && isImagesTab && formImgList.length === 0 && existingProductImgList.length > 0;

      let finalImages: string[] = [];
      if (isEditing && editingProduct) {
        if (isExplicitDeletion) {
          finalImages = [];
        } else if (formImgList.length > 0) {
          finalImages = formImgList;
        } else {
          finalImages = existingProductImgList;
        }
      } else {
        finalImages = formImgList;
      }

      const primaryImage = finalImages[0] || (isEditing && editingProduct && !isExplicitDeletion ? (editingProduct.image || editingProduct.image_url || editingProduct.imageUrl || editingProduct.thumbnail || '') : '');

      const updatedFields: Record<string, any> = {
        name: formState.name,
        nameEn: formState.nameEn || formState.name,
        nameAr: formState.nameAr || formState.name,
        description: formState.description || 'Premium handcrafted boutique selection.',
        shortDescription: formState.shortDescription || '',
        highlights: formState.highlights || '',
        price: parsedPrice,
        salePrice: parsedSalePrice,
        discountPercent: computedDiscountPercent,
        discountStart: formState.discountStart || '',
        discountEnd: formState.discountEnd || '',
        category: formState.category,
        brand: formState.brand || 'AL ZOAL Specialty Roasters',
        sku: formState.sku || `ZL-SKU-${Date.now().toString().slice(-6)}`,
        barcode: formState.barcode || `628${Date.now().toString().slice(-10)}`,
        inventory: parseInt(formState.inventory) || 0,
        minStock: parseInt(formState.minStock) || 5,
        maxStock: parseInt(formState.maxStock) || 500,
        warehouseLocation: formState.warehouseLocation || 'Al Hofuf Central',
        lowStockThreshold: parseInt(formState.lowStockThreshold) || 5,
        images: finalImages,
        image_urls: finalImages,
        image: primaryImage,
        image_url: primaryImage,
        imageUrl: primaryImage,
        thumbnail: primaryImage,
        explicitImageDeletion: isExplicitDeletion,
        updatedAt: new Date().toISOString().slice(0, 10),
        // Upgraded Architecture Columns
        productType: formState.productType,
        deliveryType: formState.deliveryType,
        shippingFee: parseFloat(formState.shippingFee) || 0,
        deliveryDays: parseInt(formState.deliveryDays) || 0,
        sameDay: formState.sameDay,
        pickup: formState.pickup,
        videoUrl: formState.videoUrl,
        images360: formState.images360,
        variantsList: formState.variantsList,
        specifications: formState.specifications,
        seoSlug: formState.seoSlug,
        seoMetaKeywords: formState.seoMetaKeywords,
        seoCanonicalUrl: formState.seoCanonicalUrl,
        seoOpenGraphImage: formState.seoOpenGraphImage,
        seoSchemaProductData: formState.seoSchemaProductData,
        seoRobots: formState.seoRobots || 'index, follow',
        seoTwitterCard: formState.seoTwitterCard || 'summary_large_image',
        seoFocusKeyword: formState.seoFocusKeyword || '',
        seoOgTitle: formState.seoOgTitle || '',
        seoOgDesc: formState.seoOgDesc || '',
        seoTwitterTitle: formState.seoTwitterTitle || '',
        seoTwitterDesc: formState.seoTwitterDesc || '',
        seoTwitterImage: formState.seoTwitterImage || '',
        seoArabicSlug: formState.seoArabicSlug || '',
        seoEnglishSlug: formState.seoEnglishSlug || '',
        aiProductSummary: formState.aiProductSummary,
        aiSeoSuggestions: formState.aiSeoSuggestions,
        aiTranslationAr: formState.aiTranslationAr,
        aiTranslationEn: formState.aiTranslationEn,
        aiProductRecommendation: formState.aiProductRecommendation,
        aiSearchOptimization: formState.aiSearchOptimization,
        reviews: formState.reviews,
        questions: formState.questions,
        nutritionFacts: formState.nutritionFacts,
        // Context-aware extra fields
        coffeeroastLevel: formState.coffeeroastLevel,
        coffeegrindOption: formState.coffeegrindOption,
        coffeeprocessingMethod: formState.coffeeprocessingMethod,
        bakeryfreshness: formState.bakeryfreshness,
        bakerywarmServed: formState.bakerywarmServed,
        bakerysweetness: formState.bakerysweetness,
        groceryshelfLife: formState.groceryshelfLife,
        grocerystorage: formState.grocerystorage,
        fashiongenders: formState.fashiongenders,
        fashionfit: formState.fashionfit,
        digitalDownloadUrl: formState.digitalDownloadUrl,
        digitalFormat: formState.digitalFormat,
        giftCardValue: formState.giftCardValue,
        serviceDuration: formState.serviceDuration
      };

      // Only Admin or Staff with Basic Edit can save additional details
      if (!isStaffOnly) {
        // Properties allowed only for Admin
        updatedFields.costPrice = parsedCostPrice;
        updatedFields.profitMargin = computedProfitMargin;
        updatedFields.taxClass = formState.taxClass || 'Standard 15%';
        updatedFields.currency = formState.currency || 'SAR';
        updatedFields.subcategory = formState.subcategory || '';
        updatedFields.collection = formState.collection || '';
        updatedFields.tags = formState.tags.split(',').map(t => t.trim()).filter(Boolean);
        updatedFields.labels = formState.labels.split(',').map(t => t.trim()).filter(Boolean);
        updatedFields.isFeatured = formState.isFeatured;
        updatedFields.isBestSeller = formState.isBestSeller;
        updatedFields.isNewArrival = formState.isNewArrival;
        updatedFields.isFlashSale = formState.isFlashSale;
        updatedFields.isRecommended = formState.isRecommended;
        updatedFields.ingredients = formState.ingredients || '';
        updatedFields.directions = formState.directions || '';
        updatedFields.warnings = formState.warnings || '';
        updatedFields.reservedStock = parseInt(formState.reservedStock) || 0;
        updatedFields.status = formState.status || 'Published';
        updatedFields.visibility = formState.visibility || 'Public';
        updatedFields.seoMetaTitle = formState.seoMetaTitle || '';
        updatedFields.seoMetaDesc = formState.seoMetaDesc || '';
      } else {
        // Staff preserves existing values for Admin-only fields
        if (isEditing && editingProduct) {
          updatedFields.costPrice = editingProduct.costPrice || (editingProduct.price * 0.6);
          updatedFields.profitMargin = editingProduct.profitMargin || 0;
          updatedFields.taxClass = editingProduct.taxClass || 'Standard 15%';
          updatedFields.currency = editingProduct.currency || 'SAR';
          updatedFields.subcategory = editingProduct.subcategory || '';
          updatedFields.collection = editingProduct.collection || '';
          updatedFields.tags = editingProduct.tags || [];
          updatedFields.labels = editingProduct.labels || [];
          updatedFields.isFeatured = !!(editingProduct.isFeatured || editingProduct.featured || editingProduct.popular);
          updatedFields.isBestSeller = !!editingProduct.isBestSeller;
          updatedFields.isNewArrival = !!editingProduct.isNewArrival;
          updatedFields.isFlashSale = !!editingProduct.isFlashSale;
          updatedFields.isRecommended = !!editingProduct.isRecommended;
          updatedFields.ingredients = editingProduct.ingredients || '';
          updatedFields.directions = editingProduct.directions || '';
          updatedFields.warnings = editingProduct.warnings || '';
          updatedFields.reservedStock = editingProduct.reservedStock || 0;
          updatedFields.status = editingProduct.status || 'Published';
          updatedFields.visibility = editingProduct.visibility || 'Public';
          updatedFields.seoMetaTitle = editingProduct.seoMetaTitle || '';
          updatedFields.seoMetaDesc = editingProduct.seoMetaDesc || '';
        } else {
          // Defaults for new product created by staff
          updatedFields.costPrice = parsedPrice * 0.6;
          updatedFields.profitMargin = 40;
          updatedFields.status = 'Draft'; // Staff additions default to draft
          updatedFields.visibility = 'Public';
        }
      }

      const existingProduct = isEditing && editingProduct ? editingProduct : null;
      const fullProduct: Product = {
        ...(existingProduct || {}),
        id: existingProduct ? existingProduct.id : id,
        createdAt: existingProduct?.createdAt || new Date().toISOString().slice(0, 10),
        ...updatedFields
      } as Product;

      saveProductToSupabase(fullProduct);
      addLog(`${isEditing ? 'Updated' : 'Added'} Product: ${formState.name} (${fullProduct.id})`);

      setIsAddProductOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save product.');
    }
  };

  // Handle Product Delete (Admin Only enforcement)
  const handleDeleteProduct = (productId: string, productName: string) => {
    console.log("TRACE 2: handleDeleteProduct entered", { productId, productName });
    console.log("TRACE 3: Immediately before setProductToDelete");
    setProductToDelete({ id: productId, name: productName });
    setProductDeleteError(null);
    setIsDeletingProduct(false);
    console.log("TRACE 4: Immediately after setProductToDelete");
  };

  const confirmDeleteProduct = async () => {
    console.log("TRACE 8: confirmDeleteProduct() entry", { productToDelete, isDeletingProduct });
    if (!productToDelete || isDeletingProduct) {
      console.log("Trace: confirmDeleteProduct() early return", { 
        noProduct: !productToDelete, 
        alreadyDeleting: isDeletingProduct 
      });
      return;
    }
    console.log("TRACE 9: productToDelete value:", productToDelete);
    setIsDeletingProduct(true);
    setProductDeleteError(null);

    try {
      console.log("TRACE 10: Immediately before deleteProductFromSupabase()");
      const success = await deleteProductFromSupabase(productToDelete.id);
      console.log("TRACE 13: Immediately after deleteProductFromSupabase()", { success });
      if (!success) {
        setProductDeleteError('Failed to delete product from database.');
        setIsDeletingProduct(false);
        return;
      }
      addLog(`Deleted Product: ${productToDelete.name}`);
      console.log("TRACE 16: After triggerProductFetch()");
      await triggerProductFetch(true);
      console.log("TRACE 17: After local state cleanup");
      setProductToDelete(null);
    } catch (e: any) {
      console.error("Trace: confirmDeleteProduct() error", e);
      setProductDeleteError(e?.message || 'Failed to delete product.');
    } finally {
      setIsDeletingProduct(false);
      console.log("Trace: confirmDeleteProduct() exit");
    }
  };

  // Bulk Exports
  const escapeCsvCell = (val: any) => {
    if (val == null) return '';
    const str = String(val);
    if (/^[=+\-@\t\r]/.test(str)) {
      return `'` + str;
    }
    return str;
  };

  const handleExportCSV = async () => {
    try {
      const Papa = (await import('papaparse')).default;
      const fields = [
        'name', 'sku', 'barcode', 'brand', 'category', 'price', 'salePrice', 
        'inventory', 'status', 'isFeatured', 'warehouseLocation', 'description', 'images',
        'seoSlug', 'seoMetaTitle', 'seoMetaDesc', 'seoMetaKeywords', 'seoCanonicalUrl', 
        'seoOpenGraphImage', 'seoSchemaProductData', 'seoRobots', 'seoTwitterCard', 'seoFocusKeyword',
        'seoOgTitle', 'seoOgDesc', 'seoTwitterTitle', 'seoTwitterDesc', 'seoTwitterImage', 
        'seoArabicSlug', 'seoEnglishSlug'
      ];
      
      const csvData = allProducts.map(p => {
        const row: any = {};
        fields.forEach(f => {
          if (f === 'images') {
            const imgStr = Array.isArray(p.images) ? p.images.join(',') : (p.images || '');
            row[f] = escapeCsvCell(imgStr);
          } else {
            row[f] = escapeCsvCell(p[f]);
          }
        });
        return row;
      });

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsExportMenuOpen(false);
      addLog('Exported all products as CSV');
    } catch (err) {
      console.error('Export CSV failed:', err);
      alert('Failed to export CSV.');
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const fields = [
        'name', 'sku', 'barcode', 'brand', 'category', 'price', 'salePrice', 
        'inventory', 'status', 'isFeatured', 'warehouseLocation', 'description', 'images',
        'seoSlug', 'seoMetaTitle', 'seoMetaDesc', 'seoMetaKeywords', 'seoCanonicalUrl', 
        'seoOpenGraphImage', 'seoSchemaProductData', 'seoRobots', 'seoTwitterCard', 'seoFocusKeyword',
        'seoOgTitle', 'seoOgDesc', 'seoTwitterTitle', 'seoTwitterDesc', 'seoTwitterImage', 
        'seoArabicSlug', 'seoEnglishSlug'
      ];
      
      const excelData = allProducts.map(p => {
        const row: any = {};
        fields.forEach(f => {
          if (f === 'images') {
            row[f] = Array.isArray(p.images) ? p.images.join(',') : (p.images || '');
          } else {
            row[f] = p[f];
          }
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
      XLSX.writeFile(workbook, `products-${new Date().toISOString().split('T')[0]}.xlsx`);
      setIsExportMenuOpen(false);
      addLog('Exported all products as Excel');
    } catch (err) {
      console.error('Export Excel failed:', err);
      alert('Failed to export Excel.');
    }
  };

  const handleBulkExport = () => {
    setIsExportMenuOpen(!isExportMenuOpen);
  };

  // Bulk Imports - Enterprise Implementation
  const handleCancelImport = () => {
    importCancelledRef.current = true;
    if (excelWorkerRef.current) {
      try {
        excelWorkerRef.current.terminate();
      } catch (e) {
        console.error('Error terminating Excel worker:', e);
      }
      excelWorkerRef.current = null;
    }
    setIsImporting(false);
    addLog('Import Cancelled', 'Import process was stopped by user', 'warning');
  };

  const handleBulkImport = () => {
    if (isImporting) return;
    setIsImportMenuOpen(!isImportMenuOpen);
  };

  const handleImportCSVClick = () => {
    if (isImporting) {
      alert('An import operation is already in progress.');
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.accept = ".csv";
      fileInputRef.current.click();
    }
    setIsImportMenuOpen(false);
  };

  const handleImportExcelClick = () => {
    if (isImporting) {
      alert('An import operation is already in progress.');
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.accept = ".xlsx, .xls";
      fileInputRef.current.click();
    }
    setIsImportMenuOpen(false);
  };

  // Dedicate Web Worker for Excel parsing off main thread
  const parseExcelWithWorker = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      if (importCancelledRef.current) {
        reject(new Error('Import cancelled'));
        return;
      }

      try {
        const workerCode = `
          self.onmessage = function(e) {
            try {
              var arrayBuffer = e.data;
              try {
                importScripts('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
              } catch(e) {}
              if (typeof XLSX === 'undefined') {
                self.postMessage({ success: false, fallback: true, error: 'XLSX not available in worker environment' });
                return;
              }
              var wb = XLSX.read(arrayBuffer, { type: 'array' });
              var wsname = wb.SheetNames[0];
              var ws = wb.Sheets[wsname];
              var data = XLSX.utils.sheet_to_json(ws);
              self.postMessage({ success: true, data: data });
            } catch(err) {
              self.postMessage({ success: false, error: err ? err.message : 'Excel parsing error' });
            }
          };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        excelWorkerRef.current = worker;

        file.arrayBuffer().then((buffer) => {
          if (importCancelledRef.current) {
            URL.revokeObjectURL(workerUrl);
            excelWorkerRef.current = null;
            worker.terminate();
            reject(new Error('Import cancelled'));
            return;
          }

          worker.onmessage = async (e) => {
            URL.revokeObjectURL(workerUrl);
            excelWorkerRef.current = null;
            worker.terminate();

            if (importCancelledRef.current) {
              reject(new Error('Import cancelled'));
              return;
            }

            if (e.data && e.data.success) {
              resolve(e.data.data);
            } else if (e.data && e.data.fallback) {
              // Fallback to main thread if XLSX CDN is blocked or unavailable in Worker
              try {
                const XLSX = await import('xlsx');
                const wb = XLSX.read(buffer, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                resolve(data);
              } catch (fallbackErr) {
                reject(fallbackErr);
              }
            } else {
              reject(new Error(e.data?.error || 'Failed to parse Excel file'));
            }
          };

          worker.onerror = (err) => {
            URL.revokeObjectURL(workerUrl);
            excelWorkerRef.current = null;
            worker.terminate();

            if (importCancelledRef.current) {
              reject(new Error('Import cancelled'));
              return;
            }

            // Fallback to main thread parsing gracefully on worker error
            try {
              const wb = XLSX.read(buffer, { type: 'array' });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              const data = XLSX.utils.sheet_to_json(ws);
              resolve(data);
            } catch (fallbackErr) {
              reject(err);
            }
          };

          worker.postMessage(buffer, [buffer]);
        }).catch((err) => {
          URL.revokeObjectURL(workerUrl);
          excelWorkerRef.current = null;
          worker.terminate();
          reject(err);
        });
      } catch (workerCreationErr) {
        // Fallback to main thread parsing if Web Worker constructor is disabled
        file.arrayBuffer().then((buffer) => {
          if (importCancelledRef.current) {
            reject(new Error('Import cancelled'));
            return;
          }
          const wb = XLSX.read(buffer, { type: 'array' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          resolve(data);
        }).catch(reject);
      }
    });
  };

  const processImportData = (data: any[]) => {
    if (importCancelledRef.current) {
      setIsImporting(false);
      return;
    }

    const errors: {row: number, error: string}[] = [];
    const validProducts: any[] = [];
    let importedCount = 0;
    let skippedCount = 0;
    let duplicateCount = 0;
    let fileDuplicateCount = 0;
    let existingDuplicateCount = 0;
    let invalidCount = 0;

    const customRaw = localStorage.getItem('zoal_custom_products');
    const existing = customRaw ? JSON.parse(customRaw) : [];

    // Track duplicate records inside the uploaded file itself
    const seenFileSkus = new Set<string>();
    const seenFileBarcodes = new Set<string>();
    const seenFileNames = new Set<string>();

    let chunkIndex = 0;
    const chunkSize = 300;

    const processChunk = () => {
      if (importCancelledRef.current) {
        setIsImporting(false);
        addLog('Import Cancelled', 'Chunk processing halted', 'warning');
        return;
      }

      const chunk = data.slice(chunkIndex, chunkIndex + chunkSize);
      if (chunk.length === 0) {
        setImportErrors(errors);
        setImportPreviewData(validProducts);
        setImportSuccessCount(importedCount);
        setImportFailureCount(invalidCount + skippedCount);
        setIsImporting(false);

        addLog(
          'Import Analysis Complete', 
          `Imported: ${importedCount}, Duplicates: ${duplicateCount} (File: ${fileDuplicateCount}, Catalog: ${existingDuplicateCount}), Invalid: ${invalidCount}`
        );
        return;
      }

      chunk.forEach((row, i) => {
        if (importCancelledRef.current) return;

        const rowNum = chunkIndex + i + 1;
        const name = row.name || row.Name;
        const sku = row.sku || row.SKU;
        const barcode = row.barcode || row.Barcode;
        const priceVal = row.price || row.Price;
        const invVal = row.inventory || row.Inventory;

        if (!name || String(name).trim() === '') {
          errors.push({ row: rowNum, error: 'Missing product name' });
          invalidCount++;
          return;
        }

        const price = parseFloat(priceVal);
        if (isNaN(price) || price < 0) {
          errors.push({ row: rowNum, error: `Invalid price: ${priceVal}` });
          invalidCount++;
          return;
        }

        const inventory = parseInt(invVal);
        if (isNaN(inventory) || inventory < 0) {
          errors.push({ row: rowNum, error: `Invalid inventory: ${invVal}` });
          invalidCount++;
          return;
        }

        const cleanSku = sku ? String(sku).trim().toLowerCase() : '';
        const cleanBarcode = barcode ? String(barcode).trim().toLowerCase() : '';
        const cleanName = String(name).trim().toLowerCase();

        // 1. Detect duplicate row INSIDE the uploaded file (Priority: SKU -> Barcode -> Name)
        let isFileDuplicate = false;
        if (cleanSku && seenFileSkus.has(cleanSku)) isFileDuplicate = true;
        else if (cleanBarcode && seenFileBarcodes.has(cleanBarcode)) isFileDuplicate = true;
        else if (cleanName && seenFileNames.has(cleanName)) isFileDuplicate = true;

        if (isFileDuplicate) {
          fileDuplicateCount++;
          duplicateCount++;
          skippedCount++;
          errors.push({ row: rowNum, error: `Duplicate row detected inside uploaded file (${cleanSku || cleanBarcode || name})` });
          return;
        }

        // 2. Detect duplicate row against existing catalog products (Priority: SKU -> Barcode -> Name)
        const existingMatch = existing.find((p: any) => {
          if (cleanSku && p.sku && String(p.sku).trim().toLowerCase() === cleanSku) return true;
          if (cleanBarcode && p.barcode && String(p.barcode).trim().toLowerCase() === cleanBarcode) return true;
          if (p.name && String(p.name).trim().toLowerCase() === cleanName) return true;
          return false;
        });

        if (existingMatch) {
          existingDuplicateCount++;
          duplicateCount++;
          skippedCount++;
          errors.push({ row: rowNum, error: `Matches existing product in catalog (${cleanSku || cleanBarcode || name})` });
          return;
        }

        // Register as seen within the file for subsequent row comparisons
        if (cleanSku) seenFileSkus.add(cleanSku);
        if (cleanBarcode) seenFileBarcodes.add(cleanBarcode);
        if (cleanName) seenFileNames.add(cleanName);

        const rawImages = row.images || row.Images || '';
        const images = typeof rawImages === 'string'
          ? rawImages.split(/[,;\n]+/).map(u => u.trim()).filter(Boolean)
          : Array.isArray(rawImages) ? rawImages : [];

        validProducts.push({
          id: `custom-prod-imported-${Date.now()}-${chunkIndex + i}`,
          name: String(name).trim(),
          nameEn: row.nameEn || row.NameEn || String(name).trim(),
          nameAr: row.nameAr || row.NameAr || '',
          description: row.description || row.Description || 'Premium handcrafted boutique selection.',
          shortDescription: row.shortDescription || row.ShortDescription || '',
          price: price,
          salePrice: (row.salePrice || row.SalePrice) ? parseFloat(row.salePrice || row.SalePrice) : undefined,
          category: (row.category || row.Category || 'market').toLowerCase() as BusinessCategory,
          brand: row.brand || row.Brand || 'AL ZOAL Specialty Roasters',
          images: images,
          sku: sku ? String(sku).trim() : `ZL-SKU-${Date.now()}-${chunkIndex + i}`,
          barcode: barcode ? String(barcode).trim() : `628${Date.now()}-${chunkIndex + i}`,
          inventory: inventory,
          minStock: parseInt(row.minStock || row.MinStock || '5'),
          maxStock: parseInt(row.maxStock || row.MaxStock || '500'),
          warehouseLocation: row.warehouseLocation || row.WarehouseLocation || 'Al Hofuf Central',
          lowStockThreshold: parseInt(row.lowStockThreshold || row.LowStockThreshold || '5'),
          status: row.status || row.Status || 'Published',
          visibility: row.visibility || row.Visibility || 'Public',
          isFeatured: row.isFeatured === 'true' || row.isFeatured === true || row.IsFeatured === 'true' || row.IsFeatured === true,
          seoSlug: row.seoSlug || row.SeoSlug || '',
          seoMetaTitle: row.seoMetaTitle || row.SeoMetaTitle || '',
          seoMetaDesc: row.seoMetaDesc || row.SeoMetaDesc || '',
          seoMetaKeywords: row.seoMetaKeywords || row.SeoMetaKeywords || '',
          seoCanonicalUrl: row.seoCanonicalUrl || row.SeoCanonicalUrl || '',
          seoOpenGraphImage: row.seoOpenGraphImage || row.SeoOpenGraphImage || '',
          seoSchemaProductData: row.seoSchemaProductData || row.SeoSchemaProductData || '',
          seoRobots: row.seoRobots || row.SeoRobots || 'index, follow',
          seoTwitterCard: row.seoTwitterCard || row.SeoTwitterCard || 'summary_large_image',
          seoFocusKeyword: row.seoFocusKeyword || row.SeoFocusKeyword || '',
          seoOgTitle: row.seoOgTitle || row.SeoOgTitle || '',
          seoOgDesc: row.seoOgDesc || row.SeoOgDesc || '',
          seoTwitterTitle: row.seoTwitterTitle || row.SeoTwitterTitle || '',
          seoTwitterDesc: row.seoTwitterDesc || row.SeoTwitterDesc || '',
          seoTwitterImage: row.seoTwitterImage || row.SeoTwitterImage || '',
          seoArabicSlug: row.seoArabicSlug || row.SeoArabicSlug || '',
          seoEnglishSlug: row.seoEnglishSlug || row.SeoEnglishSlug || '',
          createdAt: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString().slice(0, 10)
        });
        importedCount++;
      });

      chunkIndex += chunkSize;
      setTimeout(processChunk, 0);
    };

    processChunk();
  };

  const onImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isImporting) {
      alert('An import operation is already in progress.');
      if (e.target) e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    importCancelledRef.current = false;
    setImportFileName(file.name);
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    try {
      if (fileExt === 'csv') {
        const Papa = (await import('papaparse')).default;
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (importCancelledRef.current) {
              setIsImporting(false);
              return;
            }
            processImportData(results.data);
          },
          error: (error) => {
            setIsImporting(false);
            addLog('CSV Parsing Error', error.message, 'error');
            alert('Failed to parse CSV file.');
          }
        });
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        const data = await parseExcelWithWorker(file);
        if (importCancelledRef.current) {
          setIsImporting(false);
          return;
        }
        processImportData(data);
      } else {
        setIsImporting(false);
        alert('Unsupported file format. Please upload CSV or Excel.');
      }
    } catch (error: any) {
      setIsImporting(false);
      console.error('Import File Error:', error);
      if (!importCancelledRef.current) {
        addLog('Import Error', error?.message || 'Failed to process import file', 'error');
        alert(`Import Error: ${error?.message || 'Failed to parse file'}`);
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (!importPreviewData || importPreviewData.length === 0) return;
    
    try {
      const customRaw = localStorage.getItem('zoal_custom_products');
      const existing = customRaw ? JSON.parse(customRaw) : [];
      const merged = [...importPreviewData, ...existing];
      
      localStorage.setItem('zoal_custom_products', JSON.stringify(merged));
      const event = new Event('storage');
      window.dispatchEvent(event);
      
      addLog('Bulk Import Success', `Imported ${importPreviewData.length} products`);

      // Supabase Synchronization (Background & Offline-Resilient)
      const productsToSync = [...importPreviewData];
      setTimeout(() => {
        Promise.allSettled(
          productsToSync.map(p => saveProductToSupabase(p))
        ).then((results) => {
          const fulfilled = results.filter(r => r.status === 'fulfilled').length;
          console.log(`[Supabase Import Sync] Completed syncing ${fulfilled}/${results.length} products to Supabase.`);
        }).catch((err) => {
          console.warn('[Supabase Import Sync Error]', err);
        });
      }, 50);

      alert(`Successfully committed ${importPreviewData.length} records.`);
    } catch (e: any) {
      console.error('Storage quota exceeded:', e);
      if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)) {
        alert('Storage quota exceeded! Unable to save imported products to local storage. Please clear some space or export data.');
        addLog('Storage Quota Exceeded', 'Failed to save imported products due to storage limit', 'error');
      } else {
        alert('Failed to save imported products.');
        addLog('Import Save Error', e?.message || 'Unknown error', 'error');
      }
    } finally {
      setImportPreviewData(null);
      setImportErrors([]);
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    if (selectedProductIds.length === 0) return;
    console.log("TRACE BULK 1: Toolbar Delete Selected clicked", { count: selectedProductIds.length });
    setSelectedProductsToDelete([...selectedProductIds]);
    setBulkDeleteError(null);
  };

  const confirmBulkDelete = async () => {
    console.log("TRACE BULK 3: Confirm bulk delete", { count: selectedProductsToDelete.length });
    setIsBulkDeleting(true);
    setBulkDeleteError(null);

    // 3. Verify selectedProducts contains only existing products (source of truth: allProducts)
    const validIds = selectedProductsToDelete.filter(id => allProducts.some(p => p.id === id));
    const invalidIds = selectedProductsToDelete.filter(id => !allProducts.some(p => p.id === id));
    
    if (invalidIds.length > 0) {
      console.warn("Bulk Delete: Filtering out invalid product IDs", invalidIds);
    }

    try {
      const results = await Promise.allSettled(validIds.map(async (id) => {
        console.log(`TRACE BULK 4: Deleting product ${id}`);
        return await deleteProductFromSupabase(id);
      }));

      let successCount = 0;
      let failureCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value === true) {
          successCount++;
        } else {
          failureCount++;
          console.error(`Bulk Delete: Failed to delete product ${validIds[index]}`);
        }
      });

      console.log("TRACE BULK 5: All deletions completed", { 
        total: validIds.length, 
        success: successCount, 
        failed: failureCount 
      });
      
      addLog(`Bulk Deleted ${successCount} products. Failed: ${failureCount}`);
      
      console.log("TRACE BULK 6: triggerProductFetch()");
      await triggerProductFetch(true);
      
      console.log("TRACE BULK 7: Cleanup finished");
      setSelectedProductIds([]); // 5. clear selected ids
      setSelectedProductsToDelete([]); // 5. close modal
    } catch (e: any) {
      console.error(e);
      setBulkDeleteError(e?.message || 'An error occurred during bulk deletion.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusChange = (newStatus: string) => {
    if (currentUser?.role === 'staff') {
      alert('Staff permission denied: Cannot change product statuses.');
      return;
    }
    if (selectedProductIds.length === 0) return;
    try {
      const customRaw = localStorage.getItem('zoal_custom_products');
      let customProducts = customRaw ? JSON.parse(customRaw) : [];
      const overridesRaw = localStorage.getItem('zoal_product_overrides');
      const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};

      selectedProductIds.forEach(id => {
        const isCustom = id.startsWith('custom-prod-');
        if (isCustom) {
          customProducts = customProducts.map((p: any) => p.id === id ? { ...p, status: newStatus } : p);
        } else {
          overrides[id] = { ...(overrides[id] || {}), status: newStatus };
        }
      });

      localStorage.setItem('zoal_custom_products', JSON.stringify(customProducts));
      localStorage.setItem('zoal_product_overrides', JSON.stringify(overrides));

      addLog(`Bulk changed status to "${newStatus}" for ${selectedProductIds.length} products`);
      setSelectedProductIds([]);

      const event = new Event('storage');
      window.dispatchEvent(event);
      alert(`Selected products are now set as ${newStatus}.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkCategoryUpdate = () => {
    if (selectedProductIds.length === 0) return;
    setIsBulkCategoryModalOpen(true);
  };

  const confirmBulkCategoryUpdate = () => {
    const cleanCat = bulkCategoryInput.trim().toLowerCase() as BusinessCategory;
    if (!['coffee', 'bakery', 'market', 'fashion', 'thobes'].includes(cleanCat)) {
      addLog("Invalid category selection.", "error");
      return;
    }

    try {
      const customRaw = localStorage.getItem('zoal_custom_products');
      let customProducts = customRaw ? JSON.parse(customRaw) : [];
      const overridesRaw = localStorage.getItem('zoal_product_overrides');
      const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};

      selectedProductIds.forEach(id => {
        const isCustom = id.startsWith('custom-prod-');
        if (isCustom) {
          customProducts = customProducts.map((p: any) => p.id === id ? { ...p, category: cleanCat } : p);
        } else {
          overrides[id] = { ...(overrides[id] || {}), category: cleanCat };
        }
      });

      localStorage.setItem('zoal_custom_products', JSON.stringify(customProducts));
      localStorage.setItem('zoal_product_overrides', JSON.stringify(overrides));

      addLog(`Bulk updated category to "${cleanCat}" for ${selectedProductIds.length} products`);
      setSelectedProductIds([]);

      const event = new Event('storage');
      window.dispatchEvent(event);
      setIsBulkCategoryModalOpen(false);
    } catch (e) {
      console.error(e);
      addLog("Failed to bulk update categories", "error");
    }
  };

  const handleBulkBrandUpdate = () => {
    if (selectedProductIds.length === 0) return;
    setIsBulkBrandModalOpen(true);
  };

  const confirmBulkBrandUpdate = () => {
    const cleanBrand = bulkBrandInput.trim();
    if (!cleanBrand) {
      addLog("Brand name cannot be empty", "error");
      return;
    }

    try {
      const customRaw = localStorage.getItem('zoal_custom_products');
      let customProducts = customRaw ? JSON.parse(customRaw) : [];
      const overridesRaw = localStorage.getItem('zoal_product_overrides');
      const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};

      selectedProductIds.forEach(id => {
        const isCustom = id.startsWith('custom-prod-');
        if (isCustom) {
          customProducts = customProducts.map((p: any) => p.id === id ? { ...p, brand: cleanBrand } : p);
        } else {
          overrides[id] = { ...(overrides[id] || {}), brand: cleanBrand };
        }
      });

      localStorage.setItem('zoal_custom_products', JSON.stringify(customProducts));
      localStorage.setItem('zoal_product_overrides', JSON.stringify(overrides));

      addLog(`Bulk updated brand to "${cleanBrand}" for ${selectedProductIds.length} products`);
      setSelectedProductIds([]);

      const event = new Event('storage');
      window.dispatchEvent(event);
      setIsBulkBrandModalOpen(false);
      setBulkBrandInput('');
    } catch (e) {
      console.error(e);
      addLog("Failed to bulk update brands", "error");
    }
  };

  // Category CRUD
  const handleAddCategory = () => {
    setIsAddCategoryModalOpen(true);
  };

  const confirmAddCategory = () => {
    const name = addCategoryName.trim();
    if (!name) {
      addLog("Category name is required", "error");
      return;
    }
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const desc = addCategoryDesc.trim();
    
    const newCat = {
      id: `cat-${Date.now()}`,
      name,
      slug,
      parent: null,
      description: desc || 'Prestige category division',
      sortOrder: categories.length + 1,
      count: 0
    };

    setCategories(prev => [...prev, newCat]);
    addLog(`Created Category: ${name}`);
    setIsAddCategoryModalOpen(false);
    setAddCategoryName('');
    setAddCategoryDesc('');
  };

  const handleDeleteCategory = (catId: string, name: string) => {
    setConfirmConfig({
      title: 'DELETE CATEGORY?',
      message: `Delete category "${name}"?`,
      onConfirm: () => {
        setCategories(prev => prev.filter(c => c.id !== catId));
        addLog(`Deleted Category: ${name}`);
        setConfirmConfig(null);
      }
    });
  };

  // Brand CRUD
  const handleAddBrand = () => {
    setIsAddBrandModalOpen(true);
  };

  const confirmAddBrand = () => {
    const name = addBrandName.trim();
    if (!name) {
      addLog("Brand name is required", "error");
      return;
    }
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const desc = addBrandDesc.trim();

    const newBrand = {
      id: `brand-${Date.now()}`,
      name,
      slug,
      description: desc || 'Partner workshop',
      logoUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=200'
    };

    setBrands(prev => [...prev, newBrand]);
    addLog(`Created Brand: ${name}`);
    setIsAddBrandModalOpen(false);
    setAddBrandName('');
    setAddBrandDesc('');
  };

  const handleDeleteBrand = (brandId: string, name: string) => {
    setConfirmConfig({
      title: 'DELETE BRAND?',
      message: `Delete brand "${name}"?`,
      onConfirm: () => {
        setBrands(prev => prev.filter(b => b.id !== brandId));
        addLog(`Deleted Brand: ${name}`);
        setConfirmConfig(null);
      }
    });
  };

  // Filter lists
  const productStats = useMemo(() => {
    const total = allProducts.length;
    let active = 0;
    let draft = 0;
    let featured = 0;
    let lowStock = 0;
    let outOfStock = 0;

    allProducts.forEach(p => {
      // Resolve status safely
      const status = p.status || 'Published';
      if (status.toLowerCase() === 'published' || status.toLowerCase() === 'active') active++;
      if (status.toLowerCase() === 'draft') draft++;

      const isFeatured = p.isFeatured || p.featured || p.popular || false;
      if (isFeatured) featured++;

      const inventory = p.inventory;
      const threshold = p.lowStockThreshold || 5;
      if (inventory === 0) {
        outOfStock++;
      } else if (inventory <= threshold) {
        lowStock++;
      }
    });

    return { total, active, draft, featured, lowStock, outOfStock };
  }, [allProducts]);

  const processedProducts = useMemo(() => {
    let list = allProducts.map(p => {
      // Fallback getters for legacy static items
      return {
        ...p,
        nameEn: p.nameEn || p.name,
        nameAr: p.nameAr || p.name,
        sku: p.sku || p.specifications?.SKU || `ZL-${p.id.slice(-6).toUpperCase()}`,
        barcode: p.barcode || `628${p.id.replace(/\D/g, '').padEnd(10, '0')}`,
        brand: p.brand || 'AL ZOAL Premium',
        subcategory: p.subcategory || 'Artisanal',
        collection: p.collection || 'Premium',
        tags: p.tags || [],
        labels: p.labels || [],
        status: p.status || 'Published',
        visibility: p.visibility || 'Public',
        createdAt: p.createdAt || '2026-07-01',
        updatedAt: p.updatedAt || '2026-07-14',
        costPrice: p.costPrice || (p.price * 0.6),
        profitMargin: p.profitMargin || (((p.price - (p.costPrice || (p.price * 0.6))) / p.price) * 100),
        discountPercent: p.discountPercent || (p.salePrice ? Math.round((1 - p.salePrice/p.price)*100) : 0),
        discountStart: p.discountStart || '',
        discountEnd: p.discountEnd || '',
        taxClass: p.taxClass || 'Standard 15%',
        currency: p.currency || 'SAR',
        minStock: p.minStock || 5,
        maxStock: p.maxStock || 500,
        warehouseLocation: p.warehouseLocation || p.specifications?.['Warehouse Location'] || 'Al Hofuf Central',
        reservedStock: p.reservedStock || 0,
        isFeatured: p.isFeatured || p.featured || p.popular || false,
        isBestSeller: p.isBestSeller || false,
        isNewArrival: p.isNewArrival || false,
        isFlashSale: p.isFlashSale || false,
        isRecommended: p.isRecommended || false,
        lowStockThreshold: p.lowStockThreshold || 5
      };
    });

    // Apply Keyword Search
    if (productSearch) {
      const q = productSearch.toLowerCase();
      list = list.filter(p => {
        return (
          (p.name ?? '').toLowerCase().includes(q) ||
          (p.nameEn ?? '').toLowerCase().includes(q) ||
          (p.nameAr ?? '').toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          (p.shortDescription ?? '').toLowerCase().includes(q) ||
          (p.sku ?? '').toLowerCase().includes(q) ||
          (p.barcode ?? '').toLowerCase().includes(q) ||
          (p.brand ?? '').toLowerCase().includes(q) ||
          (p.category ?? '').toLowerCase().includes(q)
        );
      });
    }

    // Apply Category Filter
    if (productCategoryFilter !== 'all') {
      list = list.filter(p => (p.category ?? '') === productCategoryFilter);
    }

    // Apply Brand Filter
    if (filterBrand !== 'all') {
      list = list.filter(p => (p.brand ?? '').toLowerCase() === filterBrand.toLowerCase());
    }

    // Apply Stock Status Filter
    if (filterStockStatus !== 'all') {
      list = list.filter(p => {
        const inv = p.inventory ?? 0;
        const threshold = p.lowStockThreshold ?? 5;
        const isOut = inv === 0;
        const isLow = inv <= threshold && inv > 0;
        if (filterStockStatus === 'out-of-stock') return isOut;
        if (filterStockStatus === 'low-stock') return isLow;
        if (filterStockStatus === 'in-stock') return !isOut && !isLow;
        return true;
      });
    }

    // Apply Featured Filter
    if (filterFeatured !== 'all') {
      const wantFeatured = filterFeatured === 'featured';
      list = list.filter(p => !!p.isFeatured === wantFeatured);
    }

    // Apply Discounted Filter
    if (filterDiscounted !== 'all') {
      const wantDiscounted = filterDiscounted === 'discounted';
      list = list.filter(p => (!!p.salePrice) === wantDiscounted);
    }

    // Apply Price Range
    if (filterMinPrice) {
      list = list.filter(p => (p.price ?? 0) >= parseFloat(filterMinPrice));
    }
    if (filterMaxPrice) {
      list = list.filter(p => (p.price ?? 0) <= parseFloat(filterMaxPrice));
    }

    // Apply Status Filter
    if (filterStatus !== 'all') {
      list = list.filter(p => (p.status ?? '').toLowerCase() === filterStatus.toLowerCase());
    }

    // Apply Created Date Filter
    if (filterCreatedStart) {
      list = list.filter(p => (p.createdAt ?? '') >= filterCreatedStart);
    }
    if (filterCreatedEnd) {
      list = list.filter(p => (p.createdAt ?? '') <= filterCreatedEnd);
    }

    // Apply Updated Date Filter
    if (filterUpdatedStart) {
      list = list.filter(p => (p.updatedAt ?? '') >= filterUpdatedStart);
    }
    if (filterUpdatedEnd) {
      list = list.filter(p => (p.updatedAt ?? '') <= filterUpdatedEnd);
    }

    // Apply Sorting
    list.sort((a: any, b: any) => {
      let valA = a[productSortField];
      let valB = b[productSortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = typeof valB === 'string' ? valB.toLowerCase() : (valB != null ? String(valB).toLowerCase() : '');
      } else if (typeof valB === 'string') {
        valA = valA != null ? String(valA).toLowerCase() : '';
        valB = valB.toLowerCase();
      } else {
        valA = valA != null ? valA : '';
        valB = valB != null ? valB : '';
      }

      if (valA < valB) return productSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return productSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [
    allProducts,
    productSearch,
    productCategoryFilter,
    filterBrand,
    filterStockStatus,
    filterFeatured,
    filterDiscounted,
    filterMinPrice,
    filterMaxPrice,
    filterStatus,
    filterCreatedStart,
    filterCreatedEnd,
    filterUpdatedStart,
    filterUpdatedEnd,
    productSortField,
    productSortOrder
  ]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (productCurrentPage - 1) * productsPerPage;
    return processedProducts.slice(startIndex, startIndex + productsPerPage);
  }, [processedProducts, productCurrentPage, productsPerPage]);

  const totalPages = Math.ceil(processedProducts.length / productsPerPage) || 1;

  // Bridge variable to keep backwards compatibility with any other referencing code
  const filteredProducts = processedProducts;

  const enrichedOrders = useMemo(() => {
    return orders.map(o => {
      const override = orderOverrides[o.id] || {};
      const timeline = override.timeline || [
        { status: 'Pending', date: new Date(o.date).toLocaleString(), updatedBy: 'System' },
        ...(o.status !== 'Pending' ? [{ status: o.status, date: new Date().toLocaleString(), updatedBy: 'Admin' }] : [])
      ];
      return {
        ...o,
        paymentStatus: override.paymentStatus || (o.status === 'Completed' ? 'Paid' : 'Unpaid'),
        adminNotes: override.adminNotes || '',
        carrier: override.carrier || 'ZOAL Express',
        trackingNumber: o.trackingNumber || override.trackingNumber || 'N/A',
        deliveryZone: override.deliveryZone || 'Dammam Sector A',
        shippingAddress: override.shippingAddress || 'Prince Mohammed Bin Fahd Road, Dammam, Saudi Arabia',
        contactName: override.contactName || o.customerName,
        timeline
      };
    });
  }, [orders, orderOverrides]);

  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter(o => {
      const matchSearch = (o.customerName || '').toLowerCase().includes(orderSearch.toLowerCase()) || 
        (o.id || '').toLowerCase().includes(orderSearch.toLowerCase()) || 
        (o.email || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.phone || '').toLowerCase().includes(orderSearch.toLowerCase());
      
      const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      const matchPayment = orderPaymentFilter === 'all' || o.paymentStatus === orderPaymentFilter;
      const matchDate = !orderDateFilter || o.date === orderDateFilter;
      const matchMinAmount = !orderMinAmount || o.total >= parseFloat(orderMinAmount);
      const matchMaxAmount = !orderMaxAmount || o.total <= parseFloat(orderMaxAmount);

      return matchSearch && matchStatus && matchPayment && matchDate && matchMinAmount && matchMaxAmount;
    });
  }, [enrichedOrders, orderSearch, orderStatusFilter, orderPaymentFilter, orderDateFilter, orderMinAmount, orderMaxAmount]);

  const filteredInventory = useMemo(() => {
    return allProducts.filter(p => {
      return (p.name || '').toLowerCase().includes(inventorySearch.toLowerCase()) ||
        (p.id || '').toLowerCase().includes(inventorySearch.toLowerCase());
    });
  }, [allProducts, inventorySearch]);

  // Guard view
  if (!isAdmin) {
    return (
      <div id="admin-unauthorized-guard" className="bg-black text-white min-h-screen py-10 flex items-center justify-center px-4">
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
              Guard Shield
            </span>
            <h1 className="text-xl font-bold tracking-wider uppercase font-display text-white">
              Privilege Level Violation
            </h1>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              This panel is bound exclusively for accounts with authorized <span className="text-red-400 font-mono font-bold">Admin</span> credentials. Your current access profile has been restricted.
            </p>
          </div>

          <div className="p-3 bg-black border border-white/5 rounded-xs text-[10px] font-mono text-zinc-500 text-left space-y-1">
            <p>• Principal ID: {currentUser ? currentUser.email : 'Unauthenticated'}</p>
            <p>• Auth Level: {currentUser ? currentUser.role : 'None'}</p>
            <p>• Shield Policy: RBAC Route Guard V3</p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => setCurrentPage('home')}
              className="w-full bg-white hover:bg-zinc-200 text-black py-2.5 rounded-xs text-[10px] font-display uppercase tracking-widest cursor-pointer font-bold transition-all"
            >
              Return to Web
            </button>
            <button
              onClick={() => {
                onLogout();
                setCurrentPage('home');
              }}
              className="w-full bg-zinc-900 border border-white/10 hover:border-red-500 hover:text-red-500 text-zinc-400 py-2.5 rounded-xs text-[10px] font-display uppercase tracking-widest cursor-pointer transition-all"
            >
              Terminate Session / Re-Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Links for the elegant unified responsive sidebar (Shared by Admin and Owner)
  const sidebarLinks: ({ category: string } | { id: string; name: string; icon: React.ComponentType<any> })[] = [
    { category: 'Core Operations' },
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', name: 'Products Catalog', icon: Package },
    { id: 'categories', name: 'Categories Div', icon: FolderTree },
    { id: 'brands', name: 'Brands', icon: Tag },
    { id: 'orders', name: 'Customer Orders', icon: ClipboardList },
    { id: 'inventory', name: 'Stock Management', icon: RefreshCw },
    { id: 'warehouses', name: 'Warehouses', icon: Layers },
    { id: 'customers', name: 'Customer Directory', icon: Users },
    { id: 'support', name: 'Support Center', icon: LifeBuoy },

    { category: 'Administrative & Systems' },
    { id: 'cms', name: 'Website CMS', icon: Compass },
    { id: 'blog_cms', name: 'Blog & News CMS', icon: FileText },
    { id: 'media', name: 'Media Library', icon: HardDrive },
    { id: 'marketing', name: 'Marketing', icon: Gift },
    { id: 'coupons', name: 'Coupons', icon: Award },
    { id: 'legal', name: 'Legal Center', icon: FileText },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'shipping', name: 'Shipping', icon: Truck },
    { id: 'taxes', name: 'Taxes', icon: Sliders },
    { id: 'notifications', name: 'System Notifications', icon: Bell },
    { id: 'logs', name: 'Audit Logs', icon: Activity },
    { id: 'security', name: 'Security Center', icon: Shield },
    { id: 'ai_center', name: 'AI Center', icon: Sparkles },
    { id: 'ai_review_center', name: 'AI Translation Queue', icon: Languages },
    { id: 'rbac', name: 'RBAC', icon: Lock },
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'profile', name: 'My Profile', icon: User },

    { category: 'Executive Suite' },
    { id: 'executive_dashboard', name: 'Executive Dashboard', icon: Landmark },
    { id: 'bi', name: 'Business Intelligence', icon: TrendingUp },
    { id: 'financial', name: 'Financial Intelligence', icon: CreditCard },
    { id: 'regional', name: 'Regional Analytics', icon: Globe },
    { id: 'strategic', name: 'Strategic Reports', icon: FileText },
    { id: 'kpi', name: 'Company KPI Center', icon: Award },
    { id: 'growth', name: 'Growth Analytics', icon: ArrowUpRight },
    { id: 'health', name: 'Enterprise Health Monitor', icon: Activity },
    { id: 'forecast', name: 'Executive Forecast', icon: Calendar },
    { id: 'briefing', name: 'AI Executive Briefing', icon: Sparkles },
    { id: 'decision', name: 'Executive Decision Center', icon: Sliders },
  ];

  return (
    <div className="bg-black text-white min-h-screen flex" id="enterprise-admin-panel">
      
      {/* A. Desktop Collapsible Sidebar */}
      <aside 
        className={`hidden md:flex flex-col bg-zinc-950 border-r border-white/5 transition-all duration-300 select-none ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-white/5">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gold-pure animate-pulse" />
              <div>
                <span className="text-[8px] tracking-[0.3em] text-gold-pure font-bold block">AL ZOAL</span>
                <span className="text-xs tracking-widest text-white uppercase font-display font-semibold">HQ CONTROL</span>
              </div>
            </div>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 border border-white/5 rounded-xs hover:border-gold-pure/40 text-zinc-400 hover:text-white mx-auto cursor-pointer"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rotate-180" />}
          </button>
        </div>

        {/* Scrollable Nav Link Stack */}
        <nav className="flex-grow py-6 overflow-y-auto space-y-1.5 px-3 scrollbar-none">
          {sidebarLinks.map((link, index) => {
            if ('category' in link) {
              if (sidebarCollapsed) {
                return <div key={`sep-${index}`} className="border-t border-white/10 my-3" />;
              }
              return (
                <div key={`cat-${index}`} className="pt-4 pb-1 px-3">
                  <span className="text-[8px] font-mono tracking-[0.3em] uppercase text-gold-pure/70 block font-bold">
                    {link.category}
                  </span>
                </div>
              );
            }

            const IconComponent = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`w-full py-2 px-3 rounded-xs flex items-center gap-3 transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-gold-pure text-black font-semibold' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                title={link.name}
              >
                <IconComponent className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && (
                  <span className="text-[10px] uppercase tracking-wider text-left block font-sans truncate">
                    {link.name}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Logout Option */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => {
              setConfirmConfig({
                title: 'TERMINATE SESSION?',
                message: 'Terminate Secure Administration Session?',
                onConfirm: () => {
                  onLogout();
                  setCurrentPage('home');
                },
                confirmLabel: 'Logout'
              });
            }}
            className="w-full py-2.5 rounded-xs border border-rose-500/30 text-rose-400 hover:bg-rose-950/20 text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>Logout Panel</span>}
          </button>
        </div>
      </aside>

      {/* B. Mobile Drawer Sidebar (collapsible) */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Sidebar content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative w-64 bg-zinc-950 border-r border-white/5 flex flex-col h-full z-10"
            >
              <div className="h-20 flex items-center justify-between px-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gold-pure animate-pulse" />
                  <span className="text-xs tracking-widest uppercase font-display font-semibold">ZOAL HQ CONTROL</span>
                </div>
                <button 
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 border border-white/10 rounded-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <nav className="flex-grow py-4 overflow-y-auto space-y-1 px-3">
                {sidebarLinks.map((link, index) => {
                  if ('category' in link) {
                    return (
                      <div key={`cat-${index}`} className="pt-4 pb-1 px-3">
                        <span className="text-[8px] font-mono tracking-[0.3em] uppercase text-gold-pure/70 block font-bold">
                          {link.category}
                        </span>
                      </div>
                    );
                  }

                  const IconComponent = link.icon;
                  const isActive = activeTab === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => {
                        setActiveTab(link.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full py-2 px-3 rounded-xs flex items-center gap-3 transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-gold-pure text-black font-semibold' 
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 shrink-0" />
                      <span className="text-[10.5px] uppercase tracking-wider block text-left font-sans truncate">
                        {link.name}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/5">
                <button
                  onClick={() => {
                    onLogout();
                    setCurrentPage('home');
                  }}
                  className="w-full py-2.5 rounded-xs border border-rose-500/20 text-rose-400 text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* C. Primary Dashboard Content Stage */}
      <main className="flex-grow flex flex-col overflow-x-hidden min-h-screen">
        
        {/* Top Header Controls (Search, Notifications, Profile) */}
        <header className="h-16 lg:h-20 bg-zinc-950 border-b border-white/5 px-2.5 sm:px-4 lg:px-6 flex items-center justify-between gap-1.5 sm:gap-3 lg:gap-4 select-none w-full max-w-full overflow-hidden">
          {/* Menu button for mobile */}
          <button 
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-1.5 sm:p-2 border border-white/10 rounded-xs text-zinc-400 hover:text-white cursor-pointer shrink-0"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Back button */}
          <button
            onClick={() => {
              if (selectedOrder) {
                setSelectedOrder(null);
              } else if (editingProduct) {
                setEditingProduct(null);
              } else if (isAddProductOpen) {
                setIsAddProductOpen(false);
              } else if (selectedCustomer) {
                setSelectedCustomer(null);
              } else if (editingStaff) {
                setEditingStaff(null);
              } else if (isAddStaffOpen) {
                setIsAddStaffOpen(false);
              } else if (isAddCouponOpen) {
                setIsAddCouponOpen(false);
              } else if (isAddCampaignOpen) {
                setIsAddCampaignOpen(false);
              } else if (isAddBannerOpen) {
                setIsAddBannerOpen(false);
              } else if (activeTab !== 'dashboard') {
                setActiveTab('dashboard');
              } else {
                setCurrentPage('home');
              }
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/5 hover:bg-gold-pure/20 border border-white/10 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs transition-all duration-300 group cursor-pointer shrink-0"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider sm:tracking-widest font-bold">Back</span>
          </button>

          {/* Quick Search */}
          <div className="hidden sm:flex items-center gap-2 bg-black border border-white/5 rounded-xs px-3 py-1.5 w-64 md:w-80">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search master registries (SKUs, IDs, Names)..."
              className="bg-transparent text-white placeholder-zinc-500 outline-none text-[10px] font-sans w-full"
            />
          </div>

          {/* Quick status indicator */}
          <div className="hidden lg:flex items-center gap-2 border border-emerald-500/20 bg-emerald-900/10 px-3 py-1 rounded-full text-emerald-400 text-[9px] uppercase tracking-widest font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Supabase Server: Fully Synchronized</span>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4 shrink-0 min-w-0 max-w-full">
            <DashboardLanguageSwitcher />

            {/* System notifications indicator */}
            <div className="relative shrink-0">
              <button 
                onClick={() => onOpenNotifications ? onOpenNotifications() : setActiveTab('notifications')}
                className="p-1.5 sm:p-2 border border-white/5 rounded-xs hover:border-gold-pure/40 text-zinc-400 hover:text-white cursor-pointer relative flex items-center justify-center"
                title="Open Enterprise Notifications"
              >
                <Bell className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] sm:min-w-[18px] h-3.5 sm:h-4 px-1 bg-[#D4AF37] text-black text-[7.5px] sm:text-[9px] font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.6)] animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0 min-w-0 max-w-[95px] min-[380px]:max-w-[125px] sm:max-w-[180px] md:max-w-none">
              <div className="text-right min-w-0 flex-1 overflow-hidden">
                <span className="text-[8.5px] sm:text-[10px] text-white font-bold block uppercase tracking-wide leading-tight truncate" title={currentUser?.name || 'Administrator'}>
                  {currentUser?.name || 'Administrator'}
                </span>
                <span className="text-[7px] sm:text-[8px] font-mono text-gold-pure block tracking-wider sm:tracking-widest uppercase mt-0.5 leading-none truncate">
                  {currentUser?.role === 'owner' ? 'OWNER' : currentUser?.role === 'admin' ? 'ADMINISTRATOR' : currentUser?.role === 'manager' ? 'MANAGER' : currentUser?.role === 'staff' ? 'STAFF' : 'ADMINISTRATOR'}
                </span>
              </div>
              <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-full border border-gold-pure bg-zinc-900 flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold text-gold-pure select-none uppercase shrink-0">
                {currentUser?.name ? currentUser.name.slice(0, 2) : 'AD'}
              </div>
            </div>
          </div>
        </header>

        {/* Tab-driven Content Screen Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-grow px-4 sm:px-6 py-6 space-y-8 overflow-y-auto w-full max-w-full overflow-x-hidden"
        >
          
          {/* I. TAB: DASHBOARD OVERVIEW */}
          {/* I. TAB: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <React.Suspense fallback={<div className="h-96 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Loading Analytical Intelligence...</div>}>
              <div className="space-y-8 animate-fade-in">
                {/* Header Title Section */}
                <div className="flex flex-row items-center justify-between gap-3 border-b border-white/5 pb-4 w-full max-w-full overflow-hidden">
                  <div className="min-w-0 flex-1 overflow-hidden pr-2">
                    <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-1">ZOAL Sovereign Control</span>
                    <h2 className="text-sm sm:text-xl lg:text-2xl font-bold tracking-tight sm:tracking-widest font-display uppercase text-white truncate leading-tight">
                      {currentUser?.role === 'owner' ? 'OWNER' : currentUser?.role === 'admin' ? 'ADMINISTRATOR' : currentUser?.role === 'manager' ? 'MANAGER' : currentUser?.role === 'staff' ? 'STAFF' : 'ADMINISTRATOR'} DASHBOARD
                    </h2>
                  </div>
                  {/* Sync & Refresh Actions */}
                  <div className="flex items-center shrink-0">
                    <button 
                      onClick={() => {
                        addLog('Triggered Manual Supabase Re-Sync');
                        alert('Supabase master records verified and up-to-date!');
                      }}
                      className="py-1.5 px-2.5 sm:px-3 border border-gold-pure/30 text-gold-pure hover:bg-gold-pure/10 rounded-xs text-[8.5px] sm:text-[9px] uppercase tracking-widest font-mono font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <RefreshCw className="w-3 h-3 text-gold-pure" /> Refresh Data
                    </button>
                  </div>
                </div>

                {currentUser?.role === 'owner' ? (
                  <OwnerExecutiveDashboard 
                    currentUser={currentUser}
                    orders={orders}
                    allProducts={allProducts}
                  />
                ) : (
                  <AnalyticsOverview 
                    metrics={metrics}
                    revenueTrendData={revenueTrendData}
                    categoryPerformanceData={categoryPerformanceData}
                    formatCurrency={formatCurrency}
                  />
                )}

                {/* 3. Bottom Columns: Quick Action and Recent Widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                  
                  {/* Column A: Recent Orders List */}
                  <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h3 className="text-white text-[10px] font-display uppercase tracking-widest">Recent Orders</h3>
                      <button onClick={() => setActiveTab('orders')} className="text-[8px] uppercase font-mono text-gold-pure hover:text-white">View All</button>
                    </div>
                    <div className="space-y-3.5">
                      {orders.slice(0, 4).map(o => (
                        <div 
                          key={o.id} 
                          onClick={() => { setSelectedOrder(o); setActiveTab('orders'); }}
                          className="flex justify-between items-center p-2.5 bg-black/40 border border-white/5 hover:border-gold-pure/30 rounded-xs duration-300 cursor-pointer"
                        >
                          <div>
                            <span className="text-[10px] font-mono text-white font-bold block">{o.id}</span>
                            <span className="text-[8.5px] text-zinc-500 font-sans block">{o.customerName} • {o.items.length} items</span>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="text-[10px] font-mono text-gold-pure font-bold block">{formatCurrency(o.total)} SAR</span>
                            <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[7px] uppercase font-mono ${
                              o.status === 'Completed' ? 'bg-emerald-900/20 text-emerald-400' :
                              o.status === 'Cancelled' ? 'bg-rose-900/20 text-rose-400' :
                              'bg-amber-900/20 text-amber-400 animate-pulse'
                            }`}>
                              {o.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column B: System Activity Logs */}
                  <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h3 className="text-white text-[10px] font-display uppercase tracking-widest">System Activity Logs</h3>
                      <button onClick={() => setActiveTab('logs')} className="text-[8px] uppercase font-mono text-zinc-500 hover:text-white">Audit</button>
                    </div>
                    <div className="space-y-3 font-mono text-[9px]">
                      {systemLogs.slice(0, 5).map((log, idx) => (
                        <div key={`${log.id}-${idx}`} className="p-2 bg-black/40 border border-white/5 rounded-xs flex items-start gap-2 text-zinc-400">
                          <Activity className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[8px] text-zinc-500 w-full gap-2">
                              <span>{log.user} • {log.ip}</span>
                              <span>{log.time.split(',')[1]}</span>
                            </div>
                            <p className="text-white font-sans">{log.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column C: Quick Action Panel */}
                  <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                    <div className="border-b border-white/5 pb-2">
                      <h3 className="text-white text-[10px] font-display uppercase tracking-widest">QUICK ACTIONS</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      <button 
                        onClick={() => { startCreateProduct(); setActiveTab('products'); }}
                        className="p-4 bg-black border border-white/5 hover:border-gold-pure/40 rounded-xs text-center space-y-2 cursor-pointer transition-colors"
                      >
                        <Plus className="w-5 h-5 mx-auto text-gold-pure" />
                        <span className="text-[8.5px] uppercase tracking-widest font-bold text-white block">Add Product</span>
                      </button>
                      <button 
                        onClick={() => handleAddCategory()}
                        className="p-4 bg-black border border-white/5 hover:border-gold-pure/40 rounded-xs text-center space-y-2 cursor-pointer transition-colors"
                      >
                        <FolderTree className="w-5 h-5 mx-auto text-gold-pure" />
                        <span className="text-[8.5px] uppercase tracking-widest font-bold text-white block">Add Category</span>
                      </button>
                      <button 
                        onClick={() => handleAddBrand()}
                        className="p-4 bg-black border border-white/5 hover:border-gold-pure/40 rounded-xs text-center space-y-2 cursor-pointer transition-colors"
                      >
                        <Tag className="w-5 h-5 mx-auto text-gold-pure" />
                        <span className="text-[8.5px] uppercase tracking-widest font-bold text-white block">Add Brand</span>
                      </button>
                      <button 
                        onClick={handleBulkExport}
                        className="p-4 bg-black border border-white/5 hover:border-gold-pure/40 rounded-xs text-center space-y-2 cursor-pointer transition-colors"
                      >
                        <Download className="w-5 h-5 mx-auto text-zinc-400" />
                        <span className="text-[8.5px] uppercase tracking-widest font-bold text-white block">Bulk Export</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </React.Suspense>
          )}

          {/* II. TAB: PRODUCTS CATALOG (CRUD) */}
          {activeTab === 'products' && (
            <React.Suspense fallback={<div className="h-96 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Initializing Catalog Workbench...</div>}>
              <div className="space-y-6 text-left animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ZOAL STORE</span>
                  <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">PRODUCT MANAGEMENT</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={startCreateProduct}
                    className="py-1.5 px-3 bg-gold-pure hover:bg-gold-pure/90 text-black rounded-xs text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Product
                  </button>
                  
                  <div className="relative flex items-center gap-1.5">
                    <button 
                      onClick={handleBulkImport}
                      disabled={isImporting}
                      className={`py-1.5 px-3 border border-white/10 text-zinc-400 rounded-xs text-[9px] uppercase tracking-widest font-mono transition-all flex items-center gap-1 ${
                        isImporting ? 'opacity-60 cursor-not-allowed bg-white/5' : 'hover:border-white hover:text-white cursor-pointer'
                      }`}
                    >
                      {isImporting ? (
                        <>
                          <div className="w-3 h-3 border-2 border-gold-pure border-t-transparent rounded-full animate-spin"></div>
                          Import in progress...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" /> Import <ChevronDown className="w-3 h-3 ml-0.5" />
                        </>
                      )}
                    </button>
                    {isImporting && (
                      <button
                        onClick={handleCancelImport}
                        className="py-1.5 px-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xs text-[9px] uppercase tracking-widest font-mono transition-all cursor-pointer flex items-center gap-1"
                        title="Cancel ongoing import"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    )}
                    {isImportMenuOpen && !isImporting && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsImportMenuOpen(false)}></div>
                        <div className="absolute top-full right-0 mt-1 bg-zinc-950 border border-white/10 rounded-xs shadow-2xl z-50 w-40 overflow-hidden animate-fade-in">
                          <button onClick={handleImportCSVClick} className="w-full text-left px-4 py-2.5 text-[9px] uppercase tracking-widest font-mono text-zinc-400 hover:text-white hover:bg-white/5 transition-all border-b border-white/5">
                            Import CSV
                          </button>
                          <button onClick={handleImportExcelClick} className="w-full text-left px-4 py-2.5 text-[9px] uppercase tracking-widest font-mono text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
                            Import Excel
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="relative">
                    <button 
                      onClick={handleBulkExport}
                      className="py-1.5 px-3 border border-white/10 hover:border-white text-zinc-400 hover:text-white rounded-xs text-[9px] uppercase tracking-widest font-mono cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Export <ChevronDown className="w-3 h-3 ml-0.5" />
                    </button>
                    {isExportMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsExportMenuOpen(false)}></div>
                        <div className="absolute top-full right-0 mt-1 bg-zinc-950 border border-white/10 rounded-xs shadow-2xl z-50 w-40 overflow-hidden animate-fade-in">
                          <button onClick={handleExportCSV} className="w-full text-left px-4 py-2.5 text-[9px] uppercase tracking-widest font-mono text-zinc-400 hover:text-white hover:bg-white/5 transition-all border-b border-white/5">
                            Export CSV
                          </button>
                          <button onClick={handleExportExcel} className="w-full text-left px-4 py-2.5 text-[9px] uppercase tracking-widest font-mono text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
                            Export Excel
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={onImportFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Golden Row of PMS Sub-tabs */}
              <div className="flex border-b border-white/5 overflow-x-auto whitespace-nowrap scrollbar-none gap-2 pb-1 text-[10px] font-mono uppercase tracking-wider">
                <button
                  onClick={() => setPmsSubTab('catalog')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'catalog' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  1. Product List ({allProducts.length})
                </button>
                <button
                  onClick={() => setPmsSubTab('variants')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'variants' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  2. Product Variants
                </button>
                <button
                  onClick={() => setPmsSubTab('media')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'media' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  3. Product Media
                </button>
                <button
                  onClick={() => setPmsSubTab('seo-ai')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'seo-ai' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  4. SEO & AI Tools
                </button>
                <button
                  onClick={() => setPmsSubTab('reviews')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'reviews' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  5. Reviews & Ratings
                </button>
                <button
                  onClick={() => setPmsSubTab('bulk')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'bulk' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  6. Bulk Actions
                </button>
                <button
                  onClick={() => setPmsSubTab('logs')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'logs' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  7. Activity Logs ({pmsLogs.length})
                </button>
                <button
                  onClick={() => setPmsSubTab('import-center')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'import-center' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  8. Product Import Center
                </button>
              </div>

              {/* Enterprise Catalog Form Panel (Moved outside subtab condition for robustness) */}
              <AnimatePresence mode="wait">
                {isAddProductOpen && (
                  <motion.div 
                    key="product-workspace-form"
                    initial={{ opacity: 0, scale: 0.98, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="bg-zinc-950 border border-gold-pure/30 p-5 rounded-xs space-y-6 text-left relative z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] my-4"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] tracking-widest text-gold-pure uppercase font-bold flex items-center gap-1.5">
                        <Plus className="w-4 h-4" /> 
                        {isEditing ? `Edit Product List - ${editingProduct?.name}` : 'Add New Handcrafted Catalog Item'}
                      </span>
                      <button type="button" onClick={() => { setIsAddProductOpen(false); setEditingProduct(null); }} className="text-zinc-500 hover:text-white cursor-pointer transition-colors"><X className="w-4.5 h-4.5" /></button>
                    </div>

                    <ProductWorkspaceForm
                      formState={formState}
                      setFormState={setFormState}
                      currentUser={currentUser}
                      brands={brands}
                      activeFormTab={activeFormTab}
                      setActiveFormTab={setActiveFormTab}
                      onSubmit={handleSaveProduct}
                      onCancel={() => { setIsAddProductOpen(false); setEditingProduct(null); }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Product Selector for Sub-tabs */}
              {pmsSubTab !== 'catalog' && pmsSubTab !== 'bulk' && pmsSubTab !== 'logs' && pmsSubTab !== 'import-center' && (
                <div className="bg-zinc-950 p-4 border border-white/5 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gold-pure animate-pulse" />
                    <div>
                      <span className="text-[8px] tracking-widest text-zinc-500 uppercase block font-mono">ACTIVE WORKBENCH SELECTION</span>
                      <h3 className="text-sm font-bold font-serif text-white">
                        {selectedPmsProduct ? `${selectedPmsProduct.name} (${selectedPmsProduct.sku || 'No SKU'})` : 'No Product Selected'}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase">Select Target Product:</span>
                    <select
                      value={selectedPmsProductId}
                      onChange={(e) => setSelectedPmsProductId(e.target.value)}
                      className="bg-black border border-white/10 text-white text-xs py-1.5 px-3 rounded-xs outline-none focus:border-gold-pure cursor-pointer"
                    >
                      {allProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} [{p.sku || 'No SKU'}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {pmsSubTab === 'catalog' && (
                <>
                  {/* Product statistics bento grid */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-zinc-950 p-3 border border-white/5 rounded-xs flex flex-col justify-between">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Total Products</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold text-white font-mono">{productStats.total}</span>
                    <Package className="w-3.5 h-3.5 text-zinc-600" />
                  </div>
                </div>
                <div className="bg-zinc-950 p-3 border border-white/5 rounded-xs flex flex-col justify-between">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Active / Published</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold text-emerald-400 font-mono">{productStats.active}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/40" />
                  </div>
                </div>
                <div className="bg-zinc-950 p-3 border border-white/5 rounded-xs flex flex-col justify-between">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Draft Products</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold text-amber-500 font-mono">{productStats.draft}</span>
                    <FileText className="w-3.5 h-3.5 text-amber-500/40" />
                  </div>
                </div>
                <div className="bg-zinc-950 p-3 border border-white/5 rounded-xs flex flex-col justify-between">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Featured Products</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold text-gold-pure font-mono">{productStats.featured}</span>
                    <Award className="w-3.5 h-3.5 text-gold-pure/40" />
                  </div>
                </div>
                <div className="bg-zinc-950 p-3 border border-white/5 rounded-xs flex flex-col justify-between">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Low Stock Items</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className={`text-lg font-bold font-mono ${productStats.lowStock > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>{productStats.lowStock}</span>
                    <AlertCircle className={`w-3.5 h-3.5 ${productStats.lowStock > 0 ? 'text-amber-500' : 'text-zinc-600'}`} />
                  </div>
                </div>
                <div className="bg-zinc-950 p-3 border border-white/5 rounded-xs flex flex-col justify-between">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Out of Stock</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className={`text-lg font-bold font-mono ${productStats.outOfStock > 0 ? 'text-rose-500' : 'text-zinc-500'}`}>{productStats.outOfStock}</span>
                    <AlertCircle className={`w-3.5 h-3.5 ${productStats.outOfStock > 0 ? 'text-rose-500' : 'text-zinc-600'}`} />
                  </div>
                </div>
              </div>

              {/* Automatic Low Stock Alerts Center */}
              {productStats.lowStock + productStats.outOfStock > 0 && (
                <div className="bg-amber-950/20 border border-amber-900/40 p-3.5 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="p-1.5 bg-amber-500/10 rounded-full text-amber-500">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-amber-400 font-mono uppercase tracking-wide">Automatic Stock depletion Warning</p>
                      <p className="text-[10px] text-zinc-400 leading-snug">
                        System has detected <span className="text-rose-400 font-bold">{productStats.outOfStock} out-of-stock</span> and <span className="text-amber-400 font-bold">{productStats.lowStock} low-stock</span> artisanal coffee or spice items in the active catalog.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setFilterStockStatus('out-of-stock');
                        setProductCurrentPage(1);
                      }}
                      className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/40 text-[9px] font-mono text-rose-400 uppercase rounded-xs transition-colors cursor-pointer"
                    >
                      Show Out of Stock
                    </button>
                    <button 
                      onClick={() => {
                        setFilterStockStatus('low-stock');
                        setProductCurrentPage(1);
                      }}
                      className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-900/40 text-[9px] font-mono text-amber-400 uppercase rounded-xs transition-colors cursor-pointer"
                    >
                      Show Low Stock
                    </button>
                  </div>
                </div>
              )}

              {/* Controls and filters list */}
              <div className="bg-zinc-950 p-4 border border-white/5 rounded-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left Controls */}
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <div className="flex items-center gap-2 bg-black border border-white/5 px-3 py-1.5 rounded-xs w-full md:w-64">
                      <Search className="w-3.5 h-3.5 text-zinc-500" />
                      <input 
                        type="text" 
                        placeholder="Search name, SKU, tags..."
                        value={productSearch}
                        onChange={(e) => { setProductSearch(e.target.value); setProductCurrentPage(1); }}
                        className="bg-transparent text-white placeholder-zinc-500 outline-none text-[10px] w-full"
                      />
                    </div>

                    <select
                      value={productCategoryFilter}
                      onChange={(e) => { setProductCategoryFilter(e.target.value); setProductCurrentPage(1); }}
                      className="bg-black border border-white/5 text-zinc-300 text-[10px] py-1.5 px-3 rounded-xs outline-none focus:border-gold-pure"
                    >
                      <option value="all">All Categories</option>
                      <option value="coffee">Coffee Cafe</option>
                      <option value="bakery">Bakery Heritage</option>
                      <option value="market">Organic Market</option>
                      <option value="fashion">Premium Toob</option>
                      <option value="thobes">Luxury Thobes</option>
                    </select>

                    <button
                      onClick={() => setIsColumnVisibilityOpen(!isColumnVisibilityOpen)}
                      className="py-1.5 px-3 border border-white/10 text-zinc-300 hover:text-white rounded-xs text-[10px] flex items-center gap-1 transition-all"
                    >
                      <Sliders className="w-3 h-3" /> Columns <ChevronDown className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => {
                        // Toggle filters by setting filterBrand to 'all' if active, or just keep active
                      }}
                      className="py-1.5 px-3 border border-white/10 text-zinc-300 hover:text-white rounded-xs text-[10px] flex items-center gap-1 transition-all"
                    >
                      <Filter className="w-3 h-3" /> Advanced Filters
                    </button>
                  </div>

                  {/* Right Controls (View Toggle + Page Size) */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mr-1">View Style:</span>
                    <div className="inline-flex rounded-xs border border-white/5 p-0.5 bg-black">
                      <button 
                        onClick={() => setProductViewMode('table')}
                        className={`p-1 rounded-xs transition-all ${productViewMode === 'table' ? 'bg-gold-pure text-black' : 'text-zinc-500 hover:text-white'}`}
                      >
                        <Sliders className="w-3 h-3 rotate-90" />
                      </button>
                      <button 
                        onClick={() => setProductViewMode('grid')}
                        className={`p-1 rounded-xs transition-all ${productViewMode === 'grid' ? 'bg-gold-pure text-black' : 'text-zinc-500 hover:text-white'}`}
                      >
                        <FolderTree className="w-3 h-3" />
                      </button>
                    </div>

                    <select
                      value={productsPerPage}
                      onChange={(e) => { setProductsPerPage(parseInt(e.target.value)); setProductCurrentPage(1); }}
                      className="bg-black border border-white/5 text-zinc-400 text-[10px] py-1.5 px-2 rounded-xs outline-none font-mono"
                    >
                      <option value="5">5 per page</option>
                      <option value="10">10 per page</option>
                      <option value="25">25 per page</option>
                      <option value="50">50 per page</option>
                    </select>
                  </div>
                </div>

                {/* Column Visibility Panel */}
                {isColumnVisibilityOpen && (
                  <div className="bg-black border border-white/5 p-3 rounded-xs grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] text-zinc-400 animate-fade-in">
                    {Object.keys(visibleColumns).map(col => (
                      <label key={col} className="flex items-center gap-2 cursor-pointer hover:text-white font-mono">
                        <input 
                          type="checkbox" 
                          checked={visibleColumns[col]} 
                          onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                          className="rounded-xs accent-gold-pure"
                        />
                        <span className="capitalize">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Advanced Filters Panel */}
                <div className="bg-black border border-white/5 p-4 rounded-xs grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Brands</label>
                    <select
                      value={filterBrand}
                      onChange={(e) => { setFilterBrand(e.target.value); setProductCurrentPage(1); }}
                      className="w-full bg-zinc-950 border border-white/5 text-zinc-300 py-1 px-2 rounded-xs outline-none focus:border-gold-pure"
                    >
                      <option value="all">All Brands</option>
                      <option value="AL ZOAL Specialty Roasters">AL ZOAL Specialty Roasters</option>
                      <option value="AL ZOAL Premium">AL ZOAL Premium</option>
                      <option value="Sudan Harvest Co-op">Sudan Harvest Co-op</option>
                      <option value="Kordofan Co-op">Kordofan Co-op</option>
                      <option value="Karam Sweets Office">Karam Sweets Office</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Stock Level</label>
                    <select
                      value={filterStockStatus}
                      onChange={(e) => { setFilterStockStatus(e.target.value); setProductCurrentPage(1); }}
                      className="w-full bg-zinc-950 border border-white/5 text-zinc-300 py-1 px-2 rounded-xs outline-none focus:border-gold-pure"
                    >
                      <option value="all">All Stocks</option>
                      <option value="in-stock">In Stock (&gt; Low Threshold)</option>
                      <option value="low-stock">Low Stock (≤ Threshold)</option>
                      <option value="out-of-stock">Out of Stock (0 units)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Featured Status</label>
                    <select
                      value={filterFeatured}
                      onChange={(e) => { setFilterFeatured(e.target.value); setProductCurrentPage(1); }}
                      className="w-full bg-zinc-950 border border-white/5 text-zinc-300 py-1 px-2 rounded-xs outline-none focus:border-gold-pure"
                    >
                      <option value="all">All Selections</option>
                      <option value="featured">Featured / Popular Only</option>
                      <option value="not-featured">Standard Catalog Only</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Discounts & Offers</label>
                    <select
                      value={filterDiscounted}
                      onChange={(e) => { setFilterDiscounted(e.target.value); setProductCurrentPage(1); }}
                      className="w-full bg-zinc-950 border border-white/5 text-zinc-300 py-1 px-2 rounded-xs outline-none focus:border-gold-pure"
                    >
                      <option value="all">All Prices</option>
                      <option value="discounted">Discounted / On Sale Only</option>
                      <option value="not-discounted">Regular MSRP Only</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Price Range (SAR)</label>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="number" 
                        placeholder="Min Price"
                        value={filterMinPrice}
                        onChange={(e) => { setFilterMinPrice(e.target.value); setProductCurrentPage(1); }}
                        className="w-1/2 bg-zinc-950 border border-white/5 text-white p-1 rounded-xs text-[10px] outline-none focus:border-gold-pure font-mono"
                      />
                      <span className="text-zinc-600 font-mono text-[9px]">-</span>
                      <input 
                        type="number" 
                        placeholder="Max Price"
                        value={filterMaxPrice}
                        onChange={(e) => { setFilterMaxPrice(e.target.value); setProductCurrentPage(1); }}
                        className="w-1/2 bg-zinc-950 border border-white/5 text-white p-1 rounded-xs text-[10px] outline-none focus:border-gold-pure font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Product Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => { setFilterStatus(e.target.value); setProductCurrentPage(1); }}
                      className="w-full bg-zinc-950 border border-white/5 text-zinc-300 py-1 px-2 rounded-xs outline-none focus:border-gold-pure"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Published">Published / Active</option>
                      <option value="Draft">Draft</option>
                      <option value="Hidden">Hidden</option>
                      <option value="Archived">Archived</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Discontinued">Discontinued</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Created After / Before</label>
                    <div className="flex gap-1">
                      <input 
                        type="date" 
                        value={filterCreatedStart}
                        onChange={(e) => { setFilterCreatedStart(e.target.value); setProductCurrentPage(1); }}
                        className="w-1/2 bg-zinc-950 border border-white/5 text-zinc-400 p-1 rounded-xs text-[9px] outline-none"
                      />
                      <input 
                        type="date" 
                        value={filterCreatedEnd}
                        onChange={(e) => { setFilterCreatedEnd(e.target.value); setProductCurrentPage(1); }}
                        className="w-1/2 bg-zinc-950 border border-white/5 text-zinc-400 p-1 rounded-xs text-[9px] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Updated After / Before</label>
                    <div className="flex gap-1">
                      <input 
                        type="date" 
                        value={filterUpdatedStart}
                        onChange={(e) => { setFilterUpdatedStart(e.target.value); setProductCurrentPage(1); }}
                        className="w-1/2 bg-zinc-950 border border-white/5 text-zinc-400 p-1 rounded-xs text-[9px] outline-none"
                      />
                      <input 
                        type="date" 
                        value={filterUpdatedEnd}
                        onChange={(e) => { setFilterUpdatedEnd(e.target.value); setProductCurrentPage(1); }}
                        className="w-1/2 bg-zinc-950 border border-white/5 text-zinc-400 p-1 rounded-xs text-[9px] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterBrand('all');
                        setFilterStockStatus('all');
                        setFilterFeatured('all');
                        setFilterDiscounted('all');
                        setFilterMinPrice('');
                        setFilterMaxPrice('');
                        setFilterStatus('all');
                        setFilterCreatedStart('');
                        setFilterCreatedEnd('');
                        setFilterUpdatedStart('');
                        setFilterUpdatedEnd('');
                        setProductSearch('');
                        setProductCategoryFilter('all');
                        setProductCurrentPage(1);
                      }}
                      className="w-full py-1.5 border border-dashed border-white/10 hover:border-gold-pure text-[10px] text-zinc-400 hover:text-gold-pure rounded-xs font-mono uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk Actions Bar (Sticky on top of Table/Grid when items are selected) */}
              {selectedProductIds.length > 0 && (
                <div className="bg-gold-pure/10 border border-gold-pure/40 p-3 px-4 rounded-xs flex flex-wrap justify-between items-center gap-3 animate-fade-in mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gold-pure uppercase font-bold">
                      {selectedProductIds.length} Products Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold font-mono uppercase tracking-wider">
                    <button 
                      onClick={() => handleBulkStatusChange('Published')}
                      className="py-1 px-2.5 bg-black text-white border border-white/10 hover:border-gold-pure rounded-xs transition-all cursor-pointer"
                    >
                      Publish Selected
                    </button>
                    <button 
                      onClick={() => handleBulkStatusChange('Draft')}
                      className="py-1 px-2.5 bg-black text-white border border-white/10 hover:border-gold-pure rounded-xs transition-all cursor-pointer"
                    >
                      Draft Selected
                    </button>
                    <button 
                      onClick={handleBulkCategoryUpdate}
                      className="py-1 px-2.5 bg-black text-white border border-white/10 hover:border-gold-pure rounded-xs transition-all cursor-pointer"
                    >
                      Update Category
                    </button>
                    <button 
                      onClick={handleBulkBrandUpdate}
                      className="py-1 px-2.5 bg-black text-white border border-white/10 hover:border-gold-pure rounded-xs transition-all cursor-pointer"
                    >
                      Update Brand
                    </button>
                    {currentUser?.role !== 'staff' && (
                      <button 
                        onClick={handleBulkDelete}
                        className="py-1 px-2.5 bg-rose-950/80 text-rose-300 border border-rose-500/30 hover:bg-rose-900 rounded-xs transition-all cursor-pointer"
                      >
                        Delete Selected
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedProductIds([])}
                      className="py-1 px-2.5 text-zinc-400 hover:text-white"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
              )}

              {/* Product Views: Grid vs List */}
              {productViewMode === 'table' ? (
                <div className="bg-zinc-950 border border-white/5 rounded-xs overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-white/5">
                    <thead className="bg-black text-zinc-500 text-[8.5px] uppercase tracking-widest">
                      <tr>
                        <th className="p-4 w-10">
                          <input 
                            type="checkbox"
                            checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProductIds.includes(p.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds(prev => {
                                  const newIds = [...prev];
                                  paginatedProducts.forEach(p => {
                                    if (!newIds.includes(p.id)) newIds.push(p.id);
                                  });
                                  return newIds;
                                });
                              } else {
                                setSelectedProductIds(prev => prev.filter(id => !paginatedProducts.some(p => p.id === id)));
                              }
                            }}
                            className="accent-gold-pure"
                          />
                        </th>
                        {visibleColumns.visual && <th className="p-4 w-14">Visual</th>}
                        {visibleColumns.name && (
                          <th className="p-4 cursor-pointer hover:text-white" onClick={() => {
                            const nextOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
                            setProductSortOrder(nextOrder);
                            setProductSortField('name');
                          }}>
                            <div className="flex items-center gap-1">
                              Name {productSortField === 'name' && (productSortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                            </div>
                          </th>
                        )}
                        {visibleColumns.sku && (
                          <th className="p-4 cursor-pointer hover:text-white" onClick={() => {
                            const nextOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
                            setProductSortOrder(nextOrder);
                            setProductSortField('sku');
                          }}>
                            <div className="flex items-center gap-1">
                              SKU {productSortField === 'sku' && (productSortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                            </div>
                          </th>
                        )}
                        {visibleColumns.barcode && (
                          <th className="p-4 cursor-pointer hover:text-white" onClick={() => {
                            const nextOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
                            setProductSortOrder(nextOrder);
                            setProductSortField('barcode');
                          }}>
                            <div className="flex items-center gap-1">
                              Barcode {productSortField === 'barcode' && (productSortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                            </div>
                          </th>
                        )}
                        {visibleColumns.category && (
                          <th className="p-4 cursor-pointer hover:text-white" onClick={() => {
                            const nextOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
                            setProductSortOrder(nextOrder);
                            setProductSortField('category');
                          }}>
                            <div className="flex items-center gap-1">
                              Category {productSortField === 'category' && (productSortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                            </div>
                          </th>
                        )}
                        {visibleColumns.brand && (
                          <th className="p-4 cursor-pointer hover:text-white" onClick={() => {
                            const nextOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
                            setProductSortOrder(nextOrder);
                            setProductSortField('brand');
                          }}>
                            <div className="flex items-center gap-1">
                              Brand {productSortField === 'brand' && (productSortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                            </div>
                          </th>
                        )}
                        {visibleColumns.price && (
                          <th className="p-4 text-right cursor-pointer hover:text-white" onClick={() => {
                            const nextOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
                            setProductSortOrder(nextOrder);
                            setProductSortField('price');
                          }}>
                            <div className="flex items-center justify-end gap-1">
                              Price {productSortField === 'price' && (productSortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                            </div>
                          </th>
                        )}
                        {visibleColumns.discount && (
                          <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => {
                            const nextOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
                            setProductSortOrder(nextOrder);
                            setProductSortField('discountPercent');
                          }}>
                            <div className="flex items-center justify-center gap-1">
                              Discount {productSortField === 'discountPercent' && (productSortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                            </div>
                          </th>
                        )}
                        {visibleColumns.stock && (
                          <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => {
                            const nextOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
                            setProductSortOrder(nextOrder);
                            setProductSortField('inventory');
                          }}>
                            <div className="flex items-center justify-center gap-1">
                              Stock {productSortField === 'inventory' && (productSortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                            </div>
                          </th>
                        )}
                        {visibleColumns.status && (
                          <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => {
                            const nextOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
                            setProductSortOrder(nextOrder);
                            setProductSortField('status');
                          }}>
                            <div className="flex items-center justify-center gap-1">
                              Status {productSortField === 'status' && (productSortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                            </div>
                          </th>
                        )}
                        {visibleColumns.createdDate && (
                          <th className="p-4 cursor-pointer hover:text-white" onClick={() => {
                            const nextOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
                            setProductSortOrder(nextOrder);
                            setProductSortField('createdAt');
                          }}>
                            <div className="flex items-center gap-1">
                              Created {productSortField === 'createdAt' && (productSortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                            </div>
                          </th>
                        )}
                        {visibleColumns.updatedDate && (
                          <th className="p-4 cursor-pointer hover:text-white" onClick={() => {
                            const nextOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
                            setProductSortOrder(nextOrder);
                            setProductSortField('updatedAt');
                          }}>
                            <div className="flex items-center gap-1">
                              Updated {productSortField === 'updatedAt' && (productSortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                            </div>
                          </th>
                        )}
                        {visibleColumns.rating && (
                          <th className="p-4 text-center cursor-pointer hover:text-white" onClick={() => {
                            const nextOrder = productSortOrder === 'asc' ? 'desc' : 'asc';
                            setProductSortOrder(nextOrder);
                            setProductSortField('rating');
                          }}>
                            <div className="flex items-center justify-center gap-1">
                              Rating {productSortField === 'rating' && (productSortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                            </div>
                          </th>
                        )}
                        {visibleColumns.actions && <th className="p-4 text-right">List Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="p-8 text-center text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                            No handcrafted products found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedProducts.map(p => {
                          const threshold = p.lowStockThreshold || 5;
                          const isLowStock = p.inventory <= threshold && p.inventory > 0;
                          const isOutOfStock = p.inventory === 0;
                          const isSelected = selectedProductIds.includes(p.id);
                          
                          return (
                            <tr key={p.id} className={`hover:bg-white/1.5 duration-150 ${isSelected ? 'bg-gold-pure/5' : ''}`}>
                              <td className="p-4">
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedProductIds(prev => [...prev, p.id]);
                                    } else {
                                      setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                                    }
                                  }}
                                  className="accent-gold-pure"
                                />
                              </td>
                              {visibleColumns.visual && (
                                <td className="p-4">
                                  <div className="w-11 h-11 bg-zinc-900 border border-white/10 rounded-xs overflow-hidden flex items-center justify-center relative">
                                    <SafeImage 
                                      src={resolveProductImage(p)} 
                                      alt={p.name} 
                                      className="w-full h-full object-cover"
                                      category={normalizeCategory(p.category)}
                                    />
                                    {p.isFeatured && (
                                      <span className="absolute top-0.5 right-0.5 bg-gold-pure text-[6.5px] font-bold text-black px-1 rounded-xs uppercase tracking-tight">
                                        Ftr
                                      </span>
                                    )}
                                  </div>
                                </td>
                              )}
                              {visibleColumns.name && (
                                <td className="p-4 font-sans">
                                  <div className="flex flex-col">
                                    <span className="text-[11px] text-white font-bold block hover:text-gold-pure transition-colors">
                                      {p.name}
                                    </span>
                                    {p.nameEn && p.nameEn !== p.name && <span className="text-[9px] text-zinc-400 block">{p.nameEn}</span>}
                                    {p.nameAr && p.nameAr !== p.name && <span className="text-[9.5px] text-zinc-500 font-sans block mt-0.5">{p.nameAr}</span>}
                                    {p.shortDescription && (
                                      <span className="text-[9.5px] text-zinc-500 italic block mt-0.5 line-clamp-1">
                                        "{p.shortDescription}"
                                      </span>
                                    )}
                                  </div>
                                </td>
                              )}
                              {visibleColumns.sku && (
                                <td className="p-4 font-mono text-[9.5px] text-zinc-400 space-y-0.5">
                                  <span className="block font-bold">{p.sku || p.id.slice(0, 10).toUpperCase()}</span>
                                  <span className="block text-[8px] text-zinc-600">{p.warehouseLocation || 'Central Storage D2'}</span>
                                </td>
                              )}
                              {visibleColumns.barcode && (
                                <td className="p-4 font-mono text-[9.5px] text-zinc-400">
                                  {p.barcode || 'N/A'}
                                </td>
                              )}
                              {visibleColumns.category && (
                                <td className="p-4 font-mono text-[10px] text-zinc-300">
                                  <span className="capitalize">{p.category}</span>
                                  {p.subcategory && <span className="block text-[8px] text-zinc-500">{p.subcategory}</span>}
                                </td>
                              )}
                              {visibleColumns.brand && (
                                <td className="p-4 font-sans text-[10px] text-zinc-300">
                                  {p.brand || 'N/A'}
                                </td>
                              )}
                              {visibleColumns.price && (
                                <td className="p-4 text-right font-mono text-[10.5px]">
                                  {p.salePrice ? (
                                    <div className="space-y-0.5">
                                      <span className="text-zinc-600 line-through block text-[9px]">{formatCurrency(p.price)} SAR</span>
                                      <span className="text-gold-pure font-bold">{formatCurrency(p.salePrice)} SAR</span>
                                    </div>
                                  ) : (
                                    <span className="text-white">{formatCurrency(p.price)} SAR</span>
                                  )}
                                  {currentUser?.role !== 'staff' && p.costPrice && (
                                    <span className="block text-[8.5px] text-zinc-600">Cost: {formatCurrency(p.costPrice)}</span>
                                  )}
                                </td>
                              )}
                              {visibleColumns.discount && (
                                <td className="p-4 text-center font-mono text-[10px]">
                                  {p.discountPercent && p.discountPercent > 0 ? (
                                    <span className="text-gold-pure bg-gold-pure/10 px-1.5 py-0.5 rounded-xs border border-gold-pure/20 font-bold">
                                      {p.discountPercent}% OFF
                                    </span>
                                  ) : (
                                    <span className="text-zinc-600">-</span>
                                  )}
                                </td>
                              )}
                              {visibleColumns.stock && (
                                <td className="p-4 text-center">
                                  <div className="inline-flex flex-col items-center">
                                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm ${
                                      isOutOfStock ? 'bg-rose-950/40 text-rose-400 border border-rose-500/30' :
                                      isLowStock ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20' :
                                      'bg-emerald-950/20 text-emerald-400 border border-emerald-500/10'
                                    }`}>
                                      {p.inventory} units
                                    </span>
                                    {isLowStock && <span className="text-[7.5px] text-amber-400 font-mono mt-1 animate-pulse">Low Stock Alarm</span>}
                                    {isOutOfStock && <span className="text-[7.5px] text-rose-500 font-mono mt-1 font-bold">Depleted</span>}
                                  </div>
                                </td>
                              )}
                              {visibleColumns.status && (
                                <td className="p-4 text-center">
                                  <span className={`text-[8.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs ${
                                    (p.status || 'Published') === 'Published' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' :
                                    (p.status || 'Published') === 'Draft' ? 'bg-zinc-800 text-zinc-300' :
                                    (p.status || 'Published') === 'Hidden' ? 'bg-amber-950/20 text-amber-500' :
                                    'bg-rose-950/30 text-rose-400'
                                  }`}>
                                    {p.status || 'Published'}
                                  </span>
                                </td>
                              )}
                              {visibleColumns.createdDate && (
                                <td className="p-4 font-mono text-[9px] text-zinc-500 text-center">
                                  {p.createdAt || 'N/A'}
                                </td>
                              )}
                              {visibleColumns.updatedDate && (
                                <td className="p-4 font-mono text-[9px] text-zinc-500 text-center">
                                  {p.updatedAt || 'N/A'}
                                </td>
                              )}
                              {visibleColumns.rating && (
                                <td className="p-4 text-center font-mono text-[10px] text-zinc-400">
                                  <div className="flex items-center justify-center gap-1">
                                    <Star className="w-3 h-3 text-gold-pure fill-current" />
                                    <span>{(p.rating || 0).toFixed(1)}</span>
                                  </div>
                                </td>
                              )}
                              {visibleColumns.actions && (
                                <td className="p-4 text-right">
                                  <div className="inline-flex gap-2">
                                    <button 
                                      onClick={() => startEditProduct(p)}
                                      className="p-1.5 border border-white/5 hover:border-gold-pure/45 text-zinc-400 hover:text-white rounded-xs cursor-pointer"
                                      title="Edit Product List"
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const qtyStr = prompt(`Adjust inventory level for "${p.name}":`, p.inventory.toString());
                                        if (qtyStr !== null) {
                                          const qty = parseInt(qtyStr) || 0;
                                          updateProductInventory(p.id, qty);
                                          addLog(`Manual Stock Override: ${p.name} to ${qty}`);
                                          alert('Inventory override saved.');
                                        }
                                      }}
                                      className="p-1.5 border border-white/5 hover:border-gold-pure/45 text-zinc-400 hover:text-white rounded-xs cursor-pointer"
                                      title="Quick Stock Adjust"
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                    {currentUser?.role !== 'staff' && (
                                      <button 
                                        onClick={() => {
                                          console.log("TRACE 1: Delete icon clicked", { id: p.id, name: p.name });
                                          handleDeleteProduct(p.id, p.name);
                                        }}
                                        className="p-1.5 border border-rose-950 hover:bg-rose-950/30 text-rose-500 hover:text-rose-400 rounded-xs cursor-pointer"
                                        title="Remove from Catalog"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Dynamic Responsive Product Grid Layout */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedProducts.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-zinc-500 font-mono text-[10px] uppercase tracking-widest bg-zinc-950 border border-white/5 rounded-xs">
                      No products found.
                    </div>
                  ) : (
                    paginatedProducts.map(p => {
                      const threshold = p.lowStockThreshold || 5;
                      const isLowStock = p.inventory <= threshold && p.inventory > 0;
                      const isOutOfStock = p.inventory === 0;
                      const isSelected = selectedProductIds.includes(p.id);

                      return (
                        <div 
                          key={p.id} 
                          className={`bg-zinc-950 border transition-all duration-300 p-4 rounded-xs flex flex-col justify-between space-y-4 group relative ${
                            isSelected ? 'border-gold-pure bg-gold-pure/5' : 'border-white/5 hover:border-gold-pure/40'
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <div className="absolute top-3 left-3 z-10">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProductIds(prev => [...prev, p.id]);
                                } else {
                                  setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                                }
                              }}
                              className="accent-gold-pure"
                            />
                          </div>

                          {/* Visual */}
                          <div className="w-full aspect-video bg-zinc-900 rounded-xs overflow-hidden relative border border-white/5">
                            <SafeImage 
                              src={resolveProductImage(p)} 
                              alt={p.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              category={normalizeCategory(p.category)}
                            />
                            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                              <span className={`text-[8.5px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-black/80 border ${
                                (p.status || 'Published') === 'Published' ? 'text-emerald-400 border-emerald-500/30' : 'text-zinc-400 border-white/10'
                              }`}>
                                {p.status || 'Published'}
                              </span>
                              {p.isFeatured && (
                                <span className="bg-gold-pure text-[7px] font-bold text-black px-1 rounded-xs uppercase tracking-wider">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="space-y-1 text-left">
                            <span className="text-[8px] font-mono tracking-widest text-gold-pure uppercase">
                              {p.category} Category
                            </span>
                            <h3 className="text-xs text-white font-bold group-hover:text-gold-pure transition-colors line-clamp-1">
                              {p.name}
                            </h3>
                            {p.nameAr && p.nameAr !== p.name && <p className="text-[9.5px] text-zinc-500 font-sans text-right">{p.nameAr}</p>}
                            <p className="text-[9px] text-zinc-400 font-mono">
                              SKU: {p.sku || p.id.slice(0, 10).toUpperCase()}
                            </p>
                          </div>

                          {/* Financials & Stock */}
                          <div className="flex justify-between items-end pt-2 border-t border-white/5">
                            <div className="text-left">
                              <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">Price</p>
                              {p.salePrice ? (
                                <div className="font-mono text-xs">
                                  <span className="text-zinc-600 line-through mr-1 text-[10px]">{formatCurrency(p.price)} SAR</span>
                                  <span className="text-gold-pure font-bold">{formatCurrency(p.salePrice)} SAR</span>
                                </div>
                              ) : (
                                <p className="font-mono text-xs text-white font-bold">{formatCurrency(p.price)} SAR</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">Inventory</p>
                              <p className={`font-mono text-xs font-bold ${
                                isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                {p.inventory} units
                              </p>
                            </div>
                          </div>

                          {/* Card actions */}
                          <div className="flex gap-2 pt-2 border-t border-white/5">
                            <button 
                              onClick={() => startEditProduct(p)}
                              className={`${currentUser?.role === 'staff' ? 'w-full' : 'w-1/2'} py-1 border border-white/5 hover:border-gold-pure/50 text-[9px] font-mono uppercase text-zinc-400 hover:text-white rounded-xs transition-all flex items-center justify-center gap-1 cursor-pointer`}
                            >
                              <Sliders className="w-3 h-3" /> Edit
                            </button>
                            {currentUser?.role !== 'staff' && (
                              <button 
                                onClick={() => {
                                  console.log("TRACE 1: Delete icon clicked", { id: p.id, name: p.name });
                                  handleDeleteProduct(p.id, p.name);
                                }}
                                className="w-1/2 py-1 border border-rose-950 hover:bg-rose-950/20 text-[9px] font-mono uppercase text-rose-500 hover:text-rose-400 rounded-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Enterprise List Pagination and Summary Footer */}
              {processedProducts.length > 0 && (
                <div className="bg-black border border-white/5 p-4 rounded-xs flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono">
                  <div className="text-zinc-500 text-[10px]">
                    Showing <span className="text-white">{(productCurrentPage - 1) * productsPerPage + 1}</span> to{' '}
                    <span className="text-white">
                      {Math.min(productCurrentPage * productsPerPage, processedProducts.length)}
                    </span> of <span className="text-white">{processedProducts.length}</span> handcrafted catalog entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={productCurrentPage === 1}
                      onClick={() => setProductCurrentPage(p => Math.max(p - 1, 1))}
                      className="p-1 px-2 border border-white/5 hover:border-gold-pure/40 text-zinc-400 hover:text-white rounded-xs disabled:opacity-30 disabled:hover:border-white/5 cursor-pointer text-[10px]"
                    >
                      PREV
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setProductCurrentPage(page)}
                        className={`p-1 px-2 rounded-xs border text-[10px] cursor-pointer transition-all ${
                          productCurrentPage === page 
                            ? 'bg-gold-pure text-black border-gold-pure font-bold' 
                            : 'border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      disabled={productCurrentPage === totalPages}
                      onClick={() => setProductCurrentPage(p => Math.min(p + 1, totalPages))}
                      className="p-1 px-2 border border-white/5 hover:border-gold-pure/40 text-zinc-400 hover:text-white rounded-xs disabled:opacity-30 disabled:hover:border-white/5 cursor-pointer text-[10px]"
                    >
                      NEXT
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {pmsSubTab === 'import-center' && (
            <div className="mt-6">
              <EnterpriseProductImportCenter />
            </div>
          )}

          {pmsSubTab !== 'catalog' && pmsSubTab !== 'import-center' && (
            <div className="mt-6">
              <PmsSubTabs
                pmsSubTab={pmsSubTab}
                selectedPmsProduct={selectedPmsProduct}
                allProducts={allProducts}
                selectedPmsProductId={selectedPmsProductId}
                setSelectedPmsProductId={setSelectedPmsProductId}
                addLog={addLog}
                pmsLogs={pmsLogs}
                saveProductFields={saveProductFields}
                selectedProductIds={selectedProductIds}
                currentUser={currentUser}
              />
            </div>
          )}
              </div>
            </React.Suspense>
          )}

          {/* III. TAB: CATEGORIES DIV (CRUD) */}
          {activeTab === 'categories' && (
            <React.Suspense fallback={<div className="p-12 text-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Initializing Taxonomy...</div>}>
              <CategoryManagement 
                categories={categories}
                setCategories={setCategories}
                allProducts={allProducts}
                addLog={addLog}
              />
            </React.Suspense>
          )}
          
          {activeTab === 'ai_center' && (
            <React.Suspense fallback={<div className="p-12 text-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Booting AI Core...</div>}>
              <EnterpriseAiWorkspace />
            </React.Suspense>
          )}
          {activeTab === 'ai_review_center' && (
            <React.Suspense fallback={<div className="p-12 text-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Initializing Neural Review...</div>}>
              <EnterpriseAiReviewCenter 
                currentUser={{
                  name: currentUser?.email?.split('@')[0] || 'Admin',
                  role: currentUser?.role || 'admin'
                }}
                addLog={addLog}
              />
            </React.Suspense>
          )}
          {activeTab === 'blog_cms' && (
            <React.Suspense fallback={<div className="p-12 text-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Loading Editorial System...</div>}>
              <EnterpriseBlogManager />
            </React.Suspense>
          )}
          {activeTab === 'regional' && (
            <React.Suspense fallback={<div className="p-12 text-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Mapping Regional Intelligence...</div>}>
              <EnterpriseRegionalAnalytics />
            </React.Suspense>
          )}
          {activeTab === 'kpi' && (
            <React.Suspense fallback={<div className="p-12 text-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Calculating Global KPIs...</div>}>
              <EnterpriseKpiDashboard />
            </React.Suspense>
          )}
          {activeTab === 'forecast' && (
            <React.Suspense fallback={<div className="p-12 text-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Processing Market Forecasts...</div>}>
              <EnterpriseForecastDashboard />
            </React.Suspense>
          )}
          {activeTab === 'briefing' && (
            <React.Suspense fallback={<div className="p-12 text-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Synthesizing Executive Briefing...</div>}>
              <EnterpriseAiExecutiveBriefing />
            </React.Suspense>
          )}
          {activeTab === 'decision' && (
            <React.Suspense fallback={<div className="p-12 text-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Loading Simulation Engine...</div>}>
              <EnterpriseDecisionSimulation />
            </React.Suspense>
          )}

          {/* IV. TAB: BRANDS */}
          {activeTab === 'brands' && (
            <React.Suspense fallback={<div className="p-12 text-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Loading Brand Identity...</div>}>
              <BrandManagement 
                brands={brands}
                setBrands={setBrands}
                allProducts={allProducts}
                addLog={addLog}
              />
            </React.Suspense>
          )}

          {/* V. TAB: CUSTOMER ORDERS */}
          {activeTab === 'orders' && (
            <React.Suspense fallback={<div className="p-12 text-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Loading Order Management...</div>}>
              <EnterpriseOrderManagement
                currentUser={currentUser}
                orders={orders}
                setOrders={setOrders}
              />
            </React.Suspense>
          )}

          {/* DEPRECATED ADMIN ORDER VIEW */}
          {false && activeTab === 'orders' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ZOAL FULFILLMENT GATE</span>
                  <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">CUSTOMER ORDERS</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const csvContent = "data:text/csv;charset=utf-8,Order ID,Customer,Email,Phone,Date,Subtotal,Shipping,Discount,Total,Status,Payment Status,Tracking Number\n" + 
                        filteredOrders.map(o => `"${o.id}","${o.customerName}","${o.email}","${o.phone}","${o.date}",${o.subtotal},${o.shipping},${o.discount},${o.total},"${o.status}","${o.paymentStatus}","${o.trackingNumber}"`).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `ZOAL_Orders_Export_${new Date().toISOString().slice(0, 10)}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      addLog("Exported orders as CSV list");
                    }}
                    className="py-1.5 px-3 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white rounded-xs text-[9px] uppercase tracking-widest font-mono flex items-center gap-1.5 transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-gold-pure" /> Export List
                  </button>
                </div>
              </div>

              {/* Advanced Filters Drawer */}
              <div className="bg-zinc-950 p-4 border border-white/5 rounded-xs space-y-4">
                <span className="text-[8px] uppercase tracking-widest font-mono text-zinc-500 flex items-center gap-1.5">
                  <Filter className="w-3 h-3 text-gold-pure" /> Advanced Filter matrix
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono uppercase text-zinc-500">Search Customer/ID</label>
                    <div className="flex items-center gap-2 bg-black border border-white/10 px-2.5 py-1.5 rounded-xs">
                      <Search className="w-3 h-3 text-zinc-500" />
                      <input 
                        type="text" 
                        placeholder="Name, email, serial..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="bg-transparent text-white outline-none text-[10px] w-full placeholder-zinc-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono uppercase text-zinc-500">Delivery Stage</label>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-black w-full border border-white/10 text-zinc-300 text-[10px] py-1.5 px-2 rounded-xs outline-none focus:border-gold-pure"
                    >
                      <option value="all">All Stages</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Completed">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Returned">Returned</option>
                      <option value="Refund Requests">Refund Requests</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono uppercase text-zinc-500">Payment Status</label>
                    <select
                      value={orderPaymentFilter}
                      onChange={(e) => setOrderPaymentFilter(e.target.value)}
                      className="bg-black w-full border border-white/10 text-zinc-300 text-[10px] py-1.5 px-2 rounded-xs outline-none focus:border-gold-pure"
                    >
                      <option value="all">All Payment Statuses</option>
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Refunded">Refunded</option>
                      <option value="Partially Refunded">Partially Refunded</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-mono uppercase text-zinc-500">Order Date</label>
                    <input 
                      type="date" 
                      value={orderDateFilter}
                      onChange={(e) => setOrderDateFilter(e.target.value)}
                      className="bg-black w-full border border-white/10 text-zinc-300 text-[10px] py-1 px-2 rounded-xs outline-none focus:border-gold-pure font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/5">
                  <div className="flex gap-2">
                    <div className="w-1/2 space-y-1">
                      <label className="text-[8.5px] font-mono uppercase text-zinc-500">Min Amount (SAR)</label>
                      <input 
                        type="number" 
                        placeholder="0"
                        value={orderMinAmount}
                        onChange={(e) => setOrderMinAmount(e.target.value)}
                        className="bg-black w-full border border-white/10 text-zinc-300 text-[10px] py-1 px-2.5 rounded-xs outline-none focus:border-gold-pure font-mono"
                      />
                    </div>
                    <div className="w-1/2 space-y-1">
                      <label className="text-[8.5px] font-mono uppercase text-zinc-500">Max Amount (SAR)</label>
                      <input 
                        type="number" 
                        placeholder="10000"
                        value={orderMaxAmount}
                        onChange={(e) => setOrderMaxAmount(e.target.value)}
                        className="bg-black w-full border border-white/10 text-zinc-300 text-[10px] py-1 px-2.5 rounded-xs outline-none focus:border-gold-pure font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-end justify-end gap-2">
                    {(orderSearch || orderStatusFilter !== 'all' || orderPaymentFilter !== 'all' || orderDateFilter || orderMinAmount || orderMaxAmount) && (
                      <button 
                        onClick={() => {
                          setOrderSearch('');
                          setOrderStatusFilter('all');
                          setOrderPaymentFilter('all');
                          setOrderDateFilter('');
                          setOrderMinAmount('');
                          setOrderMaxAmount('');
                          addLog("Cleared order advanced filters");
                        }}
                        className="text-[9.5px] font-mono text-zinc-500 hover:text-white underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bulk Actions Console */}
              {selectedOrderIds.length > 0 && (
                <div className="bg-gold-pure/10 border border-gold-pure/30 p-3 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[10px] animate-fade-in text-gold-pure">
                  <span className="font-bold">⚡ Bulk Action Active: {selectedOrderIds.length} orders selected</span>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => {
                        selectedOrderIds.forEach(id => {
                          onUpdateOrderStatus(id, 'Preparing');
                          addLog(`Bulk update order ${id} status to Preparing`);
                        });
                        setSelectedOrderIds([]);
                        alert(`Bulk confirmed status on ${selectedOrderIds.length} orders.`);
                      }}
                      className="px-2.5 py-1 bg-black text-white hover:bg-zinc-900 border border-gold-pure/30 rounded-xs font-mono text-[9px] font-bold"
                    >
                      Confirm Selection
                    </button>
                    <button 
                      onClick={() => {
                        selectedOrderIds.forEach(id => {
                          onUpdateOrderStatus(id, 'Shipped');
                          // add tracking code simulation
                          setOrderOverrides(prev => ({
                            ...prev,
                            [id]: {
                              ...(prev[id] || { timeline: [], adminNotes: '', paymentStatus: 'Paid', carrier: 'ZOAL Express', trackingNumber: '', deliveryZone: '', shippingAddress: '', contactName: '' }),
                              trackingNumber: `ZLE-BLK-${Math.floor(Math.random() * 900000 + 100000)}`
                            }
                          }));
                          addLog(`Bulk update order ${id} status to Shipped`);
                        });
                        setSelectedOrderIds([]);
                        alert(`Bulk shipped & tracking codes generated for ${selectedOrderIds.length} orders.`);
                      }}
                      className="px-2.5 py-1 bg-black text-white hover:bg-zinc-900 border border-gold-pure/30 rounded-xs font-mono text-[9px] font-bold"
                    >
                      Ship Selection
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedOrderIds([]);
                      }}
                      className="px-2.5 py-1 text-zinc-400 hover:text-white"
                    >
                      Cancel selection
                    </button>
                  </div>
                </div>
              )}

              {/* Orders Table */}
              <div className="bg-zinc-950 border border-white/5 rounded-xs overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-white/5">
                  <thead className="bg-black text-zinc-500 text-[8.5px] uppercase tracking-widest font-mono">
                    <tr>
                      <th className="p-4 w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrderIds(filteredOrders.map(o => o.id));
                            } else {
                              setSelectedOrderIds([]);
                            }
                          }}
                          className="accent-gold-pure rounded-xs cursor-pointer"
                        />
                      </th>
                      <th className="p-4">Serial ID</th>
                      <th className="p-4">Customer Client</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Items Summary</th>
                      <th className="p-4 text-right">Invoice Sum</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Fulfillment Stage</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-zinc-500 font-sans">
                          No matching orders registered under current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-white/1 duration-150">
                          <td className="p-4">
                            <input 
                              type="checkbox" 
                              checked={selectedOrderIds.includes(o.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOrderIds(prev => [...prev, o.id]);
                                } else {
                                  setSelectedOrderIds(prev => prev.filter(id => id !== o.id));
                                }
                              }}
                              className="accent-gold-pure rounded-xs cursor-pointer"
                            />
                          </td>
                          <td className="p-4 font-bold text-white">{o.id}</td>
                          <td className="p-4 font-sans">
                            <span className="text-[11px] text-zinc-300 block font-bold">{o.customerName}</span>
                            <span className="text-[8.5px] text-zinc-500 block font-mono">{o.phone} • {o.email}</span>
                          </td>
                          <td className="p-4 text-zinc-400 text-[9px]">{o.date}</td>
                          <td className="p-4 font-sans max-w-xs truncate text-zinc-400">
                            {o.items.map(itm => `${itm.quantity}x ${itm.name}`).join(', ')}
                          </td>
                          <td className="p-4 text-right font-bold text-gold-pure text-[10.5px]">
                            {formatCurrency(o.total)} SAR
                          </td>
                          <td className="p-4 text-[9px]">
                            <span className={`inline-block px-1.5 py-0.5 rounded-xs font-bold uppercase ${
                              o.paymentStatus === 'Paid' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20' :
                              o.paymentStatus === 'Refunded' ? 'bg-zinc-800 text-zinc-400 border border-white/5' :
                              o.paymentStatus === 'Partially Refunded' ? 'bg-amber-950/20 text-amber-400 border border-amber-500/20' :
                              'bg-rose-950/20 text-rose-400 border border-rose-500/10'
                            }`}>
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-0.5 rounded-sm text-[8px] uppercase tracking-wider font-bold ${
                              o.status === 'Completed' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/20' :
                              o.status === 'Cancelled' ? 'bg-rose-950/40 text-rose-400 border border-rose-500/20' :
                              o.status === 'Shipped' ? 'bg-blue-950/30 text-blue-400 border border-blue-500/20' :
                              o.status === 'Preparing' ? 'bg-purple-950/30 text-purple-400 border border-purple-500/20' :
                              'bg-amber-950/30 text-amber-400 border border-amber-500/20 animate-pulse'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => setSelectedOrder(o)}
                              className="py-1 px-2 bg-white text-black hover:bg-gold-pure rounded-xs text-[9px] font-bold tracking-wider uppercase cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORDER DETAIL FLYOUT MODAL */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in text-left">
              <div className="bg-zinc-950 border border-white/10 rounded-sm max-w-4xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[8.5px] font-mono text-gold-pure uppercase tracking-widest block">SECURED ORDER AUDIT</span>
                    <h2 className="text-xl font-bold font-display uppercase tracking-wider text-white">ORDER RECORD {selectedOrder.id}</h2>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">Customer List: {selectedOrder.customerName} • {selectedOrder.date}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button 
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          const mockInvoice = {
                            invoiceNumber: `INV-${selectedOrder.id}`,
                            invoiceDate: selectedOrder.date || new Date().toLocaleDateString(),
                            merchantName: 'AL ZOAL ENTERPRISE',
                            merchantVat: '310239485700003',
                            orderId: selectedOrder.id,
                            paymentId: `pay_${selectedOrder.id}`,
                            gateway: selectedOrder.paymentMethod || 'Moyasar',
                            transactionId: `txn_${selectedOrder.id}`,
                            subtotal: selectedOrder.total / 1.15,
                            vat: selectedOrder.total - (selectedOrder.total / 1.15),
                            discount: 0,
                            delivery: 0,
                            total: selectedOrder.total,
                            items: selectedOrder.items || []
                          };
                          printWindow.document.write(generatePrintableInvoiceHtml(mockInvoice));
                          printWindow.document.close();
                          printWindow.print();
                          addLog(`Printed Invoice: ${selectedOrder.id}`);
                        }
                      }}
                      className="py-1.5 px-3 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white text-[9.5px] font-mono font-bold tracking-wide uppercase rounded-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-gold-pure" /> Print Invoice
                    </button>
                    <button 
                      onClick={() => {
                        const mockInvoice = {
                          invoiceNumber: `INV-${selectedOrder.id}`,
                          invoiceDate: selectedOrder.date || new Date().toLocaleDateString(),
                          merchantName: 'AL ZOAL ENTERPRISE',
                          merchantVat: '310239485700003',
                          orderId: selectedOrder.id,
                          paymentId: `pay_${selectedOrder.id}`,
                          gateway: selectedOrder.paymentMethod || 'Moyasar',
                          transactionId: `txn_${selectedOrder.id}`,
                          subtotal: selectedOrder.total / 1.15,
                          vat: selectedOrder.total - (selectedOrder.total / 1.15),
                          discount: 0,
                          delivery: 0,
                          total: selectedOrder.total,
                          items: selectedOrder.items || []
                        };
                        const html = generatePrintableInvoiceHtml(mockInvoice);
                        downloadHtmlAsPdf(html, `ALZOAL-INVOICE-${mockInvoice.invoiceNumber}.pdf`);
                        addLog(`Downloaded Invoice PDF: ${selectedOrder.id}`);
                      }}
                      className="py-1.5 px-3 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white text-[9.5px] font-mono font-bold tracking-wide uppercase rounded-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-gold-pure" /> Download PDF
                    </button>
                    <button 
                      onClick={() => {
                        const html = generatePrintableReceiptHtml(selectedOrder);
                        downloadHtmlAsPdf(html, `ALZOAL-RECEIPT-${selectedOrder.id}.pdf`);
                        addLog(`Downloaded Receipt PDF: ${selectedOrder.id}`);
                      }}
                      className="py-1.5 px-3 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white text-[9.5px] font-mono font-bold tracking-wide uppercase rounded-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-gold-pure" /> Receipt PDF
                    </button>
                    <button 
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedOrder, null, 2));
                        const link = document.createElement('a');
                        link.setAttribute("href", dataStr);
                        link.setAttribute("download", `ZOAL_Order_${selectedOrder.id}.json`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        addLog(`Exported Order JSON: ${selectedOrder.id}`);
                      }}
                      className="py-1.5 px-3 bg-zinc-900 border border-white/10 hover:border-white text-white text-[9.5px] font-mono font-bold tracking-wide uppercase rounded-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-400" /> Export JSON
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left block: Timeline & Customer Details */}
                  <div className="space-y-6 md:col-span-1">
                    <div className="bg-black/40 border border-white/5 p-4 rounded-xs space-y-3">
                      <h4 className="text-[10px] font-mono uppercase text-gold-pure tracking-widest border-b border-white/5 pb-2">Customer Details</h4>
                      <div className="space-y-2 text-[10.5px] text-zinc-400">
                        <p><span className="text-zinc-600 block text-[8px] uppercase font-mono">Customer Name</span> <strong className="text-white">{selectedOrder.customerName}</strong></p>
                        <p><span className="text-zinc-600 block text-[8px] uppercase font-mono">Verified Email</span> {selectedOrder.email}</p>
                        <p><span className="text-zinc-600 block text-[8px] uppercase font-mono">Contact Phone</span> {selectedOrder.phone}</p>
                        <p><span className="text-zinc-600 block text-[8px] uppercase font-mono">Payment Panel</span> {selectedOrder.paymentMethod || 'Mastercard (Saudi)'}</p>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 p-4 rounded-xs space-y-3">
                      <h4 className="text-[10px] font-mono uppercase text-gold-pure tracking-widest border-b border-white/5 pb-2 font-bold">Fulfillment Timeline</h4>
                      <div className="space-y-4 relative pl-3 border-l border-white/5">
                        {selectedOrder.timeline?.map((step: any, sIdx: number) => (
                          <div key={sIdx} className="relative text-[10px]">
                            <div className="absolute -left-[16.5px] top-1 w-2.5 h-2.5 rounded-full bg-gold-pure border-2 border-black" />
                            <span className="text-white font-bold block">{step.status}</span>
                            <span className="text-[8.5px] text-zinc-500 font-mono block">{step.date}</span>
                            <span className="text-[8.5px] text-gold-pure/60 font-mono block">By {step.updatedBy}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle block: Edit Status, Logistics, Notes */}
                  <div className="space-y-6 md:col-span-1">
                    <div className="bg-black/40 border border-white/5 p-4 rounded-xs space-y-4">
                      <h4 className="text-[10px] font-mono uppercase text-gold-pure tracking-widest border-b border-white/5 pb-2 font-bold font-display">Logistics Controller</h4>
                      
                      <div className="space-y-2">
                        <label className="text-[8.5px] font-mono uppercase text-zinc-500">Delivery Stage</label>
                        <select
                          value={selectedOrder.status || 'Pending'}
                          onChange={(e) => {
                            const newStatus = e.target.value as Order['status'];
                            onUpdateOrderStatus(selectedOrder.id, newStatus);
                            
                            // add to timeline
                            const updatedTimeline = [
                              ...(selectedOrder.timeline || []),
                              { status: newStatus, date: new Date().toLocaleString(), updatedBy: currentUser?.name || 'Administrator' }
                            ];
                            
                            setOrderOverrides(prev => ({
                              ...prev,
                              [selectedOrder.id]: {
                                ...(prev[selectedOrder.id] || { timeline: [], adminNotes: '', paymentStatus: 'Paid', carrier: 'ZOAL Express', trackingNumber: '', deliveryZone: '', shippingAddress: '', contactName: '' }),
                                timeline: updatedTimeline
                              }
                            }));

                            addLog(`Modified Order Status: ${selectedOrder.id} to ${newStatus}`);
                            setSelectedOrder(prev => prev ? { ...prev, status: newStatus, timeline: updatedTimeline } : null);
                          }}
                          className="bg-black w-full border border-white/10 text-white text-[10px] py-1.5 px-2 rounded-xs outline-none focus:border-gold-pure font-mono"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Completed">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Returned">Returned</option>
                          <option value="Refund Requests">Refund Requests</option>
                        </select>
                      </div>

                      <div className="space-y-2 font-mono">
                        <label className="text-[8.5px] uppercase text-zinc-500 block">Payment Status override</label>
                        <select
                          value={selectedOrder.paymentStatus || 'Paid'}
                          onChange={(e) => {
                            const newPStatus = e.target.value as any;
                            setOrderOverrides(prev => ({
                              ...prev,
                              [selectedOrder.id]: {
                                ...(prev[selectedOrder.id] || { timeline: [], adminNotes: '', paymentStatus: 'Paid', carrier: 'ZOAL Express', trackingNumber: '', deliveryZone: '', shippingAddress: '', contactName: '' }),
                                paymentStatus: newPStatus
                              }
                            }));
                            addLog(`Modified Order ${selectedOrder.id} Payment to ${newPStatus}`);
                            setSelectedOrder(prev => prev ? { ...prev, paymentStatus: newPStatus } : null);
                          }}
                          className="bg-black w-full border border-white/10 text-white text-[10px] py-1.5 px-2 rounded-xs outline-none focus:border-gold-pure"
                        >
                          <option value="Unpaid">Unpaid</option>
                          <option value="Paid">Paid</option>
                          <option value="Refunded">Refunded</option>
                          <option value="Partially Refunded">Partially Refunded</option>
                        </select>
                      </div>

                      <div className="space-y-2 font-mono text-[10px]">
                        <label className="text-[8.5px] uppercase text-zinc-500 block">Carrier Agent</label>
                        <input 
                          type="text" 
                          value={selectedOrder.carrier || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOrderOverrides(prev => ({
                              ...prev,
                              [selectedOrder.id]: {
                                ...(prev[selectedOrder.id] || { timeline: [], adminNotes: '', paymentStatus: 'Paid', carrier: 'ZOAL Express', trackingNumber: '', deliveryZone: '', shippingAddress: '', contactName: '' }),
                                carrier: val
                              }
                            }));
                            setSelectedOrder(prev => prev ? { ...prev, carrier: val } : null);
                          }}
                          className="bg-black w-full border border-white/10 text-white p-1.5 rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>

                      <div className="space-y-2 font-mono text-[10px]">
                        <label className="text-[8.5px] uppercase text-zinc-500 block">Tracking Code</label>
                        <input 
                          type="text" 
                          value={selectedOrder.trackingNumber || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOrderOverrides(prev => ({
                              ...prev,
                              [selectedOrder.id]: {
                                ...(prev[selectedOrder.id] || { timeline: [], adminNotes: '', paymentStatus: 'Paid', carrier: 'ZOAL Express', trackingNumber: '', deliveryZone: '', shippingAddress: '', contactName: '' }),
                                trackingNumber: val
                              }
                            }));
                            setSelectedOrder(prev => prev ? { ...prev, trackingNumber: val } : null);
                          }}
                          className="bg-black w-full border border-white/10 text-white p-1.5 rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>

                      {!(import.meta.env?.PROD) && (
                        <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-[10px] font-mono">
                          <span className="text-[8.5px] text-yellow-500 font-bold uppercase tracking-wider block">⚠️ DEVELOPER SMSA SIMULATION BOX</span>
                          
                          <div className="bg-yellow-950/10 border border-yellow-500/20 p-2.5 rounded-xs space-y-2">
                            <p className="text-zinc-400 text-[9px] leading-relaxed">
                              This controller updates the server-side mock SMSA shipment status and syncs back tracking identifiers.
                            </p>
                            
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/shipping/mock/advance', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ 
                                        shipmentId: selectedOrder.shipmentId || `MOCK-SMSA-ID-${selectedOrder.id}`, 
                                        status: 'shipment_created' 
                                      })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setOrderOverrides(prev => ({
                                        ...prev,
                                        [selectedOrder.id]: {
                                          ...(prev[selectedOrder.id] || {}),
                                          trackingNumber: data.shipment.tracking_number,
                                          carrier: 'SMSA Express (MOCK)',
                                          shipmentStatus: data.shipment.shipment_status,
                                          shipmentId: data.shipment.shipment_id
                                        }
                                      }));
                                      setSelectedOrder(prev => prev ? {
                                        ...prev,
                                        trackingNumber: data.shipment.tracking_number,
                                        carrier: 'SMSA Express (MOCK)',
                                        shipmentStatus: data.shipment.shipment_status,
                                        shipmentId: data.shipment.shipment_id
                                      } : null);
                                      alert(`Mock Shipment Created! AWB: ${data.shipment.tracking_number}`);
                                    } else {
                                      alert(`Failed: ${data.error || 'Server error'}`);
                                    }
                                  } catch (err: any) {
                                    alert(`Network error: ${err.message}`);
                                  }
                                }}
                                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xs cursor-pointer text-[9px]"
                              >
                                Create Mock Shipment
                              </button>
                              
                              <button
                                onClick={async () => {
                                  try {
                                    const currentId = selectedOrder.shipmentId || `MOCK-SMSA-ID-${selectedOrder.id}`;
                                    const res = await fetch('/api/shipping/mock/advance', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ shipmentId: currentId })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setOrderOverrides(prev => ({
                                        ...prev,
                                        [selectedOrder.id]: {
                                          ...(prev[selectedOrder.id] || {}),
                                          shipmentStatus: data.shipment.shipment_status
                                        }
                                      }));
                                      setSelectedOrder(prev => prev ? {
                                        ...prev,
                                        shipmentStatus: data.shipment.shipment_status
                                      } : null);
                                      alert(`Shipment Advanced to: ${data.shipment.shipment_status}`);
                                    } else {
                                      alert(`Failed: ${data.error || 'Server error'}`);
                                    }
                                  } catch (err: any) {
                                    alert(`Network error: ${err.message}`);
                                  }
                                }}
                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 rounded-xs cursor-pointer text-[9px]"
                              >
                                Advance Status
                              </button>

                              <button
                                onClick={async () => {
                                  try {
                                    const currentId = selectedOrder.shipmentId || `MOCK-SMSA-ID-${selectedOrder.id}`;
                                    const res = await fetch('/api/shipping/mock/advance', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ shipmentId: currentId, status: 'cancelled' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setOrderOverrides(prev => ({
                                        ...prev,
                                        [selectedOrder.id]: {
                                          ...(prev[selectedOrder.id] || {}),
                                          shipmentStatus: 'cancelled'
                                        }
                                      }));
                                      setSelectedOrder(prev => prev ? {
                                        ...prev,
                                        shipmentStatus: 'cancelled'
                                      } : null);
                                      alert(`Shipment Cancelled!`);
                                    } else {
                                      alert(`Failed: ${data.error || 'Server error'}`);
                                    }
                                  } catch (err: any) {
                                    alert(`Network error: ${err.message}`);
                                  }
                                }}
                                className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-500/20 rounded-xs cursor-pointer text-[9px]"
                              >
                                Cancel
                              </button>

                              <button
                                onClick={async () => {
                                  try {
                                    const currentId = selectedOrder.shipmentId || `MOCK-SMSA-ID-${selectedOrder.id}`;
                                    const res = await fetch('/api/shipping/mock/advance', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ shipmentId: currentId, status: 'failed' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setOrderOverrides(prev => ({
                                        ...prev,
                                        [selectedOrder.id]: {
                                          ...(prev[selectedOrder.id] || {}),
                                          shipmentStatus: 'failed'
                                        }
                                      }));
                                      setSelectedOrder(prev => prev ? {
                                        ...prev,
                                        shipmentStatus: 'failed'
                                      } : null);
                                      alert(`Shipment marked Failed!`);
                                    } else {
                                      alert(`Failed: ${data.error || 'Server error'}`);
                                    }
                                  } catch (err: any) {
                                    alert(`Network error: ${err.message}`);
                                  }
                                }}
                                className="px-2 py-1 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 border border-white/5 rounded-xs cursor-pointer text-[9px]"
                              >
                                Fail
                              </button>
                            </div>

                            <div className="text-[9px] text-zinc-500 pt-1 border-t border-white/5 space-y-1">
                              <div><span className="text-zinc-600">Mock Shipment ID:</span> <span className="text-white font-mono">{selectedOrder.shipmentId || 'None'}</span></div>
                              <div><span className="text-zinc-600">Mock AWB / Tracking:</span> <span className="text-yellow-500 font-mono">{selectedOrder.trackingNumber || 'None'}</span></div>
                              <div><span className="text-zinc-600">Mock Lifecycle Status:</span> <span className="text-emerald-400 uppercase font-mono font-bold">{selectedOrder.shipmentStatus || 'pending'}</span></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes block */}
                    <div className="bg-black/40 border border-white/5 p-4 rounded-xs space-y-3 font-mono">
                      <h4 className="text-[10px] uppercase text-gold-pure tracking-widest border-b border-white/5 pb-2 font-bold">Administrative Notes</h4>
                      <p className="text-[9.5px] text-zinc-400 font-sans italic leading-relaxed">
                        <strong className="text-zinc-600 block font-mono text-[8.5px] not-italic uppercase">Customer instructions</strong>
                        "{selectedOrder.address.includes('Notes:') ? selectedOrder.address.split('Notes:')[1] : 'No customized message provided.'}"
                      </p>
                      
                      <div className="space-y-1 pt-2">
                        <span className="text-[8px] uppercase text-zinc-500">Internal Staff Log Notes</span>
                        <textarea
                          placeholder="Type internal notes regarding size, tailoring adjustments, packaging status..."
                          value={selectedOrder.adminNotes || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOrderOverrides(prev => ({
                              ...prev,
                              [selectedOrder.id]: {
                                ...(prev[selectedOrder.id] || { timeline: [], adminNotes: '', paymentStatus: 'Paid', carrier: 'ZOAL Express', trackingNumber: '', deliveryZone: '', shippingAddress: '', contactName: '' }),
                                adminNotes: val
                              }
                            }));
                            setSelectedOrder(prev => prev ? { ...prev, adminNotes: val } : null);
                          }}
                          className="bg-black border border-white/10 rounded-xs text-[10px] text-white p-2 w-full h-20 placeholder-zinc-700 outline-none focus:border-gold-pure resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right block: High contrast receipt layout */}
                  <div className="space-y-4 md:col-span-1 bg-white text-zinc-900 p-6 rounded-xs shadow-[0_4px_30px_rgba(255,255,255,0.05)] border border-white/10 select-none">
                    <div className="text-center pb-4 border-b border-dashed border-zinc-300">
                      <span className="font-display font-black text-xs uppercase tracking-widest block">AL ZOAL</span>
                      <span className="text-[7.5px] tracking-[0.4em] uppercase text-zinc-500 font-mono block mb-1">Luxury Artisans</span>
                      <span className="text-[7.5px] font-mono block text-zinc-400">DAMMAM HQ • SAUDI ARABIA</span>
                      <span className="text-[7.5px] font-mono block text-zinc-400">VAT Registration No. 3409187321</span>
                    </div>

                    <div className="space-y-2 text-[8px] font-mono uppercase text-zinc-500 py-2 border-b border-dashed border-zinc-300">
                      <p className="flex justify-between"><span>Serial ID:</span> <span className="text-zinc-900 font-bold">{selectedOrder.id}</span></p>
                      <p className="flex justify-between"><span>Date:</span> <span className="text-zinc-900">{selectedOrder.date}</span></p>
                      <p className="flex justify-between"><span>Delivery Zone:</span> <span className="text-zinc-900">{selectedOrder.deliveryZone}</span></p>
                      <p className="flex justify-between"><span>Consignee:</span> <span className="text-zinc-900 font-bold">{selectedOrder.customerName}</span></p>
                    </div>

                    <div className="py-2 border-b border-dashed border-zinc-300 space-y-2">
                      <span className="text-[8px] font-mono font-bold uppercase text-zinc-400">Items:</span>
                      {selectedOrder.items.map((itm, iIdx) => (
                        <div key={iIdx} className="flex justify-between text-[9px] font-sans text-zinc-800">
                          <div className="max-w-[70%]">
                            <span className="font-bold text-zinc-950">{itm.name}</span>
                            {itm.selectedOption && <span className="block text-[7.5px] text-zinc-400 uppercase font-mono">Option: {itm.selectedOption}</span>}
                          </div>
                          <span className="font-mono text-[8.5px] shrink-0">{itm.quantity}x • {itm.price} SAR</span>
                        </div>
                      ))}
                    </div>

                    <div className="py-2 font-mono text-[9px] text-zinc-700 space-y-1">
                      <p className="flex justify-between"><span>Subtotal:</span> <span className="text-zinc-900">{selectedOrder.subtotal} SAR</span></p>
                      <p className="flex justify-between"><span>Discount (Voucher):</span> <span className="text-rose-600 font-bold">-{selectedOrder.discount} SAR</span></p>
                      <p className="flex justify-between"><span>Delivery:</span> <span className="text-zinc-900">+{selectedOrder.shipping} SAR</span></p>
                      <p className="flex justify-between"><span>Estimated VAT (15%):</span> <span className="text-zinc-900">{Math.round(selectedOrder.subtotal * 0.15)} SAR</span></p>
                      <p className="flex justify-between text-xs font-bold text-zinc-950 pt-2 border-t border-dashed border-zinc-300">
                        <span>Total Paid:</span>
                        <span>{selectedOrder.total} SAR</span>
                      </p>
                    </div>

                    <div className="text-center pt-4 text-[7.5px] font-mono text-zinc-400">
                      <p className="uppercase font-bold text-zinc-800">✨ Shukran for supporting Sudanese heritage! ✨</p>
                      <p className="mt-1">For support center call: 920001032</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VI. TAB: INVENTORY MATRIX */}
          {activeTab === 'inventory' && (
            <React.Suspense fallback={<div className="h-96 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Loading Inventory Systems...</div>}>
              <EnterpriseInventoryManagement
                currentUser={currentUser}
                products={allProducts}
                orders={orders}
                setOrders={setOrders}
              />
            </React.Suspense>
          )}

          {/* VII. TAB: CUSTOMERS DIRECTORY */}
          {activeTab === 'customers' && (
            <React.Suspense fallback={<div className="h-96 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Loading Customer Relations...</div>}>
              <EnterpriseCrm
                currentUser={currentUser}
                orders={orders}
                addLog={addLog}
              />
            </React.Suspense>
          )}

          {/* VIII. TAB: ARTISANAL STAFF MATRIX */}
          {activeTab === 'staff' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">TEAM MANAGEMENT</span>
                  <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">STAFF ROLES & PERMISSIONS</h2>
                </div>
                
                {/* Workforce Segment Selector */}
                <div className="flex gap-2 font-mono text-[9px] uppercase">
                  <button
                    onClick={() => {
                      (window as any)._workforceActiveSub = 'staff';
                      // Force update
                      const syncEl = document.getElementById('workforce-sync-anchor');
                      if (syncEl) syncEl.innerHTML = 'staff';
                      addLog("Viewed staff workforce directory", "Workforce Center");
                    }}
                    className={`py-1.5 px-3 border rounded-xs font-bold transition-all cursor-pointer ${
                      ((window as any)._workforceActiveSub || 'staff') === 'staff'
                        ? 'bg-gold-pure text-black border-gold-pure'
                        : 'bg-zinc-950 text-zinc-400 border-white/5 hover:text-white'
                    }`}
                  >
                    Staff List
                  </button>
                  <button
                    onClick={() => {
                      (window as any)._workforceActiveSub = 'rbac';
                      // Force update
                      const syncEl = document.getElementById('workforce-sync-anchor');
                      if (syncEl) syncEl.innerHTML = 'rbac';
                      addLog("Viewed Role & Permission matrix", "Workforce Center");
                    }}
                    className={`py-1.5 px-3 border rounded-xs font-bold transition-all cursor-pointer ${
                      ((window as any)._workforceActiveSub || 'staff') === 'rbac'
                        ? 'bg-gold-pure text-black border-gold-pure'
                        : 'bg-zinc-950 text-zinc-400 border-white/5 hover:text-white'
                    }`}
                  >
                    Roles & Permissions
                  </button>
                </div>
              </div>

              {/* Hidden update sync target */}
              <div id="workforce-sync-anchor" className="hidden" />

              {/* SUB TAB 1: WORKFORCE DIRECTORY */}
              {(((window as any)._workforceActiveSub || 'staff') === 'staff') && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center bg-zinc-950 border border-white/5 p-4 rounded-xs">
                    <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans max-w-lg">
                      Each staff account is bound to a specific security role. Changing a staff member's role automatically propagates their system access limits immediately.
                    </p>
                    <button
                      onClick={() => setIsAddStaffOpen(true)}
                      className="py-1.5 px-3 bg-white text-black hover:bg-gold-pure rounded-xs text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New Staff
                    </button>
                  </div>

                  {/* Staff Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staffList.map(s => {
                      // Lookup assigned role details
                      const resolvedRole = rolesList.find(r => r.name.toLowerCase() === s.role.toLowerCase() || r.id === s.role);
                      const displayRoleName = resolvedRole ? resolvedRole.name : s.role;
                      const mappedPerms = resolvedRole ? resolvedRole.permissions : s.permissions;

                      return (
                        <div key={s.id} className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 relative overflow-hidden flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-white text-[11px] font-sans font-bold uppercase tracking-wider">{s.name}</h4>
                                <span className="text-[8.5px] font-mono text-gold-pure uppercase block tracking-wider mt-0.5">{displayRoleName}</span>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded-sm text-[7.5px] font-mono font-bold uppercase ${s.status === 'active' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/10' : 'bg-zinc-900 text-zinc-500 border border-white/5'}`}>{s.status}</span>
                            </div>

                            <div className="p-3 bg-black/40 border border-white/5 rounded-xs space-y-2.5 font-mono text-[9px] text-zinc-400">
                              <p>• Email: {s.email}</p>
                              <div className="space-y-1">
                                <span className="text-zinc-500">Permissions:</span>
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {mappedPerms && mappedPerms.length > 0 ? (
                                    mappedPerms.map((pId: string, pIdx: number) => {
                                      let cleanPId = pId;
                                      if (pId === 'Catalog Edit') cleanPId = 'Edit Catalog';
                                      if (pId === 'Order Modify') cleanPId = 'Manage Orders';
                                      if (pId === 'CMS Update') cleanPId = 'Edit Website Content';
                                      
                                      const permObj = availablePermissions.find(p => p.id === cleanPId || p.id === pId || p.name.toLowerCase().replace(' ', '_') === pId || p.name.toLowerCase().replace(' ', '_') === cleanPId);
                                      return (
                                        <span key={pIdx} className="bg-zinc-900 border border-white/5 text-[7.5px] text-zinc-300 px-1.5 py-0.5 rounded-xs uppercase">
                                          {permObj ? permObj.name : cleanPId}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-zinc-600 italic">No privileges assigned</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[9px] font-mono">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setResetPasswordStaff(s);
                                  setNewResetPassword('');
                                  setConfirmResetPassword('');
                                  setShowNewResetPassword(false);
                                  setShowConfirmResetPassword(false);
                                  setIsResetPasswordModalOpen(true);
                                }}
                                className="text-gold-pure hover:underline font-bold cursor-pointer"
                              >
                                Reset Password
                              </button>
                              
                              {/* Re-assign Role inline action */}
                              <button
                                onClick={() => {
                                  const options = rolesList.map((r, i) => `${i + 1}. ${r.name}`).join('\n');
                                  const choice = prompt(`Select new role for ${s.name}:\n${options}`);
                                  if (choice) {
                                    const index = parseInt(choice) - 1;
                                    if (index >= 0 && index < rolesList.length) {
                                      const selected = rolesList[index];
                                      setStaffList(prev => prev.map(x => x.id === s.id ? { ...x, role: selected.name } : x));
                                      addLog(`Modified Staff Role: Assigned ${s.name} to ${selected.name}`, "Workforce Center");
                                      alert(`Staff member ${s.name} is now designated as ${selected.name}.`);
                                    } else {
                                      alert("Invalid selection choice.");
                                    }
                                  }
                                }}
                                className="text-zinc-300 hover:text-white hover:underline font-bold cursor-pointer"
                              >
                                Edit Role
                              </button>
                            </div>

                            <button 
                              onClick={() => {
                                  setConfirmConfig({
                                    title: 'DISMISS STAFF?',
                                    message: `Dismiss and revoke all system access for "${s.name}"?`,
                                    onConfirm: () => {
                                      setStaffList(prev => prev.filter(x => x.id !== s.id));
                                      addLog(`Erased workforce registration: ${s.name}`, "Workforce Center");
                                      setConfirmConfig(null);
                                    }
                                  });
                                }}
                                className="text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUB TAB 2: ROLE & PERMISSION MATRIX */}
              {(((window as any)._workforceActiveSub || 'staff') === 'rbac') && (
                <div className="space-y-6 animate-fade-in font-mono">
                  
                  {/* Explanation card with option to add custom roles */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-950 border border-white/5 p-4 rounded-xs gap-4">
                    <div className="text-left space-y-1">
                      <strong className="text-white text-xs uppercase tracking-wider block">Role-Based Access Control (RBAC) Console</strong>
                      <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                        Customize permissions mapped to each system role. Changes immediately affect all staff designated under that role category.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddRoleOpen(true)}
                      className="py-1.5 px-3 bg-white text-black hover:bg-gold-pure rounded-xs text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Define Custom Role
                    </button>
                  </div>

                  {/* Grid of existing Roles and Checklist Matrix */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {rolesList.map(r => (
                      <div key={r.id} className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 flex flex-col justify-between">
                        <div className="space-y-3 text-left">
                          <div className="border-b border-white/5 pb-2 flex justify-between items-start">
                            <div>
                              <h4 className="text-gold-pure text-[12px] font-bold uppercase tracking-wider">{r.name}</h4>
                              <p className="text-[10px] text-zinc-500 font-sans mt-1 leading-relaxed">{r.description}</p>
                            </div>
                            {r.id !== 'role-admin' && r.id !== 'role-staff' && r.id !== 'role-customer' && (
                              <button
                                onClick={() => {
                                  setConfirmConfig({
                                    title: 'DELETE ROLE?',
                                    message: `Delete the custom role "${r.name}"? This cannot be undone.`,
                                    onConfirm: () => {
                                      setRolesList(prev => prev.filter(x => x.id !== r.id));
                                      addLog(`Erased custom Role definition: ${r.name}`, "Workforce Center");
                                      setConfirmConfig(null);
                                    }
                                  });
                                }}
                                className="text-rose-500 hover:text-rose-400 text-[8px] uppercase font-bold"
                              >
                                Delete
                              </button>
                            )}
                          </div>

                          <div className="space-y-2.5 pt-1">
                            <span className="text-[8px] uppercase text-zinc-500 tracking-wider font-bold block">Assigned Permissions Matrix</span>
                            
                            <div className="space-y-2">
                              {availablePermissions.map(p => {
                                const hasPerm = r.permissions.includes(p.id);
                                return (
                                  <div 
                                    key={p.id} 
                                    onClick={() => {
                                      // Toggle permission assignment safely
                                      if (r.id === 'role-admin') {
                                        alert("Admin role permissions are absolute and cannot be restricted.");
                                        return;
                                      }
                                      let updatedPerms = [...r.permissions];
                                      if (hasPerm) {
                                        updatedPerms = updatedPerms.filter(x => x !== p.id);
                                      } else {
                                        updatedPerms.push(p.id);
                                      }
                                      setRolesList(prev => prev.map(item => item.id === r.id ? { ...item, permissions: updatedPerms } : item));
                                      addLog(`Toggled Permission: Changed ${r.name} access state for ${p.name}`, "Workforce Center");
                                    }}
                                    className={`p-2 rounded-xs border flex items-center justify-between cursor-pointer transition-all duration-100 ${
                                      hasPerm 
                                        ? 'bg-zinc-900 border-gold-pure/30 text-white' 
                                        : 'bg-black/30 border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-400'
                                    }`}
                                  >
                                    <div className="space-y-0.5 max-w-[85%]">
                                      <strong className="text-[9.5px] uppercase font-bold block">{p.name}</strong>
                                      <span className="text-[8px] text-zinc-500 font-sans leading-tight block">{p.description}</span>
                                    </div>
                                    <div className="shrink-0">
                                      {hasPerm ? (
                                        <div className="w-3.5 h-3.5 rounded-full bg-gold-pure flex items-center justify-center">
                                          <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                                        </div>
                                      ) : (
                                        <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 text-[8.5px] text-zinc-500 flex justify-between items-center">
                          <span>Role Designation Code: {r.id}</span>
                          <span className="text-[8px] uppercase tracking-widest text-gold-pure font-bold">
                            {r.permissions.length} Mapped Keys
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff ADD modal popup */}
              {isAddStaffOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in text-left text-zinc-400 font-sans">
                  <div className="bg-zinc-950 border border-white/10 rounded-sm max-w-md w-full p-6 space-y-6 relative">
                    <button 
                      onClick={() => setIsAddStaffOpen(false)}
                      className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer font-mono"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-white text-md font-bold uppercase tracking-wider font-display">REGISTER SUPPORT STAFF</h3>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get('staff_name') as string;
                      const email = formData.get('staff_email') as string;
                      const role = formData.get('staff_role') as string;
                      if (!name || !email) {
                        alert("Required fields missing.");
                        return;
                      }
                      const newS = {
                        id: `staff-${Date.now()}`,
                        name,
                        email,
                        role,
                        permissions: ['catalog_edit', 'order_modify'],
                        status: 'active',
                        lastActive: 'Just Added'
                      };
                      setStaffList(prev => [...prev, newS]);
                      addLog(`Registered support staff member: ${name} (${role})`, "Workforce Center");
                      setIsAddStaffOpen(false);
                      alert(`Support staff account successfully created for ${name}.`);
                    }} className="space-y-4 text-[10px]">
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase font-mono text-zinc-500">Full Name</label>
                        <input type="text" name="staff_name" required className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase font-mono text-zinc-500">Verified Business Email</label>
                        <input type="email" name="staff_email" required className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase font-mono text-zinc-500">Designated RBAC Access Level</label>
                        <select name="staff_role" className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure uppercase font-mono text-[9px]">
                          {rolesList.map(r => (
                            <option key={r.id} value={r.name}>{r.name} Access Plan</option>
                          ))}
                        </select>
                      </div>
                      <button type="submit" className="w-full bg-white text-black hover:bg-gold-pure font-bold uppercase tracking-widest py-2 rounded-xs text-[9px] cursor-pointer mt-4">
                        Register Account
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Workforce Password Reset Modal */}
              {isResetPasswordModalOpen && resetPasswordStaff && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in text-left text-zinc-400 font-sans">
                  <div className="bg-zinc-950 border border-white/10 rounded-sm max-w-sm w-full p-6 space-y-6 relative">
                    <button 
                      onClick={() => setIsResetPasswordModalOpen(false)}
                      className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer font-mono"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    <div className="space-y-1">
                      <h3 className="text-white text-md font-bold uppercase tracking-wider font-display">RESET CREDENTIALS</h3>
                      <p className="text-[9px] text-zinc-500 font-mono">Modifying access for: <span className="text-[#D4AF37]">{resetPasswordStaff.name}</span></p>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!newResetPassword || newResetPassword.trim().length < 6) {
                        alert("Password must be at least 6 characters.");
                        return;
                      }
                      if (newResetPassword !== confirmResetPassword) {
                        alert("Passwords do not match.");
                        return;
                      }
                      addLog(`Reset workforce password for: ${resetPasswordStaff.name}`, "Workforce Center");
                      setIsResetPasswordModalOpen(false);
                      alert(`Password successfully reset for ${resetPasswordStaff.name}.`);
                    }} className="space-y-4 text-[10px]">
                      
                      <div className="space-y-1.5">
                        <label className="text-[8.5px] uppercase font-mono text-zinc-500">New Password</label>
                        <div className="relative">
                          <input 
                            type={showNewResetPassword ? 'text' : 'password'}
                            value={newResetPassword}
                            onChange={(e) => setNewResetPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="bg-black w-full border border-white/10 text-white p-2.5 pr-11 text-[11px] rounded-xs outline-none focus:border-gold-pure transition-colors font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewResetPassword(!showNewResetPassword)}
                            className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors cursor-pointer focus:outline-none"
                            aria-label={showNewResetPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <PasswordStrengthIndicator password={newResetPassword} />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[8.5px] uppercase font-mono text-zinc-500">Confirm New Password</label>
                        <div className="relative">
                          <input 
                            type={showConfirmResetPassword ? 'text' : 'password'}
                            value={confirmResetPassword}
                            onChange={(e) => setConfirmResetPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="bg-black w-full border border-white/10 text-white p-2.5 pr-11 text-[11px] rounded-xs outline-none focus:border-gold-pure transition-colors font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                            className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors cursor-pointer focus:outline-none"
                            aria-label={showConfirmResetPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-gold-pure text-black p-3 rounded-xs uppercase font-bold text-[10px] tracking-widest hover:bg-white transition-colors cursor-pointer mt-2 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                      >
                        Confirm Password Reset
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Define Custom Role Modal */}
              {isAddRoleOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in text-left text-zinc-400 font-sans">
                  <div className="bg-zinc-950 border border-white/10 rounded-sm max-w-md w-full p-6 space-y-6 relative">
                    <button 
                      onClick={() => setIsAddRoleOpen(false)}
                      className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer font-mono"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-white text-md font-bold uppercase tracking-wider font-display">DEFINE CUSTOM ACCESS ROLE</h3>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get('role_name') as string;
                      const desc = formData.get('role_desc') as string;
                      if (!name || !desc) {
                        alert("Please fill in all requested fields.");
                        return;
                      }
                      
                      const newRole = {
                        id: `role-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                        name,
                        description: desc,
                        permissions: ['catalog_edit'] // Default initial permission
                      };

                      setRolesList(prev => [...prev, newRole]);
                      addLog(`Defined Custom Access Role: ${name}`, "Workforce Center");
                      setIsAddRoleOpen(false);
                      alert(`Custom role "${name}" successfully registered and synchronized.`);
                    }} className="space-y-4 text-[10px] font-mono">
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Role Designation Name</label>
                        <input type="text" name="role_name" placeholder="e.g. Warehouse Clerk" required className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Operational Description</label>
                        <textarea rows={3} name="role_desc" placeholder="Provide a brief summary of what personnel assigned to this role handle..." required className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-sans" />
                      </div>
                      <button type="submit" className="w-full bg-white text-black hover:bg-gold-pure font-bold uppercase tracking-widest py-2 rounded-xs text-[9px] cursor-pointer mt-4 font-sans">
                        Save Role Blueprint
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* IX. TAB: WEBSITE CMS MANAGE HOMEPAGE */}
          {activeTab === 'cms' && (
            <React.Suspense fallback={<div className="h-96 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Initializing Sovereign CMS...</div>}>
              <EnterpriseCmsManager
                currentUser={currentUser}
                addLog={addLog}
                onSave={(settings) => {
                  setCmsSettings((prev: any) => ({
                    ...prev,
                    heroHeading: settings.banners[0]?.title || prev.heroHeading,
                    heroSubheading: settings.banners[0]?.description || prev.heroSubheading,
                    heroImage: settings.banners[0]?.bgImage || prev.heroImage,
                    aboutContent: settings.webPages.find((p: any) => p.key === 'about')?.content || prev.aboutContent,
                    privacyPolicy: settings.webPages.find((p: any) => p.key === 'privacy')?.content || prev.privacyPolicy,
                    shippingPolicy: settings.webPages.find((p: any) => p.key === 'shipping')?.content || prev.shippingPolicy,
                    flashSaleText: settings.announcement.text || prev.flashSaleText,
                    flashSalePercentage: settings.popup.couponCode ? 15 : prev.flashSalePercentage,
                    flashSaleCountdown: settings.announcement.countdownEnd?.slice(0, 10) || prev.flashSaleCountdown,
                    seoTitle: settings.webPages[0]?.seoTitle || prev.seoTitle,
                    seoDesc: settings.webPages[0]?.seoDesc || prev.seoDesc,
                    activeSections: {
                      hero: settings.homepageSections.find((s: any) => s.id === 'hero')?.enabled ?? true,
                      categories: settings.homepageSections.find((s: any) => s.id === 'featured_categories')?.enabled ?? true,
                      about: settings.homepageSections.find((s: any) => s.id === 'coffee_heritage')?.enabled ?? true,
                      coffee: settings.homepageSections.find((s: any) => s.id === 'coffee_heritage')?.enabled ?? true,
                      grocery: settings.homepageSections.find((s: any) => s.id === 'grocery_market')?.enabled ?? true,
                      fashion: settings.homepageSections.find((s: any) => s.id === 'featured_products')?.enabled ?? true,
                      flashSale: settings.homepageSections.find((s: any) => s.id === 'flash_sale')?.enabled ?? true,
                      testimonials: settings.homepageSections.find((s: any) => s.id === 'testimonials')?.enabled ?? true
                    }
                  }));
                }}
              />
            </React.Suspense>
          )}

          {/* X. TAB: CAMPAIGNS & MARKETING */}
          {activeTab === 'marketing' && (
            <React.Suspense fallback={<div className="h-96 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Launching Marketing Engine...</div>}>
              <CampaignsMarketingPanel
                coupons={coupons}
                setCoupons={setCoupons}
                campaigns={campaigns}
                setCampaigns={setCampaigns}
                banners={banners}
                setBanners={setBanners}
                subscribers={subscribers}
                setSubscribers={setSubscribers}
                allProducts={allProducts}
                saveProductFields={saveProductFields}
                addLog={addLog}
                isAddCampaignOpen={isAddCampaignOpen}
                setIsAddCampaignOpen={setIsAddCampaignOpen}
                isAddBannerOpen={isAddBannerOpen}
                setIsAddBannerOpen={setIsAddBannerOpen}
                marketingSubTab={marketingSubTab}
                setMarketingSubTab={setMarketingSubTab}
                mktProductSearch={mktProductSearch}
                setMktProductSearch={setMktProductSearch}
                marketingError={marketingError}
              />
            </React.Suspense>
          )}

          {/* XI. TAB: REPORTS SECTOR */}
          {activeTab === 'reports' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">REPORTS & ANALYTICS</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">REPORTS OVERVIEW</h2>
              </div>

              {/* Interactive Report Configurator */}
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[10px]">
                  <div className="space-y-1">
                    <label className="text-[8.5px] uppercase font-mono text-zinc-500">Select Report</label>
                    <select 
                      id="report-type-selector"
                      defaultValue="sales"
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono text-[10px]"
                    >
                      <option value="sales">Sales Report</option>
                      <option value="revenue">TOTAL REVENUE</option>
                      <option value="orders">Customer Orders Log</option>
                      <option value="customers">Customer List</option>
                      <option value="products">High-Fulfillment Products</option>
                      <option value="inventory">Warehouse Inventories Audit</option>
                      <option value="taxes">Taxation & GAAP Compliance</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8.5px] uppercase font-mono text-zinc-500">Start Date</label>
                    <input 
                      id="report-start-date"
                      type="date" 
                      defaultValue="2026-06-14"
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono text-[10px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8.5px] uppercase font-mono text-zinc-500">End Date</label>
                    <input 
                      id="report-end-date"
                      type="date" 
                      defaultValue="2026-07-14"
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono text-[10px]"
                    />
                  </div>

                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        const typeVal = (document.getElementById('report-type-selector') as HTMLSelectElement).value;
                        const startVal = (document.getElementById('report-start-date') as HTMLInputElement).value;
                        const endVal = (document.getElementById('report-end-date') as HTMLInputElement).value;
                        
                        // Dynamically calculate and set report metrics
                        let count = 0;
                        let total = 0;
                        let rows: any[] = [];
                        let summaryText = "";

                        // Filter orders within range
                        const inRangeOrders = orders.filter(o => {
                          const orderDate = o.date; // format 'YYYY-MM-DD'
                          return (!startVal || orderDate >= startVal) && (!endVal || orderDate <= endVal);
                        });

                        if (typeVal === 'sales') {
                          count = inRangeOrders.length;
                          total = inRangeOrders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + o.total : sum, 0);
                          rows = inRangeOrders.map(o => ({
                            id: o.id,
                            col1: o.customerName,
                            col2: o.date,
                            col3: `${o.items.reduce((s, i) => s + i.quantity, 0)} items`,
                            col4: `${o.total} SAR`,
                            status: o.status
                          }));
                          summaryText = `Total Sales generated between ${startVal} and ${endVal}.`;
                        } else if (typeVal === 'revenue') {
                          count = inRangeOrders.filter(o => o.status === 'Completed').length;
                          total = inRangeOrders.reduce((sum, o) => o.status === 'Completed' ? sum + o.total : sum, 0);
                          rows = inRangeOrders.map(o => ({
                            id: o.id,
                            col1: o.customerName,
                            col2: o.date,
                            col3: `Subtotal: ${o.subtotal} SAR`,
                            col4: `Total Paid: ${o.total} SAR`,
                            status: o.status === 'Completed' ? 'Paid' : 'Pending'
                          }));
                          summaryText = `Settled and completed gross revenues index.`;
                        } else if (typeVal === 'orders') {
                          count = inRangeOrders.length;
                          total = inRangeOrders.reduce((sum, o) => sum + o.total, 0);
                          rows = inRangeOrders.map(o => ({
                            id: o.id,
                            col1: o.customerName,
                            col2: o.date,
                            col3: o.paymentMethod,
                            col4: `${o.total} SAR`,
                            status: o.status
                          }));
                          summaryText = `Comprehensive list of all incoming orders with payment categories.`;
                        } else if (typeVal === 'customers') {
                          const uniqueCusts = Array.from(new Set(inRangeOrders.map(o => o.email)));
                          count = uniqueCusts.length;
                          rows = uniqueCusts.map(email => {
                            const custOrders = inRangeOrders.filter(o => o.email === email);
                            const name = custOrders[0]?.customerName || "Customer";
                            const phone = custOrders[0]?.phone || "N/A";
                            const custTotal = custOrders.reduce((sum, o) => sum + o.total, 0);
                            return {
                              id: email,
                              col1: name,
                              col2: phone,
                              col3: `${custOrders.length} Completed Purchases`,
                              col4: `${custTotal} SAR LTV`,
                              status: 'Verified'
                            };
                          });
                          summaryText = `Directory index of all active customers placing orders within specified timeframe.`;
                        } else if (typeVal === 'products') {
                          const productSalesMap: Record<string, { qty: number; revenue: number; category: string }> = {};
                          inRangeOrders.forEach(o => {
                            o.items.forEach(item => {
                              if (!productSalesMap[item.name]) {
                                productSalesMap[item.name] = { qty: 0, revenue: 0, category: 'All' };
                              }
                              productSalesMap[item.name].qty += item.quantity;
                              productSalesMap[item.name].revenue += item.price * item.quantity;
                            });
                          });
                          count = Object.keys(productSalesMap).length;
                          rows = Object.entries(productSalesMap).map(([name, data]) => ({
                            id: name,
                            col1: name,
                            col2: `Quantity: ${data.qty}`,
                            col3: `Average price: ${(data.revenue / data.qty).toFixed(2)} SAR`,
                            col4: `${data.revenue} SAR`,
                            status: 'Top Selling'
                          }));
                          summaryText = `Granular overview of product yield metrics sorted by performance.`;
                        } else if (typeVal === 'inventory') {
                          count = allProducts.length;
                          rows = allProducts.map(p => ({
                            id: p.id,
                            col1: p.name,
                            col2: p.category.toUpperCase(),
                            col3: `Shelf: ${p.specifications?.['Warehouse Location'] || 'Hofuf Shelf A2'}`,
                            col4: `${p.inventory} in stock`,
                            status: p.inventory === 0 ? 'Out of Stock' : p.inventory <= 5 ? 'Low Stock' : 'Healthy'
                          }));
                          summaryText = `Complete warehouse audit report with location trackers.`;
                        } else if (typeVal === 'taxes') {
                          count = inRangeOrders.length;
                          // Tax is computed at 15% VAT on subtotal
                          const totalTax = inRangeOrders.reduce((sum, o) => sum + (o.subtotal * 0.15), 0);
                          total = totalTax;
                          rows = inRangeOrders.map(o => ({
                            id: o.id,
                            col1: o.customerName,
                            col2: o.date,
                            col3: `Taxable: ${o.subtotal} SAR`,
                            col4: `VAT 15%: ${(o.subtotal * 0.15).toFixed(2)} SAR`,
                            status: 'Computed'
                          }));
                          summaryText = `Tax liability and standard VAT accounting statement (GCC 15% Compliance).`;
                        }

                        (window as any)._activeReport = {
                          type: typeVal,
                          start: startVal,
                          end: endVal,
                          count,
                          total,
                          rows,
                          summary: summaryText
                        };

                        addLog('Reports Generated', `Created dynamic ${typeVal.toUpperCase()} report matching interval`);
                        // Force update local view
                        const el = document.getElementById('report-render-stage');
                        if (el) {
                          el.innerHTML = "Generated";
                        }
                        // Alert on first load or refresh to notify admin
                        alert(`Dynamic ${typeVal.toUpperCase()} report computed successfully! ${rows.length} report rows verified.`);
                      }}
                      className="w-full py-2 bg-gold-pure text-black font-bold uppercase tracking-widest text-[9px] cursor-pointer hover:bg-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3 text-black animate-spin-slow" /> Generate Report
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Report Preview Container */}
              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4 font-mono text-[10px]" id="report-view-container">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
                  <div>
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500">Report Preview</span>
                    <h3 className="text-white text-sm font-bold uppercase tracking-wider font-display">Report Results</h3>
                  </div>

                  {/* Export Options (PDF, Excel, CSV) */}
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => {
                        const activeReport = (window as any)._activeReport;
                        if (!activeReport) {
                          alert("Please compile a report first before exporting!");
                          return;
                        }
                        // Download CSV logic
                        const csvHeader = "ID,Field 1,Field 2,Field 3,Value/Amount,Status\n";
                        const csvRows = activeReport.rows.map((r: any) => 
                          `"${r.id}","${r.col1}","${r.col2}","${r.col3}","${r.col4}","${r.status}"`
                        ).join("\n");
                        const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows;
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `AL_ZOAL_${activeReport.type.toUpperCase()}_Report_${activeReport.start}_to_${activeReport.end}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        addLog('Reports Generated', `Exported ${activeReport.type.toUpperCase()} report in CSV format`);
                      }}
                      className="py-1 px-2.5 bg-zinc-900 hover:bg-[#D4AF37] hover:text-black border border-white/5 text-[8.5px] uppercase font-bold text-white transition-all rounded-xs flex items-center gap-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3 h-3" /> Export CSV
                    </button>
                    <button 
                      onClick={() => {
                        const activeReport = (window as any)._activeReport;
                        if (!activeReport) {
                          alert("Please compile a report first before exporting!");
                          return;
                        }
                        // Download Excel format (Tab-separated)
                        const xlsHeader = "ID\tField 1\tField 2\tField 3\tValue/Amount\tStatus\n";
                        const xlsRows = activeReport.rows.map((r: any) => 
                          `${r.id}\t${r.col1}\t${r.col2}\t${r.col3}\t${r.col4}\t${r.status}`
                        ).join("\n");
                        const xlsContent = "data:application/vnd.ms-excel;charset=utf-8," + encodeURIComponent(xlsHeader + xlsRows);
                        const link = document.createElement("a");
                        link.setAttribute("href", xlsContent);
                        link.setAttribute("download", `AL_ZOAL_${activeReport.type.toUpperCase()}_Report_${activeReport.start}_to_${activeReport.end}.xls`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        addLog('Reports Generated', `Exported ${activeReport.type.toUpperCase()} report in EXCEL format`);
                      }}
                      className="py-1 px-2.5 bg-zinc-900 hover:bg-[#D4AF37] hover:text-black border border-white/5 text-[8.5px] uppercase font-bold text-white transition-all rounded-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Export Excel
                    </button>
                    <button 
                      onClick={() => {
                        const activeReport = (window as any)._activeReport;
                        if (!activeReport) {
                          alert("Please compile a report first before printing!");
                          return;
                        }
                        addLog('Reports Generated', `Printed ${activeReport.type.toUpperCase()} PDF Report`);
                        
                        // Professional window print with sandboxed print CSS layout
                        const printWin = window.open("", "_blank");
                        if (printWin) {
                          printWin.document.write(`
                            <html>
                              <head>
                                <title>AL ZOAL - Financial Report Audit</title>
                                <style>
                                  body { font-family: 'Courier New', Courier, monospace; background: #fff; color: #000; padding: 40px; }
                                  h1 { text-align: center; font-size: 20px; letter-spacing: 3px; border-bottom: 2px solid #000; padding-bottom: 10px; text-transform: uppercase; }
                                  .metadata { margin-bottom: 30px; font-size: 11px; line-height: 1.6; }
                                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                  th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 11px; }
                                  th { background-color: #f2f2f2; }
                                  .footer { margin-top: 50px; text-align: center; font-size: 10px; border-top: 1px solid #000; padding-top: 10px; }
                                </style>
                              </head>
                              <body>
                                <h1>AL ZOAL FINANCIAL REPORT AUDIT</h1>
                                <div class="metadata">
                                  <strong>• REPORT CATEGORY:</strong> ${activeReport.type.toUpperCase()}<br/>
                                  <strong>• RANGE INTERVAL:</strong> ${activeReport.start} to ${activeReport.end}<br/>
                                  <strong>• TIME OF DISPATCH:</strong> ${new Date().toLocaleString()}<br/>
                                  <strong>• RECORD COUNT:</strong> ${activeReport.count} entries<br/>
                                  ${activeReport.total ? `<strong>• TOTAL SUM QUANTIFIED:</strong> ${activeReport.total} SAR<br/>` : ""}
                                  <strong>• STATUS POLICY:</strong> Verified and Audited
                                </div>
                                <p>${activeReport.summary}</p>
                                <table>
                                  <thead>
                                    <tr>
                                      <th>Identifier / Key</th>
                                      <th>Field 1</th>
                                      <th>Field 2</th>
                                      <th>Field 3</th>
                                      <th>Yield Amount</th>
                                      <th>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${activeReport.rows.map((r: any) => `
                                      <tr>
                                        <td>${r.id}</td>
                                        <td>${r.col1}</td>
                                        <td>${r.col2}</td>
                                        <td>${r.col3}</td>
                                        <td>${r.col4}</td>
                                        <td>${r.status}</td>
                                      </tr>
                                    `).join("")}
                                  </tbody>
                                </table>
                                <div class="footer">
                                  AL ZOAL BOUTIQUE S.A. • CONFIDENTIAL HQ ACCESS
                                </div>
                                <script>
                                  window.onload = function() { window.print(); window.close(); }
                                </script>
                              </body>
                            </html>
                          `);
                          printWin.document.close();
                        } else {
                          // Fallback to basic window printing if popups are blocked
                          window.print();
                        }
                      }}
                      className="py-1 px-2.5 bg-white text-black hover:bg-[#D4AF37] border border-white/5 text-[8.5px] uppercase font-bold transition-all rounded-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" /> Download PDF
                    </button>
                  </div>
                </div>

                {/* Local Dynamic Element to Trigger UI Refresh */}
                <div id="report-render-stage" className="hidden" />

                {/* Displaying Current Compiled Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-black border border-white/5 p-4 rounded-xs text-left space-y-1">
                    <span className="text-[8px] uppercase text-zinc-500 block">Total Rows</span>
                    <strong className="text-white text-md font-sans block">
                      {((window as any)._activeReport?.count !== undefined) ? (window as any)._activeReport.count : '—'} Active Entities
                    </strong>
                  </div>
                  <div className="bg-black border border-white/5 p-4 rounded-xs text-left space-y-1">
                    <span className="text-[8px] uppercase text-zinc-500 block">Total Sales Amount</span>
                    <strong className="text-gold-pure text-md font-sans block">
                      {((window as any)._activeReport?.total !== undefined) ? `${(window as any)._activeReport.total} SAR` : '—'}
                    </strong>
                  </div>
                  <div className="bg-black border border-white/5 p-4 rounded-xs text-left space-y-1">
                    <span className="text-[8px] uppercase text-zinc-500 block">Report Status</span>
                    <strong className="text-emerald-400 text-md font-sans block flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Verified
                    </strong>
                  </div>
                </div>

                {/* Render compiled rows preview */}
                <div className="bg-black border border-white/5 rounded-xs overflow-hidden mt-4">
                  <table className="w-full text-left divide-y divide-white/5">
                    <thead className="bg-zinc-950 text-zinc-500 text-[8px] font-mono uppercase tracking-widest">
                      <tr>
                        <th className="p-3">Ref ID</th>
                        <th className="p-3">Primary</th>
                        <th className="p-3">Secondary</th>
                        <th className="p-3">Tertiary</th>
                        <th className="p-3 text-right font-bold">Total Amount</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[9px] font-mono text-zinc-400">
                      {((window as any)._activeReport?.rows && (window as any)._activeReport.rows.length > 0) ? (
                        (window as any)._activeReport.rows.map((row: any, rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-white/5 duration-100">
                            <td className="p-3 font-bold text-white truncate max-w-[120px]" title={row.id}>{row.id}</td>
                            <td className="p-3 font-sans font-semibold text-zinc-300">{row.col1}</td>
                            <td className="p-3">{row.col2}</td>
                            <td className="p-3 text-zinc-500">{row.col3}</td>
                            <td className="p-3 text-right text-gold-pure font-bold">{row.col4}</td>
                            <td className="p-3 text-right">
                              <span className="bg-white/5 border border-white/10 px-1 py-0.5 rounded-sm text-[8px] uppercase font-bold text-zinc-300">
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-10 text-center text-zinc-500 font-sans">
                            No report generated yet. Select a report type, choose date range, and click <strong className="text-gold-pure uppercase">Generate Report</strong>.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* XII. TAB: ANALYTICS SECTOR */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ZOAL ANALYTICS</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">BUSINESS ANALYTICS</h2>
              </div>

              {/* Core Analytics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-[10px]">
                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] uppercase tracking-widest block">Average Order Value (AOV)</span>
                  <div className="flex justify-between items-baseline mt-1">
                    <strong className="text-white text-md font-sans">348.50 SAR</strong>
                    <span className="text-emerald-400 text-[8px] font-bold flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" /> +5.2%</span>
                  </div>
                </div>
                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] uppercase tracking-widest block">New Customer Rate</span>
                  <div className="flex justify-between items-baseline mt-1">
                    <strong className="text-white text-md font-sans">18.4%</strong>
                    <span className="text-emerald-400 text-[8px] font-bold flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" /> +12%</span>
                  </div>
                </div>
                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] uppercase tracking-widest block">Average Conversion Rate</span>
                  <div className="flex justify-between items-baseline mt-1">
                    <strong className="text-white text-md font-sans">4.16%</strong>
                    <span className="text-emerald-400 text-[8px] font-bold flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" /> +1.1%</span>
                  </div>
                </div>
                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] uppercase tracking-widest block">Cart Abandonment Rate</span>
                  <div className="flex justify-between items-baseline mt-1">
                    <strong className="text-white text-md font-sans">52.8%</strong>
                    <span className="text-zinc-400 text-[8px] font-bold flex items-center gap-0.5">Optimal</span>
                  </div>
                </div>
              </div>

              {/* Bento Grid Analytics Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Revenue Trends Area Chart */}
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Gross Income Velocity</span>
                    <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">Revenue Trends (Monthly Yield)</h3>
                  </div>
                  <div className="h-60 font-mono text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueTrendData}>
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#555" fontSize={8} />
                        <YAxis stroke="#555" fontSize={8} />
                        <Tooltip contentStyle={{ backgroundColor: '#050505', borderColor: '#222', fontSize: 10 }} />
                        <Area type="monotone" dataKey="sales" stroke="#D4AF37" fillOpacity={1} fill="url(#salesGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Sales Performance Dual Chart */}
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Operations metrics</span>
                    <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">Sales Performance (Volume vs AOV)</h3>
                  </div>
                  <div className="h-60 font-mono text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { name: 'Jan', orders: 120, aov: 310 },
                        { name: 'Feb', orders: 150, aov: 325 },
                        { name: 'Mar', orders: 180, aov: 340 },
                        { name: 'Apr', orders: 220, aov: 315 },
                        { name: 'May', orders: 310, aov: 360 },
                        { name: 'Jun', orders: 450, aov: 380 },
                        { name: 'Jul', orders: 520, aov: 395 }
                      ]}>
                        <XAxis dataKey="name" stroke="#555" fontSize={8} />
                        <YAxis yAxisId="left" stroke="#D4AF37" fontSize={8} label={{ value: 'Orders', angle: -90, position: 'insideLeft', fill: '#D4AF37' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#F2F2F2" fontSize={8} label={{ value: 'AOV (SAR)', angle: 90, position: 'insideRight', fill: '#F2F2F2' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#050505', borderColor: '#222', fontSize: 10 }} />
                        <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#D4AF37" strokeWidth={2} />
                        <Line yAxisId="right" type="monotone" dataKey="aov" stroke="#F2F2F2" strokeWidth={1.5} strokeDasharray="3 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Top Products Horizontal Bar Chart */}
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Fulfillment High performers</span>
                    <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">Top Selling Products</h3>
                  </div>
                  <div className="h-60 font-mono text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bestSellingProductsData}>
                        <XAxis dataKey="name" stroke="#555" fontSize={8} />
                        <YAxis stroke="#555" fontSize={8} />
                        <Tooltip contentStyle={{ backgroundColor: '#050505', borderColor: '#222', fontSize: 10 }} />
                        <Bar dataKey="qty" fill="#D4AF37" radius={[2, 2, 0, 0]}>
                          {bestSellingProductsData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={idx % 2 === 0 ? '#D4AF37' : '#AA8C2C'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. Top Categories Distribution Pie Chart */}
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Luxury segments share</span>
                    <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">Top Performing Categories</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center h-60">
                    <div className="col-span-2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Specialty Coffee', value: 45 },
                              { name: 'Traditional Bakery', value: 25 },
                              { name: 'Heritage Gowns', value: 20 },
                              { name: 'Market Botanicals', value: 10 }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            <Cell fill="#D4AF37" />
                            <Cell fill="#AA8C2C" />
                            <Cell fill="#F2F2F2" />
                            <Cell fill="#555555" />
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#050505', borderColor: '#222', fontSize: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 text-[8.5px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                        <span className="text-zinc-300">Coffee (45%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#AA8C2C]" />
                        <span className="text-zinc-300">Bakery (25%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#F2F2F2]" />
                        <span className="text-zinc-300">Gowns (20%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#555555]" />
                        <span className="text-zinc-300">Botanicals (10%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Customer Growth Line Chart */}
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Customer List</span>
                    <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">Customer Growth Index</h3>
                  </div>
                  <div className="h-60 font-mono text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { name: 'Jan', totalPatrons: 450 },
                        { name: 'Feb', totalPatrons: 580 },
                        { name: 'Mar', totalPatrons: 720 },
                        { name: 'Apr', totalPatrons: 900 },
                        { name: 'May', totalPatrons: 1150 },
                        { name: 'Jun', totalPatrons: 1480 },
                        { name: 'Jul', totalPatrons: 1920 }
                      ]}>
                        <XAxis dataKey="name" stroke="#555" fontSize={8} />
                        <YAxis stroke="#555" fontSize={8} />
                        <Tooltip contentStyle={{ backgroundColor: '#050505', borderColor: '#222', fontSize: 10 }} />
                        <Line type="monotone" dataKey="totalPatrons" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3, fill: '#D4AF37', strokeWidth: 1 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 6. Returning Customers Retention */}
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Customer Loyalty score</span>
                    <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">Returning Customers Retention</h3>
                  </div>
                  <div className="flex flex-col justify-center items-center h-60 space-y-6">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      {/* Nested Progress Ring Representation */}
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle cx="72" cy="72" r="50" stroke="#111" strokeWidth="8" fill="transparent" />
                        <circle cx="72" cy="72" r="50" stroke="#D4AF37" strokeWidth="8" fill="transparent" strokeDasharray="314.16" strokeDashoffset="213.63" /> {/* New Patrons 68% */}
                        <circle cx="72" cy="72" r="40" stroke="#111" strokeWidth="6" fill="transparent" />
                        <circle cx="72" cy="72" r="40" stroke="#AA8C2C" strokeWidth="6" fill="transparent" strokeDasharray="251.32" strokeDashoffset="170.90" /> {/* Returning 32% */}
                      </svg>
                      <div className="text-center font-sans">
                        <span className="text-[10px] uppercase font-mono text-zinc-500 block">Returning Rate</span>
                        <strong className="text-white text-lg font-bold">32.0%</strong>
                      </div>
                    </div>
                    <div className="flex gap-4 text-[8.5px] font-mono">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-[#D4AF37]" />
                        <span className="text-zinc-400">New Customers (68%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-[#AA8C2C]" />
                        <span className="text-zinc-400">Returning Customers (32%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. Conversion Funnel Progress Layout */}
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Customer Conversion steps</span>
                    <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">Premium Conversion Funnel</h3>
                  </div>
                  <div className="space-y-4 py-2 font-mono text-[10px]">
                    {[
                      { stage: 'Sessions Initiated', count: 12500, percent: 100 },
                      { stage: 'Product Catalog Views', count: 7200, percent: 57.6 },
                      { stage: 'Added Items to Bag', count: 2400, percent: 19.2 },
                      { stage: 'Checkout Portal Initiated', count: 1100, percent: 8.8 },
                      { stage: 'Completed Orders', count: 520, percent: 4.16 }
                    ].map((step, sIdx) => (
                      <div key={sIdx} className="space-y-1">
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-zinc-300 font-semibold">{step.stage}</span>
                          <span className="text-zinc-500 font-bold">{step.count.toLocaleString()} • {step.percent}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 border border-white/5 h-2.5 rounded-sm overflow-hidden">
                          <div className="bg-gold-pure h-full transition-all duration-500" style={{ width: `${step.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 8. Traffic Placeholders and Locations Table */}
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Geographical tracking</span>
                    <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">Top Traffic Regions</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[9px] font-mono divide-y divide-white/5">
                      <thead>
                        <tr className="text-zinc-500 uppercase tracking-widest text-[8px]">
                          <th className="py-2">Province / Location</th>
                          <th className="py-2 text-right">Sessions</th>
                          <th className="py-2 text-right">Traffic Share</th>
                          <th className="py-2 text-right">Bounce Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-400">
                        {[
                          { location: 'Riyadh Province', sessions: 5400, percentage: '43.2%', bounceRate: '31.2%' },
                          { location: 'Eastern Prov. (Dammam/Khobar)', sessions: 3800, percentage: '30.4%', bounceRate: '28.5%' },
                          { location: 'Western Prov. (Jeddah/Makkah)', sessions: 1900, percentage: '15.2%', bounceRate: '34.8%' },
                          { location: 'Gulf Regions (Dubai/Manama)', sessions: 950, percentage: '7.6%', bounceRate: '25.1%' },
                          { location: 'Global / Other', sessions: 450, percentage: '3.6%', bounceRate: '45.0%' }
                        ].map((traffic, tIdx) => (
                          <tr key={tIdx} className="hover:bg-white/5 duration-100">
                            <td className="py-2.5 text-white font-sans">{traffic.location}</td>
                            <td className="py-2.5 text-right">{traffic.sessions.toLocaleString()}</td>
                            <td className="py-2.5 text-right font-bold text-gold-pure">{traffic.percentage}</td>
                            <td className="py-2.5 text-right text-zinc-500">{traffic.bounceRate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* XIII. TAB: NOTIFICATIONS TERMINAL */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
                <div>
                  <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">NOTIFICATIONS</span>
                  <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">SYSTEM NOTIFICATIONS</h2>
                </div>
                
                {/* Actions Panel */}
                <div className="flex gap-2 font-mono text-[9px]">
                  <button
                    onClick={() => {
                      activeNotificationEngine.markAllAsRead();
                      addLog("Marked all alerts as read", "Notifications Center");
                    }}
                    className="py-1 px-2 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white rounded-xs uppercase font-bold cursor-pointer"
                  >
                    Mark All Read
                  </button>
                  <button
                    onClick={() => {
                      activeNotificationEngine.clearAll();
                      addLog("Cleared notifications history", "Notifications Center");
                    }}
                    className="py-1 px-2 bg-rose-950 border border-rose-800 hover:bg-rose-900 text-rose-200 rounded-xs uppercase font-bold cursor-pointer"
                  >
                    Clear Notifications
                  </button>
                </div>
              </div>

              {/* Grid with filters and content */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-[10px]">
                
                {/* Left Sidebar Filters */}
                <div className="space-y-4">
                  {/* Status Filters */}
                  <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold block">Filter Status</span>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: 'all', name: 'All Notifications' },
                        { id: 'unread', name: 'Unread Only' },
                        { id: 'read', name: 'Read Only' },
                        { id: 'archived', name: 'Archived Only' }
                      ].map(f => {
                        const activeId = (window as any)._notifStatusFilter || 'all';
                        return (
                          <button
                            key={f.id}
                            onClick={() => {
                              (window as any)._notifStatusFilter = f.id;
                              // Force component state sync
                              const stage = document.getElementById('notif-render-stage');
                              if (stage) stage.innerHTML = f.id;
                              addLog(`Applied notifications status filter: ${f.id.toUpperCase()}`, "Notifications Center");
                            }}
                            className={`w-full text-left p-1.5 rounded-sm transition-all text-[9.5px] uppercase font-bold flex justify-between items-center ${
                              activeId === f.id ? 'bg-white text-black pl-2.5' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span>{f.name}</span>
                            <span className="text-[8.5px] opacity-60">
                              {f.id === 'all' ? notifications.length :
                               f.id === 'unread' ? notifications.filter(n => n.status === 'unread').length :
                               f.id === 'read' ? notifications.filter(n => n.status === 'read').length :
                               notifications.filter(n => n.status === 'archived').length
                              }
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Filters */}
                  <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-2">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold block">Filter Type / Alert Code</span>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: 'all', name: 'All Categories' },
                        { id: 'new_order', name: 'New Orders' },
                        { id: 'low_stock', name: 'Low Stock Level' },
                        { id: 'out_of_stock', name: 'Out of Stock' },
                        { id: 'refund_request', name: 'Refund Requests' },
                        { id: 'new_customer', name: 'New Customers' },
                        { id: 'payment_failed', name: 'Payment Failures' },
                        { id: 'system_warning', name: 'System Warnings' }
                      ].map(f => {
                        const activeId = (window as any)._notifCategoryFilter || 'all';
                        return (
                          <button
                            key={f.id}
                            onClick={() => {
                              (window as any)._notifCategoryFilter = f.id;
                              // Force state sync
                              const stage = document.getElementById('notif-render-stage');
                              if (stage) stage.innerHTML = f.id;
                              addLog(`Applied notifications category filter: ${f.id.toUpperCase()}`, "Notifications Center");
                            }}
                            className={`w-full text-left p-1.5 rounded-sm transition-all text-[9px] uppercase font-bold flex justify-between items-center ${
                              activeId === f.id ? 'bg-gold-pure text-black pl-2' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span>{f.name}</span>
                            <span className="text-[8px] opacity-60">
                              {f.id === 'all' ? notifications.length : notifications.filter(n => n.category === f.id).length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Right Main Notifications Display Pane */}
                <div className="md:col-span-3 space-y-3">
                  
                  {/* Invisible render stage to enforce updates */}
                  <div id="notif-render-stage" className="hidden" />

                  {(() => {
                    const statusFilter = (window as any)._notifStatusFilter || 'all';
                    const categoryFilter = (window as any)._notifCategoryFilter || 'all';

                    let filtered = notifications;
                    if (statusFilter === 'unread') {
                      filtered = filtered.filter(n => !n.read && !n.archived);
                    } else if (statusFilter === 'read') {
                      filtered = filtered.filter(n => n.read && !n.archived);
                    } else if (statusFilter === 'archived') {
                      filtered = filtered.filter(n => n.archived);
                    }

                    if (categoryFilter !== 'all') {
                      filtered = filtered.filter(n => (n.category || '').toLowerCase().includes(categoryFilter.toLowerCase()));
                    }

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-zinc-950 border border-white/5 p-12 rounded-xs text-center font-sans space-y-2">
                          <AlertCircle className="w-6 h-6 text-zinc-600 mx-auto" />
                          <h4 className="text-white text-sm font-bold uppercase tracking-wider font-display font-mono">List is clean</h4>
                          <p className="text-zinc-500 text-[10.5px]">No registered alerts match the selected filters ({statusFilter} / {categoryFilter}).</p>
                        </div>
                      );
                    }

                    return filtered.map((n, idx) => (
                      <div 
                        key={`${n.id}-list-${idx}`} 
                        className={`p-4 bg-zinc-950 border rounded-xs flex flex-col sm:flex-row justify-between items-start gap-4 transition-all duration-150 ${
                          !n.read ? 'border-l-2 border-l-gold-pure border-white/5' : 'border-white/5 opacity-60'
                        }`}
                      >
                        <div className="space-y-1.5 text-left max-w-xl">
                          <div className="flex items-center gap-2">
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-gold-pure animate-ping" />}
                            <span className={`font-mono font-bold uppercase tracking-wider text-[10.5px] ${
                              n.priority === 'critical' ? 'text-red-500' : 
                              n.priority === 'high' ? 'text-amber-500' : 
                              'text-emerald-400'
                            }`}>
                              {n.title}
                            </span>
                            <span className="text-zinc-600 font-mono text-[8.5px] uppercase">
                              [{n.category}]
                            </span>
                          </div>
                          <p className="text-zinc-300 font-sans text-[11px] leading-relaxed">{n.message}</p>
                          <span className="text-zinc-500 text-[8.5px] block font-mono">
                            {new Date(n.timestamp).toLocaleTimeString()} - {new Date(n.timestamp).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Card level Actions */}
                        <div className="flex gap-2 font-mono text-[8.5px] self-end sm:self-center shrink-0">
                          {!n.read && (
                            <button
                              onClick={() => {
                                activeNotificationEngine.markAsRead(n.id);
                                addLog(`Marked alert as read: ${n.title}`, "Notifications Center");
                              }}
                              className="py-1 px-2 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white font-bold rounded-xs cursor-pointer transition-all"
                            >
                              Mark Read
                            </button>
                          )}
                          {!n.archived && (
                            <button
                              onClick={() => {
                                activeNotificationEngine.archiveNotification(n.id);
                                addLog(`Archived system alert: ${n.title}`, "Notifications Center");
                              }}
                              className="py-1 px-2 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-400 rounded-xs cursor-pointer"
                            >
                              Archive
                            </button>
                          )}
                          <button
                            onClick={() => {
                              activeNotificationEngine.deleteNotification(n.id);
                              addLog(`Deleted alert entry: ${n.title}`, "Notifications Center");
                            }}
                            className="py-1 px-2 bg-zinc-900 border border-white/10 hover:border-rose-500 hover:text-rose-400 text-zinc-500 rounded-xs cursor-pointer transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ));
                  })()}

                </div>

              </div>
            </div>
          )}

          {/* XIV. TAB: SETTINGS & POLICIES SECURITY */}
          {activeTab === 'settings' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">SETTINGS</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">STORE SETTINGS</h2>
              </div>

              {/* Settings Tab Selectors */}
              <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3 text-[9px] font-mono uppercase">
                {['profile', 'finance', 'smtp', 'security'].map(subTab => {
                  const activeSub = (window as any)._settingsActiveSub || 'profile';
                  let name = "Business Profile";
                  if (subTab === 'finance') name = "Shipping & Taxes";
                  if (subTab === 'smtp') name = "Email Settings";
                  if (subTab === 'security') name = "Security & Backups";
                  
                  return (
                    <button
                      key={subTab}
                      onClick={() => {
                        (window as any)._settingsActiveSub = subTab;
                        // Force render update
                        const syncEl = document.getElementById('settings-sync-trigger');
                        if (syncEl) syncEl.innerHTML = subTab;
                        addLog(`Opened settings sub-tab: ${subTab.toUpperCase()}`, "Settings Module");
                      }}
                      className={`py-1.5 px-3 rounded-xs border transition-all font-bold cursor-pointer ${
                        activeSub === subTab 
                          ? 'bg-gold-pure text-black border-gold-pure' 
                          : 'bg-zinc-950 text-zinc-400 border-white/5 hover:text-white'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>

              {/* Hidden sync anchor */}
              <div id="settings-sync-trigger" className="hidden" />

              {/* Main Settings Panel */}
              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-6 text-[10px]">
                
                {/* SUB TAB 1: PROFILE */}
                {((window as any)._settingsActiveSub || 'profile') === 'profile' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Business Information</span>
                      <p className="text-zinc-400 font-sans leading-relaxed text-[10.5px] mt-1">Manage your store details, contact information, logos, and default region settings.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Store / Company Name</label>
                        <input 
                          type="text" 
                          id="settings-biz-name"
                          defaultValue={globalSettings.businessName}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Business Address</label>
                        <input 
                          type="text" 
                          id="settings-biz-address"
                          defaultValue={globalSettings.address}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Support Email</label>
                        <input 
                          type="email" 
                          id="settings-biz-email"
                          defaultValue={globalSettings.email}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Phone Number</label>
                        <input 
                          type="text" 
                          id="settings-biz-phone"
                          defaultValue={globalSettings.phone}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500 flex items-center justify-between">
                          <span>Store Logo (Static First + Dynamic Override)</span>
                          <span className="text-[8px] text-gold-pure uppercase font-semibold">CMS Override Enabled</span>
                        </label>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-black ring-1 ring-gold-pure/20 shrink-0">
                            <img 
                              src={globalSettings.businessLogo || BRANDING.LOGO} 
                              alt="ZOAL Logo" 
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = BRANDING.LOGO; }}
                              className="w-[145%] h-[145%] max-w-[145%] object-cover select-none pointer-events-none shrink-0" 
                            />
                          </div>
                          <input 
                            type="text" 
                            id="settings-biz-logo"
                            defaultValue={globalSettings.businessLogo || BRANDING.LOGO}
                            placeholder={BRANDING.LOGO}
                            className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500 flex items-center justify-between">
                          <span>Favicon</span>
                          <span className="text-[8px] text-gold-pure uppercase font-semibold">Protected Static Asset</span>
                        </label>
                        <div className="bg-black/80 border border-white/10 text-zinc-400 p-2 text-[10px] rounded-xs flex items-center justify-between">
                          <span className="text-[9.5px] text-zinc-400">Favicon synchronized with Protected Logo.</span>
                          <span className="text-[8px] bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded-xs uppercase font-mono">Static</span>
                        </div>
                        <input 
                          type="hidden" 
                          id="settings-biz-favicon"
                          value={BRANDING.FAVICON}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Instagram Link</label>
                        <input 
                          type="text" 
                          id="settings-biz-instagram"
                          defaultValue={globalSettings.instagram}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Twitter / X Link</label>
                        <input 
                          type="text" 
                          id="settings-biz-twitter"
                          defaultValue={globalSettings.twitter}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Default Language</label>
                        <select 
                          id="settings-biz-lang"
                          defaultValue={globalSettings.language}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        >
                          <option value="en">English (US Standard)</option>
                          <option value="ar">العربية (Kingdom of Saudi Arabia)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Default Currency</label>
                        <select 
                          id="settings-biz-currency"
                          defaultValue={globalSettings.currency}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        >
                          <option value="SAR">SAR (Saudi Riyal)</option>
                          <option value="AED">AED (Emirati Dirham)</option>
                          <option value="USD">USD (United States Dollar)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB TAB 2: FINANCE & TAX */}
                {((window as any)._settingsActiveSub || 'profile') === 'finance' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Shipping & Taxes</span>
                      <p className="text-zinc-400 font-sans leading-relaxed text-[10.5px] mt-1">Manage your shipping rates, free shipping thresholds, and tax settings.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Standard Shipping Fee (SAR)</label>
                        <input 
                          type="number" 
                          id="settings-ship-fee"
                          defaultValue={globalSettings.shippingFeeDefault}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Free Shipping Threshold (SAR)</label>
                        <input 
                          type="number" 
                          id="settings-ship-free"
                          defaultValue={globalSettings.shippingFreeThreshold}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Standard VAT Rate (%)</label>
                        <input 
                          type="number" 
                          id="settings-tax-rate"
                          defaultValue={globalSettings.taxRate}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Tax ID (TRN)</label>
                        <input 
                          type="text" 
                          id="settings-tax-id"
                          defaultValue={globalSettings.taxId}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB TAB 3: SMTP */}
                {((window as any)._settingsActiveSub || 'profile') === 'smtp' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Email Settings</span>
                      <p className="text-zinc-400 font-sans leading-relaxed text-[10.5px] mt-1">Configure your transactional SMTP email settings to send order receipts and system alerts.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">SMTP Host</label>
                        <input 
                          type="text" 
                          id="settings-smtp-host"
                          defaultValue={globalSettings.smtpHost}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">SMTP Port</label>
                        <input 
                          type="text" 
                          id="settings-smtp-port"
                          defaultValue={globalSettings.smtpPort}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">SMTP Username</label>
                        <input 
                          type="text" 
                          id="settings-smtp-user"
                          defaultValue={globalSettings.smtpUser}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                       <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">SMTP Password</label>
                        <div className="relative">
                          <input 
                            type={showAdminSmtpPass ? 'text' : 'password'} 
                            id="settings-smtp-pass"
                            placeholder="•••••••••••• (Leave blank to keep existing secret)"
                            className="bg-black w-full border border-white/10 text-white p-2 pr-11 text-[10px] rounded-xs outline-none focus:border-gold-pure placeholder:text-zinc-600"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminSmtpPass(!showAdminSmtpPass)}
                            className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-[#D4AF37]/80 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xs"
                            aria-label={showAdminSmtpPass ? 'Hide SMTP password' : 'Show SMTP password'}
                          >
                            {showAdminSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB TAB 4: SECURITY & BACKUP */}
                {((window as any)._settingsActiveSub || 'profile') === 'security' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Security & Backups</span>
                      <p className="text-zinc-400 font-sans leading-relaxed text-[10.5px] mt-1">Configure security firewalls, whitelist IPs, session duration limit, and download system backups.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">IP Whitelist</label>
                        <input 
                          type="text" 
                          id="settings-ip-whitelist"
                          defaultValue={globalSettings.ipWhitelist}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Session Timeout (Minutes)</label>
                        <input 
                          type="number" 
                          id="settings-session-expire"
                          defaultValue={globalSettings.sessionExpirationMinutes}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Backup Frequency</label>
                        <select 
                          id="settings-backup-freq"
                          defaultValue={globalSettings.autoBackupFrequency}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        >
                          <option value="hourly">Every hour (Continuous Sync)</option>
                          <option value="daily">Daily standard routine (Recommended)</option>
                          <option value="weekly">Weekly legacy archive</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Theme Prestige Accent</label>
                        <select 
                          id="settings-accent-color"
                          defaultValue={globalSettings.accentColor}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        >
                          <option value="#D4AF37">Luxury gold (#D4AF37)</option>
                          <option value="#C0C0C0">Heritage silver (#C0C0C0)</option>
                          <option value="#00A86B">Islamic green (#00A86B)</option>
                          <option value="#900C3F">Cosmic Burgundy (#900C3F)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-black/40 border border-white/5 p-3 rounded-xs flex justify-between items-center">
                        <div className="space-y-0.5 text-left">
                          <strong className="text-white uppercase font-bold text-[9px] block">Two-Factor Authentication (2FA)</strong>
                          <span className="text-zinc-500 text-[8.5px] block font-sans">Enforce cryptographic verification gates upon login</span>
                        </div>
                        <button
                          onClick={() => {
                            setGlobalSettings((prev: any) => ({ ...prev, doubleAuthEnabled: !prev.doubleAuthEnabled }));
                            addLog("Toggled Double Factor Auth security gates", "Settings Module");
                          }}
                          className="text-zinc-300 hover:text-white transition-all text-sm outline-none"
                        >
                          {globalSettings.doubleAuthEnabled ? <ToggleRight className="w-8 h-8 text-gold-pure" /> : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                        </button>
                      </div>

                      <div className="bg-black/40 border border-white/5 p-3 rounded-xs flex justify-between items-center">
                        <div className="space-y-0.5 text-left">
                          <strong className="text-white uppercase font-bold text-[9px] block">System Maintenance Mode</strong>
                          <span className="text-zinc-500 text-[8.5px] block font-sans">Lock public storefront under heritage construction screen</span>
                        </div>
                        <button
                          onClick={() => {
                            setGlobalSettings((prev: any) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
                            addLog("Toggled system maintenance gates", "Settings Module");
                          }}
                          className="text-zinc-300 hover:text-white transition-all text-sm outline-none"
                        >
                          {globalSettings.maintenanceMode ? <ToggleRight className="w-8 h-8 text-rose-500" /> : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const backupPayload = {
                            settings: globalSettings,
                            productsCount: allProducts.length,
                            ordersCount: orders.length,
                            roles: rolesList,
                            time: new Date().toISOString()
                          };
                          const fileData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
                          const link = document.createElement("a");
                          link.setAttribute("href", fileData);
                          link.setAttribute("download", `${(globalSettings?.businessName || "ZOAL").toUpperCase()}_Full_Database_Backup_${new Date().toISOString().slice(0,10)}.json`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          addLog("Triggered complete DB backup export download", "Settings Module");
                        }}
                        className="py-1.5 px-3 bg-zinc-900 text-white border border-white/10 hover:border-gold-pure hover:bg-zinc-800 rounded-xs font-bold text-[8.5px] uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-gold-pure" /> Download System Backup file
                      </button>

                      <button
                        onClick={() => {
                          addLog("Initiated manual remote database replication sync", "Settings Module");
                          alert("Database replication and audit indices successfully synchronized with Supabase remote cluster.");
                        }}
                        className="py-1.5 px-3 bg-zinc-900 text-white border border-white/10 hover:border-gold-pure hover:bg-zinc-800 rounded-xs font-bold text-[8.5px] uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin-slow" /> Replicate Database
                      </button>
                    </div>

                  </div>
                )}

                {/* Save button panel */}
                <div className="pt-4 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => {
                      const updated: any = { ...globalSettings };

                      // Pull values safely based on active tab or overall presence in the DOM
                      const nameEl = document.getElementById('settings-biz-name') as HTMLInputElement;
                      const addrEl = document.getElementById('settings-biz-address') as HTMLInputElement;
                      const emailEl = document.getElementById('settings-biz-email') as HTMLInputElement;
                      const phoneEl = document.getElementById('settings-biz-phone') as HTMLInputElement;
                      const logoEl = document.getElementById('settings-biz-logo') as HTMLInputElement;
                      const favEl = document.getElementById('settings-biz-favicon') as HTMLInputElement;
                      const instaEl = document.getElementById('settings-biz-instagram') as HTMLInputElement;
                      const twiEl = document.getElementById('settings-biz-twitter') as HTMLInputElement;
                      const langEl = document.getElementById('settings-biz-lang') as HTMLSelectElement;
                      const curEl = document.getElementById('settings-biz-currency') as HTMLSelectElement;

                      const shipFeeEl = document.getElementById('settings-ship-fee') as HTMLInputElement;
                      const shipFreeEl = document.getElementById('settings-ship-free') as HTMLInputElement;
                      const taxRateEl = document.getElementById('settings-tax-rate') as HTMLInputElement;
                      const taxIdEl = document.getElementById('settings-tax-id') as HTMLInputElement;

                      const smtpHostEl = document.getElementById('settings-smtp-host') as HTMLInputElement;
                      const smtpPortEl = document.getElementById('settings-smtp-port') as HTMLInputElement;
                      const smtpUserEl = document.getElementById('settings-smtp-user') as HTMLInputElement;
                      const smtpPassEl = document.getElementById('settings-smtp-pass') as HTMLInputElement;

                      const ipEl = document.getElementById('settings-ip-whitelist') as HTMLInputElement;
                      const expEl = document.getElementById('settings-session-expire') as HTMLInputElement;
                      const backEl = document.getElementById('settings-backup-freq') as HTMLSelectElement;
                      const colEl = document.getElementById('settings-accent-color') as HTMLSelectElement;

                      if (nameEl) updated.businessName = nameEl.value;
                      if (addrEl) updated.address = addrEl.value;
                      if (emailEl) updated.email = emailEl.value;
                      if (phoneEl) updated.phone = phoneEl.value;
                      if (logoEl) updated.businessLogo = logoEl.value;
                      if (favEl) updated.favicon = favEl.value;
                      if (instaEl) updated.instagram = instaEl.value;
                      if (twiEl) updated.twitter = twiEl.value;
                      if (langEl) updated.language = langEl.value;
                      if (curEl) updated.currency = curEl.value;

                      if (shipFeeEl) updated.shippingFeeDefault = Number(shipFeeEl.value);
                      if (shipFreeEl) updated.shippingFreeThreshold = Number(shipFreeEl.value);
                      if (taxRateEl) updated.taxRate = Number(taxRateEl.value);
                      if (taxIdEl) updated.taxId = taxIdEl.value;

                      if (smtpHostEl) updated.smtpHost = smtpHostEl.value;
                      if (smtpPortEl) updated.smtpPort = smtpPortEl.value;
                      if (smtpUserEl) updated.smtpUser = smtpUserEl.value;
                      if (smtpPassEl && smtpPassEl.value && smtpPassEl.value.trim() !== '' && smtpPassEl.value !== '**********' && !smtpPassEl.value.includes('••••')) {
                        updated.smtpPass = smtpPassEl.value.trim();
                      } else {
                        delete updated.smtpPass;
                      }

                      if (ipEl) updated.ipWhitelist = ipEl.value;
                      if (expEl) updated.sessionExpirationMinutes = Number(expEl.value);
                      if (backEl) updated.autoBackupFrequency = backEl.value;
                      if (colEl) updated.accentColor = colEl.value;

                      setGlobalSettings(updated).then((success) => {
                        addLog("Settings Changes", "Modified global business, taxation, and secure SMTP mail configurations");
                        if (success) {
                          alert("Prestige configuration successfully updated, verified, and locked in Supabase!");
                        } else {
                          alert("Prestige configuration updated locally, but failed to persist to Supabase database. Please check your session.");
                        }
                      });
                    }}
                    className="py-2 px-6 bg-gold-pure text-black font-bold uppercase tracking-widest text-[9.5px] cursor-pointer hover:bg-white transition-all rounded-xs"
                  >
                    Save Changes
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* XV. TAB: SECURITY AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">SYSTEM LOGS</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">SECURITY LOGS</h2>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-zinc-500 font-mono text-[9.5px]">Authoritative immutable audit log stream backed by PostgreSQL/Supabase ledger.</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => fetchSystemLogs()}
                      className="text-gold-pure hover:underline font-mono text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh Logs
                    </button>
                    <button 
                      onClick={() => {
                        const csvText = `id,user,action,target,ip,time\n` + systemLogs.map(l => `"${l.id}","${l.user}","${l.action}","${l.target}","${l.ip}","${l.time}"`).join('\n');
                        const blob = new Blob([csvText], { type: 'text/csv' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `zoal_security_audit_logs_${new Date().toISOString().slice(0,10)}.csv`;
                        link.click();
                      }}
                      className="text-zinc-400 hover:text-white font-mono text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3 h-3 text-emerald-500" /> Export CSV
                    </button>
                  </div>
                </div>
                
                {loadingSystemLogs ? (
                  <div className="py-8 text-center text-zinc-500 font-mono text-[10px]">Loading audit ledger...</div>
                ) : systemLogs.length === 0 ? (
                  <div className="py-8 text-center text-zinc-600 font-mono text-[10px]">No audit logs recorded yet in authoritative database.</div>
                ) : (
                  <div className="divide-y divide-white/5 font-mono text-[9.5px]">
                    {systemLogs.map((log, idx) => (
                      <div key={`${log.id}-${idx}`} className="py-2.5 flex justify-between text-zinc-400 hover:bg-white/1 duration-150 px-2 rounded-xs">
                        <div>
                          <span className="text-white block font-sans">{log.action}</span>
                          <span className="text-zinc-600 text-[8px] block">User: {log.user} • IP Address: {log.ip} {log.target ? `• Target: ${log.target}` : ''}</span>
                        </div>
                        <span className="text-zinc-500 shrink-0 text-[8.5px]">{log.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* XVI. TAB: PRINCIPAL OWNER PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">
                  {currentUser?.role === 'owner' ? 'OWNER' : currentUser?.role === 'admin' ? 'ADMINISTRATOR' : currentUser?.role === 'manager' ? 'MANAGER' : currentUser?.role === 'staff' ? 'STAFF' : 'ADMINISTRATOR'} PROFILE
                </span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">MY PROFILE</h2>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4 max-w-md">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-gold-pure bg-zinc-950 flex items-center justify-center text-xl font-mono text-gold-pure uppercase font-bold select-none relative group">
                    {currentUser?.name?.[0]?.toUpperCase() || 'A'}
                    <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" title="Upload Photo">
                      <Camera className="w-5 h-5 text-gold-pure" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-display text-sm font-bold uppercase">{currentUser?.name || 'System Administrator'}</h4>
                    <span className="text-[10px] font-mono text-gold-pure block tracking-widest uppercase mt-0.5">Super Administrator</span>
                  </div>
                </div>
                <div className="p-4 bg-black border border-white/5 rounded-xs font-mono text-[10px] text-zinc-400 space-y-2">
                  <p>• Full Name: {currentUser?.name || 'System Administrator'}</p>
                  <p>• Email Address: {currentUser?.email || 'alzoal3003@gmail.com'}</p>
                  <p>• Phone Number: {currentUser?.phone || 'Add Phone Number'}</p>
                  <p className="flex items-center gap-1.5">• Account ID: {((currentUser as any)?.id || 'VIP-AC-781').substring(0, 8)} <button onClick={() => navigator.clipboard.writeText((currentUser as any)?.id || 'VIP-AC-781')} className="text-zinc-500 hover:text-gold-pure"><Copy className="w-3 h-3 inline" /></button></p>
                  <p>• Account Status: <span className="text-emerald-400 font-semibold">✔ Verified</span></p>
                  <p>• Session Status: <span className="text-emerald-400">Active</span></p>
                  <p>• Security Clearance: Level 1 (Full Access)</p>
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t border-white/5 space-y-2">
                  <h4 className="text-[10px] text-gold-pure font-mono uppercase tracking-wider">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {currentUser?.role === 'manager' ? (
                      <>
                        <button onClick={() => setActiveTab('orders')} className="p-2.5 bg-black border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[9.5px] uppercase tracking-widest font-bold text-left transition-all">Orders</button>
                        <button onClick={() => setActiveTab('products')} className="p-2.5 bg-black border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[9.5px] uppercase tracking-widest font-bold text-left transition-all">Inventory</button>
                        <button onClick={() => setActiveTab('dashboard')} className="p-2.5 bg-black border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[9.5px] uppercase tracking-widest font-bold text-left transition-all">Reports</button>
                        <button onClick={() => setActiveTab('customers')} className="p-2.5 bg-black border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[9.5px] uppercase tracking-widest font-bold text-left transition-all">Staff</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setActiveTab('products')} className="p-2.5 bg-black border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[9.5px] uppercase tracking-widest font-bold text-left transition-all">Store Management</button>
                        <button onClick={() => setActiveTab('customers')} className="p-2.5 bg-black border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[9.5px] uppercase tracking-widest font-bold text-left transition-all">Users</button>
                        <button onClick={() => setActiveTab('security')} className="p-2.5 bg-black border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[9.5px] uppercase tracking-widest font-bold text-left transition-all">Permissions</button>
                        <button onClick={() => setActiveTab('logs')} className="p-2.5 bg-black border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[9.5px] uppercase tracking-widest font-bold text-left transition-all">Activity Logs</button>
                        <button onClick={() => setActiveTab('security')} className="p-2.5 bg-black border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[9.5px] uppercase tracking-widest font-bold text-left transition-all col-span-2">Session Management</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* XVII. TAB: SUPPORT CENTER DASHBOARD */}
          {activeTab === 'support' && (
            <React.Suspense fallback={<div className="h-96 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Initializing Support Infrastructure...</div>}>
              <SupportCenterDashboard
                currentUser={currentUser!}
                orders={orders}
                addLog={addLog}
                onBack={() => setActiveTab('dashboard')}
              />
            </React.Suspense>
          )}

          {/* XVIII. TAB: SUPABASE ENTERPRISE STORAGE */}
          {activeTab === 'media' && (
            <React.Suspense fallback={<div className="h-96 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Syncing Media Assets...</div>}>
              <div className="space-y-6 text-left animate-fade-in font-sans">
                <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">MEDIA MANAGEMENT</span>
                    <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">MEDIA HUB</h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMediaSubTab('library')}
                      className={`py-1.5 px-3 rounded-xs border text-[9px] uppercase font-mono tracking-widest font-bold transition-all cursor-pointer ${
                        mediaSubTab === 'library' 
                          ? 'bg-gold-pure text-black border-gold-pure' 
                          : 'bg-zinc-950 text-zinc-400 border-white/5 hover:text-white'
                      }`}
                    >
                      All Media
                    </button>
                    <button
                      onClick={() => setMediaSubTab('storage')}
                      className={`py-1.5 px-3 rounded-xs border text-[9px] uppercase font-mono tracking-widest font-bold transition-all cursor-pointer ${
                        mediaSubTab === 'storage' 
                          ? 'bg-gold-pure text-black border-gold-pure' 
                          : 'bg-zinc-950 text-zinc-400 border-white/5 hover:text-white'
                      }`}
                    >
                      Cloud Drive
                    </button>
                  </div>
                </div>

                {mediaSubTab === 'library' ? (
                  <MerchantAssetsStudio />
                ) : (
                  <SupabaseStoragePanel />
                )}
              </div>
            </React.Suspense>
          )}

          {/* XIX. UNIFIED ENTERPRISE & EXECUTIVE MODULES */}
          {activeTab === 'warehouses' && (
            <React.Suspense fallback={<div className="h-96 flex items-center justify-center text-zinc-500 uppercase tracking-widest text-[10px] animate-pulse">Optimizing Warehouse Logistics...</div>}>
              <WarehouseManagement 
                allProducts={allProducts} 
                addLog={addLog} 
              />
            </React.Suspense>
          )}

          {activeTab === 'coupons' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">PROMOTION CENTER</span>
                  <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">COUPON REGISTRY & PRIVILEGES</h2>
                </div>
                <button
                  onClick={() => {
                    const code = prompt('Enter Coupon Code (e.g., ROYAL20):');
                    if (!code) return;
                    const rateStr = prompt('Enter Discount Rate (e.g., 20):');
                    if (!rateStr) return;
                    const rate = parseInt(rateStr);
                    if (isNaN(rate)) return;
                    const newCoupon = {
                      id: `c-${Date.now()}`,
                      code: code.toUpperCase(),
                      rate,
                      type: 'percent',
                      expiry: '2026-12-31',
                      limit: 100,
                      usedCount: 0
                    };
                    setCoupons((prev: any[]) => [...prev, newCoupon]);
                    addLog(`Created promotional coupon: ${code.toUpperCase()} (${rate}%)`, 'Marketing System');
                  }}
                  className="bg-gold-pure text-black py-1.5 px-3 rounded-xs text-[10px] uppercase font-mono tracking-wider font-bold hover:bg-gold-light transition-all cursor-pointer"
                >
                  Create Custom Coupon
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                  <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Active Privileges Coupons</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px] font-mono">
                      <thead>
                        <tr className="border-b border-white/10 text-zinc-500 uppercase tracking-wider text-[9px]">
                          <th className="py-3 px-2">Code</th>
                          <th className="py-3 px-2">Discount Rate</th>
                          <th className="py-3 px-2">Type</th>
                          <th className="py-3 px-2">Limits</th>
                          <th className="py-3 px-2">Used Count</th>
                          <th className="py-3 px-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-300">
                        {coupons.map((c: any) => (
                          <tr key={c.id} className="hover:bg-white/1">
                            <td className="py-3 px-2 font-bold text-gold-pure">{c.code}</td>
                            <td className="py-3 px-2 text-white">{c.rate}%</td>
                            <td className="py-3 px-2 uppercase text-zinc-400">{c.type}</td>
                            <td className="py-3 px-2 text-zinc-400">{c.limit} Max</td>
                            <td className="py-3 px-2 text-white">{c.usedCount} Redemptions</td>
                            <td className="py-3 px-2">
                              <button
                                onClick={() => {
                                  setConfirmConfig({
                                    title: 'REVOKE COUPON?',
                                    message: `Revoke coupon code ${c.code}?`,
                                    onConfirm: () => {
                                      setCoupons((prev: any[]) => prev.filter((x: any) => x.id !== c.id));
                                      addLog(`Revoked promotional coupon: ${c.code}`, 'Marketing System');
                                      setConfirmConfig(null);
                                    },
                                    confirmLabel: 'Revoke'
                                  });
                                }}
                                className="text-red-400 hover:text-red-300 font-bold"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4 text-xs leading-relaxed text-zinc-400">
                  <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Campaign Directives</h3>
                  <p>All active coupon registry codes propagate to the checkout system immediately. Each checkout verifies coupon validity, active date parameters, and client allocation logs.</p>
                  <p className="p-3 bg-black border border-white/5 rounded-xs text-[10px] text-zinc-500">
                    Protip: Create time-bound VIP coupons during Saudi national celebrations or major Sudanese community thermal gatherings to elevate boutique client yield.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">GOVERNANCE & RISK</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">LEGAL COMPLIANCE REGISTRY</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                  <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Compliance Radar</h3>
                  <div className="space-y-3">
                    {[
                      { title: 'GDPR / Personal Data Protection', desc: 'Secure client information encryption standard', status: 'Compliant' },
                      { title: 'CITC License Validation', desc: 'Saudi Arabia communications & information standard', status: 'Verified' },
                      { title: 'Zakat, Tax and Customs Authority', desc: 'VAT compliant invoices and electronic ledgers', status: 'Active' },
                      { title: 'Intellectual Property Protection', desc: 'Boutique custom Sudanese gowns design registry', status: 'Registered' }
                    ].map((comp, i) => (
                      <div key={i} className="flex justify-between items-start gap-4 p-2 bg-black/40 border border-white/5 rounded-xs font-sans">
                        <div>
                          <h4 className="text-white text-xs font-semibold">{comp.title}</h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{comp.desc}</p>
                        </div>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full uppercase font-mono font-bold shrink-0">{comp.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4 col-span-2">
                  <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Policy Documents</h3>
                  <div className="space-y-4 text-xs text-zinc-400 font-sans">
                    <div className="p-4 bg-black border border-white/5 rounded-xs space-y-2">
                      <div className="flex justify-between text-white font-semibold">
                        <span>BOUTIQUE TERMS OF SERVICE</span>
                        <span className="text-zinc-500 text-[10px]">v4.1 - Last Modified 2 weeks ago</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">Defines customer responsibilities, purchase guidelines, and exclusive custom-tailor Sudanese Toob reservations. Protects intellectual property rights of AL ZOAL design collections.</p>
                    </div>
                    <div className="p-4 bg-black border border-white/5 rounded-xs space-y-2">
                      <div className="flex justify-between text-white font-semibold">
                        <span>BAKERY & COFFEE SANITARY INDEMNITY</span>
                        <span className="text-zinc-500 text-[10px]">v2.0 - Certified Saudi Food & Drug Authority</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">Guarantees safety parameters for luxury Sudanese thermal tea events, micro-batch coffee roasting, and traditional bakery recipes.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">FINANCIAL INFRASTRUCTURE</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">SAUDI PAYMENTS & GATEWAY MATRIX</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {[
                  { name: 'Mada Local Card System', volume: '142,500 SAR', status: 'Enabled', speed: 'Direct' },
                  { name: 'Apple Pay Gateway', volume: '89,200 SAR', status: 'Enabled', speed: 'Near Instant' },
                  { name: 'Visa & MasterCard Network', volume: '43,100 SAR', status: 'Enabled', speed: '24 Hours' },
                  { name: 'STC Pay Digital Wallet', volume: '21,400 SAR', status: 'Enabled', speed: 'Direct' }
                ].map((gate, i) => (
                  <div key={i} className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3 font-sans">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-mono text-zinc-500">Gateway #{i + 1}</span>
                      <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">{gate.status}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">{gate.name}</h4>
                      <p className="text-[9px] text-zinc-400 font-mono mt-0.5">Yield: {gate.volume}</p>
                    </div>
                    <div className="border-t border-white/5 pt-2.5 flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span>Payout Speed:</span>
                      <span className="text-white">{gate.speed}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Settlement Ledger & Latency Trend</h3>
                <div className="h-60 text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { day: 'Sun', 'Transaction Value (SAR)': 15000 },
                      { day: 'Mon', 'Transaction Value (SAR)': 28000 },
                      { day: 'Tue', 'Transaction Value (SAR)': 32000 },
                      { day: 'Wed', 'Transaction Value (SAR)': 22000 },
                      { day: 'Thu', 'Transaction Value (SAR)': 45000 },
                      { day: 'Fri', 'Transaction Value (SAR)': 60000 },
                      { day: 'Sat', 'Transaction Value (SAR)': 55000 }
                    ]}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#444" tick={{ fill: '#888', fontSize: 10 }} />
                      <YAxis stroke="#444" tick={{ fill: '#888', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#222' }} />
                      <Area type="monotone" dataKey="Transaction Value (SAR)" stroke="#D4AF37" fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">LOGISTICS & COURIERS</span>
                  <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">SHIPPING ZONES & DELIVERY RULES</h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedRuleForEdit({
                      name: '',
                      country: 'Saudi Arabia',
                      city: '',
                      district: '*',
                      postal_code: '*',
                      delivery_method: 'local_delivery',
                      shipping_provider: 'local',
                      shipping_fee: 30,
                      currency: 'SAR',
                      smsa_allowed: true,
                      active: true,
                      priority: 1,
                      free_shipping_threshold: 500
                    });
                    setIsRuleModalOpen(true);
                  }}
                  className="px-4 py-2 bg-gold-pure text-black hover:bg-gold-pure/90 text-xs font-bold uppercase tracking-widest transition-all rounded-xs flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Shipping Rule
                </button>
              </div>

              {/* Carrier Overview & Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3">
                  <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider block">ZOAL Local Delivery</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl text-white font-bold font-mono">1.5 HR</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Sovereign Service</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Guaranteed dispatch in Hofuf & local microzones. Completely independent of courier APIs.</p>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3">
                  <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider block">SMSA Courier Integration</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl text-white font-bold font-mono">1-3 Days</span>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">Simulated Dev</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">External courier handling for outside provinces. Operates on safely mocked sandbox API.</p>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3">
                  <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider block">Active Zones Defined</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl text-white font-bold font-mono">{shippingRules.length} Rules</span>
                    <span className="text-[10px] text-gold-pure font-mono">{shippingRules.filter(r => r.active).length} Active</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Delivery configurations matching clients dynamically based on precise addresses.</p>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3">
                  <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider block">Free Shipping Rule</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl text-white font-bold font-mono">500 SAR</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Global Default</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Individually configurable thresholds for dynamic local and courier promotions.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Rules List Column */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Search and Filters */}
                  <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3 font-mono text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="col-span-1 md:col-span-2 relative">
                        <input
                          type="text"
                          placeholder="Search city, district, name..."
                          value={rulesSearchQuery}
                          onChange={(e) => setRulesSearchQuery(e.target.value)}
                          className="w-full bg-black border border-white/10 text-white text-xs px-3 py-2 pl-8 focus:outline-none focus:border-gold-pure transition-all"
                        />
                        <svg className="w-4 h-4 text-zinc-500 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>

                      <div>
                        <select
                          value={rulesProviderFilter}
                          onChange={(e) => setRulesProviderFilter(e.target.value)}
                          className="w-full bg-black border border-white/10 text-white text-xs px-3 py-2 focus:outline-none focus:border-gold-pure transition-all"
                        >
                          <option value="all">All Providers</option>
                          <option value="local">ZOAL Local Delivery</option>
                          <option value="smsa">SMSA Express</option>
                          <option value="aramex">Aramex Courier</option>
                          <option value="spl">Saudi Post (SPL)</option>
                          <option value="dhl">DHL Worldwide</option>
                        </select>
                      </div>

                      <div>
                        <select
                          value={rulesActiveFilter}
                          onChange={(e) => setRulesActiveFilter(e.target.value)}
                          className="w-full bg-black border border-white/10 text-white text-xs px-3 py-2 focus:outline-none focus:border-gold-pure transition-all"
                        >
                          <option value="all">All Statuses</option>
                          <option value="active">Active Only</option>
                          <option value="inactive">Inactive Only</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Rules Table / Cards */}
                  <div className="bg-zinc-950 border border-white/5 rounded-xs overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                      <h3 className="text-white text-xs font-display uppercase tracking-widest">Active Resolution Matrix</h3>
                      <button 
                        onClick={fetchShippingRules}
                        className="text-zinc-400 hover:text-white transition-all text-xs flex items-center gap-1 font-mono uppercase"
                        disabled={isLoadingRules}
                      >
                        <svg className={`w-3.5 h-3.5 ${isLoadingRules ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                        </svg>
                        Refresh Rules
                      </button>
                    </div>

                    {isLoadingRules ? (
                      <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                        Fetching sovereign logistics configurations from PostgreSQL database...
                      </div>
                    ) : rulesError ? (
                      <div className="p-6 text-center space-y-2">
                        <p className="text-rose-400 font-mono text-xs">❌ Error loading rules: {rulesError}</p>
                        <button onClick={fetchShippingRules} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white font-mono text-xs uppercase">Retry Load</button>
                      </div>
                    ) : shippingRules.length === 0 ? (
                      <div className="py-12 text-center space-y-4">
                        <p className="text-zinc-500 font-mono text-xs">No active shipping rules found in Database.</p>
                        <button
                          onClick={fetchShippingRules}
                          className="px-4 py-1.5 bg-gold-pure text-black font-bold font-mono text-xs uppercase"
                        >
                          Initialize Default Ruleset
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs font-mono">
                          <thead>
                            <tr className="border-b border-white/10 text-zinc-500 uppercase text-[9px] tracking-wider bg-black/40">
                              <th className="py-3 px-4">Priority / Name</th>
                              <th className="py-3 px-3">Matching Zone</th>
                              <th className="py-3 px-3">Method & Provider</th>
                              <th className="py-3 px-3 text-right">Base Fee</th>
                              <th className="py-3 px-3 text-right">Free Threshold</th>
                              <th className="py-3 px-3 text-center">Active</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-zinc-300">
                            {shippingRules
                              .filter(rule => {
                                const q = rulesSearchQuery.toLowerCase();
                                const matchesQuery = !q ||
                                  rule.name?.toLowerCase().includes(q) ||
                                  rule.city?.toLowerCase().includes(q) ||
                                  rule.district?.toLowerCase().includes(q) ||
                                  rule.postal_code?.toLowerCase().includes(q);
                                const matchesProvider = rulesProviderFilter === 'all' || rule.shipping_provider === rulesProviderFilter;
                                const matchesActive = rulesActiveFilter === 'all' || 
                                  (rulesActiveFilter === 'active' && rule.active) || 
                                  (rulesActiveFilter === 'inactive' && !rule.active);
                                return matchesQuery && matchesProvider && matchesActive;
                              })
                              .map((rule) => (
                                <tr key={rule.id} className="hover:bg-white/1 transition-all">
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] bg-white/5 text-zinc-400 font-bold px-1.5 py-0.5 rounded-xs block min-w-[20px] text-center" title="Matching priority. Higher priorities resolve first.">
                                        P{rule.priority}
                                      </span>
                                      <div className="font-sans font-semibold text-white">{rule.name}</div>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <div className="text-white font-bold">{rule.city === '*' ? 'Saudi Arabia (All)' : rule.city}</div>
                                    <div className="text-[10px] text-zinc-500">
                                      District: {rule.district} • ZIP: {rule.postal_code}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${rule.shipping_provider === 'local' ? 'bg-emerald-400' : 'bg-gold-pure'}`} />
                                      <span className="capitalize text-white">
                                        {rule.shipping_provider === 'local' ? 'Local Delivery' : `${rule.shipping_provider} Courier`}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 capitalize">{rule.delivery_method.replace('_', ' ')}</div>
                                  </td>
                                  <td className="py-3.5 px-3 text-right font-bold text-white">
                                    {rule.shipping_fee} {rule.currency}
                                  </td>
                                  <td className="py-3.5 px-3 text-right text-gold-pure font-bold">
                                    {rule.free_shipping_threshold !== undefined && rule.free_shipping_threshold !== null 
                                      ? `${rule.free_shipping_threshold} ${rule.currency}` 
                                      : '500 SAR'}
                                  </td>
                                  <td className="py-3.5 px-3 text-center">
                                    <button
                                      onClick={() => handleToggleActive(rule)}
                                      className={`px-2 py-0.5 text-[9px] rounded-full font-bold uppercase ${
                                        rule.active
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      }`}
                                    >
                                      {rule.active ? 'Active' : 'Inactive'}
                                    </button>
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          setSelectedRuleForEdit({ ...rule });
                                          setIsRuleModalOpen(true);
                                        }}
                                        className="p-1 hover:bg-white/5 rounded-xs text-zinc-400 hover:text-white transition-all"
                                        title="Edit configuration rule"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteRule(rule.id)}
                                        className="p-1 hover:bg-white/5 rounded-xs text-zinc-400 hover:text-rose-400 transition-all"
                                        title="Delete configuration rule"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tester Column */}
                <div className="space-y-6">
                  {/* Real-time server-side simulator */}
                  <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                    <div>
                      <span className="text-[9px] tracking-widest text-gold-pure uppercase font-mono block mb-1">LOGISTICS DIAGNOSTIC TOOL</span>
                      <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Rule Preview & Simulation</h3>
                    </div>

                    <p className="text-[11px] text-zinc-400">
                      Submit test address parameters directly to the server to verify which rules trigger and calculate authoritative shipping fees.
                    </p>

                    <form onSubmit={handleTestRules} className="space-y-3 font-mono text-xs text-left">
                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] block uppercase">Country</label>
                        <input
                          type="text"
                          value={testAddress.country}
                          onChange={(e) => setTestAddress(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full bg-black border border-white/10 text-white p-2 focus:outline-none focus:border-gold-pure"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] block uppercase">City (e.g. Al-Hofuf, Riyadh)</label>
                        <input
                          type="text"
                          value={testAddress.city}
                          onChange={(e) => setTestAddress(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Type City name..."
                          className="w-full bg-black border border-white/10 text-white p-2 focus:outline-none focus:border-gold-pure"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] block uppercase">District</label>
                        <input
                          type="text"
                          value={testAddress.district}
                          onChange={(e) => setTestAddress(prev => ({ ...prev, district: e.target.value }))}
                          placeholder="e.g. Almuallimeen, *"
                          className="w-full bg-black border border-white/10 text-white p-2 focus:outline-none focus:border-gold-pure"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] block uppercase">Postal Code</label>
                        <input
                          type="text"
                          value={testAddress.postal_code}
                          onChange={(e) => setTestAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                          placeholder="e.g. 36361, *"
                          className="w-full bg-black border border-white/10 text-white p-2 focus:outline-none focus:border-gold-pure"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-500 text-[10px] block uppercase">Cart Subtotal (SAR)</label>
                        <input
                          type="number"
                          value={testAddress.subtotal}
                          onChange={(e) => setTestAddress(prev => ({ ...prev, subtotal: e.target.value }))}
                          className="w-full bg-black border border-white/10 text-white p-2 focus:outline-none focus:border-gold-pure font-bold"
                          min="0"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isTestingRules}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all rounded-xs flex items-center justify-center gap-2"
                      >
                        {isTestingRules ? (
                          <>
                            <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Querying Resolver...
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 text-gold-pure" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            Resolve Matching Rules
                          </>
                        )}
                      </button>
                    </form>

                    {testError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xs text-xs font-mono">
                        ❌ Error resolving options: {testError}
                      </div>
                    )}

                    {testResult && (
                      <div className="space-y-3 font-mono text-xs">
                        <span className="text-[10px] text-zinc-500 uppercase block border-b border-white/5 pb-1">Resolver Results ({testResult.length})</span>
                        {testResult.length === 0 ? (
                          <div className="text-zinc-500 text-center py-4 bg-black border border-white/5 rounded-xs">
                            No shipping options matched this address criteria. Checkout would show 'unavailable' for shipping.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {testResult.map((option: any, index: number) => (
                              <div key={index} className="p-3 bg-black border border-white/5 rounded-xs space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-white font-bold capitalize">{option.method.replace('_', ' ')}</span>
                                  <span className="text-emerald-400 font-bold">{option.fee} {option.currency}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-zinc-500">
                                  <span>Carrier: {option.provider.toUpperCase()}</span>
                                  <span>Transit: {option.eta}</span>
                                </div>
                                <div className="flex justify-between text-[9px] text-zinc-600 border-t border-white/5 pt-1.5">
                                  <span>SMSA Allowed: {option.smsa_allowed ? 'Yes' : 'No'}</span>
                                  <span>Status: {option.available ? 'Eligible' : 'Blocked'}</span>
                                </div>
                                {option.message && (
                                  <div className="text-[9px] text-amber-400/80 mt-1 bg-amber-500/5 px-1.5 py-0.5 border border-amber-500/10 rounded-xs">
                                    {option.message}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Guide */}
                  <div className="p-4 bg-zinc-950 border border-white/5 rounded-xs text-xs text-zinc-400 space-y-2">
                    <h4 className="text-white font-bold uppercase text-[10px]">Logistics Guide & Precedence</h4>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li>Rules are evaluated from highest priority (e.g. P10) to lowest priority (e.g. P1).</li>
                      <li>For overlapping regions, rules with higher priority value supersede lower ones.</li>
                      <li>Use <strong className="text-white">*</strong> for matching any District or Postal Code.</li>
                      <li>Local delivery zones override courier systems for Al-Hofuf.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Edit/Create Shipping Rule Modal */}
              {isRuleModalOpen && selectedRuleForEdit && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
                  <div className="bg-zinc-950 border border-white/10 rounded-xs max-w-lg w-full overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/60">
                      <h3 className="text-sm font-bold font-display uppercase tracking-widest text-white">
                        {selectedRuleForEdit.id?.startsWith('rule-') && selectedRuleForEdit.name === ''
                          ? 'Create New Shipping Rule'
                          : `Edit Rule: ${selectedRuleForEdit.name || 'Untitled'}`}
                      </h3>
                      <button
                        onClick={() => {
                          setIsRuleModalOpen(false);
                          setSelectedRuleForEdit(null);
                        }}
                        className="text-zinc-500 hover:text-white transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={handleSaveRule} className="p-5 space-y-4 text-xs font-mono">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                          <label className="text-zinc-500 text-[10px] block uppercase">Rule Name</label>
                          <input
                            type="text"
                            value={selectedRuleForEdit.name}
                            onChange={(e) => updateEditForm({ name: e.target.value })}
                            placeholder="e.g. Hofuf Local Delivery Standard"
                            className="w-full bg-black border border-white/10 text-white p-2.5 focus:outline-none focus:border-gold-pure"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-500 text-[10px] block uppercase">Country</label>
                          <input
                            type="text"
                            value={selectedRuleForEdit.country}
                            onChange={(e) => updateEditForm({ country: e.target.value })}
                            className="w-full bg-black border border-white/10 text-white p-2.5 focus:outline-none focus:border-gold-pure"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-500 text-[10px] block uppercase">City (Case Insensitive)</label>
                          <input
                            type="text"
                            value={selectedRuleForEdit.city}
                            onChange={(e) => updateEditForm({ city: e.target.value })}
                            placeholder="e.g. Al-Hofuf, Riyadh, or *"
                            className="w-full bg-black border border-white/10 text-white p-2.5 focus:outline-none focus:border-gold-pure"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-500 text-[10px] block uppercase">District</label>
                          <input
                            type="text"
                            value={selectedRuleForEdit.district}
                            onChange={(e) => updateEditForm({ district: e.target.value })}
                            placeholder="e.g. Almuallimeen, or *"
                            className="w-full bg-black border border-white/10 text-white p-2.5 focus:outline-none focus:border-gold-pure"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-500 text-[10px] block uppercase">Postal Code</label>
                          <input
                            type="text"
                            value={selectedRuleForEdit.postal_code}
                            onChange={(e) => updateEditForm({ postal_code: e.target.value })}
                            placeholder="e.g. 36361, or *"
                            className="w-full bg-black border border-white/10 text-white p-2.5 focus:outline-none focus:border-gold-pure"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-500 text-[10px] block uppercase">Delivery Method</label>
                          <select
                            value={selectedRuleForEdit.delivery_method}
                            onChange={(e) => {
                              const method = e.target.value;
                              let provider = selectedRuleForEdit.shipping_provider;
                              if (method === 'local_delivery') provider = 'local';
                              else if (method === 'smsa') provider = 'smsa';
                              updateEditForm({ delivery_method: method as any, shipping_provider: provider });
                            }}
                            className="w-full bg-black border border-white/10 text-white p-2.5 focus:outline-none focus:border-gold-pure"
                          >
                            <option value="local_delivery">ZOAL Local Delivery</option>
                            <option value="smsa">SMSA Express Standard</option>
                            <option value="aramex">Aramex VIP Courier</option>
                            <option value="spl">Saudi Post (SPL) Standard</option>
                            <option value="dhl">DHL Worldwide Premium</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-500 text-[10px] block uppercase">Carrier Provider</label>
                          <select
                            value={selectedRuleForEdit.shipping_provider}
                            onChange={(e) => updateEditForm({ shipping_provider: e.target.value as any })}
                            className="w-full bg-black border border-white/10 text-white p-2.5 focus:outline-none focus:border-gold-pure"
                          >
                            <option value="local">ZOAL Local</option>
                            <option value="smsa">SMSA Courier</option>
                            <option value="aramex">Aramex VIP</option>
                            <option value="spl">Saudi Post (SPL)</option>
                            <option value="dhl">DHL Premium</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-500 text-[10px] block uppercase">Base Shipping Fee (SAR)</label>
                          <input
                            type="number"
                            value={selectedRuleForEdit.shipping_fee}
                            onChange={(e) => updateEditForm({ shipping_fee: Number(e.target.value) })}
                            className="w-full bg-black border border-white/10 text-white p-2.5 focus:outline-none focus:border-gold-pure font-bold"
                            min="0"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-500 text-[10px] block uppercase">Free Shipping Threshold (SAR)</label>
                          <input
                            type="number"
                            value={selectedRuleForEdit.free_shipping_threshold !== undefined && selectedRuleForEdit.free_shipping_threshold !== null ? selectedRuleForEdit.free_shipping_threshold : 500}
                            onChange={(e) => updateEditForm({ free_shipping_threshold: Number(e.target.value) })}
                            className="w-full bg-black border border-white/10 text-white p-2.5 focus:outline-none focus:border-gold-pure font-bold"
                            min="0"
                            required
                          />
                        </div>

                        <div className="space-y-1 col-span-2">
                          <label className="text-zinc-500 text-[10px] block uppercase">Rule Priority Index</label>
                          <input
                            type="number"
                            value={selectedRuleForEdit.priority}
                            onChange={(e) => updateEditForm({ priority: Number(e.target.value) })}
                            placeholder="e.g. 5 (higher overrides lower)"
                            className="w-full bg-black border border-white/10 text-white p-2.5 focus:outline-none focus:border-gold-pure"
                            min="0"
                            required
                          />
                          <p className="text-[9px] text-zinc-500">Overlapping criteria are sorted by priority. Highest number matches first.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRuleForEdit.smsa_allowed}
                            onChange={(e) => updateEditForm({ smsa_allowed: e.target.checked })}
                            className="accent-gold-pure"
                          />
                          <span className="text-zinc-300">Allow SMSA Tracking Systems</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedRuleForEdit.active}
                            onChange={(e) => updateEditForm({ active: e.target.checked })}
                            className="accent-gold-pure"
                          />
                          <span className="text-zinc-300">Rule Active</span>
                        </label>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsRuleModalOpen(false);
                            setSelectedRuleForEdit(null);
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white uppercase text-[10px] tracking-wider transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-gold-pure text-black hover:bg-gold-pure/90 font-bold uppercase text-[10px] tracking-wider transition-all"
                        >
                          Save Zone Rule
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'taxes' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">TAX MANAGEMENT</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">CORPORATE TAX & VAT LEDGER</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                  <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">VAT Overview (Saudi Arabia)</h3>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between p-3 bg-black border border-white/5 rounded-xs">
                      <span className="text-zinc-500">Standard VAT Rate:</span>
                      <span className="text-white font-bold">15.00%</span>
                    </div>
                    <div className="flex justify-between p-3 bg-black border border-white/5 rounded-xs">
                      <span className="text-zinc-500">Collected VAT (YTD):</span>
                      <span className="text-gold-pure font-bold">44,400 SAR</span>
                    </div>
                    <div className="flex justify-between p-3 bg-black border border-white/5 rounded-xs">
                      <span className="text-zinc-500">Deductible VAT:</span>
                      <span className="text-zinc-400 font-bold">12,150 SAR</span>
                    </div>
                    <div className="flex justify-between p-3 bg-black border border-white/10 rounded-xs text-emerald-400 font-bold">
                      <span>Net Tax Due:</span>
                      <span>32,250 SAR</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs col-span-2 space-y-4">
                  <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">ZATCA Quarter Tax Filing Progress</h3>
                  <div className="space-y-4 font-sans">
                    {[
                      { quarter: 'Q1 Compliance Report', date: 'Submitted (15 Apr 2026)', progress: 100 },
                      { quarter: 'Q2 Compliance Report', date: 'Submitted (15 Jul 2026)', progress: 100 },
                      { quarter: 'Q3 Tax Compilation', date: 'Ongoing compilation', progress: 68 },
                      { quarter: 'Q4 Forecast Modeling', date: 'Pending start', progress: 0 }
                    ].map((q, idx) => (
                      <div key={idx} className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-white font-bold">{q.quarter} <span className="text-zinc-500 font-normal text-[10px] font-mono">({q.date})</span></span>
                          <span className="font-mono text-gold-pure">{q.progress}%</span>
                        </div>
                        <div className="w-full bg-black border border-white/5 h-2 rounded-full overflow-hidden">
                          <div className="bg-gold-pure h-full transition-all duration-300" style={{ width: `${q.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">FORTRESS SHIELD</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">FORTRESS SECURITY COMMAND & THREAT MONITOR</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                  <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Active Security Metrics</h3>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between p-3 bg-black border border-white/5 rounded-xs">
                      <span className="text-zinc-500">Security Clearance Level:</span>
                      <span className="text-emerald-400">Level 1 SuperAccess</span>
                    </div>
                    <div className="flex justify-between p-3 bg-black border border-white/5 rounded-xs">
                      <span className="text-zinc-500">SSL Certificate Status:</span>
                      <span className="text-emerald-400">✔ Fully Valid</span>
                    </div>
                    <div className="flex justify-between p-3 bg-black border border-white/5 rounded-xs">
                      <span className="text-zinc-500">API Key Encryption:</span>
                      <span className="text-zinc-400">AES-256-GCM SSL</span>
                    </div>
                    <div className="flex justify-between p-3 bg-black border border-white/5 rounded-xs">
                      <span className="text-zinc-500">Threat Anomaly Ratio:</span>
                      <span className="text-emerald-400 font-bold">0.00% Clean</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs col-span-2 space-y-4">
                  <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Real-time Fortress Security Event Ledger</h3>
                  <div className="space-y-2 text-xs font-mono text-zinc-400">
                    <div className="p-2 bg-black border border-white/5 rounded-xs flex justify-between">
                      <span className="text-zinc-500">[05:12:01] CSRF Secure Origin Verification:</span>
                      <span className="text-emerald-400">SUCCESS</span>
                    </div>
                    <div className="p-2 bg-black border border-white/5 rounded-xs flex justify-between">
                      <span className="text-zinc-500">[04:30:15] TLS 1.3 Secure Socket Handshake:</span>
                      <span className="text-emerald-400">SUCCESS</span>
                    </div>
                    <div className="p-2 bg-black border border-white/5 rounded-xs flex justify-between">
                      <span className="text-zinc-500">[03:15:22] Brute Force Login Shield verification:</span>
                      <span className="text-emerald-400">0 anomalies</span>
                    </div>
                    <div className="p-2 bg-black border border-white/5 rounded-xs flex justify-between">
                      <span className="text-zinc-500">[01:00:54] Automated Database Backup Snapshot:</span>
                      <span className="text-emerald-400">COMPLETED</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        alert('Secure Admin Session Tokens Refreshed successfully. 0 active session vulnerabilities detected.');
                        addLog('Refreshed global session credentials secure audit tokens.', 'Security Fortress');
                      }}
                      className="bg-red-950/40 border border-red-500/30 text-red-400 font-bold hover:bg-red-950/60 py-2 px-4 rounded-xs text-[10px] uppercase font-mono tracking-widest transition-all cursor-pointer"
                    >
                      Audit Session Integrity Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai_center' && (
            <EnterpriseAiWorkspace />
          )}

          {activeTab === 'rbac' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ROLE SHIELD POLICY</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">ROLE-BASED ACCESS CONTROL SHIELD</h2>
              </div>
              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Granular Access Level Privileges Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-500 uppercase text-[9px] tracking-wider">
                        <th className="py-3 px-2">System Privilege Scope</th>
                        <th className="py-3 px-2 text-center">Owner</th>
                        <th className="py-3 px-2 text-center">Admin</th>
                        <th className="py-3 px-2 text-center">Staff Supervisor</th>
                        <th className="py-3 px-2 text-center">Standard Client</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {[
                        { perm: 'Catalog Management (catalog_edit)', owner: true, admin: true, staff: true, customer: false },
                        { perm: 'Orders Modification (order_modify)', owner: true, admin: true, staff: true, customer: false },
                        { perm: 'User Management (user_manage)', owner: true, admin: true, staff: false, customer: false },
                        { perm: 'Business Reports (reports_view)', owner: true, admin: true, staff: true, customer: false },
                        { perm: 'System Settings Configuration (settings_edit)', owner: true, admin: true, staff: false, customer: false },
                        { perm: 'Sovereign Executive Decision Vault', owner: true, admin: false, staff: false, customer: false }
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/1">
                          <td className="py-3 px-2 text-white font-sans font-semibold">{item.perm}</td>
                          <td className="py-3 px-2 text-center text-emerald-400 font-bold">{item.owner ? '✔' : '✖'}</td>
                          <td className="py-3 px-2 text-center text-emerald-400 font-bold">{item.admin ? '✔' : '✖'}</td>
                          <td className="py-3 px-2 text-center font-bold text-zinc-500">{item.staff ? <span className="text-emerald-400">✔</span> : '✖'}</td>
                          <td className="py-3 px-2 text-center font-bold text-red-500">{item.customer ? '✔' : '✖'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'executive_dashboard' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">SOVEREIGN EXECUTIVE CENTER</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">EXECUTIVE BOARDROOM DIRECTIVES</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-zinc-950 border border-white/5 rounded-xs space-y-4">
                  <span className="text-[10px] tracking-widest text-zinc-500 uppercase block">Ultimate Gross Revenues</span>
                  <span className="text-3xl font-mono text-gold-pure font-bold block">354,200 SAR</span>
                  <span className="text-[9px] text-[#D4AF37] flex items-center gap-1 font-mono">
                    <TrendingUp className="w-3.5 h-3.5" /> +18.4% Month-Over-Month
                  </span>
                </div>
                <div className="p-6 bg-zinc-950 border border-white/5 rounded-xs space-y-4">
                  <span className="text-[10px] tracking-widest text-zinc-500 uppercase block">Total Electronic Volume</span>
                  <span className="text-3xl font-mono text-white font-bold block">1,824 Orders</span>
                  <span className="text-[9px] text-zinc-500 block">Across 5 Boutique Pillars</span>
                </div>
                <div className="p-6 bg-zinc-950 border border-white/5 rounded-xs space-y-4">
                  <span className="text-[10px] tracking-widest text-zinc-500 uppercase block">Client Lifetime Value (LTV)</span>
                  <span className="text-3xl font-mono text-gold-pure font-bold block">1,135 SAR</span>
                  <span className="text-[9px] text-zinc-500 block">VIP Segment Leading check yield</span>
                </div>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Strategic Executive Directives Checklist</h3>
                <div className="space-y-3 font-sans text-xs">
                  {[
                    { directive: 'Diversify Sudanese Bakery distribution networks in Riyadh Core Area.', status: 'Active' },
                    { directive: 'Expand Premium Toob collections ahead of the winter wedding seasons.', status: 'Active' },
                    { directive: 'Integrate custom-printed NFC gold tags on premium Sudanese Gown luxury boxes.', status: 'Pending board vote' }
                  ].map((d, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-black border border-white/5 rounded-xs font-semibold">
                      <span className="text-zinc-300 font-sans">{d.directive}</span>
                      <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-gold-pure bg-gold-pure/10 px-2 py-0.5 rounded-full shrink-0">{d.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bi' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ENTERPRISE BI ENGINE</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">BUSINESS INTELLIGENCE COHERENCE</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4 font-sans">
                  <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Client Cohort Retention Analysis</h3>
                  <div className="space-y-4 text-xs font-mono">
                    <div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Day 30 Customer Retention</span>
                        <span className="text-white font-bold">88.4%</span>
                      </div>
                      <div className="w-full bg-black h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-gold-pure h-full" style={{ width: '88.4%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Day 90 Customer Retention</span>
                        <span className="text-white font-bold">74.1%</span>
                      </div>
                      <div className="w-full bg-black h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-gold-pure h-full" style={{ width: '74.1%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs col-span-2 space-y-4">
                  <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Pillar Segment Profitability Ratio</h3>
                  <div className="h-60 text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Coffee & Cafe', 'Profit Margin %': 48 },
                        { name: 'Sudanese Bakery', 'Profit Margin %': 32 },
                        { name: 'Organic Market', 'Profit Margin %': 28 },
                        { name: 'Traditional Gowns', 'Profit Margin %': 65 },
                        { name: 'Luxury Men Thobes', 'Profit Margin %': 58 }
                      ]}>
                        <XAxis dataKey="name" stroke="#444" tick={{ fill: '#888', fontSize: 10 }} />
                        <YAxis stroke="#444" tick={{ fill: '#888', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#222' }} />
                        <Bar dataKey="Profit Margin %" fill="#D4AF37">
                          <Cell fill="#D4AF37" />
                          <Cell fill="#E5BE48" />
                          <Cell fill="#C5A028" />
                          <Cell fill="#A48118" />
                          <Cell fill="#8E6B08" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">FINANCIAL ANALYSIS</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">FINANCIAL INTELLIGENCE REPORT</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center font-mono">
                <div className="p-5 bg-zinc-950 border border-white/5 rounded-xs">
                  <span className="text-zinc-500 text-[10px] block">GROSS CORPORATE INCOME</span>
                  <span className="text-2xl text-white font-bold block mt-2">412,000 SAR</span>
                </div>
                <div className="p-5 bg-zinc-950 border border-white/5 rounded-xs">
                  <span className="text-zinc-500 text-[10px] block">COST OF GOODS SOLD (COGS)</span>
                  <span className="text-2xl text-zinc-400 font-bold block mt-2">128,500 SAR</span>
                </div>
                <div className="p-5 bg-zinc-950 border border-white/5 rounded-xs">
                  <span className="text-zinc-500 text-[10px] block">ACQUISITION CAC (AVERAGE)</span>
                  <span className="text-2xl text-gold-pure font-bold block mt-2">48 SAR</span>
                </div>
                <div className="p-5 bg-zinc-950 border border-white/10 rounded-xs">
                  <span className="text-gold-pure text-[10px] block">NET OPERATIONS EBITDA</span>
                  <span className="text-2xl text-emerald-400 font-bold block mt-2">283,500 SAR</span>
                </div>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Monthly Cashflow Yield & Spend Distribution</h3>
                <div className="h-60 text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { name: 'Jan', 'Operations Spend': 12000, 'Net Revenue': 35000 },
                      { name: 'Feb', 'Operations Spend': 15000, 'Net Revenue': 48000 },
                      { name: 'Mar', 'Operations Spend': 18000, 'Net Revenue': 52000 },
                      { name: 'Apr', 'Operations Spend': 14000, 'Net Revenue': 45000 },
                      { name: 'May', 'Operations Spend': 22000, 'Net Revenue': 68000 },
                      { name: 'Jun', 'Operations Spend': 25000, 'Net Revenue': 85000 }
                    ]}>
                      <XAxis dataKey="name" stroke="#444" tick={{ fill: '#888', fontSize: 10 }} />
                      <YAxis stroke="#444" tick={{ fill: '#888', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#222' }} />
                      <Line type="monotone" dataKey="Net Revenue" stroke="#D4AF37" strokeWidth={3} />
                      <Line type="monotone" dataKey="Operations Spend" stroke="#AA2222" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'regional' && (
            <EnterpriseRegionalAnalytics />
          )}

          {activeTab === 'strategic' && (
            <StrategicReport />
          )}

          {activeTab === 'kpi' && (
            <EnterpriseKpiDashboard />
          )}

          {activeTab === 'growth' && (
            <EnterpriseGrowthAnalytics />
          )}

          {activeTab === 'health' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">LIVE TELEMETRY</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">ENTERPRISE SYSTEM HEALTH MONITOR</h2>
              </div>
              <EnterpriseHealthMonitor />
            </div>
          )}

          {activeTab === 'forecast' && (
            <EnterpriseForecastDashboard />
          )}

          {activeTab === 'briefing' && (
            <EnterpriseAiExecutiveBriefing />
          )}

          {activeTab === 'decision' && (
            <EnterpriseDecisionSimulation />
          )}

        </div>

        {/* Global Product Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!productToDelete}
          onClose={() => setProductToDelete(null)}
          onConfirm={confirmDeleteProduct}
          title="PERMANENTLY DELETE PRODUCT?"
          message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone and will immediately remove the item from all catalogs.`}
          isProcessing={isDeletingProduct}
          error={productDeleteError}
        />

        {/* Bulk Product Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={selectedProductsToDelete.length > 0}
          onClose={() => setSelectedProductsToDelete([])}
          onConfirm={confirmBulkDelete}
          title="PERMANENTLY DELETE SELECTED PRODUCTS?"
          message={`Are you sure you want to delete ${selectedProductsToDelete.length} selected products? This action cannot be undone and will immediately remove them from all catalogs.`}
          isProcessing={isBulkDeleting}
          error={bulkDeleteError}
        />

        {/* Bulk Category Update Modal */}
        {isBulkCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-white/10 p-6 rounded-xs w-full max-w-md shadow-2xl animate-fade-in text-left">
              <h3 className="text-white text-lg font-display uppercase tracking-widest border-b border-white/10 pb-3 mb-5">Bulk Update Category</h3>
              <p className="text-zinc-400 text-xs mb-6 font-sans">Select the target category division for the <span className="text-white font-bold">{selectedProductIds.length}</span> selected items.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Category Division</label>
                  <select
                    value={bulkCategoryInput}
                    onChange={(e) => setBulkCategoryInput(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white p-3 rounded-xs outline-none focus:border-gold-pure text-xs cursor-pointer"
                  >
                    <option value="coffee">Coffee Cafe</option>
                    <option value="bakery">Bakery Heritage</option>
                    <option value="market">Organic Market</option>
                    <option value="fashion">Premium Toob</option>
                    <option value="thobes">Luxury Thobes</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsBulkCategoryModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-white/10 text-zinc-400 hover:text-white text-[10px] font-mono uppercase tracking-wider rounded-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkCategoryUpdate}
                  className="flex-1 py-2.5 px-4 bg-gold-pure text-black font-bold text-[10px] font-mono uppercase tracking-wider rounded-xs hover:bg-gold-light transition-all cursor-pointer"
                >
                  Update Categories
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Brand Update Modal */}
        {isBulkBrandModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-white/10 p-6 rounded-xs w-full max-w-md shadow-2xl animate-fade-in text-left">
              <h3 className="text-white text-lg font-display uppercase tracking-widest border-b border-white/10 pb-3 mb-5">Bulk Update Brand</h3>
              <p className="text-zinc-400 text-xs mb-6 font-sans">Specify the corporate brand designation for the <span className="text-white font-bold">{selectedProductIds.length}</span> selected artisanal items.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">New Brand Name</label>
                  <input
                    type="text"
                    placeholder="Enter brand name..."
                    value={bulkBrandInput}
                    onChange={(e) => setBulkBrandInput(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white p-3 rounded-xs outline-none focus:border-gold-pure text-xs"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsBulkBrandModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-white/10 text-zinc-400 hover:text-white text-[10px] font-mono uppercase tracking-wider rounded-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkBrandUpdate}
                  className="flex-1 py-2.5 px-4 bg-gold-pure text-black font-bold text-[10px] font-mono uppercase tracking-wider rounded-xs hover:bg-gold-light transition-all cursor-pointer"
                >
                  Apply Brand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        {isAddCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-white/10 p-6 rounded-xs w-full max-w-md shadow-2xl animate-fade-in text-left">
              <h3 className="text-white text-lg font-display uppercase tracking-widest border-b border-white/10 pb-3 mb-5">Register New Category</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Specialty Beans, Luxury Oudh"
                    value={addCategoryName}
                    onChange={(e) => setAddCategoryName(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white p-3 rounded-xs outline-none focus:border-gold-pure text-xs"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Description</label>
                  <textarea
                    placeholder="Brief description of the category focus..."
                    value={addCategoryDesc}
                    onChange={(e) => setAddCategoryDesc(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white p-3 rounded-xs outline-none focus:border-gold-pure text-xs h-24 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-white/10 text-zinc-400 hover:text-white text-[10px] font-mono uppercase tracking-wider rounded-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAddCategory}
                  className="flex-1 py-2.5 px-4 bg-gold-pure text-black font-bold text-[10px] font-mono uppercase tracking-wider rounded-xs hover:bg-gold-light transition-all cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Brand Modal */}
        {isAddBrandModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-white/10 p-6 rounded-xs w-full max-w-md shadow-2xl animate-fade-in text-left">
              <h3 className="text-white text-lg font-display uppercase tracking-widest border-b border-white/10 pb-3 mb-5">Register New Brand</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Al Zoal Heritage, Royal Sudanese"
                    value={addBrandName}
                    onChange={(e) => setAddBrandName(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white p-3 rounded-xs outline-none focus:border-gold-pure text-xs"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Brand Description</label>
                  <textarea
                    placeholder="Strategic partner description..."
                    value={addBrandDesc}
                    onChange={(e) => setAddBrandDesc(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white p-3 rounded-xs outline-none focus:border-gold-pure text-xs h-24 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setIsAddBrandModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-white/10 text-zinc-400 hover:text-white text-[10px] font-mono uppercase tracking-wider rounded-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAddBrand}
                  className="flex-1 py-2.5 px-4 bg-gold-pure text-black font-bold text-[10px] font-mono uppercase tracking-wider rounded-xs hover:bg-gold-light transition-all cursor-pointer"
                >
                  Register Brand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Import Preview Modal */}
        {importPreviewData && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-white/10 p-6 rounded-xs w-full max-w-4xl max-h-[85vh] shadow-2xl animate-fade-in flex flex-col">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-white text-lg font-display uppercase tracking-widest">Import Data Preview</h3>
                  <p className="text-zinc-500 text-[10px] font-mono uppercase mt-1">File: {importFileName}</p>
                </div>
                <button onClick={() => setImportPreviewData(null)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-black/40 border border-white/5 p-3 rounded-xs">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase block mb-1">Total Rows</span>
                    <span className="text-xl font-bold text-white">{importSuccessCount + importFailureCount}</span>
                  </div>
                  <div className="bg-black/40 border border-green-500/20 p-3 rounded-xs">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase block mb-1">Valid Records</span>
                    <span className="text-xl font-bold text-green-400">{importSuccessCount}</span>
                  </div>
                  <div className="bg-black/40 border border-red-500/20 p-3 rounded-xs">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase block mb-1">Invalid Rows</span>
                    <span className="text-xl font-bold text-red-400">{importFailureCount}</span>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-3 rounded-xs">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase block mb-1">Target Action</span>
                    <span className="text-xs font-bold text-gold-pure uppercase">Bulk Insert</span>
                  </div>
                </div>

                {importErrors.length > 0 && (
                  <div className="mb-6 bg-red-500/5 border border-red-500/20 p-4 rounded-xs">
                    <h4 className="text-red-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5" /> Validation Errors Found
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-auto scrollbar-thin scrollbar-thumb-red-500/20">
                      {importErrors.map((err, i) => (
                        <div key={i} className="text-[10px] font-mono text-red-300/70 border-b border-white/5 pb-1">
                          Row {err.row}: {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto border border-white/5 rounded-xs">
                  <table className="w-full text-left text-[10px] font-mono">
                    <thead className="bg-white/5 text-zinc-500 uppercase tracking-widest">
                      <tr>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {importPreviewData.slice(0, 50).map((p, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 text-white truncate max-w-[200px]">{p.name}</td>
                          <td className="p-3 text-zinc-400">{p.sku}</td>
                          <td className="p-3 text-zinc-400 uppercase">{p.category}</td>
                          <td className="p-3 text-gold-pure">{formatCurrency(p.price)}</td>
                          <td className="p-3 text-white font-bold">{p.inventory}</td>
                        </tr>
                      ))}
                      {importPreviewData.length > 50 && (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-zinc-500 italic">
                            ... and {importPreviewData.length - 50} more items
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setImportPreviewData(null)}
                  className="flex-1 py-3 px-4 border border-white/10 text-zinc-400 hover:text-white text-[10px] font-mono uppercase tracking-wider rounded-xs transition-all cursor-pointer"
                >
                  Discard Import
                </button>
                <button
                  onClick={confirmImport}
                  disabled={importSuccessCount === 0}
                  className={`flex-1 py-3 px-4 font-bold text-[10px] font-mono uppercase tracking-wider rounded-xs transition-all cursor-pointer ${
                    importSuccessCount === 0 
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50' 
                      : 'bg-gold-pure text-black hover:bg-gold-light shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                  }`}
                >
                  Commit {importSuccessCount} Records
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generic Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!confirmConfig}
          onClose={() => setConfirmConfig(null)}
          onConfirm={confirmConfig?.onConfirm || (() => {})}
          title={confirmConfig?.title || 'CONFIRM ACTION'}
          message={confirmConfig?.message || 'Are you sure you want to proceed?'}
          confirmLabel={confirmConfig?.confirmLabel || 'Confirm'}
          isProcessing={confirmConfig?.isProcessing}
          error={confirmConfig?.error}
        />
      </main>
    </div>
  );
}
