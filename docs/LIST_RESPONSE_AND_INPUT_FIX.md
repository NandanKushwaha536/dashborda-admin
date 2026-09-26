# Admin Stability Fix — List Responses & Controlled Inputs

This release adds a centralized list-response normalizer used by Admin list hooks.
It supports direct arrays and common backend envelopes including:
- `{ data: [] }`
- `{ data: { data: [] } }`
- `{ data: { items: [] } }`
- `{ items: [] }`
- `{ orders: [] }`, `{ brands: [] }`, etc.

Pagination metadata (`total`, `page`, `limit`) is also read from either the root or nested `data` object.

Updated list hooks include users, audit logs, categories, brands, coupons, customers, finance transactions/refunds, inventory, orders, products, reviews, support tickets, and dashboard activity/sales.

`AdminInput` now keeps its input value controlled by using an empty-string fallback when the supplied value is `undefined`, preventing controlled/uncontrolled input transitions.

No dummy business data was added.
