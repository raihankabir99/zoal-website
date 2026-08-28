import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, CheckCircle2, AlertTriangle, HelpCircle, Eye, 
  Smartphone, Laptop, RefreshCw, FileCode, Check, AlertCircle, Sparkles, Image as ImageIcon
} from 'lucide-react';

interface ProductSeoSuiteProps {
  // If editing inside standard Product form (ProductWorkspaceForm)
  isForm?: boolean;
  formState?: any;
  setFormState?: React.Dispatch<React.SetStateAction<any>>;

  // If editing inside PMS sub-tabs (PmsSubTabs)
  product?: any;
  allProducts?: any[];
  saveProductFields?: (productId: string, updatedFields: Record<string, any>) => any;
  currentUser?: any;
}

export const ProductSeoSuite: React.FC<ProductSeoSuiteProps> = ({
  isForm = false,
  formState,
  setFormState,
  product,
  allProducts = [],
  saveProductFields,
  currentUser
}) => {
  // Determine if we're in read-only mode for Staff in PMS
  const isReadOnly = !isForm && currentUser?.role === 'staff';

  // 1. Get current values from either formState or product
  const currentName = isForm ? formState?.name || '' : product?.name || '';
  const currentDesc = isForm ? formState?.description || '' : product?.description || '';
  const primaryImage = isForm ? (formState?.images?.[0] || '') : (product?.images?.[0] || '');

  const seoSlug = isForm ? formState?.seoSlug || '' : product?.seoSlug || '';
  const seoMetaTitle = isForm ? formState?.seoMetaTitle || '' : product?.seoMetaTitle || '';
  const seoMetaDesc = isForm ? formState?.seoMetaDesc || '' : product?.seoMetaDesc || '';
  const seoMetaKeywords = isForm ? formState?.seoMetaKeywords || '' : product?.seoMetaKeywords || '';
  const seoCanonicalUrl = isForm ? formState?.seoCanonicalUrl || '' : product?.seoCanonicalUrl || '';
  const seoOpenGraphImage = isForm ? formState?.seoOpenGraphImage || '' : product?.seoOpenGraphImage || '';
  const seoSchemaProductData = isForm ? formState?.seoSchemaProductData || '' : product?.seoSchemaProductData || '';
  const seoRobots = isForm ? formState?.seoRobots || 'index, follow' : product?.seoRobots || 'index, follow';
  const seoTwitterCard = isForm ? formState?.seoTwitterCard || 'summary_large_image' : product?.seoTwitterCard || 'summary_large_image';
  const seoFocusKeyword = isForm ? formState?.seoFocusKeyword || '' : product?.seoFocusKeyword || '';

  // New SEO fields
  const seoOgTitle = isForm ? formState?.seoOgTitle || '' : product?.seoOgTitle || '';
  const seoOgDesc = isForm ? formState?.seoOgDesc || '' : product?.seoOgDesc || '';
  const seoTwitterTitle = isForm ? formState?.seoTwitterTitle || '' : product?.seoTwitterTitle || '';
  const seoTwitterDesc = isForm ? formState?.seoTwitterDesc || '' : product?.seoTwitterDesc || '';
  const seoTwitterImage = isForm ? formState?.seoTwitterImage || '' : product?.seoTwitterImage || '';
  const seoArabicSlug = isForm ? formState?.seoArabicSlug || '' : product?.seoArabicSlug || '';
  const seoEnglishSlug = isForm ? formState?.seoEnglishSlug || '' : product?.seoEnglishSlug || '';

  // 2. Local interactive states
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);
  const [canonicalValidationError, setCanonicalValidationError] = useState<string | null>(null);
  const [ogImageValidationError, setOgImageValidationError] = useState<string | null>(null);
  const [twitterImageValidationError, setTwitterImageValidationError] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'google' | 'social' | 'languages' | 'schema'>('google');

  // Helper helper to update state
  const updateField = (fields: Record<string, any>) => {
    if (isReadOnly) return;
    if (isForm && setFormState) {
      setFormState((prev: any) => ({ ...prev, ...fields }));
    } else if (product && saveProductFields) {
      saveProductFields(product.id, fields);
    }
  };

  // 3. Automatic SEO Slug Generator
  const generateSlug = (name?: string): string => {
    return (name || '')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9\s-]/g, "") // remove invalid URL characters
      .trim()
      .replace(/\s+/g, "-") // replace spaces with -
      .replace(/-+/g, "-") // remove duplicate -
      .replace(/^-+|-+$/g, ""); // trim dashes from ends
  };

  // Trigger slug generation on name change if slug is currently empty
  useEffect(() => {
    if (!seoSlug && currentName) {
      const generated = generateSlug(currentName);
      if (generated) {
        updateField({ seoSlug: generated });
      }
    }
  }, [currentName]);

  const handleManualSlugGenerate = () => {
    if (currentName) {
      updateField({ seoSlug: generateSlug(currentName) });
    }
  };

  // Alternate Language Slugs Auto-generator
  useEffect(() => {
    if (currentName && !seoEnglishSlug) {
      updateField({ seoEnglishSlug: generateSlug(currentName) });
    }
    // For Arabic name or product Name fallback
    const arabicName = isForm ? formState?.nameAr || '' : product?.nameAr || '';
    if (arabicName && !seoArabicSlug) {
      // Just normalize Arabic text, replace spaces with dashes
      const arSlug = arabicName
        .trim()
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      updateField({ seoArabicSlug: arSlug });
    }
  }, [currentName]);

  // 4. Validations
  // Canonical Validation
  useEffect(() => {
    if (!seoCanonicalUrl) {
      setCanonicalValidationError(null);
      return;
    }
    try {
      new URL(seoCanonicalUrl);
      setCanonicalValidationError(null);
    } catch (e) {
      setCanonicalValidationError('Malformed Canonical URL. Must be a valid URL (e.g. https://zoal.sa/product)');
    }
  }, [seoCanonicalUrl]);

  // JSON-LD Validation
  useEffect(() => {
    if (!seoSchemaProductData) {
      setJsonValidationError(null);
      return;
    }
    try {
      JSON.parse(seoSchemaProductData);
      setJsonValidationError(null);
    } catch (e: any) {
      setJsonValidationError(`JSON Syntax Error: ${e.message}`);
    }
  }, [seoSchemaProductData]);

  // OG Image URL Validation
  useEffect(() => {
    if (!seoOpenGraphImage) {
      setOgImageValidationError(null);
      return;
    }
    if (!seoOpenGraphImage.startsWith('http://') && !seoOpenGraphImage.startsWith('https://') && !seoOpenGraphImage.startsWith('data:image/')) {
      setOgImageValidationError('Should be a valid absolute URL or a Data URI');
    } else {
      setOgImageValidationError(null);
    }
  }, [seoOpenGraphImage]);

  // Twitter Image URL Validation
  useEffect(() => {
    if (!seoTwitterImage) {
      setTwitterImageValidationError(null);
      return;
    }
    if (!seoTwitterImage.startsWith('http://') && !seoTwitterImage.startsWith('https://') && !seoTwitterImage.startsWith('data:image/')) {
      setTwitterImageValidationError('Should be a valid absolute URL or a Data URI');
    } else {
      setTwitterImageValidationError(null);
    }
  }, [seoTwitterImage]);

  const formatJsonLd = () => {
    if (!seoSchemaProductData) return;
    try {
      const parsed = JSON.parse(seoSchemaProductData);
      updateField({ seoSchemaProductData: JSON.stringify(parsed, null, 2) });
      setJsonValidationError(null);
    } catch (e: any) {
      setJsonValidationError(`Cannot format. JSON Syntax Error: ${e.message}`);
    }
  };

  // 5. Computed Fallbacks for OpenGraph and Twitter
  const ogTitleResolved = useMemo(() => {
    return seoOgTitle || seoMetaTitle || currentName || 'AL ZOAL Specialty Coffee';
  }, [seoOgTitle, seoMetaTitle, currentName]);

  const ogDescResolved = useMemo(() => {
    return seoOgDesc || seoMetaDesc || currentDesc || 'Premium handcrafted selection.';
  }, [seoOgDesc, seoMetaDesc, currentDesc]);

  const twitterTitleResolved = useMemo(() => {
    return seoTwitterTitle || seoOgTitle || seoMetaTitle || currentName || 'AL ZOAL Specialty Coffee';
  }, [seoTwitterTitle, seoOgTitle, seoMetaTitle, currentName]);

  const twitterDescResolved = useMemo(() => {
    return seoTwitterDesc || seoOgDesc || seoMetaDesc || currentDesc || 'Premium handcrafted selection.';
  }, [seoTwitterDesc, seoOgDesc, seoMetaDesc, currentDesc]);

  const ogImageResolved = useMemo(() => {
    return seoOpenGraphImage || primaryImage || 'https://ais-dev-z4lcnnlmns26awtyt7embi-491457148616.europe-west2.run.app/fallback-og.jpg';
  }, [seoOpenGraphImage, primaryImage]);

  const twitterImageResolved = useMemo(() => {
    return seoTwitterImage || seoOpenGraphImage || primaryImage || 'https://ais-dev-z4lcnnlmns26awtyt7embi-491457148616.europe-west2.run.app/fallback-og.jpg';
  }, [seoTwitterImage, seoOpenGraphImage, primaryImage]);

  // 6. Live SEO Score Engine (0-100)
  const seoAnalysis = useMemo(() => {
    let score = 0;
    const passed: string[] = [];
    const recommendations: string[] = [];

    const currentProductId = isForm ? (formState?.id || '') : (product?.id || '');

    // Title checks (max 25 points)
    if (seoMetaTitle) {
      score += 10;
      passed.push('Meta Title is configured.');

      const len = seoMetaTitle.length;
      if (len >= 50 && len <= 60) {
        score += 15;
        passed.push(`Meta Title length is optimal (${len} characters).`);
      } else {
        recommendations.push(`Meta Title length is ${len} chars. Make it between 50-60 characters for optimal Google display.`);
      }
    } else {
      recommendations.push('Meta Title is missing. Adding a custom title improves click-through rate.');
    }

    // Description checks (max 25 points)
    if (seoMetaDesc) {
      score += 10;
      passed.push('Meta Description is configured.');

      const len = seoMetaDesc.length;
      if (len >= 140 && len <= 160) {
        score += 15;
        passed.push(`Meta Description length is optimal (${len} characters).`);
      } else {
        recommendations.push(`Meta Description length is ${len} chars. Aim for 140-160 characters to fit search snippets perfectly.`);
      }
    } else {
      recommendations.push('Meta Description is missing. Google will auto-generate one, which is rarely optimal.');
    }

    // Slug checks (max 15 points)
    if (seoSlug) {
      score += 5;
      passed.push('SEO URL Slug is configured.');

      // Check format
      const hasInvalidChars = /[^a-z0-9-]/.test(seoSlug);
      if (!hasInvalidChars) {
        score += 5;
        passed.push('URL Slug uses correct lower-case hyphenated format.');
      } else {
        recommendations.push('URL Slug has uppercase or special characters. Use lowercase and hyphens only.');
      }

      // Check unique slug in catalog
      const duplicateSlugProd = allProducts.find(
        (p: any) => p.seoSlug === seoSlug && p.id !== currentProductId
      );
      if (!duplicateSlugProd) {
        score += 5;
        passed.push('URL Slug is unique in the product catalog.');
      } else {
        recommendations.push(`Duplicate slug detected! Already used by product "${duplicateSlugProd.name}". Change this slug to avoid indexing collisions.`);
      }
    } else {
      recommendations.push('SEO URL Slug is missing. Slugs are critical for friendly link indexing.');
    }

    // Focus Keyword checks (max 15 points)
    if (seoFocusKeyword) {
      score += 5;
      passed.push(`Focus Keyword is defined ("${seoFocusKeyword}").`);

      const kw = (seoFocusKeyword || '').toLowerCase();
      
      const inTitle = (seoMetaTitle || '').toLowerCase().includes(kw);
      if (inTitle) {
        score += 5;
        passed.push('Focus Keyword is present in Meta Title.');
      } else {
        recommendations.push('Focus Keyword is missing from Meta Title. Include it near the start of the title.');
      }

      const inDesc = (seoMetaDesc || '').toLowerCase().includes(kw);
      if (inDesc) {
        score += 5;
        passed.push('Focus Keyword is present in Meta Description.');
      } else {
        recommendations.push('Focus Keyword is missing from Meta Description. Include it in the first sentence.');
      }
    } else {
      recommendations.push('No SEO Focus Keyword defined. Setting a target keyword is highly recommended.');
    }

    // Canonical check (max 5 points)
    if (seoCanonicalUrl) {
      if (!canonicalValidationError) {
        score += 5;
        passed.push('Canonical URL is valid.');
      } else {
        recommendations.push('Canonical URL is malformed. Fix the URL structure.');
      }
    } else {
      recommendations.push('No Canonical URL override. Default self-referencing canonicals are acceptable, but setting it explicitly prevents scraper duplication.');
    }

    // Social Metadata OpenGraph/Twitter (max 10 points)
    if (seoOgTitle || seoOgDesc || seoOpenGraphImage) {
      score += 5;
      passed.push('Open Graph (og:) metadata configured.');
    } else {
      recommendations.push('No custom Open Graph (Facebook/LinkedIn) metadata. Highly recommended for rich previews on social shares.');
    }

    if (seoTwitterTitle || seoTwitterDesc || seoTwitterImage) {
      score += 5;
      passed.push('Twitter card metadata configured.');
    } else {
      recommendations.push('No custom Twitter card metadata configured.');
    }

    // Structured Schema Data (max 5 points)
    if (seoSchemaProductData) {
      if (!jsonValidationError) {
        score += 5;
        passed.push('Valid Schema.org JSON-LD configured.');
      } else {
        recommendations.push('Schema.org JSON-LD contains syntax errors. Fix JSON validation to enable Google rich snippets.');
      }
    } else {
      recommendations.push('Schema.org structured JSON-LD data is missing. Add product schema to unlock Google rich snippets, reviews, and pricing badges.');
    }

    return { score, passed, recommendations };
  }, [
    seoSlug, seoMetaTitle, seoMetaDesc, seoFocusKeyword, seoCanonicalUrl,
    seoOgTitle, seoOgDesc, seoOpenGraphImage, seoTwitterTitle, seoTwitterDesc, 
    seoTwitterImage, seoSchemaProductData, canonicalValidationError, jsonValidationError,
    allProducts, isForm, formState, product
  ]);

  return (
    <div className="space-y-6 text-xs text-left">
      {/* Tab bar header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-2">
        <h4 className="text-gold-pure font-mono text-[9.5px] uppercase tracking-widest flex items-center gap-1.5">
          <Globe className="w-4 h-4 animate-pulse" /> Advanced Enterprise SEO Engine
        </h4>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-sm border border-white/5 font-mono text-[8px] uppercase tracking-wider">
          <span className="text-zinc-500">Live SEO Score:</span>
          <span className={`font-bold px-1.5 py-0.5 rounded-sm ${
            seoAnalysis.score >= 80 ? 'bg-green-500/20 text-green-400' :
            seoAnalysis.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {seoAnalysis.score}/100
          </span>
        </div>
      </div>

      {/* Main Grid: Left is editor form, Right is Live Preview & Score analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Editors (8 Cols on XL) */}
        <div className="xl:col-span-7 space-y-4">
          
          {/* Sub tabs for SEO areas */}
          <div className="flex gap-1 border-b border-white/5 pb-1 font-mono text-[8.5px] uppercase tracking-wider overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveSubTab('google')}
              className={`py-1.5 px-3 rounded-t-sm border-t border-x transition-all flex items-center gap-1 cursor-pointer ${
                activeSubTab === 'google' 
                  ? 'bg-white/5 border-white/10 text-white font-bold' 
                  : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" /> 1. Google Core Meta
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('social')}
              className={`py-1.5 px-3 rounded-t-sm border-t border-x transition-all flex items-center gap-1 cursor-pointer ${
                activeSubTab === 'social' 
                  ? 'bg-white/5 border-white/10 text-white font-bold' 
                  : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> 2. Social (OG & Twitter)
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('languages')}
              className={`py-1.5 px-3 rounded-t-sm border-t border-x transition-all flex items-center gap-1 cursor-pointer ${
                activeSubTab === 'languages' 
                  ? 'bg-white/5 border-white/10 text-white font-bold' 
                  : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" /> 3. Alternate Languages
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('schema')}
              className={`py-1.5 px-3 rounded-t-sm border-t border-x transition-all flex items-center gap-1 cursor-pointer ${
                activeSubTab === 'schema' 
                  ? 'bg-white/5 border-white/10 text-white font-bold' 
                  : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-green-400" /> 4. JSON-LD Schema
            </button>
          </div>

          {/* TAB 1: GOOGLE CORE META */}
          {activeSubTab === 'google' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">Unique URL Slug</label>
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={handleManualSlugGenerate}
                      className="text-[8px] text-gold-pure uppercase font-mono tracking-wider hover:underline hover:text-white transition-colors cursor-pointer"
                    >
                      Auto-Generate
                    </button>
                  </div>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={seoSlug}
                    onChange={(e) => updateField({ seoSlug: e.target.value })}
                    placeholder="e.g. traditional-yemeni-haraz"
                    className="w-full bg-black border border-white/10 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-[9px] disabled:opacity-40"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">SEO Content Focus Keyword</label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={seoFocusKeyword}
                    onChange={(e) => updateField({ seoFocusKeyword: e.target.value })}
                    placeholder="e.g. yemeni haraz specialty"
                    className="w-full bg-black border border-white/10 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px] disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">SEO Meta Title (Google standard)</label>
                  <div className="font-mono text-[8px]">
                    <span className={`px-1 rounded-sm ${
                      seoMetaTitle.length >= 50 && seoMetaTitle.length <= 60 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {seoMetaTitle.length} chars (Optimal: 50-60)
                    </span>
                  </div>
                </div>
                <input 
                  type="text" 
                  disabled={isReadOnly}
                  value={seoMetaTitle}
                  onChange={(e) => updateField({ seoMetaTitle: e.target.value })}
                  placeholder="Luxury Yemeni Haraz Coffee - Buy Online"
                  className="w-full bg-black border border-white/10 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs disabled:opacity-40"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">SEO Meta Description</label>
                  <div className="font-mono text-[8px]">
                    <span className={`px-1 rounded-sm ${
                      seoMetaDesc.length >= 140 && seoMetaDesc.length <= 160 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {seoMetaDesc.length} chars (Optimal: 140-160)
                    </span>
                  </div>
                </div>
                <textarea 
                  rows={2}
                  disabled={isReadOnly}
                  value={seoMetaDesc}
                  onChange={(e) => updateField({ seoMetaDesc: e.target.value })}
                  placeholder="Hand-roasted premium organic Haraz coffee beans."
                  className="w-full bg-black border border-white/10 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs leading-relaxed disabled:opacity-40"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-white/5 pt-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">SEO Canonical URL override</label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={seoCanonicalUrl}
                    onChange={(e) => updateField({ seoCanonicalUrl: e.target.value })}
                    placeholder="https://zoal.sa/product/traditional-yemeni-haraz"
                    className={`w-full bg-black border p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-[9px] disabled:opacity-40 ${
                      canonicalValidationError ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {canonicalValidationError && (
                    <span className="text-[8.5px] text-red-400 font-mono block mt-0.5">{canonicalValidationError}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">Meta Keywords (CSV)</label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={seoMetaKeywords}
                    onChange={(e) => updateField({ seoMetaKeywords: e.target.value })}
                    placeholder="yemeni coffee, arabica beans, luxury coffee"
                    className="w-full bg-black border border-white/10 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-[9.5px] disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">SEO Robots Meta Tag Directives</label>
                  <select
                    disabled={isReadOnly}
                    value={seoRobots}
                    onChange={(e) => updateField({ seoRobots: e.target.value })}
                    className="w-full bg-black border border-white/10 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px] cursor-pointer disabled:opacity-40"
                  >
                    <option value="index, follow">index,follow (Default - Index and follow page)</option>
                    <option value="noindex, follow">noindex, follow (Hide from search, follow links)</option>
                    <option value="index, nofollow">index, nofollow (Show in search, ignore links)</option>
                    <option value="noindex, nofollow">noindex, nofollow (Completely hide and ignore links)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">Twitter Card Type Configuration</label>
                  <select
                    disabled={isReadOnly}
                    value={seoTwitterCard}
                    onChange={(e) => updateField({ seoTwitterCard: e.target.value })}
                    className="w-full bg-black border border-white/10 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px] cursor-pointer disabled:opacity-40"
                  >
                    <option value="summary_large_image">Summary with Large Image (Default)</option>
                    <option value="summary">Standard Summary Card</option>
                    <option value="app">Application Card</option>
                    <option value="player">Media Player Card</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOCIAL (OPENGRAPH & TWITTER) */}
          {activeSubTab === 'social' && (
            <div className="space-y-4 animate-fade-in font-sans">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xs space-y-1">
                <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest block font-bold">Social Intelligence Fallback System</span>
                <p className="text-[9.5px] text-zinc-400 leading-relaxed">
                  Enterprise crawlers require customized visual title strings. If custom social fields are left blank, they will automatically fallback to Meta Titles and description strings seamlessly.
                </p>
              </div>

              {/* FB/OpenGraph Group */}
              <div className="space-y-3 bg-zinc-950/40 p-4 border border-white/5 rounded-xs">
                <h5 className="font-mono text-[9px] text-blue-400 uppercase tracking-wider font-bold">Facebook / LinkedIn (OpenGraph)</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">OG Title Override</label>
                    <input 
                      type="text" 
                      disabled={isReadOnly}
                      value={seoOgTitle}
                      onChange={(e) => updateField({ seoOgTitle: e.target.value })}
                      placeholder={`Fallback: ${seoMetaTitle || 'Meta Title'}`}
                      className="w-full bg-black border border-white/10 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px] disabled:opacity-40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">OG Description Override</label>
                    <input 
                      type="text" 
                      disabled={isReadOnly}
                      value={seoOgDesc}
                      onChange={(e) => updateField({ seoOgDesc: e.target.value })}
                      placeholder={`Fallback: ${seoMetaDesc || 'Meta Description'}`}
                      className="w-full bg-black border border-white/10 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px] disabled:opacity-40"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">OpenGraph Banner Image URL</label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={seoOpenGraphImage}
                    onChange={(e) => updateField({ seoOpenGraphImage: e.target.value })}
                    placeholder={`Fallback: Product image (${primaryImage ? 'Available' : 'None'})`}
                    className={`w-full bg-black border p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-[9px] disabled:opacity-40 ${
                      ogImageValidationError ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {ogImageValidationError && (
                    <span className="text-[8.5px] text-red-400 font-mono block mt-0.5">{ogImageValidationError}</span>
                  )}
                </div>
              </div>

              {/* Twitter Group */}
              <div className="space-y-3 bg-zinc-950/40 p-4 border border-white/5 rounded-xs">
                <h5 className="font-mono text-[9px] text-cyan-400 uppercase tracking-wider font-bold">Twitter Card Customization</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">Twitter Title Override</label>
                    <input 
                      type="text" 
                      disabled={isReadOnly}
                      value={seoTwitterTitle}
                      onChange={(e) => updateField({ seoTwitterTitle: e.target.value })}
                      placeholder={`Fallback: ${seoOgTitle || 'OG Title'}`}
                      className="w-full bg-black border border-white/10 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px] disabled:opacity-40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">Twitter Description Override</label>
                    <input 
                      type="text" 
                      disabled={isReadOnly}
                      value={seoTwitterDesc}
                      onChange={(e) => updateField({ seoTwitterDesc: e.target.value })}
                      placeholder={`Fallback: ${seoOgDesc || 'OG Description'}`}
                      className="w-full bg-black border border-white/10 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-[10px] disabled:opacity-40"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">Twitter Custom Image URL</label>
                  <input 
                    type="text" 
                    disabled={isReadOnly}
                    value={seoTwitterImage}
                    onChange={(e) => updateField({ seoTwitterImage: e.target.value })}
                    placeholder={`Fallback: ${seoOpenGraphImage ? 'OG Image' : 'Product Primary Image'}`}
                    className={`w-full bg-black border p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-[9px] disabled:opacity-40 ${
                      twitterImageValidationError ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  {twitterImageValidationError && (
                    <span className="text-[8.5px] text-red-400 font-mono block mt-0.5">{twitterImageValidationError}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALTERNATE LANGUAGE URLS */}
          {activeSubTab === 'languages' && (
            <div className="space-y-4 animate-fade-in font-sans">
              <div className="p-3 bg-amber-950/10 border border-amber-900/20 rounded-xs">
                <span className="text-[8px] font-mono text-amber-400 uppercase tracking-widest block font-bold">Multilingual SEO & Hreflang support</span>
                <p className="text-[9.5px] text-zinc-400 leading-relaxed mt-1">
                  Enables Google to serve the language-specific URL corresponding to the user's localized browser language. Fully compatible with Arabic (ar) and English (en) URL mapping.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-zinc-950/40 p-4 border border-white/5 rounded-xs">
                  <div className="flex items-center gap-1.5 border-b border-white/5 pb-1">
                    <span className="text-[10px] font-bold text-white">English (en) URL Slug</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-500 uppercase block font-mono">English Friendly Path Segment</label>
                    <input 
                      type="text" 
                      disabled={isReadOnly}
                      value={seoEnglishSlug}
                      onChange={(e) => updateField({ seoEnglishSlug: e.target.value })}
                      placeholder="e.g. yemeni-haraz-roast"
                      className="w-full bg-black border border-white/10 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-mono text-[9.5px] disabled:opacity-40"
                    />
                  </div>
                  <div className="bg-black/50 p-2 rounded-xs text-[8.5px] font-mono text-zinc-400">
                    <span className="text-zinc-500 block">Generated Header:</span>
                    &lt;link rel="alternate" hreflang="en" href="https://zoal.sa/en/product/{seoEnglishSlug || '...'}" /&gt;
                  </div>
                </div>

                <div className="space-y-2 bg-zinc-950/40 p-4 border border-white/5 rounded-xs text-right">
                  <div className="flex items-center justify-end gap-1.5 border-b border-white/5 pb-1">
                    <span className="text-[10px] font-bold text-white">Arabic (ar) URL Slug</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] text-zinc-500 uppercase block font-mono">الرابط الصديق لمحركات البحث (عربي)</label>
                    <input 
                      type="text" 
                      disabled={isReadOnly}
                      value={seoArabicSlug}
                      onChange={(e) => updateField({ seoArabicSlug: e.target.value })}
                      dir="rtl"
                      placeholder="قهوة-حراز-يمنية-فاخرة"
                      className="w-full bg-black border border-white/10 p-2 rounded-xs text-white focus:border-gold-pure outline-none font-sans text-xs disabled:opacity-40 text-right"
                    />
                  </div>
                  <div className="bg-black/50 p-2 rounded-xs text-[8.5px] font-mono text-zinc-400 text-left">
                    <span className="text-zinc-500 block text-right">Generated Header:</span>
                    &lt;link rel="alternate" hreflang="ar" href="https://zoal.sa/ar/product/{encodeURIComponent(seoArabicSlug) || '...'}" /&gt;
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: JSON-LD SCHEMA */}
          {activeSubTab === 'schema' && (
            <div className="space-y-4 animate-fade-in font-sans">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[8px] font-mono text-green-400 uppercase tracking-widest block font-bold">Google Rich Snippets Core Schema</span>
                  <label className="text-[9.5px] text-zinc-400 block mt-0.5">Validate and formatting of Schema.org product structured details.</label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isReadOnly || !seoSchemaProductData}
                    onClick={formatJsonLd}
                    className="py-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xs text-[8.5px] font-mono uppercase text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Format JSON
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <textarea 
                  rows={8}
                  disabled={isReadOnly}
                  value={seoSchemaProductData}
                  onChange={(e) => updateField({ seoSchemaProductData: e.target.value })}
                  placeholder={JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Product",
                    "name": currentName || "Product Name",
                    "image": primaryImage ? [primaryImage] : [],
                    "description": currentDesc || "Product Description",
                    "brand": {
                      "@type": "Brand",
                      "name": "AL ZOAL"
                    }
                  }, null, 2)}
                  className={`w-full bg-black border p-2 rounded-xs text-zinc-300 focus:border-gold-pure outline-none font-mono text-[9px] leading-relaxed disabled:opacity-40 ${
                    jsonValidationError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10'
                  }`}
                />
                
                {jsonValidationError ? (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xs text-[9px] font-mono flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold block">Syntax Invalid:</span>
                      {jsonValidationError}
                    </div>
                  </div>
                ) : seoSchemaProductData ? (
                  <div className="p-2.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xs text-[9px] font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>✓ Schema.org JSON-LD matches valid JSON syntax standard.</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: PREVIEWS & SCORE ANALYSIS (5 Cols on XL) */}
        <div className="xl:col-span-5 space-y-4">
          
          {/* Live Preview Toggle Panel */}
          <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[8px] font-mono text-gold-pure uppercase tracking-widest block font-bold">Google Live SERP Card</span>
              <div className="flex bg-white/5 p-0.5 rounded-sm border border-white/10 text-[8px] font-mono uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-2 py-1 rounded-xs transition-all cursor-pointer flex items-center gap-1 ${
                    previewDevice === 'desktop' ? 'bg-white/10 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Laptop className="w-3 h-3" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2 py-1 rounded-xs transition-all cursor-pointer flex items-center gap-1 ${
                    previewDevice === 'mobile' ? 'bg-white/10 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Smartphone className="w-3 h-3" /> Mobile
                </button>
              </div>
            </div>

            {/* Simulated Google Search Result */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm text-left shadow-inner">
              <div className="font-sans leading-normal">
                {/* Site breadcrumb & Favicon row */}
                <div className="flex items-center gap-2 mb-1.5 text-zinc-400">
                  <div className="w-4 h-4 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-[8px] font-bold text-gold-pure shrink-0">
                    Z
                  </div>
                  <div className="text-[10px] truncate leading-none">
                    <span className="text-zinc-300 font-medium">alzoal.sa</span>
                    <span className="mx-1 text-zinc-500">&rsaquo;</span>
                    <span className="text-zinc-400">product</span>
                    <span className="mx-1 text-zinc-500">&rsaquo;</span>
                    <span className="text-zinc-400 font-mono truncate">{seoSlug || generateSlug(currentName) || '...'}</span>
                  </div>
                </div>

                {/* Simulated Link/Title */}
                <h4 className={`text-blue-400 hover:underline cursor-pointer leading-snug font-sans tracking-normal ${
                  previewDevice === 'mobile' ? 'text-base font-semibold' : 'text-lg font-normal'
                }`}>
                  {seoMetaTitle || `${currentName || 'Product Title'} - Luxury Specialty | AL ZOAL`}
                </h4>

                {/* Simulated snippet description */}
                <p className="text-[11.5px] text-zinc-400 leading-relaxed font-sans mt-1">
                  {seoMetaDesc || currentDesc || 'Provide a custom Meta Description to describe this artisanal product, improve organic ranking, and encourage higher conversions.'}
                </p>
              </div>
            </div>
          </div>

          {/* Social media card previews */}
          <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3">
            <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest block font-bold">Facebook & Twitter Preview</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              {/* FB Preview Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden flex flex-col justify-between">
                <div className="aspect-video bg-zinc-950 border-b border-zinc-800 relative overflow-hidden flex items-center justify-center group shrink-0">
                  {ogImageResolved ? (
                    <img src={ogImageResolved} referrerPolicy="no-referrer" alt="OG Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-600">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-[8px] uppercase tracking-wider font-mono mt-1">No OG Image</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white font-mono text-[7px] uppercase tracking-wider px-1 py-0.5 rounded-sm">Facebook OG</span>
                </div>
                <div className="p-2.5 space-y-1 font-sans">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">ALZOAL.SA</span>
                  <h6 className="text-[10px] font-bold text-zinc-200 line-clamp-1">{ogTitleResolved}</h6>
                  <p className="text-[9px] text-zinc-500 line-clamp-2 leading-relaxed">{ogDescResolved}</p>
                </div>
              </div>

              {/* Twitter Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden flex flex-col justify-between">
                <div className="aspect-video bg-zinc-950 border-b border-zinc-800 relative overflow-hidden flex items-center justify-center group shrink-0">
                  {twitterImageResolved ? (
                    <img src={twitterImageResolved} referrerPolicy="no-referrer" alt="Twitter Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-zinc-600">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-[8px] uppercase tracking-wider font-mono mt-1">No Twitter Image</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white font-mono text-[7px] uppercase tracking-wider px-1 py-0.5 rounded-sm">Twitter</span>
                </div>
                <div className="p-2.5 space-y-1 font-sans">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">@ALZOAL</span>
                  <h6 className="text-[10px] font-bold text-zinc-200 line-clamp-1">{twitterTitleResolved}</h6>
                  <p className="text-[9px] text-zinc-500 line-clamp-2 leading-relaxed">{twitterDescResolved}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Core Score & Recommendations Dashboard */}
          <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3">
            <span className="text-[8px] font-mono text-gold-pure uppercase tracking-widest block font-bold">SEO Audit & Actionable Advice</span>
            
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 no-scrollbar text-[10px]">
              {seoAnalysis.recommendations.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Pending Recommendations</span>
                  {seoAnalysis.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-zinc-400 leading-normal">
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xs font-mono text-[9px] uppercase tracking-wider text-center">
                  ✨ Perfect SEO Optimization achieved! (100/100)
                </div>
              )}

              {seoAnalysis.passed.length > 0 && (
                <div className="space-y-1.5 border-t border-white/5 pt-2.5">
                  <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Passed Tests ({seoAnalysis.passed.length})</span>
                  {seoAnalysis.passed.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-zinc-500 leading-none">
                      <Check className="w-3 h-3 text-green-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
