import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Filter, Trash2, Edit, Copy, RotateCcw, Archive, Check, X, 
  Globe, Image as ImageIcon, Video, Link, Mail, Phone, ExternalLink, RefreshCw, 
  FileSpreadsheet, Eye, EyeOff, LayoutDashboard, Sliders, Settings, Tag, 
  ArrowUpDown, ChevronDown, CheckSquare, Square, Download, Upload, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

export interface Brand {
  id: string;
  name: string;             // English name
  nameAr?: string;           // Arabic name
  slug: string;              // URL slug
  logoUrl: string;           // Brand logo
  coverBannerUrl?: string;   // Brand cover banner
  description: string;       // Short description
  country: string;           // Origin Country
  website?: string;          // Official website
  supportEmail?: string;     // Support contact email
  supportPhone?: string;     // Support contact phone
  brandStory?: string;       // In-depth brand story
  featuredToggle: boolean;   // Featured display on homepage
  status: 'Published' | 'Draft' | 'Hidden' | 'Archived' | 'Scheduled'; // Brand status
  // Brand SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  openGraphImage?: string;
  structuredData?: string;   // JSON string
  // Media items
  galleryImages?: string[];  // Multiple carousel images
  brandVideos?: string[];    // Future-ready videos
  createdAt: string;
}

interface BrandManagementProps {
  brands: Brand[];
  setBrands: React.Dispatch<React.SetStateAction<Brand[]>>;
  allProducts: Product[];
  addLog: (action: string, target?: string) => void;
}

const COUNTRY_PRESETS = [
  'Saudi Arabia', 'Sudan', 'Yemen', 'Ethiopia', 'Italy', 'United Kingdom', 'United Arab Emirates', 'France'
];

const PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=200'
];

const PRESET_BANNERS = [
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200'
];

export const BrandManagement: React.FC<BrandManagementProps> = ({
  brands,
  setBrands,
  allProducts,
  addLog
}) => {
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'productsCount' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Multi-select for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal / Side drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Active Lang tab inside form to switch English/Arabic
  const [formLang, setFormLang] = useState<'en' | 'ar'>('en');

  // Form Field states
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverBannerUrl, setCoverBannerUrl] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [country, setCountry] = useState('Saudi Arabia');
  const [website, setWebsite] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [brandStory, setBrandStory] = useState('');
  const [brandStoryAr, setBrandStoryAr] = useState('');
  const [featuredToggle, setFeaturedToggle] = useState(false);
  const [status, setStatus] = useState<Brand['status']>('Published');

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [openGraphImage, setOpenGraphImage] = useState('');
  const [structuredData, setStructuredData] = useState('');

  // Media Gallery & Videos
  const [galleryInput, setGalleryInput] = useState('');
  const [videoInput, setVideoInput] = useState('');

  // Optimization simulation state
  const [optimizing, setOptimizing] = useState(false);
  const [optimizingProgress, setOptimizingProgress] = useState(0);
  const [optimizingStep, setOptimizingStep] = useState('');

  // Load active simulation role from localStorage
  const [activeRole, setActiveRole] = useState<'admin' | 'staff' | 'customer'>(() => {
    return (localStorage.getItem('zoal_active_simulation_role') as any) || 'admin';
  });

  useEffect(() => {
    const handleRoleSync = () => {
      const currentRole = (localStorage.getItem('zoal_active_simulation_role') as any) || 'admin';
      setActiveRole(currentRole);
    };
    window.addEventListener('zoal_simulation_role_changed', handleRoleSync);
    return () => window.removeEventListener('zoal_simulation_role_changed', handleRoleSync);
  }, []);

  // Compute products count per brand dynamically
  const productsCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    allProducts.forEach(p => {
      const bName = p.brand || 'AL ZOAL Specialty Roasters';
      map[bName] = (map[bName] || 0) + 1;
    });
    return map;
  }, [allProducts]);

  // Sync slug on English name change
  useEffect(() => {
    if (!editingBrand) {
      setSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  }, [name, editingBrand]);

  // Load brand into form for editing
  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setNameAr(brand.nameAr || '');
    setSlug(brand.slug);
    setLogoUrl(brand.logoUrl);
    setCoverBannerUrl(brand.coverBannerUrl || '');
    setDescription(brand.description);
    setDescriptionAr((brand as any).descriptionAr || '');
    setCountry(brand.country);
    setWebsite(brand.website || '');
    setSupportEmail(brand.supportEmail || '');
    setSupportPhone(brand.supportPhone || '');
    setBrandStory(brand.brandStory || '');
    setBrandStoryAr((brand as any).brandStoryAr || '');
    setFeaturedToggle(brand.featuredToggle);
    setStatus(brand.status);

    // SEO
    setSeoTitle(brand.seoTitle || '');
    setSeoDescription(brand.seoDescription || '');
    setSeoKeywords(brand.seoKeywords || '');
    setCanonicalUrl(brand.canonicalUrl || '');
    setOpenGraphImage(brand.openGraphImage || '');
    setStructuredData(brand.structuredData || '');

    // Media
    setGalleryInput(brand.galleryImages?.join(', ') || '');
    setVideoInput(brand.brandVideos?.join(', ') || '');

    setFormLang('en');
    setIsFormOpen(true);
  };

  // Reset form fields
  const handleOpenCreate = () => {
    setEditingBrand(null);
    setName('');
    setNameAr('');
    setSlug('');
    setLogoUrl(PRESET_LOGOS[0]);
    setCoverBannerUrl(PRESET_BANNERS[0]);
    setDescription('');
    setDescriptionAr('');
    setCountry('Saudi Arabia');
    setWebsite('');
    setSupportEmail('');
    setSupportPhone('');
    setBrandStory('');
    setBrandStoryAr('');
    setFeaturedToggle(false);
    setStatus('Published');

    // SEO
    setSeoTitle('');
    setSeoDescription('');
    setSeoKeywords('');
    setCanonicalUrl('');
    setOpenGraphImage('');
    setStructuredData('{\n  "@context": "https://schema.org",\n  "@type": "Brand"\n}');

    // Media
    setGalleryInput('');
    setVideoInput('');

    setFormLang('en');
    setIsFormOpen(true);
  };

  // Save brand
  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRole === 'customer') {
      alert('Permission Denied: Read-only Website Access. Customers cannot register or modify brands.');
      return;
    }

    if (!name || !slug) {
      alert('Brand Name (English) and Slug are required fields.');
      return;
    }

    // Duplicate Name validation
    const duplicateName = brands.some(b => b.name.toLowerCase() === name.toLowerCase() && (!editingBrand || b.id !== editingBrand.id));
    if (duplicateName) {
      alert(`Duplicate Brand Name Error: A brand named "${name}" already exists.`);
      return;
    }

    // Duplicate Slug validation
    const duplicateSlug = brands.some(b => b.slug.toLowerCase() === slug.toLowerCase() && (!editingBrand || b.id !== editingBrand.id));
    if (duplicateSlug) {
      alert(`Duplicate Slug Error: The brand slug "${slug}" is already in use.`);
      return;
    }

    const galleryImages = galleryInput ? galleryInput.split(',').map(s => s.trim()).filter(Boolean) : [];
    const brandVideos = videoInput ? videoInput.split(',').map(s => s.trim()).filter(Boolean) : [];

    const brandData: any = {
      id: editingBrand ? editingBrand.id : `brand-${Date.now()}`,
      name,
      nameAr,
      slug,
      logoUrl,
      coverBannerUrl,
      description,
      descriptionAr,
      country,
      website,
      supportEmail,
      supportPhone,
      brandStory,
      brandStoryAr,
      featuredToggle,
      status,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      openGraphImage,
      structuredData,
      galleryImages,
      brandVideos,
      createdAt: editingBrand ? editingBrand.createdAt : new Date().toISOString()
    };

    if (editingBrand) {
      setBrands(prev => prev.map(b => b.id === editingBrand.id ? brandData : b));
      addLog(`Updated Luxury Brand: ${name}`, `ID: ${editingBrand.id}`);
    } else {
      setBrands(prev => [...prev, brandData]);
      addLog(`Registered Luxury Brand: ${name}`, `Slug: ${slug}`);
    }

    setIsFormOpen(false);
  };

  // Delete a brand
  const handleDelete = (id: string, brandName: string) => {
    if (activeRole === 'customer') {
      alert('Permission Denied: Read-only Website Access. Customers cannot delete brands.');
      return;
    }
    if (activeRole === 'staff') {
      alert('Permission Denied: Staff level users are restricted from deleting luxury brands.');
      return;
    }
    if (!window.confirm(`Are you absolutely sure you want to delete the premium brand "${brandName}"? This action maintains relational references but erases the primary portfolio registration.`)) return;
    setBrands(prev => prev.filter(b => b.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
    addLog(`Deleted Luxury Brand: ${brandName}`, `ID: ${id}`);
  };

  // Duplicate a brand
  const handleDuplicate = (brand: Brand) => {
    const duplicated: Brand = {
      ...brand,
      id: `brand-${Date.now()}`,
      name: `${brand.name} (Copy)`,
      nameAr: brand.nameAr ? `${brand.nameAr} (نسخة)` : '',
      slug: `${brand.slug}-copy`,
      createdAt: new Date().toISOString()
    };
    setBrands(prev => [...prev, duplicated]);
    addLog(`Duplicated Brand Portfolio: ${brand.name}`, `New Slug: ${duplicated.slug}`);
  };

  // Archive a brand
  const handleArchive = (id: string, brandName: string) => {
    setBrands(prev => prev.map(b => b.id === id ? { ...b, status: 'Archived' } : b));
    addLog(`Archived Brand: ${brandName}`, `Status shifted to Archived`);
  };

  // Restore a brand
  const handleRestore = (id: string, brandName: string) => {
    setBrands(prev => prev.map(b => b.id === id ? { ...b, status: 'Published' } : b));
    addLog(`Restored Brand: ${brandName}`, `Status shifted back to Published`);
  };

  // Bulk Actions
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBrands.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBrands.map(b => b.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkPublish = () => {
    if (selectedIds.length === 0) return;
    setBrands(prev => prev.map(b => selectedIds.includes(b.id) ? { ...b, status: 'Published' } : b));
    addLog(`Bulk Published ${selectedIds.length} Brands`);
    setSelectedIds([]);
    alert(`Successfully published ${selectedIds.length} premium brands.`);
  };

  const handleBulkHide = () => {
    if (selectedIds.length === 0) return;
    setBrands(prev => prev.map(b => selectedIds.includes(b.id) ? { ...b, status: 'Hidden' } : b));
    addLog(`Bulk Hid ${selectedIds.length} Brands`);
    setSelectedIds([]);
    alert(`Successfully hidden ${selectedIds.length} premium brands.`);
  };

  const handleBulkExport = () => {
    const exportBrands = brands.filter(b => selectedIds.length === 0 || selectedIds.includes(b.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportBrands, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ZOAL_Luxury_Brands_Export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addLog(`Exported ${exportBrands.length} Luxury Brands portfolio as JSON`);
  };

  const handleBulkImport = () => {
    const rawInput = prompt('Paste brand portfolio JSON array data here:');
    if (!rawInput) return;
    try {
      const imported = JSON.parse(rawInput);
      if (Array.isArray(imported)) {
        setBrands(prev => {
          const filteredPrev = prev.filter(p => !imported.some(i => i.slug === p.slug));
          return [...filteredPrev, ...imported];
        });
        addLog(`Imported ${imported.length} Brands to luxury database`);
        alert(`Successfully imported ${imported.length} brands!`);
      } else {
        alert('Invalid format. Input must be a valid JSON array of brands.');
      }
    } catch (e) {
      alert('Error parsing JSON content. Ensure valid luxury schema is pasted.');
    }
  };

  // Media Asset Auto-Optimization sequence simulation
  const triggerAutoOptimization = () => {
    setOptimizing(true);
    setOptimizingProgress(0);
    setOptimizingStep('Connecting to Supabase Storage secure pipeline...');

    const interval = setInterval(() => {
      setOptimizingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setOptimizing(false);
            alert('Media Optimization Complete! WebP assets fully generated, resized, and deployed to active Supabase Edge Delivery network.');
          }, 800);
          return 100;
        }
        const next = prev + 20;
        if (next === 20) setOptimizingStep('Validating source resolution (aiming for ultra-high-definition 4K compatibility)...');
        if (next === 40) setOptimizingStep('Compressing cover banner files & logos into performance WebP format...');
        if (next === 60) setOptimizingStep('Generating progressive multi-size srcSet responsive breakpoints...');
        if (next === 80) setOptimizingStep('Syncing image assets to "brands" bucket folder in persistent Cloud Store...');
        return next;
      });
    }, 400);
  };

  // Compute stats for dashboard
  const stats = useMemo(() => {
    return {
      total: brands.length,
      featured: brands.filter(b => b.featuredToggle).length,
      hidden: brands.filter(b => b.status === 'Hidden' || b.status === 'Draft').length,
      archived: brands.filter(b => b.status === 'Archived').length,
    };
  }, [brands]);

  // Filter & sort list
  const filteredBrands = useMemo(() => {
    return brands.filter(b => {
      const matchSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (b.nameAr && b.nameAr.includes(searchTerm)) || 
                          b.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.country.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchCountry = countryFilter === 'all' || b.country === countryFilter;
      const matchFeatured = featuredFilter === 'all' || 
                            (featuredFilter === 'featured' && b.featuredToggle) || 
                            (featuredFilter === 'regular' && !b.featuredToggle);

      return matchSearch && matchStatus && matchCountry && matchFeatured;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'productsCount') {
        const countA = productsCountMap[a.name] || 0;
        const countB = productsCountMap[b.name] || 0;
        comparison = countA - countB;
      } else if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [brands, searchTerm, statusFilter, countryFilter, featuredFilter, sortBy, sortOrder, productsCountMap]);

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans">
      
      {/* SECTION 1: HEADER & METRICS GRID */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ZOAL PORTFOLIO NETWORK</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-gold-pure" /> LUXURY BRAND MANAGER
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleBulkImport}
            className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xs text-[9px] uppercase tracking-widest font-mono flex items-center gap-1.5 border border-white/10"
          >
            <Upload className="w-3.5 h-3.5" /> Bulk Import
          </button>
          <button 
            onClick={handleOpenCreate}
            className="py-1.5 px-3 bg-gold-pure hover:bg-gold-pure/90 text-black rounded-xs text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
          >
            <Plus className="w-3.5 h-3.5" /> Register Brand
          </button>
        </div>
      </div>

      {/* DASHBOARD STATS SECTION */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Brands', value: stats.total, sub: 'Registered partnerships', color: 'text-white' },
          { label: 'Featured Brands', value: stats.featured, sub: 'Exhibited on Landing', color: 'text-gold-pure' },
          { label: 'Hidden / Drafts', value: stats.hidden, sub: 'Awaiting deployment', color: 'text-zinc-500' },
          { label: 'Archived records', value: stats.archived, sub: 'Legacy preservation', color: 'text-rose-500' },
        ].map((st, idx) => (
          <div key={idx} className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">{st.label}</span>
            <span className={`text-2xl font-bold font-display ${st.color}`}>{st.value}</span>
            <span className="text-[9px] text-zinc-500 block mt-0.5">{st.sub}</span>
          </div>
        ))}
      </div>

      {/* SECTION 2: SEARCH, FILTERS & BULK CONTROLS */}
      <div className="bg-zinc-950 p-4 border border-white/5 rounded-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search bar */}
          <div className="md:col-span-1 space-y-1">
            <label className="text-[8.5px] font-mono uppercase text-zinc-500">Search Portfolio</label>
            <div className="flex items-center gap-2 bg-black border border-white/10 px-2.5 py-1.5 rounded-xs">
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Name, country, story..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-white outline-none text-[11px] w-full placeholder-zinc-600"
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="space-y-1">
            <label className="text-[8.5px] font-mono uppercase text-zinc-500">Status Gateway</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black w-full border border-white/10 text-zinc-300 text-[11px] py-1.5 px-2 rounded-xs outline-none focus:border-gold-pure"
            >
              <option value="all">All Statuses</option>
              <option value="Published">Published Only</option>
              <option value="Draft">Drafts Only</option>
              <option value="Hidden">Hidden Only</option>
              <option value="Archived">Archived Only</option>
            </select>
          </div>

          {/* Country Filter */}
          <div className="space-y-1">
            <label className="text-[8.5px] font-mono uppercase text-zinc-500">Country of Origin</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-black w-full border border-white/10 text-zinc-300 text-[11px] py-1.5 px-2 rounded-xs outline-none focus:border-gold-pure"
            >
              <option value="all">All Countries</option>
              {COUNTRY_PRESETS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Exhibition Filter */}
          <div className="space-y-1">
            <label className="text-[8.5px] font-mono uppercase text-zinc-500">Homepage Exhibition</label>
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="bg-black w-full border border-white/10 text-zinc-300 text-[11px] py-1.5 px-2 rounded-xs outline-none focus:border-gold-pure"
            >
              <option value="all">All Brands</option>
              <option value="featured">Featured On Homepage</option>
              <option value="regular">Regular Brands</option>
            </select>
          </div>

        </div>

        {/* Sorting controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 border-t border-white/5 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[8.5px] font-mono text-zinc-500 uppercase">Sort paradigm:</span>
            <button 
              onClick={() => { setSortBy('name'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
              className={`text-[9px] font-mono py-1 px-2.5 rounded-xs transition-colors flex items-center gap-1 ${sortBy === 'name' ? 'bg-gold-pure/10 text-gold-pure border border-gold-pure/20' : 'text-zinc-400 hover:text-white border border-transparent'}`}
            >
              Alphabetical <ArrowUpDown className="w-3 h-3" />
            </button>
            <button 
              onClick={() => { setSortBy('productsCount'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
              className={`text-[9px] font-mono py-1 px-2.5 rounded-xs transition-colors flex items-center gap-1 ${sortBy === 'productsCount' ? 'bg-gold-pure/10 text-gold-pure border border-gold-pure/20' : 'text-zinc-400 hover:text-white border border-transparent'}`}
            >
              Product Density <ArrowUpDown className="w-3 h-3" />
            </button>
            <button 
              onClick={() => { setSortBy('createdAt'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}
              className={`text-[9px] font-mono py-1 px-2.5 rounded-xs transition-colors flex items-center gap-1 ${sortBy === 'createdAt' ? 'bg-gold-pure/10 text-gold-pure border border-gold-pure/20' : 'text-zinc-400 hover:text-white border border-transparent'}`}
            >
              Creation Date <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>

          <div className="text-[9.5px] font-mono text-zinc-500">
            Showing <code className="text-white font-bold">{filteredBrands.length}</code> of {brands.length} luxury houses
          </div>
        </div>
      </div>

      {/* BULK ACTIONS BANNER */}
      {selectedIds.length > 0 && (
        <div className="bg-gold-pure/10 border border-gold-pure/30 p-3.5 rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-gold-pure" />
            <span className="text-[10px] uppercase font-mono tracking-wider text-white">
              Selected <span className="font-bold text-gold-pure">{selectedIds.length}</span> brands for multi-action processing
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button 
              onClick={handleBulkPublish}
              className="py-1 px-2.5 bg-zinc-950 hover:bg-black border border-gold-pure/20 hover:border-gold-pure/50 text-gold-pure rounded-xs text-[8.5px] uppercase tracking-widest font-mono"
            >
              Publish Selected
            </button>
            <button 
              onClick={handleBulkHide}
              className="py-1 px-2.5 bg-zinc-950 hover:bg-black border border-white/5 hover:border-white/10 text-white rounded-xs text-[8.5px] uppercase tracking-widest font-mono"
            >
              Hide Selected
            </button>
            <button 
              onClick={handleBulkExport}
              className="py-1 px-2.5 bg-[#8b0000]/10 hover:bg-[#8b0000]/20 border border-rose-900/20 text-rose-400 rounded-xs text-[8.5px] uppercase tracking-widest font-mono"
            >
              Export Selected JSON
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="py-1 px-2.5 text-zinc-500 hover:text-white text-[8.5px] uppercase tracking-widest font-mono"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SECTION 3: BRANDS PORTFOLIO LIST CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Toggle Select All checkbox */}
        <div className="col-span-1 md:col-span-2 flex justify-between items-center px-1">
          <button 
            onClick={toggleSelectAll}
            className="text-[9.5px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1.5"
          >
            {selectedIds.length === filteredBrands.length ? (
              <CheckSquare className="w-4 h-4 text-gold-pure" />
            ) : (
              <Square className="w-4 h-4 text-zinc-700" />
            )}
            Select / Deselect All Filtered
          </button>
        </div>

        {filteredBrands.map((b) => {
          const density = productsCountMap[b.name] || 0;
          return (
            <div 
              key={b.id} 
              className={`bg-zinc-950 border rounded-xs transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                selectedIds.includes(b.id) ? 'border-gold-pure/40 shadow-[0_0_15px_rgba(212,175,55,0.05)]' : 'border-white/5 hover:border-white/10'
              }`}
            >
              {/* Checkbox indicator */}
              <button 
                onClick={() => toggleSelectOne(b.id)}
                className="absolute top-4 left-4 z-10 p-1"
              >
                {selectedIds.includes(b.id) ? (
                  <CheckSquare className="w-4 h-4 text-gold-pure" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-800 hover:text-zinc-600" />
                )}
              </button>

              {/* Cover Banner Background Layer */}
              <div className="h-20 w-full relative bg-zinc-900 overflow-hidden">
                {b.coverBannerUrl ? (
                  <img src={b.coverBannerUrl} alt="" className="w-full h-full object-cover opacity-20 filter grayscale" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-zinc-950 to-zinc-900" />
                )}
                
                {/* Badges */}
                <div className="absolute top-4 right-4 flex gap-1.5">
                  {b.featuredToggle && (
                    <span className="text-[7.5px] font-mono bg-gold-pure/10 text-gold-pure uppercase tracking-widest px-1.5 py-0.5 rounded-sm border border-gold-pure/20">
                      Featured Exhibition
                    </span>
                  )}
                  <span className={`text-[7.5px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${
                    b.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    b.status === 'Draft' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' :
                    b.status === 'Archived' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>

              {/* Brand Main Card Content */}
              <div className="p-5 pt-0 relative -mt-6 flex-grow flex gap-4 items-start">
                {/* Brand Logo */}
                <div className="w-16 h-16 shrink-0 bg-black border border-white/10 rounded-xs overflow-hidden shadow-lg relative z-10 flex items-center justify-center">
                  <img src={b.logoUrl} alt={b.name} className="w-full h-full object-cover duration-300" />
                </div>

                <div className="space-y-1.5 pt-7 flex-grow text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-display text-sm font-bold uppercase tracking-wide leading-tight">
                        {b.name}
                      </h4>
                      {b.nameAr && (
                        <span className="text-[10.5px] text-zinc-400 block font-sans text-right" dir="rtl">
                          {b.nameAr}
                        </span>
                      )}
                    </div>
                    <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-sm">
                      {b.country}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed line-clamp-2">
                    {b.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-[8.5px] font-mono text-zinc-500">
                    <span>Slug: <code className="text-zinc-300">/{b.slug}</code></span>
                    <span>Density: <strong className="text-gold-pure">{density} Products</strong></span>
                  </div>
                </div>
              </div>

              {/* Brand Actions Bottom Toolbar */}
              <div className="p-4 border-t border-white/5 bg-black/40 flex justify-between items-center">
                <div className="flex items-center gap-1">
                  {b.website && (
                    <a href={b.website} target="_blank" rel="noreferrer" title="Official Website" className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {b.supportEmail && (
                    <a href={`mailto:${b.supportEmail}`} title={`Email: ${b.supportEmail}`} className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {b.supportPhone && (
                    <a href={`tel:${b.supportPhone}`} title={`Phone: ${b.supportPhone}`} className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handleDuplicate(b)}
                    title="Duplicate luxury record"
                    className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xs transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {b.status === 'Archived' ? (
                    <button 
                      onClick={() => handleRestore(b.id, b.name)}
                      title="Restore brand"
                      className="p-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xs transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleArchive(b.id, b.name)}
                      title="Archive brand"
                      className="p-1.5 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-xs transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleOpenEdit(b)}
                    title="Edit full credentials"
                    className="p-1.5 text-zinc-400 hover:text-gold-pure hover:bg-gold-pure/10 rounded-xs transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(b.id, b.name)}
                    title="Erase from register"
                    className="p-1.5 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xs transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredBrands.length === 0 && (
          <div className="col-span-1 md:col-span-2 py-12 text-center border border-dashed border-white/5 rounded-xs bg-zinc-950/20">
            <Tag className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-[11px] text-zinc-500">No registered brands match active filters in the sovereign register.</p>
          </div>
        )}

      </div>

      {/* SECTION 4: FULL-FEATURED REGISTER SIDE DRAWER / SLIDE OVER FORM */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end font-sans">
            
            {/* Modal backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Form Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl h-full bg-zinc-950 border-l border-white/10 flex flex-col justify-between shadow-[0_0_60px_rgba(0,0,0,0.85)] z-10"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black">
                <div>
                  <span className="text-[8.5px] font-mono text-gold-pure uppercase tracking-widest block mb-0.5">Sovereign Directory Ledger</span>
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider text-white">
                    {editingBrand ? `Update Registration: ${editingBrand.name}` : 'Register New Luxury Brand House'}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lang tab selector & Optimization command button */}
              <div className="px-5 py-2.5 bg-zinc-900 border-b border-white/5 flex items-center justify-between">
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setFormLang('en')}
                    className={`py-1 px-3 rounded-xs text-[9px] uppercase tracking-wider font-mono transition-colors ${formLang === 'en' ? 'bg-gold-pure text-black font-bold' : 'text-zinc-400 hover:text-white bg-black/30'}`}
                  >
                    English Metadata
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormLang('ar')}
                    className={`py-1 px-3 rounded-xs text-[9px] uppercase tracking-wider font-mono transition-colors ${formLang === 'ar' ? 'bg-gold-pure text-black font-bold' : 'text-zinc-400 hover:text-white bg-black/30'}`}
                  >
                    العربية (Arabic Localization)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={triggerAutoOptimization}
                  className="py-1 px-2.5 bg-gold-pure/10 hover:bg-gold-pure/20 border border-gold-pure/30 text-gold-pure rounded-xs text-[8.5px] uppercase tracking-widest font-mono flex items-center gap-1 transition-all"
                >
                  <RefreshCw className={`w-3 h-3 ${optimizing ? 'animate-spin' : ''}`} /> Optimize Media Uploads
                </button>
              </div>

              {/* Optimization progress display */}
              {optimizing && (
                <div className="px-5 py-3 bg-[#D4AF37]/5 border-b border-gold-pure/20 space-y-1.5 animate-pulse">
                  <div className="flex justify-between items-center text-[8.5px] font-mono text-gold-pure">
                    <span>{optimizingStep}</span>
                    <span>{optimizingProgress}%</span>
                  </div>
                  <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gold-pure h-full transition-all duration-300" style={{ width: `${optimizingProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Form Content Scrollable Container */}
              <form onSubmit={handleSaveBrand} className="p-6 flex-grow overflow-y-auto space-y-6 text-left">
                
                {/* SECTION I: BRAND BASIC REGISTER */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-gold-pure font-mono text-[9px] uppercase tracking-widest border-b border-gold-pure/10 pb-1.5">
                    <Info className="w-3.5 h-3.5" /> 1. Brand Identity & Global Logistics
                  </div>

                  {formLang === 'en' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                      <div className="space-y-1">
                        <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Brand Name (English) *</label>
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. AL ZOAL Specialty"
                          className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Logistics URL Slug *</label>
                        <input 
                          type="text" 
                          required
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          placeholder="e.g. al-zoal-specialty"
                          className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-xs"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-1">
                        <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Short Brand Description (English)</label>
                        <textarea 
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Provide a succinct summary of the house heritage and focus..."
                          className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs leading-relaxed"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-1">
                        <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Prestige Brand Story (English)</label>
                        <textarea 
                          rows={4}
                          value={brandStory}
                          onChange={(e) => setBrandStory(e.target.value)}
                          placeholder="Write the in-depth journey of craftsmanship, origins, and traditional secrets..."
                          className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs leading-relaxed"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in text-right" dir="rtl">
                      <div className="space-y-1 text-right">
                        <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">اسم العلامة التجارية (بالعربية)</label>
                        <input 
                          type="text" 
                          value={nameAr}
                          onChange={(e) => setNameAr(e.target.value)}
                          placeholder="مثال: مزارع ال زول الفاخرة"
                          className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs"
                        />
                      </div>
                      <div className="space-y-1 text-right">
                        <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">بلد المنشأ</label>
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs text-right"
                        >
                          {COUNTRY_PRESETS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-1 text-right">
                        <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">وصف مختصر للعلامة التجارية (بالعربية)</label>
                        <textarea 
                          rows={3}
                          value={descriptionAr}
                          onChange={(e) => setDescriptionAr(e.target.value)}
                          placeholder="اكتب خلاصة هيبة هذه الدار في أسطر موجزة..."
                          className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs leading-relaxed text-right"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-1 text-right">
                        <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">قصة الدار والتراث بالتفصيل (بالعربية)</label>
                        <textarea 
                          rows={4}
                          value={brandStoryAr}
                          onChange={(e) => setBrandStoryAr(e.target.value)}
                          placeholder="اكتب مسيرة العلامة التجارية وأسرار صناعتها التقليدية العريقة..."
                          className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs leading-relaxed text-right"
                        />
                      </div>
                    </div>
                  )}

                  {/* Core Settings (Status, Country, Featured) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/40 p-4 border border-white/5 rounded-xs">
                    <div className="space-y-1">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Registration Country</label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs"
                      >
                        {COUNTRY_PRESETS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Active Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs"
                      >
                        <option value="Published">Published (Active)</option>
                        <option value="Draft">Draft</option>
                        <option value="Hidden">Hidden (Not in Filters)</option>
                        <option value="Archived">Archived (Legacy)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <input 
                        type="checkbox" 
                        id="featuredToggle"
                        checked={featuredToggle}
                        onChange={(e) => setFeaturedToggle(e.target.checked)}
                        className="w-3.5 h-3.5 rounded-sm bg-black border border-white/10 checked:bg-gold-pure focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="featuredToggle" className="text-[10px] uppercase tracking-wider text-zinc-300 font-mono select-none cursor-pointer">
                        Feature on Homepage
                      </label>
                    </div>
                  </div>
                </div>

                {/* SECTION II: BRAND MEDIA CHANNELS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-gold-pure font-mono text-[9px] uppercase tracking-widest border-b border-gold-pure/10 pb-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> 2. Brand Media & Gallery Vaults
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Logo Image URL</label>
                      <input 
                        type="text" 
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="Paste logo asset path..."
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-xs"
                      />
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
                        {PRESET_LOGOS.map((url, i) => (
                          <button 
                            key={i} 
                            type="button" 
                            onClick={() => setLogoUrl(url)}
                            className="w-9 h-9 border border-white/10 hover:border-gold-pure rounded-xs overflow-hidden shrink-0"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Cover Banner URL</label>
                      <input 
                        type="text" 
                        value={coverBannerUrl}
                        onChange={(e) => setCoverBannerUrl(e.target.value)}
                        placeholder="Paste banner asset path..."
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-xs"
                      />
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
                        {PRESET_BANNERS.map((url, i) => (
                          <button 
                            key={i} 
                            type="button" 
                            onClick={() => setCoverBannerUrl(url)}
                            className="w-9 h-9 border border-white/10 hover:border-gold-pure rounded-xs overflow-hidden shrink-0"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block flex justify-between">
                        <span>Gallery Carousels (comma separated URLs)</span>
                        <span className="text-zinc-600 font-mono text-[8px]">Unsplash recommended</span>
                      </label>
                      <input 
                        type="text" 
                        value={galleryInput}
                        onChange={(e) => setGalleryInput(e.target.value)}
                        placeholder="https://images.unsplash.com/..., https://images.unsplash.com/..."
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-xs"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block flex justify-between">
                        <span>Future-Ready Brand Videos (comma separated URLs)</span>
                        <span className="text-zinc-600 font-mono text-[8px]">Youtube or direct .mp4</span>
                      </label>
                      <input 
                        type="text" 
                        value={videoInput}
                        onChange={(e) => setVideoInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..., https://assets.zoal.com/promo.mp4"
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION III: BRAND SUPPORT & WEBSITE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-gold-pure font-mono text-[9px] uppercase tracking-widest border-b border-gold-pure/10 pb-1.5">
                    <Link className="w-3.5 h-3.5" /> 3. Support, Contacts & Web Integrations
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Official Brand Website</label>
                      <input 
                        type="url" 
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://brand-domain.com"
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Support Contact Email</label>
                      <input 
                        type="email" 
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="concierge@brand.com"
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Support Hotline Phone</label>
                      <input 
                        type="tel" 
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        placeholder="+966 56 769 9315"
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION IV: BRAND SEO COMPLIANCE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-gold-pure font-mono text-[9px] uppercase tracking-widest border-b border-gold-pure/10 pb-1.5">
                    <Globe className="w-3.5 h-3.5" /> 4. Search Engine Optimization (SEO) Metadata
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">SEO Meta Title</label>
                      <input 
                        type="text" 
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder="Prestige Heritage | AL ZOAL Specialty"
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Canonical URL Reference</label>
                      <input 
                        type="url" 
                        value={canonicalUrl}
                        onChange={(e) => setCanonicalUrl(e.target.value)}
                        placeholder="https://alzoal.com/brands/specialty-roasters"
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Meta Keywords</label>
                      <input 
                        type="text" 
                        value={seoKeywords}
                        onChange={(e) => setSeoKeywords(e.target.value)}
                        placeholder="Luxury Arabic, organic, botanical, Kordofan, handmade thobe"
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Open Graph Image (Social Shares)</label>
                      <input 
                        type="text" 
                        value={openGraphImage}
                        onChange={(e) => setOpenGraphImage(e.target.value)}
                        placeholder="https://images.unsplash.com/... for social link preview cards"
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Meta Description</label>
                      <textarea 
                        rows={2}
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        placeholder="Provide search engines with an enticing summary of the brand..."
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs leading-relaxed"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block">Structured JSON-LD Schema Data</label>
                      <textarea 
                        rows={4}
                        value={structuredData}
                        onChange={(e) => setStructuredData(e.target.value)}
                        placeholder="Paste application/ld+json schemas..."
                        className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-[10px] leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

              </form>

              {/* Drawer Footer controls */}
              <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-black">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="py-2 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xs text-[10px] uppercase tracking-widest font-mono"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSaveBrand}
                  className="py-2 px-6 bg-gold-pure hover:bg-gold-pure/90 text-black font-bold rounded-xs text-[10px] uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                >
                  {editingBrand ? 'Commit Updates' : 'Register Brand'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
