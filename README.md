# RG Enterprises Admin

Staff panel for the RG Enterprises store: orders from payment to doorstep, catalog, customers, coupons, reports and settings. Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, TanStack Query. Works on desktop and phone.

## Run it

```bash
npm ci
cp .env.example .env.local   # set BACKEND_API_URL (and PROXY_SHARED_SECRET in production)
npm run dev                  # http://localhost:3000
```

Before a release:

```bash
npm run typecheck   # TypeScript
npm run lint        # Next.js lint rules
npm test            # static release checks (pages, links, headers, no sample data)
npm run build       # production build
API_BASE=https://<your-backend>/api/v1 npm run smoke   # read-only GET checks (needs network)
```

## Environment

| Variable | Purpose |
|---|---|
| `BACKEND_API_URL` | Backend base URL including `/api/v1`. The browser never calls it directly; requests go through `/api/backend`. |
| `PROXY_SHARED_SECRET` | Same value as on the backend, so rate limits count per staff member. |
| `NEXT_PUBLIC_API_BASE_URL` | Leave empty. |

## Run with the backend from the same release

This admin needs the backend from the same final bundle. It uses these backend additions:

- `GET /orders/stats/status-counts` (work-queue counts)
- `search` and `paymentMethod` filters on `GET /orders`, plus `RETURN_REQUESTED`
- `orderId` filter on `GET /shipping`
- unpaid online orders cannot be confirmed (shown as "Awaiting payment")

## Order flow

| Stage | Next step in the admin | What it calls |
|---|---|---|
| New (`PENDING`) | Confirm order (online orders only after payment) | `PATCH /orders/:id/status` → `CONFIRMED` |
| Confirmed | Start picking | → `PROCESSING` |
| Picking | Mark packed | → `PACKED` |
| Packed | Ship order (pickup location, courier from `GET /shipping/couriers`, AWB; booked on the store's own courier account, no courier API) | `POST /shipping/from-order`, then shipment `PROCESSING` → `SHIPPED`; the backend moves the order to `SHIPPED` and creates the invoice |
| Shipped | Out for delivery | shipment → `OUT_FOR_DELIVERY`, order → `OUT_FOR_DELIVERY` |
| Out for delivery | Mark delivered | shipment → `DELIVERED` (backend sets delivered time and return window); COD orders are also marked paid after "cash collected" |
| Return requested | Review return | Returns page: approve → pickup → received → refund |

Pick lists and packing slips print from `/print/orders`. Refunds, stock changes and staff changes ask for the admin's password again (backend step-up).

## Roles

The backend decides access by permission: a route open to Admin is open to every staff role that has the permission. This admin shows a page or button exactly when the signed-in role has that permission (`lib/auth/permissions.ts` mirrors the backend).

| Role (Team page) | Can do |
|---|---|
| Owner | Everything, including staff accounts and developer tools |
| Store manager | Everything in the store except staff accounts and developer tools |
| Orders & packing | Process, pack and ship orders; view returns |
| Catalog manager | Products, categories, brands, tax profiles; moderate reviews |
| Stock & warehouse | Stock changes and pickup locations |
| Returns & refunds | Returns, refunds and stock |
| Marketing | Coupons, sales dashboard |
| Customer support | View customers, orders and returns |
| Accounts | Profit and GST reports, refunds |
| Developer | Developer tools only |

## Header and pages

- Global search in the top bar (Ctrl K or /): orders by number or phone, products by name or SKU, customers, categories, brands. Results only include what the role may open.
- Every page has a Back link to the list it came from.
- Developer tools (Owner and Developer): problem finder with fixes, server status, background jobs, activity log, read-only data viewer, and fix-it tools (clear product cache, release expired stock holds, maintenance mode). Every tool asks for the password again.

## Structure

```
app/                 pages (App Router); app/api/backend is the proxy to the backend
components/ui/       design system: Button, Form, Layout, Feedback, DataTable, Overlay, Navigation, StatusBadge
components/shell/    sidebar, top bar, phone navigation, access guard
components/<area>/   shared pieces for one area (orders, products, catalog, dashboard)
lib/api/             client, endpoints (the only place API paths live), cache keys, types
lib/hooks/           one hook file per backend area
lib/auth/            session and role permissions (mirror of the backend's)
lib/status.ts        labels, colours and next steps for every status
```

Colours: navigation `#1E1B4B`, actions indigo-600, slate neutrals. Font: IBM Plex Sans / Mono via `next/font`.
