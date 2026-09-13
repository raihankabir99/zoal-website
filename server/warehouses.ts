import { Request, Response } from 'express';
import { getSupabaseClient } from './supabase';
import { logAuditEvent } from './audit';

/**
 * GET /api/warehouses
 * Retrieves all enterprise warehouses from the authoritative database.
 */
export async function getWarehouses(req: Request, res: Response) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database connection unavailable.' });
    }

    const { data: warehouses, error } = await supabase
      .from('zoal_warehouses')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching warehouses:', error);
      return res.status(500).json({ error: error.message || 'Server error fetching warehouses' });
    }

    const rows = warehouses || [];

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

    const enrichedWarehouses = rows.map((wh: any) => {
      const cap = Number(wh.capacity) || 0;
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
      return res.status(503).json({ error: 'Database connection unavailable.' });
    }

    let query = supabase.from('zoal_warehouses').select('*');
    if (id.length === 36) {
      query = query.eq('id', id);
    } else {
      query = query.eq('warehouse_code', id);
    }

    const { data: warehouse, error } = await query.maybeSingle();
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
      return res.status(503).json({ error: 'Database connection unavailable.' });
    }

    const { data, error } = await supabase
      .from('zoal_warehouses')
      .insert(payload)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    logAuditEvent({
      req,
      action: 'CREATE_WAREHOUSE',
      resourceType: 'warehouse',
      resourceId: data.id,
      afterState: data,
      source: 'logistics'
    });

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
      return res.status(503).json({ error: 'Database connection unavailable.' });
    }

    const { data: existing } = await supabase
      .from('zoal_warehouses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    const { data: updated, error } = await supabase
      .from('zoal_warehouses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    logAuditEvent({
      req,
      action: 'UPDATE_WAREHOUSE',
      resourceType: 'warehouse',
      resourceId: id,
      beforeState: existing || null,
      afterState: updated,
      source: 'logistics'
    });

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
      return res.status(503).json({ error: 'Database connection unavailable.' });
    }

    const { data: existing } = await supabase
      .from('zoal_warehouses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase
      .from('zoal_warehouses')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });

    logAuditEvent({
      req,
      action: 'DELETE_WAREHOUSE',
      resourceType: 'warehouse',
      resourceId: id,
      beforeState: existing || null,
      afterState: null,
      severity: 'WARN',
      source: 'logistics'
    });

    return res.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('Error in DELETE /api/warehouses/:id:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
