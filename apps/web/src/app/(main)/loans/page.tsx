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
  query Loans {
    loans {
      id
      borrowerId
      principalAmount
      totalAmount
      outstandingAmount
      status
      termMonths
    }
  }
`;

type Row = {
  id: string;
  borrowerId: string;
  principalAmount: number;
  totalAmount: number;
  outstandingAmount: number;
  status: string;
  termMonths: number;
};

const columnHelper = createColumnHelper<Row>();

export default function LoansPage() {
  const { data, loading, error } = useQuery<{ loans: Row[] }>(Q);
  const rows: Row[] = data?.loans ?? [];

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Loan',
        cell: (c) => (
          <span className="font-mono text-xs">{c.getValue().slice(-8)}</span>
        ),
      }),
      columnHelper.accessor('principalAmount', {
        header: 'Principal',
        cell: (c) => Number(c.getValue()).toFixed(2),
      }),
      columnHelper.accessor('totalAmount', {
        header: 'Total',
        cell: (c) => Number(c.getValue()).toFixed(2),
      }),
      columnHelper.accessor('outstandingAmount', {
        header: 'Outstanding',
        cell: (c) => Number(c.getValue()).toFixed(2),
      }),
      columnHelper.accessor('status', { header: 'Status' }),
      columnHelper.accessor('termMonths', { header: 'Months' }),
      columnHelper.display({
        id: 'a',
        header: '',
        cell: (ctx) => (
          <Link
            className="text-blue-600 hover:underline"
            href={`/loans/${ctx.row.original.id}`}
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
        <h1 className="text-2xl font-semibold">Loans</h1>
        <Link
          href="/loans/new"
          className="rounded bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          New loan
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
