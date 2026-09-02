import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSupabaseClient } from './supabase';
import { logAuditEvent } from './audit';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const LOGS_FILE = path.join(DATA_DIR, 'activity_logs.json');

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || process.env.NODE_ENV === 'production';

// Ensure database directory and files exist
if (!isVercel) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Error creating local auth database directory:', err);
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
  opaqueSessionId?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  email: string;
  action: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  resourceType?: string | null;
  resourceId?: string | null;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  changedFields?: string[] | null;
  metadata?: Record<string, any> | null;
  result?: 'SUCCESS' | 'FAILED' | 'DENIED' | string;
  severity?: 'INFO' | 'WARN' | 'CRITICAL' | string;
  requestId?: string | null;
  correlationId?: string | null;
  source?: string;
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
  } catch {
    return false;
  }
}

function toSupabaseLog(log: ActivityLog): Record<string, any> {
  return {
    id: log.id,
    user_id: log.userId,
    email: log.email,
    action: log.action,
    timestamp: log.timestamp,
    ip: log.ip,
    user_agent: log.userAgent,
    resource_type: log.resourceType || null,
    resource_id: log.resourceId || null,
    before_state: log.beforeState || null,
    after_state: log.afterState || null,
    changed_fields: log.changedFields || null,
    metadata: log.metadata || null,
    result: log.result || 'SUCCESS',
    severity: log.severity || 'INFO',
    request_id: log.requestId || null,
    correlation_id: log.correlationId || null,
    source: log.source || 'server'
  };
}

function fromSupabaseLog(sl: any): ActivityLog {
  return {
    id: sl.id,
    userId: sl.user_id,
    email: sl.email,
    action: sl.action,
    timestamp: sl.timestamp,
    ip: sl.ip,
    userAgent: sl.user_agent,
    resourceType: sl.resource_type || null,
    resourceId: sl.resource_id || null,
    beforeState: sl.before_state || null,
    afterState: sl.after_state || null,
    changedFields: sl.changed_fields || null,
    metadata: sl.metadata || null,
    result: sl.result || 'SUCCESS',
    severity: sl.severity || 'INFO',
    requestId: sl.request_id || null,
    correlationId: sl.correlation_id || null,
    source: sl.source || 'server'
  };
}

// -------------------------------------------------------------
// CORE DB ACCESSORS (Synchronous Legacy Fallbacks)
// -------------------------------------------------------------

export function readUsers(): User[] {
  if (isVercel) return [];
  try {
    if (!fs.existsSync(USERS_FILE)) {
      writeUsers([]);
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users file:', err);
    return [];
  }
}

export function writeUsers(users: User[]) {
  if (isVercel) return;
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error writing users file:', err);
  }
}

export function readSessions(): Session[] {
  if (isVercel) return [];
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
  if (isVercel) return;
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  } catch (err) {
    console.error('Error writing sessions file:', err);
  }
}

export function readLogs(): ActivityLog[] {
  if (isVercel) return [];
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
  if (isVercel) return;
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
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
        return readUsers();
      }
      return (data || []).map(fromSupabaseUser);
    } catch (err: any) {
      console.warn('⚠️ Supabase readUsers exception, falling back to local JSON:', err.message || err);
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
        return readSessions();
      }
      return (data || []).map(fromSupabaseSession);
    } catch (err: any) {
      console.warn('⚠️ Supabase readSessions exception, falling back to local JSON:', err.message || err);
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
        return readLogs();
      }
      return (data || []).map(fromSupabaseLog);
    } catch (err: any) {
      console.warn('⚠️ Supabase readLogs exception, falling back to local JSON:', err.message || err);
      return readLogs();
    }
  }
  return readLogs();
}

/**
 * Backward-compatible audit API. All writes are delegated to the authoritative
 * structured server-side audit logger; no localStorage/local JSON audit write occurs.
 */
export async function logActivityAsync(userId: string, email: string, action: string, ip: string, userAgent: string) {
  await logAuditEvent({
    userId: userId || 'unknown',
    email: email || 'unknown',
    action,
    ip: ip || 'unknown',
    userAgent: userAgent || 'unknown',
    source: 'legacy_bridge'
  });
}

// -------------------------------------------------------------
// INITIAL SEEDING PROCEDURES
// -------------------------------------------------------------

export function seedAccounts() {
  const users = readUsers();
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

  if (updated) writeUsers(users);
}
