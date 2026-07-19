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
  language: string;
  currency: string;
  shippingFeeDefault: number;
  shippingFreeThreshold: number;
  taxRate: number;
  taxId: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  ipWhitelist: string;
  sessionExpirationMinutes: number;
  autoBackupFrequency: string;
  accentColor: string;
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
  language: 'en',
  currency: 'SAR',
  shippingFeeDefault: 35,
  shippingFreeThreshold: 500,
  taxRate: 15,
  taxId: 'VAT-789-ZOAL-99',
  smtpHost: 'smtp.zoal-cloud.sa',
  smtpPort: '587',
  smtpUser: 'relays@zoal.sa',
  smtpPass: '**********',
  ipWhitelist: '0.0.0.0/0',
  sessionExpirationMinutes: 120,
  autoBackupFrequency: 'daily',
  accentColor: '#D4AF37',
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
    const saved = localStorage.getItem('zoal_admin_global_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all fields exist
        return { ...DEFAULT_SETTINGS, ...parsed };
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
      setSettings((prev) => {
        const next = { ...DEFAULT_SETTINGS, ...data };
        localStorage.setItem('zoal_admin_global_settings', JSON.stringify(next));
        return next;
      });
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

    // 1. Optimistically update local state & offline cache
    setSettings(nextSettings);
    localStorage.setItem('zoal_admin_global_settings', JSON.stringify(nextSettings));

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
        setSettings(data.settings);
        localStorage.setItem('zoal_admin_global_settings', JSON.stringify(data.settings));
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
  }, [error]);

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

  return (
    <BrandingContext.Provider value={{ settings, updateSettings, loading, error, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
