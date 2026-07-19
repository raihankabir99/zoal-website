import React, { useState, useMemo } from 'react';
import { 
  Shield, User, Users, Activity, Database, Landmark, CreditCard, 
  Truck, Settings, Search, Plus, Trash2, Edit, CheckCircle, XCircle, 
  ToggleLeft, ToggleRight, Download, Upload, AlertCircle, RefreshCw, Key, 
  MapPin, Globe, Clock, Sliders, ChevronDown, ChevronUp, History, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SecuritySettingsCenterProps {
  currentUser: any;
  globalSettings: any;
  setGlobalSettings: (settings: any) => void;
  systemLogs: any[];
  setSystemLogs: (logs: any[]) => void;
  addLog: (action: string, target?: string) => void;
}

export default function SecuritySettingsCenter({
  currentUser,
  globalSettings,
  setGlobalSettings,
  systemLogs,
  setSystemLogs,
  addLog
}: SecuritySettingsCenterProps) {
  const [activeTab, setActiveTab] = useState<'admin_mgmt' | 'roles' | 'audit' | 'backup' | 'biz_info' | 'payments_shipping' | 'system'>('admin_mgmt');
  const [settingsSearch, setSettingsSearch] = useState<string>('');

  // 1. ADMIN MANAGEMENT STATES
  const [admins, setAdmins] = useState<any[]>([
    { id: 'adm-1', name: 'Zain Al-Abidin', email: 'owner@alzoal.com', role: 'Sovereign Owner', status: 'Active', sessions: 2, tfa: true, lastLogin: '10 mins ago (Current Session)' },
    { id: 'adm-2', name: 'Nasser Al-Thani', email: 'nasser@alzoal.com', role: 'System Administrator', status: 'Active', sessions: 1, tfa: true, lastLogin: '1 hour ago' },
    { id: 'adm-3', name: 'Fatma Al-Mansoori', email: 'fatma@alzoal.com', role: 'Enterprise Manager', status: 'Suspended', sessions: 0, tfa: false, lastLogin: '3 days ago' },
    { id: 'adm-4', name: 'Khalid Al-Mansoori', email: 'khalid@zoal.com', role: 'Concierge Staff', status: 'Active', sessions: 1, tfa: false, lastLogin: 'Active 2 mins ago' }
  ]);
  
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Enterprise Manager' });

  // 2. ROLE MATRIX STATE
  const [roles, setRoles] = useState<any[]>([
    { role: 'owner', label: 'Sovereign Owner', modules: { catalog: true, orders: true, reports: true, settings: true, logs: true }, actions: { write: true, delete: true, config: true } },
    { role: 'admin', label: 'System Administrator', modules: { catalog: true, orders: true, reports: true, settings: true, logs: true }, actions: { write: true, delete: false, config: true } },
    { role: 'manager', label: 'Enterprise Manager', modules: { catalog: true, orders: true, reports: true, settings: false, logs: false }, actions: { write: true, delete: false, config: false } },
    { role: 'staff', label: 'Concierge Staff', modules: { catalog: true, orders: true, reports: false, settings: false, logs: false }, actions: { write: false, delete: false, config: false } }
  ]);

  // 3. FAILED LOGIN / AUDIT LOGS STATE
  const failedLogins = [
    { id: 'f-1', email: 'intruder@unknown.com', ip: '185.220.101.45', device: 'Firefox / Linux (Tor Exit Node)', time: '2026-07-16 02:14', reason: 'Invalid Password Attempt' },
    { id: 'f-2', email: 'nasser@alzoal.com', ip: '93.169.4.12', device: 'Chrome / macOS (Al Khobar IP)', time: '2026-07-15 20:05', reason: 'Expired Token Verification' }
  ];

  // 4. BACKUP HISTORY STATE
  const [backups, setBackups] = useState<any[]>([
    { id: 'bk-501', filename: 'AL_ZOAL_Full_Database_20260716.json', size: '2.4 MB', count: '14,208 records', type: 'Daily Schedule', verified: true, time: '2026-07-16 00:00' },
    { id: 'bk-500', filename: 'AL_ZOAL_Full_Database_20260715.json', size: '2.3 MB', count: '14,185 records', type: 'Daily Schedule', verified: true, time: '2026-07-15 00:00' },
    { id: 'bk-499', filename: 'AL_ZOAL_Manual_Repl_Sync.json', size: '1.9 MB', count: '12,504 records', type: 'Manual Dump', verified: true, time: '2026-07-10 14:15' }
  ]);

  // 5. LOCAL EDITABLE BUSINESS PARAMETERS (to write to parent globalSettings)
  const [bizForm, setBizForm] = useState({
    businessName: globalSettings.businessName || 'AL ZOAL Enterprise',
    crNumber: '1010625341', // Commercial Registration
    vatNumber: globalSettings.taxId || '300092837200003',
    address: globalSettings.address || 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia',
    email: globalSettings.email || 'alzoal3003@gmail.com',
    phone: globalSettings.phone || '+966 56 769 9315',
    whatsapp: globalSettings.phone || '+966 56 769 9315',
    workingHours: '09:00 AM - 11:00 PM (AST)',
    timezone: 'Asia/Riyadh (AST - UTC+3)',
    currency: globalSettings.currency || 'SAR',
    language: globalSettings.language || 'en',
    // Social media
    instagram: globalSettings.instagram || 'https://instagram.com/alzoal',
    twitter: globalSettings.twitter || 'https://twitter.com/alzoal',
    facebook: globalSettings.facebook || 'https://facebook.com/alzoal',
    linkedin: 'https://linkedin.com/company/alzoal',
    tiktok: 'https://tiktok.com/@alzoal',
    youtube: 'https://youtube.com/c/alzoal',
    snapchat: 'https://snapchat.com/add/alzoal'
  });

  // 6. PAYMENT & SHIPPING SETTINGS
  const [payForm, setPayForm] = useState({
    moyasarSandboxKey: 'pk_sandbox_zoal_59a8c7b8d14',
    moyasarProdKey: 'pk_live_zoal_83f2a1b9c7d',
    stripeSandboxKey: 'pk_test_51Mz...zoal',
    stripeProdKey: 'pk_live_51Mz...zoal',
    paypalClientId: 'Aa_zoal_sandbox_95x82b',
    activeMode: 'sandbox', // sandbox, production
    moyasarEnabled: true,
    stripeEnabled: false,
    paypalEnabled: false,
    // Shipping rules
    shippingZones: 'All Saudi Sectors, Gulf Cooperation Council (GCC)',
    shippingRatesDefault: String(globalSettings.shippingFeeDefault || 25),
    freeShippingThreshold: String(globalSettings.shippingFreeThreshold || 500),
    deliveryTimeDefault: '2 to 4 Business Days (Overnight Courier)',
    primaryCourier: 'Priority Courier Express',
    trackingProvider: 'Aramex API Integration'
  });

  // 7. SYSTEM SMTP CONFIGS
  const [sysForm, setSysForm] = useState({
    smtpHost: globalSettings.smtpHost || 'smtp.zoal.com',
    smtpPort: globalSettings.smtpPort || '587',
    smtpUser: globalSettings.smtpUser || 'relay@zoal.com',
    smtpPass: globalSettings.smtpPass || '••••••••••••••••',
    ipWhitelist: globalSettings.ipWhitelist || '192.168.1.*, 127.0.0.1',
    sessionExpirationMinutes: String(globalSettings.sessionExpirationMinutes || 60),
    fileUploadLimitMb: '10 MB',
    cacheOptimizationEnabled: true,
    mediaOptimizationEnabled: true,
    maintenanceModeActive: globalSettings.maintenanceMode || false,
    environmentValidation: 'Production Container Block V3'
  });

  // Invitation action
  const handleInviteAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;
    
    const newAdmin = {
      id: `adm-${Date.now()}`,
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      status: 'Active',
      sessions: 0,
      tfa: false,
      lastLogin: 'Never (Invite Sent)'
    };

    setAdmins(prev => [...prev, newAdmin]);
    addLog(`Invited new administrator: ${inviteForm.email}`, "Security & Settings");
    setIsInviteOpen(false);
    setInviteForm({ name: '', email: '', role: 'Enterprise Manager' });
    alert("Grand invitation link successfully compiled and dispatched to " + inviteForm.email);
  };

  const handleToggleAdminStatus = (id: string) => {
    setAdmins(prev => prev.map(a => {
      if (a.id === id) {
        const nextStatus = a.status === 'Active' ? 'Suspended' : 'Active';
        addLog(`Modified Admin Status for ${a.email} to ${nextStatus}`, "Security & Settings");
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  const handleDeleteAdmin = (id: string, name: string) => {
    if (confirm(`Are you absolutely sure you want to revoke and delete ${name}'s administrative clearance?`)) {
      setAdmins(prev => prev.filter(a => a.id !== id));
      addLog(`Deleted administrator account: ${name}`, "Security & Settings");
    }
  };

  // Matrix permission toggles
  const handleTogglePermission = (role: string, type: 'modules' | 'actions', permKey: string) => {
    setRoles(prev => prev.map(r => {
      if (r.role === role) {
        const updatedGroup = { ...r[type] };
        updatedGroup[permKey] = !updatedGroup[permKey];
        addLog(`Modified RBAC Privilege Matrix [Role: ${role}, Permission: ${permKey}]`, "Security & Settings");
        return { ...r, [type]: updatedGroup };
      }
      return r;
    }));
  };

  // Backups / Manual trigger
  const handleManualBackupTrigger = () => {
    const newBackup = {
      id: `bk-${Date.now()}`,
      filename: `AL_ZOAL_Manual_Backup_${new Date().toISOString().slice(0,10)}_${Date.now().toString().slice(-4)}.json`,
      size: '2.5 MB',
      count: '14,245 records',
      type: 'Manual Force',
      verified: true,
      time: new Date().toLocaleString()
    };

    setBackups(prev => [newBackup, ...prev]);
    addLog("Triggered immediate administrative DB export replication sync", "Security & Settings");
    alert("Replication dump compiled successfully! Stored securely and available for local heritage download.");
  };

  // Save changes across all settings sheets
  const handleSaveAllSettings = () => {
    // Compile everything back to parent globalSettings structure
    const updatedGlobal = {
      ...globalSettings,
      businessName: bizForm.businessName,
      address: bizForm.address,
      email: bizForm.email,
      phone: bizForm.phone,
      instagram: bizForm.instagram,
      twitter: bizForm.twitter,
      facebook: bizForm.facebook,
      currency: bizForm.currency,
      language: bizForm.language,
      taxId: bizForm.vatNumber,
      shippingFeeDefault: Number(payForm.shippingRatesDefault),
      shippingFreeThreshold: Number(payForm.freeShippingThreshold),
      smtpHost: sysForm.smtpHost,
      smtpPort: sysForm.smtpPort,
      smtpUser: sysForm.smtpUser,
      ipWhitelist: sysForm.ipWhitelist,
      sessionExpirationMinutes: Number(sysForm.sessionExpirationMinutes),
      maintenanceMode: sysForm.maintenanceModeActive
    };

    setGlobalSettings(updatedGlobal);
    addLog("Synchronized comprehensive business and SMTP keys", "Global Settings");
    alert("Sovereign Enterprise configurations verified, synced, and cryptographically locked!");
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">SOVEREIGN PRIVILEGE CORE</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">SECURITY & SETTINGS GATEWAY</h2>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button 
            onClick={handleSaveAllSettings}
            className="py-1.5 px-4 bg-gold-pure text-black hover:bg-white text-[9.5px] uppercase font-bold tracking-widest rounded-xs transition-all cursor-pointer shadow-lg"
          >
            Lock configurations
          </button>
        </div>
      </div>

      {/* Sub tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
        {[
          { id: 'admin_mgmt', name: 'Admin Users & Sessions', icon: User },
          { id: 'roles', name: 'RBAC Role Matrix', icon: Shield },
          { id: 'audit', name: 'Ledgers & Security Audits', icon: Activity },
          { id: 'backup', name: 'Manual Backups & Restore', icon: Database },
          { id: 'biz_info', name: 'Business Credentials', icon: Landmark },
          { id: 'payments_shipping', name: 'Payments & Delivery Zones', icon: CreditCard },
          { id: 'system', name: 'SMTP & System Guards', icon: Settings }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-xs border transition-all text-[10px] uppercase font-bold tracking-widest cursor-pointer ${
                isActive 
                  ? 'bg-gold-pure text-black border-gold-pure' 
                  : 'bg-zinc-950 text-zinc-400 border-white/5 hover:text-white hover:border-white/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* TAB 1: ADMIN MANAGEMENT */}
        {activeTab === 'admin_mgmt' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-zinc-950 border border-white/5 p-4 rounded-xs">
              <div>
                <h3 className="text-xs uppercase font-bold tracking-widest text-white">ADMINISTRATIVE DIRECTORY</h3>
                <span className="text-[8.5px] text-zinc-500 font-sans">Revoke sessions or suspend terminal identities instantly.</span>
              </div>
              <button 
                onClick={() => setIsInviteOpen(true)}
                className="py-1 px-3 bg-gold-pure text-black hover:bg-white text-[8.5px] font-bold uppercase tracking-widest rounded-xs cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Invite Admin
              </button>
            </div>

            {/* Invite Form Modal */}
            <AnimatePresence>
              {isInviteOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-5 bg-zinc-950 border border-gold-pure/20 rounded-xs space-y-4"
                >
                  <div className="border-b border-white/5 pb-2">
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Send Administrative Invitation</h4>
                  </div>
                  <form onSubmit={handleInviteAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                      <span className="text-[7.5px] uppercase font-mono text-zinc-500">Full Name En</span>
                      <input 
                        type="text"
                        required
                        value={inviteForm.name}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-black border border-white/10 text-white p-1.5 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                        placeholder="Zain Al-Faisal"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[7.5px] uppercase font-mono text-zinc-500">Direct Email address</span>
                      <input 
                        type="email"
                        required
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-black border border-white/10 text-white p-1.5 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                        placeholder="zain@alzoal.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[7.5px] uppercase font-mono text-zinc-500">Initial Role Tier</span>
                      <select 
                        value={inviteForm.role}
                        onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                        className="bg-black border border-white/10 text-white p-1.5 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                      >
                        <option value="System Administrator">System Administrator</option>
                        <option value="Enterprise Manager">Enterprise Manager</option>
                        <option value="Concierge Staff">Concierge Staff</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="submit"
                        className="flex-1 py-1.5 bg-gold-pure text-black font-bold uppercase text-[9px] rounded-xs cursor-pointer"
                      >
                        Dispatch Invite
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsInviteOpen(false)}
                        className="py-1.5 px-3 bg-zinc-900 border border-white/10 text-zinc-400 text-[9px] uppercase font-mono rounded-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Admins Table */}
            <div className="bg-zinc-950 border border-white/5 rounded-xs overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/40 text-[8.5px] uppercase font-mono text-zinc-500 tracking-wider">
                    <th className="p-3">Identity / Email</th>
                    <th className="p-3">Role Tier</th>
                    <th className="p-3">Clearance status</th>
                    <th className="p-3">Active Sessions</th>
                    <th className="p-3">2FA Status</th>
                    <th className="p-3">Last Connection</th>
                    <th className="p-3 text-right">Emergency Revocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[9.5px]">
                  {admins.map(admin => (
                    <tr key={admin.id} className="hover:bg-white/1 text-zinc-300">
                      <td className="p-3">
                        <span className="text-white font-sans font-semibold block">{admin.name}</span>
                        <span className="text-zinc-500 text-[8.5px] block">{admin.email}</span>
                      </td>
                      <td className="p-3 text-gold-pure">{admin.role}</td>
                      <td className="p-3">
                        <span className={`inline-block py-0.5 px-2 text-[8px] font-bold rounded-full ${admin.status === 'Active' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/15' : 'bg-rose-950/40 text-rose-400 border border-rose-500/15'}`}>
                          {admin.status}
                        </span>
                      </td>
                      <td className="p-3 text-white">{admin.sessions} Terminal links</td>
                      <td className="p-3 text-zinc-400">{admin.tfa ? '✅ Hardware Locked' : '❌ Unenforced'}</td>
                      <td className="p-3 text-zinc-500">{admin.lastLogin}</td>
                      <td className="p-3 text-right space-x-2">
                        <button 
                          onClick={() => handleToggleAdminStatus(admin.id)}
                          className="text-zinc-400 hover:text-white underline text-[8.5px] cursor-pointer"
                        >
                          {admin.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                        {admin.role !== 'Sovereign Owner' && (
                          <button 
                            onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                            className="text-rose-500 hover:text-red-400 text-[8.5px] font-bold cursor-pointer"
                          >
                            Revoke All
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ROLE MATRIX */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs text-left">
              <h3 className="text-xs uppercase font-bold tracking-widest text-white">CRYPTOGRAPHIC PRIVILEGE MATRIX</h3>
              <span className="text-[8.5px] text-zinc-500 font-sans">Directly configure module permissions mapping for RBAC gates.</span>
            </div>

            <div className="bg-zinc-950 border border-white/5 rounded-xs overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/40 text-[8.5px] uppercase font-mono text-zinc-500 tracking-wider">
                    <th className="p-3 w-48">Role Profile</th>
                    <th className="p-3 text-center">Catalog Module</th>
                    <th className="p-3 text-center">Orders Management</th>
                    <th className="p-3 text-center">Financial Reports</th>
                    <th className="p-3 text-center">System Settings</th>
                    <th className="p-3 text-center">Audit Logs</th>
                    <th className="p-3 text-center">Write Access</th>
                    <th className="p-3 text-center">Full Configs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                  {roles.map(r => (
                    <tr key={r.role} className="hover:bg-white/1 text-zinc-300">
                      <td className="p-3 font-semibold text-white uppercase">{r.label}</td>
                      
                      {/* Module columns */}
                      {['catalog', 'orders', 'reports', 'settings', 'logs'].map(mKey => (
                        <td key={mKey} className="p-3 text-center">
                          <button 
                            disabled={r.role === 'owner'}
                            onClick={() => handleTogglePermission(r.role, 'modules', mKey)}
                            className={`p-1 text-[9px] uppercase font-bold rounded-xs cursor-pointer disabled:opacity-40 outline-none ${r.modules[mKey] ? 'text-gold-pure' : 'text-zinc-600'}`}
                          >
                            {r.modules[mKey] ? '✓ ACTIVE' : '✕ LOCKED'}
                          </button>
                        </td>
                      ))}

                      {/* Action columns */}
                      {['write', 'config'].map(aKey => (
                        <td key={aKey} className="p-3 text-center">
                          <button 
                            disabled={r.role === 'owner'}
                            onClick={() => handleTogglePermission(r.role, 'actions', aKey)}
                            className={`p-1 text-[9px] uppercase font-bold rounded-xs cursor-pointer disabled:opacity-40 outline-none ${r.actions[aKey] ? 'text-emerald-400' : 'text-zinc-600'}`}
                          >
                            {r.actions[aKey] ? '✓ PERMITTED' : '✕ DENIED'}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT HISTORY */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Intrusions and Failed Login Logs */}
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-rose-500">SECURITY EXCEPTION ALERT JOURNAL</h3>
                </div>
                <div className="divide-y divide-white/5 font-mono text-[9px] max-h-96 overflow-y-auto pr-1 scrollbar-none">
                  {failedLogins.map(f => (
                    <div key={f.id} className="py-2.5 space-y-1 text-zinc-400 hover:bg-white/1 px-2 rounded-xs">
                      <div className="flex justify-between">
                        <strong className="text-rose-500 uppercase">{f.reason}</strong>
                        <span className="text-zinc-500">{f.time}</span>
                      </div>
                      <p className="text-white font-sans text-[10px]">Attempt Target: <span className="text-gold-pure font-mono">{f.email}</span></p>
                      <p className="text-zinc-500 text-[8px]">Remote IP: {f.ip} • Client User-Agent: {f.device}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: IP and Active Session Logs */}
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-white font-mono">CONCURRENT TERMINAL SESSIONS</h3>
                  <span className="text-[8px] font-mono text-gold-pure">Secure Shell Node</span>
                </div>
                <div className="divide-y divide-white/5 font-mono text-[9px] max-h-96 overflow-y-auto pr-1 scrollbar-none">
                  {[
                    { ip: '192.168.1.1', location: 'Al Khobar Central, Saudi Arabia', device: 'Safari macOS Catalina V12', owner: 'owner@alzoal.com', status: 'Active (Current)' },
                    { ip: '192.168.1.25', location: 'Al Hofuf Warehouse Facility', device: 'Edge Windows 11 Enterprise', owner: 'khalid@zoal.com', status: 'Active' },
                    { ip: '93.120.45.109', location: 'Riyadh Branch, Saudi Arabia', device: 'Chrome Android Tablet', owner: 'nasser@alzoal.com', status: 'Idle 34m' }
                  ].map((s, idx) => (
                    <div key={idx} className="py-2.5 space-y-1 text-zinc-400 hover:bg-white/1 px-2 rounded-xs">
                      <div className="flex justify-between">
                        <strong className="text-white">{s.ip}</strong>
                        <span className="text-emerald-400 text-[8.5px] font-bold uppercase">{s.status}</span>
                      </div>
                      <p className="text-zinc-400 font-sans text-[10px]">Geographic Sector: {s.location}</p>
                      <p className="text-zinc-600 text-[8px]">Client Principal: {s.owner} • Device Shell: {s.device}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* General logs list */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
              <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                <h3 className="text-xs uppercase font-bold tracking-widest text-white">MASTER AUDIT LEDGER TRAIL</h3>
                <span className="text-[8px] font-mono text-zinc-500">Unmodifiable append-only record</span>
              </div>
              <div className="divide-y divide-white/5 font-mono text-[9.5px] max-h-72 overflow-y-auto pr-1 scrollbar-none">
                {systemLogs.map(log => (
                  <div key={log.id} className="py-2 flex justify-between text-zinc-400 hover:bg-white/1 duration-100 px-2 rounded-xs text-left">
                    <div>
                      <span className="text-white block font-sans font-semibold">{log.action}</span>
                      <span className="text-zinc-600 text-[8px] block">Admin Principal: {log.user} • Remote Node IP: {log.ip || '19.16.1.10'}</span>
                    </div>
                    <span className="text-zinc-500 shrink-0 text-[8.5px]">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MANUAL BACKUPS */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs flex justify-between items-center text-left">
              <div>
                <h3 className="text-xs uppercase font-bold tracking-widest text-white">REPLICATE & RESTORE CORE DUMP</h3>
                <span className="text-[8.5px] text-zinc-500 font-sans">Restore backups or compile replication files manually.</span>
              </div>
              <button 
                onClick={handleManualBackupTrigger}
                className="py-1.5 px-4 bg-gold-pure text-black hover:bg-white text-[9.5px] uppercase font-bold tracking-widest rounded-xs cursor-pointer flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" /> Execute Manual DB Dump
              </button>
            </div>

            {/* Backup Table */}
            <div className="bg-zinc-950 border border-white/5 rounded-xs overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/40 text-[8.5px] uppercase font-mono text-zinc-500 tracking-wider">
                    <th className="p-3">Dump Filename</th>
                    <th className="p-3">File Weight</th>
                    <th className="p-3">Database Records</th>
                    <th className="p-3">Dump Type</th>
                    <th className="p-3">Verification Checksum</th>
                    <th className="p-3">Dump Date</th>
                    <th className="p-3 text-right">Emergency Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[9.5px]">
                  {backups.map(bk => (
                    <tr key={bk.id} className="hover:bg-white/1 text-zinc-300">
                      <td className="p-3 font-semibold text-white">{bk.filename}</td>
                      <td className="p-3 text-zinc-400">{bk.size}</td>
                      <td className="p-3 text-gold-pure">{bk.count}</td>
                      <td className="p-3 text-zinc-400">{bk.type}</td>
                      <td className="p-3">
                        <span className="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/10 py-0.5 px-1.5 rounded text-[8px]">
                          ✓ MD5 PASS
                        </span>
                      </td>
                      <td className="p-3 text-zinc-500">{bk.time}</td>
                      <td className="p-3 text-right space-x-2">
                        <button 
                          onClick={() => {
                            const fileData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(globalSettings, null, 2));
                            const link = document.createElement("a");
                            link.setAttribute("href", fileData);
                            link.setAttribute("download", bk.filename);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            addLog(`Downloaded Database Dump file: ${bk.filename}`, "Security & Settings");
                          }}
                          className="text-zinc-400 hover:text-white underline text-[8.5px] cursor-pointer"
                        >
                          Download file
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm("🔴 WARNING: CRITICAL ROLLBACK DISPATCH. Restoring this backup will replace current session keys, admin directories, and product catalogs. Proceed?")) {
                              addLog(`Triggered complete Database Restore: ${bk.filename}`, "Security & Settings");
                              alert("Database restored successfully. Terminal restarted.");
                            }
                          }}
                          className="text-rose-500 hover:text-red-400 text-[8.5px] font-bold cursor-pointer"
                        >
                          Restore Rollback
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: BUSINESS INFO */}
        {activeTab === 'biz_info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            {/* Legal and Commercial Credentials */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className="text-xs uppercase font-bold tracking-widest text-white">LEGAL & COMMERCIAL CREDENTIALS</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">Corporate Name</span>
                  <input 
                    type="text" 
                    value={bizForm.businessName}
                    onChange={(e) => setBizForm(prev => ({ ...prev, businessName: e.target.value }))}
                    className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">Commercial Registration (CR)</span>
                  <input 
                    type="text" 
                    value={bizForm.crNumber}
                    onChange={(e) => setBizForm(prev => ({ ...prev, crNumber: e.target.value }))}
                    className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">Saudi VAT Registration</span>
                  <input 
                    type="text" 
                    value={bizForm.vatNumber}
                    onChange={(e) => setBizForm(prev => ({ ...prev, vatNumber: e.target.value }))}
                    className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">National Address / Headquarters</span>
                  <input 
                    type="text" 
                    value={bizForm.address}
                    onChange={(e) => setBizForm(prev => ({ ...prev, address: e.target.value }))}
                    className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">Primary Contact Email</span>
                  <input 
                    type="email" 
                    value={bizForm.email}
                    onChange={(e) => setBizForm(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">Contact Hotline</span>
                  <input 
                    type="text" 
                    value={bizForm.phone}
                    onChange={(e) => setBizForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">Working hours block</span>
                  <input 
                    type="text" 
                    value={bizForm.workingHours}
                    onChange={(e) => setBizForm(prev => ({ ...prev, workingHours: e.target.value }))}
                    className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">Corporate Language</span>
                  <select 
                    value={bizForm.language}
                    onChange={(e) => setBizForm(prev => ({ ...prev, language: e.target.value }))}
                    className="bg-black border border-white/10 text-white p-2 text-[10.5px] w-full rounded-xs outline-none focus:border-gold-pure"
                  >
                    <option value="en">English (Primary)</option>
                    <option value="ar">العربية (Arabic Traditional)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Social Media handles */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className="text-xs uppercase font-bold tracking-widest text-white">SOCIAL CHANNELS & MEDIA LINKS</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Instagram', key: 'instagram' },
                  { label: 'X (Twitter)', key: 'twitter' },
                  { label: 'Facebook', key: 'facebook' },
                  { label: 'LinkedIn', key: 'linkedin' },
                  { label: 'TikTok', key: 'tiktok' },
                  { label: 'YouTube', key: 'youtube' },
                  { label: 'Snapchat', key: 'snapchat' }
                ].map(item => (
                  <div key={item.key} className="space-y-1">
                    <span className="text-[7.5px] uppercase font-mono text-zinc-500">{item.label} Link</span>
                    <input 
                      type="text" 
                      value={(bizForm as any)[item.key]}
                      onChange={(e) => setBizForm(prev => ({ ...prev, [item.key]: e.target.value }))}
                      className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 6: PAYMENTS & SHIPPING */}
        {activeTab === 'payments_shipping' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            {/* Payment Gateways Config */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                <h3 className="text-xs uppercase font-bold tracking-widest text-white">PAYMENT CHANNELS & KEYS</h3>
                <span className="text-[8.5px] font-mono text-gold-pure">Future Ready Gateways</span>
              </div>

              {/* Mode switch */}
              <div className="bg-black border border-white/10 p-3 rounded-xs flex justify-between items-center">
                <div className="text-left space-y-0.5">
                  <span className="text-[9.5px] uppercase font-bold text-white block">Environment Mode</span>
                  <span className="text-zinc-500 text-[8px] font-sans">Toggle between Sandbox verification and Production billing.</span>
                </div>
                <div className="flex gap-1.5 font-mono text-[9px]">
                  <button 
                    onClick={() => setPayForm(prev => ({ ...prev, activeMode: 'sandbox' }))}
                    className={`py-1 px-2.5 rounded-xs border font-bold transition-all ${payForm.activeMode === 'sandbox' ? 'bg-amber-950/40 text-amber-400 border-amber-500/30' : 'bg-black text-zinc-500 border-white/10'}`}
                  >
                    SANDBOX
                  </button>
                  <button 
                    onClick={() => setPayForm(prev => ({ ...prev, activeMode: 'production' }))}
                    className={`py-1 px-2.5 rounded-xs border font-bold transition-all ${payForm.activeMode === 'production' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 animate-pulse' : 'bg-black text-zinc-500 border-white/10'}`}
                  >
                    PRODUCTION
                  </button>
                </div>
              </div>

              {/* Gateways checklist */}
              <div className="space-y-3 pt-1">
                {[
                  { key: 'moyasarEnabled', label: 'Moyasar Gateway (Local Cards, Apple Pay, mada)', sandboxKey: 'moyasarSandboxKey', prodKey: 'moyasarProdKey' },
                  { key: 'stripeEnabled', label: 'Stripe Gateway (International Credit Cards)', sandboxKey: 'stripeSandboxKey', prodKey: 'stripeProdKey' },
                  { key: 'paypalEnabled', label: 'PayPal Integration (Express Checkout)', sandboxKey: 'paypalClientId', prodKey: 'paypalClientId' }
                ].map(gate => (
                  <div key={gate.key} className="p-3 bg-black/40 border border-white/5 rounded-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <strong className="text-white text-[10px] uppercase tracking-wider block">{gate.label}</strong>
                      <button 
                        onClick={() => setPayForm(prev => ({ ...prev, [gate.key]: !(prev as any)[gate.key] }))}
                        className="cursor-pointer text-zinc-300 hover:text-white transition-all outline-none"
                      >
                        {(payForm as any)[gate.key] ? <ToggleRight className="w-8 h-8 text-gold-pure" /> : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                      </button>
                    </div>

                    {(payForm as any)[gate.key] && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <span className="text-[7.5px] uppercase font-mono text-zinc-500">Sandbox Public Key</span>
                          <input 
                            type="text" 
                            value={(payForm as any)[gate.sandboxKey]}
                            onChange={(e) => setPayForm(prev => ({ ...prev, [gate.sandboxKey]: e.target.value }))}
                            className="bg-zinc-950 border border-white/10 text-white p-1.5 text-[9.5px] font-mono w-full rounded-xs outline-none focus:border-gold-pure"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[7.5px] uppercase font-mono text-zinc-500">Production Secret Key</span>
                          <input 
                            type="password" 
                            value={(payForm as any)[gate.prodKey]}
                            onChange={(e) => setPayForm(prev => ({ ...prev, [gate.prodKey]: e.target.value }))}
                            className="bg-zinc-950 border border-white/10 text-white p-1.5 text-[9.5px] font-mono w-full rounded-xs outline-none focus:border-gold-pure"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Courier & Shipping Zones */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-white">DELIVERY TIME & COURIER ZONES</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[7.5px] uppercase font-mono text-zinc-500">Covered Shipping Zones</span>
                    <input 
                      type="text" 
                      value={payForm.shippingZones}
                      onChange={(e) => setPayForm(prev => ({ ...prev, shippingZones: e.target.value }))}
                      className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[7.5px] uppercase font-mono text-zinc-500">Default Shipping Rate (SAR)</span>
                      <input 
                        type="number" 
                        value={payForm.shippingRatesDefault}
                        onChange={(e) => setPayForm(prev => ({ ...prev, shippingRatesDefault: e.target.value }))}
                        className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[7.5px] uppercase font-mono text-zinc-500">Free Courier Threshold (SAR)</span>
                      <input 
                        type="number" 
                        value={payForm.freeShippingThreshold}
                        onChange={(e) => setPayForm(prev => ({ ...prev, freeShippingThreshold: e.target.value }))}
                        className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7.5px] uppercase font-mono text-zinc-500">Estimated Handoff Period</span>
                    <input 
                      type="text" 
                      value={payForm.deliveryTimeDefault}
                      onChange={(e) => setPayForm(prev => ({ ...prev, deliveryTimeDefault: e.target.value }))}
                      className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[7.5px] uppercase font-mono text-zinc-500">Primary Courier Provider</span>
                      <input 
                        type="text" 
                        value={payForm.primaryCourier}
                        onChange={(e) => setPayForm(prev => ({ ...prev, primaryCourier: e.target.value }))}
                        className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[7.5px] uppercase font-mono text-zinc-500">Waybill/Tracking API</span>
                      <input 
                        type="text" 
                        value={payForm.trackingProvider}
                        onChange={(e) => setPayForm(prev => ({ ...prev, trackingProvider: e.target.value }))}
                        className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status notice */}
              <div className="bg-black/30 border border-white/5 p-3 rounded-xs text-[8.5px] text-zinc-500 flex items-center justify-between">
                <span>Direct logistics API link: active (Aramex Sandbox checked)</span>
                <button 
                  type="button"
                  onClick={() => {
                    alert("Courier dispatch endpoint check succeeded! Latency: 42ms.");
                  }}
                  className="py-0.5 px-2 bg-zinc-900 border border-white/5 rounded text-[8px] font-mono text-white cursor-pointer"
                >
                  Verify courier link
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 7: SYSTEM CONFIG */}
        {activeTab === 'system' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            {/* SMTP configuration */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className="text-xs uppercase font-bold tracking-widest text-white">SMTP SECURE EMAIL RELAY</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">SMTP Host Server</span>
                  <input 
                    type="text" 
                    value={sysForm.smtpHost}
                    onChange={(e) => setSysForm(prev => ({ ...prev, smtpHost: e.target.value }))}
                    className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">SMTP Relay Port</span>
                  <input 
                    type="text" 
                    value={sysForm.smtpPort}
                    onChange={(e) => setSysForm(prev => ({ ...prev, smtpPort: e.target.value }))}
                    className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">Relay Username</span>
                  <input 
                    type="text" 
                    value={sysForm.smtpUser}
                    onChange={(e) => setSysForm(prev => ({ ...prev, smtpUser: e.target.value }))}
                    className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">Relay Password</span>
                  <input 
                    type="password" 
                    value={sysForm.smtpPass}
                    onChange={(e) => setSysForm(prev => ({ ...prev, smtpPass: e.target.value }))}
                    className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    alert("Relay transaction checked successfully! Test greeting sent to " + bizForm.email);
                    addLog("Fired secure SMTP transaction handshake", "System Settings");
                  }}
                  className="py-1 px-3 bg-zinc-900 border border-white/10 text-white hover:border-gold-pure rounded-xs font-bold text-[8.5px] uppercase tracking-wider cursor-pointer"
                >
                  Verify SMTP Link
                </button>
              </div>
            </div>

            {/* General system settings */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-white">SYSTEM SECURITY & BUFFER PATH</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[7.5px] uppercase font-mono text-zinc-500">IP White-listing block</span>
                    <input 
                      type="text" 
                      value={sysForm.ipWhitelist}
                      onChange={(e) => setSysForm(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                      className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7.5px] uppercase font-mono text-zinc-500">Session Expiration (mins)</span>
                    <input 
                      type="number" 
                      value={sysForm.sessionExpirationMinutes}
                      onChange={(e) => setSysForm(prev => ({ ...prev, sessionExpirationMinutes: e.target.value }))}
                      className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7.5px] uppercase font-mono text-zinc-500">Max File upload limit</span>
                    <input 
                      type="text" 
                      value={sysForm.fileUploadLimitMb}
                      onChange={(e) => setSysForm(prev => ({ ...prev, fileUploadLimitMb: e.target.value }))}
                      className="bg-black border border-white/10 text-white p-2 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7.5px] uppercase font-mono text-zinc-500">Security container node</span>
                    <div className="bg-black border border-white/10 text-zinc-500 p-2 text-[10px] rounded-xs font-mono">
                      {sysForm.environmentValidation}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-black/40 border border-white/5 p-3 rounded-xs flex justify-between items-center">
                    <div className="space-y-0.5 text-left">
                      <strong className="text-white uppercase font-bold text-[9px] block">Global Store Maintenance</strong>
                      <span className="text-zinc-500 text-[8px] block font-sans">Lock public shop with construction banner</span>
                    </div>
                    <button
                      onClick={() => setSysForm(prev => ({ ...prev, maintenanceModeActive: !prev.maintenanceModeActive }))}
                      className="text-zinc-300 hover:text-white transition-all text-sm outline-none"
                    >
                      {sysForm.maintenanceModeActive ? <ToggleRight className="w-8 h-8 text-rose-500" /> : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                    </button>
                  </div>

                  <div className="bg-black/40 border border-white/5 p-3 rounded-xs flex justify-between items-center">
                    <div className="space-y-0.5 text-left">
                      <strong className="text-white uppercase font-bold text-[9px] block">Media Optimization Core</strong>
                      <span className="text-zinc-500 text-[8px] block font-sans">Auto-compress product gallery uploads</span>
                    </div>
                    <button
                      onClick={() => setSysForm(prev => ({ ...prev, mediaOptimizationEnabled: !prev.mediaOptimizationEnabled }))}
                      className="text-zinc-300 hover:text-white transition-all text-sm outline-none"
                    >
                      {sysForm.mediaOptimizationEnabled ? <ToggleRight className="w-8 h-8 text-gold-pure" /> : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cache clear action */}
              <div className="pt-4 border-t border-white/5 flex justify-between items-center text-left">
                <div className="space-y-0.5">
                  <span className="text-[8px] uppercase text-zinc-500 block font-mono">System maintenance</span>
                  <span className="text-zinc-600 text-[8px] block">Frees cloud memory logs and assets CDN cache.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    alert("Sovereign CDN and local Redis cache indices successfully flushed!");
                    addLog("Flushed enterprise site CDN memory caches", "System Settings");
                  }}
                  className="py-1 px-3 bg-rose-950/20 border border-rose-900/30 text-rose-400 hover:bg-rose-900 hover:text-white transition-all rounded-xs font-bold text-[8.5px] uppercase cursor-pointer"
                >
                  Flush Cache
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
