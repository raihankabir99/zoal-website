import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, Image as ImageIcon, Trash2, Upload, AlertCircle, Check, Sparkles 
} from 'lucide-react';
import { BusinessCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useGlobalImages, uploadImageToStore, deleteImageFromStore } from '../imageRegistry';

export default function MerchantAssetsStudio() {
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<BusinessCategory>('coffee');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const globalImages = useGlobalImages();

  const PRESET_ASSETS = [
    {
      category: 'coffee' as BusinessCategory,
      title: 'Premium Shaken Obsidian Espresso',
      url: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&q=80&w=800'
    },
    {
      category: 'bakery' as BusinessCategory,
      title: 'Freshly-Fired Saj-Oven Flatbread',
      url: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=800'
    },
    {
      category: 'market' as BusinessCategory,
      title: 'Finely-Sifted Kordofan Hibiscus Buds',
      url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800'
    },
    {
      category: 'fashion' as BusinessCategory,
      title: 'Atelier Royal Silk Emerald Abaya',
      url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=800'
    },
    {
      category: 'thobes' as BusinessCategory,
      title: 'Bespoke Premium White Silk Thobe',
      url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800'
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only high-quality image filetypes are supported.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadUrl(reader.result);
          setUploadError('');
          setUploadSuccess(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only high-quality image filetypes are supported.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadUrl(reader.result);
          setUploadError('');
          setUploadSuccess(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim()) {
      setUploadError('Please choose or paste a valid asset URL, or drop an image file.');
      return;
    }

    try {
      uploadImageToStore(uploadUrl, uploadCategory, uploadTitle);
      
      setUploadUrl('');
      setUploadTitle('');
      setUploadError('');
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err) {
      setUploadError('Failed to synchronize and save dynamic image asset.');
    }
  };

  const selectPreset = (preset: typeof PRESET_ASSETS[0]) => {
    setUploadUrl(preset.url);
    setUploadTitle(preset.title);
    setUploadCategory(preset.category);
    setUploadError('');
    setUploadSuccess(false);
  };

  const customUploadedImages = useMemo(() => {
    return globalImages.filter(img => img.source === 'store upload');
  }, [globalImages]);

  return (
    <div className="bg-zinc-950 border border-gold-pure/20 rounded-sm p-6 sm:p-8 space-y-8 relative text-left">
      <span className="absolute top-4 right-4 text-[8px] font-mono tracking-widest text-gold-pure uppercase px-2 py-0.5 border border-gold-pure/30 bg-gold-pure/5">
        Unified Cloud System
      </span>

      <div className="max-w-3xl">
        <h3 className="text-base font-display uppercase tracking-widest text-[#D4AF37] mb-2 flex items-center gap-1.5 font-bold">
          <ImageIcon className="w-4 h-4" /> Global Image Library & Store uploader
        </h3>
        <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
          Store uploads serve as the <strong>Sole Source of Truth</strong> for the entire site. Once dynamic assets are uploaded here, they are stored globally in our database, categorised appropriately, and instantly bound to Lookbooks, Portfolio grids, and matching store products with zero duplicate steps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] tracking-wider text-zinc-400 uppercase font-semibold block">
              Quick Unsplash Heritage Presets (Simulate Seamless Curation):
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_ASSETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectPreset(p)}
                  className="text-[9px] uppercase tracking-wider px-2.5 py-1.5 border border-white/5 bg-black/40 text-zinc-400 hover:border-gold-pure hover:text-[#D4AF37] duration-300 font-mono cursor-pointer"
                >
                  + {p.category.toUpperCase()}: {p.title.split(' ').slice(-2).join(' ')}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-zinc-400 tracking-wider">Asset Title / Product Name</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Traditional Hand-Fired Hoboz Lot"
                  className="w-full px-3 py-2 bg-black border border-white/10 focus:border-gold-pure font-sans text-xs focus:outline-none placeholder-zinc-600 rounded-xs text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-zinc-400 tracking-wider">Global Category Attachment</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as BusinessCategory)}
                  className="w-full px-3 py-2 bg-black border border-white/10 focus:border-gold-pure font-sans text-xs focus:outline-none rounded-xs uppercase tracking-wider text-zinc-300"
                >
                  <option value="coffee">COFFEE HOUSE</option>
                  <option value="bakery">BAKERY & SNACKS</option>
                  <option value="market">MARKET & GROCERY</option>
                  <option value="fashion">PREMIUM COLLECTIONS</option>
                  <option value="thobes">THOBES & MEN'S WEAR</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-400 tracking-wider">Asset Source (URL / Base64 File upload)</label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xs p-6 text-center cursor-pointer transition-all duration-300 ${
                  dragActive ? 'border-gold-pure bg-gold-pure/5' : 'border-white/10 hover:border-white/20 bg-black/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                <p className="text-[10px] uppercase tracking-wider text-zinc-300 font-semibold mb-1">
                  Drag & Drop Digital Asset Image or Click to Browse Local Files
                </p>
                <p className="text-[9px] text-zinc-500 font-sans">
                  Supports PNG, JPG, WEBP, SVG. Files convert to persistent offline Base64 data urls instantly.
                </p>
              </div>

              <div className="relative mt-2">
                <span className="text-[9px] tracking-wider text-zinc-500 uppercase block mb-1">
                  Or paste manual image URL absolute reference:
                </span>
                <input
                  type="text"
                  value={uploadUrl}
                  onChange={(e) => {
                    setUploadUrl(e.target.value);
                    setUploadSuccess(false);
                  }}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2.5 bg-black border border-white/10 focus:border-gold-pure font-mono text-[10px] focus:outline-none placeholder-zinc-700 rounded-xs text-white"
                />
              </div>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xs text-[10.5px] text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xs text-[10.5px] text-emerald-400 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Asset uploaded & dynamic lookbook synchronizations completed perfectly.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-white text-black hover:bg-gold-pure duration-300 rounded-xs text-[10px] uppercase font-display tracking-widest font-semibold cursor-pointer shadow-[0_4px_12px_rgba(255,255,255,0.05)]"
            >
              [ Upload & Synchronize Across Entire Website ]
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0 lg:pl-8">
          <div className="space-y-4 h-full flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block mb-3">
                Active Asset Live Preview:
              </span>
              <div className="aspect-video w-full max-w-sm rounded bg-black/60 border border-white/5 relative overflow-hidden flex items-center justify-center">
                {uploadUrl ? (
                  <img
                    src={uploadUrl}
                    alt="Asset preview"
                    className="w-full h-full object-cover"
                    onError={() => setUploadError('Warning: Provided URL appears inactive or blocked by CORS policy.')}
                  />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-mono">No Active URL or File Loader Bound</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-black/40 border border-white/5 p-4 rounded-xs text-[10.5px] space-y-2 mt-4">
              <p className="text-zinc-500 font-mono uppercase text-[9px] tracking-wider border-b border-white/5 pb-1.5">Asset Metadata</p>
              <p className="flex justify-between"><span className="text-zinc-500">Class Type:</span> <strong className="text-zinc-300 uppercase tracking-wider">{uploadCategory}</strong></p>
              <p className="flex justify-between"><span className="text-zinc-500">Asset Title:</span> <strong className="text-zinc-300 truncate max-w-[170px]">{uploadTitle || 'N/A'}</strong></p>
              <p className="flex justify-between"><span className="text-zinc-500">Source Role:</span> <strong className="text-gold-pure">store upload</strong></p>
              <p className="flex justify-between"><span className="text-zinc-500">SLA Status:</span> <strong className="text-emerald-500">AUTO-SYNC ACTIVE</strong></p>
            </div>
          </div>
        </div>
      </div>

      {customUploadedImages.length > 0 && (
        <div className="border-t border-white/5 pt-6 space-y-4">
          <span className="text-[10px] tracking-widest text-[#D4AF37] uppercase font-display block">
            Manage Dynamic Portal Assets ({customUploadedImages.length} items):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {customUploadedImages.map((img) => (
              <div key={img.id} className="bg-black border border-white/5 rounded-xs overflow-hidden relative group p-1.5">
                <div className="aspect-square w-full rounded-xs overflow-hidden relative">
                  <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => deleteImageFromStore(img.id)}
                      className="p-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 duration-200 cursor-pointer"
                      title="Delete from platform"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-1 text-left text-[9px] space-y-0.5 font-sans">
                  <p className="text-zinc-300 truncate font-semibold">{img.title}</p>
                  <p className="text-zinc-500 uppercase tracking-wider font-mono">{img.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
