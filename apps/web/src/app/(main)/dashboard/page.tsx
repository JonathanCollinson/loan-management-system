'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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

export default function DashboardPage() {
  const { data, loading, error } = useQuery<{
    dashboard: {
      totalPrincipalLoaned: number;
      totalInterestExpected: number;
      totalOutstanding: number;
      totalCollected: number;
      activeLoansCount: number;
    };
  }>(DASH);

  if (loading) {
    return <p className="text-zinc-500">Loading dashboard…</p>;
  }
  if (error) {
    return <p className="text-red-600">{error.message}</p>;
  }

  const d = data?.dashboard;
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
}: {
  label: string;
  value: number;
  format?: 'money' | 'int';
}) {
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
