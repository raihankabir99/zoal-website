import { Product, Branch, Article, Order } from './types';

export const PRODUCTS: Product[] = [
  // 1. ZOAL COFFEE CAFE ('coffee')
  {
    id: 'c1',
    name: 'ZOAL Royal Saffron Gold Latte',
    description: 'Our signature espresso-infused cream beverage, micro-blended with first-grade golden saffron strands, cardamom, and subtle layers of organic honey.',
    subDescription: '100% Specialist Grade Arabica, traditional gold seal blend.',
    price: 0,
    category: 'coffee',
    deliveryType: 'LOCAL_ONLY',
    images: [
      '/src/assets/images/coffee-saffron-latte.jpg',
      '/src/assets/images/coffee-saffron-latte-detail.jpg'
    ],
    specifications: {
      'Serving Profile': 'Hot or Shaken over Swiss Ice Spheres',
      'Infuser': 'Organic Yemen Haraz Saffron & Cardamom essence',
      'Espresso base': 'Double extracted Obsidian roast',
      'Dairy Variant': 'Organic fresh grass-fed pasture milk'
    },
    story: 'Meticulously crafted to redefine beverage luxury, our Royal Saffron Latte marries intense single-origin coffee with rich, aromatic saffron oils prized across traditional hospitality. A sensory masterpiece designed for those who appreciate refined thermal excellence.',
    rating: 4.9,
    inventory: 90,
    popular: true,
    reviews: [
      { id: 'r1', reviewerName: 'Hisham A. (Branch B)', rating: 5, date: '2026-05-18', comment: 'An absolute masterpiece. The saffron is incredibly delicate.' },
      { id: 'r2', reviewerName: 'Sara Al-Khobar', rating: 5, date: '2026-05-30', comment: 'Perfect balance. The gold standard for specialty beverages.' }
    ]
  },
  {
    id: 'c2',
    name: 'Obsidian Velvet Cold Brew',
    description: 'A slow-dripped cold extraction utilizing premium dark roasted beans, served over a dense house-made cream float and caramelized raw sugar crust.',
    subDescription: 'Cold-steeped over exactly 24 hours under nitrogen pressurization.',
    price: 0,
    category: 'coffee',
    deliveryType: 'LOCAL_ONLY',
    images: [
      '/src/assets/images/coffee-cold-brew.jpg'
    ],
    specifications: {
      'Steep Time': '24-hour slow maturation',
      'Acidity Index': 'Extremely low, rich dark cocoa notes',
      'Serving Bowl': 'Handblown dual-walled crystal glass'
    },
    story: 'Crafted as a slow-tempered sensory sanctuary, our Obsidian Velvet Cold brew is extracted trickle-by-trickle to lock in pure chocolatey polyphenols with none of the carbon bitterness found in conventional cold drinks.',
    rating: 4.8,
    inventory: 50,
    popular: false,
    reviews: []
  },
  {
    id: 'c3',
    name: 'ZOAL Taif Rose Saffron Tea',
    description: 'An ethereal steep of handpicked Taif rosebuds coupled with premier Kashmiri saffron strands and wild orange blossom oils.',
    subDescription: 'Organic herbal infusion for high-end hospitality gatherings.',
    price: 0,
    category: 'coffee',
    deliveryType: 'LOCAL_ONLY',
    images: [
      '/src/assets/images/coffee-rose-tea.jpg'
    ],
    specifications: {
      'Origin': 'Taif Rose Valley & Kashmir Plains',
      'Steep Temp': '88.5°C precise infusion',
      'Format': 'Loose leaf in sealed hermetic tins'
    },
    story: 'This botanical elixir represents our tribute to traditional Arabic tea rituals. The floral top notes of Taif rose pair wonderfully with the deep, earthy richness of genuine saffron.',
    rating: 5.0,
    inventory: 120,
    popular: false,
    reviews: []
  },

  // 2. SUDAN BAKERY & SNACKS ('bakery')
  {
    id: 'b1',
    name: 'Premium House Traditional Hoboz Bread',
    description: 'Authentic Sudanese flatbread, stone-fired with real white sesame seed sprinklings. Soft, pillowy pockets engineered with traditional high-rise fermentation.',
    subDescription: 'Crafted fresh daily on our wood-burning stone deck hearths.',
    price: 0,
    category: 'bakery',
    deliveryType: 'LOCAL_ONLY',
    images: [
      '/src/assets/images/bakery-hoboz.jpg'
    ],
    specifications: {
      'Sourdough Starter': 'Classic Traditional Wild Culture',
      'Baking Temp': '420°C quick wood-fire blister',
      'Portion': 'Pack of 5 freshly-fired breads',
      'Allergens': 'Gluten, Sesame'
    },
    story: 'No kitchen table is complete without authentic Hoboz. Our master bakers hand-knead the premium flour with natural culture starters, reproducing the timeless Sudanese home texture—elastic, fragrant, and perfectly blistered.',
    rating: 4.9,
    inventory: 200,
    popular: true,
    reviews: [
      { id: 'r3', reviewerName: 'Hassan M.', rating: 5, date: '2026-06-05', comment: 'Brings back childhood memories immediately. Hot, fluffy, and completely fresh!' }
    ]
  },
  {
    id: 'b2',
    name: 'Golden Saffron Ghoriba Biscuits',
    description: 'Traditional melt-in-the-mouth Sudanese butter cookies decorated with whole cardamoms and delicate hints of premium saffron essence.',
    subDescription: 'Our signature heritage sweet treat baked from fine ghee.',
    price: 0,
    category: 'bakery',
    deliveryType: 'LOCAL_ONLY',
    images: [
      '/src/assets/images/bakery-ghoriba.jpg'
    ],
    specifications: {
      'Butter Quality': '100% Traditional pure clarified ghee',
      'Texture': 'Ethereal, sand-like delicate melt',
      'Garnish': 'Shelled sweet cardamoms & gold foil crown'
    },
    story: 'The ultimate luxury Sudanese sweet. We bake these delicate Ghoriba cookies according to a grandmother’s secret recipe in small, temperature-tuned convection ovens to preserve their pearlescent white crust.',
    rating: 4.8,
    inventory: 80,
    popular: false,
    reviews: []
  },
  {
    id: 'b3',
    name: 'Spiced Savory Sudanese Sambuxas',
    description: 'Exquisite, light, triangular fried pastry skins stuffed with traditional green herbs, minced beef, and Sudanese spice formulations.',
    subDescription: 'Traditional crispy hot snack fired in small carefully-monitored batches.',
    price: 0,
    category: 'bakery',
    deliveryType: 'LOCAL_ONLY',
    images: [
      '/src/assets/images/bakery-sambuxa.jpg'
    ],
    specifications: {
      'Knead': 'Ultra-thin hand-rolled layered dough',
      'Spicing': 'Skeireg spice, coriander, crushed pepper',
      'Crispness': 'Double-flash-fired to achieve complete air pockets'
    },
    story: 'Stuffed with fresh, highly aromatic leafy greens and pristine quality meats, our Sudanese fried snacks provide an explosive savory crunch that perfectly primes the palate for specialized meals.',
    rating: 4.7,
    inventory: 90,
    popular: false,
    reviews: []
  },

  // 3. SUDAN MARKET & GROCERY ('market')
  {
    id: 'm1',
    name: 'Heritage Organic Karkadeh Flowers',
    description: 'Pristine, sun-dried hibiscus calyces sourced straight from organic farms in Kordofan. Brews into a deep-crimson, vitamin-rich luxury tonic.',
    subDescription: '100% natural traditional Sudanese hibiscus blossoms.',
    price: 0,
    category: 'market',
    deliveryType: 'NATIONWIDE',
    images: [
      '/images/market_grocery_official_1781633042972.jpg'
    ],
    specifications: {
      'Production': 'Handpicked & Sun-dried in traditional burlap',
      'Color Profile': 'Deep imperial ruby crimson',
      'Purity Index': '100% Organic, zero additives'
    },
    story: 'Karkadeh is the soul of Sudanese hospitality. Brew it slow as an iced beverage during high-temperature afternoons, or serve it hot and spiced to experience an incredible sweet-and-sour refreshing burst.',
    rating: 5.0,
    inventory: 150,
    popular: true,
    reviews: [
      { id: 'r4', reviewerName: 'Al-Anoud Al Saud', rating: 5, date: '2026-05-24', comment: 'The ruby red color is gorgeous. It is incredibly clean and pure. Deep, elegant flavor.' }
    ]
  },
  {
    id: 'm2',
    name: 'Premium Hashab Gum Arabic Elixir',
    description: 'Raw, pristine golden crystal nodules of Acacia Senegal, sorted meticulously. Dissolves cleanly to support daily digestion, vitality, and traditional uses.',
    subDescription: 'Highly prized supreme pharmaceutical grade natural gum.',
    price: 0,
    category: 'market',
    deliveryType: 'NATIONWIDE',
    images: [
      '/images/market_grocery_official_1781633042972.jpg'
    ],
    specifications: {
      'Acacia Species': 'Acacia Senegal (Hashab Grade A)',
      'Texture': 'Rigid golden glassy translucent crystals',
      'Treatment': 'Air-cleansed of natural tree debris'
    },
    story: 'Sourced from the Sudanese Gum Arabic Belt, our Hashab represents the apex of organic saps. Sifted by hand and preserved in sealed containers to ensure complete bio-activity and pristine cleanliness.',
    rating: 4.9,
    inventory: 100,
    popular: false,
    reviews: []
  },

  // 4. PREMIUM COLLECTIONS ('fashion')
  {
    id: 'f1',
    name: 'Imported Authentic Sudanese Toob',
    description: 'Indulge in absolute luxury. A traditional imported women’s Toob dress made from exquisite, ultra-lightweight cotton blended with custom-spun gold silk fibers.',
    subDescription: 'Timeless Sudanese women’s wear crafted for formal celebrations.',
    price: 0,
    category: 'fashion',
    deliveryType: 'NATIONWIDE',
    images: [
      '/src/assets/images/fashion-sudanese-toob.jpg'
    ],
    specifications: {
      'Fabric Composition': '70% Giza Cotton / 30% Metallic Silk',
      'Pattern': 'Signature geometric embroidery borders',
      'Length': 'Standard 4.5 meters luxury drape',
      'Care': 'Bespoke custom dry laundering only'
    },
    story: 'The traditional Toob represents Sudanese design sovereignty. We import these exquisite drapes directly from the finest artisans in Sudan where they are woven over two weeks, blending soft cotton fiber with reflective golden threads to catch the evening lights spectacularly.',
    rating: 5.0,
    inventory: 10,
    popular: true,
    reviews: [
      { id: 'r5', reviewerName: 'Fatma Al-Nile', rating: 5, date: '2026-06-01', comment: 'Astonishing fabric work. The drape has an outstanding weight and beautiful golden reflection.' }
    ]
  },
  {
    id: 'f2',
    name: 'Royal Silk Abaya & Accessories Suite',
    description: 'A loose, majestic modern Abaya made from double-weight premium mulberry silk, detailed with pristine calligraphic lines in gold embroidery.',
    subDescription: 'High-end modest wear incorporating elegant geometric weaves.',
    price: 0,
    category: 'fashion',
    deliveryType: 'NATIONWIDE',
    images: [
      '/src/assets/images/fashion-silk-abaya.jpg'
    ],
    specifications: {
      'Silk Weight': '22-Momme heavy luxury drape',
      'Embroidery': 'Traditional gold thread embroidery',
      'Included Accessories': 'Mulberry silk veil & gold satin dustbag'
    },
    story: 'Imported directly from specialized artisans, this Abaya features woven traditional Arabic calligraphy geometries into structured silk panels, representing the intersection of classical modesty with ultra-modern architectural symmetry.',
    rating: 4.9,
    inventory: 15,
    popular: false,
    reviews: []
  },

  // 5. THOBES COLLECTION ('thobes')
  {
    id: 'p1',
    name: 'Luxury Sudanese White Thobe',
    description: 'A premium, pristine white traditional Thobe crafted from the finest breathable cotton.',
    subDescription: 'Classic, crisp white Thobe featuring elegant drape and refined finishing.',
    price: 0,
    category: 'thobes',
    deliveryType: 'NATIONWIDE',
    images: [
      '/images/thoves.1.jpeg'
    ],
    specifications: {
      'Fabric': '100% Premium Breathable Cotton',
      'Detailing': 'Reinforced seams, structured collar',
      'Length': 'Customizable measurements'
    },
    story: 'Designed to embody the pinnacle of Sudanese traditional menswear, this Thobe blends heritage craft with unparalleled luxury fabrics, offering both immaculate presentation and complete daytime comfort.',
    rating: 5.0,
    inventory: 20,
    popular: true,
    reviews: [
      { id: 'r6', reviewerName: 'Norah Branch B', rating: 5, date: '2026-05-27', comment: 'Extremely soft and feels exceptionally premium.' }
    ]
  },
  {
    id: 'p2',
    name: 'Modern Heritage Men\'s Thobe',
    description: 'A contemporary take on traditional wear, featuring subtle modern tailoring elements.',
    subDescription: 'Traditional silhouette updated with sophisticated sharp lines.',
    price: 0,
    category: 'thobes',
    deliveryType: 'NATIONWIDE',
    images: [
      '/images/thoves.1.jpeg'
    ],
    specifications: {
      'Fabric Blend': 'Cotton-Linen mix for effortless drape',
      'Stitching': 'Tonal embroidery',
      'Weight': 'Lightweight'
    },
    story: 'Woven for elegance, this modern iteration pays homage to ancestral lines while introducing subtle structural enhancements suitable for today\'s formal occasions.',
    rating: 4.8,
    inventory: 25,
    popular: false,
    reviews: []
  }
];

export const BRANCHES: Branch[] = [
  {
    id: 'b-dammam',
    name: 'ZOAL Al Hofuf Flagship Lounge',
    address: 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia',
    phone: '+966 56 769 9315',
    hours: '08:00 AM - Midnight (Fri/Sat: till 01:00 AM)',
    description: 'Our award-winning flagship showroom features glass structures, a specialty Espresso theater, raw sandstone columns, Sudanese premium collections showcases, and beautiful terracotta botanical displays.',
    image: '/src/assets/images/branch-al-hofuf.jpg',
    coordinates: { lat: 25.367976, lng: 49.573064 }
  }
];

export const ARTICLES: Article[] = [
  {
    id: 'art1',
    title: 'The Saffron & Gold Ritual: Elevating Sudanese & Arabic Hospitality',
    category: 'Coffee & Drinks',
    excerpt: 'How traditional spices are being reinvented inside high-end gourmet coffee platforms in Saudi Arabia.',
    content: "Saffron has always stood as a marker of grand events in traditional households. Traditionally boiled lightly with select seeds, it has now entered a modern golden era at ZOAL. Our roasting masters analyze beans at microscopic grain layers to configure roasting curves that match the delicate floral profile of high-grade saffron. It is not about drowning the drink's origin flavor; it is about formulating a luxurious symbiosis where espresso-infused elements blend seamlessly with golden spices. This is the hospitality of the future.",
    date: 'June 1, 2026',
    author: 'Majid Bin Khalid',
    readTime: '5 min read',
    image: '/src/assets/images/blog-saffron-ritual.jpg'
  },
  {
    id: 'art2',
    title: 'The Physics of Traditional Wood-Fired Hoboz Bread',
    category: 'Bakery Heritage',
    excerpt: 'Examining the intersection of wild yeast cultures and high-heat blister mechanics inside our kitchen labs.',
    content: "Why is traditional Sudanese Hoboz bread so light yet elastic? Behind our production tables sits an advanced approach to temperature and hydration. At ZOAL bakery labs, we treat stone baking as an exact science. By incorporating specialized 8-year legacy sour culture starters and utilizing rapid wood-fire quick blistering at exactly 420°C, we produce extremely light pocket breads that retain moisture without synthetic rising agents. It is pure traditional baking physics working hand in hand with rich organic Giza flour.",
    date: 'May 20, 2026',
    author: 'Chef Charles Vagner',
    readTime: '7 min read',
    image: '/src/assets/images/blog-baking-physics.jpg'
  },
  {
    id: 'art3',
    title: 'Woven Legacies: The Craft of the Hand-Turned Sudanese Toob',
    category: 'Premium Collections',
    excerpt: 'Discover the meticulous details of fine organic cotton and gold silk fibers in our imported iconic drapes.',
    content: "Traditional apparel is more than garment work; it is written poetry in movement. The traditional Toob dress drapes with heavy tactile depth, wrapping the silhouette in elegant ripples. We source imported garments featuring fine long-staple cotton and gold-wrapped wires that form beautiful geometric borders directly onto the loom surfaces. At our retail location, we ensure each imported formal dress serves as a mobile work of art.",
    date: 'May 10, 2026',
    author: 'Amal S. Al Saud',
    readTime: '6 min read',
    image: '/src/assets/images/blog-woven-legacies.jpg'
  }
];

export const COUPONS = [
  { code: 'ZOALGOLD', discountPercent: 15, msg: '15% Royal Privilege Applied' },
  { code: 'DAMMAMLX', discountPercent: 10, msg: '10% Launch Promotion Active' },
  { code: 'SAUDIHERITAGE', discountPercent: 20, msg: '20% Heritage Celebration Discount' }
];

export const SEED_MOCK_ORDERS: Order[] = [
  {
    id: 'ZL-9871',
    date: '2026-06-05',
    items: [
      { productId: 'c1', name: 'ZOAL Royal Saffron Gold Latte', price: 45, quantity: 2, selectedOption: 'Swiss Ice Spheres' },
      { productId: 'm1', name: 'Heritage Organic Karkadeh Flowers', price: 75, quantity: 1, selectedOption: 'Organic blossoms tin' }
    ],
    subtotal: 165,
    shipping: 25,
    discount: 24.75,
    total: 165.25,
    status: 'Preparing',
    customerName: 'Ahmad Al-Ghamdi',
    email: 'alzoal3003@gmail.com',
    phone: '+966 56 769 9315',
    address: 'Flagship Boutique, Saudi Arabia',
    paymentMethod: 'Apple Pay',
    trackingNumber: 'ZOAL-DAM-10928'
  },
  {
    id: 'ZL-9543',
    date: '2026-06-03',
    items: [
      { productId: 'f1', name: 'Imported Authentic Sudanese Toob', price: 1850, quantity: 1, selectedOption: 'Premium Presentation Box' }
    ],
    subtotal: 1850,
    shipping: 0,
    discount: 0,
    total: 1850.00,
    status: 'Completed',
    customerName: 'Yasmine Al-Sudairy',
    email: 'alzoal3003@gmail.com',
    phone: '+966 56 769 9315',
    address: 'Al Belt Area, Khobar, KSA',
    paymentMethod: 'Mada Debit Card',
    trackingNumber: 'ZOAL-DAM-09724'
  }
];
