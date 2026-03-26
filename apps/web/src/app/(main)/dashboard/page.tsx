'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const ME = gql`
  query DashboardMe {
    me {
      role
    }
  }
`;

const DASH = gql`
  query Dashboard {
    dashboard {
      totalPrincipalLoaned
      totalInterestExpected
      totalOutstanding
      totalCollected
      activeLoansCount
    }
  }
`;

const BORROWER_SUMMARY = gql`
  query UserDashboardBorrowerSummary($month: String!) {
    borrowerLoanSummary(month: $month) {
      rows {
        borrowerStatus
      }
      totals {
        totalPrincipal
        totalInterest
        totalRepayable
      }
    }
  }
`;

function currentMonthValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function DashboardPage() {
  const { data: meData, loading: meLoading, error: meError } = useQuery<{
    me: { role: string };
  }>(ME);
  const role = meData?.me?.role;

  const { data: dashData, loading: dashLoading, error: dashError } = useQuery<{
    dashboard: {
      totalPrincipalLoaned: number;
      totalInterestExpected: number;
      totalOutstanding: number;
      totalCollected: number;
      activeLoansCount: number;
    };
  }>(DASH, {
    skip: !role || role === 'USER',
  });

  const [month, setMonth] = useState(currentMonthValue);
  const { data: summaryData, loading: summaryLoading, error: summaryError } =
    useQuery<{
      borrowerLoanSummary: {
        rows: { borrowerStatus: string }[];
        totals: {
          totalPrincipal: number;
          totalInterest: number;
          totalRepayable: number;
        };
      };
    }>(BORROWER_SUMMARY, {
      skip: !role || role !== 'USER',
      variables: { month },
    });

  if (meLoading) {
    return <p className="text-zinc-500">Loading dashboard…</p>;
  }
  if (meError) {
    return <p className="text-red-600">{meError.message}</p>;
  }

  if (role === 'USER') {
    if (summaryLoading) {
      return <p className="text-zinc-500">Loading dashboard…</p>;
    }
    if (summaryError) {
      return <p className="text-red-600">{summaryError.message}</p>;
    }

    const rows = summaryData?.borrowerLoanSummary.rows ?? [];
    const totals = summaryData?.borrowerLoanSummary.totals;
    const borrowersWithLoans = rows.filter(
      (r) => r.borrowerStatus !== 'NO_LOANS',
    ).length;

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Loan activity for the selected month (loans created in that
              calendar month).
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Month</span>
              <input
                type="month"
                className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600"
              onClick={() => setMonth(currentMonthValue())}
            >
              Current month
            </button>
            <Link
              href="/borrowers/summary"
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-blue-600 hover:underline dark:border-zinc-600 dark:text-blue-400"
            >
              Full table
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Borrowers with loans"
            value={borrowersWithLoans}
            format="int"
          />
          <StatCard
            label="Total principal"
            value={totals?.totalPrincipal ?? 0}
          />
          <StatCard
            label="Total interest"
            value={totals?.totalInterest ?? 0}
          />
          <StatCard
            label="Total with interest"
            value={totals?.totalRepayable ?? 0}
          />
        </div>
      </div>
    );
  }

  if (dashLoading) {
    return <p className="text-zinc-500">Loading dashboard…</p>;
  }
  if (dashError) {
    return <p className="text-red-600">{dashError.message}</p>;
  }

  const d = dashData?.dashboard;
  const chart = [
    { name: 'Principal loaned', value: d?.totalPrincipalLoaned ?? 0 },
    { name: 'Interest (expected)', value: d?.totalInterestExpected ?? 0 },
    { name: 'Outstanding', value: d?.totalOutstanding ?? 0 },
    { name: 'Collected', value: d?.totalCollected ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Dashboard
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Principal loaned"
          value={d?.totalPrincipalLoaned ?? 0}
        />
        <StatCard
          label="Interest (expected)"
          value={d?.totalInterestExpected ?? 0}
        />
        <StatCard label="Outstanding" value={d?.totalOutstanding ?? 0} />
        <StatCard label="Collected" value={d?.totalCollected ?? 0} />
        <StatCard
          label="Active loans"
          value={d?.activeLoansCount ?? 0}
          format="int"
        />
      </div>
      <div className="h-72 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Overview
        </h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  format = 'money',
}: Readonly<{
  label: string;
  value: number;
  format?: 'money' | 'int';
}>) {
  const display =
    format === 'int'
      ? String(Math.round(value))
      : value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {display}
      </p>
    </div>
  );
}
