import { Client } from 'pg';
import { GoogleGenAI, Type } from '@google/genai';
import { PRODUCTS, ARTICLES } from '../src/data';
import { friendlyToUUID } from '../src/lib/uuidMapper';

// Cache to prevent calling Gemini API or Database repeatedly for same static requests
const seoCache = new Map<string, any>();

// Shared Gemini client utility (Server-side ONLY, User-Agent set for telemetry)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper to query branding settings
async function getBrandingSettings(): Promise<any> {
  const connectionString = process.env.DATABASE_URL;
  const defaultSettings = {
    businessName: 'AL ZOAL Enterprise',
    businessLogo: '/images/branding/zoal-logo.jpg',
    favicon: '/assets/images/favicon.svg',
    address: 'Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia',
    email: 'alzoal3003@gmail.com',
    phone: '+966 56 769 9315',
    instagram: 'https://instagram.com/alzoal',
    twitter: 'https://twitter.com/alzoal',
    website: ''
  };

  if (!connectionString) {
    return defaultSettings;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query('SELECT * FROM branding_settings WHERE id = 1 LIMIT 1');
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        businessName: row.business_name || defaultSettings.businessName,
        businessLogo: row.business_logo || defaultSettings.businessLogo,
        favicon: row.favicon || defaultSettings.favicon,
        address: row.address || defaultSettings.address,
        email: row.email || defaultSettings.email,
        phone: row.phone || defaultSettings.phone,
        instagram: row.instagram || defaultSettings.instagram,
        twitter: row.twitter || defaultSettings.twitter,
        website: row.website || defaultSettings.website
      };
    }
  } catch (err: any) {
    console.warn('⚠️ Server SEO: Error fetching branding settings, using defaults:', err.message || err);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }

  return defaultSettings;
}

// Helper to query products (DB + fallbacks)
async function getProducts(): Promise<any[]> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return PRODUCTS;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query('SELECT data FROM zoal_supabase_products');
    if (result.rows.length > 0) {
      return result.rows.map(row => {
        try {
          return typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        } catch (e) {
          return row.data;
        }
      });
    }
  } catch (err: any) {
    console.warn('⚠️ Server SEO: Error fetching products from DB, using fallback PRODUCTS:', err.message || err);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }

  return PRODUCTS;
}

// Structured category info map for rich automatic meta tags
const CATEGORY_SEO_INFO: Record<string, { title: string; desc: string; keywords: string }> = {
  coffee: {
    title: 'ZOAL Specialty Coffee & Premium Brews | Al Hofuf Cafe',
    desc: 'Indulge in 100% Specialist Grade Arabica, double-extracted Obsidian roast, Taif rose saffron tea, and signature Royal Saffron Gold Lattes crafted meticulously in Al Hofuf.',
    keywords: 'specialty coffee hofuf, saudi coffee, saffron latte, obsidian cold brew, taif rose tea, luxury saudi cafe'
  },
  bakery: {
    title: 'Sudanese Heritage Bakery & Fresh Stone-Fired Flatbread',
    desc: 'Experience our authentic Sudanese flatbread (Hoboz), Golden Saffron Ghoriba Biscuits, and crispy spiced savory Sambuxas stone-fired on wood-burning hearths daily.',
    keywords: 'sudanese bakery, hoboz bread, ghoriba cookies, traditional sudanese sambuxa, hand-kneaded bread'
  },
  market: {
    title: 'Heritage Organic Sudanese Market & Gourmet Groceries',
    desc: 'Acquire premium handpicked Kordofan hibiscus flowers (Karkadeh), raw pristine Hashab Gum Arabic elixirs, and authentic natural gourmet Sudanese pantry products.',
    keywords: 'karkadeh hibiscus, gum arabic hashab, organic kordofan flowers, gourmet sudanese groceries, premium saudi ingredients'
  },
  fashion: {
    title: 'Atelier Premium Sudanese Women’s Toob & Royal Silk Abayas',
    desc: 'Discover absolute modish luxury. Exquisite imported women’s Toob dresses detailed with metallic silk and majestically embroidered Royal Silk Abayas.',
    keywords: 'sudanese toob, luxury silk abaya, designer modest wear, saudi women fashion, couture gold embroidery'
  },
  thobes: {
    title: 'Royal Sovereign Bisht Thobes & Sovereign Cashmere Ghutras',
    desc: 'Explore the bespoke pinnacle of traditional menswear. Pristine Luxury Sudanese White Thobes and custom tailored modern heritage silhouettes in Al Hofuf.',
    keywords: 'luxury saudi thobe, royal bisht thobe, cashmere ghutras, bespoke saudi menswear, al-ahsa tailoring'
  }
};

// Collection info map (active brand alignments)
const COLLECTION_SEO_INFO: Record<string, { title: string; desc: string; keywords: string }> = {
  'ZOAL Specialty Roasters': {
    title: 'ZOAL Specialty Roasters Collection | Luxury Single-Origins',
    desc: 'Acquire ultra-premium single-origin coffees and bespoke gold-seal signature coffee blends roasted precisely in Al Hofuf.',
    keywords: 'zoal roasters, premium single origin, saudi arabica beans, luxury coffee blends'
  },
  'Sudan Bakery Heritage': {
    title: 'Sudan Bakery Heritage | Time-Honored Fermentation & Breads',
    desc: 'Savor traditional wood-fired pocket flatbreads and ghee butter cookies baked with centuries-old Sudanese culture starters.',
    keywords: 'traditional sourdough, organic giza flour, sudanese biscuits, stone deck ovens'
  },
  'Kordofan Organic Co.': {
    title: 'Kordofan Organic Co. | Raw Botanical & Acacia Selections',
    desc: 'Meticulously sourced, sun-dried Karkadeh hibiscus blossoms and premium pharmaceutical grade Gum Arabic Acacia Senegal elixirs.',
    keywords: 'kordofan botanicals, organic hibiscus, natural acacia nodules, digest health'
  },
  'Artisan Sudanese Weaves': {
    title: 'Artisan Sudanese Weaves | Signature Gold Silk & Cottons',
    desc: 'Indulge in imported women’s Toob garments handwoven by master Sudanese weavers, pairing fine long-staple cotton with genuine gold threads.',
    keywords: 'handwoven toob, ksa formal dresses, metallic silk threads, couture drapes'
  }
};

// Main automatic SEO generation function using Gemini with standard fallbacks
export async function generateSEOMetadata(pathUrl: string, query: Record<string, any>, host: string): Promise<any> {
  const brandSettings = await getBrandingSettings();
  const brandName = brandSettings.businessName.split(' ')[0];
  const baseUrl = `https://${host}`;
  const canonicalUrl = `${baseUrl}${pathUrl}`;

  // Default values
  let seoTitle = `${brandSettings.businessName} | Premium Coffee, Pastry, Couture, & Sandstone Accessories`;
  let seoDesc = `${brandSettings.businessName} is a premium Saudi brand based in Al Hofuf, offering curated specialty coffee, exquisite couture (Royal Sovereign Bisht Thobes), custom Al-Ula ghutras, and luxury sandstone homeware accessories.`;
  let seoKeywords = `${brandName.toLowerCase()}, luxury saudi fashion, specialty coffee hofuf, royal bisht, saudi couture, sandstone accessories, al-ahsa fashion`;
  let ogType = 'website';
  let ogImage = brandSettings.businessLogo;
  let robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  let productSchema: any = null;
  let breadcrumbs: any[] = [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Home',
      'item': `${baseUrl}/`
    }
  ];

  // Check cache first
  const cacheKey = `${pathUrl}?${JSON.stringify(query)}`;
  if (seoCache.has(cacheKey)) {
    return seoCache.get(cacheKey);
  }

  // Determine dynamic routing type
  const isProductPage = pathUrl.includes('/product/') || query.product;
  const isCategoryPage = pathUrl.includes('/category/') || query.category;
  const isCollectionPage = pathUrl.includes('/collection/') || query.collection;
  const isBlogPage = pathUrl.includes('/blog/') || query.post || (pathUrl === '/blog' && query.id);

  if (isProductPage) {
    const products = await getProducts();
    // Extract product ID
    let prodId = query.product || '';
    if (!prodId && pathUrl.includes('/product/')) {
      prodId = pathUrl.split('/product/')[1]?.split('?')[0];
    }
    
    const product = products.find(p => p.id === prodId || friendlyToUUID(p.id) === prodId);
    
    if (product) {
      // Create static fallback title and desc
      seoTitle = `${product.name} | ${brandSettings.businessName} Luxury Selection`;
      seoDesc = product.description || `${product.name} - Curated luxury accessory designed meticulously at Al Hofuf house of excellence.`;
      seoKeywords = `${product.name.toLowerCase()}, ${product.category}, ${brandName.toLowerCase()}, luxury saudi`;
      ogType = 'product';
      if (product.images && product.images.length > 0) {
        ogImage = product.images[0];
      }

      // Try automatic SEO generation using Gemini AI
      if (process.env.GEMINI_API_KEY) {
        try {
          const aiPrompt = `Generate optimized Enterprise SEO meta tags (Title, Description, Keywords) in English for this luxury Saudi product:
Name: ${product.name}
Category: ${product.category}
Description: ${product.description}
Story: ${product.story || ''}
Specifications: ${JSON.stringify(product.specifications || {})}

Ensure:
1. Title is highly attractive, premium, under 60 characters, and contains "${brandSettings.businessName}".
2. Description is compelling, search-optimized, under 155 characters.
3. Keywords are comma-separated and highly relevant.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: aiPrompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  keywords: { type: Type.STRING }
                },
                required: ["title", "description", "keywords"]
              }
            }
          });

          const geminiData = JSON.parse(response.text || '{}');
          if (geminiData.title) seoTitle = geminiData.title;
          if (geminiData.description) seoDesc = geminiData.description;
          if (geminiData.keywords) seoKeywords = geminiData.keywords;
          console.log(`✨ Server SEO: Generated metadata automatically via Gemini for Product "${product.name}"`);
        } catch (err: any) {
          console.warn(`⚠️ Server SEO: Gemini generation failed for product ${product.name}, falling back to dynamic rules:`, err.message || err);
        }
      }

      // Build Schema.org Product (JSON-LD)
      productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${baseUrl}/store?product=${product.id}#product`,
        'name': product.name,
        'image': product.images ? product.images.map(img => img.startsWith('http') ? img : `${baseUrl}${img}`) : [ogImage],
        'description': product.description || seoDesc,
        'sku': `ZOAL-${product.id.toUpperCase()}`,
        'brand': {
          '@type': 'Brand',
          'name': brandName
        },
        'offers': {
          '@type': 'Offer',
          'url': `${baseUrl}/store?product=${product.id}`,
          'priceCurrency': brandSettings.currency || 'SAR',
          'price': (Number(product.price) || 0).toFixed(2),
          'priceValidUntil': '2030-12-31',
          'availability': product.inventory > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          'itemCondition': 'https://schema.org/NewCondition',
          'seller': {
            '@type': 'Organization',
            'name': brandSettings.businessName
          }
        },
        'aggregateRating': product.rating ? {
          '@type': 'AggregateRating',
          'ratingValue': product.rating.toString(),
          'reviewCount': product.reviews ? Math.max(product.reviews.length, 5).toString() : '5',
          'bestRating': '5',
          'worstRating': '1'
        } : undefined
      };

      breadcrumbs.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'Store',
        'item': `${baseUrl}/store`
      });
      breadcrumbs.push({
        '@type': 'ListItem',
        'position': 3,
        'name': product.name,
        'item': `${baseUrl}/store?product=${product.id}`
      });
    }
  } else if (isCategoryPage) {
    let catId = query.category || '';
    if (!catId && pathUrl.includes('/category/')) {
      catId = pathUrl.split('/category/')[1]?.split('?')[0];
    }
    const info = CATEGORY_SEO_INFO[catId] || CATEGORY_SEO_INFO['coffee'];
    seoTitle = `${info.title} | ${brandSettings.businessName}`;
    seoDesc = info.desc;
    seoKeywords = `${info.keywords}, ${seoKeywords}`;

    // Try automatic SEO generation using Gemini AI for category page
    if (process.env.GEMINI_API_KEY) {
      try {
        const aiPrompt = `Generate optimized Enterprise SEO meta tags (Title, Description, Keywords) in English for the "${catId}" category of ${brandSettings.businessName}. We offer curated coffee, Sudanese bakery, organic groceries, women drapes and royal bisht thobes.
Ensure:
1. Title is highly professional, premium, under 60 characters.
2. Description is elegant, under 155 characters.
3. Keywords are comma-separated and highly relevant.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: aiPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                keywords: { type: Type.STRING }
              },
              required: ["title", "description", "keywords"]
            }
          }
        });

        const geminiData = JSON.parse(response.text || '{}');
        if (geminiData.title) seoTitle = geminiData.title;
        if (geminiData.description) seoDesc = geminiData.description;
        if (geminiData.keywords) seoKeywords = geminiData.keywords;
        console.log(`✨ Server SEO: Generated metadata automatically via Gemini for Category "${catId}"`);
      } catch (err: any) {
        console.warn(`⚠️ Server SEO: Gemini generation failed for category ${catId}:`, err.message || err);
      }
    }

    breadcrumbs.push({
      '@type': 'ListItem',
      'position': 2,
      'name': catId.toUpperCase(),
      'item': `${baseUrl}/store?category=${catId}`
    });
  } else if (isCollectionPage) {
    let collectionName = query.collection || '';
    if (!collectionName && pathUrl.includes('/collection/')) {
      collectionName = decodeURIComponent(pathUrl.split('/collection/')[1]?.split('?')[0]);
    }
    const info = COLLECTION_SEO_INFO[collectionName] || {
      title: `${collectionName} Curated Collection | ${brandSettings.businessName}`,
      desc: `A special curated enterprise selection of ${collectionName} products of exceptional craft.`,
      keywords: `${collectionName.toLowerCase()}, special collections, luxury saudi`
    };
    seoTitle = info.title;
    seoDesc = info.desc;
    seoKeywords = `${info.keywords}, ${seoKeywords}`;

    // Gemini generation for dynamic collection
    if (process.env.GEMINI_API_KEY) {
      try {
        const aiPrompt = `Generate optimized Enterprise SEO meta tags (Title, Description, Keywords) in English for the special curated "${collectionName}" collection at ${brandSettings.businessName}.
Ensure:
1. Title is majestic and premium, under 60 characters.
2. Description is appealing, under 155 characters.
3. Keywords are comma-separated and highly relevant.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: aiPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                keywords: { type: Type.STRING }
              },
              required: ["title", "description", "keywords"]
            }
          }
        });

        const geminiData = JSON.parse(response.text || '{}');
        if (geminiData.title) seoTitle = geminiData.title;
        if (geminiData.description) seoDesc = geminiData.description;
        if (geminiData.keywords) seoKeywords = geminiData.keywords;
        console.log(`✨ Server SEO: Generated metadata automatically via Gemini for Collection "${collectionName}"`);
      } catch (err: any) {
        console.warn(`⚠️ Server SEO: Gemini generation failed for collection ${collectionName}:`, err.message || err);
      }
    }

    breadcrumbs.push({
      '@type': 'ListItem',
      'position': 2,
      'name': 'Store',
      'item': `${baseUrl}/store`
    });
    breadcrumbs.push({
      '@type': 'ListItem',
      'position': 3,
      'name': collectionName,
      'item': `${baseUrl}/store?collection=${encodeURIComponent(collectionName)}`
    });
  } else if (isBlogPage) {
    let blogId = query.post || query.id || '';
    if (!blogId && pathUrl.includes('/blog/')) {
      blogId = pathUrl.split('/blog/')[1]?.split('?')[0];
    }
    const article = ARTICLES.find(art => art.id === blogId);
    if (article) {
      seoTitle = `${article.title} | ${brandSettings.businessName} Blog`;
      seoDesc = article.excerpt || article.content.slice(0, 150);
      seoKeywords = `${article.category.toLowerCase()}, blog, ${seoKeywords}`;
      if (article.image) ogImage = article.image;
      ogType = 'article';

      // Gemini generation for dynamic blog article
      if (process.env.GEMINI_API_KEY) {
        try {
          const aiPrompt = `Generate optimized Enterprise SEO meta tags (Title, Description, Keywords) in English for this cultural and luxury Saudi blog article:
Title: ${article.title}
Category: ${article.category}
Excerpt: ${article.excerpt}
Content Summary: ${article.content.slice(0, 500)}...

Ensure:
1. Title is highly optimized, engaging, under 60 characters.
2. Description is compelling, summarizing the piece under 155 characters.
3. Keywords are comma-separated and highly relevant.`;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: aiPrompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  keywords: { type: Type.STRING }
                },
                required: ["title", "description", "keywords"]
              }
            }
          });

          const geminiData = JSON.parse(response.text || '{}');
          if (geminiData.title) seoTitle = geminiData.title;
          if (geminiData.description) seoDesc = geminiData.description;
          if (geminiData.keywords) seoKeywords = geminiData.keywords;
          console.log(`✨ Server SEO: Generated metadata automatically via Gemini for Blog Post "${article.title}"`);
        } catch (err: any) {
          console.warn(`⚠️ Server SEO: Gemini generation failed for blog ${article.title}:`, err.message || err);
        }
      }

      breadcrumbs.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'Blog',
        'item': `${baseUrl}/blog`
      });
      breadcrumbs.push({
        '@type': 'ListItem',
        'position': 3,
        'name': article.title,
        'item': `${baseUrl}/blog?post=${article.id}`
      });
    }
  } else {
    // Static Routes Mapping
    switch (pathUrl) {
      case '/':
      case '/home':
        seoTitle = `${brandName} | Bespoke Saudi Couture, Speciality Coffee & Homeware`;
        break;
      case '/store':
        seoTitle = `The Royal Store | ${brandName} Sovereign Catalog`;
        seoDesc = `Acquire our premier collection of Royal Sovereign Bisht Thobes, bespoke Cashmere Al-Ula Ghutras, Sovereign Ivory Sandals, and pure Dehn El-Oud Concentrates.`;
        seoKeywords = `royal thobe store, buy bisht online, buy saudi ghutra, dehn el oud, luxury saudi sandals`;
        breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': 'Store', 'item': `${baseUrl}/store` });
        break;
      case '/portfolio':
        seoTitle = `The Sovereign Portfolio | ${brandName} Couture Craftsmanship`;
        seoDesc = `A visual showcase of ${brandName} craftsmanship. Explore our gold-thread zari embroidery, tailored collars, and the premium textiles crafted at our Al Hofuf house.`;
        breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': 'Portfolio', 'item': `${baseUrl}/portfolio` });
        break;
      case '/about':
        seoTitle = `Our Heritage | The House of ${brandName}`;
        seoDesc = `Discover the legacy of ${brandName}. Blending the deep heritage of Al-Ahsa bisht sewers with contemporary specialty coffee and homeware designs.`;
        breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': 'About Us', 'item': `${baseUrl}/about` });
        break;
      case '/branches':
        seoTitle = `Imperial Locations & Branches | ${brandName}`;
        seoDesc = `Visit our physical luxury boutiques in Al Hofuf, Dammam, and Riyadh. Experience personal tailored consultations, premium single-origin coffee tastings, and exclusive product launches.`;
        breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': 'Branches', 'item': `${baseUrl}/branches` });
        break;
      case '/blog':
        seoTitle = `Al-Ahsa Chronicles & Luxury Insights | ${brandName} Blog`;
        seoDesc = `Read stories on saudi coffee protocols, the artistry of German gold wire zari sewing, Al-Ahsa architectural details, and seasonal designer launches.`;
        breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': `${baseUrl}/blog` });
        break;
      case '/contact':
        seoTitle = `Private Inquiries & Concierge Service | ${brandName}`;
        seoDesc = `Initiate a secure line of contact with ${brandName} masters for custom bespoke fittings, event bookings, bulk corporate coffee orders, or feedback.`;
        breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': 'Contact', 'item': `${baseUrl}/contact` });
        break;
      case '/faq':
        seoTitle = `Frequently Asked Questions | ${brandName} Support`;
        seoDesc = `Find clear guidelines on bespoke dimensions, regional express shipping, courier tracking, and premium gold-plated bisht dry-clean parameters.`;
        breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': 'FAQ', 'item': `${baseUrl}/faq` });
        break;
      case '/privacy-policy':
        seoTitle = `Privacy Policy | ${brandSettings.businessName}`;
        breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': 'Privacy Policy', 'item': `${baseUrl}/privacy-policy` });
        break;
      case '/terms-and-conditions':
        seoTitle = `Terms and Conditions | ${brandSettings.businessName}`;
        breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': 'Terms & Conditions', 'item': `${baseUrl}/terms-and-conditions` });
        break;
      case '/shipping-policy':
        seoTitle = `Shipping Policy | ${brandSettings.businessName}`;
        breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': 'Shipping Policy', 'item': `${baseUrl}/shipping-policy` });
        break;
      case '/return-refund-policy':
        seoTitle = `Return and Refund Policy | ${brandSettings.businessName}`;
        breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': 'Return Policy', 'item': `${baseUrl}/return-refund-policy` });
        break;
      case '/cookie-policy':
        seoTitle = `Cookie Policy | ${brandSettings.businessName}`;
        breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': 'Cookie Policy', 'item': `${baseUrl}/cookie-policy` });
        break;
      case '/track-order':
        seoTitle = `Order Dispatch Tracker | ${brandName} Logistics`;
        breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': 'Track Order', 'item': `${baseUrl}/track-order` });
        break;
      case '/dashboard':
      case '/admin':
        seoTitle = `Portal | ${brandSettings.businessName}`;
        robots = 'noindex, nofollow'; // Secure portals should not be indexed!
        break;
    }
  }

  // Pre-bake fully built response object
  const seoResult = {
    title: seoTitle,
    description: seoDesc,
    keywords: seoKeywords,
    canonical: canonicalUrl,
    robots: robots,
    ogType: ogType,
    ogImage: ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`,
    businessName: brandSettings.businessName,
    breadcrumbs: breadcrumbs,
    productSchema: productSchema,
    brandSettings: brandSettings
  };

  // Save to cache
  seoCache.set(cacheKey, seoResult);

  return seoResult;
}

// Injects the fully rendered Server SEO metadata into index.html head
export async function injectServerSEO(htmlTemplate: string, req: any): Promise<string> {
  const host = req.get('host') || 'alzoal.com';
  const pathUrl = req.path;
  const seo = await generateSEOMetadata(pathUrl, req.query, host);

  // 1. Alternate language URL definitions (dynamic hreflang)
  const queryAr = { ...req.query, lang: 'ar' };
  const queryEn = { ...req.query, lang: 'en' };
  const getQueryStr = (q: any) => {
    const s = new URLSearchParams(q).toString();
    return s ? `?${s}` : '';
  };
  const altLangAr = `https://${host}${pathUrl}${getQueryStr(queryAr)}`;
  const altLangEn = `https://${host}${pathUrl}${getQueryStr(queryEn)}`;
  const altLangDefault = `https://${host}${pathUrl}${getQueryStr(req.query)}`;

  const alternateLanguagesTags = `
    <link rel="alternate" hreflang="ar" href="${altLangAr}" />
    <link rel="alternate" hreflang="en" href="${altLangEn}" />
    <link rel="alternate" hreflang="x-default" href="${altLangDefault}" />
  `;

  // 2. Structured JSON-LD Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `https://${host}/#organization`,
    'name': seo.brandSettings.businessName,
    'url': seo.brandSettings.website || `https://${host}`,
    'logo': {
      '@type': 'ImageObject',
      'url': seo.brandSettings.businessLogo.startsWith('http') ? seo.brandSettings.businessLogo : `https://${host}${seo.brandSettings.businessLogo}`
    },
    'contactPoint': {
      '@type': 'ContactPoint',
      'telephone': seo.brandSettings.phone,
      'contactType': 'customer support',
      'areaServed': 'SA',
      'availableLanguage': ['Arabic', 'English']
    },
    'sameAs': [
      'https://instagram.com/alzoal',
      'https://wa.me/966567699315'
    ]
  };

  // 3. Structured JSON-LD Breadcrumbs
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `https://${host}/#breadcrumb`,
    'itemListElement': seo.breadcrumbs
  };

  const jsonLdScripts = `
    <script type="application/ld+json">${JSON.stringify(organizationSchema)}</script>
    <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
    ${seo.productSchema ? `<script type="application/ld+json" id="schema-product">${JSON.stringify(seo.productSchema)}</script>` : ''}
  `;

  // 4. Assemble the server-rendered tags block
  const seoTagsBlock = `
    <!-- Enterprise Server-Side Rendered SEO -->
    <title>${seo.title}</title>
    <meta name="description" content="${seo.description}" />
    <meta name="keywords" content="${seo.keywords}" />
    <meta name="robots" content="${seo.robots}" />
    <link rel="canonical" href="${seo.canonical}" />
    ${alternateLanguagesTags}

    <!-- OpenGraph Server-Side Tags -->
    <meta property="og:type" content="${seo.ogType}" />
    <meta property="og:title" content="${seo.title}" />
    <meta property="og:description" content="${seo.description}" />
    <meta property="og:url" content="${seo.canonical}" />
    <meta property="og:image" content="${seo.ogImage}" />
    <meta property="og:site_name" content="${seo.businessName}" />

    <!-- Twitter Cards Server-Side Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${seo.title}" />
    <meta name="twitter:description" content="${seo.description}" />
    <meta name="twitter:image" content="${seo.ogImage}" />

    <!-- JSON-LD Rich Snippets Schemas -->
    ${jsonLdScripts}
  `;

  // Now, dynamically clean existing title and meta tags from index.html template and inject our tags
  let cleanedHtml = htmlTemplate;

  // Remove existing title tag
  cleanedHtml = cleanedHtml.replace(/<title>[\s\S]*?<\/title>/gi, '');

  // Remove existing metadata keywords, description, robots and canonical tag if they exist
  cleanedHtml = cleanedHtml.replace(/<meta[^>]*?name=["']description["'][^>]*?>/gi, '');
  cleanedHtml = cleanedHtml.replace(/<meta[^>]*?name=["']keywords["'][^>]*?>/gi, '');
  cleanedHtml = cleanedHtml.replace(/<meta[^>]*?name=["']robots["'][^>]*?>/gi, '');
  cleanedHtml = cleanedHtml.replace(/<link[^>]*?rel=["']canonical["'][^>]*?>/gi, '');

  // Remove existing OpenGraph tags
  cleanedHtml = cleanedHtml.replace(/<meta[^>]*?property=["']og:[^>]*?["'][^>]*?>/gi, '');

  // Remove existing Twitter tags
  cleanedHtml = cleanedHtml.replace(/<meta[^>]*?name=["']twitter:[^>]*?["'][^>]*?>/gi, '');

  // Inject our custom SEO block into the <head> segment
  cleanedHtml = cleanedHtml.replace('<head>', `<head>${seoTagsBlock}`);

  return cleanedHtml;
}
