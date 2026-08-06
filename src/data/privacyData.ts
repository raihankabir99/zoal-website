export interface PrivacySection {
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

export const contactDetails = {
  email: 'alzoal3003@gmail.com',
  phone: '+966 56 769 9315',
  whatsapp: '+966 56 769 9315',
  address: {
    en: 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia',
    ar: 'طريق أبو بكر الصديق، المعلمين، الهفوف 36361، المملكة العربية السعودية'
  },
  supportHours: {
    en: 'Available 24/7 (Customer Support)',
    ar: 'متاح على مدار الساعة وطوال أيام الأسبوع (خدمة عملاء زول الفاخرة)'
  }
};

export const privacySections: PrivacySection[] = [
  {
    id: 'introduction',
    title: {
      en: '1. Introduction',
      ar: '1. مقدمة تمهيدية'
    },
    icon: 'Shield',
    content: {
      en: 'Welcome to ZOAL, where premium quality meets authentic heritage. We hold our customers’ trust in the highest regard. ZOAL is dedicated to respecting, honoring, and protecting your personal privacy. This comprehensive Privacy Policy defines the meticulous processes through which we collect, utilize, store, encrypt, and safeguard your personal information when visiting our platform, ordering from our boutique collections, or using our flagship dining and sartorial support services.',
      ar: 'مرحباً بكم في "زول" (ZOAL)، حيث تلتقي الفخامة بالأصالة والتراث. إن ثقة عملائنا الكرام هي أساس هويتنا الفاخرة. وتلتزم "زول" التزاماً صارماً باحترام خصوصيتكم وحمايتها. توضح سياسة الخصوصية الشاملة هذه الإجراءات الدقيقة التي نتبعها لجمع معلوماتكم الشخصية واستخدامها وتخزينها وتشفيرها وحمايتها عند زيارة موقعنا الإلكتروني، أو الشراء من مجموعاتنا الفاخرة، أو استخدام خدمات الضيافة وتفصيل الثياب الخاصة بنا.'
    }
  },
  {
    id: 'information-collect',
    title: {
      en: '2. Information We Collect',
      ar: '2. المعلومات التي نجمعها'
    },
    icon: 'Database',
    content: {
      en: 'To deliver our signature premium experience, ZOAL may collect certain elements of personal data. This information is acquired directly when you create a customer account, place a boutique purchase, or coordinate with our custom tailoring master artisan.',
      ar: 'لتقديم تجربتنا المتميزة والفاخرة، قد تقوم "زول" بجمع بعض عناصر البيانات الشخصية. يتم الحصول على هذه المعلومات مباشرة عندما تقوم بإنشاء حساب عميل، أو تقديم طلب شراء من المتجر، أو التنسيق مع الخياط الحرفي الخاص بنا لتفصيل ثوبك.'
    },
    list: {
      en: [
        'Full Name & Title (to address you with proper esteem)',
        'Email Address (for transactional details and delivery milestones)',
        'Phone Number & WhatsApp contact ID (for courier coordination)',
        'Delivery & Shipping Address (to route your premium parcels)',
        'Billing Address & Order History',
        'Personal Wishlist details & saved configurations',
        'Customer Account Information & login credentials',
        'Device & Connection Information (IP Address, browser type, and operating system)',
        'Interaction analytics & functional cookies used to optimize your layout experience'
      ],
      ar: [
        'الاسم الكامل واللقب (لمخاطبتكم بالتقدير اللائق والملائم)',
        'البريد الإلكتروني (لإرسال تفاصيل الفواتير والطلبات ومراحل التوصيل)',
        'رقم الجوال ومعرّف الواتساب (للتنسيق مع مندوبي ومندوبات التوصيل)',
        'عنوان التوصيل والشحن بدقة (لتوجيه طرودكم الفاخرة بكفاءة)',
        'عنوان الدفع وسجل المعاملات والمشتريات السابقة',
        'تفاصيل قائمة الأمنيات والمنتجات المفضلة والتصاميم المحفوظة',
        'بيانات حساب العميل الخاص بك ومعلومات تسجيل الدخول الآمنة',
        'معلومات الجهاز والاتصال (عنوان IP، نوع المتصفح، ونظام التشغيل)',
        'بيانات التفاعل التحليلية وملفات تعريف الارتباط لتحسين أداء وتصفح الموقع'
      ]
    }
  },
  {
    id: 'how-use',
    title: {
      en: '3. How We Use Your Information',
      ar: '3. كيف نستخدم معلوماتكم'
    },
    icon: 'Eye',
    content: {
      en: 'Your information is used solely to refine and deliver the distinguished services you expect from ZOAL. We process your data under high standards of integrity for the following operational milestones:',
      ar: 'نستخدم معلوماتكم الشخصية فقط بهدف تقديم وتطوير الخدمات الراقية التي تتوقعونها من "زول". تتم معالجة بياناتكم وفق أعلى معايير الأمان لأداء المهام التشغيلية التالية:'
    },
    list: {
      en: [
        'Processing, roasting, preparing, and packaging your specialty orders',
        'Coordinating priority delivery and courier services across the Kingdom of Saudi Arabia',
        'Managing your private Customer Account',
        'Transmitting real-time order status and shipment notifications',
        'Delivering customized master-tailor measurement updates and fit notifications',
        'Preventing fraudulent transactions and ensuring overall digital platform security',
        'Analyzing website usage to improve loading speeds and user interface designs',
        'Providing tailored premium promotions and product recommendations (only with your explicit consent)'
      ],
      ar: [
        'معالجة طلباتكم وتحميص البن الطازج وإعداد الوجبات وتغليفها بعناية فائقة',
        'تنسيق خدمات التوصيل المحلي السريع والشحن المضمون لكافة مدن ومحافظات المملكة',
        'إدارة حساب العميل الخاص بك ومساحتك المخصصة لمتابعة المشتريات',
        'إرسال إشعارات وتحديثات فورية حول حالة طلباتكم ومسارات شحنها',
        'تحديث مقاسات الثياب المفصلة خصيصاً وإرسال إشعارات ملائمة القياس',
        'مكافحة الاحتيال والجرائم المعلوماتية وتأمين بنية موقعنا الرقمية بالكامل',
        'تحليل استخدام وتفاعلات الموقع لرفع كفاءة تصفح الصفحات وتطوير المظهر',
        'تقديم عروض حصرية وتوصيات بمنتجات راقية تناسب ذوقكم (فقط بعد موافقتكم الصريحة)'
      ]
    }
  },
  {
    id: 'payment-info',
    title: {
      en: '4. Payment Information',
      ar: '4. معلومات ومعالجة الدفع'
    },
    icon: 'CreditCard',
    content: {
      en: 'ZOAL is committed to ensuring absolute security during checkout. We do NOT store your complete credit card or debit card credentials on our servers. All financial transactions are safely managed through our payment gateways, which are strictly certified with Level 1 PCI-DSS compliance. All transmissions are encrypted using SSL technology. We accept Mada, Visa, Mastercard, Apple Pay, and STC Pay.',
      ar: 'تلتزم "زول" بضمان الحماية المطلقة لعمليات الدفع الإلكتروني. نحن لا نقوم بتخزين بيانات بطاقاتكم الائتمانية أو البنكية الكاملة على خوادمنا نهائياً. تتم معالجة جميع المدفوعات من خلال بوابات دفع آمنة ومعتمدة دولياً وممتثلة لأعلى معايير الأمن الرقمي العالمي (PCI-DSS). يتم تشفير جميع البيانات الحساسة عبر بروتوكولات تشفير SSL آمنة. نقبل الدفع عبر مدى، فيزا، ماستركارد، Apple Pay، و STC Pay.'
    }
  },
  {
    id: 'cookies',
    title: {
      en: '5. Cookies & Tracking Technologies',
      ar: '5. ملفات تعريف الارتباط والتعقب'
    },
    icon: 'Cookie',
    content: {
      en: 'Our platform uses cookies and similar digital identifiers to ensure seamless site functionality. Cookies help us recall your language preference (English or Arabic), maintain your shopping cart items across active sessions, and analyze anonymous web traffic patterns. These include Essential, Performance, Analytics, Functional, and Marketing Cookies. You can manage or disable your cookie preferences in your browser settings.',
      ar: 'يستخدم موقعنا ملفات تعريف الارتباط (Cookies) والمعرفات الرقمية المماثلة لضمان تجربة تصفح سلسة ومخصصة. تساعدنا هذه الملفات على تذكر لغتكم المفضلة (العربية أو الإنجليزية)، وحفظ محتويات سلة التسوق الخاصة بكم طوال الجلسة، وتحليل حركات التصفح العامة بشكل مجهول الهوية بالكامل. تشمل هذه الملفات: ملفات تعريف الارتباط الأساسية، والأداء، والتحليل، والوظيفية، والتسويقية. يمكنك تعديل إعدادات هذه الملفات أو تعطيلها تماماً من خلال خيارات متصفحك.'
    }
  },
  {
    id: 'marketing',
    title: {
      en: '6. Marketing Communications',
      ar: '6. الرسائل التسويقية والدعائية'
    },
    icon: 'Megaphone',
    content: {
      en: 'We only send curated updates, new specialty roast releases, or artisan thobe collection catalog announcements if you explicitly subscribe to our newsletter circle. You retain full control over your preferences and can choose to unsubscribe or opt-out at any time by clicking the "Unsubscribe" button in our emails, or adjusting your preferences within your account dashboard.',
      ar: 'نحن نقوم فقط بإرسال النشرات البريدية الراقية التي تتضمن أنواع القهوة المحمصة حديثاً، أو المخبوزات الموسمية، أو الكتالوجات الحصرية للثياب الفاخرة إذا قمت بالاشتراك الصريح في دائرتنا البريدية. تملك السيطرة الكاملة على تفضيلاتك ويمكنك إلغاء الاشتراك في أي وقت بالنقر على رابط "إلغاء الاشتراك" المتوفر بأسفل رسائلنا أو من خلال لوحة تحكم حسابك.'
    }
  },
  {
    id: 'data-sharing',
    title: {
      en: '7. Data Sharing',
      ar: '7. مشاركة البيانات مع أطراف ثالثة'
    },
    icon: 'Share2',
    content: {
      en: 'ZOAL deeply values your trust. We NEVER sell, lease, rent, or trade your personal data to any external marketing agencies. Your data is strictly shared with trusted logistics and infrastructure partners essential to fulfill your order:',
      ar: 'تقدر "زول" ثقتكم الغالية لأبعد الحدود. نحن لا نقوم ببيع، تأجير، أو تداول بياناتكم الشخصية مع أي جهات تسويقية خارجية على الإطلاق. تتم مشاركة بياناتكم بشكل محدود فقط مع شركاء الخدمات اللوجستية والتقنية الموثوقين لإتمام وتسليم طلباتكم بنجاح:'
    },
    list: {
      en: [
        'Secure payment processing gateways and bank networks',
        'Authorized logistics couriers and shipping companies for fast home delivery',
        'Premium cloud server and database hosting providers maintaining absolute encryptions',
        'Official customer support channels and notification dispatch systems'
      ],
      ar: [
        'بوابات الدفع الإلكتروني الآمنة والشبكات المصرفية المعتمدة',
        'شركات الشحن والخدمات اللوجستية المعتمدة لضمان التوصيل السريع لعنوانكم',
        'مزودو خدمات الاستضافة السحابية الفاخرة التي توفر أعلى بروتوكولات الحماية والتشفير',
        'أنظمة إرسال الإشعارات وقنوات الدعم الفني الفوري وخدمة العملاء'
      ]
    }
  },
  {
    id: 'data-security',
    title: {
      en: '8. Data Security',
      ar: '8. تدابير وأمان البيانات'
    },
    icon: 'Lock',
    content: {
      en: 'We deploy multi-layered, high-grade safety protocols to protect your personal information. These robust defenses include complete Secure Sockets Layer (SSL) encryption for all web traffic, secure hashed password parameters, localized encrypted databases, strict internal operational access control, and constant proactive monitoring of network behaviors.',
      ar: 'نطبق تدابير أمنية متعددة المستويات والدرجات لحماية معلوماتكم الشخصية. تشمل دفاعاتنا الرقمية القوية استخدام تشفير (SSL) الكامل لجميع اتصالات الموقع، وتشفير كلمات المرور خوارزمياً، وقواعد البيانات المشفرة محلياً وسحابياً، بالإضافة إلى حصر صلاحيات الوصول الداخلي على الموظفين المخولين فقط، والمراقبة الأمنية المستمرة للشبكة والخوادم لمنع أي محاولات وصول غير مشروعة.'
    }
  },
  {
    id: 'data-retention',
    title: {
      en: '9. Data Retention',
      ar: '9. الاحتفاظ بالبيانات'
    },
    icon: 'Clock',
    content: {
      en: 'We store your personal data only for as long as necessary to accomplish the services outlined in this Privacy Policy, fulfill legal or tax record-keeping requirements in Saudi Arabia, manage active customer accounts, or resolve possible disputes. Perishable and transient order details are archived securely over set periods.',
      ar: 'نحتفظ ببياناتكم الشخصية فقط طالما كانت ضرورية لتقديم الخدمات المذكورة في هذه السياسة، أو للامتثال للمتطلبات التنظيمية والقانونية والمالية المعمول بها في المملكة العربية السعودية، أو لإدارة حساباتكم النشطة، أو لفض أي نزاعات محتملة. يتم حفظ تفاصيل الطلبات المؤرشفة بشكل آمن ومنظم.'
    }
  },
  {
    id: 'your-rights',
    title: {
      en: '10. Your Rights',
      ar: '10. حقوقك القانونية والخيارات'
    },
    icon: 'UserCheck',
    content: {
      en: 'As a valued ZOAL customer, you hold comprehensive rights over your personal data under Saudi eCommerce and personal data protection regulations. You have the full authority to exercise the following:',
      ar: 'بصفتك عميلاً متميزاً لدى "زول"، فإنك تتمتع بحقوق كاملة وشاملة على بياناتك الشخصية بموجب أنظمة التجارة الإلكترونية ونظام حماية البيانات الشخصية في المملكة العربية السعودية. يحق لك القيام بما يلي:'
    },
    list: {
      en: [
        'Request access and view all personal information we store about you',
        'Request correction, modification, or updating of incomplete or incorrect records',
        'Request the complete deletion of your Customer Account and associated records',
        'Request a portable digital copy of your personal data',
        'Withdraw your consent for marketing emails, SMS, or WhatsApp campaigns'
      ],
      ar: [
        'طلب الوصول إلى كافة المعلومات والبيانات التي نحتفظ بها عنك والاطلاع عليها',
        'طلب تصحيح أو تعديل أو تحديث أي سجلات غير دقيقة أو غير مكتملة',
        'طلب الحذف والمسح الكامل والنهائي لحسابك وجميع السجلات المرتبطة به',
        'الحصول على نسخة رقمية قابلة للنقل من بياناتك الشخصية المسجلة لدينا',
        'سحب موافقتك على تلقي الحملات التسويقية أو الدعائية عبر البريد أو الجوال أو الواتساب'
      ]
    }
  },
  {
    id: 'childrens-privacy',
    title: {
      en: '11. Children’s Privacy',
      ar: '11. خصوصية الأطفال والقصر'
    },
    icon: 'HeartHandshake',
    content: {
      en: 'ZOAL is structured as a boutique luxury shopping platform designed for adults and individuals of legal shopping age. We do not knowingly collect personal information from individuals under the legal age of consent. If we learn that personal data of a minor has been collected without parental approval, we will purge it immediately from our servers.',
      ar: 'تم تصميم منصة "زول" كمنصة تسوق فاخرة موجهة للبالغين والأشخاص المؤهلين قانوناً للشراء والدفع. نحن لا نقوم بجمع أو طلب أي بيانات شخصية من القاصرين أو الأطفال تحت السن القانوني عن علم. إذا تبيّن لنا أننا قمنا بجمع بيانات طفل دون موافقة أولياء الأمور، فإننا نعمل على حذفها وتطهيرها من خوادمنا فوراً.'
    }
  },
  {
    id: 'third-party-services',
    title: {
      en: '12. Third-Party Services',
      ar: '12. خدمات ومنصات الطرف الثالث'
    },
    icon: 'ExternalLink',
    content: {
      en: 'Our digital architecture implements trusted third-party APIs (such as payment gates, secure Google Maps APIs for billing addresses, and Google Analytics to evaluate traffic). These integrated third-party services operate under their own autonomous privacy regulations, and we advise customers to review their respective privacy manuals.',
      ar: 'تتضمن بنيتنا البرمجية ميزات وواجهات برمجية (APIs) موثوقة لأطراف ثالثة (مثل بوابات الدفع الإلكتروني، وخرائط جوجل لتسهيل تحديد عناوين التوصيل، وإحصائيات تحليلات جوجل لتقييم زيارات الموقع). تعمل هذه الخدمات الخارجية وفقاً لسياسات الخصوصية المستقلة الخاصة بها، وننصح عملاءنا الكرام بمراجعة تلك السياسات الخاصة بكل جهة.'
    }
  },
  {
    id: 'international-transfers',
    title: {
      en: '13. International Data Transfers',
      ar: '13. نقل البيانات دولياً'
    },
    icon: 'Globe',
    content: {
      en: 'In order to offer reliable and redundant high-availability connections, some processed digital logs or encrypted backup files might be transmitted to and hosted on secure, certified cloud systems operated in global server centers. Regardless of location, ZOAL guarantees that all physical and logical databases remain bound to strict compliance constraints and robust security standards.',
      ar: 'من أجل تقديم اتصال فائق السرعة وموثوقية عالية للموقع، قد يتم نقل بعض السجلات الرقمية المشفرة أو ملفات النسخ الاحتياطي وتخزينها على خوادم سحابية آمنة تقع في مراكز بيانات عالمية تابعة لشركات تقنية رائدة. بغض النظر عن موقع التخزين المادي، تضمن "زول" بقاء جميع البيانات خاضعة لقيود أمنية مشددة تتوافق مع القوانين والأنظمة المعمول بها.'
    }
  },
  {
    id: 'updates-policy',
    title: {
      en: '14. Updates to this Policy',
      ar: '14. التحديثات والتعديلات الطارئة'
    },
    icon: 'RefreshCw',
    content: {
      en: 'We reserve the right to revise this Privacy Policy at our discretion to align with legislative changes, ecommerce regulations, or platform advancements. The "Last Updated" metadata displayed at the top of this page reflects the most current version. We encourage customers to review this page periodically to remain informed about our privacy frameworks.',
      ar: 'نحتفظ بحقنا الكامل في تعديل سياسة الخصوصية هذه وتحديثها من وقت لآخر لمواكبة التغيرات التشريعية، أو تنظيمات التجارة الإلكترونية، أو تطويرات الخدمات في موقعنا. يعكس تاريخ "آخر تحديث" المعروض في أعلى الصفحة تاريخ المراجعة الأحدث للسياسة. نوصي عملاءنا بزيارة هذه الصفحة بشكل دوري للبقاء على اطلاع دائم بسبل حماية بياناتهم.'
    }
  },
  {
    id: 'contact-info',
    title: {
      en: '15. Contact Information',
      ar: '15. معلومات التواصل وقنوات الدعم'
    },
    icon: 'Mail',
    content: {
      en: 'If you have any questions or wishes regarding our privacy practices, wish to assert your personal data rights, or want to coordinate directly with our data integrity officer, please contact our Customer Care office at your convenience via the official channels below:',
      ar: 'إذا كان لديكم أي استفسارات أو رغبات بخصوص ممارسات الخصوصية لدينا، أو ترغبون في ممارسة حقوقكم القانونية على بياناتكم، أو التنسيق المباشر مع مكتب حماية البيانات لدينا، يرجى عدم التردد في التواصل مع مكتب العناية بالعملاء الفاخر عبر قنواتنا الرسمية التالية:'
    }
  }
];
