import React, { useState } from 'react';
import { 
  Sliders, Eye, CreditCard, Package, Layers, Settings, 
  Truck, Info, Globe, Sparkles, Star, MessageSquare, 
  Trash2, Plus, RefreshCw, X, CheckCircle2, Lock, FolderTree,
  Upload, FileUp, Image as ImageIcon, Video, AlertCircle, Loader2
} from 'lucide-react';
import { BusinessCategory, ProductVariant, Review, Question } from '../types';
import { ProductSeoSuite } from './ProductSeoSuite';
import { SafeImage } from '../imageRegistry';

interface ProductWorkspaceFormProps {
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
  currentUser: any;
  brands: any[];
  activeFormTab: 'general' | 'images' | 'pricing' | 'inventory' | 'variants' | 'specifications' | 'shipping' | 'ingredients' | 'seo' | 'ai' | 'reviews' | 'qa';
  setActiveFormTab: (tab: 'general' | 'images' | 'pricing' | 'inventory' | 'variants' | 'specifications' | 'shipping' | 'ingredients' | 'seo' | 'ai' | 'reviews' | 'qa') => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const ProductWorkspaceForm: React.FC<ProductWorkspaceFormProps> = ({
  formState,
  setFormState,
  currentUser,
  brands,
  activeFormTab,
  setActiveFormTab,
  onSubmit,
  onCancel
}) => {
  const [uploadingStatus, setUploadingStatus] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  const compressAndConvertWebp = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 1600;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to compress WebP image'));
            },
            'image/webp',
            0.85
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleEnterpriseFileUpload = async (files: FileList | File[], target: 'gallery' | '360' | 'thumbnail' | 'video') => {
    if (!files || files.length === 0) return;

    setUploadingStatus('Compressing & generating WebP container...');
    setUploadProgress(20);

    try {
      const fileList = Array.from(files);
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadingStatus(`Processing ${file.name} (${i + 1}/${fileList.length})...`);
        
        let bucket = 'products';
        let folderPath = 'products';
        if (target === 'thumbnail') {
          folderPath = 'products/thumbs';
        } else if (target === 'gallery') {
          folderPath = 'products/gallery';
        } else if (target === '360') {
          folderPath = 'products/360';
        }

        const webpBlob = await compressAndConvertWebp(file);
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const nameWithoutExt = sanitizedName.substring(0, sanitizedName.lastIndexOf('.')) || sanitizedName;
        const filePath = `${folderPath}/${timestamp}_${nameWithoutExt}.webp`;

        setUploadProgress(60);
        setUploadingStatus(`Uploading to Supabase Storage (${filePath})...`);

        const formData = new FormData();
        formData.append('file', webpBlob, `${nameWithoutExt}.webp`);
        formData.append('bucket', bucket);
        formData.append('path', filePath);

        const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token') || 'dev-preview-token';
        let publicUrl = '';

        try {
          const res = await fetch('/api/storage/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              publicUrl = data.url;
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            console.warn('Backend storage upload returned status:', res.status, errData);
          }
        } catch (fetchErr) {
          console.warn('Storage upload network request failed:', fetchErr);
        }

        // Fallback to Data URL if storage upload failed or returned empty URL
        if (!publicUrl) {
          publicUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(webpBlob);
          });
        }

        setUploadProgress(100);

        if (target === 'thumbnail') {
          setFormState((prev: any) => ({
            ...prev,
            images: [publicUrl, ...(prev.images || []).filter((u: string) => u !== publicUrl)],
            image_urls: [publicUrl, ...(prev.image_urls || prev.images || []).filter((u: string) => u !== publicUrl)],
            image: publicUrl,
            image_url: publicUrl
          }));
        } else if (target === 'gallery') {
          setFormState((prev: any) => {
            const nextImages = [...(prev.images || []), publicUrl];
            return {
              ...prev,
              images: nextImages,
              image_urls: nextImages,
              image: prev.image || publicUrl,
              image_url: prev.image_url || publicUrl
            };
          });
        } else if (target === '360') {
          setFormState((prev: any) => ({
            ...prev,
            images360: [...(prev.images360 || []), publicUrl]
          }));
        } else if (target === 'video') {
          setFormState((prev: any) => ({
            ...prev,
            videoUrl: publicUrl
          }));
        }
      }
      setUploadingStatus('✓ Enterprise upload & WebP compression completed successfully!');
      setTimeout(() => setUploadingStatus(null), 3500);
    } catch (err: any) {
      console.error('Enterprise upload error:', err);
      setUploadingStatus(`❌ Upload error: ${err.message || 'Unknown error'}`);
      setTimeout(() => setUploadingStatus(null), 4000);
    } finally {
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs">
      {/* Advanced Product Management Tab Bar */}
      <div className="flex gap-1 border-b border-white/10 pb-1 font-mono text-[8.5px] uppercase tracking-wider overflow-x-auto max-w-full no-scrollbar whitespace-nowrap">
        {[
          { id: 'general', label: 'General', icon: Sliders },
          { id: 'images', label: 'Images', icon: Eye },
          { id: 'pricing', label: 'Pricing', icon: CreditCard },
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'variants', label: 'Variants', icon: Layers },
          { id: 'specifications', label: 'Specs', icon: Settings },
          { id: 'shipping', label: 'Shipping', icon: Truck },
          { id: 'ingredients', label: 'Ingredients', icon: Info },
          { id: 'seo', label: 'SEO', icon: Globe },
          { id: 'ai', label: 'AI Suite', icon: Sparkles },
          { id: 'reviews', label: 'Reviews', icon: Star },
          { id: 'qa', label: 'Q&A Desk', icon: MessageSquare }
        ].map(t => {
          const IconComponent = t.icon;
          const isSelected = activeFormTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveFormTab(t.id as any)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-t-xs border-t border-x transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'bg-zinc-900 border-gold-pure/40 text-gold-pure font-bold' 
                  : 'bg-black/20 border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* MANAGEMENT PANELS */}
      <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs min-h-[380px]">
        
        {/* 1. GENERAL TAB */}
        {activeFormTab === 'general' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h4 className="text-gold-pure font-mono text-[9.5px] uppercase tracking-widest flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> General Identity & Narratives
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-500 font-mono">Product Type Engine:</span>
                <select
                  value={formState.productType}
                  onChange={(e) => setFormState(prev => ({ ...prev, productType: e.target.value as any }))}
                  className="bg-black border border-gold-pure/30 px-2 py-0.5 rounded-xs text-gold-pure font-mono text-[9px] font-bold outline-none cursor-pointer"
                >
                  <option value="Coffee">☕ Coffee / Beans</option>
                  <option value="Bakery">🥐 Bakery / Artisanal</option>
                  <option value="Food">🍽️ Food / Gourmet</option>
                  <option value="Drink">🥤 Drink / Beverage</option>
                  <option value="Grocery">🛒 Grocery / Market</option>
                  <option value="Fashion">👗 Fashion / Custom</option>
                  <option value="Digital">💾 Digital / Virtual</option>
                  <option value="Gift Card">🎫 Gift Card</option>
                  <option value="Service">🛠️ Service / Exp</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Unified Product Name *</label>
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
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">English Name (EN)</label>
                <input 
                  type="text" 
                  value={formState.nameEn}
                  onChange={(e) => setFormState(prev => ({ ...prev, nameEn: e.target.value }))}
                  placeholder="e.g. Traditional Yemeni Haraz Coffee"
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block text-right font-mono">Arabic Name (AR)</label>
                <input 
                  type="text" 
                  value={formState.nameAr}
                  onChange={(e) => setFormState(prev => ({ ...prev, nameAr: e.target.value }))}
                  placeholder="مثال: قهوة حراز اليمنية الفاخرة"
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none text-right font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Brand / Roastery</label>
                <select
                  value={formState.brand}
                  onChange={(e) => setFormState(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                >
                  <option value="AL ZOAL Specialty Roasters">AL ZOAL Specialty Roasters (Default)</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Business Category</label>
                <select
                  value={formState.category}
                  onChange={(e) => setFormState(prev => ({ ...prev, category: e.target.value as BusinessCategory }))}
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                >
                  <option value="coffee">Coffee Products</option>
                  <option value="bakery">Bakery / Patisserie</option>
                  <option value="market">Market / Grocery</option>
                  <option value="fashion">Premium Fashion</option>
                  <option value="thobes">Traditional Clothing / Thobes</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Catalog Subcategory</label>
                <input 
                  type="text" 
                  value={formState.subcategory}
                  onChange={(e) => setFormState(prev => ({ ...prev, subcategory: e.target.value }))}
                  placeholder="e.g. Single Origin Specialty"
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Collection / Batch Series</label>
                <input 
                  type="text" 
                  value={formState.collection}
                  onChange={(e) => setFormState(prev => ({ ...prev, collection: e.target.value }))}
                  placeholder="e.g. Special Reserve 2026"
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Customer Tags (Comma Separated)</label>
                <input 
                  type="text" 
                  value={formState.tags}
                  onChange={(e) => setFormState(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g. heirloom, organic, light roast"
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Visual Labels / Ribbons (CSV)</label>
                <input 
                  type="text" 
                  value={formState.labels}
                  onChange={(e) => setFormState(prev => ({ ...prev, labels: e.target.value }))}
                  placeholder="e.g. Award Winner, Best Seller, New"
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Short Highlighting Bullet</label>
                <input 
                  type="text" 
                  value={formState.shortDescription}
                  onChange={(e) => setFormState(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="e.g. Notes of ripe red cherries, honey, and cardamom spice."
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Highlights & Key Selling Points</label>
                <input 
                  type="text" 
                  value={formState.highlights}
                  onChange={(e) => setFormState(prev => ({ ...prev, highlights: e.target.value }))}
                  placeholder="e.g. 100% Organic • Direct Trade • Shade Grown"
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Full Product Story & Description</label>
              <textarea 
                value={formState.description}
                onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Write the premium, detailed story of this product, its origins, artisanal production, and perfect serve."
                className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
              />
            </div>

            {/* Context-aware Dynamic Extra Fields */}
            <div className="p-3 bg-gold-pure/5 border border-gold-pure/15 rounded-xs space-y-2 mt-2">
              <span className="text-[9px] font-mono text-gold-pure uppercase tracking-widest block font-bold">
                🛡️ Dynamic Product Context Engine: {formState.productType} Settings
              </span>
              
              {formState.productType === 'Coffee' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 uppercase font-mono block">Roast Profile Level</label>
                    <select
                      value={formState.coffeeroastLevel}
                      onChange={(e) => setFormState(prev => ({ ...prev, coffeeroastLevel: e.target.value }))}
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-sans text-[9px]"
                    >
                      <option value="">Select Roast Level</option>
                      <option value="Light Roast">Light Roast</option>
                      <option value="Medium Roast">Medium Roast</option>
                      <option value="Medium-Dark Roast">Medium-Dark Roast</option>
                      <option value="Dark Roast">Dark Roast</option>
                      <option value="Double Roasted">Traditional Roasted</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 uppercase font-mono block">Grind Option Default</label>
                    <select
                      value={formState.coffeegrindOption}
                      onChange={(e) => setFormState(prev => ({ ...prev, coffeegrindOption: e.target.value }))}
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-sans text-[9px]"
                    >
                      <option value="">Select Default Grind</option>
                      <option value="Whole Beans">Whole Beans (Un-ground)</option>
                      <option value="Espresso Grind">Espresso Grind</option>
                      <option value="Drip Grind">Filter / Drip Grind</option>
                      <option value="French Press">French Press Grind</option>
                      <option value="Traditional Arabic">Traditional Arabic Grind</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 uppercase font-mono block">Processing Method</label>
                    <input 
                      type="text"
                      value={formState.coffeeprocessingMethod}
                      onChange={(e) => setFormState(prev => ({ ...prev, coffeeprocessingMethod: e.target.value }))}
                      placeholder="e.g. Natural Anaerobic Honey"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-sans text-[9px]"
                    />
                  </div>
                </div>
              )}

              {(formState.productType === 'Bakery' || formState.productType === 'Food' || formState.productType === 'Drink') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 uppercase font-mono block">Freshness Guarantee Window</label>
                    <input 
                      type="text"
                      value={formState.bakeryfreshness}
                      onChange={(e) => setFormState(prev => ({ ...prev, bakeryfreshness: e.target.value }))}
                      placeholder="e.g. Baked Fresh Daily"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-sans text-[9px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 uppercase font-mono block">Sweetness Index Level ({formState.bakerysweetness}/5)</label>
                    <input 
                      type="range"
                      min="1"
                      max="5"
                      value={formState.bakerysweetness}
                      onChange={(e) => setFormState(prev => ({ ...prev, bakerysweetness: e.target.value }))}
                      className="w-full accent-gold-pure mt-1"
                    />
                  </div>
                  <div className="space-y-1 flex items-center gap-2 pt-4">
                    <input 
                      type="checkbox"
                      id="bakerywarmServed"
                      checked={formState.bakerywarmServed}
                      onChange={(e) => setFormState(prev => ({ ...prev, bakerywarmServed: e.target.checked }))}
                      className="accent-gold-pure cursor-pointer"
                    />
                    <label htmlFor="bakerywarmServed" className="text-[8.5px] text-zinc-400 uppercase font-mono cursor-pointer select-none">Warm Serving Recommended</label>
                  </div>
                </div>
              )}

              {formState.productType === 'Grocery' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 uppercase font-mono block">Product Shelf Life</label>
                    <input 
                      type="text"
                      value={formState.groceryshelfLife}
                      onChange={(e) => setFormState(prev => ({ ...prev, groceryshelfLife: e.target.value }))}
                      placeholder="e.g. 12 Months"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-sans text-[9px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 uppercase font-mono block">Storage Condition</label>
                    <select
                      value={formState.grocerystorage}
                      onChange={(e) => setFormState(prev => ({ ...prev, grocerystorage: e.target.value }))}
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-sans text-[9px]"
                    >
                      <option value="Ambient">Cool Dry Place (Ambient Temp)</option>
                      <option value="Chilled">Refrigerated (Chilled 2°C - 4°C)</option>
                      <option value="Frozen">Frozen (Deep Freeze -18°C)</option>
                    </select>
                  </div>
                </div>
              )}

              {formState.productType === 'Fashion' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 uppercase font-mono block">Gender Target</label>
                    <select
                      value={formState.fashiongenders}
                      onChange={(e) => setFormState(prev => ({ ...prev, fashiongenders: e.target.value }))}
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-sans text-[9px]"
                    >
                      <option value="Unisex">Unisex Premium Access</option>
                      <option value="Men">Men Only</option>
                      <option value="Women">Women Only</option>
                      <option value="Kids">Kids Specialty</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 uppercase font-mono block">Fit Cut Specification</label>
                    <input 
                      type="text"
                      value={formState.fashionfit}
                      onChange={(e) => setFormState(prev => ({ ...prev, fashionfit: e.target.value }))}
                      placeholder="e.g. Slim Fit / Custom traditional"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-sans text-[9px]"
                    />
                  </div>
                </div>
              )}

              {formState.productType === 'Digital' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 uppercase font-mono block">Secure Resource Download Link</label>
                    <input 
                      type="text"
                      value={formState.digitalDownloadUrl}
                      onChange={(e) => setFormState(prev => ({ ...prev, digitalDownloadUrl: e.target.value }))}
                      placeholder="https://downloads.zoal.sa/secure-file"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-mono text-[9px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 uppercase font-mono block">Digital Package Format</label>
                    <input 
                      type="text"
                      value={formState.digitalFormat}
                      onChange={(e) => setFormState(prev => ({ ...prev, digitalFormat: e.target.value }))}
                      placeholder="e.g. PDF Guide / ZIP"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-sans text-[9px]"
                    />
                  </div>
                </div>
              )}

              {formState.productType === 'Gift Card' && (
                <div className="space-y-1 max-w-sm">
                  <label className="text-[8.5px] text-zinc-400 uppercase font-mono block">Redeemable Face Value (SAR)</label>
                  <input 
                    type="number"
                    value={formState.giftCardValue}
                    onChange={(e) => setFormState(prev => ({ ...prev, giftCardValue: e.target.value }))}
                    placeholder="e.g. 500 SAR"
                    className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-mono text-[9px]"
                  />
                </div>
              )}

              {formState.productType === 'Service' && (
                <div className="space-y-1 max-w-sm">
                  <label className="text-[8.5px] text-zinc-400 uppercase font-mono block">Service Duration (Minutes)</label>
                  <input 
                    type="number"
                    value={formState.serviceDuration}
                    onChange={(e) => setFormState(prev => ({ ...prev, serviceDuration: e.target.value }))}
                    placeholder="e.g. 90 Mins"
                    className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-mono text-[9px]"
                  />
                </div>
              )}
            </div>

            <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-xs mt-4">
              <span className="text-[9px] font-mono text-gold-pure uppercase tracking-widest block font-bold mb-3">
                🚀 Enterprise Product Flags
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'isFeatured', label: 'Featured' },
                  { key: 'isPopular', label: 'Popular' },
                  { key: 'isNewArrival', label: 'New Arrival' },
                  { key: 'isBestSeller', label: 'Best Seller' },
                  { key: 'isRecommended', label: 'Recommended' },
                  { key: 'isLimitedEdition', label: 'Limited Edition' },
                  { key: 'isSeasonal', label: 'Seasonal' },
                  { key: 'isStaffPick', label: 'Staff Pick' },
                  { key: 'isLuxuryChoice', label: 'Luxury Choice' }
                ].map(flag => (
                  <label key={flag.key} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!formState[flag.key]}
                      onChange={(e) => setFormState(prev => ({ ...prev, [flag.key]: e.target.checked }))}
                      className="accent-gold-pure"
                    />
                    <span className="text-[9px] text-zinc-300 font-mono">{flag.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. IMAGES TAB - ENTERPRISE MEDIA SYSTEM */}
        {activeFormTab === 'images' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h4 className="text-gold-pure font-mono text-[9.5px] uppercase tracking-widest flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Enterprise Product Media System & Supabase Storage
              </h4>
              <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest">Auto WebP Conversion • Storage: products/</span>
            </div>

            {uploadingStatus && (
              <div className="p-3 bg-zinc-900 border border-gold-pure/30 rounded-xs flex flex-col gap-2">
                <div className="flex items-center justify-between text-[9px] font-mono text-gold-pure">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {uploadingStatus}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-white/10">
                  <div className="bg-gold-pure h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            {/* A. PRIMARY THUMBNAIL */}
            <div className="space-y-3 p-3 bg-black/40 border border-white/5 rounded-xs">
              <label className="text-[9px] text-gold-pure uppercase tracking-wider block font-mono flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Product Thumbnail / Primary Image (`products/thumbs/`)
              </label>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-20 h-20 bg-zinc-900 border border-white/10 rounded-xs flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {formState.images && formState.images[0] ? (
                    <>
                      <SafeImage product={formState} alt="Thumbnail Preview" className="w-full h-full object-cover" containerClassName="w-full h-full relative overflow-hidden" />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...formState.images];
                          next.shift();
                          setFormState((prev: any) => ({ ...prev, images: next }));
                        }}
                        className="absolute inset-0 bg-black/70 text-rose-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer"
                        title="Remove Thumbnail"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-600 animate-pulse" />
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <label className="flex-1 py-2 px-4 bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-gold-pure/40 text-white font-mono text-[9px] rounded-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-gold-pure" /> Choose Thumbnail File
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleEnterpriseFileUpload(e.target.files, 'thumbnail');
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[8px] text-zinc-500 font-mono">
                    High-resolution primary image. Automatically compressed to WebP and saved in Supabase <code className="text-gold-pure">products/thumbs/</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* B. GALLERY IMAGES */}
            <div className="space-y-3 p-3 bg-black/40 border border-white/5 rounded-xs">
              <div className="flex items-center justify-between">
                <label className="text-[9px] text-gold-pure uppercase tracking-wider block font-mono flex items-center gap-1.5">
                  <FileUp className="w-3.5 h-3.5" /> High-Resolution Gallery Multi-Upload (`products/gallery/`)
                </label>
                <label className="py-1 px-3 bg-gold-pure hover:bg-gold-light text-black font-mono text-[8.5px] rounded-xs uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Upload Gallery Files
                  <input 
                    type="file" 
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleEnterpriseFileUpload(e.target.files, 'gallery');
                      }
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(formState.images || []).map((img: string, idx: number) => (
                  <div key={idx} className="relative group bg-zinc-900 border border-white/10 rounded-xs p-2 flex flex-col gap-2">
                    <div className="h-24 bg-black rounded-xs overflow-hidden flex items-center justify-center relative">
                      <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-black/80 text-gold-pure font-mono text-[8px] px-1 rounded-xs">#{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextImgs = formState.images.filter((_: any, i: number) => i !== idx);
                          setFormState((prev: any) => ({ ...prev, images: nextImgs }));
                        }}
                        className="absolute inset-0 bg-black/70 text-rose-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer"
                        title="Delete Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input 
                      type="text"
                      value={img}
                      onChange={(e) => {
                        const nextImgs = [...formState.images];
                        nextImgs[idx] = e.target.value;
                        setFormState((prev: any) => ({ ...prev, images: nextImgs }));
                      }}
                      className="bg-black border border-white/5 p-1 rounded-xs text-white font-mono text-[8px] truncate"
                      placeholder="Storage URL"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* C. 360 SPIN FRAMES */}
            <div className="space-y-3 p-3 bg-black/40 border border-white/5 rounded-xs">
              <div className="flex items-center justify-between">
                <label className="text-[9px] text-gold-pure uppercase tracking-wider block font-mono flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" /> 360-Degree Spin Frame Array (`products/360/`)
                </label>
                <label className="py-1 px-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-gold-pure font-mono text-[8.5px] rounded-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Upload 360 Frames
                  <input 
                    type="file" 
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleEnterpriseFileUpload(e.target.files, '360');
                      }
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {(formState.images360 || []).map((img: string, idx: number) => (
                  <div key={idx} className="relative group bg-zinc-900 border border-white/10 rounded-xs p-1.5 flex flex-col gap-1">
                    <div className="h-16 bg-black rounded-xs overflow-hidden flex items-center justify-center relative">
                      <img src={img} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-0.5 left-0.5 bg-black/80 text-gold-pure font-mono text-[7px] px-1 rounded-xs">F-{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextImgs = formState.images360.filter((_: any, i: number) => i !== idx);
                          setFormState((prev: any) => ({ ...prev, images360: nextImgs }));
                        }}
                        className="absolute inset-0 bg-black/70 text-rose-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D. PRODUCT VIDEO TOUR */}
            <div className="space-y-2 p-3 bg-black/40 border border-white/5 rounded-xs">
              <label className="text-[9px] text-gold-pure uppercase tracking-wider block font-mono flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" /> Product Video Tour / Media File
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={formState.videoUrl}
                  onChange={(e) => setFormState((prev: any) => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=... or Storage URL"
                  className="flex-1 bg-black border border-white/5 p-2 rounded-xs text-white font-mono text-[9px]"
                />
                <label className="py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-gold-pure font-mono text-[9px] rounded-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Upload Video
                  <input 
                    type="file" 
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleEnterpriseFileUpload(e.target.files, 'video');
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 3. PRICING TAB */}
        {activeFormTab === 'pricing' && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="text-gold-pure font-mono text-[9.5px] uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Financial Architecture & VAT Taxing
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Regular Retail Price (SAR) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formState.price}
                  onChange={(e) => setFormState(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g. 150.00"
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block flex justify-between">
                  <span>Promotional Sale Price (SAR)</span>
                  {parseFloat(formState.price) > 0 && parseFloat(formState.salePrice) > 0 && (
                    <span className="text-emerald-400 font-mono font-bold animate-pulse text-[8px]">
                      {Math.round((1 - (parseFloat(formState.salePrice) / parseFloat(formState.price))) * 100)}% OFF
                    </span>
                  )}
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formState.salePrice}
                  onChange={(e) => setFormState(prev => ({ ...prev, salePrice: e.target.value }))}
                  placeholder="Leave empty if no discount"
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-emerald-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block flex justify-between">
                  <span>Cost Price COGS (Admin Only)</span>
                  {parseFloat(formState.price) > 0 && parseFloat(formState.costPrice) > 0 && (
                    <span className="text-zinc-400 font-mono text-[8px]">
                      Margin: {Math.round(((parseFloat(formState.price) - parseFloat(formState.costPrice)) / parseFloat(formState.price)) * 100)}%
                    </span>
                  )}
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  disabled={currentUser?.role === 'staff'}
                  value={formState.costPrice}
                  onChange={(e) => setFormState(prev => ({ ...prev, costPrice: e.target.value }))}
                  placeholder={currentUser?.role === 'staff' ? '[RESTRICTED]' : 'e.g. 60.00'}
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono disabled:opacity-40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Taxation Class (Saudi ZATCA VAT)</label>
                <select
                  disabled={currentUser?.role === 'staff'}
                  value={formState.taxClass}
                  onChange={(e) => setFormState(prev => ({ ...prev, taxClass: e.target.value }))}
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans disabled:opacity-40 cursor-pointer"
                >
                  <option value="Standard 15%">Standard Rate (15% VAT)</option>
                  <option value="Zero 0%">Zero Rated (0%)</option>
                  <option value="Exempt">Exempt / Tax Free</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Pricing Currency</label>
                <select
                  disabled={currentUser?.role === 'staff'}
                  value={formState.currency}
                  onChange={(e) => setFormState(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans disabled:opacity-40 font-mono cursor-pointer"
                >
                  <option value="SAR">Saudi Riyal (SAR)</option>
                  <option value="USD">United States Dollar (USD)</option>
                  <option value="AED">Emirati Dirham (AED)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Financial Audit Code</label>
                <input 
                  type="text" 
                  readOnly
                  value={`ZL-TX-${formState.sku || 'PENDING'}`}
                  className="w-full bg-black/50 border border-white/5 p-2 rounded-xs text-zinc-500 font-mono text-[9px]"
                />
              </div>
            </div>

            <div className="p-3 bg-zinc-900 border border-white/5 rounded-xs space-y-3">
              <span className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                📅 Promotional Pricing Schedule (Optional)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8.5px] text-zinc-500 uppercase font-mono block">Promo Campaign Activation Date</label>
                  <input 
                    type="date"
                    value={formState.discountStart}
                    onChange={(e) => setFormState(prev => ({ ...prev, discountStart: e.target.value }))}
                    className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8.5px] text-zinc-500 uppercase font-mono block">Promo Campaign Expiration Date</label>
                  <input 
                    type="date"
                    value={formState.discountEnd}
                    onChange={(e) => setFormState(prev => ({ ...prev, discountEnd: e.target.value }))}
                    className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. INVENTORY TAB */}
        {activeFormTab === 'inventory' && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="text-gold-pure font-mono text-[9.5px] uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Stock Levels & Warehouse Architecture
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Available Stock on Hand *</label>
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
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Minimum Safe stock Level</label>
                <input 
                  type="number" 
                  value={formState.minStock}
                  onChange={(e) => setFormState(prev => ({ ...prev, minStock: e.target.value }))}
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Maximum Capacity Allocation</label>
                <input 
                  type="number" 
                  value={formState.maxStock}
                  onChange={(e) => setFormState(prev => ({ ...prev, maxStock: e.target.value }))}
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Low-stock Notification Trigger</label>
                <input 
                  type="number" 
                  value={formState.lowStockThreshold}
                  onChange={(e) => setFormState(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Reserved Cart / Hold Sessions</label>
                <input 
                  type="number" 
                  disabled={currentUser?.role === 'staff'}
                  value={formState.reservedStock}
                  onChange={(e) => setFormState(prev => ({ ...prev, reservedStock: e.target.value }))}
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono disabled:opacity-40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Fulfillment Warehouse Location</label>
                <input 
                  type="text" 
                  value={formState.warehouseLocation}
                  onChange={(e) => setFormState(prev => ({ ...prev, warehouseLocation: e.target.value }))}
                  placeholder="e.g. Al Hofuf Central Hub"
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-white/5 pt-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Platform SKU identifier</label>
                <input 
                  type="text" 
                  value={formState.sku}
                  onChange={(e) => setFormState(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="e.g. ZL-COF-001"
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Universal Product Barcode (GTIN / EAN)</label>
                <input 
                  type="text" 
                  value={formState.barcode}
                  onChange={(e) => setFormState(prev => ({ ...prev, barcode: e.target.value }))}
                  placeholder="e.g. 6281234567890"
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                />
              </div>
            </div>

            {/* System Analytics & Customer Engagement Desk */}
            <div className="border-t border-white/5 pt-4 mt-4 space-y-3 font-sans text-left">
              <h5 className="text-gold-pure font-mono text-[9px] uppercase tracking-widest flex items-center justify-between">
                <span>📈 Boutique Customer Engagement & Real-Time Analytics Desk</span>
                <button
                  type="button"
                  onClick={() => {
                    const views = Math.floor(2500 + Math.random() * 8000);
                    const clicks = Math.floor(views * (0.35 + Math.random() * 0.15));
                    const wishlists = Math.floor(clicks * (0.1 + Math.random() * 0.1));
                    const sales = Math.floor(clicks * (0.05 + Math.random() * 0.05));
                    const revenue = sales * (parseFloat(formState.price) || 120);
                    const refunds = Math.floor(sales * (0.01 + Math.random() * 0.02));
                    const returns = Math.floor(sales * (0.02 + Math.random() * 0.03));
                    const conversionRate = views > 0 ? ((sales / views) * 100).toFixed(2) + '%' : '0.00%';
                    const trendingScore = Math.floor((views * 0.1) + (wishlists * 0.4) + (sales * 0.5));
                    const avgRating = (4.2 + Math.random() * 0.8).toFixed(1);

                    setFormState(prev => ({
                      ...prev,
                      views,
                      clicks,
                      wishlistCount: wishlists,
                      purchasedCount: sales,
                      sales,
                      revenue,
                      refunds,
                      returns,
                      viewedCount: views,
                      conversionRate,
                      trendingScore,
                      averageRating: parseFloat(avgRating)
                    }));
                  }}
                  className="px-2 py-0.5 bg-gold-pure/10 hover:bg-gold-pure/20 text-gold-pure border border-gold-pure/20 font-mono text-[8px] uppercase rounded-xs cursor-pointer transition-all"
                >
                  ⚡ Simulate Live Campaign Tracking
                </button>
              </h5>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Views */}
                <div className="bg-zinc-900/60 p-2.5 border border-white/5 rounded-xs space-y-1">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Total Viewed Count (Views)</span>
                  <input 
                    type="number"
                    value={formState.views || formState.viewedCount || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormState(prev => ({ ...prev, views: val, viewedCount: val }));
                    }}
                    className="w-full bg-black border border-white/10 p-1 rounded-xs text-white text-[10px] font-mono"
                  />
                </div>
                {/* Clicks */}
                <div className="bg-zinc-900/60 p-2.5 border border-white/5 rounded-xs space-y-1">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Total Clicked Count (Clicks)</span>
                  <input 
                    type="number"
                    value={formState.clicks || 0}
                    onChange={(e) => setFormState(prev => ({ ...prev, clicks: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black border border-white/10 p-1 rounded-xs text-white text-[10px] font-mono"
                  />
                </div>
                {/* Wishlist Count */}
                <div className="bg-zinc-900/60 p-2.5 border border-white/5 rounded-xs space-y-1">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Customer Wishlist Count</span>
                  <input 
                    type="number"
                    value={formState.wishlistCount || 0}
                    onChange={(e) => setFormState(prev => ({ ...prev, wishlistCount: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black border border-white/10 p-1 rounded-xs text-white text-[10px] font-mono"
                  />
                </div>
                {/* Purchased / Sales Count */}
                <div className="bg-zinc-900/60 p-2.5 border border-white/5 rounded-xs space-y-1">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Purchased Count (Sales)</span>
                  <input 
                    type="number"
                    value={formState.sales || formState.purchasedCount || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormState(prev => ({ ...prev, sales: val, purchasedCount: val }));
                    }}
                    className="w-full bg-black border border-white/10 p-1 rounded-xs text-white text-[10px] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Revenue */}
                <div className="bg-zinc-900/60 p-2.5 border border-white/5 rounded-xs space-y-1">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Accrued Revenue (SAR)</span>
                  <input 
                    type="number"
                    value={formState.revenue || 0}
                    onChange={(e) => setFormState(prev => ({ ...prev, revenue: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-black border border-white/10 p-1 rounded-xs text-white text-[10px] font-mono"
                  />
                </div>
                {/* Refunds */}
                <div className="bg-zinc-900/60 p-2.5 border border-white/5 rounded-xs space-y-1">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Refund Requests Count</span>
                  <input 
                    type="number"
                    value={formState.refunds || 0}
                    onChange={(e) => setFormState(prev => ({ ...prev, refunds: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black border border-white/10 p-1 rounded-xs text-white text-[10px] font-mono"
                  />
                </div>
                {/* Returns */}
                <div className="bg-zinc-900/60 p-2.5 border border-white/5 rounded-xs space-y-1">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Product Returns Count</span>
                  <input 
                    type="number"
                    value={formState.returns || 0}
                    onChange={(e) => setFormState(prev => ({ ...prev, returns: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black border border-white/10 p-1 rounded-xs text-white text-[10px] font-mono"
                  />
                </div>
                {/* Average Rating */}
                <div className="bg-zinc-900/60 p-2.5 border border-white/5 rounded-xs space-y-1">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Average Rating Score (Stars)</span>
                  <input 
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formState.averageRating || 5.0}
                    onChange={(e) => setFormState(prev => ({ ...prev, averageRating: parseFloat(e.target.value) || 5.0 }))}
                    className="w-full bg-black border border-white/10 p-1 rounded-xs text-white text-[10px] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Conversion Rate */}
                <div className="bg-zinc-900/60 p-2.5 border border-white/5 rounded-xs space-y-1">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Customer Conversion Rate (%)</span>
                  <input 
                    type="text"
                    value={formState.conversionRate || '0.00%'}
                    onChange={(e) => setFormState(prev => ({ ...prev, conversionRate: e.target.value }))}
                    placeholder="e.g. 2.45%"
                    className="w-full bg-black border border-white/10 p-1 rounded-xs text-white text-[10px] font-mono"
                  />
                </div>
                {/* Trending Score */}
                <div className="bg-zinc-900/60 p-2.5 border border-white/5 rounded-xs space-y-1">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Trending Algorithms Score</span>
                  <input 
                    type="number"
                    value={formState.trendingScore || 0}
                    onChange={(e) => setFormState(prev => ({ ...prev, trendingScore: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black border border-white/10 p-1 rounded-xs text-white text-[10px] font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. VARIANTS TAB */}
        {activeFormTab === 'variants' && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="text-gold-pure font-mono text-[9.5px] uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Product Attribute Variations
            </h4>

            <div className="space-y-3">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono block">Registered Options</span>
              {formState.variantsList.length === 0 ? (
                <div className="text-center p-6 bg-black/40 border border-dashed border-white/5 rounded-xs text-zinc-500 font-sans">
                  No options defined. Use the builder below to add options like Size, roast grind, weight etc.
                </div>
              ) : (
                <div className="overflow-x-auto border border-white/5 rounded-xs">
                  <table className="w-full text-left border-collapse text-[9.5px]">
                    <thead>
                      <tr className="bg-white/5 text-zinc-400 font-mono uppercase text-[8px] tracking-wider border-b border-white/5">
                        <th className="p-2 pl-3">Variant Name</th>
                        <th className="p-2">Surcharge (SAR)</th>
                        <th className="p-2">Stock</th>
                        <th className="p-2 pr-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(formState.variantsList || []).map((v: ProductVariant, idx: number) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="p-2 pl-3 font-sans font-bold text-white">{v.size || v.sku || `Variant ${idx+1}`}</td>
                          <td className="p-2 font-mono text-gold-pure">
                            {v.price} SAR
                          </td>
                          <td className="p-2 font-mono text-zinc-300">{v.stock} units</td>
                          <td className="p-2 pr-3 text-right">
                            <button 
                              type="button"
                              onClick={() => {
                                const nextVariants = formState.variantsList.filter((_: any, i: number) => i !== idx);
                                setFormState(prev => ({ ...prev, variantsList: nextVariants }));
                              }}
                              className="text-rose-400 hover:text-rose-500 cursor-pointer font-mono text-[8px]"
                            >
                              Remove Option
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="p-3 bg-zinc-900 border border-white/5 rounded-xs">
                <span className="text-[9px] font-mono text-gold-pure uppercase font-bold tracking-widest block mb-2">➕ Add Variant Option</span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 font-mono block">Variant Name</label>
                    <input 
                      type="text" 
                      id="new_variant_name"
                      placeholder="e.g. 500g Pack"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-sans text-[9px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 font-mono block">Price Surcharge (SAR)</label>
                    <input 
                      type="number" 
                      id="new_variant_price"
                      placeholder="e.g. 45.00"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-mono text-[9px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 font-mono block">Allocated Stock</label>
                    <input 
                      type="number" 
                      id="new_variant_stock"
                      defaultValue="50"
                      placeholder="e.g. 50"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-mono text-[9px]"
                    />
                  </div>
                  <div className="space-y-1 flex items-end font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        const nameEl = document.getElementById('new_variant_name') as HTMLInputElement;
                        const priceEl = document.getElementById('new_variant_price') as HTMLInputElement;
                        const stockEl = document.getElementById('new_variant_stock') as HTMLInputElement;
                        if (nameEl && nameEl.value.trim()) {
                          const newVar: ProductVariant = {
                            id: `var-${Date.now()}-${Math.floor(Math.random()*100)}`,
                            sku: `${formState.sku || 'ZL-PROD'}-VAR-${Date.now().toString().slice(-4)}`,
                            barcode: '',
                            price: parseFloat(priceEl.value) || 0,
                            stock: parseInt(stockEl.value) || 0,
                            status: 'Active',
                            size: nameEl.value.trim()
                          };
                          setFormState(prev => ({
                            ...prev,
                            variantsList: [...prev.variantsList, newVar]
                          }));
                          nameEl.value = '';
                          priceEl.value = '';
                          stockEl.value = '50';
                        } else {
                          alert('Please enter a Variant Name.');
                        }
                      }}
                      className="w-full py-1.5 bg-gold-pure hover:bg-gold-pure/95 text-black font-bold uppercase rounded-xs transition-all cursor-pointer text-center text-[8.5px]"
                    >
                      Append Option
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. SPECIFICATIONS TAB */}
        {activeFormTab === 'specifications' && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="text-gold-pure font-mono text-[9.5px] uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Technical Specifications
            </h4>

            <div className="space-y-3 font-sans">
              {Object.keys(formState.specifications).length === 0 ? (
                <div className="text-center p-6 bg-black/40 border border-dashed border-white/5 rounded-xs text-zinc-500">
                  No specifications defined. Use the builder below to add custom fields.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(Object.entries(formState.specifications || {})).map(([k, v]: [string, any]) => (
                    <div key={k} className="p-2 bg-black border border-white/5 rounded-xs flex justify-between items-center text-[9.5px]">
                      <div className="space-y-0.5">
                        <span className="text-zinc-500 font-mono uppercase text-[8px] block">{k}</span>
                        <span className="text-white font-bold">{v}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextSpecs = { ...formState.specifications };
                          delete nextSpecs[k];
                          setFormState(prev => ({ ...prev, specifications: nextSpecs }));
                        }}
                        className="text-rose-400 hover:text-rose-500 font-mono text-[8px] uppercase tracking-wider cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 bg-zinc-900 border border-white/5 rounded-xs">
                <span className="text-[9px] font-mono text-gold-pure uppercase font-bold tracking-widest block mb-2">➕ Add Specification</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 font-mono block">Trait Property (Key)</label>
                    <input 
                      type="text" 
                      id="new_spec_key"
                      placeholder="e.g. Origin"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-sans text-[9px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-400 font-mono block">Trait Value</label>
                    <input 
                      type="text" 
                      id="new_spec_value"
                      placeholder="e.g. Yemen Sana'a"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-sans text-[9px]"
                    />
                  </div>
                  <div className="space-y-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        const keyEl = document.getElementById('new_spec_key') as HTMLInputElement;
                        const valEl = document.getElementById('new_spec_value') as HTMLInputElement;
                        if (keyEl && valEl && keyEl.value.trim() && valEl.value.trim()) {
                          const k = keyEl.value.trim();
                          const v = valEl.value.trim();
                          setFormState(prev => ({
                            ...prev,
                            specifications: {
                              ...prev.specifications,
                              [k]: v
                            }
                          }));
                          keyEl.value = '';
                          valEl.value = '';
                        } else {
                          alert('Please fill out both Trait Property and Trait Value.');
                        }
                      }}
                      className="w-full py-1.5 bg-gold-pure hover:bg-gold-pure/95 text-black font-mono font-bold uppercase rounded-xs transition-all cursor-pointer text-center text-[8.5px]"
                    >
                      Register Spec
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 font-sans">
                {/* Supplier Information Card */}
                <div className="p-3 bg-zinc-900 border border-white/5 rounded-xs space-y-2">
                  <span className="text-[9px] font-mono text-gold-pure uppercase font-bold tracking-widest block border-b border-white/5 pb-1">
                    🏢 Store Supplier Specifications
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-mono block">Supplier Name</label>
                      <input 
                        type="text" 
                        value={formState.supplier || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormState(prev => ({
                            ...prev,
                            supplier: val,
                            specifications: { ...prev.specifications, Supplier: val }
                          }));
                        }}
                        placeholder="e.g. Al-Hamid Trading"
                        className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-mono block">Brand Name</label>
                      <input 
                        type="text" 
                        value={formState.brand || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormState(prev => ({
                            ...prev,
                            brand: val,
                            specifications: { ...prev.specifications, Brand: val }
                          }));
                        }}
                        placeholder="e.g. AL ZOAL Reserve"
                        className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[8px] text-zinc-400 font-mono block">Manufacturer Details</label>
                      <input 
                        type="text" 
                        value={formState.manufacturer || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormState(prev => ({
                            ...prev,
                            manufacturer: val,
                            specifications: { ...prev.specifications, Manufacturer: val }
                          }));
                        }}
                        placeholder="e.g. Yemen Haraz Coffee Corp"
                        className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-mono block">Origin Country</label>
                      <input 
                        type="text" 
                        value={formState.countryOfOrigin || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormState(prev => ({
                            ...prev,
                            countryOfOrigin: val,
                            specifications: { ...prev.specifications, 'Country of Origin': val }
                          }));
                        }}
                        placeholder="e.g. Yemen"
                        className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-zinc-400 font-mono block">Authorized Importer (Saudi Arabia)</label>
                    <input 
                      type="text" 
                      value={formState.importer || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormState(prev => ({
                          ...prev,
                          importer: val,
                          specifications: { ...prev.specifications, Importer: val }
                        }));
                      }}
                      placeholder="e.g. Zoal National Trading Co."
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                    />
                  </div>
                </div>

                {/* Saudi Customs & Quality Compliance Card */}
                <div className="p-3 bg-zinc-900 border border-white/5 rounded-xs space-y-2">
                  <span className="text-[9px] font-mono text-gold-pure uppercase font-bold tracking-widest block border-b border-white/5 pb-1">
                    🇸🇦 Saudi Customs & Quality Compliance
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-mono block">VAT Taxation Class</label>
                      <select
                        value={formState.vatClass || formState.taxClass || 'Standard 15%'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormState(prev => ({
                            ...prev,
                            vatClass: val,
                            taxClass: val,
                            specifications: { ...prev.specifications, 'VAT Class': val }
                          }));
                        }}
                        className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px] cursor-pointer"
                      >
                        <option value="Standard 15%">Standard Rate (15%)</option>
                        <option value="Zero 0%">Zero Rated (0%)</option>
                        <option value="Exempt">Exempt / Tax-Free</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-mono block">Customs HS Code</label>
                      <input 
                        type="text" 
                        value={formState.hsCode || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormState(prev => ({
                            ...prev,
                            hsCode: val,
                            specifications: { ...prev.specifications, 'HS Code': val }
                          }));
                        }}
                        placeholder="e.g. 0901.2100"
                        className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[8px] text-zinc-400 font-mono block">Product Barcode (UPC/EAN)</label>
                      <div className="flex gap-1">
                        <input 
                          type="text" 
                          value={formState.barcode || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormState(prev => ({
                              ...prev,
                              barcode: val,
                              specifications: { ...prev.specifications, Barcode: val }
                            }));
                          }}
                          placeholder="e.g. 6281234567890"
                          className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const rand = Math.floor(100000000 + Math.random() * 900000000);
                            const val = `628${rand}`;
                            setFormState(prev => ({
                              ...prev,
                              barcode: val,
                              specifications: { ...prev.specifications, Barcode: val }
                            }));
                          }}
                          className="px-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-[8px] rounded-xs cursor-pointer border border-white/10"
                        >
                          Gen
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-mono block">Halal Status</label>
                      <select
                        value={formState.halalStatus || 'Certified'}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setFormState(prev => ({
                            ...prev,
                            halalStatus: val,
                            specifications: { ...prev.specifications, 'Halal Status': val }
                          }));
                        }}
                        className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px] cursor-pointer"
                      >
                        <option value="Certified">Certified</option>
                        <option value="Not Required">Not Req</option>
                        <option value="In Progress">In Progress</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-mono block">Manufacturing Date</label>
                      <input 
                        type="date" 
                        value={formState.manufacturingDate || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormState(prev => ({
                            ...prev,
                            manufacturingDate: val,
                            specifications: { ...prev.specifications, 'Manufacturing Date': val }
                          }));
                        }}
                        className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-mono block">Expiry Date</label>
                      <input 
                        type="date" 
                        value={formState.expiryDate || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormState(prev => ({
                            ...prev,
                            expiryDate: val,
                            specifications: { ...prev.specifications, 'Expiry Date': val }
                          }));
                        }}
                        className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Enterprise Governance & Localization Specifications (Phase 12.3) */}
              <div className="p-3 bg-zinc-900 border border-gold-pure/30 rounded-xs space-y-3 mt-3 font-sans">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-[9.5px] font-mono text-gold-pure uppercase font-bold tracking-widest flex items-center gap-1.5">
                    🌐 Enterprise Governance & Bilingual Localization Matrix (Phase 12.3)
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase">English & Arabic Compliance</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Materials */}
                  <div className="space-y-1 p-2 bg-black/50 border border-white/5 rounded-xs">
                    <label className="text-[8.5px] text-zinc-400 font-mono block">Materials / Ingredients (EN)</label>
                    <input 
                      type="text"
                      value={formState.materials || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, materials: e.target.value }))}
                      placeholder="e.g. 100% Organic Cotton / Arabica Beans"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                    />
                    <label className="text-[8.5px] text-zinc-400 font-mono block pt-1">Materials / Ingredients (AR - العربية)</label>
                    <input 
                      type="text"
                      value={formState.materialsAr || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, materialsAr: e.target.value }))}
                      placeholder="مثال: قطن عضوي 100% / حبوب البن العربي"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px] text-right"
                    />
                  </div>

                  {/* Care Instructions */}
                  <div className="space-y-1 p-2 bg-black/50 border border-white/5 rounded-xs">
                    <label className="text-[8.5px] text-zinc-400 font-mono block">Care Instructions (EN)</label>
                    <input 
                      type="text"
                      value={formState.careInstructions || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, careInstructions: e.target.value }))}
                      placeholder="e.g. Dry clean only, do not bleach"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                    />
                    <label className="text-[8.5px] text-zinc-400 font-mono block pt-1">Care Instructions (AR - العربية)</label>
                    <input 
                      type="text"
                      value={formState.careInstructionsAr || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, careInstructionsAr: e.target.value }))}
                      placeholder="مثال: التنظيف الجاف فقط، لا تستخدم المبيض"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px] text-right"
                    />
                  </div>

                  {/* Storage Instructions */}
                  <div className="space-y-1 p-2 bg-black/50 border border-white/5 rounded-xs">
                    <label className="text-[8.5px] text-zinc-400 font-mono block">Storage Instructions (EN)</label>
                    <input 
                      type="text"
                      value={formState.storageInstructions || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, storageInstructions: e.target.value }))}
                      placeholder="e.g. Store in cool, dry place away from sunlight"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                    />
                    <label className="text-[8.5px] text-zinc-400 font-mono block pt-1">Storage Instructions (AR - العربية)</label>
                    <input 
                      type="text"
                      value={formState.storageInstructionsAr || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, storageInstructionsAr: e.target.value }))}
                      placeholder="مثال: يحفظ في مكان بارد وجاف بعيداً عن أشعة الشمس"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px] text-right"
                    />
                  </div>

                  {/* Shelf Life */}
                  <div className="space-y-1 p-2 bg-black/50 border border-white/5 rounded-xs">
                    <label className="text-[8.5px] text-zinc-400 font-mono block">Shelf Life (EN)</label>
                    <input 
                      type="text"
                      value={formState.shelfLife || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, shelfLife: e.target.value }))}
                      placeholder="e.g. 12 Months from roasting"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                    />
                    <label className="text-[8.5px] text-zinc-400 font-mono block pt-1">Shelf Life (AR - العربية)</label>
                    <input 
                      type="text"
                      value={formState.shelfLifeAr || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, shelfLifeAr: e.target.value }))}
                      placeholder="مثال: 12 شهراً من تاريخ التحميص"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px] text-right"
                    />
                  </div>

                  {/* Suitable For */}
                  <div className="space-y-1 p-2 bg-black/50 border border-white/5 rounded-xs">
                    <label className="text-[8.5px] text-zinc-400 font-mono block">Suitable For (EN)</label>
                    <input 
                      type="text"
                      value={formState.suitableFor || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, suitableFor: e.target.value }))}
                      placeholder="e.g. Espresso, Pour Over, Formal Events"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                    />
                    <label className="text-[8.5px] text-zinc-400 font-mono block pt-1">Suitable For (AR - العربية)</label>
                    <input 
                      type="text"
                      value={formState.suitableForAr || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, suitableForAr: e.target.value }))}
                      placeholder="مثال: الإسبرسو، التقطير، المناسبات الرسمية"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px] text-right"
                    />
                  </div>

                  {/* Warranty */}
                  <div className="space-y-1 p-2 bg-black/50 border border-white/5 rounded-xs">
                    <label className="text-[8.5px] text-zinc-400 font-mono block">Warranty & Guarantees (EN)</label>
                    <input 
                      type="text"
                      value={formState.warranty || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, warranty: e.target.value }))}
                      placeholder="e.g. 1 Year Artisan Craftsmanship Warranty"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                    />
                    <label className="text-[8.5px] text-zinc-400 font-mono block pt-1">Warranty & Guarantees (AR - العربية)</label>
                    <input 
                      type="text"
                      value={formState.warrantyAr || ''}
                      onChange={(e) => setFormState(prev => ({ ...prev, warrantyAr: e.target.value }))}
                      placeholder="مثال: ضمان جودة الحرفية لمدة عام كامل"
                      className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px] text-right"
                    />
                  </div>

                  {/* Country of Origin & Manufacturer (Bilingual Sync) */}
                  <div className="space-y-1 p-2 bg-black/50 border border-white/5 rounded-xs">
                    <label className="text-[8.5px] text-zinc-400 font-mono block">Country of Origin (EN / AR)</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input 
                        type="text"
                        value={formState.countryOfOrigin || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, countryOfOrigin: e.target.value }))}
                        placeholder="e.g. Saudi Arabia"
                        className="bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                      />
                      <input 
                        type="text"
                        value={formState.countryOfOriginAr || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, countryOfOriginAr: e.target.value }))}
                        placeholder="المملكة العربية السعودية"
                        className="bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px] text-right"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 p-2 bg-black/50 border border-white/5 rounded-xs">
                    <label className="text-[8.5px] text-zinc-400 font-mono block">Manufacturer (EN / AR)</label>
                    <div className="grid grid-cols-2 gap-1">
                      <input 
                        type="text"
                        value={formState.manufacturer || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, manufacturer: e.target.value }))}
                        placeholder="e.g. Zoal Mills"
                        className="bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px]"
                      />
                      <input 
                        type="text"
                        value={formState.manufacturerAr || ''}
                        onChange={(e) => setFormState(prev => ({ ...prev, manufacturerAr: e.target.value }))}
                        placeholder="مصانع الزواح الراقية"
                        className="bg-black border border-white/10 p-1.5 rounded-xs text-white text-[9px] text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. SHIPPING & LOGISTICS TAB */}
        {activeFormTab === 'shipping' && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="text-gold-pure font-mono text-[9.5px] uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> Shipping & Logistics Matrix
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-sans">Fulfillment Delivery Type</label>
                <select
                  value={formState.deliveryType}
                  onChange={(e) => setFormState(prev => ({ ...prev, deliveryType: e.target.value as any }))}
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans cursor-pointer"
                >
                  <option value="LOCAL_ONLY">🏍️ Local Hand-Delivery Only</option>
                  <option value="SHIPPING_ONLY">🚚 National Heavy Carrier Shipping</option>
                  <option value="NATIONAL_EXPRESS">⚡ Nationwide Express Shipping</option>
                  <option value="GLOBAL_CARRIER">✈️ Global DHL/FedEx Express</option>
                  <option value="DIGITAL_DOWNLOAD">💾 Digital Fulfillment / Instant Download</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Fulfillment Fee (SAR)</label>
                <input 
                  type="number" 
                  value={formState.shippingFee}
                  onChange={(e) => setFormState(prev => ({ ...prev, shippingFee: e.target.value }))}
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Expected Delivery Duration (Days)</label>
                <input 
                  type="number" 
                  value={formState.deliveryDays}
                  onChange={(e) => setFormState(prev => ({ ...prev, deliveryDays: e.target.value }))}
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="shippingSameDay"
                    checked={formState.sameDay}
                    onChange={(e) => setFormState(prev => ({ ...prev, sameDay: e.target.checked }))}
                    className="accent-gold-pure cursor-pointer"
                  />
                  <label htmlFor="shippingSameDay" className="text-[9px] text-zinc-300 font-mono cursor-pointer select-none">Same Day Delivery Eligible</label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="shippingPickup"
                    checked={formState.pickup}
                    onChange={(e) => setFormState(prev => ({ ...prev, pickup: e.target.checked }))}
                    className="accent-gold-pure cursor-pointer"
                  />
                  <label htmlFor="shippingPickup" className="text-[9px] text-zinc-300 font-mono cursor-pointer select-none">Boutique Pickup Eligible</label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. INGREDIENTS & ALLERGENS TAB */}
        {activeFormTab === 'ingredients' && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="text-gold-pure font-mono text-[9.5px] uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Ingredients, Allergens & Nutrition
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Ingredients Content</label>
                <textarea 
                  value={formState.ingredients}
                  onChange={(e) => setFormState(prev => ({ ...prev, ingredients: e.target.value }))}
                  rows={4}
                  placeholder="e.g. 100% Single Origin Arabica Beans."
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Preparation Instructions</label>
                <textarea 
                  value={formState.directions}
                  onChange={(e) => setFormState(prev => ({ ...prev, directions: e.target.value }))}
                  rows={4}
                  placeholder="e.g. Brew using 92°C water..."
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">Allergen warnings</label>
                <textarea 
                  value={formState.warnings}
                  onChange={(e) => setFormState(prev => ({ ...prev, warnings: e.target.value }))}
                  rows={4}
                  placeholder="e.g. Nut-free facility. Contains Caffeine."
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px]"
                />
              </div>
            </div>

            {['Coffee', 'Bakery', 'Food', 'Drink', 'Grocery'].includes(formState.productType) && (
              <div className="p-3 bg-zinc-900 border border-white/5 rounded-xs space-y-3">
                <span className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">
                  📊 Nutrition Facts Panel (Per Serve)
                </span>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {['Calories', 'Protein', 'Total Fat', 'Total Carbs', 'Sodium'].map(nut => (
                    <div key={nut} className="space-y-1">
                      <label className="text-[8.5px] text-zinc-400 font-mono block">{nut}</label>
                      <input 
                        type="text" 
                        value={formState.nutritionFacts[nut] || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormState(prev => ({
                            ...prev,
                            nutritionFacts: {
                              ...prev.nutritionFacts,
                              [nut]: v
                            }
                          }));
                        }}
                        placeholder="e.g. 2 kcal"
                        className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-mono text-[9px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 9. SEO & METADATA TAB */}
        {activeFormTab === 'seo' && (
          <div className="space-y-4 animate-fade-in bg-zinc-950 p-5 rounded-xs border border-white/5">
            <ProductSeoSuite
              isForm={true}
              formState={formState}
              setFormState={setFormState}
              currentUser={currentUser}
            />
          </div>
        )}

        {/* 10. AI ASSISTANCE TAB */}
        {activeFormTab === 'ai' && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="text-gold-pure font-mono text-[9.5px] uppercase tracking-widest border-b border-white/5 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className={`w-3.5 h-3.5 text-gold-pure ${isGeneratingAI ? 'animate-spin' : 'animate-pulse'}`} /> 
                System AI Product Intelligence
              </span>
              <button
                type="button"
                disabled={isGeneratingAI}
                onClick={async () => {
                  if (!formState.name) {
                    alert('Please specify the Product Name first to invoke AI Copilot.');
                    return;
                  }
                  setIsGeneratingAI(true);
                  try {
                    const response = await fetch('/api/gemini/generate-product-intel', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: formState.name,
                        category: formState.category,
                        subcategory: formState.subcategory,
                        description: formState.description,
                        productType: formState.productType,
                        brand: formState.brand
                      })
                    });
                    if (!response.ok) {
                      throw new Error('Failed to generate product intelligence.');
                    }
                    const data = await response.json();
                    setFormState(prev => ({
                      ...prev,
                      aiProductSummary: data.aiProductSummary,
                      aiSeoSuggestions: data.aiSeoSuggestions,
                      aiTranslationAr: data.aiTranslationAr,
                      aiTranslationEn: data.aiTranslationEn,
                      aiTags: data.aiTags,
                      aiAltText: data.aiAltText,
                      aiSearchOptimization: data.aiSearchOptimization,
                      aiRelatedProducts: data.aiRelatedProducts,
                      aiProductRecommendation: data.aiProductRecommendation
                    }));
                  } catch (err) {
                    console.error('AI generation error:', err);
                    alert('An error occurred during AI generation. Fallback copy was loaded.');
                  } finally {
                    setIsGeneratingAI(false);
                  }
                }}
                className={`px-2.5 py-1 bg-gold-pure hover:bg-gold-pure/90 text-black font-mono font-bold text-[8.5px] uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50`}
              >
                <Sparkles className={`w-3 h-3 ${isGeneratingAI ? 'animate-spin' : ''}`} /> 
                {isGeneratingAI ? 'Generating Copy...' : 'Invoke AI Studio Content Generator'}
              </button>
            </h4>

            {/* Grid 1: Description and SEO Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">1. AI Generated Product Narrative (Description)</label>
                <textarea 
                  value={formState.aiProductSummary || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, aiProductSummary: e.target.value }))}
                  rows={3}
                  placeholder="Invoke AI generator to populate premium boutique copy..."
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">2. AI SEO Recommendations & Focus Suggests</label>
                <textarea 
                  value={formState.aiSeoSuggestions || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, aiSeoSuggestions: e.target.value }))}
                  rows={3}
                  placeholder="Invoke AI generator to analyze SEO parameters..."
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-[9px]"
                />
              </div>
            </div>

            {/* Grid 2: Arabic and English Translations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">3. AI Arabic Translation Copy (Ar)</label>
                <textarea 
                  value={formState.aiTranslationAr || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, aiTranslationAr: e.target.value }))}
                  rows={2}
                  placeholder="Arabic copy review..."
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-right text-[10px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">4. AI English Translation Copy (En)</label>
                <textarea 
                  value={formState.aiTranslationEn || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, aiTranslationEn: e.target.value }))}
                  rows={2}
                  placeholder="English copy review..."
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px]"
                />
              </div>
            </div>

            {/* Grid 3: AI Tags and AI Alt Text */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">5. AI Generated Descriptive Tags</label>
                <input 
                  type="text" 
                  value={formState.aiTags || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, aiTags: e.target.value }))}
                  placeholder="e.g. premium, organic, haraz, specialty"
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">6. AI Smart Image Alt Text (Accessibility)</label>
                <input 
                  type="text" 
                  value={formState.aiAltText || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, aiAltText: e.target.value }))}
                  placeholder="Descriptive text for visually impaired visitors..."
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px]"
                />
              </div>
            </div>

            {/* Grid 4: Search Optimization and Related Products */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">7. AI Platform Search Index Optimization Keywords</label>
                <input 
                  type="text" 
                  value={formState.aiSearchOptimization || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, aiSearchOptimization: e.target.value }))}
                  placeholder="Optimized index keys..."
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">8. AI Suggested Related Products Criteria</label>
                <input 
                  type="text" 
                  value={formState.aiRelatedProducts || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, aiRelatedProducts: e.target.value }))}
                  placeholder="Recommends similar premium goods..."
                  className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px]"
                />
              </div>
            </div>

            {/* Grid 5: Companion Recommendations */}
            <div className="space-y-1">
              <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">9. AI Lifestyle & Culinary Pairing Recommendation</label>
              <input 
                type="text" 
                value={formState.aiProductRecommendation || ''}
                onChange={(e) => setFormState(prev => ({ ...prev, aiProductRecommendation: e.target.value }))}
                placeholder="Pairs beautifully with..."
                className="w-full bg-black border border-white/5 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px]"
              />
            </div>
          </div>
        )}

        {/* 11. REVIEWS TAB */}
        {activeFormTab === 'reviews' && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="text-gold-pure font-mono text-[9.5px] uppercase tracking-widest border-b border-white/5 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-gold-pure" /> Customer Reviews & Ratings Approval</span>
              <button
                type="button"
                onClick={() => {
                  const mockNames = ['Yazeed Al-Malki', 'Sarah Bin Fahad', 'Abdulrahman Al-Sudais', 'Laila Khobar', 'Ahmad Hofuf'];
                  const mockComments = [
                    'Incredible aroma and roast level. Truly Saudi specialty roaster class!',
                    'Delightful freshness. Packaging was premium and insulated.',
                    'Best purchase this year. The flavor notes of cardamom and honey are distinct.',
                    'Exceeded my luxury boutique expectations. Perfect with Al-Hasa dates!',
                    'Highly professional delivery and outstanding product taste.'
                  ];
                  const mockR: Review = {
                    id: `review-${Date.now()}-${Math.floor(Math.random()*100)}`,
                    reviewerName: mockNames[Math.floor(Math.random() * mockNames.length)],
                    rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
                    comment: mockComments[Math.floor(Math.random() * mockComments.length)],
                    date: new Date().toISOString().slice(0, 10),
                    approved: true
                  };
                  setFormState(prev => ({ ...prev, reviews: [mockR, ...prev.reviews] }));
                }}
                className="px-2.5 py-1 bg-gold-pure hover:bg-gold-pure/90 text-black font-mono font-bold text-[8.5px] uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Inject Mockup Customer Review
              </button>
            </h4>
 
            <div className="space-y-3">
              {formState.reviews.length === 0 ? (
                <div className="text-center p-6 bg-black/40 border border-dashed border-white/5 rounded-xs text-zinc-500 font-sans">
                  No customer reviews registered. Click the button above to generate sample reviews to test the interface.
                </div>
              ) : (
                <div className="space-y-2">
                  {(formState.reviews || []).map((r: Review, idx: number) => (
                    <div key={r.id || idx} className="p-3 bg-zinc-900 border border-white/5 rounded-xs flex flex-wrap justify-between items-start gap-3 text-[10px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold font-sans">{r.reviewerName}</span>
                          <span className="text-zinc-500 text-[8px] font-mono">{r.date}</span>
                        </div>
                        <div className="flex gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-current text-gold-pure' : 'text-zinc-600'}`} />
                          ))}
                        </div>
                        <p className="text-zinc-300 font-sans italic text-[10px] mt-1">"{r.comment}"</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextR = [...formState.reviews];
                            nextR[idx].approved = !nextR[idx].approved;
                            setFormState(prev => ({ ...prev, reviews: nextR }));
                          }}
                          className={`px-2 py-0.5 rounded-xs text-[8px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer ${
                            r.approved 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {r.approved ? '● Approved & Live' : '○ Held / Pending'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextR = formState.reviews.filter((_: any, i: number) => i !== idx);
                            setFormState(prev => ({ ...prev, reviews: nextR }));
                          }}
                          className="p-1 border border-white/5 hover:border-rose-500/30 text-zinc-500 hover:text-rose-400 rounded-xs transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 12. QA TAB */}
        {activeFormTab === 'qa' && (
          <div className="space-y-4 animate-fade-in">
            <h4 className="text-gold-pure font-mono text-[9.5px] uppercase tracking-widest border-b border-white/5 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-gold-pure" /> Customer Questions & Answers Desk</span>
              <button
                type="button"
                onClick={() => {
                  const mockQuestions = [
                    'Is this coffee bean shade-grown and certified direct trade?',
                    'Do you offer custom grinding for Aeropress brewers?',
                    'Is there any gluten or cross-contamination in the bakery?',
                    'Can I pre-order this item for boutique pickup next week?',
                    'Is this product shipping worldwide or just local Saudi Arabia?'
                  ];
                  const mockQ: Question = {
                    id: `qa-${Date.now()}-${Math.floor(Math.random()*100)}`,
                    askedBy: 'Inquiring Customer',
                    questionText: mockQuestions[Math.floor(Math.random() * mockQuestions.length)],
                    answerText: '',
                    askedAt: new Date().toISOString().slice(0, 10),
                    status: 'Pending'
                  };
                  setActiveFormTab('qa');
                  setFormState(prev => ({ ...prev, questions: [mockQ, ...prev.questions] }));
                }}
                className="px-2.5 py-1 bg-gold-pure hover:bg-gold-pure/90 text-black font-mono font-bold text-[8.5px] uppercase tracking-wider rounded-xs transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Generate Sample Customer Question
              </button>
            </h4>

            <div className="space-y-3">
              {formState.questions.length === 0 ? (
                <div className="text-center p-6 bg-black/40 border border-dashed border-white/5 rounded-xs text-zinc-500 font-sans">
                  No client inquiries listed. Generate a sample question using the button above to respond.
                </div>
              ) : (
                <div className="space-y-3">
                  {(formState.questions || []).map((q: Question, idx: number) => (
                    <div key={q.id || idx} className="p-3 bg-zinc-900 border border-white/5 rounded-xs space-y-2 text-[10px]">
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold font-sans">{q.askedBy}</span>
                          <span className="text-zinc-500 text-[8px] font-mono">{q.askedAt}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded-xs text-[7px] font-mono uppercase font-bold tracking-wider ${
                            q.status === 'Answered' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                          }`}>
                            {q.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextQ = formState.questions.filter((_: any, i: number) => i !== idx);
                              setFormState(prev => ({ ...prev, questions: nextQ }));
                            }}
                            className="text-rose-400 hover:text-rose-500 font-mono text-[8px] uppercase tracking-wider cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-zinc-300 font-sans text-[10px] font-bold">Q: "{q.questionText}"</p>
                      
                      <div className="space-y-1 font-sans">
                        <label className="text-[8.5px] text-zinc-500 uppercase font-mono block">A: Official Roastery Reply</label>
                        <textarea
                          value={q.answerText || ''}
                          onChange={(e) => {
                            const nextQ = [...formState.questions];
                            nextQ[idx].answerText = e.target.value;
                            nextQ[idx].status = e.target.value.trim() ? 'Answered' : 'Pending';
                            setFormState(prev => ({ ...prev, questions: nextQ }));
                          }}
                          placeholder="Type official roastery response here..."
                          className="w-full bg-black border border-white/10 p-1.5 rounded-xs text-white font-sans text-[9px] focus:border-gold-pure outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Advanced Product Controls Visibility & Actions Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-white/5">
        <div className="flex gap-4">
          <div className="space-y-1">
            <label className="text-[8.5px] text-zinc-500 uppercase tracking-wider block font-mono">Product Status (Admin)</label>
            <select
              disabled={currentUser?.role === 'staff'}
              value={formState.status}
              onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value }))}
              className="bg-black border border-white/5 p-1 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[9px] font-bold cursor-pointer disabled:opacity-40"
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
            <label className="text-[8.5px] text-zinc-500 uppercase tracking-wider block font-mono">Product Visibility (Admin)</label>
            <select
              disabled={currentUser?.role === 'staff'}
              value={formState.visibility}
              onChange={(e) => setFormState(prev => ({ ...prev, visibility: e.target.value }))}
              className="bg-black border border-white/5 p-1 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[9px] cursor-pointer disabled:opacity-40"
            >
              <option value="Public">Public (All Customers)</option>
              <option value="Private">Private / Direct Only</option>
              <option value="Wholesale Only">Wholesale Partner Only</option>
              <option value="Staff Only">Staff Internal Only</option>
              <option value="Hidden">Hidden Everywhere</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onCancel}
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
      </div>
    </form>
  );
};
