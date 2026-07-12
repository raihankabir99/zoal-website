import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSupabaseClient } from './supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const LOGS_FILE = path.join(DATA_DIR, 'activity_logs.json');

// Ensure database directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'superadmin' | 'admin' | 'manager' | 'staff' | 'customer';
  status?: 'active' | 'suspended' | 'pending' | 'disabled';
  emailVerified?: boolean;
  phoneVerified?: boolean;
  avatar?: string | null;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string | null;
  addresses?: string[];
  
  // Backwards compatibility fallbacks
  isVerified?: boolean;
  verificationCode?: string;
  resetCode?: string;
  suspended?: boolean; // mapped to status === 'suspended'
  permissions?: string[]; // direct user permissions
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
  rememberMe: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  email: string;
  action: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  entity?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}

export interface UserPermission {
  userId: string;
  permissionId: string;
}

export interface LoginHistory {
  id: string;
  userId: string;
  ipAddress: string;
  device: string;
  browser: string;
  country: string;
  loginAt: string;
  logoutAt: string | null;
  status: 'success' | 'failure';
}

// Password cryptography helpers using Node.js pbkdf2
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  } catch (error) {
    return false;
  }
}

// -------------------------------------------------------------
// SUPABASE OBJECT MAPPERS (camelCase <=> snake_case mapping)
// -------------------------------------------------------------

export function toSupabaseUser(u: User) {
  return {
    id: u.id,
    first_name: u.firstName,
    last_name: u.lastName,
    email: u.email,
    phone: u.phone,
    password_hash: u.passwordHash,
    role: u.role,
    status: u.status || 'active',
    email_verified: u.emailVerified ?? u.isVerified ?? false,
    phone_verified: u.phoneVerified ?? false,
    avatar: u.avatar || '',
    created_at: u.createdAt,
    updated_at: u.updatedAt || new Date().toISOString(),
    last_login: u.lastLogin,
    addresses: u.addresses || [],
    verification_code: u.verificationCode || '',
    reset_code: u.resetCode || ''
  };
}

export function fromSupabaseUser(su: any): User {
  return {
    id: su.id,
    firstName: su.first_name,
    lastName: su.last_name,
    email: su.email,
    phone: su.phone,
    passwordHash: su.password_hash,
    role: su.role || 'customer',
    status: su.status || 'active',
    emailVerified: su.email_verified ?? su.is_verified ?? false,
    phoneVerified: su.phone_verified ?? false,
    avatar: su.avatar || '',
    createdAt: su.created_at,
    updatedAt: su.updated_at || su.created_at,
    lastLogin: su.last_login || null,
    addresses: su.addresses || [],
    verificationCode: su.verification_code || '',
    resetCode: su.reset_code || '',
    isVerified: su.email_verified ?? su.is_verified ?? false,
    suspended: (su.status || 'active') === 'suspended',
    permissions: su.permissions || []
  };
}

export function toSupabaseSession(s: Session) {
  return {
    token: s.token,
    user_id: s.userId,
    expires_at: s.expiresAt,
    remember_me: s.rememberMe
  };
}

export function fromSupabaseSession(ss: any): Session {
  return {
    token: ss.token,
    userId: ss.user_id,
    expiresAt: ss.expires_at,
    rememberMe: ss.remember_me
  };
}

export function toSupabaseLog(l: ActivityLog) {
  return {
    id: l.id,
    user_id: l.userId,
    email: l.email,
    action: l.action,
    timestamp: l.timestamp,
    ip: l.ip,
    user_agent: l.userAgent,
    entity: l.entity || 'system'
  };
}

export function fromSupabaseLog(sl: any): ActivityLog {
  return {
    id: sl.id,
    userId: sl.user_id,
    email: sl.email,
    action: sl.action,
    timestamp: sl.timestamp,
    ip: sl.ip,
    userAgent: sl.user_agent,
    entity: sl.entity || 'system'
  };
}

// -------------------------------------------------------------
// CORE DB ACCESSORS (Synchronous Legacy Fallbacks)
// -------------------------------------------------------------

export function readUsers(): User[] {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      writeUsers([]);
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    const rawUsers = JSON.parse(data);
    return rawUsers.map((u: any) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      passwordHash: u.passwordHash,
      role: u.role || 'customer',
      status: u.status || (u.suspended ? 'suspended' : 'active'),
      emailVerified: u.emailVerified ?? u.isVerified ?? false,
      phoneVerified: u.phoneVerified ?? false,
      avatar: u.avatar || '',
      createdAt: u.createdAt,
      updatedAt: u.updatedAt || u.createdAt,
      lastLogin: u.lastLogin || null,
      addresses: u.addresses || [],
      verificationCode: u.verificationCode || '',
      resetCode: u.resetCode || '',
      isVerified: u.emailVerified ?? u.isVerified ?? false,
      suspended: u.status === 'suspended' || !!u.suspended,
      permissions: u.permissions || []
    }));
  } catch (err) {
    console.error('Error reading users file:', err);
    return [];
  }
}

export function writeUsers(users: User[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error writing users file:', err);
  }
}

export function readSessions(): Session[] {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) {
      writeSessions([]);
      return [];
    }
    const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading sessions file:', err);
    return [];
  }
}

export function writeSessions(sessions: Session[]) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  } catch (err) {
    console.error('Error writing sessions file:', err);
  }
}

export function readLogs(): ActivityLog[] {
  try {
    if (!fs.existsSync(LOGS_FILE)) {
      writeLogs([]);
      return [];
    }
    const data = fs.readFileSync(LOGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading logs file:', err);
    return [];
  }
}

export function writeLogs(logs: ActivityLog[]) {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Error writing logs file:', err);
  }
}

// Roles static and JSON persistence helper
const ROLES_FILE = path.join(DATA_DIR, 'roles.json');
export function readRoles(): Role[] {
  if (!fs.existsSync(ROLES_FILE)) {
    const defaultRoles: Role[] = [
      { id: 'superadmin', name: 'Super Admin', description: 'Full access to every enterprise module and system security.', createdAt: new Date().toISOString() },
      { id: 'admin', name: 'Admin', description: 'Administrative control over operations, excluding system security and database actions.', createdAt: new Date().toISOString() },
      { id: 'manager', name: 'Manager', description: 'Direct management of order dispatch, boutique catalog, inventory, and export reports.', createdAt: new Date().toISOString() },
      { id: 'staff', name: 'Staff', description: 'Boutique logistics, tracking dispatch, and stock level checks.', createdAt: new Date().toISOString() },
      { id: 'customer', name: 'Customer', description: 'Customer portal to view profile, checkout, track orders, and curate wishlists.', createdAt: new Date().toISOString() }
    ];
    writeRoles(defaultRoles);
    return defaultRoles;
  }
  try {
    return JSON.parse(fs.readFileSync(ROLES_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
}

export function writeRoles(roles: Role[]) {
  try {
    fs.writeFileSync(ROLES_FILE, JSON.stringify(roles, null, 2));
  } catch (err) {
    console.error('Error writing roles file:', err);
  }
}

// Permissions static and JSON persistence helper
const PERMISSIONS_FILE = path.join(DATA_DIR, 'permissions.json');
export const ALL_PERMISSIONS: Permission[] = [
  { id: 'dashboard.view', name: 'Dashboard View', description: 'View administration dashboards' },
  { id: 'dashboard.manage', name: 'Dashboard Manage', description: 'Configure dashboards and widgets' },
  { id: 'users.view', name: 'Users View', description: 'View security roster and profile details' },
  { id: 'users.create', name: 'Users Create', description: 'Create new administrative or customer accounts' },
  { id: 'users.edit', name: 'Users Edit', description: 'Modify account details and privilege assignments' },
  { id: 'users.delete', name: 'Users Delete', description: 'Permanently purge accounts from records' },
  { id: 'users.suspend', name: 'Users Suspend', description: 'Toggle temporary locks on account access' },
  { id: 'products.view', name: 'Products View', description: 'View boutique catalog items' },
  { id: 'products.create', name: 'Products Create', description: 'Add new luxury items to catalog' },
  { id: 'products.edit', name: 'Products Edit', description: 'Update product descriptions, pricing, and tags' },
  { id: 'products.delete', name: 'Products Delete', description: 'Remove products from the public catalog' },
  { id: 'categories.manage', name: 'Categories Manage', description: 'Establish and edit catalog collections' },
  { id: 'orders.view', name: 'Orders View', description: 'Track customer order requests' },
  { id: 'orders.update', name: 'Orders Update', description: 'Advance order statuses and logistics steps' },
  { id: 'orders.cancel', name: 'Orders Cancel', description: 'Nullify order requests and process refunds' },
  { id: 'inventory.manage', name: 'Inventory Manage', description: 'Adjust stock quantities and alerts' },
  { id: 'shipping.manage', name: 'Shipping Manage', description: 'Configure zones, carriers, and rates' },
  { id: 'analytics.view', name: 'Analytics View', description: 'Review business intelligence and conversions' },
  { id: 'reports.export', name: 'Reports Export', description: 'Compile and download sales and performance ledgers' },
  { id: 'marketing.manage', name: 'Marketing Manage', description: 'Orchestrate campaigns and newsletters' },
  { id: 'coupons.manage', name: 'Coupons Manage', description: 'Create and revoke promotional discount codes' },
  { id: 'loyalty.manage', name: 'Loyalty Manage', description: 'Manage patron tiers, rewards, and points multipliers' },
  { id: 'settings.manage', name: 'Settings Manage', description: 'Configure overall application and checkout flags' },
  { id: 'security.manage', name: 'Security Manage', description: 'Audit security configurations and active sessions' },
  { id: 'database.manage', name: 'Database Manage', description: 'Direct database actions and catalog sync' },
  { id: 'system.logs', name: 'System Logs', description: 'Access backend debugging and email transmission logs' }
];

export function readPermissions(): Permission[] {
  if (!fs.existsSync(PERMISSIONS_FILE)) {
    try {
      fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(ALL_PERMISSIONS, null, 2));
    } catch (err) {}
    return ALL_PERMISSIONS;
  }
  try {
    return JSON.parse(fs.readFileSync(PERMISSIONS_FILE, 'utf-8'));
  } catch (err) {
    return ALL_PERMISSIONS;
  }
}

// Role Permissions static map and JSON helper
const ROLE_PERMISSIONS_FILE = path.join(DATA_DIR, 'role_permissions.json');
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: ALL_PERMISSIONS.map(p => p.id),
  admin: ALL_PERMISSIONS.filter(p => p.id !== 'security.manage' && p.id !== 'database.manage').map(p => p.id),
  manager: [
    'dashboard.view',
    'orders.view', 'orders.update', 'orders.cancel',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'inventory.manage',
    'reports.export'
  ],
  staff: [
    'dashboard.view',
    'orders.view', 'orders.update',
    'inventory.manage'
  ],
  customer: []
};

export function readRolePermissions(): RolePermission[] {
  if (!fs.existsSync(ROLE_PERMISSIONS_FILE)) {
    const list: RolePermission[] = [];
    for (const [roleId, permIds] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      for (const permissionId of permIds) {
        list.push({ roleId, permissionId });
      }
    }
    writeRolePermissions(list);
    return list;
  }
  try {
    return JSON.parse(fs.readFileSync(ROLE_PERMISSIONS_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
}

export function writeRolePermissions(rolePerms: RolePermission[]) {
  try {
    fs.writeFileSync(ROLE_PERMISSIONS_FILE, JSON.stringify(rolePerms, null, 2));
  } catch (err) {
    console.error('Error writing role permissions file:', err);
  }
}

// User permissions lookup helper
export function getUserPermissions(user: User): string[] {
  if (user.role === 'superadmin') {
    return ALL_PERMISSIONS.map(p => p.id);
  }
  const rolePermIds = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
  const directPerms = user.permissions || [];
  return Array.from(new Set([...rolePermIds, ...directPerms]));
}

export function hasPermission(user: User, permissionId: string): boolean {
  if (user.role === 'superadmin') return true;
  return getUserPermissions(user).includes(permissionId);
}

// Login History JSON persistence helpers
const LOGIN_HISTORY_FILE = path.join(DATA_DIR, 'login_history.json');
export function readLoginHistory(): LoginHistory[] {
  if (!fs.existsSync(LOGIN_HISTORY_FILE)) {
    writeLoginHistory([]);
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(LOGIN_HISTORY_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
}

export function writeLoginHistory(history: LoginHistory[]) {
  try {
    fs.writeFileSync(LOGIN_HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('Error writing login history file:', err);
  }
}

// -------------------------------------------------------------
// ASYNCHRONOUS SUPABASE-BRIDGE ACCESSORS
// -------------------------------------------------------------

export async function readUsersAsync(): Promise<User[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('zoal_users').select('*');
      if (error) {
        console.log('Info: Supabase readUsers is not initialized yet. Using local fallback database.');
        return readUsers();
      }
      return (data || []).map(fromSupabaseUser);
    } catch (err: any) {
      console.log('Info: Supabase readUsers is not initialized yet. Using local fallback database.');
      return readUsers();
    }
  }
  return readUsers();
}

export async function writeUsersAsync(users: User[]) {
  // Always update local backup
  writeUsers(users);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbUsers = users.map(toSupabaseUser);
      const { error } = await supabase.from('zoal_users').upsert(dbUsers);
      if (error) {
        console.log('Info: Supabase writeUsers - local backup successfully updated.');
      }
    } catch (err: any) {
      console.log('Info: Supabase writeUsers exception - local backup successfully updated.');
    }
  }
}

export async function readSessionsAsync(): Promise<Session[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('zoal_sessions').select('*');
      if (error) {
        console.log('Info: Supabase readSessions is not initialized yet. Using local fallback database.');
        return readSessions();
      }
      return (data || []).map(fromSupabaseSession);
    } catch (err: any) {
      console.log('Info: Supabase readSessions is not initialized yet. Using local fallback database.');
      return readSessions();
    }
  }
  return readSessions();
}

export async function writeSessionsAsync(sessions: Session[]) {
  // Always update local backup
  writeSessions(sessions);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Clear sessions that are no longer in our local array to keep them in sync
      const { error: deleteError } = await supabase.from('zoal_sessions').delete().not('token', 'in', `(${sessions.map(s => s.token).join(',') || 'NULL'})`);
      if (deleteError) {
        console.log('Info: Supabase session cleaning - local session model is primary.');
      }

      if (sessions.length > 0) {
        const dbSessions = sessions.map(toSupabaseSession);
        const { error } = await supabase.from('zoal_sessions').upsert(dbSessions);
        if (error) {
          console.log('Info: Supabase writeSessions - local session model is primary.');
        }
      }
    } catch (err: any) {
      console.log('Info: Supabase writeSessions - local session model is primary.');
    }
  }
}

export async function readLogsAsync(): Promise<ActivityLog[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('zoal_activity_logs').select('*');
      if (error) {
        console.log('Info: Supabase readLogs is not initialized yet. Using local fallback database.');
        return readLogs();
      }
      return (data || []).map(fromSupabaseLog);
    } catch (err: any) {
      console.log('Info: Supabase readLogs is not initialized yet. Using local fallback database.');
      return readLogs();
    }
  }
  return readLogs();
}

export async function writeLogsAsync(logs: ActivityLog[]) {
  // Always update local backup
  writeLogs(logs);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbLogs = logs.map(toSupabaseLog);
      const { error } = await supabase.from('zoal_activity_logs').upsert(dbLogs);
      if (error) {
        console.log('Info: Supabase writeLogs - local backup successfully updated.');
      }
    } catch (err: any) {
      console.log('Info: Supabase writeLogs exception - local backup successfully updated.');
    }
  }
}

export async function readRolesAsync(): Promise<Role[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('zoal_roles').select('*');
      if (!error && data) {
        return data.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          createdAt: r.created_at
        }));
      }
    } catch (err) {}
  }
  return readRoles();
}

export async function writeRolesAsync(roles: Role[]) {
  writeRoles(roles);
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbRoles = roles.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        created_at: r.createdAt
      }));
      await supabase.from('zoal_roles').upsert(dbRoles);
    } catch (err) {}
  }
}

export async function readPermissionsAsync(): Promise<Permission[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('zoal_permissions').select('*');
      if (!error && data) {
        return data;
      }
    } catch (err) {}
  }
  return readPermissions();
}

export async function readRolePermissionsAsync(): Promise<RolePermission[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('zoal_role_permissions').select('*');
      if (!error && data) {
        return data.map(rp => ({
          roleId: rp.role_id,
          permissionId: rp.permission_id
        }));
      }
    } catch (err) {}
  }
  return readRolePermissions();
}

export async function writeRolePermissionsAsync(rp: RolePermission[]) {
  writeRolePermissions(rp);
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('zoal_role_permissions').delete().neq('role_id', 'invalid_id_dummy');
      const dbRp = rp.map(item => ({
        role_id: item.roleId,
        permission_id: item.permissionId
      }));
      await supabase.from('zoal_role_permissions').insert(dbRp);
    } catch (err) {}
  }
}

export async function readLoginHistoryAsync(): Promise<LoginHistory[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('zoal_login_history').select('*');
      if (!error && data) {
        return data.map(lh => ({
          id: lh.id,
          userId: lh.user_id,
          ipAddress: lh.ip_address,
          device: lh.device,
          browser: lh.browser,
          country: lh.country,
          loginAt: lh.login_at,
          logoutAt: lh.logout_at,
          status: lh.status
        }));
      }
    } catch (err) {}
  }
  return readLoginHistory();
}

export async function writeLoginHistoryAsync(lh: LoginHistory[]) {
  writeLoginHistory(lh);
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbLh = lh.map(item => ({
        id: item.id,
        user_id: item.userId,
        ip_address: item.ipAddress,
        device: item.device,
        browser: item.browser,
        country: item.country,
        login_at: item.loginAt,
        logout_at: item.logoutAt,
        status: item.status
      }));
      await supabase.from('zoal_login_history').upsert(dbLh);
    } catch (err) {}
  }
}

export async function logLoginHistoryAsync(
  userId: string,
  ipAddress: string,
  device: string,
  browser: string,
  country: string,
  status: 'success' | 'failure'
): Promise<string> {
  const record: LoginHistory = {
    id: `LH-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId,
    ipAddress: ipAddress || '127.0.0.1',
    device: device || 'Desktop',
    browser: browser || 'Unknown Browser',
    country: country || 'Saudi Arabia',
    loginAt: new Date().toISOString(),
    logoutAt: null,
    status
  };

  const history = readLoginHistory();
  history.push(record);
  writeLoginHistory(history);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbItem = {
        id: record.id,
        user_id: record.userId,
        ip_address: record.ipAddress,
        device: record.device,
        browser: record.browser,
        country: record.country,
        login_at: record.loginAt,
        logout_at: record.logoutAt,
        status: record.status
      };
      await supabase.from('zoal_login_history').insert(dbItem);
    } catch (err) {}
  }

  return record.id;
}

export async function logLogoutHistoryAsync(historyId: string) {
  const history = readLoginHistory();
  const index = history.findIndex(h => h.id === historyId);
  if (index !== -1) {
    history[index].logoutAt = new Date().toISOString();
    writeLoginHistory(history);
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('zoal_login_history').update({ logout_at: new Date().toISOString() }).eq('id', historyId);
    } catch (err) {}
  }
}

export async function logActivityAsync(
  userId: string,
  email: string,
  action: string,
  ip: string,
  userAgent: string,
  entity: string = 'system'
) {
  const log: ActivityLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId: userId || 'unknown',
    email: email || 'unknown',
    action,
    timestamp: new Date().toISOString(),
    ip: ip || 'unknown',
    userAgent: userAgent || 'unknown',
    entity: entity
  };

  // Log locally
  const logs = readLogs();
  logs.push(log);
  writeLogs(logs);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('zoal_activity_logs').insert(toSupabaseLog(log));
      if (error) {
        console.error('❌ Supabase logActivity error:', error.message);
      }
    } catch (err: any) {
      console.error('❌ Supabase logActivity exception:', err.message || err);
    }
  }
}

// -------------------------------------------------------------
// INITIAL SEEDING PROCEDURES
// -------------------------------------------------------------

export function seedAccounts() {
  let users = readUsers();
  let updated = false;

  // Purge any legacy demo accounts
  const demoEmails = [
    'alzoal3003@gmail.com',
    'admin@alzoal.com',
    'staff@alzoal.com',
    'customer@alzoal.com'
  ];

  const originalLength = users.length;
  users = users.filter((u) => !demoEmails.includes(u.email.toLowerCase()));
  if (users.length !== originalLength) {
    updated = true;
  }

  const superAdminEmail = 'rkinfinity.official@gmail.com';
  if (!users.some((u) => u.email.toLowerCase() === superAdminEmail.toLowerCase())) {
    users.push({
      id: 'USR-SUPERADMIN-1',
      firstName: 'RK',
      lastName: 'Infinity',
      email: superAdminEmail,
      phone: '+966 50 000 0000',
      passwordHash: hashPassword('SuperAdmin123!'),
      role: 'superadmin',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
      avatar: '',
      isVerified: true,
      verificationCode: 'VERIFIED',
      resetCode: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null,
      addresses: ['Al Wahat District, Riyadh, KSA'],
      permissions: []
    });
    updated = true;
  }

  if (updated) {
    writeUsers(users);
    console.log('Successfully updated Al Zoal Sovereign accounts roster.');
  }

  // Ensure default roles, permissions, role-permissions are also seeded
  readRoles();
  readPermissions();
  readRolePermissions();
}

// Automatically seed on import
seedAccounts();
