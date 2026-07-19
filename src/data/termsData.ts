export interface TermsSection {
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
    en: 'Available 24/7 (Sovereign Patron Concierge Support)',
    ar: 'متاح على مدار الساعة وطوال أيام الأسبوع (خدمة عملاء زول الفاخرة)'
  }
};

export const termsSections: TermsSection[] = [
  {
    id: 'acceptance',
    title: {
      en: '1. Acceptance of Terms',
      ar: '1. قبول الشروط والأحكام'
    },
    icon: 'CheckSquare',
    content: {
      en: 'By accessing, browsing, registering, or making a transaction on the ZOAL boutique platform, you unconditionally agree to be bound by these comprehensive Terms & Conditions. These terms establish a legally binding agreement between you, as our esteemed patron, and ZOAL. If you do not agree with any of the luxury service guidelines outlined herein, we respectfully request that you refrain from using our website and concierge features.',
      ar: 'بدخولك إلى منصة "زول" (ZOAL) الفاخرة، أو تصفحها، أو إنشاء حساب فيها، أو إجراء أي عملية شراء، فإنك توافق دون قيد أو شرط على الالتزام بشروط الخدمة والأحكام الشاملة هذه. تمثل هذه الشروط اتفاقية قانونية ملزمة بينك كعميل متميز وبين "زول". وإذا كنت لا توافق على أي من الإرشادات الواردة هنا، فإننا نرجو منك التوقف عن استخدام الموقع وميزات الضيافة المتوفرة فيه.'
    }
  },
  {
    id: 'eligibility',
    title: {
      en: '2. Eligibility',
      ar: '2. أهلية الاستخدام والتعاقد'
    },
    icon: 'UserCheck',
    content: {
      en: 'The ZOAL boutique platform is strictly reserved for individuals who are legally capable of entering into binding contracts under the applicable laws of their residential jurisdiction and the Kingdom of Saudi Arabia. By completing a transaction, you affirm that you are of legal age of consent or have obtained appropriate parental/guardian authorization to procure items from our high-fashion, culinary, and bespoke collections.',
      ar: 'إن منصة "زول" مخصصة حصرياً للأشخاص المؤهلين قانوناً لإبرام عقود ملزمة بموجب الأنظمة والقوانين المعمول بها في دولتهم وفي المملكة العربية السعودية. بإتمامك لأي عملية شراء، فإنك تؤكد بلوغك السن القانوني أو حصولك على موافقة ولي الأمر لشراء المنتجات من مجموعات الأزياء الراقية، والأغذية الفاخرة، والخياطة المخصصة.'
    }
  },
  {
    id: 'customer-accounts',
    title: {
      en: '3. Customer Accounts',
      ar: '3. حسابات العملاء وعضوية النخبة'
    },
    icon: 'User',
    content: {
      en: 'To elevate your experience and unlock bespoke services such as custom thobe tailoring profiling and private order tracking, you may create a private Patron Account. By doing so, you acknowledge and agree to the following responsibilities:',
      ar: 'لترقية تجربتك والاستفادة من خدماتنا الفاخرة مثل ملف قياسات الثياب المفصلة وتتبع الطلبات الخاصة، يمكنك إنشاء حساب عميل خاص. من خلال ذلك، فإنك تقر وتوافق على المسؤوليات التالية:'
    },
    list: {
      en: [
        'Maintaining absolute confidentiality of your account password and access codes.',
        'Accepting complete responsibility for all interactions and transactions performed under your login.',
        'Providing current, accurate, and completely true registration details at all times.',
        'ZOAL reserves the absolute right to suspend, terminate, or lock accounts immediately if we detect any suspicious, fraudulent, or abusive behaviors.'
      ],
      ar: [
        'الحفاظ على السرية التامة لكلمة مرور حسابك ورموز المرور الخاصة بك.',
        'تحمل المسؤولية الكاملة عن كافة الأنشطة والمعاملات التي تتم باسم حسابك.',
        'تقديم معلومات تسجيل صحيحة ودقيقة ومحدثة بالكامل طوال الوقت.',
        'تحتفظ "زول" بالحق المطلق في تعليق أو إلغاء أو قفل أي حساب فوراً في حال رصد أي سلوك مشبوه أو احتيالي أو مسيء.'
      ]
    }
  },
  {
    id: 'product-info',
    title: {
      en: '4. Product Information',
      ar: '4. معلومات المنتجات والمجموعات الفاخرة'
    },
    icon: 'ShoppingBag',
    content: {
      en: 'ZOAL takes meticulous care to describe and display all high-end specialty roasts, fine patisserie items, and bespoke tailored thobes as accurately as possible. However, please observe the following guidelines:',
      ar: 'تبذل "زول" أقصى درجات العناية والحرص لوصف وعرض منتجات القهوة المختصة، والمخبوزات الفرنسية، والثياب المفصلة بدقة متناهية. ومع ذلك، نرجو ملاحظة الإرشادات التالية:'
    },
    list: {
      en: [
        'Descriptions, measurements, weights, and ingredients are provided as guidelines for appreciation.',
        'Real-life colors of luxury fabrics and thobes may vary slightly depending on your device screen settings.',
        'All seasonal roasts and tailor-cut fabrics are subject to change and stock availability without prior warning.'
      ],
      ar: [
        'تُقدم مواصفات المنتجات والمقاسات والأوزان والمكونات كإرشادات عامة للتوضيح.',
        'قد تختلف الألوان الحقيقية للأقمشة وثياب النوم قليلاً تبعاً لإعدادات وتكنولوجيا شاشة جهازك.',
        'جميع الأغذية الموسمية والبن الفاخر والأقمشة الحصرية قابلة للتغيير والنفاد دون إشعار مسبق.'
      ]
    }
  },
  {
    id: 'pricing',
    title: {
      en: '5. Pricing & Value',
      ar: '5. الأسعار والقيمة'
    },
    icon: 'DollarSign',
    content: {
      en: 'At ZOAL, we stand behind the outstanding quality and luxury status of our curated collections. All prices on our digital portal are displayed in Saudi Riyals (SAR). Prices are subject to revision and update without notice. Promotional campaigns or elite discount vouchers are valid strictly during their publicized timeframes. Appropriate Value-Added Tax (VAT) as mandated by the Zakat, Tax and Customs Authority of Saudi Arabia is explicitly displayed during your checkout sequence.',
      ar: 'نحن في "زول" نضمن جودة فائقة وقيمة حصرية لمنتجاتنا وخدماتنا. تُعرض جميع الأسعار على موقعنا بالريال السعودي (SAR). قد تخضع الأسعار للتعديل والتحديث في أي وقت دون إشعار مسبق. تسري الخصومات والعروض الترويجية فقط خلال فتراتها المحددة والمعلنة بشكل صريح. يتم احتساب وعرض ضريبة القيمة المضافة (VAT) المعمول بها في المملكة العربية السعودية بوضوح تام في شاشة الدفع.'
    }
  },
  {
    id: 'orders',
    title: {
      en: '6. Orders & Confirmation',
      ar: '6. تقديم الطلبات وتأكيدها'
    },
    icon: 'FileText',
    content: {
      en: 'All orders submitted through the ZOAL website constitute an offer to purchase and are subject to formal confirmation by our concierge team. ZOAL retains absolute authority to reject, cancel, or limit any order due to product unavailability, credit card suspicion, localized delivery difficulties, or measurement ambiguities for bespoke tailoring. A formal digital invoice is transmitted to your registered email immediately after our systems authorize your order.',
      ar: 'تعتبر جميع الطلبات المقدمة عبر موقع "زول" بمثابة رغبة في الشراء وتخضع لموافقة فريق خدمة العملاء لدينا. تحتفظ "زول" بالحق المطلق في رفض أو إلغاء أو تقييد أي طلب لعدة أسباب، منها عدم توفر المنتج، أو الاشتباه في بطاقة الدفع، أو صعوبة التوصيل، أو عدم وضوح مقاسات تفصيل الثياب. يتم إرسال فاتورة إلكترونية مفصلة إلى بريدك المسجل فور اعتماد الطلب.'
    }
  },
  {
    id: 'payments',
    title: {
      en: '7. Payments & Security',
      ar: '7. طرق الدفع والأمان الرقمي'
    },
    icon: 'CreditCard',
    content: {
      en: 'To maintain the highest level of security for our elite patrons, ZOAL uses payment processing partners certified with maximum Level 1 PCI-DSS data compliance. Your sensitive financial card information remains fully encrypted at all times. We support the following secure checkout options: Mada, Visa, Mastercard, Apple Pay, and STC Pay.',
      ar: 'لضمان أعلى درجات الأمان المالي لعملائنا الكرام، تستخدم "زول" بوابات دفع إلكترونية معتمدة وحائزة على أعلى شهادات أمن المعلومات المصرفية (PCI-DSS). تظل بيانات بطاقاتكم البنكية مشفرة بالكامل طوال الوقت. نقبل الدفع عبر: مدى، فيزا، ماستركارد، Apple Pay، و STC Pay.'
    }
  },
  {
    id: 'shipping-delivery',
    title: {
      en: '8. Shipping & Delivery',
      ar: '8. الشحن والتوصيل الفاخر'
    },
    icon: 'Truck',
    content: {
      en: 'ZOAL coordinates with premium local and regional logistics couriers to ensure prompt delivery across all areas of the Kingdom of Saudi Arabia. We provide free delivery for orders above 150 SAR, and charge a flat rate of 15 SAR for smaller transactions. Estimated shipment periods may experience unexpected shifts during official regional holidays, exceptional weather disruptions, or inaccurate customer location coordinates.',
      ar: 'تتعاون "زول" مع أفضل شركات الشحن والخدمات اللوجستية لضمان توصيل الطرود الفاخرة لكافة مناطق ومدن المملكة العربية السعودية. نوفر شحناً مجانياً للطلبات التي تزيد قيمتها عن 150 ريالاً سعودياً، وبرسوم شحن مخفضة قدرها 15 ريالاً سعودياً للطلبات الأقل. قد تتأثر فترات التوصيل المتوقعة في حالات العطلات الرسمية، أو الأحوال الجوية الطارئة، أو عدم دقة عنوان التوصيل.'
    }
  },
  {
    id: 'returns-refunds',
    title: {
      en: '9. Returns & Refunds',
      ar: '9. سياسة الاسترجاع والاسترداد'
    },
    icon: 'RefreshCcw',
    content: {
      en: 'At ZOAL, we aim for absolute satisfaction. Due to hygiene, safety regulations, and the bespoke nature of our boutique, certain items cannot be returned under any conditions, including baked products, opened grocery packs, and custom-tailored garments. Non-perishable items, ready-wear clothes, and coffee brewing accessories can be returned in original sealed conditions within 7 days. Refunds are credited back to your original payment cards.',
      ar: 'نهدف في "زول" إلى تحقيق رضاكم المطلق. ولدواعي الصحة العامة وطبيعة منتجاتنا الفاخرة والمخصصة، فإن بعض المنتجات غير قابلة للإرجاع نهائياً، وتشمل المخبوزات الطازجة، والحلويات، وعبوات الأغذية المفتوحة، والثياب المفصلة خصيصاً. نقبل إرجاع الملابس الجاهزة غير المستخدمة وأدوات تحضير القهوة غير المفتوحة في عبوتها الأصلية خلال 7 أيام من الاستلام. وتُعاد المبالغ المستردة إلى نفس بطاقة الدفع المستخدمة.'
    }
  },
  {
    id: 'cancellations',
    title: {
      en: '10. Cancellations',
      ar: '10. إلغاء الطلبات'
    },
    icon: 'XCircle',
    content: {
      en: 'Patrons may request order cancellation prior to dispatch from our fulfillment centers. Once an order is officially packaged and in transit with our logistics couriers, it cannot be canceled. Custom tailoring orders can only be canceled within 2 hours of payment authorization, before our master tailors begin drafting, cutting, and stitching your bespoke fabrics.',
      ar: 'يحق للعميل طلب إلغاء الطلب قبل تسليمه لشركة الشحن أو خروجه مع مندوب التوصيل. بمجرد تغليف الطلب وخروجه للتوصيل، لا يمكن إلغاؤه، وتطبق عليه سياسة الاسترجاع العادية للسلع المؤهلة. أما بالنسبة لطلبات تفصيل الثياب الخاصة، فلا يمكن إلغاؤها إلا في غضون ساعتين من إتمام الدفع وقبل بدء الخياط الحرفي في قص القماش وتجهيز الثوب.'
    }
  },
  {
    id: 'intellectual-property',
    title: {
      en: '11. Intellectual Property',
      ar: '11. الملكية الفكرية وحماية العلامة التجارية'
    },
    icon: 'Award',
    content: {
      en: 'All visual and written assets compiled on the ZOAL boutique platform, including but not limited to logos, branding typography, product photography, graphic designs, recipes, custom code, videos, and layout styles, are the exclusive intellectual property of ZOAL. These assets are protected by local and international intellectual property legislation and Saudi Ministry of Commerce trademark laws. Any unapproved copying, reproduction, distribution, or commercial reuse is strictly forbidden.',
      ar: 'تعتبر جميع الأصول المرئية والمكتوبة والمصورة على منصة "زول" – بما في ذلك على سبيل المثال لا الحصر: الشعارات، وتصاميم الخطوط، وصور المنتجات، والتصاميم الجرافيكية، والوصفات، والأكواد البرمجية، ومقاطع الفيديو، ومظهر الموقع – ملكية فكرية حصرية لعلامة "زول". تحمي هذه الأصول القوانين المحلية والدولية للملكية الفكرية ونظام العلامات التجارية في المملكة العربية السعودية. ويُمنع منعاً باتاً أي نسخ، أو إعادة إنتاج، أو توزيع، أو إعادة استخدام تجاري غير مصرح به.'
    }
  },
  {
    id: 'user-responsibilities',
    title: {
      en: '12. User Responsibilities',
      ar: '12. مسؤوليات التصفح والاستخدام'
    },
    icon: 'ShieldAlert',
    content: {
      en: 'By accessing our platform, you commit to maintaining ethical, civil interaction. You are strictly prohibited from uploading malicious software, attempting database access bypasses, submitting false measurements, abusing other patrons, or executing scripts that degrade our server speeds.',
      ar: 'من خلال استخدامك لموقعنا، فإنك تتعهد بالالتزام بالسلوك الأخلاقي والقوانين المنظمة. يُمنع منعاً باتاً رفع أو نقل أي برمجيات خبيثة أو فيروسات، أو محاولة اختراق خوادمنا أو قواعد البيانات، أو تزويدنا بمقاسات أو بيانات كاذبة، أو إساءة استخدام الموقع بأي طريقة قد تؤدي إلى إبطاء أداء خوادمنا الرقمية.'
    }
  },
  {
    id: 'limitation-liability',
    title: {
      en: '13. Limitation of Liability',
      ar: '13. حدود المسؤولية وإخلاء الطرف'
    },
    icon: 'AlertTriangle',
    content: {
      en: 'To the maximum extent permitted by Saudi Arabia commerce regulations, ZOAL is not liable for indirect, incidental, or consequential losses, including lost profits, internet connectivity delays, third-party payment gateway outages, or delivery disruptions caused by forces beyond our control, unless such liability cannot be legally excluded under Saudi law.',
      ar: 'بأقصى حد تسمح به أنظمة التجارة في المملكة العربية السعودية، لا تتحمل "زول" المسؤولية عن أي خسائر غير مباشرة، أو طارئة، أو تبعية، بما في ذلك خسارة الأرباح، أو تأخر اتصال الإنترنت، أو انقطاع خدمات بوابات الدفع التابعة لأطراف ثالثة، أو مشاكل الشحن الناتجة عن ظروف خارجة عن إرادتنا وسيطرتنا، باستثناء ما تفرضه الأنظمة المعمول بها.'
    }
  },
  {
    id: 'privacy',
    title: {
      en: '14. Privacy Commitment',
      ar: '14. حماية خصوصية البيانات'
    },
    icon: 'Shield',
    content: {
      en: 'We handle your personal identifiers and transactional details with utmost confidentiality, encryption, and protection. All personal data collection, utilization, and archival are operated in absolute compliance with our official Privacy Policy. You are invited to review our Privacy Policy to understand our encryption techniques.',
      ar: 'نحن نتعامل مع معلوماتك الشخصية وتفاصيل معاملاتك المالية بأعلى درجات السرية والتشفير والأمان. يتم جمع كافة البيانات الشخصية واستخدامها وأرشفتها بما يتوافق تماماً مع سياسة الخصوصية الرسمية الخاصة بنا. ندعو عملائنا الكرام لمراجعة سياسة الخصوصية لمعرفة تقنيات التشفير المتبعة لدينا.'
    }
  },
  {
    id: 'governing-law',
    title: {
      en: '15. Governing Law',
      ar: '15. القانون الحاكم والاختصاص القضائي'
    },
    icon: 'Scale',
    content: {
      en: 'These Terms & Conditions, along with all operations and transactions on the ZOAL luxury platform, are governed, construed, and enforced in complete accordance with the applicable laws and electronic commerce regulations of the Kingdom of Saudi Arabia. Any disputes or claims arising out of these terms shall be subject to the exclusive jurisdiction of the competent courts in the Eastern Province, Saudi Arabia.',
      ar: 'تخضع شروط وأحكام الخدمة هذه، وكافة المعاملات وعمليات الشراء التي تتم عبر موقع "زول"، وتُفسر وتُطبق بالكامل بموجب القوانين والأنظمة السارية وقانون التجارة الإلكترونية في المملكة العربية السعودية. ويخضع أي نزاع أو مطالبة تنشأ عن هذه الشروط للاختصاص القضائي الحصري للمحاكم المختصة في المنطقة الشرقية بالمملكة العربية السعودية.'
    }
  },
  {
    id: 'changes-terms',
    title: {
      en: '16. Changes to Terms',
      ar: '16. تعديل وتحديث الشروط'
    },
    icon: 'RefreshCw',
    content: {
      en: 'ZOAL retains the absolute right to modify, adapt, or completely update these Terms & Conditions at any time to align with legal reforms, ecommerce changes, or internal boutique milestones. The updated terms will be published on this page, with the "Last Updated" timestamp reflecting the date of revision. Your continued use of our platform constitutes agreement to the updated terms.',
      ar: 'تحتفظ "زول" بالحق المطلق في تعديل أو تحديث شروط الخدمة والأحكام هذه في أي وقت لمواكبة الإصلاحات القانونية، أو التطورات في التجارة الإلكترونية، أو التعديلات التشغيلية الداخلية لدينا. سيتم نشر النسخة المحدثة على هذه الصفحة، ويعكس تاريخ "آخر تحديث" تاريخ المراجعة الأحدث. ويعتبر استمرارك في استخدام موقعنا بمثابة موافقة صريحة منك على الشروط المعدلة.'
    }
  },
  {
    id: 'contact-info',
    title: {
      en: '17. Contact Information',
      ar: '17. معلومات التواصل الفاخر'
    },
    icon: 'Mail',
    content: {
      en: 'If you require clarification on our terms, wish to coordinate regarding active orders, or want to obtain private concierge support, please reach out directly to the ZOAL patron care suite via our designated high-priority channels:',
      ar: 'إذا كان لديك أي استفسار حول الشروط والأحكام، أو ترغب في التنسيق والمتابعة بشأن طلباتك النشطة، أو الحصول على دعم مخصص، يرجى التواصل مباشرة مع قسم العناية بـ عملاء "زول" الفاخر عبر قنواتنا الرسمية التالية:'
    }
  }
];
