import { Product, Branch, Article, Order } from './types';

export const PRODUCTS: Product[] = [
  // 1. ZOAL COFFEE CAFE ('coffee')
  {
    id: 'c1',
    name: 'ZOAL Royal Saffron Gold Latte',
    description: 'Our signature espresso-infused cream beverage, micro-blended with first-grade golden saffron strands, cardamom, and subtle layers of organic honey.',
    subDescription: '100% Specialist Grade Arabica, traditional gold seal blend.',
    price: 45,
    category: 'coffee',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800'
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
      { id: 'r1', reviewerName: 'Hisham A. (Dammam)', rating: 5, date: '2026-05-18', comment: 'An absolute masterpiece. The saffron is incredibly delicate.' },
      { id: 'r2', reviewerName: 'Sara Al-Khobar', rating: 5, date: '2026-05-30', comment: 'Perfect balance. The gold standard for specialty beverages.' }
    ]
  },
  {
    id: 'c2',
    name: 'Obsidian Velvet Cold Brew',
    description: 'A slow-dripped cold extraction utilizing premium dark roasted beans, served over a dense house-made cream float and caramelized raw sugar crust.',
    subDescription: 'Cold-steeped over exactly 24 hours under nitrogen pressurization.',
    price: 38,
    category: 'coffee',
    images: [
      'https://images.unsplash.com/photo-151097252790b-af4f42d91015?auto=format&fit=crop&q=80&w=800'
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
    price: 32,
    category: 'coffee',
    images: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800'
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

  // 2. SUDAN BAKERY & TRADITIONAL FOODS ('bakery')
  {
    id: 'b1',
    name: 'Premium House Traditional Hoboz Bread',
    description: 'Authentic Sudanese flatbread, stone-fired with real white sesame seed sprinklings. Soft, pillowy pockets engineered with traditional high-rise fermentation.',
    subDescription: 'Crafted fresh daily on our wood-burning stone deck hearths.',
    price: 15,
    category: 'bakery',
    images: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800'
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
    price: 65,
    category: 'bakery',
    images: [
      'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=800'
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
    price: 35,
    category: 'bakery',
    images: [
      'https://images.unsplash.com/photo-1548907040-4d42b52125f0?auto=format&fit=crop&q=80&w=800'
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
    price: 75,
    category: 'market',
    images: [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800'
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
    price: 95,
    category: 'market',
    images: [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'
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

  // 4. SUDAN FASHION & TEXTILES ('fashion')
  {
    id: 'f1',
    name: 'Al-Shati Hand-Woven Sudanese Toob',
    description: 'Indulge in absolute luxury. A traditional hand-woven women’s Toob dress made from exquisite, ultra-lightweight cotton blended with custom-spun gold silk fibers.',
    subDescription: 'Timeless Sudanese women’s wear crafted for formal celebrations.',
    price: 1850,
    category: 'fashion',
    images: [
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: {
      'Fabric Composition': '70% Giza Cotton / 30% Metallic Silk',
      'Pattern': 'Signature geometric embroidery borders',
      'Length': 'Standard 4.5 meters luxury drape',
      'Care': 'Bespoke custom dry laundering only'
    },
    story: 'The traditional Toob represents Sudanese design sovereignty. Our atelier hand-weaves each drape slowly over two weeks, blending soft cotton fiber with reflective golden threads to catch the evening lights spectacularly.',
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
    price: 1450,
    category: 'fashion',
    images: [
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: {
      'Silk Weight': '22-Momme heavy luxury drape',
      'Embroidery': 'Traditional gold thread embroidery',
      'Included Accessories': 'Mulberry silk veil & gold satin dustbag'
    },
    story: 'By weaving traditional Arabic calligraphy geometries into structured silk panels, this Abaya represents the intersection of classical modesty with ultra-modern architectural symmetry.',
    rating: 4.9,
    inventory: 15,
    popular: false,
    reviews: []
  },

  // 5. POTS & HOUSEHOLD COLLECTION ('pots')
  {
    id: 'p1',
    name: 'Hand-Carved Oasis Sandstone Flower Pot',
    description: 'An architectural planter carved out of continuous natural sandstone blocks from Saudi valleys. Beautiful organic banding patterns.',
    subDescription: 'Heavy-set minimalist container for design-conscious organic interiors.',
    price: 490,
    category: 'pots',
    images: [
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: {
      'Weight': '4.8 kg solid rock',
      'Treatment': 'Water-resistant interior hydrophobic glaze scaling',
      'Dimensions': 'h 24cm / d 18cm'
    },
    story: 'Carved individually by our master stone artisans in Al-Ahsa, this sandstone pot combines raw earth textures with precise circular geometry. No two pots share the same sand-depositation banding.',
    rating: 5.0,
    inventory: 20,
    popular: true,
    reviews: [
      { id: 'r6', reviewerName: 'Norah Dammam', rating: 5, date: '2026-05-27', comment: 'Heavy, earthy, and incredibly elegant under foyer lighting.' }
    ]
  },
  {
    id: 'p2',
    name: 'Brutalist Mud Terracotta Garden Urn',
    description: 'A large, rustic fired mud garden pot with natural porous breathing walls to optimize root oxygenation and soil health.',
    subDescription: 'Traditional kiln-baked clay pot for outdoor terraces and courtyard gardens.',
    price: 320,
    category: 'pots',
    images: [
      'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&q=80&w=800'
    ],
    specifications: {
      'Clay Base': 'Traditional brown rich mountain clay',
      'Baking process': 'Wood-kiln smoke-tempered finish',
      'Porosity': 'High natural respiration'
    },
    story: 'Fired in traditional pits at extremely high temperatures, this Terracotta Garden Urn features beautiful, random soot kisses and an organic tactile texture that ages beautifully over years of watering.',
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
    address: '9H9F+57J, Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361',
    phone: '+966 13 833 9001',
    hours: '08:00 AM - Midnight (Fri/Sat: till 01:00 AM)',
    description: 'Our award-winning flagship showroom features glass structures, a specialty Espresso theater, raw sandstone columns, Sudanese textile showcases, and beautiful terracotta botanical displays.',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800',
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
    image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=800'
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
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'art3',
    title: 'Woven Legacies: The Craft of the Hand-Turned Sudanese Toob',
    category: 'Textiles & Fashion',
    excerpt: 'Discover the meticulous details that turn fine organic cotton and gold silk fibers into iconic drapes.',
    content: "Traditional apparel is more than garment work; it is written poetry in movement. The traditional Toob dress drapes with heavy tactile depth, wrapping the silhouette in elegant ripples. Sourcing fine long-staple cotton and gold-wrapped wires allows us to weave beautiful geometric borders directly onto the loom surfaces. At our Al-Shati workshop, local seamstresses carefully turn each border to align with original calligraphic geometry, ensuring that each formal dress serves as a mobile work of art.",
    date: 'May 10, 2026',
    author: 'Amal S. Al Saud',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800'
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
    email: 'ahmad@example.sa',
    phone: '+966 50 123 4567',
    address: 'Al Shati District, Dammam, KSA',
    paymentMethod: 'Apple Pay',
    trackingNumber: 'ZOAL-DAM-10928'
  },
  {
    id: 'ZL-9543',
    date: '2026-06-03',
    items: [
      { productId: 'f1', name: 'Al-Shati Hand-Woven Sudanese Toob', price: 1850, quantity: 1, selectedOption: 'Bespoke weave' }
    ],
    subtotal: 1850,
    shipping: 0,
    discount: 0,
    total: 1850.00,
    status: 'Completed',
    customerName: 'Yasmine Al-Sudairy',
    email: 'yasmine.s@lux.sa',
    phone: '+966 55 987 6543',
    address: 'Al Belt Area, Khobar, KSA',
    paymentMethod: 'Mada Debit Card',
    trackingNumber: 'ZOAL-DAM-09724'
  }
];
