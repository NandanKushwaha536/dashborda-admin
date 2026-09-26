# RGEnterprises Catalog Connection

The admin catalog is connected as:

Category -> Product.category (MongoDB ID)
Brand -> Product.brand (MongoDB ID)
Variants -> Product.variants (existing backend product variants contract)
SEO -> seo on Category, Brand and Product
Inventory -> existing inventory/product-SKU flow
Orders -> existing order items/product-SKU flow

No new fake/mock API was introduced. The Variants & Attributes page uses the existing Products GET/PUT API because this admin/backend package does not expose a separate global attributes endpoint.
