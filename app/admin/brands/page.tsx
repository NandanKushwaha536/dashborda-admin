'use client';

import React, { useState } from 'react';
import { Bookmark, Edit2, Plus, Trash2 } from 'lucide-react';
import { useBrands, useCreateBrand, useDeleteBrand, useUpdateBrand } from '@/lib/hooks/useCatalog';
import { Brand } from '@/lib/api/types';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminSearchBar } from '@/components/admin/ui/AdminSearchBar';
import { AdminTable, AdminTableCell, AdminTableRow } from '@/components/admin/ui/AdminTable';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { AdminModal } from '@/components/admin/ui/AdminModal';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';

export default function BrandsPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  const { data: brands = [], isLoading, error, refetch } = useBrands(search);
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    website: '',
    status: 'ACTIVE',
    sortOrder: 0,
    description: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setLogoFile(null);
    setFormError('');
    setFormData({ name: '', slug: '', website: '', status: 'ACTIVE', sortOrder: 0, description: '', seoTitle: '', seoDescription: '', seoKeywords: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setLogoFile(null);
    setFormError('');
    setFormData({
      name: brand.name,
      slug: brand.slug || '',
      website: brand.website || '',
      status: brand.status,
      sortOrder: Number(brand.sortOrder ?? 0),
      description: brand.description || '',
      seoTitle: brand.seo?.title || '',
      seoDescription: brand.seo?.description || '',
      seoKeywords: brand.seo?.keywords?.join(', ') || '',
    });
    setIsModalOpen(true);
  };

  const buildBody = () => {
    const body = new FormData();
    body.append('name', formData.name.trim());
    if (formData.slug.trim()) body.append('slug', formData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    if (formData.website.trim()) body.append('website', formData.website.trim());
    body.append('status', formData.status);
    body.append('sortOrder', String(formData.sortOrder));
    body.append('description', formData.description.trim());
    body.append('seo', JSON.stringify({
      title: formData.seoTitle.trim(),
      description: formData.seoDescription.trim(),
      keywords: formData.seoKeywords.split(',').map((item) => item.trim()).filter(Boolean),
    }));
    if (logoFile) body.append('logo', logoFile);
    return body;
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (formData.name.trim().length < 2) {
      setFormError('Brand name must be at least 2 characters.');
      return;
    }
    try {
      const body = buildBody();
      if (editingBrand) await updateMutation.mutateAsync({ id: editingBrand._id, data: body });
      else await createMutation.mutateAsync(body);
      setIsModalOpen(false);
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Failed to save brand.');
    }
  };

  const handleDelete = async () => {
    if (!deletingBrand) return;
    await deleteMutation.mutateAsync(deletingBrand._id);
    setDeletingBrand(null);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Brand Registry" description="Manage manufacturer identities, logos and brand-level SEO used by products." actions={<AdminButton variant="primary" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-3.5 h-3.5" />}>Add Brand</AdminButton>} />
      <AdminSearchBar value={search} onChange={setSearch} placeholder="Search brands..." className="w-full sm:w-72" />

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? <AdminTableSkeleton rows={6} columns={6} /> : error ? <div className="py-12"><AdminErrorState title="Failed to load brands" message="Could not retrieve brand catalog from the backend." onRetry={() => refetch()} /></div> : brands.length === 0 ? <AdminEmptyState icon={<Bookmark className="w-8 h-8" />} title="No brands registered" description={search ? 'No brands match your search keyword.' : 'Create your first brand.'} actionLabel="Add Brand" onAction={handleOpenCreate} /> : (
          <AdminTable headers={['Brand', 'Slug', 'Website', 'Products', 'Status', 'Actions']}>
            {brands.map((brand) => (
              <AdminTableRow key={brand._id}>
                <AdminTableCell>
                  <div className="flex items-center gap-2.5">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="h-8 w-8 rounded-md object-contain border border-slate-200 bg-slate-50 p-0.5"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-500">
                        {brand.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-slate-900 block">{brand.name}</span>
                    </div>
                  </div>
                </AdminTableCell>
                <AdminTableCell className="font-mono text-xs text-slate-500">/{brand.slug}</AdminTableCell>
                <AdminTableCell className="text-xs text-slate-600">{brand.website ? <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{brand.website.replace(/^https?:\/\//, '')}</a> : '—'}</AdminTableCell>
                <AdminTableCell className="text-xs font-semibold text-slate-700">{brand.productCount ?? 0} products</AdminTableCell>
                <AdminTableCell><AdminStatusBadge status={brand.status} size="sm" /></AdminTableCell>
                <AdminTableCell><div className="flex items-center gap-1"><button type="button" onClick={() => handleOpenEdit(brand)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button><button type="button" onClick={() => setDeletingBrand(brand)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button></div></AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </div>

      {isModalOpen && <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBrand ? 'Edit Brand' : 'Create Brand'} description="Brand identity, logo and brand-level SEO." maxWidth="md" footer={<><AdminButton variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</AdminButton><AdminButton variant="primary" size="sm" onClick={handleSave} isLoading={createMutation.isPending || updateMutation.isPending}>{editingBrand ? 'Save Brand' : 'Create Brand'}</AdminButton></>}>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {formError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{formError}</div>}
          <AdminInput label="Brand Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Nike" required />
          <AdminInput label="Brand Slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} placeholder="e.g. nike (auto-generated if empty)" />
          <AdminInput label="Official Website" type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://example.com" />
          <div className="grid grid-cols-2 gap-3"><AdminSelect label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} options={[{ value: 'ACTIVE', label: 'ACTIVE' }, { value: 'INACTIVE', label: 'INACTIVE' }]} /><AdminInput label="Sort Order" type="number" min={0} value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })} /></div>
          <div><label className="block text-xs font-semibold text-slate-700">Brand Logo (optional)</label><input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-[10px] text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1.5 file:text-[10px] file:font-semibold" /></div>
          <div><label className="block text-xs font-semibold text-slate-700">Description</label><textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="border-t border-slate-100 pt-3"><p className="mb-2 text-xs font-bold text-slate-800">Brand SEO</p><div className="space-y-3"><AdminInput label="SEO Title" value={formData.seoTitle} onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })} /><AdminInput label="SEO Description" value={formData.seoDescription} onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })} /><AdminInput label="SEO Keywords" value={formData.seoKeywords} onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })} placeholder="nike, sportswear, footwear" /></div></div>
        </form>
      </AdminModal>}

      {deletingBrand && <AdminConfirmDialog isOpen={Boolean(deletingBrand)} onClose={() => setDeletingBrand(null)} onConfirm={handleDelete} title="Delete Brand" message={`Are you sure you want to delete "${deletingBrand.name}"?`} confirmLabel="Delete Brand" isDangerous isLoading={deleteMutation.isPending} />}
    </div>
  );
}
