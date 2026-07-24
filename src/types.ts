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

export interface Question {
  id: string;
  questionText: string;
  askedBy: string;
  askedAt: string;
  answerText?: string;
  answeredBy?: string;
  answeredAt?: string;
  status: 'Pending' | 'Answered' | 'Hidden' | 'Reported';
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
  productType?: 'Food' | 'Drink' | 'Coffee' | 'Bakery' | 'Grocery' | 'Fashion' | 'Digital' | 'Gift Card' | 'Service';
  shippingFee?: number;
  deliveryDays?: number;
  sameDay?: boolean;
  pickup?: boolean;
  questions?: Question[];
  nutritionFacts?: Record<string, string>;
  aiMetadata?: Record<string, any>;
  // Boutique SEO
  seoRobots?: string;
  seoTwitterCard?: string;
  seoFocusKeyword?: string;
  // Boutique AI Features
  aiTags?: string;
  aiAltText?: string;
  aiRelatedProducts?: string;
  // Supplier Specs
  supplier?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  importer?: string;
  // Saudi Compliance
  hsCode?: string;
  halalStatus?: 'Certified' | 'Not Required' | 'In Progress';
  expiryDate?: string;
  manufacturingDate?: string;
  vatClass?: string;
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
  
  // Boutique fields
  paymentStatus?: 'Paid' | 'Unpaid' | 'Refunded' | 'Partially Refunded' | 'Failed' | 'Pending';
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
  paymentId?: string;
  transactionId?: string;
  gateway?: string;
  refundHistory?: { date: string; amount: number; reason: string; initiatedBy: string }[];
  paymentTimeline?: { date: string; status: string; details: string }[];
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  addresses: string[];
}

export interface Warehouse {
  id: string;
  warehouse_name: string;
  warehouse_code: string;
  country: string;
  city: string;
  address: string;
  manager: string;
  phone: string;
  email: string;
  capacity: number;
  used_capacity: number;
  status: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content_json: any;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CmsSection {
  id: string;
  page_id: string;
  section_type: string;
  order_index: number;
  content_json: any;
  created_at: string;
  updated_at: string;
}

export interface CmsBanner {
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  link_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface CmsHomepageBlock {
  id: string;
  block_type: string;
  title?: string;
  content_json: any;
  order_index: number;
  is_active: boolean;
  created_at: string;
}


export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'Draft' | 'Scheduled' | 'Running' | 'Completed' | 'Paused';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscriber {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  subscribed_at: string;
}

export interface EmailCampaign {
  id: string;
  campaign_id: string;
  subject: string;
  body: string;
  scheduled_at?: string;
  sent_at?: string;
  status: string;
}

export interface SmsCampaign {
  id: string;
  campaign_id: string;
  message: string;
  scheduled_at?: string;
  sent_at?: string;
  status: string;
}

export interface PushNotification {
  id: string;
  campaign_id: string;
  title: string;
  message: string;
  scheduled_at?: string;
  sent_at?: string;
  status: string;
}

export interface MarketingLog {
  id: string;
  campaign_id: string;
  log_type: string;
  message: string;
  created_at: string;
}

export interface LegalDocument {
  id: string;
  slug: string;
  title: string;
  current_version_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LegalDocumentVersion {
  id: string;
  document_id: string;
  content: string;
  version_number: number;
  status: 'Draft' | 'Published';
  created_at: string;
}

export interface TaxSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  updated_at: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate_percentage: number;
  tax_type: 'VAT' | 'Zero Rated' | 'Exempt';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface TaxRegion {
  id: string;
  region_name: string;
  rate_override_id?: string;
  created_at: string;
}

export interface TaxLog {
  id: string;
  action: string;
  old_data?: any;
  new_data?: any;
  user_id?: string;
  created_at: string;
}

export interface AiPrompt {
  id: string;
  user_id: string;
  prompt_text: string;
  created_at: string;
}

export interface AiOutput {
  id: string;
  prompt_id: string;
  response_text: string;
  created_at: string;
}

export interface AiUsage {
  id: string;
  prompt_id: string;
  tokens: number;
  cost: number;
  time_ms: number;
  created_at: string;
}

export interface AiTemplate {
  id: string;
  name: string;
  template_text: string;
  category: 'Product' | 'SEO' | 'Translation';
  created_at: string;
}

export interface AiHistory {
  id: string;
  user_id: string;
  action_type: string;
  meta_data: any;
  created_at: string;
}

export interface RegionalAnalytics {
  id: string;
  country: string;
  city: string;
  orders_count: number;
  revenue: number;
  customers_count: number;
  shipping_cost: number;
  growth_rate: number;
  captured_at: string;
}

export interface KpiSnapshot {
  id: string;
  metric_name: string;
  value: number;
  period: 'Weekly' | 'Monthly' | 'Yearly';
  captured_at: string;
}

export interface KpiTarget {
  id: string;
  metric_name: string;
  target_value: number;
  deadline?: string;
}

export interface GrowthReport {
  id: string;
  traffic_count: number;
  seo_score: number;
  ads_spend: number;
  organic_count: number;
  referral_count: number;
  conversion_rate: number;
  funnels_data: any;
  campaign_roi: number;
  captured_at: string;
}

export interface Forecast {
  id: string;
  forecast_type: 'Revenue' | 'Inventory' | 'Demand' | 'Seasonal' | 'AI';
  predicted_value: number;
  history_data: any;
  scenario?: string;
  captured_at: string;
}

export interface AiBriefing {
  id: string;
  briefing_type: 'Daily' | 'Weekly' | 'Monthly';
  risks?: string;
  recommendations?: string;
  revenue_summary: any;
  inventory_summary: any;
  customer_summary: any;
  captured_at: string;
}

export interface DecisionModel {
  id: string;
  name: string;
  type: 'Pricing' | 'Warehouse' | 'Discount' | 'Inventory';
  configuration: any;
  created_at: string;
}

export interface SimulationRun {
  id: string;
  model_id: string;
  revenue_projection: number;
  profit_projection: number;
  risk_score: number;
  scenario_data: any;
  captured_at: string;
}

export interface TicketAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_name: string;
  created_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal_note: boolean;
  created_at: string;
  attachments?: TicketAttachment[];
}

export interface Ticket {
  id: string;
  customer_id: string;
  subject: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  category?: string;
  channel?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'Pending' | 'Resolved' | 'Closed';
  assigned_staff_id?: string;
  created_at: string;
  updated_at: string;
  messages?: TicketMessage[];
}
