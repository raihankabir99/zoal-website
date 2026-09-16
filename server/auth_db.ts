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

if (!isVercel) {
  try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); }
  catch (err) { console.error('Error creating local auth database directory:', err); }
}

export interface User {
  id: string; firstName: string; lastName: string; email: string; phone: string;
  passwordHash: string; role: 'customer' | 'staff' | 'manager' | 'admin' | 'owner';
  isVerified: boolean; verificationCode: string; resetCode: string; createdAt: string; addresses?: string[];
}
export interface Session { token: string; userId: string; expiresAt: string; rememberMe: boolean; opaqueSessionId?: string; }
export interface ActivityLog {
  id: string; userId: string; email: string; action: string; timestamp: string; ip: string; userAgent: string;
  resourceType?: string | null; resourceId?: string | null; beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null; changedFields?: string[] | null; metadata?: Record<string, any> | null;
  result?: 'SUCCESS' | 'FAILED' | 'DENIED' | string; severity?: 'INFO' | 'WARN' | 'CRITICAL' | string;
  requestId?: string | null; correlationId?: string | null; source?: string;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}
export function verifyPassword(password: string, storedHash: string): boolean {
  try { const [salt, hash] = storedHash.split(':'); if (!salt || !hash) return false; return hash === crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex'); }
  catch { return false; }
}

export function toSupabaseUser(u: User) { return { id:u.id, first_name:u.firstName, last_name:u.lastName, email:u.email, phone:u.phone, password_hash:u.passwordHash, role:u.role, is_verified:u.isVerified, verification_code:u.verificationCode, reset_code:u.resetCode, created_at:u.createdAt, addresses:u.addresses||[] }; }
export function fromSupabaseUser(su:any):User { return { id:su.id, firstName:su.first_name, lastName:su.last_name, email:su.email, phone:su.phone, passwordHash:su.password_hash, role:su.role, isVerified:su.is_verified, verificationCode:su.verification_code, resetCode:su.reset_code, createdAt:su.created_at, addresses:su.addresses||[] }; }
export function toSupabaseSession(s:Session) { return { token:s.token, user_id:s.userId, expires_at:s.expiresAt, remember_me:s.rememberMe, opaque_session_id:s.opaqueSessionId||crypto.randomUUID() }; }
export function fromSupabaseSession(ss:any):Session { return { token:ss.token, userId:ss.user_id, expiresAt:ss.expires_at, rememberMe:ss.remember_me, opaqueSessionId:ss.opaque_session_id }; }
export function toSupabaseLog(l:ActivityLog) { return { id:l.id, user_id:l.userId, email:l.email, action:l.action, timestamp:l.timestamp, ip:l.ip, user_agent:l.userAgent, resource_type:l.resourceType||null, resource_id:l.resourceId||null, before_state:l.beforeState||null, after_state:l.afterState||null, changed_fields:l.changedFields||null, metadata:l.metadata||{}, result:l.result||'SUCCESS', severity:l.severity||'INFO', request_id:l.requestId||null, correlation_id:l.correlationId||null, source:l.source||'server' }; }
export function fromSupabaseLog(sl:any):ActivityLog { return { id:sl.id, userId:sl.user_id, email:sl.email, action:sl.action, timestamp:sl.timestamp, ip:sl.ip, userAgent:sl.user_agent, resourceType:sl.resource_type||null, resourceId:sl.resource_id||null, beforeState:sl.before_state||null, afterState:sl.after_state||null, changedFields:sl.changed_fields||null, metadata:sl.metadata||null, result:sl.result||'SUCCESS', severity:sl.severity||'INFO', requestId:sl.request_id||null, correlationId:sl.correlation_id||null, source:sl.source||'server' }; }

export function readUsers():User[] { if(isVercel)return []; try { if(!fs.existsSync(USERS_FILE)){writeUsers([]);return [];} return JSON.parse(fs.readFileSync(USERS_FILE,'utf-8')); } catch(err){console.error('Error reading users file:',err);return [];} }
export function writeUsers(users:User[]){if(isVercel)return;try{fs.writeFileSync(USERS_FILE,JSON.stringify(users,null,2));}catch(err){console.error('Error writing users file:',err);}}
export function readSessions():Session[]{if(isVercel)return [];try{if(!fs.existsSync(SESSIONS_FILE)){writeSessions([]);return [];}return JSON.parse(fs.readFileSync(SESSIONS_FILE,'utf-8'));}catch(err){console.error('Error reading sessions file:',err);return [];}}
export function writeSessions(sessions:Session[]){if(isVercel)return;try{fs.writeFileSync(SESSIONS_FILE,JSON.stringify(sessions,null,2));}catch(err){console.error('Error writing sessions file:',err);}}
export function readLogs():ActivityLog[]{if(isVercel)return [];try{if(!fs.existsSync(LOGS_FILE)){writeLogs([]);return [];}return JSON.parse(fs.readFileSync(LOGS_FILE,'utf-8'));}catch(err){console.error('Error reading logs file:',err);return [];}}
export function writeLogs(logs:ActivityLog[]){if(isVercel)return;try{fs.writeFileSync(LOGS_FILE,JSON.stringify(logs,null,2));}catch(err){console.error('Error writing logs file:',err);}}

export async function readUsersAsync():Promise<User[]>{const supabase=getSupabaseClient();if(supabase){try{const{data,error}=await supabase.from('zoal_users').select('*');if(error){console.warn('⚠️ Supabase readUsers failed, falling back to local JSON:',error.message);return readUsers();}return(data||[]).map(fromSupabaseUser);}catch(err:any){console.warn('⚠️ Supabase readUsers exception, falling back to local JSON:',err.message||err);return readUsers();}}return readUsers();}
export async function writeUsersAsync(users:User[]){writeUsers(users);const supabase=getSupabaseClient();if(supabase){try{const{error}=await supabase.from('zoal_users').upsert(users.map(toSupabaseUser));if(error)console.error('❌ Supabase writeUsers error:',error.message);}catch(err:any){console.error('❌ Supabase writeUsers exception:',err.message||err);}}}
export async function readSessionsAsync():Promise<Session[]>{const supabase=getSupabaseClient();if(supabase){try{const{data,error}=await supabase.from('zoal_sessions').select('*');if(error){console.warn('⚠️ Supabase readSessions failed, falling back to local JSON:',error.message);return readSessions();}return(data||[]).map(fromSupabaseSession);}catch(err:any){console.warn('⚠️ Supabase readSessions exception, falling back to local JSON:',err.message||err);return readSessions();}}return readSessions();}
export async function writeSessionsAsync(sessions:Session[]){writeSessions(sessions);const supabase=getSupabaseClient();if(supabase){try{const{error:deleteError}=await supabase.from('zoal_sessions').delete().not('token','in',`(${sessions.map(s=>s.token).join(',')||'NULL'})`);if(deleteError)console.warn('⚠️ Supabase session cleaning warning:',deleteError.message);if(sessions.length>0){const{error}=await supabase.from('zoal_sessions').upsert(sessions.map(toSupabaseSession));if(error)console.error('❌ Supabase writeSessions error:',error.message);}}catch(err:any){console.error('❌ Supabase writeSessions exception:',err.message||err);}}}
export async function readLogsAsync():Promise<ActivityLog[]>{const supabase=getSupabaseClient();if(supabase){try{const{data,error}=await supabase.from('zoal_activity_logs').select('*');if(error){console.warn('⚠️ Supabase readLogs failed, falling back to local JSON:',error.message);return readLogs();}return(data||[]).map(fromSupabaseLog);}catch(err:any){console.warn('⚠️ Supabase readLogs exception, falling back to local JSON:',err.message||err);return readLogs();}}return readLogs();}

export async function logActivityAsync(userId:string,email:string,action:string,ip:string,userAgent:string){await logAuditEvent({userId:userId||'unknown',email:email||'unknown',action,ip:ip||'unknown',userAgent:userAgent||'unknown',source:'legacy_bridge'});}

export function seedAccounts(){const users=readUsers();let updated=false;const defaults=[
{id:'USR-ADMIN-1',firstName:'Abdullah',lastName:'Al-Saudi',email:'alzoal3003@gmail.com',phone:'+966 56 769 9315',passwordHash:hashPassword('Admin123!'),role:'admin' as const,addresses:['Al Shati District, Dammam, KSA','Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361']},
{id:'USR-STAFF-1',firstName:'Raed',lastName:'Al-Fahad',email:'staff@alzoal.com',phone:'+966 50 123 4567',passwordHash:hashPassword('Staff123!'),role:'staff' as const,addresses:['Al Hofuf boutique, KSA']},
{id:'USR-OWNER-1',firstName:'Faisal',lastName:'Al-Zoal',email:'owner@alzoal.com',phone:'+966 56 000 0001',passwordHash:hashPassword('Owner123!'),role:'owner' as const,addresses:['HQ Executive Suite, Al Hofuf, KSA']},
{id:'USR-MANAGER-1',firstName:'Khaled',lastName:'Al-Mansour',email:'manager@alzoal.com',phone:'+966 56 000 0002',passwordHash:hashPassword('Manager123!'),role:'manager' as const,addresses:['Riyadh Branch, KSA']},
{id:'USR-CUSTOMER-1',firstName:'Sultan',lastName:'Al-Ghamdi',email:'customer@alzoal.com',phone:'+966 55 987 6543',passwordHash:hashPassword('Customer123!'),role:'customer' as const,addresses:['Al Hamra District, Riyadh, KSA']}];
for(const d of defaults){if(!users.some(u=>u.email.toLowerCase()===d.email.toLowerCase())){users.push({...d,isVerified:true,verificationCode:'VERIFIED',resetCode:'',createdAt:new Date().toISOString()});updated=true;}}
if(updated)writeUsers(users);}

export async function seedAccountsAsync(){const users=await readUsersAsync();let updated=false;const defaults=[
{id:'USR-ADMIN-1',firstName:'Abdullah',lastName:'Al-Saudi',email:'alzoal3003@gmail.com',phone:'+966 56 769 9315',passwordHash:hashPassword('Admin123!'),role:'admin' as const,addresses:['Al Shati District, Dammam, KSA','Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361']},
{id:'USR-STAFF-1',firstName:'Raed',lastName:'Al-Fahad',email:'staff@alzoal.com',phone:'+966 50 123 4567',passwordHash:hashPassword('Staff123!'),role:'staff' as const,addresses:['Al Hofuf boutique, KSA']},
{id:'USR-OWNER-1',firstName:'Faisal',lastName:'Al-Zoal',email:'owner@alzoal.com',phone:'+966 56 000 0001',passwordHash:hashPassword('Owner123!'),role:'owner' as const,addresses:['HQ Executive Suite, Al Hofuf, KSA']},
{id:'USR-MANAGER-1',firstName:'Khaled',lastName:'Al-Mansour',email:'manager@alzoal.com',phone:'+966 56 000 0002',passwordHash:hashPassword('Manager123!'),role:'manager' as const,addresses:['Riyadh Branch, KSA']},
{id:'USR-CUSTOMER-1',firstName:'Sultan',lastName:'Al-Ghamdi',email:'customer@alzoal.com',phone:'+966 55 987 6543',passwordHash:hashPassword('Customer123!'),role:'customer' as const,addresses:['Al Hamra District, Riyadh, KSA']}];
for(const d of defaults){if(!users.some(u=>u.email.toLowerCase()===d.email.toLowerCase())){users.push({...d,isVerified:true,verificationCode:'VERIFIED',resetCode:'',createdAt:new Date().toISOString()});updated=true;}}
if(updated)await writeUsersAsync(users);}

seedAccounts();
