# RGEnterprises Business Admin — Production Control Center

A modern, high-reliability commercial e-commerce admin panel built with **Next.js App Router**, **TypeScript**, and **Tailwind CSS**. Designed specifically for executive and operational business workflows, strictly separating commercial e-commerce management from physical logistics operations.

---

## Architecture & Technology Stack

- **Framework**: Next.js 15+ (App Router, Server Components & Client Boundaries)
- **Language**: Strict TypeScript (`noImplicitAny`, zero `any`)
- **Styling**: Tailwind CSS with enterprise ERP neutral theme (`#172554` Navy, `#2563EB` Action, `#F5F7FB` Background)
- **Data Layer**: Centralized API client (`lib/api/client.ts`) with TanStack Query v5
- **Security**: Cookie-based session auth (`httpOnly`), CSRF protection, and role-based access control (RBAC)
- **Icons**: Lucide React
- **Zero Mock Policy**: 100% connected to real backend APIs with graceful empty and error states.

---

## Directory Layout

```text
RGEnterprises-Business-Admin-PRODUCTION/
├── app/
│   ├── layout.tsx                # Root layout with TanStack Query & AuthProvider
│   ├── globals.css               # Clean Tailwind CSS theme & base typography
│   ├── page.tsx                  # Root redirect (authenticated -> /admin, unauth -> /login)
│   ├── login/page.tsx            # Session login with CSRF token support
│   └── admin/
│       ├── layout.tsx            # Admin shell with deep navy sidebar & responsive header
│       ├── page.tsx              # Executive Dashboard with real KPI cards & recent activity
│       ├── orders/               # Order workspace with server filters & OrderDetailDrawer
│       ├── products/             # Product catalog with bulk operations toolbar
│       ├── categories/           # Category tree with MongoDB parent-child mapping
│       ├── brands/               # Brand registry with logo & status toggles
│       ├── inventory/            # Inventory overview, reserved stock & adjustments
│       ├── customers/            # Customer directory, tiers, and purchase history
│       ├── finance/              # Gross/net revenue, transaction logs & refund queue
│       ├── reports/              # Sales & inventory reporting with CSV export
│       ├── support/              # Customer inquiries and support tickets
│       ├── reviews/              # Product rating moderation queue
│       ├── coupons/              # Discount voucher rules and usage limits
│       ├── security/             # Active staff sessions and step-up auth
│       ├── audit/                # Immutable audit log stream
│       ├── users/                # Admin user & role management
│       ├── settings/             # Store configuration and operational preferences
│       └── health/               # Database, cache, and system health status
├── components/admin/
│   ├── layout/                   # AdminSidebar, AdminHeader, AdminShell
│   └── ui/                       # Reusable ERP components (Table, Modal, Drawer, Badges, etc.)
├── lib/
│   ├── api/                      # Centralized API client, endpoints, query keys & types
│   ├── auth/                     # AuthContext, session hooks, and permissions
│   └── hooks/                    # Domain data fetching hooks
├── docs/
│   ├── BACKEND_CONNECTION.md     # Complete endpoint, payload, and RBAC mapping
│   └── LOGISTICS_INTEGRATION.md  # Business Admin vs. Logistics Control Center boundaries
└── scripts/                      # Quality and production readiness scripts
```

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy the sample environment file and configure backend parameters:
```bash
cp .env.example .env.local
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `BACKEND_API_URL` | Express API target for the Next.js server proxy | `https://urbannest-backend-5u5q.onrender.com/api/v1` |
| `NEXT_PUBLIC_API_BASE_URL`| Browser API path | `/api/backend` |
| `NEXT_PUBLIC_LOGISTICS_APP_URL`| Dedicated Logistics Control Center URL | `http://localhost:3002` |

### API Proxy & Authentication

Browser requests use `/api/backend/*`. The Next.js server proxy forwards them to the configured `BACKEND_API_URL`, forwards the authenticated request cookie and CSRF headers, and returns backend `Set-Cookie` headers to the browser without exposing the backend service directly to client-side JavaScript.

The current-user endpoint remains `/admin/me` because that is the endpoint documented in `docs/BACKEND_CONNECTION.md`. No frontend Super Admin bypass is used; authorization remains enforced by the backend.

## 3. Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

### 4. Production Build & Verification
```bash
npm run typecheck
npm run validate:release
npm run build
npm start
```
