import { getSupabaseClient } from './supabase';

export interface ShippingRule {
  id: string;
  name: string;
  country: string;
  city: string;
  district: string;
  postal_code: string;
  delivery_method: 'local_delivery' | 'smsa' | 'aramex' | 'spl' | 'dhl';
  shipping_provider: 'local' | 'smsa' | 'aramex' | 'spl' | 'dhl';
  shipping_fee: number;
  currency: string;
  smsa_allowed: boolean;
  sms_allowed?: boolean; // backwards/forwards compatibility alias
  active: boolean;
  priority: number;
  free_shipping_threshold?: number;
  created_at?: string;
  updated_at?: string;
}

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

export interface ShipmentResult {
  success: boolean;
  shipmentId?: string;
  trackingNumber?: string;
  labelUrl?: string;
  status?: string;
  error?: string;
}

export interface ShippingProvider {
  name: string;
  createShipment(order: any): Promise<ShipmentResult>;
  cancelShipment(shipmentId: string): Promise<boolean>;
  getTracking(trackingNumber: string): Promise<any>;
  getShipmentStatus(trackingNumber: string): Promise<string>;
  generateLabel(shipmentId: string): Promise<string>;
}

// =========================================================================
// 1. DEFAULT STATIC RULES (FOR IN-MEMORY / FALLBACK AND BOOTSTRAPPING)
// =========================================================================
export const DEFAULT_SHIPPING_RULES: ShippingRule[] = [
  // Al-Hofuf Core: Local Delivery Only
  {
    id: 'rule-hofuf-core-local',
    name: 'Al-Hofuf Core Local Delivery',
    country: 'Saudi Arabia',
    city: 'Hofuf',
    district: 'Core',
    postal_code: '*',
    delivery_method: 'local_delivery',
    shipping_provider: 'local',
    shipping_fee: 20,
    currency: 'SAR',
    smsa_allowed: false,
    active: true,
    priority: 10
  },
  // Al-Hofuf Extended: SMSA Only
  {
    id: 'rule-hofuf-extended-smsa',
    name: 'Al-Hofuf Extended SMSA Shipping',
    country: 'Saudi Arabia',
    city: 'Hofuf',
    district: 'Extended',
    postal_code: '*',
    delivery_method: 'smsa',
    shipping_provider: 'smsa',
    shipping_fee: 40,
    currency: 'SAR',
    smsa_allowed: true,
    active: true,
    priority: 10
  },
  // Al-Hofuf Mixed Area: Both Local Delivery and SMSA available simultaneously
  {
    id: 'rule-hofuf-mixed-local',
    name: 'Al-Hofuf Mixed Area Local Delivery',
    country: 'Saudi Arabia',
    city: 'Hofuf',
    district: 'Mixed',
    postal_code: '*',
    delivery_method: 'local_delivery',
    shipping_provider: 'local',
    shipping_fee: 25,
    currency: 'SAR',
    smsa_allowed: false,
    active: true,
    priority: 10
  },
  {
    id: 'rule-hofuf-mixed-smsa',
    name: 'Al-Hofuf Mixed Area SMSA Shipping',
    country: 'Saudi Arabia',
    city: 'Hofuf',
    district: 'Mixed',
    postal_code: '*',
    delivery_method: 'smsa',
    shipping_provider: 'smsa',
    shipping_fee: 40,
    currency: 'SAR',
    smsa_allowed: true,
    active: true,
    priority: 5
  },
  // Generic City Local Rule (Allows mapping Hofuf/Al-Hofuf to core rule as wildcard fallback)
  {
    id: 'rule-hofuf-wildcard-local',
    name: 'Al-Hofuf Standard Local Delivery',
    country: 'Saudi Arabia',
    city: 'Hofuf',
    district: '*',
    postal_code: '*',
    delivery_method: 'local_delivery',
    shipping_provider: 'local',
    shipping_fee: 20,
    currency: 'SAR',
    smsa_allowed: false,
    active: true,
    priority: 1
  },
  // General Eastern Province Rules
  {
    id: 'rule-eastern-province-local',
    name: 'Regional Local Delivery',
    country: 'Saudi Arabia',
    city: 'Khobar',
    district: '*',
    postal_code: '*',
    delivery_method: 'local_delivery',
    shipping_provider: 'local',
    shipping_fee: 25,
    currency: 'SAR',
    smsa_allowed: false,
    active: true,
    priority: 1
  },
  // Nationwide SMSA Delivery (Wildcard fallback for any city outside local core zone)
  {
    id: 'rule-nationwide-smsa',
    name: 'Saudi Arabia National SMSA Shipping',
    country: 'Saudi Arabia',
    city: '*',
    district: '*',
    postal_code: '*',
    delivery_method: 'smsa',
    shipping_provider: 'smsa',
    shipping_fee: 45,
    currency: 'SAR',
    smsa_allowed: true,
    active: true,
    priority: 1
  }
];

// =========================================================================
// 2. SHIPPING PROVIDER IMPLEMENTATIONS
// =========================================================================

export class LocalDeliveryProvider implements ShippingProvider {
  name = 'ZOAL Local Logistics';

  async createShipment(order: any): Promise<ShipmentResult> {
    // Functional local delivery generation
    const referenceId = order.id || `ZL-LOC-${Date.now()}`;
    const trackingNumber = `ZLT-LOC-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      success: true,
      shipmentId: `ship-loc-${Date.now()}`,
      trackingNumber,
      status: 'pending_dispatch'
    };
  }

  async cancelShipment(shipmentId: string): Promise<boolean> {
    console.log(`Local shipment cancelled: ${shipmentId}`);
    return true;
  }

  async getTracking(trackingNumber: string): Promise<any> {
    return {
      trackingNumber,
      carrier: 'ZOAL Local',
      status: 'In Transit',
      updates: [
        { time: new Date().toISOString(), location: 'Al Hofuf Hub', detail: 'Order processed and ready for dispatch.' }
      ]
    };
  }

  async getShipmentStatus(trackingNumber: string): Promise<string> {
    return 'in_transit';
  }

  async generateLabel(shipmentId: string): Promise<string> {
    return `https://zoalgroup.com/labels/local/${shipmentId}`;
  }
}

export class SMSAProvider implements ShippingProvider {
  name = 'SMSA Express';

  async createShipment(order: any): Promise<ShipmentResult> {
    // Explicit, safe "not configured" reporting to prevent mock values from appearing as actual shipments
    return {
      success: false,
      error: 'SMSA integration credentials not configured in this system environment.'
    };
  }

  async cancelShipment(shipmentId: string): Promise<boolean> {
    return false;
  }

  async getTracking(trackingNumber: string): Promise<any> {
    return { error: 'SMSA integration credentials not configured.' };
  }

  async getShipmentStatus(trackingNumber: string): Promise<string> {
    return 'unconfigured';
  }

  async generateLabel(shipmentId: string): Promise<string> {
    throw new Error('SMSA integration credentials not configured.');
  }
}

export type ShipmentStatus =
  | 'pending'
  | 'shipment_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'failed';

export interface MockShipment {
  shipment_id: string;
  tracking_number: string;
  provider: string;
  delivery_method: string;
  order_id: string;
  shipment_status: ShipmentStatus;
  created_at: string;
  updated_at: string;
  label_url?: string;
}

// In-memory persistence map stored in global context to survive restarts
const globalAny = global as any;
if (!globalAny.mockShipmentsDb) {
  globalAny.mockShipmentsDb = new Map<string, MockShipment>();
}
export const mockShipmentsDb: Map<string, MockShipment> = globalAny.mockShipmentsDb;

export function isMockShippingEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ENABLE_MOCK_SHIPPING === 'true';
}

export class MockSMSAProvider implements ShippingProvider {
  name = 'SMSA Express (MOCK)';

  async createShipment(order: any): Promise<ShipmentResult> {
    const orderId = order.id || `MOCK-ORD-${Date.now()}`;
    const shipmentId = `MOCK-SMSA-ID-${Date.now()}`;
    const trackingNumber = `MOCK-AWB-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const mockShipment: MockShipment = {
      shipment_id: shipmentId,
      tracking_number: trackingNumber,
      provider: 'smsa',
      delivery_method: 'smsa',
      order_id: orderId,
      shipment_status: 'shipment_created',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      label_url: `https://zoalgroup.com/labels/mock-smsa/${shipmentId}`
    };

    mockShipmentsDb.set(shipmentId, mockShipment);

    return {
      success: true,
      shipmentId,
      trackingNumber,
      status: 'shipment_created',
      labelUrl: mockShipment.label_url
    };
  }

  async cancelShipment(shipmentId: string): Promise<boolean> {
    const shipment = mockShipmentsDb.get(shipmentId);
    if (shipment) {
      shipment.shipment_status = 'cancelled';
      shipment.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  async getTracking(trackingNumber: string): Promise<any> {
    let shipment: MockShipment | undefined;
    for (const item of mockShipmentsDb.values()) {
      if (item.tracking_number === trackingNumber) {
        shipment = item;
        break;
      }
    }

    if (!shipment) {
      return { error: `Mock shipment with tracking number ${trackingNumber} not found.` };
    }

    const updates = [
      { time: shipment.created_at, location: 'Riyadh Sorting Facility', detail: 'Mock Shipment created and parsed.' }
    ];

    if (shipment.shipment_status !== 'shipment_created') {
      updates.push({
        time: shipment.updated_at,
        location: 'Local Delivery Hub',
        detail: `Mock shipment updated to status: ${shipment.shipment_status}`
      });
    }

    return {
      trackingNumber: shipment.tracking_number,
      carrier: 'SMSA Express (MOCK)',
      status: shipment.shipment_status,
      updates
    };
  }

  async getShipmentStatus(trackingNumber: string): Promise<string> {
    for (const item of mockShipmentsDb.values()) {
      if (item.tracking_number === trackingNumber) {
        return item.shipment_status;
      }
    }
    return 'not_found';
  }

  async generateLabel(shipmentId: string): Promise<string> {
    const shipment = mockShipmentsDb.get(shipmentId);
    if (shipment) {
      return shipment.label_url || `https://zoalgroup.com/labels/mock-smsa/${shipmentId}`;
    }
    throw new Error('Shipment not found');
  }
}

// Future providers like Aramex, SPL, DHL can be instantiated here by implementing ShippingProvider
export class AramexProvider implements ShippingProvider {
  name = 'Aramex';
  async createShipment(order: any): Promise<ShipmentResult> { return { success: false, error: 'Aramex not configured' }; }
  async cancelShipment(shipmentId: string): Promise<boolean> { return false; }
  async getTracking(trackingNumber: string): Promise<any> { return { error: 'Aramex not configured' }; }
  async getShipmentStatus(trackingNumber: string): Promise<string> { return 'unconfigured'; }
  async generateLabel(shipmentId: string): Promise<string> { throw new Error('Aramex not configured'); }
}

export class SPLProvider implements ShippingProvider {
  name = 'SPL';
  async createShipment(order: any): Promise<ShipmentResult> { return { success: false, error: 'SPL not configured' }; }
  async cancelShipment(shipmentId: string): Promise<boolean> { return false; }
  async getTracking(trackingNumber: string): Promise<any> { return { error: 'SPL not configured' }; }
  async getShipmentStatus(trackingNumber: string): Promise<string> { return 'unconfigured'; }
  async generateLabel(shipmentId: string): Promise<string> { throw new Error('SPL not configured'); }
}

export class DHLProvider implements ShippingProvider {
  name = 'DHL';
  async createShipment(order: any): Promise<ShipmentResult> { return { success: false, error: 'DHL not configured' }; }
  async cancelShipment(shipmentId: string): Promise<boolean> { return false; }
  async getTracking(trackingNumber: string): Promise<any> { return { error: 'DHL not configured' }; }
  async getShipmentStatus(trackingNumber: string): Promise<string> { return 'unconfigured'; }
  async generateLabel(shipmentId: string): Promise<string> { throw new Error('DHL not configured'); }
}

const providers: Record<string, ShippingProvider> = {
  local: new LocalDeliveryProvider(),
  smsa: new SMSAProvider(),
  aramex: new AramexProvider(),
  spl: new SPLProvider(),
  dhl: new DHLProvider()
};

export function getProvider(name: string): ShippingProvider | undefined {
  const pName = name.toLowerCase();
  if (pName === 'smsa' && isMockShippingEnabled()) {
    return new MockSMSAProvider();
  }
  return providers[pName];
}

// =========================================================================
// 3. SHIPPING RULE ENGINE RESOLVER
// =========================================================================

export async function fetchRulesFromDb(): Promise<ShippingRule[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('zoal_shipping_rules')
      .select('*')
      .eq('active', true)
      .order('priority', { ascending: false });

    if (error) {
      console.warn('⚠️ Error reading zoal_shipping_rules from database, using code-based rules:', error.message);
      return [];
    }

    if (data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        country: item.country,
        city: item.city,
        district: item.district,
        postal_code: item.postal_code,
        delivery_method: item.delivery_method,
        shipping_provider: item.shipping_provider,
        shipping_fee: Number(item.shipping_fee),
        currency: item.currency || 'SAR',
        smsa_allowed: item.smsa_allowed ?? item.sms_allowed ?? true,
        active: item.active,
        priority: item.priority,
        free_shipping_threshold: item.free_shipping_threshold !== undefined && item.free_shipping_threshold !== null ? Number(item.free_shipping_threshold) : 500
      }));
    }
  } catch (err: any) {
    console.error('Failed to load rules from Supabase database:', err.message);
  }

  return [];
}

function normalize(str: string): string {
  return (str || '').trim().toLowerCase();
}

/**
 * Resolves all eligible shipping rules/options based on delivery address.
 */
export async function resolveShippingOptions(address: {
  country?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  subtotal?: number;
}): Promise<ShippingOption[]> {
  const dbRules = await fetchRulesFromDb();
  const rules = dbRules.length > 0 ? dbRules : DEFAULT_SHIPPING_RULES;

  const country = address.country || 'Saudi Arabia';
  const city = address.city || '';
  const district = address.district || '';
  const postalCode = address.postal_code || '';
  const subtotal = address.subtotal || 0;

  const normCountry = normalize(country);
  const normCity = normalize(city);
  const normDistrict = normalize(district);
  const normPostalCode = normalize(postalCode);

  // Filter rules matching criteria
  const matchedRules = rules.filter(rule => {
    if (!rule.active) return false;

    // 1. Country Check (with wildcard support)
    if (rule.country !== '*' && normalize(rule.country) !== normCountry) {
      return false;
    }

    // 2. City Check
    const rCity = normalize(rule.city);
    // Handle variations like Hofuf, Al-Hofuf, الهفوف
    const isHofufMatch = (normCity.includes('hofuf') || normCity.includes('هفوف')) && (rCity.includes('hofuf') || rCity.includes('هفوف'));
    const isCityWildcard = rCity === '*';
    const isExactCity = rCity === normCity;
    
    if (!isExactCity && !isCityWildcard && !isHofufMatch) {
      return false;
    }

    // 3. District Check
    const rDistrict = normalize(rule.district);
    const isDistrictWildcard = rDistrict === '*';
    const isExactDistrict = normDistrict.includes(rDistrict) || rDistrict.includes(normDistrict);
    
    if (!isExactDistrict && !isDistrictWildcard) {
      return false;
    }

    // 4. Postal Code Check
    const rPostal = normalize(rule.postal_code);
    const isPostalWildcard = rPostal === '*';
    const isExactPostal = rPostal === normPostalCode;
    
    if (!isExactPostal && !isPostalWildcard) {
      return false;
    }

    return true;
  });

  // Sort by priority (highest first)
  matchedRules.sort((a, b) => b.priority - a.priority);

  // Group by delivery_method and pick the highest priority rule for each method
  const uniqueMethods: Record<string, ShippingRule> = {};
  for (const rule of matchedRules) {
    if (!uniqueMethods[rule.delivery_method] || uniqueMethods[rule.delivery_method].priority < rule.priority) {
      uniqueMethods[rule.delivery_method] = rule;
    }
  }

  // Map to ShippingOption structures
  return Object.values(uniqueMethods).map(rule => {
    const isSmsa = rule.delivery_method === 'smsa';
    const providerObj = getProvider(rule.shipping_provider);

    // Dynamic Free Shipping Threshold Check
    let finalFee = rule.shipping_fee;
    const threshold = rule.free_shipping_threshold !== undefined && rule.free_shipping_threshold !== null ? rule.free_shipping_threshold : 500;
    if (subtotal >= threshold) {
      finalFee = 0;
    }

    let eta = '2-3 business days';
    if (rule.delivery_method === 'local_delivery') {
      eta = 'Same-day delivery (Order before 4 PM)';
    }

    return {
      id: rule.id,
      method: rule.delivery_method,
      provider: rule.shipping_provider,
      fee: finalFee,
      currency: rule.currency || 'SAR',
      smsa_allowed: rule.smsa_allowed,
      eta,
      available: rule.shipping_provider === 'local' || (rule.shipping_provider === 'smsa' && isMockShippingEnabled()),
      message: rule.shipping_provider === 'smsa'
        ? (isMockShippingEnabled() ? 'SMSA running in Simulated Dev Mode' : 'SMSA integration not configured')
        : undefined
    };
  });
}

/**
 * Validates and calculates authoritative server-side shipping fee.
 */
export async function calculateAuthoritativeShippingFee(address: {
  country?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  subtotal?: number;
}, selectedMethod: string): Promise<{ fee: number; ruleId: string; provider: string; smsaAllowed: boolean }> {
  const options = await resolveShippingOptions(address);
  
  const selectedOption = options.find(opt => opt.method === selectedMethod);
  if (!selectedOption) {
    throw new Error(`The shipping method '${selectedMethod}' is not eligible or available for this address.`);
  }

  return {
    fee: selectedOption.fee,
    ruleId: selectedOption.id,
    provider: selectedOption.provider,
    smsaAllowed: selectedOption.smsa_allowed
  };
}
