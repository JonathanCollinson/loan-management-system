'use client';

import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client/react';
import { useState } from 'react';

const REPORT = gql`
  query MonthlyReport($month: String!) {
    monthlyReport(month: $month) {
      month
      loansIssued
      principalLoaned
      repaymentsCount
      paymentsReceived
    }
  }
`;

const CSV = gql`
  query MonthlyReportCsv($month: String!) {
    monthlyReportCsv(month: $month)
  }
`;

export default function ReportsPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [loadReport, { data, loading, error }] = useLazyQuery<{
    monthlyReport: {
      month: string;
      loansIssued: number;
      principalLoaned: number;
      repaymentsCount: number;
      paymentsReceived: number;
    };
  }>(REPORT);
  const [loadCsv] = useLazyQuery<{ monthlyReportCsv: string }>(CSV);

  function run() {
    loadReport({ variables: { month } });
  }

  async function downloadCsv() {
    const res = await loadCsv({ variables: { month } });
    const csv = res.data?.monthlyReportCsv as string | undefined;
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const r = data?.monthlyReport;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Monthly reports</h1>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          Month (YYYY-MM)
          <input
            className="mt-1 block rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={run}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Load
        </button>
        <button
          type="button"
          onClick={() => downloadCsv()}
          className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
        >
          Download CSV
        </button>
      </div>
      {loading && <p className="text-zinc-500">Loading…</p>}
      {error && <p className="text-red-600">{error.message}</p>}
      {r && (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Loans issued</dt>
            <dd className="text-lg font-medium">{r.loansIssued}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Principal loaned</dt>
            <dd className="text-lg font-medium tabular-nums">
              {Number(r.principalLoaned).toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Repayments count</dt>
            <dd className="text-lg font-medium">{r.repaymentsCount}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Payments received</dt>
            <dd className="text-lg font-medium tabular-nums">
              {Number(r.paymentsReceived).toFixed(2)}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
