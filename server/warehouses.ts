import { Request, Response } from 'express';
import { getSupabaseClient } from './supabase';

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
 * Retrieves all enterprise warehouses.
 */
export async function getWarehouses(req: Request, res: Response) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // If Supabase is not configured, fall back to default seeds
      return res.json(DEFAULT_WAREHOUSES.map(wh => ({
        ...wh,
        utilizationPct: wh.capacity > 0 ? Math.round((wh.used_capacity / wh.capacity) * 100) : 0,
        activeStockUnits: wh.used_capacity
      })));
    }

    let { data: warehouses, error } = await supabase
      .from('zoal_warehouses')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !warehouses || warehouses.length === 0) {
      // Auto-seed defaults if table is empty
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
      const cap = Number(wh.capacity) || 10000;
      const used = Number(wh.used_capacity) || 0;
      const utilizationPct = cap > 0 ? Math.round((used / cap) * 100) : 0;
      
      return {
        ...wh,
        utilizationPct,
        activeStockUnits: stockMap[wh.warehouse_name] || stockMap[wh.city] || used || 0
      };
    });

    return res.json(enrichedWarehouses);
  } catch (err: any) {
    console.error('Error in GET /api/warehouses:', err);
    return res.status(500).json({ error: err.message || 'Server error fetching warehouses' });
  }
}

/**
 * GET /api/warehouses/:id
 * Retrieve single warehouse by ID or warehouse_code.
 */
export async function getWarehouseById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();
    if (!supabase) {
      const found = DEFAULT_WAREHOUSES.find(w => w.id === id || w.warehouse_code === id);
      if (!found) return res.status(404).json({ error: 'Warehouse not found' });
      return res.json(found);
    }

    let query = supabase.from('zoal_warehouses').select('*');
    if (id.length === 36) {
      query = query.eq('id', id);
    } else {
      query = query.eq('warehouse_code', id);
    }

    const { data: warehouse, error } = await query.single();
    if (error || !warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    return res.json(warehouse);
  } catch (err: any) {
    console.error('Error in GET /api/warehouses/:id:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * POST /api/warehouses
 * Create a new warehouse.
 */
export async function createWarehouse(req: Request, res: Response) {
  try {
    const body = req.body;
    if (!body.warehouse_name && !body.name) {
      return res.status(400).json({ error: 'Missing required field: warehouse_name' });
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

    const supabase = getSupabaseClient();
    if (!supabase) {
      // In-memory/mock fallback response if not configured
      const mockResult = {
        id: `mock-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString()
      };
      return res.status(201).json(mockResult);
    }

    const { data, error } = await supabase
      .from('zoal_warehouses')
      .insert(payload)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err: any) {
    console.error('Error in POST /api/warehouses:', err);
    return res.status(500).json({ error: err.message || 'Server error creating warehouse' });
  }
}

/**
 * PUT /api/warehouses/:id
 * Update an existing warehouse.
 */
export async function updateWarehouse(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body;

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (body.warehouse_name !== undefined || body.name !== undefined) {
      updatePayload.warehouse_name = body.warehouse_name || body.name;
    }
    if (body.warehouse_code !== undefined || body.code !== undefined) {
      updatePayload.warehouse_code = body.warehouse_code || body.code;
    }
    if (body.country !== undefined) updatePayload.country = body.country;
    if (body.city !== undefined) updatePayload.city = body.city;
    if (body.address !== undefined) updatePayload.address = body.address;
    if (body.manager !== undefined) updatePayload.manager = body.manager;
    if (body.phone !== undefined) updatePayload.phone = body.phone;
    if (body.email !== undefined) updatePayload.email = body.email;
    if (body.capacity !== undefined) updatePayload.capacity = parseInt(body.capacity, 10);
    if (body.used_capacity !== undefined) updatePayload.used_capacity = parseInt(body.used_capacity, 10);
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.latitude !== undefined) updatePayload.latitude = parseFloat(body.latitude);
    if (body.longitude !== undefined) updatePayload.longitude = parseFloat(body.longitude);

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.json({ id, ...updatePayload });
    }

    const { data: updated, error } = await supabase
      .from('zoal_warehouses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(updated);
  } catch (err: any) {
    console.error('Error in PUT /api/warehouses/:id:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * DELETE /api/warehouses/:id
 * Delete a warehouse.
 */
export async function deleteWarehouse(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.json({ success: true, deletedId: id });
    }

    const { error } = await supabase
      .from('zoal_warehouses')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('Error in DELETE /api/warehouses/:id:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
