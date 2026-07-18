export type BusinessCategory = 'coffee' | 'bakery' | 'market' | 'fashion' | 'thobes';

export type DeliveryType = 'LOCAL_ONLY' | 'NATIONWIDE' | 'STORE_PICKUP_ONLY' | 'DIGITAL' | 'NO_SHIPPING';

export interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  date: string;
  comment: string;
  approved?: boolean;
  reply?: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  barcode: string;
  price: number;
  salePrice?: number;
  stock: number;
  image?: string;
  status: 'Active' | 'Inactive';
  size?: string;
  color?: string;
  weight?: string;
  volume?: string;
  flavor?: string;
  packSize?: string;
}

export interface ProductAttributes {
  weight?: string;
  volume?: string;
  material?: string;
  color?: string;
  size?: string;
  originCountry?: string;
  shelfLife?: string;
  storageCondition?: string;
  packagingType?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  subDescription: string;
  price: number;
  category: BusinessCategory;
  images: string[];
  specifications: Record<string, string>;
  story: string;
  rating: number;
  reviews: Review[];
  inventory: number;
  popular?: boolean;
  nameEn?: string;
  nameAr?: string;
  shortDescription?: string;
  highlights?: string;
  ingredients?: string;
  directions?: string;
  warnings?: string;
  salePrice?: number;
  costPrice?: number;
  profitMargin?: number;
  discountPercent?: number;
  discountStart?: string;
  discountEnd?: string;
  taxClass?: string;
  currency?: string;
  sku?: string;
  barcode?: string;
  minStock?: number;
  maxStock?: number;
  warehouseLocation?: string;
  lowStockThreshold?: number;
  reservedStock?: number;
  status?: string;
  visibility?: string;
  seoMetaTitle?: string;
  seoMetaDesc?: string;
  isFeatured?: boolean;
  featured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFlashSale?: boolean;
  isRecommended?: boolean;
  createdAt?: string;
  updatedAt?: string;
  brand?: string;
  subcategory?: string;
  collection?: string;
  tags?: string | string[];
  labels?: string | string[];
  videoUrl?: string;
  images360?: string[];
  variantsList?: ProductVariant[];
  reusableAttributes?: ProductAttributes;
  seoMetaKeywords?: string;
  seoSlug?: string;
  seoOpenGraphImage?: string;
  seoCanonicalUrl?: string;
  seoSchemaProductData?: string;
  aiProductSummary?: string;
  aiSeoSuggestions?: string;
  aiTranslationAr?: string;
  aiTranslationEn?: string;
  aiProductRecommendation?: string;
  aiSearchOptimization?: string;
  deliveryType?: DeliveryType;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOption?: string; // e.g. "Espresso Roast", "7-inch", "Size L", etc.
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  image: string;
  mapUrl?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Article {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  readTime: string;
  image: string;
}

export interface Order {
  id: string;
  date: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    selectedOption?: string;
    image?: string;
  }[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Preparing' | 'Packed' | 'Ready for Shipping' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Completed' | 'Cancelled' | 'Returned' | 'Refund Requested' | 'Refund Approved' | 'Refund Completed';
  customerName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: string;
  trackingNumber: string;
  
  // Enterprise fields
  paymentStatus?: 'Paid' | 'Unpaid' | 'Refunded' | 'Partially Refunded';
  shippingMethod?: string;
  shippingStatus?: string;
  assignedStaff?: string;
  billingAddress?: string;
  customerNotes?: string;
  adminNotes?: string;
  staffNotes?: string;
  tax?: number;
  shippingFee?: number;
  timeline?: { status: string; date: string; notes?: string; updatedBy?: string }[];
  activityHistory?: { action: string; date: string; details?: string; user?: string }[];
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  addresses: string[];
}
