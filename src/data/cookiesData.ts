export interface CookieSection {
  id: string;
  title: {
    en: string;
    ar: string;
  };
  icon: string;
  content: {
    en: string;
    ar: string;
  };
  list?: {
    en: string[];
    ar: string[];
  };
}

export const cookiesSections: CookieSection[] = [
  {
    id: 'what-are-cookies',
    title: {
      en: '1. What Are Cookies?',
      ar: '1. ما هي ملفات تعريف الارتباط؟'
    },
    icon: 'Cookie',
    content: {
      en: 'Cookies are small text files containing tiny identifiers that are securely stored on your computer, smartphone, or other browsing device when visiting websites. At ZOAL, we utilize secure cookies, local storage technologies, and secure tracking pixels to optimize your browsing speed, remember your selected settings, enhance platform security, and deliver a seamless, highly tailored luxury online shopping experience.',
      ar: 'ملفات تعريف الارتباط (الكوكيز) هي ملفات نصية صغيرة تحتوي على معرفات رقمية آمنة يتم تخزينها على جهاز الكمبيوتر الخاص بك، أو الهاتف الذكي، أو أي جهاز تصفح آخر عند زيارتك للمواقع الإلكترونية. في "زول"، نقوم باستخدام ملفات تعريف الارتباط الآمنة، وتقنيات التخزين المحلي الآمن، وبيكسلات التتبع المشفرة لتسريع تصفحك، وحفظ تفضيلاتك، وتعزيز أمان المنصة، وتقديم تجربة مستخدم سلسة وفاخرة تتناسب تماماً مع تطلعاتكم.'
    }
  },
  {
    id: 'types-we-use',
    title: {
      en: '2. Types of Cookies We Use',
      ar: '2. أنواع ملفات الارتباط التي نستخدمها'
    },
    icon: 'Eye',
    content: {
      en: 'To provide an unparalleled digital boutique experience, we employ several categories of cookies. These range from strictly required operational cookies to optional analytics, marketing, and personalization markers. Each category serves a dedicated purpose, and you hold complete authority to toggle optional cookies at your discretion.',
      ar: 'لتقديم تجربة تسوق رقمية راقية ولا مثيل لها، نستخدم عدة فئات من ملفات تعريف الارتباط. تتراوح هذه بين ملفات التشغيل المطلوبة بشكل صارم، وبين مؤشرات التحليل والتسويق والتخصيص الاختيارية. يخدم كل نوع غرضاً مخصصاً، وتمتلك السيادة المطلقة لتفعيل أو تعطيل الملفات الاختيارية حسب رغبتك.'
    }
  },
  {
    id: 'essential-cookies',
    title: {
      en: '3. Essential Cookies',
      ar: '3. ملفات تعريف الارتباط الأساسية'
    },
    icon: 'Shield',
    content: {
      en: 'Essential cookies are strictly required to ensure the fundamental stability, performance, and security of the website. Without these technical cookies, crucial transactional features like securing your shopping cart, preserving user login sessions, preventing fraud, and facilitating checkout cannot be provided. These cookies are always active and cannot be disabled.',
      ar: 'ملفات تعريف الارتباط الأساسية مطلوبة بشكل صارم لضمان استقرار وأمان موقعنا البنيوي. وبدون هذه الملفات الفنية، لا يمكن توفير الميزات والخدمات التشغيلية الحيوية مثل تصفح صفحات الشراء، وإضافة السلع للسلة، وتأمين جلسات تسجيل الدخول، ومكافحة الاحتيال، وتيسير عمليات الدفع الإلكتروني الآمنة. ولذا، تكون هذه الملفات نشطة دائماً ولا يمكن تعطيلها.'
    },
    list: {
      en: [
        'User Login Session Management',
        'Shopping Cart Preservation across pages',
        'Secure Checkout & Payment processing integration',
        'Fraud Prevention & platform vulnerability security',
        'Language and currency preference auto-detection'
      ],
      ar: [
        'إدارة جلسات تسجيل دخول المستخدم وتأمينها',
        'حفظ المنتجات المضافة في سلة التسوق الخاصة بكم عبر الصفحات والزيارات',
        'إتمام عمليات الدفع الإلكتروني والتشيك أوت الآمن بالكامل',
        'مكافحة الاحتيال والجرائم المعلوماتية وتأمين خوادم الموقع',
        'الكشف التلقائي عن تفضيلات اللغة والعملة المفضلة لدى الزائر'
      ]
    }
  },
  {
    id: 'analytics-cookies',
    title: {
      en: '4. Analytics Cookies',
      ar: '4. ملفات تعريف الارتباط التحليلية'
    },
    icon: 'Database',
    content: {
      en: 'Analytics cookies gather aggregated, completely anonymized data about visitor behavior, traffic sources, and performance metrics. These tools allow us to evaluate which collections are most popular, identify navigation issues or broken links, and measure general site performance to optimize our digital salon.',
      ar: 'تجمع ملفات الكوكيز التحليلية معلومات عامة وإحصائية مجهولة الهوية بالكامل حول تفاعلات الزوار ومصادر حركة المرور ومؤشرات السرعة. تساعدنا هذه الملفات على معرفة المنتجات الأكثر شعبية، واكتشاف الروابط المعطلة، وتقييم أداء تحميل الصفحات بشكل مستمر لتقديم أفضل تجربة تصفح ممكنة.'
    },
    list: {
      en: [
        'Understand visitor flow and interaction metrics anonymously',
        'Improve website performance, caching speeds, and fluid navigation',
        'Measure popular products and seasonal collection engagement',
        'Identify loading bugs, visual errors, and navigation lags'
      ],
      ar: [
        'فهم مسارات حركة الزوار وتفاعلاتهم مع المنتجات بشكل مجهول الهوية',
        'رفع كفاءة تصفح الصفحات وتسريع استجابة تصفح الموقع',
        'قياس مدى الإقبال على المنتجات والمجموعات الموسمية الفاخرة',
        'اكتشاف ومعالجة فترات البطء في التحميل أو الروابط المعطلة فوراً'
      ]
    }
  },
  {
    id: 'marketing-cookies',
    title: {
      en: '5. Marketing Cookies',
      ar: '5. ملفات تعريف الارتباط التسويقية'
    },
    icon: 'Sparkles',
    content: {
      en: 'Marketing cookies track advertising effectiveness and enable personalized promotions across our social media partners and search networks. These cookies allow us to deliver tailored advertisements that match your lifestyle and interests. We only activate marketing pixels after you provide your explicit consent.',
      ar: 'تُستخدم ملفات الكوكيز التسويقية لتتبع وقياس مدى فعالية الحملات الإعلانية وتقديم عروض ترويجية مخصصة وموجهة عبر شركائنا في شبكات التواصل ومحركات البحث لتتوافق مع ذوقكم الفاخر. لا يتم تفعيل بيكسلات التتبع هذه إلا بعد منحنا موافقتكم الصريحة.'
    },
    list: {
      en: [
        'Deliver personalized advertisements on premium social networks',
        'Measure marketing campaign reach and performance metrics',
        'Remarket curated ZOAL collections on search partners (Google Ads, Meta Pixel, TikTok Pixel)'
      ],
      ar: [
        'تقديم إعلانات مخصصة تليق بأسلوب حياتكم على شبكات التواصل الراقية',
        'قياس كفاءة ومدى انتشار الحملات الإعلانية وحساب العائد منها',
        'إعادة تسويق مجموعات زول الحصرية عبر بيكسلات التتبع (Google Ads, Meta, TikTok Pixels)'
      ]
    }
  },
  {
    id: 'preference-cookies',
    title: {
      en: '6. Preference Cookies',
      ar: '6. ملفات تعريف الارتباط للتفضيلات'
    },
    icon: 'Check',
    content: {
      en: 'Preference cookies enable the boutique website to remember your personalized layout and custom parameters. This ensures that when you return to our digital storefront, your preferred language, currency settings, theme view, and cookie permissions are instantly recalled for a personalized encounter.',
      ar: 'تتيح ملفات تفضيلات الأداء لمتجرنا حفظ وتذكر خيارات العرض المخصصة التي تقومون بها تلقائياً. يضمن ذلك أنه عند تكرار زيارة موقعنا، يتم فوراً تذكر لغتكم المفضلة، وإعدادات العملة، والوضع الجمالي المعتمد، وتفضيلات الكوكيز لتوفير تجربة مخصصة وسلسة.'
    },
    list: {
      en: [
        'Remember chosen language (Arabic or English)',
        'Remember preferred currency (SAR/USD) and localization settings',
        'Preserve customized display states, font density, or device theme layout'
      ],
      ar: [
        'تذكر اللغة المفضلة التي اخترتموها (العربية أو الإنجليزية) تلقائياً',
        'تذكر العملة المختارة (الريال السعودي) وتفضيلات التوصية المحلية',
        'حفظ وضعيات العرض المخصصة، أو سمات المتصفح المعتمدة'
      ]
    }
  },
  {
    id: 'managing-preferences',
    title: {
      en: '7. Managing Cookie Preferences',
      ar: '7. إدارة تفضيلات ملفات الكوكيز'
    },
    icon: 'Lock',
    content: {
      en: 'ZOAL respects your data privacy. You have complete control over optional cookies and can alter your choices at any moment. Essential cookies must always remain active to ensure standard checkout, cart stability, and security workflows. Your choices are securely saved and remembered for all future sessions.',
      ar: 'تحترم "زول" خصوصيتكم المطلقة لبياناتكم الشخصية وتمنحكم السيطرة الكاملة على ملفات تعريف الارتباط الاختيارية. يجب أن تظل الملفات الأساسية نشطة دائماً لضمان استقرار السلة وأمان الشراء. يتم حفظ تفضيلاتكم بشكل آمن لتذكرها تلقائياً في زياراتكم القادمة.'
    }
  },
  {
    id: 'third-party-cookies',
    title: {
      en: '8. Third-Party Cookies',
      ar: '8. ملفات تعريف الارتباط الخاصة بأطراف ثالثة'
    },
    icon: 'Shield',
    content: {
      en: 'We integrate with trusted external partners to facilitate modern payment flows, secure map coordinates for Saudi local delivery, and run high-efficiency analytics. These services may store third-party cookies on your device. These providers operate under their own autonomous privacy frameworks, and we advise you to review their policies.',
      ar: 'نتعاون مع شركاء ومقدمي خدمات لوجستية وتقنية موثوقين لتسهيل المدفوعات الآمنة، وتحديد إحداثيات خرائط التوصيل للمنازل بالمدن السعودية بدقة، وقياس الإحصاءات العامة. قد تقوم هذه الخدمات بوضع ملفات كوكيز تابعة لها على جهازكم، وتخضع تلك الملفات لسياسات الخصوصية المستقلة الخاصة بكل منها.'
    },
    list: {
      en: [
        'Google Analytics (for anonymous traffic analysis)',
        'Google Maps API (for precise delivery address selection)',
        'Meta, TikTok, and Google Advertising SDKs (only with active marketing consent)',
        'Payment providers like Apple Pay, mada, Visa, and Mastercard'
      ],
      ar: [
        'تحليلات جوجل (Google Analytics) لدراسة حركة المرور مجهولة الهوية',
        'واجهة خرائط جوجل (Google Maps API) لتسهيل تحديد عناوين التوصيل السريع بدقة',
        'أكواد التتبع والبيكسل الخاصة بـ Meta، TikTok، وGoogle Ads (فقط بعد موافقتكم الصريحة)',
        'بوابات الدفع الإلكتروني المصرفية وبوابات Apple Pay، ومدى، وSTC Pay'
      ]
    }
  },
  {
    id: 'policy-updates',
    title: {
      en: '9. Updates to This Policy',
      ar: '9. التحديثات والتعديلات على السياسة'
    },
    icon: 'Cookie',
    content: {
      en: 'ZOAL reserves the right to revise this Cookie Policy at our discretion to align with legislative updates, Saudi eCommerce Ministry of Commerce guidelines, and system security enhancements. The current version will always remain accessible on this page, reflecting the exact current date at the top of your screen.',
      ar: 'نحتفظ بحقنا الكامل في تعديل سياسة ملفات تعريف الارتباط هذه وتحديثها من وقت لآخر للامتثال للتحديثات التنظيمية والتشريعية بالمملكة وتوجيهات وزارة التجارة السعودية. تظل هذه النسخة هي المعتمدة والمنشورة دائماً على هذه الصفحة، ويعكس تاريخ التحديث بأعلى الشاشة تاريخ التعديل الأخير.'
    }
  },
  {
    id: 'contact-support',
    title: {
      en: '10. Contact Support',
      ar: '10. معلومات التواصل وقنوات الدعم'
    },
    icon: 'Mail',
    content: {
      en: 'Should you have any inquiries, suggestions, or requests regarding how we manage your browser security or data options, our dedicated Customer Support Team is available around the clock to assist you.',
      ar: 'إذا كان لديكم أي استفسار، أو اقتراح، أو طلب بخصوص كيفية إدارة أمان التصفح وملفات الكوكيز الخاصة بكم، يرجى عدم التردد في التواصل مع مكتب خدمة العملاء الفاخرة لـ "زول" المتاح على مدار الساعة لخدمتكم بمستوى الضيافة اللائق بكم.'
    }
  }
];
