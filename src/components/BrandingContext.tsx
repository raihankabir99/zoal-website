import React, { createContext, useContext, useState, useEffect } from 'react';
import { BRANDING } from '../constants';

export interface GlobalSettings {
  businessName: string;
  businessLogo: string;
  favicon: string;
  address: string;
  email: string;
  phone: string;
  instagram: string;
  twitter: string;
  website?: string;
  language: string;
  currency: string;
  shippingFeeDefault: number;
  shippingFreeThreshold: number;
  taxRate: number;
  taxId: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  ipWhitelist: string;
  sessionExpirationMinutes: number;
  autoBackupFrequency: string;
  accentColor: string;
  companyDescription?: string;
  theme?: string;
  doubleAuthEnabled?: boolean;
  maintenanceMode?: boolean;
}

const DEFAULT_SETTINGS: GlobalSettings = {
  businessName: 'AL ZOAL Enterprise', businessLogo: BRANDING.LOGO, favicon: BRANDING.FAVICON,
  address: 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia', email: 'alzoal3003@gmail.com', phone: '+966 56 769 9315',
  instagram: 'https://instagram.com/alzoal', twitter: 'https://twitter.com/alzoal', website: 'https://alzoal.sa', language: 'en', currency: 'SAR',
  shippingFeeDefault: 35, shippingFreeThreshold: 500, taxRate: 15, taxId: 'VAT-789-ZOAL-99', smtpHost: 'smtp.zoal-cloud.sa', smtpPort: '587', smtpUser: 'relays@zoal.sa',
  ipWhitelist: '0.0.0.0/0', sessionExpirationMinutes: 120, autoBackupFrequency: 'daily', accentColor: '#D4AF37',
  companyDescription: 'Al Zoal Luxury Boutique - Sovereign Enterprise Class Boutique and Media Management Platform', theme: 'dark'
};

const getValidLogo = (logoPath: any): string => {
  if (typeof logoPath === 'string' && logoPath.trim() !== '' && !logoPath.includes('logo.svg') && !logoPath.includes('zoal-logo.jpg') && !logoPath.includes('zoal-logo-4.jpg')) return logoPath;
  return BRANDING.LOGO;
};

export const sanitizeSettingsForClient = (raw: any): GlobalSettings => {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  const validLogo = getValidLogo(raw.businessLogo);
  return {
    businessName: typeof raw.businessName === 'string' && raw.businessName.trim() ? raw.businessName : DEFAULT_SETTINGS.businessName,
    businessLogo: validLogo, favicon: BRANDING.FAVICON,
    address: typeof raw.address === 'string' ? raw.address : DEFAULT_SETTINGS.address,
    email: typeof raw.email === 'string' ? raw.email : DEFAULT_SETTINGS.email,
    phone: typeof raw.phone === 'string' ? raw.phone : DEFAULT_SETTINGS.phone,
    instagram: typeof raw.instagram === 'string' ? raw.instagram : DEFAULT_SETTINGS.instagram,
    twitter: typeof raw.twitter === 'string' ? raw.twitter : DEFAULT_SETTINGS.twitter,
    website: typeof raw.website === 'string' ? raw.website : DEFAULT_SETTINGS.website,
    language: typeof raw.language === 'string' ? raw.language : DEFAULT_SETTINGS.language,
    currency: typeof raw.currency === 'string' ? raw.currency : DEFAULT_SETTINGS.currency,
    shippingFeeDefault: typeof raw.shippingFeeDefault === 'number' && !isNaN(raw.shippingFeeDefault) ? raw.shippingFeeDefault : DEFAULT_SETTINGS.shippingFeeDefault,
    shippingFreeThreshold: typeof raw.shippingFreeThreshold === 'number' && !isNaN(raw.shippingFreeThreshold) ? raw.shippingFreeThreshold : DEFAULT_SETTINGS.shippingFreeThreshold,
    taxRate: typeof raw.taxRate === 'number' && !isNaN(raw.taxRate) ? raw.taxRate : DEFAULT_SETTINGS.taxRate,
    taxId: typeof raw.taxId === 'string' ? raw.taxId : DEFAULT_SETTINGS.taxId,
    smtpHost: typeof raw.smtpHost === 'string' ? raw.smtpHost : DEFAULT_SETTINGS.smtpHost,
    smtpPort: typeof raw.smtpPort === 'string' || typeof raw.smtpPort === 'number' ? String(raw.smtpPort) : DEFAULT_SETTINGS.smtpPort,
    smtpUser: typeof raw.smtpUser === 'string' ? raw.smtpUser : DEFAULT_SETTINGS.smtpUser,
    ipWhitelist: typeof raw.ipWhitelist === 'string' ? raw.ipWhitelist : DEFAULT_SETTINGS.ipWhitelist,
    sessionExpirationMinutes: typeof raw.sessionExpirationMinutes === 'number' && !isNaN(raw.sessionExpirationMinutes) ? raw.sessionExpirationMinutes : DEFAULT_SETTINGS.sessionExpirationMinutes,
    autoBackupFrequency: typeof raw.autoBackupFrequency === 'string' ? raw.autoBackupFrequency : DEFAULT_SETTINGS.autoBackupFrequency,
    accentColor: typeof raw.accentColor === 'string' ? raw.accentColor : DEFAULT_SETTINGS.accentColor,
    companyDescription: typeof raw.companyDescription === 'string' ? raw.companyDescription : DEFAULT_SETTINGS.companyDescription,
    theme: typeof raw.theme === 'string' ? raw.theme : DEFAULT_SETTINGS.theme,
    doubleAuthEnabled: typeof raw.doubleAuthEnabled === 'boolean' ? raw.doubleAuthEnabled : false,
    maintenanceMode: typeof raw.maintenanceMode === 'boolean' ? raw.maintenanceMode : false
  };
};

interface BrandingContextType {
  settings: GlobalSettings;
  updateSettings: (newSettings: GlobalSettings | ((prev: GlobalSettings) => GlobalSettings)) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const saved = localStorage.getItem('zoal_admin_global_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const sanitized = sanitizeSettingsForClient(parsed);
        if ('smtpPass' in parsed || 'smtp_pass' in parsed || 'password' in parsed || 'secret' in parsed) localStorage.setItem('zoal_admin_global_settings', JSON.stringify(sanitized));
        return sanitized;
      } catch (e) { console.error('Failed to parse branding settings:', e); }
    }
    return DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const getAuthToken = () => localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');

  const refreshBranding = async () => {
    try {
      setError(null);
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required to load authoritative branding settings.');
      const res = await fetch('/api/branding', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed to load branding: ${res.statusText}`);
      const data = await res.json();
      const sanitized = sanitizeSettingsForClient(data);
      setSettings(sanitized);
      localStorage.setItem('zoal_admin_global_settings', JSON.stringify(sanitized));
    } catch (err: any) {
      console.warn('⚠️ Authoritative branding unavailable; retaining last known client state:', err.message || err);
      setError(err.message || String(err));
    } finally { setLoading(false); }
  };

  const updateSettings = async (newSettingsOrFn: GlobalSettings | ((prev: GlobalSettings) => GlobalSettings)): Promise<boolean> => {
    const previousSettings = settings;
    const nextSettings = typeof newSettingsOrFn === 'function' ? newSettingsOrFn(settings) : newSettingsOrFn;
    const token = getAuthToken();
    if (!token) { setError('Authentication required to persist branding settings.'); return false; }
    try {
      const response = await fetch('/api/branding', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(nextSettings)
      });
      if (!response.ok) {
        let message = 'Failed to persist branding settings.';
        try { const errData = await response.json(); message = errData.error || errData.message || message; } catch (_) {}
        throw new Error(message);
      }
      const data = await response.json();
      if (!data.success || !data.settings) throw new Error('Branding persistence returned an invalid server response.');
      const sanitizedServer = sanitizeSettingsForClient(data.settings);
      setSettings(sanitizedServer);
      localStorage.setItem('zoal_admin_global_settings', JSON.stringify(sanitizedServer));
      setError(null);
      return true;
    } catch (err: any) {
      setSettings(previousSettings); setError(err.message || String(err));
      console.error('❌ Failed to persist branding on server:', err.message || err); return false;
    }
  };

  useEffect(() => {
    refreshBranding();
    const handleOnline = () => { refreshBranding(); };
    window.addEventListener('online', handleOnline);
    const interval = setInterval(() => { if (error) refreshBranding(); }, 20000);
    return () => { window.removeEventListener('online', handleOnline); clearInterval(interval); };
  }, []);

  useEffect(() => {
    const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (faviconLink) faviconLink.href = settings.favicon || settings.businessLogo;
    else { const newFavicon = document.createElement('link'); newFavicon.rel = 'icon'; newFavicon.href = settings.favicon || settings.businessLogo; document.head.appendChild(newFavicon); }
  }, [settings.favicon, settings.businessLogo]);

  const contextValue = React.useMemo(() => ({ settings, updateSettings, loading, error, refreshBranding }), [settings, loading, error]);
  return <BrandingContext.Provider value={contextValue}>{children}</BrandingContext.Provider>;
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) throw new Error('useBranding must be used within a BrandingProvider');
  return context;
};
