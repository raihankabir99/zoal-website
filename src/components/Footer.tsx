import React, { useState } from 'react';
import { Camera, MapPin, Phone, Mail, Facebook, MessageCircle, X, Sparkles, Briefcase, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Tiktok = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

import { useBranding } from './BrandingContext';
import { BRANDING } from '../constants';

interface FooterProps {
  setCurrentPage: (page: string) => void;
  setSelectedCategoryFilter?: (category: string) => void;
}

export default function Footer({ setCurrentPage, setSelectedCategoryFilter }: FooterProps) {
  const { t, i18n } = useTranslation();
  const { settings } = useBranding();
  const [careersModalOpen, setCareersModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [appliedRoleMsg, setAppliedRoleMsg] = useState(false);
  
  const handleNavClick = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (categoryVal: string) => {
    if (setSelectedCategoryFilter) {
      setSelectedCategoryFilter(categoryVal);
    }
    handleNavClick('store');
  };

  return (
    <footer dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="bg-black border-t border-white/5 py-16 text-xs text-zinc-500 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Brand (columns 1 to 3) */}
          <div className="md:col-span-3 space-y-6">
            <button
              onClick={() => handleNavClick('home')}
              aria-label={t('nav.home', { defaultValue: 'Home' })}
              className="flex items-center cursor-pointer text-left group"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105 flex items-center justify-center">
                  <img
                    src={settings.businessLogo || BRANDING.LOGO}
                    alt={settings.businessName}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = BRANDING.LOGO;
                    }}
                    className="w-[145%] h-[145%] max-w-[145%] object-cover select-none pointer-events-none"
                  />
                </div>
              </div>
            </button>
            <div className="space-y-2">
              <h4 className="text-white text-xs font-display font-semibold tracking-wide">{t('footer.tagline')}</h4>
              <p className="text-gold-pure font-mono text-[10px] uppercase tracking-widest">{t('footer.businesses_short')}</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed max-w-xs">
                {t('footer.desc')}
              </p>
            </div>
            <div className="flex space-x-4 pt-2">
              <a href="https://www.tiktok.com/@alzoal_?lang=en-GB" target="_blank" rel="noreferrer" title={t('footer.social.tiktok_zoal')} aria-label={t('footer.social.tiktok_zoal_aria', { defaultValue: 'Follow ZOAL on TikTok' })} className="text-zinc-500 hover:text-gold-pure transition-colors">
                <Tiktok className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              </a>
              <a href="https://www.tiktok.com/@alzool.alragi2024" target="_blank" rel="noreferrer" title={t('footer.social.tiktok_alzool')} aria-label={t('footer.social.tiktok_alzool_aria', { defaultValue: 'Follow ALZOOL on TikTok' })} className="text-zinc-500 hover:text-gold-pure transition-colors">
                <Tiktok className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61580938591764&rdid=zqWqmIyC6GOYvzu6&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1EWt5kFsBQ%2F#" target="_blank" rel="noreferrer" title={t('footer.social.facebook')} aria-label={t('footer.social.facebook_aria', { defaultValue: 'Follow us on Facebook' })} className="text-zinc-500 hover:text-gold-pure transition-colors">
                <Facebook className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              </a>
              <a href="https://wa.me/966567699315" target="_blank" rel="noreferrer" title={t('footer.social.whatsapp')} aria-label={t('footer.social.whatsapp_aria', { defaultValue: 'Contact us on WhatsApp' })} className="text-zinc-500 hover:text-gold-pure transition-colors">
                <MessageCircle className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Column 2: BUSINESSES Navigation (columns 4 to 6) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-white text-[10px] uppercase font-display tracking-widest font-semibold">{t('footer.businesses')}</h4>
            <nav className="grid grid-cols-1 gap-y-2.5 text-zinc-400" aria-label={t('footer.businesses_aria', { defaultValue: 'Business Categories' })}>
              <button onClick={() => handleCategoryClick('coffee')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('store.category.coffee')}</button>
              <button onClick={() => handleCategoryClick('bakery')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('store.category.bakery')}</button>
              <button onClick={() => handleCategoryClick('market')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('store.category.market')}</button>
              <button onClick={() => handleCategoryClick('fashion')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('store.category.fashion')}</button>
              <button onClick={() => handleCategoryClick('thobes')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('store.category.thobes')}</button>
            </nav>
          </div>

          {/* Column 3: COMPANY Navigation (columns 7 to 8) */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-white text-[10px] uppercase font-display tracking-widest font-semibold">{t('footer.company')}</h4>
            <nav className="grid grid-cols-1 gap-y-2.5 text-zinc-400" aria-label={t('footer.company_aria', { defaultValue: 'Company Links' })}>
              <button onClick={() => handleNavClick('about')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('nav.about')}</button>
              <button onClick={() => handleNavClick('portfolio')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('nav.portfolio')}</button>
              <button onClick={() => handleNavClick('blog')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('nav.blog')}</button>
              <button onClick={() => handleNavClick('store')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('nav.store')}</button>
              <button onClick={() => handleNavClick('contact')} className="text-start hover:text-[#D4AF37] duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('nav.contact')}</button>
            </nav>
          </div>

          {/* Column 4: LEGAL & POLICIES (columns 9 to 10) */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-white text-[10px] uppercase font-display tracking-widest font-semibold">{t('footer.legal')}</h4>
            <nav className="grid grid-cols-1 gap-y-2.5 text-zinc-400" aria-label={t('footer.legal_aria', { defaultValue: 'Legal Links' })}>
              <button onClick={() => handleNavClick('faq')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('nav.faq')}</button>
              <button onClick={() => handleNavClick('privacy')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('nav.privacy')}</button>
              <button onClick={() => handleNavClick('terms')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('nav.terms')}</button>
              <button onClick={() => handleNavClick('shipping')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('footer.shipping_policy')}</button>
              <button onClick={() => handleNavClick('returns')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('footer.return_policy')}</button>
              <button onClick={() => handleNavClick('cookies')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('footer.cookie_policy')}</button>
              <button onClick={() => handleNavClick('deletion')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('footer.data_deletion')}</button>
            </nav>
          </div>

          {/* Column 5: Contact details and Saudi stamps (columns 11 to 12) */}
          <div className="md:col-span-2 space-y-4 text-zinc-400">
            <h4 className="text-white text-[10px] uppercase font-display tracking-widest font-semibold">{t('footer.flagship_stores')}</h4>
            
            <div className="space-y-3">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gold-pure shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-zinc-500 scale-95 origin-top-left leading-relaxed">
                  {settings.address === 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia' ? t('footer.address') : settings.address}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-pure shrink-0" aria-hidden="true" />
                <button onClick={() => handleNavClick('branches')} className="text-start hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">{t('footer.branches')}</button>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-pure shrink-0" aria-hidden="true" />
                <span className="text-zinc-500 font-mono" dir="ltr">{settings.phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold-pure shrink-0" aria-hidden="true" />
                <span className="text-zinc-500" dir="ltr">{settings.email}</span>
              </p>
            </div>

            <div className="p-3 border border-zinc-900 rounded-sm bg-zinc-950/20 text-[9.5px]">
              <span className="text-gold-pure font-bold block uppercase tracking-wider mb-0.5">{t('footer.premium_service')}</span>
              <p className="text-zinc-500 leading-tight">{t('footer.service_desc')}</p>
            </div>

          </div>

        </div>

        {/* Copyright and signature conforming to Artistic Flair footer standards */}
        <div className="pt-12 border-t border-white/5 mt-12 flex flex-wrap justify-center md:justify-between items-center text-zinc-500 text-[9px] tracking-[0.25em] uppercase gap-x-8 gap-y-4">
          <span>{t('footer.copyright')}</span>
          <a href="https://rkinfinity.pages.dev" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:text-white transition-colors duration-300 cursor-pointer">
            {t('footer.crafted_by')}
          </a>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
            <span className="text-zinc-300">
              {t('footer.flagship_open')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleNavClick('about')}
            className="text-[#D4AF37] hover:opacity-80 transition-opacity duration-200 cursor-pointer bg-transparent p-0 border-none uppercase tracking-[0.25em] text-[9px] font-sans"
            aria-label="Navigate to About Page"
          >
            {t('footer.zoal_standard')}
          </button>
        </div>

      </div>

      {/* Luxury Careers Modal */}
      {careersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative bg-zinc-950 border border-white/10 max-w-md w-full rounded-sm p-6 sm:p-8 shrink-0">
            
            <button
              onClick={() => {
                setCareersModalOpen(false);
                setSelectedRole(null);
                setAppliedRoleMsg(false);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-gold-pure p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-white/5 mb-4">
              <Briefcase className="w-8 h-8 text-gold-pure mx-auto mb-2 animate-pulse" />
              <h3 className="text-white text-sm font-display uppercase tracking-widest font-semibold">{t('footer.careers.title')}</h3>
              <p className="text-zinc-500 text-[10px] mt-1 font-sans">{t('footer.careers.desc')}</p>
            </div>

            {!appliedRoleMsg ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] text-[#D4AF37] uppercase tracking-widest block font-bold font-mono">{t('footer.careers.roles_label')}</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'baker', name: t('footer.careers.role_baker'), location: t('footer.careers.role_baker_loc') },
                      { id: 'roaster', name: t('footer.careers.role_roaster'), location: t('footer.careers.role_roaster_loc') },
                      { id: 'textile', name: t('footer.careers.role_textile'), location: t('footer.careers.role_textile_loc') }
                    ].map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.name)}
                        className={`text-start p-3 border rounded-xs transition-all duration-300 ${
                          selectedRole === role.name 
                            ? 'bg-gold-pure/10 border-gold-pure text-white' 
                            : 'bg-black/40 border-white/5 text-zinc-400 hover:border-white/10'
                        }`}
                      >
                        <div className="text-[11px] font-mono uppercase tracking-wider font-semibold">{role.name}</div>
                        <div className="text-[9px] text-zinc-500 font-sans mt-0.5">{role.location}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!selectedRole || !applicantName.trim() || !applicantEmail.trim()) return;
                  setAppliedRoleMsg(true);
                }} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">{t('footer.careers.full_name')}</label>
                    <input
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder=""
                      className="w-full bg-black border border-white/5 rounded-xs p-2.5 text-xs text-white focus:border-gold-pure/40 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">{t('footer.careers.email_address')}</label>
                    <input
                      type="email"
                      required
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder=""
                      className="w-full bg-black border border-white/5 rounded-xs p-2.5 text-xs text-white focus:border-gold-pure/40 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedRole}
                    className="w-full py-3 bg-gradient-to-r from-gold-dark to-gold-pure text-black font-display font-semibold uppercase tracking-widest text-[9.5px] rounded-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                  >
                    {t('footer.careers.submit')}
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <Sparkles className="w-8 h-8 text-gold-pure mx-auto animate-ping" />
                <h4 className="text-white text-xs uppercase tracking-widest font-mono font-bold">{t('footer.careers.received')}</h4>
                <p className="text-zinc-500 text-[10px] leading-relaxed max-w-xs mx-auto">
                  {t('footer.careers.success_msg', { name: applicantName, role: selectedRole })}
                </p>
                <button
                  onClick={() => {
                    setCareersModalOpen(false);
                    setSelectedRole(null);
                    setAppliedRoleMsg(false);
                    setApplicantName('');
                    setApplicantEmail('');
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xs border border-white/5 text-[9px] tracking-widest font-mono uppercase mt-4"
                >
                  {t('footer.careers.return_lounge')}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </footer>
  );
}
