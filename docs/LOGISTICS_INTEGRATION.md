# RGEnterprises Architecture: Business Admin & Logistics Control Center Integration

This document defines the strict architectural boundary and shared backend connectivity between the **RGEnterprises Business Admin Panel** and the **RGEnterprises Logistics Control Center**.

---

## 1. Core Architectural Principle

The RGEnterprises platform adopts a **domain-separated dual-frontend architecture** connected to a single authoritative backend service:

```
                      ┌────────────────────────────────────────┐
                      │        RGEnterprises Backend           │
                      │       Node.js / Express API v1         │
                      │  (Auth, Orders, Inventory, Logistics)  │
                      └──────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
┌──────────────────────────────────┐            ┌──────────────────────────────────┐
│ RGEnterprises Business Admin     │            │ RGEnterprises Logistics Admin    │
│ (Commercial & E-Commerce Panel)  │            │ (Courier & Supply Chain Control) │
├──────────────────────────────────┤            ├──────────────────────────────────┤
│ • Executive Dashboard & Finance  │            │ • Multi-carrier AWB Booking      │
│ • Catalog (Products, Categories) │            │ • Warehouse & Pickup Requests    │
│ • Commercial Order Processing    │            │ • Carrier Rate Calculators       │
│ • Inventory Levels & Adjustments │            │ • NDR / RTO Resolution Queues    │
│ • Customer Relationship & Tiering│            │ • Courier Passbook & Remittance  │
│ • Promotions, Reviews & Support  │            │ • Dispatch Scans & Manifests     │
└──────────────────────────────────┘            └──────────────────────────────────┘
```

---

## 2. Business Admin Boundary vs. Logistics Control Center

| Responsibility / Feature | Handled by Business Admin | Handled by Logistics Control Center |
| :--- | :---: | :---: |
| Customer Invoices, Pricing & Taxes |  YES |  NO |
| Catalog, SKU, Categories & Brands |  YES |  NO |
| Order Creation & Payment Verification |  YES |  NO |
| Commercial Order Status Gating (`CONFIRMED` → `PROCESSING`) |  YES |  NO |
| Warehouse Picking & Packing Verification |  Read-Only Status |  YES |
| AWB Generation & Courier Label Printing |  NO (Logistics domain) |  YES |
| Pickup Request Scheduling with 3PL Couriers |  NO |  YES |
| Carrier Passbook, COD Remittance & Disputes |  NO |  YES |
| NDR (Non-Delivery Report) Calling & Actioning |  Read-Only Flag |  YES |
| Customer Support Inquiries & Refunds |  YES |  NO |
| Read-only Tracking URL & Carrier Name on Order |  YES (Display only) |  YES (Full Telemetry) |

---

## 3. Order Lifecycle Handoff & Synchronization

1. **Commercial Confirmation (Business Admin)**:
   - Customer places order. Payment status transitions to `PAID`.
   - Admin reviews and marks order `CONFIRMED`.
   - Stock is reserved in MongoDB via the backend inventory reservation contract.

2. **Fulfillment Handoff (Logistics Control Center)**:
   - Order enters the fulfillment queue (`status: PROCESSING`).
   - Warehouse staff pick and pack items. When packed, order status advances to `PACKED`.
   - Logistics staff select carrier, request AWB, and book pickup.
   - Once dispatched, carrier tracking number and courier name are saved on the order record.

3. **Status Reflection in Business Admin**:
   - The Order Details drawer in Business Admin displays the carrier name, tracking number, and current delivery state (`SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, or `RTO`).
   - Clicking "View in Logistics" navigates seamlessly to `NEXT_PUBLIC_LOGISTICS_APP_URL/shipments?orderNumber=...` via cross-app Single Sign-On (SSO).
   - If an order encounters an NDR or RTO, the Business Admin customer service team can view the status to answer customer queries, while the Logistics team executes the physical return and courier claim.

4. **Return & Refund Reconciliation**:
   - Once a returned package reaches the warehouse and passes QC (in Logistics), the backend emits an order state update `RETURNED`.
   - Business Admin Finance team receives the refund notification and executes the refund via the Finance module.
