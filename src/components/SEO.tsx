import { useEffect } from 'react';
import { Product } from '../types';
import { useBranding } from './BrandingContext';

interface SEOProps {
  currentPage: string;
  selectedProduct?: Product | null;
}

export default function SEO({ currentPage, selectedProduct }: SEOProps) {
  const { settings } = useBranding();
  const brandName = settings.businessName.split(' ')[0];

  useEffect(() => {
    // 1. Establish page-specific metadata configs
    let title = `${brandName} | Premium Coffee, Pastry, Couture, & Sandstone Accessories`;
    let description = `${settings.businessName} is a premium Saudi brand based in Al Hofuf, offering curated specialty coffee, exquisite couture (Royal Sovereign Bisht Thobes), custom Al-Ula ghutras, and luxury sandstone homeware accessories.`;
    let keywords = `${brandName.toLowerCase()}, luxury saudi fashion, specialty coffee hofuf, royal bisht, saudi couture, sandstone accessories, al-ahsa fashion`;
    let canonical = window.location.origin + window.location.pathname;
    let ogType = 'website';
    let ogImage = settings.businessLogo; // Use business logo as default OG image
    
    // Dynamic page determination
    if (selectedProduct) {
      title = `${selectedProduct.name} | ${settings.businessName} Luxury Selection`;
      description = selectedProduct.description || `${selectedProduct.name} - Curated luxury accessory designed meticulously with gold zari stitchwork at Al Hofuf house of excellence.`;
      keywords = `${selectedProduct.name.toLowerCase()}, ${keywords}`;
      ogType = 'product';
      if (selectedProduct.images && selectedProduct.images.length > 0) {
        ogImage = selectedProduct.images[0];
      }
    } else {
      switch (currentPage) {
        case 'home':
          title = `${brandName} | Bespoke Saudi Couture, Speciality Coffee & Homeware`;
          break;
        case 'store':
          title = `The Royal Store | ${brandName} Sovereign Catalog`;
          description = `Acquire our premier collection of Royal Sovereign Bisht Thobes, bespoke Cashmere Al-Ula Ghutras, Sovereign Ivory Sandals, and pure Dehn El-Oud Concentrates.`;
          keywords = `royal thobe store, buy bisht online, buy saudi ghutra, dehn el oud, luxury saudi sandals`;
          break;
        case 'portfolio':
          title = `The Sovereign Portfolio | ${brandName} Couture Craftsmanship`;
          description = `A visual showcase of ${brandName} craftsmanship. Explore our gold-thread zari embroidery, tailored collars, and the premium textiles crafted at our Al Hofuf house.`;
          break;
        case 'about':
          title = `Our Heritage | The House of ${brandName}`;
          description = `Discover the legacy of ${brandName}. Blending the deep heritage of Al-Ahsa bisht sewers with contemporary specialty coffee and homeware designs.`;
          break;
        case 'branches':
          title = `Imperial Locations & Branches | ${brandName}`;
          description = `Visit our physical luxury boutiques in Al Hofuf, Dammam, and Riyadh. Experience personal tailored consultations, premium single-origin coffee tastings, and exclusive product launches.`;
          break;
        case 'blog':
          title = `Al-Ahsa Chronicles & Luxury Insights | ${brandName} Blog`;
          description = `Read stories on saudi coffee protocols, the artistry of German gold wire zari sewing, Al-Ahsa architectural details, and seasonal designer launches.`;
          break;
        case 'contact':
          title = `Private Inquiries & Concierge Service | ${brandName}`;
          description = `Initiate a secure line of contact with ${brandName} masters for custom bespoke fittings, event bookings, bulk corporate coffee orders, or feedback.`;
          break;
        case 'faq':
          title = `Frequently Asked Questions | ${brandName} Support`;
          description = `Find clear guidelines on bespoke dimensions, regional express shipping, courier tracking, and premium gold-plated bisht dry-clean parameters.`;
          break;
        case 'cart':
          title = `Your Treasury Cart | ${brandName}`;
          description = `Review your chosen luxury coffee beans, sandals, and bespoke couture before completing your priority order dispatch.`;
          break;
        case 'checkout':
          title = `Secure Sovereign Checkout | ${brandName}`;
          description = `Finalize your premium transaction securely with Saudi payment standards (Mada, Visa, Apple Pay) or Bank Transfer options.`;
          break;
        case 'dashboard':
          title = `Patron Command Center & Invoices | ${brandName}`;
          description = `Access your personal measurement ledger, tracking status, support tickets, and printable gold-standard tax invoices.`;
          break;
        case 'wishlist':
          title = `Your Curated Wishlist | ${brandName}`;
          description = `Save your favorite premium items, from royal thobes to elite single-origin coffees, for custom consultation later.`;
          break;
        case 'track':
          title = `Order Dispatch Tracker | ${brandName} Logistics`;
          description = `Track your priority secure courier delivery live across all regions in Saudi Arabia and the GCC.`;
          break;
        case 'admin':
          title = `Imperial Administration Portal | ${brandName}`;
          description = `Secure business monitoring dashboard for staff details, order statuses, catalog settings, and system-wide activity logs.`;
          break;
        default:
          title = `Page Not Found | ${brandName}`;
          description = `The luxury asset requested is currently unavailable or has been relocated to another gallery section.`;
          break;
      }
    }

    // 2. Safely Update the Title
    document.title = title;

    // 3. Helper to update/create meta tags in document head
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard SEO Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // Open Graph Tags
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonical);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:site_name', settings.businessName);

    // Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);

    // Canonical link tag update
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);

    // 4. Generate & Inject JSON-LD Schema Scripts
    const schemaScripts: HTMLScriptElement[] = [];

    // Helper to inject JSON-LD schema
    const injectJSONLD = (id: string, schemaObj: any) => {
      // Remove any existing tag with the same ID to avoid duplicates on route change
      const existing = document.getElementById(id);
      if (existing) {
        existing.remove();
      }
      const script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(schemaObj, null, 2);
      document.head.appendChild(script);
      schemaScripts.push(script);
    };

    // (A) Organization Schema
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${window.location.origin}/#organization`,
      'name': settings.businessName,
      'url': settings.website || window.location.origin,
      'logo': {
        '@type': 'ImageObject',
        'url': window.location.origin + (settings.favicon || settings.businessLogo)
      },
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': settings.phone,
        'contactType': 'customer support',
        'areaServed': 'SA',
        'availableLanguage': ['Arabic', 'English']
      },
      'sameAs': [
        'https://instagram.com/alzoal',
        'https://wa.me/966567699315'
      ]
    };
    injectJSONLD('schema-organization', orgSchema);

    // (B) Breadcrumb Schema
    const breadcrumbItems = [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': `${window.location.origin}/`
      }
    ];

    if (selectedProduct) {
      breadcrumbItems.push({
        '@type': 'ListItem',
        'position': 2,
        'name': 'Store',
        'item': `${window.location.origin}/store`
      });
      breadcrumbItems.push({
        '@type': 'ListItem',
        'position': 3,
        'name': selectedProduct.name,
        'item': `${window.location.origin}/store?product=${selectedProduct.id}`
      });
    } else if (currentPage !== 'home') {
      const pageLabel = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
      breadcrumbItems.push({
        '@type': 'ListItem',
        'position': 2,
        'name': pageLabel,
        'item': `${window.location.origin}/${currentPage}`
      });
    }

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${window.location.origin}/#breadcrumb`,
      'itemListElement': breadcrumbItems
    };
    injectJSONLD('schema-breadcrumb', breadcrumbSchema);

    // (C) Product Schema (Only on Product details view)
    if (selectedProduct) {
      const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${window.location.origin}/store?product=${selectedProduct.id}#product`,
        'name': selectedProduct.name,
        'image': selectedProduct.images || [ogImage],
        'description': selectedProduct.description || `${selectedProduct.name} crafted exclusively for ${brandName} patrons.`,
        'sku': `ZOAL-${selectedProduct.id.slice(0, 8).toUpperCase()}`,
        'brand': {
          '@type': 'Brand',
          'name': brandName
        },
        'offers': {
          '@type': 'Offer',
          'url': `${window.location.origin}/store?product=${selectedProduct.id}`,
          'priceCurrency': 'SAR',
          'price': selectedProduct.price.toFixed(2),
          'priceValidUntil': '2030-12-31',
          'availability': selectedProduct.inventory > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          'itemCondition': 'https://schema.org/NewCondition',
          'seller': {
            '@type': 'Organization',
            'name': settings.businessName
          }
        },
        'aggregateRating': selectedProduct.rating ? {
          '@type': 'AggregateRating',
          'ratingValue': selectedProduct.rating.toString(),
          'reviewCount': '15',
          'bestRating': '5',
          'worstRating': '1'
        } : undefined
      };
      injectJSONLD('schema-product', productSchema);
    } else {
      // Remove product schema if we are not on a product page
      const productScript = document.getElementById('schema-product');
      if (productScript) {
        productScript.remove();
      }
    }

    // Cleanup function on unmount
    return () => {
      schemaScripts.forEach(script => {
        if (script) script.remove();
      });
    };
  }, [currentPage, selectedProduct]);

  return null; // This component performs side effects only
}
