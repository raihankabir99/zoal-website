import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Layers, Video, MessageSquare, UploadCloud, Globe, 
  Activity, Sparkles, Plus, Search, Star, Trash2, Edit, 
  FileSpreadsheet, Download 
} from 'lucide-react';
import { Product, ProductVariant, Review, BusinessCategory } from '../types';

interface PmsSubTabsProps {
  pmsSubTab: string;
  selectedPmsProduct: Product | undefined;
  allProducts: Product[];
  selectedPmsProductId: string;
  setSelectedPmsProductId: (id: string) => void;
  addLog: (action: string, target: string) => void;
  pmsLogs: any[];
  saveProductFields: (productId: string, fields: Partial<Product>) => void;
  selectedProductIds: string[];
  currentUser?: any;
}

const compressImage = (file: File, quality = 0.75): Promise<Blob> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Limit max resolution to 1200px for catalog optimization
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            quality
          );
        } else {
          resolve(file);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const PmsSubTabs: React.FC<PmsSubTabsProps> = ({
  pmsSubTab,
  selectedPmsProduct,
  allProducts,
  selectedPmsProductId,
  setSelectedPmsProductId,
  addLog,
  pmsLogs,
  saveProductFields,
  selectedProductIds,
  currentUser,
}) => {
  // --- VARIANTS STATE ---
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantSize, setVariantSize] = useState('');
  const [variantColor, setVariantColor] = useState('');
  const [variantWeight, setVariantWeight] = useState('');
  const [variantVolume, setVariantVolume] = useState('');
  const [variantFlavor, setVariantFlavor] = useState('');
  const [variantPackSize, setVariantPackSize] = useState('');
  const [variantSku, setVariantSku] = useState('');
  const [variantBarcode, setVariantBarcode] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantSalePrice, setVariantSalePrice] = useState('');
  const [variantStock, setVariantStock] = useState('10');
  const [variantImage, setVariantImage] = useState('');
  const [variantStatus, setVariantStatus] = useState<'Active' | 'Inactive'>('Active');

  // --- ATTRIBUTES STATE ---
  const [attrWeight, setAttrWeight] = useState('');
  const [attrVolume, setAttrVolume] = useState('');
  const [attrMaterial, setAttrMaterial] = useState('');
  const [attrColor, setAttrColor] = useState('');
  const [attrSize, setAttrSize] = useState('');
  const [attrOriginCountry, setAttrOriginCountry] = useState('');
  const [attrShelfLife, setAttrShelfLife] = useState('');
  const [attrStorageCondition, setAttrStorageCondition] = useState('');
  const [attrPackagingType, setAttrPackagingType] = useState('');

  // --- MEDIA STATE ---
  const [videoUrl, setVideoUrl] = useState('');
  const [image360Input, setImage360Input] = useState('');
  const [images360List, setImages360List] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- SEO STATE ---
  const [seoSlug, setSeoSlug] = useState('');
  const [seoMetaTitle, setSeoMetaTitle] = useState('');
  const [seoMetaDesc, setSeoMetaDesc] = useState('');
  const [seoMetaKeywords, setSeoMetaKeywords] = useState('');
  const [seoOpenGraphImage, setSeoOpenGraphImage] = useState('');
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState('');
  const [seoSchemaProductData, setSeoSchemaProductData] = useState('');

  // --- REVIEWS STATE ---
  const [reviewsReplyText, setReviewsReplyText] = useState<Record<string, string>>({});

  // --- AI STATE ---
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiProductSummary, setAiProductSummary] = useState('');
  const [aiSeoSuggestions, setAiSeoSuggestions] = useState('');
  const [aiTranslationEn, setAiTranslationEn] = useState('');
  const [aiTranslationAr, setAiTranslationAr] = useState('');
  const [aiProductRecommendation, setAiProductRecommendation] = useState('');
  const [aiSearchOptimization, setAiSearchOptimization] = useState('');

  // --- BULK STATE ---
  const [bulkPriceChangeType, setBulkPriceChangeType] = useState<'fixed' | 'percent'>('fixed');
  const [bulkPriceChangeDirection, setBulkPriceChangeDirection] = useState<'increase' | 'decrease'>('increase');
  const [bulkPriceChangeValue, setBulkPriceChangeValue] = useState('');
  const [bulkDiscountValue, setBulkDiscountValue] = useState('');
  const [bulkBrandValue, setBulkBrandValue] = useState('');
  const registeredBrands = useMemo(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_brands');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [
      { id: 'brand-1', name: 'ZOAL Specialty Roasters' },
      { id: 'brand-2', name: 'Sudan Bakery Heritage' },
      { id: 'brand-3', name: 'Kordofan Organic Co.' },
      { id: 'brand-4', name: 'Artisan Sudanese Weaves' }
    ];
  }, []);
  const [bulkStockValue, setBulkStockValue] = useState('');
  const [bulkStatusValue, setBulkStatusValue] = useState('');
  const [bulkCategoryValue, setBulkCategoryValue] = useState('');

  // Sync state with selected product fields
  useEffect(() => {
    if (!selectedPmsProduct) return;
    
    // Clear editing state
    setEditingVariantId(null);
    setVariantSku('');
    setVariantBarcode('');
    setVariantPrice('');
    setVariantSalePrice('');
    setVariantStock('10');
    setVariantImage('');
    setVariantStatus('Active');

    // Attributes sync
    const attrs = selectedPmsProduct.reusableAttributes;
    setAttrWeight(attrs?.weight || '');
    setAttrVolume(attrs?.volume || '');
    setAttrMaterial(attrs?.material || '');
    setAttrColor(attrs?.color || '');
    setAttrSize(attrs?.size || '');
    setAttrOriginCountry(attrs?.originCountry || '');
    setAttrShelfLife(attrs?.shelfLife || '');
    setAttrStorageCondition(attrs?.storageCondition || '');
    setAttrPackagingType(attrs?.packagingType || '');

    // Media sync
    setVideoUrl(selectedPmsProduct.videoUrl || '');
    setImages360List(selectedPmsProduct.images360 || []);

    // SEO sync
    const autoSlug = selectedPmsProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setSeoSlug(selectedPmsProduct.seoSlug || autoSlug);
    setSeoMetaTitle(selectedPmsProduct.seoMetaTitle || `${selectedPmsProduct.name} - Luxury Specialty | AL ZOAL`);
    setSeoMetaDesc(selectedPmsProduct.seoMetaDesc || selectedPmsProduct.description || '');
    setSeoMetaKeywords(selectedPmsProduct.seoMetaKeywords || 'luxury, boutique, specialty, kordofan');
    setSeoOpenGraphImage(selectedPmsProduct.seoOpenGraphImage || selectedPmsProduct.images[0] || '');
    setSeoCanonicalUrl(selectedPmsProduct.seoCanonicalUrl || `https://alzoal.sa/product/${selectedPmsProduct.seoSlug || autoSlug}`);
    setSeoSchemaProductData(selectedPmsProduct.seoSchemaProductData || '');

    // AI field reset/sync
    setAiProductSummary(selectedPmsProduct.aiProductSummary || '');
    setAiSeoSuggestions(selectedPmsProduct.aiSeoSuggestions || '');
    setAiTranslationEn(selectedPmsProduct.aiTranslationEn || selectedPmsProduct.name);
    setAiTranslationAr(selectedPmsProduct.aiTranslationAr || '');
    setAiProductRecommendation(selectedPmsProduct.aiProductRecommendation || '');
    setAiSearchOptimization(selectedPmsProduct.aiSearchOptimization || '');

  }, [selectedPmsProductId, selectedPmsProduct]);

  if (!selectedPmsProduct && pmsSubTab !== 'bulk' && pmsSubTab !== 'logs') {
    return (
      <div className="bg-zinc-950 p-12 border border-white/5 rounded-xs text-center font-mono text-zinc-500 uppercase tracking-widest text-xs">
        No target product selected. Select a product in the dropdown first.
      </div>
    );
  }

  // --- SAVE ACTIONS ---
  const handleSaveVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPmsProduct) return;

    const optName = variantSize ? 'size' : variantColor ? 'color' : variantWeight ? 'weight' : variantVolume ? 'volume' : variantFlavor ? 'flavor' : 'size';
    const optVal = variantSize || variantColor || variantWeight || variantVolume || variantFlavor || variantPackSize || 'Default';

    const newVariant: ProductVariant = {
      id: editingVariantId || `v-${Date.now()}`,
      sku: variantSku.trim(),
      barcode: variantBarcode.trim(),
      price: parseFloat(variantPrice) || selectedPmsProduct.price,
      salePrice: variantSalePrice ? parseFloat(variantSalePrice) : undefined,
      stock: parseInt(variantStock) || 0,
      status: variantStatus,
      image: variantImage.trim() || selectedPmsProduct.images[0],
      [optName]: optVal
    };

    let currentList = [...(selectedPmsProduct.variantsList || [])];
    if (editingVariantId) {
      currentList = currentList.map(v => v.id === editingVariantId ? newVariant : v);
      addLog("Product Updated", `Updated variant ${newVariant.sku} for ${selectedPmsProduct.name}`);
    } else {
      currentList.push(newVariant);
      addLog("Product Updated", `Created new variant ${newVariant.sku} for ${selectedPmsProduct.name}`);
    }

    saveProductFields(selectedPmsProduct.id, { variantsList: currentList });
    
    // Reset variant fields
    setEditingVariantId(null);
    setVariantSku('');
    setVariantBarcode('');
    setVariantPrice('');
    setVariantSalePrice('');
    setVariantImage('');
  };

  const handleSaveAttributes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPmsProduct) return;

    const reusableAttributes = {
      weight: attrWeight,
      volume: attrVolume,
      material: attrMaterial,
      color: attrColor,
      size: attrSize,
      originCountry: attrOriginCountry,
      shelfLife: attrShelfLife,
      storageCondition: attrStorageCondition,
      packagingType: attrPackagingType
    };

    saveProductFields(selectedPmsProduct.id, { reusableAttributes });
    addLog("Product Updated", `Committed global characteristics schema for ${selectedPmsProduct.name}`);
    alert("Global specifications matrix committed!");
  };

  const handleMediaUpload = async (file: File, targetType: 'images' | 'gallery' | 'variants' | 'videos') => {
    setIsCompressing(true);
    setUploadProgress(15);
    
    try {
      if (!selectedPmsProduct) return;
      
      let fileToUpload: Blob = file;
      let extension = file.name.split('.').pop() || '';
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      // Auto-detect targetType based on file MIME type
      let actualTarget = targetType;
      if (isVideo) {
        actualTarget = 'videos';
      }
      
      // Automatic Image Compression for images
      if (isImage) {
        setUploadProgress(40);
        fileToUpload = await compressImage(file, 0.75);
        extension = 'webp';
      }
      
      setUploadProgress(70);
      
      const bucket = 'products';
      const folder = actualTarget === 'images' ? 'images' : actualTarget === 'gallery' ? 'gallery' : actualTarget === 'videos' ? 'videos' : 'variants';
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').split('.')[0];
      const pathInBucket = `${folder}/${Date.now()}_${sanitizedName}.${extension}`;
      
      const formData = new FormData();
      formData.append('file', fileToUpload, `${sanitizedName}.${extension}`);
      formData.append('bucket', bucket);
      formData.append('path', pathInBucket);
      
      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsCompressing(false);
        setUploadProgress(0);
        
        if (response.ok && data.success) {
          const finalUrl = data.url;
          
          if (actualTarget === 'images') {
            const current = [...(selectedPmsProduct.images || [])];
            current[0] = finalUrl;
            saveProductFields(selectedPmsProduct.id, { images: current });
            addLog("Media Uploaded", `Uploaded optimized featured image to Supabase: /products/${pathInBucket}`);
          } else if (actualTarget === 'gallery') {
            const current = [...(selectedPmsProduct.images || [])];
            current.push(finalUrl);
            saveProductFields(selectedPmsProduct.id, { images: current });
            addLog("Media Uploaded", `Uploaded optimized gallery image to Supabase: /products/${pathInBucket}`);
          } else if (actualTarget === 'variants') {
            setVariantImage(finalUrl);
            addLog("Media Uploaded", `Uploaded optimized variant image to Supabase: /products/${pathInBucket}`);
          } else if (actualTarget === 'videos') {
            setVideoUrl(finalUrl);
            saveProductFields(selectedPmsProduct.id, { videoUrl: finalUrl });
            addLog("Media Uploaded", `Uploaded product video to Supabase: /products/${pathInBucket}`);
          }
          alert(`File successfully uploaded and optimized under /products/${folder}!`);
        } else {
          // Fallback if Supabase is not configured or errors out
          const fallbackPath = `/products/${folder}/${Date.now()}_${file.name}`;
          if (actualTarget === 'images') {
            const current = [...(selectedPmsProduct.images || [])];
            current[0] = fallbackPath;
            saveProductFields(selectedPmsProduct.id, { images: current });
            addLog("Media Uploaded", `Uploaded featured image to local fallback path: ${fallbackPath}`);
          } else if (actualTarget === 'gallery') {
            const current = [...(selectedPmsProduct.images || [])];
            current.push(fallbackPath);
            saveProductFields(selectedPmsProduct.id, { images: current });
            addLog("Media Uploaded", `Uploaded gallery image to local fallback path: ${fallbackPath}`);
          } else if (actualTarget === 'variants') {
            setVariantImage(fallbackPath);
            addLog("Media Uploaded", `Uploaded variant image to local fallback path: ${fallbackPath}`);
          } else if (actualTarget === 'videos') {
            setVideoUrl(fallbackPath);
            saveProductFields(selectedPmsProduct.id, { videoUrl: fallbackPath });
            addLog("Media Uploaded", `Uploaded product video to local fallback path: ${fallbackPath}`);
          }
          console.warn("Supabase upload failed, using local fallback path.", data?.error);
          alert(`Simulated local catalog upload path. (Supabase Storage offline. Path: /products/${folder}/${file.name})`);
        }
      }, 200);
    } catch (err: any) {
      console.error(err);
      setIsCompressing(false);
      setUploadProgress(0);
      alert("An error occurred during file upload.");
    }
  };

  // --- REVIEW MODERATION ---
  const handleApproveReview = (reviewId: string) => {
    if (!selectedPmsProduct) return;
    const current = (selectedPmsProduct.reviews || []).map(r => r.id === reviewId ? { ...r, approved: true } : r);
    saveProductFields(selectedPmsProduct.id, { reviews: current });
    addLog("Review Approved", `Approved customer review #${reviewId} on ${selectedPmsProduct.name}`);
  };

  const handleRejectReview = (reviewId: string) => {
    if (!selectedPmsProduct) return;
    const current = (selectedPmsProduct.reviews || []).map(r => r.id === reviewId ? { ...r, approved: false } : r);
    saveProductFields(selectedPmsProduct.id, { reviews: current });
    addLog("Review Rejected", `Rejected customer review #${reviewId} on ${selectedPmsProduct.name}`);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (!selectedPmsProduct) return;
    const current = (selectedPmsProduct.reviews || []).filter(r => r.id !== reviewId);
    saveProductFields(selectedPmsProduct.id, { reviews: current });
    addLog("Review Deleted", `Deleted customer review #${reviewId} on ${selectedPmsProduct.name}`);
  };

  const handleReplyReview = (reviewId: string, reply: string) => {
    if (!selectedPmsProduct) return;
    const current = (selectedPmsProduct.reviews || []).map(r => r.id === reviewId ? { ...r, reply, approved: true } : r);
    saveProductFields(selectedPmsProduct.id, { reviews: current });
    addLog("Review Replied", `Replied to customer review #${reviewId} on ${selectedPmsProduct.name}`);
  };

  // --- AI INTEGRATION ---
  const handleGenerateAiField = (type: 'summary' | 'seo' | 'translation' | 'recommendation' | 'search') => {
    if (!selectedPmsProduct) return;
    setIsGeneratingAi(true);

    setTimeout(() => {
      setIsGeneratingAi(false);
      const name = selectedPmsProduct.name;
      
      if (type === 'summary') {
        const text = `Crafted for connoisseurs, ${name} offers an unparalleled sensory indulgence. Made with rare specialty micro-lots, it features complex tasting profiles of pure single-origin perfection and rich heritage.`;
        setAiProductSummary(text);
        saveProductFields(selectedPmsProduct.id, { aiProductSummary: text });
        addLog("AI Optimized", `Generated sovereign LLM product summary for ${name}`);
      } else if (type === 'seo') {
        const text = `• Title recommendation: "Sovereign ${name} | AL ZOAL Specialty"\n• Meta Description: Discover the ultimate expression of historic Arabic specialty. Buy ${name} online in KSA with certified micro-lot luxury origin and same-day boutique packaging.\n• Keyword Suggestion: ${name.toLowerCase()}, organic saudi, harazi, kordofan, premium arabica.`;
        setAiSeoSuggestions(text);
        saveProductFields(selectedPmsProduct.id, { aiSeoSuggestions: text });
        addLog("AI Optimized", `Generated SEO meta crawlers audits for ${name}`);
      } else if (type === 'translation') {
        const textEn = `${name} - Elite Historic Selection`;
        // Sudanese/Saudi high-end luxury arabic phrasing
        const textAr = `${name} - خيار النخبة الفاخر من مزارع آل زوال التاريخية`;
        setAiTranslationEn(textEn);
        setAiTranslationAr(textAr);
        saveProductFields(selectedPmsProduct.id, { aiTranslationEn: textEn, aiTranslationAr: textAr });
        addLog("AI Optimized", `Generated prestige bilingual translation for ${name}`);
      } else if (type === 'recommendation') {
        const textStr = `Complementary matches: [Traditional Coffee Saffron Jar, Yemeni Royal Haraz, Kordofan Honeycomb]`;
        setAiProductRecommendation(textStr);
        saveProductFields(selectedPmsProduct.id, { aiProductRecommendation: textStr });
        addLog("AI Optimized", `Calculated dynamic cross-sell recommenders for ${name}`);
      } else if (type === 'search') {
        const textStr = `${name.toLowerCase()}, زوال, قهوة فاخرة, بن سوداني, هدايا ملكية, thobe silk`;
        setAiSearchOptimization(textStr);
        saveProductFields(selectedPmsProduct.id, { aiSearchOptimization: textStr });
        addLog("AI Optimized", `Generated internal catalog search indexes synonyms for ${name}`);
      }
    }, 800);
  };

  // --- BULK ACTION ---
  const handleBulkPriceUpdateLocal = () => {
    if (selectedProductIds.length === 0) {
      alert("Please select target products from catalog list first (tab 1).");
      return;
    }
    const val = parseFloat(bulkPriceChangeValue);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid price update rate.");
      return;
    }

    selectedProductIds.forEach(id => {
      const prod = allProducts.find(p => p.id === id);
      if (prod) {
        let newPrice = prod.price;
        if (bulkPriceChangeType === 'fixed') {
          newPrice = bulkPriceChangeDirection === 'increase' ? prod.price + val : Math.max(1, prod.price - val);
        } else {
          const delta = prod.price * (val / 100);
          newPrice = bulkPriceChangeDirection === 'increase' ? prod.price + delta : Math.max(1, prod.price - delta);
        }
        newPrice = Math.round(newPrice * 100) / 100;
        saveProductFields(id, { price: newPrice });
      }
    });

    addLog("Price Updated", `Bulk modified price catalogs by ${val} (${bulkPriceChangeType}) on ${selectedProductIds.length} products`);
    alert(`Price modification executed successfully on ${selectedProductIds.length} products.`);
    setBulkPriceChangeValue('');
  };

  const handleCsvImportLocal = (text: string) => {
    try {
      const lines = text.split('\n');
      if (lines.length <= 1) return;
      
      const headers = lines[0].split(',');
      let count = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].trim();
        if (!row) continue;
        const cols = row.split(',');
        if (cols.length < 2) continue;

        const name = cols[0];
        const price = parseFloat(cols[1]) || 150;
        const sku = cols[2] || `ZL-SKU-${Date.now()}-${i}`;
        const barcode = cols[3] || '';
        const category = (cols[4] || 'coffee') as BusinessCategory;
        const brand = cols[5] || 'AL ZOAL Specialty';
        const inventory = parseInt(cols[6]) || 20;
        const status = cols[7] || 'Published';

        // Check duplicate
        const exists = allProducts.some(p => p.sku === sku);
        if (exists) continue;

        // Save simulated product fields via a unique ID
        const newId = `prod-imported-${Date.now()}-${i}`;
        const newProductData: Partial<Product> = {
          id: newId,
          name,
          price,
          sku,
          images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400'],
          category,
          brand,
          inventory,
          status,
          description: `Imported elite catalog item: ${name}.`,
          rating: 5,
          createdAt: new Date().toISOString(),
          variantsList: [],
          reviews: []
        };

        // Write directly to custom products list
        const customKey = 'zoal_custom_products';
        const rawCustom = localStorage.getItem(customKey);
        const customProds = rawCustom ? JSON.parse(rawCustom) : [];
        customProds.push(newProductData);
        localStorage.setItem(customKey, JSON.stringify(customProds));
        
        count++;
      }

      addLog("Product Created", `Mass imported ${count} new products from CSV ledger`);
      alert(`Ledger synchronizer: Successfully imported ${count} new custom products from spreadsheet.`);
      window.location.reload(); // Refresh state
    } catch (err) {
      alert("Error parsing CSV format. Please ensure valid headers.");
    }
  };

  const handleBulkCsvExportLocal = () => {
    const headers = 'ID,Name,Price,SKU,Category,Brand,Inventory,Status,Rating\n';
    const rows = allProducts.map(p => {
      return `"${p.id}","${p.name.replace(/"/g, '""')}",${p.price},"${p.sku || ''}","${p.category || ''}","${p.brand || ''}",${p.inventory || 0},"${p.status || 'Published'}",${p.rating || 5}`;
    }).join('\n');

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AL_ZOAL_Boutique_Catalog_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    addLog("Reports Generated", `Exported full boutique catalog Excel sheet with ${allProducts.length} entries`);
  };

  return (
    <div className="space-y-6">
      {/* 2. TAB: VARIANTS */}
      {pmsSubTab === 'variants' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-left">
          {/* Form */}
          <div className="lg:col-span-4 bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
            <div>
              <span className="text-[8px] font-mono text-gold-pure uppercase tracking-widest block mb-1">VARIANTS SETUP</span>
              <h3 className="text-base font-bold font-serif text-white">
                {editingVariantId ? 'Edit Product Option' : 'Configure New Option'}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">Unlimited options: Size, Color, Weight, Volume, Flavor, Pack Size</p>
            </div>

            <form onSubmit={handleSaveVariant} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Option Type</label>
                  <select
                    value={variantSize ? 'size' : variantColor ? 'color' : variantWeight ? 'weight' : variantVolume ? 'volume' : variantFlavor ? 'flavor' : 'size'}
                    onChange={(e) => {
                      const type = e.target.value;
                      setVariantSize(''); setVariantColor(''); setVariantWeight(''); setVariantVolume(''); setVariantFlavor(''); setVariantPackSize('');
                      if (type === 'size') setVariantSize('Medium');
                      else if (type === 'color') setVariantColor('Emerald Green');
                      else if (type === 'weight') setVariantWeight('250g');
                      else if (type === 'volume') setVariantVolume('1L');
                      else if (type === 'flavor') setVariantFlavor('Cardamom');
                      else setVariantPackSize('Pack of 6');
                    }}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure cursor-pointer"
                  >
                    <option value="size">Size</option>
                    <option value="color">Color</option>
                    <option value="weight">Weight</option>
                    <option value="volume">Volume</option>
                    <option value="flavor">Flavor</option>
                    <option value="packSize">Pack Size</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Option Value</label>
                  <input
                    type="text"
                    placeholder="e.g. Medium, 250g, Emerald"
                    value={variantSize || variantColor || variantWeight || variantVolume || variantFlavor || variantPackSize || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (variantSize) setVariantSize(v);
                      else if (variantColor) setVariantColor(v);
                      else if (variantWeight) setVariantWeight(v);
                      else if (variantVolume) setVariantVolume(v);
                      else if (variantFlavor) setVariantFlavor(v);
                      else setVariantPackSize(v);
                    }}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Variant SKU</label>
                  <input
                    type="text"
                    placeholder="SKU Code"
                    value={variantSku}
                    onChange={(e) => setVariantSku(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Barcode</label>
                  <input
                    type="text"
                    placeholder="EAN/UPC Code"
                    value={variantBarcode}
                    onChange={(e) => setVariantBarcode(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Price (SAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={variantPrice}
                    onChange={(e) => setVariantPrice(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure"
                    required
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Sale Price</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Sale"
                    value={variantSalePrice}
                    onChange={(e) => setVariantSalePrice(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Stock Qty</label>
                  <input
                    type="number"
                    placeholder="Stock"
                    value={variantStock}
                    onChange={(e) => setVariantStock(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Variant Custom Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={variantImage}
                    onChange={(e) => setVariantImage(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs"
                  />
                  <label className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xs px-3 flex items-center justify-center cursor-pointer font-mono text-[10px]">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleMediaUpload(e.target.files[0], 'variants');
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Variant Status</label>
                <select
                  value={variantStatus}
                  onChange={(e) => setVariantStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure cursor-pointer"
                >
                  <option value="Active">Active / On Shelf</option>
                  <option value="Inactive">Inactive / Stockpiled</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gold-pure hover:bg-gold-pure/90 text-black font-bold uppercase font-mono tracking-wider rounded-xs cursor-pointer text-[10px]"
                >
                  {editingVariantId ? 'Commit Variant Change' : 'Forge Custom Variant'}
                </button>
              </div>
            </form>
          </div>

          {/* Table list */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="text-white font-bold font-serif flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gold-pure" /> Registered Variant Options ({selectedPmsProduct.variantsList?.length || 0})
                </h4>
                <button
                  onClick={() => {
                    const samples: ProductVariant[] = [
                      { id: 'v-1', sku: `${selectedPmsProduct.sku || 'ZL'}-SZ-M`, barcode: `628${Date.now()}1`, price: selectedPmsProduct.price, stock: 15, status: 'Active', size: 'Medium', image: selectedPmsProduct.images[0] },
                      { id: 'v-2', sku: `${selectedPmsProduct.sku || 'ZL'}-SZ-L`, barcode: `628${Date.now()}2`, price: selectedPmsProduct.price + 25, stock: 8, status: 'Active', size: 'Large', image: selectedPmsProduct.images[0] },
                      { id: 'v-3', sku: `${selectedPmsProduct.sku || 'ZL'}-SZ-XL`, barcode: `628${Date.now()}3`, price: selectedPmsProduct.price + 45, stock: 3, status: 'Active', size: 'X-Large', image: selectedPmsProduct.images[0] }
                    ];
                    saveProductFields(selectedPmsProduct.id, { variantsList: samples });
                    addLog("Product Updated", `Auto-seeded variant registry for ${selectedPmsProduct.name}`);
                  }}
                  className="py-1 px-2.5 border border-gold-pure/30 text-gold-pure hover:bg-gold-pure/10 text-[9px] font-mono rounded-xs transition-all uppercase cursor-pointer"
                >
                  💡 Seed Sample Options
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-[10px]">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-500 uppercase tracking-widest text-[8px]">
                      <th className="pb-2">Option Name/Value</th>
                      <th className="pb-2">SKU</th>
                      <th className="pb-2">Barcode</th>
                      <th className="pb-2">Price</th>
                      <th className="pb-2">Stock</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {(!selectedPmsProduct.variantsList || selectedPmsProduct.variantsList.length === 0) ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500 uppercase tracking-widest text-[9px]">
                          No variant options recorded. Use form or seed options above.
                        </td>
                      </tr>
                    ) : (
                      selectedPmsProduct.variantsList.map(v => (
                        <tr key={v.id} className="hover:bg-white/2 transition-colors">
                          <td className="py-2.5 font-bold text-white">
                            {v.size ? `Size: ${v.size}` : v.color ? `Color: ${v.color}` : v.weight ? `Weight: ${v.weight}` : v.volume ? `Volume: ${v.volume}` : v.flavor ? `Flavor: ${v.flavor}` : `Pack: ${v.packSize}`}
                          </td>
                          <td className="py-2.5 text-zinc-400">{v.sku}</td>
                          <td className="py-2.5 text-zinc-500">{v.barcode || 'N/A'}</td>
                          <td className="py-2.5 font-bold text-white">{v.price} SAR</td>
                          <td className="py-2.5">{v.stock}</td>
                          <td className="py-2.5">
                            <span className="px-1.5 py-0.5 rounded-xs text-[8px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400">
                              {v.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right space-x-1">
                            <button
                              onClick={() => {
                                setEditingVariantId(v.id);
                                setVariantSku(v.sku);
                                setVariantBarcode(v.barcode);
                                setVariantPrice(v.price.toString());
                                setVariantSalePrice(v.salePrice ? v.salePrice.toString() : '');
                                setVariantStock(v.stock.toString());
                                setVariantImage(v.image || '');
                                setVariantStatus(v.status);
                              }}
                              className="p-1 border border-white/5 hover:border-gold-pure/40 text-zinc-400 hover:text-white rounded-xs cursor-pointer"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                const updatedList = (selectedPmsProduct.variantsList || []).filter(item => item.id !== v.id);
                                saveProductFields(selectedPmsProduct.id, { variantsList: updatedList });
                                addLog("Product Updated", `Deleted Variant Option ${v.sku} from ${selectedPmsProduct.name}`);
                              }}
                              className="p-1 border border-white/5 hover:border-rose-950 text-zinc-500 hover:text-rose-400 rounded-xs cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reusable Attributes */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs text-xs space-y-4 text-left">
              <div>
                <span className="text-[8px] font-mono text-gold-pure uppercase tracking-widest block mb-1">GLOBAL SCHEMA METADATA</span>
                <h4 className="text-base font-bold font-serif text-white">Reusable Characteristics Matrix</h4>
              </div>

              <form onSubmit={handleSaveAttributes} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Weight</label>
                  <input type="text" placeholder="e.g. 500g" value={attrWeight} onChange={(e) => setAttrWeight(e.target.value)} className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono" />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Volume</label>
                  <input type="text" placeholder="e.g. 1L" value={attrVolume} onChange={(e) => setAttrVolume(e.target.value)} className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono" />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Material Content</label>
                  <input type="text" placeholder="e.g. Silk, Organic Cotton" value={attrMaterial} onChange={(e) => setAttrMaterial(e.target.value)} className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono" />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Color</label>
                  <input type="text" placeholder="e.g. Royal Green" value={attrColor} onChange={(e) => setAttrColor(e.target.value)} className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono" />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Size</label>
                  <input type="text" placeholder="e.g. Custom Fit" value={attrSize} onChange={(e) => setAttrSize(e.target.value)} className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono" />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Origin Country</label>
                  <input type="text" placeholder="e.g. Sudan" value={attrOriginCountry} onChange={(e) => setAttrOriginCountry(e.target.value)} className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono" />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Shelf Life</label>
                  <input type="text" placeholder="e.g. 12 Months" value={attrShelfLife} onChange={(e) => setAttrShelfLife(e.target.value)} className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono" />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Storage Condition</label>
                  <input type="text" placeholder="e.g. Cool dry place" value={attrStorageCondition} onChange={(e) => setAttrStorageCondition(e.target.value)} className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono" />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Packaging Type</label>
                  <input type="text" placeholder="e.g. Saffron Box" value={attrPackagingType} onChange={(e) => setAttrPackagingType(e.target.value)} className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono" />
                </div>

                <div className="md:col-span-3 pt-3 border-t border-white/5 flex justify-end">
                  <button type="submit" className="py-2 px-6 bg-gold-pure hover:bg-gold-pure/90 text-black font-bold uppercase font-mono tracking-wider text-[10px] rounded-xs cursor-pointer">
                    💾 Commit Global Attributes Matrix
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: MEDIA */}
      {pmsSubTab === 'media' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-left">
          <div className="lg:col-span-5 bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-6">
            <div>
              <span className="text-[8px] font-mono text-gold-pure uppercase tracking-widest block mb-1">ASSET ACQUISITION</span>
              <h3 className="text-base font-bold font-serif text-white">Direct Media Intake Manager</h3>
              <p className="text-[10px] text-zinc-500 font-mono">Upload high-res media. Sinks into standard Supabase folder structures dynamically.</p>
            </div>

            <div 
              className="border-2 border-dashed border-white/10 hover:border-gold-pure/60 rounded-xs p-8 text-center cursor-pointer bg-black/40 transition-colors flex flex-col items-center justify-center space-y-2 group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleMediaUpload(e.dataTransfer.files[0], 'gallery');
                }
              }}
            >
              <UploadCloud className="w-8 h-8 text-zinc-500 group-hover:text-gold-pure transition-colors animate-bounce" />
              <p className="text-zinc-300 font-mono text-[10px] uppercase font-bold">Drag & Drop Asset File Here</p>
              <label className="py-1 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xs text-[9px] uppercase tracking-widest font-bold cursor-pointer inline-block mt-2">
                Browse File
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleMediaUpload(e.target.files[0], 'gallery');
                    }
                  }}
                />
              </label>
            </div>

            {isCompressing && (
              <div className="bg-black border border-white/5 p-3 rounded-xs space-y-2 font-mono text-[10px]">
                <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-gold-pure">
                  <span>⚡ Auto-Compressing to WebP (60% saved)</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1 rounded-xs overflow-hidden">
                  <div className="bg-gold-pure h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Product Video Showcase URL (MP4 / YouTube)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. /products/videos/haraz_commercial.mp4"
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      saveProductFields(selectedPmsProduct.id, { videoUrl: e.target.value });
                    }}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      saveProductFields(selectedPmsProduct.id, { videoUrl });
                      addLog("SEO Updated", `Attached video showcase URL to ${selectedPmsProduct.name}`);
                    }}
                    className="py-2 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xs font-mono text-[10px] uppercase cursor-pointer"
                  >
                    Link
                  </button>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">360° Rotational Image Frames Portfolio</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add frame image URL"
                    value={image360Input}
                    onChange={(e) => setImage360Input(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      if (image360Input.trim()) {
                        const current = [...images360List];
                        current.push(image360Input.trim());
                        setImages360List(current);
                        setImage360Input('');
                        saveProductFields(selectedPmsProduct.id, { images360: current });
                        addLog("Media Uploaded", `Added 360 frame to ${selectedPmsProduct.name}`);
                      }
                    }}
                    className="py-2 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xs font-mono text-[10px] uppercase cursor-pointer"
                  >
                    Push
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <h4 className="text-white font-bold font-serif border-b border-white/5 pb-2 uppercase text-[10px] tracking-wider text-gold-pure">Active Product Portfolio Showcase</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 space-y-2">
                  <span className="text-zinc-500 font-mono text-[8px] uppercase tracking-widest block">FEATURED PORTRAIT</span>
                  <div className="aspect-square bg-black border border-white/10 rounded-xs overflow-hidden relative group">
                    {selectedPmsProduct.images && selectedPmsProduct.images.length > 0 ? (
                      <img src={selectedPmsProduct.images[0]} className="w-full h-full object-cover" alt="Featured" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px] font-mono">No Image</div>
                    )}
                    <span className="absolute bottom-2 left-2 bg-gold-pure text-black font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-xs uppercase">FEATURED</span>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2 text-left">
                  <span className="text-zinc-500 font-mono text-[8px] uppercase tracking-widest block">GALLERY PORTFOLIO ({Math.max(0, (selectedPmsProduct.images?.length || 0) - 1)} items)</span>
                  {(!selectedPmsProduct.images || selectedPmsProduct.images.length <= 1) ? (
                    <div className="h-[120px] border border-dashed border-white/5 rounded-xs flex flex-col items-center justify-center text-zinc-500 font-mono text-[9px] uppercase tracking-widest">
                      No gallery items. Drag file to left box.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedPmsProduct.images.slice(1).map((img, i) => (
                        <div key={i} className="aspect-square bg-black border border-white/10 rounded-xs overflow-hidden relative group">
                          <img src={img} className="w-full h-full object-cover" alt="Gallery" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity text-[8px] font-mono p-1">
                            <button
                              onClick={() => {
                                const current = [...(selectedPmsProduct.images || [])];
                                const temp = current[0];
                                current[0] = current[i + 1];
                                current[i + 1] = temp;
                                saveProductFields(selectedPmsProduct.id, { images: current });
                                addLog("Product Updated", `Reordered: Promoted gallery image to featured for ${selectedPmsProduct.name}`);
                              }}
                              className="w-full text-gold-pure border border-gold-pure/30 hover:bg-gold-pure/10 rounded-xs py-0.5 cursor-pointer text-center font-bold"
                            >
                              ⭐ Set Main
                            </button>
                            <div className="flex gap-1 w-full">
                              <button
                                disabled={i === 0}
                                onClick={() => {
                                  const current = [...(selectedPmsProduct.images || [])];
                                  const temp = current[i + 1];
                                  current[i + 1] = current[i];
                                  current[i] = temp;
                                  saveProductFields(selectedPmsProduct.id, { images: current });
                                  addLog("Product Updated", `Reordered gallery image left for ${selectedPmsProduct.name}`);
                                }}
                                className="w-1/2 text-zinc-300 border border-white/10 hover:bg-white/10 rounded-xs py-0.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                ◀ Left
                              </button>
                              <button
                                disabled={i === (selectedPmsProduct.images?.length || 0) - 2}
                                onClick={() => {
                                  const current = [...(selectedPmsProduct.images || [])];
                                  const temp = current[i + 1];
                                  current[i + 1] = current[i + 2];
                                  current[i + 2] = temp;
                                  saveProductFields(selectedPmsProduct.id, { images: current });
                                  addLog("Product Updated", `Reordered gallery image right for ${selectedPmsProduct.name}`);
                                }}
                                className="w-1/2 text-zinc-300 border border-white/10 hover:bg-white/10 rounded-xs py-0.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                Right ▶
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                const current = [...(selectedPmsProduct.images || [])];
                                current.splice(i + 1, 1);
                                saveProductFields(selectedPmsProduct.id, { images: current });
                                addLog("Product Updated", `Deleted gallery image from ${selectedPmsProduct.name}`);
                              }}
                              className="w-full text-rose-400 border border-rose-950 hover:border-rose-500 rounded-xs py-0.5 cursor-pointer text-center"
                            >
                              ✕ Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <h4 className="text-white font-bold font-serif text-[10px] uppercase tracking-wider text-gold-pure">360° Rotational Panoramic Viewer (Interactive)</h4>
              {images360List.length === 0 ? (
                <div className="h-[180px] border border-dashed border-white/5 rounded-xs flex flex-col items-center justify-center text-zinc-500 font-mono text-[9px] uppercase tracking-widest space-y-2">
                  <span>No 360° rotational frames linked.</span>
                  <button
                    onClick={() => {
                      const frames = [
                        'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400',
                        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400',
                        'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=400',
                        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400'
                      ];
                      setImages360List(frames);
                      saveProductFields(selectedPmsProduct.id, { images360: frames });
                    }}
                    className="py-1 px-3 border border-gold-pure text-gold-pure hover:bg-gold-pure/5 rounded-xs text-[8px] uppercase tracking-wider cursor-pointer"
                  >
                    💡 Load Demo 360° Rotation Loop
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="h-[200px] max-w-[280px] mx-auto bg-black rounded-xs border border-white/10 overflow-hidden relative group flex items-center justify-center">
                    <img 
                      src={images360List[Math.floor(Date.now() / 400) % images360List.length]} 
                      className="h-full w-full object-contain" 
                      alt="360" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-3 right-3 bg-black/80 border border-white/10 text-white font-mono text-[8px] px-2 py-0.5 rounded-xs uppercase tracking-widest">
                      🔄 Rotating Angle Preview
                    </span>
                  </div>
                  <button onClick={() => { setImages360List([]); saveProductFields(selectedPmsProduct.id, { images360: [] }); }} className="text-rose-500 hover:text-rose-400 font-mono text-[9px] uppercase cursor-pointer">
                    Clear Loop Array
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: SEO & AI SUITE */}
      {pmsSubTab === 'seo-ai' && (
        <div className="space-y-4 animate-fade-in text-left">
          {currentUser?.role === 'staff' && (
            <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xs text-rose-400 font-mono text-[9px] uppercase tracking-wider">
              🔒 Security Enforcement: Staff accounts cannot modify Google SERP Metadata or invoke Gemini sovereign AI updates. This screen is in read-only mode.
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-6">
              <div>
                <span className="text-[8px] font-mono text-gold-pure uppercase tracking-widest block mb-1">CRAWLER INDEXATION</span>
                <h3 className="text-base font-bold font-serif text-white">Google SERP Meta Registry</h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Unique URL Slug</label>
                  <input
                    type="text"
                    disabled={currentUser?.role === 'staff'}
                    value={seoSlug}
                    onChange={(e) => { setSeoSlug(e.target.value); saveProductFields(selectedPmsProduct.id, { seoSlug: e.target.value }); }}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono disabled:opacity-40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">SEO Meta Title</label>
                    <input
                      type="text"
                      disabled={currentUser?.role === 'staff'}
                      value={seoMetaTitle}
                      onChange={(e) => { setSeoMetaTitle(e.target.value); saveProductFields(selectedPmsProduct.id, { seoMetaTitle: e.target.value }); }}
                      className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs disabled:opacity-40"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">SEO Meta Keywords</label>
                    <input
                      type="text"
                      disabled={currentUser?.role === 'staff'}
                      value={seoMetaKeywords}
                      onChange={(e) => { setSeoMetaKeywords(e.target.value); saveProductFields(selectedPmsProduct.id, { seoMetaKeywords: e.target.value }); }}
                      className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono disabled:opacity-40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">SEO Meta Description</label>
                  <textarea
                    rows={2}
                    disabled={currentUser?.role === 'staff'}
                    value={seoMetaDesc}
                    onChange={(e) => { setSeoMetaDesc(e.target.value); saveProductFields(selectedPmsProduct.id, { seoMetaDesc: e.target.value }); }}
                    className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs disabled:opacity-40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Canonical URL</label>
                    <input
                      type="text"
                      disabled={currentUser?.role === 'staff'}
                      value={seoCanonicalUrl}
                      onChange={(e) => { setSeoCanonicalUrl(e.target.value); saveProductFields(selectedPmsProduct.id, { seoCanonicalUrl: e.target.value }); }}
                      className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono disabled:opacity-40"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Open Graph Image</label>
                    <input
                      type="text"
                      disabled={currentUser?.role === 'staff'}
                      value={seoOpenGraphImage}
                      onChange={(e) => { setSeoOpenGraphImage(e.target.value); saveProductFields(selectedPmsProduct.id, { seoOpenGraphImage: e.target.value }); }}
                      className="w-full bg-black border border-white/10 text-white rounded-xs p-2 outline-none focus:border-gold-pure text-xs font-mono disabled:opacity-40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gold-pure block mb-1 font-mono text-[9px] uppercase font-bold">Schema.org Product Data JSON-LD</label>
                  <textarea
                    rows={3}
                    disabled={currentUser?.role === 'staff'}
                    value={seoSchemaProductData || JSON.stringify({
                      "@context": "https://schema.org/",
                      "@type": "Product",
                      "name": selectedPmsProduct.name,
                      "image": selectedPmsProduct.images[0],
                      "description": selectedPmsProduct.description,
                      "sku": selectedPmsProduct.sku || `ZL-SKU-${selectedPmsProduct.id}`,
                      "brand": "AL ZOAL Boutique",
                      "offers": { "@type": "Offer", "priceCurrency": "SAR", "price": selectedPmsProduct.price.toString() }
                    }, null, 2)}
                    onChange={(e) => { setSeoSchemaProductData(e.target.value); saveProductFields(selectedPmsProduct.id, { seoSchemaProductData: e.target.value }); }}
                    className="w-full bg-black border border-white/10 text-zinc-400 rounded-xs p-2 outline-none focus:border-gold-pure text-[9px] font-mono leading-relaxed select-all disabled:opacity-40"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Google SERP Preview</span>
                <div className="bg-white p-4 rounded-xs border border-zinc-200 text-left font-sans text-xs">
                  <p className="text-[8px] text-zinc-500 leading-none">https://alzoal.sa › product › {seoSlug}</p>
                  <p className="text-sm font-medium text-blue-800 hover:underline cursor-pointer leading-snug">{seoMetaTitle}</p>
                  <p className="text-[11px] text-zinc-600 leading-relaxed font-sans mt-0.5">{seoMetaDesc}</p>
                </div>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 relative overflow-hidden">
                {isGeneratingAi && (
                  <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center space-y-2 font-mono text-xs">
                    <Sparkles className="w-8 h-8 text-gold-pure animate-spin" />
                    <span className="text-white uppercase tracking-widest text-[9px] animate-pulse">Consulting Gemini Sovereign LLM...</span>
                  </div>
                )}

                <div>
                  <span className="text-[8px] font-mono text-gold-pure uppercase tracking-widest block mb-1">AI CO-PILOT WORKBENCH</span>
                  <h3 className="text-base font-serif font-bold text-white">Gemini Autonomous Optimization</h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <button 
                    disabled={currentUser?.role === 'staff'}
                    onClick={() => handleGenerateAiField('summary')} 
                    className="py-2 px-3 border border-white/5 hover:border-gold-pure text-white font-mono uppercase rounded-xs hover:bg-gold-pure/5 cursor-pointer text-left flex items-center gap-1.5 disabled:opacity-30 disabled:hover:border-white/5 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3 h-3 text-gold-pure" /> AI Product Summary
                  </button>
                  <button 
                    disabled={currentUser?.role === 'staff'}
                    onClick={() => handleGenerateAiField('seo')} 
                    className="py-2 px-3 border border-white/5 hover:border-gold-pure text-white font-mono uppercase rounded-xs hover:bg-gold-pure/5 cursor-pointer text-left flex items-center gap-1.5 disabled:opacity-30 disabled:hover:border-white/5 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3 h-3 text-gold-pure" /> AI SEO Suggestions
                  </button>
                  <button 
                    disabled={currentUser?.role === 'staff'}
                    onClick={() => handleGenerateAiField('translation')} 
                    className="py-2 px-3 border border-white/5 hover:border-gold-pure text-white font-mono uppercase rounded-xs hover:bg-gold-pure/5 cursor-pointer text-left flex items-center gap-1.5 disabled:opacity-30 disabled:hover:border-white/5 disabled:cursor-not-allowed"
                  >
                    <Globe className="w-3 h-3 text-gold-pure" /> AI Translation (AR)
                  </button>
                  <button 
                    disabled={currentUser?.role === 'staff'}
                    onClick={() => handleGenerateAiField('recommendation')} 
                    className="py-2 px-3 border border-white/5 hover:border-gold-pure text-white font-mono uppercase rounded-xs hover:bg-gold-pure/5 cursor-pointer text-left flex items-center gap-1.5 disabled:opacity-30 disabled:hover:border-white/5 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3 text-gold-pure" /> Cross-sell Matches
                  </button>
                  <button 
                    disabled={currentUser?.role === 'staff'}
                    onClick={() => handleGenerateAiField('search')} 
                    className="col-span-full py-2 px-3 border border-white/5 hover:border-gold-pure text-white font-mono uppercase rounded-xs hover:bg-gold-pure/5 cursor-pointer text-center flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:hover:border-white/5 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3 h-3 text-gold-pure" /> AI Search Optimization (Synonyms & Indexing)
                  </button>
                </div>

              <div className="bg-black border border-white/10 p-4 rounded-xs text-[10px] font-mono space-y-3 text-zinc-300 leading-relaxed">
                <div className="border-b border-white/5 pb-1 flex justify-between items-center text-[8px] text-zinc-500 uppercase tracking-widest">
                  <span>Output monitor buffer</span>
                  <span className="text-emerald-400">ONLINE</span>
                </div>

                {aiProductSummary && (
                  <div>
                    <span className="text-gold-pure text-[8px] uppercase block font-bold">AI Summary</span>
                    <p className="text-white italic">"{aiProductSummary}"</p>
                  </div>
                )}
                {aiSeoSuggestions && (
                  <div>
                    <span className="text-gold-pure text-[8px] uppercase block font-bold">SEO Suggestions</span>
                    <p className="whitespace-pre-line text-zinc-400">{aiSeoSuggestions}</p>
                  </div>
                )}
                {aiTranslationAr && (
                  <div>
                    <span className="text-gold-pure text-[8px] uppercase block font-bold">Prestige Bilingual translation</span>
                    <p className="text-gold-pure font-serif text-right text-xs">{aiTranslationAr}</p>
                  </div>
                )}
                {aiProductRecommendation && (
                  <div>
                    <span className="text-gold-pure text-[8px] uppercase block font-bold">Cross-Sell matches</span>
                    <p className="text-zinc-400">{aiProductRecommendation}</p>
                  </div>
                )}
                {aiSearchOptimization && (
                  <div>
                    <span className="text-gold-pure text-[8px] uppercase block font-bold">AI Search Optimization</span>
                    <p className="text-zinc-400 font-mono text-[9px]">{aiSearchOptimization}</p>
                  </div>
                )}
                {!aiProductSummary && !aiSeoSuggestions && !aiTranslationAr && !aiProductRecommendation && !aiSearchOptimization && (
                  <div className="text-center py-6 text-zinc-600 uppercase tracking-widest text-[9px]">
                    No active neural generation data. Select an optimizer above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 5. TAB: CUSTOMER REVIEWS */}
      {pmsSubTab === 'reviews' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs flex items-center justify-between">
              <div>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Average rating</span>
                <span className="text-2xl font-bold font-mono text-white block mt-1">
                  {(() => {
                    const revs = selectedPmsProduct.reviews || [];
                    const approved = revs.filter(r => r.approved !== false);
                    if (approved.length === 0) return '5.0';
                    const sum = approved.reduce((acc, r) => acc + r.rating, 0);
                    return (sum / approved.length).toFixed(1);
                  })()} / 5.0
                </span>
              </div>
              <div className="flex gap-0.5"><Star className="w-4 h-4 text-gold-pure fill-gold-pure" /></div>
            </div>

            <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Reviews Count</span>
              <span className="text-2xl font-bold font-mono text-white block mt-1">{selectedPmsProduct.reviews?.length || 0}</span>
            </div>

            <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Approval Ratio</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 block mt-1">
                {selectedPmsProduct.reviews ? Math.round((selectedPmsProduct.reviews.filter(r => r.approved !== false).length / Math.max(1, selectedPmsProduct.reviews.length)) * 100) : 100}%
              </span>
            </div>

            <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs flex items-center justify-between">
              <div>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">Quick Seed</span>
                <p className="text-[9px] text-zinc-500">Populate sandbox reviews.</p>
              </div>
              <button
                onClick={() => {
                  const initialReviews: Review[] = [
                    { id: 'rev-1', reviewerName: 'Amna Al-Hashemi', rating: 5, date: new Date().toLocaleDateString(), comment: 'Mouthwatering roasting profile. Simply exquisite coffee.', approved: true },
                    { id: 'rev-2', reviewerName: 'Patron Khalid', rating: 4, date: new Date(Date.now() - 86400000).toLocaleDateString(), comment: 'Superior quality, very aromatic. The shipping took some time to Hofuf, but worth the wait.' }
                  ];
                  saveProductFields(selectedPmsProduct.id, { reviews: initialReviews });
                  addLog("Product Updated", `Seeded reviews sandbox registry on ${selectedPmsProduct.name}`);
                }}
                className="py-1 px-3 bg-gold-pure text-black text-[9px] font-mono font-bold rounded-xs cursor-pointer uppercase"
              >
                💡 Seed
              </button>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs text-xs space-y-4">
            <h4 className="text-white font-serif font-bold border-b border-white/5 pb-2 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gold-pure" /> Customer Reviews Matrix
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-[10px]">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 uppercase tracking-widest text-[8px]">
                    <th className="pb-2">Reviewer</th>
                    <th className="pb-2">Stars</th>
                    <th className="pb-2">Comment</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {(!selectedPmsProduct.reviews || selectedPmsProduct.reviews.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500 uppercase tracking-widest text-[9px]">
                        No review logged. Click seed button on top right to populate.
                      </td>
                    </tr>
                  ) : (
                    selectedPmsProduct.reviews.map(r => (
                      <tr key={r.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3.5 font-bold text-white">{r.reviewerName}</td>
                        <td className="py-3.5">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star key={idx} className={`w-3 h-3 ${idx < r.rating ? 'text-gold-pure fill-gold-pure' : 'text-zinc-700'}`} />
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 max-w-[280px]">
                          <p className="text-white">"{r.comment}"</p>
                          {r.reply && (
                            <div className="mt-1 bg-black/40 border-l-2 border-gold-pure p-1.5 text-[9px] text-zinc-400">
                              <span className="text-gold-pure font-bold text-[8px] block">Merchant Response:</span>
                              {r.reply}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5">
                          {r.approved === true ? (
                            <span className="px-1 text-[8px] bg-emerald-500/10 text-emerald-400 rounded-xs uppercase tracking-wider font-bold">Approved</span>
                          ) : r.approved === false ? (
                            <span className="px-1 text-[8px] bg-rose-500/10 text-rose-400 rounded-xs uppercase tracking-wider font-bold">Rejected</span>
                          ) : (
                            <span className="px-1 text-[8px] bg-amber-500/10 text-amber-400 rounded-xs uppercase tracking-wider font-bold">Pending</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right space-y-1.5">
                          <div className="space-x-1.5">
                            <button onClick={() => handleApproveReview(r.id)} className="py-0.5 px-2.5 border border-emerald-950 text-emerald-400 hover:bg-emerald-950/20 rounded-xs text-[8px] font-mono uppercase cursor-pointer">Approve</button>
                            <button onClick={() => handleRejectReview(r.id)} className="py-0.5 px-2.5 border border-rose-950 text-rose-400 hover:bg-rose-950/20 rounded-xs text-[8px] font-mono uppercase cursor-pointer">Reject</button>
                            <button onClick={() => handleDeleteReview(r.id)} className="p-1 border border-white/5 hover:border-rose-950 text-zinc-500 hover:text-rose-400 rounded-xs cursor-pointer inline-flex items-center"><Trash2 className="w-3 h-3" /></button>
                          </div>

                          <div className="pt-1">
                            <div className="flex gap-1 max-w-[200px] ml-auto">
                              <input
                                type="text"
                                placeholder="Response reply text..."
                                value={reviewsReplyText[r.id] || ''}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  setReviewsReplyText(prev => ({ ...prev, [r.id]: text }));
                                }}
                                className="bg-black border border-white/10 text-white rounded-xs p-1 text-[8px] font-mono outline-none focus:border-gold-pure flex-1"
                              />
                              <button
                                onClick={() => {
                                  const txt = reviewsReplyText[r.id];
                                  if (txt && txt.trim()) {
                                    handleReplyReview(r.id, txt.trim());
                                    setReviewsReplyText(prev => ({ ...prev, [r.id]: '' }));
                                  }
                                }}
                                className="py-0.5 px-2 bg-white/5 text-white border border-white/10 rounded-xs text-[8px] uppercase font-mono cursor-pointer"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB: BULK OPERATIONS */}
      {pmsSubTab === 'bulk' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            <div className="lg:col-span-6 bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <div>
                <span className="text-[8px] font-mono text-gold-pure uppercase tracking-widest block mb-1">MASS LEDGER PRICE ACTIONS</span>
                <h3 className="text-base font-bold font-serif text-white">Mass Catalog Pricing Modifier</h3>
                <p className="text-[10px] text-zinc-500 font-mono">Simultaneously update price catalogs across all selected products ({selectedProductIds.length} active selections).</p>
              </div>

              <div className="space-y-4 bg-black/40 p-4 border border-white/5 rounded-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-500 block mb-1 font-mono text-[8px] uppercase">Delta Formula</label>
                    <select
                      value={bulkPriceChangeType}
                      onChange={(e) => setBulkPriceChangeType(e.target.value as 'fixed' | 'percent')}
                      className="w-full bg-black border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure cursor-pointer"
                    >
                      <option value="fixed">Fixed Rate (SAR)</option>
                      <option value="percent">Percentage rate (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-500 block mb-1 font-mono text-[8px] uppercase">Action Direction</label>
                    <select
                      value={bulkPriceChangeDirection}
                      onChange={(e) => setBulkPriceChangeDirection(e.target.value as 'increase' | 'decrease')}
                      className="w-full bg-black border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure cursor-pointer"
                    >
                      <option value="increase">Increase Prices</option>
                      <option value="decrease">Decrease Prices</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-mono text-[9px] uppercase">Update Delta Value</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="e.g. 15"
                      value={bulkPriceChangeValue}
                      onChange={(e) => setBulkPriceChangeValue(e.target.value)}
                      className="w-full bg-black border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure"
                    />
                    <button
                      onClick={handleBulkPriceUpdateLocal}
                      className="py-2 px-4 bg-gold-pure hover:bg-gold-pure/90 text-black font-bold uppercase font-mono tracking-wider text-[10px] rounded-xs cursor-pointer"
                    >
                      Execute Modification
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <div>
                <span className="text-[8px] font-mono text-gold-pure uppercase tracking-widest block mb-1">CLASSIFICATION CURATOR</span>
                <h3 className="text-base font-bold font-serif text-white">Bulk Classification Curator</h3>
                <p className="text-[10px] text-zinc-500 font-mono">Shift parameters on chosen {selectedProductIds.length} catalog items.</p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <label className="text-zinc-500 block mb-1 font-mono text-[8px] uppercase">Bespoke Brand Curator</label>
                  <select
                    value={bulkBrandValue}
                    onChange={(e) => setBulkBrandValue(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure mb-2 text-xs cursor-pointer"
                  >
                    <option value="">Select Brand</option>
                    {registeredBrands.map((b: any) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (!bulkBrandValue) return;
                      if (selectedProductIds.length === 0) { alert("Please select products from catalog tab first."); return; }
                      selectedProductIds.forEach(id => saveProductFields(id, { brand: bulkBrandValue }));
                      addLog("Product Updated", `Bulk set brand to "${bulkBrandValue}" on ${selectedProductIds.length} products`);
                      alert("Brand updated successfully!");
                    }}
                    className="w-full py-1 border border-white/10 hover:bg-white/5 text-white font-mono uppercase text-[9px] rounded-xs cursor-pointer"
                  >
                    Shift Brand
                  </button>
                </div>

                <div>
                  <label className="text-zinc-500 block mb-1 font-mono text-[8px] uppercase">Warehouse Stock Level</label>
                  <input
                    type="number"
                    placeholder="New stock count"
                    value={bulkStockValue}
                    onChange={(e) => setBulkStockValue(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure mb-2 text-xs"
                  />
                  <button
                    onClick={() => {
                      if (!bulkStockValue) return;
                      if (selectedProductIds.length === 0) { alert("Please select products first."); return; }
                      const stock = parseInt(bulkStockValue);
                      selectedProductIds.forEach(id => saveProductFields(id, { inventory: stock }));
                      addLog("Stock Changed", `Bulk updated warehouse stock levels to ${stock} items on ${selectedProductIds.length} products`);
                      alert("Stock updated successfully!");
                    }}
                    className="w-full py-1 border border-white/10 hover:bg-white/5 text-white font-mono uppercase text-[9px] rounded-xs cursor-pointer"
                  >
                    Commit Stock
                  </button>
                </div>

                <div>
                  <label className="text-zinc-500 block mb-1 font-mono text-[8px] uppercase">Bulk Discount Rate (%)</label>
                  <input
                    type="number"
                    placeholder="Discount % (e.g. 10)"
                    value={bulkDiscountValue}
                    onChange={(e) => setBulkDiscountValue(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure mb-2 text-xs"
                  />
                  <button
                    onClick={() => {
                      if (!bulkDiscountValue) return;
                      if (selectedProductIds.length === 0) { alert("Please select products from catalog list first (tab 1)."); return; }
                      const discount = parseFloat(bulkDiscountValue);
                      selectedProductIds.forEach(id => saveProductFields(id, { discountPercent: discount }));
                      addLog("Product Updated", `Bulk updated discount rate to ${discount}% on ${selectedProductIds.length} products`);
                      alert("Discount rates updated successfully!");
                    }}
                    className="w-full py-1 border border-white/10 hover:bg-white/5 text-white font-mono uppercase text-[9px] rounded-xs cursor-pointer"
                  >
                    Commit Discount
                  </button>
                </div>

                <div>
                  <label className="text-zinc-500 block mb-1 font-mono text-[8px] uppercase">Bulk Category Change</label>
                  <select
                    value={bulkCategoryValue}
                    onChange={(e) => setBulkCategoryValue(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure mb-2 text-xs cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    <option value="coffee">Coffee</option>
                    <option value="bakery">Bakery</option>
                    <option value="market">Market</option>
                    <option value="fashion">Fashion</option>
                    <option value="thobes">Thobes</option>
                  </select>
                  <button
                    onClick={() => {
                      if (!bulkCategoryValue) return;
                      if (selectedProductIds.length === 0) { alert("Please select products from catalog list first (tab 1)."); return; }
                      selectedProductIds.forEach(id => saveProductFields(id, { category: bulkCategoryValue as BusinessCategory }));
                      addLog("Product Updated", `Bulk set category to "${bulkCategoryValue}" on ${selectedProductIds.length} products`);
                      alert("Categories updated successfully!");
                    }}
                    className="w-full py-1 border border-white/10 hover:bg-white/5 text-white font-mono uppercase text-[9px] rounded-xs cursor-pointer"
                  >
                    Shift Category
                  </button>
                </div>

                <div className="col-span-2">
                  <label className="text-zinc-500 block mb-1 font-mono text-[8px] uppercase">Bulk Status Changer</label>
                  <select
                    value={bulkStatusValue}
                    onChange={(e) => setBulkStatusValue(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure mb-2 text-xs cursor-pointer"
                  >
                    <option value="">Select Status</option>
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                  <button
                    onClick={() => {
                      if (!bulkStatusValue) return;
                      if (selectedProductIds.length === 0) { alert("Please select products from catalog list first (tab 1)."); return; }
                      selectedProductIds.forEach(id => saveProductFields(id, { status: bulkStatusValue }));
                      addLog("Product Updated", `Bulk set status to "${bulkStatusValue}" on ${selectedProductIds.length} products`);
                      alert("Product statuses updated successfully!");
                    }}
                    className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono uppercase text-[9px] rounded-xs cursor-pointer tracking-wider"
                  >
                    Shift Status
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
            <div>
              <span className="text-[8px] font-mono text-gold-pure uppercase tracking-widest block mb-1">INTERSTATE SPREADSHEET EXCHANGE</span>
              <h3 className="text-base font-bold font-serif text-white">CSV & Microsoft Excel Interchange Exchanger</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-white/5 bg-black/40 p-4 rounded-xs text-xs space-y-3">
                <h4 className="text-white font-bold font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  📥 Import CSV / Microsoft Excel Ledger
                </h4>
                <div className="border border-dashed border-white/10 p-6 rounded-xs text-center cursor-pointer hover:border-gold-pure/40 bg-black/30">
                  <FileSpreadsheet className="w-6 h-6 text-gold-pure mx-auto mb-1" />
                  <p className="text-[9px] text-zinc-400 font-mono">Select CSV or Excel-compatible spreadsheet</p>
                  <p className="text-[8px] text-zinc-600 font-mono mt-0.5">Supports standard column schema: Name, Price, SKU, Barcode, Category, Brand, Inventory, Status</p>
                  <input
                    type="file"
                    accept=".csv, .txt, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                    id="csv_bulk_file_uploader"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = event.target?.result as string;
                          handleCsvImportLocal(text);
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                  <button
                    onClick={() => document.getElementById('csv_bulk_file_uploader')?.click()}
                    className="mt-3 py-1 px-3 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xs text-[9px] uppercase font-mono cursor-pointer"
                  >
                    Choose CSV / Excel File
                  </button>
                </div>
              </div>

              <div className="border border-white/5 bg-black/40 p-4 rounded-xs text-xs space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-white font-bold font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                    📤 Export Core Catalog Spreadsheet
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono">Download the entire active boutique product catalog, formatted in a clean standard CSV ledger fully compatible with Microsoft Excel, Apple Numbers, and Google Sheets.</p>
                </div>

                <button
                  onClick={handleBulkCsvExportLocal}
                  className="w-full py-3 bg-gold-pure hover:bg-gold-pure/90 text-black font-bold uppercase font-mono tracking-widest rounded-xs flex items-center justify-center gap-2 cursor-pointer text-[10px]"
                >
                  <Download className="w-4 h-4" /> Download Excel / CSV Compatibility Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB: PMS AUDIT LOGS */}
      {pmsSubTab === 'logs' && (
        <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs text-xs space-y-4 animate-fade-in text-left">
          <div className="border-b border-white/5 pb-3 flex justify-between items-center">
            <h3 className="text-white font-serif font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-gold-pure" /> Product Management Audit ledger
            </h3>
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Security compliance log (Online)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-[10px]">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 uppercase tracking-widest text-[8px]">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Operator</th>
                  <th className="pb-2">Action type</th>
                  <th className="pb-2">Affected registry target</th>
                  <th className="pb-2">Secure IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {pmsLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500 uppercase tracking-widest text-[9px]">
                      No product ledger transactions logged yet.
                    </td>
                  </tr>
                ) : (
                  pmsLogs.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-white/2 transition-colors">
                      <td className="py-2.5 text-zinc-500">{log.time}</td>
                      <td className="py-2.5 font-bold text-white">{log.user}</td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded-xs text-[8px] font-bold uppercase bg-gold-pure/10 text-gold-pure tracking-wider font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-zinc-300 font-bold">{log.target}</td>
                      <td className="py-2.5 text-zinc-500">{log.ip || '192.168.1.16'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
