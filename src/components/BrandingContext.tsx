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
  businessName: 'AL ZOAL Enterprise',
  businessLogo: BRANDING.LOGO,
  favicon: BRANDING.FAVICON,
  address: 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia',
  email: 'alzoal3003@gmail.com',
  phone: '+966 56 769 9315',
  instagram: 'https://instagram.com/alzoal',
  twitter: 'https://twitter.com/alzoal',
  website: 'https://alzoal.sa',
  language: 'en',
  currency: 'SAR',
  shippingFeeDefault: 35,
  shippingFreeThreshold: 500,
  taxRate: 15,
  taxId: 'VAT-789-ZOAL-99',
  smtpHost: 'smtp.zoal-cloud.sa',
  smtpPort: '587',
  smtpUser: 'relays@zoal.sa',
  ipWhitelist: '0.0.0.0/0',
  sessionExpirationMinutes: 120,
  autoBackupFrequency: 'daily',
  accentColor: '#D4AF37',
  companyDescription: 'Al Zoal Luxury Boutique - Sovereign Enterprise Class Boutique and Media Management Platform',
  theme: 'dark'
};

/**
 * Sanitizes settings before storage or client consumption to ensure no sensitive credentials
 * (SMTP passwords, private keys, API secrets) ever persist in browser storage or component state.
 */
export const sanitizeSettingsForClient = (raw: any): GlobalSettings => {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  const validLogo = getValidLogo(raw.businessLogo);

  const sanitized: GlobalSettings = {
    businessName: typeof raw.businessName === 'string' && raw.businessName.trim() ? raw.businessName : DEFAULT_SETTINGS.businessName,
    businessLogo: validLogo,
    favicon: BRANDING.FAVICON,
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

  return sanitized;
};

interface BrandingContextType {
  settings: GlobalSettings;
  updateSettings: (newSettings: GlobalSettings | ((prev: GlobalSettings) => GlobalSettings)) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  refreshBranding: () => Promise<void>;
}

const getValidLogo = (logoPath: any): string => {
  if (typeof logoPath === 'string' && logoPath.trim() !== '' && !logoPath.includes('logo.svg') && !logoPath.includes('zoal-logo.jpg') && !logoPath.includes('zoal-logo-4.jpg')) {
    return logoPath;
  }
  return BRANDING.LOGO;
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem('zoal_admin_global_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const sanitized = sanitizeSettingsForClient(parsed);
        // Clean out legacy secret fields from localStorage immediately if present
        if ('smtpPass' in parsed || 'smtp_pass' in parsed || 'password' in parsed || 'secret' in parsed) {
          localStorage.setItem('zoal_admin_global_settings', JSON.stringify(sanitized));
        }
        return sanitized;
      } catch (e) {
        console.error('Failed to parse branding settings:', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBranding = async () => {
    try {
      setError(null);
      const res = await fetch('/api/branding');
      if (!res.ok) {
        throw new Error(`Failed to load branding: ${res.statusText}`);
      }
      const data = await res.json();
      const sanitized = sanitizeSettingsForClient(data);
      setSettings(sanitized);
      localStorage.setItem('zoal_admin_global_settings', JSON.stringify(sanitized));
    } catch (err: any) {
      console.warn('⚠️ Supabase/Backend branding unavailable, using offline cache:', err.message || err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettingsOrFn: GlobalSettings | ((prev: GlobalSettings) => GlobalSettings)): Promise<boolean> => {
    // Determine the next settings
    let nextSettings: GlobalSettings;
    if (typeof newSettingsOrFn === 'function') {
      nextSettings = newSettingsOrFn(settings);
    } else {
      nextSettings = newSettingsOrFn;
    }

    const sanitizedLocal = sanitizeSettingsForClient(nextSettings);

    // 1. Optimistically update local state & offline sanitized cache
    setSettings(sanitizedLocal);
    localStorage.setItem('zoal_admin_global_settings', JSON.stringify(sanitizedLocal));

    // 2. Persist to Supabase via REST API
    const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
    if (!token) {
      console.warn('⚠️ No auth token found. Branding saved to local offline cache only.');
      return false;
    }

    try {
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(nextSettings)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to persist branding settings to Supabase.');
      }

      const data = await response.json();
      if (data.success && data.settings) {
        const sanitizedServer = sanitizeSettingsForClient(data.settings);
        setSettings(sanitizedServer);
        localStorage.setItem('zoal_admin_global_settings', JSON.stringify(sanitizedServer));
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('❌ Failed to update branding on Supabase:', err.message || err);
      return false;
    }
  };

  // Synchronize on startup and setup network event handlers for automatic recovery
  useEffect(() => {
    refreshBranding();

    const handleOnline = () => {
      console.log('🌐 Network back online. Synchronizing branding settings with Supabase...');
      refreshBranding();
    };

    window.addEventListener('online', handleOnline);

    // Periodically poll to sync when backend becomes reachable again (automatic synchronization)
    const interval = setInterval(() => {
      if (error) {
        console.log('🔄 Retrying branding synchronization with Supabase...');
        refreshBranding();
      }
    }, 20000); // retry every 20 seconds if in error/offline state

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, []); // Only run on mount. Retries are handled by online event and interval.

  // Synchronize favicon and document title
  useEffect(() => {
    // Update favicon
    const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (faviconLink) {
      faviconLink.href = settings.favicon || settings.businessLogo;
    } else {
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = settings.favicon || settings.businessLogo;
      document.head.appendChild(newFavicon);
    }
  }, [settings.favicon, settings.businessLogo]);

  const contextValue = React.useMemo(() => ({
    settings,
    updateSettings,
    loading,
    error,
    refreshBranding
  }), [settings, loading, error]);

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    return {
      settings: DEFAULT_SETTINGS,
      updateSettings: async () => false,
      loading: false,
      error: null,
      refreshBranding: async () => {}
    };
  }
  return context;
};
