'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo } from 'react';

const Q = gql`
  query Borrowers {
    borrowers {
      id
      name
      phone
      address
      createdByUserId
      audience
    }
  }
`;

type Audience = 'OWNER_ONLY' | 'ALL_FIELD_USERS' | 'ADMINS_ONLY';

type Row = {
  id: string;
  name: string;
  phone?: string | null;
  address: string;
  createdByUserId: string;
  audience: Audience;
};

function audienceLabel(a: Audience): string {
  switch (a) {
    case 'ALL_FIELD_USERS':
      return 'Everyone';
    case 'ADMINS_ONLY':
      return 'Admins only';
    default:
      return 'Owner only';
  }
}

const columnHelper = createColumnHelper<Row>();

export default function BorrowersPage() {
  const { data, loading, error } = useQuery<{
    borrowers: Row[];
  }>(Q);

  const rows: Row[] = data?.borrowers ?? [];

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: (ctx) => ctx.getValue() ?? '—',
      }),
      columnHelper.accessor('address', {
        header: 'Address',
        cell: (ctx) => ctx.getValue() || '—',
      }),
      columnHelper.accessor('audience', {
        header: 'Visible to',
        cell: (ctx) => audienceLabel(ctx.getValue()),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (ctx) => (
          <Link
            className="text-blue-600 hover:underline dark:text-blue-400"
            href={`/borrowers/${ctx.row.original.id}`}
          >
            View
          </Link>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) return <p className="text-zinc-500">Loading…</p>;
  if (error) return <p className="text-red-600">{error.message}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Borrowers</h1>
        <Link
          href="/borrowers/new"
          className="rounded bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add borrower
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-3 py-2 font-medium">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
