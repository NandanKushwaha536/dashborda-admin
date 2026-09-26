'use client';

import React, { useMemo, useState } from 'react';
import {
  CornerDownRight,
  Edit2,
  FolderTree,
  Image as ImageIcon,
  Layers,
  List,
  Plus,
  Settings2,
  Tags,
  Trash2,
} from 'lucide-react';
import {
  CategoryAttribute,
  useCategories,
  useCategoryAttributes,
  useCreateCategory,
  useCreateCategoryAttribute,
  useDeleteCategory,
  useUpdateCategory,
  useUpdateCategoryAttribute,
} from '@/lib/hooks/useCatalog';
import { Category } from '@/lib/api/types';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { AdminSearchBar } from '@/components/admin/ui/AdminSearchBar';
import { AdminTable, AdminTableRow, AdminTableCell } from '@/components/admin/ui/AdminTable';
import { AdminStatusBadge } from '@/components/admin/ui/AdminStatusBadge';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminTableSkeleton } from '@/components/admin/ui/AdminSkeleton';
import { AdminEmptyState } from '@/components/admin/ui/AdminEmptyState';
import { AdminErrorState } from '@/components/admin/ui/AdminErrorState';
import { AdminModal } from '@/components/admin/ui/AdminModal';
import { AdminInput } from '@/components/admin/ui/AdminInput';
import { AdminSelect } from '@/components/admin/ui/AdminSelect';
import { AdminSearchableSelect } from '@/components/admin/ui/AdminSearchableSelect';
import { AdminConfirmDialog } from '@/components/admin/ui/AdminConfirmDialog';

const emptyAttribute = (category: string): Omit<CategoryAttribute, '_id'> => ({
  category,
  name: '',
  key: '',
  dataType: 'TEXT',
  required: false,
  filterable: false,
  searchable: false,
  options: [],
  unit: '',
  sortOrder: 0,
  isActive: true,
});

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'hierarchy' | 'table'>('hierarchy');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [attributeCategory, setAttributeCategory] = useState<Category | null>(null);
  const [editingAttribute, setEditingAttribute] = useState<CategoryAttribute | null>(null);
  const [attributeForm, setAttributeForm] = useState<Omit<CategoryAttribute, '_id'>>(emptyAttribute(''));
  const [formError, setFormError] = useState('');
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const objectUrlRef = React.useRef<string | null>(null);

  const revokeObjectUrl = React.useCallback(() => {
    if (objectUrlRef.current) {
      try {
        URL.revokeObjectURL(objectUrlRef.current);
      } catch {
        // no-op
      }
      objectUrlRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      revokeObjectUrl();
    };
  }, [revokeObjectUrl]);

  // Form state
  const [categoryType, setCategoryType] = useState<'MAIN' | 'SUB'>('MAIN');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentCategory: '',
    status: 'ACTIVE',
    sortOrder: 0,
    description: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });

  const { data: categories = [], isLoading, error, refetch } = useCategories(search);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const createAttributeMutation = useCreateCategoryAttribute();
  const updateAttributeMutation = useUpdateCategoryAttribute();

  const { data: attributes = [], isLoading: attributesLoading } = useCategoryAttributes(attributeCategory?._id);

  // Group into main categories (parentId is empty/null) and subcategories (parentId is set)
  const { mainCategories, subcategoriesByParent, orphanSubcategories } = useMemo(() => {
    const mains: Category[] = [];
    const subsMap = new Map<string, Category[]>();
    const mainsIdSet = new Set<string>();

    categories.forEach((cat) => {
      if (!cat.parentId) {
        mains.push(cat);
        mainsIdSet.add(cat._id);
      }
    });

    // Sort mains by sortOrder
    mains.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const orphans: Category[] = [];
    categories.forEach((cat) => {
      if (cat.parentId) {
        if (mainsIdSet.has(cat.parentId)) {
          const list = subsMap.get(cat.parentId) || [];
          list.push(cat);
          subsMap.set(cat.parentId, list);
        } else {
          orphans.push(cat);
        }
      }
    });

    // Sort subcategories in each parent
    subsMap.forEach((list) => list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));

    return { mainCategories: mains, subcategoriesByParent: subsMap, orphanSubcategories: orphans };
  }, [categories]);

  const parentSelectOptions = useMemo(() => {
    return mainCategories
      .filter((cat) => cat._id !== editingCategory?._id)
      .map((cat) => ({
        value: cat._id,
        label: cat.name,
        sublabel: `/${cat.slug}`,
      }));
  }, [mainCategories, editingCategory]);

  const handleCloseModal = () => {
    revokeObjectUrl();
    setIsModalOpen(false);
  };

  const handleOpenCreateMain = () => {
    revokeObjectUrl();
    setEditingCategory(null);
    setCategoryType('MAIN');
    setFormData({
      name: '',
      slug: '',
      parentCategory: '',
      status: 'ACTIVE',
      sortOrder: 0,
      description: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    });
    setCategoryImage(null);
    setImagePreview(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenCreateSub = (parentCategoryId?: string) => {
    revokeObjectUrl();
    setEditingCategory(null);
    setCategoryType('SUB');
    setFormData({
      name: '',
      slug: '',
      parentCategory: parentCategoryId || (mainCategories[0]?._id ?? ''),
      status: 'ACTIVE',
      sortOrder: 0,
      description: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    });
    setCategoryImage(null);
    setImagePreview(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    revokeObjectUrl();
    setEditingCategory(category);
    const isSub = Boolean(category.parentId);
    setCategoryType(isSub ? 'SUB' : 'MAIN');
    setFormData({
      name: category.name,
      slug: category.slug || '',
      parentCategory: category.parentId || '',
      status: category.status,
      sortOrder: Number(category.sortOrder ?? 0),
      description: category.description || '',
      seoTitle: category.seoTitle || '',
      seoDescription: category.seoDescription || '',
      seoKeywords: category.seoKeywords || '',
    });
    setCategoryImage(null);
    setImagePreview(category.image || null);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCategoryImage(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      revokeObjectUrl();
      objectUrlRef.current = previewUrl;
      setImagePreview(previewUrl);
    } else {
      revokeObjectUrl();
      setImagePreview(editingCategory?.image || null);
    }
  };

  const buildCategoryBody = () => {
    const body = new FormData();
    body.append('name', formData.name.trim());
    if (formData.slug.trim()) {
      body.append('slug', formData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    }
    if (categoryType === 'SUB' && formData.parentCategory) {
      body.append('parentCategory', formData.parentCategory);
    }
    body.append('status', formData.status);
    body.append('sortOrder', String(formData.sortOrder));
    body.append('description', formData.description.trim());
    body.append(
      'seo',
      JSON.stringify({
        title: formData.seoTitle.trim(),
        description: formData.seoDescription.trim(),
        keywords: formData.seoKeywords
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      })
    );
    if (categoryImage) {
      body.append('image', categoryImage);
    }
    return body;
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (formData.name.trim().length < 2) {
      setFormError('Category name must be at least 2 characters.');
      return;
    }
    if (categoryType === 'SUB' && !formData.parentCategory) {
      setFormError('Please select a Parent Category for this subcategory.');
      return;
    }
    if (!editingCategory && !categoryImage) {
      setFormError('Category image is required when creating a category.');
      return;
    }
    try {
      const body = buildCategoryBody();
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory._id, data: body });
      } else {
        await createMutation.mutateAsync(body);
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Failed to save category.');
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    await deleteMutation.mutateAsync(deletingCategory._id);
    setDeletingCategory(null);
  };

  const openAttributes = (category: Category) => {
    setAttributeCategory(category);
    setEditingAttribute(null);
    setAttributeForm(emptyAttribute(category._id));
  };

  const openNewAttribute = () => {
    if (!attributeCategory) return;
    setEditingAttribute(null);
    setAttributeForm(emptyAttribute(attributeCategory._id));
  };

  const openEditAttribute = (attribute: CategoryAttribute) => {
    setEditingAttribute(attribute);
    setAttributeForm({ ...attribute });
  };

  const saveAttribute = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!attributeForm.name.trim() || !attributeForm.key.trim() || !attributeCategory) return;
    const payload = {
      ...attributeForm,
      name: attributeForm.name.trim(),
      key: attributeForm.key.trim().toLowerCase(),
      options: attributeForm.options.map((option) => option.trim()).filter(Boolean),
      unit: attributeForm.unit?.trim() || undefined,
      sortOrder: Number(attributeForm.sortOrder || 0),
    };
    if (editingAttribute) {
      await updateAttributeMutation.mutateAsync({ id: editingAttribute._id, data: payload });
    } else {
      await createAttributeMutation.mutateAsync(payload);
    }
    setEditingAttribute(null);
    setAttributeForm(emptyAttribute(attributeCategory._id));
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Product Categories"
        description="Hierarchical category taxonomy: Main Categories, child Subcategories, and dynamic Category Attributes."
        actions={
          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => handleOpenCreateSub()}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Subcategory
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              onClick={handleOpenCreateMain}
              leftIcon={<FolderTree className="w-3.5 h-3.5" />}
            >
              Add Main Category
            </AdminButton>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <AdminSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search categories & subcategories..."
          className="w-full sm:w-80"
        />

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setViewMode('hierarchy')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'hierarchy'
                ? 'bg-white text-blue-600 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            Hierarchy View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-white text-blue-600 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Flat Table
          </button>
        </div>
      </div>

      {isLoading ? (
        <AdminTableSkeleton rows={6} columns={7} />
      ) : error ? (
        <div className="py-12">
          <AdminErrorState
            title="Failed to load categories"
            message="Could not retrieve category taxonomy from the backend."
            onRetry={() => refetch()}
          />
        </div>
      ) : categories.length === 0 ? (
        <AdminEmptyState
          icon={<Tags className="w-8 h-8" />}
          title="No categories found"
          description={search ? 'No categories match your search keyword.' : 'Create your first catalog category.'}
          actionLabel="Create Main Category"
          onAction={handleOpenCreateMain}
        />
      ) : viewMode === 'hierarchy' ? (
        /* HIERARCHY TREE VIEW */
        <div className="space-y-4">
          {mainCategories.map((mainCat) => {
            const subcats = subcategoriesByParent.get(mainCat._id) || [];
            return (
              <div
                key={mainCat._id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
              >
                {/* Main Category Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/75 px-4 py-3">
                  <div className="flex items-center gap-3">
                    {mainCat.image ? (
                      <img
                        src={mainCat.image}
                        alt={mainCat.name}
                        className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-white object-cover shadow-xs"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600">
                        <FolderTree className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{mainCat.name}</h3>
                        <span className="inline-flex items-center rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-indigo-200">
                          MAIN CATEGORY
                        </span>
                        <AdminStatusBadge status={mainCat.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                        <span className="font-mono text-[11px] text-slate-400">/{mainCat.slug}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-600">{mainCat.productCount ?? 0} products</span>
                        <span>•</span>
                        <span className="text-slate-500">{subcats.length} subcategories</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenCreateSub(mainCat._id)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Subcategory
                    </button>
                    <button
                      type="button"
                      onClick={() => openAttributes(mainCat)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-xs"
                      title="Manage category attributes"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      Attributes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(mainCat)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-colors"
                      title="Edit main category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCategory(mainCat)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded transition-colors"
                      title="Delete main category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subcategories Branch */}
                {subcats.length === 0 ? (
                  <div className="px-5 py-3 text-xs text-slate-400 bg-white flex items-center gap-2">
                    <CornerDownRight className="h-3.5 w-3.5 text-slate-300 ml-4" />
                    <span>No subcategories registered under {mainCat.name}. Products can be assigned directly to this category.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 bg-white">
                    {subcats.map((subcat) => (
                      <div
                        key={subcat._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 pl-6 sm:pl-10 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-slate-300 font-mono text-xs select-none">├──</div>
                          {subcat.image ? (
                            <img
                              src={subcat.image}
                              alt={subcat.name}
                              className="h-8 w-8 shrink-0 rounded-md border border-slate-200 bg-white object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-emerald-100 bg-emerald-50 text-emerald-600">
                              <Layers className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 text-xs">{subcat.name}</span>
                              <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                                SUBCATEGORY
                              </span>
                              <AdminStatusBadge status={subcat.status} size="sm" />
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-mono text-[10px]">/{subcat.slug}</span>
                              <span>•</span>
                              <span className="text-slate-600">{subcat.productCount ?? 0} products</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => openAttributes(subcat)}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                          >
                            <Settings2 className="h-3 w-3" />
                            Attributes
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(subcat)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded"
                            title="Edit subcategory"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCategory(subcat)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Delete subcategory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Orphan Subcategories if any */}
          {orphanSubcategories.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-xs">
              <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900">
                <span>Other / Unassigned Subcategories</span>
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px]">{orphanSubcategories.length}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {orphanSubcategories.map((subcat) => (
                  <div key={subcat._id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800">{subcat.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">/{subcat.slug}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(subcat)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCategory(subcat)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* FLAT TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <AdminTable headers={['Category', 'Level', 'Slug', 'Parent', 'Products', 'Status', 'Attributes', 'Actions']}>
            {categories.map((category) => {
              const isSub = Boolean(category.parentId);
              return (
                <AdminTableRow key={category._id}>
                  <AdminTableCell>
                    <div className="flex items-center gap-2.5">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="h-7 w-7 rounded object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-100 text-[10px] text-slate-500 font-bold">
                          {category.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-semibold text-slate-900">{category.name}</span>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    {isSub ? (
                      <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                        SUBCATEGORY
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700 ring-1 ring-indigo-200">
                        MAIN
                      </span>
                    )}
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-xs text-slate-500">/{category.slug}</AdminTableCell>
                  <AdminTableCell className="text-xs text-slate-600">
                    {category.parentName || (isSub ? 'Parent category' : 'Top Level')}
                  </AdminTableCell>
                  <AdminTableCell className="text-xs font-semibold text-slate-700">
                    {category.productCount ?? 0} products
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminStatusBadge status={category.status} size="sm" />
                  </AdminTableCell>
                  <AdminTableCell>
                    <button
                      type="button"
                      onClick={() => openAttributes(category)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                    >
                      <Settings2 className="h-3 w-3" /> Manage
                    </button>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(category)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCategory(category)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              );
            })}
          </AdminTable>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <AdminModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={
            editingCategory
              ? `Edit ${categoryType === 'MAIN' ? 'Main Category' : 'Subcategory'}: ${editingCategory.name}`
              : `Create New ${categoryType === 'MAIN' ? 'Main Category' : 'Subcategory'}`
          }
          description="Category hierarchy, independent image upload, and category-level SEO."
          maxWidth="md"
          footer={
            <>
              <AdminButton variant="outline" size="sm" onClick={handleCloseModal}>
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {editingCategory ? 'Save Category' : 'Create Category'}
              </AdminButton>
            </>
          }
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">{formError}</div>
            )}

            {/* Type selector if not editing */}
            {!editingCategory && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Category Level</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryType('MAIN');
                      setFormData((prev) => ({ ...prev, parentCategory: '' }));
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition-all ${
                      categoryType === 'MAIN'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FolderTree className="h-4 w-4" />
                    Main Category
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryType('SUB');
                      if (!formData.parentCategory && mainCategories[0]?._id) {
                        setFormData((prev) => ({ ...prev, parentCategory: mainCategories[0]._id }));
                      }
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition-all ${
                      categoryType === 'SUB'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="h-4 w-4" />
                    Subcategory
                  </button>
                </div>
              </div>
            )}

            <AdminInput
              label="Category Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={categoryType === 'MAIN' ? 'e.g. Footwear' : 'e.g. Running Shoes'}
              required
            />

            <AdminInput
              label="Slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                })
              }
              placeholder="e.g. running-shoes (auto-generated if empty)"
            />

            {categoryType === 'SUB' && (
              <AdminSearchableSelect
                label="Parent Category"
                required
                value={formData.parentCategory}
                onChange={(val) => setFormData({ ...formData, parentCategory: val })}
                options={parentSelectOptions}
                placeholder="Select parent main category..."
                helperText="Subcategories strictly belong under an active Main Category."
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <AdminSelect
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'ACTIVE', label: 'ACTIVE' },
                  { value: 'INACTIVE', label: 'INACTIVE' },
                ]}
              />
              <AdminInput
                label="Sort Order"
                type="number"
                min={0}
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
              />
            </div>

            {/* Independent Image Upload */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/75 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-800">
                  {categoryType === 'MAIN' ? 'Main Category Image *' : 'Subcategory Image *'}
                  {editingCategory && <span className="font-normal text-slate-500"> (optional if unchanged)</span>}
                </label>
                <span className="text-[10px] text-slate-400">Independent upload</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Category and Subcategory images are independent. Subcategories do not reuse parent category images.
              </p>

              <div className="flex items-center gap-3 pt-1">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Category preview"
                    className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 bg-white object-cover shadow-xs"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-[11px] text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-white file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 file:shadow-xs file:ring-1 file:ring-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Category summary for customer and admin guidance..."
              />
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="mb-2 text-xs font-bold text-slate-800">Category SEO</p>
              <div className="space-y-3">
                <AdminInput
                  label="SEO Title"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder="e.g. Running Shoes - Athletic Footwear | RG Enterprises"
                />
                <AdminInput
                  label="SEO Description"
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  placeholder="Meta description for search engines..."
                />
                <AdminInput
                  label="SEO Keywords"
                  value={formData.seoKeywords}
                  onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                  placeholder="footwear, running shoes, sneakers"
                />
              </div>
            </div>
          </form>
        </AdminModal>
      )}

      {/* CATEGORY ATTRIBUTES MODAL */}
      {attributeCategory && (
        <AdminModal
          isOpen={Boolean(attributeCategory)}
          onClose={() => setAttributeCategory(null)}
          title={`Category Attributes: ${attributeCategory.name}`}
          description={`Configured dynamic fields automatically populate Product Create when ${attributeCategory.name} is selected.`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Configure required, filterable, and searchable product fields.
              </div>
              <AdminButton
                variant="primary"
                size="sm"
                onClick={openNewAttribute}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                Add Attribute
              </AdminButton>
            </div>

            {attributesLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading attributes...</div>
            ) : attributes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-xs text-slate-400">
                No attributes configured for this category yet. Add attributes below.
              </div>
            ) : (
              <div className="space-y-2">
                {attributes.map((attribute) => (
                  <div
                    key={attribute._id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800">{attribute.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">{attribute.key}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                          {attribute.dataType}
                        </span>
                        {!attribute.isActive && (
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold text-red-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {attribute.required ? 'Required' : 'Optional'} ·{' '}
                        {attribute.filterable ? 'Filterable' : 'Not filterable'} ·{' '}
                        {attribute.searchable ? 'Searchable' : 'Not searchable'}
                        {attribute.unit ? ` · Unit: ${attribute.unit}` : ''}
                      </p>
                      {attribute.options.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {attribute.options.map((opt) => (
                            <span
                              key={opt}
                              className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] text-slate-600 font-mono"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditAttribute(attribute)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                        title="Edit attribute"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateAttributeMutation.mutate({
                            id: attribute._id,
                            data: { isActive: !attribute.isActive, category: attribute.category },
                          })
                        }
                        className={`p-1.5 rounded ${
                          attribute.isActive ? 'text-slate-400 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-700'
                        }`}
                        title={attribute.isActive ? 'Deactivate attribute' : 'Activate attribute'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <form onSubmit={saveAttribute} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">
                    {editingAttribute ? 'Edit Attribute' : 'New Attribute'}
                  </h4>
                  {editingAttribute && (
                    <button
                      type="button"
                      onClick={openNewAttribute}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Clear / New
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <AdminInput
                    label="Display Name *"
                    value={attributeForm.name}
                    onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })}
                    placeholder="e.g. Sole Material, RAM, Storage"
                  />
                  <AdminInput
                    label="Attribute Key *"
                    value={attributeForm.key}
                    onChange={(e) =>
                      setAttributeForm({
                        ...attributeForm,
                        key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                      })
                    }
                    placeholder="e.g. sole_material"
                  />
                  <AdminSelect
                    label="Data Type"
                    value={attributeForm.dataType}
                    onChange={(e) =>
                      setAttributeForm({
                        ...attributeForm,
                        dataType: e.target.value as CategoryAttribute['dataType'],
                      })
                    }
                    options={['TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'DATE'].map((value) => ({
                      value,
                      label: value,
                    }))}
                  />
                  <AdminInput
                    label="Unit"
                    value={attributeForm.unit || ''}
                    onChange={(e) => setAttributeForm({ ...attributeForm, unit: e.target.value })}
                    placeholder="cm, kg, GB, etc."
                  />
                  <AdminInput
                    label="Sort Order"
                    type="number"
                    min={0}
                    value={attributeForm.sortOrder}
                    onChange={(e) => setAttributeForm({ ...attributeForm, sortOrder: Number(e.target.value) })}
                  />
                </div>

                {(attributeForm.dataType === 'SELECT' || attributeForm.dataType === 'MULTI_SELECT') && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700">
                      Options (comma-separated)
                    </label>
                    <textarea
                      rows={2}
                      value={attributeForm.options.join(', ')}
                      onChange={(e) =>
                        setAttributeForm({
                          ...attributeForm,
                          options: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g. Rubber, Synthetic Leather, Mesh, EVA"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(
                    [
                      ['required', 'Required'],
                      ['filterable', 'Filterable'],
                      ['searchable', 'Searchable'],
                      ['isActive', 'Active'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                      <input
                        type="checkbox"
                        checked={attributeForm[key]}
                        onChange={(e) => setAttributeForm({ ...attributeForm, [key]: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      <span className="text-[10px] font-semibold text-slate-600">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end">
                  <AdminButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={createAttributeMutation.isPending || updateAttributeMutation.isPending}
                  >
                    {editingAttribute ? 'Save Attribute' : 'Create Attribute'}
                  </AdminButton>
                </div>
              </form>
            </div>
          </div>
        </AdminModal>
      )}

      {/* DELETE CATEGORY CONFIRM DIALOG */}
      {deletingCategory && (
        <AdminConfirmDialog
          isOpen={Boolean(deletingCategory)}
          onClose={() => setDeletingCategory(null)}
          onConfirm={handleDelete}
          title="Delete Category"
          message={`Are you sure you want to delete "${deletingCategory.name}"? This action cannot be undone.`}
          confirmLabel="Delete Category"
          isDangerous
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
