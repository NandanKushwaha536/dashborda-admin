'use client';

import React, { useState } from 'react';
import { AdminModal } from '../ui/AdminModal';
import { AdminInput } from '../ui/AdminInput';
import { AdminSelect } from '../ui/AdminSelect';
import { AdminButton } from '../ui/AdminButton';
import { useAdjustStock } from '@/lib/hooks/useInventory';
import { useProducts } from '@/lib/hooks/useProducts';
import { InventoryItem, Product } from '@/lib/api/types';
import { Search } from 'lucide-react';

export function StockAdjustmentModal({
  isOpen,
  onClose,
  item = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  item?: InventoryItem | null;
}) {
  const adjustStockMutation = useAdjustStock();

  // The backend adjusts stock by productId, not SKU — there is no
  // lookup-by-SKU route. When a specific inventory row was clicked, we
  // already have its productId. Otherwise the admin searches for the
  // product first, then picks it, which gives us a real productId.
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; sku: string; name: string } | null>(
    item ? { id: item.productId, sku: item.sku, name: item.productName } : null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [type, setType] = useState<'ADD' | 'SUBTRACT' | 'SET'>('ADD');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const { data: searchResults, isFetching: isSearching } = useProducts({
    search: searchTerm,
    limit: 5,
  });

  React.useEffect(() => {
    if (item) {
      setSelectedProduct({ id: item.productId, sku: item.sku, name: item.productName });
    } else {
      setSelectedProduct(null);
    }
    setSearchTerm('');
    setType('ADD');
    setQuantity(1);
    setReason('');
    setError('');
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError('Select a product to adjust');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }
    if (!reason.trim() || reason.trim().length < 2) {
      setError('An audit reason is required for inventory adjustments');
      return;
    }

    try {
      await adjustStockMutation.mutateAsync({
        productId: selectedProduct.id,
        // ADD/SUBTRACT map to a signed delta; SET maps to an absolute
        // physical count — the backend accepts exactly one of the two.
        ...(type === 'SET'
          ? { physicalCount: quantity }
          : { quantity: type === 'ADD' ? quantity : -quantity }),
        reason: reason.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Adjustment failed';
      setError(msg);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Level Adjustment"
      description="Stock movements are logged to the immutable audit stream."
      maxWidth="md"
      footer={
        <>
          <AdminButton
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={adjustStockMutation.isPending}
          >
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={adjustStockMutation.isPending}
          >
            Execute Adjustment
          </AdminButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {item ? (
          <AdminInput
            label="Product SKU *"
            value={selectedProduct?.sku || ''}
            disabled
          />
        ) : selectedProduct ? (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Product *</label>
            <div className="flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-slate-50">
              <div>
                <p className="text-xs font-medium text-slate-900">{selectedProduct.name}</p>
                <p className="text-[11px] text-slate-500">{selectedProduct.sku}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-[11px] text-blue-600 hover:underline"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <AdminInput
              label="Search Product by Name or SKU *"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. DSK-ERG-01 or Ergonomic Desk"
              leftIcon={<Search className="w-3.5 h-3.5" />}
            />
            {searchTerm.trim().length >= 2 && (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {isSearching ? (
                  <p className="px-3 py-2 text-slate-400">Searching...</p>
                ) : searchResults?.products.length ? (
                  searchResults.products.map((p: Product) => (
                    <button
                      type="button"
                      key={p._id}
                      onClick={() => {
                        setSelectedProduct({ id: p._id, sku: p.sku, name: p.name });
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-xs font-medium text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-500">{p.sku}</p>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-slate-400">No matching products</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <AdminSelect
            label="Adjustment Mode *"
            value={type}
            onChange={(e) => setType(e.target.value as 'ADD' | 'SUBTRACT' | 'SET')}
            options={[
              { value: 'ADD', label: 'Receive Inbound Stock (+)' },
              { value: 'SUBTRACT', label: 'Damage / Shrinkage (-)' },
              { value: 'SET', label: 'Reconciliation Count (=)' },
            ]}
          />

          <AdminInput
            label={type === 'SET' ? 'New Physical Count *' : 'Quantity Units *'}
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Audit Reason & Note *
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Physical inventory cycle count reconciliation"
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </form>
    </AdminModal>
  );
}
