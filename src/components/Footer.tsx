import React, { useState } from 'react';
import { Camera, MapPin, Phone, Mail, Instagram, Twitter, MessageCircle, X, Sparkles, Briefcase, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoImg from '../assets/images/zoal_logo_fixed_1780848794781.png';

interface FooterProps {
  setCurrentPage: (page: string) => void;
  setSelectedCategoryFilter?: (category: string) => void;
}

export default function Footer({ setCurrentPage, setSelectedCategoryFilter }: FooterProps) {
  const { i18n } = useTranslation();
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
    <footer dir="ltr" className="bg-black border-t border-white/5 py-16 text-xs text-zinc-500 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Brand (columns 1 to 3) */}
          <div className="md:col-span-3 space-y-6">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center cursor-pointer text-left group"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105 flex items-center justify-center">
                  <img
                    src={logoImg}
                    alt="ZOAL Seal"
                    className="w-[145%] h-[145%] max-w-[145%] object-cover select-none pointer-events-none"
                  />
                </div>
              </div>
            </button>
            <div className="space-y-2">
              <h4 className="text-white text-xs font-display font-semibold tracking-wide">Crafted with Heritage. Delivered with Excellence.</h4>
              <p className="text-gold-pure font-mono text-[10px] uppercase tracking-widest">Coffee • Bakery • Grocery Market • Premium Thobes</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed max-w-xs">
                Authentic products, exceptional taste, and premium experiences for every customer.
              </p>
            </div>
            <div className="flex space-x-4 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-gold-pure transition-colors">
                <Instagram className="w-5 h-5 stroke-[1.5]" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-gold-pure transition-colors">
                <Twitter className="w-5 h-5 stroke-[1.5]" />
              </a>
              <a href="https://wa.me/966567699315" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-gold-pure transition-colors">
                <MessageCircle className="w-5 h-5 stroke-[1.5]" />
              </a>
            </div>
          </div>

          {/* Column 2: BUSINESSES Navigation (columns 4 to 6) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-white text-[10px] uppercase font-display tracking-widest font-semibold">BUSINESSES</h4>
            <div className="grid grid-cols-1 gap-y-2.5 text-zinc-400">
              <button onClick={() => handleCategoryClick('coffee')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">COFFEE HOUSE</button>
              <button onClick={() => handleCategoryClick('bakery')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">BAKERY & SNACKS</button>
              <button onClick={() => handleCategoryClick('market')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">MARKET & GROCERY</button>
              <button onClick={() => handleCategoryClick('fashion')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">PREMIUM COLLECTIONS</button>
              <button onClick={() => handleCategoryClick('thobes')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">THOBES & MEN'S WEAR</button>
            </div>
          </div>

          {/* Column 3: COMPANY Navigation (columns 7 to 8) */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-white text-[10px] uppercase font-display tracking-widest font-semibold">COMPANY</h4>
            <div className="grid grid-cols-1 gap-y-2.5 text-zinc-400">
              <button onClick={() => handleNavClick('about')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">About</button>
              <button onClick={() => handleNavClick('portfolio')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">Portfolio</button>
              <button onClick={() => handleNavClick('blog')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">Blog</button>
              <button onClick={() => handleNavClick('store')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">Store</button>
              <button onClick={() => handleNavClick('contact')} className="text-left hover:text-[#D4AF37] duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">Contact</button>
            </div>
          </div>

          {/* Column 4: LEGAL & POLICIES (columns 9 to 10) */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-white text-[10px] uppercase font-display tracking-widest font-semibold">LEGAL & TRUST</h4>
            <div className="grid grid-cols-1 gap-y-2.5 text-zinc-400">
              <button onClick={() => handleNavClick('faq')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">FAQ</button>
              <button onClick={() => handleNavClick('privacy')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">Privacy Policy</button>
              <button onClick={() => handleNavClick('terms')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">Terms & Conditions</button>
              <button onClick={() => handleNavClick('shipping')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">Shipping Policy</button>
              <button onClick={() => handleNavClick('returns')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">Return & Refund Policy</button>
              <button onClick={() => handleNavClick('cookies')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">Cookie Policy</button>
            </div>
          </div>

          {/* Column 5: Contact details and Saudi stamps (columns 11 to 12) */}
          <div className="md:col-span-2 space-y-4 text-zinc-400">
            <h4 className="text-white text-[10px] uppercase font-display tracking-widest font-semibold">The Saudi Flagships</h4>
            
            <div className="space-y-3">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gold-pure shrink-0 mt-0.5" />
                <span className="text-zinc-500 scale-95 origin-top-left leading-relaxed">
                  Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia
                </span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-pure shrink-0" />
                <button onClick={() => handleNavClick('branches')} className="text-left hover:text-gold-pure duration-300 transition-colors uppercase tracking-wider text-[11px] font-mono">Branches</button>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-pure shrink-0" />
                <span className="text-zinc-500 font-mono" dir="ltr">+966 56 769 9315</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold-pure shrink-0" />
                <span className="text-zinc-500" dir="ltr">alzoal3003@gmail.com</span>
              </p>
            </div>

            <div className="p-3 border border-zinc-900 rounded-sm bg-zinc-950/20 text-[9.5px]">
              <span className="text-gold-pure font-bold block uppercase tracking-wider mb-0.5">Sovereign Service Delivery</span>
              <p className="text-zinc-500 leading-tight">Every package undergoing triple inspection before dispatching under thermal shield covers.</p>
            </div>

          </div>

        </div>

        {/* Copyright and signature conforming to Artistic Flair footer standards */}
        <div className="pt-12 border-t border-white/5 mt-12 flex flex-wrap justify-center md:justify-between items-center text-zinc-500 text-[9px] tracking-[0.25em] uppercase gap-x-8 gap-y-4">
          <span>© {new Date().getFullYear()} ZOAL. All Rights Reserved.</span>
          <a href="https://rkinfinity.pages.dev" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:text-white transition-colors duration-300 cursor-pointer">Developed by rkInfinity (RK)</a>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
            <span className="text-zinc-300">Flagship Open: Al-Hofuf, Dammam</span>
          </div>
          <span className="text-[#D4AF37] hover:text-white transition-colors cursor-pointer" onClick={() => handleNavClick('about')}>Sovereign Standard</span>
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
              <h3 className="text-white text-sm font-display uppercase tracking-widest font-semibold">ZOAL Careers</h3>
              <p className="text-zinc-500 text-[10px] mt-1 font-sans">Apply for distinguished craft positions within our Al Hofuf and Dammam locations.</p>
            </div>

            {!appliedRoleMsg ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] text-[#D4AF37] uppercase tracking-widest block font-bold font-mono">Available Prestige Roles:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'baker', name: 'Sudanese Bakery Lead / Sourdough Specialist', location: 'Bakery Hearth Chambers' },
                      { id: 'roaster', name: 'COFFEE HOUSE Brewologist', location: 'Espresso Bar' },
                      { id: 'textile', name: 'Premium Collections Specialist', location: 'Atelier Couture Suite' }
                    ].map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.name)}
                        className={`text-left p-3 border rounded-xs transition-all duration-300 ${
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
                    <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">Full Name:</label>
                    <input
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="Nasser Al-Saudi"
                      className="w-full bg-black border border-white/5 rounded-xs p-2.5 text-xs text-white focus:border-gold-pure/40 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">Email Address:</label>
                    <input
                      type="email"
                      required
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder="alzoal3003@gmail.com"
                      className="w-full bg-black border border-white/5 rounded-xs p-2.5 text-xs text-white focus:border-gold-pure/40 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedRole}
                    className="w-full py-3 bg-gradient-to-r from-gold-dark to-gold-pure text-black font-display font-semibold uppercase tracking-widest text-[9.5px] rounded-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                  >
                    Submit Luxe Application
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <Sparkles className="w-8 h-8 text-gold-pure mx-auto animate-ping" />
                <h4 className="text-white text-xs uppercase tracking-widest font-mono font-bold">Application Received</h4>
                <p className="text-zinc-500 text-[10px] leading-relaxed max-w-xs mx-auto">
                  Greetings, <strong className="text-white">{applicantName}</strong>. Your luxury application for <strong className="text-white">{selectedRole}</strong> has been transmitted successfully to our corporate selection deck. A curation official will reach out shortly.
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
                  Return to Lounge
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </footer>
  );
}
