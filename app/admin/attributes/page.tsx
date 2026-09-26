'use client';

import React, { useMemo, useState } from 'react';
import {
  Plus,
  Sliders,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  CategoryAttribute,
  useCategories,
  useAllCategoryAttributes,
  useCreateCategoryAttribute,
  useUpdateCategoryAttribute,
} from '@/lib/hooks/useCatalog';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
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

const emptyAttribute = (categoryId: string): Omit<CategoryAttribute, '_id'> => ({
  category: categoryId,
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

export default function AttributesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<CategoryAttribute | null>(null);
  const [formData, setFormData] = useState<Omit<CategoryAttribute, '_id'>>(emptyAttribute(''));
  const [optionsInput, setOptionsInput] = useState('');
  const [formError, setFormError] = useState('');

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const {
    data: attributes = [],
    isLoading: attributesLoading,
    error: attributesError,
    refetch: refetchAttributes,
  } = useAllCategoryAttributes(selectedCategory === 'all' ? undefined : selectedCategory);

  const createMutation = useCreateCategoryAttribute();
  const updateMutation = useUpdateCategoryAttribute();

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c._id, c.name));
    return map;
  }, [categories]);

  const filteredAttributes = useMemo(() => {
    return attributes.filter((attr) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesName = attr.name.toLowerCase().includes(q);
        const matchesKey = attr.key.toLowerCase().includes(q);
        if (!matchesName && !matchesKey) return false;
      }
      if (selectedType !== 'all' && attr.dataType !== selectedType) {
        return false;
      }
      return true;
    });
  }, [attributes, search, selectedType]);

  const categoryOptions = useMemo(() => {
    return categories.map((c) => ({
      value: c._id,
      label: c.name,
      description: c.parentId ? `Subcategory of ${categoryMap.get(c.parentId) || 'Main'}` : 'Main Category',
    }));
  }, [categories, categoryMap]);

  const handleOpenCreate = () => {
    const defaultCat = selectedCategory !== 'all' ? selectedCategory : (categories[0]?._id || '');
    setEditingAttr(null);
    setFormData(emptyAttribute(defaultCat));
    setOptionsInput('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (attr: CategoryAttribute) => {
    setEditingAttr(attr);
    setFormData({
      category: attr.category,
      name: attr.name,
      key: attr.key,
      dataType: attr.dataType,
      required: attr.required,
      filterable: attr.filterable,
      searchable: attr.searchable,
      options: attr.options || [],
      unit: attr.unit || '',
      sortOrder: attr.sortOrder || 0,
      isActive: attr.isActive,
    });
    setOptionsInput((attr.options || []).join(', '));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Attribute display name is required.');
      return;
    }
    if (!formData.category) {
      setFormError('Please select an assigned category.');
      return;
    }

    const key = formData.key.trim()
      ? formData.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
      : formData.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const options =
      formData.dataType === 'SELECT' || formData.dataType === 'MULTI_SELECT'
        ? optionsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const payload = {
      ...formData,
      key,
      options,
      unit: formData.unit?.trim() || undefined,
    };

    try {
      if (editingAttr) {
        await updateMutation.mutateAsync({ id: editingAttr._id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to persist category attribute.');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Category Attributes Master Registry"
        description="Master schema configuration for category-specific product specifications, filterable traits, and variant attributes."
        actions={
          <AdminButton
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Attribute
          </AdminButton>
        }
      />

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search attribute name or key..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-blue-500"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.parentId ? '(Sub)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="w-40">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-blue-500"
            >
              <option value="all">All Data Types</option>
              <option value="TEXT">TEXT</option>
              <option value="NUMBER">NUMBER</option>
              <option value="BOOLEAN">BOOLEAN</option>
              <option value="SELECT">SELECT</option>
              <option value="MULTI_SELECT">MULTI_SELECT</option>
              <option value="DATE">DATE</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 shrink-0">
          Showing <span className="font-bold text-slate-900">{filteredAttributes.length}</span> attribute definitions
        </div>
      </div>

      {/* Main Table */}
      {attributesLoading || categoriesLoading ? (
        <AdminTableSkeleton columns={7} rows={6} />
      ) : attributesError ? (
        <AdminErrorState
          title="Failed to load category attributes"
          message="Could not retrieve attributes master configuration from the backend."
          onRetry={() => refetchAttributes()}
        />
      ) : filteredAttributes.length === 0 ? (
        <AdminEmptyState
          icon={<Sliders className="w-6 h-6" />}
          title="No category attributes found"
          description="Create your first reusable specification attribute to enable structured product metadata."
          actionLabel="Create Attribute"
          onAction={handleOpenCreate}
        />
      ) : (
        <AdminTable
          headers={[
            'Attribute Name',
            'Key',
            'Category',
            'Data Type',
            'Unit',
            'Flags',
            'Status',
            'Actions',
          ]}
        >
          {filteredAttributes.map((attr) => (
            <AdminTableRow key={attr._id}>
              <AdminTableCell>
                <div className="font-semibold text-slate-900">{attr.name}</div>
                {attr.options && attr.options.length > 0 && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Options: {attr.options.slice(0, 3).join(', ')}
                    {attr.options.length > 3 ? ` +${attr.options.length - 3} more` : ''}
                  </div>
                )}
              </AdminTableCell>

              <AdminTableCell>
                <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded-sm text-slate-700 font-mono">
                  {attr.key}
                </code>
              </AdminTableCell>

              <AdminTableCell>
                <span className="text-xs text-slate-700 font-medium">
                  {categoryMap.get(attr.category) || 'Global'}
                </span>
              </AdminTableCell>

              <AdminTableCell>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {attr.dataType}
                </span>
              </AdminTableCell>

              <AdminTableCell>
                <span className="text-slate-500 text-xs">{attr.unit || '—'}</span>
              </AdminTableCell>

              <AdminTableCell>
                <div className="flex flex-wrap gap-1">
                  {attr.required && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-rose-50 text-rose-700 border border-rose-200">
                      Req
                    </span>
                  )}
                  {attr.filterable && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-amber-50 text-amber-700 border border-amber-200">
                      Filter
                    </span>
                  )}
                  {attr.searchable && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Search
                    </span>
                  )}
                </div>
              </AdminTableCell>

              <AdminTableCell>
                <AdminStatusBadge status={attr.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
              </AdminTableCell>

              <AdminTableCell align="right">
                <div className="flex items-center justify-end gap-1">
                  <AdminButton
                    variant="ghost"
                    size="xs"
                    onClick={() => handleOpenEdit(attr)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    Edit
                  </AdminButton>
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>
      )}

      {/* Create / Edit Attribute Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAttr ? `Edit Attribute: ${editingAttr.name}` : 'Create Category Attribute'}
        description="Configure structured master taxonomy attribute for product specifications."
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <AdminSearchableSelect
                label="Target Category"
                required
                options={categoryOptions}
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                placeholder="Select category to bind..."
              />
            </div>

            <div>
              <AdminInput
                label="Display Name"
                required
                placeholder="e.g. RAM, Material, Voltage"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const key = editingAttr
                    ? formData.key
                    : name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                  setFormData({ ...formData, name, key });
                }}
              />
            </div>

            <div>
              <AdminInput
                label="Attribute Key (Backend Identifier)"
                required
                placeholder="e.g. ram_capacity, material_type"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                helperText="Lowercase alphanumeric letters and underscores only."
              />
            </div>

            <div>
              <AdminSelect
                label="Data Type"
                required
                value={formData.dataType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dataType: e.target.value as CategoryAttribute['dataType'],
                  })
                }
                options={[
                  { value: 'TEXT', label: 'TEXT — Freeform string' },
                  { value: 'NUMBER', label: 'NUMBER — Numerical value' },
                  { value: 'BOOLEAN', label: 'BOOLEAN — Yes / No flag' },
                  { value: 'SELECT', label: 'SELECT — Single dropdown pick' },
                  { value: 'MULTI_SELECT', label: 'MULTI_SELECT — Multiple tags' },
                  { value: 'DATE', label: 'DATE — Calendar timestamp' },
                ]}
              />
            </div>

            <div>
              <AdminInput
                label="Measurement Unit (Optional)"
                placeholder="e.g. GB, kg, cm, Watts, mAh"
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>

            <div>
              <AdminInput
                label="Sort Order"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                helperText="Controls sequential rendering order in product forms."
              />
            </div>
          </div>

          {(formData.dataType === 'SELECT' || formData.dataType === 'MULTI_SELECT') && (
            <div>
              <AdminInput
                label="Options (Comma separated)"
                required
                placeholder="e.g. 4GB, 8GB, 16GB, 32GB or Cotton, Polyester, Silk"
                value={optionsInput}
                onChange={(e) => setOptionsInput(e.target.value)}
                helperText="Provide distinct options separated by commas."
              />
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
              />
              <span className="font-medium">Mandatory / Required</span>
            </label>

            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.filterable}
                onChange={(e) => setFormData({ ...formData, filterable: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
              />
              <span className="font-medium">Filterable in Store</span>
            </label>

            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.searchable}
                onChange={(e) => setFormData({ ...formData, searchable: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
              />
              <span className="font-medium">Search Indexed</span>
            </label>

            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
              />
              <span className="font-medium">Active Status</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <AdminButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </AdminButton>
            <AdminButton
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingAttr ? 'Save Changes' : 'Create Attribute'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
