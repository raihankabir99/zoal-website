export interface FAQItem {
  id: string;
  category: string;
  question: {
    en: string;
    ar: string;
  };
  answer: {
    en: string;
    ar: string;
  };
}

export interface FAQCategory {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  icon: string;
}

export const faqCategories: FAQCategory[] = [
  {
    id: 'orders',
    name: {
      en: 'Orders',
      ar: 'الطلبات'
    },
    icon: 'ShoppingBag'
  },
  {
    id: 'payments',
    name: {
      en: 'Payments',
      ar: 'المدفوعات'
    },
    icon: 'CreditCard'
  },
  {
    id: 'delivery',
    name: {
      en: 'Delivery',
      ar: 'التوصيل'
    },
    icon: 'Truck'
  },
  {
    id: 'products',
    name: {
      en: 'Products',
      ar: 'المنتجات'
    },
    icon: 'Coffee'
  },
  {
    id: 'returns',
    name: {
      en: 'Returns & Refunds',
      ar: 'الاسترجاع والاسترداد'
    },
    icon: 'RefreshCw'
  }
];

export const faqData: FAQItem[] = [
  // ORDERS
  {
    id: 'order-1',
    category: 'orders',
    question: {
      en: 'How do I place an order?',
      ar: 'كيف يمكنني تقديم طلب؟'
    },
    answer: {
      en: 'To place an order, navigate to our Store, select your desired items (such as our freshly roasted coffee, house-baked bakery items, or premium Sudanese thobes), choose any available option specifications, and click "Add to Cart". When you are ready, click on your Shopping Cart to review items and proceed to our secure Checkout to enter your contact and delivery details.',
      ar: 'لتقديم طلب، يرجى تصفح المتجر واختيار المنتجات التي ترغب في شرائها (مثل القهوة المحمصة الطازجة، أو المخبوزات الطازجة، أو الثياب السودانية الفاخرة)، ثم اختر الخصائص المطلوبة وانقر على "إضافة إلى السلة". عندما تكون جاهزًا، اضغط على سلة التسوق لمراجعة طلبك ثم انتقل إلى صفحة الدفع الآمنة لإدخال معلومات الاتصال والتوصيل.'
    }
  },
  {
    id: 'order-2',
    category: 'orders',
    question: {
      en: 'Can I cancel my order?',
      ar: 'هل يمكنني إلغاء طلبي؟'
    },
    answer: {
      en: 'Yes, orders can be cancelled within 1 hour of placement before they enter the preparation and roasting stage. To request a cancellation, please contact our Customer Support immediately via WhatsApp at +966 56 769 9315 with your Order Number.',
      ar: 'نعم، يمكن إلغاء الطلبات في غضون ساعة واحدة من تقديم الطلب وقبل دخوله مرحلة التحضير والتحميص. لطلب الإلغاء، يرجى التواصل مع فريق الدعم فورًا عبر الواتساب على الرقم 966567699315+ وتزويدنا برقم طلبك.'
    }
  },
  {
    id: 'order-3',
    category: 'orders',
    question: {
      en: 'Can I change my order after placing it?',
      ar: 'هل يمكنني تعديل طلبي بعد تقديمه؟'
    },
    answer: {
      en: 'We aim to process and ship orders as quickly as possible. If you need to make changes to your products or quantities, please contact our WhatsApp Support within 30 minutes of placing the order, and we will do our best to accommodate your requests.',
      ar: 'نسعى جاهدين لمعالجة الطلبات وشحنها في أسرع وقت ممكن. إذا كنت بحاجة إلى إجراء تغييرات على منتجاتك أو كمياتها، يرجى التواصل معنا عبر الواتساب في غضون 30 دقيقة من تقديم الطلب، وسنبذل قصارى جهدنا لتلبية طلبك.'
    }
  },
  {
    id: 'order-4',
    category: 'orders',
    question: {
      en: 'How can I track my order?',
      ar: 'كيف يمكنني تتبع طلبي؟'
    },
    answer: {
      en: 'You can track your orders in real-time by logging into your account and visiting the Customer Dashboard. There, you can view the active status of your order, delivery milestones, and estimated delivery times.',
      ar: 'يمكنك تتبع طلباتك في الوقت الفعلي عن طريق تسجيل الدخول إلى حسابك وزيارة لوحة تحكم العملاء. هناك، يمكنك الاطلاع على الحالة النشطة لطلبك، ومراحل التوصيل، وأوقات التسليم المتوقعة.'
    }
  },
  {
    id: 'order-5',
    category: 'orders',
    question: {
      en: 'How do I update my delivery address?',
      ar: 'كيف يمكنني تحديث عنوان التوصيل الخاص بي؟'
    },
    answer: {
      en: 'If your order has not been dispatched yet, you can quickly update your delivery address by contacting our WhatsApp team with your Order ID. Please note that changing the address may affect the delivery schedule.',
      ar: 'إذا لم يتم شحن طلبك بعد، يمكنك تحديث عنوان التوصيل بسرعة من خلال التواصل مع فريق الدعم عبر الواتساب وتزويدهم برقم طلبك. يرجى العلم بأن تغيير العنوان قد يؤثر على جدول التوصيل.'
    }
  },

  // PAYMENTS
  {
    id: 'pay-1',
    category: 'payments',
    question: {
      en: 'What payment methods do you accept?',
      ar: 'ما هي طرق الدفع المقبولة؟'
    },
    answer: {
      en: 'We accept a wide variety of secure payment methods, including Cash on Delivery (COD) for supported areas, credit/debit cards (Visa, Mastercard, Mada), Apple Pay, and digital wallets like STC Pay.',
      ar: 'نقبل مجموعة متنوعة من طرق الدفع الآمنة، بما في ذلك الدفع عند الاستلام (COD) للمناطق المدعومة، والبطاقات الائتمانية والمدى (Visa, Mastercard, Mada)، وApple Pay، بالإضافة إلى المحافظ الرقمية مثل STC Pay.'
    }
  },
  {
    id: 'pay-2',
    category: 'payments',
    question: {
      en: 'Can I pay using Apple Pay?',
      ar: 'هل يمكنني الدفع باستخدام Apple Pay؟'
    },
    answer: {
      en: 'Absolutely. Apple Pay is fully integrated and supported for seamless, secure checkout on compatible iOS, macOS, and Safari browser configurations.',
      ar: 'بالتأكيد. خدمة Apple Pay مدمجة بالكامل وتدعم الدفع السلس والآمن على الأجهزة المتوافقة مع أنظمة iOS و macOS ومتصفح Safari.'
    }
  },
  {
    id: 'pay-3',
    category: 'payments',
    question: {
      en: 'Can I pay using Mada?',
      ar: 'هل يمكنني الدفع باستخدام بطاقة مدى الكترونياً؟'
    },
    answer: {
      en: 'Yes, we fully support Mada debit card payments online for all orders placed within Saudi Arabia.',
      ar: 'نعم، نحن ندعم بالكامل الدفع بواسطة بطاقات مدى البنكية عبر الإنترنت لجميع الطلبات داخل المملكة العربية السعودية.'
    }
  },
  {
    id: 'pay-4',
    category: 'payments',
    question: {
      en: 'Can I pay using Visa?',
      ar: 'هل يمكنني الدفع ببطاقة فيزا؟'
    },
    answer: {
      en: 'Yes, Visa credit and debit cards are supported through our 3D-secure global payment processing getaway.',
      ar: 'نعم، جميع بطاقات الفيزا الائتمانية والمدفوعة مسبقاً مدعومة عبر بوابة الدفع الآمنة وثنائية التحقق الخاصة بنا.'
    }
  },
  {
    id: 'pay-5',
    category: 'payments',
    question: {
      en: 'Can I pay using Mastercard?',
      ar: 'هل يمكنني الدفع ببطاقة ماستركارد؟'
    },
    answer: {
      en: 'Yes, we accept all major Mastercard credit and debit cards securely.',
      ar: 'نعم، نقبل جميع بطاقات ماستركارد الائتمانية وبطاقات الخصم المباشر بشكل آمن.'
    }
  },
  {
    id: 'pay-6',
    category: 'payments',
    question: {
      en: 'Can I pay using STC Pay?',
      ar: 'هل يمكنني الدفع باستخدام STC Pay؟'
    },
    answer: {
      en: 'Yes, STC Pay wallet is fully integrated and supported. You can select STC Pay at checkout to complete the payment instantly using your mobile number.',
      ar: 'نعم، محفظة STC Pay متكاملة ومدعومة تمامًا. يمكنك اختيار STC Pay عند الدفع لإتمام المعاملة فورًا باستخدام رقم جوالك.'
    }
  },

  // DELIVERY
  {
    id: 'del-1',
    category: 'delivery',
    question: {
      en: 'Which cities do you deliver to?',
      ar: 'ما هي المدن التي تقومون بالتوصيل إليها؟'
    },
    answer: {
      en: 'We provide local delivery inside Al Hofuf (Al-Ahsa), and priority courier shipping to all major cities across the Kingdom of Saudi Arabia, including Riyadh, Jeddah, Dammam, Mecca, and Medina.',
      ar: 'نوفر خدمة التوصيل المحلي السريع داخل الهفوف (الأحساء)، وشحناً فائق الأولوية لجميع المدن الرئيسية في المملكة العربية السعودية، بما في ذلك الرياض، جدة، الدمام، مكة المكرمة، والمدينة المنورة.'
    }
  },
  {
    id: 'del-2',
    category: 'delivery',
    question: {
      en: 'How long does delivery take?',
      ar: 'كم يستغرق التوصيل؟'
    },
    answer: {
      en: 'Local deliveries within Al Hofuf are fulfilled within same-day or next-day. Regional deliveries across Saudi Arabia via priority courier generally take 2 to 4 business days.',
      ar: 'يتم تسليم الطلبات المحلية داخل الهفوف في نفس اليوم أو اليوم التالي. أما الشحن الإقليمي لجميع مدن المملكة فيستغرق عادةً من يومين إلى 4 أيام عمل.'
    }
  },
  {
    id: 'del-3',
    category: 'delivery',
    question: {
      en: 'Do you offer same-day delivery?',
      ar: 'هل تتوفر خدمة التوصيل في نفس اليوم؟'
    },
    answer: {
      en: 'Yes, same-day delivery is available for orders placed within Al Hofuf before 4:00 PM.',
      ar: 'نعم، تتوفر خدمة التوصيل في نفس اليوم للطلبات المقدمة داخل الهفوف قبل الساعة 4:00 مساءً.'
    }
  },
  {
    id: 'del-4',
    category: 'delivery',
    question: {
      en: 'How much does shipping cost?',
      ar: 'كم تبلغ تكلفة الشحن والتوصيل؟'
    },
    answer: {
      en: 'Shipping and local delivery are completely FREE for all orders above 150 SAR. For orders below 150 SAR, a flat delivery fee of 15 SAR is applied.',
      ar: 'الشحن والتوصيل مجاني تمامًا لجميع الطلبات التي تتجاوز قيمتها 150 ريال سعودي. بالنسبة للطلبات الأقل من 150 ريالاً، يتم تطبيق رسوم توصيل موحدة بقيمة 15 ريالاً سعودياً.'
    }
  },
  {
    id: 'del-5',
    category: 'delivery',
    question: {
      en: 'Can I schedule my delivery?',
      ar: 'هل يمكنني جدولة موعد التوصيل؟'
    },
    answer: {
      en: 'Yes, local delivery orders within Al Hofuf can be scheduled. After placing your order, please coordinate with our delivery dispatcher via WhatsApp to choose your preferred time slot.',
      ar: 'نعم، يمكن جدولة مواعيد التوصيل المحلي داخل الهفوف. بعد إتمام طلبك، يرجى التنسيق مع مسؤول التوصيل لدينا عبر الواتساب لاختيار الفترة الزمنية المفضلة لديك.'
    }
  },

  // PRODUCTS
  {
    id: 'prod-1',
    category: 'products',
    question: {
      en: 'Are your coffee products freshly roasted?',
      ar: 'هل منتجات القهوة محمصة طازجة؟'
    },
    answer: {
      en: 'Absolutely. All our specialty coffee beans are custom-roasted in small batches by our certified master roasters to ensure optimal flavor notes, delicate aroma, and unparalleled freshness when they arrive at your door.',
      ar: 'بكل تأكيد. يتم تحميص جميع حبوب القهوة المختصة لدينا بكميات صغيرة ومحدودة على يد خبراء تحميص معتمدين، لضمان أعلى مستويات المذاق الغني، والرائحة الزكية، والنعومة الطازجة عند وصولها إليك.'
    }
  },
  {
    id: 'prod-2',
    category: 'products',
    question: {
      en: 'Are your bakery products baked daily?',
      ar: 'هل المخبوزات طازجة ومخبوزة يومياً؟'
    },
    answer: {
      en: 'Yes, our traditional artisan bakery items, breads, and premium pastries are baked fresh every morning from top-tier gourmet ingredients to preserve authentic flavor and texture.',
      ar: 'نعم، يتم خبز منتجاتنا التقليدية الفاخرة، والخبز البلدي، والحلويات اللذيذة طازجةً كل صباح باستخدام أجود المكونات الطبيعية للحفاظ على النكهة والقوام الأصيل.'
    }
  },
  {
    id: 'prod-3',
    category: 'products',
    question: {
      en: 'Are your fashion products authentic?',
      ar: 'هل منتجات الأزياء والملابس أصلية؟'
    },
    answer: {
      en: 'Yes, ZOAL takes immense pride in authenticity. All our heritage Sudanese and Arabian thobes, garments, and fabrics are custom tailored, sourced from verified premium textile mills, and meet meticulous luxury specifications.',
      ar: 'نعم، تفخر علامة "زول" بتقديم المنتجات الأصيلة فقط. جميع الثياب والأقمشة السودانية والعربية التراثية مصممة ومصنوعة يدوياً ومستوردة من أرقى مصانع النسيج، وتخضع لمعايير الجودة الفاخرة.'
    }
  },
  {
    id: 'prod-4',
    category: 'products',
    question: {
      en: 'Are the product images accurate?',
      ar: 'هل صور المنتجات مطابقة للواقع؟'
    },
    answer: {
      en: 'Every product image displayed on ZOAL is captured under studio conditions to reflect true colors, textures, and details. Minimal variations may occur due to screen calibration differences.',
      ar: 'جميع صور المنتجات المعروضة على موقعنا تم التقاطها في استوديوهات احترافية لتعكس الألوان، والأنسجة، والتفاصيل الحقيقية بدقة تامة. قد تحدث اختلافات طفيفة جداً بسبب إعدادات شاشات الأجهزة.'
    }
  },
  {
    id: 'prod-5',
    category: 'products',
    question: {
      en: 'How should I store coffee products?',
      ar: 'كيف يجب أن أقوم بتخزين منتجات القهوة؟'
    },
    answer: {
      en: 'To maintain premium freshness, store your coffee beans in a cool, dark, dry environment in an airtight container. Avoid storing them in refrigerators or expose them to direct sunlight or humidity.',
      ar: 'للحفاظ على جودة ونضارة القهوة، يرجى تخزين حبوب القهوة في مكان بارد، مظلم، وجاف داخل حاوية محكمة الإغلاق. تجنب وضعها في الثلاجة أو تعريضها لأشعة الشمس المباشرة أو الرطوبة.'
    }
  },

  // RETURNS & REFUNDS
  {
    id: 'ret-1',
    category: 'returns',
    question: {
      en: 'Can I return my order?',
      ar: 'هل يمكنني إرجاع طلبي؟'
    },
    answer: {
      en: 'We accept returns on non-perishable goods (such as unused fashion, thobes, accessories, and un-opened coffee equipment) within 7 days of delivery, provided they are in their original packaging and condition.',
      ar: 'نقبل إرجاع السلع غير القابلة للتلف (مثل الملابس والثياب غير المستخدمة، والإكسسوارات، وأدوات القهوة غير المفتوحة) في غضون 7 أيام من تاريخ الاستلام، بشرط أن تكون في حالتها الأصلية وعبوتها المغلقة.'
    }
  },
  {
    id: 'ret-2',
    category: 'returns',
    question: {
      en: 'How do I request a refund?',
      ar: 'كيف يمكنني طلب استرداد الأموال؟'
    },
    answer: {
      en: 'To request a refund, please contact our support team on WhatsApp or send an email to alzoal3003@gmail.com with your order number, photo of the item, and reason for return.',
      ar: 'لطلب استرداد الأموال، يرجى التواصل مع فريق الدعم عبر الواتساب أو إرسال بريد إلكتروني إلى alzoal3003@gmail.com يتضمن رقم الطلب، وصورة المنتج، وسبب الإرجاع.'
    }
  },
  {
    id: 'ret-3',
    category: 'returns',
    question: {
      en: 'Who pays for return shipping?',
      ar: 'من يتحمل تكاليف شحن الإرجاع؟'
    },
    answer: {
      en: 'If you receive a damaged or incorrect item, ZOAL will fully cover the return shipping costs. For returns due to personal preference or change of mind, the customer is responsible for the return courier fee.',
      ar: 'إذا استلمت منتجًا تالفًا أو خاطئًا، ستتحمل "زول" تكاليف شحن الإرجاع بالكامل. أما في حال الإرجاع بناءً على الرغبة الشخصية أو تغيير الرأي، فيتحمل العميل رسوم شركة الشحن.'
    }
  },
  {
    id: 'ret-4',
    category: 'returns',
    question: {
      en: 'How long does a refund take?',
      ar: 'كم من الوقت يستغرق استرداد المبلغ؟'
    },
    answer: {
      en: 'Once your returned item is received and inspected at our flagships, we will process your refund. It generally takes 3 to 7 business days for the funds to reflect in your original payment method, depending on your bank.',
      ar: 'بمجرد استلام المنتج المرتجع وفحصه في مستودعاتنا، سنقوم بمعالجة عملية الاسترداد. يستغرق الأمر عادةً من 3 إلى 7 أيام عمل لتظهر الأموال في حسابك، اعتمادًا على البنك الخاص بك.'
    }
  },
  {
    id: 'ret-5',
    category: 'returns',
    question: {
      en: 'Which products cannot be returned?',
      ar: 'ما هي المنتجات التي لا يمكن إرجاعها؟'
    },
    answer: {
      en: 'For health, safety, and hygiene reasons, perishable bakery items, opened gourmet grocery products, customized tailor-made thobes, and opened coffee beans cannot be returned or exchanged.',
      ar: 'لدواعي الصحة والسلامة العامة، لا يمكن إرجاع أو استبدال المخبوزات والسلع سريعة التلف، والمنتجات الغذائية المفتوحة، والثياب المصممة والمفصلة خصيصاً بمقاسات معينة، وحبوب القهوة بعد فتح تغليفها.'
    }
  }
];
