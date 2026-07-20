import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getSupabaseClient } from './supabase.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const LOGS_FILE = path.join(DATA_DIR, 'activity_logs.json');

// Ensure database directory and files exist (Asynchronous initialization)
export async function initializeAuthDb() {
  try {
    await fsPromises.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error initializing auth database directory:', err);
  }
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'customer' | 'staff' | 'manager' | 'admin' | 'owner';
  isVerified: boolean;
  verificationCode: string;
  resetCode: string;
  createdAt: string;
  addresses?: string[];
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
    is_verified: u.isVerified,
    verification_code: u.verificationCode,
    reset_code: u.resetCode,
    created_at: u.createdAt,
    addresses: u.addresses || []
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
    role: su.role,
    isVerified: su.is_verified,
    verificationCode: su.verification_code,
    resetCode: su.reset_code,
    createdAt: su.created_at,
    addresses: su.addresses || []
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
    user_agent: l.userAgent
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
    userAgent: sl.user_agent
  };
}

// -------------------------------------------------------------
// CORE DB ACCESSORS (Asynchronous File Operations)
// -------------------------------------------------------------

export async function readUsers(): Promise<User[]> {
  try {
    try {
      await fsPromises.access(USERS_FILE);
    } catch {
      await writeUsers([]);
      return [];
    }
    const data = await fsPromises.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users file:', err);
    return [];
  }
}

export async function writeUsers(users: User[]) {
  try {
    await fsPromises.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error writing users file:', err);
  }
}

export async function readSessions(): Promise<Session[]> {
  try {
    try {
      await fsPromises.access(SESSIONS_FILE);
    } catch {
      await writeSessions([]);
      return [];
    }
    const data = await fsPromises.readFile(SESSIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading sessions file:', err);
    return [];
  }
}

export async function writeSessions(sessions: Session[]) {
  try {
    await fsPromises.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  } catch (err) {
    console.error('Error writing sessions file:', err);
  }
}

export async function readLogs(): Promise<ActivityLog[]> {
  try {
    try {
      await fsPromises.access(LOGS_FILE);
    } catch {
      await writeLogs([]);
      return [];
    }
    const data = await fsPromises.readFile(LOGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading logs file:', err);
    return [];
  }
}

export async function writeLogs(logs: ActivityLog[]) {
  try {
    await fsPromises.writeFile(LOGS_FILE, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Error writing logs file:', err);
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
        console.warn('⚠️ Supabase readUsers failed, falling back to local JSON:', error.message);
        return await readUsers();
      }
      return (data || []).map(fromSupabaseUser);
    } catch (err: any) {
      console.warn('⚠️ Supabase readUsers exception, falling back to local JSON:', err.message || err);
      return await readUsers();
    }
  }
  return await readUsers();
}

export async function writeUsersAsync(users: User[]) {
  // Always update local backup
  await writeUsers(users);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbUsers = users.map(toSupabaseUser);
      const { error } = await supabase.from('zoal_users').upsert(dbUsers);
      if (error) {
        console.error('❌ Supabase writeUsers error:', error.message);
      }
    } catch (err: any) {
      console.error('❌ Supabase writeUsers exception:', err.message || err);
    }
  }
}

export async function readSessionsAsync(): Promise<Session[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('zoal_sessions').select('*');
      if (error) {
        console.warn('⚠️ Supabase readSessions failed, falling back to local JSON:', error.message);
        return await readSessions();
      }
      return (data || []).map(fromSupabaseSession);
    } catch (err: any) {
      console.warn('⚠️ Supabase readSessions exception, falling back to local JSON:', err.message || err);
      return await readSessions();
    }
  }
  return await readSessions();
}

export async function writeSessionsAsync(sessions: Session[]) {
  // Always update local backup
  await writeSessions(sessions);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Clear sessions that are no longer in our local array to keep them in sync
      const { error: deleteError } = await supabase.from('zoal_sessions').delete().not('token', 'in', `(${sessions.map(s => s.token).join(',') || 'NULL'})`);
      if (deleteError) {
        console.warn('⚠️ Supabase session cleaning warning:', deleteError.message);
      }

      if (sessions.length > 0) {
        const dbSessions = sessions.map(toSupabaseSession);
        const { error } = await supabase.from('zoal_sessions').upsert(dbSessions);
        if (error) {
          console.error('❌ Supabase writeSessions error:', error.message);
        }
      }
    } catch (err: any) {
      console.error('❌ Supabase writeSessions exception:', err.message || err);
    }
  }
}

export async function readLogsAsync(): Promise<ActivityLog[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('zoal_activity_logs').select('*');
      if (error) {
        console.warn('⚠️ Supabase readLogs failed, falling back to local JSON:', error.message);
        return await readLogs();
      }
      return (data || []).map(fromSupabaseLog);
    } catch (err: any) {
      console.warn('⚠️ Supabase readLogs exception, falling back to local JSON:', err.message || err);
      return await readLogs();
    }
  }
  return await readLogs();
}

export async function writeLogsAsync(logs: ActivityLog[]) {
  // Always update local backup
  await writeLogs(logs);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbLogs = logs.map(toSupabaseLog);
      const { error } = await supabase.from('zoal_activity_logs').upsert(dbLogs);
      if (error) {
        console.error('❌ Supabase writeLogs error:', error.message);
      }
    } catch (err: any) {
      console.error('❌ Supabase writeLogs exception:', err.message || err);
    }
  }
}

export async function logActivityAsync(userId: string, email: string, action: string, ip: string, userAgent: string) {
  const log: ActivityLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId: userId || 'unknown',
    email: email || 'unknown',
    action,
    timestamp: new Date().toISOString(),
    ip: ip || 'unknown',
    userAgent: userAgent || 'unknown',
  };

  // Log locally
  const logs = await readLogs();
  logs.push(log);
  await writeLogs(logs);

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

export async function seedAccounts() {
  const users = await readUsers();
  let updated = false;

  const defaultAdminEmail = 'alzoal3003@gmail.com';
  if (!users.some((u) => u.email.toLowerCase() === defaultAdminEmail.toLowerCase())) {
    users.push({
      id: 'USR-ADMIN-1',
      firstName: 'Abdullah',
      lastName: 'Al-Saudi',
      email: defaultAdminEmail,
      phone: '+966 56 769 9315',
      passwordHash: hashPassword('Admin123!'),
      role: 'admin',
      isVerified: true,
      verificationCode: 'VERIFIED',
      resetCode: '',
      createdAt: new Date().toISOString(),
      addresses: ['Al Shati District, Dammam, KSA', 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361']
    });
    updated = true;
  }

  const defaultStaffEmail = 'staff@alzoal.com';
  if (!users.some((u) => u.email.toLowerCase() === defaultStaffEmail.toLowerCase())) {
    users.push({
      id: 'USR-STAFF-1',
      firstName: 'Raed',
      lastName: 'Al-Fahad',
      email: defaultStaffEmail,
      phone: '+966 50 123 4567',
      passwordHash: hashPassword('Staff123!'),
      role: 'staff',
      isVerified: true,
      verificationCode: 'VERIFIED',
      resetCode: '',
      createdAt: new Date().toISOString(),
      addresses: ['Al Hofuf boutique, KSA']
    });
    updated = true;
  }

  const defaultOwnerEmail = 'owner@alzoal.com';
  if (!users.some((u) => u.email.toLowerCase() === defaultOwnerEmail.toLowerCase())) {
    users.push({
      id: 'USR-OWNER-1',
      firstName: 'Faisal',
      lastName: 'Al-Zoal',
      email: defaultOwnerEmail,
      phone: '+966 56 000 0001',
      passwordHash: hashPassword('Owner123!'),
      role: 'owner',
      isVerified: true,
      verificationCode: 'VERIFIED',
      resetCode: '',
      createdAt: new Date().toISOString(),
      addresses: ['HQ Executive Suite, Al Hofuf, KSA']
    });
    updated = true;
  }

  const defaultManagerEmail = 'manager@alzoal.com';
  if (!users.some((u) => u.email.toLowerCase() === defaultManagerEmail.toLowerCase())) {
    users.push({
      id: 'USR-MANAGER-1',
      firstName: 'Khaled',
      lastName: 'Al-Mansour',
      email: defaultManagerEmail,
      phone: '+966 56 000 0002',
      passwordHash: hashPassword('Manager123!'),
      role: 'manager',
      isVerified: true,
      verificationCode: 'VERIFIED',
      resetCode: '',
      createdAt: new Date().toISOString(),
      addresses: ['Riyadh Branch, KSA']
    });
    updated = true;
  }

  const defaultCustomerEmail = 'customer@alzoal.com';
  if (!users.some((u) => u.email.toLowerCase() === defaultCustomerEmail.toLowerCase())) {
    users.push({
      id: 'USR-CUSTOMER-1',
      firstName: 'Sultan',
      lastName: 'Al-Ghamdi',
      email: defaultCustomerEmail,
      phone: '+966 55 987 6543',
      passwordHash: hashPassword('Customer123!'),
      role: 'customer',
      isVerified: true,
      verificationCode: 'VERIFIED',
      resetCode: '',
      createdAt: new Date().toISOString(),
      addresses: ['Al Hamra District, Riyadh, KSA']
    });
    updated = true;
  }

  if (updated) {
    await writeUsers(users);
    console.log('Successfully seeded Al Zoal Sovereign Authentication accounts locally.');
  }
}

export async function seedAccountsAsync() {
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Seeding skipped in production environment.');
    return;
  }
  // Sync seed users to active database (Supabase)
  const users = await readUsersAsync();
  let updated = false;

  const defaultAdminEmail = 'alzoal3003@gmail.com';
  if (!users.some((u) => u.email.toLowerCase() === defaultAdminEmail.toLowerCase())) {
    users.push({
      id: 'USR-ADMIN-1',
      firstName: 'Abdullah',
      lastName: 'Al-Saudi',
      email: defaultAdminEmail,
      phone: '+966 56 769 9315',
      passwordHash: hashPassword('Admin123!'),
      role: 'admin',
      isVerified: true,
      verificationCode: 'VERIFIED',
      resetCode: '',
      createdAt: new Date().toISOString(),
      addresses: ['Al Shati District, Dammam, KSA', 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361']
    });
    updated = true;
  }

  const defaultStaffEmail = 'staff@alzoal.com';
  if (!users.some((u) => u.email.toLowerCase() === defaultStaffEmail.toLowerCase())) {
    users.push({
      id: 'USR-STAFF-1',
      firstName: 'Raed',
      lastName: 'Al-Fahad',
      email: defaultStaffEmail,
      phone: '+966 50 123 4567',
      passwordHash: hashPassword('Staff123!'),
      role: 'staff',
      isVerified: true,
      verificationCode: 'VERIFIED',
      resetCode: '',
      createdAt: new Date().toISOString(),
      addresses: ['Al Hofuf boutique, KSA']
    });
    updated = true;
  }

  const defaultOwnerEmail = 'owner@alzoal.com';
  if (!users.some((u) => u.email.toLowerCase() === defaultOwnerEmail.toLowerCase())) {
    users.push({
      id: 'USR-OWNER-1',
      firstName: 'Faisal',
      lastName: 'Al-Zoal',
      email: defaultOwnerEmail,
      phone: '+966 56 000 0001',
      passwordHash: hashPassword('Owner123!'),
      role: 'owner',
      isVerified: true,
      verificationCode: 'VERIFIED',
      resetCode: '',
      createdAt: new Date().toISOString(),
      addresses: ['HQ Executive Suite, Al Hofuf, KSA']
    });
    updated = true;
  }

  const defaultManagerEmail = 'manager@alzoal.com';
  if (!users.some((u) => u.email.toLowerCase() === defaultManagerEmail.toLowerCase())) {
    users.push({
      id: 'USR-MANAGER-1',
      firstName: 'Khaled',
      lastName: 'Al-Mansour',
      email: defaultManagerEmail,
      phone: '+966 56 000 0002',
      passwordHash: hashPassword('Manager123!'),
      role: 'manager',
      isVerified: true,
      verificationCode: 'VERIFIED',
      resetCode: '',
      createdAt: new Date().toISOString(),
      addresses: ['Riyadh Branch, KSA']
    });
    updated = true;
  }

  const defaultCustomerEmail = 'customer@alzoal.com';
  if (!users.some((u) => u.email.toLowerCase() === defaultCustomerEmail.toLowerCase())) {
    users.push({
      id: 'USR-CUSTOMER-1',
      firstName: 'Sultan',
      lastName: 'Al-Ghamdi',
      email: defaultCustomerEmail,
      phone: '+966 55 987 6543',
      passwordHash: hashPassword('Customer123!'),
      role: 'customer',
      isVerified: true,
      verificationCode: 'VERIFIED',
      resetCode: '',
      createdAt: new Date().toISOString(),
      addresses: ['Al Hamra District, Riyadh, KSA']
    });
    updated = true;
  }

  if (updated) {
    await writeUsersAsync(users);
    console.log('Successfully seeded Al Zoal Sovereign Authentication accounts to active DB.');
  } else {
    console.log('Sovereign Authentication accounts are already fully synced in active DB.');
  }
}

// Automatic seeding disabled on import for production-safe migration architecture
// Use seedAccounts() or seedAccountsAsync() explicitly in development scripts.
