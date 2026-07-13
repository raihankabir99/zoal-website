import React, { useState, useEffect } from 'react';
import { 
  Users, User, Shield, Ban, Trash2, Edit3, Key, Plus, Search, Filter, 
  Loader2, ClipboardList, Check, X, CheckCircle, AlertCircle, ShieldAlert,
  ArrowUpRight, Clock, MapPin, RefreshCw, CheckCircle2, LogIn, LogOut, Monitor, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'customer' | 'staff' | 'admin' | 'superadmin';
  isVerified: boolean;
  createdAt: string;
  suspended?: boolean;
  permissions?: string[];
}

interface ActivityLogItem {
  id: string;
  userId: string;
  email: string;
  action: string;
  timestamp: string;
  ip: string;
  userAgent: string;
}

interface LoginHistoryItem {
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

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard.view', name: 'Dashboard: View Telemetry', description: 'Access general administration monitoring & metrics.' },
  { id: 'dashboard.manage', name: 'Dashboard: Configuration', description: 'Configure widgets, summaries, and dashboard layouts.' },
  { id: 'users.view', name: 'Users: View Directory', description: 'Inspect enterprise accounts and privilege lists.' },
  { id: 'users.create', name: 'Users: Create Account', description: 'Register and seed administrative & Customer accounts.' },
  { id: 'users.edit', name: 'Users: Edit/Update', description: 'Update profile details, assign roles, and assign permissions.' },
  { id: 'users.delete', name: 'Users: Purge Account', description: 'Permanently remove accounts from enterprise systems.' },
  { id: 'users.suspend', name: 'Users: Suspend Toggle', description: 'Lock and unlock active user sessions & login access.' },
  { id: 'products.view', name: 'Products: View Catalog', description: 'Inspect available boutique luxury items.' },
  { id: 'products.create', name: 'Products: Establish Product', description: 'Establish new catalog options with high-end photography.' },
  { id: 'products.edit', name: 'Products: Update Product', description: 'Modify prices, description, tags, and parameters.' },
  { id: 'products.delete', name: 'Products: Retract Product', description: 'Remove products from the public catalog.' },
  { id: 'categories.manage', name: 'Categories: Collections', description: 'Manage and design luxury catalog collections.' },
  { id: 'orders.view', name: 'Orders: View Log', description: 'Monitor incoming customer boutique transactions.' },
  { id: 'orders.update', name: 'Orders: Update Logistics', description: 'Update delivery progress and order tracking stages.' },
  { id: 'orders.cancel', name: 'Orders: Nullify & Refund', description: 'Cancel active dispatch requests and handle billing refunds.' },
  { id: 'inventory.manage', name: 'Inventory: Stock Ledger', description: 'Adjust inventory quantities and trigger alerts.' },
  { id: 'shipping.manage', name: 'Shipping: Delivery Zones', description: 'Direct logistics carriers, shipping rates, and delivery times.' },
  { id: 'analytics.view', name: 'Analytics: Metrics', description: 'Access corporate business intelligence reports & charts.' },
  { id: 'reports.export', name: 'Reports: Download Ledger', description: 'Export full sales reports to standard analytical systems.' },
  { id: 'marketing.manage', name: 'Marketing: Campaigns', description: 'Establish loyalty multipliers, banners, and circulars.' },
  { id: 'coupons.manage', name: 'Coupons: Promo Codes', description: 'Generate and toggle dynamic luxury discount tokens.' },
  { id: 'loyalty.manage', name: 'Loyalty: Patron Levels', description: 'Manage patron statuses, multipliers, and loyalty points.' },
  { id: 'settings.manage', name: 'Settings: App Globals', description: 'Change global enterprise storefront variables.' },
  { id: 'security.manage', name: 'Security: System Gateways', description: 'Direct configuration of authorization variables.' },
  { id: 'database.manage', name: 'Database: Schema Sync', description: 'Database schema sync, backups, and maintenance.' },
  { id: 'system.logs', name: 'System Logs: Security Streams', description: 'Access backend audit records, logs, and email history logs.' }
];

export default function UserManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'loginHistory'>('users');
  
  // Loading & Error States
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Log Search State
  const [logSearch, setLogSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [resetPwdUser, setResetPwdUser] = useState<UserItem | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
    permissions: [] as string[]
  });
  
  const [newPassword, setNewPassword] = useState('');

  const getAuthToken = () => {
    return localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token') || '';
  };

  // Toast Helper
  const showToast = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      setSuccessMsg(text);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(text);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // API Call: Get All Users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch enterprise roster.');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  // API Call: Get Activity Logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/auth/activity-logs', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch security logs.');
      }
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  // API Call: Get Login History
  const fetchLoginHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/admin/login-history', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch login history registers.');
      }
      const data = await res.json();
      setLoginHistory(data);
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
    fetchLoginHistory();
  }, []);

  // API Call: Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      showToast('error', 'All fields are mandatory.');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to establish user account.');
      }

      showToast('success', `Account ${data.user.email} created successfully!`);
      setCreateModalOpen(false);
      // Reset Form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'staff',
        permissions: []
      });
      fetchUsers();
      fetchLogs(); // refresh activity logs
      fetchLoginHistory();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // API Call: Update User details or status
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          firstName: editUser.firstName,
          lastName: editUser.lastName,
          email: editUser.email,
          phone: editUser.phone,
          role: editUser.role,
          suspended: editUser.suspended,
          permissions: editUser.permissions
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user ledger.');
      }

      showToast('success', 'User ledger updated successfully!');
      setEditUser(null);
      fetchUsers();
      fetchLogs();
      fetchLoginHistory();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // API Call: Toggle Suspension directly
  const handleToggleSuspend = async (user: UserItem) => {
    const nextSuspendedState = !user.suspended;
    const confirmMsg = nextSuspendedState 
      ? `Are you certain you wish to SUSPEND ${user.firstName} ${user.lastName}? They will be immediately locked out.`
      : `Are you certain you wish to RE-ACTIVATE ${user.firstName} ${user.lastName}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ suspended: nextSuspendedState })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to toggle account access.');
      }

      showToast('success', nextSuspendedState ? 'Account suspended successfully!' : 'Account reactivated successfully!');
      fetchUsers();
      fetchLogs();
      fetchLoginHistory();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // API Call: Reset User Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwdUser) return;
    if (!newPassword || newPassword.trim().length < 6) {
      showToast('error', 'Password must contain at least 6 characters.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${resetPwdUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ newPassword: newPassword.trim() })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to reset user password.');
      }

      showToast('success', `Password for ${resetPwdUser.email} has been updated.`);
      setResetPwdUser(null);
      setNewPassword('');
      fetchLogs();
      fetchLoginHistory();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // API Call: Delete User account
  const handleDeleteUser = async (user: UserItem) => {
    if (!window.confirm(`⚠️ DESTRUCTIVE ACTION: Are you absolutely certain you wish to delete account ${user.email} permanently? This is irreversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to purge user.');
      }

      showToast('success', 'User purged from sovereign records.');
      fetchUsers();
      fetchLogs();
      fetchLoginHistory();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Filter & Search users local array
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const phone = user.phone.toLowerCase();
    const term = searchQuery.toLowerCase();
    
    const matchesSearch = fullName.includes(term) || email.includes(term) || phone.includes(term);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'suspended') {
      matchesStatus = !!user.suspended;
    } else if (statusFilter === 'active') {
      matchesStatus = !user.suspended;
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filter logs locally
  const filteredLogs = logs.filter(log => {
    const email = log.email.toLowerCase();
    const action = log.action.toLowerCase();
    const term = logSearch.toLowerCase();
    return email.includes(term) || action.includes(term);
  });

  // Filter login histories locally
  const filteredHistory = loginHistory.filter(item => {
    const term = historySearch.toLowerCase();
    const matchesIp = item.ipAddress.toLowerCase().includes(term);
    const matchesBrowser = item.browser.toLowerCase().includes(term);
    const matchesDevice = item.device.toLowerCase().includes(term);
    const matchesCountry = item.country.toLowerCase().includes(term);
    const matchesStatus = item.status.toLowerCase().includes(term);
    return matchesIp || matchesBrowser || matchesDevice || matchesCountry || matchesStatus;
  });

  // Toggle permission checkbox helper (create form)
  const handlePermissionToggle = (permId: string) => {
    setFormData(prev => {
      const current = prev.permissions;
      if (current.includes(permId)) {
        return { ...prev, permissions: current.filter(p => p !== permId) };
      } else {
        return { ...prev, permissions: [...current, permId] };
      }
    });
  };

  // Toggle permission checkbox helper (edit form)
  const handleEditPermissionToggle = (permId: string) => {
    if (!editUser) return;
    const current = editUser.permissions || [];
    const nextPerms = current.includes(permId)
      ? current.filter(p => p !== permId)
      : [...current, permId];
    
    setEditUser({ ...editUser, permissions: nextPerms });
  };

  return (
    <div className="bg-[#060606] border border-white/5 rounded-sm p-6 space-y-6">
      
      {/* Module Title / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div>
          <h3 className="text-white text-xs font-display uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-[#D4AF37]" /> VI. Enterprise Security & User Management
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1 font-sans">
            Secure administrative control desk to establish roles, toggle suspension, assign permissions, and audit logs
          </p>
        </div>
        
        {/* Toggle between Users list, Activity Logs and Login History */}
        <div className="flex bg-black p-0.5 border border-white/10 rounded-xs self-start md:self-auto font-mono">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1 text-[9px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
              activeTab === 'users' ? 'bg-[#D4AF37] text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Users Directory
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 text-[9px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
              activeTab === 'logs' ? 'bg-[#D4AF37] text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Security Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('loginHistory')}
            className={`px-3 py-1 text-[9px] uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
              activeTab === 'loginHistory' ? 'bg-[#D4AF37] text-black font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Login Audit History
          </button>
        </div>
      </div>

      {/* Success / Error Toast Banners inside the Module */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs rounded-xs flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 bg-rose-950/20 border border-rose-500/20 text-rose-400 text-xs rounded-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW A: USERS DIRECTORY TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Search, Filters and Create Action */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-zinc-950/40 p-3 border border-white/5 rounded-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xs pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40 placeholder-zinc-600"
                />
              </div>

              {/* Role filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-mono shrink-0">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xs px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none font-mono"
                >
                  <option value="all">All Roles</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-mono shrink-0">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xs px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none font-mono"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="p-1.5 bg-black hover:bg-zinc-900 border border-white/10 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white rounded-xs transition-colors cursor-pointer"
                title="Reload Users List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-3 py-1.5 bg-[#D4AF37] hover:bg-white text-black font-semibold text-[10px] uppercase tracking-wider rounded-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Establish Account
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto border border-white/5 rounded-xs bg-[#090909]">
            {loadingUsers && users.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                <span className="text-xs uppercase tracking-widest font-mono">Loading Sovereign Security Directory...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <ShieldAlert className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs uppercase tracking-widest font-mono">No matching records found.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[850px] font-sans">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 font-mono text-[9px] uppercase tracking-wider bg-black/40">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Active Privileges</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions Dashboard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className={`hover:bg-white/[0.01] transition-colors ${u.suspended ? 'opacity-65 bg-red-950/5' : ''}`}>
                      {/* Name / Email */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center uppercase text-[10px] font-semibold shrink-0 ${
                            u.suspended 
                              ? 'bg-rose-950/20 text-rose-500 border-rose-500/25'
                              : u.role === 'superadmin' 
                              ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/35 shadow-[0_0_8px_rgba(212,175,55,0.1)]'
                              : u.role === 'admin'
                              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20'
                              : 'bg-zinc-900 text-zinc-300 border-white/5'
                          }`}>
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-white block uppercase tracking-wide truncate text-[11px]">
                              {u.firstName} {u.lastName}
                            </span>
                            <span className="text-[9.5px] font-mono text-zinc-500 block truncate mt-0.5 leading-none">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Phone / ID */}
                      <td className="py-3.5 px-4">
                        <span className="text-zinc-300 block font-mono text-[10px]">{u.phone}</span>
                        <span className="text-[8px] font-mono text-zinc-600 uppercase block tracking-wider mt-0.5">ID: {u.id}</span>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center text-[8px] px-2 py-0.5 font-mono tracking-widest uppercase rounded-xs border ${
                          u.role === 'superadmin'
                            ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 font-bold'
                            : u.role === 'admin'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : u.role === 'staff'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}>
                          {u.role === 'superadmin' ? 'Super Admin' : u.role}
                        </span>
                      </td>

                      {/* Permissions List */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {u.role === 'superadmin' ? (
                          <span className="text-[9px] text-[#D4AF37] font-mono uppercase tracking-wider font-semibold">Unrestricted Master Access</span>
                        ) : u.role === 'customer' ? (
                          <span className="text-[9px] text-zinc-600 font-mono uppercase">Standard Patron Privileges</span>
                        ) : !u.permissions || u.permissions.length === 0 ? (
                          <span className="text-[9px] text-zinc-500 font-mono italic">No administrative assignments</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {u.permissions.map(p => (
                              <span key={p} className="bg-zinc-900 border border-white/5 text-[7px] px-1 py-0.5 rounded-xs font-mono uppercase text-zinc-400">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${u.suspended ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span className={`text-[9px] font-mono uppercase tracking-wider font-semibold ${u.suspended ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {u.suspended ? 'Suspended' : 'Active'}
                          </span>
                        </div>
                      </td>

                      {/* Action Menu */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Suspend / Lift Suspension */}
                          {u.role !== 'superadmin' && (
                            <button
                              onClick={() => handleToggleSuspend(u)}
                              className={`p-1.5 border rounded-xs transition-colors cursor-pointer ${
                                u.suspended
                                  ? 'bg-emerald-950/10 hover:bg-emerald-950/30 border-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-950/10 hover:bg-rose-950/30 border-rose-500/20 text-rose-400'
                              }`}
                              title={u.suspended ? 'Lift Account Suspension' : 'Suspend Account'}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Reset Password */}
                          <button
                            onClick={() => { setResetPwdUser(u); setNewPassword(''); }}
                            className="p-1.5 bg-black hover:bg-zinc-900 border border-white/10 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-[#D4AF37] rounded-xs transition-colors cursor-pointer"
                            title="Reset User Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit User details */}
                          <button
                            onClick={() => setEditUser({ ...u })}
                            className="p-1.5 bg-black hover:bg-zinc-900 border border-white/10 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400 rounded-xs transition-colors cursor-pointer"
                            title="Edit Account Credentials"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Account */}
                          {u.role !== 'superadmin' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 bg-black hover:bg-rose-950/20 border border-white/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-500 rounded-xs transition-colors cursor-pointer"
                              title="Delete Account Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* VIEW B: SECURITY AUDIT LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          
          {/* Logs search bar */}
          <div className="flex items-center justify-between gap-4 bg-zinc-950/40 p-3 border border-white/5 rounded-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit logs by email or action..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xs pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40 placeholder-zinc-600 font-sans"
              />
            </div>
            
            <button
              onClick={fetchLogs}
              disabled={loadingLogs}
              className="p-1.5 bg-black hover:bg-zinc-900 border border-white/10 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-mono shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>Refresh Registry</span>
            </button>
          </div>

          {/* Logs Chronology List */}
          <div className="overflow-x-auto border border-white/5 rounded-xs bg-[#090909] max-h-[500px] overflow-y-auto">
            {loadingLogs && logs.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                <span className="text-xs uppercase tracking-widest font-mono">Retrieving security registers...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <ClipboardList className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs uppercase tracking-widest font-mono">Security log is currently vacant.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[800px] font-mono">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 text-[8.5px] uppercase tracking-wider bg-black/40 sticky top-0 z-10">
                    <th className="py-3 px-4 w-[20%]">Timestamp</th>
                    <th className="py-3 px-4 w-[25%]">Actor Profile</th>
                    <th className="py-3 px-4 w-[35%]">Action Executed</th>
                    <th className="py-3 px-4 w-[10%]">IP Host</th>
                    <th className="py-3 px-4 w-[10%] text-right">System ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-2.5 px-4 text-zinc-500 text-[10px]">
                        {new Date(l.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-300 text-[10.5px]">
                        {l.email}
                      </td>
                      <td className="py-2.5 px-4 text-[10.5px]">
                        <span className={`px-1.5 py-0.5 rounded-xs ${
                          l.action.includes('USER_CREATED') 
                            ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/10' 
                            : l.action.includes('USER_DELETED') || l.action.includes('SUSPEND')
                            ? 'bg-rose-950/20 text-rose-400 border border-rose-500/10'
                            : l.action.includes('PASSWORD_RESET') || l.action.includes('RESET')
                            ? 'bg-blue-950/20 text-blue-400 border border-blue-500/10'
                            : 'text-zinc-300'
                        }`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-500 text-[10px]">
                        {l.ip}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-600 text-[9px] text-right">
                        {l.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* VIEW C: LOGIN HISTORY AUDIT TAB */}
      {activeTab === 'loginHistory' && (
        <div className="space-y-4">
          
          {/* History search bar */}
          <div className="flex items-center justify-between gap-4 bg-zinc-950/40 p-3 border border-white/5 rounded-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search login history by IP, browser, country, or status..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xs pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40 placeholder-zinc-600 font-sans"
              />
            </div>
            
            <button
              onClick={fetchLoginHistory}
              disabled={loadingHistory}
              className="p-1.5 bg-black hover:bg-zinc-900 border border-white/10 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-mono shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              <span>Refresh History</span>
            </button>
          </div>

          {/* Login History Chronology List */}
          <div className="overflow-x-auto border border-white/5 rounded-xs bg-[#090909] max-h-[500px] overflow-y-auto">
            {loadingHistory && loginHistory.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                <span className="text-xs uppercase tracking-widest font-mono">Retrieving login history registers...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <ClipboardList className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs uppercase tracking-widest font-mono">Login history ledger is vacant.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[850px] font-mono">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 text-[8.5px] uppercase tracking-wider bg-black/40 sticky top-0 z-10">
                    <th className="py-3 px-4">Login Timestamp</th>
                    <th className="py-3 px-4">User Identification</th>
                    <th className="py-3 px-4">Client Environment</th>
                    <th className="py-3 px-4">Network Node (IP)</th>
                    <th className="py-3 px-4">Logout Timestamp</th>
                    <th className="py-3 px-4 text-right">Access Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-2.5 px-4 text-zinc-500 text-[10px]">
                        {new Date(item.loginAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-300 text-[10.5px]">
                        {item.userId}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-400 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <Monitor className="w-3 h-3 text-[#D4AF37]/60" />
                          <span>{item.device} ({item.browser})</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-400 text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-zinc-600" />
                          <span>{item.ipAddress} [{item.country}]</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-500 text-[10px]">
                        {item.logoutAt ? new Date(item.logoutAt).toLocaleString() : (
                          <span className="text-emerald-500/80 font-mono text-[9px] uppercase tracking-widest flex items-center gap-1">
                            ● Active Session
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[8.5px] uppercase tracking-widest font-mono ${
                          item.status === 'success'
                            ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/10'
                            : 'bg-rose-950/20 text-rose-400 border border-rose-500/10'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE ENTERPRISE USER ACCOUNT */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 border border-white/10 p-6 rounded-sm max-w-lg w-full text-left space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)]"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-white text-xs font-display uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#D4AF37]" /> Establish Sovereign Account
              </h4>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">First Name:</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="First Name"
                    className="w-full bg-black border border-white/10 rounded-xs p-2 text-white focus:outline-none focus:border-[#D4AF37]/35"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">Last Name:</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Last Name"
                    className="w-full bg-black border border-white/10 rounded-xs p-2 text-white focus:outline-none focus:border-[#D4AF37]/35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">Email Address:</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@alzoal.com"
                    className="w-full bg-black border border-white/10 rounded-xs p-2 text-white focus:outline-none focus:border-[#D4AF37]/35"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">Sovereign Phone:</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+966 50 000 0000"
                    className="w-full bg-black border border-white/10 rounded-xs p-2 text-white focus:outline-none focus:border-[#D4AF37]/35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">Sovereign Password:</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 6 chars"
                    className="w-full bg-black border border-white/10 rounded-xs p-2 text-white focus:outline-none focus:border-[#D4AF37]/35"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">Enterprise Role:</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xs p-2 text-zinc-300 focus:outline-none"
                  >
                    <option value="staff">Staff (Artisan / Lounge Curator)</option>
                    <option value="admin">Admin (Sovereign Operations Desk)</option>
                  </select>
                </div>
              </div>

              {/* Assign Permissions checklist */}
              <div className="space-y-2 border-t border-white/5 pt-3">
                <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">Assign Granular Privileges:</label>
                <div className="grid grid-cols-1 gap-2">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <label key={perm.id} className="flex items-start gap-2.5 p-2 bg-black border border-white/5 hover:border-white/10 rounded-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => handlePermissionToggle(perm.id)}
                        className="mt-0.5 accent-[#D4AF37]"
                      />
                      <div className="text-left">
                        <p className="text-[10px] text-white font-medium font-mono uppercase tracking-wide leading-none">{perm.name}</p>
                        <p className="text-[8.5px] text-zinc-500 font-sans mt-0.5 leading-tight">{perm.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-[10px] uppercase tracking-wider rounded-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-white text-black font-bold text-[10px] uppercase tracking-wider rounded-xs cursor-pointer"
                >
                  Establish Account
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: EDIT USER DETAILS & PERMISSIONS */}
      {editUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 border border-white/10 p-6 rounded-sm max-w-lg w-full text-left space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)]"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-white text-xs font-display uppercase tracking-widest flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-emerald-400" /> Edit User Credentials
              </h4>
              <button 
                onClick={() => setEditUser(null)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">First Name:</label>
                  <input
                    type="text"
                    required
                    value={editUser.firstName}
                    onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xs p-2 text-white focus:outline-none focus:border-[#D4AF37]/35"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">Last Name:</label>
                  <input
                    type="text"
                    required
                    value={editUser.lastName}
                    onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xs p-2 text-white focus:outline-none focus:border-[#D4AF37]/35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">Email Address:</label>
                  <input
                    type="email"
                    required
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xs p-2 text-white focus:outline-none focus:border-[#D4AF37]/35"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">Sovereign Phone:</label>
                  <input
                    type="text"
                    required
                    value={editUser.phone}
                    onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xs p-2 text-white focus:outline-none focus:border-[#D4AF37]/35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">Enterprise Role:</label>
                  {editUser.role === 'superadmin' ? (
                    <input
                      type="text"
                      disabled
                      value="Super Admin (Fixed)"
                      className="w-full bg-black/40 border border-white/5 rounded-xs p-2 text-zinc-500 font-mono"
                    />
                  ) : (
                    <select
                      value={editUser.role}
                      onChange={(e) => setEditUser({ ...editUser, role: e.target.value as any })}
                      className="w-full bg-black border border-white/10 rounded-xs p-2 text-zinc-300 focus:outline-none"
                    >
                      <option value="customer">Customer (Patron)</option>
                      <option value="staff">Staff (Artisan / Lounge Curator)</option>
                      <option value="admin">Admin (Sovereign Operations Desk)</option>
                    </select>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">Access Status:</label>
                  {editUser.role === 'superadmin' ? (
                    <input
                      type="text"
                      disabled
                      value="Unrestricted Active"
                      className="w-full bg-black/40 border border-white/5 rounded-xs p-2 text-emerald-500 font-mono"
                    />
                  ) : (
                    <select
                      value={editUser.suspended ? 'suspended' : 'active'}
                      onChange={(e) => setEditUser({ ...editUser, suspended: e.target.value === 'suspended' })}
                      className="w-full bg-black border border-white/10 rounded-xs p-2 text-zinc-300 focus:outline-none"
                    >
                      <option value="active">Active (Access Allowed)</option>
                      <option value="suspended">Suspended (Locked Out)</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Edit Permissions checklist */}
              {editUser.role !== 'superadmin' && editUser.role !== 'customer' && (
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">Assign Granular Privileges:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <label key={perm.id} className="flex items-start gap-2.5 p-2 bg-black border border-white/5 hover:border-white/10 rounded-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={(editUser.permissions || []).includes(perm.id)}
                          onChange={() => handleEditPermissionToggle(perm.id)}
                          className="mt-0.5 accent-emerald-500"
                        />
                        <div className="text-left">
                          <p className="text-[10px] text-white font-medium font-mono uppercase tracking-wide leading-none">{perm.name}</p>
                          <p className="text-[8.5px] text-zinc-500 font-sans mt-0.5 leading-tight">{perm.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-[10px] uppercase tracking-wider rounded-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-xs cursor-pointer"
                >
                  Save Modifications
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: RESET USER PASSWORD */}
      {resetPwdUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 border border-white/10 p-6 rounded-sm max-w-sm w-full text-left space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.95)]"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-white text-xs font-display uppercase tracking-widest flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#D4AF37]" /> Reset Passcode
              </h4>
              <button 
                onClick={() => setResetPwdUser(null)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <p className="text-zinc-400 text-xs">
              Altering login credentials for account: <strong className="text-[#D4AF37] font-mono">{resetPwdUser.email}</strong>
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">New Safe Password:</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-white focus:outline-none focus:border-[#D4AF37]/35"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => setResetPwdUser(null)}
                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-[10px] uppercase tracking-wider rounded-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#D4AF37] hover:bg-white text-black font-bold text-[10px] uppercase tracking-wider rounded-xs cursor-pointer"
                >
                  Override Password
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
