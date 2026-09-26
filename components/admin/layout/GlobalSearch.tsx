'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Package,
  ShoppingCart,
  Users,
  ArrowRight,
  CornerDownLeft,
  Loader2,
  ExternalLink,
  Sliders,
  Boxes,
  Terminal,
  Clock,
  Sparkles,
  Command,
} from 'lucide-react';
import { useProducts } from '@/lib/hooks/useProducts';
import { useOrders } from '@/lib/hooks/useOrders';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { Product, Order, Customer } from '@/lib/api/types';

type SearchCategory = 'ALL' | 'PRODUCTS' | 'ORDERS' | 'CUSTOMERS';

interface FlattenedItem {
  id: string;
  type: 'PRODUCT' | 'ORDER' | 'CUSTOMER' | 'QUICK_LINK';
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  badgeStatus?: string;
  price?: number;
  image?: string;
  icon?: React.ElementType;
}

export interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className = '' }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounce search query to prevent high API request load
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setSelectedIndex(0);
    }, 250);
    return () => clearTimeout(handler);
  }, [query]);

  // Global keyboard shortcut: Cmd+K or Ctrl+K or / (when not inside inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setDebouncedQuery('');
      setActiveCategory('ALL');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Simultaneous queries across Products, Orders, and Customers
  const hasQuery = debouncedQuery.length > 0;

  const {
    data: productsData,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
  } = useProducts({
    search: hasQuery ? debouncedQuery : undefined,
    limit: 6,
  });

  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    isFetching: isOrdersFetching,
  } = useOrders({
    search: hasQuery ? debouncedQuery : undefined,
    limit: 6,
  });

  const {
    data: customersData,
    isLoading: isCustomersLoading,
    isFetching: isCustomersFetching,
  } = useCustomers({
    search: hasQuery ? debouncedQuery : undefined,
    limit: 6,
  });

  const isSearching =
    hasQuery && (isProductsFetching || isOrdersFetching || isCustomersFetching);

  const productsList = useMemo(() => {
    return Array.isArray(productsData?.products) ? productsData.products : [];
  }, [productsData]);

  const ordersList = useMemo(() => {
    return Array.isArray(ordersData?.orders) ? ordersData.orders : [];
  }, [ordersData]);

  const customersList = useMemo(() => {
    return Array.isArray(customersData?.customers) ? customersData.customers : [];
  }, [customersData]);

  // Quick navigation suggestions when query is empty
  const quickLinks: FlattenedItem[] = useMemo(
    () => [
      {
        id: 'ql-products',
        type: 'QUICK_LINK',
        title: 'Product Catalog',
        subtitle: 'Manage products, prices, barcodes & SKU catalog',
        href: '/admin/products',
        icon: Package,
      },
      {
        id: 'ql-orders',
        type: 'QUICK_LINK',
        title: 'Commercial Orders',
        subtitle: 'Review orders, payments & fulfillment transitions',
        href: '/admin/orders',
        icon: ShoppingCart,
      },
      {
        id: 'ql-customers',
        type: 'QUICK_LINK',
        title: 'Customer Directory',
        subtitle: 'View customer accounts, tiers & spending history',
        href: '/admin/customers',
        icon: Users,
      },
      {
        id: 'ql-inventory',
        type: 'QUICK_LINK',
        title: 'Inventory & Warehouses',
        subtitle: 'Stock balances, reserved units & adjustments',
        href: '/admin/inventory',
        icon: Boxes,
      },
      {
        id: 'ql-dev',
        type: 'QUICK_LINK',
        title: 'Developer Console',
        subtitle: 'System health, API explorer, cache & diagnostics',
        href: '/admin/dev',
        icon: Terminal,
      },
    ],
    []
  );

  // Flatten currently visible results for seamless keyboard navigation
  const visibleItems = useMemo<FlattenedItem[]>(() => {
    if (!hasQuery) {
      return quickLinks;
    }

    const items: FlattenedItem[] = [];

    if (activeCategory === 'ALL' || activeCategory === 'PRODUCTS') {
      productsList.forEach((p) => {
        items.push({
          id: `p-${p._id}`,
          type: 'PRODUCT',
          title: p.name,
          subtitle: `SKU: ${p.sku}${p.brandName ? ` • ${p.brandName}` : ''}${p.categoryName ? ` • ${p.categoryName}` : ''}`,
          href: `/admin/products/${p._id}`,
          badge: p.stock > 0 ? `Stock: ${p.stock}` : 'Out of stock',
          badgeStatus: p.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
          price: p.salePrice || p.price,
          image: p.mainImage || (typeof p.thumbnail === 'object' ? p.thumbnail?.url : undefined),
        });
      });
    }

    if (activeCategory === 'ALL' || activeCategory === 'ORDERS') {
      ordersList.forEach((o) => {
        items.push({
          id: `o-${o.id}`,
          type: 'ORDER',
          title: `Order #${o.orderNumber}`,
          subtitle: `${o.customer?.name || 'Customer'}${o.customer?.phone ? ` • ${o.customer.phone}` : ''} • ${o.items?.length || 0} item${(o.items?.length || 0) === 1 ? '' : 's'}`,
          href: `/admin/orders/${o.id}`,
          badge: o.status,
          badgeStatus: o.status,
          price: o.totalAmount,
        });
      });
    }

    if (activeCategory === 'ALL' || activeCategory === 'CUSTOMERS') {
      customersList.forEach((c) => {
        items.push({
          id: `c-${c.id}`,
          type: 'CUSTOMER',
          title: c.name,
          subtitle: `${c.email || c.phone || 'No contact'} • ${c.ordersCount} orders • ₹${Number(c.totalSpent || 0).toLocaleString()} spent`,
          href: `/admin/customers/${c.id}`,
          badge: c.tier || 'Customer',
          badgeStatus: c.status,
        });
      });
    }

    return items;
  }, [hasQuery, quickLinks, activeCategory, productsList, ordersList, customersList]);

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (visibleItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % visibleItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = visibleItems[selectedIndex];
      if (current) {
        handleNavigate(current.href);
      }
    }
  };

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const totalResultsCount = productsList.length + ordersList.length + customersList.length;

  return (
    <>
      {/* Search Bar Trigger Button in the Header */}
      <button
        id="global-search-trigger"
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-between w-full max-w-sm px-3 py-1.5 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 border border-slate-200 rounded-lg transition-all cursor-pointer group shadow-2xs ${className}`}
        aria-label="Open global search (Cmd+K)"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
          <span className="truncate text-slate-400 group-hover:text-slate-600 font-normal">
            Search products, orders, customers...
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1 pl-2 shrink-0">
          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </button>

      {/* Global Search Dialog Modal */}
      {isOpen && (
        <div
          id="global-search-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Global ERP Search"
          className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Input Header */}
            <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 bg-white">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
              <input
                id="global-search-input"
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products, orders, or customers simultaneously..."
                className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
              />
              <div className="flex items-center gap-2 ml-2 shrink-0">
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                )}
                {query && (
                  <button
                    id="global-search-clear"
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                    title="Clear input"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  id="global-search-close"
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-1.5 py-0.5 text-[11px] font-medium text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                >
                  ESC
                </button>
              </div>
            </div>

            {/* Category Filter Tabs (Visible when user is searching) */}
            {hasQuery && (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs">
                <button
                  id="filter-tab-all"
                  type="button"
                  onClick={() => {
                    setActiveCategory('ALL');
                    setSelectedIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeCategory === 'ALL'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>All Results</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      activeCategory === 'ALL'
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {totalResultsCount}
                  </span>
                </button>

                <button
                  id="filter-tab-products"
                  type="button"
                  onClick={() => {
                    setActiveCategory('PRODUCTS');
                    setSelectedIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeCategory === 'PRODUCTS'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Products</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      activeCategory === 'PRODUCTS'
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {productsList.length}
                  </span>
                </button>

                <button
                  id="filter-tab-orders"
                  type="button"
                  onClick={() => {
                    setActiveCategory('ORDERS');
                    setSelectedIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeCategory === 'ORDERS'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Orders</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      activeCategory === 'ORDERS'
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {ordersList.length}
                  </span>
                </button>

                <button
                  id="filter-tab-customers"
                  type="button"
                  onClick={() => {
                    setActiveCategory('CUSTOMERS');
                    setSelectedIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeCategory === 'CUSTOMERS'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Customers</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      activeCategory === 'CUSTOMERS'
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {customersList.length}
                  </span>
                </button>
              </div>
            )}

            {/* Results Body */}
            <div className="overflow-y-auto flex-1 p-2 sm:p-3 divide-y divide-slate-100">
              {/* State 1: Empty Query -> Suggested Searches & Quick Jumps */}
              {!hasQuery && (
                <div className="py-2 px-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Quick Navigation
                  </div>
                  <div className="mt-1 space-y-1">
                    {quickLinks.map((item, idx) => {
                      const Icon = item.icon || Package;
                      const isSelected = selectedIndex === idx;

                      return (
                        <div
                          key={item.id}
                          id={item.id}
                          onClick={() => handleNavigate(item.href)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div
                              className={`p-2 rounded-lg shrink-0 ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-semibold">{item.title}</div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {item.subtitle}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {isSelected && (
                              <CornerDownLeft className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pro Search Hints */}
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Simultaneous Global Search Tips</span>
                    </div>
                    <ul className="text-[11px] text-slate-500 list-disc list-inside space-y-1 pl-1">
                      <li>
                        Type any keyword to simultaneously search <strong>Products</strong>,{' '}
                        <strong>Orders</strong>, and <strong>Customers</strong>.
                      </li>
                      <li>Search by product SKU, name, or category.</li>
                      <li>Search by order number or customer phone.</li>
                      <li>Search by customer name, email address, or state.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* State 2: Active Query with Results */}
              {hasQuery && totalResultsCount > 0 && (
                <div className="space-y-4 py-1">
                  {/* Category Section: Products */}
                  {(activeCategory === 'ALL' || activeCategory === 'PRODUCTS') &&
                    productsList.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-3 py-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                            <span className="p-1 bg-blue-100 text-blue-700 rounded-md">
                              <Package className="w-3.5 h-3.5" />
                            </span>
                            <span>Products ({productsList.length})</span>
                          </div>
                          <button
                            id="view-all-products"
                            type="button"
                            onClick={() =>
                              handleNavigate(
                                `/admin/products?search=${encodeURIComponent(debouncedQuery)}`
                              )
                            }
                            className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <span>View all products</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="mt-1 space-y-1">
                          {productsList.map((product) => {
                            const itemIndex = visibleItems.findIndex(
                              (v) => v.id === `p-${product._id}`
                            );
                            const isSelected = selectedIndex === itemIndex;
                            const imageSrc =
                              product.mainImage ||
                              (typeof product.thumbnail === 'object'
                                ? product.thumbnail?.url
                                : undefined);

                            return (
                              <div
                                key={product._id}
                                id={`search-item-product-${product._id}`}
                                onClick={() =>
                                  handleNavigate(`/admin/products/${product._id}`)
                                }
                                onMouseEnter={() => {
                                  if (itemIndex !== -1) setSelectedIndex(itemIndex);
                                }}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-900'
                                    : 'text-slate-800 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {imageSrc ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src={imageSrc}
                                      alt={product.name}
                                      className="w-9 h-9 rounded-md object-cover border border-slate-200 shrink-0 bg-slate-100"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                      <Package className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="truncate">
                                    <div className="text-xs font-semibold truncate text-slate-900">
                                      {product.name}
                                    </div>
                                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                                      <span className="font-mono text-slate-600">
                                        SKU: {product.sku}
                                      </span>
                                      {product.categoryName && (
                                        <span>• {product.categoryName}</span>
                                      )}
                                      {product.brandName && <span>• {product.brandName}</span>}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                  <div className="text-right">
                                    <div className="text-xs font-bold text-slate-900">
                                      ₹{(product.salePrice || product.price || 0).toLocaleString()}
                                    </div>
                                    <span
                                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                                        product.stock > 0
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-rose-50 text-rose-700'
                                      }`}
                                    >
                                      {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <CornerDownLeft className="w-3.5 h-3.5 text-blue-600" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Category Section: Orders */}
                  {(activeCategory === 'ALL' || activeCategory === 'ORDERS') &&
                    ordersList.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-3 py-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                            <span className="p-1 bg-emerald-100 text-emerald-700 rounded-md">
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </span>
                            <span>Orders ({ordersList.length})</span>
                          </div>
                          <button
                            id="view-all-orders"
                            type="button"
                            onClick={() =>
                              handleNavigate(
                                `/admin/orders?search=${encodeURIComponent(debouncedQuery)}`
                              )
                            }
                            className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <span>View all orders</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="mt-1 space-y-1">
                          {ordersList.map((order) => {
                            const itemIndex = visibleItems.findIndex(
                              (v) => v.id === `o-${order.id}`
                            );
                            const isSelected = selectedIndex === itemIndex;

                            return (
                              <div
                                key={order.id}
                                id={`search-item-order-${order.id}`}
                                onClick={() => handleNavigate(`/admin/orders/${order.id}`)}
                                onMouseEnter={() => {
                                  if (itemIndex !== -1) setSelectedIndex(itemIndex);
                                }}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-900'
                                    : 'text-slate-800 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                                    <ShoppingCart className="w-4 h-4" />
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-semibold truncate text-slate-900 flex items-center gap-2">
                                      <span>Order #{order.orderNumber}</span>
                                      <AdminStatusBadge status={order.status} size="sm" />
                                    </div>
                                    <div className="text-[11px] text-slate-500 truncate">
                                      {order.customer?.name || 'Guest Customer'}{' '}
                                      {order.customer?.phone ? `• ${order.customer.phone}` : ''}{' '}
                                      • {order.items?.length || 0} item
                                      {(order.items?.length || 0) === 1 ? '' : 's'}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                  <div className="text-right">
                                    <div className="text-xs font-bold text-slate-900">
                                      ₹{Number(order.totalAmount || 0).toLocaleString()}
                                    </div>
                                    <span className="text-[10px] text-slate-500">
                                      {order.placedAt
                                        ? new Date(order.placedAt).toLocaleDateString()
                                        : 'Recent'}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <CornerDownLeft className="w-3.5 h-3.5 text-blue-600" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Category Section: Customers */}
                  {(activeCategory === 'ALL' || activeCategory === 'CUSTOMERS') &&
                    customersList.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-3 py-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                            <span className="p-1 bg-violet-100 text-violet-700 rounded-md">
                              <Users className="w-3.5 h-3.5" />
                            </span>
                            <span>Customers ({customersList.length})</span>
                          </div>
                          <button
                            id="view-all-customers"
                            type="button"
                            onClick={() =>
                              handleNavigate(
                                `/admin/customers?search=${encodeURIComponent(debouncedQuery)}`
                              )
                            }
                            className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <span>View all customers</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="mt-1 space-y-1">
                          {customersList.map((customer) => {
                            const itemIndex = visibleItems.findIndex(
                              (v) => v.id === `c-${customer.id}`
                            );
                            const isSelected = selectedIndex === itemIndex;
                            const initials = (customer.name || 'C')
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase();

                            return (
                              <div
                                key={customer.id}
                                id={`search-item-customer-${customer.id}`}
                                onClick={() =>
                                  handleNavigate(`/admin/customers/${customer.id}`)
                                }
                                onMouseEnter={() => {
                                  if (itemIndex !== -1) setSelectedIndex(itemIndex);
                                }}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-900'
                                    : 'text-slate-800 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-md bg-violet-100 text-violet-700 border border-violet-200 font-bold text-xs flex items-center justify-center shrink-0">
                                    {initials}
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-semibold truncate text-slate-900 flex items-center gap-2">
                                      <span>{customer.name}</span>
                                      {customer.tier && (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                          {customer.tier}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 truncate">
                                      {customer.email || 'No email'}{' '}
                                      {customer.phone ? `• ${customer.phone}` : ''}{' '}
                                      {customer.city ? `• ${customer.city}` : ''}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                  <div className="text-right">
                                    <div className="text-xs font-bold text-slate-900">
                                      ₹{Number(customer.totalSpent || 0).toLocaleString()}
                                    </div>
                                    <span className="text-[10px] text-slate-500">
                                      {customer.ordersCount} orders
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <CornerDownLeft className="w-3.5 h-3.5 text-blue-600" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* State 3: Active Query with Zero Results */}
              {hasQuery && totalResultsCount === 0 && !isSearching && (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    No results found for &ldquo;{query}&rdquo;
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    We searched across products, orders, and customer profiles simultaneously but
                    couldn&apos;t find any matches.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear Search
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigate('/admin/products')}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Browse Products
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Keyboard Shortcuts Help */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                    ↑
                  </kbd>
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                    ↓
                  </kbd>{' '}
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                    ↵
                  </kbd>{' '}
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                    esc
                  </kbd>{' '}
                  Dismiss
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1 font-medium text-slate-400">
                <span>Authoritative Search</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
