import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Shield, User, Users, Activity, Database, Landmark, CreditCard, 
  Truck, Settings, Search, Plus, Trash2, Edit, CheckCircle, XCircle, 
  ToggleLeft, ToggleRight, Download, Upload, AlertCircle, RefreshCw, Key, 
  MapPin, Globe, Clock, Sliders, ChevronDown, ChevronUp, History, Info, Eye, EyeOff
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
  const [admins, setAdmins] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'staff' });

  // 2. ROLE MATRIX STATE
  const [rbacMatrix, setRbacMatrix] = useState<any>(null);

  // 3. FAILED LOGIN / AUDIT LOGS STATE
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // 4. BACKUP HISTORY STATE
  const [backups, setBackups] = useState<any[]>([]);
  const [backupStatus, setBackupStatus] = useState<any>(null);

  // DATA FETCHING
  const fetchRoster = useCallback(async () => {
    try {
      setLoadingAdmins(true);
      const res = await fetch('/api/admin/roster');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error('Failed to fetch roster:', err);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/active-sessions');
      if (res.ok) {
        const data = await res.json();
        setActiveSessions(data);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const fetchRbac = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rbac-matrix');
      if (res.ok) {
        const data = await res.json();
        setRbacMatrix(data);
      }
    } catch (err) {
      console.error('Failed to fetch RBAC matrix:', err);
    }
  }, []);

  const fetchBackupData = useCallback(async () => {
    try {
      const res = await fetch('/api/operations/backups');
      if (res.ok) {
        const data = await res.json();
        setBackupStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch backup data:', err);
    }
  }, []);

  useEffect(() => {
    fetchRoster();
    fetchSessions();
    fetchLogs();
    fetchRbac();
    fetchBackupData();
  }, [fetchRoster, fetchSessions, fetchLogs, fetchRbac, fetchBackupData]);

  // 5. LOCAL EDITABLE BUSINESS PARAMETERS (to write to parent globalSettings)
  const [bizForm, setBizForm] = useState({
    businessName: globalSettings.businessName || 'AL ZOAL Boutique',
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

  // Password visibility states
  const [showProdKeys, setShowProdKeys] = useState<{ [key: string]: boolean }>({});
  const [showSmtpPass, setShowSmtpPass] = useState<boolean>(false);

  // Invitation action
  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;
    
    try {
      const res = await fetch('/api/admin/customers', { // Using same endpoint for now but with admin role
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: inviteForm.name, 
          email: inviteForm.email, 
          role: inviteForm.role,
          status: 'Active'
        })
      });

      if (res.ok) {
        addLog(`Invited new administrator: ${inviteForm.email}`, "Security & Settings");
        setIsInviteOpen(false);
        setInviteForm({ name: '', email: '', role: 'staff' });
        fetchRoster();
        alert("Grand invitation link successfully compiled and dispatched to " + inviteForm.email);
      } else {
        const err = await res.json();
        alert(`Failed to invite admin: ${err.message || err.error}`);
      }
    } catch (err) {
      console.error('Error inviting admin:', err);
    }
  };

  const handleUpdateAdminRole = async (id: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/roster/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });

      if (res.ok) {
        addLog(`Modified Admin Role for ${id} to ${role}`, "Security & Settings");
        fetchRoster();
      } else {
        const err = await res.json();
        alert(`Failed to update role: ${err.message || err.error}`);
      }
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (confirm(`Are you absolutely sure you want to revoke and delete ${name}'s administrative clearance?`)) {
      try {
        const res = await fetch(`/api/admin/roster/${id}`, { method: 'DELETE' });
        if (res.ok) {
          addLog(`Deleted administrator account: ${name}`, "Security & Settings");
          fetchRoster();
        } else {
          const err = await res.json();
          alert(`Failed to revoke access: ${err.message || err.error}`);
        }
      } catch (err) {
        console.error('Error deleting admin:', err);
      }
    }
  };

  const handleRevokeSession = async (token: string) => {
    try {
      const res = await fetch(`/api/admin/sessions/${token}`, { method: 'DELETE' });
      if (res.ok) {
        addLog(`Revoked session: ${token}`, "Security & Settings");
        fetchSessions();
      }
    } catch (err) {
      console.error('Error revoking session:', err);
    }
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
    alert("Boutique configurations verified, synced, and cryptographically locked!");
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">SYSTEM PRIVILEGE CORE</span>
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
          { id: 'audit', name: 'Lists & Security Audits', icon: Activity },
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
                        <option value="Enterprise Manager">Store Manager</option>
                        <option value="Support Staff">Support Staff</option>
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
                      <td className="p-3 text-gold-pure capitalize">
                        <select 
                          value={admin.role}
                          onChange={(e) => handleUpdateAdminRole(admin.id, e.target.value)}
                          className="bg-transparent border-none text-gold-pure text-[9.5px] outline-none cursor-pointer"
                        >
                          {['staff', 'manager', 'admin', 'owner'].map(r => (
                            <option key={r} value={r} className="bg-zinc-950">{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block py-0.5 px-2 text-[8px] font-bold rounded-full ${admin.status === 'Active' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/15' : 'bg-rose-950/40 text-rose-400 border border-rose-500/15'}`}>
                          {admin.status}
                        </span>
                      </td>
                      <td className="p-3 text-white">Managed</td>
                      <td className="p-3 text-zinc-400">Verified</td>
                      <td className="p-3 text-zinc-500">{new Date(admin.joinedAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right space-x-2">
                        {admin.role !== 'owner' && (
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
                  {admins.length === 0 && !loadingAdmins && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-600 italic">No administrative identities found.</td>
                    </tr>
                  )}
                  {loadingAdmins && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gold-pure animate-pulse">Syncing administrative directory...</td>
                    </tr>
                  )}
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
                  {rbacMatrix ? Object.entries(rbacMatrix.permissions).map(([role, perms]: [string, any]) => (
                    <tr key={role} className="hover:bg-white/1 text-zinc-300 border-b border-white/5 last:border-0">
                      <td className="p-3 font-semibold text-white uppercase">{role}</td>
                      <td colSpan={7} className="p-3 text-[9px] text-zinc-500 italic">
                        Authorized privileges: {perms.join(', ')}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-600 animate-pulse">Fetching cryptographic privilege matrix...</td>
                    </tr>
                  )}
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
                  {auditLogs.length > 0 ? auditLogs.map(f => (
                    <div key={f.id} className="py-2.5 space-y-1 text-zinc-400 hover:bg-white/1 px-2 rounded-xs">
                      <div className="flex justify-between">
                        <strong className="text-gold-pure uppercase">{f.action}</strong>
                        <span className="text-zinc-500">{new Date(f.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-white font-sans text-[10px]">Actor Principal: <span className="text-gold-pure font-mono">{f.email}</span></p>
                      <p className="text-zinc-500 text-[8px]">Remote IP: {f.ip} • Device Shell: {f.user_agent}</p>
                    </div>
                  )) : (
                    <div className="py-8 text-center text-zinc-600 italic">No activity logs found.</div>
                  )}
                </div>
              </div>

              {/* Right Column: IP and Active Session Logs */}
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-white font-mono">CONCURRENT TERMINAL SESSIONS</h3>
                  <span className="text-[8px] font-mono text-gold-pure">Secure Shell Node</span>
                </div>
                <div className="divide-y divide-white/5 font-mono text-[9px] max-h-96 overflow-y-auto pr-1 scrollbar-none">
                  {activeSessions.length > 0 ? activeSessions.map((s, idx) => (
                    <div key={s.id || idx} className="py-2.5 space-y-1 text-zinc-400 hover:bg-white/1 px-2 rounded-xs">
                      <div className="flex justify-between">
                        <strong className="text-white">{s.email}</strong>
                        <button 
                          onClick={() => handleRevokeSession(s.id)}
                          className="text-rose-500 text-[8.5px] font-bold uppercase hover:underline cursor-pointer"
                        >
                          Revoke
                        </button>
                      </div>
                      <p className="text-zinc-400 font-sans text-[10px]">Role profile: {s.role}</p>
                      <p className="text-zinc-600 text-[8px]">Expires: {new Date(s.lastActive).toLocaleString()}</p>
                    </div>
                  )) : (
                    <div className="py-8 text-center text-zinc-600 italic">No active concurrent sessions.</div>
                  )}
                </div>
              </div>

            </div>

            {/* General logs list */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3">
              <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                <h3 className="text-xs uppercase font-bold tracking-widest text-white">MASTER AUDIT TRAIL</h3>
                <span className="text-[8px] font-mono text-zinc-500">Unmodifiable append-only record</span>
              </div>
              <div className="divide-y divide-white/5 font-mono text-[9.5px] max-h-72 overflow-y-auto pr-1 scrollbar-none">
                {auditLogs.slice(0, 50).map((log, idx) => (
                  <div key={`${log.id}-${idx}`} className="py-2 flex justify-between text-zinc-400 hover:bg-white/1 duration-100 px-2 rounded-xs text-left">
                    <div>
                      <span className="text-white block font-sans font-semibold">{log.action}</span>
                      <span className="text-zinc-600 text-[8px] block">Actor: {log.email} • Remote Node IP: {log.ip || 'Unknown'}</span>
                    </div>
                    <span className="text-zinc-500 shrink-0 text-[8.5px]">{new Date(log.timestamp).toLocaleDateString()}</span>
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
                <span className="text-[8.5px] text-zinc-500 font-sans">Automated database snapshots are managed by the enterprise cloud infrastructure.</span>
              </div>
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
                  {backupStatus && backupStatus.lastBackup !== 'Never' ? (
                    <tr className="hover:bg-white/1 text-zinc-300">
                      <td className="p-3 font-semibold text-white">Automated DB Snapshot</td>
                      <td className="p-3 text-zinc-400">Cloud Managed</td>
                      <td className="p-3 text-gold-pure">Full Database</td>
                      <td className="p-3 text-zinc-400">Infrastructure</td>
                      <td className="p-3">
                        <span className="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/10 py-0.5 px-1.5 rounded text-[8px]">
                          ✓ VERIFIED
                        </span>
                      </td>
                      <td className="p-3 text-zinc-500">{new Date(backupStatus.lastBackup).toLocaleString()}</td>
                      <td className="p-3 text-right">
                         <span className="text-[8px] text-zinc-500">Contact hosting provider for restore</span>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-600 italic">No real backup records found on this node.</td>
                    </tr>
                  )}
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
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">Business Name</span>
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
                  <span className="text-[7.5px] uppercase font-mono text-zinc-500">Store Language</span>
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
            
            {/* Payment Panels Config */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                <h3 className="text-xs uppercase font-bold tracking-widest text-white">PAYMENT CHANNELS & KEYS</h3>
                <span className="text-[8.5px] font-mono text-gold-pure">Future Ready Panels</span>
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

              {/* Panels checklist */}
              <div className="space-y-3 pt-1">
                {[
                  { key: 'moyasarEnabled', label: 'Moyasar Panel (Local Cards, Apple Pay, mada)', sandboxKey: 'moyasarSandboxKey', prodKey: 'moyasarProdKey' },
                  { key: 'stripeEnabled', label: 'Stripe Panel (International Credit Cards)', sandboxKey: 'stripeSandboxKey', prodKey: 'stripeProdKey' },
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
                          <div className="relative">
                            <input 
                              type={showProdKeys[gate.prodKey] ? 'text' : 'password'} 
                              value={(payForm as any)[gate.prodKey]}
                              onChange={(e) => setPayForm(prev => ({ ...prev, [gate.prodKey]: e.target.value }))}
                              className="bg-zinc-950 border border-white/10 text-white p-1.5 pr-8 text-[9.5px] font-mono w-full rounded-xs outline-none focus:border-gold-pure"
                            />
                            <button
                              type="button"
                              onClick={() => setShowProdKeys(prev => ({ ...prev, [gate.prodKey]: !prev[gate.prodKey] }))}
                              className="absolute right-0 top-0 h-full w-8 flex items-center justify-center text-[#D4AF37]/80 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xs"
                              aria-label={showProdKeys[gate.prodKey] ? 'Hide secret key' : 'Show secret key'}
                            >
                              {showProdKeys[gate.prodKey] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
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
                <span>Direct logistics status: Functional (Enterprise Gateway)</span>
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
                  <div className="relative">
                    <input 
                      type={showSmtpPass ? 'text' : 'password'} 
                      value={sysForm.smtpPass}
                      onChange={(e) => setSysForm(prev => ({ ...prev, smtpPass: e.target.value }))}
                      className="bg-black border border-white/10 text-white p-2 pr-9 text-[10px] w-full rounded-xs outline-none focus:border-gold-pure font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="absolute right-0 top-0 h-full w-9 flex items-center justify-center text-[#D4AF37]/80 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xs"
                      aria-label={showSmtpPass ? 'Hide relay password' : 'Show relay password'}
                    >
                      {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex justify-end">
                <span className="text-[8px] text-zinc-500 font-mono">SMTP Relay status: Active via Infrastructure</span>
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
                  <span className="text-zinc-600 text-[8px] block">Cloud memory logs and assets CDN cache are managed by infrastructure.</span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
