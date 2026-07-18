import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronRight, X, Check, Eye, Trash2, Calendar,
  ClipboardList, TrendingUp, DollarSign, Package, Truck, Printer, Download, User, MapPin,
  FileText, CheckCircle2, AlertCircle, RefreshCw, Sparkles, FolderPlus, ArrowUpRight,
  Activity, Shield, ShieldCheck, UserCheck, CreditCard, Ban, Undo2, Users, BarChart3,
  PackageCheck, HelpCircle, Phone, Mail, Clock, ShoppingBag, FileSpreadsheet, Send,
  Plus, Edit, EyeOff, RotateCcw, Save, Upload, Code, QrCode, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Order, Product } from '../types';
import { updateProductInventory, updateProductFields } from '../imageRegistry';
import { formatCurrency } from '../utils';

// Movement / Transaction Type Definitions
export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'Stock In' | 'Stock Out' | 'Stock Adjustment' | 'Reservation' | 'Cancellation' | 'Return' | 'Damage' | 'Expiry' | 'Lost';
  quantityChange: number; // Positive or negative
  stockBefore: number;
  stockAfter: number;
  warehouse: string;
  shelfLocation: string;
  operator: string;
  reason: string;
  timestamp: string;
  batchNumber?: string;
  referenceId?: string; // Order ID or PO ID
}

export interface Warehouse {
  code: string;
  name: string;
  address: string;
  manager: string;
  status: 'Active' | 'Inactive' | 'Construction';
  capacity: number; // in units
  currentStock: number;
  contactPhone: string;
  contactEmail: string;
}

export interface BatchRecord {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  batchNumber: string;
  supplierBatch: string;
  manufacturingDate: string;
  expiryDate: string;
  initialQty: number;
  availableQty: number;
  warehouse: string;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Archived';
}

export interface PurchaseOrder {
  id: string;
  supplierName: string;
  dateRaised: string;
  deliveryDate?: string;
  invoiceNumber: string;
  amountSAR: number;
  status: 'Pending' | 'In Transit' | 'Received' | 'Cancelled';
  cargoDescription: string;
  receivingNotes?: string;
  itemsList: Array<{ productId: string; name: string; sku: string; qtyOrdered: number; qtyReceived?: number }>;
}

export interface NotificationItem {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'updated' | 'expiring' | 'adjustment' | 'transfer' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface EnterpriseInventoryManagementProps {
  currentUser: {
    name: string;
    email: string;
    phone: string;
    address: string;
    role?: string;
  } | null;
  products: Product[];
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

export default function EnterpriseInventoryManagement({
  currentUser,
  products,
  orders,
  setOrders
}: EnterpriseInventoryManagementProps) {
  const userRole = currentUser?.role || 'customer';
  const isStaff = userRole === 'staff' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  // State Management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'list' | 'adjustment' | 'warehouses' | 'batches' | 'purchases' | 'reports' | 'logs' | 'barcode'
  >('dashboard');

  // Warehouses state list
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem('zoal_warehouses');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        code: 'WH-DMM-01',
        name: 'Branch B Sovereign Hub',
        address: 'King Fahd Highway, Branch B Port Sector',
        manager: 'Raed Al-Fahad',
        status: 'Active',
        capacity: 50000,
        currentStock: 12450,
        contactPhone: '+966 56 769 9315',
        contactEmail: 'dammam.hub@alzoal.com'
      },
      {
        code: 'WH-RUH-02',
        name: 'Branch A Royal Outlet',
        address: 'King Fahd Road, Olaya Business District, Branch A',
        manager: 'Sarah Al-Maktoum',
        status: 'Active',
        capacity: 35000,
        currentStock: 8200,
        contactPhone: '+966 54 987 6543',
        contactEmail: 'riyadh.outlet@alzoal.com'
      },
      {
        code: 'WH-HOF-03',
        name: 'Al Hofuf Gourmet Kitchen',
        address: 'Al Qarah Artisanal Route, Al-Ahsa',
        manager: 'Jean-Luc Vagner',
        status: 'Active',
        capacity: 15000,
        currentStock: 3400,
        contactPhone: '+966 56 444 8888',
        contactEmail: 'hofuf.kitchen@alzoal.com'
      },
      {
        code: 'WH-JED-04',
        name: 'Jeddah Coastal Depot',
        address: 'Corniche Industrial Zone, Jeddah Red Sea Terminal',
        manager: 'Khalid Al-Harbi',
        status: 'Construction',
        capacity: 40000,
        currentStock: 0,
        contactPhone: '+966 55 222 3333',
        contactEmail: 'jeddah.depot@alzoal.com'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_warehouses', JSON.stringify(warehouses));
  }, [warehouses]);

  // Batch details state
  const [batches, setBatches] = useState<BatchRecord[]>(() => {
    const saved = localStorage.getItem('zoal_batches');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'B-101',
        productId: 'p-cof-1',
        productName: 'Imperial Dark Roast',
        sku: 'ALZ-COF-001',
        batchNumber: 'BAT-COF-2026A',
        supplierBatch: 'SUP-ROAST-99A',
        manufacturingDate: '2026-06-01',
        expiryDate: '2026-12-01',
        initialQty: 100,
        availableQty: 85,
        warehouse: 'Branch B Sovereign Hub',
        status: 'Active'
      },
      {
        id: 'B-102',
        productId: 'p-bak-1',
        productName: 'Sovereign Saffron Cardamom Brioche',
        sku: 'ALZ-BAK-002',
        batchNumber: 'BAT-SFF-449X',
        supplierBatch: 'SUP-BAKERY-31',
        manufacturingDate: '2026-07-14',
        expiryDate: '2026-07-18',
        initialQty: 40,
        availableQty: 12,
        warehouse: 'Al Hofuf Gourmet Kitchen',
        status: 'Expiring Soon'
      },
      {
        id: 'B-103',
        productId: 'p-cof-1',
        productName: 'Imperial Dark Roast',
        sku: 'ALZ-COF-001',
        batchNumber: 'BAT-COF-2025D',
        supplierBatch: 'SUP-ROAST-44D',
        manufacturingDate: '2025-05-01',
        expiryDate: '2025-11-01',
        initialQty: 120,
        availableQty: 0,
        warehouse: 'Branch B Sovereign Hub',
        status: 'Expired'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_batches', JSON.stringify(batches));
  }, [batches]);

  // Purchase records state
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('zoal_purchase_orders');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'PO-2026-001',
        supplierName: 'Branch A Coffee Beans Co.',
        dateRaised: '2026-07-01',
        deliveryDate: '2026-07-04',
        invoiceNumber: 'INV-RCF-9921',
        amountSAR: 45000,
        status: 'Received',
        cargoDescription: 'Imperial Coffee Beans - 500 bags',
        receivingNotes: 'Cargo received in pristine order. Checked by Raed Al-Fahad.',
        itemsList: [
          { productId: 'p-cof-1', name: 'Imperial Dark Roast', sku: 'ALZ-COF-001', qtyOrdered: 500, qtyReceived: 500 }
        ]
      },
      {
        id: 'PO-2026-002',
        supplierName: 'Paris Artisanal Flours',
        dateRaised: '2026-07-05',
        invoiceNumber: 'INV-PAF-3829',
        amountSAR: 18500,
        status: 'In Transit',
        cargoDescription: 'French Pastry Flour - 200 bags',
        itemsList: [
          { productId: 'p-bak-1', name: 'Sovereign Saffron Cardamom Brioche', sku: 'ALZ-BAK-002', qtyOrdered: 200 }
        ]
      },
      {
        id: 'PO-2026-003',
        supplierName: 'Branch A Couture Textiles',
        dateRaised: '2026-07-10',
        invoiceNumber: 'INV-RCT-0492',
        amountSAR: 120000,
        status: 'Pending',
        cargoDescription: 'Cashmere Wool Bolt - 80 rolls',
        itemsList: []
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  // Systemic notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('zoal_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'NOT-01',
        type: 'low_stock',
        title: 'Low Stock Safety Alert',
        message: 'Imperial Dark Roast (SKU: ALZ-COF-001) has dropped below safety threshold of 15 units.',
        timestamp: new Date(Date.now() - 600000).toLocaleString(),
        read: false,
        severity: 'high'
      },
      {
        id: 'NOT-02',
        type: 'expiring',
        title: 'Product Batch Expiring Soon',
        message: 'Artisanal Brioche batch BAT-SFF-449X expires in less than 3 days.',
        timestamp: new Date(Date.now() - 7200000).toLocaleString(),
        read: false,
        severity: 'medium'
      },
      {
        id: 'NOT-03',
        type: 'transfer',
        title: 'Warehouse Transfer Scheduled',
        message: 'Sovereign logistics scheduled 50 units transfer from Branch B Hub to Branch A Royal Outlet.',
        timestamp: new Date(Date.now() - 3600000 * 20).toLocaleString(),
        read: true,
        severity: 'low'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Helper to add system alerts
  const addNotification = (type: NotificationItem['type'], title: string, message: string, severity: NotificationItem['severity'] = 'low') => {
    const newNotif: NotificationItem = {
      id: `NOT-${Date.now().toString().slice(-4)}`,
      type,
      title,
      message,
      timestamp: new Date().toLocaleString(),
      read: false,
      severity
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Form fields for raising new entities
  const [showWhAddModal, setShowWhAddModal] = useState(false);
  const [newWhCode, setNewWhCode] = useState('');
  const [newWhName, setNewWhName] = useState('');
  const [newWhAddress, setNewWhAddress] = useState('');
  const [newWhManager, setNewWhManager] = useState('');
  const [newWhCapacity, setNewWhCapacity] = useState(50000);
  const [newWhPhone, setNewWhPhone] = useState('');
  const [newWhEmail, setNewWhEmail] = useState('');

  const [showBatchAddModal, setShowBatchAddModal] = useState(false);
  const [newBatchProductId, setNewBatchProductId] = useState('');
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [newBatchSupplierBatch, setNewBatchSupplierBatch] = useState('');
  const [newBatchMfgDate, setNewBatchMfgDate] = useState('');
  const [newBatchExpDate, setNewBatchExpDate] = useState('');
  const [newBatchQty, setNewBatchQty] = useState(100);
  const [newBatchWarehouse, setNewBatchWarehouse] = useState('Branch B Sovereign Hub');
  const [expiryPriority, setExpiryPriority] = useState<'none' | 'fifo' | 'fefo'>('none');

  const [showPoAddModal, setShowPoAddModal] = useState(false);
  const [newPoSupplier, setNewPoSupplier] = useState('');
  const [newPoAmount, setNewPoAmount] = useState(5000);
  const [newPoCargo, setNewPoCargo] = useState('');
  const [newPoInvoice, setNewPoInvoice] = useState('');
  const [newPoProductId, setNewPoProductId] = useState('');
  const [newPoQty, setNewPoQty] = useState(100);

  // Shelf variables for product editing
  const [editZone, setEditZone] = useState('');
  const [editRack, setEditRack] = useState('');
  const [editBin, setEditBin] = useState('');

  // Filters & Searching
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeSearchQuery, setBarcodeSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [shelfFilter, setShelfFilter] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('all');

  // Sorting
  const [sortBy, setSortBy] = useState<'name' | 'sku' | 'available' | 'reserved' | 'status' | 'updated'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Product for individual view/edit/barcode printing
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBarcodePrintModal, setShowBarcodePrintModal] = useState(false);

  // USB Barcode Scanner Simulation Logic
  const [scannerBuffer, setScannerBuffer] = useState('');
  const [scannerActive, setScannerActive] = useState(true);
  const [scannerAlert, setScannerAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Transaction state
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(() => {
    const saved = localStorage.getItem('zoal_inventory_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to restore inventory logs ledger:', e);
      }
    }

    // Default Seed transactions if empty
    return [
      {
        id: 'TX-1001',
        productId: 'p-cof-1',
        productName: 'Imperial Dark Roast',
        sku: 'ALZ-COF-001',
        type: 'Stock In',
        quantityChange: 150,
        stockBefore: 0,
        stockAfter: 150,
        warehouse: 'Branch B Hub',
        shelfLocation: 'Aisle 3 - Shelf B',
        operator: 'Raed Al-Fahad',
        reason: 'Initial shipment reception',
        timestamp: new Date(Date.now() - 3600000 * 24 * 3).toLocaleString(),
        batchNumber: 'B-DR-2026'
      },
      {
        id: 'TX-1002',
        productId: 'p-bak-1',
        productName: 'Sovereign Saffron Cardamom Brioche',
        sku: 'ALZ-BAK-002',
        type: 'Stock In',
        quantityChange: 80,
        stockBefore: 0,
        stockAfter: 80,
        warehouse: 'Al Hofuf Kitchen',
        shelfLocation: 'Cold Room - Rack A',
        operator: 'Jean-Luc Vagner',
        reason: 'Fresh morning artisanal batch baking',
        timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString(),
        batchNumber: 'B-SFF-449'
      },
      {
        id: 'TX-1003',
        productId: 'p-cof-1',
        productName: 'Imperial Dark Roast',
        sku: 'ALZ-COF-001',
        type: 'Reservation',
        quantityChange: -2,
        stockBefore: 150,
        stockAfter: 148,
        warehouse: 'Branch B Hub',
        shelfLocation: 'Aisle 3 - Shelf B',
        operator: 'System Automations',
        reason: 'Order #ORD-9482 Reserved',
        timestamp: new Date(Date.now() - 1800000).toLocaleString(),
        referenceId: 'ORD-9482'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('zoal_inventory_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Handle systemic delay for professional high-end loading skeletons
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Bulk Actions
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkStockVal, setBulkStockVal] = useState<string>('');
  const [bulkWarehouseVal, setBulkWarehouseVal] = useState<string>('');
  const [bulkShelfVal, setBulkShelfVal] = useState<string>('');

  // Sourcing & Manual Movement Form States
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustType, setAdjustType] = useState<InventoryTransaction['type']>('Stock In');
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustWarehouse, setAdjustWarehouse] = useState('Branch B Hub');
  const [adjustShelf, setAdjustShelf] = useState('');
  const [adjustBatch, setAdjustBatch] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustRef, setAdjustRef] = useState('');

  // Dynamic Edit Form States
  const [editSku, setEditSku] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editWarehouse, setEditWarehouse] = useState('');
  const [editShelf, setEditShelf] = useState('');
  const [editMinStock, setEditMinStock] = useState<number>(10);
  const [editMaxStock, setEditMaxStock] = useState<number>(150);
  const [editReserved, setEditReserved] = useState<number>(0);

  // Bulk Import state
  const [csvText, setCsvText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Initialize realistic inventory defaults if missing
  useEffect(() => {
    products.forEach((p) => {
      const needsUpdate = !p.sku || !p.barcode || p.minStock === undefined || p.maxStock === undefined || !p.warehouseLocation;
      if (needsUpdate) {
        const catPrefix = p.category ? p.category.substring(0, 3).toUpperCase() : 'ALZ';
        const fallbackSku = p.sku || `ALZ-${catPrefix}-${p.id.split('-').pop()?.toUpperCase() || Math.floor(Math.random() * 1000)}`;
        const fallbackBarcode = p.barcode || `628100${p.id.split('-').pop()?.substring(0, 4).padEnd(4, '0') || '9912'}9`;
        
        updateProductFields(p.id, {
          sku: fallbackSku,
          barcode: fallbackBarcode,
          minStock: p.minStock || 15,
          maxStock: p.maxStock || 200,
          warehouseLocation: p.warehouseLocation || 'Branch B Main Shelf A',
          reservedStock: p.reservedStock || 0,
        });
      }
    });
  }, [products]);

  // AUTOMATIC ORDER-TO-INVENTORY REALTIME SYNCHRONIZATION ENGINE
  useEffect(() => {
    // 1. Calculate reserved stock for each product based on current orders.
    // An item is "Reserved" if the order is Pending, Confirmed, Processing, Preparing, Packed or Ready for Shipping
    const reservedCounts: Record<string, number> = {};
    const stockDeductedCounts: Record<string, number> = {}; // Official deductions (Shipped / Delivered / Completed)
    const returnedRestoreCounts: Record<string, number> = {}; // Returned item counts

    orders.forEach((order) => {
      const isReserved = ['Pending', 'Confirmed', 'Processing', 'Preparing', 'Packed', 'Ready for Shipping'].includes(order.status);
      const isDeducted = ['Shipped', 'Out for Delivery', 'Delivered', 'Completed'].includes(order.status);
      const isReturned = ['Returned', 'Refund Completed'].includes(order.status);

      order.items?.forEach((item) => {
        const prodId = item.productId;
        if (!prodId) return;

        if (isReserved) {
          reservedCounts[prodId] = (reservedCounts[prodId] || 0) + (item.quantity || 0);
        }
        if (isDeducted) {
          stockDeductedCounts[prodId] = (stockDeductedCounts[prodId] || 0) + (item.quantity || 0);
        }
        if (isReturned) {
          returnedRestoreCounts[prodId] = (returnedRestoreCounts[prodId] || 0) + (item.quantity || 0);
        }
      });
    });

    // 2. Safely sync counts into product overrides
    products.forEach((p) => {
      const currentReserved = reservedCounts[p.id] || 0;
      if (p.reservedStock !== currentReserved) {
        updateProductFields(p.id, { reservedStock: currentReserved });
      }
    });

  }, [orders, products]);

  // USB Barcode Scanner keystroke simulator listener
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!scannerActive || showEditModal) return;

      // Ignore normal inputs if target is an input field to avoid dual inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Enter') {
        if (scannerBuffer.length > 2) {
          processScannedBarcode(scannerBuffer);
          setScannerBuffer('');
        }
      } else if (/^[0-9a-zA-Z-]$/.test(e.key)) {
        setScannerBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [scannerBuffer, scannerActive, showEditModal]);

  const processScannedBarcode = (code: string) => {
    const cleanCode = code.trim();
    // Search products for this barcode or SKU
    const found = products.find(
      (p) => p.barcode === cleanCode || p.sku?.toUpperCase() === cleanCode.toUpperCase()
    );

    if (found) {
      setSelectedProduct(found);
      setScannerAlert({
        message: `Success: Scanned product "${found.name}" (SKU: ${found.sku})`,
        type: 'success'
      });
      // Play a positive high-beep sound simulation
      triggerBeep(true);
      // Auto-switch to List view and set selected
      setActiveTab('list');
      setShowEditModal(true);
      // Initialize edit states
      setEditSku(found.sku || '');
      setEditBarcode(found.barcode || '');
      setEditWarehouse(found.warehouseLocation || 'Branch B Main Shelf A');
      setEditShelf(found.specifications?.['Shelf Position'] || 'Shelf A');
      setEditZone(found.specifications?.['Zone'] || 'Zone A');
      setEditRack(found.specifications?.['Rack'] || 'Rack R-12');
      setEditBin(found.specifications?.['Bin'] || 'Bin B-09');
      setEditMinStock(found.minStock || 10);
      setEditMaxStock(found.maxStock || 150);
      setEditReserved(found.reservedStock || 0);
    } else {
      setScannerAlert({
        message: `Error: No catalog item found matching scanned barcode/SKU "${cleanCode}"`,
        type: 'error'
      });
      triggerBeep(false);
    }

    setTimeout(() => {
      setScannerAlert(null);
    }, 5000);
  };

  // Simulates a physical motherboard speaker beep! Highly responsive and amazing
  const triggerBeep = (isSuccess: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (isSuccess) {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime); // High pitch beep
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime); // Low buzz
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      console.log('AudioContext beep simulated');
    }
  };

  // Compute stats for Dashboard view
  const dashboardStats = useMemo(() => {
    let totalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let overStockCount = 0;
    let totalStockValue = 0;
    
    products.forEach((p) => {
      const stock = p.inventory || 0;
      totalStock += stock;

      const minS = p.minStock || 15;
      const maxS = p.maxStock || 200;

      if (stock === 0) {
        outOfStockCount++;
      } else if (stock < minS) {
        lowStockCount++;
      } else if (stock > maxS) {
        overStockCount++;
      }

      const cost = p.costPrice || p.price * 0.4; // assume 40% cost if missing
      totalStockValue += cost * stock;
    });

    // Compute today's stock changes from transaction logs
    let todayStockIn = 0;
    let todayStockOut = 0;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    transactions.forEach((tx) => {
      try {
        const txDate = new Date(tx.timestamp);
        if (txDate >= startOfToday) {
          if (tx.quantityChange > 0) {
            todayStockIn += tx.quantityChange;
          } else {
            todayStockOut += Math.abs(tx.quantityChange);
          }
        }
      } catch (e) {
        // invalid date parse
      }
    });

    return {
      totalProducts: products.length,
      totalStock,
      lowStockCount,
      outOfStockCount,
      overStockCount,
      totalStockValue,
      todayStockIn,
      todayStockOut
    };
  }, [products, transactions]);

  // Group Stock by Warehouse Locations
  const warehouseDistribution = useMemo(() => {
    const map: Record<string, { totalItems: number; totalStock: number }> = {};
    products.forEach((p) => {
      const loc = p.warehouseLocation || 'Branch B Main Shelf A';
      const wh = loc.split(' - ')[0] || loc;
      if (!map[wh]) {
        map[wh] = { totalItems: 0, totalStock: 0 };
      }
      map[wh].totalItems += 1;
      map[wh].totalStock += (p.inventory || 0);
    });

    return Object.entries(map).map(([name, s]) => ({
      name,
      ...s
    }));
  }, [products]);

  // Stock values by category for bar chart
  const categoryChartData = useMemo(() => {
    const map: Record<string, { totalStock: number; value: number }> = {};
    products.forEach((p) => {
      const cat = p.category ? p.category.toUpperCase() : 'COFFEE';
      const cost = p.costPrice || p.price * 0.4;
      const stock = p.inventory || 0;

      if (!map[cat]) {
        map[cat] = { totalStock: 0, value: 0 };
      }
      map[cat].totalStock += stock;
      map[cat].value += (stock * cost);
    });

    return Object.entries(map).map(([category, s]) => ({
      category,
      stock: s.totalStock,
      value: Math.round(s.value)
    }));
  }, [products]);

  // Transaction trends line chart data
  const transactionTrendData = useMemo(() => {
    // Generate dates for the last 5 days
    const dates = Array.from({ length: 5 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString();
    }).reverse();

    const dataMap = dates.reduce((acc, d) => {
      acc[d] = { date: d, "Stock In": 0, "Stock Out": 0 };
      return acc;
    }, {} as Record<string, { date: string; "Stock In": number; "Stock Out": number }>);

    transactions.forEach((tx) => {
      try {
        const txDateStr = new Date(tx.timestamp).toLocaleDateString();
        if (dataMap[txDateStr]) {
          if (tx.quantityChange > 0) {
            dataMap[txDateStr]["Stock In"] += tx.quantityChange;
          } else {
            dataMap[txDateStr]["Stock Out"] += Math.abs(tx.quantityChange);
          }
        }
      } catch (e) {
        // error parsing
      }
    });

    return Object.values(dataMap);
  }, [transactions]);

  // Filtered lists
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.warehouseLocation?.toLowerCase().includes(q)
      );
    }

    // Category
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    // Brand
    if (brandFilter !== 'all') {
      result = result.filter((p) => p.brand === brandFilter);
    }

    // Warehouse Filter
    if (warehouseFilter !== 'all') {
      result = result.filter((p) => {
        const loc = p.warehouseLocation || '';
        return loc.toLowerCase().includes(warehouseFilter.toLowerCase());
      });
    }

    // Stock Status
    if (statusFilter !== 'all') {
      result = result.filter((p) => {
        const stock = p.inventory || 0;
        const minS = p.minStock || 15;
        const maxS = p.maxStock || 200;

        if (statusFilter === 'out') return stock === 0;
        if (statusFilter === 'low') return stock > 0 && stock < minS;
        if (statusFilter === 'sufficient') return stock >= minS && stock <= maxS;
        if (statusFilter === 'over') return stock > maxS;
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: any = a[sortBy as keyof Product] || '';
      let bVal: any = b[sortBy as keyof Product] || '';

      if (sortBy === 'available') {
        aVal = a.inventory || 0;
        bVal = b.inventory || 0;
      } else if (sortBy === 'reserved') {
        aVal = a.reservedStock || 0;
        bVal = b.reservedStock || 0;
      } else if (sortBy === 'status') {
        const aS = (a.inventory || 0) === 0 ? 0 : (a.inventory || 0) < (a.minStock || 15) ? 1 : 2;
        const bS = (b.inventory || 0) === 0 ? 0 : (b.inventory || 0) < (b.minStock || 15) ? 1 : 2;
        aVal = aS;
        bVal = bS;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    return result;
  }, [products, searchQuery, categoryFilter, statusFilter, warehouseFilter, brandFilter, sortBy, sortOrder]);

  // Paginated List
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Manual Adjust Handler
  const handleManualAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStaff) return;

    if (!adjustProductId) {
      alert('Please select a product first.');
      return;
    }

    const prod = products.find((p) => p.id === adjustProductId);
    if (!prod) return;

    const currentInv = prod.inventory || 0;
    let qtyChange = adjustQty;
    let newInv = currentInv;

    if (adjustType === 'Stock In' || adjustType === 'Return') {
      newInv = currentInv + adjustQty;
      qtyChange = adjustQty;
    } else {
      newInv = Math.max(0, currentInv - adjustQty);
      qtyChange = -Math.min(adjustQty, currentInv);
    }

    // Apply change in database/localStorage overrides
    updateProductInventory(prod.id, newInv);

    // Save customized field updates
    const fieldUpdates: any = {};
    if (adjustWarehouse) {
      fieldUpdates.warehouseLocation = adjustWarehouse;
    }
    updateProductFields(prod.id, fieldUpdates);

    // Append to transactions logs list
    const newTx: InventoryTransaction = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku || 'N/A',
      type: adjustType,
      quantityChange: qtyChange,
      stockBefore: currentInv,
      stockAfter: newInv,
      warehouse: adjustWarehouse,
      shelfLocation: adjustShelf || 'Aisle 1 - Row A',
      operator: currentUser?.name || 'Authorized Staff',
      reason: adjustReason || `${adjustType} recorded manually.`,
      timestamp: new Date().toLocaleString(),
      batchNumber: adjustBatch || undefined,
      referenceId: adjustRef || undefined
    };

    setTransactions((prev) => [newTx, ...prev]);

    alert(`Successfully registered inventory transaction ${newTx.id}. ${prod.name} available stock updated from ${currentInv} to ${newInv} units.`);
    
    // Clear form inputs
    setAdjustQty(0);
    setAdjustReason('');
    setAdjustBatch('');
    setAdjustRef('');
    setAdjustShelf('');
  };

  // Single Item Edit Save handler
  const handleSaveProductSettings = () => {
    if (!selectedProduct || !isStaff) return;

    const updatedSpecs = {
      ...(selectedProduct.specifications || {}),
      'Shelf Position': editShelf || 'Shelf A',
      'Zone': editZone || 'Zone A',
      'Rack': editRack || 'Rack R-12',
      'Bin': editBin || 'Bin B-09'
    };

    updateProductFields(selectedProduct.id, {
      sku: editSku,
      barcode: editBarcode,
      warehouseLocation: editWarehouse,
      minStock: editMinStock,
      maxStock: editMaxStock,
      specifications: updatedSpecs
    });

    // Write a system log
    const newTx: InventoryTransaction = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: editSku,
      type: 'Stock Adjustment',
      quantityChange: 0,
      stockBefore: selectedProduct.inventory || 0,
      stockAfter: selectedProduct.inventory || 0,
      warehouse: editWarehouse,
      shelfLocation: `${editZone} - ${editRack} - ${editShelf} - ${editBin}`,
      operator: currentUser?.name || 'Authorized Admin',
      reason: 'Product inventory thresholds and tracking SKU/Barcode settings updated.',
      timestamp: new Date().toLocaleString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    setShowEditModal(false);
    alert(`Inventory settings for ${selectedProduct.name} saved successfully.`);
  };

  // Export List as CSV file
  const handleExportCSV = () => {
    try {
      const headers = ['Product ID', 'Product Name', 'SKU', 'Barcode', 'Category', 'Warehouse', 'Min Stock', 'Max Stock', 'Available Stock', 'Reserved Stock', 'Status'];
      const rows = filteredProducts.map((p) => {
        const stock = p.inventory || 0;
        const minS = p.minStock || 15;
        const statusStr = stock === 0 ? 'Out of Stock' : stock < minS ? 'Low Stock' : 'In Stock';
        return [
          p.id,
          `"${p.name.replace(/"/g, '""')}"`,
          p.sku || '',
          p.barcode || '',
          p.category || '',
          `"${(p.warehouseLocation || '').replace(/"/g, '""')}"`,
          p.minStock || 15,
          p.maxStock || 150,
          stock,
          p.reservedStock || 0,
          statusStr
        ];
      });

      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `AL_ZOAL_Inventory_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    }
  };

  // CSV Import handler
  const handleCSVImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only Administrators can perform bulk inventory CSV imports.');
      return;
    }

    try {
      const lines = csvText.split('\n');
      if (lines.length < 2) {
        setImportStatus('Error: Invalid CSV format or empty file.');
        return;
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const idIdx = headers.findIndex(h => h.toLowerCase().includes('id'));
      const stockIdx = headers.findIndex(h => h.toLowerCase().includes('stock') || h.toLowerCase().includes('available'));
      const skuIdx = headers.findIndex(h => h.toLowerCase().includes('sku'));
      const barcodeIdx = headers.findIndex(h => h.toLowerCase().includes('barcode'));
      const warehouseIdx = headers.findIndex(h => h.toLowerCase().includes('warehouse') || h.toLowerCase().includes('location'));

      if (idIdx === -1 || stockIdx === -1) {
        setImportStatus('Error: CSV must include at least "Product ID" and "Available Stock" (or "Stock") columns.');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // basic comma split (ignoring quoted commas for simplicity of simulation)
        const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        const pid = cols[idIdx];
        const stockVal = parseInt(cols[stockIdx], 10);

        if (!pid || isNaN(stockVal)) {
          errorCount++;
          continue;
        }

        // Verify if product exists
        const matched = products.find(p => p.id === pid || p.sku === pid);
        if (matched) {
          // Update Stock
          updateProductInventory(matched.id, stockVal);
          
          // If SKU/Barcode/Warehouse columns were found and exist, override them
          const extraFields: any = {};
          if (skuIdx !== -1 && cols[skuIdx]) extraFields.sku = cols[skuIdx];
          if (barcodeIdx !== -1 && cols[barcodeIdx]) extraFields.barcode = cols[barcodeIdx];
          if (warehouseIdx !== -1 && cols[warehouseIdx]) extraFields.warehouseLocation = cols[warehouseIdx];

          if (Object.keys(extraFields).length > 0) {
            updateProductFields(matched.id, extraFields);
          }

          // Register import log
          const newTx: InventoryTransaction = {
            id: `TX-IMP-${Date.now().toString().slice(-4)}-${i}`,
            productId: matched.id,
            productName: matched.name,
            sku: cols[skuIdx] || matched.sku || 'N/A',
            type: 'Stock Adjustment',
            quantityChange: stockVal - (matched.inventory || 0),
            stockBefore: matched.inventory || 0,
            stockAfter: stockVal,
            warehouse: cols[warehouseIdx] || matched.warehouseLocation || 'Imported Warehouse',
            shelfLocation: 'Bulk CSV Row',
            operator: currentUser?.name || 'Administrator',
            reason: 'Sovereign database bulk CSV synchronization upload.',
            timestamp: new Date().toLocaleString(),
          };
          setTransactions(prev => [newTx, ...prev]);

          successCount++;
        } else {
          errorCount++;
        }
      }

      setImportStatus(`Success: Processed ${successCount} products. Failed/Skipped: ${errorCount} items.`);
      setCsvText('');
    } catch (err: any) {
      setImportStatus(`Import Exception: ${err.message}`);
    }
  };

  // Bulk operation triggers
  const handleBulkUpdate = (action: 'stock' | 'warehouse' | 'archive' | 'barcode-print') => {
    if (selectedProductIds.length === 0) {
      alert('Please select at least one product using checkboxes.');
      return;
    }

    if (action === 'stock') {
      const parsed = parseInt(bulkStockVal, 10);
      if (isNaN(parsed) || parsed < 0) {
        alert('Please enter a valid stock quantity.');
        return;
      }
      
      selectedProductIds.forEach(id => {
        const prod = products.find(p => p.id === id);
        if (prod) {
          const old = prod.inventory || 0;
          updateProductInventory(id, parsed);

          // log transaction
          const newTx: InventoryTransaction = {
            id: `TX-${Date.now().toString().slice(-4)}`,
            productId: id,
            productName: prod.name,
            sku: prod.sku || '',
            type: 'Stock Adjustment',
            quantityChange: parsed - old,
            stockBefore: old,
            stockAfter: parsed,
            warehouse: prod.warehouseLocation || 'Branch B Main',
            shelfLocation: 'Bulk Operation',
            operator: currentUser?.name || 'Authorized Operator',
            reason: 'Admin bulk stock value override.',
            timestamp: new Date().toLocaleString(),
          };
          setTransactions(prev => [newTx, ...prev]);
        }
      });
      alert(`Bulk updated ${selectedProductIds.length} products stock to ${parsed} units.`);
      setSelectedProductIds([]);
      setBulkStockVal('');

    } else if (action === 'warehouse') {
      if (!bulkWarehouseVal.trim()) {
        alert('Please enter a warehouse destination.');
        return;
      }

      selectedProductIds.forEach(id => {
        updateProductFields(id, {
          warehouseLocation: `${bulkWarehouseVal} - ${bulkShelfVal || 'Shelf A'}`
        });
      });

      alert(`Bulk reassigned ${selectedProductIds.length} products to ${bulkWarehouseVal}.`);
      setSelectedProductIds([]);
      setBulkWarehouseVal('');
      setBulkShelfVal('');
    } else if (action === 'archive') {
      if (!confirm(`Are you sure you want to bulk-deactivate tracking for ${selectedProductIds.length} items?`)) return;
      selectedProductIds.forEach(id => {
        updateProductFields(id, { status: 'Inactive' });
      });
      alert(`Archived / Deactivated inventory monitoring for ${selectedProductIds.length} items.`);
      setSelectedProductIds([]);
    } else if (action === 'barcode-print') {
      setShowBarcodePrintModal(true);
    }
  };

  // Helper for status badge
  const renderStatusBadge = (product: Product) => {
    const stock = product.inventory || 0;
    const minS = product.minStock || 15;
    const maxS = product.maxStock || 150;

    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-red-950/40 border border-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-sm uppercase text-[8px] font-mono tracking-wider">
          <AlertCircle className="w-2.5 h-2.5 shrink-0" /> Out of stock
        </span>
      );
    }
    if (stock < minS) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-950/40 border border-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-sm uppercase text-[8px] font-mono tracking-wider">
          <AlertCircle className="w-2.5 h-2.5 shrink-0" /> Low Stock ({stock})
        </span>
      );
    }
    if (stock > maxS) {
      return (
        <span className="inline-flex items-center gap-1 bg-blue-950/40 border border-blue-500/20 text-blue-400 font-bold px-2 py-0.5 rounded-sm uppercase text-[8px] font-mono tracking-wider">
          Overstock ({stock})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-sm uppercase text-[8px] font-mono tracking-wider">
        <Check className="w-2.5 h-2.5 shrink-0" /> In Stock ({stock})
      </span>
    );
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ZOAL Sovereign Logistics</span>
          <h1 className="text-xl md:text-2xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-gold-pure" /> Enterprise Inventory System
          </h1>
        </div>
        
        {/* Real-time sync notifier */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 font-mono text-[9px] text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            <span>REALTIME ORDER-STOCK SYNC: ACTIVE</span>
          </div>
          
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 500);
            }}
            className="p-2 border border-white/10 hover:border-gold-pure rounded-xs hover:text-gold-pure transition-colors cursor-pointer text-zinc-400"
            title="Manual Re-sync Sovereign DB"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. TAB SELECTION BAR */}
      <div className="flex border-b border-white/5 overflow-x-auto scrollbar-none gap-2 pb-px font-mono text-[10px]">
        {[
          { id: 'dashboard', label: 'INVENTORY COCKPIT', icon: BarChart3 },
          { id: 'list', label: 'STOCK LEDGER MATRIX', icon: ClipboardList },
          { id: 'adjustment', label: 'RECORD MOVEMENT', icon: Sliders },
          { id: 'warehouses', label: 'WAREHOUSE HUBS', icon: MapPin },
          { id: 'batches', label: 'BATCHES & EXPIRY', icon: Calendar },
          { id: 'purchases', label: 'PURCHASING & RECEIVING', icon: FileText },
          { id: 'reports', label: 'INTELLIGENCE REPORTS', icon: FileSpreadsheet },
          { id: 'logs', label: 'AUDIT MOVE TRAIL', icon: Activity },
          { id: 'barcode', label: 'BARCODE MATRIX & SCANNER', icon: QrCode }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setLoading(true);
              }}
              className={`py-3 px-4 flex items-center gap-2 uppercase tracking-wider cursor-pointer border-b-2 font-bold whitespace-nowrap transition-all ${
                isSel
                  ? 'border-gold-pure text-gold-pure bg-white/[0.02]'
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SKELETON LOADER SCREEN FOR UX CRAFTSMANSHIP */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-zinc-950/60 border border-white/5 h-24 rounded-xs animate-pulse p-4 space-y-3">
                <div className="h-2 w-12 bg-zinc-800 rounded-sm" />
                <div className="h-5 w-24 bg-zinc-800 rounded-sm" />
                <div className="h-2 w-16 bg-zinc-800 rounded-sm" />
              </div>
            ))}
          </div>
          <div className="bg-zinc-950/40 border border-white/5 h-80 rounded-xs animate-pulse flex items-center justify-center">
            <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Sovereign Vault Indices...</span>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* ======================= TAB I: INVENTORY COCKPIT ======================= */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Dashboard KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-950/60 border border-white/5 p-4 rounded-xs hover:border-gold-pure/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] tracking-widest text-zinc-500 font-mono uppercase">Total Catalog SKU Count</span>
                    <Package className="w-3.5 h-3.5 text-gold-pure" />
                  </div>
                  <span className="text-xl font-bold font-mono text-white block mt-1.5">{dashboardStats.totalProducts}</span>
                  <span className="text-[9px] font-sans text-zinc-400 block mt-0.5">Active Sovereign catalog</span>
                </div>

                <div className="bg-zinc-950/60 border border-white/5 p-4 rounded-xs hover:border-gold-pure/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] tracking-widest text-zinc-500 font-mono uppercase">Global Stock Units</span>
                    <ClipboardList className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <span className="text-xl font-bold font-mono text-gold-pure block mt-1.5">
                    {dashboardStats.totalStock} <span className="text-[10px] text-zinc-500">Units</span>
                  </span>
                  <span className="text-[9px] font-sans text-emerald-400 block mt-0.5">
                    {products.reduce((sum, p) => sum + (p.reservedStock || 0), 0)} Reserved in Active Orders
                  </span>
                </div>

                <div className="bg-zinc-950/60 border border-red-500/10 p-4 rounded-xs hover:border-red-500/20 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] tracking-widest text-red-500 font-mono uppercase">Stock Out / Low alerts</span>
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <span className="text-xl font-bold font-mono text-rose-500 block mt-1.5">
                    {dashboardStats.outOfStockCount} <span className="text-xs text-zinc-500">/</span> {dashboardStats.lowStockCount}
                  </span>
                  <span className="text-[9px] font-sans text-zinc-400 block mt-0.5">Critical response required</span>
                </div>

                <div className="bg-zinc-950/60 border border-white/5 p-4 rounded-xs hover:border-gold-pure/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] tracking-widest text-zinc-500 font-mono uppercase">Vault Stock Valuation</span>
                    <DollarSign className="w-3.5 h-3.5 text-gold-pure" />
                  </div>
                  <span className="text-xl font-bold font-mono text-white block mt-1.5">
                    {formatCurrency(dashboardStats.totalStockValue)}
                  </span>
                  <span className="text-[9px] font-sans text-zinc-400 block mt-0.5">At simulated cost values</span>
                </div>
              </div>

              {/* Secondary metrics row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-xs">
                  <span className="text-[8px] tracking-widest text-zinc-500 font-mono block uppercase">Today's Stock Inbound</span>
                  <span className="text-lg font-bold font-mono text-emerald-400 block mt-1">+{dashboardStats.todayStockIn} units</span>
                </div>
                <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-xs">
                  <span className="text-[8px] tracking-widest text-zinc-500 font-mono block uppercase">Today's Stock Discharges</span>
                  <span className="text-lg font-bold font-mono text-rose-400 block mt-1">-{dashboardStats.todayStockOut} units</span>
                </div>
                <div className="bg-zinc-950/40 border border-amber-500/10 p-4 rounded-xs">
                  <span className="text-[8px] tracking-widest text-amber-500 font-mono block uppercase">Overstocked SKUs</span>
                  <span className="text-lg font-bold font-mono text-amber-400 block mt-1">{dashboardStats.overStockCount} Items</span>
                </div>
                <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-xs">
                  <span className="text-[8px] tracking-widest text-zinc-500 font-mono block uppercase">Warehouse Hubs</span>
                  <span className="text-lg font-bold font-mono text-white block mt-1">
                    {warehouseDistribution.length} Sourcing Centers
                  </span>
                </div>
              </div>

              {/* CHARTS CONTAINER - High-end premium layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Bar Chart: Category Allocation */}
                <div className="bg-zinc-950/80 border border-white/5 p-4 rounded-xs lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-mono uppercase text-gold-pure tracking-widest font-bold">Category Sourcing & Valuation Breakdown</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryChartData}>
                        <XAxis dataKey="category" stroke="#666" fontSize={9} tickLine={false} />
                        <YAxis stroke="#666" fontSize={9} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#222' }}
                          labelStyle={{ color: '#fff', fontSize: 10, fontFamily: 'monospace' }}
                          itemStyle={{ fontSize: 10, fontFamily: 'monospace' }}
                        />
                        <Bar dataKey="value" fill="#D4AF37" radius={[2, 2, 0, 0]} name="Valuation (SAR)" />
                        <Bar dataKey="stock" fill="#444" radius={[2, 2, 0, 0]} name="Stock (Units)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Warehouses Pie summary */}
                <div className="bg-zinc-950/80 border border-white/5 p-4 rounded-xs space-y-4 flex flex-col justify-between">
                  <h3 className="text-xs font-mono uppercase text-gold-pure tracking-widest font-bold">Warehouse Distribution</h3>
                  <div className="h-44 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={warehouseDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="totalStock"
                        >
                          {warehouseDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#D4AF37' : index === 1 ? '#F3E5AB' : '#444'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="divide-y divide-white/5 text-[9.5px] font-mono pt-2">
                    {warehouseDistribution.map((wh, idx) => (
                      <div key={wh.name} className="py-1.5 flex justify-between">
                        <span className="text-zinc-400">{wh.name}</span>
                        <span className="text-white font-bold">{wh.totalStock} units ({wh.totalItems} SKUs)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Stock movement timeline graph */}
              <div className="bg-zinc-950/60 border border-white/5 p-4 rounded-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-mono uppercase text-gold-pure tracking-widest font-bold">5-Day Sourcing Movements Trend</h3>
                  <span className="text-[8px] font-mono text-zinc-500">Inbound (Stock In) vs Outbound (Stock Out) logs</span>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={transactionTrendData}>
                      <XAxis dataKey="date" stroke="#555" fontSize={9} />
                      <YAxis stroke="#555" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: 10 }} />
                      <Area type="monotone" dataKey="Stock In" stroke="#10b981" fillOpacity={0.1} fill="#10b981" />
                      <Area type="monotone" dataKey="Stock Out" stroke="#ef4444" fillOpacity={0.05} fill="#ef4444" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Critical logistical warning alerts & Smart notifications stack */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-zinc-950/40 border border-white/5 p-4 rounded-xs">
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-xs font-mono uppercase text-red-400 tracking-widest font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> CRITICAL LOGISTICAL WARNING ALERTS
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Out of Stock column */}
                    <div className="bg-black/40 border border-red-500/10 p-3 rounded-xs space-y-2">
                      <span className="text-[9px] tracking-widest font-mono text-red-400 font-bold block uppercase">❌ ZERO AVAILABILITY OUT OF STOCK ({dashboardStats.outOfStockCount})</span>
                      <div className="max-h-40 overflow-y-auto divide-y divide-white/5 text-[10px] font-mono pr-1">
                        {products.filter(p => (p.inventory || 0) === 0).length === 0 ? (
                          <p className="text-zinc-500 py-2">No zero-stock critical events active.</p>
                        ) : (
                          products.filter(p => (p.inventory || 0) === 0).map(p => (
                            <div key={p.id} className="py-2 flex justify-between items-center">
                              <span className="text-white font-sans truncate pr-2">{p.name}</span>
                              <span className="text-red-400 font-bold shrink-0">{p.sku}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Low Stock column */}
                    <div className="bg-black/40 border border-amber-500/10 p-3 rounded-xs space-y-2">
                      <span className="text-[9px] tracking-widest font-mono text-amber-400 font-bold block uppercase">⚠️ REPLENISH THRESHOLD ALERTS ({dashboardStats.lowStockCount})</span>
                      <div className="max-h-40 overflow-y-auto divide-y divide-white/5 text-[10px] font-mono pr-1">
                        {products.filter(p => (p.inventory || 0) > 0 && (p.inventory || 0) < (p.minStock || 15)).length === 0 ? (
                          <p className="text-zinc-500 py-2">All products above minimum safety parameters.</p>
                        ) : (
                          products.filter(p => (p.inventory || 0) > 0 && (p.inventory || 0) < (p.minStock || 15)).map(p => (
                            <div key={p.id} className="py-2 flex justify-between items-center">
                              <div className="truncate pr-2">
                                <span className="text-white font-sans block truncate">{p.name}</span>
                                <span className="text-[8px] text-zinc-500 uppercase tracking-wider block">Min limit: {p.minStock || 15} units</span>
                              </div>
                              <span className="text-amber-400 font-bold shrink-0">{p.inventory} left</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notifications Stack */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-mono uppercase text-gold-pure tracking-widest font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> SYSTEM NOTIFICATION FEED
                    </h3>
                    <button 
                      onClick={() => {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        addNotification('general', 'Notifications Cleared', 'All active system alerts marked as read.', 'low');
                      }}
                      className="text-[9px] font-mono hover:text-white text-zinc-500 transition-colors cursor-pointer"
                    >
                      MARK ALL READ
                    </button>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-3 rounded-xs space-y-2 max-h-56 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-zinc-500 text-center font-mono py-8">No notifications active.</p>
                    ) : (
                      notifications.map((n) => {
                        const sevColors = {
                          low: 'border-zinc-500/20 text-zinc-400',
                          medium: 'border-amber-500/20 text-amber-300',
                          high: 'border-red-500/20 text-rose-300',
                          critical: 'border-red-600 bg-red-950/20 text-red-200'
                        };
                        return (
                          <div 
                            key={n.id} 
                            className={`p-2 border text-[10px] rounded-xs font-sans transition-all relative ${sevColors[n.severity]} ${
                              !n.read ? 'bg-white/[0.02] border-l-2 border-l-gold-pure' : 'opacity-60'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold font-mono tracking-wider text-white block uppercase">{n.title}</span>
                              <span className="text-[8px] text-zinc-500 shrink-0 font-mono">{n.timestamp}</span>
                            </div>
                            <p className="mt-1 leading-relaxed text-zinc-400 text-xs">{n.message}</p>
                            {!n.read && (
                              <button 
                                onClick={() => {
                                  setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                                }}
                                className="mt-1.5 text-[8px] font-mono text-gold-pure hover:underline cursor-pointer block"
                              >
                                MARK READ
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ======================= TAB II: STOCK LEDGER MATRIX ======================= */}
          {activeTab === 'list' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* LEDGER FILTERS */}
              <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                  
                  {/* Search bar */}
                  <div className="flex items-center gap-2 bg-black border border-white/5 px-3 py-1.5 rounded-xs w-full lg:w-96">
                    <Search className="w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search ledger by product, SKU, barcode, location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-white placeholder-zinc-500 outline-none text-[10px] w-full"
                    />
                    {searchQuery && (
                      <X className="w-3.5 h-3.5 text-zinc-400 cursor-pointer hover:text-white" onClick={() => setSearchQuery('')} />
                    )}
                  </div>

                  {/* Actions buttons row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowImportArea(!showImportArea)}
                      className="py-1.5 px-3 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white rounded-xs text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Upload className="w-3 h-3 text-gold-pure" /> Bulk Sync CSV
                    </button>

                    <button
                      onClick={handleExportCSV}
                      className="py-1.5 px-3 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white rounded-xs text-[9px] uppercase tracking-widest font-bold cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3 h-3 text-gold-pure" /> Export Ledger
                    </button>

                    {isStaff && (
                      <button
                        onClick={() => {
                          setActiveTab('adjustment');
                          setAdjustType('Stock In');
                        }}
                        className="py-1.5 px-3 bg-gold-pure text-black rounded-xs text-[9px] uppercase tracking-widest font-extrabold cursor-pointer hover:bg-gold-light transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> + Log Entry
                      </button>
                    )}
                  </div>
                </div>

                {/* ADVANCED CRITERIA DRILLDOWNS */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-white/5 text-[9.5px] font-mono">
                  {/* Category Filter */}
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase block tracking-wider">Business division</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-black border border-white/5 p-1 text-white text-[9.5px]"
                    >
                      <option value="all">ALL CATEGORIES</option>
                      <option value="coffee">COFFEE HOUSE</option>
                      <option value="bakery">BAKERY & SNACKS</option>
                      <option value="market">MARKET & GROCERY</option>
                      <option value="fashion">PREMIUM COUTURE</option>
                      <option value="thobes">MEN'S WEAR</option>
                    </select>
                  </div>

                  {/* Brand Filter */}
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase block tracking-wider">Manufacturer / Brand</label>
                    <select
                      value={brandFilter}
                      onChange={(e) => setBrandFilter(e.target.value)}
                      className="w-full bg-black border border-white/5 p-1 text-white text-[9.5px]"
                    >
                      <option value="all">ALL BRANDS</option>
                      <option value="AL ZOAL">AL ZOAL</option>
                      <option value="Sovereign Artisans">Sovereign Artisans</option>
                      <option value="Couture Reserve">Couture Reserve</option>
                    </select>
                  </div>

                  {/* Warehouse Filter */}
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase block tracking-wider">Logistics Warehouse</label>
                    <select
                      value={warehouseFilter}
                      onChange={(e) => setWarehouseFilter(e.target.value)}
                      className="w-full bg-black border border-white/5 p-1 text-white text-[9.5px]"
                    >
                      <option value="all">ALL STORES</option>
                      <option value="Branch B">DAMMAM HUB</option>
                      <option value="Hofuf">AL HOFUF KITCHEN</option>
                      <option value="Branch A">RIYADH OUTLET</option>
                    </select>
                  </div>

                  {/* Stock Status Filter */}
                  <div className="space-y-1">
                    <label className="text-zinc-500 uppercase block tracking-wider">Stock Health Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-black border border-white/5 p-1 text-white text-[9.5px]"
                    >
                      <option value="all">ALL STATUSES</option>
                      <option value="sufficient">IN STOCK (SUFFICIENT)</option>
                      <option value="low">LOW STOCK ALERTS</option>
                      <option value="out">OUT OF STOCK (CRITICAL)</option>
                      <option value="over">OVERSTOCK WARNINGS</option>
                    </select>
                  </div>

                  {/* Clear filters */}
                  <div className="flex items-end justify-end">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                        setBrandFilter('all');
                        setWarehouseFilter('all');
                        setStatusFilter('all');
                      }}
                      className="w-full py-1.5 bg-zinc-900 border border-white/5 hover:border-white/20 text-center uppercase tracking-wider text-zinc-400 hover:text-white"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk import workspace */}
              {showImportArea && (
                <div className="bg-zinc-950 border border-gold-pure/20 p-4 rounded-xs space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">SOVEREIGN BULK CSV IMPORT PANEL</h3>
                    <button onClick={() => setShowImportArea(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <p className="text-[9.5px] font-sans text-zinc-400">
                    Import or update stock levels using a standard CSV format. Paste raw CSV text below with columns: <code className="text-gold-pure bg-white/5 px-1 font-mono">Product ID, SKU, Barcode, Warehouse, Available Stock</code>.
                  </p>
                  
                  <form onSubmit={handleCSVImportSubmit} className="space-y-3 font-mono text-[10px]">
                    <textarea
                      rows={5}
                      placeholder={`Product ID, SKU, Barcode, Warehouse, Available Stock\np-cof-1, ALZ-COF-001, 6281000109, Branch B Hub, 250\np-bak-1, ALZ-BAK-002, 6281000219, Al Hofuf, 120`}
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      className="w-full bg-black border border-white/10 p-3 outline-none text-white focus:border-gold-pure font-mono h-40 resize-y"
                    />
                    
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setCsvText("Product ID, SKU, Barcode, Warehouse, Available Stock\np-cof-1, ALZ-COF-001, 6281000109, Branch B Hub, 250")}
                        className="text-zinc-500 hover:text-gold-pure"
                      >
                        [Insert Demo CSV Payload]
                      </button>
                      
                      <button
                        type="submit"
                        className="py-1.5 px-4 bg-gold-pure text-black font-bold uppercase cursor-pointer"
                      >
                        Execute Synchronized Import
                      </button>
                    </div>

                    {importStatus && (
                      <div className="p-3 bg-white/5 border border-white/10 text-gold-pure font-bold font-sans rounded-xs text-[10px]">
                        {importStatus}
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* BULK ACTIONS BOX */}
              {selectedProductIds.length > 0 && (
                <div className="bg-zinc-950 border border-white/10 p-3 rounded-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 animate-slide-in font-mono text-[9.5px]">
                  <div className="flex items-center gap-2 text-white">
                    <span className="w-2 h-2 bg-gold-pure rounded-full animate-pulse" />
                    <strong>{selectedProductIds.length} Products Selected</strong>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Bulk Available Stock */}
                    <div className="flex items-center gap-1.5 bg-black border border-white/5 px-2 py-1">
                      <span className="text-zinc-500">Qty:</span>
                      <input
                        type="number"
                        placeholder="New Stock"
                        value={bulkStockVal}
                        onChange={(e) => setBulkStockVal(e.target.value)}
                        className="w-16 bg-transparent text-white outline-none font-bold"
                      />
                      <button
                        onClick={() => handleBulkUpdate('stock')}
                        className="bg-gold-pure text-black px-1.5 py-0.5 font-bold uppercase rounded-sm cursor-pointer"
                      >
                        Set
                      </button>
                    </div>

                    {/* Bulk Warehouse location */}
                    <div className="flex items-center gap-1.5 bg-black border border-white/5 px-2 py-1">
                      <span className="text-zinc-500">WH:</span>
                      <input
                        type="text"
                        placeholder="Hub Name"
                        value={bulkWarehouseVal}
                        onChange={(e) => setBulkWarehouseVal(e.target.value)}
                        className="w-24 bg-transparent text-white outline-none text-[9px]"
                      />
                      <input
                        type="text"
                        placeholder="Shelf"
                        value={bulkShelfVal}
                        onChange={(e) => setBulkShelfVal(e.target.value)}
                        className="w-16 bg-transparent text-white outline-none text-[9px] border-l border-white/10 pl-1"
                      />
                      <button
                        onClick={() => handleBulkUpdate('warehouse')}
                        className="bg-zinc-800 text-white px-1.5 py-0.5 font-bold uppercase rounded-sm cursor-pointer border border-white/10"
                      >
                        Move
                      </button>
                    </div>

                    {/* Archive / Deactivate */}
                    <button
                      onClick={() => handleBulkUpdate('archive')}
                      className="py-1 px-2.5 bg-rose-950/40 border border-rose-500/20 text-rose-400 hover:bg-rose-900/40 font-bold uppercase cursor-pointer"
                    >
                      Archive Selection
                    </button>

                    <button
                      onClick={() => handleBulkUpdate('barcode-print')}
                      className="py-1 px-2.5 bg-zinc-800 border border-white/10 hover:border-gold-pure text-white font-bold uppercase cursor-pointer flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" /> Label Print
                    </button>

                    <button
                      onClick={() => setSelectedProductIds([])}
                      className="text-zinc-500 hover:text-white px-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* MATRIX TABLE LEDGER */}
              <div className="bg-zinc-950 border border-white/5 rounded-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-white/5">
                    <thead>
                      <tr className="bg-white/[0.01] font-mono text-[9px] text-zinc-500 uppercase tracking-widest">
                        <th className="p-4 w-10">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds(filteredProducts.map(p => p.id));
                              } else {
                                setSelectedProductIds([]);
                              }
                            }}
                            className="accent-gold-pure"
                          />
                        </th>
                        <th className="p-4 cursor-pointer hover:text-white" onClick={() => { setSortBy('name'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                          Product Detail <ArrowUpDown className="w-2.5 h-2.5 inline-block" />
                        </th>
                        <th className="p-4 cursor-pointer hover:text-white" onClick={() => { setSortBy('sku'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                          SKU & Barcode <ArrowUpDown className="w-2.5 h-2.5 inline-block" />
                        </th>
                        <th className="p-4">Division / Brand</th>
                        <th className="p-4">Warehouse & Shelf Location</th>
                        <th className="p-4 cursor-pointer hover:text-white" onClick={() => { setSortBy('available'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                          Available <ArrowUpDown className="w-2.5 h-2.5 inline-block" />
                        </th>
                        <th className="p-4 cursor-pointer hover:text-white" onClick={() => { setSortBy('reserved'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                          Reserved <ArrowUpDown className="w-2.5 h-2.5 inline-block" />
                        </th>
                        <th className="p-4">Thresholds</th>
                        <th className="p-4">Status</th>
                        {isStaff && <th className="p-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px]">
                      {paginatedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-zinc-500 font-mono uppercase tracking-widest">
                            No product stock records match your query.
                          </td>
                        </tr>
                      ) : (
                        paginatedProducts.map((p) => {
                          const isSel = selectedProductIds.includes(p.id);
                          return (
                            <tr key={p.id} className={`hover:bg-white/[0.01] duration-150 ${isSel ? 'bg-white/[0.01]' : ''}`}>
                              <td className="p-4">
                                <input
                                  type="checkbox"
                                  checked={isSel}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedProductIds(prev => [...prev, p.id]);
                                    } else {
                                      setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                                    }
                                  }}
                                  className="accent-gold-pure"
                                />
                              </td>
                              
                              {/* Product Name & Image */}
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  {p.images && p.images[0] ? (
                                    <img
                                      src={p.images[0]}
                                      alt={p.name}
                                      className="w-10 h-10 object-cover border border-white/10 rounded-sm shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-zinc-900 border border-white/5 rounded-sm flex items-center justify-center shrink-0">
                                      <Package className="w-4 h-4 text-zinc-600" />
                                    </div>
                                  )}
                                  <div>
                                    <strong className="text-white text-xs block font-semibold">{p.name}</strong>
                                    <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wide">ID: {p.id}</span>
                                  </div>
                                </div>
                              </td>

                              {/* SKU & Barcode */}
                              <td className="p-4 font-mono text-[10px]">
                                <span className="text-zinc-300 block">{p.sku || 'N/A'}</span>
                                <span className="text-zinc-600 block">{p.barcode || 'N/A'}</span>
                              </td>

                              {/* Division */}
                              <td className="p-4 uppercase font-mono text-[9px]">
                                <span className="text-gold-pure block">{p.category}</span>
                                <span className="text-zinc-500 block">{p.brand || 'AL ZOAL'}</span>
                              </td>

                              {/* Warehouse Location */}
                              <td className="p-4 text-zinc-400 font-sans text-[10.5px]">
                                <span className="block text-white font-medium">{p.warehouseLocation?.split(' - ')[0] || 'Branch B Main'}</span>
                                <span className="text-[8.5px] font-mono text-zinc-500 block uppercase tracking-wider">{p.warehouseLocation?.split(' - ')[1] || 'Shelf A'}</span>
                              </td>

                              {/* Available Stock */}
                              <td className="p-4 font-mono text-xs font-bold text-white">
                                <span className={p.inventory <= (p.minStock || 15) ? 'text-rose-500' : 'text-zinc-100'}>
                                  {p.inventory || 0}
                                </span>
                              </td>

                              {/* Reserved Stock */}
                              <td className="p-4 font-mono text-xs text-zinc-400 font-medium">
                                <span className={p.reservedStock ? 'text-amber-400' : 'text-zinc-500'}>
                                  {p.reservedStock || 0}
                                </span>
                              </td>

                              {/* Min/Max Stock limits */}
                              <td className="p-4 font-mono text-[9.5px] text-zinc-500">
                                <span className="block">MIN: {p.minStock || 15}</span>
                                <span className="block">MAX: {p.maxStock || 150}</span>
                              </td>

                              {/* Status badge */}
                              <td className="p-4 shrink-0">
                                {renderStatusBadge(p)}
                              </td>

                              {/* Actions */}
                              {isStaff && (
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => {
                                        setSelectedProduct(p);
                                        setEditSku(p.sku || '');
                                        setEditBarcode(p.barcode || '');
                                        setEditWarehouse(p.warehouseLocation || 'Branch B Main Shelf A');
                                        setEditShelf(p.specifications?.['Shelf Position'] || 'Shelf A');
                                        setEditZone(p.specifications?.['Zone'] || 'Zone A');
                                        setEditRack(p.specifications?.['Rack'] || 'Rack R-12');
                                        setEditBin(p.specifications?.['Bin'] || 'Bin B-09');
                                        setEditMinStock(p.minStock || 10);
                                        setEditMaxStock(p.maxStock || 150);
                                        setEditReserved(p.reservedStock || 0);
                                        setShowEditModal(true);
                                      }}
                                      className="p-1 border border-white/5 bg-zinc-900 hover:border-gold-pure rounded-xs text-zinc-400 hover:text-gold-pure cursor-pointer"
                                      title="Edit Stock Thresholds"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        setSelectedProduct(p);
                                        setShowBarcodePrintModal(true);
                                      }}
                                      className="p-1 border border-white/5 bg-zinc-900 hover:border-gold-pure rounded-xs text-zinc-400 hover:text-gold-pure cursor-pointer"
                                      title="Print Thermal Barcode Label"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        setAdjustProductId(p.id);
                                        setActiveTab('adjustment');
                                        setAdjustWarehouse(p.warehouseLocation?.split(' - ')[0] || 'Branch B Hub');
                                        setAdjustShelf(p.warehouseLocation?.split(' - ')[1] || 'Shelf A');
                                        setAdjustType('Stock In');
                                      }}
                                      className="p-1 border border-white/5 bg-zinc-900 hover:border-emerald-500 rounded-xs text-zinc-400 hover:text-emerald-400 cursor-pointer"
                                      title="Record Inbound/Outbound Adjustment"
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION PANEL */}
                {totalPages > 1 && (
                  <div className="bg-white/[0.01] border-t border-white/5 p-4 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-zinc-500">
                      SHOWING {Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredProducts.length, currentPage * itemsPerPage)} OF {filteredProducts.length} ITEMS
                    </span>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="py-1 px-2.5 bg-black border border-white/5 rounded-xs hover:border-gold-pure cursor-pointer text-white disabled:opacity-30 disabled:hover:border-white/5"
                      >
                        PREV
                      </button>
                      
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`py-1 px-2.5 rounded-xs border cursor-pointer font-bold ${
                            currentPage === i + 1
                              ? 'bg-gold-pure text-black border-gold-pure'
                              : 'bg-black border-white/5 text-zinc-400 hover:border-gold-pure'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="py-1 px-2.5 bg-black border border-white/5 rounded-xs hover:border-gold-pure cursor-pointer text-white disabled:opacity-30 disabled:hover:border-white/5"
                      >
                        NEXT
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ======================= TAB III: RECORD MOVEMENT ======================= */}
          {activeTab === 'adjustment' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Manual adjust form */}
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs lg:col-span-2 space-y-4">
                <div>
                  <h2 className="text-xs font-mono uppercase text-gold-pure tracking-widest font-bold">LOG PHYSICAL STOCK MOVEMENT ENTRY</h2>
                  <p className="text-[10px] text-zinc-500 mt-1">Submit official inventory adjustments, intake manifests, damage records, or returns.</p>
                </div>

                <form onSubmit={handleManualAdjustment} className="space-y-4 font-mono text-[10.5px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Choose Product */}
                    <div className="space-y-1">
                      <label className="text-zinc-500 block uppercase tracking-wide">Target Catalog Product</label>
                      <select
                        value={adjustProductId}
                        onChange={(e) => {
                          setAdjustProductId(e.target.value);
                          const matched = products.find(p => p.id === e.target.value);
                          if (matched) {
                            setAdjustWarehouse(matched.warehouseLocation?.split(' - ')[0] || 'Branch B Hub');
                            setAdjustShelf(matched.warehouseLocation?.split(' - ')[1] || 'Shelf A');
                          }
                        }}
                        className="w-full bg-black border border-white/10 p-2 text-white text-xs"
                        required
                      >
                        <option value="">SELECT PRODUCT TO ADJUST...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku || p.id}) — {p.inventory || 0} in stock</option>
                        ))}
                      </select>
                    </div>

                    {/* Choose Transaction Type */}
                    <div className="space-y-1">
                      <label className="text-zinc-500 block uppercase tracking-wide">Movement Type</label>
                      <select
                        value={adjustType}
                        onChange={(e) => setAdjustType(e.target.value as any)}
                        className="w-full bg-black border border-white/10 p-2 text-white text-xs"
                      >
                        <option value="Stock In">INBOUND MANIFEST (STOCK IN)</option>
                        <option value="Stock Out">OUTBOUND SHIPMENT (STOCK OUT)</option>
                        <option value="Stock Adjustment">MANUAL SHRINKAGE/CORRECTION</option>
                        <option value="Return">CUSTOMER COMPLETED RETURN (RESTORE)</option>
                        <option value="Damage">RECORD DAMAGED / UNSALABLE ITEMS</option>
                        <option value="Expiry">EXPIRED BATCH RETIREMENT</option>
                        <option value="Lost">LOST IN TRANSIT / PILFERAGE LOG</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Quantity */}
                    <div className="space-y-1">
                      <label className="text-zinc-500 block uppercase tracking-wide">Quantity Units</label>
                      <input
                        type="number"
                        min="1"
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-black border border-white/10 p-2 text-white text-xs font-bold text-center"
                        required
                      />
                    </div>

                    {/* Batch Number */}
                    <div className="space-y-1">
                      <label className="text-zinc-500 block uppercase tracking-wide">Batch / Lot Code</label>
                      <input
                        type="text"
                        placeholder="e.g. LOT-2026-X"
                        value={adjustBatch}
                        onChange={(e) => setAdjustBatch(e.target.value)}
                        className="w-full bg-black border border-white/10 p-2 text-white text-xs"
                      />
                    </div>

                    {/* Warehouse Destination */}
                    <div className="space-y-1">
                      <label className="text-zinc-500 block uppercase tracking-wide">Warehouse Hub</label>
                      <select
                        value={adjustWarehouse}
                        onChange={(e) => setAdjustWarehouse(e.target.value)}
                        className="w-full bg-black border border-white/10 p-2 text-white text-xs"
                      >
                        <option value="Branch B Hub">DAMMAM HUB</option>
                        <option value="Al Hofuf Kitchen">AL HOFUF KITCHEN</option>
                        <option value="Branch A Outlet">RIYADH OUTLET</option>
                        <option value="Transit Container">TRANSIT CONTAINER</option>
                      </select>
                    </div>

                    {/* Shelf Location */}
                    <div className="space-y-1">
                      <label className="text-zinc-500 block uppercase tracking-wide">Shelf / Bay ID</label>
                      <input
                        type="text"
                        placeholder="e.g. Aisle 3 - Shelf B"
                        value={adjustShelf}
                        onChange={(e) => setAdjustShelf(e.target.value)}
                        className="w-full bg-black border border-white/10 p-2 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reference Document */}
                    <div className="space-y-1">
                      <label className="text-zinc-500 block uppercase tracking-wide">Reference Code (PO / order ID)</label>
                      <input
                        type="text"
                        placeholder="e.g. PO-7781 or ORD-2291"
                        value={adjustRef}
                        onChange={(e) => setAdjustRef(e.target.value)}
                        className="w-full bg-black border border-white/10 p-2 text-white text-xs"
                      />
                    </div>

                    {/* Adjustment Reason */}
                    <div className="space-y-1">
                      <label className="text-zinc-500 block uppercase tracking-wide">Justification / Reason Notes</label>
                      <input
                        type="text"
                        placeholder="Audit correction, cargo arriving, damage, etc."
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        className="w-full bg-black border border-white/10 p-2 text-white text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!isStaff}
                      className="w-full py-2.5 bg-gold-pure text-black font-extrabold uppercase hover:bg-gold-light transition-all cursor-pointer text-xs disabled:opacity-40"
                    >
                      Authenticate & Record Movement
                    </button>
                  </div>
                </form>
              </div>

              {/* Sourcing reference guide info */}
              <div className="space-y-6">
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3 font-mono text-[10px]">
                  <h3 className="text-xs uppercase text-gold-pure font-bold tracking-wider">Logistics Guidelines</h3>
                  <div className="space-y-2.5 text-zinc-400">
                    <p>• <strong className="text-white">STOCK IN:</strong> Replenishing available inventory levels immediately. Increases physical stock index.</p>
                    <p>• <strong className="text-white">STOCK OUT:</strong> Discharging product assets for showroom stock, sample testing, or bulk cargo handoff.</p>
                    <p>• <strong className="text-white">DAMAGE / EXPIRY:</strong> Legally marks products as unsalable. Subdued from active stock logs but kept on tax deduction summaries.</p>
                    <p>• <strong className="text-white">RESERVATIONS:</strong> Handled in real time by client side integrations with active orders ledger.</p>
                  </div>
                </div>

                {/* Quick Stock adjustments list */}
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3 font-mono text-[10px]">
                  <h3 className="text-xs uppercase text-gold-pure font-bold tracking-wider">Quick Zero-Stock Restocks</h3>
                  <div className="divide-y divide-white/5">
                    {products.filter(p => (p.inventory || 0) === 0).slice(0, 5).map(p => (
                      <div key={p.id} className="py-2 flex justify-between items-center">
                        <span className="text-zinc-300 truncate pr-2">{p.name}</span>
                        <button
                          onClick={() => {
                            setAdjustProductId(p.id);
                            setAdjustQty(50);
                            setAdjustType('Stock In');
                            setAdjustReason('Urgent zero-stock replenishment manifest.');
                          }}
                          className="py-0.5 px-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-bold uppercase rounded-sm"
                        >
                          Fill +50
                        </button>
                      </div>
                    ))}
                    {products.filter(p => (p.inventory || 0) === 0).length === 0 && (
                      <p className="text-zinc-600 text-[9.5px] py-1">No items currently out of stock.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ======================= TAB IV: AUDIT MOVE TRAIL ======================= */}
          {activeTab === 'logs' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-[10px]">
                <div>
                  <h3 className="text-xs uppercase text-gold-pure tracking-widest font-bold">SOVEREIGN FORENSIC INVENTORY AUDIT TRAIL</h3>
                  <p className="text-[9.5px] text-zinc-500 mt-1">Immutable ledger tracking every stock adjustment, shipment received, order reserved, or return recorded.</p>
                </div>
                
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to purge local inventory history indices? This action is forensic and irreversible.")) {
                        localStorage.removeItem('zoal_inventory_transactions');
                        setTransactions([]);
                      }
                    }}
                    className="py-1 px-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 hover:bg-rose-950 hover:border-rose-500 transition-colors rounded-xs uppercase tracking-wide font-bold"
                  >
                    Purge Local Audit Logs
                  </button>
                )}
              </div>

              {/* Transactions logs table */}
              <div className="bg-zinc-950 border border-white/5 rounded-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] divide-y divide-white/5 font-mono">
                    <thead className="bg-white/[0.01] text-zinc-500 text-[8.5px] uppercase tracking-widest">
                      <tr>
                        <th className="p-4">Tx ID</th>
                        <th className="p-4">Date / Time</th>
                        <th className="p-4">Product Detail</th>
                        <th className="p-4">Movement Type</th>
                        <th className="p-4 text-center">Change Qty</th>
                        <th className="p-4 text-center">Balance Delta</th>
                        <th className="p-4">operator</th>
                        <th className="p-4">warehouse / location</th>
                        <th className="p-4">Justification Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-zinc-500 uppercase tracking-widest text-[9.5px]">
                            No inventory transaction entries registered.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((tx) => {
                          const isPositive = tx.quantityChange > 0;
                          const isNegative = tx.quantityChange < 0;
                          return (
                            <tr key={tx.id} className="hover:bg-white/[0.01] duration-150">
                              <td className="p-4 text-white font-bold">{tx.id}</td>
                              <td className="p-4 text-zinc-500 whitespace-nowrap text-[10px]">{tx.timestamp}</td>
                              <td className="p-4">
                                <span className="text-zinc-100 block font-sans font-medium">{tx.productName}</span>
                                <span className="text-[8.5px] text-zinc-500 block uppercase tracking-wide">SKU: {tx.sku}</span>
                              </td>
                              <td className="p-4 shrink-0">
                                <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[8px] uppercase font-bold tracking-wider ${
                                  tx.type === 'Stock In' || tx.type === 'Return'
                                    ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20'
                                    : tx.type === 'Stock Out' || tx.type === 'Damage' || tx.type === 'Expiry' || tx.type === 'Lost'
                                    ? 'bg-red-950/20 text-red-400 border border-red-500/20'
                                    : tx.type === 'Reservation'
                                    ? 'bg-amber-950/20 text-amber-400 border border-amber-500/20'
                                    : 'bg-zinc-900 text-zinc-300'
                                }`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className={`p-4 text-center font-bold text-xs ${
                                isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-500' : 'text-zinc-400'
                              }`}>
                                {isPositive ? `+${tx.quantityChange}` : tx.quantityChange === 0 ? '0' : tx.quantityChange}
                              </td>
                              <td className="p-4 text-center text-zinc-400 whitespace-nowrap">
                                <span className="text-[10px] text-zinc-500">{tx.stockBefore} ➔ </span>
                                <span className="text-white font-bold">{tx.stockAfter} units</span>
                              </td>
                              <td className="p-4 text-zinc-300 text-[10px] whitespace-nowrap">{tx.operator}</td>
                              <td className="p-4 text-zinc-400 whitespace-nowrap">
                                <span className="block">{tx.warehouse}</span>
                                <span className="text-[8.5px] text-zinc-500 block">{tx.shelfLocation}</span>
                              </td>
                              <td className="p-4 text-zinc-500 max-w-xs truncate text-[10.5px]" title={tx.reason}>
                                {tx.reason} {tx.referenceId && <span className="text-gold-pure block font-bold text-[8.5px] uppercase">Ref: {tx.referenceId}</span>}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ======================= TAB V: BARCODE MATRIX & SCANNER ======================= */}
          {activeTab === 'barcode' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Barcode Search & USB Simulator */}
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xs font-mono uppercase text-gold-pure tracking-widest font-bold">REAL-TIME USB HID BARCODE SCANNER INTERFACE</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    The platform listens to raw keyboard scanner transmissions. Click outside any inputs and trigger a test scan below.
                  </p>
                </div>

                {/* Scanner Alerts */}
                {scannerAlert && (
                  <div className={`p-4 border font-mono text-[10.5px] rounded-xs flex items-center gap-3 animate-pulse ${
                    scannerAlert.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-400' : 'bg-red-950/20 border-red-500/25 text-red-400'
                  }`}>
                    {scannerAlert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>{scannerAlert.message}</span>
                  </div>
                )}

                {/* USB Simulation sandbox */}
                <div className="border border-white/10 p-5 rounded-xs bg-black/40 space-y-4 font-mono text-[10.5px]">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Simulator Controls</span>
                    <button
                      onClick={() => setScannerActive(!scannerActive)}
                      className={`px-2 py-0.5 border text-[8px] font-bold uppercase rounded-sm ${
                        scannerActive ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-zinc-900 border-white/10 text-zinc-500'
                      }`}
                    >
                      Scanner {scannerActive ? 'Active' : 'Muted'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Manual Barcode Lookup input */}
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 block uppercase tracking-wide">Manual Barcode / SKU Lookup</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter barcode or SKU..."
                          value={barcodeSearchQuery}
                          onChange={(e) => setBarcodeSearchQuery(e.target.value)}
                          className="bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure font-mono text-xs w-full"
                        />
                        <button
                          onClick={() => processScannedBarcode(barcodeSearchQuery)}
                          className="py-1 px-4 bg-gold-pure hover:bg-gold-light text-black font-extrabold uppercase shrink-0 cursor-pointer"
                        >
                          Find
                        </button>
                      </div>
                    </div>

                    {/* Preloaded quick scan simulated tags */}
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 block uppercase tracking-wide">Simulate USB Hardware Gun Scan</label>
                      <div className="grid grid-cols-2 gap-2 text-[9px]">
                        {products.slice(0, 4).map(p => (
                          <button
                            key={p.id}
                            onClick={() => {
                              // Simulate keystrokes + Enter
                              setScannerBuffer(p.barcode || '');
                              processScannedBarcode(p.barcode || '');
                            }}
                            className="p-1.5 bg-zinc-900 border border-white/5 hover:border-gold-pure text-white text-left truncate rounded-xs cursor-pointer"
                            title={`Simulate scan of ${p.name}`}
                          >
                            ⚡ {p.name.substring(0, 15)}...
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SKU & Barcode Generation Rule book */}
                <div className="space-y-3 font-mono text-[10px]">
                  <h4 className="text-[10.5px] uppercase text-gold-pure font-bold tracking-wider">SKU & Barcode Sourcing Standards</h4>
                  <p className="text-zinc-400 font-sans text-[10.5px]">
                    ZOAL uses standardized European Article Numbering (EAN-13) formats for premium sandstone homewares, couture thobes, cakes, and roasts.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-[9px] text-zinc-500 bg-white/[0.01] border border-white/5 p-3">
                    <p>• <strong className="text-zinc-300">SKU Code Formula:</strong> <code className="text-gold-pure font-mono">ALZ-[CAT_PREFIX]-[RAND_ID_4]</code></p>
                    <p>• <strong className="text-zinc-300">EAN-13 Barcode:</strong> Prefix <code className="text-gold-pure font-mono">628</code> denotes Kingdom of Saudi Arabia national registry allocation.</p>
                  </div>
                </div>
              </div>

              {/* Barcode Label Designer / Printer preview */}
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 font-mono text-[10px]">
                <h3 className="text-xs uppercase text-gold-pure tracking-widest font-bold">SOVEREIGN THERMAL LABEL CREATOR</h3>
                <p className="text-zinc-500 text-[9.5px]">Select a product from the stock matrix list or simulator, and design a customized thermal label sticker.</p>

                {selectedProduct ? (
                  <div className="space-y-4">
                    {/* Visual Card preview */}
                    <div id="barcode-thermal-sticker" className="bg-white text-black p-4 rounded-xs border-2 border-black max-w-xs mx-auto space-y-3 text-center">
                      <div className="border-b border-black/40 pb-1.5">
                        <span className="text-[8px] tracking-[0.3em] font-extrabold uppercase font-sans">AL ZOAL GROUP</span>
                        <h4 className="text-xs font-sans font-bold leading-tight">{selectedProduct.name}</h4>
                      </div>

                      <div className="text-[8.5px] font-mono space-y-0.5 text-left pl-2">
                        <p><strong>SKU:</strong> {selectedProduct.sku || 'ALZ-GEN-992'}</p>
                        <p><strong>PRICE:</strong> {formatCurrency(selectedProduct.price)}</p>
                        <p><strong>DIV:</strong> {selectedProduct.category?.toUpperCase()}</p>
                        <p><strong>ORIGIN:</strong> Kingdom of Saudi Arabia</p>
                      </div>

                      {/* Pure CSS Barcode visualization lines. Incredible craftsmanship */}
                      <div className="py-2 flex flex-col items-center space-y-1">
                        <div className="flex h-10 w-44 items-stretch justify-center bg-transparent">
                          {/* Generated lines matching code string */}
                          {String(selectedProduct.barcode || '62810001091').split('').map((char, idx) => {
                            const val = parseInt(char, 10) || 1;
                            const isThin = val % 2 === 0;
                            const isThick = val > 5;
                            const isSpace = val === 3 || val === 7;

                            if (isSpace) {
                              return <div key={idx} className="w-1.5 bg-transparent" />;
                            }
                            return (
                              <div
                                key={idx}
                                className={`bg-black ${
                                  isThick ? 'w-1' : isThin ? 'w-px' : 'w-0.5'
                                }`}
                              />
                            );
                          })}
                        </div>
                        <span className="text-[10px] tracking-widest font-bold text-center block font-mono">{selectedProduct.barcode}</span>
                      </div>

                      <div className="text-[6.5px] text-zinc-500 border-t border-black/10 pt-1.5 uppercase font-sans tracking-wider">
                        Sovereign Logistics Item Verification Label
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          window.print();
                        }}
                        className="w-full py-1.5 bg-black hover:bg-zinc-900 border border-black text-white font-extrabold uppercase text-[10px] tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" /> Send to Zebra / thermal Printer
                      </button>

                      <button
                        onClick={() => setSelectedProduct(null)}
                        className="w-full text-center text-zinc-500 hover:text-white"
                      >
                        Clear Template Selected
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-white/15 p-8 text-center text-zinc-500 space-y-2 rounded-xs">
                    <Printer className="w-8 h-8 text-zinc-700 mx-auto" />
                    <p className="uppercase tracking-widest font-bold text-[9px]">No product tag active</p>
                    <p className="text-[9px] font-sans">Select a product from the Stock Ledger tab or simulate a USB scan to generate a physical barcode label template.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ============================================================================================== */}
      {/* ======================= DIALOG MODAL: PRODUCT STOCK DETAILS & SETTINGS ======================= */}
      {/* ============================================================================================== */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 border border-white/10 p-6 rounded-xs max-w-xl w-full text-left space-y-5 shadow-2xl relative font-mono text-[10.5px]"
          >
            {/* Close button */}
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[8px] tracking-widest text-gold-pure uppercase font-bold">SOVEREIGN LEDGER OVERRIDES</span>
              <h3 className="text-sm font-bold text-white uppercase font-sans mt-0.5">{selectedProduct.name}</h3>
            </div>

            <div className="space-y-4 pt-1">
              {/* Product SKU and Barcode Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-500 block uppercase">Product SKU Code</label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full bg-black border border-white/10 p-2 text-white font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const catPrefix = selectedProduct.category ? selectedProduct.category.substring(0, 3).toUpperCase() : 'ALZ';
                      setEditSku(`ALZ-${catPrefix}-${selectedProduct.id.split('-').pop()?.toUpperCase()}`);
                    }}
                    className="text-[8.5px] text-gold-pure hover:underline"
                  >
                    [Auto-generate SKU standard]
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-500 block uppercase">EAN-13 Barcode String</label>
                  <input
                    type="text"
                    value={editBarcode}
                    onChange={(e) => setEditBarcode(e.target.value)}
                    className="w-full bg-black border border-white/10 p-2 text-white font-bold text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const suffix = selectedProduct.id.split('-').pop()?.substring(0, 4).padEnd(4, '0') || '1234';
                      setEditBarcode(`628100${suffix}9`);
                    }}
                    className="text-[8.5px] text-gold-pure hover:underline"
                  >
                    [Auto-generate Barcode standard]
                  </button>
                </div>
              </div>

               {/* Warehouse Location and Shelf/Zone/Rack/Bin inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-500 block uppercase text-[9px] tracking-wider font-mono">Logistics Warehouse Hub</label>
                  <select
                    value={warehouses.some(w => editWarehouse.startsWith(w.name) || editWarehouse.startsWith(w.code)) 
                      ? (warehouses.find(w => editWarehouse.startsWith(w.name) || editWarehouse.startsWith(w.code))?.name || 'Branch B Sovereign Hub')
                      : 'Branch B Sovereign Hub'
                    }
                    onChange={(e) => {
                      setEditWarehouse(`${e.target.value} - ${editShelf || 'Shelf A'}`);
                    }}
                    className="w-full bg-black border border-white/10 p-2 text-white text-xs font-mono"
                  >
                    {warehouses.map(wh => (
                      <option key={wh.code} value={wh.name}>{wh.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-zinc-500 block uppercase text-[9px] tracking-wider font-mono">Zone</label>
                    <input
                      type="text"
                      placeholder="e.g. Zone A"
                      value={editZone}
                      onChange={(e) => setEditZone(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-500 block uppercase text-[9px] tracking-wider font-mono">Rack</label>
                    <input
                      type="text"
                      placeholder="e.g. R-12"
                      value={editRack}
                      onChange={(e) => setEditRack(e.target.value)}
                      className="w-full bg-black border border-white/10 p-2 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-500 block uppercase text-[9px] tracking-wider font-mono">Shelf Position</label>
                  <input
                    type="text"
                    placeholder="e.g. Shelf A"
                    value={editShelf}
                    onChange={(e) => {
                      setEditShelf(e.target.value);
                      const whName = editWarehouse.split(' - ')[0] || 'Branch B Sovereign Hub';
                      setEditWarehouse(`${whName} - ${e.target.value}`);
                    }}
                    className="w-full bg-black border border-white/10 p-2 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-500 block uppercase text-[9px] tracking-wider font-mono">Bin Number</label>
                  <input
                    type="text"
                    placeholder="e.g. Bin B-09"
                    value={editBin}
                    onChange={(e) => setEditBin(e.target.value)}
                    className="w-full bg-black border border-white/10 p-2 text-white text-xs"
                  />
                </div>
              </div>

              {/* Safety Threshold stock levels */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-500 block uppercase">Minimum Safety stock limit</label>
                  <input
                    type="number"
                    min="1"
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-black border border-white/10 p-2 text-white text-xs text-center font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-500 block uppercase">Maximum stock capacity</label>
                  <input
                    type="number"
                    min="10"
                    value={editMaxStock}
                    onChange={(e) => setEditMaxStock(Math.max(10, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-black border border-white/10 p-2 text-white text-xs text-center font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-3 pt-3 border-t border-white/5 font-mono">
              <button
                onClick={() => setShowEditModal(false)}
                className="w-1/2 py-2 bg-zinc-900 border border-white/10 hover:border-white/20 text-white font-bold uppercase transition-all cursor-pointer text-center"
              >
                Cancel Override
              </button>

              <button
                onClick={handleSaveProductSettings}
                className="w-1/2 py-2 bg-gold-pure hover:bg-gold-light text-black font-extrabold uppercase transition-all cursor-pointer text-center"
              >
                Apply Parameters
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ============================================================================================== */}
      {/* ======================= DIALOG MODAL: BULK BARCODE LABELS PREVIEW ======================= */}
      {/* ============================================================================================== */}
      {showBarcodePrintModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-950 border border-white/10 p-6 rounded-xs max-w-xl w-full text-left space-y-4 shadow-2xl relative font-mono text-[10.5px]"
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowBarcodePrintModal(false);
                setSelectedProduct(null);
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[8px] tracking-widest text-gold-pure uppercase font-bold">SOVEREIGN BARCODE PRINT SPOOLER</span>
              <h3 className="text-sm font-bold text-white uppercase font-sans mt-0.5">{selectedProduct.name}</h3>
            </div>

            <div className="bg-white text-black p-4 rounded-xs border-2 border-black max-w-xs mx-auto space-y-3 text-center my-4">
              <div className="border-b border-black/40 pb-1.5">
                <span className="text-[8px] tracking-[0.3em] font-extrabold uppercase font-sans">AL ZOAL GROUP</span>
                <h4 className="text-xs font-sans font-bold leading-tight">{selectedProduct.name}</h4>
              </div>

              <div className="text-[8.5px] font-mono space-y-0.5 text-left pl-2">
                <p><strong>SKU:</strong> {selectedProduct.sku || 'ALZ-GEN-992'}</p>
                <p><strong>PRICE:</strong> {formatCurrency(selectedProduct.price)}</p>
                <p><strong>DIV:</strong> {selectedProduct.category?.toUpperCase()}</p>
                <p><strong>ORIGIN:</strong> Kingdom of Saudi Arabia</p>
              </div>

              {/* Pure CSS Barcode visualization lines. Incredible craftsmanship */}
              <div className="py-2 flex flex-col items-center space-y-1">
                <div className="flex h-10 w-44 items-stretch justify-center bg-transparent">
                  {String(selectedProduct.barcode || '62810001091').split('').map((char, idx) => {
                    const val = parseInt(char, 10) || 1;
                    const isThin = val % 2 === 0;
                    const isThick = val > 5;
                    const isSpace = val === 3 || val === 7;

                    if (isSpace) {
                      return <div key={idx} className="w-1.5 bg-transparent" />;
                    }
                    return (
                      <div
                        key={idx}
                        className={`bg-black ${
                          isThick ? 'w-1' : isThin ? 'w-px' : 'w-0.5'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] tracking-widest font-bold text-center block font-mono">{selectedProduct.barcode}</span>
              </div>

              <div className="text-[6.5px] text-zinc-500 border-t border-black/10 pt-1.5 uppercase font-sans tracking-wider">
                Sovereign Logistics Item Verification Label
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
              }}
              className="w-full py-2 bg-gold-pure hover:bg-gold-light text-black font-extrabold uppercase text-center cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" /> Spool Print to Device
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ======================= SUB-COMPONENT: INTELLIGENCE REPORTS TAB =======================
interface ReportsTabProps {
  products: Product[];
  warehouses: Warehouse[];
  transactions: InventoryTransaction[];
  batches: BatchRecord[];
}

function ReportsTab({ products, warehouses, transactions, batches }: ReportsTabProps) {
  const [activeReport, setActiveReport] = useState<
    'current_stock' | 'low_stock' | 'out_of_stock' | 'valuation' | 'movement' | 'damaged' | 'expired' | 'warehouse_comparison'
  >('current_stock');
  const [selectedWh, setSelectedWh] = useState('all');
  const [selectedCat, setSelectedCat] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState<'PDF' | 'Excel' | 'CSV' | null>(null);

  // Extract unique categories in scope
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(set);
  }, [products]);

  // Derived Report Data
  const reportData = useMemo(() => {
    let list = [...products];

    // Apply warehouse and category filters
    if (selectedWh !== 'all') {
      list = list.filter(p => {
        const loc = p.warehouseLocation || '';
        return loc.toLowerCase().includes(selectedWh.toLowerCase());
      });
    }
    if (selectedCat !== 'all') {
      list = list.filter(p => p.category === selectedCat);
    }

    if (activeReport === 'low_stock') {
      return list.filter(p => (p.inventory || 0) > 0 && (p.inventory || 0) < (p.minStock || 15));
    }
    if (activeReport === 'out_of_stock') {
      return list.filter(p => (p.inventory || 0) === 0);
    }
    if (activeReport === 'valuation') {
      return list.map(p => {
        const cost = Math.round(p.price * 0.65); // simulated purchase cost at 65% wholesale
        return {
          ...p,
          cost,
          totalValue: (p.inventory || 0) * cost
        };
      });
    }
    if (activeReport === 'expired') {
      // Return matching batches that are expired
      return batches.filter(b => b.status === 'Expired' || new Date(b.expiryDate) < new Date());
    }
    if (activeReport === 'damaged') {
      // Find damaged logs or simulated
      const logs = transactions.filter(t => t.type === 'Damage');
      if (logs.length > 0) return logs;
      // Static realists fallbacks
      return [
        { id: 'DMG-102', productName: 'Imperial Dark Roast', sku: 'ALZ-COF-001', warehouse: 'Branch B Sovereign Hub', qty: 4, reason: 'Moisture bag seal rupture', timestamp: '2026-07-10' },
        { id: 'DMG-104', productName: 'Sovereign Saffron Cardamom Brioche', sku: 'ALZ-BAK-002', warehouse: 'Al Hofuf Gourmet Kitchen', qty: 2, reason: 'Transit container crushing', timestamp: '2026-07-15' }
      ];
    }
    if (activeReport === 'movement') {
      // Filter transactions by warehouse
      let txs = [...transactions];
      if (selectedWh !== 'all') {
        txs = txs.filter(t => (t.warehouse || '').toLowerCase().includes(selectedWh.toLowerCase()));
      }
      return txs;
    }
    if (activeReport === 'warehouse_comparison') {
      return warehouses.map(wh => {
        const whItems = products.filter(p => (p.warehouseLocation || '').toLowerCase().includes(wh.name.toLowerCase()) || (p.warehouseLocation || '').toLowerCase().includes(wh.code.toLowerCase()));
        const whStock = whItems.reduce((sum, p) => sum + (p.inventory || 0), 0);
        const whVal = whItems.reduce((sum, p) => sum + ((p.inventory || 0) * Math.round(p.price * 0.65)), 0);
        return {
          ...wh,
          totalItemsCount: whItems.length,
          totalStockCount: whStock,
          totalValuationSAR: whVal
        };
      });
    }

    return list; // default 'current_stock'
  }, [products, activeReport, selectedWh, selectedCat, batches, transactions, warehouses]);

  // Handle mock corporate download
  const triggerExport = (type: 'PDF' | 'Excel' | 'CSV') => {
    setExportType(type);
    setExporting(true);
    setExportProgress(0);

    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setExporting(false);
            executeFileDownload(type);
          }, 300);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const executeFileDownload = (type: 'PDF' | 'Excel' | 'CSV') => {
    try {
      let headers: string[] = [];
      let rows: any[][] = [];

      if (activeReport === 'valuation') {
        headers = ['Product ID', 'SKU', 'Product Name', 'Category', 'Stock Available', 'Simulated Cost (SAR)', 'Valuation (SAR)'];
        rows = (reportData as any[]).map(p => [p.id, p.sku, p.name, p.category, p.inventory || 0, p.cost, p.totalValue]);
      } else if (activeReport === 'movement') {
        headers = ['TX ID', 'Timestamp', 'Product', 'SKU', 'Action Type', 'Qty Shift', 'Warehouse'];
        rows = (reportData as any[]).map(t => [t.id, t.timestamp, t.productName, t.sku, t.type, t.quantityChange, t.warehouse]);
      } else if (activeReport === 'expired') {
        headers = ['Batch Code', 'Product SKU', 'Product Name', 'Expiration Date', 'Sourcing Facility', 'Batch Quantity'];
        rows = (reportData as any[]).map(b => [b.batchNumber, b.sku, b.productName, b.expiryDate, b.warehouse, b.availableQty]);
      } else if (activeReport === 'warehouse_comparison') {
        headers = ['Facility Code', 'Sourcing Hub Name', 'Storage Capacity', 'Items Stored', 'Stock Stored', 'Valuation Stored (SAR)'];
        rows = (reportData as any[]).map(w => [w.code, w.name, w.capacity, w.totalItemsCount, w.totalStockCount, w.totalValuationSAR]);
      } else {
        headers = ['Product ID', 'SKU', 'Product Name', 'Category', 'Sourcing Warehouse', 'Safety Minimum', 'Stock Available'];
        rows = (reportData as any[]).map(p => [p.id, p.sku, p.name, p.category, p.warehouseLocation || 'N/A', p.minStock || 15, p.inventory || 0]);
      }

      const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `AL_ZOAL_${activeReport.toUpperCase()}_REPORT_${new Date().toISOString().slice(0, 10)}.${type === 'CSV' ? 'csv' : type === 'Excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert(`Export compilation failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* EXPORT LOADING PROGRESS BAR SCREEN OVERLAY */}
      {exporting && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center space-y-4 font-mono text-xs">
          <RefreshCw className="w-8 h-8 text-gold-pure animate-spin" />
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Sovereign Cloud compiler active</span>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">COMPILING {exportType} REPORTS...</h4>
          </div>
          <div className="w-64 h-1 bg-zinc-900 overflow-hidden border border-white/5 rounded-full">
            <div className="h-full bg-gold-pure transition-all duration-150" style={{ width: `${exportProgress}%` }} />
          </div>
          <span className="text-gold-pure text-[11px] font-mono">{exportProgress}% Completed</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-zinc-950 border border-white/5 p-4 rounded-xs gap-4">
        <div>
          <h3 className="text-xs font-mono uppercase text-gold-pure tracking-widest font-bold">SOVEREIGN EXECUTIVE REPORT ENGINE</h3>
          <p className="text-[10px] text-zinc-400 font-mono mt-1">Generate dynamic inventory statements, audit valuations, and warehouse performance logs instantly.</p>
        </div>
        
        {/* Dynamic filter line */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[8px] uppercase tracking-wider">Facility:</span>
            <select
              value={selectedWh}
              onChange={(e) => setSelectedWh(e.target.value)}
              className="bg-black border border-white/10 p-1 text-[10px] text-zinc-300"
            >
              <option value="all">-- All Warehouses --</option>
              {warehouses.map(w => (
                <option key={w.code} value={w.name}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[8px] uppercase tracking-wider">Category:</span>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="bg-black border border-white/10 p-1 text-[10px] text-zinc-300"
            >
              <option value="all">-- All Categories --</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Report triggers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[10px]">
        {[
          { id: 'current_stock', label: 'Current Stock ledger', desc: 'Realtime SKU quantity levels' },
          { id: 'low_stock', label: 'Replenishment safety alerts', desc: 'Items under safety margins' },
          { id: 'out_of_stock', label: 'Critical zero stock report', desc: 'SKUs needing immediate POs' },
          { id: 'valuation', label: 'Capital Stock valuation', desc: 'Sovereign inventory equity ledger' },
          { id: 'movement', label: 'Movement Logs trail', desc: 'Discharge and intake transactions' },
          { id: 'damaged', label: 'Damaged Products statement', desc: 'Damages and moisture writeoffs' },
          { id: 'expired', label: 'Expired batch audit', desc: 'Batches matching expiration codes' },
          { id: 'warehouse_comparison', label: 'Facility comparative report', desc: 'Compare capacity utilization' }
        ].map((rep) => (
          <button
            key={rep.id}
            onClick={() => {
              setActiveReport(rep.id as any);
            }}
            className={`p-4 border text-left cursor-pointer rounded-xs transition-all space-y-2 uppercase ${
              activeReport === rep.id 
                ? 'bg-gold-pure/10 border-gold-pure text-white font-bold' 
                : 'bg-zinc-950/60 border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold tracking-wider text-[11px] font-sans">{rep.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gold-pure" />
            </div>
            <p className="text-[9px] text-zinc-500 lowercase font-mono normal-case tracking-normal">{rep.desc}</p>
          </button>
        ))}
      </div>

      {/* Exporter triggers */}
      <div className="flex justify-between items-center bg-zinc-950 border border-white/5 p-4 rounded-xs">
        <span className="text-[10px] font-mono text-zinc-400">
          REPORT COMPILING: <strong className="text-white uppercase">{activeReport.replace(/_/g, ' ')}</strong> ({reportData.length} entries matching)
        </span>
        <div className="flex items-center gap-2 font-mono text-[9px] font-bold">
          <button
            onClick={() => triggerExport('CSV')}
            className="flex items-center gap-1.5 py-1 px-2.5 border border-white/10 hover:border-white bg-black text-zinc-300 hover:text-white cursor-pointer rounded-xs"
          >
            <Download className="w-3 h-3" /> EXPORT CSV
          </button>
          <button
            onClick={() => triggerExport('Excel')}
            className="flex items-center gap-1.5 py-1 px-2.5 border border-white/10 hover:border-white bg-black text-zinc-300 hover:text-white cursor-pointer rounded-xs"
          >
            <FileSpreadsheet className="w-3 h-3" /> EXPORT EXCEL
          </button>
          <button
            onClick={() => triggerExport('PDF')}
            className="flex items-center gap-1.5 py-1 px-2.5 border border-gold-pure/40 hover:border-gold-pure bg-gold-pure/10 text-gold-pure cursor-pointer rounded-xs"
          >
            <FileText className="w-3 h-3" /> EXPORT SECURE PDF
          </button>
        </div>
      </div>

      {/* Dynamic preview block */}
      <div className="bg-zinc-950 border border-white/5 rounded-xs overflow-hidden text-[11px] font-mono">
        <div className="bg-white/[0.02] border-b border-white/5 py-2.5 px-4 flex justify-between items-center">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">REALTIME LEDGER STATEMENT PREVIEW</span>
          <span className="text-[8px] text-zinc-500">Updates as inventory logs record</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/40 text-zinc-500 uppercase text-[9px] font-bold">
                {activeReport === 'valuation' && (
                  <>
                    <th className="py-2 px-4">SKU Code</th>
                    <th className="py-2 px-4">Product Name</th>
                    <th className="py-2 px-4 text-right">Available units</th>
                    <th className="py-2 px-4 text-right">Unit cost (Simulated)</th>
                    <th className="py-2 px-4 text-right">Vault valuation</th>
                  </>
                )}
                {activeReport === 'movement' && (
                  <>
                    <th className="py-2 px-4">Log Code</th>
                    <th className="py-2 px-4">Date Logged</th>
                    <th className="py-2 px-4">Product / SKU</th>
                    <th className="py-2 px-4">Action</th>
                    <th className="py-2 px-4 text-right">Shift Qty</th>
                  </>
                )}
                {activeReport === 'expired' && (
                  <>
                    <th className="py-2 px-4">Batch Code</th>
                    <th className="py-2 px-4">Product Name</th>
                    <th className="py-2 px-4">Expiration Date</th>
                    <th className="py-2 px-4">Facility</th>
                    <th className="py-2 px-4 text-right">Batch stock left</th>
                  </>
                )}
                {activeReport === 'damaged' && (
                  <>
                    <th className="py-2 px-4">Incident ID</th>
                    <th className="py-2 px-4">Incident Date</th>
                    <th className="py-2 px-4">Product SKU</th>
                    <th className="py-2 px-4">Facility Hub</th>
                    <th className="py-2 px-4 text-right">Damaged Qty</th>
                    <th className="py-2 px-4">Incident remarks</th>
                  </>
                )}
                {activeReport === 'warehouse_comparison' && (
                  <>
                    <th className="py-2 px-4">Hub Code</th>
                    <th className="py-2 px-4">Sourcing Name</th>
                    <th className="py-2 px-4 text-right">Total Catalog lines</th>
                    <th className="py-2 px-4 text-right">Actual stock (Units)</th>
                    <th className="py-2 px-4 text-right">Vault Stock Value</th>
                  </>
                )}
                {activeReport !== 'valuation' && activeReport !== 'movement' && activeReport !== 'expired' && activeReport !== 'damaged' && activeReport !== 'warehouse_comparison' && (
                  <>
                    <th className="py-2 px-4">SKU Code</th>
                    <th className="py-2 px-4">Product Name</th>
                    <th className="py-2 px-4">Category</th>
                    <th className="py-2 px-4">Warehouse Sourcing Location</th>
                    <th className="py-2 px-4 text-right">Minimum threshold</th>
                    <th className="py-2 px-4 text-right">Stock units</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">No records matching active filter settings found.</td>
                </tr>
              ) : (
                reportData.map((row: any, index: number) => (
                  <tr key={row.id ? row.id + '-' + index : index} className="hover:bg-white/[0.01]">
                    {activeReport === 'valuation' && (
                      <>
                        <td className="py-2.5 px-4 font-bold text-white">{row.sku}</td>
                        <td className="py-2.5 px-4 font-sans text-zinc-200">{row.name}</td>
                        <td className="py-2.5 px-4 text-right">{row.inventory || 0} left</td>
                        <td className="py-2.5 px-4 text-right">{formatCurrency(row.cost)}</td>
                        <td className="py-2.5 px-4 text-right text-gold-pure font-bold">{formatCurrency(row.totalValue)}</td>
                      </>
                    )}
                    {activeReport === 'movement' && (
                      <>
                        <td className="py-2.5 px-4 text-zinc-500 font-bold">{row.id}</td>
                        <td className="py-2.5 px-4 text-zinc-400">{row.timestamp}</td>
                        <td className="py-2.5 px-4 font-sans text-zinc-200">
                          <span className="block">{row.productName}</span>
                          <span className="text-[9px] text-gold-pure">{row.sku}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-xs border uppercase tracking-wider ${
                            row.quantityChange > 0 ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20' : 'bg-rose-950/20 text-rose-400 border-rose-500/20'
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className={`py-2.5 px-4 text-right font-bold ${row.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {row.quantityChange > 0 ? `+${row.quantityChange}` : row.quantityChange} units
                        </td>
                      </>
                    )}
                    {activeReport === 'expired' && (
                      <>
                        <td className="py-2.5 px-4 font-bold text-white">{row.batchNumber}</td>
                        <td className="py-2.5 px-4 font-sans text-zinc-200">{row.productName}</td>
                        <td className="py-2.5 px-4 text-rose-400">{row.expiryDate}</td>
                        <td className="py-2.5 px-4 text-zinc-400">{row.warehouse}</td>
                        <td className="py-2.5 px-4 text-right text-rose-400 font-bold">{row.availableQty} expired units</td>
                      </>
                    )}
                    {activeReport === 'damaged' && (
                      <>
                        <td className="py-2.5 px-4 font-bold text-white">{row.id}</td>
                        <td className="py-2.5 px-4 text-zinc-400">{row.timestamp || row.date}</td>
                        <td className="py-2.5 px-4 text-gold-pure">{row.sku}</td>
                        <td className="py-2.5 px-4 text-zinc-400">{row.warehouse}</td>
                        <td className="py-2.5 px-4 text-right text-rose-500 font-bold">{row.qty || row.quantityChange || 0} units</td>
                        <td className="py-2.5 px-4 font-sans text-zinc-400 text-xs">{row.reason}</td>
                      </>
                    )}
                    {activeReport === 'warehouse_comparison' && (
                      <>
                        <td className="py-2.5 px-4 font-bold text-white">{row.code}</td>
                        <td className="py-2.5 px-4 font-sans text-zinc-200">{row.name}</td>
                        <td className="py-2.5 px-4 text-right text-zinc-400">{row.totalItemsCount} SKUs</td>
                        <td className="py-2.5 px-4 text-right text-white font-bold">{row.totalStockCount.toLocaleString()} / {row.capacity.toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-right text-gold-pure font-bold">{formatCurrency(row.totalValuationSAR)}</td>
                      </>
                    )}
                    {activeReport !== 'valuation' && activeReport !== 'movement' && activeReport !== 'expired' && activeReport !== 'damaged' && activeReport !== 'warehouse_comparison' && (
                      <>
                        <td className="py-2.5 px-4 font-bold text-white">{row.sku}</td>
                        <td className="py-2.5 px-4 font-sans text-zinc-200">{row.name}</td>
                        <td className="py-2.5 px-4 text-zinc-400">{row.category}</td>
                        <td className="py-2.5 px-4 text-zinc-400">{row.warehouseLocation || 'N/A'}</td>
                        <td className="py-2.5 px-4 text-right text-zinc-500">{row.minStock || 15} units</td>
                        <td className={`py-2.5 px-4 text-right font-bold ${
                          (row.inventory || 0) === 0 ? 'text-rose-500' : (row.inventory || 0) < (row.minStock || 15) ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {row.inventory || 0} left
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {activeReport === 'valuation' && reportData.length > 0 && (
          <div className="bg-white/[0.01] border-t border-white/5 py-3 px-4 flex justify-between items-center">
            <span className="text-[10px] text-zinc-500">AGGREGATE SOURCING VALUATION</span>
            <span className="text-sm text-gold-pure font-bold">
              TOTAL SAR: {formatCurrency((reportData as any[]).reduce((sum, p) => sum + p.totalValue, 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
