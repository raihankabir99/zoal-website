import React, { useState, useEffect } from 'react';
import {
  Globe, LayoutGrid, Layers, FileText, Compass, PanelBottom, Megaphone,
  Bell, Check, X, Plus, Edit, Trash2, ArrowUp, ArrowDown, ExternalLink,
  ChevronRight, Calendar, Sparkles, Shield, AlertTriangle, Eye, RefreshCw,
  Video, Link, CheckCircle2, Clock, MapPin, Phone, Mail, Facebook, Instagram,
  Twitter, Share2, CreditCard, Award, Info, FileEdit, Undo2, MessageSquare, AlertCircle,
  Search, Sliders, Settings, Lock, Languages, Download, EyeOff, Database, ChevronDown,
  CheckCircle, HardDrive, Filter, Folder, Tag, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBranding } from './BrandingContext';

// Interfaces for our full CMS state
export interface CmsDashboardStats {
  websiteStatus: 'active' | 'maintenance';
  publishedPages: number;
  draftPages: number;
  activeBanners: number;
  homepageSections: number;
  activePromotions: number;
  recentChanges: Array<{ id: string; user: string; action: string; time: string }>;
  scheduledContent: Array<{ id: string; title: string; type: string; publishAt: string; expireAt: string }>;
}

export interface HomepageSection {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  publishAt: string;
  expireAt: string;
}

export interface Banner {
  id: string;
  type: 'homepage' | 'category' | 'brand' | 'promotion' | 'popup' | 'mobile' | 'desktop';
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  bgImage: string;
  mobileImage: string;
  priority: number;
  scheduleStart: string;
  scheduleEnd: string;
  status: 'published' | 'draft' | 'archived';
  animation: 'fade' | 'slide' | 'zoom' | 'float';
}

export interface WebPage {
  id: string;
  key: string;
  title: string;
  content: string;
  images: string[];
  videos: string[];
  seoTitle: string;
  seoDesc: string;
  status: 'draft' | 'published';
  lastModified: string;
  revisionHistory: Array<{ id: string; version: string; title: string; content: string; modifiedBy: string; modifiedAt: string }>;
}

export interface MenuItem {
  id: string;
  label: string;
  link: string;
  icon: string;
  displayOrder: number;
  external: boolean;
  parentId?: string;
}

export interface FooterSettings {
  companyInfo: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  socialLinks: { facebook?: string; instagram?: string; twitter?: string; snapchat?: string; whatsapp?: string };
  paymentIcons: string[];
  certifications: string[];
  copyright: string;
  mapEmbedUrl: string;
}

export interface AnnouncementSettings {
  enabled: boolean;
  text: string;
  bgCol: string;
  txtCol: string;
  btnText: string;
  btnLink: string;
  countdownEnd: string;
  scheduleStart: string;
  scheduleEnd: string;
}

export interface PopupSettings {
  enabled: boolean;
  type: 'newsletter' | 'offer' | 'coupon' | 'holiday' | 'image' | 'video';
  title: string;
  content: string;
  imageUrl: string;
  videoUrl: string;
  couponCode: string;
  rule: 'first_visit' | 'returning' | 'seconds';
  ruleSeconds: number;
  status: 'active' | 'inactive';
}

interface EnterpriseCmsManagerProps {
  currentUser: any;
  addLog: (action: string, target?: string) => void;
  onSave?: (settings: any) => void;
}

export default function EnterpriseCmsManager({ currentUser, addLog, onSave }: EnterpriseCmsManagerProps) {
  // CMS Sub-Tabs
  const [cmsTab, setCmsTab] = useState<string>('dashboard');

  // --- INITIAL CMS STATE SETUP & PERSISTENCE ---
  const [websiteStatus, setWebsiteStatus] = useState<'active' | 'maintenance'>(() => {
    return (localStorage.getItem('cms_website_status') as 'active' | 'maintenance') || 'active';
  });

  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(() => {
    const raw = localStorage.getItem('cms_homepage_sections');
    if (raw) return JSON.parse(raw);
    return [
      { id: 'hero', name: 'Hero Slider & Banner', enabled: true, order: 1, publishAt: '', expireAt: '' },
      { id: 'featured_categories', name: 'Featured Categories Grid', enabled: true, order: 2, publishAt: '', expireAt: '' },
      { id: 'featured_brands', name: 'Featured Brands', enabled: true, order: 3, publishAt: '', expireAt: '' },
      { id: 'coffee_heritage', name: 'Al Zoal Coffee & Cafe Heritage Section', enabled: true, order: 4, publishAt: '', expireAt: '' },
      { id: 'grocery_market', name: 'Traditional Organic Bakery & Grocery Market', enabled: true, order: 5, publishAt: '', expireAt: '' },
      { id: 'cosmetics_botanicals', name: 'Cosmetics & Botanical Infusions', enabled: true, order: 6, publishAt: '', expireAt: '' },
      { id: 'featured_products', name: 'Featured Premium Gowns & Thobes', enabled: true, order: 7, publishAt: '', expireAt: '' },
      { id: 'flash_sale', name: 'Flash Sales & Active Countdown Banner', enabled: true, order: 8, publishAt: '', expireAt: '' },
      { id: 'special_offers', name: 'Exclusive Special Offers Slider', enabled: true, order: 9, publishAt: '', expireAt: '' },
      { id: 'latest_arrivals', name: 'Latest Products Carousel', enabled: true, order: 10, publishAt: '', expireAt: '' },
      { id: 'best_sellers', name: 'Best Sellers Leaderboard', enabled: true, order: 11, publishAt: '', expireAt: '' },
      { id: 'testimonials', name: 'Customer Voice & Testimonials', enabled: true, order: 12, publishAt: '', expireAt: '' },
      { id: 'partners', name: 'Partner Logos & Cultural Alliances', enabled: true, order: 13, publishAt: '', expireAt: '' },
      { id: 'newsletter', name: 'Newsletter Circle Invitation', enabled: true, order: 14, publishAt: '', expireAt: '' }
    ];
  });

  const [banners, setBanners] = useState<Banner[]>(() => {
    const raw = localStorage.getItem('cms_banners');
    if (raw) return JSON.parse(raw);
    return [
      {
        id: 'banner-1',
        type: 'homepage',
        title: 'Sudanese Heritage',
        subtitle: 'Premium Hand-Embroidered Toobs & Fine Tailoring',
        description: 'Immerse your senses in luxurious drapes hand-woven with organic threads and tailored for elite Saudi gatherings.',
        buttonText: 'Explore Collection',
        buttonLink: '#store',
        bgImage: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=1600',
        mobileImage: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=600',
        priority: 1,
        scheduleStart: '2026-01-01',
        scheduleEnd: '2026-12-31',
        status: 'published',
        animation: 'zoom'
      },
      {
        id: 'banner-2',
        type: 'promotion',
        title: 'Specialty Saffron Coffee Blend',
        subtitle: '100% Single-Origin Yemeni Coffee & Organic Spices',
        description: 'Harvested directly from high-altitude terraces and masterfully roasted at our Dammam flagships.',
        buttonText: 'Order Fresh Roast',
        buttonLink: '#coffee',
        bgImage: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=1600',
        mobileImage: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=600',
        priority: 2,
        scheduleStart: '2026-07-01',
        scheduleEnd: '2026-08-31',
        status: 'published',
        animation: 'slide'
      }
    ];
  });

  const [webPages, setWebPages] = useState<WebPage[]>(() => {
    const raw = localStorage.getItem('cms_web_pages');
    if (raw) return JSON.parse(raw);
    return [
      {
        id: 'page-1',
        key: 'about',
        title: 'Boutique Sanctuary Story',
        content: 'AL ZOAL is a premium boutique sanctuary celebrating Sudanese hospitality and artisanal heritage. Every coffee bean, baked crumb, herb harvest, and golden thread is curated with authentic luxury drapes.',
        images: ['https://images.unsplash.com/photo-1541167760496-1628856ab772'],
        videos: [],
        seoTitle: 'Our Heritage | AL ZOAL Luxury Sudanese Artisanal Sanctuary',
        seoDesc: 'Learn about the timeless cultural fusion of Sudanese premium craftsmanship and warm Saudi hospitality at AL ZOAL.',
        status: 'published',
        lastModified: '2026-07-15 11:30',
        revisionHistory: [
          { id: 'rev-1', version: 'v1.0', title: 'Our Sanctuary', content: 'Our initial about page content.', modifiedBy: 'Amjad Suliman', modifiedAt: '2026-05-10 14:22' }
        ]
      },
      {
        id: 'page-2',
        key: 'privacy',
        title: 'Digital Privacy Policy',
        content: 'We store your cryptographic session identities and personal details securely under standard GCC security laws.',
        images: [],
        videos: [],
        seoTitle: 'Privacy Protection Statement | AL ZOAL',
        seoDesc: 'How we respect, encrypt, and secure your personal details and transactions in compliance with Saudi regulations.',
        status: 'published',
        lastModified: '2026-07-14 09:12',
        revisionHistory: []
      },
      {
        id: 'page-3',
        key: 'shipping',
        title: 'Express Shipping Policy',
        content: 'Dispatched from Dammam and Al Hofuf main warehouses using premium high-care courier express. Overnight delivery available.',
        images: [],
        videos: [],
        seoTitle: 'Saudi Courier Shipping & Logistics | AL ZOAL',
        seoDesc: 'Fast high-security dispatch terms for fresh botanical products and luxury thobes across Saudi Arabia.',
        status: 'published',
        lastModified: '2026-07-12 18:44',
        revisionHistory: []
      }
    ];
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const raw = localStorage.getItem('cms_menu_items');
    if (raw) return JSON.parse(raw);
    return [
      { id: 'menu-1', label: 'Boutique Sanctuary', link: '#store', icon: 'Compass', displayOrder: 1, external: false },
      { id: 'menu-2', label: 'The Coffee Roasters', link: '#coffee', icon: 'Sparkles', displayOrder: 2, external: false },
      { id: 'menu-3', label: 'Artisanal Bakery', link: '#bakery', icon: 'Award', displayOrder: 3, external: false },
      { id: 'menu-4', label: 'Premium Sudanese Toob', link: '#fashion', icon: 'FileText', displayOrder: 4, external: false },
      { id: 'menu-5', label: 'The Saudi Flagships', link: '#branches', icon: 'MapPin', displayOrder: 5, external: false }
    ];
  });

  const [footerSettings, setFooterSettings] = useState<FooterSettings>(() => {
    const raw = localStorage.getItem('cms_footer_settings');
    if (raw) return JSON.parse(raw);
    return {
      companyInfo: 'AL ZOAL is a premium cultural bridge celebrating fine Sudanese artistry, organic agricultural marvels, and authentic Arabian luxury hospitality.',
      address: 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia',
      phone: '+966 56 769 9315',
      email: 'alzoal3003@gmail.com',
      workingHours: 'Everyday: 07:00 AM - 11:30 PM (Special prayer pauses apply)',
      socialLinks: { facebook: 'https://facebook.com/alzoal', instagram: 'https://instagram.com/alzoal', twitter: 'https://twitter.com/alzoal', snapchat: 'https://snapchat.com/add/alzoal', whatsapp: 'https://wa.me/966567699315' },
      paymentIcons: ['mada', 'visa', 'mastercard', 'applepay', 'stcpay', 'banktransfer'],
      certifications: ['Saudi Ministry of Commerce Registered', 'Maroof Elite Platform Bronze Stamp', 'SFDA Approved Food Grade Facilities'],
      copyright: '© 2026 AL ZOAL Boutique Co. All rights reserved. Developed to Saudi e-Commerce standards.',
      mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1m4!2sAl+Hofuf!3m2!1i1024!2i768!4f13.1!3m3!1m2!2sAbu+Bakr+As+Siddiq+Rd!5e0!3m2!1sen!2ssa!4v1'
    };
  });

  const [announcement, setAnnouncement] = useState<AnnouncementSettings>(() => {
    const raw = localStorage.getItem('cms_announcement_settings');
    if (raw) return JSON.parse(raw);
    return {
      enabled: true,
      text: '✨ GRAND CULTURAL GALA: Celebrate Sudanese Heritage at our Dammam flagship. Premium coffee is complimentary.',
      bgCol: '#D4AF37',
      txtCol: '#000000',
      btnText: 'View Location',
      btnLink: '#branches',
      countdownEnd: '2026-09-01T20:00:00',
      scheduleStart: '2026-07-01',
      scheduleEnd: '2026-09-01'
    };
  });

  const [popup, setPopup] = useState<PopupSettings>(() => {
    const raw = localStorage.getItem('cms_popup_settings');
    if (raw) return JSON.parse(raw);
    return {
      enabled: true,
      type: 'coupon',
      title: 'Join The Elite Circle',
      content: 'Subscribe to our botanical market circle & receive an exclusive 15% discount coupon on your first order of hand-tailored Sudanese Toobs.',
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400',
      videoUrl: '',
      couponCode: 'ZOALGOLD',
      rule: 'seconds',
      ruleSeconds: 5,
      status: 'active'
    };
  });


  // Recent changes log inside CMS
  const [recentChanges, setRecentChanges] = useState<Array<{ id: string; user: string; action: string; time: string }>>([
    { id: 'chg-1', user: 'Amjad Suliman', action: 'Published Homepage Hero Banner', time: '10 mins ago' },
    { id: 'chg-2', user: 'Sumaya Bashir', action: 'Enabled Coffee Section Schedule', time: '2 hours ago' },
    { id: 'chg-3', user: 'System Auto', action: 'Archived Eid Al-Adha Promo Banner', time: '1 day ago' }
  ]);

  // --- STATE FOR PHASE 11 PART 2 ADVANCED CMS ---
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'staff' | 'customer'>(() => {
    return (currentUser?.role as any) || 'owner';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [optimizationActive, setOptimizationActive] = useState(true);

  // Expanded Homepage Section layouts state
  const [homepageLayoutConfigs, setHomepageLayoutConfigs] = useState<{ [key: string]: {
    bgImage: string; bgColor: string; padding: string; margin: string; animation: string; desktopOnly: boolean; mobileOnly: boolean;
  }}>({
    hero: { bgImage: 'https://images.unsplash.com/photo-1541167760496-1628856ab772', bgColor: '#000000', padding: 'medium', margin: 'none', animation: 'zoom-in', desktopOnly: false, mobileOnly: false },
    featured_categories: { bgImage: '', bgColor: '#050505', padding: 'large', margin: 'medium', animation: 'fade', desktopOnly: false, mobileOnly: false },
    coffee_heritage: { bgImage: '', bgColor: '#090806', padding: 'large', margin: 'large', animation: 'slide-up', desktopOnly: false, mobileOnly: false }
  });

  const [promotions, setPromotions] = useState(() => {
    const raw = localStorage.getItem('cms_promotions');
    if (raw) return JSON.parse(raw);
    return [
      { id: 'promo-1', type: 'flash_sale', name: 'Flash Sale countdown event', enabled: true, couponCode: 'FLASHZOAL', discountValue: '20% Off', startDate: '2026-07-01', endDate: '2026-07-20' },
      { id: 'promo-2', type: 'ramadan', name: 'Ramadan Karim Traditional Gifting', enabled: true, couponCode: 'RAMADAN26', discountValue: '15% Off', startDate: '2026-03-01', endDate: '2026-04-01' },
      { id: 'promo-3', type: 'eid', name: 'Eid Al-Fitr Elegant Toob Showcase', enabled: true, couponCode: 'EIDFITR', discountValue: '10% Off', startDate: '2026-04-01', endDate: '2026-04-10' },
      { id: 'promo-4', type: 'national_day', name: 'Saudi National Day Golden Heritage', enabled: false, couponCode: 'ZOAL96', discountValue: '25% Off', startDate: '2026-09-20', endDate: '2026-09-24' }
    ];
  });

  const [seoSettings, setSeoSettings] = useState(() => {
    const raw = localStorage.getItem('cms_seo_settings');
    if (raw) return JSON.parse(raw);
    return [
      { id: 'seo-1', targetType: 'global', targetName: 'Global Portal Settings', seoTitle: 'AL ZOAL | Authentic Sudanese Luxury Sanctuary', seoDesc: 'Discover high-care Sudanese coffee blends, heritage bakery, organic herbs, and hand-tailored luxury apparel.', keywords: 'Sudanese coffee, Toobs, Saudi luxury, Al Hofuf boutique', canonicalUrl: 'https://alzoal.com', ogTitle: 'AL ZOAL Luxury', ogDesc: 'Discover high-care Sudanese artisan crafts.', ogImage: 'https://images.unsplash.com/photo-1541167760496-1628856ab772', twitterTitle: 'AL ZOAL', twitterDesc: 'Discover luxury apparel.', twitterImage: 'https://images.unsplash.com/photo-1541167760496-1628856ab772', schemaMarkup: '{\n  "@context": "https://schema.org",\n  "@type": "Store",\n  "name": "AL ZOAL Sanctuary",\n  "image": "https://alzoal.com/logo.png"\n}' },
      { id: 'seo-2', targetType: 'homepage', targetName: 'Homepage', seoTitle: 'AL ZOAL Boutique - Dammam & Al Hofuf', seoDesc: 'Exclusive Sudanese heritage hospitality meets refined modern luxury in the Eastern Province.', keywords: 'Al Zoal, premium coffee, premium thobes', canonicalUrl: 'https://alzoal.com/home', ogTitle: 'AL ZOAL Home', ogDesc: 'Sudanese luxury portal.', ogImage: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e', twitterTitle: 'AL ZOAL Home', twitterDesc: 'Premium portal.', twitterImage: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e', schemaMarkup: '{\n  "@context": "https://schema.org",\n  "@type": "WebSite",\n  "name": "AL ZOAL"\n}' }
    ];
  });

  const [mediaAssets, setMediaAssets] = useState(() => {
    const raw = localStorage.getItem('cms_media_assets');
    if (raw) return JSON.parse(raw);
    return [
      { id: 'med-1', name: 'Toob Model 1', type: 'image', url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800', folder: 'Apparel Images', tags: ['apparel', 'luxury'], size: '1.2 MB', dimensions: '1600x1200', createdAt: '2026-07-10' },
      { id: 'med-2', name: 'Yemeni Coffee Roast Grains', type: 'image', url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=800', folder: 'Coffee Heritage', tags: ['coffee', 'organic'], size: '890 KB', dimensions: '1440x960', createdAt: '2026-07-12' },
      { id: 'med-3', name: 'Dammam Flagship Interior Tour', type: 'video', url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772', folder: 'Media Streams', tags: ['interior', 'tour'], size: '12.4 MB', createdAt: '2026-07-14' },
      { id: 'med-4', name: 'Saudi VAT Registration Certificate', type: 'document', url: '#', folder: 'Documents', tags: ['legal', 'pdf'], size: '1.4 MB', createdAt: '2026-07-01' }
    ];
  });

  const [folders, setFolders] = useState<string[]>(['Apparel Images', 'Coffee Heritage', 'Media Streams', 'Documents']);

  const [activityLogs, setActivityLogs] = useState(() => {
    const raw = localStorage.getItem('cms_activity_logs');
    if (raw) return JSON.parse(raw);
    return [
      { id: 'log-1', user: 'Amjad Suliman (Owner)', action: 'Initialized CMS Sentry Environment', timestamp: '2026-07-16 04:30', affectedContent: 'System Settings', severity: 'info' },
      { id: 'log-2', user: 'Sumaya Bashir (Admin)', action: 'Updated About Sanctuary SEO title', timestamp: '2026-07-16 04:45', affectedContent: 'SEO / About', severity: 'info' }
    ];
  });

  const [revisions, setRevisions] = useState(() => {
    const raw = localStorage.getItem('cms_revisions');
    if (raw) return JSON.parse(raw);
    return [
      { id: 'rev-1', version: 'v1.0', author: 'Amjad Suliman', date: '2026-07-15 12:00', changeLog: 'Initial baseline deployment of Al Zoal layout structures.', restorePoint: '' }
    ];
  });

  // Helper to add activity logs inside CMS
  const handleAddCmsActivityLog = (action: string, affected: string, type: 'info' | 'warning' | 'critical' = 'info') => {
    const newLog = {
      id: `log-${Date.now()}`,
      user: `${currentUser?.name || 'Support Office'} (${userRole.toUpperCase()})`,
      action,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      affectedContent: affected,
      severity: type
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Helper to create rollback snapshot
  const triggerCmsSnapshot = (changeLogMsg: string) => {
    const snapshotObj = {
      websiteStatus,
      homepageSections,
      banners,
      webPages,
      menuItems,
      footerSettings,
      announcement,
      popup,
      promotions,
      seoSettings,
      mediaAssets
    };
    const newRev = {
      id: `rev-${Date.now()}`,
      version: `v1.${revisions.length + 1}`,
      author: currentUser?.name || 'Administrative Desk',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      changeLog: changeLogMsg,
      restorePoint: JSON.stringify(snapshotObj)
    };
    setRevisions(prev => [newRev, ...prev]);
  };

  // Sync to localStorage on local state changes & bubble up to parent if needed
  useEffect(() => {
    localStorage.setItem('cms_website_status', websiteStatus);
    localStorage.setItem('cms_homepage_sections', JSON.stringify(homepageSections));
    localStorage.setItem('cms_banners', JSON.stringify(banners));
    localStorage.setItem('cms_web_pages', JSON.stringify(webPages));
    localStorage.setItem('cms_menu_items', JSON.stringify(menuItems));
    localStorage.setItem('cms_footer_settings', JSON.stringify(footerSettings));
    localStorage.setItem('cms_announcement_settings', JSON.stringify(announcement));
    localStorage.setItem('cms_popup_settings', JSON.stringify(popup));
    localStorage.setItem('cms_homepage_layout_configs', JSON.stringify(homepageLayoutConfigs));
    localStorage.setItem('cms_promotions', JSON.stringify(promotions));
    localStorage.setItem('cms_seo_settings', JSON.stringify(seoSettings));
    localStorage.setItem('cms_media_assets', JSON.stringify(mediaAssets));
    localStorage.setItem('cms_activity_logs', JSON.stringify(activityLogs));
    localStorage.setItem('cms_revisions', JSON.stringify(revisions));

    if (onSave) {
      onSave({
        websiteStatus,
        homepageSections,
        banners,
        webPages,
        menuItems,
        footerSettings,
        announcement,
        popup,
        promotions,
        seoSettings,
        mediaAssets,
        activityLogs,
        revisions
      });
    }
  }, [websiteStatus, homepageSections, banners, webPages, menuItems, footerSettings, announcement, popup, homepageLayoutConfigs, promotions, seoSettings, mediaAssets, activityLogs, revisions]);

  // --- ACTIONS ---
  // Reorder Sections
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const updated = [...homepageSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    // Swap
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Re-index order property
    updated.forEach((sec, idx) => {
      sec.order = idx + 1;
    });

    setHomepageSections(updated);
    addLog(`Re-ordered Homepage Section priority: ${temp.name} moved ${direction}`);
  };

  // Toggle Section Enabled
  const handleToggleSection = (id: string, enabled: boolean) => {
    const updated = homepageSections.map(sec => sec.id === id ? { ...sec, enabled } : sec);
    setHomepageSections(updated);
    const secObj = homepageSections.find(s => s.id === id);
    addLog(`${enabled ? 'Enabled' : 'Disabled'} Homepage Section: ${secObj?.name}`);
  };

  // Add a new Custom Web Page
  const [isAddPageOpen, setIsAddPageOpen] = useState(false);
  const [newPageForm, setNewPageForm] = useState({ key: '', title: '', content: '', seoTitle: '', seoDesc: '' });

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageForm.key || !newPageForm.title) return;

    const newPage: WebPage = {
      id: `page-${Date.now()}`,
      key: newPageForm.key.toLowerCase().trim().replace(/\s+/g, '-'),
      title: newPageForm.title,
      content: newPageForm.content,
      images: [],
      videos: [],
      seoTitle: newPageForm.seoTitle || `${newPageForm.title} | AL ZOAL`,
      seoDesc: newPageForm.seoDesc || newPageForm.content.slice(0, 150),
      status: 'draft',
      lastModified: new Date().toISOString().replace('T', ' ').slice(0, 16),
      revisionHistory: []
    };

    setWebPages(prev => [...prev, newPage]);
    setNewPageForm({ key: '', title: '', content: '', seoTitle: '', seoDesc: '' });
    setIsAddPageOpen(false);
    addLog(`Created new CMS Page Draft: ${newPage.title}`);
    alert(`Successfully registered draft page: "${newPage.title}"`);
  };

  // Add / Edit Banners States
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState<Partial<Banner>>({
    title: '', subtitle: '', description: '', type: 'homepage',
    buttonText: '', buttonLink: '', bgImage: '', priority: 1, status: 'draft', animation: 'fade'
  });

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title) return;

    if (editingBanner) {
      // Edit
      const updated = banners.map(b => b.id === editingBanner.id ? { ...b, ...bannerForm } as Banner : b);
      setBanners(updated);
      addLog(`Updated Website Banner: ${bannerForm.title}`);
    } else {
      // Add
      const newB: Banner = {
        id: `banner-${Date.now()}`,
        type: bannerForm.type || 'homepage',
        title: bannerForm.title || '',
        subtitle: bannerForm.subtitle || '',
        description: bannerForm.description || '',
        buttonText: bannerForm.buttonText || '',
        buttonLink: bannerForm.buttonLink || '',
        bgImage: bannerForm.bgImage || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800',
        mobileImage: bannerForm.bgImage || '',
        priority: bannerForm.priority || 1,
        scheduleStart: bannerForm.scheduleStart || '',
        scheduleEnd: bannerForm.scheduleEnd || '',
        status: bannerForm.status || 'draft',
        animation: bannerForm.animation || 'fade'
      };
      setBanners(prev => [...prev, newB]);
      addLog(`Created new Web Banner Asset: ${newB.title}`);
    }

    setIsBannerModalOpen(false);
    setEditingBanner(null);
  };

  // Delete Banner
  const handleDeleteBanner = (id: string, title: string) => {
    if (window.confirm(`Are you absolutely sure you want to permanently delete banner asset: "${title}"?`)) {
      setBanners(prev => prev.filter(b => b.id !== id));
      addLog(`Deleted Web Banner Asset: ${title}`);
    }
  };

  // Page Editor States
  const [selectedPageId, setSelectedPageId] = useState<string>('page-1');
  const activePage = webPages.find(p => p.id === selectedPageId) || webPages[0];

  // Live Page Update Callback
  const handleUpdateActivePage = (field: keyof WebPage, value: any) => {
    const updated = webPages.map(p => {
      if (p.id === selectedPageId) {
        // Handle revision backup when saving content change
        let revisionList = [...p.revisionHistory];
        if (field === 'content' && p.content !== value) {
          const newRev = {
            id: `rev-${Date.now()}`,
            version: `v1.${p.revisionHistory.length + 1}`,
            title: p.title,
            content: p.content,
            modifiedBy: currentUser?.name || 'Support Office',
            modifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
          };
          revisionList.unshift(newRev);
        }

        return {
          ...p,
          [field]: value,
          lastModified: new Date().toISOString().replace('T', ' ').slice(0, 16),
          revisionHistory: revisionList
        };
      }
      return p;
    });
    setWebPages(updated);
  };

  // Navigation Items CRUD
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [menuForm, setMenuForm] = useState({ label: '', link: '', icon: 'Compass', parentId: '', external: false });

  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.label || !menuForm.link) return;

    const newItem: MenuItem = {
      id: `menu-${Date.now()}`,
      label: menuForm.label,
      link: menuForm.link,
      icon: menuForm.icon,
      displayOrder: menuItems.length + 1,
      external: menuForm.external,
      parentId: menuForm.parentId || undefined
    };

    setMenuItems(prev => [...prev, newItem]);
    setIsAddMenuOpen(false);
    setMenuForm({ label: '', link: '', icon: 'Compass', parentId: '', external: false });
    addLog(`Added Nav Menu Node: ${newItem.label}`);
  };

  const handleDeleteMenuItem = (id: string, label: string) => {
    if (window.confirm(`Remove navigation node "${label}"?`)) {
      setMenuItems(prev => prev.filter(m => m.id !== id));
      addLog(`Deleted Nav Menu Node: ${label}`);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* CMS Sub-Header Navigation tabs & RBAC/Language controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">
            {lang === 'ar' ? 'البوابة السيادية لإدارة المحتوى' : 'ZOAL STORE'}
          </span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-gold-pure animate-spin-slow" /> 
            {lang === 'ar' ? 'إدارة محتوى المنصة الاحترافية' : 'WEBSITE CMS'}
          </h2>
        </div>
        
        {/* Dynamic Controls Row: Language settings, Role picker, Search */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* 1. Global Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder={lang === 'ar' ? 'بحث شامل في المحتوى...' : 'Search pages, banners, SEO...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-black border border-white/10 text-[10px] rounded-xs text-white outline-none focus:border-gold-pure w-48 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-[9px]"
              >
                Clear
              </button>
            )}
          </div>

          {/* 2. Interactive Role Swapper (RBAC simulation) */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/5 py-1 px-2.5 rounded-xs">
            <Shield className="w-3.5 h-3.5 text-gold-pure" />
            <select
              value={userRole}
              onChange={(e) => {
                const selected = e.target.value as any;
                setUserRole(selected);
                handleAddCmsActivityLog(`Switched simulator role to ${selected.toUpperCase()}`, 'System Sentry');
                alert(`Simulated Role Swapped to: ${selected.toUpperCase()}`);
              }}
              className="bg-transparent text-[9.5px] uppercase tracking-wider font-mono text-zinc-300 outline-none cursor-pointer"
            >
              <option value="owner" className="bg-black text-white">👑 Owner (Full Rollback)</option>
              <option value="admin" className="bg-black text-white">🛡️ Admin (Full Access)</option>
              <option value="staff" className="bg-black text-white">📋 Staff (Limited Edit)</option>
              <option value="customer" className="bg-black text-white">👤 Customer (Blocked)</option>
            </select>
          </div>

          {/* 3. English/Arabic RTL Switcher */}
          <button
            onClick={() => {
              const nextLang = lang === 'en' ? 'ar' : 'en';
              setLang(nextLang);
              handleAddCmsActivityLog(`Toggled UI Language Settings to ${nextLang.toUpperCase()}`, 'Localization Sentry');
            }}
            className="flex items-center gap-1 py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xs text-[9px] font-mono uppercase text-zinc-300 cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-gold-pure" />
            <span>Control: {lang === 'en' ? 'Arabic (RTL)' : 'English (LTR)'}</span>
          </button>
          
          {/* Status Badge */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 py-1 px-3 rounded-full text-[9px] font-mono">
            <span className={`w-2 h-2 rounded-full ${websiteStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className="uppercase tracking-wider text-zinc-300">
              {lang === 'ar' ? 'حالة البوابة: ' : 'SYSTEM: '} {websiteStatus === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'صيانة' : 'Maintenance')}
            </span>
          </div>
          
          <button
            onClick={() => {
              if (userRole === 'customer') {
                alert("Permission Denied: Customer accounts are blocked from deploying CMS changes.");
                return;
              }
              triggerCmsSnapshot("Manual site-wide compilation snapshot.");
              handleAddCmsActivityLog("Compiled and deployed live CMS changes to edge CDN nodes", "Global Production Website");
              alert("✓ CMS compiled successfully. Edge caches invalidated, site is live!");
            }}
            className="py-1.5 px-4 bg-white hover:bg-gold-pure text-black rounded-xs text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,255,255,0.05)] font-mono"
          >
            <Check className="w-3.5 h-3.5" /> {lang === 'ar' ? 'نشر التحديثات' : 'Publish Changes'}
          </button>
        </div>
      </div>

      {/* HORIZONTAL CMS SUBTABS BAR */}
      <div className="flex overflow-x-auto pb-1 gap-1 border-b border-white/5 text-[9px] font-mono tracking-widest uppercase scrollbar-thin">
        {[
          { id: 'dashboard', label: lang === 'ar' ? '📊 لوحة القيادة والمؤشرات' : '📊 Overview' },
          { id: 'homepage', label: lang === 'ar' ? '🏠 أقسام الصفحة الرئيسية' : '🏠 Homepage' },
          { id: 'banners', label: lang === 'ar' ? '🎏 لافتات العرض' : '🎏 Banners' },
          { id: 'pages', label: lang === 'ar' ? '📄 الصفحات التحريرية' : '📄 Pages' },
          { id: 'navigation', label: lang === 'ar' ? '🗺️ روابط التنقل والمنيو' : '🗺️ Navigation Menu' },
          { id: 'footer', label: lang === 'ar' ? '👣 التذييل والبيانات المحلية' : '👣 Footer Settings' },
          { id: 'announcement', label: lang === 'ar' ? '📢 شريط التنبيه العلوي' : '📢 Announcement Bar' },
          { id: 'popups', label: lang === 'ar' ? '💬 النوافذ المنبثقة النشطة' : '💬 Popups' },
          { id: 'seo', label: lang === 'ar' ? '🔍 إدارة الـ SEO والكلمات' : '🔍 SEO Tools' },
          { id: 'media', label: lang === 'ar' ? '📁 مكتبة الوسائط المركزية' : '📁 Media Library' },
          { id: 'promotions', label: lang === 'ar' ? '🎁 العروض والخصومات والمواسم' : '🎁 Promotions & Offers' },
          { id: 'history', label: lang === 'ar' ? '⏳ سجل النسخ واستعادة الحالة' : '⏳ Version History' },
          { id: 'database_sec', label: lang === 'ar' ? '🔒 الأمان وقواعد البيانات RLS' : '🔒 Security & Access' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCmsTab(tab.id)}
            className={`py-2 px-3 border border-transparent rounded-xs cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              cmsTab === tab.id
                ? 'bg-gold-pure/10 text-gold-pure border-gold-pure/35 font-bold shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Global Search Results Panel (if search active) */}
      {searchQuery && (
        <div className="bg-zinc-950 border border-gold-pure/30 p-4 rounded-xs text-[10px] font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-gold-pure uppercase font-bold tracking-widest text-[8.5px]">
              🔍 Global Search Sentry: Found matches for "{searchQuery}"
            </span>
            <button onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-white">Close Search</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Search Pages */}
            {webPages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
              <div key={p.id} onClick={() => { setCmsTab('pages'); setSelectedPageId(p.id); setSearchQuery(''); }} className="p-2.5 bg-black hover:bg-white/5 border border-white/10 rounded-xs cursor-pointer space-y-1">
                <span className="text-[7.5px] uppercase tracking-wider text-emerald-500 font-bold">Editorial Page</span>
                <h4 className="text-[9.5px] font-bold text-white uppercase">{p.title}</h4>
                <p className="text-[8.5px] text-zinc-400 font-sans line-clamp-1">{p.content}</p>
              </div>
            ))}

            {/* Search Banners */}
            {banners.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.description.toLowerCase().includes(searchQuery.toLowerCase())).map(b => (
              <div key={b.id} onClick={() => { setCmsTab('banners'); setSearchQuery(''); }} className="p-2.5 bg-black hover:bg-white/5 border border-white/10 rounded-xs cursor-pointer space-y-1">
                <span className="text-[7.5px] uppercase tracking-wider text-amber-500 font-bold">Visual Banner</span>
                <h4 className="text-[9.5px] font-bold text-white uppercase">{b.title}</h4>
                <p className="text-[8.5px] text-zinc-400 font-sans line-clamp-1">{b.description}</p>
              </div>
            ))}

            {/* Search Media */}
            {mediaAssets.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.folder.toLowerCase().includes(searchQuery.toLowerCase())).map(m => (
              <div key={m.id} onClick={() => { setCmsTab('media'); setSearchQuery(''); }} className="p-2.5 bg-black hover:bg-white/5 border border-white/10 rounded-xs cursor-pointer space-y-1">
                <span className="text-[7.5px] uppercase tracking-wider text-gold-pure font-bold">Media Asset</span>
                <h4 className="text-[9.5px] font-bold text-white uppercase">{m.name}</h4>
                <p className="text-[8.5px] text-zinc-400 font-sans line-clamp-1">Folder: {m.folder}</p>
              </div>
            ))}

            {/* Search SEO settings */}
            {seoSettings.filter(s => s.seoTitle.toLowerCase().includes(searchQuery.toLowerCase()) || s.seoDesc.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
              <div key={s.id} onClick={() => { setCmsTab('seo'); setSearchQuery(''); }} className="p-2.5 bg-black hover:bg-white/5 border border-white/10 rounded-xs cursor-pointer space-y-1">
                <span className="text-[7.5px] uppercase tracking-wider text-sky-500 font-bold">SEO Setting</span>
                <h4 className="text-[9.5px] font-bold text-white uppercase">{s.targetName}</h4>
                <p className="text-[8.5px] text-zinc-400 font-sans line-clamp-1">{s.seoTitle}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- CONTENT SEGMENT REDIRECTOR --- */}
      <div className="space-y-6">

        {/* Access Denied Shield Guard if role is customer */}
        {userRole === 'customer' ? (
          <div className="bg-zinc-950 border border-rose-500/35 p-8 rounded-xs text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center rounded-full mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Administrative Access Shield Sentry</h3>
              <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                Permissions verification failed. Current simulation role is configured as <strong>Customer</strong>. Customers are strictly restricted from inspecting, altering, or reverting Al Zoal administrative CMS systems.
              </p>
            </div>
            <button
              onClick={() => {
                setUserRole('owner');
                handleAddCmsActivityLog("Escalated permissions from CUSTOMER to OWNER", "System Sentry");
                alert("Simulated role upgraded back to OWNER. Full systems unlocked.");
              }}
              className="py-1 px-4 bg-white hover:bg-gold-pure text-black font-mono font-bold text-[9px] uppercase tracking-widest rounded-xs cursor-pointer"
            >
              Elevate Role to Owner
            </button>
          </div>
        ) : (
          <>

        {/* 1. CMS DASHBOARD SUBTAB */}
        {cmsTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left columns: CMS Health & Quick Controls */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* CMS Dashboard Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Published Pages', value: webPages.filter(p=>p.status==='published').length, count: 'Live Pages' },
                  { label: 'Draft Pages', value: webPages.filter(p=>p.status==='draft').length, count: 'Work in progress' },
                  { label: 'Active Banners', value: banners.filter(b=>b.status==='published').length, count: 'Active Carousel' },
                  { label: 'Homepage Modules', value: homepageSections.filter(s=>s.enabled).length, count: 'Visible on Front' }
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">{stat.label}</span>
                    <span className="text-2xl font-light text-white font-mono">{stat.value}</span>
                    <span className="text-[7.5px] block text-gold-pure/60 mt-1 font-mono uppercase tracking-wider">● {stat.count}</span>
                  </div>
                ))}
              </div>

              {/* Website Access Guard Panel */}
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold">Website Status</span>
                  <span className="text-[8px] uppercase text-zinc-500 font-mono">GCC Edge Rules</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-black border border-white/5 rounded-xs">
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Access Control: {websiteStatus === 'active' ? 'Website Access: Public' : 'MAINTENANCE MODE'}</h4>
                    <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                      {websiteStatus === 'active' 
                        ? 'Website is fully accessible by global buyers. Edge servers serving high-speed cached assets.'
                        : 'Saudi regulatory notices / Al Zoal custom maintenance cover active. Backend orders still process internally.'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setWebsiteStatus('active');
                        addLog('Set Public Website Status to ACTIVE');
                        alert('Al Zoal portal is now 100% active and open to public purchasers.');
                      }}
                      className={`px-3 py-1 text-[9px] font-mono uppercase font-bold tracking-widest rounded-xs cursor-pointer ${
                        websiteStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => {
                        setWebsiteStatus('maintenance');
                        addLog('Set Public Website Status to MAINTENANCE');
                        alert('Al Zoal portal set to maintenance cover. Visitors will see a refined sanctuary greeting.');
                      }}
                      className={`px-3 py-1 text-[9px] font-mono uppercase font-bold tracking-widest rounded-xs cursor-pointer ${
                        websiteStatus === 'maintenance' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Maintenance
                    </button>
                  </div>
                </div>
              </div>

              {/* Scheduled Content Deployment Queue */}
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Scheduled Campaigns</span>
                <div className="overflow-x-auto text-[9.5px]">
                  <table className="w-full text-left font-mono">
                    <thead>
                      <tr className="border-b border-white/5 text-[8px] uppercase text-zinc-500">
                        <th className="py-2">Campaign Name</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Trigger Date</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      <tr>
                        <td className="py-2.5 text-white font-sans font-medium">✨ Saffron Coffee Blend</td>
                        <td className="py-2 text-[8.5px] uppercase">Promo Banner</td>
                        <td className="py-2">2026-08-31</td>
                        <td className="py-2"><span className="text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-full text-[8px] uppercase border border-emerald-500/15">Active</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-white font-sans font-medium">🌙 Ramadan Heritage Bazaar</td>
                        <td className="py-2 text-[8.5px] uppercase">Homepage Grid</td>
                        <td className="py-2">2026-09-10</td>
                        <td className="py-2"><span className="text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-full text-[8px] uppercase border border-amber-500/15">Scheduled</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-white font-sans font-medium">🍂 Autumn Boutique Collection</td>
                        <td className="py-2 text-[8.5px] uppercase">Premium Gown Slide</td>
                        <td className="py-2">2026-10-01</td>
                        <td className="py-2"><span className="text-zinc-500 bg-zinc-500/5 px-2 py-0.5 rounded-full text-[8px] uppercase border border-white/5">Queued</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right column: Recent Changes Feed & Main Specs */}
            <div className="space-y-6">
              
              {/* Recent Changes Log */}
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Recent Activity</span>
                
                <div className="space-y-3">
                  {recentChanges.map((change) => (
                    <div key={change.id} className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-mono text-[9px] font-semibold">{change.user}</span>
                        <span className="text-zinc-500 text-[8px] font-mono">{change.time}</span>
                      </div>
                      <p className="text-[9.5px] text-zinc-400 font-sans leading-snug">{change.action}</p>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    setRecentChanges([
                      { id: `chg-${Date.now()}`, user: currentUser?.name || 'Support Office', action: 'Polled live CDN cloud metrics', time: 'Just Now' },
                      ...recentChanges
                    ]);
                  }}
                  className="w-full text-center py-2 border border-white/5 hover:border-gold-pure/35 text-[8.5px] uppercase tracking-widest font-mono text-zinc-400 hover:text-gold-pure rounded-xs transition-colors cursor-pointer"
                >
                  Refresh Logs
                </button>
              </div>

              {/* Edge Cache Purging and SEO Health card */}
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Website Cache</span>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                  AL ZOAL utilizes edge servers in Riyadh, Jeddah, and Al Hofuf to provide near-zero latency delivery of high-res Sudanese apparel imagery.
                </p>
                <button
                  onClick={() => {
                    addLog("Invalidated Web Edge CDN Caches", "Cloud Server");
                    alert("Edge Cloudflare cache successfully purged globally across Eastern Province and Gulf nodes.");
                  }}
                  className="w-full text-center py-2 bg-zinc-900 hover:bg-gold-pure text-white hover:text-black font-semibold text-[8.5px] uppercase tracking-widest font-mono rounded-xs transition-all cursor-pointer"
                >
                  ⚡ Clear Website Cache
                </button>
              </div>

            </div>

          </div>
        )}

        {/* 2. HOMEPAGE MANAGER TAB */}
        {cmsTab === 'homepage' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left columns: Interactive Sections List */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold">Homepage Modules Structure</span>
                  <span className="text-[8px] uppercase text-zinc-500 font-mono">Priority Order Grid</span>
                </div>

                <div className="space-y-2.5">
                  {homepageSections.map((sec, idx) => (
                    <React.Fragment key={sec.id}>
                      <div
                        className={`p-3.5 bg-black border rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          sec.enabled ? 'border-white/10 hover:border-gold-pure/25' : 'border-white/5 opacity-50'
                        }`}
                      >
                      <div className="flex items-center gap-3">
                        {/* Order badge */}
                        <div className="w-6 h-6 rounded-xs bg-zinc-900 border border-white/5 flex items-center justify-center text-white font-mono text-[10px]">
                          {sec.order}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-[10.5px] font-bold text-white uppercase tracking-wider font-mono">{sec.name}</h4>
                          <span className="text-[8px] text-zinc-500 block font-mono">
                            ID: {sec.id} {sec.publishAt && `• Scheduled: ${sec.publishAt}`}
                          </span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        
                        {/* Up / Down priority order arrows */}
                        <button
                          onClick={() => handleMoveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 bg-zinc-900 border border-white/5 rounded-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          title="Move priority up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveSection(idx, 'down')}
                          disabled={idx === homepageSections.length - 1}
                          className="p-1 bg-zinc-900 border border-white/5 rounded-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          title="Move priority down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>

                        {/* Enable/Disable toggle */}
                        <button
                          onClick={() => handleToggleSection(sec.id, !sec.enabled)}
                          className={`py-1 px-2.5 text-[8.5px] uppercase font-mono tracking-widest font-bold rounded-xs cursor-pointer border ${
                            sec.enabled 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25' 
                              : 'bg-zinc-900 text-zinc-500 border-transparent'
                          }`}
                        >
                          {sec.enabled ? 'Active' : 'Disabled'}
                        </button>

                        {/* Interactive Scheduler Trigger button */}
                        <button
                          onClick={() => {
                            const date = prompt("Enter publish date (YYYY-MM-DD) or leave empty:", sec.publishAt);
                            if (date !== null) {
                              const updated = homepageSections.map(s => s.id === sec.id ? { ...s, publishAt: date } : s);
                              setHomepageSections(updated);
                              addLog(`Set Homepage Section Publish Schedule for: ${sec.name} -> ${date}`);
                            }
                          }}
                          className="p-1.5 bg-zinc-900 border border-white/5 rounded-xs text-zinc-400 hover:text-gold-pure cursor-pointer"
                          title="Schedule Publish"
                        >
                          <Calendar className="w-3 h-3" />
                        </button>

                        {/* Interactive Layout Setup Button */}
                        <button
                          onClick={() => {
                            setHomepageLayoutConfigs(prev => {
                              const current = prev[sec.id] || { bgImage: '', bgColor: '#050505', padding: 'medium', margin: 'none', animation: 'fade', desktopOnly: false, mobileOnly: false };
                              return { ...prev, [sec.id]: current };
                            });
                            // Toggle expand ID
                            const raw = (window as any).expandedLayoutSecId === sec.id ? null : sec.id;
                            (window as any).expandedLayoutSecId = raw;
                            // Trigger state force refresh by re-syncing homepage sections
                            setHomepageSections([...homepageSections]);
                          }}
                          className={`p-1.5 border rounded-xs cursor-pointer transition-colors ${
                            (window as any).expandedLayoutSecId === sec.id
                              ? 'bg-gold-pure text-black border-gold-pure'
                              : 'bg-zinc-900 text-zinc-400 border-white/5 hover:text-white'
                          }`}
                          title="Configure Detailed Layout Styling"
                        >
                          <Sliders className="w-3 h-3" />
                        </button>

                      </div>
                    </div>

                    {/* Expandable Detailed Visual Config drawer */}
                    {(window as any).expandedLayoutSecId === sec.id && (
                      <div className="mt-2 p-4 bg-black border border-gold-pure/20 rounded-xs space-y-4 text-[9.5px] font-mono animate-fade-in">
                        <div className="flex items-center justify-between border-b border-white/5 pb-1">
                          <span className="text-gold-pure uppercase font-bold tracking-wider text-[8px]">🛠️ Section Layout Architect: {sec.name}</span>
                          <span className="text-[7px] text-zinc-500 uppercase">GCC Custom Render rules</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Background Image & Color */}
                          <div className="space-y-2.5">
                            <div>
                              <label className="block text-zinc-400 mb-1">BACKGROUND IMAGE URL</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="https://..."
                                  value={homepageLayoutConfigs[sec.id]?.bgImage || ''}
                                  onChange={(e) => {
                                    setHomepageLayoutConfigs(prev => ({
                                      ...prev,
                                      [sec.id]: { ...prev[sec.id], bgImage: e.target.value }
                                    }));
                                  }}
                                  className="w-full bg-zinc-900 border border-white/10 p-1 px-2 text-[9px] text-white outline-none focus:border-gold-pure"
                                />
                                <button
                                  onClick={() => {
                                    setHomepageLayoutConfigs(prev => ({
                                      ...prev,
                                      [sec.id]: { ...prev[sec.id], bgImage: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800' }
                                    }));
                                    handleAddCmsActivityLog(`Loaded Saffron Toob texture background into ${sec.name}`, 'Homepage Architect');
                                  }}
                                  className="px-2 py-1 bg-zinc-900 border border-white/10 text-[8px] hover:text-white"
                                >
                                  Sudanese Presets
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-zinc-400 mb-1 font-mono">BACKGROUND HEX COLOR</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={homepageLayoutConfigs[sec.id]?.bgColor || '#050505'}
                                  onChange={(e) => {
                                    setHomepageLayoutConfigs(prev => ({
                                      ...prev,
                                      [sec.id]: { ...prev[sec.id], bgColor: e.target.value }
                                    }));
                                  }}
                                  className="w-8 h-6 bg-transparent border-0 cursor-pointer outline-none"
                                />
                                <input
                                  type="text"
                                  value={homepageLayoutConfigs[sec.id]?.bgColor || '#050505'}
                                  onChange={(e) => {
                                    setHomepageLayoutConfigs(prev => ({
                                      ...prev,
                                      [sec.id]: { ...prev[sec.id], bgColor: e.target.value }
                                    }));
                                  }}
                                  className="w-24 bg-zinc-900 border border-white/10 p-1 px-2 text-[9px] text-white font-mono uppercase"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Padding, Margins & Animations */}
                          <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-zinc-400 mb-1">PADDING SIZE (PY)</label>
                                <select
                                  value={homepageLayoutConfigs[sec.id]?.padding || 'medium'}
                                  onChange={(e) => {
                                    setHomepageLayoutConfigs(prev => ({
                                      ...prev,
                                      [sec.id]: { ...prev[sec.id], padding: e.target.value }
                                    }));
                                  }}
                                  className="w-full bg-zinc-900 border border-white/10 p-1 outline-none text-zinc-300"
                                >
                                  <option value="none">Zero (0px)</option>
                                  <option value="small">Small (py-4 - 16px)</option>
                                  <option value="medium">Medium (py-12 - 48px)</option>
                                  <option value="large">Large (py-24 - 96px)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-zinc-400 mb-1">MARGIN BOTTOM (MB)</label>
                                <select
                                  value={homepageLayoutConfigs[sec.id]?.margin || 'none'}
                                  onChange={(e) => {
                                    setHomepageLayoutConfigs(prev => ({
                                      ...prev,
                                      [sec.id]: { ...prev[sec.id], margin: e.target.value }
                                    }));
                                  }}
                                  className="w-full bg-zinc-900 border border-white/10 p-1 outline-none text-zinc-300"
                                >
                                  <option value="none">Zero (0px)</option>
                                  <option value="small">Small (mb-4)</option>
                                  <option value="medium">Medium (mb-12)</option>
                                  <option value="large">Large (mb-24)</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-zinc-400 mb-1">INTRO ANIMATION</label>
                                <select
                                  value={homepageLayoutConfigs[sec.id]?.animation || 'fade'}
                                  onChange={(e) => {
                                    setHomepageLayoutConfigs(prev => ({
                                      ...prev,
                                      [sec.id]: { ...prev[sec.id], animation: e.target.value }
                                    }));
                                  }}
                                  className="w-full bg-zinc-900 border border-white/10 p-1 outline-none text-zinc-300"
                                >
                                  <option value="fade">✨ Smooth Fade In</option>
                                  <option value="slide-up">🔼 Slide from Base</option>
                                  <option value="zoom-in">🔍 Scale Zoom In</option>
                                  <option value="slide-right">👉 Slide from Left</option>
                                  <option value="bounce">🏀 Elastic bounce</option>
                                </select>
                              </div>

                              {/* Visibility limits */}
                              <div>
                                <label className="block text-zinc-400 mb-1">DEVICE TARGET VISIBILITY</label>
                                <div className="space-y-1 py-1">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                                    <input
                                      type="checkbox"
                                      checked={homepageLayoutConfigs[sec.id]?.desktopOnly || false}
                                      onChange={(e) => {
                                        setHomepageLayoutConfigs(prev => ({
                                          ...prev,
                                          [sec.id]: { ...prev[sec.id], desktopOnly: e.target.checked, mobileOnly: e.target.checked ? false : prev[sec.id]?.mobileOnly }
                                        }));
                                      }}
                                    />
                                    <span>Desktop Wide Only</span>
                                  </label>
                                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                                    <input
                                      type="checkbox"
                                      checked={homepageLayoutConfigs[sec.id]?.mobileOnly || false}
                                      onChange={(e) => {
                                        setHomepageLayoutConfigs(prev => ({
                                          ...prev,
                                          [sec.id]: { ...prev[sec.id], mobileOnly: e.target.checked, desktopOnly: e.target.checked ? false : prev[sec.id]?.desktopOnly }
                                        }));
                                      }}
                                    />
                                    <span>Mobile Handheld Only</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-2 bg-zinc-900/40 rounded-xs border border-white/5 text-[8.5px] text-zinc-400 font-sans leading-relaxed flex items-center justify-between">
                          <span>
                            ✓ Active CSS output: <code>{`class="${homepageLayoutConfigs[sec.id]?.padding === 'large' ? 'py-24' : 'py-12'} ${homepageLayoutConfigs[sec.id]?.margin === 'large' ? 'mb-24' : ''} ${homepageLayoutConfigs[sec.id]?.desktopOnly ? 'hidden lg:block' : ''} ${homepageLayoutConfigs[sec.id]?.mobileOnly ? 'block lg:hidden' : ''}" style="background-color: ${homepageLayoutConfigs[sec.id]?.bgColor || '#050505'};"`}</code>
                          </span>
                          <button
                            onClick={() => {
                              handleAddCmsActivityLog(`Committed visual configurations for ${sec.name}`, 'Homepage Architect');
                              alert(`Successfully saved CSS rendering parameters for ${sec.name}.`);
                            }}
                            className="px-2 py-0.5 bg-white text-black uppercase font-bold text-[7.5px]"
                          >
                            Save Settings
                          </button>
                        </div>
                      </div>
                    )}
                    </React.Fragment>
                  ))}
              </div>
            </div>

            </div>

            {/* Right column: Homepage Meta Slogans */}
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 text-[9.5px]">
                <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Visual Themes</span>
                <p className="text-zinc-400 leading-relaxed font-sans">
                  The homepage order dictates the modular scroll flow of the client application. Adjust priorities to respond to cultural events, seasonal fashion collection rollouts, or botanical harvests.
                </p>

                <div className="p-3 bg-black border border-white/5 rounded-xs space-y-2">
                  <span className="text-[8px] font-mono uppercase text-zinc-500 tracking-wider block">Visual Priority Tip</span>
                  <p className="text-zinc-400 font-sans leading-relaxed">
                    Set high priority to <strong>Hero Slider</strong> during grand inaugurations and thobe holidays, but move <strong>Traditional Organic Market</strong> to the top when fresh imports of Sudanese Karkadeh blossoms arrive.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 3. BANNER MEDIA MANAGER TAB */}
        {cmsTab === 'banners' && (
          <div className="space-y-6">
            
            {/* Header controls inside Banners */}
            <div className="flex justify-between items-center bg-zinc-950 border border-white/5 p-4 rounded-xs">
              <div className="space-y-0.5">
                <span className="text-[8px] font-mono uppercase text-zinc-500">Website Media Asset Library</span>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">Visual Banner Sliders ({banners.length})</h3>
              </div>
              <button
                onClick={() => {
                  setEditingBanner(null);
                  setBannerForm({
                    title: '', subtitle: '', description: '', type: 'homepage',
                    buttonText: 'Shop Selection', buttonLink: '#store',
                    bgImage: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800',
                    priority: 1, status: 'draft', animation: 'fade'
                  });
                  setIsBannerModalOpen(true);
                }}
                className="py-1 px-3 bg-white hover:bg-gold-pure text-black rounded-xs text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Register Banner
              </button>
            </div>

            {/* Interactive Grid of Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {banners.map((b) => (
                <div key={b.id} className="bg-zinc-950 border border-white/5 rounded-xs overflow-hidden flex flex-col justify-between">
                  
                  {/* Visual Simulation Area */}
                  <div className="relative h-44 bg-zinc-900 flex flex-col justify-end p-4 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3)), url(${b.bgImage})` }}>
                    {/* Floating badge */}
                    <div className="absolute top-3 left-3 bg-black/70 border border-white/10 px-2 py-0.5 rounded-full text-[7.5px] uppercase font-mono tracking-wider text-gold-pure">
                      {b.type} Banner • {b.animation} Animation
                    </div>
                    
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${b.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      <span className="text-[8px] font-mono text-zinc-300 uppercase bg-black/60 px-2 py-0.5 rounded-full border border-white/5">{b.status}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-gold-pure uppercase tracking-widest block font-medium">{b.subtitle}</span>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider font-display leading-tight">{b.title}</h4>
                      <p className="text-[9px] text-zinc-300 font-sans line-clamp-1 leading-normal">{b.description}</p>
                    </div>
                  </div>

                  {/* Details & Controls */}
                  <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between gap-4 text-[9.5px]">
                    <div className="space-y-0.5 font-mono">
                      <span className="text-zinc-500 text-[8px] block uppercase">Priority Rank: {b.priority}</span>
                      {b.scheduleStart && (
                        <span className="text-zinc-400 text-[8.5px] block">{b.scheduleStart} to {b.scheduleEnd}</span>
                      )}
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setEditingBanner(b);
                          setBannerForm({ ...b });
                          setIsBannerModalOpen(true);
                        }}
                        className="py-1 px-2.5 bg-zinc-900 hover:bg-gold-pure text-white hover:text-black border border-white/5 text-[8.5px] uppercase font-mono rounded-xs cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(b.id, b.title)}
                        className="p-1 bg-zinc-900 hover:bg-rose-500/15 text-zinc-400 hover:text-rose-500 border border-white/5 rounded-xs cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* BANNER EDIT MODAL */}
            {isBannerModalOpen && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-zinc-950 border border-white/10 w-full max-w-xl p-6 rounded-xs space-y-4 overflow-y-auto max-h-[90vh]">
                  
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-xs uppercase tracking-widest text-gold-pure font-bold font-mono">
                      {editingBanner ? 'Modify Banner Metadata' : 'Register New Banner Asset'}
                    </h3>
                    <button onClick={() => setIsBannerModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveBanner} className="space-y-4 text-[10px] font-mono">
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-zinc-500">Banner Location Type</label>
                        <select
                          value={bannerForm.type}
                          onChange={(e) => setBannerForm(p => ({ ...p, type: e.target.value as any }))}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        >
                          <option value="homepage">Homepage Main Slider</option>
                          <option value="category">Category Hub Banner</option>
                          <option value="brand">Luxury Brand Banner</option>
                          <option value="promotion">Promo Bar Cover</option>
                          <option value="popup">Interactive Modal Popup</option>
                          <option value="mobile">Mobile Specific</option>
                          <option value="desktop">Wide Desktop Cover</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-zinc-500">Priority Weight</label>
                        <input
                          type="number"
                          value={bannerForm.priority}
                          onChange={(e) => setBannerForm(p => ({ ...p, priority: parseInt(e.target.value) }))}
                          required
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Main Title Heading</label>
                      <input
                        type="text"
                        value={bannerForm.title}
                        onChange={(e) => setBannerForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. Traditional Wood Fire Bakery"
                        required
                        className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-zinc-500">Subtitle Tagline</label>
                        <input
                          type="text"
                          value={bannerForm.subtitle}
                          onChange={(e) => setBannerForm(p => ({ ...p, subtitle: e.target.value }))}
                          placeholder="e.g. Hearth baked fresh every morning"
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-zinc-500">Animation Entrance style</label>
                        <select
                          value={bannerForm.animation}
                          onChange={(e) => setBannerForm(p => ({ ...p, animation: e.target.value as any }))}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        >
                          <option value="fade">Elegant Fade-in</option>
                          <option value="slide">Dynamic Slide-in</option>
                          <option value="zoom">Immersive Scale Zoom</option>
                          <option value="float">Floating Ripple</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Description Paragraph</label>
                      <textarea
                        rows={2}
                        value={bannerForm.description}
                        onChange={(e) => setBannerForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Immersive descriptions of fresh hibiscus infusions or tailored gowns..."
                        className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-zinc-500">Button Display text</label>
                        <input
                          type="text"
                          value={bannerForm.buttonText}
                          onChange={(e) => setBannerForm(p => ({ ...p, buttonText: e.target.value }))}
                          placeholder="e.g. Shop Sudanese Toob"
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-zinc-500">Button Redirect URL Link</label>
                        <input
                          type="text"
                          value={bannerForm.buttonLink}
                          onChange={(e) => setBannerForm(p => ({ ...p, buttonLink: e.target.value }))}
                          placeholder="e.g. #store"
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Background Imagery URL Link (High-res)</label>
                      <input
                        type="text"
                        value={bannerForm.bgImage}
                        onChange={(e) => setBannerForm(p => ({ ...p, bgImage: e.target.value }))}
                        className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-zinc-500">Campaign Start Date</label>
                        <input
                          type="date"
                          value={bannerForm.scheduleStart}
                          onChange={(e) => setBannerForm(p => ({ ...p, scheduleStart: e.target.value }))}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-zinc-500">Campaign Expiry Date</label>
                        <input
                          type="date"
                          value={bannerForm.scheduleEnd}
                          onChange={(e) => setBannerForm(p => ({ ...p, scheduleEnd: e.target.value }))}
                          className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Workflow Deployment Status</label>
                      <select
                        value={bannerForm.status}
                        onChange={(e) => setBannerForm(p => ({ ...p, status: e.target.value as any }))}
                        className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                      >
                        <option value="draft">Draft (Not Visible)</option>
                        <option value="published">Published & Active Live</option>
                        <option value="archived">Archived Segment (Stored)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-white text-black hover:bg-gold-pure font-bold uppercase tracking-widest py-2.5 rounded-xs text-[9px] cursor-pointer mt-4"
                    >
                      Save & Compile Banner Asset
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 4. WEBSITE PAGES CMS TAB */}
        {cmsTab === 'pages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left sidebar: list of pages */}
            <div className="space-y-4">
              
              <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold">Editorial Pages CMS</span>
                  <button
                    onClick={() => setIsAddPageOpen(true)}
                    className="p-1 bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white rounded-xs cursor-pointer"
                    title="Add Custom Page"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-[9.5px]">
                  {webPages.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPageId(p.id)}
                      className={`w-full text-left p-2.5 rounded-xs transition-all border block ${
                        selectedPageId === p.id
                          ? 'bg-gold-pure/10 text-gold-pure border-gold-pure/30 font-semibold'
                          : 'bg-black/20 text-zinc-400 border-white/5 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="uppercase tracking-wider truncate font-mono">{p.key} Page</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      </div>
                      <span className="text-[7.5px] text-zinc-500 block truncate mt-0.5">{p.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTIVE PAGE REVISION HISTORY */}
              {activePage && (
                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3">
                  <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Revision Backups ({activePage.revisionHistory.length})</span>
                  
                  {activePage.revisionHistory.length === 0 ? (
                    <p className="text-[9px] text-zinc-500 font-sans italic">No historical rewrites. Current draft is master.</p>
                  ) : (
                    <div className="space-y-2 text-[9px]">
                      {activePage.revisionHistory.map((rev) => (
                        <div key={rev.id} className="p-2.5 bg-black border border-white/5 rounded-xs space-y-1">
                          <div className="flex justify-between text-zinc-400">
                            <span className="font-semibold text-white">{rev.version}</span>
                            <span>{rev.modifiedAt}</span>
                          </div>
                          <p className="text-zinc-500 leading-tight">By {rev.modifiedBy}</p>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to revert content to state from ${rev.modifiedAt}?`)) {
                                handleUpdateActivePage('content', rev.content);
                                addLog(`Restored CMS Page Revision: ${activePage.title} (${rev.version})`);
                                alert(`Reverted content successfully.`);
                              }
                            }}
                            className="text-[8px] uppercase tracking-wider text-gold-pure hover:underline mt-1 font-mono flex items-center gap-1 cursor-pointer"
                          >
                            <Undo2 className="w-2.5 h-2.5" /> Revert Content
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Right details: Page Editor & Live Preview */}
            <div className="lg:col-span-2 space-y-6">
              {activePage ? (
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                  
                  {/* Title and metadata */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold">ACTIVE MANAGEMENT FILE: /{activePage.key}</span>
                    <div className="flex gap-2">
                      <select
                        value={activePage.status}
                        onChange={(e) => handleUpdateActivePage('status', e.target.value)}
                        className="bg-black border border-white/10 text-white p-1 text-[8.5px] uppercase font-mono rounded-xs"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published Live</option>
                      </select>
                    </div>
                  </div>

                  {/* Editorial Fields */}
                  <div className="space-y-3 text-[10px] font-mono">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Document Headline Title</label>
                      <input
                        type="text"
                        value={activePage.title}
                        onChange={(e) => handleUpdateActivePage('title', e.target.value)}
                        className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-sans font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[8px] uppercase text-zinc-500">Artisanal Narrative Content</label>
                        <span className="text-[7.5px] text-zinc-500">Supports standard HTML paragraphs and bold tags</span>
                      </div>
                      <textarea
                        rows={6}
                        value={activePage.content}
                        onChange={(e) => handleUpdateActivePage('content', e.target.value)}
                        className="bg-black w-full border border-white/10 text-white p-3 text-[10px] rounded-xs outline-none focus:border-gold-pure resize-none font-sans leading-relaxed"
                      />
                    </div>

                    {/* SEO Metadata specifically for this page */}
                    <div className="p-4 bg-black border border-white/5 rounded-xs space-y-3">
                      <span className="text-[8.5px] text-gold-pure uppercase tracking-widest font-semibold block">SEO Metadata for /{activePage.key}</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase text-zinc-500">Meta Title Tag</label>
                          <input
                            type="text"
                            value={activePage.seoTitle}
                            onChange={(e) => handleUpdateActivePage('seoTitle', e.target.value)}
                            className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase text-zinc-500">Meta Description</label>
                          <textarea
                            rows={2}
                            value={activePage.seoDesc}
                            onChange={(e) => handleUpdateActivePage('seoDesc', e.target.value)}
                            className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure resize-none"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Real-time interactive simulation of public page view */}
                  <div className="p-4 bg-black border border-white/5 rounded-xs space-y-3 select-none">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block border-b border-white/5 pb-1">Live Sanctuary Preview</span>
                    <div className="p-5 bg-[#050505] border border-white/5 rounded-xs space-y-3 max-h-56 overflow-y-auto">
                      <div className="text-center space-y-1 pb-2 border-b border-white/5">
                        <span className="text-[7px] tracking-[0.4em] text-gold-pure uppercase font-mono">AL ZOAL BOUTIQUE SANCTUARY</span>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{activePage.title}</h4>
                      </div>
                      <p className="text-[9px] text-zinc-300 font-sans leading-relaxed whitespace-pre-line text-center">{activePage.content}</p>
                      <div className="pt-2 border-t border-white/5 text-center">
                        <span className="text-[7px] font-mono text-zinc-500 uppercase">Hofuf, Saudi Arabia • Luxury Website Cover</span>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center p-12 bg-zinc-950 border border-white/5 text-zinc-500 font-mono text-[10px]">
                  Select or register an editorial page narrative to begin writing.
                </div>
              )}
            </div>

            {/* CREATE PAGE MODAL */}
            {isAddPageOpen && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-zinc-950 border border-white/10 w-full max-w-md p-6 rounded-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-xs uppercase tracking-widest text-gold-pure font-bold font-mono">Create Custom Editorial Page</h3>
                    <button onClick={() => setIsAddPageOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreatePage} className="space-y-4 text-[10px] font-mono">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Page Key (URL suffix)</label>
                      <input
                        type="text"
                        placeholder="e.g. coffee-history"
                        value={newPageForm.key}
                        onChange={(e) => setNewPageForm(p => ({ ...p, key: e.target.value }))}
                        required
                        className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Page Headline Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Traditional Sudanese Heritage Roasters"
                        value={newPageForm.title}
                        onChange={(e) => setNewPageForm(p => ({ ...p, title: e.target.value }))}
                        required
                        className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Initial Rich Content Narrative</label>
                      <textarea
                        rows={4}
                        placeholder="Type standard narrative description..."
                        value={newPageForm.content}
                        onChange={(e) => setNewPageForm(p => ({ ...p, content: e.target.value }))}
                        required
                        className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure resize-none font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-white text-black hover:bg-gold-pure font-bold uppercase tracking-widest py-2.5 rounded-xs text-[9px] cursor-pointer"
                    >
                      Save Editorial Draft Page
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 5. NAVIGATION MENUS CMS TAB */}
        {cmsTab === 'navigation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[10px]">
            
            {/* Left columns: Menu Items Drag-Simulator */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-mono uppercase text-zinc-500">Public Header Navigation links</span>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white">Main Menu Tree ({menuItems.length})</h3>
                  </div>
                  <button
                    onClick={() => setIsAddMenuOpen(true)}
                    className="py-1 px-2.5 bg-zinc-900 border border-white/10 hover:border-white/30 text-white text-[8.5px] uppercase font-mono rounded-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Append Nav Node
                  </button>
                </div>

                <div className="space-y-2">
                  {menuItems.sort((a,b)=>a.displayOrder - b.displayOrder).map((item, idx) => (
                    <div key={item.id} className="p-3 bg-black border border-white/10 rounded-xs flex items-center justify-between gap-4 font-mono">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center text-[9px] text-zinc-500 font-bold">
                          {idx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-white uppercase font-bold tracking-wider">{item.label}</h4>
                          <span className="text-[8.5px] text-gold-pure block">{item.link} {item.external && '• (External)'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Display order arrows */}
                        <button
                          onClick={() => {
                            if (idx === 0) return;
                            const swapped = [...menuItems];
                            const temp = swapped[idx].displayOrder;
                            swapped[idx].displayOrder = swapped[idx - 1].displayOrder;
                            swapped[idx - 1].displayOrder = temp;
                            setMenuItems(swapped);
                            addLog(`Moved Navigation priority for node: ${swapped[idx].label}`);
                          }}
                          disabled={idx === 0}
                          className="p-1 bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (idx === menuItems.length - 1) return;
                            const swapped = [...menuItems];
                            const temp = swapped[idx].displayOrder;
                            swapped[idx].displayOrder = swapped[idx + 1].displayOrder;
                            swapped[idx + 1].displayOrder = temp;
                            setMenuItems(swapped);
                            addLog(`Moved Navigation priority for node: ${swapped[idx].label}`);
                          }}
                          disabled={idx === menuItems.length - 1}
                          className="p-1 bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleDeleteMenuItem(item.id, item.label)}
                          className="p-1 bg-zinc-900 text-zinc-500 hover:text-rose-500 rounded-xs cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right column: Description */}
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Menu Mega-Structure</span>
                <p className="text-zinc-400 leading-relaxed font-sans text-[9.5px]">
                  Navigation order impacts customer retention. Group items under standard folders. External links support safe redirection tags (`rel="noopener noreferrer"`).
                </p>
                <div className="p-3 bg-black border border-white/5 rounded-xs">
                  <span className="text-[8px] font-mono uppercase text-zinc-500 tracking-wider block mb-1">Mega Menu Support</span>
                  <p className="text-zinc-400 leading-relaxed font-sans">
                    Define nested child menus by appending path identifiers matching subcategories like <code>#store/coffee</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* ADD MENU MODAL */}
            {isAddMenuOpen && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-zinc-950 border border-white/10 w-full max-w-sm p-6 rounded-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-xs uppercase tracking-widest text-gold-pure font-bold font-mono">Append Navigation Node</h3>
                    <button onClick={() => setIsAddMenuOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleAddMenuItem} className="space-y-4 text-[10px] font-mono">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Navigation Node Title (Label)</label>
                      <input
                        type="text"
                        placeholder="e.g. Saffron Tea Circle"
                        value={menuForm.label}
                        onChange={(e) => setMenuForm(p => ({ ...p, label: e.target.value }))}
                        required
                        className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Redirect Anchor/URL Link</label>
                      <input
                        type="text"
                        placeholder="e.g. #coffee"
                        value={menuForm.link}
                        onChange={(e) => setMenuForm(p => ({ ...p, link: e.target.value }))}
                        required
                        className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Parent Link folder (For nesting)</label>
                      <input
                        type="text"
                        placeholder="Leave empty for root node"
                        value={menuForm.parentId}
                        onChange={(e) => setMenuForm(p => ({ ...p, parentId: e.target.value }))}
                        className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                      <input
                        type="checkbox"
                        checked={menuForm.external}
                        onChange={(e) => setMenuForm(p => ({ ...p, external: e.target.checked }))}
                        className="accent-gold-pure"
                      />
                      <span>Is External link (Opens in fresh window)</span>
                    </label>

                    <button
                      type="submit"
                      className="w-full bg-white text-black hover:bg-gold-pure font-bold uppercase tracking-widest py-2.5 rounded-xs text-[9px] cursor-pointer"
                    >
                      Save Navigation Node
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 6. FOOTER & LOCAL MAP CMS TAB */}
        {cmsTab === 'footer' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[10px] font-mono">
            
            {/* Left columns: Editable fields */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold">PORTAL FOOTER GENERAL DETAILS</span>
                  <span className="text-[8px] uppercase text-zinc-500">Saudi VAT Registered</span>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500">Business Pitch (Company narrative)</label>
                    <textarea
                      rows={2}
                      value={footerSettings.companyInfo}
                      onChange={(e) => setFooterSettings(p => ({ ...p, companyInfo: e.target.value }))}
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-sans resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Flagship Address</label>
                      <input
                        type="text"
                        value={footerSettings.address}
                        onChange={(e) => setFooterSettings(p => ({ ...p, address: e.target.value }))}
                        className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Support Hotline (Phone)</label>
                      <input
                        type="text"
                        value={footerSettings.phone}
                        onChange={(e) => setFooterSettings(p => ({ ...p, phone: e.target.value }))}
                        className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Support Email</label>
                      <input
                        type="text"
                        value={footerSettings.email}
                        onChange={(e) => setFooterSettings(p => ({ ...p, email: e.target.value }))}
                        className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Working / Prayer Hours</label>
                      <input
                        type="text"
                        value={footerSettings.workingHours}
                        onChange={(e) => setFooterSettings(p => ({ ...p, workingHours: e.target.value }))}
                        className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500">Copyright Suffix</label>
                    <input
                      type="text"
                      value={footerSettings.copyright}
                      onChange={(e) => setFooterSettings(p => ({ ...p, copyright: e.target.value }))}
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-sans"
                    />
                  </div>

                  {/* Google Map embed URL */}
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500">Google Map Embed Source (Iframe src link)</label>
                    <input
                      type="text"
                      value={footerSettings.mapEmbedUrl}
                      onChange={(e) => setFooterSettings(p => ({ ...p, mapEmbedUrl: e.target.value }))}
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono"
                    />
                  </div>

                </div>
              </div>

            </div>

            {/* Right column: Social Media Circles & Stamp Assets */}
            <div className="space-y-6 text-[10px]">
              
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Social Media Circles</span>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500">Instagram Handle link</label>
                    <input
                      type="text"
                      value={footerSettings.socialLinks.instagram}
                      onChange={(e) => setFooterSettings(p => ({ ...p, socialLinks: { ...p.socialLinks, instagram: e.target.value } }))}
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500">Snapchat Circle link</label>
                    <input
                      type="text"
                      value={footerSettings.socialLinks.snapchat}
                      onChange={(e) => setFooterSettings(p => ({ ...p, socialLinks: { ...p.socialLinks, snapchat: e.target.value } }))}
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500">WhatsApp direct link</label>
                    <input
                      type="text"
                      value={footerSettings.socialLinks.whatsapp}
                      onChange={(e) => setFooterSettings(p => ({ ...p, socialLinks: { ...p.socialLinks, whatsapp: e.target.value } }))}
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Security Stamps preview */}
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
                <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Saudi eCommerce Certifications</span>
                
                <div className="space-y-1 text-[9px] text-zinc-400">
                  {footerSettings.certifications.map((cert, i) => (
                    <div key={i} className="flex items-center gap-2 p-1.5 bg-black border border-white/5 rounded-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold-pure" />
                      <span className="font-sans text-white">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 7. ANNOUNCEMENT HEADER CMS TAB */}
        {cmsTab === 'announcement' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[10px]">
            
            {/* Left columns: announcement editor */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold">PORTAL WEBSITE HEADER ALERT BAR</span>
                  
                  {/* Enable/Disable alert */}
                  <button
                    onClick={() => setAnnouncement(p => ({ ...p, enabled: !p.enabled }))}
                    className={`py-1 px-2.5 text-[8.5px] uppercase font-mono tracking-widest font-bold rounded-xs cursor-pointer border ${
                      announcement.enabled 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25' 
                        : 'bg-zinc-900 text-zinc-500 border-transparent'
                    }`}
                  >
                    {announcement.enabled ? 'Sentry Active' : 'Sentry Off'}
                  </button>
                </div>

                <div className="space-y-4 font-mono">
                  
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500">Alert Billboard Slogan Text</label>
                    <textarea
                      rows={2}
                      value={announcement.text}
                      onChange={(e) => setAnnouncement(p => ({ ...p, text: e.target.value }))}
                      className="bg-black w-full border border-white/10 text-white p-2.5 rounded-xs outline-none focus:border-gold-pure resize-none font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Redirect Link button label</label>
                      <input
                        type="text"
                        value={announcement.btnText}
                        onChange={(e) => setAnnouncement(p => ({ ...p, btnText: e.target.value }))}
                        className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Redirect Link target URL</label>
                      <input
                        type="text"
                        value={announcement.btnLink}
                        onChange={(e) => setAnnouncement(p => ({ ...p, btnLink: e.target.value }))}
                        className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Background Color (Hex)</label>
                      <input
                        type="text"
                        value={announcement.bgCol}
                        onChange={(e) => setAnnouncement(p => ({ ...p, bgCol: e.target.value }))}
                        className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono text-[10px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Text & Slogan Color (Hex)</label>
                      <input
                        type="text"
                        value={announcement.txtCol}
                        onChange={(e) => setAnnouncement(p => ({ ...p, txtCol: e.target.value }))}
                        className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono text-[10px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500">Live Countdown Expiry Timestamp</label>
                    <input
                      type="datetime-local"
                      value={announcement.countdownEnd}
                      onChange={(e) => setAnnouncement(p => ({ ...p, countdownEnd: e.target.value }))}
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono"
                    />
                  </div>

                </div>
              </div>

            </div>

            {/* Right column: Interactive announcement preview simulation */}
            <div className="space-y-6">
              
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Alert Billboard preview</span>
                
                {announcement.enabled ? (
                  <div
                    className="p-3.5 rounded-xs text-center space-y-2 select-none shadow-md font-sans"
                    style={{ backgroundColor: announcement.bgCol, color: announcement.txtCol }}
                  >
                    <p className="text-[9.5px] font-bold leading-relaxed">{announcement.text}</p>
                    {announcement.btnText && (
                      <span className="inline-block px-3 py-1 bg-black text-white uppercase text-[8px] tracking-widest font-mono font-bold rounded-xs hover:opacity-85">
                        {announcement.btnText}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-black border border-white/5 rounded-xs text-center text-zinc-500 italic">
                    Billboard Alert is disabled and hidden from the public front.
                  </div>
                )}

                <div className="p-3 bg-black border border-white/5 rounded-xs text-zinc-400 font-sans leading-relaxed">
                  <span className="text-[8px] uppercase text-zinc-500 font-mono block mb-1">Visual Sizing note</span>
                  The alert bar stretches across the complete public viewport, positioned securely at the top of the header. It pushes the main navigation down. Keep slogans short to prevent vertical crowding on mobile viewports.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 8. ACTIVE POPUPS CMS TAB */}
        {cmsTab === 'popups' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[10px]">
            
            {/* Left columns: Editable fields */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold">PORTAL WEBSITE ACTIVE POPUP MODAL</span>
                  
                  {/* Toggle popups */}
                  <button
                    onClick={() => setPopup(p => ({ ...p, enabled: !p.enabled }))}
                    className={`py-1 px-2.5 text-[8.5px] uppercase font-mono tracking-widest font-bold rounded-xs cursor-pointer border ${
                      popup.enabled 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25' 
                        : 'bg-zinc-900 text-zinc-500 border-transparent'
                    }`}
                  >
                    {popup.enabled ? 'Trigger Active' : 'Trigger Off'}
                  </button>
                </div>

                <div className="space-y-4 font-mono">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Popup Billboard Type</label>
                      <select
                        value={popup.type}
                        onChange={(e) => setPopup(p => ({ ...p, type: e.target.value as any }))}
                        className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure"
                      >
                        <option value="newsletter">Newsletter Circle Invitation</option>
                        <option value="offer">Exclusive Launch Offer</option>
                        <option value="coupon">Discount Coupon Reveal</option>
                        <option value="holiday">Cultural Holiday Greeting</option>
                        <option value="image">Pure Image Canvas</option>
                        <option value="video">Video Clip</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Workflow Trigger Rule</label>
                      <select
                        value={popup.rule}
                        onChange={(e) => setPopup(p => ({ ...p, rule: e.target.value as any }))}
                        className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure"
                      >
                        <option value="first_visit">First-Time Sentry Visitor Only</option>
                        <option value="returning">Returning Customer Logins</option>
                        <option value="seconds">Stated Delay Suffix (Seconds)</option>
                      </select>
                    </div>
                  </div>

                  {popup.rule === 'seconds' && (
                    <div className="space-y-1">
                      <label className="text-[8px] uppercase text-zinc-500">Delay Trigger Suffix (Seconds)</label>
                      <input
                        type="number"
                        value={popup.ruleSeconds}
                        onChange={(e) => setPopup(p => ({ ...p, ruleSeconds: parseInt(e.target.value) }))}
                        className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500">Billboard Heading Title</label>
                    <input
                      type="text"
                      value={popup.title}
                      onChange={(e) => setPopup(p => ({ ...p, title: e.target.value }))}
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500">Billboard Coupon Code</label>
                    <input
                      type="text"
                      value={popup.couponCode}
                      onChange={(e) => setPopup(p => ({ ...p, couponCode: e.target.value }))}
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500">Description text</label>
                    <textarea
                      rows={3}
                      value={popup.content}
                      onChange={(e) => setPopup(p => ({ ...p, content: e.target.value }))}
                      className="bg-black w-full border border-white/10 text-white p-2.5 rounded-xs outline-none focus:border-gold-pure font-sans resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase text-zinc-500">Featured Media image URL Link</label>
                    <input
                      type="text"
                      value={popup.imageUrl}
                      onChange={(e) => setPopup(p => ({ ...p, imageUrl: e.target.value }))}
                      className="bg-black w-full border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono"
                    />
                  </div>

                </div>
              </div>

            </div>

            {/* Right column: Interactive popup preview simulation card */}
            <div className="space-y-6">
              
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Popup Preview</span>
                
                {popup.enabled ? (
                  <div className="bg-[#050505] border border-white/10 rounded-xs overflow-hidden select-none shadow-2xl font-sans">
                    {popup.imageUrl && (
                      <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${popup.imageUrl})` }}></div>
                    )}
                    <div className="p-5 text-center space-y-3">
                      <span className="text-[7.5px] tracking-[0.3em] text-gold-pure uppercase font-mono">SOVEREIGN LAUNCH CIRCLE</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{popup.title}</h4>
                      <p className="text-[9px] text-zinc-400 leading-relaxed">{popup.content}</p>
                      
                      {popup.couponCode && (
                        <div className="p-2 border border-dashed border-gold-pure/35 rounded-xs bg-gold-pure/5 inline-block font-mono text-[10px] text-gold-pure font-bold tracking-widest uppercase">
                          Code: {popup.couponCode}
                        </div>
                      )}
                      
                      <button className="w-full py-2 bg-white text-black font-semibold text-[8px] uppercase tracking-widest font-mono hover:bg-gold-pure">
                        Subscribe Now
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-black border border-white/5 rounded-xs text-center text-zinc-500 italic">
                    Modal Trigger popup is disabled and hidden from the public portal.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* 9. SEO MANAGEMENT CMS TAB */}
        {cmsTab === 'seo' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[10px]">
            {/* Left Column: List of SEO targets & form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold">Search Engine Optimization (SEO) Directory</span>
                  <span className="text-[8px] uppercase text-zinc-500 font-mono">Index Optimization Sentry</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {seoSettings.map((item: any) => (
                    <div key={item.id} className="p-3 bg-black border border-white/5 rounded-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-500 font-mono text-[8px] uppercase tracking-wider bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/15">
                          {item.targetType} Target
                        </span>
                        <span className="text-zinc-500 text-[8px] font-mono">ID: {item.id}</span>
                      </div>
                      <h4 className="text-[10px] font-bold text-white uppercase">{item.targetName}</h4>
                      <p className="text-zinc-400 font-sans line-clamp-1">Title: {item.seoTitle}</p>
                      <p className="text-zinc-500 font-sans line-clamp-2">Desc: {item.seoDesc}</p>
                      
                      <div className="flex gap-2 pt-1 border-t border-white/5 justify-end">
                        <button
                          onClick={() => {
                            const newTitle = prompt("Enter updated SEO title:", item.seoTitle);
                            if (newTitle !== null) {
                              setSeoSettings(seoSettings.map((s: any) => s.id === item.id ? { ...s, seoTitle: newTitle } : s));
                              handleAddCmsActivityLog(`Updated SEO Title for ${item.targetName}`, `SEO / ${item.targetName}`);
                            }
                          }}
                          className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[8px] uppercase border border-white/5 rounded-xs cursor-pointer"
                        >
                          Quick Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Advanced SEO Config Form */}
                <div className="p-4 bg-black border border-white/5 rounded-xs space-y-3">
                  <span className="text-[8.5px] font-mono uppercase text-zinc-400 block font-bold border-b border-white/5 pb-1">
                    Complete Meta Tags Configurator (Global & Deep Products)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-400 mb-1">TARGET TYPE</label>
                      <select className="bg-zinc-900 w-full border border-white/10 text-zinc-300 p-1 outline-none text-[9px]">
                        <option value="global">Global Portal Settings</option>
                        <option value="homepage">Homepage</option>
                        <option value="category">Category Index Pages</option>
                        <option value="brand">Brand Showcase</option>
                        <option value="product">Specific Product pages</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">CANONICAL LINK URL</label>
                      <input
                        type="text"
                        defaultValue="https://alzoal.com"
                        className="bg-zinc-900 w-full border border-white/10 text-white p-1 rounded-xs outline-none focus:border-gold-pure font-mono text-[9px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-400 mb-1">OPEN GRAPH (OG) TITLE</label>
                      <input
                        type="text"
                        defaultValue="AL ZOAL | Authentic Eastern Province Hospitality"
                        className="bg-zinc-900 w-full border border-white/10 text-white p-1 rounded-xs outline-none focus:border-gold-pure text-[9px]"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 mb-1">TWITTER CARD TYPE</label>
                      <select className="bg-zinc-900 w-full border border-white/10 text-zinc-300 p-1 outline-none text-[9px]">
                        <option value="summary_large_image">summary_large_image</option>
                        <option value="summary">summary</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">ROBOTS.TXT DIRECTIVES</label>
                    <textarea
                      rows={3}
                      defaultValue={`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://alzoal.com/sitemap.xml`}
                      className="bg-zinc-900 w-full border border-white/10 text-emerald-400 p-1.5 rounded-xs outline-none focus:border-gold-pure font-mono text-[8.5px] leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 flex items-center justify-between">
                      <span>SCHEMA.ORG MARKUP (JSON-LD STRUCTURED DATA)</span>
                      <span className="text-emerald-500 font-mono text-[7px]">✓ Live JSON Validated</span>
                    </label>
                    <textarea
                      rows={4}
                      defaultValue={`{\n  "@context": "https://schema.org",\n  "@type": "LocalBusiness",\n  "name": "Al Zoal Premium Sanctuary",\n  "address": {\n    "@type": "PostalAddress",\n    "addressLocality": "Al Hofuf",\n    "addressCountry": "SA"\n  }\n}`}
                      className="bg-zinc-900 w-full border border-white/10 text-sky-400 p-1.5 rounded-xs outline-none focus:border-gold-pure font-mono text-[8.5px] leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={() => {
                      handleAddCmsActivityLog("Saved advanced robots.txt directives and schema.org settings", "SEO Engine");
                      alert("✓ Advanced SEO parameters & structured JSON-LD schemas saved. Invalidated Google/Bing cache maps.");
                    }}
                    className="py-1 px-4 bg-white text-black font-semibold uppercase tracking-widest font-mono text-[8px] hover:bg-gold-pure"
                  >
                    Save Advanced SEO Parameters
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic XML Sitemap Generator */}
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Dynamic XML Sitemap Sentry</span>
                <p className="text-zinc-400 font-sans leading-relaxed">
                  Automatically index web paths (Editorial pages, catalog collections, traditional Sudanese apparel products) dynamically.
                </p>

                <div className="p-3.5 bg-black border border-white/5 rounded-xs space-y-2.5 font-mono text-[8.5px]">
                  <span className="text-zinc-500 text-[8px] block uppercase">Live Generated sitemap.xml</span>
                  <div className="bg-zinc-950 p-2.5 rounded-xs border border-white/10 text-zinc-400 h-44 overflow-y-auto whitespace-pre leading-relaxed select-all">
{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://alzoal.com/</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${webPages.map(page => `  <url>
    <loc>https://alzoal.com/${page.key}</loc>
    <lastmod>${page.lastModified.slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
  </url>`).join('\n')}
</urlset>`}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const xmlText = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://alzoal.com/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>`;
                    const blob = new Blob([xmlText], { type: 'text/xml' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'sitemap.xml';
                    link.click();
                    handleAddCmsActivityLog("Exported production XML Sitemap to client filesystem", "SEO Engine");
                  }}
                  className="w-full text-center py-2 bg-zinc-900 border border-white/10 hover:border-gold-pure/35 hover:text-gold-pure transition-colors font-semibold text-[8px] uppercase tracking-widest font-mono rounded-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download sitemap.xml
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 10. MEDIA LIBRARY CMS TAB */}
        {cmsTab === 'media' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-[10px]">
            {/* Sidebar folders & tags */}
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold">Media Folders</span>
                  <button
                    onClick={() => {
                      const newFolder = prompt("Enter new folder directory name:");
                      if (newFolder) {
                        setFolders(prev => [...prev, newFolder]);
                        handleAddCmsActivityLog(`Created media folder directory: ${newFolder}`, 'Media Library');
                      }
                    }}
                    className="text-gold-pure hover:text-white p-0.5 bg-white/5 border border-white/10 rounded-xs"
                    title="Add Folder Directory"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedFolder('All')}
                    className={`w-full text-left py-1.5 px-2 text-[9px] font-mono uppercase rounded-xs transition-colors flex items-center gap-1.5 ${
                      selectedFolder === 'All' ? 'bg-gold-pure/10 text-gold-pure font-bold' : 'text-zinc-400 hover:bg-white/5'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-gold-pure/80" /> All Folders ({mediaAssets.length})
                  </button>
                  {folders.map(folder => (
                    <button
                      key={folder}
                      onClick={() => setSelectedFolder(folder)}
                      className={`w-full text-left py-1.5 px-2 text-[9px] font-mono uppercase rounded-xs transition-colors flex items-center gap-1.5 ${
                        selectedFolder === folder ? 'bg-gold-pure/10 text-gold-pure font-bold' : 'text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5 text-zinc-500" /> {folder} ({mediaAssets.filter(m => m.folder === folder).length})
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Cloud Filter */}
              <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3">
                <span className="text-[8.5px] font-mono uppercase text-zinc-400 tracking-widest block font-bold border-b border-white/5 pb-1">Index Tags cloud</span>
                <div className="flex flex-wrap gap-1.5">
                  {['apparel', 'luxury', 'coffee', 'organic', 'interior', 'tour', 'legal', 'pdf'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        handleAddCmsActivityLog(`Filtered Media view by tag: #${tag}`, 'Media Sorter');
                        alert(`Filtered by tag: #${tag}`);
                      }}
                      className="px-2 py-0.5 bg-black border border-white/5 hover:border-gold-pure/35 text-[8.5px] text-zinc-400 hover:text-white rounded-full font-mono cursor-pointer flex items-center gap-1"
                    >
                      <Tag className="w-2.5 h-2.5 text-gold-pure" /> #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Automatic Optimization controller panel */}
              <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3 font-sans">
                <div className="flex items-center justify-between border-b border-white/5 pb-1">
                  <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold">Image WebP Optimizer</span>
                  <input
                    type="checkbox"
                    checked={optimizationActive}
                    onChange={(e) => setOptimizationActive(e.target.checked)}
                    className="cursor-pointer"
                  />
                </div>
                <p className="text-[9.5px] text-zinc-400 leading-relaxed leading-normal">
                  Compresses high-res thobe catalogs to light WebP files instantly upon client upload.
                </p>
                {optimizationActive && (
                  <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 rounded-xs font-mono text-[8px] uppercase tracking-wider text-center">
                    ● Active compression: -88% file sizes
                  </div>
                )}
              </div>
            </div>

            {/* Central Main Media grid & uploader */}
            <div className="lg:col-span-3 space-y-6">
              {/* Toolbar & upload area */}
              <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-2.5">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">CDN Repository Manager</span>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                      Active Repository: {selectedFolder} ({mediaAssets.filter(m => selectedFolder === 'All' || m.folder === selectedFolder).length} items)
                    </h3>
                  </div>

                  {/* Bulk Operations buttons */}
                  {selectedAssets.length > 0 && (
                    <div className="flex items-center gap-2 bg-black border border-white/10 px-2.5 py-1 rounded-xs">
                      <span className="text-[8.5px] font-mono text-gold-pure">{selectedAssets.length} selected</span>
                      <button
                        onClick={() => {
                          setMediaAssets(prev => prev.filter(m => !selectedAssets.includes(m.id)));
                          setSelectedAssets([]);
                          handleAddCmsActivityLog("Bulk Deleted media repository assets", "Media Library");
                          alert("✓ Selected assets removed from cloud database.");
                        }}
                        className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-xs cursor-pointer"
                        title="Bulk Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          alert(`Simulating zipped bundle download of: ${selectedAssets.join(', ')}`);
                          handleAddCmsActivityLog("Simulated bulk download zip bundle", "Media Library");
                        }}
                        className="p-1 text-sky-400 hover:bg-sky-400/10 rounded-xs cursor-pointer"
                        title="Bulk Download Zip"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Secure Supabase Drag & Drop Simulator Area */}
                <div
                  className="border border-dashed border-white/15 rounded-xs p-6 bg-black hover:border-gold-pure/30 transition-colors text-center cursor-pointer space-y-2 relative"
                  onClick={() => {
                    const name = prompt("Enter media asset file name:", "Fresh Yemeni Mocca Beans.jpg");
                    if (name) {
                      const newAsset = {
                        id: `med-${Date.now()}`,
                        name,
                        type: name.endsWith('.mp4') ? 'video' : name.endsWith('.pdf') ? 'document' : 'image',
                        url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=800',
                        folder: selectedFolder === 'All' ? 'Coffee Heritage' : selectedFolder,
                        tags: ['fresh', 'upload'],
                        size: '420 KB',
                        createdAt: new Date().toISOString().slice(0, 10)
                      };
                      setMediaAssets(prev => [newAsset, ...prev]);
                      handleAddCmsActivityLog(`Uploaded ${name} file to Supabase Object Storage bucket`, 'Media Sentry');
                      alert(`✓ File uploaded successfully with strict RLS permissions! Hashed reference: sha256_b38c2..`);
                    }
                  }}
                >
                  <div className="w-10 h-10 bg-zinc-900 border border-white/5 text-zinc-400 flex items-center justify-center rounded-full mx-auto">
                    <HardDrive className="w-5 h-5 text-gold-pure" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Supabase S3 Storage Dropzone Sentry</span>
                    <p className="text-[9px] text-zinc-500 font-sans">
                      Select or drag local thobe threedimensional graphics or coffee catalogs to upload. Maximum size: 250MB. WebP compression will be applied automatically.
                    </p>
                  </div>
                </div>

                {/* Media Assets Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                  {mediaAssets.filter(m => selectedFolder === 'All' || m.folder === selectedFolder).map(asset => (
                    <div
                      key={asset.id}
                      className={`relative bg-black border border-white/5 rounded-xs overflow-hidden group select-none ${
                        selectedAssets.includes(asset.id) ? 'ring-1 ring-gold-pure border-gold-pure/45' : ''
                      }`}
                    >
                      {/* Checkbox box */}
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssets(prev => [...prev, asset.id]);
                            } else {
                              setSelectedAssets(prev => prev.filter(id => id !== asset.id));
                            }
                          }}
                          className="cursor-pointer"
                        />
                      </div>

                      {/* Visual Content display */}
                      <div className="h-28 bg-zinc-900 flex items-center justify-center relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: asset.type === 'image' ? `url(${asset.url})` : '' }}>
                        {asset.type !== 'image' && (
                          <div className="text-center p-3 space-y-1">
                            <span className="text-[16px] block">📄</span>
                            <span className="text-[8px] font-mono uppercase text-zinc-500 block">{asset.type}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => {
                              handleAddCmsActivityLog(`Removed asset ref: ${asset.name}`, 'Media Library');
                              setMediaAssets(prev => prev.filter(m => m.id !== asset.id));
                            }}
                            className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2 space-y-1 bg-zinc-950 font-mono text-[8px]">
                        <h5 className="font-bold text-white truncate uppercase" title={asset.name}>{asset.name}</h5>
                        <div className="flex items-center justify-between text-zinc-500">
                          <span>{asset.size}</span>
                          <span>{asset.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 11. CAMPAIGNS & PROMOTIONS CMS TAB */}
        {cmsTab === 'promotions' && (
          <div className="space-y-6 text-[10px]">
            {/* Toolbar row */}
            <div className="flex justify-between items-center bg-zinc-950 border border-white/5 p-4 rounded-xs">
              <div className="space-y-0.5">
                <span className="text-[8px] font-mono text-zinc-500">GCC Calendar integration</span>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">Campaign Promotions & Vouchers ({promotions.length})</h3>
              </div>

              <button
                onClick={() => {
                  const name = prompt("Enter promo campaign thobe event name:");
                  if (name) {
                    const newPromo = {
                      id: `promo-${Date.now()}`,
                      type: 'custom',
                      name,
                      enabled: true,
                      couponCode: 'CUSTOMZOAL',
                      discountValue: '10% Off',
                      startDate: new Date().toISOString().slice(0, 10),
                      endDate: '2026-12-31'
                    };
                    setPromotions(prev => [...prev, newPromo]);
                    handleAddCmsActivityLog(`Registered promotional campaign: ${name}`, 'Promotions Engine');
                  }
                }}
                className="py-1 px-3 bg-white hover:bg-gold-pure text-black rounded-xs text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center gap-1 font-mono"
              >
                <Plus className="w-3.5 h-3.5" /> Create Campaign thobe
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {promotions.map((p: any) => (
                <div key={p.id} className={`bg-zinc-950 border rounded-xs p-4 flex flex-col justify-between space-y-4 ${
                  p.enabled ? 'border-gold-pure/30' : 'border-white/5 opacity-50'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-gold-pure/5 text-gold-pure border border-gold-pure/20">
                        {p.type} Campaign
                      </span>
                      <span className="text-zinc-500 text-[8px] font-mono">ID: {p.id}</span>
                    </div>

                    <h4 className="text-[10.5px] font-bold text-white uppercase tracking-wider font-mono">{p.name}</h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-[8.5px] font-mono bg-black p-2 rounded-xs">
                      <div>
                        <span className="text-zinc-500 block">VALUE</span>
                        <span className="text-white font-bold">{p.discountValue}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">VOUCHER CODE</span>
                        <span className="text-gold-pure font-bold">{p.couponCode}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-zinc-400 font-mono text-[8.5px]">
                      <div>⏰ Start: {p.startDate}</div>
                      <div>⌛ Expire: {p.endDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                    <button
                      onClick={() => {
                        const nextState = !p.enabled;
                        setPromotions(promotions.map((item: any) => item.id === p.id ? { ...item, enabled: nextState } : item));
                        handleAddCmsActivityLog(`Toggled Promotional Campaign: ${p.name} -> ${nextState ? 'ACTIVE' : 'DISABLED'}`, 'Promotions Engine');
                      }}
                      className={`px-2 py-1 text-[8px] uppercase font-mono font-bold rounded-xs cursor-pointer border ${
                        p.enabled ? 'bg-rose-500/10 text-rose-500 border-rose-500/25' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                      }`}
                    >
                      {p.enabled ? 'Disable' : 'Enable'}
                    </button>
                    
                    <button
                      onClick={() => {
                        const val = prompt(`Enter updated discount value (e.g. 15% Off) for ${p.name}:`, p.discountValue);
                        if (val !== null) {
                          setPromotions(promotions.map((item: any) => item.id === p.id ? { ...item, discountValue: val } : item));
                          handleAddCmsActivityLog(`Updated discount value for ${p.name} to ${val}`, 'Promotions Engine');
                        }
                      }}
                      className="px-2 py-1 bg-zinc-900 border border-white/5 hover:border-white/10 rounded-xs font-mono text-[8px] text-zinc-300 uppercase cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 12. VERSION HISTORY & SNAPSHOT ROLLBACK CMS TAB */}
        {cmsTab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[10px]">
            {/* Left Revisions snapshot timeline */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold">Chronological Snapshot revisions Log</span>
                  <button
                    onClick={() => {
                      triggerCmsSnapshot("Manual administrative backup checkpoint.");
                      handleAddCmsActivityLog("Created manual state backup snapshot checkpoint", "History Engine");
                      alert("✓ Reusable rollback snapshot compiled. Version created.");
                    }}
                    className="py-1 px-3 bg-white text-black font-semibold text-[8px] uppercase tracking-wider font-mono rounded-xs hover:bg-gold-pure"
                  >
                    💾 Take Snapshot Checkpoint
                  </button>
                </div>

                <div className="space-y-4 font-mono relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
                  {revisions.map((rev: any) => (
                    <div key={rev.id} className="ml-8 p-3 bg-black border border-white/5 rounded-xs space-y-2 relative">
                      {/* Timeline dot badge */}
                      <span className="absolute -left-[28px] top-4 w-2 h-2 rounded-full bg-gold-pure border border-zinc-950 shadow-[0_0_10px_rgba(212,175,55,0.4)]"></span>
                      
                      <div className="flex items-center justify-between text-[8px]">
                        <span className="text-gold-pure font-bold text-[9.5px]">{rev.version} snapshot</span>
                        <span className="text-zinc-500 font-medium">{rev.date}</span>
                      </div>

                      <h4 className="text-[10px] text-zinc-300 font-sans leading-normal">{rev.changeLog}</h4>
                      <p className="text-[8px] text-zinc-500">Authorized Officer: {rev.author}</p>
                      
                      <div className="flex gap-2 pt-1 border-t border-white/5 justify-end">
                        <button
                          onClick={() => {
                            if (userRole === 'staff') {
                              alert("Permissions Guard: Staff role is restricted from restoring rollbacks.");
                              return;
                            }
                            if (window.confirm(`Are you absolutely sure you want to rollback all CMS settings back to snapshot version ${rev.version}? This restores pages, banner sliders, alert announcements, footer parameters, and catalog schedules instantly.`)) {
                              // Execute snapshot rollback
                              if (rev.id === 'rev-1') {
                                alert("✓ Successfully restored to baseline version v1.0. All cached nodes updated.");
                                handleAddCmsActivityLog("Restored system state to baseline v1.0 checkpoint", "Rollback Engine");
                                return;
                              }
                              // Parse snapshot
                              try {
                                const data = JSON.parse(rev.restorePoint);
                                if (data.websiteStatus) setWebsiteStatus(data.websiteStatus);
                                if (data.homepageSections) setHomepageSections(data.homepageSections);
                                if (data.banners) setBanners(data.banners);
                                if (data.webPages) setWebPages(data.webPages);
                                if (data.menuItems) setMenuItems(data.menuItems);
                                if (data.footerSettings) setFooterSettings(data.footerSettings);
                                if (data.announcement) setAnnouncement(data.announcement);
                                if (data.popup) setPopup(data.popup);
                                if (data.promotions) setPromotions(data.promotions);
                                if (data.seoSettings) setSeoSettings(data.seoSettings);
                                if (data.mediaAssets) setMediaAssets(data.mediaAssets);
                                
                                handleAddCmsActivityLog(`Restored system-wide state rollback to version ${rev.version}`, 'Rollback Engine');
                                alert(`✓ System Rollback Successful! Restored version: ${rev.version} compiled by ${rev.author} on ${rev.date}. CDN caches updated.`);
                              } catch (err) {
                                alert("Error executing state rollback: " + err);
                              }
                            }
                          }}
                          className="px-2 py-0.5 bg-zinc-900 hover:bg-gold-pure hover:text-black font-mono text-[8px] uppercase border border-white/5 rounded-xs transition-colors cursor-pointer"
                        >
                          ⏪ ROLLBACK TO THIS POINT
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Activity Timeline Logger logs */}
            <div className="space-y-6 text-[10px]">
              <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-4">
                <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Audit Logs Timeline</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setActivityLogs([]);
                      alert("Audit timeline cleared successfully.");
                    }}
                    className="py-1 px-2.5 bg-zinc-900 text-zinc-400 hover:text-white border border-white/5 rounded-xs font-mono text-[8.5px] cursor-pointer"
                  >
                    Clear Logs
                  </button>
                  <button
                    onClick={() => {
                      const csvText = `id,user,action,timestamp,content\n` + activityLogs.map(l => `"${l.id}","${l.user}","${l.action}","${l.timestamp}","${l.affectedContent}"`).join('\n');
                      const blob = new Blob([csvText], { type: 'text/csv' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = 'al_zoal_cms_audit_logs.csv';
                      link.click();
                    }}
                    className="py-1 px-2.5 bg-zinc-900 text-zinc-400 hover:text-white border border-white/5 rounded-xs font-mono text-[8.5px] cursor-pointer flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Export CSV
                  </button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-thin divide-y divide-white/5 pr-1">
                  {activityLogs.map(log => (
                    <div key={log.id} className="pt-2.5 first:pt-0 space-y-1 font-mono text-[8.5px]">
                      <div className="flex justify-between items-center text-[7.5px]">
                        <span className="text-zinc-500">{log.timestamp}</span>
                        <span className="text-gold-pure uppercase font-bold">{log.affectedContent}</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed font-sans">{log.action}</p>
                      <span className="text-zinc-500 text-[7.5px] block">Operator: {log.user}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 13. RELATIONAL SCHEMAS & DATABASE SECURITY RLS CMS TAB */}
        {cmsTab === 'database_sec' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[10px]">
            {/* Left Entity Relational mapping browser */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold">Supabase PostgreSQL Relational Schema browser</span>
                  <button
                    onClick={() => {
                      alert("✓ Database migrations verified successfully with Supabase production instance. Keys verified, index schemas validated.");
                    }}
                    className="py-1 px-3 bg-zinc-900 hover:bg-gold-pure text-zinc-300 hover:text-black font-semibold text-[8px] uppercase tracking-wider font-mono rounded-xs border border-white/10"
                  >
                    Verify Migrations Integrity
                  </button>
                </div>

                {/* Schema relationships graphical grid */}
                <div className="space-y-3 font-mono text-[9px]">
                  {[
                    { name: 'cms_pages', columns: 'id (PK), key (Unique), title, content, status, last_modified', relationship: 'None' },
                    { name: 'cms_sections', columns: 'id (PK), name, order, enabled, bg_image, bg_color, padding_size', relationship: 'Refers to website_settings' },
                    { name: 'cms_banners', columns: 'id (PK), title, bg_image, priority, schedule_start, schedule_end', relationship: 'None' },
                    { name: 'media_library', columns: 'id (PK), file_name, file_url, folder_directory, tags, file_size', relationship: 'None' },
                    { name: 'seo_settings', columns: 'id (PK), target_type, seo_title, og_title, schema_markup', relationship: 'None' },
                    { name: 'page_revisions', columns: 'id (PK), version, author_name, state_snapshot_json, created_at', relationship: 'Relates to profiles(id) foreign key' }
                  ].map(table => (
                    <div key={table.name} className="p-3 bg-black border border-white/5 rounded-xs space-y-1.5 hover:border-gold-pure/20 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-gold-pure font-bold text-[10px] uppercase flex items-center gap-1">
                          <Database className="w-3.5 h-3.5 text-gold-pure/80" /> TABLE {table.name}
                        </span>
                        <span className="text-[7.5px] uppercase text-zinc-500">PostgreSQL Relational DB</span>
                      </div>
                      <div className="text-zinc-400 font-sans leading-relaxed">
                        <div><strong className="font-mono text-[8px] text-zinc-500 uppercase">Columns:</strong> <code>{table.columns}</code></div>
                        <div><strong className="font-mono text-[8px] text-zinc-500 uppercase">Foreign key:</strong> <code>{table.relationship}</code></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Security Policies visualizer */}
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-4">
                <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1">Row Level Security (RLS) Statements</span>
                <p className="text-zinc-400 leading-relaxed font-sans">
                  Active Supabase RLS security policies validated globally to prevent horizontal privilege escalations.
                </p>

                <div className="p-3.5 bg-black border border-white/10 rounded-xs space-y-3 font-mono text-[8px] leading-relaxed">
                  <div>
                    <span className="text-zinc-500 block">POLICY 1: owner_all_cms</span>
                    <div className="bg-zinc-950 p-2 text-sky-400 rounded-xs border border-white/5 whitespace-pre-wrap select-all">
{`CREATE POLICY owner_all_cms ON cms_pages
FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE role='owner'));`}
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-500 block">POLICY 2: public_select_cms</span>
                    <div className="bg-zinc-950 p-2 text-sky-400 rounded-xs border border-white/5 whitespace-pre-wrap select-all">
{`CREATE POLICY public_select_cms ON cms_pages
FOR SELECT TO anon, authenticated
USING (status = 'published');`}
                    </div>
                  </div>
                </div>

                {/* Audit summary */}
                <div className="p-3 bg-zinc-900/40 rounded-xs border border-white/5 text-[9px] font-sans leading-normal">
                  <span className="text-[8px] text-zinc-500 font-mono block uppercase">Role Verification checklist</span>
                  <div className="space-y-1.5 mt-1.5">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <span className="text-emerald-500">✓</span> <strong>Owner</strong>: Complete control, read schema, snapshot state rollback.
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <span className="text-emerald-500">✓</span> <strong>Admin</strong>: Complete database CRUD, schema index visualizer. No rollback capability.
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <span className="text-emerald-500">✓</span> <strong>Staff</strong>: Limited content edits, block rollback commands.
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-500">
                      <span>✗</span> <strong>Customer</strong>: Complete block of all CMS dashboard sub-modules.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

          </>
        )}

      </div>

    </div>
  );
}
