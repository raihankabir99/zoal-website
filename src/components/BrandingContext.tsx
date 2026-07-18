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
  address: 'Main Branch, Saudi Arabia',
  email: 'rkinfinity.official@gmail.com',
  phone: '+966 55 123 4567',
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
  updateSettings: (newSettings: GlobalSettings) => void;
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

  const updateSettings = (newSettings: GlobalSettings) => {
    setSettings(newSettings);
    localStorage.setItem('zoal_admin_global_settings', JSON.stringify(newSettings));
  };

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

    // Update document title if needed (though SEO component usually handles this)
    // We could also sync theme colors here if needed
  }, [settings.favicon, settings.businessLogo]);

  return (
    <BrandingContext.Provider value={{ settings, updateSettings }}>
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
