/**
 * Domain Models
 * 
 * This file contains the core domain models used throughout the application.
 * These models represent the main entities in our business domain.
 */

import { Timestamped, Identifiable } from './utils';

/**
 * User model representing a user in the system
 */
export interface User extends Identifiable, Timestamped {
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'artist' | 'moderator';
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  preferences?: UserPreferences;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  newsletter: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
}

/**
 * Product model for the shop
 */
export interface Product extends Identifiable, Timestamped {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  thumbnail?: string;
  category: string;
  tags: string[];
  sku: string;
  stock: number;
  isActive: boolean;
  isDigital: boolean;
  downloads?: DigitalContent[];
  attributes?: Record<string, string>;
  ratings: {
    average: number;
    count: number;
  };
  variants?: ProductVariant[];
  relatedProducts?: string[];
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    weight: number;
    unit: string;
  };
}

/**
 * Product variant
 */
export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: Record<string, string>;
  image?: string;
}

/**
 * Digital content associated with a product
 */
export interface DigitalContent {
  id: string;
  name: string;
  description?: string;
  url: string;
  fileType: string;
  fileSize: number;
  expiresAt?: string;
  downloadLimit?: number;
}

/**
 * Shopping cart item
 */
export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  variant?: ProductVariant;
  price: number;
  totalPrice: number;
  addedAt: string;
}

/**
 * Order model
 */
export interface Order extends Identifiable, Timestamped {
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  billingAddress: Address;
  shippingAddress: Address;
  notes?: string;
  tracking?: {
    carrier: string;
    trackingNumber: string;
    status: string;
    estimatedDelivery?: string;
  };
  refunds?: Refund[];
}

/**
 * Order item
 */
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  price: number;
  quantity: number;
  subtotal: number;
  tax: number;
  total: number;
  image?: string;
  downloads?: DigitalContent[];
  metadata?: Record<string, unknown>;
}

/**
 * Address model
 */
export interface Address {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

/**
 * Refund model
 */
export interface Refund {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'completed' | 'rejected';
  items?: OrderItem[];
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

/**
 * Blog post model
 */
export interface BlogPost extends Identifiable, Timestamped {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  authorId: string;
  authorName: string;
  categories: string[];
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  readTime: number;
  viewCount: number;
  isFeatured: boolean;
  comments: Comment[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

/**
 * Comment model
 */
export interface Comment extends Identifiable {
  content: string;
  authorName: string;
  authorEmail: string;
  authorId?: string;
  createdAt: string;
  isApproved: boolean;
  likes: number;
  replies?: Comment[];
}

/**
 * Music track
 */
export interface Track extends Identifiable, Timestamped {
  title: string;
  artist: string;
  albumId?: string;
  albumTitle?: string;
  duration: number;
  audioUrl: string;
  coverImage?: string;
  waveformUrl?: string;
  genre?: string;
  releaseDate?: string;
  isExplicit: boolean;
  isPromoted: boolean;
  playCount: number;
  likes: number;
  features?: string[];
  producers?: string[];
  lyrics?: string;
  isDownloadable: boolean;
  downloadPrice?: number;
  streamingServices?: {
    spotify?: string;
    appleMusic?: string;
    youtube?: string;
    soundcloud?: string;
    amazonMusic?: string;
  };
}

/**
 * Album model
 */
export interface Album extends Identifiable, Timestamped {
  title: string;
  artist: string;
  coverImage: string;
  releaseDate: string;
  tracks: Track[];
  duration: number;
  genre?: string;
  isExplicit: boolean;
  rating?: number;
  description?: string;
  label?: string;
  upc?: string;
  tags?: string[];
  isPromoted: boolean;
  streamingServices?: {
    spotify?: string;
    appleMusic?: string;
    youtube?: string;
    soundcloud?: string;
    amazonMusic?: string;
  };
}

/**
 * Tour date model
 */
export interface TourDate extends Identifiable, Timestamped {
  venue: string;
  city: string;
  state?: string;
  country: string;
  date: string;
  doors?: string;
  start: string;
  end?: string;
  description?: string;
  ticketUrl?: string;
  ticketPrice?: number;
  isSoldOut: boolean;
  isAnnounced: boolean;
  isPrivate: boolean;
  isPromoted: boolean;
  venueCapacity?: number;
  ticketsSold?: number;
  support?: string[];
}

/**
 * Newsletter model
 */
export interface Newsletter extends Identifiable, Timestamped {
  title: string;
  content: string;
  subject: string;
  sender: string;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  scheduledAt?: string;
  sentAt?: string;
  recipients: number;
  opens: number;
  clicks: number;
  template?: string;
  tags?: string[];
  isArchived: boolean;
}

/**
 * Subscriber model
 */
export interface Subscriber extends Identifiable, Timestamped {
  email: string;
  name?: string;
  isVerified: boolean;
  isActive: boolean;
  lists: string[];
  tags?: string[];
  source?: string;
  lastNewsletterSent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Merchandise category
 */
export interface Category extends Identifiable, Timestamped {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  position: number;
  productCount: number;
  attributes?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

/**
 * Collaboration proposal
 */
export interface CollaborationProposal extends Identifiable, Timestamped {
  name: string;
  email: string;
  artistName?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  message: string;
  proposalType: 'feature' | 'remix' | 'production' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  attachments?: {
    url: string;
    name: string;
    type: string;
    size: number;
  }[];
}

/**
 * Patron model for supporters/fans
 */
export interface Patron extends Identifiable, Timestamped {
  userId: string;
  tier: 'silver' | 'gold' | 'platinum' | 'diamond';
  status: 'active' | 'paused' | 'cancelled';
  startDate: string;
  nextBillingDate?: string;
  endDate?: string;
  monthlyAmount: number;
  totalContributed: number;
  currency: string;
  benefits: string[];
  notes?: string;
  preferences?: {
    privateMessages: boolean;
    exclusiveContent: boolean;
    earlyAccess: boolean;
    merchandiseDiscounts: boolean;
  };
}

/**
 * Analytics data
 */
export interface AnalyticsData {
  visitors: {
    total: number;
    unique: number;
    returning: number;
    new: number;
    timeline: {
      date: string;
      count: number;
    }[];
    sources: {
      name: string;
      count: number;
      percentage: number;
    }[];
    devices: {
      type: string;
      count: number;
      percentage: number;
    }[];
  };
  pageViews: {
    total: number;
    avgTimeOnPage: number;
    topPages: {
      path: string;
      title: string;
      views: number;
      percentage: number;
    }[];
  };
  sales: {
    total: number;
    revenue: number;
    averageOrderValue: number;
    timeline: {
      date: string;
      orders: number;
      revenue: number;
    }[];
    topProducts: {
      id: string;
      name: string;
      sales: number;
      revenue: number;
    }[];
  };
  music: {
    plays: number;
    downloads: number;
    topTracks: {
      id: string;
      title: string;
      plays: number;
      downloads: number;
    }[];
    playsByPlatform: {
      platform: string;
      count: number;
      percentage: number;
    }[];
  };
  engagement: {
    newsletterSubscribers: number;
    emailOpenRate: number;
    emailClickRate: number;
    socialFollowers: Record<string, number>;
    socialGrowth: Record<string, number>;
  };
}