import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError } from '../helpers';

// Default seed warehouses if database returns empty
const DEFAULT_WAREHOUSES = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    warehouse_name: 'Dammam Main Hub',
    warehouse_code: 'WH-DMM-01',
    country: 'Saudi Arabia',
    city: 'Dammam',
    address: 'King Fahd Road, Logistics Zone',
    manager: 'Tariq Al-Harbi',
    phone: '+966 50 123 4567',
    email: 'dammam.wh@zoal.com',
    capacity: 10000,
    used_capacity: 8200,
    status: 'Optimal',
    latitude: 26.4207,
    longitude: 50.0888
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    warehouse_name: 'Al Hofuf Lounge',
    warehouse_code: 'WH-HOF-02',
    country: 'Saudi Arabia',
    city: 'Al Hofuf',
    address: 'Al Ahsa Industrial District',
    manager: 'Musa Al-Ghamdi',
    phone: '+966 55 987 6543',
    email: 'hofuf.wh@zoal.com',
    capacity: 5000,
    used_capacity: 2250,
    status: 'Optimal',
    latitude: 25.3835,
    longitude: 49.5862
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    warehouse_name: 'Riyadh Distribution Gate',
    warehouse_code: 'WH-RUH-03',
    country: 'Saudi Arabia',
    city: 'Riyadh',
    address: 'Sully Logistics Park, Gate 4',
    manager: 'Sami Al-Otaibi',
    phone: '+966 51 444 3322',
    email: 'riyadh.wh@zoal.com',
    capacity: 25000,
    used_capacity: 22750,
    status: 'Near Capacity',
    latitude: 24.7136,
    longitude: 46.6753
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    warehouse_name: 'Jeddah Port Gateway',
    warehouse_code: 'WH-JED-04',
    country: 'Saudi Arabia',
    city: 'Jeddah',
    address: 'Jeddah Islamic Port Freezone',
    manager: 'Faisal Al-Dosari',
    phone: '+966 54 888 7766',
    email: 'jeddah.wh@zoal.com',
    capacity: 20000,
    used_capacity: 3000,
    status: 'Under-utilized',
    latitude: 21.4858,
    longitude: 39.1925
  }
];

/**
 * GET /api/warehouses
 * Retrieves all enterprise warehouses from Supabase zoal_warehouses.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    let { data: warehouses, error } = await supabase
      .from('zoal_warehouses')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !warehouses || warehouses.length === 0) {
      // Auto-seed defaults into DB if empty or table auto-created
      const { data: seeded, error: seedErr } = await supabase
        .from('zoal_warehouses')
        .upsert(DEFAULT_WAREHOUSES, { onConflict: 'warehouse_code' })
        .select();

      if (!seedErr && seeded && seeded.length > 0) {
        warehouses = seeded;
      } else {
        warehouses = DEFAULT_WAREHOUSES as any;
      }
    }

    // Enrich with products stock counts per warehouse location if possible
    const { data: products } = await supabase
      .from('zoal_products')
      .select('warehouse_location, inventory');

    const stockMap: Record<string, number> = {};
    if (products) {
      products.forEach((p: any) => {
        const loc = p.warehouse_location || 'Other';
        stockMap[loc] = (stockMap[loc] || 0) + (Number(p.inventory) || 0);
      });
    }

    const enrichedWarehouses = (warehouses || []).map((wh: any) => {
      // Compute utilization percentage
      const cap = Number(wh.capacity) || 10000;
      const used = Number(wh.used_capacity) || 0;
      const utilizationPct = cap > 0 ? Math.round((used / cap) * 100) : 0;
      
      return {
        ...wh,
        utilizationPct,
        activeStockUnits: stockMap[wh.warehouse_name] || stockMap[wh.city] || used || 0
      };
    });

    return apiResponse(enrichedWarehouses);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * POST /api/warehouses
 * Creates a new warehouse entry in Supabase zoal_warehouses.
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const body = await req.json();
    
    if (!body.warehouse_name && !body.name) {
      return apiError('Missing required field: warehouse_name', 400);
    }

    const name = body.warehouse_name || body.name;
    const code = body.warehouse_code || body.code || `WH-${name.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`;

    const payload = {
      warehouse_name: name,
      warehouse_code: code,
      country: body.country || 'Saudi Arabia',
      city: body.city || 'Dammam',
      address: body.address || '',
      manager: body.manager || '',
      phone: body.phone || '',
      email: body.email || '',
      capacity: body.capacity !== undefined ? parseInt(body.capacity, 10) : 10000,
      used_capacity: body.used_capacity !== undefined ? parseInt(body.used_capacity, 10) : 0,
      status: body.status || 'Optimal',
      latitude: body.latitude !== undefined ? parseFloat(body.latitude) : null,
      longitude: body.longitude !== undefined ? parseFloat(body.longitude) : null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('zoal_warehouses')
      .insert(payload)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiResponse(data, 201);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
