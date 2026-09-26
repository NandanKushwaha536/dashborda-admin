# RGEnterprises Admin Control Center — Final Handover

## Business workflow

Customer Order → Payment Verification → Order Confirmed → Inventory Reservation → Picking → Packing → Packed → Shipment Creation → Courier Assignment → Dispatch → Pickup Request → Picked Up → In Transit → OFD → Delivered / NDR → RTO → Return/QC → Refund/Finance.

## Logistics capabilities included

- Live shipment queue with status filters: Pending, Shipped, In Transit, OFD, Delivered, RTO, RTO Delivered, Cancelled, NDR, Failed.
- Shipment creation from a real order.
- Clone shipment workflow with a cleared AWB and live source shipment data copied into a new draft.
- Active warehouse selection; inline warehouse creation when no active warehouse exists.
- Pickup address / warehouse management.
- Pickup request creation with live courier and warehouse records, package/weight/date validation.
- Backend-authoritative courier quote / rate calculator.
- Courier assignment and dispatch actions on shipment detail.
- Tracking timeline and exception navigation.
- Live shipment document actions: Label and Delivery Challan print views; Tax Invoice opens the backend-generated order invoice URL when available.
- Bulk Label, Manifest/Challan and MIS/CSV export for selected live shipments.
- No hardcoded business shipment records are introduced.

## Validation performed

- `npm run typecheck` — PASS
- `npm run audit:readiness` — PASS
- `npm run qa:admin` — PASS (73 routes, 0 missing local imports)
- `npm run qa:business-flows` — PASS
- `npm run test` — PASS

`npm run build` could not be completed in the isolated build environment because Next.js attempted to download the Linux SWC binary from registry.npmjs.org and external DNS/network access was unavailable. Run the build on the Windows development machine after `npm ci`.

## Install / verify

```powershell
npm ci
npm run typecheck
npm run test
npm run build
npm run validate:release
```

Set production environment variables from `.env.example`; no local secret `.env.local` file is included in the handover archive.
