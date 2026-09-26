# RGEnterprises Business Admin — Backend Connection Specification

This document maps all frontend modules in the Business Admin Panel to their backend endpoints, HTTP methods, payloads, response contracts, authentication requirements, and permissions.

---

## 1. Global Authentication & Security Model

- **Session Authority**: Backend-managed `httpOnly` secure session cookie.
- **Client Handling**: The browser automatically attaches the cookie via `credentials: 'include'` through the Next.js server-side proxy `/api/backend/*` (pointing to `BACKEND_API_URL`, default `http://localhost:5000/api/v1`).
- **Token Storage**: NO access tokens or refresh tokens are ever stored in `localStorage` or `sessionStorage`.
- **CSRF Protection**: State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) fetch the CSRF token via `GET /auth/csrf-token` and attach it in the `X-CSRF-Token` request header.
- **Authorization Guard**: Frontend role & permission checking provides UI route gating and visibility toggling; backend enforces strict role-based access control (RBAC).

---

## 2. Module Endpoint Matrix

### A. Authentication (`/login`, `/admin`)
| Module | Action | Method | Backend Endpoint | Request Body | Auth / Permission |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Auth | Login | `POST` | `/auth/login` | `{ email, password }` | Public |
| Auth | Current User | `GET` | `/admin/me` | None | Session Cookie |
| Auth | Logout | `POST` | `/auth/logout` | None | Session Cookie |
| Auth | CSRF Token | `GET` | `/auth/csrf-token` | None | Public / Session |

### B. Dashboard (`/admin`)
| Module | Action | Method | Backend Endpoint | Query Params | Response Shape |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Dashboard | Summary Stats | `GET` | `/admin/dashboard/stats` | None | `{ totalRevenue, totalOrders, customers, pendingOrders }` |
| Dashboard | Sales Trends | `GET` | `/admin/dashboard/sales` | `?period=30d` | `[{ date, revenue, orders }]` |
| Dashboard | Recent Activity | `GET` | `/admin/dashboard/recent-activity`| `?limit=10` | `[{ id, type, description, timestamp }]` |
| Dashboard | Low Stock Alert| `GET` | `/admin/inventory/overview` | `?status=LOW_STOCK`| `[{ sku, name, available, status }]` |

### C. Orders (`/admin/orders`, `/admin/orders/[id]`)
| Module | Action | Method | Backend Endpoint | Request / Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Orders | List Orders | `GET` | `/admin/orders` | `?page=&limit=&status=&search=&paymentStatus=` | Server-side paginated |
| Orders | Single Order | `GET` | `/admin/orders/:id` | Route Param `:id` | Full order detail, timeline, customer info |
| Orders | Update Status| `PUT` | `/admin/orders/:id/status`| `{ status: OrderStatus, reason?: string }` | Enforces state machine: PENDING → CONFIRMED → PROCESSING → PACKED → SHIPPED → OFD → DELIVERED |
| Orders | Cancel Order | `POST` | `/admin/orders/:id/cancel`| `{ reason: string }` | Reverses stock reservations |
| Orders | Invoice | `GET` | `/admin/orders/:id/invoice`| None | Returns `{ invoiceUrl, invoiceNumber }` |

### D. Products (`/admin/products`, `/admin/products/[id]`)
| Module | Action | Method | Backend Endpoint | Request / Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Products | List Products| `GET` | `/admin/products` | `?page=&limit=&category=&brand=&search=` | Real backend catalog |
| Products | Single Detail| `GET` | `/admin/products/:id` | Route Param `:id` | Full SKU, variants, pricing, SEO |
| Products | Create | `POST` | `/admin/products` | `{ name, sku, category, brand, price, salePrice, stock, status, variants, seo }` | Creates MongoDB document |
| Products | Update | `PUT` | `/admin/products/:id` | Partial / full product object | Updates record |
| Products | Delete | `DELETE`| `/admin/products/:id` | None | Soft-delete / Archive |
| Products | Bulk Status | `PUT` | `/admin/products/bulk/status` | `{ productIds: string[], status: string }` | Updates multiple products |
| Products | Bulk Delete | `POST` | `/admin/products/bulk/delete` | `{ productIds: string[] }` | Bulk deletion |

### E. Categories & Brands (`/admin/categories`, `/admin/brands`)
| Module | Action | Method | Backend Endpoint | Request / Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Categories | List | `GET` | `/admin/categories` | None or `?search=` | Hierarchy and product count |
| Categories | Create | `POST` | `/admin/categories` | `{ name, slug, parentId, status, description, seo }` | Validates slug |
| Categories | Update | `PUT` | `/admin/categories/:id` | Partial category | Updates category |
| Categories | Delete | `DELETE`| `/admin/categories/:id` | None | Checks dependent products |
| Brands | List | `GET` | `/admin/brands` | None or `?search=` | Active brand registry |
| Brands | Create | `POST` | `/admin/brands` | `{ name, slug, logo, website, status }` | Creates brand |
| Brands | Update | `PUT` | `/admin/brands/:id` | Partial brand | Updates brand |
| Brands | Delete | `DELETE`| `/admin/brands/:id` | None | Deletes brand |

### F. Inventory (`/admin/inventory`)
| Module | Action | Method | Backend Endpoint | Request / Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Inventory | Overview | `GET` | `/admin/inventory/overview` | `?page=&limit=&search=&status=` | Available, reserved, total stock |
| Inventory | Reservations | `GET` | `/admin/inventory/reservations`| `?status=ACTIVE` | Active customer checkout locks |
| Inventory | Adjust Stock | `POST` | `/admin/inventory/adjust` | `{ sku: string, quantity: number, type: 'ADD' \| 'SUBTRACT', reason: string }` | Requires step-up auth for large adjustments |

### G. Customers (`/admin/customers`, `/admin/customers/[id]`)
| Module | Action | Method | Backend Endpoint | Request / Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Customers | List | `GET` | `/admin/customers` | `?page=&limit=&search=&tier=` | Real customer accounts |
| Customers | Profile | `GET` | `/admin/customers/:id` | Route Param `:id` | Contact info, addresses, order history |
| Customers | Toggle Status| `PUT` | `/admin/customers/:id/status`| `{ status: 'ACTIVE' \| 'SUSPENDED' }` | Fraud/chargeback prevention |

### H. Finance (`/admin/finance`)
| Module | Action | Method | Backend Endpoint | Request / Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Finance | Summary | `GET` | `/admin/finance/summary` | `?period=30d` | Gross revenue, tax collected, net sales, refund total |
| Finance | Transactions| `GET` | `/admin/finance/transactions`| `?page=&limit=&type=` | Payment gateway logs |
| Finance | Refunds | `GET` | `/admin/finance/refunds` | `?page=&limit=&status=` | Refund approval & processing |

### I. Reports (`/admin/reports`)
| Module | Action | Method | Backend Endpoint | Request / Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Reports | Sales Report | `GET` | `/admin/reports/sales` | `?startDate=&endDate=` | Sales breakdown by category & SKU |
| Reports | Export CSV | `GET` | `/admin/reports/export` | `?type=sales&format=csv` | Returns downloadable file stream |

### J. Coupons & Promotions (`/admin/coupons`)
| Module | Action | Method | Backend Endpoint | Request / Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Coupons | List | `GET` | `/admin/coupons` | None or `?status=` | Active discount codes |
| Coupons | Create | `POST` | `/admin/coupons` | `{ code, discountType, discountValue, minOrderValue, expiryDate }` | Validates uniqueness |
| Coupons | Toggle | `PUT` | `/admin/coupons/:id/status` | `{ status: 'ACTIVE' \| 'PAUSED' }` | Pauses coupon |

### K. Product Reviews (`/admin/reviews`)
| Module | Action | Method | Backend Endpoint | Request / Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Reviews | List | `GET` | `/admin/reviews` | `?status=PENDING` | Customer reviews moderation |
| Reviews | Moderate | `PUT` | `/admin/reviews/:id/status` | `{ status: 'APPROVED' \| 'REJECTED' }` | Publishes or hides review |

### L. Customer Support (`/admin/support`)
| Module | Action | Method | Backend Endpoint | Request / Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Support | List Tickets | `GET` | `/admin/support/tickets` | `?status=&priority=` | Customer inquiries |
| Support | Update Ticket| `PUT` | `/admin/support/tickets/:id` | `{ status, assignedTo, resolutionNote }` | Status updates |
| Support | Fallback | `—` | `BACKEND_ENDPOINT_REQUIRED` | If backend lacks ticketing, UI displays clean empty state |

### M. Admin Users & Security (`/admin/users`, `/admin/security`)
| Module | Action | Method | Backend Endpoint | Request / Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Users | List Admins | `GET` | `/admin/users` | None | Active staff & roles |
| Users | Invite Admin | `POST` | `/admin/users` | `{ email, name, role, permissions }` | Sends invite |
| Users | Update Role | `PUT` | `/admin/users/:id/role` | `{ role, permissions }` | SUPER_ADMIN only |
| Security | Active Sessions| `GET` | `/admin/security/sessions` | None | Current staff sessions |
| Security | Revoke Session | `POST` | `/admin/security/sessions/revoke` | `{ sessionId: string }` | Immediate session invalidation |

### N. Audit Logs (`/admin/audit`)
| Module | Action | Method | Backend Endpoint | Request / Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Audit | Query Logs | `GET` | `/admin/audit-logs` | `?page=&limit=&actor=&action=&startDate=` | Immutable compliance trail |

### O. Settings & Health (`/admin/settings`, `/admin/health`)
| Module | Action | Method | Backend Endpoint | Request / Params | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Settings | Get Config | `GET` | `/admin/settings` | None | Safe public config (store name, currency, tax rates) |
| Settings | Update Config | `PUT` | `/admin/settings` | Partial settings object | SUPER_ADMIN only |
| Health | System Health | `GET` | `/health` or `/admin/health` | None | DB connection, Redis cache, API latency |

---

## 3. Error Handling Specification
| HTTP Status | Client Meaning | UI Action |
| :--- | :--- | :--- |
| `401 Unauthorized` | Session expired or unauthenticated | Redirects to `/login?redirect=...` |
| `403 Forbidden` | Missing required RBAC permission | Displays inline `AdminErrorState` or forbidden modal |
| `404 Not Found` | Entity does not exist | Displays clean empty state with back navigation |
| `409 Conflict` | Concurrent modification / SKU collision | Displays explicit field error banner |
| `422 Unprocessable`| Zod / schema validation failure | Highlights individual form field error messages |
| `500 Server Error` | Backend crash / database timeout | Shows graceful retry UI without exposing stack traces |
