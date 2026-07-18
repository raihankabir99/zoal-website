import React, { useState } from 'react';
import { 
  Zap, Calendar, Mail, MessageSquare, ShieldAlert, Database, BarChart3, 
  Settings, Play, CheckCircle, XCircle, Clock, Search, Filter, RefreshCw, 
  Download, FileText, FileSpreadsheet, Eye, ArrowUpRight, ToggleLeft, ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface BusinessAutomationCenterProps {
  orders: any[];
  addLog: (action: string, target?: string) => void;
  currentUser: any;
}

export default function BusinessAutomationCenter({ orders, addLog, currentUser }: BusinessAutomationCenterProps) {
  const [activeTab, setActiveTab] = useState<'triggers' | 'email_whatsapp' | 'reports_backup' | 'logs'>('triggers');
  const [searchLogQuery, setSearchLogQuery] = useState<string>('');
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all');
  
  // Automation settings state (initialized with professional defaults)
  const [settings, setSettings] = useState({
    // Order
    autoInvoice: true,
    autoPdf: true,
    autoVat: true,
    autoShippingLabel: true,
    autoOrderConf: true,
    autoStatusNotif: true,
    autoRefundNotif: true,
    // Email
    emailOrderConf: true,
    emailShipping: true,
    emailDelivery: true,
    emailWelcome: true,
    emailPasswordReset: true,
    emailPromotions: false,
    emailAbandonedCart: true,
    abandonedCartDelayHours: 4,
    // WhatsApp
    waOrderConf: true,
    waTracking: true,
    waShipping: true,
    waDelivery: true,
    waPromotions: false,
    waCustomerFollowup: true,
    // Report Scheduling
    reportDaily: true,
    reportWeekly: true,
    reportMonthly: true,
    reportRevenue: true,
    reportInventory: true,
    reportTime: '08:00',
    reportRecipients: 'executive-team@alzoal.com',
    // Inventory
    lowStockAlerts: true,
    lowStockThreshold: 5,
    outOfStockAlerts: true,
    reorderSuggestions: true,
    supplierNotifications: true,
    // Backup Scheduling
    autoDbBackup: true,
    autoMediaBackup: true,
    backupSchedule: 'daily', // daily, weekly
    backupVerification: true,
    restorePointsEnabled: true
  });

  // Local execution logs state
  const [executionLogs, setExecutionLogs] = useState<any[]>([
    { id: 'ex-101', action: 'VAT PDF Invoice Generated', target: 'Order #ZL-9431', channel: 'PDF Engine', status: 'Success', details: 'Generated VAT invoice for 1,250.00 SAR with 15% VAT (187.50 SAR). Saved in private secure storage bucket.', time: '2026-07-16 11:45' },
    { id: 'ex-102', action: 'Direct Mail Confirmation Sent', target: 'patron-vip@saudi.com', channel: 'SMTP Relay', status: 'Success', details: 'Dispatched elegant confirmation HTML template with secure SSL via smtp.zoal.com.', time: '2026-07-16 11:45' },
    { id: 'ex-103', action: 'WhatsApp Tracking Dispatch', target: '+966 56 769 9315', channel: 'WhatsApp API', status: 'Success', details: 'Dispatched shipping tracking link for Courier overnight transport.', time: '2026-07-16 10:20' },
    { id: 'ex-104', action: 'Low Stock Supplier Alert', target: 'Kordofan Premium Co-Op', channel: 'SMS & Email', status: 'Success', details: 'Auto low stock alert triggered: Traditional Karkadeh dropped to 4 bags. Suggested PO: 50kg.', time: '2026-07-16 08:02' },
    { id: 'ex-105', action: 'Daily Executive Digest PDF', target: 'executive-team@alzoal.com', channel: 'Auto Report', status: 'Success', details: 'Generated revenue trends, branch performance, and master inventory audits.', time: '2026-07-16 08:00' },
    { id: 'ex-106', action: 'Sovereign Database Backup', target: 'Supabase Replication Node', channel: 'Cloud DB', status: 'Success', details: 'Automated 12:00 AM backup point verified successfully. MD5 Hash verified. Compression: 92%.', time: '2026-07-16 00:00' },
    { id: 'ex-107', action: 'Abandoned Cart Rescue', target: 'client-guest@khobar.sa', channel: 'SMTP Relay', status: 'Failed', details: 'Patron unsubscribed from marketing emails. Bypassed delivery rule.', time: '2026-07-15 18:30' },
    { id: 'ex-108', action: 'Automatic Shipping Label Generated', target: 'Order #ZL-9382', channel: 'Courier Label API', status: 'Pending', details: 'Awaiting shipping zone validation from Moyasar checkout gateway.', time: '2026-07-15 16:15' }
  ]);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    addLog(`Toggled Automation configuration: ${String(key)}`, "Automation Center");
  };

  const handleManualTrigger = (actionType: string) => {
    addLog(`Manually dispatched trigger: ${actionType}`, "Automation Center");
    
    // Add success log
    const newLog = {
      id: `ex-${Date.now()}`,
      action: `Manual ${actionType}`,
      target: 'Administrative Forced Request',
      channel: 'Console Bypass',
      status: 'Success',
      details: `Execution forced by administrator ${currentUser?.name}. Successfully queued, validated, and processed.`,
      time: new Date().toLocaleString()
    };
    
    setExecutionLogs(prev => [newLog, ...prev]);
    alert(`Success: ${actionType} triggered immediately. Telemetry logged in system.`);
  };

  const handleSaveConfig = () => {
    localStorage.setItem('zoal_automation_settings', JSON.stringify(settings));
    addLog("Saved entire business automation and scheduler settings", "Automation Center");
    alert("Grand Sovereign Automation suite configurations written to persistent system parameters!");
  };

  // Filtered execution logs
  const filteredLogs = executionLogs.filter(log => {
    const matchQuery = log.action.toLowerCase().includes(searchLogQuery.toLowerCase()) || 
                       log.target.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
                       log.details.toLowerCase().includes(searchLogQuery.toLowerCase());
    const matchStatus = logStatusFilter === 'all' || log.status.toLowerCase() === logStatusFilter.toLowerCase();
    return matchQuery && matchStatus;
  });

  // Recharts success data
  const statData = [
    { name: '08:00', success: 42, failed: 0 },
    { name: '10:00', success: 68, failed: 1 },
    { name: '12:00', success: 124, failed: 2 },
    { name: '14:00', success: 98, failed: 0 },
    { name: '16:00', success: 110, failed: 1 },
    { name: '18:00', success: 132, failed: 0 },
    { name: '20:00', success: 154, failed: 1 }
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans">
      
      {/* Page Header */}
      <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">SOVEREIGN WORKFLOW SCHEDULER</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">ENTERPRISE AUTOMATION HUB</h2>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button 
            onClick={handleSaveConfig}
            className="py-1.5 px-4 bg-gold-pure text-black hover:bg-white text-[9.5px] uppercase font-bold tracking-widest rounded-xs transition-all cursor-pointer shadow-lg"
          >
            Save Automation Settings
          </button>
        </div>
      </div>

      {/* Stats block and health dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { title: 'Trigger Success Rate', value: '99.2%', subtitle: '624 actions executed today', icon: CheckCircle, color: 'text-emerald-400' },
          { title: 'Active Schedules', value: '14 Tasks', subtitle: 'Automatic backup & reports active', icon: Clock, color: 'text-gold-pure' },
          { title: 'Queue Load', value: '0 Pending', subtitle: 'Normal system bandwidth', icon: Zap, color: 'text-white' },
          { title: 'Failover Status', value: 'RESTORE OK', subtitle: 'Daily points verified', icon: ShieldAlert, color: 'text-emerald-500' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-zinc-950 border border-white/5 p-4 rounded-xs text-left relative overflow-hidden flex items-center justify-between">
              <div>
                <span className="text-[8px] tracking-widest uppercase text-zinc-500 font-mono block mb-1">{card.title}</span>
                <div className={`text-xl font-bold font-display ${card.color}`}>{card.value}</div>
                <span className="text-[9px] text-zinc-400 block mt-1 leading-tight">{card.subtitle}</span>
              </div>
              <Icon className="w-8 h-8 text-white/5 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          );
        })}
      </div>

      {/* Sub tabs navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
        {[
          { id: 'triggers', name: 'Order & Inventory triggers', icon: Zap },
          { id: 'email_whatsapp', name: 'Email & WhatsApp Outbound', icon: MessageSquare },
          { id: 'reports_backup', name: 'Schedules & Backups', icon: Calendar },
          { id: 'logs', name: 'Execution logs & Queue', icon: FileText }
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
        
        {/* TAB 1: ORDER & INVENTORY TRIGGERS */}
        {activeTab === 'triggers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            {/* Left Block: Order Automation */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                <h3 className="text-xs uppercase font-bold tracking-widest text-white">ORDER TRIGGER PIPELINE</h3>
                <span className="text-[8px] font-mono text-gold-pure">Auto Processing</span>
              </div>
              
              <div className="space-y-4">
                {[
                  { key: 'autoInvoice', title: 'Automatic Invoice Generation', subtitle: 'Immediately generate a verified invoice upon patron checkout checkout.' },
                  { key: 'autoPdf', title: 'Automatic PDF Invoice Creation', subtitle: 'Convert core ledger invoices to high-fidelity printing formats.' },
                  { key: 'autoVat', title: 'Automatic Saudi VAT Inclusion', subtitle: 'Calculate and affix 15% VAT, commercial registration, and QR schema.' },
                  { key: 'autoShippingLabel', title: 'Automatic Shipping Label Generation', subtitle: 'Compile weights, addresses, and delivery sector markers into courier labels.' },
                  { key: 'autoOrderConf', title: 'Automatic Order Confirmation triggers', subtitle: 'Initiate processing rules and locking systems on newly submitted carts.' },
                  { key: 'autoRefundNotif', title: 'Automatic Refund & Cancellation logs', subtitle: 'Verify, sync logs, and trigger bank relay gateways upon returns.' }
                ].map((item) => (
                  <div key={item.key} className="flex justify-between items-center p-3 bg-black/40 border border-white/5 hover:border-white/10 rounded-xs transition-all">
                    <div className="space-y-0.5 max-w-sm">
                      <strong className="text-white text-[10px] uppercase tracking-wider block">{item.title}</strong>
                      <span className="text-zinc-500 text-[8.5px] block font-sans">{item.subtitle}</span>
                    </div>
                    <button 
                      onClick={() => toggleSetting(item.key as any)}
                      className="cursor-pointer text-zinc-300 hover:text-white transition-all outline-none"
                    >
                      {settings[item.key as keyof typeof settings] ? <ToggleRight className="w-8 h-8 text-gold-pure" /> : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Block: Inventory Automation */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-white">INVENTORY TRIGGER PIPELINE</h3>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'lowStockAlerts', title: 'Automatic Low Stock Alerts', subtitle: 'Notify admin and concierge staff when a product inventory drops below limits.' },
                    { key: 'outOfStockAlerts', title: 'Automatic Out of Stock Warnings', subtitle: 'Immediately tag product as Draft/Hidden or Backorder upon zero stock.' },
                    { key: 'reorderSuggestions', title: 'Automatic Reorder Suggestions', subtitle: 'Leverage historic sales velocity data to suggest replenishments.' },
                    { key: 'supplierNotifications', title: 'Automatic Supplier Notifications', subtitle: 'Directly dispatch Purchase Order requests to partner Co-Ops.' }
                  ].map((item) => (
                    <div key={item.key} className="flex justify-between items-center p-3 bg-black/40 border border-white/5 hover:border-white/10 rounded-xs transition-all">
                      <div className="space-y-0.5 max-w-xs">
                        <strong className="text-white text-[10px] uppercase tracking-wider block">{item.title}</strong>
                        <span className="text-zinc-500 text-[8.5px] block font-sans">{item.subtitle}</span>
                      </div>
                      <button 
                        onClick={() => toggleSetting(item.key as any)}
                        className="cursor-pointer text-zinc-300 hover:text-white transition-all outline-none"
                      >
                        {settings[item.key as keyof typeof settings] ? <ToggleRight className="w-8 h-8 text-gold-pure" /> : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Additional controls */}
                <div className="p-4 bg-black border border-white/5 rounded-xs space-y-3">
                  <span className="text-[8.5px] text-zinc-500 uppercase font-mono block">Threshold Configuration</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[7.5px] text-zinc-600 uppercase block font-mono">Critical Low Stock Threshold</span>
                      <input 
                        type="number"
                        value={settings.lowStockThreshold}
                        onChange={(e) => setSettings(prev => ({ ...prev, lowStockThreshold: Number(e.target.value) }))}
                        className="bg-zinc-950 w-full border border-white/10 text-white p-1.5 text-[10px] rounded-xs font-mono outline-none focus:border-gold-pure"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[7.5px] text-zinc-600 uppercase block font-mono">Auto Reorder Safety Margin</span>
                      <div className="bg-zinc-950 border border-white/10 p-1.5 text-[10px] rounded-xs text-zinc-400 font-mono text-center">
                        +20% Buffer
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Force trigger button */}
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => handleManualTrigger('Full Inventory Audit')}
                  className="w-full py-2 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white transition-all font-bold uppercase tracking-widest text-[9px] rounded-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-gold-pure animate-spin-slow" /> Force Synchronous Inventory Audit Sync
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: EMAIL & WHATSAPP OUTBOUND */}
        {activeTab === 'email_whatsapp' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            {/* SMTP Mail Relay block */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className="text-xs uppercase font-bold tracking-widest text-white">SMTP EMAIL AUTOMATION</h3>
              </div>
              
              <div className="space-y-3.5">
                {[
                  { key: 'emailOrderConf', title: 'Order Confirmation Email', sub: 'Dispatched on secure payment completion.' },
                  { key: 'emailShipping', title: 'Shipping & Waybill Updates', sub: 'Triggered when Courier tracks dispatch.' },
                  { key: 'emailDelivery', title: 'Delivery & Receipt Confirmation', sub: 'Triggered upon successful handoff.' },
                  { key: 'emailWelcome', title: 'Patron Welcome Letter', sub: 'Sent on verified account activation.' },
                  { key: 'emailPasswordReset', title: 'Password Reset Requests', sub: 'Cryptographic challenge link relay.' },
                  { key: 'emailAbandonedCart', title: 'Abandoned Cart Rescue Campaigns', sub: 'Auto-retarget uncompleted VIP carts.' }
                ].map((item) => (
                  <div key={item.key} className="flex justify-between items-center p-2.5 bg-black/40 border border-white/5 hover:border-white/10 rounded-xs transition-all">
                    <div className="space-y-0.5">
                      <strong className="text-white text-[9.5px] uppercase tracking-wider block">{item.title}</strong>
                      <span className="text-zinc-500 text-[8px] block font-sans">{item.sub}</span>
                    </div>
                    <button 
                      onClick={() => toggleSetting(item.key as any)}
                      className="cursor-pointer text-zinc-300 hover:text-white transition-all outline-none"
                    >
                      {settings[item.key as keyof typeof settings] ? <ToggleRight className="w-8 h-8 text-gold-pure" /> : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp Outbound API block */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-white">WHATSAPP CLOUD API AUTOMATION</h3>
                </div>

                <div className="space-y-3.5">
                  {[
                    { key: 'waOrderConf', title: 'WhatsApp Order Confirmation', sub: 'Instant transactional billing details and receipt link.' },
                    { key: 'waTracking', title: 'WhatsApp Live Tracking URL', sub: 'Direct integration with local Courier systems.' },
                    { key: 'waShipping', title: 'WhatsApp Transit dispatch alerts', sub: 'Real time updates during regional routing.' },
                    { key: 'waDelivery', title: 'WhatsApp Hand-over completions', sub: 'Dispatched to coordinate local courier drops.' },
                    { key: 'waCustomerFollowup', title: 'Post-Purchase Feedback Followup', sub: 'Bespoke follow-up sent 3 days post-delivery.' }
                  ].map((item) => (
                    <div key={item.key} className="flex justify-between items-center p-2.5 bg-black/40 border border-white/5 hover:border-white/10 rounded-xs transition-all">
                      <div className="space-y-0.5 max-w-xs">
                        <strong className="text-white text-[9.5px] uppercase tracking-wider block">{item.title}</strong>
                        <span className="text-zinc-500 text-[8px] block font-sans">{item.sub}</span>
                      </div>
                      <button 
                        onClick={() => toggleSetting(item.key as any)}
                        className="cursor-pointer text-zinc-300 hover:text-white transition-all outline-none"
                      >
                        {settings[item.key as keyof typeof settings] ? <ToggleRight className="w-8 h-8 text-gold-pure" /> : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Broadcast testing */}
              <div className="pt-4 border-t border-white/5 flex gap-2">
                <button
                  onClick={() => handleManualTrigger('Promotional Email Broadcast')}
                  className="flex-1 py-1.5 bg-zinc-900 border border-white/10 hover:border-gold-pure rounded-xs text-[8.5px] font-bold uppercase tracking-wider text-white"
                >
                  Test Email Broadcast
                </button>
                <button
                  onClick={() => handleManualTrigger('VIP WhatsApp Followup Broadcast')}
                  className="flex-1 py-1.5 bg-zinc-900 border border-white/10 hover:border-gold-pure rounded-xs text-[8.5px] font-bold uppercase tracking-wider text-white"
                >
                  Test WhatsApp Broadcast
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: SCHEDULES, REPORTS & BACKUPS */}
        {activeTab === 'reports_backup' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            {/* Automatic Reporting Scheduling */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className="text-xs uppercase font-bold tracking-widest text-white">REPORTS & ANALYTICS SCHEDULING</h3>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'reportDaily', title: 'Daily Automated Reports', sub: 'Compile revenue charts and stock levels every morning.' },
                  { key: 'reportWeekly', title: 'Weekly Trend Analysis', sub: 'Compare MoM customer acquisition and branch velocities.' },
                  { key: 'reportMonthly', title: 'Monthly Executive Audits', sub: 'Generate VAT totals, COGS summaries, and ledger files.' },
                  { key: 'reportRevenue', title: 'Automated Revenue Forecasts', sub: 'Smart projections mapped onto future billing cycles.' },
                  { key: 'reportInventory', title: 'Daily Low Stock Digest', sub: 'Direct reorder sheets sent to administrative desks.' }
                ].map((item) => (
                  <div key={item.key} className="flex justify-between items-center p-2.5 bg-black/40 border border-white/5 hover:border-white/10 rounded-xs transition-all">
                    <div className="space-y-0.5">
                      <strong className="text-white text-[9.5px] uppercase tracking-wider block">{item.title}</strong>
                      <span className="text-zinc-500 text-[8px] block font-sans">{item.sub}</span>
                    </div>
                    <button 
                      onClick={() => toggleSetting(item.key as any)}
                      className="cursor-pointer text-zinc-300 hover:text-white transition-all outline-none"
                    >
                      {settings[item.key as keyof typeof settings] ? <ToggleRight className="w-8 h-8 text-gold-pure" /> : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Report Recipients Config */}
              <div className="p-3 bg-black border border-white/5 rounded-xs space-y-2.5">
                <span className="text-[8px] text-zinc-500 uppercase font-mono block">Scheduling parameters</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-zinc-600 uppercase block font-mono">Report Dispatch Time</span>
                    <input 
                      type="time" 
                      value={settings.reportTime}
                      onChange={(e) => setSettings(prev => ({ ...prev, reportTime: e.target.value }))}
                      className="bg-zinc-950 w-full border border-white/10 text-white p-1.5 text-[10.5px] font-mono rounded-xs outline-none focus:border-gold-pure"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-zinc-600 uppercase block font-mono">Recipient Email Relay</span>
                    <input 
                      type="text" 
                      value={settings.reportRecipients}
                      onChange={(e) => setSettings(prev => ({ ...prev, reportRecipients: e.target.value }))}
                      className="bg-zinc-950 w-full border border-white/10 text-white p-1.5 text-[10px] font-mono rounded-xs outline-none focus:border-gold-pure"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Backup Scheduling */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-white">AUTOMATED CLOUD BACKUP</h3>
                </div>

                <div className="space-y-3.5">
                  {[
                    { key: 'autoDbBackup', title: 'Automatic Database Backup replication', sub: 'Generate encrypted dump of Supabase metadata and master tables.' },
                    { key: 'autoMediaBackup', title: 'Automatic Media Assets Backup sync', sub: 'Replicate files, banners, and blog images to alternative storage zones.' },
                    { key: 'backupVerification', title: 'Backup Verification Checksums', sub: 'Validate file sizes and MD5 hashes automatically post-backup.' },
                    { key: 'restorePointsEnabled', title: 'Staged Restore Points generation', sub: 'Enable rolling logs rollback within 30-day timelines.' }
                  ].map((item) => (
                    <div key={item.key} className="flex justify-between items-center p-2.5 bg-black/40 border border-white/5 hover:border-white/10 rounded-xs transition-all">
                      <div className="space-y-0.5 max-w-xs">
                        <strong className="text-white text-[9.5px] uppercase tracking-wider block">{item.title}</strong>
                        <span className="text-zinc-500 text-[8px] block font-sans">{item.sub}</span>
                      </div>
                      <button 
                        onClick={() => toggleSetting(item.key as any)}
                        className="cursor-pointer text-zinc-300 hover:text-white transition-all outline-none"
                      >
                        {settings[item.key as keyof typeof settings] ? <ToggleRight className="w-8 h-8 text-gold-pure" /> : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1.5">
                  <span className="text-[8px] text-zinc-500 uppercase font-mono block">Backup Frequency Mode</span>
                  <select 
                    value={settings.backupSchedule}
                    onChange={(e) => setSettings(prev => ({ ...prev, backupSchedule: e.target.value }))}
                    className="bg-zinc-950 w-full border border-white/10 text-white p-2 text-[10.5px] rounded-xs outline-none focus:border-gold-pure"
                  >
                    <option value="hourly">Hourly Transaction Logging (High Traffic)</option>
                    <option value="daily">Daily Master Replication (Recommended)</option>
                    <option value="weekly">Weekly Historical Archives (Cold Storage)</option>
                  </select>
                </div>
              </div>

              {/* Backup Trigger */}
              <div className="pt-4 border-t border-white/5 flex gap-2">
                <button
                  onClick={() => handleManualTrigger('Full Database Dump')}
                  className="flex-1 py-1.5 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white text-[9px] font-bold uppercase tracking-widest rounded-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5 text-gold-pure" /> Dump Database
                </button>
                <button
                  onClick={() => handleManualTrigger('Media Assets Replication')}
                  className="flex-1 py-1.5 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white text-[9px] font-bold uppercase tracking-widest rounded-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin-slow" /> Replicate Media
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: EXECUTION LOGS & QUEUE */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            
            {/* Log filter bar */}
            <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={searchLogQuery}
                  onChange={(e) => setSearchLogQuery(e.target.value)}
                  placeholder="Search execution events, targets, channels..."
                  className="bg-black w-full border border-white/10 text-white pl-9 pr-3 py-1.5 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <select 
                  value={logStatusFilter}
                  onChange={(e) => setLogStatusFilter(e.target.value)}
                  className="bg-black border border-white/10 text-white py-1.5 px-3 text-[10px] rounded-xs outline-none focus:border-gold-pure font-mono w-full md:w-auto"
                >
                  <option value="all">ALL STATUSES</option>
                  <option value="success">SUCCESS ONLY</option>
                  <option value="pending">PENDING ONLY</option>
                  <option value="failed">FAILED ONLY</option>
                </select>

                <button 
                  onClick={() => {
                    setExecutionLogs([
                      { id: `ex-${Date.now()}`, action: 'Execution Queue Purged', target: 'Task Queue Scheduler', channel: 'Cache Engine', status: 'Success', details: 'Wiped execution history except current live transaction loops.', time: 'Now' }
                    ]);
                    addLog("Cleared business automation queue history logs", "Automation Center");
                  }}
                  className="py-1.5 px-3 bg-zinc-900 border border-zinc-800 text-rose-500 hover:text-white hover:bg-rose-950 text-[9px] font-bold font-mono uppercase tracking-wider rounded-xs cursor-pointer text-center shrink-0"
                >
                  Flush Logs
                </button>
              </div>
            </div>

            {/* Table block */}
            <div className="bg-zinc-950 border border-white/5 rounded-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-black/40 text-[8.5px] uppercase font-mono text-zinc-500 tracking-wider">
                      <th className="p-3">Trigger / Action</th>
                      <th className="p-3">Target Endpoint</th>
                      <th className="p-3">Channel Mode</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Execution details</th>
                      <th className="p-3 text-right">Dispatch Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[9.5px]">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-white/1 duration-100 text-zinc-300">
                        <td className="p-3 font-semibold text-white">{log.action}</td>
                        <td className="p-3 text-zinc-400">{log.target}</td>
                        <td className="p-3 text-gold-pure">{log.channel}</td>
                        <td className="p-3">
                          <span className={`inline-block py-0.5 px-1.5 text-[8px] font-bold rounded-full ${
                            log.status === 'Success' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/15' :
                            log.status === 'Pending' ? 'bg-amber-950/40 text-amber-400 border border-amber-500/15' :
                            'bg-rose-950/40 text-rose-400 border border-rose-500/15'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400 max-w-xs truncate" title={log.details}>{log.details}</td>
                        <td className="p-3 text-right text-zinc-500">{log.time}</td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500 text-[10px]">
                          No automated queue execution logs match the selected search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
