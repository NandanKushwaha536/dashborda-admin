# API Merge Audit + My Profile Feature

## What was checked
Every hook in `lib/hooks/*.ts` was cross-checked against the real routes in
`urbannest-backend-main/src/api/routes/**` (mount prefixes in `routes/index.ts`,
methods in each `*.route.ts`, and body shapes in the matching Zod validator).

## Bugs found & fixed
- **`lib/hooks/useDashboard.ts`**
  - `ENDPOINTS.dashboard.stats` and `ENDPOINTS.dashboard.activity` were referenced
    but never defined in `endpoints.ts` (TypeScript compile error).
  - `useDashboardStats` now calls the real `GET /admin/dashboard/overview` route
    and flattens its nested `{ users, products, orders, revenue }` response into
    the `DashboardStats` shape the UI cards expect.
  - `useDashboardActivity` now derives a "Recent Activity" feed from the real
    `GET /admin/audit-logs` route (the backend has no dedicated activity route).
- **`lib/auth/AuthContext.tsx`**
  - `normalizeAdminUser` only accepted `avatar` as a plain string, but the
    backend always sends it as `{ url, publicId } | null`. Avatars were
    silently discarded everywhere. Now unwraps the `url` field correctly.
- **`lib/api/queryKeys.ts`**
  - Added a `profile.me` query key for the new profile hooks below (and fixed
    an accidental duplicate key introduced while adding it).

Everything else audited (settings, reviews, orders, customers, admin users,
products bulk actions, inventory adjust, coupons, brands, categories,
finance, reports, support, security, audit) was already correctly wired to
real backend routes/methods/body shapes.

## New: My Profile page
- `lib/hooks/useProfile.ts` — `useProfile`, `useUpdateProfile`, `useUploadAvatar`,
  `useDeleteAvatar`, `useChangePassword`, wired to the real routes:
  - `GET /users/me`
  - `PATCH /users/profile` (backend only persists `name` today — see
    `user.service.ts` `updateProfile()` — so email/phone are shown read-only
    with a note that they require the separate OTP-verified
    `/auth/change-email` / `/auth/change-phone` flows)
  - `POST /users/avatar` / `DELETE /users/avatar` (2MB image limit, matches
    the backend's multer config)
  - `PATCH /auth/change-password`
- `app/admin/profile/page.tsx` — avatar upload/remove, name edit, read-only
  contact info, change-password form.
- `components/admin/layout/AdminSidebar.tsx` — the footer avatar/name block
  is now a link to `/admin/profile`, and a "My Profile" nav item was added
  under Governance & System.

## Not changed
No backend files were modified. `urbannest-backend-main` is unchanged.

## Known gap (not fixed — out of scope for a frontend wiring fix)
`GET /admin/customers` (the customer list) returns raw user documents; it does
not compute `ordersCount` / `totalSpent` / `tier` per row the way
`GET /admin/customers/:id` does. The list will show 0 orders / ₹0 spend /
"Standard" tier for every row until the backend's list endpoint is extended
to include those aggregates.
