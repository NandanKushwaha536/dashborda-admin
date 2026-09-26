# RGEnterprises Admin Inventory Fix — 2026-09-19

Fixed the live Inventory page contract:

- Inventory rows now use `GET /admin/inventory/overview` instead of the inventory-movement endpoint.
- Active reservations now use `GET /admin/inventory/reservations` instead of `/admin/inventory/reservations`.
- Live KPI values now map `availableStock`, `reservedStock`, `totalStock`, and `activeReservations` from the backend contract.
- Inventory rows understand backend `stock` and `inventoryStatus` fields.
- The page no longer treats a single wrong generic operations endpoint as the live inventory source.

The checkout stock reservation remains backend-authoritative.
