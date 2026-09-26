// Strict TypeScript contracts for RGEnterprises Business Admin Panel

export type AdminRole = 'SUPER_ADMIN' | 'DEVELOPER' | 'ADMIN' | 'MANAGER' | 'VIEWER' | 'SUPPORT';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AdminRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatar?: string | null;
  isEmailVerified?: boolean;
  lastLogin?: string;
  permissions: string[];
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'NDR'
  | 'RTO';

export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'COD';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  variant?: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

export interface CustomerAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus | string;
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
  location?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city?: string;
    state?: string;
  };
  shippingAddress: CustomerAddress;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  placedAt: string;
  updatedAt: string;
  notes?: string;
  // Read-only logistics status display
  trackingNumber?: string;
  courier?: string;
  timeline: OrderTimelineEvent[];
  invoiceNumber?: string;
  invoiceUrl?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parentName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  productCount: number;
  image?: string;
  description?: string;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seo?: { title?: string; description?: string; keywords?: string[] };
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  status: 'ACTIVE' | 'INACTIVE';
  productCount: number;
  website?: string;
  description?: string;
  sortOrder?: number;
  seo?: { title?: string; description?: string; keywords?: string[] };
}

export interface ProductImage {
  url: string;
  publicId: string;
}

export interface ProductVariant {
  variantId?: string;
  id?: string;
  sku: string;
  name?: string;
  attribute?: string;
  value?: string;
  price?: number;
  compareAtPrice?: number;
  salePrice?: number;
  stock?: number;
  image?: string;
  images?: ProductImage[];
  status?: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  colorName?: string;
  colorHex?: string;
  isActive?: boolean;
  attributes?: Record<string, unknown>;
  barcode?: string;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  taxProfile?: string;
  returnPolicy?: string;
  isFragile?: boolean;
  requiresColdChain?: boolean;
  hazmatClass?: string;
  serialTrackingRequired?: boolean;
  imeiRequired?: boolean;
  dispatchWeightTolerancePercent?: number;
}

export interface Product {
  _id: string;
  name: string;
  slug?: string;
  sku: string;
  category: string;
  categoryName?: string;
  brand: string;
  brandName?: string;
  price: number;
  salePrice: number;
  compareAtPrice?: number;
  barcode?: string;
  productType?: 'PHYSICAL' | 'DIGITAL' | 'SERVICE' | 'BUNDLE';
  taxProfile?: string;
  returnPolicy?: string;
  stock: number;
  trackInventory: boolean;
  status: 'ACTIVE' | 'DRAFT' | 'PENDING_REVIEW' | 'INACTIVE' | 'OUT_OF_STOCK';
  rating: number;
  reviewsCount: number;
  shortDescription?: string;
  description?: string;
  mainImage: string;
  thumbnail?: ProductImage;
  images: string[];
  variants: ProductVariant[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  featured?: boolean;
  isFeatured?: boolean;
  tags: string[];
  attributes?: Record<string, unknown>;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  manufacturer?: string;
  modelNumber?: string;
  countryOfOrigin?: string;
  warrantyMonths?: number;
  isFragile?: boolean;
  requiresColdChain?: boolean;
  hazmatClass?: string;
  serialTrackingRequired?: boolean;
  imeiRequired?: boolean;
  dispatchWeightTolerancePercent?: number;
  seo?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  _id: string;
  productId: string;
  productName: string;
  sku: string;
  variant?: string;
  warehouse?: string;
  available: number;
  reserved?: number;
  damaged?: number;
  incoming?: number;
  totalStock?: number;
  reorderPoint?: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lastRestocked?: string;
}

export interface InventoryReservation {
  id: string;
  orderId?: string;
  sku: string;
  quantity: number;
  expiresAt: string;
  status: 'ACTIVE' | 'COMMITTED' | 'EXPIRED';
}

export type WarehouseType = 'MAIN' | 'FULFILLMENT' | 'RETURN' | 'DARK_STORE';
export type WarehouseStatus = 'ACTIVE' | 'INACTIVE';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  type: WarehouseType;
  contactPerson?: string;
  phone?: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  status: WarehouseStatus;
  isDefault: boolean;
  pickupEnabled: boolean;
  notes?: string;
  totalStock?: number;
  skusCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
  ordersCount: number;
  totalSpent: number;
  tier: 'Standard' | 'Silver' | 'Gold' | 'VIP';
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  createdAt: string;
}

export interface FinanceSummary {
  grossRevenue: number;
  netRevenue: number;
  taxesCollected: number;
  refundsTotal: number;
  pendingPayout: number;
  currency: string;
}

export interface Transaction {
  id: string;
  orderNumber: string;
  paymentGateway: string;
  transactionId: string;
  amount: number;
  type: 'PAYMENT' | 'REFUND';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: string;
}

export interface Refund {
  id: string;
  orderNumber: string;
  orderId?: string;
  customerName: string;
  amount: number;
  reason: string;
  status: 'REQUESTED' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  usageCount: number;
  usageLimit: number;
  startDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PAUSED';
}

export interface ProductReview {
  id: string;
  productName: string;
  productSku: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorName?: string;
  actorEmail?: string;
  role: string;
  action: string;
  target: string;
  entity?: string;
  entityId?: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details?: string;
  description?: string;
}

export type NotificationType =
  | 'INFO'
  | 'WARNING'
  | 'ALERT'
  | 'ORDER'
  | 'STOCK'
  | 'INVENTORY'
  | 'FINANCE'
  | 'PAYMENT'
  | 'REFUND'
  | 'SECURITY'
  | 'CUSTOMER'
  | 'SYSTEM';

export interface AdminNotification {
  _id?: string;
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface RolePermission {
  _id?: string;
  id: string;
  role?: AdminRole | string;
  name: string;
  description: string;
  permissions: string[];
  isSystem?: boolean;
  userCount?: number;
  updatedAt?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  customers: number;
  pendingOrders: number;
  lowStockCount?: number;
}

export interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  uptimeSeconds: number;
  database: { connected: boolean; latencyMs: number };
  redisCache: { connected: boolean; latencyMs: number };
  version: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Developer Tools Types & Contracts
export type DevHealthStatus = 'HEALTHY' | 'DEGRADED' | 'ERROR' | 'UNKNOWN' | 'DISABLED';

export interface DevEndpointHealth {
  id: string;
  name: string;
  category: string;
  endpoint: string;
  status: DevHealthStatus;
  httpStatus?: number;
  latencyMs?: number;
  lastChecked?: string;
  details?: string;
  error?: string;
}

export interface ApiExplorerParam {
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiExplorerRoute {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  category: string;
  description: string;
  requiresBody?: boolean;
  sampleBody?: Record<string, unknown>;
  defaultParams?: Record<string, string>;
  permission?: string;
}

export interface DevRequestLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  status: number;
  durationMs: number;
  requestId?: string;
  headers?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: string;
}

