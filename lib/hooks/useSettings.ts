'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/queryKeys';

/** Store-wide settings, exactly as the backend stores them (/admin/settings). */
export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  /** Registered business details printed on customer tax invoices. */
  legalName: string;
  gstNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  invoicePrefix: string;
  currency: string;
  taxRate: number;
  lowStockThreshold: number;
  returnWindowDays: number;
  /** Orders at or above this amount (after discount) ship free. */
  freeShippingThreshold: number;
  /** Standard delivery charge (INR) for orders below the threshold. */
  defaultShippingCharge: number;
}

export const EMPTY_STORE_SETTINGS: StoreSettings = {
  storeName: '',
  supportEmail: '',
  supportPhone: '',
  legalName: '',
  gstNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  invoicePrefix: '',
  currency: 'INR',
  taxRate: 18,
  lowStockThreshold: 5,
  returnWindowDays: 7,
  freeShippingThreshold: 999,
  defaultShippingCharge: 0,
};

const text = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const number = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: async (): Promise<StoreSettings | null> => {
      const res = await api.get<{ data?: Record<string, unknown>; settings?: Record<string, unknown> }>(
        ENDPOINTS.settings.get,
      );
      const raw = res.data || res.settings;
      if (!raw) return null;
      return {
        storeName: text(raw.storeName),
        supportEmail: text(raw.supportEmail),
        supportPhone: text(raw.supportPhone),
        legalName: text(raw.legalName),
        gstNumber: text(raw.gstNumber),
        addressLine1: text(raw.addressLine1),
        addressLine2: text(raw.addressLine2),
        city: text(raw.city),
        state: text(raw.state),
        postalCode: text(raw.postalCode),
        country: text(raw.country, 'India'),
        invoicePrefix: text(raw.invoicePrefix),
        currency: text(raw.currency, 'INR'),
        taxRate: number(raw.taxRate, 18),
        lowStockThreshold: number(raw.lowStockThreshold, 5),
        returnWindowDays: number(raw.returnWindowDays, 7),
        freeShippingThreshold: number(raw.freeShippingThreshold, 999),
        defaultShippingCharge: number(raw.defaultShippingCharge, 0),
      };
    },
    staleTime: 60_000,
  });
}

/** Builds the PATCH body: trims text and leaves out fields the backend would reject when empty. */
function toUpdateBody(settings: StoreSettings): Record<string, unknown> {
  const body: Record<string, unknown> = {
    storeName: settings.storeName.trim(),
    supportPhone: settings.supportPhone.trim(),
    legalName: settings.legalName.trim(),
    gstNumber: settings.gstNumber.trim().toUpperCase(),
    addressLine1: settings.addressLine1.trim(),
    addressLine2: settings.addressLine2.trim(),
    city: settings.city.trim(),
    state: settings.state.trim(),
    postalCode: settings.postalCode.trim(),
    country: settings.country.trim(),
    currency: settings.currency,
    taxRate: settings.taxRate,
    lowStockThreshold: settings.lowStockThreshold,
    returnWindowDays: settings.returnWindowDays,
    freeShippingThreshold: settings.freeShippingThreshold,
    defaultShippingCharge: settings.defaultShippingCharge,
  };
  // These two are validated as "valid email" / "at least 1 character", so send them only when filled.
  if (settings.supportEmail.trim()) body.supportEmail = settings.supportEmail.trim().toLowerCase();
  if (settings.invoicePrefix.trim()) body.invoicePrefix = settings.invoicePrefix.trim().toUpperCase();
  return body;
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    // Backend mounts this route as router.patch('/', ...), not PUT.
    mutationFn: (settings: StoreSettings) => api.patch(ENDPOINTS.settings.update, toUpdateBody(settings)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}
