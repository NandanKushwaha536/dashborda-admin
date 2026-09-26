import { z } from 'zod';

// ==========================================
// AUTH & USERS
// ==========================================

export const AdminRoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'VIEWER',
  'SUPPORT',
]);

export const AdminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  role: AdminRoleSchema,
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  avatar: z.string().nullable().optional(),
  isEmailVerified: z.boolean().optional(),
  lastLogin: z.string().optional().nullable(),
  permissions: z.array(z.string()),
});

// ==========================================
// ORDERS
// ==========================================

export const OrderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
  'NDR',
  'RTO',
]);

export const PaymentStatusSchema = z.enum(['PAID', 'PENDING', 'FAILED', 'REFUNDED']);
export const PaymentMethodSchema = z.enum([
  'UPI',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'NET_BANKING',
  'COD',
]);

export const CustomerAddressSchema = z.object({
  name: z.string(),
  phone: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().optional().nullable(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
});

export const OrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  variant: z.string().optional().nullable(),
  quantity: z.number(),
  price: z.number(),
  total: z.number(),
  image: z.string().optional().nullable(),
});

export const OrderTimelineEventSchema = z.object({
  status: z.string(),
  title: z.string(),
  description: z.string(),
  timestamp: z.string(),
  actor: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customer: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
  }),
  shippingAddress: CustomerAddressSchema,
  items: z.array(OrderItemSchema),
  subtotal: z.number(),
  shippingFee: z.number(),
  tax: z.number(),
  discount: z.number(),
  totalAmount: z.number(),
  status: OrderStatusSchema,
  paymentStatus: PaymentStatusSchema,
  paymentMethod: PaymentMethodSchema,
  placedAt: z.string(),
  updatedAt: z.string(),
  notes: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  courier: z.string().optional().nullable(),
  timeline: z.array(OrderTimelineEventSchema).optional().default([]),
  invoiceNumber: z.string().optional().nullable(),
  invoiceUrl: z.string().optional().nullable(),
});

// ==========================================
// CATALOG: CATEGORIES & BRANDS
// ==========================================

export const CategorySchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  parentId: z.string().nullable().optional(),
  parentName: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  productCount: z.number().default(0),
  image: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
});

export const BrandSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  productCount: z.number().default(0),
  website: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

// ==========================================
// PRODUCTS
// ==========================================

export const ProductVariantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  attribute: z.string(),
  value: z.string(),
  price: z.number(),
  salePrice: z.number().optional().nullable(),
  stock: z.number(),
  image: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']),
});

export const ProductSchema = z.object({
  _id: z.string(),
  name: z.string(),
  sku: z.string(),
  category: z.string(),
  categoryName: z.string().optional().nullable(),
  brand: z.string(),
  brandName: z.string().optional().nullable(),
  price: z.number(),
  salePrice: z.number(),
  stock: z.number(),
  trackInventory: z.boolean().default(true),
  status: z.enum(['ACTIVE', 'DRAFT', 'PENDING_REVIEW', 'INACTIVE', 'OUT_OF_STOCK']),
  rating: z.number().default(0),
  reviewsCount: z.number().default(0),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  mainImage: z.string().default(''),
  images: z.array(z.string()).default([]),
  variants: z.array(ProductVariantSchema).default([]),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  seoKeywords: z.string().optional().nullable(),
  featured: z.boolean().optional().default(false),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ==========================================
// INVENTORY
// ==========================================

export const InventoryItemSchema = z.object({
  _id: z.string(),
  productId: z.string(),
  productName: z.string(),
  sku: z.string(),
  variant: z.string().optional().nullable(),
  warehouse: z.string().optional().nullable(),
  available: z.number(),
  reserved: z.number().default(0),
  damaged: z.number().optional().default(0),
  incoming: z.number().optional().default(0),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']),
  lastRestocked: z.string().optional().nullable(),
});

// ==========================================
// CUSTOMERS
// ==========================================

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  ordersCount: z.number().default(0),
  totalSpent: z.number().default(0),
  tier: z.enum(['Standard', 'Silver', 'Gold', 'VIP']).default('Standard'),
  status: z.enum(['ACTIVE', 'BLOCKED', 'DELETED']),
  createdAt: z.string(),
});

// ==========================================
// FINANCE
// ==========================================

export const FinanceSummarySchema = z.object({
  grossRevenue: z.number(),
  netRevenue: z.number(),
  taxesCollected: z.number(),
  refundsTotal: z.number(),
  pendingPayout: z.number(),
  currency: z.string().default('INR'),
});

export const TransactionSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  paymentGateway: z.string(),
  transactionId: z.string(),
  amount: z.number(),
  type: z.enum(['PAYMENT', 'REFUND']),
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING']),
  timestamp: z.string(),
});

export const RefundSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  amount: z.number(),
  reason: z.string(),
  status: z.enum(['REQUESTED', 'APPROVED', 'PROCESSED', 'REJECTED']),
  createdAt: z.string(),
});

// ==========================================
// MARKETING & SUPPORT
// ==========================================

export const CouponSchema = z.object({
  id: z.string(),
  code: z.string(),
  description: z.string(),
  discountType: z.enum(['PERCENTAGE', 'FLAT']),
  discountValue: z.number(),
  minOrderValue: z.number(),
  usageCount: z.number().default(0),
  usageLimit: z.number(),
  startDate: z.string(),
  expiryDate: z.string(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'PAUSED']),
});

export const ProductReviewSchema = z.object({
  id: z.string(),
  productName: z.string(),
  productSku: z.string(),
  customerName: z.string(),
  rating: z.number(),
  title: z.string(),
  comment: z.string(),
  status: z.enum(['APPROVED', 'PENDING', 'REJECTED']),
  createdAt: z.string(),
});

export const SupportTicketSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  subject: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ==========================================
// AUDIT & DASHBOARD
// ==========================================

export const AuditLogSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  actor: z.string(),
  role: z.string(),
  action: z.string(),
  target: z.string(),
  ipAddress: z.string(),
  status: z.enum(['SUCCESS', 'WARNING', 'FAILED']),
  details: z.string().optional().nullable(),
});

export const DashboardStatsSchema = z.object({
  totalRevenue: z.number(),
  totalOrders: z.number(),
  customers: z.number(),
  pendingOrders: z.number(),
  lowStockCount: z.number().optional(),
});

export const SystemHealthSchema = z.object({
  status: z.enum(['HEALTHY', 'DEGRADED', 'UNHEALTHY']),
  uptimeSeconds: z.number(),
  database: z.object({ connected: z.boolean(), latencyMs: z.number() }),
  redisCache: z.object({ connected: z.boolean(), latencyMs: z.number() }),
  version: z.string(),
  timestamp: z.string(),
});

// Generic helper for paginated schema
export function createPaginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });
}
