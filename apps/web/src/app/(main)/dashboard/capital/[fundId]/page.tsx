'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const DETAIL = gql`
  query CapitalFundDetail($fundId: String!) {
    capitalFundDetailSummary(fundId: $fundId) {
      fundId
      fundName
      fundBalance
      totalAllocatedToFieldUsers
      principalLoaned
      totalInterestExpected
      totalOutstanding
      totalCollected
      activeLoansCount
    }
  }
`;

const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function CapitalFundDetailPage() {
  const params = useParams();
  const fundId = params.fundId as string;
  const { data, loading, error } = useQuery<{
    capitalFundDetailSummary: {
      fundId: string;
      fundName: string;
      fundBalance: number;
      totalAllocatedToFieldUsers: number | null;
      principalLoaned: number;
      totalInterestExpected: number;
      totalOutstanding: number;
      totalCollected: number;
      activeLoansCount: number;
    };
  }>(DETAIL, { variables: { fundId } });

  if (loading) return <p className="text-zinc-500">Loading…</p>;
  if (error) return <p className="text-red-600">{error.message}</p>;

  const s = data?.capitalFundDetailSummary;
  if (!s) return <p className="text-zinc-500">No data.</p>;

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-blue-600">
        ← Dashboard
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {s.fundName}
        </h1>
        <p className="font-mono text-xs text-zinc-500">{s.fundId}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Pool balance" value={s.fundBalance} />
        <StatCard
          label="Allocated to field users (total)"
          value={s.totalAllocatedToFieldUsers}
          allowNull
        />
        <StatCard label="Principal loaned (your scope)" value={s.principalLoaned} />
        <StatCard
          label="Interest (expected)"
          value={s.totalInterestExpected}
        />
        <StatCard label="Outstanding" value={s.totalOutstanding} />
        <StatCard label="Collected" value={s.totalCollected} />
        <StatCard
          label="Active loans"
          value={s.activeLoansCount}
          format="int"
        />
      </div>
      <p className="text-xs text-zinc-500">
        Metrics reflect loans you can see (field users: your loans only). Total
        allocated to field users is shown for admins only.
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  format = 'money',
  allowNull,
}: Readonly<{
  label: string;
  value: number | null;
  format?: 'money' | 'int';
  allowNull?: boolean;
}>) {
  if (allowNull && value == null) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-zinc-400">—</p>
      </div>
    );
  }
  const n = value ?? 0;
  const display =
    format === 'int'
      ? String(Math.round(n))
      : fmt(n);
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {display}
      </p>
    </div>
  );
}
