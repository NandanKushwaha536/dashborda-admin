# Product Admin ↔ Backend API Contract Match

This Admin build is aligned with the verified RGEnterprises product API.

## Product endpoints

- `GET /products` — list with `page`, `limit`, `category`, `brand`, `status`, `search`
- `GET /products/:id` — detail
- `POST /products` — multipart form-data; admin permission required
- `PUT /products/:id` — multipart form-data; admin permission required
- `DELETE /products/:id` — delete
- `GET /admin/catalog-config/attributes?category=<id>` — category attributes

## Create/update payload

The Product form sends `FormData` because the backend product route uses Multer and requires a thumbnail file on create.

Required create fields are submitted as backend expects:

- `name`
- `sku`
- `category`
- `brand`
- `description`
- `shortDescription`
- `price`
- `stock`
- `status`
- `thumbnail` file

Optional accepted fields used by the form include:

- `salePrice`
- `attributes` as JSON
- `isFragile`
- `requiresColdChain`
- `hazmatClass`
- `serialTrackingRequired`
- `imeiRequired`
- `dispatchWeightTolerancePercent`
- `isFeatured`
- `tags` as JSON
- `seo` as JSON
- `images` files

The form does not submit model fields that the currently verified backend Zod validator does not accept, even though some of those fields exist in the MongoDB model.

## Response normalization

The Admin normalizes the backend's populated `category`/`brand`, `thumbnail`/`images`, nested `seo`, `reviewCount`, and paginated `{ products, meta }` response shape so UI fields do not depend on the MongoDB response shape.

## Status values

The Admin uses the backend enum:

`DRAFT`, `PENDING_REVIEW`, `ACTIVE`, `INACTIVE`, `OUT_OF_STOCK`

`ARCHIVED` and `LOW_STOCK` are not sent as Product API status values.
