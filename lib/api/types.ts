// Strict TypeScript contracts for RGEnterprises Business Admin Panel

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  /** Backend UserRole, e.g. SUPER_ADMIN, ADMIN, ORDER_MANAGER. */
  role: string;
  /** ACTIVE | BLOCKED | DELETED */
  status: string;
  avatar?: string | null;
  lastLogin?: string;
  permissions: string[];
  permissionsConfigured: boolean;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'PARTIALLY_SHIPPED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'PARTIALLY_DELIVERED'
  | 'DELIVERED'
  | 'RETURN_REQUESTED'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'COD' | 'ONLINE';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  variant?: string;
  quantity: number;
  /** Units of this line cancelled before dispatch. */
  cancelledQuantity: number;
  /** Price charged per unit (sale price when there was one). */
  price: number;
  total: number;
  image?: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: { id: string; name: string; email: string; phone: string };
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
  couponCode?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliverySpeed?: string;
  placedAt: string;
  updatedAt: string;
  paidAt?: string;
  shippedAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  returnWindowEndsAt?: string;
  notes?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  invoiceSentAt?: string;
  cancellationReason?: string;
  /** Money taken off for cancelled items: refunded (prepaid) or not collected (COD). */
  cancelledAmount: number;
  /** Part of cancelledAmount already refunded to the customer's payment. */
  cancellationRefundedAmount: number;
  cancellationRefundStatus: 'NOT_REQUIRED' | 'PENDING' | 'REFUNDED' | 'FAILED';
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  status: string;
  provider: string;
  /** Courier name typed for "Other courier". */
  courierName?: string;
  trackingNumber?: string;
  createdAt: string;
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
  available: number;
  reserved?: number;
  reorderPoint?: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export type WarehouseStatus = 'ACTIVE' | 'INACTIVE';

/** A pickup location / warehouse the parcels leave from (/admin/operations/warehouses). */
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  status: WarehouseStatus;
}
