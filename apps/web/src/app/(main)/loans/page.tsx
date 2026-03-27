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
import { useMemo, useState } from 'react';

const Q = gql`
  query LoansPage($principalFundId: String, $month: String) {
    capitalFundsForFilter {
      id
      name
    }
    loans(principalFundId: $principalFundId, month: $month) {
      id
      borrowerId
      principalFundId
      principalFundName
      principalAmount
      totalAmount
      outstandingAmount
      totalPaid
      status
      termMonths
    }
  }
`;

type Row = {
  id: string;
  borrowerId: string;
  principalFundId?: string | null;
  principalFundName?: string | null;
  principalAmount: number;
  totalAmount: number;
  outstandingAmount: number;
  totalPaid: number;
  status: string;
  termMonths: number;
};

const columnHelper = createColumnHelper<Row>();

export default function LoansPage() {
  const [principalFundId, setPrincipalFundId] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const { data, loading, error } = useQuery<{
    capitalFundsForFilter: { id: string; name: string }[];
    loans: Row[];
  }>(Q, {
    variables: {
      principalFundId: principalFundId || null,
      month: month || null,
    },
  });
  const rows: Row[] = data?.loans ?? [];
  const fundOptions = data?.capitalFundsForFilter ?? [];

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Loan',
        cell: (c) => (
          <span className="font-mono text-xs">{c.getValue().slice(-8)}</span>
        ),
      }),
      columnHelper.accessor('principalFundName', {
        header: 'Fund',
        cell: (c) => c.getValue() ?? '—',
      }),
      columnHelper.accessor('principalAmount', {
        header: 'Principal',
        cell: (c) => Number(c.getValue()).toFixed(2),
      }),
      columnHelper.accessor('totalAmount', {
        header: 'Total',
        cell: (c) => Number(c.getValue()).toFixed(2),
      }),
      columnHelper.accessor('totalPaid', {
        header: 'Paid',
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Loans</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Filter by capital fund and/or the calendar month the loan was
            created.
            {principalFundId
              ? ' Fund filter limits to loans drawn from that pool.'
              : ''}
            {month
              ? ' Month filter uses each loan’s created date.'
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Capital fund</span>
            <select
              className="min-w-[12rem] rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
              value={principalFundId}
              onChange={(e) => setPrincipalFundId(e.target.value)}
            >
              <option value="">All funds</option>
              {fundOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Month</span>
            <div className="flex items-center gap-2">
              <input
                type="month"
                className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              <button
                type="button"
                className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600"
                onClick={() => setMonth('')}
              >
                All time
              </button>
            </div>
          </label>
          <Link
            href="/loans/new"
            className="rounded bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            New loan
          </Link>
        </div>
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
