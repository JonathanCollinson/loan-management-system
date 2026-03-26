'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

const Q = gql`
  query BorrowerLoanSummary($month: String) {
    borrowerLoanSummary(month: $month) {
      rows {
        borrowerId
        name
        phone
        address
        totalPrincipal
        totalInterest
        totalRepayable
        totalOutstanding
        borrowerStatus
        paidAt
      }
      totals {
        totalPrincipal
        totalInterest
        totalRepayable
      }
    }
  }
`;

type BorrowerStatus = 'PAID' | 'OUTSTANDING' | 'NO_LOANS';

type Row = {
  borrowerId: string;
  name: string;
  phone?: string | null;
  address: string;
  totalPrincipal: number;
  totalInterest: number;
  totalRepayable: number;
  totalOutstanding: number;
  borrowerStatus: BorrowerStatus;
  paidAt?: string | null;
};

const fmtMoney = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const statusLabel = (s: BorrowerStatus) => {
  switch (s) {
    case 'PAID':
      return 'Paid';
    case 'OUTSTANDING':
      return 'Outstanding';
    case 'NO_LOANS':
      return 'No loans';
    default:
      return s;
  }
};

const columnHelper = createColumnHelper<Row>();

function currentMonthValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function BorrowerLoanSummaryPage() {
  const [month, setMonth] = useState<string>('');
  const { data, loading, error } = useQuery<{
    borrowerLoanSummary: {
      rows: Row[];
      totals: {
        totalPrincipal: number;
        totalInterest: number;
        totalRepayable: number;
      };
    };
  }>(Q, {
    variables: { month: month || null },
  });

  const rows: Row[] = data?.borrowerLoanSummary.rows ?? [];
  const totals = data?.borrowerLoanSummary.totals;

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', { header: 'Borrower' }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: (ctx) => ctx.getValue() ?? '—',
      }),
      columnHelper.accessor('address', {
        header: 'Address',
        cell: (ctx) => ctx.getValue() || '—',
      }),
      columnHelper.accessor('totalPrincipal', {
        header: 'Principal',
        cell: (ctx) => fmtMoney(ctx.getValue()),
      }),
      columnHelper.accessor('totalInterest', {
        header: 'Interest',
        cell: (ctx) => fmtMoney(ctx.getValue()),
      }),
      columnHelper.accessor('totalRepayable', {
        header: 'Total repayable',
        cell: (ctx) => fmtMoney(ctx.getValue()),
      }),
      columnHelper.accessor('totalOutstanding', {
        header: 'Outstanding',
        cell: (ctx) => fmtMoney(ctx.getValue()),
      }),
      columnHelper.accessor('borrowerStatus', {
        header: 'Status',
        cell: (ctx) => statusLabel(ctx.getValue()),
      }),
      columnHelper.accessor('paidAt', {
        header: 'Paid at',
        cell: (ctx) => {
          const v = ctx.getValue();
          if (!v) return '—';
          return new Date(v).toLocaleString();
        },
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
          <h1 className="text-2xl font-semibold">Borrower loan summary</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Totals reflect borrowers you can access. Optionally filter loans to
            those created in a calendar month (status and paid date use that
            subset only).
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Month filter</span>
          <div className="flex items-center gap-2">
            <input
              type="month"
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder={currentMonthValue()}
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
          {totals && (
            <tfoot className="border-t-2 border-zinc-300 bg-zinc-50 font-medium dark:border-zinc-600 dark:bg-zinc-900">
              <tr>
                <td colSpan={3} className="px-3 py-2">
                  Totals
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {fmtMoney(totals.totalPrincipal)}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {fmtMoney(totals.totalInterest)}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {fmtMoney(totals.totalRepayable)}
                </td>
                <td colSpan={3} className="px-3 py-2 text-zinc-500">
                  —
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
