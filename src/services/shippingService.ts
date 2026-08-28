export interface ShippingOption {
  id: string;
  method: 'local_delivery' | 'smsa' | 'aramex' | 'spl' | 'dhl';
  provider: 'local' | 'smsa' | 'aramex' | 'spl' | 'dhl';
  fee: number;
  currency: string;
  smsa_allowed: boolean;
  eta: string;
  available: boolean;
  message?: string;
}

/**
 * Resolves available shipping options from the server-side Shipping engine.
 */
export async function getShippingOptionsFromServer(address: {
  country?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  subtotal?: number;
}): Promise<ShippingOption[]> {
  try {
    const response = await fetch('/api/shipping/options', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(address)
    });

    if (!response.ok) {
      throw new Error('Server returned non-200 status');
    }

    const data = await response.json();
    if (data && data.options) {
      return data.options;
    }
  } catch (err) {
    console.warn('⚠️ Server-side shipping resolution failed or is offline. Using local client fallback:', err);
  }

  // Purely client-side fallback matching the default rules so that offline mode continues to operate
  return getLocalClientFallbackRules(address);
}

/**
 * Robust client-side offline fallback calculations matching the default core rules.
 */
function getLocalClientFallbackRules(address: {
  city?: string;
  district?: string;
  subtotal?: number;
}): ShippingOption[] {
  const cityLower = (address.city || '').toLowerCase();
  const districtLower = (address.district || '').toLowerCase();
  const subtotal = address.subtotal || 0;
  const isFree = subtotal >= 500;

  const isHofuf = cityLower.includes('hofuf') || cityLower.includes('هفوف');
  
  const options: ShippingOption[] = [];

  if (isHofuf) {
    if (districtLower.includes('extended')) {
      // SMSA Only for extended Al-Hofuf districts
      options.push({
        id: 'fallback-hofuf-extended-smsa',
        method: 'smsa',
        provider: 'smsa',
        fee: isFree ? 0 : 40,
        currency: 'SAR',
        smsa_allowed: true,
        eta: '2-3 business days',
        available: false,
        message: 'SMSA integration not configured'
      });
    } else if (districtLower.includes('mixed')) {
      // Multiple options available in Hofuf Mixed districts!
      options.push({
        id: 'fallback-hofuf-mixed-local',
        method: 'local_delivery',
        provider: 'local',
        fee: isFree ? 0 : 25,
        currency: 'SAR',
        smsa_allowed: false,
        eta: 'Same-day delivery (Order before 4 PM)',
        available: true
      });
      options.push({
        id: 'fallback-hofuf-mixed-smsa',
        method: 'smsa',
        provider: 'smsa',
        fee: isFree ? 0 : 40,
        currency: 'SAR',
        smsa_allowed: true,
        eta: '2-3 business days',
        available: false,
        message: 'SMSA integration not configured'
      });
    } else {
      // Standard local core Al-Hofuf
      options.push({
        id: 'fallback-hofuf-core-local',
        method: 'local_delivery',
        provider: 'local',
        fee: isFree ? 0 : 20,
        currency: 'SAR',
        smsa_allowed: false,
        eta: 'Same-day delivery (Order before 4 PM)',
        available: true
      });
    }
  } else if (cityLower.includes('dammam') || cityLower.includes('khobar') || cityLower.includes('دمام') || cityLower.includes('خبر')) {
    // Other Eastern province regions
    options.push({
      id: 'fallback-eastern-province-local',
      method: 'local_delivery',
      provider: 'local',
      fee: isFree ? 0 : 25,
      currency: 'SAR',
      smsa_allowed: false,
      eta: 'Same-day delivery (Order before 4 PM)',
      available: true
    });
  } else {
    // Nationwide SMSA
    options.push({
      id: 'fallback-nationwide-smsa',
      method: 'smsa',
      provider: 'smsa',
      fee: isFree ? 0 : 45,
      currency: 'SAR',
      smsa_allowed: true,
      eta: '2-3 business days',
      available: false,
      message: 'SMSA integration not configured'
    });
  }

  return options;
}
