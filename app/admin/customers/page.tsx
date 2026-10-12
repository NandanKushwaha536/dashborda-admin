'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useCustomers, type Customer } from '@/lib/hooks/useCustomers';
import { useDebouncedValue, useUrlParams } from '@/lib/hooks/useUrlState';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { CUSTOMER_STATUS } from '@/lib/status';
import { errorMessage, formatDate, formatINR, formatNumber } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Restricted } from '@/components/shell/Restricted';
import { Card, PageHeader } from '@/components/ui/Layout';
import { FilterBar, Pagination, SearchInput } from '@/components/ui/Navigation';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/Form';
import { StatusBadge } from '@/components/ui/StatusBadge';

const PAGE_SIZE = 20;

function NameCell({ customer }: { customer: Customer }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={customer.name} size="sm" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link href={`/admin/customers/${customer.id}`} className="font-medium text-slate-900 hover:text-indigo-700 hover:underline">
          {customer.name}
        </Link>
        <span className="truncate text-[12px] text-slate-500">{customer.email || customer.phone}</span>
      </div>
    </div>
  );
}

function CustomersView() {
  const [query, setQuery] = useUrlParams(['page', 'search', 'status'] as const);
  const page = Math.max(1, Number(query.page) || 1);
  const [searchText, setSearchText] = useState(query.search);
  const search = useDebouncedValue(searchText);

  React.useEffect(() => {
    if (search !== query.search) setQuery({ search, page: null });
  }, [search, query.search, setQuery]);

  const customers = useCustomers({ page, limit: PAGE_SIZE, search, status: query.status });
  const rows = customers.data?.customers ?? [];

  const columns: Column<Customer>[] = [
    { key: 'name', header: 'Customer', cell: (c) => <NameCell customer={c} /> },
    { key: 'phone', header: 'Phone', cell: (c) => <span className="text-slate-700">{c.phone || '—'}</span> },
    { key: 'orders', header: 'Orders', align: 'right', cell: (c) => <span className="tabular">{formatNumber(c.ordersCount)}</span> },
    { key: 'spent', header: 'Spent', align: 'right', cell: (c) => <span className="tabular font-semibold">{formatINR(c.totalSpent)}</span> },
    { key: 'joined', header: 'Joined', cell: (c) => <span className="text-slate-600">{formatDate(c.createdAt)}</span> },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge map={CUSTOMER_STATUS} value={c.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Customers"
        description="People who have an account on the store. Contact details are partly hidden for privacy."
      />
      <Card className="overflow-hidden">
        <FilterBar className="border-b border-slate-100">
          <SearchInput className="sm:flex-1" label="Search customers" placeholder="Name, email or phone" value={searchText} onChange={setSearchText} />
          <Select
            label="Status"
            containerClassName="sm:w-44"
            value={query.status}
            onChange={(event) => setQuery({ status: event.target.value, page: null })}
            placeholder="All"
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'BLOCKED', label: 'Blocked' },
            ]}
          />
        </FilterBar>
        <DataTable
          caption="Customers"
          rows={rows}
          columns={columns}
          getRowId={(c) => c.id}
          loading={customers.isLoading}
          error={customers.error ? errorMessage(customers.error) : null}
          onRetry={() => customers.refetch()}
          empty={{ title: search || query.status ? 'No customers match' : 'No customers yet', description: search ? 'Try another name, email or phone.' : 'Customers appear when they sign up on the store.' }}
          mobileCard={(c) => (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <NameCell customer={c} />
                <StatusBadge map={CUSTOMER_STATUS} value={c.status} />
              </div>
              <div className="flex justify-between text-[13px] text-slate-600">
                <span>{formatNumber(c.ordersCount)} orders</span>
                <span className="tabular font-semibold text-slate-900">{formatINR(c.totalSpent)}</span>
              </div>
            </div>
          )}
        />
        {customers.data && customers.data.total > PAGE_SIZE ? (
          <Pagination page={page} pageSize={PAGE_SIZE} total={customers.data.total} onPageChange={(next) => setQuery({ page: next })} />
        ) : null}
      </Card>
    </>
  );
}

export default function CustomersPage() {
  return (
    <Restricted permission={PERMISSIONS.USERS_READ}>
      <Suspense fallback={null}>
        <CustomersView />
      </Suspense>
    </Restricted>
  );
}
