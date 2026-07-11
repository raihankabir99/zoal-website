export type BusinessCategory = 'coffee' | 'bakery' | 'market' | 'fashion' | 'thobes';

export interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  date: string;
  comment: string;
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
  }[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'Pending' | 'Preparing' | 'Shipped' | 'Completed' | 'Cancelled';
  customerName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: string;
  trackingNumber: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  addresses: string[];
}
