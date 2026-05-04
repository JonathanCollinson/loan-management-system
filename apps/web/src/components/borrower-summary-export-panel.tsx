'use client';

import { gql } from '@apollo/client';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import {
  downloadBorrowerSummaryXlsx,
  type BorrowerSummaryExportFilters,
} from '@/lib/borrower-summary-export-download';

const FUNDS_Q = gql`
  query BorrowerExportFunds {
    capitalFundsForFilter {
      id
      name
    }
  }
`;

const BORROWERS_Q = gql`
  query BorrowerExportBorrowers {
    borrowers {
      id
      name
    }
  }
`;

const SUMMARY_CSV_Q = gql`
  query BorrowerSummaryCsvExport(
    $month: String
    $principalFundId: String
    $borrowerIds: [String!]
    $createdFrom: String
    $createdTo: String
    $allFunds: Boolean
  ) {
    borrowerLoanSummaryCsv(
      month: $month
      principalFundId: $principalFundId
      borrowerIds: $borrowerIds
      createdFrom: $createdFrom
      createdTo: $createdTo
      allFunds: $allFunds
    )
  }
`;

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yearStartYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-01-01`;
}

function buildExportVariables(opts: {
  timeMode: 'all' | 'month' | 'range';
  monthVal: string;
  rangeFrom: string;
  rangeTo: string;
  principalFundId: string;
  borrowerIds: string[];
  exportLayout: 'combined' | 'perFund';
}): BorrowerSummaryExportFilters {
  const {
    timeMode,
    monthVal,
    rangeFrom,
    rangeTo,
    principalFundId,
    borrowerIds,
    exportLayout,
  } = opts;
  const perFund = exportLayout === 'perFund';

  let month: string | null = null;
  let createdFrom: string | null = null;
  let createdTo: string | null = null;
  if (timeMode === 'month' && monthVal) month = monthVal;
  if (timeMode === 'range') {
    createdFrom = rangeFrom || null;
    createdTo = rangeTo || null;
  }

  return {
    month,
    principalFundId: perFund ? null : principalFundId || null,
    borrowerIds: borrowerIds.length ? borrowerIds : null,
    createdFrom,
    createdTo,
    allFunds: perFund,
  };
}

export function BorrowerSummaryExportPanel() {
  const [timeMode, setTimeMode] = useState<'all' | 'month' | 'range'>('all');
  const [monthVal, setMonthVal] = useState(currentMonth);
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState(todayYmd);
  const [principalFundId, setPrincipalFundId] = useState('');
  const [exportLayout, setExportLayout] = useState<'combined' | 'perFund'>(
    'combined',
  );
  const [borrowerIds, setBorrowerIds] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { data: fundData } = useQuery<{
    capitalFundsForFilter: { id: string; name: string }[];
  }>(FUNDS_Q);
  const { data: borrowerData } = useQuery<{
    borrowers: { id: string; name: string }[];
  }>(BORROWERS_Q);
  const [loadCsv] = useLazyQuery<{ borrowerLoanSummaryCsv: string }>(
    SUMMARY_CSV_Q,
  );

  const fundOptions = fundData?.capitalFundsForFilter ?? [];
  const borrowerOptions = borrowerData?.borrowers ?? [];

  const rangeInvalid =
    timeMode === 'range' &&
    !!rangeFrom &&
    !!rangeTo &&
    rangeFrom > rangeTo;

  const vars = useMemo(
    () =>
      buildExportVariables({
        timeMode,
        monthVal,
        rangeFrom,
        rangeTo,
        principalFundId,
        borrowerIds,
        exportLayout,
      }),
    [
      timeMode,
      monthVal,
      rangeFrom,
      rangeTo,
      principalFundId,
      borrowerIds,
      exportLayout,
    ],
  );

  async function runCsv() {
    setErr(null);
    setWorking(true);
    try {
      const res = await loadCsv({
        variables: {
          month: vars.month,
          principalFundId: vars.principalFundId,
          borrowerIds: vars.borrowerIds,
          createdFrom: vars.createdFrom,
          createdTo: vars.createdTo,
          allFunds: vars.allFunds ?? false,
        },
      });
      const csv = res.data?.borrowerLoanSummaryCsv;
      if (!csv) throw new Error('No CSV returned');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date().toISOString().slice(0, 10);
      a.download = `borrower-summary-${ts}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setWorking(false);
    }
  }

  async function runXlsx() {
    setErr(null);
    setWorking(true);
    try {
      const ts = new Date().toISOString().slice(0, 10);
      await downloadBorrowerSummaryXlsx(vars, `borrower-summary-${ts}.xlsx`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setWorking(false);
    }
  }

  function applyPresetThisMonth() {
    setTimeMode('month');
    setMonthVal(currentMonth());
  }

  function applyPresetYtd() {
    setTimeMode('range');
    setRangeFrom(yearStartYmd());
    setRangeTo(todayYmd());
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Exports use the same rules as Borrower loan summary: only borrowers with
        at least one loan in the selected scope appear; amounts are based on
        loans whose <strong>created</strong> date falls in the time window.
      </p>

      <div className="flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          className="rounded border border-zinc-300 px-3 py-1 dark:border-zinc-600"
          onClick={applyPresetThisMonth}
        >
          Preset: this month
        </button>
        <button
          type="button"
          className="rounded border border-zinc-300 px-3 py-1 dark:border-zinc-600"
          onClick={applyPresetYtd}
        >
          Preset: YTD
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2 rounded border border-zinc-200 p-3 dark:border-zinc-700">
          <legend className="px-1 text-sm font-medium">Time window</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="tw"
              checked={timeMode === 'all'}
              onChange={() => setTimeMode('all')}
            />
            All time
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="tw"
              checked={timeMode === 'month'}
              onChange={() => setTimeMode('month')}
            />
            Calendar month
          </label>
          {timeMode === 'month' && (
            <input
              type="month"
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
              value={monthVal}
              onChange={(e) => setMonthVal(e.target.value)}
            />
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="tw"
              checked={timeMode === 'range'}
              onChange={() => setTimeMode('range')}
            />
            Date range (loan created)
          </label>
          {timeMode === 'range' && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
              />
              <span>to</span>
              <input
                type="date"
                className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
              />
            </div>
          )}
          {rangeInvalid && (
            <p className="text-sm text-red-600">Start date must be on or before end date.</p>
          )}
        </fieldset>

        <fieldset className="space-y-2 rounded border border-zinc-200 p-3 dark:border-zinc-700">
          <legend className="px-1 text-sm font-medium">Capital fund & layout</legend>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Fund filter</span>
            <select
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
              value={principalFundId}
              onChange={(e) => setPrincipalFundId(e.target.value)}
              disabled={exportLayout === 'perFund'}
            >
              <option value="">All funds (combined in one table)</option>
              {fundOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="layout"
              checked={exportLayout === 'combined'}
              onChange={() => setExportLayout('combined')}
            />
            <span>
              Single table (respect fund filter above). CSV / Excel match the
              on-screen summary columns.
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="layout"
              checked={exportLayout === 'perFund'}
              onChange={() => setExportLayout('perFund')}
            />
            <span>
              One section or worksheet per capital fund you can access (CSV adds
              fund columns; Excel uses multiple sheets). Ignores single-fund
              filter above.
            </span>
          </label>
        </fieldset>
      </div>

      <label className="block text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">
          Limit to borrowers (optional — hold Ctrl/Cmd to select many)
        </span>
        <select
          multiple
          className="mt-1 min-h-[7rem] w-full max-w-xl rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
          value={borrowerIds}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map(
              (o) => o.value,
            );
            setBorrowerIds(selected);
          }}
        >
          {borrowerOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={working || rangeInvalid}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          onClick={() => void runCsv()}
        >
          Download CSV
        </button>
        <button
          type="button"
          disabled={working || rangeInvalid}
          className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
          onClick={() => void runXlsx()}
        >
          Download Excel
        </button>
      </div>
    </div>
  );
}
