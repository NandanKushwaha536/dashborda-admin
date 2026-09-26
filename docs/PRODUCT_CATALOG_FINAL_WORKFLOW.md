# RG Enterprises — Final Product Catalog Workflow

## Master hierarchy

Brand -> Category -> Child Category -> Category Attributes -> Product -> Variants -> Warehouse Inventory.

Subcategories are represented by the Category `parentCategory` relationship. Do not introduce a second hardcoded subcategory model in the Admin UI.

## Brand

Brand is a master record.

Fields:
- Brand Name
- Logo
- Description
- Status
- Official Website
- Sort Order
- Brand SEO: title, description, keywords

The Product stores the Brand MongoDB ID/reference.

## Category

Category is a master taxonomy record.

Fields:
- Category Name
- Parent Category
- Category Image
- Description
- Status
- Sort Order
- Category SEO: title, description, keywords

`Parent Category = empty` means top-level category. A selected parent creates a child/subcategory relationship.

## Category Attributes

Dynamic attributes are configured per category.

Supported data types:
- TEXT
- NUMBER
- BOOLEAN
- SELECT
- MULTI_SELECT
- DATE

Each attribute can define:
- Required
- Filterable
- Searchable
- Options
- Unit
- Sort Order
- Active state

These attributes are loaded dynamically by Product Create after a category is selected.

## Product

Basic identity:
- Product Name
- SKU
- Category reference
- Brand reference
- Product Type
- Barcode

Content:
- Short Description
- Description

Pricing:
- Base Price
- Sale Price
- Compare-at / MRP
- Initial Stock

Images:
- Thumbnail
- Gallery Images

Commerce:
- Dynamic Category Attributes
- Tags
- Featured
- Tax Profile
- Return Policy

Physical / fulfilment:
- Weight
- Length
- Width
- Height
- Manufacturer
- Model Number
- Country of Origin
- Warranty Months
- Fragile
- Cold Chain
- Hazmat Class
- Serial Tracking
- IMEI Required
- Dispatch Weight Tolerance

SEO:
- SEO Title
- SEO Description
- SEO Keywords

## Variants

Variants are created inside a Product. There is no separate global Variant creation workflow.

Each variant supports:
- Variant ID
- Variant Name
- Variant SKU
- Color Name
- Color Hex
- Variant Price
- Variant Compare-at Price
- Barcode
- Stock
- Images
- Dynamic Variant Attributes
- Weight and Dimensions
- Tax Profile
- Return Policy
- Fragile
- Cold Chain
- Hazmat Class
- Serial Tracking
- IMEI Required
- Dispatch Weight Tolerance
- Active state

Variant SKUs must be unique and must differ from the parent Product SKU.

When Product gallery files are uploaded, the Admin UI can assign selected new gallery images to variants through `variantImageMap`.

## Inventory

Product initial stock is only the initial catalog stock value.

Warehouse inventory is maintained separately and supports:
- Available
- Reserved
- Damaged
- Incoming
- In Transit
- Reorder Level
- Safety Stock

## Tax and Return Policy

Tax Profiles and Return Policies are reusable backend catalog configuration records.

Products and variants reference these records by MongoDB ID instead of hardcoding tax/return rules.

## Product SEO

Product SEO lives inside Product Create/Edit.

Category SEO lives inside Category Create/Edit.

Brand SEO lives inside Brand Create/Edit.

Tags and SEO Keywords are separate concepts.

## UI rule

The Product Create/Edit modal remains the existing compact `xl` modal size. Do not increase the modal dimensions to fit the final workflow. All additional sections remain inside the existing scrollable modal.

## Backend contract rule

The Admin UI must use the existing centralized API client and real backend APIs. No dummy product/category/brand data and no hardcoded MongoDB IDs are allowed.
