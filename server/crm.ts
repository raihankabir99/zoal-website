import { getSupabaseClient, getServiceSupabaseClient } from './supabase';
import { Request, Response } from 'express';
import crypto from 'crypto';

function getClient() {
  return getServiceSupabaseClient() || getSupabaseClient();
}

/**
 * Helper to record administrative activity logs in zoal_activity_logs.
 */
async function logCrmActivity(actorUser: any, action: string, ip?: string, userAgent?: string) {
  try {
    const supabase = getClient();
    if (!supabase) return;
    const logId = `act-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    await supabase.from('zoal_activity_logs').insert({
      id: logId,
      user_id: actorUser?.id || 'admin',
      email: actorUser?.email || 'admin@alzoal.com',
      action,
      timestamp: new Date().toISOString(),
      ip: ip || '127.0.0.1',
      user_agent: userAgent || 'ZOAL-Enterprise-CRM'
    });
  } catch (err) {
    console.error('Failed to log CRM activity:', err);
  }
}

/**
 * Maps database records from zoal_users, zoal_customer_crm, and zoal_orders
 * into a safe, full CustomerCrmProfile object for the frontend.
 */
export function sanitizeAndMapCustomerProfile(user: any, crm: any, orders: any[] = [], notes: any[] = [], comms: any[] = []) {
  const userEmail = (user.email || '').toLowerCase();
  
  // Calculate real order aggregates from zoal_orders matching customer_id or email
  const matchedOrders = orders.filter(o => 
    (o.customer_id && o.customer_id === user.id) || 
    (o.email && o.email.toLowerCase() === userEmail)
  );

  const totalSpending = matchedOrders.reduce((sum, o) => 
    (o.status !== 'cancelled' && o.status !== 'Cancelled') ? sum + (Number(o.total_amount || o.total || 0)) : sum, 
    0
  );
  const totalOrdersCount = matchedOrders.length;
  const lastOrder = matchedOrders.length > 0 ? matchedOrders[0] : null;
  const lastPurchaseDate = lastOrder ? (lastOrder.created_at || lastOrder.date || null) : null;
  const aov = totalOrdersCount > 0 ? Math.round(totalSpending / totalOrdersCount) : 0;

  const crmData = crm || {};
  const loyaltyPoints = crmData.loyalty_points !== undefined && crmData.loyalty_points !== null ? crmData.loyalty_points : null;
  const membershipLevel = crmData.membership_level ?? null;
  const calculatedSegment = crmData.segment ?? null;

  const marketingPreferences = crmData.marketing_preferences ?? null;
  const coupons = crmData.coupons ?? [];
  const rewards = crmData.rewards ?? [];

  return {
    id: user.id,
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Customer',
    firstName: user.first_name || null,
    lastName: user.last_name || null,
    email: user.email,
    phone: user.phone || null,
    photoUrl: crmData.photo_url || null,
    country: crmData.country || null,
    city: crmData.city || null,
    registrationDate: user.created_at ? user.created_at.substring(0, 10) : null,
    status: crmData.status || 'Active',
    segment: calculatedSegment,
    manualSegment: crmData.manual_segment || false,
    gender: crmData.gender || null,
    birthday: crmData.birthday || null,
    preferredLanguage: crmData.preferred_language || null,
    lastLogin: crmData.last_login || user.created_at || null,
    lastPurchase: lastPurchaseDate,
    
    // Aggregated order statistics
    totalSpending,
    totalOrders: totalOrdersCount,
    averageOrderValue: aov,
    orderHistory: matchedOrders,

    // Loyalty and rewards
    loyaltyPoints,
    membershipLevel,
    referralCredits: crmData.referral_credits !== undefined && crmData.referral_credits !== null ? Number(crmData.referral_credits) : null,
    birthdayReward: crmData.birthday_reward || null,
    coupons,
    rewards,

    // Tags & Archiving
    tags: crmData.tags || [],
    archived: crmData.archived || false,

    // Sub-collections
    notes: notes.map((n: any) => ({
      id: n.id,
      type: n.type || 'Internal',
      content: n.content,
      priority: n.priority || 'Medium',
      author: n.author_name || 'Admin',
      date: n.created_at || null
    })),
    addresses: user.addresses || [],
    wishlist: [],
    savedCart: [],
    reviews: [],
    marketingPreferences,
    communicationHistory: comms.map((c: any) => ({
      id: c.id,
      channel: c.channel,
      subject: c.subject,
      body: c.body,
      date: c.created_at || null,
      status: c.status || 'Sent'
    })),
    paymentSummary: {
      methods: [],
      transactions: []
    },
    activityTimeline: user.created_at ? [
      { id: `act-${user.id}-1`, event: 'Registration', description: 'Customer registered account', time: user.created_at }
    ] : []
  };
}

/**
 * GET /api/admin/customers
 * Server-side search, filtering, pagination, and sorting for Customer Directory.
 */
export async function getCustomers(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) {
    return res.status(500).json({ error: 'DATABASE_UNAVAILABLE', message: 'Database client unavailable.' });
  }

  try {
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const status = (req.query.status as string) || '';
    const segment = (req.query.segment as string) || '';
    const membership = (req.query.membership as string) || '';
    const sortBy = (req.query.sortBy as string) || 'date';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const offset = (page - 1) * limit;

    // Optional CRM filters matching user_ids in zoal_customer_crm
    let crmMatchingUserIds: string[] | null = null;
    if (
      (status && status !== 'all' && status !== 'All') ||
      (segment && segment !== 'all' && segment !== 'All') ||
      (membership && membership !== 'all' && membership !== 'All')
    ) {
      let crmQuery = supabase.from('zoal_customer_crm').select('user_id');
      if (status && status !== 'all' && status !== 'All') {
        crmQuery = crmQuery.ilike('status', status);
      }
      if (segment && segment !== 'all' && segment !== 'All') {
        crmQuery = crmQuery.ilike('segment', segment);
      }
      if (membership && membership !== 'all' && membership !== 'All') {
        crmQuery = crmQuery.ilike('membership_level', membership);
      }
      const { data: matchedCrm } = await crmQuery;
      if (!matchedCrm || matchedCrm.length === 0) {
        return res.json({
          customers: [],
          pagination: { total: 0, page, limit, totalPages: 0 }
        });
      }
      crmMatchingUserIds = matchedCrm.map(c => c.user_id);
    }

    // Build zoal_users database query
    let userQuery = supabase
      .from('zoal_users')
      .select('id, first_name, last_name, email, phone, role, is_verified, created_at, addresses', { count: 'exact' });

    if (crmMatchingUserIds !== null) {
      userQuery = userQuery.in('id', crmMatchingUserIds);
    }

    if (search) {
      userQuery = userQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Whitelisted sort fields
    const allowedSortColumns: Record<string, string> = {
      name: 'first_name',
      email: 'email',
      date: 'created_at',
      created_at: 'created_at'
    };

    const sortColumn = allowedSortColumns[sortBy] || 'created_at';
    userQuery = userQuery.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Database-level pagination
    userQuery = userQuery.range(offset, offset + limit - 1);

    const { data: users, count: totalUserCount, error: userErr } = await userQuery;

    if (userErr) {
      console.error('Error querying zoal_users in CRM:', userErr);
      return res.status(500).json({ error: 'DATABASE_ERROR', message: userErr.message });
    }

    if (!users || users.length === 0) {
      return res.json({
        customers: [],
        pagination: { total: totalUserCount || 0, page, limit, totalPages: Math.ceil((totalUserCount || 0) / limit) }
      });
    }

    const pageUserIds = users.map(u => u.id);
    const pageUserEmails = users.map(u => (u.email || '').toLowerCase()).filter(Boolean);

    // Fetch CRM Metadata, Orders, Notes, Communications for page records only
    const [crmRes, ordersRes, notesRes, commsRes] = await Promise.all([
      supabase.from('zoal_customer_crm').select('*').in('user_id', pageUserIds),
      supabase.from('zoal_orders').select('*').or(`customer_id.in.(${pageUserIds.join(',')}),email.in.(${pageUserEmails.join(',')})`),
      supabase.from('zoal_customer_notes').select('*').in('user_id', pageUserIds).order('created_at', { ascending: false }),
      supabase.from('zoal_customer_communications').select('*').in('user_id', pageUserIds).order('created_at', { ascending: false })
    ]);

    const crmMap = new Map((crmRes.data || []).map(c => [c.user_id, c]));
    const ordersList = ordersRes.data || [];
    const notesMap = new Map<string, any[]>();
    const commsMap = new Map<string, any[]>();

    (notesRes.data || []).forEach(n => {
      const arr = notesMap.get(n.user_id) || [];
      arr.push(n);
      notesMap.set(n.user_id, arr);
    });

    (commsRes.data || []).forEach(c => {
      const arr = commsMap.get(c.user_id) || [];
      arr.push(c);
      commsMap.set(c.user_id, arr);
    });

    const profiles = users.map(u => {
      const crm = crmMap.get(u.id);
      const userNotes = notesMap.get(u.id) || [];
      const userComms = commsMap.get(u.id) || [];
      return sanitizeAndMapCustomerProfile(u, crm, ordersList, userNotes, userComms);
    });

    return res.json({
      customers: profiles,
      pagination: {
        total: totalUserCount || profiles.length,
        page,
        limit,
        totalPages: Math.ceil((totalUserCount || profiles.length) / limit)
      }
    });
  } catch (error: any) {
    console.error('Error in getCustomers:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
  }
}

/**
 * GET /api/admin/customers/:id
 */
export async function getCustomerById(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) {
    return res.status(500).json({ error: 'DATABASE_UNAVAILABLE', message: 'Database client unavailable.' });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Customer ID is required.' });
  }

  try {
    const { data: user, error: userErr } = await supabase
      .from('zoal_users')
      .select('id, first_name, last_name, email, phone, role, is_verified, created_at, addresses')
      .eq('id', id)
      .maybeSingle();

    if (userErr || !user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found.' });
    }

    const [crmRes, ordersRes, notesRes, commsRes] = await Promise.all([
      supabase.from('zoal_customer_crm').select('*').eq('user_id', id).maybeSingle(),
      supabase.from('zoal_orders').select('*').or(`customer_id.eq.${id},email.eq.${user.email}`),
      supabase.from('zoal_customer_notes').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('zoal_customer_communications').select('*').eq('user_id', id).order('created_at', { ascending: false })
    ]);

    const profile = sanitizeAndMapCustomerProfile(
      user, 
      crmRes.data, 
      ordersRes.data || [], 
      notesRes.data || [], 
      commsRes.data || []
    );

    return res.json({ customer: profile });
  } catch (error: any) {
    console.error('Error in getCustomerById:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
  }
}

/**
 * POST /api/admin/customers
 * Creates a real PostgreSQL-backed customer in zoal_users and zoal_customer_crm.
 */
export async function createCustomer(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) {
    return res.status(500).json({ error: 'DATABASE_UNAVAILABLE', message: 'Database client unavailable.' });
  }

  const { name, email, phone, city, country, status, segment, gender, birthday, preferredLanguage, photoUrl, tags } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'INVALID_INPUT', message: 'A valid email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // Check duplicate email
    const { data: existingUser } = await supabase
      .from('zoal_users')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ error: 'DUPLICATE_EMAIL', message: 'A customer profile with this email address already exists.' });
    }

    // Split name into first and last name
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate real canonical UUID matching zoal_users.id schema
    const newUserId = crypto.randomUUID();

    // Insert into zoal_users
    const { data: newUser, error: createErr } = await supabase
      .from('zoal_users')
      .insert({
        id: newUserId,
        first_name: firstName,
        last_name: lastName,
        email: cleanEmail,
        phone: phone || '',
        password_hash: 'PROTECTED_CRM_ACCOUNT',
        role: 'customer',
        is_verified: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createErr || !newUser) {
      console.error('Error creating user record in CRM:', createErr);
      return res.status(500).json({ error: 'CREATE_FAILED', message: createErr?.message || 'Failed to create customer user record.' });
    }

    // Insert CRM metadata into zoal_customer_crm
    const crmMeta = {
      user_id: newUserId,
      status: status || 'Active',
      segment: segment || null,
      gender: gender || null,
      birthday: birthday || null,
      preferred_language: preferredLanguage || null,
      country: country || null,
      city: city || null,
      photo_url: photoUrl || null,
      loyalty_points: 0,
      membership_level: null,
      tags: tags || [],
      created_at: new Date().toISOString()
    };

    const { data: newCrm } = await supabase
      .from('zoal_customer_crm')
      .insert(crmMeta)
      .select()
      .single();

    // Log activity
    await logCrmActivity((req as any).user, `customer.created: ${cleanEmail} (ID: ${newUserId})`);

    const createdProfile = sanitizeAndMapCustomerProfile(newUser, newCrm, [], [], []);

    return res.status(201).json({
      success: true,
      message: 'Customer successfully created.',
      customer: createdProfile
    });
  } catch (error: any) {
    console.error('Error in createCustomer:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
  }
}

/**
 * PATCH /api/admin/customers/:id
 * Updates customer information in zoal_users and zoal_customer_crm.
 */
export async function updateCustomer(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) {
    return res.status(500).json({ error: 'DATABASE_UNAVAILABLE', message: 'Database client unavailable.' });
  }

  const { id } = req.params;
  const { 
    name, email, phone, status, segment, manualSegment, gender, birthday, 
    preferredLanguage, city, country, photoUrl, tags, loyaltyPoints, 
    membershipLevel, referralCredits, birthdayReward, marketingPreferences, archived 
  } = req.body;

  try {
    // 1. Fetch existing user
    const { data: user, error: userErr } = await supabase
      .from('zoal_users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (userErr || !user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found.' });
    }

    // 2. Prepare user updates
    const userUpdates: any = {};
    if (name !== undefined) {
      const nameParts = name.trim().split(' ');
      userUpdates.first_name = nameParts[0] || 'Customer';
      userUpdates.last_name = nameParts.slice(1).join(' ') || '';
    }
    if (email !== undefined && email.includes('@')) {
      userUpdates.email = email.trim().toLowerCase();
    }
    if (phone !== undefined) {
      userUpdates.phone = phone.trim();
    }

    if (Object.keys(userUpdates).length > 0) {
      await supabase.from('zoal_users').update(userUpdates).eq('id', id);
    }

    // 3. Prepare CRM metadata updates
    const crmUpdates: any = {
      updated_at: new Date().toISOString()
    };
    if (status !== undefined) crmUpdates.status = status;
    if (segment !== undefined) crmUpdates.segment = segment;
    if (manualSegment !== undefined) crmUpdates.manual_segment = manualSegment;
    if (gender !== undefined) crmUpdates.gender = gender;
    if (birthday !== undefined) crmUpdates.birthday = birthday || null;
    if (preferredLanguage !== undefined) crmUpdates.preferred_language = preferredLanguage;
    if (city !== undefined) crmUpdates.city = city;
    if (country !== undefined) crmUpdates.country = country;
    if (photoUrl !== undefined) crmUpdates.photo_url = photoUrl;
    if (tags !== undefined) crmUpdates.tags = tags;
    if (loyaltyPoints !== undefined) crmUpdates.loyalty_points = Math.max(0, parseInt(loyaltyPoints, 10));
    if (membershipLevel !== undefined) crmUpdates.membership_level = membershipLevel;
    if (referralCredits !== undefined) crmUpdates.referral_credits = Math.max(0, parseFloat(referralCredits));
    if (birthdayReward !== undefined) crmUpdates.birthday_reward = birthdayReward;
    if (marketingPreferences !== undefined) crmUpdates.marketing_preferences = marketingPreferences;
    if (archived !== undefined) crmUpdates.archived = Boolean(archived);

    const { data: existingCrm } = await supabase.from('zoal_customer_crm').select('id').eq('user_id', id).maybeSingle();

    if (existingCrm) {
      await supabase.from('zoal_customer_crm').update(crmUpdates).eq('user_id', id);
    } else {
      crmUpdates.user_id = id;
      await supabase.from('zoal_customer_crm').insert(crmUpdates);
    }

    // Log activity
    await logCrmActivity((req as any).user, `customer.updated: ${user.email} (ID: ${id})`);

    // 4. Return updated record
    const [updatedUserRes, updatedCrmRes, ordersRes, notesRes, commsRes] = await Promise.all([
      supabase.from('zoal_users').select('*').eq('id', id).single(),
      supabase.from('zoal_customer_crm').select('*').eq('user_id', id).maybeSingle(),
      supabase.from('zoal_orders').select('*').or(`customer_id.eq.${id},email.eq.${user.email}`),
      supabase.from('zoal_customer_notes').select('*').eq('user_id', id).order('created_at', { ascending: false }),
      supabase.from('zoal_customer_communications').select('*').eq('user_id', id).order('created_at', { ascending: false })
    ]);

    const updatedProfile = sanitizeAndMapCustomerProfile(
      updatedUserRes.data,
      updatedCrmRes.data,
      ordersRes.data || [],
      notesRes.data || [],
      commsRes.data || []
    );

    return res.json({
      success: true,
      message: 'Customer successfully updated.',
      customer: updatedProfile
    });
  } catch (error: any) {
    console.error('Error in updateCustomer:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
  }
}

/**
 * POST /api/admin/customers/:id/status
 */
export async function updateCustomerStatus(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) {
    return res.status(500).json({ error: 'DATABASE_UNAVAILABLE', message: 'Database client unavailable.' });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Status is required.' });
  }

  try {
    const { data: existingCrm } = await supabase.from('zoal_customer_crm').select('id').eq('user_id', id).maybeSingle();

    if (existingCrm) {
      await supabase.from('zoal_customer_crm').update({ status, updated_at: new Date().toISOString() }).eq('user_id', id);
    } else {
      await supabase.from('zoal_customer_crm').insert({ user_id: id, status });
    }

    await logCrmActivity((req as any).user, `customer.status_changed: ${id} -> ${status}`);

    return res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error: any) {
    console.error('Error in updateCustomerStatus:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
  }
}

/**
 * POST /api/admin/customers/:id/notes
 */
export async function addCustomerNote(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) {
    return res.status(500).json({ error: 'DATABASE_UNAVAILABLE', message: 'Database client unavailable.' });
  }

  const { id } = req.params;
  const { type, content, priority } = req.body;
  const adminUser = (req as any).user;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Note content cannot be empty.' });
  }

  try {
    const newNote = {
      user_id: id,
      admin_id: adminUser?.id || null,
      author_name: adminUser?.name || adminUser?.email || 'Admin',
      type: type || 'Internal',
      priority: priority || 'Medium',
      content: content.trim(),
      created_at: new Date().toISOString()
    };

    const { data: note, error: noteErr } = await supabase
      .from('zoal_customer_notes')
      .insert(newNote)
      .select()
      .single();

    if (noteErr) {
      return res.status(500).json({ error: 'NOTE_CREATE_FAILED', message: noteErr.message });
    }

    await logCrmActivity(adminUser, `customer.note_added: ${id}`);

    return res.status(201).json({
      success: true,
      note: {
        id: note.id,
        type: note.type,
        content: note.content,
        priority: note.priority,
        author: note.author_name,
        date: note.created_at
      }
    });
  } catch (error: any) {
    console.error('Error in addCustomerNote:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
  }
}

/**
 * POST /api/admin/customers/:id/communications
 */
export async function addCustomerCommunication(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) {
    return res.status(500).json({ error: 'DATABASE_UNAVAILABLE', message: 'Database client unavailable.' });
  }

  const { id } = req.params;
  const { channel, subject, body } = req.body;
  const adminUser = (req as any).user;

  if (!subject || !body) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Communication subject and body are required.' });
  }

  try {
    const newComm = {
      user_id: id,
      admin_id: adminUser?.id || null,
      channel: channel || 'Email',
      subject: subject.trim(),
      body: body.trim(),
      status: 'Sent',
      created_at: new Date().toISOString()
    };

    const { data: comm, error: commErr } = await supabase
      .from('zoal_customer_communications')
      .insert(newComm)
      .select()
      .single();

    if (commErr) {
      return res.status(500).json({ error: 'COMM_CREATE_FAILED', message: commErr.message });
    }

    await logCrmActivity(adminUser, `customer.communication_created: ${id} via ${channel}`);

    return res.status(201).json({
      success: true,
      communication: {
        id: comm.id,
        channel: comm.channel,
        subject: comm.subject,
        body: comm.body,
        date: comm.created_at,
        status: comm.status
      }
    });
  } catch (error: any) {
    console.error('Error in addCustomerCommunication:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
  }
}

/**
 * DELETE /api/admin/customers/:id
 * Controlled status/deactivation mechanism preserving historical order integrity.
 */
export async function deleteOrDeactivateCustomer(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) {
    return res.status(500).json({ error: 'DATABASE_UNAVAILABLE', message: 'Database client unavailable.' });
  }

  const { id } = req.params;

  try {
    // Check if customer has orders
    const { count: orderCount } = await supabase
      .from('zoal_orders')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', id);

    await supabase
      .from('zoal_customer_crm')
      .upsert({
        user_id: id,
        status: 'Inactive',
        archived: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    await logCrmActivity((req as any).user, `customer.deactivated: ${id}`);

    if (orderCount && orderCount > 0) {
      return res.json({
        success: true,
        action: 'DEACTIVATED',
        message: 'Customer has historical orders. Profile deactivated and archived to preserve financial integrity.'
      });
    }

    return res.json({
      success: true,
      action: 'DEACTIVATED',
      message: 'Customer profile successfully deactivated and archived.'
    });
  } catch (error: any) {
    console.error('Error in deleteOrDeactivateCustomer:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
  }
}
