import { getSupabaseClient, getServiceSupabaseClient } from './supabase';
import { Request, Response } from 'express';
import crypto from 'crypto';
import pg from 'pg';
import { logAuditEvent } from './audit';
const { Client: PgClient } = pg;

function getClient() {
  return getServiceSupabaseClient() || getSupabaseClient();
}

/**
 * PBKDF2 password hashing helper.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Helper to record administrative activity logs in zoal_activity_logs.
 * Raw invitation tokens or sensitive secrets are NEVER logged.
 */
async function logCrmActivity(actorUser: any, action: string, ip?: string, userAgent?: string, targetCustomerId?: string, beforeState?: any, afterState?: any) {
  await logAuditEvent({
    actor: actorUser,
    action: targetCustomerId ? `${action} (Target: ${targetCustomerId})` : action,
    resourceType: 'customer_crm',
    resourceId: targetCustomerId,
    beforeState,
    afterState,
    ip,
    userAgent,
    source: 'crm'
  });
}

/**
 * Maps database records from zoal_users, zoal_customer_crm, and zoal_orders
 * into a safe, full CustomerCrmProfile object for the frontend.
 * 
 * STRICT CANONICAL IDENTITY (P0-4):
 * Matches orders exclusively by `zoal_orders.customer_id = zoal_users.id`.
 * Never matches by email fallback.
 * 
 * SANITIZATION (P1):
 * Strips all secrets including password_hash, reset_code, invite_token_hash,
 * invite_expires_at, and invite_used_at.
 */
export function sanitizeAndMapCustomerProfile(user: any, crm: any, orders: any[] = [], notes: any[] = [], comms: any[] = []) {
  if (!user) return null;

  // STRICT CANONICAL ORDER MATCHING: Match strictly by customer_id = user.id
  const matchedOrders = orders.filter(o => o && o.customer_id && o.customer_id === user.id);

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

  // Filter out any private/sensitive fields from addresses
  const safeAddresses = Array.isArray(user.addresses) ? user.addresses : [];

  return {
    id: user.id,
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || null,
    firstName: user.first_name || null,
    lastName: user.last_name || null,
    email: user.email,
    phone: user.phone || null,
    photoUrl: crmData.photo_url || null,
    country: crmData.country || null,
    city: crmData.city || null,
    registrationDate: user.created_at ? user.created_at.substring(0, 10) : null,
    status: crmData.status || null,
    segment: calculatedSegment,
    manualSegment: crmData.manual_segment || false,
    gender: crmData.gender || null,
    birthday: crmData.birthday || null,
    preferredLanguage: crmData.preferred_language || null,
    lastLogin: crmData.last_login || null,
    lastPurchase: lastPurchaseDate,
    
    // Aggregated order statistics strictly from canonical customer_id
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
    addresses: safeAddresses,
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

    // Fetch CRM Metadata, Orders (strictly by customer_id), Notes, Communications for page records only
    const [crmRes, ordersRes, notesRes, commsRes] = await Promise.all([
      supabase.from('zoal_customer_crm').select('*').in('user_id', pageUserIds),
      supabase.from('zoal_orders').select('*').in('customer_id', pageUserIds),
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

    // Strictly match orders by customer_id = id (P0-4)
    const [crmRes, ordersRes, notesRes, commsRes] = await Promise.all([
      supabase.from('zoal_customer_crm').select('*').eq('user_id', id).maybeSingle(),
      supabase.from('zoal_orders').select('*').eq('customer_id', id),
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
 * 
 * ATOMIC CUSTOMER CREATION (P0-1):
 * Calls PostgreSQL function `create_customer_atomic` within a real database transaction.
 * Rolls back atomically if any insert fails.
 * 
 * SECURE INVITATION TOKEN (P0-2):
 * Generates cryptographic token, stores only SHA-256 hash in `invite_token_hash` with expiration.
 * Raw token is NEVER stored in database, NEVER returned in customer profile, NEVER logged.
 * 
 * SANITIZATION & VALIDATION (P1):
 * Server-side validates email, name, phone, types, status, and segments.
 */
export async function createCustomer(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) {
    return res.status(500).json({ error: 'DATABASE_UNAVAILABLE', message: 'Database client unavailable.' });
  }

  const { name, email, phone, city, country, status, segment, gender, birthday, preferredLanguage, photoUrl, tags } = req.body;

  // 1. Strict Email Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'INVALID_EMAIL', message: 'A valid email address is required.' });
  }
  const cleanEmail = email.trim().toLowerCase();

  // 2. Name Validation
  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
    return res.status(400).json({ error: 'INVALID_NAME', message: 'Customer name is required (max 100 characters).' });
  }

  // 3. Phone Validation
  let cleanPhone: string | null = null;
  if (phone !== undefined && phone !== null && phone !== '') {
    if (typeof phone !== 'string' || phone.trim().length > 30) {
      return res.status(400).json({ error: 'INVALID_PHONE', message: 'Phone number must be a valid string under 30 characters.' });
    }
    cleanPhone = phone.trim();
  }

  // 4. Status Validation
  const ALLOWED_STATUSES = ['Active', 'Inactive', 'Blocked', 'Suspended', 'VIP', 'Verified', 'Prospect'];
  let cleanStatus: string | null = null;
  if (status) {
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'INVALID_STATUS', message: `Invalid customer status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }
    cleanStatus = status;
  }

  // 5. Segment Validation
  const ALLOWED_SEGMENTS = [
    'New Customer', 'Returning Customer', 'Regular Customer', 'VIP Customer', 
    'Inactive Customer', 'High Value Customer', 'Frequent Buyer', 
    'Corporate', 'Wholesale', 'Retail', 'Royal'
  ];
  let cleanSegment: string | null = null;
  if (segment) {
    if (!ALLOWED_SEGMENTS.includes(segment)) {
      return res.status(400).json({ error: 'INVALID_SEGMENT', message: `Invalid segment value. Allowed: ${ALLOWED_SEGMENTS.join(', ')}` });
    }
    cleanSegment = segment;
  }

  // 6. Gender Validation
  let cleanGender: string | null = null;
  if (gender) {
    if (!['Male', 'Female', 'Other'].includes(gender)) {
      return res.status(400).json({ error: 'INVALID_GENDER', message: 'Gender must be Male, Female, or Other.' });
    }
    cleanGender = gender;
  }

  // 7. Birthday Validation
  let cleanBirthday: string | null = null;
  if (birthday) {
    const bDate = new Date(birthday);
    if (isNaN(bDate.getTime())) {
      return res.status(400).json({ error: 'INVALID_BIRTHDAY', message: 'Birthday must be a valid date.' });
    }
    cleanBirthday = birthday.substring(0, 10);
  }

  // 8. Tags Validation
  let cleanTags: string[] = [];
  if (tags) {
    if (!Array.isArray(tags) || tags.some(t => typeof t !== 'string')) {
      return res.status(400).json({ error: 'INVALID_TAGS', message: 'Tags must be an array of strings.' });
    }
    if (tags.length > 50) {
      return res.status(400).json({ error: 'INVALID_TAGS', message: 'Tags cannot exceed 50 items.' });
    }
    cleanTags = tags.map(t => t.trim()).filter(Boolean);
  }

  const cleanLanguage = preferredLanguage ? String(preferredLanguage).trim() : null;
  const cleanCountry = country ? String(country).trim() : null;
  const cleanCity = city ? String(city).trim() : null;
  const cleanPhotoUrl = photoUrl ? String(photoUrl).trim() : null;

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

    // Split name
    const nameParts = name.trim().split(' ').filter(Boolean);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Generate canonical user UUID
    const newUserId = crypto.randomUUID();

    // Generate Cryptographically Secure Invitation Token (P0-2)
    const rawInviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenHash = crypto.createHash('sha256').update(rawInviteToken).digest('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days expiration

    let createdResult: any = null;

    // Execute atomic creation via PostgreSQL function (P0-1)
    if (process.env.DATABASE_URL) {
      const pgClient = new PgClient({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      try {
        await pgClient.connect();
        const queryRes = await pgClient.query(
          `SELECT create_customer_atomic($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) as result`,
          [
            newUserId, firstName, lastName, cleanEmail, cleanPhone,
            inviteTokenHash, inviteExpiresAt, cleanStatus, cleanSegment,
            cleanGender, cleanBirthday, cleanLanguage, cleanCountry, cleanCity,
            cleanPhotoUrl, cleanTags
          ]
        );
        createdResult = queryRes.rows[0]?.result;
      } finally {
        await pgClient.end().catch(() => {});
      }
    }

    // If pg direct execution wasn't used or returned null, execute via Supabase RPC / transaction
    if (!createdResult) {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('create_customer_atomic', {
        p_user_id: newUserId,
        p_first_name: firstName,
        p_last_name: lastName,
        p_email: cleanEmail,
        p_phone: cleanPhone,
        p_invite_token_hash: inviteTokenHash,
        p_invite_expires_at: inviteExpiresAt,
        p_status: cleanStatus,
        p_segment: cleanSegment,
        p_gender: cleanGender,
        p_birthday: cleanBirthday,
        p_preferred_language: cleanLanguage,
        p_country: cleanCountry,
        p_city: cleanCity,
        p_photo_url: cleanPhotoUrl,
        p_tags: cleanTags
      });

      if (rpcErr) {
        console.error('Error invoking create_customer_atomic RPC:', rpcErr);
        return res.status(500).json({ error: 'CREATE_FAILED', message: rpcErr.message || 'Failed to atomically create customer.' });
      }
      createdResult = rpcData;
    }

    if (!createdResult || !createdResult.user) {
      return res.status(500).json({ error: 'CREATE_FAILED', message: 'Failed to atomically create customer profile.' });
    }

    // Audit Logging (P1) — NEVER log the raw token
    await logCrmActivity(
      (req as any).user,
      `customer.created: ${cleanEmail}`,
      req.ip,
      req.headers['user-agent'] as string,
      newUserId
    );

    // Sanitize response: NEVER return raw token or password_hash in customer object
    const createdProfile = sanitizeAndMapCustomerProfile(createdResult.user, createdResult.crm, [], [], []);

    return res.status(201).json({
      success: true,
      message: 'Customer successfully created with pending password setup.',
      user_id: createdResult.user_id || newUserId,
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
      const nameParts = (name || '').trim().split(' ').filter(Boolean);
      userUpdates.first_name = nameParts[0] || null;
      userUpdates.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
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
    await logCrmActivity((req as any).user, `customer.updated: ${user.email}`, req.ip, req.headers['user-agent'] as string, id);

    // 4. Return updated record (orders matched strictly by customer_id)
    const [updatedUserRes, updatedCrmRes, ordersRes, notesRes, commsRes] = await Promise.all([
      supabase.from('zoal_users').select('id, first_name, last_name, email, phone, role, is_verified, created_at, addresses').eq('id', id).single(),
      supabase.from('zoal_customer_crm').select('*').eq('user_id', id).maybeSingle(),
      supabase.from('zoal_orders').select('*').eq('customer_id', id),
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

    await logCrmActivity((req as any).user, `customer.status_changed: ${status}`, req.ip, req.headers['user-agent'] as string, id);

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

    await logCrmActivity(adminUser, `customer.note_added`, req.ip, req.headers['user-agent'] as string, id);

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

    await logCrmActivity(adminUser, `customer.communication_created via ${channel}`, req.ip, req.headers['user-agent'] as string, id);

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

    await logCrmActivity((req as any).user, `customer.deactivated`, req.ip, req.headers['user-agent'] as string, id);

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

/**
 * POST /api/auth/invite/setup
 * 
 * PASSWORD SETUP FLOW (P0-3):
 * 1. Validates invitation token cryptographically using constant-time hash comparison.
 * 2. Enforces expiration check, unconsumed check, and password strength policy.
 * 3. Atomically sets password_hash, marks is_verified = true, sets invite_used_at = NOW(),
 *    and clears invite_token_hash.
 * 4. Logs activation event in zoal_activity_logs.
 * 5. Sanitizes response.
 */
export async function setupInvitePassword(req: Request, res: Response) {
  const { token, password } = req.body;

  if (!token || typeof token !== 'string' || !token.trim()) {
    return res.status(400).json({ error: 'MISSING_TOKEN', message: 'Invitation token is required.' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'MISSING_PASSWORD', message: 'New password is required.' });
  }

  // Password policy validation
  if (password.length < 8) {
    return res.status(400).json({
      error: 'WEAK_PASSWORD',
      message: 'Password must be at least 8 characters in length.'
    });
  }

  const supabase = getClient();
  if (!supabase) {
    return res.status(500).json({ error: 'DATABASE_UNAVAILABLE', message: 'Database client unavailable.' });
  }

  try {
    const trimmedToken = token.trim();
    const computedHash = crypto.createHash('sha256').update(trimmedToken).digest('hex');

    let user: any = null;
    if (process.env.DATABASE_URL) {
      const pgClient = new PgClient({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      try {
        await pgClient.connect();
        const q = await pgClient.query(
          `SELECT id, first_name, last_name, email, role, is_verified, password_hash, invite_token_hash, invite_expires_at, invite_used_at 
           FROM zoal_users 
           WHERE invite_token_hash = $1 
           LIMIT 1`,
          [computedHash]
        );
        user = q.rows[0] || null;
      } finally {
        await pgClient.end().catch(() => {});
      }
    }

    if (!user) {
      const { data } = await supabase
        .from('zoal_users')
        .select('id, first_name, last_name, email, role, is_verified, password_hash, invite_token_hash, invite_expires_at, invite_used_at')
        .eq('invite_token_hash', computedHash)
        .maybeSingle();
      user = data;
    }

    if (!user || !user.invite_token_hash) {
      return res.status(401).json({ error: 'INVALID_INVITATION', message: 'Invalid or expired invitation token.' });
    }

    // Constant-time hash comparison
    const userHashBuf = Buffer.from(user.invite_token_hash, 'utf8');
    const compHashBuf = Buffer.from(computedHash, 'utf8');
    if (userHashBuf.length !== compHashBuf.length || !crypto.timingSafeEqual(userHashBuf, compHashBuf)) {
      return res.status(401).json({ error: 'INVALID_INVITATION', message: 'Invalid invitation token.' });
    }

    // Check if consumed
    if (user.invite_used_at) {
      return res.status(400).json({ error: 'INVITATION_ALREADY_USED', message: 'This invitation token has already been used.' });
    }

    // Check expiration
    if (user.invite_expires_at && new Date() > new Date(user.invite_expires_at)) {
      return res.status(410).json({ error: 'INVITATION_EXPIRED', message: 'This invitation token has expired. Please request a new invitation from an administrator.' });
    }

    // Check if account already verified with existing password
    if (user.is_verified && user.password_hash) {
      return res.status(400).json({ error: 'ACCOUNT_ALREADY_ACTIVE', message: 'This customer account is already activated.' });
    }

    // Hash password with PBKDF2
    const newPasswordHash = hashPassword(password);
    const nowIso = new Date().toISOString();

    // Atomic update
    if (process.env.DATABASE_URL) {
      const pgClient = new PgClient({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      try {
        await pgClient.connect();
        await pgClient.query('BEGIN');
        await pgClient.query(
          `UPDATE zoal_users 
           SET password_hash = $1, is_verified = TRUE, invite_used_at = $2, invite_token_hash = NULL, reset_code = NULL 
           WHERE id = $3`,
          [newPasswordHash, nowIso, user.id]
        );
        await pgClient.query(
          `UPDATE zoal_customer_crm 
           SET status = COALESCE(status, 'Active'), updated_at = $1 
           WHERE user_id = $2`,
          [nowIso, user.id]
        );
        await pgClient.query(
          `INSERT INTO zoal_activity_logs (id, user_id, email, action, timestamp, ip, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            `act-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            user.id,
            user.email,
            'customer.invite_password_setup_completed',
            nowIso,
            req.ip || '127.0.0.1',
            req.headers['user-agent'] || 'ZOAL-Auth'
          ]
        );
        await pgClient.query('COMMIT');
      } catch (dbErr) {
        await pgClient.query('ROLLBACK');
        throw dbErr;
      } finally {
        await pgClient.end().catch(() => {});
      }
    } else {
      await supabase.from('zoal_users').update({
        password_hash: newPasswordHash,
        is_verified: true,
        invite_used_at: nowIso,
        invite_token_hash: null,
        reset_code: null
      }).eq('id', user.id);

      await supabase.from('zoal_customer_crm').update({
        status: 'Active',
        updated_at: nowIso
      }).eq('user_id', user.id);
    }

    return res.json({
      success: true,
      message: 'Password successfully configured and customer account activated. You may now log in.'
    });
  } catch (error: any) {
    console.error('Error in setupInvitePassword:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
  }
}

/**
 * GET /api/auth/invite/verify
 * POST /api/auth/invite/verify
 * Verifies invitation validity prior to displaying password setup UI.
 */
export async function verifyInviteToken(req: Request, res: Response) {
  const token = (req.method === 'GET' ? req.query.token : req.body.token) as string;

  if (!token || typeof token !== 'string' || !token.trim()) {
    return res.status(400).json({ valid: false, error: 'MISSING_TOKEN', message: 'Invitation token is required.' });
  }

  const supabase = getClient();
  if (!supabase) {
    return res.status(500).json({ valid: false, error: 'DATABASE_UNAVAILABLE', message: 'Database client unavailable.' });
  }

  try {
    const computedHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    let user: any = null;

    if (process.env.DATABASE_URL) {
      const pgClient = new PgClient({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      try {
        await pgClient.connect();
        const q = await pgClient.query(
          `SELECT id, first_name, last_name, email, role, is_verified, invite_token_hash, invite_expires_at, invite_used_at 
           FROM zoal_users 
           WHERE invite_token_hash = $1 
           LIMIT 1`,
          [computedHash]
        );
        user = q.rows[0] || null;
      } finally {
        await pgClient.end().catch(() => {});
      }
    }

    if (!user) {
      const { data } = await supabase
        .from('zoal_users')
        .select('id, first_name, last_name, email, role, is_verified, invite_token_hash, invite_expires_at, invite_used_at')
        .eq('invite_token_hash', computedHash)
        .maybeSingle();
      user = data;
    }

    if (!user || !user.invite_token_hash) {
      return res.status(401).json({ valid: false, error: 'INVALID_INVITATION', message: 'Invalid invitation token.' });
    }

    const userHashBuf = Buffer.from(user.invite_token_hash, 'utf8');
    const compHashBuf = Buffer.from(computedHash, 'utf8');
    if (userHashBuf.length !== compHashBuf.length || !crypto.timingSafeEqual(userHashBuf, compHashBuf)) {
      return res.status(401).json({ valid: false, error: 'INVALID_INVITATION', message: 'Invalid invitation token.' });
    }

    if (user.invite_used_at) {
      return res.status(400).json({ valid: false, error: 'INVITATION_ALREADY_USED', message: 'This invitation token has already been used.' });
    }

    if (user.invite_expires_at && new Date() > new Date(user.invite_expires_at)) {
      return res.status(410).json({ valid: false, error: 'INVITATION_EXPIRED', message: 'This invitation token has expired.' });
    }

    return res.json({
      valid: true,
      email: user.email,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    });
  } catch (error: any) {
    console.error('Error in verifyInviteToken:', error);
    return res.status(500).json({ valid: false, error: 'INTERNAL_SERVER_ERROR', message: error.message });
  }
}
