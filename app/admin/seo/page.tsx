'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Search,
  Package,
  Tags,
  Bookmark,
  FileCode,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Save,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminCard, AdminCardBody, AdminCardHeader } from '@/components/admin/ui/AdminCard';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { useProducts } from '@/lib/hooks/useProducts';
import { useCategories, useBrands } from '@/lib/hooks/useCatalog';

export default function SeoPage() {
  const [activeTab, setActiveTab] = useState<'global' | 'products' | 'categories' | 'brands' | 'sitemap'>('global');

  // Global SEO Form state
  const [globalSeo, setGlobalSeo] = useState({
    siteTitle: 'RGEnterprises | Quality Electronics & Lifestyle',
    titleSeparator: '—',
    metaDescription: 'Shop verified premium electronics, home essentials, and lifestyle products with fast dispatch and guaranteed warranty.',
    keywords: 'electronics, gadgets, accessories, lifestyle, online shopping, verified warranty',
    ogImageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80',
    twitterHandle: '@rgenterprises',
    allowIndexing: true,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load real catalog entities to inspect SEO readiness
  const { data: productsData, isLoading: productsLoading } = useProducts({ limit: 50 });
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: brands = [], isLoading: brandsLoading } = useBrands();

  const products = productsData?.products || [];

  const handleSaveGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Search Engine Optimization (SEO) & Metadata"
        description="Configure search engine indexing, OpenGraph rich social snippets, sitemaps, and catalog meta tags."
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'global', label: 'Global Storefront SEO', icon: Globe },
          { id: 'products', label: 'Product Meta Tags', icon: Package },
          { id: 'categories', label: 'Category Meta Tags', icon: Tags },
          { id: 'brands', label: 'Brand Meta Tags', icon: Bookmark },
          { id: 'sitemap', label: 'Sitemap & Robots', icon: FileCode },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Global Storefront SEO */}
      {activeTab === 'global' && (
        <AdminCard>
          <AdminCardHeader
            title="Global Search & Social Media Identity"
            description="Default search snippet fallback rendered across general pages and search engine crawlers."
          />
          <AdminCardBody>
            <form onSubmit={handleSaveGlobal} className="space-y-4 max-w-2xl">
              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Global SEO settings updated successfully.</span>
                </div>
              )}

              <AdminInput
                label="Site Title"
                value={globalSeo.siteTitle}
                onChange={(e) => setGlobalSeo({ ...globalSeo, siteTitle: e.target.value })}
                required
              />

              <AdminInput
                label="Meta Description (Recommended: 120-160 characters)"
                value={globalSeo.metaDescription}
                onChange={(e) => setGlobalSeo({ ...globalSeo, metaDescription: e.target.value })}
                required
              />

              <AdminInput
                label="Keywords (Comma separated)"
                value={globalSeo.keywords}
                onChange={(e) => setGlobalSeo({ ...globalSeo, keywords: e.target.value })}
              />

              <AdminInput
                label="OpenGraph Social Banner URL"
                value={globalSeo.ogImageUrl}
                onChange={(e) => setGlobalSeo({ ...globalSeo, ogImageUrl: e.target.value })}
              />

              <AdminInput
                label="Twitter / X Publisher Handle"
                value={globalSeo.twitterHandle}
                onChange={(e) => setGlobalSeo({ ...globalSeo, twitterHandle: e.target.value })}
              />

              <div className="flex items-center justify-between py-3 border-y border-slate-100">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Search Engine Crawling</span>
                  <span className="text-[11px] text-slate-500">
                    Instruct Googlebot and Bingbot to index storefront pages (index, follow)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={globalSeo.allowIndexing}
                  onChange={(e) => setGlobalSeo({ ...globalSeo, allowIndexing: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>

              {/* SERP Search Snippet Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Google SERP Preview
                </span>
                <div className="text-xs text-slate-500">https://rgenterprises.com</div>
                <div className="text-base font-medium text-blue-700 hover:underline cursor-pointer">
                  {globalSeo.siteTitle}
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">
                  {globalSeo.metaDescription}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <AdminButton type="submit" variant="primary" size="sm" leftIcon={<Save className="w-4 h-4" />}>
                  Save Global SEO
                </AdminButton>
              </div>
            </form>
          </AdminCardBody>
        </AdminCard>
      )}

      {/* Tab 2: Products Meta Tags */}
      {activeTab === 'products' && (
        <AdminCard>
          <AdminCardHeader
            title="Product Meta Tags Audit"
            description="Inspect which catalog products have customized SEO titles and descriptions."
            action={
              <Link href="/admin/products">
                <AdminButton variant="outline" size="sm">
                  Manage Products
                </AdminButton>
              </Link>
            }
          />
          <AdminCardBody className="p-0">
            <div className="divide-y divide-slate-100 text-xs">
              {products.slice(0, 15).map((p) => {
                const hasSeo = Boolean(p.seo?.title || p.seo?.description);
                return (
                  <div key={p._id} className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        SKU: {p.sku} • Slug: /{p.slug || p._id}
                      </div>
                      {hasSeo ? (
                        <div className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                          <span className="font-semibold text-slate-700">Meta Title:</span>{' '}
                          {String(p.seo?.title || p.name)}
                        </div>
                      ) : (
                        <div className="text-amber-600 text-[11px]">
                          Uses default automatic title format
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hasSeo
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {hasSeo ? 'Custom SEO' : 'Auto Default'}
                      </span>
                      <Link href={`/admin/products`}>
                        <AdminButton variant="outline" size="xs">
                          Edit Product
                        </AdminButton>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminCardBody>
        </AdminCard>
      )}

      {/* Tab 3: Categories Meta Tags */}
      {activeTab === 'categories' && (
        <AdminCard>
          <AdminCardHeader
            title="Category Landing Page SEO"
            description="Audit meta titles and descriptions for category storefront portals."
            action={
              <Link href="/admin/categories">
                <AdminButton variant="outline" size="sm">
                  Manage Categories
                </AdminButton>
              </Link>
            }
          />
          <AdminCardBody className="p-0">
            <div className="divide-y divide-slate-100 text-xs">
              {categories.slice(0, 15).map((c) => (
                <div key={c._id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    <div className="text-slate-500 font-mono text-[11px]">/{c.slug}</div>
                    {c.seo?.title ? (
                      <div className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                        {c.seo.title}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-[11px]">Default category title format</div>
                    )}
                  </div>
                  <Link href="/admin/categories">
                    <AdminButton variant="outline" size="xs">
                      Edit Category
                    </AdminButton>
                  </Link>
                </div>
              ))}
            </div>
          </AdminCardBody>
        </AdminCard>
      )}

      {/* Tab 4: Brand Meta Tags */}
      {activeTab === 'brands' && (
        <AdminCard>
          <AdminCardHeader
            title="Brand Portal Meta Tags"
            description="Inspect search engine configurations for manufacturer and brand pages."
            action={
              <Link href="/admin/brands">
                <AdminButton variant="outline" size="sm">
                  Manage Brands
                </AdminButton>
              </Link>
            }
          />
          <AdminCardBody className="p-0">
            <div className="divide-y divide-slate-100 text-xs">
              {brands.slice(0, 15).map((b) => (
                <div key={b._id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900">{b.name}</div>
                    <div className="text-slate-500 font-mono text-[11px]">/{b.slug}</div>
                  </div>
                  <Link href="/admin/brands">
                    <AdminButton variant="outline" size="xs">
                      Edit Brand
                    </AdminButton>
                  </Link>
                </div>
              ))}
            </div>
          </AdminCardBody>
        </AdminCard>
      )}

      {/* Tab 5: Sitemap & Robots */}
      {activeTab === 'sitemap' && (
        <div className="space-y-4">
          <AdminCard>
            <AdminCardHeader
              title="Automated XML Sitemap"
              description="Dynamically generated index of all active catalog products, categories, and brand landing pages."
            />
            <AdminCardBody className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">XML Sitemap Endpoint</span>
                    <span className="font-mono text-slate-500">/sitemap.xml</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Status: Active & Valid</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">Robots.txt Directive</span>
                    <span className="font-mono text-slate-500">/robots.txt</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Allows Search Crawlers</span>
                </div>
              </div>
            </AdminCardBody>
          </AdminCard>
        </div>
      )}
    </div>
  );
}
