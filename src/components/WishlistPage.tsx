import React from 'react';
import { Product } from '../types';
import { useGlobalProducts } from '../imageRegistry';
import { ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SafeImage } from '../imageRegistry';
import { formatCurrency } from '../utils';

interface WishlistPageProps {
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, quantity: number, option?: string) => void;
  onSelectProduct: (product: Product) => void;
  setCurrentPage: (page: string) => void;
}

export default function WishlistPage({
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  setCurrentPage,
}: WishlistPageProps) {
  const { t, i18n } = useTranslation();
  const allProducts = useGlobalProducts();
  const wishlistProducts = allProducts.filter((p) => wishlist.includes(p.id));

  // Premium button state locks & visual indicators in Wishlist
  const [addingId, setAddingId] = React.useState<string | null>(null);
  const [successId, setSuccessId] = React.useState<string | null>(null);

  return (
    <div className="bg-black text-white min-h-screen pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-2 rtl:flex-row-reverse text-zinc-500 hover:text-white transition-colors uppercase tracking-widest text-[10px] mb-8"
        >
          <ArrowLeft className="w-3 h-3 rtl:rotate-180" /> {t('wishlist.back', { defaultValue: 'Back to Home' })}
        </button>
        
        <h1 className="text-2xl sm:text-3xl font-bold tracking-wider font-display uppercase text-white mb-8 border-b border-white/5 pb-6">
          {t('wishlist.title', { defaultValue: 'Your Private Collection' })}
        </h1>

        {wishlistProducts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/5 bg-zinc-950/25 rounded-sm">
            <h2 className="text-white text-md font-display uppercase tracking-widest font-semibold">{t('wishlist.empty', { defaultValue: 'Your collection is empty' })}</h2>
            <p className="text-zinc-500 text-xs mt-2">{t('wishlist.empty_desc', { defaultValue: 'Explore the catalog and reserve items for your collection.' })}</p>
            <button
              onClick={() => setCurrentPage('store')}
              className="mt-6 px-6 py-3 bg-white text-black text-[10px] font-display font-bold uppercase rounded-xs hover:bg-gold-pure transition-colors"
            >
              {t('wishlist.browse', { defaultValue: 'Browse Catalog' })}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {wishlistProducts.map((p) => (
              <div key={p.id} className="p-4 border border-white/5 bg-zinc-900/40 rounded-sm flex items-center justify-between gap-4">
                <div className="flex items-center space-x-4 rtl:space-x-reverse cursor-pointer" onClick={() => {
                  onSelectProduct(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}>
                  <SafeImage src={p.images[0]} alt={p.category === 'thobes' ? "ZOAL THOBES & MEN'S WEAR" : (i18n.language === 'ar' ? t(`products.${p.id}.name`, { defaultValue: p.name }) : p.name)} className="w-16 h-16 rounded-xs object-cover" containerClassName="w-16 h-16 relative rounded-xs overflow-hidden" />
                  <div>
                    <h4 className="text-white text-xs font-display font-semibold uppercase tracking-wider">{i18n.language === 'ar' ? t(`products.${p.id}.name`, { defaultValue: p.name }) : p.name}</h4>
                    <span className="text-gold-pure text-[10px] font-mono mt-1 block">{formatCurrency(p.price)} {t('app.sar')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <button
                    id={`wishlist-move-btn-${p.id}`}
                    disabled={addingId === p.id || successId === p.id}
                    onClick={() => {
                      const pid = p.id;
                      setAddingId(pid);
                      setTimeout(() => {
                        onAddToCart(p, 1, 'Standard option');
                        setAddingId(null);
                        setSuccessId(pid);
                        setTimeout(() => {
                          setSuccessId(null);
                        }, 1500);
                      }, 750);
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 border text-[10px] uppercase font-display font-bold rounded-xs transition-colors cursor-pointer select-none ${
                      successId === p.id
                        ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                        : addingId === p.id
                        ? 'bg-zinc-900 border-white/5 text-zinc-500 cursor-not-allowed'
                        : 'border-white/10 hover:border-white/30 text-white'
                    }`}
                  >
                    {addingId === p.id ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{i18n.language === 'ar' ? 'جاري الإضافة...' : 'ADDING...'}</span>
                      </>
                    ) : successId === p.id ? (
                      <span>{i18n.language === 'ar' ? '✓ تمت الإضافة' : '✓ ADDED'}</span>
                    ) : (
                      <>
                        <ShoppingBag className="w-3 h-3" /> 
                        <span>{t('wishlist.move_to_cart', { defaultValue: 'Move to Cart' })}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onToggleWishlist(p.id)}
                    className="p-2 border border-white/10 hover:border-rose-500 hover:text-rose-500 rounded-xs transition-all"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
