import React from 'react';
import { 
  Sparkles, Gift, Trash2, Globe, Star, Search, Mail, Smartphone, X 
} from 'lucide-react';
import { Product, BusinessCategory } from '../types';
import { formatCurrency } from '../utils';

const ALL_CATEGORIES: { id: BusinessCategory; name: string }[] = [
  { id: 'coffee', name: 'ZOAL Coffee & Cafe' },
  { id: 'bakery', name: 'Al-Hearth Organic Bakery' },
  { id: 'market', name: 'Traditional Organic Market' },
  { id: 'fashion', name: 'AL ZOAL Bespoke Fashion & Toobs' },
  { id: 'thobes', name: 'Luxury Men\'s Thobes' }
];

interface CampaignsMarketingPanelProps {
  coupons: any[];
  setCoupons: React.Dispatch<React.SetStateAction<any[]>>;
  campaigns: any[];
  setCampaigns: React.Dispatch<React.SetStateAction<any[]>>;
  banners: any[];
  setBanners: React.Dispatch<React.SetStateAction<any[]>>;
  subscribers: any[];
  setSubscribers: React.Dispatch<React.SetStateAction<any[]>>;
  allProducts: Product[];
  saveProductFields: (productId: string, updatedFields: Record<string, any>) => boolean;
  addLog: (action: string, target?: string) => void;
  isAddCampaignOpen: boolean;
  setIsAddCampaignOpen: (open: boolean) => void;
  isAddBannerOpen: boolean;
  setIsAddBannerOpen: (open: boolean) => void;
  marketingSubTab: string;
  setMarketingSubTab: (tab: string) => void;
  mktProductSearch: string;
  setMktProductSearch: (search: string) => void;
}

export const CampaignsMarketingPanel: React.FC<CampaignsMarketingPanelProps> = ({
  coupons,
  setCoupons,
  campaigns,
  setCampaigns,
  banners,
  setBanners,
  subscribers,
  setSubscribers,
  allProducts,
  saveProductFields,
  addLog,
  isAddCampaignOpen,
  setIsAddCampaignOpen,
  isAddBannerOpen,
  setIsAddBannerOpen,
  marketingSubTab,
  setMarketingSubTab,
  mktProductSearch,
  setMktProductSearch
}) => {
  return (
    <div className="space-y-6 text-left animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">MARKETING & PROMOTIONS</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">MARKETING DASHBOARD</h2>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex border-b border-white/5 gap-2 pb-2 mb-4 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setMarketingSubTab('campaigns')}
          className={`py-1.5 px-3.5 text-[9px] uppercase tracking-wider font-mono border duration-150 cursor-pointer ${
            marketingSubTab === 'campaigns'
              ? 'bg-gold-pure/10 border-gold-pure text-gold-pure font-bold'
              : 'bg-transparent border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Campaigns & Coupons
        </button>
        <button
          onClick={() => setMarketingSubTab('banners')}
          className={`py-1.5 px-3.5 text-[9px] uppercase tracking-wider font-mono border duration-150 cursor-pointer ${
            marketingSubTab === 'banners'
              ? 'bg-gold-pure/10 border-gold-pure text-gold-pure font-bold'
              : 'bg-transparent border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Banner Slider
        </button>
        <button
          onClick={() => setMarketingSubTab('homepage')}
          className={`py-1.5 px-3.5 text-[9px] uppercase tracking-wider font-mono border duration-150 cursor-pointer ${
            marketingSubTab === 'homepage'
              ? 'bg-gold-pure/10 border-gold-pure text-gold-pure font-bold'
              : 'bg-transparent border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Featured Products
        </button>
        <button
          onClick={() => setMarketingSubTab('comms')}
          className={`py-1.5 px-3.5 text-[9px] uppercase tracking-wider font-mono border duration-150 cursor-pointer ${
            marketingSubTab === 'comms'
              ? 'bg-gold-pure/10 border-gold-pure text-gold-pure font-bold'
              : 'bg-transparent border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          Marketing Channels
        </button>
      </div>

      {/* Sub-Tab Content rendering */}
      {marketingSubTab === 'campaigns' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
              <span className="text-[8px] font-mono uppercase text-zinc-500 block">Active Campaigns</span>
              <span className="text-lg font-bold font-display text-white">{campaigns.filter(c => c.status === 'active').length}</span>
            </div>
            <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
              <span className="text-[8px] font-mono uppercase text-zinc-500 block">Total Coupons</span>
              <span className="text-lg font-bold font-display text-white">{coupons.length}</span>
            </div>
            <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
              <span className="text-[8px] font-mono uppercase text-zinc-500 block">Active Banners</span>
              <span className="text-lg font-bold font-display text-white">{banners.filter(b => b.status === 'active').length}</span>
            </div>
            <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
              <span className="text-[8px] font-mono uppercase text-zinc-500 block">Subscribers</span>
              <span className="text-lg font-bold font-display text-white">{subscribers.length}</span>
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold-pure" /> Discount Campaigns
              </h3>
              <button 
                onClick={() => setIsAddCampaignOpen(true)}
                className="py-1 px-2.5 bg-black hover:bg-zinc-900 border border-white/10 hover:border-gold-pure text-white text-[8px] uppercase tracking-widest font-mono cursor-pointer"
              >
                + Add Campaign
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 text-[8px] uppercase tracking-wider">
                    <th className="pb-2">Campaign Name</th>
                    <th className="pb-2">Discount</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2 text-center">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {campaigns.map(camp => (
                    <tr key={camp.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 text-white font-sans font-medium">{camp.name}</td>
                      <td className="py-3 text-gold-pure font-bold">-{camp.discountPercent}% OFF</td>
                      <td className="py-3 text-zinc-400 font-mono text-[9px]">{camp.category}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => {
                            const nextStatus = camp.status === 'active' ? 'inactive' : 'active';
                            setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, status: nextStatus } : c));
                            addLog(`Updated Campaign "${camp.name}" Status to ${nextStatus}`, "Campaign Center");
                          }}
                          className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-xs border cursor-pointer ${
                            camp.status === 'active' 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-500'
                          }`}
                        >
                          {camp.status}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => {
                            if (window.confirm(`Delete campaign "${camp.name}"?`)) {
                              setCampaigns(prev => prev.filter(c => c.id !== camp.id));
                              addLog(`Deleted Campaign: ${camp.name}`, "Campaign Center");
                            }
                          }}
                          className="p-1 hover:text-rose-400 text-zinc-500 duration-150 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coupons Section */}
          <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-gold-pure" /> Discount Coupons
              </h3>
              <button 
                onClick={() => {
                  const code = prompt("Enter Promo Coupon Code (e.g. VIP2026):");
                  if (!code) return;
                  const rate = prompt("Enter discount percent value (e.g. 20):");
                  if (!rate) return;
                  const newC = {
                    id: `c-${Date.now()}`,
                    code: code.toUpperCase().trim(),
                    rate: parseInt(rate),
                    type: 'percent',
                    expiry: '2026-12-31',
                    limit: 100,
                    usedCount: 0
                  };
                  setCoupons(prev => [...prev, newC]);
                  addLog(`Created Promo Coupon: ${newC.code}`, "Coupon List");
                  alert(`Promo Coupon ${newC.code} successfully added!`);
                }}
                className="py-1 px-2.5 bg-black hover:bg-zinc-900 border border-white/10 hover:border-gold-pure text-white text-[8px] uppercase tracking-widest font-mono cursor-pointer"
              >
                + Create Coupon
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map(c => (
                <div key={c.id} className="p-4 bg-black/40 border border-white/5 rounded-xs font-mono text-[10px] space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-white text-sm font-sans block">{c.code}</strong>
                      <span className="text-[8.5px] text-zinc-500 block">Discount Code</span>
                    </div>
                    <span className="text-gold-pure font-bold text-sm bg-gold-pure/10 px-1.5 py-0.5 rounded-xs border border-gold-pure/20">-{c.rate}% OFF</span>
                  </div>
                  <div className="space-y-1 text-zinc-400 text-[9px]">
                    <p>• Used: {c.usedCount} of {c.limit} used</p>
                    <p>• Expires On: {c.expiry}</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Delete coupon "${c.code}"?`)) {
                        setCoupons(prev => prev.filter(x => x.id !== c.id));
                        addLog(`Erased Promo Coupon: ${c.code}`, "Coupon List");
                      }
                    }}
                    className="w-full py-1 bg-zinc-900 border border-white/5 hover:border-rose-500 hover:text-rose-400 text-[8.5px] rounded-xs text-center duration-150 uppercase font-bold cursor-pointer"
                  >
                    Delete Coupon
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {marketingSubTab === 'banners' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-gold-pure" /> HERO BANNER SLIDESHOW (CMS)
              </h3>
              <button 
                onClick={() => setIsAddBannerOpen(true)}
                className="py-1 px-2.5 bg-black hover:bg-zinc-900 border border-white/10 hover:border-gold-pure text-white text-[8px] uppercase tracking-widest font-mono cursor-pointer"
              >
                + Add Slide Banner
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {banners.map(b => (
                <div key={b.id} className="border border-white/5 bg-black/40 p-4 rounded-xs space-y-3">
                  <div className="aspect-[21/9] w-full bg-zinc-900 overflow-hidden border border-white/5 relative group">
                    <img 
                      src={b.image} 
                      alt={b.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 duration-350"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className={`px-1.5 py-0.5 text-[7px] font-mono font-bold uppercase rounded-xs ${
                        b.status === 'active' ? 'bg-emerald-500 text-black' : 'bg-zinc-700 text-zinc-300'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-white text-[11px] font-bold font-sans tracking-wide leading-tight">{b.title}</h4>
                      <p className="text-zinc-500 text-[8.5px] font-mono mt-0.5">Target link page: /store?category={b.link}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const nextStatus = b.status === 'active' ? 'inactive' : 'active';
                          setBanners(prev => prev.map(x => x.id === b.id ? { ...x, status: nextStatus } : x));
                          addLog(`Updated Banner Slider "${b.title}" Status to ${nextStatus}`, "CMS Slider");
                        }}
                        className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[8px] uppercase font-mono rounded-xs border border-white/5 hover:border-gold-pure text-center duration-150 cursor-pointer"
                      >
                        Toggle Status
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete slider banner "${b.title}"?`)) {
                            setBanners(prev => prev.filter(x => x.id !== b.id));
                            addLog(`Deleted Banner Slider: ${b.title}`, "CMS Slider");
                          }
                        }}
                        className="px-2.5 bg-zinc-900 hover:bg-rose-950 text-rose-400 hover:text-rose-200 text-[8px] rounded-xs border border-white/5 hover:border-rose-500 duration-150 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {marketingSubTab === 'homepage' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-2">
              <div>
                <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-gold-pure text-gold-pure" /> HOMEPAGE PROMOTIONS & FEATURED PRODUCTS
                </h3>
                <p className="text-[8px] text-zinc-500 uppercase font-mono mt-0.5">Select and highlight products on the front page</p>
              </div>
              
              <div className="relative max-w-xs w-full">
                <input 
                  type="text" 
                  placeholder="Search products to promote..." 
                  value={mktProductSearch}
                  onChange={(e) => setMktProductSearch(e.target.value)}
                  className="bg-black w-full border border-white/10 text-white pl-8 pr-3 py-1.5 text-[9.5px] rounded-xs outline-none focus:border-gold-pure font-mono"
                />
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 text-[8px] uppercase tracking-wider">
                    <th className="pb-2">Product Details</th>
                    <th className="pb-2">SKU / Brand</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2 text-center">Featured Status</th>
                    <th className="pb-2 text-right">Instant Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allProducts
                    .filter(p => {
                      if (!mktProductSearch) return true;
                      return p.name.toLowerCase().includes(mktProductSearch.toLowerCase()) || 
                             p.sku?.toLowerCase().includes(mktProductSearch.toLowerCase());
                    })
                    .slice(0, 15)
                    .map(p => {
                      const isFeatured = !!(p.isFeatured || p.featured || p.popular);
                      return (
                        <tr key={p.id} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-zinc-900 border border-white/5 overflow-hidden rounded-xs flex-shrink-0">
                              <img 
                                src={p.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=100'} 
                                alt={p.name} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <span className="text-white font-sans font-medium block">{p.name}</span>
                              <span className="text-zinc-500 text-[8px] block uppercase tracking-wide">Stock: {p.inventory} units</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-zinc-400">
                            <span className="block">{p.sku || 'N/A'}</span>
                            <span className="text-[8px] text-zinc-500 block">{p.brand || 'AL ZOAL'}</span>
                          </td>
                          <td className="py-2.5 text-zinc-500 text-[8.5px] uppercase">{p.category}</td>
                          <td className="py-2.5 text-white">{formatCurrency(p.price)}</td>
                          <td className="py-2.5 text-center">
                            <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-xs ${
                              isFeatured 
                                ? 'bg-gold-pure/10 border border-gold-pure/20 text-gold-pure font-bold' 
                                : 'bg-zinc-900 border border-white/5 text-zinc-500'
                            }`}>
                              {isFeatured ? '★ FEATURED' : 'STANDARD'}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => {
                                const nextVal = !isFeatured;
                                saveProductFields(p.id, { isFeatured: nextVal, featured: nextVal });
                                addLog(`Toggled homepage promotion status for product: ${p.name}`, "Product List");
                              }}
                              className={`px-2.5 py-1 rounded-xs border text-[8px] uppercase tracking-wider font-mono cursor-pointer duration-150 ${
                                isFeatured 
                                  ? 'bg-gold-pure text-black border-gold-pure hover:bg-white' 
                                  : 'bg-zinc-900 text-white border-white/10 hover:border-gold-pure'
                              }`}
                            >
                              {isFeatured ? 'Demote' : 'Promote ★'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {marketingSubTab === 'comms' && (
        <div className="space-y-6 animate-fade-in text-[10px]">
          {/* Row 1: Newsletter & Push Dispatch */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email newsletter compose editor */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gold-pure" /> EMAIL NEWSLETTER DISPATCH CONTROLLER
              </span>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const subject = formData.get('newsletter_subject') as string;
                if (!subject) return;
                addLog(`Dispatched email newsletter: "${subject}" to ${subscribers.length} VIP patrons`, "Campaign Center");
                alert(`Simulated dispatch sequence completed! Newsletter successfully sent to ${subscribers.length} verified email accounts.`);
                e.currentTarget.reset();
              }} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-mono text-zinc-500">Newsletter Subject Title</label>
                  <input type="text" name="newsletter_subject" required placeholder="Introducing our Autumn Bespoke Sudanese Gowns Premiere..." className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase font-mono text-zinc-500">HTML Rich Narrative Body</label>
                  <textarea rows={4} placeholder="Dear elite gatherer, we are pleased to present the newest micro-batch single-origin Yemeni harvests paired with royal handwoven Toob drapes..." className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure resize-none font-mono" />
                </div>
                <button type="submit" className="w-full py-2 bg-white text-black hover:bg-gold-pure font-bold uppercase tracking-widest text-[9.5px] cursor-pointer">
                  Simulate Newsletter Dispatch
                </button>
              </form>
            </div>

            {/* Instant Push Notifications Broadcaster */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-gold-pure" /> Instant Push Notifications Broadcaster
                </span>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const msg = formData.get('push_msg') as string;
                  if (!msg) return;
                  addLog(`Broadcasting instant push notification: "${msg}"`, "Campaign Center");
                  alert("Simulated push notification broadcast completed successfully!");
                  e.currentTarget.reset();
                }} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase font-mono text-zinc-500">Immediate Push Slogan Message</label>
                    <input type="text" name="push_msg" required placeholder="🔥 Riyadh main gate roasters now open! Get Saffron Latte in 5 mins..." className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono" />
                  </div>
                  <button type="submit" className="w-full py-1.5 bg-zinc-900 hover:bg-gold-pure hover:text-black text-white text-[9px] uppercase tracking-widest font-mono border border-white/10 cursor-pointer">
                    ⚡ Broadcast Push Alert
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-2">
                <span className="text-[8px] font-mono uppercase text-gold-pure tracking-widest block font-bold">Subscribers List</span>
                <div className="divide-y divide-white/5 font-mono text-[9px] max-h-24 overflow-y-auto">
                  {subscribers.map((sub, sIdx) => (
                    <div key={sIdx} className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="text-zinc-300 font-bold block">{sub.email}</span>
                        <span className="text-zinc-500 text-[8px] block">Verified sub date: {sub.date}</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Unsubscribe "${sub.email}"?`)) {
                            setSubscribers(prev => prev.filter(x => x.email !== sub.email));
                            addLog(`Unsubscribed subscriber email: ${sub.email}`, "Customer Campaign");
                          }
                        }}
                        className="text-rose-500 hover:underline font-bold cursor-pointer"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Future-ready Social Media & Omnichannel Campaign Broadcaster */}
          <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
            <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold border-b border-white/5 pb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-gold-pure" /> FUTURE-READY SOCIAL MEDIA CAMPAIGN BROADCASTER
            </span>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const postText = formData.get('social_msg') as string;
              const channels = [];
              if (formData.get('ch_insta')) channels.push('Instagram');
              if (formData.get('ch_fb')) channels.push('Facebook');
              if (formData.get('ch_snap')) channels.push('Snapchat');
              if (formData.get('ch_twitter')) channels.push('Twitter/X');
              if (formData.get('ch_wa')) channels.push('WhatsApp Business');

              if (!postText) {
                alert("Please write the post copy first.");
                return;
              }
              if (channels.length === 0) {
                alert("Please select at least one social media channel.");
                return;
              }

              addLog(`Omnichannel Cross-post dispatched to ${channels.join(', ')}: "${postText.slice(0, 40)}..."`, "Social Media Center");
              alert(`Successfully simulated marketing campaign publication! Dispatched to: ${channels.join(', ')}`);
              e.currentTarget.reset();
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] uppercase font-mono text-zinc-500">Omnichannel Social Copy & Hashtags</label>
                <textarea name="social_msg" rows={3} required placeholder="Exquisite traditional Sudanese craftsmanship meets modern luxury. Visit AL ZOAL to browse our limited Saffron collection. 🇸🇩✨ #ALZOAL #LuxuryHeritage #SpecialtyCoffee #SudaneseToob" className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure resize-none font-mono" />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] uppercase font-mono text-zinc-500 block">Select Integration Channels</label>
                <div className="flex flex-wrap gap-4 font-mono text-[9px] text-zinc-300">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input type="checkbox" name="ch_insta" defaultChecked className="accent-gold-pure" /> Instagram Feed
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input type="checkbox" name="ch_fb" defaultChecked className="accent-gold-pure" /> Facebook Page
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input type="checkbox" name="ch_snap" className="accent-gold-pure" /> Snapchat Spotlight
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input type="checkbox" name="ch_twitter" defaultChecked className="accent-gold-pure" /> Twitter/X
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input type="checkbox" name="ch_wa" defaultChecked className="accent-gold-pure" /> WhatsApp VIP
                  </label>
                </div>
              </div>

              <button type="submit" className="w-full py-2 bg-gold-pure text-black hover:bg-gold-pure/90 font-bold uppercase tracking-widest text-[9px] cursor-pointer">
                🚀 Simulate Omnichannel Campaign Launch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modals for creation */}
      {isAddCampaignOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in text-left text-zinc-400 font-sans">
          <div className="bg-zinc-950 border border-white/10 rounded-sm max-w-md w-full p-6 space-y-6 relative">
            <button 
              onClick={() => setIsAddCampaignOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer font-mono"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white text-md font-bold uppercase tracking-wider font-display">CREATE DISCOUNT CAMPAIGN</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('camp_name') as string;
              const discount = parseInt(formData.get('camp_discount') as string) || 10;
              const cat = formData.get('camp_category') as string;
              if (!name) {
                alert("Campaign name is required.");
                return;
              }
              const newCamp = {
                id: `cp-${Date.now()}`,
                name,
                discountPercent: discount,
                category: cat,
                status: 'active'
              };
              setCampaigns(prev => [...prev, newCamp]);
              addLog(`Launched discount campaign: ${name} (-${discount}%)`, "Campaign Center");
              setIsAddCampaignOpen(false);
              alert(`Campaign "${name}" is now active!`);
            }} className="space-y-4 text-[10px]">
              <div className="space-y-1">
                <label className="text-[8px] uppercase font-mono text-zinc-500">Campaign Name</label>
                <input type="text" name="camp_name" required placeholder="Autumn Velvet Gown Extravaganza" className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] uppercase font-mono text-zinc-500">Discount Percentage (%)</label>
                <input type="number" name="camp_discount" required min={1} max={99} defaultValue={15} className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] uppercase font-mono text-zinc-500">Applicable Business Category</label>
                <select name="camp_category" className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono">
                  {ALL_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-white hover:bg-gold-pure text-black font-bold uppercase tracking-widest text-[9px] cursor-pointer">
                Launch Campaign
              </button>
            </form>
          </div>
        </div>
      )}

      {isAddBannerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in text-left text-zinc-400 font-sans">
          <div className="bg-zinc-950 border border-white/10 rounded-sm max-w-md w-full p-6 space-y-6 relative">
            <button 
              onClick={() => setIsAddBannerOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer font-mono"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white text-md font-bold uppercase tracking-wider font-display">ADD HERO PROMOTIONAL BANNER</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const title = formData.get('ban_title') as string;
              const img = formData.get('ban_img') as string || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800';
              const link = formData.get('ban_link') as string;
              if (!title) {
                alert("Banner title is required.");
                return;
              }
              const newBan = {
                id: `ban-${Date.now()}`,
                title,
                image: img,
                link,
                status: 'active'
              };
              setBanners(prev => [...prev, newBan]);
              addLog(`Uploaded Promotional Banner: ${title}`, "CMS Slider");
              setIsAddBannerOpen(false);
              alert(`Hero banner "${title}" added to active slider pools.`);
            }} className="space-y-4 text-[10px]">
              <div className="space-y-1">
                <label className="text-[8px] uppercase font-mono text-zinc-500">Banner Slogan / Title</label>
                <input type="text" name="ban_title" required placeholder="Luxury Royal Sudanese Toob Collection" className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] uppercase font-mono text-zinc-500">Image URL</label>
                <input type="text" name="ban_img" placeholder="https://images.unsplash.com/photo-..." className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono" />
                <span className="text-[7.5px] text-zinc-500">Use Unsplash or direct image URL.</span>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] uppercase font-mono text-zinc-500">Destination Action Category</label>
                <select name="ban_link" className="bg-black w-full border border-white/10 text-white p-2 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono">
                  {ALL_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-white hover:bg-gold-pure text-black font-bold uppercase tracking-widest text-[9px] cursor-pointer">
                Publish Hero Banner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
