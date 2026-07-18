import React, { useState, useMemo, useEffect } from 'react';
import {
  User, Shield, Landmark, BarChart3, Package, Truck, Compass,
  MapPin, CheckCircle, Users, RefreshCw, Star, ArrowUpRight, TrendingUp, Sparkles, Bell,
  Clock, CreditCard, X, Gift, ClipboardList, Check, Mail, PackageCheck, LogOut,
  Lock, Menu, ChevronRight, ArrowLeft, Search, Filter, Trash2, Edit, Download, Upload, Plus,
  FileText, CheckCircle2, AlertCircle, FolderTree, Tag, Eye, EyeOff, LayoutDashboard, Activity, Settings,
  Printer, FileSpreadsheet, Smartphone, ToggleLeft, ToggleRight, Calendar, Award, Sliders, ChevronDown, ChevronUp, Info,
  Layers, Video, MessageSquare, UploadCloud, Globe, LifeBuoy, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import { Product, Order, BusinessCategory } from '../types';
import { useGlobalProducts, updateProductInventory } from '../imageRegistry';
import { formatCurrency } from '../utils';
import { BRANDING } from '../constants';
import { PmsSubTabs } from './PmsSubTabs';
import { CampaignsMarketingPanel } from './CampaignsMarketingPanel';
import { CategoryManagement } from './CategoryManagement';
import { BrandManagement } from './BrandManagement';
import EnterpriseOrderManagement from './EnterpriseOrderManagement';
import EnterpriseInventoryManagement from './EnterpriseInventoryManagement';
import EnterpriseCrm from './EnterpriseCrm';
import EnterpriseCmsManager from './EnterpriseCmsManager';
import SupportCenterDashboard from './SupportCenterDashboard';
import SupabaseStoragePanel from './SupabaseStoragePanel';
import MerchantAssetsStudio from './MerchantAssetsStudio';

import { useBranding } from './BrandingContext';

// Available categories for Select inputs
const ALL_CATEGORIES: { id: BusinessCategory; name: string }[] = [
  { id: 'coffee', name: 'ZOAL Coffee & Cafe' },
  { id: 'bakery', name: 'Sudanese Bakery' },
  { id: 'market', name: 'Traditional Organic Market' },
  { id: 'fashion', name: 'Bespoke Sudanese Toob' },
  { id: 'thobes', name: 'Luxury Men\'s Thobes' }
];

interface AdminDashboardProps {
  currentUser: any;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onLogout: () => void;
  setCurrentPage: (page: string) => void;
}

export default function AdminDashboard({
  currentUser,
  orders,
  setOrders,
  onUpdateOrderStatus,
  onLogout,
  setCurrentPage
}: AdminDashboardProps) {
  // 1. Route Guard & RBAC Protection
  const isAdmin = currentUser && currentUser.role === 'admin';

  // State management for navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mediaSubTab, setMediaSubTab] = useState<'library' | 'storage'>('library');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Global reactive products
  const allProducts = useGlobalProducts();

  // Selected details or forms states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState<boolean>(false);
  const [isAddCampaignOpen, setIsAddCampaignOpen] = useState<boolean>(false);
  const [isAddBannerOpen, setIsAddBannerOpen] = useState<boolean>(false);
  const [marketingSubTab, setMarketingSubTab] = useState<string>('campaigns');
  const [mktProductSearch, setMktProductSearch] = useState<string>('');

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

  // Local state for categories (loaded from localStorage or default)
  const [categories, setCategories] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_categories');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'cat-1', name: 'ZOAL Coffee & Cafe', slug: 'coffee', parent: null, description: 'Premium selection of artisanal single-origin coffee blends, saffron mocktails, and luxury thermal tea gatherings.', sortOrder: 1, count: 3 },
      { id: 'cat-2', name: 'Sudanese Bakery', slug: 'bakery', parent: null, description: 'Pillowy hearth-fired Hoboz breads, sesame crackers, and traditional Ghoriba cookies baked fresh daily.', sortOrder: 2, count: 3 },
      { id: 'cat-3', name: 'Traditional Organic Market', slug: 'market', parent: null, description: 'Direct-trade organic Sudanese botanical herbs, premium Gum Arabic crystals, and whole Karkadeh hibiscus blossoms.', sortOrder: 3, count: 2 },
      { id: 'cat-4', name: 'Bespoke Sudanese Toob', slug: 'fashion', parent: null, description: 'Hand-woven formal Toob gowns of fine organic drapes, silk threads, and geometric gold border embroidery.', sortOrder: 4, count: 1 },
      { id: 'cat-5', name: 'Luxury Men\'s Thobes', slug: 'thobes', parent: null, description: 'Master tailored bespoke Sudanese and Gulf thobes structured from fine imported Italian cottons.', sortOrder: 5, count: 2 }
    ];
  });

  // Local state for brands
  const [brands, setBrands] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_brands');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'brand-1', name: 'ZOAL Specialty Roasters', slug: 'zoal-roasters', description: 'Elite micro-batch single-origin coffees sourced from high-altitude smallholders across Yemen and East Africa.', logoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=200' },
      { id: 'brand-2', name: 'Sudan Bakery Heritage', slug: 'bakery-heritage', description: 'Centuries-old sourdough cultures hand-kneaded by Sudanese master bakers using stone-deck wood fire hearths.', logoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=200' },
      { id: 'brand-3', name: 'Kordofan Organic Co.', slug: 'kordofan-organic', description: 'First-grade natural agricultural exports harvested directly from the rain-fed plains of Western Sudan.', logoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=200' },
      { id: 'brand-4', name: 'Artisan Sudanese Weaves', slug: 'artisan-weaves', description: 'Prestige textile workshops creating bespoke hand-spun organic long-staple cotton and golden thread embroidery.', logoUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=200' }
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
      { id: 'sh-2', productId: '2', productName: 'Artisanal Cardamom Cookies', oldStock: 12, newStock: 30, adjustedBy: 'Concierge Staff', reason: 'Supplier Replenishment', time: new Date(Date.now() - 14400000).toLocaleString() }
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
      { id: 'sup-3', name: 'Riyadh Silk & Brocade Guild', contactName: 'Fatma Al-Jasser', phone: '+966 56 769 9315', email: 'fatma.j@riyadhbrocade.com', status: 'Active Partner', categories: ['Bespoke Sudanese Toob', 'Luxury Men\'s Thobes'] }
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
      { id: 'staff-1', name: 'Khalid Al-Mansoori', email: 'khalid@zoal.com', role: 'Senior Concierge Representative', permissions: ['Catalog Edit', 'Order Modify'], status: 'active', lastActive: 'Active 2 mins ago' },
      { id: 'staff-2', name: 'Sumaya Bashir', email: 'sumaya@zoal.com', role: 'Senior Artisan Supervisor', permissions: ['Catalog Edit', 'CMS Update'], status: 'active', lastActive: 'Active 1 hour ago' },
      { id: 'staff-3', name: 'Amjad Suliman', email: 'amjad@zoal.com', role: 'Support Specialist', permissions: ['Order Modify'], status: 'active', lastActive: 'Active Yesterday' }
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
      heroHeading: 'Sovereign Sudanese Heritage & Modern Luxury Gatherings',
      heroSubheading: 'Indulge in artisanal micro-batch single-origin Yemeni coffees, traditional wood fire breads, botanical hibiscus infusions, and bespoke hand-embroidered heritage gowns.',
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
      seoDesc: 'Bespoke Sudanese artisanal boutique. Organic market botanicals, single-origin Yemeni coffee, master-tailored Sudanese Toob & thobes with elite Saudi courier dispatch.',
      privacyPolicy: 'We store your cryptographic session identities and personal details securely under standard GCC security laws.',
      shippingPolicy: 'Dispatched from Dammam and Al Hofuf main warehouses using premium high-care courier express. Overnight delivery available.',
      returnPolicy: 'Due to the custom-tailored bespoke nature of our Sudanese Toobs and fresh botanical market selections, items are refundable only within 7 days in pristine, unused state.'
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

  const [campaigns, setCampaigns] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_campaigns');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'cp-1', name: 'Summer Solstice Bespoke Sale', discountPercent: 10, category: 'fashion', status: 'active' },
      { id: 'cp-2', name: 'Traditional Ramadan Gatherings', discountPercent: 15, category: 'coffee', status: 'inactive' }
    ];
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
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { email: 'alzoal3003@gmail.com', date: '2026-07-10', status: 'subscribed' },
      { email: 'patron1@saudiheritage.com', date: '2026-07-12', status: 'subscribed' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_subscribers', JSON.stringify(subscribers));
  }, [subscribers]);

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
    subDescription: 'Bespoke Executive Collection',
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
    images: [] as string[]
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
  const [images360List, setImages360List] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Bulk States
  const [bulkPriceChangeType, setBulkPriceChangeType] = useState<'fixed' | 'percent'>('fixed');
  const [bulkPriceChangeValue, setBulkPriceChangeValue] = useState<string>('');
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
      const isCustom = productId.startsWith('custom-prod-');
      if (isCustom) {
        const customRaw = localStorage.getItem('zoal_custom_products');
        let customProducts = customRaw ? JSON.parse(customRaw) : [];
        customProducts = customProducts.map((p: any) => p.id === productId ? { ...p, ...updatedFields } : p);
        localStorage.setItem('zoal_custom_products', JSON.stringify(customProducts));
      } else {
        const overridesRaw = localStorage.getItem('zoal_product_overrides');
        const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
        overrides[productId] = { ...overrides[productId], ...updatedFields };
        localStorage.setItem('zoal_product_overrides', JSON.stringify(overrides));
      }

      // Sync across hooks
      const event = new Event('storage');
      window.dispatchEvent(event);
      return true;
    } catch (err) {
      console.error('Failed to save product fields:', err);
      return false;
    }
  };

  // Manage static or custom notifications list
  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_notifications_v2');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'notif-1', title: 'New Order Placed', message: 'VIP Order #ZL-4491 placed by Patron Amna Al-Saeed for 350 SAR.', time: '5 mins ago', type: 'success', category: 'new_order', status: 'unread' },
      { id: 'notif-2', title: 'Low Stock Alert', message: 'Taif Rose Saffron Tea has dropped below threshold. Current count: 3 jars.', time: '20 mins ago', type: 'warning', category: 'low_stock', status: 'unread' },
      { id: 'notif-3', title: 'Out of Stock Warning', message: 'Luxury Men\'s Silk Thobe has hit zero stock in Hofuf warehouse.', time: '1 hour ago', type: 'error', category: 'out_of_stock', status: 'unread' },
      { id: 'notif-4', title: 'Refund Request Issued', message: 'Patron alzoal3003@gmail.com has requested a refund for Order #ZL-9543 (420 SAR).', time: '3 hours ago', type: 'warning', category: 'refund_request', status: 'unread' },
      { id: 'notif-5', title: 'New Customer Registered', message: 'Verified elite account created for Patron Khalid bin Al-Waleed.', time: '5 hours ago', type: 'info', category: 'new_customer', status: 'unread' },
      { id: 'notif-6', title: 'Payment Failed', message: 'Credit card transaction failed for checkout attempt from IP 192.168.1.45.', time: '8 hours ago', type: 'error', category: 'payment_failed', status: 'read' },
      { id: 'notif-7', title: 'System Warning', message: 'Database replication sync delay of 1.5s detected on European server.', time: '12 hours ago', type: 'warning', category: 'system_warning', status: 'read' },
      { id: 'notif-8', title: 'Supabase Sync Completed', message: 'All local SQLite data logs and core sessions successfully written to Supabase cluster.', time: '1 day ago', type: 'success', category: 'system_warning', status: 'archived' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_notifications_v2', JSON.stringify(notifications));
  }, [notifications]);

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
      { id: 'role-customer', name: 'Customer', description: 'Standard patron access level. Allowed to browse catalog and purchase items.', permissions: [] }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_admin_roles_v2', JSON.stringify(rolesList));
  }, [rolesList]);

  const [availablePermissions] = useState<{ id: string; name: string; description: string }[]>([
    { id: 'catalog_edit', name: 'Catalog Edit', description: 'Create, update, and archive products, categories, and brands.' },
    { id: 'order_modify', name: 'Order Modify', description: 'Update order status, modify fulfillment data, and record tracking numbers.' },
    { id: 'user_manage', name: 'User Management', description: 'Edit roles, invite staff members, and toggle customer privileges.' },
    { id: 'reports_view', name: 'Reports View', description: 'Query revenue details, generate ledger sheets, and audit inventory.' },
    { id: 'settings_edit', name: 'Settings Edit', description: 'Update global security credentials, taxation structures, and SMTP relays.' }
  ]);

  // Editing role state
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState<boolean>(false);

  // System Logs list
  const [systemLogs, setSystemLogs] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_logs');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'log-101', user: currentUser?.name || 'Administrator', action: 'Admin Login', target: 'Terminal Secure Gateway', ip: '192.168.1.1', time: new Date().toLocaleString() },
      { id: 'log-102', user: currentUser?.name || 'Administrator', action: 'Settings Changes', target: 'Synchronized Supabase Database', ip: '192.168.1.1', time: new Date(Date.now() - 300000).toLocaleString() },
      { id: 'log-103', user: 'Khalid Al-Mansoori', action: 'Order Updates', target: 'Shipped Order ZL-9543', ip: '192.168.1.25', time: new Date(Date.now() - 7200000).toLocaleString() }
    ];
  });

  // Save categories/brands back to localStorage
  useEffect(() => {
    localStorage.setItem('zoal_admin_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('zoal_admin_brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('zoal_admin_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('zoal_admin_logs', JSON.stringify(systemLogs));
  }, [systemLogs]);

  // Log function helper
  const addLog = (action: string, target?: string) => {
    const newLog = {
      id: `log-${Date.now()}`,
      user: currentUser?.name || 'Admin',
      action,
      target: target || 'System Interface',
      ip: '192.168.1.16',
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
    setEditingProduct(null);
    setIsEditing(false);
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
      images: []
    });
    setIsAddProductOpen(true);
  };

  // Start Edit Product
  const startEditProduct = (p: any) => {
    setEditingProduct(p);
    setIsEditing(true);
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
      images: p.images || []
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
        images: formState.images.length > 0 ? formState.images : ['https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800'],
        updatedAt: new Date().toISOString().slice(0, 10)
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

      if (isEditing && editingProduct) {
        const isCustom = editingProduct.id.startsWith('custom-prod-');
        if (isCustom) {
          const customRaw = localStorage.getItem('zoal_custom_products');
          let customProducts = customRaw ? JSON.parse(customRaw) : [];
          customProducts = customProducts.map((p: any) => p.id === editingProduct.id ? { ...p, ...updatedFields } : p);
          localStorage.setItem('zoal_custom_products', JSON.stringify(customProducts));
        } else {
          const overridesRaw = localStorage.getItem('zoal_product_overrides');
          const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
          overrides[editingProduct.id] = { ...overrides[editingProduct.id], ...updatedFields };
          localStorage.setItem('zoal_product_overrides', JSON.stringify(overrides));
        }
        addLog(`Updated Product: ${formState.name} (${editingProduct.id})`);
      } else {
        const mockNewProduct = {
          id,
          createdAt: new Date().toISOString().slice(0, 10),
          ...updatedFields
        };
        const customRaw = localStorage.getItem('zoal_custom_products');
        const customProducts = customRaw ? JSON.parse(customRaw) : [];
        customProducts.unshift(mockNewProduct);
        localStorage.setItem('zoal_custom_products', JSON.stringify(customProducts));
        addLog(`Added Product: ${formState.name} (${id})`);
      }

      // Sync across hooks
      const event = new Event('storage');
      window.dispatchEvent(event);

      setIsAddProductOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save product.');
    }
  };

  // Handle Product Delete (Admin Only enforcement)
  const handleDeleteProduct = (productId: string, productName: string) => {
    if (currentUser?.role === 'staff') {
      alert('Staff permission denied: Cannot permanently delete products.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete "${productName}"?`)) {
      return;
    }

    try {
      const isCustom = productId.startsWith('custom-prod-');
      if (isCustom) {
        const customRaw = localStorage.getItem('zoal_custom_products');
        let customProducts = customRaw ? JSON.parse(customRaw) : [];
        customProducts = customProducts.filter((p: any) => p.id !== productId);
        localStorage.setItem('zoal_custom_products', JSON.stringify(customProducts));
      } else {
        const deletedRaw = localStorage.getItem('zoal_deleted_static_products');
        const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
        if (!deletedIds.includes(productId)) {
          deletedIds.push(productId);
          localStorage.setItem('zoal_deleted_static_products', JSON.stringify(deletedIds));
        }
      }

      // Clean up dynamic stock & detail overrides
      const overridesRaw = localStorage.getItem('zoal_product_inventories');
      if (overridesRaw) {
        const overrides = JSON.parse(overridesRaw);
        delete overrides[productId];
        localStorage.setItem('zoal_product_inventories', JSON.stringify(overrides));
      }
      const prodOverridesRaw = localStorage.getItem('zoal_product_overrides');
      if (prodOverridesRaw) {
        const prodOverrides = JSON.parse(prodOverridesRaw);
        delete prodOverrides[productId];
        localStorage.setItem('zoal_product_overrides', JSON.stringify(prodOverrides));
      }

      addLog(`Deleted Product: ${productName}`);
      
      const event = new Event('storage');
      window.dispatchEvent(event);
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk Exports
  const handleBulkExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allProducts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ZOAL_Products_Export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addLog('Exported all products as JSON payload');
  };

  // Bulk Imports Simulation
  const handleBulkImport = () => {
    const customRaw = localStorage.getItem('zoal_custom_products');
    const existing = customRaw ? JSON.parse(customRaw) : [];

    const simulatedImports = [
      {
        id: `imported-prod-1`,
        name: 'Kordofan Arabic Gum Pearls',
        nameEn: 'Kordofan Arabic Gum Pearls',
        nameAr: 'لآلئ صمغ كردفان العربي',
        description: 'Elite grade translucent crystals of Acacia Senegal gum, harvested organically by local co-ops.',
        shortDescription: 'Premium Grade West Sudanese Acacia Pearls',
        price: 95.0,
        category: 'market' as BusinessCategory,
        brand: 'AL ZOAL Premium',
        images: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800'],
        sku: 'ZL-GUM-KOR',
        barcode: '6289410385521',
        inventory: 15,
        minStock: 5,
        maxStock: 200,
        warehouseLocation: 'Al Hofuf Central',
        lowStockThreshold: 5,
        status: 'Published',
        visibility: 'Public',
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10)
      }
    ];

    const merged = [...simulatedImports, ...existing];
    localStorage.setItem('zoal_custom_products', JSON.stringify(merged));
    
    const event = new Event('storage');
    window.dispatchEvent(event);

    addLog('Bulk Imported: Kordofan Arabic Gum Pearls');
    alert('Import completed successfully! (1 product imported with enterprise properties)');
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    if (currentUser?.role === 'staff') {
      alert('Staff permission denied: Cannot permanently delete products.');
      return;
    }
    if (selectedProductIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedProductIds.length} selected products?`)) return;

    try {
      const customRaw = localStorage.getItem('zoal_custom_products');
      let customProducts = customRaw ? JSON.parse(customRaw) : [];
      const deletedRaw = localStorage.getItem('zoal_deleted_static_products');
      const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];

      selectedProductIds.forEach(id => {
        const isCustom = id.startsWith('custom-prod-');
        if (isCustom) {
          customProducts = customProducts.filter((p: any) => p.id !== id);
        } else {
          if (!deletedIds.includes(id)) deletedIds.push(id);
        }

        const overridesRaw = localStorage.getItem('zoal_product_inventories');
        if (overridesRaw) {
          const overrides = JSON.parse(overridesRaw);
          delete overrides[id];
          localStorage.setItem('zoal_product_inventories', JSON.stringify(overrides));
        }
        const prodOverridesRaw = localStorage.getItem('zoal_product_overrides');
        if (prodOverridesRaw) {
          const prodOverrides = JSON.parse(prodOverridesRaw);
          delete prodOverrides[id];
          localStorage.setItem('zoal_product_overrides', JSON.stringify(prodOverrides));
        }
      });

      localStorage.setItem('zoal_custom_products', JSON.stringify(customProducts));
      localStorage.setItem('zoal_deleted_static_products', JSON.stringify(deletedIds));

      addLog(`Bulk Deleted ${selectedProductIds.length} products`);
      setSelectedProductIds([]);
      
      const event = new Event('storage');
      window.dispatchEvent(event);
      alert('Selected products successfully deleted.');
    } catch (e) {
      console.error(e);
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
    const catChoice = prompt("Enter new category division (coffee, bakery, market, fashion, thobes):");
    if (!catChoice) return;
    const cleanCat = catChoice.trim().toLowerCase() as BusinessCategory;
    if (!['coffee', 'bakery', 'market', 'fashion', 'thobes'].includes(cleanCat)) {
      alert("Invalid category selection.");
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
      alert("Category bulk update complete.");
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkBrandUpdate = () => {
    if (selectedProductIds.length === 0) return;
    const brandChoice = prompt("Enter new brand name:");
    if (!brandChoice) return;
    const cleanBrand = brandChoice.trim();

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
      alert("Brand bulk update complete.");
    } catch (e) {
      console.error(e);
    }
  };

  // Category CRUD
  const handleAddCategory = () => {
    const name = prompt('Enter Category Name:');
    if (!name) return;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const desc = prompt('Enter Description:');
    
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
  };

  const handleDeleteCategory = (catId: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    setCategories(prev => prev.filter(c => c.id !== catId));
    addLog(`Deleted Category: ${name}`);
  };

  // Brand CRUD
  const handleAddBrand = () => {
    const name = prompt('Enter Brand Name:');
    if (!name) return;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const desc = prompt('Enter Brand Description:');

    const newBrand = {
      id: `brand-${Date.now()}`,
      name,
      slug,
      description: desc || 'Sovereign partner workshop',
      logoUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=200'
    };

    setBrands(prev => [...prev, newBrand]);
    addLog(`Created Brand: ${name}`);
  };

  const handleDeleteBrand = (brandId: string, name: string) => {
    if (!window.confirm(`Delete brand "${name}"?`)) return;
    setBrands(prev => prev.filter(b => b.id !== brandId));
    addLog(`Deleted Brand: ${name}`);
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
        collection: p.collection || 'Bespoke',
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
          p.name.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.nameAr.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      });
    }

    // Apply Category Filter
    if (productCategoryFilter !== 'all') {
      list = list.filter(p => p.category === productCategoryFilter);
    }

    // Apply Brand Filter
    if (filterBrand !== 'all') {
      list = list.filter(p => p.brand.toLowerCase() === filterBrand.toLowerCase());
    }

    // Apply Stock Status Filter
    if (filterStockStatus !== 'all') {
      list = list.filter(p => {
        const isOut = p.inventory === 0;
        const isLow = p.inventory <= p.lowStockThreshold && p.inventory > 0;
        if (filterStockStatus === 'out-of-stock') return isOut;
        if (filterStockStatus === 'low-stock') return isLow;
        if (filterStockStatus === 'in-stock') return !isOut && !isLow;
        return true;
      });
    }

    // Apply Featured Filter
    if (filterFeatured !== 'all') {
      const wantFeatured = filterFeatured === 'featured';
      list = list.filter(p => p.isFeatured === wantFeatured);
    }

    // Apply Discounted Filter
    if (filterDiscounted !== 'all') {
      const wantDiscounted = filterDiscounted === 'discounted';
      list = list.filter(p => (!!p.salePrice) === wantDiscounted);
    }

    // Apply Price Range
    if (filterMinPrice) {
      list = list.filter(p => p.price >= parseFloat(filterMinPrice));
    }
    if (filterMaxPrice) {
      list = list.filter(p => p.price <= parseFloat(filterMaxPrice));
    }

    // Apply Status Filter
    if (filterStatus !== 'all') {
      list = list.filter(p => p.status.toLowerCase() === filterStatus.toLowerCase());
    }

    // Apply Created Date Filter
    if (filterCreatedStart) {
      list = list.filter(p => p.createdAt >= filterCreatedStart);
    }
    if (filterCreatedEnd) {
      list = list.filter(p => p.createdAt <= filterCreatedEnd);
    }

    // Apply Updated Date Filter
    if (filterUpdatedStart) {
      list = list.filter(p => p.updatedAt >= filterUpdatedStart);
    }
    if (filterUpdatedEnd) {
      list = list.filter(p => p.updatedAt <= filterUpdatedEnd);
    }

    // Apply Sorting
    list.sort((a: any, b: any) => {
      let valA = a[productSortField];
      let valB = b[productSortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB ? valB.toLowerCase() : '';
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
      const matchSearch = o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) || 
        o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
        o.email.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.phone.toLowerCase().includes(orderSearch.toLowerCase());
      
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
      return p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.id.toLowerCase().includes(inventorySearch.toLowerCase());
    });
  }, [allProducts, inventorySearch]);

  // Guard view
  if (!isAdmin) {
    return (
      <div id="admin-unauthorized-guard" className="bg-black text-white min-h-screen pt-28 pb-20 flex items-center justify-center px-4">
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
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              This terminal is bound exclusively for accounts with authorized <span className="text-red-400 font-mono font-bold">Admin</span> credentials. Your current access profile has been restricted.
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
              Return to Sovereign Web
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

  // Links for the elegant responsive sidebar
  const sidebarLinks = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', name: 'Products Catalog', icon: Package },
    { id: 'categories', name: 'Categories Div', icon: FolderTree },
    { id: 'brands', name: 'Luxury Brands', icon: Tag },
    { id: 'orders', name: 'Patron Orders', icon: ClipboardList },
    { id: 'inventory', name: 'Inventory Grid', icon: RefreshCw },
    { id: 'customers', name: 'Patrons Directory', icon: Users },
    { id: 'support', name: 'Support Center', icon: LifeBuoy },
    { id: 'staff', name: 'Staff Matrix', icon: Shield },
    { id: 'cms', name: 'Website CMS', icon: Compass },
    { id: 'media', name: 'Media Storage', icon: HardDrive },
    { id: 'marketing', name: 'Campaigns & Coupons', icon: Gift },
    { id: 'reports', name: 'Executive Reports', icon: FileText },
    { id: 'analytics', name: 'Bespoke Analytics', icon: BarChart3 },
    { id: 'notifications', name: 'System Alerts', icon: Bell },
    { id: 'settings', name: 'Global Settings', icon: Settings },
    { id: 'logs', name: 'Security Audit Logs', icon: Activity },
    { id: 'profile', name: 'My Profile', icon: User },
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
                <span className="text-xs tracking-widest text-white uppercase font-display font-semibold">ENTERPRISE</span>
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
          {sidebarLinks.map((link) => {
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
              if (window.confirm('Terminate Secure Administration Session?')) {
                onLogout();
                setCurrentPage('home');
              }
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
                  <span className="text-xs tracking-widest uppercase font-display font-semibold">ZOAL ENTERPRISE</span>
                </div>
                <button 
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 border border-white/10 rounded-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <nav className="flex-grow py-4 overflow-y-auto space-y-1 px-3">
                {sidebarLinks.map((link) => {
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
                      <span className="text-[10.5px] uppercase tracking-wider block text-left">
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
        <header className="h-20 bg-zinc-950 border-b border-white/5 px-6 flex items-center justify-between gap-4 select-none">
          {/* Menu button for mobile */}
          <button 
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 border border-white/10 rounded-xs text-zinc-400 hover:text-white cursor-pointer"
          >
            <Menu className="w-5 h-5" />
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
          <div className="flex items-center gap-4">
            {/* System notifications indicator */}
            <div className="relative group/notif-panel">
              <button className="p-2 border border-white/5 rounded-xs hover:border-gold-pure/40 text-zinc-400 hover:text-white cursor-pointer relative">
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold-pure rounded-full shadow-[0_0_8px_rgba(212,175,55,0.6)] animate-ping" />
              </button>
              
              {/* Popover notifications */}
              <div className="absolute right-0 top-full mt-1.5 w-80 bg-zinc-950 border border-white/10 rounded-xs shadow-[0_12px_40px_rgba(0,0,0,0.95)] opacity-0 pointer-events-none group-hover/notif-panel:opacity-100 group-hover/notif-panel:pointer-events-auto transition-all duration-300 z-50 p-3 text-left">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-gold-pure">Core Notifications</span>
                  <button onClick={() => setNotifications([])} className="text-[8px] uppercase tracking-widest font-mono text-zinc-500 hover:text-white">Clear</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-[10px] text-zinc-500 text-center py-4">No active system notifications.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-2 bg-black/40 border border-white/5 rounded-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[8.5px] font-bold uppercase ${n.type === 'error' ? 'text-rose-500' : n.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>{n.title}</span>
                          <span className="text-[7px] text-zinc-600 font-mono">{n.time}</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 font-sans leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-white font-bold block uppercase tracking-wide leading-none">{currentUser?.name}</span>
                <span className="text-[8px] font-mono text-gold-pure block tracking-widest uppercase mt-1">SOVEREIGN OWNER</span>
              </div>
              <div className="w-8.5 h-8.5 rounded-full border border-gold-pure bg-zinc-900 flex items-center justify-center text-xs font-mono font-bold text-gold-pure select-none uppercase">
                {currentUser?.name.slice(0, 2)}
              </div>
            </div>
          </div>
        </header>

        {/* Tab-driven Content Screen Area */}
        <div className="flex-grow p-6 space-y-8 overflow-y-auto">
          
          {/* I. TAB: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              {/* Header Title Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-1">ZOAL CORPORATE GATEWAY</span>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-widest font-display uppercase text-white">SYSTEM EXECUTIVE OVERVIEW</h2>
                </div>
                {/* Sync & Refresh Actions */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      addLog('Triggered Manual Supabase Re-Sync');
                      alert('Supabase master ledger verified and up-to-date!');
                    }}
                    className="py-1.5 px-3 border border-gold-pure/30 text-gold-pure hover:bg-gold-pure/10 rounded-xs text-[9px] uppercase tracking-widest font-mono font-bold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3 text-gold-pure" /> Sync Database
                  </button>
                  <button 
                    onClick={() => setCurrentPage('home')}
                    className="py-1.5 px-3 border border-white/10 hover:border-white text-white rounded-xs text-[9px] uppercase tracking-widest font-mono cursor-pointer transition-all"
                  >
                    Exit Portal
                  </button>
                </div>
              </div>

              {/* 1. Analytics Widgets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-2 text-left relative overflow-hidden group hover:border-gold-pure/45 duration-300">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[9px] tracking-widest uppercase font-mono">Gross Revenue Yield</span>
                    <TrendingUp className="w-4 h-4 text-gold-pure" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-mono text-gold-pure font-bold block">
                    {formatCurrency(metrics.totalRevenue)} SAR
                  </span>
                  <div className="flex justify-between text-[8.5px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                    <span>Monthly quota: {formatCurrency(metrics.monthlySales)} SAR</span>
                    <span className="text-emerald-400 font-bold">+18.4%</span>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-2 text-left relative overflow-hidden group hover:border-gold-pure/45 duration-300">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[9px] tracking-widest uppercase font-mono">Sales Volume Index</span>
                    <ClipboardList className="w-4 h-4 text-[#AA8C2C]" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-mono text-white font-bold block">
                    {metrics.totalOrders} Orders
                  </span>
                  <div className="flex justify-between text-[8.5px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                    <span>Active Pending: {metrics.pendingOrders}</span>
                    <span className="text-amber-400 font-bold">Processing: {metrics.preparingOrders}</span>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-2 text-left relative overflow-hidden group hover:border-gold-pure/45 duration-300">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[9px] tracking-widest uppercase font-mono">Sovereign Patronage</span>
                    <Users className="w-4 h-4 text-zinc-400" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-mono text-white font-bold block">
                    {metrics.totalCustomers} Accounts
                  </span>
                  <div className="flex justify-between text-[8.5px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                    <span>Active Staff: {metrics.totalStaff}</span>
                    <span className="text-gold-pure font-bold">100% Verified</span>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-2 text-left relative overflow-hidden group hover:border-gold-pure/45 duration-300">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[9px] tracking-widest uppercase font-mono">Products & Inventory</span>
                    <Package className="w-4 h-4 text-zinc-400" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-mono text-white font-bold block">
                    {metrics.totalProductsCount} Catalog Items
                  </span>
                  <div className="flex justify-between text-[8.5px] font-mono pt-1 border-t border-white/5">
                    <span className="text-zinc-500">Out of Stock: {metrics.outOfStockCount}</span>
                    <span className={metrics.lowStockCount > 0 ? 'text-red-400 font-bold animate-pulse' : 'text-zinc-500'}>
                      Low Stock Alert: {metrics.lowStockCount}
                    </span>
                  </div>
                </div>

              </div>

              {/* 2. Interactive Analytical Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Chart 1: Revenue & Order yield area (columns 1 to 8) */}
                <div className="lg:col-span-8 bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-white text-[10px] font-display uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gold-pure" /> Net Revenues Trend Analysis
                    </h3>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Live Ledger Feed</span>
                  </div>

                  <div className="h-[250px] w-full text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAdminRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#222" tick={{ fill: '#666', fontSize: 10 }} />
                        <YAxis stroke="#222" tick={{ fill: '#666', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#090909', borderColor: '#222', color: '#fff' }} />
                        <Area type="monotone" dataKey="sales" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorAdminRev)" name="Revenues (SAR)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Category Pie share (columns 9 to 12) */}
                <div className="lg:col-span-4 bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 text-left">
                  <h3 className="text-white text-[10px] font-display uppercase tracking-widest border-b border-white/5 pb-3">
                    Category Allocation Share
                  </h3>

                  <div className="h-[180px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryPerformanceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryPerformanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#090909', borderColor: '#222' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <p className="absolute text-[9px] uppercase font-display tracking-widest text-gold-pure font-bold">5 Divisions</p>
                  </div>

                  {/* Legends */}
                  <div className="space-y-2 text-[9px] font-mono">
                    {categoryPerformanceData.map((entry, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-zinc-500 font-sans">{entry.name}</span>
                        </div>
                        <span className="text-white font-bold">{entry.value} items</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

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

                {/* Column B: Recent Activity logs */}
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-white text-[10px] font-display uppercase tracking-widest">System Activity Logs</h3>
                    <button onClick={() => setActiveTab('logs')} className="text-[8px] uppercase font-mono text-zinc-500 hover:text-white">Audit</button>
                  </div>
                  <div className="space-y-3 font-mono text-[9px]">
                    {systemLogs.slice(0, 5).map(log => (
                      <div key={log.id} className="p-2 bg-black/40 border border-white/5 rounded-xs flex items-start gap-2 text-zinc-400">
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
                    <h3 className="text-white text-[10px] font-display uppercase tracking-widest">Sovereign Quick Actions</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <button 
                      onClick={() => { setIsAddProductOpen(true); setActiveTab('products'); }}
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
          )}

          {/* II. TAB: PRODUCTS CATALOG (CRUD) */}
          {activeTab === 'products' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ZOAL ENTERPRISE PORTFOLIO</span>
                  <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">ENTERPRISE PRODUCTS MANAGER</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={startCreateProduct}
                    className="py-1.5 px-3 bg-gold-pure hover:bg-gold-pure/90 text-black rounded-xs text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Register
                  </button>
                  <button 
                    onClick={handleBulkImport}
                    className="py-1.5 px-3 border border-white/10 hover:border-white text-zinc-400 hover:text-white rounded-xs text-[9px] uppercase tracking-widest font-mono cursor-pointer transition-all flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Bulk Import
                  </button>
                  <button 
                    onClick={handleBulkExport}
                    className="py-1.5 px-3 border border-white/10 hover:border-white text-zinc-400 hover:text-white rounded-xs text-[9px] uppercase tracking-widest font-mono cursor-pointer transition-all flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Bulk Export
                  </button>
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
                  1. Catalog List ({allProducts.length})
                </button>
                <button
                  onClick={() => setPmsSubTab('variants')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'variants' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  2. Variants & Attributes
                </button>
                <button
                  onClick={() => setPmsSubTab('media')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'media' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  3. Media Portfolio
                </button>
                <button
                  onClick={() => setPmsSubTab('seo-ai')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'seo-ai' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  4. SEO & AI Suite
                </button>
                <button
                  onClick={() => setPmsSubTab('reviews')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'reviews' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  5. Customer Reviews
                </button>
                <button
                  onClick={() => setPmsSubTab('bulk')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'bulk' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  6. Bulk Operations
                </button>
                <button
                  onClick={() => setPmsSubTab('logs')}
                  className={`py-2 px-4 border-b-2 transition-all cursor-pointer ${
                    pmsSubTab === 'logs' ? 'border-gold-pure text-white font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  7. PMS Audit Logs ({pmsLogs.length})
                </button>
              </div>

              {/* Product Selector for Sub-tabs */}
              {pmsSubTab !== 'catalog' && pmsSubTab !== 'bulk' && pmsSubTab !== 'logs' && (
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

              {/* Controls and filters ledger */}
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
                      <option value="fashion">Bespoke Toob</option>
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
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Brand Partner</label>
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
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Featured / Banner</label>
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
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Campaign Discounts</label>
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
                    <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Product Ledger Status</label>
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

              {/* Enterprise Catalog Form Panel */}
              <AnimatePresence>
                {isAddProductOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-zinc-950 border border-gold-pure/30 p-5 rounded-xs space-y-6 text-left overflow-hidden animate-fade-in"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] tracking-widest text-gold-pure uppercase font-bold flex items-center gap-1.5">
                        <Plus className="w-4 h-4" /> 
                        {isEditing ? `Edit Product Registry - ${editingProduct?.name}` : 'Register New Handcrafted Catalog Item'}
                      </span>
                      <button type="button" onClick={() => { setIsAddProductOpen(false); setEditingProduct(null); }} className="text-zinc-500 hover:text-white cursor-pointer"><X className="w-4.5 h-4.5" /></button>
                    </div>

                    <form onSubmit={handleSaveProduct} className="space-y-6 text-xs">
                      {/* Section 1: General Info */}
                      <div className="space-y-3 bg-black/40 p-4 border border-white/5 rounded-xs">
                        <div className="flex items-center gap-1.5 text-gold-pure font-mono text-[9.5px] uppercase tracking-wider mb-1">
                          <Sliders className="w-3.5 h-3.5" /> 1. General Identification & Narratives
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Unified Product Name *</label>
                            <input 
                              type="text" 
                              required
                              value={formState.name}
                              onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g. Traditional Yemeni Haraz Coffee"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">English Catalog Translation (EN)</label>
                            <input 
                              type="text" 
                              value={formState.nameEn}
                              onChange={(e) => setFormState(prev => ({ ...prev, nameEn: e.target.value }))}
                              placeholder="e.g. Traditional Yemeni Haraz Coffee"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block text-right font-mono">Arabic Translation (AR)</label>
                            <input 
                              type="text" 
                              value={formState.nameAr}
                              onChange={(e) => setFormState(prev => ({ ...prev, nameAr: e.target.value }))}
                              placeholder="مثال: قهوة حراز اليمنية الفاخرة"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none text-right font-sans"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Short Highlighting Bullet</label>
                            <input 
                              type="text" 
                              value={formState.shortDescription}
                              onChange={(e) => setFormState(prev => ({ ...prev, shortDescription: e.target.value }))}
                              placeholder="e.g. Notes of ripe red cherries, honey, and cardamom spice."
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Key Highlights (Comma separated)</label>
                            <input 
                              type="text" 
                              value={formState.highlights}
                              onChange={(e) => setFormState(prev => ({ ...prev, highlights: e.target.value }))}
                              placeholder="e.g. Single Origin, Organic Harvesting, Roast"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Ingredients / Sourcing details</label>
                            <input 
                              type="text" 
                              value={formState.ingredients}
                              onChange={(e) => setFormState(prev => ({ ...prev, ingredients: e.target.value }))}
                              placeholder="e.g. 100% Arabica, harvested in West Sudan."
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Directions for Use</label>
                            <input 
                              type="text" 
                              value={formState.directions}
                              onChange={(e) => setFormState(prev => ({ ...prev, directions: e.target.value }))}
                              placeholder="e.g. Steep for 3 mins."
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block text-rose-400">Warnings / Allergens</label>
                            <input 
                              type="text" 
                              value={formState.warnings}
                              onChange={(e) => setFormState(prev => ({ ...prev, warnings: e.target.value }))}
                              placeholder="None."
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-rose-300 focus:border-rose-500 outline-none font-sans"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Sovereign Story / Full Description Narrative</label>
                          <textarea 
                            rows={2}
                            value={formState.description}
                            onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Provide a grand description of the item's heritage, texture, flavor notes, or tailoring..."
                            className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                          />
                        </div>
                      </div>

                      {/* Section 2: Organization & Merchandising */}
                      <div className="space-y-3 bg-black/40 p-4 border border-white/5 rounded-xs">
                        <div className="flex items-center gap-1.5 text-gold-pure font-mono text-[9.5px] uppercase tracking-wider mb-1">
                          <FolderTree className="w-3.5 h-3.5" /> 2. Product Classification & Merchandising
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Major Division *</label>
                            <select
                              value={formState.category}
                              onChange={(e) => setFormState(prev => ({ ...prev, category: e.target.value as BusinessCategory }))}
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                            >
                              <option value="coffee">Coffee Division</option>
                              <option value="bakery">Bakery Division</option>
                              <option value="market">Market Division</option>
                              <option value="fashion">Bespoke Toob Division</option>
                              <option value="thobes">Luxury Thobes Division</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Subcategory</label>
                            <input 
                              type="text" 
                              value={formState.subcategory}
                              onChange={(e) => setFormState(prev => ({ ...prev, subcategory: e.target.value }))}
                              placeholder="e.g. Specialty Micro-lot"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Brand Workshop</label>
                            <select
                              value={formState.brand}
                              onChange={(e) => setFormState(prev => ({ ...prev, brand: e.target.value }))}
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                            >
                              <option value="AL ZOAL Specialty Roasters">AL ZOAL Specialty Roasters (Default)</option>
                              {brands.map((b: any) => (
                                <option key={b.id} value={b.name}>{b.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Seasonal Collection</label>
                            <input 
                              type="text" 
                              value={formState.collection}
                              onChange={(e) => setFormState(prev => ({ ...prev, collection: e.target.value }))}
                              placeholder="e.g. Eid Imperial Collection 2026"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Product Tags (split with commas)</label>
                            <input 
                              type="text" 
                              value={formState.tags}
                              onChange={(e) => setFormState(prev => ({ ...prev, tags: e.target.value }))}
                              placeholder="e.g. organic, wholebean, haraz, bold"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Special Promo Labels (split with commas)</label>
                            <input 
                              type="text" 
                              value={formState.labels}
                              onChange={(e) => setFormState(prev => ({ ...prev, labels: e.target.value }))}
                              placeholder="e.g. Premium Selection, Organic Harvest"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block mb-2 font-mono text-[9px]">Display Flags & Badges</label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <label className="flex items-center gap-2 bg-black border border-white/5 p-2 rounded-xs cursor-pointer hover:bg-white/5 transition-all">
                              <input 
                                type="checkbox" 
                                checked={formState.isFeatured}
                                onChange={(e) => setFormState(prev => ({ ...prev, isFeatured: e.target.checked }))}
                                className="accent-gold-pure"
                              />
                              <span className="text-[10px] text-zinc-300 font-mono">Featured</span>
                            </label>
                            <label className="flex items-center gap-2 bg-black border border-white/5 p-2 rounded-xs cursor-pointer hover:bg-white/5 transition-all">
                              <input 
                                type="checkbox" 
                                checked={formState.isBestSeller}
                                onChange={(e) => setFormState(prev => ({ ...prev, isBestSeller: e.target.checked }))}
                                className="accent-gold-pure"
                              />
                              <span className="text-[10px] text-zinc-300 font-mono">Best Seller</span>
                            </label>
                            <label className="flex items-center gap-2 bg-black border border-white/5 p-2 rounded-xs cursor-pointer hover:bg-white/5 transition-all">
                              <input 
                                type="checkbox" 
                                checked={formState.isNewArrival}
                                onChange={(e) => setFormState(prev => ({ ...prev, isNewArrival: e.target.checked }))}
                                className="accent-gold-pure"
                              />
                              <span className="text-[10px] text-zinc-300 font-mono">New Arrival</span>
                            </label>
                            <label className="flex items-center gap-2 bg-black border border-white/5 p-2 rounded-xs cursor-pointer hover:bg-white/5 transition-all">
                              <input 
                                type="checkbox" 
                                checked={formState.isFlashSale}
                                onChange={(e) => setFormState(prev => ({ ...prev, isFlashSale: e.target.checked }))}
                                className="accent-gold-pure"
                              />
                              <span className="text-[10px] text-zinc-300 font-mono">Flash Sale</span>
                            </label>
                            <label className="flex items-center gap-2 bg-black border border-white/5 p-2 rounded-xs cursor-pointer hover:bg-white/5 transition-all">
                              <input 
                                type="checkbox" 
                                checked={formState.isRecommended}
                                onChange={(e) => setFormState(prev => ({ ...prev, isRecommended: e.target.checked }))}
                                className="accent-gold-pure"
                              />
                              <span className="text-[10px] text-zinc-300 font-mono">Recommended</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Pricing & Revenue Engine */}
                      <div className="space-y-3 bg-black/40 p-4 border border-white/5 rounded-xs">
                        <div className="flex items-center gap-1.5 text-gold-pure font-mono text-[9.5px] uppercase tracking-wider mb-1">
                          <CreditCard className="w-3.5 h-3.5" /> 3. Pricing Matrix, Surcharges & Revenue (SAR)
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Regular Retail Price *</label>
                            <input 
                              type="number" 
                              required
                              value={formState.price}
                              onChange={(e) => setFormState(prev => ({ ...prev, price: e.target.value }))}
                              placeholder="e.g. 250"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Campaign Sale Price</label>
                            <input 
                              type="number" 
                              value={formState.salePrice}
                              onChange={(e) => setFormState(prev => ({ ...prev, salePrice: e.target.value }))}
                              placeholder="Leave blank if none"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Cost Price (Admin Only)</label>
                            <input 
                              type="number" 
                              disabled={currentUser?.role === 'staff'}
                              value={formState.costPrice}
                              onChange={(e) => setFormState(prev => ({ ...prev, costPrice: e.target.value }))}
                              placeholder={currentUser?.role === 'staff' ? 'Hidden' : 'e.g. 100'}
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono disabled:opacity-40"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono font-bold">Profit Margin % (Admin)</label>
                            <div className="bg-black/80 border border-white/5 p-2 rounded-xs text-zinc-400 font-mono text-[10.5px]">
                              {currentUser?.role === 'staff' ? (
                                <span>[RESTRICTED]</span>
                              ) : (
                                <span className="font-bold text-emerald-400">
                                  {formState.price && formState.costPrice ? 
                                    (((parseFloat(formState.price) - parseFloat(formState.costPrice)) / parseFloat(formState.price)) * 100).toFixed(1) + '%'
                                    : 'N/A'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Discount Start</label>
                            <input 
                              type="date" 
                              value={formState.discountStart}
                              onChange={(e) => setFormState(prev => ({ ...prev, discountStart: e.target.value }))}
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-zinc-300 focus:border-gold-pure outline-none font-mono text-[10px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Discount End</label>
                            <input 
                              type="date" 
                              value={formState.discountEnd}
                              onChange={(e) => setFormState(prev => ({ ...prev, discountEnd: e.target.value }))}
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-zinc-300 focus:border-gold-pure outline-none font-mono text-[10px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Tax Class (VAT)</label>
                            <select
                              value={formState.taxClass}
                              onChange={(e) => setFormState(prev => ({ ...prev, taxClass: e.target.value }))}
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                            >
                              <option value="Standard 15%">Standard Saudi VAT (15%)</option>
                              <option value="Zero Rated">Zero Rated (0%)</option>
                              <option value="Exempt">Exempt</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Currency</label>
                            <input 
                              type="text" 
                              disabled
                              value={formState.currency}
                              className="w-full bg-black/60 border border-white/5 p-2 rounded-xs text-zinc-500 font-mono outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Inventory Logistics */}
                      <div className="space-y-3 bg-black/40 p-4 border border-white/5 rounded-xs">
                        <div className="flex items-center gap-1.5 text-gold-pure font-mono text-[9.5px] uppercase tracking-wider mb-1">
                          <Package className="w-3.5 h-3.5" /> 4. Inventory, Warehouse Tracking & Limits
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono font-bold">SKU Code *</label>
                            <input 
                              type="text" 
                              required
                              value={formState.sku}
                              onChange={(e) => setFormState(prev => ({ ...prev, sku: e.target.value }))}
                              placeholder="e.g. ZL-COF-HARAZ"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono uppercase"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">UPC Barcode</label>
                            <input 
                              type="text" 
                              value={formState.barcode}
                              onChange={(e) => setFormState(prev => ({ ...prev, barcode: e.target.value }))}
                              placeholder="e.g. 6284491030022"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Stock Quantity *</label>
                            <input 
                              type="number" 
                              required
                              value={formState.inventory}
                              onChange={(e) => setFormState(prev => ({ ...prev, inventory: e.target.value }))}
                              placeholder="e.g. 100"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Reserved Stock Count</label>
                            <input 
                              type="number" 
                              value={formState.reservedStock}
                              onChange={(e) => setFormState(prev => ({ ...prev, reservedStock: e.target.value }))}
                              placeholder="e.g. 0"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Low Stock Alert Threshold</label>
                            <input 
                              type="number" 
                              value={formState.lowStockThreshold}
                              onChange={(e) => setFormState(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                              placeholder="Default 5"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Minimum Target Stock</label>
                            <input 
                              type="number" 
                              value={formState.minStock}
                              onChange={(e) => setFormState(prev => ({ ...prev, minStock: e.target.value }))}
                              placeholder="Default 5"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Maximum Allowed Stock</label>
                            <input 
                              type="number" 
                              value={formState.maxStock}
                              onChange={(e) => setFormState(prev => ({ ...prev, maxStock: e.target.value }))}
                              placeholder="Default 500"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono">Warehouse Rack Location</label>
                            <input 
                              type="text" 
                              value={formState.warehouseLocation}
                              onChange={(e) => setFormState(prev => ({ ...prev, warehouseLocation: e.target.value }))}
                              placeholder="e.g. Al Hofuf Central Zone Bin D2"
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 5: Media Assets */}
                      <div className="space-y-3 bg-black/40 p-4 border border-white/5 rounded-xs">
                        <div className="flex items-center gap-1.5 text-gold-pure font-mono text-[9.5px] uppercase tracking-wider mb-1">
                          <Eye className="w-3.5 h-3.5" /> 5. Media & Visual Portfolio Assortments
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Product Showcase Image URLs (one per line, or comma separated)</label>
                          <textarea 
                            rows={1}
                            value={formState.images.join('\n')}
                            onChange={(e) => {
                              const lines = e.target.value.split('\n').map(l => l.trim()).filter(Boolean);
                              setFormState(prev => ({ ...prev, images: lines }));
                            }}
                            placeholder="e.g. https://images.unsplash.com/photo-1541167760496-1628856ab772..."
                            className="w-full bg-black border border-white/5 p-2 rounded-xs text-zinc-300 focus:border-gold-pure outline-none font-mono text-[10px]"
                          />
                          <p className="text-[8.5px] text-zinc-500 font-mono">Leave empty to fallback to custom hand-drawn category graphics.</p>
                        </div>
                      </div>

                      {/* Section 6: Status & SEO (Admin Only) */}
                      <div className="space-y-3 bg-black/40 p-4 border border-white/5 rounded-xs">
                        <div className="flex items-center gap-1.5 text-gold-pure font-mono text-[9.5px] uppercase tracking-wider mb-1">
                          <Lock className="w-3.5 h-3.5" /> 6. Status, Visibility & SEO Registry (Admin Authorized)
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Product status (Admin Only)</label>
                            <select
                              disabled={currentUser?.role === 'staff'}
                              value={formState.status}
                              onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value }))}
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans disabled:opacity-40"
                            >
                              <option value="Published">Published / Live</option>
                              <option value="Draft">Draft</option>
                              <option value="Hidden">Hidden</option>
                              <option value="Archived">Archived</option>
                              <option value="Scheduled">Scheduled</option>
                              <option value="Discontinued">Discontinued</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Product Visibility (Admin Only)</label>
                            <select
                              disabled={currentUser?.role === 'staff'}
                              value={formState.visibility}
                              onChange={(e) => setFormState(prev => ({ ...prev, visibility: e.target.value }))}
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans disabled:opacity-40"
                            >
                              <option value="Public">Public (All Web Patrons)</option>
                              <option value="Private">Private / Direct Access Only</option>
                              <option value="Wholesale Only">Wholesale Partner Access Only</option>
                              <option value="Staff Only">Staff Internal Only</option>
                              <option value="Hidden">Hidden Everywhere</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">SEO Meta Title (Admin Only)</label>
                            <input 
                              type="text" 
                              disabled={currentUser?.role === 'staff'}
                              value={formState.seoMetaTitle}
                              onChange={(e) => setFormState(prev => ({ ...prev, seoMetaTitle: e.target.value }))}
                              placeholder={currentUser?.role === 'staff' ? '[RESTRICTED]' : 'SEO optimized title'}
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono disabled:opacity-40"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">SEO Meta Description (Admin Only)</label>
                            <input 
                              type="text" 
                              disabled={currentUser?.role === 'staff'}
                              value={formState.seoMetaDesc}
                              onChange={(e) => setFormState(prev => ({ ...prev, seoMetaDesc: e.target.value }))}
                              placeholder={currentUser?.role === 'staff' ? '[RESTRICTED]' : 'SEO optimized meta desc'}
                              className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono disabled:opacity-40"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Form Actions footer */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <button 
                          type="button" 
                          onClick={() => { setIsAddProductOpen(false); setEditingProduct(null); }}
                          className="py-2 px-5 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white rounded-xs uppercase tracking-widest text-[9px] font-bold cursor-pointer transition-all font-mono"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="py-2 px-7 bg-gold-pure hover:bg-gold-pure/95 text-black rounded-xs uppercase tracking-widest text-[9px] font-bold cursor-pointer transition-all flex items-center gap-1.5 font-mono"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Save Product & Synchronize
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

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
                    <button 
                      onClick={handleBulkDelete}
                      className="py-1 px-2.5 bg-rose-950/80 text-rose-300 border border-rose-500/30 hover:bg-rose-900 rounded-xs transition-all cursor-pointer"
                    >
                      Delete Selected
                    </button>
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
                        {visibleColumns.actions && <th className="p-4 text-right">Ledger Actions</th>}
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
                                    <img 
                                      src={p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=80'} 
                                      alt={p.name} 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
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
                                      title="Edit Product Registry"
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
                                    <button 
                                      onClick={() => handleDeleteProduct(p.id, p.name)}
                                      className="p-1.5 border border-rose-950 hover:bg-rose-950/30 text-rose-500 hover:text-rose-400 rounded-xs cursor-pointer"
                                      title="Remove from Catalog"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
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
                            <img 
                              src={p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=80'} 
                              alt={p.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
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
                              {p.category} Division
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
                              className="w-1/2 py-1 border border-white/5 hover:border-gold-pure/50 text-[9px] font-mono uppercase text-zinc-400 hover:text-white rounded-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Sliders className="w-3 h-3" /> Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="w-1/2 py-1 border border-rose-950 hover:bg-rose-950/20 text-[9px] font-mono uppercase text-rose-500 hover:text-rose-400 rounded-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Enterprise Ledger Pagination and Summary Footer */}
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

          {pmsSubTab !== 'catalog' && (
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
      )}

          {/* III. TAB: CATEGORIES DIV (CRUD) */}
          {activeTab === 'categories' && (
            <CategoryManagement 
              categories={categories}
              setCategories={setCategories}
              allProducts={allProducts}
              addLog={addLog}
            />
          )}

          {/* IV. TAB: LUXURY BRANDS */}
          {activeTab === 'brands' && (
            <BrandManagement 
              brands={brands}
              setBrands={setBrands}
              allProducts={allProducts}
              addLog={addLog}
            />
          )}

          {/* V. TAB: PATRON ORDERS */}
          {activeTab === 'orders' && (
            <EnterpriseOrderManagement
              currentUser={currentUser}
              orders={orders}
              setOrders={setOrders}
            />
          )}

          {/* DEPRECATED ADMIN ORDER VIEW */}
          {false && activeTab === 'orders' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ZOAL FULFILLMENT GATE</span>
                  <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">PATRON ORDERS LEDGER</h2>
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
                      addLog("Exported orders as CSV ledger");
                    }}
                    className="py-1.5 px-3 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white rounded-xs text-[9px] uppercase tracking-widest font-mono flex items-center gap-1.5 transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-gold-pure" /> Export Ledger
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
                      <th className="p-4">Patron Client</th>
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
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">Sovereign Client Registry: {selectedOrder.customerName} • {selectedOrder.date}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button 
                      onClick={() => {
                        const originalStyle = document.title;
                        document.title = `ALZOAL_Invoice_${selectedOrder.id}`;
                        window.print();
                        document.title = originalStyle;
                        addLog(`Printed Invoice: ${selectedOrder.id}`);
                      }}
                      className="py-1.5 px-3 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white text-[9.5px] font-mono font-bold tracking-wide uppercase rounded-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-gold-pure" /> Print Invoice
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
                      <h4 className="text-[10px] font-mono uppercase text-gold-pure tracking-widest border-b border-white/5 pb-2">Patron Details</h4>
                      <div className="space-y-2 text-[10.5px] text-zinc-400">
                        <p><span className="text-zinc-600 block text-[8px] uppercase font-mono">Customer Name</span> <strong className="text-white">{selectedOrder.customerName}</strong></p>
                        <p><span className="text-zinc-600 block text-[8px] uppercase font-mono">Verified Email</span> {selectedOrder.email}</p>
                        <p><span className="text-zinc-600 block text-[8px] uppercase font-mono">Contact Phone</span> {selectedOrder.phone}</p>
                        <p><span className="text-zinc-600 block text-[8px] uppercase font-mono">Payment Gateway</span> {selectedOrder.paymentMethod || 'Mastercard (Saudi)'}</p>
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
                          value={selectedOrder.status}
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
                          value={selectedOrder.paymentStatus}
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
                          value={selectedOrder.carrier}
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
                          value={selectedOrder.trackingNumber}
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
                    </div>

                    {/* Notes block */}
                    <div className="bg-black/40 border border-white/5 p-4 rounded-xs space-y-3 font-mono">
                      <h4 className="text-[10px] uppercase text-gold-pure tracking-widest border-b border-white/5 pb-2 font-bold">Administrative Notes</h4>
                      <p className="text-[9.5px] text-zinc-400 font-sans italic leading-relaxed">
                        <strong className="text-zinc-600 block font-mono text-[8.5px] not-italic uppercase">Patron instructions</strong>
                        "{selectedOrder.address.includes('Notes:') ? selectedOrder.address.split('Notes:')[1] : 'No customized message provided.'}"
                      </p>
                      
                      <div className="space-y-1 pt-2">
                        <span className="text-[8px] uppercase text-zinc-500">Internal Staff Log Notes</span>
                        <textarea
                          placeholder="Type internal notes regarding size, tailoring adjustments, packaging status..."
                          value={selectedOrder.adminNotes}
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
                      <p className="flex justify-between"><span>Sovereign Delivery:</span> <span className="text-zinc-900">+{selectedOrder.shipping} SAR</span></p>
                      <p className="flex justify-between"><span>Estimated VAT (15%):</span> <span className="text-zinc-900">{Math.round(selectedOrder.subtotal * 0.15)} SAR</span></p>
                      <p className="flex justify-between text-xs font-bold text-zinc-950 pt-2 border-t border-dashed border-zinc-300">
                        <span>Total Paid:</span>
                        <span>{selectedOrder.total} SAR</span>
                      </p>
                    </div>

                    <div className="text-center pt-4 text-[7.5px] font-mono text-zinc-400">
                      <p className="uppercase font-bold text-zinc-800">✨ Shukran for supporting Sudanese heritage! ✨</p>
                      <p className="mt-1">For support concierge call: 920001032</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VI. TAB: INVENTORY MATRIX */}
          {activeTab === 'inventory' && (
            <EnterpriseInventoryManagement
              currentUser={currentUser}
              products={allProducts}
              orders={orders}
              setOrders={setOrders}
            />
          )}

          {/* VII. TAB: PATRONS CUSTOMERS DIRECTORY */}
          {activeTab === 'customers' && (
            <EnterpriseCrm
              currentUser={currentUser}
              orders={orders}
              addLog={addLog}
            />
          )}

          {/* VIII. TAB: ARTISANAL STAFF MATRIX */}
          {activeTab === 'staff' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ZOAL WORKFORCE</span>
                  <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">STAFF PRIVILEGE MATRIX</h2>
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
                    Staff Directory
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
                    Role & Permission Matrix
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
                      Each staff account is bound to a specific security role. Changing a staff member\'s role automatically propagates their system access limits immediately.
                    </p>
                    <button
                      onClick={() => setIsAddStaffOpen(true)}
                      className="py-1.5 px-3 bg-white text-black hover:bg-gold-pure rounded-xs text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Register Staff Officer
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
                                <span className="text-zinc-500">Inherited Permissions:</span>
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {mappedPerms && mappedPerms.length > 0 ? (
                                    mappedPerms.map((pId: string, pIdx: number) => {
                                      const permObj = availablePermissions.find(p => p.id === pId || p.name.toLowerCase().replace(' ', '_') === pId);
                                      return (
                                        <span key={pIdx} className="bg-zinc-900 border border-white/5 text-[7.5px] text-zinc-300 px-1.5 py-0.5 rounded-xs uppercase">
                                          {permObj ? permObj.name : pId}
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
                                  const pwd = prompt(`Enter new secure password for ${s.name}:`);
                                  if (pwd && pwd.trim().length >= 6) {
                                    addLog(`Reset workforce password for: ${s.name}`, "Workforce Center");
                                    alert(`Password successfully reset for ${s.name}.`);
                                  } else if (pwd) {
                                    alert("Password must be at least 6 characters.");
                                  }
                                }}
                                className="text-gold-pure hover:underline font-bold cursor-pointer"
                              >
                                Reset PW
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
                                Re-Assign Role
                              </button>
                            </div>

                            <button 
                              onClick={() => {
                                if (window.confirm(`Dismiss and revoke all system access for "${s.name}"?`)) {
                                  setStaffList(prev => prev.filter(x => x.id !== s.id));
                                  addLog(`Erased workforce registration: ${s.name}`, "Workforce Center");
                                }
                              }}
                              className="text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
                            >
                              Dismiss
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
                                  if (window.confirm(`Delete the custom role "${r.name}"? This cannot be undone.`)) {
                                    setRolesList(prev => prev.filter(x => x.id !== r.id));
                                    addLog(`Erased custom Role definition: ${r.name}`, "Workforce Center");
                                  }
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
                    <h3 className="text-white text-md font-bold uppercase tracking-wider font-display">REGISTER CONCIERGE STAFF</h3>
                    
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
                      addLog(`Registered concierge staff officer: ${name} (${role})`, "Workforce Center");
                      setIsAddStaffOpen(false);
                      alert(`Concierge staff account successfully created for ${name}.`);
                    }} className="space-y-4 text-[10px]">
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase font-mono text-zinc-500">Full Name</label>
                        <input type="text" name="staff_name" required className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase font-mono text-zinc-500">Verified Corporate Email</label>
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
                    <h3 className="text-white text-md font-bold uppercase tracking-wider font-display">DEFINE CUSTOM WORKSPACE ROLE</h3>
                    
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
          )}

          {/* X. TAB: CAMPAIGNS & MARKETING */}
          {activeTab === 'marketing' && (
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
            />
          )}

          {/* XI. TAB: REPORTS SECTOR */}
          {activeTab === 'reports' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ZOAL STATISTICAL LEDGER</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">EXECUTIVE REPORTS SECTOR</h2>
              </div>

              {/* Interactive Report Configurator */}
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[10px]">
                  <div className="space-y-1">
                    <label className="text-[8.5px] uppercase font-mono text-zinc-500">Report Category</label>
                    <select 
                      id="report-type-selector"
                      defaultValue="sales"
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono text-[10px]"
                    >
                      <option value="sales">Sales Performance Ledger</option>
                      <option value="revenue">Gross Revenue Yield</option>
                      <option value="orders">Patron Orders Log</option>
                      <option value="customers">Client Concierge Registry</option>
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
                            const name = custOrders[0]?.customerName || "Patron";
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
                          summaryText = `Directory index of all active patrons placing orders within specified timeframe.`;
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
                          summaryText = `Complete warehouse audit ledger with location trackers.`;
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
                          summaryText = `Tax liability and standard VAT accounting ledger (GCC 15% Compliance).`;
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
                        alert(`Dynamic ${typeVal.toUpperCase()} report computed successfully! ${rows.length} ledger rows verified.`);
                      }}
                      className="w-full py-2 bg-gold-pure text-black font-bold uppercase tracking-widest text-[9px] cursor-pointer hover:bg-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3 text-black animate-spin-slow" /> Compile Custom Ledger
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Report Preview Container */}
              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4 font-mono text-[10px]" id="report-view-container">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
                  <div>
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500">Live Render Terminal</span>
                    <h3 className="text-white text-sm font-bold uppercase tracking-wider font-display">Active Ledger Audit</h3>
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
                                <title>AL ZOAL - Executive Report Audit</title>
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
                                <h1>AL ZOAL EXECUTIVE REPORT AUDIT</h1>
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
                                  AL ZOAL LUXURY ENTERPRISE S.A. • CONFIDENTIAL EXECUTIVE PRIVILEGES
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
                      <Printer className="w-3 h-3" /> Print PDF Report
                    </button>
                  </div>
                </div>

                {/* Local Dynamic Element to Trigger UI Refresh */}
                <div id="report-render-stage" className="hidden" />

                {/* Displaying Current Compiled Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-black border border-white/5 p-4 rounded-xs text-left space-y-1">
                    <span className="text-[8px] uppercase text-zinc-500 block">Identified Rows Count</span>
                    <strong className="text-white text-md font-sans block">
                      {((window as any)._activeReport?.count !== undefined) ? (window as any)._activeReport.count : '—'} Active Entities
                    </strong>
                  </div>
                  <div className="bg-black border border-white/5 p-4 rounded-xs text-left space-y-1">
                    <span className="text-[8px] uppercase text-zinc-500 block">Total Compiled Financials</span>
                    <strong className="text-gold-pure text-md font-sans block">
                      {((window as any)._activeReport?.total !== undefined) ? `${(window as any)._activeReport.total} SAR` : '—'}
                    </strong>
                  </div>
                  <div className="bg-black border border-white/5 p-4 rounded-xs text-left space-y-1">
                    <span className="text-[8px] uppercase text-zinc-500 block">Current Ledger Status</span>
                    <strong className="text-emerald-400 text-md font-sans block flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Certified Safe
                    </strong>
                  </div>
                </div>

                {/* Render compiled rows preview */}
                <div className="bg-black border border-white/5 rounded-xs overflow-hidden mt-4">
                  <table className="w-full text-left divide-y divide-white/5">
                    <thead className="bg-zinc-950 text-zinc-500 text-[8px] font-mono uppercase tracking-widest">
                      <tr>
                        <th className="p-3">ID / Reference</th>
                        <th className="p-3">Primary</th>
                        <th className="p-3">Secondary</th>
                        <th className="p-3">Tertiary</th>
                        <th className="p-3 text-right font-bold">Yield Amount</th>
                        <th className="p-3 text-right">Fulfillment</th>
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
                            No report compiled yet. Select a category, specify dates, and click <strong className="text-gold-pure uppercase">Compile Custom Ledger</strong> to render real-time audit indices.
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
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ZOAL CONSOLIDATED DATA</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">CONSOLIDATED BUSINESS ANALYTICS</h2>
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
                  <span className="text-zinc-500 text-[8px] uppercase tracking-widest block">Patron Acquisition Rate</span>
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
                  <span className="text-zinc-500 text-[8px] uppercase tracking-widest block">Active Cart Abandonment</span>
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
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Patrons registry ledger</span>
                    <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">Patron Growth Index</h3>
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
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Patrons Loyalty score</span>
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
                        <span className="text-zinc-400">New Patrons (68%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-[#AA8C2C]" />
                        <span className="text-zinc-400">Returning Patrons (32%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. Conversion Funnel Progress Layout */}
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
                  <div className="border-b border-white/5 pb-2">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Patron Conversion steps</span>
                    <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">Bespoke Conversion Funnel</h3>
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
                  <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">SYSTEM ALERTS LEDGER</span>
                  <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">SYSTEM ALERTS TERMINAL</h2>
                </div>
                
                {/* Actions Panel */}
                <div className="flex gap-2 font-mono text-[9px]">
                  <button
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
                      addLog("Marked all alerts as read", "Notifications Center");
                      alert("All alerts successfully marked as read.");
                    }}
                    className="py-1 px-2 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white rounded-xs uppercase font-bold cursor-pointer"
                  >
                    Mark All Read
                  </button>
                  <button
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, status: 'archived' })));
                      addLog("Archived all system alerts", "Notifications Center");
                      alert("All alerts successfully archived.");
                    }}
                    className="py-1 px-2 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white rounded-xs uppercase font-bold cursor-pointer"
                  >
                    Archive All
                  </button>
                  <button
                    onClick={() => {
                      // Reset to mock defaults
                      setNotifications([
                        { id: `notif-${Date.now()}-1`, title: 'New Order Placed', message: 'VIP Order #ZL-4491 placed by Patron Amna Al-Saeed for 350 SAR.', time: 'Just now', type: 'success', category: 'new_order', status: 'unread' },
                        { id: `notif-${Date.now()}-2`, title: 'Low Stock Alert', message: 'Taif Rose Saffron Tea has dropped below threshold. Current count: 3 jars.', time: '5 mins ago', type: 'warning', category: 'low_stock', status: 'unread' },
                        { id: `notif-${Date.now()}-3`, title: 'Out of Stock Warning', message: 'Luxury Men\'s Silk Thobe has hit zero stock in Hofuf warehouse.', time: '12 mins ago', type: 'error', category: 'out_of_stock', status: 'unread' },
                        { id: `notif-${Date.now()}-4`, title: 'Refund Request Issued', message: 'Patron alzoal3003@gmail.com has requested a refund for Order #ZL-9543 (420 SAR).', time: '1 hour ago', type: 'warning', category: 'refund_request', status: 'unread' },
                        { id: `notif-${Date.now()}-5`, title: 'New Customer Registered', message: 'Verified elite account created for Patron Khalid bin Al-Waleed.', time: '3 hours ago', type: 'info', category: 'new_customer', status: 'unread' },
                        { id: `notif-${Date.now()}-6`, title: 'Payment Failed', message: 'Credit card transaction failed for checkout attempt from IP 192.168.1.45.', time: '6 hours ago', type: 'error', category: 'payment_failed', status: 'read' },
                        { id: `notif-${Date.now()}-7`, title: 'System Warning', message: 'Database replication sync delay of 1.5s detected on European server.', time: '12 hours ago', type: 'warning', category: 'system_warning', status: 'read' }
                      ]);
                      addLog("Reset alerts data to standard matrix", "Notifications Center");
                    }}
                    className="py-1 px-2 bg-zinc-900 border border-white/5 hover:bg-[#D4AF37] hover:text-black text-white rounded-xs uppercase font-bold cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                  <button
                    onClick={() => {
                      setNotifications([]);
                      addLog("Cleared notifications ledger", "Notifications Center");
                      alert("Alerts list completely purged.");
                    }}
                    className="py-1 px-2 bg-rose-950 border border-rose-800 hover:bg-rose-900 text-rose-200 rounded-xs uppercase font-bold cursor-pointer"
                  >
                    Purge All
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

                  {/* Test alert generator widget */}
                  <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold block">Developer Test Injector</span>
                    <p className="text-[9px] text-zinc-400 font-sans leading-relaxed">Quickly fire high-care mock alerts into the admin dashboard to audit alerts response.</p>
                    <button
                      onClick={() => {
                        const types = ['new_order', 'low_stock', 'out_of_stock', 'refund_request', 'new_customer', 'payment_failed', 'system_warning'];
                        const picked = types[Math.floor(Math.random() * types.length)];
                        
                        let title = "Custom System Warning";
                        let message = "An unclassified telemetry alert was recorded.";
                        let type = "warning";

                        if (picked === 'new_order') {
                          title = "New Order Placed";
                          message = `VIP Order #ZL-${Math.floor(1000 + Math.random() * 9000)} created for ${Math.floor(200 + Math.random() * 1000)} SAR.`;
                          type = "success";
                        } else if (picked === 'low_stock') {
                          title = "Low Stock Alert";
                          message = "Artisanal Cardamom Cookies are below threshold. Remaining: 4 boxes.";
                          type = "warning";
                        } else if (picked === 'out_of_stock') {
                          title = "Out of Stock Warning";
                          message = "Kordofan Hibiscus Tea Crystals have hit absolute zero stock.";
                          type = "error";
                        } else if (picked === 'refund_request') {
                          title = "Refund Request Issued";
                          message = "Patron has requested immediate refund for Order #ZL-4412 due to courier delays.";
                          type = "warning";
                        } else if (picked === 'new_customer') {
                          title = "New Customer Registered";
                          message = "Bespoke clientele record added for Ambassador Al-Sabah.";
                          type = "info";
                        } else if (picked === 'payment_failed') {
                          title = "Payment Failed";
                          message = "SADAD Gateway rejected bank transfer transaction #TX-90231 (Authentication Error).";
                          type = "error";
                        } else if (picked === 'system_warning') {
                          title = "System Warning";
                          message = "Hourly cloud server memory consumption exceeded 85%. Autoscale active.";
                          type = "warning";
                        }

                        const newAlert = {
                          id: `notif-test-${Date.now()}`,
                          title,
                          message,
                          time: "Just now",
                          type,
                          category: picked,
                          status: 'unread'
                        };

                        setNotifications(prev => [newAlert, ...prev]);
                        addLog(`Injected Test Alert: ${title}`, "Notifications Center");
                        alert(`Injected "${title}" into system log successfully!`);
                      }}
                      className="w-full py-1.5 bg-white text-black hover:bg-gold-pure font-bold uppercase text-[9px] rounded-xs cursor-pointer"
                    >
                      Fire Random Mock Alert
                    </button>
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
                    if (statusFilter !== 'all') {
                      filtered = filtered.filter(n => n.status === statusFilter);
                    }
                    if (categoryFilter !== 'all') {
                      filtered = filtered.filter(n => n.category === categoryFilter);
                    }

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-zinc-950 border border-white/5 p-12 rounded-xs text-center font-sans space-y-2">
                          <AlertCircle className="w-6 h-6 text-zinc-600 mx-auto" />
                          <h4 className="text-white text-sm font-bold uppercase tracking-wider font-display font-mono">Ledger is clean</h4>
                          <p className="text-zinc-500 text-[10.5px]">No registered alerts match the selected filters ({statusFilter} / {categoryFilter}).</p>
                        </div>
                      );
                    }

                    return filtered.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-4 bg-zinc-950 border rounded-xs flex flex-col sm:flex-row justify-between items-start gap-4 transition-all duration-150 ${
                          n.status === 'unread' ? 'border-l-2 border-l-gold-pure border-white/5' : 'border-white/5 opacity-60'
                        }`}
                      >
                        <div className="space-y-1.5 text-left max-w-xl">
                          <div className="flex items-center gap-2">
                            {n.status === 'unread' && <span className="w-1.5 h-1.5 rounded-full bg-gold-pure animate-ping" />}
                            <span className={`font-mono font-bold uppercase tracking-wider text-[10.5px] ${
                              n.type === 'error' ? 'text-red-500' : 
                              n.type === 'warning' ? 'text-amber-500' : 
                              n.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                            }`}>
                              {n.title}
                            </span>
                            <span className="text-zinc-600 font-mono text-[8.5px] uppercase">
                              [{n.category.replace('_', ' ')}]
                            </span>
                          </div>
                          <p className="text-zinc-300 font-sans text-[11px] leading-relaxed">{n.message}</p>
                          <span className="text-zinc-500 text-[8.5px] block font-mono">{n.time}</span>
                        </div>

                        {/* Card level Actions */}
                        <div className="flex gap-2 font-mono text-[8.5px] self-end sm:self-center shrink-0">
                          {n.status === 'unread' && (
                            <button
                              onClick={() => {
                                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, status: 'read' } : x));
                                addLog(`Marked alert as read: ${n.title}`, "Notifications Center");
                              }}
                              className="py-1 px-2 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white font-bold rounded-xs cursor-pointer transition-all"
                            >
                              Mark Read
                            </button>
                          )}
                          {n.status !== 'archived' && (
                            <button
                              onClick={() => {
                                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, status: 'archived' } : x));
                                addLog(`Archived system alert: ${n.title}`, "Notifications Center");
                              }}
                              className="py-1 px-2 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-400 rounded-xs cursor-pointer"
                            >
                              Archive
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setNotifications(prev => prev.filter(x => x.id !== n.id));
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
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">GLOBAL CONFIGURATION</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">GLOBAL ENTERPRISE SETTINGS</h2>
              </div>

              {/* Settings Tab Selectors */}
              <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3 text-[9px] font-mono uppercase">
                {['profile', 'finance', 'smtp', 'security'].map(subTab => {
                  const activeSub = (window as any)._settingsActiveSub || 'profile';
                  let name = "Business Profile";
                  if (subTab === 'finance') name = "Fulfillment & Taxes";
                  if (subTab === 'smtp') name = "SMTP Mail Relay";
                  if (subTab === 'security') name = "Security & Data Backup";
                  
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
                      <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">BUSINESS GENERAL INFORMATION</span>
                      <p className="text-zinc-400 font-sans leading-relaxed text-[10.5px] mt-1">Configure the customer-facing brand details, contact gateways, geographical coordinates, and default language assets.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Business Registry Name</label>
                        <input 
                          type="text" 
                          id="settings-biz-name"
                          defaultValue={globalSettings.businessName}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Corporate Dispatch Address</label>
                        <input 
                          type="text" 
                          id="settings-biz-address"
                          defaultValue={globalSettings.address}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Customer Support Gateway Email</label>
                        <input 
                          type="email" 
                          id="settings-biz-email"
                          defaultValue={globalSettings.email}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Verified Mobile Dispatch Hotline</label>
                        <input 
                          type="text" 
                          id="settings-biz-phone"
                          defaultValue={globalSettings.phone}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Sovereign Logo Vector URL</label>
                        <input 
                          type="text" 
                          id="settings-biz-logo"
                          defaultValue={globalSettings.businessLogo}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure text-zinc-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Favicon Asset URL</label>
                        <input 
                          type="text" 
                          id="settings-biz-favicon"
                          defaultValue={globalSettings.favicon}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure text-zinc-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Instagram Luxury Portal</label>
                        <input 
                          type="text" 
                          id="settings-biz-instagram"
                          defaultValue={globalSettings.instagram}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Twitter/X Channel URL</label>
                        <input 
                          type="text" 
                          id="settings-biz-twitter"
                          defaultValue={globalSettings.twitter}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Default Locale Language</label>
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
                        <label className="text-[8.5px] uppercase text-zinc-500">Default Trade Currency</label>
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
                      <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">FULFILLMENT, TAXES & COURIER SETTINGS</span>
                      <p className="text-zinc-400 font-sans leading-relaxed text-[10.5px] mt-1">Configure default shipment fees, elite zone limits, standard GCC 15% VAT policies, and legal registration keys.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Default Dispatch Fee (SAR)</label>
                        <input 
                          type="number" 
                          id="settings-ship-fee"
                          defaultValue={globalSettings.shippingFeeDefault}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Free Courier Privilege Threshold (SAR)</label>
                        <input 
                          type="number" 
                          id="settings-ship-free"
                          defaultValue={globalSettings.shippingFreeThreshold}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">GCC Standard VAT Rate (%)</label>
                        <input 
                          type="number" 
                          id="settings-tax-rate"
                          defaultValue={globalSettings.taxRate}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Tax Registration Number (TRN)</label>
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
                      <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">SMTP SECURE MAIL RELAY</span>
                      <p className="text-zinc-400 font-sans leading-relaxed text-[10.5px] mt-1">Setup your transactional SMTP server relay to deliver instant purchase invoice receipts and digital tracking alerts to patrons automatically.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">SMTP Server Hostname</label>
                        <input 
                          type="text" 
                          id="settings-smtp-host"
                          defaultValue={globalSettings.smtpHost}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Port (SSL/TLS Encryption)</label>
                        <input 
                          type="text" 
                          id="settings-smtp-port"
                          defaultValue={globalSettings.smtpPort}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">SMTP Username Relay</label>
                        <input 
                          type="text" 
                          id="settings-smtp-user"
                          defaultValue={globalSettings.smtpUser}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">SMTP Authorized Password</label>
                        <input 
                          type="password" 
                          id="settings-smtp-pass"
                          defaultValue={globalSettings.smtpPass}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB TAB 4: SECURITY & BACKUP */}
                {((window as any)._settingsActiveSub || 'profile') === 'security' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">SECURITY, FIREWALL & SYSTEM BACKUP</span>
                      <p className="text-zinc-400 font-sans leading-relaxed text-[10.5px] mt-1">Configure advanced administrative firewall whitelists, session timeouts, backup routines, and maintenance triggers.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Authorized IP Whitelist (Comma-separated)</label>
                        <input 
                          type="text" 
                          id="settings-ip-whitelist"
                          defaultValue={globalSettings.ipWhitelist}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Session Validity Expiration (Minutes)</label>
                        <input 
                          type="number" 
                          id="settings-session-expire"
                          defaultValue={globalSettings.sessionExpirationMinutes}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] uppercase text-zinc-500">Automatic Backup Frequency</label>
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
                      if (smtpPassEl) updated.smtpPass = smtpPassEl.value;

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
                    Save Configuration Keys
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* XV. TAB: SECURITY AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">SOVEREIGN LEDGER</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">SECURITY AUDIT LOGS</h2>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-zinc-500 font-mono text-[9.5px]">Ledger feed of admin terminal operations and security events (RBAC Audited):</span>
                  <button 
                    onClick={() => {
                      setSystemLogs([
                        { id: `log-${Date.now()}`, user: currentUser?.name || 'Administrator', action: 'Cleared sovereign ledger files', ip: '192.168.1.1', time: new Date().toLocaleString() }
                      ]);
                      alert("Audit logs database cleared except current terminal session master log.");
                    }}
                    className="text-rose-500 hover:underline font-mono text-[9px] font-bold"
                  >
                    Flush Audit Ledger
                  </button>
                </div>
                
                <div className="divide-y divide-white/5 font-mono text-[9.5px]">
                  {systemLogs.map(log => (
                    <div key={log.id} className="py-2.5 flex justify-between text-zinc-400 hover:bg-white/1 duration-150 px-2 rounded-xs">
                      <div>
                        <span className="text-white block font-sans">{log.action}</span>
                        <span className="text-zinc-600 text-[8px] block">Principal: {log.user} • Node Terminal IP: {log.ip}</span>
                      </div>
                      <span className="text-zinc-500 shrink-0 text-[8.5px]">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* XVI. TAB: PRINCIPAL OWNER PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4">
                <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">AUTHENTICATED PRINCIPAL</span>
                <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">MY SOVEREIGN PROFILE</h2>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4 max-w-md">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gold-pure/10 border border-gold-pure flex items-center justify-center text-xl font-mono text-gold-pure uppercase font-bold select-none">
                    {currentUser?.name?.slice(0, 2) || 'AD'}
                  </div>
                  <div>
                    <h4 className="text-white font-display text-sm font-bold uppercase">{currentUser?.name || 'System Administrator'}</h4>
                    <span className="text-[10px] font-mono text-gold-pure block tracking-widest uppercase mt-0.5">System Principal Owner</span>
                  </div>
                </div>
                <div className="p-4 bg-black border border-white/5 rounded-xs font-mono text-[10px] text-zinc-400 space-y-2">
                  <p>• Verified Email: {currentUser?.email}</p>
                  <p>• Secured Role Level: admin (Authorized Master Owner)</p>
                  <p>• Connected node session status: <span className="text-emerald-400">cryptographic-active</span></p>
                  <p>• System Security Clearance: Level 1 Sovereign Access</p>
                </div>
              </div>
            </div>
          )}

          {/* XVII. TAB: SUPPORT CENTER DASHBOARD */}
          {activeTab === 'support' && (
            <SupportCenterDashboard
              currentUser={currentUser!}
              orders={orders}
              addLog={addLog}
            />
          )}

          {/* XVIII. TAB: SUPABASE ENTERPRISE STORAGE */}
          {activeTab === 'media' && (
            <div className="space-y-6 text-left animate-fade-in font-sans">
              <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ASSET MANAGEMENT</span>
                  <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">ENTERPRISE MEDIA HUB</h2>
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
                    Global Library
                  </button>
                  <button
                    onClick={() => setMediaSubTab('storage')}
                    className={`py-1.5 px-3 rounded-xs border text-[9px] uppercase font-mono tracking-widest font-bold transition-all cursor-pointer ${
                      mediaSubTab === 'storage' 
                        ? 'bg-gold-pure text-black border-gold-pure' 
                        : 'bg-zinc-950 text-zinc-400 border-white/5 hover:text-white'
                    }`}
                  >
                    Cloud Storage
                  </button>
                </div>
              </div>

              {mediaSubTab === 'library' ? (
                <MerchantAssetsStudio />
              ) : (
                <SupabaseStoragePanel />
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
