import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  AlertCircle, 
  Check, 
  Clock, 
  CreditCard, 
  Sparkles, 
  Mail, 
  MessageCircle, 
  Phone, 
  Printer, 
  ArrowUp, 
  ChevronDown, 
  BookOpen, 
  Copy, 
  Search, 
  Upload, 
  X, 
  CheckCircle2, 
  ShieldAlert,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getReturnsConfig, ReturnsConfig } from '../data/returnsData';

export default function ReturnRefundPolicy() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [returnsConfig, setReturnsConfig] = useState<ReturnsConfig>(() => getReturnsConfig());
  const [activeSectionId, setActiveSectionId] = useState<string>('return-eligibility');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileTOCExpanded, setMobileTOCExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Return Request Simulator Modal State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simOrderId, setSimOrderId] = useState('');
  const [simReason, setSimReason] = useState('');
  const [simComments, setSimComments] = useState('');
  const [simFile, setSimFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmittingSim, setIsSubmittingSim] = useState(false);
  const [simSuccessData, setSimSuccessData] = useState<{ rma: string; email: string } | null>(null);

  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  // Reload config when changed in Admin Dashboard
  useEffect(() => {
    const handleConfigChange = () => {
      setReturnsConfig(getReturnsConfig());
    };
    window.addEventListener('zoal-returns-config-changed', handleConfigChange);
    return () => {
      window.removeEventListener('zoal-returns-config-changed', handleConfigChange);
    };
  }, []);

  const lastUpdatedDate = useMemo(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', options);
  }, [isAr]);

  // Defined 10 Content Sections exactly mapping user requests
  const policySections = useMemo(() => {
    return [
      {
        id: 'return-eligibility',
        num: '1',
        titleEn: '1. Return Eligibility',
        titleAr: '١. أهلية الاسترجاع',
        icon: FileText,
        contentEn: 'Products may be eligible for return if they meet all our premium return requirements and are returned within the allowed return period. All goods undergo rigorous verification by our master specialists to protect the integrity of our boutique collections.',
        contentAr: 'يمكن أن تكون المنتجات مؤهلة للاسترجاع الفاخر إذا استوفت جميع متطلبات الإرجاع المعتمدة لدينا، وتم إرجاعها خلال الفترة الزمنية المسموح بها. تخضع جميع السلع لفحص دقيق من قبل أخصائيينا لضمان سلامة تشكيلات المتجر.',
        bulletsEn: [
          'The item must be in its original, sealed, and unaltered packaging.',
          'Items must be returned with all boutique tags and accessories.',
          'Proof of purchase (invoice or receipt) is strictly required.'
        ],
        bulletsAr: [
          'يجب أن يكون المنتج في عبوته الأصلية المغلقة وبحالتها الأصلية دون أي تعديل.',
          'يجب إرجاع السلع مع كافة بطاقات الأسعار والملحقات وصناديق التقديم الفاخرة الخاصة بها.',
          'إثبات الشراء (الفاتورة الأصلية أو إيصال البيع) مطلوب بشكل صارم.'
        ]
      },
      {
        id: 'return-window',
        num: '2',
        titleEn: '2. Return Window',
        titleAr: '٢. فترة الاسترجاع والجدول الزمني',
        icon: Clock,
        contentEn: `To ensure absolute satisfaction, general standard return requests are accepted within ${returnsConfig.returnWindowDays} days of delivery. For our exclusive curated promotional lines or exceptional premium collections, the return period may allow up to ${returnsConfig.returnWindowDaysPromo} days. All deadlines are strict to synchronize with our artisan crafting schedules.`,
        contentAr: `لضمان رضاكم المطلق، يتم قبول طلبات الاسترجاع القياسية العامة في غضون ${returnsConfig.returnWindowDays} أيام من تاريخ التوصيل الفعلي. بالنسبة لخطوط العروض الحصرية أو التشكيلات الفاخرة الاستثنائية، قد تمتد فترة الاسترجاع لتصل إلى ${returnsConfig.returnWindowDaysPromo} يوماً. نعتذر عن قبول أي طلبات تتجاوز هذه المدة المحددة لمزامنة جداول الخياطة والإنتاج.`,
        bulletsEn: [
          `Standard Return requests: Accepted within ${returnsConfig.returnWindowDays} days of courier hand-off.`,
          `Curated promotional or seasonal campaigns: Extended up to ${returnsConfig.returnWindowDaysPromo} days.`,
          'Once the return window expires, the order is considered sovereign, final, and non-refundable.'
        ],
        bulletsAr: [
          `طلبات الاسترجاع القياسية: تُقبل في غضون ${returnsConfig.returnWindowDays} أيام من استلام مندوب الشحن.`,
          `الحملات الترويجية الحصرية أو المواسم المحددة: تمتد حتى ${returnsConfig.returnWindowDaysPromo} يوماً.`,
          'بمجرد انقضاء هذه الفترة المحددة، تعتبر المعاملة نهائية وسيادية وغير قابلة للتعديل أو الاسترجاع.'
        ]
      },
      {
        id: 'return-conditions',
        num: '3',
        titleEn: '3. Return Conditions',
        titleAr: '٣. شروط الاسترجاع الدقيقة',
        icon: Check,
        contentEn: 'To receive a full credit or refund, returned products must satisfy all of our quality controls in full. ZOAL reserves the strict right to inspect returned products at our centralized master facility before final approval.',
        contentAr: 'للحصول على استرداد كامل للمدفوعات، يجب أن تلبي المنتجات المرتجعة كافة معايير ضبط الجودة الفاخرة لدينا بالكامل. تحتفظ زول بالحق الصارم في فحص السلع فعلياً في مركز مراقبة الجودة قبل اعتماد الإرجاع.',
        bulletsEn: [
          'Unused & pristine: Items must not show any signs of wear or degradation.',
          'Unworn & unwashed: For apparel and traditional tailored clothing, garments must remain in brand-new condition.',
          'Original Packaging: Protective luxury boxes, inner velvet linings, and custom envelopes must remain undamaged.',
          'Original tags and security seals must be firmly attached and uncut.',
          'Full receipt: Include the original printed invoice or digital PDF payment confirmation.',
          'All accessories: Dustbags, complimentary product samples, and certificates of authenticity must be included.'
        ],
        bulletsAr: [
          'غير مستخدمة وسليمة تماماً: يجب ألا تظهر السلع أي علامات ارتداء، تدهور، أو تلف.',
          'غير ملبوسة وغير مغسولة: بالنسبة للملابس الجاهزة والقطع الفاخرة، يجب أن تظل في حالتها الأصلية الجديدة.',
          'العبوة الأصلية الفاخرة: يجب حماية صناديق العرض الجلدية، البطانة القطيفة الداخلية، والمغلفات المخصصة.',
          'البطاقات الأصلية والأختام الأمنية: يجب أن تكون مثبتة بشكل ثابت وغير مقصوصة.',
          'الفاتورة الكاملة: إرفاق الفاتورة الورقية الأصلية أو تأكيد الدفع الرقمي عبر البريد الإلكتروني.',
          'كافة الملحقات: يجب إرفاق أكياس الغبار الفاخرة، عينات المنتجات المجانية، وشهادات الأصالة الحرفية.'
        ]
      },
      {
        id: 'non-returnable',
        num: '4',
        titleEn: '4. Non-Returnable Items',
        titleAr: '٤. السلع المستبعدة من الاسترجاع',
        icon: AlertCircle,
        contentEn: 'To maintain pristine health, strict safety, and absolute product hygiene, certain categories of goods are strictly excluded from being returned or exchanged unless they arrive physically damaged or incorrect.',
        contentAr: 'حفاظاً على الصحة العامة والسلامة والتعقيم الكامل، يتم استبعاد فئات معينة من السلع تماماً من الاسترجاع أو الاستبدال، ما لم تصل إليكم تالفة أو غير مطابقة للمواصفات.',
        bulletsEn: returnsConfig.nonReturnableEn,
        bulletsAr: returnsConfig.nonReturnableAr
      },
      {
        id: 'refund-policy',
        num: '5',
        titleEn: '5. Refund Policy',
        titleAr: '٥. سياسة استرداد الأموال',
        icon: CreditCard,
        contentEn: 'Approved refunds will be issued back to the original payment channel whenever possible. If the original method is completely unavailable, customer support will coordinate an alternative legal solution.',
        contentAr: 'يتم إصدار الأموال المستردة المعتمدة إلى نفس قناة الدفع الأصلية المستخدمة أثناء الشراء كلما كان ذلك ممكناً. وفي حال تعذر ذلك، سينسق فريق الدعم تقديم حل بديل معتمد بموجب أنظمة التجارة الإلكترونية.',
        bulletsEn: [
          'Supported secure gateways: Mada, Visa, Mastercard, Apple Pay, and STC Pay.',
          'Partial refunds may apply if the item is not in its original pristine state, has missing accessories, or has sustained damage after delivery.',
          'Original boutique courier and priority shipping fees are non-refundable.'
        ],
        bulletsAr: [
          'بوابات الدفع الرقمية الآمنة المعتمدة: مدى، فيزا، ماستركارد، Apple Pay، و STC Pay.',
          'قد تُطبق مبالغ مستردة جزئية إذا كان المنتج المرتجع تالفاً جزئياً، أو يفتقر إلى ملحقاته، أو تضرر بعد تسليمه للعميل.',
          'رسوم التوصيل والخدمات اللوجستية السريعة الأصلية غير قابلة للاسترداد.'
        ]
      },
      {
        id: 'exchange-policy',
        num: '6',
        titleEn: '6. Exchange Policy',
        titleAr: '٦. سياسة الاستبدال الفاخر',
        icon: Sparkles,
        contentEn: 'We offer seamless, complimentary exchanges to ensure you receive the perfect size, color, or item suitable for your lifestyle. All exchange items are subject to boutique stock allocation.',
        contentAr: 'نقدم خدمات استبدال مرنة ومجانية لضمان حصولكم على المقاس أو اللون أو المنتج المثالي لأسلوب حياتكم الفاخر. تخضع جميع القطع البديلة لمدى توفرها في مخزون البوتيك.',
        bulletsEn: returnsConfig.exchangeOptionsEn,
        bulletsAr: returnsConfig.exchangeOptionsAr
      },
      {
        id: 'damaged-incorrect',
        num: '7',
        titleEn: '7. Damaged or Incorrect Orders',
        titleAr: '٧. الطلبات التالفة أو غير المطابقة',
        icon: ShieldAlert,
        contentEn: 'In the rare event that you receive a physically damaged, defective, or incorrect item, ZOAL guarantees absolute and swift resolution. Please contact our support concierge within 24 hours of delivery.',
        contentAr: 'في حال استلام شحنة تالفة، أو منتج معيب، أو قطعة غير صحيحة، تضمن زول حل المشكلة على الفور بأعلى درجات الأولوية. يرجى التواصل مع مركز الدعم في غضون ٢٤ ساعة من التسليم.',
        bulletsEn: [
          'Please retain all shipping packaging, outer boxes, and shipping labels.',
          'Provide our concierge with your Order Number, clear photos of the issue, and a brief description.',
          'ZOAL will dispatch a priority courier to collect the item and deliver a perfect replacement at no extra cost.'
        ],
        bulletsAr: [
          'يرجى الاحتفاظ بجميع مواد التغليف وصناديق الشحن والملصقات البريدية دون تغيير.',
          'يرجى تزويد فريقنا برقم الطلب، وصور واضحة ومفصلة للمشكلة، ووصف موجز للعيب.',
          'ستقوم زول بإرسال مندوب لوجستي عاجل لاستلام الشحنة وتوفير قطعة بديلة جديدة فوراً دون أي تكلفة إضافية.'
        ]
      },
      {
        id: 'how-to-request',
        num: '8',
        titleEn: '8. How to Request a Return',
        titleAr: '٨. خطوات طلب الاسترجاع',
        icon: BookOpen,
        contentEn: 'You can easily request a return through your secure online account, or directly through our VIP communication channels.',
        contentAr: 'يمكنكم طلب إرجاع السلع بسهولة تامة من خلال حسابكم الرقمي الآمن، أو التواصل المباشر مع قنوات كبار الشخصيات المعتمدة لدينا.',
        bulletsEn: [
          'Online: Visit My Account → Orders, select the relevant transaction, and click "Request Return".',
          'Details: Select your return reason, upload photos of the packaging/item, and submit.',
          'Alternative: Contact our WhatsApp Concierge or official support email with your order details.'
        ],
        bulletsAr: [
          'عبر الإنترنت: انتقل إلى حسابي ← الطلبات، واختر الطلب ذي الصلة، ثم انقر على "طلب استرجاع".',
          'تفاصيل الطلب: اختر سبب الإرجاع المناسب، وارفق صور المنتج والتغليف، ثم أرسل الطلب.',
          'قنوات بديلة: يمكنكم التواصل المباشر مع واتساب كونسيرج زول أو البريد الإلكتروني لموظفي الدعم.'
        ]
      },
      {
        id: 'refund-processing-time',
        num: '9',
        titleEn: '9. Refund Processing Time',
        titleAr: '٩. مدة معالجة المبالغ المستردة',
        icon: Clock,
        contentEn: `All returned items are routed to our specialized Al Hofuf quality facility. Refunds are officially initiated only after passing physical inspection.`,
        contentAr: `يتم إرسال كافة السلع المسترجعة إلى مرفق الجودة المتخصص بالهفوف. يتم تفعيل المبالغ المستردة بمجرد اجتياز الفحص الفني بنجاح.`,
        bulletsEn: [
          `Specialized quality verification: ${returnsConfig.inspectionDaysEn} from warehouse receipt.`,
          `Bank/Financial Gateway credit release: ${returnsConfig.refundProcessingDaysEn} (the actual time depends strictly on your bank policy).`,
          'Notifications: You will receive real-time updates via Email, SMS, and your online dashboard.'
        ],
        bulletsAr: [
          `التحقق والتدقيق المتخصص للجودة: في غضون ${returnsConfig.inspectionDaysAr} من استلام الشحنة في المستودع.`,
          `التحويل المالي المعتمد للبوابة البنكية: في غضون ${returnsConfig.refundProcessingDaysAr} (الوقت الفعلي خاضع لسياسة البنك المصدر للبطاقة).`,
          'إشعارات فورية: ستصلك رسائل بريدية ونصية قصيرة ومستندات الإرجاع عبر حسابك الإلكتروني فوراً.'
        ]
      },
      {
        id: 'contact-support',
        num: '10',
        titleEn: '10. Contact Support',
        titleAr: '١٠. مركز الدعم والتواصل الفاخر',
        icon: Mail,
        contentEn: 'Our dedicated luxury client specialists are available daily to assist you with any questions regarding your sovereign returns, custom tailoring, or exchange desires.',
        contentAr: 'يتواجد أخصائيو خدمة كبار العملاء لدينا على مدار الساعة لمساعدتكم في أي استفسارات تتعلق بالاسترجاع الفاخر، أو تعديلات الخياطة، أو الاستبدال.',
        bulletsEn: [
          `Concierge WhatsApp Support: ${returnsConfig.supportWhatsApp}`,
          `Sovereign Email Support: ${returnsConfig.supportEmail}`,
          `Toll-Free Phone: ${returnsConfig.supportPhone}`,
          `Boutique HQ Address: ${returnsConfig.supportAddressEn}`,
          `Concierge Operating Hours: ${returnsConfig.supportHoursEn}`
        ],
        bulletsAr: [
          `قناة الواتساب الفوري: ${returnsConfig.supportWhatsApp}`,
          `البريد الإلكتروني للخدمة: ${returnsConfig.supportEmail}`,
          `الرقم المجاني الموحد: ${returnsConfig.supportPhone}`,
          `مقر الإدارة والبوتيك الرئيسي: ${returnsConfig.supportAddressAr}`,
          `أوقات العمل المتاحة: ${returnsConfig.supportHoursAr}`
        ]
      }
    ];
  }, [returnsConfig]);

  // SEO Optimization & Structured Data Injection
  useEffect(() => {
    const originalTitle = document.title;
    const originalMetaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    const seoTitle = isAr 
      ? 'سياسة الاسترجاع والاسترداد الفاخرة | زول للقهوة والأزياء الحرفية' 
      : 'Return & Refund Policy | ZOAL - Luxury Coffee & Artisanal Wear';
    const seoDescription = isAr
      ? `مراجعة سياسة الاسترجاع والاستبدال المعتمدة لـ زول. تعرف على أهلية المرتجعات، وفترة الـ ${returnsConfig.returnWindowDays} أيام، وقنوات الدعم الفوري.`
      : `ZOAL luxury Return & Refund guidelines. Details about return eligibility, custom tailoring exemptions, standard ${returnsConfig.returnWindowDays}-day return window, and bank credit processing.`;
    
    document.title = seoTitle;

    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', seoDescription);

    // Injection of Schema JSON-LD Structured Data
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": seoTitle,
      "description": seoDescription,
      "lastReviewed": new Date().toISOString().split('T')[0],
      "publisher": {
        "@type": "Organization",
        "name": "ZOAL",
        "url": window.location.origin,
        "logo": `${window.location.origin}/assets/images/zoal_logo_fixed_1780848794781.png`,
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": returnsConfig.supportPhone,
          "contactType": "customer service",
          "email": returnsConfig.supportEmail,
          "areaServed": "SA",
          "availableLanguage": ["en", "ar"]
        }
      },
      "mainEntity": {
        "@type": "FAQPage",
        "mainEntity": policySections.map(sec => ({
          "@type": "Question",
          "name": isAr ? sec.titleAr : sec.titleEn,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${isAr ? sec.contentAr : sec.contentEn} ${sec.bulletsEn ? (isAr ? sec.bulletsAr : sec.bulletsEn).join(', ') : ''}`
          }
        }))
      }
    };

    const scriptElement = document.createElement('script');
    scriptElement.type = 'application/ld+json';
    scriptElement.id = 'zoal-returns-seo-schema';
    scriptElement.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(scriptElement);

    return () => {
      document.title = originalTitle;
      if (descMeta) {
        descMeta.setAttribute('content', originalMetaDesc);
      }
      document.getElementById('zoal-returns-seo-schema')?.remove();
    };
  }, [isAr, returnsConfig, policySections]);

  // Scroll and section tracking logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);

      setShowScrollTop(scrollTop > 400);

      const scrollPosition = scrollTop + 160;
      let currentActive = 'return-eligibility';

      for (const sec of policySections) {
        const el = sectionsRef.current[sec.id];
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentActive = sec.id;
            break;
          }
        }
      }
      setActiveSectionId(currentActive);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [policySections]);

  const scrollToSection = (id: string) => {
    const el = sectionsRef.current[id];
    if (el) {
      const offset = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
      setActiveSectionId(id);
      setMobileTOCExpanded(false);
    }
  };

  const copySectionLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Search logic
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return policySections;
    const query = searchQuery.toLowerCase();
    return policySections.filter(sec => 
      sec.titleEn.toLowerCase().includes(query) ||
      sec.titleAr.includes(query) ||
      sec.contentEn.toLowerCase().includes(query) ||
      sec.contentAr.includes(query) ||
      (sec.bulletsEn && sec.bulletsEn.some(b => b.toLowerCase().includes(query))) ||
      (sec.bulletsAr && sec.bulletsAr.some(b => b.includes(query)))
    );
  }, [searchQuery, policySections]);

  // Return Request Simulator Actions
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSimFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSimFile(e.target.files[0]);
    }
  };

  const handleSimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simOrderId || !simReason) {
      alert(isAr ? 'يرجى تقديم رقم الطلب واختيار سبب الإرجاع.' : 'Please provide an Order ID and select a return reason.');
      return;
    }
    setIsSubmittingSim(true);
    
    // Simulate API request
    setTimeout(() => {
      setIsSubmittingSim(false);
      const randomRMA = `ZOAL-RMA-${Math.floor(100000 + Math.random() * 900000)}`;
      setSimSuccessData({
        rma: randomRMA,
        email: returnsConfig.supportEmail
      });
    }, 1800);
  };

  const resetSimulator = () => {
    setSimOrderId('');
    setSimReason('');
    setSimComments('');
    setSimFile(null);
    setSimSuccessData(null);
    setIsSimulatorOpen(false);
  };

  return (
    <div 
      dir={isAr ? 'rtl' : 'ltr'}
      className="bg-black text-white min-h-screen pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#D4AF37] selection:text-black overflow-hidden relative"
      id="zoal-returns-section-main"
    >
      {/* Premium ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#D4AF37] opacity-[0.03] blur-[160px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-[#D4AF37] opacity-[0.02] blur-[200px] rounded-full pointer-events-none z-0" />

      {/* Reading Progress Indicator */}
      <div className="fixed top-[64px] sm:top-[72px] left-0 right-0 h-[2.5px] bg-white/5 z-50 print:hidden">
        <div 
          className="h-full bg-[#D4AF37] transition-all duration-100 ease-out shadow-[0_0_8px_#D4AF37]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Luxury Badge Header Tag */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-4 print:hidden"
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#D4AF37]/5 border border-[#D4AF37]/15">
            <Sparkles className="w-3 h-3 text-[#D4AF37] animate-pulse" />
            <span className="text-[9px] uppercase tracking-[0.3em] font-display font-semibold text-[#D4AF37]">
              {isAr ? 'ضمان الرضا وحقوق المستهلك الفاخرة' : 'Sovereign Patron Guarantee'}
            </span>
          </div>
        </motion.div>

        {/* Page Title & Intro */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl sm:text-4xl font-display font-medium text-white tracking-[0.2em] uppercase mb-4"
          >
            {isAr ? 'سياسة الاسترجاع والاسترداد' : 'Return & Refund Policy'}
          </motion.h1>
          <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mb-5" />
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-sans"
          >
            {isAr 
              ? 'هدفنا هو ضمان تمتع كل عميل بتجربة تسوق راقية تلبي تطلعاته. يرجى مراجعة إرشادات الاسترجاع والاستبدال والاسترداد الخاصة بنا قبل إتمام عملية الشراء.'
              : 'Our goal is to ensure every customer enjoys a premium shopping experience. Please review our return, exchange, and refund guidelines before making a purchase.'
            }
          </motion.p>

          {/* Last Updated Badge */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500"
          >
            <span>{isAr ? `آخر تحديث: اليوم` : `Last Updated: Today`}</span>
            <span className="hidden sm:inline text-zinc-800">|</span>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors duration-300 print:hidden cursor-pointer"
              title={isAr ? 'طباعة السياسة الفاخرة' : 'Print Return Policy'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ بصيغة PDF / طباعة' : 'Save PDF / Print'}</span>
            </button>
          </motion.div>
        </div>

        {/* Dynamic Search Bar (SEO and User Friendly) */}
        <div className="mb-10 max-w-md mx-auto print:hidden">
          <div className="relative">
            <span className={`absolute inset-y-0 ${isAr ? 'left-3' : 'right-3'} flex items-center text-zinc-500`}>
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'البحث في أقسام السياسة...' : 'Search within return policy...'}
              className="w-full bg-zinc-950/80 border border-white/5 rounded-full py-3 px-5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/40 placeholder-zinc-600 transition-colors duration-300"
            />
          </div>
          {searchQuery && (
            <p className="text-[10px] text-zinc-500 mt-2 text-center">
              {isAr 
                ? `تم العثور على ${filteredSections.length} أقسام مطابقة للبحث` 
                : `Found ${filteredSections.length} matching sections`
              }
            </p>
          )}
        </div>

        {/* Mobile Sidebar Section Drawer / Accordion */}
        <div className="md:hidden sticky top-20 z-40 mb-6 print:hidden">
          <div className="bg-zinc-950/95 backdrop-blur-md border border-white/10 rounded-sm shadow-xl overflow-hidden">
            <button 
              onClick={() => setMobileTOCExpanded(!mobileTOCExpanded)}
              className="w-full px-4 py-3.5 flex items-center justify-between text-zinc-300 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-[10px] uppercase font-mono tracking-widest font-semibold">
                  {isAr ? 'أقسام السياسة الفهرسية' : 'Table of Contents'}
                </span>
              </div>
              <motion.div
                animate={{ rotate: mobileTOCExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </motion.div>
            </button>

            <AnimatePresence>
              {mobileTOCExpanded && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-white/5 max-h-[280px] overflow-y-auto"
                >
                  <div className="p-3 grid grid-cols-1 gap-1.5 bg-black/40">
                    {policySections.map((sect) => {
                      const isActive = activeSectionId === sect.id;
                      const Icon = sect.icon;
                      return (
                        <button
                          key={sect.id}
                          onClick={() => scrollToSection(sect.id)}
                          className={`text-left px-3 py-2 rounded-xs text-[10px] font-mono uppercase tracking-wider flex items-center justify-between transition-all ${
                            isActive 
                              ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-l-2 border-[#D4AF37] pl-2' 
                              : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{isAr ? sect.titleAr : sect.titleEn}</span>
                          <Icon className="w-3.5 h-3.5 text-[#D4AF37]/50" />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Sidebar Navigation */}
          <div className="hidden md:block md:col-span-4 sticky top-28 max-h-[calc(100vh-160px)] overflow-y-auto pr-2 pb-6 print:hidden scrollbar-none">
            <div className="bg-zinc-950/30 border border-white/5 rounded-sm p-5 space-y-4 shadow-xl backdrop-blur-sm relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
              
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-white text-xs uppercase tracking-widest font-semibold font-display">
                  {isAr ? 'فهرس الشروط والسياسة' : 'Return Navigation'}
                </h3>
              </div>

              <div className="space-y-1">
                {policySections.map((sec) => {
                  const isActive = activeSectionId === sec.id;
                  const Icon = sec.icon;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-sm text-[10px] font-mono uppercase tracking-wider flex items-center justify-between transition-all duration-300 border border-transparent ${
                        isActive 
                          ? 'bg-[#D4AF37]/5 text-[#D4AF37] border-white/5 font-semibold' 
                          : 'text-zinc-500 hover:text-white hover:border-white/5'
                      }`}
                    >
                      <span className="truncate pr-2">{isAr ? sec.titleAr : sec.titleEn}</span>
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4AF37]' : 'text-zinc-700'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Policy Contents Column */}
          <div className="md:col-span-8 space-y-8 print:w-full">
            {filteredSections.length === 0 ? (
              <div className="text-center py-16 border border-white/5 bg-zinc-950/20 rounded-sm">
                <HelpCircle className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 text-xs font-mono">
                  {isAr ? 'لم يتم العثور على أي شروط مطابقة لبحثك.' : 'No return policy statements match your search criteria.'}
                </p>
              </div>
            ) : (
              filteredSections.map((section, index) => {
                const isActive = activeSectionId === section.id;
                const Icon = section.icon;

                return (
                  <section
                    key={section.id}
                    id={section.id}
                    ref={(el) => { sectionsRef.current[section.id] = el; }}
                    className="scroll-mt-28 print:break-inside-avoid"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.25) }}
                      className={`p-6 sm:p-8 bg-[#040404]/30 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                        isActive 
                          ? 'border-[#D4AF37]/30 bg-zinc-950/80 shadow-[0_15px_40px_rgba(0,0,0,0.8)]' 
                          : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Top glowing strip on active card */}
                      <div className={`absolute top-0 left-0 w-full h-[1.5px] transition-all duration-500 ${
                        isActive ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent' : 'bg-transparent'
                      }`} />

                      {/* Header block */}
                      <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full border transition-all duration-500 ${
                            isActive 
                              ? 'bg-[#D4AF37]/5 border-[#D4AF37]/25 text-[#D4AF37]' 
                              : 'bg-white/5 border-transparent text-zinc-500'
                          }`}>
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <h2 className={`text-sm sm:text-base font-display uppercase tracking-widest font-semibold transition-colors duration-500 ${
                            isActive ? 'text-[#D4AF37]' : 'text-white'
                          }`}>
                            {isAr ? section.titleAr : section.titleEn}
                          </h2>
                        </div>

                        {/* Copy Section Anchor Link */}
                        <div className="flex items-center gap-1.5 print:hidden">
                          <button
                            onClick={(e) => copySectionLink(section.id, e)}
                            className="p-1.5 rounded-sm hover:bg-white/5 text-zinc-500 hover:text-[#D4AF37] transition-colors duration-300 cursor-pointer relative group"
                            title={isAr ? 'نسخ رابط البند' : 'Copy link to this item'}
                          >
                            {copiedId === section.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Paragraph Text */}
                      <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed mb-6 font-sans">
                        {isAr ? section.contentAr : section.contentEn}
                      </p>

                      {/* Bullets lists */}
                      {section.bulletsEn && (
                        <div className="space-y-3 pl-4 sm:pl-6 border-l border-white/5 rtl:pl-0 rtl:pr-4 sm:rtl:pr-6 rtl:border-l-0 rtl:border-r border-[#D4AF37]/20">
                          {(isAr ? section.bulletsAr : section.bulletsEn).map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-3 text-xs sm:text-[12.5px] text-zinc-300 font-sans leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 mt-1.5" />
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </section>
                );
              })
            )}

            {/* Section 10 Interaction: Contact & Request Buttons Card */}
            <section className="scroll-mt-28 print:hidden" id="interactive-actions">
              <div className="p-6 sm:p-8 bg-zinc-950/45 border border-[#D4AF37]/15 rounded-sm shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-3xl rounded-full" />
                
                <h3 className="text-[#D4AF37] text-xs font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin-slow" /> {isAr ? 'الخدمة الذاتية الفورية' : 'Instant Self-Service'}
                </h3>
                
                <h4 className="text-white text-lg font-display uppercase tracking-widest mb-3">
                  {isAr ? 'تقديم وإرسال طلب استرجاع فوري' : 'Initiate Return or Contact Concierge'}
                </h4>
                
                <p className="text-zinc-400 text-xs sm:text-[12.5px] leading-relaxed mb-6 font-sans">
                  {isAr
                    ? 'هل ترغب في استبدال أو استرجاع منتج مؤهل؟ استخدم كونسيرج الخدمة الذاتية أدناه لملء طلبك بسرعة فائقة، أو تواصل معنا لمساعدتك فوراً.'
                    : 'Would you like to return or exchange an eligible item? Use our secure self-service return concierge below to submit a request, or contact our support representatives directly.'
                  }
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      resetSimulator();
                      setIsSimulatorOpen(true);
                    }}
                    className="flex-1 py-3 bg-[#D4AF37] hover:bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xs transition-all duration-300 cursor-pointer text-center shadow-lg hover:scale-[1.01]"
                  >
                    {isAr ? 'تقديم طلب استرجاع ذكي' : 'Request a Return'}
                  </button>
                  <a
                    href={`https://wa.me/${returnsConfig.supportWhatsApp.replace(/\s+/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xs transition-all duration-300 text-center flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {isAr ? 'تواصل مع الدعم الفوري' : 'Contact Support'}
                  </a>
                </div>
              </div>
            </section>
          </div>

        </div>

        {/* Scroll back to top button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-6 right-6 p-3 bg-[#D4AF37] hover:bg-white text-black rounded-full shadow-2xl transition-all duration-300 cursor-pointer print:hidden z-50 hover:scale-105 active:scale-95"
              title={isAr ? 'الرجوع للأعلى' : 'Scroll to top'}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Interactive Return Request Simulator Modal */}
        <AnimatePresence>
          {isSimulatorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative bg-zinc-950 border border-white/10 max-w-lg w-full rounded-sm p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              >
                {/* Close Button */}
                <button
                  onClick={resetSimulator}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-[#D4AF37] transition-colors duration-300 cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>

                {!simSuccessData ? (
                  <form onSubmit={handleSimSubmit} className="space-y-5 text-left">
                    <div className="pb-3 border-b border-white/5 flex items-center gap-2.5">
                      <Sparkles className="w-4.5 h-4.5 text-[#D4AF37] animate-pulse" />
                      <h3 className="text-white text-[11px] uppercase tracking-widest font-semibold font-mono">
                        {isAr ? 'كونسيرج طلب الاسترجاع الفاخر' : 'Luxury Return Concierge'}
                      </h3>
                    </div>

                    <p className="text-zinc-400 text-[11.5px] leading-relaxed">
                      {isAr
                        ? 'يرجى تقديم تفاصيل الطلب لمراجعة الأهلية والتحقق بشكل فوري بموجب أنظمة حماية المستهلك.'
                        : 'Submit your order details below to run an instant automated eligibility check and obtain an RMA tracking ID.'
                      }
                    </p>

                    <div className="space-y-4 text-xs">
                      {/* Order ID Input */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest block font-mono">
                          {isAr ? 'رقم الطلب الأصلي:' : 'Original Order ID:'}
                        </label>
                        <input
                          type="text"
                          required
                          value={simOrderId}
                          onChange={(e) => setSimOrderId(e.target.value)}
                          placeholder="e.g. ZOAL-2026-4819"
                          className="w-full bg-black border border-white/10 rounded-xs p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45 font-mono"
                        />
                      </div>

                      {/* Reason Selection */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest block font-sans">
                          {isAr ? 'سبب طلب الإرجاع:' : 'Reason for Return:'}
                        </label>
                        <select
                          required
                          value={simReason}
                          onChange={(e) => setSimReason(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xs p-3 text-xs text-zinc-300 focus:outline-none focus:border-[#D4AF37]/45"
                        >
                          <option value="">{isAr ? '-- اختر السبب --' : '-- Select Reason --'}</option>
                          <option value="size">{isAr ? 'استبدال المقاس (ملابس)' : 'Size exchange (Apparel)'}</option>
                          <option value="incorrect">{isAr ? 'منتج غير صحيح' : 'Wrong item received'}</option>
                          <option value="defect">{isAr ? 'تلف أو عيب تصنيع' : 'Defect or damaged on arrival'}</option>
                          <option value="unsatisfied">{isAr ? 'عدم الرضا عن القطعة' : 'General dissatisfaction'}</option>
                        </select>
                      </div>

                      {/* Comments */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest block">
                          {isAr ? 'ملاحظات إضافية (اختياري):' : 'Additional Comments (Optional):'}
                        </label>
                        <textarea
                          rows={3}
                          value={simComments}
                          onChange={(e) => setSimComments(e.target.value)}
                          placeholder={isAr ? 'اكتب تفاصيل إضافية لتسهيل مراجعة الطلب...' : 'Details about size discrepancy or minor damage...'}
                          className="w-full bg-black border border-white/10 rounded-xs p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]/45"
                        />
                      </div>

                      {/* Photo upload (Required only for damage) */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-widest block">
                          {isAr ? 'إرفاق صور السلعة (مطلوب للتلف):' : 'Upload Photos (Required for damage):'}
                        </label>
                        
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`border border-dashed rounded-xs p-5 text-center transition-colors duration-300 cursor-pointer ${
                            isDragging 
                              ? 'border-[#D4AF37] bg-[#D4AF37]/5' 
                              : 'border-white/10 bg-black/40 hover:border-white/20'
                          }`}
                        >
                          <input
                            type="file"
                            id="sim-uploader-input"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <label htmlFor="sim-uploader-input" className="cursor-pointer block space-y-2">
                            <Upload className="w-5 h-5 text-zinc-500 mx-auto" />
                            <div className="text-[10px] text-zinc-400">
                              {simFile ? (
                                <span className="text-emerald-500 font-semibold font-mono">{simFile.name}</span>
                              ) : (
                                <span>{isAr ? 'اسحب الصور وأفلتها هنا أو انقر للتصفح' : 'Drag & drop images here or click to browse'}</span>
                              )}
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-4 border-t border-white/5 flex gap-3">
                      <button
                        type="button"
                        onClick={resetSimulator}
                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xs text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer"
                      >
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingSim}
                        className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-white text-black rounded-xs text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isSubmittingSim ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            <span>{isAr ? 'جاري الفحص المالي...' : 'Verifying Order...'}</span>
                          </>
                        ) : (
                          <span>{isAr ? 'إرسال طلب الاسترجاع' : 'Submit Return'}</span>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-8 space-y-5">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>

                    <h3 className="text-white text-base font-display uppercase tracking-widest">
                      {isAr ? 'تم تسجيل طلب الاسترجاع بنجاح' : 'Return Registered Successfully'}
                    </h3>

                    <div className="p-5 bg-black border border-white/5 rounded-xs space-y-3 font-mono text-[11px] text-left">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-zinc-500">RMA ID:</span>
                        <span className="text-[#D4AF37] font-bold">{simSuccessData.rma}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-zinc-500">Order ID:</span>
                        <span className="text-white">{simOrderId}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-zinc-500">Status:</span>
                        <span className="text-amber-500 uppercase tracking-wider font-semibold">Pending Inspection</span>
                      </div>
                      <div className="pt-1 text-center text-[10px] text-zinc-400 font-sans leading-relaxed">
                        {isAr
                          ? `يرجى إرفاق رقم RMA هذا مع شحنتك المرتجعة. تم إرسال إرشادات الشحن والملصق البريدي إلى بريدك الإلكتروني.`
                          : `Please print and attach this RMA tag to your return packaging. Courier instructions have been dispatched.`
                        }
                      </div>
                    </div>

                    <p className="text-zinc-400 text-xs font-sans max-w-sm mx-auto leading-relaxed">
                      {isAr
                        ? `إذا لم تتلقَ تحديثاً في غضون ٢٤ ساعة، يرجى الاتصال بنا عبر البريد الإلكتروني ${simSuccessData.email}.`
                        : `If you do not receive a courier pickup notification within 24 hours, contact us at ${simSuccessData.email}.`
                      }
                    </p>

                    <button
                      onClick={resetSimulator}
                      className="px-8 py-2.5 bg-white text-black text-[10px] uppercase font-bold tracking-widest rounded-xs hover:bg-[#D4AF37] transition-colors duration-300 cursor-pointer"
                    >
                      {isAr ? 'إغلاق الكونسيرج' : 'Dismiss Concierge'}
                    </button>
                  </div>
                )}

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Outer footer statement */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 pt-12 border-t border-white/5 text-center"
        >
          <p className="text-zinc-500 text-[10px] leading-relaxed max-w-lg mx-auto">
            {isAr 
              ? 'إننا نضمن الشفافية والراحة لجميع شركائنا وعملائنا الكرام. تخضع جميع شروط الاسترجاع والاستبدال للقواعد المنظمة من وزارة التجارة بالمملكة العربية السعودية.' 
              : 'Our dedication to absolute luxury ensures an elegant post-purchase lifecycle. All refund and exchange systems strictly adhere to the Ministry of Commerce of Saudi Arabia guidelines.'
            }
          </p>
        </motion.div>

      </div>
    </div>
  );
}
