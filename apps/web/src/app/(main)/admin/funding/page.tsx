'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';

const LIST = gql`
  query FundingTransfers {
    fundingTransfers {
      id
      adminUserId
      recipientUserId
      amount
      note
      period
      createdAt
    }
  }
`;

const ME = gql`
  query MeFunding {
    me {
      role
    }
  }
`;

const BUDGET_SNAPSHOT = gql`
  query BudgetSnapshot($month: String!) {
    monthlyPrincipalBudget(month: $month) {
      totalPrincipal
      utilization {
        allocatedTotal
        principalLoanedTotal
        remainingVsAllocations
      }
    }
  }
`;

const UTIL = gql`
  query FundingUtilization($month: String!) {
    fundingUtilization(month: $month) {
      month
      rows {
        userId
        name
        email
        fundingAssigned
        principalLoaned
        walletBalance
      }
      totals {
        fundingAssigned
        principalLoaned
      }
    }
  }
`;

const RECORD = gql`
  mutation RecordFunding($input: RecordFundingInput!) {
    recordFunding(input: $input) {
      id
    }
  }
`;

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function FundingPage() {
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const { data: meData } = useQuery<{ me: { role: string } }>(ME);
  const isSuperAdmin = meData?.me?.role === 'SUPER_ADMIN';
  const { data: budgetData } = useQuery<{
    monthlyPrincipalBudget: {
      totalPrincipal: number;
      utilization: {
        allocatedTotal: number;
        principalLoanedTotal: number;
        remainingVsAllocations: number;
      };
    };
  }>(BUDGET_SNAPSHOT, {
    variables: { month: reportMonth },
    skip: !isSuperAdmin,
  });
  const { data, loading, refetch } = useQuery<{
    fundingTransfers: {
      id: string;
      recipientUserId: string;
      amount: number;
      note?: string;
      period?: string | null;
      createdAt: string;
    }[];
  }>(LIST);
  const { data: utilData, loading: utilLoading } = useQuery<{
    fundingUtilization: {
      month: string;
      rows: {
        userId: string;
        name: string;
        email: string;
        fundingAssigned: number;
        principalLoaned: number;
        walletBalance: number;
      }[];
      totals: { fundingAssigned: number; principalLoaned: number };
    };
  }>(UTIL, { variables: { month: reportMonth } });

  const [record, { loading: saving }] = useMutation(RECORD);

  const [recipientUserId, setRecipientUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [period, setPeriod] = useState(currentMonth);

  const utilRows = utilData?.fundingUtilization.rows ?? [];
  const utilTotals = utilData?.fundingUtilization.totals;

  const transfers = useMemo(() => data?.fundingTransfers ?? [], [data]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await record({
      variables: {
        input: {
          recipientUserId,
          amount: parseFloat(amount),
          note: note || undefined,
          period: period || undefined,
        },
      },
    });
    setRecipientUserId('');
    setAmount('');
    setNote('');
    refetch();
  }

  if (loading) return <p className="text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold">Funding</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Monthly utilization</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Recipients can be <strong>field users</strong>, <strong>admins</strong>, or{' '}
          <strong>super admins</strong>—funding credits their lendable wallet for
          the chosen period. Funding assigned counts transfers with this{' '}
          <strong>period</strong> (YYYY-MM), or legacy transfers without a period
          whose record date falls in the month. Principal loaned uses loans
          created in that month. Wallet balance is the user&apos;s current
          balance (not historical).
        </p>
        {isSuperAdmin && budgetData?.monthlyPrincipalBudget && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-950/40">
            <strong className="text-amber-900 dark:text-amber-200">
              Monthly principal budget ({reportMonth})
            </strong>
            <div className="mt-1 grid gap-1 text-amber-900/90 tabular-nums dark:text-amber-100/90 sm:grid-cols-2">
              <span>
                Ceiling: {fmt(budgetData.monthlyPrincipalBudget.totalPrincipal)}
              </span>
              <span>
                Allocated:{' '}
                {fmt(budgetData.monthlyPrincipalBudget.utilization.allocatedTotal)}
              </span>
              <span>
                Principal loaned:{' '}
                {fmt(
                  budgetData.monthlyPrincipalBudget.utilization.principalLoanedTotal,
                )}
              </span>
              <span>
                Remaining vs allocations:{' '}
                {fmt(
                  budgetData.monthlyPrincipalBudget.utilization
                    .remainingVsAllocations,
                )}
              </span>
            </div>
            <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-200/70">
              Manage CEO capital ceilings on the Capital page.
            </p>
          </div>
        )}
        <label className="inline-flex flex-col gap-1 text-sm">
          Report month
          <input
            type="month"
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
          />
        </label>
        {utilLoading ? (
          <p className="text-sm text-zinc-500">Loading utilization…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2">Field user</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Funding assigned</th>
                  <th className="px-3 py-2">Principal loaned</th>
                  <th className="px-3 py-2">Wallet (now)</th>
                </tr>
              </thead>
              <tbody>
                {utilRows.map((r) => (
                  <tr
                    key={r.userId}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.email}</td>
                    <td className="px-3 py-2 tabular-nums">{fmt(r.fundingAssigned)}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {fmt(r.principalLoaned)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {fmt(r.walletBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {utilTotals && (
                <tfoot className="border-t-2 border-zinc-300 bg-zinc-50 font-medium dark:border-zinc-600 dark:bg-zinc-900">
                  <tr>
                    <td colSpan={2} className="px-3 py-2">
                      Totals
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {fmt(utilTotals.fundingAssigned)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {fmt(utilTotals.principalLoaned)}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">—</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </section>

      <section>
        <form
          onSubmit={onSubmit}
          className="max-w-md space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="font-medium">Record funding (wallet credit)</h2>
          <p className="text-xs text-zinc-500">
            Paste the recipient&apos;s user ID. Use Funding period (YYYY-MM) to
            tag the month; required for budget checks when a monthly ceiling is
            set.
          </p>
          <input
            required
            placeholder="Recipient user ID"
            className="w-full rounded border px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={recipientUserId}
            onChange={(e) => setRecipientUserId(e.target.value)}
          />
          <input
            required
            type="number"
            step="0.01"
            placeholder="Amount"
            className="w-full rounded border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <label className="block text-sm">
            Period (YYYY-MM, optional)
            <input
              type="month"
              className="mt-1 w-full rounded border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </label>
          <input
            placeholder="Note"
            className="w-full rounded border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? 'Saving…' : 'Record funding'}
          </button>
        </form>
      </section>

      <section className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h2 className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-900">
          Transfer history
        </h2>
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Recipient</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Period</th>
              <th className="px-3 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr
                key={t.id}
                className="border-t border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-3 py-2">
                  {new Date(t.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {t.recipientUserId}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {Number(t.amount).toFixed(2)}
                </td>
                <td className="px-3 py-2">{t.period ?? '—'}</td>
                <td className="px-3 py-2">{t.note ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
