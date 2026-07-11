import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ArrowLeft, 
  FileText, 
  MessageSquare, 
  ShoppingBag, 
  Check, 
  Clock, 
  MapPin, 
  Truck, 
  AlertCircle, 
  Mail, 
  FileCheck, 
  Calendar, 
  User, 
  DollarSign, 
  Download, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Phone,
  Printer,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Order } from '../types';
import { formatCurrency } from '../utils';

interface TrackOrderProps {
  orders: Order[];
  setCurrentPage: (page: string) => void;
  isEmbedded?: boolean;
}

export default function TrackOrder({ orders, setCurrentPage, isEmbedded = false }: TrackOrderProps) {
  const { i18n, t } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Localization strings
  const tr = {
    title: isAr ? 'تتبع طلبك الفاخر' : 'Track Your Order',
    subtitle: isAr 
      ? 'أدخل بيانات طلبك الفاخر لتتبع تقدم التنفيذ والتوصيل الفوري لروائع زول الخاصة بك.' 
      : 'Enter your luxury credentials to track the real-time fulfillment and delivery progress of your ZOAL treasures.',
    orderNum: isAr ? 'رقم الطلب' : 'Order Number',
    orderNumPlaceholder: isAr ? 'مثال: ZL-9871' : 'e.g., ZL-9871',
    email: isAr ? 'البريد الإلكتروني' : 'Email Address',
    emailPlaceholder: isAr ? 'مثال: alzoal3003@gmail.com' : 'e.g., alzoal3003@gmail.com',
    btnTrack: isAr ? 'تتبع طلبك الآن' : 'Track Order',
    btnTracking: isAr ? 'جاري البحث في السجلات...' : 'Searching archives...',
    quickDemo: isAr ? 'العروض التجريبية السريعة' : 'Quick Demo Links',
    orSelectDemo: isAr ? 'اختر أحد طلبات العرض للتتبع الفوري:' : 'Select a demo order to track immediately:',
    notFound: isAr 
      ? 'عذراً، لم نجد أي طلب يطابق البيانات المدخلة. يرجى التحقق وإعادة المحاولة.' 
      : 'We could not locate an order matching those details. Please check your credentials and try again.',
    orderStatusHeader: isAr ? 'حالة الشحن والتتبع الفوري' : 'Fulfillment & Real-Time Tracking',
    backToStore: isAr ? 'العودة للمتجر الفاخر' : 'Back to Store',
    trackAnother: isAr ? 'تتبع طلب آخر' : 'Track Another Order',
    downloadInvoice: isAr ? 'تحميل الفاتورة' : 'Download Invoice',
    contactSupport: isAr ? 'الاتصال بالدعم الفني' : 'Contact Support',
    
    // Order fields
    orderId: isAr ? 'معرّف الطلب' : 'Order Identifier',
    orderDate: isAr ? 'تاريخ الطلب' : 'Order Date',
    customerName: isAr ? 'اسم العميل المعتمد' : 'Authorized Customer',
    paymentStatus: isAr ? 'حالة الدفع' : 'Payment Status',
    shippingStatus: isAr ? 'حالة الشحن' : 'Shipping Status',
    courierName: isAr ? 'شريك التوصيل الخاص' : 'Courier Partner',
    trackingNumber: isAr ? 'رقم التتبع الدولي' : 'Tracking Number',
    estDelivery: isAr ? 'تاريخ التوصيل المتوقع' : 'Estimated Delivery',
    shippingAddress: isAr ? 'عنوان التوصيل المسجل' : 'Shipping Address',
    orderedProducts: isAr ? 'الروائع والقطع المطلوبة' : 'Ordered Treasures',
    qty: isAr ? 'الكمية:' : 'Qty:',
    option: isAr ? 'الخيار:' : 'Option:',
    totalAmount: isAr ? 'المبلغ الإجمالي الموثق' : 'Total Certified Amount',
    subtotal: isAr ? 'المجموع الفرعي' : 'Subtotal',
    shippingFee: isAr ? 'أجور الشحن الفاخر' : 'Premium Shipping',
    discount: isAr ? 'الخصومات المطبقة' : 'Applied Privileges',
    
    // Notification indicators
    emailSent: isAr ? 'تم إرسال بريد التأكيد الإلكتروني' : 'Fulfillment Email Dispatched',
    invoiceSent: isAr ? 'تم إرسال الفاتورة الضريبية للبريد' : 'Tax Invoice Sent to Email',
    emailSentDesc: isAr ? 'تم إرسال إشعار تتبع مباشر على بريدك' : 'Live tracking notifications are active for this order',
    invoiceSentDesc: isAr ? 'تم إرسال الفاتورة الإلكترونية المعتمدة' : 'A formal certified digital invoice was emailed',

    // Timeline stages
    timeline: [
      { key: 'confirmed', label: isAr ? 'تأكيد الطلب' : 'Order Confirmed', desc: isAr ? 'تم استلام وتوثيق طلبك بنجاح' : 'Order received and payment certified' },
      { key: 'preparing', label: isAr ? 'قيد التحضير' : 'Preparing', desc: isAr ? 'نقوم بتحضير وتجهيز منتجاتك الفاخرة' : 'Assembling and fresh roasting products' },
      { key: 'packed', label: isAr ? 'تم التغليف' : 'Packed', desc: isAr ? 'تم تغليف طلبك في صندوق زول المخملي' : 'Secured and packed in our velvet giftbox' },
      { key: 'shipped', label: isAr ? 'تم الشحن' : 'Shipped', desc: isAr ? 'تم تسليم الشحنة لشركة التوصيل الفاخر' : 'Dispatched with premium logistic courier' },
      { key: 'out_delivery', label: isAr ? 'خارج للتوصيل' : 'Out for Delivery', desc: isAr ? 'المندوب قيد توصيل طلبك الآن لعنوانك' : 'Local courier is en route to your address' },
      { key: 'delivered', label: isAr ? 'تم التوصيل' : 'Delivered', desc: isAr ? 'تم توصيل الروائع وتسليمها بسلام' : 'Fulfillment completed and package received' }
    ],

    // Invoice modal
    invoiceTitle: isAr ? 'فاتورة زول الإلكترونية المعتمدة' : 'ZOAL Certified Tax Invoice',
    invoiceSubtitle: isAr ? 'سجل المعاملة المالية الرسمي لعملاء زول المميزين' : 'Official certified financial transaction ledger',
    vatNo: isAr ? 'الرقم الضريبي لشركة زول: ٣١٠٢٩٣٨٤٧٥٠٠٠٠٣' : 'ZOAL VAT Registration: 310293847500003',
    invoiceNo: isAr ? 'رقم الفاتورة:' : 'Invoice No:',
    billedTo: isAr ? 'فاتورة إلى:' : 'Billed To:',
    paymentMethod: isAr ? 'طريقة الدفع المعتمدة:' : 'Certified Payment:',
    itemCol: isAr ? 'المنتج الفاخر / الخيار' : 'Bespoke Item / Selected Option',
    priceCol: isAr ? 'سعر الوحدة' : 'Unit Price',
    qtyCol: isAr ? 'الكمية' : 'Quantity',
    totalCol: isAr ? 'المجموع' : 'Total Amount',
    printInvoice: isAr ? 'طباعة الفاتورة' : 'Print Invoice',
    closeInvoice: isAr ? 'إغلاق الفاتورة' : 'Close Invoice',
    vatIncluded: isAr ? 'الأسعار شاملة ضريبة القيمة المضافة ١٥٪' : 'Prices include 15% VAT where applicable',

    // Support Modal
    supportTitle: isAr ? 'مجلس دعم عملاء زول النخبة' : 'ZOAL Concierge & Support Panel',
    supportSubtitle: isAr ? 'تواصل مباشرة مع سفير خدمة العملاء لمساعدتك فوراً' : 'Connect instantly with our executive concierge host',
    whatsappSupport: isAr ? 'تواصل عبر واتساب النخبة' : 'Executive WhatsApp Concierge',
    callSupport: isAr ? 'اتصال مباشر بالسفير المالي' : 'Direct Call Hotlines',
    emailSupport: isAr ? 'راسل البريد الرسمي الفوري' : 'Corporate Priority Email',
    sendSupportMsg: isAr ? 'إرسال رسالة فورية للدعم' : 'Send Fast Support Message',
    supportFormName: isAr ? 'الاسم بالكامل' : 'Full Name',
    supportFormSubject: isAr ? 'الموضوع' : 'Subject / Question',
    supportFormMessage: isAr ? 'تفاصيل استفسارك' : 'Message Details',
    supportFormSubmit: isAr ? 'إرسال الاستفسار الفاخر' : 'Submit Priority Request',
    supportSuccess: isAr ? 'تم إرسال استفسارك بنجاح. سيتواصل معك أحد سفرائنا في أقل من ١٥ دقيقة.' : 'Your request was successfully prioritized. A concierge host will connect in under 15 minutes.'
  };

  // List of initial orders for quick demonstration
  const demoOrders = [
    { id: 'ZL-9871', email: 'alzoal3003@gmail.com' },
    { id: 'ZL-9543', email: 'alzoal3003@gmail.com' }
  ];

  // Particle background emitter
  const sparkles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 8 + 8,
      delay: Math.random() * 4
    }));
  }, []);

  const handleTrackSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderNumberInput.trim() || !emailInput.trim()) {
      setErrorMessage(isAr ? 'يرجى ملء جميع الحقول المطلوبة للتتبع.' : 'Please enter both your order number and email address.');
      return;
    }

    setErrorMessage('');
    setIsSearching(true);

    // Simulate luxury slow check
    setTimeout(() => {
      const orderIdMatch = orderNumberInput.trim().toUpperCase();
      const emailMatch = emailInput.trim().toLowerCase();

      // Search in state orders first
      const found = orders.find(
        (o) => o.id.toUpperCase() === orderIdMatch && o.email.toLowerCase() === emailMatch
      );

      if (found) {
        setSearchedOrder(found);
      } else {
        setSearchedOrder(null);
        setErrorMessage(tr.notFound);
      }
      setIsSearching(false);
      setHasSearched(true);
    }, 1200);
  };

  const selectDemoOrder = (id: string, email: string) => {
    setOrderNumberInput(id);
    setEmailInput(email);
    setErrorMessage('');
    setIsSearching(true);

    setTimeout(() => {
      const found = orders.find(
        (o) => o.id.toUpperCase() === id.toUpperCase() && o.email.toLowerCase() === email.toLowerCase()
      );
      if (found) {
        setSearchedOrder(found);
      } else {
        setSearchedOrder(null);
        setErrorMessage(tr.notFound);
      }
      setIsSearching(false);
      setHasSearched(true);
    }, 1000);
  };

  const resetTracker = () => {
    setOrderNumberInput('');
    setEmailInput('');
    setSearchedOrder(null);
    setHasSearched(false);
    setErrorMessage('');
  };

  // Determine active step index in progress timeline
  const activeTimelineStepIndex = useMemo(() => {
    if (!searchedOrder) return 0;
    
    // Status mappings
    // 0: Order Confirmed
    // 1: Preparing
    // 2: Packed
    // 3: Shipped
    // 4: Out for Delivery
    // 5: Delivered
    switch (searchedOrder.status) {
      case 'Pending':
        return 0; // Order Confirmed
      case 'Preparing':
        // Generate Packed for demo or split Preparing -> Packed based on Order ID last digit
        const lastDigit = parseInt(searchedOrder.id.slice(-1)) || 0;
        return lastDigit % 2 === 0 ? 2 : 1; // 2 if even (Packed), 1 if odd (Preparing)
      case 'Shipped':
        const lastChar = searchedOrder.id.slice(-1);
        const code = lastChar.charCodeAt(0) || 0;
        return code % 2 === 0 ? 4 : 3; // 4 if even (Out for Delivery), 3 if odd (Shipped)
      case 'Completed':
        return 5; // Delivered
      case 'Cancelled':
        return -1; // Special canceled state
      default:
        return 0;
    }
  }, [searchedOrder]);

  // Handle support message form submissions
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSupportSubmitted(true);
    setTimeout(() => {
      setSupportSubmitted(false);
      setShowSupportModal(false);
    }, 3000);
  };

  // Handle invoice printing trigger safely
  const handlePrint = () => {
    window.print();
  };

  // Simulated delivery parameters for high fidelity
  const computedCourierName = useMemo(() => {
    if (!searchedOrder) return '';
    // If order has local shipping or depends on price
    if (searchedOrder.shipping === 0) {
      return isAr ? 'أسطول زول للمرسول الخاص' : 'ZOAL VIP Concierge Transport';
    }
    return 'Aramex Executive Logistics';
  }, [searchedOrder, isAr]);

  const computedEstDelivery = useMemo(() => {
    if (!searchedOrder) return '';
    try {
      const orderDateObj = new Date(searchedOrder.date);
      // add 3 days
      orderDateObj.setDate(orderDateObj.getDate() + 3);
      return orderDateObj.toISOString().substring(0, 10);
    } catch {
      return '2026-07-13';
    }
  }, [searchedOrder]);

  return (
    <div 
      className={isEmbedded ? "text-white font-sans selection:bg-gold-pure selection:text-black relative" : "bg-black text-white min-h-screen pt-28 sm:pt-36 pb-24 px-4 sm:px-6 lg:px-8 font-sans selection:bg-gold-pure selection:text-black relative overflow-hidden"}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Immersive Cosmic Gold Glows */}
      {!isEmbedded && (
        <>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-pure/5 blur-[160px] rounded-full pointer-events-none z-0" />
          <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-gold-pure/[0.02] blur-[200px] rounded-full pointer-events-none z-0" />
        </>
      )}

      {/* Interactive Floating Dust Particles */}
      {!isEmbedded && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {sparkles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-gold-pure/15 animate-pulse"
              style={{
                width: p.size,
                height: p.size,
                left: `${p.x}%`,
                top: `${p.y}%`,
              }}
              animate={{
                y: [0, -80, 0],
                x: [0, Math.random() * 20 - 10, 0],
                opacity: [0.1, 0.6, 0.1]
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut"
}}
            />
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Animated Headline Segment */}
        {!isEmbedded && (
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-gold-pure/5 border border-gold-pure/20 backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-pure" />
              <span className="text-[10px] font-mono tracking-[0.3em] font-bold text-gold-pure uppercase leading-none">
                {isAr ? 'روائع الخياطة والضيافة الموثقة' : 'ZOAL LUXURY ASSURANCE'}
              </span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl sm:text-5xl font-display font-light text-white tracking-wider leading-tight uppercase"
            >
              {tr.title}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto font-light"
            >
              {tr.subtitle}
            </motion.p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!searchedOrder ? (
            /* SEARCH INPUT CARD FORM */
            <motion.div
              key="search-box"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
              className="p-6 sm:p-10 rounded-sm bg-zinc-950/60 backdrop-blur-xl border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.8)] space-y-8"
            >
              <form onSubmit={handleTrackSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Order Number Field */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-gold-pure block">
                      {tr.orderNum} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={orderNumberInput}
                        onChange={(e) => setOrderNumberInput(e.target.value)}
                        placeholder={tr.orderNumPlaceholder}
                        className="w-full bg-black/80 border border-white/10 hover:border-white/20 focus:border-gold-pure/50 rounded-sm py-4.5 px-4 text-sm text-white focus:outline-none transition-all font-mono uppercase tracking-wider"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-gold-pure block">
                      {tr.email} <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder={tr.emailPlaceholder}
                      className="w-full bg-black/80 border border-white/10 hover:border-white/20 focus:border-gold-pure/50 rounded-sm py-4.5 px-4 text-sm text-white focus:outline-none transition-all font-sans"
                      required
                    />
                  </div>
                </div>

                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-950/40 border border-red-500/20 rounded-sm flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-200 leading-relaxed">
                      {errorMessage}
                    </p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full py-4 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white text-black font-display font-semibold uppercase tracking-widest text-xs sm:text-sm rounded-sm transition-all duration-300 shadow-xl shadow-gold-pure/10 flex items-center justify-center gap-3 cursor-pointer select-none disabled:opacity-50"
                >
                  {isSearching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>{tr.btnTracking}</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 stroke-[2]" />
                      <span>{tr.btnTrack}</span>
                    </>
                  )}
                </button>
              </form>

              {/* DIRECT QUICK SELECTION MATRIX FOR DEMOS */}
              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-zinc-500">
                  <Clock className="w-4 h-4 text-gold-pure" />
                  <span>{tr.quickDemo}</span>
                </div>
                <p className="text-xs text-zinc-400">
                  {tr.orSelectDemo}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {demoOrders.map((demo) => (
                    <button
                      key={demo.id}
                      onClick={() => selectDemoOrder(demo.id, demo.email)}
                      className="p-3.5 bg-black/40 hover:bg-gold-pure/5 border border-white/5 hover:border-gold-pure/30 rounded-xs text-left rtl:text-right flex items-center justify-between group transition-all duration-300 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-bold text-white group-hover:text-gold-pure transition-colors">
                          {demo.id}
                        </span>
                        <p className="text-[10px] text-zinc-500 font-sans tracking-tight">
                          {demo.email}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-gold-pure transition-colors duration-300 transform rtl:rotate-180" />
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTION LINK HOME */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setCurrentPage('store')}
                  className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-gold-pure uppercase tracking-widest transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transform transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                  <span>{tr.backToStore}</span>
                </button>
              </div>

            </motion.div>
          ) : (
            /* DETAILED TRACKING RECORD INTERFACE */
            <motion.div
              key="tracking-record"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* PRIMARY PROGRESS TIMELINE ROADMAP */}
              <div className="p-6 sm:p-10 rounded-sm bg-zinc-950/60 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-gold-dark via-gold-pure to-white" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-gold-pure uppercase tracking-widest block">
                      {tr.orderStatusHeader}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-display font-light text-white uppercase tracking-wider">
                      {searchedOrder.id}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowInvoiceModal(true)}
                      className="px-4.5 py-2.5 border border-gold-pure/20 hover:border-white bg-[#D4AF37]/5 hover:bg-white/5 text-gold-pure hover:text-white text-[10px] font-mono uppercase tracking-widest transition-all rounded-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{tr.downloadInvoice}</span>
                    </button>
                    <button
                      onClick={() => setShowSupportModal(true)}
                      className="px-4.5 py-2.5 border border-white/5 hover:border-white/20 bg-zinc-900/50 hover:bg-white/5 text-zinc-300 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-all rounded-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{tr.contactSupport}</span>
                    </button>
                  </div>
                </div>

                {/* 6-STEP TIMELINE TRACKING COMPONENT */}
                {searchedOrder.status === 'Cancelled' ? (
                  <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-xs text-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto animate-pulse" />
                    <h3 className="text-base font-display text-white uppercase tracking-wider">
                      {isAr ? 'تم إلغاء هذا الطلب' : 'This Order has been Cancelled'}
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      {isAr 
                        ? 'نأسف لإبلاغك بأن هذه المعاملة قد تم إلغاؤها. يرجى الاتصال بخدمة العملاء المميزة للحصول على المساعدة الفورية.' 
                        : 'We apologize, but this luxury purchase was cancelled. Please connect with our VIP Support Desk below for instant resolution.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {/* Visual Timeline Path */}
                    <div className="relative pt-4 pb-4">
                      {/* Grey horizontal connector (desktop) */}
                      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-zinc-800 transform -translate-y-1/2 hidden md:block z-0" />
                      
                      {/* Gold horizontal active connector fill (desktop) */}
                      {activeTimelineStepIndex >= 0 && (
                        <div 
                          className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-gold-dark to-gold-pure transform -translate-y-1/2 hidden md:block z-0 transition-all duration-1000"
                          style={{ 
                            width: `${(activeTimelineStepIndex / 5) * 100}%`,
                            [isAr ? 'right' : 'left']: 0,
                            [isAr ? 'left' : 'right']: 'auto'
                          }}
                        />
                      )}

                      {/* Vertical line connector (mobile) */}
                      <div className="absolute top-0 bottom-0 ltr:left-5.5 rtl:right-5.5 w-[2px] bg-zinc-800 md:hidden z-0" style={{ [isAr ? 'right' : 'left']: '22px' }} />
                      
                      {/* Gold vertical active connector fill (mobile) */}
                      {activeTimelineStepIndex >= 0 && (
                        <div 
                          className="absolute top-0 ltr:left-5.5 rtl:right-5.5 w-[2px] bg-gradient-to-b from-gold-dark to-gold-pure md:hidden z-0 transition-all duration-1000"
                          style={{ 
                            height: `${(activeTimelineStepIndex / 5) * 100}%`,
                            [isAr ? 'right' : 'left']: '22px'
                          }}
                        />
                      )}

                      {/* 6 Grid Nodes */}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-8 md:gap-4 relative z-10">
                        {tr.timeline.map((stage, idx) => {
                          const isCompleted = idx < activeTimelineStepIndex;
                          const isActive = idx === activeTimelineStepIndex;
                          const isPending = idx > activeTimelineStepIndex;

                          return (
                            <div key={stage.key} className="flex md:flex-col items-center md:text-center gap-4 md:gap-3">
                              {/* Glowing Circle Node Wrapper */}
                              <div className="relative">
                                <motion.div
                                  animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                    isCompleted 
                                      ? 'bg-gold-pure border-gold-pure text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                                      : isActive 
                                      ? 'bg-black border-gold-pure text-gold-pure shadow-[0_0_20px_rgba(212,175,55,0.6)]' 
                                      : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <Check className="w-5 h-5 stroke-[3]" />
                                  ) : isActive ? (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                                    >
                                      <Clock className="w-5 h-5 stroke-[2]" />
                                    </motion.div>
                                  ) : (
                                    <span className="text-xs font-mono font-bold">{idx + 1}</span>
                                  )}
                                </motion.div>

                                {/* Halo aura for active */}
                                {isActive && (
                                  <div className="absolute inset-0 bg-gold-pure/20 rounded-full blur-md -z-10 animate-ping" />
                                )}
                              </div>

                              {/* Stage Text details */}
                              <div className="space-y-1">
                                <h4 className={`text-xs uppercase font-display tracking-wider font-semibold transition-colors duration-300 ${
                                  isActive ? 'text-gold-pure' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'
                                }`}>
                                  {stage.label}
                                </h4>
                                <p className="text-[10px] text-zinc-500 font-sans leading-tight hidden md:block max-w-[120px] mx-auto">
                                  {stage.desc}
                                </p>
                                <p className="text-[10px] text-zinc-500 font-sans leading-tight md:hidden">
                                  {stage.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>

                    {/* DUAL LIVE VERIFIED NOTIFICATIONS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      {/* Confirmation Email Dispatched */}
                      <div className="p-4 bg-gold-pure/5 rounded-xs border border-gold-pure/10 flex items-start gap-3.5">
                        <div className="p-2 bg-gold-pure/10 text-gold-pure rounded-full">
                          <Mail className="w-4.5 h-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-white block">
                            {tr.emailSent}
                          </span>
                          <span className="text-[10px] text-zinc-400 block">
                            {tr.emailSentDesc}
                          </span>
                        </div>
                      </div>

                      {/* Tax Invoice Sent */}
                      <div className="p-4 bg-gold-pure/5 rounded-xs border border-gold-pure/10 flex items-start gap-3.5">
                        <div className="p-2 bg-gold-pure/10 text-gold-pure rounded-full">
                          <FileCheck className="w-4.5 h-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-white block">
                            {tr.invoiceSent}
                          </span>
                          <span className="text-[10px] text-zinc-400 block">
                            {tr.invoiceSentDesc}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECONDARY LEDGER: DETAILED SPECS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* 1. DISPATCH DETAILS (LEFT SIDE) */}
                <div className="md:col-span-7 p-6 sm:p-8 rounded-sm bg-zinc-950/60 backdrop-blur-xl border border-white/10 space-y-6">
                  <h3 className="text-xs uppercase font-mono tracking-widest text-gold-pure border-b border-white/5 pb-3 font-semibold">
                    {isAr ? 'تفاصيل ومعايير التنفيذ واللوجستيات' : 'Fulfillment Records & Logistics'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                    {/* Order Identifier */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">{tr.orderId}</span>
                      <span className="font-mono font-bold text-white block">{searchedOrder.id}</span>
                    </div>

                    {/* Order Date */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">{tr.orderDate}</span>
                      <span className="font-sans text-white block flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        {searchedOrder.date}
                      </span>
                    </div>

                    {/* Authorized Customer */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">{tr.customerName}</span>
                      <span className="font-sans text-white block flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-500" />
                        {searchedOrder.customerName}
                      </span>
                    </div>

                    {/* Certified Payment */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">{tr.paymentStatus}</span>
                      <span className="font-mono text-white block flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-gold-pure" />
                        {searchedOrder.paymentMethod === 'Pay at Delivery' 
                          ? (isAr ? 'نقدي عند الاستلام (معلق)' : 'COD / Pending Receipt') 
                          : (isAr ? 'مدفوع إلكترونياً (مؤمن)' : 'Prepaid & Secured')}
                      </span>
                    </div>

                    {/* Courier Partner */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">{tr.courierName}</span>
                      <span className="font-sans text-white block flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-gold-pure animate-bounce" />
                        {computedCourierName}
                      </span>
                    </div>

                    {/* Tracking Number */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">{tr.trackingNumber}</span>
                      <span className="font-mono font-bold text-gold-pure block">{searchedOrder.trackingNumber}</span>
                    </div>

                    {/* Estimated Delivery Date */}
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">{tr.estDelivery}</span>
                      <span className="font-sans text-white block font-semibold">
                        {computedEstDelivery} <span className="text-[10px] text-zinc-400 font-light">({isAr ? 'بين ٨:٠٠ صباحاً إلى ٨:٠٠ مساءً' : '08:00 AM - 08:00 PM slot'})</span>
                      </span>
                    </div>

                    {/* Registered Delivery Address */}
                    <div className="space-y-1 sm:col-span-2 border-t border-white/5 pt-3">
                      <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">{tr.shippingAddress}</span>
                      <span className="font-sans text-zinc-300 block flex items-start gap-1.5 leading-relaxed">
                        <MapPin className="w-4 h-4 text-gold-pure shrink-0 mt-0.5" />
                        {searchedOrder.address}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. ITEM LEDGER SUMMARY (RIGHT SIDE) */}
                <div className="md:col-span-5 p-6 sm:p-8 rounded-sm bg-zinc-950/60 backdrop-blur-xl border border-white/10 space-y-6 flex flex-col justify-between">
                  <div className="space-y-5">
                    <h3 className="text-xs uppercase font-mono tracking-widest text-gold-pure border-b border-white/5 pb-3 font-semibold">
                      {tr.orderedProducts}
                    </h3>

                    {/* Product Lists */}
                    <div className="space-y-4 max-h-[220px] overflow-y-auto divide-y divide-white/5 pr-1">
                      {searchedOrder.items.map((item, idx) => (
                        <div key={`${item.productId}-${idx}`} className="pt-3 first:pt-0 flex justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <span className="font-semibold text-white block truncate hover:text-gold-pure transition-colors">
                              {item.name}
                            </span>
                            <div className="flex gap-3 text-[10px] text-zinc-500 font-mono mt-1">
                              <span>{tr.qty} {item.quantity}</span>
                              {item.selectedOption && (
                                <span>{tr.option} {item.selectedOption}</span>
                              )}
                            </div>
                          </div>
                          <span className="font-mono text-zinc-300 text-right shrink-0">
                            {formatCurrency(item.price * item.quantity)} <span className="text-[9px] text-zinc-500">{isAr ? 'ر.س' : 'SAR'}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Bill */}
                  <div className="border-t border-white/10 pt-4 space-y-2.5 font-mono text-[11px] text-zinc-400">
                    <div className="flex justify-between">
                      <span>{tr.subtotal}</span>
                      <span className="text-white">{formatCurrency(searchedOrder.subtotal)} SAR</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{tr.shippingFee}</span>
                      <span className="text-gold-pure">{searchedOrder.shipping === 0 ? (isAr ? 'مستحق مجاني' : 'VIP Free') : `${formatCurrency(searchedOrder.shipping)} SAR`}</span>
                    </div>
                    {searchedOrder.discount > 0 && (
                      <div className="flex justify-between text-gold-pure">
                        <span>{tr.discount}</span>
                        <span>-{formatCurrency(searchedOrder.discount)} SAR</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-bold text-white pt-2 border-t border-white/5 font-display">
                      <span>{tr.totalAmount}</span>
                      <span className="text-gold-pure font-mono text-sm">{formatCurrency(searchedOrder.total)} SAR</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* CORE BACK BUTTON CONTROLS */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={resetTracker}
                  className="px-6 py-3.5 border border-white/10 hover:border-gold-pure/30 bg-zinc-950/40 hover:bg-gold-pure/5 text-zinc-300 hover:text-gold-pure font-mono text-xs uppercase tracking-widest rounded-sm transition-all duration-300 cursor-pointer select-none"
                >
                  {tr.trackAnother}
                </button>
                <button
                  onClick={() => setCurrentPage('store')}
                  className="px-6 py-3.5 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white text-black font-display font-semibold uppercase tracking-widest text-xs rounded-sm transition-all duration-300 cursor-pointer select-none shadow-lg shadow-gold-pure/5"
                >
                  {tr.backToStore}
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* LUXURY TAX INVOICE OVERLAY MODAL */}
      <AnimatePresence>
        {showInvoiceModal && searchedOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-zinc-950 border border-white/10 max-w-2xl w-full rounded-sm p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowInvoiceModal(false)}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Printable Area Wrapper */}
              <div id="zoal-printable-invoice" className="space-y-6 text-xs text-zinc-300">
                
                {/* Header Letterhead */}
                <div className="flex justify-between items-start gap-4 border-b border-white/10 pb-5">
                  <div className="space-y-1 text-left ltr:text-left rtl:text-right">
                    <span className="text-lg font-display text-white uppercase tracking-widest">ZOAL COMPANY</span>
                    <p className="text-[10px] text-zinc-400 font-sans">Specialty Hospitality & Heritage Artistry</p>
                    <p className="text-[9px] text-zinc-500">{tr.vatNo}</p>
                  </div>
                  <div className="text-right ltr:text-right rtl:text-left space-y-1 font-mono">
                    <span className="px-3 py-1 bg-gold-pure/10 text-gold-pure font-bold text-[9px] rounded-full uppercase tracking-wider inline-block">
                      {isAr ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice'}
                    </span>
                    <p className="text-zinc-400 text-[10px] mt-2">{tr.invoiceNo} <span className="text-white font-bold">{searchedOrder.id.replace('ZL-', 'INV-')}</span></p>
                    <p className="text-zinc-500 text-[9px]">{searchedOrder.date}</p>
                  </div>
                </div>

                {/* Billed To / Specs Column */}
                <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4 font-sans text-[11px]">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gold-pure block">{tr.billedTo}</span>
                    <p className="text-white font-semibold">{searchedOrder.customerName}</p>
                    <p className="text-zinc-400">{searchedOrder.email}</p>
                    <p className="text-zinc-400">{searchedOrder.phone}</p>
                  </div>
                  <div className="space-y-1 text-right ltr:text-right rtl:text-left">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gold-pure block">{tr.paymentMethod}</span>
                    <p className="text-zinc-300">{searchedOrder.paymentMethod}</p>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gold-pure block mt-3">{isAr ? 'رقم التتبع المرفق:' : 'Carrier Waybill:'}</span>
                    <p className="text-zinc-300 font-mono">{searchedOrder.trackingNumber}</p>
                  </div>
                </div>

                {/* Item Listing Table */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 border-b border-white/10 pb-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    <div className="col-span-6">{tr.itemCol}</div>
                    <div className="col-span-2 text-right">{tr.priceCol}</div>
                    <div className="col-span-2 text-center">{tr.qtyCol}</div>
                    <div className="col-span-2 text-right">{tr.totalCol}</div>
                  </div>

                  <div className="divide-y divide-white/5">
                    {searchedOrder.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 py-3 text-[11px]">
                        <div className="col-span-6 min-w-0 pr-2">
                          <p className="font-semibold text-white truncate">{item.name}</p>
                          {item.selectedOption && (
                            <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{tr.option} {item.selectedOption}</p>
                          )}
                        </div>
                        <div className="col-span-2 text-right font-mono text-zinc-400">{formatCurrency(item.price)} SAR</div>
                        <div className="col-span-2 text-center font-mono text-zinc-400">{item.quantity}</div>
                        <div className="col-span-2 text-right font-mono text-white font-semibold">{formatCurrency(item.price * item.quantity)} SAR</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Section */}
                <div className="border-t border-white/10 pt-4 flex flex-col items-end">
                  <div className="w-full sm:w-64 space-y-2 font-mono text-[11px] text-zinc-400">
                    <div className="flex justify-between">
                      <span>{tr.subtotal}</span>
                      <span className="text-white">{formatCurrency(searchedOrder.subtotal)} SAR</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{tr.shippingFee}</span>
                      <span className="text-gold-pure">{searchedOrder.shipping === 0 ? (isAr ? 'مستحق مجاني' : 'VIP Free') : `${formatCurrency(searchedOrder.shipping)} SAR`}</span>
                    </div>
                    {searchedOrder.discount > 0 && (
                      <div className="flex justify-between text-gold-pure">
                        <span>{tr.discount}</span>
                        <span>-{formatCurrency(searchedOrder.discount)} SAR</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-bold text-white pt-2 border-t border-white/5">
                      <span>{tr.totalCol}</span>
                      <span className="text-gold-pure">{formatCurrency(searchedOrder.total)} SAR</span>
                    </div>
                  </div>
                </div>

                {/* Footer notes */}
                <div className="pt-6 border-t border-white/5 text-center text-[9px] text-zinc-500 space-y-1">
                  <p className="font-semibold text-zinc-400">{tr.vatIncluded}</p>
                  <p>ZOAL Corporate Headquarters, Al-Hofuf Main Avenue, Eastern Province, KSA.</p>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-gold-pure/60 mt-2">{isAr ? 'نشكركم على اختيار روائع زول' : 'Thank you for choosing ZOAL Curated Masterpieces'}</p>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-mono uppercase tracking-widest rounded-xs transition-colors cursor-pointer select-none"
                >
                  {tr.closeInvoice}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4.5 py-2.5 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white text-black font-semibold text-[10px] font-mono uppercase tracking-widest rounded-xs transition-all flex items-center gap-1.5 cursor-pointer select-none shadow-lg shadow-gold-pure/5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{tr.printInvoice}</span>
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONCIERGE & SUPPORT INSTANT SLIDEOUT MODAL */}
      <AnimatePresence>
        {showSupportModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 max-w-md w-full rounded-sm p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowSupportModal(false)}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 text-center">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }} 
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="w-12 h-12 bg-gold-pure/10 border border-gold-pure/30 rounded-full flex items-center justify-center mx-auto text-gold-pure"
                >
                  <MessageSquare className="w-6 h-6" />
                </motion.div>
                <h3 className="text-base font-display text-white uppercase tracking-wider mt-2">
                  {tr.supportTitle}
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto font-light leading-relaxed">
                  {tr.supportSubtitle}
                </p>
              </div>

              {/* Instant Concierge Links */}
              <div className="space-y-3 pt-2">
                {/* Executive WhatsApp */}
                <a 
                  href="https://wa.me/966567699315" 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  className="flex items-center justify-between p-3.5 bg-green-950/20 hover:bg-green-950/40 border border-green-500/20 hover:border-green-500/40 rounded-xs transition-all text-xs"
                >
                  <span className="text-green-400 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping inline-block" />
                    {tr.whatsappSupport}
                  </span>
                  <ExternalLink className="w-4 h-4 text-green-500" />
                </a>

                {/* Phone support */}
                <a 
                  href="tel:+966567699315" 
                  className="flex items-center justify-between p-3.5 bg-gold-pure/5 hover:bg-gold-pure/10 border border-gold-pure/10 hover:border-gold-pure/25 rounded-xs transition-all text-xs"
                >
                  <span className="text-zinc-300 font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gold-pure" />
                    {tr.callSupport}
                  </span>
                  <span className="font-mono text-gold-pure text-[11px]">+966 56 769 9315</span>
                </a>

                {/* Email Support */}
                <a 
                  href="mailto:alzoal3003@gmail.com?subject=ZOAL%20Luxury%20Fulfillment%20Priority%20Assistance" 
                  className="flex items-center justify-between p-3.5 bg-black/40 hover:bg-white/5 border border-white/5 hover:border-white/15 rounded-xs transition-all text-xs"
                >
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gold-pure" />
                    {tr.emailSupport}
                  </span>
                  <span className="font-mono text-zinc-500 text-[10px] truncate">alzoal3003@gmail.com</span>
                </a>
              </div>

              {/* Contact Fast Request Form */}
              <div className="border-t border-white/5 pt-5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold-pure block mb-3 text-center">
                  {tr.sendSupportMsg}
                </span>

                {supportSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-gold-pure/10 border border-gold-pure/20 rounded-xs text-center space-y-2"
                  >
                    <Check className="w-6 h-6 text-gold-pure mx-auto" />
                    <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                      {tr.supportSuccess}
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSupportSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 block">{tr.supportFormName}</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Abdullah" 
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-white focus:outline-none focus:border-gold-pure/40" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 block">{tr.supportFormSubject}</label>
                        <input 
                          type="text" 
                          required 
                          defaultValue={searchedOrder ? `${searchedOrder.id} Fulfillment Inquiry` : ''} 
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-white focus:outline-none focus:border-gold-pure/40" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 block">{tr.supportFormMessage}</label>
                      <textarea 
                        required 
                        rows={3} 
                        placeholder={isAr ? 'اكتب تفاصيل استفسارك هنا...' : 'Describe how we can assist with your delivery...'} 
                        className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-white focus:outline-none focus:border-gold-pure/40 resize-none font-sans" 
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white text-black font-display font-semibold uppercase tracking-widest text-[10px] rounded-xs transition-all duration-300 cursor-pointer select-none"
                    >
                      {tr.supportFormSubmit}
                    </button>
                  </form>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
