export interface ProductSpec {
  ergonomics: string;
  armrests: string;
  reclineAngle: string;
  maxWeight: string;
  material: string;
  warranty: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'ergonomic' | 'gaming' | 'office' | 'executive';
  categoryLabel: string;
  price: number; // in UZS
  oldPrice?: number;
  description: string;
  specs: ProductSpec;
  images: string[];
  rating: number;
  reviewsCount: number;
  isPopular?: boolean;
  isNew?: boolean;
  inStock: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  iconName: string;
}

export type RequestStatus = 'new' | 'in_progress' | 'completed' | 'closed';

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  role: 'superadmin' | 'manager';
  isActive: boolean;
  createdAt: string;
}

export interface LeadRequest {
  id: string;
  customerName: string;
  phoneNumber: string;
  telegramUsername?: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
  notes?: string;
  status: RequestStatus;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  imageUrl?: string;
  buttonText: string;
}

export interface ReelsPromo {
  id: string;
  badge: string;
  title: string;
  buttonText: string;
  instagramUrl: string;
  coverImage: string;
  isActive: boolean;
}
